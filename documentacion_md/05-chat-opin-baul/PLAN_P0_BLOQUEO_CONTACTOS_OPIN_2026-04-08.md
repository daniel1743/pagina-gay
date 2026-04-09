# Plan P0 Bloqueo de Contactos en OPIN

**Fecha:** 2026-04-08  
**Objetivo:** bloquear fuga de contactos + proteger usuarios + mantener interaccion interna

---

## 1. Alcance P0

P0 aplica solo a superficies publicas de OPIN:

- post publico OPIN
- comentarios publicos de OPIN
- render del feed y del modal de comentarios

P0 no implementa todavia:

- sistema de confianza por fases
- desbloqueo mutuo de contacto
- score avanzado de usuario
- shadow ban automatico

---

## 2. Regla de producto

En OPIN publico no se comparten:

- telefonos
- links externos
- usuarios de redes
- menciones directas a WhatsApp, Telegram, Instagram, Facebook o TikTok
- correos electronicos

La narrativa de producto debe ser:

> Aqui puedes conectar sin exponer tu numero.  
> Usa Buzon o chat interno hasta que exista confianza real.

---

## 3. Deteccion P0

### 3.1 Bloqueo duro en escritura

Se bloquea si el texto contiene:

- secuencias numericas con forma de telefono
- emails
- links externos
- referencias explicitas a contacto externo:
  - `whatsapp`
  - `wsp`
  - `wa.me`
  - `telegram`
  - `t.me`
  - `instagram`
  - `ig`
  - `facebook`
  - `fb`
  - `tiktok`
- handles tipo `@usuario`

### 3.2 Sanitizacion de legado

Si ya existe contenido viejo publicado, no se borra en P0.

Se enmascara en UI:

- telefono -> `[contacto oculto por seguridad]`
- email -> `[correo oculto por seguridad]`
- link o red -> `[contacto externo oculto]`

---

## 4. Superficies afectadas

### Escritura

- `createOpinPost`
- `editOpinPost`
- `createStableOpinPost`
- `updateStableOpinPost`
- `addComment`

### Render publico

- tarjetas `OpinCard`
- `OpinCommentsModal`
- bloque `Tu intencion activa`
- bloque `Interesados recientes`
- bloque `Tu actividad`
- bloque `Oportunidades ahora`

### UX de accion rapida

- `Buzon` queda solo con opcion interna
- se eliminan opciones tipo WhatsApp / Instagram / Facebook / TikTok en feed publico

---

## 5. Microcopy P0

### Error de bloqueo

`Por seguridad, no compartas telefonos, redes ni usuarios externos en OPIN. Usa Buzon o chat interno.`

### Ayuda en comentarios

`No compartas telefono ni redes aqui. Usa Buzon o privado dentro de Chactivo.`

### Ayuda en compositor

`No publiques telefonos, WhatsApp ni redes. Primero conversa dentro de Chactivo.`

---

## 6. Criterio de seguridad

P0 prioriza:

- cortar fuga visible
- cubrir contenido legado
- no romper el flujo principal

Por eso la deteccion sera:

- estricta con telefonos, links, emails y redes
- conservadora con frases ambiguas

No se bloquea en P0 solo por palabras generales como:

- `escribeme`
- `hablame`
- `numero`

si no vienen acompanadas de senales mas claras de contacto externo.

---

## 7. KPI a medir despues de P0

- intentos bloqueados por post
- intentos bloqueados por comentario
- porcentaje de OPIN con contacto externo detectado
- uso de `Buzon`
- conversion a comentarios internos tras bloqueo

---

## 8. Siguiente fase sugerida

P1:

- chat privado temprano con advertencia
- compartir contacto solo por consentimiento mutuo
- eventos analiticos dedicados

P2:

- score de usuario
- limites por reincidencia
- desbloqueo de contacto por confianza

