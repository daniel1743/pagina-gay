# 🔄 Plan de Recuperación Gradual - Post Hotfix Firebase

**Fecha de Hotfix**: 2026-01-07
**Incidente**: Loop infinito de Firebase (500,000+ lecturas en 6 minutos)
**Estado**: Hotfix aplicado ✅ - En recuperación gradual 🔄

---

## 📋 Resumen de Cambios Aplicados

Se deshabilitaron **3 loops críticos** que causaban lecturas infinitas:

### ✅ LOOP #1: subscribeToMultipleRoomCounts (DESHABILITADO)
**Archivos modificados**:
- `src/components/chat/ChatSidebar.jsx` (línea 44-66)
- `src/components/lobby/RoomsModal.jsx` (línea 41-60)
- `src/components/lobby/GlobalStats.jsx` (línea 11-28)
- `src/pages/LobbyPage.jsx` (línea 205-222)
- `src/pages/LobbyPage.new.jsx` (línea 46-63)

**Problema**: 5 componentes × 15 salas = **75 listeners activos** simultáneos.

**Solución temporal**: Contadores estáticos (0 usuarios en todas las salas).

---

### ✅ LOOP #2: getDoc queries en ChatPage (DESHABILITADO)
**Archivo modificado**:
- `src/pages/ChatPage.jsx` (línea 800-891)

**Problema**: Consultas `getDoc` masivas en cada cambio de `roomPresence` sin throttle efectivo.

**Solución temporal**: Incluir TODOS los usuarios sin verificar roles.

---

### ✅ LOOP #3: Delivery Tracking (DESHABILITADO)
**Archivo modificado**:
- `src/services/chatService.js` (línea 469-479)

**Problema**: `markAsDelivered` ejecutaba escrituras por cada mensaje recibido.

**Solución temporal**: `shouldProcessDelivery = false`

---

## 🔍 Monitoreo Pre-Recuperación

Antes de comenzar la recuperación, verifica que el consumo esté estabilizado:

### 1. Firebase Console
```
1. Ir a Firebase Console → Firestore → Usage
2. Verificar que las lecturas/escrituras estén en niveles normales
3. Esperar al menos 15 minutos estable antes de continuar
```

### 2. Consola del Navegador
```javascript
// Abrir DevTools → Console
console.log('Listeners activos:', window.__activeFirestoreListeners);
// Debe mostrar un número bajo (< 10)
```

### 3. Network Tab
```
1. Abrir DevTools → Network → WS (WebSockets)
2. Filtrar por "firestore"
3. Verificar que NO haya miles de mensajes por segundo
4. Debe haber actividad mínima en reposo
```

---

## 🔄 Fase 1: Recuperación de subscribeToMultipleRoomCounts

**Objetivo**: Restablecer contadores de usuarios sin crear loops.

### Paso 1.1: Crear versión optimizada de subscribeToMultipleRoomCounts

Crear un nuevo archivo `src/services/presenceServiceOptimized.js`:

```javascript
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * 🔥 VERSIÓN OPTIMIZADA con deduplicación y throttling
 * Evita crear múltiples listeners para las mismas salas
 */

// Cache global de listeners (singleton)
const activeListeners = new Map();
const callbacks = new Map();
let throttleTimeout = null;

export const subscribeToMultipleRoomCountsOptimized = (roomIds, callback) => {
  // ✅ Registrar callback
  const callbackId = Math.random().toString(36);
  callbacks.set(callbackId, callback);

  // ✅ Crear listeners solo si no existen
  const newListeners = [];

  roomIds.forEach(roomId => {
    if (!activeListeners.has(roomId)) {
      const usersRef = collection(db, 'roomPresence', roomId, 'users');

      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        // ✅ Throttle: Agrupar actualizaciones cada 2 segundos
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }

        throttleTimeout = setTimeout(() => {
          // Notificar a TODOS los callbacks registrados
          const counts = {};
          activeListeners.forEach((unsub, id) => {
            counts[id] = snapshot.size; // Simplificado: solo contar
          });

          callbacks.forEach(cb => cb(counts));
        }, 2000); // ✅ Throttle de 2 segundos
      });

      activeListeners.set(roomId, unsubscribe);
      newListeners.push(roomId);
    }
  });

  console.log(`✅ Listeners creados: ${newListeners.length} (total activos: ${activeListeners.size})`);

  // ✅ Cleanup: Solo remover callback, NO listeners
  return () => {
    callbacks.delete(callbackId);
    console.log(`✅ Callback removido (callbacks activos: ${callbacks.size})`);

    // Solo destruir listeners si NO hay más callbacks
    if (callbacks.size === 0) {
      activeListeners.forEach((unsub, roomId) => {
        unsub();
        console.log(`🧹 Listener destruido para sala: ${roomId}`);
      });
      activeListeners.clear();
    }
  };
};
```

