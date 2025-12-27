import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mensajes demo pre-generados (calientes pero no explícitos, conversaciones reales)
// align: 'left' o 'right' para alternar lados como conversación real
const DEMO_MESSAGES = [
  { id: 1, username: 'Mateo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo-ai', content: 'q onda cabros toy aburrio 😈', align: 'left' },
  { id: 2, username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai', content: 'toi caliente wn alguien activo', align: 'right' },
  { id: 3, username: 'Simon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai', content: 'upa vale que rico 🔥', align: 'left' },
  { id: 4, username: 'Vale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai', content: 'jajaja gracias amigui 😏', align: 'right' },
  { id: 5, username: 'Bruno', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno-ai', content: 'hace calor aca o soy yo', align: 'left' },
  { id: 6, username: 'Luka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai', content: 'hmmm que delisioso 😈', align: 'right' },
  { id: 7, username: 'Mateo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo-ai', content: 'epa de donde eri?', align: 'left' },
  { id: 8, username: 'Luka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai', content: 'de stgo centro wn', align: 'right' },
  { id: 9, username: 'Emilio', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai', content: 'anoche me paso algo malo', align: 'left' },
  { id: 10, username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai', content: 'cuenta mas mrc 👀', align: 'right' },
  { id: 11, username: 'Emilio', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai', content: 'conoci un wn en grindr y coasa asi', align: 'left' },
  { id: 12, username: 'Rafa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai', content: 'tas interesante emilio 🔥', align: 'right' },
  { id: 13, username: 'Vale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai', content: 'toi caliente tmb wn ajaja 😈', align: 'left' },
  { id: 14, username: 'Milo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=milo-ai', content: 'q onda con los plans nocturnos', align: 'right' },
  { id: 15, username: 'Simon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai', content: 'hay alguien interesante por aca 😏', align: 'left' },
  { id: 16, username: 'Bruno', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno-ai', content: 'toy con ganas de conocer gente', align: 'right' },
  { id: 17, username: 'Luka', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luka-ai', content: 'siiii yo tmb kajsksj', align: 'left' },
  { id: 18, username: 'Mateo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo-ai', content: 'tienes buena pinta bruno 👀', align: 'right' },
  { id: 19, username: 'Bruno', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bruno-ai', content: 'tu tmb amigui 😈', align: 'left' },
  { id: 20, username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nico-ai', content: 'alguien xa salir este finde', align: 'right' },
  { id: 21, username: 'Vale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vale-ai', content: 'toy buscando algo interesante 🔥', align: 'left' },
  { id: 22, username: 'Emilio', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emilio-ai', content: 'toi aburrio y caliente wn 😈', align: 'right' },
  { id: 23, username: 'Rafa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafa-ai', content: 'me gusta la gente directa 👀', align: 'left' },
  { id: 24, username: 'Milo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=milo-ai', content: 'alguien activo xa chatear', align: 'right' },
  { id: 25, username: 'Simon', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=simon-ai', content: 'q tal la semana cabros', align: 'left' },
];

// Reacciones posibles para los mensajes (estilo Facebook)
const REACTIONS = ['❤️', '🔥', '😈', '👀', '💘', '😏'];

// Notificaciones animadas tipo Instagram Live/TikTok
const NOTIFICATIONS = [
  { type: 'match', text: 'Mateo y Bruno hicieron match', icon: '💘' },
  { type: 'match', text: 'Nico y Vale hicieron match', icon: '💘' },
  { type: 'match', text: 'Simon y Luka hicieron match', icon: '💘' },
  { type: 'reaction', text: 'Rafa reaccionó', icon: '🔥' },
  { type: 'reaction', text: 'Bruno reaccionó', icon: '😈' },
  { type: 'reaction', text: 'Vale reaccionó', icon: '🔥' },
  { type: 'reaction', text: 'Mateo reaccionó', icon: '😈' },
  { type: 'heart', text: 'Emilio envió ❤️', icon: '❤️' },
  { type: 'heart', text: 'Luka envió ❤️', icon: '❤️' },
  { type: 'fire', text: '+3 reacciones 🔥', icon: '🔥' },
  { type: 'devil', text: '+2 reacciones 😈', icon: '😈' },
  { type: 'eyes', text: 'Milo está mirando tu perfil', icon: '👀' },
  { type: 'eyes', text: 'Nico está mirando tu perfil', icon: '👀' },
];

const ChatDemo = ({ onJoinClick }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [currentNotification, setCurrentNotification] = useState(null);
  const [messageReactions, setMessageReactions] = useState({}); // {uniqueKey: 'emoji'}
  const messagesEndRef = useRef(null);
  const currentMessageIndex = useRef(0);
  const messageKeyCounter = useRef(0); // Contador único para keys

  const scrollToBottom = () => {
    // Solo hacer scroll dentro del contenedor, no en toda la página
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest', // No hacer scroll en la página entera
      inline: 'nearest'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages]);

  useEffect(() => {
    // Mostrar mensajes iniciales con keys únicas
    const initialMessages = DEMO_MESSAGES.slice(0, 3).map(msg => ({
      ...msg,
      uniqueKey: `msg-${messageKeyCounter.current++}`
    }));
    setVisibleMessages(initialMessages);
    currentMessageIndex.current = 3;

    // Función para agregar siguiente mensaje
    const addNextMessage = () => {
      if (currentMessageIndex.current >= DEMO_MESSAGES.length) {
        currentMessageIndex.current = 3; // Reiniciar desde el mensaje 4
      }

      const nextMessage = DEMO_MESSAGES[currentMessageIndex.current];

      // Mostrar indicador de escritura
      setIsTyping(true);
      setTypingUser(nextMessage.username);

      setTimeout(() => {
        setIsTyping(false);
        const uniqueKey = `msg-${messageKeyCounter.current++}`;

        setVisibleMessages(prev => {
          // Agregar mensaje con key única
          const messageWithUniqueKey = {
            ...nextMessage,
            uniqueKey
          };
          const newMessages = [...prev, messageWithUniqueKey];
          // Mantener solo últimos 10 mensajes visibles
          return newMessages.slice(-10);
        });

        // 50% probabilidad de que el mensaje reciba una reacción después de 1-2 segundos
        if (Math.random() < 0.5) {
          setTimeout(() => {
            const randomReaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
            setMessageReactions(prev => ({
              ...prev,
              [uniqueKey]: randomReaction
            }));
          }, 1000 + Math.random() * 1000);
        }

        currentMessageIndex.current++;
      }, 1000); // Escribiendo por 1 segundo (más rápido)
    };

    // Agregar nuevo mensaje cada 2-4 segundos (más rápido para demo dinámico)
    const interval = setInterval(() => {
      addNextMessage();
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar notificaciones animadas cada 2-3 segundos
  useEffect(() => {
    const showNotification = () => {
      const randomNotif = NOTIFICATIONS[Math.floor(Math.random() * NOTIFICATIONS.length)];
      setCurrentNotification(randomNotif);

      // Ocultar después de 3 segundos
      setTimeout(() => {
        setCurrentNotification(null);
      }, 3000);
    };

    // Primera notificación después de 1 segundo
    const firstTimeout = setTimeout(showNotification, 1000);

    // Notificaciones subsiguientes cada 2-3 segundos (después de que se oculta la anterior)
    const interval = setInterval(() => {
      showNotification();
    }, 5000); // Cada 5 segundos (3s visible + 2s pausa)

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Badge de Vista Previa */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full shadow-lg text-sm font-semibold">
          👁️ Vista Previa del Chat - Solo Lectura
        </div>
      </div>

      {/* Notificaciones Animadas (estilo Instagram Live) */}
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute top-12 right-4 z-20 bg-gradient-to-r from-pink-600/95 to-purple-600/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-pink-400/50"
          >
            <span className="text-2xl">{currentNotification.icon}</span>
            <span className="font-semibold text-sm">{currentNotification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenedor del Chat */}
      <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-800 mt-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-pink-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold">Conversas Libres</span>
            <span className="text-gray-300 text-sm">15 usuarios activos</span>
          </div>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          </div>
        </div>

        {/* Mensajes */}
        <div className="h-96 bg-gray-950 overflow-y-auto p-4 space-y-3 relative">
          <AnimatePresence>
            {visibleMessages.map((message) => {
              const isLeft = message.align === 'left';
              const hasReaction = messageReactions[message.uniqueKey];

              return (
                <motion.div
                  key={message.uniqueKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start space-x-3 ${!isLeft ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <img
                    src={message.avatar}
                    alt={message.username}
                    className="w-10 h-10 rounded-full ring-2 ring-purple-500 flex-shrink-0"
                  />
                  <div className={`flex-1 ${!isLeft ? 'flex flex-col items-end' : ''}`}>
                    <div className={`flex items-center space-x-2 mb-1 ${!isLeft ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <span className="text-purple-400 font-semibold text-sm">
                        {message.username}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="relative inline-block">
                      <div className={`bg-gray-800 rounded-lg px-4 py-2 text-gray-100 ${isLeft ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
                        {message.content}
                      </div>
                      {/* Reacción estilo Facebook */}
                      {hasReaction && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className={`absolute -bottom-2 ${isLeft ? 'left-2' : 'right-2'} bg-white rounded-full px-2 py-1 shadow-lg border border-gray-300`}
                        >
                          <span className="text-lg">{hasReaction}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Indicador de escritura */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 text-gray-400 text-sm"
            >
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{typingUser} está escribiendo...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />

          {/* Overlay de hover con CTA */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoinClick}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg"
            >
              🔥 Únete para participar
            </motion.button>
          </div>
        </div>

        {/* Footer con CTA */}
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              💬 Conversaciones reales • 🔥 Gente activa • 😈 Sin límites
            </div>
            <button
              onClick={onJoinClick}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-full font-semibold transition-all duration-200 shadow-lg"
            >
              Únete Gratis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;
