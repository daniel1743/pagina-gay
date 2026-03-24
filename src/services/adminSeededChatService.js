import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { sendMessage } from '@/services/chatService';

export const ADMIN_SEEDED_ROOM_ID = 'principal';
export const ADMIN_OPERATOR_COUNT = 3;
export const ADMIN_ASSISTED_PRESENCE_COUNT = 6;

const ADMIN_SEEDED_COLLECTION = 'admin_seeded_rooms';
const DEFAULT_ROLE = 'Inter';

const OPERATOR_IDS = Array.from({ length: ADMIN_OPERATOR_COUNT }, (_, index) => `operator_${index + 1}`);
const PRESENCE_IDS = Array.from({ length: ADMIN_ASSISTED_PRESENCE_COUNT }, (_, index) => `presence_${index + 1}`);

const getIdentityDocId = (slotType, slotIndex) => `${slotType}_${slotIndex}`;
const getIdentityUserId = (slotType, slotIndex) => `seed_user_${slotType}_${slotIndex}`;
const getPresenceDocRef = (roomId, userId) => doc(db, 'roomPresence', roomId, 'users', userId);
const getIdentityDocRef = (roomId, slotType, slotIndex) =>
  doc(db, ADMIN_SEEDED_COLLECTION, roomId, 'identities', getIdentityDocId(slotType, slotIndex));

