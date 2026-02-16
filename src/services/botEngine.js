/**
 * Motor de ejecución de bots con conversaciones pregrabadas
 *
 * Reproduce conversaciones de botConversations.js con delays naturales.
 * Soporta múltiples conversaciones simultáneas, pausa/reanudar, y
 * auto-desactivación cuando hay suficientes usuarios reales.
 */

import { BOT_CONVERSATIONS } from '@/data/botConversations';
import { getBotProfileByUsername } from '@/config/botProfiles';
import { sendBotMessageFromEngine } from '@/services/chatService';
import {
  registerBotPresenceForTesting,
  removeBotPresenceForTesting,
} from '@/services/presenceService';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Estado global del motor por sala
const engineState = {};

const DEFAULT_STATE = {
  status: 'stopped', // 'running' | 'paused' | 'stopped'
  activeBots: new Set(),
  conversationsPlayed: 0,
  activeConversations: [], // { conversationId, timeouts[], currentIndex }
  recentConversationIds: [],
  realUserCount: 0,
  autoDeactivate: true,
  autoDeactivateThreshold: 10,
  unsubscribePresence: null,
  gapTimeout: null,
};

function getState(roomId) {
  if (!engineState[roomId]) {
    engineState[roomId] = { ...DEFAULT_STATE, activeBots: new Set(), activeConversations: [], recentConversationIds: [] };
  }
  return engineState[roomId];
}

/**
 * Registra un bot en la presencia de la sala (simula que está online)
 */
async function registerBotPresence(roomId, username) {
  const profile = getBotProfileByUsername(username);
  if (!profile) return;
  await registerBotPresenceForTesting(roomId, {
    userId: profile.id,
    username: profile.username,
    avatar: profile.avatar,
  });
}

/**
 * Remueve un bot de la presencia de la sala
 */
async function removeBotPresence(roomId, username) {
  const profile = getBotProfileByUsername(username);
  if (!profile) return;
  await removeBotPresenceForTesting(roomId, profile.id);
}

/**
 * Envía un mensaje de bot a la sala
 */
async function sendBotMessage(roomId, username, text) {
  const profile = getBotProfileByUsername(username);
  if (!profile) return;

  try {
    await sendBotMessageFromEngine(roomId, {
      userId: profile.id,
      username: profile.username,
      avatar: profile.avatar,
      content: text,
      type: 'text',
    });
  } catch (error) {
    console.error(`[BotEngine] Error sending message from ${username}:`, error);
  }
}

/**
 * Selecciona una conversación aleatoria que no se haya jugado recientemente
 */
function pickConversation(roomId) {
  const state = getState(roomId);
  const maxRecent = Math.min(20, Math.floor(BOT_CONVERSATIONS.length * 0.3));

  const available = BOT_CONVERSATIONS.filter(
    c => !state.recentConversationIds.includes(c.id)
  );

  const pool = available.length > 0 ? available : BOT_CONVERSATIONS;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  state.recentConversationIds.push(picked.id);
  if (state.recentConversationIds.length > maxRecent) {
    state.recentConversationIds.shift();
  }

  return picked;
}

/**
 * Reproduce una conversación completa con delays
 */
function playConversation(roomId, conversation) {
  const state = getState(roomId);

  const convState = {
    conversationId: conversation.id,
    timeouts: [],
    currentIndex: 0,
    paused: false,
    pausedAtIndex: 0,
  };

  state.activeConversations.push(convState);

  // Registrar todos los participantes en presencia
  conversation.participants.forEach(username => {
    state.activeBots.add(username);
    registerBotPresence(roomId, username);
  });

  function scheduleMessage(index) {
    if (index >= conversation.messages.length) {
      // Conversación terminada
      finishConversation(roomId, conversation, convState);
      return;
    }

    if (state.status === 'stopped') return;
    if (state.status === 'paused') {
      convState.paused = true;
      convState.pausedAtIndex = index;
      return;
    }

    const msg = conversation.messages[index];
    const delay = index === 0 ? 0 : msg.delayMs;

    const timeout = setTimeout(() => {
      if (state.status === 'stopped') return;
      if (state.status === 'paused') {
        convState.paused = true;
        convState.pausedAtIndex = index;
        return;
      }

      sendBotMessage(roomId, msg.from, msg.text);
      convState.currentIndex = index + 1;
      scheduleMessage(index + 1);
    }, delay);

    convState.timeouts.push(timeout);
  }

  scheduleMessage(0);
}

