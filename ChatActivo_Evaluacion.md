# ChatActivo_Evaluacion

Fecha del análisis: 2026-03-04  
Alcance: evaluación técnica del estado actual, sin implementar cambios de código.

## 1) Resumen Ejecutivo

Factibilidad general: **alta**, pero con ajustes estructurales obligatorios en seguridad y backend para que sea robusto.

- El proyecto ya tiene base sólida de chat en tiempo real con Firestore y ecosistema de actividad/admin.
- Hoy el chat **no aplica retención por cantidad en backend**; solo limita visualización (50/100 mensajes según tipo de usuario).
- La UI actual de chat **no tiene multimedia activa** (foto/voz comentado), aunque el modelo de mensaje acepta tipos `image` y `voice`.
- Storage está configurado para fotos de perfil/baúl; **no hay rutas/reglas específicas para media efímera de chat**.
- El panel/admin ya tiene piezas reutilizables: recompensas, top participantes, notificaciones del sistema.

Conclusión: se puede implementar el plan solicitado, pero la versión productiva requiere:
1. Retención server-side (Cloud Functions) para cap de 200 + limpieza de archivos.
2. Reglas Firestore/Storage más estrictas para media y privilegios.
3. Métricas de actividad y privilegios con escrituras agregadas (no loops de lecturas masivas).

---

## 2) Arquitectura Actual Detectada

### 2.1 Stack y estructura

- Frontend: React + Vite.
- Backend gestionado: Firebase Auth + Firestore + Storage + Cloud Functions.
- Funciones cloud actuales: push notifications (DM/match/solicitud chat privado).

Archivos observados:
- `src/services/chatService.js`
- `src/pages/ChatPage.jsx`
- `src/components/chat/ChatInput.jsx`
- `src/components/chat/ChatMessages.jsx`
- `src/services/rewardsService.js`
- `src/services/topParticipantsService.js`
- `src/services/systemNotificationsService.js`
- `firestore.rules`
- `storage.rules`
- `functions/index.js`

### 2.2 Flujo de chat actual

- Escritura de mensajes: `rooms/{roomId}/messages`.
- Suscripción realtime: query por `timestamp desc` con `limit(messageLimit)`.
- En `ChatPage` el límite visible es:
  - Invitados/anónimos: 50.
  - Registrados: 100.
- El servicio de chat define `type` de mensaje (`text`, `image`, `voice`, `system`), pero la UI renderiza principalmente `text` y `gif`.

Implicación: existe capacidad parcial en modelo, pero no implementación funcional end-to-end para multimedia efímera.

### 2.3 Retención actual

- No hay mecanismo backend activo para mantener máximo fijo de mensajes por sala.
- No se detectó cron/scheduler de retención automática para `rooms/*/messages`.
- Existen scripts/herramientas manuales de limpieza (admin/scripts), no política automática por mensaje 201.

### 2.4 Seguridad actual relevante

- Firestore rules de `rooms/{roomId}/messages` en modo muy permisivo para create (comentado como temporal/debug).
- Storage rules actuales sólo cubren:
  - `profile_photos/*`
  - `tarjeta_photos/*`
- No hay reglas explícitas para adjuntos de chat efímero.

### 2.5 Módulos reutilizables para fidelización/admin

- Recompensas (`rewards`) ya existentes con aplicación de flags al usuario.
- Top participantes (`featured_participants`) + fallback desde `users.messageCount`.
- Notificaciones internas (`systemNotifications`) con suscripción realtime.
- Analytics diarios (`analytics_stats`) y eventos (`analytics_events`).

---

## 3) Evaluación por Funcionalidad Propuesta

## 3.1 Chat efímero con límite de 200 mensajes

### Estado actual

- Hay límite de lectura en cliente (50/100), no límite real de persistencia.
- No se elimina automáticamente el mensaje más antiguo al crear el 201.

### Factibilidad

**Alta**.

### Arquitectura recomendada

Implementar en backend (Cloud Functions, no cliente):

1. Trigger `onDocumentCreated` en `rooms/{roomId}/messages/{messageId}`.
2. Query de mensajes más antiguos en la sala (`orderBy(timestamp, asc)`).
3. Si count > 200, borrar excedente (`count - 200`) en batch.
4. Si mensaje borrado tiene adjuntos, borrar Storage asociado.

Diseño recomendado de campos en mensaje:
- `media`: array opcional con objetos:
  - `kind`: `image` | `voice`
  - `path`: ruta Storage
  - `contentType`
  - `sizeBytes`
  - `durationSec` (solo voz)

