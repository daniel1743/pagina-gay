/**
 * Utilidad para determinar el estado de conexión de un usuario
 * 
 * REGLAS DE COLORES:
 * 1) VERDE: si está conectado (online)
 * 2) NARANJA: actividad reciente (<= 2 horas)
 * 3) ROJO: inactivo hace más de 2 horas
 * 
 * PRIORIDAD: Si existe isOnline/online === true, siempre VERDE (independiente de timestamp)
 * 
 * @param {object} user - Usuario con lastSeen, isOnline, online, lastActiveAt, etc.
 * @returns {string} 'online' | 'recently_connected' | 'offline'
 */
export const getUserConnectionStatus = (user) => {
  if (!user) {
    return 'offline'; // Sin datos = offline
  }

  // ✅ PRIORIDAD OBLIGATORIA: Si el usuario tiene flag online/isOnline === true, siempre VERDE
  if (user.isOnline === true || user.online === true) {
    return 'online';
  }

  // Si no hay flag online, usar timestamps para determinar estado
  // Buscar lastActiveAt, lastSeenAt, updatedAt, o lastSeen (en ese orden de preferencia)
  const lastActiveAt = user.lastActiveAt?.toMillis?.() || 
                       user.lastActiveAt || 
                       user.lastSeenAt?.toMillis?.() || 
                       user.lastSeenAt ||
                       user.updatedAt?.toMillis?.() ||
                       user.updatedAt ||
                       user.lastSeen?.toMillis?.() || 
                       user.lastSeen;

  // Si no hay timestamp, considerar offline
  if (!lastActiveAt) {
    return 'offline';
  }

  const now = Date.now();
  const deltaSeconds = (now - lastActiveAt) / 1000;

  // ✅ VERDE: Solo si está realmente online (últimos 45 segundos como heurística)
  // NOTA: Esto solo se usa si NO hay flag isOnline/online
  if (deltaSeconds <= 45) {
    return 'online';
  }

  // ✅ NARANJA: Actividad reciente <= 2 horas
  if (deltaSeconds <= 2 * 60 * 60) {
    return 'recently_connected';
  }

  // ✅ ROJO: Inactivo > 2 horas
  return 'offline';
};

/**
 * Obtiene el color del punto de estado
 * @param {string} status - 'online' | 'recently_connected' | 'offline'
 * @returns {string} Color en formato Tailwind
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'recently_connected':
      return 'bg-orange-500';
    case 'offline':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

/**
 * Obtiene el texto descriptivo del estado
 * @param {string} status - 'online' | 'recently_connected' | 'offline'
 * @returns {string} Texto descriptivo
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'Conectado';
    case 'recently_connected':
      return 'Recién conectado';
    case 'offline':
      return 'Desconectado (hace 2h+)';
    default:
      return 'Desconocido';
  }
};

