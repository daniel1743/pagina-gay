import React, { useMemo, useState } from 'react';
import { Flame, MapPin, MessageCircle, Search, Users, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { updatePresenceFields } from '@/services/presenceService';

const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;
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

const toTimestampMs = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const getPresenceLastActivityMs = (item = {}) => (
  toTimestampMs(item.lastSeen) ??
  toTimestampMs(item.lastActiveAt) ??
  toTimestampMs(item.updatedAt) ??
  toTimestampMs(item.joinedAt)
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

const QuickIntentPanel = ({
  roomId = 'principal',
  roomUsers = [],
  user = null,
  onRequestNickname,
}) => {
  const [savingKey, setSavingKey] = useState(null);

  const activeUsers = useMemo(() => {
    const now = Date.now();
    return (Array.isArray(roomUsers) ? roomUsers : []).filter((item) => {
      const userId = item?.userId || item?.id || '';
      if (!userId || isBotOrSystemUser(userId)) return false;
      if (item?.isGuest && !item?.username) return false;
      const lastActivityMs = getPresenceLastActivityMs(item);
      return Number.isFinite(lastActivityMs) && (now - lastActivityMs) <= ACTIVE_THRESHOLD_MS;
    });
  }, [roomUsers]);

  const currentUserId = user?.id || null;
  const currentPresence = useMemo(
    () => activeUsers.find((item) => (item.userId || item.id) === currentUserId) || null,
    [activeUsers, currentUserId]
  );

  const summary = useMemo(() => {
    const grouped = new Map(INTENT_OPTIONS.map((option) => [option.key, []]));

    activeUsers.forEach((item) => {
      const intentKey = String(item?.quickIntentKey || '').trim();
      if (!grouped.has(intentKey)) return;
      grouped.get(intentKey).push({
        userId: item.userId || item.id,
        username: item.username || 'Usuario',
        avatar: resolveChatAvatar(item.avatar),
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

    setSavingKey(option.key);
    try {
      await updatePresenceFields(roomId, {
        quickIntentKey: nextKey,
        quickIntentLabel: nextLabel,
        quickIntentUpdatedAt: Date.now(),
      });
    } catch (error) {
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {INTENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = currentPresence?.quickIntentKey === option.key;
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

        <div className="grid gap-2 border-t border-white/10 bg-black/10 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
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
                    <div
                      key={`${option.key}_${person.userId}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pr-2 pl-1 py-1"
                    >
                      <Avatar className="w-6 h-6 border border-white/10">
                        <AvatarImage src={person.avatar} alt={person.username} />
                        <AvatarFallback>{getInitials(person.username)}</AvatarFallback>
                      </Avatar>
                      <span className="max-w-[90px] truncate text-[11px] text-white">
                        {person.userId === currentUserId ? 'Tú' : person.username}
                      </span>
                    </div>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickIntentPanel;
