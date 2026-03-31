import React, { useEffect, useMemo, useState } from 'react';
import { Flame, MapPin, MessageCircle, Search, Timer, Users, Video } from 'lucide-react';
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

const INTENT_OPTIONS = [
  {
    key: 'chat',
    label: 'Chat',
    hint: 'Hablar un rato',
    microcopy: 'Al marcar Chat, les dices a los demás que estás abierto a conversar sin presión.',
    icon: MessageCircle,
    chipClassName: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
    buttonClassName: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15',
  },
  {
    key: 'hot',
    label: 'Hot',
    hint: 'Calentar el chat',
    microcopy: 'Al marcar Hot, les muestras a los demás que buscas una conversación más intensa.',
    icon: Flame,
    chipClassName: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
    buttonClassName: 'border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15',
  },
  {
    key: 'paja',
    label: 'Paja',
    hint: 'Morboseo directo',
    microcopy: 'Al marcar Paja, dejas claro que buscas morbo directo sin vueltas.',
    icon: Video,
    chipClassName: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30',
    buttonClassName: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/15',
  },
  {
    key: 'juntarse',
    label: 'Juntarse',
    hint: 'Ver quién está cerca',
    microcopy: 'Al marcar Juntarse, indicas que te interesa ver opciones para concretar fuera del chat.',
    icon: MapPin,
    chipClassName: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
    buttonClassName: 'border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15',
  },
  {
    key: 'mirando',
    label: 'Mirando',
    hint: 'Solo viendo quién hay',
    microcopy: 'Al marcar Mirando, avisas que estás explorando sin comprometerte todavía.',
    icon: Search,
    chipClassName: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
    buttonClassName: 'border-slate-400/30 bg-slate-500/10 text-slate-100 hover:bg-slate-500/15',
  },
];

const isBotOrSystemUser = (userId = '') => (
  userId === 'system' ||
  userId.startsWith('bot_') ||
  userId.startsWith('static_bot_')
);

