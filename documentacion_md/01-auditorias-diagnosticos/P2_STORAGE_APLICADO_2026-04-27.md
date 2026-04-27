# P2 Storage Aplicado 2026-04-27

## Objetivo

Cortar el uso residual de `Storage` en el flujo admin y reducir la probabilidad de `ReadObject FAILED_PRECONDITION`.

---

## Cambios aplicados

### 1. `generateAdminRoomHistoryReport` ya no lee `admin-room-history`

Archivo:

- `functions/index.js`

Cambio:

- el callable admin dejó de descargar JSONs desde `admin-room-history/raw/...`
- ahora consulta directo a `rooms/{roomId}/messages`
- la consulta queda:
  - bajo demanda
  - acotada
  - sin depender de archivos legacy en `Storage`

Impacto:

- se cortan lecturas de `Storage` desde el panel admin
- se reduce una causa plausible del ruido `ReadObject FAILED_PRECONDITION`

### 2. Se eliminó la function programada residual

Function eliminada:

- `cleanupAdminRoomHistoryArchive`

Motivo:

- ya no conviene sostener una tubería de archivo admin separada
- el historial admin dejó de depender de `Storage`
- mantener un scheduler diario para esa ruta dejó de justificar costo y complejidad

### 3. Se ajustó el texto del panel admin

Archivo:

- `src/components/admin/AdminRoomHistoryPanel.jsx`

Cambio:

- la UI ya no habla de “archivo admin separado”
- ahora refleja que la vista consulta una ventana corta directo desde Firestore

---

## Causa probable del ruido de Storage

La hipótesis más fuerte quedó así:

- `admin-room-history` seguía siendo consultado por el panel admin
- ese flujo dependía de archivos legacy ya poco consistentes con la arquitectura actual
- eso hacía que el producto siguiera tocando `Storage` en una ruta que ya no era central

No se encontró evidencia de que `Storage` de imágenes sea hoy la fuga principal.

---

## Lo que sí quedó pendiente

No se realizó desde esta terminal la purga física del prefijo:

- `admin-room-history/`

Motivo:

- en este entorno no está disponible `gcloud` ni `gsutil`

Estado real:

- los archivos residuales ya no deberían ser usados por la app
- su peso ya era bajo en la auditoría previa
- si se quiere dejar el bucket completamente limpio, esa purga puede hacerse luego desde consola GCP o con `gsutil`

---

## Validación

- `node --check functions/index.js` OK
- `npm run build` OK
- deploy ejecutado:
  - `firebase functions:delete cleanupAdminRoomHistoryArchive --region us-central1 --force`
  - `firebase deploy --only functions:generateAdminRoomHistoryReport,hosting`

---

## Veredicto

`P2` sí reduce costo y ruido:

- elimina lecturas admin innecesarias sobre `Storage`
- elimina una function programada residual
- mantiene el historial admin operativo en modo más simple y barato

La purga física del prefijo legacy queda como tarea manual opcional, no como bloqueo técnico.
