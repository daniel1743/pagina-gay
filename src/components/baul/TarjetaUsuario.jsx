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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        bg-gradient-to-br from-gray-800/90 to-gray-900/90
        border border-gray-700/50 hover:border-gray-600/50
        shadow-lg hover:shadow-xl transition-all duration-300
        ${esMiTarjeta ? 'ring-2 ring-cyan-500/50' : ''}
      `}
    >
      {/* Badge "Tu tarjeta" */}
      {esMiTarjeta && (
        <div className="absolute top-2 left-2 z-20 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Tu tarjeta
        </div>
      )}

      {/* Foto / Avatar */}
      <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-700 to-gray-800">
        {tarjeta.fotoUrl ? (
          <img
            src={tarjeta.fotoUrl}
            alt={tarjeta.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="w-20 h-20 text-gray-600" />
          </div>
        )}

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Estado online - esquina superior derecha */}
        <div className="absolute top-3 right-3">
          <EstadoIndicador estado={tarjeta.estado || 'offline'} />
        </div>

        {/* Distancia - esquina superior izquierda */}
        {tarjeta.distanciaTexto && !esMiTarjeta && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white">
            <MapPin className="w-3 h-3" />
            <span>{tarjeta.distanciaTexto}</span>
          </div>
        )}

        {/* Info principal - parte inferior de la foto */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Nombre y edad */}
          <h3 className="text-xl font-bold text-white truncate">
            {tarjeta.nombre || 'Usuario'}
            {tarjeta.edad && <span className="font-normal">, {tarjeta.edad}</span>}
          </h3>

          {/* Rol + Medidas */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <RolBadge rol={tarjeta.rol} />
            {infoFisica.length > 0 && (
              <span className="text-sm text-gray-300">
                {infoFisica.join(' · ')}
              </span>
            )}
          </div>

          {/* Etnia + Ubicación */}
          {(tarjeta.etnia || tarjeta.ubicacionTexto) && (
            <p className="text-sm text-gray-400 mt-1 truncate">
              {[tarjeta.etnia, tarjeta.ubicacionTexto].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Info adicional - debajo de la foto */}
      <div className="p-4 space-y-3">
        {/* Bio */}
        {tarjeta.bio && (
          <p className="text-sm text-gray-300 line-clamp-2">
            "{tarjeta.bio}"
          </p>
        )}

        {/* Horarios de conexión */}
        {tarjeta.horariosConexion && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatearHorarios(tarjeta.horariosConexion)}</span>
          </div>
        )}

        {/* Stats: likes y visitas */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Heart className={`w-3.5 h-3.5 ${likesCount > 0 ? 'text-pink-500' : ''}`} />
            <span>{likesCount} likes</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{tarjeta.visitasRecibidas || 0} visitas</span>
          </div>
        </div>

        {/* Botones de acción */}
        {!esMiTarjeta && (
          <div className="flex gap-2 pt-2">
            {/* Botón Like */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              disabled={isLoading}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                font-medium transition-all duration-200
                ${liked
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-pink-500/20 hover:text-pink-400'
                }
              `}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{liked ? 'Te gusta' : 'Like'}</span>
            </motion.button>

            {/* Botón Mensaje */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleMensaje}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                bg-gray-700/50 text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-400
                font-medium transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Mensaje</span>
            </motion.button>
          </div>
        )}

        {/* Botón editar (solo mi tarjeta) */}
        {esMiTarjeta && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30
              font-medium transition-all duration-200"
          >
            <span>Editar mi tarjeta</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Indicador de actividad no leída */}
      {esMiTarjeta && tarjeta.actividadNoLeida > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
          {tarjeta.actividadNoLeida > 99 ? '99+' : tarjeta.actividadNoLeida}
        </div>
      )}
    </motion.div>
  );
};

export default TarjetaUsuario;
