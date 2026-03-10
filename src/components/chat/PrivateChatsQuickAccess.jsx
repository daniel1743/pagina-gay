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
      <div className="pointer-events-auto rounded-2xl border border-cyan-500/20 bg-slate-950/88 backdrop-blur-md shadow-[0_12px_40px_rgba(3,7,18,0.55)]">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-left"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-cyan-100">
            <MessageCircle className="w-4 h-4 text-cyan-300" />
            Privados recientes
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-cyan-500/20 text-cyan-200 text-[11px]">
              {mergedChats.length}
            </span>
          </span>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-cyan-200/80" />
            : <ChevronUp className="w-4 h-4 text-cyan-200/80" />}
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
                    className="group flex items-center gap-2 rounded-xl border border-slate-800/90 bg-slate-900/70 hover:bg-slate-900/95 px-2 py-2"
                  >
                    <Avatar className="h-8 w-8 ring-1 ring-cyan-400/35">
                      <AvatarImage src={partnerAvatar} alt={partnerName} />
                      <AvatarFallback className="bg-slate-800 text-cyan-100 text-xs">
                        {(partnerName || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      type="button"
                      onClick={() => handleOpenConversation(recentChat)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm font-medium text-slate-100 truncate">{partnerName}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {recentChat.lastMessagePreview || 'Toca para abrir conversación'}
                      </p>
                    </button>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-500">
                        {formatRelativeTime(recentChat.lastMessageAt)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isOpen ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700/80 text-slate-200'}`}>
                        {isOpen ? 'Abierto' : 'Abrir'}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecentPrivateChat(recentChat)}
                      className="h-7 w-7 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
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
