import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ThumbsUp, Clock } from 'lucide-react';

const ForumThread = ({ thread, index, onClick }) => {
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    return 'hace un momento';
  };

  const categoryColors = {
    'Apoyo Emocional': 'bg-cyan-500/20 text-cyan-400',
    'Recursos': 'bg-purple-500/20 text-purple-400',
    'Experiencias': 'bg-yellow-500/20 text-yellow-400',
    'Preguntas': 'bg-green-500/20 text-green-400',
    'Logros': 'bg-pink-500/20 text-pink-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="glass-effect rounded-xl p-5 cursor-pointer hover:border-cyan-400 transition-all border group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[thread.category] || 'bg-gray-500/20 text-gray-400'}`}>
              {thread.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(thread.timestamp)}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-cyan-400 transition-colors">
            {thread.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {thread.content}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {thread.replies} respuestas
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              {thread.likes} votos
            </span>
            <span className="text-muted-foreground">
              por {thread.author}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ForumThread;
