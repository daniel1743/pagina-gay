# Fase 2 Antievacion Aplicada 2026-04-20

## Objetivo

Endurecer el motor contra dos cosas que todavia escapaban facil:

- reincidencia corta de mensajes sospechosos,
- combinaciones criticas de `menor + contacto/salida`.

La fase 2 mantuvo la misma regla de ahorro:

- nada realtime nuevo,
- nada de listeners,
- nada de docs auxiliares por usuario,
- y backend solo con consulta corta cuando ya existe sospecha.

---

## Lo aplicado

### 1. Reincidencia corta en frontend

Archivo:

- `src/services/antiSpamService.js`

Cambio:

- cada entrada contextual ahora marca mejor si ya era una señal de riesgo,
- el score sube cuando hay varios intentos sospechosos dentro de la misma ventana corta,
- no se depende de una sola regex para bloquear.

Impacto:

- baja el bypass por insistencia de:
  - texto corto,
  - fragmentos de contacto,
  - numeros repartidos,
  - invitaciones repetidas.

Costo:

- cero lecturas nuevas,
- solo memoria local ya existente.

---

### 2. Combinacion critica `menor + contacto/salida` en frontend

Archivo:

- `src/services/antiSpamService.js`

Cambio:

- si el contexto reciente reconstruye menor de edad y ademas ve señales de contacto o salida, se marca como `minor_risk` critico,
- eso endurece la accion sin esperar a una IA ni a una validacion ambigua.

Ejemplos de objetivo:

- `tengo` + `1` + `6` + `escrb`
- `soy menor` + `wsp`
- `cumplo 17` + `hablame afuera`

Impacto:

- protege mejor el caso mas sensible del producto.

---

### 3. Reincidencia corta en backend

Archivo:

- `functions/index.js`

Cambio:

- el backend ahora tambien considera reincidencia contextual cuando ya entro a revisar ventana corta,
- si hay varios intentos sospechosos en pocos minutos, puede escalar a `external_contact`.

Impacto:

- cubre clientes viejos o manipulados,
- sin convertir el backend en un sistema caro de inspeccion completa por cada mensaje.

---

### 4. Combinacion critica `menor + contacto/salida` en backend

Archivo:

- `functions/index.js`

Cambio:

- el trigger critico ahora eleva a `minor_risk` cuando reconstruye menor de edad junto con contacto o salida de Chactivo.

Impacto:

- el enforcement fuerte ya no depende solo del cliente,
- el caso mas sensible queda duplicado tambien en backend.

---

## Criterio de ahorro aplicado

- la query backend sigue siendo corta y condicionada,
- solo corre cuando el mensaje actual ya parece raro,
- no se agregaron colecciones nuevas,
- no se agregaron documentos de buffer,
- no se agrego IA nueva,
- no se agrego fan-out nuevo.

---

## Estado acumulado tras fase 1 + fase 2

Quedo cubierto:

- fragmentacion de numeros,
- plataformas partidas,
- contacto repartido en varios mensajes,
- menor de edad repartido en varios mensajes,
- menor + contacto,
- menor + salida de app,
- insistencia corta de evasion.

---

## Lo que queda para una fase 3 barata

- afinado de falsos positivos con casos reales,
- endurecimiento por usuario reincidente de 24h sin escribir en cada intento,
- mejores razones visibles para admin,
- limpieza de duplicaciones entre heuristica local y backend.
