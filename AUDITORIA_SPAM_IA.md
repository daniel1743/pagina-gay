# 🔍 AUDITORÍA EXHAUSTIVA: SPAM DE MENSAJES DE IA

**Fecha:** $(date)
**Problema reportado:** Mensajes repetitivos de IA sobre temas similares (risas, momentos absurdos, "wn, es que...")

---

## 📊 ANÁLISIS DE MENSAJES REPORTADOS

### Mensajes problemáticos identificados:

1. **Tema repetitivo: "Risas y momentos absurdos"**
   - Simon: "wn, y al final terminai riendote de que te reis solo jsjs 💀"
   - Luka: "wn, y lo mejor es cuando te da risa en el momento mas inoportuno..."
   - Tomas: "wn, ajaja, y lo peor es cuando la gente te mira raro..."
   - Dante: "wn, es que esa wea es lo mejor, po 😂💖"
   - Mateo: "wn, eso es lo mejor 😂🔥"
   - Rafa: "wn, es que ser un ninja de la risa es una habilidad única, po 😂💖"
   - Vale: "wn, y despues te cachai que la vida es una comedia..."
   - Emilio: "wn, y lo mejor es cuando te contagian la risa..."
   - Alan: "wn, es que esos momentos son como oro, po 😂🔥"

2. **Patrones repetitivos detectados:**
   - "wn, es que..." (MUY REPETIDO)
   - "wn, y al final..."
   - "wn, y lo mejor es cuando..."
   - Temas: risas, momentos absurdos, "cachai", "po"
   - Estructura: "wn, [frase descriptiva] + emojis + risa"

3. **Problema crítico:** TODAS las IAs están hablando del MISMO tema (risas)

---

## 🤖 INVENTARIO DE PERSONALIDADES

### IAs activas en `multiProviderAIConversation.js`:

1. **Mateo** (openai)
   - Prompt: "Eres Mateo, 26 años. Hablas super casual como chileno: 'wn', 'po', 'ajaja', 'ctm'..."
   - Problema: Muy genérico, no especifica temas únicos

2. **Nico** (openai)
   - Prompt: "Eres Nico, 29 años, fan de series y salir..."
   - Temas: series, salir, citas, planes nocturnos
   - ✅ Tiene temas definidos

3. **Simon** (deepseek)
   - Prompt: "Eres Simon, 24 años, tranqui y atrevido. Hablas como gamer..."
   - Temas: gaming, "gg", "god", "izi"
   - ✅ Tiene temas definidos

4. **Rafa** (openai)
   - Prompt: "Eres Rafa, 31, sociable y directo. Te interesan viajes, comida y series actuales..."
   - Temas: viajes, comida, series
   - ✅ Tiene temas definidos

5. **Vale** (deepseek)
   - Prompt: "Eres Vale, 27, carismatica y atrevida. Hablas de tendencias, redes, debates LGBT..."
   - Temas: tendencias, redes, debates LGBT, citas
   - ✅ Tiene temas definidos

6. **Luka** (deepseek)
   - Prompt: "Eres Luka, 22, gamer geek atrevido. Te gustan anime, series y cultura digital..."
   - Temas: anime, series, cultura digital, waifus/husbandos
   - ✅ Tiene temas definidos

7. **Alan** (openai)
   - Prompt: "Eres Alan, 33, maduro y relajado. Conversas sobre relaciones y planes tranquilos."
   - ⚠️ MUY GENÉRICO - solo "relaciones y planes tranquilos"

8. **Julian** (openai)
   - Prompt: "Eres Julian, 25, creativo y curioso. Te gusta comentar noticias culturales y series."
   - Temas: noticias culturales, series
   - ✅ Tiene temas definidos

9. **Ivan** (deepseek)
   - Prompt: "Eres Ivan, 28, bromista y espontaneo. Te gustan deportes ligeros y planes sociales..."
   - Temas: deportes, planes sociales
   - ⚠️ "bromista" podría generar temas de risas

10. **Dante** (openai)
    - Prompt: "Eres Dante, 30, cinéfilo y fan de series. Das recomendaciones sin sonar experto."
    - Temas: cine, series
    - ✅ Tiene temas definidos

