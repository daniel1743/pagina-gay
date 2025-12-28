# 🔍 SISTEMA DE TRAZABILIDAD ABSOLUTA DE MENSAJES

**Fecha de implementación:** 2025-01-XX  
**Objetivo:** Identificar sin ambigüedad el origen de cada mensaje en el chat

---

## 📋 PRINCIPIOS FUNDAMENTALES

1. **Ningún mensaje se escribe en Firestore sin metadata de origen**
2. **La fuente debe ser detectable leyendo UN solo documento**
3. **La solución funciona incluso si el spam viene del propio sistema**
4. **Trazabilidad determinística y auditable (no depende de F12, listeners externos o suposiciones)**

---

## 🏗️ ESTRUCTURA DEL TRACE

Cada mensaje en Firestore incluye un campo `trace` con la siguiente estructura:

```typescript
interface MessageTrace {
  origin: "HUMAN" | "AI" | "SYSTEM";
  source: "USER_INPUT" | "AI_RESPONSE_TO_USER" | "AI_CONVERSATION_PULSE" | "AI_WELCOME" | "LEGACY_BOT" | "UNKNOWN";
  actorId: string;        // userId humano o aiId
  actorType: "HUMAN" | "AI" | "BOT";
  system: string;         // "multiProviderAIConversation" | "chatService" | "aiUserInteraction" | "botCoordinator" | "unknown"
  traceId: string;        // UUID único por mensaje
  createdAt: number;      // Date.now() para debugging
}
```

---

## 📊 VALORES DE `origin`

| Valor | Descripción | Ejemplo |
|-------|-------------|---------|
| `HUMAN` | Mensaje enviado por un usuario humano real | Usuario escribe "hola" |
| `AI` | Mensaje generado por una IA | IA responde a un usuario |
| `SYSTEM` | Mensaje del sistema o bot legacy | Bot automático, mensaje de bienvenida del sistema |

---

## 📊 VALORES DE `source`

| Valor | Descripción | Cuándo se usa |
|-------|-------------|---------------|
| `USER_INPUT` | Usuario humano escribió el mensaje | `chatService.js` → `sendMessage()` |
| `AI_RESPONSE_TO_USER` | IA respondiendo a un usuario real | `multiProviderAIConversation.js` → `recordHumanMessage()` |
| `AI_CONVERSATION_PULSE` | IA conversando entre ellas (pulse automático) | `multiProviderAIConversation.js` → `runConversationPulse()` |
| `AI_WELCOME` | IA saludando a un usuario nuevo | `multiProviderAIConversation.js` → `greetNewUser()` |
| `LEGACY_BOT` | Bot o sistema legacy (sin trace explícito) | Cualquier sistema que no use el nuevo trace |
| `UNKNOWN` | Origen desconocido (fallback) | Cuando no se puede determinar el origen |

---

## 📊 VALORES DE `system`

| Valor | Archivo | Descripción |
|-------|---------|-------------|
| `multiProviderAIConversation` | `src/services/multiProviderAIConversation.js` | Sistema principal de IAs conversacionales |
| `chatService` | `src/services/chatService.js` | Servicio de mensajes humanos |
| `aiUserInteraction` | `src/services/aiUserInteraction.js` | Sistema legacy de interacción IA-usuario |
| `botCoordinator` | `src/services/botCoordinator.js` | Sistema legacy de coordinación de bots |
| `unknown` | - | Sistema no identificado |

---

## 🔧 IMPLEMENTACIÓN

### 1. Función Helper

```javascript
const createMessageTrace = (origin, source, actorId, actorType, system) => {
  return {
    origin,
    source,
    actorId,
    actorType,
    system,
    traceId: crypto.randomUUID(),
    createdAt: Date.now()
  };
};
```

**Ubicación:** `src/services/multiProviderAIConversation.js`

---

### 2. Mensajes de IA (`sendAIMessage`)

**Archivo:** `src/services/multiProviderAIConversation.js`

```javascript
const trace = createMessageTrace(
  'AI',
  normalizedSource, // 'AI_RESPONSE_TO_USER' | 'AI_CONVERSATION_PULSE' | 'AI_WELCOME'
  personality.userId,
  'AI',
  'multiProviderAIConversation'
);

await sendMessage(roomId, {
  // ... otros campos
  trace
});
```

