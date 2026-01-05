# 🔧 FIX: Bans Corruptos - Bloqueos con Motivo Undefined

**Fecha:** 2025-01-27  
**Prioridad:** ALTA  
**Estado:** ✅ CORREGIDO

---

## 🐛 PROBLEMA IDENTIFICADO

### Síntomas Reportados:
- Usuarios normales bloqueados al enviar mensajes simples (ej: "hola")
- Log mostraba: "Usuario expulsado" con "Motivo expulsión: undefined"
- Bloqueos persistentes aunque el tiempo restante llegara a 0
- Estado de ban corrupto (sin motivo válido o sin expiración)

### Causa Raíz:
1. **Bans sin motivo (`reason` undefined/null/vacío):**
   - `checkTempBan` retornaba bans con `reason: undefined` si el ban en Firestore o cache no tenía `reason`
   - No había validación de integridad antes de retornar el ban

2. **Bans sin expiración válida:**
   - `checkTempBan` podía retornar bans con `expiresAt` inválido (null, undefined, NaN)
   - No se validaba que `expiresAt > Date.now()` antes de bloquear

3. **Bans expirados no se limpiaban:**
   - Bans expirados permanecían en cache o Firestore
   - No había función centralizada para limpiar bans corruptos

4. **Validación insuficiente:**
   - `validateMessage` no validaba la integridad del ban antes de bloquear
   - Se permitía bloquear con `reason: undefined`

---

## ✅ CORRECCIONES IMPLEMENTADAS

### 1. **Nueva Función: `clearUserTempBan(userId)`**

**Ubicación:** `src/services/antiSpamService.js` (líneas 300-324)

**Propósito:**
- Limpia COMPLETAMENTE el ban de cache y Firestore
- Elimina estado corrupto o expirado
- Fail-safe: limpia cache aunque falle Firestore

**Implementación:**
```javascript
export async function clearUserTempBan(userId) {
  if (!userId) return;
  
  try {
    // Limpiar de cache
    tempBanCache.delete(userId);
    
    // Limpiar de Firestore
    const bansRef = doc(db, 'temp_bans', userId);
    const banDoc = await getDoc(bansRef);
    if (banDoc.exists()) {
      await deleteDoc(bansRef);
    }
    
    console.warn(`[ANTI-SPAM] ✅ Ban corrupto/expirado limpiado para usuario ${userId}`);
  } catch (error) {
    console.error('[ANTI-SPAM] Error limpiando ban:', error);
    // Asegurar que al menos se limpia el cache aunque falle Firestore
    tempBanCache.delete(userId);
  }
}
```

---

### 2. **Nueva Función: `validateBanIntegrity(banInfo, now)`**

**Ubicación:** `src/services/antiSpamService.js` (líneas 326-355)

**Propósito:**
- Valida que un ban tenga integridad completa
- Reglas estrictas:
  - `reason`: debe ser string no vacío
  - `expiresAt`: debe ser número válido > now
- Retorna: `{ valid: boolean, shouldClean: boolean }`

**Implementación:**
```javascript
function validateBanIntegrity(banInfo, now = Date.now()) {
  if (!banInfo || !banInfo.isBanned) {
    return { valid: false, shouldClean: false };
  }
  
  // Validar reason: debe ser string no vacío
  const hasValidReason = banInfo.reason && 
                         typeof banInfo.reason === 'string' && 
                         banInfo.reason.trim().length > 0;
  
  // Validar expiresAt: debe ser número válido y mayor que now
  const hasValidExpiresAt = banInfo.expiresAt && 
                            typeof banInfo.expiresAt === 'number' && 
                            !isNaN(banInfo.expiresAt) &&
                            banInfo.expiresAt > now;
  
  // Ban es válido solo si tiene reason válido Y expiresAt válido
  const isValid = hasValidReason && hasValidExpiresAt;
  
  // Si isBanned es true pero falta reason o expiresAt, es corrupto
  const shouldClean = banInfo.isBanned && (!hasValidReason || !hasValidExpiresAt);
  
  return { valid: isValid, shouldClean };
}
```

---

### 3. **Modificación: `checkTempBan(userId)`**

**Ubicación:** `src/services/antiSpamService.js` (líneas 357-484)

**Cambios:**
1. ✅ Validación de integridad en cache (línea 372)
2. ✅ Limpieza automática de bans corruptos (línea 381)
3. ✅ Validación de integridad en Firestore (línea 430)
4. ✅ Limpieza automática de bans expirados (línea 447)
5. ✅ Solo retorna ban si es válido y activo

**Flujo:**
```
checkTempBan(userId)
  ↓
1. Verificar cache
   ├─ Si existe: validar integridad
   │   ├─ Si corrupto: limpiar y retornar { isBanned: false }
   │   ├─ Si expirado: limpiar y retornar { isBanned: false }
   │   └─ Si válido: retornar ban con reason válido
   │
2. Consultar Firestore
   ├─ Si no existe: retornar { isBanned: false }
   ├─ Si existe: validar integridad
       ├─ Si corrupto: limpiar y retornar { isBanned: false }
       ├─ Si expirado: limpiar y retornar { isBanned: false }
       └─ Si válido: guardar en cache y retornar ban
```

---

### 4. **Modificación: `validateMessage(...)`**

**Ubicación:** `src/services/antiSpamService.js` (líneas 486-534)

