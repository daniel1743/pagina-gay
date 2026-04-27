# Auditoria Costo Cloud Functions 2026-04-27

## Objetivo

Determinar que Cloud Functions de `Chactivo` son realmente indispensables y cuales son candidatas claras a recorte porque hoy estan generando costo alto o innecesario en Firebase.

La auditoria se basa en:

- funciones desplegadas de verdad,
- frecuencia observable en logs,
- tipo de trigger,
- fan-out probable,
- y valor real para el producto.

---

## Veredicto ejecutivo

El gasto no parece concentrarse en una sola function.

Hoy el sobrecosto probable viene de tres familias:

1. jobs programados demasiado frecuentes,
2. triggers que corren por eventos muy comunes aunque entregan poco valor,
3. callables frontales que se invocan muchas veces por sesion y encima pagan `OPTIONS` por CORS.

Las peores candidatas para recorte inmediato son:

- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `trackAnalyticsEvent`
- `archiveRoomMessageForAdminHistory`
- `notifyOnNewMessage`

Las funciones que no deberias tocar primero, porque si cumplen rol critico, son:

- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `dispatchUserNotification`
- `notifyOnPrivateChatRequest`
- `notifyOnOpinReply`
- `cleanupPrivateChatMessageMedia`
- `cleanupRoomMessageMedia`

---

## Estado real de despliegue

Se verifico por consola que estas funciones siguen activas en produccion:

- `notifyOnNewMessage`
- `cleanupPrivateChatMessageMedia`
- `notifyOnMatch`
- `notifyOnPrivateChatRequest`
- `notifyOnOpinReply`
- `sendPeakHourConnectionReminders`
- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `sendEventReminderPushes`
- `syncPhotoPrivilegeFromPresence`
- `revokePhotoPrivilegeForInactivity`
- `enforceRoomRetention`
- `enforceRoomRetentionScheduled`
- `dispatchUserNotification`
- `trackAnalyticsEvent`
- `recordTarjetaInteraction`
- `archiveRoomMessageForAdminHistory`
- `cleanupRoomMessageMedia`
- `syncPublicUserProfileMirror`
- `backfillPublicUserProfiles`
- `getPrivateChatSharedContacts`
- `getFavoriteAudienceCount`
- `createModerationIncidentAlert`
- `generateAdminRoomHistoryReport`
- `cleanupAdminRoomHistoryArchive`

Conclusión:

El costo no es teorico. La superficie desplegada sigue siendo grande.

---

## Hallazgos prioritarios

### P0. `sendPeakHourConnectionReminders` gasta mucho para valor dudoso

- Archivo: `functions/index.js:2151`
- Tipo: `onSchedule`
- Frecuencia: cada `30 min`

Evidencia:

- logs muestran ejecuciones periodicas reales durante toda la tarde.
- una corrida reciente ya registraba:
  - `sent=0 skipped=150`

Lectura operativa:

- despierta sola,
- escanea usuarios,
- muchas veces no manda nada,
- pero igual consume invocacion, lectura y tiempo de CPU.

Veredicto:

- **no indispensable**
- **candidata fuerte a apagar ya**

---

### P0. `sendEventReminderPushes` esta corriendo cada 5 minutos

- Archivo: `functions/index.js:2386`
- Tipo: `onSchedule`
- Frecuencia: cada `5 min`

Evidencia:

- logs muestran requests continuos del scheduler:
  - `16:36`
  - `16:41`
  - `16:46`
  - `16:51`
  - `16:56`
  - `17:01`
  - `17:06`
  - `17:11`
  - `17:16`
  - y asi sucesivamente.

Lectura operativa:

- aunque no haya eventos relevantes, igual se despierta,
- cada corrida cuesta,
- el intervalo es agresivo para una feature secundaria.

Veredicto:

- **no indispensable para el core del chat**
- **candidata fuerte a apagar o bajar drasticamente de frecuencia**

---

