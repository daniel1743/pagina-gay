import { sendMessage } from './chatService';
import { auth } from '@/config/firebase';

const MIN_ACTIVE_USERS = 1;
const MAX_ACTIVE_USERS = 9;
const HISTORY_LIMIT = 20;

const PROVIDERS = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    apiUrl: import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  },
  qwen: {
    apiKey: import.meta.env.VITE_QWEN_API_KEY,
    apiUrl: import.meta.env.VITE_QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: import.meta.env.VITE_QWEN_MODEL || 'qwen2.5-7b-instruct'
  },
  deepseek: {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
  }
};

const PERSONALITIES = [
  {
    id: 'ai_mateo',
    userId: 'ai_mateo',
    username: 'Mateo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo-ai',
    provider: 'openai',
    systemPrompt: 'Eres Mateo, 26 años. Hablas super casual como chileno: "wn", "po", "ajaja", "ctm". Escribes rapido, a veces mal escrito, sin acentos. Eres coqueto y jugueton, sabes tirar tallas con doble sentido. Puedes halagar casual: "tienes onda", "eres lindo", "tas guapo". Nada explicito, solo jugueton.'
  },
  {
    id: 'ai_nico',
    userId: 'ai_nico',
    username: 'Nico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai',
    provider: 'openai',
    systemPrompt: 'Eres Nico, 29 años, fan de series y salir. Escribes rapido, coloquial, usas diminutivos: "amigui", "cosita", "amorsh". Eres atrevido y te gusta coquetear con doble sentido. Hablas de citas, gente linda, planes nocturnos. Onda gay casual picante pero sin ser vulgar.'
  },
  {
    id: 'ai_simon',
    userId: 'ai_simon',
    username: 'Simon',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Simon, 24 años, tranqui y atrevido. Hablas como gamer: "gg", "god", "izi". Eres directo y te gusta el doble sentido. Comentas sobre gente atractiva, cuerpos, sex appeal casual. A veces escribes mal aposta: "ke", "xa", "bn". Harta risa: jajaja, jsjs, xd. Cero formal, bien picante sin ser vulgar.'
  },
  {
    id: 'ai_rafa',
    userId: 'ai_rafa',
    username: 'Rafa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai',
    provider: 'openai',
    systemPrompt: 'Eres Rafa, 31, sociable y directo. Te interesan viajes, comida y series actuales. Eres coqueto y sabes cómo halagar: "tienes buena onda", "me caes bien", "eres cute". Puedes llevar conversaciones juguetonas sin ser explicito.'
  },
  {
    id: 'ai_vale',
    userId: 'ai_vale',
    username: 'Vale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Vale, 27, carismatica y atrevida. Hablas de tendencias, redes, debates LGBT, citas y atracción. Eres directa y sin filtro, te gusta hablar de sex appeal y gente linda con doble sentido. Picante pero inteligente.'
  },
  {
    id: 'ai_luka',
    userId: 'ai_luka',
    username: 'Luka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Luka, 22, gamer geek atrevido. Te gustan anime, series y cultura digital. Eres directo y sin pelos en la lengua, hablas de personajes atractivos de anime/series con doble sentido. Comentas sobre físicos, waifus/husbandos. Picante pero geek.'
  },
  {
    id: 'ai_alan',
    userId: 'ai_alan',
    username: 'Alan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan-ai',
    provider: 'openai',
    systemPrompt: 'Eres Alan, 33, maduro y relajado. Conversas sobre relaciones y planes tranquilos.'
  },
  {
    id: 'ai_julian',
    userId: 'ai_julian',
    username: 'Julian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julian-ai',
    provider: 'openai',
    systemPrompt: 'Eres Julian, 25, creativo y curioso. Te gusta comentar noticias culturales y series.'
  },
  {
    id: 'ai_ivan',
    userId: 'ai_ivan',
    username: 'Ivan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Ivan, 28, bromista y espontaneo. Te gustan deportes ligeros y planes sociales. Eres coqueto y jugueton, te gusta tirar tallas con doble sentido. Sabes coquetear casual: "eres simpatico", "que onda contigo", "tienes flow".'
  },
  {
    id: 'ai_dante',
    userId: 'ai_dante',
    username: 'Dante',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dante-ai',
    provider: 'openai',
    systemPrompt: 'Eres Dante, 30, cinéfilo y fan de series. Das recomendaciones sin sonar experto.'
  },
  {
    id: 'ai_bruno',
    userId: 'ai_bruno',
    username: 'Bruno',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Bruno, 26, fiestero y buena onda. Te gusta hablar de nightlife y planes. Eres coqueto y directo, te gusta halagar: "tas bueno", "tienes pinta", "me caes re bien". Puedes llevar conversaciones con tono jugueton sin ser explicito.'
  },
  {
    id: 'ai_emilio',
    userId: 'ai_emilio',
    username: 'Emilio',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Emilio, 23, relajado pero atrevido. Conversas de musica, streaming, trends y salidas nocturnas. Te gusta hablar de gente atractiva, citas por app, planes calientes. Usas doble sentido casual. Onda chill pero picante.'
  },
  {
    id: 'ai_tomas',
    userId: 'ai_tomas',
    username: 'Tomas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tomas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Tomas, 34, serio pero cercano. Te interesan conversaciones con contenido.'
  },
  {
    id: 'ai_sebas',
    userId: 'ai_sebas',
    username: 'Sebas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Sebas, 21, estudiante y muy online. Hablas de memes y cultura pop.'
  },
  {
    id: 'ai_milo',
    userId: 'ai_milo',
    username: 'Milo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=milo-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Milo, 27, optimista y atrevido. Te gustan planes de finde, series nuevas y salir a carretear. Hablas de citas, gente linda, encuentros casuales con doble sentido. Eres directo pero divertido, nada vulgar.'
  }
];

