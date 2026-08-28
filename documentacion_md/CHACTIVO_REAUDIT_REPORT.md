# Chactivo — Reporte único de segunda auditoría integral

**Fecha:** 27 de agosto de 2026  
**Rama local:** `audit/revision-extensa-2026`  
**Commit técnico local:** `3033dd62 fix: harden active surfaces and Supabase media`  
**Autor:** Manus AI

> **Veredicto ejecutivo:** la segunda auditoría encontró y corrigió varios fallos locales que podían hacer que Chactivo afirmara disponer de actividad, eventos, soporte o imágenes cuando esas capacidades no estaban verificadas. También se cerraron rutas Firebase residuales en superficies activas de denuncias, recompensas y previews de respuestas de OPIN. El código local compila y las suites estáticas pasan; sin embargo, **la producción y el proyecto Supabase remoto no fueron mutados ni verificados**, por lo que este informe no declara el sistema listo para producción ni confirma que Auth, Storage, RLS o Realtime estén operativos.

## 1. Alcance y límites respetados

La auditoría se realizó exclusivamente sobre el worktree local `/home/ubuntu/chactivo_clean_recovery`. Se conservaron las ramas Firebase históricas que sirven como compatibilidad o soporte administrativo, pero se reforzaron los flujos activos para que las nuevas escrituras dependan de Supabase o queden pausadas de forma visible cuando Supabase no está configurado. Se mantuvo `ENABLE_BAUL=false`.

No se ejecutó SQL remoto, no se hizo deploy, push, PR, merge, backfill, importación, modificación de Vercel, Firebase, Supabase, DNS o credenciales. Tampoco se crearon cuentas de prueba ni se inspeccionaron chats o perfiles privados. Los valores de entorno no se escribieron en el repositorio y el único archivo de entorno versionado continúa siendo `.env.example`.

| Superficie | Qué se comprobó | Resultado real |
|---|---|---|
| Código local | Cambios en lobby, media, perfiles, OPIN, denuncias, rewards y seguridad | Corregido y consolidado en `3033dd62` |
| Tests | Se ejecutó `npm test` sobre seis archivos de contrato | **58/58 pruebas pasan** |
| Build | Se ejecutó `NODE_OPTIONS=--max-old-space-size=1200 npm run build` | **Éxito**, 9.456 módulos transformados, 45,93 s, 12 rutas SEO estáticas |
| ESLint temporal | Configuración temporal con `no-undef` como error y `no-unused-vars` como warning | **0 errores, 58 warnings históricos** |
| Preview HTTP local | Rutas públicas críticas sin sesión | Todas las rutas consultadas respondieron HTTP 200 |
| Preview visual | Home, `/santiago` y `/faq` | HTML público y copy honesto visibles; la parte interactiva informó que faltaba configuración en este entorno |
| Producción | No se accedió para mutar ni certificar | **Sin verificar; conserva el estado publicado anterior** |
| Supabase remoto | No se consultó Auth, Storage, RLS, Realtime, RPC ni tablas | **Sin verificar y sin mutar** |

## 2. Correcciones implementadas

### 2.1. Lobby y superficies públicas

Se retiraron del lobby autenticado las señales que podían confundirse con actividad real: contador estático de usuarios, métrica fija de mensajes diarios, feed de actividad no verificable, listener Firebase de última actividad, testimonios, carrusel de modelos, ticker legacy, horas pico inferidas, eventos automáticos y copy de privacidad o cifrado que no estaba demostrado. El lobby ahora distingue entre una conversación real que se consulta en el flujo Supabase y una explicación pública sobre cómo participar. [1]

`GlobalStats` dejó de presentar rankings o cifras de relleno. `PeakHoursIndicator` se convirtió en un aviso neutral y ya no infiere movimiento por la hora. `RoomsModal` mantiene la navegación y las restricciones de acceso, pero muestra **“Actividad no disponible”** y pide comprobarla dentro de la sala. También se corrigió la semántica de las cards, sustituyendo contenedores con `role="button"` por botones reales.

