import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const TOP_PARTICIPANTS_COLLECTION = 'featured_participants';
const AUTO_TOP_LIMIT = 6;
const REALTIME_USERS_LIMIT = 60;
const FALLBACK_MESSAGES_LIMIT = 120;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeParticipant = (docSnap) => {
  const data = docSnap.data() || {};
  const pinnedRankRaw = data.pinnedRank;
  const pinnedRank = [1, 2, 3].includes(Number(pinnedRankRaw)) ? Number(pinnedRankRaw) : null;

  return {
    id: docSnap.id,
    userId: data.userId || docSnap.id,
    username: data.username || 'Usuario',
    avatar: data.avatar || '',
    isActive: Boolean(data.isActive ?? true),
    sortOrder: toNumber(data.sortOrder, 9999),
    pinnedRank,
    blurEnabled: typeof data.blurEnabled === 'boolean' ? data.blurEnabled : null,
    messagesCount: toNumber(data.messagesCount, 0),
    threadsCount: toNumber(data.threadsCount, 0),
    repliesCount: toNumber(data.repliesCount, 0),
    totalActiveTime: toNumber(data.totalActiveTime, 0),
    activityScore: toNumber(data.activityScore, 0),
    source: data.source || 'manual',
    updatedAt: data.updatedAt || null,
  };
};

const sortForDisplay = (participants) => {
  const active = participants.filter((item) => item.isActive);

  const pinned = active
    .filter((item) => [1, 2, 3].includes(item.pinnedRank))
    .sort((a, b) => a.pinnedRank - b.pinnedRank);

  const pinnedUserIds = new Set(pinned.map((item) => item.userId));

  const rest = active
    .filter((item) => !pinnedUserIds.has(item.userId))
    .sort((a, b) => {
      if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
      if (b.messagesCount !== a.messagesCount) return b.messagesCount - a.messagesCount;
      return a.sortOrder - b.sortOrder;
    });

  return [...pinned, ...rest].map((item, index) => {
    const rank = index + 1;
    const fallbackBlur = rank > 3;
    return {
      ...item,
      displayRank: rank,
      effectiveBlur: typeof item.blurEnabled === 'boolean' ? item.blurEnabled : fallbackBlur,
    };
  });
};

const toTimestampMs = (timestamp) => {
  if (!timestamp) return Date.now();
  if (typeof timestamp?.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp?.seconds === 'number') return timestamp.seconds * 1000;
  const parsed = new Date(timestamp).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const isAutomatedOrSystemUserId = (userId = '') => {
  if (!userId) return true;
  return (
    userId === 'system' ||
    userId.startsWith('system_') ||
    userId.startsWith('bot_') ||
    userId.startsWith('ai_') ||
    userId.startsWith('seed_user_') ||
    userId.startsWith('static_bot_')
  );
};

const buildHistoricalTopFromUsersSnapshot = (snapshot) => {
  const candidates = [];

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const roleValue = String(data.role || '').toLowerCase();
    if (data.isGuest || data.isAnonymous) return;
    if (['admin', 'administrator', 'superadmin', 'support'].includes(roleValue)) return;

    const messagesCount = toNumber(
      data.messageCount ??
      data.messagesCount ??
      data.metrics?.messageCount ??
      data.metrics?.messagesCount,
      0
    );

    if (messagesCount <= 0) return;

    const threadsCount = toNumber(
      data.threadCount ??
      data.threadsCount ??
      data.metrics?.threadCount ??
      data.metrics?.threadsCount,
      0
    );
    const repliesCount = toNumber(
      data.replyCount ??
      data.repliesCount ??
      data.metrics?.replyCount ??
      data.metrics?.repliesCount,
      0
    );
    const totalActiveTime = toNumber(
      data.totalActiveTime ??
      data.totalActiveTimeSeconds ??
      data.metrics?.totalActiveTime ??
      data.metrics?.totalActiveTimeSeconds,
      0
    );

    const lastMessageAtMs = toTimestampMs(
      data.lastMessageAt ??
      data.metrics?.lastMessageAt ??
      data.updatedAt
    );

    const activityScore = Math.round(
      messagesCount * 1 +
      threadsCount * 3 +
      repliesCount * 2 +
      (totalActiveTime / 3600) * 0.5
    );

    candidates.push({
      id: docSnap.id,
      userId: docSnap.id,
      username: data.username || 'Usuario',
      avatar: data.avatar || '',
      isActive: true,
      sortOrder: 9999,
      pinnedRank: null,
      blurEnabled: null,
      messagesCount,
      threadsCount,
      repliesCount,
      totalActiveTime: Math.floor(totalActiveTime / 60),
      activityScore,
      source: 'historical_users',
      updatedAt: data.updatedAt || null,
      lastMessageAtMs,
    });
  });

  return candidates
    .sort((a, b) => {
      if (b.messagesCount !== a.messagesCount) return b.messagesCount - a.messagesCount;
      if (b.activityScore !== a.activityScore) return b.activityScore - a.activityScore;
      if (b.lastMessageAtMs !== a.lastMessageAtMs) return b.lastMessageAtMs - a.lastMessageAtMs;
      return String(a.username || '').localeCompare(String(b.username || ''), 'es');
    })
    .map((item, index) => {
      const rank = index + 1;
      return {
        ...item,
        displayRank: rank,
        effectiveBlur: rank > 3,
      };
    })
    .slice(0, AUTO_TOP_LIMIT);
};

