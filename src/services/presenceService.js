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
    const INACTIVITY_THRESHOLD = 120 * 1000; // 120 segundos (2 minutos) - más permisivo

    const deletePromises = [];

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      
      // No eliminar al usuario actual
      if (data.userId === auth.currentUser.uid) {
        return;
      }

      const lastSeen = data.lastSeen?.toMillis() || 0;
      
      // Si no tiene lastSeen, no eliminar (puede ser un usuario que acaba de entrar)
      if (lastSeen === 0) {
        return;
      }

      const timeSinceLastSeen = now - lastSeen;

      // Solo eliminar si no ha tenido actividad en más de 2 minutos
      if (timeSinceLastSeen > INACTIVITY_THRESHOLD) {
        console.log(`🧹 Limpiando usuario inactivo: ${data.username} (inactivo ${Math.round(timeSinceLastSeen / 1000)}s)`);
        deletePromises.push(deleteDoc(docSnap.ref));
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`✅ ${deletePromises.length} usuarios inactivos eliminados de ${roomId}`);
    }
  } catch (error) {
    // Silenciar errores de permisos (puede ser que el usuario no tenga permisos para limpiar)
    if (error.code !== 'permission-denied') {
      console.error('Error cleaning inactive users:', error);
    }
  }
};

/**
 * Filtra usuarios activos (con actividad en los últimos 30 segundos)
 * ✅ CORREGIDO: No filtra usuarios que están en la lista pero no tienen lastSeen actualizado
 * @param {array} users - Array de usuarios
 * @returns {array} Array de usuarios activos
 */
export const filterActiveUsers = (users) => {
  const now = Date.now();
  const ACTIVE_THRESHOLD = 30 * 1000; // 30 segundos
  const GRACE_PERIOD = 60 * 1000; // 60 segundos de gracia para usuarios sin lastSeen

  return users.filter(user => {
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
