import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  setDoc,
  limit,
  runTransaction,
  deleteField,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { isBlockedBetween } from '@/services/blockService';
import { trackListenerStart, trackListenerStop } from '@/utils/listenerMonitor';
import {
  detectPrivateChatExternalContact,
  getPrivateChatEarlyContactBlockMessage,
} from '@/services/privateChatSafetyService';
import {
  recordBlockedContactAttempt,
  recordContactSafetyEvent,
} from '@/services/contactSafetyTelemetryService';

const OPIN_PRIVATE_REQUESTS_PER_HOUR = 4;
const OPIN_PRIVATE_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN_MS = 15 * 60 * 1000;
const PRIVATE_CHAT_REQUEST_LOG_COLLECTION = 'private_chat_request_logs';
const PRIVATE_GROUP_MAX_PARTICIPANTS = 4;
const PRIVATE_GROUP_INVITES_COLLECTION = 'private_chat_group_invites';
const PRIVATE_GROUP_INVITE_EXPIRY_MS = 2 * 60 * 1000;
const PRIVATE_CHAT_CONTACT_UNLOCK_MIN_MESSAGES_PER_PARTICIPANT = 3;
const PRIVATE_CHAT_CONTACT_UNLOCK_MIN_AGE_MS = 10 * 60 * 1000;
const PRIVATE_CHAT_CONTACT_HISTORY_LIMIT = 40;
const PRIVATE_CHAT_CONTACT_SHARE_TTL_MS = 24 * 60 * 60 * 1000;
const sharedNotificationsListeners = new Map();

const buildPrivateChatDebugError = (error) => ({
  code: error?.code || null,
  message: error?.message || String(error || 'Unknown error'),
  name: error?.name || null,
});

const emitPrivateChatDebug = (label, context = {}, error = null) => {
  const payload = {
    label,
    at: new Date().toISOString(),
    authUid: auth?.currentUser?.uid || null,
    authProvider: auth?.currentUser?.providerData?.[0]?.providerId || (auth?.currentUser?.isAnonymous ? 'anonymous' : null),
    authAnonymous: Boolean(auth?.currentUser?.isAnonymous),
    ...context,
    ...(error ? { error: buildPrivateChatDebugError(error) } : {}),
  };

  if (typeof window !== 'undefined') {
    window.__lastPrivateChatDebug = payload;
    const history = Array.isArray(window.__privateChatDebugHistory)
      ? window.__privateChatDebugHistory
      : [];
    history.unshift(payload);
    window.__privateChatDebugHistory = history.slice(0, 25);
    window.printPrivateChatDebug = () => {
      const latest = window.__lastPrivateChatDebug || null;
      console.group('[PRIVATE_CHAT_DEBUG] latest');
      console.log(latest);
      console.groupEnd();
      console.table(window.__privateChatDebugHistory || []);
      return latest;
    };
  }

  const consoleMethod = error ? console.error : console.info;
  consoleMethod('[PRIVATE_CHAT_DEBUG]', payload);
  return payload;
};

const toMillis = (value) => {
  if (value?.toMillis) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapNotificationsFromSnapshot = (snapshot) => snapshot.docs
  .map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    timestamp: docSnap.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  }))
  .filter((item) => item.read !== true);

const notifyNotificationSubscribers = (entry, notifications) => {
  entry.callbacks.forEach((cb) => {
    try {
      cb(notifications);
    } catch {
      // noop
    }
  });
};

const normalizeParticipantProfile = (participant = {}) => {
  const userId = participant?.userId || participant?.id || '';
  return {
    userId,
    username: participant?.username || 'Usuario',
    avatar: participant?.avatar || '',
    isPremium: Boolean(participant?.isPremium),
  };
};

const dedupeParticipantProfiles = (participants = []) => {
  const byId = new Map();
  (participants || []).forEach((participant) => {
    const normalized = normalizeParticipantProfile(participant);
    if (!normalized.userId) return;
    byId.set(normalized.userId, normalized);
  });
  return Array.from(byId.values());
};

const buildPrivateGroupChatId = (participantIds = []) => {
  const sorted = [...new Set((participantIds || []).filter(Boolean))].sort();
  return `group_${sorted.join('__')}`;
};

const buildPrivateGroupTitle = (participantProfiles = [], currentUserId = null) => {
  const others = (participantProfiles || []).filter((item) => item.userId !== currentUserId);
  const names = others.map((item) => item.username).filter(Boolean);
  if (names.length === 0) return 'Grupo privado';
  if (names.length <= 2) return names.join(' + ');
  return `${names.slice(0, 2).join(' + ')} +${names.length - 2}`;
};

const buildPrivateChatMessagePreview = ({ content, type }) => {
  if (type === 'image') return '📷 Foto';
  const normalized = typeof content === 'string' ? content.trim() : '';
  if (!normalized) return 'Nuevo mensaje';
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
};

const evaluatePrivateChatContactGate = async (chatRef, chatId, chatData = {}, participants = []) => {
  const normalizedParticipants = [...new Set((participants || []).filter(Boolean))];
  if (!chatId || normalizedParticipants.length < 2) {
    return {
      unlocked: false,
      chatAgeMs: 0,
      participantMessageCounts: {},
      reason: 'invalid_chat',
    };
  }

  if (chatData?.contactSharingUnlocked === true) {
    return {
      unlocked: true,
      chatAgeMs: Math.max(0, Date.now() - toMillis(chatData?.createdAt)),
      participantMessageCounts: chatData?.contactSharingUnlockedCounts || {},
      reason: 'cached_unlock',
    };
  }

  const messagesRef = collection(db, 'private_chats', chatId, 'messages');
  const historySnap = await getDocs(query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(PRIVATE_CHAT_CONTACT_HISTORY_LIMIT)
  ));

  const participantMessageCounts = normalizedParticipants.reduce((acc, participantId) => {
    acc[participantId] = 0;
    return acc;
  }, {});

  historySnap.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const senderId = data.userId;
    if (!senderId || !(senderId in participantMessageCounts)) return;
    participantMessageCounts[senderId] += 1;
  });

  const chatAgeMs = Math.max(0, Date.now() - toMillis(chatData?.createdAt));
  const everyParticipantHasEnoughMessages = normalizedParticipants.every(
    (participantId) => (participantMessageCounts[participantId] || 0) >= PRIVATE_CHAT_CONTACT_UNLOCK_MIN_MESSAGES_PER_PARTICIPANT
  );
  const unlocked = (
    normalizedParticipants.length >= 2 &&
    everyParticipantHasEnoughMessages &&
    chatAgeMs >= PRIVATE_CHAT_CONTACT_UNLOCK_MIN_AGE_MS
  );

  if (unlocked) {
    await setDoc(chatRef, {
      contactSharingUnlocked: true,
      contactSharingUnlockedAt: serverTimestamp(),
      contactSharingUnlockedCounts: participantMessageCounts,
    }, { merge: true });
  }

  return {
    unlocked,
    chatAgeMs,
    participantMessageCounts,
    reason: unlocked ? 'threshold_reached' : 'threshold_pending',
  };
};

const enforcePrivateChatEarlyContactPolicy = async ({ chatId, chatRef, chatData, participants, type, content }) => {
  if (type !== 'text') return null;

  const detection = detectPrivateChatExternalContact(content);
  if (!detection.hasExternalContact) return null;

  const gate = await evaluatePrivateChatContactGate(chatRef, chatId, chatData, participants);
  if (gate.unlocked) {
    return {
      allowed: true,
      detection,
      gate,
    };
  }

  const error = new Error(getPrivateChatEarlyContactBlockMessage());
  error.code = 'PRIVATE_CONTACT_LOCKED';
  error.contactGate = gate;
  error.contactDetection = detection;
  throw error;
};

const getPrivateContactVisibilityState = (chatData = {}, ownerId, viewerId) => {
  const rawValue = chatData?.contactShareVisibility?.[ownerId]?.[viewerId];
  if (!rawValue) {
    return {
      isVisible: false,
      isExpired: false,
      expiresAtMs: null,
    };
  }

  if (rawValue === true) {
    return {
      isVisible: true,
      isExpired: false,
      expiresAtMs: null,
    };
  }

  const expiresAtMs = Number(rawValue?.expiresAtMs || 0) || null;
  const isExpired = Boolean(expiresAtMs) && expiresAtMs <= Date.now();
  return {
    isVisible: rawValue?.allowed === true && !isExpired,
    isExpired,
    expiresAtMs,
  };
};

const appendPrivateChatSystemMessage = async (chatId, content) => {
  if (!chatId || !content) return null;

  const messagesRef = collection(db, 'private_chats', chatId, 'messages');
  return addDoc(messagesRef, {
    userId: 'system',
    username: 'Sistema',
    avatar: '',
    content,
    type: 'system',
    status: 'sent',
    deliveredTo: [],
    readBy: [],
    timestamp: serverTimestamp(),
  });
};

const syncPrivateChatSystemEvent = async ({
  chatRef,
  chatId,
  participantProfiles = [],
  preview,
  unreadRecipientIds = [],
  resetUnreadForUserIds = [],
}) => {
  if (!chatRef || !chatId || !preview) return;

  await setDoc(chatRef, {
    lastMessage: preview,
    lastMessageType: 'system',
    lastMessageSenderId: null,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    active: true,
    status: 'active',
  }, { merge: true });

  void syncPrivateInboxEntries({
    chatId,
    participantProfiles,
    conversationState: 'active',
    lastMessagePreview: preview,
    lastMessageSenderId: null,
    lastMessageType: 'system',
    unreadRecipientIds,
    resetUnreadForUserIds,
  }).catch((secondaryError) => {
    emitPrivateChatDebug('private_chat_system_event_sync_failed', {
      chatId,
      preview,
      unreadRecipientIds,
      resetUnreadForUserIds,
    }, secondaryError);
  });
};

