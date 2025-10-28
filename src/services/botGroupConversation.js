/**
 * SISTEMA DE CONVERSACIONES GRUPALES COHERENTES
 *
 * 3 bots mantienen una conversación lógica y amistosa sobre temas específicos
 * - Turnos naturales y coherentes
 * - Respuestas que siguen el hilo de la conversación
 * - Reacciones a lo que dicen los otros bots
 * - Opiniones diferentes pero respetuosas
 * - Emojis y jerga gay latina natural
 */

import { sendMessage } from './chatService';
import { getRandomBotProfiles } from '../config/botProfiles';
import { addNaturalLaughs, translateToSpanish } from './botConversationOrchestrator';

/**
 * ==============================================
 * CONVERSACIONES GRUPALES ESTRUCTURADAS
 * Cada conversación tiene 9-12 mensajes entre 3 bots
 * ==============================================
 */

const GROUP_CONVERSATIONS = [
  // ============ CONVERSACIÓN 1: SALIR DEL CLOSET ============
  {
    topic: "Coming Out / Salir del Closet",
    conversation: [
      {
        role: "starter", // Bot 1 inicia
        message: "Chicos, estoy pensando en salir del closet con mis papás este finde... qué nervios 😰"
      },
      {
        role: "supporter", // Bot 2 apoya
        message: "Uy amigo, es un paso grande pero te va a liberar tanto mrc 💕"
      },
      {
        role: "advisor", // Bot 3 aconseja
        message: "Yo ya pasé por eso kajaja, mi consejo es que elijas un momento tranquilo donde puedan hablar sin interrupciones"
      },
      {
        role: "starter",
        message: "Sí, pensé hacerlo el domingo en la tarde... pero me da pánico su reacción 😭"
      },
      {
        role: "supporter",
        message: "Es normal tener miedo po, pero recuerda que es TU verdad y mereces vivirla auténticamente 🌈"
      },
      {
        role: "advisor",
        message: "Exacto! Y si la reacción inicial es mala, dale tiempo... muchos padres necesitan procesarlo kajaja"
      },
      {
        role: "starter",
        message: "Eso me da esperanza... ustedes cómo lo hicieron? Les fue bien?"
      },
      {
        role: "supporter",
        message: "Mi mamá lloró pero de felicidad porque al fin entendió por qué era tan reservado mrc 💕"
      },
      {
        role: "advisor",
        message: "Mi papá se puso serio primero, pero después me abrazó y me dijo que me ama igual kajaja, fue hermoso 😭"
      },
      {
        role: "starter",
        message: "Ojalá me pase algo así... gracias chicos, me dieron valor 💪🌈"
      },
      {
        role: "supporter",
        message: "Cuenta con nosotros para lo que necesites! Y después nos cuentas cómo te fue 😊"
      },
      {
        role: "advisor",
        message: "Ánimo mrc! Vas a estar bien, confía en ti 💯"
      }
    ]
  },

  // ============ CONVERSACIÓN 2: PRIMERA CITA ============
  {
    topic: "Primera Cita Gay",
    conversation: [
      {
        role: "starter",
        message: "Tengo primera cita mañana con un chico de Grindr y no sé qué ponerme kajaja 😅"
      },
      {
        role: "fashionista",
        message: "Uy amor, depende! Dónde van a ir? Café, bar, cena? 👀"
      },
      {
        role: "experienced",
        message: "Y más importante... qué vibra quieres dar? Casual, formal, sexy? mrc"
      },
      {
        role: "starter",
        message: "Vamos a un café en Providencia, algo casual pero quiero verme bien obvio 😂"
      },
      {
        role: "fashionista",
        message: "Perfecto! Yo iría con jeans oscuros, camisa blanca o polo y zapatillas limpias kajaja, clásico y seguro 👌"
      },
      {
        role: "experienced",
        message: "Sí! Y nada de perfume en exceso mrc, algo sutil... ah y llega puntual, eso suma puntos"
      },
      {
        role: "starter",
        message: "Buena data! Y de qué hablo? Tengo miedo de los silencios incómodos 😰"
      },
      {
        role: "fashionista",
        message: "Pregúntale por sus hobbies, qué música le gusta, si ha visto series... la conversa fluye sola kajaja 🎵"
      },
      {
        role: "experienced",
        message: "Y escucha activamente mrc! No solo hables de ti, muestra interés genuino en lo que dice 💯"
      },
      {
        role: "starter",
        message: "Cierto! Ay ya me siento mejor preparado kajaja gracias chicos 💕"
      },
      {
        role: "fashionista",
        message: "Vas a estar increíble! Y relájate, si hay química se va a notar 😊"
      },
      {
        role: "experienced",
        message: "Eso! Y después nos cuentas cómo te fue mrc 👀🔥"
      }
    ]
  },

  // ============ CONVERSACIÓN 3: GYM Y CUERPO ============
  {
    topic: "Gym y Presión de Cuerpo Perfecto",
    conversation: [
      {
        role: "insecure",
        message: "Alguien más siente presión de tener cuerpo de gym en Grindr? Me da lata a veces 😔"
      },
      {
        role: "bodypositive",
        message: "Amigo sí! Pero cada vez más me importa menos mrc, todos los cuerpos son válidos 💕"
      },
      {
        role: "gymrat",
        message: "Yo voy al gym pero no por apps kajaja, lo hago porque me gusta sentirme fuerte y saludable 💪"
      },
      {
        role: "insecure",
        message: "Es que siento que si no tengo six pack nadie me va a dar bola 😅"
      },
      {
        role: "bodypositive",
        message: "Eso es mentira total! Hay gustos para todo po, osos, flacos, musculosos, dad bods... todo es sexy 🐻"
      },
      {
        role: "gymrat",
        message: "Exacto mrc! Y además el gym ayuda a la salud mental, no solo física... me relaja un montón kajaja"
      },
      {
        role: "insecure",
        message: "Quizás debería intentar ir... pero me da vergüenza ser el flaco del gym 😰"
      },
      {
        role: "bodypositive",
        message: "Nah! Todos empezaron en algún punto, nadie te va a juzgar kajaja, al contrario te van a respetar por estar ahí 💯"
      },
      {
        role: "gymrat",
        message: "Si quieres yo te armo una rutina básica para empezar mrc, nada intenso, solo para que agarres el ritmo 💪"
      },
      {
        role: "insecure",
        message: "Enserio? Eso sería increíble! Gracias chicos 💕"
      },
      {
        role: "bodypositive",
        message: "Y recuerda: tu valor NO está en tu cuerpo, está en quién eres como persona 🌈"
      },
      {
        role: "gymrat",
        message: "Facts! El gym es un bonus, no un requisito para ser amado kajaja ✨"
      }
    ]
  },

  // ============ CONVERSACIÓN 4: FAMILIA Y ACEPTACIÓN ============
  {
    topic: "Familia que no Acepta",
    conversation: [
      {
        role: "hurt",
        message: "Mi familia sigue sin aceptar que soy gay después de 2 años... duele tanto mrc 💔"
      },
      {
        role: "empathetic",
        message: "Te entiendo tanto amor... es un dolor horrible cuando no te validan 😢"
      },
      {
        role: "resilient",
        message: "Yo pasé por lo mismo kajaja, al final entendí que la familia elegida es igual de válida 💕"
      },
      {
        role: "hurt",
        message: "Pero son mis papás... quiero que estén orgullosos de mí 😭"
      },
      {
        role: "empathetic",
        message: "Y seguro lo están po! Solo que a veces las creencias viejas son difíciles de cambiar mrc"
      },
      {
        role: "resilient",
        message: "Dale tiempo... algunos padres tardan años pero al final el amor gana kajaja 🌈"
      },
      {
        role: "hurt",
        message: "Ustedes tienen relación con su familia ahora?"
      },
      {
        role: "empathetic",
        message: "Sí! Me costó 3 años pero ahora mi mamá hasta pregunta por mi novio mrc 💕"
      },
      {
        role: "resilient",
        message: "Yo con mi papá no mucho, pero mi mamá y hermanos me apoyan full kajaja, eso me basta"
      },
      {
        role: "hurt",
        message: "Eso me da esperanza... mientras tanto tengo a mis amigos que son todo 💯"
      },
      {
        role: "empathetic",
        message: "Exacto! Y nosotros también estamos aquí para ti 🤗"
      },
      {
        role: "resilient",
        message: "La comunidad LGBT+ es familia también mrc, nunca estás solo 🌈💪"
      }
    ]
  },

  // ============ CONVERSACIÓN 5: APPS DE LIGUE ============
  {
    topic: "Apps de Ligue y Frustración",
    conversation: [
      {
        role: "frustrated",
        message: "Grindr me tiene CHATO kajaja, puro ghosting y conversaciones que no llegan a nada 😤"
      },
      {
        role: "realistic",
        message: "Es que Grindr es más para hook-ups mrc, si buscas algo serio prueba Tinder o Hinge"
      },
      {
        role: "optimistic",
        message: "Yo conocí a mi novio en Tinder! Sí se puede encontrar algo real en apps kajaja 💕"
      },
      {
        role: "frustrated",
        message: "Es que hasta en Tinder hacen ghosting después de matchear 👻"
      },
      {
        role: "realistic",
        message: "Sí po, es parte del juego lamentablemente mrc... hay que tener paciencia y no tomarlo personal"
      },
      {
        role: "optimistic",
        message: "Exacto! Yo hablé con como 20 personas antes de encontrar a mi novio kajaja, es de persistir"
      },
      {
        role: "frustrated",
        message: "20?! Eso es mucha energía invertida 😅"
      },
      {
        role: "realistic",
        message: "Piénsalo como práctica mrc, cada conversación te enseña qué quieres y qué no 💯"
      },
      {
        role: "optimistic",
        message: "Sí! Y cuando encuentras a la persona correcta, todo el esfuerzo vale la pena kajaja 💕"
      },
      {
        role: "frustrated",
        message: "Tienen razón... voy a seguir intentando con mejor actitud 💪"
      },
      {
        role: "realistic",
        message: "Esa es la actitud! Y mientras tanto disfruta estar soltero mrc 😎"
      },
      {
        role: "optimistic",
        message: "Exacto! Tu persona llegará cuando tenga que llegar kajaja 🌈✨"
      }
    ]
  },

  // ============ CONVERSACIÓN 6: ORGULLO Y VISIBILIDAD ============
  {
    topic: "Marcha del Orgullo",
    conversation: [
      {
        role: "excited",
        message: "Quién va a ir a la marcha del orgullo este año? Yo voy sí o sí! 🌈🎉"
      },
      {
        role: "firsttimer",
        message: "Yo nunca he ido kajaja, me da un poco de miedo salir tan públicamente mrc"
      },
      {
        role: "veteran",
        message: "Amigo es LA MEJOR experiencia! Tanta alegría y aceptación junta, te va a encantar 💕"
      },
      {
        role: "excited",
        message: "Sí! Y vamos en grupo, así es más divertido y seguro 😊"
      },
      {
        role: "firsttimer",
        message: "Uy sí? Y qué se hace? Solo caminar o hay más cosas?"
      },
      {
        role: "veteran",
        message: "Hay carros alegóricos, música, baile, performances de drag queens mrc... es una FIESTA total 🎊"
      },
      {
        role: "excited",
        message: "Y el ambiente es súper inclusivo kajaja, familias, parejas, solteros, todos celebrando 🏳️‍🌈"
      },
      {
        role: "firsttimer",
        message: "Me convencieron! Voy a ir con ustedes si me dejan 💕"
      },
      {
        role: "veteran",
        message: "Obvio que sí mrc! Entre más seamos mejor kajaja 💪"
      },
      {
        role: "excited",
        message: "Perfecto! Armemos un grupo de WhatsApp para coordinar 📱"
      },
      {
        role: "firsttimer",
        message: "Dale! Ya me emocioné, va a ser mi primera marcha 🌈✨"
      },
      {
        role: "veteran",
        message: "Te va a cambiar la vida amigo, es pura energía positiva mrc 💯"
      }
    ]
  },

  // ============ CONVERSACIÓN 7: SERIES LGBT+ ============
  {
    topic: "Series LGBT+ Favoritas",
    conversation: [
      {
        role: "seriesfan",
        message: "Acabo de terminar Heartstopper T3 y estoy LLORANDO kajaja 😭💕"
      },
      {
        role: "critic",
        message: "Es muy wholesome! Yo prefiero cosas más realistas como Looking o Queer as Folk mrc"
      },
      {
        role: "romantic",
        message: "Ay pero Heartstopper es tan pura y tierna... a veces necesitamos eso 🥺"
      },
      {
        role: "seriesfan",
        message: "Exacto! Nick y Charlie son lo más hermoso que he visto 💕"
      },
      {
        role: "critic",
        message: "Está bien kajaja, pero también hay que mostrar las luchas reales de ser gay mrc"
      },
      {
        role: "romantic",
        message: "Por eso también amo Pose! Muestra la realidad dura pero con esperanza 🌈"
      },
      {
        role: "seriesfan",
        message: "Pose es ARTE total! Las balls son espectaculares 💃"
      },
      {
        role: "critic",
        message: "Ahí sí estamos de acuerdo mrc, Pose es perfección absoluta kajaja 👑"
      },
      {
        role: "romantic",
        message: "Y qué opinan de Red White and Royal Blue? Esa peli me mató 😍"
      },
      {
        role: "seriesfan",
        message: "INCREÍBLE! El príncipe y el hijo del presidente... qué fantasía tan linda 💕"
      },
      {
        role: "critic",
        message: "Entretenida sí, aunque muy fantasiosa mrc... pero bueno, es escapismo válido kajaja"
      },
      {
        role: "romantic",
        message: "A veces necesitamos fantasía y finales felices 🌈✨ La realidad ya es dura"
      }
    ]
  },

  // ============ CONVERSACIÓN 8: VIAJES GAY-FRIENDLY ============
  {
    topic: "Destinos Gay-Friendly para Viajar",
    conversation: [
      {
        role: "traveler",
        message: "Quiero viajar a algún lugar gay-friendly para las vacaciones... recomendaciones? 🌍✈️"
      },
      {
        role: "beachlover",
        message: "SITGES en España mrc! Pueblo playero gay hermoso cerca de Barcelona 🏖️"
      },
      {
        role: "cityperson",
        message: "Yo prefiero ciudades kajaja, Buenos Aires tiene tremenda escena LGBT+ 🇦🇷"
      },
      {
        role: "traveler",
        message: "Uy ambos suenan increíbles! Cuál es más económico?"
      },
      {
        role: "beachlover",
        message: "Sitges puede ser caro en temporada alta, pero vale cada peso mrc 💯"
      },
      {
        role: "cityperson",
        message: "Buenos Aires es MÁS barato que Chile kajaja, y la escena gay en Palermo es lo máximo 🌈"
      },
      {
        role: "traveler",
        message: "Me tinca Buenos Aires entonces! Es seguro para parejas gay?"
      },
      {
        role: "cityperson",
        message: "Súper seguro mrc! Argentina fue el primer país de Latinoamérica con matrimonio igualitario 💍"
      },
      {
        role: "beachlover",
        message: "Y después puedes ir a Uruguay que queda cerquita kajaja, Montevideo también es abierto 🇺🇾"
      },
      {
        role: "traveler",
        message: "Excelente plan! Hacer un viaje por Argentina y Uruguay 💕"
      },
      {
        role: "cityperson",
        message: "Vas a amar la movida nocturna de Buenos Aires mrc, bares y clubes gay increíbles 🎉"
      },
      {
        role: "beachlover",
        message: "Y la comida! Asado argentino es lo mejor kajaja 🥩🍷"
      }
    ]
  }
];

