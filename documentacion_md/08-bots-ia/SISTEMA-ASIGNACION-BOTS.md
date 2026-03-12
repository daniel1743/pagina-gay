# 🤖 SISTEMA DE ASIGNACIÓN DE BOTS POR SALA

## ✅ IMPLEMENTACIÓN COMPLETA

Se ha implementado un sistema **CRÍTICO** para garantizar que los bots:
1. **Solo pueden estar en UNA sala a la vez**
2. **Tienen nombres DIFERENTES en cada sala**
3. **Tienen avatares DIFERENTES en cada sala**
4. **Se limpian correctamente cuando salen de una sala**

---

## 📁 ARCHIVOS CREADOS

### `src/services/botRoomAssignment.js` (NUEVO)
Sistema central que gestiona:
- ✅ Asignación global de bots a salas (Map de botId → roomId)
- ✅ Nombres únicos por sala (pools de nombres específicos)
- ✅ Avatares únicos por sala (diferentes seeds de DiceBear)
- ✅ Cleanup automático cuando un bot sale

**Funciones principales:**
```javascript
// Asignar bot a sala (mueve si está en otra)
assignBotToRoom(botId, roomId)

// Obtener perfil personalizado para sala
getBotProfileForRoom(botId, roomId)
// → Retorna: { id, username: "Joaquín", avatar: "...", currentRoom: "santiago" }

// Limpiar bot de sala
cleanupBotFromRoom(botId, roomId, username, avatar)

// Verificar asignación
isBotAssigned(botId)           // → true/false
getBotCurrentRoom(botId)       // → "global" | "santiago" | null
```

---

## 🔧 ARCHIVOS MODIFICADOS

### `src/services/botHostSystem.js`
**Cambios:**
- ✅ Importa funciones de `botRoomAssignment.js`
- ✅ `getAvailableBots()` verifica que bots NO estén en otras salas
- ✅ `assignHostBot()` usa `getBotProfileForRoom()` para perfiles únicos
- ✅ Guarda metadata (username, avatar) para cleanup
- ✅ `rotateHostBot()` hace cleanup del bot saliente
- ✅ `checkUserInactivity()` hace cleanup por inactividad
- ✅ `clearRoomHosts()` limpia todos los bots de la sala

### `src/services/botCoordinator.js`
**Cambios:**
- ✅ Importa funciones de `botRoomAssignment.js`
- ✅ `startBotsForRoom()` verifica disponibilidad de bots
- ✅ Usa `getBotProfileForRoom()` para crear perfiles personalizados
- ✅ `stopAllBots()` hace cleanup de todos los bots asignados

---

## 🎨 NOMBRES Y AVATARES POR SALA

### Nombres (Ejemplos)
```javascript
ROOM_NAME_POOLS = {
  global: ['Sebastián', 'Diego', 'Matías', 'Felipe', ...],
  santiago: ['Joaquín', 'Tomás', 'Vicente', 'Benjamín', ...],
  gaming: ['Gamer_Alex', 'ProGamer_Max', 'PlayerOne', ...],
  'mas-30': ['Carlos', 'Fernando', 'Roberto', ...],
  valparaiso: ['Raúl', 'Andrés', 'Gonzalo', ...],
  'vina-del-mar': ['Bruno', 'Mateo', 'Gabriel', ...],
  concepcion: ['Claudio', 'Patricio', 'Marcelo', ...]
}
```

### Avatares (Seeds diferentes)
```javascript
ROOM_AVATAR_SEEDS = {
  global: ['Apollo', 'Zeus', 'Hermes', 'Ares', ...],
  santiago: ['Luna', 'Sol', 'Estrella', 'Cometa', ...],
  gaming: ['Pixel', 'Byte', 'Code', 'Debug', ...],
  'mas-30': ['Oak', 'Pine', 'Cedar', 'Maple', ...],
  ...
}
```

**Resultado:**
- `bot_carlos` en **global** → Nombre: "Sebastián", Avatar: seed "Apollo"
- `bot_carlos` en **santiago** → Nombre: "Joaquín", Avatar: seed "Luna"
- ⚠️ `bot_carlos` NO puede estar en ambas salas simultáneamente

---

## 🔍 FLUJO DE ASIGNACIÓN

