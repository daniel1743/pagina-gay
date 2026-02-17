/**
 * Contexto global para chat privado persistente
 * La conversación se mantiene al navegar (Baúl, OPIN, otra sala) hasta que
 * uno de los dos cierre explícitamente la ventana.
 */
import React, { createContext, useContext, useRef, useState } from 'react';

const PrivateChatContext = createContext(null);
const MAX_OPEN_PRIVATE_CHATS = 3;

const getChatKey = (chat) => {
  if (!chat) return null;
  if (chat.chatId) return `chat:${chat.chatId}`;
  const partnerId = chat?.partner?.userId || chat?.partner?.id;
  if (partnerId) return `partner:${partnerId}`;
  return null;
};

export const usePrivateChat = () => {
  const ctx = useContext(PrivateChatContext);
  return ctx || {
    activePrivateChat: null,
    openPrivateChats: [],
    setActivePrivateChat: () => {},
    closePrivateChat: () => {},
    canOpenMoreChats: () => false,
    dismissedChatIds: new Set(),
    addDismissedChat: () => {},
  };
};

export const PrivateChatProvider = ({ children }) => {
  const [openPrivateChats, setOpenPrivateChats] = useState([]);
  const [dismissedChatIds, setDismissedChatIds] = useState(new Set());
  const openPrivateChatsRef = useRef([]);
  openPrivateChatsRef.current = openPrivateChats;

  const setActivePrivateChat = (chat) => {
    const key = getChatKey(chat);
    if (!key) return { ok: false, reason: 'invalid_chat' };

    const currentChats = openPrivateChatsRef.current;
    const existingIndex = currentChats.findIndex((item) => getChatKey(item) === key);

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

  const canOpenMoreChats = () => openPrivateChatsRef.current.length < MAX_OPEN_PRIVATE_CHATS;

  const activePrivateChat = openPrivateChats.length > 0
    ? openPrivateChats[openPrivateChats.length - 1]
    : null;

  const value = {
    activePrivateChat,
    openPrivateChats,
    setActivePrivateChat,
    closePrivateChat,
    canOpenMoreChats,
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
