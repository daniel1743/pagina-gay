# Seguimiento Aplicacion Fases Ahorro Firestore 2026-04-19

## Objetivo

Dejar registro claro de que partes del plan de ahorro Firestore ya quedaron aplicadas en codigo.

Este mismo documento deja cerrado el ciclo inicial hasta `Fase 3`.

---

## Estado general

- `Fase 1`: aplicada
- `Fase 2`: aplicada
- `Fase 3`: aplicada
- `Fase 4`: aplicada
- `Fase 5`: pendiente

---

## Fase 1 aplicada

### Resultado

Se aplicaron los tres cortes definidos en la `Fase 1` del plan:

1. sacar `tarjetas` del flujo base de `ChatPage`
2. cortar listener automatico de `private_inbox`
3. cortar listener automatico de `private_match_state`

---

## Cambios realizados

### 1. `ChatPage` ya no carga `tarjetas` al entrar

Archivo:

- `src/pages/ChatPage.jsx`

Cambio aplicado:

- se eliminó la carga de `obtenerTarjetasRecientes(user.id, 45)` desde el flujo base del chat
- se eliminó tambien la hidratacion adicional con `getPublicProfilesByIds(...)`
- el catalogo persistente de sugerencias privadas ahora usa solo cache local si ya existe
- si no hay cache previa, el chat principal no dispara lecturas de Baul ni `tarjetas`

Impacto esperado:

- ahorro inmediato de lecturas al entrar al chat principal
- el chat deja de pagar costo de Baul aunque el usuario no abra Baul

---

### 2. `private_inbox` ya no monta listener en background al entrar

Archivo:

- `src/pages/ChatPage.jsx`

Cambio aplicado:

- el listener de `subscribeToPrivateInbox(user.id, ...)` ya no se monta por defecto
- ahora solo se activa cuando la persona abre una superficie privada real

La activacion ocurre cuando:

- abre `Conecta`
- abre una ventana privada
- inicia una accion explicita de privado

Impacto esperado:

- ahorro alto en lecturas para usuarios que solo entran al chat publico

---

### 3. `private_match_state` ya no monta listener en background al entrar

Archivo:

- `src/pages/ChatPage.jsx`

Cambio aplicado:

- el listener de `subscribeToPrivateMatchState(user.id, ...)` ya no se monta al entrar a la sala
- ahora usa la misma activacion explicita de superficies privadas

Impacto esperado:

- ahorro alto en sesiones donde la persona no entra a privados

---

