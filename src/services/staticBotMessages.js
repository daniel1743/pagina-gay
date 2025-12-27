/**
 * SISTEMA DE MENSAJES ESTÁTICOS DE BOTS
 * 
 * Este sistema muestra conversaciones predefinidas de bots sin que estos
 * se conecten realmente a Firestore. Los mensajes se inyectan en el historial
 * pero los bots NO aparecen en la lista de usuarios activos.
 * 
 * OBJETIVO: Mostrar actividad en las salas sin que los bots se cuenten como usuarios reales
 */

// Perfiles de bots estáticos (solo para mostrar mensajes)
const STATIC_BOT_PROFILES = [
  { id: 'static_bot_1', username: 'Carlos', avatar: '👨‍💼', role: 'Activo gym' },
  { id: 'static_bot_2', username: 'Mateo', avatar: '🎨', role: 'Pasivo música' },
  { id: 'static_bot_3', username: 'Diego', avatar: '🏋️', role: 'Versátil deporte' },
  { id: 'static_bot_4', username: 'Lucas', avatar: '🎮', role: 'Gamer activo' },
  { id: 'static_bot_5', username: 'Andrés', avatar: '📚', role: 'Pasivo intelectual' },
];

// Conversaciones predefinidas por sala
const STATIC_CONVERSATIONS = {
  'conversas-libres': [
    { bot: 'Carlos', message: '¡Hola a todos! ¿Cómo va el día?', delay: 0 },
    { bot: 'Mateo', message: 'Hola Carlos! Todo bien por aquí, ¿y tú?', delay: 5000 },
    { bot: 'Diego', message: 'Yo también ando bien, gracias por preguntar', delay: 10000 },
    { bot: 'Lucas', message: '¿Alguien más está por Santiago?', delay: 15000 },
    { bot: 'Andrés', message: 'Yo estoy en Valparaíso, pero siempre vengo a Santiago', delay: 20000 },
  ],
  'gaming': [
    { bot: 'Lucas', message: '¿Alguien juega Valorant? Busco squad', delay: 0 },
    { bot: 'Diego', message: 'Yo juego! ¿Qué rango tienes?', delay: 5000 },
    { bot: 'Carlos', message: 'Yo juego más LoL, pero puedo probar Valorant', delay: 10000 },
    { bot: 'Mateo', message: 'Yo juego Genshin Impact, ¿alguien más?', delay: 15000 },
  ],
  'santiago': [
    { bot: 'Carlos', message: '¡Hola! ¿Alguien más de Las Condes?', delay: 0 },
    { bot: 'Mateo', message: 'Yo soy de Providencia! Cerca', delay: 5000 },
    { bot: 'Diego', message: 'Ñuñoa aquí! ¿Quedamos algún día?', delay: 10000 },
  ],
  'valparaiso': [
    { bot: 'Andrés', message: '¡Hola porteños! ¿Cómo está el clima hoy?', delay: 0 },
    { bot: 'Lucas', message: 'Está nublado pero se ve bien', delay: 5000 },
    { bot: 'Mateo', message: 'Perfecto para quedarse en casa chateando', delay: 10000 },
  ],
  'mas-30': [
    { bot: 'Carlos', message: 'Buenas tardes a todos. ¿Cómo va el día?', delay: 0 },
    { bot: 'Andrés', message: 'Todo bien, trabajando desde casa', delay: 5000 },
    { bot: 'Diego', message: 'Yo también, la oficina en casa tiene sus ventajas', delay: 10000 },
  ],
  'amistad': [
    { bot: 'Mateo', message: '¡Hola! Busco nuevos amigos para charlar', delay: 0 },
    { bot: 'Lucas', message: 'Yo también! Siempre es bueno conocer gente nueva', delay: 5000 },
    { bot: 'Andrés', message: 'Me encanta la idea, ¿de qué les gusta hablar?', delay: 10000 },
  ],
  'osos-activos': [
    { bot: 'Carlos', message: '¡Hola osos! ¿Cómo están?', delay: 0 },
    { bot: 'Diego', message: 'Todo bien! ¿Alguien más activo por aquí?', delay: 5000 },
  ],
  'pasivos-buscando': [
    { bot: 'Mateo', message: 'Hola! ¿Hay activos disponibles?', delay: 0 },
    { bot: 'Andrés', message: 'Yo también busco, esperemos que haya alguien', delay: 5000 },
  ],
  'versatiles': [
    { bot: 'Diego', message: '¡Hola versátiles! ¿Cómo va?', delay: 0 },
    { bot: 'Lucas', message: 'Todo bien! Me gusta la flexibilidad', delay: 5000 },
  ],
  'quedar-ya': [
    { bot: 'Carlos', message: '¿Alguien quiere quedar hoy?', delay: 0 },
    { bot: 'Lucas', message: 'Yo podría, ¿dónde?', delay: 5000 },
  ],
  'hablar-primero': [
    { bot: 'Andrés', message: 'Me gusta conocer bien a las personas antes', delay: 0 },
    { bot: 'Mateo', message: 'Totalmente de acuerdo, la comunicación es clave', delay: 5000 },
  ],
  'morbosear': [
    { bot: 'Diego', message: '¡Hola! ¿Cómo va la tarde?', delay: 0 },
    { bot: 'Lucas', message: 'Todo bien, con ganas de charlar', delay: 5000 },
  ],
};

