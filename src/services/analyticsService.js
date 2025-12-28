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
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Analytics en tiempo real
 * Trackea eventos de usuarios, visualizaciones, interacciones, etc.
 */

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

    // Incrementar contadores según el tipo de evento
    switch (eventType) {
      case 'page_view':
        updates.pageViews = increment(1);
        if (eventData.pagePath) {
          updates.lastPagePath = eventData.pagePath;
        }
        // Guardar timeOnPage si está disponible
        if (eventData.timeOnPage !== undefined) {
          // Agregar a array de tiempos para análisis posterior
          const timeBucket = getTimeBucket(eventData.timeOnPage);
          updates[`timeDistribution.${timeBucket}`] = increment(1);
        }
        // Guardar fuente de tráfico (UTM)
        if (eventData.source) {
          updates[`trafficSources.${eventData.source}`] = increment(1);
        }
        break;
      case 'user_register':
        updates.registrations = increment(1);
        break;
      case 'user_login':
        updates.logins = increment(1);
        break;
      case 'message_sent':
        updates.messagesSent = increment(1);
        break;
      case 'room_created':
        updates.roomsCreated = increment(1);
        break;
      case 'room_joined':
        updates.roomsJoined = increment(1);
        break;
      case 'page_exit':
        updates.pageExits = increment(1);
        if (eventData.pagePath) {
          updates.lastExitPage = eventData.pagePath;
        }
        if (eventData.timeOnPage !== undefined) {
          const timeBucket = getTimeBucket(eventData.timeOnPage);
          updates[`exitTimeDistribution.${timeBucket}`] = increment(1);
        }
        break;
    }

    // Actualizar estadísticas diarias (merge para no sobrescribir)
    await setDoc(statsRef, updates, { merge: true }).catch(err => {
      if (err.code !== 'permission-denied') {
        console.error('Error tracking event:', err);
      }
    });

    // NUEVO: Guardar eventos individuales SOLO para análisis de usuarios únicos
    // Solo guardamos eventos clave (login, register, message_sent) para reducir escrituras
    if (['user_login', 'user_register', 'message_sent'].includes(eventType) && eventData.userId) {
      const eventRef = doc(collection(db, 'analytics_events'), `${dateKey}_${eventType}_${eventData.userId}_${Date.now()}`);
      await setDoc(eventRef, {
        type: eventType,
        userId: eventData.userId,
        date: dateKey,
        timestamp: serverTimestamp(),
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

/**
 * Trackea una visualización de página
 * @param {string} pagePath - Ruta de la página
 * @param {string} pageTitle - Título de la página
 */
export const trackPageView = async (pagePath, pageTitle) => {
  await trackEvent('page_view', {
    pagePath,
    pageTitle,
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
export const trackPageExit = async (pagePath, timeSpent = 0) => {
  await trackEvent('page_exit', {
    pagePath,
    timeSpent,
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
        // Contar salidas por página (usando lastExitPage como aproximación)
        if (data.lastExitPage) {
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
      return {
        timeDistribution: data.timeDistribution || {},
        exitTimeDistribution: data.exitTimeDistribution || {},
      };
    }

    return {
      timeDistribution: {},
      exitTimeDistribution: {},
    };
  } catch (error) {
    console.error('Error getting time distribution:', error);
    return {
      timeDistribution: {},
      exitTimeDistribution: {},
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
      return data.trafficSources || {};
    }

    return {};
  } catch (error) {
    console.error('Error getting traffic sources:', error);
    return {};
  }
};

/**
 * 🆕 Obtiene usuarios conectados en tiempo real (últimos 5 minutos)
 * @returns {Promise<number>} Número de usuarios activos
 */
export const getActiveUsersNow = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Query en la colección de presencia de usuarios
    const presenceRef = collection(db, 'presence');
    const q = query(
      presenceRef,
      where('lastActive', '>=', fiveMinutesAgo)
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
export const subscribeToActiveUsers = (callback) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const presenceRef = collection(db, 'presence');
  const q = query(
    presenceRef,
    where('lastActive', '>=', fiveMinutesAgo)
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
export const downloadCSV = (csvContent, filename = 'analytics-chactivo.csv') => {
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

