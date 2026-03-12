# PLAN_300_DAU_90_DIAS_CHACTIVO

Fecha: 2026-02-22  
Proyecto: Chactivo  
Objetivo: llegar a 300 DAU reales en 90 días sin bots, sin inflar métricas y sin aumentar fricción.

## 1) North Star y métricas

### Objetivos finales (día 90)
- DAU: `>= 300`
- First Message Rate: `>= 35%`
- D1 Retention: `>= 30%`
- Peak Concurrent Users (5 min): `>= 40`

### Definiciones operativas (obligatorio estandarizar)
- `DAU`: usuarios únicos con al menos 1 evento útil en 24h (`room_joined`, `message_sent`, `opin_post_created`, `private_chat_opened`).
- `First Message Rate`: `% de usuarios que entran a sala y envían 1er mensaje en <= 10 min`.
- `D1 Retention`: `% de usuarios del día N que vuelven en día N+1`.
- `Peak Concurrent`: máximo de usuarios únicos activos en ventana rolling de 5 min.

## 2) Reglas duras (guardrails)
- No se habilitan bots ni seed fake.
- No se usan boosts de actividad para decisiones de negocio.
- No se incrementa fricción de onboarding.
- No se abren más salas si DAU real `< 300`.
- No se escala SEM si retención D1 `< 25%`.

## 3) Fases con criterio de avance

## FASE 0 (Semana 1): Estabilidad técnica
Objetivo: base sólida antes de meter tráfico.

### Trabajo
- Mover Gemini/API sensibles a backend (eliminar `VITE_` secrets en cliente).
- Rate limiting por `userId + IP` para endpoints de IA.
- Cerrar `permission-denied` residual en invitados.
- Mantener gating por `authReady` en presence/tarjeta/suscripciones.

### DoD
- Consola limpia de errores críticos en sesión invitado/registrado.
- 0 errores de permisos en flujo normal.
- Sin caídas de UI por race de auth.
- Costo API estable en test de carga.

### Gate para pasar a Fase 1
- 3 días consecutivos con error rate crítico `< 1%`.

## FASE 1 (Semanas 2-3): Concentración y activación
Objetivo: `100-120 DAU`.

### Trabajo
- Sala principal como destino dominante + máximo 1 temática.
- Evento diario fijo 18:00-20:00 con countdown real.
- Mostrar “hora pico real” (analytics).
- Sistema Tema del Día rotativo cada 24h.
- Optimización semanal de prompts de primer mensaje.

### Experimentos
- A/B textos de prompt inicial (4 variantes).
- A/B banner de evento (copy directo vs copy social proof).

### Metas
- DAU: `>= 120`
- First Message Rate: `>= 30%`
- Peak usuarios en evento: `>= 20`

### Gate para pasar a Fase 2
- FMR >= 30% durante 7 días.

## FASE 2 (Semanas 4-6): Reactivación inteligente
Objetivo: `200 DAU`.

### Trabajo
- Push inteligente solo si:
  - 3+ activos en 5 min
  - 5+ mensajes en 10 min
  - usuario activo en últimas 24h
- Exit-intent en sala vacía para suscripción a recordatorio.
- Contador real “personas distintas hoy”.
- Rachas de ingreso (3 y 7 días) sin gamificación falsa.

### Metas
- DAU: `>= 200`
- D1: `>= 30%`
- Push CTR: `>= 8%`
- Peak evento: `>= 30`

### Gate para pasar a Fase 3
- D1 >= 30% por 2 semanas.

## FASE 3 (Semanas 6-10): SEO + SEM sincronizado con evento
Objetivo: `800-1000 visitas/día` y `250 DAU`.

### Trabajo
- SEO: mejorar intent principal en landings:
  - `chat gay chile`
  - `chat gay santiago`
  - `foro gay chile`
- Forzar UTMs en todas las campañas.
- Ads solo 90 min antes de evento (evitar gasto en horas muertas).

### Metas
- Visitors/day: `>= 1000`
- Activation rate: `>= 30%`
- DAU: `>= 250`

### Gate para pasar a Fase 4
- Conversion por fuente atribuible con UTMs en >= 90% del tráfico pago.

## FASE 4 (Semanas 10-12): Efecto red y microcomunidades
Objetivo: `300 DAU` sostenido.

### Trabajo
- Micro-salas geo destacadas dinámicamente (no fragmentar si poca masa).
- Badge de moderación visible en horario evento.
- Visual de horas top en sidebar.
- Reporte semanal automático (DAU, D1, D7, msg/usuario).

### Metas
- DAU: `>= 300`
- Retención semanal: `>= 45%`
- Msg por usuario activo: `>= 5`

## 4) Backlog priorizado (orden recomendado)

1. Estabilidad/auth/rules/errores consola (bloqueante).  
2. Concentrar tráfico + evento fijo + prompts onboarding.  
3. Push inteligente + exit-intent + rachas.  
4. SEO técnico + copy + UTMs + ads por ventana.  
5. Microcomunidades y visual analytics in-product.

## 5) Cadencia operativa (sugerida)

### Diario (15 min)
- DAU, concurrencia, errores críticos, FMR.

### Semanal (60 min)
- Cohorte D1/D7, ranking de prompts, rendimiento evento 18:00-20:00.
- Decisiones: mantener, escalar o matar experimentos.

### Quincenal
- Review SEO/SEM por source conversion.
- Ajuste de presupuesto ads según retorno por franja.

## 6) Dashboard mínimo obligatorio
- `dau_daily`
- `retention_d1_d7_cohort`
- `peak_concurrent_5m`
- `first_message_rate`
- `push_sent_vs_open_vs_return`
- `source_to_signup_to_first_message` (UTM)

## 7) Alertas automáticas
- DAU cae >20% WoW.
- FMR <25% por 3 días.
- D1 <25% por 7 días.
- Error rate crítico >2% por 1 hora.

## 8) Plan de contingencia
- Si sube tráfico y baja retención:
  - reducir adquisición paga 30-50%.
  - reforzar evento y activación in-product.
  - no abrir features nuevas que fragmenten.
- Si sube retención pero no DAU:
  - acelerar SEO/SEM en ventanas de alta conversión.
  - mejorar copy above-the-fold y CTA de entrada inmediata.

## 9) Resultado esperado por mes
- Mes 1: `120 DAU`
- Mes 2: `200 DAU`
- Mes 3: `300 DAU`

## 10) Siguiente escalón (post 300 DAU)
- Objetivo: `1000 DAU`
- Requisitos:
  - eventos simultáneos por segmentos,
  - reputación básica de usuario,
  - segmentación por intención/ubicación sin aumentar fricción.

