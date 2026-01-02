/**
 * SISTEMA DE EVENTOS PROGRAMADOS
 *
 * ✅ Eventos semanales recurrentes por sala
 * ✅ Crea hábito en usuarios (vuelven a horarios específicos)
 * ✅ Concentra usuarios en vez de dispersarlos 24/7
 * ✅ Genera contenido compartible
 *
 * Implementado: 2025-12-25
 * Propósito: Solución ética al cold start problem
 */

/**
 * Eventos semanales por sala
 * Formato de horarios: 24h formato Chile (UTC-3)
 */
export const SCHEDULED_EVENTS = {
  // ⚠️ SALA GLOBAL - DESACTIVADA (reemplazada por 'principal')
  // 'global': [
  //   {
  //     id: 'conversas_lunes_cine',
  //     day: 1, // Lunes (0=domingo, 1=lunes, etc)
  //     time: '20:00',
  //     title: '🎬 Lunes de Películas LGBT+',
  //     description: '¿Qué estás viendo? Comparte series y películas LGBT+ que te gusten',
  //     emoji: '🎬',
  //     color: 'purple',
  //     moderator: 'bot_alejandro' // Bot que modera el evento
  //   },
  //   {
  //     id: 'conversas_miercoles_confesiones',
  //     day: 3, // Miércoles
  //     time: '21:00',
  //     title: '💭 Miércoles de Confesiones',
  //     description: 'Espacio seguro para compartir experiencias, dudas y consejos',
  //     emoji: '💭',
  //     color: 'pink',
  //     moderator: 'bot_mateo'
  //   },
  //   {
  //     id: 'conversas_viernes_social',
  //     day: 5, // Viernes
  //     time: '21:00',
  //     title: '🍻 Viernes Social',
  //     description: 'Cuenta tu semana, organiza juntadas, encuentra planes para el fin de semana',
  //     emoji: '🍻',
  //     color: 'blue',
  //     moderator: 'bot_carlos'
  //   },
  //   {
  //     id: 'conversas_domingo_chill',
  //     day: 0, // Domingo
  //     time: '19:00',
  //     title: '☕ Domingo Chill',
  //     description: 'Conversación tranquila para cerrar la semana y preparar la nueva',
  //     emoji: '☕',
  //     color: 'green',
  //     moderator: 'bot_miguel'
  //   }
  // ],

  'gaming': [
    {
      id: 'gaming_martes_estrategia',
      day: 2, // Martes
      time: '20:00',
      title: '🎯 Martes de Estrategia',
      description: 'Comparte tips, estrategias y forma equipos para ranked',
      emoji: '🎯',
      color: 'purple',
      moderator: 'bot_javier'
    },
    {
      id: 'gaming_viernes_streams',
      day: 5, // Viernes
      time: '22:00',
      title: '📺 Viernes de Streams',
      description: 'Comparte tus clips, streams y mejores jugadas de la semana',
      emoji: '📺',
      color: 'pink',
      moderator: 'bot_javier'
    },
    {
      id: 'gaming_sabado_marathon',
      day: 6, // Sábado
      time: '15:00',
      title: '🎮 Gaming Marathon',
      description: 'Sesión larga de gaming. Trae tu juego favorito y comparte la experiencia',
      emoji: '🎮',
      color: 'blue',
      moderator: 'bot_javier'
    }
  ],

  'mas-30': [
    {
      id: 'mas30_miercoles_experiencias',
      day: 3, // Miércoles
      time: '20:00',
      title: '💬 Miércoles de Experiencias',
      description: 'Comparte tu sabiduría: relaciones, carrera, vida como gay +30',
      emoji: '💬',
      color: 'purple',
      moderator: 'bot_alejandro'
    },
    {
      id: 'mas30_viernes_planes',
      day: 5, // Viernes
      time: '20:30',
      title: '🍷 Viernes de Cultura',
      description: 'Recomienda libros, vinos, lugares, eventos culturales LGBT+',
      emoji: '🍷',
      color: 'pink',
      moderator: 'bot_fernando'
    },
    {
      id: 'mas30_domingo_bienestar',
      day: 0, // Domingo
      time: '18:00',
      title: '🧘 Domingo de Bienestar',
      description: 'Salud mental, autocuidado, fitness. Comparte tu rutina',
      emoji: '🧘',
      color: 'green',
      moderator: 'bot_miguel'
    }
  ],

  'santiago': [
    {
      id: 'santiago_jueves_eventos',
      day: 4, // Jueves
      time: '19:00',
      title: '🎉 Jueves de Eventos',
      description: 'Organiza juntadas, comparte eventos LGBT+ de la semana en Stgo',
      emoji: '🎉',
      color: 'purple',
      moderator: 'bot_carlos'
    },
    {
      id: 'santiago_viernes_noche',
      day: 5, // Viernes
      time: '22:30',
      title: '🌃 Viernes de Noche',
      description: '¿Dónde salen? Recomienda bares, clubs, fiestas LGBT+ en Santiago',
      emoji: '🌃',
      color: 'pink',
      moderator: 'bot_david'
    },
    {
      id: 'santiago_sabado_explore',
      day: 6, // Sábado
      time: '14:00',
      title: '🗺️ Sábado Explorando Stgo',
      description: 'Recomienda lugares, cafés, parques LGBT-friendly en la capital',
      emoji: '🗺️',
      color: 'blue',
      moderator: 'bot_fernando'
    }
  ]
};

