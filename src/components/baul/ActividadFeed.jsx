/**
 * 📊 FEED DE ACTIVIDAD
 * Muestra la actividad reciente en tu tarjeta
 * - Likes recibidos
 * - Mensajes recibidos
 * - Visitas al perfil
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageSquare,
  Eye,
  User,
  Loader2,
  Bell,
  Clock
} from 'lucide-react';
import { obtenerMiActividad, marcarActividadLeida } from '@/services/tarjetaService';

/**
 * Item de actividad
 */
const ActividadItem = ({ actividad }) => {
  const getIcono = () => {
    switch (actividad.tipo) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'mensaje':
        return <MessageSquare className="w-5 h-5 text-cyan-500" />;
      case 'visita':
        return <Eye className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTexto = () => {
    switch (actividad.tipo) {
      case 'like':
        return 'le gustó tu tarjeta';
      case 'mensaje':
        return 'te dejó un mensaje';
      case 'visita':
        return 'visitó tu tarjeta';
      default:
        return 'interactuó contigo';
    }
  };

  const formatearTiempo = (timestamp) => {
    if (!timestamp) return '';

    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;

    return fecha.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
        !actividad.leida ? 'bg-gray-700/50 border border-cyan-500/30' : 'bg-gray-800/30'
      }`}
    >
      {/* Icono */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcono()}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-medium text-cyan-400">{actividad.deUsername || 'Alguien'}</span>
          {' '}{getTexto()}
        </p>

        {/* Mensaje si es de tipo mensaje */}
        {actividad.tipo === 'mensaje' && actividad.mensaje && (
          <p className="text-sm text-gray-400 mt-1 italic">
            "{actividad.mensaje}"
          </p>
        )}

        {/* Tiempo */}
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatearTiempo(actividad.timestamp)}
        </p>
      </div>

      {/* Indicador de no leído */}
      {!actividad.leida && (
        <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
      )}
    </motion.div>
  );
};

/**
 * Estado vacío
 */
const EstadoVacio = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Bell className="w-16 h-16 text-gray-600 mb-4" />
    <h3 className="text-lg font-medium text-gray-300 mb-2">Sin actividad aún</h3>
    <p className="text-sm text-gray-500 max-w-xs">
      Cuando alguien interactúe con tu tarjeta, lo verás aquí
    </p>
  </div>
);

/**
 * Componente principal
 */
const ActividadFeed = ({ isOpen, onClose, miUserId }) => {
  const [actividades, setActividades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar actividad
  useEffect(() => {
    const cargar = async () => {
      if (!miUserId) return;

      setIsLoading(true);
      try {
        const data = await obtenerMiActividad(miUserId, 30);
        setActividades(data);

        // Marcar como leída
        await marcarActividadLeida(miUserId);
      } catch (error) {
        console.error('[ACTIVIDAD] Error cargando:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      cargar();
    }
  }, [isOpen, miUserId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-lg text-white">Tu actividad</h3>
              <p className="text-xs text-gray-400">Quién interactuó con tu tarjeta</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : actividades.length === 0 ? (
              <EstadoVacio />
            ) : (
              <div className="p-4 space-y-3">
                {actividades.map((actividad, index) => (
                  <ActividadItem key={actividad.id || index} actividad={actividad} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ActividadFeed;
