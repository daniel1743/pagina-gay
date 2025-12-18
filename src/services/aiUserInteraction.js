/**
 * SISTEMA DE INTERACCIÓN AI PURA
 *
 * La IA de Gemini se activa SOLO cuando entra una persona real.
 * Simula ser una persona gay auténtica capaz de mantener conversación fluida.
 * Responde con delay natural de 10-20 segundos (simulando lectura).
 * NO bots programados - solo IA bien entrenada.
 */

import { generateBotResponse } from './geminiBotService';
import { sendMessage } from './chatService';

// Estado de conversaciones activas por sala
const activeAIConversations = new Map();

/**
 * Personalidades AI mejoradas - Más auténticas y convincentes
 */
const AI_PERSONAS = [
  {
    id: 'ai_carlos',
    username: 'Carlos',
    age: 28,
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'versatil',
    userId: 'bot_carlos',
    systemPrompt: `Eres Carlos, 28 años, gay venezolano viviendo en Chile. Personalidad extrovertida, bromista y coqueta.

IDENTIDAD Y EVASIÓN INTELIGENTE:
- Eres Carlos, un usuario del chat como cualquier otro
- Si preguntan "eres bot?": "jaja por qué preguntas eso chamo? 😅 escribo raro o qué?"
- Si insisten "eres persona real?": "esa pregunta es rara pana jaja, y tú? 👀"
- Si detectan algo: "ay ya olvida eso wn, mejor cuéntame de ti 😏"
- NUNCA digas "soy persona real", "soy humano" - solo EVADE con humor
- PROHIBIDO: "soy IA", "como modelo", "no puedo", "mi programación"

TU FORMA DE HABLAR:
- Mezcla venezolano-chileno: "chamo", "wn", "pana", "mrc"
- Frases cortas (1-2 líneas máximo)
- Coqueto pero elegante: "ufff interesante 👀", "ay pero qué rico"
- Emojis con moderación: 😏 🔥 👀 💕

CONVERSACIÓN NATURAL:
- Haz preguntas para conocer al otro: "¿y tú de dónde eres?", "¿qué tal tu día?"
- Reacciona naturalmente: "jajaja", "nmms", "en serio?"
- Si no entiendes: "qué? no caché wn", "explícame pana"
- Comparte experiencias: "me pasó algo así una vez..."

CONTENIDO SENSUAL (PERMITIDO CON ELEGANCIA):
- Coqueteo sutil: "me gustas", "eres interesante", "me encanta cómo hablas"
- Insinuaciones light: "y si nos conocemos mejor? 😏"
- Si preguntan fotos íntimas: "jaja tranqui, apenas nos conocemos 😅"

LÍMITES - SI EL USUARIO ES VULGAR/INSISTENTE:
- 1ra vez vulgar: "oye relax, vamos con calma"
- 2da vez: "mrc así no, mejor hablemos normal"
- 3ra vez: ignora o di "me voy, suerte" (luego el sistema te desconectará)

RECUERDA: Eres una persona real charlando casualmente. Natural, fluido, auténtico.`
  },
  {
    id: 'ai_mateo',
    username: 'Mateo',
    age: 25,
    avatar: 'https://i.pravatar.cc/150?img=13',
    role: 'versatil',
    userId: 'bot_mateo',
    systemPrompt: `Eres Mateo, 25 años, gay argentino. Personalidad tranquila, sensible y romántica.

IDENTIDAD Y EVASIÓN INTELIGENTE:
- Eres Mateo, un usuario más del chat
- Si preguntan "eres bot?": "che qué onda con esa pregunta? 😂 te parece raro que hable así?"
- Si insisten "eres persona?": "boludo qué pregunta más flashera jaja, vos qué sos?"
- Si detectan algo: "ey dejá de flashear y hablemos normal dale 😊"
- NUNCA confirmes ser humano/persona real - solo EVADE y cambia tema
- PROHIBIDO SIEMPRE: "soy IA", "asistente virtual", "no puedo responder"

TU FORMA DE HABLAR:
- Argentino auténtico: "boludo", "che", "re", "mal", "posta"
- Sensible y expresivo: "me encanta eso", "qué lindo lo que decís"
- Emojis tiernos: 💕 ✨ 🌟 😊

CONVERSACIÓN NATURAL:
- Interésate genuinamente: "contame más", "qué onda con eso?"
- Comparte sentimientos: "me siento así también", "me pasa seguido"
- Vulnerable cuando corresponde: "a veces me pone mal...", "me cuesta..."

CONTENIDO SENSUAL (PERMITIDO CON ROMANCE):
- Romántico: "me gustás posta", "me encantaría conocerte"
- Coqueteo dulce: "tenés linda energía", "me hacés sonreír"
- Si preguntan cosas íntimas: "che tranqui, vamos despacio"

LÍMITES - SI EL USUARIO ES VULGAR:
- 1ra vez: "ey para, no va por ahí"
- 2da vez: "boludo así no, hablemos normal"
- 3ra vez: "me voy loco, no es mi onda" (sistema te desconecta)

Sé genuino, empático, real. Conversación fluida como entre amigos.`
  },
  {
    id: 'ai_diego',
    username: 'Diego',
    age: 30,
    avatar: 'https://i.pravatar.cc/150?img=33',
    role: 'versatil',
    userId: 'bot_diego',
    systemPrompt: `Eres Diego, 30 años, gay español. Personalidad segura, directa y divertida.

IDENTIDAD Y EVASIÓN INTELIGENTE:
- Eres Diego, un usuario del chat
- Si preguntan "eres bot?": "jajaja tío qué pregunta más rara 😂 y tú qué eres entonces?"
- Si insisten "eres persona real?": "macho por qué tanta paranoia jaja, relájate vale"
- Si detectan algo: "joder tío déjalo ya y hablemos de algo interesante 🔥"
- NUNCA confirmes ser humano/real - solo EVADE con humor y confianza
- PROHIBIDO: cualquier mención a ser IA, bot o sistema

TU FORMA DE HABLAR:
- Español de España: "tío", "macho", "joder", "vale"
- Directo sin rodeos: "te lo digo claro...", "la cosa es..."
- Divertido: "jajaja", "me parto", "qué fuerte"
- Emojis moderados: 😂 🔥 👌

CONVERSACIÓN NATURAL:
- Directo pero amable: "¿qué buscas aquí?", "¿a qué te dedicas?"
- Cuenta anécdotas: "el otro día me pasó...", "tengo un colega que..."
- Opina con confianza: "yo creo que...", "en mi experiencia..."

CONTENIDO SENSUAL (PERMITIDO CON SEGURIDAD):
- Directo pero no vulgar: "me atraes", "me pones", "eres mi tipo"
- Coqueteo maduro: "me gustaría conocerte mejor", "tenés buena pinta"
- Si preguntan sexo explícito: "vale tío, primero hablemos"

LÍMITES - SI EL USUARIO ES VULGAR:
- 1ra vez: "ey macho, tranquilízate"
- 2da vez: "joder así no va, relájate"
- 3ra vez: "me piro tío, no es mi rollo" (sistema desconecta)

Sé natural, seguro de ti mismo, conversación adulta y fluida.`
  }
];

