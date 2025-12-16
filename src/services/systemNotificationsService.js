import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Servicio de Notificaciones del Sistema
 * Maneja notificaciones generales: bienvenida, actualizaciones, noticias, difusiones
 */

/**
 * Tipos de notificaciones del sistema
 */
export const NOTIFICATION_TYPES = {
  WELCOME: 'welcome',           // Bienvenida a nuevos usuarios
  UPDATE: 'update',             // Actualización de la plataforma
  NEWS: 'news',                 // Noticias importantes
  BROADCAST: 'broadcast',       // Difusión general a todos los usuarios
  ANNOUNCEMENT: 'announcement', // Anuncio importante
  FEATURE: 'feature',           // Nueva funcionalidad
  MAINTENANCE: 'maintenance',   // Mantenimiento programado
};

/**
 * Crea una notificación del sistema para un usuario específico
 * @param {string} userId - ID del usuario destinatario
 * @param {object} notificationData - Datos de la notificación
 * @returns {Promise<string>} ID de la notificación creada
 */
export const createSystemNotification = async (userId, notificationData) => {
  try {
    const notificationsRef = collection(db, 'systemNotifications');

    const notification = {
      userId: userId,
      type: notificationData.type || NOTIFICATION_TYPES.ANNOUNCEMENT,
      title: notificationData.title,
      message: notificationData.message,
      icon: notificationData.icon || '📢',
      link: notificationData.link || null, // URL a la que redirige al hacer clic
      read: false,
      createdAt: serverTimestamp(),
      expiresAt: notificationData.expiresAt || null, // Opcional: fecha de expiración
      priority: notificationData.priority || 'normal', // low, normal, high, urgent
      createdBy: notificationData.createdBy || 'system', // ID del admin o 'system'
    };

    const docRef = await addDoc(notificationsRef, notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Crea una notificación de bienvenida para un nuevo usuario
 * @param {string} userId - ID del usuario
 * @param {string} username - Nombre del usuario
 */
export const createWelcomeNotification = async (userId, username) => {
  try {
    await createSystemNotification(userId, {
      type: NOTIFICATION_TYPES.WELCOME,
      title: `¡Bienvenido/a, ${username}! 🎉`,
      message: 'Gracias por unirte a Chactivo. Explora nuestras salas de chat, conoce gente nueva y disfruta de una experiencia segura y divertida. ¡No olvides verificar tu perfil!',
      icon: '🌈',
      link: '/profile',
      priority: 'high',
    });
  } catch (error) {
    console.error('Error creating welcome notification:', error);
  }
};

/**
 * Crea una difusión (broadcast) a todos los usuarios
 * @param {object} broadcastData - Datos de la difusión
 * @param {string} adminId - ID del admin que crea la difusión
 * @returns {Promise<number>} Número de notificaciones creadas
 */
export const createBroadcastNotification = async (broadcastData, adminId) => {
  try {
    // Obtener todos los usuarios (máximo 500 por batch)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(query(usersRef, limit(500)));

    let count = 0;
    const promises = [];

    usersSnapshot.forEach((userDoc) => {
      const promise = createSystemNotification(userDoc.id, {
        type: NOTIFICATION_TYPES.BROADCAST,
        title: broadcastData.title,
        message: broadcastData.message,
        icon: broadcastData.icon || '📢',
        link: broadcastData.link || null,
        priority: broadcastData.priority || 'normal',
        createdBy: adminId,
      });
      promises.push(promise);
      count++;
    });

    await Promise.all(promises);
    return count;
  } catch (error) {
    console.error('Error creating broadcast notification:', error);
    throw error;
  }
};

/**
 * Obtiene las notificaciones del sistema de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limitCount - Límite de notificaciones a obtener
 * @returns {Promise<Array>} Lista de notificaciones
 */
export const getUserSystemNotifications = async (userId, limitCount = 50) => {
  try {
    const notificationsRef = collection(db, 'systemNotifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
};

/**
 * Suscribirse a notificaciones del sistema en tiempo real
 * @param {string} userId - ID del usuario
 * @param {function} callback - Función callback que recibe las notificaciones
 * @returns {function} Función para cancelar la suscripción
 */
export const subscribeToSystemNotifications = (userId, callback) => {
  try {
    const notificationsRef = collection(db, 'systemNotifications');
    // Intentar query con orderBy primero
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let fallbackUnsubscribe = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      callback(notifications);
    }, (error) => {
      // Si falla por falta de índice, usar query simplificada
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Index missing for notifications, using fallback query');
        const fallbackQ = query(
          notificationsRef,
          where('userId', '==', userId),
          limit(50)
        );
        
        fallbackUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
          const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          }));
          
          // Ordenar en memoria
          notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          callback(notifications);
        }, (fallbackError) => {
          console.error('Error in notifications subscription (fallback):', fallbackError);
          callback([]);
        });
      } else {
        console.error('Error in notifications subscription:', error);
        callback([]);
      }
    });

    // Retornar función que desuscribe tanto la query principal como el fallback
    return () => {
      if (unsubscribe) unsubscribe();
      if (fallbackUnsubscribe) fallbackUnsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    // Retornar callback vacío para evitar errores
    callback([]);
    return () => {};
  }
};

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'systemNotifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {string} userId - ID del usuario
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'systemNotifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);

    const promises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

/**
 * Obtiene el contador de notificaciones no leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Número de notificaciones no leídas
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const notificationsRef = collection(db, 'systemNotifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Solicitar permisos de notificaciones push del navegador
 * @returns {Promise<boolean>} True si se otorgaron los permisos
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones push');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Mostrar notificación push del navegador
 * @param {string} title - Título de la notificación
 * @param {object} options - Opciones de la notificación
 */
export const showBrowserNotification = (title, options = {}) => {
  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/ico-viral.png',
        badge: '/ico-viral.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    }
  } catch (error) {
    console.error('Error showing browser notification:', error);
  }
};
