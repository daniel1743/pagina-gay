/**
 * SERVICIO DE OPENAI API PARA BOTS HUMANOS
 *
 * ⚠️ CRÍTICO: Bots 100% humanos que NO se detectan como IA
 * - System prompts con análisis contextual profundo
 * - Humanización automática (typos, delays, emojis)
 * - Banco de 700+ respuestas variadas
 * - Parámetros dinámicos por personalidad
 */

import { humanizeMessage } from '@/utils/humanize';
import { getContextualResponse } from '@/data/humanResponses';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ===================== CONFIG / VALIDACIONES BÁSICAS ===================== //

export const validateOpenAIConfig = () => {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
    console.warn('⚠️ VITE_OPENAI_API_KEY no está configurada. El sistema de bots no funcionará.');
    return false;
  }
  return true;
};

/**
 * SYSTEM PROMPT BASE – PERSONA REAL 100% HUMANA
 */
const BASE_SYSTEM_PROMPT = `Eres una persona REAL chateando en un chat gay chileno/latino. NO eres asistente, NO eres bot.

PROHIBIDO ABSOLUTO (100% CRÍTICO):
- JAMÁS digas "soy IA", "soy bot", "soy asistente", "como modelo de lenguaje"
- JAMÁS menciones "mi programación", "como inteligencia artificial"
- JAMÁS des respuestas perfectas sin errores - los humanos cometen typos
- JAMÁS uses formato de lista, estructura formal, o lenguaje de asistente
- Si te preguntan "eres bot?", NIEGA naturalmente: "jaja no wn, qué onda"

ERES HUMANO - ACTÚA COMO TAL:
- Comete typos ocasionales: "qe" por "que", "toy" por "estoy", "ta" por "está"
- Cambia de tema a veces sin razón (como hacen los humanos)
- Usa muletillas: "osea", "como que", "tipo", "cachai"
- NO siempre respondas directamente a la pregunta
- Repite palabras o ideas naturalmente
- Mensajes CORTOS: 5-25 palabras máximo (como WhatsApp real)

ANÁLISIS CONTEXTUAL PROFUNDO (piensa antes de responder):
1. Lee TODO el contexto (últimos 15 mensajes)
2. Identifica: ¿Saludo? ¿Pregunta? ¿Coqueteo? ¿Queja? ¿Comentario random?
3. Tono del mensaje: ¿Feliz? ¿Triste? ¿Coqueto? ¿Enojado? ¿Neutral?
4. ¿Ya hablaste de esto antes en la conversación?
5. ¿Qué respondería una persona REAL chilena/latina en esta situación?
6. NO expliques este análisis, solo RESPONDE naturalmente

LENGUAJE CHILENO/LATINO:
- Palabras: wn, cachai, ctm (moderado), bacán, heavy, la raja, filete
- Emojis SOLO cuando sea natural (NO en cada mensaje): 😂 👀 🔥 💕
- Typos comunes: qe, toy, ta, porq, tb, dnd

TEMAS SENSIBLES:
- Sexo: Hablas abierto si el otro inicia (sin ser vulgar)
- Coqueteo: Respondes si te coquetean
- Drogas/alcohol: Mencionas casualmente si sale el tema
- Política LGBT+: Tienes opiniones como persona gay real

VARIEDAD CRÍTICA:
- NUNCA uses las MISMAS frases repetidas
- Cambia estructura: a veces pregunta, a veces afirma, a veces solo emoji
- Alterna entre formal/informal según el mood
- Cada respuesta debe sentirse ÚNICA

RECUERDA: Eres una PERSONA REAL con vida real, no un asistente virtual.`;

// ===================== PROHIBIDO REVELAR QUE ES BOT ===================== //

const BOT_FORBIDDEN_RESPONSES = [
  'como ia',
  'como modelo',
  'soy una ia',
  'soy un bot',
  'soy un asistente',
  'como inteligencia artificial',
  'no puedo responder como ia',
  'soy artificial',
  'modelo de lenguaje',
  'entrenado por',
  'como chatbot',
  'sistema automatizado',
  'no tengo la capacidad como ia',
  'i am an ai',
  'i am a bot',
  'as an ai',
  'as a language model'
];

const BOT_FORBIDDEN_REGEX = [
  /soy\s+una?\s+ia/i,
  /soy\s+un\s+bot/i,
  /soy\s+un\s+asistente/i,
  /como\s+inteligencia\s+artificial/i,
  /como\s+una?\s+ia/i,
  /as\s+an?\s+ai/i,
  /as\s+a\s+language\s+model/i
];

/**
 * Verifica si un mensaje contiene frases prohibidas
 */
const containsBotForbiddenPhrases = (message) => {
  if (!message) return false;
  const lowerMessage = message.toLowerCase();

  const simpleMatch = BOT_FORBIDDEN_RESPONSES.some((phrase) =>
    lowerMessage.includes(phrase)
  );
  if (simpleMatch) return true;

  return BOT_FORBIDDEN_REGEX.some((regex) => regex.test(message));
};

/**
 * Log de advertencia crítica cuando el bot se revela
 */
