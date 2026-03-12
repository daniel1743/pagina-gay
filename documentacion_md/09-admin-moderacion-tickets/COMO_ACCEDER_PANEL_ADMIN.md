# 🛡️ CÓMO ACCEDER AL PANEL DE ADMINISTRACIÓN

**Fecha:** 2025-12-11
**Panel Admin URL:** `https://chactivo.com/admin`

---

## ✅ LO QUE SE CREÓ:

1. ✅ **AdminPage.jsx** - Panel completo de administración
2. ✅ **Ruta /admin** - Protegida con autenticación
3. ✅ **Sistema de verificación** - Solo usuarios con `role: "admin"` pueden acceder
4. ✅ **Vista de reportes en tiempo real** - Firestore onSnapshot
5. ✅ **Acciones de moderación** - Resolver/Rechazar reportes

---

## 🔐 CÓMO DAR ACCESO DE ADMIN

### **OPCIÓN 1: Firebase Console (Recomendado)**

#### **Paso 1: Ir a Firebase Console**
```
1. Ir a: https://console.firebase.google.com
2. Seleccionar proyecto "chactivo"
3. Click en "Firestore Database" (menú izquierdo)
```

#### **Paso 2: Encontrar tu Usuario**
```
1. Click en colección "users"
2. Buscar tu documento de usuario
   - El ID del documento es tu UID (lo ves en /profile)
   - O busca por tu email/username en los documentos
```

#### **Paso 3: Añadir Campo "role"**
```
1. Click en tu documento de usuario
2. Click en "+ Add field" (arriba a la derecha)
3. Configurar:
   - Field:  role
   - Type:   string
   - Value:  admin
4. Click "Add"
```

#### **Paso 4: Verificar**
```
1. Refrescar la página
2. Verificar que el campo "role: admin" esté visible
3. ✅ Ya tienes acceso de admin!
```

---

### **OPCIÓN 2: Desde tu Email (Si lo conoces)**

Si ya estás registrado y conoces tu email:

```
1. Ir a Firebase Console
2. Firestore Database
3. Colección "users"
4. Buscar documento donde email == "tu-email@ejemplo.com"
5. Añadir campo: role: "admin"
```

---

### **OPCIÓN 3: Script para Auto-asignarte Admin (Desarrolladores)**

Si tienes acceso a Firebase Admin SDK:

```javascript
// scripts/make-admin.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reemplazar con tu UID
const YOUR_UID = 'tu-uid-aqui';

async function makeAdmin() {
  try {
    const userRef = doc(db, 'users', YOUR_UID);
    await updateDoc(userRef, {
      role: 'admin'
    });
    console.log('✅ Admin role added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeAdmin();
```

**Ejecutar:**
```bash
node scripts/make-admin.js
```

---

## 🔍 CÓMO ENCONTRAR TU UID

### **Método 1: Desde el Perfil**

```
1. Login en Chactivo
2. Ir a: /profile
3. Abrir DevTools (F12)
4. Console: user.id
5. Copiar el UID que aparece
```

### **Método 2: Desde Firebase Authentication**

```
1. Firebase Console
2. Authentication (menú izquierdo)
3. Buscar tu email
4. El UID está en la columna "User UID"
5. Copiar
```

### **Método 3: Desde localStorage**

```
1. Abrir DevTools (F12)
2. Application → Local Storage → https://chactivo.com
3. Buscar clave que contenga "firebase:authUser"
4. Expandir y buscar "uid"
5. Copiar el valor
```

---

## 🎯 VERIFICAR SI ERES ADMIN

### **Desde el Chat de Chactivo:**

```
1. Login en Chactivo
2. Abrir DevTools (F12)
3. Console, pegar:

firebase.auth().currentUser.getIdTokenResult()
  .then(token => {
    console.log('Claims:', token.claims);
    console.log('Admin:', token.claims.admin);
  });

4. Si admin: true → ✅ Eres admin
   Si admin: undefined → ❌ No eres admin
```

### **Desde Firestore:**

```
1. Firebase Console → Firestore Database
2. Colección "users"
3. Tu documento
4. Buscar campo "role"
5. Si role: "admin" → ✅ Tienes acceso
```

---

## 🚀 ACCEDER AL PANEL DE ADMIN

Una vez que tengas el campo `role: "admin"`:

### **Paso 1: Logout y Login de nuevo**
```
Importante: Debes cerrar sesión y volver a iniciar sesión
para que el sistema detecte el nuevo rol.

1. Click en tu avatar (esquina superior derecha)
2. "Cerrar Sesión"
3. Login de nuevo
```

### **Paso 2: Ir al Panel Admin**
```
Opción A: URL directa
https://chactivo.com/admin

Opción B: Desde el navegador
Escribir en la barra: chactivo.com/admin
```

### **Paso 3: Verificar Acceso**
```
✅ Si eres admin: Verás el panel con estadísticas y reportes
❌ Si no eres admin: Redirigido a "/" con mensaje "Acceso Denegado"
```

---

## 📊 QUÉ VES EN EL PANEL ADMIN

### **Estadísticas (4 cards):**
1. **Total Reportes** - Todos los reportes creados
2. **Pendientes** - Reportes sin revisar (amarillo)
3. **Resueltos** - Reportes aprobados (verde)
4. **Rechazados** - Reportes rechazados (rojo)

### **Lista de Reportes:**
- **Tipo** - spam, harassment, inappropriate, fake, other
- **Usuario reportado** - Username del usuario denunciado
- **Descripción** - Detalles del reporte
- **Estado** - pending, resolved, rejected
- **Fecha** - Cuándo se creó el reporte
- **Reportado por** - Quién hizo el reporte

