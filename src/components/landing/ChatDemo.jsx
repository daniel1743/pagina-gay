import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const messages = [
  { id: 1, user: 'Alex', text: '¿Alguien para salir hoy?', color: 'text-cyan-400' },
  { id: 2, user: 'Bruno', text: 'Yo me animo, ¿dónde?', color: 'text-purple-400' },
  { id: 3, user: 'Dani', text: 'Vayan a Bellavista, está prendido 🔥', color: 'text-pink-400' },
  { id: 4, user: 'Lucas', text: 'Busco gente para LoL 🎮', color: 'text-green-400' },
  { id: 5, user: 'Mati', text: 'Hola a todos 👋', color: 'text-yellow-400' },
];

const ChatDemo = ({ onJoinClick }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        const next = [...prev, messages[currentIndex]];
        if (next.length > 4) next.shift();
        return next;
      });
      currentIndex = (currentIndex + 1) % messages.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-gray-900/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-300">En vivo ahora</span>
        </div>
        <span className="text-xs text-gray-500">Global</span>
      </div>

      <div className="p-4 h-64 flex flex-col justify-end space-y-3 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 pointer-events-none"></div>
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((msg) => (
            <motion.div
              key={`${msg.id}-${Date.now()}`}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-start"
            >
              <div className="bg-gray-800/80 px-3 py-2 rounded-lg rounded-tl-none border border-white/5 max-w-[90%] shadow-lg">
                <span className={`text-xs font-bold ${msg.color} block mb-0.5`}>
                  {msg.user}
                </span>
                <p className="text-sm text-gray-200">{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-gray-800/50 border-t border-white/5">
        <button
          onClick={onJoinClick}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          Unirse a la conversación
        </button>
      </div>
    </div>
  );
};

export default ChatDemo;
