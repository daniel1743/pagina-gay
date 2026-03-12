# 🔧 SOLUCIÓN: ERRORES DE PERMISOS EN FIRESTORE

**Fecha:** 2025-12-11  
**Problema:** "Missing or insufficient permissions" en tickets y analytics

---

## ❌ ERRORES ACTUALES

1. **Error en `subscribeToTickets`:**
   ```
   FirebaseError: Missing or insufficient permissions
   ```

2. **Error en `getMostUsedFeatures`:**
   ```
   FirebaseError: Missing or insufficient permissions
   ```

3. **Error en `getExitPages`:**
   ```
   FirebaseError: Missing or insufficient permissions
   ```

---

## 🔍 CAUSA DEL PROBLEMA

Las reglas de Firestore en **Firebase Console NO están actualizadas**. 

El archivo `firestore.rules` en tu código tiene las reglas correctas, pero **Firebase Console todavía tiene las reglas viejas** que deniegan todo.

---

## ✅ SOLUCIÓN PASO A PASO

### **PASO 1: Actualizar Reglas en Firebase Console**

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/rules
   ```

2. **Abre el archivo `firestore.rules` en tu editor** (el que está en tu proyecto)

3. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)

4. **Pega en Firebase Console** (reemplaza TODO lo que hay ahí)

5. **Click en "Publicar"** (botón azul arriba a la derecha)

6. **Espera 1-2 minutos** para que las reglas se propaguen

### **PASO 2: Verificar que eres Admin**

1. **Ve a Firestore Database:**
   ```
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/data
   ```

2. **Busca tu usuario:**
   - Colección: `users`
   - Documento: `{tu-uid}` (el ID de tu usuario)

3. **Verifica que exista el campo:**
   ```
   role: "admin"  (tipo: string)
   ```

4. **Si NO existe:**
   - Click en "+ Add field"
   - Field: `role`
   - Type: `string`
   - Value: `admin`
   - Click "Add"

### **PASO 3: Cerrar sesión y volver a iniciar**

1. **Cierra sesión** en la aplicación
2. **Inicia sesión de nuevo**
3. **Ve al panel admin** (`/admin`)

---

## 🔐 REGLAS QUE DEBEN ESTAR

### **Para `analytics_stats`:**
```javascript
match /analytics_stats/{dateId} {
  // Cualquier usuario autenticado puede escribir (para tracking)
  allow write: if isAuthenticated();
  
  // Solo admins pueden leer estadísticas
  allow read: if isAdmin();
}
```

### **Para `tickets`:**
```javascript
match /tickets/{ticketId} {
  // Admins pueden leer todos, usuarios solo los suyos
  allow read: if isAdmin() ||
                (isAuthenticated() && 
                 (resource == null || resource.data.userId == request.auth.uid));

  // Usuarios autenticados pueden crear tickets
  allow create: if isAuthenticated() &&
                  'userId' in request.resource.data &&
                  request.resource.data.userId == request.auth.uid &&
                  'subject' in request.resource.data &&
                  'description' in request.resource.data &&
                  'category' in request.resource.data &&
                  'priority' in request.resource.data &&
                  'status' in request.resource.data &&
                  request.resource.data.status == 'open';

  // Solo admins pueden actualizar tickets
  allow update: if isAdmin();

  // No se pueden eliminar tickets
  allow delete: if false;
}
```

---

## ✅ VERIFICACIÓN

### **Después de actualizar las reglas:**

1. **Recarga el panel admin** (`/admin`)
   - Los errores deberían desaparecer
   - Deberías ver las estadísticas
   - Deberías ver los tickets (si hay)

2. **Visita una página** (ej: `/lobby`)
   - Debería crear automáticamente `analytics_stats/2025-12-11`
   - Verifica en Firebase Console → Firestore → `analytics_stats`

3. **Crea un ticket desde el perfil**
   - Debería aparecer en el panel admin

---

## 🚨 SI SIGUEN LOS ERRORES

### **Verifica:**

1. **¿Publicaste las reglas?**
   - Debe decir "Publicado" en Firebase Console
   - Espera 2-3 minutos después de publicar

2. **¿Eres admin?**
   - Verifica `users/{tu-uid}/role = "admin"`
   - Cierra sesión y vuelve a iniciar

3. **¿Las reglas están correctas?**
   - Compara `firestore.rules` con lo que está en Firebase Console
   - Deben ser idénticas

4. **¿Hay errores de sintaxis?**
   - Firebase Console te mostrará errores si hay problemas de sintaxis
   - Corrígelos antes de publicar

---

## 📝 NOTA IMPORTANTE

**Las colecciones se crean automáticamente** cuando se usan:
- `analytics_stats` se crea cuando alguien visita una página
- `tickets` se crea cuando un usuario crea un ticket

**NO necesitas crear nada manualmente** - solo actualizar las reglas.

---

**Última actualización:** 2025-12-11

