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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`rounded-full ${isUserPremium ? 'premium-avatar-ring' : ''}`}
              onClick={() => onUserClick({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
            >
                <Avatar
                  className="w-8 h-8 cursor-pointer flex-shrink-0"
                >
                  <AvatarImage src={message.avatar} alt={message.username} />
                  <AvatarFallback className="bg-secondary text-xs">
                    {message.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>

            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%] min-w-0`}>
              <div className="flex items-center gap-1.5 mb-0.5">
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

              <div
                style={isOwn ? getBubbleStyle() : {}}
                className={`relative chat-bubble ${isOwn ? 'magenta-gradient text-white' : 'bg-secondary text-foreground'}`}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => onPrivateChat({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
                >
                  {message.type === 'text' && (
                    <p>{message.content}</p>
                  )}
                  {message.type === 'gif' && (
                    <img src={message.content} alt="GIF" className="rounded-lg max-w-xs" />
                  )}
                </div>
                
                {!isOwn && (
                  <div className="absolute -bottom-3 right-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-green-400" onClick={() => onReaction(message.id, 'like')}>
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-red-400" onClick={() => onReaction(message.id, 'dislike')}>
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                {message.reactions?.like > 0 && (
                  <div className="flex items-center gap-0.5">
                    <ThumbsUp className="w-2.5 h-2.5 text-green-400" />
                    <span>{message.reactions.like}</span>
                  </div>
                )}
                {message.reactions?.dislike > 0 && (
                  <div className="flex items-center gap-0.5">
                    <ThumbsDown className="w-2.5 h-2.5 text-red-400" />
                    <span>{message.reactions.dislike}</span>
                  </div>
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