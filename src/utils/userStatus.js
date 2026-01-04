/**
 * Utilidad para determinar el estado de conexión de un usuario
 * Basado en lastSeen timestamp
 * 
 * @param {object} user - Usuario con lastSeen
 * @returns {string} 'online' | 'recently_offline' | 'offline'
 */
export const getUserConnectionStatus = (user) => {
  if (!user || !user.lastSeen) {
    return 'offline'; // Sin datos = offline
  }

  const now = Date.now();
  const lastSeen = user.lastSeen?.toMillis?.() || user.lastSeen;
  const timeSinceLastSeen = now - lastSeen;

  // Verde: Conectado (últimos 2 minutos)
  if (timeSinceLastSeen <= 2 * 60 * 1000) {
    return 'online';
  }

  // Naranja: Recién desconectado (2-10 minutos)
  if (timeSinceLastSeen <= 10 * 60 * 1000) {
    return 'recently_offline';
  }

  // Rojo: Desconectado hace tiempo (>10 minutos)
  return 'offline';
};

/**
 * Obtiene el color del punto de estado
 * @param {string} status - 'online' | 'recently_offline' | 'offline'
 * @returns {string} Color en formato Tailwind
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'recently_offline':
      return 'bg-orange-500';
    case 'offline':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

/**
 * Obtiene el texto descriptivo del estado
 * @param {string} status - 'online' | 'recently_offline' | 'offline'
 * @returns {string} Texto descriptivo
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'Conectado';
    case 'recently_offline':
      return 'Recién desconectado';
    case 'offline':
      return 'Desconectado';
    default:
      return 'Desconocido';
  }
};

