# 🚨 DIAGNÓSTICO CRÍTICO: Pantalla Blanca en Producción

**Fecha del incidente:** 16:41  
**Estado:** 🔴 CRÍTICO - Aplicación no funcional  
**Síntomas:** Pantalla blanca, avatares no cargan, mensajes no se actualizan, UI lenta

---

## 🔍 HIPÓTESIS DE CAUSA RAÍZ

### 1. 🔴 **Bucle Infinito de Lecturas Firestore** (ALTA PROBABILIDAD)
**Evidencia:**
- Acabamos de corregir un bucle infinito en `subscribeToRoomUsers`
- Si el fix no se desplegó o hay otro bucle similar, la cuota se agotaría
- Firestore bloquea lecturas cuando se excede la cuota → pantalla blanca

**Síntomas que coinciden:**
- ✅ Mensajes no se actualizan (onSnapshot bloqueado)
- ✅ Avatares no cargan (getDoc bloqueado)
- ✅ UI lenta (JavaScript bloqueado por errores)

**Verificación:**
```javascript
// En Firebase Console → Firestore → Usage
// Buscar pico de lecturas alrededor de 16:41
```

---

### 2. 🔴 **Error JavaScript No Manejado** (ALTA PROBABILIDAD)
**Evidencia:**
- Pantalla blanca = React Error Boundary activado o crash total
- No hay errores visibles = Error ocurre antes del render o en Error Boundary

**Posibles causas:**
- Error en `useEffect` que causa re-render infinito
- Error en `onSnapshot` callback que no está en try/catch
- Error en procesamiento de mensajes que rompe el estado

**Verificación:**
```javascript
// Revisar logs de ErrorBoundary
// Revisar console.error en producción (si está habilitado)
```

---

### 3. 🟡 **Fallo en WebSocket/Realtime** (MEDIA PROBABILIDAD)
**Evidencia:**
- Mensajes no se actualizan = onSnapshot no recibe datos
- Avatares no cargan = getDoc no funciona

**Posibles causas:**
- Conexión WebSocket de Firestore interrumpida
- Timeout en conexión (más de 60 segundos)
- Firestore en modo offline permanente

**Verificación:**
```javascript
// Revisar estado de conexión Firestore
// Verificar si hay errores de red en Network tab
```

---

### 4. 🟡 **Memory Leak o Loop Infinito en Frontend** (MEDIA PROBABILIDAD)
**Evidencia:**
- UI lenta al iniciar = JavaScript bloqueado
- Pantalla blanca = Browser crasheó o Error Boundary activado

**Posibles causas:**
- Loop infinito en `useEffect` sin cleanup
- Memory leak por listeners no desuscritos
- Re-renders infinitos por dependencias inestables

**Verificación:**
```javascript
// Chrome DevTools → Performance → Grabar durante carga
// Buscar loops o memory leaks
```

---

### 5. 🟢 **Backend/Firebase Detenido** (BAJA PROBABILIDAD)
**Evidencia:**
- Todo deja de funcionar a la vez
- No hay errores específicos

**Verificación:**
```javascript
// Firebase Console → Verificar estado de servicios
// Verificar si hay incidentes reportados
```

---

## 🚀 PASOS INMEDIATOS DE DEBUGGING

### **PASO 1: Verificar Firebase Console (2 minutos)**

1. **Firebase Console → Firestore → Usage**
   - Buscar pico de lecturas alrededor de **16:41**
   - Si hay pico masivo → **CAUSA CONFIRMADA: Cuota agotada**
   - Verificar si hay errores de "Quota Exceeded"

2. **Firebase Console → Authentication → Users**
   - Verificar si hay usuarios bloqueados o errores masivos

3. **Firebase Console → Functions → Logs**
   - Buscar errores alrededor de **16:41**

**Acción inmediata si cuota agotada:**
```javascript
// TEMPORAL: Aumentar límite de cuota o esperar reset (24h)
// PERMANENTE: Aplicar fix del bucle infinito
```

---

### **PASO 2: Revisar Logs de Producción (5 minutos)**

1. **Vercel/Netlify Logs**
   - Buscar errores alrededor de **16:41**
   - Buscar "ErrorBoundary", "Uncaught", "TypeError"

2. **Sentry/Error Tracking (si está configurado)**
   - Revisar errores reportados en **16:41**

3. **Browser Console (en producción)**
   - Abrir DevTools → Console
   - Buscar errores rojos
   - Buscar "Quota exceeded", "Permission denied", "Network error"

