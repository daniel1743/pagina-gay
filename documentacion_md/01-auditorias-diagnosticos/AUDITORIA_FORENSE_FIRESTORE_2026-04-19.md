# Auditoria Forense Firestore 2026-04-19

## Objetivo

Detectar con precision por que el consumo de Firestore/Firebase en `Chactivo` es anormalmente alto frente a la actividad visible del producto.

La auditoria se centra en:

- lecturas en tiempo real,
- listeners persistentes,
- re-suscripciones,
- escrituras frecuentes,
- fan-out backend,
- cargas ocultas en UI secundaria,
- queries admin/diagnostico que escalan mal,
- y duplicidades entre frontend y Cloud Functions.

---

## Resumen ejecutivo

### Raiz probable del problema

La raiz principal no parece ser el listener de mensajes del chat publico.

La raiz probable hoy es una combinacion de cuatro factores:

1. `roomPresence` en tiempo real con heartbeat constante.
2. Capas privadas siempre activas en `ChatPage` y ventanas privadas persistentes.
3. Cargas de catalogo/sugerencias basadas en `tarjetas` desde el chat, aunque el usuario no entre a Baul.
4. Fan-out backend por cada mensaje y por cada evento privado.

### Modulo mas costoso

El modulo mas costoso y estructural hoy es `presencia + listeners de sala`.

Archivo principal:

- `src/pages/ChatPage.jsx`
- `src/services/presenceService.js`

### Tipo de error principal

No es un solo bug puntual.

Es un problema de arquitectura de costo:

- demasiado tiempo real,
- demasiadas superficies montadas a la vez,
- algunas capas leen aunque no sean la experiencia principal,
- y varios eventos del producto generan escrituras derivadas en cascada.

### Impacto estimado

Estimacion razonada, basada en codigo inspeccionado:

- `roomPresence` y heartbeat: 55% a 75% del sobreconsumo actual.
- privados, inbox, match-state, typing y notificaciones de usuario: 15% a 25%.
- catalogo de sugerencias desde `tarjetas` cargado desde chat: 5% a 15%.
- triggers backend por mensaje y jobs programados: 5% a 15%.

La mayor desproporcion entre “pocos usuarios / pocos mensajes” y “muchas lecturas” encaja sobre todo con presencia y listeners permanentes.

---

## Conclusiones clave

### Lo que no parece ser el problema principal

- `subscribeToRoomMessages` en `src/services/chatService.js` esta limitado y compartido.
- `subscribeToNotifications` de `socialService` esta compartido entre `ChatPage` y `NotificationBell`.
- `subscribeToSystemNotifications` esta compartido entre `Header` y `SystemNotificationsPanel`.
- `subscribeToMultipleRoomCounts` ya fue desactivado o comentado en casi todas las vistas publicas.
- la persistence offline de Firestore esta deshabilitada, por lo que no parece haber costo extra por rehidratacion local.

### Lo que si parece ser el problema principal

- `subscribeToRoomUsers(roomId)` sigue vivo en `ChatPage` mientras la pestaña esta visible.
- `updateUserActivity(roomId)` sigue escribiendo cada `60s` por usuario visible.
- cada escritura de presencia mueve snapshots de todos los clientes escuchando la sala.
- `ChatPage` monta ademas `users/{uid}/notifications`, `users/{uid}/private_inbox` y `users/{uid}/private_match_state`.
- `GlobalPrivateChatWindow` mantiene listeners privados aunque el usuario navegue fuera del chat.
- `ChatPage` sigue leyendo `tarjetas` para sugerencias privadas persistentes aunque Baul este pausado.
- cada mensaje privado genera varios efectos secundarios.
- cada mensaje publico genera varias funciones backend.

---

## Inventario completo

Cada item documenta: archivo, componente o funcion, coleccion/path, tipo, frecuencia, riesgo y observacion.

### Tiempo real y presencia

