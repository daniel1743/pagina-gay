import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Componente estratégico para mostrar cuando hay pocos usuarios online
 * Invita a activar notificaciones para ser avisado cuando haya actividad
 */
const NotificationPrompt = ({ minUsers = 10, currentUsers = 0, countryName = "esta región" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Verificar si ya se suscribió previamente
    const hasSubscribed = localStorage.getItem('notification-subscribed');
    if (hasSubscribed) {
      setIsSubscribed(true);
    }

    // Mostrar el prompt solo si hay pocos usuarios y no está suscrito
    if (currentUsers < minUsers && !hasSubscribed) {
      // Esperar 3 segundos antes de mostrar para no ser invasivo
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUsers, minUsers]);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones. Intenta con Chrome, Firefox o Safari.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        // Guardar en localStorage que se suscribió
        localStorage.setItem('notification-subscribed', 'true');
        setIsSubscribed(true);

        // Mostrar notificación de confirmación
        new Notification('¡Listo! 🔔', {
          body: `Te avisaremos cuando haya usuarios activos en ${countryName}`,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: 'notification-enabled',
        });

        // Ocultar el banner después de 2 segundos
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);

        // TODO: Aquí se debería registrar el Service Worker para push notifications
        // y enviar el token al backend para guardar la suscripción
      } else {
        alert('Necesitamos tu permiso para enviarte notificaciones cuando haya actividad.');
      }
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Recordar que cerró el banner por 24 horas
    localStorage.setItem('notification-prompt-closed', Date.now().toString());
  };

  // No mostrar si ya está suscrito o si cerró el banner recientemente
  const closedTime = localStorage.getItem('notification-prompt-closed');
  if (closedTime && Date.now() - parseInt(closedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && !isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="glass-effect rounded-2xl border-2 border-purple-500/40 shadow-2xl p-5 backdrop-blur-xl bg-gradient-to-br from-purple-900/80 to-pink-900/80">
            {/* Botón cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-white/70 hover:text-white" />
            </button>

            {/* Contenido */}
            <div className="flex items-start gap-4">
              {/* Icono animado */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              >
                <Bell className="w-6 h-6 text-white" />
              </motion.div>

              {/* Texto */}
              <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  {currentUsers > 0
                    ? `Solo ${currentUsers} usuario${currentUsers > 1 ? 's' : ''} conectado${currentUsers > 1 ? 's' : ''} ahora`
                    : 'Aún no hay usuarios conectados'
                  }
                </h3>
                <p className="text-sm text-white/80 leading-relaxed mb-3">
                  Activa las notificaciones y te avisaremos cuando haya gente activa en {countryName}. ¡No te pierdas la acción!
                </p>

                {/* Botón de acción */}
                <Button
                  onClick={handleEnableNotifications}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm py-2.5 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Activar Notificaciones
                </Button>

                {/* Microcopy de confianza */}
                <p className="text-xs text-white/60 mt-2 text-center">
                  Solo te avisaremos cuando haya actividad. Sin spam.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banner de confirmación cuando está suscrito */}
      {isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="glass-effect rounded-2xl border-2 border-green-500/40 shadow-2xl p-4 backdrop-blur-xl bg-gradient-to-br from-green-900/80 to-emerald-900/80">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  ¡Notificaciones activadas!
                </h3>
                <p className="text-sm text-white/80">
                  Te avisaremos cuando haya actividad
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
