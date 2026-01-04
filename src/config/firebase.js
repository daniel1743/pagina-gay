import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ CRÍTICO: Configurar persistencia LOCAL para prevenir pérdida de sesión
// Esto asegura que las sesiones anónimas sobrevivan a recargas y cierres de pestaña
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    if (import.meta.env.DEV) console.log('✅ [FIREBASE] Auth persistence configurada');
  })
  .catch((error) => {
    console.error('❌ [FIREBASE] Error configurando persistence:', error);
  });

// ⚡ VELOCIDAD MÁXIMA: Activar persistencia offline de Firestore
// Esto hace que Firestore funcione como WhatsApp - escribe local PRIMERO, sincroniza después
enableIndexedDbPersistence(db, {
  synchronizeTabs: true // Sincronizar entre pestañas
})
  .then(() => {
    if (import.meta.env.DEV) console.log('⚡ [FIRESTORE] Offline persistence ACTIVADA - Velocidad WhatsApp');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Múltiples pestañas abiertas, solo la primera obtiene persistencia
      if (import.meta.env.DEV) console.warn('⚠️ Firestore persistence: Múltiples pestañas detectadas');
    } else if (err.code === 'unimplemented') {
      // Navegador no soporta persistencia (muy raro)
      console.warn('⚠️ Navegador no soporta offline persistence');
    }
  });

// Conectar a emuladores si está en desarrollo
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔧 Usando emuladores de Firebase');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
