# 🔧 FIX: REGLAS DE FIRESTORE PARA MENSAJES SEMBRADOS

**Fecha:** 2025-01-27  
**Problema:** Los mensajes sembrados no aparecen porque las reglas de Firestore no permiten `seed_user_*`  
**Solución:** Actualizar `isValidBotMessage()` para permitir `seed_user_*`

---

## ✅ CAMBIO REALIZADO

Se actualizó la función `isValidBotMessage()` en `firestore.rules` para permitir mensajes con `userId` que empiece con `seed_user_*`.

### Antes:
```javascript
(data.userId.matches('bot_.*') || data.userId.matches('ai_.*'))
```

### Después:
```javascript
(data.userId.matches('bot_.*') || data.userId.matches('ai_.*') || data.userId.matches('seed_user_.*'))
```

---

## 📋 DETALLES

### Función actualizada:

```javascript
function isValidBotMessage() {
  let data = request.resource.data;
  return isAuthenticated() &&
         'senderUid' in data &&
         data.senderUid == request.auth.uid &&
         'userId' in data &&
         data.userId is string &&
         (data.userId.matches('bot_.*') || 
          data.userId.matches('ai_.*') || 
          data.userId.matches('seed_user_.*')) &&  // ✅ NUEVO
         'username' in data &&
         data.username is string &&
         'content' in data &&
         data.content is string &&
         data.content.size() > 0 &&
         data.content.size() <= 1000 &&
         'type' in data &&
         data.type in ['text', 'image', 'voice', 'system'] &&
         'timestamp' in data &&
         data.timestamp is timestamp;
}
```

---

## ⚠️ IMPORTANTE

**Debes actualizar las reglas en Firebase Console:**

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a "Firestore Database" → "Reglas"
4. Copia el contenido actualizado de `firestore.rules`
5. Click en "Publicar"

**Sin este paso, los mensajes sembrados NO se podrán escribir en Firestore.**

---

## ✅ VERIFICACIÓN

- ✅ Reglas actualizadas en `firestore.rules`
- ✅ Permite `seed_user_*` en `isValidBotMessage()`
- ⚠️ **Requiere actualizar en Firebase Console**

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Reglas actualizadas localmente  
**Acción requerida:** Actualizar reglas en Firebase Console

