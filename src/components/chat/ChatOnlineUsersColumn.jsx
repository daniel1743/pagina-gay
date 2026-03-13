import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Circle, MessageCircle } from 'lucide-react';
import ConversationAvailabilityCard from '@/components/chat/ConversationAvailabilityCard';
import { resolveProfileRole } from '@/config/profileRoles';
import { getPresenceActivityMs, isUserAvailableForConversation } from '@/services/presenceService';

const DEFAULT_CHAT_AVATAR = '/avatar_por_defecto.jpeg';
const MIN_VISIBLE_USERS = 10;
const MAX_HISTORY_USERS = 120;
const COMPACT_VISIBLE_LIMIT = 18;
const ONLINE_USERS_CACHE_PREFIX = 'chactivo:online_users_cache:v3:';

const resolveChatAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return DEFAULT_CHAT_AVATAR;
  const normalized = avatar.trim().toLowerCase();
  if (!normalized) return DEFAULT_CHAT_AVATAR;
  if (normalized === 'undefined' || normalized === 'null') return DEFAULT_CHAT_AVATAR;
  if (normalized.includes('api.dicebear.com')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('data:image/svg+xml')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('blob:')) return DEFAULT_CHAT_AVATAR;
  return avatar;
};

const isBotOrSystem = (userId = '') => (
  userId === 'system' ||
  userId.startsWith('bot_') ||
  userId.startsWith('static_bot_')
);

const normalizeUsernameKey = (value = '') => String(value || '').trim().toLowerCase();

const isCurrentUserDuplicateByUsername = (item, currentUserId, currentUsername) => {
  if (!item?.username || !currentUserId || !currentUsername) return false;
  if (item.userId === currentUserId) return false;
  return normalizeUsernameKey(item.username) === normalizeUsernameKey(currentUsername);
};

const roleBadgeTone = (role) => {
  if (role === 'Activo' || role === 'Versátil Act') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35';
  if (role === 'Pasivo' || role === 'Versátil Pasivo') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35';
  if (role === 'Versátil') return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/35';
  return 'bg-muted/40 text-muted-foreground border-border/70';
};

const getRoleBucket = (roleLabel) => {
  const normalized = String(roleLabel || '').toLowerCase();
  if (normalized.includes('activo')) return 'activo';
  if (normalized.includes('pasivo')) return 'pasivo';
  if (normalized.includes('versátil') || normalized.includes('versatil') || normalized.includes('inter')) return 'versatil';
  if (normalized.includes('curioso')) return 'curioso';
  return 'otro';
};

const getRoleCompatibilityScore = (selfRole, candidateRole) => {
  const selfBucket = getRoleBucket(selfRole);
  const candidateBucket = getRoleBucket(candidateRole);

  if (selfBucket === 'curioso' || !selfRole) return 80;
  if (selfBucket === 'activo') {
    if (candidateBucket === 'pasivo') return 100;
    if (candidateBucket === 'versatil') return 92;
    if (candidateBucket === 'curioso') return 75;
    return 48;
  }
  if (selfBucket === 'pasivo') {
    if (candidateBucket === 'activo') return 100;
    if (candidateBucket === 'versatil') return 90;
    if (candidateBucket === 'curioso') return 75;
    return 48;
  }
  if (selfBucket === 'versatil') {
    if (candidateBucket === 'activo' || candidateBucket === 'pasivo') return 96;
    if (candidateBucket === 'versatil') return 84;
    if (candidateBucket === 'curioso') return 76;
    return 44;
  }
  return 50;
};

const sortUsers = (users, currentUserId) => (
  [...users].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    if (a.isOnline) return (b.lastConnectedAt || 0) - (a.lastConnectedAt || 0);
    return (b.lastDisconnectedAt || 0) - (a.lastDisconnectedAt || 0);
  })
);

