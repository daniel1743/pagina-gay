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
 * Registra un evento de analytics
 * OPTIMIZADO: Solo actualiza agregaciones diarias, NO guarda eventos individuales
 * Esto reduce escrituras de Firestore en ~50%
 * @param {string} eventType - Tipo de evento (page_view, user_register, user_login, etc.)
 * @param {object} eventData - Datos adicionales del evento
 */
export const trackEvent = async (eventType, eventData = {}) => {
  try {
    const timestamp = new Date();
    const dateKey = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD

    // OPTIMIZACIÓN: Solo actualizar agregaciones diarias, NO guardar eventos individuales
    // Esto reduce escrituras de Firestore significativamente
    const statsRef = doc(db, 'analytics_stats', dateKey);
    
    const updates = {
      date: dateKey,
      lastUpdated: serverTimestamp(),
    };

    // Incrementar contadores según el tipo de evento
    switch (eventType) {
      case 'page_view':
        updates.pageViews = increment(1);
        // Guardar página más visitada (solo para análisis de salidas)
        if (eventData.pagePath) {
          updates.lastPagePath = eventData.pagePath;
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
        // Guardar página de salida para análisis
        if (eventData.pagePath) {
          updates.lastExitPage = eventData.pagePath;
        }
        break;
    }

    // Actualizar estadísticas diarias (merge para no sobrescribir)
    await setDoc(statsRef, updates, { merge: true });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
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
 */
export const trackMessageSent = async (roomId) => {
  await trackEvent('message_sent', {
    roomId,
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
 * @returns {function} Función para desuscribirse
 */
export const subscribeToTodayStats = (callback) => {
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
  });
};

