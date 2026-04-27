# Auditoria Costo Storage Imagenes 2026-04-27

## Objetivo

Determinar si las imagenes en Firebase Storage estan generando un costo material en `Chactivo`.

---

## Veredicto corto

Si, las imagenes pueden cobrar en Firebase.

Pero con el uso actual medido hoy, **Storage no parece ser la fuga principal**.

El bucket esta pequeño y el trafico observado sigue bajo frente a las cuotas gratis tipicas de Cloud Storage for Firebase.

---

## Datos reales medidos

Bucket:

- `chat-gay-3016f.firebasestorage.app`
- region: `us-central1`
- clase: `REGIONAL`

Estado actual del bucket:

- tamano total: `30,542,839 bytes`
- tamano total aproximado: `29.13 MB`
- objetos totales: `1,820`

Desglose por prefijo:

- `chat_media`: `30,164,374 bytes` en `618` objetos
- `admin-room-history`: `378,465 bytes` en `1,202` objetos

Top hallazgo:

- casi todo el bucket corresponde a `chat_media`
- `admin-room-history` mete muchos objetos, pero casi no pesa en almacenamiento

---

## Trafico y operaciones observadas en 7 dias

### Bytes servidos por Storage

Total observado:

- `232,733,374 bytes`
- aproximado: `222 MB`

Detalle:

- `ReadObject OK`: `219,026,002 bytes`
- `ListObjects OK`: `12,178,064 bytes`
- `WriteObject OK`: `1,509,216 bytes`

### Operaciones observadas

Total observado:

- `10,225` operaciones

Detalle:

- `ReadObject OK`: `5,605`
- `ReadObject FAILED_PRECONDITION`: `1,861`
- `DeleteObject OK`: `1,435`
- `WriteObject OK`: `1,264`
- `DeleteObject NOT_FOUND`: `40`
- `ListObjects OK`: `20`

---

## Interpretacion operativa

### Almacenamiento

`29.13 MB` es muy poco.

Eso no calza con una factura alta por almacenar imagenes.

### Descargas

`~222 MB` en 7 dias sigue siendo bajo.

Extrapolado linealmente a 30 dias, da cerca de `~0.95 GB/mes`.

Eso sigue muy por debajo de `100 GB/mes`.

### Operaciones

Aqui si hay algo a vigilar, pero no parece una crisis:

- `WriteObject OK`: `1,264` en 7 dias
- extrapolado a 30 dias: `~5,417`

Eso significa que las subidas podrian quedar **muy cerca** o **ligeramente por encima** de la cuota gratis mensual de uploads, segun el esquema vigente del plan.

Aun asi, incluso si se pasa un poco, el costo monetario esperado sigue siendo bajo.

---

## Conclusion real

Las imagenes **si pueden costar dinero** en Firebase, pero hoy:

- **no parecen ser el origen principal de tu factura**
- el bucket pesa muy poco
- el trafico actual es bajo
- el costo grande mas probable sigue estando en:
  - Firestore realtime
  - Cloud Functions
  - listeners
  - fan-out de eventos

---

## Riesgos detectados

### 1. `admin-room-history` en Storage

- agrega muchos objetos
- no pesa mucho hoy
- pero ensucia el bucket y suma operaciones

### 2. Operaciones de upload

- el ritmo actual podria acercarse a la cuota gratis de operaciones de carga
- no parece caro hoy, pero conviene no inflarlo

### 3. Lecturas `FAILED_PRECONDITION`

- hay `1,861` lecturas fallidas observadas
- eso merece revision porque indica intentos o accesos defectuosos sobre objetos

---

## Veredicto final

`Storage si cobra, pero con el estado medido hoy no parece ser tu problema principal.`

La conclusion tecnica correcta es:

- guardar imagenes en Firebase **no esta pesando mucho**
- servir imagenes **tampoco esta alto hoy**
- tu factura probablemente esta mucho mas afectada por `Firestore + Functions` que por `Storage`
