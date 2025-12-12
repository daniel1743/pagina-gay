import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Sistema de límites diarios para usuarios FREE
 *
 * MODELO FREEMIUM:
 * - FREE: 5 invitaciones nuevas/día, 3 mensajes directos nuevos/día, responder ILIMITADO
 * - PREMIUM: TODO ILIMITADO
 */

// Límites para usuarios FREE
const LIMITS = {
  FREE_PRIVATE_CHAT_INVITES: 5,  // Invitaciones a chat privado por día
  FREE_DIRECT_MESSAGES: 3,        // Mensajes directos a nuevos usuarios por día
  FAVORITES_MAX: 15,              // Favoritos máximos (FREE y Premium)
};

// Claves de localStorage
const STORAGE_KEYS = {
  CHAT_INVITES: 'chactivo_chat_invites',
  DIRECT_MESSAGES: 'chactivo_direct_messages',
  LAST_RESET: 'chactivo_last_reset',
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (para comparar días)
 */
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // "2025-12-12"
};

/**
 * Verifica si necesitamos resetear los contadores (nuevo día)
 */
const shouldReset = () => {
  const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
  const today = getTodayDate();

  return !lastReset || lastReset !== today;
};

/**
 * Resetea los contadores locales a 0 (nuevo día)
 */
const resetLocalCounters = () => {
  const today = getTodayDate();
  localStorage.setItem(STORAGE_KEYS.CHAT_INVITES, '0');
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, '0');
  localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
  console.log('🔄 Límites reseteados para el día:', today);
};

/**
 * Obtiene los límites actuales del usuario desde localStorage
 * Si es un nuevo día, resetea automáticamente
 */
export const getCurrentLimits = (userId) => {
  // Verificar si es un nuevo día
  if (shouldReset()) {
    resetLocalCounters();
  }

  const chatInvitesSent = parseInt(localStorage.getItem(STORAGE_KEYS.CHAT_INVITES) || '0');
  const directMessagesSent = parseInt(localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES) || '0');

  return {
    chatInvites: {
      used: chatInvitesSent,
      remaining: Math.max(0, LIMITS.FREE_PRIVATE_CHAT_INVITES - chatInvitesSent),
      limit: LIMITS.FREE_PRIVATE_CHAT_INVITES,
    },
    directMessages: {
      used: directMessagesSent,
      remaining: Math.max(0, LIMITS.FREE_DIRECT_MESSAGES - directMessagesSent),
      limit: LIMITS.FREE_DIRECT_MESSAGES,
    },
  };
};

/**
 * Verifica si el usuario puede enviar una invitación a chat privado
 * ADMIN: siempre puede (ilimitado para testing)
 * PREMIUM: siempre puede
 * FREE: verifica límite de 5/día
 */
export const canSendChatInvite = (user) => {
  // Admin: ilimitado (bypass para testing)
  if (user?.role === 'admin' || user?.role === 'administrator') {
    return { allowed: true, reason: 'admin' };
  }

  // Premium: ilimitado
  if (user.isPremium) {
    return { allowed: true, reason: 'premium' };
  }

  // Guest/Anonymous: no permitido
  if (user.isGuest || user.isAnonymous) {
    return {
      allowed: false,
      reason: 'guest',
      message: 'Regístrate para enviar invitaciones a chat privado'
    };
  }

  const limits = getCurrentLimits(user.id);

  // Verificar límite
  if (limits.chatInvites.remaining > 0) {
    return {
      allowed: true,
      remaining: limits.chatInvites.remaining,
      limit: limits.chatInvites.limit
    };
  }

  return {
    allowed: false,
    reason: 'limit_reached',
    message: `Has alcanzado el límite de ${LIMITS.FREE_PRIVATE_CHAT_INVITES} invitaciones por hoy`,
    resetsAt: 'medianoche'
  };
};

/**
 * Verifica si el usuario puede enviar un mensaje directo
 * ADMIN: siempre puede (ilimitado para testing)
 * PREMIUM: siempre puede
 * FREE: verifica límite de 3/día
 */
