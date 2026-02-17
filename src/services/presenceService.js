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
import { actualizarEstadoOnline } from '@/services/tarjetaService';

const isBotUserId = (userId = '') =>
  userId === 'system' ||
  userId?.startsWith('bot_') ||
  userId?.startsWith('static_bot_');

/**
 * ✅ HABILITADO: Registrar usuario en sala (presencia básica)
 * ✅ Sincroniza tarjeta Baúl: usuarios registrados actualizan ultimaConexion/estaOnline
 */
export const joinRoom = async (roomId, userData) => {
  if (!auth.currentUser) return;

  // ⚠️ BLOQUEADOR DE BOTS: NO permitir que bots se registren en presencia
  const isBot = isBotUserId(userData.userId) || userData.userId === 'system_moderator';
  const canJoinAsBotInTesting = isBot && roomId === 'admin-testing' && userData.allowBotPresence === true;
  const presenceDocId = canJoinAsBotInTesting ? userData.userId : auth.currentUser.uid;
  const presenceRef = doc(db, 'roomPresence', roomId, 'users', presenceDocId);

  if (isBot && !canJoinAsBotInTesting) {
    console.warn(`🚫 [PRESENCE] Bot bloqueado: ${userData.username}`);
    return;
  }

  try {
    await setDoc(presenceRef, {
      userId: canJoinAsBotInTesting ? userData.userId : auth.currentUser.uid,
      username: userData.username,
      avatar: userData.avatar,
      isPremium: userData.isPremium || false,
      isProUser: userData.isProUser || false,
      hasRainbowBorder: userData.hasRainbowBorder || false,
      hasProBadge: userData.hasProBadge || false,
      hasFeaturedCard: userData.hasFeaturedCard || false,
      canUploadSecondPhoto: userData.canUploadSecondPhoto || false,
      isAnonymous: auth.currentUser.isAnonymous || userData.isAnonymous || false,
      isGuest: userData.isGuest || false,
      isBot: canJoinAsBotInTesting,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    // ✅ Sincronizar Baúl: usuarios registrados (no guest) actualizan su tarjeta al conectar
    const esRegistrado = !userData.isGuest && !userData.isAnonymous;
    if (esRegistrado && auth.currentUser.uid) {
      actualizarEstadoOnline(auth.currentUser.uid, true).catch(() => {});
    }

    console.log(`✅ [PRESENCE] Usuario ${userData.username} registrado en ${roomId}`);
  } catch (error) {
    console.error('Error joining room:', error);
  }
};

/**
 * ✅ HABILITADO: Remover usuario de la sala
 * ✅ Sincroniza tarjeta Baúl: marca estaOnline=false al desconectar
 */
export const leaveRoom = async (roomId) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  try {
    await deleteDoc(presenceRef);
    // ✅ Sincronizar Baúl: actualizar estado offline en tarjeta
    actualizarEstadoOnline(auth.currentUser.uid, false).catch(() => {});
    console.log(`✅ [PRESENCE] Usuario removido de ${roomId}`);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
};

/**
 * Marcar usuario como "en chat privado" (visible para otros en la sala)
 */
export const setInPrivateChat = async (roomId, partnerId, partnerUsername) => {
  if (!auth.currentUser || !roomId) return;
  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);
  try {
    await setDoc(presenceRef, {
      inPrivateWith: partnerId,
      inPrivateWithUsername: partnerUsername || 'Usuario',
      inPrivateSince: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('[PRESENCE] Error marcando en privado:', error?.message);
  }
};

/**
 * Quitar marca de "en chat privado"
 */
export const clearInPrivateChat = async (roomId) => {
  if (!auth.currentUser || !roomId) return;
  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);
  try {
    await setDoc(presenceRef, {
      inPrivateWith: null,
      inPrivateWithUsername: null,
      inPrivateSince: null,
    }, { merge: true });
  } catch (error) {
    console.warn('[PRESENCE] Error limpiando estado privado:', error?.message);
  }
};

/**
 * Actualizar campos en la presencia de sala (ej: isProUser cuando cambia en tiempo real)
 */
export const updatePresenceFields = async (roomId, fields) => {
  if (!auth.currentUser || !roomId) return;
  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);
  try {
    await setDoc(presenceRef, fields, { merge: true });
  } catch (error) {
    console.warn('[PRESENCE] Error actualizando campos:', error?.message);
  }
};

/**
 * ✅ HABILITADO: Escuchar usuarios conectados (SIN verificación de roles)
 * ⚠️ NO hace queries de getDoc - solo retorna lo que está en roomPresence
 */
export const subscribeToRoomUsers = (roomId, callback) => {
  const usersRef = collection(db, 'roomPresence', roomId, 'users');
  const includeBots = roomId === 'admin-testing';

  if (import.meta.env.DEV) {
    console.log(`📊 [PRESENCE] Listener para usuarios de ${roomId} CREADO`);
  }

  const unsubscribe = onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(user => {
        // ✅ Filtrar bots/sistema
        const userId = user.userId || user.id;
        if (includeBots) return userId !== 'system';
        return !isBotUserId(userId);
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
    if (import.meta.env.DEV) {
      console.log(`📊 [PRESENCE] Listener para usuarios de ${roomId} DESTRUIDO`);
    }
    unsubscribe();
  };
};

/**
 * ✅ MODO SEGURO: subscribeToMultipleRoomCounts
 * Implementación liviana sin getDoc masivo ni loops.
 * Cuenta usuarios reales por sala escuchando roomPresence/{roomId}/users.
 */
export const subscribeToMultipleRoomCounts = (roomIds, callback) => {
  if (!Array.isArray(roomIds) || roomIds.length === 0) {
    callback({});
    return () => {};
  }

  const counts = roomIds.reduce((acc, roomId) => {
    acc[roomId] = 0;
    return acc;
  }, {});

  callback({ ...counts });

  const unsubscribers = roomIds.map((roomId) => {
    const usersRef = collection(db, 'roomPresence', roomId, 'users');

    return onSnapshot(usersRef, (snapshot) => {
      const realUsersCount = snapshot.docs.reduce((count, docSnap) => {
        const data = docSnap.data() || {};
        const userId = data.userId || docSnap.id || '';
        const isBot = isBotUserId(userId);

        return isBot ? count : count + 1;
      }, 0);

      counts[roomId] = realUsersCount;
      callback({ ...counts });
    }, (error) => {
      const isTransientError =
        error.name === 'AbortError' ||
        error.code === 'cancelled' ||
        error.code === 'unavailable';

      if (!isTransientError) {
        console.error(`[PRESENCE] Error en contador de sala ${roomId}:`, error);
      }
    });
  });

  return () => {
    unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        // noop
      }
    });
  };
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
    const isBot = isBotUserId(userId);

    if (isBot) return false;

    if (!user.lastSeen) return true;

    const lastSeen = user.lastSeen?.toMillis() || 0;
    const timeSinceLastSeen = now - lastSeen;

    return timeSinceLastSeen <= ACTIVE_THRESHOLD;
  });
};

/**
 * Registro explícito de presencia para bots en sala de pruebas admin-testing.
 * Se usa desde botEngine para no mezclar lógica de usuarios reales.
 */
export const registerBotPresenceForTesting = async (roomId, botData) => {
  if (roomId !== 'admin-testing') return false;
  if (!botData?.userId || !botData?.username) return false;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', botData.userId);
  try {
    await setDoc(presenceRef, {
      userId: botData.userId,
      username: botData.username,
      avatar: botData.avatar || '',
      isPremium: false,
      isAnonymous: false,
      isGuest: false,
      isBot: true,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('[PRESENCE] No se pudo registrar bot en presencia:', error?.message || error);
    return false;
  }
};

/**
 * Limpia presencia de bots en sala de pruebas.
 */
export const removeBotPresenceForTesting = async (roomId, botUserId) => {
  if (roomId !== 'admin-testing') return false;
  if (!botUserId) return false;

  try {
    await deleteDoc(doc(db, 'roomPresence', roomId, 'users', botUserId));
    return true;
  } catch (error) {
    console.warn('[PRESENCE] No se pudo eliminar bot de presencia:', error?.message || error);
    return false;
  }
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
