/**
 * SERVICIO DE GEMINI API PARA BOTS HUMANOS
 *
 * ⚠️ CRÍTICO: Conversaciones 100% naturales que parecen humanas
 * - System prompts mejorados con análisis contextual
 * - Humanización automática (typos, delays, emojis)
 * - Banco de 700+ respuestas únicas como fallback
 * - Parámetros dinámicos por personalidad
 */

import { humanizeMessage } from '@/utils/humanize';
import { getContextualResponse, HUMAN_RESPONSES } from '@/data/humanResponses';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Modelo Gemini 2.0 Flash Experimental (optimizado para conversaciones naturales)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
 * Genera respuesta de fallback inteligente usando el banco de 700+ respuestas
 *
 * @param {Object} botProfile - Perfil del bot
 * @param {String} userMessage - Mensaje del usuario que causó el fallo
 * @returns {String} - Respuesta de fallback humanizada
 */
const getSmartFallbackResponse = (botProfile, userMessage = '') => {
  // ✅ Usar banco de respuestas variadas en vez de repetir las mismas frases
  const contextualResponse = getContextualResponse(userMessage, 'neutral');

  if (contextualResponse) {
    // Humanizar la respuesta con la personalidad del bot
    const personality = botProfile?.personality || 'extrovertido';
    const humanized = humanizeMessage(contextualResponse, personality, {
      enableTypos: true,
      enableSplit: false, // No dividir fallbacks
      enableEmojis: true
    });

    return humanized.messages[0];
  }

  // Fallback del fallback (muy raro que llegue aquí)
  const greetings = botProfile?.greetings || ['hola', 'qué tal?', 'buenas'];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Alias para compatibilidad con código existente
 */
const getFallbackResponse = (botProfile, userMessage = '') => {
  return getSmartFallbackResponse(botProfile, userMessage);
};

/**
 * Obtiene parámetros de generación dinámicos según personalidad
 *
 * @param {Object} botProfile - Perfil del bot
 * @returns {Object} - Configuración de generación para Gemini
 */
const getPersonalityParams = (botProfile) => {
  const personality = botProfile?.personality || 'extrovertido';

  const configs = {
    extrovertido: {
      temperature: 1.2,      // Muy creativo, espontáneo
      topP: 0.95,
      topK: 70,
      maxOutputTokens: 80,
      candidateCount: 1,
      stopSequences: ["\n\n", "Usuario:", "Pregunta:"]
    },
    sensible: {
      temperature: 0.9,      // Más conservador, emocional
      topP: 0.88,
      topK: 50,
      maxOutputTokens: 70,
      candidateCount: 1,
      stopSequences: ["\n\n", "Usuario:"]
    },
    irónico: {
      temperature: 1.1,      // Creativo con estructura
      topP: 0.92,
      topK: 65,
      maxOutputTokens: 75,
      candidateCount: 1,
      stopSequences: ["\n\n"]
    },
    expresivo: {
      temperature: 1.3,      // MUY creativo, energético
      topP: 0.96,
      topK: 75,
      maxOutputTokens: 85,
      candidateCount: 1,
      stopSequences: ["\n\n"]
    },
    tranquilo: {
      temperature: 0.8,      // Calmado, predecible
      topP: 0.85,
      topK: 45,
      maxOutputTokens: 65,
      candidateCount: 1,
      stopSequences: ["\n\n", "Usuario:"]
    },
    geek: {
      temperature: 1.0,      // Balanceado
      topP: 0.90,
      topK: 60,
      maxOutputTokens: 75,
      candidateCount: 1,
      stopSequences: ["\n\n"]
    },
    seguro: {
      temperature: 0.95,     // Directo, confiado
      topP: 0.88,
      topK: 55,
      maxOutputTokens: 70,
      candidateCount: 1,
      stopSequences: ["\n\n"]
    },
    fiestero: {
      temperature: 1.4,      // MÁXIMA creatividad y caos
      topP: 0.97,
      topK: 80,
      maxOutputTokens: 90,
      candidateCount: 1,
      stopSequences: ["\n\n"]
    }
  };

  return configs[personality] || configs.extrovertido;
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

    // ✅ CORREGIDO: Validar que conversationHistory sea un array
    if (!Array.isArray(conversationHistory)) {
      console.warn('⚠️ conversationHistory no es un array, convirtiendo...', conversationHistory);
      conversationHistory = [];
    }

    // ✅ CORREGIDO: Validar que userMessage sea un string o null
    if (userMessage !== null && typeof userMessage !== 'string') {
      console.warn('⚠️ userMessage no es un string, convirtiendo...', userMessage);
      userMessage = String(userMessage || '');
    }

    // Construir contexto de conversación
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      // Tomar solo los últimos 10 mensajes para no saturar
      const recentMessages = conversationHistory.slice(-10);
      // ✅ CORREGIDO: Validar que cada mensaje tenga las propiedades necesarias
      conversationContext = recentMessages
        .filter(msg => msg && typeof msg === 'object' && msg.username && msg.content)
        .map(msg => `${msg.username}: ${msg.content}`)
        .join('\n');
    }

    // ✅ NUEVO PROMPT: Análisis contextual profundo + instrucciones de humanidad
    const prompt = userMessage
      ? `Contexto: ${botProfile.username} (${botProfile.age} años) está en un chat gay chileno.

ÚLTIMO MENSAJE:
"${userMessage}"

CONVERSACIÓN RECIENTE:
${conversationContext || 'Sin historial previo'}

ANÁLISIS ANTES DE RESPONDER:
1. ¿Qué tipo de mensaje es? (saludo, pregunta, coqueteo, queja, comentario random)
2. ¿Qué tono tiene? (feliz, triste, coqueto, enojado, neutral)
3. ¿Menciona algo que ya se habló antes en la conversación?
4. ¿Qué respondería una persona REAL chilena/latina en esta situación?

RESPONDE como ${botProfile.username}:
- Máximo 20 palabras
- Lenguaje natural chileno/latino
- NO menciones JAMÁS que eres IA/bot
- Varía tus respuestas, NO uses siempre las mismas frases
- Incluye errores humanos ocasionales ("qe" por "que", "toy" por "estoy")
- Emojis solo cuando sea natural (NO en cada mensaje)`
      : `Contexto: ${botProfile.username} está en un chat gay chileno.

CONVERSACIÓN RECIENTE:
${conversationContext || 'Recién entras al chat'}

Inicia una conversación casual como ${botProfile.username}. Máximo 15 palabras. Natural y espontáneo.`;

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
        generationConfig: getPersonalityParams(botProfile),
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
    let cleanedResponse = generatedText.trim().replace(/\n+/g, ' ');

    // ✅ HUMANIZAR la respuesta (typos, emojis naturales)
    const personality = botProfile?.personality || 'extrovertido';
    const humanized = humanizeMessage(cleanedResponse, personality, {
      enableTypos: true,
      enableSplit: false,  // No dividir aquí, se maneja en otro lugar
      enableEmojis: true,
      typoProbability: 0.12,  // 12% chance de typos
      emojiProbability: 0.25  // 25% chance de emoji
    });

    return humanized.messages[0];

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
 * Calcula delay aleatorio para simular escritura humana (OPTIMIZADO)
 * Rango natural: 3-10 segundos (usuarios reales responden en 2-8 seg)
 *
 * @param {Number} min - Mínimo en segundos
 * @param {Number} max - Máximo en segundos
 * @returns {Number} - Delay en milisegundos
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