# Especificación final interna: reestructuración gradual de Baúl 2026

**Proyecto:** Baúl de Chactivo  
**Estado de implementación:** backend preparado localmente, activación cerrada; `ENABLE_BAUL = false` y `TARJETA_INTERACTIONS_ENABLED = false` hasta completar pruebas.  
**Backend del MVP:** Firebase-first. No requiere SQL para esta fase y no se debe afirmar que existe una migración Supabase funcional mientras no haya esquema, RLS, adapters y pruebas equivalentes.

> **Principio de producto:** Baúl no será un clon de Tinder ni un contador de actividad. Será un espacio de descubrimiento conversable basado en intención temporal, comuna aproximada voluntaria, privacidad, perfiles reales y un puente honesto hacia OPIN y el chat privado.

## 1. Alcance y límites del MVP

El MVP permite que una persona registrada publique una tarjeta breve, defina qué busca durante un periodo acotado y reciba interacciones reales. La tarjeta puede abrir el perfil público, enlazar a OPIN y conducir al chat privado según las reglas de contacto vigentes. No se expondrán coordenadas exactas, distancias precisas ni actividad fabricada.

Quedan fuera del MVP el ranking por popularidad, los perfiles semilla, los bots, las conversaciones automáticas, los contadores promocionales, el entrenamiento de IA con datos privados, la geolocalización GPS y una migración forzada a Supabase. Las métricas de visita e impresión solo se conservarán como señales técnicas idempotentes; no deben presentarse como prueba de popularidad.

| Decisión | Contrato | Razón |
|---|---|---|
| Descubrimiento | Tarjetas profesionales, no swipe obligatorio | Mantiene lectura, accesibilidad y contexto antes de interactuar. |
| Ubicación | `comuna` o `ubicacionTexto` aproximada, opt-in | Evita exponer GPS o una dirección precisa. |
| Intención | Catálogo corto + frase + expiración | Resuelve el problema de perfiles sin contexto y reduce información obsoleta. |
| Comunicación | Chat privado existente, no un segundo sistema de mensajería | Evita duplicar bandejas y controles de seguridad. |
| Identidad | `users` como fuente propia, `public_user_profiles` como espejo público y fallbacks seguros | Permite que el avatar sea coherente en perfil, Baúl, OPIN y chats. |
| Activación | Flags separadas para lectura, interacción y exposición pública | Permite probar el backend sin abrir tráfico real prematuramente. |

## 2. Contrato de datos: `tarjetas/{uid}`

El documento mantiene campos legacy para no romper registros existentes. Los campos nuevos son los que deben usar el editor y la interfaz renovada. El ID del documento debe coincidir con el UID del propietario.