### P0. `trackAnalyticsEvent` esta generando demasiado ruido

- Archivo: `functions/index.js:3258`
- Tipo: `onCall`
- Cliente:
  - `src/services/analyticsService.js:47`
  - `src/services/eventTrackingService.js:170`

Evidencia:

- el frontend usa `httpsCallable` para eventos frecuentes.
- se registran llamadas por:
  - `page_view`
  - `page_exit`
  - `room_joined`
  - `message_sent`
  - `session_start`
  - `traffic_source`
  - `return_visit`
- eso no solo genera `POST`, tambien `OPTIONS` por CORS.

Lectura operativa:

- estas pagando function por analitica de comportamiento,
- no por funcionalidad central del producto,
- y ademas con mucho volumen por sesion.

Veredicto:

- **no indispensable**
- **si hay emergencia de costo, es de lo primero que hay que cortar**

---

### P0. `archiveRoomMessageForAdminHistory` corre por cada mensaje publico

- Archivo: `functions/index.js:3737`
- Tipo: trigger por mensaje publico

Evidencia:

- logs muestran archivado real por mensaje a Storage en rutas tipo:
  - `admin-room-history/raw/principal/...json`

Lectura operativa:

- cada mensaje publico dispara pipeline adicional,
- incluso si nadie de admin revisa ese historial,
- agrega costo continuo por mensaje.

Veredicto:

- **no indispensable para operacion diaria**
- **candidata fuerte a apagar**

---

### P0. `notifyOnNewMessage` sigue viva y sigue gastando aunque casi no aporta

- Archivo: `functions/index.js:1935`
- Tipo: trigger por mensaje privado

Hallazgo real:

- esta function sigue siendo invocada por cada mensaje privado.
- los logs muestran actividad repetida.
- tambien muestran cold starts y multiples casos de:
  - usuario sin tokens FCM

Problema:

- aunque su valor hoy es bajo o redundante, el trigger sigue pagando invocacion.
- ademas compite conceptualmente con el pipeline basado en `dispatchUserNotification`.

Veredicto:

- **no indispensable en su forma actual**
- **candidata clara a desactivar**

---

### P1. `syncPublicUserProfileMirror` parece demasiado ruidosa

- Archivo: `functions/index.js:3782`
- Tipo: `onDocumentWritten(users/{userId})`

Hallazgo:

- los logs muestran sincronizaciones repetidas sobre los mismos usuarios en ventanas cortas.
- aunque tiene guard de cambios relevantes, igual esta siendo invocada bastante.

Riesgo:

- cualquier write frecuente en `users/{uid}` puede volverla una multiplicadora silenciosa.

Veredicto:

- **no la apagaria primero si el espejo publico sigue siendo importante**
- pero **si la pondria en lista de optimizacion urgente**

---

## Funciones probablemente indispensables

### Seguridad critica

- `functions/index.js:2243` `enforceCriticalRoomSafety`
- `functions/index.js:2308` `enforceCriticalPrivateChatSafety`

Razón:

- moderan menores,
- contacto externo,
- coercion,
- y otras señales de seguridad real.

Veredicto:

- **mantener**

---

### Pipeline de notificaciones principal

- `functions/index.js:2699` `dispatchUserNotification`
- `functions/index.js:2002` `notifyOnPrivateChatRequest`
- `functions/index.js:2069` `notifyOnOpinReply`

Razón:

- sostienen el flujo real de notificaciones y push.
- si los cortas sin rediseño, rompes notificaciones visibles al usuario.

Observación:

- `dispatchUserNotification` si genera costo y ademas sufre `OPTIONS`,
- pero hoy sigue siendo funcionalmente importante.

Veredicto:

- **mantener por ahora**
- **optimizar despues**

---

### Limpieza de media

- `cleanupPrivateChatMessageMedia`
- `cleanupRoomMessageMedia`

Razón:

- evitan basura y fuga de almacenamiento tras borrados.

