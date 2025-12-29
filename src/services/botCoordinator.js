/**
 * COORDINADOR DE BOTS
 *
 * Gestiona la activación/desactivación de bots según usuarios reales
 * Solo se activa cuando hay usuarios en la sala
 * Se desactiva gradualmente cuando entran más personas
 */

import { getRandomBotProfiles, BOT_PROFILES } from '@/config/botProfiles';
import {
  generateBotResponse,
  generateInitialMessage,
  getContextualDelay,
  containsOffensiveContent,
  generateModerationWarning
} from './openAIBotService'; // ✅ CAMBIADO: Ahora usa OpenAI para interactuar con usuarios REALES
import { sendMessage } from './chatService';
import {
  schedulePeriodicConversations,
  stopPeriodicConversations
} from './botConversationOrchestrator';
import {
  schedulePeriodicGroupConversations,
  stopPeriodicGroupConversations
} from './botGroupConversation';
import {
  activateAIForUser,
  aiRespondToUser,
  checkUserInactivity as checkAIUserInactivity,
  clearRoomAI
} from './aiUserInteraction';
import {
  getBotProfileForRoom,
  isBotAssigned,
  getBotCurrentRoom,
  cleanupBotFromRoom,
  getBotAssignmentStats
} from './botRoomAssignment';

/**
 * CONFIGURACIÓN DE ACTIVACIÓN DE BOTS
 * ✅ ESTRATEGIA ACTUALIZADA 2025-12-16: Sistema sutil y realista
 * - Solo activar bots cuando hay 1-3 usuarios reales (romper el hielo)
 * - Desactivar cuando hay 4+ usuarios (ya hay masa crítica)
 * - Los bots responden con delays humanos (5-15 segundos)
 */
const BOT_MESSAGE_INTERVAL = { min: 30, max: 60 }; // Intervalo entre mensajes (segundos)

/**
 * Calcula cuántos bots activar según usuarios reales
 * ✅ ESTRATEGIA DE DEGRADACIÓN GRADUAL
 *
 * OBJETIVO: Bots desaparecen progresivamente a medida que hay más usuarios reales
 *
 * @param {Number} realUserCount - Número de usuarios reales
 * @returns {Object} - Configuración de bots { botsCount, intervalMin, intervalMax, strategy }
 */
const getBotConfigDynamic = (realUserCount) => {
  // ⚠️ BOTS DE FONDO DESACTIVADOS TEMPORALMENTE
  // Solo se usará el sistema de IA conversacional puro

  // 🎯 FASE 1: SALA VACÍA (0 usuarios)
  // Sin bots - IA también desactivada
  if (realUserCount === 0) {
    console.log('🔵 [BOT SYSTEM] Sala vacía - Sistema en standby (solo IA activa con usuarios)');
    return {
      botsCount: 0,
      intervalMin: 0,
      intervalMax: 0,
      strategy: 'empty_room'
    };
  }

  // 🎯 FASE 2: CON USUARIOS (1+ usuarios)
  // ⚠️ BOTS COMPLETAMENTE DESACTIVADOS - Sistema en standby
  // Los bots ahora son estáticos (solo muestran mensajes predefinidos sin conectarse)
  console.log(`🟢 [BOT SYSTEM] ${realUserCount} usuarios reales → BOTS DESACTIVADOS (sistema en standby, solo mensajes estáticos)`);
  return {
    botsCount: 0, // ⚠️ DESACTIVADO COMPLETAMENTE
    intervalMin: 0,
    intervalMax: 0,
    strategy: 'standby' // Sistema en standby
  };
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
  const realUsers = users.filter(user => {
    const userId = user.userId || user.id;
    const isBot = userId === 'system' ||
                  userId?.startsWith('bot_') ||
                  userId?.startsWith('bot-') ||
                  userId?.startsWith('static_bot_') || // ✅ Excluir bots estáticos
                  userId?.includes('bot_join');
    return !isBot;
  });

  // Debug log para ver qué usuarios se están contando
  if (realUsers.length > 0) {
    console.log(`👥 Usuarios reales detectados (${realUsers.length}):`, realUsers.map(u => ({
      id: u.id || u.userId,
      username: u.username
    })));
  }

  return realUsers.length;
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
  // 🚫 DESACTIVADO: No enviar mensajes de bots automáticamente
  console.log(`🚫 [BOT COORDINATOR] sendBotMessage DESACTIVADO - No se enviarán mensajes de bots (bot=${botProfile?.username}, roomId=${roomId})`);
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
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
  */
};

/**
 * Inicia actividad de un bot específico en una sala
 */
const startBotActivity = (roomId, botProfile, getConversationHistory, config) => {
  // 🚫 DESACTIVADO: No iniciar actividad de bots automáticamente
  console.log(`🚫 [BOT COORDINATOR] startBotActivity DESACTIVADO - No se iniciará actividad de bots (bot=${botProfile?.username}, roomId=${roomId})`);
  return null;
  
  /* CÓDIGO ORIGINAL COMENTADO
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
  */
};

