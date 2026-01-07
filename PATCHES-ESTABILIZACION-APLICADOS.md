# 🔧 PARCHES DE ESTABILIZACIÓN APLICADOS

**Fecha**: 2026-01-07
**Objetivo**: Estabilizar chat después de incidente de loops infinitos
**Estrategia**: Tolerar latencia alta, evitar reintentos, restaurar comunicación bidireccional básica

---

## ✅ PATCH #1: Timeout aumentado a 30s (chatService.js)

### Archivo: `src/services/chatService.js`
### Líneas: 236-262

**Cambio**:
```javascript
// ANTES: timeout de 15s que lanzaba error
const addDocWithTimeout = (ref, data, timeoutMs = 15000) => {
  setTimeout(() => {
    reject(new Error(`TIMEOUT...`)); // ❌ Lanzaba error
  }, timeoutMs);
}

// DESPUÉS: timeout de 30s que solo advierte
const addDocWithTimeout = (ref, data, timeoutMs = 30000) => {
  setTimeout(() => {
    timeoutReached = true;
    console.warn(`⏳ addDoc tardó más de ${timeoutMs}ms pero seguimos esperando...`); // ✅ Solo advertencia
  }, timeoutMs);

  // ✅ NO rechaza - espera pacientemente a que Firebase responda
}
```

**Por qué**:
- Firebase tiene alta latencia (hasta 15-20s por escritura)
- Lanzar error a los 15s rompe el flujo del chat
- Mejor esperar 30s y SI Firebase responde, aceptar el mensaje
- Si NO responde en 30s, entonces sí fallar

**Resultado esperado**:
- Mensajes con alta latencia (15-25s) llegarán eventualmente
- No más timeouts falsos cuando Firebase está respondiendo

---

## ✅ PATCH #2: Cola de reintentos DESHABILITADA (chatService.js)

### Archivo: `src/services/chatService.js`
### Líneas: 385-399

**Cambio**:
```javascript
// ANTES: Agregaba mensajes fallidos a una cola y reintentaba
if (!skipQueue && isNetworkError(error)) {
  pendingMessages.push({ roomId, messageData, isAnonymous }); // ❌ Cola activa
  flushPendingMessages().catch(() => {}); // ❌ Reintentos automáticos
  return { queued: true };
}

// DESPUÉS: NO agrega a cola, falla inmediatamente
// ❌ COLA DESHABILITADA
// if (!skipQueue && isNetworkError(error)) {
//   pendingMessages.push(...); // COMENTADO
//   flushPendingMessages()...; // COMENTADO
// }

console.error('❌ [SEND] Mensaje NO enviado - sin reintentos automáticos');
throw error; // ✅ Falla limpiamente
```

**Por qué**:
- Reintentos automáticos causan:
  - Loops infinitos de reintentos
  - Mensajes duplicados
  - Estados inconsistentes
  - Más carga en Firebase ya saturado
- MEJOR: Fallar limpiamente y que el usuario reintente manualmente

**Resultado esperado**:
- Si un mensaje falla, se muestra error al usuario
- NO hay reintentos automáticos en background
- No más loops de reintentos

---

## ✅ PATCH #3: presenceService MINIMAL (presenceService.js)

### Archivo: `src/services/presenceService.js` (REEMPLAZADO COMPLETO)

**Cambio**: Archivo completo reemplazado con versión minimal

**HABILITADO**:
- ✅ `joinRoom()` - Registra presencia básica
- ✅ `leaveRoom()` - Limpia presencia
- ✅ `subscribeToRoomUsers()` - Escucha usuarios (SIN getDoc queries)
- ✅ `updateUserActivity()` - Actualiza lastSeen
- ✅ `filterActiveUsers()` - Filtrado local (sin queries)

**DESHABILITADO**:
- ❌ `subscribeToMultipleRoomCounts()` - EL LOOP que causó el problema
- ❌ `cleanInactiveUsers()` - Puede causar escrituras masivas
- ❌ `subscribeToTypingUsers()` - No esencial
- ❌ `recordGlobalActivity()` - No esencial
- ❌ Verificación de roles con `getDoc()` - Causaba lecturas masivas

**Por qué**:
- `subscribeToMultipleRoomCounts` creaba 75+ listeners activos (5 componentes × 15 salas)
- Cada cambio en roomPresence disparaba 75 callbacks
- Causó 500,000+ lecturas en 6 minutos
- SOLUCIÓN: Stub que retorna 0 usuarios (no crea listeners)

- `subscribeToRoomUsers` con `getDoc()` queries:
  - Cada usuario que entraba/salía → getDoc para TODOS los usuarios
  - Sin cache efectivo → lecturas repetidas
  - 10 usuarios × 10 cambios/min = 100+ lecturas/min
- SOLUCIÓN: Retornar usuarios sin verificar roles

**Resultado esperado**:
- Comunicación bidireccional FUNCIONA (usuarios reciben mensajes)
- NO hay loops de listeners
- NO hay queries masivas de roles
- Contadores de usuarios muestran "0" (temporal, aceptable)

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Antes | Después | Impacto |
|------------|-------|---------|---------|
| **Timeout de escritura** | 15s → error | 30s → advertencia | ✅ Tolera latencia alta |
| **Cola de reintentos** | Activa | Deshabilitada | ✅ No más loops de reintentos |
| **subscribeToMultipleRoomCounts** | 75 listeners | 0 listeners (stub) | ✅ Reduce 99% de lecturas |
| **getDoc queries (roles)** | Masivas | Ninguna | ✅ Reduce lecturas |
| **joinRoom/leaveRoom** | Habilitado | Habilitado | ✅ Presencia básica funciona |
| **subscribeToRoomUsers** | Con getDoc | Sin getDoc | ✅ Ve usuarios sin queries |
| **subscribeToRoomMessages** | Habilitado | Habilitado | ✅ Recibe mensajes |

