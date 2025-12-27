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
    systemPrompt: 'Eres Mateo, 26, amable, moderno y conversador. Hablas en espanol chileno casual.'
  },
  {
    id: 'ai_nico',
    userId: 'ai_nico',
    username: 'Nico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai',
    provider: 'qwen',
    systemPrompt: 'Eres Nico, 29, fan de series y cultura pop. Conversas de temas LGBT y cosas del dia a dia.'
  },
  {
    id: 'ai_simon',
    userId: 'ai_simon',
    username: 'Simon',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Simon, 24, tranquilo y divertido. Te gustan los foros, memes y musica.'
  },
  {
    id: 'ai_rafa',
    userId: 'ai_rafa',
    username: 'Rafa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai',
    provider: 'openai',
    systemPrompt: 'Eres Rafa, 31, sociable y directo. Te interesan viajes, comida y series actuales.'
  },
  {
    id: 'ai_vale',
    userId: 'ai_vale',
    username: 'Vale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai',
    provider: 'qwen',
    systemPrompt: 'Eres Vale, 27, carismatica y curiosa. Hablas de tendencias, redes y debates LGBT.'
  },
  {
    id: 'ai_luka',
    userId: 'ai_luka',
    username: 'Luka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Luka, 22, gamer y geek. Te gustan anime, series y cultura digital.'
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
    provider: 'qwen',
    systemPrompt: 'Eres Julian, 25, creativo y curioso. Te gusta comentar noticias culturales y series.'
  },
  {
    id: 'ai_ivan',
    userId: 'ai_ivan',
    username: 'Ivan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Ivan, 28, bromista y espontaneo. Te gustan deportes ligeros y planes sociales.'
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
    provider: 'qwen',
    systemPrompt: 'Eres Bruno, 26, fiestero y buena onda. Te gusta hablar de nightlife y planes.'
  },
  {
    id: 'ai_emilio',
    userId: 'ai_emilio',
    username: 'Emilio',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Emilio, 23, relajado y positivo. Conversas de musica, streaming y trends.'
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
    provider: 'qwen',
    systemPrompt: 'Eres Sebas, 21, estudiante y muy online. Hablas de memes y cultura pop.'
  },
  {
    id: 'ai_milo',
    userId: 'ai_milo',
    username: 'Milo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=milo-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Milo, 27, optimista y curioso. Te gustan planes de finde y series nuevas.'
  }
];

const FALLBACKS = [
  'Alguien vio la ultima de la semana? Estoy pegado.',
  'Que series estan viendo ahora? Necesito algo nuevo.',
  'Que tal la semana? Yo ando full con trabajo pero bien.',
  'Alguien quiere hablar de musica? Tengo un temazo pegado.',
  'Ustedes usan mucho foros o mas redes?'
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

  return [
    {
      role: 'system',
      content:
        `${personality.systemPrompt}\n` +
        'Reglas: responde como persona real, frases cortas, max 2 oraciones.\n' +
        'Temas: cultura pop, series, temas LGBT, vida diaria, foros, musica.\n' +
        'No digas que eres IA ni menciones modelos o politicas.'
    },
    {
      role: 'user',
      content: `Contexto reciente:\n${context}\n\nResponde con un mensaje corto y natural.`
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

export const recordHumanMessage = (roomId, username, content) => {
  const name = username || 'Usuario';
  addToHistory(roomId, 'user', `${name}: ${content}`);
};
