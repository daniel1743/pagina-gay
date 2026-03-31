const PENDING_PRIVATE_CHAT_RESTORE_KEY = 'chactivo:pending_private_chat_restore:v1';

const normalizePartner = (partner = {}) => {
  const userId = partner?.userId || partner?.id || '';
  return {
    id: userId,
    userId,
    username: partner?.username || 'Usuario',
    avatar: partner?.avatar || '',
    isPremium: Boolean(partner?.isPremium),
  };
};

const normalizeParticipants = (participants = []) => {
  if (!Array.isArray(participants)) return [];

  const seen = new Set();
  return participants
    .map((participant) => normalizePartner(participant))
    .filter((participant) => {
      if (!participant.userId || seen.has(participant.userId)) return false;
      seen.add(participant.userId);
      return true;
    });
};

export const savePendingPrivateChatRestore = (payload = {}) => {
  if (typeof window === 'undefined') return null;

  const redirectTo = typeof payload?.redirectTo === 'string' && payload.redirectTo.startsWith('/')
    ? payload.redirectTo
    : '/chat/principal';

  const nextValue = {
    chatId: payload?.chatId || null,
    roomId: payload?.roomId || 'principal',
    title: typeof payload?.title === 'string' ? payload.title : '',
    initialMessage: typeof payload?.initialMessage === 'string' ? payload.initialMessage.slice(0, 500) : '',
    partner: normalizePartner(payload?.partner || {}),
    participants: normalizeParticipants(payload?.participants || []),
    redirectTo,
    createdAt: Date.now(),
  };

  try {
    window.sessionStorage.setItem(PENDING_PRIVATE_CHAT_RESTORE_KEY, JSON.stringify(nextValue));
  } catch {
    return null;
  }

  return nextValue;
};

export const readPendingPrivateChatRestore = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_PRIVATE_CHAT_RESTORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearPendingPrivateChatRestore = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_PRIVATE_CHAT_RESTORE_KEY);
  } catch {
    // noop
  }
};

export const consumePendingPrivateChatRestore = () => {
  const payload = readPendingPrivateChatRestore();
  clearPendingPrivateChatRestore();
  return payload;
};
