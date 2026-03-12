# PLAN PROPUESTO (SIN ACTIVAR HASTA ESTAR LISTO) - MIGRACION SUPABASE

Fecha: 2026-03-10
Proyecto: Chactivo
Objetivo: reducir costo inmediato en Firebase y migrar a Supabase sin repetir errores de doble proveedor en produccion.

## 1) Principio rector
- No activar Firebase y Supabase al mismo tiempo para el mismo flujo critico.
- Un solo writer por fase.
- Cutover por etapas con rollback claro.

## 2) Fase A - Optimizacion inmediata (antes de migrar)
Duracion estimada: 3 a 7 dias.

### A1. Cambios aplicados hoy
- Listener compartido de notificaciones por usuario en `systemNotificationsService`.
  - Antes: Header + Panel podian abrir 2 snapshots del mismo usuario.
  - Ahora: 1 snapshot compartido y fan-out local a callbacks.
- Listener compartido de conteo de presencia por sala en `presenceService`.
  - Antes: cada consumidor podia abrir snapshots duplicados de `roomPresence/{roomId}/users`.
  - Ahora: 1 snapshot por sala con multiplexacion local.

### A2. Pendientes P0 (alto impacto en costo)
- Auditar listeners duplicados restantes en chat/presencia/admin.
- Revisar limites de consultas en tiempo real y paginacion de historial.
- Reducir lecturas de notificaciones no leidas (evitar barridos frecuentes de 200 docs).
- Centralizar listeners en servicios compartidos (patron hub) para: chat principal, privados, top participantes.

### A3. KPI de optimizacion
- Reducir lecturas Firestore diarias en 40% a 70%.
- Mantener tiempo de primer render de chat <= 2.5s en red normal.
- Mantener errores de permisos en flujo critico en 0 (login, enviar, privado, notificaciones).

### A4. Guardrails de costo (obligatorio)
- Presupuesto diario con alerta (50%, 80%, 100%).
- Tope mensual duro.
- Dashboard semanal por modulo: chat, presencia, notificaciones, opin, baul.

## 3) Fase B - Preparacion Supabase en sombra (sin activar usuarios)
Duracion estimada: 5 a 10 dias.

### B1. Infra y esquema
- Crear esquema SQL (users, rooms, messages, opinions, notifications, profile_cards, private_chats).
- Definir indices y RLS por tabla.
- Crear buckets de storage y politicas.

### B2. Backfill inicial
- Migrar datos historicos Firebase -> Supabase (script idempotente).
- Verificar por conteo y muestras.

### B3. Sync en segundo plano
- Replicacion unidireccional Firebase -> Supabase.
- Sin lectura productiva desde Supabase todavia.

## 4) Fase C - Migracion gradual por riesgo
Duracion estimada: 7 a 14 dias.

### C1. Bajo riesgo
- Lecturas administrativas/analytics no criticas.
- Feeds secundarios con feature flag de entorno.

### C2. Riesgo medio
- OPIN y notificaciones internas.
- Baul y componentes de perfil no criticos.

### C3. Alto riesgo (final)
- Auth.
- Chat principal realtime.
- Privados y push.

## 5) Cutover final controlado
- Ventana de mantenimiento corta.
- Cambiar writer principal a Supabase.
- Dejar Firebase en fallback solo lectura por 7 a 14 dias.
- Si KPI cae o errores suben: rollback inmediato al writer Firebase.

## 6) Checklist Go/No-Go
- Reglas RLS validadas por pruebas automatizadas.
- Paridad funcional 100% en staging (auth, chat, privados, notificaciones, media).
- Costo estimado validado contra baseline Firebase.
- Plan de rollback probado.

## 7) Riesgos y mitigacion
- Riesgo: doble autenticacion activa.
  - Mitigacion: auth provider unico por entorno y por fase.
- Riesgo: mensajes duplicados por dual-write.
  - Mitigacion: writer unico + idempotencia por `clientId`.
- Riesgo: latencia en realtime.
  - Mitigacion: pruebas de carga y tuning de indices/canales antes de cutover.

## 8) Estado actual
- Estrategia definida: optimizar primero, migrar despues.
- Cambios de optimizacion inicial ya aplicados en servicios de presencia y notificaciones.
- Siguiente paso recomendado: auditoria de lecturas por modulo (48h) para priorizar P0/P1.
- Operacion actual: Firebase sigue como base principal (writer activo) con `VITE_ENABLE_SUPABASE=false` hasta completar Fase B/C.