/**
 * ==============================================
 * FUNCIÓN PRINCIPAL: INICIAR CONVERSACIÓN GRUPAL
 * ==============================================
 */

let activeGroupConversations = new Map(); // roomId -> conversationState

export const startGroupConversation = async (roomId) => {
  // Verificar si ya hay una conversación activa
  if (activeGroupConversations.has(roomId)) {
    console.log(`⚠️ Ya hay una conversación grupal activa en ${roomId}`);
    return;
  }

  // Seleccionar conversación aleatoria
  const selectedConvo = GROUP_CONVERSATIONS[Math.floor(Math.random() * GROUP_CONVERSATIONS.length)];

  // Obtener 3 bots aleatorios
  const bots = getRandomBotProfiles(3);

  // Mapear roles a bots
  const roleMapping = {
    [selectedConvo.conversation[0].role]: bots[0],
    [selectedConvo.conversation.find(msg => msg.role !== selectedConvo.conversation[0].role)?.role]: bots[1],
    [selectedConvo.conversation.find((msg, idx) =>
      msg.role !== selectedConvo.conversation[0].role &&
      selectedConvo.conversation.findIndex(m => m.role === msg.role) === idx
    )?.role]: bots[2]
  };

  // Obtener todos los roles únicos
  const roles = [...new Set(selectedConvo.conversation.map(msg => msg.role))];
  roles.forEach((role, index) => {
    if (!roleMapping[role] && bots[index]) {
      roleMapping[role] = bots[index];
    }
  });

  console.log(`🎭 Iniciando conversación grupal sobre: ${selectedConvo.topic}`);
  console.log(`👥 Bots: ${bots.map(b => b.username).join(', ')}`);

  // Estado de la conversación
  const conversationState = {
    topic: selectedConvo.topic,
    messages: selectedConvo.conversation,
    currentIndex: 0,
    roleMapping,
    intervalId: null
  };

  activeGroupConversations.set(roomId, conversationState);

  // Iniciar el flujo de mensajes
  await sendNextGroupMessage(roomId);
};