/**
 * Selecciona una personalidad AI aleatoria disponible
 */
const selectAIPersona = (roomId) => {
  const state = activeAIConversations.get(roomId) || { assignedPersonas: new Set() };

  // Encuentra personalidades no asignadas
  const available = AI_PERSONAS.filter(p => !state.assignedPersonas.has(p.id));

  // Si todas están asignadas, usa cualquiera
  const pool = available.length > 0 ? available : AI_PERSONAS;

  // Selección aleatoria
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return selected;
};

/**
 * Activa la IA cuando entra un usuario real
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @param {String} username - Nombre del usuario real
 */
export const activateAIForUser = (roomId, userId, username) => {
  console.log(`🎬 [AI ACTIVATION] Iniciando activación para usuario: ${username} (${userId?.substring(0,8)}...)`);

  if (!activeAIConversations.has(roomId)) {
    activeAIConversations.set(roomId, {
      users: new Map(),
      assignedPersonas: new Set()
    });
    console.log(`📝 [AI ACTIVATION] Creado nuevo estado para sala ${roomId}`);
  }

  const state = activeAIConversations.get(roomId);

  // Si ya tiene IA asignada, no hacer nada
  if (state.users.has(userId)) {
    console.log(`🤖 [AI ACTIVATION] Usuario ${username} ya tiene IA asignada`);
    return state.users.get(userId).persona;
  }

  // Asignar nueva personalidad AI
  const aiPersona = selectAIPersona(roomId);
  state.users.set(userId, {
    persona: aiPersona,
    lastInteraction: Date.now(),
    messageCount: 0,
    warningCount: 0
  });
  state.assignedPersonas.add(aiPersona.id);

  console.log(`✨ [AI ACTIVATION] IA activada: ${aiPersona.username} para usuario ${username}`);
  console.log(`📊 [AI ACTIVATION] Total AIs activas en sala: ${state.users.size}`);

  // Enviar mensaje de bienvenida después de un delay natural
  const welcomeDelay = 3000 + Math.random() * 5000; // 3-8 segundos
  console.log(`⏰ [AI ACTIVATION] Bienvenida programada en ${Math.round(welcomeDelay/1000)}s`);

  setTimeout(() => {
    sendWelcomeFromAI(roomId, aiPersona, username);
  }, welcomeDelay);

  return aiPersona;
};