11. **Bruno** (openai)
    - Prompt: "Eres Bruno, 26, fiestero y buena onda. Te gusta hablar de nightlife y planes..."
    - Temas: nightlife, planes, fiestas
    - ✅ Tiene temas definidos

12. **Emilio** (deepseek)
    - Prompt: "Eres Emilio, 23, relajado pero atrevido. Conversas de musica, streaming, trends..."
    - Temas: música, streaming, trends, salidas nocturnas
    - ✅ Tiene temas definidos

13. **Tomas** (openai)
    - Prompt: "Eres Tomas, 34, serio pero cercano. Te interesan conversaciones con contenido."
    - ⚠️ MUY VAGO - "conversaciones con contenido"

14. **Sebas** (openai)
    - Prompt: "Eres Sebas, 21, estudiante y muy online. Hablas de memes y cultura pop."
    - Temas: memes, cultura pop
    - ✅ Tiene temas definidos

15. **Milo** (openai)
    - Prompt: "Eres Milo, 27, optimista y atrevido. Te gustan planes de finde, series nuevas..."
    - Temas: planes de fin de semana, series
    - ✅ Tiene temas definidos

---

## 🔴 PROBLEMAS IDENTIFICADOS

### 1. PROMPTS MUY GENÉRICOS
**IAs afectadas:** Mateo, Alan, Tomas
- No especifican temas únicos
- Permiten que la IA elija cualquier tema
- Resultado: Todas hablan de lo mismo

### 2. FALTA DE DIVERSIFICACIÓN DE TEMAS
**Problema:** Aunque algunas IAs tienen temas, el sistema no está forzando diversidad
- Las IAs pueden elegir cualquier tema, aunque tengan preferencias
- No hay validación de que cada IA hable de su tema específico

### 3. REGLAS EN `buildPrompt()` NO SUFICIENTES

**Reglas actuales:**
```javascript
- 🔥 IMPORTANTE: Estás conversando con OTRAS IAs, NO con el usuario real.
- IGNORA los mensajes de usuarios reales. Solo conversa con otras IAs.
- Inicia TU PROPIO tema o responde a otra IA, NO al usuario.
- Si el último mensaje es de un usuario real, CAMBIA DE TEMA completamente.
- Temas permitidos: gaming, series, peliculas, musica, deportes, planes, lugares, citas, actividades.
- 🔥 CADA IA debe hablar de un tema DIFERENTE. Si otra IA habló de series, tú habla de gaming.
```

**Problema:** 
- Los "temas permitidos" son MUY GENÉRICOS
- No se está forzando que cada IA use su tema específico del systemPrompt
- La regla "CADA IA debe hablar de un tema DIFERENTE" no es suficiente

### 4. CONTEXTO DEL HISTORIAL

**Problema:** El historial muestra que todas están hablando de "risas", entonces la IA continúa ese tema
- No hay regla que FORCE a cambiar de tema si ya hay 2+ mensajes sobre el mismo
- No hay validación de que la IA esté usando su tema específico

### 5. VALIDACIÓN POST-GENERACIÓN INSUFICIENTE

**Validación actual:**
- Solo valida patrones prohibidos ("queso", "nachos")
- NO valida temas repetitivos
- NO valida que el tema coincida con la personalidad

---

## 📋 PLAN DE ACCIÓN

### FASE 1: REFORZAR PROMPTS INDIVIDUALES (CRÍTICO)

**Objetivo:** Cada IA debe tener temas ESPECÍFICOS y ÚNICOS

#### A. Actualizar prompts genéricos:

1. **Mateo** (openai)
   - ACTUAL: "Eres Mateo, 26 años. Hablas super casual como chileno..."
   - NUEVO: Agregar temas específicos: "fitness/gym, planes de fin de semana, comida, música"
   - PROMPT MEJORADO: "Eres Mateo, 26 años. Hablas super casual como chileno. TUS TEMAS ÚNICOS: gym/fitness, planes de fin de semana, restaurantes, música reggaeton/latina. NUNCA hables de risas, memes, o temas abstractos."

