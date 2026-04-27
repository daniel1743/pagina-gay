# Fase 3 Ahorro Cloud Functions Aplicada 2026-04-27

## Objetivo

Recortar invocaciones y autoscaling residuales en Firebase Functions sin tocar:

- moderacion critica,
- alertas de seguridad,
- solicitudes privadas importantes,
- ni flujos admin indispensables.

---

## Cambios aplicados

### 1. Se retiro `syncPhotoPrivilegeFromPresence`

Motivo:

- se disparaba por `roomPresence/{roomId}/users/{presenceId}`,
- arrancaba instancias por eventos de presencia,
- y en los logs predominaba:
  - `autoEligible=false`
  - `adminGranted=false`

Conclusion:

Era churn caro con poco valor operativo real.

### 2. Se retiro `revokePhotoPrivilegeForInactivity`

Motivo:

- job horario,
- consulta recurrente a `chat_photo_privileges`,
- escrituras derivadas + `systemNotifications`,
- feature secundaria frente al costo.

Conclusion:

No justificaba seguir corriendo como automatizacion permanente.

### 3. Se desactivo la notificacion por cada mensaje privado

Archivo:

- `src/services/socialService.js`

Cambio:

- `notifyPrivateChatRecipients(...)` ahora queda apagado por flag local.

Motivo:

- cada DM disparaba `dispatchUserNotification`,
- eso generaba `OPTIONS + POST`,
- mas verificacion callable,
- mas cold starts y autoscaling.

Conclusion:

Se corta el fan-out mas ruidoso, pero se mantiene:

- inbox privado,
- apertura de chat,
- solicitudes privadas,
- y notificaciones mas importantes.

---

## Impacto esperado

- menos invocaciones HTTP callable,
- menos `OPTIONS` CORS,
- menos arranques de instancias,
- menos triggers por presencia,
- menor costo base residual en Functions.

---

## Riesgos asumidos

### Foto privilegio automatico

Ya no se concede ni revoca automaticamente por presencia/inactividad.

Queda:

- gestion manual/admin si se necesita.

### Notificacion por cada DM

El usuario ya no recibe esa notificacion extra por cada mensaje privado mediante callable.

Queda:

- flujo del chat privado,
- inbox privado,
- y otras notificaciones no masivas.

---

## Validacion realizada

- `node --check functions/index.js`
- `npm run build`
- borrado de functions en produccion
- deploy de hosting

---

## Veredicto

Fase 3 aplicada con foco correcto:

- se recorto costo residual alto,
- sin tocar la moderacion critica,
- ni romper el nucleo del chat.
