# Mapa Total Costos Chactivo 2026-04-27

## Objetivo

Consolidar en un solo documento:

- todo lo que hoy genera costo en `Chactivo`,
- que es indispensable,
- que es prescindible,
- y que deberia cortarse primero si la prioridad es bajar gasto al minimo.

---

## Veredicto ejecutivo

Hoy `Chactivo` no gasta principalmente por “tener muchos mensajes”.

Gasta por arquitectura:

- demasiado realtime en Firestore,
- demasiados listeners y heartbeats,
- fan-out de privados y notificaciones,
- Functions auxiliares que se despiertan mucho,
- y algunas capas secundarias que siguen vivas aunque no dominen la experiencia principal.

### Orden real de impacto probable

1. `Firestore realtime + presencia`
2. `Cloud Functions`
3. `Storage de imagenes`

### Conclusión corta

- **Lo mas caro hoy parece ser Firestore**
- **Lo segundo mas caro parece ser Functions**
- **Storage hoy no parece ser la fuga principal**

---

## 1. Todo lo que genera costo

## A. Firestore

Genera costo por:

- lecturas realtime,
- listeners persistentes,
- re-suscripciones,
- escrituras frecuentes,
- lecturas amplias,
- queries admin,
- y duplicidad de superficies montadas al mismo tiempo.

### Fuentes principales de costo Firestore

#### 1. `roomPresence`

Archivos:

- `src/pages/ChatPage.jsx`
- `src/services/presenceService.js`

Costo:

- listener de sala completo
- heartbeat por usuario visible
- cambios de presencia que pegan a todos los clientes escuchando

Estado:

- **indispensable solo en forma minima**
- **la implementacion actual era demasiado cara**

#### 2. Privados siempre vivos

Archivos:

- `src/pages/ChatPage.jsx`
- `src/services/socialService.js`
- `src/components/chat/PrivateChatWindowV2.jsx`

Costo:

- `users/{uid}/private_inbox`
- `users/{uid}/private_match_state`
- `private_chats/{chatId}/messages`
- typing y presencia privada

Estado:

- **parcialmente indispensable**
- inbox/chat si
- typing/presencia extra no necesariamente

#### 3. Sugerencias y Baul desde el chat

Archivos:

- `src/pages/ChatPage.jsx`
- `src/services/tarjetaService.js`

Costo:

- lecturas de `tarjetas`
- lecturas de perfiles publicos
- carga de discovery aunque el usuario no entre realmente a Baul

Estado:

- **prescindible en flujo base del chat**

#### 4. Notificaciones de usuario

Archivos:

- `src/services/socialService.js`
- `src/pages/ChatPage.jsx`

Costo:

- listeners permanentes
- writes derivados por mensajes privados y eventos sociales

Estado:

- **indispensable solo en su capa minima**

---

## B. Cloud Functions

Generan costo por:

- triggers por mensaje,
- jobs programados,
- callables HTTP con `OPTIONS + POST`,
- cold starts,
- fan-out backend,
- escrituras derivadas.

### Lo que ya generaba costo fuerte

#### Jobs programados

- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `revokePhotoPrivilegeForInactivity`

#### Triggers por evento muy frecuente

- `notifyOnNewMessage`
- `archiveRoomMessageForAdminHistory`
- `syncPhotoPrivilegeFromPresence`
- `syncPublicUserProfileMirror`

#### Callables ruidosas

- `trackAnalyticsEvent`
- `dispatchUserNotification`

---

## C. Storage

Genera costo por:

- almacenamiento,
- descargas,
- operaciones de upload,
- operaciones de lectura,
- operaciones de borrado.

### Estado real hoy

Bucket:

- `chat-gay-3016f.firebasestorage.app`

Medicion real:

- `29.13 MB` almacenados
- `1,820` objetos
- `~222 MB` servidos en 7 dias
- `10,225` operaciones en 7 dias

Lectura correcta:

- **si cuesta**
- **pero hoy no parece ser el centro del problema**

---

## 2. Que es indispensable

## Indispensable de verdad

### Seguridad critica

- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `antiSpamService`
- `privateChatSafetyService`
- `opinSafetyService`

Motivo:

- protegen menores,
- contacto externo,
- coercion,
- plataformas externas,
- y riesgo real.

