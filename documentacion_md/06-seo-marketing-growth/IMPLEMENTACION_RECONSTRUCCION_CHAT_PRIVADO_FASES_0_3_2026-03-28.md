# Implementación Reconstrucción Chat Privado Fases 0-3 + Ajustes UI (28-03-2026)

## Objetivo
Reconstruir el chat privado sin romper lo que ya estaba funcionando.

La decisión tomada fue:

- no migrar todavía a una colección nueva
- mantener `private_chats` como base actual
- extender el modelo por capas
- agregar persistencia real de bandeja
- dejar la UI leyendo primero la nueva capa y usando fallback del sistema anterior

La regla principal de esta implementación fue:

- avanzar sin retroceder
- no apagar flujos existentes
- no hacer un reemplazo total de una sola vez

---

## Estrategia aplicada

Se siguió la ruta 2:

- conservar `private_chats`
- endurecer reglas y writes
- agregar metadatos compatibles con la arquitectura nueva
- crear `users/{userId}/private_inbox/{conversationId}` como nueva capa persistente
- conectar la UI a `private_inbox` como fuente preferida
- dejar notificaciones y recents actuales como respaldo temporal

---

## Fase 0. Estabilización de base actual

### Problema atacado
El flujo de envío privado podía romperse por permisos en la raíz del chat o por datos inconsistentes entre usuario autenticado, participantes y documento del chat.

### Cambios implementados
- se habilitó actualización controlada del documento raíz de `private_chats/{chatId}`
- se limitaron los updates permitidos a metadatos seguros del chat
- se agregó validación defensiva en envío de mensaje para detectar:
  - `AUTH_USER_MISMATCH`
  - `CHAT_NOT_FOUND`
  - `USER_NOT_CHAT_PARTICIPANT`
  - `EMPTY_TEXT_MESSAGE`

### Resultado esperado
- menos `Missing or insufficient permissions`
- menos fallos silenciosos al enviar mensaje
- más claridad de diagnóstico cuando algo falla

---

## Fase 1. Extensión compatible de `private_chats`

### Problema atacado
El modelo anterior servía para abrir y enviar mensajes, pero no dejaba lista la estructura necesaria para una bandeja persistente, bloqueo por conversación o estado de conversación más sólido.

### Cambios implementados
Se agregaron campos compatibles al documento `private_chats/{chatId}`:

- `status`
- `updatedAt`
- `acceptedBy`
- `blockedBy`
- `lastSeenMessageId`

Estos campos se siembran ahora en:

- creación de chat 1 a 1
- reutilización de chat existente
- creación/reutilización de chat grupal
- aceptación de solicitud privada
- envío de mensaje de texto
- envío de imagen

### Resultado esperado
- preparar la base sin romper la UI existente
- permitir que las siguientes fases lean estado más rico sin rehacer backend desde cero

---

## Fase 2. Creación de `private_inbox`

### Problema atacado
La bandeja de privados dependía todavía de `localStorage` y de señales derivadas de notificaciones.
Eso no era suficientemente persistente ni confiable entre sesiones o dispositivos.

### Cambios implementados
Se creó una nueva capa persistente:

- `users/{userId}/private_inbox/{conversationId}`

Propósito de esta capa:

- guardar preview real de conversación
- guardar timestamp de último mensaje
- guardar `unreadCount`
- tener una bandeja persistente por usuario
- servir como base de mobile footer y sidebar desktop

Se implementaron helpers en servicio para:

- obtener perfiles de participantes
- construir entrada de inbox
- sincronizar inbox de todos los participantes

La sincronización del inbox se dispara ahora cuando:

- se crea un chat
- se reutiliza un chat existente
- se acepta una solicitud
- se envía un mensaje
- se envía una imagen

### Rules agregadas
Se añadieron reglas para `private_inbox` dentro de `users/{userId}`:

- lectura solo para el dueño
- creación/update permitidos a participantes de esa conversación
- borrado permitido al dueño

### Resultado esperado
- bandeja persistente real
- base más sólida para unread, previews y reenganche

---

## Fase 3. UI conectada a `private_inbox`

### Problema atacado
La UI seguía dependiendo principalmente de `recentPrivateChats` y de unread derivados de notificaciones, no de una fuente persistente de conversación por usuario.

### Cambios implementados
Se agregó suscripción en tiempo real al inbox:

- `subscribeToPrivateInbox(userId, callback)`

Se agregó marcado de conversación como leída al abrirla:

- `markPrivateInboxConversationRead(userId, conversationId)`

#### Integraciones realizadas

##### 1. `ChatPage`
- se suscribe a `private_inbox`
- guarda `privateInboxItems` en estado
- marca `unreadCount = 0` al abrir un chat
- pasa `privateInboxItems` a componentes hijos

##### 2. `ChatBottomNav`
- ahora usa `private_inbox` como fuente preferida para:
  - historial de conversaciones
  - preview
  - badge de unread
- mantiene fallback del sistema anterior si falta data

##### 3. `ChatSidebar`
- ahora usa `private_inbox` como fuente preferida para accesos rápidos de privados
- mantiene fallback de recents/open chats actuales

### Resultado esperado
- bandeja móvil más persistente
- sidebar desktop más coherente
- unread menos dependiente de notificaciones sueltas
- transición gradual sin apagar el sistema anterior

---

## Ajuste complementario. Limpieza del chat principal

### Problema atacado
La sala principal estaba visualmente sobrecargada y el acceso al privado competía con el contenido del mensaje.

### Cambios implementados
- se limpió la cabecera del mensaje en sala principal
- se quitó la comuna de la vista principal de cada mensaje
- se redujo la cantidad de chips visibles a uno principal
- se mantuvieron señales secundarias como premium/verificado con menor peso visual
- se eliminó la apertura de privado desde el toque directo sobre la burbuja
- se agregó un microacceso discreto al privado en el bloque de identidad del usuario
- se añadió un hint de descubrimiento de una sola vez para explicar cómo abrir un privado
- se reordenó el modal de acciones para dar prioridad visual a `Chat privado`

### Resultado esperado
- menos ruido visual en la sala
- más foco en el mensaje
- descubrimiento del privado sin romper la densidad del chat

---

## Ajuste complementario. Chat privado premium

### Problema atacado
La ventana privada seguía teniendo dos fallos graves:

- UX de burbujas todavía demasiado altas para una mensajería premium
- apertura local en el emisor sin señal visible equivalente en el receptor

### Cambios implementados

#### 1. Señal remota de apertura/reenganche
- se agregó `signalPrivateChatOpen(...)`
- al abrir o reabrir un privado desde la sala o desde el modal de usuario, ahora se emite una notificación compartida `private_chat_reopened`
- el receptor escucha esa señal y abre el chat como ventana minimizada visible
- se dejó trazabilidad con logs de depuración del flujo compartido

#### 2. Minimizado real del chat privado
- se agregó estado `isMinimized` al contexto global del privado
- se incorporaron acciones `minimizePrivateChat(...)` y `restorePrivateChat(...)`
- se agregó botón de minimizar en la cabecera de `PrivateChatWindowV2`
- al minimizar, la conversación se colapsa a un dock inferior persistente
- al restaurar, se conserva el borrador y se intenta restaurar la posición de scroll previa

#### 3. Compactación visual de burbujas
- se redujo padding vertical interno
- se aumentó el ancho útil de burbuja
- se compactó la metadata de hora + checks
- en mensajes de texto, la metadata quedó integrada al final del contenido en vez de empujar una fila pesada debajo
- se redujo la altura visual por mensaje para acercarla más a una lógica tipo WhatsApp / Telegram