`EventosModal` ya no presenta eventos hardcodeados, imágenes stock ni enlaces `#`. `EventoBanner` dejó de usar la agenda automática legacy y solo intenta cargar eventos cuando el flujo Supabase Auth está habilitado. Las landings de Santiago, mayores de 30, global y hetero conservan sus entradas SEO, pero ya no prometen personas conectadas, conversión, disponibilidad garantizada o volumen de usuarios que no pueda demostrarse.

### 2.2. Apoyo, Premium y denuncias

La ruta de chat anónimo se convirtió en una entrada informativa que explica límites, alias y seguridad; ya no se presenta como una sala anónima segura ni promete moderación o disponibilidad. El CTA que no tenía listener ahora navega a Auth con redirección al chat. El modal de salud mental mantiene la IA explícitamente desactivada y presenta foro y psicólogos como no disponibles; también aclara que Chactivo no es un servicio de emergencias.

Premium quedó como **“en preparación”**. Se retiraron el precio `$9.990`, el checkout, la etiqueta de popularidad y la oferta de eventos como si estuvieran activos. Esto evita cobrar o promocionar una capacidad que no está verificada.

Se detectó además que el formulario activo de denuncias todavía podía caer a Firestore aunque la dirección de producto ya era Supabase-first. `createReport` ahora solo crea denuncias en `public.reports` mediante Supabase cuando el modo Supabase está habilitado. Si no lo está, devuelve `SUPABASE_REQUIRED_FOR_REPORTS`; el modal deshabilita el envío y explica que no se mandó ningún dato. También se eliminó el claim de “denuncia anónima”, porque la auditoría local no puede asegurar anonimato técnico frente al backend.

### 2.3. Fotos, media y reflejo del avatar

Se corrigió un fallo runtime crítico: `supabaseMediaService.js` utilizaba `imageCompression` sin importarlo. El import ya está presente y el build completo lo valida a nivel de empaquetado. `photoUploadService.js` quedó Supabase-only para nuevas fotos de perfil; no usa Cloudinary ni Firebase como fallback de escritura. Si Auth/Storage no están disponibles, la interfaz informa que las fotos están pausadas en lugar de mostrar un éxito falso.

El selector de foto de perfil ahora es un `label` asociado a un `input` accesible. `PhotoUploadModal` solo muestra éxito si `updateProfile({ avatar })` retorna verdadero. El chat público permite fotos únicamente para una cuenta registrada, en la sala `principal` y con Supabase Auth habilitado. El chat privado V2 también exige Supabase y ya no cae a Firebase Storage. `ChatPage` espera un identificador persistido antes de confirmar el envío de una imagen, evitando el toast “Foto enviada” cuando la escritura no fue confirmada.

El avatar vigente se normaliza en perfil propio, perfiles públicos, tarjetas OPIN, chat y Baúl. Las URLs rotas usan fallback seguro de inicial; una métrica ausente se representa como `—`, no como cero inventado. El mapper de Baúl prioriza el avatar actual de `profiles.avatar_url` cuando la tarjeta no tiene media propia, mientras que una foto específica de la tarjeta conserva prioridad cuando sí existe. [2]

### 2.4. OPIN y migración efectiva de rutas visibles

El feed principal de OPIN ya tenía un servicio Supabase, pero se encontró una ruta residual: los previews inline de respuestas seguían leyendo `opin_comments` desde Firestore. `getReplyPreview` y `getRecentReplyPreview` ahora delegan en `supabaseOpinService` cuando el modo Supabase está activo. El servicio Supabase hidrata posts y respuestas con `profiles.avatar_url`, por lo que una URL histórica rota no tiene que permanecer en la tarjeta visible.

La tarjeta OPIN conserva reacciones como claves de datos, pero la interfaz usa Hugeicons y etiquetas como **Apoyo**, **Química** y **Favorito**, en lugar de presentar únicamente emoticones como iconografía. No se añadieron bots, seeds, perfiles, mensajes ni testimonios sintéticos.

