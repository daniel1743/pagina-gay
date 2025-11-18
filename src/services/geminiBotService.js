/**
 * SERVICIO DE GEMINI API PARA BOTS
 *
 * Sistema de conversación con moderación automática
 * y advertencias para respuestas inapropiadas
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Modelo Gemini 1.5 Flash (rápido y eficiente para respuestas cortas)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Validar API key de Gemini (solo si se intenta usar)
export const validateGeminiConfig = () => {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ VITE_GEMINI_API_KEY no está configurada. El sistema de bots no funcionará.');
    return false;
  }
  return true;
};
/**
 * PALABRAS Y FRASES PROHIBIDAS PARA BOTS
 * Si el bot responde con esto, se genera advertencia
 */
const BOT_FORBIDDEN_RESPONSES = [
  // ... (Reglas de BOT_FORBIDDEN_RESPONSES se mantienen)
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
  'mi programación'
];

/**
 * PALABRAS SENSIBLES/OBSCENAS PARA MODERACIÓN DE USUARIOS
 * Contenido explícito que debe generar advertencias
 */
const OFFENSIVE_WORDS = [
  // ... (Reglas de OFFENSIVE_WORDS se mantienen)
  'puto', 'marica', 'maricón', 'sidoso', 'enfermo',
  'pene', 'verga', 'polla', 'culo', 'coger', 'follar', 'mamada',
  'droga', 'cocaína', 'heroína', 'metanfetamina',
  'menor', 'niño', 'adolescente', 'joven menor'
];

/**
 * SISTEMA DE CONFIGURACIÓN DE SEGURIDAD DE GEMINI
 */
const SAFETY_SETTINGS = [
  // ... (SAFETY_SETTINGS se mantienen)
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];

/**
 * Verifica si un mensaje contiene palabras prohibidas para bots
 */
const containsBotForbiddenPhrases = (message) => {
  const lowerMessage = message.toLowerCase();
  return BOT_FORBIDDEN_RESPONSES.some(phrase => lowerMessage.includes(phrase));
};

/**
 * Verifica si un mensaje contiene contenido ofensivo
 */
export const containsOffensiveContent = (message) => {
  const lowerMessage = message.toLowerCase();
  return OFFENSIVE_WORDS.some(word => lowerMessage.includes(word));
};

/**
 * Genera una advertencia crítica cuando un bot responde inapropiadamente
 */
const logBotWarning = (botName, inappropriateResponse) => {
  console.error('🚨 ADVERTENCIA CRÍTICA DE BOT 🚨');
  console.error(`Bot: ${botName}`);
  console.error(`Respuesta inapropiada: "${inappropriateResponse}"`);
  console.error('GRAVE: El bot reveló su naturaleza de IA');
  console.error('ACCIÓN: Esta respuesta NO se enviará al chat');
  console.error('NOTA: Esto NO debe pasar. Respeto a los usuarios es prioritario.');
  console.error('━'.repeat(60));

  // Aquí podrías enviar esto a un sistema de logging externo
  // Por ahora solo lo mostramos en consola
};

/**
 * Genera respuesta de fallback cuando el bot falla
 */
/**
 * Genera respuesta de fallback inteligente y coloquial cuando el bot falla.
 * Elige la respuesta más coherente según el mensaje del usuario,
 * usando jerga informal (chamo, wn, mmgvo, pana).
 *
 * @param {Object} botProfile - Perfil del bot
 * @param {String} userMessage - Mensaje del usuario que causó el fallo
 * @returns {String} - Respuesta de fallback
 */
