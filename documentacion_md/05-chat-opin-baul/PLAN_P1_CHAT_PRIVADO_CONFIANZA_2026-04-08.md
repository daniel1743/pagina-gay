# Plan P1 Chat Privado por Confianza

**Fecha:** 2026-04-08  
**Objetivo:** retrasar contacto externo + mantener conversacion dentro de Chactivo + proteger usuarios en fase temprana

---

## 1. Alcance P1

P1 aplica a:

- chat privado 1 a 1
- envio de texto en privado

P1 no aplica todavia a:

- boton formal de compartir contacto
- consentimiento mutuo explicito con reveal
- score de abuso por reincidencia
- grupos con flujo especial de confianza

---

## 2. Regla de producto

En privado temprano no se permite compartir:

- telefonos
- correos
- links
- handles externos
- redireccion explicita a WhatsApp, Telegram, Instagram, Facebook o TikTok

La logica es:

> primero conversan dentro de Chactivo  
> despues, si ya hubo intercambio real, el sistema deja de bloquear ese contenido

---

## 3. Umbral de confianza P1

Se considera confianza minima cuando:

- el chat tiene al menos `10 minutos` de antiguedad
- cada participante envio al menos `3 mensajes`

Antes de eso:

- se bloquea contacto externo
- se muestra mensaje educativo

Despues de eso:

- el bloqueo temprano deja de aplicar

---

## 4. Deteccion P1

Se bloquea en privado temprano si el texto contiene:

- telefono
- email
- link
- handle tipo `@usuario`
- plataforma externa + patron de contacto

Ejemplos:

- `+56912345678`
- `mi wsp es...`
- `ig: pepe123`
- `telegram ...`
- `wa.me/...`

---

## 5. UX esperada

### Microcopy de bloqueo

`Por seguridad, todavía no pueden compartir telefonos, redes ni links en este chat. Primero conversen un poco dentro de Chactivo.`

### Hint en caja de mensaje

`Al inicio evita compartir telefono o redes. Primero conversen dentro de Chactivo.`

---

## 6. Efecto esperado

- menos fuga inmediata a WhatsApp
- mas mensajes dentro del privado interno
- menos riesgo para usuarios nuevos
- mejor embudo desde OPIN a privado real

---

## 7. Siguiente fase sugerida

P2:

- boton `Compartir contacto`
- solicitud + aceptacion mutua
- reveal controlado
- analitica dedicada de desbloqueo

