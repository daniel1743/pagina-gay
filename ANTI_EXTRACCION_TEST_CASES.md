# ANTI_EXTRACCION_TEST_CASES

Fecha: 2026-03-10
Motor: `src/services/antiSpamService.js`

## 1) Debe bloquear (mensaje individual)

- `buscame en telegram`
- `tg?`
- `t g`
- `grupo de tg`
- `te espero en chat latino`
- `mi numero es 987654321`
- `agregame al 56912345678`
- `fb juan.perez`
- `instagram: usuario123`
- `wa.me/56912345678`
- `correo: algo@gmail.com`

Esperado:
- `allowed: false`
- `type` en `forbidden_word | phone_number | email`
- `reason` generico (no filtrar regla exacta)

## 2) Debe bloquear por contexto (fragmentacion)

### Caso A
1. `mi tg`
2. `es`
3. `pepito123`

### Caso B
1. `569`
2. `123`
3. `4567`

### Caso C
1. `te paso mi`
2. `telegram`
3. `usuario`

Esperado:
- Ultimo mensaje bloqueado por score contextual
- `matchedRules` incluye alguna regla `fragmented_*` o `invitation_*`

## 3) Debe permitir

- `hola como estan`
- `me gusta el grupo`
- `que tal tu dia`
- `alguien de santiago?`
- `uso fotos de perfil aqui?`

Esperado:
- `allowed: true`

## 4) Casos borde (validar que NO bloquee de forma agresiva)

- `iglesia`
- `telegrama`
- `facebookear`

Esperado:
- Idealmente `allowed: true` salvo que haya contexto sospechoso adicional

## 5) Sancion progresiva esperada

- 1ra infraccion: bloquea mensaje + advertencia
- 2da infraccion: bloqueo temporal (60 min)
- 3ra infraccion: suspension temporal (24 h)
- Shadowban: opcional, desactivado por defecto en config

## 6) Verificacion de enforcement real

Intentar enviar desde UI un mensaje bloqueado y confirmar:
- El mensaje NO se persiste en Firestore (`rooms/{roomId}/messages`)
- `sendMessage` lanza `code: content-blocked`
- `ChatPage` muestra toast de bloqueo sin exponer regla interna

## 7) Verificacion de rules Firestore

Intentar escribir directo (cliente manipulado) con:
- `https://t.me/...`
- `wa.me/...`
- telefono de 7+ digitos

Esperado:
- `permission-denied` por `hasNoExternalContactIntent(...)`