const getSmartFallbackResponse = (botProfile, userMessage = '') => {
  const lowerMessage = userMessage.toLowerCase().trim();

  // 1. Respuestas de SALUDO/BIENVENIDA (Más directas y abiertas)
  if (
    lowerMessage.includes('hola') ||
    lowerMessage.includes('qué tal') ||
    lowerMessage.includes('buenas') ||
    lowerMessage.includes('saludos') ||
    lowerMessage.includes('entré') ||
    lowerMessage.length < 10 // Mensajes muy cortos suelen ser saludos
  ) {
    const greetings = [
      '¡Hey! Bienvenid@, ¿qué tal? 👀',
      '¡Hola! ¿Cómo estás? Qué bueno que te uniste',
      '¡Hola hola! Siéntete en casa, ¿qué cuentas?',
      'Bienvenido! ¿Todo bien? Dale, únete a la conversa',
      'Holaa, qué onda? 😊',
      'Hey! Qué bueno verte por aquí'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 2. Respuestas de OPINIÓN/PREGUNTA (Interés y chismorreo)
  if (
    lowerMessage.includes('qué piensas') ||
    lowerMessage.includes('cuéntame') ||
    lowerMessage.includes('alguien') ||
    lowerMessage.includes('vieron') ||
    lowerMessage.includes('escucharon') ||
    lowerMessage.includes('qué onda')
  ) {
    const opinions = [
      '¡Dale! Cuéntanos más de eso, me interesa',
      'Tienes razón, ¿y tú qué opinas?',
      'Me gusta cómo piensas, ¿algún detalle más?',
      '¡Totalmente! ¿Qué pasó con eso? No me enteré',
      'Interesante punto, cuenta más',
      '¿En serio? No sabía eso'
    ];
    return opinions[Math.floor(Math.random() * opinions.length)];
  }

  // 3. Respuesta GENÉRICA (último recurso)
  const fallbacks = [
    'Interesante, jaja. Sigue contando',
    '¿Y a ti qué te trae por acá?',
    '😂 Totalmente de acuerdo, me pasa igual',
    'Puede ser, quién sabe jaja',
    'Jajaja good point',
    'Sí, entiendo lo que dices'
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

/**
 * Alias para compatibilidad con código existente
 */
const getFallbackResponse = (botProfile, userMessage = '') => {
  return getSmartFallbackResponse(botProfile, userMessage);
};

/**
 * Genera una respuesta usando Gemini API
 *
 * @param {Object} botProfile - Perfil del bot
 * @param {Array} conversationHistory - Historial de conversación
 * @param {String} userMessage - Último mensaje del usuario (opcional)
 * @returns {Promise<String>} - Respuesta generada
 */
export const generateBotResponse = async (botProfile, conversationHistory = [], userMessage = null) => {
  try {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'TU_API_KEY_AQUI') {
      console.error('❌ API Key de Gemini no configurada');
      throw new Error('Gemini API Key no configurada');
    }

    // Construir contexto de conversación
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      // Tomar solo los últimos 10 mensajes para no saturar
      const recentMessages = conversationHistory.slice(-10);
      conversationContext = recentMessages
        .map(msg => `${msg.username}: ${msg.content}`)
        .join('\n');
    }

    // CONSTRUCCIÓN DEL PROMPT CORREGIDA (Líneas 147 a 157)
    // Se añade una instrucción fuerte para priorizar la respuesta al usuario real.
    const prompt = userMessage
      ? `INSTRUCCIÓN CRÍTICA: Un usuario real acaba de escribir "${userMessage}". Tu RESPUESTA DEBE ser una interacción directa, natural y breve (máximo 2 frases) con ese mensaje, antes de intentar continuar el tema de conversación.

Conversación reciente:
${conversationContext}

Último mensaje: ${userMessage}

Responde como ${botProfile.username} de manera natural y breve (máximo 2 frases).`
      : `Conversación reciente:
${conversationContext}

Inicia o continúa la conversación como ${botProfile.username} de manera natural (máximo 2 frases).`;

    // Llamada a Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${botProfile.systemPrompt}\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.85,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 400, // Aumentado: Gemini 2.5 usa muchos tokens en "thoughts"
          candidateCount: 1,
        },
        safetySettings: SAFETY_SETTINGS
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Gemini API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: GEMINI_API_URL
      });
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Verificar si la respuesta fue bloqueada por seguridad
    if (data.promptFeedback?.blockReason) {
      console.warn(`⚠️ Respuesta bloqueada por seguridad: ${data.promptFeedback.blockReason}`);
      console.log('📋 Data completa:', data);
      return getFallbackResponse(botProfile, userMessage);
    }

    // Extraer la respuesta
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.warn('⚠️ No se generó respuesta, usando fallback');
      console.log('📋 Data recibida:', JSON.stringify(data, null, 2));
      return getFallbackResponse(botProfile, userMessage);
    }

    // VERIFICACIÓN CRÍTICA: ¿El bot reveló que es IA?
    if (containsBotForbiddenPhrases(generatedText)) {
      logBotWarning(botProfile.username, generatedText);
      // NO enviar esta respuesta, usar fallback
      return getFallbackResponse(botProfile, userMessage);
    }

    // Limpiar la respuesta (quitar saltos de línea innecesarios)
    const cleanedResponse = generatedText.trim().replace(/\n+/g, ' ');

    return cleanedResponse;

  } catch (error) {
    console.error('Error generando respuesta del bot:', error);
    // En caso de error, devolver respuesta de fallback
    return getFallbackResponse(botProfile, userMessage);
  }
};

/**
 * Genera mensaje de inicio para cuando no hay usuarios
 */
export const generateInitialMessage = (botProfile) => {
  const greetings = botProfile.greetings || ['Hola!', '¿Qué tal?', 'Buenas!'];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Calcula delay aleatorio para simular escritura humana
 *
 * @param {Number} min - Mínimo en segundos
 * @param {Number} max - Máximo en segundos
 * @returns {Number} - Delay en milisegundos
 */
export const getRandomDelay = (min = 8, max = 20) => {
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
    // En horario pico, responden más rápido
    return getRandomDelay(baseMin * 0.7, baseMax * 0.7);
  }

  return getRandomDelay(baseMin, baseMax);
};

/**
 * Genera mensaje de sistema para advertencias de usuario
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
 * Valida mensaje de usuario antes de enviar
 * Retorna { valid: boolean, warning: string|null }
 */
export const validateUserMessage = (message) => {
  // Verificar contenido ofensivo
  if (containsOffensiveContent(message)) {
    return {
      valid: false,
      warning: generateModerationWarning('Usuario', 'offensive'),
      reason: 'offensive'
    };
  }

  // Verificar longitud excesiva (spam)
  if (message.length > 500) {
    return {
      valid: false,
      warning: generateModerationWarning('Usuario', 'spam'),
      reason: 'spam'
    };
  }

  return { valid: true, warning: null };
};