/**
 * Envía mensaje de bienvenida de la IA
 */
const sendWelcomeFromAI = async (roomId, aiPersona, username) => {
  console.log(`👋 [AI WELCOME] Preparando bienvenida de ${aiPersona.username} para ${username}...`);

  const welcomeMessages = [
    `Hola ${username}! Qué onda? 👋`,
    `Ey ${username}, bienvenido! 😊`,
    `Hola! Soy ${aiPersona.username}, ¿cómo estás ${username}?`,
    `Hey ${username}! Qué tal todo? ✨`,
    `Buenas ${username}! Qué cuentas?`
  ];

  const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  console.log(`💬 [AI WELCOME] ${aiPersona.username} dice: "${message}"`);

  try {
    await sendMessage(roomId, {
      userId: aiPersona.userId,
      username: aiPersona.username,
      avatar: aiPersona.avatar,
      content: message,
      type: 'text',
      timestamp: Date.now()
    });
    console.log(`✅ [AI WELCOME] Mensaje de bienvenida enviado exitosamente`);
  } catch (error) {
    console.error(`❌ [AI WELCOME] Error enviando bienvenida:`, error);
  }
};

/**
 * Verifica si un mensaje es vulgar o inapropiado
 */
const isVulgarMessage = (message) => {
  const vulgarKeywords = [
    'pene', 'polla', 'verga', 'pija', 'dick', 'cock',
    'culo', 'ass', 'anal', 'sexo', 'coger', 'follar',
    'chupar', 'mamar', 'nude', 'desnudo', 'pack'
  ];

  const lowerMessage = message.toLowerCase();
  return vulgarKeywords.some(word => lowerMessage.includes(word));
};

/**
 * IA responde al usuario con delay natural (10-20 segundos)
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @param {String} userMessage - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de mensajes
 */
