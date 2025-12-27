import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Registra al usuario como "conectado" en una sala
 * @param {string} roomId - ID de la sala
 * @param {object} userData - Datos del usuario (username, avatar, etc.)
 */
export const joinRoom = async (roomId, userData) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  // 🔍 LOG DETALLADO: Rastrear TODA creación de presencia
  const isBot = userData.userId?.startsWith('bot_') ||
                userData.userId?.startsWith('static_bot_') ||
                userData.userId === 'system';

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           🔍 RASTREADOR DE PRESENCIA                       ║
╠════════════════════════════════════════════════════════════╣
║ 📍 FUNCIÓN: joinRoom()                                     ║
║ 🏠 Sala: ${roomId.padEnd(20)}                          ║
║ 👤 Usuario: ${userData.username.padEnd(17)} │ ID: ${auth.currentUser.uid.substring(0,8)}... ║
║ 🤖 Es Bot: ${(isBot ? 'SÍ ⚠️' : 'NO ✅').padEnd(20)}          ║
║ 👻 Anónimo: ${(auth.currentUser.isAnonymous ? 'SÍ' : 'NO').padEnd(18)}          ║
║ 📋 Stack: ${(new Error().stack?.split('\n')[2]?.trim() || 'N/A').substring(0,45)} ║
╚════════════════════════════════════════════════════════════╝
  `);

  // ⚠️ BLOQUEADOR DE BOTS: NO permitir que bots se registren en presencia
  if (isBot) {
    console.error(`
