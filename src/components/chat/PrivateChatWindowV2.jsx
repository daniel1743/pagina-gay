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
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { Check, CheckCheck, CornerUpLeft, ImagePlus, Minus, Send, Smile, X } from 'lucide-react';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import {
  sendRichPrivateChatMessage,
  subscribeToPrivateChatTyping,
  updatePrivateChatTypingStatus,
} from '@/services/socialService';
import { notificationSounds } from '@/services/notificationSounds';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const PHOTO_MAX_SIZE_BYTES = 140 * 1024;
const RECENT_EMOJIS_STORAGE_KEY = 'private_chat_v2_recent_emojis';

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
  onChatActivity,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasLoadedSnapshotRef = useRef(false);
  const isWindowFocusedRef = useRef(true);
  const savedScrollTopRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
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
    if (!chatId) return undefined;
    hasLoadedSnapshotRef.current = false;

    const q = query(
      collection(db, 'private_chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextMessages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setMessages(nextMessages);

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
    });

    return () => unsubscribe();
  }, [chatId, user?.id]);

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
    if (!chatId || !user?.id) return undefined;
    return subscribeToPrivateChatTyping(chatId, user.id, setTypingUsers);
  }, [chatId, user?.id]);

  useEffect(() => {
    if (!chatId || !user?.id) return undefined;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (!newMessage.trim()) {
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
      return undefined;
    }

    updatePrivateChatTypingStatus(chatId, user.id, true, user.username).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => {
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    }, 1800);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatId, newMessage, user?.id, user?.username]);

  useEffect(() => () => {
    if (chatId && user?.id) {
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    }
  }, [chatId, user?.id, user?.username]);

  useEffect(() => {
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
    onChatActivity({
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
    });
  }, [
    chatId,
    chatParticipants,
    conversationTitle,
    isGroupChat,
    messages,
    onChatActivity,
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
    if (status === 'read') {
      return <CheckCheck className={`${className} text-sky-500`} />;
    }
    if (status === 'delivered') {
      return <CheckCheck className={className} />;
    }
    return <Check className={className} />;
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const contentToSend = newMessage.trim();
    if (!contentToSend || !chatId || !user?.id) return;
    const replyToSend = replyTo;

    setNewMessage('');
    setShowEmojiPicker(false);
    setReplyTo(null);

    try {
      await sendRichPrivateChatMessage(chatId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: contentToSend,
        type: 'text',
        senderIsPremium: Boolean(user?.isPremium),
        replyTo: replyToSend,
      });

      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
      notificationSounds.playMessageSentSound();
      inputRef.current?.focus();
    } catch (error) {
      setNewMessage(contentToSend);
      setReplyTo(replyToSend);
      console.error('[PRIVATE_CHAT_V2] Error sending private message:', error);
      console.info('[PRIVATE_CHAT_DEBUG] Ejecuta window.printPrivateChatDebug?.() o inspecciona window.__lastPrivateChatDebug');
      toast({
        title: 'No pudimos enviar el mensaje',
        description: 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    }
  };

  const handleEmojiClick = (emojiObject) => {
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

  const statusLabel = isPartnerTyping
    ? 'escribiendo...'
    : isGroupChat
      ? `${otherParticipants.length} personas`
      : partnerPresence.isOnline
        ? 'en línea'
        : formatLastSeen(partnerPresence.lastSeenMs);

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
                  partnerPresence.isOnline ? 'bg-emerald-400' : 'bg-zinc-500',
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
                partnerPresence.isOnline ? 'bg-emerald-400' : 'bg-zinc-500',
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

      <div ref={messagesScrollRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 px-2.5 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
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
                    'max-w-[90%] sm:max-w-[88%] rounded-[22px] px-3 py-1.5 shadow-lg',
                    isOwn
                      ? 'rounded-br-md bg-emerald-500 text-zinc-950'
                      : 'rounded-bl-md bg-zinc-800 text-white',
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
                        'mb-1 rounded-2xl border px-2.5 py-1.5 text-[11px] leading-tight',
                        isOwn
                          ? 'border-zinc-900/15 bg-zinc-950/10 text-zinc-900/80'
                          : 'border-white/10 bg-white/5 text-zinc-300',
                      ].join(' ')}
                    >
                      <div className="font-medium">
                        {message.replyTo.username || 'Usuario'}
                      </div>
                      <div className="truncate opacity-80">
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
                      <span className={['ml-2 inline-flex items-center gap-1 align-bottom whitespace-nowrap text-[10px]', isOwn ? 'text-zinc-900/70' : 'text-zinc-400'].join(' ')}>
                        <span>{formatMessageTime(message.timestamp)}</span>
                        {isOwn ? renderStatusIcon(status, 'h-3 w-3') : null}
                      </span>
                    </div>
                  )}

                  {message.type === 'image' ? (
                    <div className={['mt-1 flex items-center gap-1 text-[10px]', isOwn ? 'justify-end text-zinc-900/75' : 'justify-end text-zinc-400'].join(' ')}>
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
          <div className="mb-2 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white">
            <div className="mt-0.5 text-emerald-400">
              <CornerUpLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-emerald-300">
                Respondiendo a {replyTo.username || 'Usuario'}
              </div>
              <div className="truncate text-xs text-zinc-400">
                {replyTo.content || 'Mensaje'}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
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
            className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile className="h-5 w-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={replyTo ? 'Escribe tu respuesta' : (isPartnerTyping ? 'Responder...' : 'Escribe un mensaje')}
              className="h-11 rounded-full border-white/10 bg-white/5 px-4 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
            />
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
