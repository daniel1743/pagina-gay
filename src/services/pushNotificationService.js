/**
 * Servicio de Push Notifications (FCM)
 *
 * Solicita permisos, obtiene token FCM, guarda en Firestore
 * y maneja notificaciones en primer plano.
 */

import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Solicita permiso de notificaciones y obtiene token FCM
 * Guarda el token en el documento del usuario en Firestore
 * @returns {Promise<string|null>} FCM token o null
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('[PUSH] Notificaciones no soportadas en este navegador');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[PUSH] Permiso de notificaciones denegado');
      return null;
    }

    // Importar messaging dinámicamente (puede no estar disponible)
    const { messaging } = await import('@/config/firebase');
    if (!messaging) {
      console.log('[PUSH] FCM Messaging no disponible');
      return null;
    }

    if (!VAPID_KEY) {
      console.warn('[PUSH] VAPID_KEY no configurada. Agrega VITE_FIREBASE_VAPID_KEY en .env');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token && auth.currentUser) {
      // Guardar token en Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
      });
      console.log('[PUSH] Token FCM guardado en Firestore');
    }

    return token;
  } catch (error) {
    console.error('[PUSH] Error obteniendo permiso/token:', error);
    return null;
  }
};

/**
 * Configura listener para notificaciones en primer plano
 * @param {Function} callback - Funcion a llamar con el payload de la notificacion
 * @returns {Function} Funcion para desuscribirse
 */
export const setupForegroundMessages = (callback) => {
  try {
    // Importar messaging sincrono (ya deberia estar inicializado)
    const messagingModule = import('@/config/firebase');
    return messagingModule.then(({ messaging }) => {
      if (!messaging) return () => {};
      return onMessage(messaging, (payload) => {
        console.log('[PUSH] Mensaje en primer plano:', payload);
        if (callback) callback(payload);
      });
    });
  } catch (error) {
    console.error('[PUSH] Error configurando mensajes en primer plano:', error);
    return () => {};
  }
};

/**
 * Verifica si las notificaciones push estan habilitadas
 */
export const isPushEnabled = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Verifica si se puede pedir permiso (no ha sido denegado)
 */
export const canRequestPush = () => {
  return 'Notification' in window && Notification.permission === 'default';
};
