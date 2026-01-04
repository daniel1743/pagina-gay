# 🐛 PROBLEMA: Usuario Invitado Pierde Sesión Después de ~20 Segundos

**Fecha:** 04 de Enero 2026
**Severidad:** CRÍTICA ⚠️
**Afecta a:** Usuarios invitados (guest)

---

## 📋 DESCRIPCIÓN DEL PROBLEMA

### Flujo actual (ROTO):

1. ✅ Usuario entra desde landing page
2. ✅ Llena modal de invitado: nickname, edad, avatar, acepta reglas
3. ✅ Entra a `/chat/principal`
4. ✅ Escribe mensajes correctamente
5. ❌ **Después de ~20 segundos:** Es redirigido automáticamente a `/chat/principal`
6. ❌ **Le muestra NUEVAMENTE el modal de invitado**
7. ❌ Mala experiencia de usuario

### Logs observados:

```
chatService.js:33 🔥 [SEND MESSAGE] DEBUG
chatService.js:34 Room: principal | User: luisifer3
ChatPage.jsx:524 📨 [CHAT] Mensajes recibidos de Firestore
ChatPage.jsx:581 ✅ [DEDUPLICACIÓN] Eliminando optimista por match de contenido
ChatInput.jsx:192 [ChatInput] Timeout de seguridad: isSending reseteado después de 5s
```

**Los mensajes SE ENVÍAN correctamente**, pero algo está causando que el usuario pierda su sesión.

---

## 🔍 INVESTIGACIÓN REALIZADA

### 1. Código que controla la visualización:

**ChatPage.jsx líneas 1208-1210:**
```javascript
if (!user) {
  return <ChatLandingPage roomSlug={roomId} />;
}
```

Si `user` se vuelve `null` o `undefined`, se muestra la ChatLandingPage con el modal de invitado.

### 2. AuthContext.jsx - onAuthStateChanged:

**Líneas 167-178:**
```javascript
} else {
  // No hay usuario - NO hacer auto-login anónimo
  setUser(null);
  setGuestMessageCount(0);

  // Resetear el flag de logout si estaba activo
  if (isLoggingOutRef.current) {
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1000);
  }
}
```

Si Firebase Auth detecta que `firebaseUser` es `null`, se ejecuta `setUser(null)`, lo cual causa que ChatPage muestre la landing.

### 3. Posibles causas identificadas:

#### A) Error al cargar perfil de Firestore
**Líneas 160-166:**
```javascript
} catch (error) {
  console.error('Error loading user profile:', error);
  // Si falla, intentar login anónimo
  signInAnonymously(auth).catch(err => {
    console.error('Error signing in anonymously:', err);
  });
}
```

Si hay un error al obtener el perfil del usuario desde Firestore, intenta hacer `signInAnonymously` de nuevo, lo cual podría:
- Crear un NUEVO usuario anónimo (con diferente UID)
- Perder la sesión anterior

#### B) Firebase Auth expirando sesión
Firebase podría estar expirando la sesión anónima si:
- Hay problemas de red
- IndexedDB falla (vimos errores en consola)
- Token de sesión se invalida

#### C) Usuario está siendo sancionado/baneado
**Líneas 122-135:**
```javascript
const sanctions = await checkUserSanctions(firebaseUser.uid);

if (sanctions.isBanned) {
  await signOut(auth);  // ⚠️ Cierra sesión
  toast({...});
  return;
}
```

Si un usuario invitado está baneado, `signOut` cierra la sesión y causa que `onAuthStateChanged` dispare con `firebaseUser = null`.

---

## 🎯 HIPÓTESIS PRINCIPAL

**El problema más probable es:**

Firebase está teniendo problemas al cargar el perfil del usuario desde Firestore (línea 93), lo cual dispara el bloque `catch` que hace `signInAnonymously` de nuevo, creando un NUEVO usuario anónimo y perdiendo la sesión anterior.

### Evidencia:

1. Los mensajes se envían correctamente (el usuario existe)
2. Después de ~20 segundos pierde sesión (tiempo típico de timeout de red/Firestore)
3. Le muestra el modal nuevamente (significa que `user = null` o es un nuevo usuario)

---

## ✅ SOLUCIONES PROPUESTAS

### Solución 1: Agregar logs detallados (DIAGNÓSTICO)

Modificar `AuthContext.jsx` para saber exactamente cuándo y por qué se pierde el usuario:

