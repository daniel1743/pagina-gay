import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
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
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { isBlockedBetween } from '@/services/blockService';
import { trackListenerStart, trackListenerStop } from '@/utils/listenerMonitor';

const OPIN_PRIVATE_REQUESTS_PER_HOUR = 4;
const OPIN_PRIVATE_REQUEST_WINDOW_MS = 60 * 60 * 1000;
const OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN_MS = 15 * 60 * 1000;
const PRIVATE_CHAT_REQUEST_LOG_COLLECTION = 'private_chat_request_logs';
const PRIVATE_GROUP_MAX_PARTICIPANTS = 4;
const PRIVATE_GROUP_INVITES_COLLECTION = 'private_chat_group_invites';
const PRIVATE_GROUP_INVITE_EXPIRY_MS = 2 * 60 * 1000;
const sharedNotificationsListeners = new Map();

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
    return { chatId, created: false };
  }

  await setDoc(chatRef, {
    participants: participantIds.slice().sort(),
    participantProfiles: normalizedProfiles,
    createdAt: serverTimestamp(),
    lastMessage: null,
    active: true,
    isGroup: true,
    title: options?.title || buildPrivateGroupTitle(normalizedProfiles),
    sourceChatId: options?.sourceChatId || null,
  });

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
  try {
    const senderUserId = auth?.currentUser?.uid || fromUserId;
    if (!senderUserId || !toUserId) {
      throw new Error('MISSING_USER_IDS');
    }
    if (senderUserId === toUserId) {
      throw new Error('SELF_REQUEST_NOT_ALLOWED');
    }

    const blocked = await isBlockedBetween(senderUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // Obtener datos del remitente
    const fromUserDoc = await getDoc(doc(db, 'users', senderUserId));
    const fromUserData = fromUserDoc.data();

    const expiresAtMs = Number(options?.expiresAtMs);
    const safeExpiresAtMs = Number.isFinite(expiresAtMs) && expiresAtMs > Date.now()
      ? Math.floor(expiresAtMs)
      : null;
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
      ...(safeExpiresAtMs ? { expiresAtMs: safeExpiresAtMs } : {}),
    };

    // Guardar en notificaciones del destinatario
    const notificationRef = await addDoc(
      collection(db, 'users', toUserId, 'notifications'),
      requestData
    );

    return { success: true, requestId: notificationRef.id };
  } catch (error) {
    console.error('Error sending private chat request:', error);
    throw error;
  }
};

/**
 * Crear u obtener chat privado directo entre dos usuarios
 * Sin solicitud previa (flujo rápido desde Baúl)
 */
export const getOrCreatePrivateChat = async (userAId, userBId) => {
  if (!userAId || !userBId) {
    throw new Error('Missing user ids');
  }
  if (userAId === userBId) {
    throw new Error('Cannot create chat with self');
  }
  const blocked = await isBlockedBetween(userAId, userBId);
  if (blocked) {
    throw new Error('BLOCKED');
  }

  const chatsRef = collection(db, 'private_chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userAId),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find((docSnap) => {
    const data = docSnap.data();
    return Array.isArray(data.participants) && data.participants.includes(userBId);
  });

  if (existing) {
    return { chatId: existing.id, created: false };
  }

  const sortedIds = [userAId, userBId].sort();
  const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
  const chatRef = doc(chatsRef, chatId);

  await setDoc(chatRef, {
    participants: sortedIds,
    createdAt: serverTimestamp(),
    lastMessage: null,
    active: true,
  });

  return { chatId, created: true };
};

/**
 * Envía un mensaje dentro de un chat privado existente
 */
export const sendMessageToPrivateChat = async (chatId, { userId, username, avatar, content }) => {
  if (!chatId || !userId || !content?.trim()) {
    throw new Error('Missing chatId, userId or content');
  }
  const messagesRef = collection(db, 'private_chats', chatId, 'messages');
  await addDoc(messagesRef, {
    userId,
    username: username || 'Usuario',
    avatar: avatar || '',
    content: content.trim(),
    type: 'text',
    timestamp: serverTimestamp(),
  });
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
  try {
    if (!userId || !notificationId) {
      throw new Error('MISSING_PARAMS');
    }

    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    const notificationDoc = await getDoc(notificationRef);
    const notificationData = notificationDoc.data();

    if (!notificationData) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    if (notificationData.type !== 'private_chat_request') {
      throw new Error('INVALID_REQUEST_TYPE');
    }

    const expiresAtMs = Number(notificationData.expiresAtMs || 0);
    if (
      notificationData.status === 'pending' &&
      Number.isFinite(expiresAtMs) &&
      expiresAtMs > 0 &&
      Date.now() > expiresAtMs
    ) {
      await updateDoc(notificationRef, {
        status: 'expired',
        read: true,
        respondedAt: serverTimestamp(),
      });
      throw new Error('REQUEST_EXPIRED');
    }

    // Idempotencia: si ya fue procesada, devolver estado sin romper UX
    if (notificationData.status && notificationData.status !== 'pending') {
      if (notificationData.status === 'accepted' && notificationData.from) {
        // userId primero para que la query sea compatible con reglas Firestore
        const { chatId } = await getOrCreatePrivateChat(userId, notificationData.from);
        return { success: true, chatId, alreadyProcessed: true };
      }
      if (notificationData.status === 'expired') {
        throw new Error('REQUEST_EXPIRED');
      }
      return { success: true, alreadyProcessed: true };
    }

    if (!accepted) {
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
    const blocked = await isBlockedBetween(notificationData.from, userId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // ✅ IMPORTANTE: Reutilizar SIEMPRE el mismo chat entre ambos usuarios
    // para mantener historial (evita crear un chat nuevo por cada invitación).
    // userId primero para que la query sea compatible con reglas Firestore
    const { chatId } = await getOrCreatePrivateChat(userId, notificationData.from);

    // Marcar la solicitud como aceptada solo después de crear/activar el chat
    await updateDoc(notificationRef, {
      status: 'accepted',
      read: true,
      respondedAt: serverTimestamp(),
      chatId,
    });

    // Obtener datos del usuario que aceptó
    const acceptedUserDoc = await getDoc(doc(db, 'users', userId));
    const acceptedUserData = acceptedUserDoc.data();

    // Enviar notificación al usuario que envió la solicitud original
    // para que se le abra automáticamente la ventana de chat
    try {
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
      // El chat ya quedó abierto para el receptor; no bloquear por fallo secundario.
      console.error('Error notifying sender about private chat acceptance:', notifyError);
    }

    return { success: true, chatId };
  } catch (error) {
    console.error('Error responding to private chat request:', error);
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
