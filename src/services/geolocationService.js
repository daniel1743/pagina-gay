import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getGeohash, getGeohashRange } from '@/utils/geohash';

/**
 * Servicio de Geolocalización Optimizado
 *
 * OPTIMIZACIONES:
 * - Solo guarda coordenadas en el perfil del usuario (1 write)
 * - Usa Geohashing para búsquedas eficientes
 * - Calcula distancias en cliente (sin reads adicionales)
 * - Caché local para evitar pedir ubicación constantemente
 */

const LOCATION_CACHE_KEY = 'chactivo_user_location';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

/**
 * Obtiene la ubicación actual del usuario
 * OPTIMIZADO: Usa caché local para evitar múltiples requests
 * @returns {Promise<{latitude: number, longitude: number, timestamp: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    // Verificar si hay caché válido
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      const now = Date.now();

      // Si el caché tiene menos de 1 hora, usarlo
      if (now - cachedData.timestamp < CACHE_DURATION) {
        console.log('📍 Usando ubicación en caché');
        resolve(cachedData);
        return;
      }
    }

    // Verificar soporte de geolocalización
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización'));
      return;
    }

    console.log('📍 Solicitando ubicación al navegador...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Guardar en caché local
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));

        console.log('📍 Ubicación obtenida:', locationData);
        resolve(locationData);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        let errorMessage = 'No se pudo obtener tu ubicación';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Por favor, habilítalo en la configuración de tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Verifica tu conexión.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
            break;
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: false, // false = más rápido, menos preciso (suficiente para ciudad)
        timeout: 10000, // 10 segundos
        maximumAge: CACHE_DURATION, // Permitir ubicación cacheada del navegador
      }
    );
  });
};

/**
 * Guarda la ubicación del usuario en Firestore
 * OPTIMIZADO: Solo 1 write, incluye geohash para búsquedas eficientes
 * @param {string} userId - ID del usuario
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 */
export const saveUserLocation = async (userId, latitude, longitude) => {
  try {
    const userRef = doc(db, 'users', userId);

    // Calcular geohash (para búsquedas eficientes)
    const geohash = getGeohash(latitude, longitude);

    // OPTIMIZACIÓN: Solo 1 write con toda la info de ubicación
    await updateDoc(userRef, {
      location: {
        latitude,
        longitude,
        geohash,
        updatedAt: new Date().toISOString(),
      },
      locationEnabled: true,
    });

    console.log('📍 Ubicación guardada en Firestore');
  } catch (error) {
    console.error('Error guardando ubicación:', error);
    throw error;
  }
};

/**
 * Deshabilita la ubicación del usuario
 * @param {string} userId - ID del usuario
 */
export const disableUserLocation = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      locationEnabled: false,
    });

    // Limpiar caché local
    localStorage.removeItem(LOCATION_CACHE_KEY);

    console.log('📍 Ubicación deshabilitada');
  } catch (error) {
    console.error('Error deshabilitando ubicación:', error);
    throw error;
  }
};

/**
 * Obtiene la ubicación del usuario desde Firestore
 * @param {string} userId - ID del usuario
 * @returns {Promise<{latitude: number, longitude: number, geohash: string, updatedAt: string} | null>}
 */
export const getUserLocation = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().location) {
      return userSnap.data().location;
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo ubicación del usuario:', error);
    return null;
  }
};

/**
 * Solicita y guarda la ubicación del usuario (flujo completo)
 * @param {string} userId - ID del usuario
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const requestAndSaveLocation = async (userId) => {
  try {
    // 1. Obtener ubicación del navegador
    const location = await getCurrentLocation();

    // 2. Guardar en Firestore
    await saveUserLocation(userId, location.latitude, location.longitude);

    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  } catch (error) {
    console.error('Error en flujo de ubicación:', error);
    throw error;
  }
};

/**
 * Verifica si el usuario tiene permisos de geolocalización
 * @returns {Promise<'granted' | 'denied' | 'prompt'>}
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions) {
    return 'prompt'; // No se puede verificar, asumir que hay que pedir
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', 'prompt'
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return 'prompt';
  }
};

/**
 * Limpiar caché de ubicación (útil para forzar actualización)
 */
export const clearLocationCache = () => {
  localStorage.removeItem(LOCATION_CACHE_KEY);
  console.log('📍 Caché de ubicación limpiado');
};