| Campo | Tipo | Propietario de escritura | Reglas y uso |
|---|---|---|---|
| `odIdUsuari` | String | Creación controlada/propietario | Debe ser igual al ID del documento. No se puede cambiar después. |
| `esInvitado` | Boolean | Backend/creación | Los invitados no pueden recibir interacciones de Baúl. |
| `nombre` | String | Propietario | Visible; longitud corta y sin HTML. |
| `edad` | Number o null | Propietario | Solo 18–99; se muestra únicamente si `mostrarEdad` es `true`. |
| `mostrarEdad` | Boolean | Propietario | Control de privacidad; por defecto `true` en compatibilidad, editable. |
| `sexo` | String | Propietario | Catálogo existente. |
| `rol` | String | Propietario | Catálogo existente. |
| `comuna` | String | Propietario | Comuna aproximada voluntaria; máximo 60 caracteres; no dirección. |
| `ubicacionTexto` | String | Propietario | Campo legacy; se conserva, pero la UI nueva prioriza `comuna`. |
| `ubicacion` | Map o null | Ningún cliente en MVP | No se usa para ordenar ni mostrar; GPS exacto permanece deshabilitado. |
| `ubicacionActiva` | Boolean | Backend/compatibilidad | Debe permanecer `false` en el flujo nuevo. |
| `bio` | String | Propietario | Máximo 200 caracteres. |
| `buscando` | String | Propietario | Legacy; se muestra como fallback si no existe intención nueva. |
| `intencion` | String | Propietario | Catálogo cerrado: `conversar`, `cita`, `amistad`, `panorama`. |
| `intencionFrase` | String | Propietario | Máximo 100 caracteres; texto visible de contexto. |
| `intencionExpiracion` | Timestamp o null | Propietario | Fecha futura limitada por el editor; una tarjeta vencida no se muestra como activa. |
| `horariosConexion` | Map | Propietario | Preferencias declaradas por el usuario, sin inferir presencia. |
| `fotoUrl` | String | Propietario o sincronización controlada | Solo URL segura HTTPS de proveedor permitido; no se imprimen URLs en logs. |
| `fotoUrlThumb` / `fotoUrlFull` | String | Propietario o sincronización controlada | Variantes opcionales; la UI usa fallback global si fallan. |
| `fotoSensible` | Boolean | Propietario | Debe provocar tratamiento visual prudente, no eliminación automática. |
| `estaOnline` | Boolean | Servicio de presencia | Estado real de presencia; nunca se fabrica desde la UI. |
| `ultimaConexion` | Timestamp o null | Servicio de presencia | Señal técnica; no equivale a disponibilidad. |
| `likesDe` | Array de UID | Solo Functions/Admin SDK | Acotado a `TARJETA_MAX_LIKES_DE`; nunca se escribe desde cliente. |
| `likesRecibidos` | Number | Solo Functions/Admin SDK | Derivado de cambios reales; nunca se incrementa desde cliente. |
| `huellasDe` | Array de claves | Solo Functions/Admin SDK | Claves `uid_YYYY-MM-DD`, acotadas; no contienen datos sensibles adicionales. |
| `huellasRecibidas` | Number | Solo Functions/Admin SDK | Derivado de huellas reales. |
| `visitasDe` / `impresionesDe` | Array de claves | Solo Functions/Admin SDK | Idempotencia y límites; no se muestran como popularidad. |
| `visitasRecibidas` / `impresionesRecibidas` | Number | Solo Functions/Admin SDK | Derivados; pueden quedar ocultos en la interfaz. |
| `actividadNoLeida` | Number | Solo Functions/Admin SDK | Se incrementa solo por eventos reales; el cliente no lo modifica. |
| `actualizadaEn` | Timestamp | Propietario/Functions | Se actualiza en cambios válidos; no se usa para fingir conexión. |

### 2.1 Campos permitidos al propietario

El cliente puede crear o actualizar solamente datos propios de perfil, intención, fotos ya validadas y preferencias visuales. En una actualización posterior se deben rechazar explícitamente cambios a `likesDe`, `likesRecibidos`, `huellasDe`, `huellasRecibidas`, `visitasDe`, `visitasRecibidas`, `impresionesDe`, `impresionesRecibidas`, `mensajesRecibidos`, `actividadNoLeida`, `estaOnline`, `ultimaConexion` y cualquier identidad de otro usuario.

La regla local ya fue ajustada para incluir `comuna`, `intencion`, `intencionFrase`, `intencionExpiracion` y `mostrarEdad` dentro del conjunto editable. Todavía falta completar validación de tipos y rangos con pruebas de reglas y, si se autoriza, con Firebase Emulator Suite.

## 3. Contrato de `recordTarjetaInteraction`

La callable usa los nombres que el cliente ya emplea. No se deben sustituir silenciosamente por `tarjeta_like` ni por otros nombres.

| Acción | Parámetros | Resultado esperado | Política |
|---|---|---|---|
| `toggle_like` | `targetUserId` | `{ success, liked, isMatch, matchData }` | Transacción sobre la tarjeta destino; reciprocidad derivada desde la tarjeta del actor; match estable con UIDs ordenados. |
| `leave_footprint` | `targetUserId` | `{ success, recorded }` | Una huella por actor, destino y día de Chile; máximo 15 por día; no se duplica. |
| `record_visit` | `targetUserId` | `{ success, recorded }` | Idempotencia por actor y destino durante la ventana definida; señal técnica, sin exposición pública. |
| `record_impression` | `targetUserId` | `{ success, recorded }` | Idempotencia diaria por actor, destino y día; no se presenta como contador social. |
| `send_message` | `targetUserId`, `payload.message` | No es el canal recomendado del MVP | Se conserva solo como contrato defensivo: nota breve sanitizada, sin datos externos, y genera actividad. La UX principal debe abrir el chat privado existente para no duplicar sistemas. |

