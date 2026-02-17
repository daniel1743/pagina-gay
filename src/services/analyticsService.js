import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  increment,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Analytics en tiempo real
 * Trackea eventos de usuarios, visualizaciones, interacciones, etc.
 */

const STORED_ANALYTICS_EVENT_TYPES = new Set([
  'user_login',
  'user_register',
  'message_sent',
  'landing_view',
  'entry_to_chat',
  'auth_page_view',
  'auth_submit',
  'auth_success',
  'chat_room_view',
  'first_message_sent',
]);

/**
 * Registra un evento de analytics con segmentación avanzada
 * OPTIMIZADO: Actualiza agregaciones diarias + guarda eventos clave para análisis de usuarios únicos
 * @param {string} eventType - Tipo de evento (page_view, user_register, user_login, etc.)
 * @param {object} eventData - Datos adicionales del evento (debe incluir userId cuando sea posible)
 */
export const trackEvent = async (eventType, eventData = {}) => {
  try {
    const timestamp = new Date();
    const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    const statsRef = doc(db, 'analytics_stats', dateKey);

    const updates = {
      date: dateKey,
      lastUpdated: serverTimestamp(),
    };

    let handled = false;

    const sanitizeFieldSegment = (value = 'unknown') =>
      String(value)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .slice(0, 80);

    const getPageKey = (path = '/') => sanitizeFieldSegment(path || '/');

    // Incrementar contadores según el tipo de evento
    switch (eventType) {
      case 'page_view':
        updates.pageViews = increment(1);
        if (eventData.pagePath) {
          updates.lastPagePath = eventData.pagePath;
          const pageKey = getPageKey(eventData.pagePath);
          updates[`pageViewsByPath.${pageKey}`] = increment(1);
          updates[`pagePathMap.${pageKey}`] = eventData.pagePath;
        }
        // Guardar timeOnPage si está disponible
        if (eventData.timeOnPage !== undefined) {
          // Agregar a array de tiempos para análisis posterior
          const timeBucket = getTimeBucket(eventData.timeOnPage);
          updates[`timeDistribution.${timeBucket}`] = increment(1);
        }
        // Guardar fuente de tráfico (UTM)
        if (eventData.source) {
          const sourceKey = sanitizeFieldSegment(eventData.source);
          updates[`trafficSources.${sourceKey}`] = increment(1);
        }
        handled = true;
        break;
      case 'user_register':
        updates.registrations = increment(1);
        handled = true;
        break;
      case 'user_login':
        updates.logins = increment(1);
        handled = true;
        break;
      case 'message_sent':
        updates.messagesSent = increment(1);
        handled = true;
        break;
      case 'room_created':
        updates.roomsCreated = increment(1);
        handled = true;
        break;
      case 'room_joined':
        updates.roomsJoined = increment(1);
        handled = true;
        break;
      case 'page_exit':
        updates.pageExits = increment(1);
        if (eventData.pagePath) {
          updates.lastExitPage = eventData.pagePath;
          const pageKey = getPageKey(eventData.pagePath);
          updates[`exitPagesByPath.${pageKey}`] = increment(1);
          updates[`pagePathMap.${pageKey}`] = eventData.pagePath;
        }
        if (eventData.timeOnPage !== undefined) {
          const timeBucket = getTimeBucket(eventData.timeOnPage);
          updates[`exitTimeDistribution.${timeBucket}`] = increment(1);
        }
        handled = true;
        break;
    }

    // ✅ Registrar eventos personalizados en agregación diaria
    if (!handled) {
      const safeType = sanitizeEventType(eventType);
      updates[`customEvents.${safeType}`] = increment(1);
    }

    // Actualizar estadísticas diarias (merge para no sobrescribir)
    await setDoc(statsRef, updates, { merge: true }).catch(err => {
      if (err.code !== 'permission-denied') {
        console.error('Error tracking event:', err);
      }
    });

    // Guardar eventos individuales para análisis de embudo/usuarios únicos
    if (STORED_ANALYTICS_EVENT_TYPES.has(eventType)) {
      const sanitizeIdPart = (value = '') => String(value).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const sessionPart = sanitizeIdPart(eventData.sessionId || 'nosession');
      const userPart = sanitizeIdPart(eventData.userId || 'nouser');
      const eventRef = doc(
        collection(db, 'analytics_events'),
        `${dateKey}_${eventType}_${sessionPart}_${userPart}_${Date.now()}`
      );

      const payload = {
        type: eventType,
        userId: eventData.userId || null,
        sessionId: eventData.sessionId || null,
        date: dateKey,
        timestamp: serverTimestamp(),
        pagePath: eventData.pagePath || null,
        roomId: eventData.roomId || null,
        roomName: eventData.roomName || null,
        mode: eventData.mode || null,
        source: eventData.source || null,
        medium: eventData.medium || null,
        campaign: eventData.campaign || null,
        isGuest: eventData.isGuest ?? null,
        isAnonymous: eventData.isAnonymous ?? null,
      };

      await setDoc(eventRef, {
        ...payload,
      }).catch(() => {}); // Silenciar errores, no es crítico
    }

  } catch (error) {
    if (error.code !== 'permission-denied') {
      console.error('Error tracking event:', error);
    }
  }
};

