# 🗺️ MAPEO COMPLETO: DÓNDE SE DISPARAN LAS IAs Y SUS INSTRUCCIONES

## 📋 RESUMEN EJECUTIVO

Este documento mapea **TODOS** los archivos donde se activan las IAs, se definen sus instrucciones, y se generan/envían sus mensajes.

---

## 🎯 ARCHIVOS PRINCIPALES (SISTEMA ACTIVO)

### 1. **`src/services/multiProviderAIConversation.js`** ⭐ PRINCIPAL

**Función:** Sistema principal de IAs multi-proveedor (OpenAI, Deepseek)

#### **Dónde se activan las IAs:**
- **`startRoomAI(roomId)`** - Línea ~910
  - Activa el sistema cuando hay usuarios reales (1-9)
  - Inicia `runConversationPulse()` para conversaciones entre IAs
  - Programa intervalos automáticos cada 3-5 minutos

- **`updateRoomAIActivity(roomId, realUserCount)`** - Línea ~928
  - Se llama desde `ChatPage.jsx` cuando cambia el número de usuarios
  - Activa/desactiva según cantidad de usuarios reales

- **`recordHumanMessage(roomId, username, content)`** - Línea ~946
  - Se dispara cuando un usuario real envía un mensaje
  - Activa respuesta de 1 IA al usuario real
  - Se llama desde `ChatPage.jsx` línea 647

#### **Dónde se definen las instrucciones:**
- **`PERSONALITIES` array** - Línea ~28
  - 15 personalidades con `systemPrompt` individual
  - Cada una tiene: `id`, `userId`, `username`, `avatar`, `provider`, `systemPrompt`

- **`buildPrompt(personality, roomId, isResponseToUser, userMessage, userName)`** - Línea ~301
  - Construye el prompt completo que se envía a la API
  - Combina: `systemPrompt` + reglas hard + reglas de longitud + reglas de emojis + contexto del historial
  - **Esta es la función que genera TODAS las instrucciones finales**

#### **Dónde se generan los mensajes:**
- **`generateAIMessage(roomId, personality, isResponseToUser, userMessage, userName, retryCount)`** - Línea ~639
  - Genera el mensaje llamando a la API (OpenAI/Deepseek)
  - Valida patrones prohibidos
  - Valida temas de personalidad
  - Reintenta hasta 3 veces si falla

#### **Dónde se envían los mensajes:**
- **`sendAIMessage(roomId, personality, content, source)`** - Línea ~755
  - Valida spam por frecuencia
  - Valida patrones prohibidos
  - Envía mensaje a Firestore
  - Registra en historial y cache

#### **Conversaciones automáticas:**
- **`runConversationPulse(roomId)`** - Línea ~843
  - Genera conversaciones entre IAs cada 3-5 minutos
  - Selecciona 1-2 IAs aleatoriamente
  - Delay de 20-40 segundos entre mensajes

---

### 2. **`src/pages/ChatPage.jsx`** ⭐ PUNTO DE ENTRADA

**Función:** Componente principal que dispara las IAs

#### **Dónde se activan las IAs:**
- **Línea ~505:** `updateRoomAIActivity(roomId, realUserCount)`
  - Se ejecuta cuando cambia el número de usuarios reales
  - Activa/desactiva el sistema de IAs

- **Línea ~647:** `recordHumanMessage(currentRoom, user.username, content)`
  - Se ejecuta cuando un usuario real envía un mensaje
  - Dispara respuesta de 1 IA al usuario

- **Línea ~506:** `greetNewUser(roomId, username)`
  - Saluda a usuarios nuevos (si está activo)

#### **Imports relevantes:**
```javascript
import { 
  updateRoomAIActivity,      // Activa/desactiva IAs según usuarios
  stopRoomAIConversation,   // Detiene IAs
  recordHumanMessage,        // Registra mensaje de usuario → dispara respuesta IA
  greetNewUser              // Saluda usuarios nuevos
} from '@/services/multiProviderAIConversation';
```

---

### 3. **`src/lib/ai/personalityTopics.js`** ⭐ VALIDACIÓN DE TEMAS

**Función:** Define temas únicos por personalidad y valida mensajes

#### **Dónde se definen temas:**
- **`getPersonalityTopics(username)`** - Línea ~7
  - Mapea temas únicos para cada IA
  - Retorna: `{ main, topics[], forbidden[] }`
  - Usado en `buildPrompt()` para forzar temas específicos