Toda acción debe exigir una sesión registrada, tarjeta destino existente, actor distinto del destino, usuario no invitado, ausencia de bloqueo bidireccional, límites temporales y datos normalizados. Las notificaciones son posteriores a la mutación y deben describir únicamente eventos reales. Un unlike no genera notificación. Las escrituras de match y métricas pertenecen exclusivamente a Admin SDK.

El backend local quedó preparado con `assertRegisteredCallableRequest`, verificación de existencia de tarjetas, comprobación bidireccional de bloqueo, límites de frecuencia, transacciones para likes/métricas, arrays acotados y un registro técnico privado por actor. El interruptor `TARJETA_INTERACTIONS_ENABLED` permanece en `false` hasta terminar pruebas; esto es deliberado y no significa que la función esté desplegada.

## 4. Matches y actividad

Los matches se guardan en `matches/{uidA_uidB}` con UIDs ordenados, `users`, participantes sanitizados, timestamps server-side, estado y banderas de lectura. El cliente no puede crear un match ni cambiar identidades, usuarios, timestamps, estado o participantes. Solo los participantes pueden leerlo y actualizar las banderas estrechas de no leído/leído si la interfaz lo necesita.

La actividad de Baúl debe usar una subcolección del propietario de la tarjeta y contener el actor, tipo, texto corto y snapshot visual seguro. No se debe guardar una copia innecesaria de mensajes privados. Si el chat privado ya es el canal de comunicación, la actividad debe funcionar como aviso y no como segunda bandeja.

## 5. Puente con el chat privado

El CTA principal de una tarjeta debe seguir esta decisión:

1. Si el usuario todavía no puede iniciar conversación según las reglas de contacto, mostrar una solicitud o explicación honesta.
2. Si puede conversar, reutilizar `getOrCreatePrivateChat` y `sendMessageToPrivateChat`/`sendRichPrivateChatMessage` del servicio social existente.
3. No crear un sistema paralelo de notas persistentes salvo que exista una necesidad validada y una auditoría de abuso específica.
4. Aplicar los mismos bloqueos, rate limits, filtros críticos y reglas de almacenamiento que el chat privado.
5. Hacer que el avatar mostrado en la cabecera, burbuja, preview e invitación se resuelva mediante la política común `getSafeAvatarSrc` y el perfil público actualizado.

## 6. Integración con OPIN

La integración debe ser opcional, explícita y reversible. El compositor de OPIN puede ofrecer “Publicar también como intención de Baúl” solamente si el usuario está registrado y Baúl está habilitado para ese entorno. Al aceptar, se debe crear o actualizar la tarjeta propia con `intencion`, `intencionFrase`, `comuna` si ya existe y una expiración limitada; no se debe copiar automáticamente el contenido completo de una publicación pública ni convertir cada post en una tarjeta.

Desde Baúl se puede mostrar un enlace factual a publicaciones públicas recientes de OPIN del mismo autor cuando existan. No se deben inventar posts, actividad, disponibilidad ni vínculo entre perfiles. OPIN debe seguir siendo el muro de publicación; Baúl debe aportar contexto temporal y una CTA de conversación.

## 7. Avatar e identidad visual coherente

La fuente propia es `users/{uid}.avatar`. El espejo público `public_user_profiles/{uid}` debe recibir únicamente campos públicos mediante la Function existente `syncPublicUserProfileMirror`. Las tarjetas nuevas deben tomar el avatar validado al crearse y el backend debe permitir una sincronización controlada de cambios posteriores; no se debe ejecutar un backfill de usuarios existentes sin autorización explícita.

