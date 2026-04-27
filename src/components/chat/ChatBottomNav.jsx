/**
 * 📱 Barra de navegación inferior móvil
 * Incluye bandeja de privados estilo historial móvil
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Archive, Sparkles, MessageCircle, Megaphone, MessagesSquare, X, Check, Clock3, Trash2, Search } from 'lucide-react';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ENABLE_BAUL } from '@/config/featureFlags';

const formatRelativeTime = (timestampMs) => {
  if (!timestampMs) return 'Ahora';
  const diffMs = Math.max(0, Date.now() - timestampMs);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d`;
};

const getSuggestionRecurrenceLevel = (candidate = {}) => {
  const openedCount = Number(candidate?.suggestionState?.openedCount || 0);
  const successCount = Number(candidate?.suggestionState?.successCount || 0);
  if (successCount >= 2 || openedCount >= 4) return 'alta';
  if (successCount >= 1 || openedCount >= 2) return 'media';
  return 'ninguna';
};

const getSuggestionRecurrenceRank = (candidate = {}) => {
  const level = getSuggestionRecurrenceLevel(candidate);
  if (level === 'alta') return 0;
  if (level === 'media') return 1;
  return 2;
};

const getRoleBucket = (roleLabel = '') => {
  const normalized = `${roleLabel || ''}`.trim().toLowerCase();
  if (!normalized) return 'otro';
  if (normalized.includes('vers')) return 'versatil';
  if (normalized.includes('pasiv') || normalized.includes('sumis')) return 'pasivo';
  if (normalized.includes('activ') || normalized.includes('domin')) return 'activo';
  return 'otro';
};

const isStrictRoleMatch = (selfRole, candidateRole) => {
  const selfBucket = getRoleBucket(selfRole);
  const candidateBucket = getRoleBucket(candidateRole);

  if (candidateBucket === 'otro') return false;
  if (selfBucket === 'activo') return candidateBucket === 'pasivo';
  if (selfBucket === 'pasivo') return candidateBucket === 'activo';
  if (selfBucket === 'versatil') return ['activo', 'pasivo', 'versatil'].includes(candidateBucket);
  return true;
};

const getSuggestionRolePriority = (selfRole, candidateRole) => {
  const selfBucket = getRoleBucket(selfRole);
  const candidateBucket = getRoleBucket(candidateRole);

  if (selfBucket === 'activo') {
    if (candidateBucket === 'pasivo') return 0;
    if (candidateBucket === 'versatil') return 1;
    return 2;
  }

  if (selfBucket === 'pasivo') {
    if (candidateBucket === 'activo') return 0;
    if (candidateBucket === 'versatil') return 1;
    return 2;
  }

  if (selfBucket === 'versatil') {
    if (candidateBucket === 'versatil') return 0;
    if (candidateBucket === 'activo') return 1;
    if (candidateBucket === 'pasivo') return 2;
    return 3;
  }

  return 4;
};

const ChatBottomNav = ({
  onOpenBaul,
  onOpenOpin,
  onOpenFeaturedChannels,
  onOpenEsencias,
  pendingPrivateRequests = [],
  unreadPrivateMessages = {},
  privateInboxItems = [],
  privateSuggestedUsers = [],
  currentUserResolvedRole = '',
  currentUserComuna = '',
  onStartPrivateChat,
  onAcceptPrivateRequest,
  onDeclinePrivateRequest,
  onOpenPrivates,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    recentPrivateChats,
    openPrivateChats,
    openRecentPrivateChat,
    closePrivateChat,
    removeRecentPrivateChat,
    maxOpenPrivateChats,
  } = usePrivateChat();
  const [isPrivatesSheetOpen, setIsPrivatesSheetOpen] = useState(false);
  const [privatesTab, setPrivatesTab] = useState('suggested');
  const [sheetQuery, setSheetQuery] = useState('');
  const [openingSuggestedUserId, setOpeningSuggestedUserId] = useState(null);
  const [shouldPulseConecta, setShouldPulseConecta] = useState(false);
  const isChat = location.pathname.startsWith('/chat');
  const isPrincipal = location.pathname === '/chat/principal' || location.pathname === '/chat';
  const isHeteroRoom = location.pathname.startsWith('/chat/hetero-general');
  const isBaul = ENABLE_BAUL && location.pathname.startsWith('/baul');
  const isOpin = location.pathname.startsWith('/opin');

  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const isSwipeCandidateRef = useRef(true);
  const lastSwipeAtRef = useRef(0);

  const getPrivateChatKey = (chat) => {
    if (!chat) return null;
    if (chat.chatId) return `chat:${chat.chatId}`;
    const partnerId = chat?.partner?.userId || chat?.partner?.id;
    if (partnerId) return `partner:${partnerId}`;
    return null;
  };

  const normalizeInboxChat = (item = {}) => {
    const chatId = item?.chatId || item?.conversationId || null;
    if (!chatId) return null;
    const isGroup = Boolean(item?.isGroup);
    return {
      chatId,
      partner: isGroup
        ? {
          userId: chatId,
          username: item?.title || item?.otherUserDisplayName || 'Chat privado',
          avatar: '',
          isPremium: false,
        }
        : {
          userId: item?.otherUserId || chatId,
          username: item?.otherUserDisplayName || 'Usuario',
          avatar: item?.otherUserAvatar || '',
          isPremium: false,
        },
      participants: Array.isArray(item?.participantProfiles) ? item.participantProfiles : [],
      title: item?.title || '',
      roomId: item?.roomId || null,
      lastMessagePreview: item?.lastMessagePreview || '',
      lastMessageAt: Number(item?.lastMessageAt?.toMillis?.() || item?.updatedAt?.toMillis?.() || item?.lastMessageAt || item?.updatedAt || Date.now()),
      unreadCount: Number(item?.unreadCount || 0),
      isOpen: Boolean(item?.isOpen),
    };
  };

  const mergedPrivateChats = useMemo(() => {
    const result = [];
    const seen = new Set();
    const push = (chat, isOpen = false) => {
      const key = getPrivateChatKey(chat);
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push({
        key,
        chatId: chat?.chatId || null,
        partner: chat?.partner || {},
        participants: chat?.participants || [],
        title: chat?.title || '',
        roomId: chat?.roomId || null,
        lastMessagePreview: chat?.lastMessagePreview || '',
        lastMessageAt: Number(chat?.lastMessageAt || chat?.lastActivityAt || Date.now()),
        unreadCount: Number(chat?.unreadCount || 0),
        isOpen,
      });
    };

    (openPrivateChats || []).forEach((chat) => push(chat, true));
    (Array.isArray(privateInboxItems) ? privateInboxItems : [])
      .map((item) => normalizeInboxChat(item))
      .filter(Boolean)
      .forEach((chat) => push(chat, Boolean(chat?.isOpen)));
    (recentPrivateChats || []).forEach((chat) => push(chat, false));

    return result.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }, [openPrivateChats, privateInboxItems, recentPrivateChats]);

  const normalizedPendingRequests = useMemo(() => (
    (Array.isArray(pendingPrivateRequests) ? pendingPrivateRequests : [])
      .filter((item) => item?.notificationId)
      .sort((a, b) => Number(b?.expiresAtMs || 0) - Number(a?.expiresAtMs || 0))
  ), [pendingPrivateRequests]);

  const normalizedSheetQuery = sheetQuery.trim().toLowerCase();

  const existingPrivatePartnerIds = useMemo(() => {
    const ids = new Set();
    mergedPrivateChats.forEach((chat) => {
      const partnerId = chat?.partner?.userId || chat?.partner?.id;
      if (partnerId) ids.add(partnerId);
    });
    return ids;
  }, [mergedPrivateChats]);

  const pendingRequestUserIds = useMemo(() => {
    const ids = new Set();
    normalizedPendingRequests.forEach((request) => {
      const userId = request?.from?.userId || request?.from?.id;
      if (userId) ids.add(userId);
    });
    return ids;
  }, [normalizedPendingRequests]);

  const filteredPrivateChats = useMemo(() => {
    if (!normalizedSheetQuery) return mergedPrivateChats;
    return mergedPrivateChats.filter((chat) => {
      const partnerName = chat?.partner?.username || '';
      const preview = chat?.lastMessagePreview || '';
      return `${partnerName} ${preview}`.toLowerCase().includes(normalizedSheetQuery);
    });
  }, [mergedPrivateChats, normalizedSheetQuery]);

  const baseSuggestedUsers = useMemo(() => {
    const source = Array.isArray(privateSuggestedUsers) ? privateSuggestedUsers : [];

    return source
      .filter((candidate) => {
        const userId = candidate?.userId || candidate?.id;
        if (!userId) return false;
        if (existingPrivatePartnerIds.has(userId)) return false;
        if (pendingRequestUserIds.has(userId)) return false;

        if (!normalizedSheetQuery) return true;
        const haystack = [
          candidate?.username || '',
          candidate?.roleBadge || '',
          candidate?.chatSeekingBadgeLabel || '',
          candidate?.comuna || '',
          candidate?.opportunityText || '',
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedSheetQuery);
      })
      .sort((a, b) => {
        if (Boolean(a?.sameComuna) !== Boolean(b?.sameComuna)) return a?.sameComuna ? -1 : 1;
        if (getSuggestionRecurrenceRank(a) !== getSuggestionRecurrenceRank(b)) {
          return getSuggestionRecurrenceRank(a) - getSuggestionRecurrenceRank(b);
        }
        if (getSuggestionRolePriority(currentUserResolvedRole, a?.roleBadge) !== getSuggestionRolePriority(currentUserResolvedRole, b?.roleBadge)) {
          return getSuggestionRolePriority(currentUserResolvedRole, a?.roleBadge) - getSuggestionRolePriority(currentUserResolvedRole, b?.roleBadge);
        }
        return Number(b?.score || 0) - Number(a?.score || 0);
      })
      .slice(0, 60);
  }, [
    privateSuggestedUsers,
    existingPrivatePartnerIds,
    pendingRequestUserIds,
    currentUserResolvedRole,
    normalizedSheetQuery,
  ]);

  const suggestedPrivateUsers = useMemo(
    () => baseSuggestedUsers.filter((candidate) => isStrictRoleMatch(currentUserResolvedRole, candidate?.roleBadge)),
    [baseSuggestedUsers, currentUserResolvedRole]
  );

  const nearbySuggestedUsers = useMemo(
    () => suggestedPrivateUsers.filter((candidate) => Boolean(candidate?.sameComuna)),
    [suggestedPrivateUsers]
  );

  const recurrentSuggestedUsers = useMemo(
    () => suggestedPrivateUsers
      .filter((candidate) => (
        Number(candidate?.score || 0) >= 64
        || getSuggestionRecurrenceLevel(candidate) !== 'ninguna'
        || candidate?.opportunitySource === 'opin'
        || Boolean(candidate?.intentSummary)
      ))
      .slice(0, 6),
    [suggestedPrivateUsers]
  );

  const recurrentUserIds = useMemo(
    () => new Set(recurrentSuggestedUsers.map((candidate) => candidate?.userId || candidate?.id).filter(Boolean)),
    [recurrentSuggestedUsers]
  );

  const localSuggestedUsers = useMemo(
    () => nearbySuggestedUsers.filter((candidate) => !recurrentUserIds.has(candidate?.userId || candidate?.id)).slice(0, 8),
    [nearbySuggestedUsers, recurrentUserIds]
  );

  const farSuggestedUsers = useMemo(
    () => suggestedPrivateUsers.filter((candidate) => !candidate?.sameComuna && !recurrentUserIds.has(candidate?.userId || candidate?.id)).slice(0, 8),
    [suggestedPrivateUsers, recurrentUserIds]
  );

  const alsoInterestingUsers = useMemo(
    () => baseSuggestedUsers
      .filter((candidate) => !recurrentUserIds.has(candidate?.userId || candidate?.id))
      .filter((candidate) => !suggestedPrivateUsers.some((strictCandidate) => (strictCandidate?.userId || strictCandidate?.id) === (candidate?.userId || candidate?.id)))
      .slice(0, 8),
    [baseSuggestedUsers, recurrentUserIds, suggestedPrivateUsers]
  );

  const totalUnreadPrivateMessages = useMemo(() => {
    const inboxTotal = mergedPrivateChats.reduce((sum, item) => sum + Number(item?.unreadCount || 0), 0);
    if (inboxTotal > 0) return inboxTotal;
    return Object.values(unreadPrivateMessages || {}).reduce((sum, item) => sum + Number(item?.count || 0), 0);
  }, [mergedPrivateChats, unreadPrivateMessages]);

  const privateBadgeCount = (() => {
    const total = normalizedPendingRequests.length + totalUnreadPrivateMessages;
    if (total <= 0) return null;
    return Math.min(99, total);
  })();

  const openLatestPrivateChat = () => {
    onOpenPrivates?.();
    if (mergedPrivateChats.length === 0) {
      toast({
        title: 'Sin conversaciones privadas',
        description: 'Cuando inicies un chat privado aparecerá aquí.',
      });
      navigate('/chat/principal');
      return;
    }

    const latest = mergedPrivateChats[0];
    const result = openRecentPrivateChat({
      chatId: latest.chatId || null,
      partner: latest.partner || {},
      participants: latest.participants || [],
      title: latest.title || '',
      roomId: latest.roomId || null,
      lastMessageAt: latest.lastMessageAt || Date.now(),
    });

    if (!result?.ok && result?.reason === 'limit_reached') {
      toast({
        title: 'Límite de chats privados',
        description: `Puedes abrir hasta ${maxOpenPrivateChats || 3} privados al mismo tiempo.`,
        variant: 'destructive',
      });
      return;
    }

    navigate('/chat/principal');
  };

  const openPrivatesSheet = () => {
    onOpenPrivates?.();
    setPrivatesTab('suggested');
    setSheetQuery('');
    setIsPrivatesSheetOpen(true);
  };

  const closePrivatesSheet = () => {
    setIsPrivatesSheetOpen(false);
  };

  useEffect(() => {
    const shouldAnimate = !isPrivatesSheetOpen && (
      normalizedPendingRequests.length > 0
      || totalUnreadPrivateMessages > 0
      || baseSuggestedUsers.length > 0
    );

    if (!shouldAnimate) {
      setShouldPulseConecta(false);
      return undefined;
    }

    let pulseTimeoutId = null;

    const runPulse = () => {
      setShouldPulseConecta(true);
      pulseTimeoutId = window.setTimeout(() => {
        setShouldPulseConecta(false);
      }, 2200);
    };

    runPulse();
    const intervalId = window.setInterval(runPulse, 16000);

    return () => {
      window.clearInterval(intervalId);
      if (pulseTimeoutId) window.clearTimeout(pulseTimeoutId);
    };
  }, [isPrivatesSheetOpen, normalizedPendingRequests.length, totalUnreadPrivateMessages, baseSuggestedUsers.length]);

  const handleStartSuggestedConversation = async (candidate) => {
    if (!candidate?.userId || !onStartPrivateChat) return;
    setOpeningSuggestedUserId(candidate.userId);
    closePrivatesSheet();
    navigate('/chat/principal');
    try {
      await onStartPrivateChat(candidate, {
        silentSuccess: true,
        source: 'privates_sheet_suggested',
      });
    } finally {
      setOpeningSuggestedUserId(null);
    }
  };

  const handleOpenConversation = (chat) => {
    onOpenPrivates?.();
    const result = openRecentPrivateChat({
      chatId: chat.chatId || null,
      partner: chat.partner || {},
      participants: chat.participants || [],
      title: chat.title || '',
      roomId: chat.roomId || null,
      lastMessageAt: chat.lastMessageAt || Date.now(),
    });

    if (!result?.ok && result?.reason === 'limit_reached') {
      toast({
        title: 'Límite de chats privados',
        description: `Puedes abrir hasta ${maxOpenPrivateChats || 3} privados al mismo tiempo.`,
        variant: 'destructive',
      });
      return;
    }

    closePrivatesSheet();
    navigate('/chat/principal');
  };

  const handleDeleteConversation = (chat) => {
    if (chat?.chatId) {
      closePrivateChat(chat.chatId);
    }
    removeRecentPrivateChat(chat);
  };

  const handleAcceptRequest = async (request) => {
    await onAcceptPrivateRequest?.(request);
    closePrivatesSheet();
    navigate('/chat/principal');
  };

  const handleDeclineRequest = async (request) => {
    await onDeclinePrivateRequest?.(request);
  };

  const items = isHeteroRoom
    ? [
      {
        id: 'hetero',
        icon: Sparkles,
        label: 'Hetero',
        onClick: () => navigate('/hetero'),
        active: location.pathname.startsWith('/hetero'),
        path: '/hetero',
        swipeEnabled: true,
      },
      {
        id: 'chat-hetero',
        icon: MessageCircle,
        label: 'Chat',
        onClick: () => navigate('/chat/hetero-general'),
        active: location.pathname.startsWith('/chat/hetero-general'),
        path: '/chat/hetero-general',
        swipeEnabled: true,
      },
    ]
    : [
    ...(ENABLE_BAUL ? [{
      id: 'baul',
      icon: Archive,
      label: 'Baúl',
      onClick: () => (onOpenBaul ? onOpenBaul() : navigate('/baul')),
      active: isBaul,
      path: '/baul',
      swipeEnabled: true,
    }] : []),
    {
      id: 'opin',
      icon: Sparkles,
      label: 'OPIN',
      onClick: () => (onOpenOpin ? onOpenOpin() : navigate('/opin')),
      active: isOpin,
      path: '/opin',
      swipeEnabled: true,
    },
    {
      id: 'privates',
      icon: MessagesSquare,
      label: 'Conecta',
      onClick: openPrivatesSheet,
      active: isPrivatesSheetOpen,
      path: null,
      swipeEnabled: false,
      badge: privateBadgeCount,
    },
    {
      id: 'featured',
      icon: Megaphone,
      label: 'Canales',
      onClick: () => {
        if (onOpenFeaturedChannels) {
          onOpenFeaturedChannels();
          return;
        }
        if (onOpenEsencias) {
          onOpenEsencias(); // Compatibilidad retroactiva
          return;
        }
        navigate('/chat/principal');
      },
      active: false,
      path: null,
      swipeEnabled: false,
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      onClick: () => navigate('/chat/principal'),
      active: isChat && isPrincipal,
      path: '/chat/principal',
      swipeEnabled: true,
    },
    ];

  const swipeTargets = useMemo(() => {
    if (isHeteroRoom) {
      return [
        { id: 'chat-hetero', path: '/chat/hetero-general' },
        { id: 'hetero', path: '/hetero' },
      ];
    }
    return [
      { id: 'chat', path: '/chat/principal' },
      { id: 'opin', path: '/opin' },
      ...(ENABLE_BAUL ? [{ id: 'baul', path: '/baul' }] : []),
    ];
  }, [isHeteroRoom]);

  const currentSwipeIndex = useMemo(() => {
    if (isHeteroRoom) return swipeTargets.findIndex((item) => item.id === 'chat-hetero');
    if (isBaul) return swipeTargets.findIndex((item) => item.id === 'baul');
    if (isOpin) return swipeTargets.findIndex((item) => item.id === 'opin');
    return swipeTargets.findIndex((item) => item.id === 'chat');
  }, [isBaul, isHeteroRoom, isOpin, swipeTargets]);

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    const target = event.target;
    const blockedByInteractiveTarget = Boolean(
      target?.closest?.(
        'input, textarea, select, button, a, [contenteditable="true"], [data-no-swipe-nav], .no-swipe-nav'
      )
    );

    isSwipeCandidateRef.current = !blockedByInteractiveTarget;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const resolveSwipeNavigation = (dx, dy) => {
    // Solo en móvil
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;

    // Evitar spam de navegación por swipes consecutivos
    if (Date.now() - lastSwipeAtRef.current < 380) return;

    // Priorizar swipe horizontal claro para evitar conflicto con scroll vertical
    if (Math.abs(dx) < 58) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    const direction = dx < 0 ? 1 : -1; // izquierda = siguiente, derecha = anterior
    const nextIndex = currentSwipeIndex + direction;
    if (nextIndex < 0 || nextIndex >= swipeTargets.length) return;

    const target = swipeTargets[nextIndex];
    if (!target?.path) return;

    lastSwipeAtRef.current = Date.now();
    navigate(target.path);
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;
    if (!isSwipeCandidateRef.current) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      isSwipeCandidateRef.current = true;
      return;
    }

    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipeCandidateRef.current = true;
    resolveSwipeNavigation(dx, dy);
  };

  useEffect(() => {
    const handleWindowTouchStart = (event) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
      handleTouchStart(event);
    };

    const handleWindowTouchEnd = (event) => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
      handleTouchEnd(event);
    };

    window.addEventListener('touchstart', handleWindowTouchStart, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleWindowTouchStart);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [currentSwipeIndex, navigate, swipeTargets]);

  const renderSuggestedUserRow = (candidate, { actionLabel = 'Hablar', compact = false } = {}) => {
    const candidateId = candidate?.userId || candidate?.id;
    const isOpening = openingSuggestedUserId && openingSuggestedUserId === candidateId;
    const statusText = candidate?.chatSeekingBadgeLabel || candidate?.opportunityText || 'Disponible para conversar';
    const whyText = candidate?.matchHeadline || null;
    const reasonBadges = Array.isArray(candidate?.matchReasons) ? candidate.matchReasons.slice(0, 2) : [];
    const recurrenceLevel = getSuggestionRecurrenceLevel(candidate);
    const primaryMetaLabel = recurrenceLevel === 'alta'
      ? 'Te aparece seguido'
      : recurrenceLevel === 'media'
        ? 'Ya hubo interés'
        : candidate?.opportunityMeta || null;

    return (
      <div
        key={candidateId}
        className={`flex items-center gap-3 px-3 ${compact ? 'py-3' : 'py-3.5'}`}
      >
        <Avatar className="h-12 w-12 border border-slate-200">
          <AvatarImage src={candidate?.avatar || ''} alt={candidate?.username || 'Usuario'} />
          <AvatarFallback className="bg-slate-50 text-sm text-slate-700">
            {(candidate?.username || 'US').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{candidate?.username || 'Usuario'}</p>
            {candidate?.roleBadge ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {candidate.roleBadge}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 truncate text-xs text-slate-600">{statusText}</p>
          {whyText ? (
            <p className="mt-1 truncate text-[11px] font-medium text-emerald-700">
              {whyText}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {reasonBadges.map((reason) => (
              <span
                key={`${candidateId}:${reason}`}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
              >
                {reason}
              </span>
            ))}
            {!reasonBadges.length && candidate?.comuna ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {candidate.comuna}
              </span>
            ) : null}
            {primaryMetaLabel ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                recurrenceLevel !== 'ninguna'
                  ? 'bg-violet-50 text-violet-700'
                  : 'bg-sky-50 text-sky-700'
              }`}>
                {primaryMetaLabel}
              </span>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={isOpening}
          onClick={() => handleStartSuggestedConversation(candidate)}
          className="h-9 rounded-full bg-[#1473E6] px-3 text-xs text-white hover:bg-[#0F67D8]"
        >
          {isOpening ? 'Abriendo...' : actionLabel}
        </Button>
      </div>
    );
  };

  return (
    <>
      {isPrivatesSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[125]">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(17,24,39,0.42)] backdrop-blur-[2px]"
            onClick={closePrivatesSheet}
            aria-label="Cerrar bandeja de conecta"
          />

          <div
            className="absolute left-0 right-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] border border-slate-200 bg-white shadow-[0_-18px_48px_rgba(15,23,42,0.18)]"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-300/80" />

            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Conecta</h3>
                <p className="text-xs text-slate-500">
                  Sugeridos e historial privado dentro de Chactivo
                </p>
              </div>
              <button
                type="button"
                onClick={closePrivatesSheet}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Cerrar conecta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={sheetQuery}
                  onChange={(event) => setSheetQuery(event.target.value)}
                  placeholder={privatesTab === 'chats' ? 'Buscar conversaciones...' : 'Buscar personas sugeridas...'}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:bg-white"
                />
              </div>
            </div>

            <div className="px-3 pb-2">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setPrivatesTab('chats')}
                  className={`h-10 rounded-[14px] text-sm font-semibold transition-colors ${
                    privatesTab === 'chats'
                      ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Chats
                </button>
                <button
                  type="button"
                  onClick={() => setPrivatesTab('suggested')}
                  className={`h-10 rounded-[14px] text-sm font-semibold transition-colors ${
                    privatesTab === 'suggested'
                      ? 'bg-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.08)]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sugeridos
                </button>
              </div>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-3 pb-2 space-y-3">
              {normalizedPendingRequests.length > 0 ? (
                <section className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        Solicitudes pendientes
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Nada se abre solo. Tú decides si aceptar o no.
                      </p>
                    </div>
                    <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-sky-700">
                      {normalizedPendingRequests.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {normalizedPendingRequests.map((request) => {
                      const isGroupRequest = request?.type === 'private_group_invite_request';
                      const partnerName = request?.from?.username || 'Usuario';
                      const helperText = isGroupRequest
                        ? `${partnerName} quiere sumar a ${request?.requestedUser?.username || 'otro usuario'}`
                        : `${partnerName} quiere hablar contigo`;

                      return (
                        <div
                          key={request.notificationId}
                          className="rounded-2xl border border-white/80 bg-white px-3 py-2.5 shadow-[0_8px_20px_rgba(14,116,144,0.08)]"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border border-sky-100">
                              <AvatarImage src={request?.from?.avatar || ''} alt={partnerName} />
                              <AvatarFallback className="bg-slate-50 text-sm text-slate-700">
                                {partnerName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">{partnerName}</p>
                              <p className="truncate text-xs text-slate-500">{helperText}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeclineRequest(request)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-500 hover:bg-rose-50"
                                aria-label="Declinar solicitud"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptRequest(request)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1473E6] text-white hover:bg-[#0F67D8]"
                                aria-label="Aceptar solicitud"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {privatesTab === 'chats' ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                      Historial
                    </p>
                    <span className="text-[11px] text-slate-500">{filteredPrivateChats.length}</span>
                  </div>

                  {filteredPrivateChats.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
                      <p className="text-sm font-medium text-slate-900">Tu historial aún está vacío.</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Aquí quedarán guardadas tus conversaciones para seguir dentro de Chactivo, sin salir a otra app.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                      {filteredPrivateChats.map((chat, index) => {
                        const partnerName = chat?.partner?.username || 'Usuario';
                        const partnerAvatar = chat?.partner?.avatar || '';
                        const isOpen = (openPrivateChats || []).some((item) => item.chatId === chat.chatId);
                        const unreadMeta = chat?.chatId ? unreadPrivateMessages?.[chat.chatId] : null;
                        const unreadCount = Number(chat?.unreadCount || unreadMeta?.count || 0);
                        const lastPreview = chat?.lastMessagePreview || unreadMeta?.latestContent || 'Toca para abrir la conversación';

                        return (
                          <div
                            key={chat.key}
                            className={`flex items-center gap-3 px-3 py-3 ${index !== 0 ? 'border-t border-slate-100' : ''}`}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenConversation(chat)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <Avatar className="h-12 w-12 border border-slate-200">
                                <AvatarImage src={partnerAvatar} alt={partnerName} />
                                <AvatarFallback className="bg-slate-50 text-sm text-slate-700">
                                  {partnerName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-900">{partnerName}</p>
                                  {isOpen ? (
                                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                      Abierto
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-500">{lastPreview}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 pl-2">
                                <span className="text-[11px] text-slate-400">{formatRelativeTime(chat.lastMessageAt)}</span>
                                {unreadCount > 0 ? (
                                  <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#1473E6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteConversation(chat)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                              aria-label="Eliminar conversación"
                              title="Eliminar conversación de la bandeja"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : (
                <section className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {nearbySuggestedUsers.length > 0
                        ? (currentUserComuna
                          ? `Primero te mostramos personas de ${currentUserComuna}.`
                          : 'Primero te mostramos personas que mejor encajan contigo.')
                        : 'No hay matches cercanos. Escalamos a perfiles compatibles que igual pasan tus filtros.'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      El orden prioriza compatibilidad, intereses, recurrencia y cercanía. Si no hay en tu comuna, bajamos a compatibles de otras zonas y luego a perfiles que también podrían interesarte.
                    </p>
                  </div>

                  {baseSuggestedUsers.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center">
                      <p className="text-sm font-medium text-slate-900">No hay sugeridos para este filtro.</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Ajusta la búsqueda o vuelve luego. Los sugeridos no dependen de que estén conectados, sino de compatibilidad e historial.
                      </p>
                    </div>
                  ) : (
                    <>
                      {recurrentSuggestedUsers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                              Recurrentes para ti
                            </p>
                            <span className="text-[11px] text-slate-500">{recurrentSuggestedUsers.length}</span>
                          </div>

                          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                            {recurrentSuggestedUsers.map((candidate, index) => (
                              <div
                                key={candidate.userId || candidate.id}
                                className={index !== 0 ? 'border-t border-slate-100' : ''}
                              >
                                {renderSuggestedUserRow(candidate, { actionLabel: 'Abrir' })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {localSuggestedUsers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                              {currentUserComuna ? `En ${currentUserComuna} ahora` : 'Cerca de ti'}
                            </p>
                            <span className="text-[11px] text-slate-500">{localSuggestedUsers.length}</span>
                          </div>

                          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                            {localSuggestedUsers.map((candidate, index) => (
                              <div
                                key={candidate.userId || candidate.id}
                                className={index !== 0 ? 'border-t border-slate-100' : ''}
                              >
                              {renderSuggestedUserRow(candidate, { actionLabel: 'Abrir' })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {farSuggestedUsers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                              Otras comunas interesantes
                            </p>
                            <span className="text-[11px] text-slate-500">{farSuggestedUsers.length}</span>
                          </div>

                          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                            {farSuggestedUsers.map((candidate, index) => (
                              <div
                                key={candidate.userId || candidate.id}
                                className={index !== 0 ? 'border-t border-slate-100' : ''}
                              >
                                {renderSuggestedUserRow(candidate)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {alsoInterestingUsers.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                              También podría interesarte
                            </p>
                            <span className="text-[11px] text-slate-500">{alsoInterestingUsers.length}</span>
                          </div>

                          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                            {alsoInterestingUsers.map((candidate, index) => (
                              <div
                                key={candidate.userId || candidate.id}
                                className={index !== 0 ? 'border-t border-slate-100' : ''}
                              >
                                {renderSuggestedUserRow(candidate)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[62px] bg-[var(--chat-bottom-surface)] backdrop-blur-xl border-t border-[var(--chat-divider)] flex items-center justify-around px-2 safe-area-pb"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.active;
          const shouldPulsePrivates = item.id === 'privates' && !active && shouldPulseConecta;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 min-w-0 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <span className={`relative inline-flex items-center justify-center rounded-full p-2 transition-colors ${shouldPulsePrivates ? 'animate-pulse bg-[#1473E6]/10' : ''} ${active ? 'bg-primary/10' : 'bg-transparent'}`}>
                {shouldPulsePrivates ? (
                  <span className="absolute inset-[-6px] rounded-full bg-sky-400/20 blur-sm" />
                ) : null}
                <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={active ? 1.8 : 1.6} />
                {item.badge ? (
                  <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] text-white font-semibold leading-4 text-center ${
                    normalizedPendingRequests.length > 0 ? 'bg-cyan-500' : 'bg-emerald-500'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className={`w-full truncate text-center text-[10px] font-medium tracking-[-0.01em] ${shouldPulsePrivates ? 'text-[#1473E6]' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default ChatBottomNav;