### Chat publico base

- listener principal de mensajes del chat publico
- escritura de mensajes
- limpieza de media asociada a borrados reales

Motivo:

- sin esto no hay producto central

### Inbox y privados minimos

- `private_chats`
- `private_inbox`
- solicitudes privadas reales

Motivo:

- son parte del valor central de conectar usuarios

### Espejo publico solo si el producto lo necesita

- `syncPublicUserProfileMirror`

Motivo:

- puede ser necesario para discovery/baul/perfiles publicos
- pero solo si se mantiene muy restringido

---

## 3. Que es importante pero reducible

### `dispatchUserNotification`

Estado:

- importante
- pero demasiado caro si se usa para demasiados eventos pequeños

Deberia quedar:

- solo para notificaciones realmente relevantes

No deberia usarse para:

- cada DM
- cada microevento social

### Presence / disponibilidad

Estado:

- util
- pero debe vivir en modo austero

Deberia quedar:

- presencia minima

No deberia seguir:

- heartbeat agresivo
- typing sobre presencia
- señales enriquecidas en el mismo canal

### Storage de chat media

Estado:

- necesario

Pero:

- con compresion fuerte
- limites de subida
- y limpieza correcta

---

## 4. Que es prescindible o cortable

## Ya prescindible

Estas piezas son las mas claramente prescindibles o ya recortadas:

- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `trackAnalyticsEvent`
- `notifyOnNewMessage`
- `archiveRoomMessageForAdminHistory`
- `syncPhotoPrivilegeFromPresence`
- `revokePhotoPrivilegeForInactivity`
- notificacion por cada DM via callable

## Prescindible en el flujo base

- preload de `tarjetas` desde el chat
- capas de typing privadas siempre vivas
- match-state siempre montado
- listeners de ventanas privadas minimizadas o fuera de foco
- admin queries de barrido amplio

## Prescindible si no da valor real de producto

- historial admin en Storage por cada mensaje
- analytics fina por callable
- beneficios automáticos secundarios basados en presencia

---

## 5. Lo que ya quedo reducido

### Fase 1

Se retiraron:

- `notifyOnNewMessage`
- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `archiveRoomMessageForAdminHistory`

### Fase 2

Se retiro:

- `trackAnalyticsEvent`

Y se redujo ruido en:

- `syncPublicUserProfileMirror`

### Fase 3

Se retiraron:

- `syncPhotoPrivilegeFromPresence`
- `revokePhotoPrivilegeForInactivity`

Y se corto:

- notificacion por cada DM via `dispatchUserNotification`

---

## 6. Mapa de prescindibilidad

### Debe quedarse

- moderacion critica
- seguridad anti-extraccion
- chat publico base
- privados base
- limpieza de media borrada

### Debe quedarse, pero recortado

- presencia
- notificaciones
- espejo publico
- storage media

### Puede morir sin matar el nucleo

- analytics callable fina
- jobs promocionales
- historial admin por mensaje
- beneficios automáticos secundarios
- notificaciones por cada DM
- sugerencias secundarias siempre cargadas

---

## 7. Donde atacaria ahora

## Prioridad P0

- reducir aun mas `roomPresence`
- revisar `private_inbox` y `private_match_state`
- pausar listeners privados invisibles

## Prioridad P1

- auditar `dispatchUserNotification`
- decidir si se reemplaza parte por escritura directa controlada o por menos eventos
- revisar `recordTarjetaInteraction`

## Prioridad P2

- limpiar `admin-room-history` restante en Storage
- revisar por que hay `ReadObject FAILED_PRECONDITION`

---

## 8. Conclusion final

### Lo que mas cuesta hoy

- Firestore realtime
- Functions que amplifican eventos

### Lo que no parece estar costando tanto hoy

- Storage de imagenes

### Que puede prescindir Chactivo sin romperse

- jobs promocionales
- analytics por callable
- historial admin por mensaje
- privilegios automaticos de foto
- notificacion por cada DM
- capas secundarias siempre montadas

### Frase final correcta

`Chactivo hoy puede vivir con mucho menos costo si se queda solo con chat, seguridad y privados minimos; casi todo lo promocional, redundante o derivado es prescindible.`
