import React, { useEffect, useMemo, useState } from 'react';
import { Flame, MapPin, MessageCircle, Search, Sparkles, Users, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getPresenceActivityMs, updatePresenceFields } from '@/services/presenceService';
import { normalizeComuna } from '@/config/comunas';

const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;
const COLLAPSED_LAUNCHER_AUTO_HIDE_MS = 5000;
const DEFAULT_CHAT_AVATAR = '/avatar_por_defecto.jpeg';

const INTENT_OPTIONS = [
  {
    key: 'chat',
    label: 'Chat',
    hint: 'Hablar un rato',
    icon: MessageCircle,
    buttonClassName: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15',
    chipClassName: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
  },
  {
    key: 'hot',
    label: 'Hot',
    hint: 'Calentar el chat',
    icon: Flame,
    buttonClassName: 'border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15',
    chipClassName: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  },
  {
    key: 'paja',
    label: 'Paja',
    hint: 'Morboseo directo',
    icon: Video,
    buttonClassName: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/15',
    chipClassName: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30',
  },
  {
    key: 'juntarse',
    label: 'Juntarse',
    hint: 'Ver quién está cerca',
    icon: MapPin,
    buttonClassName: 'border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15',
    chipClassName: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  },
  {
    key: 'mirando',
    label: 'Mirando',
    hint: 'Solo viendo quién hay',
    icon: Search,
    buttonClassName: 'border-slate-400/30 bg-slate-500/10 text-slate-100 hover:bg-slate-500/15',
    chipClassName: 'bg-slate-500/15 text-slate-200 border-slate-400/30',
  },
];

const isBotOrSystemUser = (userId = '') => (
  userId === 'system' ||
  userId.startsWith('bot_') ||
  userId.startsWith('static_bot_')
);

const resolveChatAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return DEFAULT_CHAT_AVATAR;
  const normalized = avatar.trim().toLowerCase();
  if (!normalized || normalized === 'undefined' || normalized === 'null') return DEFAULT_CHAT_AVATAR;
  if (normalized.includes('api.dicebear.com')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('data:image/svg+xml') || normalized.startsWith('blob:')) return DEFAULT_CHAT_AVATAR;
  return avatar;
};

const getInitials = (username = '') => {
  const safe = String(username || '').trim();
  return safe ? safe.charAt(0).toUpperCase() : 'U';
};

const getRoleBucket = (roleLabel = '') => {
  const normalized = String(roleLabel || '').trim().toLowerCase();
  if (!normalized) return 'otro';
  if (normalized.includes('vers')) return 'versatil';
  if (normalized.includes('acti')) return 'activo';
  if (normalized.includes('pasi')) return 'pasivo';
  return 'otro';
};

const getCompatibleRoleBuckets = (roleBucket = 'otro') => {
  if (roleBucket === 'activo') return ['pasivo', 'versatil'];
  if (roleBucket === 'pasivo') return ['activo', 'versatil'];
  if (roleBucket === 'versatil') return ['activo', 'pasivo', 'versatil'];
  return [];
};