### Paso 1.2: Probar en UN componente primero (GlobalStats)

```javascript
// src/components/lobby/GlobalStats.jsx
import { subscribeToMultipleRoomCountsOptimized } from '@/services/presenceServiceOptimized';

useEffect(() => {
  const roomIds = roomsData.map((room) => room.id);
  const unsubscribe = subscribeToMultipleRoomCountsOptimized(roomIds, (counts) => {
    setRoomCounts(counts);
  });

  return () => unsubscribe();
}, []);
```

### Paso 1.3: Monitorear por 30 minutos

```bash
# Verificar en Firebase Console
# Lecturas deben mantenerse estables (< 1000/min)

# Verificar en Consola del Navegador
console.log('Listeners activos:', window.__activeFirestoreListeners);
# Debe mostrar ~15 listeners (uno por sala)
```

### Paso 1.4: Si es exitoso, activar en el resto de componentes (UNO A LA VEZ)

**Orden recomendado**:
1. ✅ GlobalStats (ya habilitado)
2. RoomsModal (esperar 15 min, monitorear)
3. ChatSidebar (esperar 15 min, monitorear)
4. LobbyPage (esperar 15 min, monitorear)
5. LobbyPage.new (esperar 15 min, monitorear)

**Entre cada activación**:
- Esperar 15 minutos
- Verificar Firebase Usage
- Verificar consola del navegador
- Si hay picos, REVERTIR inmediatamente

---

## 🔄 Fase 2: Recuperación de Role Checking (getDoc queries)

**Objetivo**: Restaurar filtrado de moderadores sin loops.

### Paso 2.1: Implementar estrategia de cache persistente

Crear `src/services/roleCache.js`:

```javascript
/**
 * 🔥 Cache persistente de roles de usuarios
 * Reduce consultas a Firestore de miles a ~10 por día
 */

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const CACHE_KEY = 'user_roles_cache_v1';

export class RoleCache {
  constructor() {
    this.cache = this.loadFromLocalStorage();
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return new Map();

      const parsed = JSON.parse(stored);
      const cache = new Map();

      Object.entries(parsed).forEach(([userId, data]) => {
        // Verificar si el cache expiró
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          cache.set(userId, data.role);
        }
      });

      return cache;
    } catch {
      return new Map();
    }
  }

  saveToLocalStorage() {
    try {
      const obj = {};
      this.cache.forEach((role, userId) => {
        obj[userId] = {
          role,
          timestamp: Date.now()
        };
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Error guardando cache de roles:', e);
    }
  }

  get(userId) {
    return this.cache.get(userId);
  }

  set(userId, role) {
    this.cache.set(userId, role);
    this.saveToLocalStorage();
  }

  has(userId) {
    return this.cache.has(userId);
  }
}

export const roleCache = new RoleCache();
```

### Paso 2.2: Implementar batch checking en ChatPage.jsx

```javascript
// ChatPage.jsx - NUEVO ENFOQUE (reemplazar loop deshabilitado)

// ✅ Verificar roles en batch cada 5 minutos (NO en cada callback)
useEffect(() => {
  if (!user?.id) return;

  const checkRolesBatch = async () => {
    const usersToCheck = roomUsers
      .filter(u => !roleCache.has(u.userId || u.id))
      .slice(0, 10); // ✅ Máximo 10 usuarios por batch

    if (usersToCheck.length === 0) return;

    console.log(`🔍 Verificando roles de ${usersToCheck.length} usuarios...`);

    const results = await Promise.all(
      usersToCheck.map(async (u) => {
        try {
          const userDocRef = doc(db, 'users', u.userId || u.id);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const role = userDoc.data().role || null;
            roleCache.set(u.userId || u.id, role);
            return { userId: u.userId || u.id, role };
          }

          roleCache.set(u.userId || u.id, null);
          return { userId: u.userId || u.id, role: null };
        } catch (error) {
          console.warn(`Error checking role for ${u.userId}:`, error);
          return { userId: u.userId || u.id, role: null };
        }
      })
    );

    console.log(`✅ Roles verificados:`, results);
  };

  // ✅ Verificar al montar y cada 5 minutos
  checkRolesBatch();
  const interval = setInterval(checkRolesBatch, 5 * 60 * 1000);

  return () => clearInterval(interval);
}, [roomUsers, user]);

// ✅ Filtrar usuarios usando el cache (NO getDoc en cada render)
const filteredUsers = roomUsers.filter(u => {
  const role = roleCache.get(u.userId || u.id);
  return role !== 'admin' && role !== 'moderator';
});
```

### Paso 2.3: Monitorear por 1 hora

```bash
# Verificar que las consultas sean mínimas
# Debe haber ~10 lecturas cada 5 minutos (NO miles por segundo)
```

---

