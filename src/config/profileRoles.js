export const PROFILE_ROLE_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Versátil Act', label: 'Versátil Act' },
  { value: 'Versátil Pasivo', label: 'Versátil Pasivo' },
  { value: 'Pasivo', label: 'Pasivo' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Hetero Curioso', label: 'Hetero Curioso' },
  { value: 'Solo Mamar', label: 'Solo Mamar' },
  { value: 'Solo Ver', label: 'Solo Ver' },
];

const ROLE_STYLE_BY_VALUE = {
  'Activo': {
    badgeClassName: 'border-emerald-500/85 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400/75 dark:border-emerald-300/85 dark:bg-emerald-500/25 dark:text-emerald-100 dark:ring-emerald-300/70',
    avatarRingColor: '#34d399',
  },
  'Versátil Act': {
    badgeClassName: 'border-violet-500/85 bg-violet-100 text-violet-900 ring-1 ring-violet-400/75 dark:border-violet-300/85 dark:bg-violet-500/25 dark:text-violet-100 dark:ring-violet-300/70',
    avatarRingColor: '#a78bfa',
  },
  'Versátil Pasivo': {
    badgeClassName: 'border-fuchsia-500/85 bg-fuchsia-100 text-fuchsia-900 ring-1 ring-fuchsia-400/75 dark:border-fuchsia-300/85 dark:bg-fuchsia-500/25 dark:text-fuchsia-100 dark:ring-fuchsia-300/70',
    avatarRingColor: '#e879f9',
  },
  'Pasivo': {
    badgeClassName: 'border-cyan-600/85 bg-cyan-100 text-cyan-900 ring-1 ring-cyan-500/70 dark:border-cyan-300/85 dark:bg-cyan-500/25 dark:text-cyan-100 dark:ring-cyan-300/70',
    avatarRingColor: '#06b6d4',
  },
  'Inter': {
    badgeClassName: 'border-sky-600/85 bg-sky-100 text-sky-900 ring-1 ring-sky-500/70 dark:border-sky-300/85 dark:bg-sky-500/25 dark:text-sky-100 dark:ring-sky-300/70',
    avatarRingColor: '#0ea5e9',
  },
  'Hetero Curioso': {
    badgeClassName: 'border-amber-500/90 bg-amber-100 text-amber-900 ring-1 ring-amber-400/75 dark:border-amber-300/85 dark:bg-amber-500/25 dark:text-amber-100 dark:ring-amber-300/70',
    avatarRingColor: '#fbbf24',
  },
  'Solo Mamar': {
    badgeClassName: 'border-rose-500/85 bg-rose-100 text-rose-900 ring-1 ring-rose-400/75 dark:border-rose-300/85 dark:bg-rose-500/25 dark:text-rose-100 dark:ring-rose-300/70',
    avatarRingColor: '#fb7185',
  },
  'Solo Ver': {
    badgeClassName: 'border-zinc-600/85 bg-zinc-100 text-zinc-900 ring-1 ring-zinc-500/70 dark:border-zinc-300/85 dark:bg-zinc-500/25 dark:text-zinc-100 dark:ring-zinc-300/70',
    avatarRingColor: '#71717a',
  },
};

const normalizeKey = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const ROLE_ALIASES = {
  'Activo': ['act', 'top'],
  'Versátil Act': ['versatil', 'versatil act', 'versatil activo', 'vers act', 'vers'],
  'Versátil Pasivo': ['versatil pasivo', 'vers pasivo', 'versatil p'],
  'Pasivo': ['bottom'],
  'Inter': ['intermedio'],
  'Hetero Curioso': ['heterocurioso', 'curioso hetero'],
  'Solo Mamar': ['mamar', 'solo oral', 'oral'],
  'Solo Ver': ['miron', 'voyeur', 'solo mirar', 'mirar'],
};

const ROLE_LOOKUP = PROFILE_ROLE_OPTIONS.reduce((acc, option) => {
  const canonical = option.value;
  acc[normalizeKey(canonical)] = canonical;
  const aliases = ROLE_ALIASES[canonical] || [];
  aliases.forEach((alias) => {
    acc[normalizeKey(alias)] = canonical;
  });
  return acc;
}, {});

export const normalizeProfileRole = (rawRole) => {
  const normalized = normalizeKey(rawRole);
  if (!normalized) return null;
  return ROLE_LOOKUP[normalized] || null;
};

export const resolveProfileRole = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeProfileRole(candidate);
    if (normalized) return normalized;
  }
  return null;
};

export const getProfileRoleBadgeMeta = (rawRole) => {
  const value = normalizeProfileRole(rawRole);
  if (!value) return null;
  return {
    value,
    label: value,
    badgeClassName: ROLE_STYLE_BY_VALUE[value]?.badgeClassName || ROLE_STYLE_BY_VALUE.Activo.badgeClassName,
    avatarRingColor: ROLE_STYLE_BY_VALUE[value]?.avatarRingColor || ROLE_STYLE_BY_VALUE.Activo.avatarRingColor,
  };
};
