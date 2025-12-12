/**
 * Utilidades de Geohashing y Cálculo de Distancias
 *
 * Geohashing: Sistema para codificar coordenadas geográficas en strings
 * Permite búsquedas eficientes por proximidad en Firestore
 *
 * OPTIMIZACIÓN: Permite buscar usuarios cercanos sin calcular distancia con TODOS
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Convierte coordenadas geográficas a un geohash
 * @param {number} latitude - Latitud (-90 a 90)
 * @param {number} longitude - Longitud (-180 a 180)
 * @param {number} precision - Precisión del geohash (default: 7)
 * @returns {string} Geohash
 *
 * Precisión del geohash:
 * - 5: ±2.4 km
 * - 6: ±0.61 km (610 metros)
 * - 7: ±0.076 km (76 metros) ← RECOMENDADO para ciudad
 * - 8: ±0.019 km (19 metros)
 */
export const getGeohash = (latitude, longitude, precision = 7) => {
  let idx = 0; // index into base32 map
  let bit = 0; // each char holds 5 bits
  let evenBit = true;
  let geohash = '';

  let latMin = -90,
    latMax = 90;
  let lonMin = -180,
    lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // longitude
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude >= lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      // latitude
      const latMid = (latMin + latMax) / 2;
      if (latitude >= latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      // 5 bits gives us a character: append it and start over
      geohash += BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
};

/**
 * Calcula el rango de geohashes para buscar dentro de un radio
 * OPTIMIZACIÓN: En lugar de calcular distancia con TODOS los usuarios,
 * solo buscamos en un rango de geohashes
 *
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @param {number} radiusKm - Radio de búsqueda en kilómetros
 * @returns {Array<{start: string, end: string}>} Rangos de geohashes
 */
export const getGeohashRange = (latitude, longitude, radiusKm = 10) => {
  // Ajustar precisión según el radio
  // Radio pequeño = mayor precisión, radio grande = menor precisión
  let precision;
  if (radiusKm <= 0.5) precision = 8; // 500m
  else if (radiusKm <= 2) precision = 7; // 2km
  else if (radiusKm <= 5) precision = 6; // 5km
  else if (radiusKm <= 20) precision = 5; // 20km
  else precision = 4; // 20km+

  const hash = getGeohash(latitude, longitude, precision);

  // Generar geohashes vecinos (9 celdas: centro + 8 alrededor)
  const neighbors = [
    hash, // centro
    getNeighbor(hash, 'top'),
    getNeighbor(hash, 'bottom'),
    getNeighbor(hash, 'left'),
    getNeighbor(hash, 'right'),
    getNeighbor(getNeighbor(hash, 'top'), 'left'),
    getNeighbor(getNeighbor(hash, 'top'), 'right'),
    getNeighbor(getNeighbor(hash, 'bottom'), 'left'),
    getNeighbor(getNeighbor(hash, 'bottom'), 'right'),
  ].filter(Boolean); // Filtrar nulls

  // Convertir a rangos para queries de Firestore
  return neighbors.map((h) => ({
    start: h,
    end: h + '~', // '~' es el último carácter ASCII
  }));
};

/**
 * Obtiene el geohash vecino en una dirección
 * @param {string} hash - Geohash
 * @param {string} direction - 'top', 'bottom', 'left', 'right'
 * @returns {string|null} Geohash vecino
 */
const getNeighbor = (hash, direction) => {
  if (!hash || hash.length === 0) return null;

  const lastChar = hash.charAt(hash.length - 1);
  const parent = hash.slice(0, -1);

  const neighbors = {
    top: {
      even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
      odd: 'bc01fg45238967deuvhjyznpkmstqrwx',
    },
    bottom: {
      even: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
      odd: '238967debc01fg45kmstqrwxuvhjyznp',
    },
    left: {
      even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
      odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb',
    },
    right: {
      even: 'bc01fg45238967deuvhjyznpkmstqrwx',
      odd: '238967debc01fg45kmstqrwxuvhjyznp',
    },
  };

  const borders = {
    top: { even: 'prxz', odd: 'bcfguvyz' },
    bottom: { even: '028b', odd: '0145hjnp' },
    left: { even: '0145hjnp', odd: '028b' },
    right: { even: 'bcfguvyz', odd: 'prxz' },
  };

  const type = hash.length % 2 === 0 ? 'even' : 'odd';

  if (borders[direction][type].indexOf(lastChar) !== -1 && parent !== '') {
    const neighborParent = getNeighbor(parent, direction);
    if (!neighborParent) return null;
    return neighborParent + BASE32.charAt(neighbors[direction][type].indexOf(lastChar));
  } else {
    return parent + BASE32.charAt(neighbors[direction][type].indexOf(lastChar));
  }
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // km
};

/**
 * Convierte grados a radianes
 * @param {number} degrees - Grados
 * @returns {number} Radianes
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Formatea la distancia para mostrar al usuario
 * @param {number} distanceKm - Distancia en kilómetros
 * @returns {string} Distancia formateada
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  } else {
    return `${Math.round(distanceKm)} km`;
  }
};

/**
 * Filtra y ordena usuarios por proximidad
 * OPTIMIZADO: Calcula distancias en cliente (sin reads adicionales)
 *
 * @param {Array} users - Lista de usuarios con location {latitude, longitude}
 * @param {number} userLat - Latitud del usuario actual
 * @param {number} userLon - Longitud del usuario actual
 * @param {number} maxDistanceKm - Distancia máxima en km (default: 50)
 * @returns {Array} Usuarios ordenados por proximidad con campo 'distance'
 */
export const filterAndSortByProximity = (users, userLat, userLon, maxDistanceKm = 50) => {
  return users
    .map((user) => {
      // Si el usuario no tiene ubicación, ponerlo al final
      if (!user.location || !user.location.latitude || !user.location.longitude) {
        return {
          ...user,
          distance: Infinity,
          distanceText: 'Ubicación no disponible',
        };
      }

      // Calcular distancia
      const distance = calculateDistance(
        userLat,
        userLon,
        user.location.latitude,
        user.location.longitude
      );

      return {
        ...user,
        distance,
        distanceText: formatDistance(distance),
      };
    })
    .filter((user) => user.distance <= maxDistanceKm || user.distance === Infinity)
    .sort((a, b) => a.distance - b.distance);
};

/**
 * Obtiene la ciudad/región aproximada según el geohash
 * NOTA: Esto es una aproximación básica para Santiago y alrededores
 * Para mejor precisión, usar un servicio de geocoding inverso (Google Maps API)
 *
 * @param {string} geohash - Geohash del usuario
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @returns {string} Nombre de la región
 */
export const getApproximateLocation = (geohash, latitude, longitude) => {
  // Regiones de Chile (aproximadas)
  // Santiago: lat ~-33.4, lng ~-70.6
  // Valparaíso: lat ~-33.0, lng ~-71.6
  // Viña del Mar: lat ~-33.0, lng ~-71.5

  if (latitude >= -33.7 && latitude <= -33.0 && longitude >= -70.9 && longitude <= -70.3) {
    return 'Santiago';
  } else if (latitude >= -33.2 && latitude <= -32.8 && longitude >= -71.7 && longitude <= -71.4) {
    return 'Valparaíso';
  } else if (latitude >= -33.2 && latitude <= -32.8 && longitude >= -71.6 && longitude <= -71.4) {
    return 'Viña del Mar';
  } else {
    return 'Chile';
  }
};