- Archivo: `src/pages/ChatPage.jsx`
  Componente: `ChatPage`
  Path: `roomPresence/{roomId}/users`
  Tipo: listener
  Frecuencia: continua mientras la pestaña esta visible
  Riesgo: `P0`
  Observacion: listener central del chat. Cada cambio de presencia de cualquier usuario vuelve a impactar la vista.

- Archivo: `src/services/presenceService.js`
  Funcion: `subscribeToRoomUsers`
  Path: `roomPresence/{roomId}/users`
  Tipo: listener
  Frecuencia: continua
  Riesgo: `P0`
  Observacion: no esta compartido; si otra vista lo monta, crea otro listener real.

- Archivo: `src/services/presenceService.js`
  Funcion: `updateUserActivity`
  Path: `roomPresence/{roomId}/users/{uid}`
  Tipo: escritura
  Frecuencia: cada `60s` por usuario visible
  Riesgo: `P0`
  Observacion: es la fuente base de churn en presencia.

- Archivo: `src/services/presenceService.js`
  Funcion: `joinRoom`
  Path: `roomPresence/{roomId}/users/{uid}`
  Tipo: escritura
  Frecuencia: al entrar a sala
  Riesgo: `P1`
  Observacion: crea doc de presencia y sincroniza estado online de `tarjetas`.

- Archivo: `src/services/presenceService.js`
  Funcion: `leaveRoom`
  Path: `roomPresence/{roomId}/users/{uid}`
  Tipo: delete + escritura derivada
  Frecuencia: al salir
  Riesgo: `P1`
  Observacion: borra presencia y actualiza `tarjetas`.

- Archivo: `src/services/presenceService.js`
  Funcion: `setAvailabilityForConversation`
  Path: `roomPresence/{roomId}/users/{uid}`
  Tipo: escritura
  Frecuencia: cada vez que cambia disponibilidad
  Riesgo: `P1`
  Observacion: suma campos a presencia que luego disparan listener global de sala.

### Chat publico

- Archivo: `src/services/chatService.js`
  Funcion: `subscribeToRoomMessages`
  Path: `rooms/{roomId}/messages`
  Tipo: listener
  Frecuencia: continua
  Riesgo: `P2`
  Observacion: esta mejor resuelto que otros modulos; usa limit y shared listener.

- Archivo: `src/services/chatService.js`
  Funcion: `addReactionToMessage`
  Path: `rooms/{roomId}/messages/{messageId}`
  Tipo: escritura + lectura inmediata
  Frecuencia: por reaccion
  Riesgo: `P3`
  Observacion: hace `updateDoc` y luego `getDoc` del mismo mensaje.

### Privados y notificaciones sociales

- Archivo: `src/pages/ChatPage.jsx`
  Componente: `ChatPage`
  Path: `users/{uid}/notifications`
  Tipo: listener
  Frecuencia: continua cuando la pagina esta visible
  Riesgo: `P1`
  Observacion: compartido con `NotificationBell`, pero sigue siendo un listener siempre vivo.

- Archivo: `src/pages/ChatPage.jsx`
  Componente: `ChatPage`
  Path: `users/{uid}/private_inbox`
  Tipo: listener
  Frecuencia: continua cuando la pagina esta visible
  Riesgo: `P1`
  Observacion: no esta compartido.

- Archivo: `src/pages/ChatPage.jsx`
  Componente: `ChatPage`
  Path: `users/{uid}/private_match_state`
  Tipo: listener
  Frecuencia: continua cuando la pagina esta visible
  Riesgo: `P1`
  Observacion: no esta compartido.

- Archivo: `src/services/socialService.js`
  Funcion: `subscribeToNotifications`
  Path: `users/{uid}/notifications`
  Tipo: listener
  Frecuencia: continua
  Riesgo: `P1`
  Observacion: compartido correctamente.

