/**
 * SISTEMA DE BOT ANFITRIÓN
 *
 * Gestiona la asignación de UN bot específico para cada usuario real
 * mientras otros bots mantienen conversaciones de fondo
 *
 * Flujo natural:
 * 1. Usuario entra → Se asigna bot anfitrión
 * 2. Bot anfitrión interactúa solo con ese usuario
 * 3. Otros bots siguen charlando entre ellos (fondo)
 * 4. Si bot falla → "Ricardo abandonó la sala" → Nuevo bot entra
 */

import { sendMessage } from './chatService';
import { getRandomBotProfiles, BOT_PROFILES } from '@/config/botProfiles';
import { generateBotResponse } from './geminiBotService';
import {
  getBotProfileForRoom,
  isBotAssigned,
  getBotCurrentRoom,
  cleanupBotFromRoom,
  assignBotToRoom
} from './botRoomAssignment';

/**
 * Estado global del sistema de anfitriones
 * Estructura: {
 *   roomId: {
 *     hosts: Map<userId, botData>,
 *     lastActivity: Map<userId, timestamp>,
 *     assignedBots: Set<botId>,
 *     botMetadata: Map<botId, { username, avatar }> // ✅ Para cleanup
 *   }
 * }
 */
const roomHostStates = new Map();

/**
 * Bots disponibles para rotar (excluye los ya asignados)
 * ✅ ACTUALIZADO: Verifica que el bot no esté en otra sala
 */
const getAvailableBots = (roomId, excludeBotIds = []) => {
  // Obtener bots disponibles (no asignados a otras salas o ya usados en esta sala)
  const availableBotIds = BOT_PROFILES
    .filter(bot => {
      const botId = bot.id;

      // Si ya está excluido en esta sala, no usarlo
      if (excludeBotIds.includes(botId)) return false;

      // Si el bot NO está asignado a ninguna sala, está disponible
      if (!isBotAssigned(botId)) return true;

      // Si está asignado pero es a ESTA sala, está disponible (puede rotar dentro de la misma sala)
      const currentRoom = getBotCurrentRoom(botId);
      return currentRoom === roomId;
    })
    .map(bot => bot.id);

  return availableBotIds.map(botId => getBotProfileForRoom(botId, roomId));
};

/**
 * Inicializa el estado de una sala
 * ✅ ACTUALIZADO: Incluye metadata para cleanup
 */
const initRoomState = (roomId) => {
  if (!roomHostStates.has(roomId)) {
    roomHostStates.set(roomId, {
      hosts: new Map(),           // userId -> botData
      lastActivity: new Map(),    // userId -> timestamp
      assignedBots: new Set(),    // Set de botIds asignados
      botMetadata: new Map()      // botId -> { username, avatar } para cleanup
    });
  }
  return roomHostStates.get(roomId);
};

/**
 * Asigna un bot anfitrión a un usuario específico
 * ✅ ACTUALIZADO: Usa perfiles únicos por sala y guarda metadata
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @returns {Object} - Bot asignado
 */
export const assignHostBot = (roomId, userId) => {
  const state = initRoomState(roomId);

  // Si ya tiene anfitrión, retornarlo
  if (state.hosts.has(userId)) {
    return state.hosts.get(userId);
  }

  // Obtener bot disponible (no asignado a otro usuario en esta sala, ni en otras salas)
  const assignedBotIds = Array.from(state.assignedBots);
  const availableBots = getAvailableBots(roomId, assignedBotIds);

  if (availableBots.length === 0) {
    console.warn(`⚠️ No hay bots disponibles para asignar en ${roomId}`);
    return null;
  }

  const selectedBot = availableBots[0];
  const botId = selectedBot.id;

  // ✅ Asignar bot con perfil personalizado para esta sala
  state.hosts.set(userId, selectedBot);
  state.assignedBots.add(botId);
  state.lastActivity.set(userId, Date.now());

  // ✅ Guardar metadata para cleanup (nombre y avatar únicos de esta sala)
  state.botMetadata.set(botId, {
    username: selectedBot.username,
    avatar: selectedBot.avatar
  });

  console.log(`🎯 Bot anfitrión asignado: ${selectedBot.username} (ID: ${botId}) → Usuario ${userId.substring(0, 8)} en sala ${roomId}`);
  console.log(`✅ Bot profile personalizado para sala ${roomId}: nombre="${selectedBot.username}", avatar="${selectedBot.avatar.substring(0, 50)}..."`);

  // Enviar mensaje de bienvenida del bot
  sendWelcomeMessage(roomId, selectedBot, userId);

  return selectedBot;
};

