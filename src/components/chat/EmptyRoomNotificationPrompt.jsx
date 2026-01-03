import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requestNotificationPermission } from '@/services/systemNotificationsService';
import { toast } from '@/components/ui/use-toast';

/**
 * Componente que muestra un aviso cuando no hay usuarios conectados
 * Sugiere activar notificaciones para ser avisado cuando haya personas conectadas
 */
const EmptyRoomNotificationPrompt = ({ roomName, isVisible }) => {
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isDismissed, setIsDismissed] = useState(false);

  // Verificar estado de permisos de notificaciones
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Reset dismiss state cuando cambia la sala o se vuelve visible
  useEffect(() => {
    setIsDismissed(false);
  }, [roomName, isVisible]);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setNotificationPermission('granted');
        toast({
          title: "✅ Notificaciones Activadas",
          description: "Te avisaremos cuando haya personas conectadas en esta sala.",
        });
      } else {
        setNotificationPermission('denied');
        toast({
          title: "Permiso Denegado",
          description: "Puedes activarlas después desde la configuración del navegador.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "No pudimos activar las notificaciones",
        description: "Intenta de nuevo en un momento",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // No mostrar si:
  // - No está visible
  // - Ya fue descartado
  // - Ya tiene permisos otorgados
  // - Permisos fueron denegados
  if (!isVisible || isDismissed || notificationPermission === 'granted' || notificationPermission === 'denied') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full px-4 py-3"
      >
        <motion.div
          className="relative glass-effect rounded-xl border-2 border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-4 shadow-lg"
          whileHover={{ scale: 1.01 }}
        >
          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-8">
            {/* Icono */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground mb-1">
                🔔 Activa las notificaciones
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No hay usuarios conectados ahora. <strong>Activa las notificaciones</strong> y te avisaremos cuando haya personas en {roomName || 'esta sala'} para que te conectes.
              </p>
            </div>

            {/* Botón de acción */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <Button
                onClick={handleRequestPermission}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                Activar Notificaciones
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EmptyRoomNotificationPrompt;

