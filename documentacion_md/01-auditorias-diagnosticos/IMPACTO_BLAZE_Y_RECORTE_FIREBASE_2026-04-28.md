# Impacto Blaze y Recorte Firebase 2026-04-28

## Objetivo

Dejar claro:

- que pasa si `Chactivo` baja de `Blaze` a `Spark`
- que cambios de recorte Firebase quedaron aplicados hoy
- y por que bajar de plan hoy no es una solucion limpia para este proyecto

---

## Veredicto corto

Hoy **no conviene bajar `Chactivo` de `Blaze` a `Spark`**.

Motivo:

- `Cloud Storage for Firebase` requiere `Blaze` para uso real
- al bajar a `Spark` ya no podras hacer nuevos deploys de `Cloud Functions`
- y el proyecto perdera acceso a servicios pagados de Google Cloud

La consecuencia operativa es esta:

- el ahorro por plan puede romper media del chat y congelar backend desplegable
- el camino correcto sigue siendo:
  - recortar `Firestore`
  - recortar `Functions`
  - apagar features dormidas
  - y despues reevaluar si el proyecto aun necesita `Blaze`

---

## Que dejaria de funcionar o quedaria comprometido al bajar a Spark

## 1. Media del chat por Storage

`Chactivo` usa `Cloud Storage for Firebase` para:

- imagenes del chat publico
- imagenes del chat privado
- borrado de media asociada a mensajes

Archivos afectados:

- `src/components/chat/ChatInput.jsx`
- `src/components/chat/PrivateChatWindowV2.jsx`
- `src/services/chatService.js`

Riesgo real:

- uploads de imagenes
- lecturas de URLs de media
- y limpieza de archivos

Fuente oficial:

- la guia oficial de Storage para web indica que el proyecto debe estar en `pay-as-you-go Blaze pricing plan`, y lo da como requisito para usar `Cloud Storage for Firebase`  
- https://firebase.google.com/docs/storage/web/start

## 2. Deploy de Cloud Functions

Al bajar desde `Blaze` a `Spark`:

- no podras hacer nuevos deploys de `Cloud Functions`
- ni redeploy de functions existentes

Eso afecta cualquier ajuste futuro de backend en:

- `functions/index.js`

Fuente oficial:

- la documentacion oficial de pricing indica: `You cannot do new deploys of any new or any existing Cloud Functions.`  
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## 3. Servicios pagados de Google Cloud

Si el proyecto baja de `Blaze` a `Spark`:

- pierde acceso a servicios pagados de Google Cloud

Fuente oficial:

- la documentacion oficial indica que al bajar de `Blaze` a `Spark` el proyecto pierde acceso a servicios pagados como `Pub/Sub`, `Cloud Run` o `BigQuery streaming for Analytics`  
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## 4. Que no necesariamente muere

Si el consumo queda dentro de cuota:

- `Authentication`
- `Hosting`
- `Firestore`

pueden seguir operando en `Spark`.

Pero eso **no resuelve** el problema de `Chactivo`, porque hoy el proyecto aun depende de:

- `Storage`
- `Functions`
- y backend desplegable

---

## Cambios aplicados hoy para recorte drástico

## 1. Chat público más austero

Archivo:

- `src/services/chatService.js`

Cambio:

- `subscribeToRoomMessages` bajó su default de `60` a `30`
- `subscribeToSecondaryRoomMessages` bajó su default de `60` a `30`

Impacto esperado:

- menos lecturas por snapshot
- menos transferencia de payload por listener
- menos costo basal del chat visible

## 2. Header sin listener permanente de notificaciones

Archivo:

- `src/components/layout/Header.jsx`

Cambio:

- se eliminó la suscripción realtime permanente a `systemNotifications`
- el badge ahora usa lectura puntual con `getUnreadNotificationsCount`
- refresca con política liviana:
  - al entrar
  - cuando la pestaña vuelve a visible
  - cada `180` segundos

Impacto esperado:

- menos `onSnapshot` globales
- menos costo constante por usuario conectado
- el realtime queda solo en el panel de notificaciones cuando se abre

## 3. Admin con listeners solo cuando la pestaña relevante está activa

Archivo:

- `src/pages/AdminPage.jsx`

Cambio:

- `reports` solo escucha en:
  - `dashboard`
  - `reports`
- `analytics` realtime solo escucha en:
  - `dashboard`
  - `analytics`
- `tickets` solo escucha en:
  - `dashboard`
  - `tickets`
- `sanctions` solo escucha en:
  - `dashboard`
  - `sanctions`
- `rewards` y `top20` solo cargan en:
  - `rewards`
- además todo esto se corta si la pestaña del navegador no está visible

Impacto esperado:

- menos listeners admin siempre vivos
- menos lecturas cuando admin deja una pestaña abierta sin uso
- menos costo residual manual

---

## Validación

Se validó con:

- `npm run build`
- `firebase deploy --only hosting`

Producción:

- `https://chat-gay-3016f.web.app`

---

## Conclusión

La decisión correcta hoy es esta:

- **no bajar a Spark todavía**
- **seguir recortando superficie Firebase mientras el proyecto aun depende de Storage y Functions**

La frase más precisa es:

> `Bajar de Blaze a Spark hoy no es un ahorro limpio para Chactivo: recorta costo administrativo, pero compromete Storage y deja bloqueado el ciclo de deploy de Functions.`

