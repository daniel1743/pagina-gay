import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Shield, PhoneOff, User, MoreVertical, Smile, Minus, MessageCircle, BellOff, Bell, Flag, Archive, Trash2, UserPlus, UserMinus, Check, CheckCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import { db } from '@/config/firebase';
import { blockUser, isBlocked } from '@/services/blockService';
import { createReport } from '@/services/reportService';
import {
  subscribeToPrivateChatTyping,
  updatePrivateChatTypingStatus,
  addToFavorites,
  removeFromFavorites,
} from '@/services/socialService';
import { notificationSounds } from '@/services/notificationSounds';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

const RECENT_EMOJIS_STORAGE_KEY = 'private_chat_recent_emojis_v1';
const DEFAULT_RECENT_EMOJIS = ['😂', '😍', '🔥', '😘', '😉', '😈', '😏', '🥵', '❤️', '😎'];
const DELETE_CONFIRM_TEXT = 'ELIMINAR';

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

const PrivateChatWindow = ({
  user,
  partner,
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
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage || '');
  const [blockState, setBlockState] = useState({ blockedByMe: false, blockedByOther: false });
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
  const [partnerPresence, setPartnerPresence] = useState({
    isOnline: Boolean(partner?.estaOnline || partner?.isOnline),
    lastSeenMs: getTimestampMs(partner?.ultimaConexion || partner?.lastSeen),
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasLoadedSnapshotRef = useRef(false);
  const leaveNotifiedRef = useRef(false);
  const isMinimizedRef = useRef(false);
  const isMutedRef = useRef(false);

  const partnerId = partner?.id || partner?.userId;
  const partnerName = partner?.username || 'Usuario';
  const isChatBlocked = blockState.blockedByMe || blockState.blockedByOther;
  const mutedStorageKey = `private_chat_muted_v1_${user?.id || 'anon'}`;
  const archivedStorageKey = `private_chat_archived_v1_${user?.id || 'anon'}`;
  const deletedStorageKey = `private_chat_deleted_v1_${user?.id || 'anon'}`;

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

  // Notificar que estoy en chat privado (para que otros en la sala vean el indicador)
  useEffect(() => {
    if (roomId && onEnterPrivate && partnerId && partnerName) {
      onEnterPrivate(roomId, partnerId, partnerName);
    }
    return () => {
      if (roomId && onLeavePrivate) {
        onLeavePrivate(roomId);
      }
    };
  }, [roomId, partnerId, partnerName]); // onEnterPrivate/onLeavePrivate son estables

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
  const statusText = isPartnerTyping
    ? 'Escribiendo...'
    : partnerPresence?.isOnline
      ? 'En línea'
      : partnerPresence?.lastSeenMs
        ? `Activo ${formatRelativeTime(partnerPresence.lastSeenMs)}`
        : 'Desconectado';

  useEffect(() => {
    if (!chatId) return;
    const mutedSet = getStoredChatSet(mutedStorageKey);
    const archivedSet = getStoredChatSet(archivedStorageKey);
    setIsMuted(mutedSet.has(chatId));
    setIsArchived(archivedSet.has(chatId));
  }, [chatId, mutedStorageKey, archivedStorageKey]);

  useEffect(() => {
    if (!user?.id || !partnerId) return;
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
  }, [user?.id, partnerId]);

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
    const onVisibilityChange = () => {
      if (!document.hidden && !isMinimizedRef.current) {
        markIncomingMessagesStatus(messages, { markRead: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [messages, chatId, user?.id]);

  // Estado de bloqueo
  useEffect(() => {
    if (!user?.id || !partnerId) return;
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
  }, [user?.id, partnerId]);

  // Presencia del partner (dot online + estado)
  useEffect(() => {
    if (!partnerId) return;

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
  }, [partnerId]);

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
  }, [newMessage, chatId, user?.id, user?.username, isChatBlocked]);

  // Limpiar typing al desmontar
  useEffect(() => () => {
    if (chatId && user?.id) {
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

    try {
      const messagesRef = collection(db, 'private_chats', chatId, 'messages');
      await addDoc(messagesRef, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: contentToSend,
        type: 'text',
        status: 'sent',
        deliveredTo: [user.id],
        readBy: [user.id],
        deliveredAt: serverTimestamp(),
        readAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });

      notificationSounds.playMessageSentSound();
      setNewMessage('');
      setShowEmojiPicker(false);
      updatePrivateChatTypingStatus(chatId, user.id, false, user.username).catch(() => {});
    } catch (error) {
      console.error('Error sending private message:', error);
      toast({
        title: 'No pudimos enviar el mensaje',
        description: 'Intenta de nuevo en un momento',
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = () => {
    if (!partnerId) return;
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
    if (typeof onViewProfile === 'function') {
      onViewProfile({
        ...partner,
        userId: partnerId,
        username: partnerName,
        avatar: partner?.avatar || '',
      });
      return;
    }
    toast({ title: `Perfil de ${partnerName}`, description: 'Abriremos esta vista desde tu flujo actual.' });
  };

  const handleLeaveChat = () => {
    notifyLeaveOnce();
    toast({ title: `Has abandonado el chat con ${partnerName}` });
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
    if (!user?.id || !partnerId) return;
    if (partner?.isGuest || partner?.isAnonymous) {
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
    if (!partnerId || !user?.id) return;
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
              <AvatarImage src={partner?.avatar} alt={partnerName} />
              <AvatarFallback>{partnerName[0]?.toUpperCase?.() || 'U'}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                partnerPresence?.isOnline || isPartnerTyping ? 'bg-emerald-500' : 'bg-zinc-500'
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
              {isPartnerTyping ? 'Escribiendo...' : 'Chat privado'}
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
        aria-label={`Chat privado con ${partnerName}`}
      >

        <header className="bg-secondary/95 backdrop-blur-md px-3 py-3 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <Avatar className="w-10 h-10 border border-border/70">
                <AvatarImage src={partner?.avatar} alt={partnerName} />
                <AvatarFallback>{partnerName[0]?.toUpperCase?.() || 'U'}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-card ${
                  partnerPresence?.isOnline || isPartnerTyping ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{partnerName}</p>
              <p className={`text-xs truncate ${isPartnerTyping ? 'text-cyan-400' : 'text-muted-foreground'}`}>
                {statusText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
                <DropdownMenuItem onSelect={handleBlockUser}>
                  <Shield className="w-4 h-4 mr-2" />
                  Bloquear usuario
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleToggleMute}>
                  {isMuted ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
                  {isMuted ? 'Activar sonido' : 'Silenciar usuario'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLeaveChat}>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Cerrar conversación
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsReportDialogOpen(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Denunciar usuario
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleVisitProfile}>
                  <User className="w-4 h-4 mr-2" />
                  Ver perfil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleToggleFriend}>
                  {isFriend ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isFriend ? 'Quitar de mi lista de amigos' : 'Agregar a mi lista de amigos'}
                </DropdownMenuItem>
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
                      className={`inline-block w-fit min-w-[2.5rem] px-3.5 py-2.5 rounded-2xl max-w-[72%] overflow-hidden break-words break-all whitespace-pre-wrap shadow-sm ${
                        isOwn
                          ? 'magenta-gradient text-white rounded-br-md'
                          : 'bg-secondary text-foreground border border-border rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words break-all whitespace-pre-wrap">{msg.content}</p>
                      {isOwn ? (
                        <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-white/70">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {(() => {
                            const deliveredTo = Array.isArray(msg.deliveredTo) ? msg.deliveredTo : [];
                            const readBy = Array.isArray(msg.readBy) ? msg.readBy : [];
                            const partnerRead = Boolean(partnerId && readBy.includes(partnerId));
                            const partnerDelivered = Boolean(partnerId && (deliveredTo.includes(partnerId) || partnerRead));

                            if (partnerRead) {
                              return <CheckCheck className="w-3 h-3 text-cyan-300" />;
                            }
                            if (partnerDelivered) {
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
                  className={
                    isMobileEmojiSheet
                      ? 'fixed inset-x-2 bottom-2 z-[80] sm:inset-x-4'
                      : 'absolute bottom-full left-0 mb-2 z-20 w-[min(360px,calc(100vw-1.5rem))]'
                  }
                >
                  <Suspense fallback={
                    <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-input/80 w-full h-[320px] flex items-center justify-center shadow-2xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                    </div>
                  }>
                    <div className="w-full overflow-hidden rounded-2xl border border-input/80 bg-card/95 backdrop-blur-xl shadow-2xl">
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

                      <div className={isMobileEmojiSheet ? 'h-[48vh] min-h-[280px] max-h-[420px]' : 'h-[340px]'}>
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
