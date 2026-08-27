# Informe final de migración de Chactivo a Supabase-first

**Proyecto:** Chactivo  
**Rama local:** `audit/revision-extensa-2026`  
**Repositorio de trabajo:** `/home/ubuntu/chactivo_clean_recovery`  
**Fecha de revisión:** 27 de agosto de 2026  
**Autor:** **Manus AI**

> **Alcance y límite principal.** Este informe describe cambios realizados y comprobados únicamente en el código local. No declara que el SQL haya sido ejecutado, que el proyecto remoto de Supabase esté correctamente configurado, que Storage, Realtime, RLS o RPCs funcionen en producción ni que el despliegue de Vercel haya sido validado. La ejecución del SQL, la importación de usuarios históricos, el backfill de datos y cualquier cambio remoto quedan fuera de esta entrega.

## 1. Decisión arquitectónica

Chactivo queda preparado para una arquitectura **Supabase-first** cuando se activan simultáneamente `VITE_ENABLE_SUPABASE=true` y `VITE_AUTH_PROVIDER=supabase`. En esa modalidad, las altas y sesiones nuevas pasan por Supabase Auth; las tablas de aplicación, Storage, Realtime, RLS y RPCs se encaminan a Supabase. Firebase no es la fuente de nuevas escrituras funcionales en esa modalidad.

Firebase se conserva en el código como compatibilidad histórica y como ruta de fallback para instalaciones que todavía no activen ambas variables. Esto no equivale a decir que Firebase haya sido eliminado del bundle: el build aún genera un chunk `firebase-vendor` porque quedan superficies históricas y administrativas fuera del selector Supabase. El objetivo de esta etapa es impedir que esas rutas sean el backend silencioso de las nuevas funciones, no borrar de golpe el código necesario para recuperar cuentas antiguas.

Esta separación coincide con el modelo oficial de Supabase: Auth autentica y autoriza mediante tokens, y esos tokens se integran con Postgres y RLS para decidir el acceso por fila.[1] La clave publicable/anon puede vivir en el frontend, pero una service-role key no debe exponerse en el navegador ni en documentación; el backend o una función server-side es el lugar apropiado para privilegios elevados.[2]

## 2. Trabajo aplicado en local

La implementación local añadió el selector de proveedor, un `SupabaseAuthProvider`, adapters para perfiles, chat público y privado, media, presencia, OPIN, Baúl y servicios secundarios. También se añadieron migraciones versionadas `202608270001` a `202608270035`. El consolidado fue regenerado al final a partir de las 35 migraciones vigentes, por lo que ya no corresponde al consolidado antiguo que había quedado obsoleto después de 0024–0026.

| Área | Aplicación local | Estado que puede afirmarse | Dependencia pendiente |
|---|---|---|---|
| Auth nuevo | `AuthContext` selecciona Supabase cuando ambas flags están activas; `SupabaseAuthProvider` hidrata `profiles` | **Implementado y compilado localmente** | Configuración Auth/redirects y prueba con cuentas reales en Supabase |
| Perfiles/avatar | Adapter Supabase y lectura de perfiles por lote; el avatar se reutiliza en chat, privado, OPIN y Baúl | **Contrato local implementado** | Existencia de perfiles y Storage remoto, policies y datos históricos importados |
| Chat público | Insert, lectura, replies `reply_to`, fotos en Storage, URL firmada, reactions agregadas por lote y Realtime | **Implementado localmente** | Ejecutar migraciones, grants, policies, publication y probar con dos sesiones |
| Chat privado | Conversación directa por RPC, mensajes, imágenes privadas, replies, receipts por usuario, typing, solicitudes y notificaciones | **Implementado localmente** | Validar RPC/RLS/Realtime remoto y flujo con dos cuentas reales |
| OPIN | Adapter Supabase para publicaciones, comentarios, reacciones, acciones y métricas | **Routing local añadido** | Ejecutar SQL y verificar constraints/policies; no se generaron datos ficticios |
| Baúl | Adapter, media privada firmada, presencia agregada, likes deterministas y lectura de matches | **Preparado localmente, no activado** | Ejecutar/revisar 0005, 0030–0032, probar RLS/Storage; `ENABLE_BAUL=false` debe mantenerse |
| Tickets | Tablas, RPC de mensaje externo y logs; inserción directa de logs restringida a admin/RPC | **Contrato local reforzado** | Definir y probar consola administrativa Supabase; notas internas siguen sin soportarse por la RPC actual |
| Moderación/reportes | RPCs y tablas de auditoría locales; rutas Firebase retiradas en modo Supabase | **Routing local** | Pruebas reales con rol moderator/admin, sin otorgar privilegios desde el cliente |
| Eventos/rewards/badges | Tablas y RPCs locales; flags de `profiles` protegidos | **Contrato local** | Validar lógica de negocio y grants con roles reales |
| Analytics/límites | Eventos agregados y cuotas persistentes en Supabase | **Routing local** | Verificar políticas, retención y costos en el proyecto |
| Foro/Esencias/anuncios | Adapters Supabase y fallback histórico fuera del modo Supabase | **Routing local** | Confirmar tablas y UX con datos reales; anuncios vacíos devuelven `[]`, no datos simulados |
| FCM/Functions Firebase | Desactivados explícitamente en modo Supabase cuando no existe equivalente seguro | **Comportamiento honesto** | Push futuro mediante una alternativa server-side, si se decide implementarlo |
| Admin legacy | `AdminPage`, `AdminCleanup` y `AdminChatWindow` quedan bloqueados en modo Supabase para no ejecutar Firestore | **Bloqueo preventivo** | Crear una consola administrativa Supabase antes de reactivar acciones |

