import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, MapPin, MessageCircle, Search, Sparkles, Timer, Users, Video, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  CHAT_AVAILABILITY_DURATION_MS,
  getPresenceActivityMs,
  isUserAvailableForConversation,
  setAvailabilityForConversation,
  updatePresenceFields,
} from '@/services/presenceService';

const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;
const DEFAULT_CHAT_AVATAR = '/avatar_por_defecto.jpeg';
const AUTO_DISMISS_MS = 5000;
const PANEL_DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

const INTENT_OPTIONS = [
  {
    key: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    toneClassName: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/18',
  },
  {
    key: 'hot',
    label: 'Hot',
    icon: Flame,
    toneClassName: 'border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18',
  },
  {
    key: 'paja',
    label: 'Paja',
    icon: Video,
    toneClassName: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/18',
  },
  {
    key: 'juntarse',
    label: 'Juntarse',
    icon: MapPin,
    toneClassName: 'border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/18',
  },
  {
    key: 'mirando',
    label: 'Mirando',
    icon: Search,
    toneClassName: 'border-slate-400/30 bg-slate-500/10 text-slate-100 hover:bg-slate-500/18',
  },
];

const isBotOrSystemUser = (userId = '') => (
  userId === 'system'
  || userId.startsWith('bot_')
  || userId.startsWith('static_bot_')
);

const resolveAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return DEFAULT_CHAT_AVATAR;
  const normalized = avatar.trim().toLowerCase();
  if (!normalized || normalized === 'undefined' || normalized === 'null') return DEFAULT_CHAT_AVATAR;
  if (normalized.includes('api.dicebear.com')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('data:image/svg+xml') || normalized.startsWith('blob:')) return DEFAULT_CHAT_AVATAR;
  return avatar;
};

const getInitials = (value = '') => {
  const safe = String(value || '').trim();
  return safe ? safe.slice(0, 2).toUpperCase() : 'U';
};