- Archivo: `src/services/socialService.js`
  Funcion: `subscribeToPrivateInbox`
  Path: `users/{uid}/private_inbox`
  Tipo: listener
  Frecuencia: continua
  Riesgo: `P1`
  Observacion: sin shared listener y sin `limit`.

- Archivo: `src/services/socialService.js`
  Funcion: `subscribeToPrivateMatchState`
  Path: `users/{uid}/private_match_state`
  Tipo: listener
  Frecuencia: continua
  Riesgo: `P1`
  Observacion: sin shared listener y sin `limit`.

- Archivo: `src/components/chat/PrivateChatWindowV2.jsx`
  Componente: `PrivateChatWindowV2`
  Path: `private_chats/{chatId}/messages`
  Tipo: listener
  Frecuencia: continua por ventana privada abierta
  Riesgo: `P1`
  Observacion: `GlobalPrivateChatWindow` lo mantiene aunque el usuario navegue fuera del chat.

- Archivo: `src/components/chat/PrivateChatWindowV2.jsx`
  Componente: `PrivateChatWindowV2`
  Path: `tarjetas/{partnerId}`
  Tipo: listener
  Frecuencia: continua por ventana privada abierta
  Riesgo: `P2`
  Observacion: cada ventana suma un listener extra al partner.

- Archivo: `src/components/chat/PrivateChatWindowV2.jsx`
  Componente: `PrivateChatWindowV2`
  Path: `roomPresence/private_{chatId}/users`
  Tipo: listener
  Frecuencia: continua por ventana privada abierta
  Riesgo: `P1`
  Observacion: typing usa `roomPresence` y no una subcoleccion mas barata o consolidada.

- Archivo: `src/services/socialService.js`
  Funcion: `updatePrivateChatTypingStatus`
  Path: `roomPresence/private_{chatId}/users/{uid}`
  Tipo: escritura/delete
  Frecuencia: mientras el usuario escribe
  Riesgo: `P1`
  Observacion: genera ruido de presencia fuera del chat principal.

- Archivo: `src/services/socialService.js`
  Funcion: `sendMessageToPrivateChat`
  Path: `private_chats/{chatId}`, `private_chats/{chatId}/messages`, `users/{uid}/private_inbox`, `users/{uid}/notifications`
  Tipo: lectura + escritura + notificacion
  Frecuencia: por mensaje privado
  Riesgo: `P1`
  Observacion: por cada mensaje privado hay lectura del chat, escritura del mensaje, update de chat meta, sync de inbox y notificacion.

### Sugerencias, match y Baul

- Archivo: `src/pages/ChatPage.jsx`
  Componente: `ChatPage`
  Path: `tarjetas`, `public_user_profiles`
  Tipo: lecturas puntuales
  Frecuencia: por sesion/entrada al chat
  Riesgo: `P1`
  Observacion: `obtenerTarjetasRecientes(user.id, 45)` corre desde el chat para alimentar sugerencias privadas persistentes.

- Archivo: `src/services/tarjetaService.js`
  Funcion: `obtenerTarjetasRecientes`
  Path: `tarjetas`
  Tipo: lecturas
  Frecuencia: por invocacion
  Riesgo: `P1`
  Observacion: hace hasta dos `getDocs` para completar muestra.

- Archivo: `src/services/tarjetaService.js`
  Funcion: `obtenerTarjetasCercanas`
  Path: `tarjetas`
  Tipo: lecturas
  Frecuencia: por invocacion
  Riesgo: `P1`
  Observacion: igual patron de sobredescarga controlada; cara si se usa mucho.

- Archivo: `src/services/tarjetaService.js`
  Funcion: `actualizarEstadoOnline`
  Path: `tarjetas/{uid}`
  Tipo: escritura
  Frecuencia: join/leave y otras sincronizaciones
  Riesgo: `P2`
  Observacion: presencia publica y Baul quedan acoplados.

