# FASE A - AUDITORIA DE LISTENERS FIRESTORE (P0/P1)

Fecha: 2026-03-11
Proyecto: Chactivo
Objetivo: reducir lecturas Firestore y listeners duplicados antes de migracion a Supabase.

## 1) Alcance auditado
- Busqueda de listeners realtime (`onSnapshot`) y wrappers `subscribeTo*` en `src/services`, `src/pages`, `src/components`.
- Priorizacion por impacto esperado en trafico real (pantallas de alto uso).

## 2) Hallazgos principales

### H1 (P0) - Duplicacion en Lobby principal
- Archivo: `src/pages/LobbyPage.jsx`
- Situacion detectada:
  - Listener A: `rooms/principal/messages` con `limit(1)` para ultima actividad.
  - Listener B: `rooms/principal/messages` con `limit(3)` para mensajes recientes.
- Impacto: dos streams realtime sobre la misma coleccion/ruta para el mismo modulo.
- Estado: **RESUELTO hoy**.

### H2 (P1) - Suscripcion de mensajes de chat sin hub compartido global
- Archivo: `src/services/chatService.js`
- Situacion detectada:
  - `subscribeToRoomMessages` abre `onSnapshot` por consumidor sin multiplexacion global por `roomId+limit`.
- Nota:
  - Ya existe cache de snapshot en memoria/sessionStorage para UX, pero no dedup de listeners concurrentes.
- Riesgo: medio. Puede crecer en pantallas/componentes que consuman misma sala simultaneamente.
- Estado: **RESUELTO hoy (P0 adelantado)**.

### H3 (P1) - Top participants sin listener compartido
- Archivo: `src/services/topParticipantsService.js`
- Situacion detectada:
  - `subscribeTopParticipantsPublic/Admin` crean listener por suscriptor.
- Riesgo: bajo/medio (menos rutas concurrentes), pero recomendable unificar con patron hub.

### H4 (P1) - Featured ads sin listener compartido
- Archivo: `src/services/featuredAdsService.js`
- Situacion detectada:
  - Suscripciones public/admin independientes sin multiplexacion.
- Riesgo: bajo (actualmente un consumidor principal por contexto).

## 3) Cambio aplicado en esta sesion (P0)

### Lobby - consolidacion de listeners
- Archivo modificado: `src/pages/LobbyPage.jsx`
- Cambio:
  - Se elimino el listener separado `limit(1)`.
  - Se dejo un unico listener `limit(3)` y desde ese snapshot se derivan:
    - `lastMessageTimestamp` (primer elemento)
    - `recentMessages` (si corresponde)
- Resultado esperado:
  - Menos listeners activos por usuario en lobby.
  - Menos lecturas asociadas a actualizaciones de `rooms/principal/messages`.

### Telemetria de listeners activos
- Archivos modificados:
  - `src/utils/listenerMonitor.js` (nuevo)
  - `src/services/chatService.js`
  - `src/services/presenceService.js`
  - `src/services/socialService.js`
  - `src/services/systemNotificationsService.js`
- Cambio:
  - Se incorporo un monitor en memoria para contar listeners activos, picos y altas/bajas.
  - Se instrumentaron listeners de alto trafico:
    - chat principal/secundario
    - presencia de sala y contadores compartidos
    - notificaciones de usuario (social)
    - notificaciones del sistema (shared)
  - Ahora `chatService` usa listener compartido por clave `scope+roomId+limit` para `rooms` y `secondary-rooms`.
- Comandos de consola para seguimiento:
  - `window.getListenerMetrics({ includeActiveListeners: true })`
  - `window.printListenerMetrics()`
  - `window.resetListenerMetrics()`
  - `window.enableListenerMonitorLogs()` / `window.disableListenerMonitorLogs()`

## 4) Prioridad siguiente recomendada

### P0 inmediato (siguiente iteracion)
1. Medir 24-48h con `listenerMonitor` para confirmar reduccion de picos y detectar nuevas duplicaciones.
2. Priorizar siguiente deduplicacion por impacto en datos de medicion (ej. top participants o anuncios destacados).

### P1
1. Aplicar patron hub en `topParticipantsService`.
2. Aplicar patron hub en `featuredAdsService` si se confirma multi-consumo simultaneo.

## 5) Criterio de exito Fase A
- Reducir listeners duplicados en rutas de alto trafico (lobby/chat principal).
- Mantener paridad funcional sin regresiones UX.
- Preparar base de medicion para comparar costo antes/despues.
