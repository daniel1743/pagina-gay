/**
 * 📋 SECCIÓN BAÚL DE TARJETAS
 * Contenedor principal del sistema de tarjetas sociales
 *
 * Accesible desde el chat como sección extra
 * Muestra grid de tarjetas ordenadas por proximidad/estado
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TarjetaUsuario from './TarjetaUsuario';
import TarjetaEditor from './TarjetaEditor';
import MensajeTarjetaModal from './MensajeTarjetaModal';
import ActividadFeed from './ActividadFeed';
import MetricasTarjetaPanel from './MetricasTarjetaPanel';
import MatchModal from './MatchModal';
import MatchesList from './MatchesList';
import PrivateChatWindow from '@/components/chat/PrivateChatWindow';
import {
  obtenerTarjetasCercanas,
  obtenerTarjetasRecientes,
  obtenerTarjeta,
  crearTarjetaAutomatica,
  darLike,
  quitarLike,
  yaLeDiLike,
  dejarHuella,
  yaDejeHuella,
  registrarVisita,
  registrarImpresion,
  suscribirseAMiTarjeta,
  actualizarTarjeta,
  obtenerMisMatches,
  contarMatchesNoLeidos
} from '@/services/tarjetaService';
import { getOrCreatePrivateChat } from '@/services/socialService';
import { getCurrentLocation } from '@/services/geolocationService';
import { toast } from '@/components/ui/use-toast';
import { track, getSessionId } from '@/services/eventTrackingService';

/**
 * Header del Baúl
 */