/**
 * Detiene todos los bots de una sala
 * ✅ ACTUALIZADO: Hace cleanup de todos los bots asignados
 */
const stopAllBots = (roomId) => {
  const roomState = roomBotStates.get(roomId);
  if (!roomState) return;

  // ✅ Cleanup: Liberar todos los bots de esta sala
  if (roomState.activeBots && roomState.activeBots.length > 0) {
    roomState.activeBots.forEach(bot => {
      const botId = bot.id;
      const username = bot.username;
      const avatar = bot.avatar;
      cleanupBotFromRoom(botId, roomId, username, avatar);
      console.log(`✅ Cleanup: Bot ${botId} (${username}) liberado de sala ${roomId}`);
    });
  }

  // 🆕 Detener conversaciones programadas
  if (roomState.conversationInterval) {
    stopPeriodicConversations(roomState.conversationInterval);
  }

  // 🎭 Detener conversaciones grupales
  stopPeriodicGroupConversations(roomId);

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
 * ✅ CORREGIDO: No detener bots inmediatamente si hay 0 usuarios (puede ser un delay en la detección)
 */
const updateBotActivity = (roomId, realUserCount, getConversationHistory) => {
  const config = getBotConfig(realUserCount);
  const roomState = roomBotStates.get(roomId) || {
    activeBots: [],
    intervals: [],
    isActive: false,
    lastUserCount: 0,
    lastUserCountTime: Date.now()
  };

  // ✅ CORREGIDO: Solo detener bots si realmente no hay usuarios durante un tiempo razonable
  // Esto evita que se detenga inmediatamente si hay un delay en la detección de usuarios
  if (realUserCount === 0) {
    // Si ya había usuarios antes, dar un tiempo de gracia antes de detener
    if (roomState.lastUserCount > 0) {
      const timeSinceLastUser = Date.now() - (roomState.lastUserCountTime || Date.now());
      // Si pasaron menos de 10 segundos desde que había usuarios, no detener
      if (timeSinceLastUser < 10000) {
        console.log(`⏳ [BOT COORDINATOR] Esperando confirmación de usuarios (${Math.round(timeSinceLastUser/1000)}s desde último usuario)`);
        return;
      }
    }
    
    // Si no hay usuarios y ya estaba activo, detener
    if (roomState.isActive) {
      stopAllBots(roomId);
    }
    return;
  }

  // Actualizar timestamp de último usuario detectado
  roomState.lastUserCount = realUserCount;
  roomState.lastUserCountTime = Date.now();
  roomState.isActive = true;
  roomBotStates.set(roomId, roomState);

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
 * ✅ ACTUALIZADO: Usa perfiles únicos por sala
 */
const startBotsForRoom = (roomId, botCount, getConversationHistory) => {
  // ✅ Obtener bots disponibles que NO estén en otras salas
  const availableBotIds = BOT_PROFILES
    .filter(bot => {
      const botId = bot.id;
      // Solo usar bots que NO están asignados, o que están en ESTA sala
      if (!isBotAssigned(botId)) return true;
      const currentRoom = getBotCurrentRoom(botId);
      return currentRoom === roomId;
    })
    .map(bot => bot.id)
    .slice(0, botCount);

  // ✅ Crear perfiles personalizados para esta sala
  const botProfiles = availableBotIds.map(botId => getBotProfileForRoom(botId, roomId));

  console.log(`✅ [BOT COORDINATOR] Bots asignados a sala ${roomId}:`, botProfiles.map(b => `${b.username} (ID: ${b.id})`));

  // ⚠️ COMPLETAMENTE DESACTIVADO - TODAS LAS CONVERSACIONES DE BOTS
  // Solo el sistema de IA conversacional debe estar activo

  // ⚠️ DESACTIVADO: Conversaciones programadas
  // const conversationInterval = schedulePeriodicConversations(roomId, botProfiles, 0.5);

  // ⚠️ DESACTIVADO: Conversaciones grupales (bots fingiendo ser usuarios reales)
  // schedulePeriodicGroupConversations(roomId);

  roomBotStates.set(roomId, {
    activeBots: botProfiles, // ✅ Guardar bots con perfiles personalizados
    intervals: [],
    conversationInterval: null, // ⚠️ Sin conversaciones
    isActive: true, //  ⚠️ Sistema desactivado
    lastUserCount: 0,
    lastUserCountTime: Date.now()
  });

  console.log(`⚠️ [BOT COORDINATOR] Sistema de bots DESACTIVADO en sala ${roomId}`);
  console.log(`✅ [BOT COORDINATOR] Solo IA conversacional activa (sin bots falsos)`);
};

/**
 * FUNCIÓN PRINCIPAL: Inicializa el sistema de bots para una sala
 *
 * @param {String} roomId - ID de la sala
 * @param {Array} currentUsers - Lista de usuarios actuales en la sala
 * @param {Function} getConversationHistory - Función que retorna el historial de mensajes
 */
export const initializeBots = (roomId, currentUsers = [], getConversationHistory) => {
  // DEBUG: Ver TODOS los usuarios antes de filtrar
  console.log(`🔍 [DEBUG] Total usuarios recibidos: ${currentUsers.length}`);
  currentUsers.forEach(u => {
    const userId = u.userId || u.id;
    console.log(`  - ${u.username || 'sin nombre'} (ID: ${userId})`);
  });

  const realUserCount = countRealUsers(currentUsers);
  const config = getBotConfig(realUserCount);

  console.log(`🚀 Inicializando bots para sala ${roomId}`);
  console.log(`👥 Usuarios reales: ${realUserCount}`);
  console.log(`🤖 Bots a activar: ${config.botsCount}`);
  console.log(`📊 Total en sala: ${realUserCount + config.botsCount} usuarios`);

  // Si ya hay bots activos, actualizar
  if (roomBotStates.has(roomId)) {
    updateBotActivity(roomId, realUserCount, getConversationHistory);
    return;
  }

  // Iniciar bots por primera vez (siempre hay al menos 1)
  if (config.botsCount > 0) {
    startBotsForRoom(roomId, config.botsCount, getConversationHistory);
  } else if (realUserCount > 0 && !roomBotStates.has(roomId)) {
    roomBotStates.set(roomId, {
      activeBots: [],
      intervals: [],
      isActive: true,
      lastUserCount: realUserCount,
      lastUserCountTime: Date.now()
    });
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
 * Hace que la IA responda a un mensaje específico de usuario
 * ✨ NUEVO SISTEMA: IA pura en lugar de bots programados
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userMessage - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de conversación
 * @param {String} userId - ID del usuario real
 */
export const botRespondToUser = async (roomId, userMessage, conversationHistory, userId) => {
  console.log(`👤 Usuario REAL (${userId?.substring(0, 8)}) escribió: "${userMessage.substring(0, 50)}..."`);

  const roomState = roomBotStates.get(roomId);
  if (!roomState || !roomState.isActive) {
    console.log('⚠️ Sistema de chat no está activo');
    return;
  }

  // 🚫 DESACTIVADO: No responder automáticamente a usuarios
  // ✨ SISTEMA AI PURO: La IA responde con delay natural (10-20 segundos)
  // Los bots de fondo siguen conversando entre ellos
  // await aiRespondToUser(roomId, userId, userMessage, conversationHistory);
  console.log(`🚫 [BOT COORDINATOR] aiRespondToUser DESACTIVADO - No se enviarán respuestas automáticas`);

  // Verificar inactividad después de 5 minutos
  setTimeout(() => {
    checkAIUserInactivity(roomId, userId);
  }, 300000);
};
/**
 * Detiene todos los bots de una sala específica
 *
 * @param {String} roomId - ID de la sala
 */
export const stopBotsInRoom = (roomId) => {
  stopAllBots(roomId);
  clearRoomAI(roomId); // Limpiar conversaciones AI
  roomBotStates.delete(roomId);
  console.log(`🛑 Sistema de bots y AI detenido para sala ${roomId}`);
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
 * Activa la IA cuando entra un usuario real
 * ✨ NUEVO: La IA se activa automáticamente y envía bienvenida personalizada
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @param {String} username - Nombre del usuario
 */
export const activateAIWhenUserEnters = (roomId, userId, username) => {
  // ✅ CORREGIDO: Activar IA incluso si el sistema de bots no está completamente activo
  // La IA debe activarse cuando hay usuarios reales, independientemente del estado de los bots
  const roomState = roomBotStates.get(roomId);
  
  if (!roomState) {
    // Si no hay estado, crear uno básico para la IA
    roomBotStates.set(roomId, {
      activeBots: [],
      intervals: [],
      isActive: true,
      lastUserCount: 0,
      lastUserCountTime: Date.now()
    });
  } else {
    roomState.isActive = true;
    roomBotStates.set(roomId, roomState);
  }

  console.log(`✨ [AI ACTIVATION] Activando IA para usuario ${username} en sala ${roomId}`);
  
  // 🚫 DESACTIVADO: No activar IA automáticamente (evitar spam)
  // ✨ Activar IA para este usuario
  // La IA enviará automáticamente un mensaje de bienvenida
  // activateAIForUser(roomId, userId, username);
  console.log(`🚫 [AI ACTIVATION] activateAIForUser DESACTIVADO - No se activará IA automáticamente`);
};

/**
 * Envía mensaje de bienvenida cuando entra un usuario nuevo (LEGACY - mantenido por compatibilidad)
 * ⚠️ NOTA: La bienvenida ahora la maneja la IA automáticamente
 */
export const sendWelcomeMessage = async (roomId, newUsername, conversationHistory) => {
  // Ya no usamos este sistema - la IA se encarga de la bienvenida
  // Mantenido para no romper código existente
  console.log(`ℹ️ sendWelcomeMessage llamado pero deshabilitado (la IA se encarga ahora)`);
};
