# Auditoria Final Costos Chactivo 2026-04-27

## Diagnostico final

Despues de `P0 + P1 + P2`, `Chactivo` ya no esta drenado principalmente por piezas promocionales, analytics callable, historial admin en Storage ni functions basura de alto ruido.

El costo residual real quedo concentrado en:

1. `Firestore realtime` del nucleo
2. `Cloud Functions` de negocio real aun desplegadas
3. `Hosting + egress`
4. `Storage` de media activa

La tesis correcta hoy es esta:

> `El gasto ya no viene sobre todo de periferia; ahora viene del nucleo realtime vivo y de algunas superficies admin/manuales que aun abren lecturas o invocaciones reales.`

---

## Lo que quedo implementado

### Recortes ya aplicados

- presencia reducida a `60` usuarios recientes y heartbeat de `8` minutos
- `private_inbox` y `private_match_state` condicionados por visibilidad y actividad real
- partner profile del privado cambiado a `getDoc` puntual
- allowlist estricta para `dispatchUserNotification`
- `ENABLE_BAUL = false`
- `ENABLE_PRIVATE_TYPING = false`
- `trackAnalyticsEvent` fuera de produccion
- historial admin legacy de `Storage` removido del flujo vivo
- limpieza `cleanupAdminRoomHistoryArchive` retirada de produccion

### Functions ya retiradas

- `notifyOnNewMessage`
- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `trackAnalyticsEvent`
- `archiveRoomMessageForAdminHistory`
- `syncPhotoPrivilegeFromPresence`
- `revokePhotoPrivilegeForInactivity`
- `cleanupAdminRoomHistoryArchive`

---

## Lo que sigue cobrando hoy

### Firestore realtime

#### Chat publico base

Archivo:

- `src/services/chatService.js`

Hallazgo:

- `subscribeToRoomMessages` sigue usando `onSnapshot` con `messageLimit = 60`
- `subscribeToSecondaryRoomMessages` sigue usando `onSnapshot` con `messageLimit = 60`

Evidencia:

```js
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 60) => {
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
}
```

Veredicto:

- **cobra hoy**
- **es nucleo**
- **todavia tiene margen de recorte**

#### Presencia

Archivo:

- `src/services/presenceService.js`

Hallazgo:

- `ROOM_USERS_LISTENER_LIMIT = 60`
- `CHAT_AVAILABILITY_HEARTBEAT_MS = 8 * 60 * 1000`
- `subscribeToRoomUsers` sigue vivo
- `updateUserActivity` sigue escribiendo `lastSeen`

Evidencia:

```js
const ROOM_USERS_LISTENER_LIMIT = 60;
export const CHAT_AVAILABILITY_HEARTBEAT_MS = 8 * 60 * 1000;
export const subscribeToRoomUsers = (roomId, callback) => { ... }
export const updateUserActivity = async (roomId, options = {}) => { ... }
```

Veredicto:

- **cobra hoy**
- **sigue siendo uno de los centros de costo**
- **ya esta mejor, pero aun no esta en su forma minima posible**

#### Privados

Archivo:

- `src/services/socialService.js`
- `src/components/chat/PrivateChatWindowV2.jsx`

Hallazgo:

- inbox realtime con `limit(20)`
- match state realtime con `limit(20)`
- chat privado activo en realtime

Evidencia:

```js
const PRIVATE_INBOX_LISTENER_LIMIT = 20;
const PRIVATE_MATCH_STATE_LISTENER_LIMIT = 20;
```

```js
export const subscribeToPrivateInbox = (userId, callback) => {
  limit(PRIVATE_INBOX_LISTENER_LIMIT)
}
```

```js
export const subscribeToPrivateMatchState = (userId, callback) => {
  limit(PRIVATE_MATCH_STATE_LISTENER_LIMIT)
}
```

Veredicto:

- **cobra hoy**
- **ya no esta descontrolado**
- **sigue costando cuando privados estan activos**

#### Notificaciones UI

Archivo:

- `src/services/systemNotificationsService.js`
- `src/components/layout/Header.jsx`
- `src/components/notifications/SystemNotificationsPanel.jsx`

Hallazgo:

- el `Header` mantiene `subscribeToSystemNotifications(user.id, ...)`
- el panel tambien puede montar la misma superficie compartida
- el query usa `limit(50)`

Veredicto:

- **cobra hoy**
- **es costo moderado**
- **conviene dejarlo bajo demanda o con TTL visual**

#### Admin realtime

Archivo:

- `src/pages/AdminPage.jsx`
- `src/services/analyticsService.js`
- `src/services/topParticipantsService.js`

Hallazgo:

- `AdminPage` monta listeners de stats, tickets, sanciones y recompensas
- `topParticipantsService` puede abrir hasta tres listeners simultaneos

Evidencia:

```js
const unsubscribe = subscribeToTodayStats(...)
const unsubscribe = subscribeToTickets(...)
const unsubscribe = subscribeToSanctions(...)
const unsubscribe = subscribeToRewards(...)
```

```js
const participantsUnsubscribe = onSnapshot(...)
const presenceUnsubscribe = onSnapshot(...)
const messagesUnsubscribe = onSnapshot(...)
```

Veredicto:

- **cobra cuando admin esta abierto**
- **no es costo basal de usuario final**
- **sigue siendo una superficie cara si se deja viva por defecto**

### Cloud Functions activas

Functions desplegadas hoy:

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

Clasificacion:

- esenciales:
  - `enforceCriticalRoomSafety`
  - `enforceCriticalPrivateChatSafety`
  - `cleanupRoomMessageMedia`
  - `cleanupPrivateChatMessageMedia`
  - `enforceRoomRetention`
  - `enforceRoomRetentionScheduled`
- costo de negocio real:
  - `dispatchUserNotification`
  - `notifyOnMatch`
  - `notifyOnOpinReply`
  - `notifyOnPrivateChatRequest`
  - `syncPublicUserProfileMirror`
  - `generateAdminRoomHistoryReport`
- costo latente/manual:
  - `backfillPublicUserProfiles`
  - `createModerationIncidentAlert`
  - `getFavoriteAudienceCount`
  - `getPrivateChatSharedContacts`
  - `recordTarjetaInteraction`

Hallazgo importante:

- `enforceRoomRetentionScheduled` sigue corriendo `every 15 minutes`

Veredicto:

- **Functions ya no estan contaminadas por basura periferica**
- **siguen cobrando por seguridad, retencion, espejo publico y notificaciones**

### Storage y hosting

Archivos activos:

- `src/components/chat/ChatInput.jsx`
- `src/components/chat/PrivateChatWindowV2.jsx`
- `src/services/chatService.js`

Hallazgo:

- media de chat y privados sigue usando `uploadBytes`, `getDownloadURL` y `deleteObject`
- `Storage` no es la fuga principal actual
- `Hosting/egress` sigue existiendo por bundles, imagenes y descargas de media

Veredicto:

- **cobra hoy**
- **no es el primer frente**

---

## Lo que puede volver a cobrar aunque hoy este apagado o dormido

### Baul

Archivos:

- `src/config/featureFlags.js`
- `src/services/tarjetaService.js`
- `src/pages/BaulPage.jsx`
- `src/components/baul/*`

Estado:

- `ENABLE_BAUL = false`

Riesgo:

- `recordTarjetaInteraction` sigue desplegada
- el servicio sigue teniendo lecturas, snapshots y callable lista para volver

Veredicto:

- **hoy no deberia cobrar fuerte**
- **si se reactiva sin auditoria, vuelve a subir costo**

### Typing privado

Archivo:

- `src/config/featureFlags.js`
- `src/components/chat/PrivateChatWindowV2.jsx`

Estado:

- `ENABLE_PRIVATE_TYPING = false`

Veredicto:

- **hoy no cobra**
- **si vuelve, suma writes y ruido realtime**

### Bot engine

Archivos:

- `src/services/botEngine.js`
- `src/components/admin/BotControlPanel.jsx`

Hallazgo:

