import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MessageSquare, Video, Heart, Send, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sendDirectMessage, sendPrivateChatRequest, addToFavorites, removeFromFavorites } from '@/services/socialService';

const UserActionsModal = ({ user: targetUser, onClose, onViewProfile }) => {
  const { user: currentUser } = useAuth();
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    currentUser?.favorites?.includes(targetUser.userId) || false
  );

  const handleSendMessage = async () => {
    // 🚧 PRÓXIMAMENTE - Mostrar toast en lugar de enviar
    toast({
      title: "🚧 Función Próximamente",
      description: "Los mensajes directos estarán disponibles muy pronto. ¡Estamos trabajando en ello! 💬",
    });
    setShowMessageInput(false);
    return;

    /* CÓDIGO ORIGINAL - DESHABILITADO TEMPORALMENTE
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await sendDirectMessage(currentUser.id, targetUser.userId, message.trim());

      toast({
        title: "✉️ Mensaje enviado",
        description: `Tu mensaje fue enviado a ${targetUser.username}`,
      });

      setMessage('');
      setShowMessageInput(false);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
    */
  };

  const handlePrivateChatRequest = async () => {
    // 🚧 PRÓXIMAMENTE - Mostrar toast en lugar de enviar solicitud
    toast({
      title: "🚧 Función Próximamente",
      description: "Los chats privados 1 a 1 estarán disponibles muy pronto. ¡Estamos trabajando en esta función! 📞",
    });
    return;

    /* CÓDIGO ORIGINAL - DESHABILITADO TEMPORALMENTE
    try {
      await sendPrivateChatRequest(currentUser.id, targetUser.userId);

      toast({
        title: "📞 Solicitud enviada",
        description: `Esperando que ${targetUser.username} acepte el chat privado`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud",
        variant: "destructive",
      });
    }
    */
  };

  const handleToggleFavorite = async () => {
    if (currentUser.isGuest || currentUser.isAnonymous) {
      toast({
        title: "👑 Función Premium",
        description: "Regístrate para agregar amigos favoritos",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        await removeFromFavorites(currentUser.id, targetUser.userId);
        setIsFavorite(false);
        toast({
          title: "💔 Eliminado de favoritos",
          description: `${targetUser.username} fue eliminado de tus favoritos`,
        });
      } else {
        // Verificar límite de 15 favoritos
        if (currentUser.favorites?.length >= 15) {
          toast({
            title: "Límite alcanzado",
            description: "Solo puedes tener hasta 15 amigos favoritos",
            variant: "destructive",
          });
          return;
        }

        await addToFavorites(currentUser.id, targetUser.userId);
        setIsFavorite(true);
        toast({
          title: "💖 Agregado a favoritos",
          description: `${targetUser.username} fue agregado a tus favoritos`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar favoritos",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-md rounded-2xl p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className={`${targetUser.isPremium ? 'premium-avatar-ring' : ''}`}>
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
                {targetUser.isPremium && <CheckCircle className="w-5 h-5 text-cyan-400" />}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {targetUser.isPremium ? 'Miembro Premium' : 'Miembro'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
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
                    onClick={() => {
                      onViewProfile();
                      onClose();
                    }}
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
                    onClick={() => {
                      toast({
                        title: "🚧 Función Próximamente",
                        description: "Los mensajes directos estarán disponibles muy pronto. ¡Estamos trabajando en ello! 💬",
                      });
                    }}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 text-left"
                  >
                    <MessageSquare className="w-5 h-5 mr-3 text-green-400" />
                    <div>
                      <p className="font-semibold">Enviar Mensaje Directo</p>
                      <p className="text-xs text-muted-foreground">
                        🚧 Próximamente - En desarrollo
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
                    <div>
                      <p className="font-semibold">Invitar a Chat Privado</p>
                      <p className="text-xs text-muted-foreground">
                        🚧 Próximamente - En desarrollo
                      </p>
                    </div>
                  </Button>
                </motion.div>

                {/* Agregar/Quitar de Favoritos */}
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
                        {isFavorite ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isFavorite
                          ? 'Este usuario es tu favorito'
                          : `Máximo 15 favoritos (${currentUser?.favorites?.length || 0}/15)`}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Mensaje Directo</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMessageInput(false)}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Escribe un mensaje para ${targetUser.username}...`}
                  className="min-h-[120px] resize-none bg-secondary border-2 border-border focus:border-primary"
                  maxLength={500}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{message.length}/500 caracteres</span>
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
                      {isSending ? 'Enviando...' : 'Enviar Mensaje'}
                    </Button>
                  </motion.div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  El mensaje aparecerá en las notificaciones de {targetUser.username}
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
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UserActionsModal;