const formatRemaining = (expiresAtMs, nowMs) => {
  if (!Number.isFinite(expiresAtMs)) return null;
  const diffMs = Math.max(0, expiresAtMs - nowMs);
  if (diffMs <= 0) return 'expirada';
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const PresenceSidebarStatusPanel = ({
  roomId = 'principal',
  roomUsers = [],
  user = null,
  onRequestNickname,
  variant = 'desktop',
}) => {
  const [clockNow, setClockNow] = useState(Date.now());
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [savingIntentKey, setSavingIntentKey] = useState(null);
  const [expandedAvailability, setExpandedAvailability] = useState(false);
  const [expandedRadar, setExpandedRadar] = useState(false);
  const [optimisticAvailable, setOptimisticAvailable] = useState(null);
  const [optimisticAvailableExpiresAtMs, setOptimisticAvailableExpiresAtMs] = useState(null);
  const [optimisticIntentKey, setOptimisticIntentKey] = useState(null);
  const [showAvailabilityMicrocopy, setShowAvailabilityMicrocopy] = useState(false);
  const [hoveredIntentKey, setHoveredIntentKey] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentUserId = user?.id || null;

  const effectiveRoomUsers = useMemo(() => {
    const safeUsers = Array.isArray(roomUsers) ? roomUsers : [];
    const nowMs = Date.now();
    const patchedUsers = safeUsers.map((item) => {
      const itemUserId = item?.userId || item?.id || null;
      if (!currentUserId || itemUserId !== currentUserId) return item;

      const nextItem = { ...item };

      if (optimisticAvailable !== null) {
        nextItem.availableForChat = optimisticAvailable;
        nextItem.availableForChatExpiresAtMs = optimisticAvailable
          ? optimisticAvailableExpiresAtMs
          : null;
        nextItem.availableForChatMode = optimisticAvailable ? 'conversation' : null;
        nextItem.lastSeenMs = nowMs;
        nextItem.connectionStatus = 'connected';
      }

      if (optimisticIntentKey !== null) {
        const selectedIntent = INTENT_OPTIONS.find((option) => option.key === optimisticIntentKey) || null;
        nextItem.quickIntentKey = optimisticIntentKey;
        nextItem.quickIntentLabel = selectedIntent?.label || null;
        nextItem.lastSeenMs = nowMs;
        nextItem.connectionStatus = 'connected';
      }

      return nextItem;
    });

    const hasCurrentUser = currentUserId
      ? patchedUsers.some((item) => (item?.userId || item?.id) === currentUserId)
      : false;

    if (!hasCurrentUser && currentUserId && (optimisticAvailable !== null || optimisticIntentKey !== null)) {
      const selectedIntent = INTENT_OPTIONS.find((option) => option.key === optimisticIntentKey) || null;
      patchedUsers.push({
        id: currentUserId,
        userId: currentUserId,
        username: user?.username || 'Tú',
        avatar: user?.avatar || '',
        isPremium: Boolean(user?.isPremium || user?.isProUser),
        isGuest: Boolean(user?.isGuest),
        isAnonymous: Boolean(user?.isAnonymous),
        availableForChat: optimisticAvailable === true,
        availableForChatExpiresAtMs: optimisticAvailable === true ? optimisticAvailableExpiresAtMs : null,
        availableForChatMode: optimisticAvailable === true ? 'conversation' : null,
        quickIntentKey: optimisticIntentKey || null,
        quickIntentLabel: selectedIntent?.label || null,
        lastSeenMs: nowMs,
        joinedAtMs: nowMs,
        connectionStatus: 'connected',
      });
    }

    return patchedUsers;
  }, [
    currentUserId,
    optimisticAvailable,
    optimisticAvailableExpiresAtMs,
    optimisticIntentKey,
    roomUsers,
    user?.avatar,
    user?.id,
    user?.isAnonymous,
    user?.isGuest,
    user?.isPremium,
    user?.isProUser,
    user?.username,
  ]);

  const activeUsers = useMemo(() => {
    const now = Date.now();
    return effectiveRoomUsers.filter((item) => {
      const userId = item?.userId || item?.id || '';
      if (!userId || isBotOrSystemUser(userId)) return false;
      if (item?.isGuest && !item?.username) return false;
      const lastActivityMs = getPresenceActivityMs(item);
      return Number.isFinite(lastActivityMs) && (now - lastActivityMs) <= ACTIVE_THRESHOLD_MS;
    });
  }, [effectiveRoomUsers]);

  const rawActiveUsers = useMemo(() => {
    const safeUsers = Array.isArray(roomUsers) ? roomUsers : [];
    const now = Date.now();
    return safeUsers.filter((item) => {
      const userId = item?.userId || item?.id || '';
      if (!userId || isBotOrSystemUser(userId)) return false;
      if (item?.isGuest && !item?.username) return false;
      const lastActivityMs = getPresenceActivityMs(item);
      return Number.isFinite(lastActivityMs) && (now - lastActivityMs) <= ACTIVE_THRESHOLD_MS;
    });
  }, [roomUsers]);

  const currentPresence = useMemo(
    () => (
      activeUsers.find((item) => (item.userId || item.id) === currentUserId)
      || effectiveRoomUsers.find((item) => (item.userId || item.id) === currentUserId)
      || null
    ),
    [activeUsers, currentUserId, effectiveRoomUsers]
  );

  const rawCurrentPresence = useMemo(
    () => (
      rawActiveUsers.find((item) => (item.userId || item.id) === currentUserId)
      || (Array.isArray(roomUsers) ? roomUsers : []).find((item) => (item?.userId || item?.id) === currentUserId)
      || null
    ),
    [currentUserId, rawActiveUsers, roomUsers]
  );

  const currentUserAvailable = Boolean(currentPresence && isUserAvailableForConversation(currentPresence, clockNow));
  const availabilityExpiresAtMs = currentPresence?.availableForChatExpiresAtMs || null;
  const currentIntentKey = String(currentPresence?.quickIntentKey || '').trim();
  const confirmedUserAvailable = Boolean(rawCurrentPresence && isUserAvailableForConversation(rawCurrentPresence, clockNow));
  const confirmedIntentKey = String(rawCurrentPresence?.quickIntentKey || '').trim();
  const resolvedUserAvailable = optimisticAvailable !== null ? optimisticAvailable : currentUserAvailable;
  const resolvedAvailabilityExpiresAtMs = optimisticAvailable === true
    ? optimisticAvailableExpiresAtMs
    : availabilityExpiresAtMs;
  const availabilityRemaining = resolvedUserAvailable
    ? formatRemaining(resolvedAvailabilityExpiresAtMs, clockNow)
    : null;
  const resolvedIntentKey = optimisticIntentKey !== null ? optimisticIntentKey : currentIntentKey;

  useEffect(() => {
    if (optimisticAvailable !== null && optimisticAvailable === confirmedUserAvailable) {
      setOptimisticAvailable(null);
      setOptimisticAvailableExpiresAtMs(null);
    }
  }, [confirmedUserAvailable, optimisticAvailable]);

  useEffect(() => {
    if (optimisticIntentKey !== null && optimisticIntentKey === confirmedIntentKey) {
      setOptimisticIntentKey(null);
    }
    if (!resolvedIntentKey) {
      setExpandedRadar(false);
    }
  }, [confirmedIntentKey, optimisticIntentKey, resolvedIntentKey]);

  useEffect(() => {
    if (!resolvedUserAvailable) {
      setExpandedAvailability(false);
    }
  }, [resolvedUserAvailable]);

  const summary = useMemo(() => {
    const grouped = new Map(INTENT_OPTIONS.map((option) => [option.key, 0]));

    activeUsers.forEach((item) => {
      const intentKey = String(item?.quickIntentKey || '').trim();
      if (!grouped.has(intentKey)) return;
      grouped.set(intentKey, (grouped.get(intentKey) || 0) + 1);
    });

    return INTENT_OPTIONS.map((option) => ({
      ...option,
      count: grouped.get(option.key) || 0,
    }));
  }, [activeUsers]);

  const totalMarked = useMemo(
    () => summary.reduce((acc, option) => acc + option.count, 0),
    [summary]
  );

  const selectedIntent = useMemo(
    () => INTENT_OPTIONS.find((option) => option.key === resolvedIntentKey) || null,
    [resolvedIntentKey]
  );

  const selectedIntentUsersCount = useMemo(
    () => summary.find((option) => option.key === resolvedIntentKey)?.count || 0,
    [resolvedIntentKey, summary]
  );

  const availabilityMicrocopy = resolvedUserAvailable
    ? 'Al desactivar, dejas de aparecer como disponible para iniciar conversación.'
    : 'Al activar, apareces visible para que otros te escriban sin interrumpir el chat principal.';

  const hoveredIntent = useMemo(
    () => INTENT_OPTIONS.find((option) => option.key === hoveredIntentKey) || null,
    [hoveredIntentKey]
  );

  const handleToggleAvailability = async () => {
    if (!user?.id) {
      onRequestNickname?.();
      return;
    }

    const nextAvailable = !resolvedUserAvailable;
    setIsSavingAvailability(true);
    setOptimisticAvailable(nextAvailable);
    setOptimisticAvailableExpiresAtMs(nextAvailable ? Date.now() + CHAT_AVAILABILITY_DURATION_MS : null);
    setExpandedAvailability(false);

    try {
      await setAvailabilityForConversation(roomId, nextAvailable);
    } catch (error) {
      setOptimisticAvailable(null);
      setOptimisticAvailableExpiresAtMs(null);
      console.error('[AVAILABILITY_SIDEBAR] Error actualizando disponibilidad:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handlePickIntent = async (option) => {
    if (!user?.id) {
      onRequestNickname?.();
      return;
    }

    if (!currentPresence) {
      toast({
        title: 'Conectando tu presencia',
        description: 'Espera un segundo y vuelve a marcar lo que buscas.',
      });
      return;
    }

    const nextKey = resolvedIntentKey === option.key ? '' : option.key;
    setSavingIntentKey(option.key);
    setOptimisticIntentKey(nextKey);
    setExpandedRadar(false);

    try {
      await updatePresenceFields(roomId, {
        quickIntentKey: nextKey || null,
        quickIntentLabel: nextKey ? option.label : null,
        quickIntentUpdatedAt: Date.now(),
      });
    } catch (error) {
      setOptimisticIntentKey(null);
      console.error('[RADAR_SIDEBAR] Error actualizando radar:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingIntentKey(null);
    }
  };

  if (roomId !== 'principal') return null;

  const isMobile = variant === 'mobile';

  return (
    <div className={isMobile ? 'space-y-2.5' : 'space-y-3'}>
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        {resolvedUserAvailable && !expandedAvailability ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Tu disponibilidad activa
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-200">
                {availabilityRemaining ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                    <Timer className="w-3 h-3" />
                    {availabilityRemaining}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <Users className="w-3 h-3 text-emerald-300" />
                  {activeUsers.filter((item) => isUserAvailableForConversation(item, clockNow) && (item.userId || item.id) !== currentUserId).length}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleToggleAvailability}
              disabled={isSavingAvailability}
              className="h-8 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-70"
            >
              {isSavingAvailability ? 'Guardando...' : 'Desactivar'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
                Tu disponibilidad
              </p>
              <p className="mt-1 text-[11px] text-slate-300/80">
                {resolvedUserAvailable
                  ? 'Sigues visible para iniciar conversación.'
                  : 'Actívala para aparecer sin molestar en pantalla.'}
              </p>
              <div className={`mt-1 overflow-hidden transition-all duration-200 ${showAvailabilityMicrocopy ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-[10px] leading-4 text-emerald-200/85">
                  {availabilityMicrocopy}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleToggleAvailability}
              onMouseEnter={() => setShowAvailabilityMicrocopy(true)}
              onMouseLeave={() => setShowAvailabilityMicrocopy(false)}
              onFocus={() => setShowAvailabilityMicrocopy(true)}
              onBlur={() => setShowAvailabilityMicrocopy(false)}
              disabled={isSavingAvailability}
              className={`h-8 rounded-xl px-3 text-xs font-semibold ${
                resolvedUserAvailable
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white text-slate-950 hover:bg-slate-100'
              }`}
            >
              {isSavingAvailability
                ? (optimisticAvailable ? 'Activando...' : 'Guardando...')
                : resolvedUserAvailable
                  ? 'Activado'
                  : 'Activar'}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(27,32,58,0.96),rgba(53,36,74,0.92))] p-3">
        {selectedIntent && !expandedRadar ? (
          (() => {
            const SelectedIntentIcon = selectedIntent.icon;
            return (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                Radar express activo
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${selectedIntent.chipClassName}`}>
                  <SelectedIntentIcon className="w-3.5 h-3.5" />
                  {selectedIntent.label}
                </span>
                <span className="text-[11px] text-slate-300">
                  {selectedIntentUsersCount} en esto
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setExpandedRadar(true)}
              className="h-8 rounded-xl bg-white px-3 text-xs font-semibold text-slate-950 hover:bg-slate-100"
            >
              Cambiar
            </Button>
          </div>
            );
          })()
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
                  Radar express
                </p>
                <p className="mt-1 text-[11px] text-slate-300/80">
                  Elige una intención y se guarda al instante.
                </p>
                <div className={`mt-1 overflow-hidden transition-all duration-200 ${hoveredIntent ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-[10px] leading-4 text-cyan-100/80">
                    {hoveredIntent?.microcopy || ''}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-200">
                <Users className="w-3 h-3 text-cyan-300" />
                {totalMarked}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {summary.map((option) => {
                const Icon = option.icon;
                const isSelected = resolvedIntentKey === option.key;
                const isSaving = savingIntentKey === option.key;

                return (
                  <Button
                    key={option.key}
                    type="button"
                    variant="outline"
                    onClick={() => handlePickIntent(option)}
                    onMouseEnter={() => setHoveredIntentKey(option.key)}
                    onMouseLeave={() => setHoveredIntentKey('')}
                    onFocus={() => setHoveredIntentKey(option.key)}
                    onBlur={() => setHoveredIntentKey('')}
                    disabled={isSaving}
                    className={`h-auto min-h-[62px] flex-col items-start rounded-2xl px-3 py-2.5 text-left transition-all ${option.buttonClassName} ${isSelected ? 'ring-2 ring-white/30 scale-[1.01]' : ''}`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <Icon className="w-3.5 h-3.5" />
                        {option.label}
                      </span>
                      <span className="text-[11px] font-bold">{option.count}</span>
                    </div>
                    <span className="mt-1 text-[10px] leading-4 text-current/80 whitespace-normal">
                      {isSelected ? 'Marcado por ti' : option.hint}
                    </span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PresenceSidebarStatusPanel;