const buildTopFromPublicMessagesSnapshot = (snapshot) => {
  const byUserId = new Map();

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const userId = String(data.userId || '').trim();

    if (!userId || isAutomatedOrSystemUserId(userId)) return;

    const timestampMs = toTimestampMs(data.timestamp || data.updatedAt || data.createdAt);
    const username = data.username || 'Usuario';
    const avatar = data.avatar || '';

    const existing = byUserId.get(userId);
    if (!existing) {
      byUserId.set(userId, {
        id: userId,
        userId,
        username,
        avatar,
        isActive: true,
        sortOrder: 9999,
        pinnedRank: null,
        blurEnabled: null,
        messagesCount: 1,
        threadsCount: 0,
        repliesCount: 0,
        totalActiveTime: 0,
        activityScore: 1,
        source: 'public_messages_fallback',
        updatedAt: data.timestamp || data.updatedAt || null,
        lastMessageAtMs: timestampMs,
      });
      return;
    }

    existing.messagesCount += 1;
    existing.activityScore = existing.messagesCount;

    if (timestampMs >= existing.lastMessageAtMs) {
      existing.lastMessageAtMs = timestampMs;
      existing.username = username || existing.username;
      existing.avatar = avatar || existing.avatar;
      existing.updatedAt = data.timestamp || data.updatedAt || existing.updatedAt;
    }
  });

  return Array.from(byUserId.values())
    .sort((a, b) => {
      if (b.messagesCount !== a.messagesCount) return b.messagesCount - a.messagesCount;
      if (b.lastMessageAtMs !== a.lastMessageAtMs) return b.lastMessageAtMs - a.lastMessageAtMs;
      return String(a.username || '').localeCompare(String(b.username || ''), 'es');
    })
    .map((item, index) => {
      const rank = index + 1;
      return {
        ...item,
        displayRank: rank,
        effectiveBlur: rank > 3,
      };
    })
    .slice(0, AUTO_TOP_LIMIT);
};

const buildFallbackFromUsers = async () => {
  const usersRef = collection(db, 'users');
  const usersQuery = query(usersRef, orderBy('messageCount', 'desc'), limit(30));
  const snapshot = await getDocs(usersQuery);

  const rows = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() || {};
    if (data.isGuest || data.isAnonymous || data.role === 'admin' || data.role === 'administrator') {
      return;
    }

    const metrics = data.metrics || {};
    const messagesCount = toNumber(data.messageCount ?? data.messagesCount ?? metrics.messageCount ?? metrics.messagesCount, 0);
    const threadsCount = toNumber(data.threadCount ?? data.threadsCount ?? metrics.threadCount ?? metrics.threadsCount, 0);
    const repliesCount = toNumber(data.replyCount ?? data.repliesCount ?? metrics.replyCount ?? metrics.repliesCount, 0);
    const totalActiveTime = toNumber(
      data.totalActiveTime ?? data.totalActiveTimeSeconds ?? metrics.totalActiveTime ?? metrics.totalActiveTimeSeconds,
      0
    );

    const activityScore = Math.round(
      messagesCount * 1 +
      threadsCount * 3 +
      repliesCount * 2 +
      (totalActiveTime / 3600) * 0.5
    );

    rows.push({
      id: docSnap.id,
      userId: docSnap.id,
      username: data.username || 'Usuario',
      avatar: data.avatar || '',
      isActive: true,
      sortOrder: 9999,
      pinnedRank: null,
      blurEnabled: null,
      messagesCount,
      threadsCount,
      repliesCount,
      totalActiveTime: Math.floor(totalActiveTime / 60),
      activityScore,
      source: 'auto_fallback',
      updatedAt: null,
    });
  });

  return sortForDisplay(rows).slice(0, 8);
};

