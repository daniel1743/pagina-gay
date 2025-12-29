/**
 * ⚠️ SISTEMA CRÍTICO: ASIGNACIÓN DE BOTS POR SALA
 *
 * REGLAS IMPORTANTES:
 * 1. Cada bot SOLO puede estar en UNA sala a la vez
 * 2. Cada bot tiene nombres/avatares DIFERENTES en cada sala
 * 3. PROHIBIDO usar el mismo nombre/avatar en múltiples salas
 * 4. Si un bot está en "global", NO puede estar en "santiago" o "viña"
 */

import { BOT_PROFILES } from '@/config/botProfiles';

// ✅ Registro global: qué bot está en qué sala
const botRoomAssignments = new Map(); // Map<botId, roomId>

// ✅ Nombres disponibles por sala (pool de nombres)
const ROOM_NAME_POOLS = {
  global: ['Sebastián', 'Diego', 'Matías', 'Felipe', 'Cristian', 'Rodrigo', 'Pablo', 'Javier'],
  santiago: ['Joaquín', 'Tomás', 'Vicente', 'Benjamín', 'Lucas', 'Martín', 'Agustín', 'Manuel'],
  gaming: ['Gamer_Alex', 'ProGamer_Max', 'PlayerOne', 'GG_Franco', 'Noob_Destroyer', 'MVP_Chris', 'GG_Mateo', 'LevelUp'],
  'mas-30': ['Carlos', 'Fernando', 'Roberto', 'Alejandro', 'Mauricio', 'Sergio', 'Ricardo', 'Eduardo'],
  valparaiso: ['Raúl', 'Andrés', 'Gonzalo', 'Ignacio', 'Nicolás', 'Jorge', 'Luis', 'Antonio'],
  'vina-del-mar': ['Bruno', 'Mateo', 'Gabriel', 'Daniel', 'Óscar', 'Hugo', 'Mario', 'Alberto'],
  concepcion: ['Claudio', 'Patricio', 'Marcelo', 'Héctor', 'Iván', 'Pedro', 'Miguel', 'Francisco']
};

// ✅ Avatares diferentes por sala (diferentes seeds para DiceBear)
const ROOM_AVATAR_SEEDS = {
  global: ['Apollo', 'Zeus', 'Hermes', 'Ares', 'Atlas', 'Orion', 'Phoenix', 'Thor'],
  santiago: ['Luna', 'Sol', 'Estrella', 'Cometa', 'Galaxia', 'Nebulosa', 'Cosmos', 'Astro'],
  gaming: ['Pixel', 'Byte', 'Code', 'Debug', 'Hack', 'Glitch', 'Script', 'Binary'],
  'mas-30': ['Oak', 'Pine', 'Cedar', 'Maple', 'Birch', 'Willow', 'Ash', 'Elm'],
  valparaiso: ['Wave', 'Ocean', 'Tide', 'Coral', 'Shell', 'Surf', 'Beach', 'Coast'],
  'vina-del-mar': ['Rose', 'Lily', 'Tulip', 'Daisy', 'Orchid', 'Jasmine', 'Iris', 'Violet'],
  concepcion: ['Mountain', 'Peak', 'Summit', 'Ridge', 'Cliff', 'Valley', 'Canyon', 'Hill']
};

// ✅ Colores de fondo diferentes por sala
const ROOM_AVATAR_COLORS = {
  global: ['b6e3f4', 'c0aede', 'ffdfbf', 'ffd5dc'],
  santiago: ['a8e6cf', 'feca57', 'd1d4f9', 'ff6b9d'],
  gaming: ['00d2ff', '00ff88', 'ff0080', 'ffea00'],
  'mas-30': ['8b7355', 'a0826d', 'b8956a', 'c9a87c'],
  valparaiso: ['1e90ff', '4169e1', '6495ed', '00bfff'],
  'vina-del-mar': ['ff69b4', 'ff1493', 'db7093', 'c71585'],
  concepcion: ['8b4513', 'a0522d', 'cd853f', 'daa520']
};

