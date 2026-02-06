import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChatScrollManager } from '@/hooks/useChatScrollManager';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import NewMessagesIndicator from '@/components/chat/NewMessagesIndicator';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ReplyIndicator from '@/components/chat/ReplyIndicator';
import UserProfileModal from '@/components/chat/UserProfileModal';
import UserActionsModal from '@/components/chat/UserActionsModal';
import ReportModal from '@/components/chat/ReportModal';
import AgeVerificationModal from '@/components/chat/AgeVerificationModal';
import ChatLandingPage from '@/components/chat/ChatLandingPage';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { toast } from '@/components/ui/use-toast';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';
import { 
  sendSecondaryMessage, 
  subscribeToSecondaryRoomMessages, 
  addReactionToSecondaryMessage, 
  markSecondaryMessagesAsRead, 
  generateUUID 
} from '@/services/chatService';
import { 
  joinRoom, 
  leaveRoom, 
  subscribeToRoomUsers, 
  updateUserActivity, 
  cleanInactiveUsers 
} from '@/services/presenceService';
import { validateMessage } from '@/services/antiSpamService';
import { auth, db } from '@/config/firebase';
import { checkUserSanctions, SANCTION_TYPES } from '@/services/sanctionsService';
import { roomsData } from '@/config/rooms';
import { trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { notificationSounds } from '@/services/notificationSounds';

const ChatSecondaryPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signInAsGuest, updateAnonymousUserProfile } = useAuth();

  // Estados
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionsTarget, setUserActionsTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationModalFeature, setRegistrationModalFeature] = useState(null);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [hasUnreadReplies, setHasUnreadReplies] = useState(false);
  const [lastReplyUsername, setLastReplyUsername] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false); // ✅ Modal nickname - solo al intentar escribir

  // Refs
  const unsubscribeRef = useRef(null);
  const unsubscribeUsersRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const lastReadMessageIdRef = useRef(null);
  const autoLoginAttemptedRef = useRef(false);
  const deliveryTimeoutsRef = useRef(new Map());

  // Scroll manager
  const scrollManager = useChatScrollManager({
    messages,
    currentUserId: user?.id || null,
    isInputFocused,
  });

  // Cerrar sidebar en móvil al cambiar tamaño
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [currentRoom]);

  // SEO: Canonical tag
  useCanonical(`/chat-secondary/${roomId}`);

  // Track page view
  useEffect(() => {
    if (roomId) {
      trackPageView(`/chat-secondary/${roomId}`, `Chat Secundario - ${roomId}`);
      trackRoomJoined(roomId);
    }
    return () => {
      if (roomId) {
        trackPageExit(`/chat-secondary/${roomId}`, 0);
      }
    };
  }, [roomId]);

  // Verificar edad
  useEffect(() => {
    if (!user || !user.id) return;

    const ageVerifiedFromLanding = sessionStorage.getItem(`age_verified_${user.username}`) === 'true';

    if (user.isGuest || user.isAnonymous) {
      const activeGuests = JSON.parse(localStorage.getItem('active_guests') || '[]');
      if (activeGuests.length > 0) {
        const lastGuest = activeGuests[0];
        const guestDataKey = `guest_data_${lastGuest.username.toLowerCase().trim()}`;
        const savedData = localStorage.getItem(guestDataKey);
        
        if (savedData) {
          try {
            const saved = JSON.parse(savedData);
            let storedAge = localStorage.getItem(`age_verified_${saved.uid || user.id}`);
            if (!storedAge) {
              storedAge = localStorage.getItem(`age_verified_${saved.username.toLowerCase().trim()}`);
            }
            if (!storedAge && saved.age) {
              storedAge = String(saved.age);
            }
            if (storedAge && Number(storedAge) >= 18) {
              setIsAgeVerified(true);
              setShowAgeVerification(false);
              return;
            }
          } catch (e) {
            console.debug('[AGE VERIFICATION] Error:', e);
          }
        }
      }
    }

    if (ageVerifiedFromLanding) {
      setIsAgeVerified(true);
      setShowAgeVerification(false);
      localStorage.setItem(`age_verified_${user.id}`, '18');
    } else {
      if (user.isGuest || user.isAnonymous) {
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        localStorage.setItem(`age_verified_${user.id}`, '18');
        return;
      }
      setIsAgeVerified(true);
      setShowAgeVerification(false);
      const ageKey = `age_verified_${user.id}`;
      if (!localStorage.getItem(ageKey)) {
        localStorage.setItem(ageKey, '18');
      }
    }
  }, [user]);

  // Inicializar sonidos
  useEffect(() => {
    if (!user) return;
    const initialized = notificationSounds.init();
    if (!initialized) {
      const handleFirstInteraction = () => {
        notificationSounds.init();
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });
      return () => {
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      };
    }
  }, [user]);

  // Suscripción a mensajes
  useEffect(() => {
    if (!user || !user.id) return;

    setCurrentRoom(roomId);
    setIsLoadingMessages(true);

    cleanInactiveUsers(roomId);
    joinRoom(roomId, user);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setIsLoadingMessages(true);
    const unsubscribeMessages = subscribeToSecondaryRoomMessages(roomId, (newMessages) => {
      setIsLoadingMessages(false);
      setMessages(newMessages);

      // Reproducir sonido para nuevos mensajes
      if (newMessages.length > previousMessageCountRef.current) {
        const newCount = newMessages.length - previousMessageCountRef.current;
        if (newCount > 0 && newCount <= 5) {
          notificationSounds.playMessageReceivedSound();
        }
      }
      previousMessageCountRef.current = newMessages.length;
    });

    unsubscribeRef.current = unsubscribeMessages;

    // Suscripción a usuarios
    if (unsubscribeUsersRef.current) {
      unsubscribeUsersRef.current();
    }
    const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
      setRoomUsers(users);
    });
    unsubscribeUsersRef.current = unsubscribeUsers;

    // Actualizar actividad periódicamente
    const activityInterval = setInterval(() => {
      updateUserActivity(roomId);
    }, 30000);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (unsubscribeUsersRef.current) {
        unsubscribeUsersRef.current();
      }
      clearInterval(activityInterval);
      leaveRoom(roomId);
    };
  }, [roomId, user]);

  // Detectar respuestas
  useEffect(() => {
    if (!user || !user.id || messages.length === 0) return;

    const userMessages = messages.filter(m => m.userId === user.id);
    const userMessageIds = new Set(userMessages.map(m => m.id));
    
    const repliesToUser = messages.filter(m => 
      m.replyTo && 
      m.replyTo.messageId && 
      userMessageIds.has(m.replyTo.messageId) &&
      m.userId !== user.id
    );

    if (repliesToUser.length > 0 && scrollManager.scrollState !== 'AUTO_FOLLOW') {
      const latestReply = repliesToUser[repliesToUser.length - 1];
      setHasUnreadReplies(true);
      if (latestReply.username) {
        setLastReplyUsername(latestReply.username);
      }
    } else if (scrollManager.scrollState === 'AUTO_FOLLOW') {
      setHasUnreadReplies(false);
      if (messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
      }
    }
  }, [messages, user, scrollManager.scrollState]);

  // ✅ NO auto-login con GuestXXXX - el usuario DEBE elegir nickname en el modal

  // Handlers
  const handleSendMessage = async (content, type = 'text') => {
    if (!user || !user.id) {
      toast({
        title: "Debes iniciar sesión",
        description: "Inicia sesión para enviar mensajes.",
        variant: "destructive",
      });
      return;
    }

    if (!isAgeVerified) {
      const ageKey = `age_verified_${user.id}`;
      const storedAge = localStorage.getItem(ageKey);
      if (storedAge && Number(storedAge) >= 18) {
        setIsAgeVerified(true);
        setShowAgeVerification(false);
      } else {
        setShowAgeVerification(true);
        return;
      }
    }

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

    // Optimistic UI
    const optimisticId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateUUID();
    const nowMs = Date.now();
    
    const optimisticAvatar = user.avatar && user.avatar.trim() && !user.avatar.includes('undefined')
      ? user.avatar
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || user.id || 'guest')}`;
    
    const replyData = replyTo ? {
      messageId: replyTo.messageId,
      username: replyTo.username,
      content: replyTo.content,
    } : null;

    const optimisticMessage = {
      id: optimisticId,
      clientId,
      userId: user.id,
      username: user.username || 'Usuario',
      avatar: optimisticAvatar,
      isPremium: user.isPremium || false,
      content,
      type,
      timestamp: new Date().toISOString(),
      timestampMs: nowMs,
      replyTo: replyData,
      _optimistic: true,
      status: 'sending',
      _retryCount: 0,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setReplyTo(null);

    setTimeout(() => {
      const container = scrollManager?.containerRef?.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 0);

    notificationSounds.playMessageSentSound();

    const validationPromise = validateMessage(content, user.id, user.username, currentRoom)
      .then(validation => {
        if (!validation.allowed) {
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
          const isContactBlock = ['phone_number', 'email', 'forbidden_word'].includes(validation.type);
          toast({
            title: isContactBlock ? "No permitido aquí" : "❌ Mensaje Bloqueado",
            description: isContactBlock
              ? "OPIN es donde puedes publicar tu contacto y lo que buscas. Otros te encontrarán ahí."
              : (validation.details || validation.reason),
            variant: isContactBlock ? "default" : "destructive",
            duration: 8000,
            ...(isContactBlock && {
              action: { label: "Ir a OPIN", onClick: () => navigate('/opin') },
            }),
          });
          return false;
        }
        return true;
      })
      .catch(() => true);

    Promise.all([validationPromise])
      .then(([isValid]) => {
        if (!isValid) return;
        
        const messageAvatar = user.avatar && user.avatar.trim() && !user.avatar.includes('undefined')
          ? user.avatar
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username || user.id || 'guest')}`;

        return sendSecondaryMessage(
          currentRoom,
          {
            clientId,
            userId: auth.currentUser?.uid || user.id,
            username: user.username || 'Usuario',
            avatar: messageAvatar,
            isPremium: user.isPremium || false,
            content,
            type,
            replyTo: replyData,
          },
          user.isAnonymous
        );
      })
      .then((sentMessage) => {
        if (!sentMessage) return;
        trackMessageSent(currentRoom, user.id);
        if (sentMessage?.id) {
          setMessages(prev => prev.map(msg =>
            msg.id === optimisticId
              ? { ...msg, _realId: sentMessage.id, status: 'sent', _sentAt: Date.now() }
              : msg
          ));

          // ⏱️ DESHABILITADO: Timeout de 20 segundos causaba falsos positivos
          // Si el mensaje se escribió exitosamente en Firebase (.then), confiar en que se envió
          // El estado 'delivered' se detectará automáticamente cuando llegue el snapshot

          /* CÓDIGO ANTERIOR: Timeout que marcaba mensajes como fallidos incorrectamente
          const deliveryTimeout = setTimeout(() => {
            setMessages(prev => {
              const message = prev.find(m => m.id === optimisticId || m._realId === sentMessage.id);
              if (message && message.status !== 'delivered' && message.userId === user?.id) {
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
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticId
            ? { ...msg, status: 'error', _error: error }
            : msg
        ));

        // ⚡ Toast de error solo en desarrollo (en producción solo indicador visual)
        if (import.meta.env.DEV) {
          toast({
            title: "No pudimos entregar este mensaje",
            description: "Toca el mensaje para reintentar",
            variant: "destructive",
            duration: 5000,
          });
        }
      });
  };

  const handleMessageReaction = async (messageId, reaction) => {
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
      await addReactionToSecondaryMessage(currentRoom, messageId, reaction);
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "No pudimos agregar la reacción",
        description: "Toca para reintentar",
        variant: "destructive",
      });
    }
  };

  const handleReply = (message) => {
    setReplyTo({
      messageId: message.id,
      username: message.username,
      content: message.content,
    });
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handlePrivateChatRequest = async (targetUser) => {
    if (!auth.currentUser) {
      toast({
        title: "Regístrate para chatear en privado",
        description: "Los usuarios no registrados no pueden enviar mensajes privados.",
        variant: "default",
        duration: 5000,
        action: {
          label: "Registrarse",
          onClick: () => navigate('/auth')
        }
      });
      return;
    }
    // Implementar lógica de chat privado si es necesario
  };

  // Loading
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

  // ✅ Invitados pueden ver el chat - el modal aparece solo al intentar escribir

  return (
    <>
      <div className="h-screen overflow-hidden bg-background lg:flex" style={{ height: '100dvh', maxHeight: '100dvh' }}>
        <ChatSidebar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="w-full lg:flex-1 flex flex-col overflow-hidden min-w-0 h-full">
          <ChatHeader
            currentRoom={currentRoom}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
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
                onScroll={() => {}}
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

          <ReplyIndicator
            show={hasUnreadReplies && scrollManager.scrollState !== 'AUTO_FOLLOW'}
            onClick={() => {
              scrollManager.scrollToBottom();
              setHasUnreadReplies(false);
            }}
            username={lastReplyUsername}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            roomId={roomId}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
            onRequestNickname={() => setShowNicknameModal(true)}
            isGuest={!user}
          />
        </div>

        {userActionsTarget && (
          <UserActionsModal
            user={{
              ...userActionsTarget,
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
          />
        )}

        {reportTarget && user && (
          <ReportModal
            target={reportTarget}
            onClose={() => setReportTarget(null)}
            isGuest={user?.isGuest}
          />
        )}

        <AgeVerificationModal
          isOpen={showAgeVerification}
          onClose={() => setShowAgeVerification(false)}
          onConfirm={async (age, username, avatar) => {
            if (!user || !user.id) return;
            
            try {
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

              const ageKey = `age_verified_${user.id}`;
              localStorage.setItem(ageKey, String(age));
              
              if (user.isGuest || user.isAnonymous) {
                const usernameAgeKey = `age_verified_${username.toLowerCase().trim()}`;
                localStorage.setItem(usernameAgeKey, String(age));
              }
              
              setIsAgeVerified(true);
              setShowAgeVerification(false);
              
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

        <RegistrationRequiredModal
          open={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          featureName={registrationModalFeature}
        />

        {/* ✅ Modal de nickname para invitados: aparece SOLO al intentar escribir */}
        <GuestUsernameModal
          open={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          chatRoomId={roomId}
          openSource="user"
          onGuestReady={() => {
            setShowNicknameModal(false);
          }}
        />
      </div>
    </>
  );
};

export default ChatSecondaryPage;

