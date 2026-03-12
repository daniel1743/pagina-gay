# 🔍 Sistema de Trazabilidad de Mensajes

## 📋 Descripción

Sistema completo de trazabilidad para rastrear el flujo de mensajes desde que se escriben hasta que se renderizan en otros clientes. Diseñado para identificar **exactamente dónde se rompe la cadena** cuando los mensajes no llegan bidireccionalmente.

## 🚀 Activación

### Automático
- **En desarrollo**: Activado automáticamente
- **En producción**: Desactivado por defecto

### Manual
```javascript
// Activar en producción
localStorage.setItem('ENABLE_MESSAGE_TRACE', 'true');

// Desactivar
localStorage.removeItem('ENABLE_MESSAGE_TRACE');
```

## 📊 Pipeline de Eventos

El sistema rastrea los siguientes eventos en orden:

1. **USER_INPUT_TYPED** - Usuario escribe el mensaje
2. **UI_LOCAL_RENDER** - Mensaje se muestra localmente (optimista)
3. **OPTIMISTIC_MESSAGE_CREATED** - Mensaje optimista creado
4. **SEND_HANDLER_TRIGGERED** - Handler de envío activado
5. **PAYLOAD_VALIDATED** - Validación exitosa
6. **PAYLOAD_VALIDATION_FAILED** - Validación falló
7. **FIREBASE_WRITE_ATTEMPT** - Intento de escribir en Firestore
8. **FIREBASE_WRITE_SUCCESS** - Escritura exitosa en Firestore
9. **FIREBASE_WRITE_FAIL** - Escritura falló en Firestore
10. **REMOTE_LISTENER_TRIGGERED** - Listener de Firebase se disparó
11. **REMOTE_PAYLOAD_RECEIVED** - Mensaje recibido del listener
12. **CALLBACK_EXECUTED** - Callback ejecutado con mensajes
13. **STATE_UPDATED** - Estado de React actualizado
14. **OPTIMISTIC_MESSAGE_REPLACED** - Mensaje optimista reemplazado por real
15. **REMOTE_UI_RENDER** - Mensaje renderizado en UI

## 🔧 Uso

### Ver logs en consola (F12)

Todos los eventos se muestran en la consola con:
- **Emoji** identificador del evento
- **Color** según el tipo de evento
- **Datos completos** expandibles
- **Stack trace** limitado para debugging

### Rastrear un mensaje específico

```javascript
// En consola del navegador (F12)
window.messageTrace.getTraceForMessage('clientId-del-mensaje');
```

### Ver flujo completo de un mensaje

```javascript
// En consola del navegador (F12)
window.messageTrace.getMessageFlow('clientId-del-mensaje');
```

Esto mostrará:
- ✅ Si el flujo está completo
- ❌ Dónde se rompió (si se rompió)
- ⏱️ Duración total
- 📋 Todos los eventos en orden

### Ver estado del sistema

```javascript
window.messageTrace.status();
```

### Exportar historial

```javascript
const history = window.messageTrace.exportTraceHistory();
console.table(history.traces);
```

### Limpiar historial

```javascript
window.messageTrace.clearTraceHistory();
```

## 📝 Ejemplo de Logs

Cuando un mensaje se envía correctamente, verás algo como:

```
⌨️ [TRACE:USER_INPUT_TYPED] { traceId: "abc123", content: "Hola", ... }
🖥️ [TRACE:UI_LOCAL_RENDER] { traceId: "abc123", optimisticId: "temp_...", ... }
⚡ [TRACE:OPTIMISTIC_MESSAGE_CREATED] { traceId: "abc123", ... }
🚀 [TRACE:SEND_HANDLER_TRIGGERED] { traceId: "abc123", ... }
✅ [TRACE:PAYLOAD_VALIDATED] { traceId: "abc123", ... }
📤 [TRACE:FIREBASE_WRITE_ATTEMPT] { traceId: "abc123", ... }
✅ [TRACE:FIREBASE_WRITE_SUCCESS] { traceId: "abc123", messageId: "firestore_id", ... }
📡 [TRACE:REMOTE_LISTENER_TRIGGERED] { roomId: "principal", messageCount: 10, ... }
📥 [TRACE:REMOTE_PAYLOAD_RECEIVED] { traceId: "abc123", messageId: "firestore_id", ... }
🔄 [TRACE:CALLBACK_EXECUTED] { roomId: "principal", messageCount: 10, ... }
📊 [TRACE:STATE_UPDATED] { roomId: "principal", messageCount: 10, ... }
🔄 [TRACE:OPTIMISTIC_MESSAGE_REPLACED] { traceId: "abc123", realId: "firestore_id", ... }
🖼️ [TRACE:REMOTE_UI_RENDER] { traceId: "abc123", messageId: "firestore_id", ... }
```

## 🔍 Diagnóstico

### Si el mensaje NO llega a otros clientes:

1. **Verificar si llega a FIREBASE_WRITE_SUCCESS**
   - Si NO: El problema está en el envío a Firestore
   - Si SÍ: Continuar

2. **Verificar si llega a REMOTE_LISTENER_TRIGGERED**
   - Si NO: El listener no se está disparando (problema de suscripción)
   - Si SÍ: Continuar

3. **Verificar si llega a REMOTE_PAYLOAD_RECEIVED**
   - Si NO: El listener se dispara pero no procesa el mensaje
   - Si SÍ: Continuar

4. **Verificar si llega a REMOTE_UI_RENDER**
   - Si NO: El mensaje llega pero no se renderiza (problema de UI)
   - Si SÍ: El flujo está completo

### Puntos de fallo comunes:

- **FIREBASE_WRITE_FAIL**: Error de permisos, conexión, o reglas de Firestore
- **REMOTE_LISTENER_TRIGGERED no se dispara**: Problema con la suscripción onSnapshot
- **REMOTE_PAYLOAD_RECEIVED no incluye el mensaje**: Filtro o query incorrecto
- **REMOTE_UI_RENDER no se ejecuta**: Problema en el componente de renderizado

## 🎯 Identificación del Problema

El sistema identifica automáticamente dónde se rompe:

```javascript
const flow = window.messageTrace.getMessageFlow('clientId-del-mensaje');

// flow.completed: true/false
// flow.brokenAt: 'FIREBASE_WRITE' | 'REMOTE_LISTENER' | 'REMOTE_UI_RENDER' | null
```

## 📦 Archivos Modificados

1. **src/utils/messageTrace.js** - Sistema de trazabilidad
2. **src/pages/ChatPage.jsx** - Instrumentación del flujo de envío
3. **src/services/chatService.js** - Instrumentación de Firestore
4. **src/components/chat/ChatMessages.jsx** - Instrumentación del renderizado

## ⚠️ Notas Importantes

- El sistema NO genera loops infinitos
- El sistema NO consume Firebase adicionalmente
- El sistema se puede activar/desactivar fácilmente
- Los logs son detallados pero no bloquean la UI
- El historial está limitado a 1000 eventos para no consumir memoria

## 🔬 Próximos Pasos

1. Enviar un mensaje desde un cliente
2. Abrir consola (F12) en ambos clientes
3. Buscar el `traceId` o `clientId` del mensaje
4. Usar `window.messageTrace.getMessageFlow(traceId)` para ver el flujo completo
5. Identificar exactamente dónde se rompe la cadena