### 2.5. Cierre de fallos de runtime y Firebase residual

La revisión global detectó tres fallos adicionales: `ga4Service.js` usaba `process.env.NODE_ENV` en navegador/Vite; `rewardsService.js` llamaba `increment()` sin importarlo; y `humanize.js` contenía un error de sintaxis en `getDoubleMess ageDelay`. GA4 ahora usa `import.meta.env.DEV`, rewards importa `increment`, y la utilidad de humanización fue eliminada al confirmar que no tenía consumidores fuera de sí misma. Esa utilidad simulaba mensajes de bots y no debía mantenerse como canal reutilizable.

También se encontró que `RewardInboxListener` podía suscribirse a recompensas Firestore aun cuando Supabase Auth estaba activo. Ahora sale inmediatamente en modo Supabase-first, y la persistencia de `rewardModalSeenIds` solo queda dentro de la rama histórica Firebase. De modo equivalente, las denuncias nuevas y los previews de OPIN ya no tienen fallback silencioso hacia Firestore en el flujo activo. Las ramas legacy restantes no se presentaron como migradas ni se ejecutaron contra el backend remoto.

## 3. Matriz funcional honesta

| Función | Estado del código local | Dependencia aún no certificada |
|---|---|---|
| Chat público | Supabase-first; propaga el error de persistencia y confirma el ID del mensaje | Auth, `messages`, RLS, Realtime y configuración efectiva |
| Foto pública en chat | Supabase-only, registrada y limitada a `principal` | Auth, bucket/policies y límites de Storage |
| Foto privada | Supabase-only en `PrivateChatWindowV2` | Auth, RPC/conversaciones, bucket privado y RLS |
| Avatar de perfil | Upload y render con fallback seguro | Auth, bucket de avatars y política de escritura/lectura |
| OPIN | Feed, posts, comentarios y previews con servicio Supabase | Tablas, RPC, RLS y perfiles existentes |
| Denuncias | Supabase-only; formulario pausado si falta configuración | `public.reports`, RLS y flujo de moderación |
| Eventos | Sin agenda ficticia; solo consulta Supabase en condiciones válidas | `public.events`, RLS y datos reales |
| Rewards | No lee/escribe Firestore cuando Supabase está activo | Migración funcional de rewards si se decide reactivarlos |
| Baúl | **Pausado por `ENABLE_BAUL=false`** | Pruebas reales de tablas, Storage, RLS, RPC y Realtime |
| Premium | Informativo; no hay checkout ni precio activo | Producto, cobro y validación legal/operativa |

> Que el código tenga una rama Supabase y que el build pase **no demuestra** que las tablas, políticas, buckets, RPC o usuarios estén configurados en el proyecto remoto. La auditoría no vuelve a afirmar eso.

## 4. Evidencia de QA local

La suite final ejecutó seis archivos: `public-surface-contract.test.js`, `cards-service-contract.test.js`, `avatar-and-media-contract.test.js`, `supabase-migration-contract.test.js`, `safety-and-local-services.test.js` y `firestore.rules.static.test.js`. El resultado fue **6 archivos aprobados y 58 pruebas aprobadas**. Se agregaron contratos para proteger el estado honesto del lobby, los controles semánticos, la ausencia de eventos sintéticos, los uploads Supabase-only, la confirmación de persistencia de fotos, el reflejo de avatar, las denuncias Supabase-only, el bloqueo de rewards legacy en modo Supabase y los previews de OPIN. [3]

El build transformó 9.456 módulos y generó 12 rutas SEO estáticas en 45,93 segundos. El bundle sigue siendo pesado: el chunk de `App` quedó en aproximadamente 1.911 KB, el vendor Firebase en aproximadamente 691 KB, `ChatPage` en aproximadamente 357 KB y `AdminPage` en aproximadamente 613 KB. Esto no bloquea la corrección funcional local, pero queda como deuda de rendimiento para una fase separada y no destructiva.

