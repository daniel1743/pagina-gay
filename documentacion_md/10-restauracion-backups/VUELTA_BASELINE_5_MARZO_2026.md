# VUELTA_BASELINE_5_MARZO_2026

Fecha/hora de corte: 2026-03-05 (America/Santiago)  
Proyecto: Chactivo  
Propósito: dejar una referencia exacta del estado actual para volver a este punto si se requiere.

## 1) Snapshot técnico de referencia

- Commit `HEAD` al momento del corte:
  - `4728354eec87cc418607faff5c96f9ee280177d5`
- Estado del worktree al momento del corte: limpio en archivos versionados.
- Archivos locales fuera de git (esta documentación):
  - `CHECKLIST_EJECUTABLE_MEJORA_SEO_ONBOARDING_2026-03-05.md`
  - `restauracion importante/VUELTA_BASELINE_5_MARZO_2026.md`

## 2) Snapshot funcional (producto)

Estado funcional relevante (según `ONBOARDING_INVISIBLE_CONTEXTUAL_IMPLEMENTADO.md`, 2026-02-22):
- Onboarding contextual no bloqueante en chat principal.
- Chips opcionales de rol/comuna sobre input.
- Prompts de primer mensaje que rellenan sin autoenviar.
- Micro-nudge al focus (1 vez por sesión, 4 segundos).
- Header con actividad real (activos 5 min y mensajes 10 min).
- Persistencia de `roleBadge` y `comuna` en flujo de mensajes.

Storage de referencia:
- localStorage:
  - `chactivo:role`
  - `chactivo:comuna`
- sessionStorage:
  - `chactivo:onboarding:dismissed`
  - `chactivo:onboarding:first_message_sent`
  - `chactivo:onboarding:focus_nudge_shown`

## 3) Snapshot SEO (Search Console)

- Período: `12 meses`
- Clics: `6,58 mil`
- Impresiones: `171 mil`
- CTR medio: `3,8%`
- Posición media: `5,7`
- Hallazgo clave: coexistencia de `https://chactivo.com/` y `https://www.chactivo.com/` con tráfico separado.

## 4) Procedimiento recomendado para poder volver exactamente a este punto

1. Crear rama de checkpoint:

```bash
git switch -c backup/baseline-2026-03-05
```

2. Guardar snapshot completo:

```bash
git add -A
git commit -m "checkpoint: baseline 2026-03-05 onboarding + seo"
git tag baseline-2026-03-05
```

3. (Opcional) Subir respaldo remoto:

```bash
git push origin backup/baseline-2026-03-05 --tags
```

## 5) Cómo volver al baseline después de cambios futuros

Opción segura (sin perder trabajo nuevo):

```bash
git switch -c restore/from-baseline-2026-03-05 baseline-2026-03-05
```

Opción de volver rama actual al baseline (solo si estás seguro):

```bash
git switch <tu-rama>
git reset --hard baseline-2026-03-05
```

## 6) Validaciones mínimas al restaurar

- Build:

```bash
npm run build
```

- QA funcional base:
1. Entrar a `/chat/principal` en incógnito.
2. Confirmar chips y prompts visibles.
3. Confirmar que prompt rellena input sin enviar.
4. Enviar primer mensaje y verificar ocultación de onboarding.
5. Recargar y validar persistencia de rol/comuna.
6. Confirmar badge de rol en mensajes.

## 7) Documentos relacionados

- `ONBOARDING_INVISIBLE_CONTEXTUAL_IMPLEMENTADO.md`
- `CHECKLIST_EJECUTABLE_MEJORA_SEO_ONBOARDING_2026-03-05.md`
