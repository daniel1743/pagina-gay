/**
 * Servicio de Push Notifications (FCM)
 *
 * Solicita permisos, obtiene token FCM, guarda en Firestore
 * y maneja notificaciones en primer plano.
 */

import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
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
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          pushEnabled: false,
          pushPermission: permission,
          pushUpdatedAt: serverTimestamp(),
        }).catch(() => {});
      }
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

    if (auth.currentUser) {
      // Guardar token en Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const payload = {
        pushEnabled: permission === 'granted',
        pushPermission: permission,
        pushEnabledAt: serverTimestamp(),
        pushUpdatedAt: serverTimestamp(),
      };

      if (token) {
        payload.fcmTokens = arrayUnion(token);
      }

      await updateDoc(userRef, payload);
      if (token) {
        console.log('[PUSH] Token FCM guardado en Firestore');
      }
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

/**
 * Verifica soporte de App Badge API (icono de la app en SO)
 */
export const supportsAppBadge = () => {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.setAppBadge === 'function' || typeof navigator.clearAppBadge === 'function';
};

/**
 * Actualiza el contador del icono de app (PWA/desktop compatible)
 * Retorna false si no hay soporte o falla silenciosamente.
 */
export const updateAppBadge = async (count = 0) => {
  try {
    if (!supportsAppBadge()) return false;
    const safeCount = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;
    if (safeCount > 0 && typeof navigator.setAppBadge === 'function') {
      await navigator.setAppBadge(safeCount);
      return true;
    }
    if (typeof navigator.clearAppBadge === 'function') {
      await navigator.clearAppBadge();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[PUSH] No se pudo actualizar app badge:', error?.message || error);
    return false;
  }
};
