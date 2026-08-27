/**
 * Ubicación exacta desactivada por privacidad.
 *
 * Chactivo no solicita, calcula, guarda ni comparte latitud/longitud. La futura
 * ubicación aproximada por ciudad/comuna deberá implementarse como un flujo
 * separado, opt-in y sin reutilizar este módulo.
 */

export const EXACT_GEOLOCATION_DISABLED = true;
const LOCATION_CACHE_KEY = 'chactivo_user_location';

function clearExactLocationCache() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  } catch {
    // El bloqueo de storage no debe romper la navegación.
  }
}

function exactLocationDisabledError() {
  const error = new Error('La ubicación exacta está desactivada por privacidad. Usa ciudad o comuna aproximada cuando esté disponible.');
  error.code = 'EXACT_GEOLOCATION_DISABLED';
  return error;
}

// Eliminar cualquier caché exacta heredada sin pedir permisos al navegador.
clearExactLocationCache();

export const getCurrentLocation = async () => {
  clearExactLocationCache();
  throw exactLocationDisabledError();
};

export const saveUserLocation = async () => {
  clearExactLocationCache();
  throw exactLocationDisabledError();
};

export const disableUserLocation = async () => {
  clearExactLocationCache();
  return { disabled: true };
};

export const getUserLocation = async () => {
  clearExactLocationCache();
  return null;
};

export const requestAndSaveLocation = async () => {
  clearExactLocationCache();
  throw exactLocationDisabledError();
};

export const checkLocationPermission = async () => 'denied';

export const clearLocationCache = () => {
  clearExactLocationCache();
};