/**
 * Envía el siguiente mensaje de la conversación grupal
 */
const sendNextGroupMessage = async (roomId) => {
  const state = activeGroupConversations.get(roomId);

  if (!state || state.currentIndex >= state.messages.length) {
    // Conversación terminada
    if (state) {
      console.log(`✅ Conversación grupal completada en ${roomId}`);
      activeGroupConversations.delete(roomId);
    }
    return;
  }

  const currentMessage = state.messages[state.currentIndex];
  const bot = state.roleMapping[currentMessage.role];

  if (!bot) {
    console.error(`❌ No se encontró bot para rol: ${currentMessage.role}`);
    state.currentIndex++;
    setTimeout(() => sendNextGroupMessage(roomId), 2000);
    return;
  }

  // Aplicar traducciones y risas naturales
  let messageText = translateToSpanish(currentMessage.message);
  messageText = addNaturalLaughs(messageText);

  // Enviar mensaje
  await sendMessage(roomId, {
    userId: bot.id,
    username: bot.username,
    avatar: bot.avatar,
    isPremium: false,
    content: messageText,
    type: 'text'
  });

  console.log(`💬 [${state.topic}] ${bot.username}: ${messageText.substring(0, 50)}...`);

  // Avanzar al siguiente mensaje
  state.currentIndex++;

  // Programar siguiente mensaje (delay entre 4-8 segundos para naturalidad)
  const delay = Math.random() * 4000 + 4000; // 4-8 segundos
  setTimeout(() => sendNextGroupMessage(roomId), delay);
};