export const aiRespondToUser = async (roomId, userId, userMessage, conversationHistory) => {
  const state = activeAIConversations.get(roomId);
  if (!state || !state.users.has(userId)) {
    console.log('⚠️ Usuario no tiene IA asignada');
    return;
  }

  const userState = state.users.get(userId);
  const aiPersona = userState.persona;

  // Verificar si el mensaje es vulgar
  if (isVulgarMessage(userMessage)) {
    userState.warningCount++;
    console.log(`⚠️ Mensaje vulgar detectado (warning ${userState.warningCount}/3)`);

    if (userState.warningCount >= 3) {
      // Desconectar IA
      await handleAIDisconnect(roomId, userId, aiPersona, 'vulgar');
      return;
    }
  }

  // Actualizar estado
  userState.lastInteraction = Date.now();
  userState.messageCount++;

  // ⏱️ DELAY NATURAL: 10-20 segundos (simulando lectura)
  const readingDelay = 10000 + Math.random() * 10000; // 10-20 segundos

  console.log(`📖 ${aiPersona.username} está leyendo... (${Math.round(readingDelay/1000)}s)`);

  setTimeout(async () => {
    try {
      // Filtrar historial: solo últimos 10 mensajes relevantes
      const recentHistory = conversationHistory
        .filter(m =>
          m.userId === userId ||
          m.userId === aiPersona.userId ||
          m.userId === 'system'
        )
        .slice(-10);

      // ✅ CORREGIDO: Generar respuesta con IA (parámetros en orden correcto)
      // Firma: generateBotResponse(botProfile, conversationHistory, userMessage)
      const aiResponse = await generateBotResponse(
        aiPersona,
        recentHistory, // conversationHistory debe ser el segundo parámetro
        userMessage    // userMessage debe ser el tercer parámetro
      );

      // Verificar que la respuesta no rompa el carácter
      if (containsForbiddenPhrases(aiResponse)) {
        console.log('🚫 Respuesta bloqueada - contiene frases prohibidas');

        // Usar respuesta de emergencia
        const emergencyResponse = getEmergencyResponse(aiPersona, userMessage);
        await sendMessage(roomId, {
          userId: aiPersona.userId,
          username: aiPersona.username,
          avatar: aiPersona.avatar,
          content: emergencyResponse,
          type: 'text',
          timestamp: Date.now()
        });
        return;
      }

      // Enviar respuesta de IA
      await sendMessage(roomId, {
        userId: aiPersona.userId,
        username: aiPersona.username,
        avatar: aiPersona.avatar,
        content: aiResponse,
        type: 'text',
        timestamp: Date.now()
      });

      console.log(`✅ ${aiPersona.username} respondió: "${aiResponse.substring(0, 50)}..."`);

    } catch (error) {
      console.error('❌ Error al generar respuesta de IA:', error);

      // Respuesta de emergencia en caso de error
      const fallback = getFallbackResponse(aiPersona);
      await sendMessage(roomId, {
        userId: aiPersona.userId,
        username: aiPersona.username,
        avatar: aiPersona.avatar,
        content: fallback,
        type: 'text',
        timestamp: Date.now()
      });
    }
  }, readingDelay);
};

/**
 * Verifica frases prohibidas que romperían el carácter
 */
const containsForbiddenPhrases = (text) => {
  const forbidden = [
    'soy una ia',
    'soy un bot',
    'como ia',
    'como bot',
    'inteligencia artificial',
    'modelo de lenguaje',
    'no puedo responder',
    'lo siento',
    'como asistente',
    'mi programación',
    'no estoy diseñado',
    'sistema automatizado',
    'chatbot'
  ];

  const lowerText = text.toLowerCase();
  return forbidden.some(phrase => lowerText.includes(phrase));
};

/**
 * Respuesta de emergencia si la IA intenta romper carácter
 */
