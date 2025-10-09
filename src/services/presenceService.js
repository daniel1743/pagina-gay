import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
  query,
  where,
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
    await setDoc(presenceRef, {
      userId: auth.currentUser.uid,
      username: userData.username,
      avatar: userData.avatar,
      isPremium: userData.isPremium || false,
      isAnonymous: auth.currentUser.isAnonymous || false,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
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