const buildAvatarUrl = (username = 'Usuario', customAvatar = '') => {
  if (typeof customAvatar === 'string' && customAvatar.trim()) {
    return customAvatar.trim();
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username || 'usuario')}`;
};

const buildDefaultOperator = (slotIndex) => ({
  id: getIdentityDocId('operator', slotIndex),
  slotType: 'operator',
  slotIndex,
  userId: getIdentityUserId('operator', slotIndex),
  username: '',
  roleBadge: DEFAULT_ROLE,
  avatar: '',
  enabled: false,
  status: 'online',
  useCustomAvatar: false,
});

const buildDefaultPresence = (slotIndex) => ({
  id: getIdentityDocId('presence', slotIndex),
  slotType: 'presence',
  slotIndex,
  userId: getIdentityUserId('presence', slotIndex),
  username: '',
  roleBadge: DEFAULT_ROLE,
  avatar: '',
  enabled: false,
  status: 'online',
  useCustomAvatar: false,
});

export const getDefaultAdminSeededConfig = () => ({
  operators: Array.from({ length: ADMIN_OPERATOR_COUNT }, (_, index) => buildDefaultOperator(index + 1)),
  presences: Array.from({ length: ADMIN_ASSISTED_PRESENCE_COUNT }, (_, index) => buildDefaultPresence(index + 1)),
});

const normalizeIdentity = (docSnap) => {
  const data = docSnap.data() || {};
  const slotType = data.slotType === 'presence' ? 'presence' : 'operator';
  const slotIndex = Number(data.slotIndex || 1);
  const defaults = slotType === 'presence'
    ? buildDefaultPresence(slotIndex)
    : buildDefaultOperator(slotIndex);

  return {
    ...defaults,
    ...data,
    id: docSnap.id,
    slotType,
    slotIndex,
    userId: data.userId || defaults.userId,
    username: String(data.username || '').trim(),
    roleBadge: String(data.roleBadge || defaults.roleBadge || DEFAULT_ROLE).trim() || DEFAULT_ROLE,
    avatar: typeof data.avatar === 'string' ? data.avatar : '',
    enabled: Boolean(data.enabled),
    status: data.status === 'private' ? 'private' : 'online',
    useCustomAvatar: Boolean(data.useCustomAvatar),
  };
};

const applySnapshotToDefaults = (snapshot) => {
  const defaults = getDefaultAdminSeededConfig();
  const operators = new Map(defaults.operators.map((item) => [item.slotIndex, item]));
  const presences = new Map(defaults.presences.map((item) => [item.slotIndex, item]));

  snapshot.docs.forEach((docSnap) => {
    const normalized = normalizeIdentity(docSnap);
    const target = normalized.slotType === 'presence' ? presences : operators;
    target.set(normalized.slotIndex, normalized);
  });

  return {
    operators: Array.from(operators.values()).sort((a, b) => a.slotIndex - b.slotIndex),
    presences: Array.from(presences.values()).sort((a, b) => a.slotIndex - b.slotIndex),
  };
};

export const subscribeAdminSeededChatConfig = (
  roomId = ADMIN_SEEDED_ROOM_ID,
  onUpdate,
  onError
) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeAdminSeededChatConfig requiere callback.');
  }

  const identitiesRef = collection(db, ADMIN_SEEDED_COLLECTION, roomId, 'identities');
  const identitiesQuery = query(identitiesRef, orderBy('slotType', 'asc'), orderBy('slotIndex', 'asc'));

  return onSnapshot(
    identitiesQuery,
    (snapshot) => {
      onUpdate(applySnapshotToDefaults(snapshot));
    },
    (error) => {
      console.error('[ADMIN SEEDED] Error leyendo configuracion:', error);
      onUpdate(getDefaultAdminSeededConfig());
      if (typeof onError === 'function') onError(error);
    }
  );
};

export const saveAdminSeededIdentity = async (
  roomId = ADMIN_SEEDED_ROOM_ID,
  slotType,
  slotIndex,
  payload = {}
) => {
  const normalizedSlotType = slotType === 'presence' ? 'presence' : 'operator';
  const normalizedSlotIndex = Number(slotIndex || 1);
  const username = String(payload.username || '').trim();
  const roleBadge = String(payload.roleBadge || DEFAULT_ROLE).trim() || DEFAULT_ROLE;
  const avatar = typeof payload.avatar === 'string' ? payload.avatar.trim() : '';

  await setDoc(
    getIdentityDocRef(roomId, normalizedSlotType, normalizedSlotIndex),
    {
      slotType: normalizedSlotType,
      slotIndex: normalizedSlotIndex,
      userId: getIdentityUserId(normalizedSlotType, normalizedSlotIndex),
      username,
      roleBadge,
      avatar,
      enabled: Boolean(payload.enabled),
      status: payload.status === 'private' ? 'private' : 'online',
      useCustomAvatar: Boolean(payload.useCustomAvatar && avatar),
      excludeFromMetrics: true,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
    },
    { merge: true }
  );
};

const buildPresencePayload = (identity, partner = null) => {
  const now = Date.now();
  const avatar = buildAvatarUrl(identity.username || identity.userId, identity.avatar);

  return {
    userId: identity.userId,
    username: identity.username || `Operador ${identity.slotIndex}`,
    avatar,
    roleBadge: identity.roleBadge || DEFAULT_ROLE,
    profileRole: identity.roleBadge || DEFAULT_ROLE,
    isPremium: false,
    isProUser: false,
    isGuest: false,
    isAnonymous: false,
    isBot: false,
    isSeeded: true,
    isAdminSeeded: true,
    excludeFromMetrics: true,
    seededSlotType: identity.slotType,
    seededSlotIndex: identity.slotIndex,
    connectionStatus: 'connected',
    availableForChat: false,
    availableForChatAt: null,
    availableForChatExpiresAtMs: null,
    availableForChatMode: null,
    joinedAtMs: now,
    lastSeenMs: now,
    updatedAtMs: now,
    lastSeen: serverTimestamp(),
    joinedAt: serverTimestamp(),
    inPrivateWith: partner?.userId || null,
    inPrivateWithUsername: partner?.username || null,
    inPrivateSince: partner ? serverTimestamp() : null,
  };
};

export const syncAdminSeededPresence = async (
  roomId = ADMIN_SEEDED_ROOM_ID,
  config = getDefaultAdminSeededConfig()
) => {
  const batch = writeBatch(db);
  const identities = [...(config.operators || []), ...(config.presences || [])];
  const presenceMap = new Map((config.presences || []).map((item) => [item.slotIndex, item]));

  identities.forEach((identity) => {
    const docRef = getPresenceDocRef(roomId, identity.userId);
    const username = String(identity.username || '').trim();
    const shouldShow = Boolean(identity.enabled && username);

    if (!shouldShow) {
      batch.delete(docRef);
      return;
    }

    let partner = null;
    if (identity.slotType === 'presence' && identity.status === 'private') {
      const partnerSlot = identity.slotIndex % 2 === 0 ? identity.slotIndex - 1 : identity.slotIndex + 1;
      const partnerCandidate = presenceMap.get(partnerSlot);
      if (partnerCandidate?.enabled && partnerCandidate?.username) {
        partner = partnerCandidate;
      }
    }

    batch.set(docRef, buildPresencePayload(identity, partner), { merge: true });
  });

  await batch.commit();
};

export const clearAdminSeededPresence = async (roomId = ADMIN_SEEDED_ROOM_ID) => {
  const batch = writeBatch(db);
  OPERATOR_IDS.forEach((id, index) => {
    batch.delete(getPresenceDocRef(roomId, getIdentityUserId('operator', index + 1)));
  });
  PRESENCE_IDS.forEach((id, index) => {
    batch.delete(getPresenceDocRef(roomId, getIdentityUserId('presence', index + 1)));
  });
  await batch.commit();
};

export const sendAdminSeededMessage = async (
  roomId = ADMIN_SEEDED_ROOM_ID,
  identity,
  content,
  adminUser = null
) => {
  const safeContent = String(content || '').trim();
  if (!identity?.userId || !safeContent) {
    throw new Error('Identidad o mensaje inválido.');
  }

  return sendMessage(
    roomId,
    {
      userId: identity.userId,
      username: identity.username || `Operador ${identity.slotIndex || ''}`.trim(),
      avatar: buildAvatarUrl(identity.username || identity.userId, identity.avatar),
      content: safeContent,
      type: 'text',
      roleBadge: identity.roleBadge || DEFAULT_ROLE,
      senderUid: auth.currentUser?.uid || adminUser?.id || null,
      isAdminSeeded: true,
      trace: {
        origin: 'ADMIN',
        source: 'ADMIN_SEEDED_PANEL',
        actorId: identity.userId,
        actorType: 'ADMIN_SEEDED',
        system: 'adminSeededChatPanel',
        traceId: `seeded_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        adminId: adminUser?.id || auth.currentUser?.uid || null,
        adminUsername: adminUser?.username || 'Admin',
      },
    },
    false,
    false,
    { allowAdminSeededInPrincipal: true }
  );
};

