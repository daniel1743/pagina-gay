import { Users, Hash, Gamepad2, Heart, UserCheck, GitFork, UserMinus, Cake, Shield } from 'lucide-react';

// ✅ CONSOLIDACIÓN DE SALAS 2026-02-10
// Estrategia: SOLO SALA PRINCIPAL activa para concentrar usuarios reales
// Las demás salas permanecen cerradas hasta nueva decisión manual

// 🔒 CONFIGURACIÓN DE ACCESO A SALAS
export const ROOM_ACCESS_CONFIG = {
  // Sala única activa para todos
  MAIN_ROOM: 'principal',

  // Salas internacionales (solo accesibles desde sus landing pages)
  INTERNATIONAL_ROOMS: ['es-main', 'br-main', 'mx-main', 'ar-main'],

  // Salas bloqueadas temporalmente (se desbloquean con más usuarios)
  LOCKED_ROOMS: ['mas-30', 'santiago', 'gaming'],

  // Umbral de usuarios para desbloquear salas adicionales (no usado en modo actual)
  UNLOCK_THRESHOLD: 100, // Cuando haya 100+ usuarios activos
};

export const roomsData = [
  // 🔥 SALA PRINCIPAL - ÚNICA SALA ACTIVA
  {
    id: 'principal',
    name: 'Chat Principal 🌍',
    description: 'Sala principal - Todos los temas bienvenidos',
    icon: Hash,
    color: 'teal',
    enabled: true,
    adminOnly: false,
    isMainRoom: true // ✅ Sala principal activa
  },
  {
    id: 'admin-testing',
    name: 'Admin Testing 🛡️',
    description: 'Sala privada para pruebas de bots y flujo de admin',
    icon: Shield,
    color: 'red',
    enabled: true,
    adminOnly: true,
  },

  // 🔒 SALAS BLOQUEADAS - Se desbloquean con más tráfico
  {
    id: 'mas-30',
    name: 'Más de 30 💪',
    description: 'Para mayores de 30 años',
    icon: Users,
    color: 'teal',
    enabled: false,
    adminOnly: false,
    locked: true,
    lockedMessage: '🔒 Esta sala se desbloqueará pronto. Por ahora, únete al Chat Principal.'
  },
  {
    id: 'santiago',
    name: 'Santiago 🏙️',
    description: 'Gays de Santiago - Capital de Chile',
    icon: Users,
    color: 'cyan',
    enabled: false,
    adminOnly: false,
    locked: true,
    lockedMessage: '🔒 Esta sala se desbloqueará pronto. Por ahora, únete al Chat Principal.'
  },
  {
    id: 'gaming',
    name: 'Gaming 🎮',
    description: 'Gamers LGBT+ conectando',
    icon: Gamepad2,
    color: 'violet',
    enabled: false,
    adminOnly: false,
    locked: true,
    lockedMessage: '🔒 Esta sala se desbloqueará pronto. Por ahora, únete al Chat Principal.'
  },

  // 🌍 SALAS INTERNACIONALES - Solo accesibles desde sus landing pages
  {
    id: 'es-main',
    name: 'España 🇪🇸',
    description: 'Chat principal de España',
    icon: Hash,
    color: 'red',
    enabled: false,
    adminOnly: false,
    isInternational: true,
    allowedFromLanding: '/espana' // Solo desde landing de España
  },
  {
    id: 'br-main',
    name: 'Brasil 🇧🇷',
    description: 'Chat principal do Brasil',
    icon: Hash,
    color: 'green',
    enabled: false,
    adminOnly: false,
    isInternational: true,
    allowedFromLanding: '/brasil'
  },
  {
    id: 'mx-main',
    name: 'México 🇲🇽',
    description: 'Chat principal de México',
    icon: Hash,
    color: 'green',
    enabled: false,
    adminOnly: false,
    isInternational: true,
    allowedFromLanding: '/mexico'
  },
  {
    id: 'ar-main',
    name: 'Argentina 🇦🇷',
    description: 'Chat principal de Argentina',
    icon: Hash,
    color: 'blue',
    enabled: false,
    adminOnly: false,
    isInternational: true,
    allowedFromLanding: '/argentina'
  },
];

export const colorClasses = {
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  fuchsia: 'text-fuchsia-400',
  green: 'text-green-400',
  teal: 'text-teal-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  violet: 'text-violet-400',
};

const isAdminUser = (user = null) => {
  const role = (user?.role || '').toString().toLowerCase();
  return role === 'admin' || role === 'administrator' || role === 'superadmin';
};

/**
 * Verifica si un usuario puede acceder a una sala
 * @param {string} roomId - ID de la sala
 * @param {string} referrer - URL de donde viene el usuario (opcional)
 * @param {object|null} user - Usuario autenticado actual
 * @returns {{ allowed: boolean, redirect?: string, message?: string }}
 */
export const canAccessRoom = (roomId, referrer = '', user = null) => {
  const room = roomsData.find(r => r.id === roomId);

  // Salas de eventos dinámicos: siempre permitir acceso
  if (roomId?.startsWith('evento_')) {
    return { allowed: true };
  }

  // Sala no existe
  if (!room) {
    return {
      allowed: false,
      redirect: '/chat/principal',
      message: 'Sala no encontrada. Redirigiendo al Chat Principal.'
    };
  }

  // Sala principal siempre accesible
  if (room.isMainRoom) {
    return { allowed: true };
  }

  // Sala privada de testing (solo admins)
  const isAdmin = isAdminUser(user);
  if (room.adminOnly && !isAdmin) {
    return {
      allowed: false,
      redirect: '/chat/principal',
      message: 'Esta sala es privada para administradores.',
    };
  }

  if (room.enabled === false) {
    return {
      allowed: false,
      redirect: '/chat/principal',
      message: 'La conversación está centralizada en la sala principal para concentrar usuarios reales.'
    };
  }

  // Salas internacionales - verificar si viene de landing correcta
  if (room.isInternational) {
    // Permitir si viene de la landing internacional correspondiente
    // o si ya está en sesión desde esa sala
    const fromCorrectLanding = referrer && referrer.includes(room.allowedFromLanding);
    if (fromCorrectLanding) {
      return { allowed: true };
    }
    return {
      allowed: false,
      redirect: '/chat/principal',
      message: `Para acceder a ${room.name}, visita nuestra página de ${room.name.split(' ')[0]}.`
    };
  }

  // Salas bloqueadas
  if (room.locked) {
    return {
      allowed: false,
      redirect: '/chat/principal',
      message: room.lockedMessage
    };
  }

  return { allowed: true };
};

/**
 * Obtiene solo las salas visibles en el lobby
 * @returns {Array} Salas que se muestran en el lobby
 */
export const getVisibleRooms = () => {
  // Solo mostrar sala principal en el lobby
  return roomsData.filter(room => room.isMainRoom && room.enabled !== false && room.adminOnly !== true);
};

/**
 * Obtiene salas visibles para un usuario específico.
 * - Usuarios normales: solo sala principal.
 * - Admins: sala principal + salas adminOnly habilitadas (ej. admin-testing).
 */
export const getVisibleRoomsForUser = (user = null) => {
  const isAdmin = isAdminUser(user);
  return roomsData.filter((room) => {
    if (room.enabled === false) return false;
    if (room.isMainRoom) return true;
    if (room.adminOnly && isAdmin) return true;
    return false;
  });
};

/**
 * Obtiene todas las salas (para admin)
 * @returns {Array} Todas las salas
 */
export const getAllRooms = () => roomsData;