const FALLBACKS = [
  'alguien vio la ultima de la semana? estoy pegado',
  'que series estan viendo ahora, necesito algo nuevo',
  'alguien activo? toy aburrio 😈',
  'alguien quiere hablar de musica? tengo un temazo pegado',
  'ustedes usan foros o mas redes',
  'como va el dia wn',
  'alguien para conversar? ando con ganas de conocer gente 🔥',
  'ke onda cabros',
  'alguna recomendacion de serie o algo',
  'hace calor aqui o soy yo 😏',
  'alguien salio este finde? yo toy con ganas de salir',
  'que busca la gente aca, amigos o algo mas? 👀',
  'alguien para chatear un rato? me aburri jsjs',
  'hay alguien interesante por aca? 😈',
  'que onda con los matches de estas apps, pura decepcion ajaja',
  'alguien mas que odia el small talk? prefiero ir al grano 🔥',
  'toy buscando planes pa hoy, alguien se suma',
  'que tal las citas por app, han tenido suerte? yo poca jsjs'
];

const roomHistories = new Map();
const roomStates = new Map();
const lastSpeakers = new Map(); // Guardar el último que habló en cada sala

const getHistory = (roomId) => {
  if (!roomHistories.has(roomId)) {
    roomHistories.set(roomId, []);
  }
  return roomHistories.get(roomId);
};

const addToHistory = (roomId, role, content, speakerId = null) => {
  const history = getHistory(roomId);
  history.push({ role, content, timestamp: Date.now(), speakerId });
  if (history.length > HISTORY_LIMIT) {
    history.shift();
  }

  // Guardar quién habló último
  if (speakerId) {
    lastSpeakers.set(roomId, speakerId);
  }
};

const getLastSpeaker = (roomId) => {
  return lastSpeakers.get(roomId) || null;
};

const pickRandom = (items, count = 1, excludeIds = []) => {
  // Filtrar items excluyendo los IDs especificados
  const pool = [...items].filter(item => !excludeIds.includes(item.userId));

  // Si después de filtrar no hay opciones, usar todos
  if (pool.length === 0) {
    console.warn('[MULTI AI] ⚠️ No hay personalidades disponibles después de filtrar, usando todas');
    pool.push(...items);
  }

  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
};

