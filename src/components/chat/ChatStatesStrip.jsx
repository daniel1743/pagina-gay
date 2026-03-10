import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X, Trash2, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  fetchRoomStates,
  publishRoomState,
  deleteRoomState,
  formatStateCooldown,
} from '@/services/chatStatesService';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const ROTATION_INTERVAL_MS = 10 * 60 * 1000;
const DEFAULT_AVATAR = '/avatar_por_defecto.jpeg';
const MAX_STATE_LENGTH = 160;

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

const ChatStatesStrip = ({ roomId = 'principal', user }) => {
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [selectedState, setSelectedState] = useState(null);
  const [rotationSlot, setRotationSlot] = useState(Math.floor(Date.now() / ROTATION_INTERVAL_MS));

  const isEnabled = roomId === 'principal';
  const currentUserId = user?.id || null;
  const isGuestUser = Boolean(user?.isGuest || user?.isAnonymous);
  const statesHint = isGuestUser ? 'Solo lectura' : '24h';
  const ownState = useMemo(() => states.find((item) => item.userId === currentUserId) || null, [states, currentUserId]);

  const loadStates = useCallback(async () => {
    if (!isEnabled) return;
    try {
      setIsLoading(true);
      const items = await fetchRoomStates(roomId, 80);
      setStates(items);
    } catch (error) {
      console.error('[STATES] Error loading states:', error);
    } finally {
      setIsLoading(false);
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

  const orderedStates = useMemo(() => {
    if (!states.length) return [];
    return [...states].sort((a, b) => {
      const hashA = hashString(`${a.userId}:${rotationSlot}`);
      const hashB = hashString(`${b.userId}:${rotationSlot}`);
      return hashA - hashB;
    });
  }, [states, rotationSlot]);

  if (!isEnabled) return null;

  const handleOpenComposer = () => {
    if (isGuestUser) {
      toast({
        title: 'Solo lectura para invitados',
        description: 'Regístrate para publicar estados.',
        variant: 'destructive',
      });
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

  return (
    <div className="px-3 pt-2 pb-2 border-b border-border/60 bg-card/40">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estados</p>
        <p className="text-[11px] text-muted-foreground">
          {statesHint}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          type="button"
          onClick={handleOpenComposer}
          className="group min-w-[68px] max-w-[72px] shrink-0 text-center"
          aria-label={ownState ? 'Ver mi estado' : 'Publicar estado'}
        >
          <div className={`mx-auto mb-1 h-14 w-14 rounded-full border-2 ${
            ownState ? 'border-cyan-400/80' : 'border-dashed border-cyan-400/50'
          } bg-secondary/70 flex items-center justify-center transition-colors group-hover:border-cyan-300`}>
            {ownState ? (
              <Avatar className="h-12 w-12">
                <AvatarImage src={ownState.avatar || DEFAULT_AVATAR} alt={ownState.username} />
                <AvatarFallback>{getInitial(ownState.username)}</AvatarFallback>
              </Avatar>
            ) : (
              <Plus className="w-5 h-5 text-cyan-300" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{ownState ? 'Tu estado' : 'Agregar'}</p>
        </button>

        {isLoading && (
          <div className="text-xs text-muted-foreground px-1 py-6">Cargando estados...</div>
        )}

        {!isLoading && orderedStates.map((item) => (
          <button
            key={item.userId}
            type="button"
            onClick={() => setSelectedState(item)}
            className="group min-w-[68px] max-w-[72px] shrink-0 text-center"
            aria-label={`Ver estado de ${item.username}`}
          >
            <div className="mx-auto mb-1 h-14 w-14 rounded-full border-2 border-cyan-400/65 p-0.5 transition-colors group-hover:border-cyan-300">
              <Avatar className="h-full w-full">
                <AvatarImage src={item.avatar || DEFAULT_AVATAR} alt={item.username} />
                <AvatarFallback>{getInitial(item.username)}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">{item.username}</p>
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
                    <AvatarImage src={selectedState.avatar || DEFAULT_AVATAR} alt={selectedState.username} />
                    <AvatarFallback>{getInitial(selectedState.username)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{selectedState.username}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                  {selectedState.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>{formatAge(selectedState.createdAtMs)}</span>
                </div>

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
    </div>
  );
};

export default ChatStatesStrip;
