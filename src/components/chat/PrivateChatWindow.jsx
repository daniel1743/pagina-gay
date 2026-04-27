import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Shield, PhoneOff, User, MoreVertical, Smile, Minus, MessageCircle, BellOff, Bell, Flag, Archive, Trash2, UserPlus, UserMinus, Check, CheckCheck, Image, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, writeBatch, arrayUnion, updateDoc, increment, deleteField } from 'firebase/firestore';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { db, storage } from '@/config/firebase';
import { blockUser, isBlocked } from '@/services/blockService';
import { createReport } from '@/services/reportService';
import {
  subscribeToPrivateChatTyping,
  updatePrivateChatTypingStatus,
  addToFavorites,
  removeFromFavorites,
  sendPrivateGroupInvite,
  sendRichPrivateChatMessage,
} from '@/services/socialService';
import { subscribeToRoomUsers } from '@/services/presenceService';
import { notificationSounds } from '@/services/notificationSounds';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const RECENT_EMOJIS_STORAGE_KEY = 'private_chat_recent_emojis_v1';
const DEFAULT_RECENT_EMOJIS = ['😂', '😍', '🔥', '😘', '😉', '😈', '😏', '🥵', '❤️', '😎'];
const DELETE_CONFIRM_TEXT = 'ELIMINAR';
const PHOTO_MAX_SIZE_BYTES = 140 * 1024;
const GUEST_PRIVATE_MESSAGES_LIMIT = 15;
const PRIVATE_IMAGE_REACTIONS = [
  {
    key: 'fire',
    emoji: '🔥',
    title: 'Reaccionar con fuego',
    buttonClass: 'hover:text-orange-300',
    pillClass: 'bg-orange-500/15 text-orange-300',
  },
  {
    key: 'heart',
    emoji: '❤️',
    title: 'Reaccionar con corazón',
    buttonClass: 'hover:text-pink-300',
    pillClass: 'bg-pink-500/15 text-pink-300',
  },
  {
    key: 'devil',
    emoji: '😈',
    title: 'Reaccionar con diablito',
    buttonClass: 'hover:text-purple-300',
    pillClass: 'bg-purple-500/15 text-purple-300',
  },
];

const getTimestampMs = (value) => {
  if (!value) return null;
  if (value?.toMillis) return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const getStoredChatSet = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item) => typeof item === 'string' && item.trim()));
  } catch {
    return new Set();
  }
};

const saveStoredChatSet = (storageKey, setValue) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...setValue]));
  } catch {
    // noop
  }
};

const formatRelativeTime = (timestampMs) => {
  if (!timestampMs) return 'Hace un rato';
  const diffMs = Date.now() - timestampMs;
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
};

