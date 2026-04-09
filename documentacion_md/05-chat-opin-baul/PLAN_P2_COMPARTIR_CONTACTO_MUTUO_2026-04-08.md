# P2: Compartir Contacto Con Consentimiento Dentro Del Privado

**Fecha:** 08-04-2026
**Estado:** aplicado
**Objetivo:** reemplazar el intercambio libre de telefono por un flujo controlado de solicitud y aceptacion dentro del chat privado

---

## 1. Alcance de P2

P2 se aplica solo a:

- chat privado directo entre dos personas

P2 no se aplica todavia a:

- grupos privados
- OPIN publico
- desbloqueo de links o redes sociales fuera del flujo formal

---

## 2. Regla de producto

El contacto no se entrega por escribirlo libremente.

El flujo correcto pasa a ser:

1. se alcanza confianza minima del chat
2. una persona pulsa `Compartir mi telefono`
3. la otra persona acepta o rechaza
4. solo si acepta, el sistema revela el telefono dentro del chat

Esto convierte el contacto en una accion con consentimiento, no en una fuga.

---

## 3. Umbral minimo heredado de P1

Antes de permitir la solicitud formal:

- minimo `10 minutos` de antiguedad del chat
- minimo `3 mensajes por lado`

Si no se cumple, sigue activo el bloqueo temprano de contacto libre.

---

## 4. Runtime aplicado

### Servicio

Se agregan dos operaciones nuevas en `socialService`:

- `requestPrivateChatContactShare`
- `respondToPrivateChatContactShare`

### Estado guardado en el chat

En `private_chats/{chatId}` quedan trazas de:

- `contactShareRequests`
- `contactShareVisibility`

La visibilidad concedida no publica el telefono en el feed ni lo mueve fuera del perfil del usuario.

### Fuente del dato revelado

En esta version P2 el dato revelado es:

- `phone` del perfil del usuario

Si el usuario no tiene telefono guardado:

- no puede iniciar la solicitud

---

## 5. UX aplicada

Dentro del privado directo ahora existe:

- estado de elegibilidad para compartir contacto
- boton `Compartir mi telefono`
- tarjeta para aceptar o rechazar solicitud entrante
- panel visible cuando el telefono ya fue compartido

Ademas:

- el chat muestra eventos de sistema cuando se solicita, acepta o rechaza
- el inbox del privado refleja esos eventos como ultimo estado

---

## 6. Resultado esperado

Con P2 deberia ocurrir esto:

- menos intercambio improvisado por texto libre
- mas control del usuario sobre cuando revelar su telefono
- mas coherencia entre seguridad y UX
- mas permanencia dentro de Chactivo antes del salto a contacto externo

---

## 7. Limites de esta version

P2 todavia no incluye:

- boton multi-canal para WhatsApp / Telegram / Instagram
- expiracion automatica del permiso
- revocacion del contacto una vez aceptado
- version para grupos privados

El siguiente nivel natural seria:

- revocacion
- expiracion temporal
- soporte para mas de un tipo de contacto
