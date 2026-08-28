import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, isSupported } from 'firebase/messaging';

/**
 * Firebase queda como compatibilidad histórica. La ausencia de sus variables
 * no debe impedir que la interfaz, las landings ni Supabase-first arranquen.
 * Las escrituras nuevas no deben usar este módulo como fallback.
 */
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingVars.length === 0;

const firebaseConfig = isFirebaseConfigured
  ? {
      apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
      authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
      storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  : null;

let app = null;
export let auth = null;
export let db = null;
export let storage = null;
export let functions = null;
export let messaging = null;

if (!isFirebaseConfigured) {
  console.warn(
    `[FIREBASE] Compatibilidad histórica deshabilitada: faltan ${missingVars.join(', ')}. ` +
    'La interfaz no se bloqueará; usa Supabase para las funciones nuevas.'
  );
} else {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Firestore histórico: sólo se inicializa cuando existe configuración completa.
  try {
    const forceLongPolling =
      import.meta.env.VITE_FIRESTORE_FORCE_LONG_POLLING === 'true' ||
      (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('force_long_polling') === '1');

    const firestoreSettings = forceLongPolling
      ? { experimentalForceLongPolling: true, useFetchStreams: false }
      : { experimentalAutoDetectLongPolling: true, useFetchStreams: false };

    if (import.meta.env.DEV) {
      console.log(`[FIREBASE] Firestore transport: ${forceLongPolling ? 'forceLongPolling' : 'autoDetectLongPolling'}`);
    }

    db = initializeFirestore(app, firestoreSettings);
  } catch (error) {
    // Si ya existe una instancia inicializada, reutilizarla.
    console.warn('[FIREBASE] Reutilizando Firestore histórico existente:', error?.message || error);
    db = getFirestore(app);
  }

  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');

  // FCM es opcional y se habilita sólo con Firebase configurado y soporte del navegador.
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('[FIREBASE] FCM Messaging habilitado');
    }
  }).catch(() => {
    console.log('[FIREBASE] FCM Messaging no disponible');
  });

  const emulatorRequested = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isRuntimeLocalhost = runtimeHostname === 'localhost' || runtimeHostname === '127.0.0.1';
  const usingEmulator = emulatorRequested && isRuntimeLocalhost;

  if (emulatorRequested && !isRuntimeLocalhost) {
    console.warn('[FIREBASE] VITE_USE_FIREBASE_EMULATOR=true ignorado fuera de localhost.');
  }

  if (usingEmulator) {
    console.warn('[FIREBASE] Usando emuladores por configuración explícita.');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } else if (import.meta.env.DEV) {
    console.log('[FIREBASE] Compatibilidad histórica configurada; no se habilitan escrituras nuevas desde aquí.');
  }
}

export default app;
