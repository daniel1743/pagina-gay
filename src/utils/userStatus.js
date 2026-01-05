/**
 * Utilidad para determinar el estado de conexión de un usuario
 * 
 * REGLAS DE COLORES:
 * 1) VERDE: si está conectado (online)
 * 2) NARANJA: si está desconectado hace MENOS de 2 minutos (≤ 120 segundos)
 * 3) ROJO: si está desconectado hace MÁS de 2 minutos (> 120 segundos)
 * 
 * PRIORIDAD: Si existe isOnline/online === true, siempre VERDE (independiente de timestamp)
 * 
 * @param {object} user - Usuario con lastSeen, isOnline, online, lastActiveAt, etc.
 * @returns {string} 'online' | 'recently_offline' | 'offline'
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

  // ✅ VERDE: Solo si está realmente online (últimos 30 segundos como heurística)
  // NOTA: Esto solo se usa si NO hay flag isOnline/online
  if (deltaSeconds <= 30) {
    return 'online';
  }

  // ✅ NARANJA: Desconectado hace ≤ 2 minutos (120 segundos) pero > 30 segundos
  if (deltaSeconds <= 120) {
    return 'recently_offline';
  }

  // ✅ ROJO: Desconectado hace > 2 minutos
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

