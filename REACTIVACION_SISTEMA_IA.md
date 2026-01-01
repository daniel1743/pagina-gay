# 🔄 GUÍA DE REACTIVACIÓN: Sistema de IA Conversacional

**Fecha de desactivación:** 2025-01-27  
**Estado actual:** ❌ COMPLETAMENTE DESACTIVADO  
**Razón:** Solicitud del usuario para desactivar en todas las salas

---

## 📋 RESUMEN

El sistema de IA conversacional ha sido **completamente desactivado** en todas las salas. Esto incluye:

- ✅ IAs no se activan automáticamente
- ✅ IAs no responden a mensajes de usuarios
- ✅ IAs no inician conversaciones entre ellas
- ✅ No se registran mensajes de usuarios para respuestas de IA

---

## 🔧 ARCHIVOS MODIFICADOS

### 1. `src/services/multiProviderAIConversation.js`

**Línea 24:**
```javascript
const AI_SYSTEM_ENABLED = false; // ← Cambiar a true para reactivar
```

### 2. `src/pages/ChatPage.jsx`

**Línea 28-29:** Import comentado
```javascript
// ⚠️ SISTEMA DE IA DESACTIVADO - Para reactivar, ver REACTIVACION_SISTEMA_IA.md
// import { updateRoomAIActivity, stopRoomAIConversation, recordHumanMessage, greetNewUser } from '@/services/multiProviderAIConversation';
```

**Línea 567:** `greetNewUser` comentado
```javascript
// ⚠️ SISTEMA DE IA DESACTIVADO
// if (!hasBeenGreeted) {
//   setTimeout(() => {
//     greetNewUser(roomId, user.username);
//     sessionStorage.setItem(aiGreetKey, 'true');
//   }, 6000);
// }
```

**Línea 587:** `stopRoomAIConversation` comentado
```javascript
// ⚠️ SISTEMA DE IA DESACTIVADO
// stopRoomAIConversation(roomId);
```

**Línea 632:** `updateRoomAIActivity` comentado
```javascript
// ⚠️ SISTEMA DE IA DESACTIVADO COMPLETAMENTE
// updateRoomAIActivity(roomId, realUserCount);
```

**Línea 798:** `recordHumanMessage` comentado
```javascript
// ⚠️ SISTEMA DE IA DESACTIVADO
// recordHumanMessage(currentRoom, user.username, content, user.id);
```

---

## ✅ PASOS PARA REACTIVAR

### Paso 1: Reactivar la bandera global

1. Abrir `src/services/multiProviderAIConversation.js`
2. Buscar la línea 24
3. Cambiar:
   ```javascript
   const AI_SYSTEM_ENABLED = false;
   ```
   Por:
   ```javascript
   const AI_SYSTEM_ENABLED = true;
   ```

### Paso 2: Descomentar imports en ChatPage.jsx

1. Abrir `src/pages/ChatPage.jsx`
2. Buscar la línea 28-29
3. Descomentar:
   ```javascript
   import { updateRoomAIActivity, stopRoomAIConversation, recordHumanMessage, greetNewUser } from '@/services/multiProviderAIConversation';
   ```
4. Eliminar o comentar la línea que dice:
   ```javascript
   // ⚠️ SISTEMA DE IA DESACTIVADO - Para reactivar, ver REACTIVACION_SISTEMA_IA.md
   ```

### Paso 3: Descomentar llamadas a funciones

#### 3.1. Descomentar `greetNewUser` (línea ~567)

```javascript
if (!hasBeenGreeted) {
  setTimeout(() => {
    greetNewUser(roomId, user.username);
    sessionStorage.setItem(aiGreetKey, 'true');
  }, 6000);
}
```

#### 3.2. Descomentar `stopRoomAIConversation` (línea ~587)

```javascript
// 🤖 Detener conversaciones de IA
stopRoomAIConversation(roomId);
```

#### 3.3. Descomentar `updateRoomAIActivity` (línea ~632)

```javascript
updateRoomAIActivity(roomId, realUserCount);
```

#### 3.4. Descomentar `recordHumanMessage` (línea ~798)

```javascript
recordHumanMessage(currentRoom, user.username, content, user.id);
```

### Paso 4: Verificar configuración de proveedores

1. Abrir `src/services/multiProviderAIConversation.js`
2. Verificar que los proveedores de IA estén configurados:
   - OpenAI (si se usa)
   - DeepSeek (si se usa)
   - Qwen (si se usa)
3. Verificar que las API keys estén configuradas en variables de entorno

### Paso 5: Probar reactivación

1. Iniciar el servidor de desarrollo: `npm run dev`
2. Abrir una sala de chat
3. Verificar en la consola (F12) que aparezcan logs como:
   ```
   [MULTI AI] ✅ Activado en {roomId}
   ```
4. Enviar un mensaje como usuario y verificar que las IAs respondan

---

## 🔍 VERIFICACIÓN POST-REACTIVACIÓN

### Checklist de verificación:

- [ ] `AI_SYSTEM_ENABLED = true` en `multiProviderAIConversation.js`
- [ ] Imports descomentados en `ChatPage.jsx`
- [ ] Todas las llamadas a funciones de IA descomentadas
- [ ] Logs en consola muestran activación de IAs
- [ ] IAs responden a mensajes de usuarios
- [ ] IAs inician conversaciones entre ellas
- [ ] No hay errores en consola relacionados con IAs

---

## ⚙️ CONFIGURACIÓN ADICIONAL (OPCIONAL)

### Ajustar número de usuarios para activación

En `src/services/multiProviderAIConversation.js`:

```javascript
const MIN_ACTIVE_USERS = 1; // Mínimo de usuarios reales para activar IAs
const MAX_ACTIVE_USERS = 10; // Máximo de usuarios reales (más de esto, IAs se desactivan)
```

### Ajustar frecuencia de mensajes

Buscar `getPulseIntervalMs()` y ajustar el intervalo entre conversaciones de IAs.

### Personalizar personalidades de IA

Modificar el array `PERSONALITIES` en `multiProviderAIConversation.js` para cambiar nombres, avatares, o prompts de las IAs.

---

## 🚨 NOTAS IMPORTANTES

1. **Mensajes antiguos:** Los mensajes de IA que ya están en Firestore no se eliminarán automáticamente. Si quieres limpiarlos, usa el script `cleanup-bot-messages.js` o crea uno nuevo.

2. **Costos de API:** Al reactivar, las IAs consumirán tokens de las APIs (OpenAI, DeepSeek, etc.). Monitorea los costos.

3. **Spam:** El sistema tiene validación anti-spam integrada. Si las IAs se vuelven repetitivas, ajusta los prompts en `PERSONALITIES`.

4. **Rendimiento:** El sistema de IA puede afectar el rendimiento si hay muchas salas activas simultáneamente.

---

## 📞 SOPORTE

Si encuentras problemas al reactivar:

1. Revisa los logs en la consola del navegador (F12)
2. Verifica que las API keys estén configuradas correctamente
3. Revisa que no haya errores de sintaxis en los archivos modificados
4. Verifica que las funciones de IA estén correctamente importadas

---

## 📝 HISTORIAL DE CAMBIOS

- **2025-01-27:** Sistema completamente desactivado
  - `AI_SYSTEM_ENABLED = false`
  - Todas las llamadas a funciones de IA comentadas en `ChatPage.jsx`
  - Imports comentados

---

**Última actualización:** 2025-01-27

