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
const PUSH_ACTIVATION_NOTICE_SESSION_KEY = 'chactivo:push_activation_notice_shown';
const PUSH_UPDATE_NOTICE_SESSION_KEY = 'chactivo:push_update_notice_shown';
const PUSH_INTERESTS_STORAGE_PREFIX = 'chactivo:push_interests:';

const DEFAULT_PUSH_INTERESTS = Object.freeze({
  more_people_connected: true,
  more_room_activity: true,
  direct_messages: true,
  profile_views: true,
  opin_comments: true,
  baul_card_views: true,
});

const getPushInterestsStorageKey = (userId = 'anon') => `${PUSH_INTERESTS_STORAGE_PREFIX}${userId || 'anon'}`;

const normalizePushInterests = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    more_people_connected: source.more_people_connected !== false,
    more_room_activity: source.more_room_activity !== false,
    direct_messages: source.direct_messages !== false,
    profile_views: source.profile_views !== false,
    opin_comments: source.opin_comments !== false,
    baul_card_views: source.baul_card_views !== false,
  };
};

const showLocalNotification = async ({ title, body, url = '/chat/principal', tag = 'chactivo-push' }) => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    data: { url },
    renotify: true,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }

    const notification = new Notification(title, options);
    notification.onclick = () => {
      try {
        window.focus?.();
        window.location.assign(url);
      } catch (_) {
        // noop
      }
    };
    return true;
  } catch (error) {
    console.warn('[PUSH] No se pudo mostrar notificacion local:', error?.message || error);
    return false;
  }
};

const maybeShowPushActivationNotices = async () => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(PUSH_ACTIVATION_NOTICE_SESSION_KEY) === '1') return;

  sessionStorage.setItem(PUSH_ACTIVATION_NOTICE_SESSION_KEY, '1');

  await showLocalNotification({
    title: 'Notificaciones activadas',
    body: 'Te avisaremos cuando te escriban o te inviten a chat privado.',
    tag: 'push-enabled',
    url: '/chat/principal',
  });

  if (sessionStorage.getItem(PUSH_UPDATE_NOTICE_SESSION_KEY) === '1') return;
  sessionStorage.setItem(PUSH_UPDATE_NOTICE_SESSION_KEY, '1');

  setTimeout(() => {
    showLocalNotification({
      title: 'Actualizacion de avisos lista',
      body: 'Tambien recibiras avisos cuando interactuen con tu OPIN.',
      tag: 'push-update-ready',
      url: '/opin',
    }).catch(() => {});
  }, 1200);
};

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

    await maybeShowPushActivationNotices();

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

export const getDefaultPushInterests = () => ({ ...DEFAULT_PUSH_INTERESTS });

export const getPushInterestPreferences = (userId = null) => {
  if (typeof window === 'undefined') return getDefaultPushInterests();

  const directKey = getPushInterestsStorageKey(userId || 'anon');
  const fallbackKey = getPushInterestsStorageKey('anon');
  const candidates = userId ? [directKey, fallbackKey] : [fallbackKey];

  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      return normalizePushInterests(parsed);
    } catch (_) {
      // noop
    }
  }

  return getDefaultPushInterests();
};

export const savePushInterestPreferences = async (preferences, userId = null) => {
  const normalized = normalizePushInterests(preferences);
  const storageKey = getPushInterestsStorageKey(userId || 'anon');

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('chactivo:push-interest-preferences-updated', {
        detail: { userId: userId || null, preferences: normalized },
      }));
    } catch (_) {
      // noop
    }
  }

  const authUserId = auth?.currentUser?.uid || null;
  const targetUserId = userId || authUserId;
  if (!targetUserId || authUserId !== targetUserId) {
    return normalized;
  }

  try {
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      pushInterestPreferences: normalized,
      pushInterestPreferencesUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[PUSH] No se pudieron guardar preferencias push en Firestore:', error?.message || error);
  }

  return normalized;
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