El análisis ESLint temporal terminó con **0 errores** y **58 warnings** de `no-unused-vars`. Los warnings son históricos y están repartidos en componentes y servicios legacy; no se presenta el lint como limpio. No existe un script oficial `npm run lint` en el repositorio, por lo que esta cifra corresponde solamente al config temporal utilizado para detectar `no-undef` y errores de parseo.

El preview local respondió HTTP 200 para `/`, `/global`, `/santiago`, `/mas-30`, `/faq`, `/anonymous-chat`, `/premium`, `/hetero`, `/baul`, `/normas-comunidad` y los tres documentos legales. La home, Santiago y FAQ mostraron títulos, enlaces y copy públicos correctos. En el entorno local sin variables efectivas ni sesión, el shell React mostró un fallback explícito: **“La parte interactiva no pudo iniciar en este entorno. La información pública sigue disponible.”** Esto valida el comportamiento de degradación pública, pero no equivale a una prueba de autenticación o de almacenamiento.

Las rutas SEO estáticas generadas conservaron canonical y `index, follow` para las landings previstas. `/global` no tiene un directorio estático independiente porque se sirve mediante el shell SPA/canonical de la home; Premium, Baúl, chat y perfiles dependen de metadata runtime/noindex o de sus guards, no de una promesa de indexación pública.

## 5. Estado de producción y de Supabase remoto

**Producción no fue desplegada ni comprobada.** Por tanto, los cambios de este commit todavía no pueden verse en `chactivo.com` hasta un deploy autorizado. La auditoría local no usa el resultado del preview para afirmar que Vercel, Firebase Auth, Supabase Auth o Storage estén conectados.

**Supabase remoto no fue consultado ni mutado.** No se ejecutó SQL, no se validaron tablas, no se validaron policies, no se probó ningún bucket, RPC, Realtime, Auth o sesión real. Las cuatro condiciones que el selector local considera efectivas para Supabase Auth son `VITE_ENABLE_SUPABASE=true`, `VITE_AUTH_PROVIDER=supabase`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; no se imprimieron valores ni se creó un `.env` local. La ausencia de estas condiciones debe producir estados pausados, no un éxito simulado.

No se entrega SQL en este reporte. La siguiente acción sobre migraciones queda deliberadamente pendiente de las indicaciones de Daniel y de una validación remota separada.

## 6. Riesgos y trabajo pendiente, sin ocultarlos

Persisten módulos Firebase legacy porque retirarlos masivamente podría romper compatibilidad, administración o datos históricos. Entre ellos están partes de `PrivateChatWindow.jsx`, servicios administrativos, analytics históricos, presence, moderation y adaptadores de OPIN/Baúl. La superficie privada global activa usa `PrivateChatWindowV2`; la presencia y los principales servicios migrados seleccionan Supabase cuando el flag está habilitado. Aun así, la existencia de código legacy no debe confundirse con una migración completa certificada.

También permanecen 58 warnings de variables no utilizadas, bundles grandes y funciones informativas que todavía dicen “próximamente”. Esos puntos no se maquillaron como funcionalidad lista. Baúl continúa pausado expresamente para evitar una experiencia que dependa de SQL/Storage/RLS no probados. Las fotos, denuncias y otras funciones Supabase quedarán visibles solo cuando el selector local permita el flujo; la ejecución real seguirá dependiendo del estado del proyecto remoto.

## Referencias locales

[1]: ../src/pages/LobbyPage.jsx "Lobby y superficies públicas"
[2]: ../src/services/supabaseMediaService.js "Media Supabase y compresión"
[3]: ../tests/public-surface-contract.test.js "Contratos de superficies públicas"
[4]: ../tests/avatar-and-media-contract.test.js "Contratos de avatar y media"
[5]: ../tests/supabase-migration-contract.test.js "Contratos de migración Supabase"
[6]: ../src/config/supabase.js "Selector local de Supabase Auth"
[7]: ../src/services/opinService.js "Adaptador OPIN y previews Supabase"
[8]: ../src/services/reportService.js "Denuncias Supabase-only"
