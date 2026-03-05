# CHECKLIST_EJECUTABLE_MEJORA_SEO_ONBOARDING_2026-03-05

Fecha base: 2026-03-05  
Proyecto: Chactivo  
Alcance: SEO orgánico + conversión a primer mensaje (onboarding contextual)

## 1) Objetivo y metas

Objetivo principal: subir clics orgánicos y transformar ese tráfico en más primeros mensajes enviados en `/chat/principal`.

Metas al 2026-04-30:
- CTR orgánico global: `3,8% -> 4,8%`
- Clics orgánicos totales: `+20%` vs período comparable
- Tasa de primer mensaje (usuarios orgánicos nuevos): `+15%` mínimo

## 2) Baseline (punto de partida)

Fuente: capturas de Search Console compartidas el 2026-03-05.

- Período: `12 meses`
- Clics: `6,58 mil`
- Impresiones: `171 mil`
- CTR medio: `3,8%`
- Posición media: `5,7`
- Dispositivos:
  - Móvil: `5.383 clics / 140.777 impresiones`
  - Ordenador: `1.154 clics / 29.261 impresiones`
  - Tablet: `43 clics / 1.090 impresiones`
- Páginas destacadas:
  - `https://chactivo.com/` -> `5.007 clics / 135.519 impresiones`
  - `https://www.chactivo.com/` -> `1.391 clics / 33.473 impresiones`
  - `https://chactivo.com/anonymous-forum` -> `92 clics / 886 impresiones`
  - `https://chactivo.com/chat/gaming` -> `33 clics / 348 impresiones`
  - `https://chactivo.com/auth` -> `28 clics / 804 impresiones`

## 3) Checklist ejecutable (por prioridad)

## P0 (ejecutar en 72 horas)

- [x] Consolidar dominio canónico (`chactivo.com` vs `www.chactivo.com`)
Criterio de salida: una sola versión indexable, redirección `301` correcta y canonical coherente.
Evidencia: inspección de URL + prueba manual de redirección.

- [x] Revisar indexación de rutas no SEO (`/auth` y similares)
Criterio de salida: páginas transaccionales en `noindex` si no aportan tráfico cualificado.
Evidencia: meta robots + cobertura GSC.

- [x] Ajustar `title` + `meta description` en homepage y top 10 URLs por impresiones
Criterio de salida: snippets alineados con intención local (`chat gay chile`, `santiago`, `en vivo`).
Evidencia: diff en código + captura de inspección.

- [x] Verificar `sitemap.xml` y `robots.txt`
Criterio de salida: sitemap limpio, URLs canónicas y sin rutas bloqueadas por error.
Evidencia: validación en Search Console.

- [x] Instrumentar eventos onboarding a primer mensaje
Eventos mínimos: `chip_click`, `prompt_click`, `nudge_shown`, `first_message_sent`, `time_to_first_message`.
Criterio de salida: eventos visibles en analytics/log interno.
Evidencia: captura de eventos de prueba.

## P1 (semana 2 y 3)

- [ ] Crear/optimizar landings por intención alta
Prioridad: `chat gay chile`, `video chat gay`, `foro gay`.
Criterio de salida: cada landing con H1 claro, contenido útil real y CTA a chat.

- [ ] Implementar `FAQ schema` donde aplique
Criterio de salida: datos estructurados válidos sin warnings críticos.

- [ ] Mejorar enlazado interno desde home y páginas top a landings estratégicas
Criterio de salida: rutas estratégicas reciben enlaces contextuales visibles.

- [ ] Optimización mobile-first (LCP/INP/CLS)
Criterio de salida: mejora medible de rendimiento móvil en páginas SEO top.

## P2 (semana 4 a 6)

- [ ] Experimentos de copy en onboarding (2 variantes)
Hipótesis: copy contextual por hora/comuna mejora primer mensaje.
Criterio de salida: experimento con resultado medible y decisión de ganador.

- [ ] Mejorar prompts dinámicos por contexto (hora + sala)
Criterio de salida: prompts relevantes y no repetitivos para usuarios nuevos.

- [ ] Reporte semanal único SEO + Conversión
Criterio de salida: tablero con métricas de adquisición y activación en un mismo corte.

## 4) Cadencia de seguimiento

Todos los lunes:
- [ ] Exportar GSC (consultas, páginas, dispositivos)
- [ ] Revisar CTR de top 20 consultas
- [ ] Revisar primer mensaje enviado por canal orgánico
- [ ] Registrar decisiones y cambios en este archivo

Todos los viernes:
- [ ] Cerrar avances de la semana
- [ ] Anotar bloqueos
- [ ] Definir 3 tareas críticas de la próxima semana

## 5) Registro de ejecución

| Fecha | Tarea | Estado | Evidencia |
|---|---|---|---|
| 2026-03-05 | Baseline creado | Completado | Capturas GSC + checklist |
| 2026-03-10 | P0 canónico + snippets | Pendiente | - |
| 2026-03-17 | Landings intención alta | Pendiente | - |

## 6) Riesgos a controlar

- Canibalización por versiones `www` y no `www`.
- Subida de impresiones sin mejora de CTR (títulos/meta poco competitivos).
- Mejoras SEO sin impacto en activación por falta de medición de onboarding.
- Sobre-indexación de páginas de bajo valor (`/auth` u otras rutas técnicas).
