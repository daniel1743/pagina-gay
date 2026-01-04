import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle, Check, CheckCheck, Reply, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';

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
                className="relative rounded-2xl px-3 py-2 w-full break-words shadow-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-300 dark:border-purple-700"
                whileHover={{ scale: 1.005 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* Botón de cerrar (X) */}
                <button
                  onClick={handleClose}
                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                  aria-label="Cerrar mensaje del moderador"
                >
                  <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Nombre del moderador */}
                <div className="flex items-center gap-1 mb-1 pr-6">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    {message.username}
                  </span>
                </div>

                {/* Contenido del mensaje */}
                <div className="text-sm text-foreground whitespace-pre-line">
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

const ChatMessages = ({ messages, currentUserId, onUserClick, onReport, onPrivateChat, onReaction, messagesEndRef, messagesContainerRef, newMessagesIndicator, onScroll, onReply, lastReadMessageIndex = -1 }) => {
  // 📱 Sistema de doble check dinámico (like WhatsApp)
  const [messageChecks, setMessageChecks] = useState({});
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
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
    // This is a placeholder. A real implementation would have more complex logic.
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

  return (
    <div
      ref={messagesContainerRef}
      role="log"
      aria-live="polite"
      aria-label="Área de mensajes del chat"
      className="flex-1 overflow-y-auto px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 scrollbar-hide relative"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onScroll={onScroll}
    >
      {newMessagesIndicator}
      {messages.map((message, index) => {
        const isOwn = message.userId === currentUserId;
        const isSystem = message.userId === 'system';
        const isModerator = message.userId === 'system_moderator';
        const isUserPremium = findUserPremiumStatus(message.userId);
        const isUserVerified = findUserVerifiedStatus(message.userId);
        const userRole = findUserRole(message.userId);
        const isHighlighted = highlightedMessageId === message.id;

        // 📍 Mostrar divider "Mensajes nuevos" antes del primer mensaje no leído
        const showDivider = lastReadMessageIndex >= 0 && index === lastReadMessageIndex + 1;

        // 👮 Mensaje del moderador con temporizador y botón de cerrar
        if (isModerator) {
          return (
            <ModeratorWelcomeMessage
              key={message.id}
              message={message}
              showDivider={showDivider}
            />
          );
        }

        if (isSystem) {
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
          )
        }

        return (
          <React.Fragment key={message.id}>
            {showDivider && <NewMessagesDivider show={true} />}
          <motion.div
            key={message.id}
            data-message-id={message.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.3,
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
            className={`flex gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <motion.div
              className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex-shrink-0 ${
                userRole === 'admin'
                  ? 'admin-avatar-ring'
                  : isUserVerified
                    ? 'verified-avatar-ring'
                    : isUserPremium
                      ? 'premium-avatar-ring'
                      : ''
              }`}
              onClick={() => onUserClick({
                username: message.username,
                avatar: message.avatar,
                userId: message.userId,
                isPremium: isUserPremium,
                verified: isUserVerified,
                role: userRole
              })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
                <Avatar className="w-full h-full cursor-pointer rounded-full overflow-hidden">
                  <AvatarImage src={message.avatar} alt={message.username} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-xs rounded-full">
                    {message.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </motion.div>

            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%] md:max-w-[60%] min-w-0`}>
              <motion.div
                style={isOwn ? getBubbleStyle() : {}}
                className={`relative rounded-2xl px-2.5 py-1.5 w-full break-words shadow-sm ${
                  isOwn
                    ? 'bg-[#0084ff] text-white'
                    : 'bg-[#f0f0f0] dark:bg-[#3e4042] text-foreground'
                } ${isHighlighted ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-background' : ''}`}
                whileHover={!isOwn ? { scale: 1.005 } : {}}
                transition={{ type: 'spring', stiffness: 400 }}
                animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
              >
                {/* Nombre del usuario DENTRO de la burbuja (solo si NO es propio) */}
                {!isOwn && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-semibold text-[#0084ff] dark:text-cyan-400 flex items-center gap-1">
                      {message.username}
                      {(isUserPremium || userRole === 'admin') && (
                        <CheckCircle className="w-3 h-3 text-[#FFD700]" />
                      )}
                      {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                        <CheckCircle className="w-3 h-3 text-[#1DA1F2]" />
                      )}
                    </span>
                  </div>
                )}

                {/* 💬 QUOTE: Mostrar mensaje citado si existe */}
                {message.replyTo && (
                  <MessageQuote
                    replyTo={message.replyTo}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}

                {/* Contenido del mensaje */}
                <div
                  className="cursor-pointer break-words overflow-wrap-anywhere"
                  onClick={() => onPrivateChat({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
                >
                  {message.type === 'text' && (
                    <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-words font-normal">{message.content}</p>
                  )}
                  {message.type === 'gif' && (
                    <img src={message.content} alt="GIF" className="rounded-lg max-w-full sm:max-w-xs" />
                  )}
                </div>

                {/* Hora DENTRO de la burbuja (abajo derecha) */}
                <div className={`flex items-center gap-1 justify-end mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  {!message.userId.startsWith('bot_') && !message.userId.startsWith('static_bot_') && (
                    <span className="text-[11px]">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>

                {!isOwn && (
                  <motion.div
                    className="absolute -bottom-3 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ y: 5 }}
                    whileHover={{ y: 0 }}
                  >
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-muted-foreground hover:text-cyan-400"
                        onClick={() => onReply?.({
                          messageId: message.id,
                          username: message.username,
                          content: message.content
                        })}
                        title="Responder"
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-green-400" onClick={() => onReaction(message.id, 'like')}>
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-red-400" onClick={() => onReaction(message.id, 'dislike')}>
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>

              {/* ⚡ CHECKS FUERA DE LA BURBUJA: Debajo de la burbuja (solo para mensajes propios) */}
              {isOwn && (
                <div className={`flex items-center justify-end mt-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex items-center gap-0.5">
                    {messageChecks[message.id] === 'double' ? (
                      <CheckCheck className="w-3 h-3 text-[#0084ff] dark:text-cyan-400" />
                    ) : messageChecks[message.id] === 'single' ? (
                      <Check className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
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
                  onClick={() => onReport({ type: 'message', id: message.id, username: message.username })}
                  className="mt-0.5 h-5 text-[10px] text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                >
                  <Flag className="w-2.5 h-2.5 mr-0.5" />
                  Reportar
                </Button>
              )}
            </div>
          </motion.div>
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;