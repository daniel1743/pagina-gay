import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import UserProfileModal from '@/components/chat/UserProfileModal';
import UserActionsModal from '@/components/chat/UserActionsModal';
import ReportModal from '@/components/chat/ReportModal';
import PrivateChatRequestModal from '@/components/chat/PrivateChatRequestModal';
import VerificationModal from '@/components/chat/VerificationModal';
import TypingIndicator from '@/components/chat/TypingIndicator';
import WelcomeTour from '@/components/onboarding/WelcomeTour';
import { PremiumWelcomeModal } from '@/components/chat/PremiumWelcomeModal';
import ChatRulesModal from '@/components/chat/ChatRulesModal';
import ChatLandingPage from '@/components/chat/ChatLandingPage';
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage, markMessagesAsRead } from '@/services/chatService';
import { joinRoom, leaveRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, updateUserActivity, cleanInactiveUsers, filterActiveUsers } from '@/services/presenceService';
// import { useBotSystem } from '@/hooks/useBotSystem'; // ⚠️ DESACTIVADO: Sistema de bots activos deshabilitado
import { sendModeratorWelcome } from '@/services/moderatorWelcome';
import { updateRoomAIActivity, stopRoomAIConversation, recordHumanMessage } from '@/services/multiProviderAIConversation';
import { trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { checkUserSanctions, SANCTION_TYPES } from '@/services/sanctionsService';
import { roomsData } from '@/config/rooms';
import { startEngagementTracking, hasReachedOneHourLimit, getTotalEngagementTime, hasSeenEngagementModal, markEngagementModalAsShown } from '@/services/engagementService';

const roomWelcomeMessages = {
  'conversas-libres': '¡Bienvenido a Conversas Libres! Habla de lo que quieras.',
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
  const { user, guestMessageCount, setGuestMessageCount, showWelcomeTour, setShowWelcomeTour } = useAuth();

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
  const [privateChatRequest, setPrivateChatRequest] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [showChatRules, setShowChatRules] = useState(false); // ✅ Modal de reglas
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false); // ✅ Flag de reglas aceptadas
  const [roomCounts, setRoomCounts] = useState({}); // Contadores de usuarios por sala
  const [engagementTime, setEngagementTime] = useState(''); // ⏱️ Tiempo total de engagement
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const aiActivatedRef = useRef(false); // Flag para evitar activaciones múltiples de IA
  const lastUserCountRef = useRef(0); // Para evitar ejecuciones innecesarias del useEffect
  const lastUserCountsRef = useRef({ total: 0, active: 0, real: 0 }); // Para rastrear conteos de usuarios

  // ========================================
  // 🔒 LANDING PAGE: Guard clause para user === null
  // ========================================
  // CRITICAL: Debe estar ANTES de cualquier lógica de Firestore/bots
  // NO afecta a guests (user.isGuest), solo a visitantes sin sesión
  // Muestra landing page completa para mejor SEO y conversión
  if (!user) {
    return <ChatLandingPage roomSlug={roomId} />;
  }

  // ✅ VALIDACIÓN: Usuarios registrados tienen acceso completo, anónimos solo a "conversas-libres"
  useEffect(() => {
    // ✅ SEO: Validar que la sala existe en roomsData (prevenir 404 en salas comentadas)
    const activeSalas = roomsData.map(room => room.id);
    if (!activeSalas.includes(roomId)) {
      toast({
        title: "Sala Temporalmente Cerrada",
        description: "Esta sala no está disponible por el momento. Te redirigimos a Conversas Libres.",
        variant: "default",
      });
      navigate('/chat/conversas-libres', { replace: true });
      return;
    }

    // ✅ NUEVA FUNCIONALIDAD: Permitir "conversas-libres" a usuarios anónimos/invitados
    if (user.isGuest || user.isAnonymous) {
      // Solo permitir acceso a "conversas-libres" (sala de prueba gratuita)
      if (roomId !== 'conversas-libres') {
        toast({
          title: "Sala Solo para Registrados 🔒",
          description: "Esta sala requiere registro. Prueba primero en 'Conversas Libres' o regístrate para acceso completo.",
          variant: "destructive",
          duration: 5000,
        });
        // Redirigir a conversas-libres en lugar de auth
        navigate('/chat/conversas-libres');
        return;
      }
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
      'conversas-libres': {
        title: 'Conversas Libres - Chat Gay Chile 💬 | Sala General LGBT+ | Chactivo',
        description: '💬 Sala de chat gay general Chile. Todos los temas bienvenidos: amistad, relaciones, gaming, cultura. Conversación libre, ambiente relajado. La sala más activa de Chactivo. ¡Regístrate en 30 segundos!',
        ogTitle: 'Conversas Libres | Chat Gay Chile General 💬',
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

    // Iniciar tracking al montar
    startEngagementTracking(user);

    // Verificar cada 10 segundos si se alcanzó el límite
    const checkInterval = setInterval(() => {
      if (hasReachedOneHourLimit(user) && !hasSeenEngagementModal()) {
        // Mostrar modal celebratorio
        const totalTime = getTotalEngagementTime(user);
        setEngagementTime(totalTime);
        setShowVerificationModal(true);
        markEngagementModalAsShown();
        console.log('🎉 ¡1 hora alcanzada! Mostrando modal celebratorio');
      }
    }, 10000); // Verificar cada 10 segundos

    return () => clearInterval(checkInterval);
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

  // Suscribirse a mensajes en tiempo real cuando cambia la sala
  useEffect(() => {
    // 🔒 SAFETY: Verificar que user existe (defensa en profundidad)
    // Aunque el guard clause previene esto, es buena práctica
    if (!user || !user.id) {
      console.warn('⚠️ [CHAT] useEffect de Firestore ejecutado sin user válido');
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

    // ⚠️ SISTEMA DE IA COMPLETAMENTE DESACTIVADO
    // 🤖 Iniciar sistema de conversación de IAs (10 personalidades)
    
    

    console.log(`🚫 [GEMINI AI] Sistema de conversación DESACTIVADO - No se generarán mensajes automáticos`);

    // Cleanup: desuscribirse y remover presencia cuando se desmonta o cambia de sala
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null; // Limpiar referencia
      }

      // 🤖 Detener conversaciones de IA
      stopRoomAIConversation(roomId);

      leaveRoom(roomId).catch(error => {
        // Ignorar errores al salir de la sala
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error leaving room:', error);
        }
      });
    };
  }, [roomId, user]);

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

    // ✅ SISTEMA DE IA GEMINI ACTIVO
    
    updateRoomAIActivity(roomId, realUserCount);
    console.log(`? [CHAT PAGE] ${realUserCount} usuarios reales detectados | Sistema Multi AI activo`);

  // Suscribirse a contadores de todas las salas (para mensajes contextuales)
  useEffect(() => {
    if (!user) return;

    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  // Navegar cuando cambia la sala actual
  useEffect(() => {
    if (currentRoom !== roomId) {
      navigate(`/chat/${currentRoom}`, { replace: true });
    }
  }, [currentRoom, roomId, navigate]);

  // Auto-scroll a nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // ⏱️ Validación: usuarios anónimos - límite de 1 hora
    if (user.isAnonymous && hasReachedOneHourLimit(user)) {
      const totalTime = getTotalEngagementTime(user);
      setEngagementTime(totalTime);
      setShowVerificationModal(true);
      markEngagementModalAsShown();
      return;
    }

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
      trackMessageSent(currentRoom);

      // ⚠️ SISTEMA DE IA DESACTIVADO - No generar respuestas automáticas
      // if (Math.random() < 0.3) {
      //   aiRespondToUser(currentRoom, content, user.username);
      // }

      // El listener de onSnapshot actualizará automáticamente los mensajes
    } catch (error) {
      console.error('Error sending message:', error);

      // Mensaje específico si se excedió el límite
      if (error.code === 'permission-denied') {
        const totalTime = getTotalEngagementTime(user);
        setEngagementTime(totalTime);
        setShowVerificationModal(true);
        toast({
          title: "¡Tiempo alcanzado!",
          description: `Ya llevas ${totalTime} en el sitio. ¡Regístrate gratis para continuar!`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Solicitud de chat privado
   */
  const handlePrivateChatRequest = (targetUser) => {
    if (user.isGuest) {
      setShowVerificationModal(true);
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
      <div className="h-screen flex overflow-hidden bg-background pt-16 sm:pt-20">
        <ChatSidebar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col">
          <ChatHeader
            currentRoom={currentRoom}
            onMenuClick={() => setSidebarOpen(true)}
            onOpenPrivateChat={handleOpenPrivateChatFromNotification}
          />

          <ChatMessages
            messages={messages}
            currentUserId={user.id}
            onUserClick={setUserActionsTarget}
            onReport={setReportTarget}
            onPrivateChat={handlePrivateChatRequest}
            onReaction={handleMessageReaction}
            messagesEndRef={messagesEndRef}
          />

          <TypingIndicator typingUsers={[]} />

          <ChatInput onSendMessage={handleSendMessage} />
        </div>

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

        {showVerificationModal && (
          <VerificationModal
            onClose={() => setShowVerificationModal(false)}
            engagementTime={engagementTime}
          />
        )}

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
    </>
  );
};

export default ChatPage;
