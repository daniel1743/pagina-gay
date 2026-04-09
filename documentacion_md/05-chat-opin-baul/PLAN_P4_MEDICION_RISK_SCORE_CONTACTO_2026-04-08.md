# P4: Medicion Y Risk Score De Seguridad De Contacto

**Fecha:** 08-04-2026
**Estado:** aplicado
**Objetivo:** medir los intentos de fuga de contacto y dejar una base cuantitativa para enforcement futuro

---

## 1. Que agrega P4

P4 incorpora dos capas nuevas:

- telemetria de eventos de seguridad de contacto
- acumulacion de `risk score` por usuario

Esto permite pasar de:

- bloqueo sin memoria

a:

- bloqueo con historial
- riesgo acumulado
- base de decision para moderacion posterior

---

## 2. Eventos medidos

P4 registra:

- intentos bloqueados en `OPIN`
- intentos bloqueados en `chat privado`
- solicitud de compartir telefono
- aceptacion de compartir telefono
- rechazo de compartir telefono
- revocacion del telefono compartido

---

## 3. Persistencia aplicada

### Log de eventos

Coleccion:

- `contactSafetyEvents`

Cada evento guarda:

- `userId`
- `eventType`
- `surface`
- `blockedType`
- `riskDelta`
- `chatId`
- `metadata`
- `createdAt`

### Score resumido en perfil

En `users/{userId}` se actualiza:

- `contactSafety.totalEvents`
- `contactSafety.blockedAttempts`
- `contactSafety.blockedAttemptsOpin`
- `contactSafety.blockedAttemptsPrivate`
- `contactSafety.shareRequests`
- `contactSafety.shareAccepted`
- `contactSafety.shareRejected`
- `contactSafety.shareRevoked`
- `contactSafety.riskScore`
- ultimos metadatos de evento

---

## 4. Logica de riesgo inicial

Version actual:

- bloqueo en `OPIN` con telefono: `+4`
- bloqueo en `OPIN` por otro contacto externo: `+3`
- bloqueo en privado con telefono: `+3`
- bloqueo en privado por otro contacto externo: `+2`

Los eventos de compartir / aceptar / revocar se miden pero no suben el score.

---

## 5. Uso esperado

P4 no sanciona por si solo.

P4 deja lista la base para:

- panel admin
- alertas de abuso
- reducción de visibilidad
- límites progresivos
- sanciones futuras

---

## 6. Resultado esperado

Con P4 deberia quedar visible:

- quien insiste en sacar gente fuera de la app
- donde ocurre mas la fuga
- si la proteccion mueve a compartir contacto por flujo formal en vez de por texto libre

