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
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateChatRequest, setPrivateChatRequest] = useState(null);
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setCurrentRoom(roomId);
    const storedMessages = JSON.parse(localStorage.getItem(`chactivo_messages_${roomId}`) || '[]');
    
    const demoMessage = {
      id: 'demo_message',
      userId: 'demo-user-123',
      username: 'Usuario Demo',
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=Demo`,
      content: '¡Hola! Haz clic en mi mensaje para probar el chat privado.',
      type: 'text',
      timestamp: new Date().toISOString(),
      room: roomId,
      reactions: { like: 1, dislike: 0 },
      isPremium: true
    };

    const welcomeMessage = {
      id: 'welcome_message',
      userId: 'system',
      username: 'Chactivo',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Chactivo`,
      content: roomWelcomeMessages[roomId] || `¡Bienvenido a la sala ${roomId}!`,
      type: 'text',
      timestamp: new Date().toISOString(),
      room: roomId,
    };
    
    const initialMessages = storedMessages.length > 0 ? storedMessages : [welcomeMessage, demoMessage];
    if (storedMessages.length === 0) {
      localStorage.setItem(`chactivo_messages_${roomId}`, JSON.stringify(initialMessages));
    }
    
    setMessages(initialMessages);
    
    toast({
      title: `👋 ¡${user.username} se ha unido a la sala!`,
      description: `Estás en #${roomId}`,
    });

  }, [roomId, user.username]);
  
  useEffect(() => {
    if (currentRoom !== roomId) {
      navigate(`/chat/${currentRoom}`, { replace: true });
    }
  }, [currentRoom, roomId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageReaction = (messageId, reaction) => {
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.map(msg => {
        if (msg.id === messageId) {
          const newReactions = { ...msg.reactions };
          if (!newReactions[reaction]) {
            newReactions[reaction] = 0;
          }
          newReactions[reaction]++;
          return { ...msg, reactions: newReactions };
        }
        return msg;
      });
      localStorage.setItem(`chactivo_messages_${currentRoom}`, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
  };

  const sendMessage = (content, type = 'text') => {
    if (user.isGuest && messageCount >= 3) {
      setShowVerificationModal(true);
      return;
    }

    if (user.isGuest) {
      setMessageCount(prev => prev + 1);
    }

    const newMessage = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      isPremium: user.isPremium,
      content,
      type,
      timestamp: new Date().toISOString(),
      room: currentRoom,
      reactions: { like: 0, dislike: 0 },
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(`chactivo_messages_${currentRoom}`, JSON.stringify(updatedMessages));
  };

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

          <ChatInput onSendMessage={sendMessage} />
        </div>

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onReport={() => {
              setReportTarget({type: 'user', ...selectedUser});
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