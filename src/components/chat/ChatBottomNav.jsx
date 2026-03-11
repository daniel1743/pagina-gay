/**
 * 📱 Barra de navegación inferior móvil
 * Cuatro iconos: Baúl, OPIN, Canales, Chat Principal
 * Solo visible en móvil (lg:hidden)
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Archive, Sparkles, MessageCircle, Megaphone, MessagesSquare } from 'lucide-react';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { toast } from '@/components/ui/use-toast';

const ChatBottomNav = ({ onOpenBaul, onOpenOpin, onOpenFeaturedChannels, onOpenEsencias }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    recentPrivateChats,
    openPrivateChats,
    openRecentPrivateChat,
    maxOpenPrivateChats,
  } = usePrivateChat();
  const isChat = location.pathname.startsWith('/chat');
  const isPrincipal = location.pathname === '/chat/principal' || location.pathname === '/chat';
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
        roomId: chat?.roomId || null,
        lastMessageAt: Number(chat?.lastMessageAt || chat?.lastActivityAt || Date.now()),
        isOpen,
      });
    };

    (openPrivateChats || []).forEach((chat) => push(chat, true));
    (recentPrivateChats || []).forEach((chat) => push(chat, false));

    return result.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }, [openPrivateChats, recentPrivateChats]);

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

  const items = [
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
      onClick: openLatestPrivateChat,
      active: mergedPrivateChats.length > 0 && isChat,
      path: null,
      swipeEnabled: false,
      badge: mergedPrivateChats.length > 0 ? Math.min(99, mergedPrivateChats.length) : null,
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

  const swipeTargets = useMemo(() => ([
    { id: 'chat', path: '/chat/principal' },
    { id: 'opin', path: '/opin' },
    { id: 'baul', path: '/baul' },
  ]), []);

  const currentSwipeIndex = useMemo(() => {
    if (isBaul) return swipeTargets.findIndex((item) => item.id === 'baul');
    if (isOpin) return swipeTargets.findIndex((item) => item.id === 'opin');
    return swipeTargets.findIndex((item) => item.id === 'chat');
  }, [isBaul, isOpin, swipeTargets]);

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
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-card/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 safe-area-pb"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.active;
        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 min-w-0 transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={item.label}
          >
            <span className="relative inline-flex">
              <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
              {item.badge ? (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[10px] text-white font-semibold leading-4 text-center">
                  {item.badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ChatBottomNav;
