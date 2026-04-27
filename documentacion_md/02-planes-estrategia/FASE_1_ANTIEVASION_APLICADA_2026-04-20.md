# Fase 1 Antievacion Aplicada 2026-04-20

## Objetivo

Cerrar bypasses baratos de extraccion y menor de edad sin convertir el producto en una app cara de moderar.

La regla aplicada fue esta:

- primero endurecer deteccion local sin lecturas nuevas,
- despues reforzar backend solo para mensajes sospechosos,
- y no agregar listeners, polling ni callables por cada mensaje.

---

## Lo aplicado

### 1. Buffer contextual local mas amplio

Archivo:

- `src/services/antiSpamService.js`

Cambio:

- la ventana de contexto subio de `5` a `8` mensajes recientes,
- la ventana de fragmentacion subio de `3` a `6`,
- sigue siendo cache en memoria,
- no agrega lecturas a Firestore.

Impacto:

- mejora deteccion de intentos fragmentados tipo:
  - `escr`
  - `ibeme`
  - `58`
  - `98`
  - `92`

---

### 2. Reconstruccion contextual de contacto

Archivo:

- `src/services/antiSpamService.js`

Cambio:

- se agregaron fragmentos de contacto y plataforma,
- se detectan bursts de fragmentos de contacto,
- se bloquean mejor secuencias donde la intencion y los numeros van repartidos.

Impacto:

- menos bypass por mensajes cortos consecutivos,
- sin costo adicional en backend.

---

### 3. Reconstruccion contextual de menor de edad

Archivo:

- `src/services/antiSpamService.js`

Cambio:

- ahora se detecta edad menor repartida entre mensajes recientes,
- tambien frases cortadas como:
  - `soy`
  - `meno`
  - `r`

Impacto:

- se bloquea antes del guardado del mensaje,
- se mantiene la sancion critica existente.

---

### 4. Refuerzo backend solo para mensajes sospechosos

Archivo:

- `functions/index.js`

Cambio:

- `enforceCriticalRoomSafety` y `enforceCriticalPrivateChatSafety` ahora hacen una revision contextual solo si el mensaje se ve sospechoso,
- si el mensaje no tiene señales de riesgo, no consulta nada extra,
- si hay sospecha, revisa solo una ventana corta y limitada de mensajes recientes.

Controles de costo:

- query solo bajo sospecha,
- `limit` corto,
- sin listeners,
- sin documento resumen nuevo,
- sin escribir estado contextual por cada mensaje.

Impacto:

- protege contra clientes viejos o manipulados,
- evita convertir toda la moderacion en una lectura adicional permanente.

---

## Lo que NO se hizo en esta fase

- no se agrego IA nueva,
- no se agrego un listener de seguridad,
- no se agrego un doc de contexto por usuario,
- no se movio toda la moderacion a backend,
- no se implemento scoring historico largo.

Eso queda para fases posteriores si hace falta.

---

## Criterio de ahorro aplicado

Esta fase respeta el plan de ahorro:

- cero listeners nuevos,
- cero polling nuevo,
- cero tiempo real adicional,
- cero precarga de contexto desde Firestore en frontend,
- backend solo consulta contexto cuando el mensaje ya trae señales sospechosas.

---

## Resultado esperado

Debe bajar de forma visible la evasion por:

- numeros partidos,
- invitaciones fragmentadas,
- plataformas nombradas en trozos,
- edad menor expresada en varios mensajes,
- mezcla de verbos cortos + digitos.

---

## Siguiente fase recomendada

### Fase 2

- memoria corta de reincidencia mas clara,
- combinaciones criticas:
  - menor + contacto,
  - menor + salida de app,
- endurecimiento de alertas admin,
- afinado de falsos positivos con casos reales.
