import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Home, Volume2, VolumeX, Eye, Shuffle } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import NotificationInterestsMenu from '@/components/notifications/NotificationInterestsMenu';
import { notificationSounds } from '@/services/notificationSounds';
import { useAuth } from '@/contexts/AuthContext';

const roomNames = {
  // 'global': 'Chat Global', // ⚠️ DESACTIVADA
  'principal': 'Principal', // ✅ Título limpio y profesional
  'hetero-general': 'Principal',
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

const ChatHeader = ({
  currentRoom,
  onMenuClick,
  onOpenPrivateChat,
  onSimulate,
  showHelpLauncher = false,
  onOpenHelpTour,
  onDismissHelpLauncher,
  activityText = '',
  activityTickerItems = [],
  onRandomConnect = null,
  isRandomConnectActive = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(notificationSounds.getMuteState());
  const [tickerIndex, setTickerIndex] = useState(0);

  const normalizedTickerItems = useMemo(() => {
    if (!Array.isArray(activityTickerItems)) return [];
    const unique = new Set();
    activityTickerItems.forEach((item) => {
      const value = String(item || '').trim();
      if (!value) return;
      unique.add(value);
    });
    return Array.from(unique);
  }, [activityTickerItems]);

  useEffect(() => {
    setTickerIndex(0);
  }, [normalizedTickerItems.length, currentRoom]);

  useEffect(() => {
    if (normalizedTickerItems.length <= 1) return undefined;

    const intervalId = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % normalizedTickerItems.length);
    }, 3200);

    return () => clearInterval(intervalId);
  }, [normalizedTickerItems]);

  const handleToggleMute = () => {
    const newMuteState = notificationSounds.toggleMute();
    setIsMuted(newMuteState);
  };

  const tickerText = normalizedTickerItems[tickerIndex] || '';
  const hasTicker = normalizedTickerItems.length > 0;

  return (
    <header className="bg-card border-b h-[72px] sm:h-auto px-3 sm:px-4 py-2 sm:py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* ✅ FLECHA ELIMINADA - A petición del usuario */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex-shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground text-base sm:text-lg truncate">
            {roomNames[currentRoom] || 'Chat'}
          </h2>
          <div className="mt-0.5 h-4">
            {hasTicker ? (
              <p
                key={`${currentRoom}-${tickerIndex}`}
                className="text-[11px] text-muted-foreground leading-tight truncate whitespace-nowrap overflow-hidden animate-in fade-in duration-300"
              >
                {tickerText}
              </p>
            ) : activityText ? (
              <p className="text-[11px] text-muted-foreground leading-tight truncate whitespace-nowrap overflow-hidden">
                {activityText}
              </p>
            ) : null}
          </div>
          {showHelpLauncher && (
            <div className="mt-1 hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenHelpTour}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                ¿Perdido? Ver guía rápida
              </button>
              <button
                type="button"
                onClick={onDismissHelpLauncher}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Ocultar ayuda
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Iconos elegantes junto a la campana */}
        <div className="flex items-center gap-1.5">
          {typeof onRandomConnect === 'function' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRandomConnect}
              className={`min-w-[32px] min-h-[32px] w-8 h-8 p-0 ${
                isRandomConnectActive
                  ? 'text-cyan-300 hover:text-cyan-200'
                  : 'text-muted-foreground hover:text-cyan-400'
              }`}
              aria-label={isRandomConnectActive ? 'Detener conexión al azar' : 'Conectar al azar'}
              title={isRandomConnectActive ? 'Detener conexión al azar' : 'Conectar al azar'}
            >
              <Shuffle className={`w-4 h-4 ${isRandomConnectActive ? 'animate-pulse' : ''}`} />
            </Button>
          )}

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
        </div>
        
        <NotificationInterestsMenu />
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
