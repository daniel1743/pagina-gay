# P1 Costo Aplicado 2026-04-27

## Objetivo

Aplicar el `P1` de ahorro sobre:

- `dispatchUserNotification`
- `recordTarjetaInteraction`
- y residuos de `Baul/tarjetas`

sin romper:

- solicitudes privadas reales,
- reapertura de privados,
- ni el flujo central del chat.

---

## Veredicto corto

`P1` quedó aplicado y desplegado.

Se recortaron dos fugas importantes:

1. las notificaciones opcionales ya no disparan la callable `dispatchUserNotification`
2. `Baul` ya no queda solo “escondido en la UI”; ahora también queda apagado a nivel de servicio

---

## Cambios aplicados

### 1. Allowlist real para `dispatchUserNotification`

Archivo:

- [userNotificationDispatchService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/userNotificationDispatchService.js:4)

Nueva regla:

solo siguen habilitadas estas acciones:

- `direct_message`
- `private_chat_request`
- `private_chat_request_response`
- `private_chat_reopened`
- `private_group_invite_request`
- `private_group_invite_rejected`
- `private_group_chat_ready`

Todo lo demas ahora se omite localmente con:

- `skipped: true`
- `reason: disabled_for_cost_control`

Impacto esperado:

- menos invocaciones de callable
- menos `OPTIONS + POST`
- menos ruido en notificaciones secundarias

---

### 2. Comentarios de perfil quedaron pausados de forma explicita

Archivos:

- [socialService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/socialService.js:1996)
- [UserActionsModal.jsx](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/chat/UserActionsModal.jsx:220)

Cambio:

- si `profile_comment` queda fuera del allowlist, ya no se finge exito
- ahora el flujo devuelve `PROFILE_COMMENTS_DISABLED`
- el modal muestra mensaje claro:
  - `Comentarios pausados`

Motivo:

- mejor degradar de forma honesta que aparentar entrega sin notificar al destinatario

---

### 3. `Baul` apagado tambien a nivel de runtime, no solo en rutas

Archivo:

- [tarjetaService.js](/C:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js:35)

Cambios:

- `recordTarjetaInteraction` no se llama si `ENABLE_BAUL === false`
- `actualizarEstadoOnline(...)` no escribe en `tarjetas` si `Baul` esta deshabilitado
- `obtenerTarjetasCercanas(...)` retorna `[]`
- `obtenerTarjetasRecientes(...)` retorna `[]`
- `obtenerMiActividad(...)` retorna `[]`
- `obtenerMetricasTarjeta(...)` retorna `null`
- `suscribirseAMiTarjeta(...)` retorna unsubscribe vacio

Impacto esperado:

- cero llamadas residuales a `recordTarjetaInteraction`
- cero writes de `estaOnline/ultimaConexion` en `tarjetas` desde presencia del chat
- cero lecturas accidentales de `tarjetas` si alguna superficie residual intenta cargar `Baul`

---

## Qué funcionalidades quedan efectivamente recortadas

Quedan recortadas o pausadas:

- comentarios de perfil
- replies de OPIN por notificación callable
- notificaciones de ticket
- bienvenida de sistema por callable
- métricas/interacciones de `Baul`
- sincronización online hacia `tarjetas` cuando `Baul` está apagado

Se mantienen:

- solicitudes privadas
- respuestas a solicitudes privadas
- reapertura de privados
- invitaciones grupales privadas

---

## Validación

Comandos ejecutados:

```powershell
npm run build
firebase deploy --only hosting
```

Resultado:

- build OK
- deploy OK
- hosting activo en:
  - `https://chat-gay-3016f.web.app`

---

## Lectura operativa

Este `P1` no baja tanto el costo realtime como el `P0`.

Lo que baja aquí es:

- invocaciones a Functions por eventos sociales no núcleo
- writes indirectos a `tarjetas`
- lecturas/acciones residuales de `Baul`

Es un recorte de:

- fan-out opcional
- callable social
- y residuos de producto desactivado

---

## Conclusión final

`Chactivo` ya no paga por capas sociales secundarias que hoy no sostienen el núcleo.

La frase correcta es:

> `P1 dejó vivas solo las notificaciones privadas críticas y apagó Baul también en runtime, evitando llamadas y escrituras que seguían existiendo aunque la feature ya estaba deshabilitada en la interfaz.`
