/**
 * 📋 SECCIÓN BAÚL DE TARJETAS
 * Contenedor principal del sistema de tarjetas sociales
 *
 * Accesible desde el chat como sección extra
 * Muestra grid de tarjetas ordenadas por proximidad/estado
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RefreshCw,
  MapPin,
  Users,
  Filter,
  Send,
  Loader2,
  AlertCircle,
  Bell,
  ChevronRight,
  Heart,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TarjetaUsuario from './TarjetaUsuario';
import TarjetaEditor from './TarjetaEditor';
import MensajeTarjetaModal from './MensajeTarjetaModal';
import ActividadFeed from './ActividadFeed';
import MatchModal from './MatchModal';
import MatchesList from './MatchesList';
import {
  obtenerTarjetasCercanas,
  obtenerTarjetasRecientes,
  obtenerTarjeta,
  crearTarjetaAutomatica,
  darLike,
  quitarLike,
  yaLeDiLike,
  registrarVisita,
  suscribirseAMiTarjeta,
  actualizarTarjeta,
  obtenerMisMatches,
  contarMatchesNoLeidos
} from '@/services/tarjetaService';
import { getCurrentLocation } from '@/services/geolocationService';
import { toast } from '@/components/ui/use-toast';
import {
  procesarBoostTarjeta,
  generarMensajeEngagement,
  deberíaMostrarToast,
  marcarToastMostrado
} from '@/services/engagementBoostService';

/**
 * Header del Baúl
 */
