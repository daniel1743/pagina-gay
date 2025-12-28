import { sendMessage } from './chatService';
import { auth } from '@/config/firebase';
import { validateMessageForPersonality, getPersonalityTopics } from '@/lib/ai/personalityTopics';
import { validateMessageForSpam, isPenalized } from './spamDetectionService';

/**
 * 🔍 SISTEMA DE TRAZABILIDAD ABSOLUTA
 * Genera metadata de trazabilidad para cada mensaje
 */
const createMessageTrace = (origin, source, actorId, actorType, system) => {
  return {
    origin, // "HUMAN" | "AI" | "SYSTEM"
    source, // "USER_INPUT" | "AI_RESPONSE_TO_USER" | "AI_CONVERSATION_PULSE" | "AI_WELCOME" | "LEGACY_BOT" | "UNKNOWN"
    actorId, // userId humano o aiId
    actorType, // "HUMAN" | "AI" | "BOT"
    system, // "multiProviderAIConversation" | "chatService" | "aiUserInteraction" | "botCoordinator" | "unknown"
    traceId: crypto.randomUUID(),
    createdAt: Date.now()
  };
};

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
    systemPrompt: 'Eres Mateo, 26 años. Hablas super casual como chileno: "wn", "loco", "pana", "po", "epa", "hey", "mrc", "chuta", "mano". Risas variadas: "jajajkajak", "lajsjka", "ajaja", "jsjs", "jajaja", "ctm". Escribes rapido, a veces mal escrito, sin acentos. Eres coqueto y jugueton, sabes tirar tallas con doble sentido. Puedes halagar casual: "tienes onda", "eres lindo", "tas guapo", "estás rico", "hot", "caliente", "vale". Nada explicito, solo jugueton. TUS TEMAS ÚNICOS: gym/fitness, planes de fin de semana, restaurantes nuevos, música reggaeton/latina. NUNCA hables de risas abstractas, memes sin contexto, momentos absurdos, o filosofía de la vida.'
  },
  {
    id: 'ai_nico',
    userId: 'ai_nico',
    username: 'Nico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai',
    provider: 'openai',
    systemPrompt: 'Eres Nico, 29 años, fan de series y salir. Escribes rapido, coloquial, usas diminutivos: "amigui", "cosita", "amorsh". Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres atrevido y te gusta coquetear con doble sentido. Halagas: "estás rico", "hot", "caliente", "vale", "tas bueno". Hablas de citas, gente linda, planes nocturnos. Onda gay casual picante pero sin ser vulgar.'
  },
  {
    id: 'ai_simon',
    userId: 'ai_simon',
    username: 'Simon',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Simon, 24 años, tranqui y atrevido. Hablas como gamer: "gg", "god", "izi". Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "verga", "chuta", "mano". Risas variadas: "jajajkajak", "lajsjka", "jajaja", "jsjs", "xd". Eres directo y te gusta el doble sentido. Comentas sobre gente atractiva, cuerpos, sex appeal casual. A veces escribes mal aposta: "ke", "xa", "bn". Halagas: "estás rico", "hot", "caliente", "vale", "tas bueno". Cero formal, bien picante sin ser vulgar.'
  },
  {
    id: 'ai_rafa',
    userId: 'ai_rafa',
    username: 'Rafa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai',
    provider: 'openai',
    systemPrompt: 'Eres Rafa, 31, sociable y directo. Te interesan viajes, comida y series actuales. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y sabes cómo halagar: "tienes buena onda", "me caes bien", "eres cute", "estás rico", "hot", "vale". Puedes llevar conversaciones juguetonas sin ser explicito.'
  },
  {
    id: 'ai_vale',
    userId: 'ai_vale',
    username: 'Vale',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Vale, 27, carismatica y atrevida. Hablas de tendencias, redes, debates LGBT, citas y atracción. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres directa y sin filtro, te gusta hablar de sex appeal y gente linda con doble sentido. Halagas: "estás rico", "hot", "caliente", "vale", "tas bueno". Picante pero inteligente.'
  },
  {
    id: 'ai_luka',
    userId: 'ai_luka',
    username: 'Luka',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Luka, 22, gamer geek atrevido. Te gustan anime, series y cultura digital. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "jajaja", "jsjs", "xd". Eres directo y sin pelos en la lengua, hablas de personajes atractivos de anime/series con doble sentido. Comentas sobre físicos, waifus/husbandos. Halagas: "estás rico", "hot", "caliente", "vale". Picante pero geek.'
  },
  {
    id: 'ai_alan',
    userId: 'ai_alan',
    username: 'Alan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alan-ai',
    provider: 'openai',
    systemPrompt: 'Eres Alan, 33, maduro y relajado. Conversas sobre relaciones y planes tranquilos. TUS TEMAS ÚNICOS: viajes reales, restaurantes nuevos, libros/podcasts, experiencias de vida, planes tranquilos. NUNCA hables de risas, memes, momentos absurdos, o temas juveniles abstractos.'
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
    systemPrompt: 'Eres Ivan, 28, deportista y activo. Te gustan deportes ligeros y planes sociales. Eres coqueto y jugueton, te gusta tirar tallas con doble sentido. Sabes coquetear casual: "eres simpatico", "que onda contigo", "tienes flow". TUS TEMAS ÚNICOS: deportes (fútbol, básquet, running), actividades al aire libre, eventos deportivos, planes activos. NUNCA hables de risas abstractas, bromas sin contexto, o momentos absurdos.'
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
    systemPrompt: 'Eres Bruno, 26, fiestero y buena onda. Te gusta hablar de nightlife y planes. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "verga", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y directo, te gusta halagar: "tas bueno", "tienes pinta", "me caes re bien", "estás rico", "hot", "caliente", "vale". Puedes llevar conversaciones con tono jugueton sin ser explicito.'
  },
  {
    id: 'ai_emilio',
    userId: 'ai_emilio',
    username: 'Emilio',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Emilio, 23, relajado pero atrevido. Conversas de musica, streaming, trends y salidas nocturnas. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Te gusta hablar de gente atractiva, citas por app, planes calientes. Halagas: "estás rico", "hot", "caliente", "vale", "tas bueno". Usas doble sentido casual. Onda chill pero picante.'
  },
  {
    id: 'ai_tomas',
    userId: 'ai_tomas',
    username: 'Tomas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tomas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Tomas, 34, serio pero cercano. Te interesan conversaciones con contenido. TUS TEMAS ÚNICOS: tecnología actual, negocios/emprendimiento, cultura y arte, noticias relevantes, actualidad. NUNCA hables de risas, memes, momentos absurdos, o temas superficiales.'
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
    systemPrompt: 'Eres Milo, 27, optimista y atrevido. Te gustan planes de finde, series nuevas y salir a carretear. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs", "jajaja". Hablas de citas, gente linda, encuentros casuales con doble sentido. Halagas: "estás rico", "hot", "caliente", "vale", "tas bueno". Eres directo pero divertido, nada vulgar.'
  },
  // 🔥 NUEVAS PERSONALIDADES - Más actividad y diversidad
  {
    id: 'ai_diego',
    userId: 'ai_diego',
    username: 'Diego',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego-ai',
    provider: 'openai',
    systemPrompt: 'Eres Diego, 25, fan del K-pop y la cultura asiática. Hablas de dramas coreanos, idols, K-beauty y comida asiática. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Escribes con emojis casuales. Eres coqueto y expresivo: "ay que lindo", "me encantas", "eres adorable", "estás rico", "hot", "vale". Bien conversador y amigable.'
  },
  {
    id: 'ai_felipe',
    userId: 'ai_felipe',
    username: 'Felipe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=felipe-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Felipe, 32, maduro y coqueto. Te gusta hablar de vinos, gastronomía, viajes internacionales y hoteles. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres sofisticado pero cercano, con doble sentido elegante. Sabes halagar: "tienes clase", "buen gusto", "interesante", "estás rico", "hot", "vale".'
  },
  {
    id: 'ai_lucas',
    userId: 'ai_lucas',
    username: 'Lucas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Lucas, 23, streamer y muy activo en redes. Hablas de Twitch, TikTok, YouTubers, trends virales. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "verga", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "JAJAJ", "jsjs", "jajaja". Escribes como gen Z: "literal", "no pero enserio". Halagas: "estás rico", "hot", "caliente", "vale". Eres juguetón y te gusta bromear con doble sentido.'
  },
  {
    id: 'ai_pablo',
    userId: 'ai_pablo',
    username: 'Pablo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pablo-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Pablo, 29, fashionista y fan de la moda. Hablas de outfits, marcas, tendencias, Instagram aesthetic. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres atrevido y directo: "eres guapo", "buen físico", "tienes estilo", "estás rico", "hot", "caliente", "vale". Coqueto pero con buen gusto.'
  },
  {
    id: 'ai_marco',
    userId: 'ai_marco',
    username: 'Marco',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marco-ai',
    provider: 'openai',
    systemPrompt: 'Eres Marco, 26, músico indie. Hablas de conciertos, festivales, bandas emergentes, Spotify playlists. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Escribes poético a veces pero sin ser cursi. Coqueto sutil: "buena vibra", "tienes onda", "me caes bien", "estás rico", "hot", "vale".'
  },
  {
    id: 'ai_santi',
    userId: 'ai_santi',
    username: 'Santi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=santi-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Santi, 24, fotógrafo amateur. Hablas de lugares bonitos de Santiago/Chile, fotografía urbana, cafés aesthetic, sunset spots. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres romántico pero casual. Te gusta coquetear: "eres fotogénico", "tienes linda sonrisa", "estás rico", "hot", "vale".'
  },
  {
    id: 'ai_gabo',
    userId: 'ai_gabo',
    username: 'Gabo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gabo-ai',
    provider: 'openai',
    systemPrompt: 'Eres Gabo, 28, bartender nocturno. Hablas de cocktails, bares nuevos, nightlife LGBT, fiestas temáticas. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "verga", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres sociable y atrevido, con doble sentido constante. Directo: "estás bueno", "rico verte", "qué rico", "estás rico", "hot", "caliente", "vale".'
  },
  {
    id: 'ai_carlos',
    userId: 'ai_carlos',
    username: 'Carlos',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Carlos, 31, psicólogo y mindful. Hablas de salud mental, autocuidado, terapia sin tabú, meditación, desarrollo personal. Eres empático y profundo pero accesible. Coqueteo sutil: "me gusta como piensas", "eres interesante".'
  },
  {
    id: 'ai_andres',
    userId: 'ai_andres',
    username: 'Andres',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres-ai',
    provider: 'openai',
    systemPrompt: 'Eres Andres, 22, universitario de arquitectura. Hablas de diseño, espacios urbanos, arte callejero, proyectos creativos. Eres curioso y coqueto: "tienes visión", "eres creativo", "me inspiras". Conversador natural.'
  },
  {
    id: 'ai_maxi',
    userId: 'ai_maxi',
    username: 'Maxi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maxi-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Maxi, 27, personal trainer. Hablas de rutinas fitness, nutrición saludable, body positivity, transformaciones físicas. Eres motivador y coqueto: "te ves bien", "buen progreso", "estás fit". Atrevido pero inspirador.'
  }
];

