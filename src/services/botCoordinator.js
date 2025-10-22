/**
 * COORDINADOR DE BOTS
 *
 * Gestiona la activación/desactivación de bots según usuarios reales
 * Solo se activa cuando hay usuarios en la sala
 * Se desactiva gradualmente cuando entran más personas
 */

import { getRandomBotProfiles } from '@/config/botProfiles';
import {
  generateBotResponse,
  generateInitialMessage,
  getContextualDelay,
  containsOffensiveContent,
  generateModerationWarning
} from './geminiBotService';
import { sendMessage } from './chatService';
import {
  schedulePeriodicConversations,
  stopPeriodicConversations
} from './botConversationOrchestrator';

/**
 * CONFIGURACIÓN DE ACTIVACIÓN DE BOTS
 * ESTRATEGIA: Siempre mostrar mínimo 30 usuarios (bots + reales)
 * Los bots se desactivan gradualmente solo cuando hay 30+ usuarios REALES
 */
const MIN_TOTAL_USERS = 30; // Mínimo de usuarios visibles en la sala
const MAX_BOTS = 10; // Máximo de bots activos
const BOT_MESSAGE_INTERVAL = { min: 25, max: 50 }; // Intervalo entre mensajes (segundos)

/**
 * Calcula cuántos bots activar según usuarios reales
 * @param {Number} realUserCount - Número de usuarios reales
 * @returns {Object} - Configuración de bots
 */
const getBotConfigDynamic = (realUserCount) => {
  // Si no hay usuarios reales, activar 1 bot (no desperdiciar tokens)
  if (realUserCount === 0) {
    return {
      botsCount: 1,
      intervalMin: BOT_MESSAGE_INTERVAL.min,
      intervalMax: BOT_MESSAGE_INTERVAL.max
    };
  }

  // Si hay menos de 30 usuarios reales, completar hasta 30 con bots
  if (realUserCount < MIN_TOTAL_USERS) {
    const botsNeeded = Math.min(MIN_TOTAL_USERS - realUserCount, MAX_BOTS);
    return {
      botsCount: botsNeeded,
      intervalMin: BOT_MESSAGE_INTERVAL.min,
      intervalMax: BOT_MESSAGE_INTERVAL.max
    };
  }

  // Si hay 30+ usuarios reales, desactivar bots gradualmente
  // 30-35 usuarios: 5 bots
  // 36-40 usuarios: 3 bots
  // 41-45 usuarios: 2 bots
  // 46-50 usuarios: 1 bot
  // 51+ usuarios: 0 bots
  if (realUserCount >= 30 && realUserCount < 36) {
    return { botsCount: 5, intervalMin: 40, intervalMax: 70 };
  } else if (realUserCount >= 36 && realUserCount < 41) {
    return { botsCount: 3, intervalMin: 50, intervalMax: 80 };
  } else if (realUserCount >= 41 && realUserCount < 46) {
    return { botsCount: 2, intervalMin: 60, intervalMax: 90 };
  } else if (realUserCount >= 46 && realUserCount < 51) {
    return { botsCount: 1, intervalMin: 70, intervalMax: 100 };
  } else {
    // 51+ usuarios reales: desactivar todos los bots
    return { botsCount: 0, intervalMin: 0, intervalMax: 0 };
  }
};

// Mantener configuración legacy por compatibilidad (no se usa)
const BOT_ACTIVATION_CONFIG = {
  0: { botsCount: 0, intervalMin: 0, intervalMax: 0 },
  7: { botsCount: 0, intervalMin: 0, intervalMax: 0 }
};

/**
 * Estado global del coordinador por sala
 * Estructura: { roomId: { activeBots: [], intervals: [], isActive: bool } }
 */
const roomBotStates = new Map();

/**
 * Obtiene configuración de bots según número de usuarios reales
 * Usa la nueva lógica dinámica
 */
const getBotConfig = (realUserCount) => {
  return getBotConfigDynamic(realUserCount);
};

/**
 * Cuenta usuarios reales en una sala (excluye bots y sistema)
 */
const countRealUsers = (users) => {
  return users.filter(user =>
    user.userId !== 'system' &&
    !user.userId.startsWith('bot_')
  ).length;
};

/**
 * Envía mensaje de bot a la sala
 */
