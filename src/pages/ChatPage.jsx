import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import UserProfileModal from '@/components/chat/UserProfileModal';
import ReportModal from '@/components/chat/ReportModal';
import PrivateChatRequestModal from '@/components/chat/PrivateChatRequestModal';
import VerificationModal from '@/components/chat/VerificationModal';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { toast } from '@/components/ui/use-toast';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import { sendMessage, subscribeToRoomMessages, addReactionToMessage } from '@/services/chatService';
import { joinRoom, leaveRoom } from '@/services/presenceService';

const roomWelcomeMessages = {
  'conversas-libres': '¡Bienvenido a Conversas Libres! Habla de lo que quieras.',
  'gaming': '¡Gamers, uníos! ¿A qué están jugando?',
  'mas-30': 'Espacio para mayores de 30. ¡Comparte tus experiencias!',
  'amistad': '¿Buscas nuevos amigos? ¡Este es el lugar!',
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
  const { user, guestMessageCount, setGuestMessageCount } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateChatRequest, setPrivateChatRequest] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Suscribirse a mensajes en tiempo real cuando cambia la sala
  useEffect(() => {
    setCurrentRoom(roomId);

    // Registrar presencia del usuario en la sala
    joinRoom(roomId, user);

    // Suscribirse a mensajes de Firestore en tiempo real
    const unsubscribe = subscribeToRoomMessages(roomId, (newMessages) => {
      setMessages(newMessages);
    });

    // Guardar función de desuscripción
    unsubscribeRef.current = unsubscribe;

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
   */
  const handleSendMessage = async (content, type = 'text') => {
    // Validación: usuarios anónimos solo 3 mensajes
    if (user.isAnonymous && guestMessageCount >= 3) {
      setShowVerificationModal(true);
      return;
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

      // Actualizar contador local si es anónimo
      if (user.isAnonymous) {
        setGuestMessageCount(prev => prev + 1);
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

  return (
    <>
      <Helmet>
        <title>Chat: {currentRoom} - Chactivo</title>
        <meta name="description" content={`Chatea en tiempo real en la sala ${currentRoom} de Chactivo.`} />
      </Helmet>

      <div className="h-screen flex overflow-hidden bg-background">
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
          />

          <ChatMessages
            messages={messages}
            currentUserId={user.id}
            onUserClick={setSelectedUser}
            onReport={setReportTarget}
            onPrivateChat={handlePrivateChatRequest}
            onReaction={handleMessageReaction}
            messagesEndRef={messagesEndRef}
          />

          <TypingIndicator />

          <ChatInput onSendMessage={handleSendMessage} />
        </div>

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
            onClose={() => setActivePrivateChat(null)}
          />
        )}
      </div>
    </>
  );
};

export default ChatPage;
