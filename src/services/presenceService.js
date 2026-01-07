/**
 * 🔧 VERSIÓN MINIMAL - Solo funciones ESENCIALES para comunicación bidireccional
 * Fecha: 07/01/2026
 * Objetivo: Restaurar chat básico sin loops infinitos
 *
 * HABILITADO:
 * - joinRoom (registro básico de presencia)
 * - leaveRoom (limpieza al salir)
 * - subscribeToRoomUsers (ver usuarios - SIN getDoc queries)
 *
 * DESHABILITADO:
 * - subscribeToMultipleRoomCounts (el loop que causó el problema)
 * - role checking (evitar getDoc masivo)
 * - typing status
 * - global activity
 */

import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * ✅ HABILITADO: Registrar usuario en sala (presencia básica)
 */
export const joinRoom = async (roomId, userData) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  // ⚠️ BLOQUEADOR DE BOTS: NO permitir que bots se registren en presencia
  const isBot = userData.userId?.startsWith('bot_') ||
                userData.userId?.startsWith('static_bot_') ||
                userData.userId === 'system' ||
                userData.userId === 'system_moderator';

  if (isBot) {
    console.warn(`🚫 [PRESENCE] Bot bloqueado: ${userData.username}`);
    return;
  }

  try {
    await setDoc(presenceRef, {
      userId: auth.currentUser.uid,
      username: userData.username,
      avatar: userData.avatar,
      isPremium: userData.isPremium || false,
      isAnonymous: auth.currentUser.isAnonymous || userData.isAnonymous || false,
      isGuest: userData.isGuest || false,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    console.log(`✅ [PRESENCE] Usuario ${userData.username} registrado en ${roomId}`);
  } catch (error) {
    console.error('Error joining room:', error);
  }
};

/**
 * ✅ HABILITADO: Remover usuario de la sala
 */
export const leaveRoom = async (roomId) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  try {
    await deleteDoc(presenceRef);
    console.log(`✅ [PRESENCE] Usuario removido de ${roomId}`);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
};

/**
 * ✅ HABILITADO: Escuchar usuarios conectados (SIN verificación de roles)
 * ⚠️ NO hace queries de getDoc - solo retorna lo que está en roomPresence
 */
export const subscribeToRoomUsers = (roomId, callback) => {
  const usersRef = collection(db, 'roomPresence', roomId, 'users');

  console.log(`📊 [PRESENCE] Listener para usuarios de ${roomId} CREADO`);

  const unsubscribe = onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(user => {
        // ✅ Filtrar bots/sistema
        const userId = user.userId || user.id;
        return userId !== 'system' &&
               !userId?.startsWith('bot_') &&
               !userId?.startsWith('static_bot_');
      });

    callback(users);
  }, (error) => {
    const isTransientError =
      error.name === 'AbortError' ||
      error.code === 'cancelled' ||
      error.code === 'unavailable';

    if (!isTransientError) {
      console.error('Error subscribing to room users:', error);
      callback([]);
    }
  });

  return () => {
    console.log(`📊 [PRESENCE] Listener para usuarios de ${roomId} DESTRUIDO`);
    unsubscribe();
  };
};

/**
 * ❌ DESHABILITADO: subscribeToMultipleRoomCounts
 * Este es el loop que causó el problema - NO re-habilitar
 */
export const subscribeToMultipleRoomCounts = (roomIds, callback) => {
  console.warn('🚫 [PRESENCE] subscribeToMultipleRoomCounts DESHABILITADO permanentemente');
  const counts = roomIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
  callback(counts);
  return () => {};
};

/**
 * ❌ DESHABILITADO: subscribeToRoomUserCount
 */
export const subscribeToRoomUserCount = (roomId, callback) => {
  console.warn('🚫 [PRESENCE] subscribeToRoomUserCount DESHABILITADO');
  callback(0);
  return () => {};
};

/**
 * ✅ HABILITADO: Actualizar actividad del usuario (sin queries)
 */
export const updateUserActivity = async (roomId) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  try {
    await setDoc(presenceRef, {
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    // Silenciar errores
  }
};

/**
 * ❌ DESHABILITADO: cleanInactiveUsers (puede causar escrituras masivas)
 */
export const cleanInactiveUsers = async () => {
  // No hacer nada - dejar que Firestore TTL lo maneje
  return Promise.resolve();
};

/**
 * ✅ HABILITADO: Filtrar usuarios activos (local, sin queries)
 */
export const filterActiveUsers = (users) => {
  const now = Date.now();
  const ACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutos

  return users.filter(user => {
    const userId = user.userId || user.id || '';
    const isBot = userId === 'system' ||
                  userId?.startsWith('bot_') ||
                  userId?.startsWith('static_bot_');

    if (isBot) return false;

    if (!user.lastSeen) return true;

    const lastSeen = user.lastSeen?.toMillis() || 0;
    const timeSinceLastSeen = now - lastSeen;

    return timeSinceLastSeen <= ACTIVE_THRESHOLD;
  });
};

/**
 * ❌ DESHABILITADO: Typing status
 */
export const subscribeToTypingUsers = (roomId, currentUserId, callback) => {
  callback([]);
  return () => {};
};

export const updateTypingStatus = async () => {
  return Promise.resolve();
};

/**
 * ❌ DESHABILITADO: Global activity
 */
export const recordGlobalActivity = async () => {
  return Promise.resolve();
};

export const subscribeToLastActivity = (callback) => {
  callback(null);
  return () => {};
};
