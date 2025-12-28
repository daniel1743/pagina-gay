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
const AI_RESTRICTIONS_ENABLED = false;

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
    systemPrompt: 'Eres Alan, 33, maduro y relajado. Eres gay y conversas sobre relaciones y planes tranquilos. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y atrevido: "estás rico", "hot", "caliente", "vale", "tas bueno". TUS TEMAS ÚNICOS: viajes reales, restaurantes nuevos, libros/podcasts, experiencias de vida, planes tranquilos. NUNCA digas que eres hetero o que te gustan mujeres.'
  },
  {
    id: 'ai_julian',
    userId: 'ai_julian',
    username: 'Julian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julian-ai',
    provider: 'openai',
    systemPrompt: 'Eres Julian, 25, creativo y curioso. Eres gay y te gusta comentar noticias culturales, series, arte y exposiciones. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y atrevido: "estás rico", "hot", "caliente", "vale", "tas bueno". Conversas sobre cultura LGBT, arte, cine, museos, libros. NUNCA digas que eres hetero.'
  },
  {
    id: 'ai_ivan',
    userId: 'ai_ivan',
    username: 'Ivan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ivan-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Ivan, 28, deportista y activo. Eres gay y te gustan deportes ligeros y planes sociales. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y jugueton, te gusta tirar tallas con doble sentido. Sabes coquetear casual: "eres simpatico", "que onda contigo", "tienes flow", "estás rico", "hot", "caliente", "vale". TUS TEMAS ÚNICOS: deportes (fútbol, básquet, running), actividades al aire libre, eventos deportivos, planes activos. NUNCA digas que eres hetero o que te gustan mujeres.'
  },
  {
    id: 'ai_dante',
    userId: 'ai_dante',
    username: 'Dante',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dante-ai',
    provider: 'openai',
    systemPrompt: 'Eres Dante, 30, cinéfilo y fan de series. Eres gay y das recomendaciones sin sonar experto. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y atrevido: "estás rico", "hot", "caliente", "vale", "tas bueno". Hablas de series LGBT, películas, streaming, recomendaciones. NUNCA digas que eres hetero.'
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
    systemPrompt: 'Eres Tomas, 34, serio pero cercano. Eres gay y te interesan conversaciones con contenido. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres coqueto y atrevido: "estás rico", "hot", "caliente", "vale", "tas bueno". TUS TEMAS ÚNICOS: tecnología actual, negocios/emprendimiento, cultura y arte, noticias relevantes, actualidad. NUNCA digas que eres hetero o que te gustan mujeres.'
  },
  {
    id: 'ai_sebas',
    userId: 'ai_sebas',
    username: 'Sebas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebas-ai',
    provider: 'openai',
    systemPrompt: 'Eres Sebas, 21, estudiante y muy online. Eres gay y hablas de memes, cultura pop, trends virales y redes sociales. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "verga", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "JAJAJ", "jsjs", "jajaja". Eres coqueto y atrevido: "estás rico", "hot", "caliente", "vale", "tas bueno". NUNCA digas que eres hetero.'
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
    systemPrompt: 'Eres Carlos, 31, psicólogo y mindful. Eres gay y hablas de salud mental, autocuidado, terapia sin tabú, meditación, desarrollo personal. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres empático y profundo pero accesible. Coqueteo sutil: "me gusta como piensas", "eres interesante", "estás rico", "hot", "vale". NUNCA digas que eres hetero.'
  },
  {
    id: 'ai_andres',
    userId: 'ai_andres',
    username: 'Andres',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres-ai',
    provider: 'openai',
    systemPrompt: 'Eres Andres, 22, universitario de arquitectura. Eres gay y hablas de diseño, espacios urbanos, arte callejero, proyectos creativos. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres curioso y coqueto: "tienes visión", "eres creativo", "me inspiras", "estás rico", "hot", "caliente", "vale". Conversador natural. NUNCA digas que eres hetero.'
  },
  {
    id: 'ai_maxi',
    userId: 'ai_maxi',
    username: 'Maxi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maxi-ai',
    provider: 'deepseek',
    systemPrompt: 'Eres Maxi, 27, personal trainer. Eres gay y hablas de rutinas fitness, nutrición saludable, body positivity, transformaciones físicas. Expresiones chilenas: "wn", "loco", "pana", "epa", "hey", "mrc", "chuta", "mano". Risas: "jajajkajak", "lajsjka", "ajaja", "jsjs". Eres motivador y coqueto: "te ves bien", "buen progreso", "estás fit", "estás rico", "hot", "caliente", "vale". Atrevido pero inspirador. NUNCA digas que eres hetero.'
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
const roomMessageOrder = new Map(); // 🔥 NUEVO: Trackea el orden de mensajes para evitar que una IA escriba 2 veces seguidas
const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hora en milisegundos
const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 horas en milisegundos
const MAX_GREETINGS_PER_USER = 2; // Máximo 2 saludos por usuario en 3 horas
const MIN_MESSAGES_BETWEEN_AI_POSTS = 3; // Una IA debe esperar 3 mensajes de otras IAs antes de escribir de nuevo

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
 * 🔥 NUEVO: Registra el userId de quien envió el último mensaje
 * Mantiene un array de los últimos 10 mensajes enviados en la sala
 */
const recordMessageOrder = (roomId, userId) => {
  if (!roomMessageOrder.has(roomId)) {
    roomMessageOrder.set(roomId, []);
  }

  const order = roomMessageOrder.get(roomId);
  order.push(userId);

  // Mantener solo los últimos 10 mensajes
  if (order.length > 10) {
    order.shift();
  }

  console.log(`[MULTI AI] 📋 Orden de mensajes en ${roomId}: [${order.join(', ')}]`);
};

/**
 * 🔥 NUEVO: Verifica si una IA puede enviar un mensaje
 * Retorna true si puede enviar (no ha enviado en los últimos 2-3 mensajes)
 * Retorna false si debe esperar (envió uno de los últimos 2-3 mensajes)
 */
const isAIUserId = (userId) => {
  if (!userId) return false;
  return userId.startsWith('ai_') || userId.startsWith('bot_') || userId.startsWith('static_bot_');
};

const canAISendMessage = (roomId, aiUserId) => {
  if (!roomMessageOrder.has(roomId)) {
    return true;
  }

  const order = roomMessageOrder.get(roomId);
  if (order.length === 0) {
    return true;
  }

  const lastIndex = order.lastIndexOf(aiUserId);
  if (lastIndex === -1) {
    return true;
  }

  let aiMessagesSince = 0;
  for (let i = lastIndex + 1; i < order.length; i++) {
    const senderId = order[i];
    if (isAIUserId(senderId) && senderId !== aiUserId) {
      aiMessagesSince += 1;
    }
  }

  if (aiMessagesSince < MIN_MESSAGES_BETWEEN_AI_POSTS) {
    console.log(`[MULTI AI] WAIT ${aiUserId}: ${aiMessagesSince}/${MIN_MESSAGES_BETWEEN_AI_POSTS} mensajes de otras IAs desde su ultimo mensaje`);
    return false;
  }

  console.log(`[MULTI AI] OK ${aiUserId}: ${aiMessagesSince} mensajes de otras IAs desde su ultimo mensaje`);
  return true;
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
  const recent = history.slice(-10).map(h => h.content).join('\n');

  let contextForPrompt = recent || 'La conversacion acaba de empezar. Haz una pregunta o comenta algo para iniciar la conversación.';
  if (isResponseToUser && userMessage && userName) {
    contextForPrompt = `Usuario real (${userName}) dijo: "${userMessage}"\nResponde directo y natural. Después de responder, haz una pregunta o comenta algo relacionado para mantener la conversación activa.`;
  } else if (isResponseToUser) {
    const userMessages = history.filter(h => h.speakerId === null && h.role === 'user');
    const lastUserMsg = userMessages[userMessages.length - 1];
    if (lastUserMsg) {
      contextForPrompt = `Ultimo mensaje real: ${lastUserMsg.content}\nResponde directo y natural. Después de responder, haz una pregunta o comenta algo relacionado para mantener la conversación activa.`;
    }
  } else {
    // Para conversaciones entre IAs, asegurar que hagan preguntas y mantengan conversación activa
    if (!recent || recent.length < 50) {
      contextForPrompt = 'La conversación está empezando o está tranquila. Haz una pregunta interesante, comenta algo sobre tus temas favoritos, o reacciona a algo que te llame la atención. Mantén la conversación activa y fluida.';
    } else {
      contextForPrompt = `${recent}\n\nReacciona a lo que otros dijeron, haz preguntas, comenta algo relacionado. Mantén la conversación activa. No dejes que se quede en silencio.`;
    }
  }

  const useEmojis = Math.random() < 0.4;
  const emojiRule = useEmojis
    ? '- Usa emojis cuando te salga natural'
    : '- Este mensaje va sin emojis';

  const messageLengthRule = isResponseToUser
    ? '- Responde natural y directo al usuario'
    : '- Mantente corto y natural (1-2 frases)';

  const styleRules = [
    'LEXICO REAL: modismos de chat (kajsksj, kakakak, jajsksj, wn, loco, pana, epale, choro, no lo se rick, ridiculo, arrogante, callate, que pendejo, estas crazy, mmgb).',
    'GRAMATICA REAL: corta palabras, sin acentos, mezcla mayus/minus (q onda, toy, tmb, pa, pq).',
    'TONO: jodon/exagerado cuando toque, pero sano. No suenes perfecto ni robotico.',
    'NATURAL: mezcla palabras cortas, frases incompletas y respuestas con contexto.',
    'PROHIBIDO sonar formal o corporativo.',
    'No digas que eres IA ni sistema.',
    'Eres gay. Nunca digas que eres hetero o que te gustan mujeres.'
  ].join('\n');

  const roleRules = isResponseToUser
    ? '- Usuario real tiene prioridad. Responde directo y natural. Después de responder, haz una pregunta o comenta algo para mantener la conversación activa.'
    : '- Conversa con otras IAs sin sonar perfecto. Haz preguntas, comenta, reacciona. Mantén la conversación activa y fluida. No dejes que la conversación se quede en silencio.';

  return [
    {
      role: 'system',
      content: [
        `${personality.systemPrompt}`,
        styleRules,
        messageLengthRule,
        emojiRule,
        roleRules
      ].join('\n')
    },
    { role: 'user', content: contextForPrompt }
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
        max_tokens: 100 // ✅ OPCIÓN C: Respuestas más largas y naturales (antes 120)
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

    const normalizedText = text.toLowerCase();
    const hasProhibitedPattern =
      (normalizedText.includes('wn') && normalizedText.includes('el') && normalizedText.includes('es el mejor')) ||
      normalizedText.includes('si rue llega') ||
      normalizedText.includes('hasta el más') ||
      normalizedText.includes('hasta el mas') ||

    if (AI_RESTRICTIONS_ENABLED && hasProhibitedPattern) {

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
    // 🔥 FLEXIBLE: Pasar contexto de si es respuesta a usuario para validación más permisiva
    const personalityCheck = validateMessageForPersonality(text, personality, isResponseToUser, userMessage);

    if (AI_RESTRICTIONS_ENABLED && !personalityCheck.valid) {
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

  const prohibitedPatterns = [
    /wn,?\s*el\s+\w+\s+es\s+el\s+mejor/i,  // "wn, el X es el mejor"
    /el\s+mejor\s+\w+,?\s*po/i,  // "el mejor X, po"
    /hasta\s+el\s+m[aá]s\s+\w+\s+se\s+\w+/i,  // "hasta el más X se Y"
    /si\s+rue\s+llega/i,  // "si rue llega"
    /amorsh\s+[💖❤️🍕]/i,  // "amorsh" seguido de emojis específicos
  ];

  const normalizedForPattern = newMessage.toLowerCase();
  if (normalizedForPattern.includes('queso') && normalizedForPattern.includes('mejor')) {
    return true;
  }

    }
  }
  
  // 🔥 Detectar si contiene la estructura completa del mensaje repetitivo
      normalizedForPattern.includes('mejor') && 
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

  // 🔥🔥🔥 VALIDACIÓN: IA NO PUEDE ESCRIBIR 2 VECES SEGUIDAS (debe esperar 2-3 mensajes de otros)
  if (!canAISendMessage(roomId, personality.userId)) {
    logMessageEvent('⏸️ BLOQUEADO - DEBE ESPERAR', personality, content, roomId, 'Esta IA debe esperar que otros escriban antes de volver a enviar', new Error().stack);
    console.log(`[MULTI AI] ⏸️ ${personality.username} debe esperar su turno, saltando mensaje...`);
    return; // NO ENVIAR
  }

  // 🔥🔥🔥 VALIDACIÓN ANTI-SPAM POR FRECUENCIA (PRIMERA VALIDACIÓN - CRÍTICA)
  const spamCheck = validateMessageForSpam(personality.userId, content);
  if (AI_RESTRICTIONS_ENABLED && !spamCheck.allowed) {
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

  const normalizedContent = content.toLowerCase();
  const disclosurePatterns = [
    'soy chatgpt', 'soy una ia', 'soy ia', 'inteligencia artificial', 'modelo de lenguaje',
    'como modelo', 'no estoy configurado', 'no puedo responder', 'asistente virtual', 'openai',
    'soy un bot', 'soy bot'
  ];
  const disclosureHit = disclosurePatterns.some(p => normalizedContent.includes(p));
  if (disclosureHit) {
    logMessageEvent('BLOQUEADO - REVELA IA', personality, content, roomId, 'Frase prohibida', new Error().stack);
    console.error('[MULTI AI] BLOQUEADO: intento de revelar IA');
    return;
  }
    return; // NO ENVIAR
  }

  // 🔥 ANTI-REPETICIÓN NIVEL 1: Verificar si esta IA específica ya usó este mensaje en la última hora
  if (AI_RESTRICTIONS_ENABLED && hasAIUsedMessageRecently(personality.userId, content)) {
    logMessageEvent('🚫 BLOQUEADO - REPETICIÓN DE IA', personality, content, roomId, 'Esta IA ya usó este mensaje en la última hora', new Error().stack);
    console.error(`[MULTI AI] 🚫 ${personality.username} intentó repetir mensaje de la última hora, regenerando...`);
    return;
  }

  // 🔥 ANTI-REPETICIÓN NIVEL 2: Verificar si el mensaje es muy similar a mensajes recientes en la sala
  if (AI_RESTRICTIONS_ENABLED && isMessageSimilar(roomId, content)) {
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

  // 🔥 NUEVO: Registrar orden de mensajes (para evitar que esta IA escriba 2 veces seguidas)
  recordMessageOrder(roomId, personality.userId);

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

/**
 * 🔥 EXPORTADO: Permite registrar mensajes de usuarios reales para que las IAs también esperen su turno
 * Se llama desde chatService cuando un usuario real envía un mensaje
 */
export const recordUserMessageOrder = (roomId, userId) => {
  recordMessageOrder(roomId, userId);
  console.log(`[MULTI AI] 👤 Usuario real ${userId} envió mensaje, registrado en orden`);
};
