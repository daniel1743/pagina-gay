# 🔍 GUÍA DE DEBUGGING: Mensajes que desaparecen

## ⚠️ PROBLEMA REPORTADO
Los usuarios escriben mensajes pero no se guardan o desaparecen. Otros usuarios no pueden verlos.

---

## 📋 INSTRUCCIONES PARA DIAGNOSTICAR

### 1. Abre la consola del navegador
**Chrome/Edge**: F12 → Pestaña "Console"
**Firefox**: F12 → Pestaña "Consola"

### 2. Limpia la consola
Click en el ícono 🚫 o CTRL+L para limpiar logs antiguos

### 3. Intenta enviar un mensaje

### 4. Busca estos logs en la consola:

---

## 🔥 LOGS QUE DEBES VER (FLUJO EXITOSO)

### PASO 1: Inicio de envío
```
🔥🔥🔥 [SEND MESSAGE] INICIO DE ENVÍO
  ⏰ Timestamp: 2026-01-03T...
  🏠 Room ID: principal
  👤 User Data: { userId: "...", username: "...", ... }
  💬 Content: "tu mensaje aquí"
  🔐 Auth currentUser: { uid: "...", email: "..." }
```

**✅ QUE VERIFICAR**:
- `Room ID` debe ser la sala correcta (principal, gaming, etc.)
- `userId` NO debe ser null o undefined
- `username` debe ser tu nombre de usuario
- `Auth currentUser` NO debe ser NULL

---

### PASO 2: Rastreador de mensajes
```
╔════════════════════════════════════════════════════════════╗
║           📤 RASTREADOR DE MENSAJES                        ║
╠════════════════════════════════════════════════════════════╣
║ 📍 FUNCIÓN: sendMessage()                                  ║
║ 🏠 Sala: principal                                         ║
║ 👤 Remitente: TuNombre        │ Tipo: ✅ USUARIO REAL      ║
║ 💬 Mensaje: "tu mensaje aquí..."                          ║
║ 🆔 UserID: abc123...                                       ║
║ 👻 Anónimo: NO                                             ║
╚════════════════════════════════════════════════════════════╝
```

**✅ QUE VERIFICAR**:
- Tipo debe ser `✅ USUARIO REAL` (no bot ni IA)
- UserID debe existir

---

### PASO 3A: Rate Limiting (solo usuarios reales)
```
✅ [RATE LIMIT] Usuario TuNombre pasó verificación
```

**❌ SI VES ESTO EN CAMBIO**:
```
🚫 [RATE LIMIT] Mensaje bloqueado de TuNombre
Razón: [mensaje de error]
```
→ **PROBLEMA**: Estás enviando mensajes muy rápido. Espera 3 segundos entre mensajes.

---

### PASO 3B: Envío a Firestore
```
🔥 [DEBUG] RAMA USUARIO REGISTRADO - Intentando addDoc...
🔥 [DEBUG] Message object: { ... }
✅✅✅ [DEBUG] addDoc EXITOSO! Doc ID: xyz789...
```

**✅ SI VES "addDoc EXITOSO"**: El mensaje SÍ se guardó en Firestore

**❌ SI VES ESTO EN CAMBIO**:
```
❌❌❌ [DEBUG] addDoc FALLÓ (Usuario registrado):
❌ Error code: permission-denied
❌ Error message: Missing or insufficient permissions
```

→ **PROBLEMA**: Firestore está rechazando el mensaje por permisos

**Posibles errores**:
- `permission-denied`: Tu usuario no tiene permisos de escritura
- `unauthenticated`: No estás autenticado correctamente
- `unavailable`: Firestore no está disponible (problema de red)

---

### PASO 4: Confirmación final
```
✅ [MENSAJE ENVIADO] TuNombre (✅ USUARIO REAL) → "tu mensaje aquí..."
🔥 [DEBUG] Doc ID final: xyz789...
🔥 [DEBUG] sendMessage() FINALIZÓ (finally block)
```

**✅ SI VES ESTO**: El mensaje se envió correctamente

---

### PASO 5: Listener de mensajes (onSnapshot)
```
🔥 [DEBUG] onSnapshot triggered - 25 mensajes recibidos
🔥 [DEBUG] Cambios detectados: { added: 1, modified: 0, removed: 0 }
🔥 [DEBUG] Llamando callback con 25 mensajes
```

**✅ QUE VERIFICAR**:
- `added: 1` significa que tu nuevo mensaje fue detectado
- Si `added: 0`, el mensaje NO llegó al listener

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### ERROR 1: "Auth currentUser: NULL"
**Causa**: No estás autenticado
**Solución**: Cierra sesión y vuelve a iniciar sesión

### ERROR 2: "permission-denied"
**Causa**: Reglas de Firestore bloquean escritura
**Solución**: Verificar reglas en Firebase Console

### ERROR 3: "Rate limit exceeded"
**Causa**: Enviando mensajes muy rápido
**Solución**: Espera 3 segundos entre mensajes

### ERROR 4: "addDoc EXITOSO" pero el mensaje no aparece
**Causa**: El listener (onSnapshot) no está funcionando
**Verificar**:
- Busca logs de `onSnapshot triggered`
- Si no hay logs de onSnapshot, el listener no está escuchando
- Verifica que `added: 1` aparezca en los cambios detectados

### ERROR 5: Mensaje aparece y luego desaparece
**Causa**: Posible problema con state de React o re-renders
**Verificar**:
- Busca múltiples `onSnapshot triggered` consecutivos
- Si ves `removed: 1`, algo está borrando el mensaje

---

## 📊 INFORMACIÓN PARA ENVIARME

Si el problema persiste, **copia y pega** TODO lo que aparece en la consola desde:
1. `🔥🔥🔥 [SEND MESSAGE] INICIO DE ENVÍO`
2. Hasta `🔥 [DEBUG] sendMessage() FINALIZÓ (finally block)`

Incluye también:
- Logs de `onSnapshot` si aparecen
- Cualquier error en rojo (❌)
- Tu tipo de usuario (anónimo, guest, registrado)
- Nombre de la sala donde intentas escribir

---

## 🔧 DEBUGGING AVANZADO

### Ver reglas de Firestore en Firebase Console
1. Ve a https://console.firebase.google.com
2. Selecciona tu proyecto
3. Firestore Database → Reglas
4. Busca la sección `/rooms/{roomId}/messages`

### Verificar red en DevTools
1. F12 → Pestaña "Network"
2. Intenta enviar mensaje
3. Busca requests a `firestore.googleapis.com`
4. Si dice "FAILED" o "cancelled", hay problema de red

### Verificar estado de autenticación
En la consola, ejecuta:
```javascript
firebase.auth().currentUser
```
Debe devolver un objeto con tu información. Si devuelve `null`, no estás autenticado.

---

## ✅ CHECKLIST DE VERIFICACIÓN RÁPIDA

- [ ] La consola muestra `🔥🔥🔥 [SEND MESSAGE] INICIO DE ENVÍO`
- [ ] `Auth currentUser` NO es NULL
- [ ] `userId` NO es null/undefined
- [ ] Rate limit dice "✅ pasó verificación"
- [ ] Aparece "✅✅✅ addDoc EXITOSO"
- [ ] Aparece "onSnapshot triggered" con `added: 1`
- [ ] NO hay errores rojos (❌) en la consola

Si **todos los ✅ están marcados** pero el mensaje no aparece, el problema está en el frontend (React state).

Si **alguno falta**, el problema está en el backend (Firestore/Auth).
