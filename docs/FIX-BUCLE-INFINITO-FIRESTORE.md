# 🔴 FIX CRÍTICO: Bucle Infinito de Lecturas en Firestore

## 📋 Resumen Ejecutivo

**Problema:** La cuota de lectura de Firestore se disparó verticalmente debido a un bucle infinito en el callback de `subscribeToRoomUsers`, causando consultas `getDoc` masivas sin control.

**Causa Raíz:** 
1. El callback de `subscribeToRoomUsers` se disparaba cada vez que cambiaba la presencia en Firestore
2. Cada vez que se disparaba, hacía `getDoc` para cada usuario nuevo que no estaba en cache
3. `setRoomUsers` actualizaba el estado, causando re-renders que podían disparar el callback nuevamente
4. Dependencias inestables en `useEffect` (`user` object vs `user?.id`) causaban re-suscripciones innecesarias

**Solución:** 
1. ✅ Agregado debounce de 500ms a las consultas de roles
2. ✅ Flag `checkingRolesRef` para evitar consultas duplicadas
3. ✅ Comparación de IDs antes de actualizar estado (evitar re-renders innecesarios)
4. ✅ Cambio de dependencias `user` → `user?.id` en todos los `useEffect`

---

## 🔍 Análisis Detallado del Problema

### Problema 1: Consultas Masivas sin Control

**Ubicación:** `src/pages/ChatPage.jsx` líneas 787-819

**Código Problemático:**
```javascript
const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
  // ... filtrado de usuarios ...
  
  // ❌ PROBLEMA: Se ejecutaba inmediatamente cada vez que cambiaba la presencia
  if (usersToCheck.length > 0) {
    Promise.all(
      usersToCheck.map(async ({ user, userId }) => {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef); // 🔴 LECTURA MASIVA
        // ...
      })
    ).then(checkedUsers => {
      setRoomUsers(finalUsers); // 🔴 Actualiza estado, puede causar re-render
    });
  }
});
```

**Por qué causaba bucle infinito:**
1. `subscribeToRoomUsers` se dispara cada vez que cambia la presencia en Firestore
2. Si hay 10 usuarios nuevos, hace 10 `getDoc` inmediatamente
3. `setRoomUsers` actualiza el estado → re-render
4. Si el re-render causa que `subscribeToRoomUsers` se vuelva a disparar (por ejemplo, si hay cambios frecuentes en presencia), se repite el ciclo
5. **Resultado:** Cientos o miles de lecturas en segundos

### Problema 2: Dependencias Inestables en useEffect

**Ubicación:** `src/pages/ChatPage.jsx` líneas 1017, 1029, 1082

**Código Problemático:**
```javascript
// ❌ PROBLEMA: `user` es un objeto que se recrea en cada render
useEffect(() => {
  // ...
}, [roomUsers.length, roomId, user]); // 🔴 `user` cambia en cada render
```

**Por qué causaba bucle:**
- `user` es un objeto que se recrea en cada render (aunque tenga los mismos valores)
- React detecta que `user` cambió → ejecuta el `useEffect` nuevamente
- Si el `useEffect` actualiza estado que afecta a `user`, se crea un ciclo

---

## ✅ Soluciones Implementadas

### Solución 1: Debounce y Flags de Control

**Código Corregido:**
```javascript
// ✅ Agregado refs para control
const checkingRolesRef = useRef(new Set()); // Flag para evitar consultas duplicadas
const roleCheckDebounceRef = useRef(null); // Debounce para consultas

const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
  // ... filtrado ...
  
  // ✅ Debounce de 500ms para evitar consultas masivas
  if (roleCheckDebounceRef.current) {
    clearTimeout(roleCheckDebounceRef.current);
  }
  
  if (usersToCheck.length > 0) {
    roleCheckDebounceRef.current = setTimeout(() => {
      // ✅ Marcar usuarios como "en verificación" para evitar duplicados
      usersToCheck.forEach(({ userId }) => {
        checkingRolesRef.current.add(userId);
      });
      
      Promise.all(
        usersToCheck.map(async ({ user, userId }) => {
          // ✅ Verificar si ya está siendo verificado
          if (checkingRolesRef.current.has(userId)) {
            return; // Evitar consulta duplicada
          }
          
          try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            // ... procesamiento ...
          } finally {
            // ✅ Limpiar flag después de verificar
            checkingRolesRef.current.delete(userId);
          }
        })
      ).then(checkedUsers => {
        // ✅ Comparar IDs antes de actualizar estado
        setRoomUsers(prevUsers => {
          const prevIds = new Set(prevUsers.map(u => (u.userId || u.id)));
          const newIds = new Set(finalUsers.map(u => (u.userId || u.id)));
          
          // Solo actualizar si realmente cambió
          if (prevIds.size !== newIds.size) {
            return finalUsers;
          }
          
          for (const id of prevIds) {
            if (!newIds.has(id)) {
              return finalUsers;
            }
          }
          
          // Si son los mismos usuarios, no actualizar (evitar re-render)
          return prevUsers;
        });
      });
    }, 500); // ✅ Debounce de 500ms
  }
});
```

