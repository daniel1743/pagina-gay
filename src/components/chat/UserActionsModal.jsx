import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare, Video, Heart, Send, X, CheckCircle, Crown, Shield, AlertTriangle, VolumeX, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sendDirectMessage, sendPrivateChatRequest, addToFavorites, removeFromFavorites, sendProfileComment } from '@/services/socialService';
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
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const adminRoles = new Set(['admin', 'administrator', 'superadmin']);
  const isCurrentUserAdmin = adminRoles.has(String(currentUser?.role || '').toLowerCase());
  const isGuestOrAnonymous = !currentUser?.id || currentUser?.isGuest || currentUser?.isAnonymous;
  const isPremiumOrAdmin = currentUser?.isPremium || isCurrentUserAdmin;
  const favoritesCount = currentUser?.favorites?.length || 0;
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [composeMode, setComposeMode] = useState('direct'); // direct | comment
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAdminProcessing, setIsAdminProcessing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    currentUser?.favorites?.includes(targetUser.userId) || false
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
        await sendProfileComment(currentUser.id, targetUser.userId, message.trim());
      } else {
        await sendDirectMessage(currentUser.id, targetUser.userId, message.trim());

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
          : `Tu mensaje fue enviado a ${targetUser.username}`,
      });

      setMessage('');
      setShowMessageInput(false);
      setComposeMode('direct');
      onClose();
    } catch (error) {
      toast({
        title: error?.message === 'BLOCKED'
          ? "No disponible"
          : composeMode === 'comment'
            ? "No pudimos enviar el comentario"
            : "No pudimos enviar el mensaje",
        description: error?.message === 'BLOCKED'
          ? "No puedes enviar mensajes a este usuario."
          : "Intenta de nuevo en un momento",
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
    console.log('🔍 [DEBUG] === INICIANDO SOLICITUD DE CHAT PRIVADO ===');
    console.log('👤 [DEBUG] currentUser:', currentUser);
    console.log('🔑 [DEBUG] currentUser.id:', currentUser?.id);
    console.log('🎯 [DEBUG] targetUser:', targetUser);
    console.log('🔑 [DEBUG] targetUser.userId:', targetUser?.userId);

    // Verificar límites
    const canSend = canSendChatInvite(currentUser);
    console.log('✅ [DEBUG] canSend result:', canSend);

    if (!canSend.allowed) {
      console.warn('⚠️ [DEBUG] Solicitud bloqueada. Razón:', canSend.reason);
      console.warn('⚠️ [DEBUG] Mensaje:', canSend.message);
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
      console.log('📤 [DEBUG] Enviando solicitud a Firestore...');
      console.log('📤 [DEBUG] Parámetros: fromUserId =', currentUser.id, ', toUserId =', targetUser.userId);

      await sendPrivateChatRequest(currentUser.id, targetUser.userId);

      console.log('✅ [DEBUG] Solicitud enviada exitosamente a Firestore');

      // Incrementar contador solo si no es Premium ni Admin
      if (!isPremiumOrAdmin) {
        console.log('📊 [DEBUG] Incrementando contador de invitaciones...');
        await incrementChatInvites(currentUser.id);
        const newLimits = getCurrentLimits(currentUser.id);
        setLimits(newLimits);
        console.log('📊 [DEBUG] Nuevos límites:', newLimits);
      } else {
        console.log('👑 [DEBUG] Usuario Premium/Admin - No incrementar límites');
      }

      console.log('🎉 [DEBUG] Mostrando toast de éxito');
      toast({
        title: "📞 Solicitud enviada",
        description: `Esperando que ${targetUser.username} acepte el chat privado`,
      });

      console.log('🔍 [DEBUG] Cerrando modal');
      onClose();
    } catch (error) {
      console.error('❌ [DEBUG] === ERROR AL ENVIAR SOLICITUD ===');
      console.error('❌ [DEBUG] Error completo:', error);
      console.error('❌ [DEBUG] Error message:', error.message);
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Error code:', error.code);

      toast({
        title: error?.message === 'BLOCKED' ? "No disponible" : "No pudimos enviar la solicitud",
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
        await removeFromFavorites(currentUser.id, targetUser.userId);
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

        await addToFavorites(currentUser.id, targetUser.userId);
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
    if (!currentUser?.id || !targetUser?.userId) {
      onClose();
      if (onShowRegistrationModal) {
        onShowRegistrationModal('bloquear');
      }
      return;
    }
    if (targetUser.userId === currentUser.id) return;

    const confirmed = window.confirm(`¿Bloquear a ${targetUser.username}? No podrán interactuar entre ustedes.`);
    if (!confirmed) return;

    try {
      await blockUser(currentUser.id, targetUser.userId, { source: 'chat_actions' });
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
                {/* Ver Perfil */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleViewProfile}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <User className="w-5 h-5 mr-3 text-cyan-400" />
                    <div>
                      <p className="font-semibold">Ver Perfil Completo</p>
                      <p className="text-xs text-muted-foreground">
                        Información, intereses y más
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Enviar Mensaje Directo */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleOpenMessageInput}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-green-400" />
                    <div className="flex-1">
                      <p className="font-semibold">Enviar Mensaje Directo</p>
                      <p className="text-xs text-muted-foreground">
                        {isPremiumOrAdmin ? (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Mensajes ilimitados
                          </span>
                        ) : (
                          `💬 Te quedan ${limits.directMessages.remaining}/${limits.directMessages.limit} mensajes hoy`
                        )}
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Invitar a Chat Privado */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handlePrivateChatRequest}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <Video className="w-5 h-5 mr-3 text-purple-400" />
                    <div className="flex-1">
                      <p className="font-semibold">Invitar a Chat Privado</p>
                      <p className="text-xs text-muted-foreground">
                        {isPremiumOrAdmin ? (
                          <span className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-400" />
                            Invitaciones ilimitadas
                          </span>
                        ) : (
                          `📞 Te quedan ${limits.chatInvites.remaining}/${limits.chatInvites.limit} invitaciones hoy`
                        )}
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
                      <p className="font-semibold">Dejar Comentario</p>
                      <p className="text-xs text-muted-foreground">
                        Envía un comentario breve para su perfil
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
