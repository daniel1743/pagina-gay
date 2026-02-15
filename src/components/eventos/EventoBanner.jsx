/**
 * 📅 BANNER DE EVENTO EN CHAT
 * Muestra evento activo (EN VIVO) o próximo (countdown) arriba del chat
 * Se actualiza en tiempo real via Firestore listener
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, ChevronRight, X, Users } from 'lucide-react';
import { suscribirseAEventos } from '@/services/eventosService';
import { isEventoActivo, isEventoProgramado, formatCountdown, toMs } from '@/utils/eventosUtils';

export default function EventoBanner({ currentRoomId }) {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const countdownRef = useRef(null);

  // Suscripción real-time a eventos
  useEffect(() => {
    const unsub = suscribirseAEventos((eventosData) => {
      setEventos(eventosData);
      setDismissed(false); // Mostrar de nuevo si hay evento nuevo
    });
    return () => unsub();
  }, []);

  // Encontrar el evento más relevante: activo > próximo más cercano
  const eventoActivo = eventos.find(e => isEventoActivo(e));
  const eventoProgramado = eventos.find(e => isEventoProgramado(e));
  const evento = eventoActivo || eventoProgramado;

  // Countdown timer para evento programado
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (eventoProgramado && !eventoActivo) {
      const updateCountdown = () => {
        const cd = formatCountdown(eventoProgramado.fechaInicio);
        setCountdown(cd || '');
        // Si el countdown llegó a 0, el evento se volvió activo
        if (!cd) setDismissed(false);
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [eventoProgramado, eventoActivo]);

  // No mostrar si no hay evento, si fue cerrado, o si ya estamos en la sala del evento
  if (!evento || dismissed) return null;
  if (currentRoomId === evento.roomId) return null;

  const esActivo = isEventoActivo(evento);

  const handleEntrar = () => {
    navigate(`/chat/${evento.roomId}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative mx-2 mt-2 mb-1 rounded-xl border overflow-hidden ${
          esActivo
            ? 'bg-gradient-to-r from-red-500/15 via-orange-500/10 to-red-500/15 border-red-500/30'
            : 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Icono */}
          <div className={`flex-shrink-0 p-1.5 rounded-lg ${
            esActivo ? 'bg-red-500/20' : 'bg-blue-500/20'
          }`}>
            {esActivo ? (
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <Clock className="w-4 h-4 text-blue-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                esActivo ? 'text-red-400' : 'text-blue-400'
              }`}>
                {esActivo ? 'EN VIVO' : 'Próximo'}
              </span>
              {evento.asistentesCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                  <Users className="w-2.5 h-2.5" />
                  {evento.asistentesCount}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white truncate">{evento.nombre}</p>
            {!esActivo && countdown && (
              <p className="text-[11px] text-gray-400">Comienza en {countdown}</p>
            )}
          </div>

          {/* Botón */}
          {esActivo ? (
            <button
              onClick={handleEntrar}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              Entrar
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <span className="flex-shrink-0 text-xs text-blue-300 font-medium px-2">
              {countdown}
            </span>
          )}

          {/* Cerrar */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
