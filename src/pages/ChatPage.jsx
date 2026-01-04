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
import ChatLandingPage from '@/components/chat/ChatLandingPage';
import EmptyRoomNotificationPrompt from '@/components/chat/EmptyRoomNotificationPrompt';
import LoadingMessagesPrompt from '@/components/chat/LoadingMessagesPrompt';
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage, markMessagesAsRead } from '@/services/chatService';
import { joinRoom, leaveRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, updateUserActivity, cleanInactiveUsers, filterActiveUsers, subscribeToTypingUsers } from '@/services/presenceService';
import { validateMessage, clearUserHistory } from '@/services/antiSpamService';
import { auth } from '@/config/firebase'; // ✅ CRÍTICO: Necesario para obtener UID real de Firebase Auth
import { sendPrivateChatRequest, respondToPrivateChatRequest, subscribeToNotifications, markNotificationAsRead } from '@/services/socialService';
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
  const [dismissedPrivateChats, setDismissedPrivateChats] = useState(new Set()); // IDs de chats que el usuario cerró manualmente
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  // ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
  // const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [showChatRules, setShowChatRules] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false); // ✅ Modal de edad
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationModalFeature, setRegistrationModalFeature] = useState(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false); // ✅ Flag mayor de edad
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [roomCounts, setRoomCounts] = useState({}); // Contadores de usuarios por sala
  const [engagementTime, setEngagementTime] = useState(''); // ⏱️ Tiempo total de engagement
  const [showScreenSaver, setShowScreenSaver] = useState(false); // 🔒 Protector de pantalla
  const [isInputFocused, setIsInputFocused] = useState(false); // 📝 Input focus state for scroll manager
  const [suggestedMessage, setSuggestedMessage] = useState(null); // 🤖 Mensaje sugerido por Companion AI
  const [replyTo, setReplyTo] = useState(null); // 💬 Mensaje al que se está respondiendo { messageId, username, content }
  const [isLoadingMessages, setIsLoadingMessages] = useState(true); // ⏳ Estado de carga de mensajes
  const unsubscribeRef = useRef(null);
  const aiActivatedRef = useRef(false); // Flag para evitar activaciones múltiples de IA
  const lastUserCountRef = useRef(0); // Para evitar ejecuciones innecesarias del useEffect
  const moderatorWelcomeSentRef = useRef(new Set()); // Para evitar mensajes duplicados del moderador
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
                console.log(`[AGE VERIFICATION] ✅ Usuario invitado ${user.username} ya verificó edad en sesión anterior`);
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
      console.log(`[AGE VERIFICATION] ✅ Usuario ${user.username} ya verificó edad en landing page`);
    } else {
      // ✅ SI ES INVITADO: Auto-verificar (asumimos +18 porque ya pasó formulario de entrada)
      if (user.isGuest || user.isAnonymous) {
        console.log(`[AGE VERIFICATION] ✅ Usuario invitado ${user.username} - Auto-verificado (formulario de entrada simplificado)`);
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        localStorage.setItem(`age_verified_${user.id}`, '18');
        return; // NO mostrar modal adicional - CERO FRICCIÓN
      }

      // ✅ Verificar en localStorage (sesiones anteriores) - SOLO para usuarios registrados
      const ageKey = `age_verified_${user.id}`;
      const storedAge = localStorage.getItem(ageKey);

      if (storedAge && Number(storedAge) >= 18) {
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        console.log(`[AGE VERIFICATION] ✅ Usuario ${user.id} ya verificó su edad (${storedAge} años)`);
      } else {
        // ✅ Solo mostrar modal para USUARIOS REGISTRADOS que NO están verificados
        setIsAgeVerified(false);
        const hasShownKey = `age_modal_shown_${user.id}`;
        const hasShown = sessionStorage.getItem(hasShownKey);
        if (!hasShown) {
          setShowAgeVerification(true);
          sessionStorage.setItem(hasShownKey, 'true');
          console.log(`[AGE VERIFICATION] 📋 Mostrando modal de edad para usuario REGISTRADO ${user.id}`);
        } else {
          console.log(`[AGE VERIFICATION] ⏭️ Modal ya se mostró en esta sesión para usuario ${user.id}`);
        }
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

  // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes ANTES de verificar edad
  // Esto permite que los mensajes carguen instantáneamente, incluso con usuario temporal
  useEffect(() => {
    // 🔒 SAFETY: Verificar que user existe (defensa en profundidad)
    if (!user || !user.id) {
      console.warn('⚠️ [CHAT] useEffect de Firestore ejecutado sin user válido');
      return;
    }

    setCurrentRoom(roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al cambiar de sala
    aiActivatedRef.current = false; // Resetear flag de IA cuando cambia de sala

    // 🧹 Limpiar usuarios inactivos al entrar a la sala
    cleanInactiveUsers(roomId);

    // Registrar presencia del usuario en la sala
    joinRoom(roomId, user);

    // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes SIN esperar verificación de edad
    // 🔒 CRITICAL: Limpiar suscripción anterior si existe
    if (unsubscribeRef.current) {
      console.log('🧹 [CHAT] Limpiando suscripción anterior antes de crear nueva');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    console.log('📡 [CHAT] Suscribiéndose a mensajes INMEDIATAMENTE para sala:', roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al iniciar suscripción
    const unsubscribeMessages = subscribeToRoomMessages(roomId, (newMessages) => {
      console.log('📨 [CHAT] ✅ Mensajes recibidos de Firestore:', {
        count: newMessages.length,
        roomId,
        timestamp: new Date().toISOString(),
        messageIds: newMessages.slice(-3).map(m => ({ id: m.id, content: m.content?.substring(0, 20) }))
      });
      
      // ⏳ Marcar como cargado cuando llegan los mensajes
      setIsLoadingMessages(false);
      
      // 🔊 Reproducir sonido si llegaron mensajes nuevos (no en carga inicial)
      if (previousMessageCountRef.current > 0 && newMessages.length > previousMessageCountRef.current) {
        const newMessageCount = newMessages.length - previousMessageCountRef.current;
        // Reproducir sonido por cada mensaje nuevo (el servicio agrupa automáticamente si son 4+)
        for (let i = 0; i < newMessageCount; i++) {
          notificationSounds.playMessageSound();
        }
      }

      // Actualizar contador de mensajes
      previousMessageCountRef.current = newMessages.length;

      // 🚀 OPTIMISTIC UI: Fusionar mensajes reales con optimistas y DEDUPLICAR
      setMessages(prevMessages => {
        const optimisticMessages = prevMessages.filter(m => m._optimistic);
        const mergedMessages = [...newMessages];
        
        // ✅ DEDUPLICACIÓN MEJORADA: Eliminar mensajes optimistas cuando llega el mensaje real
        if (optimisticMessages.length > 0) {
          // Para cada mensaje optimista, verificar si ya llegó el mensaje real
          const remainingOptimistic = optimisticMessages.filter(optMsg => {
            // Método 1: Si el optimista tiene _realId, buscar por ID
            if (optMsg._realId) {
              const foundById = newMessages.find(realMsg => realMsg.id === optMsg._realId);
              if (foundById) {
                console.log('✅ [DEDUPLICACIÓN] Eliminando optimista por ID real:', {
                  optimisticId: optMsg.id,
                  realId: optMsg._realId,
                  content: optMsg.content?.substring(0, 30)
                });
                return false; // Eliminar este optimista
              }
            }
            
            // Método 2: Buscar por contenido, userId y timestamp similar (fallback)
            const matchingReal = newMessages.find(realMsg => {
              const sameUser = realMsg.userId === optMsg.userId;
              const sameContent = realMsg.content === optMsg.content;
              const sameType = (realMsg.type || 'text') === (optMsg.type || 'text');
              
              // Comparar timestamps (dentro de 10 segundos de diferencia)
              const optTime = new Date(optMsg.timestamp).getTime();
              const realTime = new Date(realMsg.timestamp).getTime();
              const timeDiff = Math.abs(realTime - optTime);
              const similarTime = timeDiff < 10000; // 10 segundos de tolerancia
              
              return sameUser && sameContent && sameType && similarTime;
            });
            
            // Si encontramos un match, eliminar el optimista (ya llegó el real)
            if (matchingReal) {
              console.log('✅ [DEDUPLICACIÓN] Eliminando optimista por match de contenido:', {
                optimisticId: optMsg.id,
                realId: matchingReal.id,
                content: optMsg.content?.substring(0, 30)
              });
              return false; // Eliminar este optimista
            }
            
            return true; // Mantener este optimista (aún no llegó el real)
          });
          
          // Solo agregar optimistas que no tienen match
          if (remainingOptimistic.length > 0) {
            mergedMessages.push(...remainingOptimistic);
          }
        }
        
        // Ordenar por timestamp
        const sorted = mergedMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        // 🔍 DEBUG: Detectar duplicados después de la fusión
        const duplicateCheck = sorted.filter((msg, index, arr) => {
          const duplicate = arr.findIndex(m => 
            m.id === msg.id || 
            (m.userId === msg.userId && 
             m.content === msg.content && 
             Math.abs(new Date(m.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 1000)
          );
          return duplicate !== index;
        });
        
        if (duplicateCheck.length > 0) {
          console.warn('⚠️ [DEDUPLICACIÓN] Mensajes duplicados detectados después de fusión:', {
            duplicates: duplicateCheck.map(m => ({ id: m.id, content: m.content?.substring(0, 30), isOptimistic: m._optimistic }))
          });
        }
        
        return sorted;
      });
    });

    // 🤖 Suscribirse a usuarios de la sala (para sistema de bots)
    // ⚠️ TYPING STATUS: DESHABILITADO - causaba errores (setTypingUsers no definido)
    // TODO: Re-habilitar cuando se arregle
    /*
    const unsubscribeTyping = subscribeToTypingUsers(roomId, user?.id || '', (typing) => {
      setTypingUsers(typing);
    });
    */

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
        console.debug(`👥 Sala ${roomId}: ${currentCounts.real} usuario(s) real(es) activo(s) | ${currentCounts.total} total en DB (incluye inactivos)`);

        // 🔊 Reproducir sonido de INGRESO si un usuario real se conectó
        if (previousRealUserCountRef.current > 0 && currentCounts.real > previousRealUserCountRef.current) {
          const usersJoined = currentCounts.real - previousRealUserCountRef.current;
          console.debug(`🔊 [SOUNDS] ${usersJoined} usuario(s) ingresó/ingresaron, reproduciendo sonido de bienvenida`);
          notificationSounds.playUserJoinSound();
        }

        // 🔊 Reproducir sonido de SALIDA si un usuario real se desconectó
        if (previousRealUserCountRef.current > 0 && currentCounts.real < previousRealUserCountRef.current) {
          const usersLeft = previousRealUserCountRef.current - currentCounts.real;
          console.debug(`🔊 [SOUNDS] ${usersLeft} usuario(s) se desconectó/desconectaron, reproduciendo sonido de salida`);
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

    // Toast de bienvenida
    toast({
      title: `👋 ¡${user.username} se ha unido a la sala!`,
      description: `Estás en #${roomId}`,
    });

    // 👮 Mensaje de bienvenida del moderador (solo una vez)
    const moderatorKey = `${roomId}_${user.id}`;
    const hasSeenModerator = sessionStorage.getItem(`moderator_welcome_${moderatorKey}`);
    
    // Verificar también en el ref para evitar duplicados en el mismo render
    if (!hasSeenModerator && !moderatorWelcomeSentRef.current.has(moderatorKey)) {
      // Marcar inmediatamente para evitar duplicados
      moderatorWelcomeSentRef.current.add(moderatorKey);
      sessionStorage.setItem(`moderator_welcome_${moderatorKey}`, 'true');
      
      setTimeout(() => {
        sendModeratorWelcome(roomId, user.username);
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
  }, [roomId, user]); // ⚡ CRÍTICO: Remover isAgeVerified - la suscripción debe ejecutarse INMEDIATAMENTE

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

  // ✅ Suscribirse a notificaciones de chat privado
  useEffect(() => {
    if (!user || user.isGuest || user.isAnonymous) return;

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
  }, [user, privateChatRequest, activePrivateChat, dismissedPrivateChats]);

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

    // 🛡️ ANTI-SPAM: Validar contenido del mensaje
    const validation = await validateMessage(content, user.id, user.username, currentRoom);

    if (!validation.allowed) {
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
      return;
    }

    // 🚀 OPTIMISTIC UI: Mostrar mensaje instantáneamente (como WhatsApp/Telegram)
    const optimisticId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage = {
      id: optimisticId,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      isPremium: user.isPremium,
      content,
      type,
      timestamp: new Date().toISOString(),
      replyTo: replyData,
      _optimistic: true, // Marca para saber que es temporal
      _sending: true, // Marca de "enviando"
    };

    // ⚡ INSTANTÁNEO: Agregar mensaje inmediatamente a la UI (usuario lo ve al instante)
    setMessages(prev => [...prev, optimisticMessage]);

    // ⚡ INSTANTÁNEO: Scroll inmediato al último mensaje (doble RAF para asegurar DOM actualizado)
    // Doble requestAnimationFrame garantiza que React haya actualizado el DOM antes del scroll
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = document.querySelector('.messages-container');
        if (container) {
          // Scroll directo sin animación para máxima velocidad (como WhatsApp/Telegram)
          container.scrollTop = container.scrollHeight;
        }
      });
    });

    // 🔊 Reproducir sonido inmediatamente (no bloquea UI, async)
    notificationSounds.playMessageSentSound();

    // ⚡ INSTANTÁNEO: Enviar mensaje a Firestore en segundo plano (NO bloquear UI)
    // El mensaje optimista ya está visible, Firestore se sincroniza en background
    sendMessage(
      currentRoom,
      {
        userId: auth.currentUser?.uid || user.id, // ✅ CRÍTICO: Firestore rules exigen auth.uid exacto
        username: user.username,
        avatar: user.avatar,
        isPremium: user.isPremium,
        content,
        type,
        replyTo: replyData,
      },
      user.isAnonymous
    )
      .then((sentMessage) => {
        // ✅ Mensaje enviado exitosamente - se actualizará automáticamente vía onSnapshot
        // Track GA4 (background, no bloquea)
        trackMessageSent(currentRoom, user.id);

        // ✅ DEDUPLICACIÓN: Marcar el mensaje optimista con el ID real para eliminarlo cuando llegue
        // El listener de onSnapshot se encargará de eliminar el optimista cuando detecte el real
        if (sentMessage?.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticId 
              ? { ...msg, _realId: sentMessage.id, _sending: false }
              : msg
          ));
        }
      })
      .catch((error) => {
        console.error('❌ Error enviando mensaje:', error);

        // ❌ FALLÓ - Eliminar mensaje optimista y mostrar error
        setMessages(prev => prev.filter(m => m.id !== optimisticId));

        toast({
          title: "No pudimos entregar este mensaje",
          description: error.message || "Intenta de nuevo en un momento",
          variant: "destructive",
        });
      });
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
  // 🔒 LANDING PAGE: Guard clause para user === null
  // ========================================
  // ✅ CRITICAL: Este return DEBE estar DESPUÉS de TODOS los hooks
  // NO afecta a guests (user.isGuest), solo a visitantes sin sesión
  // Muestra landing page completa para mejor SEO y conversión
  if (!user) {
    return <ChatLandingPage roomSlug={roomId} />;
  }

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
            
            {/* ⏳ Mostrar prompt de carga cuando no hay mensajes y está cargando */}
            {isLoadingMessages && messages.length === 0 ? (
              <LoadingMessagesPrompt 
                roomName={roomsData.find(r => r.id === currentRoom)?.name || currentRoom}
              />
            ) : (
              <ChatMessages
              messages={messages}
              currentUserId={user.id}
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

              // Guardar edad en localStorage (múltiples claves para persistencia)
              const ageKey = `age_verified_${user.id}`;
              localStorage.setItem(ageKey, String(age));
              
              // ⚡ PERSISTENCIA: Guardar también por username para restaurar si cambia el UID
              if (user.isGuest || user.isAnonymous) {
                const usernameAgeKey = `age_verified_${username.toLowerCase().trim()}`;
                localStorage.setItem(usernameAgeKey, String(age));
                
                // Actualizar datos guardados del guest
                const guestDataKey = `guest_data_${username.toLowerCase().trim()}`;
                const savedData = localStorage.getItem(guestDataKey);
                if (savedData) {
                  try {
                    const saved = JSON.parse(savedData);
                    saved.age = age;
                    saved.lastUsed = Date.now();
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
    </>
  );
};

export default ChatPage;
