import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  CHAT_AVAILABILITY_DURATION_MS,
  isUserAvailableForConversation,
  setAvailabilityForConversation,
} from '@/services/presenceService';

const normalizeUsernameKey = (value = '') => String(value || '').trim().toLowerCase();

const dedupeAvailabilityUsers = (users = [], currentUserId = null, currentUsername = '') => {
  const currentUsernameKey = normalizeUsernameKey(currentUsername);
  const byId = new Map();

  (Array.isArray(users) ? users : []).forEach((item) => {
    const userId = item?.userId || item?.id;
    if (!userId) return;
    if (
      currentUserId
      && userId !== currentUserId
      && currentUsernameKey
      && normalizeUsernameKey(item?.username) === currentUsernameKey
    ) {
      return;
    }
    byId.set(userId, item);
  });

  return Array.from(byId.values());
};

const formatRemaining = (expiresAtMs, nowMs) => {
  if (!Number.isFinite(expiresAtMs)) return null;
  const diffMs = Math.max(0, expiresAtMs - nowMs);
  if (diffMs <= 0) return 'expirada';
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const ConversationAvailabilityCard = ({
  roomId = 'principal',
  user = null,
  roomUsers = [],
  onRequestNickname,
  variant = 'hero',
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [hideWhileAvailable, setHideWhileAvailable] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableUsers = useMemo(
    () => dedupeAvailabilityUsers(
      (Array.isArray(roomUsers) ? roomUsers : []).filter((item) => isUserAvailableForConversation(item, clockNow)),
      user?.id || null,
      user?.username || ''
    ),
    [roomUsers, clockNow, user?.id, user?.username]
  );

  const currentPresence = useMemo(
    () => availableUsers.find((item) => (item.userId || item.id) === user?.id)
      || (Array.isArray(roomUsers) ? roomUsers : []).find((item) => (item.userId || item.id) === user?.id)
      || null,
    [availableUsers, roomUsers, user?.id]
  );

  const currentUserAvailable = Boolean(currentPresence && isUserAvailableForConversation(currentPresence, clockNow));
  const expiresAtMs = currentPresence?.availableForChatExpiresAtMs || null;
  const remaining = currentUserAvailable ? formatRemaining(expiresAtMs, clockNow) : null;

  useEffect(() => {
    if (!currentUserAvailable) {
      setHideWhileAvailable(false);
    }
  }, [currentUserAvailable]);

  const handleToggle = async () => {
    if (!user?.id) {
      onRequestNickname?.();
      return;
    }

    setIsSaving(true);
    try {
      if (currentUserAvailable) {
        await setAvailabilityForConversation(roomId, false);
        setHideWhileAvailable(false);
        toast({
          title: 'Disponibilidad desactivada',
          description: 'Ya no apareces en disponibles ahora.',
        });
      } else {
        await setAvailabilityForConversation(roomId, true);
        setHideWhileAvailable(true);
        toast({
          title: 'Ya apareces como disponible',
          description: `Estarás visible durante ${Math.round(CHAT_AVAILABILITY_DURATION_MS / 60000)} minutos si sigues en sala.`,
        });
      }
    } catch (error) {
      console.error('[AVAILABILITY_SIGNAL] Error actualizando disponibilidad:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (roomId !== 'principal') return null;
  if (variant !== 'compact' && currentUserAvailable && hideWhileAvailable) return null;

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Tu disponibilidad
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-200">
              {currentUserAvailable && remaining ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                  <Timer className="w-3 h-3" />
                  {remaining}
                </span>
              ) : (
                <span className="text-slate-300/80">Actívala para aparecer aquí sin molestar en pantalla.</span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                <Users className="w-3 h-3 text-emerald-300" />
                {availableUsers.filter((item) => (item.userId || item.id) !== user?.id).length}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleToggle}
            disabled={isSaving}
            className={`h-9 rounded-xl px-3 text-xs font-semibold ${
              currentUserAvailable
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            {currentUserAvailable ? 'Disponible' : 'Activar'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="px-3 pt-3 md:px-4 md:pt-4">
      <div className="rounded-2xl border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_42%),linear-gradient(135deg,rgba(17,24,39,0.96),rgba(28,37,54,0.94))] shadow-[0_18px_50px_rgba(5,10,20,0.3)] overflow-hidden">
        <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/75">Disponibilidad conversacional</p>
            <h3 className="mt-1 text-sm md:text-base font-semibold text-white">
              Señala que estás presente y listo para hablar.
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Users className="w-3.5 h-3.5 text-emerald-300" />
                {availableUsers.length} disponibles ahora
              </span>
              {currentUserAvailable && remaining ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-100">
                  <Timer className="w-3.5 h-3.5" />
                  Expira en {remaining}
                </span>
              ) : (
                <span className="text-slate-300/80">
                  Si nadie responde, apareces arriba del sidebar para que te encuentren.
                </span>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleToggle}
            disabled={isSaving}
            className={`min-h-[48px] rounded-2xl px-4 text-sm font-semibold ${
              currentUserAvailable
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-white text-slate-950 hover:bg-slate-100'
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {currentUserAvailable ? 'Disponible ahora' : '🙋 Estoy disponible para conversar'}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ConversationAvailabilityCard;
