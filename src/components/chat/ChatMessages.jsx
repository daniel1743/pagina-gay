import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ChatMessages = ({ messages, currentUserId, onUserClick, onReport, onPrivateChat, onReaction, messagesEndRef }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };
  
  const { user: authUser } = useAuth();

  const findUserPremiumStatus = (userId) => {
    if (authUser.id === userId) return authUser.isPremium;
    const userMessage = messages.find(m => m.userId === userId);
    if(userMessage && userMessage.isPremium) return true;
    return false; 
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

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
      {messages.map((message) => {
        const isOwn = message.userId === currentUserId;
        const isSystem = message.userId === 'system';
        const isUserPremium = findUserPremiumStatus(message.userId);

        if (isSystem) {
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <div className="text-center text-xs text-muted-foreground bg-card px-3 py-1 rounded-full">
                {message.content}
              </div>
            </motion.div>
          )
        }

        return (
          <motion.div
            key={message.id}
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
              className={`rounded-full ${isUserPremium ? 'premium-avatar-ring' : ''}`}
              onClick={() => onUserClick({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
                <Avatar
                  className="w-8 h-8 cursor-pointer flex-shrink-0"
                >
                  <AvatarImage src={message.avatar} alt={message.username} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {message.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </motion.div>

            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0`}>
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                  {message.username}
                  {isUserPremium && <CheckCircle className="w-2.5 h-2.5 text-cyan-400" />}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  {formatTime(message.timestamp)}
                  {isOwn && (
                    message.read ? (
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <Check className="w-3 h-3 text-muted-foreground" />
                    )
                  )}
                </span>
              </div>

              <motion.div
                style={isOwn ? getBubbleStyle() : {}}
                className={`relative rounded-xl px-3 py-2 w-full break-words text-sm leading-relaxed ${isOwn ? 'magenta-gradient text-white' : 'bg-secondary text-foreground border border-border'} ${!isOwn ? 'group-hover:border-cyan-400 border-2 transition-all duration-200' : ''}`}
                whileHover={!isOwn ? { scale: 1.01, borderColor: 'rgb(34, 211, 238)' } : {}}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div
                  className="cursor-pointer break-words overflow-wrap-anywhere"
                  onClick={() => onPrivateChat({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
                >
                  {message.type === 'text' && (
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  {message.type === 'gif' && (
                    <img src={message.content} alt="GIF" className="rounded-lg max-w-xs" />
                  )}
                </div>

                {!isOwn && (
                  <motion.div
                    className="absolute -bottom-3 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ y: 5 }}
                    whileHover={{ y: 0 }}
                  >
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
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;