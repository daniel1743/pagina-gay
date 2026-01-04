import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, ThumbsUp, Users, UserPlus, Sparkles } from 'lucide-react';

const messages = [
  { id: 1, user: 'Alex', text: 'Quiero coger 🔥', color: 'text-cyan-400', avatar: '👤', isOwn: false },
  { id: 2, user: 'Bruno', text: 'Tu perfil está que arde 😈', color: 'text-purple-400', avatar: '👤', isOwn: true },
  { id: 3, user: 'Dani', text: '¿Dónde estás? Estoy caliente 🥵', color: 'text-pink-400', avatar: '👤', isOwn: false },
  { id: 4, user: 'Lucas', text: '¡Qué rico! Quedemos esta noche 😏', color: 'text-green-400', avatar: '👤', isOwn: true },
  { id: 5, user: 'Mati', text: 'Hagamos algo ya 🔥💦', color: 'text-yellow-400', avatar: '👤', isOwn: false },
  { id: 6, user: 'Carlos', text: 'Estoy solo y caliente 😈', color: 'text-blue-400', avatar: '👤', isOwn: true },
  { id: 7, user: 'Pedro', text: 'Tu culo está delicioso 🍑🔥', color: 'text-red-400', avatar: '👤', isOwn: false },
  { id: 8, user: 'Juan', text: 'Vamos a follar esta noche 💦', color: 'text-indigo-400', avatar: '👤', isOwn: true },
  { id: 9, user: 'Sergio', text: 'Estoy duro y listo 😏', color: 'text-orange-400', avatar: '👤', isOwn: false },
  { id: 10, user: 'Miguel', text: 'Quiero chuparte todo 🍆💦', color: 'text-teal-400', avatar: '👤', isOwn: true },
];

const emojiReactions = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😈', name: 'devil' },
  { emoji: '💦', name: 'droplet' },
  { emoji: '🍆', name: 'eggplant' },
  { emoji: '🍑', name: 'peach' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '🥵', name: 'hot' },
];