### 1. Usuario entra a sala "global"
```
1. botHostSystem.assignHostBot(roomId: "global", userId: "user123")
2. getAvailableBots("global", []) → Obtiene bots NO asignados
3. Selecciona bot_carlos
4. getBotProfileForRoom("bot_carlos", "global")
   → Genera nombre único: "Sebastián"
   → Genera avatar único: seed "Apollo"
   → Asigna bot a sala "global"
5. Guarda metadata: { username: "Sebastián", avatar: "https://..." }
6. Bot saluda como "Sebastián"
```

### 2. Si bot_carlos intenta ir a "santiago"
```
1. assignBotToRoom("bot_carlos", "santiago")
2. Detecta: bot_carlos está en "global"
3. Mueve bot:
   - unassignBotFromRoom("bot_carlos") → Libera de "global"
   - assignBotToRoom("bot_carlos", "santiago") → Asigna a "santiago"
4. getBotProfileForRoom("bot_carlos", "santiago")
   → Genera NUEVO nombre: "Joaquín"
   → Genera NUEVO avatar: seed "Luna"
5. Bot ahora se llama "Joaquín" en "santiago"
```

### 3. Cleanup cuando bot sale
```
1. rotateHostBot(roomId, userId)
2. Obtiene metadata del bot: { username: "Joaquín", avatar: "..." }
3. cleanupBotFromRoom("bot_carlos", "santiago", "Joaquín", avatar)
   - Libera nombre "Joaquín" del pool de "santiago"
   - Libera avatar del pool de "santiago"
   - Desasigna bot de "santiago"
4. Bot disponible para ser asignado a otra sala
```

---

## ✅ VERIFICACIÓN

### Test ejecutado: `test-bot-assignment.js`
```
✅ PRUEBA 1: Bot asignado a sala - PASÓ
✅ PRUEBA 2: Bot movido entre salas - PASÓ
✅ PRUEBA 3: Bot no está en sala anterior - PASÓ
✅ PRUEBA 4: Múltiples bots en salas diferentes - PASÓ
✅ PRUEBA 5: Cleanup de bot - PASÓ

🎉 TODAS LAS PRUEBAS PASARON
```

---

## 🔧 LOGS EN CONSOLA

Al ejecutar la app, verás logs como:

```
✅ [BOT ASSIGNMENT] Bot bot_carlos asignado a sala global
✅ [BOT NAME] Bot bot_carlos en sala global se llamará: Sebastián
✅ [BOT AVATAR] Bot bot_carlos en sala global tendrá avatar único
✅ [BOT PROFILE] Bot bot_carlos personalizado para sala global: Sebastián

⚠️ [BOT ASSIGNMENT] Bot bot_carlos se movió de sala global a santiago
✅ [BOT ASSIGNMENT] Bot bot_carlos desasignado de sala global
✅ [BOT ASSIGNMENT] Bot bot_carlos asignado a sala santiago
✅ [BOT NAME] Bot bot_carlos en sala santiago se llamará: Joaquín

✅ Cleanup realizado: Bot bot_carlos liberado de sala santiago
```

---

## 🎯 GARANTÍAS DEL SISTEMA

### ✅ REQUISITO 1: Un bot en UNA sala a la vez
**Implementación:**
- `botRoomAssignments` Map global rastrea qué bot está en qué sala
- `assignBotToRoom()` verifica y mueve bot si está en otra sala
- `getAvailableBots()` filtra bots ya asignados a otras salas

**Prueba:**
```javascript
assignBotToRoom('bot_carlos', 'global')    // ✅ Asignado a global
assignBotToRoom('bot_carlos', 'santiago')  // ⚠️ MOVIDO de global a santiago
getBotCurrentRoom('bot_carlos')            // → "santiago" (NO "global")
```

### ✅ REQUISITO 2: Nombres diferentes por sala
**Implementación:**
- `ROOM_NAME_POOLS` tiene pools exclusivos por sala
- `generateUniqueBotName()` selecciona nombre del pool de la sala
- `usedNamesPerRoom` Map previene repeticiones dentro de la misma sala

**Prueba:**
```javascript
// bot_carlos en global
getBotProfileForRoom('bot_carlos', 'global')
// → { username: "Sebastián", ... }

// MISMO bot en santiago
getBotProfileForRoom('bot_carlos', 'santiago')
// → { username: "Joaquín", ... }  ← NOMBRE DIFERENTE
```

### ✅ REQUISITO 3: Avatares diferentes por sala
**Implementación:**
- `ROOM_AVATAR_SEEDS` tiene seeds exclusivos por sala
- `ROOM_AVATAR_COLORS` tiene colores exclusivos por sala
- `generateUniqueBotAvatar()` crea avatares únicos con DiceBear