/**
 * ==============================================
 * FUNCIÓN: PROGRAMAR CONVERSACIONES GRUPALES PERIÓDICAS
 * ==============================================
 */

let groupConversationIntervals = new Map(); // roomId -> intervalId

export const schedulePeriodicGroupConversations = (roomId) => {
  // Evitar duplicados
  if (groupConversationIntervals.has(roomId)) {
    console.log(`⚠️ Ya hay conversaciones grupales programadas para ${roomId}`);
    return;
  }

  console.log(`🔄 Programando conversaciones grupales cada 10-15 minutos en ${roomId}`);

  // Primera conversación después de 30 segundos
  setTimeout(() => {
    startGroupConversation(roomId);
  }, 30000);

  // Conversaciones periódicas cada 10-15 minutos
  const intervalId = setInterval(() => {
    // Solo iniciar si no hay otra conversación activa
    if (!activeGroupConversations.has(roomId)) {
      startGroupConversation(roomId);
    }
  }, Math.random() * 300000 + 600000); // 10-15 minutos

  groupConversationIntervals.set(roomId, intervalId);
};

/**
 * Detener conversaciones grupales programadas
 */
export const stopPeriodicGroupConversations = (roomId) => {
  const intervalId = groupConversationIntervals.get(roomId);

  if (intervalId) {
    clearInterval(intervalId);
    groupConversationIntervals.delete(roomId);
    console.log(`⏹️ Conversaciones grupales detenidas en ${roomId}`);
  }

  // Limpiar conversación activa si existe
  if (activeGroupConversations.has(roomId)) {
    activeGroupConversations.delete(roomId);
  }
};

/**
 * Detener todas las conversaciones grupales
 */
export const stopAllGroupConversations = () => {
  groupConversationIntervals.forEach((intervalId, roomId) => {
    clearInterval(intervalId);
    console.log(`⏹️ Conversaciones grupales detenidas en ${roomId}`);
  });

  groupConversationIntervals.clear();
  activeGroupConversations.clear();
};

export default {
  startGroupConversation,
  schedulePeriodicGroupConversations,
  stopPeriodicGroupConversations,
  stopAllGroupConversations,
  GROUP_CONVERSATIONS
};
