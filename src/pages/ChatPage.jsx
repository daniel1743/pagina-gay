import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChatScrollManager } from '@/hooks/useChatScrollManager';
import { useCompanionAI } from '@/hooks/useCompanionAI';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import NewMessagesIndicator from '@/components/chat/NewMessagesIndicator';
import ScreenSaver from '@/components/chat/ScreenSaver';
import CompanionWidget from '@/components/chat/CompanionWidget';
import UserProfileModal from '@/components/chat/UserProfileModal';
import UserActionsModal from '@/components/chat/UserActionsModal';
import ReportModal from '@/components/chat/ReportModal';
import PrivateChatRequestModal from '@/components/chat/PrivateChatRequestModal';
import VerificationModal from '@/components/chat/VerificationModal';
import TypingIndicator from '@/components/chat/TypingIndicator';
import WelcomeTour from '@/components/onboarding/WelcomeTour';
import { PremiumWelcomeModal } from '@/components/chat/PremiumWelcomeModal';
import ChatRulesModal from '@/components/chat/ChatRulesModal';
import AgeVerificationModal from '@/components/chat/AgeVerificationModal';
import ChatLandingPage from '@/components/chat/ChatLandingPage';
import EmptyRoomNotificationPrompt from '@/components/chat/EmptyRoomNotificationPrompt';
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage, markMessagesAsRead } from '@/services/chatService';
import { joinRoom, leaveRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, updateUserActivity, cleanInactiveUsers, filterActiveUsers } from '@/services/presenceService';
import { sendModeratorWelcome } from '@/services/moderatorWelcome';
import { checkAndSeedConversations } from '@/services/seedConversationsService';
import { trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { checkUserSanctions, SANCTION_TYPES } from '@/services/sanctionsService';
import { roomsData } from '@/config/rooms';
import { startEngagementTracking, hasReachedOneHourLimit, getTotalEngagementTime, hasSeenEngagementModal, markEngagementModalAsShown } from '@/services/engagementService';
import { notificationSounds } from '@/services/notificationSounds';

const roomWelcomeMessages = {
  // 'global': '¡Bienvenido a Chat Global! Habla de lo que quieras.', // ⚠️ DESACTIVADA
  'principal': '¡Bienvenido a Chat Principal! Habla de lo que quieras.',
  'gaming': '¡Gamers, uníos! ¿A qué están jugando?',
  'mas-30': 'Espacio para mayores de 30. ¡Comparte tus experiencias!',
  'amistad': '¿Buscas nuevos amigos? ¡Este es el lugar!',
  'santiago': '🏙️ ¡Bienvenido a la sala de Santiago! Gays de la capital, ¿qué tal el día?',
  'valparaiso': '🌊 ¡Bienvenido a la sala de Valparaíso! Puerto, cerros y buena onda.',
  'osos-activos': 'Sala para osos activos y quienes los buscan. ¡Grrr!',
  'pasivos-buscando': 'Pasivos buscando activos. ¡Encuentra tu match!',
  'versatiles': 'Para los versátiles que disfrutan de todo. ¡Bienvenidos!',
  'quedar-ya': '¿Quieres organizar algo? ¡Coordina aquí!',
  'hablar-primero': 'Para los que prefieren conocerse bien antes de todo.',
  'morbosear': 'Sala para conversar con un toque de morbo. ¡Con respeto!',
};

const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, guestMessageCount, setGuestMessageCount, showWelcomeTour, setShowWelcomeTour, updateAnonymousUserProfile } = useAuth();

  // ✅ Estados y refs - DEBEN estar ANTES del early return
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]); // 🤖 Usuarios en la sala (para sistema de bots)
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionsTarget, setUserActionsTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  // Sidebar cerrado en móvil (< 1024px), abierto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false; // Valor por defecto para SSR
  });

  // ✅ Cerrar sidebar automáticamente en móvil cuando cambia el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Verificar al montar
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Cerrar sidebar automáticamente cuando se cambia de sala en móvil
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [currentRoom]);
  const [privateChatRequest, setPrivateChatRequest] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [showChatRules, setShowChatRules] = useState(false); // ✅ Modal de reglas
  const [showAgeVerification, setShowAgeVerification] = useState(false); // ✅ Modal de edad
  const [isAgeVerified, setIsAgeVerified] = useState(false); // ✅ Flag mayor de edad
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false); // ✅ Flag de reglas aceptadas
  const [roomCounts, setRoomCounts] = useState({}); // Contadores de usuarios por sala
  const [engagementTime, setEngagementTime] = useState(''); // ⏱️ Tiempo total de engagement
  const [showScreenSaver, setShowScreenSaver] = useState(false); // 🔒 Protector de pantalla
  const [isInputFocused, setIsInputFocused] = useState(false); // 📝 Input focus state for scroll manager
  const [suggestedMessage, setSuggestedMessage] = useState(null); // 🤖 Mensaje sugerido por Companion AI
  const unsubscribeRef = useRef(null);
  const aiActivatedRef = useRef(false); // Flag para evitar activaciones múltiples de IA
  const lastUserCountRef = useRef(0); // Para evitar ejecuciones innecesarias del useEffect
  const previousMessageCountRef = useRef(0); // Para detectar nuevos mensajes y reproducir sonido
  const lastUserCountsRef = useRef({ total: 0, active: 0, real: 0 }); // Para rastrear conteos de usuarios
  const previousRealUserCountRef = useRef(0); // Para detectar cuando usuarios se desconectan y reproducir sonido

  // 🎯 PRO SCROLL MANAGER: Discord/Slack-inspired scroll behavior
  // ✅ IMPORTANTE: Debe estar ANTES del early return para respetar reglas de hooks
  // El hook maneja internamente el caso cuando user es null
  const scrollManager = useChatScrollManager({
    messages,
    currentUserId: user?.id || null,
    isInputFocused,
  });

  // 🤖 COMPANION AI: Sistema de ayuda sutil para usuarios anónimos
  // Calcula cuántos mensajes ha enviado el usuario actual
  const userMessageCount = messages.filter(msg =>
    msg.userId === user?.id && msg.type === 'text'
  ).length;

  const companionAI = useCompanionAI({
    user,
    roomId: currentRoom,
    roomName: roomsData.find(r => r.id === currentRoom)?.name || currentRoom,
    messages,
    userMessageCount,
    enabled: true // Siempre habilitado para usuarios que lo necesiten
  });

  // ========================================
  // 🔒 LANDING PAGE: Guard clause para user === null
  // ========================================
  // CRITICAL: Debe estar DESPUÉS de todos los hooks
  // NO afecta a guests (user.isGuest), solo a visitantes sin sesión
  // Muestra landing page completa para mejor SEO y conversión
  if (!user) {
    return <ChatLandingPage roomSlug={roomId} />;
  }

  // ✅ VALIDACIÓN: Salas restringidas requieren autenticación
  useEffect(() => {
    // ✅ SEO: Validar que la sala existe en roomsData (prevenir 404 en salas comentadas)
    const activeSalas = roomsData.map(room => room.id);
    if (!activeSalas.includes(roomId)) {
      toast({
        title: "Sala Temporalmente Cerrada",
        description: "Esta sala no está disponible por el momento. Te redirigimos a Chat Global.",
        variant: "default",
      });
      navigate('/chat/global', { replace: true });
      return;
    }

    // 🔒 SALAS RESTRINGIDAS: mas-30, santiago, gaming requieren autenticación
    const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
    const isRestrictedRoom = restrictedRooms.includes(roomId);
    const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);

    if (isRestrictedRoom && isGuestOrAnonymous) {
      toast({
        title: "🔒 Registro Requerido",
        description: "Esta sala es exclusiva para usuarios registrados. Regístrate gratis para acceder.",
        variant: "default",
      });
      navigate('/chat/global', { replace: true });
      return;
    }
  }, [user, navigate, roomId]);

  // ✅ SEO: Actualizar título, meta description Y Open Graph dinámicamente por sala
  React.useEffect(() => {
    // Meta information específica por sala (SIN números dinámicos para SEO estable)
    const roomSEO = {
      'gaming': {
        title: 'Chat Gay Gamers Chile 🎮 | Sala Gaming LGBT+ | Chactivo',
        description: '🎮 Únete a la sala de gaming gay más activa de Chile. Comparte LoL, Valorant, Genshin, Minecraft. Encuentra squad LGBT+, chatea sobre PS5, Xbox, PC, Switch. Comunidad gamer sin toxicidad. ¡Regístrate gratis!',
        ogTitle: 'Chat Gay para Gamers Chile 🎮 | Comunidad Gaming LGBT+',
        ogDescription: '🎮 Conecta con gamers LGBT+ de Chile. Sala activa 24/7 con +50 gamers. Todas las plataformas: PC, PS5, Xbox, Switch, Móvil. ¡Únete ahora!'
      },
      'mas-30': {
        title: 'Chat Gay +30 Años Chile 💪 | Sala Mayores LGBT+ | Chactivo',
        description: '💪 Chat gay para mayores de 30 años en Chile. Conversación madura, sin presión. Conoce gays de tu edad en Santiago, Valparaíso y todo Chile. Comunidad LGBT+ +30 activa 24/7.',
        ogTitle: 'Chat Gay +30 Años Chile | Comunidad Madura LGBT+',
        ogDescription: '💪 Sala exclusiva para mayores de 30. Conversación madura, respeto y buena onda. Conoce gays de tu generación.'
      },
      'santiago': {
        title: 'Chat Gay Santiago Chile 🏙️ | Sala LGBT+ Capital | Chactivo',
        description: '🏙️ Chat gay Santiago Chile. Conecta con gays de la capital en tiempo real. Salas temáticas, conversación segura, comunidad LGBT+ activa 24/7. ¡Regístrate gratis!',
        ogTitle: 'Chat Gay Santiago | Conoce LGBT+ de la Capital',
        ogDescription: '🏙️ Sala exclusiva de Santiago. Conecta con gays de Providencia, Las Condes, Ñuñoa y toda la capital.'
      },
      // ⚠️ SALA GLOBAL - DESACTIVADA (reemplazada por 'principal')
      // 'global': {
      //   title: 'Chat Global - Chat Gay Chile 💬 | Sala General LGBT+ | Chactivo',
      //   description: '💬 Sala de chat gay general Chile. Todos los temas bienvenidos: amistad, relaciones, gaming, cultura. Conversación libre, ambiente relajado. La sala más activa de Chactivo. ¡Regístrate en 30 segundos!',
      //   ogTitle: 'Chat Global | Chat Gay Chile General 💬',
      //   ogDescription: '💬 La sala más popular de Chactivo. Todos los temas, todos bienvenidos. Ambiente relajado y conversación real.'
      // },
      'principal': {
        title: 'Chat Principal - Chat Gay Chile 💬 | Sala General LGBT+ | Chactivo',
        description: '💬 Sala de chat gay principal Chile. Todos los temas bienvenidos: amistad, relaciones, gaming, cultura. Conversación libre, ambiente relajado. La sala más activa de Chactivo. ¡Regístrate en 30 segundos!',
        ogTitle: 'Chat Principal | Chat Gay Chile General 💬',
        ogDescription: '💬 La sala más popular de Chactivo. Todos los temas, todos bienvenidos. Ambiente relajado y conversación real.'
      }
    };

    const seoData = roomSEO[roomId] || {
      title: `Chat ${roomId} - Chactivo | Chat Gay Chile`,
      description: `Sala de chat gay ${roomId} en Chile. Conoce gays, chatea en vivo, comunidad LGBT+ activa. ¡Regístrate gratis en 30 segundos!`,
      ogTitle: `Sala ${roomId} | Chactivo`,
      ogDescription: `Únete a la sala ${roomId}. Comunidad gay activa de Chile.`
    };

    // Actualizar title
    document.title = seoData.title;

    // Actualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = seoData.description;

    // ✅ CRÍTICO: Actualizar Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', seoData.ogTitle);

    // ✅ CRÍTICO: Actualizar Open Graph description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', seoData.ogDescription);

    // ✅ CRÍTICO: Actualizar Open Graph URL (único por sala)
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', `https://chactivo.com/chat/${roomId}`);

    // ✅ Twitter Card title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', seoData.ogTitle);

    // ✅ Twitter Card description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', seoData.ogDescription);

    return () => {
      // Limpiar meta description al desmontar (volver a la del index.html)
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Únete al chat gay más activo de Chile. Salas temáticas: Gaming 🎮, +30 años, Osos 🐻, Amistad. Conversaciones reales, comunidad LGBT+ segura. ¡Regístrate en 30 segundos!';
      }
    };
  }, [roomId]);

  // SEO: Canonical tag dinámico para cada sala
  useCanonical(`/chat/${roomId}`);

  // Track page view and room join
  useEffect(() => {
    if (roomId) {
      trackPageView(`/chat/${roomId}`, `Chat - ${roomId}`);
      trackRoomJoined(roomId);
    }

    return () => {
      if (roomId) {
        trackPageExit(`/chat/${roomId}`, 0);
      }
    };
  }, [roomId]);

  // ⏱️ ENGAGEMENT TRACKING: Sistema de 1 hora gratuita
  useEffect(() => {
    // Solo para usuarios guest/anonymous
    if (!user || (!user.isGuest && !user.isAnonymous)) {
      return;
    }

    // 🔥 DESHABILITADO: Invitados pueden chatear sin límite de tiempo
    // startEngagementTracking(user);

    // 🔥 DESHABILITADO: Ya no verificamos límite de 1 hora para invitados
    // const checkInterval = setInterval(() => {
    //   if (hasReachedOneHourLimit(user) && !hasSeenEngagementModal()) {
    //     const totalTime = getTotalEngagementTime(user);
    //     setEngagementTime(totalTime);
    //     setShowVerificationModal(true);
    //     markEngagementModalAsShown();
    //     console.log('🎉 ¡1 hora alcanzada! Mostrando modal celebratorio');
    //   }
    // }, 10000);

    // return () => clearInterval(checkInterval);
  }, [user]);

  // 🎁 Mostrar modal de bienvenida premium solo una vez
  useEffect(() => {
    const hasSeenPremiumWelcome = localStorage.getItem('hasSeenPremiumWelcome');

    if (!hasSeenPremiumWelcome) {
      // Mostrar después de 2 segundos de entrar a la sala
      const timer = setTimeout(() => {
        setShowPremiumWelcome(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePremiumWelcome = () => {
    setShowPremiumWelcome(false);
    localStorage.setItem('hasSeenPremiumWelcome', 'true');
  };

  // 🤖 Callback para notificar cuando un bot se conecta
  const handleBotJoin = (botData) => {
    toast({
      title: `👋 ${botData.username} se ha conectado`,
      description: `${botData.role}`,
      duration: 3000,
    });
  };

  // 🤖 SISTEMA DE BOTS: DESACTIVADO COMPLETAMENTE
  // ⚠️ Los bots activos están desactivados para evitar que se cuenten como usuarios reales
  // ✅ PERO la IA conversacional SÍ está activa (importada directamente)

  // Valores por defecto para evitar errores
  const botStatus = { active: false, botCount: 0, bots: [] };
  const triggerBotResponse = () => {}; // Función vacía
  const botsActive = false;

  // ✅ NUEVO: Verificar si el usuario ya aceptó las reglas del chat
  useEffect(() => {
    if (!user || !user.id) return;

    const ageKey = `age_verified_${user.id}`;
    const storedAge = localStorage.getItem(ageKey);

    // ✅ Verificar si ya está confirmado (solo una vez por usuario)
    if (storedAge && Number(storedAge) >= 18) {
      setIsAgeVerified(true);
      setShowAgeVerification(false); // ✅ NO mostrar si ya está verificado
      console.log(`[AGE VERIFICATION] ✅ Usuario ${user.id} ya verificó su edad (${storedAge} años)`);
    } else {
      // ✅ Solo mostrar si NO está verificado Y no se ha mostrado antes en esta sesión
      setIsAgeVerified(false);
      // ✅ Solo mostrar si no hay flag de "ya se mostró" en esta sesión
      const hasShownKey = `age_modal_shown_${user.id}`;
      const hasShown = sessionStorage.getItem(hasShownKey);
      if (!hasShown) {
        setShowAgeVerification(true);
        sessionStorage.setItem(hasShownKey, 'true'); // Marcar que se mostró en esta sesión
        console.log(`[AGE VERIFICATION] 📋 Mostrando modal de edad para usuario ${user.id}`);
      } else {
        console.log(`[AGE VERIFICATION] ⏭️ Modal ya se mostró en esta sesión para usuario ${user.id}`);
      }
    }

    const rulesKey = `chat_rules_accepted_${user.id}`;
    const hasAccepted = localStorage.getItem(rulesKey) === 'true';

    if (!hasAccepted) {
      // Mostrar modal de reglas si no las ha aceptado
      setShowChatRules(true);
      setHasAcceptedRules(false);
    } else {
      setHasAcceptedRules(true);
    }
  }, [user]);

  // 🔊 INICIALIZACIÓN DE SONIDOS: Forzar inicialización al montar componente
  useEffect(() => {
    if (!user) return;

    console.log('[CHAT] 🔊 Inicializando sistema de sonidos...');

    // Intentar inicializar inmediatamente (funcionará si el usuario ya interactuó)
    const initialized = notificationSounds.init();

    if (!initialized) {
      console.log('[CHAT] ⏳ AudioContext requiere interacción del usuario, esperando...');

      // Si no se pudo inicializar, agregar listener para el primer click/touch
      const handleFirstInteraction = () => {
        console.log('[CHAT] 👆 Primera interacción detectada, inicializando sonidos...');
        const success = notificationSounds.init();
        if (success) {
          console.log('[CHAT] ✅ Sistema de sonidos listo');
          document.removeEventListener('click', handleFirstInteraction);
          document.removeEventListener('touchstart', handleFirstInteraction);
          document.removeEventListener('keydown', handleFirstInteraction);
        }
      };

      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });

      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
    } else {
      console.log('[CHAT] ✅ Sistema de sonidos inicializado correctamente');
    }
  }, [user]);

  // Suscribirse a mensajes en tiempo real cuando cambia la sala
  useEffect(() => {
    // 🔒 SAFETY: Verificar que user existe (defensa en profundidad)
    // Aunque el guard clause previene esto, es buena práctica
    if (!user || !user.id) {
      console.warn('⚠️ [CHAT] useEffect de Firestore ejecutado sin user válido');
      return;
    }
    // ✅ NO mostrar modal aquí si ya está verificado en localStorage
    if (!isAgeVerified) {
      const ageKey = `age_verified_${user.id}`;
      const storedAge = localStorage.getItem(ageKey);
      // ✅ Solo mostrar si realmente NO está verificado (no solo el estado)
      if (!storedAge || Number(storedAge) < 18) {
        const hasShownKey = `age_modal_shown_${user.id}`;
        const hasShown = sessionStorage.getItem(hasShownKey);
        if (!hasShown) {
          setShowAgeVerification(true);
          sessionStorage.setItem(hasShownKey, 'true');
        }
      } else {
        // ✅ Si está en localStorage pero el estado no está actualizado, actualizar estado
        setIsAgeVerified(true);
        setShowAgeVerification(false);
      }
      return;
    }

    setCurrentRoom(roomId);
    aiActivatedRef.current = false; // Resetear flag de IA cuando cambia de sala

    // 🧹 Limpiar usuarios inactivos al entrar a la sala
    cleanInactiveUsers(roomId);

    // Registrar presencia del usuario en la sala
    joinRoom(roomId, user);

    // ✅ Suscribirse a mensajes de Firebase (SOLO mensajes reales, sin estáticos)
    const unsubscribeMessages = subscribeToRoomMessages(roomId, (newMessages) => {
      console.log(`📝 [CHAT] Mensajes recibidos: ${newMessages.length} mensajes reales`);

      // 🔊 Reproducir sonido si llegaron mensajes nuevos (no en carga inicial)
      if (previousMessageCountRef.current > 0 && newMessages.length > previousMessageCountRef.current) {
        const newMessageCount = newMessages.length - previousMessageCountRef.current;
        console.log(`🔊 [SOUNDS] ${newMessageCount} mensaje(s) nuevo(s), reproduciendo sonido`);

        // Reproducir sonido por cada mensaje nuevo (el servicio agrupa automáticamente si son 4+)
        for (let i = 0; i < newMessageCount; i++) {
          notificationSounds.playMessageSound();
        }
      }

      // Actualizar contador de mensajes
      previousMessageCountRef.current = newMessages.length;

      setMessages(newMessages); // ✅ SOLO mensajes reales
    });

    // 🤖 Suscribirse a usuarios de la sala (para sistema de bots)
    const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
      // ✅ Filtrar solo usuarios activos (<5min inactividad)
      const activeUsers = filterActiveUsers(users);
      
      // ✅ Contar solo usuarios reales (excluir bots)
      const realUsers = activeUsers.filter(u => {
        const userId = u.userId || u.id;
        return userId !== 'system' && 
               !userId?.startsWith('bot_') && 
               !userId?.startsWith('static_bot_');
      });
      
      // ✅ Solo loggear cuando hay cambios significativos (evitar spam)
      const currentCounts = {
        total: users.length,
        active: activeUsers.length,
        real: realUsers.length
      };
      
      const hasChanged = 
        currentCounts.total !== lastUserCountsRef.current.total ||
        currentCounts.active !== lastUserCountsRef.current.active ||
        currentCounts.real !== lastUserCountsRef.current.real;
      
      if (hasChanged) {
        console.log(`👥 Sala ${roomId}: ${currentCounts.real} usuario(s) real(es) activo(s) | ${currentCounts.total} total en DB (incluye inactivos)`);

        // 🔊 Reproducir sonido de salida si un usuario real se desconectó
        if (previousRealUserCountRef.current > 0 && currentCounts.real < previousRealUserCountRef.current) {
          const usersLeft = previousRealUserCountRef.current - currentCounts.real;
          console.log(`🔊 [SOUNDS] ${usersLeft} usuario(s) se desconectó/desconectaron, reproduciendo sonido de salida`);
          notificationSounds.playDisconnectSound();
        }

        // Actualizar contador de usuarios reales
        previousRealUserCountRef.current = currentCounts.real;
        lastUserCountsRef.current = currentCounts;
      }

      setRoomUsers(activeUsers);
    });

    // Guardar funciones de desuscripción
    const baseCleanup = () => {
      try {
        unsubscribeMessages();
      } catch (error) {
        // Ignorar errores de cancelación (AbortError es normal)
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error canceling message subscription:', error);
        }
      }
      try {
        unsubscribeUsers();
      } catch (error) {
        // Ignorar errores de cancelación (AbortError es normal)
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error canceling user subscription:', error);
        }
      }
    };
    
    unsubscribeRef.current = baseCleanup;

    // Toast de bienvenida
    toast({
      title: `👋 ¡${user.username} se ha unido a la sala!`,
      description: `Estás en #${roomId}`,
    });

    // 👮 Mensaje de bienvenida del moderador (solo una vez)
    const moderatorKey = `moderator_welcome_${roomId}_${user.id}`;
    const hasSeenModerator = sessionStorage.getItem(moderatorKey);

    if (!hasSeenModerator) {
      setTimeout(() => {
        sendModeratorWelcome(roomId, user.username);
        sessionStorage.setItem(moderatorKey, 'true');
      }, 2000); // Enviar después de 2 segundos
    }

    // 🌱 Sembrar conversaciones genuinas en "Chat Principal"
    checkAndSeedConversations(roomId);


    // Cleanup: desuscribirse y remover presencia cuando se desmonta o cambia de sala
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null; // Limpiar referencia
      }


      leaveRoom(roomId).catch(error => {
        // Ignorar errores al salir de la sala
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error leaving room:', error);
        }
      });
    };
  }, [roomId, user, isAgeVerified]);

  // 💓 Heartbeat: Actualizar presencia cada 10 segundos + Limpiar inactivos cada 30s
  useEffect(() => {
    // Función auxiliar para contar usuarios reales (excluyendo bots)
    const countRealUsers = (users) => {
      if (!users || users.length === 0) return 0;
      return users.filter(u => {
        const userId = u.userId || u.id;
        return userId !== 'system' && 
               !userId?.startsWith('bot_') && 
               !userId?.startsWith('bot-') &&
               !userId?.startsWith('static_bot_') && // ? Excluir bots estáticos
               !userId?.includes('bot_join');
      }).length;
    };

    // ? CRÍTICO: Validar que el usuario existe antes de continuar
    if (!user || !user.id || !user.username) {
      console.warn('? [CHAT PAGE] Usuario no disponible, no se puede activar IA');
      return;
    }

    const realUserCount = countRealUsers(roomUsers);
    
    // ? Solo ejecutar cuando realmente cambia el número de usuarios reales
    if (realUserCount === lastUserCountRef.current) {
      return; // No hacer nada si el conteo no cambió
    }
    
    lastUserCountRef.current = realUserCount;

  }, [roomUsers.length, roomId, user]); // ✅ Ejecutar cuando cambian usuarios, sala o usuario

  // Suscribirse a contadores de todas las salas (para mensajes contextuales)
  useEffect(() => {
    if (!user) return;

    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  // Navegar cuando cambia la sala actual (solo si estamos en una ruta de chat)
  useEffect(() => {
    // ✅ FIX: Solo navegar si estamos en una ruta de chat, no cuando navegamos a otras páginas
    if (currentRoom !== roomId && location.pathname.startsWith('/chat/')) {
      navigate(`/chat/${currentRoom}`, { replace: true });
    }
  }, [currentRoom, roomId, navigate, location.pathname]);

  // ✅ OLD SCROLL LOGIC REMOVED - Now using useChatScrollManager hook

  // Marcar mensajes como leídos cuando la sala está activa
  // TEMPORALMENTE DESHABILITADO: Requiere índice de Firestore
  // useEffect(() => {
  //   if (roomId && user && messages.length > 0) {
  //     // Esperar 1 segundo antes de marcar como leídos (simula que el usuario los vio)
  //     const timer = setTimeout(() => {
  //       markMessagesAsRead(roomId, user.id);
  //     }, 1000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [roomId, user, messages.length]);

  /**
   * Manejar reacciones a mensajes
   * ✅ Actualiza Firestore directamente
   */
  const handleMessageReaction = async (messageId, reaction) => {
    try {
      await addReactionToMessage(currentRoom, messageId, reaction);
      // El listener de onSnapshot actualizará automáticamente los mensajes
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "No se pudo añadir la reacción",
        variant: "destructive",
      });
    }
  };

  /**
   * Enviar mensaje
   * ✅ Guarda en Firestore en tiempo real
   * ✅ Validación para usuarios invitados (máx 10 mensajes)
   * ✅ Contador persistente en Firestore para anónimos
   * 🤖 Activa respuesta de bots si están activos
   */
  const handleSendMessage = async (content, type = 'text') => {
    // ✅ CRÍTICO: Validar que el usuario existe
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "No se puede enviar mensajes. Por favor, inicia sesión.",
        variant: "destructive",
      });
      return;
    }

    // ✅ CRÍTICO: Validar mayoría de edad (verificar localStorage también)
    if (!isAgeVerified) {
      const ageKey = `age_verified_${user.id}`;
      const storedAge = localStorage.getItem(ageKey);
      
      // ✅ Si está en localStorage, actualizar estado y continuar
      if (storedAge && Number(storedAge) >= 18) {
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        // Continuar sin mostrar modal
      } else {
        // ✅ Solo mostrar modal si realmente NO está verificado
        const hasShownKey = `age_modal_shown_${user.id}`;
        const hasShown = sessionStorage.getItem(hasShownKey);
        if (!hasShown) {
          setShowAgeVerification(true);
          sessionStorage.setItem(hasShownKey, 'true');
          toast({
            title: "Verifica tu edad",
            description: "Debes confirmar que eres mayor de 18 años para chatear.",
            variant: "destructive",
          });
        }
        return;
      }
    }

    // ✅ CRÍTICO: Verificar que el usuario haya aceptado las reglas
    if (!hasAcceptedRules) {
      setShowChatRules(true);
      toast({
        title: "Reglas del Chat",
        description: "Debes aceptar las reglas del chat antes de enviar mensajes.",
        variant: "destructive",
      });
      return;
    }

    // 🔥 DESHABILITADO: Invitados pueden chatear sin límite de tiempo
    // if (user.isAnonymous && hasReachedOneHourLimit(user)) {
    //   const totalTime = getTotalEngagementTime(user);
    //   setEngagementTime(totalTime);
    //   setShowVerificationModal(true);
    //   markEngagementModalAsShown();
    //   return;
    // }

    // Verificar si el usuario está silenciado o baneado
    if (!user.isAnonymous && !user.isGuest) {
      const sanctions = await checkUserSanctions(user.id);
      
      if (sanctions.isBanned) {
        toast({
          title: "Acceso Denegado",
          description: sanctions.banType === 'perm_ban' 
            ? "Tu cuenta ha sido expulsada permanentemente."
            : "Tu cuenta está suspendida temporalmente.",
          variant: "destructive",
        });
        return;
      }

      // Verificar si está silenciado
      const isMuted = sanctions.sanctions.some(s => 
        s.type === SANCTION_TYPES.MUTE && s.status === 'active'
      );
      
      if (isMuted) {
        toast({
          title: "No puedes enviar mensajes",
          description: "Estás silenciado y no puedes enviar mensajes en este momento.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Enviar mensaje a Firestore con transacción si es anónimo
      await sendMessage(
        currentRoom,
        {
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
          isPremium: user.isPremium,
          content,
          type,
        },
        user.isAnonymous // Indica si es anónimo para usar transacción
      );

      // Track message sent
      trackMessageSent(currentRoom, user.id);


      // El listener de onSnapshot actualizará automáticamente los mensajes
    } catch (error) {
      console.error('Error sending message:', error);

      // 🔥 DESHABILITADO: No mostrar modal de tiempo
      // if (error.code === 'permission-denied') {
      //   const totalTime = getTotalEngagementTime(user);
      //   setEngagementTime(totalTime);
      //   setShowVerificationModal(true);
      //   toast({
      //     title: "¡Tiempo alcanzado!",
      //     description: `Ya llevas ${totalTime} en el sitio. ¡Regístrate gratis para continuar!`,
      //     variant: "default",
      //   });
      // } else {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      // }
    }
  };

  /**
   * 🤖 COMPANION AI: Handler para cuando usuario selecciona sugerencia
   */
  const handleSelectSuggestion = (suggestion) => {
    console.log(`✅ [COMPANION AI] Usuario seleccionó: "${suggestion}"`);
    setSuggestedMessage(suggestion);
    companionAI.hideWidget();
  };

  /**
   * Solicitud de chat privado
   */
  const handlePrivateChatRequest = (targetUser) => {
    if (user.isGuest) {
      toast({
        title: "Función Premium 💎",
        description: "Los chats privados requieren registro. ¡Es gratis y toma solo 30 segundos!",
        variant: "default",
      });
      return;
    }
    if (targetUser.userId === user.id) return;

    if (targetUser.userId === 'demo-user-123') {
      setActivePrivateChat({ user, partner: targetUser });
    } else {
      setPrivateChatRequest({ from: user, to: targetUser });
      toast({
        title: "Solicitud enviada",
        description: `Has invitado a ${targetUser.username} a un chat privado.`,
      });
    }
  };

  /**
   * Respuesta a solicitud de chat privado
   */
  const handlePrivateChatResponse = (accepted) => {
    if (accepted) {
      toast({
        title: "¡Chat privado aceptado!",
        description: `Ahora estás en un chat privado con ${privateChatRequest.to.username}.`,
      });
      setActivePrivateChat({
        user: user,
        partner: privateChatRequest.to
      });
    } else {
      toast({
        title: "Solicitud rechazada",
        description: `${privateChatRequest.to.username} ha rechazado la invitación.`,
        variant: "destructive"
      });
    }
    setPrivateChatRequest(null);
  };

  /**
   * Abrir chat privado desde notificaciones
   */
  const handleOpenPrivateChatFromNotification = ({ chatId, partner }) => {
    setActivePrivateChat({
      chatId,
      user: user,
      partner: partner
    });
  };

  // ✅ NOTA: El guard clause para user === null está ANTES (línea 79-81)
  // Este early return duplicado fue eliminado porque bloqueaba incorrectamente a guests
  // Guests (user.isGuest || user.isAnonymous) DEBEN poder acceder al chat

  return (
    <>
      <div className="h-screen flex overflow-hidden bg-background" style={{ height: '100dvh', maxHeight: '100dvh' }}>
        <ChatSidebar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatHeader
            currentRoom={currentRoom}
            onMenuClick={() => setSidebarOpen(true)}
            onOpenPrivateChat={handleOpenPrivateChatFromNotification}
            onSimulate={() => setShowScreenSaver(true)}
          />

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* Prompt de notificaciones cuando no hay usuarios conectados (excluyendo al usuario actual) */}
            {(() => {
              // Contar usuarios reales excluyendo al usuario actual
              const realUsersCount = roomUsers.filter(u => {
                const userId = u.userId || u.id;
                return userId !== user.id && 
                       userId !== 'system' && 
                       !userId?.startsWith('bot_') && 
                       !userId?.startsWith('static_bot_');
              }).length;
              
              return (
                <EmptyRoomNotificationPrompt
                  roomName={roomsData.find(r => r.id === currentRoom)?.name || currentRoom}
                  isVisible={realUsersCount === 0}
                />
              );
            })()}
            <ChatMessages
              messages={messages}
              currentUserId={user.id}
              onUserClick={setUserActionsTarget}
              onReport={setReportTarget}
              onPrivateChat={handlePrivateChatRequest}
              onReaction={handleMessageReaction}
              messagesEndRef={scrollManager.endMarkerRef}
              messagesContainerRef={scrollManager.containerRef}
              onScroll={companionAI.handleScroll}
              newMessagesIndicator={
                <NewMessagesIndicator
                  count={scrollManager.unreadCount}
                  onClick={scrollManager.scrollToBottom}
                  show={scrollManager.scrollState !== 'AUTO_FOLLOW' && scrollManager.unreadCount > 0}
                />
              }
            />
          </div>

          <TypingIndicator typingUsers={[]} />

          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            externalMessage={suggestedMessage}
          />
        </div>

        {/* 🤖 COMPANION AI Widget - Solo para usuarios anónimos */}
        {/* ⚠️ TEMPORALMENTE COMENTADO: Oculto hasta tener un mejor UX */}
        {/* {companionAI.shouldShow && (
          <CompanionWidget
            isVisible={companionAI.isVisible}
            companionMessage={companionAI.companionMessage}
            suggestions={companionAI.suggestions}
            loading={companionAI.loading}
            onAcceptHelp={companionAI.acceptHelp}
            onRejectHelp={companionAI.rejectHelp}
            onSelectSuggestion={handleSelectSuggestion}
            onShowWidget={companionAI.showWidget}
            onHideWidget={companionAI.hideWidget}
            shouldShow={companionAI.shouldShow}
          />
        )} */}

        {userActionsTarget && (
          <UserActionsModal
            user={userActionsTarget}
            onClose={() => setUserActionsTarget(null)}
            onViewProfile={() => setSelectedUser(userActionsTarget)}
          />
        )}

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onReport={() => {
              setReportTarget({ type: 'user', ...selectedUser });
              setSelectedUser(null);
            }}
          />
        )}

        {reportTarget && (
          <ReportModal
            target={reportTarget}
            onClose={() => setReportTarget(null)}
            isGuest={user.isGuest}
          />
        )}

        {privateChatRequest && (
          <PrivateChatRequestModal
            request={privateChatRequest}
            currentUser={user}
            onResponse={handlePrivateChatResponse}
            onClose={() => setPrivateChatRequest(null)}
          />
        )}

        {/* 🔥 DESHABILITADO: Modal de tiempo eliminado para invitados */}
        {/* {showVerificationModal && (
          <VerificationModal
            onClose={() => setShowVerificationModal(false)}
            engagementTime={engagementTime}
          />
        )} */}

        {activePrivateChat && (
          <PrivateChatWindow
            user={activePrivateChat.user}
            partner={activePrivateChat.partner}
            chatId={activePrivateChat.chatId}
            onClose={() => setActivePrivateChat(null)}
          />
        )}

        {showWelcomeTour && (
          <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />
        )}

        {/* 🎁 Modal de Bienvenida Premium */}
        <PremiumWelcomeModal
          open={showPremiumWelcome}
          onClose={handleClosePremiumWelcome}
        />

        <AgeVerificationModal
          isOpen={showAgeVerification}
          onConfirm={async (age, username, avatar) => {
            if (!user || !user.id) return;
            
            try {
              // Actualizar usuario anónimo con nombre y avatar
              if (user.isAnonymous) {
                const updated = await updateAnonymousUserProfile(username, avatar.url);
                if (!updated) {
                  toast({
                    title: "Error",
                    description: "No se pudo actualizar el perfil. Intenta nuevamente.",
                    variant: "destructive",
                  });
                  return;
                }
              }

              // Guardar edad en localStorage
              const ageKey = `age_verified_${user.id}`;
              localStorage.setItem(ageKey, String(age));
              
              // Limpiar flag de sesión para que no se vuelva a mostrar
              const hasShownKey = `age_modal_shown_${user.id}`;
              sessionStorage.removeItem(hasShownKey);
              
              setIsAgeVerified(true);
              setShowAgeVerification(false);
              
              console.log(`[AGE VERIFICATION] ✅ Usuario ${user.id} confirmó edad: ${age} años, nombre: ${username} - NO se mostrará más`);
              
              toast({
                title: "✅ Perfil completado",
                description: `Bienvenido ${username}! Recuerda seguir las reglas del chat.`,
              });
            } catch (error) {
              console.error('Error updating anonymous user:', error);
              toast({
                title: "Error",
                description: "No se pudo guardar el perfil. Intenta nuevamente.",
                variant: "destructive",
              });
            }
          }}
        />

        {/* ✅ NUEVO: Modal de reglas del chat */}
        <ChatRulesModal
          isOpen={showChatRules}
          onAccept={() => {
            // Guardar que el usuario aceptó las reglas
            if (user) {
              const rulesKey = `chat_rules_accepted_${user.id}`;
              localStorage.setItem(rulesKey, 'true');
              setHasAcceptedRules(true);
              setShowChatRules(false);
              
              toast({
                title: "✅ Reglas Aceptadas",
                description: "¡Bienvenido al chat! Ya puedes empezar a chatear.",
              });
            }
          }}
        />
      </div>

      {/* Protector de pantalla - Se muestra sobre todo */}
      {showScreenSaver && (
        <ScreenSaver onClose={() => setShowScreenSaver(false)} />
      )}
    </>
  );
};

export default ChatPage;