export const subscribeTopParticipantsPublic = (onUpdate, onError) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeTopParticipantsPublic requiere callback.');
  }

  const participantsRef = collection(db, TOP_PARTICIPANTS_COLLECTION);
  const participantsQuery = query(participantsRef, orderBy('sortOrder', 'asc'));

  return onSnapshot(
    participantsQuery,
    async (snapshot) => {
      const participants = snapshot.docs.map(normalizeParticipant);
      const ranked = sortForDisplay(participants);
      if (ranked.length > 0) {
        onUpdate(ranked);
        return;
      }

      try {
        const fallback = await buildFallbackFromUsers();
        onUpdate(fallback);
      } catch (fallbackError) {
        console.warn('[TOP_PARTICIPANTS] Fallback automatico no disponible:', fallbackError);
        onUpdate([]);
      }
    },
    (error) => {
      console.error('[TOP_PARTICIPANTS] Error suscripcion publica:', error);
      onUpdate([]);
      if (typeof onError === 'function') onError(error);
    }
  );
};

export const subscribeRealtimeTopParticipants = (
  roomId = 'principal',
  onUpdate,
  onError,
  options = {}
) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeRealtimeTopParticipants requiere callback.');
  }

  const fallbackRoomId = options?.isSecondaryRoom ? 'principal' : roomId || 'principal';
  let usersUnsubscribe = null;
  let publicUnsubscribe = null;
  let messagesUnsubscribe = null;

  const stopFallbackSubscriptions = () => {
    if (publicUnsubscribe) {
      publicUnsubscribe();
      publicUnsubscribe = null;
    }
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
      messagesUnsubscribe = null;
    }
  };

  const startMessagesFallback = () => {
    if (messagesUnsubscribe) return;

    const roomMessagesRef = collection(db, 'rooms', fallbackRoomId, 'messages');
    const roomMessagesQuery = query(
      roomMessagesRef,
      orderBy('timestamp', 'desc'),
      limit(FALLBACK_MESSAGES_LIMIT)
    );

    messagesUnsubscribe = onSnapshot(
      roomMessagesQuery,
      (snapshot) => {
        const ranking = buildTopFromPublicMessagesSnapshot(snapshot);
        onUpdate(ranking);
      },
      (messagesError) => {
        console.error('[TOP_PARTICIPANTS] Error fallback mensajes:', messagesError);
        if (typeof onError === 'function') onError(messagesError);
      }
    );
  };

  const startFallbackSubscriptions = () => {
    if (publicUnsubscribe || messagesUnsubscribe) return;

    publicUnsubscribe = subscribeTopParticipantsPublic(
      (items) => {
        if (Array.isArray(items) && items.length > 0) {
          onUpdate(items.slice(0, AUTO_TOP_LIMIT));
          return;
        }
        startMessagesFallback();
      },
      (publicError) => {
        console.warn('[TOP_PARTICIPANTS] Fallback publico no disponible:', publicError);
        startMessagesFallback();
      }
    );
  };

  const usersRef = collection(db, 'users');
  const usersQuery = query(
    usersRef,
    orderBy('messageCount', 'desc'),
    limit(REALTIME_USERS_LIMIT)
  );

  usersUnsubscribe = onSnapshot(
    usersQuery,
    (snapshot) => {
      const ranking = buildHistoricalTopFromUsersSnapshot(snapshot);
      if (ranking.length > 0) {
        stopFallbackSubscriptions();
        onUpdate(ranking);
        return;
      }

      startFallbackSubscriptions();
    },
    (error) => {
      console.error('[TOP_PARTICIPANTS] Error ranking realtime:', error);
      startFallbackSubscriptions();
      if (typeof onError === 'function') onError(error);
    }
  );

  return () => {
    usersUnsubscribe?.();
    stopFallbackSubscriptions();
  };
};

export const subscribeTopParticipantsAdmin = (onUpdate, onError) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeTopParticipantsAdmin requiere callback.');
  }

  const participantsRef = collection(db, TOP_PARTICIPANTS_COLLECTION);
  const participantsQuery = query(participantsRef, orderBy('sortOrder', 'asc'));

  return onSnapshot(
    participantsQuery,
    (snapshot) => {
      const participants = snapshot.docs
        .map(normalizeParticipant)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onUpdate(participants);
    },
    (error) => {
      console.error('[TOP_PARTICIPANTS] Error suscripcion admin:', error);
      if (typeof onError === 'function') onError(error);
    }
  );
};

