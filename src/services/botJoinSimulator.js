/**
 * SIMULADOR DE ENTRADAS DE BOTS
 *
 * Simula que bots se conectan a la sala cada 2-3 minutos
 * Muestra notificación de entrada y añade el bot a la presencia
 */

// Ya no necesitamos Firestore aquí
// import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
// import { db } from '@/config/firebase';
// import { getRandomBotProfiles } from '@/config/botProfiles';

/**
 * NOMBRES LATINOS PARA BOTS ADICIONALES
 * Variedad para que parezcan usuarios diferentes
 */
const LATINO_NAMES = [
  // Activos/Tops
  { name: 'Juan', age: 28, role: 'activo', description: 'Activo gym' },
  { name: 'Diego', age: 31, role: 'activo', description: 'Activo dominante' },
  { name: 'Andrés', age: 26, role: 'activo', description: 'Activo deportista' },
  { name: 'Ricardo', age: 33, role: 'activo', description: 'Activo maduro' },
  { name: 'Sebastián', age: 29, role: 'activo', description: 'Activo versátil' },

  // Pasivos/Bottoms
  { name: 'Luis', age: 24, role: 'pasivo', description: 'Pasivo afeminado' },
  { name: 'Gabriel', age: 27, role: 'pasivo', description: 'Pasivo discreto' },
  { name: 'Marcos', age: 25, role: 'pasivo', description: 'Pasivo sumiso' },
  { name: 'Pablo', age: 22, role: 'pasivo', description: 'Pasivo joven' },
  { name: 'Rodrigo', age: 30, role: 'pasivo', description: 'Pasivo maduro' },

  // Osos/Bears
  { name: 'Óscar', age: 38, role: 'oso activo', description: 'Oso peludo' },
  { name: 'Manuel', age: 42, role: 'oso versátil', description: 'Oso maduro' },
  { name: 'Héctor', age: 35, role: 'oso activo', description: 'Oso dominante' },
  { name: 'Roberto', age: 40, role: 'oso pasivo', description: 'Oso cachondo' },

  // Versátiles
  { name: 'Eduardo', age: 27, role: 'versátil', description: 'Versátil abierto' },
  { name: 'Francisco', age: 32, role: 'versátil', description: 'Versátil moderno' },
  { name: 'Tomás', age: 29, role: 'versátil', description: 'Versátil fit' },
  { name: 'Santiago', age: 25, role: 'versátil', description: 'Versátil joven' },

  // Nombres adicionales variados
  { name: 'Felipe', age: 28, role: 'activo', description: 'Activo casual' },
  { name: 'Raúl', age: 34, role: 'pasivo', description: 'Pasivo curioso' },
  { name: 'Jorge', age: 30, role: 'versátil', description: 'Versátil aventurero' },
  { name: 'Mario', age: 26, role: 'activo', description: 'Activo deportivo' },
  { name: 'Alberto', age: 31, role: 'oso activo', description: 'Oso cariñoso' },
  { name: 'Adrián', age: 23, role: 'pasivo', description: 'Pasivo tímido' },
  { name: 'Cristian', age: 29, role: 'versátil', description: 'Versátil social' }
];

/**
 * Estado global de bots "virtuales" (que simulan estar conectados)
 * Estructura: Map de roomId → Set de botIds virtuales
 */
const virtualBotsByRoom = new Map();

/**
 * Temporizadores activos por sala
 */
const roomTimers = new Map();

/**
 * Obtiene un nombre aleatorio que no esté ya en uso
 */
const getRandomUnusedName = (roomId) => {
  const usedBots = virtualBotsByRoom.get(roomId) || new Set();
  const availableNames = LATINO_NAMES.filter(
    bot => !usedBots.has(`bot_join_${bot.name.toLowerCase()}`)
  );

  if (availableNames.length === 0) {
    // Si ya usamos todos, permitir reutilización
    virtualBotsByRoom.set(roomId, new Set());
    return LATINO_NAMES[Math.floor(Math.random() * LATINO_NAMES.length)];
  }

  return availableNames[Math.floor(Math.random() * availableNames.length)];
};

/**
 * Simula la entrada de un bot a la sala
 * SOLO muestra notificación, NO crea presencia en Firestore
 */
const simulateBotJoin = async (roomId, onJoinNotification) => {
  try {
    // Obtener nombre aleatorio
    const botData = getRandomUnusedName(roomId);
    const botId = `bot_join_${botData.name.toLowerCase()}`;

    // ⚠️ NO CREAR PRESENCIA EN FIRESTORE
    // Solo mostrar notificación visual
    // Los bots reales ya están creados por el coordinador

    // Marcar como usado
    if (!virtualBotsByRoom.has(roomId)) {
      virtualBotsByRoom.set(roomId, new Set());
    }
    virtualBotsByRoom.get(roomId).add(botId);

    // Notificar entrada (callback para mostrar toast)
    if (onJoinNotification) {
      onJoinNotification({
        username: `${botData.name}, ${botData.age}`,
        role: botData.description
      });
    }

    console.log(`👋 ${botData.name} se conectó a la sala ${roomId} (${botData.role})`);

  } catch (error) {
    console.error('Error simulando entrada de bot:', error);
  }
};

/**
 * Inicia el sistema de entradas simuladas para una sala
 *
 * @param {String} roomId - ID de la sala
 * @param {Function} onJoinNotification - Callback para mostrar notificación
 */
export const startJoinSimulator = (roomId, onJoinNotification) => {
  // Si ya hay timer activo, no crear otro
  if (roomTimers.has(roomId)) {
    console.log(`⏸️ Join simulator ya está activo en sala ${roomId}`);
    return;
  }

  console.log(`🎬 Iniciando join simulator para sala ${roomId}`);

  // Función que simula una entrada y programa la siguiente
  const scheduleNextJoin = () => {
    // Delay aleatorio entre 2-3 minutos (120000 - 180000 ms)
    const delay = Math.random() * (180000 - 120000) + 120000;

    const timerId = setTimeout(async () => {
      await simulateBotJoin(roomId, onJoinNotification);

      // Programar siguiente entrada
      scheduleNextJoin();
    }, delay);

    roomTimers.set(roomId, timerId);
  };

  // Iniciar ciclo
  scheduleNextJoin();

  // Opcional: Simular primera entrada inmediata (o esperar delay)
  // Comentar la siguiente línea si quieres esperar el delay completo
  setTimeout(() => simulateBotJoin(roomId, onJoinNotification), 5000); // Primera entrada a los 5 segundos
};

/**
 * Detiene el sistema de entradas simuladas para una sala
 *
 * @param {String} roomId - ID de la sala
 */
export const stopJoinSimulator = (roomId) => {
  const timerId = roomTimers.get(roomId);

  if (timerId) {
    clearTimeout(timerId);
    roomTimers.delete(roomId);
    console.log(`🛑 Join simulator detenido para sala ${roomId}`);
  }

  // Limpiar bots virtuales de la sala
  virtualBotsByRoom.delete(roomId);
};

/**
 * Detiene todos los simuladores activos
 */
export const stopAllJoinSimulators = () => {
  roomTimers.forEach((timerId, roomId) => {
    clearTimeout(timerId);
    console.log(`🛑 Join simulator detenido para sala ${roomId}`);
  });

  roomTimers.clear();
  virtualBotsByRoom.clear();

  console.log('🛑 Todos los join simulators detenidos');
};