// ✅ Rastrear qué nombres/avatares ya se usaron en cada sala
const usedNamesPerRoom = new Map(); // Map<roomId, Set<name>>
const usedAvatarsPerRoom = new Map(); // Map<roomId, Set<avatarUrl>>

/**
 * ✅ Verifica si un bot está actualmente asignado a alguna sala
 */
export const isBotAssigned = (botId) => {
  return botRoomAssignments.has(botId);
};

/**
 * ✅ Obtiene la sala actual de un bot (si está asignado)
 */
export const getBotCurrentRoom = (botId) => {
  return botRoomAssignments.get(botId);
};

/**
 * ✅ Asigna un bot a una sala específica
 * IMPORTANTE: Si el bot ya está en otra sala, primero lo desasigna
 */
export const assignBotToRoom = (botId, roomId) => {
  // Si el bot ya está en otra sala, desasignarlo primero
  if (botRoomAssignments.has(botId)) {
    const currentRoom = botRoomAssignments.get(botId);
    if (currentRoom !== roomId) {
      console.log(`⚠️ [BOT ASSIGNMENT] Bot ${botId} se movió de sala ${currentRoom} a ${roomId}`);
      unassignBotFromRoom(botId);
    } else {
      console.log(`✅ [BOT ASSIGNMENT] Bot ${botId} ya está en sala ${roomId}`);
      return; // Ya está en la sala correcta
    }
  }

  botRoomAssignments.set(botId, roomId);
  console.log(`✅ [BOT ASSIGNMENT] Bot ${botId} asignado a sala ${roomId}`);
};

/**
 * ✅ Desasigna un bot de su sala actual
 */
export const unassignBotFromRoom = (botId) => {
  const currentRoom = botRoomAssignments.get(botId);
  if (currentRoom) {
    botRoomAssignments.delete(botId);
    console.log(`✅ [BOT ASSIGNMENT] Bot ${botId} desasignado de sala ${currentRoom}`);
  }
};

/**
 * ✅ Obtiene todos los bots asignados a una sala específica
 */
export const getBotsInRoom = (roomId) => {
  const botsInRoom = [];
  for (const [botId, assignedRoom] of botRoomAssignments.entries()) {
    if (assignedRoom === roomId) {
      botsInRoom.push(botId);
    }
  }
  return botsInRoom;
};

/**
 * ✅ Genera un nombre ÚNICO para un bot en una sala específica
 */
export const generateUniqueBotName = (botId, roomId) => {
  // Obtener pool de nombres de la sala
  const namePool = ROOM_NAME_POOLS[roomId] || ROOM_NAME_POOLS.global;

  // Obtener nombres ya usados en esta sala
  if (!usedNamesPerRoom.has(roomId)) {
    usedNamesPerRoom.set(roomId, new Set());
  }
  const usedNames = usedNamesPerRoom.get(roomId);

  // Buscar un nombre disponible
  let availableName = null;
  for (const name of namePool) {
    if (!usedNames.has(name)) {
      availableName = name;
      break;
    }
  }

  // Si todos están usados, generar uno aleatorio con número
  if (!availableName) {
    const randomNum = Math.floor(Math.random() * 999) + 1;
    availableName = `${namePool[0]}_${randomNum}`;
  }

  // Marcar como usado
  usedNames.add(availableName);

  console.log(`✅ [BOT NAME] Bot ${botId} en sala ${roomId} se llamará: ${availableName}`);
  return availableName;
};

/**
 * ✅ Genera un avatar ÚNICO para un bot en una sala específica
 */
export const generateUniqueBotAvatar = (botId, roomId) => {
  // Obtener pool de seeds de la sala
  const seedPool = ROOM_AVATAR_SEEDS[roomId] || ROOM_AVATAR_SEEDS.global;
  const colorPool = ROOM_AVATAR_COLORS[roomId] || ROOM_AVATAR_COLORS.global;

  // Obtener avatares ya usados en esta sala
  if (!usedAvatarsPerRoom.has(roomId)) {
    usedAvatarsPerRoom.set(roomId, new Set());
  }
  const usedAvatars = usedAvatarsPerRoom.get(roomId);

  // Generar avatar único
  let avatarUrl = null;
  let attempts = 0;
  const maxAttempts = 20;

  while (!avatarUrl && attempts < maxAttempts) {
    const randomSeed = seedPool[Math.floor(Math.random() * seedPool.length)];
    const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)];
    const candidateUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}&backgroundColor=${randomColor}`;

    if (!usedAvatars.has(candidateUrl)) {
      avatarUrl = candidateUrl;
      usedAvatars.add(candidateUrl);
    }
    attempts++;
  }

  // Fallback si no se encontró único
  if (!avatarUrl) {
    const uniqueSeed = `${roomId}_${botId}_${Date.now()}`;
    avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueSeed}&backgroundColor=${colorPool[0]}`;
    usedAvatars.add(avatarUrl);
  }

  console.log(`✅ [BOT AVATAR] Bot ${botId} en sala ${roomId} tendrá avatar único`);
  return avatarUrl;
};

/**
 * ✅ Obtiene un perfil de bot PERSONALIZADO para una sala específica
 * Incluye nombre y avatar únicos para esa sala
 */
export const getBotProfileForRoom = (botId, roomId) => {
  // Obtener perfil base
  const baseProfile = BOT_PROFILES.find(bot => bot.id === botId);
  if (!baseProfile) {
    console.error(`❌ [BOT PROFILE] No se encontró bot con ID ${botId}`);
    return null;
  }

  // Asignar bot a la sala
  assignBotToRoom(botId, roomId);

  // Generar nombre y avatar únicos para esta sala
  const uniqueName = generateUniqueBotName(botId, roomId);
  const uniqueAvatar = generateUniqueBotAvatar(botId, roomId);

  // Crear perfil personalizado
  const customizedProfile = {
    ...baseProfile,
    username: uniqueName, // ✅ NOMBRE ÚNICO POR SALA (sin emoji de bot)
    avatar: uniqueAvatar, // ✅ AVATAR ÚNICO POR SALA
    currentRoom: roomId,
    isBot: true
  };

  console.log(`✅ [BOT PROFILE] Bot ${botId} personalizado para sala ${roomId}: ${uniqueName}`);
  return customizedProfile;
};

/**
 * ✅ Limpia los nombres/avatares usados cuando un bot sale de una sala
 */
export const cleanupBotFromRoom = (botId, roomId, username, avatarUrl) => {
  // Remover nombre usado
  if (usedNamesPerRoom.has(roomId)) {
    usedNamesPerRoom.get(roomId).delete(username);
  }

  // Remover avatar usado
  if (usedAvatarsPerRoom.has(roomId)) {
    usedAvatarsPerRoom.get(roomId).delete(avatarUrl);
  }

  // Desasignar bot
  unassignBotFromRoom(botId);

  console.log(`✅ [BOT CLEANUP] Bot ${botId} limpiado de sala ${roomId}`);
};

/**
 * ✅ Obtiene estadísticas de asignación de bots
 */
export const getBotAssignmentStats = () => {
  const stats = {
    totalBotsAssigned: botRoomAssignments.size,
    botsByRoom: {},
    availableBots: []
  };

  // Contar bots por sala
  for (const [botId, roomId] of botRoomAssignments.entries()) {
    if (!stats.botsByRoom[roomId]) {
      stats.botsByRoom[roomId] = [];
    }
    stats.botsByRoom[roomId].push(botId);
  }

  // Bots disponibles (no asignados)
  for (const profile of BOT_PROFILES) {
    if (!botRoomAssignments.has(profile.id)) {
      stats.availableBots.push(profile.id);
    }
  }

  return stats;
};

/**
 * ✅ Resetea todas las asignaciones (útil para debugging)
 */
export const resetAllAssignments = () => {
  botRoomAssignments.clear();
  usedNamesPerRoom.clear();
  usedAvatarsPerRoom.clear();
  console.log('✅ [BOT ASSIGNMENT] Todas las asignaciones reseteadas');
};