## 🔄 Fase 3: Recuperación de Delivery Tracking

**Objetivo**: Restaurar checks de entrega sin loops.

### Paso 3.1: Implementar batch delivery tracking

```javascript
// chatService.js - Reemplazar shouldProcessDelivery

// ✅ Agrupar ACKs en batches cada 5 segundos
let deliveryBatch = [];
let deliveryBatchTimeout = null;

const queueDeliveryACK = (roomId, messageId, userId) => {
  deliveryBatch.push({ roomId, messageId, userId });

  if (deliveryBatchTimeout) {
    clearTimeout(deliveryBatchTimeout);
  }

  deliveryBatchTimeout = setTimeout(async () => {
    if (deliveryBatch.length === 0) return;

    console.log(`📬 Enviando ${deliveryBatch.length} ACKs en batch...`);

    // ✅ Enviar todos los ACKs a la vez usando batch writes
    const batch = writeBatch(db);

    deliveryBatch.forEach(({ roomId, messageId, userId }) => {
      const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
      batch.update(msgRef, {
        deliveredTo: arrayUnion(userId),
        deliveredAt: serverTimestamp()
      });
    });

    try {
      await batch.commit();
      console.log(`✅ ${deliveryBatch.length} ACKs enviados`);
    } catch (error) {
      console.warn('Error enviando batch de ACKs:', error);
    }

    deliveryBatch = [];
  }, 5000); // ✅ Batch cada 5 segundos
};

// ✅ Cambiar shouldProcessDelivery a usar batch
const shouldProcessDelivery = !snapshot.metadata.hasPendingWrites && !isFirstSnapshotNow;

if (shouldProcessDelivery) {
  orderedMessages.forEach(msg => {
    if (auth.currentUser && msg.userId !== auth.currentUser.uid) {
      const deliveryKey = `${roomId}:${msg.id}:${auth.currentUser.uid}`;

      if (!window.__deliveredMessages) {
        window.__deliveredMessages = new Set();
      }

      if (!window.__deliveredMessages.has(deliveryKey)) {
        window.__deliveredMessages.add(deliveryKey);
        queueDeliveryACK(roomId, msg.id, auth.currentUser.uid); // ✅ Usar batch
      }
    }
  });
}
```

### Paso 3.2: Habilitar y monitorear

```javascript
// chatService.js
const shouldProcessDelivery = !snapshot.metadata.hasPendingWrites && !isFirstSnapshotNow;
```

### Paso 3.3: Verificar por 30 minutos

```bash
# Verificar que las escrituras sean en batches (NO individuales)
# Debe haber ~10-20 escrituras cada 5 segundos (NO miles)
```

---

## 📊 Checklist de Verificación por Fase

### Antes de cada fase:
- [ ] Firebase Usage estable por 30 minutos
- [ ] Consola sin errores
- [ ] Listeners < 20 activos
- [ ] Network tab sin flood de requests

### Durante cada fase:
- [ ] Monitorear Firebase Console en tiempo real
- [ ] Verificar consola del navegador cada 5 minutos
- [ ] Tomar screenshots de métricas
- [ ] Documentar cualquier anomalía

### Si algo sale mal:
```bash
# REVERTIR INMEDIATAMENTE:
git checkout HEAD -- <archivo_modificado>
# O simplemente comentar el código recién activado
```

---

## 🚨 Señales de Alerta

**REVERTIR INMEDIATAMENTE si ves**:
- 🔴 Lecturas > 10,000/minuto en Firebase
- 🔴 Escrituras > 1,000/minuto en Firebase
- 🔴 `window.__activeFirestoreListeners` > 100
- 🔴 Network tab con flood de WebSocket messages
- 🔴 Consola con errores de "permission-denied" masivos
- 🔴 Navegador lag o freeze

---

## ✅ Criterios de Éxito

La recuperación es exitosa cuando:
- ✅ Lecturas < 5,000/minuto (normal)
- ✅ Escrituras < 500/minuto (normal)
- ✅ Listeners activos: ~15-30 (uno por sala × componentes necesarios)
- ✅ UI responsiva sin lag
- ✅ Contadores de usuarios funcionando correctamente
- ✅ No errores en consola por 1 hora continua

---

## 📝 Notas Finales

1. **NO apresurarse**: Cada fase debe monitorearse mínimo 30 minutos.
2. **Documentar**: Tomar screenshots de Firebase Usage antes/después.
3. **Rollback plan**: Mantener commits separados por fase para fácil rollback.
4. **Testing**: Probar en múltiples navegadores/dispositivos.
5. **Comunicación**: Informar al equipo sobre cambios en producción.

---

**Última actualización**: 2026-01-07
**Responsable**: Equipo de desarrollo
**Estado**: Hotfix aplicado ✅ - Pendiente recuperación gradual 🔄
