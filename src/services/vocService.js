/**
 * 🎯 SERVICIO VOC (Voice of Customer)
 * 
 * Sistema inteligente que envía mensajes informativos cuando no hay actividad en las salas.
 * 
 * Características:
 * - Aparece después de 30 segundos sin mensajes
 * - No invasivo - mensajes útiles e informativos
 * - Varios mensajes rotativos
 * - Información sobre: horarios activos, recompensas Premium, crecimiento de la comunidad
 */

import { sendMessage } from './chatService';

// 🎯 Mensajes VOC variados (rotación inteligente)
const VOC_MESSAGES = [
  {
    category: 'icebreaker',
    messages: [
      '💬 ¿De qué te gustaría hablar? Comparte tus intereses o lo que estás buscando',
      '🔥 Rompe el hielo: ¿Qué te trae por aquí hoy?',
      '👋 ¡Hola! Cuéntanos qué te gusta hacer o qué estás buscando',
      '💭 ¿Buscas amistad, conocer personas o algo más? ¡Escribe lo que quieras!'
    ]
  },
  {
    category: 'active-hours',
    messages: [
      '⏰ Los horarios más activos son entre las 6-7 PM. ¡Pero siempre hay gente conectada!',
      '🌙 La comunidad está más activa en las tardes/noches. ¡Vuelve más tarde si quieres más conversación!',
      '⏱️ Las horas pico suelen ser entre las 6-8 PM, pero siempre puedes dejar un mensaje y alguien responderá'
    ]
  },
  {
    category: 'community-growth',
    messages: [
      '🚀 Estamos empezando, pero creciendo rápido. ¡Únete y sé parte de una comunidad que está despegando!',
      '💜 Somos una comunidad emergente con grandes planes. ¡Sé parte del crecimiento desde el inicio!',
      '⭐ Estamos construyendo algo especial. Cada mensaje ayuda a crear una comunidad más activa'
    ]
  },
  {
    category: 'premium-benefits',
    messages: [
      '👑 Con Plan Premium puedes personalizar tu experiencia: más avatares, colores de burbujas y mucho más. ¡Explora las opciones!',
      '✨ Descubre Plan Premium: avatares exclusivos, personalización de burbujas y funciones especiales. ¡Mira qué incluye!',
      '🎨 Plan Premium te permite cambiar colores de burbujas, tener más avatares y personalizar tu experiencia. ¡Considéralo!'
    ]
  },
  {
    category: 'participation-rewards',
    messages: [
      '🏆 ¡Participa activamente! Los miembros más activos pueden ganar recompensas y beneficios especiales',
      '💎 La participación activa tiene sus recompensas. ¡Sé parte de la comunidad y disfruta de beneficios exclusivos!',
      '🎁 Los usuarios más participativos pueden obtener premios como Planes Premium. ¡Únete a la conversación!'
    ]
  },
  {
    category: 'motivation',
    messages: [
      '💪 Cada mensaje ayuda a construir una comunidad más fuerte. ¡Tu participación importa!',
      '🌟 Aunque ahora estamos pocos, cada conversación suma. ¡Déjanos saber qué piensas!',
      '🤝 La mejor forma de hacer crecer la comunidad es participando. ¡Escribe algo y anima a otros a hacerlo también!'
    ]
  }
];

// Historial de mensajes VOC enviados (para evitar repetición)
const vocHistory = new Map(); // roomId -> { lastMessageTime, lastCategory, messagesSent }

// Delay mínimo entre mensajes VOC (30 segundos)
const VOC_DELAY_MS = 30000;

// Delay mínimo entre mensajes del mismo tipo (2 minutos)
const CATEGORY_COOLDOWN_MS = 120000;

/**
 * 🎯 Envía un mensaje VOC cuando no hay actividad
 * @param {string} roomId - ID de la sala
 * @param {number} lastMessageTimestamp - Timestamp del último mensaje real
 * @returns {Promise<void>}
 */