const formatMessageTime = (value) => {
  const timestampMs = getTimestampMs(value);
  if (!timestampMs) return '';
  return new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getMessagePreview = (message) => {
  if (!message) return '';
  if (message.type === 'image') return '📷 Foto';
  if (message.type === 'system') return 'Mensaje del sistema';
  const text = typeof message.content === 'string' ? message.content.trim() : '';
  if (!text) return 'Mensaje';
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const normalizeParticipant = (participant = {}) => {
  const userId = participant?.userId || participant?.id || '';
  return {
    id: userId,
    userId,
    username: participant?.username || 'Usuario',
    avatar: participant?.avatar || '',
    isPremium: Boolean(participant?.isPremium),
    role: participant?.role || participant?.rol || '',
    isGuest: Boolean(participant?.isGuest),
    isAnonymous: Boolean(participant?.isAnonymous),
  };
};

const dedupeParticipants = (participants = []) => {
  const seen = new Set();
  return participants
    .map((participant) => normalizeParticipant(participant))
    .filter((participant) => {
      if (!participant.userId || seen.has(participant.userId)) return false;
      seen.add(participant.userId);
      return true;
    });
};

const buildGroupLabel = (participants = [], currentUserId = null) => {
  const names = dedupeParticipants(participants)
    .filter((participant) => participant.userId !== currentUserId)
    .map((participant) => participant.username)
    .filter(Boolean);

  if (names.length === 0) return 'Chat grupal privado';
  return names.slice(0, 3).join(', ');
};

const PrivateChatWindow = ({
  user,
  partner,
  participants = [],
  title = '',
  onClose,
  chatId,
  initialMessage = '',
  autoFocus = true,
  roomId = null,
  onEnterPrivate,
  onLeavePrivate,
  windowIndex = 0,
  onViewProfile,
  onArchiveConversation,
  onDeleteConversation,
  onChatActivity,
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [blockState, setBlockState] = useState({ blockedByMe: false, blockedByOther: false });
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoTooltip, setShowPhotoTooltip] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [minimizedUnreadCount, setMinimizedUnreadCount] = useState(0);
  const [isMobileEmojiSheet, setIsMobileEmojiSheet] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));
  const [recentEmojis, setRecentEmojis] = useState(DEFAULT_RECENT_EMOJIS);
  const [isMuted, setIsMuted] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('acoso');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [revealedImageIds, setRevealedImageIds] = useState(() => new Set());
  const [connectedRoomUsers, setConnectedRoomUsers] = useState([]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSendingGroupInvite, setIsSendingGroupInvite] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState({
    isOnline: Boolean(partner?.estaOnline || partner?.isOnline),
    lastSeenMs: getTimestampMs(partner?.ultimaConexion || partner?.lastSeen),
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const photoInputRef = useRef(null);
  const wrapperRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingPublishedRef = useRef(false);
  const hasLoadedSnapshotRef = useRef(false);
  const leaveNotifiedRef = useRef(false);
  const isMinimizedRef = useRef(false);
  const isMutedRef = useRef(false);
  const lastActivitySignatureRef = useRef('');

  const chatParticipants = useMemo(() => {
    const fallbackParticipants = [
      user ? {
        userId: user.id || user.userId,
        username: user.username,
        avatar: user.avatar,
        isPremium: user.isPremium,
        role: user.role || user.rol,
        isGuest: user.isGuest,
        isAnonymous: user.isAnonymous,
      } : null,
      partner ? {
        userId: partner.id || partner.userId,
        username: partner.username,
        avatar: partner.avatar,
        isPremium: partner.isPremium,
        role: partner.role || partner.rol,
        isGuest: partner.isGuest,
        isAnonymous: partner.isAnonymous,
      } : null,
    ].filter(Boolean);
    const incomingParticipants = Array.isArray(participants) && participants.length > 0
      ? participants
      : fallbackParticipants;
    return dedupeParticipants(incomingParticipants);
  }, [participants, partner, user]);
  const isGroupChat = chatParticipants.length > 2;
  const otherParticipants = useMemo(
    () => chatParticipants.filter((participant) => participant.userId !== user?.id),
    [chatParticipants, user?.id]
  );
  const primaryParticipant = otherParticipants[0] || normalizeParticipant(partner || {});
  const partnerId = isGroupChat ? null : (primaryParticipant.userId || null);
  const partnerName = isGroupChat
    ? (title?.trim() || buildGroupLabel(chatParticipants, user?.id))
    : (primaryParticipant.username || partner?.username || 'Usuario');
  const allOtherParticipantIds = useMemo(
    () => otherParticipants.map((participant) => participant.userId).filter(Boolean),
    [otherParticipants]
  );
  const groupSubtitle = useMemo(
    () => otherParticipants.map((participant) => participant.username).filter(Boolean).join(', '),
    [otherParticipants]
  );
  const isChatBlocked = blockState.blockedByMe || blockState.blockedByOther;
  const isRegisteredUser = Boolean(user?.id && !user?.isGuest && !user?.isAnonymous);
  const canSendPhotoNow = isRegisteredUser && !isChatBlocked && Boolean(chatId);
  const mutedStorageKey = `private_chat_muted_v1_${user?.id || 'anon'}`;
  const archivedStorageKey = `private_chat_archived_v1_${user?.id || 'anon'}`;
  const deletedStorageKey = `private_chat_deleted_v1_${user?.id || 'anon'}`;
  const guestPrivateCounterKey = useMemo(
    () => `private_chat_guest_counter_v1_${user?.id || 'anon'}_${chatId || 'nochat'}`,
    [user?.id, chatId]
  );
  const [guestPrivateSentCount, setGuestPrivateSentCount] = useState(0);
  const inviteCandidates = useMemo(() => {
    const excludedIds = new Set(chatParticipants.map((participant) => participant.userId).filter(Boolean));
    return connectedRoomUsers
      .map((roomUser) => normalizeParticipant(roomUser))
      .filter((roomUser) => (
        roomUser.userId
        && !excludedIds.has(roomUser.userId)
        && !roomUser.isGuest
        && !roomUser.isAnonymous
      ))
      .sort((a, b) => a.username.localeCompare(b.username, 'es', { sensitivity: 'base' }));
  }, [chatParticipants, connectedRoomUsers]);
  const canInviteMorePeople = Boolean(
    roomId
    && user?.id
    && isRegisteredUser
    && chatId
    && chatParticipants.length >= 2
    && chatParticipants.length < 4
    && inviteCandidates.length > 0
  );

  const isMobileViewport = isMobileEmojiSheet;
  const desktopWindowWidth = 420;
  const desktopWindowGap = 16;
  const minimizedWindowWidth = 330;
  const floatingWindowStyle = isMobileViewport
    ? { left: '0.5rem', right: '0.5rem' }
    : { right: `${16 + (windowIndex * (desktopWindowWidth + desktopWindowGap))}px` };
  const minimizedWindowStyle = isMobileViewport
    ? { left: '0.5rem', right: '0.5rem' }
    : { right: `${16 + (windowIndex * (minimizedWindowWidth + 12))}px` };

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!roomId) {
      setConnectedRoomUsers([]);
      return undefined;
    }
    const unsubscribe = subscribeToRoomUsers(roomId, (usersInRoom) => {
      setConnectedRoomUsers(Array.isArray(usersInRoom) ? usersInRoom : []);
    });
    return () => unsubscribe?.();
  }, [roomId]);

  // Notificar que estoy en chat privado (para que otros en la sala vean el indicador)
  useEffect(() => {
    const privateMarkerId = isGroupChat ? `group:${chatId || partnerName}` : partnerId;
    if (roomId && onEnterPrivate && privateMarkerId && partnerName) {
      onEnterPrivate(roomId, privateMarkerId, partnerName);
    }
    return () => {
      if (roomId && onLeavePrivate) {
        onLeavePrivate(roomId);
      }
    };
  }, [roomId, onEnterPrivate, onLeavePrivate, isGroupChat, chatId, partnerId, partnerName]); // onEnterPrivate/onLeavePrivate son estables

  const emojiPickerCategories = useMemo(() => ([
    { name: 'Recientes', category: Categories.SUGGESTED },
    { name: 'Sonrisas y Emociones', category: Categories.SMILEYS_PEOPLE },
    { name: 'Animales y Naturaleza', category: Categories.ANIMALS_NATURE },
    { name: 'Comida y Bebida', category: Categories.FOOD_DRINK },
    { name: 'Viajes y Lugares', category: Categories.TRAVEL_PLACES },
    { name: 'Actividades', category: Categories.ACTIVITIES },
    { name: 'Objetos', category: Categories.OBJECTS },
    { name: 'Símbolos', category: Categories.SYMBOLS },
    { name: 'Banderas', category: Categories.FLAGS },
  ]), []);

  const isPartnerTyping = typingUsers.length > 0;
  const statusText = isGroupChat
    ? (isPartnerTyping ? 'Alguien está escribiendo...' : `${chatParticipants.length} participantes`)
    : (isPartnerTyping
      ? 'Escribiendo...'
      : partnerPresence?.isOnline
        ? 'En línea'
        : partnerPresence?.lastSeenMs
          ? `Activo ${formatRelativeTime(partnerPresence.lastSeenMs)}`
          : 'Desconectado');

  useEffect(() => {
    if (!chatId) return;
    const mutedSet = getStoredChatSet(mutedStorageKey);
    const archivedSet = getStoredChatSet(archivedStorageKey);
    setIsMuted(mutedSet.has(chatId));
    setIsArchived(archivedSet.has(chatId));
  }, [chatId, mutedStorageKey, archivedStorageKey]);

  useEffect(() => {
    if (isRegisteredUser || !chatId) {
      setGuestPrivateSentCount(0);
      return;
    }
    try {
      const raw = localStorage.getItem(guestPrivateCounterKey);
      const parsed = Number(raw || 0);
      setGuestPrivateSentCount(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
    } catch {
      setGuestPrivateSentCount(0);
    }
  }, [chatId, guestPrivateCounterKey, isRegisteredUser]);

  const showGuestPrivateLimitToast = () => {
    toast({
      title: 'Límite alcanzado',
      description: 'Has alcanzado el máximo de mensajes en personas no registradas. Regístrate para un mayor envío.',
      duration: 4500,
      action: {
        label: 'Registrarme',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.assign('/auth');
          }
        },
      },
    });
  };

  const registerGuestPrivateMessage = () => {
    if (isRegisteredUser) return;
    const nextCount = guestPrivateSentCount + 1;
    setGuestPrivateSentCount(nextCount);
    try {
      localStorage.setItem(guestPrivateCounterKey, String(nextCount));
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!user?.id || !partnerId || isGroupChat) return;
    let active = true;

    const loadFriendStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        const favoriteIds = userDoc.data()?.favorites || [];
        if (active) {
          setIsFriend(Array.isArray(favoriteIds) && favoriteIds.includes(partnerId));
        }
      } catch {
        if (active) setIsFriend(false);
      }
    };

    loadFriendStatus();
    return () => { active = false; };
  }, [user?.id, partnerId, isGroupChat]);

  // Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!chatId) return;
    hasLoadedSnapshotRef.current = false;

    const messagesRef = collection(db, 'private_chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        timestamp: docSnap.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setMessages(newMessages);
      const canMarkAsRead = !isMinimizedRef.current && !document.hidden;
      markIncomingMessagesStatus(newMessages, { markRead: canMarkAsRead });

      // No sonar en primera carga para evitar ruido con historial
      if (!hasLoadedSnapshotRef.current) {
        hasLoadedSnapshotRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const data = change.doc.data() || {};
        const isOwn = data.userId === user?.id;
        const isSystem = data.type === 'system';
        if (!isOwn && !isSystem) {
          if (!isMutedRef.current) {
            notificationSounds.playMessageSound();
          }
          if (isMinimizedRef.current) {
            setMinimizedUnreadCount((prev) => prev + 1);
          }
        }
      });
    }, (error) => {
      console.error('Error subscribing to private chat messages:', error);
    });

    return () => unsubscribe();
  }, [chatId, user?.id]);

  useEffect(() => {
    if (isMinimized || document.hidden) return;
    markIncomingMessagesStatus(messages, { markRead: true });
  }, [isMinimized, messages, chatId, user?.id]);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;
    const validMessageIds = new Set(messages.map((msg) => msg?.id).filter(Boolean));
    setRevealedImageIds((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (validMessageIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [messages]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden && !isMinimizedRef.current) {
        markIncomingMessagesStatus(messages, { markRead: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [messages, chatId, user?.id]);

  useEffect(() => {
    if (typeof onChatActivity !== 'function' || !chatId) return;
    const latestMessage = Array.isArray(messages) && messages.length > 0
      ? messages[messages.length - 1]
      : null;
    if (!latestMessage) return;

    const timestampMs = getTimestampMs(latestMessage.timestamp) || Date.now();
    const signature = `${chatId}:${latestMessage.id || 'msg'}:${timestampMs}`;
    if (lastActivitySignatureRef.current === signature) return;
    lastActivitySignatureRef.current = signature;

    onChatActivity({
      chatId,
      roomId: roomId || null,
      partner: {
        id: primaryParticipant.userId || chatId,
        userId: primaryParticipant.userId || chatId,
        username: partnerName,
        avatar: primaryParticipant.avatar || '',
        isPremium: Boolean(primaryParticipant.isPremium),
      },
      participants: chatParticipants,
      title: isGroupChat ? partnerName : '',
      lastMessagePreview: getMessagePreview(latestMessage),
      lastMessageAt: timestampMs,
    });
  }, [
    chatId,
    chatParticipants,
    isGroupChat,
    messages,
    onChatActivity,
    primaryParticipant.avatar,
    primaryParticipant.isPremium,
    primaryParticipant.userId,
    partnerId,
    partnerName,
    roomId,
  ]);

  // Estado de bloqueo
  useEffect(() => {
    if (!user?.id || !partnerId || isGroupChat) return;
    let active = true;

    const checkBlockStatus = async () => {
      try {
        const [blockedByMe, blockedByOther] = await Promise.all([
          isBlocked(user.id, partnerId),
          isBlocked(partnerId, user.id),
        ]);
        if (active) {
          setBlockState({ blockedByMe, blockedByOther });
        }
      } catch (error) {
        console.warn('[PRIVATE CHAT] Error verificando bloqueo:', error);
      }
    };

    checkBlockStatus();
    return () => {
      active = false;
    };
  }, [user?.id, partnerId, isGroupChat]);

  // Presencia del partner (dot online + estado)
  useEffect(() => {
    if (!partnerId || isGroupChat) return;

    const tarjetaRef = doc(db, 'tarjetas', partnerId);
    const unsubscribe = onSnapshot(tarjetaRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() || {};
      setPartnerPresence({
        isOnline: data.estaOnline === true,
        lastSeenMs: getTimestampMs(data.ultimaConexion),
      });
    }, () => {
      // Fallback silencioso: mantener estado actual
    });

    return () => unsubscribe();
  }, [partnerId, isGroupChat]);

  // Suscripción typing
  useEffect(() => {
    if (!chatId || !user?.id) return;
    const unsubscribe = subscribeToPrivateChatTyping(chatId, user.id, setTypingUsers);
    return () => unsubscribe?.();
  }, [chatId, user?.id]);

  // Publicar typing status
  useEffect(() => {
    if (!chatId || !user?.id) return;
    if (isChatBlocked) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const trimmed = newMessage.trim();
    if (!trimmed) {
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
  }, [newMessage, chatId, user?.id, user?.username, isChatBlocked]);

  // Limpiar typing al desmontar
  useEffect(() => () => {
    if (chatId && user?.id && typingPublishedRef.current) {
      typingPublishedRef.current = false;
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    }
  }, [chatId, user?.id, user?.username]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Autofocus
  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [autoFocus, chatId]);

  // Restaurar emojis recientes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const cleaned = parsed.filter((item) => typeof item === 'string' && item.trim()).slice(0, 16);
      if (cleaned.length > 0) setRecentEmojis(cleaned);
    } catch {
      // noop
    }
  }, []);

  // Cerrar emoji picker al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowEmojiPicker(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showEmojiPicker]);

  // Detectar viewport para emoji sheet móvil
  useEffect(() => {
    const handleResize = () => setIsMobileEmojiSheet(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject?.emoji;
    if (!emoji) return;
    setNewMessage((prev) => prev + emoji);
    registerRecentEmoji(emoji);
    inputRef.current?.focus({ preventScroll: true });
  };

  const buildPhotoBlockedDescription = () => {
    if (!isRegisteredUser) {
      return 'Debes iniciar sesión para subir fotos.';
    }
    if (isChatBlocked) {
      return 'No puedes subir fotos porque este chat está bloqueado.';
    }
    if (!chatId) {
      return 'No hay un chat privado activo para subir fotos.';
    }
    return '';
  };

  const getPhotoTooltipText = () => {
    if (canSendPhotoNow) {
      return isUploadingPhoto ? 'Subiendo foto...' : 'Subir foto';
    }
    return buildPhotoBlockedDescription();
  };

  const showPhotoBlockedToast = () => {
    toast({
      title: !isRegisteredUser ? 'Debes iniciar sesión' : 'No disponible',
      description: buildPhotoBlockedDescription(),
      duration: 4200,
    });
  };

  const getImageExtension = (contentType = '') => {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('heic')) return 'heic';
    if (contentType.includes('heif')) return 'heif';
    return 'jpg';
  };

  const compressImageForChat = async (file) => {
    const compressionOptions = {
      maxSizeMB: 0.14,
      maxWidthOrHeight: 960,
      useWebWorker: true,
      initialQuality: 0.68,
    };

    const compressed = await imageCompression(file, compressionOptions);
    if (compressed.size > PHOTO_MAX_SIZE_BYTES) {
      throw new Error('La imagen supera 140 KB tras compresión. Prueba otra imagen o recórtala antes de subir.');
    }
    return compressed;
  };

  const handlePhotoFileSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) return;
    if (!canSendPhotoNow) {
      showPhotoBlockedToast();
      return;
    }
    if (!selectedFile.type?.startsWith('image/')) {
      toast({
        title: 'Archivo no permitido',
        description: 'Solo se permiten archivos de imagen.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const optimizedFile = await compressImageForChat(selectedFile);
      const tempMessageId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `private_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const assetId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const extension = getImageExtension(optimizedFile.type);
      const mediaPath = `chat_media/private/${user?.id || 'unknown'}/${chatId}/${tempMessageId}/${assetId}.${extension}`;

      const fileRef = storageRef(storage, mediaPath);
      await uploadBytes(fileRef, optimizedFile, {
        contentType: optimizedFile.type,
        customMetadata: {
          roomId: `private_${chatId}`,
          userId: user?.id || '',
          feature: 'chat_photo_access_private',
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
      });

      notificationSounds.playMessageSentSound();
      setShowEmojiPicker(false);
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
      toast({
        title: 'Foto enviada',
        description: 'Se publicó correctamente en el chat privado.',
        duration: 3200,
      });
    } catch (error) {
      console.error('Error sending private image message:', error);
      toast({
        title: 'No se pudo subir la foto',
        description: error?.message || 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
      setShowPhotoTooltip(false);
    }
  };

  const handlePhotoButtonClick = () => {
    if (isUploadingPhoto) return;
    if (!canSendPhotoNow) {
      showPhotoBlockedToast();
      return;
    }
    photoInputRef.current?.click();
  };

  const handleInviteParticipant = async (candidate) => {
    if (!canInviteMorePeople || !candidate?.userId || !user?.id || !chatId) return;
    setIsSendingGroupInvite(true);
    try {
      await sendPrivateGroupInvite({
        sourceChatId: chatId,
        inviterId: user.id,
        existingParticipants: chatParticipants,
        invitee: candidate,
      });
      toast({
        title: 'Invitación enviada',
        description: `Se invitó a ${candidate.username}. Deben aceptar ${candidate.username} y quienes ya están en este chat.`,
      });
      setIsInviteDialogOpen(false);
    } catch (error) {
      const description = error?.message === 'USER_ALREADY_IN_CHAT'
        ? 'Ese usuario ya forma parte de la conversación.'
        : error?.message === 'GROUP_CHAT_LIMIT_EXCEEDED'
          ? 'El chat privado admite hasta 4 participantes.'
          : error?.message === 'BLOCKED'
            ? 'No puedes invitar a ese usuario por un bloqueo activo.'
            : 'No se pudo enviar la invitación. Intenta nuevamente.';
      toast({
        title: 'No se pudo invitar',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSendingGroupInvite(false);
    }
  };

  const togglePrivateImageBlur = (messageId) => {
    if (!messageId) return;
    setRevealedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handlePrivateImageReaction = async (message, reactionKey) => {
    if (!chatId || !message?.id || !reactionKey || !user?.id) return;
    if (message.userId === user.id) return;

    try {
      const messageRef = doc(db, 'private_chats', chatId, 'messages', message.id);
      const currentReaction = message?.reactionUsers?.[user.id] || null;
      const currentReactions = message?.reactions || {};
      const updates = {};

      // Toggle: si toca la misma reacción, se elimina.
      if (currentReaction === reactionKey) {
        if (Number(currentReactions[reactionKey] || 0) > 0) {
          updates[`reactions.${reactionKey}`] = increment(-1);
        }
        updates[`reactionUsers.${user.id}`] = deleteField();
      } else {
        // Si ya tenía otra reacción, moverla a la nueva (1 reacción por usuario/foto).
        if (currentReaction && Number(currentReactions[currentReaction] || 0) > 0) {
          updates[`reactions.${currentReaction}`] = increment(-1);
        }
        updates[`reactions.${reactionKey}`] = increment(1);
        updates[`reactionUsers.${user.id}`] = reactionKey;
      }

      await updateDoc(messageRef, {
        ...updates,
      });
    } catch (error) {
      console.error('[PRIVATE CHAT] Error reaccionando imagen:', error);
      toast({
        title: 'No se pudo reaccionar',
        description: 'Intenta nuevamente en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  const notifyLeaveOnce = async () => {
    if (!chatId || !user?.id || leaveNotifiedRef.current) return;
    leaveNotifiedRef.current = true;

    // Quitar typing al salir
    updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});

    try {
      const messagesRef = collection(db, 'private_chats', chatId, 'messages');
      await addDoc(messagesRef, {
        userId: 'system',
        username: 'Sistema',
        avatar: '',
        content: `${user.username} ha terminado la conversación`,
        type: 'system',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending leave notification:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    if (isChatBlocked) {
      toast({
        title: 'Chat no disponible',
        description: 'No puedes enviar mensajes en este chat.',
        variant: 'destructive',
      });
      return;
    }

    const contentToSend = newMessage.trim();
    if (!isRegisteredUser && guestPrivateSentCount >= GUEST_PRIVATE_MESSAGES_LIMIT) {
      showGuestPrivateLimitToast();
      return;
    }

    try {
      await sendRichPrivateChatMessage(chatId, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: contentToSend,
        type: 'text',
        senderIsPremium: Boolean(user?.isPremium),
      });

      notificationSounds.playMessageSentSound();
      registerGuestPrivateMessage();
      setNewMessage('');
      setShowEmojiPicker(false);
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    } catch (error) {
      console.error('Error sending private message:', error);
      const moderationReason = error?.moderationResult?.reason || null;
      toast({
        title: moderationReason ? 'Mensaje bloqueado por seguridad' : 'No pudimos enviar el mensaje',
        description: moderationReason || 'Intenta de nuevo en un momento',
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = () => {
    if (!partnerId || isGroupChat) return;
    const doBlock = async () => {
      try {
        await blockUser(user.id, partnerId, { source: 'private_chat' });
        setBlockState((prev) => ({ blockedByMe: true, blockedByOther: prev.blockedByOther }));
        await notifyLeaveOnce();
        toast({
          title: `Has bloqueado a ${partnerName}`,
          description: 'No recibirás más mensajes de este usuario.',
          variant: 'destructive',
        });
        onClose?.(chatId);
      } catch (error) {
        console.error('Error bloqueando usuario:', error);
        toast({
          title: 'No pudimos bloquear',
          description: 'Intenta de nuevo en un momento',
          variant: 'destructive',
        });
      }
    };
    doBlock();
  };

  const handleVisitProfile = () => {
    if (isGroupChat) return;
    if (typeof onViewProfile === 'function') {
      onViewProfile({ ...primaryParticipant });
      return;
    }
    toast({ title: `Perfil de ${partnerName}`, description: 'Abriremos esta vista desde tu flujo actual.' });
  };

  const handleLeaveChat = () => {
    notifyLeaveOnce();
    toast({ title: isGroupChat ? 'Has salido del chat grupal privado' : `Has abandonado el chat con ${partnerName}` });
    onClose?.(chatId);
  };

  const handleToggleMute = () => {
    if (!chatId) return;
    const nextMuted = !isMuted;
    const mutedSet = getStoredChatSet(mutedStorageKey);
    if (nextMuted) mutedSet.add(chatId);
    else mutedSet.delete(chatId);
    saveStoredChatSet(mutedStorageKey, mutedSet);
    setIsMuted(nextMuted);
    toast({
      title: nextMuted ? 'Usuario silenciado' : 'Usuario con sonido activo',
      description: nextMuted ? 'No escucharás notificaciones de este chat.' : 'Las notificaciones volvieron a activarse.',
    });
  };

  const handleArchiveConversation = () => {
    if (!chatId) return;
    const archivedSet = getStoredChatSet(archivedStorageKey);
    archivedSet.add(chatId);
    saveStoredChatSet(archivedStorageKey, archivedSet);
    setIsArchived(true);
    notifyLeaveOnce();
    toast({ title: 'Conversación archivada' });
    onArchiveConversation?.(chatId);
    onClose?.(chatId);
  };

  const handleToggleFriend = async () => {
    if (!user?.id || !partnerId || isGroupChat) return;
    if (primaryParticipant?.isGuest || primaryParticipant?.isAnonymous) {
      toast({
        title: 'No disponible',
        description: 'Este usuario no puede agregarse a la lista de amigos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isFriend) {
        await removeFromFavorites(user.id, partnerId);
        setIsFriend(false);
        toast({ title: 'Eliminado de tu lista de amigos' });
      } else {
        await addToFavorites(user.id, partnerId);
        setIsFriend(true);
        toast({ title: 'Agregado a tu lista de amigos' });
      }
    } catch (error) {
      toast({
        title: 'No pudimos actualizar tu lista',
        description: error?.message === 'FAVORITES_LIMIT_REACHED'
          ? 'Solo puedes tener hasta 15 amigos.'
          : 'Intenta nuevamente en un momento.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConversation = () => {
    if (!chatId) return;
    const deletedSet = getStoredChatSet(deletedStorageKey);
    deletedSet.add(chatId);
    saveStoredChatSet(deletedStorageKey, deletedSet);
    notifyLeaveOnce();
    toast({ title: 'Conversación eliminada de tu vista' });
    onDeleteConversation?.(chatId);
    onClose?.(chatId);
  };

  const markIncomingMessagesStatus = async (messageList, { markRead = false } = {}) => {
    if (!chatId || !user?.id || !Array.isArray(messageList) || messageList.length === 0) return;

    const batch = writeBatch(db);
    let hasUpdates = false;

    messageList.forEach((msg) => {
      if (!msg?.id || msg?.type === 'system' || msg?.userId === user.id) return;

      const deliveredTo = Array.isArray(msg.deliveredTo) ? msg.deliveredTo : [];
      const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
      const updates = {};

      if (!deliveredTo.includes(user.id)) {
        updates.deliveredTo = arrayUnion(user.id);
        if (!msg.deliveredAt) updates.deliveredAt = serverTimestamp();
      }

      if (markRead && !readBy.includes(user.id)) {
        updates.readBy = arrayUnion(user.id);
        if (!msg.readAt) updates.readAt = serverTimestamp();
      }

      if (Object.keys(updates).length > 0) {
        const msgRef = doc(db, 'private_chats', chatId, 'messages', msg.id);
        batch.update(msgRef, updates);
        hasUpdates = true;
      }
    });

    if (!hasUpdates) return;
    try {
      await batch.commit();
    } catch {
      // Puede fallar si rules no desplegadas todavía; evitar ruido
    }
  };

  const handleSubmitReport = async () => {
    if (!partnerId || !user?.id || isGroupChat) return;
    setIsSubmittingReport(true);
    try {
      await createReport({
        reporterUsername: user.username || 'Usuario',
        reportedUserId: partnerId,
        reportedUsername: partnerName,
        targetId: partnerId,
        targetUsername: partnerName,
        reason: reportReason,
        type: reportReason,
        description: reportDescription || `Reporte desde chat privado (${reportReason})`,
        context: 'private_chat',
        roomId: chatId || null,
      });
      toast({ title: 'Reporte enviado', description: 'Gracias. Revisaremos este caso.' });
      setIsReportDialogOpen(false);
      setReportDescription('');
      setReportReason('acoso');
    } catch (error) {
      toast({
        title: 'No pudimos enviar el reporte',
        description: error?.message || 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleMinimizeChat = () => {
    setShowEmojiPicker(false);
    setIsMinimized(true);
  };

  const handleRestoreChat = () => {
    setIsMinimized(false);
    setMinimizedUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 z-[130] w-[min(92vw,330px)] rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-2.5"
        style={minimizedWindowStyle}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar className="w-9 h-9 border border-border/70">
              <AvatarImage src={primaryParticipant?.avatar} alt={partnerName} />
              <AvatarFallback>{partnerName[0]?.toUpperCase?.() || 'U'}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                isGroupChat || partnerPresence?.isOnline || isPartnerTyping ? 'bg-emerald-500' : 'bg-zinc-500'
              }`}
            />
          </div>

          <button
            type="button"
            onClick={handleRestoreChat}
            className="flex-1 text-left min-w-0 rounded-xl px-2 py-1 hover:bg-secondary/70 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground truncate">{partnerName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {isGroupChat ? `${chatParticipants.length} participantes` : (isPartnerTyping ? 'Escribiendo...' : 'Chat privado')}
            </p>
          </button>

          {minimizedUnreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-cyan-500 text-white text-[11px] font-bold flex items-center justify-center">
              {minimizedUnreadCount > 99 ? '99+' : minimizedUnreadCount}
            </span>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRestoreChat}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            title="Restaurar chat"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              notifyLeaveOnce();
              onClose?.(chatId);
            }}
            className="w-8 h-8 text-muted-foreground hover:text-red-400"
            title="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed bottom-4 z-[130] w-[min(92vw,420px)] h-[min(84vh,640px)] flex flex-col gap-0 bg-card border rounded-2xl shadow-2xl overflow-hidden"
        style={floatingWindowStyle}
        aria-label={isGroupChat ? `Chat grupal privado ${partnerName}` : `Chat privado con ${partnerName}`}
      >

        <header className="bg-secondary/95 backdrop-blur-md px-3 py-3 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border/70">
                <AvatarImage src={primaryParticipant?.avatar} alt={partnerName} />
                <AvatarFallback>{partnerName[0]?.toUpperCase?.() || 'U'}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-card ${
                  isGroupChat || partnerPresence?.isOnline || isPartnerTyping ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{partnerName}</p>
              <p className={`text-xs truncate ${isPartnerTyping ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                {statusText}
              </p>
              {isGroupChat && groupSubtitle && (
                <p className="text-[11px] text-muted-foreground truncate">{groupSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canInviteMorePeople && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsInviteDialogOpen(true)}
                className="w-8 h-8 text-muted-foreground"
                title="Invitar participante"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <DropdownMenu modal={false} open={isActionsMenuOpen} onOpenChange={setIsActionsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground"
                  title="Opciones del chat"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="z-[260] bg-card border text-foreground w-64 shadow-2xl"
              >
                <DropdownMenuItem onSelect={handleToggleMute}>
                  {isMuted ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                  {isMuted ? 'Activar sonido' : (isGroupChat ? 'Silenciar chat' : 'Silenciar usuario')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLeaveChat}>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  {isGroupChat ? 'Salir del chat grupal' : 'Cerrar conversación'}
                </DropdownMenuItem>
                {!isGroupChat && (
                  <DropdownMenuItem onSelect={handleBlockUser}>
                    <Shield className="w-4 h-4 mr-2" />
                    Bloquear usuario
                  </DropdownMenuItem>
                )}
                {!isGroupChat && (
                  <DropdownMenuItem onSelect={() => setIsReportDialogOpen(true)}>
                    <Flag className="w-4 h-4 mr-2" />
                    Denunciar usuario
                  </DropdownMenuItem>
                )}
                {!isGroupChat && (
                  <DropdownMenuItem onSelect={handleVisitProfile}>
                    <User className="w-4 h-4 mr-2" />
                    Ver perfil
                  </DropdownMenuItem>
                )}
                {!isGroupChat && (
                  <DropdownMenuItem onSelect={handleToggleFriend}>
                    {isFriend ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    {isFriend ? 'Quitar de mi lista de amigos' : 'Agregar a mi lista de amigos'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={handleArchiveConversation}>
                  <Archive className="w-4 h-4 mr-2" />
                  {isArchived ? 'Archivar nuevamente' : 'Archivar conversación'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setDeleteConfirmationInput('');
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar conversación
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimizeChat}
              className="w-8 h-8 text-muted-foreground"
              title="Minimizar chat"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                notifyLeaveOnce();
                onClose?.(chatId);
              }}
              className="w-8 h-8 text-muted-foreground"
              title="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide bg-gradient-to-b from-card to-card/95">
          {isChatBlocked ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-muted-foreground text-sm mb-2">Este chat no está disponible por un bloqueo</p>
              <p className="text-muted-foreground/70 text-xs">No podrás enviar ni recibir mensajes en esta conversación</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-muted-foreground text-sm mb-2">No hay mensajes aún</p>
              <p className="text-muted-foreground/70 text-xs">Envía el primer mensaje para comenzar la conversación</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isOwn = msg.userId === user.id;
                const isSystem = msg.type === 'system';
                const isImageMessage = msg.type === 'image';
                const messageKey = msg.id;
                const isImageRevealed = isImageMessage && revealedImageIds.has(messageKey);
                const userImageReaction = isImageMessage ? (msg?.reactionUsers?.[user?.id] || null) : null;
                const imageReactionSummary = isImageMessage
                  ? PRIVATE_IMAGE_REACTIONS
                      .map((item) => ({
                        ...item,
                        count: Number(msg.reactions?.[item.key] || 0),
                      }))
                      .filter((item) => item.count > 0)
                  : [];
                const hasImageReactions = isImageMessage && imageReactionSummary.length > 0;

                if (isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center my-2"
                    >
                      <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground text-center">{msg.content}</p>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`w-full flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`inline-block w-fit rounded-2xl break-words break-all whitespace-pre-wrap shadow-sm ${
                        isImageMessage ? 'overflow-visible' : 'overflow-hidden'
                      } ${
                        isImageMessage
                          ? `max-w-[78%] p-1.5 ${hasImageReactions ? 'pb-4' : ''}`
                          : 'min-w-[2.5rem] px-3.5 py-2.5 max-w-[72%]'
                      } ${
                        isOwn
                          ? 'magenta-gradient text-white rounded-br-md'
                          : 'bg-secondary text-foreground border border-border rounded-bl-md'
                      }`}
                    >
                      {isImageMessage ? (
                        msg.content ? (
                          <button
                            type="button"
                            onClick={() => togglePrivateImageBlur(messageKey)}
                            className="group relative block rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                            title={isImageRevealed ? 'Toca para volver a ocultar' : 'Toca para ver'}
                          >
                            <img
                              src={msg.content}
                              alt="Imagen del chat privado"
                              loading="lazy"
                              className={`block w-full max-w-[220px] h-auto object-cover rounded-xl transition-[filter,transform] duration-200 ${
                                isImageRevealed ? '' : 'scale-[1.015]'
                              }`}
                              style={{
                                filter: isImageRevealed ? 'none' : 'blur(7px) saturate(0.88) brightness(0.9)',
                              }}
                            />
                            {!isImageRevealed && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-b from-slate-900/25 to-slate-900/40">
                                <span className="inline-flex items-center justify-center text-[11px] font-semibold text-slate-100 px-2.5 py-1 rounded-full border border-slate-200/30 bg-slate-900/55 backdrop-blur-[2px]">
                                  Toca para ver
                                </span>
                              </div>
                            )}
                            {isImageRevealed && (
                              <div className="absolute bottom-2 right-2 pointer-events-none">
                                <span className="inline-flex items-center justify-center text-[10px] font-medium text-slate-100 px-2 py-0.5 rounded-full border border-slate-200/20 bg-slate-900/45">
                                  Toca para ocultar
                                </span>
                              </div>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Imagen no disponible</span>
                        )
                      ) : (
                        <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {isOwn ? (
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/70">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {(() => {
                            const deliveredTo = Array.isArray(msg.deliveredTo) ? msg.deliveredTo : [];
                            const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
                            const recipientIds = isGroupChat ? allOtherParticipantIds : [partnerId].filter(Boolean);
                            const everyoneRead = recipientIds.length > 0 && recipientIds.every((recipientId) => readBy.includes(recipientId));
                            const anyoneDelivered = recipientIds.some((recipientId) => (
                              deliveredTo.includes(recipientId) || readBy.includes(recipientId)
                            ));

                            if (everyoneRead) {
                              return <CheckCheck className="w-3 h-3 text-cyan-300" />;
                            }
                            if (anyoneDelivered) {
                              return <CheckCheck className="w-3 h-3 text-white/70" />;
                            }
                            return <Check className="w-3 h-3 text-white/70" />;
                          })()}
                        </div>
                      ) : (
                        <p className="text-[10px] mt-1 text-muted-foreground">
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      )}
                      {hasImageReactions && (
                        <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-slate-900/70 border border-slate-400/35 backdrop-blur-[6px] z-[2] whitespace-nowrap">
                          {imageReactionSummary.map((item) => (
                            <span
                              key={item.key}
                              className={`inline-flex items-center gap-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full ${item.pillClass}`}
                            >
                              <span>{item.emoji}</span>
                              {item.count}
                            </span>
                          ))}
                        </div>
                      )}
                      {!isOwn && isImageMessage && (
                        <div className="mt-1.5 flex items-center justify-end gap-1">
                          {PRIVATE_IMAGE_REACTIONS.map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePrivateImageReaction(msg, item.key);
                              }}
                              className={`h-6 min-w-[24px] px-1.5 inline-flex items-center justify-center rounded-full text-[14px] transition-colors ${
                                userImageReaction === item.key
                                  ? 'text-white bg-cyan-500/30 border border-cyan-300/40'
                                  : `text-muted-foreground bg-black/15 hover:bg-black/25 ${item.buttonClass}`
                              }`}
                              title={item.title}
                              aria-pressed={userImageReaction === item.key}
                            >
                              {item.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          <AnimatePresence>
            {!isChatBlocked && isPartnerTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex justify-start"
              >
                <div className="bg-secondary border border-border rounded-2xl rounded-bl-md px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">escribiendo...</span>
                    <div className="flex items-center gap-1">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                      />
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t shrink-0 relative" ref={wrapperRef}>
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                {isMobileEmojiSheet && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px]"
                    onClick={() => setShowEmojiPicker(false)}
                    aria-label="Cerrar selector de emojis"
                  />
                )}

                <motion.div
                  initial={{ opacity: 0, y: isMobileEmojiSheet ? 24 : 10, scale: isMobileEmojiSheet ? 1 : 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: isMobileEmojiSheet ? 24 : 10, scale: isMobileEmojiSheet ? 1 : 0.98 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  drag={isMobileEmojiSheet ? 'y' : false}
                  dragDirectionLock={isMobileEmojiSheet}
                  dragElastic={isMobileEmojiSheet ? 0.16 : 0}
                  dragConstraints={isMobileEmojiSheet ? { top: 0, bottom: 140 } : undefined}
                  onDragEnd={(_, info) => {
                    if (isMobileEmojiSheet && info.offset.y > 85) {
                      setShowEmojiPicker(false);
                    }
                  }}
                  className={
                    isMobileEmojiSheet
                      ? 'absolute bottom-full left-0 right-0 mb-2 z-[80]'
                      : 'absolute bottom-full left-0 mb-2 z-20 w-[min(360px,calc(100vw-1.5rem))]'
                  }
                >
                  <Suspense fallback={
                    <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-input/80 w-full h-[320px] flex items-center justify-center shadow-2xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                    </div>
                  }>
                    <div className="w-full overflow-hidden rounded-2xl border border-input/80 bg-card/95 backdrop-blur-xl shadow-2xl">
                      {isMobileEmojiSheet && (
                        <div className="flex justify-center pt-2">
                          <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
                        </div>
                      )}

                      <div className="px-3 pt-3 pb-2 border-b border-border/70 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emojis</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowEmojiPicker(false)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="px-3 pt-2 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                          {recentEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleEmojiClick({ emoji })}
                              className="h-8 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary text-base transition-colors"
                              aria-label={`Agregar emoji ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={isMobileEmojiSheet ? 'h-[40vh] min-h-[240px] max-h-[340px]' : 'h-[340px]'}>
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme="dark"
                          height="100%"
                          width="100%"
                          emojiStyle={EmojiStyle.NATIVE}
                          categories={emojiPickerCategories}
                          preload
                          lazyLoadEmojis
                          autoFocusSearch={false}
                          skinTonesDisabled
                          searchPlaceHolder="Buscar emoji"
                          previewConfig={{ showPreview: false }}
                          className="chactivo-emoji-picker"
                        />
                      </div>
                    </div>
                  </Suspense>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`h-10 w-10 rounded-full ${
                showEmojiPicker
                  ? 'text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20'
                  : 'text-muted-foreground hover:text-cyan-400'
              }`}
              title="Selector de emojis"
            >
              {showEmojiPicker ? <X className="w-4 h-4" /> : <Smile className="w-4 h-4" />}
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePhotoButtonClick}
                onMouseEnter={() => setShowPhotoTooltip(true)}
                onMouseLeave={() => setShowPhotoTooltip(false)}
                onFocus={() => setShowPhotoTooltip(true)}
                onBlur={() => setShowPhotoTooltip(false)}
                className={`h-10 w-10 rounded-full transition-colors ${
                  canSendPhotoNow
                    ? 'text-muted-foreground hover:text-cyan-400'
                    : 'text-muted-foreground/80 hover:text-cyan-300'
                } ${isUploadingPhoto ? 'opacity-70' : ''}`}
                title={getPhotoTooltipText()}
                aria-label="Subir imagen al chat privado"
                aria-busy={isUploadingPhoto}
              >
                <Image className={`w-4 h-4 ${isUploadingPhoto ? 'animate-pulse' : ''}`} />
              </Button>

              {showPhotoTooltip && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-md border border-input bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-lg">
                  {getPhotoTooltipText()}
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={handlePhotoFileSelected}
            />

            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje privado..."
              className="flex-1 bg-secondary border-input rounded-full px-4 focus:border-accent h-10"
              autoFocus={autoFocus}
              disabled={isChatBlocked}
            />

            <Button
              type="submit"
              size="icon"
              className="rounded-full magenta-gradient text-white w-10 h-10"
              disabled={isChatBlocked || !newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

      </motion.section>

      {!isGroupChat && (
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Denunciar usuario</DialogTitle>
            <DialogDescription>
              Reportar a {partnerName}. Esto ayuda a moderación a revisar comportamientos indebidos.
            </DialogDescription>
            <div className="space-y-3">
              <label className="block text-sm text-foreground/90">
                Motivo
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="acoso">Acoso</option>
                  <option value="violencia">Violencia/amenaza</option>
                  <option value="ventas">Spam o ventas</option>
                  <option value="otras">Otro</option>
                </select>
              </label>
              <label className="block text-sm text-foreground/90">
                Detalle (opcional)
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe brevemente lo ocurrido..."
                  className="mt-1 min-h-[90px]"
                />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmitReport} disabled={isSubmittingReport}>
                {isSubmittingReport ? 'Enviando...' : 'Enviar reporte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Invitar al chat privado</DialogTitle>
          <DialogDescription>
            El invitado y quienes ya están en este chat deben aceptar antes de sumarse.
          </DialogDescription>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {inviteCandidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay conectados disponibles para invitar ahora.</p>
            ) : (
              inviteCandidates.map((candidate) => (
                <div
                  key={candidate.userId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={candidate.avatar} alt={candidate.username} />
                      <AvatarFallback>{candidate.username[0]?.toUpperCase?.() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{candidate.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{candidate.role || 'Disponible en sala'}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleInviteParticipant(candidate)}
                    disabled={isSendingGroupInvite}
                  >
                    Invitar
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Eliminar conversación</DialogTitle>
          <DialogDescription>
            Escribe <strong>{DELETE_CONFIRM_TEXT}</strong> para confirmar. Esta acción la ocultará de tu vista.
          </DialogDescription>
          <Input
            value={deleteConfirmationInput}
            onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            placeholder={DELETE_CONFIRM_TEXT}
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteConfirmationInput.trim().toUpperCase() !== DELETE_CONFIRM_TEXT}
              onClick={() => {
                setIsDeleteDialogOpen(false);
                handleDeleteConversation();
              }}
            >
              Eliminar conversación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrivateChatWindow;
