# Fase 2 Ahorro Cloud Functions Aplicada 2026-04-27

## Objetivo

Reducir el siguiente nivel de gasto sin tocar moderacion critica ni romper el flujo principal de notificaciones.

---

## Cambios aplicados

### 1. Analitica callable desactivada en frontend

Archivo:

- `src/services/analyticsService.js`

Cambio:

- se dejo `ANALYTICS_CALLABLE_ENABLED = false`
- `trackEvent(...)` ya no llama `trackAnalyticsEvent`

Resultado:

- la app deja de generar llamadas constantes a Cloud Functions por:
  - `page_view`
  - `page_exit`
  - `session_start`
  - `session_end`
  - `room_joined`
  - `message_sent`
  - y eventos similares

Impacto esperado:

- baja fuerte de invocaciones
- baja de `OPTIONS` y `POST` por CORS

---

### 2. `trackAnalyticsEvent` retirado del backend

Archivo:

- `functions/index.js`

Cambio:

- se elimino el export de `trackAnalyticsEvent`

Resultado:

- la function deja de existir como superficie activa del producto

---

### 3. `syncPublicUserProfileMirror` deja de reaccionar a contadores volatiles

Archivo:

- `functions/index.js`

Cambio:

- `hasRelevantPublicMirrorChange(...)` ya no considera:
  - `favoritesCount`
  - `profileViews`

Resultado:

- el espejo publico no se vuelve a sincronizar por cada cambio de favoritos o vistas
- se conservan sincronias por cambios realmente estructurales del perfil

Impacto esperado:

- menos writes derivados en `public_user_profiles`
- menos writes derivados en `discoverable_user_locations`

---

## Lo que no se toco

Se mantuvo:

- `dispatchUserNotification`
- `notifyOnPrivateChatRequest`
- `notifyOnOpinReply`
- `enforceCriticalRoomSafety`
- `enforceCriticalPrivateChatSafety`

---

## Validacion

### Local

- `node --check functions/index.js`
- `npm run build`

Resultado:

- valido

---

## Despliegue requerido

Para que Fase 2 quede real en produccion:

- borrar `trackAnalyticsEvent`
- desplegar `syncPublicUserProfileMirror`
- desplegar hosting con frontend actualizado
