import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Video, Check, X, ExternalLink, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { markNotificationAsRead, respondToPrivateChatRequest } from '@/services/socialService';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationsPanel = ({ isOpen, onClose, notifications }) => {
  const { user } = useAuth();

  const handleAcceptPrivateChat = async (notification) => {
    try {
      const result = await respondToPrivateChatRequest(user.id, notification.id, true);

      toast({
        title: "✅ Chat privado aceptado",
        description: `Ahora estás conectado con ${notification.fromUsername}`,
      });

      // Aquí podrías abrir automáticamente la ventana de chat privado
      // onOpenPrivateChat(result.chatId);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aceptar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleRejectPrivateChat = async (notification) => {
    try {
      await respondToPrivateChatRequest(user.id, notification.id, false);

      toast({
        title: "Solicitud rechazada",
        description: "Has rechazado la solicitud de chat privado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(user.id, notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getTimeAgo = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Hace un momento';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-accent/30">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-foreground">Notificaciones</h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {notifications.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {notifications.length} {notifications.length === 1 ? 'nueva' : 'nuevas'}
                </p>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[500px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No tienes notificaciones</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Los mensajes y solicitudes aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-accent/50 transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      {/* Mensaje Directo */}
                      {notification.type === 'direct_message' && (
                        <div className="flex gap-3">
                          <MessageSquare className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              Mensaje de {notification.fromUsername || 'un usuario'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {getTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Solicitud de Chat Privado */}
                      {notification.type === 'private_chat_request' && (
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className={`${notification.fromIsPremium ? 'premium-avatar-ring' : ''}`}>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={notification.fromAvatar} />
                                <AvatarFallback className="bg-secondary text-xs">
                                  {notification.fromUsername?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-foreground flex items-center gap-1">
                                {notification.fromUsername}
                                {notification.fromIsPremium && (
                                  <CheckCircle className="w-3 h-3 text-cyan-400" />
                                )}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Video className="w-4 h-4 text-purple-400" />
                                <p className="text-sm text-muted-foreground">
                                  quiere conectar en chat privado
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {getTimeAgo(notification.timestamp)}
                              </p>
                            </div>
                          </div>

                          {notification.status === 'pending' && (
                            <div className="flex gap-2">
                              <motion.div
                                className="flex-1"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  onClick={() => handleRejectPrivateChat(notification)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-red-500 border-red-500 hover:bg-red-500/10"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </motion.div>
                              <motion.div
                                className="flex-1"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  onClick={() => handleAcceptPrivateChat(notification)}
                                  size="sm"
                                  className="w-full magenta-gradient text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Aceptar
                                </Button>
                              </motion.div>
                            </div>
                          )}

                          {notification.status === 'accepted' && (
                            <div className="flex items-center gap-2 text-sm text-green-500">
                              <Check className="w-4 h-4" />
                              <span>Aceptada - Chat activo</span>
                            </div>
                          )}

                          {notification.status === 'rejected' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <X className="w-4 h-4" />
                              <span>Rechazada</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
