# Auditoria Profunda Post Reduccion Costos 2026-04-27

## Objetivo

Dejar un inventario riguroso de:

- lo que **quedo implementado** en el plan de reduccion,
- lo que **sigue generando costo real** hoy,
- lo que **puede volver a generar costo** aunque este pausado, desactivado o solo viva en codigo,
- y lo que **ya no deberia cobrar** porque fue retirado de produccion.

---

## Veredicto ejecutivo

Despues de `P0 + P1 + P2`, `Chactivo` sigue teniendo costo sobre todo por:

1. `Firestore realtime`
2. `Cloud Functions` que siguen activas
3. `Hosting/egress`
4. `Storage` de media de chat

Lo importante es esto:

- el producto **si bajo costo estructural**
- el gasto ya no viene tanto de piezas promocionales o derivadas que se recortaron
- pero **el nucleo chat + privados + presencia + notificaciones** sigue siendo costoso por naturaleza

La conclusion correcta hoy es:

> `Chactivo ya no esta tan cargado por basura periferica; ahora el costo residual viene sobre todo del nucleo realtime que sigue vivo.`

---

## 1. Lo que quedo implementado

## P0 aplicado

### Presencia mas austera

Archivos:

- `src/services/presenceService.js`
- `src/pages/ChatPage.jsx`

Cambio real:

- `subscribeToRoomUsers` quedo limitado a `60` usuarios recientes
- heartbeat de presencia subio a `8` minutos
- `cleanInactiveUsers` quedo neutralizado
- typing global sigue deshabilitado

Impacto:

- menos lecturas por presencia
- menos escrituras por heartbeat
- menos churn por snapshots de sala