export const upsertTopParticipant = async (participantInput) => {
  if (!participantInput?.userId) {
    throw new Error('userId es requerido');
  }

  const userId = participantInput.userId;
  const participantRef = doc(db, TOP_PARTICIPANTS_COLLECTION, userId);

  await setDoc(
    participantRef,
    {
      userId,
      username: participantInput.username || 'Usuario',
      avatar: participantInput.avatar || '',
      isActive: Boolean(participantInput.isActive ?? true),
      sortOrder: toNumber(participantInput.sortOrder, 9999),
      pinnedRank: [1, 2, 3].includes(Number(participantInput.pinnedRank))
        ? Number(participantInput.pinnedRank)
        : null,
      blurEnabled:
        typeof participantInput.blurEnabled === 'boolean'
          ? participantInput.blurEnabled
          : null,
      messagesCount: toNumber(participantInput.messagesCount, 0),
      threadsCount: toNumber(participantInput.threadsCount, 0),
      repliesCount: toNumber(participantInput.repliesCount, 0),
      totalActiveTime: toNumber(participantInput.totalActiveTime, 0),
      activityScore: toNumber(participantInput.activityScore, 0),
      source: participantInput.source || 'manual',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const updateTopParticipant = async (userId, updates = {}) => {
  if (!userId) throw new Error('userId invalido');
  const participantRef = doc(db, TOP_PARTICIPANTS_COLLECTION, userId);

  await updateDoc(participantRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const removeTopParticipant = async (userId) => {
  if (!userId) throw new Error('userId invalido');
  await deleteDoc(doc(db, TOP_PARTICIPANTS_COLLECTION, userId));
};

export const setParticipantPinnedRank = async (userId, pinnedRank) => {
  if (!userId) throw new Error('userId invalido');
  if (pinnedRank !== null && ![1, 2, 3].includes(Number(pinnedRank))) {
    throw new Error('pinnedRank invalido');
  }

  const participantsRef = collection(db, TOP_PARTICIPANTS_COLLECTION);
  const snapshot = await getDocs(query(participantsRef, orderBy('sortOrder', 'asc')));
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = normalizeParticipant(docSnap);
    const ref = doc(db, TOP_PARTICIPANTS_COLLECTION, docSnap.id);

    if (docSnap.id === userId) {
      batch.update(ref, {
        pinnedRank: pinnedRank === null ? null : Number(pinnedRank),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    if (pinnedRank !== null && data.pinnedRank === Number(pinnedRank)) {
      batch.update(ref, {
        pinnedRank: null,
        updatedAt: serverTimestamp(),
      });
    }
  });

  await batch.commit();
};

export const reorderTopParticipants = async (orderedUserIds = []) => {
  if (!Array.isArray(orderedUserIds) || orderedUserIds.length === 0) return;

  const batch = writeBatch(db);
  orderedUserIds.forEach((userId, index) => {
    const ref = doc(db, TOP_PARTICIPANTS_COLLECTION, userId);
    batch.update(ref, {
      sortOrder: index + 1,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
};

export const syncTopParticipantsFromActivity = async (topUsers = []) => {
  if (!Array.isArray(topUsers) || topUsers.length === 0) return;

  const participantsRef = collection(db, TOP_PARTICIPANTS_COLLECTION);
  const existingSnapshot = await getDocs(query(participantsRef, orderBy('sortOrder', 'asc')));
  const existingMap = new Map(
    existingSnapshot.docs.map((docSnap) => [docSnap.id, normalizeParticipant(docSnap)])
  );

  const batch = writeBatch(db);

  topUsers.forEach((topUser, index) => {
    const userId = topUser.id;
    if (!userId) return;
    const existing = existingMap.get(userId);
    const defaultPinnedRank = index < 3 ? index + 1 : null;
    const defaultBlur = index >= 3;

    const payload = {
      userId,
      username: topUser.username || existing?.username || 'Usuario',
      avatar: topUser.avatar || existing?.avatar || '',
      isActive: existing?.isActive ?? true,
      sortOrder: existing?.sortOrder ?? index + 1,
      pinnedRank: existing?.pinnedRank ?? defaultPinnedRank,
      blurEnabled:
        typeof existing?.blurEnabled === 'boolean' ? existing.blurEnabled : defaultBlur,
      messagesCount: toNumber(topUser.metrics?.messagesCount, existing?.messagesCount || 0),
      threadsCount: toNumber(topUser.metrics?.threadsCount, existing?.threadsCount || 0),
      repliesCount: toNumber(topUser.metrics?.repliesCount, existing?.repliesCount || 0),
      totalActiveTime: toNumber(topUser.metrics?.totalActiveTime, existing?.totalActiveTime || 0),
      activityScore: toNumber(topUser.metrics?.activityScore, existing?.activityScore || 0),
      source: existing?.source || 'activity',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    batch.set(doc(db, TOP_PARTICIPANTS_COLLECTION, userId), payload, { merge: true });
  });

  await batch.commit();
};
