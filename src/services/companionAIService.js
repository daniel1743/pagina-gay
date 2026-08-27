/**
 * Ayuda local de conversación para el widget transparente de Chactivo.
 *
 * No representa a una persona, no publica mensajes en salas y no envía contenido
 * a proveedores externos. Las sugerencias se calculan en el navegador y solo
 * aparecen cuando el usuario abre o acepta la ayuda.
 */

const LOCAL_MESSAGES = {
  firstMessageHelp: 'Si quieres, puedo sugerirte un primer mensaje.',
  passiveReader: 'Puedes participar cuando quieras; también puedo darte una idea para empezar.',
  generalHelp: 'Puedo ayudarte a romper el hielo o explicarte cómo funciona esta sala.',
};

const DEFAULT_SUGGESTIONS = [
  'Hola, ¿qué onda?',
  '¿Alguien quiere conversar?',
  '¿De qué comuna son?',
];

const SUGGESTIONS_BY_TONE = {
  meetup: [
    '¿Alguien conversa desde Santiago?',
    '¿Qué planes tienen para hoy?',
    '¿Alguien recomienda un panorama?',
  ],
  friendly: [
    'Hola, ¿cómo están?',
    '¿Qué tal va su día?',
    '¿Alguien quiere conversar?',
  ],
  sexual: [
    '¿Qué buscan hoy?',
    '¿Alguien quiere conversar con respeto?',
    '¿De qué comuna son?',
  ],
};

/**
 * Produce ayuda breve y determinista; nunca llama a una API remota.
 */
export const generateCompanionMessage = async (scenario, context = {}) => {
  if (scenario === 'suggestFirstMessage') {
    const suggestions = SUGGESTIONS_BY_TONE[context.roomTone] || DEFAULT_SUGGESTIONS;
    return suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n');
  }

  return LOCAL_MESSAGES[scenario] || '¿En qué puedo ayudarte?';
};

/**
 * Resume mensajes recientes solo para el cálculo local de sugerencias.
 * Se excluyen mensajes de sistema y remitentes automatizados.
 */
export const analyzeRecentMessages = (messages = [], count = 5) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'No hay mensajes aún en esta sala.';
  }

  const realMessages = messages.filter((msg) => (
    msg?.type === 'text' &&
    msg.userId !== 'system' &&
    !String(msg.userId || '').startsWith('bot_') &&
    !String(msg.userId || '').startsWith('static_bot_') &&
    !String(msg.userId || '').startsWith('seed_user_')
  ));

  return realMessages
    .slice(-count)
    .map((msg) => `${msg.username || 'Usuario'}: ${msg.content || ''}`)
    .join('\n');
};

/**
 * Detecta de forma aproximada el tono de los mensajes, sin enviar el contenido
 * fuera del navegador y sin generar actividad artificial.
 */
export const detectRoomTone = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) return 'neutral';

  const allText = messages
    .slice(-10)
    .map((message) => String(message?.content || '').toLowerCase())
    .join(' ');

  const sexualKeywords = ['verga', 'culiar', 'coger', 'follar', 'caliente', 'hot', 'pico', 'culo'];
  const friendlyKeywords = ['hola', 'qué onda', 'cómo están', 'buena', 'amigo', 'wn'];
  const locationKeywords = ['santiago', 'provi', 'maipu', 'viña', 'valpo', 'stgo'];

  const sexualCount = sexualKeywords.filter((word) => allText.includes(word)).length;
  const friendlyCount = friendlyKeywords.filter((word) => allText.includes(word)).length;
  const locationCount = locationKeywords.filter((word) => allText.includes(word)).length;

  if (sexualCount > 3) return 'sexual';
  if (locationCount > 2) return 'meetup';
  if (friendlyCount > 2) return 'friendly';
  return 'casual';
};

/**
 * El widget puede ofrecerse a visitantes o cuentas invitadas, pero nunca habla
 * por ellos ni se muestra como otra persona.
 */
export const shouldShowCompanion = (user) => {
  if (!user) return true;
  return Boolean(user.isGuest || user.isAnonymous || !user.id);
};

export const getLocalSuggestionsForTone = (tone) => (
  SUGGESTIONS_BY_TONE[tone] || DEFAULT_SUGGESTIONS
);