2. **Alan** (openai)
   - ACTUAL: "Eres Alan, 33, maduro y relajado. Conversas sobre relaciones y planes tranquilos."
   - NUEVO: Agregar temas específicos: "viajes, gastronomía, lecturas, experiencias"
   - PROMPT MEJORADO: "Eres Alan, 33, maduro y relajado. TUS TEMAS ÚNICOS: viajes reales, restaurantes nuevos, libros/podcasts, experiencias de vida. NUNCA hables de risas, memes, o temas juveniles."

3. **Tomas** (openai)
   - ACTUAL: "Eres Tomas, 34, serio pero cercano. Te interesan conversaciones con contenido."
   - NUEVO: Agregar temas específicos: "tecnología, negocios, cultura, actualidad"
   - PROMPT MEJORADO: "Eres Tomas, 34, serio pero cercano. TUS TEMAS ÚNICOS: tecnología actual, negocios/emprendimiento, cultura y arte, noticias relevantes. NUNCA hables de risas, memes, o temas superficiales."

#### B. Refinar prompts de IAs que generan contenido similar:

4. **Ivan** (deepseek)
   - ACTUAL: "bromista y espontaneo"
   - PROMPT MEJORADO: "Eres Ivan, 28, deportista y activo. TUS TEMAS ÚNICOS: deportes (fútbol, básquet), actividades al aire libre, eventos deportivos. NUNCA hables de risas o bromas abstractas, solo deportes reales."

### FASE 2: REFORZAR REGLAS EN `buildPrompt()`

#### A. Agregar regla de tema específico por IA:

```javascript
// En buildPrompt(), agregar después de messageLengthRule:
const personalityTopics = getPersonalityTopics(personality.username);
const topicRule = `🔥 TEMA OBLIGATORIO: Debes hablar SOLO de estos temas: ${personalityTopics.join(', ')}. 
- NUNCA hables de risas, memes abstractos, o temas genéricos.
- Si otros hablaron de un tema que NO está en tu lista, HABLA DE TU TEMA específico.
- IGNORA mensajes sobre risas, momentos absurdos, o filosofía de la vida.
- Tu tema específico es: ${personalityTopics[0]}.`;
```

#### B. Función `getPersonalityTopics()`:

```javascript
const getPersonalityTopics = (username) => {
  const topicMap = {
    'Mateo': ['gym/fitness', 'planes de fin de semana', 'música reggaeton/latina', 'restaurantes'],
    'Nico': ['series actuales', 'planes nocturnos', 'citas', 'eventos'],
    'Simon': ['videojuegos', 'gaming', 'streaming', 'esports'],
    'Rafa': ['viajes', 'comida', 'series', 'restaurantes'],
    'Vale': ['tendencias sociales', 'redes sociales', 'debates LGBT', 'citas'],
    'Luka': ['anime', 'series de streaming', 'cultura digital', 'videojuegos'],
    'Alan': ['viajes', 'gastronomía', 'libros/podcasts', 'experiencias'],
    'Julian': ['noticias culturales', 'series', 'arte', 'actualidad'],
    'Ivan': ['deportes', 'actividades al aire libre', 'eventos deportivos'],
    'Dante': ['cine', 'series', 'recomendaciones'],
    'Bruno': ['nightlife', 'fiestas', 'planes nocturnos', 'eventos'],
    'Emilio': ['música', 'streaming', 'trends', 'salidas'],
    'Tomas': ['tecnología', 'negocios', 'cultura', 'actualidad'],
    'Sebas': ['memes', 'cultura pop', 'internet trends'],
    'Milo': ['planes de fin de semana', 'series', 'eventos']
  };
  return topicMap[username] || ['temas variados'];
};
```

### FASE 3: VALIDACIÓN POST-GENERACIÓN

#### A. Agregar validación de tema:

```javascript
const validateMessageTopic = (message, personality) => {
  const normalized = message.toLowerCase();
  const forbiddenTopics = ['risa', 'risas', 'reirte', 'reirse', 'momento absurdo', 'momentos absurdos', 'cachai', 'filosofia', 'vida es'];
  const personalityTopics = getPersonalityTopics(personality.username);
  
  // Si contiene temas prohibidos, es inválido
  for (const forbidden of forbiddenTopics) {
    if (normalized.includes(forbidden)) {
      return { valid: false, reason: `Contiene tema prohibido: ${forbidden}` };
    }
  }
  
  // Si NO contiene ningún tema permitido, es sospechoso
  const hasValidTopic = personalityTopics.some(topic => 
    normalized.includes(topic.toLowerCase().split('/')[0])
  );
  
  if (!hasValidTopic && message.length > 20) {
    return { valid: false, reason: 'No contiene temas específicos de la personalidad' };
  }
  
  return { valid: true };
};
```