/**
 * Genera mensajes estáticos para una sala específica
 * Estos mensajes se inyectan en el historial pero NO se guardan en Firestore
 * 
 * @param {string} roomId - ID de la sala
 * @returns {Array} Array de mensajes estáticos formateados
 */
export const generateStaticBotMessages = (roomId) => {
  const conversations = STATIC_CONVERSATIONS[roomId] || STATIC_CONVERSATIONS['conversas-libres'];
  
  const now = Date.now();
  
  return conversations.map((conv, index) => {
    const botProfile = STATIC_BOT_PROFILES.find(b => b.username === conv.bot) || STATIC_BOT_PROFILES[0];
    
    // Calcular timestamp (mensajes más antiguos primero, espaciados por 1 minuto)
    const messageTimestamp = now - (conversations.length - index) * 60000;
    
    return {
      id: `static_bot_msg_${roomId}_${index}`,
      userId: botProfile.id,
      username: botProfile.username,
      avatar: botProfile.avatar,
      content: conv.message,
      type: 'text',
      // ✅ Formato compatible con Firestore Timestamp
      timestamp: messageTimestamp, // Timestamp numérico directo
      isStatic: true, // Flag para identificar mensajes estáticos
      reactions: {},
      readBy: []
    };
  });
};

/**
 * Verifica si un mensaje es estático (no viene de Firestore)
 * 
 * @param {object} message - Mensaje a verificar
 * @returns {boolean} True si es mensaje estático
 */
export const isStaticMessage = (message) => {
  return message.isStatic === true || 
         (message.userId && message.userId.startsWith('static_bot_'));
};

/**
 * Combina mensajes reales de Firestore con mensajes estáticos
 * 
 * @param {Array} realMessages - Mensajes reales de Firestore
 * @param {string} roomId - ID de la sala
 * @returns {Array} Array combinado de mensajes
 */
export const combineMessagesWithStatic = (realMessages, roomId) => {
  // ✅ Filtrar mensajes reales (excluir mensajes estáticos que puedan haber quedado)
  const realOnly = realMessages.filter(msg => !isStaticMessage(msg));
  
  const staticMessages = generateStaticBotMessages(roomId);
  
  // Combinar mensajes reales con estáticos
  const combined = [...realOnly, ...staticMessages];
  
  // Ordenar por timestamp (manejar tanto Timestamp de Firestore como números)
  combined.sort((a, b) => {
    const getTimestamp = (msg) => {
      if (typeof msg.timestamp === 'number') return msg.timestamp;
      if (msg.timestamp?.toMillis) return msg.timestamp.toMillis();
      if (msg.timestamp?.seconds) return msg.timestamp.seconds * 1000;
      return 0;
    };
    
    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    return timeA - timeB;
  });
  
  return combined;
};

