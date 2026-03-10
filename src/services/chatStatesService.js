import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { resolveProfileRole } from '@/config/profileRoles';

const STATE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FETCH_LIMIT = 60;

const toMillisSafe = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
};

const getStatesCollectionRef = (roomId) => collection(db, 'rooms', roomId, 'states');
const getStateDocRef = (roomId, userId) => doc(db, 'rooms', roomId, 'states', userId);

const normalizeState = (snap) => {
  const data = snap.data() || {};
  const createdAtMs = toMillisSafe(data.createdAt);
  const updatedAtMs = toMillisSafe(data.updatedAt);
  const expiresAtMs = toMillisSafe(data.expiresAt);

  return {
    id: snap.id,
    userId: data.userId || snap.id,
    username: data.username || 'Usuario',
    avatar: data.avatar || '/avatar_por_defecto.jpeg',
    roleBadge: data.roleBadge || null,
    message: String(data.message || ''),
    createdAtMs,
    updatedAtMs,
    expiresAtMs,
    createdAtISO: createdAtMs ? new Date(createdAtMs).toISOString() : null,
  };
};

const isActiveState = (item) => {
  const now = Date.now();
  if (!item?.message) return false;
  if (item.expiresAtMs && item.expiresAtMs < now) return false;
  if (!item.createdAtMs) return true;
  return (now - item.createdAtMs) <= STATE_TTL_MS;
};

export const fetchRoomStates = async (roomId, maxItems = DEFAULT_FETCH_LIMIT) => {
  if (!roomId) return [];

  const statesRef = getStatesCollectionRef(roomId);
  const q = query(statesRef, orderBy('updatedAt', 'desc'), limit(maxItems));
  const snapshot = await getDocs(q);

  const items = snapshot.docs
    .map(normalizeState)
    .filter(isActiveState);

  return items;
};

export const getOwnStateCooldown = async (roomId, userId) => {
  if (!roomId || !userId) {
    return { canPublish: false, remainingMs: STATE_TTL_MS };
  }

  const ownRef = getStateDocRef(roomId, userId);
  const ownSnap = await getDoc(ownRef);
  if (!ownSnap.exists()) {
    return { canPublish: true, remainingMs: 0 };
  }

  const ownState = normalizeState(ownSnap);
  const createdAtMs = ownState.createdAtMs;
  if (!createdAtMs) {
    return { canPublish: false, remainingMs: STATE_TTL_MS };
  }

  const elapsed = Date.now() - createdAtMs;
  const remainingMs = Math.max(0, STATE_TTL_MS - elapsed);

  return {
    canPublish: remainingMs === 0,
    remainingMs,
    state: ownState,
  };
};

export const publishRoomState = async (roomId, stateData) => {
  if (!roomId) throw new Error('state/invalid-room');
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');

  const userId = auth.currentUser.uid;
  const text = String(stateData?.message || '').trim();
  if (!text) throw new Error('state/empty-message');
  if (text.length > 160) throw new Error('state/message-too-long');

  const cooldown = await getOwnStateCooldown(roomId, userId);
  if (!cooldown.canPublish) {
    const cooldownError = new Error('state/cooldown');
    cooldownError.remainingMs = cooldown.remainingMs || STATE_TTL_MS;
    throw cooldownError;
  }

  const roleBadge = resolveProfileRole(
    stateData?.roleBadge,
    stateData?.profileRole,
    stateData?.role
  );

  const ownRef = getStateDocRef(roomId, userId);
  await setDoc(ownRef, {
    userId,
    username: stateData?.username || 'Usuario',
    avatar: stateData?.avatar || '/avatar_por_defecto.jpeg',
    roleBadge: roleBadge || null,
    message: text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  }, { merge: true });

  return { ok: true };
};

export const deleteRoomState = async (roomId, targetUserId = null) => {
  if (!roomId) throw new Error('state/invalid-room');
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');

  const ownerId = targetUserId || auth.currentUser.uid;
  if (ownerId !== auth.currentUser.uid) throw new Error('state/not-owner');

  await deleteDoc(getStateDocRef(roomId, ownerId));
  return { ok: true };
};

export const formatStateCooldown = (remainingMs) => {
  const safeMs = Math.max(0, Number(remainingMs) || 0);
  const hours = Math.floor(safeMs / (60 * 60 * 1000));
  const minutes = Math.ceil((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours <= 0) return `${minutes} min`;
  if (minutes <= 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};