const buildParticipantMapValue = (participantIds = [], value = null) => Object.fromEntries(
  [...new Set((participantIds || []).filter(Boolean))]
    .sort()
    .map((participantId) => [participantId, value])
);

const buildPrivateChatCompatibilityPatch = (participantIds = [], overrides = {}) => ({
  status: 'active',
  updatedAt: serverTimestamp(),
  acceptedBy: buildParticipantMapValue(participantIds, true),
  blockedBy: buildParticipantMapValue(participantIds, false),
  lastSeenMessageId: buildParticipantMapValue(participantIds, null),
  ...overrides,
});

const ensurePrivateChatCompatibilityMetadata = async (chatRef, participantIds = [], overrides = {}) => {
  const normalizedIds = [...new Set((participantIds || []).filter(Boolean))].sort();
  if (normalizedIds.length < 2) return;

  await setDoc(
    chatRef,
    buildPrivateChatCompatibilityPatch(normalizedIds, overrides),
    { merge: true }
  );
};

const fetchPrivateChatParticipantProfiles = async (participantIds = []) => {
  const normalizedIds = [...new Set((participantIds || []).filter(Boolean))].sort();
  if (normalizedIds.length === 0) return [];

  const profiles = await Promise.all(
    normalizedIds.map(async (participantId) => {
      try {
        const userSnap = await getDoc(doc(db, 'users', participantId));
        const data = userSnap.data() || {};
        return normalizeParticipantProfile({
          userId: participantId,
          username: data.username || 'Usuario',
          avatar: data.avatar || '',
          isPremium: Boolean(data.isPremium),
        });
      } catch {
        return normalizeParticipantProfile({
          userId: participantId,
          username: 'Usuario',
          avatar: '',
          isPremium: false,
        });
      }
    })
  );

  return dedupeParticipantProfiles(profiles);
};

const buildPrivateInboxEntry = ({
  ownerUserId,
  chatId,
  participantProfiles = [],
  title = '',
  conversationState = 'active',
  lastMessagePreview = '',
  lastMessageSenderId = null,
  lastMessageType = null,
  unreadDelta = 0,
  resetUnread = false,
}) => {
  const normalizedProfiles = dedupeParticipantProfiles(participantProfiles);
  const isGroup = normalizedProfiles.length > 2;
  const otherParticipants = normalizedProfiles.filter((participant) => participant.userId !== ownerUserId);
  const primaryOther = otherParticipants[0] || {};

  const payload = {
    conversationId: chatId,
    chatId,
    participants: normalizedProfiles.map((participant) => participant.userId),
    participantProfiles: normalizedProfiles,
    isGroup: isGroup,
    otherUserId: isGroup ? null : (primaryOther.userId || null),
    otherUserDisplayName: isGroup
      ? (title || buildPrivateGroupTitle(normalizedProfiles, ownerUserId))
      : (primaryOther.username || 'Usuario'),
    otherUserAvatar: isGroup ? '' : (primaryOther.avatar || ''),
    title: isGroup ? (title || buildPrivateGroupTitle(normalizedProfiles, ownerUserId)) : '',
    lastMessagePreview: lastMessagePreview || 'Sin mensajes todavía',
    lastMessageSenderId: lastMessageSenderId || null,
    lastMessageType: lastMessageType || null,
    lastMessageAt: serverTimestamp(),
    isPinned: false,
    isMinimized: true,
    isOpen: false,
    isTyping: false,
    presence: 'offline',
    conversationState,
    updatedAt: serverTimestamp(),
  };

  if (resetUnread) {
    payload.unreadCount = 0;
  } else if (unreadDelta > 0) {
    payload.unreadCount = increment(unreadDelta);
  }

  return payload;
};

const syncPrivateInboxEntries = async ({
  chatId,
  participantProfiles = [],
  title = '',
  conversationState = 'active',
  lastMessagePreview = '',
  lastMessageSenderId = null,
  lastMessageType = null,
  unreadRecipientIds = [],
  resetUnreadForUserIds = [],
}) => {
  const normalizedProfiles = dedupeParticipantProfiles(participantProfiles);
  const participantIds = normalizedProfiles.map((participant) => participant.userId).filter(Boolean);
  if (!chatId || participantIds.length < 2) return;

  const unreadSet = new Set((unreadRecipientIds || []).filter(Boolean));
  const resetSet = new Set((resetUnreadForUserIds || []).filter(Boolean));

  await Promise.all(
    participantIds.map((ownerUserId) => {
      const inboxRef = doc(db, 'users', ownerUserId, 'private_inbox', chatId);
      return setDoc(
        inboxRef,
        buildPrivateInboxEntry({
          ownerUserId,
          chatId,
          participantProfiles: normalizedProfiles,
          title,
          conversationState,
          lastMessagePreview,
          lastMessageSenderId,
          lastMessageType,
          unreadDelta: unreadSet.has(ownerUserId) ? 1 : 0,
          resetUnread: resetSet.has(ownerUserId),
        }),
        { merge: true }
      );
    })
  );
};

const notifyPrivateChatRecipients = async ({
  chatId,
  sender,
  recipientIds = [],
  content,
  type = 'text',
}) => {
  const validRecipients = [...new Set((recipientIds || []).filter(Boolean))].filter((id) => id !== sender?.userId);
  if (validRecipients.length === 0) return;

  const preview = buildPrivateChatMessagePreview({ content, type });

  await Promise.all(
    validRecipients.map((recipientId) => addDoc(collection(db, 'users', recipientId, 'notifications'), {
      from: sender?.userId || null,
      fromUsername: sender?.username || 'Usuario',
      fromAvatar: sender?.avatar || '',
      fromIsPremium: Boolean(sender?.isPremium),
      to: recipientId,
      type: 'direct_message',
      chatId,
      content: preview,
      read: false,
      source: 'private_chat_direct',
      timestamp: serverTimestamp(),
    }))
  );
};