**Cambios:**
1. ✅ Validación final de integridad antes de bloquear (línea 499)
2. ✅ Limpieza automática si ban es corrupto (línea 507)
3. ✅ Fallback defensivo para `reason` (nunca debería ejecutarse) (línea 512)
4. ✅ Garantía: nunca se bloquea con `reason: undefined`

**Flujo:**
```
validateMessage(message, userId, username, roomId)
  ↓
1. checkTempBan(userId)
   ↓
2. Si isBanned === true:
   ├─ Validar integridad final
   ├─ Si corrupto: limpiar y CONTINUAR (no bloquear)
   └─ Si válido: bloquear con reason garantizado válido
```

---

## 🔒 GARANTÍAS IMPLEMENTADAS

### ✅ Regla 1: Todo ban tiene `reason` válido
- Validación: `reason` debe ser string no vacío
- Limpieza automática si falta
- Fallback defensivo en validateMessage

### ✅ Regla 2: Todo ban tiene `expiresAt` válido
- Validación: `expiresAt` debe ser número > now
- Limpieza automática si inválido o expirado

### ✅ Regla 3: Bans corruptos se limpian automáticamente
- Detección en cache
- Detección en Firestore
- Detección final en validateMessage
- Limpieza completa (cache + Firestore)

### ✅ Regla 4: Nunca se bloquea con motivo undefined
- Validación triple (cache, Firestore, validateMessage)
- Fallback defensivo: `reason || 'Spam detectado'`
- Logging claro para debug

---

## 📊 IMPACTO

### Antes:
- ❌ Bans sin motivo bloqueaban usuarios
- ❌ Bans expirados bloqueaban indefinidamente
- ❌ Estado corrupto persistía
- ❌ Logs mostraban "undefined"

### Después:
- ✅ Solo bans válidos bloquean usuarios
- ✅ Bans expirados se limpian automáticamente
- ✅ Estado corrupto se detecta y corrige
- ✅ Logs siempre muestran motivo válido

---

## 🧪 CASOS DE PRUEBA

### Caso 1: Ban sin reason
**Estado:** `{ isBanned: true, expiresAt: Date.now() + 60000 }`  
**Resultado:** ✅ Detectado como corrupto, limpiado automáticamente

### Caso 2: Ban sin expiresAt
**Estado:** `{ isBanned: true, reason: "Spam" }`  
**Resultado:** ✅ Detectado como corrupto, limpiado automáticamente

### Caso 3: Ban expirado
**Estado:** `{ isBanned: true, reason: "Spam", expiresAt: Date.now() - 1000 }`  
**Resultado:** ✅ Detectado como expirado, limpiado automáticamente

### Caso 4: Ban válido
**Estado:** `{ isBanned: true, reason: "Spam detectado", expiresAt: Date.now() + 60000 }`  
**Resultado:** ✅ Bloquea mensaje con motivo válido

### Caso 5: Mensaje simple "hola"
**Mensaje:** "hola"  
**Estado:** Sin ban o ban corrupto  
**Resultado:** ✅ Mensaje permitido (no bloqueado)

---

## 📝 ARCHIVOS MODIFICADOS

1. **`src/services/antiSpamService.js`**
   - ✅ Añadido import: `deleteDoc` (línea 2)
   - ✅ Nueva función: `clearUserTempBan` (líneas 300-324)
   - ✅ Nueva función: `validateBanIntegrity` (líneas 326-355)
   - ✅ Modificada: `checkTempBan` (líneas 357-484)
   - ✅ Modificada: `validateMessage` (líneas 486-534)

---

## ✅ VERIFICACIÓN

### Checklist:
- [x] Función `clearUserTempBan` implementada
- [x] Función `validateBanIntegrity` implementada
- [x] `checkTempBan` valida integridad en cache
- [x] `checkTempBan` valida integridad en Firestore
- [x] `checkTempBan` limpia bans corruptos automáticamente
- [x] `validateMessage` valida integridad final
- [x] `validateMessage` limpia bans corruptos antes de bloquear
- [x] Nunca se bloquea con `reason: undefined`
- [x] Bans expirados se limpian automáticamente
- [x] Logs claros para debug
- [x] Sin errores de linting

---

## 🎯 RESUMEN

### Qué estaba mal:
1. Bans podían tener `reason: undefined`
2. Bans podían tener `expiresAt` inválido
3. Bans expirados no se limpiaban
4. No había validación de integridad

### Qué se corrigió:
1. ✅ Función `clearUserTempBan` para limpiar bans
2. ✅ Función `validateBanIntegrity` para validar integridad
3. ✅ Validación triple (cache, Firestore, validateMessage)
4. ✅ Limpieza automática de bans corruptos/expirados

### Por qué no puede volver a ocurrir:
1. **Validación estricta:** Todo ban se valida antes de bloquear
2. **Limpieza automática:** Bans corruptos se detectan y limpian
3. **Triple verificación:** Cache → Firestore → validateMessage
4. **Fail-safe:** Si falla validación, no bloquea (permite mensaje)
5. **Logging claro:** Bans corruptos se loguean para diagnóstico

---

**Estado Final:** ✅ CORREGIDO Y TESTEADO  
**Riesgo de Regresión:** 🟢 BAJO (validaciones estrictas previenen el problema)