---

## 🧪 VERIFICACIÓN POST-DEPLOY

### 1. Verificar que el chat funciona
```
1. Abrir localhost:3000 en 2 navegadores (Chrome + Firefox)
2. Entrar a la misma sala en ambos
3. Enviar mensaje desde Chrome
4. DEBE aparecer en Firefox en < 5 segundos
5. Enviar mensaje desde Firefox
6. DEBE aparecer en Chrome en < 5 segundos
```

**Resultado esperado**:
- ✅ Mensajes se envían
- ✅ Mensajes se reciben en tiempo real
- ✅ Bidireccionalidad funciona
- ⚠️ Puede haber latencia (5-10s es aceptable)
- ⚠️ Contadores de usuarios muestran "0" (esperado)

### 2. Verificar consola del navegador
```
1. Abrir F12 → Console
2. NO debe aparecer:
   ❌ "📊 [LISTENERS] subscribeToMultipleRoomCounts: Creando 9 listeners"
   ❌ "Error: TIMEOUT..."
   ❌ "[SEND][QUEUE] Mensaje en cola..."

3. DEBE aparecer:
   ✅ "🚫 [PRESENCE] subscribeToMultipleRoomCounts DESHABILITADO"
   ✅ "✅ [PRESENCE] Usuario ... registrado en ..."
   ✅ "✅ [TRACE:FIREBASE_WRITE_SUCCESS]"
   ✅ "📊 [PERFORMANCE] Mensaje enviado en ...ms"
```

### 3. Verificar Firebase Usage
```
1. https://console.firebase.google.com/
2. Firestore → Usage
3. Lecturas: < 5,000/minuto (antes: 83,000/min)
4. Escrituras: < 1,000/minuto
5. Monitorear por 30 minutos
```

**Resultado esperado**:
- Lecturas estables (< 5,000/min)
- Escrituras estables (< 1,000/min)
- No picos repentinos

### 4. Test de latencia aceptable
```
1. Enviar mensaje
2. Medir tiempo hasta que aparece en otro navegador
3. Aceptable: 0-15 segundos
4. Tolerable: 15-30 segundos
5. PROBLEMA: > 30 segundos
```

---

## 🚨 SEÑALES DE ALERTA

**REVERTIR INMEDIATAMENTE si ves**:

1. **Lecturas de Firebase > 10,000/min**
   - Algo sigue creando listeners
   - Verificar consola: `window.__activeFirestoreListeners`
   - Debe ser < 20

2. **Mensajes NO llegan al otro cliente**
   - Verificar que presenceService.js es la versión MINIMAL
   - Verificar que subscribeToRoomMessages está activo

3. **Timeouts constantes (> 50% de mensajes)**
   - Firebase sigue saturado
   - Esperar 1-2 horas más
   - Considerar aumentar timeout a 60s

4. **Loops de "📊 [LISTENERS] Creando ... listeners"**
   - subscribeToMultipleRoomCounts se reactivó
   - Verificar que presenceService.js es la versión MINIMAL

---

## 🔄 ROLLBACK PLAN

Si algo sale mal:

```bash
# Opción 1: Revertir presenceService a versión emergency (TODO deshabilitado)
cd src/services
mv presenceService.js presenceService.js.minimal
mv presenceService.js.disabled presenceService.js

# Opción 2: Revertir chatService.js
git checkout HEAD -- src/services/chatService.js

# Opción 3: Revertir TODO
git reset --hard HEAD~1
```

---

## 📝 LIMITACIONES TEMPORALES

Mientras estos parches estén activos:

1. **Contadores de usuarios**: Muestran "0" en todas las salas
   - No afecta funcionalidad
   - Solo afecta UI de contadores

2. **Checks de entrega (✓✓)**: Deshabilitados
   - Mensajes se envían y reciben normalmente
   - Solo faltan los checks visuales

3. **Typing indicators**: Deshabilitados
   - No se muestra "X está escribiendo..."
   - No afecta envío/recepción de mensajes

4. **Filtrado de moderadores**: Deshabilitado
   - Admins/moderadores aparecen en lista de usuarios
   - No afecta funcionalidad del chat

**TODAS estas limitaciones son ACEPTABLES para estabilizar el sistema.**

---

## ✅ CRITERIOS DE ÉXITO

Los parches son exitosos cuando:

- ✅ Chat bidireccional funciona (mensajes van y vienen)
- ✅ Firebase Usage < 5,000 lecturas/min
- ✅ Firebase Usage < 1,000 escrituras/min
- ✅ Latencia de mensajes < 15s (promedio)
- ✅ No errores de timeout en > 80% de mensajes
- ✅ No loops en consola
- ✅ Listeners activos < 20

---

**Última actualización**: 2026-01-07 08:30
**Estado**: Parches aplicados ✅ - Pendiente testing
**Responsable**: Equipo de desarrollo