### Privados mejor acotados

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/chat/PrivateChatWindowV2.jsx`

Cambio real:

- `private_inbox` y `private_match_state` solo se escuchan cuando la superficie privada esta realmente activa
- si la pagina no esta visible, no se mantiene esa escucha
- se saco un listener adicional del partner en privado y se dejo en lectura puntual

Impacto:

- baja el realtime privado pasivo
- evita listeners vivos por ventanas que no estan en uso real

## P1 aplicado

### Notificaciones recortadas por allowlist

Archivo:

- `src/services/userNotificationDispatchService.js`

Cambio real:

- solo se permite:
  - `direct_message`
  - `private_chat_request`
  - `private_chat_request_response`
  - `private_chat_reopened`
  - `private_group_invite_request`
  - `private_group_invite_rejected`
  - `private_group_chat_ready`

Todo lo demas queda en:

- `skipped: true`
- `reason: disabled_for_cost_control`

### Baul en runtime apagado

Archivos:

- `src/config/featureFlags.js`
- `src/services/tarjetaService.js`

Estado:

- `ENABLE_BAUL = false`

Efecto real:

- no se ejecuta `recordTarjetaInteraction`
- no se cargan tarjetas desde las rutas protegidas por ese flag
- no se actualiza `estaOnline/ultimaConexion` del Baul desde flujo normal si Baul esta apagado

### Comentarios de perfil y similares dejan de notificar

Archivo:

- `src/services/socialService.js`

Efecto:

- ya no se intentan notificaciones sociales opcionales fuera del allowlist

## P2 aplicado

### Historial admin ya no depende de Storage legacy

Archivos:

- `functions/index.js`
- `src/components/admin/AdminRoomHistoryPanel.jsx`
- `src/services/adminRoomHistoryService.js`

Cambio real:

- `generateAdminRoomHistoryReport` dejo de leer `admin-room-history` desde `Storage`
- ahora consulta una ventana corta de mensajes desde Firestore
- se elimino la function `cleanupAdminRoomHistoryArchive`

Impacto:

- menos lecturas de `Storage`
- menos scheduler residual
- menos probabilidad de ruido `ReadObject FAILED_PRECONDITION`

---

## 2. Lo que sigue cobrando hoy de verdad

## A. Firestore que cobra hoy

## 1. Chat publico realtime

Archivo principal:

- `src/services/chatService.js`

Ruta:

- `rooms/{roomId}/messages`

Hecho tecnico:

- `subscribeToRoomMessages` usa `onSnapshot`
- sigue escuchando mensajes en tiempo real
- usa `limit(messageLimit)` y cache local, lo que mejora mucho, pero sigue siendo un listener central del producto

Veredicto:

- **cobra hoy**
- **es indispensable**

## 2. Presencia de sala

Archivos:

- `src/services/presenceService.js`
- `src/pages/ChatPage.jsx`
- `src/pages/ChatSecondaryPage.jsx`

Rutas:

- `roomPresence/{roomId}/users/{userId}`

Hecho tecnico:

- cada usuario escribe presencia al entrar/salir
- se sigue usando `subscribeToRoomUsers`
- `updateUserActivity` sigue haciendo `setDoc(..., merge: true)` para `lastSeen`

Aunque esta recortado:

- sigue existiendo costo de lecturas por snapshot
- sigue existiendo costo de escrituras por presencia

Veredicto:

- **cobra hoy**
- **es uno de los centros de costo que quedan**

## 3. Privados realtime

Archivos:

- `src/services/socialService.js`
- `src/components/chat/PrivateChatWindowV2.jsx`
- `src/components/chat/GlobalPrivateChatWindow.jsx`
- `src/pages/ChatPage.jsx`

Rutas:

- `users/{uid}/private_inbox`
- `users/{uid}/private_match_state`
- `private_chats/{chatId}/messages`

Hecho tecnico:

- `subscribeToPrivateInbox` y `subscribeToPrivateMatchState` siguen usando `onSnapshot`
- `PrivateChatWindowV2` sigue usando `onSnapshot` para mensajes del chat privado activo
- la mejora ya aplicada es que no todo queda siempre vivo

Veredicto:

- **cobra hoy**
- **ya esta mas controlado**
- **sigue siendo una fuente real de lecturas**

## 4. Notificaciones en UI

Archivos:

- `src/services/systemNotificationsService.js`
- `src/components/layout/Header.jsx`
- `src/components/notifications/SystemNotificationsPanel.jsx`

Ruta:

- `systemNotifications`

Hecho tecnico:

- hay `onSnapshot` compartido por usuario
- el header puede mantener esa suscripcion viva
- el panel tambien la usa

Veredicto:

- **cobra hoy**
- **moderado**
- **no es el centro principal, pero si una capa realtime activa**

## 5. Admin realtime

Archivos:

- `src/pages/AdminPage.jsx`
- `src/services/analyticsService.js`
- `src/services/ticketService.js`
- `src/services/sanctionsService.js`
- `src/services/rewardsService.js`
- `src/services/topParticipantsService.js`

Hecho tecnico:

- admin mantiene listeners para stats del dia, tickets, sanciones y recompensas
- algunos paneles admin agregan listeners extra
- `AdminTopParticipantsPanel` puede escuchar overrides y datos derivados

Veredicto:

- **cobra cuando admin esta abierto**
- **no es costo de usuario final, pero si costo real**

## 6. Busquedas y lecturas puntuales pesadas

Servicios con `getDocs/getDoc` que siguen pudiendo pesar:

- `src/services/userService.js`
- `src/services/ticketService.js`
- `src/services/reportService.js`
- `src/services/opinService.js`
- `src/services/forumService.js`
- `src/services/eventosService.js`
- `src/services/rewardsService.js`
- `src/services/adminFeaturePulseService.js`

No todos cobran siempre.

Pero:

- si se abren pantallas admin o modales ricos
- si se buscan usuarios
- si se navega OPIN, foro o eventos

entonces siguen generando lecturas puntuales.

Veredicto:

- **cobran por uso**
- **no todos son nucleo**

---

## B. Cloud Functions que siguen cobrando hoy

Estas functions siguen desplegadas en produccion al momento de la auditoria:

- `backfillPublicUserProfiles`
- `cleanupPrivateChatMessageMedia`
- `cleanupRoomMessageMedia`
- `createModerationIncidentAlert`
- `dispatchUserNotification`
- `enforceCriticalPrivateChatSafety`
- `enforceCriticalRoomSafety`
- `enforceRoomRetention`
- `enforceRoomRetentionScheduled`
- `generateAdminRoomHistoryReport`
- `getFavoriteAudienceCount`
- `getPrivateChatSharedContacts`
- `notifyOnMatch`
- `notifyOnOpinReply`
- `notifyOnPrivateChatRequest`
- `recordTarjetaInteraction`
- `syncPublicUserProfileMirror`

## Clasificacion real

### Indispensables o casi indispensables

- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `cleanupRoomMessageMedia`
- `cleanupPrivateChatMessageMedia`
- `enforceRoomRetention`
- `enforceRoomRetentionScheduled`

Motivo:

- seguridad
- retencion del chat
- limpieza de media huerfana

### Activas pero con costo por producto

- `dispatchUserNotification`
- `notifyOnMatch`
- `notifyOnOpinReply`
- `notifyOnPrivateChatRequest`
- `syncPublicUserProfileMirror`
- `generateAdminRoomHistoryReport`

Motivo:

- siguen participando en flujos visibles
- aunque ya recortadas, siguen siendo invocables o disparadas por eventos

### Activas pero con costo latente bajo o manual

- `backfillPublicUserProfiles`
- `createModerationIncidentAlert`
- `getFavoriteAudienceCount`
- `getPrivateChatSharedContacts`
- `recordTarjetaInteraction`

Motivo:

- algunas son manuales
- algunas dependen de flujos muy concretos
- `recordTarjetaInteraction` sigue desplegada aunque `Baul` esta apagado en runtime

Veredicto:

- **Functions sigue cobrando hoy**
- **ya no por las functions basura que se retiraron**
- **ahora el costo esta mucho mas concentrado en seguridad, notificaciones y espejo publico**

---

## C. Storage que sigue cobrando hoy

## 1. Media de chat publico

Archivo:

- `src/components/chat/ChatInput.jsx`

Hecho tecnico:

- sube archivos con `uploadBytes`
- obtiene URL con `getDownloadURL`

Ruta:

- `chat_media/rooms/...`

## 2. Media de chat privado

Archivo:

- `src/components/chat/PrivateChatWindowV2.jsx`

Hecho tecnico:

- sube archivos con `uploadBytes`
- obtiene URL con `getDownloadURL`

Ruta:

- `chat_media/private/...`

## 3. Borrado de media

Archivo:

- `src/services/chatService.js`

Hecho tecnico:

- `deleteMessageWithMedia`
- borrados bulk
- `deleteObject(...)`

Veredicto:

- **Storage sigue cobrando hoy**
- pero principalmente por media activa de chat
- no por `admin-room-history`, que ya salio del flujo vivo

---

## D. Hosting y egreso

Aunque no fue el foco principal del plan, sigue existiendo costo por:

- servir JS/CSS de la app
- imágenes
- avatares
- media descargada

Especialmente:

- `ChatPage`
- bundles admin
- media de chat

Veredicto:

- **cobra hoy**
- **no fue el principal problema auditado**
- **pero sigue siendo costo real de trafico**

---

## E. Infra residual que aun puede cobrar

## Artifact Registry / GCR

Quedo un warning real del CLI:

- limpieza incompleta de imagenes build antiguas

Eso no rompe el producto, pero:

- **puede dejar un costo residual pequeño**

Estado:

- pendiente limpieza manual en GCR/Artifact Registry

---

## 3. Lo que puede generar costo aunque hoy este pausado o controlado

## A. Baul apagado por flag, pero no muerto

Archivo:

- `src/config/featureFlags.js`

Estado:

- `ENABLE_BAUL = false`

Pero sigue existiendo codigo en:

- `src/services/tarjetaService.js`
- `src/pages/BaulPage.jsx`
- `src/components/baul/*`
- `src/hooks/useEngagementNudge.js`
- `src/pages/ChatPage.jsx`
- `src/pages/LobbyPage.jsx`

Y sigue desplegada la callable:

- `recordTarjetaInteraction`

Lectura correcta:

- **no deberia cobrar fuerte hoy**
- **pero puede volver a cobrar si se enciende el flag o si alguna ruta residual lo llama**

## B. Typing privado

Archivo:

- `src/config/featureFlags.js`

Estado:

- `ENABLE_PRIVATE_TYPING = false`

Archivo afectado:

- `src/components/chat/PrivateChatWindowV2.jsx`

Lectura correcta:

- hoy esta apagado
- si se reactiva, suma writes y realtime innecesario

## C. Bot engine

Archivos:

- `src/services/botEngine.js`
- `src/components/admin/BotControlPanel.jsx`

Hecho tecnico:

- usa `onSnapshot` sobre `roomPresence`
- registra presencia de bots
- envia mensajes de bot

Estado:

- solo para `admin-testing`
- manual

Lectura correcta:

- **no es costo central hoy**
- **si se usa, genera costo real**
- **si se expande fuera de admin-testing, vuelve a ser una fuente seria de gasto**

## D. Top participants realtime

Archivo:

- `src/services/topParticipantsService.js`

Hecho tecnico:

- puede abrir tres listeners a la vez:
  - participantes
  - presencia
  - mensajes

Estado:

- depende de paneles admin/publicos especificos

Lectura correcta:

- **no siempre cobra**
- **pero cuando se monta, es un bloque realtime caro**

## E. Activity dashboard

Archivos:

- `src/components/dashboard/ActivityDashboardModal.jsx`
- `src/services/activityService.js`
- `src/components/layout/Header.jsx`

Hecho tecnico:

- el modal existe para usuarios registrados
- `activityService` hace lecturas amplias de `rooms`, `messages` y `private_chats`

Lectura correcta:

- **costo por uso**
- **si se usa mucho, puede ser caro**

## F. Admin cleanup / herramientas de mantenimiento

Archivos:

- `src/pages/AdminCleanup.jsx`
- `src/utils/cleanupSpamMessages.js`
- `src/utils/chatDiagnostics.js`
- `src/utils/adminDebugger.js`

Lectura correcta:

- no son costo basal de producto
- pero si alguien los ejecuta, hacen lecturas y/o barridos intensos

## G. Historial admin por callable

Archivos:

- `src/services/adminRoomHistoryService.js`
- `src/components/admin/AdminRoomHistoryPanel.jsx`
- `src/components/admin/AdminAIInsightsPanel.jsx`
- `functions/index.js`

Estado:

- ya no toca `Storage`
- pero sigue usando una callable que lee una ventana de Firestore

Lectura correcta:

- **costo por uso admin**
- **mucho mas razonable que antes**

---

## 4. Lo que existe en codigo pero hoy no deberia cobrar

## A. Functions retiradas de produccion

Retiradas:

- `notifyOnNewMessage`
- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `trackAnalyticsEvent`
- `archiveRoomMessageForAdminHistory`
- `syncPhotoPrivilegeFromPresence`
- `revokePhotoPrivilegeForInactivity`
- `cleanupAdminRoomHistoryArchive`

Estado:

- no deberian cobrar hoy
- solo quedan rastros o comentarios en codigo/documentacion

## B. Analytics callable antigua

Archivo:

- `src/services/analyticsService.js`

Estado:

- `ANALYTICS_CALLABLE_ENABLED = false`

Lectura correcta:

- `track()` sigue existiendo en muchas pantallas
- pero la parte Firebase callable queda anulada
- eso hace que **ya no haya costo fuerte por esa ruta en Functions**

## C. Listeners comentados

Se detectaron listeners comentados en:

- `src/pages/LobbyPage.jsx`
- `src/pages/LobbyPage.new.jsx`
- `src/components/lobby/GlobalStats.jsx`
- `src/components/lobby/RoomsModal.jsx`
- partes comentadas de `ChatPage.jsx`

Lectura correcta:

- **comentado no cobra**
- pero hay que incluirlo porque refleja decisiones previas de arquitectura que podrian volver

## D. Archivos backup o alternativos

Detectados:

- `src/pages/ChatPage.backup.jsx`
- `src/components/chat/PrivateChatWindow.jsx`
- `src/services/photoUploadService.BACKUP.js`
- `src/services/presenceService.js.disabled`

Lectura correcta:

- no cobran hoy por si mismos
- pero son riesgo de reintroduccion de patrones mas caros si alguien los revive sin revisar

---

## 5. Lo que sigue siendo sensible aunque ya este recortado

## 1. `dispatchUserNotification`

Estado:

- vive en produccion
- ya tiene allowlist

Riesgo:

- si se vuelve a abrir el allowlist o se agregan microeventos, el costo sube otra vez

## 2. `syncPublicUserProfileMirror`

Estado:

- sigue desplegada
- ya se le saco ruido en algunos campos volatiles

Riesgo:

- cualquier escritura amplia sobre `users/{uid}` puede seguir disparandola

## 3. `recordTarjetaInteraction`

Estado:

- sigue desplegada
- Baul apagado en runtime

Riesgo:

- si Baul vuelve y se enciende sin control, el costo sube rapido

## 4. `enforceRoomRetentionScheduled`

Estado:

- sigue activa cada `15` minutos

Lectura correcta:

- es defendible porque protege tamaño de sala
- pero sigue siendo scheduler vivo y por tanto costo basal

---

## 6. Resumen por categoria de costo post-recorte

## Cobra hoy seguro

- listener de mensajes del chat publico
- presencia de sala
- privado realtime cuando hay chat activo
- inbox y match-state cuando la superficie privada esta activa
- notificaciones UI
- functions de seguridad, retencion, notificaciones y espejo publico
- media real de chat en Storage
- hosting/egress

## Cobra solo si se usa una superficie concreta

- admin analytics
- historial admin
- tickets/sanciones/recompensas
- activity dashboard
- top participants
- eventos/foro/opin/busquedas

## Puede volver a cobrar si se reactiva

- Baul
- typing privado
- bot engine
- listeners comentados viejos
- backups y variantes antiguas

## Ya no deberia cobrar

- functions retiradas en fases previas
- analytics callable antigua
- historial admin basado en Storage

---

## 7. Conclusiones finales

### Que quedo bien resuelto

- se corto casi toda la periferia cara que no era nucleo
- se saco el historial admin legacy de Storage
- se bajaron varias functions de alto ruido
- se limito parte importante del realtime privado y de presencia

### Que sigue costando de verdad

- el nucleo realtime de chat
- la presencia
- privados cuando estan en uso
- functions activas de negocio real

### Que sigue siendo el mayor riesgo arquitectonico

- que vuelvan a encenderse piezas dormidas sin control:
  - Baul
  - bots
  - typing
  - fan-out de notificaciones
  - listeners amplios en lobby/admin

### Frase final correcta

`Despues de los recortes, Chactivo ya no esta siendo drenado principalmente por features accesorias; lo que sigue cobrando es el nucleo realtime real del producto y algunos modulos admin/manuales que todavia existen alrededor.`
