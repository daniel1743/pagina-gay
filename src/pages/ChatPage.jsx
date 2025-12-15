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
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage, markMessagesAsRead } from '@/services/chatService';
import { joinRoom, leaveRoom, subscribeToRoomUsers } from '@/services/presenceService';
import { useBotSystem } from '@/hooks/useBotSystem';
import { trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { checkUserSanctions, SANCTION_TYPES } from '@/services/sanctionsService';

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

  // ✅ VALIDACIÓN: Solo usuarios registrados pueden acceder a las salas de chat
  useEffect(() => {
    if (!user) {
      // Si no hay usuario, redirigir al auth
      toast({
        title: "Debes iniciar sesión",
        description: "Regístrate para acceder a las salas de chat",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (user.isGuest || user.isAnonymous) {
      // Si es invitado, redirigir al registro
      toast({
        title: "Registro Requerido 🔒",
        description: "Debes registrarte para acceder a las conversaciones. ¡Es gratis y toma solo 1 minuto!",
        variant: "destructive",
        duration: 5000,
      });
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // Si el usuario no está cargado o es invitado, no renderizar nada (evitar errores de permisos)
  if (!user || user.isGuest || user.isAnonymous) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // SEO: Actualizar título y canonical tag dinámicamente
  React.useEffect(() => {
    document.title = `Chat ${roomId} - Chactivo | Chat Gay Chile`;
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
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

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

  // 🤖 SISTEMA DE BOTS: Hook para gestionar bots automáticamente
  const { botStatus, triggerBotResponse, isActive: botsActive } = useBotSystem(
    roomId,
    roomUsers,
    messages,
    false, // Sistema de bots DESHABILITADO
    handleBotJoin // Callback para notificaciones de entrada
  );

  // Suscribirse a mensajes en tiempo real cuando cambia la sala
  useEffect(() => {
    setCurrentRoom(roomId);

    // Registrar presencia del usuario en la sala
    joinRoom(roomId, user);

    // Suscribirse a mensajes de Firestore en tiempo real
    const unsubscribeMessages = subscribeToRoomMessages(roomId, (newMessages) => {
      setMessages(newMessages);
    });

    // 🤖 Suscribirse a usuarios de la sala (para sistema de bots)
    const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
      setRoomUsers(users);
    });

    // Guardar funciones de desuscripción
    unsubscribeRef.current = () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };

    // Toast de bienvenida
    toast({
      title: `👋 ¡${user.username} se ha unido a la sala!`,
      description: `Estás en #${roomId}`,
    });

    // Cleanup: desuscribirse y remover presencia cuando se desmonta o cambia de sala
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      leaveRoom(roomId);
    };
  }, [roomId, user]);

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
   * ✅ Validación para usuarios invitados (máx 3 mensajes)
   * ✅ Contador persistente en Firestore para anónimos
   * 🤖 Activa respuesta de bots si están activos
   */
  const handleSendMessage = async (content, type = 'text') => {
    // Validación: usuarios anónimos solo 3 mensajes
    if (user.isAnonymous && guestMessageCount >= 3) {
      setShowVerificationModal(true);
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

      // Actualizar contador local si es anónimo
      if (user.isAnonymous) {
        setGuestMessageCount(prev => prev + 1);
      }

      // 🤖 Disparar respuesta de bot (probabilidad 40%)
      if (botsActive && type === 'text') {
        triggerBotResponse(content);
      }

      // El listener de onSnapshot actualizará automáticamente los mensajes
    } catch (error) {
      console.error('Error sending message:', error);

      // Mensaje específico si se excedió el límite
      if (error.code === 'permission-denied') {
        setShowVerificationModal(true);
        toast({
          title: "Límite alcanzado",
          description: "Has alcanzado el límite de 3 mensajes. Por favor, regístrate para continuar.",
          variant: "destructive",
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

  return (
    <>
      <div className="h-screen flex overflow-hidden bg-background pt-20">
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
          <VerificationModal onClose={() => setShowVerificationModal(false)} />
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
      </div>
    </>
  );
};

export default ChatPage;