- Archivo: `src/services/topParticipantsService.js`
  Funcion: `subscribeRealtimeTopParticipants`
  Path: `featured_participants`, `roomPresence/{roomId}/users`, `rooms/{roomId}/messages`
  Tipo: listeners
  Frecuencia: continua
  Riesgo: `P2`
  Observacion: triple listener simultaneo si este modulo se monta.

### Auth, perfil y sistema

- Archivo: `src/contexts/AuthContext.jsx`
  Componente: `AuthContext`
  Path: `users/{uid}`
  Tipo: listener
  Frecuencia: continuo para usuarios registrados
  Riesgo: `P3`
  Observacion: no es grande solo, pero suma a la base.

- Archivo: `src/services/systemNotificationsService.js`
  Funcion: `subscribeToSystemNotifications`
  Path: `systemNotifications`
  Tipo: listener
  Frecuencia: continuo si header activo
  Riesgo: `P2`
  Observacion: shared listener correcto.

- Archivo: `src/components/layout/Header.jsx`
  Componente: `Header`
  Path: `systemNotifications`
  Tipo: listener indirecto
  Frecuencia: continua
  Riesgo: `P2`
  Observacion: no duplica el listener de panel porque el servicio lo comparte.

### Backend / Functions

- Archivo: `functions/index.js`
  Trigger: `notifyOnNewMessage`
  Path: `private_chats/{chatId}/messages/{messageId}`
  Tipo: trigger con lectura
  Frecuencia: por mensaje privado
  Riesgo: `P1`
  Observacion: lee el chat para resolver destinatario.

- Archivo: `functions/index.js`
  Trigger: `notifyOnPrivateChatRequest`
  Path: `users/{uid}/notifications/{notificationId}`
  Tipo: trigger
  Frecuencia: por notificacion de usuario
  Riesgo: `P1`
  Observacion: empuja push para DM, request, accepted, profile_comment.

- Archivo: `functions/index.js`
  Trigger: `notifyOnOpinReply`
  Path: `users/{uid}/notifications/{notificationId}`
  Tipo: trigger
  Frecuencia: por notificacion OPIN
  Riesgo: `P2`
  Observacion: adicional a la escritura de notificacion.

- Archivo: `functions/index.js`
  Trigger: `enforceCriticalRoomSafety`
  Path: `rooms/{roomId}/messages/{messageId}`
  Tipo: trigger con escrituras derivadas
  Frecuencia: por mensaje publico de texto
  Riesgo: `P2`
  Observacion: no siempre hace trabajo, pero se dispara siempre.

- Archivo: `functions/index.js`
  Trigger: `enforceRoomRetention`
  Path: `rooms/{roomId}/messages/{messageId}`
  Tipo: trigger con multiples lecturas/escrituras
  Frecuencia: por mensaje publico
  Riesgo: `P1`
  Observacion: potencialmente el trigger publico mas caro por consulta del historial y borrado por lotes.

- Archivo: `functions/index.js`
  Trigger: `archiveRoomMessageForAdminHistory`
  Path: `rooms/{roomId}/messages/{messageId}`
  Tipo: trigger a Storage
  Frecuencia: por mensaje publico
  Riesgo: `P2`
  Observacion: no gasta Firestore directo en lectura masiva, pero agrega costo de pipeline por mensaje.

- Archivo: `functions/index.js`
  Trigger: `syncPublicUserProfileMirror`
  Path: `users/{uid}`
  Tipo: trigger de espejo
  Frecuencia: por cualquier update de usuario
  Riesgo: `P2`
  Observacion: multiplica escrituras al editar perfil, flags PRO, etc.

### Admin y diagnostico

- Archivo: `src/services/activityService.js`
  Funcion: `getUserActivityStats`
  Path: `rooms`, `rooms/*/messages`, `private_chats`, `private_chats/*/messages`
  Tipo: lecturas masivas
  Frecuencia: por apertura del dashboard de actividad
  Riesgo: `P1`
  Observacion: escala muy mal, pero parece uso admin/puntual.

