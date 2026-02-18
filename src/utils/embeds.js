const ALLOWED_EMBED_DOMAINS = [
  'x.com',
  'twitter.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
];

const normalizeHost = (host = '') => host.toLowerCase().replace(/^www\./, '');

export const getAllowedEmbedDomains = () => [...ALLOWED_EMBED_DOMAINS];

export const parseSafeUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url;
  } catch (error) {
    return null;
  }
};

export const isHttpUrl = (value) => parseSafeUrl(value) !== null;

export const isAllowedEmbedDomain = (value, allowlist = ALLOWED_EMBED_DOMAINS) => {
  const parsed = parseSafeUrl(value);
  if (!parsed) return false;
  const host = normalizeHost(parsed.hostname);
  return allowlist.some((domain) => {
    const normalizedDomain = normalizeHost(domain);
    return host === normalizedDomain || host.endsWith(`.${normalizedDomain}`);
  });
};

export const normalizeMediaType = (mediaType) => {
  if (!mediaType) return 'none';
  const value = String(mediaType).toLowerCase().trim();
  if (value === 'video_embed') return 'iframe';
  if (value === 'iframe_embed') return 'iframe';
  if (value === 'twitter_embed') return 'x_embed';
  if (['none', 'image', 'x_embed', 'iframe'].includes(value)) return value;
  return 'none';
};

export const normalizePlatform = (platform) => {
  if (!platform) return 'other';
  const value = String(platform).toLowerCase().trim();
  if (value === 'twitter') return 'x';
  if (value === 'telegram') return 'telegram';
  if (value === 'x') return 'x';
  if (value === 'instagram') return 'instagram';
  return 'other';
};

export const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === 'function') {
    const parsed = value.toDate();
    return Number.isNaN(parsed?.getTime?.()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const shouldShowBySchedule = (startsAt, endsAt, nowMs = Date.now()) => {
  const startsAtDate = toDateOrNull(startsAt);
  const endsAtDate = toDateOrNull(endsAt);
  const startsAtMs = startsAtDate?.getTime?.() ?? null;
  const endsAtMs = endsAtDate?.getTime?.() ?? null;

  if (startsAtMs && nowMs < startsAtMs) return false;
  if (endsAtMs && nowMs > endsAtMs) return false;
  return true;
};

export const getXEmbedUrl = (tweetUrl) => {
  if (!isAllowedEmbedDomain(tweetUrl, ['x.com', 'twitter.com'])) return null;
  return `https://twitframe.com/show?url=${encodeURIComponent(tweetUrl)}`;
};

export const getEmbedSrc = (mediaType, mediaUrl) => {
  const normalizedType = normalizeMediaType(mediaType);
  if (!mediaUrl) return null;

  if (normalizedType === 'x_embed') {
    return getXEmbedUrl(mediaUrl);
  }

  if (normalizedType === 'iframe') {
    if (!isAllowedEmbedDomain(mediaUrl)) return null;
    return mediaUrl;
  }

  return null;
};

export const sanitizeFeaturedAdInput = (input = {}) => {
  const title = String(input.title || '').trim().slice(0, 40);
  const description = String(input.description || '').trim().slice(0, 80);
  const platform = normalizePlatform(input.platform);
  const ctaText = String(input.ctaText || input.cta_text || 'Ver').trim().slice(0, 16) || 'Ver';
  const url = String(input.url || '').trim();
  const mediaType = normalizeMediaType(input.mediaType || input.media_type);
  const mediaUrl = String(input.mediaUrl || input.media_url || '').trim();
  const badgeRaw = String(input.badge || '').trim();
  const badge = badgeRaw ? badgeRaw.slice(0, 16) : null;
  const blurEnabled = Boolean(input.blurEnabled ?? input.blur_enabled ?? true);
  const blurStrengthRaw = Number(input.blurStrength ?? input.blur_strength ?? 14);
  const blurStrength = Number.isFinite(blurStrengthRaw)
    ? Math.max(6, Math.min(20, Math.round(blurStrengthRaw)))
    : 14;
  const isActive = Boolean(input.isActive ?? input.is_active ?? true);
  const sortOrderRaw = Number(input.sortOrder ?? input.sort_order ?? 1);
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.max(1, Math.round(sortOrderRaw)) : 1;
  const startsAt = toDateOrNull(input.startsAt ?? input.starts_at);
  const endsAt = toDateOrNull(input.endsAt ?? input.ends_at);

  return {
    title,
    description,
    platform,
    ctaText,
    url,
    mediaType,
    mediaUrl,
    blurEnabled,
    blurStrength,
    badge,
    isActive,
    sortOrder,
    startsAt,
    endsAt,
  };
};

export const validateFeaturedAd = (input = {}) => {
  const ad = sanitizeFeaturedAdInput(input);
  const errors = [];

  if (!ad.title) errors.push('El titulo es obligatorio.');
  if (!ad.url) errors.push('La URL de destino es obligatoria.');
  if (ad.url && !isHttpUrl(ad.url)) errors.push('La URL de destino no es valida.');
  if (ad.mediaType !== 'none' && !ad.mediaUrl) {
    errors.push('Debes indicar media URL cuando hay preview.');
  }
  if (ad.mediaType === 'x_embed' && ad.mediaUrl && !isAllowedEmbedDomain(ad.mediaUrl, ['x.com', 'twitter.com'])) {
    errors.push('El embed de X solo permite dominios x.com o twitter.com.');
  }
  if (ad.mediaType === 'iframe' && ad.mediaUrl && !isAllowedEmbedDomain(ad.mediaUrl)) {
    errors.push('El dominio del iframe no esta permitido.');
  }
  if (ad.startsAt && ad.endsAt && ad.endsAt.getTime() < ad.startsAt.getTime()) {
    errors.push('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: ad,
  };
};