/**
 * Obtiene el bucket de tiempo para análisis de distribución
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} Bucket de tiempo
 */
const getTimeBucket = (seconds) => {
  if (seconds < 3) return '0-3s';
  if (seconds < 10) return '3-10s';
  if (seconds < 30) return '10-30s';
  if (seconds < 60) return '30-60s';
  if (seconds < 180) return '1-3m';
  if (seconds < 300) return '3-5m';
  return '5m+';
};

const sanitizeEventType = (eventType = '') => {
  return String(eventType)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 60);
};

/**
 * Trackea una visualización de página
 * @param {string} pagePath - Ruta de la página
 * @param {string} pageTitle - Título de la página
 */
export const trackPageView = async (pagePath, pageTitle, extraData = {}) => {
  await trackEvent('page_view', {
    pagePath,
    pageTitle,
    ...extraData,
  });
};

/**
 * Trackea el registro de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} method - Método de registro (email, google, etc.)
 */
export const trackUserRegister = async (userId, method = 'email') => {
  await trackEvent('user_register', {
    userId,
    method,
  });
};

/**
 * Trackea el login de un usuario
 * @param {string} userId - ID del usuario
 * @param {string} method - Método de login
 */
export const trackUserLogin = async (userId, method = 'email') => {
  await trackEvent('user_login', {
    userId,
    method,
  });
};

/**
 * Trackea el envío de un mensaje
 * @param {string} roomId - ID de la sala
 * @param {string} userId - ID del usuario (opcional para retrocompatibilidad)
 */
export const trackMessageSent = async (roomId, userId = null) => {
  await trackEvent('message_sent', {
    roomId,
    userId,
  });
};

/**
 * Trackea la creación de una sala
 * @param {string} roomId - ID de la sala
 */
export const trackRoomCreated = async (roomId) => {
  await trackEvent('room_created', {
    roomId,
  });
};

/**
 * Trackea la entrada a una sala
 * @param {string} roomId - ID de la sala
 */
export const trackRoomJoined = async (roomId) => {
  await trackEvent('room_joined', {
    roomId,
  });
};

/**
 * Trackea la salida de una página (abandono)
 * @param {string} pagePath - Ruta de la página
 * @param {number} timeSpent - Tiempo en segundos
 */
export const trackPageExit = async (pagePath, timeSpent = 0, extraData = {}) => {
  await trackEvent('page_exit', {
    pagePath,
    timeOnPage: timeSpent,
    ...extraData,
  });
};

/**
 * Obtiene estadísticas del día actual
 * @returns {Promise<object>} Estadísticas del día
 */
export const getTodayStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'analytics_stats', today);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return statsSnap.data();
    }

    return {
      date: today,
      pageViews: 0,
      registrations: 0,
      logins: 0,
      messagesSent: 0,
      roomsCreated: 0,
      roomsJoined: 0,
      pageExits: 0,
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return null;
  }
};

