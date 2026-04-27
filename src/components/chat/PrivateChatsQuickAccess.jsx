import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { toast } from '@/components/ui/use-toast';
import { ChevronDown, ChevronUp, MessageCircle, X } from 'lucide-react';

const getChatKey = (chat) => {
  if (!chat) return null;
  if (chat.chatId) return `chat:${chat.chatId}`;
  const partnerId = chat?.partner?.userId || chat?.partner?.id;
  if (partnerId) return `partner:${partnerId}`;
  return null;
};

const formatRelativeTime = (timestampMs) => {
  if (!timestampMs) return 'Ahora';
  const diffMs = Math.max(0, Date.now() - timestampMs);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d`;
};

const normalizeChatForList = (chat) => {
  if (!chat) return null;
  const key = getChatKey(chat);
  if (!key) return null;
  return {
    key,
    chatId: chat.chatId || null,
    partner: {
      id: chat?.partner?.id || chat?.partner?.userId || '',
      userId: chat?.partner?.id || chat?.partner?.userId || '',
      username: chat?.partner?.username || 'Usuario',
      avatar: chat?.partner?.avatar || '',
    },
    roomId: chat?.roomId || null,
    lastMessagePreview: chat?.lastMessagePreview || '',
    lastMessageAt: Number(chat?.lastMessageAt || chat?.lastActivityAt || Date.now()),
  };
};

export default function PrivateChatsQuickAccess() {
  const { user } = useAuth();
  const {
    recentPrivateChats,
    openPrivateChats,
    openRecentPrivateChat,
    removeRecentPrivateChat,
    maxOpenPrivateChats,
  } = usePrivateChat();
  const [isExpanded, setIsExpanded] = useState(true);

  const safeRecents = Array.isArray(recentPrivateChats) ? recentPrivateChats : [];
  const safeOpenChats = Array.isArray(openPrivateChats) ? openPrivateChats : [];

  const mergedChats = useMemo(() => {
    const result = [];
    const seen = new Set();

    safeRecents.forEach((item) => {
      const normalized = normalizeChatForList(item);
      if (!normalized || seen.has(normalized.key)) return;
      seen.add(normalized.key);
      result.push(normalized);
    });

    safeOpenChats.forEach((item) => {
      const normalized = normalizeChatForList(item);
      if (!normalized || seen.has(normalized.key)) return;
      seen.add(normalized.key);
      result.unshift({
        ...normalized,
        lastMessageAt: Date.now(),
      });
    });

    return result
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
      .slice(0, 20);
  }, [safeOpenChats, safeRecents]);

  const openKeys = useMemo(
    () => new Set((openPrivateChats || []).map((chat) => getChatKey(chat)).filter(Boolean)),
    [openPrivateChats]
  );

  if (!user?.id || mergedChats.length === 0) return null;

  const handleOpenConversation = (recentChat) => {
    const result = openRecentPrivateChat({
      chatId: recentChat.chatId || null,
      partner: recentChat.partner || {},
      roomId: recentChat.roomId || null,
      lastMessagePreview: recentChat.lastMessagePreview || '',
      lastMessageAt: recentChat.lastMessageAt || Date.now(),
    });

    if (!result?.ok && result?.reason === 'limit_reached') {
      toast({
        title: 'Límite de chats abiertos',
        description: `Puedes abrir hasta ${maxOpenPrivateChats || 3} privados simultáneos.`,
        variant: 'destructive',
      });
      return;
    }
    setIsExpanded(false);
  };

  return (
    <aside className="fixed z-[120] left-3 right-3 bottom-[4.7rem] md:left-auto md:right-4 md:w-[340px] md:bottom-4 pointer-events-none">
      <div className="pointer-events-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between px-3 py-3 text-left"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900">
            <MessageCircle className="h-4 w-4 text-[#1473E6]" />
            Conecta reciente
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-sky-100 bg-sky-50 px-1.5 text-[11px] font-semibold text-sky-700">
              {mergedChats.length}
            </span>
          </span>
          {isExpanded
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronUp className="h-4 w-4 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="px-2 pb-2">
            <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5">
              {mergedChats.map((recentChat) => {
                const itemKey = recentChat.key || getChatKey(recentChat);
                const isOpen = itemKey ? openKeys.has(itemKey) : false;
                const partnerName = recentChat?.partner?.username || 'Usuario';
                const partnerAvatar = recentChat?.partner?.avatar || '';

                return (
                  <div
                    key={itemKey || `${partnerName}-${recentChat.lastMessageAt || 0}`}
                    className="group flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-2.5 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <Avatar className="h-9 w-9 ring-1 ring-[#1473E6]/14">
                      <AvatarImage src={partnerAvatar} alt={partnerName} />
                      <AvatarFallback className="bg-slate-50 text-slate-700 text-xs">
                        {(partnerName || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      type="button"
                      onClick={() => handleOpenConversation(recentChat)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-medium text-slate-900">{partnerName}</p>
                      <p className="truncate text-[11px] text-slate-500">
                        {recentChat.lastMessagePreview || 'Toca para abrir conversación'}
                      </p>
                    </button>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(recentChat.lastMessageAt)}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isOpen ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isOpen ? 'Abierto' : 'Abrir'}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecentPrivateChat(recentChat)}
                      className="h-7 w-7 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
                      title="Quitar de recientes"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
