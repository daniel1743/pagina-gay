import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotifications } from '@/services/socialService';
import { getPushInterestPreferences, updateAppBadge } from '@/services/pushNotificationService';
import { toast } from '@/components/ui/use-toast';
import NotificationsPanel from './NotificationsPanel';

const IMPORTANT_NOTIFICATION_TYPES = new Set([
  'direct_message',
  'private_chat_request',
  'private_chat_accepted',
  'opin_reply',
  'opin_response',
  'opin_comment',
  'opin_mention',
]);

const isImportantNotification = (notification) => {
  const type = String(notification?.type || '');
  if (!type) return false;
  if (IMPORTANT_NOTIFICATION_TYPES.has(type)) return true;
  return type.startsWith('opin_');
};

const normalizePreferences = (userId) => getPushInterestPreferences(userId);

const notificationMatchesPreferences = (notification, preferences) => {
  const type = String(notification?.type || '');
  if (!type) return true;

  if (type === 'direct_message' || type === 'private_chat_request' || type === 'private_chat_accepted') {
    return preferences.direct_messages !== false;
  }
  if (type.startsWith('opin_')) {
    return preferences.opin_comments !== false;
  }
  if (type === 'profile_comment' || type === 'profile_view' || type.startsWith('profile_')) {
    return preferences.profile_views !== false;
  }
  if (type.startsWith('tarjeta_')) {
    return preferences.baul_card_views !== false;
  }
  if (
    type === 'room_activity'
    || type === 'presence_spike'
    || type.includes('activity')
    || type.includes('presence')
  ) {
    return preferences.more_room_activity !== false || preferences.more_people_connected !== false;
  }

  return true;
};

const NotificationBell = ({ onOpenPrivateChat }) => {
  const { user } = useAuth(); // ✅ Usar useAuth normal (NotificationBell SIEMPRE está dentro de AuthProvider)
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [importantCount, setImportantCount] = useState(0);
  const [interestPreferences, setInterestPreferences] = useState(() => normalizePreferences(user?.id || null));
  const previousCountRef = useRef(0);
  const onOpenPrivateChatRef = useRef(onOpenPrivateChat);

  useEffect(() => {
    onOpenPrivateChatRef.current = onOpenPrivateChat;
  }, [onOpenPrivateChat]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const userId = user?.id || null;
    setInterestPreferences(normalizePreferences(userId));

    const handler = (event) => {
      const eventUserId = event?.detail?.userId || null;
      if (eventUserId && userId && eventUserId !== userId) return;
      setInterestPreferences(normalizePreferences(userId));
    };

    window.addEventListener('chactivo:push-interest-preferences-updated', handler);
    return () => window.removeEventListener('chactivo:push-interest-preferences-updated', handler);
  }, [user?.id]);

  useEffect(() => {
    if (!user || user.isGuest || user.isAnonymous) return;

    // ✅ FIX: Variable para controlar si el componente está montado
    let isMounted = true;
    let unsubscribe = null;

    try {
      unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
        // ✅ Solo actualizar si el componente está montado
        if (!isMounted) return;

        const filteredNotifications = newNotifications.filter((item) =>
          notificationMatchesPreferences(item, interestPreferences)
        );
        const currentCount = filteredNotifications.length;
        const previousCount = previousCountRef.current;

        // Si hay nuevas notificaciones, mostrar toast y/o abrir ventana
        // ✅ FIX: Solo mostrar toasts si hay diferencia y es un incremento
        if (currentCount > previousCount && previousCount > 0 && currentCount - previousCount === 1) {
          const latestNotification = filteredNotifications[0];

          if (latestNotification.type === 'direct_message') {
            toast({
              title: `💬 Nuevo mensaje de ${latestNotification.fromUsername || 'un usuario'}`,
              description: latestNotification.content?.substring(0, 100) || '',
              duration: 5000,
            });
          } else if (latestNotification.type === 'private_chat_request') {
            toast({
              title: `📞 Solicitud de chat privado`,
              description: `${latestNotification.fromUsername || 'Un usuario'} quiere conectar contigo`,
              duration: 5000,
            });
          } else if (latestNotification.type === 'private_chat_accepted') {
            // Abrir automáticamente la ventana de chat privado
            if (onOpenPrivateChatRef.current && latestNotification.chatId) {
              onOpenPrivateChatRef.current({
                chatId: latestNotification.chatId,
                partner: {
                  userId: latestNotification.from,
                  username: latestNotification.fromUsername,
                  avatar: latestNotification.fromAvatar,
                  isPremium: latestNotification.fromIsPremium,
                }
              });
            }

            toast({
              title: `✅ ${latestNotification.fromUsername} aceptó tu solicitud`,
              description: 'La ventana de chat privado se ha abierto',
              duration: 5000,
            });
          } else if (isImportantNotification(latestNotification)) {
            toast({
              title: '🧵 Nueva actividad',
              description: latestNotification.content?.substring(0, 100) || 'Alguien respondió o interactuó contigo.',
              duration: 5000,
            });
          }
        }

        previousCountRef.current = currentCount;
        setNotifications(filteredNotifications);
        setImportantCount(
          filteredNotifications.filter((item) => !item.read && isImportantNotification(item)).length
        );
      });
    } catch (error) {
      console.error('Error setting up notifications subscription:', error);
      // Si hay error, no hacer nada más (evita loops infinitos)
    }

    return () => {
      // ✅ Marcar como desmontado ANTES de limpiar
      isMounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from notifications:', error);
        }
      }
    };
  }, [interestPreferences, user?.id, user?.isGuest, user?.isAnonymous]);

  useEffect(() => {
    if (!user?.id || user.isGuest || user.isAnonymous) return;

    const key = `chactivo:important_notifications:${user.id}`;
    localStorage.setItem(key, String(importantCount));
    window.dispatchEvent(new CustomEvent('chactivo:important-notifications', {
      detail: { userId: user.id, count: importantCount },
    }));
    updateAppBadge(importantCount).catch(() => {});
  }, [importantCount, user?.id, user?.isGuest, user?.isAnonymous]);

  useEffect(() => {
    if (user?.id && !user.isGuest && !user.isAnonymous) return;
    updateAppBadge(0).catch(() => {});
  }, [user?.id, user?.isGuest, user?.isAnonymous]);

  if (!user || user.isGuest || user.isAnonymous) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {importantCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 flex items-center justify-center px-1 text-xs font-bold bg-red-500"
                  >
                    {importantCount > 9 ? '9+' : importantCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animación de pulso para notificaciones nuevas */}
            {importantCount > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
          </Button>
        </motion.div>
      </div>

      <NotificationsPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onOpenPrivateChat={onOpenPrivateChat}
      />
    </>
  );
};

export default NotificationBell;
