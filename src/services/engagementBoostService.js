/**
 * 🚫 ENGAGEMENT BOOST DESACTIVADO
 * Este servicio mantiene la API por compatibilidad, pero ya no
 * genera ni escribe métricas artificiales.
 *
 * Regla: todas las métricas visibles deben venir de eventos reales.
 */

const getNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const getViewCount = (item) => getNumber(
  item?.visitasRecibidas ??
  item?.vistas ??
  item?.viewCount ??
  0
);

const getLikeCount = (item) => getNumber(
  item?.likesRecibidos ??
  item?.likes ??
  item?.likeCount ??
  0
);

export function calcularVistasEsperadas(item) {
  return getViewCount(item);
}

export function calcularLikesEsperados(item) {
  return getLikeCount(item);
}

export async function aplicarBoostVistas() {
  return false;
}

export async function aplicarBoostLikes() {
  return false;
}

export async function aplicarBoostOpinion() {
  return false;
}

export async function procesarBoostTarjeta(tarjeta) {
  if (!tarjeta) return null;
  const vistas = getViewCount(tarjeta);
  const likes = getLikeCount(tarjeta);
  return {
    huboBoost: false,
    vistas,
    likes,
    vistasNuevas: 0,
    likesNuevos: 0
  };
}

export async function procesarBoostOpinion(opinion) {
  if (!opinion) return null;
  const vistas = getViewCount(opinion);
  const likes = getLikeCount(opinion);
  return {
    huboBoost: false,
    vistas,
    likes
  };
}

export function generarMensajeEngagement() {
  return null;
}

export function deberíaMostrarToast() {
  return false;
}

export function marcarToastMostrado() {}

export function getBoostStats(item, tipo = 'tarjeta') {
  return {
    tipo,
    vistasActuales: getViewCount(item),
    vistasEsperadas: getViewCount(item),
    likesActuales: getLikeCount(item),
    likesEsperados: getLikeCount(item),
    boostDesactivado: true
  };
}

export default {
  calcularVistasEsperadas,
  calcularLikesEsperados,
  procesarBoostTarjeta,
  procesarBoostOpinion,
  generarMensajeEngagement,
  deberíaMostrarToast,
  marcarToastMostrado,
  getBoostStats
};
