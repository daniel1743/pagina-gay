import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Validar variables de entorno críticas
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `❌ ERROR: Faltan variables de entorno de Firebase:\n${missingVars.join('\n')}\n\nPor favor, crea un archivo .env con estas variables.`;
  console.error(errorMessage);
  
  // En desarrollo, mostrar alerta
  if (import.meta.env.DEV) {
    alert(errorMessage);
  }
  
  throw new Error(`Variables de entorno de Firebase faltantes: ${missingVars.join(', ')}`);
}

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // Opcional
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
// ⚡ NOTA: Firestore usará configuración por defecto (modo online, sin persistence)
export const auth = getAuth(app);
export const db = (() => {
  try {
    // Configuración robusta para redes inestables/proxys/ISP con problemas QUIC/WebChannel.
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    });
  } catch (error) {
    // Si ya existe una instancia inicializada, reutilizar la instancia por defecto.
    return getFirestore(app);
  }
})();
export const storage = getStorage(app);

// FCM Messaging (condicional - no todos los navegadores lo soportan)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log('[FIREBASE] FCM Messaging habilitado');
  } else {
    console.log('[FIREBASE] FCM Messaging no soportado en este navegador');
  }
}).catch(() => {
  console.log('[FIREBASE] FCM Messaging no disponible');
});

// ⚡ DESHABILITADO: setPersistence estaba bloqueando onAuthStateChanged
// Firebase Auth usa persistence por defecto (browserLocalPersistence)
// Esto permite que onAuthStateChanged funcione correctamente
/*
setPersistence(auth, inMemoryPersistence)
  .then(() => {
    if (import.meta.env.DEV) console.log('✅ [FIREBASE] Auth en modo MEMORIA (sin IndexedDB)');
  })
  .catch((error) => {
    console.warn('⚠️ [FIREBASE] Error configurando persistence (no crítico):', error);
  });
*/

// ⚠️ OFFLINE PERSISTENCE DESHABILITADO TEMPORALMENTE
// Causa problemas de sincronización - mensajes no llegan entre dispositivos
// TODO: Re-habilitar cuando se arregle el bug de deduplicación

/*
if (!window.__firestorePersistenceEnabled) {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true,
    forceOwnership: false
  })
    .then(() => {
      window.__firestorePersistenceEnabled = true;
      if (import.meta.env.DEV) console.log('⚡ Firestore offline persistence ON');
    })
    .catch((err) => {
      if (import.meta.env.DEV) console.debug('ℹ️ Firestore persistence:', err.message);
    });
}
*/

if (import.meta.env.DEV) {
  console.log('ℹ️ Firestore en modo ONLINE (sin persistence) - mejor confiabilidad');
}

// ✅ CRÍTICO: Localhost debe conectarse a PRODUCCIÓN por defecto
// Solo usar emuladores si EXPLÍCITAMENTE se configura VITE_USE_FIREBASE_EMULATOR='true'
// y además estamos ejecutando en localhost.
const emulatorRequested = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isRuntimeLocalhost = runtimeHostname === 'localhost' || runtimeHostname === '127.0.0.1';
const usingEmulator = emulatorRequested && isRuntimeLocalhost;

if (emulatorRequested && !isRuntimeLocalhost) {
  console.warn('⚠️ [FIREBASE] VITE_USE_FIREBASE_EMULATOR=true ignorado fuera de localhost.');
  console.warn('⚠️ [FIREBASE] Se forzará conexión a PRODUCCIÓN para evitar auth/network-request-failed.');
}

if (usingEmulator) {
  console.warn('🔧 [FIREBASE] ⚠️⚠️⚠️ USANDO EMULADORES ⚠️⚠️⚠️');
  console.warn('⚠️ [FIREBASE] ATENCIÓN: Estás usando emuladores. Los mensajes NO llegarán a producción.');
  console.warn('⚠️ [FIREBASE] Para conectar a producción, asegúrate de que VITE_USE_FIREBASE_EMULATOR NO esté definido o sea "false"');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
} else {
  // ✅ PRODUCCIÓN: Localhost se conecta a Firebase producción
  console.log('✅ [FIREBASE] ========================================');
  console.log('✅ [FIREBASE] Localhost conectado a PRODUCCIÓN');
  console.log('✅ [FIREBASE] Project ID:', firebaseConfig.projectId);
  console.log('✅ [FIREBASE] Auth Domain:', firebaseConfig.authDomain);
  console.log('✅ [FIREBASE] Puedes probar localhost → producción');
  console.log('✅ [FIREBASE] ========================================');
  
  // ⚠️ VERIFICACIÓN: Asegurar que las variables de entorno están correctas
  if (import.meta.env.DEV) {
    if (!firebaseConfig.projectId || firebaseConfig.projectId === 'undefined') {
      console.error('❌ [FIREBASE] ERROR: projectId no está definido. Verifica .env');
    }
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
      console.error('❌ [FIREBASE] ERROR: apiKey no está definido. Verifica .env');
    }
  }
}

export default app;