🚫 [PRESENCIA BLOQUEADA] Intento de bot registrarse como usuario real
   - Usuario: ${userData.username}
   - ID: ${userData.userId}
   - Sala: ${roomId}
   ⚠️ Los bots NO deben crear presencia en Firestore
    `);
    return; // NO crear presencia para bots
  }

  try {
    // ✅ Actualizar lastSeen inmediatamente al entrar
    await setDoc(presenceRef, {
      userId: auth.currentUser.uid,
      username: userData.username,
      avatar: userData.avatar,
      isPremium: userData.isPremium || false,
      isAnonymous: auth.currentUser.isAnonymous || false,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    console.log(`✅ [PRESENCIA CREADA] ${userData.username} registrado en sala ${roomId}`);

    // ✅ Asegurar que la actividad se actualice inmediatamente
    // Esto ayuda a que el usuario sea detectado como activo de inmediato
    await updateUserActivity(roomId);

    // ✅ Registrar actividad global para el contador de "Última Actividad"
    await recordGlobalActivity(userData.username, 'joined');
  } catch (error) {
    console.error('Error joining room:', error);
  }
};

/**
 * Remueve al usuario de la sala cuando sale
 * @param {string} roomId - ID de la sala
 */
export const leaveRoom = async (roomId) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  try {
    await deleteDoc(presenceRef);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
};

/**
 * Escucha cambios en el número de usuarios de una sala en tiempo real
 * @param {string} roomId - ID de la sala
 * @param {function} callback - Función que recibe el número de usuarios
 * @returns {function} Función para desuscribirse
 */
export const subscribeToRoomUserCount = (roomId, callback) => {
  const usersRef = collection(db, 'roomPresence', roomId, 'users');

  return onSnapshot(usersRef, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    // ✅ Ignorar AbortError (normal cuando se cancela una suscripción)
    if (error.name === 'AbortError' || error.code === 'cancelled') {
      // No hacer nada, la suscripción fue cancelada intencionalmente
      return;
    }
    console.error('Error subscribing to room users:', error);
    callback(0);
  });
};

/**
 * Escucha cambios en los usuarios conectados de una sala
 * @param {string} roomId - ID de la sala
 * @param {function} callback - Función que recibe el array de usuarios
 * @returns {function} Función para desuscribirse
 */
export const subscribeToRoomUsers = (roomId, callback) => {
  const usersRef = collection(db, 'roomPresence', roomId, 'users');

  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(users);
  }, (error) => {
    // ✅ Ignorar AbortError (normal cuando se cancela una suscripción)
    if (error.name === 'AbortError' || error.code === 'cancelled') {
      // No hacer nada, la suscripción fue cancelada intencionalmente
      return;
    }
    console.error('Error subscribing to room users:', error);
    callback([]);
  });
};

/**
 * Obtiene el conteo de usuarios para múltiples salas
 * @param {array} roomIds - Array de IDs de salas
 * @param {function} callback - Función que recibe un objeto { roomId: count }
 * @returns {function} Función para desuscribirse de todos los listeners
 */
export const subscribeToMultipleRoomCounts = (roomIds, callback) => {
  const counts = {};
  const unsubscribers = [];

  roomIds.forEach(roomId => {
    const usersRef = collection(db, 'roomPresence', roomId, 'users');

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      counts[roomId] = snapshot.size;
      callback({ ...counts });
    }, (error) => {
      // ✅ Ignorar AbortError (normal cuando se cancela una suscripción)
      if (error.name === 'AbortError' || error.code === 'cancelled') {
        // No hacer nada, la suscripción fue cancelada intencionalmente
        return;
      }
      console.error(`Error subscribing to room ${roomId}:`, error);
      counts[roomId] = 0;
      callback({ ...counts });
    });

    unsubscribers.push(unsubscribe);
  });

  // Retornar función para desuscribirse de todos
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};

/**
 * Actualiza el timestamp de "última actividad" del usuario en la sala
 * Útil para detectar usuarios inactivos
 */
export const updateUserActivity = async (roomId) => {
  if (!auth.currentUser) return;

  const presenceRef = doc(db, 'roomPresence', roomId, 'users', auth.currentUser.uid);

  try {
    await setDoc(presenceRef, {
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
};

/**
 * Limpia usuarios inactivos de la sala (sin actividad en más de 120 segundos)
 * ✅ CORREGIDO: Aumentado el threshold y mejor manejo de errores
 * @param {string} roomId - ID de la sala
 */
export const cleanInactiveUsers = async (roomId) => {
  if (!auth.currentUser) return; // Solo usuarios autenticados pueden limpiar

  const usersRef = collection(db, 'roomPresence', roomId, 'users');

  try {
    const snapshot = await getDocs(usersRef);
    const now = Date.now();
    const INACTIVITY_THRESHOLD = 120 * 1000; // 120 segundos (2 minutos)

    const deletePromises = [];
    const currentUserId = auth.currentUser.uid;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const userId = data.userId || docSnap.id;
      
      // ✅ CRÍTICO: Excluir bots del sistema de limpieza
      const isBot = userId === 'system' ||
                    userId.startsWith('bot_') ||
                    userId.startsWith('bot-') ||
                    userId.startsWith('static_bot_') ||
                    userId.includes('bot_join');
      
      if (isBot) {
        // Eliminar bots inmediatamente si existen en la DB
        console.log(`🤖 Eliminando bot de presencia: ${data.username || userId}`);
        deletePromises.push(deleteDoc(docSnap.ref));
        return;
      }
      
      // No eliminar al usuario actual
      if (userId === currentUserId) {
        return;
      }

      const lastSeen = data.lastSeen?.toMillis() || 0;
      
      // Si no tiene lastSeen y tiene más de 5 minutos de joinedAt, eliminar
      if (lastSeen === 0) {
        const joinedAt = data.joinedAt?.toMillis() || 0;
        if (joinedAt > 0 && (now - joinedAt) > 5 * 60 * 1000) {
          console.log(`🧹 Eliminando usuario sin lastSeen antiguo: ${data.username || userId}`);
          deletePromises.push(deleteDoc(docSnap.ref));
        }
        return;
      }

      const timeSinceLastSeen = now - lastSeen;

      // Eliminar si no ha tenido actividad en más de 2 minutos
      if (timeSinceLastSeen > INACTIVITY_THRESHOLD) {
        console.log(`🧹 Limpiando usuario inactivo: ${data.username || userId} (inactivo ${Math.round(timeSinceLastSeen / 1000)}s)`);
        deletePromises.push(deleteDoc(docSnap.ref));
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ ${deletePromises.length} usuarios inactivos/bots eliminados de ${roomId}`);
    }
  } catch (error) {
    // Silenciar errores de permisos (puede ser que el usuario no tenga permisos para limpiar)
    if (error.code !== 'permission-denied') {
      console.error('Error cleaning inactive users:', error);
    }
  }
};