### Riesgos de concurrencia

- Con múltiples escrituras simultáneas pueden correr varios triggers sobre la misma sala.
- Riesgo: doble intento de borrado del mismo documento/archivo.

Mitigaciones:
- Lógica idempotente (si doc/objeto no existe, ignorar error).
- Limpieza por lotes cortos con reintento.
- Opcional: lock liviano por sala (`rooms/{roomId}/meta/retention_lock`) con TTL de segundos.

### Coste operativo

Por cada mensaje:
- 1 write (mensaje).
- Trigger backend de inspección.
- Sólo cuando excede 200: lecturas + deletes adicionales.

Costo crece con volumen, pero es controlable si:
- Se consulta sólo lo mínimo necesario.
- Se borra excedente en batch.

Complejidad estimada: **Media-Alta (6/10)**.

---

## 3.2 Fotos efímeras en chat

### Estado actual

- UI de envío de imagen en chat está comentada.
- No hay ruta de Storage dedicada para media de chat.
- Reglas de Storage no contemplan esta feature.

### Factibilidad

**Alta**, con cambios coordinados de UI + Storage + backend cleanup.

### Arquitectura recomendada

Ruta Storage propuesta:
- `chat_media/{roomId}/{messageId}/{assetId}.jpg`

Flujo:
1. Cliente valida permiso y tipo/tamaño.
2. Sube archivo a Storage.
3. Crea mensaje en Firestore con `type='image'` y metadatos `media[]`.
4. Al borrarse mensaje por retención, función backend borra Storage.

### Seguridad recomendada

- Storage rules: escritura sólo usuario autenticado autorizado.
- Validar `contentType image/*`, tamaño máximo estricto.
- Firestore rules: permitir `type='image'` sólo si usuario tiene permiso activo.

Complejidad estimada: **Alta (7/10)**.

---

## 3.3 Notas de voz efímeras (30s)

### Estado actual

- No hay flujo de grabación/subida/reproducción de voz en chat activo.
- Ícono de audio en input está comentado.

### Factibilidad

**Media-Alta** (factible, más delicado por compatibilidad y validación).

### Formato recomendado

- Primario web: `audio/webm;codecs=opus` (eficiente para voz).
- Fallback Safari/iOS: `audio/mp4`/AAC según soporte de `MediaRecorder`.

### Recomendaciones técnicas

- Duración máxima 30s validada en cliente antes de subir.
- Límite de tamaño en Storage rules (defensa adicional).
- Guardar `durationSec`, `sizeBytes`, `contentType` en `media[]` del mensaje.
- Reproductor ligero en `ChatMessages` para `type='voice'`.
- Cleanup igual que imagen al borrar mensaje.

### Impacto en almacenamiento

- Voz 30s comprimida (Opus) suele ser liviana (decenas a pocos cientos de KB).
- Con retención dura (200 mensajes) el crecimiento de storage queda acotado si cleanup es confiable.

Complejidad estimada: **Alta (8/10)**.

---

## 3.4 Privilegios por actividad (admin habilita foto/voz)

### Estado actual

- Existe panel/admin + sistema de recompensas y flags de usuario.
- Hay ranking/top participantes y métricas base.

### Riesgo importante actual

Las reglas de `users/{userId}` para update del dueño no restringen explícitamente nuevos campos de privilegio personalizados. Si se agregan flags sensibles en `users` sin reforzar reglas, hay riesgo de autoasignación.

### Estructura recomendada

Opción recomendada:
- Colección dedicada `user_privileges/{userId}`
  - `canSendImage: bool`
  - `canSendVoice: bool`
  - `grantedBy`
  - `grantedAt`
  - `expiresAt`
  - `reason`

Reglas:
- Read: usuario dueño + admin.
- Write: sólo admin.

Validación en reglas de mensajes:
- Si `type='image'` o `type='voice'` -> comprobar privilegio en `user_privileges`.

Complejidad estimada: **Media (5/10)**.

---

## 3.5 Fidelización por actividad

### Estado actual reutilizable

Ya existe material útil:
- `messageCount` y `lastMessageAt` en usuario (actualizado desde chat).
- Analytics diario/eventos.
- Top participantes y recompensas admin.
- Notificaciones del sistema.

### Métricas fáciles y baratas de medir

Recomendadas (mínimo viable):
- `daysActiveStreak` (racha diaria).
- `messagesLast7d`.
- `activeDaysLast30d`.
- `distinctRoomsLast7d` (opcional).

