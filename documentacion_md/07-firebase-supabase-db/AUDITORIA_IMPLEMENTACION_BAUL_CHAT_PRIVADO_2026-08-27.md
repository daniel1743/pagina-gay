# Auditoría e implementación local: Baúl, avatares y chat privado

**Proyecto:** Chactivo  
**Fecha:** 27 de agosto de 2026  
**Autor:** **Manus AI**  
**Rama local:** `audit/revision-extensa-2026`

## Resumen ejecutivo

Se completó una nueva tanda de implementación local orientada a los dos problemas que seguían siendo críticos: Baúl continuaba sin un contrato funcional de interacciones y el chat privado mantenía desajustes entre sus componentes, reglas y media. El resultado es una base técnicamente más coherente, pero **Baúl continúa cerrado por diseño** hasta que se autorice una activación y un despliegue separados.

La bandera de cliente `ENABLE_BAUL` sigue en `false` y la callable de interacciones mantiene `TARJETA_INTERACTIONS_ENABLED = false`. Por tanto, el código preparado no se presenta como funcional en producción. Las pruebas realizadas demuestran compilación y contratos estáticos locales; no demuestran que Firebase, Storage, Cloudinary, Functions o Vercel remotos tengan estas versiones.

## Cambios implementados

| Área | Implementación local | Estado verificable |
|---|---|---|
| Contrato de Baúl | Especificación consolidada con intención temporal, expiración, comuna aproximada, privacidad de edad, avatar y ownership server-authoritative. | Archivo local actualizado; no desplegado. |
| Interacciones | Callable `recordTarjetaInteraction` con acciones existentes: `toggle_like`, `leave_footprint`, `record_visit`, `record_impression` y `send_message`. | Sintaxis de Functions validada; callable cerrada por flag. |
| Likes y matches | Like/unlike transaccional, match determinista por IDs ordenados, arrays acotados y notificaciones solo tras cambios reales. Al retirar el segundo like se elimina el match activo. | Contrato local; requiere Functions y Rules desplegadas para probarse realmente. |
| Huellas y métricas | Huella diaria con zona horaria `America/Santiago`, límites y deduplicación server-side. Visitas e impresiones son idempotentes y no se muestran como popularidad en la nueva tarjeta. | Contrato local; sin emulator ni producción. |
| Presencia | Nueva callable `updateTarjetaPresence`; el cliente ya no escribe directamente presencia en la tarjeta. | Código local; no desplegado. |
| Reglas de tarjetas | Se restringieron los campos de propietario y se dejaron métricas, likes y matches bajo control del backend. | Revisión estática; no se ejecutó Firebase Emulator. |
| Editor | Añadidos tipo de intención, frase, expiración, comuna aproximada y visibilidad de edad, con selección de imagen JPG/PNG/WEBP. | Incluido en build local. |
| Tarjetas | Reemplazo del diseño compacto por tarjeta mobile-first con foto grande, estado real, comuna, intención, vencimiento, frase, acciones con Hugeicons y estados honestos. | Incluido en build local; oculto mientras `ENABLE_BAUL` siga apagado. |
| OPIN | Se conserva el puente opcional preparado desde el compositor, sin duplicar publicaciones ni activar Baúl automáticamente. | Código local; requiere prueba autenticada segura para validar el flujo completo. |
| Avatar | `users.avatar` sigue siendo la fuente canónica: el espejo público se actualiza y, cuando el avatar cambia, la Function actualiza los campos visuales de la tarjeta del mismo usuario. No se hizo backfill. | Código local; la propagación existente depende de que la Function esté desplegada. |
| Chat privado | Avatar del partner hidratado desde `public_user_profiles` en tiempo real y pasado por fallback seguro. Typing movido a `private_chats/{chatId}/typing/{uid}`. | Contrato local validado; no se inspeccionó contenido personal ni se creó cuenta. |
| Fotos privadas | Frontend y Storage quedan alineados en JPG/PNG/WEBP y máximo 140 KB. La lectura de media privada exige pertenencia al chat mediante consulta Firestore desde Storage Rules. | Reglas locales; no desplegadas. |
| Imágenes rotas | Si una foto privada no responde o no contiene una URL HTTPS válida, se muestra `Imagen no disponible` en lugar de un icono roto. | Contrato incluido en el componente activo. |

## Auditoría funcional del chat privado

El flujo activo es `GlobalPrivateChatWindow` → `PrivateChatWindowV2`. `PrivateChatWindow.jsx` permanece como variante legacy y no es el componente montado por el wrapper activo. La auditoría no leyó mensajes ni perfiles personales; se revisaron únicamente contratos de código, rutas, campos y reglas.

### Flujo de creación y acceso

`socialService` genera IDs deterministas para chats directos y reutiliza el chat existente. La regla local conserva acceso de lectura solo para participantes autenticados. La creación quedó acotada a dos a cuatro participantes, timestamps y campos de estructura conocidos. Para chats directos, la regla comprueba además bloqueos bidireccionales antes de permitir una creación cliente-side.