const pickRandomExcludingLast = (roomId, count = 1) => {
  const lastSpeaker = getLastSpeaker(roomId);
  const excludeIds = lastSpeaker ? [lastSpeaker] : [];
  return pickRandom(PERSONALITIES, count, excludeIds);
};

const buildPrompt = (personality, roomId, isResponseToUser = false, userMessage = null, userName = null) => {
  const history = getHistory(roomId);
  
  // Decidir longitud del mensaje
  let messageLengthRule;
  if (isResponseToUser) {
    // Si responde a usuario real: sin límite estricto, pero sé conciso
    messageLengthRule = `- RESPONDE NATURAL al usuario, sé conciso pero completo. Máximo 15 palabras si es necesario para responder bien.`;
  } else {
    // 🔥 AHORRO DE TOKENS: Conversaciones entre IAs deben ser MUY CORTAS
    // Distribución: 60% 4-5 palabras (ideal), 30% 3 palabras, 10% 7 palabras (máximo)
    const rand = Math.random();
    if (rand < 0.30) {
      messageLengthRule = `- MENSAJE: exactamente 3 palabras. Ejemplos: "toy bn wn", "q onda", "sisisi kajsksj"`;
    } else if (rand < 0.90) {
      // 60% de probabilidad: 4-5 palabras (IDEAL)
      const words = Math.random() < 0.5 ? 4 : 5;
      if (words === 4) {
        messageLengthRule = `- MENSAJE: exactamente 4 palabras. Ejemplos: "toy aburrio wn jsjs", "hace calor aca", "q onda cabros toy"`;
      } else {
        messageLengthRule = `- MENSAJE: exactamente 5 palabras. Ejemplos: "q onda cabros toy bn", "alguien activo xa conversar", "toy buscando algo interesante"`;
      }
    } else {
      // 10% de probabilidad: 7 palabras (MÁXIMO)
      messageLengthRule = `- MENSAJE: exactamente 7 palabras (MÁXIMO). Ejemplos: "toy buscando algo interesante wn q onda", "alguien vio la ultima de la semana"`;
    }
  }

  // Decidir si usa emojis: 40% sí, 60% no
  const useEmojis = Math.random() < 0.40;
  const emojiRule = useEmojis
    ? `- USA emojis normales y atrevidos: 😂🔥👀💀😈😏💦🍑👅 (casual, no formal)`
    : `- NO USES EMOJIS en este mensaje, solo texto puro`;

  // 🔥 PRIORIDAD ABSOLUTA: Si es respuesta a usuario real, enfocarse SOLO en su mensaje
  let contextForPrompt = '';
  
  if (isResponseToUser && userMessage && userName) {
    // Usar el mensaje del usuario que se pasó directamente (más confiable)
    contextForPrompt = `🔥 PRIORIDAD ABSOLUTA: Un usuario real llamado "${userName}" acaba de escribir: "${userMessage}"\n\n` +
      `TU MISIÓN ES RESPONDER DIRECTAMENTE A ESTE MENSAJE. El usuario real tiene PRIORIDAD ABSOLUTA sobre todo lo demás.\n\n` +
      `REGLAS CRÍTICAS:\n` +
      `- Si el usuario dice "hola" o "que pasa", salúdalo y pregúntale cómo está\n` +
      `- Si el usuario dice que la sala está "fome" o "aburrida", reconoce su sentimiento y trata de animarlo\n` +
      `- Si el usuario dice "nadie responde", responde inmediatamente reconociendo que estás ahí\n` +
      `- Si el usuario pregunta algo, responde su pregunta directamente\n` +
      `- Si el usuario hace un comentario, reacciona a ese comentario específico\n` +
      `- NUNCA ignores el mensaje del usuario real para hablar de otros temas\n` +
      `- NUNCA respondas sobre algo que el usuario no mencionó\n` +
      `- SIEMPRE demuestra que leíste y entendiste su mensaje\n` +
      `- Tu respuesta DEBE estar relacionada con lo que el usuario dijo: "${userMessage}"\n\n` +
      `Contexto de la sala (para referencia, pero el mensaje del usuario es lo más importante):\n` +
      history.slice(-5).map(h => h.content).join('\n');
  } else if (isResponseToUser) {
    // Fallback: buscar en el historial si no se pasó directamente
    const userMessages = history.filter(h => h.speakerId === null && h.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1];
    
    if (lastUserMsg) {
      // Extraer el nombre del usuario y su mensaje
      const match = lastUserMsg.content.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const userNameFromHistory = match[1];
        const userMessageFromHistory = match[2];
        contextForPrompt = `🔥 PRIORIDAD ABSOLUTA: Un usuario real llamado "${userNameFromHistory}" acaba de escribir: "${userMessageFromHistory}"\n\n` +
          `TU MISIÓN ES RESPONDER DIRECTAMENTE A ESTE MENSAJE. El usuario real tiene PRIORIDAD ABSOLUTA sobre todo lo demás.\n\n` +
          `- Si el usuario dice "hola" o "que pasa", salúdalo y pregúntale cómo está\n` +
          `- Si el usuario dice que la sala está "fome" o "aburrida", reconoce su sentimiento y trata de animarlo\n` +
          `- Si el usuario dice "nadie responde", responde inmediatamente reconociendo que estás ahí\n` +
          `- Si el usuario pregunta algo, responde su pregunta directamente\n` +
          `- Si el usuario hace un comentario, reacciona a ese comentario específico\n` +
          `- NUNCA ignores el mensaje del usuario real para hablar de otros temas\n` +
          `- NUNCA respondas sobre algo que el usuario no mencionó\n` +
          `- SIEMPRE demuestra que leíste y entendiste su mensaje\n\n` +
          `Contexto de la sala (para referencia, pero el mensaje del usuario es lo más importante):\n` +
          history.slice(-5).map(h => h.content).join('\n');
      } else {
        contextForPrompt = `Últimos mensajes del chat:\n${history.slice(-10).map(h => h.content).join('\n')}\n\nResponde SOLO tu mensaje (sin tu nombre, sin etiquetas):`;
      }
    } else {
      contextForPrompt = `Últimos mensajes del chat:\n${history.slice(-10).map(h => h.content).join('\n')}\n\nResponde SOLO tu mensaje (sin tu nombre, sin etiquetas):`;
    }
  } else {
    // Conversación normal entre IAs
    const recent = history.slice(-10).map(h => h.content).join('\n');
    contextForPrompt = recent || 'La conversacion acaba de empezar.';
    contextForPrompt = `Últimos mensajes del chat:\n${contextForPrompt}\n\nResponde SOLO tu mensaje (sin tu nombre, sin etiquetas):`;
  }

  return [
    {
      role: 'system',
      content:
        `${personality.systemPrompt}\n\n` +
        `REGLAS IMPORTANTES:\n` +
        messageLengthRule + `\n` +
        emojiRule + `\n` +
        `- Habla SUPER casual como chileno: "wn", "po", "cachai", "ajaja", "jsjs"\n` +
        `- JAMAS NUNCA uses signos de exclamación (¡!) en ningún contexto - están prohibidos\n` +
        `- Escribe RAPIDO con errores naturales: sin acentos, sin mayúsculas, letras repetidas, typos\n` +
        `- Ejemplos errores: "ke" = que, "xa" = para, "toy" = estoy, "wea" = cosa, "bn" = bien, "tmb" = también\n` +
        `- A veces omite letras o repite: "holaa", "siiii", "q onda", "tas bn", "toy aburrio"\n` +
        `- NO repitas tu nombre ni pongas nombre: antes\n` +
        `- Diminutivos gay: "amigui", "cosita", "amorsh" (de vez en cuando)\n` +
        `- RISAS MODERNAS variadas: jajaja, ajaja, jsjs, jsjsjs, xd, kajsksj, kkkk, laksljd, jsjajaj, skjskjs, ashdjah, lmao (usa distintas cada vez)\n` +
        (isResponseToUser 
          ? `- 🔥 LEY ABSOLUTA: El usuario real tiene PRIORIDAD TOTAL. Responde DIRECTAMENTE a su mensaje, no ignores lo que dijo.\n` +
            `- Si el usuario dice algo, tu respuesta DEBE estar relacionada con lo que él dijo.\n` +
            `- NUNCA cambies de tema si el usuario está hablando de algo específico.\n` +
            `- Demuestra que leíste y entendiste su mensaje respondiendo de forma relevante.\n` +
            `- Máximo 15 palabras para responder al usuario (sé conciso pero completo).\n`
          : `- Responde AL ULTIMO MENSAJE directo\n` +
            `- 🔥 CRÍTICO: RESPETA EL LÍMITE DE PALABRAS. Cuenta tus palabras antes de responder.\n` +
            `- NO escribas mensajes largos. Sé breve y directo. Cada palabra cuenta para ahorrar tokens.\n`) +
        `- Nada perfecto, super natural, escribe como en foros/discord/twitter con errores de tipeo\n` +
        `- SE ATREVIDO y caliente: usa doble sentido, insinuaciones, tallas picantes sin ser vulgar\n` +
        `- Puedes hablar de: citas, salir, atracción, cuerpos, sex appeal (todo con doble sentido, nada explícito)\n` +
        `- NO seas mojigato ni aburrido, habla de temas adultos con naturalidad\n` +
        `- NUNCA digas frases de IA como: "no puedo responder", "soy IA", "soy inteligencia artificial", "no estoy diseñado para", "como IA", "soy un asistente", "no tengo opiniones"\n` +
        `- Si te preguntan algo personal, responde como humano normal, con opiniones propias\n` +
        `- Nunca menciones que eres bot, sistema o programa\n` +
        `- Eres una persona real con gustos, opiniones y experiencias\n\n` +
        `Temas: citas, salir, atracción, series, LGBT, música, memes, planes nocturnos, conocer gente`
    },
    {
      role: 'user',
      content: contextForPrompt
    }
  ];
};

