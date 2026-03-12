# Backup y Auditoría: ChatInput Component

**Fecha:** 2025-01-27
**Componente:** `src/components/chat/ChatInput.jsx`
**Propósito:** Backup antes de aplicar mejoras según mejores prácticas modernas (WhatsApp, Telegram, iMessage, Discord)

---

## 📋 AUDITORÍA DE REGLAS

### ✅ Reglas CUMPLIDAS:
1. **Enter envía mensaje** - ✅ Implementado correctamente (línea 340)
2. **Shift+Enter crea salto de línea** - ✅ Implementado correctamente (no envía si Shift+Enter está presionado)

### ❌ Reglas NO CUMPLIDAS:

1. **Altura mínima del input: 48px**
   - **Estado actual:** `min-h-[44px]` (línea 346)
   - **Problema:** No cumple con el estándar de 48px
   - **Corrección requerida:** Cambiar a `min-h-[48px]`

2. **Auto-grow hasta ~150px; luego scroll interno**
   - **Estado actual:** `max-h-[120px]` (línea 346) y auto-grow hasta 120px (línea 122)
   - **Problema:** El límite es 120px, debe ser ~150px
   - **Corrección requerida:** Cambiar `max-h-[120px]` a `max-h-[150px]` y actualizar el cálculo de altura en el useEffect

3. **Guardar borrador automáticamente**
   - **Estado actual:** NO IMPLEMENTADO
   - **Problema:** El texto escrito se pierde si el usuario navega o recarga
   - **Corrección requerida:** Implementar guardado automático en localStorage con clave única por sala

4. **Restaurar borrador al volver al chat**
   - **Estado actual:** NO IMPLEMENTADO
   - **Problema:** No se restaura el texto previamente escrito
   - **Corrección requerida:** Restaurar borrador desde localStorage al montar el componente

5. **El crecimiento no debe tapar mensajes visibles**
   - **Estado actual:** No hay verificación explícita
   - **Problema:** Si el input crece, podría tapar mensajes
   - **Nota:** Esto requiere coordinación con el componente padre (ChatPage), pero el input actual no lo maneja

---

## 📝 IMPLEMENTACIÓN ORIGINAL

### Código Completo del Componente (Antes de Cambios):
[Ver archivo completo: `src/components/chat/ChatInput.jsx`]

**Puntos Clave:**
- Altura mínima: 44px (línea 346)
- Altura máxima: 120px (línea 346)
- Auto-grow: hasta 120px (línea 122)
- Sin guardado de borrador
- Sin restauración de borrador
- Enter/Shift+Enter: ✅ Correcto

---

## 🔧 CAMBIOS APLICADOS

### Cambio 1: Agregar prop roomId
**Archivo:** `src/components/chat/ChatInput.jsx`
**Línea:** 45
**Cambio:**
```diff
- const ChatInput = ({ onSendMessage, onFocus, onBlur, externalMessage = null }) => {
+ const ChatInput = ({ onSendMessage, onFocus, onBlur, externalMessage = null, roomId = null }) => {
```

**Archivo:** `src/pages/ChatPage.jsx`
**Línea:** 1085-1090
**Cambio:**
```diff
          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            externalMessage={suggestedMessage}
+           roomId={roomId}
          />
```

### Cambio 2: Altura mínima a 48px y máxima a 150px
**Archivo:** `src/components/chat/ChatInput.jsx`
**Línea:** ~346
**Cambio:**
```diff
- className="... min-h-[44px] max-h-[120px] ..."
+ className="... min-h-[48px] max-h-[150px] ... scrollbar-hide"
```

### Cambio 3: Auto-grow hasta 150px
**Archivo:** `src/components/chat/ChatInput.jsx`
**Línea:** ~122 (ahora ~145)
**Cambio:**
```diff
- textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
+ textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
```