Veredicto:

- **mantener**

---

## Funciones secundarias que deben reevaluarse

### `syncPhotoPrivilegeFromPresence`

- Archivo: `functions/index.js:2492`
- Trigger: ingreso a presencia

Problema:

- si presencia ya es muy movida, esta function hereda ese churn.

Veredicto:

- **no critica para el chat base**
- **candidata a bajar prioridad o refactorizar**

---

### `revokePhotoPrivilegeForInactivity`

- Archivo: `functions/index.js:2537`
- Tipo: job cada `60 min`

Veredicto:

- costo moderado,
- no parece ser la raiz principal,
- pero tampoco es core del chat.

---

### `enforceRoomRetentionScheduled`

- Archivo: `functions/index.js:2659`
- Tipo: scheduled

Lectura:

- la version vieja del problema parecia peor,
- pero el enforcement directo por mensaje ya no es tan grave.
- aun asi, el sweep programado merece medicion aparte si hay muchas salas o mucha historia.

Veredicto:

- **vigilar**
- **no parece el peor culpable hoy**

---

## Funciones que no parecen ser el problema principal

### `enforceRoomRetention`

- hoy ya no se comporta como el trigger mas caro de antes.
- su carga actual esta mucho mas acotada.

### `backfillPublicUserProfiles`

- callable admin.
- no explica gasto base diario salvo uso manual raro.

### `generateAdminRoomHistoryReport`

- admin bajo demanda.
- no parece raiz del gasto permanente.

### `getPrivateChatSharedContacts`

- bajo demanda.

### `getFavoriteAudienceCount`

- bajo demanda.

### `createModerationIncidentAlert`

- solo corre ante incidentes concretos.

---

## Ranking de recorte recomendado

### Cortar primero

1. `sendPeakHourConnectionReminders`
2. `sendEventReminderPushes`
3. `trackAnalyticsEvent`
4. `archiveRoomMessageForAdminHistory`
5. `notifyOnNewMessage`

### Optimizar despues

1. `syncPublicUserProfileMirror`
2. `dispatchUserNotification`
3. `syncPhotoPrivilegeFromPresence`
4. `revokePhotoPrivilegeForInactivity`
5. `enforceRoomRetentionScheduled`

### Mantener

1. `enforceCriticalRoomSafety`
2. `enforceCriticalPrivateChatSafety`
3. `notifyOnPrivateChatRequest`
4. `notifyOnOpinReply`
5. `cleanupPrivateChatMessageMedia`
6. `cleanupRoomMessageMedia`

---

## Plan minimo de ahorro

### Fase 1

- apagar `sendPeakHourConnectionReminders`
- apagar `sendEventReminderPushes`
- apagar `archiveRoomMessageForAdminHistory`
- apagar `notifyOnNewMessage`

Impacto esperado:

- baja inmediata de invocaciones programadas,
- baja de triggers por mensaje privado y publico,
- sin romper la seguridad base del chat.

### Fase 2

- desactivar analitica callable `trackAnalyticsEvent`
- o dejarla en modo ultra-basico y no por evento de sesion

Impacto esperado:

- baja fuerte de ruido frontal y CORS.

### Fase 3

- revisar por que `users/{uid}` se escribe tanto
- reducir disparos de `syncPublicUserProfileMirror`

Impacto esperado:

- elimina gasto silencioso recurrente.

---

## Conclusión final

El gasto alto de Cloud Functions en `Chactivo` no parece venir principalmente de moderación critica.

La mayor fuga hoy parece estar en:

- jobs programados demasiado frecuentes,
- archivado admin permanente,
- analitica server-side demasiado habladora,
- y triggers redundantes de notificaciones/mensajes.

La decisión correcta no es tocar seguridad primero.

La decisión correcta es:

- cortar funciones accesorias,
- conservar enforcement critico,
- y reducir el ruido que hoy se ejecuta aunque el producto no lo necesite para funcionar.
