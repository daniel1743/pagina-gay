import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, Clock3, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  fetchRoomStates,
  fetchStateReactions,
  publishRoomState,
  setStateReaction,
  clearStateReaction,
  deleteRoomState,
  formatStateCooldown,
} from '@/services/chatStatesService';
import { addToFavorites } from '@/services/socialService';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const ROTATION_INTERVAL_MS = 10 * 60 * 1000;
const STATES_CACHE_TTL_MS = 2 * 60 * 1000;
const DEFAULT_AVATAR = '/avatar_por_defecto.jpeg';
const MAX_STATE_LENGTH = 160;
const REACTION_OPTIONS = [
  { key: 'fire', emoji: '🔥', label: 'Arde' },
  { key: 'spark', emoji: '✨', label: 'Brilla' },
  { key: 'eyes', emoji: '👀', label: 'Mirada' },
  { key: 'heart', emoji: '💜', label: 'Me gusta' },
  { key: 'crown', emoji: '👑', label: 'Premium' },
];

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getInitial = (username = '') => {
  const safe = String(username || '').trim();
  return safe ? safe.charAt(0).toUpperCase() : 'U';
};

const formatAge = (createdAtMs) => {
  if (!createdAtMs) return 'Reciente';
  const diffMs = Math.max(0, Date.now() - createdAtMs);
  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  return `Hace ${diffHours} h`;
};

const getStatesCacheKey = (roomId) => `chat_states_cache:${roomId}`;

const readStatesCache = (roomId) => {
  if (typeof window === 'undefined' || !roomId) return [];
  try {
    const raw = sessionStorage.getItem(getStatesCacheKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.states)) return [];
    if ((Date.now() - parsed.savedAt) > STATES_CACHE_TTL_MS) return [];
    return parsed.states;
  } catch {
    return [];
  }
};

const writeStatesCache = (roomId, states) => {
  if (typeof window === 'undefined' || !roomId || !Array.isArray(states)) return;
  try {
    sessionStorage.setItem(
      getStatesCacheKey(roomId),
      JSON.stringify({
        savedAt: Date.now(),
        states: states.map((item) => ({
          ...item,
          createdAtISO: item?.createdAtISO || null,
        })),
      })
    );
  } catch {
    // Ignore quota/cache errors
  }
};

const areStatesEquivalent = (prev = [], next = []) => {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    const a = prev[i];
    const b = next[i];
    if (!a || !b) return false;
    if (a.userId !== b.userId) return false;
    if ((a.updatedAtMs || 0) !== (b.updatedAtMs || 0)) return false;
    if (a.message !== b.message) return false;
    if (a.avatar !== b.avatar) return false;
  }
  return true;
};

