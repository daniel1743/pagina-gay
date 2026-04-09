import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle, Reply, MessageCircle, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';
import { getUserConnectionStatus, getStatusColor, getStatusText } from '@/utils/userStatus';
import { traceEvent, TRACE_EVENTS, isMessageTraceEnabled } from '@/utils/messageTrace';
import { getBadgeConfig } from '@/services/badgeService';
import { getProfileRoleBadgeMeta } from '@/config/profileRoles';
import './ChatMessages.css';

const isSeededUserId = (userId = '') => String(userId || '').startsWith('seed_user_');
const normalizeMetaText = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const QUICK_REPLY_ACTIONS = [
  {
    key: 'interest',
    label: 'Me interesa',
    buildText: (group) => `Me interesa${group?.comuna ? `, ${group.comuna}` : ''}. ¿Qué buscas ahora?`,
  },
  {
    key: 'dm',
    label: 'Te escribo',
    buildText: () => 'Te escribo. ¿Qué buscas ahora?',
  },
  {
    key: 'nearby',
    label: '¿Estás cerca?',
    buildText: (group) => group?.comuna
      ? `¿Estás cerca de ${group.comuna}?`
      : '¿Estás cerca?',
  },
];

/**
 * ⚡ TELEGRAM DESKTOP STYLE - Alta Densidad
 *
 * ESTRUCTURA:
 * - messages-container: flex column, width 100%, gap 0
 * - message-group: width 100%, margin-bottom 12px (entre usuarios)
 * - message-row: width 100%, margin-bottom 2px (entre mensajes mismo usuario)
 * - message-bubble: max-width 75%, width fit-content
 */

