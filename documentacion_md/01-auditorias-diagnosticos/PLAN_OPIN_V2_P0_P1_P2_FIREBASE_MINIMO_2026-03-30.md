# Plan OPIN V2: P0, P1, P2 y Arquitectura Firebase Mínima (30-03-2026)

## Tesis

`OPIN` debe pasar de tablón público a sistema de intención persistente.

La unidad principal deja de ser:

- una publicación

y pasa a ser:

- una intención activa por usuario

---

## Decisión de arquitectura mínima

### P0 no crea colecciones nuevas

Para no disparar costos ni meter migraciones innecesarias, el `P0` debe apoyarse en:

- `opin_posts`
- `opin_comments`
- counters ya existentes en cada nota

### Reglas de costo para P0

- no feed realtime
- no listeners globales
- no subcolecciones nuevas para el loop principal
- no fanout de vistas individuales
- una query principal de feed paginado
- una query adicional de `mis notas` por sesión para propiedad y retorno

### Por qué esta base es suficiente

Porque ya permite:

- detectar intención activa
- mostrar counters resumidos
- cerrar o cambiar estado
- construir un bloque `Tu intención activa`

sin abrir todavía una arquitectura más compleja.

---

## P0

### Objetivo

Corregir el fallo principal actual:

- falta de propiedad
- falta de motivo claro para volver
- feed demasiado aleatorio

### Qué entra

- solo 1 intención activa por usuario
- bloque `Tu intención activa`
- CTA de edición/gestión sobre la intención activa
- feed priorizado por intención abierta + actividad + recencia
- límite de feed más bajo para reducir lecturas

### Qué no entra todavía

- bandeja avanzada de interesados
- matching asincrónico
- persistencia de seguidos en backend
- señales sociales complejas

### Firebase mínimo para P0

- `opin_posts` sigue siendo la fuente principal
- una query de feed
- una query de `mis notas`
- counters atómicos ya existentes

---

## P1

### Objetivo

Convertir OPIN en sistema de oportunidades, no solo de exposición.

### Qué entra

- bandeja de interés por intención
- historial claro de intenciones
- separación visible entre:
  - activa
  - pausadas
  - cerradas
- persistencia real de `Seguidos`

### Firebase recomendado para P1

- agregar `user_intent_state`
- opcionalmente agregar `intent_following`
- mantener eventos resumidos, no feed realtime

### Regla de costo

- no guardar todos los views como eventos individuales
- agrupar señales pasivas
- solo persistir interacciones con valor real

---

## P2

### Objetivo

Convertir OPIN en embudo principal de conexión asincrónica.

### Qué entra

- ranking más inteligente
- diversidad de usuarios
- matching asincrónico por intención
- radar humano

### Firebase recomendado para P2

- mantener resúmenes precalculados
- evitar recomputar ranking leyendo universos grandes
- preparar salidas para migrar ranking pesado fuera de Firestore si escala

---

## Ejecución recomendada

### Orden

1. ejecutar `P0`
2. medir retención y retorno
3. ejecutar `P1`
4. dejar `P2` solo cuando `P0/P1` prueben valor real

### KPIs de control

- % usuarios con intención activa
- retorno a OPIN en 24h / 72h
- % intención -> privado
- tiempo a primera interacción
- lecturas promedio por sesión en OPIN

---

## Veredicto ejecutivo

La arquitectura mínima correcta hoy es:

- no rehacer OPIN completo
- no meter realtime
- no abrir colecciones nuevas en `P0`
- reforzar propiedad y retorno usando la base ya existente

Ese es el camino con mejor relación entre:

- impacto de producto
- velocidad de ejecución
- riesgo técnico
- costo Firebase