export const applyPresenceConversationPreset = async (
  roomId = ADMIN_SEEDED_ROOM_ID,
  config,
  presetIndex,
  enabled
) => {
  const leftSlot = ((Number(presetIndex || 1) - 1) * 2) + 1;
  const rightSlot = leftSlot + 1;
  const targets = new Set([leftSlot, rightSlot]);
  const nextPresences = (config?.presences || []).map((item) => {
    if (!targets.has(item.slotIndex)) return item;
    return {
      ...item,
      enabled: enabled ? true : item.enabled,
      status: enabled ? 'private' : 'online',
    };
  });

  await Promise.all(
    nextPresences
      .filter((item) => targets.has(item.slotIndex))
      .map((item) => saveAdminSeededIdentity(roomId, 'presence', item.slotIndex, item))
  );

  await syncAdminSeededPresence(roomId, {
    operators: config?.operators || [],
    presences: nextPresences,
  });

  return {
    operators: config?.operators || [],
    presences: nextPresences,
  };
};

export const removeAdminSeededIdentity = async (
  roomId = ADMIN_SEEDED_ROOM_ID,
  slotType,
  slotIndex
) => {
  await deleteDoc(getIdentityDocRef(roomId, slotType, slotIndex));
  await deleteDoc(getPresenceDocRef(roomId, getIdentityUserId(slotType, slotIndex)));
};