/**
 * Obtiene eventos de una sala específica
 */
export const getRoomEvents = (roomSlug) => {
  return SCHEDULED_EVENTS[roomSlug] || [];
};

/**
 * Obtiene el próximo evento de una sala
 * @param {string} roomSlug - ID de la sala
 * @param {Date} now - Fecha actual (para testing)
 * @returns {Object|null} Próximo evento o null si no hay
 */
export const getNextEvent = (roomSlug, now = new Date()) => {
  const events = getRoomEvents(roomSlug);
  if (events.length === 0) return null;

  const currentDay = now.getDay(); // 0-6
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche

  // Convertir tiempo del evento a minutos
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Encontrar eventos futuros esta semana
  const futureEventsThisWeek = events
    .filter(event => {
      if (event.day > currentDay) return true;
      if (event.day === currentDay) {
        return parseTime(event.time) > currentTime;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return parseTime(a.time) - parseTime(b.time);
    });

  if (futureEventsThisWeek.length > 0) {
    return futureEventsThisWeek[0];
  }

  // Si no hay eventos futuros esta semana, retornar el primer evento de la próxima semana
  const sortedEvents = [...events].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return parseTime(a.time) - parseTime(b.time);
  });

  return sortedEvents[0];
};

/**
 * Verifica si hay un evento activo AHORA
 * @param {string} roomSlug - ID de la sala
 * @param {Date} now - Fecha actual
 * @param {number} windowMinutes - Ventana de tiempo del evento (default: 120 min = 2 horas)
 * @returns {Object|null} Evento activo o null
 */
export const getCurrentEvent = (roomSlug, now = new Date(), windowMinutes = 120) => {
  const events = getRoomEvents(roomSlug);
  if (events.length === 0) return null;

  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Buscar evento que está sucediendo ahora
  const activeEvent = events.find(event => {
    if (event.day !== currentDay) return false;

    const eventTime = parseTime(event.time);
    const timeDiff = currentTime - eventTime;

    // Evento está activo si estamos dentro de la ventana de tiempo
    return timeDiff >= 0 && timeDiff <= windowMinutes;
  });

  return activeEvent || null;
};

/**
 * Formatea el tiempo relativo hasta el próximo evento
 * @param {string} roomSlug - ID de la sala
 * @returns {string} Texto como "En 2 días" o "Hoy a las 20:00"
 */
export const getTimeUntilNextEvent = (roomSlug) => {
  const nextEvent = getNextEvent(roomSlug);
  if (!nextEvent) return null;

  const now = new Date();
  const currentDay = now.getDay();
  const daysUntil = nextEvent.day >= currentDay
    ? nextEvent.day - currentDay
    : 7 - currentDay + nextEvent.day;

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (daysUntil === 0) {
    return `Hoy a las ${nextEvent.time}`;
  } else if (daysUntil === 1) {
    return `Mañana a las ${nextEvent.time}`;
  } else {
    return `${dayNames[nextEvent.day]} a las ${nextEvent.time}`;
  }
};

/**
 * Obtiene todos los eventos de la semana para una sala (para mostrar en calendario)
 */
export const getWeeklySchedule = (roomSlug) => {
  const events = getRoomEvents(roomSlug);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return events
    .sort((a, b) => a.day - b.day)
    .map(event => ({
      ...event,
      dayName: dayNames[event.day],
      fullTime: `${dayNames[event.day]} ${event.time}hs`
    }));
};