La tabla distingue deliberadamente entre **routing local** y **funcionamiento remoto probado**. Que un adapter exista, que Vite compile o que una policy esté escrita no demuestra que PostgREST, Storage, Realtime o la base remota estén listos.

## 3. Correcciones críticas realizadas

### 3.1 Chat público, replies y reacciones

Se corrigió el contrato de `chatService.sendMessage`: la ruta Supabase ahora espera el resultado del adapter, lanza `result.error` y devuelve únicamente `result.message`, que es la forma que espera `ChatPage`. Se añadió una prueba estática para impedir que vuelva a propagarse el wrapper `{ message, error }` al consumidor.

La migración `0027` añade `messages.reply_to` como JSONB, un índice asociado y una restricción de forma para limitar `messageId`, `username`, `content` y `type`. El adapter normaliza el reply antes de insertar y vuelve a normalizarlo al leer. La restricción no pretende comprobar que el mensaje citado siga existiendo; esa es una decisión de producto que puede añadirse después con una foreign key o una validación de misma sala.

La carga inicial de mensajes obtiene las reacciones de todos los mensajes en **una consulta por lote**, las agrupa por `message_id` y las devuelve en `message.reactions`. La suscripción Realtime rehidrata únicamente el mensaje afectado por una reacción. Esto evita el N+1 en la carga inicial; aun así, el canal actual escucha cambios de `message_reactions` sin filtro de sala porque la tabla no guarda `room_id`. Para escala alta, la siguiente mejora debería añadir una columna de sala mantenida por servidor o un canal de broadcast por sala.

### 3.2 Fotos públicas y privadas

Las fotos del chat público se suben mediante Storage Supabase como metadata de bucket, path, MIME y tamaño. El path se persiste; la URL firmada se regenera al leer o recibir el mensaje. Así no se guarda en Postgres una URL firmada que vaya a expirar.

En privados se aplicó el mismo principio con `chat-private`, incluyendo una renovación controlada en `PrivateChatWindowV2` cuando una URL firmada falla. La interfaz no promete recuperar una foto si el objeto no existe o la policy la rechaza: muestra un estado honesto.

Baúl usa ahora `card-media` como bucket privado y firma sus paths al hidratar `fotoUrl` y `fotoUrl2`. Esto corrige la contradicción previa entre un bucket declarado privado y el uso de `getPublicUrl`. Supabase documenta que Storage se controla mediante RLS en `storage.objects`; un bucket sin policies no permite uploads, y un flujo de `upsert` necesita permisos adicionales de lectura y actualización.[3]

### 3.3 Chat privado, receipts y solicitudes