/**
 * Envía mensaje de bienvenida del bot anfitrión
 */
const sendWelcomeMessage = async (roomId, bot, userId) => {
  const welcomeMessages = [
    "Hola! Bienvenido a la sala 👋",
    "Hey! Qué tal, recién llegas?",
    "Hola! Cómo estás? 😊",
    "Buenas! Bienvenido al chat",
    "Hey! Qué onda, nuevo por aquí?"
  ];

  const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  // Esperar 5-8 segundos antes de saludar (simular escritura humana)
  setTimeout(async () => {
    try {
      await sendMessage(roomId, {
        userId: bot.userId,
        username: bot.username,
        avatar: bot.avatar,
        isPremium: bot.isPremium || false,
        content: randomMessage,
        type: 'text'
      });
      console.log(`💬 [ANFITRIÓN] ${bot.username}: "${randomMessage}"`);
    } catch (error) {
      console.error(`❌ Error enviando bienvenida:`, error);
    }
  }, 5000 + Math.random() * 3000);
};

/**
 * Bot anfitrión responde a mensaje de usuario
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario
 * @param {String} userMessage - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de la conversación
 */
export const hostBotRespond = async (roomId, userId, userMessage, conversationHistory) => {
  const state = roomHostStates.get(roomId);
  if (!state) {
    console.warn(`⚠️ No hay estado para sala ${roomId}`);
    return;
  }

  // Actualizar última actividad
  state.lastActivity.set(userId, Date.now());

  // Obtener bot anfitrión asignado
  let hostBot = state.hosts.get(userId);

  // Si no tiene anfitrión, asignar uno
  if (!hostBot) {
    hostBot = assignHostBot(roomId, userId);
    if (!hostBot) return;
  }

  console.log(`💬 [ANFITRIÓN] ${hostBot.username} responderá a usuario ${userId.substring(0, 8)}`);

  // Delay humano (5-15 segundos)
  const delay = 5000 + Math.random() * 10000;

  setTimeout(async () => {
    try {
      // Generar respuesta con Gemini
      const response = await generateBotResponse(
        hostBot,
        userMessage,
        conversationHistory,
        roomId
      );

      if (!response) {
        console.warn(`⚠️ Bot ${hostBot.username} no pudo generar respuesta`);
        // Rotar bot (fallo)
        await rotateHostBot(roomId, userId, "No pude responder adecuadamente");
        return;
      }

      // Enviar respuesta
      await sendMessage(roomId, {
        userId: hostBot.userId,
        username: hostBot.username,
        avatar: hostBot.avatar,
        isPremium: hostBot.isPremium || false,
        content: response,
        type: 'text'
      });

      console.log(`✅ [ANFITRIÓN] ${hostBot.username}: "${response.substring(0, 50)}..."`);

    } catch (error) {
      console.error(`❌ Error en respuesta de anfitrión:`, error);
      // Rotar bot (error)
      await rotateHostBot(roomId, userId, "Tuve un problema técnico");
    }
  }, delay);
};

/**
 * Rota el bot anfitrión (cuando falla o no puede responder)
 * ✅ ACTUALIZADO: Hace cleanup del bot saliente
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario
 * @param {String} reason - Razón de la rotación (opcional)
 */