### **Acciones Disponibles:**
- ✅ **Resolver** - Marca el reporte como resuelto (acción tomada)
- ❌ **Rechazar** - Marca el reporte como rechazado (no válido)
- 📊 **Actualización en tiempo real** - Los reportes se actualizan automáticamente

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### **❌ "Acceso Denegado" al entrar a /admin**

**Causa:** No tienes el campo `role: "admin"` en Firestore

**Solución:**
```
1. Verificar en Firestore que el campo exista:
   users → [tu-uid] → role: "admin"

2. Si existe, logout y login de nuevo

3. Si no existe, añadir el campo (ver OPCIÓN 1 arriba)
```

---

### **❌ "No se pudieron cargar los reportes"**

**Causa:** Firestore rules no permiten leer reportes

**Solución:**
```
1. Verificar firestore.rules línea 207-208:
   allow read: if isAdmin() ||
                 (isAuthenticated() && resource.data.reporterId == request.auth.uid);

2. Verificar función isAdmin() línea 26-29:
   function isAdmin() {
     return isAuthenticated() &&
            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'admin';
   }

3. Si las reglas están correctas:
   firebase deploy --only firestore:rules
```

---

### **❌ Página /admin redirige a "/"**

**Causa:** No estás autenticado o eres usuario invitado

**Solución:**
```
1. Asegúrate de estar registrado (NO usuario invitado)
2. Login con email/password
3. Verifica que tu sesión esté activa
4. Intenta de nuevo: /admin
```

---

### **❌ "Cannot read properties of undefined (reading 'role')"**

**Causa:** Tu documento en Firestore no existe o no tiene datos

**Solución:**
```
1. Ir a Firestore Console
2. Colección "users"
3. Verificar que tu documento exista
4. Si no existe, crear perfil:
   - Logout
   - Registrarse de nuevo
   - Añadir campo role: "admin"
```

---

## 📝 ESTRUCTURA DE DATOS

### **users/[uid]**
```json
{
  "id": "abc123xyz",
  "username": "Admin",
  "email": "admin@chactivo.com",
  "isPremium": false,
  "verified": false,
  "role": "admin",  // ← ESTE CAMPO ES CLAVE
  "createdAt": "2025-12-11T..."
}
```

### **reports/[reportId]**
```json
{
  "reporterId": "xyz789",
  "reporterUsername": "UserReporter",
  "targetUsername": "UserReported",
  "type": "spam",
  "description": "Usuario enviando spam masivo",
  "status": "pending",  // pending | resolved | rejected
  "createdAt": "2025-12-11T...",
  "reviewedBy": "abc123xyz",  // UID del admin que revisó
  "reviewedAt": "2025-12-11T..."
}
```

---

## 🔐 SEGURIDAD

### **Permisos del Panel Admin:**

1. ✅ **Solo usuarios registrados** - Invitados NO pueden acceder
2. ✅ **Solo con role: "admin"** - Campo verificado en Firestore
3. ✅ **Firestore Rules protegen** - Incluso si bypasseas el frontend
4. ✅ **Acciones registradas** - reviewedBy guarda quién actuó

### **Firestore Rules (ya implementadas):**

```javascript
// firestore.rules línea 26-29
function isAdmin() {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'admin';
}

// firestore.rules línea 206-208
match /reports/{reportId} {
  allow read: if isAdmin() ||
                (isAuthenticated() && resource.data.reporterId == request.auth.uid);

  allow update: if isAdmin();  // Solo admins pueden cambiar estado
}
```

---

## 🎨 PERSONALIZACIÓN (Opcional)

### **Añadir más admins:**

Repetir el proceso para cada usuario:
```
users/[otro-uid]
  role: "admin"
```

### **Crear roles adicionales:**

```javascript
// Ejemplo: Moderador (puede ver reportes pero no actualizar)
users/[uid]
  role: "moderator"

// firestore.rules - añadir función
function isModerator() {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') in ['admin', 'moderator'];
}

// Actualizar regla de lectura
allow read: if isModerator() || ...
```

---

## 📞 SOPORTE

Si tienes problemas:

1. ✅ Verificar que Firestore rules estén desplegadas
2. ✅ Verificar que el campo `role: "admin"` exista
3. ✅ Logout y login de nuevo
4. ✅ Limpiar caché del navegador (Ctrl+Shift+Del)
5. ✅ Probar en ventana incógnito

Si sigue sin funcionar:
- Revisar consola del navegador (F12)
- Buscar errores en rojo
- Verificar que Firebase esté conectado

---

## ✅ CHECKLIST RÁPIDO

Para dar acceso de admin a ti mismo:

```
[ ] 1. Estar registrado en Chactivo (NO invitado)
[ ] 2. Encontrar tu UID (desde /profile o Firebase Console)
[ ] 3. Ir a Firebase Console → Firestore
[ ] 4. Colección "users" → Tu documento
[ ] 5. Añadir campo: role = "admin" (string)
[ ] 6. Logout de Chactivo
[ ] 7. Login de nuevo
[ ] 8. Ir a: https://chactivo.com/admin
[ ] 9. ✅ Deberías ver el panel con estadísticas
```

---

## 🚀 PRÓXIMOS PASOS

Una vez que tengas acceso:

1. ✅ Revisar reportes pendientes
2. ✅ Resolver o rechazar según corresponda
3. ✅ Monitorear estadísticas
4. ✅ Moderar comunidad activamente

---

**Documento creado:** 2025-12-11
**Última actualización:** 2025-12-11
**Versión del panel:** 1.0
**Estado:** ✅ Funcional y listo para usar
