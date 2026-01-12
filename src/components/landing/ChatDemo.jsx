import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';

/**
 * ✨ LANDING CHAT REDESIGN - Enfoque profesional y limpio
 *
 * PRINCIPIOS DE DISEÑO:
 * 1. Prioridad absoluta al texto de conversación
 * 2. Conversaciones que se leen como reales
 * 3. CERO overlays permanentes sobre burbujas
 * 4. Reacciones flotantes tipo Instagram Live (efímeras, decorativas)
 * 5. Diseño calmado, emocional y profesional
 *
 * ELIMINADO (ruido visual):
 * - Perfiles individuales flotantes
 * - Burbujas de grupos
 * - Burbujas de chat privado
 * - Reacciones estáticas sobre mensajes
 *
 * MANTENIDO (contenido):
 * - Mensajes de texto originales (SIN MODIFICAR)
 * - Avatares y nombres de usuario
 * - Estructura de conversación alternada
 */

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

// Reacciones para emojis flotantes tipo Instagram Live
const emojiReactions = ['❤️', '🔥', '😈', '💦', '🍆', '🍑', '😏', '🥵', '👍'];

const ChatDemo = ({ onJoinClick }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const messageIndexRef = useRef(0);
  const emojiIdRef = useRef(0);
  const chatContainerRef = useRef(null);

  /**
   * ⏱️ ANIMACIÓN DE MENSAJES
   * Muestra mensajes progresivamente cada 1.8 segundos
   * Mantiene máximo 5 mensajes visibles para legibilidad
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages((prev) => {
        const next = [...prev, { ...messages[messageIndexRef.current], timestamp: Date.now() }];
        if (next.length > 5) next.shift();
        messageIndexRef.current = (messageIndexRef.current + 1) % messages.length;
        return next;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  /**
   * 💖 REACCIONES FLOTANTES - Estilo Instagram Live
   *
   * COMPORTAMIENTO:
   * - NO se posicionan sobre la burbuja
   * - Aparecen al lado derecho/izquierdo según el mensaje
   * - Flotan hacia arriba desde la posición del mensaje
   * - Desaparecen después de 1.8 segundos
   * - Movimiento suave con ligero balanceo horizontal
   *
   * DIFERENCIA CLAVE vs. anterior:
   * - Antes: positioned absolute DENTRO de la burbuja
   * - Ahora: positioned absolute en el CONTENEDOR, referenciados por messageId
   */
  useEffect(() => {
    const emojiInterval = setInterval(() => {
      if (visibleMessages.length > 0 && Math.random() > 0.4) {
        const randomMessage = visibleMessages[Math.floor(Math.random() * visibleMessages.length)];
        const emojiCount = Math.floor(Math.random() * 2) + 1; // 1-2 emojis a la vez

        const newEmojis = [];
        for (let i = 0; i < emojiCount; i++) {
          const randomEmoji = emojiReactions[Math.floor(Math.random() * emojiReactions.length)];
          newEmojis.push({
            id: emojiIdRef.current++,
            messageId: randomMessage.id,
            messageTimestamp: randomMessage.timestamp,
            emoji: randomEmoji,
            isOwn: randomMessage.isOwn,
            delay: i * 200,
            horizontalOffset: (Math.random() - 0.5) * 40, // Variación horizontal
            timestamp: Date.now(),
          });
        }
        setFloatingEmojis((prev) => [...prev, ...newEmojis].slice(-15));
      }
    }, 2000);

    return () => clearInterval(emojiInterval);
  }, [visibleMessages]);

  // Limpiar emojis antiguos automáticamente
  useEffect(() => {
    const cleanup = setInterval(() => {
      setFloatingEmojis((prev) => prev.filter((e) => Date.now() - e.timestamp < 2500));
    }, 500);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 rounded-3xl border border-purple-500/20 overflow-hidden shadow-2xl relative"
      >
        {/* Header - Indicador de actividad en vivo */}
        <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 px-6 py-4 flex items-center justify-between border-b border-purple-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
            />
            <span className="text-sm font-semibold text-gray-200">En vivo ahora</span>
            <span className="text-xs text-gray-400">• 24 activos</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Global</span>
          </div>
        </div>

        {/* Área de chat - DISEÑO LIMPIO Y PROFESIONAL */}
        <div
          ref={chatContainerRef}
          className="relative h-96 sm:h-[500px] md:h-[600px] p-6 overflow-hidden"
        >
          {/* Gradiente de fondo sutil (no competitivo) */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            }}
          />

          {/* Fade inferior para transición suave */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none" />

          {/* 💬 MENSAJES - Prioridad absoluta, diseño limpio */}
          <div className="relative z-20 h-full flex flex-col justify-end space-y-4">
            <AnimatePresence mode="popLayout">
              {visibleMessages.map((msg) => {
                const isOwn = msg.isOwn;
                return (
                  <motion.div
                    key={`${msg.id}-${msg.timestamp}`}
                    initial={{
                      opacity: 0,
                      y: 20,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -15,
                      scale: 0.96,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    data-message-id={msg.id}
                    data-message-timestamp={msg.timestamp}
                  >
                    {/* Avatar - Tamaño adecuado, no invasivo */}
                    <div
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shadow-md flex-shrink-0"
                    >
                      {msg.avatar}
                    </div>

                    {/* Burbuja de mensaje - ZERO overlays, diseño limpio */}
                    <div className={`flex-1 max-w-[75%] ${isOwn ? 'flex justify-end' : ''}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                          isOwn
                            ? 'bg-gradient-to-br from-purple-600/95 to-pink-600/95 rounded-tr-sm'
                            : 'bg-gray-800/95 border border-gray-700/50 rounded-tl-sm'
                        }`}
                      >
                        {/* Nombre de usuario */}
                        <span className={`text-xs font-bold ${msg.color} block mb-1.5`}>
                          {msg.user}
                        </span>
                        {/* Texto del mensaje - Prioridad #1 */}
                        <p className={`text-[15px] leading-relaxed ${isOwn ? 'text-white' : 'text-gray-100'}`}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/*
            💖 REACCIONES FLOTANTES - Tipo Instagram Live

            RENDERIZADO GLOBAL (no dentro de burbujas):
            - Posicionadas en el contenedor del chat
            - Calculan su posición basándose en el messageId
            - Flotan desde el lateral de la burbuja hacia arriba
            - Desaparecen suavemente después de 1.8s

            CLAVE: NO son children de las burbujas, son siblings en el contenedor
          */}
          <div className="absolute inset-0 pointer-events-none z-30">
            <AnimatePresence>
              {floatingEmojis.map((emoji) => {
                // Encontrar la posición vertical del mensaje
                const messageIndex = visibleMessages.findIndex(
                  m => m.id === emoji.messageId && m.timestamp === emoji.messageTimestamp
                );

                if (messageIndex === -1) return null;

                // Calcular posición base (desde abajo, cada mensaje ocupa ~80px aproximadamente)
                const baseY = (visibleMessages.length - messageIndex - 1) * 80 + 50;

                return (
                  <motion.div
                    key={emoji.id}
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: emoji.isOwn ? -30 : 30,
                      y: baseY,
                    }}
                    animate={{
                      opacity: [0, 1, 1, 0.8, 0],
                      scale: [0, 1.2, 1, 0.9, 0.7],
                      x: emoji.isOwn ? -50 + emoji.horizontalOffset : 50 + emoji.horizontalOffset,
                      y: baseY - 120, // Flota hacia arriba
                      rotate: [0, 10, -5, 8, 0],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      duration: 1.8,
                      delay: emoji.delay / 1000,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="absolute text-2xl"
                    style={{
                      left: emoji.isOwn ? 'auto' : '20px',
                      right: emoji.isOwn ? '20px' : 'auto',
                      bottom: 0,
                      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
                    }}
                  >
                    {emoji.emoji}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer - CTA para unirse */}
        <div className="p-6 bg-gradient-to-r from-gray-900/95 via-gray-850/95 to-gray-900/95 border-t border-purple-500/10 backdrop-blur-sm">
          <motion.button
            onClick={onJoinClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white text-base sm:text-lg font-bold py-4 sm:py-5 rounded-2xl transition-all duration-300 shadow-xl flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            {/* Efecto de brillo sutil */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            <span className="relative z-10">Unirse a la conversación</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10"
            >
              →
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatDemo;
