/**
 * 📅 UTILIDADES DE EVENTOS
 * Funciones para determinar estado de eventos y formatear countdowns
 * Todo client-side, sin Cloud Functions
 */

/**
 * Convierte timestamp de Firestore a milisegundos
 */
export function toMs(timestamp) {
  if (!timestamp) return 0;
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  return new Date(timestamp).getTime() || 0;
}

/**
 * ¿El evento está activo ahora?
 */
export function isEventoActivo(evento) {
  if (!evento) return false;
  const now = Date.now();
  return now >= toMs(evento.fechaInicio) && now <= toMs(evento.fechaFin);
}

/**
 * ¿El evento está programado (futuro)?
 */
export function isEventoProgramado(evento) {
  if (!evento) return false;
  return Date.now() < toMs(evento.fechaInicio);
}

/**
 * ¿El evento ya terminó?
 */
export function isEventoFinalizado(evento) {
  if (!evento) return false;
  return Date.now() > toMs(evento.fechaFin);
}

/**
 * Obtener estado textual del evento
 */
export function getEstadoEvento(evento) {
  if (!evento) return 'desconocido';
  if (isEventoActivo(evento)) return 'activo';
  if (isEventoProgramado(evento)) return 'programado';
  return 'finalizado';
}

/**
 * Formatear countdown hacia la fecha de inicio
 * Retorna string: "2h 15m", "45m", "3d 5h", etc.
 */
export function formatCountdown(fechaInicio) {
  const ms = toMs(fechaInicio) - Date.now();
  if (ms <= 0) return null;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Formatear fecha para mostrar en UI
 */
export function formatFechaEvento(timestamp) {
  const date = new Date(toMs(timestamp));
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const esHoy = date.toDateString() === hoy.toDateString();
  const esManana = date.toDateString() === manana.toDateString();

  const hora = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  if (esHoy) return `Hoy a las ${hora}`;
  if (esManana) return `Mañana a las ${hora}`;

  const dia = date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${dia} a las ${hora}`;
}