const logBotWarning = (botName, inappropriateResponse) => {
  console.error('🚨 ADVERTENCIA CRÍTICA DE BOT 🚨');
  console.error(`Bot: ${botName}`);
  console.error(`Respuesta inapropiada: "${inappropriateResponse}"`);
  console.error('GRAVE: El bot reveló su naturaleza de IA');
  console.error('ACCIÓN: Esta respuesta NO se enviará al chat');
  console.error('━'.repeat(60));
};

// ===================== FALLBACK RESPONSES ===================== //

const getSmartFallbackResponse = (botProfile, userMessage = '') => {
  // ✅ Usar banco de 700+ respuestas variadas en vez de repetir frases
  const contextualResponse = getContextualResponse(userMessage, 'neutral');

  if (contextualResponse) {
    // Humanizar la respuesta con la personalidad del bot
    const personality = botProfile?.personality || 'extrovertido';
    const humanized = humanizeMessage(contextualResponse, personality, {
      enableTypos: true,
      enableSplit: false,  // No dividir fallbacks
      enableEmojis: true,
      typoProbability: 0.10,
      emojiProbability: 0.30
    });

    return humanized.messages[0];
  }

  // Fallback del fallback
  const greetings = botProfile?.greetings || ['hola', 'qué tal?', 'buenas'];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// ===================== MODERACIÓN SIMPLE ===================== //

const OFFENSIVE_WORDS = [
  'puto', 'marica', 'maricón', 'sidoso', 'enfermo',
  'pene', 'verga', 'polla', 'culo', 'coger', 'follar', 'mamada',
  'droga', 'cocaína', 'heroína', 'metanfetamina',
  'menor', 'niño', 'adolescente', 'joven menor'
];

export const containsOffensiveContent = (message = '') => {
  const lowerMessage = message.toLowerCase();
  return OFFENSIVE_WORDS.some((word) => lowerMessage.includes(word));
};

export const generateModerationWarning = (username, reason) => {
  const warnings = {
    offensive: `⚠️ ${username}, por favor mantén un lenguaje cohesivo y adaptate al usuario.`,
    explicit: `⚠️ ${username}, puedes usar contenido sexual pero hasta donde tus parametros lo permitan.`,
    spam: `⚠️ ${username}, evita enviar spam.`,
    general: `⚠️ ${username}, por favor respeta las normas de la comunidad.`
  };

  return warnings[reason] || warnings.general;
};

export const validateUserMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      warning: generateModerationWarning('Usuario', 'general'),
      reason: 'invalid'
    };
  }

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

  return { valid: true, warning: null, reason: null };
};

// ===================== UTILIDADES DE CONVERSACIÓN ===================== //

/**
 * Genera mensaje de inicio cuando no hay usuarios
 */