La creación de chats todavía es cliente-side por compatibilidad con el sistema existente. Esto significa que la garantía completa depende de desplegar las Rules locales y de mantener la comprobación de bloqueo en el servicio y en las reglas. No se afirma que el entorno remoto ya aplique este contrato.

### Envío de texto, imágenes y estados

El envío optimista de texto se conserva, pero la UI elimina el mensaje optimista cuando llega el documento persistido con el mismo `clientId`. Los estados `deliveredTo`, `readBy`, `deliveredAt` y `readAt` se actualizan mediante batch y solo sobre campos permitidos.

El envío de imagen primero comprime a un máximo de 140 KB, genera una ruta bajo `chat_media/private/{uid}/{chatId}/{messageId}/{assetId}.ext`, sube el archivo y luego crea el mensaje con metadatos de media. La validación ya no acepta cualquier `image/*`: queda limitada a `image/jpeg`, `image/png` y `image/webp`. Firestore valida que el mensaje de imagen incluya una única metadata de media con ruta privada, MIME y tamaño coherentes.

### Typing y presencia

Se eliminó el desajuste entre el path que usaba el frontend y el path descrito en las reglas. El typing privado ahora usa `private_chats/{chatId}/typing/{uid}`, donde las Rules pueden comprobar que quien lee o escribe es participante del chat. La presencia pública de sala continúa en `roomPresence`; no se confundió con typing privado.

La presencia visual del partner sigue usando señales reales: estado de tarjeta cuando está disponible, actividad reciente en mensajes y typing cuando la bandera correspondiente está habilitada. No se fabrican estados, mensajes ni contadores.

### Inbox privado

La bandeja `users/{uid}/private_inbox/{chatId}` mantiene sincronización cliente-side por compatibilidad, pero las reglas locales ahora restringen estructura, preview, estados, participantes, cantidad de participantes y campos mutables. El propietario del inbox conserva la lectura y el borrado de su propio documento. Esta zona sigue siendo candidata a migración futura a una Function si se requiere una autoridad server-side más estricta.

### Avatar dentro del privado

El avatar usado por la cabecera minimizada, la cabecera expandida y el partner principal se obtiene desde `public_user_profiles` cuando el documento está disponible y pasa por `getSafeAvatarSrc`. Si el espejo no tiene avatar o la URL falla, se utiliza el fallback común. Así, el cambio de una foto de perfil no requiere cerrar y abrir el chat para actualizar la identidad visible, siempre que el espejo público esté actualizado.

## Privacidad y límites

No se habilitó GPS exacto. Baúl solo contempla comuna o ubicación textual aproximada con opt-in. No se agregaron bots, perfiles semillas, presencia falsa, mensajes sintéticos ni contadores de actividad fabricados. Tampoco se activó IA para hablar en nombre de usuarios ni se usaron mensajes o fotografías privadas para entrenamiento.

Las reglas locales de Storage ahora restringen la lectura directa de media privada a participantes del chat. Aun así, una URL de descarga con token puede ser compartida por quien ya la recibió; solucionar ese escenario requeriría una arquitectura de proxy o URLs efímeras server-side, no una simple regla cliente.

## Validación ejecutada

| Validación | Resultado |
|---|---:|
| `node --check functions/index.js` | Correcto |
| `git diff --check` | Correcto |
| `npm test` | **25 pruebas aprobadas** |
| `NODE_OPTIONS=--max-old-space-size=1200 npx vite build` | Correcto |
| Firebase Emulator Suite | No ejecutado por falta de autorización específica |
| Deploy de Functions | No ejecutado |
| Deploy de Firestore Rules | No ejecutado |
| Deploy de Storage Rules | No ejecutado |
| Prueba autenticada de Cloudinary/Firebase | No ejecutada; no se creó ni utilizó una cuenta de prueba |

## Estado local frente a producción

> **La evidencia de esta tanda es local. No debe comunicarse todavía que Baúl, el nuevo chat privado o la sincronización server-side de avatares estén activos en el sitio remoto.**

El repositorio local conserva tres commits previos no publicados y ahora contiene cambios adicionales sin push. No se modificó ningún `.env` real; el único archivo encontrado en la raíz es `.env.example`. No se ejecutaron SQL, backfill de usuarios, cambios de Cloudinary, despliegues ni mutaciones de datos de producción.

## Próximo paso seguro

El siguiente paso no es encender Baúl directamente. Primero se requiere revisar el diff local, decidir si las reglas de Storage con lectura condicionada son compatibles con el proyecto Firebase remoto y, si Daniel lo autoriza explícitamente, desplegar en una categoría aislada. La activación recomendada es: Functions y Rules, prueba con datos seguros autorizados, activación controlada de la callable, prueba autenticada y solo después `ENABLE_BAUL` para usuarios seleccionados.

La publicación en GitHub, el deploy de Firebase Functions, el deploy de Firestore Rules, el deploy de Storage Rules, Vercel, backfill, cambios de Cloudinary y cualquier SQL siguen requiriendo autorización nueva y específica.
