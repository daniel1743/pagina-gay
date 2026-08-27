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
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';

const getBlockDoc = (blockerId, blockedUserId) =>
  doc(db, 'blocks', blockerId, 'blockedUsers', blockedUserId);

/**
 * Bloquear a un usuario
 */
export const blockUser = async (blockerId, blockedUserId, metadata = {}) => {
  if (isSupabaseAuthEnabled()) {
    if (!blockerId || !blockedUserId || blockerId === blockedUserId || !supabase) throw new Error('INVALID_BLOCK');
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id !== blockerId) throw new Error('AUTH_USER_MISMATCH');
    const { error } = await supabase.from('blocks').upsert({ blocker_id: blockerId, blocked_id: blockedUserId, reason: metadata?.reason || null }, { onConflict: 'blocker_id,blocked_id' });
    if (error) throw error;
    return true;
  }
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
  if (isSupabaseAuthEnabled()) {
    if (!blockerId || !blockedUserId || !supabase) throw new Error('INVALID_BLOCK');
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id !== blockerId) throw new Error('AUTH_USER_MISMATCH');
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedUserId);
    if (error) throw error;
    return true;
  }
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
  if (isSupabaseAuthEnabled()) {
    if (!blockerId || !blockedUserId || blockerId === blockedUserId || !supabase) return false;
    const { data: authData } = await supabase.auth.getUser();
    if (![blockerId, blockedUserId].includes(authData?.user?.id)) return false;
    const { data, error } = await supabase.from('blocks').select('blocker_id, blocked_id').eq('blocker_id', blockerId).eq('blocked_id', blockedUserId).maybeSingle();
    if (error) return false;
    return Boolean(data);
  }
  if (!blockerId || !blockedUserId) return false;
  if (blockerId === blockedUserId) return false;
  try {
    const snap = await getDoc(getBlockDoc(blockerId, blockedUserId));
    return snap.exists();
  } catch (error) {
    // Si las reglas no permiten leer bloques ajenos, se asume no bloqueado para no romper UX.
    if (error?.code === 'permission-denied') {
      return false;
    }
    throw error;
  }
};

/**
 * Verificar bloqueo en cualquier dirección entre dos usuarios
 */
export const isBlockedBetween = async (userAId, userBId) => {
  if (isSupabaseAuthEnabled()) {
    if (!userAId || !userBId || userAId === userBId || !supabase) return false;
    const { data: authData } = await supabase.auth.getUser();
    if (![userAId, userBId].includes(authData?.user?.id)) return false;
    const { data, error } = await supabase.from('blocks').select('blocker_id, blocked_id').in('blocker_id', [userAId, userBId]).in('blocked_id', [userAId, userBId]);
    if (error) return false;
    return (data || []).some((row) => (row.blocker_id === userAId && row.blocked_id === userBId) || (row.blocker_id === userBId && row.blocked_id === userAId));
  }
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
  if (isSupabaseAuthEnabled()) {
    if (!userId || !supabase || typeof callback !== 'function') return () => {};
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
      if (active && !error) callback((data || []).map((row) => row.blocked_id));
    };
    void load();
    const channel = supabase.channel(`blocks:${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'blocks', filter: `blocker_id=eq.${userId}` }, () => { void load(); }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }
  if (!userId) return () => {};
  const blockedRef = collection(db, 'blocks', userId, 'blockedUsers');
  return onSnapshot(blockedRef, (snapshot) => {
    const ids = snapshot.docs.map(docSnap => docSnap.id);
    callback(ids);
  });
};
