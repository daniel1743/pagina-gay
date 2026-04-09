import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { db, storage } from '@/config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  arrayUnion,
  serverTimestamp,
  endBefore,
  getDocs,
  getDoc,
  limitToLast,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { Check, CheckCheck, Clock, CornerUpLeft, ImagePlus, Minus, Send, Smile, X } from 'lucide-react';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import {
  requestPrivateChatContactShare,
  revokePrivateChatContactShare,
  respondToPrivateChatContactShare,
  sendRichPrivateChatMessage,
  subscribeToPrivateChatTyping,
  updatePrivateChatTypingStatus,
} from '@/services/socialService';
import { notificationSounds } from '@/services/notificationSounds';
import { savePendingPrivateChatRestore } from '@/utils/privateChatRestore';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const PHOTO_MAX_SIZE_BYTES = 140 * 1024;
const RECENT_EMOJIS_STORAGE_KEY = 'private_chat_v2_recent_emojis';
const INITIAL_PRIVATE_MESSAGES_LIMIT = 40;
const PRIVATE_HISTORY_PAGE_SIZE = 40;
const GUEST_PRIVATE_MESSAGES_LIMIT = 10;
const GUEST_PRIVATE_COUNTER_STORAGE_PREFIX = 'chactivo:private_chat_guest_counter:v2:';
const GUEST_EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const PRIVATE_CONTACT_SHARE_MIN_MESSAGES_PER_PARTICIPANT = 3;
const PRIVATE_CONTACT_SHARE_MIN_AGE_MS = 10 * 60 * 1000;
const PRIVATE_CONTACT_GUIDE_DISMISS_PREFIX = 'chactivo:private_contact_guide_dismissed:';
const PRIVATE_EARLY_WARNING_MAX_MESSAGES = 4;

