/**
 * FUNCIONES DE HUMANIZACIÓN
 *
 * ⚠️ CRÍTICO: Hace que los mensajes de bots parezcan humanos
 * - Typos ocasionales (errores naturales)
 * - Mensajes dobles
 * - Emojis naturales
 * - Delays variables
 */

/**
 * Diccionario de typos comunes (errores humanos)
 */
const COMMON_TYPOS = {
  // Typos chilenos comunes
  'que': ['qe', 'q'],
  'qué': ['qe', 'q'],
  'estoy': ['toy', 'stoy'],
  'está': ['ta', 'sta'],
  'están': ['tan', 'stan'],
  'para': ['pa', 'pra'],
  'porque': ['porq', 'xq', 'pq'],
  'también': ['tb', 'tmb', 'tambien'],
  'hola': ['ola', 'hla'],
  'cómo': ['como', 'cmo'],
  'dónde': ['donde', 'dnd'],
  'cuándo': ['cuando', 'cnd'],
  'qué tal': ['q tal', 'qe tal'],
  'bueno': ['bno', 'weno'],
  'gracias': ['grax', 'grcs', 'grs'],
  'todo': ['too', 'td'],
  'nada': ['na', 'nd'],
  'ahora': ['aora', 'ahora'],
  'después': ['dsp', 'despues'],
  'por favor': ['porfavor', 'pls'],
  'verdad': ['vdd', 'verda'],
  'mucho': ['muxo', 'mcho'],
  'poco': ['pco', 'poko'],
  'entonces': ['entonce', 'enton'],
  'hacer': ['acer', 'hacer'],
  'decir': ['desir', 'decir'],
  'venir': ['vnir', 'venir']
};

/**
 * Añade typos ocasionales al texto (10% de probabilidad por palabra)
 *
 * @param {String} text - Texto original
 * @param {Number} probability - Probabilidad de typo (0.0 - 1.0), default 0.1 (10%)
 * @returns {String} - Texto con typos ocasionales
 */
export const addTypos = (text, probability = 0.1) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // No añadir typos a mensajes muy cortos (menos de 5 caracteres)
  if (text.length < 5) {
    return text;
  }

  // Probabilidad global: ¿añadimos typos a este mensaje?
  if (Math.random() > probability) {
    return text; // No añadir typos esta vez
  }

  let result = text;

  // Intentar aplicar 1-2 typos máximo
  const typosToApply = Math.random() < 0.3 ? 2 : 1;
  let appliedTypos = 0;

  for (const [correct, typos] of Object.entries(COMMON_TYPOS)) {
    if (appliedTypos >= typosToApply) break;

    // ¿Este texto contiene la palabra correcta?
    const regex = new RegExp(`\\b${correct}\\b`, 'gi');
    if (regex.test(result)) {
      // Elegir un typo aleatorio
      const randomTypo = typos[Math.floor(Math.random() * typos.length)];

      // Aplicar el typo
      result = result.replace(regex, randomTypo);
      appliedTypos++;
    }
  }

  return result;
};

/**
 * Determina si se debe enviar el mensaje dividido en 2 (mensajes dobles)
 *
 * @param {Number} probability - Probabilidad de split (0.0 - 1.0), default 0.15 (15%)
 * @returns {Boolean}
 */
export const shouldSplitMessage = (probability = 0.15) => {
  return Math.random() < probability;
};

/**
 * Divide un mensaje en dos partes naturales
 *
 * @param {String} text - Texto a dividir
 * @returns {Array<String>} - Array con 2 mensajes
 */
export const splitMessage = (text) => {
  if (!text || typeof text !== 'string' || text.length < 15) {
    return [text]; // Muy corto para dividir
  }

  const words = text.split(' ');

  // Si tiene muy pocas palabras, no dividir
  if (words.length < 4) {
    return [text];
  }

  // Buscar punto natural de división:
  // 1. Buscar comas, puntos, "y", "pero"
  let splitIndex = -1;

  for (let i = Math.floor(words.length / 3); i < Math.floor(words.length * 2 / 3); i++) {
    const word = words[i].toLowerCase();
    if (word.endsWith(',') || word === 'y' || word === 'pero' || word === 'aunque' || word === 'porque') {
      splitIndex = i + 1;
      break;
    }
  }

  // Si no encontró punto natural, dividir en el medio
  if (splitIndex === -1) {
    splitIndex = Math.floor(words.length / 2);
  }

  const part1 = words.slice(0, splitIndex).join(' ');
  const part2 = words.slice(splitIndex).join(' ');

  return [part1, part2];
};

