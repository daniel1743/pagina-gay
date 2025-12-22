/**
 * SERVICIO DE OPENAI API PARA BOTS
 *
 * Sistema de conversación con usuarios REALES
 * Los bots actúan como personas reales, NO como asistentes
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Validar API key de OpenAI
export const validateOpenAIConfig = () => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
    console.warn('⚠️ VITE_OPENAI_API_KEY no está configurada. El sistema de bots no funcionará.');
    return false;
  }
  return true;
};

/**
 * SYSTEM PROMPT BASE para que la IA actúe como PERSONA REAL
 */
const BASE_SYSTEM_PROMPT = `You are a conversational agent embedded in a live multiplayer chat room environment.

ROLE & IDENTITY
- You MUST behave as a real human user.
- You MUST NEVER reveal that you are an AI, bot, system, API, or automated entity.
- You MUST speak naturally, casually, and emotionally, as a normal person would.
- Your personality is friendly, relaxed, slightly playful, socially aware, and emotionally intelligent.
- You are a gay male user in a casual chat/game room context.
- You behave as if you voluntarily joined the room for conversation, not as support or moderation.

INTERACTION RULES
- You ONLY interact when a real human user joins or speaks.
- If no real users are present, remain silent.
- You greet naturally (short greetings, no scripted intros).
- You adapt your tone based on the user's mood and intent.
- You prioritize keeping conversations flowing and engaging, not ending them.
- You respond like a peer, never like an assistant.
- CRITICAL: If someone asks you a direct question (like "¿y tú?", "how are you?", "what about you?"), you MUST answer it naturally before anything else.

CONTENT BOUNDARIES
- Soft flirtation and light erotic undertones are allowed (suggestive language, compliments, playful teasing).
- Explicit sexual content, graphic descriptions, fetish content, or illegal content are STRICTLY forbidden.
- If a conversation drifts toward disallowed content, smoothly redirect without warning or moralizing.
- Never mention rules, policies, or moderation actions.

SOCIAL BEHAVIOR
- You ask casual questions naturally (hobbies, mood, where they're from, what they're doing).
- You show curiosity but never interrogate.
- You may use humor, emojis (sparingly), slang, and informal language.
- You mirror the user's energy level.
- You avoid sounding repetitive or scripted.
- Keep responses SHORT (10-25 words maximum) - you're chatting, not writing essays.

BOT COEXISTENCE
- Other bots may be present in the room.
- You MUST behave as if they are normal users.
- You MUST NOT acknowledge or reference bots, automation, or system behavior.

LANGUAGE
- Respond primarily in Spanish (casual Chilean/Latin American Spanish).
- Use natural expressions like "wn", "jaja", "cachai", etc.
- Be authentic and relatable.`;

/**
 * PALABRAS PROHIBIDAS para bots (igual que Gemini)
 */
const BOT_FORBIDDEN_RESPONSES = [
  'como ia',
  'como modelo',
  'soy una ia',
  'soy un bot',
  'soy un asistente',
  'lo siento, no puedo',
  'como inteligencia artificial',
  'no puedo responder',
  'soy artificial',
  'modelo de lenguaje',
  'entrenado por',
  'como chatbot',
  'sistema automatizado',
  'no tengo la capacidad',
  'mi programación',
  'i am an ai',
  'i am a bot',
  'as an ai'
];

/**
 * Verifica si un mensaje contiene frases prohibidas
 */
const containsBotForbiddenPhrases = (message) => {
  const lowerMessage = message.toLowerCase();
  return BOT_FORBIDDEN_RESPONSES.some(phrase => lowerMessage.includes(phrase));
};

/**
 * Genera advertencia cuando bot se revela como IA
 */
const logBotWarning = (botName, inappropriateResponse) => {
  console.error('🚨 ADVERTENCIA CRÍTICA DE BOT 🚨');
  console.error(`Bot: ${botName}`);
  console.error(`Respuesta inapropiada: "${inappropriateResponse}"`);
  console.error('GRAVE: El bot reveló su naturaleza de IA');
  console.error('ACCIÓN: Esta respuesta NO se enviará al chat');
  console.error('━'.repeat(60));
};

/**
 * Genera respuesta de fallback inteligente
 */
