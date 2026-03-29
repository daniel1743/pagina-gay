/**
 * Sistema de detección de versiones y auto-actualización
 * Compara la versión actual con la del servidor y limpia cache si hay cambios
 */

const VERSION_STORAGE_KEY = 'app_version';
const VERSION_CHECK_INTERVAL = 60000; // Verificar cada 60 segundos
const VERSION_FILE = '/version.json';
const VERSION_BROADCAST_CHANNEL = 'chactivo_version_updates';
const VERSION_BROADCAST_STORAGE_KEY = 'chactivo_version_broadcast';
const VERSION_RELOAD_LOCK_KEY = 'chactivo_version_reload_lock';

let updateBroadcastChannel = null;

const getReloadLock = () => {
  try {
    return sessionStorage.getItem(VERSION_RELOAD_LOCK_KEY);
  } catch {
    return null;
  }
};

const setReloadLock = (version) => {
  try {
    sessionStorage.setItem(VERSION_RELOAD_LOCK_KEY, version);
  } catch {
    // noop
  }
};

const clearReloadLock = () => {
  try {
    sessionStorage.removeItem(VERSION_RELOAD_LOCK_KEY);
  } catch {
    // noop
  }
};

const buildCacheBustedUrl = (version) => {
  const url = new URL(window.location.href);
  url.searchParams.set('appv', String(version || Date.now()));
  return url.toString();
};

const broadcastVersionUpdate = (version) => {
  const payload = {
    version,
    at: Date.now(),
  };

  try {
    if (!updateBroadcastChannel && 'BroadcastChannel' in window) {
      updateBroadcastChannel = new BroadcastChannel(VERSION_BROADCAST_CHANNEL);
    }
    updateBroadcastChannel?.postMessage(payload);
  } catch {
    // noop
  }

  try {
    localStorage.setItem(VERSION_BROADCAST_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
};

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

const forceServiceWorkerUpdate = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration) => {
        try {
          await registration.update();
        } catch {
          // noop
        }

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
    );
  } catch (error) {
    console.warn('[VERSION] Error forzando update del Service Worker:', error);
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
export const reloadApplication = (version = null) => {
  const targetVersion = version || getStoredVersion() || Date.now();
  const reloadLock = getReloadLock();

  if (reloadLock === String(targetVersion)) {
    console.log('[VERSION] Reload ya en curso, omitiendo duplicado');
    return;
  }

  setReloadLock(String(targetVersion));
  console.log(`🔄 [VERSION] Recargando aplicación a versión ${targetVersion}...`);

  setTimeout(() => {
    window.location.replace(buildCacheBustedUrl(targetVersion));
  }, 250);
};

const applyImmediateUpdate = async (version, { source = 'unknown' } = {}) => {
  const nextVersion = version || await fetchServerVersion();
  if (!nextVersion) return;

  console.log(`[VERSION] Aplicando actualización inmediata (${source}) → ${nextVersion}`);
  broadcastVersionUpdate(nextVersion);
  await forceServiceWorkerUpdate();
  await clearAllCache();
  storeVersion(nextVersion);
  reloadApplication(nextVersion);
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
  let destroyed = false;
  let isChecking = false;
  let focusTimeoutId = null;

  const performCheck = async ({ source = 'interval' } = {}) => {
    if (destroyed || isChecking) return;
    isChecking = true;

    try {
      const serverVersion = await fetchServerVersion();
      if (!serverVersion) return;

      const storedVersion = getStoredVersion();

      if (!storedVersion) {
        storeVersion(serverVersion);
        clearReloadLock();
        return;
      }

      if (storedVersion === serverVersion) {
        clearReloadLock();
        return;
      }

      console.log(`🔄 [VERSION] Nueva versión detectada (${source}): ${storedVersion} → ${serverVersion}`);

      if (onUpdateAvailable) {
        onUpdateAvailable(serverVersion);
      }

      if (autoReload) {
        await applyImmediateUpdate(serverVersion, { source });
      }
    } catch (error) {
      console.error('[VERSION] Error verificando actualizaciones:', error);
    } finally {
      isChecking = false;
    }
  };

  const scheduleForegroundCheck = (source) => {
    if (destroyed) return;
    if (focusTimeoutId) clearTimeout(focusTimeoutId);
    focusTimeoutId = setTimeout(() => {
      performCheck({ source });
    }, 350);
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      scheduleForegroundCheck('visibility');
    }
  };

  const handleFocus = () => scheduleForegroundCheck('focus');
  const handleOnline = () => scheduleForegroundCheck('online');
  const handlePageShow = () => scheduleForegroundCheck('pageshow');

  const handleStorage = (event) => {
    if (event.key !== VERSION_BROADCAST_STORAGE_KEY || !event.newValue) return;
    try {
      const payload = JSON.parse(event.newValue);
      if (!payload?.version) return;
      const currentVersion = getStoredVersion();
      if (currentVersion !== payload.version) {
        applyImmediateUpdate(payload.version, { source: 'storage_broadcast' });
      }
    } catch {
      // noop
    }
  };

  const ensureBroadcastChannel = () => {
    try {
      if (!updateBroadcastChannel && 'BroadcastChannel' in window) {
        updateBroadcastChannel = new BroadcastChannel(VERSION_BROADCAST_CHANNEL);
      }
      if (updateBroadcastChannel) {
        updateBroadcastChannel.onmessage = (event) => {
          const payload = event?.data;
          if (!payload?.version) return;
          const currentVersion = getStoredVersion();
          if (currentVersion !== payload.version) {
            applyImmediateUpdate(payload.version, { source: 'broadcast_channel' });
          }
        };
      }
    } catch {
      // noop
    }
  };

  // Verificar inmediatamente al cargar
  ensureBroadcastChannel();
  performCheck({ source: 'startup' });

  // Configurar verificación periódica
  if (checkInterval > 0) {
    intervalId = setInterval(() => performCheck({ source: 'interval' }), checkInterval);
  }

  window.addEventListener('focus', handleFocus);
  window.addEventListener('online', handleOnline);
  window.addEventListener('pageshow', handlePageShow);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('storage', handleStorage);

  // Retornar función para detener el checker
  return () => {
    destroyed = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (focusTimeoutId) {
      clearTimeout(focusTimeoutId);
      focusTimeoutId = null;
    }
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('pageshow', handlePageShow);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('storage', handleStorage);
  };
};