const ChatStatesStrip = ({ roomId = 'principal', user }) => {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [stateReactions, setStateReactions] = useState([]);
  const [isLoadingReactions, setIsLoadingReactions] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionBurst, setReactionBurst] = useState([]);
  const [rotationSlot, setRotationSlot] = useState(Math.floor(Date.now() / ROTATION_INTERVAL_MS));
  const hasHydratedStatesRef = useRef(false);

  const isEnabled = roomId === 'principal';
  const currentUserId = user?.id || null;
  const isGuestUser = Boolean(user?.isGuest || user?.isAnonymous);
  const statesHint = isGuestUser ? 'Solo lectura' : '24h';
  const ownState = useMemo(() => states.find((item) => item.userId === currentUserId) || null, [states, currentUserId]);
  const isRegisteredUser = Boolean(currentUserId && !isGuestUser);

  const reactionSummary = useMemo(() => {
    const counts = {};
    let myReaction = null;

    REACTION_OPTIONS.forEach((option) => {
      counts[option.key] = 0;
    });

    stateReactions.forEach((item) => {
      if (!item?.reaction || !Object.prototype.hasOwnProperty.call(counts, item.reaction)) return;
      counts[item.reaction] += 1;
      if (item.userId === currentUserId) {
        myReaction = item.reaction;
      }
    });

    return { counts, myReaction };
  }, [stateReactions, currentUserId]);

  const loadStates = useCallback(async () => {
    if (!isEnabled) return;
    try {
      if (!hasHydratedStatesRef.current) {
        setIsLoading(true);
      }
      const items = await fetchRoomStates(roomId, 80);
      setStates((prev) => (areStatesEquivalent(prev, items) ? prev : items));
      writeStatesCache(roomId, items);
      hasHydratedStatesRef.current = true;
    } catch (error) {
      console.error('[STATES] Error loading states:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, roomId]);

  useEffect(() => {
    if (!isEnabled) return;
    const cached = readStatesCache(roomId);
    if (cached.length > 0) {
      setStates(cached);
      setIsLoading(false);
      hasHydratedStatesRef.current = true;
    }
  }, [isEnabled, roomId]);

  useEffect(() => {
    if (!isEnabled) return undefined;
    loadStates();

    const refreshTimer = setInterval(() => {
      loadStates();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(refreshTimer);
  }, [isEnabled, loadStates]);

  useEffect(() => {
    if (!isEnabled) return undefined;
    const rotationTimer = setInterval(() => {
      setRotationSlot(Math.floor(Date.now() / ROTATION_INTERVAL_MS));
    }, 60 * 1000);
    return () => clearInterval(rotationTimer);
  }, [isEnabled]);

  useEffect(() => {
    if (!selectedState?.userId) {
      setStateReactions([]);
      setIsLoadingReactions(false);
      return;
    }

    let isMounted = true;
    const loadReactions = async () => {
      try {
        setIsLoadingReactions(true);
        const reactions = await fetchStateReactions(roomId, selectedState.userId);
        if (!isMounted) return;
        setStateReactions(reactions);
      } catch (error) {
        if (!isMounted) return;
        setStateReactions([]);
      } finally {
        if (isMounted) setIsLoadingReactions(false);
      }
    };

    loadReactions();
    return () => {
      isMounted = false;
    };
  }, [roomId, selectedState?.userId]);

  const orderedStates = useMemo(() => {
    if (!states.length) return [];
    return [...states].sort((a, b) => {
      const hashA = hashString(`${a.userId}:${rotationSlot}`);
      const hashB = hashString(`${b.userId}:${rotationSlot}`);
      return hashA - hashB;
    });
  }, [states, rotationSlot]);

  const triggerReactionBurst = useCallback((emoji) => {
    const particles = Array.from({ length: 8 }, (_, index) => ({
      id: `${Date.now()}_${index}`,
      emoji,
      x: (Math.random() - 0.5) * 160,
      y: -50 - Math.random() * 80,
      delay: Math.random() * 0.1,
      rotate: (Math.random() - 0.5) * 40,
    }));
    setReactionBurst(particles);
    setTimeout(() => setReactionBurst([]), 950);
  }, []);

  const showRegisteredOnlyToast = useCallback((title, description) => {
    toast({
      title,
      description,
      duration: 4500,
      action: {
        label: 'Registrarme',
        onClick: () => navigate('/auth'),
      },
    });
  }, [navigate]);

  if (!isEnabled) return null;

  const handleOpenComposer = () => {
    if (isGuestUser) {
      showRegisteredOnlyToast('Solo lectura para invitados', 'Regístrate para publicar estados.');
      return;
    }

    if (ownState) {
      setSelectedState(ownState);
      return;
    }
    setComposeText('');
    setIsComposeOpen(true);
  };

  const handlePublishState = async () => {
    const text = String(composeText || '').trim();
    if (!text) return;
    if (!currentUserId) {
      toast({
        title: 'Necesitas iniciar sesión',
        description: 'No pudimos identificar tu cuenta para publicar estado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await publishRoomState(roomId, {
        username: user?.username || 'Usuario',
        avatar: user?.avatar || DEFAULT_AVATAR,
        roleBadge: user?.roleBadge || user?.profileRole || user?.role || null,
        isGuest: user?.isGuest || false,
        isAnonymous: user?.isAnonymous || false,
        message: text,
      });

      setIsComposeOpen(false);
      setComposeText('');
      await loadStates();

      toast({
        title: 'Estado publicado',
        description: 'Tu estado estará visible por 24 horas.',
      });
    } catch (error) {
      console.error('[STATES] publish error:', {
        message: error?.message,
        code: error?.code,
      });
      if (error?.message === 'state/cooldown') {
        toast({
          title: 'Ya publicaste un estado',
          description: `Podrás publicar otro en ${formatStateCooldown(error.remainingMs)}.`,
          variant: 'destructive',
        });
      } else if (error?.message === 'state/auth-required') {
        toast({
          title: 'Sesión no lista',
          description: 'Espera 2 segundos e inténtalo de nuevo.',
          variant: 'destructive',
        });
      } else if (error?.message === 'state/registered-only') {
        toast({
          title: 'Regístrate para publicar',
          description: 'Como invitado puedes ver estados, pero no publicar.',
          variant: 'destructive',
        });
      } else if (error?.message === 'state/photo-required') {
        toast({
          title: 'Foto de perfil obligatoria',
          description: 'Desde el 4to estado debes subir una foto de perfil real para publicar.',
          variant: 'destructive',
        });
      } else if (error?.code === 'permission-denied') {
        toast({
          title: 'Permisos no desplegados',
          description: 'Faltan reglas de Firestore para estados. Ejecuta deploy de reglas.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No se pudo publicar',
          description: `Error: ${error?.code || error?.message || 'desconocido'}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOwnState = async () => {
    if (!ownState) return;
    try {
      await deleteRoomState(roomId, ownState.userId);
      setSelectedState(null);
      await loadStates();
      toast({
        title: 'Estado eliminado',
        description: 'Ahora puedes publicar un nuevo estado.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo eliminar',
        description: 'Inténtalo nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleReaction = async (reactionKey) => {
    if (!selectedState?.userId) return;
    if (!isRegisteredUser) {
      showRegisteredOnlyToast(
        'Reacciones para usuarios registrados',
        'Puedes ver los estados, pero para reaccionar debes registrarte.'
      );
      return;
    }

    try {
      setIsReacting(true);
      if (reactionSummary.myReaction === reactionKey) {
        await clearStateReaction(roomId, selectedState.userId);
        setStateReactions((prev) => prev.filter((item) => item.userId !== currentUserId));
        return;
      }

      await setStateReaction(roomId, selectedState.userId, {
        reaction: reactionKey,
        username: user?.username || 'Usuario',
        avatar: user?.avatar || DEFAULT_AVATAR,
        isGuest: user?.isGuest || false,
        isAnonymous: user?.isAnonymous || false,
      });

      setStateReactions((prev) => {
        const withoutMine = prev.filter((item) => item.userId !== currentUserId);
        return [
          {
            id: currentUserId,
            userId: currentUserId,
            username: user?.username || 'Usuario',
            avatar: user?.avatar || DEFAULT_AVATAR,
            reaction: reactionKey,
            updatedAtMs: Date.now(),
          },
          ...withoutMine,
        ];
      });

      const option = REACTION_OPTIONS.find((item) => item.key === reactionKey);
      if (option?.emoji) {
        triggerReactionBurst(option.emoji);
      }
    } catch (error) {
      if (error?.message === 'state/registered-only' || error?.message === 'state/auth-required') {
        showRegisteredOnlyToast(
          'Reacciones para usuarios registrados',
          'Inicia sesión para reaccionar estados.'
        );
      } else {
        toast({
          title: 'No se pudo reaccionar',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsReacting(false);
    }
  };

  const handleOpenProfile = () => {
    if (!selectedState?.userId) return;
    if (!isRegisteredUser) {
      showRegisteredOnlyToast(
        'Ver perfil es para usuarios registrados',
        'Regístrate para abrir perfiles y conversar con más confianza.'
      );
      return;
    }
    navigate(`/profile/${selectedState.userId}`);
    setSelectedState(null);
  };

  const handleAddFavorite = async () => {
    if (!selectedState?.userId || !currentUserId) return;

    if (!isRegisteredUser) {
      showRegisteredOnlyToast(
        'Favoritos para usuarios registrados',
        'Regístrate para guardar personas en favoritos.'
      );
      return;
    }

    if (selectedState.userId === currentUserId) {
      toast({
        title: 'No disponible',
        description: 'No puedes agregarte a favoritos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToFavorites(currentUserId, selectedState.userId);
      toast({
        title: 'Agregado a favoritos',
        description: `${selectedState.username} ahora está en tus favoritos.`,
      });
    } catch (error) {
      if (error?.message === 'FAVORITES_LIMIT_REACHED') {
        toast({
          title: 'Límite alcanzado',
          description: 'Puedes tener hasta 15 favoritos.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'No se pudo agregar',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="px-2.5 pt-1.5 pb-1.5 border-b border-border/60 bg-card/35">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Estados</p>
        <p className="text-[10px] text-muted-foreground">
          {statesHint}
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <button
          type="button"
          onClick={handleOpenComposer}
          className="group min-w-[56px] max-w-[60px] shrink-0 text-center"
          aria-label={ownState ? 'Ver mi estado' : 'Publicar estado'}
        >
          <div className={`mx-auto mb-1 h-11 w-11 rounded-full border-2 ${
            ownState ? 'border-cyan-400/80' : 'border-dashed border-cyan-400/50'
          } bg-secondary/70 flex items-center justify-center transition-colors group-hover:border-cyan-300`}>
            {ownState ? (
                <Avatar className="h-9 w-9">
                <AvatarImage src={ownState.avatar || DEFAULT_AVATAR} alt={ownState.username} loading="lazy" decoding="async" fetchPriority="low" />
                <AvatarFallback>{getInitial(ownState.username)}</AvatarFallback>
              </Avatar>
            ) : (
              <Plus className="w-4 h-4 text-cyan-300" />
            )}
          </div>
          <p className="text-[10px] leading-tight text-muted-foreground truncate">{ownState ? 'Tu estado' : 'Agregar'}</p>
        </button>

        {isLoading && (
          <div className="text-xs text-muted-foreground px-1 py-6">Cargando estados...</div>
        )}

        {!isLoading && orderedStates.map((item) => (
          <button
            key={item.userId}
            type="button"
            onClick={() => setSelectedState(item)}
            className="group min-w-[56px] max-w-[60px] shrink-0 text-center"
            aria-label={`Ver estado de ${item.username}`}
          >
            <div className="mx-auto mb-1 h-11 w-11 rounded-full border-2 border-cyan-400/65 p-0.5 transition-colors group-hover:border-cyan-300">
              <Avatar className="h-full w-full">
                <AvatarImage src={item.avatar || DEFAULT_AVATAR} alt={item.username} loading="lazy" decoding="async" fetchPriority="low" />
                <AvatarFallback>{getInitial(item.username)}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-[10px] leading-tight text-muted-foreground truncate">{item.username}</p>
          </button>
        ))}
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={composeText}
              onChange={(event) => setComposeText(event.target.value.slice(0, MAX_STATE_LENGTH))}
              placeholder="Escribe algo corto para quienes están en línea..."
              className="w-full min-h-[110px] rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Se elimina solo a las 24h.</span>
              <span>{composeText.length}/{MAX_STATE_LENGTH}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tip: puedes publicar 3 estados sin foto real; desde el 4to se pedirá foto de perfil.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>Cancelar</Button>
              <Button onClick={handlePublishState} disabled={isSubmitting || !composeText.trim()}>
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedState)} onOpenChange={(open) => { if (!open) setSelectedState(null); }}>
        <DialogContent className="sm:max-w-md">
          {selectedState && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedState.avatar || DEFAULT_AVATAR} alt={selectedState.username} loading="lazy" decoding="async" fetchPriority="low" />
                    <AvatarFallback>{getInitial(selectedState.username)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedState.username}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-[#10162f] via-[#151b3a] to-[#111629] p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                    {selectedState.message}
                  </p>
                  {reactionBurst.length > 0 && (
                    <div className="pointer-events-none absolute inset-0">
                      {reactionBurst.map((particle) => (
                        <span
                          key={particle.id}
                          className="absolute left-1/2 top-[72%] text-lg"
                          style={{
                            '--state-burst-x': `${particle.x}px`,
                            '--state-burst-y': `${particle.y}px`,
                            '--state-burst-delay': `${particle.delay}s`,
                            '--state-burst-rotate': `${particle.rotate}deg`,
                            animation: 'stateBurst 900ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
                            animationDelay: particle.delay,
                          }}
                        >
                          {particle.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>{formatAge(selectedState.createdAtMs)}</span>
                </div>

                <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2.5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                    Reacciones premium
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REACTION_OPTIONS.map((option) => {
                      const isActive = reactionSummary.myReaction === option.key;
                      const count = reactionSummary.counts[option.key] || 0;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleToggleReaction(option.key)}
                          disabled={isReacting}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                            isActive
                              ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.28)]'
                              : 'border-border/70 bg-card/70 text-muted-foreground hover:border-cyan-500/40 hover:text-foreground'
                          }`}
                          title={option.label}
                        >
                          <span className="text-sm leading-none">{option.emoji}</span>
                          <span className="font-medium">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  {isGuestUser && (
                    <p className="mt-2 text-[11px] text-cyan-200/80">
                      Puedes ver reacciones, pero para reaccionar debes registrarte.
                    </p>
                  )}
                  {isLoadingReactions && (
                    <p className="mt-2 text-[11px] text-muted-foreground">Cargando reacciones...</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-1.5" onClick={handleOpenProfile}>
                    <User className="w-3.5 h-3.5" />
                    Ver perfil
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={handleAddFavorite}>
                    <Heart className="w-3.5 h-3.5" />
                    Favorito
                  </Button>
                </div>
                {isGuestUser && (
                  <p className="text-[11px] text-muted-foreground">
                    Invitado: puedes ver estos botones, pero para usarlos debes registrarte.
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  {selectedState.userId === currentUserId && (
                    <Button variant="destructive" onClick={handleDeleteOwnState} className="gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedState(null)} className="gap-1.5">
                    <X className="w-3.5 h-3.5" />
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes stateBurst {
          0% {
            opacity: 0;
            transform: translate(-50%, 0) scale(0.75) rotate(0deg);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform:
              translate(calc(-50% + var(--state-burst-x)), var(--state-burst-y))
              scale(1.15)
              rotate(var(--state-burst-rotate));
          }
        }
      `}</style>
    </div>
  );
};

export default ChatStatesStrip;
