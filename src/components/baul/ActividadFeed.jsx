/**
 * ActividadFeed - Centro de interacciones
 *
 * Rediseñado de "log pasivo" a "centro de oportunidades"
 * Cada interacción es accionable:
 * - Mensaje → Abrir tarjeta + responder
 * - Like → Abrir tarjeta + devolver like
 * - Visita → Abrir tarjeta
 *
 * Ordenado por prioridad: Mensajes > Likes > Visitas
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  MessageSquare,
  Eye,
  Loader2,
  Bell,
  ChevronRight,
  Sparkles,
  Footprints
} from 'lucide-react';
import { obtenerMiActividad, marcarActividadLeida, obtenerTarjeta, darLike, yaLeDiLike } from '@/services/tarjetaService';
import MensajeTarjetaModal from './MensajeTarjetaModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Item de actividad accionable
 */
const ActividadItem = ({ actividad, onVerTarjeta, onDevolverLike, loadingLike }) => {
  const getIcono = () => {
    switch (actividad.tipo) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'mensaje':
        return <MessageSquare className="w-5 h-5 text-cyan-500 fill-cyan-500" />;
      case 'visita':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'huella':
        return <Footprints className="w-5 h-5 text-amber-500" />;
      case 'match':
        return <Sparkles className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAccionPrincipal = () => {
    switch (actividad.tipo) {
      case 'mensaje':
        return 'Responder';
      case 'like':
        return actividad.yaDevolviLike ? 'Match' : 'Devolver';
      case 'match':
        return 'Ver match';
      default:
        return 'Ver perfil';
    }
  };

  const getColorBorde = () => {
    if (!actividad.leida) {
      switch (actividad.tipo) {
        case 'mensaje': return 'border-cyan-500/50 bg-cyan-500/10';
        case 'like': return 'border-pink-500/50 bg-pink-500/10';
        case 'match': return 'border-yellow-500/50 bg-yellow-500/10';
        default: return 'border-purple-500/30 bg-purple-500/5';
      }
    }
    return 'border-gray-700/50 bg-gray-800/30';
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
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHoras < 24) return `${diffHoras}h`;
    if (diffDias < 7) return `${diffDias}d`;
    return fecha.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${getColorBorde()}`}
      onClick={() => onVerTarjeta(actividad)}
    >
      {/* Indicador de no leído */}
      {!actividad.leida && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar clickeable */}
          <div className="relative flex-shrink-0">
            {actividad.avatar ? (
              <img
                src={actividad.avatar}
                alt={actividad.deUsername}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {actividad.deUsername?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {/* Badge de tipo */}
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-gray-800 border border-gray-700">
              {getIcono()}
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-white truncate">
                {actividad.deUsername || 'Alguien'}
              </p>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatearTiempo(actividad.timestamp)}
              </span>
            </div>

            {/* Descripción según tipo */}
            {actividad.tipo === 'mensaje' && actividad.mensaje && (
              <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                "{actividad.mensaje}"
              </p>
            )}

            {actividad.tipo === 'like' && (
              <p className="text-sm text-pink-400 mt-1">
                Le gustó tu perfil
              </p>
            )}

            {actividad.tipo === 'visita' && (
              <p className="text-sm text-purple-400 mt-1">
                Visitó tu perfil
              </p>
            )}

            {actividad.tipo === 'huella' && (
              <p className="text-sm text-amber-400 mt-1">
                {actividad.tarjetaInfo?.buscando
                  ? `Pasó por tu perfil · Busca: ${actividad.tarjetaInfo.buscando}`
                  : 'Pasó por tu perfil'}
              </p>
            )}

            {actividad.tipo === 'match' && (
              <p className="text-sm text-yellow-400 mt-1">
                {actividad.mensaje || '¡Hicieron match!'}
              </p>
            )}

            {/* Info adicional de la tarjeta si está disponible */}
            {actividad.tarjetaInfo && (
              <p className="text-xs text-gray-500 mt-1">
                {[
                  actividad.tarjetaInfo.rol,
                  actividad.tarjetaInfo.edad && `${actividad.tarjetaInfo.edad} años`,
                  actividad.tarjetaInfo.ubicacionTexto
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Flecha indicadora */}
          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          {actividad.tipo === 'like' && !actividad.yaDevolviLike && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDevolverLike(actividad);
              }}
              disabled={loadingLike === actividad.deUserId}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                       bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium
                       hover:from-pink-600 hover:to-rose-600 transition-all
                       disabled:opacity-50"
            >
              {loadingLike === actividad.deUserId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Devolver like
                </>
              )}
            </button>
          )}

          {actividad.tipo === 'like' && actividad.yaDevolviLike && (
            <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                          bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
              <Sparkles className="w-4 h-4" />
              ¡Es un match!
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerTarjeta(actividad);
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     text-sm font-medium transition-all
                     ${actividad.tipo === 'like' && !actividad.yaDevolviLike
                       ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                       : 'flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                     }`}
          >
            {actividad.tipo === 'mensaje' ? (
              <>
                <MessageSquare className="w-4 h-4" />
                Responder
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Ver perfil
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Estado vacío mejorado
 */
const EstadoVacio = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
      <Bell className="w-10 h-10 text-gray-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-300 mb-2">
      Aún no hay actividad
    </h3>
    <p className="text-sm text-gray-500 max-w-xs">
      Cuando alguien te dé like, te visite o te escriba, lo verás aquí para que puedas responder
    </p>
  </div>
);

/**
 * Componente principal
 */
const ActividadFeed = ({ isOpen, onClose, miUserId }) => {
  const { user, userProfile } = useAuth();
  const [actividades, setActividades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingLike, setLoadingLike] = useState(null);

  // Modal de tarjeta
  const [showTarjetaModal, setShowTarjetaModal] = useState(false);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);

  // Cargar actividad con info enriquecida
  useEffect(() => {
    const cargar = async () => {
      if (!miUserId) return;

      setIsLoading(true);
      try {
        const data = await obtenerMiActividad(miUserId, 30);

        // Enriquecer con info de tarjeta y verificar si ya devolví like
        const actividadesEnriquecidas = await Promise.all(
          data.map(async (act) => {
            try {
              // Obtener tarjeta del usuario que interactuó
              const tarjeta = await obtenerTarjeta(act.deUserId);

              // Si es un like, verificar si ya le devolví
              let yaDevolviLike = false;
              if (act.tipo === 'like' && act.deUserId) {
                yaDevolviLike = await yaLeDiLike(act.deUserId, miUserId);
              }

              return {
                ...act,
                avatar: tarjeta?.fotoUrl || '',
                tarjetaInfo: tarjeta ? {
                  rol: tarjeta.rol,
                  edad: tarjeta.edad,
                  ubicacionTexto: tarjeta.ubicacionTexto,
                  bio: tarjeta.bio,
                  buscando: tarjeta.buscando
                } : null,
                yaDevolviLike
              };
            } catch (e) {
              return act;
            }
          })
        );

        // Ordenar: mensajes primero, luego likes, luego visitas
        // Dentro de cada grupo, por fecha (más recientes primero)
        const ordenadas = actividadesEnriquecidas.sort((a, b) => {
          const prioridad = { mensaje: 0, match: 1, like: 2, visita: 3 };
          const prioA = prioridad[a.tipo] ?? 4;
          const prioB = prioridad[b.tipo] ?? 4;

          if (prioA !== prioB) return prioA - prioB;

          // Mismo tipo: ordenar por fecha
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setActividades(ordenadas);

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

  // Abrir tarjeta del usuario
  const handleVerTarjeta = async (actividad) => {
    try {
      const tarjeta = await obtenerTarjeta(actividad.deUserId);
      if (tarjeta) {
        setTarjetaSeleccionada(tarjeta);
        setShowTarjetaModal(true);
      } else {
        toast({
          title: 'Perfil no disponible',
          description: 'Este usuario ya no tiene perfil activo',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive',
      });
    }
  };

  // Devolver like
  const handleDevolverLike = async (actividad) => {
    if (!actividad.deUserId || loadingLike) return;

    setLoadingLike(actividad.deUserId);
    try {
      const resultado = await darLike(
        actividad.deUserId,
        miUserId,
        userProfile?.username || user?.displayName || 'Usuario',
        userProfile?.avatar || ''
      );

      if (resultado.success) {
        // Actualizar estado local
        setActividades(prev =>
          prev.map(a =>
            a.deUserId === actividad.deUserId
              ? { ...a, yaDevolviLike: true }
              : a
          )
        );

        if (resultado.isMatch) {
          toast({
            title: '¡Match!',
            description: `¡Tú y ${actividad.deUsername} se gustan mutuamente!`,
          });
        } else {
          toast({
            title: 'Like enviado',
            description: `Le devolviste el like a ${actividad.deUsername}`,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el like',
        variant: 'destructive',
      });
    } finally {
      setLoadingLike(null);
    }
  };

  // Agrupar actividades por tipo para mostrar secciones
  const mensajes = actividades.filter(a => a.tipo === 'mensaje');
  const matches = actividades.filter(a => a.tipo === 'match');
  const likes = actividades.filter(a => a.tipo === 'like');
  const visitas = actividades.filter(a => a.tipo === 'visita');
  const huellas = actividades.filter(a => a.tipo === 'huella');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl border border-gray-700 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-lg text-white">Quién se interesó en ti</h3>
              <p className="text-xs text-gray-400">
                {actividades.length > 0
                  ? `${actividades.length} interacciones recientes`
                  : 'Responde a quienes te buscan'}
              </p>
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
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : actividades.length === 0 ? (
              <EstadoVacio />
            ) : (
              <div className="p-4 space-y-4">
                {/* Mensajes primero */}
                {mensajes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Mensajes ({mensajes.length})
                    </h4>
                    <div className="space-y-3">
                      {mensajes.map((actividad) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          onVerTarjeta={handleVerTarjeta}
                          onDevolverLike={handleDevolverLike}
                          loadingLike={loadingLike}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Matches */}
                {matches.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Matches ({matches.length})
                    </h4>
                    <div className="space-y-3">
                      {matches.map((actividad) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          onVerTarjeta={handleVerTarjeta}
                          onDevolverLike={handleDevolverLike}
                          loadingLike={loadingLike}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Likes */}
                {likes.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Les gustaste ({likes.length})
                    </h4>
                    <div className="space-y-3">
                      {likes.map((actividad) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          onVerTarjeta={handleVerTarjeta}
                          onDevolverLike={handleDevolverLike}
                          loadingLike={loadingLike}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Visitas */}
                {visitas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Te visitaron ({visitas.length})
                    </h4>
                    <div className="space-y-3">
                      {visitas.map((actividad) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          onVerTarjeta={handleVerTarjeta}
                          onDevolverLike={handleDevolverLike}
                          loadingLike={loadingLike}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pasaron por aquí */}
                {huellas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Footprints className="w-4 h-4" />
                      Pasaron por tu perfil ({huellas.length})
                    </h4>
                    <div className="space-y-3">
                      {huellas.map((actividad) => (
                        <ActividadItem
                          key={actividad.id}
                          actividad={actividad}
                          onVerTarjeta={handleVerTarjeta}
                          onDevolverLike={handleDevolverLike}
                          loadingLike={loadingLike}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Modal de tarjeta */}
      {showTarjetaModal && tarjetaSeleccionada && (
        <MensajeTarjetaModal
          isOpen={showTarjetaModal}
          onClose={() => {
            setShowTarjetaModal(false);
            setTarjetaSeleccionada(null);
          }}
          tarjeta={tarjetaSeleccionada}
          miUserId={miUserId}
          miUsername={userProfile?.username || user?.displayName || 'Usuario'}
        />
      )}
    </AnimatePresence>
  );
};

export default ActividadFeed;