```javascript
const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] 🔄 onAuthStateChanged:`, firebaseUser ? `UID: ${firebaseUser.uid}` : '❌ No hay usuario');

  if (firebaseUser) {
    console.log('[AUTH] ✅ Firebase user existe, cargando perfil...');
    try {
      // ... resto del código
    } catch (error) {
      console.error('[AUTH] ❌ ERROR al cargar perfil:', error);
      console.error('[AUTH] ❌ Error code:', error.code);
      console.error('[AUTH] ❌ Error message:', error.message);
      // NO hacer signInAnonymously automáticamente aquí
      // Dejar que el usuario actual se mantenga
      setUser({
        id: firebaseUser.uid,
        username: 'Invitado',
        isGuest: true,
        isAnonymous: true,
        isPremium: false,
        verified: false,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
      });
    }
  } else {
    console.log('[AUTH] ⚠️ Firebase user es NULL, limpiando estado...');
    setUser(null);
  }
});
```

### Solución 2: Evitar crear nuevo usuario anónimo si falla Firestore

**Cambiar líneas 160-166:**

```javascript
} catch (error) {
  console.error('[AUTH] ⚠️ Error al cargar perfil de Firestore:', error);

  // ✅ NO crear nuevo usuario anónimo automáticamente
  // ✅ Usar perfil básico local para mantener sesión
  const basicProfile = {
    id: firebaseUser.uid,
    username: `Invitado${firebaseUser.uid.slice(0, 6)}`,
    isGuest: true,
    isAnonymous: true,
    isPremium: false,
    verified: false,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
    quickPhrases: [],
    theme: {},
  };

  setUser(basicProfile);
  console.log('[AUTH] ✅ Usando perfil básico local (Firestore no disponible)');

  // ❌ NO hacer esto:
  // signInAnonymously(auth).catch(err => {...});
}
```

### Solución 3: Configurar persistencia explícita de Firebase Auth

Agregar en `firebase.js`:

```javascript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Después de inicializar auth
export const auth = getAuth(app);

// ✅ Forzar persistencia LOCAL (sobrevive a recargas y cierres de pestaña)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Firebase Auth persistence configurada: LOCAL');
  })
  .catch((error) => {
    console.error('❌ Error configurando persistence:', error);
  });
```

### Solución 4: Guardar sesión de invitado en localStorage como backup

En `signInAsGuest`:

```javascript
const signInAsGuest = async (username, avatarUrl) => {
  try {
    const userCredential = await signInAnonymously(auth);
    const guestUser = {
      id: userCredential.user.uid,
      username: username,
      isGuest: true,
      isAnonymous: true,
      isPremium: false,
      verified: false,
      avatar: avatarUrl || null,
      quickPhrases: [],
      theme: {},
    };

    setUser(guestUser);

    // ✅ NUEVO: Guardar en localStorage como backup
    localStorage.setItem('guest_session_backup', JSON.stringify({
      uid: userCredential.user.uid,
      username: username,
      avatar: avatarUrl,
      timestamp: Date.now(),
    }));

    // ... resto del código
  }
};
```

Y en `onAuthStateChanged`, intentar recuperar:

```javascript
} catch (error) {
  console.error('[AUTH] Error al cargar perfil:', error);

  // ✅ Intentar recuperar sesión de localStorage
  const backup = localStorage.getItem('guest_session_backup');
  if (backup) {
    try {
      const data = JSON.parse(backup);
      if (data.uid === firebaseUser.uid) {
        console.log('[AUTH] 🔄 Recuperando sesión desde localStorage backup');
        setUser({
          id: data.uid,
          username: data.username,
          isGuest: true,
          isAnonymous: true,
          isPremium: false,
          verified: false,
          avatar: data.avatar,
          quickPhrases: [],
          theme: {},
        });
        return; // ✅ Salir sin hacer signInAnonymously
      }
    } catch (parseError) {
      console.error('[AUTH] Error parseando backup:', parseError);
    }
  }
}
```

---

## 🚀 PLAN DE ACCIÓN RECOMENDADO

### Paso 1: Agregar logs (Solución 1)
- Implementar logs detallados en `onAuthStateChanged`
- Reproducir el problema
- Ver exactamente qué está causando que `user` sea `null`

### Paso 2: Aplicar Solución 2 o 4
- Si el problema es Firestore fallando: aplicar Solución 2
- Si el problema es Firebase Auth perdiendo sesión: aplicar Solución 4
- Si ambos: aplicar ambas

### Paso 3: Configurar persistencia (Solución 3)
- Agregar `setPersistence` en `firebase.js`
- Esto previene la mayoría de problemas de sesión

---

## 📊 SIGUIENTE PASO

**Implementar Solución 1 primero** para diagnosticar exactamente qué está pasando.

Una vez tengamos los logs, sabremos si:
- A) Firestore está fallando al cargar el perfil
- B) Firebase Auth está cerrando la sesión
- C) Otro problema

**Luego aplicar la solución correspondiente.**

---

*Documento creado por Claude Code - 04/01/2026*
