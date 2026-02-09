/**
 * 📋 COMPONENTE TARJETA DE USUARIO
 * Tarjeta visual para el Baúl de Perfiles
 *
 * Muestra: foto, nombre, edad, rol, medidas, estado, likes, etc.
 * Acciones: like, mensaje, ver perfil completo
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageSquare,
  MapPin,
  Clock,
  User,
  Eye,
  Ruler,
  ChevronRight
} from 'lucide-react';
import { getColorRol, getEmojiEstado, formatearHorarios } from '@/services/tarjetaService';

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
  isLoading = false
}) => {
  const [liked, setLiked] = useState(yaLeDiLike);
  const [likesCount, setLikesCount] = useState(tarjeta.likesRecibidos || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (esMiTarjeta || isLoading) return;

    // Optimistic update
    const nuevoEstado = !liked;
    setLiked(nuevoEstado);
    setLikesCount(prev => nuevoEstado ? prev + 1 : prev - 1);

    // Llamar al handler
    if (onLike) {
      const exito = await onLike(tarjeta.odIdUsuari, nuevoEstado);
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
    onMensaje?.(tarjeta);
  };

  const handleClick = () => {
    onVerPerfil?.(tarjeta);
  };

  // Formatear info física
  const infoFisica = [];
  if (tarjeta.pesaje) infoFisica.push(`${tarjeta.pesaje}cm`);
  if (tarjeta.alturaCm) infoFisica.push(`${tarjeta.alturaCm / 100}m`);

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
      `}
    >
      {/* Badge "Tu" */}
      {esMiTarjeta && (
        <div className="absolute top-1.5 left-1.5 z-20 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          Tú
        </div>
      )}

      {/* Foto / Avatar - MÁS COMPACTO (fallback: fotoUrlFull, fotoUrlThumb) */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-700 to-gray-800">
        {(tarjeta.fotoUrl || tarjeta.fotoUrlFull || tarjeta.fotoUrlThumb) ? (
          <img
            src={tarjeta.fotoUrl || tarjeta.fotoUrlFull || tarjeta.fotoUrlThumb}
            alt={tarjeta.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-10 h-10 text-gray-600" />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Estado - punto pequeño */}
        <div className="absolute top-1.5 right-1.5">
          <div className={`w-2 h-2 rounded-full ${
            tarjeta.estado === 'online' ? 'bg-green-500 animate-pulse' :
            tarjeta.estado === 'reciente' ? 'bg-orange-500' : 'bg-gray-500'
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
            {tarjeta.ubicacionTexto && (
              <span className="text-[9px] text-gray-400 truncate">{tarjeta.ubicacionTexto}</span>
            )}
          </div>
        </div>
      </div>

      {/* Info compacta */}
      <div className="p-1.5 space-y-1">
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
          {infoFisica.length > 0 && (
            <span className="text-gray-500">{infoFisica[0]}</span>
          )}
        </div>

        {/* Botones compactos */}
        {!esMiTarjeta && (
          <div className="flex gap-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium transition-all
                ${liked
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-700/50 text-gray-300'
                }`}
            >
              <Heart className={`w-2.5 h-2.5 ${liked ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMensaje}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-medium bg-gray-700/50 text-gray-300"
            >
              <MessageSquare className="w-2.5 h-2.5" />
            </motion.button>
          </div>
        )}

        {esMiTarjeta && (
          <button
            onClick={handleClick}
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