/**
 * Historial de mensajes enviados (anti-spam global)
 * Estructura: Map de userId → [{ message, timestamp }]
 */
const globalMessageHistory = new Map();
const SPAM_COOLDOWN = 7 * 60 * 1000; // 7 minutos

/**
 * Verifica si un mensaje es spam (repetido en menos de 7 min)
 */
const isSpamMessage = (userId, message) => {
  if (!globalMessageHistory.has(userId)) {
    return false;
  }

  const history = globalMessageHistory.get(userId);
  const now = Date.now();

  // Limpiar mensajes antiguos
  const validHistory = history.filter(entry => (now - entry.timestamp) < SPAM_COOLDOWN);
  globalMessageHistory.set(userId, validHistory);

  // Verificar si el mensaje ya fue enviado recientemente
  return validHistory.some(entry => entry.message === message);
};

/**
 * Registra un mensaje enviado
 */
const recordMessage = (userId, message) => {
  if (!globalMessageHistory.has(userId)) {
    globalMessageHistory.set(userId, []);
  }

  const history = globalMessageHistory.get(userId);
  const now = Date.now();

  history.push({ message, timestamp: now });

  // Limpiar mensajes antiguos
  const validHistory = history.filter(entry => (now - entry.timestamp) < SPAM_COOLDOWN);
  globalMessageHistory.set(userId, validHistory);
};

const sendBotMessage = async (roomId, botProfile, conversationHistory, userMessage = null, useGemini = true) => {
  try {
    let response;

    // Si hay historial de conversación y debe usar Gemini, generar respuesta con IA
    if (useGemini && conversationHistory.length > 0) {
      response = await generateBotResponse(botProfile, conversationHistory, userMessage);
    } else {
      // Usar mensaje inicial solo si es el primer mensaje
      response = generateInitialMessage(botProfile);
    }

    // 🛡️ ANTI-SPAM: Verificar si el mensaje es repetido
    if (isSpamMessage(botProfile.id, response)) {
      console.error(`🚫 SPAM BLOQUEADO: ${botProfile.username} intentó repetir: "${response}"`);
      return; // NO enviar mensaje spam
    }

    // Enviar mensaje a Firebase
    await sendMessage(roomId, {
      userId: botProfile.id,
      username: botProfile.username,
      avatar: botProfile.avatar,
      isPremium: false,
      content: response,
      type: 'text'
    });

    // Registrar mensaje enviado
    recordMessage(botProfile.id, response);

    console.log(`🤖 ${botProfile.username} envió: "${response}"`);
  } catch (error) {
    console.error(`Error enviando mensaje de bot ${botProfile.username}:`, error);
  }
};

/**
 * Inicia actividad de un bot específico en una sala
 */
const startBotActivity = (roomId, botProfile, getConversationHistory, config) => {
  let messageCount = 0; // Contador de mensajes enviados por este bot

  const sendRandomMessage = async () => {
    try {
      // Obtener historial actualizado dinámicamente
      const currentHistory = getConversationHistory();

      // Determinar si usar Gemini (después del primer mensaje, siempre usar Gemini)
      const useGemini = messageCount > 0;

      // Generar y enviar mensaje
      await sendBotMessage(roomId, botProfile, currentHistory, null, useGemini);
      messageCount++;

      // Programar siguiente mensaje con delay aleatorio
      const delay = Math.random() * (config.intervalMax - config.intervalMin) + config.intervalMin;
      const timeoutId = setTimeout(sendRandomMessage, delay * 1000);

      // Guardar timeout para poder cancelarlo después
      const roomState = roomBotStates.get(roomId);
      if (roomState) {
        roomState.intervals.push(timeoutId);
      }
    } catch (error) {
      console.error(`Error en actividad del bot ${botProfile.username}:`, error);
    }
  };

  // Iniciar con delay inicial
  const initialDelay = getContextualDelay();
  const timeoutId = setTimeout(sendRandomMessage, initialDelay);

  return timeoutId;
};

/**
 * Detiene todos los bots de una sala
 */
const stopAllBots = (roomId) => {
  const roomState = roomBotStates.get(roomId);
  if (!roomState) return;

  // 🆕 Detener conversaciones programadas
  if (roomState.conversationInterval) {
    stopPeriodicConversations(roomState.conversationInterval);
  }

  // Cancelar todos los intervalos
  roomState.intervals.forEach(intervalId => clearTimeout(intervalId));

  // Limpiar estado
  roomState.activeBots = [];
  roomState.intervals = [];
  roomState.conversationInterval = null; // ← Añadido
  roomState.isActive = false;

  console.log(`🛑 Todos los bots detenidos en sala ${roomId}`);
};

