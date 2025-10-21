/**
 * ORQUESTADOR DE CONVERSACIONES DE BOTS
 *
 * Crea conversaciones REALES entre bots que parecen humanos
 * Los bots se responden entre sí, hacen bromas, se ríen, interactúan
 */

import { generateBotResponse } from './geminiBotService';
import { sendMessage } from './chatService';

/**
 * TEMAS DE CONVERSACIÓN NATURALES - Jerga Latina LGBT+
 * Con acento venezolano y chileno
 */
const CONVERSATION_TOPICS = [
  {
    starter: "Chamo, alguien vio la temporada 10 de RuPaul? AQUARIA ES TODO WN 👑✨",
    responses: [
      "SIIII MMMGVO, cuando ganó me puse a llorar como loca jajaja",
      "Aquaria es mi reina literal, pero The Vixen también me encantaba",
      "Wn yo quería que ganara Asia O'Hara, las mariposas me mataron 💀",
      "Esa temporada fue ICONICAAAA, Monét también la rompió",
      "El lip sync de Kameron Michaels wn, BRUTAL 🔥"
    ]
  },
  {
    starter: "Alguien vio POSE? Me tiene llorando cada episodio pana 😭",
    responses: [
      "POSE es lo más hermoso que he visto en mi vida wn",
      "Elektra Abundance es mi personaje favorito, la amo",
      "Chamo esa serie me hizo entender tanto del ballroom",
      "Blanca es un ángel literal, lloré con su historia",
      "Los bailes son ESPECTACULARES, quiero ir a una ball"
    ]
  },
  {
    starter: "¿Qué hacen hoy? Yo quedé de ir a una fiesta pero me dio flojera wn jaja",
    responses: [
      "Jajaja típico, yo también soy así de flojo pana",
      "Yo me quedé viendo pelis, más cómodo en casita",
      "Salí pero ya me quiero ir, mucha gente fome",
      "Chamo yo estoy tomando vino sola en casa jajaja"
    ]
  },
  {
    starter: "Alguien se acuerda del lip sync de Kameron vs Eureka? ESO FUE ARTE WN 💅",
    responses: [
      "MMMGVO SÍ! Nueva actitud fue ICONICO",
      "Eureka se comió ese escenario literal",
      "Kameron callada pero letal, la amo",
      "Ese fue uno de los mejores lip syncs de la temporada 10"
    ]
  },
  {
    starter: "¿Película gay favorita? Yo digo Call Me By Your Name, lloré horrible",
    responses: [
      "ESA PELI ME DESTRUYÓ EMOCIONALMENTE WN 😭",
      "A mí me encanta Love Simon, más suavecita pero linda",
      "Moonlight pana, obra maestra total",
      "Brokeback Mountain, la clásica que te rompe el corazón"
    ]
  },
  {
    starter: "Chamo alguien para tomar algo? Estoy aburrido en casa",
    responses: [
      "Yo toy igual wn, ¿de dónde eres?",
      "Depende donde estés, yo estoy en Provi",
      "Si es en Santiago centro me tinca",
      "Mándame ubicación y veo si me animo jaja"
    ]
  },
  {
    starter: "Asia O'Hara con las mariposas, NUNCA LO SUPERO JAJAJA 🦋💀",
    responses: [
      "JAJAJAJA pobre Asia, se le fue todo al piso",
      "Esa fue la peor idea de la historia de RuPaul wn",
      "Literal iba a ganar y las mariposas la sabotearon",
      "Yo hubiera llorado en su lugar, qué vergüenza jajaja"
    ]
  },
  {
    starter: "¿Alguien hace gym o puro cuerpo de pana como yo? jajaja",
    responses: [
      "Jajaja yo voy al gym pero por salud nomá wn",
      "Chamo yo dejé el gym hace mil, pura flojera",
      "Yo voy 4 veces a la semana, es mi terapia",
      "Gym? Nah, yo hago yoga en casa cuando me acuerdo jaja"
    ]
  },
  {
    starter: "The Vixen era PURO DRAMA y me encantaba wn 🔥",
    responses: [
      "SIII, la polémica andante jajaja",
      "Chamo ella decía las verdades que nadie quería escuchar",
      "El drama con Aquaria fue ICONICO televisión",
      "A mí me caía bien, era auténtica"
    ]
  },
  {
    starter: "Alguien salió del closet con la familia? Cómo les fue panas?",
    responses: [
      "Yo sí wn, al principio fue difícil pero ya están bien",
      "Chamo mi mamá lloró pero después me abrazó, todo bien",
      "Yo no me he atrevido todavía, me da miedo",
      "Mi familia lo tomó super bien, soy afortunado"
    ]
  },
  {
    starter: "Monét X Change debió ganar la temporada 10, CHANGE MY MIND",
    responses: [
      "FACTS WN, Monét es increíble",
      "Nah, Aquaria merecía ganar totalmente",
      "Monét ganó All Stars después así que todo bien jaja",
      "Yo estaba team Asia pero Monét también la rompió"
    ]
  },
  {
    starter: "¿Qué están escuchando? Yo puro Bad Bunny y Peso Pluma últimamente",
    responses: [
      "Chamo yo también, Bad Bunny es GOD",
      "Peso Pluma me tiene obsesionado wn",
      "Yo más de reggaeton viejo, Daddy Yankee y eso",
      "Música variada pana, de todo un poco"
    ]
  }
];

