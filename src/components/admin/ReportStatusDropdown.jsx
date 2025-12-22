import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Clock, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateReportStatus } from '@/services/reportService';
import { createSystemNotification, NOTIFICATION_TYPES } from '@/services/systemNotificationsService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Desplegable interactivo para gestionar el estado del reporte
 * Cada opción envía una notificación automática al usuario
 */
const ReportStatusDropdown = ({ report, onStatusUpdate, onOpenChat }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openDirection, setOpenDirection] = useState('down'); // 'up' o 'down'

  const statusOptions = [
    {
      id: 'received',
      label: 'Caso Recibido',
      description: 'Enviar notificación de que el caso ha sido recibido',
      icon: CheckCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20 hover:bg-blue-500/30',
      message: 'Tu reporte ha sido recibido y está en manos de nuestro equipo de administradores. Estaremos en comunicación contigo pronto.',
      title: '📋 Caso Recibido',
    },
    {
      id: 'in_process',
      label: 'Caso en Proceso',
      description: 'Notificar que el caso está siendo analizado',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20 hover:bg-yellow-500/30',
      message: 'Tu reporte está siendo analizado por nuestro equipo. Estaremos en comunicación contigo pronto.',
      title: '🔍 Caso en Proceso',
    },
    {
      id: 'resolved',
      label: 'Caso Resuelto',
      description: 'Marcar como resuelto y notificar al usuario',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20 hover:bg-green-500/30',
      message: 'Tu reporte ha sido resuelto. Gracias por ayudarnos a mantener Chactivo seguro.',
      title: '✅ Caso Resuelto',
    },
  ];

  const handleStatusAction = async (option) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Enviar notificación al usuario
      await createSystemNotification(report.reporterId, {
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        title: option.title,
        message: option.message,
        icon: option.id === 'resolved' ? '✅' : option.id === 'in_process' ? '🔍' : '📋',
        link: null,
        priority: 'high',
        createdBy: user?.id || 'system',
      });

      // Si es "resuelto", actualizar el estado del reporte
      if (option.id === 'resolved') {
        await updateReportStatus(report.id, 'resolved', null, report.reporterId);
        if (onStatusUpdate) {
          onStatusUpdate('resolved');
        }
      } else if (option.id === 'in_process') {
        // Actualizar estado a "reviewing" si está en proceso
        await updateReportStatus(report.id, 'reviewing', null, report.reporterId);
        if (onStatusUpdate) {
          onStatusUpdate('reviewing');
        }
      }

      toast({
        title: '✅ Notificación Enviada',
        description: `Se ha notificado a ${report.reporterUsername} sobre el estado de su caso.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error procesando acción:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      // Detectar posición del botón para decidir dirección
      const button = document.querySelector(`[data-dropdown-button="${report.id}"]`);
      if (button) {
        const rect = button.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenDirection(spaceBelow < 300 && spaceAbove > spaceBelow ? 'up' : 'down');
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        data-dropdown-button={report.id}
        onClick={handleToggle}
        disabled={isProcessing}
        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold border-2 border-primary/50 shadow-lg"
        size="sm"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Gestionar Caso
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: openDirection === 'up' ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openDirection === 'up' ? 10 : -10, scale: 0.95 }}
              className={`absolute ${openDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-80 bg-card border-2 border-primary/30 rounded-xl shadow-2xl z-[9999] overflow-hidden`}
            >
              <div className="p-2 space-y-1">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleStatusAction(option)}
                      disabled={isProcessing}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all ${option.bgColor} ${option.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{option.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
                
                {/* Botón para chatear */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onOpenChat) {
                      onOpenChat();
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all"
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Chatear con Usuario</p>
                    <p className="text-xs opacity-80 mt-0.5">Abrir chat directo tipo WhatsApp</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportStatusDropdown;

