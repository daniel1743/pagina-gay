/**
 * HOOK DE REACT PARA SISTEMA DE BOTS
 *
 * Facilita la integración del sistema de bots en componentes
 */

import { useEffect, useRef } from 'react';
import {
  initializeBots,
  updateBotsOnUserChange,
  botRespondToUser,
  stopBotsInRoom,
  getBotStatus,
  sendWelcomeMessage,
  activateAIWhenUserEnters
} from '@/services/botCoordinator';
import {
  startJoinSimulator,
  stopJoinSimulator
} from '@/services/botJoinSimulator';

/**
 * Hook para gestionar sistema de bots en una sala de chat
 *
 * @param {String} roomId - ID de la sala
 * @param {Array} users - Lista de usuarios en la sala
 * @param {Array} messages - Historial de mensajes
 * @param {Boolean} enabled - Si el sistema de bots está habilitado
 * @param {Function} onBotJoin - Callback para notificar cuando un bot se conecta
 * @returns {Object} - Estado y funciones del sistema de bots
 */
export const useBotSystem = (roomId, users = [], messages = [], enabled = true, onBotJoin = null) => {
  const previousUserCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const joinSimulatorStartedRef = useRef(false);

  // Inicializar sistema de bots SIEMPRE (incluso sin usuarios reales)
  useEffect(() => {
    if (!enabled || !roomId) return;

    const realUsers = users.filter(u =>
      u.userId !== 'system' && !u.userId?.startsWith('bot_')
    );

    // Función para obtener historial actualizado
    const getConversationHistory = () => messages;

    // Inicializar SIEMPRE (incluso con 0 usuarios reales)
    // La lógica interna del coordinador decide cuántos bots activar
    if (!isInitializedRef.current) {
      console.log('🎬 Iniciando sistema de bots...');
      initializeBots(roomId, users, getConversationHistory);
      isInitializedRef.current = true;
      previousUserCountRef.current = realUsers.length;
    }

  }, [roomId, users, messages, enabled]);

  // Actualizar bots cuando cambia el número de usuarios
  useEffect(() => {
    if (!enabled || !roomId || !isInitializedRef.current) return;

    const realUsers = users.filter(u =>
      u.userId !== 'system' && !u.userId?.startsWith('bot_')
    );

    // Función para obtener historial actualizado
    const getConversationHistory = () => messages;

    // Si cambió el número de usuarios, actualizar bots
    if (realUsers.length !== previousUserCountRef.current) {
      console.log(`👥 Usuarios cambió de ${previousUserCountRef.current} a ${realUsers.length}`);
      updateBotsOnUserChange(roomId, users, getConversationHistory);
      previousUserCountRef.current = realUsers.length;
    }

  }, [roomId, users, messages, enabled]);

  // ⚠️ DESACTIVADO: Simulador de entradas (generaba bots falsos como "Mario", "Raúl")
  // useEffect(() => {
  //   if (!enabled || !roomId || joinSimulatorStartedRef.current) return;

  //   console.log('🎬 Iniciando simulador de entradas de bots...');
  //   startJoinSimulator(roomId, onBotJoin);
  //   joinSimulatorStartedRef.current = true;

  //   // NO limpiar en cada render, solo al desmontar completamente
  // }, [roomId, enabled]); // ⚠️ Removido onBotJoin de dependencias para evitar ciclo

  console.log('⚠️ [BOT JOIN SIMULATOR] DESACTIVADO - Solo sistema de IA conversacional activo');

  // Limpiar bots cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (roomId && isInitializedRef.current) {
        console.log('🧹 Limpiando bots al desmontar componente');
        stopBotsInRoom(roomId);
        stopJoinSimulator(roomId);
        isInitializedRef.current = false;
        joinSimulatorStartedRef.current = false;
      }
    };
  }, [roomId]);

  // Función para que bots respondan a mensaje de usuario
  const triggerBotResponse = (userMessage, userId) => {
    if (!enabled || !roomId) return;
    botRespondToUser(roomId, userMessage, messages, userId);
  };

  // Función para enviar bienvenida cuando entra usuario
  const welcomeUser = (username) => {
    if (!enabled || !roomId) return;
    sendWelcomeMessage(roomId, username, messages);
  };

  // ✨ Función para activar IA cuando entra usuario real
  const activateAIForUser = (userId, username) => {
    if (!enabled || !roomId) return;
    console.log(`✨ Activando IA para usuario ${username} (${userId})`);
    activateAIWhenUserEnters(roomId, userId, username);
  };

  // Obtener estado actual de bots
  const status = getBotStatus(roomId);

  return {
    botStatus: status,
    triggerBotResponse,
    welcomeUser,
    activateAIForUser, // ← Nueva función para activar IA
    isActive: status.active
  };
};