- solo permite `admin-testing`
- usa `onSnapshot` sobre presencia y puede emitir mensajes

Veredicto:

- **no es costo central hoy**
- **si sale de admin-testing, vuelve a ser gasto serio**

### Backups, variantes y codigo comentado

Detectado:

- `src/pages/ChatPage.backup.jsx`
- `src/components/chat/PrivateChatWindow.jsx`
- `src/services/presenceService.js.disabled`
- `src/services/photoUploadService.BACKUP.js`
- listeners comentados en `LobbyPage`, `LobbyPage.new`, `GlobalStats`, `RoomsModal`

Veredicto:

- **no cobran hoy**
- **son riesgo de reintroduccion**

---

## Cambios residuales obligatorios por archivo

## P0 residual

### 1. `src/services/chatService.js`

Problema:

- `messageLimit = 60` sigue alto para un chat publico de bajo trafico

Cambio propuesto:

```js
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 30) => {
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
}

export const subscribeToSecondaryRoomMessages = (roomId, callback, messageLimit = 30) => {
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
}
```

Impacto esperado:

- menos lecturas por reconexion
- menos documentos entregados por snapshot inicial

Riesgo:

- menor ventana realtime visible
- se compensa con historial paginado

### 2. `src/services/presenceService.js`

Problema:

- la presencia aun usa snapshot continuo para usuarios de sala
- `updateUserActivity` puede seguir escribiendo mas de lo ideal

Cambio propuesto:

```js
const ROOM_USERS_LISTENER_LIMIT = 40;
export const CHAT_AVAILABILITY_HEARTBEAT_MS = 10 * 60 * 1000;
```

Y revisar migracion opcional de:

- `subscribeToRoomUsers`

hacia:

- polling barato cada `60-120s` en vez de snapshot permanente para pantallas secundarias

Impacto esperado:

- menor churn de lecturas y escrituras

Riesgo:

- presencia menos precisa
- aceptable para una sala social

### 3. `src/pages/ChatSecondaryPage.jsx`

Problema:

- la pagina secundaria sigue manteniendo presencia y listener de usuarios

Cambio propuesto:

- dejar `subscribeToRoomUsers` solo si la vista esta visible
- evitar `updateUserActivity(roomId)` si la pestaña esta oculta
- considerar `getDocs` puntual para conteo/preview si no hay interaccion real

Impacto esperado:

- baja costo de salas no principales

## P1 residual

### 4. `src/services/systemNotificationsService.js`

Problema:

- el header mantiene notificaciones vivas siempre para usuario autenticado

Cambio propuesto:

- listener solo cuando:
  - panel abierto
  - o campana visible y usuario activo
- fallback a `getUnreadNotificationsCount` puntual cada cierto TTL

Impacto esperado:

- menos listener basal por usuario logueado

Riesgo:

- badge menos instantaneo

### 5. `src/pages/AdminPage.jsx`

Problema:

- listeners admin viven al abrir la pagina, no solo al abrir cada panel

Cambio propuesto:

- mover:
  - `subscribeToTodayStats`
  - `subscribeToTickets`
  - `subscribeToSanctions`
  - `subscribeToRewards`

a carga bajo demanda por tab/panel visible, o reemplazar por `getDoc/getDocs` + boton refrescar

Impacto esperado:

- fuerte ahorro en sesiones admin largas

Riesgo:

- dashboard menos vivo

### 6. `src/services/topParticipantsService.js`

Problema:

- el modo publico puede abrir tres listeners simultaneos

Cambio propuesto:

- no montar por defecto
- activar solo desde panel explicito
- reemplazar presencia o mensajes por snapshot puntual cuando sea posible

Impacto esperado:

- elimina una de las peores superficies realtime no core

## P2 residual

### 7. `functions/index.js`

Problemas aun recortables:

- `dispatchUserNotification`
- `notifyOnMatch`
- `notifyOnOpinReply`
- `notifyOnPrivateChatRequest`
- `syncPublicUserProfileMirror`
- `recordTarjetaInteraction`

Cambios propuestos:

#### `dispatchUserNotification`

- deduplicar por ventana temporal corta
- rechazar eventos repetidos por `userId + type + targetId`

#### `notifyOnOpinReply`

- evaluar si sigue justificando push o si basta escritura interna

#### `notifyOnMatch`

- mantener solo si su impacto producto es alto y su frecuencia es baja

#### `syncPublicUserProfileMirror`

- endurecer allowlist de campos sincronizables
- salir temprano si no cambia un campo publico esencial

Ejemplo:

```js
const PUBLIC_FIELDS = ['displayName', 'photoURL', 'bio', 'age', 'comuna'];
const hasRelevantChange = PUBLIC_FIELDS.some((key) => before?.[key] !== after?.[key]);
if (!hasRelevantChange) return null;
```

#### `recordTarjetaInteraction`

- si `ENABLE_BAUL = false`, la function sigue sobrando en produccion
- mejor eliminarla de produccion hasta reactivacion real

Impacto esperado:

- menos invocaciones mensuales
- menos fan-out por writes de perfil y notificaciones

---

## Lo que no debe tocarse

- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `cleanupRoomMessageMedia`
- `cleanupPrivateChatMessageMedia`
- `enforceRoomRetention`
- `enforceRoomRetentionScheduled`
- listener base del chat publico
- privados minimos

Motivo:

- seguridad critica
- limpieza de media
- retencion
- nucleo del producto

---

## Riesgos reales

### Riesgo bajo

- bajar `messageLimit` de `60` a `30`
- hacer admin bajo demanda
- sacar listeners de notificaciones siempre vivas

### Riesgo medio

- reducir mas presencia o pasar parte a polling
- quitar pushs secundarios como `notifyOnOpinReply`

### Riesgo alto

- tocar seguridad critica
- cortar retention
- romper inbox o privado activo

---

## Impacto estimado

### Ahorro adicional factible

Si se aplica el recorte residual correctamente:

- `Firestore reads`: baja adicional visible, sobre todo por chat secundario, admin y notificaciones
- `Functions`: baja adicional moderada si se endurece `syncPublicUserProfileMirror` y se elimina `recordTarjetaInteraction`
- `Storage`: menor impacto, ya no es foco principal

### Meta realista post-auditoria

- acercarse a `3-8 USD/mes` si el trafico no sube fuerte
- con trafico bajo y admin austero, incluso acercarse al borde inferior del rango

### Principal condicion

- no reactivar:
  - `Baul`
  - `typing privado`
  - `botEngine` fuera de `admin-testing`
  - listeners viejos de lobby/admin sin nueva auditoria

---

## Checklist final de verificacion

### Firestore

- `subscribeToRoomMessages` y `subscribeToSecondaryRoomMessages` con `limit <= 30`
- sin historial realtime
- sin perfiles realtime
- sin listeners invisibles en chat secundario
- sin top participants montado por defecto

### Presencia

- heartbeat `8-10 min`
- sin typing global
- usuarios recientes limitados
- sin micro-updates innecesarios de `lastSeen`

### Privados

- inbox limitado a `20`
- match state solo con superficie activa
- privado activo con `limit <= 30`
- sin typing privado

### Functions

- `recordTarjetaInteraction` fuera de produccion mientras `Baul` este apagado
- `syncPublicUserProfileMirror` con allowlist dura
- `dispatchUserNotification` sin duplicados
- solo notificaciones de alto valor

### Admin

- sin realtime por defecto
- carga por panel visible
- refresh manual donde sea razonable

### Features dormidas

- `ENABLE_BAUL = false`
- `ENABLE_PRIVATE_TYPING = false`
- `botEngine` restringido a `admin-testing`
- backups y variantes viejas no importadas

---

## Conclusion

`Chactivo ya salio de la zona donde lo drenaban features accesorias. El siguiente ahorro no viene de borrar mas basura periferica, sino de endurecer el nucleo realtime: menos documentos por listener, menos presencia viva, menos admin por defecto y menos Functions activas para modulos apagados o de valor marginal.`