const ChatMessages = ({
  messages,
  currentUserId,
  currentUserSeekingBadgeMeta = null,
  currentUserSeekingBadgeOptions = [],
  onUpdateCurrentUserSeekingBadge,
  isSavingCurrentUserSeekingBadge = false,
  onUserClick,
  onReport,
  onPrivateChat,
  onReaction,
  onDeleteMessage,
  canModerateMessages = false,
  messagesEndRef,
  messagesContainerRef,
  newMessagesIndicator,
  onScroll,
  onReply,
  lastReadMessageIndex = -1,
  roomUsers = [],
  dailyTopic = '',
  isLoadingMessages = false,
  messagesLoadingStage = 'initial',
  hideRoleBadges = false,
  contextualHighlight = null,
  onOpenContextualHighlight,
  onSuggestReply,
}) => {
  const DEFAULT_CHAT_AVATAR = '/avatar_por_defecto.jpeg';
  const resolveChatAvatar = (avatar) => {
    if (!avatar || typeof avatar !== 'string') return DEFAULT_CHAT_AVATAR;
    const normalized = avatar.trim().toLowerCase();
    if (!normalized) return DEFAULT_CHAT_AVATAR;
    if (normalized === 'undefined' || normalized === 'null') return DEFAULT_CHAT_AVATAR;
    if (normalized.includes('api.dicebear.com')) return DEFAULT_CHAT_AVATAR;
    if (normalized.startsWith('data:image/svg+xml')) return DEFAULT_CHAT_AVATAR;
    if (normalized.startsWith('blob:')) return DEFAULT_CHAT_AVATAR;
    return avatar;
  };

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [activeQuickReplyBadge, setActiveQuickReplyBadge] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== 'undefined'
      ? (window.innerWidth < 900 || Boolean(window.matchMedia?.('(pointer: coarse)')?.matches))
      : false
  ));
  const [activeImageActionsMessageId, setActiveImageActionsMessageId] = useState(null);
  const [revealedImageIds, setRevealedImageIds] = useState(() => new Set());
  const [reactionBursts, setReactionBursts] = useState([]);
  const [swipeReplyMessageId, setSwipeReplyMessageId] = useState(null);
  const [swipeReplyOffset, setSwipeReplyOffset] = useState(0);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showPrivateHint, setShowPrivateHint] = useState(false);
  const [editingOwnSeekingBadgeMessageId, setEditingOwnSeekingBadgeMessageId] = useState(null);
  const renderedMessageIdsRef = useRef(new Set());
  const shownQuickReplyBadgesRef = useRef(new Set());
  const quickReplyHideTimeoutRef = useRef(null);
  const imageActionsHideTimeoutRef = useRef(null);
  const privateHintTimeoutRef = useRef(null);
  const swipeStateRef = useRef({
    tracking: false,
    messageKey: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
  });
  const { user: authUser } = useAuth();

  // ⚡ SEGURIDAD: roomUsers siempre array
  const safeRoomUsers = Array.isArray(roomUsers) ? roomUsers : [];
  const hasProVisualFlags = (obj) => Boolean(
    obj?.isProUser ||
    obj?.hasProBadge ||
    obj?.hasRainbowBorder ||
    obj?.hasFeaturedCard ||
    obj?.canUploadSecondPhoto
  );

  // 🔍 TRACE: Rastrear mensajes nuevos
  useEffect(() => {
    if (!isMessageTraceEnabled()) return;
    if (!messages || messages.length === 0) return;

    const newMessages = messages.filter(msg => {
      const msgId = msg.id || msg._realId || msg.clientId;
      if (!msgId) return false;
      if (renderedMessageIdsRef.current.has(msgId)) return false;
      renderedMessageIdsRef.current.add(msgId);
      return true;
    });

    newMessages.forEach((msg) => {
      const msgId = msg.id || msg._realId || msg.clientId;
      traceEvent(TRACE_EVENTS.REMOTE_UI_RENDER, {
        traceId: msg.clientId || msg.trace?.traceId || msgId,
        messageId: msgId,
        userId: msg.userId,
        username: msg.username,
        content: msg.content?.substring(0, 50),
        isOwn: msg.userId === currentUserId,
        isOptimistic: msg._optimistic || false,
        timestamp: msg.timestampMs || Date.now(),
      });
    });
  }, [messages, currentUserId]);

  // ⚡ Respuesta rápida: mostrar badge temporal una sola vez por conversación activa
  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    let latestQuickReply = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.quickReplyHighlight?.key) {
        latestQuickReply = messages[i].quickReplyHighlight;
        break;
      }
    }

    if (!latestQuickReply?.key) return;
    if (shownQuickReplyBadgesRef.current.has(latestQuickReply.key)) return;

    shownQuickReplyBadgesRef.current.add(latestQuickReply.key);
    setActiveQuickReplyBadge(latestQuickReply);

    if (quickReplyHideTimeoutRef.current) {
      clearTimeout(quickReplyHideTimeoutRef.current);
    }

    quickReplyHideTimeoutRef.current = setTimeout(() => {
      setActiveQuickReplyBadge((prev) => (
        prev?.key === latestQuickReply.key ? null : prev
      ));
    }, 30000);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (quickReplyHideTimeoutRef.current) {
        clearTimeout(quickReplyHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 900 || Boolean(window.matchMedia?.('(pointer: coarse)')?.matches));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!activeImageActionsMessageId) return;
    const exists = messages?.some((msg) => (msg._realId || msg.id) === activeImageActionsMessageId);
    if (!exists) {
      setActiveImageActionsMessageId(null);
    }
  }, [messages, activeImageActionsMessageId]);

  useEffect(() => {
    return () => {
      if (imageActionsHideTimeoutRef.current) {
        clearTimeout(imageActionsHideTimeoutRef.current);
      }
      if (privateHintTimeoutRef.current) {
        clearTimeout(privateHintTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageSuffix = currentUserId || authUser?.id || 'guest';
    const storageKey = `chactivo:chat-usage-guide:dismissed:${storageSuffix}`;
    if (window.localStorage.getItem(storageKey) === '1') return;
    setShowUsageGuide(true);
  }, [authUser?.id, currentUserId]);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;
    const validIds = new Set(messages.map((msg) => msg._realId || msg.id).filter(Boolean));
    setRevealedImageIds((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined' || !currentUserId) return;
    const hasOtherVisibleMessages = Array.isArray(messages)
      && messages.some((message) => message?.userId && message.userId !== currentUserId && message.userId !== 'system');

    if (!hasOtherVisibleMessages) return;

    const storageKey = `chactivo:private-chat-discovery-hint:${currentUserId}`;
    if (window.localStorage.getItem(storageKey) === 'seen') return;

    setShowPrivateHint(true);

    if (privateHintTimeoutRef.current) {
      clearTimeout(privateHintTimeoutRef.current);
    }

    privateHintTimeoutRef.current = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, 'seen');
      setShowPrivateHint(false);
    }, 12000);
  }, [currentUserId, messages]);

  useEffect(() => {
    if (!currentUserSeekingBadgeMeta?.key) {
      setEditingOwnSeekingBadgeMessageId(null);
    }
  }, [currentUserSeekingBadgeMeta?.key]);

  const dismissPrivateHint = () => {
    if (typeof window !== 'undefined' && currentUserId) {
      window.localStorage.setItem(`chactivo:private-chat-discovery-hint:${currentUserId}`, 'seen');
    }
    if (privateHintTimeoutRef.current) {
      clearTimeout(privateHintTimeoutRef.current);
      privateHintTimeoutRef.current = null;
    }
    setShowPrivateHint(false);
  };

  const dismissUsageGuide = () => {
    if (typeof window !== 'undefined') {
      const storageSuffix = currentUserId || authUser?.id || 'guest';
      window.localStorage.setItem(`chactivo:chat-usage-guide:dismissed:${storageSuffix}`, '1');
    }
    setShowUsageGuide(false);
  };

  const triggerReply = (message) => {
    onReply?.({
      messageId: message.id,
      username: message.username,
      content: message.type === 'image' ? '📷 Imagen' : message.content,
    });
  };

  const toggleImageActions = (messageKey) => {
    setActiveImageActionsMessageId((prev) => {
      const next = prev === messageKey ? null : messageKey;
      if (imageActionsHideTimeoutRef.current) {
        clearTimeout(imageActionsHideTimeoutRef.current);
      }
      if (next) {
        imageActionsHideTimeoutRef.current = setTimeout(() => {
          setActiveImageActionsMessageId((current) => (current === next ? null : current));
        }, 9000);
      }
      return next;
    });
  };

  const revealImage = (messageKey) => {
    if (!messageKey) return;
    setRevealedImageIds((prev) => {
      if (prev.has(messageKey)) return prev;
      const next = new Set(prev);
      next.add(messageKey);
      return next;
    });
  };

  const spawnReactionBurst = (emoji, sourceEl) => {
    if (!sourceEl || typeof window === 'undefined') return;

    const rect = sourceEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const burstId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const particles = Array.from({ length: 14 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 14;
      const radius = 24 + Math.random() * 32;
      return {
        id: `${burstId}_${index}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius - 8,
        scale: 0.8 + Math.random() * 0.9,
        delay: Math.random() * 0.08,
        duration: 520 + Math.random() * 320,
      };
    });

    setReactionBursts((prev) => [...prev, { id: burstId, emoji, centerX, centerY, particles }]);
    window.setTimeout(() => {
      setReactionBursts((prev) => prev.filter((burst) => burst.id !== burstId));
    }, 1200);
  };

  const triggerReaction = async (event, message, reactionKey, emoji) => {
    event.stopPropagation();
    const firestoreId = message._realId || message.id;
    const success = await Promise.resolve(onReaction?.(firestoreId, reactionKey));
    if (success === true) {
      spawnReactionBurst(emoji, event.currentTarget);
    }
  };

  const handleSwipeStart = (event, message, isOwn) => {
    if (!isMobileViewport || isOwn || !onReply) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const messageKey = message._realId || message.id;
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
    const messageKey = message._realId || message.id;
    if (swipeStateRef.current.messageKey !== messageKey) return;

    const dx = touch.clientX - swipeStateRef.current.startX;
    const dy = Math.abs(touch.clientY - swipeStateRef.current.startY);
    if (dy > 40) {
      swipeStateRef.current.tracking = false;
      setSwipeReplyMessageId(null);
      setSwipeReplyOffset(0);
      return;
    }

    const clamped = Math.max(0, Math.min(dx * 0.65, 78));
    swipeStateRef.current.deltaX = clamped;
    setSwipeReplyOffset(clamped);
  };

  const handleSwipeEnd = (message) => {
    if (!swipeStateRef.current.tracking) {
      setSwipeReplyMessageId(null);
      setSwipeReplyOffset(0);
      return;
    }

    const shouldReply = swipeStateRef.current.deltaX >= 52;
    swipeStateRef.current.tracking = false;
    swipeStateRef.current.messageKey = null;
    setSwipeReplyMessageId(null);
    setSwipeReplyOffset(0);

    if (shouldReply) {
      triggerReply(message);
    }
  };

  // ⏰ Formatear timestamp
  const formatTime = (timestamp) => {
    try {
      let date;
      if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (timestamp?.toMillis) {
        date = new Date(timestamp.toMillis());
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        return '';
      }
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 🔍 Buscar estados de usuario
  const findUserPremiumStatus = (userId) => {
    if (authUser?.id === userId) return authUser?.isPremium || false;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.isPremium || false;
  };

  const findUserVerifiedStatus = (userId) => {
    if (authUser?.id === userId) return authUser?.verified || false;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.verified || false;
  };

  const findUserRole = (userId) => {
    if (authUser?.id === userId) return authUser?.role || null;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.role || null;
  };

  const findUserProStatus = (userId) => {
    if (authUser && (authUser.id === userId || authUser.uid === userId)) {
      return hasProVisualFlags(authUser);
    }
    const presence = safeRoomUsers.find(u => (u.userId || u.id) === userId);
    if (hasProVisualFlags(presence)) return true;

    // Buscar de atrás hacia adelante para priorizar el estado más reciente.
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.userId === userId && hasProVisualFlags(message)) {
        return true;
      }
    }

    return false;
  };

  // 🎯 Saltar a mensaje específico
  const handleJumpToMessage = (messageId) => {
    const messageElement = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const openPrivateChatFromGroup = (group) => {
    if (!group || isSeededUserId(group.userId)) return;
    onPrivateChat?.({
      username: group.username,
      avatar: resolveChatAvatar(group.avatar),
      userId: group.userId,
      isPremium: findUserPremiumStatus(group.userId),
    });
    dismissPrivateHint();
  };

  const getGroupIntentMeta = (group, presenceUser) => {
    const quickIntentLabel = String(presenceUser?.quickIntentLabel || '').trim();
    if (quickIntentLabel) {
      return {
        label: presenceUser?.availableForChat ? `${quickIntentLabel} • disponible` : quickIntentLabel,
        tone: 'intent',
      };
    }

    if (presenceUser?.availableForChat) {
      return {
        label: 'Disponible ahora',
        tone: 'available',
      };
    }

    for (let i = group.messages.length - 1; i >= 0; i -= 1) {
      const accentLabel = group.messages[i]?._signalMeta?.accentLabel;
      if (accentLabel) {
        return {
          label: accentLabel,
          tone: 'derived',
        };
      }
    }

    return null;
  };

  const shouldHideIntentMeta = (group, intentLabel) => {
    const normalizedLabel = normalizeMetaText(intentLabel);
    if (!normalizedLabel) return true;

    const combinedContent = normalizeMetaText(
      (group?.messages || [])
        .filter((item) => item?.type === 'text')
        .map((item) => item?.content || '')
        .join(' ')
    );

    if (!combinedContent) return false;

    if (normalizedLabel.includes('busca activo')) return combinedContent.includes('activo');
    if (normalizedLabel.includes('busca pasivo')) return combinedContent.includes('pasivo');
    if (normalizedLabel.includes('busca versatil')) return combinedContent.includes('versatil');
    if (normalizedLabel.includes('disponible ahora')) return combinedContent.includes('disponible');

    return combinedContent.includes(normalizedLabel);
  };

  const shouldHideComunaMeta = (group, comuna) => {
    const normalizedComuna = normalizeMetaText(comuna);
    if (!normalizedComuna) return true;

    const combinedContent = normalizeMetaText(
      (group?.messages || [])
        .filter((item) => item?.type === 'text')
        .map((item) => item?.content || '')
        .join(' ')
    );

    return combinedContent.includes(normalizedComuna);
  };

  // ⚡ AGRUPACIÓN: Mensajes consecutivos del mismo usuario
  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    const GROUP_TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutos

    messages.forEach((message, index) => {
      // Filtrar mensajes del moderador
      if (message.userId === 'system_moderator') return;

      const isSystem = message.userId === 'system';

      // Mensajes de sistema: siempre individuales
      if (isSystem) {
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
        groups.push({
          groupId: `system_${message.id}`,
          userId: message.userId,
          messages: [message],
          isSystem: true,
        });
        return;
      }

      // Obtener timestamp
      const messageTime = message.timestampMs ||
        (message.timestamp?.toMillis?.() ||
          (typeof message.timestamp === 'number' ? message.timestamp :
            (message.timestamp ? new Date(message.timestamp).getTime() : Date.now())));

      const prevMessage = index > 0 ? messages[index - 1] : null;
      const prevTime = prevMessage ?
        (prevMessage.timestampMs ||
          (prevMessage.timestamp?.toMillis?.() ||
            (typeof prevMessage.timestamp === 'number' ? prevMessage.timestamp :
              (prevMessage.timestamp ? new Date(prevMessage.timestamp).getTime() : Date.now())))) :
        null;

      const timeDiff = prevTime ? messageTime - prevTime : Infinity;

      // Agrupar si mismo usuario y diferencia <= 2 min
      const shouldGroup = prevMessage &&
        prevMessage.userId === message.userId &&
        prevMessage.userId !== 'system' &&
        prevMessage.userId !== 'system_moderator' &&
        timeDiff <= GROUP_TIME_THRESHOLD;
      const normalizedRoleBadge = hideRoleBadges
        ? null
        : (getProfileRoleBadgeMeta(message.roleBadge)?.label || null);

      if (shouldGroup && currentGroup) {
        currentGroup.messages.push(message);
        if (normalizedRoleBadge) currentGroup.roleBadge = normalizedRoleBadge;
        if (message.comuna) currentGroup.comuna = message.comuna;
        if (message.quickReplyHighlight && !currentGroup.quickReplyHighlight) {
          currentGroup.quickReplyHighlight = message.quickReplyHighlight;
        }
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          groupId: `group_${message.id}`,
          userId: message.userId,
          username: message.username,
          avatar: resolveChatAvatar(message.avatar),
          isPremium: message.isPremium || false,
          isProUser: message.isProUser || false,
          hasRainbowBorder: message.hasRainbowBorder || false,
          hasProBadge: message.hasProBadge || false,
          hasFeaturedCard: message.hasFeaturedCard || false,
          canUploadSecondPhoto: message.canUploadSecondPhoto || false,
          badge: message.badge || 'Nuevo',
          roleBadge: normalizedRoleBadge,
          comuna: message.comuna || null,
          quickReplyHighlight: message.quickReplyHighlight || null,
          messages: [message],
          isSystem: false,
        };
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const messageGroups = groupMessages(messages);
  const shouldShowContextualHighlight = Boolean(
    contextualHighlight?.candidate
    && Array.isArray(messages)
    && messages.slice(-8).some((message) => message?._signalMeta?.isGenericLowSignal)
  );
  const loadingCopy = {
    initial: {
      title: 'Cargando conversaciones...',
      hint: 'Estamos trayendo los mensajes recientes de la sala.',
    },
    delayed: {
      title: 'Sincronizando la sala...',
      hint: 'Si ves gente conectada, la sala no está vacía. Firestore está tardando más de lo normal.',
    },
    extended: {
      title: 'La carga viene lenta, pero la sala sigue activa.',
      hint: 'Espera un momento más antes de salir. A veces el primer snapshot tarda bastante en llegar.',
    },
  }[messagesLoadingStage] || {
    title: 'Cargando conversaciones...',
    hint: 'Estamos trayendo los mensajes recientes de la sala.',
  };

  return (
    <div
      ref={messagesContainerRef}
      role="log"
      aria-live="polite"
      aria-label="Área de mensajes del chat"
      className="messages-container flex-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={onScroll}
    >
      {newMessagesIndicator}

      {showUsageGuide ? (
        <div className="message-usage-guide" role="note" aria-live="polite">
          <div className="message-usage-guide-header">
            <span className="message-usage-guide-title">
              <MessageCircle className="w-3.5 h-3.5" />
              ¿Cómo se usa esto?
            </span>
            <button
              type="button"
              className="message-usage-guide-close"
              onClick={dismissUsageGuide}
              aria-label="Cerrar guía rápida"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="message-usage-guide-copy">
            Escribe qué buscas, tu comuna y si tienes lugar o te mueves.
            {' '}
            <strong>"Activo en Maipú, me muevo, busco pasivo ahora"</strong>.
          </p>
          <p className="message-usage-guide-copy">
            Si alguien te interesa, toca su avatar o su nombre para abrir perfil y pasar a privado.
          </p>
        </div>
      ) : null}

      {dailyTopic ? (
        <div className="flex justify-center py-2">
          <div className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800/70 px-3 py-1 rounded-full">
            Tema del día: {dailyTopic}
          </div>
        </div>
      ) : null}

      {showPrivateHint ? (
        <div className="message-discovery-hint" role="note" aria-live="polite">
          <span className="message-discovery-hint-copy">Toca el icono del usuario para abrir perfil y hablar en privado</span>
          <button
            type="button"
            className="message-discovery-hint-close"
            onClick={dismissPrivateHint}
            aria-label="Cerrar sugerencia"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {shouldShowContextualHighlight ? (
        <div className="message-opportunity-banner" role="note" aria-live="polite">
          <div className="message-opportunity-banner-copy">
            <span className="message-opportunity-banner-kicker">Disponible ahora</span>
            <p className="message-opportunity-banner-title">{contextualHighlight.title}</p>
            {contextualHighlight.subtitle ? (
              <p className="message-opportunity-banner-subtitle">{contextualHighlight.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="message-opportunity-banner-action"
            onClick={() => onOpenContextualHighlight?.(contextualHighlight.candidate)}
          >
            {contextualHighlight.ctaLabel || 'Ver'}
          </button>
        </div>
      ) : null}

      {messageGroups.length === 0 ? (
        <div className="px-4 py-8">
          <div className="mx-auto max-w-2xl">
            {isLoadingMessages ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">{loadingCopy.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{loadingCopy.hint}</p>
                </div>

                <div className="space-y-3 opacity-80">
                  <div className="flex items-end gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div>
                    <div className="h-14 w-[68%] rounded-2xl rounded-bl-md bg-white/10 animate-pulse"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="h-12 w-[48%] rounded-2xl rounded-br-md bg-cyan-500/10 animate-pulse"></div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse"></div>
                    <div className="h-16 w-[74%] rounded-2xl rounded-bl-md bg-white/10 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500">Aún no hay mensajes en esta sala.</p>
                <p className="text-xs text-gray-400 mt-1">Sé el primero en escribir.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        messageGroups.map((group, groupIndex) => {
          // Calcular índice absoluto para divider
          let absoluteIndex = 0;
          for (let i = 0; i < groupIndex; i++) {
            absoluteIndex += messageGroups[i].messages.length;
          }

          // Mensajes de sistema
          if (group.isSystem) {
            return (
              <div key={group.groupId} className="message-group">
                {group.messages.map((message) => (
                  <div key={message.id} className="flex justify-center py-2 px-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-gray-800/60 px-4 py-1.5 rounded-full text-center max-w-[85%] leading-relaxed">
                      {message.content || message.text}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          const isOwn = group.userId === currentUserId;
          const isUserPremium = findUserPremiumStatus(group.userId);
          const isUserVerified = findUserVerifiedStatus(group.userId);
          const isUserPro = findUserProStatus(group.userId) || hasProVisualFlags(group);
          const userRole = findUserRole(group.userId);
          const groupPresenceUser = safeRoomUsers.find(u => (u.userId || u.id) === group.userId) || null;
          const groupIntentMeta = getGroupIntentMeta(group, groupPresenceUser);
          const roleBadgeMeta = hideRoleBadges ? null : getProfileRoleBadgeMeta(group.roleBadge);
          const showDivider = lastReadMessageIndex >= 0 && absoluteIndex === lastReadMessageIndex + 1;

          return (
            <div key={group.groupId} className="message-group">
              {showDivider && <NewMessagesDivider show={true} />}
              {group.quickReplyHighlight?.key && activeQuickReplyBadge?.key === group.quickReplyHighlight.key && (
                <div className={`quick-reply-badge ${isOwn ? 'own' : 'other'}`}>
                  ⚡ Conversación activa
                </div>
              )}

              {/* ✅ Nombre: Solo una vez, solo para otros */}
              {!isOwn && (
                <div className="message-username">
                  <div className="message-identity">
                    <div className="message-identity-main">
                      <span className="message-identity-name">{group.username}</span>
                      <span className="message-user-flags">
                        {(isUserPremium || userRole === 'admin') && (
                          <CheckCircle className="w-3 h-3 text-yellow-500" title="Miembro destacado" />
                        )}
                        {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                          <CheckCircle className="w-3 h-3 text-blue-500" title="Usuario verificado" />
                        )}
                      </span>
                      {roleBadgeMeta ? (
                        <span className={`message-primary-chip ${roleBadgeMeta.badgeClassName}`}>
                          {roleBadgeMeta.label}
                        </span>
                      ) : group.badge && group.badge !== 'Nuevo' ? (
                        (() => {
                          const badgeConfig = getBadgeConfig(group.badge);
                          return (
                            <span className={`message-primary-chip ${badgeConfig.bg} ${badgeConfig.color} ${badgeConfig.border} border`}>
                              {group.badge}
                            </span>
                          );
                        })()
                      ) : null}
                    </div>

                    {!isSeededUserId(group.userId) && (
                      <button
                        type="button"
                        className="message-private-trigger"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPrivateChatFromGroup(group);
                        }}
                        aria-label={`Abrir chat privado con ${group.username}`}
                        title={`Hablar en privado con ${group.username}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ⚡ MENSAJES DEL GRUPO */}
              {group.messages.map((message, msgIndex) => {
                const isFirst = msgIndex === 0;
                const isLast = msgIndex === group.messages.length - 1;
                const isSingle = group.messages.length === 1;
                const messageKey = message._realId || message.id;
                const isImageMessage = message.type === 'image';
                const isImageRevealed = !isImageMessage || revealedImageIds.has(messageKey);
                const signalMeta = message?._signalMeta || null;
                const hasContextSignal = Boolean(signalMeta?.isContextualHighSignal);
                const hasLowSignal = Boolean(signalMeta?.isGenericLowSignal);

                // Determinar posición para border-radius
                let positionClass = 'single';
                if (!isSingle) {
                  if (isFirst) positionClass = 'first';
                  else if (isLast) positionClass = 'last';
                  else positionClass = 'middle';
                }

                // Mostrar timestamp solo en último mensaje del grupo
                const showTime = isLast;
                const messageTimestamp = message.timestampMs || message.timestamp;
                const formattedTime = showTime ? formatTime(messageTimestamp) : '';

                // Estado de conexión del usuario
                const status = getUserConnectionStatus(groupPresenceUser);
                const statusColor = getStatusColor(status);
                const reactionSummary = [
                  {
                    key: 'like',
                    emoji: '👍',
                    count: Number(message.reactions?.like || 0),
                    className: 'bg-green-500/15 text-green-300',
                  },
                  {
                    key: 'dislike',
                    emoji: '👎',
                    count: Number(message.reactions?.dislike || 0),
                    className: 'bg-red-500/15 text-red-300',
                  },
                  {
                    key: 'fire',
                    emoji: '🔥',
                    count: Number(message.reactions?.fire || 0),
                    className: 'bg-orange-500/15 text-orange-300',
                  },
                  {
                    key: 'heart',
                    emoji: '❤️',
                    count: Number(message.reactions?.heart || 0),
                    className: 'bg-pink-500/15 text-pink-300',
                  },
                  {
                    key: 'devil',
                    emoji: '😈',
                    count: Number(message.reactions?.devil || 0),
                    className: 'bg-purple-500/15 text-purple-300',
                  },
                ].filter((item) => item.count > 0);
                const hasImageReactions = message.type === 'image' && reactionSummary.length > 0;
                const showAntiHolaActions = !isOwn
                  && isLast
                  && message.type === 'text'
                  && hasLowSignal
                  && !message._optimistic;
                const showBubbleIntentMeta = !isOwn
                  && isFirst
                  && groupIntentMeta
                  && !shouldHideIntentMeta(group, groupIntentMeta.label);
                const showBubbleComunaMeta = !isOwn
                  && isFirst
                  && group.comuna
                  && !shouldHideComunaMeta(group, group.comuna);
                const showOwnSeekingBadge = isOwn
                  && isLast
                  && Boolean(currentUserSeekingBadgeMeta?.label);

                return (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    className={`message-row group ${isOwn ? 'own' : 'other'}`}
                    style={
                      isMobileViewport && swipeReplyMessageId === (message._realId || message.id)
                        ? {
                            transform: `translateX(${swipeReplyOffset}px)`,
                            transition: swipeReplyOffset > 0 ? 'none' : 'transform 0.16s ease-out',
                          }
                        : undefined
                    }
                    onTouchStart={(event) => handleSwipeStart(event, message, isOwn)}
                    onTouchMove={(event) => handleSwipeMove(event, message)}
                    onTouchEnd={() => handleSwipeEnd(message)}
                    onTouchCancel={() => handleSwipeEnd(message)}
                  >
                    {/* ✅ Avatar: Solo en primer mensaje, solo para otros */}
                    {!isOwn && isFirst && (
                      <div
                        className={`message-avatar relative ${
                          isSeededUserId(group.userId) ? '' : 'cursor-pointer'
                        } ${
                          roleBadgeMeta
                            ? 'avatar-role-ring'
                            : (isUserPro ? 'rainbow-avatar-ring p-[2px] rounded-full' : '')
                        }`}
                        style={roleBadgeMeta?.avatarRingColor ? { '--role-ring-color': roleBadgeMeta.avatarRingColor } : undefined}
                        onClick={() => {
                          if (isSeededUserId(group.userId)) return;
                          onUserClick({
                            username: group.username,
                            avatar: group.avatar,
                            userId: group.userId,
                            isPremium: isUserPremium,
                            verified: isUserVerified,
                            isProUser: isUserPro,
                            hasRainbowBorder: group.hasRainbowBorder || false,
                            hasProBadge: group.hasProBadge || false,
                            hasFeaturedCard: group.hasFeaturedCard || false,
                            canUploadSecondPhoto: group.canUploadSecondPhoto || false,
                            role: userRole
                          });
                        }}
                      >
                        <Avatar className={`w-full h-full ${isUserPro ? 'rounded-full' : ''}`}>
                          <AvatarImage
                            src={resolveChatAvatar(group.avatar)}
                            alt={group.username || 'Usuario'}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                            {group.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Punto de estado */}
                        <div
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor} rounded-full border-2 border-white dark:border-gray-900`}
                          title={getStatusText(status)}
                        />
                      </div>
                    )}

                    {/* Placeholder para mantener alineación */}
                    {!isOwn && !isFirst && (
                      <div className="message-avatar-placeholder" />
                    )}

                    <div className={`message-stack ${isOwn ? 'own' : 'other'}`}>
                      {(hasContextSignal && signalMeta?.accentLabel) || showBubbleIntentMeta || showBubbleComunaMeta ? (
                        <div className={`message-prelude ${isOwn ? 'own' : 'other'}`}>
                          {hasContextSignal && signalMeta?.accentLabel ? (
                            <div className={`message-context-pill ${isOwn ? 'own' : 'other'}`}>
                              {signalMeta.accentLabel}
                            </div>
                          ) : null}
                          {(showBubbleIntentMeta || showBubbleComunaMeta) ? (
                            <div className={`message-bubble-meta ${isOwn ? 'own' : 'other'}`}>
                              {showBubbleIntentMeta ? (
                                <span className={`message-bubble-meta-pill ${groupIntentMeta.tone}`}>
                                  {groupIntentMeta.label}
                                </span>
                              ) : null}
                              {showBubbleComunaMeta ? (
                                <span className="message-bubble-meta-text">
                                  {group.comuna}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {/* ⚡ BURBUJA */}
                      <div
                        className={`message-bubble ${isOwn ? 'own' : 'other'} ${positionClass} ${hasImageReactions ? 'has-image-reactions' : ''} ${isImageMessage ? 'is-interactive-media' : ''} ${hasContextSignal ? 'contextual' : ''} ${hasLowSignal ? 'low-signal' : ''}`}
                        onClick={isImageMessage ? () => {
                          if (!isImageRevealed) {
                            revealImage(messageKey);
                            return;
                          }
                          if (!isOwn && isMobileViewport) {
                            toggleImageActions(messageKey);
                          }
                        } : undefined}
                      >
                        {message.replyTo && (
                          <MessageQuote
                            replyTo={message.replyTo}
                            onJumpToMessage={handleJumpToMessage}
                          />
                        )}
                        {message.type === 'text' && (
                          <div className="message-text-inline">
                            <span className="message-text-copy">
                              {message.content}
                            </span>
                            {showTime && (
                              <span className={`message-meta-inline ${isOwn ? 'own' : 'other'}`}>
                                {formattedTime && (
                                  <span className="message-time">{formattedTime}</span>
                                )}
                                {isOwn && (
                                  <span className={`message-status ${message.status === 'error' ? 'error' : message.status === 'delivered' ? 'delivered' : message.status === 'sent' ? 'sent' : 'sending'}`}>
                                    {message.status === 'error' ? '!' : message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        )}
                        {message.type === 'gif' && (
                          <img src={message.content} alt="GIF" className="rounded max-w-full" />
                        )}
                        {message.type === 'image' && (
                          message.content
                            ? (
                              <div className="chat-image-shell">
                                <img
                                  src={message.content}
                                  alt="Imagen del chat"
                                  className={`chat-message-image block rounded-lg w-auto h-auto max-w-[150px] sm:max-w-[200px] lg:max-w-[220px] max-h-[240px] object-cover ${
                                    isImageRevealed ? '' : 'is-sensitive-blurred'
                                  }`}
                                  loading="lazy"
                                />
                                {!isImageRevealed && (
                                  <div className="chat-image-reveal-overlay" aria-hidden="true">
                                    <span className="chat-image-reveal-pill">Toca para ver</span>
                                  </div>
                                )}
                              </div>
                            )
                            : <span className="text-xs text-muted-foreground">Imagen</span>
                        )}
                        {((isOwn && message.type === 'image') || (canModerateMessages && !isOwn)) &&
                          !message._optimistic &&
                          typeof onDeleteMessage === 'function' && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              className="message-delete-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMessage(message);
                              }}
                              title={canModerateMessages && !isOwn ? 'Eliminar mensaje (admin)' : 'Eliminar foto'}
                              aria-label={canModerateMessages && !isOwn ? 'Eliminar mensaje (admin)' : 'Eliminar foto'}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        )}

                        {showTime && message.type !== 'text' && (
                          <div className={`message-meta ${isOwn ? 'own' : 'other'}`}>
                            {formattedTime && (
                              <span className="message-time">{formattedTime}</span>
                            )}
                            {isOwn && (
                              <span className={`message-status ${message.status === 'error' ? 'error' : message.status === 'delivered' ? 'delivered' : message.status === 'sent' ? 'sent' : 'sending'}`}>
                                {message.status === 'error' ? '!' : message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {showOwnSeekingBadge ? (
                        <div className="message-own-seeking-wrap">
                          <button
                            type="button"
                            className={`message-own-seeking-badge ${editingOwnSeekingBadgeMessageId === messageKey ? 'active' : ''}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingOwnSeekingBadgeMessageId((prev) => (
                                prev === messageKey ? null : messageKey
                              ));
                            }}
                            aria-label="Editar lo que buscas"
                            title="Editar lo que buscas"
                          >
                            {currentUserSeekingBadgeMeta.label}
                          </button>

                          {editingOwnSeekingBadgeMessageId === messageKey && currentUserSeekingBadgeOptions.length > 0 ? (
                            <div className="message-own-seeking-editor">
                              {currentUserSeekingBadgeOptions.map((option) => {
                                const isSelected = option.key === currentUserSeekingBadgeMeta.key;
                                return (
                                  <button
                                    key={`seeking_${option.key}`}
                                    type="button"
                                    className={`message-own-seeking-option ${isSelected ? 'selected' : ''}`}
                                    disabled={isSavingCurrentUserSeekingBadge || isSelected}
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      const success = await Promise.resolve(
                                        onUpdateCurrentUserSeekingBadge?.(option.key)
                                      );
                                      if (success !== false) {
                                        setEditingOwnSeekingBadgeMessageId(null);
                                      }
                                    }}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {/* ACCIONES - Solo para otros */}
                    {!isOwn && (
                      <span
                        className={`inline-flex items-center gap-1 ml-1 transition-opacity ${
                          message.type === 'image'
                            ? (
                              isMobileViewport
                                ? (
                                  activeImageActionsMessageId === messageKey
                                    ? 'opacity-100 pointer-events-auto rounded-full bg-black/20 px-1.5 py-0.5'
                                    : 'opacity-0 pointer-events-none'
                                )
                                : 'opacity-0 group-hover:opacity-100'
                            )
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-cyan-500"
                          onClick={(e) => { e.stopPropagation(); triggerReply(message); }}>
                          <Reply className="h-3 w-3" />
                        </Button>
                        {currentUserId && !message._optimistic && (
                          <>
                            {message.type === 'image' ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-orange-400"
                                  onClick={(e) => triggerReaction(e, message, 'fire', '🔥')}
                                  title="Reaccionar con fuego"
                                >
                                  <span className="text-[13px] leading-none">🔥</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-pink-400"
                                  onClick={(e) => triggerReaction(e, message, 'heart', '❤️')}
                                  title="Reaccionar con corazón"
                                >
                                  <span className="text-[13px] leading-none">❤️</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-purple-400"
                                  onClick={(e) => triggerReaction(e, message, 'devil', '😈')}
                                  title="Reaccionar con diablito"
                                >
                                  <span className="text-[13px] leading-none">😈</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-green-500"
                                  onClick={(e) => triggerReaction(e, message, 'like', '👍')}>
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-red-500"
                                  onClick={(e) => triggerReaction(e, message, 'dislike', '👎')}>
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </span>
                    )}

                    {showAntiHolaActions ? (
                      <div className="message-quick-actions" role="group" aria-label="Acciones rápidas con contexto">
                        {QUICK_REPLY_ACTIONS.map((action) => (
                          <button
                            key={`${messageKey}_${action.key}`}
                            type="button"
                            className="message-quick-action"
                            onClick={(event) => {
                              event.stopPropagation();
                              onSuggestReply?.(action.buildText(group), message);
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="message-quick-action primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPrivateChatFromGroup(group);
                          }}
                        >
                          Privado
                        </button>
                      </div>
                    ) : null}

                  </div>
                );
              })}
            </div>
          );
        })
      )}

      {reactionBursts.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[120]">
          {reactionBursts.map((burst) => (
            <div key={burst.id}>
              {burst.particles.map((particle) => (
                <span
                  key={particle.id}
                  className="absolute text-lg leading-none"
                  style={{
                    left: `${burst.centerX}px`,
                    top: `${burst.centerY}px`,
                    transform: 'translate(-50%, -50%)',
                    animation: `chatReactionParticle ${particle.duration}ms cubic-bezier(0.2, 0.9, 0.25, 1) forwards`,
                    animationDelay: `${particle.delay}s`,
                    '--chat-rx': `${particle.x}px`,
                    '--chat-ry': `${particle.y}px`,
                    '--chat-scale': particle.scale,
                  }}
                >
                  {burst.emoji}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={messagesEndRef} />
      <style>{`
        @keyframes chatReactionParticle {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.45);
            filter: drop-shadow(0 0 0 rgba(34, 211, 238, 0));
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--chat-rx)), calc(-50% + var(--chat-ry))) scale(var(--chat-scale));
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.5));
          }
        }
      `}</style>
    </div>
  );
};

export default ChatMessages;