**Comandos útiles:**
```javascript
// En consola del navegador (producción)
localStorage.clear(); // Limpiar estado corrupto
sessionStorage.clear();
location.reload(); // Recargar forzado
```

---

### **PASO 3: Verificar Estado de Conexión (3 minutos)**

1. **Network Tab → Filtrar por "firestore" o "firebase"**
   - Verificar si hay requests fallando
   - Verificar latencia (si > 10s = problema)

2. **Application Tab → Local Storage**
   - Verificar si hay datos corruptos
   - Buscar keys con valores `null` o `undefined`

3. **Console → Ejecutar diagnóstico:**
```javascript
// Verificar conexión Firestore
import { db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Test de conexión
const testRef = doc(db, 'rooms', 'principal');
getDoc(testRef)
  .then(() => console.log('✅ Firestore conectado'))
  .catch(err => console.error('❌ Firestore error:', err));
```

---

## 🔍 VERIFICACIONES DE FRONTEND

### **1. ErrorBoundary Activado**

**Ubicación:** `src/components/ui/ErrorBoundary.jsx`

**Verificar:**
```javascript
// ¿Se activó el ErrorBoundary?
// Revisar si hay mensaje de error en pantalla
// Revisar logs de componentDidCatch
```

**Fix temporal:**
```javascript
// Si ErrorBoundary está mostrando error, forzar recarga:
window.location.reload();
```

---

### **2. Estado Global Corrupto**

**Verificar:**
```javascript
// En consola del navegador
console.log('User:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers);
// O si usas Context:
// Revisar AuthContext, ThemeContext, etc.
```

**Fix temporal:**
```javascript
// Limpiar estado corrupto
localStorage.clear();
sessionStorage.clear();
// Recargar
location.reload();
```

---

### **3. Loop Infinito en useEffect**

**Verificar:**
- Chrome DevTools → Performance → Grabar
- Buscar patrones repetitivos en el timeline
- CPU al 100% constante = loop infinito

**Archivos a revisar:**
- `src/pages/ChatPage.jsx` (líneas 542-984)
- `src/contexts/AuthContext.jsx` (useEffect de auth)
- Cualquier useEffect con dependencias inestables

**Fix temporal:**
```javascript
// Comentar temporalmente useEffect problemático
// O agregar guard clause más estricto
```

---

### **4. onSnapshot Sin Cleanup**

**Verificar:**
```javascript
// Buscar en código:
// - onSnapshot sin return (unsubscribe)
// - Múltiples onSnapshot para la misma query
// - onSnapshot en useEffect sin dependencias correctas
```

**Archivos críticos:**
- `src/pages/ChatPage.jsx` (línea 570, 751)
- `src/services/chatService.js` (línea 348)
- `src/services/presenceService.js` (múltiples onSnapshot)

**Fix:**
```javascript
// Asegurar que todos los onSnapshot tengan cleanup:
useEffect(() => {
  const unsubscribe = onSnapshot(/* ... */);
  return () => unsubscribe(); // ✅ CRÍTICO
}, [dependencies]);
```

---

## 🔍 VERIFICACIONES DE BACKEND/FIREBASE

### **1. Cuota de Firestore Agotada**

**Síntomas:**
- Todos los `getDoc`, `onSnapshot` fallan
- Error: "Quota exceeded" o "Resource exhausted"

**Verificación:**
```javascript
// Firebase Console → Firestore → Usage
// Verificar gráfico de lecturas
```

**Fix inmediato:**
1. Esperar reset de cuota (24 horas)
2. O aumentar límite en Firebase Console
3. **PERMANENTE:** Aplicar fix del bucle infinito

---

### **2. Reglas de Firestore Bloqueando**

**Síntomas:**
- Error "Permission denied" en consola
- Algunos datos cargan, otros no

**Verificación:**
```javascript
// Firebase Console → Firestore → Rules
// Verificar si hay cambios recientes
// Probar reglas en Rules Playground
```

**Fix:**
```javascript
// Revertir cambios recientes en reglas
// O ajustar reglas para permitir acceso necesario
```

---

### **3. Firebase Auth Expirado/Corrupto**

**Síntomas:**
- Usuarios no pueden autenticarse
- Tokens expirados

**Verificación:**
```javascript
// En consola del navegador
import { auth } from '@/config/firebase';
console.log('Auth state:', auth.currentUser);
```

**Fix temporal:**
```javascript
// Forzar re-autenticación
auth.signOut().then(() => {
  // Redirigir a login
  window.location.href = '/auth';
});
```

---

## 🔍 VERIFICACIONES DE REALTIME

### **1. WebSocket Desconectado**

