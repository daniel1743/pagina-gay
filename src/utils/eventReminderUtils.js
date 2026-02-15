/**
 * 🔔 Utilidades de Recordatorio de Eventos
 * Gestiona recordatorios en localStorage (sin push notifications, sin Blaze)
 */

const PREFIX = 'evento_recordatorio_';
const POPUP_SHOWN_PREFIX = 'evento_popup_shown_';

/**
 * Guardar recordatorio de un evento
 */
export function setEventReminder(eventoId) {
  try {
    localStorage.setItem(`${PREFIX}${eventoId}`, 'true');
  } catch (e) {
    console.warn('[REMINDER] Error guardando:', e);
  }
}

/**
 * Eliminar recordatorio de un evento
 */
export function removeEventReminder(eventoId) {
  try {
    localStorage.removeItem(`${PREFIX}${eventoId}`);
  } catch (e) {
    console.warn('[REMINDER] Error eliminando:', e);
  }
}

/**
 * Verificar si tiene recordatorio
 */
export function hasEventReminder(eventoId) {
  try {
    return localStorage.getItem(`${PREFIX}${eventoId}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marcar que el popup de recordatorio ya se mostró en esta sesión
 */
export function markReminderPopupShown(eventoId) {
  try {
    sessionStorage.setItem(`${POPUP_SHOWN_PREFIX}${eventoId}`, 'true');
  } catch (e) {
    console.warn('[REMINDER] Error marcando popup:', e);
  }
}

/**
 * Verificar si el popup ya se mostró en esta sesión
 */
export function wasReminderPopupShown(eventoId) {
  try {
    return sessionStorage.getItem(`${POPUP_SHOWN_PREFIX}${eventoId}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Limpiar recordatorios de eventos pasados (mantenimiento)
 */
export function cleanOldReminders() {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(PREFIX)) {
        // Los roomIds tienen timestamp: evento_1700000000000
        const eventoId = key.replace(PREFIX, '');
        const match = eventoId.match(/evento_(\d+)/);
        if (match) {
          const ts = parseInt(match[1], 10);
          // Si el evento fue hace más de 7 días, limpiar
          if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[REMINDER] Error limpiando:', e);
  }
}
