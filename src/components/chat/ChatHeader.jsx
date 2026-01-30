import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Home, Volume2, VolumeX, X, Eye } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { notificationSounds } from '@/services/notificationSounds';
import { useAuth } from '@/contexts/AuthContext';

const roomNames = {
  // 'global': 'Chat Global', // ⚠️ DESACTIVADA
  'principal': 'Principal', // ✅ Título limpio y profesional
  'gaming': 'Gaming',
  'mas-30': '+30',
  'amistad': 'Amistad',
  'osos-activos': 'Osos Activos',
  'pasivos-buscando': 'Pasivos Buscando',
  'versatiles': 'Versátiles',
  'quedar-ya': 'Quedar Ya',
  'hablar-primero': 'Hablar Primero',
  'morbosear': 'Morbosear',
  // 'conversas-libres' → redirige a 'principal'
};

const ChatHeader = ({ currentRoom, onMenuClick, onOpenPrivateChat, onSimulate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(notificationSounds.getMuteState());

  const handleToggleMute = () => {
    const newMuteState = notificationSounds.toggleMute();
    setIsMuted(newMuteState);
  };

  const handleQuickEscape = () => {
    // Redirect to Google for quick escape without leaving history
    window.location.replace('https://www.google.com/search?q=Google.com');
  };

  return (
    <header className="bg-card border-b p-3 sm:p-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* ✅ FLECHA ELIMINADA - A petición del usuario */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex-shrink-0"
          aria-label="Abrir menú de salas"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground text-base sm:text-lg truncate">
            {roomNames[currentRoom] || 'Chat'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Iconos elegantes junto a la campana */}
        <div className="flex items-center gap-1.5">
          {/* Icono SIMULAR - Protector de pantalla */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSimulate}
            className="text-muted-foreground hover:text-purple-400 min-w-[32px] min-h-[32px] w-8 h-8 p-0"
            aria-label="Simular - Ocultar chat y mostrar protector de pantalla"
            title="Simular - Ocultar chat y mostrar protector de pantalla"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Icono Quick Escape */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleQuickEscape}
            className="text-muted-foreground hover:text-red-400 min-w-[32px] min-h-[32px] w-8 h-8 p-0"
            aria-label="Escape rápido - Salir inmediatamente"
            title="Escape rápido - Salir inmediatamente"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <NotificationBell onOpenPrivateChat={onOpenPrivateChat} />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleMute}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            isMuted
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-cyan-400 hover:text-cyan-300'
          }`}
          aria-label={isMuted ? 'Activar sonidos' : 'Silenciar sonidos'}
          title={isMuted ? 'Activar sonidos de notificación' : 'Silenciar sonidos'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // ✅ Usuarios registrados → /home (OPIN, Baúl, etc), invitados → /landing
            if (user && !user.isGuest && !user.isAnonymous) {
              navigate('/home');
            } else {
              navigate('/landing');
            }
          }}
          className="text-muted-foreground hover:text-cyan-400 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          aria-label="Ir al inicio"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