### Resultado esperado
- mejor uso horizontal del panel privado
- menos altura por mensaje
- sensación de mensajería más madura y premium
- receptor con señal visible en tiempo real sin depender de adivinar quién abrió el privado

---

## Qué se mantiene activo para no romper nada

Durante estas fases NO se eliminó:

- `private_chats`
- `direct_message`
- `private_chat_request`
- `private_chat_accepted`
- `recentPrivateChats` en `localStorage`
- listener global de notificaciones
- ventana privada V2

Esto se dejó así a propósito para tener:

- compatibilidad hacia atrás
- fallback si falla la capa nueva
- menor riesgo de regresión

---

## Archivos tocados en estas fases

### Backend / reglas
- `firestore.rules`
- `src/services/socialService.js`

### Estado / integración
- `src/pages/ChatPage.jsx`
- `src/contexts/PrivateChatContext.jsx`

### UI que ya lee `private_inbox`
- `src/components/chat/ChatBottomNav.jsx`
- `src/components/chat/ChatSidebar.jsx`

### UI ya existente que sigue siendo parte del sistema actual
- `src/components/chat/ChatMessages.jsx`
- `src/components/chat/ChatMessages.css`
- `src/components/chat/UserActionsModal.jsx`
- `src/components/chat/PrivateChatWindowV2.jsx`
- `src/components/chat/GlobalPrivateChatWindow.jsx`
- `src/components/chat/PrivateChatDirectMessageToast.jsx`

---

## Cambios funcionales visibles para producto

### Ya debería mejorar
- reenganche en conversaciones existentes
- consistencia entre conversación, preview y badge
- persistencia de bandeja más allá del `localStorage`
- menos riesgo de enviar mensaje y que no quede reflejado en el estado del chat
- descubrimiento del privado dentro de la sala principal
- compactación visual de la ventana privada
- posibilidad real de minimizar y restaurar el privado sin cerrarlo
- señal compartida de apertura/reenganche del privado entre ambos usuarios

### Todavía no se considera final
- bloqueo real por conversación
- persistencia completa de minimizado/apertura también en backend
- reemplazo total del fallback anterior
- limpieza final de legacy

---

## Verificación realizada

### Build
Se ejecutó repetidamente:

```powershell
npm run build
```

Resultado:

- compilación correcta con `vite build`
- sin errores de sintaxis en las fases implementadas

### Reglas
La implementación requiere reglas publicadas en Firebase para que `private_inbox` funcione correctamente.

Comando usado / requerido:

```powershell
firebase deploy --only firestore:rules --project chat-gay-3016f
```

---

## Qué queda pendiente después de Fase 3

### Fase 4 recomendada
- mover la reacción remota del privado a una capa totalmente global, no solo al flujo actual del chat
- persistir `isOpen` e `isMinimized` de forma coherente también en backend/inbox
- unificar lectura de unread desde inbox
- reforzar `read/delivered` con semántica más real de conversación
- agregar bloqueo real por conversación usando `blockedBy`
- pulir cierre/minimizado sin destruir estado

### Limpieza futura
- decidir cuándo dejar de depender de `recentPrivateChats`
- decidir cuándo reducir dependencia de `direct_message` como fuente de estado
- consolidar definitivamente la fuente de verdad en:
  - `private_chats`
  - `private_inbox`

---

## Conclusión
No se hizo una migración brusca.

Se hizo una reconstrucción por capas:

- primero estabilizar
- luego sembrar metadatos compatibles
- luego crear bandeja persistente
- luego conectar la UI a esa bandeja

Eso deja el chat privado en una situación bastante mejor que antes:

- más defendible técnicamente
- más persistente
- más preparado para UX tipo WhatsApp
- más cercano a una experiencia premium real
- sin haber desmontado de golpe el sistema anterior

La base ya no depende solo de la ventana abierta o de notificaciones aisladas.
Ahora existe una estructura intermedia real sobre la que se puede seguir construyendo sin retroceder.
