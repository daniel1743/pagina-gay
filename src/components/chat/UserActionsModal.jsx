import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare, MessageCircle, Heart, Send, X, CheckCircle, Crown, Shield, AlertTriangle, VolumeX, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { getOrCreatePrivateChat, sendMessageToPrivateChat, addToFavorites, removeFromFavorites, sendProfileComment, signalPrivateChatOpen } from '@/services/socialService';
import { blockUser } from '@/services/blockService';
import {
  canSendChatInvite,
  canSendDirectMessage,
  incrementChatInvites,
  incrementDirectMessages,
  getCurrentLimits,
} from '@/services/limitService';
const UserActionsModal = ({
  user: targetUser,
  onClose,
  onViewProfile,
  onShowRegistrationModal,
  onAdminQuickSanction,
  onAdminDeleteUserMessages,
  onAdminDeleteRoomMessages,
}) => {
  const { user: currentUser, authReady } = useAuth();
  const { setActivePrivateChat } = usePrivateChat();
  const navigate = useNavigate();
  const adminRoles = new Set(['admin', 'administrator', 'superadmin']);
  const isCurrentUserAdmin = adminRoles.has(String(currentUser?.role || '').toLowerCase());
  const isGuestOrAnonymous = !currentUser?.id || currentUser?.isGuest || currentUser?.isAnonymous;
  const isPremiumOrAdmin = currentUser?.isPremium || isCurrentUserAdmin;
  const favoritesCount = currentUser?.favorites?.length || 0;
  const targetUserId = targetUser?.userId || targetUser?.id || null;
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [composeMode, setComposeMode] = useState('direct'); // direct | comment
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAdminProcessing, setIsAdminProcessing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    (targetUserId && currentUser?.favorites?.includes(targetUserId)) || false
  );
  const [limits, setLimits] = useState({
    chatInvites: { used: 0, remaining: 5, limit: 5 },
    directMessages: { used: 0, remaining: 3, limit: 3 },
  });

  // Cargar límites actuales al montar (solo para usuarios FREE, no Admin ni Premium)
  useEffect(() => {
    if (currentUser?.id && !isPremiumOrAdmin) {
      const currentLimits = getCurrentLimits(currentUser.id);
      setLimits(currentLimits);
    }
  }, [currentUser?.id, isPremiumOrAdmin]);

  const openPrivateChatWithTarget = async ({ initialMessage = '', showOpenedToast = true } = {}) => {
    if (!currentUser?.id) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('chat privado', targetUser);
      }
      return { ok: false, reason: 'auth_required' };
    }

    if (String(currentUser.id).startsWith('temp_') || !authReady) {
      toast({
        title: 'Preparando modo invitado',
        description: 'Espera un momento mientras terminamos de conectar tu sesión.',
      });
      return { ok: false, reason: 'auth_sync_pending' };
    }

    if (!targetUserId || targetUserId === currentUser.id) {
      return { ok: false, reason: 'invalid_target' };
    }

    const { chatId, created } = await getOrCreatePrivateChat(currentUser.id, targetUserId);
    const partner = {
      id: targetUserId,
      userId: targetUserId,
      username: targetUser.username,
      avatar: targetUser.avatar,
      isPremium: targetUser.isPremium,
      role: targetUser.role,
      isGuest: targetUser.isGuest,
      isAnonymous: targetUser.isAnonymous,
    };

    setActivePrivateChat({
      chatId,
      partner,
      roomId: null,
      initialMessage: initialMessage || '',
    });

    if (showOpenedToast) {
      toast({
        title: 'Chat privado abierto',
        description: `Ya puedes conversar con ${targetUser.username}.`,
      });
    }

    void signalPrivateChatOpen({
      chatId,
      fromUserId: currentUser.id,
      toUserId: targetUserId,
      created: Boolean(created),
    }).catch((error) => {
      console.info('[PRIVATE_CHAT_SYNC] No se pudo emitir señal remota desde acciones de usuario', {
        chatId,
        targetUserId,
        message: error?.message || String(error),
      });
    });

    return { ok: true, chatId, partner };
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!currentUser?.id) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal(composeMode === 'comment' ? 'comentar' : 'mensajes directos');
      }
      return;
    }

    // ✅ Validar que el usuario objetivo NO sea invitado/anónimo
    if (targetUser.isGuest || targetUser.isAnonymous) {
      toast({
        title: "⚠️ No se puede enviar mensaje",
        description: "Este usuario no puede recibir mensajes directos porque no está registrado. Invítalo a registrarse para poder escribirle.",
        variant: "destructive",
        duration: 5000,
      });
      setShowMessageInput(false);
      onClose();
      return;
    }

    // Para comentario de perfil no usamos límites de DM
    if (composeMode === 'direct') {
      const canSend = canSendDirectMessage(currentUser);

      if (!canSend.allowed) {
        if (canSend.reason === 'guest') {
          toast({
            title: "👤 Regístrate",
            description: canSend.message,
            action: {
              label: "Registrarse",
              onClick: () => navigate('/auth')
            }
          });
          return;
        }

        if (canSend.reason === 'limit_reached') {
          toast({
            title: "⏱️ Límite Alcanzado",
            description: canSend.message,
            action: {
              label: "👑 Ver Premium",
              onClick: () => navigate('/premium')
            },
            duration: 5000,
          });
          return;
        }
      }
    }

    setIsSending(true);
    try {
      if (composeMode === 'comment') {
        await sendProfileComment(currentUser.id, targetUserId, message.trim());
      } else {
        const opened = await openPrivateChatWithTarget({
          initialMessage: '',
          showOpenedToast: false,
        });
        if (!opened?.ok || !opened.chatId) {
          throw new Error(opened?.reason || 'CHAT_OPEN_FAILED');
        }

        await sendMessageToPrivateChat(opened.chatId, {
          userId: currentUser.id,
          username: currentUser.username || 'Usuario',
          avatar: currentUser.avatar || '',
          content: message.trim(),
        });

        // Incrementar contador solo si no es Premium ni Admin
        if (!isPremiumOrAdmin) {
          await incrementDirectMessages(currentUser.id);
          const newLimits = getCurrentLimits(currentUser.id);
          setLimits(newLimits);
        }
      }

      toast({
        title: composeMode === 'comment' ? "💬 Comentario enviado" : "✉️ Mensaje enviado",
        description: composeMode === 'comment'
          ? `Tu comentario fue enviado al perfil de ${targetUser.username}`
          : `Tu mensaje fue enviado en el chat privado con ${targetUser.username}`,
      });

      setMessage('');
      setShowMessageInput(false);
      setComposeMode('direct');
      onClose();
    } catch (error) {
      console.error('Error enviando mensaje directo desde acciones de usuario:', error);
      console.info('[PRIVATE_CHAT_DEBUG] Ejecuta window.printPrivateChatDebug?.() o inspecciona window.__lastPrivateChatDebug');
      toast({
        title: error?.message === 'BLOCKED'
          ? "No disponible"
          : error?.code === 'PRIVATE_CONTACT_LOCKED'
            ? "Aún no compartas contacto"
          : composeMode === 'comment'
            ? "No pudimos enviar el comentario"
            : "No pudimos enviar el mensaje",
        description: error?.message === 'BLOCKED'
          ? "No puedes enviar mensajes a este usuario."
          : (error?.message || "Intenta de nuevo en un momento"),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenCommentInput = () => {
    // ✅ Validar que el usuario objetivo NO sea invitado/anónimo
    if (targetUser.isGuest || targetUser.isAnonymous) {
      toast({
        title: "⚠️ No se puede comentar",
        description: "Este usuario no puede recibir comentarios porque no está registrado.",
        variant: "destructive",
        duration: 5000,
      });
      onClose();
      return;
    }
    setComposeMode('comment');
    setShowMessageInput(true);
  };

  const handlePrivateChatRequest = async () => {
    if (!currentUser?.id) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('chat privado', targetUser);
      }
      return;
    }

    const canSend = canSendChatInvite(currentUser);

    if (!canSend.allowed) {
      if (canSend.reason === 'limit_reached') {
        toast({
          title: "⏱️ Límite Alcanzado",
          description: canSend.message,
          action: {
            label: "👑 Ver Premium",
            onClick: () => navigate('/premium')
          },
          duration: 5000,
        });
        return;
      }
    }

    try {
      const opened = await openPrivateChatWithTarget({ initialMessage: '' });
      if (!opened?.ok) {
        throw new Error(opened?.reason || 'CHAT_OPEN_FAILED');
      }

      // Incrementar contador solo si no es Premium ni Admin
      if (!isPremiumOrAdmin) {
        await incrementChatInvites(currentUser.id);
        const newLimits = getCurrentLimits(currentUser.id);
        setLimits(newLimits);
      }
      onClose();
    } catch (error) {
      console.error('Error opening private chat from actions modal:', error);

      toast({
        title: error?.message === 'BLOCKED' ? "No disponible" : "No pudimos abrir el chat privado",
        description: error?.message === 'BLOCKED'
          ? "No puedes iniciar un chat privado con este usuario."
          : "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async () => {
    // Validar que el usuario actual esté registrado
    if (isGuestOrAnonymous) {
      onClose(); // Cerrar el modal de acciones primero
      if (onShowRegistrationModal) {
        onShowRegistrationModal('favoritos');
      }
      return;
    }

    // ✅ Validar que el usuario objetivo NO sea invitado/anónimo
    if (targetUser.isGuest || targetUser.isAnonymous) {
      toast({
        title: "⚠️ No se puede agregar a favoritos",
        description: "Este usuario no puede ser agregado a favoritos porque no está registrado. Invítalo a registrarse para poder agregarlo.",
        variant: "destructive",
        duration: 5000,
      });
      onClose();
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(currentUser.id, targetUserId);
        setIsFavorite(false);
        toast({
          title: "💔 Eliminado de tu lista",
          description: `${targetUser.username} fue eliminado de tu lista de amigos`,
        });
      } else {
        // Verificar límite de 15 favoritos
        if (favoritesCount >= 15) {
          toast({
            title: "Límite alcanzado",
            description: "Solo puedes tener hasta 15 amigos",
            variant: "destructive",
          });
          return;
        }

        await addToFavorites(currentUser.id, targetUserId);
        setIsFavorite(true);
        toast({
          title: "💖 Agregado a tu lista",
          description: `${targetUser.username} fue agregado a tu lista de amigos`,
        });
      }

      // ✅ Cerrar modal automáticamente después de agregar/quitar de favoritos
      onClose();
    } catch (error) {
      toast({
        title: "No pudimos actualizar favoritos",
        description: "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser?.id || !targetUserId) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('bloquear');
      }
      return;
    }
    if (targetUserId === currentUser.id) return;

    const confirmed = window.confirm(`¿Bloquear a ${targetUser.username}? No podrán interactuar entre ustedes.`);
    if (!confirmed) return;

    try {
      await blockUser(currentUser.id, targetUserId, { source: 'chat_actions' });
      toast({
        title: "Usuario bloqueado",
        description: `Has bloqueado a ${targetUser.username}.`,
        variant: "destructive",
      });
      onClose();
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      toast({
        title: "No pudimos bloquear",
        description: "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    }
  };

  // Botón de "Ver Perfil"
  const handleViewProfile = () => {
    // Validar que el usuario actual esté registrado
    if (isGuestOrAnonymous) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('ver perfil');
      }
      return;
    }

    // Llamar a onViewProfile y cerrar modal
    onViewProfile();
    onClose();
  };

  // Botón de "Enviar Mensaje Directo"
  const handleOpenMessageInput = () => {
    if (!currentUser?.id) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('mensajes directos');
      }
      return;
    }

    // ✅ Validar que el usuario objetivo NO sea invitado/anónimo
    if (targetUser.isGuest || targetUser.isAnonymous) {
      toast({
        title: "⚠️ No se puede enviar mensaje",
        description: "Este usuario no puede recibir mensajes directos porque no está registrado. Invítalo a registrarse para poder escribirle.",
        variant: "destructive",
        duration: 5000,
      });
      onClose();
      return;
    }

    const canSend = canSendDirectMessage(currentUser);

    if (!canSend.allowed) {
      if (canSend.reason === 'guest') {
        toast({
          title: "👤 Regístrate",
          description: canSend.message,
          action: {
            label: "Registrarse",
            onClick: () => navigate('/auth')
          }
        });
        return;
      }

      if (canSend.reason === 'limit_reached') {
        toast({
          title: "⏱️ Límite Alcanzado",
          description: canSend.message,
          action: {
            label: "👑 Ver Premium",
            onClick: () => navigate('/premium')
          },
          duration: 5000,
        });
        return;
      }
    }

    setComposeMode('direct');
    setShowMessageInput(true);
  };

  const runAdminAction = async (action) => {
    if (!isCurrentUserAdmin || typeof action !== 'function') return;
    setIsAdminProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error('[ADMIN ACTION] Error:', error);
    } finally {
      setIsAdminProcessing(false);
    }
  };

  const handleAdminSanction = (type) => {
    runAdminAction(async () => {
      if (typeof onAdminQuickSanction !== 'function') return;
      await onAdminQuickSanction(targetUser, type);
      onClose();
    });
  };

  const handleAdminDeleteUserMessages = () => {
    runAdminAction(async () => {
      if (typeof onAdminDeleteUserMessages !== 'function') return;
      await onAdminDeleteUserMessages(targetUser);
      onClose();
    });
  };

  const handleAdminDeleteRoomMessages = () => {
    runAdminAction(async () => {
      if (typeof onAdminDeleteRoomMessages !== 'function') return;
      await onAdminDeleteRoomMessages();
      onClose();
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-md rounded-2xl p-0 max-h-[90dvh] overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogDescription className="sr-only">
            Acciones disponibles para interactuar con {targetUser?.username || 'este usuario'} y abrir una conversación privada.
          </DialogDescription>
          <div className="flex items-center gap-4">
            <div className={`${
              targetUser.role === 'admin'
                ? 'admin-avatar-ring'
                : targetUser.verified
                  ? 'verified-avatar-ring'
                  : targetUser.isPremium
                    ? 'premium-avatar-ring'
                    : ''
            }`}>
              <Avatar className="w-16 h-16">
                <AvatarImage src={targetUser.avatar} alt={targetUser.username} />
                <AvatarFallback className="bg-secondary text-2xl">
                  {targetUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                {targetUser.username}
                {(targetUser.isPremium || targetUser.role === 'admin') && (
                  <CheckCircle className="w-5 h-5 text-[#FFD700]" />
                )}
                {targetUser.verified && !targetUser.isPremium && targetUser.role !== 'admin' && (
                  <CheckCircle className="w-5 h-5 text-[#1DA1F2]" />
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {targetUser.isPremium ? 'Miembro Premium' : 'Miembro'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3 overflow-y-auto max-h-[calc(90dvh-10rem)]">
          <AnimatePresence>
            {!showMessageInput ? (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {/* Chat Privado */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handlePrivateChatRequest}
                    className="w-full justify-start h-auto py-3 text-left bg-cyan-500 hover:bg-cyan-500/90 text-white border border-cyan-400/40 shadow-sm"
                  >
                    <MessageCircle className="w-5 h-5 mr-3 text-white" />
                    <div className="flex-1">
                      <p className="font-semibold">Chat privado</p>
                      <p className="text-xs text-cyan-50/90">
                        {isPremiumOrAdmin ? (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-200" />
                            Abrir conversación directa al instante
                          </span>
                        ) : (
                          `💬 Te quedan ${limits.chatInvites.remaining}/${limits.chatInvites.limit} aperturas hoy`
                        )}
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Enviar Mensaje Directo */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleOpenMessageInput}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left border-green-500/30 hover:bg-green-500/5"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-green-400" />
                    <div className="flex-1">
                      <p className="font-semibold">Mensaje directo</p>
                      <p className="text-xs text-muted-foreground">
                        {isPremiumOrAdmin ? (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Mensajes ilimitados
                          </span>
                        ) : (
                          `✉️ Te quedan ${limits.directMessages.remaining}/${limits.directMessages.limit} mensajes hoy`
                        )}
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Ver Perfil */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleViewProfile}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <User className="w-5 h-5 mr-3 text-cyan-400" />
                    <div>
                      <p className="font-semibold">Ver perfil</p>
                      <p className="text-xs text-muted-foreground">
                        Información, intereses y más
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Agregar/Quitar de Lista de Amigos */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleToggleFavorite}
                    variant="outline"
                    className={`w-full justify-start h-auto py-3 text-left ${
                      isFavorite ? 'border-pink-400 bg-pink-400/10' : ''
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 mr-3 ${isFavorite ? 'fill-pink-400 text-pink-400' : 'text-pink-400'}`}
                    />
                    <div>
                      <p className="font-semibold">
                        {isFavorite ? 'Quitar de mi lista de amigos' : 'Agregar a mi lista de amigos'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isFavorite
                          ? 'Este usuario está en tu lista'
                          : `Máximo 15 amigos (${favoritesCount}/15)`}
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Dejar Comentario */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleOpenCommentInput}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-cyan-400" />
                    <div>
                      <p className="font-semibold">Dejar comentario</p>
                      <p className="text-xs text-muted-foreground">
                        Envía un comentario breve para su perfil
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Bloquear Usuario */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleBlockUser}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left border-red-500/40 text-red-400 hover:bg-red-500/10"
                  >
                    <Shield className="w-5 h-5 mr-3 text-red-400" />
                    <div>
                      <p className="font-semibold">Bloquear Usuario</p>
                      <p className="text-xs text-red-300/80">
                        No podrán interactuar entre ustedes
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Moderación rápida para admin */}
                {isCurrentUserAdmin && (
                  <div className="mt-4 space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                      Admin Moderación
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleAdminSanction('warning')}
                        variant="outline"
                        disabled={isAdminProcessing}
                        className="w-full justify-start h-auto py-2.5 text-left border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Advertir
                      </Button>
                      <Button
                        onClick={() => handleAdminSanction('mute')}
                        variant="outline"
                        disabled={isAdminProcessing}
                        className="w-full justify-start h-auto py-2.5 text-left border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
                      >
                        <VolumeX className="w-4 h-4 mr-2" />
                        Silenciar 24h
                      </Button>
                      <Button
                        onClick={() => handleAdminSanction('ban')}
                        variant="outline"
                        disabled={isAdminProcessing}
                        className="w-full justify-start h-auto py-2.5 text-left border-red-500/50 text-red-300 hover:bg-red-500/15"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Expulsar
                      </Button>
                      <Button
                        onClick={handleAdminDeleteUserMessages}
                        variant="outline"
                        disabled={isAdminProcessing}
                        className="w-full justify-start h-auto py-2.5 text-left border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Borrar mensajes de este usuario
                      </Button>
                      <Button
                        onClick={handleAdminDeleteRoomMessages}
                        variant="outline"
                        disabled={isAdminProcessing}
                        className="w-full justify-start h-auto py-2.5 text-left border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Vaciar sala actual
                      </Button>
                    </div>
                  </div>
                )}

                {/* CTA Premium (solo si no es Premium ni Admin y tiene límites bajos) */}
                {!isPremiumOrAdmin && (limits.chatInvites.remaining <= 1 || limits.directMessages.remaining <= 1) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={() => {
                        onClose();
                        navigate('/premium');
                      }}
                      className="w-full gold-gradient text-gray-900 font-bold py-4"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Desbloquear Mensajes Ilimitados
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">
                    {composeMode === 'comment' ? 'Comentario de Perfil' : 'Mensaje Directo'}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMessageInput(false)}
                    className="text-muted-foreground"
                    aria-label="Cerrar formulario de mensaje"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    composeMode === 'comment'
                      ? `Escribe un comentario para ${targetUser.username}...`
                      : `Escribe un mensaje para ${targetUser.username}...`
                  }
                  className="min-h-[120px] resize-none bg-secondary border-2 border-border focus:border-primary"
                  maxLength={500}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{message.length}/500 caracteres</span>
                  {composeMode === 'direct' && !isPremiumOrAdmin && (
                    <span className="text-amber-400 font-medium">
                      {limits.directMessages.remaining}/{limits.directMessages.limit} restantes hoy
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowMessageInput(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isSending}
                      className="w-full magenta-gradient text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSending ? 'Enviando...' : composeMode === 'comment' ? 'Enviar Comentario' : 'Enviar Mensaje'}
                    </Button>
                  </motion.div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {composeMode === 'comment'
                    ? `El comentario aparecerá en las notificaciones de ${targetUser.username}`
                    : `El mensaje aparecerá en las notificaciones de ${targetUser.username}`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionsModal;
