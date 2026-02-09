/**
 * 📱 Barra de navegación inferior móvil
 * Tres iconos: Baúl, OPIN, Chat Principal
 * Solo visible en móvil (lg:hidden)
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Archive, Sparkles, MessageCircle } from 'lucide-react';

const ChatBottomNav = ({ onOpenBaul, onOpenOpin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');
  const isPrincipal = location.pathname === '/chat/principal' || location.pathname === '/chat';
  const isBaul = location.pathname.startsWith('/baul');
  const isOpin = location.pathname.startsWith('/opin');

  const items = [
    {
      id: 'baul',
      icon: Archive,
      label: 'Baúl',
      onClick: () => (onOpenBaul ? onOpenBaul() : navigate('/baul')),
      active: isBaul,
    },
    {
      id: 'opin',
      icon: Sparkles,
      label: 'OPIN',
      onClick: () => (onOpenOpin ? onOpenOpin() : navigate('/opin')),
      active: isOpin,
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      onClick: () => navigate('/chat/principal'),
      active: isChat && isPrincipal,
    },
  ];

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
            <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ChatBottomNav;