export const sendVOCMessageIfNeeded = async (roomId, lastMessageTimestamp) => {
  try {
    const now = Date.now();
    const timeSinceLastMessage = lastMessageTimestamp ? now - lastMessageTimestamp : Infinity;

    // Solo enviar si han pasado al menos 30 segundos sin mensajes
    if (timeSinceLastMessage < VOC_DELAY_MS) {
      return;
    }

    // Verificar cooldown para evitar spam
    const roomHistory = vocHistory.get(roomId) || {
      lastMessageTime: 0,
      lastCategory: null,
      messagesSent: 0
    };

    // Si ya se envió un mensaje VOC recientemente, no enviar otro
    if (now - roomHistory.lastMessageTime < VOC_DELAY_MS) {
      return;
    }

    // Seleccionar categoría (evitar repetir la misma categoría consecutiva)
    let selectedCategory;
    let attempts = 0;
    do {
      const categoryIndex = Math.floor(Math.random() * VOC_MESSAGES.length);
      selectedCategory = VOC_MESSAGES[categoryIndex];
      attempts++;
    } while (
      selectedCategory.category === roomHistory.lastCategory &&
      attempts < 10 && // Prevenir loop infinito
      now - roomHistory.lastMessageTime < CATEGORY_COOLDOWN_MS
    );

    // Seleccionar mensaje aleatorio de la categoría
    const messageIndex = Math.floor(Math.random() * selectedCategory.messages.length);
    const messageContent = selectedCategory.messages[messageIndex];

    // Enviar mensaje como sistema (VOC)
    await sendMessage(roomId, {
      userId: 'system_voc',
      username: 'Chactivo',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chactivo',
      content: messageContent,
      type: 'system',
      isVOC: true
    });

    // Actualizar historial
    vocHistory.set(roomId, {
      lastMessageTime: now,
      lastCategory: selectedCategory.category,
      messagesSent: roomHistory.messagesSent + 1
    });

    console.log(`🎯 [VOC] Mensaje enviado a sala ${roomId}: "${messageContent}" (categoría: ${selectedCategory.category})`);

  } catch (error) {
    console.error('[VOC] Error al enviar mensaje VOC:', error);
    // No lanzar error - es un servicio no crítico
  }
};

/**
 * 🧹 Limpia el historial VOC de una sala (útil cuando la sala se activa)
 * @param {string} roomId - ID de la sala
 */
export const clearVOCHistory = (roomId) => {
  vocHistory.delete(roomId);
};

/**
 * 🔄 Resetea el cooldown de una sala (útil cuando hay nueva actividad)
 * @param {string} roomId - ID de la sala
 */
export const resetVOCCooldown = (roomId) => {
  const roomHistory = vocHistory.get(roomId);
  if (roomHistory) {
    roomHistory.lastMessageTime = 0;
    vocHistory.set(roomId, roomHistory);
  }
};

/**
 * ⏱️ Monitorea actividad y envía VOC cuando sea necesario
 * @param {string} roomId - ID de la sala
 * @param {Array} messages - Array de mensajes actuales
 * @returns {Promise<void>}
 */
export const monitorActivityAndSendVOC = async (roomId, messages) => {
  try {
    // Filtrar mensajes reales (no system, no VOC, no bots)
    const realMessages = messages.filter(msg => {
      const isSystem = msg.userId === 'system' || msg.userId === 'system_voc';
      const isBot = msg.userId?.startsWith('bot_') || msg.userId?.startsWith('ai_');
      const isVOC = msg.isVOC === true;
      return !isSystem && !isBot && !isVOC;
    });

    // Obtener timestamp del último mensaje real
    let lastMessageTimestamp = null;
    if (realMessages.length > 0) {
      const lastMessage = realMessages[realMessages.length - 1];
      if (lastMessage.timestamp) {
        lastMessageTimestamp = new Date(lastMessage.timestamp).getTime();
      }
    }

    // Si no hay mensajes reales o han pasado 30+ segundos, enviar VOC
    await sendVOCMessageIfNeeded(roomId, lastMessageTimestamp);

  } catch (error) {
    console.error('[VOC] Error en monitorActivityAndSendVOC:', error);
    // No lanzar error - es un servicio no crítico
  }
};

