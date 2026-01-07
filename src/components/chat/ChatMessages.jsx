import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle, Check, CheckCheck, Reply, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';
import { getUserConnectionStatus, getStatusColor } from '@/utils/userStatus';
import MessageDeliveryCheck from '@/components/MessageDeliveryCheck';
import { traceEvent, TRACE_EVENTS } from '@/utils/messageTrace';

/**
 * Componente especial para el mensaje de bienvenida del moderador
 * Se muestra por 5 segundos y tiene un botón para cerrar
 */
const ModeratorWelcomeMessage = ({ message, showDivider }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Ocultar automáticamente después de 5 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <React.Fragment>
      {showDivider && <NewMessagesDivider show={true} />}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{
              duration: 0.3,
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
            className="flex gap-1.5 flex-row mb-2"
          >
            <motion.div
              className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs flex items-center justify-center">
                  🛡️
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex flex-col items-start max-w-[85%] sm:max-w-[70%] md:max-w-[60%] min-w-0 relative">
              <motion.div
                className="relative rounded-2xl px-3 pt-2.5 pb-3.5 w-full break-words shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/40 dark:to-pink-900/40 border-2 border-purple-300/60 dark:border-purple-600/50"
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* 🔺 Piquito especial para mensajes del moderador */}
                <div
                  className="absolute top-2 left-[-7px] border-r-[7px] border-r-purple-50 dark:border-r-purple-900/40 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent"
                  style={{ width: 0, height: 0 }}
                />
                {/* Botón de cerrar (X) */}
                <button
                  onClick={handleClose}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                  aria-label="Cerrar mensaje del moderador"
                >
                  <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Nombre del moderador */}
                <div className="flex items-center gap-1 mb-1.5 pr-6">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    {message.username}
                  </span>
                </div>

                {/* Contenido del mensaje */}
                <div className="text-[15px] leading-[1.5] text-foreground whitespace-pre-line">
                  {message.content}
                </div>

                {/* Botón de aceptar */}
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={handleClose}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
                  >
                    Entendido
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </React.Fragment>
  );
};

