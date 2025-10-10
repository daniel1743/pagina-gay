import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToNotifications } from '@/services/socialService';
import NotificationsPanel from './NotificationsPanel';

const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.isGuest || user.isAnonymous) return;

    const unsubscribe = subscribeToNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

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
              {unreadCount > 0 && (
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
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animación de pulso para notificaciones nuevas */}
            {unreadCount > 0 && (
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
      />
    </>
  );
};

export default NotificationBell;