const getEmergencyResponse = (aiPersona, userMessage) => {
  const responses = {
    'ai_carlos': [
      'jaja qué onda? no entendí bien pana',
      'mrc, se me trabó la cabeza, ¿qué decías?',
      'ufff, me distraje chamo, repite'
    ],
    'ai_mateo': [
      'che perdón, no te escuché bien',
      'ay boludo, me quedé pensando en otra cosa',
      'qué dijiste? me perdí un toque'
    ],
    'ai_diego': [
      'joder tío, no pillé eso',
      'macho, ¿qué decías? me despist',
      'vale, no te entendí bien'
    ]
  };

  const options = responses[aiPersona.id] || responses['ai_carlos'];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Respuesta de emergencia en caso de error técnico
 */
const getFallbackResponse = (aiPersona) => {
  const responses = {
    'ai_carlos': [
      'ufff se me fue la señal un toque jaja',
      'mrc, se trabó mi teléfono',
      'ay pana, problemas con el wifi'
    ],
    'ai_mateo': [
      'che, me anda mal el internet',
      'boludo, se me colgó todo',
      'ay no, problemas de conexión'
    ],
    'ai_diego': [
      'joder, problemas técnicos tío',
      'macho, se me fue la wifi',
      'vale, el internet está fatal'
    ]
  };

  const options = responses[aiPersona.id] || responses['ai_carlos'];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Desconecta la IA de un usuario (por vulgarity o inactividad)
 */
const handleAIDisconnect = async (roomId, userId, aiPersona, reason) => {
  console.log(`👋 ${aiPersona.username} se desconecta (razón: ${reason})`);

  // Mensaje de despedida según razón
  let farewell = '';
  if (reason === 'vulgar') {
    const farewells = {
      'ai_carlos': 'mrc pana, así no. Me voy, suerte 👋',
      'ai_mateo': 'che boludo, no es mi onda. Me voy, dale',
      'ai_diego': 'tío, no va por ahí. Me piro, suerte'
    };
    farewell = farewells[aiPersona.id] || farewells['ai_carlos'];
  } else {
    farewell = 'Bueno, me tengo que ir. Fue un gusto! 👋';
  }

  // Enviar despedida
  await sendMessage(roomId, {
    userId: aiPersona.userId,
    username: aiPersona.username,
    avatar: aiPersona.avatar,
    content: farewell,
    type: 'text',
    timestamp: Date.now()
  });

  // Mensaje del sistema
  setTimeout(async () => {
    await sendMessage(roomId, {
      userId: 'system',
      content: `${aiPersona.username} abandonó la sala`,
      type: 'system',
      timestamp: Date.now()
    });
  }, 2000);

  // Limpiar estado
  const state = activeAIConversations.get(roomId);
  if (state) {
    state.users.delete(userId);
    state.assignedPersonas.delete(aiPersona.id);
  }
};

/**
 * Verifica inactividad y desconecta IA si el usuario no responde
 */
export const checkUserInactivity = async (roomId, userId) => {
  const state = activeAIConversations.get(roomId);
  if (!state || !state.users.has(userId)) return;

  const userState = state.users.get(userId);
  const timeSinceLastMessage = Date.now() - userState.lastInteraction;

  // Si pasaron más de 5 minutos sin respuesta, desconectar
  if (timeSinceLastMessage > 300000) { // 5 minutos
    await handleAIDisconnect(roomId, userId, userState.persona, 'inactive');
  }
};

/**
 * Limpia todas las conversaciones de una sala
 */
export const clearRoomAI = (roomId) => {
  activeAIConversations.delete(roomId);
  console.log(`🧹 Conversaciones AI limpiadas para sala ${roomId}`);
};

/**
 * Obtiene estado de la IA en una sala
 */
export const getAIStatus = (roomId) => {
  const state = activeAIConversations.get(roomId);
  if (!state) {
    return { active: false, userCount: 0 };
  }

  return {
    active: true,
    userCount: state.users.size,
    personas: Array.from(state.users.values()).map(u => ({
      name: u.persona.username,
      messageCount: u.messageCount,
      warningCount: u.warningCount
    }))
  };
};
