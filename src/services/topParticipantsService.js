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