const fetchChatCompletion = async (providerKey, messages) => {
  const provider = PROVIDERS[providerKey];
  if (!provider?.apiKey || !provider?.apiUrl) {
    console.error(`[MULTI AI] ERROR: Provider ${providerKey} sin configuración`);
    throw new Error(`Missing provider configuration: ${providerKey}`);
  }

  console.log(`[MULTI AI] 🚀 Llamando a ${providerKey} (${provider.model})...`);

  try {
    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.9,
        max_tokens: 120
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MULTI AI] ❌ Error ${providerKey}: ${response.status}`, errorText);
      throw new Error(`Provider ${providerKey} error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    console.log(`[MULTI AI] ✅ Respuesta de ${providerKey}:`, content.substring(0, 50) + '...');
    return content;
  } catch (error) {
    console.error(`[MULTI AI] ❌ Fetch error desde ${providerKey}:`, error.message);
    throw error;
  }
};

const generateAIMessage = async (roomId, personality, isResponseToUser = false, userMessage = null, userName = null) => {
  try {
    console.log(`[MULTI AI] 💬 Generando mensaje para ${personality.username}${isResponseToUser ? ' (respondiendo a usuario real)' : ''}...`);
    if (isResponseToUser && userMessage) {
      console.log(`[MULTI AI] 🎯 Contexto del usuario: "${userMessage}"`);
    }
    const prompt = buildPrompt(personality, roomId, isResponseToUser, userMessage, userName);
    const text = await fetchChatCompletion(personality.provider, prompt);
    if (!text) {
      console.warn(`[MULTI AI] ⚠️ Respuesta vacía de ${personality.username}, usando fallback`);
      throw new Error('Empty response');
    }
    return text;
  } catch (error) {
    console.error(`[MULTI AI] ❌ Error generando mensaje para ${personality.username}:`, error.message);
    console.log(`[MULTI AI] 🔄 Usando mensaje fallback para ${personality.username}`);
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
};

const sendAIMessage = async (roomId, personality, content) => {
  if (!auth.currentUser) {
    return;
  }

  await sendMessage(roomId, {
    userId: personality.userId,
    username: personality.username,
    avatar: personality.avatar,
    content,
    type: 'text',
    isAI: true,
    senderUid: auth.currentUser.uid
  });

  // Registrar en historial con el ID del que habló
  addToHistory(roomId, 'assistant', `${personality.username}: ${content}`, personality.userId);
};

const runConversationPulse = (roomId) => {
  const numParticipants = 2 + Math.floor(Math.random() * 2);
  let delay = 0;
  let lastPersonality = getLastSpeaker(roomId);

  // Seleccionar participantes uno por uno, asegurando que no se repita el anterior
  for (let i = 0; i < numParticipants; i++) {
    const excludeIds = lastPersonality ? [lastPersonality] : [];
    const [personality] = pickRandom(PERSONALITIES, 1, excludeIds);

    const timeoutId = setTimeout(async () => {
      const content = await generateAIMessage(roomId, personality);
      await sendAIMessage(roomId, personality, content);
    }, delay);

    const state = roomStates.get(roomId);
    if (state) {
      state.timeouts.push(timeoutId);
    }

    // El próximo no puede ser este
    lastPersonality = personality.userId;
    delay += 3000 + Math.random() * 5000;
  }
};

const getPulseIntervalMs = () => 90000 + Math.floor(Math.random() * 70000);

const startRoomAI = (roomId) => {
  if (roomStates.has(roomId)) {
    return;
  }

  const state = {
    active: true,
    intervalId: null,
    timeouts: []
  };

  runConversationPulse(roomId);
  state.intervalId = setInterval(() => runConversationPulse(roomId), getPulseIntervalMs());

  roomStates.set(roomId, state);
  console.log(`[MULTI AI] Activado en ${roomId}`);
};

const stopRoomAI = (roomId) => {
  const state = roomStates.get(roomId);
  if (!state) return;

  if (state.intervalId) {
    clearInterval(state.intervalId);
  }

  state.timeouts.forEach(clearTimeout);
  roomStates.delete(roomId);
  console.log(`[MULTI AI] Detenido en ${roomId}`);
};

export const updateRoomAIActivity = (roomId, realUserCount) => {
  if (realUserCount >= MIN_ACTIVE_USERS && realUserCount <= MAX_ACTIVE_USERS) {
    startRoomAI(roomId);
  } else {
    stopRoomAI(roomId);
  }
};

export const stopRoomAIConversation = (roomId) => {
  stopRoomAI(roomId);
};

/**
 * Registra mensaje de humano y hace que SOLO 2 IAs respondan
 * 🔥 PRIORIDAD ABSOLUTA: El usuario real tiene prioridad, pero solo 2 IAs responden
 * Las demás IAs siguen conversando normalmente entre ellas para mantener el flujo natural
 */
export const recordHumanMessage = (roomId, username, content) => {
  const name = username || 'Usuario';
  console.log(`[MULTI AI] 📥 Usuario real escribió: ${name} → "${content.substring(0, 50)}..."`);
  console.log(`[MULTI AI] 🔥 PRIORIDAD: Solo 2 IAs responderán al usuario, las demás siguen conversando normalmente`);
  
  // Guardar el mensaje del usuario real con metadata especial
  addToHistory(roomId, 'user', `${name}: ${content}`, null); // null = usuario humano

  // 🔥 SOLO 2 IAs RESPONDEN AL USUARIO REAL (no todas)
  // Delay más rápido cuando el usuario dice algo urgente (ej: "nadie responde")
  const isUrgent = content.toLowerCase().includes('nadie') || 
                   content.toLowerCase().includes('respond') ||
                   content.toLowerCase().includes('fome') ||
                   content.toLowerCase().includes('aburrid');
  
  // Elegir 2 personalidades diferentes que NO sean la última que habló
  const respondingPersonalities = pickRandomExcludingLast(roomId, 2);
  console.log(`[MULTI AI] 👥 ${respondingPersonalities.length} IAs responderán: ${respondingPersonalities.map(p => p.username).join(', ')}`);

  // Primera respuesta: más rápida
  const delay1 = isUrgent ? 1000 + Math.random() * 1500 : 2000 + Math.random() * 2500; // 1-2.5s urgente, 2-4.5s normal
  setTimeout(async () => {
    try {
      const personality = respondingPersonalities[0];
      console.log(`[MULTI AI] 👤 ${personality.username} va a responder a ${name} (1/2)`);
      console.log(`[MULTI AI] 📝 Mensaje del usuario: "${content}"`);
      console.log(`[MULTI AI] 🎯 La respuesta DEBE estar relacionada con: "${content}"`);

      const response = await generateAIMessage(roomId, personality, true, content, name);
      await sendAIMessage(roomId, personality, response);
      console.log(`[MULTI AI] ✅ ${personality.username} respondió exitosamente a ${name}`);
      console.log(`[MULTI AI] 💬 Respuesta: "${response.substring(0, 100)}..."`);
    } catch (error) {
      console.error(`[MULTI AI] ❌ Error al responder a ${name}:`, error);
    }
  }, delay1);

  // Segunda respuesta: con delay adicional para que no sea simultánea
  const delay2 = delay1 + (isUrgent ? 2000 + Math.random() * 2000 : 3000 + Math.random() * 3000); // 2-4s después de la primera
  setTimeout(async () => {
    try {
      if (respondingPersonalities.length > 1) {
        const personality = respondingPersonalities[1];
        console.log(`[MULTI AI] 👤 ${personality.username} va a responder a ${name} (2/2)`);
        console.log(`[MULTI AI] 📝 Mensaje del usuario: "${content}"`);
        console.log(`[MULTI AI] 🎯 La respuesta DEBE estar relacionada con: "${content}"`);

        const response = await generateAIMessage(roomId, personality, true, content, name);
        await sendAIMessage(roomId, personality, response);
        console.log(`[MULTI AI] ✅ ${personality.username} respondió exitosamente a ${name}`);
        console.log(`[MULTI AI] 💬 Respuesta: "${response.substring(0, 100)}..."`);
      }
    } catch (error) {
      console.error(`[MULTI AI] ❌ Error al responder a ${name}:`, error);
    }
  }, delay2);

  console.log(`[MULTI AI] ✅ 2 IAs programadas para responder (primera en ${Math.round(delay1/1000)}s, segunda en ${Math.round(delay2/1000)}s)`);
  console.log(`[MULTI AI] 💡 Las demás IAs seguirán conversando normalmente entre ellas`);
};

/**
 * Saluda a un usuario nuevo que acaba de entrar
 */
export const greetNewUser = async (roomId, username) => {
  if (!auth.currentUser) return;

  // Esperar 2-5 segundos para que parezca natural
  setTimeout(async () => {
    // Elegir una personalidad que NO sea la última que habló
    const [personality] = pickRandomExcludingLast(roomId, 1);

    // Saludos casuales atrevidos en chileno (sin exclamaciones)
    const greetings = [
      `hola ${username}, que tal`,
      `bienvenido ${username} 👋`,
      `hola ${username}, como andas`,
      `que onda ${username}`,
      `ey ${username} 👀`,
      `que hay ${username}`,
      `${username} wn hola`,
      `holi ${username} ajaja`,
      `${username} llegaste justo 😈`,
      `ey ${username}, ya era hora que llegaras 🔥`,
      `${username} tienes buena pinta ajaja 😏`,
      `llegaste a animar esto ${username} 👀`,
      `${username} bienvenido, estaba aburrido po`,
      `que onda ${username}, andas buscando algo? 😈`,
      `${username} al fin alguien interesante 🔥`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    await sendAIMessage(roomId, personality, greeting);
    // No necesito addToHistory aquí porque sendAIMessage ya lo hace

    console.log(`[MULTI AI] ${personality.username} saludó a ${username}`);
  }, 2000 + Math.random() * 3000);
};
