# P3: Contacto Temporal Y Revocable En Privado

**Fecha:** 08-04-2026
**Estado:** aplicado
**Objetivo:** evitar que el permiso de contacto quede abierto para siempre una vez aceptado

---

## 1. Que agrega P3

P3 se monta sobre `P2` y agrega dos controles:

- vigencia temporal del telefono compartido
- revocacion manual desde el mismo chat privado

---

## 2. Regla nueva

Cuando una persona acepta ver el telefono de la otra:

- el permiso dura `24 horas`
- el titular del telefono puede revocarlo antes

Eso cambia el modelo de:

- permiso permanente

a:

- permiso puntual
- reversible
- con menor riesgo si la confianza cambia

---

## 3. Runtime aplicado

### Persistencia

El estado de visibilidad ya no depende solo de un booleano.

Ahora guarda:

- `allowed`
- `grantedAt`
- `expiresAtMs`

### Revocacion

Se agrega la operacion:

- `revokePrivateChatContactShare`

Cuando se ejecuta:

- se elimina la visibilidad activa
- el chat registra evento de sistema
- el inbox refleja el cambio

---

## 4. UX aplicada

En el privado directo:

- si ves el telefono compartido, tambien ves que es temporal
- si compartiste tu telefono, aparece boton `Revocar`
- si vence o se revoca, deja de mostrarse

---

## 5. Resultado esperado

Con P3 el contacto compartido deja de ser una fuga irreversible.

Deberia mejorar:

- sensacion de control
- seguridad post-match
- coherencia del discurso de privacidad

---

## 6. Lo que aun no cubre

P3 todavia no incluye:

- renovacion manual del permiso sin rehacer solicitud
- expiraciones por canal distinto
- auditoria o analytics fina del uso del boton
- notificaciones push especificas de revocacion o expiracion