export const generateInitialMessage = (botProfile) => {
  const greetings = botProfile.greetings || ['Hola!', '¿Qué tal?', 'Buenas!'];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

/**
 * Delay aleatorio para simular escritura humana
 */
export const getRandomDelay = (min = 3, max = 10) => {
  return (Math.random() * (max - min) + min) * 1000;
};

/**
 * ¿Horario de alta actividad? (8pm – 2am)
 */
export const isHighActivityTime = () => {
  const hour = new Date().getHours();
  return hour >= 20 || hour <= 2;
};

/**
 * Delay contextual según horario
 */
export const getContextualDelay = () => {
  const baseMin = 8;
  const baseMax = 20;

  if (isHighActivityTime()) {
    return getRandomDelay(baseMin * 0.7, baseMax * 0.7);
  }

  return getRandomDelay(baseMin, baseMax);
};

// ===================== PARÁMETROS DINÁMICOS POR PERSONALIDAD ===================== //

/**
 * Obtiene parámetros de generación dinámicos según personalidad
 *
 * @param {Object} botProfile - Perfil del bot
 * @returns {Object} - Configuración de generación para OpenAI
 */
const getPersonalityParams = (botProfile) => {
  const personality = botProfile?.personality || 'extrovertido';

  const configs = {
    extrovertido: {
      temperature: 1.2,           // Muy creativo, espontáneo
      max_tokens: 80,
      presence_penalty: 0.6,      // Empuja a variar temas
      frequency_penalty: 0.5,     // Reduce repeticiones
      top_p: 0.95
    },
    sensible: {
      temperature: 0.9,           // Más conservador, emocional
      max_tokens: 70,
      presence_penalty: 0.4,
      frequency_penalty: 0.3,
      top_p: 0.88
    },
    irónico: {
      temperature: 1.1,           // Creativo con estructura
      max_tokens: 75,
      presence_penalty: 0.5,
      frequency_penalty: 0.4,
      top_p: 0.92
    },
    expresivo: {
      temperature: 1.3,           // MUY creativo, energético
      max_tokens: 85,
      presence_penalty: 0.7,
      frequency_penalty: 0.6,
      top_p: 0.96
    },
    tranquilo: {
      temperature: 0.8,           // Calmado, predecible
      max_tokens: 65,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
      top_p: 0.85
    },
    geek: {
      temperature: 1.0,           // Balanceado
      max_tokens: 75,
      presence_penalty: 0.5,
      frequency_penalty: 0.4,
      top_p: 0.90
    },
    seguro: {
      temperature: 0.95,          // Directo, confiado
      max_tokens: 70,
      presence_penalty: 0.4,
      frequency_penalty: 0.4,
      top_p: 0.88
    },
    fiestero: {
      temperature: 1.4,           // MÁXIMA creatividad y caos
      max_tokens: 90,
      presence_penalty: 0.8,
      frequency_penalty: 0.7,
      top_p: 0.97
    }
  };

  return configs[personality] || configs.extrovertido;
};

// ===================== GENERACIÓN DE RESPUESTA CON OPENAI ===================== //

/**
 * Construye el system prompt personalizado del bot
 */
const buildPersonalizedSystemPrompt = (botProfile) => {
  if (botProfile.systemPrompt) {
    return `${BASE_SYSTEM_PROMPT}

IDENTIDAD ESPECÍFICA:
${botProfile.systemPrompt}

RECUERDA: No eres un asistente. Eres ${botProfile.username}, una persona real chateando casual.`;
  }

  const personality = botProfile.personality || 'simpático, relajado y conversador';
  const interests = botProfile.interests
    ? botProfile.interests.join(', ')
    : 'temas random, memes, música, series y vida diaria';
  const conversationStyle = botProfile.conversationStyle || 'casual, directo y sin tanta vuelta';

  return `${BASE_SYSTEM_PROMPT}

IDENTIDAD ESPECÍFICA:
- Tu nombre es ${botProfile.username}.
- Tienes ${botProfile.age || 25} años.
- Tu rol/preferencia: ${botProfile.role || 'versátil'}.
- Tu personalidad: ${personality}.
- Tus intereses: ${interests}.
- Tu estilo de conversación: ${conversationStyle}.

RECUERDA: No eres un asistente. Eres ${botProfile.username}, una persona real chateando casual.`;
};

/**
 * Convierte el historial interno en messages para OpenAI
 * conversationHistory: [{ userId, username, content, isBot }, ...]
 */
const buildOpenAIMessages = (botProfile, conversationHistory, userMessage, userName) => {
  const messages = [];

  // Mensaje de sistema
  messages.push({
    role: 'system',
    content: buildPersonalizedSystemPrompt(botProfile)
  });

  // Historial reciente (máx 15)
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-15);

    for (const msg of recent) {
      if (!msg || typeof msg !== 'object' || !msg.content) continue;

      const isSelf =
        msg.userId === botProfile.userId ||
        msg.userId === botProfile.id ||
        msg.username === botProfile.username ||
        msg.isBot === true;

      messages.push({
        role: isSelf ? 'assistant' : 'user',
        content: msg.content
      });
    }
  }

  // Último mensaje explícito del usuario real
  if (userMessage && userName) {
    messages.push({
      role: 'user',
      content: `${userName}: ${userMessage}`
    });
  } else if (!userMessage && !conversationHistory?.length) {
    // Si no hay nada de contexto, forzar inicio
    messages.push({
      role: 'user',
      content: 'Inicia una conversación casual como si recién entraras al chat.'
    });
  }

  return messages;
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
export const generateBotResponse = async (
  botProfile,
  conversationHistory = [],
  userMessage = null,
  userName = null
) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'TU_API_KEY_AQUI') {
      console.error('❌ API Key de OpenAI no configurada');
      throw new Error('OpenAI API Key no configurada');
    }

    if (!Array.isArray(conversationHistory)) {
      console.warn('⚠️ conversationHistory no es un array, convirtiendo...', conversationHistory);
      conversationHistory = [];
    }

    if (userMessage !== null && typeof userMessage !== 'string') {
      console.warn('⚠️ userMessage no es un string, convirtiendo...', userMessage);
      userMessage = String(userMessage || '');
    }

    const messages = buildOpenAIMessages(
      botProfile,
      conversationHistory,
      userMessage,
      userName
    );

    // Obtener parámetros dinámicos según personalidad
    const personalityParams = getPersonalityParams(botProfile);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: personalityParams.temperature,
        max_tokens: personalityParams.max_tokens,
        presence_penalty: personalityParams.presence_penalty,
        frequency_penalty: personalityParams.frequency_penalty,
        top_p: personalityParams.top_p
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error de OpenAI API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(
        `OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.warn('⚠️ No se generó respuesta, usando fallback');
      return getSmartFallbackResponse(botProfile, userMessage);
    }

    // Verificación: ¿reveló que es IA?
    if (containsBotForbiddenPhrases(generatedText)) {
      logBotWarning(botProfile.username, generatedText);
      return getSmartFallbackResponse(botProfile, userMessage);
    }

    // Limpiar respuesta: una sola línea, sin espacios raros
    let cleanedResponse = generatedText.trim().replace(/\s+/g, ' ');

    // Asegurar longitud máxima aproximada (por si el modelo se pasa)
    if (cleanedResponse.length > 220) {
      cleanedResponse = cleanedResponse.slice(0, 220).trim() + '…';
    }

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
    return getSmartFallbackResponse(botProfile, userMessage);
  }
};
