# FIX_F1_F4_PERMISSION_DENIED_ESTABILIZACION_CHAT

Fecha: 2026-02-22  
Proyecto: Chactivo  
Issue: `permission-denied` en presencia/tarjetas + `No document to update` + warning de AudioContext

## 1) Causa raíz
- Había una carrera de inicialización (`race`) entre render inicial y autenticación Firebase.
- Algunas escrituras de presencia/tarjeta se intentaban antes de tener auth estable o desde usuarios anónimos.
- En tarjetas, algunas rutas usaban `updateDoc` asumiendo existencia del documento.
- El audio intentaba inicializarse fuera de gesto explícito del usuario.

## 2) Cambios aplicados

### F1) Auth gating (`authReady`)
- Se agregó `authReady` en `AuthContext`.
- `authReady` solo es `true` cuando `firebaseUser.uid` existe en `onAuthStateChanged`.
- Se movió/aisló presencia en `ChatPage` a un efecto dependiente de `authReady && roomId && user.id`.
- Se ajustó `ChatSecondaryPage` para no hacer `joinRoom/subscribeToRoomUsers` hasta que `authReady` esté listo.
- Se limpian usuarios de sala cuando `authReady` no está lista para evitar estado fantasma.

Archivos:
- `src/contexts/AuthContext.jsx`
- `src/pages/ChatPage.jsx`
- `src/pages/ChatSecondaryPage.jsx`

### F2) Upsert de tarjeta (sin `No document to update`)
- Se reemplazaron puntos críticos de `updateDoc` por `setDoc(..., { merge: true })`.
- Si el documento no existe, ahora se crea/mezcla automáticamente.

Archivos:
- `src/services/tarjetaService.js`

### F3) Política invitados en tarjeta
- Se dejó aplicada la recomendación: **no crear/editar tarjeta automática para invitados**.
- `AuthContext` solo ejecuta `crearTarjetaAutomatica` para usuarios registrados (no guest/anónimo).
- `BaulSection` evita flujo de tarjeta propia en guest/anónimo.
- `presenceService` sincroniza estado de tarjeta (`actualizarEstadoOnline`) **solo para registrados**:
  - en `joinRoom`: excluye anónimos.
  - en `leaveRoom`: excluye anónimos.

Archivos:
- `src/contexts/AuthContext.jsx`
- `src/components/baul/BaulSection.jsx`
- `src/services/presenceService.js`

### F4) Audio solo con gesto del usuario
- Se implementó `initAudioOnFirstGesture`.
- Se enlazó a primer gesto (`pointerdown`, `touchstart`, `keydown`) y a foco del input.
- Los métodos de sonido hacen `no-op` si no está inicializado, evitando warnings.

Archivos:
- `src/services/notificationSounds.js`
- `src/pages/ChatPage.jsx`
- `src/components/chat/ChatInput.jsx`

## 3) Resultado esperado
- Invitado/incógnito: no dispara `permission-denied` por sync de tarjeta al entrar/salir.
- No vuelve a aparecer `No document to update` en rutas de estado de tarjeta.
- Sin warning de `AudioContext` por autoplay antes de interacción.
- Flujo inicial del chat estable sin bloquear UI.

## 4) Verificación recomendada
1. Abrir incógnito e ingresar a `/chat/principal`.
2. Confirmar en consola: sin `permission-denied` de `tarjetas`/presencia.
3. Entrar/salir de sala y revisar que no haya errores al hacer `leaveRoom`.
4. En usuario registrado, abrir chat y enviar mensaje:
   - sonido solo después de interacción.
5. Revisar Baúl:
   - guest no fuerza creación de tarjeta.
   - registrado crea/actualiza sin error.