const BaulHeader = ({
  onClose,
  onRefresh,
  isRefreshing,
  cantidadTarjetas,
  isGuestView = false,
  onCreateProfile,
  onEditMyCard,
  canEditOwnCard = false
}) => (
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
        {isGuestView && (
          <span className="text-[10px] text-yellow-200 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
            Vista previa
          </span>
        )}
        <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
          {cantidadTarjetas} cerca
        </span>
      </div>

      <div className="flex items-center gap-2">
        {canEditOwnCard && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onEditMyCard}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Mi tarjeta
          </motion.button>
        )}
        {isGuestView && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onCreateProfile}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
          >
            Crear perfil
          </motion.button>
        )}

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
  const navigate = useNavigate();
  const isModal = variant === 'modal';
  const isActive = isModal ? isOpen : true;
  const isGuestView = !user || user.isGuest || user.isAnonymous;
  const canInteract = Boolean(user && !user.isGuest && !user.isAnonymous);
  const canDejarHuella = canInteract;
  const canEditOwnCard = Boolean(user && user.id);

  useEffect(() => {
    if (!isActive) return;
    const sessionId = getSessionId();
    const viewKey = `baul_viewed:${sessionId}`;
    if (sessionStorage.getItem(viewKey) === '1') return;
    sessionStorage.setItem(viewKey, '1');
    track('baul_view', { page_path: '/baul' }, { user }).catch(() => {});
  }, [isActive, user]);

  // Estados
  const [tarjetas, setTarjetas] = useState([]);
  const [miTarjeta, setMiTarjeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [likesData, setLikesData] = useState({}); // { odIdUsuari: boolean }
  const [huellasData, setHuellasData] = useState({}); // { odIdUsuari: boolean }
  const [loadingHuella, setLoadingHuella] = useState(null); // odIdUsuari en progreso

  // Modales
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [mostrarEditor, setMostrarEditor] = useState(false);
  const [mostrarMensajeModal, setMostrarMensajeModal] = useState(false);
  const [mostrarActividad, setMostrarActividad] = useState(false);
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
  const [matchData, setMatchData] = useState(null); // Para mostrar modal de match
  const [mostrarMatchModal, setMostrarMatchModal] = useState(false);
  const [mostrarMatchesList, setMostrarMatchesList] = useState(false);
  const [matchesNoLeidos, setMatchesNoLeidos] = useState(0);
  const [activePrivateChat, setActivePrivateChat] = useState(null);

  // Cargar tarjetas (sin dependencia de miUbicacion para evitar loop)
  const cargarTarjetas = useCallback(async (mostrarLoading = true, ubicacionParam = null) => {
    const odIdUsuari = user?.id || null;

    if (mostrarLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // Usar ubicación pasada como parámetro o intentar obtener nueva
      let ubicacion = ubicacionParam;

      if (!ubicacion && canInteract) {
        try {
          // Timeout rápido de 3 segundos
          const locationPromise = getCurrentLocation();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          ubicacion = await Promise.race([locationPromise, timeoutPromise]);
          setMiUbicacion(ubicacion);

          // Guardar ubicación en background (no bloquear)
          if (odIdUsuari) {
            actualizarTarjeta(odIdUsuari, {
              ubicacion: { latitude: ubicacion.latitude, longitude: ubicacion.longitude },
              ubicacionActiva: true
            }).catch(() => {});
          }
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

      // Verificar likes (solo registrados) y huellas (cualquier autenticado) en paralelo
      if (tarjetasCargadas.length > 0 && odIdUsuari) {
        const primeras20 = tarjetasCargadas.slice(0, 20);
        const promises = [];
        if (canInteract) {
          promises.push(
            Promise.all(
              primeras20.map(async (t) => {
                if (t.odIdUsuari === odIdUsuari) return [t.odIdUsuari, false];
                return [t.odIdUsuari, await yaLeDiLike(t.odIdUsuari, odIdUsuari)];
              })
            ).then(r => ({ likes: Object.fromEntries(r) }))
          );
        } else {
          promises.push(Promise.resolve({ likes: {} }));
        }
        if (canDejarHuella) {
          promises.push(
            Promise.all(
              primeras20.map(async (t) => {
                if (t.odIdUsuari === odIdUsuari) return [t.odIdUsuari, false];
                return [t.odIdUsuari, await yaDejeHuella(t.odIdUsuari, odIdUsuari)];
              })
            ).then(r => ({ huellas: Object.fromEntries(r) }))
          );
        } else {
          promises.push(Promise.resolve({ huellas: {} }));
        }
        const results = await Promise.all(promises);
        const combined = results.reduce((acc, r) => ({ ...acc, ...r }), {});
        if (combined.likes) setLikesData(combined.likes);
        if (combined.huellas) setHuellasData(combined.huellas);
      } else {
        setLikesData({});
        setHuellasData({});
      }
    } catch (error) {
      console.error('[BAUL] Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, canInteract, canDejarHuella]);

  // Cargar mi tarjeta
  const cargarMiTarjeta = useCallback(async () => {
    console.log('[BAUL] ========== CARGANDO MI TARJETA ==========');
    const odIdUsuari = user?.id;
    console.log('[BAUL] Mi user ID:', odIdUsuari);

    if (!odIdUsuari) {
      console.log('[BAUL] ❌ No hay user ID, no se puede cargar tarjeta');
      return null;
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

      const fallbackAvatar = user?.avatar || user?.photoURL || '';
      if (tarjeta && fallbackAvatar && !tarjeta.fotoUrl && !tarjeta.fotoUrlFull && !tarjeta.fotoUrlThumb) {
        tarjeta = {
          ...tarjeta,
          fotoUrl: fallbackAvatar,
          fotoUrlThumb: fallbackAvatar,
          fotoUrlFull: fallbackAvatar
        };
      }

      setMiTarjeta(tarjeta);
      return tarjeta;

    } catch (error) {
      console.error('[BAUL] ❌ Error cargando/creando mi tarjeta:', error);
      return null;
    }
  }, [user]);

  // Efecto inicial
  useEffect(() => {
    if (isActive) {
      if (canEditOwnCard) {
        cargarMiTarjeta();
      }
      cargarTarjetas();
    }
  }, [isActive, canEditOwnCard, cargarMiTarjeta, cargarTarjetas]);

  // Suscripción en tiempo real a mi tarjeta
  useEffect(() => {
    const odIdUsuari = user?.id;
    if (!odIdUsuari || !isActive || !canEditOwnCard) return;

    const unsubscribe = suscribirseAMiTarjeta(odIdUsuari, (tarjeta) => {
      setMiTarjeta(tarjeta);
    });

    return () => unsubscribe();
  }, [user, isActive, canEditOwnCard]);

  // Cargar conteo de matches no leídos
  useEffect(() => {
    const cargarMatchesNoLeidos = async () => {
      const odIdUsuari = user?.id;
      if (!odIdUsuari || !isActive || !canInteract) return;

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
  const showGuestPrompt = useCallback((accion = 'interactuar') => {
    toast({
      title: 'Crea tu perfil para interactuar',
      description: 'Regístrate para dar like, chatear y aparecer en Baúl.',
      duration: 5000,
      action: {
        label: 'Crear cuenta',
        onClick: () => navigate('/auth')
      }
    });
  }, [navigate]);

  const handleLike = async (tarjeta, quieroDarLike) => {
    if (!canInteract) {
      showGuestPrompt('like');
      return false;
    }
    const odIdUsuari = user?.id;
    if (!odIdUsuari) {
      toast({
        title: 'Inicia sesión',
        description: 'Necesitas una cuenta para dar like',
        variant: 'destructive'
      });
      return false;
    }

    const tarjetaId = tarjeta?.odIdUsuari;
    if (!tarjetaId) return false;

    if (quieroDarLike) {
      // Dar like
      const resultado = await darLike(
        tarjetaId,
        odIdUsuari,
        miTarjeta?.nombre || user?.username || 'Usuario',
        user?.avatar || miTarjeta?.fotoUrl || ''
      );

      if (resultado?.reason === 'blocked') {
        toast({
          title: 'No puedes interactuar',
          description: 'Este usuario ha bloqueado la interacción o tú lo has bloqueado.',
          variant: 'destructive'
        });
        return false;
      }

      if (resultado.success) {
        setLikesData(prev => ({ ...prev, [tarjetaId]: true }));

        // ¡MATCH!
        if (resultado.isMatch && resultado.matchData) {
          console.log('[BAUL] 🎉 ¡MATCH!', resultado.matchData);
          setMatchData(resultado.matchData);
          setMostrarMatchModal(true);
          setMatchesNoLeidos(prev => prev + 1);
        }

        return true;
      }
      toast({
        title: 'No se pudo dar like',
        description: 'Intenta de nuevo en un momento',
        variant: 'destructive'
      });
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
    if (!canInteract) {
      showGuestPrompt('chat');
      return;
    }
    setTarjetaSeleccionada(tarjeta);
    setMostrarMensajeModal(true);
  };

  const handleDejarHuella = async (tarjeta) => {
    if (!canDejarHuella) {
      showGuestPrompt('huella');
      return false;
    }
    const odIdUsuari = user?.id;
    const tarjetaId = tarjeta?.odIdUsuari || tarjeta?.id;
    if (!odIdUsuari || !tarjetaId || tarjetaId === odIdUsuari) return false;

    setLoadingHuella(tarjetaId);
    try {
      const res = await dejarHuella(
        tarjetaId,
        odIdUsuari,
        miTarjeta?.nombre || user?.username || 'Usuario'
      );
      if (res?.success) {
        setHuellasData(prev => ({ ...prev, [tarjetaId]: true }));
        const intencion = (tarjeta?.buscando || '').trim();
        toast({
          title: 'Pasaste por su perfil',
          description: intencion
            ? `${tarjeta.nombre || 'Usuario'} busca: ${intencion}`
            : `${tarjeta.nombre || 'Usuario'} verá que pasaste por aquí`,
          duration: 3000
        });
      } else {
        const reason = res?.reason;
        let description = 'Intenta de nuevo en un momento';

        if (reason === 'already_left') {
          description = 'Ya pasaste por este perfil hoy';
        } else if (reason === 'limit') {
          description = res?.message || 'Límite diario de huellas alcanzado';
        } else if (reason === 'blocked') {
          description = 'No puedes interactuar con este perfil';
        } else if (reason === 'permissions') {
          description = 'Faltan permisos en Firestore para registrar huellas';
        } else if (reason === 'not_found') {
          description = 'La tarjeta ya no existe';
        } else if (res?.message) {
          description = res.message;
        }

        toast({
          title: 'No pudiste dejar huella',
          description,
          variant: 'destructive',
          duration: 4000
        });
        return false;
      }
      return res?.success || false;
    } catch (err) {
      console.error('[BAUL] Error dejando huella:', err);
      toast({
        title: 'Error',
        description: 'Intenta de nuevo en un momento',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoadingHuella(null);
    }
  };

  const handleImpresion = useCallback((tarjeta) => {
    const odIdUsuari = user?.id;
    const tarjetaId = tarjeta?.odIdUsuari || tarjeta?.id;
    if (!odIdUsuari || !tarjetaId || tarjetaId === odIdUsuari) return;
    registrarImpresion(tarjetaId, odIdUsuari);
  }, [user?.id]);

  const handleVerPerfil = async (tarjeta) => {
    const odIdUsuari = user?.id;
    const esMiTarjeta = (tarjeta?.odIdUsuari || tarjeta?.id) === odIdUsuari;

    // Si es mi tarjeta, abrir editor
    if (esMiTarjeta) {
      if (!canEditOwnCard) return;
      if (!miTarjeta) {
        await cargarMiTarjeta();
      }
      setMostrarEditor(true);
      return;
    }

    // Registrar visita
    if (odIdUsuari && canInteract) {
      registrarVisita(tarjeta.odIdUsuari, odIdUsuari, miTarjeta?.nombre || user?.username || 'Usuario');
    }

    // Abrir modal de mensaje que también muestra el perfil
    setTarjetaSeleccionada(tarjeta);
    setMostrarMensajeModal(true);
  };

  const obtenerMensajeSugerido = () => {
    const ejemplos = [
      'Hola, te vi en Baúl 👋',
      'Hey, coincidimos en Baúl',
    ];
    return ejemplos[Math.floor(Math.random() * ejemplos.length)];
  };

  const abrirChatPrivado = async (tarjetaDestino) => {
    if (!tarjetaDestino?.odIdUsuari) return;

    // ✅ Solo usuarios registrados
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: 'Regístrate para chatear en privado',
        description: 'Los chats privados están disponibles solo para usuarios registrados.',
        duration: 5000,
        action: {
          label: 'Registrarme',
          onClick: () => navigate('/auth'),
        },
      });
      return;
    }

    if (tarjetaDestino.esInvitado) {
      toast({
        title: 'Usuario invitado',
        description: 'Este usuario aún es invitado y no puede recibir chats privados.',
        duration: 5000,
      });
      return;
    }

    if (tarjetaDestino.odIdUsuari === user.id) return;

    try {
      const { chatId } = await getOrCreatePrivateChat(user.id, tarjetaDestino.odIdUsuari);
      setActivePrivateChat({
        chatId,
        partner: {
          id: tarjetaDestino.odIdUsuari,
          username: tarjetaDestino.nombre || tarjetaDestino.odIdUsuariNombre || 'Usuario',
          avatar: tarjetaDestino.fotoUrl || tarjetaDestino.fotoUrlThumb || ''
        },
        initialMessage: obtenerMensajeSugerido()
      });
    } catch (error) {
      console.error('[BAUL] Error creando chat privado:', error);
      toast({
        title: error?.message === 'BLOCKED' ? 'No disponible' : 'No pudimos abrir el chat',
        description: error?.message === 'BLOCKED'
          ? 'No puedes chatear con este usuario.'
          : 'Intenta de nuevo en un momento',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    if (canEditOwnCard) cargarMiTarjeta();
    cargarTarjetas(false);
  };

  const handleEditorClose = () => {
    setMostrarEditor(false);
    if (canEditOwnCard) cargarMiTarjeta(); // Refrescar mi tarjeta con datos actualizados
    cargarTarjetas(false); // Refrescar lista por si cambió algo
  };

  if (!isActive) return null;

  const odIdUsuari = user?.id;
  const isMiTarjeta = (tarjeta) => (tarjeta?.odIdUsuari || tarjeta?.id) === odIdUsuari;
  const tarjetasBase = (() => {
    const base = Array.isArray(tarjetas) ? [...tarjetas] : [];
    if (!odIdUsuari) return base;
    const idx = base.findIndex(t => isMiTarjeta(t));
    // Para la tarjeta propia: miTarjeta es la fuente de verdad (evita sobrescribir con datos del query)
    const miTarjetaFinal = miTarjeta
      ? { ...miTarjeta, odIdUsuari: miTarjeta.odIdUsuari || odIdUsuari }
      : null;
    if (idx >= 0) {
      base[idx] = miTarjetaFinal || { ...base[idx], odIdUsuari: base[idx].odIdUsuari || odIdUsuari };
    } else if (miTarjetaFinal) {
      base.unshift(miTarjetaFinal);
    }
    const idxFinal = base.findIndex(t => isMiTarjeta(t));
    if (idxFinal > 0) {
      const [mi] = base.splice(idxFinal, 1);
      base.unshift(mi);
    }
    return base;
  })();
  const tarjetasVisibles = tarjetasBase;
  const handleEditMyCard = async () => {
    if (!canEditOwnCard) return;
    if (!miTarjeta) {
      await cargarMiTarjeta();
    }
    setMostrarEditor(true);
  };

  const content = (
    <>
      {/* Header */}
      <BaulHeader
        onClose={onClose}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        cantidadTarjetas={tarjetasVisibles.filter(t => !isMiTarjeta(t)).length}
        isGuestView={isGuestView}
        onCreateProfile={() => navigate('/auth')}
        onEditMyCard={handleEditMyCard}
        canEditOwnCard={canEditOwnCard}
      />

      {/* Contenido */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : tarjetasVisibles.length === 0 ? (
              <EstadoVacio
                mensaje="No hay tarjetas disponibles"
                submensaje="Sé el primero en crear tu tarjeta y aparecerás aquí"
                onRefresh={handleRefresh}
              />
            ) : (
              <div className="p-3 sm:p-4">
                {!isGuestView && (
                  <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMostrarActividad(true)}
                      className="relative inline-flex items-center gap-2 rounded-full border border-gray-700/60 bg-gray-800/40 px-3 py-1.5 text-[11px] text-gray-200 hover:bg-gray-800/60 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5 text-gray-300" />
                      Actividad
                      {miTarjeta?.actividadNoLeida > 0 && (
                        <span className="ml-1 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {miTarjeta?.actividadNoLeida > 9 ? '9+' : miTarjeta?.actividadNoLeida}
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMostrarMatchesList(true)}
                      className="relative inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-[11px] text-pink-200 hover:bg-pink-500/20 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-pink-300" />
                      Matches
                      {matchesNoLeidos > 0 && (
                        <span className="ml-1 min-w-[16px] h-[16px] rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {matchesNoLeidos > 9 ? '9+' : matchesNoLeidos}
                        </span>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMostrarMetricas(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-[11px] text-cyan-200 hover:bg-cyan-500/20 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
                      Métricas
                    </motion.button>
                  </div>
                )}
                {isGuestView && canEditOwnCard && (
                  <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditMyCard}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      Editar mi tarjeta
                    </motion.button>
                  </div>
                )}

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
                  const tarjetasParaConteo = tarjetasVisibles.filter(t => t.odIdUsuari !== odIdUsuari);
                  const activosAhora = tarjetasParaConteo.filter(t => (t.estadoReal || t.estado) === 'online').length;
                  const nuevosHoy = tarjetasParaConteo.filter(t => {
                    const ts = getTimestampMs(t.creadaEn || t.createdAt);
                    return ts ? (Date.now() - ts) < 24 * 60 * 60 * 1000 : false;
                  }).length;
                  return (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2 text-[11px] text-gray-300">
                        {isGuestView && (
                          <span className="text-[10px] text-yellow-200 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/30">
                            Vista previa
                          </span>
                        )}
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
                          {isGuestView ? 'Explora antes de crear tu perfil' : 'Explora y conecta con un toque'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Grid de tarjetas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {tarjetasVisibles.map((tarjeta) => {
                    const tarjetaId = tarjeta.odIdUsuari || tarjeta.id;
                    const esMiTarjetaActual = tarjetaId === odIdUsuari;
                    return (
                    <TarjetaUsuario
                      key={tarjetaId}
                      tarjeta={tarjeta}
                      esMiTarjeta={esMiTarjetaActual}
                      yaLeDiLike={likesData[tarjeta.odIdUsuari] || false}
                      yaDejeHuella={huellasData[tarjeta.odIdUsuari] || false}
                      onLike={handleLike}
                      onMensaje={handleMensaje}
                      onDejarHuella={handleDejarHuella}
                      onImpresion={handleImpresion}
                      onVerPerfil={handleVerPerfil}
                      isLoadingHuella={loadingHuella === tarjetaId}
                      interactionLocked={isGuestView && !esMiTarjetaActual}
                      onLockedAction={showGuestPrompt}
                    />
                  );})}
                </div>

            {/* Info de ubicación */}
            {!miUbicacion && canInteract && (
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
          readOnly={isGuestView}
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

      {/* Panel de métricas */}
      {mostrarMetricas && (
        <MetricasTarjetaPanel
          isOpen={mostrarMetricas}
          onClose={() => setMostrarMetricas(false)}
          onRefresh={handleRefresh}
        />
      )}

      {/* Modal de Match */}
      {!isGuestView && (
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
      )}

      {/* Lista de Matches */}
      {!isGuestView && (
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
      )}

      {activePrivateChat && (
        <PrivateChatWindow
          user={user}
          partner={activePrivateChat.partner}
          chatId={activePrivateChat.chatId}
          initialMessage={activePrivateChat.initialMessage}
          autoFocus={true}
          onClose={() => setActivePrivateChat(null)}
        />
      )}
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
