import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  canRequestPush,
  getPushInterestPreferences,
  isPushEnabled,
  requestNotificationPermission,
  savePushInterestPreferences,
} from '@/services/pushNotificationService';

const INTEREST_OPTIONS = [
  { key: 'more_people_connected', label: 'Más personas conectadas' },
  { key: 'more_room_activity', label: 'Más actividad en sala' },
  { key: 'direct_messages', label: 'Cuando me escriban' },
  { key: 'profile_views', label: 'Cuando vean mi perfil' },
  { key: 'opin_comments', label: 'Cuando comenten mi OPIN' },
  { key: 'baul_card_views', label: 'Cuando vean mi tarjeta Baúl' },
];

const NotificationInterestsMenu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState(() => getPushInterestPreferences(user?.id || null));
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [pushGranted, setPushGranted] = useState(() => isPushEnabled());

  const isRegisteredUser = Boolean(user?.id && !user?.isGuest && !user?.isAnonymous);
  const userId = user?.id || null;

  useEffect(() => {
    const merged = {
      ...getPushInterestPreferences(userId),
      ...(user?.pushInterestPreferences || {}),
    };
    setPreferences(merged);
    setPushGranted(isPushEnabled());
  }, [userId, user?.pushInterestPreferences]);

  const requireRegisteredUser = () => {
    if (isRegisteredUser) return true;
    toast({
      title: 'Regístrate para personalizar avisos',
      description: 'Los avisos por intereses se guardan en tu cuenta.',
      duration: 4500,
      action: {
        label: 'Crear cuenta',
        onClick: () => navigate('/auth'),
      },
    });
    return false;
  };

  const ensurePushPermission = async () => {
    if (isPushEnabled()) {
      setPushGranted(true);
      return true;
    }
    if (!canRequestPush()) {
      toast({
        title: 'Activa notificaciones en tu navegador',
        description: 'El permiso está bloqueado. Debes habilitarlo en configuración del sitio.',
        variant: 'destructive',
      });
      return false;
    }

    setIsRequestingPush(true);
    try {
      const token = await requestNotificationPermission();
      const granted = Boolean(token) || isPushEnabled();
      setPushGranted(granted);
      if (!granted) {
        toast({
          title: 'Notificaciones no activadas',
          description: 'Acepta el permiso para recibir avisos en teléfono y desktop.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Notificaciones activadas',
          description: 'Ahora puedes elegir exactamente qué avisos quieres recibir.',
        });
      }
      return granted;
    } finally {
      setIsRequestingPush(false);
    }
  };

  const updatePreference = async (key, checked) => {
    if (!requireRegisteredUser()) return;
    const nextEnabled = checked === true;

    if (nextEnabled) {
      const canUsePush = await ensurePushPermission();
      if (!canUsePush) return;
    }

    const next = { ...preferences, [key]: nextEnabled };
    setPreferences(next);
    await savePushInterestPreferences(next, userId);
  };

  const updateAll = async (enabled) => {
    if (!requireRegisteredUser()) return;
    if (enabled) {
      const canUsePush = await ensurePushPermission();
      if (!canUsePush) return;
    }
    const next = INTEREST_OPTIONS.reduce((acc, item) => {
      acc[item.key] = enabled;
      return acc;
    }, {});
    setPreferences(next);
    await savePushInterestPreferences(next, userId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-2xl text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          aria-label="Configurar avisos por intereses"
          title="Avisos por intereses"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-2xl border border-border/90 bg-popover/98 text-popover-foreground shadow-[0_18px_48px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <DropdownMenuLabel>Avisarme cuando...</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={isRequestingPush}
          onSelect={async (event) => {
            event.preventDefault();
            if (!requireRegisteredUser()) return;
            await ensurePushPermission();
          }}
        >
          {pushGranted ? 'Push activo en este dispositivo' : 'Activar notificaciones push'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {INTEREST_OPTIONS.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.key}
            checked={preferences[option.key] !== false}
            onCheckedChange={(checked) => {
              updatePreference(option.key, checked).catch(() => {});
            }}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            updateAll(true).catch(() => {});
          }}
        >
          Activar todo
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            updateAll(false).catch(() => {});
          }}
        >
          Silenciar todo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationInterestsMenu;
