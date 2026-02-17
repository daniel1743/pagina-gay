/**
 * 📅 BANNER DE EVENTO EN CHAT
 * Muestra evento activo (EN VIVO) o próximo (countdown) arriba del chat
 * Se actualiza en tiempo real via Firestore listener
 * Incluye botón "Recordarme" y modal de detalles
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, ChevronRight, X, Users, Bell, BellRing, Calendar, Timer } from 'lucide-react';
import { suscribirseAEventos, unirseAEvento } from '@/services/eventosService';
import { isEventoActivo, isEventoProgramado, formatCountdown, formatFechaEvento, toMs } from '@/utils/eventosUtils';
import { setEventReminder, removeEventReminder, hasEventReminder } from '@/utils/eventReminderUtils';

const PRE_EVENT_WINDOW_MS = 5 * 60 * 1000; // 5 minutos antes del inicio

export default function EventoBanner({ currentRoomId, onEventoActivoConRecordatorio }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [dismissedEventIds, setDismissedEventIds] = useState(new Set());
  const [reminded, setReminded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const countdownRef = useRef(null);
  const dismissedStorageKey = user?.id ? `evento_banner_dismissed_${user.id}` : 'evento_banner_dismissed_guest';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dismissedStorageKey);
      if (!raw) {
        setDismissedEventIds(new Set());
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setDismissedEventIds(new Set(parsed.filter(Boolean)));
      } else {
        setDismissedEventIds(new Set());
      }
    } catch {
      setDismissedEventIds(new Set());
    }
  }, [dismissedStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(dismissedEventIds)));
    } catch {}
  }, [dismissedEventIds, dismissedStorageKey]);

  // Suscripción real-time a eventos
  useEffect(() => {
    const unsub = suscribirseAEventos((eventosData) => {
      setEventos(eventosData);
    });
    return () => unsub();
  }, []);

  // Encontrar el evento más relevante: activo > próximo más cercano
  const eventoActivo = eventos.find(e => isEventoActivo(e));
  const eventoProgramado = eventos.find(e => isEventoProgramado(e));
  const msHastaEventoProgramado = eventoProgramado
    ? toMs(eventoProgramado.fechaInicio) - Date.now()
    : null;
  const mostrarEventoProgramado = !!eventoProgramado &&
    msHastaEventoProgramado > 0 &&
    msHastaEventoProgramado <= PRE_EVENT_WINDOW_MS;
  const evento = eventoActivo || (mostrarEventoProgramado ? eventoProgramado : null);

  // Sincronizar estado de recordatorio con localStorage
  useEffect(() => {
    if (evento) {
      setReminded(hasEventReminder(evento.roomId));
    }
  }, [evento?.id]);

  // Notificar al padre cuando hay un evento activo con recordatorio
  useEffect(() => {
    if (eventoActivo && hasEventReminder(eventoActivo.roomId)) {
      onEventoActivoConRecordatorio?.(eventoActivo);
    } else {
      onEventoActivoConRecordatorio?.(null);
    }
  }, [eventoActivo?.id]);

  // Countdown timer para evento programado
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (eventoProgramado && !eventoActivo) {
      const updateCountdown = () => {
        const cd = formatCountdown(eventoProgramado.fechaInicio);
        setCountdown(cd || '');
      };
      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [eventoProgramado, eventoActivo]);

  // No mostrar si no hay evento, si fue cerrado para este evento, o si ya estamos en la sala del evento
  if (!evento) return null;
  if (dismissedEventIds.has(evento.id)) return null;
  if (currentRoomId === evento.roomId) return null;

  const esActivo = isEventoActivo(evento);

  const handleEntrar = () => {
    setShowDetails(false);
    navigate(`/chat/${evento.roomId}`);
  };

  const handleRecordarme = () => {
    if (!evento) return;

    if (reminded) {
      removeEventReminder(evento.roomId);
      setReminded(false);
    } else {
      setEventReminder(evento.roomId);
      setReminded(true);
      if (user?.id) {
        unirseAEvento(evento.id, user).catch(() => {});
      }
    }
  };

  // Formatear hora de inicio y fin
  const horaInicio = evento.fechaInicio
    ? new Date(toMs(evento.fechaInicio)).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : '';
  const horaFin = evento.fechaFin
    ? new Date(toMs(evento.fechaFin)).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {/* Banner principal */}
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

            {/* Info — clickeable para ver detalles */}
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wide ${
                  esActivo ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {esActivo ? 'EN VIVO' : 'Próximo'}
                </span>
                {evento.asistentesCount > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <Users className="w-2.5 h-2.5" />
                    {evento.asistentesCount > 10 ? '10+' : evento.asistentesCount}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white truncate">{evento.nombre}</p>
              {!esActivo && countdown && (
                <p className="text-[11px] text-gray-400">Comienza en {countdown}</p>
              )}
            </button>

            {/* Botones */}
            {esActivo ? (
              <button
                onClick={handleEntrar}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Entrar
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handleRecordarme}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  reminded
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-blue-500/80 hover:bg-blue-500 text-white'
                }`}
              >
                {reminded ? (
                  <>
                    <BellRing className="w-3 h-3" />
                    Recordado
                  </>
                ) : (
                  <>
                    <Bell className="w-3 h-3" />
                    Recordarme
                  </>
                )}
              </button>
            )}

            {/* Cerrar */}
            <button
              onClick={() => {
                setDismissedEventIds((prev) => {
                  const next = new Set(prev);
                  if (evento?.id) next.add(evento.id);
                  return next;
                });
              }}
              className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal de detalles del evento */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header con gradiente */}
              <div className={`px-5 pt-5 pb-4 ${
                esActivo
                  ? 'bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent'
                  : 'bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-3">
                    {esActivo ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                        <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-red-400 uppercase">EN VIVO</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-[11px] font-bold text-blue-400 uppercase">Próximo</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-lg font-bold text-white leading-tight">{evento.nombre}</h2>
              </div>

              {/* Contenido */}
              <div className="px-5 pb-5 space-y-4">
                {/* Descripción */}
                {evento.descripcion && (
                  <p className="text-sm text-gray-300 leading-relaxed mt-3">{evento.descripcion}</p>
                )}

                {/* Info cards */}
                <div className="space-y-2 mt-3">
                  {/* Fecha y hora */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60">
                    <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{formatFechaEvento(evento.fechaInicio)}</p>
                      <p className="text-xs text-gray-400">{horaInicio} — {horaFin} ({evento.duracionMinutos}min)</p>
                    </div>
                  </div>

                  {/* Countdown o En Vivo */}
                  {esActivo ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <Radio className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
                      <p className="text-sm font-medium text-red-300">El evento está en curso ahora</p>
                    </div>
                  ) : countdown && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60">
                      <Timer className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white">Comienza en {countdown}</p>
                      </div>
                    </div>
                  )}

                  {/* Asistentes */}
                  {evento.asistentesCount > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/60">
                      <Users className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <p className="text-sm text-white">
                        <span className="font-medium">
                          {evento.asistentesCount > 10 ? '10+' : evento.asistentesCount}
                        </span>
                        <span className="text-gray-400"> usuarios participarán</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón principal */}
                {esActivo ? (
                  <button
                    onClick={handleEntrar}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold transition-colors"
                  >
                    Entrar al evento
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleRecordarme();
                      if (!reminded) setShowDetails(false);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                      reminded
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-blue-500/80 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {reminded ? (
                      <>
                        <BellRing className="w-4 h-4" />
                        Recordatorio activado
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        Recordarme este evento
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
