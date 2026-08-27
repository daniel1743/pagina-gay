# Medidas Drasticas Functions Aplicadas 2026-04-28

## Objetivo

Bajar de forma agresiva el gasto diario de `Cloud Functions`, sin romper:

- chat publico base
- privados minimos
- seguridad critica
- moderacion critica
- limpieza de media

---

## Cambios aplicados hoy

### 1. Se corto la escritura a `users/{uid}` por cada mensaje publico

Archivo:

- `src/services/chatService.js`

Cambio:

- ya no se ejecuta:
  - `updateDoc(doc(db, 'users', messageData.userId), { messageCount, lastMessageAt })`

Impacto esperado:

- menos writes en `users`
- menos disparos de `syncPublicUserProfileMirror`
- menos invocaciones indirectas por cada mensaje publico

### 2. Se recorto el callable `dispatchUserNotification`

Archivos:

- `src/services/userNotificationDispatchService.js`
- `functions/index.js`

Cambio:

- cliente y backend ya no aceptan:
  - `direct_message`
  - `private_chat_reopened`
  - acciones sociales no esenciales
- quedaron permitidas solo:
  - `private_chat_request`
  - `private_chat_request_response`
  - `private_group_invite_request`
  - `private_group_invite_rejected`
  - `private_group_chat_ready`

Impacto esperado:

- menos callables por microeventos
- menos invocaciones por reapertura de privados

### 3. Se apago la notificacion por reapertura de privado

Archivo:

- `src/services/socialService.js`

Cambio:

- `signalPrivateChatOpen()` ya no llama `dispatchUserNotification`
- devuelve `skipped: true` por control de costo

Impacto esperado:

- menos invocaciones en flujos de reapertura / continuidad de privados

### 4. Se retiraron functions no esenciales de produccion

Eliminadas:

- `notifyOnMatch`
- `notifyOnPrivateChatRequest`
- `notifyOnOpinReply`
- `recordTarjetaInteraction`

Impacto esperado:

- menos triggers por `matches`
- menos triggers por `users/{uid}/notifications/{notificationId}`
- cero costo de callable Baul mientras `ENABLE_BAUL=false`

### 5. Se redujo el costo basal del scheduler de retencion

Archivo:

- `functions/index.js`

Cambio:

- `enforceRoomRetentionScheduled`
  - antes: `every 15 minutes`
  - ahora: `every 60 minutes`

Impacto esperado:

- 75% menos ejecuciones de ese scheduler

---

## Validacion realizada

- `node --check functions/index.js` OK
- `npm run build` OK
- deploy realizado:
  - `firebase functions:delete notifyOnMatch notifyOnPrivateChatRequest notifyOnOpinReply recordTarjetaInteraction --region us-central1 --force`
  - `firebase deploy --only "functions,hosting"`

Hosting activo:

- `https://chat-gay-3016f.web.app`

---

## Functions activas despues del recorte

Quedaron activas:

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
- `syncPublicUserProfileMirror`

---

## Lectura tecnica correcta

Lo mas importante de hoy no fue solo borrar functions visibles.

Lo mas importante fue cortar esta cadena cara:

1. mensaje publico
2. write a `users/{uid}`
3. trigger `syncPublicUserProfileMirror`
4. invocacion de function aunque el mirror haga skip

Eso si podia drenar costo incluso cuando el producto parecia “tranquilo”.

---

## Riesgos y tradeoffs

Tradeoffs aceptados:

- sin push de match
- sin push de OPIN
- sin push por solicitud privada via trigger
- sin callable activa de Baul
- sin notificacion de reapertura de privado

Lo que sigue funcionando:

- inbox/notificaciones internas
- chat publico
- privados base
- seguridad critica
- limpieza de media
- retencion

---

## Siguiente frente si el costo sigue alto

1. endurecer o pausar `syncPublicUserProfileMirror`
2. mover `Header` fuera de listener realtime permanente de `systemNotifications`
3. sacar realtime admin por defecto
4. bajar `messageLimit` de `60` a `30` en `chatService`

---

## Conclusión

`Hoy se aplico un recorte agresivo sobre Functions: se eliminaron triggers sociales no esenciales, se bajo el scheduler de retencion, se apagaron callables residuales y se corto una fuente importante de invocaciones indirectas desde writes de usuario por mensaje publico.`