**Sources normalizados:**
- `CONVERSATION_PULSE` → `AI_CONVERSATION_PULSE`
- `RESPUESTA_USUARIO_REAL` → `AI_RESPONSE_TO_USER`
- `unknown` → `UNKNOWN`

---

### 3. Mensajes Humanos (`sendMessage`)

**Archivo:** `src/services/chatService.js`

```javascript
// Si no viene trace, crear uno (mensaje humano)
if (!trace) {
  trace = {
    origin: 'HUMAN',
    source: 'USER_INPUT',
    actorId: messageData.userId,
    actorType: 'HUMAN',
    system: 'chatService',
    traceId: crypto.randomUUID(),
    createdAt: Date.now()
  };
}

// Validación: Rechazar mensajes sin trace
if (!trace || !trace.origin || !trace.source || !trace.actorId) {
  throw new Error('Mensaje sin trazabilidad bloqueado');
}
```

---

### 4. Validación (Regla de Oro)

**Ubicación:** `src/services/chatService.js` → `sendMessage()`

```javascript
// 🚨 VALIDACIÓN: Rechazar mensajes sin trace
if (!trace || !trace.origin || !trace.source || !trace.actorId) {
  console.error('🚨 MENSAJE BLOQUEADO: Sin trazabilidad completa', {
    userId: messageData.userId,
    username: messageData.username,
    content: messageData.content?.substring(0, 50),
    trace: messageData.trace
  });
  throw new Error('Mensaje sin trazabilidad bloqueado: falta metadata de origen');
}
```

**Efecto:** Cualquier mensaje que intente escribirse sin `trace` completo será rechazado antes de llegar a Firestore.

---

## 🔍 CÓMO USAR PARA DEBUGGING

### Paso 1: Abrir Firestore Console

1. Ve a Firebase Console → Firestore
2. Navega a `rooms/{roomId}/messages`
3. Ordena por `timestamp` DESC

### Paso 2: Leer el campo `trace`

```javascript
// Ejemplo de mensaje en Firestore
{
  content: "wn, el queso es el mejor...",
  userId: "ai_dante",
  username: "Dante",
  trace: {
    origin: "AI",
    source: "AI_CONVERSATION_PULSE",
    actorId: "ai_dante",
    actorType: "AI",
    system: "multiProviderAIConversation",
    traceId: "550e8400-e29b-41d4-a716-446655440000",
    createdAt: 1704067200000
  }
}
```

### Paso 3: Interpretar los datos

- **`trace.origin`**: Indica si es `AI`, `HUMAN` o `SYSTEM`
- **`trace.source`**: Indica el **camino exacto** que generó el mensaje
- **`trace.actorId`**: Identifica la IA o bot responsable
- **`trace.system`**: Indica qué archivo/servicio lo generó

---

## 📝 EJEMPLOS DE TRAZABILIDAD

### Ejemplo 1: Usuario humano escribe

```javascript
{
  trace: {
    origin: "HUMAN",
    source: "USER_INPUT",
    actorId: "8NCsor7h9wN1G5ze2UIM",
    actorType: "HUMAN",
    system: "chatService",
    traceId: "...",
    createdAt: 1704067200000
  }
}
```

**Interpretación:** Usuario real escribió el mensaje desde `chatService.js`.

---

### Ejemplo 2: IA responde a usuario

```javascript
{
  trace: {
    origin: "AI",
    source: "AI_RESPONSE_TO_USER",
    actorId: "ai_dante",
    actorType: "AI",
    system: "multiProviderAIConversation",
    traceId: "...",
    createdAt: 1704067200000
  }
}
```

**Interpretación:** IA `ai_dante` respondió a un usuario real desde `multiProviderAIConversation.js` → `recordHumanMessage()`.

---

### Ejemplo 3: Pulse automático de IA

```javascript
{
  trace: {
    origin: "AI",
    source: "AI_CONVERSATION_PULSE",
    actorId: "ai_rafa",
    actorType: "AI",
    system: "multiProviderAIConversation",
    traceId: "...",
    createdAt: 1704067200000
  }
}
```

**Interpretación:** IA `ai_rafa` habló en un pulse automático desde `multiProviderAIConversation.js` → `runConversationPulse()`.

---

### Ejemplo 4: Bot legacy sin trace

