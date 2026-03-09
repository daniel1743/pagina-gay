/**
 * 📱 Barra de navegación inferior móvil
 * Cuatro iconos: Baúl, OPIN, Canales, Chat Principal
 * Solo visible en móvil (lg:hidden)
 */

import React, { useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Archive, Sparkles, MessageCircle, Megaphone } from 'lucide-react';

const ChatBottomNav = ({ onOpenBaul, onOpenOpin, onOpenFeaturedChannels, onOpenEsencias }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isPrincipal = location.pathname === '/chat/principal' || location.pathname === '/chat';
  const isBaul = location.pathname.startsWith('/baul');
  const isOpin = location.pathname.startsWith('/opin');

  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

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
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;

    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Priorizar swipe horizontal claro para evitar conflicto con scroll vertical
    if (Math.abs(dx) < 48) return;
    if (Math.abs(dx) <= Math.abs(dy)) return;

    const direction = dx < 0 ? 1 : -1; // izquierda = siguiente, derecha = anterior
    const nextIndex = currentSwipeIndex + direction;
    if (nextIndex < 0 || nextIndex >= swipeTargets.length) return;

    const target = swipeTargets[nextIndex];
    if (!target?.path) return;
    navigate(target.path);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-card/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 safe-area-pb"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
            <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ChatBottomNav;
