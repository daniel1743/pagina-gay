import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  X, Bell, BellOff, CheckCheck, Sparkles, Megaphone,
  Info, AlertCircle, Wrench, Gift, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToSystemNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  requestNotificationPermission,
  NOTIFICATION_TYPES
} from '@/services/systemNotificationsService';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const SystemNotificationsPanel = ({ isOpen, onClose, onNotificationCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!user || user.isGuest || !isOpen) return;

    const unsubscribe = subscribeToSystemNotifications(user.id, (notifs) => {
      setNotifications(notifs);

      // Enviar contador de no leídas al Header
      const unreadCount = notifs.filter(n => !n.read).length;
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount);
      }
    });

    return () => unsubscribe();
  }, [user, isOpen, onNotificationCountChange]);

  // Solicitar permisos de notificaciones
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      toast({
        title: "Notificaciones Habilitadas ✅",
        description: "Ahora recibirás notificaciones en tiempo real",
      });
    } else {
      toast({
        title: "Permiso Denegado",
        description: "No podrás recibir notificaciones del navegador",
        variant: "destructive",
      });
    }
  };

  // Marcar notificación como leída
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.id);
      toast({
        title: "Notificaciones Leídas",
        description: "Todas las notificaciones han sido marcadas como leídas",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Manejar clic en notificación
  const handleNotificationClick = (notification) => {
    // Marcar como leída
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Abrir modal con el mensaje completo
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  // Manejar cierre del modal y navegación
  const handleModalClose = () => {
    setShowNotificationModal(false);
    // Si tiene link, navegar después de cerrar el modal
    if (selectedNotification?.link) {
      setTimeout(() => {
        navigate(selectedNotification.link);
      }, 300);
    }
    setSelectedNotification(null);
  };

  // Obtener icono según tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.WELCOME:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case NOTIFICATION_TYPES.UPDATE:
        return <Info className="w-5 h-5 text-blue-400" />;
      case NOTIFICATION_TYPES.NEWS:
        return <Megaphone className="w-5 h-5 text-green-400" />;
      case NOTIFICATION_TYPES.BROADCAST:
        return <Megaphone className="w-5 h-5 text-cyan-400" />;
      case NOTIFICATION_TYPES.ANNOUNCEMENT:
        return <Bell className="w-5 h-5 text-yellow-400" />;
      case NOTIFICATION_TYPES.FEATURE:
        return <Gift className="w-5 h-5 text-pink-400" />;
      case NOTIFICATION_TYPES.MAINTENANCE:
        return <Wrench className="w-5 h-5 text-orange-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  // Obtener color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-500/5';
      case 'high':
        return 'border-l-4 border-orange-500 bg-orange-500/5';
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-500/5';
      case 'low':
        return 'border-l-4 border-gray-500 bg-gray-500/5';
      default:
        return 'border-l-4 border-accent bg-accent/5';
    }
  };

  // Formatear tiempo
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

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notificaciones
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Contador y acciones */}
              <div className="flex items-center justify-between">
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                  </p>
                )}
                {notifications.length > 0 && unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Marcar todas como leídas
                  </Button>
                )}
              </div>

              {/* Solicitar permisos de notificaciones push */}
              {notificationPermission === 'default' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      Activa las notificaciones para recibir alertas en tiempo real
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestPermission}
                    size="sm"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Bell className="w-3 h-3 mr-2" />
                    Activar Notificaciones
                  </Button>
                </motion.div>
              )}

              {notificationPermission === 'denied' && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-2">
                    <BellOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-300">
                      Las notificaciones están bloqueadas. Actívalas en la configuración de tu navegador.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Notificaciones */}
            <ScrollArea className="h-[500px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No tienes notificaciones</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Te avisaremos cuando haya novedades
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
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      } ${getPriorityColor(notification.priority)} hover:bg-accent/50`}
                    >
                      <div className="flex gap-3">
                        {/* Icono */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="flex-shrink-0 mt-1"
                        >
                          {getNotificationIcon(notification.type)}
                        </motion.div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-foreground">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.createdAt)}
                            </p>

                            {notification.link && (
                              <div className="flex items-center gap-1 text-xs text-cyan-400">
                                <span>Ver más</span>
                                <ExternalLink className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>

          {/* Modal de Notificación Detallada */}
          <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
            <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
              {selectedNotification && (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex-shrink-0"
                      >
                        {getNotificationIcon(selectedNotification.type)}
                      </motion.div>
                      <DialogTitle className="text-2xl font-bold">
                        {selectedNotification.title}
                      </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-muted-foreground">
                      {getTimeAgo(selectedNotification.createdAt)}
                      {selectedNotification.priority && (
                        <span className="ml-2 px-2 py-1 rounded-full text-xs bg-accent/30">
                          {selectedNotification.priority === 'urgent' && '🔴 Urgente'}
                          {selectedNotification.priority === 'high' && '🟠 Alta'}
                          {selectedNotification.priority === 'normal' && '🔵 Normal'}
                          {selectedNotification.priority === 'low' && '🟢 Baja'}
                        </span>
                      )}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4">
                    <div className="p-4 rounded-lg bg-accent/10 border border-border">
                      <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedNotification.message}
                      </p>
                    </div>
                  </div>

                  <DialogFooter className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Tipo:</span>
                      <span className="px-2 py-1 rounded-full bg-accent/20 text-xs">
                        {selectedNotification.type === NOTIFICATION_TYPES.WELCOME && 'Bienvenida'}
                        {selectedNotification.type === NOTIFICATION_TYPES.UPDATE && 'Actualización'}
                        {selectedNotification.type === NOTIFICATION_TYPES.NEWS && 'Noticias'}
                        {selectedNotification.type === NOTIFICATION_TYPES.BROADCAST && 'Difusión'}
                        {selectedNotification.type === NOTIFICATION_TYPES.ANNOUNCEMENT && 'Anuncio'}
                        {selectedNotification.type === NOTIFICATION_TYPES.FEATURE && 'Nueva Funcionalidad'}
                        {selectedNotification.type === NOTIFICATION_TYPES.MAINTENANCE && 'Mantenimiento'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleModalClose}
                      >
                        Cerrar
                      </Button>
                      {selectedNotification.link && (
                        <Button
                          onClick={() => {
                            setShowNotificationModal(false);
                            navigate(selectedNotification.link);
                          }}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ir al enlace
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );
};

export default SystemNotificationsPanel;