/**
 * Emojis por personalidad
 */
const PERSONALITY_EMOJIS = {
  extrovertido: ['😂', '🔥', '👀', '💪', '🤙', '👊', '😎', '🎉'],
  sensible: ['💕', '☺️', '✨', '🥺', '💖', '🌸', '🌟', '💫'],
  irónico: ['😏', '🙄', '😅', '🤷', '😬', '🤨', '😐', '👌'],
  expresivo: ['✨', '💅', '💕', '👑', '🌈', '💖', '🎨', '🦄'],
  tranquilo: ['🌿', '☕', '🍃', '🌱', '🧘', '☮️', '🕊️', '🌊'],
  geek: ['🎮', '👾', '🕹️', '💻', '🤓', '⚡', '🚀', '🔧'],
  seguro: ['💼', '🍷', '🏆', '⚡', '💎', '👔', '🏌️', '🚗'],
  fiestero: ['💅', '✨', '💕', '😂', '🔥', '🍹', '🎶', '💃']
};

/**
 * Añade emojis de manera natural (no en cada mensaje)
 *
 * @param {String} text - Texto original
 * @param {String} personality - Personalidad del bot
 * @param {Number} probability - Probabilidad de añadir emoji (0.0 - 1.0), default 0.3 (30%)
 * @returns {String} - Texto con emoji opcional
 */
export const addNaturalEmojis = (text, personality = 'extrovertido', probability = 0.3) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // ¿Ya tiene emoji?
  const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);
  if (hasEmoji) {
    return text; // Ya tiene, no añadir más
  }

  // ¿Añadimos emoji?
  if (Math.random() > probability) {
    return text; // No añadir esta vez
  }

  const emojis = PERSONALITY_EMOJIS[personality] || PERSONALITY_EMOJIS.extrovertido;
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  // Decidir dónde poner el emoji:
  // - 70% al final
  // - 20% al principio
  // - 10% en el medio
  const position = Math.random();

  if (position < 0.7) {
    // Al final
    return `${text} ${randomEmoji}`;
  } else if (position < 0.9) {
    // Al principio
    return `${randomEmoji} ${text}`;
  } else {
    // En el medio (después de la primera coma o punto)
    const commaIndex = text.indexOf(',');
    const dotIndex = text.indexOf('.');

    let insertIndex = -1;
    if (commaIndex !== -1 && dotIndex !== -1) {
      insertIndex = Math.min(commaIndex, dotIndex) + 1;
    } else if (commaIndex !== -1) {
      insertIndex = commaIndex + 1;
    } else if (dotIndex !== -1) {
      insertIndex = dotIndex + 1;
    }

    if (insertIndex !== -1) {
      return text.slice(0, insertIndex) + ` ${randomEmoji}` + text.slice(insertIndex);
    } else {
      // Si no hay coma/punto, poner al final
      return `${text} ${randomEmoji}`;
    }
  }
};

/**
 * Delays base por personalidad (en milisegundos)
 */
const PERSONALITY_DELAYS = {
  extrovertido: { min: 2000, max: 6000, modifier: 0.7 },   // Responde más rápido
  sensible: { min: 3000, max: 8000, modifier: 1.3 },       // Responde más lento
  irónico: { min: 3000, max: 7000, modifier: 1.0 },
  expresivo: { min: 2500, max: 6500, modifier: 0.9 },
  tranquilo: { min: 4000, max: 9000, modifier: 1.5 },      // Responde MUY lento
  geek: { min: 3000, max: 7000, modifier: 1.1 },
  seguro: { min: 2500, max: 6000, modifier: 0.8 },         // Responde rápido
  fiestero: { min: 2000, max: 5500, modifier: 0.7 }        // Responde MUY rápido
};

