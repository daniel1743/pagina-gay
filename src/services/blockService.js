import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const getBlockDoc = (blockerId, blockedUserId) =>
  doc(db, 'blocks', blockerId, 'blockedUsers', blockedUserId);

/**
 * Bloquear a un usuario
 */
export const blockUser = async (blockerId, blockedUserId, metadata = {}) => {
  if (!blockerId || !blockedUserId) {
    throw new Error('Missing user ids');
  }
  if (blockerId === blockedUserId) {
    throw new Error('Cannot block self');
  }

  await setDoc(getBlockDoc(blockerId, blockedUserId), {
    blockerId,
    blockedUserId,
    createdAt: serverTimestamp(),
    ...metadata
  });

  return true;
};

/**
 * Desbloquear a un usuario (acción explícita del usuario)
 */
export const unblockUser = async (blockerId, blockedUserId) => {
  if (!blockerId || !blockedUserId) {
    throw new Error('Missing user ids');
  }
  await deleteDoc(getBlockDoc(blockerId, blockedUserId));
  return true;
};

/**
 * Verificar si blockerId bloqueó a blockedUserId
 */
export const isBlocked = async (blockerId, blockedUserId) => {
  if (!blockerId || !blockedUserId) return false;
  if (blockerId === blockedUserId) return false;
  const snap = await getDoc(getBlockDoc(blockerId, blockedUserId));
  return snap.exists();
};

/**
 * Verificar bloqueo en cualquier dirección entre dos usuarios
 */
export const isBlockedBetween = async (userAId, userBId) => {
  if (!userAId || !userBId) return false;
  if (userAId === userBId) return false;
  const [aBlocksB, bBlocksA] = await Promise.all([
    isBlocked(userAId, userBId),
    isBlocked(userBId, userAId)
  ]);
  return aBlocksB || bBlocksA;
};

/**
 * Suscribirse a la lista de bloqueados de un usuario
 */
export const subscribeToBlockedUsers = (userId, callback) => {
  if (!userId) return () => {};
  const blockedRef = collection(db, 'blocks', userId, 'blockedUsers');
  return onSnapshot(blockedRef, (snapshot) => {
    const ids = snapshot.docs.map(docSnap => docSnap.id);
    callback(ids);
  });
};
