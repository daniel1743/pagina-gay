/**
 * 🛡️ RATE LIMITING SERVICE
 *
 * Freno ligero para flood, repeticion y automatizacion simple sin castigar
 * conversacion normal. Se apoya en cache local + persistencia de mute corta
 * en localStorage para mantener la UX consistente entre recargas.
 */

const WINDOW_SECONDS = 10;
const DUPLICATE_WINDOW_SECONDS = 45;
const LOCAL_MUTE_PREFIX = 'chactivo:rate-limit-mute:';

const REGISTERED_LIMITS = {
  MAX_MESSAGES_GLOBAL: 6,
  MAX_MESSAGES_PER_ROOM: 5,
  MIN_INTERVAL_MS: 900,
  MAX_CONSECUTIVE_DUPLICATES: 2,
  MUTE_DURATION_SECONDS: 45,
};

const GUEST_LIMITS = {
  MAX_MESSAGES_GLOBAL: 4,
  MAX_MESSAGES_PER_ROOM: 3,
  MIN_INTERVAL_MS: 1500,
  MAX_CONSECUTIVE_DUPLICATES: 1,
  MUTE_DURATION_SECONDS: 75,
};

const messageCache = new Map(); // userId -> timestamps
const roomMessageCache = new Map(); // userId:roomId -> timestamps
const muteCache = new Map(); // userId -> { muteEnd, reason }
const contentCache = new Map(); // userId:roomId -> [{ content, timestamp }]

const hasLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const getRoomKey = (userId, roomId = 'global') => `${userId}:${roomId || 'global'}`;

const getMuteStorageKey = (userId) => `${LOCAL_MUTE_PREFIX}${userId}`;

const normalizeContent = (content = '') => String(content || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const trimTimestamps = (timestamps = [], now = Date.now(), windowMs = WINDOW_SECONDS * 1000) =>
  timestamps.filter((ts) => now - ts < windowMs);

const trimContentHistory = (entries = [], now = Date.now()) =>
  entries.filter((entry) => entry && entry.content && (now - entry.timestamp) < (DUPLICATE_WINDOW_SECONDS * 1000));

const formatRetryMessage = (retryAfterSeconds, fallback = 'Vas demasiado rapido. Espera un momento.') => {
  if (!retryAfterSeconds || retryAfterSeconds <= 1) {
    return fallback;
  }
  return `Espera ${retryAfterSeconds}s antes de volver a escribir.`;
};

const readPersistedMute = (userId) => {
  if (!userId || !hasLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(getMuteStorageKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.muteEnd || Number.isNaN(Number(parsed.muteEnd))) {
      window.localStorage.removeItem(getMuteStorageKey(userId));
      return null;
    }

    return {
      muteEnd: Number(parsed.muteEnd),
      reason: parsed.reason || 'SPAM_RATE_LIMIT',
    };
  } catch {
    return null;
  }
};

const persistMute = (userId, payload) => {
  if (!userId || !hasLocalStorage()) return;
  try {
    window.localStorage.setItem(getMuteStorageKey(userId), JSON.stringify(payload));
  } catch {
    // noop
  }
};

const clearPersistedMute = (userId) => {
  if (!userId || !hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(getMuteStorageKey(userId));
  } catch {
    // noop
  }
};

const getLimits = (isGuest = false) => (isGuest ? GUEST_LIMITS : REGISTERED_LIMITS);

const getConsecutiveDuplicateCount = (entries = [], normalizedContent = '') => {
  if (!normalizedContent || entries.length === 0) return 0;

  let count = 0;
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    if (entries[i]?.content !== normalizedContent) break;
    count += 1;
  }
  return count;
};

/**
 * Verifica si un usuario esta muteado por flood reciente.
 */
export const isUserMuted = async (userId) => {
  if (!userId) return { muted: false };

  const now = Date.now();
  const cached = muteCache.get(userId);
  if (cached?.muteEnd && now < cached.muteEnd) {
    return {
      muted: true,
      remainingSeconds: Math.ceil((cached.muteEnd - now) / 1000),
      reason: cached.reason || 'SPAM_RATE_LIMIT',
    };
  }

  if (cached?.muteEnd && now >= cached.muteEnd) {
    muteCache.delete(userId);
  }

  const persisted = readPersistedMute(userId);
  if (persisted?.muteEnd && now < persisted.muteEnd) {
    muteCache.set(userId, persisted);
    return {
      muted: true,
      remainingSeconds: Math.ceil((persisted.muteEnd - now) / 1000),
      reason: persisted.reason || 'SPAM_RATE_LIMIT',
    };
  }

  if (persisted?.muteEnd && now >= persisted.muteEnd) {
    clearPersistedMute(userId);
  }

  return { muted: false };
};

/**
 * Aplica mute corto local para enfriar flood sostenido.
 */
export const muteUser = async (userId, durationSeconds = REGISTERED_LIMITS.MUTE_DURATION_SECONDS, reason = 'SPAM_RATE_LIMIT') => {
  if (!userId || durationSeconds <= 0) return;

  const muteEnd = Date.now() + (durationSeconds * 1000);
  const payload = { muteEnd, reason };
  muteCache.set(userId, payload);
  persistMute(userId, payload);
};

/**
 * Limpia mute y cache del usuario.
 */
export const unmuteUser = async (userId) => {
  if (!userId) return;

  muteCache.delete(userId);
  messageCache.delete(userId);
  clearPersistedMute(userId);

  for (const key of roomMessageCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      roomMessageCache.delete(key);
    }
  }

  for (const key of contentCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      contentCache.delete(key);
    }
  }
};

/**
 * Verifica limites por usuario, invitado, sala y repeticion.
 */
export const checkRateLimit = async (userId, roomId, content = '', options = {}) => {
  if (!userId) {
    return {
      allowed: false,
      code: 'rate-limit-invalid-user',
      error: 'No pudimos validar tu sesion para enviar el mensaje.',
    };
  }

  if (options?.isAutomated) {
    return { allowed: true };
  }

  const limits = getLimits(Boolean(options?.isGuest));
  const mutedState = await isUserMuted(userId);
  if (mutedState.muted) {
    return {
      allowed: false,
      code: 'rate-limit-muted',
      retryAfterSeconds: mutedState.remainingSeconds,
      error: formatRetryMessage(
        mutedState.remainingSeconds,
        'Vas demasiado rapido. Espera un momento antes de seguir.'
      ),
    };
  }

  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;
  const roomKey = getRoomKey(userId, roomId);
  const globalMessages = trimTimestamps(messageCache.get(userId) || [], now, windowMs);
  const roomMessages = trimTimestamps(roomMessageCache.get(roomKey) || [], now, windowMs);
  const normalizedContent = normalizeContent(content);
  const recentContents = trimContentHistory(contentCache.get(roomKey) || [], now);

  messageCache.set(userId, globalMessages);
  roomMessageCache.set(roomKey, roomMessages);
  contentCache.set(roomKey, recentContents);

  const lastMessageAt = globalMessages[globalMessages.length - 1] || 0;
  const cooldownRemainingMs = limits.MIN_INTERVAL_MS - (now - lastMessageAt);
  if (lastMessageAt && cooldownRemainingMs > 0) {
    return {
      allowed: false,
      code: 'rate-limit-cooldown',
      retryAfterSeconds: Math.max(1, Math.ceil(cooldownRemainingMs / 1000)),
      error: formatRetryMessage(
        Math.max(1, Math.ceil(cooldownRemainingMs / 1000)),
        'Espera un instante antes de enviar otro mensaje.'
      ),
    };
  }

  if (roomMessages.length >= limits.MAX_MESSAGES_PER_ROOM) {
    const roomRetrySeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - roomMessages[0])) / 1000)
    );
    return {
      allowed: false,
      code: 'rate-limit-room',
      retryAfterSeconds: roomRetrySeconds,
      error: formatRetryMessage(
        roomRetrySeconds,
        'Estás enviando mensajes demasiado rapido en esta sala.'
      ),
    };
  }

  if (globalMessages.length >= limits.MAX_MESSAGES_GLOBAL) {
    await muteUser(userId, limits.MUTE_DURATION_SECONDS, 'RATE_LIMIT_BURST');
    return {
      allowed: false,
      code: 'rate-limit-burst',
      retryAfterSeconds: limits.MUTE_DURATION_SECONDS,
      error: formatRetryMessage(
        limits.MUTE_DURATION_SECONDS,
        'Vas demasiado rapido. Espera un momento antes de seguir.'
      ),
    };
  }

  if (normalizedContent) {
    const duplicateCount = getConsecutiveDuplicateCount(recentContents, normalizedContent);
    if (duplicateCount >= limits.MAX_CONSECUTIVE_DUPLICATES) {
      return {
        allowed: false,
        code: 'rate-limit-duplicate',
        retryAfterSeconds: 8,
        error: 'No repitas el mismo mensaje tantas veces seguidas. Espera unos segundos.',
      };
    }
  }

  return { allowed: true };
};

/**
 * Registra mensaje enviado en cache.
 */
export const recordMessage = (userId, content = '', roomId = 'global') => {
  if (!userId) return;

  const now = Date.now();
  const roomKey = getRoomKey(userId, roomId);
  const globalMessages = trimTimestamps(messageCache.get(userId) || [], now);
  const roomMessages = trimTimestamps(roomMessageCache.get(roomKey) || [], now);

  globalMessages.push(now);
  roomMessages.push(now);

  messageCache.set(userId, globalMessages);
  roomMessageCache.set(roomKey, roomMessages);

  const normalizedContent = normalizeContent(content);
  if (normalizedContent) {
    const recentContents = trimContentHistory(contentCache.get(roomKey) || [], now);
    recentContents.push({ content: normalizedContent, timestamp: now });
    contentCache.set(roomKey, recentContents.slice(-5));
  }
};

/**
 * Limpia cache vieja.
 */
export const cleanupCache = () => {
  const now = Date.now();
  const windowMs = WINDOW_SECONDS * 1000;

  for (const [userId, timestamps] of messageCache.entries()) {
    const recent = trimTimestamps(timestamps, now, windowMs);
    if (recent.length === 0) {
      messageCache.delete(userId);
    } else {
      messageCache.set(userId, recent);
    }
  }

  for (const [roomKey, timestamps] of roomMessageCache.entries()) {
    const recent = trimTimestamps(timestamps, now, windowMs);
    if (recent.length === 0) {
      roomMessageCache.delete(roomKey);
    } else {
      roomMessageCache.set(roomKey, recent);
    }
  }

  for (const [roomKey, entries] of contentCache.entries()) {
    const recent = trimContentHistory(entries, now);
    if (recent.length === 0) {
      contentCache.delete(roomKey);
    } else {
      contentCache.set(roomKey, recent);
    }
  }

  for (const [userId, muteInfo] of muteCache.entries()) {
    if (!muteInfo?.muteEnd || now >= muteInfo.muteEnd) {
      muteCache.delete(userId);
      clearPersistedMute(userId);
    }
  }
};

if (typeof window !== 'undefined') {
  window.setInterval(cleanupCache, 30000);
}
