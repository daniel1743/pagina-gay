/**
 * MENSAJES CONTEXTUALES INTELIGENTES
 *
 * Sistema que muestra mensajes según el contexto de la sala:
 * - Sala vacía (0 usuarios)
 * - Sala con poca gente (1-2 usuarios)
 * - Sin mensajes recientes (>2 minutos)
 * - Sugerencias de salas más activas
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContextualMessages = ({
  roomId,
  userCount,
  lastMessageTime,
  currentUserId,
  roomCounts = {}
}) => {
  const [message, setMessage] = useState(null);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Esperar 3 segundos antes de mostrar cualquier mensaje
    const initialDelay = setTimeout(() => {
      const contextMessage = getContextualMessage();
      if (contextMessage) {
        setMessage(contextMessage);
        setShowMessage(true);
      }
    }, 3000);

    return () => clearTimeout(initialDelay);
  }, [roomId, userCount, lastMessageTime]);

  // Actualizar mensaje cuando cambia el contexto
  useEffect(() => {
    if (!showMessage) return;

    const contextMessage = getContextualMessage();
    if (contextMessage && contextMessage.text !== message?.text) {
      setMessage(contextMessage);
    }
  }, [userCount, lastMessageTime]);

  /**
   * Determina qué mensaje mostrar según el contexto
   */
  const getContextualMessage = () => {
    const now = Date.now();
    const timeSinceLastMessage = lastMessageTime ? now - lastMessageTime : Infinity;
    const minutesSinceLastMessage = Math.floor(timeSinceLastMessage / 60000);

    // CASO 1: Sala vacía (0 usuarios además del actual)
    if (userCount === 0 || userCount === 1) {
      return {
        text: `Eres ${userCount === 0 ? 'el primero' : 'el único'} aquí ahora. ¿De qué tienes ganas de hablar? 💬`,
        icon: MessageSquare,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        type: 'empty'
      };
    }

    // CASO 2: Poca gente en la sala (2-3 usuarios)
    if (userCount <= 3) {
      return {
        text: `Hay ${userCount} personas aquí. ¡Di hola! 👋`,
        icon: Users,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        type: 'few-users'
      };
    }

    // CASO 3: Sin mensajes recientes (>2 minutos) y poca gente
    if (minutesSinceLastMessage >= 2 && userCount < 5) {
      const mostActiveRoom = getMostActiveRoom();
      if (mostActiveRoom && mostActiveRoom.id !== roomId) {
        return {
          text: `💡 La sala "${mostActiveRoom.name}" tiene ${mostActiveRoom.count} personas activas. ¿Pruebas ahí?`,
          icon: TrendingUp,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          type: 'suggestion',
          action: () => navigate(`/chat/${mostActiveRoom.id}`)
        };
      }

      return {
        text: '💬 Mientras esperas, ¿qué tal tu día?',
        icon: Sparkles,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10',
        type: 'icebreaker'
      };
    }

    // CASO 4: Sin mensajes pero hay gente (>5 minutos silencio con 4+ usuarios)
    if (minutesSinceLastMessage >= 5 && userCount >= 4) {
      return {
        text: '¿Nadie dice nada? ¡Rompe el hielo! 🔥',
        icon: MessageSquare,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        type: 'silence'
      };
    }

    // No mostrar mensaje si todo está normal
    return null;
  };

  /**
   * Encuentra la sala más activa (excepto la actual)
   */
  const getMostActiveRoom = () => {
    if (!roomCounts || Object.keys(roomCounts).length === 0) return null;

    const rooms = Object.entries(roomCounts)
      .filter(([id]) => id !== roomId) // Excluir sala actual
      .map(([id, count]) => ({ id, count, name: getRoomName(id) }))
      .sort((a, b) => b.count - a.count);

    return rooms[0]?.count > 0 ? rooms[0] : null;
  };

  /**
   * Obtiene el nombre amigable de una sala
   */
  const getRoomName = (id) => {
    const names = {
      'global': 'Chat Global',
      'mas-30': 'Más de 30',
      'santiago': 'Santiago',
      'gaming': 'Gaming'
    };
    return names[id] || id;
  };

  /**
   * Ocultar mensaje después de 10 segundos
   */
  useEffect(() => {
    if (showMessage && message) {
      const hideTimer = setTimeout(() => {
        setShowMessage(false);
      }, 10000);

      return () => clearTimeout(hideTimer);
    }
  }, [showMessage, message]);

  if (!message || !showMessage) return null;

  const Icon = message.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full px-4 py-2"
      >
        <motion.div
          whileHover={{ scale: message.action ? 1.02 : 1 }}
          onClick={message.action}
          className={`
            flex items-center gap-3 p-3 rounded-lg border
            ${message.bgColor} ${message.color} border-current/20
            ${message.action ? 'cursor-pointer hover:border-current/40 transition-all' : ''}
          `}
        >
          <div className="flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium flex-1">
            {message.text}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMessage(false);
            }}
            className="flex-shrink-0 text-xs hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContextualMessages;
