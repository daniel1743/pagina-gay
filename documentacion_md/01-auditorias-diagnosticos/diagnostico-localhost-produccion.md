# 🔍 Diagnóstico: Localhost no puede enviar mensajes a producción

## 📋 Problema

Desde `localhost` no se pueden enviar mensajes a Firestore en producción, aunque la aplicación en producción funciona correctamente.

---

## ✅ Checklist de Diagnóstico

### 1. Verificar Variables de Entorno

**Ubicación:** Archivo `.env` en la raíz del proyecto

```bash
# Verificar que existe el archivo
ls -la .env

# O en Windows:
dir .env
```

**Variables requeridas:**
```env
VITE_FIREBASE_API_KEY=

VITE_FIREBASE_PROJECT_ID=chat-gay-3016f
VITE_FIREBASE_STORAGE_BUCKET=chat-gay-3016f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_USE_FIREBASE_EMULATOR=false
```

**⚠️ IMPORTANTE:** 
- Las variables deben ser las mismas que en producción
- NO uses emuladores si quieres conectarte a producción (`VITE_USE_FIREBASE_EMULATOR=false`)
- Reinicia el servidor de desarrollo después de cambiar `.env`

---

### 2. Verificar Autenticación

**Problema común:** `auth.currentUser` es `null` en localhost

**Verificar en consola del navegador:**
```javascript
// Abre la consola (F12) y ejecuta:
import { auth } from '@/config/firebase';
console.log('Current User:', auth.currentUser);
console.log('Auth State:', auth.currentUser?.uid);
```

**Si `auth.currentUser` es `null`:**
- El usuario no está autenticado
- Necesitas iniciar sesión primero
- Verifica que el login funciona correctamente

---

### 3. Verificar Dominios Autorizados en Firebase

**Pasos:**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona proyecto: **chat-gay-3016f**
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Verifica que esté incluido:
   - ✅ `localhost`
   - ✅ `127.0.0.1`
   - ✅ Tu dominio de producción

**Si falta `localhost`:**
1. Click en "Add domain"
2. Agrega: `localhost`
3. Guarda

---

### 4. Verificar Reglas de Firestore

**Regla crítica (línea 102 de `firestore.rules`):**
```javascript
data.userId == request.auth.uid
```

**Esto significa:**
- El `userId` del mensaje DEBE coincidir con el `uid` del usuario autenticado
- Si no coinciden, Firestore rechazará el mensaje con `permission-denied`

**Verificar en código:**
```javascript
// En src/services/chatService.js línea 104-110
if (!isSystemMessage && messageData.userId !== auth.currentUser.uid) {
  console.warn('[SEND] ⚠️ userId no coincide con auth.currentUser.uid');
  messageData.userId = auth.currentUser.uid; // Se corrige automáticamente
}
```

---

### 5. Verificar Errores en Consola

**Abrir consola del navegador (F12) y buscar:**

#### Error: `permission-denied`
```
[SEND] 🚫 PERMISO DENEGADO - Verificar Firestore Rules
```
**Causa:** Las reglas de Firestore están rechazando el mensaje
**Solución:** Verificar que `userId === auth.currentUser.uid`

#### Error: `auth/user-not-authenticated`
```
[SEND] 🛑 USUARIO NO AUTENTICADO - auth.currentUser es null
```
**Causa:** El usuario no está autenticado
**Solución:** Iniciar sesión antes de enviar mensajes

#### Error: `unavailable`
```
[SEND] 🌐 FIREBASE NO DISPONIBLE - Problema de conexión
```
**Causa:** Problema de red o Firebase está caído
**Solución:** Verificar conexión a internet

---

### 6. Verificar que NO estás usando Emuladores