export const rotateHostBot = async (roomId, userId, reason = null) => {
  const state = roomHostStates.get(roomId);
  if (!state || !state.hosts.has(userId)) return;

  const oldBot = state.hosts.get(userId);
  const oldBotId = oldBot.id;

  console.log(`🔄 Rotando bot anfitrión para usuario ${userId.substring(0, 8)}`);
  console.log(`   Saliente: ${oldBot.username} (ID: ${oldBotId})`);

  // Mensaje de sistema: bot abandona sala
  await sendMessage(roomId, {
    userId: 'system',
    username: 'Sistema',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
    content: `${oldBot.username} abandonó la sala`,
    type: 'system'
  });

  // ✅ Obtener metadata del bot (nombre y avatar usados en esta sala)
  const botMetadata = state.botMetadata.get(oldBotId);

  // ✅ Cleanup: Liberar nombre y avatar del bot en esta sala
  if (botMetadata) {
    cleanupBotFromRoom(oldBotId, roomId, botMetadata.username, botMetadata.avatar);
    console.log(`✅ Cleanup realizado: Bot ${oldBotId} liberado de sala ${roomId}`);
  }

  // Remover bot anterior del estado local
  state.hosts.delete(userId);
  state.assignedBots.delete(oldBotId);
  state.botMetadata.delete(oldBotId);

  // Asignar nuevo bot
  const newBot = assignHostBot(roomId, userId);

  if (!newBot) {
    console.error(`❌ No se pudo asignar nuevo bot anfitrión`);
    return;
  }

  console.log(`   Entrante: ${newBot.username} (ID: ${newBot.id})`);

  // Mensaje de sistema: nuevo bot entra
  await sendMessage(roomId, {
    userId: 'system',
    username: 'Sistema',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=system',
    content: `${newBot.username} se unió a la sala`,
    type: 'system'
  });

  // Nuevo bot rompe el hielo
  const iceBreakers = [
    "Hola! Recién llego, ¿en qué estábamos?",
    "Buenas! Me perdí de algo? 👀",
    "Hey! Qué se cuenta por aquí?",
    "Hola! Disculpen la tardanza, qué tal todo?",
    "Buenas! Parece que llegué justo a tiempo jaja"
  ];

  const iceBreaker = iceBreakers[Math.floor(Math.random() * iceBreakers.length)];

  setTimeout(async () => {
    await sendMessage(roomId, {
      userId: newBot.id,
      username: newBot.username,
      avatar: newBot.avatar,
      isPremium: newBot.isPremium || false,
      content: iceBreaker,
      type: 'text'
    });
  }, 3000 + Math.random() * 2000);
};

/**
 * Desasigna bot anfitrión cuando usuario está inactivo >3 minutos
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario
 */
export const checkUserInactivity = (roomId, userId) => {
  const state = roomHostStates.get(roomId);
  if (!state || !state.hosts.has(userId)) return;

  const lastActivity = state.lastActivity.get(userId);
  const now = Date.now();
  const inactiveTime = now - lastActivity;

  // Si inactivo >3 minutos, desasignar bot
  if (inactiveTime > 180000) {
    console.log(`⏱️ Usuario ${userId.substring(0, 8)} inactivo >3min, desasignando bot`);
    const bot = state.hosts.get(userId);
    state.hosts.delete(userId);
    state.assignedBots.delete(bot.userId);
    state.lastActivity.delete(userId);
  }
};

/**
 * Limpia todos los anfitriones de una sala
 */
export const clearRoomHosts = (roomId) => {
  if (roomHostStates.has(roomId)) {
    roomHostStates.delete(roomId);
    console.log(`🧹 Anfitriones limpiados en sala ${roomId}`);
  }
};

/**
 * Obtiene el bot anfitrión asignado a un usuario
 */
export const getHostBot = (roomId, userId) => {
  const state = roomHostStates.get(roomId);
  return state?.hosts.get(userId) || null;
};

/**
 * Obtiene todos los bots asignados como anfitriones en una sala
 */
export const getAssignedBots = (roomId) => {
  const state = roomHostStates.get(roomId);
  return state ? Array.from(state.assignedBots) : [];
};
