import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, MessageCircle, Video, Check, X, ExternalLink, CheckCircle, Ticket, CheckCircle2, Search, Pin, Trash2, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import {
  markNotificationAsRead,
  markNotificationsAsRead,
  deleteNotification,
  deleteNotifications,
  respondToPrivateChatRequest,
} from '@/services/socialService';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationsPanel = ({ isOpen, onClose, notifications, onOpenPrivateChat }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = auth?.currentUser?.uid || user?.id || user?.uid || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    // Cargar pins desde localStorage
    const saved = localStorage.getItem(`pins_${currentUserId || ''}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const unreadNotifications = notifications.filter((notification) => !notification.read);

  const withBusyId = async (notificationId, action) => {
    if (!notificationId || typeof action !== 'function') return;

    setBusyIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      return next;
    });

    try {
      await action();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleAcceptPrivateChat = async (notification) => {
    if (!currentUserId) return;
    try {
      const result = await respondToPrivateChatRequest(currentUserId, notification.id, true);

      toast({
        title: "✅ Chat privado aceptado",
        description: `Ahora estás conectado con ${notification.fromUsername}`,
      });

      // Abrir ventana de chat privado automáticamente
      if (onOpenPrivateChat && result.chatId) {
        onOpenPrivateChat({
          chatId: result.chatId,
          partner: {
            userId: notification.from,
            username: notification.fromUsername,
            avatar: notification.fromAvatar,
            isPremium: notification.fromIsPremium,
          }
        });
      }
    } catch (error) {
      const isBlocked = error?.message === 'BLOCKED';
      const isPermissionDenied = error?.code === 'permission-denied' || String(error?.message || '').includes('insufficient permissions');

      toast({
        title: isBlocked
          ? "No disponible"
          : "Error al aceptar",
        description: isBlocked
          ? "No puedes abrir chat privado con este usuario."
          : isPermissionDenied
            ? "Tu cuenta no tiene permisos para abrir privados todavía."
            : "No se pudo aceptar la solicitud",
        variant: "destructive",
      });
    }
  };

  const handleRejectPrivateChat = async (notification) => {
    if (!currentUserId) return;
    try {
      await respondToPrivateChatRequest(currentUserId, notification.id, false);

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
    if (!currentUserId) return;
    try {
      await markNotificationAsRead(currentUserId, notificationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId || unreadNotifications.length === 0 || bulkAction) return;

    setBulkAction('mark-all-read');
    try {
      await markNotificationsAsRead(
        currentUserId,
        unreadNotifications.map((notification) => notification.id)
      );

      toast({
        title: 'Conversaciones actualizadas',
        description: 'Todas quedaron marcadas como leídas.',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'No se pudo completar',
        description: 'No fue posible marcar todas como leídas.',
        variant: 'destructive',
      });
    } finally {
      setBulkAction(null);
    }
  };

  const handleDeleteNotification = async (notification) => {
    if (!currentUserId || !notification?.id) return;

    await withBusyId(notification.id, async () => {
      try {
        await deleteNotification(currentUserId, notification.id);
        toast({
          title: 'Conversación eliminada',
          description: 'Se quitó de tu bandeja.',
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast({
          title: 'No se pudo eliminar',
          description: 'Intenta nuevamente.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDeleteAllNotifications = async () => {
    if (!currentUserId || notifications.length === 0 || bulkAction) return;

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`Esto eliminará ${notifications.length} conversaciones de tu bandeja. ¿Continuar?`);

    if (!confirmed) return;

    setBulkAction('delete-all');
    try {
      await deleteNotifications(
        currentUserId,
        notifications.map((notification) => notification.id)
      );

      toast({
        title: 'Bandeja vaciada',
        description: 'Se eliminaron todas las conversaciones visibles.',
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: 'No se pudo vaciar',
        description: 'No fue posible eliminar todas las conversaciones.',
        variant: 'destructive',
      });
    } finally {
      setBulkAction(null);
    }
  };

  const handleOpenDirectMessage = async (notification) => {
    if (!notification?.chatId || !onOpenPrivateChat) {
      handleMarkAsRead(notification.id);
      return;
    }

    onOpenPrivateChat({
      chatId: notification.chatId,
      partner: {
        userId: notification.from,
        username: notification.fromUsername || 'Usuario',
        avatar: notification.fromAvatar || '',
        isPremium: notification.fromIsPremium,
      },
    });

    await handleMarkAsRead(notification.id);
    onClose?.();
  };

  /**
   * 📅 TIMESTAMP CONTEXTUAL (WhatsApp/Telegram style)
   * - "Hoy HH:MM" para mensajes de hoy
   * - "Ayer" para mensajes de ayer
   * - "DD/MM/AA" para mensajes más antiguos
   */
  const getContextualTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);

      if (isToday(date)) {
        return `Hoy ${format(date, 'HH:mm')}`;
      } else if (isYesterday(date)) {
        return 'Ayer';
      } else {
        return format(date, 'dd/MM/yy');
      }
    } catch {
      return 'Hace un momento';
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

  /**
   * 📌 TOGGLE PIN: Fijar/desfijar conversación (máximo 5)
   */
  const togglePin = (notificationId) => {
    setPinnedIds(prev => {
      const newPinned = new Set(prev);

      if (newPinned.has(notificationId)) {
        newPinned.delete(notificationId);
      } else {
        // Limitar a 5 pins
        if (newPinned.size >= 5) {
          toast({
            title: "Límite de fijados",
            description: "Solo puedes fijar hasta 5 conversaciones",
            variant: "destructive",
          });
          return prev;
        }
        newPinned.add(notificationId);
      }

      // Guardar en localStorage
      if (currentUserId) {
        localStorage.setItem(`pins_${currentUserId}`, JSON.stringify([...newPinned]));
      }

      return newPinned;
    });
  };

  /**
   * 🔍 ORDENAMIENTO ESTRATIFICADO (WhatsApp/Telegram)
   * 1. Pinned (máximo 5) - ordenados por timestamp
   * 2. Unread (mensajes sin leer) - ordenados por timestamp
   * 3. Recent (resto) - ordenados por timestamp
   */
  const sortedAndFilteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = notifications.filter(n =>
        n.fromUsername?.toLowerCase().includes(query) ||
        n.content?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.title?.toLowerCase().includes(query)
      );
    }

    // Separar en categorías
    const pinned = filtered.filter(n => pinnedIds.has(n.id));
    const unpinned = filtered.filter(n => !pinnedIds.has(n.id));
    const unread = unpinned.filter(n => !n.read);
    const read = unpinned.filter(n => n.read);

    // Ordenar cada categoría por timestamp (más reciente primero)
    const sortByTimestamp = (a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    };

    pinned.sort(sortByTimestamp);
    unread.sort(sortByTimestamp);
    read.sort(sortByTimestamp);

    // Combinar: Pinned → Unread → Read
    return [...pinned, ...unread, ...read];
  }, [notifications, pinnedIds, searchQuery]);

  const panelContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-16 right-4 z-[130] w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-border bg-accent/95 p-4 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-foreground">Conversaciones</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="relative z-[1] h-9 w-9 rounded-full border border-border bg-background/80 hover:bg-background"
                  title="Cerrar panel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* 🔍 BÚSQUEDA STICKY */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-border focus-visible:ring-cyan-400"
                />
              </div>

              {/* Contador de notificaciones */}
              {notifications.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {sortedAndFilteredNotifications.length} conversaciones
                    </p>
                    {unreadNotifications.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadNotifications.length === 0 || bulkAction !== null}
                      className="h-8 rounded-full text-xs"
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5" />
                      Marcar todas leídas
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAllNotifications}
                      disabled={notifications.length === 0 || bulkAction !== null}
                      className="h-8 rounded-full text-xs text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Borrar todas
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[500px]">
              {sortedAndFilteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {searchQuery ? 'No se encontraron resultados' : 'No tienes conversaciones'}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {searchQuery ? 'Intenta con otra búsqueda' : 'Los mensajes y solicitudes aparecerán aquí'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sortedAndFilteredNotifications.map((notification, index) => {
                    const isPinned = pinnedIds.has(notification.id);
                    const isUnread = !notification.read;

                    return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative p-4 pr-28 hover:bg-accent/50 transition-colors ${
                        isUnread ? 'bg-primary/5 border-l-4 border-l-red-500' : ''
                      } ${isPinned ? 'bg-cyan-500/5' : ''}`}
                    >
                      {/* 📌 Botón de Pin + Badge No Leído */}
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        {isUnread && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="min-w-[20px] rounded-full bg-red-500 px-2 py-1 text-center text-xs font-bold text-white"
                            style={{ fontSize: '11px' }}
                          >
                            1
                          </motion.span>
                        )}
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-background/80"
                            disabled={busyIds.has(notification.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            title="Marcar como leída"
                          >
                            <Check className="h-3.5 w-3.5 text-green-400" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-background/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(notification.id);
                          }}
                          title={isPinned ? 'Desfijar' : 'Fijar conversación'}
                        >
                          <Pin className={`w-3 h-3 ${isPinned ? 'fill-cyan-400 text-cyan-400' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-background/80"
                          disabled={busyIds.has(notification.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification);
                          }}
                          title="Borrar conversación"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>

                      <div onClick={() => handleMarkAsRead(notification.id)}>
                      {/* Mensaje Directo */}
                      {notification.type === 'direct_message' && (
                        <div
                          className={`flex gap-3 ${notification.chatId ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (notification.chatId) {
                              handleOpenDirectMessage(notification);
                            }
                          }}
                        >
                          <MessageSquare className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              Mensaje de {notification.fromUsername || 'un usuario'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-2">
                              {getContextualTimestamp(notification.timestamp)}
                            </p>
                            {notification.chatId && (
                              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Abrir chat privado
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Solicitud de Chat Privado */}
                      {notification.type === 'private_chat_request' && (
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className={`${
                              notification.fromRole === 'admin'
                                ? 'admin-avatar-ring'
                                : notification.fromVerified
                                  ? 'verified-avatar-ring'
                                  : notification.fromIsPremium
                                    ? 'premium-avatar-ring'
                                    : ''
                            }`}>
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
                                {(notification.fromIsPremium || notification.fromRole === 'admin') && (
                                  <CheckCircle className="w-3 h-3 text-[#FFD700]" />
                                )}
                                {notification.fromVerified && !notification.fromIsPremium && notification.fromRole !== 'admin' && (
                                  <CheckCircle className="w-3 h-3 text-[#1DA1F2]" />
                                )}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Video className="w-4 h-4 text-purple-400" />
                                <p className="text-sm text-muted-foreground">
                                  quiere conectar en chat privado
                                </p>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground mt-2">
                                {getContextualTimestamp(notification.timestamp)}
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

                      {/* Notificación de Ticket */}
                      {notification.type === 'opin_reply' && (
                        <div
                          className="flex gap-3 cursor-pointer"
                          onClick={() => {
                            const targetUrl = notification.url || `/opin?postId=${notification.postId}&openComments=1`;
                            navigate(targetUrl);
                            handleMarkAsRead(notification.id);
                            onClose();
                          }}
                        >
                          <MessageCircle className="w-5 h-5 text-fuchsia-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {notification.title || `${notification.fromUsername || 'Alguien'} respondió tu OPIN`}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.content || notification.message || 'Hay una nueva respuesta en tu nota'}
                            </p>
                            {notification.postPreview && (
                              <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
                                Tu OPIN: {notification.postPreview}
                              </p>
                            )}
                            <p className="text-xs font-medium text-muted-foreground mt-2">
                              {getContextualTimestamp(notification.timestamp || notification.createdAt)}
                            </p>
                            <p className="text-xs text-fuchsia-400 mt-1 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Ver conversación en OPIN
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Notificación de Ticket */}
                      {(notification.type === 'ticket_reply' || notification.type === 'ticket_resolved') && (
                        <div 
                          className="flex gap-3 cursor-pointer"
                          onClick={() => {
                            if (notification.ticketId) {
                              navigate(`/tickets/${notification.ticketId}`);
                              handleMarkAsRead(notification.id);
                              onClose();
                            }
                          }}
                        >
                          {notification.type === 'ticket_resolved' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                          ) : (
                            <Ticket className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">
                              {notification.title || (notification.type === 'ticket_resolved' ? 'Ticket resuelto' : 'Nueva respuesta en tu ticket')}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.body || notification.message}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground mt-2">
                              {getContextualTimestamp(notification.timestamp || notification.createdAt)}
                            </p>
                            {notification.ticketId && (
                              <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                Ver ticket
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  );
                  })}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return panelContent;
  }

  return createPortal(panelContent, document.body);
};

export default NotificationsPanel;