const getTimestampMs = (value) => {
  if (!value) return null;
  if (value?.toMillis) return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const formatMessageTime = (value) => {
  const timestampMs = getTimestampMs(value);
  if (!timestampMs) return '';
  return new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatRemainingDuration = (expiresAtMs) => {
  const remainingMs = Math.max(0, Number(expiresAtMs || 0) - Date.now());
  if (!remainingMs) return 'vence ahora';
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  if (totalMinutes < 60) return `vence en ${totalMinutes} min`;
  const totalHours = Math.ceil(totalMinutes / 60);
  if (totalHours < 24) return `vence en ${totalHours} h`;
  const totalDays = Math.ceil(totalHours / 24);
  return `vence en ${totalDays} d`;
};

const formatLastSeen = (timestampMs) => {
  if (!timestampMs) return 'desconectado';
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSeconds < 60) return 'activo hace segundos';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `activo hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `activo hace ${diffHours} h`;
  return 'activo hace días';
};

const normalizeParticipant = (participant = {}) => {
  const userId = participant?.userId || participant?.id || '';
  return {
    id: userId,
    userId,
    username: participant?.username || 'Usuario',
    avatar: participant?.avatar || '',
    isPremium: Boolean(participant?.isPremium),
  };
};

const dedupeParticipants = (participants = []) => {
  const seen = new Set();
  return (participants || [])
    .map((participant) => normalizeParticipant(participant))
    .filter((participant) => {
      if (!participant.userId || seen.has(participant.userId)) return false;
      seen.add(participant.userId);
      return true;
    });
};

const buildGroupTitle = (participants = [], currentUserId = null) => {
  const others = participants
    .filter((participant) => participant.userId !== currentUserId)
    .map((participant) => participant.username)
    .filter(Boolean);

  if (others.length === 0) return 'Chat privado';
  return others.slice(0, 3).join(', ');
};

const buildPreview = (message) => {
  if (!message) return '';
  if (message.type === 'image') return '📷 Foto';
  const text = typeof message.content === 'string' ? message.content.trim() : '';
  if (!text) return 'Nuevo mensaje';
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const buildReplyPayload = (message, fallbackUsername = 'Usuario') => ({
  messageId: message?._realId || message?.id || null,
  username: message?.username || fallbackUsername,
  content: message?.type === 'image' ? '📷 Foto' : buildPreview(message),
  type: message?.type || 'text',
});

const getImageExtension = (contentType = '') => {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('heic')) return 'heic';
  if (contentType.includes('heif')) return 'heif';
  return 'jpg';
};

const TypingDots = () => (
  <div className="inline-flex items-center gap-1">
    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
  </div>
);

export default function PrivateChatWindowV2({
  user,
  partner,
  participants = [],
  title = '',
  onClose,
  onMinimize,
  onRestore,
  chatId,
  initialMessage = '',
  autoFocus = true,
  roomId = null,
  onEnterPrivate,
  onLeavePrivate,
  windowIndex = 0,
  minimizedIndex = 0,
  isMinimized = false,
  isPending = false,
  onChatActivity,
}) {
  const [recentMessages, setRecentMessages] = useState([]);
  const [olderMessages, setOlderMessages] = useState([]);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isInitialMessagesLoading, setIsInitialMessagesLoading] = useState(true);
  const [isLoadingOlderHistory, setIsLoadingOlderHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState(['😂', '😍', '🔥', '😘', '😉', '❤️']);
  const [replyTo, setReplyTo] = useState(null);
  const [swipeReplyMessageId, setSwipeReplyMessageId] = useState(null);
  const [swipeReplyOffset, setSwipeReplyOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));
  const [partnerPresence, setPartnerPresence] = useState({
    isOnline: Boolean(partner?.estaOnline || partner?.isOnline),
    lastSeenMs: getTimestampMs(partner?.ultimaConexion || partner?.lastSeen),
  });
  const [guestPrivateSentCount, setGuestPrivateSentCount] = useState(0);
  const [chatMeta, setChatMeta] = useState(null);
  const [sharedContacts, setSharedContacts] = useState({});
  const [isSubmittingContactShare, setIsSubmittingContactShare] = useState(false);
  const [contactShareNowMs, setContactShareNowMs] = useState(() => Date.now());
  const [isContactGuideDismissed, setIsContactGuideDismissed] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingPublishedRef = useRef(false);
  const hasLoadedSnapshotRef = useRef(false);
  const olderMessagesRef = useRef([]);
  const historyCursorRef = useRef(null);
  const isPrependingHistoryRef = useRef(false);
  const isWindowFocusedRef = useRef(true);
  const savedScrollTopRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const onChatActivityRef = useRef(onChatActivity);
  const lastReportedActivityKeyRef = useRef('');
  const lastContactSystemMessageRef = useRef(null);
  const sharedContactsRef = useRef({});
  const swipeStateRef = useRef({
    tracking: false,
    messageKey: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
  });

  const chatParticipants = useMemo(() => {
    const fallback = [
      user ? {
        userId: user.id || user.userId,
        username: user.username,
        avatar: user.avatar,
        isPremium: user.isPremium,
      } : null,
      partner ? {
        userId: partner.id || partner.userId,
        username: partner.username,
        avatar: partner.avatar,
        isPremium: partner.isPremium,
      } : null,
    ].filter(Boolean);

    return dedupeParticipants(Array.isArray(participants) && participants.length > 0 ? participants : fallback);
  }, [participants, partner, user]);

  const isGroupChat = chatParticipants.length > 2;
  const isGuestMode = Boolean(user?.isGuest || user?.isAnonymous);
  const isRegisteredUser = Boolean(user?.id && !isGuestMode);
  const otherParticipants = useMemo(
    () => chatParticipants.filter((participantItem) => participantItem.userId !== user?.id),
    [chatParticipants, user?.id]
  );
  const primaryParticipant = otherParticipants[0] || normalizeParticipant(partner || {});
  const conversationTitle = isGroupChat
    ? (title?.trim() || buildGroupTitle(chatParticipants, user?.id))
    : (primaryParticipant.username || 'Usuario');
  const recipientIds = useMemo(
    () => otherParticipants.map((participantItem) => participantItem.userId).filter(Boolean),
    [otherParticipants]
  );
  const isPartnerTyping = typingUsers.length > 0;
  const privateMarkerId = isGroupChat ? chatId : (primaryParticipant.userId || null);
  const guestPrivateCounterStorageKey = useMemo(
    () => `${GUEST_PRIVATE_COUNTER_STORAGE_PREFIX}${user?.id || 'anon'}`,
    [user?.id]
  );
  const contactGuideDismissStorageKey = useMemo(
    () => `${PRIVATE_CONTACT_GUIDE_DISMISS_PREFIX}${user?.id || 'anon'}:${chatId || 'unknown'}`,
    [chatId, user?.id]
  );
  const directChatParticipantIds = useMemo(
    () => chatParticipants.map((participantItem) => participantItem.userId).filter(Boolean),
    [chatParticipants]
  );
  const messages = useMemo(() => {
    const byId = new Map();
    [...optimisticMessages, ...olderMessages, ...recentMessages].forEach((message) => {
      const messageId = message?.clientId
        ? `client:${message.clientId}`
        : (message?._realId || message?.id);
      if (!messageId) return;
      byId.set(messageId, message);
    });

    return Array.from(byId.values()).sort((a, b) => {
      const aMs = getTimestampMs(a?.timestamp) || 0;
      const bMs = getTimestampMs(b?.timestamp) || 0;
      if (aMs !== bMs) return aMs - bMs;
      return String(a?._realId || a?.id || '').localeCompare(String(b?._realId || b?.id || ''));
    });
  }, [olderMessages, optimisticMessages, recentMessages]);

  const latestPartnerPrivateActivityMs = useMemo(() => {
    const partnerId = primaryParticipant.userId;
    if (!partnerId || isGroupChat || !Array.isArray(messages) || messages.length === 0) return 0;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message?.userId !== partnerId) continue;
      return getTimestampMs(message?.timestamp) || 0;
    }

    return 0;
  }, [isGroupChat, messages, primaryParticipant.userId]);

  const isPartnerRecentlyActiveInPrivate = useMemo(() => {
    if (isGroupChat) return false;
    if (isPartnerTyping) return true;
    if (!latestPartnerPrivateActivityMs) return false;
    return (Date.now() - latestPartnerPrivateActivityMs) <= (3 * 60 * 1000);
  }, [isGroupChat, isPartnerTyping, latestPartnerPrivateActivityMs]);

  useEffect(() => {
    onChatActivityRef.current = onChatActivity;
  }, [onChatActivity]);

  useEffect(() => {
    if (!chatId) {
      setChatMeta(null);
      return;
    }

    let cancelled = false;

    const loadChatMeta = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'private_chats', chatId));
        if (!cancelled) {
          setChatMeta(snapshot.exists() ? (snapshot.data() || null) : null);
        }
      } catch {
        if (!cancelled) {
          setChatMeta(null);
        }
      }
    };

    void loadChatMeta();
    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    lastContactSystemMessageRef.current = null;
  }, [chatId]);

  useEffect(() => {
    sharedContactsRef.current = sharedContacts;
  }, [sharedContacts]);

  useEffect(() => {
    let cancelled = false;

    if (!isGuestMode || !user?.id) {
      setGuestPrivateSentCount(0);
      return undefined;
    }

    const syncGuestPrivateCounter = async () => {
      let localCount = 0;

      try {
        const raw = localStorage.getItem(guestPrivateCounterStorageKey);
        const parsed = Number(raw || 0);
        localCount = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
      } catch {
        localCount = 0;
      }

      if (!cancelled) {
        setGuestPrivateSentCount(localCount);
      }

      try {
        const guestRef = doc(db, 'guests', user.id);
        const guestSnap = await getDoc(guestRef);
        const remoteCount = Number(guestSnap.data()?.privateMessageCount || 0);
        const normalizedRemote = Number.isFinite(remoteCount) ? Math.max(0, remoteCount) : 0;
        const mergedCount = Math.max(localCount, normalizedRemote);

        if (!cancelled) {
          setGuestPrivateSentCount(mergedCount);
        }

        try {
          localStorage.setItem(guestPrivateCounterStorageKey, String(mergedCount));
        } catch {
          // noop
        }
      } catch {
        // noop
      }
    };

    syncGuestPrivateCounter();
    return () => {
      cancelled = true;
    };
  }, [guestPrivateCounterStorageKey, isGuestMode, user?.id]);

  useEffect(() => {
    olderMessagesRef.current = olderMessages;
  }, [olderMessages]);

  useEffect(() => {
    setOptimisticMessages([]);
  }, [chatId]);

  useEffect(() => {
    setSharedContacts({});
  }, [chatId]);

  useEffect(() => {
    if (!contactGuideDismissStorageKey) {
      setIsContactGuideDismissed(false);
      return;
    }

    try {
      setIsContactGuideDismissed(localStorage.getItem(contactGuideDismissStorageKey) === '1');
    } catch {
      setIsContactGuideDismissed(false);
    }
  }, [contactGuideDismissStorageKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setContactShareNowMs(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!chatId || !user?.id) return undefined;
    if (roomId && onEnterPrivate && privateMarkerId && conversationTitle) {
      onEnterPrivate(roomId, privateMarkerId, conversationTitle);
    }
    return () => {
      if (roomId && onLeavePrivate) {
        onLeavePrivate(roomId);
      }
    };
  }, [chatId, conversationTitle, onEnterPrivate, onLeavePrivate, privateMarkerId, roomId, user?.id]);

  useEffect(() => {
    if (!chatId || isPending) return undefined;
    hasLoadedSnapshotRef.current = false;
    setIsInitialMessagesLoading(true);
    setOlderMessages([]);
    setRecentMessages([]);
    setHasMoreHistory(false);
    historyCursorRef.current = null;

    const q = query(
      collection(db, 'private_chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limitToLast(INITIAL_PRIVATE_MESSAGES_LIMIT)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextMessages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setRecentMessages(nextMessages);

      if (olderMessagesRef.current.length === 0) {
        historyCursorRef.current = snapshot.docs[0] || null;
        setHasMoreHistory(snapshot.docs.length >= INITIAL_PRIVATE_MESSAGES_LIMIT);
      }
      setIsInitialMessagesLoading(false);

      const markRead = isWindowFocusedRef.current && !document.hidden;
      markIncomingMessagesStatus(nextMessages, { markRead });

      if (!hasLoadedSnapshotRef.current) {
        hasLoadedSnapshotRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const data = change.doc.data() || {};
        if (data.userId === user?.id || data.type === 'system') return;
        notificationSounds.playMessageSound();
      });
    }, (error) => {
      console.error('[PRIVATE_CHAT_V2] Error subscribing messages:', error);
      setIsInitialMessagesLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, isPending, user?.id]);

  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    const persistedClientIds = new Set(
      [...olderMessages, ...recentMessages]
        .map((message) => message?.clientId)
        .filter(Boolean)
    );

    if (persistedClientIds.size === 0) return;

    setOptimisticMessages((prev) => prev.filter((message) => !persistedClientIds.has(message?.clientId)));
  }, [olderMessages, optimisticMessages.length, recentMessages]);

  useEffect(() => {
    if (!chatId) {
      setChatMeta(null);
      return;
    }

    const latestContactSystemMessage = [...messages]
      .reverse()
      .find((message) => (
        message?.type === 'system' &&
        typeof message?.content === 'string' &&
        /(telefono|contacto)/i.test(message.content)
      ));

    if (!latestContactSystemMessage) return;

    const messageKey = latestContactSystemMessage.id
      || latestContactSystemMessage._realId
      || getTimestampMs(latestContactSystemMessage.timestamp)
      || latestContactSystemMessage.content;

    if (!lastContactSystemMessageRef.current) {
      lastContactSystemMessageRef.current = messageKey;
      return;
    }

    if (lastContactSystemMessageRef.current === messageKey) return;
    lastContactSystemMessageRef.current = messageKey;

    let cancelled = false;

    const refreshChatMeta = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'private_chats', chatId));
        if (!cancelled) {
          setChatMeta(snapshot.exists() ? (snapshot.data() || null) : null);
        }
      } catch {
        if (!cancelled) {
          setChatMeta(null);
        }
      }
    };

    void refreshChatMeta();
    return () => {
      cancelled = true;
    };
  }, [chatId, messages]);

  const privateContactMessageCounts = useMemo(() => {
    const counts = directChatParticipantIds.reduce((acc, participantId) => {
      acc[participantId] = 0;
      return acc;
    }, {});

    messages.forEach((message) => {
      if (!message?.userId || message.type === 'system') return;
      if (!(message.userId in counts)) return;
      counts[message.userId] += 1;
    });

    return counts;
  }, [directChatParticipantIds, messages]);

  const privateConversationMessageCount = useMemo(
    () => Object.values(privateContactMessageCounts).reduce((total, count) => total + Number(count || 0), 0),
    [privateContactMessageCounts]
  );

  const privateContactShareReady = useMemo(() => {
    if (chatMeta?.contactSharingUnlocked === true) return true;
    if (isGroupChat || directChatParticipantIds.length !== 2) return false;

    const createdAtMs = getTimestampMs(chatMeta?.createdAt);
    const chatIsOldEnough = Boolean(createdAtMs) && (Date.now() - createdAtMs >= PRIVATE_CONTACT_SHARE_MIN_AGE_MS);
    const eachParticipantHasEnoughMessages = directChatParticipantIds.every(
      (participantId) => (privateContactMessageCounts[participantId] || 0) >= PRIVATE_CONTACT_SHARE_MIN_MESSAGES_PER_PARTICIPANT
    );

    return chatIsOldEnough && eachParticipantHasEnoughMessages;
  }, [chatMeta?.contactSharingUnlocked, chatMeta?.createdAt, directChatParticipantIds, isGroupChat, privateContactMessageCounts]);

  const myContactShareRequest = user?.id ? (chatMeta?.contactShareRequests?.[user.id] || null) : null;

  const incomingContactShareRequest = useMemo(() => {
    if (!user?.id || isGroupChat) return null;
    const requests = chatMeta?.contactShareRequests || {};
    return Object.values(requests).find((requestItem) => (
      requestItem?.status === 'pending' &&
      requestItem?.recipientId === user.id
    )) || null;
  }, [chatMeta?.contactShareRequests, isGroupChat, user?.id]);

  const getContactVisibilityState = (ownerId, viewerId) => {
    const rawValue = chatMeta?.contactShareVisibility?.[ownerId]?.[viewerId];
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
    const isExpired = Boolean(expiresAtMs) && expiresAtMs <= contactShareNowMs;
    return {
      isVisible: rawValue?.allowed === true && !isExpired,
      isExpired,
      expiresAtMs,
    };
  };

  const visibleSharedContactOwnerIds = useMemo(() => {
    if (!user?.id) return [];
    return Object.entries(chatMeta?.contactShareVisibility || {})
      .filter(([ownerId]) => getContactVisibilityState(ownerId, user.id).isVisible)
      .map(([ownerId]) => ownerId)
      .filter(Boolean);
  }, [chatMeta?.contactShareVisibility, contactShareNowMs, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadSharedContacts = async () => {
      if (visibleSharedContactOwnerIds.length === 0) {
        if (!cancelled) {
          setSharedContacts({});
        }
        return;
      }

      const visibleOwnerIdsSet = new Set(visibleSharedContactOwnerIds);
      const cachedVisibleContacts = Object.fromEntries(
        Object.entries(sharedContactsRef.current || {}).filter(([ownerId]) => visibleOwnerIdsSet.has(ownerId))
      );

      if (!cancelled) {
        setSharedContacts(cachedVisibleContacts);
      }

      const missingOwnerIds = visibleSharedContactOwnerIds.filter(
        (ownerId) => !cachedVisibleContacts?.[ownerId]?.phone
      );

      if (missingOwnerIds.length === 0) {
        return;
      }

      try {
        const entries = await Promise.all(
          missingOwnerIds.map(async (ownerId) => {
            const userSnap = await getDoc(doc(db, 'users', ownerId));
            const userData = userSnap.data() || {};
            return [
              ownerId,
              {
                userId: ownerId,
                username: userData?.username || 'Usuario',
                phone: typeof userData?.phone === 'string' ? userData.phone.trim() : '',
              },
            ];
          })
        );

        if (!cancelled) {
          setSharedContacts((previousContacts) => ({
            ...Object.fromEntries(
              Object.entries(previousContacts || {}).filter(([ownerId]) => visibleOwnerIdsSet.has(ownerId))
            ),
            ...Object.fromEntries(entries),
          }));
        }
      } catch {
        if (!cancelled) {
          setSharedContacts(cachedVisibleContacts);
        }
      }
    };

    loadSharedContacts();
    return () => {
      cancelled = true;
    };
  }, [visibleSharedContactOwnerIds]);

  useEffect(() => {
    if (!partner?.id && !partner?.userId) return undefined;
    const partnerId = primaryParticipant.userId;
    if (!partnerId || isGroupChat) return undefined;

    const unsubscribe = onSnapshot(doc(db, 'tarjetas', partnerId), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() || {};
      setPartnerPresence({
        isOnline: data.estaOnline === true,
        lastSeenMs: getTimestampMs(data.ultimaConexion),
      });
    });

    return () => unsubscribe();
  }, [isGroupChat, partner?.id, partner?.userId, primaryParticipant.userId]);

  useEffect(() => {
    if (!chatId || !user?.id || isPending) return undefined;
    return subscribeToPrivateChatTyping(chatId, user.id, setTypingUsers);
  }, [chatId, isPending, user?.id]);

  useEffect(() => {
    if (!chatId || !user?.id || isPending) return undefined;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!newMessage.trim()) {
      if (typingPublishedRef.current) {
        typingPublishedRef.current = false;
        updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
      }
      return undefined;
    }

    if (!typingPublishedRef.current) {
      typingPublishedRef.current = true;
      updatePrivateChatTypingStatus(chatId, user.id, true, user.username).catch(() => {});
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (!typingPublishedRef.current) return;
      typingPublishedRef.current = false;
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    }, 1800);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, isPending, newMessage, user?.id, user?.username]);

  useEffect(() => () => {
    if (chatId && user?.id && typingPublishedRef.current) {
      typingPublishedRef.current = false;
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    }
  }, [chatId, user?.id, user?.username]);

  useEffect(() => {
    if (isPrependingHistoryRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isPartnerTyping, showEmojiPicker]);

  useEffect(() => {
    if (!autoFocus) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [autoFocus, chatId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setRecentEmojis(parsed.filter((item) => typeof item === 'string' && item.trim()).slice(0, 16));
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      isWindowFocusedRef.current = !document.hidden;
      if (!document.hidden) {
        markIncomingMessagesStatus(messages, { markRead: true });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [messages]);

  useEffect(() => {
    if (typeof onChatActivity !== 'function' || !chatId || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    const activity = {
      chatId,
      roomId: roomId || null,
      partner: {
        id: primaryParticipant.userId || chatId,
        userId: primaryParticipant.userId || chatId,
        username: primaryParticipant.username || conversationTitle,
        avatar: primaryParticipant.avatar || '',
        isPremium: Boolean(primaryParticipant.isPremium),
      },
      participants: chatParticipants,
      title: isGroupChat ? conversationTitle : '',
      lastMessagePreview: buildPreview(latest),
      lastMessageAt: getTimestampMs(latest.timestamp) || Date.now(),
    };
    const activityKey = [
      activity.chatId,
      activity.partner.userId || '',
      activity.lastMessageAt || '',
      activity.lastMessagePreview || '',
    ].join('|');

    if (lastReportedActivityKeyRef.current === activityKey) return;
    lastReportedActivityKeyRef.current = activityKey;
    onChatActivityRef.current?.(activity);
  }, [
    chatId,
    chatParticipants,
    conversationTitle,
    isGroupChat,
    messages,
    primaryParticipant.avatar,
    primaryParticipant.isPremium,
    primaryParticipant.userId,
    primaryParticipant.username,
    roomId,
  ]);

  const registerRecentEmoji = (emoji) => {
    if (!emoji) return;
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((item) => item !== emoji)].slice(0, 16);
      try {
        localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // noop
      }
      return next;
    });
  };

  const showGuestRegistrationPrompt = (featureLabel = 'seguir chateando en privado') => {
    toast({
      title: 'Regístrate para continuar',
      description: `Como invitado tienes 10 mensajes privados gratis. Para ${featureLabel}, crea tu cuenta.`,
      duration: 5000,
      action: {
        label: 'Registrarme',
        onClick: () => {
          if (typeof window !== 'undefined') {
            const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/chat/principal';
            savePendingPrivateChatRestore({
              chatId,
              roomId,
              title: isGroupChat ? conversationTitle : '',
              partner: primaryParticipant,
              participants: chatParticipants,
              initialMessage: newMessage,
              redirectTo,
            });
            window.location.assign(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
          }
        },
      },
    });
  };

  const showGuestTextOnlyToast = (featureLabel = 'usar esta función') => {
    toast({
      title: 'Solo texto en modo invitado',
      description: `Los invitados pueden enviar solo conversación normal. Regístrate para ${featureLabel}.`,
      duration: 4200,
      action: {
        label: 'Registrarme',
        onClick: () => {
          if (typeof window !== 'undefined') {
            const redirectTo = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/chat/principal';
            savePendingPrivateChatRestore({
              chatId,
              roomId,
              title: isGroupChat ? conversationTitle : '',
              partner: primaryParticipant,
              participants: chatParticipants,
              initialMessage: newMessage,
              redirectTo,
            });
            window.location.assign(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
          }
        },
      },
    });
  };

  const persistGuestPrivateMessageCount = async (nextCount) => {
    setGuestPrivateSentCount(nextCount);
    try {
      localStorage.setItem(guestPrivateCounterStorageKey, String(nextCount));
    } catch {
      // noop
    }

    if (!user?.id) return;

    try {
      const guestRef = doc(db, 'guests', user.id);
      await setDoc(guestRef, {
        privateMessageCount: nextCount,
        lastPrivateMessageAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      // noop
    }
  };

  const registerGuestPrivateMessage = async () => {
    if (!isGuestMode) return;
    const nextCount = guestPrivateSentCount + 1;
    await persistGuestPrivateMessageCount(nextCount);
  };

  const markIncomingMessagesStatus = async (messageList, { markRead = false } = {}) => {
    if (!chatId || !user?.id || !Array.isArray(messageList) || messageList.length === 0) return;

    const batch = writeBatch(db);
    let hasUpdates = false;

    messageList.forEach((message) => {
      if (!message?.id || message.userId === user.id || message.type === 'system') return;

      const deliveredTo = Array.isArray(message.deliveredTo) ? message.deliveredTo : [];
      const readBy = Array.isArray(message.readBy) ? message.readBy : [];
      const updates = {};

      if (!deliveredTo.includes(user.id)) {
        updates.deliveredTo = arrayUnion(user.id);
        if (!message.deliveredAt) updates.deliveredAt = serverTimestamp();
      }

      if (markRead && !readBy.includes(user.id)) {
        updates.readBy = arrayUnion(user.id);
        if (!message.readAt) updates.readAt = serverTimestamp();
      }

      if (Object.keys(updates).length === 0) return;
      batch.update(doc(db, 'private_chats', chatId, 'messages', message.id), updates);
      hasUpdates = true;
    });

    if (!hasUpdates) return;

    try {
      await batch.commit();
    } catch {
      // noop
    }
  };

  const messageStatus = (message) => {
    if (message?._optimistic && message?.status === 'sending') {
      return 'sending';
    }

    const deliveredTo = Array.isArray(message?.deliveredTo) ? message.deliveredTo : [];
    const readBy = Array.isArray(message?.readBy) ? message.readBy : [];
    const everyoneRead = recipientIds.length > 0 && recipientIds.every((recipientId) => readBy.includes(recipientId));
    const everyoneDelivered = recipientIds.length > 0 && recipientIds.every(
      (recipientId) => deliveredTo.includes(recipientId) || readBy.includes(recipientId)
    );

    if (everyoneRead) return 'read';
    if (everyoneDelivered) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = (status, className = 'h-3.5 w-3.5') => {
    if (status === 'sending') {
      return <Clock strokeWidth={2.6} className={`${className} text-zinc-950/90`} />;
    }
    if (status === 'read') {
      return <CheckCheck strokeWidth={2.8} className={`${className} text-blue-700 drop-shadow-[0_0_1px_rgba(255,255,255,0.55)]`} />;
    }
    if (status === 'delivered') {
      return <CheckCheck strokeWidth={2.8} className={`${className} text-fuchsia-800 drop-shadow-[0_0_1px_rgba(255,255,255,0.35)]`} />;
    }
    return <Check strokeWidth={2.8} className={`${className} text-zinc-950`} />;
  };

  const loadOlderMessages = async () => {
    if (!chatId || isLoadingOlderHistory || !historyCursorRef.current) return;

    const container = messagesScrollRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    const previousScrollTop = container?.scrollTop || 0;

    setIsLoadingOlderHistory(true);

    try {
      const olderQuery = query(
        collection(db, 'private_chats', chatId, 'messages'),
        orderBy('timestamp', 'asc'),
        endBefore(historyCursorRef.current),
        limitToLast(PRIVATE_HISTORY_PAGE_SIZE)
      );

      const snapshot = await getDocs(olderQuery);
      if (snapshot.empty) {
        historyCursorRef.current = null;
        setHasMoreHistory(false);
        return;
      }

      const nextOlderMessages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      historyCursorRef.current = snapshot.docs[0] || null;
      setHasMoreHistory(snapshot.docs.length >= PRIVATE_HISTORY_PAGE_SIZE);
      isPrependingHistoryRef.current = true;
      setOlderMessages((prev) => [...nextOlderMessages, ...prev]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const currentContainer = messagesScrollRef.current;
          if (currentContainer) {
            const currentScrollHeight = currentContainer.scrollHeight || 0;
            currentContainer.scrollTop = previousScrollTop + (currentScrollHeight - previousScrollHeight);
          }
          isPrependingHistoryRef.current = false;
        });
      });
    } catch (error) {
      console.error('[PRIVATE_CHAT_V2] Error loading older history:', error);
      toast({
        title: 'No pudimos cargar mensajes anteriores',
        description: 'Intenta de nuevo en unos segundos.',
        variant: 'destructive',
      });
      isPrependingHistoryRef.current = false;
    } finally {
      setIsLoadingOlderHistory(false);
    }
  };

  const handleRequestContactShare = async () => {
    if (!chatId || !user?.id || isGroupChat) return;
    if (isGuestMode) {
      showGuestRegistrationPrompt('compartir tu telefono');
      return;
    }

    setIsSubmittingContactShare(true);
    try {
      const result = await requestPrivateChatContactShare(chatId, user.id);
      const chatMetaSnapshot = await getDoc(doc(db, 'private_chats', chatId));
      setChatMeta(chatMetaSnapshot.exists() ? (chatMetaSnapshot.data() || null) : null);
      toast({
        title: result?.alreadyShared ? 'Tu telefono ya fue compartido' : 'Solicitud enviada',
        description: result?.alreadyShared
          ? 'Esta persona ya puede ver tu telefono en este chat.'
          : (result?.alreadyPending
            ? 'La otra persona todavia no responde tu solicitud.'
            : 'La otra persona debe aceptar antes de ver tu telefono.'),
      });
    } catch (error) {
      toast({
        title: error?.code === 'PRIVATE_CONTACT_LOCKED' ? 'Todavia no pueden compartir contacto' : 'No se pudo solicitar',
        description: error?.message || 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingContactShare(false);
    }
  };

  const handleRespondContactShare = async (accepted) => {
    if (!chatId || !user?.id || !incomingContactShareRequest?.requesterId) return;

    setIsSubmittingContactShare(true);
    try {
      await respondToPrivateChatContactShare(
        chatId,
        user.id,
        incomingContactShareRequest.requesterId,
        accepted
      );
      const chatMetaSnapshot = await getDoc(doc(db, 'private_chats', chatId));
      setChatMeta(chatMetaSnapshot.exists() ? (chatMetaSnapshot.data() || null) : null);
      toast({
        title: accepted ? 'Contacto habilitado' : 'Solicitud rechazada',
        description: accepted
          ? 'Ahora puedes ver el telefono compartido en este chat.'
          : 'La otra persona no vera tu respuesta como contacto aprobado.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo responder',
        description: error?.message || 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingContactShare(false);
    }
  };

  const handleRevokeContactShare = async () => {
    if (!chatId || !user?.id || !primaryParticipant.userId) return;

    setIsSubmittingContactShare(true);
    try {
      await revokePrivateChatContactShare(chatId, user.id, primaryParticipant.userId);
      const chatMetaSnapshot = await getDoc(doc(db, 'private_chats', chatId));
      setChatMeta(chatMetaSnapshot.exists() ? (chatMetaSnapshot.data() || null) : null);
      toast({
        title: 'Contacto revocado',
        description: 'Tu telefono dejo de mostrarse en este chat.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo revocar',
        description: error?.message || 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingContactShare(false);
    }
  };

  const handleDismissContactGuide = () => {
    setIsContactGuideDismissed(true);
    try {
      localStorage.setItem(contactGuideDismissStorageKey, '1');
    } catch {
      // noop
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const contentToSend = newMessage.trim();
    if (!contentToSend || !chatId || !user?.id) return;
    if (isPending || String(user.id).startsWith('temp_')) {
      toast({
        title: 'Preparando chat privado',
        description: 'Espera un momento antes de enviar tu primer mensaje.',
      });
      return;
    }
    const replyToSend = replyTo;

    if (isGuestMode && guestPrivateSentCount >= GUEST_PRIVATE_MESSAGES_LIMIT) {
      showGuestRegistrationPrompt('seguir enviando mensajes privados');
      return;
    }

    if (isGuestMode && GUEST_EMOJI_REGEX.test(contentToSend)) {
      showGuestTextOnlyToast('usar emojis en privado');
      return;
    }

    const clientId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `private_client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimisticId = `optimistic_${clientId}`;
    const optimisticTimestamp = new Date();
    const optimisticMessage = {
      id: optimisticId,
      clientId,
      userId: user.id,
      username: user.username || 'Usuario',
      avatar: user.avatar || '',
      content: contentToSend,
      type: 'text',
      replyTo: replyToSend || null,
      timestamp: optimisticTimestamp,
      status: 'sending',
      deliveredTo: [user.id],
      readBy: [user.id],
      _optimistic: true,
    };

    setNewMessage('');
    setShowEmojiPicker(false);
    setReplyTo(null);
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      await sendRichPrivateChatMessage(chatId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: contentToSend,
        type: 'text',
        senderIsPremium: Boolean(user?.isPremium),
        replyTo: replyToSend,
        clientId,
      });

      setOptimisticMessages((prev) => prev.map((message) => (
        message.clientId === clientId
          ? { ...message, status: 'sent' }
          : message
      )));
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
      notificationSounds.playMessageSentSound();
      await registerGuestPrivateMessage();
      inputRef.current?.focus();
    } catch (error) {
      setOptimisticMessages((prev) => prev.filter((message) => message.clientId !== clientId));
      setNewMessage(contentToSend);
      setReplyTo(replyToSend);
      console.error('[PRIVATE_CHAT_V2] Error sending private message:', error);
      console.info('[PRIVATE_CHAT_DEBUG] Ejecuta window.printPrivateChatDebug?.() o inspecciona window.__lastPrivateChatDebug');
      toast({
        title: error?.code === 'PRIVATE_CONTACT_LOCKED' ? 'Aún no compartas contacto' : 'No pudimos enviar el mensaje',
        description: error?.message || 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    }
  };

  const handleEmojiClick = (emojiObject) => {
    if (isGuestMode) {
      showGuestTextOnlyToast('usar emojis en privado');
      return;
    }
    const emoji = emojiObject?.emoji;
    if (!emoji) return;
    setNewMessage((prev) => prev + emoji);
    registerRecentEmoji(emoji);
    inputRef.current?.focus({ preventScroll: true });
  };

  const compressImageForChat = async (file) => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.14,
      maxWidthOrHeight: 960,
      useWebWorker: true,
      initialQuality: 0.68,
    });

    if (compressed.size > PHOTO_MAX_SIZE_BYTES) {
      throw new Error('La imagen supera 140 KB tras compresión. Prueba otra imagen o recórtala.');
    }
    return compressed;
  };

  const handlePhotoSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile || !chatId || !user?.id) return;
    if (isPending || String(user.id).startsWith('temp_')) {
      toast({
        title: 'Preparando chat privado',
        description: 'Espera un momento antes de enviar archivos.',
      });
      return;
    }

    if (isGuestMode) {
      showGuestTextOnlyToast('enviar fotos en privado');
      return;
    }

    if (!selectedFile.type?.startsWith('image/')) {
      toast({
        title: 'Archivo no permitido',
        description: 'Solo se permiten imágenes.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    const replyToSend = replyTo;
    try {
      const optimizedFile = await compressImageForChat(selectedFile);
      const tempMessageId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `private_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const assetId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const extension = getImageExtension(optimizedFile.type);
      const mediaPath = `chat_media/private/${chatId}/${tempMessageId}/${assetId}.${extension}`;

      const fileRef = storageRef(storage, mediaPath);
      await uploadBytes(fileRef, optimizedFile, {
        contentType: optimizedFile.type,
        customMetadata: {
          roomId: `private_${chatId}`,
          userId: user.id,
          feature: 'chat_photo_access_private_v2',
        },
      });

      const downloadURL = await getDownloadURL(fileRef);
      await sendRichPrivateChatMessage(chatId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: downloadURL,
        type: 'image',
        media: [
          {
            kind: 'image',
            path: mediaPath,
            contentType: optimizedFile.type,
            sizeBytes: optimizedFile.size,
          },
        ],
        senderIsPremium: Boolean(user?.isPremium),
        replyTo: replyToSend,
      });

      setShowEmojiPicker(false);
      setReplyTo(null);
      notificationSounds.playMessageSentSound();
      toast({
        title: 'Foto enviada',
        description: 'La imagen ya quedó en el chat privado.',
      });
    } catch (error) {
      console.error('[PRIVATE_CHAT_V2] Error sending private image:', error);
      toast({
        title: 'No se pudo subir la foto',
        description: error?.message || 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const incomingContactRequester = incomingContactShareRequest?.requesterId
    ? chatParticipants.find((participantItem) => participantItem.userId === incomingContactShareRequest.requesterId)
    : null;
  const myContactVisibilityState = (
    user?.id && primaryParticipant.userId
      ? getContactVisibilityState(user.id, primaryParticipant.userId)
      : { isVisible: false, isExpired: false, expiresAtMs: null }
  );
  const partnerContactVisibilityState = primaryParticipant.userId
    ? getContactVisibilityState(primaryParticipant.userId, user?.id)
    : { isVisible: false, isExpired: false, expiresAtMs: null };
  const mySharedContactVisibleToPartner = myContactVisibilityState.isVisible;
  const partnerSharedContact = partnerContactVisibilityState.isVisible && primaryParticipant.userId
    ? sharedContacts?.[primaryParticipant.userId]
    : null;
  const canRequestContactShare = (
    !isGroupChat &&
    isRegisteredUser &&
    privateContactShareReady &&
    !incomingContactShareRequest &&
    myContactShareRequest?.status !== 'pending' &&
    !mySharedContactVisibleToPartner
  );
  const contactShareStatusText = privateContactShareReady
    ? 'Ya pueden compartir telefono con aceptacion mutua y vigencia temporal.'
    : 'Se habilita tras 10 min y 3 mensajes por lado.';
  const shouldShowEarlyExternalWarning = privateConversationMessageCount <= PRIVATE_EARLY_WARNING_MAX_MESSAGES;

  const statusLabel = isPartnerTyping
    ? 'escribiendo...'
    : isGroupChat
      ? `${otherParticipants.length} personas`
      : isPartnerRecentlyActiveInPrivate
        ? 'activo en privado'
        : partnerPresence.isOnline
          ? 'en línea'
          : formatLastSeen(partnerPresence.lastSeenMs);

  const shouldShowPartnerActiveDot = isGroupChat
    ? false
    : (isPartnerTyping || isPartnerRecentlyActiveInPrivate || partnerPresence.isOnline);

  const desktopStyle = isMobile ? {} : {
    right: `${16 + windowIndex * 392}px`,
    bottom: '16px',
    width: '376px',
    height: 'min(76vh, 720px)',
  };

  const minimizedStyle = isMobile
    ? {
      left: '12px',
      right: '12px',
      bottom: `${80 + (minimizedIndex * 64)}px`,
    }
    : {
      right: `${16 + minimizedIndex * 304}px`,
      bottom: '16px',
      width: '288px',
    };

  useEffect(() => {
    if (isMinimized) return;
    if (!shouldRestoreScrollRef.current) return;
    const container = messagesScrollRef.current;
    if (container) {
      container.scrollTop = savedScrollTopRef.current || 0;
    }
    shouldRestoreScrollRef.current = false;
  }, [isMinimized, messages.length, isPartnerTyping]);

  const handleMinimize = () => {
    savedScrollTopRef.current = messagesScrollRef.current?.scrollTop || 0;
    shouldRestoreScrollRef.current = true;
    onMinimize?.(chatId);
  };

  const handleRestore = () => {
    shouldRestoreScrollRef.current = true;
    onRestore?.(chatId);
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 60);
  };

  const triggerReply = (message) => {
    if (!message) return;
    setReplyTo(buildReplyPayload(message, primaryParticipant.username || 'Usuario'));
    inputRef.current?.focus({ preventScroll: true });
  };

  const handleSwipeStart = (event, message) => {
    if (!isMobile) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const messageKey = message?._realId || message?.id;
    if (!messageKey) return;
    swipeStateRef.current = {
      tracking: true,
      messageKey,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
    };
    setSwipeReplyMessageId(messageKey);
    setSwipeReplyOffset(0);
  };

  const handleSwipeMove = (event, message) => {
    if (!swipeStateRef.current.tracking) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const messageKey = message?._realId || message?.id;
    if (!messageKey || swipeStateRef.current.messageKey !== messageKey) return;

    const dx = touch.clientX - swipeStateRef.current.startX;
    const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
    if (dy > 40) {
      swipeStateRef.current.tracking = false;
      setSwipeReplyMessageId(null);
      setSwipeReplyOffset(0);
      return;
    }

    const clamped = Math.max(0, Math.min(dx * 0.65, 76));
    swipeStateRef.current.deltaX = clamped;
    setSwipeReplyOffset(clamped);
  };

  const handleSwipeEnd = (message) => {
    if (!swipeStateRef.current.tracking) {
      setSwipeReplyMessageId(null);
      setSwipeReplyOffset(0);
      return;
    }

    const shouldReply = swipeStateRef.current.deltaX >= 50;
    swipeStateRef.current.tracking = false;
    swipeStateRef.current.messageKey = null;
    setSwipeReplyMessageId(null);
    setSwipeReplyOffset(0);

    if (shouldReply) {
      triggerReply(message);
    }
  };

  if (isMinimized) {
    return (
      <div
        className="fixed z-[94] flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/95 px-3 py-2 text-white shadow-2xl backdrop-blur-xl"
        style={minimizedStyle}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={handleRestore}
        >
          <div className="relative">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={primaryParticipant.avatar} alt={conversationTitle} />
              <AvatarFallback>{conversationTitle.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            {!isGroupChat ? (
              <span
                className={[
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-950',
                  shouldShowPartnerActiveDot ? 'bg-emerald-400' : 'bg-zinc-500',
                ].join(' ')}
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{conversationTitle}</div>
            <div className="truncate text-[11px] text-zinc-400">
              {isPartnerTyping ? 'escribiendo...' : (buildPreview(messages[messages.length - 1]) || statusLabel)}
            </div>
          </div>
        </button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
          onClick={() => onClose?.(chatId)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={[
        'fixed z-[95] flex flex-col overflow-hidden border border-white/10 bg-zinc-950 text-white shadow-2xl backdrop-blur-xl',
        isMobile ? 'inset-0 rounded-none' : 'rounded-3xl',
      ].join(' ')}
      style={desktopStyle}
    >
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="relative">
          <Avatar className="h-11 w-11 border border-white/10">
            <AvatarImage src={primaryParticipant.avatar} alt={conversationTitle} />
            <AvatarFallback>{conversationTitle.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isGroupChat ? (
            <span
              className={[
                'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950',
                shouldShowPartnerActiveDot ? 'bg-emerald-400' : 'bg-zinc-500',
              ].join(' ')}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{conversationTitle}</div>
          <div className="truncate text-xs text-zinc-400">
            {statusLabel}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={handleMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => onClose?.(chatId)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isGroupChat ? (
        <div className="border-b border-white/10 bg-zinc-900/80 px-3 py-2">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {partnerSharedContact?.phone ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  Contacto compartido
                </div>
                <div className="mt-1 text-sm text-white">
                  {partnerSharedContact.username || conversationTitle} compartio su telefono:
                </div>
                <div className="mt-1 text-[11px] text-emerald-100/80">
                  {partnerContactVisibilityState.expiresAtMs
                    ? formatRemainingDuration(partnerContactVisibilityState.expiresAtMs)
                    : 'vigencia activa'}
                </div>
                <a
                  href={`tel:${partnerSharedContact.phone}`}
                  className="mt-1 inline-flex w-fit rounded-full border border-emerald-300/30 bg-black/20 px-3 py-1 text-sm font-semibold text-emerald-100 hover:bg-black/30"
                >
                  {partnerSharedContact.phone}
                </a>
              </div>
            ) : null}

            {incomingContactShareRequest ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2">
                <div className="text-sm text-white">
                  {incomingContactRequester?.username || 'Esta persona'} quiere compartir su telefono contigo.
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    disabled={isSubmittingContactShare}
                    onClick={() => handleRespondContactShare(true)}
                  >
                    Aceptar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    disabled={isSubmittingContactShare}
                    onClick={() => handleRespondContactShare(false)}
                  >
                    No ahora
                  </Button>
                </div>
              </div>
            ) : null}

            {myContactShareRequest?.status === 'pending' ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
                Tu solicitud para compartir telefono sigue pendiente.
              </div>
            ) : null}

            {mySharedContactVisibleToPartner ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                <div>Tu telefono ya fue compartido en este chat con aceptacion mutua.</div>
                <div className="mt-1 text-[11px] text-cyan-100/80">
                  {myContactVisibilityState.expiresAtMs
                    ? formatRemainingDuration(myContactVisibilityState.expiresAtMs)
                    : 'vigencia activa'}
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full border border-cyan-200/20 bg-black/10 text-cyan-50 hover:bg-black/20 hover:text-white"
                    disabled={isSubmittingContactShare}
                    onClick={handleRevokeContactShare}
                  >
                    Revocar
                  </Button>
                </div>
              </div>
            ) : null}

            {myContactVisibilityState.isExpired ? (
              <div className="rounded-2xl border border-zinc-400/20 bg-zinc-500/10 px-3 py-2 text-sm text-zinc-200">
                Tu permiso de contacto en este chat ya vencio.
              </div>
            ) : null}

            {partnerContactVisibilityState.isExpired ? (
              <div className="rounded-2xl border border-zinc-400/20 bg-zinc-500/10 px-3 py-2 text-sm text-zinc-200">
                El contacto compartido por la otra persona ya vencio.
              </div>
            ) : null}

            {!isContactGuideDismissed ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[12px] text-zinc-300">
                    {contactShareStatusText}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                    onClick={handleDismissContactGuide}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {canRequestContactShare ? (
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200"
                      disabled={isSubmittingContactShare}
                      onClick={handleRequestContactShare}
                    >
                      Compartir mi telefono
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div ref={messagesScrollRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 px-2.5 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {isInitialMessagesLoading ? (
            <div className="space-y-2 px-1 pb-1">
              <div className="ml-auto h-14 w-[58%] animate-pulse rounded-[22px] rounded-br-md bg-white/6" />
              <div className="h-14 w-[66%] animate-pulse rounded-[22px] rounded-bl-md bg-white/6" />
              <div className="ml-auto h-12 w-[44%] animate-pulse rounded-[22px] rounded-br-md bg-white/6" />
            </div>
          ) : null}

          {!isInitialMessagesLoading && hasMoreHistory ? (
            <div className="flex justify-center pb-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadOlderMessages}
                disabled={isLoadingOlderHistory}
                className="rounded-full border border-white/10 bg-white/5 px-4 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                {isLoadingOlderHistory ? 'Cargando mensajes anteriores...' : 'Cargar mensajes anteriores'}
              </Button>
            </div>
          ) : null}

          {messages.map((message) => {
            const isOwn = message.userId === user?.id;
            const isSystem = message.type === 'system';

            if (isSystem) {
              return (
                <div key={message.id} className="text-center text-xs text-zinc-500">
                  {message.content}
                </div>
              );
            }

            const status = isOwn ? messageStatus(message) : null;
            return (
              <div
                key={message.id}
                className={['flex', isOwn ? 'justify-end' : 'justify-start'].join(' ')}
              >
                {isMobile && swipeReplyMessageId === (message._realId || message.id) ? (
                  <div className="pointer-events-none mr-2 flex items-center text-emerald-400">
                    <CornerUpLeft className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={[
                    'max-w-[90%] sm:max-w-[88%] rounded-[22px] px-3 py-1.5 shadow-lg transition-opacity',
                    isOwn
                      ? 'rounded-br-md bg-emerald-500 text-zinc-950'
                      : 'rounded-bl-md bg-zinc-800 text-white',
                    message?._optimistic ? 'opacity-90' : '',
                  ].join(' ')}
                  style={
                    isMobile && swipeReplyMessageId === (message._realId || message.id)
                      ? {
                          transform: `translateX(${swipeReplyOffset}px)`,
                          transition: swipeReplyOffset > 0 ? 'none' : 'transform 0.16s ease-out',
                        }
                      : undefined
                  }
                  onTouchStart={(event) => handleSwipeStart(event, message)}
                  onTouchMove={(event) => handleSwipeMove(event, message)}
                  onTouchEnd={() => handleSwipeEnd(message)}
                  onTouchCancel={() => handleSwipeEnd(message)}
                >
                  {!isOwn ? (
                    <div className="mb-0.5 text-[11px] font-medium text-zinc-300">
                      {message.username || primaryParticipant.username || 'Usuario'}
                    </div>
                  ) : null}

                  {message.replyTo ? (
                    <div
                      className={[
                        'mb-1 rounded-2xl border px-2.5 py-1.5 text-[11px] leading-tight shadow-sm',
                        isOwn
                          ? 'border-white/30 bg-black/20 text-white'
                          : 'border-white/15 bg-black/25 text-zinc-100',
                      ].join(' ')}
                    >
                      <div className="font-semibold">
                        {message.replyTo.username || 'Usuario'}
                      </div>
                      <div className="truncate text-[11px] opacity-95">
                        {message.replyTo.content || 'Mensaje'}
                      </div>
                    </div>
                  ) : null}

                  {message.type === 'image' ? (
                    <a href={message.content} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl bg-black/20">
                      <img
                        src={message.content}
                        alt="Imagen enviada"
                        className="max-h-64 w-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <div className={['text-[14px] leading-[1.35]', isOwn ? 'text-zinc-950' : 'text-white'].join(' ')}>
                      <span className="whitespace-pre-wrap break-words">
                        {message.content}
                      </span>
                      <span className={['ml-2 inline-flex items-center gap-1 align-bottom whitespace-nowrap text-[10px] font-medium', isOwn ? 'text-zinc-950/90' : 'text-zinc-300'].join(' ')}>
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {isOwn ? renderStatusIcon(status, 'h-3 w-3') : null}
                      </span>
                    </div>
                  )}

                  {message.type === 'image' ? (
                    <div className={['mt-1 flex items-center gap-1 text-[10px] font-medium', isOwn ? 'justify-end text-zinc-950/90' : 'justify-end text-zinc-300'].join(' ')}>
                      <span>{formatMessageTime(message.timestamp)}</span>
                      {isOwn ? renderStatusIcon(status, 'h-3 w-3') : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {isPartnerTyping ? (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-3xl rounded-bl-md bg-zinc-800 px-4 py-3 text-zinc-300 shadow-lg">
                <div className="mb-1 text-[11px] font-medium text-zinc-400">
                  {typingUsers[0]?.username || primaryParticipant.username || 'Usuario'}
                </div>
                <TypingDots />
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      {showEmojiPicker ? (
        <div className="border-t border-white/10 bg-zinc-900/95 px-3 pb-3 pt-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-medium text-zinc-400">Emoticones</div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={() => setShowEmojiPicker(false)}
            >
              Cerrar
            </Button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {recentEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-full bg-white/5 px-2 py-1 text-lg hover:bg-white/10"
                onClick={() => handleEmojiClick({ emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className={isMobile ? 'max-h-[280px] overflow-hidden rounded-2xl border border-white/10' : 'rounded-2xl border border-white/10'}>
            <Suspense fallback={<div className="p-4 text-sm text-zinc-400">Cargando emoticones...</div>}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                autoFocusSearch={false}
                lazyLoadEmojis
                skinTonesDisabled
                searchDisabled={isMobile}
                width="100%"
                height={isMobile ? 260 : 320}
                emojiStyle={EmojiStyle.NATIVE}
                previewConfig={{ showPreview: false }}
                categories={[
                  Categories.SMILEYS_PEOPLE,
                  Categories.ANIMALS_NATURE,
                  Categories.FOOD_DRINK,
                  Categories.ACTIVITIES,
                  Categories.TRAVEL_PLACES,
                  Categories.SYMBOLS,
                ]}
              />
            </Suspense>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-zinc-950/95 px-3 py-3">
        {replyTo ? (
          <div className="mb-2 flex items-start gap-2 rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-500/14 via-violet-500/10 to-cyan-500/12 px-3 py-2 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
            <div className="mt-0.5 text-fuchsia-300">
              <CornerUpLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-fuchsia-200">
                Respondiendo a {replyTo.username || 'Usuario'}
              </div>
              <div className="truncate text-xs text-white/90">
                {replyTo.content || 'Mensaje'}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
        {isGuestMode ? (
          <div className="mb-2 flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
            <span>
              Invitado: {Math.min(guestPrivateSentCount, GUEST_PRIVATE_MESSAGES_LIMIT)}/{GUEST_PRIVATE_MESSAGES_LIMIT} mensajes privados.
              Sin fotos ni emojis.
            </span>
            {guestPrivateSentCount >= GUEST_PRIVATE_MESSAGES_LIMIT ? (
              <button
                type="button"
                className="shrink-0 font-semibold text-amber-200 hover:text-white"
                onClick={() => showGuestRegistrationPrompt('seguir enviando mensajes privados')}
              >
                Registrarme
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelected}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={[
              'h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5',
              isGuestMode
                ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-400'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
            onClick={() => {
              if (isGuestMode) {
                showGuestTextOnlyToast('usar emojis en privado');
                return;
              }
              setShowEmojiPicker((prev) => !prev);
            }}
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={[
              'h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5',
              isGuestMode
                ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-400'
                : 'text-zinc-300 hover:bg-white/10 hover:text-white',
            ].join(' ')}
            onClick={() => {
              if (isGuestMode) {
                showGuestTextOnlyToast('enviar fotos en privado');
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isUploadingPhoto}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={
                replyTo
                  ? 'Escribe tu respuesta'
                  : isGuestMode
                    ? 'Escribe un mensaje privado'
                    : (isPartnerTyping ? 'Responder...' : 'Escribe un mensaje')
              }
              className="h-11 rounded-full border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
            />
            {shouldShowEarlyExternalWarning ? (
              <p className="mt-1 px-2 text-[11px] text-zinc-500">
                Al inicio evita compartir telefono o redes. Primero conversen aqui y usa el boton de compartir cuando se habilite.
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
