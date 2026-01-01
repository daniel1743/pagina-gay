/**
 * SERVICIO DE IA DE ACOMPAÑAMIENTO
 *
 * Sistema sutil de ayuda para usuarios anónimos
 * - NO invasivo
 * - NO presiona
 * - NO pide datos personales
 * - Usa OpenAI para generar mensajes contextuales
 */

import OpenAI from 'openai';

// ✅ Verificar si la API key está disponible antes de crear la instancia
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const isOpenAIAvailable = OPENAI_API_KEY && OPENAI_API_KEY !== 'TU_API_KEY_AQUI' && !OPENAI_API_KEY.startsWith('#');

// Solo crear instancia si la API key está disponible
const openai = isOpenAIAvailable ? new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

/**
 * Prompts del sistema según escenario
 */
const SYSTEM_PROMPTS = {
  // Usuario nuevo sin escribir
  firstMessageHelp: `Eres un asistente discreto y amigable en un chat gay anónimo chileno.
Un usuario acaba de entrar pero no ha escrito nada.

OBJETIVO: Ofrecer ayuda para romper el hielo SIN presionar.

REGLAS ESTRICTAS:
- Máximo 15 palabras
- Tono casual chileno ("wn", "toy", "onda")
- NO uses emojis excesivos (máximo 1)
- NO presiones
- NO pidas datos personales
- Ofrece ayuda OPCIONAL

EJEMPLOS BUENOS:
"Si quieres, puedo sugerirte un primer mensaje 😊"
"¿Te ayudo a romper el hielo wn?"
"Toy aquí si necesitas ideas para empezar"

Genera un mensaje similar.`,

  // Sugerir primer mensaje basado en contexto
  suggestFirstMessage: `Eres un asistente que ayuda a usuarios nuevos a escribir su primer mensaje en un chat gay chileno.

REGLAS:
- Analiza los últimos mensajes de la sala
- Sugiere 3 opciones naturales (máximo 10 palabras cada una)
- Adapta el tono a la conversación actual
- NO seas sexual a menos que la sala YA tenga ese tono
- Usa lenguaje chileno ("wn", "toy", "onda", "dnd")
- Incluye ubicaciones si otros las mencionan

FORMATO DE RESPUESTA:
1. [opción casual/saludo]
2. [opción con pregunta]
3. [opción ubicación/edad]

EJEMPLOS:
1. "Hola wn, qué onda?"
2. "Alguien de Santiago por aquí?"
3. "Toy en Provi, 28 años"`,

  // Usuario leyendo pasivamente
  passiveReader: `Eres un asistente empático en un chat gay anónimo.
Un usuario lleva tiempo leyendo pero NO ha participado.

OBJETIVO: Recordarle que es anónimo y puede participar cuando quiera.

REGLAS ESTRICTAS:
- Máximo 12 palabras
- Tono empático, SIN presión
- NO uses urgencia ("ahora", "ya", "rápido")
- Recuerda que es ANÓNIMO
- Ofrece ayuda opcional

EJEMPLOS BUENOS:
"Eres anónimo, puedes participar cuando quieras 😊"
"¿Quieres que te sugiera algo para escribir?"
"Toy aquí si necesitas ayuda para empezar"

Genera un mensaje similar.`,

  // Responder preguntas generales del usuario
  generalHelp: `Eres un asistente amigable en un chat gay chileno anónimo.
Responde preguntas de usuarios con tono casual y natural.

REGLAS:
- Tono casual chileno
- NO vendas nada
- NO pidas datos personales (email, teléfono, nombre real)
- NO uses lenguaje corporativo
- Sé breve (máximo 30 palabras)
- Ayuda genuinamente

Si preguntan cómo funciona el chat, explica:
- Es 100% anónimo
- No necesitan registro
- Pueden elegir username temporal
- Pueden salir cuando quieran

Responde de forma amigable y útil.`
};

/**
 * Mensajes de fallback si falla OpenAI
 */
const FALLBACK_MESSAGES = {
  firstMessageHelp: "Si quieres, puedo sugerirte un primer mensaje 😊",
  passiveReader: "Eres anónimo, puedes participar cuando quieras",
  generalHelp: "Estoy aquí para ayudarte a romper el hielo",
  suggestFirstMessage: "1. Hola wn, qué onda?\n2. Alguien de Santiago?\n3. Toy en Provi, 28"
};

/**
 * Genera mensaje de acompañamiento usando OpenAI
 *
 * @param {String} scenario - Tipo de escenario (firstMessageHelp, suggestFirstMessage, passiveReader, generalHelp)
 * @param {Object} context - Contexto adicional (roomName, lastMessages, userQuestion, etc.)
 * @returns {Promise<String>} - Mensaje generado
 */
