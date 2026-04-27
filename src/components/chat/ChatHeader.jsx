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
      <header
        className="flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--chat-divider)] bg-[var(--chat-header-surface)] px-3 py-2.5 backdrop-blur-[18px] sm:px-4"
        style={{ boxShadow: '0 1px 0 rgba(17,24,39,0.04)' }}
      >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
        {/* ✅ FLECHA ELIMINADA - A petición del usuario */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="relative min-h-[40px] min-w-[40px] flex-shrink-0 rounded-[14px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground sm:min-h-0 sm:min-w-0 lg:hidden"
          aria-label={showMenuBadge ? 'Abrir menú con novedades' : 'Abrir menú'}
          title="Abrir menú"
        >
          <Menu className="h-[18px] w-[18px]" />
          {showMenuBadge && (
            <span className="pointer-events-none absolute right-0.5 top-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-[var(--chat-header-surface)] bg-[#1473E6] shadow-[0_0_0_3px_rgba(20,115,230,0.12)]">
            </span>
          )}
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold leading-5 tracking-[-0.02em] text-foreground sm:text-[18px]">
            {roomNames[currentRoom] || 'Chat'}
          </h2>
          <div className="mt-0.5 h-4 pr-1">
            {hasTicker ? (
              <p
                key={`${currentRoom}-${tickerIndex}`}
                className="animate-in fade-in truncate overflow-hidden whitespace-nowrap text-[12px] font-medium leading-tight text-muted-foreground duration-300"
              >
                {tickerText}
              </p>
            ) : activityText ? (
              <p className="truncate overflow-hidden whitespace-nowrap text-[12px] font-medium leading-tight text-muted-foreground">
                {activityText}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden items-center gap-1 xl:flex">
          {typeof onRandomConnect === 'function' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRandomConnect}
              className={`h-[34px] min-h-[34px] w-[34px] min-w-[34px] rounded-[14px] p-0 ${
                isRandomConnectActive
                  ? 'border border-[#1473E6]/20 bg-[#1473E6]/8 text-[#1473E6] hover:text-[#0F67D8]'
                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
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
            className="h-[34px] min-h-[34px] w-[34px] min-w-[34px] rounded-[14px] p-0 text-muted-foreground/90 hover:bg-foreground/5 hover:text-foreground"
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
          className="min-h-[40px] min-w-[40px] rounded-[14px] text-muted-foreground hover:bg-foreground/5 hover:text-foreground sm:hidden"
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
            className={`min-h-[40px] min-w-[40px] rounded-[14px] sm:min-h-0 sm:min-w-0 ${
              isMuted
                ? 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                : 'border border-[#1473E6]/16 bg-[#1473E6]/8 text-[#1473E6] hover:text-[#0F67D8]'
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
