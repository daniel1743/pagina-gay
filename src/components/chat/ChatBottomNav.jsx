/**
 * 📱 Barra de navegación inferior móvil
 * Incluye bandeja de privados estilo historial móvil
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Archive, Sparkles, MessageCircle, Megaphone, MessagesSquare, X, Check, Clock3, Trash2 } from 'lucide-react';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { toast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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

const ChatBottomNav = ({
  onOpenBaul,
  onOpenOpin,
  onOpenFeaturedChannels,
  onOpenEsencias,
  pendingPrivateRequests = [],
  unreadPrivateMessages = {},
  privateInboxItems = [],
  onAcceptPrivateRequest,
  onDeclinePrivateRequest,
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
  const isChat = location.pathname.startsWith('/chat');
  const isPrincipal = location.pathname === '/chat/principal' || location.pathname === '/chat';
  const isHeteroRoom = location.pathname.startsWith('/chat/hetero-general');
  const isBaul = location.pathname.startsWith('/baul');
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
    setIsPrivatesSheetOpen(true);
  };

  const closePrivatesSheet = () => {
    setIsPrivatesSheetOpen(false);
  };

  const handleOpenConversation = (chat) => {
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
    {
      id: 'baul',
      icon: Archive,
      label: 'Baúl',
      onClick: () => (onOpenBaul ? onOpenBaul() : navigate('/baul')),
      active: isBaul,
      path: '/baul',
      swipeEnabled: true,
    },
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
      label: 'Privados',
      onClick: openPrivatesSheet,
      active: isPrivatesSheetOpen || (mergedPrivateChats.length > 0 && isChat),
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
      { id: 'baul', path: '/baul' },
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

  return (
    <>
      {isPrivatesSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[125]">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
            onClick={closePrivatesSheet}
            aria-label="Cerrar bandeja de privados"
          />

          <div
            className="absolute left-0 right-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] border border-border/70 bg-card/96 backdrop-blur-xl shadow-[0_-18px_48px_rgba(0,0,0,0.45)]"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground">Privados</h3>
                <p className="text-xs text-muted-foreground">
                  Solicitudes pendientes e historial de conversaciones
                </p>
              </div>
              <button
                type="button"
                onClick={closePrivatesSheet}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                aria-label="Cerrar privados"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-3 pb-2 space-y-3">
              <section>
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Solicitudes pendientes
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {normalizedPendingRequests.length}
                  </span>
                </div>

                {normalizedPendingRequests.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 text-center">
                    <p className="text-sm text-foreground">No tienes solicitudes pendientes.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuando alguien te invite a un privado aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {normalizedPendingRequests.map((request) => {
                      const isGroupRequest = request?.type === 'private_group_invite_request';
                      const partnerName = request?.from?.username || 'Usuario';
                      const helperText = isGroupRequest
                        ? `${partnerName} quiere sumar a ${request?.requestedUser?.username || 'otro usuario'} a un privado`
                        : `${partnerName} te invitó a un chat privado`;

                      return (
                        <div
                          key={request.notificationId}
                          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11 border border-cyan-400/35">
                              <AvatarImage src={request?.from?.avatar || ''} alt={partnerName} />
                              <AvatarFallback className="bg-secondary text-sm">
                                {partnerName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">{partnerName}</p>
                                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                                  Pendiente
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                {helperText}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request)}
                              className="flex-1 h-10 border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            >
                              Declinar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleAcceptRequest(request)}
                              className="flex-1 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                            >
                              <Check className="w-4 h-4 mr-1.5" />
                              Aceptar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                    Historial de conversaciones
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {mergedPrivateChats.length}
                  </span>
                </div>

                {mergedPrivateChats.length === 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-4 text-center">
                    <p className="text-sm text-foreground">Aún no tienes conversaciones guardadas.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cuando hables con alguien en privado, el historial aparecerá aquí como en una bandeja de mensajería.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mergedPrivateChats.map((chat) => {
                      const partnerName = chat?.partner?.username || 'Usuario';
                      const partnerAvatar = chat?.partner?.avatar || '';
                      const isOpen = (openPrivateChats || []).some((item) => item.chatId === chat.chatId);
                      const unreadMeta = chat?.chatId ? unreadPrivateMessages?.[chat.chatId] : null;
                      const unreadCount = Number(chat?.unreadCount || unreadMeta?.count || 0);
                      const lastPreview = chat?.lastMessagePreview || unreadMeta?.latestContent || 'Toca para abrir la conversación';

                      return (
                        <div
                          key={chat.key}
                          className="rounded-2xl border border-border/70 bg-secondary/20 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11 border border-emerald-500/25">
                              <AvatarImage src={partnerAvatar} alt={partnerName} />
                              <AvatarFallback className="bg-secondary text-sm">
                                {partnerName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            <button
                              type="button"
                              onClick={() => handleOpenConversation(chat)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground truncate">{partnerName}</p>
                                {unreadCount > 0 ? (
                                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : null}
                                {isOpen ? (
                                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                                    Abierto
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                {lastPreview}
                              </p>
                              <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock3 className="w-3.5 h-3.5" />
                                {formatRelativeTime(chat.lastMessageAt)}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteConversation(chat)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/60 text-muted-foreground hover:text-rose-300 hover:border-rose-500/40 hover:bg-rose-500/10"
                              aria-label="Eliminar conversación"
                              title="Eliminar conversación de la bandeja"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
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
          const shouldPulsePrivates = item.id === 'privates' && Number(item.badge || 0) > 0 && !active;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 min-w-0 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <span className={`relative inline-flex items-center justify-center rounded-full p-2 transition-colors ${shouldPulsePrivates ? 'animate-pulse' : ''} ${active ? 'bg-primary/10' : 'bg-transparent'}`}>
                {shouldPulsePrivates ? (
                  <span className="absolute inset-[-5px] rounded-full bg-emerald-500/15 blur-sm" />
                ) : null}
                <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                {item.badge ? (
                  <span className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] text-white font-semibold leading-4 text-center ${
                    normalizedPendingRequests.length > 0 ? 'bg-cyan-500' : 'bg-emerald-500'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] font-medium truncate w-full text-center ${shouldPulsePrivates ? 'text-emerald-300' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default ChatBottomNav;