`fetchMessages` agrupa todas las receipts de un mensaje en vez de quedarse con una sola fila. La forma resultante conserva `status`, `deliveredTo` y `readBy`, lo que permite distinguir el estado del emisor y de los receptores. La suscripción Realtime vuelve a consultar todas las receipts del mensaje afectado.

Las notificaciones de solicitud privada ya no confunden el ID de la notificación con el ID de `private_requests`. El adapter hidrata perfiles del actor por lote, expone `from`, `fromUsername`, `fromAvatar`, `requestId=entity_id`, `notificationId=id`, `read`, timestamps y `chatId` cuando corresponde. `ChatPage` y `NotificationsPanel` usan `requestId || entity_id` para la RPC y reservan el ID de la notificación para marcarla o eliminarla.

La migración `0034` sincroniza el estado leído de la notificación original cuando la solicitud pasa de `pending` a `accepted` o `rejected`. Los cambios se diseñaron para no leer cuerpos de chats, teléfonos ni perfiles privados durante la auditoría.

### 3.4 Protección de privilegios

La migración `0027` extiende el trigger de `profiles` más allá de `role`, `is_premium` y `verified`. También protege `is_guest`, `has_special_avatar`, `is_featured`, `is_moderator`, `is_pro_user`, `can_upload_second_photo`, `has_featured_card`, `has_rainbow_border`, `has_pro_badge`, `chat_photo_access`, `badge` y `events_participated`. El cliente puede editar sus campos públicos permitidos, pero no puede autoasignarse premium, pro, moderador, verificación, badge, acceso de fotos ni contadores.

El bypass queda limitado a `service_role`, a administradores reconocidos por la función existente o al marcador transaccional usado por la RPC legítima de participación. La autorización no depende de `user_metadata`, dado que la documentación de RLS advierte que los usuarios pueden modificar esa información; los datos de autorización deben mantenerse en un canal controlado por servidor.[2]

### 3.5 Baúl

Se añadió `set_baul_like` para que dar y quitar like sean operaciones deterministas, con lock transaccional por pareja y cálculo server-authoritative del match. Se conserva `toggle_baul_like` únicamente para consumidores heredados que realmente necesitan alternancia. También se añadieron RPCs y almacenamiento de lectura de matches, consulta de no leídos y marcado de match leído.

La presencia de tarjetas ya no se presenta como un booleano siempre falso: el adapter consulta `room_presence` por lote y deriva `estaOnline` y `ultimaConexion`. `actualizarEstadoOnline` escribe la presencia del usuario autenticado en una sala concreta. Aun así, **Baúl no se activa**: la bandera permanece `ENABLE_BAUL=false` hasta validar SQL, RLS, Storage y comportamiento con usuarios reales.

## 4. SQL preparado para ejecución manual

El archivo principal es `SQL_SUPABASE_CONSOLIDADO_ORDENADO_2026.sql`. Contiene, en orden, `202608270001`–`202608270035`. Debe considerarse un artefacto de revisión y ejecución manual, no un script ya aplicado. Las migraciones versionadas dentro de `supabase/migrations/` son la fuente de mantenimiento; el consolidado existe para facilitar la copia al SQL Editor.

Las correcciones más relevantes del tramo final son las siguientes:

| Migración | Propósito | Riesgo que cubre |
|---|---|---|
| 0027 | `reply_to` público, constraint de forma y protección completa de flags de perfiles | Replies arbitrarios y autoasignación de privilegios |
| 0028 | RPC de replies privados con validación, idempotencia y receipts | Insert directo inseguro en privados |
| 0029 | Revokes/grants de RPCs SECURITY DEFINER ya existentes | Ejecución implícita para `PUBLIC` |
| 0030 | `set_baul_like` | Toggle ambiguo y matches no deterministas |
| 0031 | Lectura/marcado de matches Baúl | Contadores de no leídos no persistentes |
| 0032 | Policies de lectura de `card-media` privado | Fotos de Baúl rotas o expuestas como públicas |
| 0033 | Hardening de `ticket_logs` | Usuarios escribiendo auditoría directamente |
| 0034 | Sincronización de notificación de solicitud | Botones pendientes después de responder |
| 0035 | Revokes y grants explícitos de tablas | Confundir RLS con privilegios de tabla |

