/**
 * 💬 MODAL PARA VER PERFIL Y ENVIAR MENSAJE
 * Muestra información completa del usuario + opción de mensaje + chat privado
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  User,
  Loader2,
  MapPin,
  Clock,
  Heart,
  Eye,
  Ruler,
  MessageCircle,
  Shield
} from 'lucide-react';
import { enviarMensajeTarjeta, formatearHorarios, getColorRol, verificarInteresMutuo } from '@/services/tarjetaService';
import { sendPrivateChatRequest } from '@/services/socialService';
import { blockUser } from '@/services/blockService';
import { toast } from '@/components/ui/use-toast';

const MensajeTarjetaModal = ({
  isOpen,
  onClose,
  tarjeta,
  miUserId,
  miUsername,
  readOnly = false
}) => {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('');
  const [isEnviando, setIsEnviando] = useState(false);
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [solicitandoChat, setSolicitandoChat] = useState(false);
  const [chatSolicitado, setChatSolicitado] = useState(false);
  const [hayMatch, setHayMatch] = useState(false);
  const [verificandoMatch, setVerificandoMatch] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const isReadOnly = readOnly || !miUserId;

  const maxChars = 200;

  // Verificar si hay interés mutuo (match, likes o mensajes mutuos)
  useEffect(() => {
    const checkInteresMutuo = async () => {
      if (isReadOnly || !miUserId || !tarjeta?.odIdUsuari) {
        setVerificandoMatch(false);
        return;
      }

      try {
        const resultado = await verificarInteresMutuo(miUserId, tarjeta.odIdUsuari);
        setHayMatch(resultado.hayInteres);
        console.log('[BAUL] Interés mutuo:', resultado);
      } catch (error) {
        console.error('Error verificando interés mutuo:', error);
      } finally {
        setVerificandoMatch(false);
      }
    };

    if (isOpen) {
      checkInteresMutuo();
    }
  }, [isOpen, isReadOnly, miUserId, tarjeta?.odIdUsuari]);

  // Solicitar chat privado (solo si hay match)
  const handleSolicitarChat = async () => {
    if (isReadOnly) return;
    if (solicitandoChat || chatSolicitado || !miUserId || !hayMatch) return;

    setSolicitandoChat(true);
    try {
      await sendPrivateChatRequest(miUserId, tarjeta.odIdUsuari);
      setChatSolicitado(true);
      toast({
        title: '¡Solicitud enviada!',
        description: `${tarjeta.nombre} recibirá tu solicitud de chat privado`,
      });
    } catch (error) {
      console.error('Error solicitando chat:', error);
      if (error?.message === 'BLOCKED') {
        toast({
          title: 'No disponible',
          description: 'No puedes abrir chat con este usuario.',
          variant: 'destructive'
        });
      } else {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud',
        variant: 'destructive'
      });
      }
    } finally {
      setSolicitandoChat(false);
    }
  };

  const handleEnviar = async () => {
    if (isReadOnly) return;
    if (!mensaje.trim() || isEnviando) return;

    setIsEnviando(true);

    try {
      const exito = await enviarMensajeTarjeta(
        tarjeta.odIdUsuari,
        miUserId,
        miUsername,
        mensaje.trim()
      );

      if (exito) {
        toast({
          title: 'Mensaje enviado',
          description: `${tarjeta.nombre} verá tu mensaje cuando entre`,
        });
        onClose();
      } else {
        throw new Error('No se pudo enviar');
      }
    } catch (error) {
      if (error?.message === 'BLOCKED') {
        toast({
          title: 'No disponible',
          description: 'No puedes enviar mensajes a este usuario.',
          variant: 'destructive'
        });
      } else {
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive'
      });
      }
    } finally {
      setIsEnviando(false);
    }
  };

  const handleBlockUser = async () => {
    if (isReadOnly || !miUserId || !tarjeta?.odIdUsuari) return;
    if (tarjeta.odIdUsuari === miUserId) return;

    const confirmed = window.confirm(`¿Bloquear a ${tarjeta.nombre || 'este usuario'}? No podrán interactuar entre ustedes.`);
    if (!confirmed) return;

    setIsBlocking(true);
    try {
      await blockUser(miUserId, tarjeta.odIdUsuari, { source: 'baul_profile' });
      toast({
        title: 'Usuario bloqueado',
        description: 'No podrás ver ni recibir interacciones de este usuario.',
        variant: 'destructive'
      });
      onClose();
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      toast({
        title: 'No pudimos bloquear',
        description: 'Intenta de nuevo en un momento',
        variant: 'destructive'
      });
    } finally {
      setIsBlocking(false);
    }
  };

  if (!isOpen) return null;

  // Info física formateada
  const infoFisica = [];
  if (tarjeta.alturaCm) infoFisica.push(`${(tarjeta.alturaCm / 100).toFixed(2)}m`);
  if (tarjeta.pesaje) infoFisica.push(`${tarjeta.pesaje}cm`);

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
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto"
        >
          {/* Header con foto grande */}
          <div className="relative">
            {/* Foto */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-900 relative">
              {tarjeta.fotoUrl ? (
                <img
                  src={tarjeta.fotoUrlFull || tarjeta.fotoUrl}
                  alt={tarjeta.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-24 h-24 text-gray-600" />
                </div>
              )}
              {/* Gradiente inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent" />
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Info básica sobre la foto */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-2xl font-bold text-white">
                {tarjeta.nombre || 'Usuario'}
                {tarjeta.edad && <span className="font-normal text-gray-300">, {tarjeta.edad}</span>}
              </h2>
              {tarjeta.rol && (
                <span className={`inline-block mt-2 ${getColorRol(tarjeta.rol)} text-white text-sm font-semibold px-3 py-1 rounded-full`}>
                  {tarjeta.rol}
                </span>
              )}
            </div>
          </div>

          {/* Información del perfil */}
          <div className="p-4 space-y-4">
            {isReadOnly && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-yellow-200">Vista previa</p>
                  <p className="text-[11px] text-yellow-100/80">Crea tu perfil para dar like y chatear</p>
                </div>
                <button
                  onClick={() => navigate('/auth')}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                  Crear cuenta
                </button>
              </div>
            )}
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-pink-500" />
                <span>{tarjeta.likesRecibidos || 0} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{tarjeta.visitasRecibidas || 0} visitas</span>
              </div>
              {/* Solo mostrar distancia si <= 5km para evitar fricción */}
              {tarjeta.distanciaTexto && tarjeta.distanciaKm && tarjeta.distanciaKm <= 5 && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{tarjeta.distanciaTexto}</span>
                </div>
              )}
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-3">
              {/* Ubicación */}
              {tarjeta.ubicacionTexto && (
                <div className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ubicación</span>
                  </div>
                  <p className="text-white font-medium">{tarjeta.ubicacionTexto}</p>
                </div>
              )}

              {/* Etnia */}
              {tarjeta.etnia && (
                <div className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Etnia</span>
                  </div>
                  <p className="text-white font-medium">{tarjeta.etnia}</p>
                </div>
              )}

              {/* Medidas */}
              {infoFisica.length > 0 && (
                <div className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Medidas</span>
                  </div>
                  <p className="text-white font-medium">{infoFisica.join(' · ')}</p>
                </div>
              )}

              {/* Horarios */}
              {tarjeta.horariosConexion && (
                <div className="bg-gray-700/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Horarios</span>
                  </div>
                  <p className="text-white font-medium text-sm">{formatearHorarios(tarjeta.horariosConexion)}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {tarjeta.bio && (
              <div className="bg-gray-700/30 rounded-xl p-4">
                <p className="text-gray-300 italic">"{tarjeta.bio}"</p>
              </div>
            )}

            {/* Buscando */}
            {tarjeta.buscando && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                <p className="text-xs text-cyan-400 mb-1 font-medium">Busca:</p>
                <p className="text-white">{tarjeta.buscando}</p>
              </div>
            )}

            {/* Botón Chat Privado (solo si hay match) */}
            {!isReadOnly && !verificandoMatch && hayMatch && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSolicitarChat}
                disabled={solicitandoChat || chatSolicitado}
                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 mb-3 transition-colors
                  ${chatSolicitado
                    ? 'bg-green-500/20 text-green-400 cursor-default'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  }
                  ${solicitandoChat ? 'opacity-70' : ''}
                `}
              >
                {solicitandoChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : chatSolicitado ? (
                  <>
                    <Heart className="w-4 h-4" />
                    Solicitud enviada
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    Abrir chat privado
                  </>
                )}
              </motion.button>
            )}

            {/* Indicador de interés mutuo */}
            {!isReadOnly && !verificandoMatch && hayMatch && (
              <div className="flex items-center justify-center gap-2 text-xs text-pink-400 mb-3">
                <Heart className="w-3 h-3 fill-current" />
                <span>¡Interés mutuo! Pueden chatear en privado</span>
              </div>
            )}

            {/* Sección de mensaje */}
            {!isReadOnly && !mostrarMensaje ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMostrarMensaje(true)}
                className="w-full py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar mensaje
              </motion.button>
            ) : !isReadOnly ? (
              <div className="space-y-3">
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value.slice(0, maxChars))}
                  placeholder="Escribe un mensaje corto..."
                  className="w-full h-24 bg-gray-700/50 border border-gray-600 rounded-xl p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${mensaje.length >= maxChars ? 'text-red-400' : 'text-gray-500'}`}>
                    {mensaje.length}/{maxChars}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMostrarMensaje(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnviar}
                    disabled={!mensaje.trim() || isEnviando}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isEnviando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : null}

            {/* Bloquear usuario */}
            {!isReadOnly && (
              <button
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="w-full mt-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Shield className="w-4 h-4" />
                {isBlocking ? 'Bloqueando...' : 'Bloquear usuario'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MensajeTarjetaModal;