- Archivo: `src/services/adminFeaturePulseService.js`
  Funcion: `getFeaturePulseMetrics`
  Path: `analytics_stats`, `analytics_events`, `private_chats`
  Tipo: lecturas amplias
  Frecuencia: por apertura admin
  Riesgo: `P2`
  Observacion: no explica el gasto diario base si admin no la usa todo el tiempo.

---

## Top 20 hallazgos

### 1. Listener de presencia global + heartbeat constante

- Severidad: `P0`
- Modulo: presencia
- Por que es caro: cada usuario escribe `lastSeen` cada 60 segundos y todos los clientes en sala escuchan esa coleccion.
- Correccion: reducir heartbeat, separar presencia “online” de señales enriquecidas, y dejar de escuchar toda la coleccion cuando no sea estrictamente necesario.

### 2. `roomPresence` esta funcionando como bus universal

- Severidad: `P0`
- Modulo: presencia / privados / typing
- Por que es caro: la misma infraestructura de presencia soporta online, disponibilidad, typing y estado privado.
- Correccion: sacar typing y señales efimeras de `roomPresence`.

### 3. `ChatPage` monta demasiadas capas realtime

- Severidad: `P0`
- Modulo: chat principal
- Por que es caro: combina mensajes, usuarios online, notificaciones privadas, inbox y match state.
- Correccion: cargar solo lo esencial al entrar y diferir el resto.

### 4. Catalogo de sugerencias privadas lee `tarjetas` desde el chat

- Severidad: `P0`
- Modulo: matching contextual
- Por que es caro: el chat principal dispara consultas de Baul aunque el usuario no abra Baul.
- Correccion: mover a carga bajo demanda o precalculo backend/cache liviano.

### 5. `private_inbox` y `private_match_state` escuchan sin `limit`

- Severidad: `P1`
- Modulo: privados
- Por que es caro: creceran con historial de cada usuario.
- Correccion: agregar limit y paginacion real.

### 6. Ventanas privadas persistentes mantienen listeners app-wide

- Severidad: `P1`
- Modulo: privados
- Por que es caro: `GlobalPrivateChatWindow` sigue vivo fuera de la pagina de chat.
- Correccion: suspender listeners de ventanas minimizadas o fuera de foco.

### 7. Cada ventana privada agrega al menos 3 listeners

- Severidad: `P1`
- Modulo: privados
- Por que es caro: mensajes, typing y `tarjetas` del partner.
- Correccion: pausar partner/tiping cuando la ventana esta minimizada.

### 8. Typing en privados escribe y lee por `roomPresence`

- Severidad: `P1`
- Modulo: privados
- Por que es caro: churn alto para una señal visual efimera.
- Correccion: throttle fuerte o reemplazo por estado local/single doc con TTL.

### 9. Duplicidad funcional en notificacion de mensaje privado

- Severidad: `P1`
- Modulo: backend privados
- Por que es caro: `sendMessageToPrivateChat` crea notificacion `direct_message` via callable y ademas `notifyOnNewMessage` manda push al crear el mensaje.
- Correccion: elegir un solo camino canonico para push de DM.

### 10. Cada mensaje privado escribe en demasiados destinos

- Severidad: `P1`
- Modulo: privados
- Por que es caro: mensaje, meta del chat, inbox de ambos, notificacion, posibles pushes.
- Correccion: consolidar sync y evaluar si inbox del remitente realmente necesita escribirse en cada mensaje.

### 11. `enforceRoomRetention` se ejecuta por cada mensaje publico

- Severidad: `P1`
- Modulo: backend chat publico
- Por que es caro: consulta historial, calcula cutoff, borra lotes y assets.
- Correccion: mover retencion a job programado por sala o a lotes menos frecuentes.

### 12. `archiveRoomMessageForAdminHistory` corre por cada mensaje

- Severidad: `P2`
- Modulo: backend admin
- Por que es caro: pipeline permanente por mensaje, aunque admin no este mirando nada.
- Correccion: archivar por lote o solo cuando admin lo pida.