export const signalPrivateChatOpen = async ({
  chatId,
  fromUserId,
  toUserId,
  title = '',
  created = false,
}) => {
  let stage = 'validate_input';
  try {
    if (!chatId || !fromUserId || !toUserId) {
      throw new Error('MISSING_PARAMS');
    }
    if (fromUserId === toUserId) {
      throw new Error('INVALID_TARGET');
    }

    stage = 'read_sender';
    const senderSnap = await getDoc(doc(db, 'users', fromUserId));
    const senderData = senderSnap.data() || {};

    stage = 'read_chat';
    const chatSnap = await getDoc(doc(db, 'private_chats', chatId));
    const chatData = chatSnap.data() || {};
    const participants = Array.isArray(chatData?.participants) ? chatData.participants : [fromUserId, toUserId];
    const participantProfiles = Array.isArray(chatData?.participantProfiles) && chatData.participantProfiles.length > 0
      ? dedupeParticipantProfiles(chatData.participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const conversationTitle = typeof chatData?.title === 'string' && chatData.title.trim()
      ? chatData.title
      : title;

    stage = 'write_notification';
    await addDoc(collection(db, 'users', toUserId, 'notifications'), {
      from: fromUserId,
      fromUsername: senderData.username || 'Usuario',
      fromAvatar: senderData.avatar || '',
      fromIsPremium: Boolean(senderData.isPremium),
      to: toUserId,
      type: 'private_chat_reopened',
      chatId,
      title: conversationTitle || '',
      participantProfiles,
      created,
      content: created
        ? `${senderData.username || 'Usuario'} abrió un chat privado contigo`
        : `${senderData.username || 'Usuario'} volvió a abrir el chat privado`,
      read: false,
      timestamp: serverTimestamp(),
    });

    emitPrivateChatDebug('private_chat_open_signal_sent', {
      stage: 'done',
      chatId,
      fromUserId,
      toUserId,
      created,
      participants,
    });

    return { success: true };
  } catch (error) {
    emitPrivateChatDebug('private_chat_open_signal_failed', {
      stage,
      chatId,
      fromUserId,
      toUserId,
      created,
    }, error);
    throw error;
  }
};

export const getOrCreatePrivateGroupChat = async (participantProfiles = [], options = {}) => {
  const normalizedProfiles = dedupeParticipantProfiles(participantProfiles);
  const participantIds = normalizedProfiles.map((item) => item.userId);

  if (participantIds.length < 3) {
    throw new Error('GROUP_CHAT_REQUIRES_3_PARTICIPANTS');
  }
  if (participantIds.length > PRIVATE_GROUP_MAX_PARTICIPANTS) {
    throw new Error('GROUP_CHAT_LIMIT_EXCEEDED');
  }

  const chatId = buildPrivateGroupChatId(participantIds);
  const chatRef = doc(collection(db, 'private_chats'), chatId);
  const existing = await getDoc(chatRef);

  if (existing.exists()) {
    await ensurePrivateChatCompatibilityMetadata(chatRef, participantIds, {
      active: true,
      title: options?.title || buildPrivateGroupTitle(normalizedProfiles),
      sourceChatId: options?.sourceChatId || null,
    }).catch(() => {});
    await syncPrivateInboxEntries({
      chatId,
      participantProfiles: normalizedProfiles,
      title: options?.title || buildPrivateGroupTitle(normalizedProfiles),
      conversationState: 'active',
      lastMessagePreview: existing.data()?.lastMessage || 'Sin mensajes todavía',
      resetUnreadForUserIds: participantIds,
    }).catch(() => {});
    return { chatId, created: false };
  }

  await setDoc(chatRef, {
    participants: participantIds.slice().sort(),
    participantProfiles: normalizedProfiles,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: null,
    lastMessageType: null,
    active: true,
    status: 'active',
    acceptedBy: buildParticipantMapValue(participantIds, true),
    blockedBy: buildParticipantMapValue(participantIds, false),
    lastSeenMessageId: buildParticipantMapValue(participantIds, null),
    isGroup: true,
    title: options?.title || buildPrivateGroupTitle(normalizedProfiles),
    sourceChatId: options?.sourceChatId || null,
  });

  await syncPrivateInboxEntries({
    chatId,
    participantProfiles: normalizedProfiles,
    title: options?.title || buildPrivateGroupTitle(normalizedProfiles),
    conversationState: 'active',
    lastMessagePreview: 'Sin mensajes todavía',
    resetUnreadForUserIds: participantIds,
  }).catch(() => {});

  return { chatId, created: true };
};

export const sendPrivateGroupInvite = async ({
  sourceChatId,
  inviterId,
  existingParticipants = [],
  invitee,
}) => {
  try {
    const actorUserId = auth?.currentUser?.uid || inviterId;
    const normalizedInvitee = normalizeParticipantProfile(invitee);
    const normalizedParticipants = dedupeParticipantProfiles(existingParticipants);

    if (!actorUserId || !normalizedInvitee.userId || !sourceChatId) {
      throw new Error('MISSING_PARAMS');
    }

    if (normalizedInvitee.userId === actorUserId) {
      throw new Error('SELF_REQUEST_NOT_ALLOWED');
    }

    const currentParticipants = dedupeParticipantProfiles([
      ...normalizedParticipants,
      { userId: actorUserId },
    ]);

    if (!currentParticipants.some((item) => item.userId === actorUserId)) {
      throw new Error('INVITER_NOT_IN_CHAT');
    }

    const allParticipants = dedupeParticipantProfiles([
      ...currentParticipants,
      normalizedInvitee,
    ]);

    if (allParticipants.length <= currentParticipants.length) {
      throw new Error('USER_ALREADY_IN_CHAT');
    }
    if (allParticipants.length > PRIVATE_GROUP_MAX_PARTICIPANTS) {
      throw new Error('GROUP_CHAT_LIMIT_EXCEEDED');
    }

    const blocked = await isBlockedBetween(actorUserId, normalizedInvitee.userId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    const inviterDoc = await getDoc(doc(db, 'users', actorUserId));
    const inviterData = inviterDoc.data() || {};
    const inviterProfile = normalizeParticipantProfile({
      userId: actorUserId,
      username: inviterData.username || currentParticipants.find((item) => item.userId === actorUserId)?.username || 'Usuario',
      avatar: inviterData.avatar || currentParticipants.find((item) => item.userId === actorUserId)?.avatar || '',
      isPremium: inviterData.isPremium || false,
    });

    const participantProfiles = dedupeParticipantProfiles(
      allParticipants.map((item) => (item.userId === actorUserId ? inviterProfile : item))
    );

    const approverUserIds = [
      ...currentParticipants
        .map((item) => item.userId)
        .filter((userId) => userId && userId !== actorUserId),
      normalizedInvitee.userId,
    ];

    const inviteRef = await addDoc(collection(db, PRIVATE_GROUP_INVITES_COLLECTION), {
      inviterId: actorUserId,
      sourceChatId,
      requestedUserId: normalizedInvitee.userId,
      allParticipantIds: participantProfiles.map((item) => item.userId).slice().sort(),
      approverUserIds: [...new Set(approverUserIds)],
      approvedBy: [actorUserId],
      participantProfiles,
      status: 'pending',
      expiresAtMs: Date.now() + PRIVATE_GROUP_INVITE_EXPIRY_MS,
      createdAt: serverTimestamp(),
    });

    await Promise.all(
      approverUserIds.map((targetUserId) => addDoc(collection(db, 'users', targetUserId, 'notifications'), {
        from: actorUserId,
        fromUsername: inviterProfile.username,
        fromAvatar: inviterProfile.avatar,
        fromIsPremium: inviterProfile.isPremium,
        to: targetUserId,
        type: 'private_group_invite_request',
        inviteId: inviteRef.id,
        sourceChatId,
        requestedUserId: normalizedInvitee.userId,
        requestedUsername: normalizedInvitee.username,
        participantProfiles,
        approverUserIds: [...new Set(approverUserIds)],
        read: false,
        status: 'pending',
        expiresAtMs: Date.now() + PRIVATE_GROUP_INVITE_EXPIRY_MS,
        timestamp: serverTimestamp(),
      }))
    );

    return { success: true, inviteId: inviteRef.id };
  } catch (error) {
    console.error('Error sending private group invite:', error);
    throw error;
  }
};

/**
 * Envía un mensaje directo a otro usuario
 * El mensaje aparece en las notificaciones del destinatario
 */
export const sendDirectMessage = async (fromUserId, toUserId, content) => {
  try {
    const blocked = await isBlockedBetween(fromUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // Obtener datos del remitente
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();

    const messageData = {
      from: fromUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content,
      type: 'direct_message',
      read: false,
      timestamp: serverTimestamp(),
    };

    // Guardar en la colección de notificaciones del destinatario
    await addDoc(collection(db, 'users', toUserId, 'notifications'), messageData);

    // También guardar en la bandeja de enviados del remitente
    await addDoc(collection(db, 'users', fromUserId, 'sent_messages'), {
      ...messageData,
      read: true, // El remitente ya lo "leyó" porque lo envió
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

/**
 * Envía una solicitud de chat privado
 * La solicitud aparece en las notificaciones del destinatario con opciones Aceptar/Rechazar
 */
export const sendPrivateChatRequest = async (fromUserId, toUserId, options = {}) => {
  let stage = 'validate_input';
  try {
    const senderUserId = auth?.currentUser?.uid || fromUserId;
    if (!senderUserId || !toUserId) {
      throw new Error('MISSING_USER_IDS');
    }
    if (senderUserId === toUserId) {
      throw new Error('SELF_REQUEST_NOT_ALLOWED');
    }

    stage = 'check_block';
    const blocked = await isBlockedBetween(senderUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    stage = 'read_sender_profile';
    // Obtener datos del remitente
    const fromUserDoc = await getDoc(doc(db, 'users', senderUserId));
    const fromUserData = fromUserDoc.data();

    const source = typeof options?.source === 'string' && options.source.trim()
      ? options.source.trim()
      : 'manual';
    const systemPrompt = typeof options?.systemPrompt === 'string' && options.systemPrompt.trim()
      ? options.systemPrompt.trim()
      : null;
    const suggestedStarter = typeof options?.suggestedStarter === 'string' && options.suggestedStarter.trim()
      ? options.suggestedStarter.trim()
      : null;

    const requestData = {
      from: senderUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content: `${fromUserData?.username || 'Un usuario'} quiere conectar contigo en chat privado`,
      type: 'private_chat_request',
      status: 'pending', // pending | accepted | rejected
      read: false,
      timestamp: serverTimestamp(),
      source,
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(suggestedStarter ? { suggestedStarter } : {}),
    };

    // Guardar en notificaciones del destinatario
    stage = 'write_notification';
    const notificationRef = await addDoc(
      collection(db, 'users', toUserId, 'notifications'),
      requestData
    );

    emitPrivateChatDebug('private_chat_request_success', {
      stage: 'done',
      senderUserId,
      toUserId,
      requestId: notificationRef.id,
      source,
    });

    return { success: true, requestId: notificationRef.id };
  } catch (error) {
    emitPrivateChatDebug('private_chat_request_failed', {
      stage,
      fromUserId,
      toUserId,
      source: options?.source || 'manual',
    }, error);
    console.error('Error sending private chat request:', error);
    throw error;
  }
};

/**
 * Crear u obtener chat privado directo entre dos usuarios
 * Sin solicitud previa (flujo rápido desde Baúl)
 */
export const getOrCreatePrivateChat = async (userAId, userBId) => {
  let stage = 'validate_input';
  if (!userAId || !userBId) {
    throw new Error('Missing user ids');
  }
  if (userAId === userBId) {
    throw new Error('Cannot create chat with self');
  }
  try {
    stage = 'check_block';
    const blocked = await isBlockedBetween(userAId, userBId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    const chatsRef = collection(db, 'private_chats');
    const sortedIds = [userAId, userBId].sort();
    const deterministicChatId = `${sortedIds[0]}_${sortedIds[1]}`;
    const deterministicChatRef = doc(chatsRef, deterministicChatId);

    stage = 'read_deterministic_chat';
    let deterministicSnap = null;
    try {
      deterministicSnap = await getDoc(deterministicChatRef);
    } catch (error) {
      // En chats optimistas el doc determinista puede no existir todavía y en
      // algunos entornos Firestore responde permission-denied al get directo.
      if (error?.code !== 'permission-denied') {
        throw error;
      }
    }
    if (deterministicSnap?.exists()) {
      const existingParticipants = Array.isArray(deterministicSnap.data()?.participants)
        ? deterministicSnap.data().participants
        : sortedIds;
      const participantProfiles = Array.isArray(deterministicSnap.data()?.participantProfiles) && deterministicSnap.data()?.participantProfiles?.length > 0
        ? dedupeParticipantProfiles(deterministicSnap.data().participantProfiles)
        : await fetchPrivateChatParticipantProfiles(existingParticipants);
      void ensurePrivateChatCompatibilityMetadata(deterministicChatRef, existingParticipants, {
        active: true,
      }).catch(() => {});
      void syncPrivateInboxEntries({
        chatId: deterministicSnap.id,
        participantProfiles,
        conversationState: 'active',
        lastMessagePreview: deterministicSnap.data()?.lastMessage || 'Sin mensajes todavía',
        lastMessageSenderId: deterministicSnap.data()?.lastMessageSenderId || null,
        lastMessageType: deterministicSnap.data()?.lastMessageType || null,
        resetUnreadForUserIds: existingParticipants,
      }).catch(() => {});

      emitPrivateChatDebug('private_chat_open_existing', {
        stage: 'done',
        userAId,
        userBId,
        chatId: deterministicSnap.id,
        created: false,
        source: 'deterministic_doc',
      });
      return { chatId: deterministicSnap.id, created: false };
    }

    const q = query(
      chatsRef,
      where('participants', 'array-contains', userAId),
      limit(50)
    );

    stage = 'query_existing_chats';
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find((docSnap) => {
      const data = docSnap.data();
      return Array.isArray(data.participants) && data.participants.includes(userBId);
    });

    if (existing) {
      const existingParticipants = Array.isArray(existing.data()?.participants)
        ? existing.data().participants
        : [userAId, userBId];
      const participantProfiles = Array.isArray(existing.data()?.participantProfiles) && existing.data()?.participantProfiles?.length > 0
        ? dedupeParticipantProfiles(existing.data().participantProfiles)
        : await fetchPrivateChatParticipantProfiles(existingParticipants);
      void ensurePrivateChatCompatibilityMetadata(existing.ref, existingParticipants, {
        active: true,
      }).catch(() => {});
      void syncPrivateInboxEntries({
        chatId: existing.id,
        participantProfiles,
        conversationState: 'active',
        lastMessagePreview: existing.data()?.lastMessage || 'Sin mensajes todavía',
        lastMessageSenderId: existing.data()?.lastMessageSenderId || null,
        lastMessageType: existing.data()?.lastMessageType || null,
        resetUnreadForUserIds: existingParticipants,
      }).catch(() => {});

      emitPrivateChatDebug('private_chat_open_existing', {
        stage: 'done',
        userAId,
        userBId,
        chatId: existing.id,
        created: false,
      });
      return { chatId: existing.id, created: false };
    }

    const chatId = deterministicChatId;
    const chatRef = deterministicChatRef;
    const participantProfiles = await fetchPrivateChatParticipantProfiles(sortedIds);

    stage = 'create_chat_doc';
    await setDoc(chatRef, {
      participants: sortedIds,
      participantProfiles,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageAt: null,
      lastMessageType: null,
      active: true,
      status: 'active',
      acceptedBy: buildParticipantMapValue(sortedIds, true),
      blockedBy: buildParticipantMapValue(sortedIds, false),
      lastSeenMessageId: buildParticipantMapValue(sortedIds, null),
    });

    void syncPrivateInboxEntries({
      chatId,
      participantProfiles,
      conversationState: 'active',
      lastMessagePreview: 'Sin mensajes todavía',
      lastMessageSenderId: null,
      lastMessageType: null,
      resetUnreadForUserIds: sortedIds,
    }).catch(() => {});

    emitPrivateChatDebug('private_chat_created', {
      stage: 'done',
      userAId,
      userBId,
      chatId,
      participants: sortedIds,
      created: true,
    });

    return { chatId, created: true };
  } catch (error) {
    emitPrivateChatDebug('private_chat_get_or_create_failed', {
      stage,
      userAId,
      userBId,
    }, error);
    throw error;
  }
};

export const requestPrivateChatContactShare = async (chatId, requesterId) => {
  let stage = 'validate_input';
  try {
    if (!chatId || !requesterId) {
      throw new Error('Faltan datos para compartir contacto.');
    }

    const authUid = auth?.currentUser?.uid || null;
    if (authUid && authUid !== requesterId) {
      throw new Error('AUTH_USER_MISMATCH');
    }

    const chatRef = doc(db, 'private_chats', chatId);
    stage = 'read_chat_doc';
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('CHAT_NOT_FOUND');
    }

    const chatData = chatSnap.data() || {};
    const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
    if (!participants.includes(requesterId)) {
      throw new Error('USER_NOT_CHAT_PARTICIPANT');
    }
    if (participants.length !== 2) {
      const error = new Error('Compartir contacto solo esta disponible en chats privados entre dos personas.');
      error.code = 'PRIVATE_CONTACT_GROUP_UNSUPPORTED';
      throw error;
    }

    const gate = await evaluatePrivateChatContactGate(chatRef, chatId, chatData, participants);
    if (!gate.unlocked) {
      const error = new Error(getPrivateChatEarlyContactBlockMessage());
      error.code = 'PRIVATE_CONTACT_LOCKED';
      error.contactGate = gate;
      throw error;
    }

    stage = 'read_requester_profile';
    const requesterSnap = await getDoc(doc(db, 'users', requesterId));
    const requesterData = requesterSnap.data() || {};
    const requesterPhone = typeof requesterData.phone === 'string' ? requesterData.phone.trim() : '';
    if (!requesterPhone) {
      const error = new Error('Agrega tu telefono en tu perfil antes de compartirlo.');
      error.code = 'PRIVATE_CONTACT_PHONE_MISSING';
      throw error;
    }

    const recipientId = participants.find((participantId) => participantId !== requesterId) || null;
    if (!recipientId) {
      throw new Error('PRIVATE_CONTACT_RECIPIENT_NOT_FOUND');
    }

    const visibilityState = getPrivateContactVisibilityState(chatData, requesterId, recipientId);
    if (visibilityState.isVisible) {
      return { success: true, alreadyShared: true, recipientId };
    }

    const currentRequest = chatData?.contactShareRequests?.[requesterId] || null;
    if (currentRequest?.status === 'pending' && currentRequest?.recipientId === recipientId) {
      return { success: true, alreadyPending: true, recipientId };
    }

    stage = 'write_request_state';
    await updateDoc(chatRef, {
      [`contactShareRequests.${requesterId}`]: {
        requesterId,
        recipientId,
        contactType: 'phone',
        status: 'pending',
        requestedAt: serverTimestamp(),
        respondedAt: null,
        responderId: null,
      },
      updatedAt: serverTimestamp(),
    });

    const participantProfiles = Array.isArray(chatData?.participantProfiles) && chatData.participantProfiles.length > 0
      ? dedupeParticipantProfiles(chatData.participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const requesterName = requesterData?.username || participantProfiles.find((item) => item.userId === requesterId)?.username || 'Usuario';
    const preview = `${requesterName} quiere compartir su telefono.`;

    stage = 'append_system_message';
    await appendPrivateChatSystemMessage(chatId, preview);
    stage = 'sync_event';
    await syncPrivateChatSystemEvent({
      chatRef,
      chatId,
      participantProfiles,
      preview,
      unreadRecipientIds: [recipientId],
      resetUnreadForUserIds: [requesterId],
    });

    emitPrivateChatDebug('private_chat_contact_share_requested', {
      stage: 'done',
      chatId,
      requesterId,
      recipientId,
    });

    void recordContactSafetyEvent({
      userId: requesterId,
      eventType: 'share_requested',
      surface: 'private_chat',
      chatId,
      metadata: {
        recipientId,
        contactType: 'phone',
      },
    }).catch(() => {});

    return { success: true, recipientId };
  } catch (error) {
    emitPrivateChatDebug('private_chat_contact_share_request_failed', {
      stage,
      chatId,
      requesterId,
    }, error);
    throw error;
  }
};

export const respondToPrivateChatContactShare = async (chatId, responderId, requesterId, accepted) => {
  let stage = 'validate_input';
  try {
    if (!chatId || !responderId || !requesterId) {
      throw new Error('Faltan datos para responder la solicitud de contacto.');
    }

    const authUid = auth?.currentUser?.uid || null;
    if (authUid && authUid !== responderId) {
      throw new Error('AUTH_USER_MISMATCH');
    }

    const chatRef = doc(db, 'private_chats', chatId);
    stage = 'read_chat_doc';
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('CHAT_NOT_FOUND');
    }

    const chatData = chatSnap.data() || {};
    const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
    if (!participants.includes(responderId) || !participants.includes(requesterId)) {
      throw new Error('USER_NOT_CHAT_PARTICIPANT');
    }

    const requestState = chatData?.contactShareRequests?.[requesterId] || null;
    if (!requestState || requestState?.status !== 'pending' || requestState?.recipientId !== responderId) {
      const error = new Error('Esta solicitud de contacto ya no esta disponible.');
      error.code = 'PRIVATE_CONTACT_REQUEST_NOT_PENDING';
      throw error;
    }

    stage = 'write_response_state';
    const patch = {
      [`contactShareRequests.${requesterId}.status`]: accepted ? 'accepted' : 'rejected',
      [`contactShareRequests.${requesterId}.respondedAt`]: serverTimestamp(),
      [`contactShareRequests.${requesterId}.responderId`]: responderId,
      updatedAt: serverTimestamp(),
    };
    if (accepted) {
      patch[`contactShareVisibility.${requesterId}.${responderId}`] = {
        allowed: true,
        grantedAt: serverTimestamp(),
        expiresAtMs: Date.now() + PRIVATE_CHAT_CONTACT_SHARE_TTL_MS,
      };
    }
    await updateDoc(chatRef, patch);

    const participantProfiles = Array.isArray(chatData?.participantProfiles) && chatData.participantProfiles.length > 0
      ? dedupeParticipantProfiles(chatData.participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const responderName = participantProfiles.find((item) => item.userId === responderId)?.username || 'Usuario';
    const preview = accepted
      ? `${responderName} acepto compartir contacto en este chat.`
      : `${responderName} prefirio no recibir contacto todavia.`;

    stage = 'append_system_message';
    await appendPrivateChatSystemMessage(chatId, preview);
    stage = 'sync_event';
    await syncPrivateChatSystemEvent({
      chatRef,
      chatId,
      participantProfiles,
      preview,
      unreadRecipientIds: [requesterId],
      resetUnreadForUserIds: [responderId],
    });

    emitPrivateChatDebug('private_chat_contact_share_responded', {
      stage: 'done',
      chatId,
      requesterId,
      responderId,
      accepted,
    });

    void recordContactSafetyEvent({
      userId: requesterId,
      eventType: accepted ? 'share_accepted' : 'share_rejected',
      surface: 'private_chat',
      chatId,
      metadata: {
        responderId,
        contactType: 'phone',
      },
    }).catch(() => {});

    return { success: true, accepted };
  } catch (error) {
    emitPrivateChatDebug('private_chat_contact_share_response_failed', {
      stage,
      chatId,
      requesterId,
      responderId,
      accepted,
    }, error);
    throw error;
  }
};

export const revokePrivateChatContactShare = async (chatId, ownerId, recipientId) => {
  let stage = 'validate_input';
  try {
    if (!chatId || !ownerId || !recipientId) {
      throw new Error('Faltan datos para revocar el contacto.');
    }

    const authUid = auth?.currentUser?.uid || null;
    if (authUid && authUid !== ownerId) {
      throw new Error('AUTH_USER_MISMATCH');
    }

    const chatRef = doc(db, 'private_chats', chatId);
    stage = 'read_chat_doc';
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('CHAT_NOT_FOUND');
    }

    const chatData = chatSnap.data() || {};
    const participants = Array.isArray(chatData?.participants) ? chatData.participants : [];
    if (!participants.includes(ownerId) || !participants.includes(recipientId)) {
      throw new Error('USER_NOT_CHAT_PARTICIPANT');
    }

    const visibilityState = getPrivateContactVisibilityState(chatData, ownerId, recipientId);
    if (!visibilityState.isVisible && !visibilityState.isExpired) {
      return { success: true, alreadyRevoked: true };
    }

    stage = 'write_revoke_state';
    await updateDoc(chatRef, {
      [`contactShareVisibility.${ownerId}.${recipientId}`]: deleteField(),
      [`contactShareRequests.${ownerId}.status`]: 'revoked',
      [`contactShareRequests.${ownerId}.respondedAt`]: serverTimestamp(),
      [`contactShareRequests.${ownerId}.responderId`]: ownerId,
      updatedAt: serverTimestamp(),
    });

    const participantProfiles = Array.isArray(chatData?.participantProfiles) && chatData.participantProfiles.length > 0
      ? dedupeParticipantProfiles(chatData.participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const ownerName = participantProfiles.find((item) => item.userId === ownerId)?.username || 'Usuario';
    const preview = `${ownerName} revoco el telefono compartido en este chat.`;

    stage = 'append_system_message';
    await appendPrivateChatSystemMessage(chatId, preview);
    stage = 'sync_event';
    await syncPrivateChatSystemEvent({
      chatRef,
      chatId,
      participantProfiles,
      preview,
      unreadRecipientIds: [recipientId],
      resetUnreadForUserIds: [ownerId],
    });

    emitPrivateChatDebug('private_chat_contact_share_revoked', {
      stage: 'done',
      chatId,
      ownerId,
      recipientId,
    });

    void recordContactSafetyEvent({
      userId: ownerId,
      eventType: 'share_revoked',
      surface: 'private_chat',
      chatId,
      metadata: {
        recipientId,
        contactType: 'phone',
      },
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    emitPrivateChatDebug('private_chat_contact_share_revoke_failed', {
      stage,
      chatId,
      ownerId,
      recipientId,
    }, error);
    throw error;
  }
};

/**
 * Envía un mensaje dentro de un chat privado existente
 */
export const sendMessageToPrivateChat = async (chatId, { userId, username, avatar, content }) => {
  let stage = 'validate_input';
  if (!chatId || !userId || !content?.trim()) {
    throw new Error('Missing chatId, userId or content');
  }
  try {
    const authUid = auth?.currentUser?.uid || null;
    if (authUid && authUid !== userId) {
      throw new Error('AUTH_USER_MISMATCH');
    }

    const chatRef = doc(db, 'private_chats', chatId);
    stage = 'read_chat_doc';
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('CHAT_NOT_FOUND');
    }
    const participants = Array.isArray(chatSnap.data()?.participants) ? chatSnap.data().participants : [];
    if (!participants.includes(userId)) {
      throw new Error('USER_NOT_CHAT_PARTICIPANT');
    }
    const participantProfiles = Array.isArray(chatSnap.data()?.participantProfiles) && chatSnap.data()?.participantProfiles?.length > 0
      ? dedupeParticipantProfiles(chatSnap.data().participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const recipientIds = participants.filter((participantId) => participantId !== userId);
    const normalizedContent = content.trim();
    await enforcePrivateChatEarlyContactPolicy({
      chatId,
      chatRef,
      chatData: chatSnap.data() || {},
      participants,
      type: 'text',
      content: normalizedContent,
    });
    const messagesRef = collection(db, 'private_chats', chatId, 'messages');

    stage = 'write_message';
    const messageRef = await addDoc(messagesRef, {
      userId,
      username: username || 'Usuario',
      avatar: avatar || '',
      content: normalizedContent,
      type: 'text',
      status: 'sent',
      deliveredTo: [userId],
      readBy: [userId],
      deliveredAt: serverTimestamp(),
      readAt: serverTimestamp(),
      timestamp: serverTimestamp(),
    });

    stage = 'update_chat_meta';
    try {
      await setDoc(chatRef, {
        lastMessage: normalizedContent,
        lastMessageType: 'text',
        lastMessageSenderId: userId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
        status: 'active',
        lastSeenMessageId: {
          [userId]: messageRef.id,
        },
      }, { merge: true });
    } catch (secondaryError) {
      emitPrivateChatDebug('private_chat_message_meta_update_failed', {
        stage: 'update_chat_meta',
        chatId,
        userId,
        messageId: messageRef.id,
      }, secondaryError);
    }

    stage = 'sync_inbox';
    void syncPrivateInboxEntries({
      chatId,
      participantProfiles,
      title: chatSnap.data()?.title || '',
      conversationState: 'active',
      lastMessagePreview: normalizedContent,
      lastMessageSenderId: userId,
      lastMessageType: 'text',
      unreadRecipientIds: recipientIds,
      resetUnreadForUserIds: [userId],
    }).catch((secondaryError) => {
      emitPrivateChatDebug('private_chat_message_secondary_sync_failed', {
        stage: 'sync_inbox',
        chatId,
        userId,
      }, secondaryError);
    });

    stage = 'notify_recipient';
    void notifyPrivateChatRecipients({
      chatId,
      sender: { userId, username, avatar },
      recipientIds,
      content: normalizedContent,
      type: 'text',
    }).catch((secondaryError) => {
      emitPrivateChatDebug('private_chat_message_secondary_notify_failed', {
        stage: 'notify_recipient',
        chatId,
        userId,
      }, secondaryError);
    });

    emitPrivateChatDebug('private_chat_message_sent', {
      stage: 'done',
      chatId,
      userId,
      participants,
      recipientIds,
      messageType: 'text',
    });
  } catch (error) {
    let participants = [];
    try {
      const fallbackSnap = await getDoc(doc(db, 'private_chats', chatId));
      participants = Array.isArray(fallbackSnap.data()?.participants) ? fallbackSnap.data().participants : [];
    } catch {
      // noop
    }
    emitPrivateChatDebug('private_chat_message_failed', {
      stage,
      chatId,
      userId,
      participants,
      username: username || 'Usuario',
      contentPreview: typeof content === 'string' ? content.trim().slice(0, 80) : '',
    }, error);
    if (error?.code === 'PRIVATE_CONTACT_LOCKED') {
      void recordBlockedContactAttempt({
        userId,
        surface: 'private_chat',
        blockedType: error?.contactDetection?.matchedRules?.[0]?.id || 'external_contact',
        chatId,
        metadata: {
          context: 'send_text_message',
          matchedRules: error?.contactDetection?.matchedRules || [],
        },
      }).catch(() => {});
    }
    throw error;
  }
};

export const sendRichPrivateChatMessage = async (
  chatId,
  {
    userId,
    username,
    avatar,
    content,
    type = 'text',
    media = [],
    senderIsPremium = false,
    replyTo = null,
    clientId = null,
  }
) => {
  let stage = 'validate_input';
  if (!chatId || !userId || !content) {
    throw new Error('Missing chatId, userId or content');
  }
  try {
    const authUid = auth?.currentUser?.uid || null;
    if (authUid && authUid !== userId) {
      throw new Error('AUTH_USER_MISMATCH');
    }

    const chatRef = doc(db, 'private_chats', chatId);
    stage = 'read_chat_doc';
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('CHAT_NOT_FOUND');
    }
    const participants = Array.isArray(chatSnap.data()?.participants) ? chatSnap.data().participants : [];
    if (!participants.includes(userId)) {
      throw new Error('USER_NOT_CHAT_PARTICIPANT');
    }
    const participantProfiles = Array.isArray(chatSnap.data()?.participantProfiles) && chatSnap.data()?.participantProfiles?.length > 0
      ? dedupeParticipantProfiles(chatSnap.data().participantProfiles)
      : await fetchPrivateChatParticipantProfiles(participants);
    const recipientIds = participants.filter((participantId) => participantId !== userId);
    const normalizedContent = typeof content === 'string' ? content.trim() : content;
    if (type === 'text' && !normalizedContent) {
      throw new Error('EMPTY_TEXT_MESSAGE');
    }
    await enforcePrivateChatEarlyContactPolicy({
      chatId,
      chatRef,
      chatData: chatSnap.data() || {},
      participants,
      type,
      content: normalizedContent,
    });

    const messagesRef = collection(db, 'private_chats', chatId, 'messages');
    stage = 'write_message';
    const messageRef = await addDoc(messagesRef, {
      userId,
      username: username || 'Usuario',
      avatar: avatar || '',
      content: normalizedContent,
      ...(clientId ? { clientId } : {}),
      type,
      ...(replyTo && typeof replyTo === 'object' ? { replyTo } : {}),
      ...(Array.isArray(media) && media.length > 0 ? { media } : {}),
      status: 'sent',
      deliveredTo: [userId],
      readBy: [userId],
      deliveredAt: serverTimestamp(),
      readAt: serverTimestamp(),
      timestamp: serverTimestamp(),
    });

    stage = 'update_chat_meta';
    try {
      await setDoc(chatRef, {
        lastMessage: buildPrivateChatMessagePreview({ content: normalizedContent, type }),
        lastMessageType: type,
        lastMessageSenderId: userId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
        status: 'active',
        lastSeenMessageId: {
          [userId]: messageRef.id,
        },
      }, { merge: true });
    } catch (secondaryError) {
      emitPrivateChatDebug('private_chat_rich_message_meta_update_failed', {
        stage: 'update_chat_meta',
        chatId,
        userId,
        messageId: messageRef.id,
        messageType: type,
      }, secondaryError);
    }

    const preview = buildPrivateChatMessagePreview({ content: normalizedContent, type });

    stage = 'sync_inbox';
    void syncPrivateInboxEntries({
      chatId,
      participantProfiles,
      title: chatSnap.data()?.title || '',
      conversationState: 'active',
      lastMessagePreview: preview,
      lastMessageSenderId: userId,
      lastMessageType: type,
      unreadRecipientIds: recipientIds,
      resetUnreadForUserIds: [userId],
    }).catch((secondaryError) => {
      emitPrivateChatDebug('private_chat_rich_message_secondary_sync_failed', {
        stage: 'sync_inbox',
        chatId,
        userId,
        messageType: type,
      }, secondaryError);
    });

    stage = 'notify_recipient';
    void notifyPrivateChatRecipients({
      chatId,
      sender: {
        userId,
        username,
        avatar,
        isPremium: senderIsPremium,
      },
      recipientIds,
      content: normalizedContent,
      type,
    }).catch((secondaryError) => {
      emitPrivateChatDebug('private_chat_rich_message_secondary_notify_failed', {
        stage: 'notify_recipient',
        chatId,
        userId,
        messageType: type,
      }, secondaryError);
    });

    emitPrivateChatDebug('private_chat_rich_message_sent', {
      stage: 'done',
      chatId,
      userId,
      participants,
      recipientIds,
      messageType: type,
      mediaCount: Array.isArray(media) ? media.length : 0,
      preview,
    });

    return {
      id: messageRef.id,
      clientId: clientId || null,
    };
  } catch (error) {
    let participants = [];
    try {
      const fallbackSnap = await getDoc(doc(db, 'private_chats', chatId));
      participants = Array.isArray(fallbackSnap.data()?.participants) ? fallbackSnap.data().participants : [];
    } catch {
      // noop
    }
    emitPrivateChatDebug('private_chat_rich_message_failed', {
      stage,
      chatId,
      userId,
      participants,
      username: username || 'Usuario',
      messageType: type,
      mediaCount: Array.isArray(media) ? media.length : 0,
      contentPreview: typeof content === 'string' ? content.trim().slice(0, 80) : '[non-text]',
    }, error);
    if (error?.code === 'PRIVATE_CONTACT_LOCKED') {
      void recordBlockedContactAttempt({
        userId,
        surface: 'private_chat',
        blockedType: error?.contactDetection?.matchedRules?.[0]?.id || 'external_contact',
        chatId,
        metadata: {
          context: 'send_rich_message',
          messageType: type,
          matchedRules: error?.contactDetection?.matchedRules || [],
        },
      }).catch(() => {});
    }
    throw error;
  }
};

export const respondToPrivateGroupInvite = async (
  userId,
  notificationId,
  accepted
) => {
  try {
    if (!userId || !notificationId) {
      throw new Error('MISSING_PARAMS');
    }

    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    const notificationData = notificationSnap.data();

    if (!notificationData) {
      throw new Error('REQUEST_NOT_FOUND');
    }
    if (notificationData.type !== 'private_group_invite_request') {
      throw new Error('INVALID_REQUEST_TYPE');
    }

    const inviteId = notificationData.inviteId;
    if (!inviteId) {
      throw new Error('MISSING_INVITE_ID');
    }

    const inviteRef = doc(db, PRIVATE_GROUP_INVITES_COLLECTION, inviteId);
    const inviteSnap = await getDoc(inviteRef);
    const inviteData = inviteSnap.data();

    if (!inviteData) {
      await updateDoc(notificationRef, {
        status: 'expired',
        read: true,
        respondedAt: serverTimestamp(),
      }).catch(() => {});
      throw new Error('REQUEST_EXPIRED');
    }

    const expiresAtMs = Number(inviteData.expiresAtMs || notificationData.expiresAtMs || 0);
    if (
      inviteData.status === 'pending' &&
      Number.isFinite(expiresAtMs) &&
      expiresAtMs > 0 &&
      Date.now() > expiresAtMs
    ) {
      await updateDoc(inviteRef, {
        status: 'expired',
        respondedAt: serverTimestamp(),
      }).catch(() => {});
      await updateDoc(notificationRef, {
        status: 'expired',
        read: true,
        respondedAt: serverTimestamp(),
      }).catch(() => {});
      throw new Error('REQUEST_EXPIRED');
    }

    if (inviteData.status && inviteData.status !== 'pending') {
      await updateDoc(notificationRef, {
        status: inviteData.status,
        read: true,
        respondedAt: serverTimestamp(),
      }).catch(() => {});

      if (inviteData.status === 'completed' && inviteData.targetChatId) {
        return {
          success: true,
          chatId: inviteData.targetChatId,
          alreadyProcessed: true,
          participantProfiles: inviteData.participantProfiles || [],
          title: inviteData.title || buildPrivateGroupTitle(inviteData.participantProfiles || [], userId),
        };
      }
      if (inviteData.status === 'expired') throw new Error('REQUEST_EXPIRED');
      if (inviteData.status === 'rejected') throw new Error('REQUEST_REJECTED');
      return { success: true, alreadyProcessed: true };
    }

    if (!(Array.isArray(inviteData.approverUserIds) && inviteData.approverUserIds.includes(userId))) {
      throw new Error('NOT_ALLOWED');
    }

    if (!accepted) {
      await Promise.all([
        updateDoc(notificationRef, {
          status: 'rejected',
          read: true,
          respondedAt: serverTimestamp(),
        }),
        updateDoc(inviteRef, {
          status: 'rejected',
          rejectedBy: userId,
          respondedAt: serverTimestamp(),
        }),
      ]);

      const rejectingUserDoc = await getDoc(doc(db, 'users', userId));
      const rejectingUserData = rejectingUserDoc.data() || {};
      const targetUserIds = [...new Set((inviteData.allParticipantIds || []).filter((id) => id && id !== userId))];

      await Promise.all(
        targetUserIds.map((targetUserId) => addDoc(collection(db, 'users', targetUserId, 'notifications'), {
          from: userId,
          fromUsername: rejectingUserData.username || 'Usuario',
          fromAvatar: rejectingUserData.avatar || '',
          fromIsPremium: rejectingUserData.isPremium || false,
          to: targetUserId,
          type: 'private_group_invite_rejected',
          inviteId,
          requestedUserId: inviteData.requestedUserId || null,
          requestedUsername: notificationData.requestedUsername || null,
          participantProfiles: inviteData.participantProfiles || [],
          read: false,
          timestamp: serverTimestamp(),
        }))
      );

      return { success: true, rejected: true };
    }

    const transactionResult = await runTransaction(db, async (transaction) => {
      const freshInviteSnap = await transaction.get(inviteRef);
      if (!freshInviteSnap.exists()) {
        throw new Error('REQUEST_EXPIRED');
      }

      const freshInvite = freshInviteSnap.data() || {};
      if (freshInvite.status && freshInvite.status !== 'pending') {
        return {
          completed: freshInvite.status === 'completed',
          chatId: freshInvite.targetChatId || null,
          participantProfiles: freshInvite.participantProfiles || [],
          title: freshInvite.title || buildPrivateGroupTitle(freshInvite.participantProfiles || [], userId),
        };
      }

      const approvedBy = Array.isArray(freshInvite.approvedBy) ? [...new Set([...freshInvite.approvedBy, userId])] : [userId];
      const approverUserIds = Array.isArray(freshInvite.approverUserIds) ? freshInvite.approverUserIds : [];
      const everyoneAccepted = approverUserIds.every((approverId) => approvedBy.includes(approverId));

      transaction.update(inviteRef, {
        approvedBy,
        respondedAt: serverTimestamp(),
        ...(everyoneAccepted ? { status: 'completed' } : {}),
      });

      return {
        completed: everyoneAccepted,
        participantProfiles: freshInvite.participantProfiles || [],
        sourceChatId: freshInvite.sourceChatId || null,
      };
    });

    await updateDoc(notificationRef, {
      status: 'accepted',
      read: true,
      respondedAt: serverTimestamp(),
    }).catch(() => {});

    if (!transactionResult.completed) {
      return { success: true, waiting: true };
    }

    const participantProfiles = dedupeParticipantProfiles(transactionResult.participantProfiles || []);
    const groupTitle = buildPrivateGroupTitle(participantProfiles, userId);
    const { chatId } = await getOrCreatePrivateGroupChat(participantProfiles, {
      title: groupTitle,
      sourceChatId: transactionResult.sourceChatId,
    });

    await updateDoc(inviteRef, {
      status: 'completed',
      targetChatId: chatId,
      title: groupTitle,
      completedAt: serverTimestamp(),
    }).catch(() => {});

    await Promise.all(
      participantProfiles.map((participant) => addDoc(collection(db, 'users', participant.userId, 'notifications'), {
        from: userId,
        fromUsername: notificationData.fromUsername || 'Usuario',
        fromAvatar: notificationData.fromAvatar || '',
        fromIsPremium: notificationData.fromIsPremium || false,
        to: participant.userId,
        type: 'private_group_chat_ready',
        inviteId,
        chatId,
        participantProfiles,
        title: groupTitle,
        read: false,
        timestamp: serverTimestamp(),
      }))
    );

    return {
      success: true,
      chatId,
      completed: true,
      participantProfiles,
      title: groupTitle,
    };
  } catch (error) {
    console.error('Error responding to private group invite:', error);
    throw error;
  }
};

/**
 * Envía solicitud de chat privado desde OPIN con anti-spam:
 * - Máximo N invitaciones por hora.
 * - Cooldown por destinatario.
 * - Evita duplicar invitación pendiente al mismo usuario.
 */
export const sendPrivateChatRequestFromOpin = async (
  fromUserId,
  toUserId,
  metadata = {}
) => {
  let stage = 'init';
  try {
    stage = 'validate_auth';
    // En OPIN exigimos UID autenticado para evitar desajustes de permisos en reglas.
    const actorUserId = auth?.currentUser?.uid || null;
    if (!actorUserId) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!toUserId) {
      throw new Error('MISSING_USER_IDS');
    }
    if (actorUserId === toUserId) {
      throw new Error('SELF_REQUEST_NOT_ALLOWED');
    }

    stage = 'read_rate_logs';
    const nowMs = Date.now();
    const hourAgo = new Date(nowMs - OPIN_PRIVATE_REQUEST_WINDOW_MS);
    const recipientCooldownAgoMs = nowMs - OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN_MS;

    // 1) Límite por hora + cooldown por destinatario (logs del emisor)
    const logsRef = collection(db, 'users', actorUserId, PRIVATE_CHAT_REQUEST_LOG_COLLECTION);
    let sentLastHour = 0;
    let recipientCooldownHit = false;

    try {
      const recentLogsSnap = await getDocs(
        query(
          logsRef,
          where('createdAt', '>=', hourAgo),
          limit(100)
        )
      );

      recentLogsSnap.docs.forEach((logDoc) => {
        const data = logDoc.data() || {};
        const createdAtMs = toMillis(data.createdAt);
        if (!createdAtMs) return;
        sentLastHour += 1;
        if (
          String(data.toUserId || '') === String(toUserId) &&
          createdAtMs >= recipientCooldownAgoMs
        ) {
          recipientCooldownHit = true;
        }
      });
    } catch (rateError) {
      if (
        rateError?.code !== 'permission-denied' &&
        rateError?.message !== 'Missing or insufficient permissions.'
      ) {
        throw rateError;
      }
      // Si no hay permisos para leer logs, no bloqueamos el flujo principal.
    }

    if (sentLastHour >= OPIN_PRIVATE_REQUESTS_PER_HOUR) {
      throw new Error('OPIN_PRIVATE_REQUEST_RATE_LIMIT');
    }

    if (recipientCooldownHit) {
      throw new Error('OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN');
    }

    stage = 'check_duplicate_pending';
    // 2) Evitar duplicado pendiente al mismo destinatario (best effort).
    // En algunos entornos las reglas no permiten leer notifications de otro usuario.
    // Si eso pasa, seguimos con cooldown + rate limit sin romper UX.
    try {
      const notificationsRef = collection(db, 'users', toUserId, 'notifications');
      const possibleDuplicatesSnap = await getDocs(
        query(
          notificationsRef,
          where('from', '==', actorUserId),
          limit(30)
        )
      );

      const hasPending = possibleDuplicatesSnap.docs.some((item) => {
        const data = item.data() || {};
        return data.type === 'private_chat_request' && data.status === 'pending';
      });

      if (hasPending) {
        throw new Error('REQUEST_ALREADY_PENDING');
      }
    } catch (error) {
      if (error?.message === 'REQUEST_ALREADY_PENDING') {
        throw error;
      }
      // Ignorar solo denegaciones de permiso en este chequeo opcional.
      if (error?.code !== 'permission-denied' && error?.message !== 'Missing or insufficient permissions.') {
        throw error;
      }
    }

    stage = 'send_private_request';
    // 3) Enviar solicitud estándar
    const result = await sendPrivateChatRequest(actorUserId, toUserId);

    stage = 'write_rate_log';
    // 4) Registrar en logs para anti-spam futuro
    try {
      await addDoc(logsRef, {
        toUserId,
        source: 'opin',
        postId: metadata?.postId || null,
        commentId: metadata?.commentId || null,
        createdAt: serverTimestamp(),
      });
    } catch (logError) {
      // No bloquear invitación por fallo de telemetría/rate-log.
      if (
        logError?.code !== 'permission-denied' &&
        logError?.message !== 'Missing or insufficient permissions.'
      ) {
        throw logError;
      }
    }

    stage = 'done';
    return result;
  } catch (error) {
    console.error('Error sending private chat request from OPIN:', {
      stage,
      code: error?.code || null,
      message: error?.message || String(error),
      actorUid: auth?.currentUser?.uid || null,
      targetUid: toUserId || null,
    });
    throw error;
  }
};

/**
 * Deja un comentario de perfil a otro usuario
 * Se entrega como notificación específica al destinatario
 */
export const sendProfileComment = async (fromUserId, toUserId, content) => {
  try {
    const blocked = await isBlockedBetween(fromUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();

    const commentData = {
      from: fromUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content,
      type: 'profile_comment',
      read: false,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'users', toUserId, 'notifications'), commentData);
    await addDoc(collection(db, 'users', fromUserId, 'sent_messages'), {
      ...commentData,
      read: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending profile comment:', error);
    throw error;
  }
};

/**
 * Actualiza el estado "escribiendo..." en chat privado
 * Se guarda en /private_chats/{chatId}/typing/{userId}
 */
export const updatePrivateChatTypingStatus = async (
  chatId,
  userId,
  isTyping,
  username = 'Usuario'
) => {
  if (!chatId || !userId) return;

  // Usar roomPresence para evitar dependencia de nuevas reglas en private_chats/typing
  const typingRef = doc(db, 'roomPresence', `private_${chatId}`, 'users', userId);

  if (isTyping) {
    await setDoc(
      typingRef,
      {
        userId,
        username,
        isTyping: true,
        typingChatId: chatId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  // Cuando deja de escribir, eliminamos el documento para evitar "ghost typing"
  await deleteDoc(typingRef).catch(() => {});
};

/**
 * Suscribe estados de escritura de otros participantes
 */
export const subscribeToPrivateChatTyping = (chatId, currentUserId, callback) => {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const typingRef = collection(db, 'roomPresence', `private_${chatId}`, 'users');
  const STALE_MS = 10000;

  return onSnapshot(
    typingRef,
    (snapshot) => {
      const now = Date.now();
      const typingUsers = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() || {};
          const updatedAtMs = data.updatedAt?.toMillis?.() || 0;
          return {
            id: docSnap.id,
            userId: data.userId || docSnap.id,
            username: data.username || 'Usuario',
            isTyping: data.isTyping === true,
            updatedAtMs,
          };
        })
        .filter((item) => item.userId !== currentUserId)
        .filter((item) => item.isTyping)
        .filter((item) => !item.updatedAtMs || now - item.updatedAtMs <= STALE_MS);

      callback(typingUsers);
    },
    (error) => {
      const isTransientError =
        error?.name === 'AbortError' ||
        error?.code === 'cancelled' ||
        error?.code === 'unavailable' ||
        error?.message?.includes('WebChannelConnection') ||
        error?.message?.includes('transport errored');

      if (!isTransientError) {
        console.error('Error subscribing to private chat typing:', error);
      }
      callback([]);
    }
  );
};

/**
 * Responde a una solicitud de chat privado
 */
export const respondToPrivateChatRequest = async (
  userId,
  notificationId,
  accepted
) => {
  let stage = 'validate_input';
  const startedAt = Date.now();
  try {
    if (!userId || !notificationId) {
      throw new Error('MISSING_PARAMS');
    }

    stage = 'read_notification';
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    const notificationDoc = await getDoc(notificationRef);
    const notificationData = notificationDoc.data();

    if (!notificationData) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (notificationData.type !== 'private_chat_request') {
      throw new Error('INVALID_REQUEST_TYPE');
    }

    // Idempotencia: si ya fue procesada, devolver estado sin romper UX
    if (notificationData.status && notificationData.status !== 'pending') {
      if (notificationData.status === 'accepted' && notificationData.from) {
        // userId primero para que la query sea compatible con reglas Firestore
        const { chatId } = await getOrCreatePrivateChat(userId, notificationData.from);
        return { success: true, chatId, alreadyProcessed: true };
      }
      return { success: true, alreadyProcessed: true };
    }

    if (!accepted) {
      stage = 'reject_request';
      await updateDoc(notificationRef, {
        status: 'rejected',
        read: true,
        respondedAt: serverTimestamp(),
      });

      // Notificar al emisor original que su invitación fue rechazada.
      // Esto permite encadenar un nuevo intento (ej. "conectar al azar").
      try {
        const rejectedUserDoc = await getDoc(doc(db, 'users', userId));
        const rejectedUserData = rejectedUserDoc.data();

        await addDoc(collection(db, 'users', notificationData.from, 'notifications'), {
          from: userId,
          fromUsername: rejectedUserData?.username || 'Usuario',
          fromAvatar: rejectedUserData?.avatar || '',
          fromIsPremium: rejectedUserData?.isPremium || false,
          to: notificationData.from,
          type: 'private_chat_rejected',
          source: notificationData.source || 'manual',
          requestId: notificationId,
          read: false,
          timestamp: serverTimestamp(),
        });
      } catch (notifyError) {
        console.error('Error notifying sender about private chat rejection:', notifyError);
      }

      return { success: true };
    }

    // Si fue aceptada, crear la sala de chat privado
    stage = 'check_block';
    const blocked = await isBlockedBetween(notificationData.from, userId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // ✅ IMPORTANTE: Reutilizar SIEMPRE el mismo chat entre ambos usuarios
    // para mantener historial (evita crear un chat nuevo por cada invitación).
    // userId primero para que la query sea compatible con reglas Firestore
    stage = 'get_or_create_chat';
    const { chatId } = await getOrCreatePrivateChat(userId, notificationData.from);
    stage = 'ensure_metadata';
    void ensurePrivateChatCompatibilityMetadata(
      doc(db, 'private_chats', chatId),
      [userId, notificationData.from],
      {
        status: 'active',
        active: true,
        acceptedBy: {
          [userId]: true,
          [notificationData.from]: true,
        },
      }
    ).catch((secondaryError) => {
      emitPrivateChatDebug('private_chat_accept_meta_update_failed', {
        stage: 'ensure_metadata',
        userId,
        notificationId,
        chatId,
      }, secondaryError);
    });

    // Marcar la solicitud como aceptada solo después de crear/activar el chat
    stage = 'mark_notification_accepted';
    await updateDoc(notificationRef, {
      status: 'accepted',
      read: true,
      respondedAt: serverTimestamp(),
      chatId,
    });

    void (async () => {
      try {
        const participantProfiles = await fetchPrivateChatParticipantProfiles([userId, notificationData.from]);
        await syncPrivateInboxEntries({
          chatId,
          participantProfiles,
          conversationState: 'active',
          lastMessagePreview: 'Conversación lista para continuar',
          resetUnreadForUserIds: [userId, notificationData.from],
        }).catch(() => {});

        const acceptedUserDoc = await getDoc(doc(db, 'users', userId));
        const acceptedUserData = acceptedUserDoc.data();

        await addDoc(collection(db, 'users', notificationData.from, 'notifications'), {
          from: userId,
          fromUsername: acceptedUserData?.username || 'Usuario',
          fromAvatar: acceptedUserData?.avatar || '',
          fromIsPremium: acceptedUserData?.isPremium || false,
          to: notificationData.from,
          type: 'private_chat_accepted',
          chatId,
          read: false,
          timestamp: serverTimestamp(),
        });
      } catch (notifyError) {
        console.error('Error notifying sender about private chat acceptance:', notifyError);
      }
    })();

    emitPrivateChatDebug('private_chat_request_accepted', {
      stage: 'done',
      userId,
      notificationId,
      chatId,
      elapsedMs: Date.now() - startedAt,
    });

    return { success: true, chatId };
  } catch (error) {
    emitPrivateChatDebug('private_chat_request_response_failed', {
      stage,
      userId,
      notificationId,
      accepted,
      elapsedMs: Date.now() - startedAt,
    }, error);
    console.error('Error responding to private chat request:', { stage, error });
    throw error;
  }
};

/**
 * Agrega un usuario a favoritos (máximo 15)
 */
export const addToFavorites = async (userId, targetUserId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentFavorites = userDoc.data()?.favorites || [];

    if (currentFavorites.length >= 15) {
      throw new Error('FAVORITES_LIMIT_REACHED');
    }

    await updateDoc(userRef, {
      favorites: arrayUnion(targetUserId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Elimina un usuario de favoritos
 */
export const removeFromFavorites = async (userId, targetUserId) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      favorites: arrayRemove(targetUserId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Suscribe a las notificaciones del usuario en tiempo real
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!userId || typeof callback !== 'function') {
    callback?.([]);
    return () => {};
  }

  let sharedEntry = sharedNotificationsListeners.get(userId);

  if (!sharedEntry) {
    sharedEntry = {
      callbacks: new Set(),
      notifications: [],
      unsubscribe: null,
      listenerToken: null,
    };

    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    sharedEntry.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        sharedEntry.notifications = mapNotificationsFromSnapshot(snapshot);
        notifyNotificationSubscribers(sharedEntry, sharedEntry.notifications);
      },
      (error) => {
        // ✅ Ignorar errores transitorios de Firestore WebChannel (errores 400 internos)
        const isTransientError =
          error.name === 'AbortError' ||
          error.code === 'cancelled' ||
          error.code === 'unavailable' ||
          error.message?.includes('WebChannelConnection') ||
          error.message?.includes('transport errored') ||
          error.message?.includes('RPC') ||
          error.message?.includes('stream') ||
          error.message?.includes('INTERNAL ASSERTION FAILED') ||
          error.message?.includes('Unexpected state');

        if (!isTransientError) {
          console.error('Error subscribing to notifications:', error);
        }
        // Mantener último estado conocido; Firestore se reconecta automáticamente.
      }
    );

    sharedEntry.listenerToken = trackListenerStart({
      module: 'social',
      type: 'user_notifications_shared',
      key: `users/${userId}/notifications`,
      shared: true,
    });

    sharedNotificationsListeners.set(userId, sharedEntry);
  }

  sharedEntry.callbacks.add(callback);
  callback(sharedEntry.notifications);

  return () => {
    const entry = sharedNotificationsListeners.get(userId);
    if (!entry) return;

    entry.callbacks.delete(callback);
    if (entry.callbacks.size > 0) return;

    try {
      entry.unsubscribe?.();
    } catch {
      // noop
    }
    trackListenerStop(entry.listenerToken);
    sharedNotificationsListeners.delete(userId);
  };
};

export const subscribeToPrivateInbox = (userId, callback) => {
  if (!userId || typeof callback !== 'function') {
    callback?.([]);
    return () => {};
  }

  const inboxRef = collection(db, 'users', userId, 'private_inbox');
  return onSnapshot(
    inboxRef,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) => {
          const aMs = toMillis(a?.lastMessageAt || a?.updatedAt || 0);
          const bMs = toMillis(b?.lastMessageAt || b?.updatedAt || 0);
          return bMs - aMs;
        });

      callback(items);
    },
    (error) => {
      console.error('Error subscribing to private inbox:', error);
      callback([]);
    }
  );
};

export const subscribeToPrivateMatchState = (userId, callback) => {
  if (!userId || typeof callback !== 'function') {
    callback?.([]);
    return () => {};
  }

  const stateRef = collection(db, 'users', userId, 'private_match_state');
  return onSnapshot(
    stateRef,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) => {
          const aMs = Number(a?.updatedAtMs || 0);
          const bMs = Number(b?.updatedAtMs || 0);
          return bMs - aMs;
        });

      callback(items);
    },
    (error) => {
      console.error('Error subscribing to private match state:', error);
      callback([]);
    }
  );
};

export const upsertPrivateMatchState = async (userId, targetUserId, patch = {}) => {
  if (!userId || !targetUserId) return;

  await setDoc(
    doc(db, 'users', userId, 'private_match_state', targetUserId),
    {
      targetUserId,
      updatedAt: serverTimestamp(),
      updatedAtMs: Date.now(),
      ...patch,
    },
    { merge: true }
  );
};

export const markPrivateInboxConversationRead = async (userId, conversationId) => {
  if (!userId || !conversationId) return;

  await setDoc(
    doc(db, 'users', userId, 'private_inbox', conversationId),
    {
      conversationId,
      chatId: conversationId,
      unreadCount: 0,
      isOpen: true,
      isMinimized: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Marca una notificación como leída
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);

    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Obtiene la lista de favoritos del usuario con sus datos
 */
export const getFavorites = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const favoriteIds = userDoc.data()?.favorites || [];

    if (favoriteIds.length === 0) {
      return [];
    }

    // Obtener datos de cada favorito
    const favoritesData = await Promise.all(
      favoriteIds.map(async (favId) => {
        const favDoc = await getDoc(doc(db, 'users', favId));
        return {
          id: favId,
          ...favDoc.data(),
        };
      })
    );

    return favoritesData;
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
};