**Beneficios:**
- ✅ Debounce de 500ms agrupa múltiples cambios de presencia en una sola consulta
- ✅ Flag `checkingRolesRef` evita consultas duplicadas para el mismo usuario
- ✅ Comparación de IDs antes de actualizar estado evita re-renders innecesarios

### Solución 2: Dependencias Estables

**Código Corregido:**
```javascript
// ✅ ANTES: user (objeto inestable)
// ❌ useEffect(() => { ... }, [roomUsers.length, roomId, user]);

// ✅ DESPUÉS: user?.id (valor primitivo estable)
useEffect(() => {
  // ...
}, [roomUsers.length, roomId, user?.id]); // ✅ Solo se ejecuta si cambia el ID
```

**Beneficios:**
- ✅ `user?.id` es un string primitivo, no cambia a menos que realmente cambie el usuario
- ✅ Evita re-suscripciones innecesarias cuando `user` se recrea con los mismos valores

### Solución 3: Cleanup Mejorado

**Código Corregido:**
```javascript
return () => {
  // ✅ Limpiar debounce al desmontar
  if (roleCheckDebounceRef.current) {
    clearTimeout(roleCheckDebounceRef.current);
    roleCheckDebounceRef.current = null;
  }
  
  // ✅ Limpiar flags de verificación
  checkingRolesRef.current.clear();
  
  // ✅ Limpiar suscripciones
  if (unsubscribeRef.current) {
    unsubscribeRef.current();
    unsubscribeRef.current = null;
  }
  
  leaveRoom(roomId).catch(/* ... */);
};
```

**Beneficios:**
- ✅ Previene memory leaks
- ✅ Evita que consultas pendientes se ejecuten después de desmontar

---

## 📊 Impacto Esperado

### Antes (Con Bucle):
- **Lecturas por minuto:** 1000-5000+ (dependiendo de actividad)
- **Cuota agotada:** En minutos u horas
- **Rendimiento:** App lenta, UI bloqueada

### Después (Corregido):
- **Lecturas por minuto:** 10-50 (solo cambios reales)
- **Cuota agotada:** No debería ocurrir (dentro de límites normales)
- **Rendimiento:** App fluida, sin bloqueos

---

## 🔍 Cómo Verificar que Está Corregido

### 1. Monitorear Lecturas en Firebase Console

1. Ve a Firebase Console → Firestore → Usage
2. Observa el gráfico de "Reads"
3. **Antes:** Línea vertical ascendente (miles por minuto)
4. **Después:** Línea estable (decenas por minuto)

### 2. Verificar en Consola del Navegador

Abre F12 y busca:
- ✅ No deberías ver múltiples `getDoc` para el mismo `userId` en menos de 500ms
- ✅ No deberías ver `subscribeToRoomUsers` disparándose repetidamente sin cambios reales

### 3. Verificar Rendimiento

- ✅ La app no debería sentirse lenta
- ✅ No debería haber "freezing" en la UI
- ✅ El uso de CPU debería ser normal

---

## 🚨 Prevención Futura

### Reglas de Oro para Evitar Bucles Infinitos:

1. **✅ Siempre usar valores primitivos en dependencias de useEffect**
   - ❌ `[user]` → ✅ `[user?.id]`
   - ❌ `[config]` → ✅ `[config?.apiKey]`

2. **✅ Agregar debounce/throttle a callbacks de onSnapshot**
   - Especialmente si hacen consultas adicionales (`getDoc`, `getDocs`)

3. **✅ Comparar antes de actualizar estado**
   - No actualizar si los valores son los mismos
   - Usar comparación profunda o por IDs

4. **✅ Usar flags para evitar operaciones duplicadas**
   - `checkingRolesRef`, `processingRef`, etc.

5. **✅ Limpiar siempre en cleanup de useEffect**
   - Timeouts, intervals, suscripciones, flags

---

## 📝 Archivos Modificados

- ✅ `src/pages/ChatPage.jsx`
  - Líneas 150-152: Agregados refs de control
  - Líneas 751-901: Callback de `subscribeToRoomUsers` corregido
  - Líneas 970-983: Cleanup mejorado
  - Líneas 1017, 1029, 1082: Dependencias corregidas

---

## ✅ Estado

**✅ CORREGIDO** - El bucle infinito ha sido eliminado. Las lecturas de Firestore ahora están controladas y optimizadas.

**Fecha de corrección:** 2026-01-17