**Síntomas:**
- Mensajes no se actualizan en tiempo real
- onSnapshot no recibe datos nuevos

**Verificación:**
```javascript
// En consola
import { db } from '@/config/firebase';
// Intentar suscripción de prueba
import { collection, onSnapshot } from 'firebase/firestore';
const testRef = collection(db, 'rooms', 'principal', 'messages');
const unsubscribe = onSnapshot(testRef, (snapshot) => {
  console.log('✅ Realtime funcionando:', snapshot.size);
}, (error) => {
  console.error('❌ Realtime error:', error);
});
```

**Fix:**
```javascript
// Forzar reconexión
// Firestore se reconecta automáticamente, pero puedes forzar:
window.location.reload();
```

---

### **2. Timeout en Conexión**

**Síntomas:**
- Conexión tarda > 60 segundos
- Timeout errors

**Verificación:**
```javascript
// Network tab → Filtrar por "firestore"
// Verificar latencia de requests
```

**Fix:**
```javascript
// Aumentar timeout (si es configurable)
// O verificar conexión de red del usuario
```

---

## 🔍 VERIFICACIONES DE RENDIMIENTO Y MEMORIA

### **1. Memory Leak**

**Síntomas:**
- UI se vuelve lenta progresivamente
- Browser consume cada vez más RAM

**Verificación:**
```javascript
// Chrome DevTools → Memory → Take heap snapshot
// Comparar antes y después de usar la app
// Buscar objetos que crecen sin límite
```

**Archivos sospechosos:**
- Listeners no desuscritos (onSnapshot, addEventListener)
- Estado que crece infinitamente (mensajes, usuarios)
- Cachés sin límite

**Fix:**
```javascript
// Limitar tamaño de arrays en estado
// Asegurar cleanup de todos los listeners
// Implementar límite en caché
```

---

### **2. CPU al 100%**

**Síntomas:**
- UI completamente congelada
- Browser no responde

**Verificación:**
```javascript
// Chrome DevTools → Performance → Grabar
// Buscar funciones que se ejecutan repetidamente
```

**Causas comunes:**
- Loop infinito en useEffect
- Re-renders infinitos
- Cálculos pesados en render

**Fix:**
```javascript
// Agregar guard clauses más estrictos
// Usar useMemo/useCallback para cálculos pesados
// Debounce/throttle en callbacks frecuentes
```

---

## 🛠️ FIXES SUGERIDOS

### **FIX TEMPORAL 1: Recarga Forzada con Limpieza**

```javascript
// Agregar en App.jsx o ErrorBoundary
if (window.location.search.includes('?force-reload=true')) {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = window.location.pathname;
}

// O crear botón de emergencia:
<button onClick={() => {
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}}>
  🔄 Recargar Aplicación
</button>
```

---

### **FIX TEMPORAL 2: Modo Degradado**

```javascript
// Si Firestore falla, mostrar mensaje y deshabilitar funcionalidades
const [firestoreAvailable, setFirestoreAvailable] = useState(true);

useEffect(() => {
  const testConnection = async () => {
    try {
      const testRef = doc(db, 'rooms', 'principal');
      await getDoc(testRef);
      setFirestoreAvailable(true);
    } catch (error) {
      if (error.code === 'resource-exhausted' || error.code === 'unavailable') {
        setFirestoreAvailable(false);
        // Mostrar mensaje al usuario
        toast({
          title: "Servicio temporalmente no disponible",
          description: "Estamos experimentando problemas técnicos. Por favor, intenta más tarde.",
          variant: "destructive"
        });
      }
    }
  };
  
  testConnection();
}, []);
```

---

### **FIX PERMANENTE 1: Mejorar ErrorBoundary**

