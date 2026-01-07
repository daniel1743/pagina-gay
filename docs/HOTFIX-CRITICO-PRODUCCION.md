# 🚨 HOTFIX CRÍTICO - Producción Caída

**Fecha:** 2026-01-17  
**Urgencia:** 🔴 CRÍTICA - Aplicación caída 3+ horas  
**Estado:** PANTALLA BLANCA - Comunicación detenida

---

## 🔍 PROBLEMA IDENTIFICADO

### **Archivo:** `src/pages/ChatPage.jsx`
### **Líneas:** 753-965 (callback de `subscribeToRoomUsers`)

### **Fallo Real:**

**Línea 909:** `setRoomUsers(filteredUsers)` se ejecuta **INMEDIATAMENTE** cuando hay usuarios para verificar, **ANTES** del debounce.

**Línea 948:** `setRoomUsers` se ejecuta **NUEVAMENTE** al final del callback.

**Resultado:**
1. El callback de `subscribeToRoomUsers` se dispara cada vez que cambia la presencia
2. Se ejecuta `setRoomUsers` **DOS VECES** en el mismo callback (líneas 909 y 948)
3. Cada `setRoomUsers` causa un re-render
4. El re-render puede disparar el `useEffect` nuevamente si las dependencias cambian
5. Se crea una nueva suscripción → **LOOP INFINITO**
6. La app se congela → **PANTALLA BLANCA**

---

## 🛠️ HOTFIX INMEDIATO

### **Cambio 1: Eliminar setRoomUsers inmediato**

```javascript
// ❌ ELIMINAR ESTA LÍNEA (909):
setRoomUsers(filteredUsers);

// ✅ REEMPLAZAR CON:
// NO actualizar estado aquí - esperar al debounce
```

### **Cambio 2: Agregar guard para evitar ejecuciones duplicadas**

```javascript
// Agregar ref al inicio del componente:
const usersUpdateInProgressRef = useRef(false);

// En el callback, agregar guard:
const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
  // 🔒 CRÍTICO: Evitar procesamiento si ya hay una actualización en progreso
  if (usersUpdateInProgressRef.current) {
    return; // Ignorar este callback
  }
  
  // ... resto del código ...
});
```

### **Cambio 3: Marcar actualización en progreso**

```javascript
// Antes de setRoomUsers, marcar:
usersUpdateInProgressRef.current = true;

// Después de setRoomUsers, desmarcar:
setTimeout(() => {
  usersUpdateInProgressRef.current = false;
}, 100);
```

---

## 📝 CÓDIGO COMPLETO DEL HOTFIX

```javascript
// En ChatPage.jsx, línea ~150, agregar:
const usersUpdateInProgressRef = useRef(false);

// En el callback de subscribeToRoomUsers (línea ~753), modificar:
const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
  // 🔒 CRÍTICO: Evitar procesamiento si ya hay una actualización en progreso
  if (usersUpdateInProgressRef.current) {
    return; // Ignorar este callback para evitar loops
  }
  
  // ✅ Filtrar solo usuarios activos
  const activeUsers = filterActiveUsers(users);
  
  // ... código de filtrado ...
  
  // 🔒 CRÍTICO: Debounce para evitar consultas masivas
  if (roleCheckDebounceRef.current) {
    clearTimeout(roleCheckDebounceRef.current);
    roleCheckDebounceRef.current = null;
  }
  
  if (usersToCheck.length > 0) {
    roleCheckDebounceRef.current = setTimeout(() => {
      usersUpdateInProgressRef.current = true; // ✅ Marcar en progreso
      
      Promise.all(/* ... */)
        .then(checkedUsers => {
          // ... procesamiento ...
          
          setRoomUsers(prevUsers => {
            // ... comparación ...
            return finalUsers;
          });
          
          // ✅ Desmarcar después de actualizar
          setTimeout(() => {
            usersUpdateInProgressRef.current = false;
          }, 100);
        })
        .catch(error => {
          // ... error handling ...
          usersUpdateInProgressRef.current = false; // ✅ Desmarcar en error
        });
    }, 500);
    
    // ❌ ELIMINAR: setRoomUsers(filteredUsers); // Línea 909
    return;
  }
  
  // ✅ Actualizar estado solo una vez, con guard
  usersUpdateInProgressRef.current = true;
  setRoomUsers(prevUsers => {
    // ... comparación ...
    return filteredUsers;
  });
  setTimeout(() => {
    usersUpdateInProgressRef.current = false;
  }, 100);
});
```

---

## ⚡ IMPLEMENTACIÓN INMEDIATA