**En `src/config/firebase.js` línea 87-92:**
```javascript
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔧 Usando emuladores de Firebase');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

**Si ves el mensaje "🔧 Usando emuladores de Firebase" en consola:**
- Estás conectado a emuladores locales, NO a producción
- Cambia `VITE_USE_FIREBASE_EMULATOR=false` en `.env`
- Reinicia el servidor de desarrollo

---

### 7. Verificar Estado de Autenticación

**Agregar logging temporal en `src/services/chatService.js`:**

```javascript
const doSendMessage = async (roomId, messageData, isAnonymous = false) => {
  // ✅ DIAGNÓSTICO: Logging detallado
  console.log('[DIAGNÓSTICO] Estado de autenticación:', {
    hasAuth: !!auth,
    hasCurrentUser: !!auth.currentUser,
    currentUserUid: auth.currentUser?.uid,
    messageDataUserId: messageData.userId,
    match: messageData.userId === auth.currentUser?.uid,
    timestamp: new Date().toISOString()
  });

  // ⚠️ Validar que auth.currentUser está disponible
  if (!auth.currentUser) {
    const error = new Error('Usuario no autenticado. Por favor, espera un momento o recarga la página.');
    error.code = 'auth/user-not-authenticated';
    throw error;
  }
  // ... resto del código
};
```

---

## 🔧 Soluciones Comunes

### Solución 1: Reiniciar Servidor de Desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

**Razón:** Las variables de entorno se cargan al iniciar el servidor.

---

### Solución 2: Limpiar Cache del Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Empty Cache and Hard Reload"

**Razón:** El navegador puede estar cacheando una versión antigua.

---

### Solución 3: Verificar que estás en el mismo proyecto de Firebase

**En consola del navegador:**
```javascript
import { db } from '@/config/firebase';
console.log('Firebase Project ID:', db.app.options.projectId);
// Debe mostrar: "chat-gay-3016f"
```

**Si muestra otro proyecto:**
- Las variables de entorno están mal configuradas
- Verifica el archivo `.env`

---

### Solución 4: Verificar que el usuario está autenticado correctamente

**En consola del navegador:**
```javascript
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  console.log('Auth State Changed:', {
    isAuthenticated: !!user,
    uid: user?.uid,
    email: user?.email,
    provider: user?.providerData[0]?.providerId
  });
});
```

**Si `isAuthenticated` es `false`:**
- Necesitas iniciar sesión
- Verifica que el login funciona

---

## 🎯 Pasos de Diagnóstico Rápido

1. **Abrir consola del navegador (F12)**
2. **Ir a la pestaña "Console"**
3. **Intentar enviar un mensaje**
4. **Buscar errores que empiecen con:**
   - `[SEND] ❌ Error enviando mensaje`
   - `[SEND] 🚫 PERMISO DENEGADO`
   - `[SEND] 🛑 USUARIO NO AUTENTICADO`

5. **Copiar el error completo y verificar:**
   - ¿Qué código de error tiene? (`error.code`)
   - ¿Qué mensaje muestra? (`error.message`)
   - ¿`auth.currentUser` es `null`?

---

## 📝 Logging Detallado para Debug

**Agregar al inicio de `doSendMessage` en `src/services/chatService.js`:**

```javascript
const doSendMessage = async (roomId, messageData, isAnonymous = false) => {
  // 🔍 DIAGNÓSTICO COMPLETO
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    roomId,
    hasAuth: !!auth,
    hasCurrentUser: !!auth.currentUser,
    currentUserUid: auth.currentUser?.uid,
    currentUserEmail: auth.currentUser?.email,
    messageDataUserId: messageData.userId,
    messageDataUsername: messageData.username,
    userIdsMatch: messageData.userId === auth.currentUser?.uid,
    isAnonymous,
    firebaseProjectId: db.app.options.projectId,
    firebaseAuthDomain: auth.app.options.authDomain,
    usingEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  };
  
  console.log('🔍 [DIAGNÓSTICO] Estado antes de enviar mensaje:', diagnosticInfo);
  
  // ... resto del código
};
```

---

## ✅ Verificación Final

**Si todo está correcto, deberías ver en consola:**
```
✅ [FIREBASE] Auth en modo MEMORIA (sin IndexedDB)
ℹ️ Firestore en modo ONLINE (sin persistence)
🔍 [DIAGNÓSTICO] Estado antes de enviar mensaje: {
  hasAuth: true,
  hasCurrentUser: true,
  currentUserUid: "abc123...",
  userIdsMatch: true,
  firebaseProjectId: "chat-gay-3016f",
  usingEmulator: false
}
```

**Si ves `usingEmulator: true`:**
- Estás usando emuladores, NO producción
- Cambia `VITE_USE_FIREBASE_EMULATOR=false` en `.env`

---

## 🆘 Si Nada Funciona

1. **Verificar que las reglas de Firestore están desplegadas:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verificar en Firebase Console:**
   - Firestore Database → Reglas
   - Debe mostrar las reglas actualizadas

3. **Probar con un usuario de prueba:**
   - Crear usuario nuevo en Firebase Console
   - Iniciar sesión con ese usuario
   - Intentar enviar mensaje

4. **Contactar soporte con:**
   - Screenshot de la consola con el error
   - El output del diagnóstico completo
   - Versión de Node.js: `node --version`
   - Versión de npm: `npm --version`

---

## 📚 Referencias

- [Firebase Auth - Dominios Autorizados](https://firebase.google.com/docs/auth/web/custom-domain)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Local Development](https://firebase.google.com/docs/emulator-suite)