const ChatMessages = ({ messages, currentUserId, onUserClick, onReport, onPrivateChat, onReaction, messagesEndRef, messagesContainerRef, newMessagesIndicator, onScroll, onReply, lastReadMessageIndex = -1, roomUsers = [] }) => {
  // 📱 Sistema de doble check dinámico (like WhatsApp)
  const [messageChecks, setMessageChecks] = useState({});
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const renderedMessageIdsRef = useRef(new Set());
  
  // ⚡ SEGURIDAD: Asegurar que roomUsers siempre sea un array
  const safeRoomUsers = Array.isArray(roomUsers) ? roomUsers : [];
  
  // 🔍 TRACE: Rastrear cuando se renderizan mensajes nuevos
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Identificar mensajes nuevos que no se han renderizado antes
    const newMessages = messages.filter(msg => {
      const msgId = msg.id || msg._realId || msg.clientId;
      if (!msgId) return false;
      if (renderedMessageIdsRef.current.has(msgId)) return false;
      renderedMessageIdsRef.current.add(msgId);
      return true;
    });
    
    // Rastrear cada mensaje nuevo que se renderiza
    newMessages.forEach(msg => {
      const msgId = msg.id || msg._realId || msg.clientId;
      const isOwn = msg.userId === currentUserId;
      
      traceEvent(TRACE_EVENTS.REMOTE_UI_RENDER, {
        traceId: msg.clientId || msg.trace?.traceId || msgId,
        messageId: msgId,
        userId: msg.userId,
        username: msg.username,
        content: msg.content?.substring(0, 50),
        isOwn,
        isOptimistic: msg._optimistic || false,
        timestamp: msg.timestampMs || Date.now(),
      });
    });
  }, [messages, currentUserId]);
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
        return ''; // Si no se puede parsear, no mostrar fecha
      }
      
      if (isNaN(date.getTime())) {
        return ''; // Fecha inválida
      }
      
      return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return ''; // Error al formatear, no mostrar fecha
    }
  };
  
  const { user: authUser } = useAuth();

  // ✅ Simular doble check: 1 check → 2 checks azules después de 2 segundos
  useEffect(() => {
    const timeouts = [];

    messages.forEach((message) => {
      const isOwn = message.userId === currentUserId;

      // Solo procesar mensajes propios que no tengan check establecido
      if (isOwn && !messageChecks[message.id]) {
        // Iniciar con 1 check
        setMessageChecks(prev => ({ ...prev, [message.id]: 'single' }));

        // ⚡ DESPUÉS DE 3-4 SEGUNDOS: Cambiar a 2 checks azules/verdes (leído)
        const timeoutId = setTimeout(() => {
          setMessageChecks(prev => ({ ...prev, [message.id]: 'double' }));
        }, 3500); // 3.5 segundos (entre 3-4 segundos)

        timeouts.push(timeoutId);
      }
    });

    // Cleanup: limpiar todos los timeouts cuando el componente se desmonte
    return () => {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [messages, currentUserId, messageChecks]);

  const findUserPremiumStatus = (userId) => {
    if (authUser.id === userId) return authUser.isPremium;
    const userMessage = messages.find(m => m.userId === userId);
    if(userMessage && userMessage.isPremium) return true;
    return false;
  };

  const findUserVerifiedStatus = (userId) => {
    if (authUser.id === userId) return authUser.verified;
    const userMessage = messages.find(m => m.userId === userId);
    if(userMessage && userMessage.verified) return true;
    return false;
  };

  const findUserRole = (userId) => {
    if (authUser.id === userId) return authUser.role;
    const userMessage = messages.find(m => m.userId === userId);
    return userMessage?.role || null;
  };
  
  const getBubbleStyle = () => {
    if(!authUser.isPremium || !authUser.theme?.bubble) return {};
    switch(authUser.theme.bubble){
        case 'rounded': return { borderRadius: '24px' };
        case 'sharp': return { borderRadius: '4px' };
        default: return {};
    }
  }

  // 🎯 JUMP TO MESSAGE: Saltar a un mensaje específico con highlight
  const handleJumpToMessage = (messageId) => {
    const messageElement = messagesContainerRef.current?.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      // Scroll al mensaje
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight temporal
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  // ✅ MESSAGE GROUPING: Agrupar mensajes consecutivos del mismo usuario (WhatsApp/Telegram-style)
  const groupMessages = (messages) => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    const GROUP_TIME_THRESHOLD = 2 * 60 * 1000; // 2 minutos en ms

    messages.forEach((message, index) => {
      // ⚠️ FILTRAR MENSAJES DEL MODERADOR (06/01/2026) - A petición del usuario
      // No mostrar mensajes del moderador en el chat
      if (message.userId === 'system_moderator') {
        return; // ✅ Saltar este mensaje completamente
      }
      
      const isSystem = message.userId === 'system';
      // ⚠️ MENSAJES DEL MODERADOR COMENTADOS (06/01/2026) - A petición del usuario
      // const isModerator = message.userId === 'system_moderator';
      const isModerator = false; // ✅ Forzar a false, no procesar moderador
      
      // ⚠️ MENSAJES DEL MODERADOR COMENTADOS (06/01/2026)
      // Mensajes de sistema/moderador no se agrupan (siempre individuales)
      // if (isSystem || isModerator) {
      if (isSystem) { // ✅ Solo procesar mensajes de sistema, NO moderador
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
        groups.push({
          groupId: `single_${message.id}`,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          isPremium: message.isPremium || false,
          messages: [message],
          isSystem,
          isModerator: false, // ✅ Forzar a false
        });
        return;
      }

      // Obtener timestamp en ms para comparación
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

      // Agrupar si:
      // 1. Es el mismo userId que el mensaje anterior
      // 2. La diferencia de tiempo es <= 2 minutos (o no hay timestamp confiable)
      const shouldGroup = prevMessage && 
                          prevMessage.userId === message.userId && 
                          !prevMessage.isSystem && 
                          !prevMessage.isModerator &&
                          timeDiff <= GROUP_TIME_THRESHOLD;

      if (shouldGroup && currentGroup) {
        // Agregar al grupo actual
        currentGroup.messages.push(message);
      } else {
        // Crear nuevo grupo
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          groupId: `group_${message.id}`,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          isPremium: message.isPremium || false,
          messages: [message],
          isSystem: false,
          isModerator: false,
        };
      }
    });

    // Agregar el último grupo si existe
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // ✅ Agrupar mensajes antes de renderizar
  const messageGroups = groupMessages(messages);

  return (
    <div
      ref={messagesContainerRef}
      role="log"
      aria-live="polite"
      aria-label="Área de mensajes del chat"
      className="messages-container flex-1 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 scrollbar-hide relative"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={onScroll}
    >
      {newMessagesIndicator}
      {messageGroups.map((group, groupIndex) => {
        // Calcular índice absoluto del primer mensaje del grupo para el divider
        let absoluteIndex = 0;
        for (let i = 0; i < groupIndex; i++) {
          absoluteIndex += messageGroups[i].messages.length;
        }

        // ⚠️ MENSAJES DEL MODERADOR COMENTADOS (06/01/2026) - A petición del usuario
        // Renderizar mensajes de sistema/moderador de forma especial (sin agrupación visual)
        if (group.isSystem || group.isModerator) {
          // ⚠️ FILTRAR MENSAJES DEL MODERADOR: No renderizar
          if (group.isModerator) {
            return null; // ✅ No renderizar mensajes del moderador
          }
          
          return group.messages.map((message, msgIndexInGroup) => {
            const messageIndex = absoluteIndex + msgIndexInGroup;
            const showDivider = lastReadMessageIndex >= 0 && messageIndex === lastReadMessageIndex + 1;

            // ⚠️ MENSAJES DEL MODERADOR COMENTADOS (06/01/2026)
            // if (group.isModerator) {
            //   return (
            //     <ModeratorWelcomeMessage
            //       key={message.id}
            //       message={message}
            //       showDivider={showDivider}
            //     />
            //   );
            // }

            return (
              <React.Fragment key={message.id}>
                {showDivider && <NewMessagesDivider show={true} />}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center"
                >
                  <div className="text-center text-xs text-muted-foreground bg-card px-3 py-1 rounded-full">
                    {message.content}
                  </div>
                </motion.div>
              </React.Fragment>
            );
          });
        }

        // Renderizar grupo de mensajes normales
        const isOwn = group.userId === currentUserId;
        const isUserPremium = findUserPremiumStatus(group.userId);
        const isUserVerified = findUserVerifiedStatus(group.userId);
        const userRole = findUserRole(group.userId);
        const firstMessage = group.messages[0];
        const showDivider = lastReadMessageIndex >= 0 && absoluteIndex === lastReadMessageIndex + 1;

        return (
          <React.Fragment key={group.groupId}>
            {showDivider && <NewMessagesDivider show={true} />}
            <motion.div
              data-message-id={firstMessage.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut'
              }}
              // ✅ AGRUPACIÓN COMPACTA: Contenedor del grupo sin hover global
              className={`flex gap-2 ${isOwn ? 'flex-row justify-end' : 'flex-row'} items-start py-0.5 px-1`}
            >
              {/* ✅ Avatar: Mostrar SOLO en el primer mensaje del grupo */}
              {group.messages.length > 0 && (
                <motion.div
                  className={`relative w-10 h-10 sm:w-9 sm:h-9 rounded-full flex-shrink-0 ${isOwn ? 'order-2' : 'order-1'} ${group.messages.length > 1 ? 'self-start' : ''}`}
                  onClick={() => onUserClick({
                    username: group.username,
                    avatar: group.avatar,
                    userId: group.userId,
                    isPremium: isUserPremium,
                    verified: isUserVerified,
                    role: userRole
                  })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* 🎨 Borde animado de colores (premium) */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #3b82f6, #8b5cf6, #a855f7)',
                      padding: '2px',
                      animation: 'avatar-border-spin 3s linear infinite',
                      borderRadius: '50%',
                      zIndex: 0
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-gray-50 dark:bg-gray-900" style={{ borderRadius: '50%' }}></div>
                  </div>
                  <Avatar className="relative w-full h-full cursor-pointer rounded-full overflow-hidden z-10" style={{ border: 'none' }}>
                    <AvatarImage 
                      src={group.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.username || 'guest'}`} 
                      alt={group.username || 'Usuario'} 
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextElementSibling;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {(group.username && group.username[0]) ? group.username[0].toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* ⚡ PUNTO DE ESTADO: Verde/Naranja/Rojo (solo para otros usuarios) */}
                  {!isOwn && (
                    (() => {
                      const userPresence = safeRoomUsers.find(u => (u.userId || u.id) === group.userId);
                      const status = getUserConnectionStatus(userPresence);
                      const statusColor = getStatusColor(status);
                      
                      return (
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-white dark:border-gray-900 shadow-sm`}
                          title={status === 'online' ? 'Conectado' : status === 'recently_offline' ? 'Recién desconectado' : 'Desconectado'}
                        />
                      );
                    })()
                  )}
                </motion.div>
              )}

              {/* ✅ Mensajes del grupo - AGRUPACIÓN COMPACTA */}
              <div
                className={`flex flex-col ${
                  isOwn
                    ? 'items-end order-1 mr-3 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]'
                    : 'items-start order-2 ml-3 flex-1 min-w-0 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]'
                }`}
              >
                {/* ✅ Nombre del usuario: Solo mostrar en el primer mensaje del grupo (si NO es propio) */}
                {!isOwn && group.messages.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      {group.username}
                      {(isUserPremium || userRole === 'admin') && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#FFD700]" />
                      )}
                      {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                        <CheckCircle className="w-3.5 h-3.5 text-[#1DA1F2]" />
                      )}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(firstMessage.timestamp)}
                    </span>
                  </div>
                )}

                {/* ✅ Renderizar cada mensaje del grupo - COMPACTO */}
                {group.messages.map((message, msgIndexInGroup) => {
                  const isHighlighted = highlightedMessageId === message.id;
                  const isFirstInGroup = msgIndexInGroup === 0;
                  const isLastInGroup = msgIndexInGroup === group.messages.length - 1;
                  
                  // ✅ Separación compacta: 1-2px entre mensajes del mismo grupo
                  const spacingClass = isLastInGroup ? 'mb-0' : 'mb-[2px]';

                  return (
                    <div 
                      key={message.id} 
                      className={`message-bubble-wrapper ${spacingClass} group/message`}
                      data-message-id={message.id}
                    >
                      {/* 💬 QUOTE: Mostrar mensaje citado si existe */}
                      {message.replyTo && (
                        <div className="mb-1">
                          <MessageQuote
                            replyTo={message.replyTo}
                            onJumpToMessage={handleJumpToMessage}
                          />
                        </div>
                      )}

                      {/* 🎨 BURBUJA DE MENSAJE - Estilo WhatsApp Compacto */}
                      <div className={`inline-flex flex-row items-end gap-1 ${isOwn ? 'justify-end' : 'justify-start'} w-full`}>
                        
                        {/* ⚡ Hora y checks para mensajes propios */}
                        {isOwn && (
                          <div className="flex items-center gap-1 mb-0.5 flex-shrink-0">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {formatTime(message.timestamp)}
                            </span>
                            <MessageDeliveryCheck message={message} isOwnMessage={isOwn} />
                          </div>
                        )}

                        {/* Burbuja del mensaje - Hover individual */}
                        <div
                          className={`message-bubble cursor-pointer break-words overflow-wrap-anywhere rounded-[7.5px] px-2.5 py-1.5 max-w-full transition-all ${
                            isOwn 
                              ? 'bg-[#DCF8C6] text-[#000000] hover:bg-[#D4F0B8]' // Verde WhatsApp para mensajes propios
                              : 'bg-white text-[#000000] border border-gray-200 hover:bg-gray-50 hover:border-gray-300' // Blanco para mensajes de otros
                          }`}
                          onClick={() => onPrivateChat({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
                        >
                          {message.type === 'text' && (
                            <p className="text-[14.2px] leading-[1.35] whitespace-pre-wrap break-words font-normal" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                              {message.content}
                            </p>
                          )}
                          {message.type === 'gif' && (
                            <img src={message.content} alt="GIF" className="rounded-[12px] max-w-full sm:max-w-xs" />
                          )}
                        </div>

                        {/* Hora para mensajes de otros */}
                        {!isOwn && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5 flex-shrink-0">
                            {formatTime(message.timestamp)}
                          </span>
                        )}
                      </div>

                      {/* ⚡ ACCIONES: Reply, Like, Dislike - Hover individual por burbuja */}
                      {!isOwn && (
                        <motion.div
                          className="flex items-center gap-2 mt-0.5 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200"
                          initial={{ y: 5 }}
                          whileHover={{ y: 0 }}
                        >
                          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-cyan-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReply?.({
                                  messageId: message.id,
                                  username: message.username,
                                  content: message.content
                                });
                              }}
                              title="Responder"
                            >
                              <Reply className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                          {currentUserId && (
                            <>
                              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 text-muted-foreground hover:text-green-400" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReaction(message.id, 'like');
                                  }}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 text-muted-foreground hover:text-red-400" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onReaction(message.id, 'dislike');
                                  }}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </Button>
                              </motion.div>
                            </>
                          )}
                        </motion.div>
                      )}

                      {/* ⚡ REACCIONES: Mostrar contadores de likes/dislikes */}
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        {message.reactions?.like > 0 && (
                          <motion.div
                            className="flex items-center gap-0.5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <ThumbsUp className="w-2.5 h-2.5 text-green-400" />
                            <motion.span
                              key={message.reactions.like}
                              initial={{ scale: 1.5 }}
                              animate={{ scale: 1 }}
                            >
                              {message.reactions.like}
                            </motion.span>
                          </motion.div>
                        )}
                        {message.reactions?.dislike > 0 && (
                          <motion.div
                            className="flex items-center gap-0.5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <ThumbsDown className="w-2.5 h-2.5 text-red-400" />
                            <motion.span
                              key={message.reactions.dislike}
                              initial={{ scale: 1.5 }}
                              animate={{ scale: 1 }}
                            >
                              {message.reactions.dislike}
                            </motion.span>
                          </motion.div>
                        )}
                      </div>

                      {!isOwn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReport({ type: 'message', id: message.id, username: message.username });
                          }}
                          className="mt-0.5 h-5 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/message:opacity-100 transition-opacity px-1"
                        >
                          <Flag className="w-2.5 h-2.5 mr-0.5" />
                          Reportar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </React.Fragment>
        );
      }).flat()}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