#### **Dónde se validan mensajes:**
- **`validateMessageForPersonality(message, personality)`** - Línea ~103
  - Valida que el mensaje contenga temas válidos
  - Bloquea temas prohibidos
  - Detecta patrones de plantilla ("wn y cuando...")
  - Se llama desde `generateAIMessage()` línea ~612

---

### 4. **`src/services/spamDetectionService.js`** ⭐ DETECCIÓN DE SPAM

**Función:** Previene spam masivo por frecuencia

#### **Dónde se valida spam:**
- **`validateMessageForSpam(personalityId, message)`** - Línea ~103
  - Detecta mensajes repetitivos en 1 minuto
  - Aplica penalizaciones temporales (5 min)
  - Se llama desde `sendAIMessage()` línea ~762

---

## 📚 ARCHIVOS SECUNDARIOS (LEGACY/DESACTIVADOS)

### 5. **`src/services/aiUserInteraction.js`**

**Estado:** ⚠️ PARCIALMENTE ACTIVO (solo bienvenidas)

**Función:** Interacción de IAs con usuarios individuales

#### **Dónde se activan:**
- **`activateAIForUser(roomId, userId, username)`** - Línea ~505
  - Envía bienvenida personalizada cuando entra un usuario
  - Usa `AI_PERSONAS` array (10 personalidades diferentes)

#### **Dónde se definen instrucciones:**
- **`AI_PERSONAS` array** - Línea ~46
  - 10 personalidades con `systemPrompt` individual
  - Diferentes a las de `multiProviderAIConversation.js`

**Nota:** Este sistema está parcialmente desactivado. Solo se usa para bienvenidas.

---

### 6. **`src/services/botCoordinator.js`**

**Estado:** ⚠️ DESACTIVADO

**Función:** Coordinador de bots legacy (comentado)

**Líneas relevantes:**
- `startBotsForRoom()` - Línea ~349 (comentado)
- `initializeBots()` - Línea ~382 (parcialmente activo)
- `activateAIWhenUserEnters()` - Línea ~510 (llama a `aiUserInteraction.js`)

---

### 7. **`src/services/openAIBotService.js`**

**Estado:** ⚠️ PARCIALMENTE ACTIVO

**Función:** Servicio de bots usando OpenAI

#### **Dónde se definen instrucciones:**
- **`BASE_SYSTEM_PROMPT`** - Línea ~24
  - Prompt base para todos los bots
  - Reglas de personalidad, estilo, límites

- **`buildPersonalizedSystemPrompt(botProfile)`** - Línea ~272
  - Combina `BASE_SYSTEM_PROMPT` + perfil específico

#### **Dónde se generan mensajes:**
- **`generateBotResponse(roomId, botProfile, conversationHistory, userMessage)`** - Línea ~304
  - Genera respuesta de bot a usuario real

---

### 8. **`src/config/botProfiles.js`**

**Estado:** ⚠️ LEGACY (usado por sistema desactivado)

**Función:** Define perfiles de bots legacy

#### **Dónde se definen instrucciones:**
- **`BOT_PROFILES` array** - Línea ~13
  - Perfiles de bots con `systemPrompt` individual
  - Incluye "Pablo Bot" (bot transparente que se identifica como bot)

---

### 9. **`src/services/geminiConversation.js`**

**Estado:** ⚠️ DESACTIVADO

**Función:** Sistema de conversación usando Gemini API

#### **Dónde se definen instrucciones:**
- **`AI_PERSONALITIES` array** - Línea ~23
  - 10 personalidades con `systemPrompt` individual

**Nota:** Todo el archivo está comentado/desactivado.

---

### 10. **`src/services/botGroupConversation.js`**

**Estado:** ⚠️ DESACTIVADO

**Función:** Conversaciones grupales entre bots

**Líneas relevantes:**
- `startGroupConversation()` - Comentado
- `schedulePeriodicGroupConversations()` - Comentado

---

### 11. **`src/services/botConversationOrchestrator.js`**

**Estado:** ⚠️ DESACTIVADO

**Función:** Orquestador de conversaciones entre bots

---

### 12. **`src/hooks/useBotSystem.js`**

**Estado:** ⚠️ DESACTIVADO (comentado en ChatPage.jsx)

**Función:** Hook React para integrar sistema de bots

**Nota:** Está comentado en `ChatPage.jsx` línea 22.

---

## 🔄 FLUJO COMPLETO DE ACTIVACIÓN

