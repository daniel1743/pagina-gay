/**
 * HOOK: useCompanionAI
 *
 * Detecta comportamiento de usuario anónimo y activa IA de acompañamiento
 *
 * TRIGGERS:
 * 1. Usuario entra a sala y NO escribe en 30 segundos
 * 2. Usuario hace scroll pero NO participa (leyendo pasivamente)
 * 3. Usuario hace clic en widget de ayuda
 */

import { useState, useEffect, useRef } from 'react';
import {
  generateCompanionMessage,
  analyzeRecentMessages,
  detectRoomTone,
  shouldShowCompanion
} from '@/services/companionAIService';

/**
 * Hook principal de IA de acompañamiento
 *
 * @param {Object} params
 * @param {Object} params.user - Usuario actual
 * @param {String} params.roomId - ID de la sala
 * @param {String} params.roomName - Nombre de la sala
 * @param {Array} params.messages - Mensajes de la sala
 * @param {Number} params.userMessageCount - Mensajes enviados por el usuario
 * @param {Boolean} params.enabled - Si el sistema está habilitado
 * @returns {Object} - Estado y funciones del companion
 */
export const useCompanionAI = ({
  user,
  roomId,
  roomName,
  messages = [],
  userMessageCount = 0,
  enabled = true
}) => {
  // Estado del companion
  const [isVisible, setIsVisible] = useState(false);
  const [companionMessage, setCompanionMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);

  // Referencias para tracking
  const entryTimeRef = useRef(Date.now());
  const scrollCountRef = useRef(0);
  const hasShownFirstHelpRef = useRef(false);
  const hasShownPassiveHelpRef = useRef(false);

  // Verificar si debe mostrar companion
  const shouldShow = enabled && shouldShowCompanion(user);

  /**
   * TRIGGER 1: Usuario nuevo sin escribir (30 segundos)
   */
  useEffect(() => {
    if (!shouldShow || hasShownFirstHelpRef.current) return;
    if (userMessageCount > 0) return; // Ya escribió

    const timer = setTimeout(async () => {
      if (userMessageCount === 0) {
        console.log('🎯 [COMPANION] TRIGGER 1: Usuario sin escribir por 30s');
        setLoading(true);
        setCurrentScenario('firstMessageHelp');

        const message = await generateCompanionMessage('firstMessageHelp', {
          roomName
        });

        setCompanionMessage(message);
        setIsVisible(true);
        setLoading(false);
        hasShownFirstHelpRef.current = true;
      }
    }, 30000); // 30 segundos

    return () => clearTimeout(timer);
  }, [shouldShow, userMessageCount, roomName]);

  /**
   * TRIGGER 2: Usuario leyendo pasivamente (60 segundos + scroll)
   */
  useEffect(() => {
    if (!shouldShow || hasShownPassiveHelpRef.current) return;
    if (userMessageCount > 0) return; // Ya escribió

    const timeInRoom = Date.now() - entryTimeRef.current;

    // Si lleva más de 60s Y ha hecho scroll, ofrecer ayuda
    if (timeInRoom > 60000 && scrollCountRef.current > 3) {
      console.log('🎯 [COMPANION] TRIGGER 2: Usuario leyendo pasivamente');

      const showPassiveHelp = async () => {
        setLoading(true);
        setCurrentScenario('passiveReader');

        const message = await generateCompanionMessage('passiveReader', {
          roomName,
          timeInRoom
        });

        setCompanionMessage(message);
        setIsVisible(true);
        setLoading(false);
        hasShownPassiveHelpRef.current = true;
      };

      showPassiveHelp();
    }
  }, [shouldShow, userMessageCount, roomName]);

  /**
   * Registrar evento de scroll
   */
  const handleScroll = () => {
    scrollCountRef.current += 1;
  };

  /**
   * Usuario acepta ayuda - Generar sugerencias
   */
  const acceptHelp = async () => {
    console.log('✅ [COMPANION] Usuario aceptó ayuda');
    setLoading(true);
    setCurrentScenario('suggestFirstMessage');

    // Analizar últimos mensajes
    const recentMessages = analyzeRecentMessages(messages, 5);
    const roomTone = detectRoomTone(messages);

    console.log(`📊 [COMPANION] Tono de sala: ${roomTone}`);

    const suggestionsText = await generateCompanionMessage('suggestFirstMessage', {
      roomName,
      lastMessages: recentMessages
    });

    // Parsear sugerencias (formato: "1. texto\n2. texto\n3. texto")
    const parsedSuggestions = suggestionsText
      .split('\n')
      .filter(line => line.match(/^\d\./))
      .map(line => line.replace(/^\d\.\s*/, '').trim());

    setSuggestions(parsedSuggestions);
    setCompanionMessage('Aquí tienes algunas ideas:');
    setLoading(false);
  };

  /**
   * Usuario rechaza ayuda
   */
  const rejectHelp = () => {
    console.log('❌ [COMPANION] Usuario rechazó ayuda');
    setIsVisible(false);
    setCompanionMessage('');
    setSuggestions([]);
    setCurrentScenario(null);
  };

  /**
   * Usuario selecciona una sugerencia
   */
  const selectSuggestion = (suggestion) => {
    console.log(`✅ [COMPANION] Usuario seleccionó: "${suggestion}"`);
    return suggestion; // Retornar para que el componente padre lo use
  };

  /**
   * Mostrar widget manualmente (clic en botón flotante)
   */
  const showWidget = async () => {
    console.log('🎯 [COMPANION] TRIGGER 3: Usuario hizo clic en widget');
    setIsVisible(true);

    // Si ya tiene sugerencias, mostrarlas
    if (suggestions.length > 0) return;

    // Si no, generar ayuda inicial
    setLoading(true);
    setCurrentScenario('firstMessageHelp');

    const message = await generateCompanionMessage('firstMessageHelp', {
      roomName
    });

    setCompanionMessage(message);
    setLoading(false);
  };

  /**
   * Ocultar widget
   */
  const hideWidget = () => {
    setIsVisible(false);
  };

  /**
   * Responder pregunta del usuario
   */
  const askQuestion = async (question) => {
    setLoading(true);
    setCurrentScenario('generalHelp');

    const answer = await generateCompanionMessage('generalHelp', {
      userQuestion: question
    });

    setCompanionMessage(answer);
    setLoading(false);
  };

  /**
   * Resetear estado (cuando usuario escribe)
   */
  useEffect(() => {
    if (userMessageCount > 0) {
      // Usuario ya participó, ocultar companion
      setIsVisible(false);
      setCompanionMessage('');
      setSuggestions([]);
    }
  }, [userMessageCount]);

  return {
    // Estado
    isVisible,
    companionMessage,
    suggestions,
    loading,
    currentScenario,

    // Acciones
    acceptHelp,
    rejectHelp,
    selectSuggestion,
    showWidget,
    hideWidget,
    handleScroll,
    askQuestion,

    // Info
    shouldShow
  };
};
