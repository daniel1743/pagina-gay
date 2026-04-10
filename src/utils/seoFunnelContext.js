const SEO_FUNNEL_CONTEXT_KEY = 'chactivo:seo-funnel-context:v1';
const SEO_FUNNEL_MAX_AGE_MS = 45 * 60 * 1000;

const isBrowser = () => typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

const normalizePath = (value = '/') => {
  if (!value || value === '/') return '/';
  return String(value).replace(/\/+$/, '') || '/';
};

export const saveSeoFunnelContext = (context = {}) => {
  if (!isBrowser()) return null;

  const savedAt = Date.now();
  const normalized = {
    contextId: context.contextId || `seo_${savedAt}_${Math.random().toString(36).slice(2, 8)}`,
    fromPath: normalizePath(context.fromPath || window.location.pathname),
    targetPath: normalizePath(context.targetPath || '/chat/principal'),
    roomId: String(context.roomId || 'principal'),
    landingVariant: String(context.landingVariant || ''),
    entryMethod: String(context.entryMethod || 'unknown'),
    countryPath: normalizePath(context.countryPath || context.fromPath || window.location.pathname),
    savedAt,
  };

  sessionStorage.setItem(SEO_FUNNEL_CONTEXT_KEY, JSON.stringify(normalized));
  return normalized;
};

export const readSeoFunnelContext = ({ maxAgeMs = SEO_FUNNEL_MAX_AGE_MS } = {}) => {
  if (!isBrowser()) return null;

  const raw = sessionStorage.getItem(SEO_FUNNEL_CONTEXT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);

    if (!savedAt || Date.now() - savedAt > maxAgeMs) {
      sessionStorage.removeItem(SEO_FUNNEL_CONTEXT_KEY);
      return null;
    }

    return {
      ...parsed,
      fromPath: normalizePath(parsed?.fromPath || '/'),
      targetPath: normalizePath(parsed?.targetPath || '/chat/principal'),
      countryPath: normalizePath(parsed?.countryPath || parsed?.fromPath || '/'),
      roomId: String(parsed?.roomId || 'principal'),
      landingVariant: String(parsed?.landingVariant || ''),
      entryMethod: String(parsed?.entryMethod || 'unknown'),
      contextId: String(parsed?.contextId || `seo_${savedAt}`),
      savedAt,
    };
  } catch {
    sessionStorage.removeItem(SEO_FUNNEL_CONTEXT_KEY);
    return null;
  }
};

export const clearSeoFunnelContext = () => {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SEO_FUNNEL_CONTEXT_KEY);
};

export const getSeoFunnelContextKey = () => SEO_FUNNEL_CONTEXT_KEY;