### 13. `syncPublicUserProfileMirror` amplifica cualquier update de `/users`

- Severidad: `P2`
- Modulo: perfiles
- Por que es caro: cada cambio de usuario escribe espejo publico y ubicacion discoverable.
- Correccion: disparar solo cuando cambien campos publicos relevantes.

### 14. `activityService` hace barridos completos

- Severidad: `P1`
- Modulo: admin/dashboard
- Por que es caro: recorre rooms, messages, private_chats y mensajes privados completos.
- Correccion: reemplazar por agregados precalculados.

### 15. `systemNotificationsService` usa lecturas anchas para broadcast

- Severidad: `P2`
- Modulo: sistema
- Por que es caro: `users` y `guests` hasta `500` docs por envio.
- Correccion: migrar todo broadcast a backend admin-only segmentado.

### 16. `topParticipantsService` tiene triple realtime

- Severidad: `P2`
- Modulo: ranking/top participants
- Por que es caro: overrides + presence + messages en paralelo.
- Correccion: apagar si no se usa o convertir a snapshot sintetico.

### 17. `getPublicProfileExtended` suma lecturas por vista de perfil

- Severidad: `P3`
- Modulo: perfiles
- Por que es caro: lee `public_user_profiles`, `tarjetas` y hasta 6 OPIN posts.
- Correccion: cache corto y payload publico consolidado.

### 18. `NotificationBell` no es la raiz, pero sigue montando interes realtime

- Severidad: `P3`
- Modulo: notificaciones
- Por que es caro: usa listener de notificaciones mientras el usuario esta dentro.
- Correccion: mantener shared listener pero evaluar pausa fuera de chat si no aporta.

### 19. Reglas no muestran un storm claro de reintentos

- Severidad: `P3`
- Modulo: reglas
- Por que es caro: no parece el origen principal del gasto.
- Correccion: revisar paths complejos, pero no priorizar aqui antes que presencia.

### 20. Baul esta pausado visualmente, pero su data sigue viva en rescates del chat

- Severidad: `P1`
- Modulo: chat + baul
- Por que es caro: el costo de `tarjetas` sigue ocurriendo aunque la feature este despriorizada.
- Correccion: desacoplar sugerencias del fetch de Baul.

---

## Duplicidades

- Duplica: push de DM por `notifyOnNewMessage` y por `dispatchUserNotification('direct_message')`.
  Debe quedar: un solo camino canonico.
  Deberia morir: el trigger redundante o la notificacion redundante.

- Duplica: presencia real, disponibilidad, typing y estado privado en la misma familia `roomPresence`.
  Debe quedar: presencia base minima.
  Deberia morir: uso de presencia como contenedor universal.

- Duplica: Baul como modulo pausado y `tarjetas` como fuente de sugerencias desde chat.
  Debe quedar: una sola fuente de sugerencias bajo demanda.
  Deberia morir: preload automatico desde chat.

- Duplica: inbox privado y notificaciones como superficies separadas siempre vivas.
  Debe quedar: una superficie primaria siempre viva y otra bajo demanda.
  Deberia morir: escucha permanente de ambas si no se usan.

---

## Listeners peligrosos

- `src/services/presenceService.js` `subscribeToRoomUsers`
  Peligro: escucha toda la sala y su costo escala con cada heartbeat de cualquier usuario.

- `src/services/socialService.js` `subscribeToPrivateInbox`
  Peligro: no tiene `limit`, sigue creciendo con la cuenta.

- `src/services/socialService.js` `subscribeToPrivateMatchState`
  Peligro: no tiene `limit`, y se mantiene mientras `ChatPage` este visible.

- `src/components/chat/PrivateChatWindowV2.jsx` `onSnapshot(private_chats/{chatId}/messages)`
  Peligro: uno por ventana abierta.