La documentación oficial de RLS es especialmente importante para la ejecución: una policy no revoca por sí sola los grants existentes; hay que habilitar RLS, revocar permisos innecesarios y volver a conceder solo las operaciones que la aplicación requiere.[2] La migración `0035` se añadió precisamente para hacer explícita esa separación. Debe revisarse en el proyecto destino porque las tablas, roles, extensiones y policies preexistentes pueden diferir.

El SQL incorpora guards para varias policies, triggers y la publicación Realtime. Aun así, no se debe afirmar que sea reejecutable sin revisión de PostgreSQL: un consolidado de este tamaño debe probarse primero en una base de ensayo y, preferiblemente, acompañarse con pruebas pgTAP por tabla. Supabase recomienda ese tipo de pruebas para verificar allow/deny en `select`, `insert`, `update` y `delete`.[2]

## 5. Orden seguro para Daniel

Primero debe conservarse un respaldo/export de la base actual y de Storage, y debe usarse un proyecto de prueba o una ventana controlada. Después se ejecutan las migraciones en orden, una sola vez por entorno, desde `202608270001` hasta `202608270035`, o mediante el consolidado si se acepta esa modalidad. No se debe pegar una migración posterior antes de su dependencia anterior.

Luego se ejecuta `VERIFICACION_POST_MIGRACION_SUPABASE_2026.sql`. Ese archivo solo consulta metadatos: tablas, RLS, policies de Storage, buckets, publicación Realtime, RPCs, grants, columnas, índices y columnas sospechosas de claves. No consulta cuerpos de mensajes, teléfonos, emails, perfiles privados ni contenido de OPIN.

| Control posterior | Qué debe comprobar Daniel | Resultado esperado |
|---|---|---|
| Auth | Registro, login, logout y refresh con una cuenta nueva | Usuario en `auth.users` y perfil asociado en `public.profiles` |
| PostgREST/RLS | Lectura pública permitida y escritura ajena denegada | 401/403 o resultado vacío según la policy, nunca acceso cruzado |
| Storage | Upload de avatar, foto pública y foto privada | El objeto aparece en el bucket correcto; privado solo por URL firmada |
| Realtime | Dos sesiones en chat público y privado | Inserciones, reactions y receipts aparecen solo donde corresponde |
| RPCs | Solicitud privada, aceptación, reply y like de Baúl en entorno de prueba | Resultado idempotente y sin privilegios de cliente |
| Perfil | Cambiar bio/avatar y tratar de alterar un flag privilegiado | Campos públicos cambian; flags server-owned son rechazados |
| Tickets | Crear ticket y enviar respuesta externa | Se crea hilo; ningún usuario puede insertar logs arbitrarios |
| Migración histórica | Verificar solo conteos/metadatos y mapeos autorizados | No se ejecuta importación ciega ni se exponen hashes o credenciales |

La documentación oficial de Realtime exige que las tablas que se escucharán estén en la publicación `supabase_realtime`; además, las tablas deben seguir protegidas por RLS. La publication no reemplaza las policies.[4]

## 6. Migración de cuentas históricas de Firebase

Firebase queda únicamente como referencia histórica de cuentas antiguas. No se debe copiar una service-account key, hashes SCRYPT, contraseñas, tokens ni exportaciones privadas al chat, al repositorio o al frontend. El mapeo `user_migration_map` está pensado para un proceso externo y controlado por Daniel, no para que el navegador lo manipule.

Las cuentas nuevas deben registrarse directamente en Supabase Auth. Para cuentas Firebase existentes, el método de conservación de identidad depende de si Daniel dispone de un proceso administrativo seguro y de los parámetros históricos necesarios. Si no puede preservar hashes de forma segura, debe usar recuperación de contraseña o un flujo de vinculación controlado; no se debe improvisar un importador en el frontend. Supabase documenta que Auth almacena los usuarios en un esquema especial y que las tablas propias pueden relacionarse mediante triggers y referencias.[1]

## 7. Lo que no se verificó y no debe anunciarse como listo

No se verificó contra el proyecto remoto la existencia efectiva de todas las tablas, columnas, extensiones, buckets, policies, funciones o publication. Tampoco se verificó que los nombres de columnas de la base actual coincidan con los contratos locales ni que el proyecto tenga límites suficientes para el tráfico esperado. El hecho de que el archivo `.env` no exista en este worktree demuestra únicamente que no se dejó un secreto local allí; no demuestra que Vercel tenga correctamente cargadas sus variables.