/**
 * RESPUESTAS DE SEGUIMIENTO NATURALES - Jerga Latina
 * Para mantener la conversación fluyendo sin repetir
 */
const FOLLOW_UP_RESPONSES = [
  "jajaja sí wn, mal",
  "totalmente de acuerdo pana",
  "nah chamo, yo creo que no",
  "puede ser jaja, quién sabe",
  "y ustedes qué piensan?",
  "😂😂😂 me muero",
  "jajaja no manches wn",
  "eso mismo digo yo literal",
  "me pasa igual chamo",
  "depende del mood jaja",
  "facts MMMGVO",
  "literal no te creo jajaja",
  "ay sí, cuenta más",
  "wn yo también",
  "chamo que chistoso",
  "jajaja muero con eso",
  "dímelo a mí pana",
  "sí wn, obvio",
  "jajajaja ya pues",
  "interesante eso"
];

/**
 * RESPUESTAS COQUETAS (Sin quebrantar reglas)
 * Para cuando la conversación se pone un poco caliente
 */
const FLIRTY_RESPONSES = [
  "ay pero qué lindo 👀",
  "uff interesante jaja",
  "me gusta cómo piensas wn",
  "chamo y tienes foto? jaja",
  "suena tentador eso",
  "jajaja pícarO",
  "ay no seas malo jaja",
  "me lo estás poniendo difícil 🔥",
  "wn tú sí sabes",
  "dame más detalles pana jaja"
];

/**
 * Estado de la conversación actual
 */
let currentConversation = {
  topic: null,
  messageCount: 0,
  participants: [],
  lastTopic: null,
  consecutiveTopicChanges: 0
};

/**
 * Historial de respuestas usadas por cada bot (anti-repetición)
 * Estructura: { botId: [{ response, timestamp }] }
 */
const botResponseHistory = new Map();

/**
 * Tiempo mínimo entre repeticiones de la misma frase: 7 minutos
 */
const REPETITION_COOLDOWN = 7 * 60 * 1000; // 7 minutos en milisegundos

/**
 * Detecta si un mensaje es de un usuario REAL
 */
const isRealUserMessage = (username) => {
  // Los usuarios reales NO tienen estos nombres de bot
  const botNames = ['Carlos', 'Mateo', 'Alejandro', 'David', 'Miguel', 'Javier', 'Fernando', 'Pablo'];
  return !botNames.includes(username);
};

/**
 * Verifica si un bot ya usó una respuesta en los últimos 7 minutos
 */
const hasRecentlyUsed = (botId, response) => {
  if (!botResponseHistory.has(botId)) {
    botResponseHistory.set(botId, []);
    return false;
  }

  const history = botResponseHistory.get(botId);
  const now = Date.now();

  // Limpiar respuestas antiguas (más de 7 minutos)
  const validHistory = history.filter(entry => (now - entry.timestamp) < REPETITION_COOLDOWN);
  botResponseHistory.set(botId, validHistory);

  // Verificar si la respuesta fue usada recientemente
  return validHistory.some(entry => entry.response === response);
};

/**
 * Registra una respuesta en el historial del bot con timestamp
 */
const recordResponse = (botId, response) => {
  if (!botResponseHistory.has(botId)) {
    botResponseHistory.set(botId, []);
  }

  const history = botResponseHistory.get(botId);
  const now = Date.now();

  // Añadir nueva respuesta con timestamp
  history.push({ response, timestamp: now });

  // Limpiar respuestas antiguas automáticamente
  const validHistory = history.filter(entry => (now - entry.timestamp) < REPETITION_COOLDOWN);

  botResponseHistory.set(botId, validHistory);

  console.log(`📝 ${botId} usó: "${response}" - Cooldown hasta ${new Date(now + REPETITION_COOLDOWN).toLocaleTimeString()}`);
};

/**
 * Selecciona un tema aleatorio de conversación (sin repetir el anterior)
 */
const getRandomTopic = () => {
  let topic;
  let attempts = 0;

  do {
    topic = CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
    attempts++;
  } while (topic === currentConversation.lastTopic && attempts < 3);

  currentConversation.lastTopic = topic;
  return topic;
};

/**
 * Selecciona una respuesta de seguimiento aleatoria (evitando repetición)
 */