const normalizeSeedUser = (item, nowMs) => {
  const userId = item?.userId || item?.id || '';
  if (!userId || isBotOrSystem(userId)) return null;

  const normalizedRole = resolveProfileRole(
    item?.roleBadge,
    item?.profileRole,
    item?.role
  );

  const ts = Number(item?.lastConnectedAt || item?.timestampMs || nowMs) || nowMs;

  return {
    userId,
    username: item?.username || 'Usuario',
    avatar: resolveChatAvatar(item?.avatar),
    roleBadge: normalizedRole || null,
    isPremium: Boolean(item?.isPremium || item?.isProUser),
    isGuest: Boolean(item?.isGuest || item?.isAnonymous),
    inPrivateWith: item?.inPrivateWith || null,
    isOnline: Boolean(item?.isOnline),
    lastConnectedAt: ts,
    lastDisconnectedAt: item?.isOnline ? null : Number(item?.lastDisconnectedAt || ts),
  };
};

const ChatOnlineUsersColumn = ({
  roomUsers = [],
  fallbackUsers = [],
  roomId = 'principal',
  currentUserId = null,
  currentUser = null,
  onUserClick,
  onStartConversation,
  onRequestNickname,
}) => {
  const [knownUsers, setKnownUsers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const cacheKey = useMemo(() => `${ONLINE_USERS_CACHE_PREFIX}${roomId}`, [roomId]);

  // Restaurar historial local (barato, sin lecturas extra)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const now = Date.now();
      const restored = parsed
        .map((item) => normalizeSeedUser(item, now))
        .filter(Boolean)
        .map((item) => ({ ...item, isOnline: false, inPrivateWith: null }))
        .slice(0, MAX_HISTORY_USERS);
      if (restored.length > 0) {
        setKnownUsers(restored);
      }
    } catch {
      // noop
    }
  }, [cacheKey]);

  // Persistir historial local
  useEffect(() => {
    try {
      if (!Array.isArray(knownUsers) || knownUsers.length === 0) return;
      const compact = knownUsers.slice(0, MAX_HISTORY_USERS).map((item) => ({
        userId: item.userId,
        username: item.username,
        avatar: item.avatar,
        roleBadge: item.roleBadge,
        isPremium: item.isPremium,
        isGuest: item.isGuest,
        lastConnectedAt: item.lastConnectedAt || Date.now(),
        lastDisconnectedAt: item.lastDisconnectedAt || null,
      }));
      localStorage.setItem(cacheKey, JSON.stringify(compact));
    } catch {
      // noop
    }
  }, [knownUsers, cacheKey]);

  const liveUsers = useMemo(() => {
    const safeUsers = Array.isArray(roomUsers) ? roomUsers : [];
    const deduped = new Map();

    safeUsers.forEach((presenceUser) => {
      const normalized = normalizeSeedUser({ ...presenceUser, isOnline: true }, Date.now());
      if (!normalized) return;
      deduped.set(normalized.userId, normalized);
    });

    return Array.from(deduped.values()).filter(
      (item) => !isCurrentUserDuplicateByUsername(item, currentUserId, currentUser?.username || '')
    );
  }, [roomUsers, currentUserId, currentUser?.username]);

  // Sembrar historial desde mensajes recientes (evita panel vacío en primera visita)
  useEffect(() => {
    if (!Array.isArray(fallbackUsers) || fallbackUsers.length === 0) return;
    const now = Date.now();
    setKnownUsers((prev) => {
      const byId = new Map((prev || []).map((item) => [item.userId, item]));

      fallbackUsers.forEach((rawUser) => {
        const item = normalizeSeedUser(rawUser, now);
        if (!item) return;
        const existing = byId.get(item.userId);
        if (existing) {
          byId.set(item.userId, {
            ...existing,
            username: existing.username || item.username,
            avatar: existing.avatar || item.avatar,
            roleBadge: existing.roleBadge || item.roleBadge,
            isPremium: existing.isPremium || item.isPremium,
            isGuest: existing.isGuest || item.isGuest,
            lastConnectedAt: Math.max(existing.lastConnectedAt || 0, item.lastConnectedAt || 0),
          });
        } else {
          byId.set(item.userId, {
            ...item,
            isOnline: false,
            inPrivateWith: null,
            lastDisconnectedAt: item.lastDisconnectedAt || item.lastConnectedAt || now,
          });
        }
      });

      return sortUsers(Array.from(byId.values()), currentUserId).slice(0, MAX_HISTORY_USERS);
    });
  }, [fallbackUsers, currentUserId]);

  // Actualización en vivo + manejo de desconexión reciente
  useEffect(() => {
    const now = Date.now();
    const activeIds = new Set(liveUsers.map((item) => item.userId));

    setKnownUsers((prev) => {
      const byId = new Map((prev || []).map((item) => [item.userId, item]));

      liveUsers.forEach((liveUser) => {
        const previous = byId.get(liveUser.userId);
        byId.set(liveUser.userId, {
          ...(previous || {}),
          ...liveUser,
          isOnline: true,
          lastConnectedAt: previous?.isOnline
            ? (previous.lastConnectedAt || liveUser.lastConnectedAt || now)
            : (liveUser.lastConnectedAt || now),
          lastDisconnectedAt: null,
        });
      });

      byId.forEach((item, userId) => {
        if (activeIds.has(userId)) return;
        if (item.isOnline) {
          byId.set(userId, {
            ...item,
            isOnline: false,
            inPrivateWith: null,
            lastDisconnectedAt: now,
          });
        }
      });

      return sortUsers(Array.from(byId.values()), currentUserId).slice(0, MAX_HISTORY_USERS);
    });
  }, [liveUsers, currentUserId]);

  const onlineCount = useMemo(
    () => knownUsers.filter((item) => item.isOnline).length,
    [knownUsers]
  );

  const users = useMemo(() => {
    const filteredKnownUsers = knownUsers.filter(
      (item) => !isCurrentUserDuplicateByUsername(item, currentUserId, currentUser?.username || '')
    );
    const sorted = sortUsers(filteredKnownUsers, currentUserId);
    const onlineUsers = sorted.filter((item) => item.isOnline);
    const offlineUsers = sorted.filter((item) => !item.isOnline);

    // Si hay más de 10 online, mostrar todos los online en tiempo real.
    if (onlineUsers.length > MIN_VISIBLE_USERS) return onlineUsers;

    // Si hay 10 o menos online, completar con los últimos desconectados.
    const needed = Math.max(0, MIN_VISIBLE_USERS - onlineUsers.length);
    return [...onlineUsers, ...offlineUsers.slice(0, needed)];
  }, [knownUsers, currentUserId, currentUser?.username]);

  useEffect(() => {
    if (users.length <= COMPACT_VISIBLE_LIMIT && isExpanded) {
      setIsExpanded(false);
    }
  }, [users.length, isExpanded]);

  const visibleUsers = useMemo(() => {
    if (isExpanded) return users;
    return users.slice(0, COMPACT_VISIBLE_LIMIT);
  }, [users, isExpanded]);

  const hiddenCount = Math.max(0, users.length - visibleUsers.length);
  const currentUserRole = resolveProfileRole(
    currentUser?.roleBadge,
    currentUser?.profileRole,
    currentUser?.role
  );

  const availableNowUsers = useMemo(() => {
    const now = Date.now();
    const deduped = new Map();

    (Array.isArray(roomUsers) ? roomUsers : [])
      .filter((item) => isUserAvailableForConversation(item, now))
      .forEach((item) => {
        const normalizedRole = resolveProfileRole(
          item?.roleBadge,
          item?.profileRole,
          item?.role
        );

        const normalizedItem = {
          userId: item.userId || item.id,
          username: item.username || 'Usuario',
          avatar: resolveChatAvatar(item.avatar),
          roleBadge: normalizedRole || null,
          isPremium: Boolean(item?.isPremium || item?.isProUser),
          isGuest: Boolean(item?.isGuest || item?.isAnonymous),
          isAnonymous: Boolean(item?.isAnonymous),
          availabilityExpiresAtMs: Number(item?.availableForChatExpiresAtMs || 0) || 0,
          availabilityLastSeenMs: getPresenceActivityMs(item) || 0,
          compatibilityScore: getRoleCompatibilityScore(currentUserRole, normalizedRole),
        };
        if (!normalizedItem.userId) return;
        deduped.set(normalizedItem.userId, normalizedItem);
      });

    return Array.from(deduped.values())
      .filter((item) => item.userId !== currentUserId)
      .filter((item) => !isCurrentUserDuplicateByUsername(item, currentUserId, currentUser?.username || ''))
      .sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) return b.compatibilityScore - a.compatibilityScore;
        if (b.availabilityLastSeenMs !== a.availabilityLastSeenMs) {
          return b.availabilityLastSeenMs - a.availabilityLastSeenMs;
        }
        return String(a.username || '').localeCompare(String(b.username || ''), 'es');
      });
  }, [roomUsers, currentUserId, currentUserRole, currentUser?.username]);

  return (
    <aside className="hidden lg:flex w-72 h-full flex-col border-l border-border bg-card/30 backdrop-blur-sm">
      <div className="p-4 border-b border-border/80">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Usuarios conectados
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {users.length} personas
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <ConversationAvailabilityCard
            roomId={roomId}
            roomUsers={roomUsers}
            user={currentUser}
            onRequestNickname={onRequestNickname}
            variant="compact"
          />

          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Disponibles ahora</h4>
              <p className="text-[11px] text-muted-foreground">
                Solo gente realmente presente y abierta a conversar.
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
              {availableNowUsers.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {availableNowUsers.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Nadie más marcó disponibilidad en este momento.
              </p>
            ) : (
              availableNowUsers.slice(0, 6).map((item) => {
                return (
                  <div
                    key={`available_${item.userId}`}
                    className="rounded-xl border border-emerald-500/15 bg-background/40 p-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="w-9 h-9 border border-emerald-400/35">
                        <AvatarImage src={item.avatar} alt={item.username} />
                        <AvatarFallback className="bg-muted text-foreground text-xs">
                          {item.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.username}
                          </p>
                          {item.isPremium && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35">
                              PRO
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {item.roleBadge ? (
                            <Badge className={`text-[10px] px-2 py-0.5 rounded-full border ${roleBadgeTone(item.roleBadge)}`}>
                              {item.roleBadge}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Sin rol</span>
                          )}

                          {item.compatibilityScore >= 90 && (
                            <span className="text-[10px] text-emerald-300">Alta compatibilidad</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onStartConversation?.(item)}
                      className="mt-2.5 w-full justify-center rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {users.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">Cargando personas...</p>
          </div>
        ) : (
          visibleUsers.map((item) => {
            const isMe = item.userId === currentUserId;
            return (
              <button
                key={item.userId}
                type="button"
                onClick={() => onUserClick?.({
                  userId: item.userId,
                  username: item.username,
                  avatar: item.avatar,
                  roleBadge: item.roleBadge,
                  isPremium: item.isPremium,
                  isGuest: item.isGuest,
                })}
                className="w-full text-left rounded-xl border border-border/60 bg-secondary/15 hover:bg-secondary/30 transition-colors p-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative">
                    <Avatar className={`w-9 h-9 border ${item.isOnline ? 'border-emerald-400/60' : 'border-border/80'}`}>
                      <AvatarImage src={item.avatar} alt={item.username} />
                      <AvatarFallback className="bg-muted text-foreground text-xs">
                        {item.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${
                        item.isOnline
                          ? 'fill-emerald-400 text-emerald-400'
                          : 'fill-orange-400 text-orange-400'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {isMe ? `${item.username} (Tú)` : item.username}
                      </p>
                      {item.isPremium && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35">
                          PRO
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {item.roleBadge ? (
                        <Badge className={`text-[10px] px-2 py-0.5 rounded-full border ${roleBadgeTone(item.roleBadge)}`}>
                          {item.roleBadge}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sin rol</span>
                      )}
                      {item.isOnline && item.inPrivateWith ? (
                        <span className="text-[10px] text-fuchsia-300">En privado</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}

        {users.length > COMPACT_VISIBLE_LIMIT && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full rounded-xl border border-border/70 bg-secondary/20 hover:bg-secondary/35 transition-colors py-2.5 px-3 text-xs font-semibold text-cyan-300"
          >
            {isExpanded
              ? 'Ver menos'
              : `Ver más (${hiddenCount})`}
          </button>
        )}
      </div>
    </aside>
  );
};

export default ChatOnlineUsersColumn;