No hubo ejecución SQL remota, deploy, push, PR, merge, backfill, import/export, creación de cuentas de prueba, lectura de chats privados, lectura de teléfonos ni mutación de credenciales durante esta etapa. La compilación exitosa prueba sintaxis e integración de módulos del bundle, pero no prueba Auth, PostgREST, Storage, Realtime, RLS ni RPCs contra Supabase real.

El bundle conserva un `firebase-vendor` de aproximadamente 698 KB y un chunk de aplicación grande. Esto refleja compatibilidad y superficies históricas; no se debe presentar como eliminación completa de Firebase. Las rutas administrativas legacy se bloquearon en modo Supabase porque sus adapters todavía no son equivalentes; eso es preferible a ejecutar Firestore silenciosamente.

## 8. Validación local realizada

Se ejecutó `node --check` sobre los servicios JavaScript principales, `npm test -- --run` y un build de producción con `NODE_OPTIONS=--max-old-space-size=1200 npx vite build`. La suite local terminó con **5 archivos y 41 pruebas exitosas**. El build transformó 9.462 módulos y terminó con `✓ built in 46.99s` en la ejecución final. `public/version.json` se restauró al contenido de `HEAD` después del build. También pasó `git diff --check` en la revisión final del diff rastreado.

La prueba accidental de `node --check` sobre un archivo `.jsx` no es una validación válida de JSX porque Node no reconoce esa extensión directamente; la compilación Vite sí fue la comprobación adecuada para esos componentes. No se debe contar esa invocación como una prueba exitosa independiente.

La validación estática cubre contratos de presencia de migraciones, routing Supabase, media, replies, reacciones, receipts, notificaciones, Baúl, grants y ausencia de nombres obvios de secretos. No sustituye pruebas de base de datos. El propio archivo de verificación SQL está diseñado para el paso posterior a la ejecución manual.

## 9. Estado de entrega

La entrega local queda lista para revisión de Daniel, no para una declaración de producción. El código está preparado para que Daniel configure las variables de entorno y ejecute las migraciones cuando lo autorice. La configuración esperada sigue siendo:

```env
VITE_ENABLE_SUPABASE=true
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-clave-publicable-o-anon>
```

`VITE_SUPABASE_ANON_KEY` es una variable pública del cliente, pero debe provenir del dashboard y mantenerse fuera de documentos versionados si el procedimiento interno así lo exige. No se debe poner `service_role` en `.env` del frontend, Vercel público, Git ni este informe. El cambio de flags debe hacerse coordinadamente con las migraciones y las pruebas, porque el valor predeterminado continúa siendo Firebase para evitar un corte accidental.

### Archivos principales entregados

| Archivo | Función |
|---|---|
| `documentacion_md/07-firebase-supabase-db/SQL_SUPABASE_CONSOLIDADO_ORDENADO_2026.sql` | Consolidado local de migraciones 0001–0035, no ejecutado |
| `documentacion_md/07-firebase-supabase-db/VERIFICACION_POST_MIGRACION_SUPABASE_2026.sql` | Consultas de lectura de tablas, RLS, Storage, Realtime, RPCs, grants y columnas |
| `documentacion_md/07-firebase-supabase-db/INVESTIGACION_MIGRACION_FIREBASE_SUPABASE_HALLAZGOS.md` | Este informe final reescrito |
| `supabase/migrations/202608270001_...` a `202608270035_...` | Migraciones versionadas fuente |
| `tests/supabase-migration-contract.test.js` | Contratos estáticos locales de la migración |
| `documentacion_md/07-firebase-supabase-db/FUENTES_OFICIALES_SUPABASE_NOTAS_2026.md` | Notas de las fuentes oficiales consultadas |
| `documentacion_md/07-firebase-supabase-db/INVENTARIO_RUNTIME_FIREBASE_2026.md` | Inventario final de referencias Firebase y clasificación operativa |

## Referencias

[1]: https://supabase.com/docs/guides/auth "Supabase Docs — Auth"

[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security"

[3]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Docs — Storage Access Control"

[4]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase Docs — Postgres Changes"