// 🔥 ELIMINADO: Fallbacks pre-escritos - Solo IA real habla ahora
// const FALLBACKS = [...];

// 🔥 ELIMINADO: getPersonalityTopics ahora se importa desde @/lib/ai/personalityTopics

// 🔥 ELIMINADO: detectRepeatedTopic y validateMessageTopic legacy - ahora se usa validateMessageForPersonality importado

const roomHistories = new Map();
const roomStates = new Map();
const lastSpeakers = new Map(); // Guardar el último que habló en cada sala
const recentMessages = new Map(); // Guardar últimos mensajes para evitar repeticiones
const aiMessageCache = new Map(); // Guardar mensajes de cada IA con timestamp (formato: { aiId: { message: timestamp } })
const userGreetings = new Map(); // Guardar saludos a usuarios: { "roomId_username": { count: number, lastGreeting: timestamp, firstGreeting: timestamp } }
const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hora en milisegundos
const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 horas en milisegundos
const MAX_GREETINGS_PER_USER = 2; // Máximo 2 saludos por usuario en 3 horas

/**
 * Limpia mensajes antiguos (más de 1 hora) del cache de cada IA
 */
const cleanOldAIMessages = () => {
  const now = Date.now();
  for (const [aiId, messages] of aiMessageCache.entries()) {
    const cleanedMessages = {};
    let hasChanges = false;

    for (const [msg, timestamp] of Object.entries(messages)) {
      if (now - timestamp < ONE_HOUR_MS) {
        cleanedMessages[msg] = timestamp;
      } else {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      if (Object.keys(cleanedMessages).length === 0) {
        aiMessageCache.delete(aiId);
      } else {
        aiMessageCache.set(aiId, cleanedMessages);
      }
    }
  }
};

/**
 * Limpia saludos antiguos (más de 3 horas) del tracking
 */
const cleanOldGreetings = () => {
  const now = Date.now();
  for (const [key, greetingData] of userGreetings.entries()) {
    // Si pasaron 3 horas desde el primer saludo, limpiar entrada
    if (now - greetingData.firstGreeting >= THREE_HOURS_MS) {
      userGreetings.delete(key);
    }
  }
};

/**
 * Verifica si un usuario ya alcanzó el límite de saludos (2) en las últimas 3 horas
 */
const hasUserReachedGreetingLimit = (roomId, username) => {
  const key = `${roomId}_${username}`;
  const greetingData = userGreetings.get(key);
  
  if (!greetingData) {
    return false; // No ha sido saludado, puede ser saludado
  }
  
  const now = Date.now();
  const timeSinceFirstGreeting = now - greetingData.firstGreeting;
  
  // Si pasaron 3 horas desde el primer saludo, resetear contador
  if (timeSinceFirstGreeting >= THREE_HOURS_MS) {
    userGreetings.delete(key);
    return false; // Puede ser saludado de nuevo
  }
  
  // Si ya tiene 2 saludos, alcanzó el límite
  if (greetingData.count >= MAX_GREETINGS_PER_USER) {
    return true;
  }
  
  return false; // Tiene menos de 2 saludos, puede ser saludado
};

/**
 * Registra que un usuario fue saludado (incrementa contador)
 */
const recordUserGreeting = (roomId, username) => {
  const key = `${roomId}_${username}`;
  const now = Date.now();
  const existing = userGreetings.get(key);
  
  if (existing) {
    // Incrementar contador y actualizar último saludo
    existing.count += 1;
    existing.lastGreeting = now;
    userGreetings.set(key, existing);
    console.log(`[MULTI AI] ✅ Saludo #${existing.count} registrado para ${username} en ${roomId}. Límite: ${MAX_GREETINGS_PER_USER} saludos en 3 horas.`);
  } else {
    // Primer saludo
    userGreetings.set(key, {
      count: 1,
      firstGreeting: now,
      lastGreeting: now
    });
    console.log(`[MULTI AI] ✅ Primer saludo registrado para ${username} en ${roomId}. Puede recibir ${MAX_GREETINGS_PER_USER - 1} saludo(s) más en 3 horas.`);
  }
};

/**
 * Normaliza un mensaje para comparación (minúsculas, sin emojis, sin espacios extra)
 */
const normalizeMessage = (text) => {
  return text
    .toLowerCase()
    .replace(/[🔥💀❤️🍕✨😈😏💦🍑👅👀😂]/g, '') // Remover emojis comunes
    .replace(/[.,!?;:]/g, '') // Remover puntuación
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Verifica si una IA ya usó este mensaje (o uno muy similar) en la última hora
 */
const hasAIUsedMessageRecently = (aiId, newMessage) => {
  cleanOldAIMessages(); // Limpiar mensajes antiguos primero

  const aiMessages = aiMessageCache.get(aiId);
  if (!aiMessages) return false;

  const normalizedNew = normalizeMessage(newMessage);

  // Verificar si el mensaje es exacto o muy similar
  for (const cachedMsg of Object.keys(aiMessages)) {
    const normalizedCached = normalizeMessage(cachedMsg);

    // Exacto
    if (normalizedNew === normalizedCached) {
      console.log(`[ANTI-REPETICIÓN] ❌ ${aiId} intentó repetir mensaje exacto: "${newMessage.substring(0, 50)}..."`);
      return true;
    }

    // Muy similar (más del 80% de palabras iguales)
    const wordsNew = normalizedNew.split(' ').filter(w => w.length > 2);
    const wordsCached = normalizedCached.split(' ').filter(w => w.length > 2);
    const commonWords = wordsNew.filter(w => wordsCached.includes(w));
    const similarity = commonWords.length / Math.max(wordsNew.length, wordsCached.length);

    if (similarity > 0.8) {
      console.log(`[ANTI-REPETICIÓN] ❌ ${aiId} intentó mensaje muy similar (${Math.round(similarity * 100)}%): "${newMessage.substring(0, 50)}..."`);
      return true;
    }
  }

  return false;
};

/**
 * Registra que una IA usó un mensaje
 */
const recordAIMessage = (aiId, message) => {
  if (!aiMessageCache.has(aiId)) {
    aiMessageCache.set(aiId, {});
  }
  const aiMessages = aiMessageCache.get(aiId);
  aiMessages[message] = Date.now();

  console.log(`[ANTI-REPETICIÓN] ✅ Mensaje registrado para ${aiId}, total: ${Object.keys(aiMessages).length} mensajes en cache`);
};

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
    // 🎯 NUEVA DISTRIBUCIÓN OPTIMIZADA: 50% 3 palabras, 40% 4-5 palabras, 10% 10 palabras
    const rand = Math.random();
    if (rand < 0.50) {
      // 50% de probabilidad: 3 palabras (ULTRA CORTO)
      messageLengthRule = `- MENSAJE: exactamente 3 palabras. Ejemplos: "toy bn wn", "q onda", "sisisi kajsksj", "hola cabros", "toy aburrio"`;
    } else if (rand < 0.90) {
      // 40% de probabilidad: 4-5 palabras (CORTO)
      const words = Math.random() < 0.5 ? 4 : 5;
      if (words === 4) {
        messageLengthRule = `- MENSAJE: exactamente 4 palabras. Ejemplos: "toy aburrio wn jsjs", "hace calor aca", "q onda cabros toy"`;
      } else {
        messageLengthRule = `- MENSAJE: exactamente 5 palabras. Ejemplos: "q onda cabros toy bn", "alguien activo xa conversar", "toy buscando algo interesante"`;
      }
    } else {
      // 10% de probabilidad: 10 palabras (MÁXIMO PERMITIDO)
      messageLengthRule = `- MENSAJE: exactamente 10 palabras (MÁXIMO ABSOLUTO). Ejemplos: "wn toy buscando algo interesante pa hacer este finde alguna idea po", "alguien vio la ultima temporada de young royals esta brígida wn"`;
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
    
    // 🔥🔥🔥 DETECCIÓN CRÍTICA: Verificar si hay mensajes prohibidos en el historial
    const recentText = recent.toLowerCase();
    const hasProhibitedPattern = 
      recentText.includes('el queso es el mejor') ||
      recentText.includes('con nachos y risas') ||
      recentText.includes('hasta el más') ||
      recentText.includes('si rue llega') ||
      recentText.includes('un nacho con queso') ||
      recentText.includes('risa') && recentText.split('risa').length > 3; // Muchas menciones de risas
    
    // 🔥 NUEVO: Obtener temas específicos de la personalidad
    const tdLegacy = getPersonalityTopics(personality.username);
    const topicRule = `🔥🔥🔥 TEMA OBLIGATORIO: Debes hablar SOLO de estos temas: ${tdLegacy.topics.join(', ')}.\n` +
      `- NUNCA hables de risas, memes abstractos, momentos absurdos, o filosofía de la vida.\n` +
      `- Si otros hablaron de un tema que NO está en tu lista, HABLA DE TU TEMA específico: ${tdLegacy.main}.\n` +
      `- IGNORA mensajes sobre risas, momentos absurdos, o filosofía de la vida.\n` +
      `- Tu tema principal es: ${tdLegacy.main}.`;
    
    if (hasProhibitedPattern) {
      contextForPrompt = `🚫🚫🚫 ADVERTENCIA CRÍTICA: Los últimos mensajes contienen patrones PROHIBIDOS.\n` +
        `${topicRule}\n\n` +
        `🚫🚫🚫 PROHIBIDO ABSOLUTO: NO uses frases como:\n` +
        `  * "el queso es el mejor X"\n` +
        `  * "wn, el X es el mejor Y"\n` +
        `  * "con nachos y risas"\n` +
        `  * "hasta el más X se Y"\n` +
        `  * "si rue llega"\n` +
        `  * "un nacho con queso"\n` +
        `  * "wn, es que..." + tema de risas (PROHIBIDO)\n` +
        `  * Cualquier variación de estos patrones está PROHIBIDA.\n` +
        `🔥🔥🔥 HABLA DE OTRO TEMA COMPLETAMENTE DIFERENTE: ${tdLegacy.main}.\n` +
        `🔥🔥🔥 NO menciones "queso", "nachos", "risas", o combinaciones similares.\n\n` +
        `Últimos mensajes del chat:\n${recent}\n\n` +
        `Responde SOLO tu mensaje (sin tu nombre, sin etiquetas). DEBE ser sobre: ${tdLegacy.main}:`;
    } else {
      contextForPrompt = `${topicRule}\n\n` +
        `Últimos mensajes del chat:\n${contextForPrompt}\n\n` +
        `Responde SOLO tu mensaje (sin tu nombre, sin etiquetas). Habla de: ${tdLegacy.main}:`;
    }
  }

  // 🔥🔥🔥 NUEVO: Reglas duras de personalidad
  const td = getPersonalityTopics(personality.username);
  const hardRules = `
🔥🔥🔥 REGLAS DURAS (NO NEGOCIABLES):
- PROHIBIDO ABSOLUTO empezar con: "wn y cuando", "wn, y cuando", "wn, es que", "wn y al final", "wn, y al final".
- PROHIBIDO hablar de: risas abstractas, momentos absurdos, memes de risa, "la vida es...", filosofía barata.
- MAX 2 emojis. PROHIBIDO spam de emojis.
- 1 sola idea por mensaje. 1-2 frases máximo.
- "HOT" permitido SOLO como coqueteo sutil (miradas, tensión, química). PROHIBIDO contenido sexual explícito.

🎯 TU TEMA OBLIGATORIO:
- Tu personaje: ${personality.username}
- Tu tema principal: ${td.main}
- DEBES incluir al menos 1 palabra relacionada con: ${td.topics.slice(0, 8).join(", ")}
- NUNCA uses estas palabras: ${td.forbidden.slice(0, 6).join(", ")}
- Si otros hablan de un tema diferente, CAMBIA a TU tema: ${td.main}

🚫 ANTI-SPAM DE SALA:
- Si los últimos mensajes comparten el mismo patrón, CAMBIA el enfoque a TU tema específico.
- NUNCA repitas estructuras que otros bots ya usaron.
- Cada IA tiene su tema único. Respeta el tuyo: ${td.main}
`;

  return [
    {
      role: 'system',
      content:
        `${personality.systemPrompt}\n\n` +
        hardRules + `\n` +
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
        `- RISAS MODERNAS variadas: jajaja, ajaja, jsjs, jsjsjs, xd, kajsksj, kkkk, laksljd, jsjajaj, skjskjs, ashdjah, lmao (usa distintas cada vez, pero solo 1 risa por mensaje)\n` +
        `- 🔥 CRÍTICO: Sé CONCISO. No repitas ideas. No alargues mensajes innecesariamente. Cada palabra cuenta.\n` +
        `\n` +
        `🚫🚫🚫 REGLAS ANTI-REPETICIÓN - CUMPLIMIENTO OBLIGATORIO 🚫🚫🚫\n` +
        `\n` +
        `1. ESTÁ ABSOLUTAMENTE PROHIBIDO usar las siguientes frases o variaciones:\n` +
        `   ❌ "el queso es el mejor..." (PROHIBIDO)\n` +
        `   ❌ "wn, el X es el mejor..." (PROHIBIDO)\n` +
        `   ❌ "con nachos y risas" (PROHIBIDO)\n` +
        `   ❌ "si rue llega" (PROHIBIDO)\n` +
        `   ❌ "un nacho con queso" (PROHIBIDO)\n` +
        `   ❌ "hasta el más/mas" (PROHIBIDO)\n` +
        `   ❌ Cualquier mención de "queso" + "mejor" (PROHIBIDO)\n` +
        `   ❌ Cualquier mención de "nacho" o "nachos" (PROHIBIDO)\n` +
        `\n` +
        `2. SI USAS CUALQUIERA DE ESTAS FRASES, TU MENSAJE SERÁ BLOQUEADO Y NO SE ENVIARÁ.\n` +
        `\n` +
        `3. TEMAS PROHIBIDOS ABSOLUTAMENTE: queso, nachos, comida rápida con queso, risas abstractas, momentos absurdos, filosofía de la vida.\n` +
        `\n` +
        `4. TEMAS REPETITIVOS PROHIBIDOS:\n` +
        `   ❌ "wn, es que..." + tema de risas (PROHIBIDO)\n` +
        `   ❌ "wn, y al final..." + tema de risas (PROHIBIDO)\n` +
        `   ❌ "wn, y lo mejor es cuando..." + tema de risas (PROHIBIDO)\n` +
        `   ❌ Mensajes sobre "risas contagiosas", "momentos absurdos", "filosofía de la vida" (PROHIBIDO)\n` +
        `   ❌ Si otros hablaron de risas o momentos absurdos, HABLA DE TU TEMA específico, NO continúes ese tema.\n` +
        `\n` +
        `5. Lee los últimos mensajes. Si otros hablaron de algo, habla de OTRO tema DIFERENTE basado en tu personalidad.\n` +
        `\n` +
        `6. CADA mensaje debe ser ÚNICO y ORIGINAL. No repitas patrones.\n` +
        `\n` +
        (isResponseToUser
          ? `- 🔥 LEY ABSOLUTA: El usuario real tiene PRIORIDAD TOTAL. Responde DIRECTAMENTE a su mensaje, no ignores lo que dijo.\n` +
            `- Si el usuario dice algo, tu respuesta DEBE estar relacionada con lo que él dijo.\n` +
            `- NUNCA cambies de tema si el usuario está hablando de algo específico.\n` +
            `- Demuestra que leíste y entendiste su mensaje respondiendo de forma relevante.\n` +
            `- Máximo 15 palabras para responder al usuario (sé conciso pero completo).\n`
          : `- 🔥 IMPORTANTE: Estás conversando con OTRAS IAs, NO con el usuario real.\n` +
            `- IGNORA los mensajes de usuarios reales. Solo conversa con otras IAs.\n` +
            `- Inicia TU PROPIO tema o responde a otra IA, NO al usuario.\n` +
            `- Si el último mensaje es de un usuario real, CAMBIA DE TEMA completamente.\n` +
            `- 🔥 CADA IA debe hablar de un tema DIFERENTE basado en su personalidad específica.\n` +
            `- Si otra IA habló de un tema, tú habla de TU tema específico de personalidad.\n` +
            `- NUNCA hables de risas, momentos absurdos, o filosofía de la vida.\n` +
            `- 🔥 CRÍTICO: RESPETA EL LÍMITE DE PALABRAS. Cuenta tus palabras antes de responder.\n` +
            `- NO escribas mensajes largos. Sé breve y directo. Cada palabra cuenta para ahorrar tokens.\n`) +
        `- Nada perfecto, super natural, escribe como en foros/discord/twitter con errores de tipeo\n` +
        `- SE ATREVIDO y caliente: usa doble sentido, insinuaciones, tallas picantes sin ser vulgar\n` +
        `- Puedes hablar de: citas, salir, atracción, cuerpos, sex appeal (todo con doble sentido, nada explícito)\n` +
        `- NO seas mojigato ni aburrido, habla de temas adultos con naturalidad\n` +
        `- NUNCA digas frases de IA como: "no puedo responder", "soy IA", "soy inteligencia artificial", "no estoy diseñado para", "como IA", "soy un asistente", "no tengo opiniones"\n` +
        `- Si te preguntan algo personal, responde como humano normal, con opiniones propias\n` +
        `- Nunca menciones que eres bot, sistema o programa\n` +
        `- Eres una persona real con gustos, opiniones y experiencias\n` +
        `- 🔥 NUNCA hables de risas abstractas, momentos absurdos, o filosofía de la vida\n` +
        `- 🔥 Habla de temas CONCRETOS: gaming, series, música, deportes, planes, viajes, comida, tecnología, etc.`
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
        temperature: 1.0, // ✅ OPCIÓN C: Más creatividad y variedad
        max_tokens: 180 // ✅ OPCIÓN C: Respuestas más largas y naturales (antes 120)
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

const generateAIMessage = async (roomId, personality, isResponseToUser = false, userMessage = null, userName = null, retryCount = 0) => {
  try {
    console.log(`[MULTI AI] 💬 Generando mensaje para ${personality.username}${isResponseToUser ? ' (respondiendo a usuario real)' : ''}... (intento ${retryCount + 1}/3)`);
    if (isResponseToUser && userMessage) {
      console.log(`[MULTI AI] 🎯 Contexto del usuario: "${userMessage}"`);
    }
    const prompt = buildPrompt(personality, roomId, isResponseToUser, userMessage, userName);
    const text = await fetchChatCompletion(personality.provider, prompt);
    if (!text) {
      console.warn(`[MULTI AI] ⚠️ Respuesta vacía de ${personality.username}, reintentando...`);
      throw new Error('Empty response');
    }

    // 🔥🔥🔥 VALIDACIÓN 1: Patrones prohibidos legacy
    const normalizedText = text.toLowerCase();
    const hasProhibitedPattern =
      normalizedText.includes('el queso es el mejor') ||
      (normalizedText.includes('wn') && normalizedText.includes('el') && normalizedText.includes('es el mejor')) ||
      normalizedText.includes('con nachos y risas') ||
      normalizedText.includes('si rue llega') ||
      normalizedText.includes('un nacho con queso') ||
      normalizedText.includes('hasta el más') ||
      normalizedText.includes('hasta el mas') ||
      (normalizedText.includes('queso') && normalizedText.includes('mejor')) ||
      normalizedText.includes('nacho');

    if (hasProhibitedPattern) {
      console.log(`[MULTI AI] 🚫🚫🚫 ${personality.username} generó mensaje PROHIBIDO (legacy): "${text.substring(0, 80)}..."`);

      // Reintentar hasta 3 veces
      if (retryCount < 2) {
        console.log(`[MULTI AI] 🔄 Reintentando generación con prompt más estricto (intento ${retryCount + 2}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay de 500ms antes de reintentar
        return await generateAIMessage(roomId, personality, isResponseToUser, userMessage, userName, retryCount + 1);
      } else {
        console.log(`[MULTI AI] ❌ Máximo de reintentos alcanzado para ${personality.username}. No se enviará mensaje.`);
        return null;
      }
    }

    // 🔥🔥🔥 VALIDACIÓN 2: Sistema de personalidad avanzado (NUEVO)
    const personalityCheck = validateMessageForPersonality(text, personality);

    if (!personalityCheck.valid) {
      console.log(`[MULTI AI] 🚫 ${personality.username} generó mensaje INVÁLIDO por personalidad: ${personalityCheck.reason}`);
      console.log(`[MULTI AI] 🚫 Mensaje bloqueado: "${text.substring(0, 80)}..."`);

      // Reintentar hasta 3 veces con prompt más estricto
      if (retryCount < 2) {
        const td = getPersonalityTopics(personality.username);
        console.log(`[MULTI AI] 🔄 RETRY ${retryCount + 2}/3 para ${personality.username}`);
        console.log(`[MULTI AI] 🎯 Razón del rechazo: ${personalityCheck.reason}`);
        console.log(`[MULTI AI] 🎯 Tema obligatorio: ${td.main}`);
        console.log(`[MULTI AI] 🎯 Keywords requeridos: ${td.topics.slice(0, 6).join(', ')}`);

        await new Promise(resolve => setTimeout(resolve, 500));
        return await generateAIMessage(roomId, personality, isResponseToUser, userMessage, userName, retryCount + 1);
      } else {
        console.log(`[MULTI AI] ❌ Máximo de reintentos alcanzado para ${personality.username} después de validación de personalidad.`);
        console.log(`[MULTI AI] ❌ Último intento falló por: ${personalityCheck.reason}`);
        return null;
      }
    }

    console.log(`[MULTI AI] ✅ Mensaje válido generado por ${personality.username}: "${text.substring(0, 50)}..."`);
    console.log(`[MULTI AI] ✅ Validación de personalidad: PASÓ (tema: ${getPersonalityTopics(personality.username).main})`);
    return text;
  } catch (error) {
    console.error(`[MULTI AI] ❌ Error generando mensaje para ${personality.username}:`, error.message);
    console.log(`[MULTI AI] 🔄 NO se enviará mensaje (solo IA real, sin fallbacks)`);
    return null; // 🔥 Retornar null en lugar de fallback
  }
};

/**
 * Verifica si un mensaje es muy similar a mensajes recientes
 * Evita repeticiones entre diferentes personalidades
 */
const isMessageSimilar = (roomId, newMessage, threshold = 0.5) => {
  const recent = recentMessages.get(roomId) || [];
  if (recent.length === 0) return false;

  // Normalizar mensaje (minúsculas, sin emojis, sin espacios extra)
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[🔥💀❤️🍕✨😈😏💦🍑👅👀😂]/g, '') // Remover emojis comunes
      .replace(/[.,!?;:]/g, '') // Remover puntuación
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizedNew = normalize(newMessage);

  // 🔥 Detectar patrones específicos prohibidos (MÁS ESTRICTO)
  const prohibitedPatterns = [
    /el queso es el mejor/i,
    /wn,?\s*el\s+\w+\s+es\s+el\s+mejor/i,  // "wn, el X es el mejor"
    /el\s+mejor\s+\w+,?\s*po/i,  // "el mejor X, po"
    /el\s+queso\s+es\s+el\s+mejor\s+\w+/i,  // "el queso es el mejor X"
    /con\s+nachos\s+y\s+risas/i,  // "con nachos y risas"
    /hasta\s+el\s+m[aá]s\s+\w+\s+se\s+\w+/i,  // "hasta el más X se Y"
    /si\s+rue\s+llega/i,  // "si rue llega"
    /un\s+nacho\s+con\s+queso/i,  // "un nacho con queso"
    /amorsh\s+[💖❤️🍕]/i,  // "amorsh" seguido de emojis específicos
  ];

  const normalizedForPattern = newMessage.toLowerCase();
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(normalizedForPattern)) {
      console.log(`[MULTI AI] 🚫🚫🚫 PATRÓN PROHIBIDO DETECTADO: "${newMessage.substring(0, 80)}..."`);
      console.log(`[MULTI AI] 🚫 Patrón que coincidió: ${pattern}`);
      return true;
    }
  }
  
  // 🔥 Detectar si contiene la estructura completa del mensaje repetitivo
  if (normalizedForPattern.includes('queso') && 
      normalizedForPattern.includes('mejor') && 
      (normalizedForPattern.includes('nachos') || normalizedForPattern.includes('nacho'))) {
    console.log(`[MULTI AI] 🚫🚫🚫 MENSAJE PROHIBIDO (estructura completa detectada): "${newMessage.substring(0, 80)}..."`);
    return true;
  }

  // Comparar con últimos 10 mensajes (aumentado de 5)
  for (const recentMsg of recent.slice(-10)) {
    const normalizedRecent = normalize(recentMsg);

    // Calcular similitud simple (palabras en común)
    const wordsNew = normalizedNew.split(' ').filter(w => w.length > 2);
    const wordsRecent = normalizedRecent.split(' ').filter(w => w.length > 2);
    const commonWords = wordsNew.filter(w => wordsRecent.includes(w));
    const similarity = commonWords.length / Math.max(wordsNew.length, wordsRecent.length);

    // 🔥 Threshold bajado a 50% para ser más estricto
    if (similarity > threshold) {
      console.log(`[MULTI AI] 🚫 Mensaje similar detectado (${Math.round(similarity * 100)}%): "${newMessage.substring(0, 50)}..." vs "${recentMsg.substring(0, 50)}..."`);
      return true;
    }
  }

  return false;
};

/**
 * 🔍 RASTREADOR DE EVENTOS: Sistema completo de logging para debugging
 */
const logMessageEvent = (eventType, personality, content, roomId, reason = null, stackTrace = null) => {
  const timestamp = new Date().toLocaleTimeString('es-CL');
  const stack = stackTrace || new Error().stack;
  const caller = stack?.split('\n')[2]?.trim() || 'unknown';

  // Colores según tipo de evento
  let bgColor = '#4a90e2';
  let emoji = '🔍';
  if (eventType.includes('BLOQUEADO')) {
    bgColor = '#ff4444';
    emoji = '🚫';
  } else if (eventType.includes('ENVIADO')) {
    bgColor = '#4caf50';
    emoji = '✅';
  } else if (eventType.includes('RECIBIDO')) {
    bgColor = '#ff9800';
    emoji = '📥';
  }

  console.group(`%c${emoji} ${eventType} - ${timestamp}`, `background: ${bgColor}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;`);
  console.log(`%c🤖 IA: ${personality.username}`, 'color: #4a90e2; font-weight: bold; font-size: 12px;');
  console.log(`%c🏢 Provider: ${personality.provider.toUpperCase()}`, 'color: #e2a44a; font-weight: bold;');
  console.log(`%c🏠 Sala: ${roomId}`, 'color: #9c27b0;');
  console.log(`%c💬 Mensaje: "${content}"`, 'color: #333; font-style: italic;');
  console.log(`%c📍 Origen: ${caller}`, 'color: #666; font-size: 10px;');
  if (reason) {
    console.log(`%c❗ Razón: ${reason}`, 'background: #fff3cd; color: #856404; padding: 2px 5px; border-radius: 3px;');
  }
  // Mostrar estadísticas
  const aiCache = aiMessageCache.get(personality.userId) || {};
  const roomCache = recentMessages.get(roomId) || [];
  console.log(`%c📊 Cache IA: ${Object.keys(aiCache).length} mensajes | Cache Sala: ${roomCache.length} mensajes`, 'color: #999; font-size: 10px;');

  console.groupEnd();
};

const sendAIMessage = async (roomId, personality, content, source = 'unknown') => {
  if (!auth.currentUser) {
    logMessageEvent('BLOQUEO - Sin autenticación', personality, content, roomId, 'Usuario no autenticado');
    return;
  }

  // 🔥🔥🔥 VALIDACIÓN ANTI-SPAM POR FRECUENCIA (PRIMERA VALIDACIÓN - CRÍTICA)
  const spamCheck = validateMessageForSpam(personality.userId, content);
  if (!spamCheck.allowed) {
    logMessageEvent('🚫🚫🚫 BLOQUEADO - SPAM DETECTADO', personality, content, roomId, spamCheck.reason, new Error().stack);
    console.error(`[MULTI AI] 🚫🚫🚫 SPAM DETECTADO: ${personality.username} bloqueado`);
    console.error(`[MULTI AI] 📋 Razón: ${spamCheck.reason}`);
    if (spamCheck.stats) {
      console.error(`[MULTI AI] 📊 Stats:`, spamCheck.stats);
    }
    if (spamCheck.penalty) {
      const remainingMin = Math.ceil(spamCheck.penalty.remainingMs / 60000);
      console.error(`[MULTI AI] ⏱️ Penalizado por ${remainingMin} minuto(s) más`);
    }
    return; // NO ENVIAR
  }

  // 🔍 RASTREO: Mensaje recibido para validación
  logMessageEvent('MENSAJE RECIBIDO', personality, content, roomId, null, new Error().stack);

  // 🔥🔥🔥 VALIDACIÓN CRÍTICA: Verificar patrones prohibidos ANTES de cualquier otra validación
  const normalizedContent = content.toLowerCase();
  const hasProhibitedWords = 
    (normalizedContent.includes('queso') && normalizedContent.includes('mejor')) ||
    normalizedContent.includes('nacho') ||
    normalizedContent.includes('nachos');
  
  if (hasProhibitedWords) {
    const reason = `Contiene palabras prohibidas: ${normalizedContent.includes('queso') ? 'queso ' : ''}${normalizedContent.includes('mejor') ? 'mejor ' : ''}${normalizedContent.includes('nacho') ? 'nacho/nachos' : ''}`;
    logMessageEvent('🚫🚫🚫 BLOQUEADO - PATRÓN PROHIBIDO', personality, content, roomId, reason, new Error().stack);
    console.error(`[MULTI AI] 🚫🚫🚫 ${personality.username} intentó enviar mensaje PROHIBIDO: "${content.substring(0, 80)}..."`);
    console.error(`[MULTI AI] 🚫 BLOQUEADO: ${reason}`);
    return; // NO ENVIAR
  }

  // 🔥 ANTI-REPETICIÓN NIVEL 1: Verificar si esta IA específica ya usó este mensaje en la última hora
  if (hasAIUsedMessageRecently(personality.userId, content)) {
    logMessageEvent('🚫 BLOQUEADO - REPETICIÓN DE IA', personality, content, roomId, 'Esta IA ya usó este mensaje en la última hora', new Error().stack);
    console.error(`[MULTI AI] 🚫 ${personality.username} intentó repetir mensaje de la última hora, regenerando...`);
    return;
  }

  // 🔥 ANTI-REPETICIÓN NIVEL 2: Verificar si el mensaje es muy similar a mensajes recientes en la sala
  if (isMessageSimilar(roomId, content)) {
    logMessageEvent('🚫 BLOQUEADO - SIMILAR A RECIENTES', personality, content, roomId, 'Mensaje muy similar a uno reciente en la sala', new Error().stack);
    console.error(`[MULTI AI] 🚫 ${personality.username} intentó enviar mensaje similar a uno reciente en la sala, regenerando...`);
    return;
  }

  // ✅ Mensaje válido, enviarlo
  logMessageEvent('✅ MENSAJE VÁLIDO - ENVIANDO', personality, content, roomId, `Origen: ${source}`, new Error().stack);
  
  // 🔍 TRAZABILIDAD: Normalizar source a valores estándar
  let normalizedSource = source;
  if (source === 'CONVERSATION_PULSE' || source === 'unknown') {
    normalizedSource = 'AI_CONVERSATION_PULSE';
  } else if (source === 'RESPUESTA_USUARIO_REAL') {
    normalizedSource = 'AI_RESPONSE_TO_USER';
  } else if (!source || source === 'unknown') {
    normalizedSource = 'UNKNOWN';
  }
  
  // 🔍 Crear trace metadata
  const trace = createMessageTrace(
    'AI',
    normalizedSource,
    personality.userId,
    'AI',
    'multiProviderAIConversation'
  );

  await sendMessage(roomId, {
    userId: personality.userId,
    username: personality.username,
    avatar: personality.avatar,
    content,
    type: 'text',
    isAI: true,
    senderUid: auth.currentUser.uid,
    trace // 🔍 TRAZABILIDAD: Incluir metadata completa
  });

  // Registrar en historial con el ID del que habló
  addToHistory(roomId, 'assistant', `${personality.username}: ${content}`, personality.userId);

  // Registrar mensaje en cache de la IA (no podrá repetirlo por 1 hora)
  recordAIMessage(personality.userId, content);

  // Guardar mensaje reciente para comparación en la sala
  if (!recentMessages.has(roomId)) {
    recentMessages.set(roomId, []);
  }
  const recent = recentMessages.get(roomId);
  recent.push(content);
  // Mantener solo últimos 20 mensajes (aumentado para mejor detección)
  if (recent.length > 20) {
    recent.shift();
  }

  logMessageEvent('✅ MENSAJE ENVIADO EXITOSAMENTE', personality, content, roomId, `Origen: ${source} | Guardado en historial y cache`, new Error().stack);
  console.log(`[MULTI AI] ✅ ${personality.username} envió: "${content.substring(0, 50)}..."`);
  if (spamCheck && spamCheck.stats) {
    console.log(`[MULTI AI] 📊 Spam stats: ${spamCheck.stats.totalSimilar || 0} mensajes similares recientes`);
  }
};

const runConversationPulse = (roomId) => {
  // ✅ OPCIÓN C: 2-3 IAs hablan por pulse (más actividad)
  const numParticipants = 2 + Math.floor(Math.random() * 2); // 2 o 3 IAs
  let delay = 0;
  let lastPersonality = getLastSpeaker(roomId);

  console.log(`%c🎯 PULSE INICIADO - ${numParticipants} IAs hablarán`, 'background: #9c27b0; color: white; padding: 2px 5px; border-radius: 3px;');

  // Seleccionar participantes uno por uno, asegurando que no se repita el anterior
  for (let i = 0; i < numParticipants; i++) {
    const excludeIds = lastPersonality ? [lastPersonality] : [];
    const [personality] = pickRandom(PERSONALITIES, 1, excludeIds);

    const timeoutId = setTimeout(async () => {
      console.group(`🔍 [RASTREADOR] TIMEOUT EJECUTADO - CONVERSACIÓN ENTRE IAs`);
      console.log(`👤 Personalidad: ${personality.username} (${personality.userId})`);
      console.log(`🏠 Sala: ${roomId}`);
      console.log(`⏱️ Delay: ${delay}ms (${Math.round(delay/1000)}s)`);
      console.log(`📍 Origen: runConversationPulse -> setTimeout`);
      console.groupEnd();

      const content = await generateAIMessage(roomId, personality, false, null, null);
      // 🔥 Solo enviar si la IA generó contenido (no es null)
      if (content) {
        await sendAIMessage(roomId, personality, content, 'AI_CONVERSATION_PULSE');
      } else {
        console.warn(`🔍 [RASTREADOR] MENSAJE NULL - NO ENVIADO`);
        console.warn(`👤 Personalidad: ${personality.username}`);
        console.warn(`🏠 Sala: ${roomId}`);
        console.warn(`📍 Origen: runConversationPulse -> generateAIMessage retornó null`);
        console.log(`[MULTI AI] ⚠️ ${personality.username} no pudo generar mensaje, saltando...`);
      }
    }, delay);

    const state = roomStates.get(roomId);
    if (state) {
      state.timeouts.push(timeoutId);
    }

    // El próximo no puede ser este
    lastPersonality = personality.userId;
    // ✅ OPCIÓN C: Delay reducido de 20-40s a 10-25s (más fluido)
    delay += 10000 + Math.random() * 15000; // 10-25 segundos entre mensajes
  }

  console.log(`%c⏱️ Próximo pulse en: ${Math.round(getPulseIntervalMs()/1000)}s`, 'color: #9c27b0; font-weight: bold;');
};

// ✅ OPCIÓN C: Pulses más frecuentes - de 3-5 min a 1.5-2.5 min (más activas)
const getPulseIntervalMs = () => 90000 + Math.floor(Math.random() * 60000); // 90-150 segundos (1.5-2.5 minutos)

const startRoomAI = (roomId) => {
  // ✅ REACTIVADO: Sistema de IA conversacional solo cuando hay usuarios
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
  console.log(`[MULTI AI] ✅ Activado en ${roomId} (con validación anti-spam)`);
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
  // ✅ REACTIVADO: Sistema de IA solo cuando hay 1-9 usuarios reales conectados
  if (realUserCount >= MIN_ACTIVE_USERS && realUserCount <= MAX_ACTIVE_USERS) {
    startRoomAI(roomId);
    console.log(`[MULTI AI] ✅ Activando IA en ${roomId} (${realUserCount} usuarios reales)`);
  } else {
    stopRoomAI(roomId);
    console.log(`[MULTI AI] ⏹️ Deteniendo IA en ${roomId} (${realUserCount} usuarios - fuera del rango 1-9)`);
  }
};

export const stopRoomAIConversation = (roomId) => {
  stopRoomAI(roomId);
};

/**
 * Registra mensaje de humano y hace que SOLO 1 IA responda
 * 🔥 FIX ANTI-REPETICIÓN: Solo 1 IA responde para evitar que múltiples IAs generen mensajes similares
 * 🔥 PRIORIDAD ABSOLUTA: El usuario real tiene prioridad
 * Las demás IAs siguen conversando normalmente entre ellas para mantener el flujo natural
 */
export const recordHumanMessage = (roomId, username, content) => {
  // ✅ REACTIVADO: IAs responden a usuarios reales (con validación anti-spam activa)
  const name = username || 'Usuario';
  console.log(`[MULTI AI] 📥 Usuario real escribió: ${name} → "${content.substring(0, 50)}..."`);
  console.log(`[MULTI AI] 🔥 ANTI-REPETICIÓN: Solo 1 IA responderá al usuario para evitar contenido duplicado`);

  // Guardar el mensaje del usuario real con metadata especial
  addToHistory(roomId, 'user', `${name}: ${content}`, null); // null = usuario humano

  // 🔥 SOLO 1 IA RESPONDE AL USUARIO REAL (evita repetición de contenido similar)
  // Delay más rápido cuando el usuario dice algo urgente (ej: "nadie responde")
  const isUrgent = content.toLowerCase().includes('nadie') ||
                   content.toLowerCase().includes('respond') ||
                   content.toLowerCase().includes('fome') ||
                   content.toLowerCase().includes('aburrid');

  // Elegir 1 personalidad que NO sea la última que habló
  const respondingPersonalities = pickRandomExcludingLast(roomId, 1);
  console.log(`[MULTI AI] 👥 1 IA responderá: ${respondingPersonalities.map(p => p.username).join(', ')}`);

  // Respuesta única
  const delay1 = isUrgent ? 1000 + Math.random() * 1500 : 2000 + Math.random() * 2500; // 1-2.5s urgente, 2-4.5s normal
  setTimeout(async () => {
    try {
      const personality = respondingPersonalities[0];
      console.log(`[MULTI AI] 👤 ${personality.username} va a responder a ${name}`);
      console.log(`[MULTI AI] 📝 Mensaje del usuario: "${content}"`);
      console.log(`[MULTI AI] 🎯 La respuesta DEBE estar relacionada con: "${content}"`);

      console.group(`🔍 [RASTREADOR] GENERANDO RESPUESTA A USUARIO REAL`);
      console.log(`👤 IA: ${personality.username} (${personality.userId})`);
      console.log(`👤 Usuario real: ${name}`);
      console.log(`💬 Mensaje del usuario: "${content}"`);
      console.log(`🏠 Sala: ${roomId}`);
      console.log(`📍 Origen: recordHumanMessage -> setTimeout (respuesta única)`);
      console.log(`📋 Stack:`, new Error().stack);
      console.groupEnd();

      const response = await generateAIMessage(roomId, personality, true, content, name);
      // 🔥 Solo enviar si la IA generó contenido (no es null)
      if (response) {
        await sendAIMessage(roomId, personality, response, 'AI_RESPONSE_TO_USER');
      console.log(`[MULTI AI] ✅ ${personality.username} respondió exitosamente a ${name}`);
        console.log(`[MULTI AI] 💬 Respuesta: "${response.substring(0, 100)}..."`);
      } else {
        console.error(`🔍 [RASTREADOR] ERROR: ${personality.username} no pudo generar respuesta`);
        console.error(`👤 Usuario: ${name}`);
        console.error(`💬 Mensaje original: "${content}"`);
        console.log(`[MULTI AI] ⚠️ ${personality.username} no pudo generar respuesta para ${name}`);
      }
    } catch (error) {
      console.error(`[MULTI AI] ❌ Error al responder a ${name}:`, error);
    }
  }, delay1);

  // 🔥 SEGUNDO TIMEOUT ELIMINADO - Solo 1 IA responde para evitar repetición de contenido

  console.log(`[MULTI AI] ✅ 1 IA programada para responder en ${Math.round(delay1/1000)}s`);
  console.log(`[MULTI AI] 💡 Las demás IAs seguirán conversando normalmente entre ellas`);
  console.log(`[MULTI AI] 🎯 FIX: Eliminada segunda respuesta para evitar contenido repetido`);
};

/**
 * Saluda a un usuario nuevo que acaba de entrar
 * 🔥 IMPORTANTE: Solo 1-2 IAs saludan (como en chats reales)
 * 🔥 IMPORTANTE: Si el usuario es "Invitado", NO mencionar el nombre
 * 🔥 Las demás IAs siguen conversando entre ellas normalmente
 */
export const greetNewUser = async (roomId, username) => {
  // ✅ REACTIVADO: Sistema de saludos con 2 IAs
  if (!auth.currentUser) return;

  // 🔥 ANTI-SPAM: Verificar si el usuario ya alcanzó el límite de saludos (2) en las últimas 3 horas
  if (hasUserReachedGreetingLimit(roomId, username)) {
    const key = `${roomId}_${username}`;
    const greetingData = userGreetings.get(key);
    const hoursAgo = Math.round((Date.now() - greetingData.firstGreeting) / (60 * 60 * 1000));
    console.log(`[MULTI AI] ⏭️ ${username} ya recibió ${greetingData.count} saludo(s) hace ${hoursAgo} hora(s) en ${roomId}. Límite alcanzado (${MAX_GREETINGS_PER_USER} saludos en 3 horas).`);
    return;
  }

  // Limpiar saludos antiguos antes de continuar
  cleanOldGreetings();

  // Detectar si es invitado (no mencionar el nombre)
  const isGuest = username?.toLowerCase().includes('invitado') ||
                 username?.toLowerCase() === 'guest' ||
                 username?.toLowerCase() === 'invitado';

  // ✅ FIJO: Siempre 2 IAs saludan (como pediste)
  const numGreeting = 2;
  console.log(`[MULTI AI] 👋 ${numGreeting} IA(s) saludarán a ${username}, las demás seguirán conversando entre ellas`);

  // Elegir IAs que saludarán (evitando la última que habló)
  const greetingPersonalities = pickRandomExcludingLast(roomId, numGreeting);

    // Saludos casuales atrevidos en chileno (sin exclamaciones)
  // Si es invitado, usar saludos genéricos sin nombre
  const greetings = isGuest ? [
    `hola, que tal`,
    `que onda, como estas`,
    `ey, como andas`,
    `hola, que hay`,
    `que onda wn`,
    `holi ajaja`,
    `llegaste justo 😈`,
    `tienes buena pinta ajaja 😏`,
    `bienvenido, estaba aburrido po`,
    `hola, como estas`,
    `que tal, todo bien?`
  ] : [
      `hola ${username}, que tal`,
      `bienvenido ${username} 👋`,
      `hola ${username}, como andas`,
      `que onda ${username}`,
      `ey ${username} 👀`,
      `que hay ${username}`,
      `${username} wn hola`,
      `holi ${username} ajaja`,
      `${username} bienvenido, estaba aburrido po`,
      `que onda ${username}, andas buscando algo? 😈`,
    ];

  // Primera IA saluda (2-5 segundos)
  setTimeout(async () => {
    const personality = greetingPersonalities[0];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    await sendAIMessage(roomId, personality, greeting, 'AI_WELCOME');
    console.log(`[MULTI AI] 👤 ${personality.username} saludó a ${username} (1/${numGreeting})`);
  }, 2000 + Math.random() * 3000);

  // Segunda IA saluda (solo si numGreeting === 2) - con delay adicional
  if (numGreeting === 2 && greetingPersonalities.length > 1) {
    setTimeout(async () => {
      const personality = greetingPersonalities[1];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      await sendAIMessage(roomId, personality, greeting, 'AI_WELCOME');
      console.log(`[MULTI AI] 👤 ${personality.username} saludó a ${username} (2/2)`);
    }, 5000 + Math.random() * 4000); // 5-9 segundos después
  }

  console.log(`[MULTI AI] ✅ Saludos programados. Las demás IAs (${PERSONALITIES.length - numGreeting}) siguen conversando normalmente`);
  
  // 🔥 Registrar que el usuario fue saludado (evitar saludos repetidos en 3 horas)
  recordUserGreeting(roomId, username);
};