/**
 * Obtiene estadísticas de ayer para comparaciones
 * @returns {Promise<object>} Estadísticas de ayer
 */
export const getYesterdayStats = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const statsRef = doc(db, 'analytics_stats', yesterdayKey);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return statsSnap.data();
    }

    return {
      date: yesterdayKey,
      pageViews: 0,
      registrations: 0,
      logins: 0,
      messagesSent: 0,
      roomsCreated: 0,
      roomsJoined: 0,
      pageExits: 0,
    };
  } catch (error) {
    console.error('Error getting yesterday stats:', error);
    return null;
  }
};

/**
 * Calcula el porcentaje de cambio entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {number} Porcentaje de cambio
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Obtiene estadísticas de los últimos N días
 * OPTIMIZADO: Limita a máximo 30 días para evitar lecturas excesivas
 * @param {number} days - Número de días (máximo 30)
 * @returns {Promise<Array>} Array de estadísticas
 */
export const getStatsForDays = async (days = 7) => {
  try {
    // OPTIMIZACIÓN: Limitar a máximo 30 días
    const maxDays = Math.min(days, 30);
    const stats = [];
    const today = new Date();

    // OPTIMIZACIÓN: Usar Promise.all para leer en paralelo (más rápido)
    const promises = [];
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      promises.push(getDoc(doc(db, 'analytics_stats', dateKey)));
    }

    const snapshots = await Promise.all(promises);
    
    snapshots.forEach((snapshot, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - index);
      const dateKey = date.toISOString().split('T')[0];

      if (snapshot.exists()) {
        stats.push(snapshot.data());
      } else {
        stats.push({
          date: dateKey,
          pageViews: 0,
          registrations: 0,
          logins: 0,
          messagesSent: 0,
          roomsCreated: 0,
          roomsJoined: 0,
          pageExits: 0,
        });
      }
    });

    return stats.reverse(); // Más antiguo primero
  } catch (error) {
    console.error('Error getting stats for days:', error);
    return [];
  }
};

/**
 * Obtiene los eventos más comunes (qué usan más los usuarios)
 * OPTIMIZADO: Lee solo agregaciones diarias en lugar de todos los eventos
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de eventos más comunes
 */
export const getMostUsedFeatures = async (limit = 10) => {
  try {
    const today = new Date();
    const stats = [];
    
    // OPTIMIZACIÓN: Leer solo agregaciones diarias (7 documentos) en lugar de miles de eventos
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const statsRef = doc(db, 'analytics_stats', dateKey);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        stats.push(statsSnap.data());
      }
    }

    // Agregar contadores de todos los días
    const eventCounts = {
      page_view: 0,
      user_register: 0,
      user_login: 0,
      message_sent: 0,
      room_created: 0,
      room_joined: 0,
      page_exit: 0,
    };

    stats.forEach(dayStats => {
      if (dayStats.pageViews) eventCounts.page_view += dayStats.pageViews;
      if (dayStats.registrations) eventCounts.user_register += dayStats.registrations;
      if (dayStats.logins) eventCounts.user_login += dayStats.logins;
      if (dayStats.messagesSent) eventCounts.message_sent += dayStats.messagesSent;
      if (dayStats.roomsCreated) eventCounts.room_created += dayStats.roomsCreated;
      if (dayStats.roomsJoined) eventCounts.room_joined += dayStats.roomsJoined;
      if (dayStats.pageExits) eventCounts.page_exit += dayStats.pageExits;
    });

    // Convertir a array y ordenar
    const sortedEvents = Object.entries(eventCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedEvents;
  } catch (error) {
    console.error('Error getting most used features:', error);
    return [];
  }
};

/**
 * Obtiene las páginas donde más abandonan los usuarios
 * OPTIMIZADO: Usa agregaciones diarias en lugar de leer todos los eventos
 * NOTA: Esta función requiere que se guarde lastExitPage en analytics_stats
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de páginas con más abandonos
 */
