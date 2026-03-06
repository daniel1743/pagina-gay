/**
 * Sistema de detección de versiones y auto-actualización
 * Compara la versión actual con la del servidor y limpia cache si hay cambios
 */

const VERSION_STORAGE_KEY = 'app_version';
const VERSION_CHECK_INTERVAL = 60000; // Verificar cada 60 segundos
const VERSION_FILE = '/version.json';

/**
 * Obtiene la versión del servidor
 */
export const fetchServerVersion = async () => {
  try {
    const response = await fetch(`${VERSION_FILE}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      console.warn('[VERSION] No se pudo obtener versión del servidor');
      return null;
    }

    const data = await response.json();
    return data.version || data.timestamp || null;
  } catch (error) {
    console.warn('[VERSION] Error al obtener versión:', error);
    return null;
  }
};

/**
 * Obtiene la versión almacenada localmente
 */
export const getStoredVersion = () => {
  try {
    return localStorage.getItem(VERSION_STORAGE_KEY);
  } catch (error) {
    console.warn('[VERSION] Error al leer versión almacenada:', error);
    return null;
  }
};

/**
 * Guarda la versión actual en localStorage
 */
export const storeVersion = (version) => {
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, version);
  } catch (error) {
    console.warn('[VERSION] Error al guardar versión:', error);
  }
};

/**
 * Limpia todo el cache del sistema
 */
export const clearAllCache = async () => {
  try {
    console.log('🧹 [VERSION] Limpiando cache del sistema...');

    // 1. Limpiar localStorage (excepto datos críticos del usuario)
    const criticalKeys = [
      'chactivo-theme', // Tema del usuario
      'age_verified_', // Verificaciones de edad (se limpian parcialmente)
      'chactivo_guest_identity', // Identidad persistente del invitado (pseudónimo)
      'chactivo_guest_temp', // Datos temporales del modal de invitado
      'rewards_seen_ids:', // Evitar repetir popup de premios ya aceptados
      'pro_congrats_seen:', // Evitar repetir modal de felicitación PRO
    ];

    const keysToKeep = new Set();
    
    // Preservar keys críticas (identidad de invitado, tema, edad)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && criticalKeys.some(critical => key === critical || key.startsWith(critical))) {
        keysToKeep.add(key);
      }
    }

    // Limpiar localStorage (excepto críticos)
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.has(key)) {
        allKeys.push(key);
      }
    }
    allKeys.forEach(key => localStorage.removeItem(key));
    console.log('✅ [VERSION] localStorage limpiado');

    // 2. Limpiar sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ [VERSION] sessionStorage limpiado');
    } catch (error) {
      console.warn('[VERSION] Error limpiando sessionStorage:', error);
    }

    // 3. Limpiar IndexedDB (databases comunes)
    const indexedDBDatabases = [
      'firebaseLocalStorageDb', // Firebase Auth
      'firestore', // Firestore (si está habilitado)
    ];

    for (const dbName of indexedDBDatabases) {
      try {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = () => {
            console.log(`✅ [VERSION] IndexedDB "${dbName}" eliminado`);
            resolve();
          };
          deleteReq.onerror = () => {
            console.warn(`⚠️ [VERSION] No se pudo eliminar IndexedDB "${dbName}"`);
            resolve(); // Continuar aunque falle
          };
          deleteReq.onblocked = () => {
            console.warn(`⚠️ [VERSION] IndexedDB "${dbName}" bloqueado, se eliminará cuando sea posible`);
            resolve();
          };
        });
      } catch (error) {
        console.warn(`⚠️ [VERSION] Error eliminando IndexedDB "${dbName}":`, error);
      }
    }

    // 4. Limpiar Service Worker cache (si existe)
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ [VERSION] Eliminando cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        console.log('✅ [VERSION] Service Worker caches limpiados');
      } catch (error) {
        console.warn('[VERSION] Error limpiando Service Worker caches:', error);
      }
    }

    // 5. Unregister Service Workers (si existen)
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            console.log('🗑️ [VERSION] Desregistrando Service Worker');
            return registration.unregister();
          })
        );
        console.log('✅ [VERSION] Service Workers desregistrados');
      } catch (error) {
        console.warn('[VERSION] Error desregistrando Service Workers:', error);
      }
    }

    console.log('✅ [VERSION] Cache limpiado completamente');
  } catch (error) {
    console.error('❌ [VERSION] Error limpiando cache:', error);
  }
};

/**
 * Verifica si hay una nueva versión disponible
 */
export const checkForUpdates = async () => {
  try {
    const serverVersion = await fetchServerVersion();
    if (!serverVersion) {
      return false; // No se pudo obtener versión, no hacer nada
    }

    const storedVersion = getStoredVersion();

    // Si no hay versión almacenada, guardar la actual y continuar
    if (!storedVersion) {
      storeVersion(serverVersion);
      return false;
    }

    // Si las versiones son diferentes, hay una actualización
    if (storedVersion !== serverVersion) {
      console.log(`🔄 [VERSION] Nueva versión detectada: ${storedVersion} → ${serverVersion}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[VERSION] Error verificando actualizaciones:', error);
    return false;
  }
};

/**
 * Recarga la aplicación después de limpiar cache
 */
export const reloadApplication = () => {
  console.log('🔄 [VERSION] Recargando aplicación...');
  
  // Pequeño delay para asegurar que los logs se vean
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

/**
 * Inicializa el sistema de verificación de versiones
 */
export const initVersionChecker = (options = {}) => {
  const {
    checkInterval = VERSION_CHECK_INTERVAL,
    onUpdateAvailable = null,
    autoReload = true
  } = options;

  let intervalId = null;

  const performCheck = async () => {
    const hasUpdate = await checkForUpdates();
    
    if (hasUpdate) {
      // Notificar callback si existe
      if (onUpdateAvailable) {
        onUpdateAvailable();
      }

      if (autoReload) {
        // Limpiar cache y recargar
        await clearAllCache();
        
        // Guardar nueva versión antes de recargar
        const newVersion = await fetchServerVersion();
        if (newVersion) {
          storeVersion(newVersion);
        }
        
        reloadApplication();
      }
    }
  };

  // Verificar inmediatamente al cargar
  performCheck();

  // Configurar verificación periódica
  if (checkInterval > 0) {
    intervalId = setInterval(performCheck, checkInterval);
  }

  // Retornar función para detener el checker
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};









