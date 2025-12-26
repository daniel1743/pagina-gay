/**
 * 🎯 SERVICIO DE ENGAGEMENT - Sistema de 1 hora gratuita
 *
 * En lugar de contar mensajes, medimos el TIEMPO de engagement.
 * Después de 1 hora usando el sitio, celebramos su interés y pedimos registro.
 *
 * FILOSOFÍA:
 * - Si pasó 1 hora, significa que LE GUSTA la plataforma
 * - El modal es una CELEBRACIÓN, no un bloqueo
 * - Mensaje: "¡Llevas 1 hora con nosotros! Regístrate para continuar"
 */

const ONE_HOUR_IN_MS = 60 * 60 * 1000; // 1 hora = 3,600,000 ms
// const ONE_HOUR_IN_MS = 5 * 60 * 1000; // 5 minutos (para testing)

const STORAGE_KEYS = {
  FIRST_VISIT: 'chactivo_first_visit_timestamp',
  HAS_SEEN_ENGAGEMENT_MODAL: 'chactivo_engagement_modal_shown',
};

/**
 * Registra la primera visita del usuario (solo si es guest/anonymous)
 */
export const startEngagementTracking = (user) => {
  // Solo trackear usuarios guest/anonymous
  if (!user || (!user.isGuest && !user.isAnonymous)) {
    return;
  }

  // Si ya existe un timestamp, no sobrescribir
  const existingTimestamp = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  if (!existingTimestamp) {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, now.toString());
    console.log('🕐 Engagement tracking iniciado:', new Date(now).toLocaleTimeString());
  }
};

/**
 * Verifica si ha pasado 1 hora desde la primera visita
 */
export const hasReachedOneHourLimit = (user) => {
  // Usuarios registrados no tienen límite
  if (!user || (!user.isGuest && !user.isAnonymous)) {
    return false;
  }

  const firstVisitTimestamp = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  if (!firstVisitTimestamp) {
    // No hay timestamp registrado, iniciar ahora
    startEngagementTracking(user);
    return false;
  }

  const now = Date.now();
  const timeElapsed = now - parseInt(firstVisitTimestamp);

  // Si ha pasado más de 1 hora
  if (timeElapsed >= ONE_HOUR_IN_MS) {
    return true;
  }

  return false;
};

/**
 * Obtiene el tiempo restante hasta completar 1 hora
 * Retorna un objeto con minutos y segundos restantes
 */
export const getTimeRemaining = (user) => {
  // Usuarios registrados no tienen límite
  if (!user || (!user.isGuest && !user.isAnonymous)) {
    return { minutes: Infinity, seconds: 0, hasReachedLimit: false };
  }

  const firstVisitTimestamp = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  if (!firstVisitTimestamp) {
    return { minutes: 60, seconds: 0, hasReachedLimit: false };
  }

  const now = Date.now();
  const timeElapsed = now - parseInt(firstVisitTimestamp);
  const timeRemaining = ONE_HOUR_IN_MS - timeElapsed;

  if (timeRemaining <= 0) {
    return { minutes: 0, seconds: 0, hasReachedLimit: true };
  }

  const minutes = Math.floor(timeRemaining / (60 * 1000));
  const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

  return { minutes, seconds, hasReachedLimit: false };
};

/**
 * Verifica si ya se mostró el modal de engagement
 */
export const hasSeenEngagementModal = () => {
  return localStorage.getItem(STORAGE_KEYS.HAS_SEEN_ENGAGEMENT_MODAL) === 'true';
};

/**
 * Marca que el modal de engagement ya fue mostrado
 */
export const markEngagementModalAsShown = () => {
  localStorage.setItem(STORAGE_KEYS.HAS_SEEN_ENGAGEMENT_MODAL, 'true');
};

/**
 * Resetea todo el tracking (para cuando el usuario se registra)
 */
export const resetEngagementTracking = () => {
  localStorage.removeItem(STORAGE_KEYS.FIRST_VISIT);
  localStorage.removeItem(STORAGE_KEYS.HAS_SEEN_ENGAGEMENT_MODAL);
  console.log('✅ Engagement tracking reseteado (usuario registrado)');
};

/**
 * Obtiene el tiempo total de uso en formato legible
 */
export const getTotalEngagementTime = (user) => {
  const firstVisitTimestamp = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT);
  if (!firstVisitTimestamp) {
    return '0 minutos';
  }

  const now = Date.now();
  const timeElapsed = now - parseInt(firstVisitTimestamp);
  const minutes = Math.floor(timeElapsed / (60 * 1000));

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${minutes} minutos`;
};