export const getExitPages = async (limit = 10) => {
  try {
    const today = new Date();
    const exitPages = {};
    
    // OPTIMIZACIÓN: Leer solo agregaciones diarias (7 documentos)
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const statsRef = doc(db, 'analytics_stats', dateKey);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists()) {
        const data = statsSnap.data();
        // Nuevo formato preciso: contador por página
        if (data.exitPagesByPath && typeof data.exitPagesByPath === 'object') {
          const pathMap = data.pagePathMap || {};
          Object.entries(data.exitPagesByPath).forEach(([pageKey, count]) => {
            const pagePath = pathMap[pageKey] || pageKey;
            exitPages[pagePath] = (exitPages[pagePath] || 0) + (count || 0);
          });
        } else if (data.lastExitPage) {
          // Fallback legado: aproximación con lastExitPage
          exitPages[data.lastExitPage] = (exitPages[data.lastExitPage] || 0) + (data.pageExits || 0);
        }
      }
    }

    // Convertir a array y ordenar
    const sortedExits = Object.entries(exitPages)
      .map(([pagePath, count]) => ({ pagePath, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedExits;
  } catch (error) {
    console.error('Error getting exit pages:', error);
    return [];
  }
};

/**
 * Suscripción en tiempo real a estadísticas del día actual
 * @param {function} callback - Función callback que recibe las estadísticas
 * @param {function} errorCallback - Función callback opcional para manejar errores
 * @returns {function} Función para desuscribirse
 */
export const subscribeToTodayStats = (callback, errorCallback) => {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = doc(db, 'analytics_stats', today);

  return onSnapshot(statsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({
        date: today,
        pageViews: 0,
        registrations: 0,
        logins: 0,
        messagesSent: 0,
        roomsCreated: 0,
        roomsJoined: 0,
        pageExits: 0,
      });
    }
  }, (error) => {
    console.error('Error subscribing to today stats:', error);
    if (errorCallback) {
      errorCallback(error);
    } else {
      // Si no hay errorCallback, llamar al callback con valores por defecto
      callback({
        date: today,
        pageViews: 0,
        registrations: 0,
        logins: 0,
        messagesSent: 0,
        roomsCreated: 0,
        roomsJoined: 0,
        pageExits: 0,
      });
    }
  });
};

/**
 * 🆕 Obtiene usuarios únicos para cada tipo de evento del día actual
 * @returns {Promise<object>} Usuarios únicos por evento
 */
export const getUniqueUsersToday = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const eventsRef = collection(db, 'analytics_events');

    // Query para eventos de hoy
    const q = query(
      eventsRef,
      where('date', '==', today)
    );

    const snapshot = await getDocs(q);

    const uniqueUsers = {
      logins: new Set(),
      registrations: new Set(),
      messagesSent: new Set(),
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === 'user_login' && data.userId) {
        uniqueUsers.logins.add(data.userId);
      }
      if (data.type === 'user_register' && data.userId) {
        uniqueUsers.registrations.add(data.userId);
      }
      if (data.type === 'message_sent' && data.userId) {
        uniqueUsers.messagesSent.add(data.userId);
      }
    });

    return {
      uniqueLogins: uniqueUsers.logins.size,
      uniqueRegistrations: uniqueUsers.registrations.size,
      uniqueMessageSenders: uniqueUsers.messagesSent.size,
    };
  } catch (error) {
    console.error('Error getting unique users:', error);
    return {
      uniqueLogins: 0,
      uniqueRegistrations: 0,
      uniqueMessageSenders: 0,
    };
  }
};

/**
 * 🆕 Embudo de conversión por sesiones (últimos N días)
 * @param {number} days - Número de días a analizar
 * @returns {Promise<object>} Métricas del embudo
 */
