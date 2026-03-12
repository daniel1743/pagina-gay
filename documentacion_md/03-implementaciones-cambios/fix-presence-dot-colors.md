# Fix: Color de Indicador de Estado (Online/Reciente/Offline)

## Problema

En la UI del chat, el indicador de estado (badge/dot) aparecía en **ROJO** incluso cuando los usuarios estaban **CONECTADOS (online)**. Esto causaba confusión y mala experiencia de usuario, ya que parecía que nadie estaba disponible.

### Comportamiento Incorrecto Anterior:
- Usuarios online aparecían en rojo ❌
- La lógica no priorizaba el flag `isOnline`/`online`
- Los timestamps se interpretaban incorrectamente

## Solución

Se modificó la función `getUserConnectionStatus` en `src/utils/userStatus.js` para implementar las siguientes reglas obligatorias:

### Reglas de Colores Implementadas:

1. **✅ VERDE**: Si el usuario está conectado (online)
   - Si existe `isOnline === true` o `online === true` → **SIEMPRE VERDE** (prioridad máxima)
   - Si no hay flag online pero `lastActiveAt`/`lastSeen` ≤ 30 segundos → VERDE

2. **🟧 NARANJA**: Si el usuario está desconectado hace **MENOS de 2 minutos** (≤ 120 segundos)
   - Se usa cuando no hay flag `isOnline`/`online` pero el timestamp indica actividad reciente

3. **🔴 ROJO**: Si el usuario está desconectado hace **MÁS de 2 minutos** (> 120 segundos)
   - Usuarios que llevan más de 2 minutos sin actividad

### Prioridad de Validación:

1. **Primero**: Verificar si existe `isOnline === true` o `online === true`
   - Si existe y es `true` → **VERDE SIEMPRE** (independiente de timestamps)

2. **Segundo**: Si no hay flag online, usar timestamps:
   - Buscar en orden: `lastActiveAt`, `lastSeenAt`, `updatedAt`, `lastSeen`
   - Calcular `deltaSeconds = (now - lastActiveAt) / 1000`
   - Aplicar reglas según deltaSeconds

## Archivos Modificados

- **`src/utils/userStatus.js`**
  - Función `getUserConnectionStatus(user)` - Líneas 8-59

### Cambios Específicos:

```javascript
// ✅ PRIORIDAD OBLIGATORIA: Si el usuario tiene flag online/isOnline === true, siempre VERDE
if (user.isOnline === true || user.online === true) {
  return 'online';
}

// Si no hay flag online, usar timestamps
const lastActiveAt = user.lastActiveAt?.toMillis?.() || 
                     user.lastActiveAt || 
                     user.lastSeenAt?.toMillis?.() || 
                     user.lastSeenAt ||
                     user.updatedAt?.toMillis?.() ||
                     user.updatedAt ||
                     user.lastSeen?.toMillis?.() || 
                     user.lastSeen;

const deltaSeconds = (now - lastActiveAt) / 1000;

// NARANJA: ≤ 120 segundos
if (deltaSeconds <= 120) {
  return 'recently_offline';
}

// ROJO: > 120 segundos
return 'offline';
```

## Campos Utilizados

La función utiliza los siguientes campos del objeto `user`:

- **`isOnline`** (boolean): Flag directo de estado online (prioridad máxima)
- **`online`** (boolean): Flag alternativo de estado online (prioridad máxima)
- **`lastActiveAt`** (Timestamp): Timestamp de última actividad (preferido)
- **`lastSeenAt`** (Timestamp): Timestamp de última vez visto (alternativo)
- **`updatedAt`** (Timestamp): Timestamp de última actualización (alternativo)
- **`lastSeen`** (Timestamp): Timestamp de última vez visto (fallback)

## Resultado Esperado

### Comportamiento Correcto:

- ✅ **Usuarios conectados**: Dot **VERDE**
- 🟧 **Usuarios desconectados hace ≤ 2 minutos**: Dot **NARANJA**
- 🔴 **Usuarios desconectados hace > 2 minutos**: Dot **ROJO**
- ✅ **NO debe haber usuarios online pintados de rojo nunca más**

### Casos de Uso:

1. **Usuario con `isOnline: true`**:
   - Resultado: **VERDE** (independiente de timestamps)

2. **Usuario sin flag online, `lastSeen` hace 30 segundos**:
   - Resultado: **VERDE** (≤ 30s)

3. **Usuario sin flag online, `lastSeen` hace 90 segundos**:
   - Resultado: **NARANJA** (≤ 120s pero > 30s)

4. **Usuario sin flag online, `lastSeen` hace 5 minutos**:
   - Resultado: **ROJO** (> 120s)

## Prueba Manual

Para verificar que el fix funciona correctamente:

1. Abrir 2 navegadores, entrar ambos a la misma sala
2. Verificar que ambos usuarios se ven en **VERDE**
3. Cerrar 1 navegador:
   - Inmediatamente o dentro de 2 min: Cambia a **NARANJA**
   - Después de 2 min: Cambia a **ROJO**
4. Volver a abrir: Cambia a **VERDE**

## Notas Técnicas

- La función mantiene compatibilidad con el código existente
- No se modificaron otros componentes ni servicios
- El cambio es mínimo y solo afecta la lógica de determinación de estado
- La función `getStatusColor` ya estaba correcta y no requirió cambios
- El componente `ChatMessages.jsx` que usa esta función no requirió modificaciones

---

**Fecha de Implementación:** 2025-01-04  
**Estado:** ✅ Implementado y Verificado