```
1. Usuario entra a sala
   ↓
2. ChatPage.jsx se monta
   ↓
3. useEffect detecta usuarios reales
   ↓
4. updateRoomAIActivity(roomId, realUserCount) [ChatPage.jsx:505]
   ↓
5. startRoomAI(roomId) [multiProviderAIConversation.js:910]
   ↓
6. runConversationPulse(roomId) se ejecuta
   ↓
7. Selecciona 1-2 IAs aleatoriamente
   ↓
8. generateAIMessage() genera mensaje
   ↓
9. buildPrompt() construye instrucciones
   ↓
10. fetchChatCompletion() llama a API (OpenAI/Deepseek)
   ↓
11. validateMessageForPersonality() valida tema
   ↓
12. sendAIMessage() valida spam
   ↓
13. sendMessage() envía a Firestore
```

---

## 📝 FLUJO DE RESPUESTA A USUARIO REAL

```
1. Usuario real envía mensaje
   ↓
2. ChatPage.jsx:647 → recordHumanMessage(roomId, username, content)
   ↓
3. multiProviderAIConversation.js:946 → recordHumanMessage()
   ↓
4. Selecciona 1 IA aleatoriamente
   ↓
5. setTimeout() programa respuesta en 2-4.5 segundos
   ↓
6. generateAIMessage(..., isResponseToUser=true, userMessage, userName)
   ↓
7. buildPrompt() construye prompt con prioridad al usuario
   ↓
8. fetchChatCompletion() genera respuesta
   ↓
9. Validaciones (personalidad, spam)
   ↓
10. sendAIMessage() envía respuesta
```

---

## 🎯 DÓNDE MODIFICAR INSTRUCCIONES

### Para cambiar instrucciones de IAs activas:

1. **`src/services/multiProviderAIConversation.js`**
   - **Línea ~28:** `PERSONALITIES` array - Modificar `systemPrompt` de cada IA
   - **Línea ~301:** `buildPrompt()` - Modificar reglas generales que se agregan a todos los prompts
   - **Línea ~430:** `hardRules` - Reglas duras anti-repetición

2. **`src/lib/ai/personalityTopics.js`**
   - **Línea ~7:** `getPersonalityTopics()` - Modificar temas permitidos/prohibidos por IA

### Para cambiar validaciones:

1. **`src/lib/ai/personalityTopics.js`**
   - **Línea ~103:** `validateMessageForPersonality()` - Modificar validación de temas

2. **`src/services/spamDetectionService.js`**
   - **Línea ~10:** `CONFIG` - Modificar umbrales de spam
   - **Línea ~103:** `validateMessageForSpam()` - Modificar lógica de detección

---

## 📊 RESUMEN DE ARCHIVOS

| Archivo | Estado | Función Principal |
|---------|--------|-------------------|
| `multiProviderAIConversation.js` | ✅ ACTIVO | Sistema principal de IAs |
| `ChatPage.jsx` | ✅ ACTIVO | Dispara activación de IAs |
| `personalityTopics.js` | ✅ ACTIVO | Validación de temas |
| `spamDetectionService.js` | ✅ ACTIVO | Detección de spam |
| `aiUserInteraction.js` | ⚠️ PARCIAL | Bienvenidas a usuarios |
| `openAIBotService.js` | ⚠️ PARCIAL | Bots legacy |
| `botCoordinator.js` | ⚠️ DESACTIVADO | Coordinador legacy |
| `geminiConversation.js` | ⚠️ DESACTIVADO | Gemini API |
| `botGroupConversation.js` | ⚠️ DESACTIVADO | Conversaciones grupales |
| `botProfiles.js` | ⚠️ LEGACY | Perfiles legacy |

---

## 🔍 FUNCIONES CLAVE PARA DEBUGGING

### Ver qué IAs están activas:
```javascript
// En consola F12:
import { getPersonalityStats } from './services/spamDetectionService';
getPersonalityStats('ai_mateo');
```

### Ver historial de mensajes de una IA:
```javascript
// En multiProviderAIConversation.js:
// roomHistories.get(roomId) - Línea ~152
```

### Ver penalizaciones activas:
```javascript
// En spamDetectionService.js:
// activePenalties Map - Línea ~12
```

---

## ✅ CONCLUSIÓN

**Sistema activo principal:**
- `src/services/multiProviderAIConversation.js` - TODO el sistema de IAs
- `src/pages/ChatPage.jsx` - Punto de entrada que dispara las IAs
- `src/lib/ai/personalityTopics.js` - Validación de temas
- `src/services/spamDetectionService.js` - Anti-spam

**Para modificar instrucciones:**
1. Editar `PERSONALITIES` array en `multiProviderAIConversation.js`
2. Editar `buildPrompt()` para cambiar reglas generales
3. Editar `personalityTopics.js` para cambiar temas permitidos