```javascript
// src/components/ui/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // ✅ Enviar a servicio de tracking (Sentry, etc.)
    console.error('ErrorBoundary capturó:', error, errorInfo);
    
    // ✅ Opción de recarga automática
    if (error.message.includes('Quota exceeded') || 
        error.message.includes('Resource exhausted')) {
      // Esperar 5 segundos y recargar
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 5000);
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>Algo salió mal</h1>
          <button onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}>
            Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

### **FIX PERMANENTE 2: Validar Estado Antes de Render**

```javascript
// En ChatPage.jsx, agregar validación temprana
useEffect(() => {
  // ✅ Validar que Firestore esté disponible
  const checkFirestore = async () => {
    try {
      const testRef = doc(db, 'rooms', roomId);
      await getDoc(testRef);
    } catch (error) {
      if (error.code === 'resource-exhausted') {
        // Mostrar mensaje y deshabilitar funcionalidades
        setFirestoreAvailable(false);
        return;
      }
    }
  };
  
  checkFirestore();
}, [roomId]);
```

---

### **FIX PERMANENTE 3: Aplicar Fix del Bucle Infinito**

**Si el fix del bucle infinito no está desplegado:**

1. Verificar que `src/pages/ChatPage.jsx` tenga:
   - Debounce en consultas de roles (línea 787)
   - Dependencias `user?.id` en vez de `user` (líneas 1017, 1029, 1082)
   - Cleanup de debounces (línea 970)

2. Si no está, aplicar el fix inmediatamente:
   ```bash
   git pull origin main
   # Verificar que los cambios estén presentes
   npm run build
   vercel --prod
   ```

---

## ❓ PREGUNTAS PARA CONFIRMAR DIAGNÓSTICO

### **Preguntas Críticas:**

1. **¿Cuándo fue el último deploy?**
   - Si fue antes de 16:41 → El fix del bucle infinito no está desplegado
   - Si fue después → Puede ser otro problema

2. **¿Hay errores en Firebase Console?**
   - Firestore → Usage → ¿Pico de lecturas?
   - Authentication → ¿Errores masivos?

3. **¿El problema afecta a todos los usuarios o solo algunos?**
   - Todos → Problema de backend/Firebase
   - Algunos → Problema de frontend/estado local

4. **¿La pantalla blanca aparece inmediatamente o después de usar la app?**
   - Inmediatamente → Error en inicialización
   - Después → Memory leak o loop infinito

5. **¿Hay algún cambio reciente en código?**
   - Deploy reciente → Revisar cambios
   - Cambios en Firebase Rules → Revertir

6. **¿Qué muestra la consola del navegador?**
   - Errores rojos → Copiar y analizar
   - Sin errores → Error silencioso o ErrorBoundary

---

## 📋 CHECKLIST DE ACCIÓN INMEDIATA

- [ ] **1. Verificar Firebase Console → Firestore → Usage** (2 min)
  - [ ] Buscar pico de lecturas en 16:41
  - [ ] Verificar si hay "Quota exceeded"
  
- [ ] **2. Revisar Logs de Producción** (5 min)
  - [ ] Vercel/Netlify logs
  - [ ] Sentry/Error tracking
  - [ ] Browser console en producción

- [ ] **3. Verificar Estado de Conexión** (3 min)
  - [ ] Network tab → Requests de Firestore
  - [ ] Application tab → Local Storage

- [ ] **4. Aplicar Fix Temporal** (5 min)
  - [ ] Limpiar localStorage/sessionStorage
  - [ ] Recargar aplicación
  - [ ] Verificar si se resuelve

- [ ] **5. Si persiste, aplicar Fix Permanente** (15 min)
  - [ ] Verificar que fix del bucle infinito esté desplegado
  - [ ] Si no, desplegar inmediatamente
  - [ ] Mejorar ErrorBoundary

---

## 🎯 PRIORIDAD DE ACCIONES

1. **🔴 INMEDIATO (0-5 min):**
   - Verificar Firebase Console → Usage
   - Revisar logs de producción
   - Aplicar fix temporal (limpiar storage + recargar)

2. **🟡 URGENTE (5-15 min):**
   - Si cuota agotada → Esperar reset o aumentar límite
   - Si error no manejado → Mejorar ErrorBoundary
   - Verificar que fix del bucle infinito esté desplegado

3. **🟢 IMPORTANTE (15-60 min):**
   - Aplicar fixes permanentes
   - Mejorar manejo de errores
   - Agregar monitoreo (Sentry, etc.)

---

## 📝 NOTAS FINALES

**Si el problema es la cuota de Firestore agotada:**
- El fix del bucle infinito que aplicamos debería prevenir esto
- **CRÍTICO:** Asegurar que el fix esté desplegado en producción
- Considerar aumentar límite temporalmente mientras se verifica

**Si el problema es un error JavaScript no manejado:**
- Mejorar ErrorBoundary para capturar y reportar
- Agregar try/catch en todos los callbacks de onSnapshot
- Implementar logging de errores (Sentry, LogRocket, etc.)

**Si el problema es un loop infinito:**
- Aplicar el mismo patrón de fix que usamos para `subscribeToRoomUsers`
- Revisar todos los useEffect con dependencias inestables
- Agregar guard clauses más estrictos

---

**Estado:** 🔴 **INVESTIGACIÓN EN CURSO**  
**Próximo paso:** Verificar Firebase Console → Usage alrededor de 16:41