### 4. Se agregó activacion explicita de superficies privadas

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/chat/ChatBottomNav.jsx`
- `src/components/chat/ChatSidebar.jsx`

Cambio aplicado:

- se agregó `activatePrivateSurfaces()`
- `Conecta` en mobile y sidebar ahora despierta la capa privada solo cuando el usuario la toca
- abrir una ventana privada tambien despierta la capa privada si aun no estaba activa

Objetivo:

- mantener privados bajo demanda y no como costo fijo del chat principal

---

## Verificacion

Comando ejecutado:

```bash
npm run build
```

Resultado:

- build exitosa

---

## Efecto esperado en costo

Con esta fase sola, deberia pasar lo siguiente:

- menor lectura base al entrar a `ChatPage`
- menor consumo diario aunque haya usuarios conectados que no usan privados
- desaparicion del costo automatico de `tarjetas` desde el chat principal

La mayor baja visible deberia venir de:

- menos lecturas en `private_inbox`
- menos lecturas en `private_match_state`
- cero lecturas de `tarjetas` disparadas desde el chat principal

---

## Pendiente para Fase 2

No pendiente. Ya aplicada.

---

## Fase 2 aplicada

### Resultado

Se aplicaron los tres recortes definidos para `Fase 2`:

1. typing privado apagado por defecto
2. listeners privados pausados cuando la ventana queda minimizada
3. `limit` duro para notifications, inbox y match-state

---

## Cambios realizados en Fase 2

### 1. Typing privado apagado por defecto

Archivos:

- `src/config/featureFlags.js`
- `src/components/chat/PrivateChatWindowV2.jsx`

Cambio aplicado:

- se agregó `ENABLE_PRIVATE_TYPING = false`
- `PrivateChatWindowV2` ahora calcula `canUsePrivateTyping`
- si typing está apagado, no se monta listener de typing
- si la persona estaba escribiendo y el modo ahorro desactiva typing, el estado se limpia

Impacto esperado:

- baja de writes efimeros
- baja de lecturas de `roomPresence/private_{chatId}/users`

---

### 2. Ventanas privadas minimizadas ya no mantienen listeners caros

Archivo:

- `src/components/chat/PrivateChatWindowV2.jsx`

Cambio aplicado:

- si `isMinimized === true`, la ventana ya no mantiene:
  - listener de mensajes del chat privado
  - listener de presencia del partner desde `tarjetas/{partnerId}`
  - listener de typing

Objetivo:

- que una ventana minimizada no siga costando como si estuviera abierta en primer plano

Impacto esperado:

- ahorro directo cuando el usuario acumula privados minimizados

---

### 3. Limits duros en notificaciones y bandejas privadas

Archivo:

- `src/services/socialService.js`

Cambio aplicado:

- `notifications`: `limit(30)`
- `private_inbox`: `limit(20)`
- `private_match_state`: `limit(20)`

Adicional:

- inbox ahora consulta ordenado por `updatedAt desc`
- match-state ahora consulta ordenado por `updatedAtMs desc`

Impacto esperado:

- ningún listener de estas superficies puede crecer sin tope
- mejor control de costo por usuario a medida que el historial crece

---

## Fase 3 aplicada

### Resultado

Se aplicaron los tres recortes definidos para `Fase 3`:

1. heartbeat de presencia mucho mas espaciado
2. throttle en memoria para evitar writes repetidos de presencia
3. heartbeat solo mientras la pagina esta visible y el usuario sigue interactuando

---

## Cambios realizados en Fase 3

### 1. Heartbeat de presencia subido a modo ultra ahorro

Archivo:

- `src/services/presenceService.js`

Cambio aplicado:

- `CHAT_AVAILABILITY_HEARTBEAT_MS` subio a `5 min`
- `CHAT_AVAILABILITY_TIMEOUT_MS` quedo en `8 min`
- `ACTIVE_THRESHOLD_MS` quedo en `8 min`

Objetivo:

- reducir de forma fuerte las escrituras de presencia
- dejar de mover snapshots globales de la sala con tanta frecuencia

Impacto esperado:

- menos writes por usuario activo
- menos lecturas cruzadas en `roomPresence/{roomId}/users`

---

### 2. `updateUserActivity` ahora evita escrituras repetidas

Archivo:

- `src/services/presenceService.js`

Cambio aplicado:

- se agrego memoria interna por `roomId:userId`
- se agrego `shouldSkipPresenceWrite(...)`
- `joinRoom`, `setAvailabilityForConversation` y `updateUserActivity` ahora recuerdan la ultima escritura de presencia
- `leaveRoom` limpia esa memoria

Objetivo:

- que una escritura reciente de `joinRoom` o disponibilidad no sea seguida por otro write redundante casi inmediato
- que varios disparos del heartbeat no terminen reescribiendo lo mismo

Impacto esperado:

- menos writes innecesarios
- menos snapshots emitidos a todos los oyentes de presencia

---

### 3. Heartbeat solo con pagina visible y usuario reciente

Archivo:

- `src/pages/ChatPage.jsx`

Cambio aplicado:

- se agrego `PRESENCE_HEARTBEAT_IDLE_GRACE_MS = 3 min`
- el intervalo de presencia ahora corre solo si:
  - la pagina esta visible
  - el usuario estuvo interactuando recientemente
- se mantuvo un refresh inicial liviano al entrar o volver a la pestaña
- ese refresh inicial queda protegido por el throttle agregado en `presenceService`

Objetivo:

- si la persona deja el chat quieto, minimizar writes
- si la pestaña no esta visible, no seguir pagando presencia activa

Impacto esperado:

- baja importante del costo de presencia en sesiones pasivas o pestañas olvidadas

---

## Cierre de las 3 fases

Con `Fase 1`, `Fase 2` y `Fase 3` ya aplicadas, el modo base de ahorro queda asi:

- el chat principal ya no precarga Baul ni `tarjetas`
- privados ya no viven en background si el usuario no abre superficies privadas
- typing privado queda apagado por defecto
- ventanas minimizadas ya no sostienen listeners caros
- inbox, match-state y notifications ya tienen limites duros
- presencia ya no escribe de forma agresiva ni cuando la persona esta idle

---

## Efecto esperado consolidado

Despues de estas tres fases, deberia pasar lo siguiente:

- baja fuerte del consumo base por sesion
- menos lecturas invisibles en usuarios que solo usan el chat publico
- menos churn de `roomPresence`
- menos costo acumulado por privados abiertos o minimizados
- mejor probabilidad de volver a un uso cercano al plan gratis

---

## Fase 4 aplicada

### Resultado

Se aplicaron los tres recortes definidos para `Fase 4`:

1. se eliminó la duplicidad efectiva de push para mensaje privado
2. la retención pesada de salas salió del trigger por mensaje y pasó a proceso por lote
3. el espejo público de usuario dejó de sincronizarse por cambios irrelevantes

---

## Cambios realizados en Fase 4

### 1. Push de DM consolidado en una sola ruta útil

Archivo:

- `functions/index.js`

Cambio aplicado:

- `notifyOnNewMessage` dejó de leer el chat y enviar un push adicional por cada DM
- ahora el camino canónico queda en:
  - `dispatchUserNotification('direct_message')`
  - creación de `users/{uid}/notifications`
  - trigger `notifyOnPrivateChatRequest` para empujar el push correspondiente

Objetivo:

- evitar doble notificación para el mismo mensaje privado
- evitar una lectura backend extra de `private_chats/{chatId}` por cada DM

Impacto esperado:

- menos lecturas backend por mensaje privado
- menos fan-out redundante

---

### 2. Retención de salas movida a scheduler

Archivo:

- `functions/index.js`

Cambio aplicado:

- `enforceRoomRetention` ya no ejecuta el barrido pesado de historial por cada mensaje nuevo
- el trigger por mensaje quedó reducido a:
  - métricas de imagen
  - enforcement de política de imágenes cuando el mensaje realmente es tipo `image`
- se agregó `enforceRoomRetentionScheduled`
- la retención pesada ahora corre cada `15 minutos`

Objetivo:

- cortar el costo estructural de leer y borrar historial completo en cada mensaje público

Impacto esperado:

- baja importante del costo backend en salas activas
- menor amplificación cuando crece el volumen de mensajes

---

### 3. `syncPublicUserProfileMirror` ahora filtra cambios relevantes

Archivo:

- `functions/index.js`

Cambio aplicado:

- se agregó `buildPublicMirrorRelevantSnapshot(...)`
- se agregó `hasRelevantPublicMirrorChange(...)`
- el trigger de espejo público ahora se salta updates irrelevantes de `/users`
- solo sincroniza si cambiaron campos públicos o discoverables que realmente afectan el espejo

Objetivo:

- evitar reescrituras espejo por cambios cosméticos o internos que no impactan el perfil público

Impacto esperado:

- menos writes a `public_user_profiles`
- menos writes a `discoverable_user_locations`

---

## Estado después de Fase 4

Con `Fase 1` a `Fase 4` aplicadas, el ahorro ya cubre:

- chat principal sin precarga de Baúl
- privados bajo demanda
- typing privado apagado
- listeners caros pausados en minimizado
- presence con heartbeat reducido y throttle
- DM sin push duplicado
- retención pública por lote
- espejo público filtrado por cambios relevantes

---

## Nota final

La contención fuerte de costo ya quedó aplicada.

Lo pendiente ahora ya es optimización estructural de siguiente nivel:

- `Fase 5`: docs resumen baratos
- `Fase 5`: cache local como primera capa
- `Fase 5`: `ENABLE_ULTRA_LOW_COST_MODE`