export const canSendDirectMessage = (user) => {
  // Admin: ilimitado (bypass para testing)
  if (user?.role === 'admin' || user?.role === 'administrator') {
    return { allowed: true, reason: 'admin' };
  }

  // Premium: ilimitado
  if (user.isPremium) {
    return { allowed: true, reason: 'premium' };
  }

  // Guest/Anonymous: no permitido
  if (user.isGuest || user.isAnonymous) {
    return {
      allowed: false,
      reason: 'guest',
      message: 'Regístrate para enviar mensajes directos'
    };
  }

  const limits = getCurrentLimits(user.id);

  // Verificar límite
  if (limits.directMessages.remaining > 0) {
    return {
      allowed: true,
      remaining: limits.directMessages.remaining,
      limit: limits.directMessages.limit
    };
  }

  return {
    allowed: false,
    reason: 'limit_reached',
    message: `Has alcanzado el límite de ${LIMITS.FREE_DIRECT_MESSAGES} mensajes directos por hoy`,
    resetsAt: 'medianoche'
  };
};

/**
 * Incrementa el contador de invitaciones a chat privado
 * También sincroniza con Firestore para persistencia entre dispositivos
 */
export const incrementChatInvites = async (userId) => {
  // Verificar reset
  if (shouldReset()) {
    resetLocalCounters();
  }

  // Incrementar en localStorage (rápido)
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.CHAT_INVITES) || '0');
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.CHAT_INVITES, newCount.toString());

  // Sincronizar con Firestore (persistencia entre dispositivos)
  try {
    const userLimitsRef = doc(db, 'users', userId, 'limits', getTodayDate());
    const limitsDoc = await getDoc(userLimitsRef);

    if (limitsDoc.exists()) {
      await updateDoc(userLimitsRef, {
        chatInvites: newCount,
        lastUpdated: serverTimestamp(),
      });
    } else {
      await setDoc(userLimitsRef, {
        chatInvites: newCount,
        directMessages: 0,
        date: getTodayDate(),
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error syncing chat invites to Firestore:', error);
    // No bloqueamos la acción si falla Firestore, localStorage es suficiente
  }

  return newCount;
};

/**
 * Incrementa el contador de mensajes directos
 * También sincroniza con Firestore para persistencia entre dispositivos
 */
export const incrementDirectMessages = async (userId) => {
  // Verificar reset
  if (shouldReset()) {
    resetLocalCounters();
  }

  // Incrementar en localStorage (rápido)
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES) || '0');
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, newCount.toString());

  // Sincronizar con Firestore (persistencia entre dispositivos)
  try {
    const userLimitsRef = doc(db, 'users', userId, 'limits', getTodayDate());
    const limitsDoc = await getDoc(userLimitsRef);

    if (limitsDoc.exists()) {
      await updateDoc(userLimitsRef, {
        directMessages: newCount,
        lastUpdated: serverTimestamp(),
      });
    } else {
      await setDoc(userLimitsRef, {
        chatInvites: 0,
        directMessages: newCount,
        date: getTodayDate(),
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error syncing direct messages to Firestore:', error);
    // No bloqueamos la acción si falla Firestore, localStorage es suficiente
  }

  return newCount;
};

/**
 * Sincroniza límites desde Firestore (útil al iniciar sesión en nuevo dispositivo)
 */
export const syncLimitsFromFirestore = async (userId) => {
  try {
    const userLimitsRef = doc(db, 'users', userId, 'limits', getTodayDate());
    const limitsDoc = await getDoc(userLimitsRef);

    if (limitsDoc.exists()) {
      const data = limitsDoc.data();
      localStorage.setItem(STORAGE_KEYS.CHAT_INVITES, data.chatInvites?.toString() || '0');
      localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, data.directMessages?.toString() || '0');
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, getTodayDate());

      console.log('✅ Límites sincronizados desde Firestore:', data);
      return data;
    } else {
      console.log('ℹ️ No hay límites en Firestore para hoy, iniciando en 0');
      resetLocalCounters();
      return null;
    }
  } catch (error) {
    console.error('Error syncing limits from Firestore:', error);
    return null;
  }
};

/**
 * Obtiene el tiempo restante hasta medianoche (para mostrar "resetea en X horas")
 */
export const getTimeUntilReset = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = tomorrow - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutos`;
};

/**
 * Exportar límites para referencia
 */
export { LIMITS };