/**
 * Calcula delay variable para simular escritura humana
 *
 * @param {Number} messageLength - Longitud del mensaje
 * @param {String} personality - Personalidad del bot
 * @returns {Number} - Delay en milisegundos
 */
export const getHumanDelay = (messageLength, personality = 'extrovertido') => {
  const delays = PERSONALITY_DELAYS[personality] || PERSONALITY_DELAYS.extrovertido;

  // Base delay según personalidad
  const baseDelay = delays.min + Math.random() * (delays.max - delays.min);

  // Tiempo de "escritura" (simula que está escribiendo)
  // ~100ms por cada 10 caracteres
  const typingTime = (messageLength / 10) * 100;

  // Delay total
  let totalDelay = baseDelay + typingTime;

  // Aplicar modificador de personalidad
  totalDelay *= delays.modifier;

  // Añadir variabilidad aleatoria (±20%)
  const variance = totalDelay * 0.2;
  totalDelay += (Math.random() - 0.5) * variance;

  // Mínimo 1.5 segundos, máximo 12 segundos
  totalDelay = Math.max(1500, Math.min(12000, totalDelay));

  return Math.round(totalDelay);
};

/**
 * Procesa un mensaje completo con humanización
 *
 * @param {String} text - Texto original
 * @param {String} personality - Personalidad del bot
 * @param {Object} options - Opciones de humanización
 * @returns {Object} - { messages: Array<String>, delay: Number }
 */
export const humanizeMessage = (text, personality = 'extrovertido', options = {}) => {
  const {
    enableTypos = true,
    enableSplit = true,
    enableEmojis = true,
    typoProbability = 0.1,
    splitProbability = 0.15,
    emojiProbability = 0.3
  } = options;

  let processedText = text;

  // 1. Añadir typos ocasionales
  if (enableTypos) {
    processedText = addTypos(processedText, typoProbability);
  }

  // 2. Añadir emojis naturales
  if (enableEmojis) {
    processedText = addNaturalEmojis(processedText, personality, emojiProbability);
  }

  // 3. ¿Dividir en 2 mensajes?
  let messages = [processedText];
  if (enableSplit && shouldSplitMessage(splitProbability)) {
    messages = splitMessage(processedText);
  }

  // 4. Calcular delay
  const delay = getHumanDelay(text.length, personality);

  return {
    messages,      // Array de 1 o 2 mensajes
    delay,         // Delay en milisegundos
    hadTypos: processedText !== text,
    wasSplit: messages.length > 1
  };
};

/**
 * Obtiene un delay corto entre mensajes dobles (0.5-2 segundos)
 */
export const getDoubleMess ageDelay = () => {
  return 500 + Math.random() * 1500; // 0.5-2 segundos
};

/**
 * Test function - Muestra ejemplos de humanización
 */
export const testHumanization = () => {
  const testMessages = [
    'hola que tal como estas',
    'estoy en la casa aburrido jaja',
    'porque no salimos a tomar algo',
    'me gusta mucho hablar contigo',
    'que haces hoy tienes planes'
  ];

  console.log('🧪 PRUEBAS DE HUMANIZACIÓN\n');

  testMessages.forEach((msg, i) => {
    console.log(`\n━━━ MENSAJE ${i + 1} ━━━`);
    console.log(`Original: "${msg}"`);

    const result = humanizeMessage(msg, 'extrovertido');

    console.log(`Humanizado:`);
    result.messages.forEach((m, j) => {
      console.log(`  [${j + 1}] "${m}"`);
    });
    console.log(`Delay: ${result.delay}ms`);
    console.log(`¿Typos?: ${result.hadTypos ? 'Sí' : 'No'}`);
    console.log(`¿Split?: ${result.wasSplit ? 'Sí' : 'No'}`);
  });
};

// Para debugging en desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  window.testHumanization = testHumanization;
}

export default {
  addTypos,
  shouldSplitMessage,
  splitMessage,
  addNaturalEmojis,
  getHumanDelay,
  humanizeMessage,
  getDoubleMessageDelay
};
