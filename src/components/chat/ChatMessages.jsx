import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle, Check, CheckCheck, Reply } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MessageQuote from './MessageQuote';
import NewMessagesDivider from './NewMessagesDivider';

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

        // Después de 2 segundos, cambiar a 2 checks azules
        const timeoutId = setTimeout(() => {
          setMessageChecks(prev => ({ ...prev, [message.id]: 'double' }));
        }, 2000);

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
      className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-2 scrollbar-hide relative" 
      style={{ WebkitOverflowScrolling: 'touch' }} 
      onScroll={onScroll}
    >
      {newMessagesIndicator}
      {messages.map((message, index) => {
        const isOwn = message.userId === currentUserId;
        const isSystem = message.userId === 'system';
        const isUserPremium = findUserPremiumStatus(message.userId);
        const isUserVerified = findUserVerifiedStatus(message.userId);
        const userRole = findUserRole(message.userId);
        const isHighlighted = highlightedMessageId === message.id;

        // 📍 Mostrar divider "Mensajes nuevos" antes del primer mensaje no leído
        const showDivider = lastReadMessageIndex >= 0 && index === lastReadMessageIndex + 1;

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
            className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <motion.div
              className={`w-10 h-10 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
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
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
                <Avatar className="w-full h-full cursor-pointer rounded-full overflow-hidden">
                  <AvatarImage src={message.avatar} alt={message.username} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-xs rounded-full">
                    {message.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </motion.div>

            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[75%] md:max-w-[65%] min-w-0`}>
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-xs sm:text-[10px] font-semibold text-foreground flex items-center gap-1">
                  {message.username}
                  {(isUserPremium || userRole === 'admin') && (
                    <CheckCircle className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-[#FFD700]" />
                  )}
                  {isUserVerified && !isUserPremium && userRole !== 'admin' && (
                    <CheckCircle className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-[#1DA1F2]" />
                  )}
                </span>
                {/* Ocultar hora para bots (incluyendo bots estáticos) */}
                {!message.userId.startsWith('bot_') && !message.userId.startsWith('static_bot_') && (
                  <span className="text-xs sm:text-[10px] text-muted-foreground flex items-center gap-0.5">
                    {formatTime(message.timestamp)}
                    {isOwn && (
                      messageChecks[message.id] === 'double' ? (
                        <CheckCheck className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-blue-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-muted-foreground" />
                      )
                    )}
                  </span>
                )}
                {/* Para bots, solo mostrar check si es propio */}
                {message.userId.startsWith('bot_') && isOwn && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    {messageChecks[message.id] === 'double' ? (
                      <CheckCheck className="w-3 h-3 text-blue-400" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground" />
                    )}
                  </span>
                )}
              </div>

              <motion.div
                style={isOwn ? getBubbleStyle() : {}}
                className={`relative rounded-xl px-3.5 sm:px-3 py-2.5 sm:py-2 w-full break-words text-base sm:text-sm leading-relaxed ${isOwn ? 'magenta-gradient text-white' : 'bg-secondary text-foreground border border-border'} ${!isOwn ? 'group-hover:border-cyan-400 border-2 transition-all duration-200' : ''} ${isHighlighted ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-background' : ''}`}
                whileHover={!isOwn ? { scale: 1.01, borderColor: 'rgb(34, 211, 238)' } : {}}
                transition={{ type: 'spring', stiffness: 400 }}
                animate={isHighlighted ? { scale: [1, 1.02, 1] } : {}}
              >
                {/* 💬 QUOTE: Mostrar mensaje citado si existe */}
                {message.replyTo && (
                  <MessageQuote
                    replyTo={message.replyTo}
                    onJumpToMessage={handleJumpToMessage}
                  />
                )}

                <div
                  className="cursor-pointer break-words overflow-wrap-anywhere min-h-[44px] flex items-center"
                  onClick={() => onPrivateChat({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
                >
                  {message.type === 'text' && (
                    <p className="text-base sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  {message.type === 'gif' && (
                    <img src={message.content} alt="GIF" className="rounded-lg max-w-full sm:max-w-xs" />
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