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
const DEFAULT_EVENT_DURATION_MINUTES = 30;
const PRINCIPAL_EVENT_INTERVAL_HOURS = 3;
const PRINCIPAL_EVENT_THEME_ROTATION = [
  {
    title: '⚡ Ronda Express',
    description: 'Media hora para decir quién está, qué busca y enganchar rápido.',
    emoji: '⚡',
    color: 'purple',
  },
  {
    title: '📍 Ronda de Zonas',
    description: 'Ideal para decir de dónde eres y encontrar gente cerca.',
    emoji: '📍',
    color: 'blue',
  },
  {
    title: '🔥 Ronda Hot',
    description: 'Ventana breve para quienes buscan conversación más caliente.',
    emoji: '🔥',
    color: 'pink',
  },
  {
    title: '💬 Ronda de Chat',
    description: 'Para quienes quieren hablar sin tanta vuelta y ver quién responde.',
    emoji: '💬',
    color: 'green',
  },
];

const buildPrincipalRollingEvents = () => {
  const events = [];

  for (let day = 0; day < 7; day += 1) {
    for (let hour = 0; hour < 24; hour += PRINCIPAL_EVENT_INTERVAL_HOURS) {
      const themeIndex = ((day * 24) + hour) / PRINCIPAL_EVENT_INTERVAL_HOURS % PRINCIPAL_EVENT_THEME_ROTATION.length;
      const theme = PRINCIPAL_EVENT_THEME_ROTATION[themeIndex];
      const time = `${String(hour).padStart(2, '0')}:00`;

      events.push({
        id: `principal_${day}_${String(hour).padStart(2, '0')}`,
        day,
        time,
        title: theme.title,
        description: theme.description,
        emoji: theme.emoji,
        color: theme.color,
        moderator: 'sistema',
      });
    }
  }

  return events;
};

export const SCHEDULED_EVENTS = {
  'principal': buildPrincipalRollingEvents(),

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

const parseTimeToParts = (timeStr = '00:00') => {
  const [hours, minutes] = String(timeStr).split(':').map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
};

const buildDateForEventDayAndTime = (event, now = new Date(), forceNext = false) => {
  if (!event) return null;
  const { hours, minutes } = parseTimeToParts(event.time);
  const currentDay = now.getDay();
  let daysUntil = event.day >= currentDay ? event.day - currentDay : 7 - currentDay + event.day;

  if (!forceNext && daysUntil === 0) {
    const eventMinutes = hours * 60 + minutes;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    // Si la hora ya pasó hoy, la próxima ocurrencia es la próxima semana.
    if (eventMinutes <= nowMinutes) {
      daysUntil = 7;
    }
  }

  if (forceNext) {
    daysUntil += 7;
  }

  const date = new Date(now);
  date.setSeconds(0, 0);
  date.setDate(now.getDate() + daysUntil);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Crea un "evento virtual" listo para UI del banner/calendario sin necesidad de Firestore.
 * Se usa como fallback cuando no hay eventos creados por admin.
 */
const buildVirtualEventOccurrence = (roomSlug, event, startDate, durationMinutes = DEFAULT_EVENT_DURATION_MINUTES) => {
  if (!event || !startDate) return null;
  const startMs = startDate.getTime();
  const endMs = startMs + (durationMinutes * 60 * 1000);
  return {
    id: `auto_${event.id}_${startMs}`,
    nombre: event.title,
    descripcion: event.description,
    roomId: roomSlug,
    fechaInicio: startMs,
    fechaFin: endMs,
    duracionMinutos: durationMinutes,
    asistentesCount: 0,
    activo: true,
    estado: 'programado',
    isAutoScheduled: true,
    baseEventId: event.id,
    emoji: event.emoji,
    color: event.color,
  };
};

export const getCurrentScheduledEventOccurrence = (
  roomSlug,
  now = new Date(),
  windowMinutes = DEFAULT_EVENT_DURATION_MINUTES
) => {
  const current = getCurrentEvent(roomSlug, now, windowMinutes);
  if (!current) return null;
  const startDate = new Date(now);
  const { hours, minutes } = parseTimeToParts(current.time);
  startDate.setHours(hours, minutes, 0, 0);
  return buildVirtualEventOccurrence(roomSlug, current, startDate, windowMinutes);
};

export const getNextScheduledEventOccurrence = (
  roomSlug,
  now = new Date(),
  durationMinutes = DEFAULT_EVENT_DURATION_MINUTES
) => {
  const next = getNextEvent(roomSlug, now);
  if (!next) return null;
  const startDate = buildDateForEventDayAndTime(next, now);
  return buildVirtualEventOccurrence(roomSlug, next, startDate, durationMinutes);
};

/**
 * Verifica si hay un evento activo AHORA
 * @param {string} roomSlug - ID de la sala
 * @param {Date} now - Fecha actual
 * @param {number} windowMinutes - Ventana de tiempo del evento (default: 30 min)
 * @returns {Object|null} Evento activo o null
 */
export const getCurrentEvent = (
  roomSlug,
  now = new Date(),
  windowMinutes = DEFAULT_EVENT_DURATION_MINUTES
) => {
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
    .sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.time.localeCompare(b.time);
    })
    .map(event => ({
      ...event,
      dayName: dayNames[event.day],
      fullTime: `${dayNames[event.day]} ${event.time}hs`
    }));
};