const QuickIntentPanel = ({
  roomId = 'principal',
  roomUsers = [],
  user = null,
  onRequestNickname,
  onStartConversation,
}) => {
  const [savingKey, setSavingKey] = useState(null);
  const [showExpandedPanel, setShowExpandedPanel] = useState(false);
  const [showCollapsedLauncher, setShowCollapsedLauncher] = useState(true);
  const [optimisticIntentKey, setOptimisticIntentKey] = useState(null);

  const activeUsers = useMemo(() => {
    const now = Date.now();
    return (Array.isArray(roomUsers) ? roomUsers : []).filter((item) => {
      const userId = item?.userId || item?.id || '';
      if (!userId || isBotOrSystemUser(userId)) return false;
      if (item?.isGuest && !item?.username) return false;
      const lastActivityMs = getPresenceActivityMs(item);
      return Number.isFinite(lastActivityMs) && (now - lastActivityMs) <= ACTIVE_THRESHOLD_MS;
    });
  }, [roomUsers]);

  const currentUserId = user?.id || null;
  const currentPresence = useMemo(
    () => (
      activeUsers.find((item) => (item.userId || item.id) === currentUserId)
      || (Array.isArray(roomUsers) ? roomUsers : []).find((item) => (item.userId || item.id) === currentUserId)
      || null
    ),
    [activeUsers, currentUserId, roomUsers]
  );

  const currentUserRoleBucket = useMemo(() => (
    getRoleBucket(
      currentPresence?.roleBadge
      || currentPresence?.profileRole
      || currentPresence?.role
      || user?.roleBadge
      || user?.profileRole
      || user?.role
    )
  ), [
    currentPresence?.profileRole,
    currentPresence?.role,
    currentPresence?.roleBadge,
    user?.profileRole,
    user?.role,
    user?.roleBadge,
  ]);

  const currentUserComuna = useMemo(() => (
    normalizeComuna(
      currentPresence?.comuna
      || user?.comuna
      || ''
    ) || null
  ), [currentPresence?.comuna, user?.comuna]);

  const summary = useMemo(() => {
    const grouped = new Map(INTENT_OPTIONS.map((option) => [option.key, []]));

    activeUsers.forEach((item) => {
      const intentKey = String(item?.quickIntentKey || '').trim();
      if (!grouped.has(intentKey)) return;
      grouped.get(intentKey).push({
        userId: item.userId || item.id,
        username: item.username || 'Usuario',
        avatar: resolveChatAvatar(item.avatar),
        roleBadge: item.roleBadge || item.profileRole || item.role || null,
        comuna: item.comuna || null,
        isPremium: Boolean(item.isPremium || item.isProUser),
        isGuest: Boolean(item.isGuest || item.isAnonymous),
        quickIntentKey: intentKey,
        quickIntentLabel: item?.quickIntentLabel || null,
      });
    });

    return INTENT_OPTIONS.map((option) => ({
      ...option,
      users: grouped.get(option.key) || [],
    }));
  }, [activeUsers]);

  const totalMarked = useMemo(
    () => summary.reduce((acc, option) => acc + option.users.length, 0),
    [summary]
  );

  const selectedIntentKey = String(
    optimisticIntentKey ?? currentPresence?.quickIntentKey ?? ''
  ).trim();
  const selectedIntent = useMemo(
    () => INTENT_OPTIONS.find((option) => option.key === selectedIntentKey) || null,
    [selectedIntentKey]
  );

  const smartRecommendation = useMemo(() => {
    const compatibleRoleBuckets = getCompatibleRoleBuckets(currentUserRoleBucket);
    const candidateUsers = activeUsers
      .filter((item) => {
        const itemUserId = item?.userId || item?.id || '';
        if (!itemUserId || itemUserId === currentUserId) return false;
        return true;
      })
      .map((item) => {
        const candidateRoleBucket = getRoleBucket(item?.roleBadge || item?.profileRole || item?.role);
        const candidateComuna = normalizeComuna(item?.comuna || '') || null;
        const sameComuna = Boolean(
          candidateComuna
          && currentUserComuna
          && candidateComuna === currentUserComuna
        );
        const roleCompatible = compatibleRoleBuckets.includes(candidateRoleBucket);
        const sameIntent = Boolean(
          selectedIntentKey
          && item?.quickIntentKey
          && String(item.quickIntentKey).trim() === selectedIntentKey
        );
        const score = (
          (sameComuna ? 45 : 0)
          + (roleCompatible ? 30 : 0)
          + (sameIntent ? 18 : 0)
          + (item?.isPremium || item?.isProUser ? 2 : 0)
        );

        return {
          userId: item?.userId || item?.id,
          username: item?.username || 'Usuario',
          avatar: resolveChatAvatar(item?.avatar),
          comuna: candidateComuna,
          roleBadge: item?.roleBadge || item?.profileRole || item?.role || null,
          sameComuna,
          roleCompatible,
          sameIntent,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const topCandidates = candidateUsers.filter((item) => item.score > 0).slice(0, 3);
    const sameComunaCount = candidateUsers.filter((item) => item.sameComuna).length;
    const compatibleCount = candidateUsers.filter((item) => item.roleCompatible).length;
    const sameIntentCount = candidateUsers.filter((item) => item.sameIntent).length;

    let recommendedIntentKey = selectedIntentKey || 'mirando';
    let title = 'Radar de coincidencia';
    let description = 'Marca lo que buscas para ordenar mejor la sala.';

    if (!currentUserComuna) {
      recommendedIntentKey = 'juntarse';
      title = 'Falta tu comuna';
      description = 'Si marcas comuna, el sistema puede priorizar gente cercana y bajar ruido.';
    } else if (!selectedIntentKey && sameComunaCount >= 2) {
      recommendedIntentKey = 'juntarse';
      title = `Hay gente cerca de ${currentUserComuna}`;
      description = `Vimos ${sameComunaCount} perfiles activos cerca. Marca juntarse para separarlos del ruido general.`;
    } else if (!selectedIntentKey && compatibleCount >= 2) {
      recommendedIntentKey = 'chat';
      title = 'Hay compatibilidad en sala';
      description = `Vimos ${compatibleCount} perfiles con rol compatible contigo. Marca una intención para filtrar mejor.`;
    } else if (selectedIntentKey && sameIntentCount >= 1) {
      const selectedIntentLabel = INTENT_OPTIONS.find((option) => option.key === selectedIntentKey)?.label || 'esa intención';
      title = `Ya hay respuesta para ${selectedIntentLabel.toLowerCase()}`;
      description = `${sameIntentCount} perfiles activos marcaron lo mismo. Mira primero los de mejor cruce.`;
    }

    return {
      title,
      description,
      recommendedIntentKey,
      topCandidates,
      sameComunaCount,
      compatibleCount,
      sameIntentCount,
      hasCurrentUserComuna: Boolean(currentUserComuna),
    };
  }, [activeUsers, currentUserComuna, currentUserId, currentUserRoleBucket, selectedIntentKey]);

  useEffect(() => {
    if (!selectedIntentKey) {
      setShowExpandedPanel(false);
    }
  }, [selectedIntentKey]);

  useEffect(() => {
    const remoteIntentKey = String(currentPresence?.quickIntentKey || '').trim() || null;
    if (!optimisticIntentKey) return;
    if (remoteIntentKey === optimisticIntentKey) {
      setOptimisticIntentKey(null);
    }
  }, [currentPresence?.quickIntentKey, optimisticIntentKey]);

  useEffect(() => {
    if (selectedIntentKey || showExpandedPanel) {
      setShowCollapsedLauncher(false);
      return undefined;
    }

    setShowCollapsedLauncher(true);
    const timer = window.setTimeout(() => {
      setShowCollapsedLauncher(false);
    }, COLLAPSED_LAUNCHER_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [selectedIntentKey, showExpandedPanel]);

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

    const nextKey = currentPresence.quickIntentKey === option.key ? null : option.key;
    const nextLabel = nextKey ? option.label : null;

    setOptimisticIntentKey(nextKey);
    setShowExpandedPanel(false);
    setShowCollapsedLauncher(false);
    setSavingKey(option.key);
    try {
      await updatePresenceFields(roomId, {
        quickIntentKey: nextKey,
        quickIntentLabel: nextLabel,
        quickIntentUpdatedAt: Date.now(),
      });
    } catch (error) {
      setOptimisticIntentKey(null);
      console.error('[QUICK_INTENT] Error actualizando estado:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (roomId !== 'principal') return null;

  if (!selectedIntent && !showExpandedPanel && showCollapsedLauncher) {
    return (
      <section className="px-3 pt-3 md:px-4 md:pt-4">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(27,32,58,0.96),rgba(53,36,74,0.92))] px-4 py-3 shadow-[0_18px_50px_rgba(8,10,26,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Radar express</p>
              <p className="mt-1 text-sm font-semibold text-white">Marca qué buscas sin tapar el chat</p>
              <p className="mt-1 text-[11px] text-slate-300">
                {totalMarked > 0
                  ? `${totalMarked} personas ya marcaron intención`
                  : 'Abre el radar para ver opciones rápidas'}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setShowCollapsedLauncher(false);
                setShowExpandedPanel(true);
              }}
              className="h-8 shrink-0 rounded-xl bg-white text-slate-950 hover:bg-slate-100 px-3 text-xs font-semibold"
            >
              Abrir
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!selectedIntent && !showExpandedPanel && !showCollapsedLauncher) return null;

  if (selectedIntent && !showExpandedPanel) return null;

  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(27,32,58,0.96),rgba(53,36,74,0.92))] shadow-[0_18px_50px_rgba(8,10,26,0.32)] overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Radar express</p>
              <h3 className="text-sm md:text-base font-semibold text-white">¿Qué buscas ahora?</h3>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
              <Users className="w-3.5 h-3.5 text-cyan-300" />
              {totalMarked} marcados
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-300/80">
            La sala pone las opciones. Cada uno marca su intención sin escribir.
          </p>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  IA-5 local
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{smartRecommendation.title}</p>
                <p className="mt-1 text-xs text-emerald-50/85">{smartRecommendation.description}</p>
              </div>

              {!selectedIntentKey && smartRecommendation.recommendedIntentKey ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const recommended = INTENT_OPTIONS.find((option) => option.key === smartRecommendation.recommendedIntentKey);
                    if (recommended) handlePickIntent(recommended);
                  }}
                  className="h-8 shrink-0 rounded-xl bg-white text-slate-950 hover:bg-slate-100 px-3 text-xs font-semibold"
                >
                  Marcar sugerida
                </Button>
              ) : null}
            </div>

            {smartRecommendation.topCandidates.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {smartRecommendation.topCandidates.map((person) => (
                  <button
                    key={`smart_${person.userId}`}
                    type="button"
                    onClick={() => onStartConversation?.(person)}
                    disabled={!onStartConversation}
                    className={`inline-flex items-center gap-2 rounded-full border pr-2 pl-1 py-1 transition-colors ${
                      onStartConversation
                        ? 'border-emerald-300/30 bg-emerald-500/10 hover:bg-emerald-500/16 hover:border-emerald-300/50'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Avatar className="w-6 h-6 border border-white/10">
                      <AvatarImage src={person.avatar} alt={person.username} />
                      <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[110px] truncate text-[11px] text-white">
                      {person.username}
                    </span>
                    {person.comuna ? (
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-emerald-100">
                        {person.comuna}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-emerald-50/75">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {smartRecommendation.sameComunaCount} cerca
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {smartRecommendation.compatibleCount} compatibles
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {smartRecommendation.sameIntentCount} en tu misma intención
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {INTENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedIntentKey === option.key;
              const isSaving = savingKey === option.key;
              const count = summary.find((item) => item.key === option.key)?.users.length || 0;

              return (
                <Button
                  key={option.key}
                  type="button"
                  variant="outline"
                  onClick={() => handlePickIntent(option)}
                  disabled={isSaving}
                  className={`h-auto min-h-[74px] flex-col items-start rounded-2xl px-3 py-3 text-left transition-all ${option.buttonClassName} ${isSelected ? 'ring-2 ring-white/30 scale-[1.01]' : ''}`}
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="w-3.5 h-3.5" />
                      {option.label}
                    </span>
                    <span className="text-xs font-bold">{count}</span>
                  </div>
                  <span className="mt-1 text-[11px] text-current/80 whitespace-normal leading-4">
                    {isSelected ? 'Marcado por ti' : option.hint}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid max-h-[240px] gap-2 overflow-y-auto overscroll-contain border-t border-white/10 bg-black/10 px-4 py-3 pr-2 md:max-h-none md:grid-cols-2 md:pr-4 xl:grid-cols-3">
          {summary.map((option) => (
            <div
              key={option.key}
              className="rounded-2xl border border-white/8 bg-black/10 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${option.chipClassName}`}>
                  <option.icon className="w-3.5 h-3.5" />
                  {option.label}
                </span>
                <span className="text-[11px] text-slate-300">{option.users.length} en esto</span>
              </div>

              {option.users.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {option.users.slice(0, 6).map((person) => (
                    <button
                      key={`${option.key}_${person.userId}`}
                      type="button"
                      onClick={() => {
                        if (person.userId === currentUserId) return;
                        onStartConversation?.(person);
                      }}
                      disabled={person.userId === currentUserId || !onStartConversation}
                      className={`inline-flex items-center gap-2 rounded-full border pr-2 pl-1 py-1 transition-colors ${
                        person.userId === currentUserId || !onStartConversation
                          ? 'cursor-default border-white/10 bg-white/5'
                          : 'border-cyan-400/20 bg-cyan-500/10 hover:border-cyan-300/40 hover:bg-cyan-500/16'
                      }`}
                    >
                      <Avatar className="w-6 h-6 border border-white/10">
                        <AvatarImage src={person.avatar} alt={person.username} />
                        <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[90px] truncate text-[11px] text-white">
                        {person.userId === currentUserId ? 'Tú' : person.username}
                      </span>
                    </button>
                  ))}
                  {option.users.length > 6 && (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
                      +{option.users.length - 6} más
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-400">Todavía nadie se marcó aquí.</p>
              )}

              {option.users.some((person) => person.userId !== currentUserId) && onStartConversation ? (
                <p className="mt-3 text-[11px] text-cyan-200/80">
                  Toca un perfil para abrir conversación privada.
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickIntentPanel;