/**
 * Finaliza una conversación y programa la siguiente
 */
function finishConversation(roomId, conversation, convState) {
  const state = getState(roomId);

  // Remover esta conversación del estado activo
  state.activeConversations = state.activeConversations.filter(
    c => c.conversationId !== convState.conversationId
  );

  state.conversationsPlayed++;

  // Remover bots de presencia si no están en otra conversación activa
  const activeBotUsernames = new Set();
  state.activeConversations.forEach(c => {
    const conv = BOT_CONVERSATIONS.find(bc => bc.id === c.conversationId);
    if (conv) conv.participants.forEach(p => activeBotUsernames.add(p));
  });

  conversation.participants.forEach(username => {
    if (!activeBotUsernames.has(username)) {
      state.activeBots.delete(username);
      removeBotPresence(roomId, username);
    }
  });

  // Si el motor sigue corriendo, programa otra conversación después de un gap
  if (state.status === 'running') {
    const gapMs = 30000 + Math.random() * 60000; // 30-90 segundos
    const timeout = setTimeout(() => {
      if (state.status === 'running') {
        launchNewConversation(roomId);
      }
    }, gapMs);
    state.gapTimeout = timeout;
  }
}

/**
 * Lanza una nueva conversación
 */
function launchNewConversation(roomId) {
  const state = getState(roomId);
  if (state.status !== 'running') return;

  // Auto-desactivación
  if (state.autoDeactivate && state.realUserCount >= state.autoDeactivateThreshold) {
    console.log(`[BotEngine] Auto-deactivating: ${state.realUserCount} real users in room ${roomId}`);
    stopBots(roomId);
    return;
  }

  // Máximo 4 conversaciones simultáneas
  if (state.activeConversations.length >= 4) return;

  const conversation = pickConversation(roomId);
  playConversation(roomId, conversation);
}

/**
 * Monitorea usuarios reales en la sala
 */
function monitorRealUsers(roomId) {
  const state = getState(roomId);
  const usersRef = collection(db, 'roomPresence', roomId, 'users');

  state.unsubscribePresence = onSnapshot(usersRef, (snapshot) => {
    let realCount = 0;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.isBot && !doc.id.startsWith('bot_')) {
        realCount++;
      }
    });
    state.realUserCount = realCount;

    // Auto-desactivación
    if (state.autoDeactivate && state.status === 'running' && realCount >= state.autoDeactivateThreshold) {
      console.log(`[BotEngine] Auto-deactivating: ${realCount} real users detected`);
      stopBots(roomId);
    }
  });
}

// ==================== API PÚBLICA ====================

/**
 * Inicia el sistema de bots en una sala
 */
export function startBots(roomId) {
  const state = getState(roomId);

  if (state.status === 'running') {
    console.log(`[BotEngine] Already running in room ${roomId}`);
    return;
  }

  console.log(`[BotEngine] Starting bots in room ${roomId}`);
  state.status = 'running';
  state.conversationsPlayed = 0;
  state.recentConversationIds = [];

  // Monitorear usuarios reales
  monitorRealUsers(roomId);

  // Lanzar 2-3 conversaciones iniciales con gaps escalonados
  const initialCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < initialCount; i++) {
    const delay = i * (5000 + Math.random() * 10000); // Escalonar inicio
    setTimeout(() => {
      if (state.status === 'running') {
        launchNewConversation(roomId);
      }
    }, delay);
  }
}

