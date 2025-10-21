/**
 * ORQUESTADOR DE CONVERSACIONES DE BOTS
 *
 * Crea conversaciones REALES entre bots que parecen humanos
 * Los bots se responden entre sí, hacen bromas, se ríen, interactúan
 */

import { generateBotResponse } from './geminiBotService';
import { sendMessage } from './chatService';

/**
 * TEMAS DE CONVERSACIÓN NATURALES
 * Los bots iniciarán estos temas y conversarán sobre ellos
 */
const CONVERSATION_TOPICS = [
  {
    starter: "¿Alguien vio la nueva temporada de Heartstopper?",
    responses: [
      "Sí! Me encantó, lloré en el último capítulo jaja",
      "Yo la vi completa en un día, no pude parar 😭",
      "¿Es buena? La tengo pendiente",
      "Me recordó cuando salí del closet, muy emotiva"
    ]
  },
  {
    starter: "¿Qué hacen un viernes por la noche?",
    responses: [
      "Salir a tomar algo, ¿tú?",
      "Depende, a veces fiestas, a veces Netflix jaja",
      "Hoy me quedo en casa, mañana gym temprano",
      "Lo que salga, soy espontáneo 😎"
    ]
  },
  {
    starter: "Alguien para gym? Necesito motivación jaja",
    responses: [
      "Yo voy todas las mañanas, ¿de dónde eres?",
      "El gym es amor jaja, ¿qué rutina haces?",
      "Yo dejé el gym hace meses, pura flojera",
      "Mejor running, el gym me aburre"
    ]
  },
  {
    starter: "¿Cómo están? Yo recién llegando del trabajo 😮‍💨",
    responses: [
      "Cansado también, fue un día largo",
      "Bien! Descansando, ¿en qué trabajas?",
      "Yo salí temprano hoy por suerte",
      "Relajado en casa, ¿tú bien?"
    ]
  },
  {
    starter: "Alguien jugando algo? Estoy aburrido",
    responses: [
      "Yo estoy viciando con Valorant jaja",
      "¿Qué juegas? Yo soy de PS5",
      "No soy mucho de juegos, más de series",
      "Última partida de LOL y me voy a dormir"
    ]
  },
  {
    starter: "Recién salí del closet con mis papás 🥺",
    responses: [
      "Felicidades! ¿Cómo te fue?",
      "Wow, eso requiere valor, bien por ti! 💕",
      "¿Y cómo reaccionaron?",
      "Yo aún no me animo, te admiro"
    ]
  },
  {
    starter: "¿Alguien de Santiago? Para conocer gente",
    responses: [
      "Yo soy de Santiago! ¿Qué sector?",
      "Yo soy de Provi, ¿tú?",
      "Santiago centro acá 🙋‍♂️",
      "Yo de Valpo, pero voy seguido a Santiago"
    ]
  },
  {
    starter: "Quién más odia los lunes? 😩",
    responses: [
      "Todos jaja, vuelta a la rutina",
      "Yo amo los lunes, soy raro 😂",
      "Lunes de resaca, peor combinación",
      "Los lunes son para café triple"
    ]
  }
];

/**
 * RESPUESTAS DE SEGUIMIENTO NATURALES
 * Para mantener la conversación fluyendo
 */
const FOLLOW_UP_RESPONSES = [
  "jaja sí, mal",
  "totalmente de acuerdo",
  "nah, yo creo que no",
  "puede ser jaja",
  "no sé, tú qué piensas?",
  "😂😂😂",
  "jajaja no manches",
  "eso mismo digo yo",
  "me pasa igual",
  "depende del día jaja"
];

/**
 * Estado de la conversación actual
 */
let currentConversation = {
  topic: null,
  messageCount: 0,
  participants: []
};

/**
 * Selecciona un tema aleatorio de conversación
 */
const getRandomTopic = () => {
  return CONVERSATION_TOPICS[Math.floor(Math.random() * CONVERSATION_TOPICS.length)];
};

/**
 * Selecciona una respuesta de seguimiento aleatoria
 */
const getRandomFollowUp = () => {
  return FOLLOW_UP_RESPONSES[Math.floor(Math.random() * FOLLOW_UP_RESPONSES.length)];
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
      // 70% usa respuestas predefinidas, 30% usa IA
      let response;
      if (Math.random() < 0.7 && topic.responses.length > 0) {
        // Usar respuesta predefinida
        const availableResponses = topic.responses.filter(
          r => !currentConversation.participants.some(p => p.response === r)
        );
        response = availableResponses.length > 0
          ? availableResponses[Math.floor(Math.random() * availableResponses.length)]
          : getRandomFollowUp();
      } else {
        // Generar con IA (más natural pero más costoso)
        try {
          const history = [{ username: starterBot.username, content: topic.starter }];
          response = await generateBotResponse(bot, history, topic.starter);
        } catch (error) {
          response = getRandomFollowUp();
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
