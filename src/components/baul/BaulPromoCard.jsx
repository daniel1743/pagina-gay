/**
 * 🎯 BANNER PROMOCIONAL DEL BAÚL
 * Se muestra en el chat/lobby para invitar a explorar las tarjetas
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Obtener conteo de usuarios online/recientes
 */
const obtenerConteoUsuarios = async () => {
  try {
    const tarjetasRef = collection(db, 'tarjetas');

    // Usuarios online
    const qOnline = query(tarjetasRef, where('estaOnline', '==', true));
    const snapshotOnline = await getDocs(qOnline);
    const online = snapshotOnline.size;

    // Usuarios recientes (últimas 2 horas)
    const dosHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const qRecientes = query(
      tarjetasRef,
      where('ultimaConexion', '>=', dosHorasAtras),
      limit(50)
    );
    const snapshotRecientes = await getDocs(qRecientes);
    const recientes = snapshotRecientes.size;

    return { online, recientes: Math.max(recientes, online) };
  } catch (error) {
    console.error('[BAUL PROMO] Error obteniendo conteo:', error);
    return { online: 0, recientes: 0 };
  }
};

/**
 * Versión compacta (para sidebar o lista)
 */
export const BaulPromoCompact = ({ onClick }) => {
  const [conteo, setConteo] = useState({ online: 0, recientes: 0 });

  useEffect(() => {
    obtenerConteoUsuarios().then(setConteo);

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      obtenerConteoUsuarios().then(setConteo);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
    >
      <div className="p-2 rounded-lg bg-purple-500/30">
        <Users className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-white">Baúl de Perfiles</p>
        <p className="text-xs text-gray-400">
          {conteo.online > 0 ? `${conteo.online} online` : 'Explorar tarjetas'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </motion.button>
  );
};

/**
 * Versión banner (para mostrar en chat)
 */
export const BaulPromoBanner = ({ onClick, className = '' }) => {
  const [conteo, setConteo] = useState({ online: 0, recientes: 0 });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    obtenerConteoUsuarios().then(setConteo);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-cyan-600/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Contenido */}
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                Baúl de Perfiles
                {conteo.online > 0 && (
                  <span className="text-xs bg-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
                    {conteo.online} online
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-300">
                Descubre quién está cerca de ti
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium hover:bg-white/30 transition-colors"
          >
            <span>Explorar</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Stats rápidos */}
        {conteo.recientes > 0 && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{conteo.online} conectados</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{conteo.recientes} cerca de ti</span>
            </div>
          </div>
        )}
      </div>

      {/* Botón cerrar */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <span className="sr-only">Cerrar</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

/**
 * Versión tarjeta flotante (para mostrar sobre el chat)
 */
const BaulPromoCard = ({ onClick, onClose }) => {
  const [conteo, setConteo] = useState({ online: 0, recientes: 0 });

  useEffect(() => {
    obtenerConteoUsuarios().then(setConteo);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-4 z-40 max-w-xs"
    >
      <div className="relative bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Gradiente superior */}
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex-shrink-0">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white">
                {conteo.online > 0
                  ? `${conteo.online} personas cerca`
                  : 'Descubre quién está cerca'
                }
              </h4>
              <p className="text-sm text-gray-400 mt-0.5">
                Explora el baúl de perfiles y conecta
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-gray-700/50 text-gray-400 hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Ahora no
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
            >
              Ver perfiles
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BaulPromoCard;
