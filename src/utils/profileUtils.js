/**
 * Utilidades para perfiles públicos
 * URL pattern: /profile/:userId
 */

/**
 * Genera la URL para ver el perfil público de un usuario
 * @param {string} userId - ID del usuario
 * @returns {string} URL del perfil
 */
export const getProfileUrl = (userId) => {
  if (!userId) return '/profile';
  return `/profile/${userId}`;
};