const getRandomFollowUp = (botId) => {
  let response;
  let attempts = 0;

  // Intentar encontrar una respuesta no usada recientemente
  do {
    const useFlirty = Math.random() < 0.3; // 30% coqueto
    const pool = useFlirty ? FLIRTY_RESPONSES : FOLLOW_UP_RESPONSES;
    response = pool[Math.floor(Math.random() * pool.length)];
    attempts++;
  } while (hasRecentlyUsed(botId, response) && attempts < 5);

  if (botId) {
    recordResponse(botId, response);
  }

  return response;
};

/**
 * Inicia una nueva conversación entre bots
 */
export const startBotConversation = async (roomId, activeBots) => {
  if (activeBots.length < 2) return; // Necesitamos al menos 2 bots

  // Seleccionar tema
  const topic = getRandomTopic();
  currentConversation = {
    topic: topic,
    messageCount: 0,
    participants: []
  };

  // Bot 1 inicia el tema
  const starterBot = activeBots[0];
  await sendMessage(roomId, {
    userId: starterBot.id,
    username: starterBot.username,
    avatar: starterBot.avatar,
    isPremium: false,
    content: topic.starter,
    type: 'text'
  });

  console.log(`💬 ${starterBot.username} inició conversación: "${topic.starter}"`);

  // Programar respuestas de otros bots
  const responseDelay = 5000; // 5 segundos entre respuestas
  const otherBots = activeBots.slice(1, Math.min(4, activeBots.length)); // Máximo 3 bots responden

  otherBots.forEach((bot, index) => {
    setTimeout(async () => {
      // 🆕 95% usa respuestas predefinidas, 5% usa IA (REDUCIR LLAMADAS A GEMINI)
      let response;
      if (Math.random() < 0.95 && topic.responses.length > 0) {
        // Usar respuesta predefinida (sin repetir)
        const availableResponses = topic.responses.filter(r => {
          // No usar si otro bot ya la usó en esta conversación
          const usedInConversation = currentConversation.participants.some(p => p.response === r);
          // No usar si este bot la usó recientemente (7 min)
          const usedRecently = hasRecentlyUsed(bot.id, r);
          return !usedInConversation && !usedRecently;
        });

        if (availableResponses.length > 0) {
          response = availableResponses[Math.floor(Math.random() * availableResponses.length)];

          // Verificar doble check anti-spam
          if (hasRecentlyUsed(bot.id, response)) {
            console.warn(`⚠️ SPAM DETECTADO: ${bot.username} intentó repetir: "${response}"`);
            response = getRandomFollowUp(bot.id);
          } else {
            recordResponse(bot.id, response);
          }
        } else {
          response = getRandomFollowUp(bot.id);
        }
      } else {
        // Generar con IA (SOLO 5% para ahorrar API)
        try {
          const history = [{ username: starterBot.username, content: topic.starter }];
          response = await generateBotResponse(bot, history, topic.starter);

          // Verificar si el bot está repitiendo
          if (hasRecentlyUsed(bot.id, response)) {
            console.warn(`⚠️ SPAM DETECTADO: ${bot.username} intentó repetir: "${response}"`);
            response = getRandomFollowUp(bot.id);
          } else {
            recordResponse(bot.id, response);
          }
        } catch (error) {
          console.error(`❌ Error Gemini API (límite alcanzado): ${error.message}`);
          // Fallback a respuesta predefinida
          response = getRandomFollowUp(bot.id);
        }
      }

      await sendMessage(roomId, {
        userId: bot.id,
        username: bot.username,
        avatar: bot.avatar,
        isPremium: false,
        content: response,
        type: 'text'
      });

      currentConversation.participants.push({ bot: bot.username, response });
      currentConversation.messageCount++;

      console.log(`💬 ${bot.username} respondió: "${response}"`);

      // Último bot hace seguimiento
      if (index === otherBots.length - 1 && Math.random() < 0.5) {
        setTimeout(async () => {
          const followUp = getRandomFollowUp();
          await sendMessage(roomId, {
            userId: bot.id,
            username: bot.username,
            avatar: bot.avatar,
            isPremium: false,
            content: followUp,
            type: 'text'
          });
          console.log(`💬 ${bot.username} siguió: "${followUp}"`);
        }, 3000);
      }

    }, responseDelay * (index + 1));
  });
};

/**
 * Programa conversaciones periódicas entre bots
 */
export const schedulePeriodicConversations = (roomId, activeBots, intervalMinutes = 3) => {
  if (activeBots.length < 2) return null;

  console.log(`📅 Programando conversaciones cada ${intervalMinutes} minutos`);

  const interval = setInterval(async () => {
    console.log('🎭 Iniciando nueva conversación programada...');
    await startBotConversation(roomId, activeBots);
  }, intervalMinutes * 60 * 1000);

  // Iniciar primera conversación inmediatamente
  setTimeout(() => startBotConversation(roomId, activeBots), 10000); // 10 segundos después de entrar

  return interval;
};

/**
 * Detiene las conversaciones programadas
 */
export const stopPeriodicConversations = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('🛑 Conversaciones programadas detenidas');
  }
};
