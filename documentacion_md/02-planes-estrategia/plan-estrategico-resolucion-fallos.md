# 🎯 PLAN ESTRATÉGICO: RESOLUCIÓN DE FALLOS E INCONSISTENCIAS

**Fecha:** 2026-01-06  
**Prioridad:** De más crítico a menos crítico  
**Tiempo Estimado:** 2-3 semanas

---

## 📋 ESTRUCTURA DEL PLAN

1. [FASE 1: CRÍTICO - Seguridad y Memory Leaks (Semana 1)](#fase-1-crítico)
2. [FASE 2: ALTO - Velocidad e Inconsistencias (Semana 2)](#fase-2-alto)
3. [FASE 3: MEDIO - Autenticación y UI/UX (Semana 3)](#fase-3-medio)
4. [FASE 4: BAJO - Optimizaciones (Semana 3)](#fase-4-bajo)

---

## 🔴 FASE 1: CRÍTICO - Seguridad y Memory Leaks

**Duración:** Semana 1 (5 días)  
**Prioridad:** MÁXIMA

### Día 1-2: Seguridad y Reglas

#### ✅ Tarea 1.1: Sincronizar Reglas y Código para Usuarios NO Autenticados

**Archivos:**
- `firestore.rules.corregido`
- `src/services/chatService.js`

**Acciones:**
1. Decidir política definitiva:
   - ¿Usuarios NO autenticados pueden enviar mensajes PERMANENTEMENTE?
   - ¿O solo durante período de captación (5 días)?
2. Sincronizar validación de links:
   - Usar la misma regex en reglas y código
   - O mejor: validar solo en reglas (servidor)
3. Sincronizar validación de timestamp:
   - Si usuarios NO autenticados usan `serverTimestamp()`, reglas deben aceptarlo
   - O código debe usar timestamp del cliente si no hay auth

**Criterio de Éxito:**
- Reglas y código están sincronizados
- No hay inconsistencias
- Tests pasan

---

#### ✅ Tarea 1.2: Validar Campos de Delivery Status en Reglas

**Archivos:**
- `firestore.rules.corregido`
- `src/services/chatService.js`

**Acciones:**
1. Agregar validación en reglas para `update`:
   ```javascript
   allow update: if isAuthenticated() &&
                 request.resource.data.userId == resource.data.userId &&
                 request.resource.data.diff(resource.data).affectedKeys().hasOnly([
                   'reactions', 'content', 'status', 'deliveredTo', 'readBy', 'deliveredAt', 'readAt'
                 ]) &&
                 request.resource.data.status in ['sent', 'delivered', 'read'];
   ```
2. Validar que solo el remitente o destinatario puede actualizar estos campos

**Criterio de Éxito:**
- Reglas validan campos de delivery
- No se pueden falsificar estados

---

#### ✅ Tarea 1.3: Verificar y Corregir Servicios No Existentes

**Archivos:**
- `src/services/chatService.js`
- Verificar existencia de:
  - `src/services/performanceMonitor.js`
  - `src/services/messageDeliveryService.js`

**Acciones:**
1. Verificar si estos servicios existen
2. Si existen: verificar que funcionan correctamente
3. Si no existen:
   - Opción A: Crearlos (si se necesitan)
   - Opción B: Remover referencias y usar fallbacks

**Criterio de Éxito:**
- No hay imports de servicios inexistentes
- Código funciona sin errores

---

### Día 3-4: Memory Leaks

#### ✅ Tarea 1.4: Corregir setInterval Sin Cleanup

**Archivos:**
- `src/services/chatService.js` (líneas 66-68)

**Acciones:**
1. Guardar referencia del intervalo
2. Agregar cleanup en `beforeunload`
3. Prevenir múltiples intervalos (verificar si ya existe)

**Código:**
```javascript
let flushInterval = null;

if (typeof window !== 'undefined' && !flushInterval) {
  flushInterval = setInterval(() => {
    flushPendingMessages().catch(() => {});
  }, 5000);
  
  window.addEventListener('beforeunload', () => {
    if (flushInterval) {
      clearInterval(flushInterval);
      flushInterval = null;
    }
  });
}
```

**Criterio de Éxito:**
- Solo un intervalo activo
- Se limpia correctamente
- No hay memory leaks

---

#### ✅ Tarea 1.5: Corregir setTimeout Sin Cleanup en ChatMessages

**Archivos:**
- `src/components/chat/ChatMessages.jsx`

**Acciones:**
1. Buscar todos los `setTimeout` en `useEffect`
2. Agregar cleanup para cada uno
3. Guardar referencias en array y limpiar en return

**Código:**
```javascript
useEffect(() => {
  const timers = [];
  
  messages.forEach((message) => {
    if (isOwn && !messageChecks[message.id]) {
      const timer = setTimeout(() => {
        setMessageChecks(prev => ({ ...prev, [message.id]: 'double' }));
      }, 2000);
      timers.push(timer);
    }
  });
  
  return () => {
    timers.forEach(timer => clearTimeout(timer));
  };
}, [messages, currentUserId]);
```

**Criterio de Éxito:**
- Todos los timeouts se limpian
- No hay memory leaks
- App funciona correctamente después de 30+ minutos

---

#### ✅ Tarea 1.6: Implementar Sistema de Gestión de Listeners

**Archivos:**
- `src/pages/ChatPage.jsx`
- Crear: `src/services/listenerManager.js`

**Acciones:**
1. Crear servicio centralizado para gestionar listeners
2. Implementar límite máximo de listeners activos
3. Cleanup agresivo al cambiar de sala
4. Tracking de listeners activos

**Código Base:**
```javascript
// src/services/listenerManager.js
class ListenerManager {
  constructor(maxListeners = 10) {
    this.listeners = new Map();
    this.maxListeners = maxListeners;
  }
  
  add(id, unsubscribe) {
    if (this.listeners.size >= this.maxListeners) {
      // Remover el más antiguo
      const oldest = this.listeners.keys().next().value;
      this.remove(oldest);
    }
    this.listeners.set(id, unsubscribe);
  }
  
  remove(id) {
    const unsubscribe = this.listeners.get(id);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(id);
    }
  }
  
  cleanupAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

export const listenerManager = new ListenerManager();
```

**Criterio de Éxito:**
- Máximo 10 listeners activos
- Cleanup automático
- No hay memory leaks

---

### Día 5: Testing y Validación

#### ✅ Tarea 1.7: Testing de Fase 1

**Acciones:**
1. Probar en localhost:
   - Verificar que no hay memory leaks (Chrome DevTools)
   - Verificar que reglas funcionan correctamente
   - Verificar que servicios existen y funcionan
2. Probar en producción (staging):
   - Verificar que mensajes se envían correctamente
   - Verificar que usuarios NO autenticados pueden enviar (si aplica)
   - Verificar que no hay errores en consola

**Criterio de Éxito:**
- Todos los tests pasan
- No hay memory leaks
- No hay errores críticos

---

## 🟠 FASE 2: ALTO - Velocidad e Inconsistencias

**Duración:** Semana 2 (5 días)  
**Prioridad:** ALTA

### Día 1-2: Optimización de Velocidad

#### ✅ Tarea 2.1: Investigar Causa de Snapshots Lentos (11+ segundos)

**Archivos:**
- `src/services/chatService.js`
- `src/config/firebase.js`

**Acciones:**
1. Agregar logging detallado:
   - Tiempo de conexión a Firestore
   - Tiempo de query
   - Tiempo de procesamiento
   - Tiempo de callback
2. Verificar:
   - Conexión a internet
   - Latencia de Firestore
   - Índices de Firestore (¿existen?)
   - Tamaño de mensajes
3. Optimizar:
   - Reducir límite de mensajes si es necesario
   - Implementar paginación virtual
   - Usar `startAfter` para cargar más mensajes

**Criterio de Éxito:**
- Snapshots llegan en < 3 segundos
- UX fluida

---

#### ✅ Tarea 2.2: Optimizar Procesamiento de Mensajes

**Archivos:**
- `src/services/chatService.js` (líneas 350-367)

**Acciones:**
1. Mover procesamiento a `requestIdleCallback` o `setTimeout(0)`
2. Optimizar loops (ya hecho, verificar)
3. Reducir operaciones costosas en el callback

**Código:**
```javascript
const processMessages = (snapshot) => {
  // Procesamiento pesado en background
  requestIdleCallback(() => {
    const messages = snapshot.docs.map(doc => {
      // ... procesamiento
    });
    callback(messages);
  }, { timeout: 100 });
};
```

**Criterio de Éxito:**
- Procesamiento no bloquea UI
- Mensajes aparecen rápidamente

---

#### ✅ Tarea 2.3: Implementar Cache para Verificaciones

**Archivos:**
- `src/contexts/AuthContext.jsx`
- `src/pages/ChatPage.jsx`
- Crear: `src/services/sanctionsCache.js`

**Acciones:**
1. Crear servicio de cache para sanciones
2. Cachear resultados por 5-10 minutos
3. Solo verificar en login, luego usar cache

**Código:**
```javascript
// src/services/sanctionsCache.js
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos

export const getCachedSanctions = async (userId) => {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data;
  }
  
  const sanctions = await checkUserSanctions(userId);
  cache.set(userId, { data: sanctions, timestamp: Date.now() });
  return sanctions;
};
```

**Criterio de Éxito:**
- Reducción de queries a Firestore
- Latencia reducida
- Costos menores

---

### Día 3-4: Sincronización de Reglas y Código

#### ✅ Tarea 2.4: Sincronizar Validación de Contenido

**Archivos:**
- `firestore.rules.corregido`
- `src/services/chatService.js`
- `src/services/antiSpamService.js`

**Acciones:**
1. Crear función compartida para validación de links
2. Usar la misma regex en reglas y código
3. Sincronizar límite de contenido (1000 caracteres)

**Código:**
```javascript
// src/utils/validation.js
export const LINK_PATTERN = /(https?:\/\/|www\.|@|#)/i;
export const MAX_CONTENT_LENGTH = 1000;
```

**Criterio de Éxito:**
- Validación consistente
- No hay bypasses

---

#### ✅ Tarea 2.5: Clarificar Usuarios Anónimos vs No Autenticados

**Archivos:**
- `firestore.rules.corregido`
- `src/services/chatService.js`
- `src/contexts/AuthContext.jsx`

**Acciones:**
1. Decidir política:
   - ¿Usuarios anónimos de Firebase (con `auth.currentUser.isAnonymous`) pueden enviar mensajes?
   - ¿Usuarios completamente no autenticados (sin `auth.currentUser`) pueden enviar mensajes?
2. Sincronizar lógica:
   - Reglas deben reflejar la política
   - Código debe verificar correctamente

**Criterio de Éxito:**
- Política clara y documentada
- Reglas y código sincronizados

---

### Día 5: Testing y Validación

#### ✅ Tarea 2.6: Testing de Fase 2

**Acciones:**
1. Probar velocidad:
   - Snapshots < 3 segundos
   - Mensajes aparecen rápidamente
   - UI no se congela
2. Probar consistencia:
   - Validación funciona igual en cliente y servidor
   - No hay errores inesperados

**Criterio de Éxito:**
- Velocidad mejorada
- Consistencia verificada

---

## 🟡 FASE 3: MEDIO - Autenticación y UI/UX

**Duración:** Semana 3 (3 días)  
**Prioridad:** MEDIA

### Día 1: Autenticación

#### ✅ Tarea 3.1: Corregir Modal de Guest Username

**Archivos:**
- `src/components/auth/GuestUsernameModal.jsx`

**Acciones:**
1. Agregar sufijo único al username (timestamp o UUID corto)
2. O implementar verificación de unicidad (con costo)

**Código:**
```javascript
const uniqueUsername = `${nickname.trim()}_${Date.now().toString(36).slice(-6)}`;
```

**Criterio de Éxito:**
- Usernames únicos
- No hay confusión

---

#### ✅ Tarea 3.2: Corregir inMemoryPersistence en Localhost

**Archivos:**
- `src/config/firebase.js`

**Acciones:**
1. Usar `browserLocalPersistence` en desarrollo
2. `inMemoryPersistence` solo en producción

**Código:**
```javascript
const persistenceType = import.meta.env.DEV 
  ? browserLocalPersistence 
  : inMemoryPersistence;

setPersistence(auth, persistenceType);
```

**Criterio de Éxito:**
- Localhost funciona correctamente
- Sesión persiste entre recargas

---

#### ✅ Tarea 3.3: Verificar Edad Antes de Auto-login

**Archivos:**
- `src/pages/ChatPage.jsx`

**Acciones:**
1. Verificar edad ANTES de auto-login como guest
2. Bloquear acceso si no se verifica edad

**Criterio de Éxito:**
- Menores no pueden acceder
- Cumplimiento legal

---

### Día 2: UI/UX

#### ✅ Tarea 3.4: Mejorar Logging de Errores

**Archivos:**
- `vite.config.js`

**Acciones:**
1. Agregar más contexto a logs de errores
2. Filtrar errores transitorios (ya hecho parcialmente)

**Criterio de Éxito:**
- Errores útiles en consola
- No hay ruido

---

#### ✅ Tarea 3.5: Completar Sistema de Delivery Status

**Archivos:**
- `src/services/chatService.js`
- Verificar: `src/services/messageDeliveryService.js`

**Acciones:**
1. Verificar que servicio existe
2. Implementar ACKs correctamente
3. O remover campos si no se usan

**Criterio de Éxito:**
- Sistema de checks funciona
- Estados correctos

---

#### ✅ Tarea 3.6: Corregir Race Condition en useBotSystem

**Archivos:**
- `src/hooks/useBotSystem.js`

**Acciones:**
1. Estabilizar dependencias del `useEffect`
2. Usar `useRef` para prevenir inicializaciones múltiples

**Criterio de Éxito:**
- No hay mensajes duplicados
- Sistema funciona correctamente

---

### Día 3: Testing y Validación

#### ✅ Tarea 3.7: Testing de Fase 3

**Acciones:**
1. Probar autenticación:
   - Guest username funciona
   - Localhost funciona
   - Verificación de edad funciona
2. Probar UI/UX:
   - Errores útiles
   - Sistema de checks funciona

**Criterio de Éxito:**
- Todo funciona correctamente

---

## 🟢 FASE 4: BAJO - Optimizaciones

**Duración:** Semana 3 (2 días)  
**Prioridad:** BAJA

### Día 1: Optimizaciones

#### ✅ Tarea 4.1: Reducir Logs en Producción

**Archivos:**
- Múltiples archivos

**Acciones:**
1. Crear logger condicional
2. Remover logs en build de producción

**Código:**
```javascript
// src/utils/logger.js
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args); // Siempre loguear errores
  }
};
```

**Criterio de Éxito:**
- Menos logs en producción
- Bundle size menor

---

#### ✅ Tarea 4.2: Limpiar Imports No Usados

**Archivos:**
- `src/services/chatService.js`

**Acciones:**
1. Verificar imports
2. Remover si no se usan

**Criterio de Éxito:**
- Código limpio
- Bundle size menor

---

#### ✅ Tarea 4.3: Implementar Validación de Username

**Archivos:**
- `src/services/userService.js`

**Acciones:**
1. Crear colección `usernames` con permisos públicos de lectura
2. Implementar verificación de unicidad
3. O usar sufijo único automático

**Criterio de Éxito:**
- Usernames únicos
- No hay confusión

---

### Día 2: Testing Final

#### ✅ Tarea 4.4: Testing Final Completo

**Acciones:**
1. Testing exhaustivo:
   - Todas las funcionalidades
   - Todos los casos edge
   - Performance
   - Memory leaks
2. Documentación:
   - Actualizar documentación
   - Crear guía de deployment

**Criterio de Éxito:**
- Todo funciona correctamente
- Documentación actualizada

---

## 📊 RESUMEN DE FASES

| Fase | Duración | Prioridad | Tareas |
|------|----------|-----------|--------|
| FASE 1 | 5 días | 🔴 CRÍTICO | 7 tareas |
| FASE 2 | 5 días | 🟠 ALTO | 6 tareas |
| FASE 3 | 3 días | 🟡 MEDIO | 7 tareas |
| FASE 4 | 2 días | 🟢 BAJO | 4 tareas |
| **TOTAL** | **15 días** | | **24 tareas** |

---

## ✅ CHECKLIST DE VALIDACIÓN

### Seguridad
- [ ] Reglas y código sincronizados
- [ ] Validación de campos de delivery
- [ ] Servicios existen y funcionan
- [ ] No hay bypasses de seguridad

### Memory Leaks
- [ ] setInterval se limpia correctamente
- [ ] setTimeout se limpia en useEffect
- [ ] Listeners se gestionan correctamente
- [ ] No hay memory leaks después de 30+ minutos

### Velocidad
- [ ] Snapshots < 3 segundos
- [ ] Procesamiento no bloquea UI
- [ ] Cache implementado
- [ ] UX fluida

### Consistencia
- [ ] Validación sincronizada
- [ ] Límites sincronizados
- [ ] Política de usuarios clara

### Autenticación
- [ ] Guest username único
- [ ] Localhost funciona
- [ ] Verificación de edad funciona

### UI/UX
- [ ] Errores útiles
- [ ] Sistema de checks funciona
- [ ] No hay race conditions

### Optimizaciones
- [ ] Logs reducidos
- [ ] Imports limpios
- [ ] Validación de username

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **HOY:** Revisar y aprobar este plan
2. **MAÑANA:** Comenzar FASE 1 - Tarea 1.1
3. **Esta Semana:** Completar FASE 1
4. **Próxima Semana:** Completar FASE 2
5. **Semana 3:** Completar FASES 3 y 4

---

**Nota:** Este plan es flexible. Si encuentras problemas más críticos durante la implementación, ajusta las prioridades.


