import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Volume2, VolumeX, Eye, Shuffle, Sun, Moon } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { notificationSounds } from '@/services/notificationSounds';
import { AvatarMenu } from '@/components/layout/AvatarMenu';
import { useTheme } from '@/contexts/ThemeContext';

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
  showMenuBadge = false,
  onOpenPrivateChat,
  onSimulate,
  activityText = '',
  activityTickerItems = [],
  onRandomConnect = null,
  isRandomConnectActive = false,
}) => {
  const [isMuted, setIsMuted] = useState(notificationSounds.getMuteState());
  const [tickerIndex, setTickerIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();

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
    <>
      <header className="bg-[var(--chat-header-surface)] backdrop-blur-xl border-b border-[var(--chat-divider)] h-14 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* ✅ FLECHA ELIMINADA - A petición del usuario */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden relative rounded-2xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex-shrink-0"
          aria-label={showMenuBadge ? 'Abrir menú con novedades' : 'Abrir menú'}
          title="Abrir menú"
        >
          <Menu className="w-6 h-6" />
          {showMenuBadge && (
            <span className="pointer-events-none absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-fuchsia-500 to-pink-500 px-1 text-[10px] font-semibold leading-none text-white shadow-[0_0_18px_rgba(236,72,153,0.45)]">
              1
            </span>
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold tracking-tight text-foreground text-[20px] leading-6 truncate">
            {roomNames[currentRoom] || 'Chat'}
          </h2>
          <div className="mt-0.5 h-4 pr-1">
            {hasTicker ? (
              <p
                key={`${currentRoom}-${tickerIndex}`}
                className="text-[12px] font-normal text-muted-foreground leading-tight truncate whitespace-nowrap overflow-hidden animate-in fade-in duration-300"
              >
                {tickerText}
              </p>
            ) : activityText ? (
              <p className="text-[12px] font-normal text-muted-foreground leading-tight truncate whitespace-nowrap overflow-hidden">
                {activityText}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Iconos elegantes junto a la campana */}
        <div className="hidden sm:flex items-center gap-1.5">
          {typeof onRandomConnect === 'function' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRandomConnect}
              className={`min-w-[32px] min-h-[32px] w-8 h-8 p-0 rounded-2xl ${
                isRandomConnectActive
                  ? 'bg-cyan-500/10 text-cyan-300 hover:text-cyan-200'
                  : 'text-muted-foreground hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/5'
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
            className="text-muted-foreground hover:text-purple-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl min-w-[32px] min-h-[32px] w-8 h-8 p-0"
            aria-label="Simular - Ocultar chat y mostrar protector de pantalla"
            title="Simular - Ocultar chat y mostrar protector de pantalla"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>

        <NotificationBell onOpenPrivateChat={onOpenPrivateChat} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="sm:hidden rounded-2xl text-muted-foreground hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/5 min-w-[40px] min-h-[40px]"
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <div className="hidden sm:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-2xl ${
              isMuted
                ? 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                : 'bg-cyan-500/10 text-cyan-400 hover:text-cyan-300'
            }`}
            aria-label={isMuted ? 'Activar sonidos' : 'Silenciar sonidos'}
            title={isMuted ? 'Activar sonidos de notificación' : 'Silenciar sonidos'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
        <div className="shrink-0">
          <AvatarMenu />
        </div>
      </div>
      </header>
    </>
  );
};

export default ChatHeader;