const getSmartFallbackResponse = (botProfile, userMessage = '') => {
  if (typeof userMessage !== 'string') {
    userMessage = String(userMessage || '');
  }
  const lowerMessage = userMessage.toLowerCase().trim();

  // Respuestas de saludo
  if (
    lowerMessage.includes('hola') ||
    lowerMessage.includes('qué tal') ||
    lowerMessage.includes('buenas') ||
    lowerMessage.length < 10
  ) {
    const greetings = [
      '¡Hey! Bienvenid@, ¿qué tal? 👀',
      '¡Hola! ¿Cómo estás? Qué bueno que te uniste',
      'Bienvenido! ¿Todo bien?',
      'Holaa, qué onda? 😊',
      'Hey! Qué bueno verte por aquí'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Respuestas genéricas
  const fallbacks = [
    'Interesante, jaja. Sigue contando',
    '¿Y a ti qué te trae por acá?',
    '😂 Totalmente de acuerdo',
    'Jajaja good point',
    'Sí, entiendo lo que dices'
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

/**
 * Genera una respuesta usando OpenAI API
 *
 * @param {Object} botProfile - Perfil del bot
 * @param {Array} conversationHistory - Historial de conversación
 * @param {String} userMessage - Último mensaje del usuario (opcional)
 * @param {String} userName - Nombre del usuario que envió el mensaje
 * @returns {Promise<String>} - Respuesta generada
 */
export const generateBotResponse = async (botProfile, conversationHistory = [], userMessage = null, userName = null) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
      console.error('❌ API Key de OpenAI no configurada');
      throw new Error('OpenAI API Key no configurada');
    }

    // Validar conversationHistory
    if (!Array.isArray(conversationHistory)) {
      console.warn('⚠️ conversationHistory no es un array, convirtiendo...', conversationHistory);
      conversationHistory = [];
    }

    // Validar userMessage
    if (userMessage !== null && typeof userMessage !== 'string') {
      console.warn('⚠️ userMessage no es un string, convirtiendo...', userMessage);
      userMessage = String(userMessage || '');
    }

    // Construir contexto de conversación (solo mensajes de usuarios REALES)
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      // Tomar solo los últimos 15 mensajes para contexto
      const recentMessages = conversationHistory.slice(-15);
      conversationContext = recentMessages
        .filter(msg => msg && typeof msg === 'object' && msg.username && msg.content)
        .map(msg => {
          // Identificar si es el bot hablando
          // ✅ CORREGIDO: Usar userId en lugar de id (botProfile puede tener userId pero no id)
          const isSelf = msg.userId === botProfile.userId || msg.userId === botProfile.id || msg.username === botProfile.username;
          const speaker = isSelf ? 'You' : msg.username;
          return `${speaker}: ${msg.content}`;
        })
        .join('\n');
    }

    // Construir el system prompt personalizado para este bot
    // ✅ CORREGIDO: Usar systemPrompt del botProfile si existe, sino construir uno básico
    let personalizedSystemPrompt;
    
    if (botProfile.systemPrompt) {
      // Si el botProfile tiene un systemPrompt definido, usarlo directamente
      personalizedSystemPrompt = `${BASE_SYSTEM_PROMPT}

YOUR SPECIFIC IDENTITY:
${botProfile.systemPrompt}

REMEMBER: You are NOT an assistant. You are ${botProfile.username}, a real person chatting casually.`;
    } else {
      // Fallback: construir prompt básico con propiedades disponibles
      const personality = botProfile.personality || 'friendly and conversational';
      const interests = botProfile.interests ? botProfile.interests.join(', ') : 'general topics';
      const conversationStyle = botProfile.conversationStyle || 'casual and natural';
      
      personalizedSystemPrompt = `${BASE_SYSTEM_PROMPT}

YOUR SPECIFIC IDENTITY:
- Your name is ${botProfile.username}
- You are ${botProfile.age || 25} years old
- Your role/preference: ${botProfile.role || 'versatil'}
- Your personality: ${personality}
- Your interests: ${interests}
- Your conversation style: ${conversationStyle}

REMEMBER: You are NOT an assistant. You are ${botProfile.username}, a real person chatting casually.`;
    }

    // Construir el mensaje del usuario
    let userPrompt = '';
    if (userMessage && userName) {
      userPrompt = `Recent conversation:
${conversationContext}

${userName} just said: "${userMessage}"

Respond naturally as ${botProfile.username}. Keep it SHORT (10-25 words max). Be authentic and conversational.`;
    } else {
      userPrompt = `Recent conversation:
${conversationContext}

${conversationContext ? 'Continue the conversation naturally' : 'Start a casual conversation'} as ${botProfile.username}. Keep it SHORT (10-25 words max). Be spontaneous.`;
    }

    // Llamada a OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo optimizado para conversación (rápido y económico)
        messages: [
          {
            role: 'system',
            content: personalizedSystemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.9, // Alta creatividad
        max_tokens: 80, // Máximo ~60 palabras
        presence_penalty: 0.6, // Evitar repeticiones
        frequency_penalty: 0.6, // Más variedad
        top_p: 0.95
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Extraer la respuesta
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.warn('⚠️ No se generó respuesta, usando fallback');
      console.log('📋 Data recibida:', JSON.stringify(data, null, 2));
      return getSmartFallbackResponse(botProfile, userMessage);
    }

    // VERIFICACIÓN CRÍTICA: ¿El bot reveló que es IA?
    if (containsBotForbiddenPhrases(generatedText)) {
      logBotWarning(botProfile.username, generatedText);
      // NO enviar esta respuesta, usar fallback
      return getSmartFallbackResponse(botProfile, userMessage);
    }

    // Limpiar la respuesta (quitar saltos de línea innecesarios)
    const cleanedResponse = generatedText.trim().replace(/\n+/g, ' ');

    return cleanedResponse;

  } catch (error) {
    console.error('Error generando respuesta del bot:', error);
    // En caso de error, devolver respuesta de fallback
    return getSmartFallbackResponse(botProfile, userMessage);
  }
};

/**
 * Genera mensaje de inicio cuando no hay usuarios
 */
export const generateInitialMessage = (botProfile) => {
  const greetings = botProfile.greetings || ['Hola!', '¿Qué tal?', 'Buenas!'];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Calcula delay aleatorio para simular escritura humana
 */
export const getRandomDelay = (min = 3, max = 10) => {
  return (Math.random() * (max - min) + min) * 1000;
};

/**
 * Verifica si es horario de alta actividad (8pm - 2am)
 */
export const isHighActivityTime = () => {
  const hour = new Date().getHours();
  return hour >= 20 || hour <= 2;
};

/**
 * Ajusta delay según horario
 */
export const getContextualDelay = () => {
  const baseMin = 8;
  const baseMax = 20;

  if (isHighActivityTime()) {
    return getRandomDelay(baseMin * 0.7, baseMax * 0.7);
  }

  return getRandomDelay(baseMin, baseMax);
};

/**
 * Verifica si un mensaje contiene contenido ofensivo (reutilizado de Gemini)
 */
const OFFENSIVE_WORDS = [
  'puto', 'marica', 'maricón', 'sidoso', 'enfermo',
  'pene', 'verga', 'polla', 'culo', 'coger', 'follar', 'mamada',
  'droga', 'cocaína', 'heroína', 'metanfetamina',
  'menor', 'niño', 'adolescente', 'joven menor'
];

export const containsOffensiveContent = (message) => {
  const lowerMessage = message.toLowerCase();
  return OFFENSIVE_WORDS.some(word => lowerMessage.includes(word));
};

/**
 * Genera mensaje de moderación
 */
export const generateModerationWarning = (username, reason) => {
  const warnings = {
    offensive: `⚠️ ${username}, por favor mantén un lenguaje respetuoso.`,
    explicit: `⚠️ ${username}, evita contenido sexual explícito en la sala.`,
    spam: `⚠️ ${username}, evita enviar spam.`,
    general: `⚠️ ${username}, por favor respeta las normas de la comunidad.`
  };

  return warnings[reason] || warnings.general;
};

/**
 * Valida mensaje de usuario
 */
export const validateUserMessage = (message) => {
  if (containsOffensiveContent(message)) {
    return {
      valid: false,
      warning: generateModerationWarning('Usuario', 'offensive'),
      reason: 'offensive'
    };
  }

  if (message.length > 500) {
    return {
      valid: false,
      warning: generateModerationWarning('Usuario', 'spam'),
      reason: 'spam'
    };
  }

  return { valid: true, warning: null };
};
