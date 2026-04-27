# Fase 1 Ahorro Cloud Functions Aplicada 2026-04-27

## Objetivo

Aplicar el primer recorte de costo en Cloud Functions sin tocar moderacion critica ni notificaciones principales.

---

## Cambios aplicados en codigo

Se retiraron estos exports desde `functions/index.js`:

- `notifyOnNewMessage`
- `sendPeakHourConnectionReminders`
- `sendEventReminderPushes`
- `archiveRoomMessageForAdminHistory`

---

## Motivo de retiro

### `notifyOnNewMessage`

- trigger por cada mensaje privado
- costo recurrente
- valor redundante frente a otras rutas de notificacion

### `sendPeakHourConnectionReminders`

- job programado
- escaneo de usuarios inactivos
- bajo retorno observado

### `sendEventReminderPushes`

- job cada `5 min`
- frecuencia demasiado alta para feature secundaria

### `archiveRoomMessageForAdminHistory`

- corre por cada mensaje publico
- agrega pipeline admin/storage no esencial para operacion base

---

## Lo que no se toco

Se mantuvo intacto:

- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`
- `dispatchUserNotification`
- `notifyOnPrivateChatRequest`
- `notifyOnOpinReply`
- `cleanupPrivateChatMessageMedia`
- `cleanupRoomMessageMedia`

---

## Validacion local

- `node --check functions/index.js`

Resultado:

- sintaxis valida

---

## Siguiente paso operativo

Para que el ahorro sea real en produccion:

- borrar estas functions desplegadas desde Firebase
- verificar despues que ya no aparezcan en `firebase functions:list`
