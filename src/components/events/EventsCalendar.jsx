import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { getWeeklySchedule, getNextEvent, getCurrentEvent, getTimeUntilNextEvent } from '@/config/scheduledEvents';

/**
 * COMPONENTE: EventsCalendar
 *
 * Muestra eventos programados de una sala específica
 * - Vista semanal completa
 * - Próximo evento destacado
 * - Evento actual (si está sucediendo ahora)
 *
 * Props:
 * - roomSlug: ID de la sala (conversas-libres, gaming, mas-30, santiago)
 * - compact: Modo compacto para sidebar (default: false)
 */
const EventsCalendar = ({ roomSlug, compact = false }) => {
  const weeklyEvents = getWeeklySchedule(roomSlug);
  const nextEvent = getNextEvent(roomSlug);
  const currentEvent = getCurrentEvent(roomSlug);
  const timeUntilNext = getTimeUntilNextEvent(roomSlug);

  // Si no hay eventos configurados para esta sala
  if (weeklyEvents.length === 0) {
    return null;
  }

  // Modo compacto: Solo próximo evento
  if (compact) {
    if (!nextEvent) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800"
      >
        <div className="flex items-start gap-2">
          <div className="text-2xl">{nextEvent.emoji}</div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
              {nextEvent.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {timeUntilNext}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Modo completo: Calendario semanal
  return (
    <div className="space-y-4">
      {/* Evento actual (si está sucediendo AHORA) */}
      {currentEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-10"></div>
          <Card className="border-2 border-purple-500 dark:border-purple-600">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="text-3xl">{currentEvent.emoji}</div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentEvent.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-red-500 text-white animate-pulse">
                        🔴 EN VIVO
                      </Badge>
                      <span className="text-xs text-gray-500">Únete ahora!</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentEvent.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Próximo evento */}
      {nextEvent && !currentEvent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Próximo Evento
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{nextEvent.emoji}</div>
                <div className="flex-1">
                  <CardTitle className="text-base mb-1">{nextEvent.title}</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="font-semibold">{timeUntilNext}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextEvent.description}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Calendario semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Eventos de la Semana</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {weeklyEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                event.id === nextEvent?.id
                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="text-2xl flex-shrink-0">{event.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                    {event.title}
                  </h4>
                  {event.id === nextEvent?.id && (
                    <Badge className="bg-purple-500 text-white text-xs flex-shrink-0">
                      Próximo
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{event.dayName} {event.time}hs</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {event.description}
                </p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Info adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              ¿Por qué eventos programados?
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Los eventos crean hábitos. Sabes cuándo conectarte para encontrar gente con tus mismos intereses.
              ¡Marca tu calendario! 📅
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsCalendar;