const formatRemaining = (expiresAtMs, nowMs) => {
  if (!Number.isFinite(expiresAtMs)) return null;
  const diffMs = Math.max(0, expiresAtMs - nowMs);
  if (diffMs <= 0) return '0:00';
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const buildSuggestedMessage = ({ comuna, selectedIntentLabel }) => {
  const safeComuna = String(comuna || '').trim();
  const intentLabel = String(selectedIntentLabel || '').trim().toLowerCase();

  if (safeComuna && intentLabel === 'juntarse') {
    return `Hola, soy de ${safeComuna}. Si te sirve, podemos hablar por privado y ver si estamos cerca.`;
  }

  if (safeComuna && intentLabel) {
    return `Hola, soy de ${safeComuna}. Busco ${intentLabel}. Si te tinca, hablamos por privado.`;
  }

  if (safeComuna) {
    return `Hola, soy de ${safeComuna}. Si te interesa, hablamos por privado.`;
  }

  if (intentLabel) {
    return `Hola, busco ${intentLabel}. Si te interesa, hablamos por privado.`;
  }

  return 'Hola. Si te interesa, hablamos por privado.';
};

const ChatPrimaryResolutionPanel = ({
  roomId = 'principal',
  roomUsers = [],
  user = null,
  currentUserComuna = null,
  nearbySignals = null,
  opportunityItems = [],
  onBeforeOpenOpportunity,
  onOpenOpportunity,
  onRequestNickname,
  onRequestComuna,
  onPrefillMessage,
  isOpeningOpportunity = false,
}) => {
  const [clockNow, setClockNow] = useState(Date.now());
  const [savingIntentKey, setSavingIntentKey] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [optimisticIntentKey, setOptimisticIntentKey] = useState(null);
  const [optimisticAvailable, setOptimisticAvailable] = useState(null);
  const [optimisticAvailableExpiresAtMs, setOptimisticAvailableExpiresAtMs] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const interactionStartedRef = useRef(false);
  const dismissStorageKey = useMemo(() => {
    const currentUserId = user?.id || user?.uid || 'guest';
    return `chactivo:chat_primary_resolution:dismissed:${roomId}:${currentUserId}`;
  }, [roomId, user?.id, user?.uid]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsDismissed(false);
      interactionStartedRef.current = false;
      return;
    }

    const dismissedUntil = Number(window.localStorage.getItem(dismissStorageKey) || 0);
    const stillDismissed = dismissedUntil > Date.now();
    setIsDismissed(stillDismissed);
    interactionStartedRef.current = false;
  }, [dismissStorageKey]);

  const dismissPanel = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(dismissStorageKey, String(Date.now() + PANEL_DISMISS_TTL_MS));
    }
    setIsDismissed(true);
  };

  useEffect(() => {
    if (isDismissed) return undefined;
    if (interactionStartedRef.current) return undefined;

    const dismissTimer = window.setTimeout(() => {
      if (!interactionStartedRef.current) {
        dismissPanel();
      }
    }, AUTO_DISMISS_MS);

    return () => window.clearTimeout(dismissTimer);
  }, [isDismissed]);

  const currentUserId = user?.id || user?.uid || null;
  const safeOpportunityItems = Array.isArray(opportunityItems) ? opportunityItems : [];
  const primaryOpportunity = safeOpportunityItems[0] || null;

  const activeUsers = useMemo(() => {
    const nowMs = Date.now();
    return (Array.isArray(roomUsers) ? roomUsers : []).filter((item) => {
      const userId = item?.userId || item?.id || '';
      if (!userId || isBotOrSystemUser(userId)) return false;
      if (item?.isGuest && !item?.username) return false;
      const lastActivityMs = getPresenceActivityMs(item);
      return Number.isFinite(lastActivityMs) && (nowMs - lastActivityMs) <= ACTIVE_THRESHOLD_MS;
    });
  }, [roomUsers]);

  const currentPresence = useMemo(
    () => (
      activeUsers.find((item) => (item?.userId || item?.id) === currentUserId)
      || (Array.isArray(roomUsers) ? roomUsers : []).find((item) => (item?.userId || item?.id) === currentUserId)
      || null
    ),
    [activeUsers, currentUserId, roomUsers]
  );

  const selectedIntentKey = String(
    optimisticIntentKey !== null
      ? optimisticIntentKey
      : (currentPresence?.quickIntentKey || '')
  ).trim();
  const selectedIntent = useMemo(
    () => INTENT_OPTIONS.find((option) => option.key === selectedIntentKey) || null,
    [selectedIntentKey]
  );

  const isAvailableNow = optimisticAvailable !== null
    ? optimisticAvailable
    : Boolean(currentPresence && isUserAvailableForConversation(currentPresence, clockNow));
  const availabilityExpiresAtMs = optimisticAvailable === true
    ? optimisticAvailableExpiresAtMs
    : (currentPresence?.availableForChatExpiresAtMs || null);
  const availabilityRemaining = isAvailableNow
    ? formatRemaining(availabilityExpiresAtMs, clockNow)
    : null;
  const confirmedIntentKey = String(currentPresence?.quickIntentKey || '').trim();
  const confirmedAvailableNow = Boolean(currentPresence && isUserAvailableForConversation(currentPresence, clockNow));

  const intentCounts = useMemo(() => {
    const grouped = new Map(INTENT_OPTIONS.map((option) => [option.key, 0]));

    activeUsers.forEach((item) => {
      const itemUserId = item?.userId || item?.id;
      if (!itemUserId || itemUserId === currentUserId) return;
      const intentKey = String(item?.quickIntentKey || '').trim();
      if (!grouped.has(intentKey)) return;
      grouped.set(intentKey, (grouped.get(intentKey) || 0) + 1);
    });

    return grouped;
  }, [activeUsers, currentUserId]);

  const sameIntentCount = selectedIntentKey ? (intentCounts.get(selectedIntentKey) || 0) : 0;
  const sameComunaCount = nearbySignals?.sameComunaCount || 0;
  const sameComunaAvailableCount = nearbySignals?.sameComunaAvailableCount || 0;
  const availableNowCount = nearbySignals?.availableNowCount || 0;

  const headerTitle = primaryOpportunity
    ? 'Ve directo a una buena opcion'
    : 'Ordena la sala antes de escribir';

  const headerDescription = useMemo(() => {
    if (primaryOpportunity?.sameComuna && currentUserComuna) {
      return `Hay alguien por ${currentUserComuna} que calza mejor que un hola al aire.`;
    }
    if (primaryOpportunity) {
      return 'Ya hay una coincidencia mejor para ti. Abre privado o deja claro que buscas.';
    }
    if (!currentUserComuna) {
      return 'Si guardas tu comuna o dices que buscas, el sistema puede bajar mucho el ruido.';
    }
    if (sameComunaAvailableCount > 0) {
      return `Hay ${sameComunaAvailableCount} personas cerca y disponibles ahora.`;
    }
    if (sameComunaCount > 0) {
      return `Hay ${sameComunaCount} personas por ${currentUserComuna}. Marca una intencion y destaca mejor.`;
    }
    if (availableNowCount > 0) {
      return `Hay ${availableNowCount} personas disponibles ahora en la sala.`;
    }
    return 'Evita el mensaje generico: marca intencion, disponibilidad y escribe con contexto.';
  }, [
    availableNowCount,
    currentUserComuna,
    primaryOpportunity,
    sameComunaAvailableCount,
    sameComunaCount,
  ]);

  const handlePickIntent = async (option) => {
    interactionStartedRef.current = true;

    if (!user?.id) {
      onRequestNickname?.();
      dismissPanel();
      return;
    }

    if (!currentPresence) {
      toast({
        title: 'Conectando tu presencia',
        description: 'Espera un segundo y vuelve a intentarlo.',
      });
      return;
    }

    const nextKey = selectedIntentKey === option.key ? null : option.key;
    const nextLabel = nextKey ? option.label : null;

    setOptimisticIntentKey(nextKey);
    setSavingIntentKey(option.key);

    try {
      await updatePresenceFields(roomId, {
        quickIntentKey: nextKey,
        quickIntentLabel: nextLabel,
        quickIntentUpdatedAt: Date.now(),
      });
      dismissPanel();
    } catch (error) {
      setOptimisticIntentKey(null);
      console.error('[CHAT_PRIMARY_RESOLUTION] Error guardando intencion:', error);
      toast({
        title: 'No se pudo guardar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingIntentKey('');
    }
  };

  const handleToggleAvailability = async () => {
    interactionStartedRef.current = true;

    if (!user?.id) {
      onRequestNickname?.();
      dismissPanel();
      return;
    }

    const nextAvailable = !isAvailableNow;
    setSavingAvailability(true);
    setOptimisticAvailable(nextAvailable);
    setOptimisticAvailableExpiresAtMs(nextAvailable ? Date.now() + CHAT_AVAILABILITY_DURATION_MS : null);

    try {
      await setAvailabilityForConversation(roomId, nextAvailable);
      dismissPanel();
    } catch (error) {
      setOptimisticAvailable(null);
      setOptimisticAvailableExpiresAtMs(null);
      console.error('[CHAT_PRIMARY_RESOLUTION] Error guardando disponibilidad:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Intenta de nuevo en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingAvailability(false);
    }
  };

  const handlePrefillMessage = () => {
    interactionStartedRef.current = true;
    onPrefillMessage?.(
      buildSuggestedMessage({
        comuna: currentUserComuna,
        selectedIntentLabel: selectedIntent?.label,
      })
    );
    dismissPanel();
  };

  const handleRequestComuna = () => {
    interactionStartedRef.current = true;
    onRequestComuna?.();
    dismissPanel();
  };

  const handleOpenOpportunity = (item) => {
    interactionStartedRef.current = true;
    onOpenOpportunity?.(item);
    dismissPanel();
  };

  const handleDismissPanel = () => {
    interactionStartedRef.current = true;
    dismissPanel();
  };

  useEffect(() => {
    if (optimisticIntentKey !== null && optimisticIntentKey === confirmedIntentKey) {
      setOptimisticIntentKey(null);
    }
  }, [confirmedIntentKey, optimisticIntentKey]);

  useEffect(() => {
    if (optimisticAvailable !== null && optimisticAvailable === confirmedAvailableNow) {
      setOptimisticAvailable(null);
      if (!confirmedAvailableNow) {
        setOptimisticAvailableExpiresAtMs(null);
      }
    }
  }, [confirmedAvailableNow, optimisticAvailable]);

  useEffect(() => {
    if (
      optimisticAvailable === true
      && Number.isFinite(optimisticAvailableExpiresAtMs)
      && clockNow >= optimisticAvailableExpiresAtMs
    ) {
      setOptimisticAvailable(null);
      setOptimisticAvailableExpiresAtMs(null);
    }
  }, [clockNow, optimisticAvailable, optimisticAvailableExpiresAtMs]);

  if (roomId !== 'principal' || isDismissed) return null;

  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="overflow-hidden rounded-[24px] border border-cyan-500/18 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_38%),linear-gradient(180deg,rgba(7,15,24,0.98),rgba(9,17,28,0.95))] shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
        <div className="border-b border-white/8 px-4 py-4 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Resolucion rapida
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white md:text-lg">
                    {headerTitle}
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-5 text-slate-200/90">
                {headerDescription}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePrefillMessage}
              className="hidden shrink-0 rounded-xl border-white/12 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] md:inline-flex"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Mensaje util
            </Button>

            <button
              type="button"
              onClick={handleDismissPanel}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Cerrar sugerencia"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentUserComuna ? (
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-100">
                Tu comuna: {currentUserComuna}
              </span>
            ) : (
                <button
                  type="button"
                  onClick={handleRequestComuna}
                  className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-100 transition hover:bg-amber-500/16"
                >
                  Falta tu comuna
              </button>
            )}

            {sameComunaCount > 0 ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-200">
                {sameComunaCount} cerca de ti
              </span>
            ) : null}

            {availableNowCount > 0 ? (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-100">
                {availableNowCount} disponibles ahora
              </span>
            ) : null}

            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-slate-300">
              {Math.max(0, activeUsers.length)} activos en sala
            </span>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:px-5">
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Marca lo que buscas</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Si lo dejas claro, sales del ruido y apareces mejor para otros.
                  </p>
                </div>
                {sameIntentCount > 0 && selectedIntent ? (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-100">
                    {sameIntentCount} buscan {selectedIntent.label.toLowerCase()}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {INTENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedIntentKey === option.key;
                  const count = intentCounts.get(option.key) || 0;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={savingIntentKey === option.key}
                      onClick={() => handlePickIntent(option)}
                      className={[
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
                        isSelected
                          ? option.toneClassName
                          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                      {count > 0 ? (
                        <span className="rounded-full bg-black/25 px-1.5 py-0.5 text-[10px] text-white/80">
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                      <Timer className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Disponible para conversar</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Activalo cuando quieras que te puedan abrir privado directo.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={savingAvailability}
                  onClick={handleToggleAvailability}
                  className={isAvailableNow
                    ? 'rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'rounded-xl border border-white/10 bg-white/[0.05] text-slate-100 hover:bg-white/[0.1]'}
                >
                  {isAvailableNow ? 'Disponible ahora' : 'Activar ahora'}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {isAvailableNow ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-100">
                    Visible por {availabilityRemaining || '10:00'}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-300">
                    Dura {Math.round(CHAT_AVAILABILITY_DURATION_MS / 60000)} min
                  </span>
                )}

                {sameComunaAvailableCount > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-300">
                    {sameComunaAvailableCount} cerca y listos
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-400/14 bg-cyan-500/[0.05] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {primaryOpportunity ? 'Mejor candidato ahora' : 'Siguiente paso recomendado'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {primaryOpportunity
                    ? 'Una sola oportunidad buena vale mas que saludar al vacio.'
                    : 'Si nadie responde, el problema es falta de contexto, no solo falta de gente.'}
                </p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-200">
                <Users className="h-4 w-4" />
              </span>
            </div>

            {primaryOpportunity ? (
              <div className="mt-4 rounded-2xl border border-cyan-400/16 bg-slate-950/30 p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-cyan-300/30">
                    <AvatarImage src={resolveAvatar(primaryOpportunity?.avatar)} alt={primaryOpportunity?.username || 'Usuario'} />
                    <AvatarFallback>{getInitials(primaryOpportunity?.username || 'Usuario')}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {primaryOpportunity?.username || 'Usuario'}
                      </p>
                      {primaryOpportunity?.roleBadge ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-slate-200">
                          {primaryOpportunity.roleBadge}
                        </span>
                      ) : null}
                      {primaryOpportunity?.sameComuna ? (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100">
                          Cerca de ti
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-5 text-cyan-50/90">
                      {primaryOpportunity?.opportunityText || 'Disponible ahora'}
                    </p>

                    {primaryOpportunity?.matchHeadline ? (
                      <p className="mt-2 text-[11px] font-medium text-emerald-200/90">
                        Por qué te lo mostramos: {primaryOpportunity.matchHeadline}
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      {primaryOpportunity?.comuna ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-300">
                          {primaryOpportunity.comuna}
                        </span>
                      ) : null}
                      {primaryOpportunity?.activityText ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-slate-300">
                          {primaryOpportunity.activityText}
                        </span>
                      ) : null}
                      {primaryOpportunity?.opportunityMeta ? (
                        <span className="rounded-full border border-cyan-400/16 bg-cyan-500/10 px-2 py-1 text-cyan-100">
                          {primaryOpportunity.opportunityMeta}
                        </span>
                      ) : null}
                      {(Array.isArray(primaryOpportunity?.matchReasons) ? primaryOpportunity.matchReasons : []).slice(0, 3).map((reason) => (
                        <span
                          key={`reason:${reason}`}
                          className="rounded-full border border-emerald-400/14 bg-emerald-500/[0.08] px-2 py-1 text-emerald-100"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    disabled={isOpeningOpportunity}
                    onPointerDown={() => onBeforeOpenOpportunity?.(primaryOpportunity)}
                    onClick={() => handleOpenOpportunity(primaryOpportunity)}
                    className="rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Hablar en privado
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrefillMessage}
                    className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                  >
                    Usar mensaje util
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 rounded-2xl border border-white/8 bg-slate-950/30 p-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-sm font-medium text-white">Haz visible tu contexto</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Sin comuna ni intencion, tu mensaje se mezcla con todos los otros "hola".
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!currentUserComuna ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRequestComuna}
                      className="rounded-xl border-amber-400/20 bg-amber-500/10 text-amber-50 hover:bg-amber-500/16"
                    >
                      <MapPin className="mr-1.5 h-4 w-4" />
                      Guardar comuna
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrefillMessage}
                    className="rounded-xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Preparar mensaje util
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatPrimaryResolutionPanel;
