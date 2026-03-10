/**
 * Contexto global para chat privado persistente
 * La conversación se mantiene al navegar (Baúl, OPIN, otra sala) hasta que
 * uno de los dos cierre explícitamente la ventana.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PrivateChatContext = createContext(null);
const MAX_OPEN_PRIVATE_CHATS = 3;
const MAX_RECENT_PRIVATE_CHATS = 20;
const RECENT_PRIVATE_CHATS_STORAGE_PREFIX = 'chactivo:private_chats:recent:v1:';

const getChatKey = (chat) => {
  if (!chat) return null;
  if (chat.chatId) return `chat:${chat.chatId}`;
  const partnerId = chat?.partner?.userId || chat?.partner?.id;
  if (partnerId) return `partner:${partnerId}`;
  return null;
};

const toTimestampMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value?.toMillis) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizePartner = (partner = {}) => {
  const id = partner?.id || partner?.userId || '';
  return {
    id,
    userId: id,
    username: partner?.username || 'Usuario',
    avatar: partner?.avatar || '',
    isPremium: Boolean(partner?.isPremium),
  };
};

const sanitizeRecentChat = (chat = {}) => {
  const key = getChatKey(chat);
  if (!key) return null;
  const timestamp = toTimestampMs(chat?.lastMessageAt || chat?.lastActivityAt || Date.now()) || Date.now();
  const preview = typeof chat?.lastMessagePreview === 'string'
    ? chat.lastMessagePreview.trim().slice(0, 140)
    : '';
  return {
    key,
    chatId: chat?.chatId || null,
    partner: normalizePartner(chat?.partner || {}),
    roomId: chat?.roomId || null,
    lastMessagePreview: preview,
    lastMessageAt: timestamp,
  };
};

const readRecentChatsFromStorage = (storageKey) => {
  if (!storageKey) return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => sanitizeRecentChat(item))
      .filter(Boolean)
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
      .slice(0, MAX_RECENT_PRIVATE_CHATS);
  } catch {
    return [];
  }
};

export const usePrivateChat = () => {
  const ctx = useContext(PrivateChatContext);
  return ctx || {
    activePrivateChat: null,
    openPrivateChats: [],
    recentPrivateChats: [],
    setActivePrivateChat: () => {},
    closePrivateChat: () => {},
    canOpenMoreChats: () => false,
    openRecentPrivateChat: () => ({ ok: false }),
    removeRecentPrivateChat: () => {},
    upsertRecentPrivateChat: () => {},
    dismissedChatIds: new Set(),
    addDismissedChat: () => {},
  };
};

export const PrivateChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [openPrivateChats, setOpenPrivateChats] = useState([]);
  const [recentPrivateChats, setRecentPrivateChats] = useState([]);
  const [dismissedChatIds, setDismissedChatIds] = useState(new Set());
  const openPrivateChatsRef = useRef([]);
  openPrivateChatsRef.current = openPrivateChats;

  const recentStorageKey = useMemo(() => {
    if (!user?.id) return null;
    return `${RECENT_PRIVATE_CHATS_STORAGE_PREFIX}${user.id}`;
  }, [user?.id]);

  useEffect(() => {
    if (!recentStorageKey) {
      setRecentPrivateChats([]);
      return;
    }
    setRecentPrivateChats(readRecentChatsFromStorage(recentStorageKey));
  }, [recentStorageKey]);

  useEffect(() => {
    if (!recentStorageKey) return;
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(recentPrivateChats));
    } catch {
      // noop
    }
  }, [recentPrivateChats, recentStorageKey]);

  const upsertRecentPrivateChat = (chatMeta) => {
    const sanitized = sanitizeRecentChat(chatMeta);
    if (!sanitized) return;

    setRecentPrivateChats((prev) => {
      const filtered = prev.filter((item) => item.key !== sanitized.key);
      return [sanitized, ...filtered].slice(0, MAX_RECENT_PRIVATE_CHATS);
    });
  };

  const removeRecentPrivateChat = (chatOrKey) => {
    const key = typeof chatOrKey === 'string'
      ? (chatOrKey.startsWith('chat:') || chatOrKey.startsWith('partner:') ? chatOrKey : `chat:${chatOrKey}`)
      : getChatKey(chatOrKey);

    if (!key) return;

    setRecentPrivateChats((prev) => prev.filter((item) => item.key !== key));
  };

  const setActivePrivateChat = (chat) => {
    const key = getChatKey(chat);
    if (!key) return { ok: false, reason: 'invalid_chat' };

    const currentChats = openPrivateChatsRef.current;
    const existingIndex = currentChats.findIndex((item) => getChatKey(item) === key);
    const existingChat = existingIndex >= 0 ? currentChats[existingIndex] : null;

    if (existingIndex === -1 && currentChats.length >= MAX_OPEN_PRIVATE_CHATS) {
      return { ok: false, reason: 'limit_reached', max: MAX_OPEN_PRIVATE_CHATS };
    }

    setOpenPrivateChats((prev) => {
      const idx = prev.findIndex((item) => getChatKey(item) === key);
      if (idx >= 0) {
        const merged = { ...prev[idx], ...chat };
        const withoutCurrent = prev.filter((_, index) => index !== idx);
        return [...withoutCurrent, merged];
      }
      return [...prev, chat];
    });

    upsertRecentPrivateChat({
      ...(existingChat || {}),
      ...(chat || {}),
      lastMessageAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    if (chat.chatId) {
      setDismissedChatIds((prev) => {
        if (!prev.has(chat.chatId)) return prev;
        const next = new Set(prev);
        next.delete(chat.chatId);
        return next;
      });
    }

    return { ok: true };
  };

  const closePrivateChat = (chatIdToDismiss = null) => {
    if (chatIdToDismiss) {
      setDismissedChatIds((prev) => new Set([...prev, chatIdToDismiss]));
    }
    setOpenPrivateChats((prev) => {
      if (!prev.length) return prev;
      if (!chatIdToDismiss) return prev.slice(0, -1);
      return prev.filter((chat) => chat.chatId !== chatIdToDismiss);
    });
  };

  const addDismissedChat = (chatId) => {
    setDismissedChatIds((prev) => new Set([...prev, chatId]));
  };

  const openRecentPrivateChat = (chatMeta) => setActivePrivateChat(chatMeta);

  const canOpenMoreChats = () => openPrivateChatsRef.current.length < MAX_OPEN_PRIVATE_CHATS;

  const activePrivateChat = openPrivateChats.length > 0
    ? openPrivateChats[openPrivateChats.length - 1]
    : null;

  const value = {
    activePrivateChat,
    openPrivateChats,
    recentPrivateChats,
    setActivePrivateChat,
    closePrivateChat,
    canOpenMoreChats,
    openRecentPrivateChat,
    removeRecentPrivateChat,
    upsertRecentPrivateChat,
    dismissedChatIds,
    addDismissedChat,
    maxOpenPrivateChats: MAX_OPEN_PRIVATE_CHATS,
  };

  return (
    <PrivateChatContext.Provider value={value}>
      {children}
    </PrivateChatContext.Provider>
  );
};