### Cambio 4: Guardar borrador automáticamente
**Archivo:** `src/components/chat/ChatInput.jsx`
**Líneas:** Nuevas (~118-130, insertadas antes del useEffect de auto-ajustar altura)
**Cambio:**
```javascript
// Guardar borrador automáticamente en localStorage
useEffect(() => {
  if (roomId && message.trim()) {
    const draftKey = `chat-draft-${roomId}`;
    const timeoutId = setTimeout(() => {
      localStorage.setItem(draftKey, message);
    }, 500); // Debounce de 500ms
    return () => clearTimeout(timeoutId);
  } else if (roomId && !message.trim()) {
    // Limpiar borrador si el mensaje está vacío
    const draftKey = `chat-draft-${roomId}`;
    localStorage.removeItem(draftKey);
  }
}, [message, roomId]);
```

### Cambio 5: Restaurar borrador al volver al chat
**Archivo:** `src/components/chat/ChatInput.jsx`
**Líneas:** Nuevas (~132-148, insertadas después del useEffect de guardar borrador)
**Cambio:**
```javascript
// Restaurar borrador al cargar o cambiar de sala
useEffect(() => {
  if (roomId) {
    const draftKey = `chat-draft-${roomId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft && savedDraft.trim()) {
      setMessage(savedDraft);
      // Restaurar altura del textarea después de restaurar el mensaje
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
      }, 0);
    }
  }
}, [roomId]);
```

### Cambio 6: Limpiar borrador al enviar mensaje
**Archivo:** `src/components/chat/ChatInput.jsx`
**Línea:** ~148 (dentro de handleSubmit, después de setMessage(''))
**Cambio:**
```javascript
// Limpiar borrador al enviar
if (roomId) {
  const draftKey = `chat-draft-${roomId}`;
  localStorage.removeItem(draftKey);
}
```

---

## 🔄 INSTRUCCIONES PARA ROLLBACK

Si necesitas revertir los cambios:

1. **Restaurar altura mínima y máxima:**
   ```diff
   - min-h-[48px] max-h-[150px]
   + min-h-[44px] max-h-[120px]
   ```

2. **Restaurar límite de auto-grow:**
   ```diff
   - Math.min(textareaRef.current.scrollHeight, 150)
   + Math.min(textareaRef.current.scrollHeight, 120)
   ```

3. **Eliminar guardado de borrador:**
   - Remover el useEffect que guarda el borrador
   - Remover la función de debounce si fue agregada

4. **Eliminar restauración de borrador:**
   - Remover el useEffect que restaura el borrador
   - Remover la prop `roomId` si fue agregada

5. **Verificar que el componente funcione correctamente:**
   - Probar envío de mensajes
   - Probar Enter/Shift+Enter
   - Probar auto-grow

---

## 📊 MOTIVO DE CADA CAMBIO

1. **Altura mínima 48px:** Estándar de accesibilidad y UX moderna. 48px es el tamaño mínimo recomendado para elementos táctiles según las guías de Material Design y Apple HIG.

2. **Auto-grow hasta 150px:** Permite escribir más texto antes de activar el scroll interno, mejorando la experiencia en sesiones largas de chat.

3. **Guardar borrador automáticamente:** Prevenir pérdida de texto es crítico para la confianza del usuario. Apps modernas como WhatsApp, Telegram e iMessage guardan borradores automáticamente.

4. **Restaurar borrador:** Mejora significativamente la UX al permitir que el usuario continúe escribiendo donde lo dejó, especialmente útil cuando navega entre salas o recarga la página.

---

## ✅ VALIDACIÓN POST-CAMBIOS

Después de aplicar los cambios, verificar:

- [ ] Altura mínima es 48px
- [ ] Altura máxima es 150px
- [ ] Auto-grow funciona hasta 150px
- [ ] Scroll interno funciona después de 150px
- [ ] Borrador se guarda automáticamente al escribir
- [ ] Borrador se restaura al volver al chat
- [ ] Enter envía mensaje (comportamiento existente preservado)
- [ ] Shift+Enter crea salto de línea (comportamiento existente preservado)
- [ ] El input no pierde foco inesperadamente
- [ ] No hay regresiones en funcionalidad existente

