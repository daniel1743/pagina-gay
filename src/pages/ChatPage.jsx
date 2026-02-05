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
import PrivateChatInviteToast from '@/components/chat/PrivateChatInviteToast';
import VerificationModal from '@/components/chat/VerificationModal';
import TypingIndicator from '@/components/chat/TypingIndicator';
import WelcomeTour from '@/components/onboarding/WelcomeTour';
// ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
// import { PremiumWelcomeModal } from '@/components/chat/PremiumWelcomeModal';
// ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
// import ChatRulesModal from '@/components/chat/ChatRulesModal';
import AgeVerificationModal from '@/components/chat/AgeVerificationModal';
// ⚠️ ChatLandingPage COMENTADO - Experimento directo al chat sin landing
// import ChatLandingPage from '@/components/chat/ChatLandingPage';
// ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
// import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
// ⚠️ MODALES DE INSTRUCCIONES ELIMINADOS (17/01/2026) - A petición del usuario
// import EmptyRoomNotificationPrompt from '@/components/chat/EmptyRoomNotificationPrompt';
// import LoadingMessagesPrompt from '@/components/chat/LoadingMessagesPrompt';
import ReplyIndicator from '@/components/chat/ReplyIndicator';
// 🎯 OPIN Discovery Banner - Para que invitados descubran OPIN
import OpinDiscoveryBanner from '@/components/opin/OpinDiscoveryBanner';
// 📢 Telegram Banner - Promoción del grupo
import TelegramBanner from '@/components/ui/TelegramBanner';
// 🚀 ENGAGEMENT: Banner promocional Baúl + OPIN
import TarjetaPromoBanner from '@/components/chat/TarjetaPromoBanner';
import { BaulSection } from '@/components/baul';
import { useEngagementNudge } from '@/hooks/useEngagementNudge';
// ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
// import RulesBanner from '@/components/chat/RulesBanner';
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage, markMessagesAsRead, generateUUID } from '@/services/chatService';
import { joinRoom, leaveRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, updateUserActivity, cleanInactiveUsers, filterActiveUsers, subscribeToTypingUsers } from '@/services/presenceService';
import { validateMessage } from '@/services/antiSpamService';
import { auth, db } from '@/config/firebase'; // ✅ CRÍTICO: Necesario para obtener UID real de Firebase Auth
import { doc, getDoc } from 'firebase/firestore';
import { sendPrivateChatRequest, respondToPrivateChatRequest, subscribeToNotifications, markNotificationAsRead } from '@/services/socialService';
// ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
// import { sendModeratorWelcome } from '@/services/moderatorWelcome';
// ⚠️ BOTS ELIMINADOS (06/01/2026) - A petición del usuario
// import { checkAndSeedConversations } from '@/services/seedConversationsService';
import { trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { checkUserSanctions, SANCTION_TYPES } from '@/services/sanctionsService';
import { roomsData, canAccessRoom } from '@/config/rooms';
import { traceEvent, TRACE_EVENTS } from '@/utils/messageTrace';
import { startEngagementTracking, hasReachedOneHourLimit, getTotalEngagementTime, hasSeenEngagementModal, markEngagementModalAsShown } from '@/services/engagementService';
import { notificationSounds } from '@/services/notificationSounds';
import { monitorActivityAndSendVOC, resetVOCCooldown } from '@/services/vocService';
import '@/utils/chatDiagnostics'; // 🔍 Cargar diagnóstico en consola
import { 
  trackChatLoad, 
  trackMessagesLoad, 
  trackMessagesSubscription,
  trackMessageSent as trackMessageSentPerformance,
  startTiming,
  endTiming,
} from '@/utils/performanceMonitor';

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
  const { user, loading: authLoading, guestMessageCount, setGuestMessageCount, showWelcomeTour, setShowWelcomeTour, updateAnonymousUserProfile, signInAsGuest } = useAuth();

  // ✅ Estados y refs - DEBEN estar ANTES del early return
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  // ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
  // const [moderatorMessage, setModeratorMessage] = useState(null); // 👮 Mensaje del moderador (para RulesBanner)
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

  // 🔒 VERIFICAR ACCESO A LA SALA - Redirigir si no tiene permiso
  useEffect(() => {
    const referrer = document.referrer || '';
    const accessCheck = canAccessRoom(roomId, referrer);

    if (!accessCheck.allowed) {
      console.log(`[ROOM ACCESS] 🔒 Acceso denegado a sala "${roomId}": ${accessCheck.message}`);
      toast({
        title: '🔒 Sala no disponible',
        description: accessCheck.message,
        duration: 4000,
      });
      navigate(accessCheck.redirect, { replace: true });
    }
  }, [roomId, navigate]);

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
  const [dismissedPrivateChats, setDismissedPrivateChats] = useState(new Set()); // IDs de chats que el usuario cerró manualmente
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  // ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
  // const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [showChatRules, setShowChatRules] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false); // ✅ Modal de edad
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationModalFeature, setRegistrationModalFeature] = useState(null);
  // ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
  // const [showGuestNicknameModal, setShowGuestNicknameModal] = useState(false);
  const loadingTimeoutRef = useRef(null); // 🚀 Ref para timeout de loading
  const [isAgeVerified, setIsAgeVerified] = useState(false); // ✅ Flag mayor de edad
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [roomCounts, setRoomCounts] = useState({}); // Contadores de usuarios por sala
  const [engagementTime, setEngagementTime] = useState(''); // ⏱️ Tiempo total de engagement
  const [showScreenSaver, setShowScreenSaver] = useState(false); // 🔒 Protector de pantalla
  const [mostrarBaul, setMostrarBaul] = useState(false); // 📋 Baúl de tarjetas
  const [isInputFocused, setIsInputFocused] = useState(false); // 📝 Input focus state for scroll manager
  const [suggestedMessage, setSuggestedMessage] = useState(null); // 🤖 Mensaje sugerido por Companion AI
  const [replyTo, setReplyTo] = useState(null); // 💬 Mensaje al que se está respondiendo { messageId, username, content }
  const [isLoadingMessages, setIsLoadingMessages] = useState(true); // ⏳ Estado de carga de mensajes
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0); // 💬 Contador de respuestas no leídas
  const lastReadMessageIdRef = useRef(null); // Para rastrear último mensaje leído
  const unsubscribeRef = useRef(null);
  const aiActivatedRef = useRef(false); // Flag para evitar activaciones múltiples de IA
  const lastUserCountRef = useRef(0); // Para evitar ejecuciones innecesarias del useEffect
  // ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
  // const moderatorWelcomeSentRef = useRef(new Set()); // Para evitar mensajes duplicados del moderador
  const previousMessageCountRef = useRef(0); // Para detectar nuevos mensajes y reproducir sonido
  const lastUserCountsRef = useRef({ total: 0, active: 0, real: 0 }); // Para rastrear conteos de usuarios
  const previousRealUserCountRef = useRef(0); // Para detectar cuando usuarios se desconectan y reproducir sonido
  const deliveryTimeoutsRef = useRef(new Map()); // ⏱️ Timeouts para detectar fallos de entrega (20 segundos)
  const autoLoginAttemptedRef = useRef(false); // ✅ FIX: Prevenir múltiples intentos de auto-login
  const userRolesCacheRef = useRef(new Map()); // ✅ Cache de roles de usuarios para filtrar moderadores
  const checkingRolesRef = useRef(new Set()); // ✅ Flag para evitar consultas duplicadas de roles
  const roleCheckDebounceRef = useRef(null); // ✅ Debounce para consultas de roles
  const usersUpdateInProgressRef = useRef(false); // 🔒 CRÍTICO: Evitar loops infinitos en setRoomUsers
  const chatLoadStartTimeRef = useRef(null); // 📊 PERFORMANCE: Timestamp cuando inicia carga del chat
  const chatLoadTrackedRef = useRef(false); // 📊 PERFORMANCE: Flag para evitar tracking duplicado

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

  // 🚀 ENGAGEMENT: Toasts periódicos sobre actividad en tarjeta y OPIN
  const { detenerNudges } = useEngagementNudge();

  // ✅ VALIDACIÓN: Salas restringidas requieren autenticación
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return) para respetar reglas de hooks
  useEffect(() => {
    // Guard interno: solo ejecutar si hay user
    if (!user) return;
    // ✅ SEO: Validar que la sala existe en roomsData (prevenir 404 en salas comentadas)
    const activeSalas = roomsData.map(room => room.id);
    if (!activeSalas.includes(roomId)) {
      toast({
        title: "Sala Temporalmente Cerrada",
        description: "Esta sala no está disponible por el momento. Te redirigimos a Chat Principal.",
        variant: "default",
      });
      navigate('/chat/principal', { replace: true });
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
      navigate('/chat/principal', { replace: true });
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
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  useCanonical(`/chat/${roomId}`);

  // Track page view and room join
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
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
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  useEffect(() => {
    // Guard interno: solo para usuarios guest/anonymous
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

  // ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
  // 🎁 Mostrar modal de bienvenida premium solo una vez
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  // useEffect(() => {
  //   const hasSeenPremiumWelcome = localStorage.getItem('hasSeenPremiumWelcome');
  //
  //   if (!hasSeenPremiumWelcome) {
  //     // Mostrar después de 2 segundos de entrar a la sala
  //     const timer = setTimeout(() => {
  //       setShowPremiumWelcome(true);
  //     }, 2000);
  //
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  // const handleClosePremiumWelcome = () => {
  //   setShowPremiumWelcome(false);
  //   localStorage.setItem('hasSeenPremiumWelcome', 'true');
  // };

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

    // ✅ Verificar si viene desde landing page (sessionStorage tiene prioridad)
    const ageVerifiedFromLanding = sessionStorage.getItem(`age_verified_${user.username}`) === 'true';
    // ⚠️ MODAL COMENTADO - Ya no verificamos reglas
    // const rulesAcceptedFromLanding = sessionStorage.getItem(`rules_accepted_${user.username}`) === 'true';

    // ⚡ PERSISTENCIA: Verificar si el usuario invitado tiene datos guardados
    if (user.isGuest || user.isAnonymous) {
      // Buscar datos guardados por nickname
      const activeGuests = JSON.parse(localStorage.getItem('active_guests') || '[]');
      if (activeGuests.length > 0) {
        const lastGuest = activeGuests[0];
        const guestDataKey = `guest_data_${lastGuest.username.toLowerCase().trim()}`;
        const savedData = localStorage.getItem(guestDataKey);
        
        if (savedData) {
          try {
            const saved = JSON.parse(savedData);
            // Si el username coincide, restaurar verificación de edad
            if (saved.username && (saved.username.toLowerCase() === user.username.toLowerCase() || saved.uid === user.id)) {
              // Verificar por UID primero
              let storedAge = localStorage.getItem(`age_verified_${saved.uid || user.id}`);
              
              // Si no hay por UID, verificar por username
              if (!storedAge) {
                storedAge = localStorage.getItem(`age_verified_${saved.username.toLowerCase().trim()}`);
              }
              
              // Si hay edad guardada en los datos del guest
              if (!storedAge && saved.age) {
                storedAge = String(saved.age);
              }
              
              if (storedAge && Number(storedAge) >= 18) {
                setIsAgeVerified(true);
                setShowAgeVerification(false);
                // console.log(`[AGE VERIFICATION] ✅ Usuario invitado ${user.username} ya verificó edad en sesión anterior`);
                return; // No mostrar modal
              }
            }
          } catch (e) {
            console.debug('[AGE VERIFICATION] Error verificando datos guardados:', e);
          }
        }
      }
    }

    // ✅ Si viene desde landing, NO mostrar modales
    if (ageVerifiedFromLanding) {
      setIsAgeVerified(true);
      setShowAgeVerification(false);
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem(`age_verified_${user.id}`, '18');
      // console.log(`[AGE VERIFICATION] ✅ Usuario ${user.username} ya verificó edad en landing page`);
    } else {
      // ✅ SI ES INVITADO: Auto-verificar (asumimos +18 porque ya pasó formulario de entrada)
      if (user.isGuest || user.isAnonymous) {
        // console.log(`[AGE VERIFICATION] ✅ Usuario invitado ${user.username} - Auto-verificado (formulario de entrada simplificado)`);
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        localStorage.setItem(`age_verified_${user.id}`, '18');
        return; // NO mostrar modal adicional - CERO FRICCIÓN
      }

      // ✅ USUARIOS REGISTRADOS (NO invitados, NO anónimos): Auto-verificar SIEMPRE
      // Los usuarios registrados YA completaron su perfil (username, email, avatar) al registrarse
      // Por lo tanto, NO deben ver el modal de invitado (que pide edad, username y avatar)
      // console.log(`[AGE VERIFICATION] ✅ Usuario REGISTRADO ${user.username} (${user.id}) - Auto-verificado (ya tiene cuenta)`);
        setIsAgeVerified(true);
        setShowAgeVerification(false);

      // Guardar en localStorage para futuras sesiones
      const ageKey = `age_verified_${user.id}`;
      if (!localStorage.getItem(ageKey)) {
        localStorage.setItem(ageKey, '18'); // Asumir +18 para usuarios registrados
      }
    }

    // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
    // Ya no verificamos ni mostramos el modal de reglas
    // if (rulesAcceptedFromLanding) {
    //   setHasAcceptedRules(true);
    //   setShowChatRules(false);
    //   localStorage.setItem(`chat_rules_accepted_${user.id}`, 'true');
    //   console.log(`[CHAT RULES] ✅ Usuario ${user.username} ya aceptó reglas en landing page`);
    // } else {
    //   const rulesKey = `chat_rules_accepted_${user.id}`;
    //   const hasAccepted = localStorage.getItem(rulesKey) === 'true';
    //
    //   if (!hasAccepted) {
    //     setShowChatRules(true);
    //     setHasAcceptedRules(false);
    //   } else {
    //     setHasAcceptedRules(true);
    //   }
    // }
  }, [user]);

  // 🔊 INICIALIZACIÓN DE SONIDOS: Forzar inicialización al montar componente
  useEffect(() => {
    if (!user) return;

    // console.log('[CHAT] 🔊 Inicializando sistema de sonidos...');

    // Intentar inicializar inmediatamente (funcionará si el usuario ya interactuó)
    const initialized = notificationSounds.init();

    if (!initialized) {
      // console.log('[CHAT] ⏳ AudioContext requiere interacción del usuario, esperando...');

      // Si no se pudo inicializar, agregar listener para el primer click/touch
      const handleFirstInteraction = () => {
        // console.log('[CHAT] 👆 Primera interacción detectada, inicializando sonidos...');
        const success = notificationSounds.init();
        if (success) {
          // console.log('[CHAT] ✅ Sistema de sonidos listo');
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
      // console.log('[CHAT] ✅ Sistema de sonidos inicializado correctamente');
    }
  }, [user]);

  // 🚀 EXPERIMENTO: Safety timeout - Forzar loading a false después de 3 segundos si no hay usuario
  // Esto evita el loading infinito cuando el usuario no está autenticado
  useEffect(() => {
    if (!user && isLoadingMessages) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('🚀 [CHAT] Safety timeout: Forzando loading a false para usuarios no autenticados');
        setIsLoadingMessages(false);
      }, 3000);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, isLoadingMessages]);

  // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes ANTES de verificar edad
  // Esto permite que los mensajes carguen instantáneamente, incluso con usuario temporal
  // 🚀 EXPERIMENTO: Permitir suscripción SIN usuario para ver mensajes inmediatamente
  useEffect(() => {
    setCurrentRoom(roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al cambiar de sala
    aiActivatedRef.current = false; // Resetear flag de IA cuando cambia de sala

    // 📊 PERFORMANCE MONITOR: Iniciar medición de carga del chat
    chatLoadStartTimeRef.current = performance.now();
    chatLoadTrackedRef.current = false; // Reset tracking flag
    startTiming('chatLoad', { roomId });
    startTiming('messagesSubscription', { roomId }); // Iniciar tracking de suscripción

    // 🧹 Limpiar usuarios inactivos al entrar a la sala (solo si hay usuario)
    if (user?.id) {
      cleanInactiveUsers(roomId);
      // Registrar presencia del usuario en la sala
      joinRoom(roomId, user);
    }

    // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes SIN esperar verificación de edad
    // 🔒 CRITICAL: Limpiar suscripción anterior si existe
    if (unsubscribeRef.current) {
      // console.log('🧹 [CHAT] Limpiando suscripción anterior antes de crear nueva');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // 📊 LÍMITE DE MENSAJES según tipo de usuario
    // - No logueados (guest/anonymous): 50 mensajes
    // - Logueados (registrados): 100 mensajes
    const messageLimit = (user && !user.isGuest && !user.isAnonymous) ? 100 : 50;
    console.log(`📊 [CHAT] Límite de mensajes para ${user?.username}: ${messageLimit} (${user?.isGuest || user?.isAnonymous ? 'invitado' : 'registrado'})`);

    // console.log('📡 [CHAT] Suscribiéndose a mensajes INMEDIATAMENTE para sala:', roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al iniciar suscripción

    // ⚡ TIMEOUT DE SEGURIDAD: Desactivar loading después de 2 segundos
    // Optimizado: Firebase ahora usa solo memoria (sin IndexedDB) = respuesta más rápida
    const loadingTimeoutId = setTimeout(() => {
      console.warn('⏰ [CHAT] Timeout de carga alcanzado (2s) - desactivando loading de seguridad');
      setIsLoadingMessages(false);
    }, 2000);

    console.log(`[CHAT PAGE] 🚀 Llamando a subscribeToRoomMessages para sala ${roomId} con límite ${messageLimit}`);
    const unsubscribeMessages = subscribeToRoomMessages(roomId, (newMessages) => {
      console.log(`[CHAT PAGE] 📨 Callback ejecutado con ${newMessages.length} mensajes para sala ${roomId}`);
      if (newMessages.length === 0) {
        console.warn(`[CHAT PAGE] ⚠️ ARRAY VACÍO recibido en callback para sala ${roomId} - esto NO debería pasar si la sala tiene mensajes`);
      }
      // ✅ Limpiar timeout cuando llegan los mensajes
      clearTimeout(loadingTimeoutId);
      
      // ⏳ Marcar como cargado cuando llegan los mensajes
      setIsLoadingMessages(false);
      
      // 🔍 DEBUG: Loguear siempre en desarrollo para diagnóstico
      if (import.meta.env.DEV) {
        console.log('[CHAT PAGE] 📨 Mensajes recibidos del listener:', {
          count: newMessages.length,
          roomId,
          timestamp: new Date().toISOString(),
          firstMessage: newMessages[0]?.content?.substring(0, 50) || 'N/A'
        });
      }

      // 📊 PERFORMANCE MONITOR: Registrar carga completa del chat (solo la primera vez)
      if (!chatLoadTrackedRef.current && chatLoadStartTimeRef.current && newMessages.length > 0) {
        trackChatLoad(chatLoadStartTimeRef.current);
        chatLoadTrackedRef.current = true; // Marcar como ya tracked
        
        // 📊 PERFORMANCE MONITOR: Completar tracking de carga
        endTiming('chatLoad', { roomId, messageCount: newMessages.length });
        trackMessagesLoad(chatLoadStartTimeRef.current, newMessages.length);
        endTiming('messagesSubscription', { roomId, messageCount: newMessages.length });
      }

      // ⚠️ VENTANA DE MODERACIÓN COMENTADA (06/01/2026) - A petición del usuario
      // 👮 SEPARAR mensajes del moderador (para RulesBanner) del resto
      // const moderatorMsg = newMessages.find(m => m.userId === 'system_moderator');
      // const regularMessages = newMessages.filter(m => m.userId !== 'system_moderator');
      const regularMessages = newMessages; // ✅ Todos los mensajes son regulares ahora

      // 🔍 TRACE: Estado actualizado con mensajes recibidos
      traceEvent(TRACE_EVENTS.STATE_UPDATED, {
        roomId,
        messageCount: regularMessages.length,
        newMessageIds: regularMessages.slice(-5).map(m => m.id), // Últimos 5 IDs
      });
      
      // 🔍 TRACE: Verificar si hay mensajes optimistas que deben ser reemplazados
      regularMessages.forEach(msg => {
        if (msg.clientId) {
          // Buscar si hay un mensaje optimista con el mismo clientId
          const hasOptimistic = messages.some(m => 
            m.clientId === msg.clientId && m._optimistic
          );
          
          if (hasOptimistic) {
            traceEvent(TRACE_EVENTS.OPTIMISTIC_MESSAGE_REPLACED, {
              traceId: msg.clientId,
              optimisticId: messages.find(m => m.clientId === msg.clientId && m._optimistic)?.id,
              realId: msg.id,
              userId: msg.userId,
              roomId,
            });
          }
        }
      });

      // Si hay mensaje del moderador, guardarlo en estado separado (solo una vez)
      // if (moderatorMsg) {
      //   setModeratorMessage(prev => prev || moderatorMsg); // Solo setear si no existe
      // }

      // 🔊 Reproducir sonido si llegaron mensajes nuevos (no en carga inicial)
      if (previousMessageCountRef.current > 0 && regularMessages.length > previousMessageCountRef.current) {
        const newMessageCount = regularMessages.length - previousMessageCountRef.current;
        // Reproducir sonido por cada mensaje nuevo (el servicio agrupa automáticamente si son 4+)
        // 🔊 Reproducir sonido: ENVOLVER EN TRY/CATCH para evitar que errores de audio bloqueen la UI
        try {
        for (let i = 0; i < newMessageCount; i++) {
          notificationSounds.playMessageSound();
          }
        } catch (e) {
          console.warn('[CHAT] 🔇 Error reproduciendo sonido (UI segura):', e);
        }
      }

      // Actualizar contador de mensajes (solo regulares)
      previousMessageCountRef.current = regularMessages.length;

      // 🚀 OPTIMISTIC UI: Fusionar mensajes reales con optimistas y DEDUPLICAR
      // 💬 NOTA: La detección de respuestas se hace en el useEffect separado para mejor rendimiento
      setMessages(prevMessages => {
        const optimisticMessages = prevMessages.filter(m => m._optimistic);
        const mergedMessages = [...regularMessages]; // ✅ Solo mensajes regulares (sin moderador)

        // ⚡ DEDUPLICACIÓN ULTRA-OPTIMIZADA: Sin parpadeos, sin reordenamiento
        if (optimisticMessages.length > 0) {
          // ⚡ OPTIMIZACIÓN: Construir mapas de búsqueda una sola vez (O(1) lookup)
          const realClientIds = new Set(
            regularMessages.map(m => m.clientId).filter(Boolean)
          );
          const realIds = new Set(regularMessages.map(m => m.id));

          // ⚡ DEDUPLICACIÓN RÁPIDA: Filtrar optimistas que ya tienen match
          const remainingOptimistic = optimisticMessages.filter(optMsg => {
            // Prioridad 1: clientId (más confiable, evita duplicados)
            if (optMsg.clientId && realClientIds.has(optMsg.clientId)) {
              // ✅ DETECTAR ENTREGA: Si el mensaje real llegó, marcar como 'delivered'
              const realMessage = regularMessages.find(m => m.clientId === optMsg.clientId);
              if (realMessage && optMsg.userId === user?.id) {
                // Este es nuestro mensaje que fue recibido por otro dispositivo
                // Marcar como 'delivered' (doble check azul)
                optMsg.status = 'delivered';
                optMsg._deliveredAt = Date.now();
              }
              return false; // Ya llegó el real, eliminar optimista
            }
            // Prioridad 2: _realId (compatibilidad con sistema anterior)
            if (optMsg._realId && realIds.has(optMsg._realId)) {
              // ✅ DETECTAR ENTREGA: Si el mensaje real llegó, marcar como 'delivered'
              const realMessage = regularMessages.find(m => m.id === optMsg._realId);
              if (realMessage && optMsg.userId === user?.id) {
                optMsg.status = 'delivered';
                optMsg._deliveredAt = Date.now();
              }
              return false; // Ya llegó el real
            }
            return true; // Mantener este optimista (aún no llegó el real)
          });

          // ⚡ FUSIÓN: Agregar optimistas restantes (mantener orden temporal)
          if (remainingOptimistic.length > 0) {
            mergedMessages.push(...remainingOptimistic);
          }
        }
        
        // ✅ ACTUALIZAR ESTADO DE ENTREGA: Marcar mensajes propios como 'delivered' si fueron recibidos
        // Esto detecta cuando nuestro mensaje es recibido por otro dispositivo
        const updatedMessages = mergedMessages.map(msg => {
          // Solo procesar mensajes propios que ya están en 'sent' o tienen _realId
          if (msg.userId === user?.id && (msg.status === 'sent' || msg._realId) && !msg._deliveredAt) {
            // Verificar si este mensaje fue recibido (existe en regularMessages)
            // Un mensaje está "entregado" cuando aparece en regularMessages (fue recibido por otro dispositivo)
            const wasReceived = regularMessages.some(realMsg => {
              // Buscar por clientId (más confiable)
              if (msg.clientId && realMsg.clientId === msg.clientId) return true;
              // Buscar por _realId o id
              if (msg._realId && realMsg.id === msg._realId) return true;
              if (msg.id && realMsg.id === msg.id) return true;
              return false;
            });
            
            if (wasReceived) {
              // ✅ MENSAJE ENTREGADO: Marcar como 'delivered' (doble check azul)
              // Limpiar timeout si existe (mensaje entregado antes de 20s)
              const timeoutId = deliveryTimeoutsRef.current.get(msg.id);
              if (timeoutId) {
                clearTimeout(timeoutId);
                deliveryTimeoutsRef.current.delete(msg.id);
              }
              
              // También limpiar por _realId si existe
              if (msg._realId) {
                const timeoutId2 = deliveryTimeoutsRef.current.get(msg._realId);
                if (timeoutId2) {
                  clearTimeout(timeoutId2);
                  deliveryTimeoutsRef.current.delete(msg._realId);
                }
              }
              
              return {
                ...msg,
                status: 'delivered',
                _deliveredAt: Date.now()
              };
            }
          }
          return msg;
        });
        
        // ⚡ ORDENAMIENTO: Por timestampMs (mantener posición correcta, sin moverse)
        // ⚡ FIX: Mensajes con timestampMs null se ordenan al final temporalmente
        updatedMessages.sort((a, b) => {
          const timeA = a.timestampMs ?? (a.timestamp ? new Date(a.timestamp).getTime() : null);
          const timeB = b.timestampMs ?? (b.timestamp ? new Date(b.timestamp).getTime() : null);
          
          // Si ambos tienen timestamp, ordenar normalmente
          if (timeA !== null && timeB !== null) {
          return timeA - timeB;
          }
          // Si solo uno tiene timestamp, el que tiene timestamp va primero
          if (timeA !== null && timeB === null) return -1;
          if (timeA === null && timeB !== null) return 1;
          // Si ambos son null, mantener orden de llegada (por índice)
          return 0;
        });
        
        // ⚡ DEDUPLICACIÓN FINAL: Eliminar duplicados por ID (evitar mensajes duplicados)
        const uniqueMessages = [];
        const seenIds = new Set();
        
        for (const msg of updatedMessages) {
          if (seenIds.has(msg.id)) {
            continue; // Saltar duplicado
          }
          uniqueMessages.push(msg);
          seenIds.add(msg.id);
        }
        
        return uniqueMessages;
      });

    }, messageLimit); // ✅ Pasar límite de mensajes según tipo de usuario

    // 🤖 Suscribirse a usuarios de la sala (para sistema de bots)
    // ⚠️ TYPING STATUS: DESHABILITADO - causaba errores (setTypingUsers no definido)
    // TODO: Re-habilitar cuando se arregle
    /*
    const unsubscribeTyping = subscribeToTypingUsers(roomId, user?.id || '', (typing) => {
      setTypingUsers(typing);
    });
    */

    const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
      // 🔒 CRÍTICO: Evitar procesamiento si ya hay una actualización en progreso (previene loops infinitos)
      if (usersUpdateInProgressRef.current) {
        return; // Ignorar este callback para evitar re-renders masivos
      }
      
      // ✅ Filtrar solo usuarios activos (<5min inactividad)
      const activeUsers = filterActiveUsers(users);
      
      // ✅ OCULTAR MODERADORES: Filtrar usuarios con rol admin o moderator
      // 🔒 CRÍTICO: Evitar consultas masivas con debounce y flags de control
      const filteredUsers = [];
      const usersToCheck = [];
      
      // Primero filtrar bots y preparar lista de usuarios a verificar
      for (const u of activeUsers) {
        const userId = u.userId || u.id;
        
        // Excluir bots y sistema
        if (userId === 'system' || 
            userId?.startsWith('bot_') || 
            userId?.startsWith('static_bot_')) {
          continue;
        }
        
        // Verificar cache primero
        const cachedRole = userRolesCacheRef.current.get(userId);
        if (cachedRole === 'admin' || cachedRole === 'administrator' || cachedRole === 'moderator') {
          continue; // Ocultar moderador
        }
        
        if (cachedRole === 'user' || cachedRole === null) {
          // Usuario normal, incluir
          filteredUsers.push(u);
        } else {
          // No está en cache, agregar a lista para verificar (solo si no está siendo verificado)
          if (!checkingRolesRef.current.has(userId)) {
            usersToCheck.push({ user: u, userId });
          } else {
            // Ya está siendo verificado, incluir temporalmente hasta que termine
            filteredUsers.push(u);
          }
        }
      }
      
      // ❌ DESHABILITADO TEMPORALMENTE - Loop infinito de Firebase (07/01/2026)
      // getDoc queries masivas sin throttle efectivo causaban lecturas infinitas
      // Cada cambio en roomPresence disparaba consultas masivas
      // TODO: Re-habilitar con mejor estrategia (verificar roles en batch 1 vez al día)

      // ✅ HOTFIX: Incluir TODOS los usuarios sin verificar roles
      // Asumir que todos son usuarios normales temporalmente
      const finalUsers = [...filteredUsers, ...usersToCheck.map(({ user }) => user)];

      // Actualizar contadores
      const realUsers = finalUsers;

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
        // 🔊 Reproducir sonido de INGRESO si un usuario real se conectó
        if (previousRealUserCountRef.current > 0 && currentCounts.real > previousRealUserCountRef.current) {
          notificationSounds.playUserJoinSound();
        }

        // 🔊 Reproducir sonido de SALIDA si un usuario real se desconectó
        if (previousRealUserCountRef.current > 0 && currentCounts.real < previousRealUserCountRef.current) {
          notificationSounds.playDisconnectSound();
        }

        // Actualizar contador de usuarios reales
        previousRealUserCountRef.current = currentCounts.real;
        lastUserCountsRef.current = currentCounts;
      }

      // 🔒 CRÍTICO: Solo actualizar estado si realmente cambió (evitar re-renders innecesarios)
      usersUpdateInProgressRef.current = true; // ✅ Marcar en progreso
      setRoomUsers(prevUsers => {
        // Comparar por IDs para evitar actualizaciones si los usuarios son los mismos
        const prevIds = new Set(prevUsers.map(u => (u.userId || u.id)));
        const newIds = new Set(finalUsers.map(u => (u.userId || u.id)));

        if (prevIds.size !== newIds.size) {
          setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
          return finalUsers;
        }

        for (const id of prevIds) {
          if (!newIds.has(id)) {
            setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
            return finalUsers;
          }
        }

        // Si son los mismos usuarios, no actualizar (evitar re-render)
        setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
        return prevUsers;
      });

      // ❌ COMENTADO - Loop infinito de getDoc queries
      // if (roleCheckDebounceRef.current) {
      //   clearTimeout(roleCheckDebounceRef.current);
      //   roleCheckDebounceRef.current = null;
      // }
      //
      // if (usersToCheck.length > 0) {
      //   roleCheckDebounceRef.current = setTimeout(() => {
      //     usersToCheck.forEach(({ userId }) => {
      //       checkingRolesRef.current.add(userId);
      //     });
      //
      //     Promise.all(
      //       usersToCheck.map(async ({ user, userId }) => {
      //         try {
      //           const userDocRef = doc(db, 'users', userId);
      //           const userDoc = await getDoc(userDocRef);
      //           // ...
      //         } catch (error) {
      //           // ...
      //         }
      //       })
      //     ).then(checkedUsers => {
      //       // ...
      //     }).catch(error => {
      //       // ...
      //     });
      //   }, 500);
      // }
    });

    // Guardar funciones de desuscripción
    const baseCleanup = () => {
      // ✅ Limpiar timeout de loading
      clearTimeout(loadingTimeoutId);

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
      // ⚠️ TYPING: Comentado porque subscription está deshabilitada
      /*
      try {
        if (unsubscribeTyping) unsubscribeTyping();
      } catch (error) {
        // Ignorar errores de cancelación (AbortError es normal)
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error canceling typing subscription:', error);
        }
      }
      */
    };
    
    unsubscribeRef.current = baseCleanup;

    // ⚠️ TOAST DE BIENVENIDA ELIMINADO (06/01/2026) - A petición del usuario
    // Toast de bienvenida
    // toast({
    //   title: `👋 ¡${user.username} se ha unido a la sala!`,
    //   description: `Estás en #${roomId}`,
    // });

    // 👮 Mensaje de bienvenida del moderador (solo una vez)
    // ⚠️ MODERADOR COMENTADO (06/01/2026) - Desactivado a petición del usuario
    /*
    const moderatorKey = `${roomId}_${user.id}`;
    const hasSeenModerator = sessionStorage.getItem(`moderator_welcome_${moderatorKey}`);
    
    // Verificar también en el ref para evitar duplicados en el mismo render
    if (!hasSeenModerator && !moderatorWelcomeSentRef.current.has(moderatorKey)) {
      // Marcar inmediatamente para evitar duplicados
      moderatorWelcomeSentRef.current.add(moderatorKey);
      sessionStorage.setItem(`moderator_welcome_${moderatorKey}`, 'true');
      
      setTimeout(() => {
        // ✅ FIX: Validar que username existe antes de enviar bienvenida
        if (user?.username) {
        sendModeratorWelcome(roomId, user.username);
        }
      }, 2000); // Enviar después de 2 segundos
    }
    */

    // ⚠️ BOTS ELIMINADOS (06/01/2026) - A petición del usuario
    // 🌱 Sembrar conversaciones genuinas en "Chat Principal"
    // checkAndSeedConversations(roomId);


    // Cleanup: desuscribirse y remover presencia cuando se desmonta o cambia de sala
    return () => {
      // 🔒 CRÍTICO: Limpiar debounce de consultas de roles
      if (roleCheckDebounceRef.current) {
        clearTimeout(roleCheckDebounceRef.current);
        roleCheckDebounceRef.current = null;
      }
      
      // Limpiar flags de verificación de roles
      checkingRolesRef.current.clear();
      
      // 🔒 CRÍTICO: Limpiar flag de actualización en progreso
      usersUpdateInProgressRef.current = false;
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null; // Limpiar referencia
      }

      // Solo llamar leaveRoom si había un usuario (evitar errores)
      if (user?.id) {
        leaveRoom(roomId).catch(error => {
          // Ignorar errores al salir de la sala
          if (error.name !== 'AbortError' && error.code !== 'cancelled') {
            console.error('Error leaving room:', error);
          }
        });
      }
    };
  }, [roomId, user?.id]); // ✅ F3: user?.id en vez de user (evita re-suscripciones por cambio de referencia)

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
      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola (loop durante carga)
      // console.warn('? [CHAT PAGE] Usuario no disponible, no se puede activar IA');
      return;
    }

    const realUserCount = countRealUsers(roomUsers);
    
    // ? Solo ejecutar cuando realmente cambia el número de usuarios reales
    if (realUserCount === lastUserCountRef.current) {
      return; // No hacer nada si el conteo no cambió
    }
    
    lastUserCountRef.current = realUserCount;

  }, [roomUsers.length, roomId, user?.id]); // 🔒 CRÍTICO: user?.id en vez de user (evita loops por cambio de referencia de objeto)

  // ⚠️ DESACTIVADO TEMPORALMENTE: Contadores de salas (causa consumo excesivo)
  // Solo necesitamos el chat básico funcionando
  // useEffect(() => {
  //   if (!user?.id) return;
  //   const priorityRooms = ['principal'];
  //   const unsubscribe = subscribeToMultipleRoomCounts(priorityRooms, (counts) => {
  //     setRoomCounts(counts);
  //   });
  //   return () => unsubscribe();
  // }, [user?.id]);

  // ✅ Suscribirse a notificaciones de chat privado
  useEffect(() => {
    if (!user?.id || user.isGuest || user.isAnonymous) return;

    const unsubscribe = subscribeToNotifications(user.id, (notifications) => {
      // Buscar solicitudes de chat privado pendientes
      const pendingRequests = notifications.filter(n => 
        n.type === 'private_chat_request' && n.status === 'pending'
      );

      if (pendingRequests.length > 0 && !privateChatRequest) {
        const latestRequest = pendingRequests[0];
        // Establecer la solicitud en el estado para mostrar el toast/modal
        setPrivateChatRequest({
          from: {
            userId: latestRequest.from,
            username: latestRequest.fromUsername,
            avatar: latestRequest.fromAvatar,
            isPremium: latestRequest.fromIsPremium,
          },
          to: user,
          notificationId: latestRequest.id
        });
      }

      // Buscar notificaciones de chat aceptado (solo si no hay chat activo y no fue cerrado manualmente)
      const acceptedChats = notifications.filter(n => 
        n.type === 'private_chat_accepted' && !dismissedPrivateChats.has(n.chatId)
      );

      if (acceptedChats.length > 0 && !activePrivateChat) {
        const latestAccepted = acceptedChats[0];
        setActivePrivateChat({
          user: user,
          partner: {
            userId: latestAccepted.from,
            username: latestAccepted.fromUsername,
            avatar: latestAccepted.fromAvatar,
            isPremium: latestAccepted.fromIsPremium,
          },
          chatId: latestAccepted.chatId
        });
        
        // Marcar la notificación como leída para evitar que se vuelva a abrir
        markNotificationAsRead(user.id, latestAccepted.id).catch(err => {
          console.error('Error marking notification as read:', err);
        });
      }
    });

    return () => unsubscribe();
  }, [user?.id, privateChatRequest, activePrivateChat, dismissedPrivateChats]); // 🔒 CRÍTICO: user?.id en vez de user (evita loops)

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
    // ⚠️ RESTRICCIÓN: Usuarios no autenticados NO pueden dar reacciones
    // ⚠️ RESTRICCIÓN: Usuarios no autenticados NO pueden dar reacciones
    if (!auth.currentUser || user?.isGuest || user?.isAnonymous) {
      toast({
        title: "Regístrate para reaccionar",
        description: "Los usuarios no registrados no pueden dar likes. Regístrate para interactuar más.",
        variant: "default",
        duration: 4000,
        action: {
          label: "Registrarse",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    try {
      await addReactionToMessage(currentRoom, messageId, reaction);
      // El listener de onSnapshot actualizará automáticamente los mensajes
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "No pudimos agregar la reacción",
        description: "Toca para reintentar",
        variant: "destructive",
      });
    }
  };

  /**
   * 💬 REPLY: Handler cuando usuario presiona botón de responder
   */
  const handleReply = (messageData) => {
    setReplyTo(messageData);
    // Hacer focus en el input para que el usuario empiece a escribir
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder="Escribe un mensaje..."]');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  /**
   * 💬 REPLY: Handler para cancelar respuesta
   */
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  /**
   * Enviar mensaje
   * ✅ Guarda en Firestore en tiempo real
   * ✅ Validación para usuarios invitados (máx 10 mensajes)
   * ✅ Contador persistente en Firestore para anónimos
   * 🤖 Activa respuesta de bots si están activos
   */
  const handleSendMessage = async (content, type = 'text', replyData = null) => {
    // ⚠️ Si no hay usuario, redirigir a registro normal
    if (!user || !user.id) {
      navigate('/auth', { state: { redirectTo: `/chat/${roomId}` } });
      return;
    }

    // ✅ PERMITIR USUARIOS NO AUTENTICADOS (período de captación - 5 días)
    // Fecha de lanzamiento: 2026-01-06 (ajustar según tu fecha real)
    const LAUNCH_DATE = new Date('2026-01-06').getTime();
    const CAPTURE_PERIOD_DAYS = 5;
    const CAPTURE_PERIOD_MS = CAPTURE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const isWithinCapturePeriod = Date.now() < (LAUNCH_DATE + CAPTURE_PERIOD_MS);
    
    // Si estamos dentro del período de captación, permitir usuarios sin auth
    if (!auth.currentUser && !isWithinCapturePeriod) {
      toast({
        title: "¿Disfrutas nuestra app?",
        description: "Regístrate ahora para seguir chateando y desbloquear todas las funciones.",
        variant: "default",
        duration: 6000,
        action: {
          label: "Registrarse",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }
    
    // Si estamos dentro del período de captación pero no hay auth, continuar (permitir usuario no autenticado)
    // Si hay auth, validar que esté disponible
    if (auth.currentUser) {
      // Esperar hasta 3 segundos a que auth.currentUser esté disponible (solo si existe)
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!auth.currentUser && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
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

    // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
    // Ya no verificamos si el usuario aceptó las reglas antes de enviar mensajes
    // if (!hasAcceptedRules) {
    //   setShowChatRules(true);
    //   toast({
    //     title: "Reglas del Chat",
    //     description: "Debes aceptar las reglas del chat antes de enviar mensajes.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

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

    // 🔍 TRACE: Usuario escribió mensaje
    traceEvent(TRACE_EVENTS.USER_INPUT_TYPED, {
      content: content.substring(0, 50),
      type,
      userId: user.id,
      username: user.username,
      roomId: currentRoom,
    });

    // 🚀 OPTIMISTIC UI: Mostrar mensaje INSTANTÁNEAMENTE (Zero Latency - como WhatsApp/Telegram)
    // ⚡ CRÍTICO: Mostrar primero, validar después (experiencia instantánea)
    const optimisticId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateUUID(); // ✅ UUID real para correlación optimista/real (evitar colisiones)
    const nowMs = Date.now();
    
    // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined en optimistic message
    const optimisticAvatar = user.avatar && user.avatar.trim() && !user.avatar.includes('undefined')
      ? user.avatar
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || user.id || 'guest')}`;
    
    const optimisticMessage = {
      id: optimisticId,
      clientId, // ✅ F1: ID estable para correlación
      userId: user.id,
      username: user.username || 'Usuario', // ✅ FIX: Fallback si username es undefined
      avatar: optimisticAvatar, // ✅ SIEMPRE tiene valor válido
      isPremium: user.isPremium || false,
      content,
      type,
      timestamp: new Date().toISOString(),
      timestampMs: nowMs, // ✅ CRÍTICO: timestampMs para ordenamiento correcto (sin esto aparecen arriba)
      replyTo: replyData,
      _optimistic: true, // Marca para saber que es temporal
      status: 'sending', // ⚡ Estado: 'sending' -> 'sent' -> 'error' (para indicadores visuales)
      _retryCount: 0, // Contador de reintentos
    };

    // ⚡ INSTANTÁNEO: Agregar mensaje inmediatamente a la UI (usuario lo ve al instante)
    setMessages(prev => [...prev, optimisticMessage]);
    
    // 🔍 TRACE: Mensaje optimista renderizado localmente
    traceEvent(TRACE_EVENTS.UI_LOCAL_RENDER, {
      traceId: clientId,
      optimisticId,
      content: content.substring(0, 50),
      userId: user.id,
      roomId: currentRoom,
    });
    
    // 🔍 TRACE: Mensaje optimista creado
    traceEvent(TRACE_EVENTS.OPTIMISTIC_MESSAGE_CREATED, {
      traceId: clientId,
      optimisticId,
      content: content.substring(0, 50),
      userId: user.id,
      roomId: currentRoom,
    });

    // ⚡ SCROLL ULTRA-RÁPIDO: Scroll inmediato sin esperar RAF (máxima velocidad)
    // Usar setTimeout(0) es más rápido que RAF para scroll directo
    setTimeout(() => {
      const container = scrollManager?.containerRef?.current;
      if (container) {
        // Scroll directo sin animación para máxima velocidad (como WhatsApp/Telegram)
        container.scrollTop = container.scrollHeight;
      }
    }, 0);

    // 🔊 Reproducir sonido inmediatamente (no bloquea UI, async)
    notificationSounds.playMessageSentSound();

    // 🔍 TRACE: Handler de envío activado
    traceEvent(TRACE_EVENTS.SEND_HANDLER_TRIGGERED, {
      traceId: clientId,
      content: content.substring(0, 50),
      userId: user.id,
      roomId: currentRoom,
    });

    // 🛡️ VALIDACIÓN EN BACKGROUND: Validar después de mostrar (no bloquea UI)
    // ⚡ CRÍTICO: Las validaciones se ejecutan en background para no retrasar la experiencia visual
    const validationPromise = validateMessage(content, user.id, user.username, currentRoom)
      .then(validation => {
    if (!validation.allowed) {
          // 🔍 TRACE: Validación falló
          traceEvent(TRACE_EVENTS.PAYLOAD_VALIDATION_FAILED, {
            traceId: clientId,
            reason: validation.reason,
            userId: user.id,
            roomId: currentRoom,
          });
          // ❌ VALIDACIÓN FALLÓ: Eliminar mensaje optimista y mostrar error
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          
      // Mostrar mensaje específico según el tipo de violación
      if (validation.type === 'phone_number') {
        toast({
          title: "❌ Números de Teléfono Prohibidos",
          description: validation.details || validation.reason,
          variant: "destructive",
          duration: 5000,
        });
      } else if (validation.type === 'forbidden_word') {
        toast({
          title: `❌ ${validation.reason}`,
          description: validation.details || "Tu mensaje no será enviado por violar las reglas del chat.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (validation.type === 'spam_duplicate_warning') {
        toast({
          title: "⚠️ ADVERTENCIA DE SPAM",
          description: validation.reason,
          variant: "destructive",
          duration: 7000,
        });
      } else if (validation.type === 'spam_duplicate_ban') {
        toast({
          title: "🔨 EXPULSADO POR SPAM",
          description: validation.reason,
          variant: "destructive",
          duration: 10000,
        });
      } else if (validation.type === 'temp_ban') {
        toast({
          title: "🔨 EXPULSADO TEMPORALMENTE",
          description: validation.reason,
          variant: "destructive",
          duration: 10000,
        });
      } else {
        // Genérico
        toast({
          title: "❌ Mensaje Bloqueado",
          description: validation.reason,
          variant: "destructive",
          duration: 5000,
        });
      }
          return false; // No enviar
        }
        
        // 🔍 TRACE: Validación exitosa
        traceEvent(TRACE_EVENTS.PAYLOAD_VALIDATED, {
          traceId: clientId,
          userId: user.id,
          roomId: currentRoom,
        });
        
        return true; // Validación OK, continuar
      })
      .catch(() => true); // Si falla validación, permitir envío (fail-open)

    // ⚡ INSTANTÁNEO: Enviar mensaje a Firestore en segundo plano (NO bloquear UI)
    // El mensaje optimista ya está visible, Firestore se sincroniza en background
    // ✅ CRÍTICO: Usar auth.currentUser.uid directamente (ya validado arriba)
    // Firestore rules requieren que data.userId == request.auth.uid exactamente

    // 📊 PERFORMANCE MONITOR: Capturar tiempo de inicio ANTES del Promise chain
    const messageSendStartTime = performance.now();

    Promise.all([validationPromise])
      .then(([isValid]) => {
        if (!isValid) return; // Validación falló, no enviar
        
        // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined
        const messageAvatar = user.avatar && user.avatar.trim() && !user.avatar.includes('undefined')
          ? user.avatar
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || user.id || 'guest')}`;

        // 🔍 TRACE: Intentando escribir en Firebase
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_ATTEMPT, {
          traceId: clientId,
          userId: auth.currentUser?.uid || user.id,
          roomId: currentRoom,
          content: content.substring(0, 50),
        });

        // 📊 PERFORMANCE MONITOR: Iniciar tracking de envío de mensaje
        startTiming('messageSent', { 
          clientId,
          roomId: currentRoom,
          contentLength: content.length 
        });

        return sendMessage(
      currentRoom,
      {
        clientId, // ✅ F1: Pasar clientId para correlación
        userId: auth.currentUser.uid, // ✅ SIEMPRE usar auth.currentUser.uid (ya validado)
        username: user.username || 'Usuario', // ✅ FIX: Fallback si username es undefined
        avatar: messageAvatar, // ✅ SIEMPRE tiene valor válido
        isPremium: user.isPremium || false,
        content,
        type,
        replyTo: replyData,
        traceId: clientId, // ✅ Pasar traceId para correlación
      },
      user.isAnonymous
        );
      })
      .then((sentMessage) => {
        if (!sentMessage) return; // Validación falló o no se envió
        
        // 🔍 TRACE: Escritura en Firebase exitosa
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_SUCCESS, {
          traceId: clientId,
          messageId: sentMessage.id,
          userId: user.id,
          roomId: currentRoom,
          firestoreId: sentMessage.id,
        });
        
        // ✅ Mensaje enviado exitosamente - se actualizará automáticamente vía onSnapshot
        // Track GA4 (background, no bloquea)
        trackMessageSent(currentRoom, user.id);
        
        // 📊 PERFORMANCE MONITOR: Completar tracking de envío
        endTiming('messageSent', { 
          clientId,
          messageId: sentMessage?.id,
          status: 'success' 
        });
        trackMessageSentPerformance(messageSendStartTime, sentMessage?.id || clientId, {
          roomId: currentRoom,
          contentLength: content.length,
        });

        // 🎯 VOC: Resetear cooldown cuando hay nueva actividad
        resetVOCCooldown(currentRoom);

        // ⚡ LATENCY CHECK: Solo log en consola (sin toast al usuario)
        const latency = Date.now() - optimisticMessage.timestampMs;
        console.log(`⏱️ [LATENCY TEST] Mensaje sincronizado en ${latency}ms`);

        // ❌ TOAST DE LATENCIA ELIMINADO (07/01/2026) - No interesa al usuario
        // El usuario no necesita ver información técnica de latencia
        // Solo mantener log en consola para debugging

        // ✅ ACTUALIZAR ESTADO: Marcar como 'sent' cuando Firestore confirma
        // El listener de onSnapshot se encargará de eliminar el optimista cuando detecte el real
        if (sentMessage?.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticId 
              ? { ...msg, _realId: sentMessage.id, status: 'sent', _sentAt: Date.now() } // ⚡ Estado: 'sent' (doble check gris)
              : msg
          ));

          // ⏱️ DESHABILITADO: Timeout de 20 segundos causaba falsos positivos
          // Si el mensaje se escribió exitosamente en Firebase (.then), confiar en que se envió
          // El estado 'delivered' se detectará automáticamente cuando llegue el snapshot

          /* CÓDIGO ANTERIOR: Timeout agresivo que marcaba mensajes como fallidos incorrectamente
          const deliveryTimeout = setTimeout(() => {
            setMessages(prev => {
              const message = prev.find(m => m.id === optimisticId || m._realId === sentMessage.id);
              if (message && message.status !== 'delivered' && message.userId === user?.id) {
                console.error('🚨 [MENSAJE NO ENTREGADO] FALLA:', {
                  messageId: message.id,
                  realId: message._realId || sentMessage.id,
                  content: message.content?.substring(0, 50) + '...',
                  timestamp: new Date().toISOString(),
                  elapsed: Date.now() - (message._sentAt || Date.now()),
                  status: message.status
                });

                return prev.map(msg =>
                  (msg.id === optimisticId || msg._realId === sentMessage.id) && msg.userId === user?.id
                    ? { ...msg, status: 'failed', _deliveryFailed: true }
                    : msg
                );
              }
              return prev;
            });
          }, 20000);

          deliveryTimeoutsRef.current.set(optimisticId, deliveryTimeout);
          */
        }
      })
      .catch((error) => {
        console.error('❌ Error enviando mensaje:', error);

        // 🔍 TRACE: Escritura en Firebase falló
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_FAIL, {
          traceId: clientId,
          error: error.message,
          errorCode: error.code,
          userId: user.id,
          roomId: currentRoom,
        });

        // ❌ FALLÓ - Marcar como error (NO eliminar, permitir reintento)
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticId
            ? { ...msg, status: 'error', _error: error } // ⚡ Estado: 'error' (mostrar indicador rojo)
            : msg
        ));

        // ⚡ Toast de error DESHABILITADO - Causaba confusión
        // El mensaje sí se entrega pero el toast aparecía por errores de tracking
        // Solo log en consola para debug
        // if (import.meta.env.DEV) {
        //   toast({
        //     title: "No pudimos entregar este mensaje",
        //     description: "Toca el mensaje para reintentar",
        //     variant: "destructive",
        //     duration: 5000,
        //   });
        // }
      });
  };

  /**
   * 🔄 REINTENTAR MENSAJE: Reintentar envío de mensaje fallido
   */
  const handleRetryMessage = async (optimisticMessage) => {
    const { id: optimisticId, content, type, replyTo, _retryCount = 0 } = optimisticMessage;
    
    // Limitar reintentos (máximo 3)
    if (_retryCount >= 3) {
      toast({
        title: "Límite de reintentos alcanzado",
        description: "Por favor, recarga la página o verifica tu conexión",
        variant: "destructive",
      });
      return;
    }

    // Marcar como 'sending' nuevamente
    setMessages(prev => prev.map(msg => 
      msg.id === optimisticId 
        ? { ...msg, status: 'sending', _retryCount: _retryCount + 1 }
        : msg
    ));

    // Reintentar envío
    try {
      // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined
      const messageAvatar = user.avatar && user.avatar.trim() && !user.avatar.includes('undefined')
        ? user.avatar
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || user.id || 'guest')}`;

      const sentMessage = await sendMessage(
        currentRoom,
        {
          clientId: optimisticMessage.clientId,
          userId: auth.currentUser.uid,
          username: user.username,
          avatar: messageAvatar, // ✅ SIEMPRE tiene valor válido
          isPremium: user.isPremium,
          content,
          type,
          replyTo,
        },
        user.isAnonymous
      );

      if (sentMessage?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, _realId: sentMessage.id, status: 'sent' }
            : msg
        ));
      }
    } catch (error) {
      // Marcar como error nuevamente
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, status: 'error', _error: error }
          : msg
      ));
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
  const handlePrivateChatRequest = async (targetUser) => {
    // ⚠️ RESTRICCIÓN: Usuarios NO autenticados NO pueden enviar mensajes privados
    if (!auth.currentUser) {
      toast({
        title: "Regístrate para chatear en privado",
        description: "Los usuarios no registrados no pueden enviar mensajes privados. Regístrate para desbloquear esta función.",
        variant: "default",
        duration: 5000,
        action: {
          label: "Registrarse",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }

    // ✅ VALIDACIÓN: Si el usuario actual es anónimo o guest, mostrar modal de registro
    if (user.isGuest || user.isAnonymous) {
      setShowRegistrationModal(true);
      setRegistrationModalFeature('chat privado');
      return;
    }

    // ✅ VALIDACIÓN: Si el usuario objetivo es anónimo o guest, mostrar alerta
    if (targetUser.isAnonymous || targetUser.isGuest) {
      toast({
        title: "⚠️ Usuario Anónimo",
        description: `${targetUser.username} es un usuario anónimo y no puede participar en chats privados. Los usuarios anónimos deben registrarse para usar esta función.`,
        variant: "default",
        duration: 5000,
      });
      return;
    }

    if (targetUser.userId === user.id) return;

    if (targetUser.userId === 'demo-user-123') {
      setActivePrivateChat({ user, partner: targetUser });
      return;
    }

    try {
      // ✅ Usar el servicio para enviar la solicitud a Firestore
      await sendPrivateChatRequest(user.id, targetUser.userId);
      
      // Mostrar estado local para el emisor (solicitud enviada)
      setPrivateChatRequest({ from: user, to: targetUser });
      
      toast({
        title: "Solicitud enviada",
        description: `Has invitado a ${targetUser.username} a un chat privado.`,
      });
    } catch (error) {
      console.error('Error sending private chat request:', error);
      toast({
        title: "No pudimos enviar la invitación",
        description: "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    }
  };

  /**
   * Respuesta a solicitud de chat privado
   */
  const handlePrivateChatResponse = async (accepted, notificationId = null) => {
    if (!privateChatRequest) return;

    const isReceiver = user.id === privateChatRequest.to.userId;
    const partnerName = isReceiver ? privateChatRequest.from.username : privateChatRequest.to.username;
    const partner = isReceiver ? privateChatRequest.from : privateChatRequest.to;

    // ✅ Si es receptor y hay notificationId, usar el servicio para responder
    if (isReceiver && notificationId) {
      try {
        const result = await respondToPrivateChatRequest(user.id, notificationId, accepted);
        
        if (accepted && result?.chatId) {
          setActivePrivateChat({
            user: user,
            partner: partner,
            chatId: result.chatId
          });
          toast({
            title: "¡Chat privado aceptado!",
            description: `Ahora estás en un chat privado con ${partnerName}.`,
          });
        } else if (!accepted) {
          toast({
            title: "Solicitud rechazada",
            description: `Has rechazado la invitación de ${partnerName}.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error responding to private chat request:', error);
        toast({
          title: "No pudimos procesar tu respuesta",
          description: "Intenta de nuevo en un momento",
          variant: "destructive",
        });
      }
    } else {
      // Para el emisor o cuando no hay notificationId (compatibilidad)
      if (accepted) {
        setActivePrivateChat({
          user: user,
          partner: partner
        });
        toast({
          title: "¡Chat privado aceptado!",
          description: `Ahora estás en un chat privado con ${partnerName}.`,
        });
      } else {
        toast({
          title: "Solicitud rechazada",
          description: `Has rechazado la invitación de ${partnerName}.`,
          variant: "destructive"
        });
      }
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

  // ========================================
  // 💬 DETECTAR RESPUESTAS: Verificar si hay respuestas cuando el usuario está scrolleado arriba
  // ========================================
  useEffect(() => {
    if (!user || !user.id || messages.length === 0) return;

    // Buscar mensajes que responden a mensajes del usuario
    const userMessages = messages.filter(m => m.userId === user.id);
    const userMessageIds = new Set(userMessages.map(m => m.id));
    
    const repliesToUser = messages.filter(m => 
      m.replyTo && 
      m.replyTo.messageId && 
      userMessageIds.has(m.replyTo.messageId) &&
      m.userId !== user.id // No contar respuestas propias
    );

    // Filtrar solo respuestas que están después del último mensaje leído
    let unreadReplies = repliesToUser;
    if (lastReadMessageIdRef.current) {
      const lastReadIndex = messages.findIndex(m => m.id === lastReadMessageIdRef.current);
      if (lastReadIndex >= 0) {
        unreadReplies = repliesToUser.filter((reply) => {
          const replyIndex = messages.findIndex(m => m.id === reply.id);
          return replyIndex > lastReadIndex;
        });
      }
    }

    if (scrollManager.scrollState === 'AUTO_FOLLOW') {
      // Usuario está en el bottom - ocultar indicador y actualizar último mensaje leído
      setUnreadRepliesCount(0);
      if (messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
      }
    } else if (unreadReplies.length > 0) {
      // Usuario está scrolleado arriba y hay respuestas no leídas
      setUnreadRepliesCount(unreadReplies.length);
    } else {
      // No hay respuestas no leídas
      setUnreadRepliesCount(0);
    }
  }, [messages, user, scrollManager.scrollState]);

  // ========================================
  // 🔒 LANDING PAGE: Guard clause para user === null
  // ========================================
  // ✅ CRITICAL: Este return DEBE estar DESPUÉS de TODOS los hooks
  // ⚡ FIX: Solo mostrar landing si auth terminó de cargar Y no hay usuario
  // Si está cargando, esperar (evita mostrar landing durante carga inicial)
  // Si hay usuario (guest o registrado), mostrar chat directamente
  
  // ⚡ AUTO-LOGIN GUEST: Si accede directamente a /chat/principal sin sesión, crear sesión guest automáticamente
  useEffect(() => {
    // ✅ FIX: Prevenir múltiples intentos de auto-login
    if (autoLoginAttemptedRef.current) return;
    
    // ✅ NO crear usuarios automáticos - el usuario debe elegir su nombre
    // Si accede directamente sin sesión, se mostrará el ChatLandingPage
    // que tiene el formulario de entrada donde puede elegir su nombre
    // (No generamos nombres automáticos tipo "GuestXXXX")
  }, [authLoading, user, roomId, signInAsGuest]);

  // 📜 DETECCIÓN DE SCROLL: Toast para usuarios no logueados
  // Si un usuario no logueado llega al tope (50 mensajes), mostrar toast
  // ✅ CRITICAL: Este hook DEBE estar ANTES de cualquier return condicional
  // ✅ FIX: Asegurar que siempre se ejecute (no condicionalmente) para respetar reglas de hooks
  useEffect(() => {
    // Guard interno: solo ejecutar lógica si hay user y es guest/anonymous
    if (!user || (!user.isGuest && !user.isAnonymous)) {
      return;
    }

    // Guard interno: solo ejecutar si scrollManager está disponible
    if (!scrollManager?.containerRef?.current) return;
    
    const container = scrollManager.containerRef.current;

    let hasShownToast = false; // Flag para mostrar toast solo una vez por sesión

    const handleScroll = () => {
      // Si ya mostró el toast, no volver a mostrar
      if (hasShownToast) return;

      // Verificar que tiene exactamente 50 mensajes (límite para no autenticados)
      if (messages.length !== 50) return;

      // Si está en el tope (scrollTop === 0 o muy cerca, primeros 50px)
      const scrollTop = container.scrollTop;
      const isAtTop = scrollTop <= 50;

      // Si alcanzó el límite de 50 mensajes y está en el tope
      if (isAtTop && messages.length === 50) {
        hasShownToast = true;
        toast({
          title: "Para ver más historial, regístrate",
          description: "Los usuarios registrados pueden ver hasta 100 mensajes",
          duration: 4000, // 4 segundos
        });
      }
    };

    container.addEventListener('scroll', handleScroll);

    // También verificar al montar si ya está en el tope
    setTimeout(() => {
      if (!hasShownToast && messages.length === 50) {
        const scrollTop = container.scrollTop;
        if (scrollTop <= 50) {
          handleScroll();
        }
      }
    }, 1000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [user, messages.length, scrollManager]);

  // Mostrar loading mientras auth carga (máximo 3 segundos)
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // 🚀 EXPERIMENTO: NO mostrar landing - Directo al chat
  // Si no hay usuario, mostramos el chat igual pero con funcionalidad limitada
  // El modal de nickname aparece cuando intenten escribir
  // if (!user) {
  //   return <ChatLandingPage roomSlug={roomId} />;
  // }

  // 🔒 FASE 1: RESTRICCIÓN - Invitados solo pueden acceder a /chat/principal
  if (user && (user.isGuest || user.isAnonymous)) {
    if (roomId !== 'principal') {
      // Invitado intenta acceder a otra sala → Redirigir a principal
      console.log(`[ChatPage] ⚠️ Invitado intentando acceder a /chat/${roomId} → Redirigiendo a /chat/principal`);
      navigate('/chat/principal', { replace: true });
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-muted-foreground">Redirigiendo a la sala principal...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {/* ✅ FIX: Contenedor principal - En móvil no usar flex para evitar problemas con sidebar oculto */}
      <div className="h-screen overflow-hidden bg-background lg:flex" style={{ height: '100dvh', maxHeight: '100dvh' }}>
        <ChatSidebar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* ✅ FIX: Contenedor del chat - Asegurar que esté visible en móvil cuando sidebar está cerrado */}
        {/* En móvil: ancho completo (100vw), en desktop: flex-1 para ajustarse al sidebar */}
        <div className="w-full lg:flex-1 flex flex-col overflow-hidden min-w-0 h-full">
          <ChatHeader
            currentRoom={currentRoom}
            onMenuClick={() => setSidebarOpen(true)}
            onOpenPrivateChat={handleOpenPrivateChatFromNotification}
            onSimulate={() => setShowScreenSaver(true)}
          />

          {/* 📢 Banner Telegram - Fijo en todas las salas */}
          {/* ⚠️ TELEGRAM BANNER ELIMINADO */}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {/* 🎯 OPIN Discovery Banner - Solo para invitados */}
            {user && (user.isGuest || user.isAnonymous) && (
              <div className="px-4 pt-4">
                <OpinDiscoveryBanner />
              </div>
            )}

            {/* 🚀 BANNER PROMOCIONAL Baúl + OPIN - Solo para usuarios registrados */}
            {user && !user.isGuest && !user.isAnonymous && (
              <TarjetaPromoBanner
                onOpenBaul={() => {
                  setMostrarBaul(true);
                  detenerNudges();
                }}
              />
            )}

            {/* ⚠️ MODALES DE INSTRUCCIONES ELIMINADOS (17/01/2026) - A petición del usuario */}
            {/* ⏳ Mostrar loading simple cuando no hay mensajes y está cargando */}
            {isLoadingMessages && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Se están cargando tus mensajes...</p>
                </div>
              </div>
            ) : (
              <ChatMessages
              messages={messages}
              currentUserId={user?.id || null}
              onUserClick={setUserActionsTarget}
              onReport={setReportTarget}
              onPrivateChat={handlePrivateChatRequest}
              onReaction={handleMessageReaction}
              onReply={handleReply}
              lastReadMessageIndex={-1}
              messagesEndRef={scrollManager.endMarkerRef}
              messagesContainerRef={scrollManager.containerRef}
              onScroll={companionAI.handleScroll}
              roomUsers={roomUsers}
              newMessagesIndicator={
                <NewMessagesIndicator
                  count={scrollManager.unreadCount}
                  onClick={scrollManager.scrollToBottom}
                  show={scrollManager.scrollState !== 'AUTO_FOLLOW' && scrollManager.unreadCount > 0}
                />
              }
            />
            )}
          </div>

          <TypingIndicator typingUsers={[]} />

          {/* 💬 Indicador de respuestas - pequeño círculo con número */}
          <ReplyIndicator
            show={unreadRepliesCount > 0 && scrollManager.scrollState !== 'AUTO_FOLLOW'}
            onClick={() => {
              scrollManager.scrollToBottom();
              setUnreadRepliesCount(0);
            }}
            count={unreadRepliesCount}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            externalMessage={suggestedMessage}
            roomId={roomId}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
          />
        </div>

        {/* ⚠️ MODERADOR COMPLETAMENTE ELIMINADO (06/01/2026) - A petición del usuario */}
        {/* 👮 Banner de reglas del moderador (NO bloqueante) - ELIMINADO */}
        {/* El componente RulesBanner y todo el sistema de moderador ha sido eliminado */}
        {/* {moderatorMessage && (
          <RulesBanner
            message={moderatorMessage}
            onDismiss={() => setModeratorMessage(null)}
            roomId={currentRoom}
            userId={user?.id}
          />
        )} */}

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
            user={{
              ...userActionsTarget,
              // Buscar información completa del usuario en roomUsers para verificar si es anónimo
              isAnonymous: roomUsers.find(u => (u.userId || u.id) === userActionsTarget.userId)?.isAnonymous || false,
              isGuest: roomUsers.find(u => (u.userId || u.id) === userActionsTarget.userId)?.isGuest || false,
            }}
            onClose={() => setUserActionsTarget(null)}
            onViewProfile={() => setSelectedUser(userActionsTarget)}
            onShowRegistrationModal={(feature) => {
              setRegistrationModalFeature(feature);
              setShowRegistrationModal(true);
            }}
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
            onSelectUser={(favoriteUser) => {
              // Abrir modal de acciones para el favorito seleccionado
              setSelectedUserForActions(favoriteUser);
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

        {privateChatRequest && (() => {
          const isReceiver = user.id === privateChatRequest.to.userId;
          const isSender = user.id === privateChatRequest.from.id;

          // ✅ Si es el receptor, mostrar toast discreto arriba
          if (isReceiver) {
            return (
              <PrivateChatInviteToast
                request={privateChatRequest}
                onAccept={() => handlePrivateChatResponse(true, privateChatRequest.notificationId)}
                onDecline={() => handlePrivateChatResponse(false, privateChatRequest.notificationId)}
                onClose={() => setPrivateChatRequest(null)}
              />
            );
          }

          // ✅ Si es el emisor, mostrar modal tradicional (Solicitud Enviada)
          if (isSender) {
            return (
              <PrivateChatRequestModal
                request={privateChatRequest}
                currentUser={user}
                onResponse={handlePrivateChatResponse}
                onClose={() => setPrivateChatRequest(null)}
              />
            );
          }

          return null;
        })()}

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
            onClose={() => {
              // Agregar el chatId a la lista de chats cerrados manualmente
              if (activePrivateChat.chatId) {
                setDismissedPrivateChats(prev => new Set([...prev, activePrivateChat.chatId]));
              }
              setActivePrivateChat(null);
            }}
          />
        )}

        {showWelcomeTour && (
          <WelcomeTour onComplete={() => setShowWelcomeTour(false)} />
        )}

        {/* ⚠️ MODAL COMENTADO - No está en uso hasta que se repare */}
        {/* 🎁 Modal de Bienvenida Premium */}
        {/* <PremiumWelcomeModal
          open={showPremiumWelcome}
          onClose={handleClosePremiumWelcome}
        /> */}

        <AgeVerificationModal
          isOpen={showAgeVerification}
          onClose={() => setShowAgeVerification(false)}
          onConfirm={async (age, username, avatar, keepSession = false) => {
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

              // Guardar edad en localStorage (múltiples claves para persistencia)
              const ageKey = `age_verified_${user.id}`;
              localStorage.setItem(ageKey, String(age));
              
              // ⚡ PERSISTENCIA: Guardar también por username para restaurar si cambia el UID
              if (user.isGuest || user.isAnonymous) {
                const usernameAgeKey = `age_verified_${username.toLowerCase().trim()}`;
                localStorage.setItem(usernameAgeKey, String(age));
                
                // ✅ GUARDAR SESIÓN si el usuario marcó "Mantener sesión"
                if (keepSession) {
                  localStorage.setItem('guest_session_saved', JSON.stringify({
                    username: username,
                    avatar: avatar.url,
                    uid: user.id,
                    timestamp: Date.now(),
                  }));
                } else {
                  // Si no marca mantener sesión, eliminar cualquier sesión guardada anterior
                  localStorage.removeItem('guest_session_saved');
                }
                
                // Actualizar datos guardados del guest
                const guestDataKey = `guest_data_${username.toLowerCase().trim()}`;
                const savedData = localStorage.getItem(guestDataKey);
                if (savedData) {
                  try {
                    const saved = JSON.parse(savedData);
                    saved.age = age;
                    saved.lastUsed = Date.now();
                    if (keepSession) {
                      saved.keepSession = true;
                    }
                    localStorage.setItem(guestDataKey, JSON.stringify(saved));
                  } catch (e) {
                    console.debug('[AGE VERIFICATION] Error actualizando datos guardados:', e);
                  }
                }
              }
              
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

        {/* ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar */}
      </div>

      {/* Protector de pantalla - Se muestra sobre todo */}
      {showScreenSaver && (
        <ScreenSaver onClose={() => setShowScreenSaver(false)} />
      )}

      {/* Modal de registro requerido */}
      <RegistrationRequiredModal
        open={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        featureName={registrationModalFeature}
      />

      {/* ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal en /auth */}

      {/* 📋 BAÚL DE TARJETAS - Accesible desde banner promocional */}
      {mostrarBaul && (
        <BaulSection
          isOpen={mostrarBaul}
          onClose={() => setMostrarBaul(false)}
        />
      )}
    </>
  );
};

export default ChatPage;
