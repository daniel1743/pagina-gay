import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle, Reply, Lock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';
import { getUserConnectionStatus, getStatusColor } from '@/utils/userStatus';
import { traceEvent, TRACE_EVENTS } from '@/utils/messageTrace';
import { getBadgeConfig } from '@/services/badgeService';
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
  onDeleteMessage,
  messagesEndRef,
  messagesContainerRef,
  newMessagesIndicator,
  onScroll,
  onReply,
  lastReadMessageIndex = -1,
  roomUsers = [],
  dailyTopic = '',
  isLoadingMessages = false,
}) => {
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [activeQuickReplyBadge, setActiveQuickReplyBadge] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));
  const [activeImageActionsMessageId, setActiveImageActionsMessageId] = useState(null);
  const renderedMessageIdsRef = useRef(new Set());
  const shownQuickReplyBadgesRef = useRef(new Set());
  const quickReplyHideTimeoutRef = useRef(null);
  const { user: authUser } = useAuth();

  // ⚡ SEGURIDAD: roomUsers siempre array
  const safeRoomUsers = Array.isArray(roomUsers) ? roomUsers : [];
  const hasProVisualFlags = (obj) => Boolean(
    obj?.isProUser ||
    obj?.hasProBadge ||
    obj?.hasRainbowBorder ||
    obj?.hasFeaturedCard ||
    obj?.canUploadSecondPhoto
  );

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

  // ⚡ Respuesta rápida: mostrar badge temporal una sola vez por conversación activa
  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    let latestQuickReply = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.quickReplyHighlight?.key) {
        latestQuickReply = messages[i].quickReplyHighlight;
        break;
      }
    }

    if (!latestQuickReply?.key) return;
    if (shownQuickReplyBadgesRef.current.has(latestQuickReply.key)) return;

    shownQuickReplyBadgesRef.current.add(latestQuickReply.key);
    setActiveQuickReplyBadge(latestQuickReply);

    if (quickReplyHideTimeoutRef.current) {
      clearTimeout(quickReplyHideTimeoutRef.current);
    }

    quickReplyHideTimeoutRef.current = setTimeout(() => {
      setActiveQuickReplyBadge((prev) => (
        prev?.key === latestQuickReply.key ? null : prev
      ));
    }, 30000);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (quickReplyHideTimeoutRef.current) {
        clearTimeout(quickReplyHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!activeImageActionsMessageId) return;
    const exists = messages?.some((msg) => (msg._realId || msg.id) === activeImageActionsMessageId);
    if (!exists) {
      setActiveImageActionsMessageId(null);
    }
  }, [messages, activeImageActionsMessageId]);

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

  const findUserProStatus = (userId) => {
    if (authUser && (authUser.id === userId || authUser.uid === userId)) {
      return hasProVisualFlags(authUser);
    }
    const presence = safeRoomUsers.find(u => (u.userId || u.id) === userId);
    if (hasProVisualFlags(presence)) return true;

    // Buscar de atrás hacia adelante para priorizar el estado más reciente.
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.userId === userId && hasProVisualFlags(message)) {
        return true;
      }
    }

    return false;
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
        if (message.roleBadge) currentGroup.roleBadge = message.roleBadge;
        if (message.comuna) currentGroup.comuna = message.comuna;
        if (message.quickReplyHighlight && !currentGroup.quickReplyHighlight) {
          currentGroup.quickReplyHighlight = message.quickReplyHighlight;
        }
      } else {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          groupId: `group_${message.id}`,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          isPremium: message.isPremium || false,
          isProUser: message.isProUser || false,
          hasRainbowBorder: message.hasRainbowBorder || false,
          hasProBadge: message.hasProBadge || false,
          hasFeaturedCard: message.hasFeaturedCard || false,
          canUploadSecondPhoto: message.canUploadSecondPhoto || false,
          badge: message.badge || 'Nuevo',
          roleBadge: message.roleBadge || null,
          comuna: message.comuna || null,
          quickReplyHighlight: message.quickReplyHighlight || null,
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
            {isLoadingMessages ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Cargando mensajes...</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">No hay mensajes todavía</p>
                <p className="text-xs text-gray-400 mt-1">Sé el primero en escribir</p>
              </>
            )}
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
          const isUserPro = findUserProStatus(group.userId) || hasProVisualFlags(group);
          const userRole = findUserRole(group.userId);
          const showDivider = lastReadMessageIndex >= 0 && absoluteIndex === lastReadMessageIndex + 1;

          return (
            <div key={group.groupId} className="message-group">
              {showDivider && <NewMessagesDivider show={true} />}
              {group.quickReplyHighlight?.key && activeQuickReplyBadge?.key === group.quickReplyHighlight.key && (
                <div className={`quick-reply-badge ${isOwn ? 'own' : 'other'}`}>
                  ⚡ Conversación activa
                </div>
              )}

              {/* ✅ Nombre: Solo una vez, solo para otros */}
              {!isOwn && (
                <div className="message-username flex items-center gap-1.5 flex-wrap">
                  <span>{group.username}</span>
                  {(() => {
                    const presence = safeRoomUsers.find(u => (u.userId || u.id) === group.userId);
                    if (presence?.inPrivateWith) {
                      return (
                        <motion.span
                          key="private"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                          title={`${group.username} está en chat privado`}
                        >
                          <Lock className="w-3 h-3" />
                          <span className="font-medium">en privado</span>
                          <span className="inline-flex gap-0.5">
                            {[0, 1, 2].map(i => (
                              <motion.span
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                              >
                                ·
                              </motion.span>
                            ))}
                          </span>
                        </motion.span>
                      );
                    }
                    return null;
                  })()}
                  {(isUserPremium || userRole === 'admin') && (
                    <CheckCircle className="inline w-3 h-3 ml-1 text-yellow-500" />
                  )}
                  {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                    <CheckCircle className="inline w-3 h-3 ml-1 text-blue-500" />
                  )}
                  {group.badge && group.badge !== 'Nuevo' && (() => {
                    const badgeConfig = getBadgeConfig(group.badge);
                    return (
                      <span className={`inline-block ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${badgeConfig.bg} ${badgeConfig.color} ${badgeConfig.border} border`}>
                        {group.badge}
                      </span>
                    );
                  })()}
                  {group.roleBadge ? (
                    <span className="inline-block ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 text-cyan-200">
                      {group.roleBadge}
                    </span>
                  ) : null}
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
                        className={`message-avatar cursor-pointer relative ${isUserPro ? 'rainbow-avatar-ring p-[2px] rounded-full' : ''}`}
                        onClick={() => onUserClick({
                          username: group.username,
                          avatar: group.avatar,
                          userId: group.userId,
                          isPremium: isUserPremium,
                          verified: isUserVerified,
                          isProUser: isUserPro,
                          hasRainbowBorder: group.hasRainbowBorder || false,
                          hasProBadge: group.hasProBadge || false,
                          hasFeaturedCard: group.hasFeaturedCard || false,
                          canUploadSecondPhoto: group.canUploadSecondPhoto || false,
                          role: userRole
                        })}
                      >
                        <Avatar className={`w-full h-full ${isUserPro ? 'rounded-full' : ''}`}>
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
                      onClick={() => {
                        const messageKey = message._realId || message.id;
                        if (message.type === 'image' && !isOwn && isMobileViewport) {
                          setActiveImageActionsMessageId((prev) => prev === messageKey ? null : messageKey);
                          return;
                        }
                        onPrivateChat({
                          username: message.username,
                          avatar: message.avatar,
                          userId: message.userId,
                          isPremium: isUserPremium
                        });
                      }}
                    >
                      {message.type === 'text' && message.content}
                      {message.type === 'gif' && (
                        <img src={message.content} alt="GIF" className="rounded max-w-full" />
                      )}
                      {message.type === 'image' && (
                        message.content
                          ? <img src={message.content} alt="Imagen del chat" className="block rounded-lg w-auto h-auto max-w-[150px] sm:max-w-[200px] lg:max-w-[220px] max-h-[240px] object-cover" loading="lazy" />
                          : <span className="text-xs text-muted-foreground">Imagen</span>
                      )}
                      {(() => {
                        const likeCount = Number(message.reactions?.like || 0);
                        const dislikeCount = Number(message.reactions?.dislike || 0);
                        const fireCount = Number(message.reactions?.fire || 0);
                        const heartCount = Number(message.reactions?.heart || 0);
                        const devilCount = Number(message.reactions?.devil || 0);
                        if (likeCount <= 0 && dislikeCount <= 0 && fireCount <= 0 && heartCount <= 0 && devilCount <= 0) return null;

                        return (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                            {likeCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-300">
                                <ThumbsUp className="w-2.5 h-2.5" />
                                {likeCount}
                              </span>
                            )}
                            {dislikeCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-300">
                                <ThumbsDown className="w-2.5 h-2.5" />
                                {dislikeCount}
                              </span>
                            )}
                            {fireCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300">
                                <span>🔥</span>
                                {fireCount}
                              </span>
                            )}
                            {heartCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-300">
                                <span>❤️</span>
                                {heartCount}
                              </span>
                            )}
                            {devilCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                                <span>😈</span>
                                {devilCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      {isOwn && message.type === 'image' && !message._optimistic && typeof onDeleteMessage === 'function' && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] bg-black/20 hover:bg-black/30 text-white/90 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMessage(message);
                            }}
                            title="Eliminar foto"
                            aria-label="Eliminar foto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ACCIONES - Solo para otros */}
                    {!isOwn && (
                      <span
                        className={`inline-flex items-center gap-1 ml-1 transition-opacity ${
                          message.type === 'image'
                            ? (
                              isMobileViewport
                                ? ((activeImageActionsMessageId === (message._realId || message.id)) ? 'opacity-100' : 'opacity-0 pointer-events-none')
                                : 'opacity-100'
                            )
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Button size="icon" variant="ghost" className="h-5 w-5 text-gray-400 hover:text-cyan-500"
                          onClick={(e) => { e.stopPropagation(); onReply?.({ messageId: message.id, username: message.username, content: message.type === 'image' ? '📷 Imagen' : message.content }); }}>
                          <Reply className="h-3 w-3" />
                        </Button>
                        {currentUserId && !message._optimistic && (
                          <>
                            {message.type === 'image' ? (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-orange-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firestoreId = message._realId || message.id;
                                    onReaction(firestoreId, 'fire');
                                  }}
                                  title="Reaccionar con fuego"
                                >
                                  <span className="text-[13px] leading-none">🔥</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-pink-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firestoreId = message._realId || message.id;
                                    onReaction(firestoreId, 'heart');
                                  }}
                                  title="Reaccionar con corazón"
                                >
                                  <span className="text-[13px] leading-none">❤️</span>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 text-gray-400 hover:text-purple-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const firestoreId = message._realId || message.id;
                                    onReaction(firestoreId, 'devil');
                                  }}
                                  title="Reaccionar con diablito"
                                >
                                  <span className="text-[13px] leading-none">😈</span>
                                </Button>
                              </>
                            ) : (
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
                          </>
                        )}
                      </span>
                    )}

                    {/* Delivery status — solo en mensajes propios, último del grupo */}
                    {isOwn && showTime && (
                      <span className={`message-status ${message.status === 'error' ? 'error' : message.status === 'delivered' ? 'delivered' : message.status === 'sent' ? 'sent' : 'sending'}`}>
                        {message.status === 'error' ? '!' : message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓✓' : '✓'}
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
