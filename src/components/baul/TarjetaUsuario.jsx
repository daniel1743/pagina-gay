/**
 * 📋 COMPONENTE TARJETA DE USUARIO
 * Tarjeta visual para el Baúl de Perfiles
 *
 * Muestra: foto, nombre, edad, rol, medidas, estado, likes, etc.
 * Acciones: like, mensaje, ver perfil completo
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  User,
  Eye
} from 'lucide-react';
import { getColorRol, getEmojiEstado, formatearHorarios } from '@/services/tarjetaService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Indicador de estado (🟢🟠⚫)
 */
const EstadoIndicador = ({ estado }) => {
  const colores = {
    online: 'bg-green-500 shadow-green-500/50',
    reciente: 'bg-orange-500 shadow-orange-500/50',
    offline: 'bg-gray-500'
  };

  const textos = {
    online: 'Online',
    reciente: 'Hace poco',
    offline: 'Offline'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-3 h-3 rounded-full ${colores[estado]} ${estado === 'online' ? 'animate-pulse shadow-lg' : ''}`}
      />
      <span className="text-xs text-gray-300">{textos[estado]}</span>
    </div>
  );
};

/**
 * Badge del rol
 */
const RolBadge = ({ rol }) => {
  if (!rol) return null;

  return (
    <span className={`${getColorRol(rol)} text-white text-xs font-semibold px-2 py-0.5 rounded-full`}>
      {rol}
    </span>
  );
};

/**
 * Componente principal de Tarjeta
 */
const TarjetaUsuario = ({
  tarjeta,
  onLike,
  onMensaje,
  onVerPerfil,
  esMiTarjeta = false,
  yaLeDiLike = false,
  isLoading = false,
  interactionLocked = false,
  onLockedAction
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(yaLeDiLike);
  const [likesCount, setLikesCount] = useState(tarjeta.likesRecibidos || 0);
  const estadoActual = tarjeta.estadoReal || tarjeta.estado;
  const nowMs = Date.now();
  const getTimestampMs = (value) => {
    if (!value) return null;
    if (value.toMillis) return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'number') return value;
    return null;
  };
  const createdMs = getTimestampMs(tarjeta.creadaEn || tarjeta.createdAt);
  const isNew = createdMs ? (nowMs - createdMs) < 24 * 60 * 60 * 1000 : false;
  const isActive = estadoActual === 'online';
  const isSensitive = Boolean(
    tarjeta.fotoSensible ||
    tarjeta.contenidoSensible ||
    tarjeta.isExplicit ||
    tarjeta.explicit ||
    tarjeta.nsfw ||
    tarjeta.isSensitive
  );
  const viewerKey = user?.id || user?.guestId || 'anon';
  const revealKey = `baul_blur_reveal:${viewerKey}:${tarjeta.odIdUsuari || tarjeta.id || 'unknown'}`;
  const [revealed, setRevealed] = useState(() => sessionStorage.getItem(revealKey) === '1');

  useEffect(() => {
    setRevealed(sessionStorage.getItem(revealKey) === '1');
  }, [revealKey]);
  const priorityClass = !esMiTarjeta
    ? (isActive
        ? 'ring-1 ring-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
        : isNew
          ? 'ring-1 ring-violet-400/35 shadow-[0_0_10px_rgba(139,92,246,0.12)]'
          : '')
    : '';

  const handleLike = async (e) => {
    e.stopPropagation();
    if (esMiTarjeta || isLoading) return;
    if (interactionLocked) {
      onLockedAction?.('like');
      return;
    }

    // Optimistic update
    const nuevoEstado = !liked;
    setLiked(nuevoEstado);
    setLikesCount(prev => nuevoEstado ? prev + 1 : prev - 1);

    // Llamar al handler
    if (onLike) {
      const exito = await onLike(tarjeta, nuevoEstado);
      if (!exito) {
        // Revertir si falla
        setLiked(!nuevoEstado);
        setLikesCount(prev => nuevoEstado ? prev - 1 : prev + 1);
      }
    }
  };

  const handleMensaje = (e) => {
    e.stopPropagation();
    if (esMiTarjeta) return;
    if (interactionLocked) {
      onLockedAction?.('chat');
      return;
    }
    onMensaje?.(tarjeta);
  };

  const handleClick = () => {
    onVerPerfil?.(tarjeta);
  };

  const handleReveal = (e) => {
    e.stopPropagation();
    sessionStorage.setItem(revealKey, '1');
    setRevealed(true);
  };

  const hasPhoto = Boolean(tarjeta.fotoUrl || tarjeta.fotoUrlFull || tarjeta.fotoUrlThumb);
  const shouldBlur = isSensitive && !esMiTarjeta && !revealed && hasPhoto;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={handleClick}
      className={`
        relative rounded-lg overflow-hidden cursor-pointer
        bg-gradient-to-br from-gray-800/90 to-gray-900/90
        border border-gray-700/50 hover:border-gray-600/50
        shadow-md hover:shadow-lg transition-all
        ${esMiTarjeta ? 'ring-2 ring-cyan-500/50' : ''}
        ${priorityClass}
      `}
    >
      {/* Badge "Tu" */}
      {esMiTarjeta && (
        <div className="absolute top-1.5 left-1.5 z-20 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          Tú
        </div>
      )}
      {!esMiTarjeta && (isActive || isNew) && (
        <div
          className={`absolute top-1.5 left-1.5 z-20 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
            isActive ? 'bg-emerald-500/80' : 'bg-violet-500/80'
          }`}
        >
          {isActive ? 'Activo' : 'Nuevo'}
        </div>
      )}

      {/* Foto / Avatar - MÁS COMPACTO (fallback: fotoUrlFull, fotoUrlThumb) */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-700 to-gray-800">
        {hasPhoto ? (
          <img
            src={tarjeta.fotoUrl || tarjeta.fotoUrlFull || tarjeta.fotoUrlThumb}
            alt={tarjeta.nombre}
            className={`w-full h-full object-cover transition ${shouldBlur ? 'blur-[10px] scale-[1.02]' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {shouldBlur && (
          <button
            type="button"
            onClick={handleReveal}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-white text-[11px] font-semibold backdrop-blur-[1px]"
          >
            Tocar para ver
          </button>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Estado - punto pequeño */}
        <div className="absolute top-1.5 right-1.5">
          <div className={`w-2 h-2 rounded-full ${
            estadoActual === 'online' ? 'bg-green-500 animate-pulse' :
            estadoActual === 'reciente' ? 'bg-orange-500' : 'bg-gray-500'
          }`} />
        </div>

      {/* Info principal - sobre la foto */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5">
        <h3 className="text-xs sm:text-sm font-bold text-white truncate">
          {tarjeta.nombre || 'Usuario'}
          {tarjeta.edad && <span className="font-normal text-gray-300">, {tarjeta.edad}</span>}
        </h3>
        <div className="flex items-center gap-1 mt-0.5">
          <RolBadge rol={tarjeta.rol} />
        </div>
      </div>
      </div>

      {/* Info compacta */}
      <div className="p-1.5 space-y-1.5">
        {/* Stats inline */}
        <div className="flex items-center justify-between text-[9px] text-gray-400">
          <div className="flex items-center gap-0.5">
            <Heart className={`w-2.5 h-2.5 ${likesCount > 0 ? 'text-pink-500' : ''}`} />
            <span>{likesCount}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            <span>{tarjeta.visitasRecibidas || 0}</span>
          </div>
          {!esMiTarjeta && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMensaje}
              className="p-1 rounded-full bg-gray-700/50 text-gray-300"
              aria-label="Chat"
              title="Chat"
            >
              <MessageSquare className="w-2.5 h-2.5" />
            </motion.button>
          )}
        </div>

        {/* Acción primaria */}
        {!esMiTarjeta && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLike}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all
              ${liked
                ? 'bg-pink-500 text-white'
                : 'bg-gray-700/60 text-gray-200'
              }`}
          >
            <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Te interesa' : 'Me interesa'}
          </motion.button>
        )}

        {esMiTarjeta && (
          <button
            onClick={() => {
              if (interactionLocked) {
                onLockedAction?.('editar');
                return;
              }
              handleClick();
            }}
            className="w-full py-1 rounded-md text-[10px] font-medium bg-cyan-500/20 text-cyan-400"
          >
            Editar
          </button>
        )}
      </div>

      {/* Notificación */}
      {esMiTarjeta && tarjeta.actividadNoLeida > 0 && (
        <div className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-3.5 flex items-center justify-center rounded-full px-1">
          {tarjeta.actividadNoLeida > 9 ? '9+' : tarjeta.actividadNoLeida}
        </div>
      )}
    </motion.div>
  );
};

export default TarjetaUsuario;