export const getFunnelMetrics = async (days = 7) => {
  const dayCount = Math.min(Math.max(days, 1), 30);
  const today = new Date();
  const eventsRef = collection(db, 'analytics_events');

  const rawEventTypes = [
    'landing_view',
    'entry_to_chat',
    'auth_page_view',
    'auth_submit',
    'auth_success',
    'user_register',
    'user_login',
    'chat_room_view',
    'first_message_sent',
  ];

  const actorSets = {
    landing_view: new Set(),
    entry_to_chat: new Set(),
    auth_page_view: new Set(),
    auth_submit: new Set(),
    auth_success: new Set(),
    chat_room_view: new Set(),
    first_message_sent: new Set(),
  };

  const buildActorKey = (data, fallbackId) => {
    if (data.sessionId) return `sess:${data.sessionId}`;
    if (data.userId) return `user:${data.userId}`;
    return `evt:${fallbackId}`;
  };

  try {
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      let snapshot;
      try {
        const q = query(
          eventsRef,
          where('date', '==', dateKey),
          where('type', 'in', rawEventTypes)
        );
        snapshot = await getDocs(q);
      } catch {
        const qFallback = query(eventsRef, where('date', '==', dateKey));
        snapshot = await getDocs(qFallback);
      }

      snapshot.forEach((eventDoc) => {
        const data = eventDoc.data();
        if (!rawEventTypes.includes(data.type)) return;
        const actorKey = buildActorKey(data, eventDoc.id);

        if (data.type === 'user_register' || data.type === 'user_login' || data.type === 'auth_success') {
          actorSets.auth_success.add(actorKey);
        }

        if (actorSets[data.type]) {
          actorSets[data.type].add(actorKey);
        }
      });
    }

    const orderedSteps = [
      { key: 'landing_view', label: 'Landing vista' },
      { key: 'entry_to_chat', label: 'Entrada al chat' },
      { key: 'auth_page_view', label: 'Vista de auth' },
      { key: 'auth_submit', label: 'Submit auth' },
      { key: 'auth_success', label: 'Auth exitosa' },
      { key: 'chat_room_view', label: 'Vista de sala' },
      { key: 'first_message_sent', label: 'Primer mensaje' },
    ];

    const steps = orderedSteps.map((step, index) => {
      const count = actorSets[step.key].size;
      const previousCount = index > 0 ? actorSets[orderedSteps[index - 1].key].size : 0;
      const conversionFromPrev = index === 0
        ? 100
        : (previousCount > 0 ? (count / previousCount) * 100 : 0);

      return {
        ...step,
        count,
        conversionFromPrev,
      };
    });

    const first = steps[0]?.count || 0;
    const last = steps[steps.length - 1]?.count || 0;
    const overallConversion = first > 0 ? (last / first) * 100 : 0;

    return {
      days: dayCount,
      steps,
      overallConversion,
    };
  } catch (error) {
    console.error('Error getting funnel metrics:', error);
    return {
      days: dayCount,
      steps: [],
      overallConversion: 0,
    };
  }
};

/**
 * 🆕 Obtiene distribución de tiempo en sitio
 * @returns {Promise<object>} Distribución de tiempo
 */
export const getTimeDistribution = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'analytics_stats', today);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      const distribution = data.timeDistribution || {};

      // Calcular total de usuarios
      const totalUsers = Object.values(distribution).reduce((sum, count) => sum + count, 0);

      // Calcular tiempo promedio aproximado
      const bucketAverages = {
        '0-3s': 1.5,
        '3-10s': 6.5,
        '10-30s': 20,
        '30-60s': 45,
        '1-3m': 120,
        '3-5m': 240,
        '5m+': 360
      };

      let totalSeconds = 0;
      Object.entries(distribution).forEach(([bucket, count]) => {
        totalSeconds += (bucketAverages[bucket] || 0) * count;
      });

      const averageSeconds = totalUsers > 0 ? Math.round(totalSeconds / totalUsers) : 0;

      return {
        distribution,
        totalUsers,
        averageSeconds
      };
    }

    return {
      distribution: {},
      totalUsers: 0,
      averageSeconds: 0
    };
  } catch (error) {
    console.error('Error getting time distribution:', error);
    return {
      distribution: {},
      totalUsers: 0,
      averageSeconds: 0
    };
  }
};

