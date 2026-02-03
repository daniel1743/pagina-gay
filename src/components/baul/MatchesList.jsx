/**
 * 💕 LISTA DE MATCHES
 * Muestra todas las conexiones mutuas del usuario
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  X,
  Loader2,
  Users,
  Sparkles,
  Clock
} from 'lucide-react';
import { obtenerMisMatches, marcarMatchLeido } from '@/services/tarjetaService';

const MatchesList = ({ isOpen, onClose, miUserId, onEnviarMensaje, onVerPerfil }) => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && miUserId) {
      cargarMatches();
    }
  }, [isOpen, miUserId]);

  const cargarMatches = async () => {
    setIsLoading(true);
    try {
      const misMatches = await obtenerMisMatches(miUserId);
      setMatches(misMatches);
    } catch (error) {
      console.error('[MATCHES] Error cargando:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchClick = async (match) => {
    // Marcar como leído
    if (match.tengoNoLeido) {
      await marcarMatchLeido(match.id, miUserId);
      setMatches(prev => prev.map(m =>
        m.id === match.id ? { ...m, tengoNoLeido: false } : m
      ));
    }

    // Abrir perfil o mensaje
    onVerPerfil?.(match.otroUsuario);
  };

  const handleEnviarMensaje = (e, match) => {
    e.stopPropagation();
    onEnviarMensaje?.(match.otroUsuario);
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return '';
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" fill="white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mis Matches</h2>
                  <p className="text-sm text-white/70">
                    {matches.length} {matches.length === 1 ? 'conexión' : 'conexiones'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Aún no tienes matches
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Cuando tú y otra persona se den like mutuamente, aparecerán aquí.
                </p>
                <div className="mt-6 flex items-center gap-2 text-pink-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">¡Sigue explorando!</span>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {matches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleMatchClick(match)}
                    className={`
                      relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer
                      transition-all duration-200
                      ${match.tengoNoLeido
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30'
                        : 'bg-gray-800/50 hover:bg-gray-800'
                      }
                    `}
                  >
                    {/* Badge nuevo */}
                    {match.tengoNoLeido && (
                      <div className="absolute -top-1 -left-1">
                        <span className="flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
                        </span>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative">
                      {match.otroUsuario?.avatar ? (
                        <img
                          src={match.otroUsuario.avatar}
                          alt={match.otroUsuario.nombre}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-pink-500/50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center ring-2 ring-pink-500/50">
                          <span className="text-2xl font-bold text-white">
                            {(match.otroUsuario?.nombre || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Corazón decorativo */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-3 h-3 text-white" fill="white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {match.otroUsuario?.nombre || match.otroUsuario?.username || 'Usuario'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">
                          Match {formatearFecha(match.createdAt)}
                        </span>
                      </div>
                      {match.tengoNoLeido && (
                        <span className="inline-block mt-2 text-xs text-pink-400 font-medium">
                          ✨ ¡Nuevo match!
                        </span>
                      )}
                    </div>

                    {/* Botón mensaje */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleEnviarMensaje(e, match)}
                      className="p-3 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-lg"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer decorativo */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />
              <span>Los matches son mutuos y especiales</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchesList;