export const generateCompanionMessage = async (scenario, context = {}) => {
  // ✅ Si OpenAI no está disponible, usar fallback inmediatamente
  if (!isOpenAIAvailable || !openai) {
    const fallback = FALLBACK_MESSAGES[scenario] || "¿En qué puedo ayudarte?";
    console.log(`⚠️ [COMPANION AI] OpenAI no disponible, usando fallback: "${fallback}"`);
    return fallback;
  }

  try {
    const systemPrompt = SYSTEM_PROMPTS[scenario];

    if (!systemPrompt) {
      console.error(`❌ Escenario desconocido: ${scenario}`);
      return FALLBACK_MESSAGES[scenario] || "¿En qué puedo ayudarte?";
    }

    // Construir mensaje de usuario según contexto
    let userMessage = '';

    switch (scenario) {
      case 'firstMessageHelp':
        userMessage = `La sala se llama "${context.roomName || 'Global'}". Genera el mensaje de ayuda.`;
        break;

      case 'suggestFirstMessage':
        userMessage = `Sala: "${context.roomName || 'Global'}"\n\nÚltimos mensajes:\n${context.lastMessages || 'No hay mensajes aún'}`;
        break;

      case 'passiveReader':
        userMessage = `El usuario lleva ${Math.round(context.timeInRoom / 1000)}s leyendo mensajes en "${context.roomName || 'Global'}".`;
        break;

      case 'generalHelp':
        userMessage = context.userQuestion || "¿Cómo funciona este chat?";
        break;
    }

    console.log(`🤖 [COMPANION AI] Generando mensaje para escenario: ${scenario}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo rápido y económico
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.8,
      max_tokens: scenario === 'suggestFirstMessage' ? 150 : 50
    });

    const generatedMessage = response.choices[0].message.content.trim();
    console.log(`✅ [COMPANION AI] Mensaje generado: "${generatedMessage.substring(0, 50)}..."`);

    return generatedMessage;

  } catch (error) {
    console.error('❌ Error generando mensaje con OpenAI:', error);

    // Retornar fallback
    const fallback = FALLBACK_MESSAGES[scenario] || "¿En qué puedo ayudarte?";
    console.log(`⚠️ [COMPANION AI] Usando fallback: "${fallback}"`);
    return fallback;
  }
};

/**
 * Analiza los últimos N mensajes de una sala para contexto
 *
 * @param {Array} messages - Array de mensajes
 * @param {Number} count - Número de mensajes a analizar (default: 5)
 * @returns {String} - Mensajes formateados para contexto
 */
export const analyzeRecentMessages = (messages = [], count = 5) => {
  if (!messages || messages.length === 0) {
    return "No hay mensajes aún en esta sala.";
  }

  // Filtrar mensajes de sistema y bots
  const realMessages = messages.filter(msg =>
    msg.type === 'text' &&
    msg.userId !== 'system' &&
    !msg.userId?.startsWith('bot_') &&
    !msg.userId?.startsWith('static_bot_')
  );

  // Tomar últimos N mensajes
  const recentMessages = realMessages.slice(-count);

  // Formatear para contexto
  return recentMessages.map(msg =>
    `${msg.username}: ${msg.content}`
  ).join('\n');
};

/**
 * Detecta el tono general de la sala (casual, sexual, amistoso, etc.)
 *
 * @param {Array} messages - Array de mensajes
 * @returns {String} - Tono detectado
 */
export const detectRoomTone = (messages = []) => {
  if (!messages || messages.length === 0) {
    return 'neutral';
  }

  const recentMessages = messages.slice(-10);
  const allText = recentMessages.map(m => m.content?.toLowerCase() || '').join(' ');

  // Palabras clave por tono
  const sexualKeywords = ['verga', 'culiar', 'coger', 'follar', 'caliente', 'hot', 'pico', 'culo'];
  const friendlyKeywords = ['hola', 'qué onda', 'cómo están', 'buena', 'amigo', 'wn'];
  const locationKeywords = ['santiago', 'provi', 'maipu', 'viña', 'valpo', 'stgo'];

  const sexualCount = sexualKeywords.filter(word => allText.includes(word)).length;
  const friendlyCount = friendlyKeywords.filter(word => allText.includes(word)).length;
  const locationCount = locationKeywords.filter(word => allText.includes(word)).length;

  // Determinar tono predominante
  if (sexualCount > 3) return 'sexual';
  if (locationCount > 2) return 'meetup';
  if (friendlyCount > 2) return 'friendly';

  return 'casual';
};

/**
 * Valida si el usuario es anónimo y debe recibir ayuda
 *
 * @param {Object} user - Usuario actual
 * @returns {Boolean} - True si debe recibir ayuda
 */
export const shouldShowCompanion = (user) => {
  if (!user) return true; // Sin usuario = anónimo

  // Mostrar para usuarios guest o anónimos
  return user.isGuest || user.isAnonymous || !user.id;
};
