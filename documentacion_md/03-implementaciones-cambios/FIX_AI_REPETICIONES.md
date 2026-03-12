# 🔧 Fix: Repeticiones en Mensajes de IA

**Fecha:** 2025-01-XX  
**Problema:** Las IAs estaban siendo muy repetitivas, diciendo frases como "you have the big value, you have the big value" o "I want to break your ass, I want to break your ass" sin contexto.

---

## 🎯 Objetivos del Fix

1. **Eliminar repeticiones**: Las IAs no deben repetir la misma frase múltiples veces
2. **Mejorar contexto**: Las IAs deben responder al contexto específico de los mensajes anteriores
3. **Usar nombres**: Las IAs deben usar los nombres de otras IAs cuando respondan (ej: "Hey Alfonso, ...")
4. **Variabilidad**: Las IAs deben variar sus respuestas y no usar siempre las mismas frases genéricas
5. **Respuesta contextual**: Las IAs deben responder a lo que se dijo específicamente, no solo generar mensajes genéricos

---

## ✅ Cambios Implementados

### 1. **Mejora del Contexto en `buildPrompt`**

**Antes:**
- Solo se pasaba el historial como texto plano sin estructura
- No se extraían los nombres de los autores
- No había instrucciones específicas para responder al contexto

**Ahora:**
- Se extraen los últimos 10 mensajes con sus autores
- Se identifican los nombres de otras IAs en el chat
- Se agregan instrucciones específicas para responder contextualmente

**Código agregado:**
```javascript
// Extraer mensajes con autores para contexto mejorado
const recentMessagesWithAuthors = history.slice(-25).map(h => {
  const content = h.content || '';
  const match = content.match(/^([^:]+):\s*(.+)$/);
  if (match) {
    return { author: match[1].trim(), message: match[2].trim(), full: content };
  }
  return { author: 'Desconocido', message: content, full: content };
});

// Extraer nombres de otras IAs en la conversación
const otherAIsInChat = recentMessagesWithAuthors
  .map(m => m.author)
  .filter(author => author !== personality.username && author !== 'Desconocido' && !author.includes('Usuario'))
  .filter((author, index, self) => self.indexOf(author) === index)
  .slice(0, 5);
```

### 2. **Instrucciones para Usar Nombres**

**Agregado en el prompt:**
- Las IAs ahora reciben instrucciones explícitas para usar nombres de otras IAs
- Ejemplos: "Hey [nombre], ..." o "Oye [nombre], ..."
- Si alguien dice algo, la IA debe responder usando su nombre

**Ejemplo de instrucción:**
```
🎯 CONTEXTO Y RESPUESTA NATURAL:
- Lee los últimos mensajes arriba. Hay X personas en el chat: [nombres]
- DEBES responder al CONTEXTO específico de lo que se dijo
- Si alguien dice algo, responde a ESO específicamente, no repitas frases genéricas
- USA LOS NOMBRES cuando respondas: "Hey [nombre], ..." o "Oye [nombre], ..."
- Ejemplo: Si [nombre] dice "tengo el culo grande", responde algo como "Hey [nombre], yo tengo la verga para ese culo"
```

### 3. **Instrucciones para Evitar Repeticiones**

**Agregado en `styleRules`:**
```
🚫🚫🚫 PROHIBIDO REPETICIONES - CRÍTICO:
🚫 NO repitas la misma frase palabra por palabra 3 veces seguidas
🚫 NO repitas exactamente lo que otro dijo - siempre VARÍA
🚫 Si alguien dice "tengo el culo grande", NO respondas "tengo el culo grande" también
🚫 Si ya dijiste algo similar hace 2-3 mensajes, di algo DIFERENTE esta vez

✅ VARIABILIDAD OBLIGATORIA:
✅ Si alguien dice "tengo panza", responde contextualmente: "yo tengo la verga para esa panza" o "quiero ponerla ahí"
✅ Si alguien dice "quiero culo", responde según tu rol: "yo tengo la verga" (activo) o "yo tengo el culo" (pasivo)
✅ USA NOMBRES cuando respondas: "Hey [nombre], ..." o "Oye [nombre], ..."
✅ RESPONDE al CONTEXTO específico - NO uses frases genéricas sin contexto
```

### 4. **Mejora en Detección de Repeticiones**

**Función `isMessageSimilar` mejorada:**