### Cómo registrar actividad sin exceso de lecturas

- Escribir agregados por evento (incrementos), evitar consultas masivas por sala/usuario.
- Mantener doc agregado por usuario (`user_activity/{uid}`) y/o por día (`user_activity_daily/{uid_yyyy-mm-dd}`).
- Evitar loops tipo “leer todas las salas/mensajes” para calcular métricas en caliente.

Complejidad estimada: **Media (6/10)**.

---

## 3.6 Notificaciones internas por ganancia/pérdida de beneficios

### Estado actual

- Existe `systemNotifications` con subscribe realtime y lectura por usuario.
- Arquitectura ya apta para mensajes como:
  - “Estás por perder beneficio”
  - “Perdiste beneficio”
  - “Recupéralo conectándote X días”

### Arquitectura recomendada

- Job programado (Cloud Scheduler + Function) diario:
  - evalúa actividad e inactividad.
  - actualiza privilegios/estado.
  - emite notificación en `systemNotifications`.

- Event-driven adicional:
  - cuando admin otorga/revoca privilegio, generar notificación inmediata.

Complejidad estimada: **Media-Baja (4/10)**.

---

## 4) Impacto en Base de Datos y Storage

## 4.1 Firestore

Nuevas entidades recomendadas:
- `user_privileges/{uid}`
- `user_activity/{uid}`
- `user_activity_daily/{uid_yyyy-mm-dd}` (opcional)
- Campos `media[]` en mensajes de chat.

Índices previsibles:
- Mensajes por sala y timestamp (ya existe base para `messages`).
- Consultas por actividad diaria y estado de privilegios.

## 4.2 Storage

Nuevas rutas:
- `chat_media/{roomId}/{messageId}/{assetId}`

Consideraciones:
- Políticas estrictas de tamaño/type.
- Eliminación automática al borrar mensaje (clave para no acumular basura).

---

## 5) Seguridad: Riesgos y Recomendaciones

Riesgos detectados actualmente:
1. Reglas de create en mensajes públicas/permisivas (debug temporal).
2. Storage rules sin cobertura para media de chat.
3. Si privilegios se guardan en `users` sin reglas finas, riesgo de escalamiento por cliente.
4. Cloud Functions actual cubre push, no retención/cleanup de chat.

Recomendaciones clave:
1. Endurecer reglas `rooms/*/messages` (validación de tipo/campos/permisos).
2. Añadir reglas Storage específicas para chat media.
3. Privilegios en colección separada con write sólo admin.
4. Cleanup de mensajes+assets sólo en backend (nunca confiar en cliente).
5. Añadir logging/auditoría de borrados de retención para trazabilidad.

---

## 6) Complejidad Estimada

Por funcionalidad:
1. Chat efímero 200 + cleanup assets: **Media-Alta**.
2. Fotos efímeras: **Alta**.
3. Voz efímera 30s: **Alta**.
4. Privilegios por actividad/admin: **Media**.
5. Fidelización por actividad (métricas agregadas): **Media**.
6. Notificaciones internas de estado de beneficio: **Media-Baja**.

Estimación global (MVP completo bien hecho): **3 a 5 semanas** en iteraciones seguras (incluyendo QA, reglas e instrumentos de monitoreo).

---

## 7) Plan de Implementación Recomendado (sin código, estrategia)

Fase 1 (fundación segura)
- Endurecer reglas Firestore/Storage para mensajería y privilegios.
- Definir modelo de mensaje con `media[]`.
- Implementar retención 200 en backend con cleanup de assets.

Fase 2 (multimedia)
- Activar fotos efímeras end-to-end.
- Activar voz efímera 30s con fallback de formato.

Fase 3 (fidelización y operación)
- Privilegios administrables (`user_privileges`).
- Métricas agregadas de actividad de bajo costo.
- Notificaciones de ganancia/pérdida por scheduler.

Fase 4 (optimización)
- Dashboards admin de actividad y alertas.
- Ajuste fino de costos, límites y antiabuso.

---

## 8) Diagnóstico Final

El proyecto está en un punto donde **sí conviene avanzar** con la propuesta.  
No hay bloqueadores estructurales, pero sí hay deuda técnica de seguridad/retención que debe resolverse primero.

Si se respeta el orden de fases (seguridad -> retención -> multimedia -> privilegios -> fidelización), la implementación es totalmente viable y escalable para el modelo de chat efímero que buscas.