- `src/components/chat/PrivateChatWindowV2.jsx` `subscribeToPrivateChatTyping`
  Peligro: uno por ventana abierta y alimentado por escrituras frecuentes.

- `src/components/chat/PrivateChatWindowV2.jsx` `onSnapshot(tarjetas/{partnerId})`
  Peligro: uno por ventana abierta.

- `src/services/topParticipantsService.js` `subscribeRealtimeTopParticipants`
  Peligro: triple listener si ese modulo se monta.

---

## Writes excesivos

- `updateUserActivity(roomId)`
  Cada cuanto: cada 60 segundos por usuario visible.
  Se puede: subir intervalo, apagar en idle real, agrupar o reemplazar por presencia menos rica.

- `updatePrivateChatTypingStatus(chatId, userId, true/false)`
  Cada cuanto: cada ciclo de escritura y timeout de typing.
  Se puede: throttlear mas fuerte o apagar en ventanas minimizadas.

- `sendMessageToPrivateChat`
  Cada cuanto: por mensaje privado.
  Se puede: batch parcial o simplificar inbox/notificaciones.

- `joinRoom` / `leaveRoom`
  Cada cuanto: por entrada/salida.
  Se puede: desacoplar escritura a `tarjetas`.

- `syncPublicUserProfileMirror`
  Cada cuanto: por update de `/users`.
  Se puede: filtrar cambios publicos relevantes antes de escribir espejo.

---

## Cloud Functions costosas

### `enforceRoomRetention`

- Trigger: `rooms/{roomId}/messages/{messageId}` onCreate
- Evento: cada mensaje publico
- Problema: hace lecturas repetidas de mensajes, cutoff, batch delete y borrado de assets
- Riesgo: alto fan-out y costo continuo

### `notifyOnNewMessage`

- Trigger: `private_chats/{chatId}/messages/{messageId}` onCreate
- Evento: cada mensaje privado
- Problema: lee chat y manda push aunque ya existe pipeline de notificacion por callable
- Riesgo: duplicidad funcional

### `notifyOnPrivateChatRequest` y `notifyOnOpinReply`

- Trigger: `users/{uid}/notifications/{notificationId}` onCreate
- Evento: cada notificacion
- Problema: convierten cada write de notificacion en push backend adicional
- Riesgo: fan-out controlado, pero constante

### `syncPhotoPrivilegeFromPresence`

- Trigger: `roomPresence/{roomId}/users/{presenceId}` onCreate
- Evento: cada join elegible en sala principal
- Problema: presencia activa logica de negocio extra
- Riesgo: acoplamiento entre chat y privilegios

### `syncPublicUserProfileMirror`

- Trigger: `users/{uid}` onWrite
- Evento: cualquier cambio de usuario
- Problema: espejo publico y discoverable locations
- Riesgo: amplificacion estructural

---

## Reglas y reintentos

### Hallazgo

No encontre evidencia fuerte de que el costo principal venga por consultas denegadas o retry storm causado por reglas.

### Observaciones

- Las reglas de `roomPresence`, `private_chats`, `systemNotifications`, `opin_posts` y `tarjetas` son permisivas para las lecturas que usa el frontend actual.
- No vi en el codigo un patron sistematico de “si falla, reintento en loop”.
- Si hay costo por reglas, parece secundario frente al costo directo de los listeners y writes.

### Riesgos menores

- Hay varias rutas que usan fallback query si falta indice.
- Algunas consultas hacen lecturas amplias y luego filtran en cliente.
- Eso no parece retry storm, pero si sobrelectura.

---

## Quick wins 24h

### 1. Desactivar el fetch de `obtenerTarjetasRecientes` desde `ChatPage`

- Ahorro estimado: `5% a 15%`
- Dificultad: baja
- Comentario: no tocar Baul visible; solo dejar de leer `tarjetas` como preload de sugerencias en el chat.

### 2. Suspender `private_inbox` y `private_match_state` hasta que el usuario abra la superficie correspondiente

