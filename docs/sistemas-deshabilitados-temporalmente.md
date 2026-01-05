# 🚫 Sistemas Deshabilitados Temporalmente

**Fecha:** 2025-01-28  
**Motivo:** Permitir envío libre de mensajes sin restricciones  
**IMPORTANTE:** Este documento lista todos los sistemas que fueron deshabilitados para poder reactivarlos en el futuro.

---

## 📝 Resumen

Se deshabilitaron temporalmente los siguientes sistemas de bloqueo/validación de mensajes:
1. **Anti-spam Service** (`validateMessage`)
2. **Rate Limiting Service** (`checkRateLimit`)

---

## 1. 🔴 Anti-Spam Service (validateMessage)

### Archivo: `src/services/antiSpamService.js`

### Función Afectada: `validateMessage`

### Estado Actual:
- ✅ **DESHABILITADO**: La función siempre retorna `{ allowed: true }` sin ejecutar validaciones
- ⚠️ Todas las validaciones están comentadas en un bloque `/* COMENTADO TEMPORALMENTE */`

### Validaciones que Están Comentadas:
1. **Verificación de bans temporales** (`checkTempBan`)
2. **Detección de números de teléfono** (`containsPhoneNumber`)
3. **Detección de palabras prohibidas** (`containsForbiddenWords`)
4. **Registro de advertencias de spam** (`recordSpamWarning`)

### Para Reactivar:
1. En `src/services/antiSpamService.js`, línea ~179-243:
   - Eliminar el `return { allowed: true };` de la línea 181
   - Descomentar el bloque `/* COMENTADO TEMPORALMENTE */`
   - Descomentar el bloque `*/` al final

### Código Actual:
```javascript
export async function validateMessage(message, userId, username, roomId) {
  // ⚠️ ANTI-SPAM DESHABILITADO TEMPORALMENTE
  return { allowed: true };

  /* COMENTADO TEMPORALMENTE
  try {
    // ... validaciones ...
  } catch (error) {
    return { allowed: true };
  }
  */
}
```

### Código Original (para referencia):
- Validaba bans temporales
- Bloqueaba números de teléfono
- Bloqueaba palabras prohibidas (redes sociales, contenido comercial, etc.)
- Registraba advertencias en Firestore

---

## 2. 🔴 Rate Limiting Service (checkRateLimit)

### Archivo: `src/services/rateLimitService.js`

### Función Afectada: `checkRateLimit`

### Estado Actual:
- ✅ **DESHABILITADO**: La función siempre retorna `{ allowed: true }` sin ejecutar validaciones
- ⚠️ Todas las validaciones están comentadas (ya estaban desactivadas previamente, pero ahora la función misma está deshabilitada)

### Validaciones que Están Comentadas/Desactivadas:
1. **Mute local** (ya estaba desactivado desde 05/01/2026)
2. **Anti-doble-click** (ya estaba desactivado desde 05/01/2026)
3. **Detección de duplicados** (ya estaba desactivado desde 05/01/2026)
4. **Rate limiting por volumen** (ya estaba desactivado desde 05/01/2026)

### Para Reactivar:
1. En `src/services/rateLimitService.js`, línea ~194-196:
   - Eliminar el `return { allowed: true };` de la línea 196
   - Restaurar la lógica original (que ya estaba mayormente comentada)

2. En `src/services/chatService.js`, línea ~79-85:
   - Descomentar el bloque:
   ```javascript
   // ⚡ RATE LIMITING: Solo para usuarios reales (NO bloquea bots)
   if (isRealUser) {
     const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);
     if (!rateLimitCheck.allowed) {
       throw new Error(rateLimitCheck.error);
     }
   }
   ```

### Código Actual:
```javascript
export const checkRateLimit = async (userId, roomId, content = '') => {
  // ⚠️ RATE LIMITING DESHABILITADO TEMPORALMENTE
  return { allowed: true };
};
```

### En chatService.js:
```javascript
// ⚡ RATE LIMITING: TEMPORALMENTE DESHABILITADO
// if (isRealUser) {
//   const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);
//   if (!rateLimitCheck.allowed) {
//     throw new Error(rateLimitCheck.error);
//   }
// }
```

---

## 📋 Checklist para Reactivación

Cuando se necesite reactivar los sistemas de bloqueo:

### Anti-Spam:
- [ ] Abrir `src/services/antiSpamService.js`
- [ ] Eliminar `return { allowed: true };` de la línea 181
- [ ] Descomentar el bloque `/* COMENTADO TEMPORALMENTE */` y su cierre `*/`
- [ ] Verificar que la función `checkTempBan` funciona correctamente
- [ ] Probar con mensajes que deberían ser bloqueados (números de teléfono, palabras prohibidas)

### Rate Limiting:
- [ ] Abrir `src/services/rateLimitService.js`
- [ ] Eliminar `return { allowed: true };` de la línea 196
- [ ] Restaurar la lógica original (si se requiere)
- [ ] Abrir `src/services/chatService.js`
- [ ] Descomentar el bloque de rate limiting (líneas 79-85)
- [ ] Verificar que la función `checkRateLimit` funciona correctamente
- [ ] Probar con envío rápido de mensajes

---

## ⚠️ Advertencias

1. **Sin protección**: Con estos sistemas deshabilitados, el chat NO tiene protección contra:
   - Spam masivo
   - Números de teléfono
   - Palabras prohibidas
   - Usuarios baneados

2. **Rendimiento**: Sin rate limiting, los usuarios pueden enviar mensajes ilimitadamente, lo que podría:
   - Sobrecargar Firestore
   - Degradar el rendimiento del chat
   - Causar problemas de escalabilidad

3. **Moderación manual**: Durante este período, la moderación debe hacerse manualmente desde el panel de administración.

---

## 📅 Historial

- **2025-01-28**: Deshabilitados ambos sistemas temporalmente para permitir envío libre de mensajes