Todas las superficies deben resolver el avatar mediante la misma política: aceptar rutas locales válidas, HTTPS y data URI SVG legítimo de DiceBear; rechazar `blob:`, `javascript:`, `http:` y valores arbitrarios; ante error de carga usar `/avatar_por_defecto.jpeg`. Esta política aplica a perfil propio, perfil público, Baúl, OPIN, chat general, chat privado, previews y modales.

## 8. Interfaz profesional y filtros

La tarjeta nueva debe ser mobile-first y priorizar foto/avatar, nombre, edad solo si corresponde, comuna aproximada, intención, expiración, frase y acciones claras. Las acciones deben usar iconografía consistente, texto o tooltip accesible, foco visible y no depender de emojis como única semántica.

Los filtros iniciales son `Ahora`, `Más recientes` e intención. `Este fin de semana` solo se habilitará cuando exista un campo de disponibilidad verificable; no se debe inferir desde una frase. La interfaz debe explicar el ordenamiento y omitir estadísticas sociales si el dato no tiene valor comprobable. Los estados vacíos, errores y expiraciones deben ser honestos y ofrecer reintento.

## 9. Flags y activación gradual

| Nivel | Flag/condición | Exposición |
|---|---|---|
| 0 | `ENABLE_BAUL = false` | Estado informativo de servicio pausado; no writes automáticos. |
| 1 | Lectura local de tarjetas, callable cerrada | Prueba de contrato, editor y UI con datos seguros. |
| 2 | Callable habilitada en entorno de prueba | Likes, huellas y match con Emulator o proyecto seguro autorizado. |
| 3 | Lectura pública controlada | Cohorte pequeña, métricas técnicas y monitoreo de errores. |
| 4 | Activación general | Solo después de reglas, Functions, Storage, avatares y chat privado verificados en el proyecto real. |

Activar la bandera del frontend antes de que exista una callable desplegada y compatible es incorrecto. Cambiar el archivo local no despliega Functions ni Rules, por lo que cada informe debe distinguir prueba local, build, emulator y producción.

## 10. Criterios de aceptación

Baúl se considerará listo para una activación controlada cuando se cumpla todo lo siguiente: el build y los tests estáticos pasan; las reglas rechazan escrituras directas de métricas y matches; la callable devuelve resultados no optimistas y respeta bloqueos/límites; un like recíproco crea un único match; un unlike no envía notificación; una huella repetida el mismo día no duplica conteo; una tarjeta vencida deja de aparecer como intención activa; una foto inválida no se sube; el avatar público se refleja en las superficies conectadas; el CTA de tarjeta abre o solicita chat sin crear duplicados; el chat privado puede enviar texto e imagen bajo sus propias reglas; y se verifican logs sin exponer contenido privado, URLs sensibles, tokens ni credenciales.

No se debe afirmar que la activación es funcional en Firebase/Cloudinary hasta ejecutar pruebas contra el proyecto autorizado. La existencia de código local, una compilación exitosa o un mock de Firebase solamente demuestra integridad estática o visual.

## 11. Orden de implementación

1. Finalizar Functions y reglas, manteniendo las flags apagadas.
2. Alinear `tarjetaService` con acciones, errores, expiración y ordenamiento.
3. Rediseñar la tarjeta y el editor con intención temporal y controles accesibles.
4. Integrar el CTA de tarjeta con OPIN y el chat privado sin duplicar mensajes.
5. Completar la propagación de avatar y el auditado de media privada.
6. Añadir pruebas estáticas/unitarias y, con autorización separada, Emulator Suite.
7. Activar gradualmente en el entorno real solamente con autorización explícita para deploy y operaciones externas.

---

**Nota sobre Supabase:** el MVP de esta especificación no necesita SQL. Una migración futura debe comenzar con inventario de datos, esquema equivalente, RLS, Storage, adapters, pruebas de paridad y plan de reversión. Hasta entonces, Firebase continúa siendo el backend operativo de Baúl; no se debe dejar un frontend apuntando a Supabase sin contratos demostrados.
