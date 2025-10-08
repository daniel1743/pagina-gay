import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
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
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <div className="text-center text-sm text-muted-foreground bg-card px-4 py-2 rounded-full">
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
            transition={{ duration: 0.3 }}
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div 
              className={`rounded-full ${isUserPremium ? 'premium-avatar-ring' : ''}`}
              onClick={() => onUserClick({ username: message.username, avatar: message.avatar, userId: message.userId, isPremium: isUserPremium })}
            >
                <Avatar
                  className="w-10 h-10 cursor-pointer"
                >
                  <AvatarImage src={message.avatar} alt={message.username} />
                  <AvatarFallback className="bg-secondary">
                    {message.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
            </div>

            <div className={`group flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  {message.username}
                  {isUserPremium && <CheckCircle className="w-3 h-3 text-cyan-400" />}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.timestamp)}
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
                  <div className="absolute -bottom-4 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-green-400" onClick={() => onReaction(message.id, 'like')}>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => onReaction(message.id, 'dislike')}>
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {message.reactions?.like > 0 && (
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-green-400" />
                    <span>{message.reactions.like}</span>
                  </div>
                )}
                {message.reactions?.dislike > 0 && (
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="w-3 h-3 text-red-400" />
                    <span>{message.reactions.dislike}</span>
                  </div>
                )}
              </div>

              {!isOwn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReport({ type: 'message', id: message.id, username: message.username })}
                  className="mt-1 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Flag className="w-3 h-3 mr-1" />
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