/**
 * Filtra usuarios activos (con actividad en los últimos 5 minutos)
 * ✅ MEJORADO: Extendido a 5 minutos para hacer que las salas parezcan más activas
 * @param {array} users - Array de usuarios
 * @returns {array} Array de usuarios activos
 */
export const filterActiveUsers = (users) => {
  const now = Date.now();
  const ACTIVE_THRESHOLD = 5 * 60 * 1000; // ✅ 5 minutos (antes: 30 segundos)
  const GRACE_PERIOD = 10 * 60 * 1000; // ✅ 10 minutos de gracia para usuarios sin lastSeen (antes: 60 segundos)

  return users.filter(user => {
    // ✅ CRÍTICO: EXCLUIR BOTS/IAs DEL CONTEO DE USUARIOS REALES
    const userId = user.userId || user.id || '';
    const isBot = userId === 'system' ||
                  userId.startsWith('bot_') ||
                  userId.startsWith('bot-') ||
                  userId.startsWith('static_bot_') || // ✅ Excluir bots estáticos
                  userId.includes('bot_join');

    if (isBot) {
      console.log(`🤖 [FILTRO PRESENCIA] Excluyendo bot del conteo: ${user.username || userId}`);
      return false; // NO contar bots como usuarios activos
    }

    // Si el usuario no tiene lastSeen, asumir que está activo (acaba de entrar)
    if (!user.lastSeen) {
      return true;
    }

    const lastSeen = user.lastSeen?.toMillis() || 0;

    // Si lastSeen es 0 o muy antiguo pero el usuario está en la lista, darle gracia
    if (lastSeen === 0) {
      return true;
    }

    const timeSinceLastSeen = now - lastSeen;

    // Si el tiempo desde lastSeen es menor al threshold, está activo
    if (timeSinceLastSeen <= ACTIVE_THRESHOLD) {
      return true;
    }

    // Si el tiempo es mayor pero menor al grace period, también está activo
    // (puede ser un delay en la actualización de Firestore)
    if (timeSinceLastSeen <= GRACE_PERIOD) {
      return true;
    }

    // Usuario inactivo
    return false;
  });
};

/**
 * Registra actividad global del usuario (para mostrar "Última Actividad" en lobby)
 * @param {string} username - Nombre del usuario
 * @param {string} action - Acción realizada ('joined', 'message', 'connected')
 */
export const recordGlobalActivity = async (username, action = 'connected') => {
  if (!auth.currentUser) return;

  const activityRef = doc(db, 'globalActivity', auth.currentUser.uid);

  try {
    await setDoc(activityRef, {
      userId: auth.currentUser.uid,
      username: username,
      action: action,
      timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error recording global activity:', error);
  }
};

/**
 * Escucha la última actividad global de usuarios
 * @param {function} callback - Función que recibe { username, action, timestamp }
 * @returns {function} Función para desuscribirse
 */
export const subscribeToLastActivity = (callback) => {
  const activityRef = collection(db, 'globalActivity');

  return onSnapshot(activityRef, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }

    // Obtener la actividad más reciente
    const activities = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(activity => activity.timestamp) // Filtrar actividades sin timestamp
      .sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });

    if (activities.length > 0) {
      callback(activities[0]);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to last activity:', error);
    callback(null);
  });
};
