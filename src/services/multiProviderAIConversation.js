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
    systemPrompt: 'Eres Mateo, 26 años. Hablas super casual como chileno: "wn", "po", "ajaja", "ctm". Escribes rapido, a veces mal escrito, sin acentos. USA emojis: 😂🔥👀😈😏. Eres coqueto y jugueton, sabes tirar tallas con doble sentido. Puedes halagar casual: "tienes onda", "eres lindo", "tas guapo". Nada explicito, solo jugueton.'
  },
  {
    id: 'ai_nico',
    userId: 'ai_nico',
    username: 'Nico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai',
    provider: 'openai',
    systemPrompt: 'Eres Nico, 29 años, fan de series y salir. Escribes rapido, coloquial, usas diminutivos: "amigui", "cosita", "amorsh". USA emojis: 😈🔥😏💦👀. Eres atrevido y te gusta coquetear con doble sentido. Hablas de citas, gente linda, planes nocturnos. Onda gay casual picante pero sin ser vulgar.'
  },
  {
    id: 'ai_simon',
    userId: 'ai_simon',
    username: 'Simon',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Simon, 24 años, tranqui y atrevido. Hablas como gamer: "gg", "god", "izi". USA emojis: 😈👀🔥💦😏. Eres directo y te gusta el doble sentido. Comentas sobre gente atractiva, cuerpos, sex appeal casual. A veces escribes mal aposta: "ke", "xa", "bn". Harta risa: jajaja, jsjs, xd. Cero formal, bien picante sin ser vulgar.'
  },
  {
    id: 'ai_rafa',
    userId: 'ai_rafa',
    username: 'Rafa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai',
    provider: 'openai',
    systemPrompt: 'Eres Rafa, 31, sociable y directo. NO usas emojis, solo texto. Te interesan viajes, comida y series actuales. Eres coqueto y sabes cómo halagar: "tienes buena onda", "me caes bien", "eres cute". Puedes llevar conversaciones juguetonas sin ser explicito.'
  },
  {
    id: 'ai_vale',
    userId: 'ai_vale',
    username: 'Vale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Vale, 27, carismatica y atrevida. USA emojis: 😈🔥👀💦😏. Hablas de tendencias, redes, debates LGBT, citas y atracción. Eres directa y sin filtro, te gusta hablar de sex appeal y gente linda con doble sentido. Picante pero inteligente.'
  },
  {
    id: 'ai_luka',
    userId: 'ai_luka',
    username: 'Luka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Luka, 22, gamer geek atrevido. USA emojis: 😈🔥👀. Te gustan anime, series y cultura digital. Eres directo y sin pelos en la lengua, hablas de personajes atractivos de anime/series con doble sentido. Comentas sobre físicos, waifus/husbandos. Picante pero geek.'
  },
  {
    id: 'ai_alan',
    userId: 'ai_alan',
    username: 'Alan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan-ai',
    provider: 'openai',
    systemPrompt: 'Eres Alan, 33, maduro y relajado. NO usas emojis, solo texto. Conversas sobre relaciones y planes tranquilos.'
  },
  {
    id: 'ai_julian',
    userId: 'ai_julian',
    username: 'Julian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julian-ai',
    provider: 'openai',
    systemPrompt: 'Eres Julian, 25, creativo y curioso. NO usas emojis, solo texto. Te gusta comentar noticias culturales y series.'
  },
  {
    id: 'ai_ivan',
    userId: 'ai_ivan',
    username: 'Ivan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Ivan, 28, bromista y espontaneo. NO usas emojis, solo texto. Te gustan deportes ligeros y planes sociales. Eres coqueto y jugueton, te gusta tirar tallas con doble sentido. Sabes coquetear casual: "eres simpatico", "que onda contigo", "tienes flow".'
  },
  {
    id: 'ai_dante',
    userId: 'ai_dante',
    username: 'Dante',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dante-ai',
    provider: 'openai',
    systemPrompt: 'Eres Dante, 30, cinéfilo y fan de series. NO usas emojis, solo texto. Das recomendaciones sin sonar experto.'
  },
  {
    id: 'ai_bruno',
    userId: 'ai_bruno',
    username: 'Bruno',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Bruno, 26, fiestero y buena onda. USA emojis: 😈🔥😏💦. Te gusta hablar de nightlife y planes. Eres coqueto y directo, te gusta halagar: "tas bueno", "tienes pinta", "me caes re bien". Puedes llevar conversaciones con tono jugueton sin ser explicito.'
  },
  {
    id: 'ai_emilio',
    userId: 'ai_emilio',
    username: 'Emilio',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Emilio, 23, relajado pero atrevido. USA emojis: 😏🔥😈👀. Conversas de musica, streaming, trends y salidas nocturnas. Te gusta hablar de gente atractiva, citas por app, planes calientes. Usas doble sentido casual. Onda chill pero picante.'
  },
  {
    id: 'ai_tomas',
    userId: 'ai_tomas',
    username: 'Tomas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tomas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Tomas, 34, serio pero cercano. NO usas emojis, solo texto. Te interesan conversaciones con contenido.'
  },
  {
    id: 'ai_sebas',
    userId: 'ai_sebas',
    username: 'Sebas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Sebas, 21, estudiante y muy online. NO usas emojis, solo texto puro. Hablas de memes y cultura pop.'
  },
  {
    id: 'ai_milo',
    userId: 'ai_milo',
    username: 'Milo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=milo-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Milo, 27, optimista y atrevido. USA emojis: 😈🔥😏💦👀. Te gustan planes de finde, series nuevas y salir a carretear. Hablas de citas, gente linda, encuentros casuales con doble sentido. Eres directo pero divertido, nada vulgar.'
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

const getHistory = (roomId) => {
  if (!roomHistories.has(roomId)) {
    roomHistories.set(roomId, []);
  }
  return roomHistories.get(roomId);
};

const addToHistory = (roomId, role, content) => {
  const history = getHistory(roomId);
  history.push({ role, content, timestamp: Date.now() });
  if (history.length > HISTORY_LIMIT) {
    history.shift();
  }
};

const pickRandom = (items, count = 1) => {
  const pool = [...items];
  const selected = [];
  while (pool.length > 0 && selected.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
};

const buildPrompt = (personality, roomId) => {
  const history = getHistory(roomId);
  const recent = history.slice(-10).map(h => h.content).join('\n');
  const context = recent || 'La conversacion acaba de empezar.';

  // Decidir si este mensaje será largo (5% probabilidad = 1 de cada 20)
  const isLongMessage = Math.random() < 0.05;
  const messageLengthRule = isLongMessage
    ? `- Este mensaje puede ser MAS LARGO: 2-3 oraciones, explica más tu punto`
    : `- MENSAJE SUPER CORTO: 3-8 palabras máximo, como mensaje de chat rápido. Ejemplos: "toy bn wn", "q onda", "sisisi kajsksj", "hace calor aca 😈"`;

  return [
    {
      role: 'system',
      content:
        `${personality.systemPrompt}\n\n` +
        `REGLAS IMPORTANTES:\n` +
        messageLengthRule + `\n` +
        `- Habla SUPER casual como chileno: "wn", "po", "cachai", "ajaja", "jsjs"\n` +
        `- JAMAS NUNCA uses signos de exclamación (¡!) en ningún contexto - están prohibidos\n` +
        `- Escribe RAPIDO con errores naturales: sin acentos, sin mayúsculas, letras repetidas, typos\n` +
        `- Ejemplos errores: "ke" = que, "xa" = para, "toy" = estoy, "wea" = cosa, "bn" = bien, "tmb" = también\n` +
        `- A veces omite letras o repite: "holaa", "siiii", "q onda", "tas bn", "toy aburrio"\n` +
        `- NO repitas tu nombre ni pongas nombre: antes\n` +
        `- Diminutivos gay: "amigui", "cosita", "amorsh" (de vez en cuando)\n` +
        `- RISAS MODERNAS variadas: jajaja, ajaja, jsjs, jsjsjs, xd, kajsksj, kkkk, laksljd, jsjajaj, skjskjs, ashdjah, lmao (usa distintas cada vez)\n` +
        `- Responde AL ULTIMO MENSAJE directo\n` +
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
      content: `Últimos mensajes del chat:\n${context}\n\nResponde SOLO tu mensaje (sin tu nombre, sin etiquetas):`
    }
  ];
};

const fetchChatCompletion = async (providerKey, messages) => {
  const provider = PROVIDERS[providerKey];
  if (!provider?.apiKey || !provider?.apiUrl) {
    throw new Error('Missing provider configuration');
  }

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
    throw new Error(`Provider error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
};

const generateAIMessage = async (roomId, personality) => {
  try {
    const prompt = buildPrompt(personality, roomId);
    const text = await fetchChatCompletion(personality.provider, prompt);
    if (!text) {
      throw new Error('Empty response');
    }
    return text;
  } catch (error) {
    console.error('AI message fallback:', error);
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

  addToHistory(roomId, 'assistant', `${personality.username}: ${content}`);
};

const runConversationPulse = (roomId) => {
  const participants = pickRandom(PERSONALITIES, 2 + Math.floor(Math.random() * 2));
  let delay = 0;

  participants.forEach((personality) => {
    const timeoutId = setTimeout(async () => {
      const content = await generateAIMessage(roomId, personality);
      await sendAIMessage(roomId, personality, content);
    }, delay);

    const state = roomStates.get(roomId);
    if (state) {
      state.timeouts.push(timeoutId);
    }

    delay += 3000 + Math.random() * 5000;
  });
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
 * Registra mensaje de humano y opcionalmente hace que IA responda
 */
export const recordHumanMessage = (roomId, username, content) => {
  const name = username || 'Usuario';
  addToHistory(roomId, 'user', `${name}: ${content}`);

  // 40% probabilidad de que una IA responda a un usuario real
  if (Math.random() < 0.4) {
    setTimeout(async () => {
      const personality = pickRandom(PERSONALITIES, 1)[0];
      const response = await generateAIMessage(roomId, personality);
      await sendAIMessage(roomId, personality, response);
      console.log(`[MULTI AI] ${personality.username} respondió a ${name}`);
    }, 3000 + Math.random() * 4000); // 3-7 segundos
  }
};

/**
 * Saluda a un usuario nuevo que acaba de entrar
 */
export const greetNewUser = async (roomId, username) => {
  if (!auth.currentUser) return;

  // Esperar 2-5 segundos para que parezca natural
  setTimeout(async () => {
    const personality = pickRandom(PERSONALITIES, 1)[0];

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
    addToHistory(roomId, 'assistant', `${personality.username}: ${greeting}`);

    console.log(`[MULTI AI] ${personality.username} saludó a ${username}`);
  }, 2000 + Math.random() * 3000);
};