/**
 * 🆕 Obtiene fuentes de tráfico del día
 * @returns {Promise<object>} Fuentes de tráfico
 */
export const getTrafficSources = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'analytics_stats', today);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      const sources = data.trafficSources || {};
      const campaigns = data.campaigns || {};

      // Calcular total de usuarios
      const totalUsers = Object.values(sources).reduce((sum, count) => sum + count, 0);

      return {
        sources,
        campaigns,
        totalUsers
      };
    }

    return {
      sources: {},
      campaigns: {},
      totalUsers: 0
    };
  } catch (error) {
    console.error('Error getting traffic sources:', error);
    return {
      sources: {},
      campaigns: {},
      totalUsers: 0
    };
  }
};

/**
 * 🆕 Obtiene usuarios conectados en tiempo real (últimos 5 minutos)
 * @returns {Promise<number>} Número de usuarios activos
 */
export const getActiveUsersNow = async (roomId = 'principal') => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Query en la colección de presencia de usuarios
    const presenceRef = collection(db, 'roomPresence', roomId, 'users');
    const q = query(
      presenceRef,
      where('lastSeen', '>=', Timestamp.fromDate(fiveMinutesAgo))
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting active users:', error);
    return 0;
  }
};

/**
 * 🆕 Suscripción en tiempo real a usuarios activos
 * @param {function} callback - Función callback que recibe el número de usuarios
 * @returns {function} Función para desuscribirse
 */
export const subscribeToActiveUsers = (callback, roomId = 'principal') => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const presenceRef = collection(db, 'roomPresence', roomId, 'users');
  const q = query(
    presenceRef,
    where('lastSeen', '>=', Timestamp.fromDate(fiveMinutesAgo))
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('Error subscribing to active users:', error);
    callback(0);
  });
};

/**
 * 🆕 Exporta datos de analytics a CSV
 * @param {Array} historicalStats - Datos históricos
 * @param {object} todayStats - Estadísticas de hoy
 * @returns {string} Datos en formato CSV
 */
export const exportToCSV = (historicalStats, todayStats) => {
  try {
    // Headers
    const headers = [
      'Fecha',
      'Visualizaciones',
      'Registros',
      'Logins',
      'Mensajes',
      'Salas Creadas',
      'Salas Unidas',
      'Salidas',
      'Tasa Conversión (%)'
    ].join(',');

    // Datos
    const rows = historicalStats.map(day => {
      const conversionRate = day.pageViews > 0
        ? ((day.registrations / day.pageViews) * 100).toFixed(2)
        : '0.00';

      return [
        day.date,
        day.pageViews || 0,
        day.registrations || 0,
        day.logins || 0,
        day.messagesSent || 0,
        day.roomsCreated || 0,
        day.roomsJoined || 0,
        day.pageExits || 0,
        conversionRate
      ].join(',');
    });

    // Agregar fila de hoy
    const todayConversionRate = todayStats.pageViews > 0
      ? ((todayStats.registrations / todayStats.pageViews) * 100).toFixed(2)
      : '0.00';

    const todayRow = [
      new Date().toISOString().split('T')[0] + ' (HOY)',
      todayStats.pageViews || 0,
      todayStats.registrations || 0,
      todayStats.logins || 0,
      todayStats.messagesSent || 0,
      todayStats.roomsCreated || 0,
      todayStats.roomsJoined || 0,
      todayStats.pageExits || 0,
      todayConversionRate
    ].join(',');

    return [headers, ...rows, todayRow].join('\n');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return '';
  }
};

/**
 * 🆕 Descarga archivo CSV
 * @param {string} csvContent - Contenido CSV
 * @param {string} filename - Nombre del archivo
 */
export const downloadCSV = (csvContent, filename) => {
  // Generar nombre con fecha si no se proporciona
  if (!filename) {
    const today = new Date().toISOString().split('T')[0];
    filename = `analytics_export_${today}.csv`;
  }
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
