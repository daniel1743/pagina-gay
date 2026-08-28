export const DEFAULT_AVATAR_SRC = '/avatar_por_defecto.jpeg';

/**
 * Solo se aceptan recursos de avatar del mismo origen o HTTPS.
 * Esto evita persistir/renderizar blob URLs, URLs javascript o referencias
 * temporales que se rompen al cambiar de sesión.
 */
export const isAllowedAvatarSrc = (src) => {
  if (!src || typeof src !== 'string') return false;

  const value = src.trim();
  if (!value || value === 'undefined' || value === 'null') return false;
  if (value.startsWith('blob:')) return false;
  if (value.startsWith('javascript:')) return false;

  if (value.startsWith('/')) return true;
  if (value.startsWith('https://')) return true;
  // El catálogo local de DiceBear persiste SVG data URI. Se acepta solo ese
  // MIME y con un límite razonable para no convertir el campo en almacenamiento
  // arbitrario de contenido.
  if (value.startsWith('data:image/svg+xml') && value.length <= 100000) return true;

  return false;
};

export const getSafeAvatarSrc = (src) => (
  isAllowedAvatarSrc(src) ? src.trim() : DEFAULT_AVATAR_SRC
);

export const handleAvatarImageError = (event) => {
  const image = event?.currentTarget;
  if (!image) return;

  image.onerror = null;
  image.src = DEFAULT_AVATAR_SRC;
  image.dataset.avatarFallback = 'true';
};

export const getAvatarInitial = (username = '') => (
  String(username || '').trim().charAt(0).toUpperCase() || '?'
);