/**
 * Detiene todos los bots inmediatamente y limpia presencia
 */
export function stopBots(roomId) {
  const state = getState(roomId);

  console.log(`[BotEngine] Stopping bots in room ${roomId}`);
  state.status = 'stopped';

  // Limpiar todos los timeouts
  state.activeConversations.forEach(conv => {
    conv.timeouts.forEach(t => clearTimeout(t));
  });
  if (state.gapTimeout) clearTimeout(state.gapTimeout);

  // Remover todos los bots de presencia
  state.activeBots.forEach(username => {
    removeBotPresence(roomId, username);
  });

  // Desuscribirse de presencia
  if (state.unsubscribePresence) {
    state.unsubscribePresence();
  }

  // Limpiar estado
  state.activeBots = new Set();
  state.activeConversations = [];
  state.gapTimeout = null;
  state.unsubscribePresence = null;
}

/**
 * Pausa la ejecución (se puede reanudar)
 */
export function pauseBots(roomId) {
  const state = getState(roomId);
  if (state.status !== 'running') return;

  console.log(`[BotEngine] Pausing bots in room ${roomId}`);
  state.status = 'paused';

  // Los timeouts que aún no se ejecutaron continuarán pero
  // las funciones internas verificarán el estado y se pausarán
  if (state.gapTimeout) {
    clearTimeout(state.gapTimeout);
    state.gapTimeout = null;
  }
}

/**
 * Reanuda desde donde se pausó
 */
export function resumeBots(roomId) {
  const state = getState(roomId);
  if (state.status !== 'paused') return;

  console.log(`[BotEngine] Resuming bots in room ${roomId}`);
  state.status = 'running';

  // Reanudar conversaciones pausadas
  state.activeConversations.forEach(convState => {
    if (convState.paused) {
      convState.paused = false;
      const conversation = BOT_CONVERSATIONS.find(c => c.id === convState.conversationId);
      if (conversation) {
        // Continuar desde donde se pausó
        let index = convState.pausedAtIndex;

        function scheduleResumed(idx) {
          if (idx >= conversation.messages.length) {
            finishConversation(roomId, conversation, convState);
            return;
          }
          if (state.status !== 'running') {
            convState.paused = true;
            convState.pausedAtIndex = idx;
            return;
          }

          const msg = conversation.messages[idx];
          const delay = msg.delayMs;

          const timeout = setTimeout(() => {
            if (state.status !== 'running') {
              convState.paused = true;
              convState.pausedAtIndex = idx;
              return;
            }
            sendBotMessage(roomId, msg.from, msg.text);
            convState.currentIndex = idx + 1;
            scheduleResumed(idx + 1);
          }, delay);

          convState.timeouts.push(timeout);
        }

        scheduleResumed(index);
      }
    }
  });

  // Si hay pocas conversaciones activas, lanzar nuevas
  if (state.activeConversations.length < 2) {
    launchNewConversation(roomId);
  }
}

/**
 * Retorna estado actual del motor
 */
export function getBotStatus(roomId) {
  const state = getState(roomId);
  return {
    status: state.status,
    activeBots: state.activeBots.size,
    activeBotNames: [...state.activeBots],
    conversationsPlayed: state.conversationsPlayed,
    activeConversations: state.activeConversations.length,
    realUserCount: state.realUserCount,
    autoDeactivate: state.autoDeactivate,
    autoDeactivateThreshold: state.autoDeactivateThreshold,
    totalConversationsAvailable: BOT_CONVERSATIONS?.length || 0,
  };
}

/**
 * Configura auto-desactivación
 */
export function setAutoDeactivate(roomId, enabled, threshold = 10) {
  const state = getState(roomId);
  state.autoDeactivate = enabled;
  state.autoDeactivateThreshold = threshold;
}