const ChatDemo = ({ onJoinClick }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [privateChatBubbles, setPrivateChatBubbles] = useState([]);
  const [groupBubbles, setGroupBubbles] = useState([]);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [individualProfiles, setIndividualProfiles] = useState([]);
  const messageIndexRef = useRef(0);
  const reactionIdRef = useRef(0);
  const profileIdRef = useRef(0);
  const emojiIdRef = useRef(0);

  // ⚡ Mensajes más rápidos - cada 1.2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        const next = [...prev, { ...messages[messageIndexRef.current], timestamp: Date.now() }];
        if (next.length > 5) next.shift(); // Menos mensajes visibles para más velocidad
        messageIndexRef.current = (messageIndexRef.current + 1) % messages.length;
        return next;
      });
    }, 1200); // Más rápido: 1.2 segundos

    return () => clearInterval(interval);
  }, []);

  // 💖 Emojis flotantes tipo TikTok/Instagram - MUY frecuentes
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      if (visibleMessages.length > 0 && Math.random() > 0.2) { // 80% probabilidad
        const randomMessage = visibleMessages[Math.floor(Math.random() * visibleMessages.length)];
        const emojiCount = Math.floor(Math.random() * 4) + 3; // 3-6 emojis
        
        const newEmojis = [];
        for (let i = 0; i < emojiCount; i++) {
          const randomEmoji = emojiReactions[Math.floor(Math.random() * emojiReactions.length)];
          newEmojis.push({
            id: emojiIdRef.current++,
            messageId: randomMessage.id,
            emoji: randomEmoji.emoji,
            x: (Math.random() * 60 + 20) + '%',
            startY: '100%',
            delay: i * 100,
            timestamp: Date.now(),
          });
        }
        setFloatingEmojis((prev) => [...prev, ...newEmojis].slice(-40)); // Más emojis
      }
    }, 1500); // Cada 1.5 segundos - MUY frecuente

    return () => clearInterval(emojiInterval);
  }, [visibleMessages]);

  // Limpiar emojis antiguos
  useEffect(() => {
    const emojiCleanup = setInterval(() => {
      setFloatingEmojis((prev) => prev.filter((e) => Date.now() - e.timestamp < 2500));
    }, 800);
    return () => clearInterval(emojiCleanup);
  }, []);

  // 👤 Perfiles individuales - MÁS RÁPIDOS
  useEffect(() => {
    const profileInterval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% probabilidad
        const names = ['Juan', 'Pedro', 'Alex', 'Bruno', 'Dani', 'Lucas', 'Mati', 'Carlos', 'Sergio', 'Miguel'];
        const side = Math.random() > 0.5 ? 'left' : 'right';
        
        setIndividualProfiles((prev) => [
          ...prev,
          {
            id: profileIdRef.current++,
            name: names[Math.floor(Math.random() * names.length)],
            side,
            x: side === 'left' ? Math.random() * 20 + 5 : Math.random() * 20 + 75,
            y: Math.random() * 70 + 15,
            timestamp: Date.now(),
          },
        ].slice(-10)); // Más perfiles
      }
    }, 1500); // Cada 1.5 segundos - MÁS RÁPIDO

    return () => clearInterval(profileInterval);
  }, []);

  // 👥 Grupos - MÁS RÁPIDOS
  useEffect(() => {
    const groupInterval = setInterval(() => {
      if (Math.random() > 0.5 && individualProfiles.length >= 3) { // 50% probabilidad
        const profilesToGroup = individualProfiles
          .slice()
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(5, Math.floor(Math.random() * 3) + 3));

        if (profilesToGroup.length >= 3) {
          const names = profilesToGroup.map(p => p.name).join(', ');
          const avgX = profilesToGroup.reduce((sum, p) => sum + p.x, 0) / profilesToGroup.length;
          const avgY = profilesToGroup.reduce((sum, p) => sum + p.y, 0) / profilesToGroup.length;

          setIndividualProfiles((prev) => 
            prev.filter(p => !profilesToGroup.some(gp => gp.id === p.id))
          );

          setGroupBubbles((prev) => [
            ...prev,
            {
              id: Date.now(),
              names,
              count: profilesToGroup.length,
              x: avgX,
              y: avgY,
              timestamp: Date.now(),
            },
          ].slice(-4)); // Más grupos
        }
      }
    }, 3000); // Cada 3 segundos - MÁS RÁPIDO

    return () => clearInterval(groupInterval);
  }, [individualProfiles]);

  // Limpiar grupos antiguos
  useEffect(() => {
    const groupCleanup = setInterval(() => {
      setGroupBubbles((prev) => prev.filter((g) => Date.now() - g.timestamp < 5000));
    }, 1500);
    return () => clearInterval(groupCleanup);
  }, []);

  // 💬 Burbujas de chat privado - MÁS RÁPIDAS
  useEffect(() => {
    const privateChatInterval = setInterval(() => {
      if (Math.random() > 0.4) { // 60% probabilidad
        const users = ['Juan', 'Pedro', 'Alex', 'Bruno', 'Dani', 'Lucas', 'Mati', 'Carlos'];
        const user1 = users[Math.floor(Math.random() * users.length)];
        let user2 = users[Math.floor(Math.random() * users.length)];
        while (user2 === user1) {
          user2 = users[Math.floor(Math.random() * users.length)];
        }

        setPrivateChatBubbles((prev) => [
          ...prev,
          {
            id: Date.now(),
            user1,
            user2,
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            timestamp: Date.now(),
          },
        ].slice(-4)); // Más burbujas
      }
    }, 2500); // Cada 2.5 segundos - MÁS RÁPIDO

    return () => clearInterval(privateChatInterval);
  }, []);

  // Limpiar burbujas de chat privado
  useEffect(() => {
    const privateCleanup = setInterval(() => {
      setPrivateChatBubbles((prev) => prev.filter((b) => Date.now() - b.timestamp < 4000));
    }, 1500);
    return () => clearInterval(privateCleanup);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border-2 border-purple-500/30 overflow-hidden shadow-2xl relative"
        style={{
          boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3), 0 0 100px rgba(139, 92, 246, 0.1)',
        }}
      >
        {/* Header con animación de pulso */}
        <div className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 px-6 py-4 flex items-center justify-between border-b border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
            />
            <span className="text-sm font-bold text-gray-200">En vivo ahora</span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs text-gray-400"
            >
              • 24 activos
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold text-purple-300">Global</span>
          </div>
        </div>

        {/* Área de chat con gradiente y animaciones */}
        <div className="relative h-96 sm:h-[500px] md:h-[600px] p-6 overflow-hidden">
          {/* Gradiente de fondo animado */}
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Overlay de gradiente superior */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10 pointer-events-none" />

          {/* Mensajes - Alternados izquierda/derecha */}
          <div className="relative z-20 h-full flex flex-col justify-end space-y-2">
            <AnimatePresence mode="popLayout">
              {visibleMessages.map((msg, index) => {
                const isOwn = msg.isOwn;
                return (
                  <motion.div
                    key={`${msg.id}-${msg.timestamp}`}
                    initial={{ 
                      opacity: 0, 
                      y: 30, 
                      scale: 0.9,
                      x: isOwn ? 50 : -50 
                    }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      x: 0 
                    }}
                    exit={{ 
                      opacity: 0, 
                      y: -20, 
                      scale: 0.9,
                      x: isOwn ? 20 : -20 
                    }}
                    transition={{
                      duration: 0.4, // Más rápido
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className={`flex items-start gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0"
                    >
                      {msg.avatar}
                    </motion.div>
                    <div className={`flex-1 relative ${isOwn ? 'flex justify-end' : ''}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`bg-gray-800/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/10 max-w-[85%] shadow-xl ${
                          isOwn 
                            ? 'rounded-tr-none bg-gradient-to-br from-purple-600/90 to-pink-600/90' 
                            : 'rounded-tl-none'
                        }`}
                      >
                        <span className={`text-xs font-bold ${msg.color} block mb-1`}>
                          {msg.user}
                        </span>
                        <p className={`text-sm leading-relaxed ${isOwn ? 'text-white' : 'text-gray-200'}`}>
                          {msg.text}
                        </p>
                      </motion.div>

                      {/* 💖 Emojis flotantes tipo TikTok/Instagram - salen desde abajo */}
                      <AnimatePresence>
                        {floatingEmojis
                          .filter((e) => e.messageId === msg.id)
                          .map((emoji) => (
                            <motion.div
                              key={emoji.id}
                              initial={{ 
                                opacity: 0, 
                                scale: 0,
                                y: 0,
                                x: 0,
                              }}
                              animate={{ 
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1.4, 1.2, 0.9],
                                y: -140, // Suben más
                                x: (Math.random() - 0.5) * 80, // Más movimiento horizontal
                                rotate: [0, 20, -20, 0], // Más rotación
                              }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 2.2,
                                delay: emoji.delay / 1000,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                              className="absolute bottom-0 text-2xl"
                              style={{ 
                                left: emoji.x,
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                              }}
                            >
                              {emoji.emoji}
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* 👤 Perfiles individuales en los lados - MÁS RÁPIDOS */}
          <AnimatePresence>
            {individualProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0, x: profile.side === 'left' ? -50 : 50 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0,
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0,
                  x: profile.side === 'left' ? -50 : 50,
                }}
                transition={{ duration: 0.4, type: 'spring' }} // Más rápido
                className="absolute z-30 pointer-events-none"
                style={{ left: `${profile.x}%`, top: `${profile.y}%` }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -5, 0],
                    rotate: [0, 2, -2, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-gradient-to-br from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border border-white/20 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                    {profile.name[0]}
                  </div>
                  <span className="text-xs font-bold text-white">{profile.name}</span>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 👥 Burbujas de grupo - MÁS RÁPIDAS */}
          <AnimatePresence>
            {groupBubbles.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, scale: 0, x: group.x + '%', y: group.y + '%' }}
                animate={{
                  opacity: [0, 1, 1],
                  scale: [0, 1.2, 1],
                  x: group.x + '%',
                  y: group.y + '%',
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }} // Más rápido
                className="absolute z-40 pointer-events-none"
                style={{ left: `${group.x}%`, top: `${group.y}%` }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-br from-pink-500/95 to-purple-500/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-2xl border-2 border-yellow-400/60 flex items-center gap-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <Users className="w-5 h-5 text-white" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">
                      {group.count === 5 
                        ? 'Cinco personas han creado un grupo'
                        : `${group.names} han creado un grupo`}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 💬 Burbujas de chat privado - MÁS RÁPIDAS */}
          <AnimatePresence>
            {privateChatBubbles.map((bubble) => (
              <motion.div
                key={bubble.id}
                initial={{ opacity: 0, scale: 0, x: bubble.x + '%', y: bubble.y + '%' }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.8],
                  x: [bubble.x + '%', (bubble.x + 5) + '%', (bubble.x - 5) + '%', bubble.x + '%'],
                  y: [bubble.y + '%', (bubble.y - 10) + '%', (bubble.y + 10) + '%', bubble.y + '%'],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 3, ease: 'easeInOut' }} // Más rápido
                className="absolute z-30 pointer-events-none"
                style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="bg-gradient-to-br from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border border-white/20 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold text-white">
                    {bubble.user1} + {bubble.user2}
                  </span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <UserPlus className="w-3 h-3 text-green-300" />
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Botón de unirse - Más grande y animado */}
        <div className="p-6 bg-gradient-to-r from-gray-800/80 via-gray-900/80 to-gray-800/80 border-t border-purple-500/20 backdrop-blur-sm">
          <motion.button
            onClick={onJoinClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white text-base sm:text-lg font-extrabold py-4 sm:py-5 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden"
            style={{
              backgroundSize: '200% 200%',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)',
            }}
          >
            {/* Efecto de brillo animado */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform relative z-10" />
            <span className="relative z-10">Unirse a la conversación</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative z-10"
            >
              →
            </motion.div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatDemo;
