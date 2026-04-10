# P0 Baseline SEO Chile + LATAM

**Fecha:** 2026-04-09  
**Fase:** P0 completada  
**Objetivo:** congelar el punto de partida antes de la consolidacion tecnica e internacionalizacion

---

## 1. Lectura base

La caida de posicion media consolidada **no se interpreta como caida del core Chile**.

La lectura aprobada es:

- la visibilidad total sube
- la home sigue concentrando el crecimiento
- Chile sigue fuerte
- la expansion internacional esta creciendo mas rapido que la arquitectura SEO que hoy la soporta

Frase de trabajo:

**Chactivo no esta cayendo; esta creciendo sin suficiente control de arquitectura por pais.**

---

## 2. Metricas base congeladas

## 2.1 Comparacion 28 dias vs 28 dias anteriores

- clics: `3,55 mil -> 7,1 mil`
- impresiones: `94,9 mil -> 218 mil`
- CTR: `3,7 % -> 3,3 %`
- posicion media: `5,7 -> 6,6`

## 2.2 Core Chile

- `Chile`: `3.149 -> 4.399` clics
- `Chile`: `71.003 -> 79.635` impresiones

Interpretacion:

- Chile no muestra derrumbe
- sigue creciendo, aunque mas lento que la expansion internacional

## 2.3 Expansion internacional

- `Mexico`: `59 -> 711` clics / `3.050 -> 39.673` impresiones
- `Colombia`: `86 -> 405` clics / `3.363 -> 21.405` impresiones
- `Argentina`: `45 -> 186` clics / `9.220 -> 28.734` impresiones
- `España`: `14 -> 160` clics / `490 -> 4.814` impresiones

Interpretacion:

- la expansion ya es real
- todavia no esta suficientemente desacoplada de la home

## 2.4 Pagina principal

- `https://chactivo.com/`: `3.503 -> 7.076` clics
- `https://chactivo.com/`: `94.636 -> 217.518` impresiones

Interpretacion:

- la home sigue siendo el activo SEO principal
- casi todo el salto pasa por `/`

## 2.5 Queries core

- `chat gay`: `889 -> 1.280` clics / `25.391 -> 24.249` impresiones
- `chat gay chile`: `615 -> 635` clics / `10.787 -> 10.376` impresiones
- `chatgay`: `65 -> 216` clics / `5.181 -> 6.131` impresiones
- `gay chat`: `105 -> 124` clics / `3.850 -> 3.645` impresiones
- `video chat gay`: `49 -> 108` clics / `1.367 -> 1.903` impresiones
- `chat gay santiago`: `81 -> 89` clics / `1.801 -> 2.616` impresiones

Interpretacion:

- las queries core no muestran colapso
- varias muestran estabilidad o mejora

---

## 3. Estado tecnico congelado

## 3.1 Lo que ya estaba bien al inicio de P0

- `/` ya esta orientada a Chile
- existen landings pais reales:
  - `/mx`
  - `/ar`
  - `/es`
  - `/br`
- las landings pais ya usan `canonical` propio
- existen superficies SEO secundarias activas:
  - `/global`
  - `/santiago`
  - `/mas-30`

## 3.2 Lo que estaba pendiente al inicio de P0

- `www -> chactivo.com` solo con redirect por JavaScript
- aliases `/modal-*` todavia publicos
- ausencia de `hreflang`
- deuda de alineacion entre rutas, sitemap y robots

---

## 4. Decisiones aprobadas para ejecucion

### Si

- mantener `/` como core Chile
- consolidar aliases `/modal-*`
- resolver `www -> apex` de forma real
- implementar `hreflang` solo para URLs existentes
- ordenar mejor la expansion LATAM sin tocar agresivamente el core

### No por ahora

- mover Chile a `/cl`
- crear `/co` y `/pe`
- apagar `/global`, `/santiago` o `/mas-30` sin auditoria especifica
- hacer reestructuracion total del sitio

---

## 5. Metricas a revisar al cierre

### Chile

- posicion media de `/`
- clics e impresiones de Chile
- rendimiento de:
  - `chat gay`
  - `chat gay chile`
  - `chatgay`
  - `gay chat`
  - `chat gay santiago`

### LATAM

- clics e impresiones por:
  - Mexico
  - Argentina
  - España
  - Brasil
- clics e impresiones de:
  - `/mx`
  - `/ar`
  - `/es`
  - `/br`

### Tecnico

- desaparicion progresiva de aliases `/modal-*`
- consolidacion de host en Search Console
- consistencia entre rutas publicas, sitemap y robots

---

## 6. Conclusiones de P0

P0 cierra con esta conclusion oficial:

- Chile sigue sano
- la home sigue siendo el activo principal
- la expansion LATAM ya existe
- el problema actual es de control de arquitectura, no de caida del core

Por eso el siguiente paso correcto es:

**P1: consolidacion tecnica segura**