- Ahorro estimado: `10% a 20%`
- Dificultad: media
- Comentario: cargar bajo demanda al abrir `Conecta` o panel de privados.

### 3. Pausar typing y presencia de privados en ventanas minimizadas o fuera de foco

- Ahorro estimado: `5% a 12%`
- Dificultad: media

### 4. Eliminar duplicidad de push en mensaje privado

- Ahorro estimado: bajo en Firestore, medio en ruido funcional
- Dificultad: media

### 5. Mover retencion de sala a job periodico

- Ahorro estimado: `5% a 10%`
- Dificultad: media/alta

---

## Plan 7 dias

### Dia 1-2

- cortar preload de `tarjetas` desde `ChatPage`
- poner `limit` real a `private_inbox` y `private_match_state`
- cargar inbox y match-state solo al abrir superficie

### Dia 2-3

- pausar listeners privados cuando ventana este minimizada
- apagar typing en ventanas ocultas
- evitar `onSnapshot(tarjetas/{partnerId})` si la ventana no esta activa

### Dia 3-4

- unificar pipeline de notificacion de DM
- decidir si se conserva `notifyOnNewMessage` o `dispatchUserNotification('direct_message')`, no ambos

### Dia 4-5

- sacar retencion por mensaje y pasarla a job
- revisar fan-out de inbox privado y reducir writes innecesarias

### Dia 5-7

- separar presencia base de señales enriquecidas
- medir consumo antes/despues con contadores por modulo

---

## Plan 30 dias

- rediseñar presencia para que no toda la sala escuche todo el tiempo
- crear un snapshot sintetico de usuarios disponibles o ranking, en vez de derivarlo en cada cliente
- mover sugerencias/matching a cache backend o documentos precalculados por usuario
- consolidar notificaciones, inbox y match state en una arquitectura unica
- eliminar consultas admin que recorren colecciones completas y reemplazarlas por agregados
- filtrar `syncPublicUserProfileMirror` para que no replique cualquier update de `/users`

---

## Top 3 cambios que darian el mayor ahorro inmediato

1. Reducir drásticamente el costo de `roomPresence`.
   El ahorro grande no vendra de mensajes, sino de bajar lecturas cruzadas de presencia.

2. Sacar las lecturas de `tarjetas` del flujo base de `ChatPage`.
   Hoy el chat esta pagando costo de Baul aunque Baul no sea la experiencia principal.

3. Convertir privados en carga real bajo demanda.
   `private_inbox`, `private_match_state`, typing y ventanas persistentes deben dejar de estar siempre vivos.

---

## Riesgos de escalabilidad

Si el trafico se duplica o triplica sin rediseñar esto:

- el costo de presencia crecera desproporcionadamente,
- privados sumaran listeners por ventana y por usuario,
- el fan-out backend por mensaje seguira multiplicando eventos,
- y el sistema se volvera mas caro incluso si el volumen de mensajes sigue siendo moderado.

El mayor riesgo no es “mas mensajes”.

El mayor riesgo es “mas usuarios conectados al mismo tiempo”.

---

## Conclusion final

### Causa raiz

La causa raiz mas probable hoy es que `Chactivo` trata demasiadas señales como realtime y las monta demasiado pronto:

- presencia,
- disponibilidad,
- typing,
- inbox privado,
- match-state,
- sugerencias basadas en Baul,
- y notificaciones.

### Que no es el problema

No parece que el gasto venga principalmente del listener de mensajes publicos limitado ni de un bug simple de reglas.

### Que si es el problema

El problema real es una arquitectura de costo donde:

- la presencia escribe demasiado,
- demasiadas vistas escuchan demasiado,
- el chat principal carga features secundarias,
- y backend amplifica varios eventos pequeños.

Veredicto:

`Chactivo` no esta gastando como una app “con pocos mensajes”.
Esta gastando como una app que mantiene demasiadas capas sincronizadas en vivo al mismo tiempo.