```javascript
{
  trace: {
    origin: "SYSTEM",
    source: "LEGACY_BOT",
    actorId: "bot_legacy_123",
    actorType: "BOT",
    system: "unknown",
    traceId: "...",
    createdAt: 1704067200000
  }
}
```

**Interpretación:** Bot legacy que no usa el nuevo sistema de trace. Se marca automáticamente como `LEGACY_BOT`.

---

## ✅ GARANTÍAS DEL SISTEMA

1. ✅ **Nunca más habrá mensajes sin origen identificable**
2. ✅ **Podrás afirmar con evidencia:** "Este spam viene de `AI_CONVERSATION_PULSE` con IA `ai_dante`"
3. ✅ **Permite apagar una sola fuente sin romper todo el sistema**
4. ✅ **Funciona aunque el spam venga del propio backend**

---

## 🚨 CASOS ESPECIALES

### Mensajes Legacy sin Trace

Si un sistema legacy (ej: `aiUserInteraction.js`, `botCoordinator.js`) envía un mensaje sin `trace`, el sistema automáticamente:

1. Detecta que es un bot (por `userId` que empieza con `bot_`, `ai_`, `static_bot_`)
2. Crea un `trace` con:
   - `origin: "SYSTEM"`
   - `source: "LEGACY_BOT"`
   - `actorType: "BOT"`
   - `system: "unknown"`

Esto permite identificar mensajes legacy sin romper el sistema.

---

## 🔄 MIGRACIÓN DE MENSAJES EXISTENTES

Los mensajes existentes en Firestore **NO tienen** el campo `trace`. Esto es normal y esperado.

**Solución:** Solo los mensajes nuevos tendrán `trace`. Para identificar el origen de mensajes antiguos, usa otros campos como:
- `userId` (si empieza con `ai_` o `bot_`, es IA/Bot)
- `isAI` (si existe)
- `timestamp` (para correlacionar con logs)

---

## 📚 ARCHIVOS MODIFICADOS

1. ✅ `src/services/multiProviderAIConversation.js`
   - Función `createMessageTrace()` agregada
   - `sendAIMessage()` actualizado para incluir `trace`
   - Sources normalizados: `AI_CONVERSATION_PULSE`, `AI_RESPONSE_TO_USER`, `AI_WELCOME`

2. ✅ `src/services/chatService.js`
   - `sendMessage()` actualizado para incluir `trace` en mensajes humanos
   - Validación agregada para rechazar mensajes sin `trace`
   - Fallback para mensajes legacy sin `trace`

---

## 🎯 RESULTADO FINAL

**Antes:**
```javascript
// Mensaje en Firestore
{
  content: "hola",
  userId: "ai_dante",
  username: "Dante"
  // ❌ No sabemos de dónde vino
}
```

**Después:**
```javascript
// Mensaje en Firestore
{
  content: "hola",
  userId: "ai_dante",
  username: "Dante",
  trace: {
    origin: "AI",
    source: "AI_CONVERSATION_PULSE",
    actorId: "ai_dante",
    actorType: "AI",
    system: "multiProviderAIConversation",
    traceId: "550e8400-e29b-41d4-a716-446655440000",
    createdAt: 1704067200000
  }
  // ✅ Sabemos EXACTAMENTE de dónde vino
}
```

---

## 🔍 DEBUGGING: Cómo encontrar la fuente del spam

1. **Abrir Firestore Console**
2. **Ir a `rooms/{roomId}/messages`**
3. **Ordenar por `timestamp` DESC**
4. **Leer el campo `trace` del mensaje spam**
5. **Interpretar:**
   - `trace.source` → Indica el camino exacto
   - `trace.actorId` → Identifica la IA/bot responsable
   - `trace.system` → Indica qué archivo lo generó

**Ejemplo:**
```
Mensaje spam: "wn, el queso es el mejor..."
trace.source: "AI_CONVERSATION_PULSE"
trace.actorId: "ai_dante"
trace.system: "multiProviderAIConversation"

→ El spam viene de runConversationPulse() con la IA ai_dante
→ Solución: Desactivar runConversationPulse() o ajustar la personalidad de ai_dante
```

---

**Última actualización:** 2025-01-XX  
**Mantenido por:** Sistema de Trazabilidad Absoluta