const BaulHeader = ({ onClose, onRefresh, isRefreshing, cantidadTarjetas, actividadNoLeida, matchesNoLeidos, onVerActividad, onVerMatches }) => (
  <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="flex items-center gap-2 p-2 -ml-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Volver"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Volver</span>
        </motion.button>
        <h2 className="text-xl font-bold text-white">Baúl de Perfiles</h2>
        <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
          {cantidadTarjetas} cerca
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Matches */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onVerMatches}
          className="relative p-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 hover:from-pink-500/30 hover:to-purple-500/30 transition-colors"
        >
          <Heart className="w-5 h-5" />
          {matchesNoLeidos > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full animate-pulse">
              {matchesNoLeidos > 9 ? '9+' : matchesNoLeidos}
            </span>
          )}
        </motion.button>

        {/* Botón actividad */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onVerActividad}
          className="relative p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {actividadNoLeida > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
              {actividadNoLeida > 9 ? '9+' : actividadNoLeida}
            </span>
          )}
        </motion.button>

        {/* Botón refrescar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>

        {/* Botón cerrar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-2 rounded-full bg-gray-700/50 text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  </div>
);

/**
 * Estado vacío
 */
const EstadoVacio = ({ mensaje, submensaje, onRefresh }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <Users className="w-16 h-16 text-gray-600 mb-4" />
    <h3 className="text-lg font-medium text-gray-300 mb-2">{mensaje}</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">{submensaje}</p>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onRefresh}
      className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Actualizar
    </motion.button>
  </div>
);

/**
 * Componente principal
 */
const BaulSection = ({ isOpen = true, onClose, variant = 'modal' }) => {
  const { user } = useAuth();
  const isModal = variant === 'modal';
  const isActive = isModal ? isOpen : true;

  // Estados
  const [tarjetas, setTarjetas] = useState([]);
  const [miTarjeta, setMiTarjeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [likesData, setLikesData] = useState({}); // { odIdUsuari: boolean }

  // Modales
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [mostrarEditor, setMostrarEditor] = useState(false);
  const [mostrarMensajeModal, setMostrarMensajeModal] = useState(false);
  const [mostrarActividad, setMostrarActividad] = useState(false);
  const [matchData, setMatchData] = useState(null); // Para mostrar modal de match
  const [mostrarMatchModal, setMostrarMatchModal] = useState(false);
  const [mostrarMatchesList, setMostrarMatchesList] = useState(false);
  const [matchesNoLeidos, setMatchesNoLeidos] = useState(0);

  // Cargar tarjetas (sin dependencia de miUbicacion para evitar loop)
  const cargarTarjetas = useCallback(async (mostrarLoading = true, ubicacionParam = null) => {
    const odIdUsuari = user?.id;
    if (!odIdUsuari) return;

    if (mostrarLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Usar ubicación pasada como parámetro o intentar obtener nueva
      let ubicacion = ubicacionParam;

      if (!ubicacion) {
        try {
          // Timeout rápido de 3 segundos
          const locationPromise = getCurrentLocation();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          ubicacion = await Promise.race([locationPromise, timeoutPromise]);
          setMiUbicacion(ubicacion);

          // Guardar ubicación en background (no bloquear)
          actualizarTarjeta(odIdUsuari, {
            ubicacion: { latitude: ubicacion.latitude, longitude: ubicacion.longitude },
            ubicacionActiva: true
          }).catch(() => {});
        } catch {
          ubicacion = null;
        }
      }

      // Obtener tarjetas
      let tarjetasCargadas = [];
      try {
        tarjetasCargadas = ubicacion
          ? await obtenerTarjetasCercanas(ubicacion, odIdUsuari, 50)
          : await obtenerTarjetasRecientes(odIdUsuari, 50);
      } catch {
        tarjetasCargadas = await obtenerTarjetasRecientes(odIdUsuari, 50).catch(() => []);
      }

      setTarjetas(tarjetasCargadas || []);

      // Verificar likes en paralelo (batch pequeño)
      if (tarjetasCargadas.length > 0) {
        const primeras20 = tarjetasCargadas.slice(0, 20);
        const likesResults = await Promise.all(
          primeras20.map(async (t) => {
            if (t.odIdUsuari === odIdUsuari) return [t.odIdUsuari, false];
            return [t.odIdUsuari, await yaLeDiLike(t.odIdUsuari, odIdUsuari)];
          })
        );
        setLikesData(Object.fromEntries(likesResults));
      }
    } catch (error) {
      console.error('[BAUL] Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Cargar mi tarjeta
  const cargarMiTarjeta = useCallback(async () => {
    console.log('[BAUL] ========== CARGANDO MI TARJETA ==========');
    const odIdUsuari = user?.id;
    console.log('[BAUL] Mi user ID:', odIdUsuari);

    if (!odIdUsuari) {
      console.log('[BAUL] ❌ No hay user ID, no se puede cargar tarjeta');
      return;
    }

    try {
      let tarjeta = await obtenerTarjeta(odIdUsuari);
      console.log('[BAUL] Tarjeta existente:', tarjeta);

      // Si no existe, crearla automáticamente
      if (!tarjeta) {
        console.log('[BAUL] Creando tarjeta automática...');
        tarjeta = await crearTarjetaAutomatica({
          odIdUsuari,
          username: user?.username || user?.displayName || 'Usuario',
          esInvitado: user?.esInvitado || user?.isGuest || false,
          edad: user?.edad,
          avatar: user?.avatar || user?.photoURL
        });
        console.log('[BAUL] Tarjeta creada:', tarjeta);
      }

      setMiTarjeta(tarjeta);

      // 🚀 BOOST: Aplicar vistas y likes graduales a mi tarjeta
      if (tarjeta) {
        try {
          const boostResult = await procesarBoostTarjeta(tarjeta);

          if (boostResult?.huboBoost && deberíaMostrarToast('baulEngagementToast')) {
            const mensaje = generarMensajeEngagement('tarjeta', boostResult);
            if (mensaje) {
              // Delay para que se sienta más natural
              setTimeout(() => {
                toast({
                  title: mensaje.title,
                  description: mensaje.description,
                  duration: 4000
                });
                marcarToastMostrado('baulEngagementToast');
              }, 2000 + Math.random() * 3000); // 2-5 segundos de delay
            }
          }
        } catch (boostError) {
          console.warn('[BAUL] Error en boost:', boostError.message);
        }
      }
    } catch (error) {
      console.error('[BAUL] ❌ Error cargando/creando mi tarjeta:', error);
    }
  }, [user]);

  // Efecto inicial
  useEffect(() => {
    if (isActive && user) {
      cargarMiTarjeta();
      cargarTarjetas();
    }
  }, [isActive, user, cargarMiTarjeta, cargarTarjetas]);

  // Suscripción en tiempo real a mi tarjeta
  useEffect(() => {
    const odIdUsuari = user?.id;
    if (!odIdUsuari || !isActive) return;

    const unsubscribe = suscribirseAMiTarjeta(odIdUsuari, (tarjeta) => {
      setMiTarjeta(tarjeta);
    });

    return () => unsubscribe();
  }, [user, isActive]);

  // Cargar conteo de matches no leídos
  useEffect(() => {
    const cargarMatchesNoLeidos = async () => {
      const odIdUsuari = user?.id;
      if (!odIdUsuari || !isActive) return;

      try {
        const count = await contarMatchesNoLeidos(odIdUsuari);
        setMatchesNoLeidos(count);
      } catch (error) {
        console.error('[BAUL] Error cargando matches no leídos:', error);
      }
    };

    cargarMatchesNoLeidos();
  }, [user, isActive]);

  // Handlers
  const handleLike = async (tarjetaId, quieroDarLike) => {
    const odIdUsuari = user?.id;
    if (!odIdUsuari) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas una cuenta para dar like',
        variant: 'destructive'
      });
      return false;
    }

    if (quieroDarLike) {
      // Dar like
      const resultado = await darLike(
        tarjetaId,
        odIdUsuari,
        miTarjeta?.nombre || user?.username || 'Usuario',
        user?.avatar || miTarjeta?.fotoUrl || ''
      );

      if (resultado.success) {
        setLikesData(prev => ({ ...prev, [tarjetaId]: true }));

        // ¡MATCH!
        if (resultado.isMatch && resultado.matchData) {
          console.log('[BAUL] 🎉 ¡MATCH!', resultado.matchData);
          setMatchData(resultado.matchData);
          setMostrarMatchModal(true);
          // Actualizar conteo de matches
          setMatchesNoLeidos(prev => prev + 1);
        }

        return true;
      }
      return false;
    } else {
      // Quitar like
      const resultado = await quitarLike(tarjetaId, odIdUsuari);
      if (resultado) {
        setLikesData(prev => ({ ...prev, [tarjetaId]: false }));
      }
      return resultado;
    }
  };

  const handleMensaje = (tarjeta) => {
    setTarjetaSeleccionada(tarjeta);
    setMostrarMensajeModal(true);
  };

  const handleVerPerfil = (tarjeta) => {
    const odIdUsuari = user?.id;

    // Si es mi tarjeta, abrir editor
    if (tarjeta.odIdUsuari === odIdUsuari) {
      setMostrarEditor(true);
      return;
    }

    // Registrar visita
    if (odIdUsuari) {
      registrarVisita(tarjeta.odIdUsuari, odIdUsuari, miTarjeta?.nombre || user?.username || 'Usuario');
    }

    // Abrir modal de mensaje que también muestra el perfil
    setTarjetaSeleccionada(tarjeta);
    setMostrarMensajeModal(true);
  };

  const handleRefresh = () => {
    cargarTarjetas(false);
  };

  const handleEditorClose = () => {
    setMostrarEditor(false);
    cargarTarjetas(false); // Refrescar por si cambió algo
  };

  if (!isActive) return null;

  const odIdUsuari = user?.id;

  const content = (
    <>
      {/* Header */}
      <BaulHeader
        onClose={onClose}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        cantidadTarjetas={tarjetas.filter(t => t.odIdUsuari !== odIdUsuari).length}
        actividadNoLeida={miTarjeta?.actividadNoLeida || 0}
        matchesNoLeidos={matchesNoLeidos}
        onVerActividad={() => setMostrarActividad(true)}
        onVerMatches={() => setMostrarMatchesList(true)}
      />

      {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : tarjetas.length === 0 ? (
              <EstadoVacio
                mensaje="No hay tarjetas disponibles"
                submensaje="Sé el primero en crear tu tarjeta y aparecerás aquí"
                onRefresh={handleRefresh}
              />
            ) : (
              <div className="p-3 sm:p-4">
                {/* Top context banner */}
                {(() => {
                  const getTimestampMs = (value) => {
                    if (!value) return null;
                    if (value.toMillis) return value.toMillis();
                    if (value.seconds) return value.seconds * 1000;
                    if (value instanceof Date) return value.getTime();
                    if (typeof value === 'number') return value;
                    return null;
                  };
                  const tarjetasVisibles = tarjetas.filter(t => t.odIdUsuari !== odIdUsuari);
                  const activosAhora = tarjetasVisibles.filter(t => (t.estadoReal || t.estado) === 'online').length;
                  const nuevosHoy = tarjetasVisibles.filter(t => {
                    const ts = getTimestampMs(t.creadaEn || t.createdAt);
                    return ts ? (Date.now() - ts) < 24 * 60 * 60 * 1000 : false;
                  }).length;
                  return (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2 text-[11px] text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-semibold">Activos ahora</span>
                          <span className="text-white font-bold">{activosAhora}</span>
                        </div>
                        <span className="text-gray-600">•</span>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-300 font-semibold">Nuevos hoy</span>
                          <span className="text-white font-bold">{nuevosHoy}</span>
                        </div>
                        <span className="ml-auto text-[10px] text-gray-400 hidden sm:inline">
                          Explora y conecta con un toque
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Grid de tarjetas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {tarjetas.map((tarjeta) => (
                    <TarjetaUsuario
                  key={tarjeta.odIdUsuari}
                  tarjeta={tarjeta}
                  esMiTarjeta={tarjeta.odIdUsuari === odIdUsuari}
                  yaLeDiLike={likesData[tarjeta.odIdUsuari] || false}
                  onLike={handleLike}
                  onMensaje={handleMensaje}
                  onVerPerfil={handleVerPerfil}
                />
              ))}
            </div>

            {/* Info de ubicación */}
            {!miUbicacion && (
              <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-white">Activa tu ubicación</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Comparte tu ubicación para ver personas cerca de ti y aparecer en su baúl.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de mensaje */}
      {mostrarMensajeModal && tarjetaSeleccionada && (
        <MensajeTarjetaModal
          isOpen={mostrarMensajeModal}
          onClose={() => {
            setMostrarMensajeModal(false);
            setTarjetaSeleccionada(null);
          }}
          tarjeta={tarjetaSeleccionada}
          miUserId={odIdUsuari}
          miUsername={miTarjeta?.nombre || user?.username || 'Usuario'}
        />
      )}

      {/* Modal de editor */}
      {mostrarEditor && miTarjeta && (
        <TarjetaEditor
          isOpen={mostrarEditor}
          onClose={handleEditorClose}
          tarjeta={miTarjeta}
        />
      )}

      {/* Modal de actividad */}
      {mostrarActividad && (
        <ActividadFeed
          isOpen={mostrarActividad}
          onClose={() => setMostrarActividad(false)}
          miUserId={odIdUsuari}
        />
      )}

      {/* Modal de Match */}
      <MatchModal
        isOpen={mostrarMatchModal}
        onClose={() => {
          setMostrarMatchModal(false);
          setMatchData(null);
        }}
        matchData={matchData}
        onEnviarMensaje={(otroUsuario) => {
          // Buscar la tarjeta del otro usuario para abrir el modal de mensaje
          const tarjetaOtro = tarjetas.find(t => t.odIdUsuari === otroUsuario.odIdUsuari);
          if (tarjetaOtro) {
            setTarjetaSeleccionada(tarjetaOtro);
            setMostrarMensajeModal(true);
          }
        }}
      />

      {/* Lista de Matches */}
      <MatchesList
        isOpen={mostrarMatchesList}
        onClose={() => {
          setMostrarMatchesList(false);
          // Refrescar conteo después de cerrar
          contarMatchesNoLeidos(odIdUsuari).then(setMatchesNoLeidos).catch(() => {});
        }}
        miUserId={odIdUsuari}
        onEnviarMensaje={(otroUsuario) => {
          setMostrarMatchesList(false);
          const tarjetaOtro = tarjetas.find(t => t.odIdUsuari === otroUsuario.odIdUsuari);
          if (tarjetaOtro) {
            setTarjetaSeleccionada(tarjetaOtro);
            setMostrarMensajeModal(true);
          } else {
            // Si no está en las tarjetas cargadas, crear una tarjeta temporal
            setTarjetaSeleccionada({
              odIdUsuari: otroUsuario.odIdUsuari,
              nombre: otroUsuario.nombre || otroUsuario.username,
              fotoUrl: otroUsuario.avatar,
              ...otroUsuario
            });
            setMostrarMensajeModal(true);
          }
        }}
        onVerPerfil={(otroUsuario) => {
          setMostrarMatchesList(false);
          const tarjetaOtro = tarjetas.find(t => t.odIdUsuari === otroUsuario.odIdUsuari);
          if (tarjetaOtro) {
            handleVerPerfil(tarjetaOtro);
          } else {
            setTarjetaSeleccionada({
              odIdUsuari: otroUsuario.odIdUsuari,
              nombre: otroUsuario.nombre || otroUsuario.username,
              fotoUrl: otroUsuario.avatar,
              ...otroUsuario
            });
            setMostrarMensajeModal(true);
          }
        }}
      />
    </>
  );

  if (isModal) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-900 shadow-2xl overflow-hidden flex flex-col"
          >
            {content}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full min-h-[calc(100dvh-4rem)] bg-gray-900 shadow-2xl overflow-hidden flex flex-col">
      {content}
    </div>
  );
};

export default BaulSection;