**Nuevas detecciones:**
1. **Repeticiones dentro del mismo mensaje**: Detecta si una frase de 3+ palabras se repite dentro del mismo mensaje
   - Ejemplo: "you have the big value, you have the big value" → BLOQUEADO

2. **Repeticiones exactas**: Detecta si el mensaje nuevo es idéntico a uno reciente
   - Compara con los últimos 15 mensajes (antes eran 10)

3. **Frases repetidas**: Detecta si una frase de 4+ palabras aparece múltiples veces en el mensaje nuevo
   - Ejemplo: "I want to break your ass, I want to break your ass" → BLOQUEADO

**Código agregado:**
```javascript
// Detectar repeticiones de frases completas dentro del mismo mensaje
const words = normalizedNew.split(/\s+/);
if (words.length >= 4) {
  for (let phraseLength = 3; phraseLength <= Math.min(8, Math.floor(words.length / 2)); phraseLength++) {
    for (let i = 0; i <= words.length - phraseLength * 2; i++) {
      const phrase1 = words.slice(i, i + phraseLength).join(' ');
      const phrase2 = words.slice(i + phraseLength, i + phraseLength * 2).join(' ');
      if (phrase1 === phrase2 && phrase1.length > 10) {
        return true; // Repetición detectada
      }
    }
  }
}

// Detectar si el mensaje nuevo es una repetición exacta
if (normalizedNew === normalizedRecent) {
  return true;
}

// Detectar si contiene la misma frase clave repetida
const recentWords = normalizedRecent.split(/\s+/);
if (recentWords.length >= 4) {
  for (let i = 0; i <= recentWords.length - 4; i++) {
    const phrase = recentWords.slice(i, i + 4).join(' ');
    if (phrase.length > 15 && normalizedNew.includes(phrase)) {
      const occurrences = (normalizedNew.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (occurrences >= 2) {
        return true; // Frase repetida detectada
      }
    }
  }
}
```

### 5. **Mejora en Respuesta a Usuarios Reales**

**Agregado contexto reciente:**
- Cuando un usuario real escribe, la IA ahora recibe contexto de los últimos 3 mensajes de otras personas
- Esto permite respuestas más naturales y contextuales

**Ejemplo:**
```
Usuario real (Juan) dijo: "tengo panza grande"

📋 CONTEXTO RECIENTE (otros mensajes en el chat):
Alfonso: tengo la verga para esa panza
Carlos: yo también quiero

- Puedes referirte a estos mensajes si es relevante, pero el usuario real tiene PRIORIDAD
```

---

## 📊 Resultados Esperados

### Antes:
- ❌ "you have the big value, you have the big value"
- ❌ "I want to break your ass, I want to break your ass"
- ❌ Mensajes genéricos sin contexto
- ❌ No uso de nombres de otras IAs
- ❌ Repeticiones constantes

### Después:
- ✅ "Hey Alfonso, yo tengo la verga para ese culo"
- ✅ "Oye Carlos, yo quiero ponerla en esa panza"
- ✅ Respuestas contextuales a lo que se dijo
- ✅ Uso de nombres de otras IAs
- ✅ Variabilidad en las respuestas
- ✅ Sin repeticiones de frases completas

---

## 🔍 Archivos Modificados

- `src/services/multiProviderAIConversation.js`
  - Función `buildPrompt`: Mejorado contexto y agregadas instrucciones
  - Función `isMessageSimilar`: Mejorada detección de repeticiones

---

## ✅ Testing

Para verificar que el fix funciona:

1. **Repeticiones dentro del mensaje**: Las IAs no deben repetir la misma frase múltiples veces en un solo mensaje
2. **Repeticiones entre mensajes**: Las IAs no deben repetir exactamente lo que otro dijo
3. **Uso de nombres**: Las IAs deben usar nombres de otras IAs cuando respondan
4. **Contexto**: Las IAs deben responder específicamente a lo que se dijo, no usar frases genéricas
5. **Variabilidad**: Las IAs deben variar sus respuestas y no usar siempre las mismas frases

---

## 🎯 Próximos Pasos (Opcional)

1. **Monitoreo**: Agregar logs más detallados para detectar patrones de repetición
2. **Ajuste fino**: Ajustar los umbrales de detección según el comportamiento real
3. **Feedback**: Recopilar feedback de usuarios sobre la mejora en las conversaciones

---

**Fin del Documento**