/**
 * Actualiza el número de bots activos según usuarios reales
 */
const updateBotActivity = (roomId, realUserCount, getConversationHistory) => {
  const config = getBotConfig(realUserCount);
  const roomState = roomBotStates.get(roomId) || {
    activeBots: [],
    intervals: [],
    isActive: false
  };

  // Si no hay usuarios reales, detener todos los bots (ahorro de tokens)
  if (realUserCount === 0) {
    if (roomState.isActive) {
      stopAllBots(roomId);
    }
    return;
  }

  // Si ya hay el número correcto de bots, no hacer nada
  if (roomState.activeBots.length === config.botsCount && roomState.isActive) {
    return;
  }

  // Si hay demasiados bots, reducir
  if (roomState.activeBots.length > config.botsCount) {
    const botsToRemove = roomState.activeBots.length - config.botsCount;
    console.log(`📉 Reduciendo bots de ${roomState.activeBots.length} a ${config.botsCount}`);

    // Detener todos y reiniciar con el número correcto
    stopAllBots(roomId);

    if (config.botsCount > 0) {
      startBotsForRoom(roomId, config.botsCount, getConversationHistory);
    }
    return;
  }

  // Si hay muy pocos bots, reiniciar con el número correcto
  if (roomState.activeBots.length < config.botsCount) {
    console.log(`📈 Necesitamos ${config.botsCount} bots, tenemos ${roomState.activeBots.length}`);

    // Detener todo y reiniciar limpio
    stopAllBots(roomId);

    if (config.botsCount > 0) {
      startBotsForRoom(roomId, config.botsCount, getConversationHistory);
    }
  }
};

/**
 * Inicia bots para una sala específica
 */
const startBotsForRoom = (roomId, botCount, getConversationHistory) => {
  // Obtener perfiles de bots aleatorios
  const botProfiles = getRandomBotProfiles(botCount);

  // ⚠️ DESACTIVADO - Ya no usar startBotActivity individual
  // Los bots SOLO conversan vía orquestador

  // 🆕 SOLO USAR CONVERSACIONES PROGRAMADAS
  const conversationInterval = schedulePeriodicConversations(roomId, botProfiles, 2); // Cada 2 minutos

  roomBotStates.set(roomId, {
    activeBots: botProfiles,
    intervals: [], // Sin intervals individuales
    conversationInterval: conversationInterval,
    isActive: true
  });

  console.log(`✅ ${botCount} bots iniciados en sala ${roomId}`);
  console.log(`🎭 Conversaciones programadas cada 2 minutos`);
};

/**
 * FUNCIÓN PRINCIPAL: Inicializa el sistema de bots para una sala
 *
 * @param {String} roomId - ID de la sala
 * @param {Array} currentUsers - Lista de usuarios actuales en la sala
 * @param {Function} getConversationHistory - Función que retorna el historial de mensajes
 */
export const initializeBots = (roomId, currentUsers = [], getConversationHistory) => {
  const realUserCount = countRealUsers(currentUsers);
  const config = getBotConfig(realUserCount);

  console.log(`🚀 Inicializando bots para sala ${roomId}`);
  console.log(`👥 Usuarios reales: ${realUserCount}`);
  console.log(`🤖 Bots a activar: ${config.botsCount}`);
  console.log(`📊 Total esperado: ${realUserCount + config.botsCount} usuarios (mín: ${MIN_TOTAL_USERS})`);

  // Si ya hay bots activos, actualizar
  if (roomBotStates.has(roomId)) {
    updateBotActivity(roomId, realUserCount, getConversationHistory);
    return;
  }

  // Iniciar bots por primera vez (siempre hay al menos 1)
  if (config.botsCount > 0) {
    startBotsForRoom(roomId, config.botsCount, getConversationHistory);
  }
};

/**
 * Actualiza bots cuando cambia el número de usuarios
 *
 * @param {String} roomId - ID de la sala
 * @param {Array} currentUsers - Lista actualizada de usuarios
 * @param {Function} getConversationHistory - Función que retorna el historial de mensajes
 */
