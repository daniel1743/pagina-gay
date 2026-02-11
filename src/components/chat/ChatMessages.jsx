import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle, Reply } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';
import { getUserConnectionStatus, getStatusColor } from '@/utils/userStatus';
import { traceEvent, TRACE_EVENTS } from '@/utils/messageTrace';
import './ChatMessages.css';

/**
 * ⚡ TELEGRAM DESKTOP STYLE - Alta Densidad
 *
 * ESTRUCTURA:
 * - messages-container: flex column, width 100%, gap 0
 * - message-group: width 100%, margin-bottom 12px (entre usuarios)
 * - message-row: width 100%, margin-bottom 2px (entre mensajes mismo usuario)
 * - message-bubble: max-width 75%, width fit-content
 */

const ChatMessages = ({
  messages,
  currentUserId,
  onUserClick,
  onReport,
  onPrivateChat,
  onReaction,
  messagesEndRef,
  messagesContainerRef,
  newMessagesIndicator,
  onScroll,
  onReply,
  lastReadMessageIndex = -1,
  roomUsers = [],
  dailyTopic = ''
}) => {
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const renderedMessageIdsRef = useRef(new Set());
  const { user: authUser } = useAuth();

  // ⚡ SEGURIDAD: roomUsers siempre array
  const safeRoomUsers = Array.isArray(roomUsers) ? roomUsers : [];

  // 🔍 TRACE: Rastrear mensajes nuevos
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const newMessages = messages.filter(msg => {
      const msgId = msg.id || msg._realId || msg.clientId;
      if (!msgId) return false;
      if (renderedMessageIdsRef.current.has(msgId)) return false;
      renderedMessageIdsRef.current.add(msgId);
      return true;
    });

    newMessages.forEach(msg => {
      const msgId = msg.id || msg._realId || msg.clientId;
      traceEvent(TRACE_EVENTS.REMOTE_UI_RENDER, {
        traceId: msg.clientId || msg.trace?.traceId || msgId,
        messageId: msgId,
        userId: msg.userId,
        username: msg.username,
        content: msg.content?.substring(0, 50),
        isOwn: msg.userId === currentUserId,
        isOptimistic: msg._optimistic || false,
        timestamp: msg.timestampMs || Date.now(),
      });
    });
  }, [messages, currentUserId]);

  // ⏰ Formatear timestamp
  const formatTime = (timestamp) => {
    try {
      let date;
      if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (timestamp?.toMillis) {
        date = new Date(timestamp.toMillis());
      } else if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        return '';
      }
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 🔍 Buscar estados de usuario
  const findUserPremiumStatus = (userId) => {
    if (authUser?.id === userId) return authUser?.isPremium || false;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.isPremium || false;
  };

  const findUserVerifiedStatus = (userId) => {
    if (authUser?.id === userId) return authUser?.verified || false;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.verified || false;
  };

  const findUserRole = (userId) => {
    if (authUser?.id === userId) return authUser?.role || null;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.role || null;
  };

  // 🎯 Saltar a mensaje específico
  const handleJumpToMessage = (messageId) => {
    const messageElement = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  // ⚡ AGRUPACIÓN: Mensajes consecutivos del mismo usuario
  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    const GROUP_TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutos

    messages.forEach((message, index) => {
      // Filtrar mensajes del moderador
      if (message.userId === 'system_moderator') return;

      const isSystem = message.userId === 'system';

      // Mensajes de sistema: siempre individuales
      if (isSystem) {
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
        groups.push({
          groupId: `system_${message.id}`,
          userId: message.userId,
          messages: [message],
          isSystem: true,
        });
        return;
      }

      // Obtener timestamp
      const messageTime = message.timestampMs ||
        (message.timestamp?.toMillis?.() ||
          (typeof message.timestamp === 'number' ? message.timestamp :
            (message.timestamp ? new Date(message.timestamp).getTime() : Date.now())));

      const prevMessage = index > 0 ? messages[index - 1] : null;
      const prevTime = prevMessage ?
        (prevMessage.timestampMs ||
          (prevMessage.timestamp?.toMillis?.() ||
            (typeof prevMessage.timestamp === 'number' ? prevMessage.timestamp :
              (prevMessage.timestamp ? new Date(prevMessage.timestamp).getTime() : Date.now())))) :
        null;

      const timeDiff = prevTime ? messageTime - prevTime : Infinity;

      // Agrupar si mismo usuario y diferencia <= 2 min
      const shouldGroup = prevMessage &&
        prevMessage.userId === message.userId &&
        prevMessage.userId !== 'system' &&
        prevMessage.userId !== 'system_moderator' &&
        timeDiff <= GROUP_TIME_THRESHOLD;

      if (shouldGroup && currentGroup) {
        currentGroup.messages.push(message);
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          groupId: `group_${message.id}`,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          isPremium: message.isPremium || false,
          messages: [message],
          isSystem: false,
        };
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  };

  const messageGroups = groupMessages(messages);

  return (
    <div
      ref={messagesContainerRef}
      role="log"
      aria-live="polite"
      aria-label="Área de mensajes del chat"
      className="messages-container flex-1"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={onScroll}
    >
      {newMessagesIndicator}

      {dailyTopic ? (
        <div className="flex justify-center py-2">
          <div className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-800/70 px-3 py-1 rounded-full">
            Tema del día: {dailyTopic}
          </div>
        </div>
      ) : null}

      {messageGroups.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">No hay mensajes todavía</p>
            <p className="text-xs text-gray-400 mt-1">Sé el primero en escribir</p>
          </div>
        </div>
      ) : (
        messageGroups.map((group, groupIndex) => {
          // Calcular índice absoluto para divider
          let absoluteIndex = 0;
          for (let i = 0; i < groupIndex; i++) {
            absoluteIndex += messageGroups[i].messages.length;
          }

          // Mensajes de sistema
          if (group.isSystem) {
            return (
              <div key={group.groupId} className="message-group">
                {group.messages.map((message) => (
                  <div key={message.id} className="flex justify-center py-2 px-4">
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-gray-800/60 px-4 py-1.5 rounded-full text-center max-w-[85%] leading-relaxed">
                      {message.content || message.text}
                    </span>
                  </div>
                ))}
              </div>
            );
          }

          const isOwn = group.userId === currentUserId;
          const isUserPremium = findUserPremiumStatus(group.userId);
          const isUserVerified = findUserVerifiedStatus(group.userId);
          const userRole = findUserRole(group.userId);
          const showDivider = lastReadMessageIndex >= 0 && absoluteIndex === lastReadMessageIndex + 1;

          return (
            <div key={group.groupId} className="message-group">
              {showDivider && <NewMessagesDivider show={true} />}

              {/* ✅ Nombre: Solo una vez, solo para otros */}
              {!isOwn && (
                <div className="message-username">
                  {group.username}
                  {(isUserPremium || userRole === 'admin') && (
                    <CheckCircle className="inline w-3 h-3 ml-1 text-yellow-500" />
                  )}
                  {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                    <CheckCircle className="inline w-3 h-3 ml-1 text-blue-500" />
                  )}
                </div>
              )}

              {/* ⚡ MENSAJES DEL GRUPO */}
              {group.messages.map((message, msgIndex) => {
                const isFirst = msgIndex === 0;
                const isLast = msgIndex === group.messages.length - 1;
                const isSingle = group.messages.length === 1;

                // Determinar posición para border-radius
                let positionClass = 'single';
                if (!isSingle) {
                  if (isFirst) positionClass = 'first';
                  else if (isLast) positionClass = 'last';
                  else positionClass = 'middle';
                }

                // Mostrar timestamp solo en último mensaje del grupo
                const showTime = isLast;

                // Estado de conexión del usuario
                const userPresence = safeRoomUsers.find(u => (u.userId || u.id) === group.userId);
                const status = getUserConnectionStatus(userPresence);
                const statusColor = getStatusColor(status);

                return (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    className={`message-row group ${isOwn ? 'own' : 'other'}`}
                  >
                    {/* ✅ Avatar: Solo en primer mensaje, solo para otros */}
                    {!isOwn && isFirst && (
                      <div
                        className="message-avatar cursor-pointer relative"
                        onClick={() => onUserClick({
                          username: group.username,
                          avatar: group.avatar,
                          userId: group.userId,
                          isPremium: isUserPremium,
                          verified: isUserVerified,
                          role: userRole
                        })}
                      >
                        <Avatar className="w-full h-full">
                          <AvatarImage
                            src={group.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.username || 'guest'}`}
                            alt={group.username || 'Usuario'}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                            {group.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Punto de estado */}
                        <div
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor} rounded-full border-2 border-white dark:border-gray-900`}
                          title={status === 'online' ? 'Conectado' : status === 'recently_offline' ? 'Recién desconectado' : 'Desconectado'}
                        />
                      </div>
                    )}

                    {/* Placeholder para mantener alineación */}
                    {!isOwn && !isFirst && (
                      <div className="message-avatar-placeholder" />
                    )}

                    {/* Quote si existe */}
                    {message.replyTo && (
                      <MessageQuote
                        replyTo={message.replyTo}
                        onJumpToMessage={handleJumpToMessage}
                      />
                    )}

                    {/* ⚡ BURBUJA */}
                    <div
                      className={`message-bubble ${isOwn ? 'own' : 'other'} ${positionClass}`}
                      onClick={() => onPrivateChat({
                        username: message.username,
                        avatar: message.avatar,
                        userId: message.userId,
                        isPremium: isUserPremium
                      })}
                    >
                      {message.type === 'text' && message.content}
                      {message.type === 'gif' && (
                        <img src={message.content} alt="GIF" className="rounded max-w-full" />
                      )}
                    </div>

                    {/* ACCIONES - Solo para otros */}
                    {!isOwn && (
                      <span className="inline-flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-cyan-500"
                          onClick={(e) => { e.stopPropagation(); onReply?.({ messageId: message.id, username: message.username, content: message.content }); }}>
                          <Reply className="h-3 w-3" />
                        </Button>
                        {currentUserId && !message._optimistic && (
                          <>
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-green-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Usar _realId (ID de Firestore) si existe, sino id
                                const firestoreId = message._realId || message.id;
                                console.log('[UI] Like click, ID:', firestoreId);
                                onReaction(firestoreId, 'like');
                              }}>
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                const firestoreId = message._realId || message.id;
                                onReaction(firestoreId, 'dislike');
                              }}>
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </span>
                    )}

                    {/* Timestamp */}
                    {showTime && (
                      <span className={`message-time ${isOwn ? 'own' : ''}`}>
                        {formatTime(message.timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