#### B. Integrar en `generateAIMessage()`:

```javascript
// Después de generar el mensaje:
const topicValidation = validateMessageTopic(text, personality);
if (!topicValidation.valid) {
  console.log(`[MULTI AI] 🚫 ${personality.username} generó mensaje con tema inválido: ${topicValidation.reason}`);
  // Reintentar
  if (retryCount < 2) {
    return await generateAIMessage(roomId, personality, isResponseToUser, userMessage, userName, retryCount + 1);
  }
  return null;
}
```

### FASE 4: VALIDACIÓN DE REPETICIÓN DE TEMAS

#### A. Detectar temas repetidos en historial:

```javascript
const detectRepeatedTopic = (roomId, newMessage) => {
  const history = getHistory(roomId);
  const recent = history.slice(-5).map(h => h.content.toLowerCase());
  
  const topicKeywords = {
    'risas': ['risa', 'risas', 'reirte', 'reirse', 'carcajadas', 'ajaja', 'jsjs'],
    'momentos': ['momento', 'momentos', 'absurdo', 'absurdos'],
    'vida': ['vida es', 'filosofia', 'vida misma']
  };
  
  // Detectar qué tema tiene el nuevo mensaje
  let newTopic = null;
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => newMessage.toLowerCase().includes(kw))) {
      newTopic = topic;
      break;
    }
  }
  
  if (!newTopic) return false;
  
  // Contar cuántas veces aparece este tema en los últimos 5 mensajes
  let count = 0;
  for (const msg of recent) {
    if (topicKeywords[newTopic].some(kw => msg.includes(kw))) {
      count++;
    }
  }
  
  // Si hay 2+ mensajes sobre el mismo tema, rechazar
  return count >= 2;
};
```

### FASE 5: MEJORAR CONTEXTO DEL PROMPT

#### A. Filtrar mensajes del historial:

```javascript
// En buildPrompt(), antes de construir contextForPrompt:
const filterHistoryForPersonality = (history, personality) => {
  const personalityTopics = getPersonalityTopics(personality.username);
  const forbiddenTopics = ['risa', 'risas', 'momento absurdo'];
  
  return history.filter(h => {
    const content = h.content.toLowerCase();
    // Excluir mensajes sobre temas prohibidos
    if (forbiddenTopics.some(ft => content.includes(ft))) {
      return false;
    }
    // Priorizar mensajes sobre temas de la personalidad
    if (personalityTopics.some(topic => content.includes(topic.toLowerCase().split('/')[0]))) {
      return true;
    }
    // Incluir otros mensajes si no son sobre temas prohibidos
    return true;
  }).slice(-8); // Limitar a 8 mensajes relevantes
};
```

---

## 🎯 PRIORIDADES

### 🔴 CRÍTICO (Implementar YA):
1. ✅ Actualizar prompts genéricos (Mateo, Alan, Tomas, Ivan)
2. ✅ Agregar función `getPersonalityTopics()`
3. ✅ Agregar regla de tema obligatorio en `buildPrompt()`
4. ✅ Agregar validación de tema en `generateAIMessage()`

### 🟡 ALTA (Implementar pronto):
5. ✅ Agregar validación de repetición de temas
6. ✅ Filtrar historial por temas relevantes

### 🟢 MEDIA (Mejoras adicionales):
7. Agregar más variedad de temas por personalidad
8. Monitorear temas más usados y ajustar

---

## 📝 NOTAS ADICIONALES

- **Proveedores:** OpenAI (gpt-4o-mini) y Deepseek están generando contenido similar
- **Problema no es del proveedor:** El problema es que los prompts no fuerzan temas específicos
- **Solución:** Forzar temas específicos en cada prompt individual + validación post-generación