export const updateBotsOnUserChange = (roomId, currentUsers, getConversationHistory) => {
  const realUserCount = countRealUsers(currentUsers);
  console.log(`🔄 Actualización: ${realUserCount} usuarios reales en sala ${roomId}`);

  updateBotActivity(roomId, realUserCount, getConversationHistory);
};

/**
 * Hace que un bot responda a un mensaje específico de usuario
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userMessage - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de conversación
 */
export const botRespondToUser = async (roomId, userMessage, conversationHistory) => {
  console.log(`👤 Usuario REAL escribió: "${userMessage}"`);

  const roomState = roomBotStates.get(roomId);
  if (!roomState || !roomState.isActive || roomState.activeBots.length === 0) {
    console.log('⚠️ No hay bots activos para responder');
    return; // No hay bots activos
  }

  // 🆕 AUMENTAR probabilidad a 80% para que SIEMPRE respondan a usuarios reales
  const shouldRespond = true;
  console.log("✅ Respondiendo a usuario real (100% - NUNCA ignorar)");

  if (!shouldRespond) {
    return;
  }

  // 🆕 Elegir 1-2 bots para responder (más interacción)
  // 50% de probabilidad de que respondan 2 bots, 50% de que responda 1 bot.
  const numBotsToRespond = Math.random() > 0.5 ? 2 : 1; 
  const botsToRespond = [];

  // Seleccionar bots aleatorios sin repetir
  for (let i = 0; i < Math.min(numBotsToRespond, roomState.activeBots.length); i++) {
    const availableBots = roomState.activeBots.filter(b => !botsToRespond.includes(b));
    if (availableBots.length > 0) {
      const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];
      botsToRespond.push(randomBot);
    }
  }

  console.log(`🤖 ${botsToRespond.map(b => b.username).join(' y ')} responderá(n) al usuario`);

  // Cada bot responde con un delay diferente (más natural)
  botsToRespond.forEach((bot, index) => {
    const delay = getContextualDelay() + (index * 3000); // 3 segundos de diferencia entre bots

    setTimeout(async () => {
      console.log(`💬 ${bot.username} enviando respuesta ahora...`);
      await sendBotMessage(roomId, bot, conversationHistory, userMessage, true);
    }, delay);
  });
};
/**
 * Detiene todos los bots de una sala específica
 *
 * @param {String} roomId - ID de la sala
 */
export const stopBotsInRoom = (roomId) => {
  stopAllBots(roomId);
  roomBotStates.delete(roomId);
  console.log(`🛑 Sistema de bots detenido para sala ${roomId}`);
};

/**
 * Detiene todos los bots de todas las salas
 */
export const stopAllBotsGlobally = () => {
  roomBotStates.forEach((_, roomId) => {
    stopAllBots(roomId);
  });
  roomBotStates.clear();
  console.log('🛑 Todos los bots detenidos globalmente');
};

/**
 * Obtiene estado actual de bots en una sala
 */
export const getBotStatus = (roomId) => {
  const roomState = roomBotStates.get(roomId);
  if (!roomState) {
    return { active: false, botCount: 0, bots: [] };
  }

  return {
    active: roomState.isActive,
    botCount: roomState.activeBots.length,
    bots: roomState.activeBots.map(bot => ({
      id: bot.id,
      username: bot.username,
      role: bot.role
    }))
  };
};

/**
 * Envía mensaje de bienvenida cuando entra un usuario nuevo
 */
export const sendWelcomeMessage = async (roomId, newUsername, conversationHistory) => {
  const roomState = roomBotStates.get(roomId);
  if (!roomState || !roomState.isActive || roomState.activeBots.length === 0) {
    return;
  }

  // Solo uno de los bots da la bienvenida (probabilidad 50%)
  if (Math.random() > 0.5) {
    return;
  }

  const randomBot = roomState.activeBots[
    Math.floor(Math.random() * roomState.activeBots.length)
  ];

  const welcomeMessage = `Hola ${newUsername}! 👋`;

  setTimeout(async () => {
    await sendMessage(roomId, {
      userId: randomBot.id,
      username: randomBot.username,
      avatar: randomBot.avatar,
      isPremium: false,
      content: welcomeMessage,
      type: 'text'
    });
  }, getContextualDelay() / 2); // Respuesta más rápida para bienvenida
};
