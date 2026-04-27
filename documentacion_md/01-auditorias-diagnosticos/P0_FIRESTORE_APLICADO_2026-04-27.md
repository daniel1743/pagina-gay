# P0 Firestore Aplicado 2026-04-27

## Objetivo

Aplicar el recorte `P0` sobre Firestore para bajar costo base sin romper:

- chat publico principal,
- seguridad critica,
- inbox y privados minimos,
- ni el flujo de apertura real de conversaciones.

---

## Veredicto corto

`P0` quedó aplicado y desplegado.

Se atacaron tres fugas reales:

1. `roomPresence` escuchaba demasiado.
2. la presencia escribia mas de lo necesario.
3. `private_inbox` y `private_match_state` quedaban vivos demasiado tiempo despues de abrir superficies privadas.

Ademas se saco un listener realtime secundario dentro del privado visible.

---

## Cambios aplicados

### 1. Presencia de sala recortada

Archivo:

- [presenceService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js:42)

Cambios:

- se agrego `ROOM_USERS_LISTENER_LIMIT = 60`
- `subscribeToRoomUsers(...)` ya no escucha la subcoleccion completa
- ahora escucha:
  - `orderBy('lastSeenMs', 'desc')`
  - `limit(60)`

Evidencia:

- [presenceService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js:313)

Impacto esperado:

- menos lecturas por cambio de presencia
- menos fan-out cuando cambia la sala
- menos costo cuando hay usuarios conectados aunque no hablen

---

### 2. Heartbeat de presencia mas lento

Archivo:

- [presenceService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js:44)

Cambio:

- `CHAT_AVAILABILITY_HEARTBEAT_MS` paso de `5 min` a `8 min`

Impacto esperado:

- menos escrituras de presencia por usuario visible
- menor churn de `lastSeenMs`
- menor propagacion de cambios en listeners de presencia

Riesgo controlado:

- se mantuvo `CHAT_AVAILABILITY_TIMEOUT_MS = 12 min`
- sigue existiendo margen operativo para no perder la presencia base inmediatamente

---

### 3. Inbox y match-state privados ya no quedan vivos por tiempo indefinido

Archivo:

- [ChatPage.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx:146)

Cambio:

- se agrego `PRIVATE_SURFACES_WARM_WINDOW_MS = 10 min`
- se agrego memoria de ultima activacion:
  - [ChatPage.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx:1369)
- se agrego gating real:
  - [ChatPage.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx:1583)

Nueva regla:

- `private_inbox` y `private_match_state` solo escuchan si:
  - el usuario activo superficies privadas recientemente,
  - o hay chats privados abiertos,
  - o hay request/toast privado vivo,
  - y la pagina esta visible.

Evidencia:

- [ChatPage.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx:5692)
- [ChatPage.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx:5712)

Impacto esperado:

- menos listeners privados “pegados” durante toda la sesion
- menos lecturas silenciosas de `users/{uid}/private_inbox`
- menos lecturas silenciosas de `users/{uid}/private_match_state`

---

### 4. Presencia del partner en privado dejo de ser realtime

Archivo:

- [PrivateChatWindowV2.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/chat/PrivateChatWindowV2.jsx:751)

Cambio:

- se reemplazo `onSnapshot(doc('tarjetas', partnerId))`
- por `getDoc(...)` puntual al abrir/restaurar la ventana visible

Impacto esperado:

- menos listeners permanentes por chat privado visible
- menor costo por ventanas privadas abiertas
- se conserva informacion base del partner sin mantener suscripcion viva

---

## Lo que no toque en este P0

Para no romper el nucleo, no se toco:

- listener principal de mensajes del chat publico
- envio de mensajes
- moderacion critica
- `subscribeToNotifications`
- seguridad anti-extraccion
- escritura base de `private_chats/{chatId}/messages`

Tampoco se elimino aun:

- carga secundaria desde discovery / `tarjetas`
- `dispatchUserNotification` restante
- limpieza de `admin-room-history`

---

## Validacion

Comandos ejecutados:

```powershell
npm run build
firebase deploy --only hosting
```

Resultado:

- `build` OK
- deploy OK
- hosting activo en:
  - `https://chat-gay-3016f.web.app`

---

## Impacto esperado en costo

Este `P0` deberia bajar sobre todo:

- lecturas de presencia
- escrituras repetidas de presencia
- listeners privados residuales
- listeners secundarios por privado visible

No resuelve todo el costo.

Lo mas importante que todavia queda para `P1`:

1. sacar cargas secundarias desde `ChatPage`
2. revisar `recordTarjetaInteraction`
3. revisar si discovery / Baul se monta sin necesidad en flujo de chat
4. revisar `dispatchUserNotification` remanente

---

## Conclusion final

`P0` ya ataco la parte mas clara del exceso realtime sin desarmar el producto.

La reduccion mas importante aplicada fue esta:

> `Chactivo ya no mantiene la misma cantidad de presencia y privados vivos por defecto; ahora escucha menos, escribe menos y deja de sostener superficies privadas inactivas por tiempo indefinido.`