**Prueba:**
```javascript
// bot_carlos en global
getBotProfileForRoom('bot_carlos', 'global')
// → { avatar: "https://api.dicebear.com/.../seed=Apollo&backgroundColor=b6e3f4" }

// MISMO bot en santiago
getBotProfileForRoom('bot_carlos', 'santiago')
// → { avatar: "https://api.dicebear.com/.../seed=Luna&backgroundColor=a8e6cf" }
//    ← SEED DIFERENTE, COLOR DIFERENTE
```

### ✅ REQUISITO 4: Cleanup correcto
**Implementación:**
- `cleanupBotFromRoom()` libera nombre y avatar usados
- Se llama en: rotación, inactividad, salida de sala
- Nombres/avatares quedan disponibles para reutilización

**Prueba:**
```javascript
// Bot sale de sala
cleanupBotFromRoom('bot_carlos', 'global', 'Sebastián', avatarUrl)
// → Nombre "Sebastián" libre en pool de "global"
// → Avatar libre en pool de "global"
// → bot_carlos desasignado de "global"

isBotAssigned('bot_carlos')  // → false (disponible)
```

---

## 🚀 CÓMO PROBAR

1. **Ejecutar la aplicación:**
   ```bash
   npm run dev
   ```

2. **Abrir dos ventanas del navegador:**
   - Ventana 1: Entrar a sala "global"
   - Ventana 2: Entrar a sala "santiago"

3. **Observar en consola del navegador:**
   - Los bots en "global" tendrán nombres como: Sebastián, Diego, Matías
   - Los bots en "santiago" tendrán nombres como: Joaquín, Tomás, Vicente
   - **IMPORTANTE:** NO verás el mismo bot en ambas salas

4. **Verificar avatares:**
   - Los avatares en "global" tendrán tonos azules/morados
   - Los avatares en "santiago" tendrán tonos verdes/amarillos

---

## ⚠️ NOTAS IMPORTANTES

### Sistema ya integrado
- ✅ `botHostSystem.js` usa el nuevo sistema
- ✅ `botCoordinator.js` usa el nuevo sistema
- ✅ `useBotSystem` hook ya conectado

### No requiere cambios adicionales
- ✅ Todo funciona automáticamente
- ✅ Los bots se asignan/mueven/limpian solos
- ✅ Los nombres y avatares se generan automáticamente

### Logs para debugging
- Todos los logs tienen prefijo `[BOT ASSIGNMENT]`, `[BOT NAME]`, `[BOT AVATAR]`
- Fácil de filtrar en consola para ver solo logs de este sistema

---

## 📊 ESTADÍSTICAS

Puedes obtener estadísticas del sistema:

```javascript
import { getBotAssignmentStats } from '@/services/botRoomAssignment';

const stats = getBotAssignmentStats();
// {
//   totalBotsAssigned: 5,
//   botsByRoom: {
//     global: ['bot_carlos', 'bot_mateo'],
//     santiago: ['bot_david', 'bot_miguel'],
//     valparaiso: ['bot_javier']
//   },
//   availableBots: ['bot_pablo', 'bot_fernando', 'bot_alejandro']
// }
```

---

## 🎉 RESULTADO FINAL

### ANTES (PROBLEMA):
- ❌ Sebastián aparecía en TODAS las salas
- ❌ Ana aparecía en TODAS las salas
- ❌ Luis aparecía en TODAS las salas
- ❌ Mismo nombre en todas partes
- ❌ Mismo avatar en todas partes

### DESPUÉS (SOLUCIONADO):
- ✅ bot_carlos en global → "Sebastián" (avatar Apollo)
- ✅ bot_carlos en santiago → "Joaquín" (avatar Luna)
- ✅ bot_carlos NO puede estar en ambas simultáneamente
- ✅ Cada sala tiene bots con nombres únicos
- ✅ Cada sala tiene bots con avatares únicos
- ✅ Cleanup automático funciona perfectamente

---

## 🔗 REFERENCIAS

- **Servicio principal:** `src/services/botRoomAssignment.js`
- **Integración host:** `src/services/botHostSystem.js`
- **Integración coordinador:** `src/services/botCoordinator.js`
- **Hook React:** `src/hooks/useBotSystem.js`
- **Test:** `test-bot-assignment.js`

---

**Fecha de implementación:** 2025-12-28
**Estado:** ✅ COMPLETADO Y PROBADO
**Prioridad:** 🔴 CRÍTICO (según usuario)
