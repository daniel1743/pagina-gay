/**
 * 🎯 BANNER PROMOCIONAL - Baúl + OPIN
 * Empuja a los usuarios a completar su tarjeta y descubrir OPIN
 * Aparece en el chat principal para usuarios registrados
 *
 * Estrategia:
 * - Si tarjeta incompleta → empujar a completarla (con vistas/likes como gancho)
 * - Si tarjeta completa → empujar a OPIN
 * - Se alterna entre ambos mensajes
 * - Desaparece si el usuario lo cierra (vuelve en la próxima sesión)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Eye, Heart, Sparkles, ArrowRight, Camera, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerTarjeta } from '@/services/tarjetaService';

// Campos que indican una tarjeta "completa"
const CAMPOS_REQUERIDOS = ['nombre', 'rol', 'bio'];
const CAMPOS_DESEADOS = ['fotoUrl', 'edad', 'ubicacionTexto'];

function esTarjetaIncompleta(tarjeta) {
  if (!tarjeta) return true;

  // Sin foto es siempre incompleta
  if (!tarjeta.fotoUrl) return true;

  // Verificar campos requeridos
  const camposFaltantes = CAMPOS_REQUERIDOS.filter(c => !tarjeta[c]);
  return camposFaltantes.length > 0;
}

function calcularPorcentaje(tarjeta) {
  if (!tarjeta) return 0;
  const todos = [...CAMPOS_REQUERIDOS, ...CAMPOS_DESEADOS];
  const completados = todos.filter(c => {
    if (c === 'fotoUrl') return !!tarjeta.fotoUrl;
    return !!tarjeta[c];
  });
  return Math.round((completados.length / todos.length) * 100);
}

function obtenerMensajeFaltante(tarjeta) {
  if (!tarjeta) return { icono: User, texto: 'Tu tarjeta no tiene datos', accion: 'Completar tarjeta' };
  if (!tarjeta.fotoUrl) return { icono: Camera, texto: 'Sin foto nadie te verá', accion: 'Subir foto' };
  if (!tarjeta.rol) return { icono: Heart, texto: 'Indica tu rol para recibir más likes', accion: 'Agregar rol' };
  if (!tarjeta.bio) return { icono: User, texto: 'Agrega una descripción para destacar', accion: 'Escribir bio' };
  if (!tarjeta.edad) return { icono: User, texto: 'Tu edad ayuda a conectar mejor', accion: 'Agregar edad' };
  return null;
}

const TarjetaPromoBanner = ({ onOpenBaul, onOpenOpin }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [tarjeta, setTarjeta] = useState(null);
  const [modo, setModo] = useState('baul'); // 'baul' o 'opin'
  const [cargado, setCargado] = useState(false);

  // Solo para usuarios registrados (no invitados)
  const esRegistrado = user && !user.isGuest && !user.isAnonymous;

  useEffect(() => {
    if (!esRegistrado) return;

    // Verificar si ya fue cerrado en esta sesión
    const cerradoEn = sessionStorage.getItem('promoBannerCerrado');
    if (cerradoEn) return;

    // Cargar tarjeta del usuario
    const cargar = async () => {
      try {
        const miTarjeta = await obtenerTarjeta(user.id);
        setTarjeta(miTarjeta);
        setCargado(true);

        // Si tarjeta incompleta → mostrar promo baúl
        // Si tarjeta completa → mostrar promo OPIN
        if (miTarjeta && !esTarjetaIncompleta(miTarjeta)) {
          setModo('opin');
        } else {
          setModo('baul');
        }

        // Mostrar después de un delay natural (30 segundos)
        setTimeout(() => {
          setVisible(true);
        }, 30000);
      } catch (err) {
        console.warn('[PROMO] Error cargando tarjeta:', err.message);
      }
    };

    cargar();
  }, [user, esRegistrado]);

  const handleCerrar = () => {
    setVisible(false);
    sessionStorage.setItem('promoBannerCerrado', Date.now().toString());
  };

  const handleAccion = () => {
    let handled = false;
    if (modo === 'baul') {
      handled = onOpenBaul ? onOpenBaul() === true : false;
      if (!handled) navigate('/baul');
    } else {
      handled = onOpenOpin ? onOpenOpin() === true : false;
      if (!handled) navigate('/opin');
    }
    handleCerrar();
  };

  if (!visible || !cargado || !esRegistrado) return null;

  // Usar métricas reales
  const vistas = tarjeta?.visitasRecibidas || 0;
  const likes = tarjeta?.likesRecibidos || 0;
  const porcentaje = calcularPorcentaje(tarjeta);
  const faltante = tarjeta ? obtenerMensajeFaltante(tarjeta) : null;

  return (
    <AnimatePresence>
      {modo === 'baul' && esTarjetaIncompleta(tarjeta) ? (
        /* ============= BANNER BAÚL (tarjeta incompleta) ============= */
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mx-3 mt-2"
        >
          <div className="relative bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-500/30 rounded-xl p-3 backdrop-blur-sm">
            {/* Cerrar */}
            <button
              onClick={handleCerrar}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Contenido */}
            <div className="flex items-center gap-3 pr-6">
              {/* Stats */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 bg-black/20 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-cyan-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-sm font-bold">{vistas}</span>
                </div>
                {likes > 0 && (
                  <div className="flex items-center gap-1 text-pink-400">
                    <Heart className="w-3 h-3" />
                    <span className="text-xs font-bold">{likes}</span>
                  </div>
                )}
              </div>

              {/* Mensaje */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-tight">
                  {vistas > 0
                    ? `${vistas} personas vieron tu tarjeta`
                    : 'Aún no hay vistas en tu tarjeta'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {faltante?.texto || 'Complétala para recibir más likes'}
                </p>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAccion}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-semibold hover:bg-cyan-600 transition-colors"
              >
                Completar
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>

            {/* Barra de progreso */}
            <div className="mt-2 h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${porcentaje}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Perfil {porcentaje}% completo</p>
          </div>
        </motion.div>
      ) : (
        /* ============= BANNER OPIN (tarjeta completa) ============= */
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mx-3 mt-2"
        >
          <div className="relative bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 rounded-xl p-3 backdrop-blur-sm">
            {/* Cerrar */}
            <button
              onClick={handleCerrar}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Contenido */}
            <div className="flex items-center gap-3 pr-6">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium leading-tight">
                  Publica en OPIN lo que buscas
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Otros usuarios descubren tu perfil y te envían mensaje
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAccion}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Ir a OPIN
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TarjetaPromoBanner;
