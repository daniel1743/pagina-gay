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
    badgeClassName: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  },
  'Versátil Act': {
    badgeClassName: 'border-violet-400/35 bg-violet-500/10 text-violet-200',
  },
  'Versátil Pasivo': {
    badgeClassName: 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-200',
  },
  'Pasivo': {
    badgeClassName: 'border-slate-400/45 bg-slate-500/10 text-slate-200',
  },
  'Inter': {
    badgeClassName: 'border-sky-400/35 bg-sky-500/10 text-sky-200',
  },
  'Hetero Curioso': {
    badgeClassName: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
  },
  'Solo Mamar': {
    badgeClassName: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  },
  'Solo Ver': {
    badgeClassName: 'border-zinc-400/40 bg-zinc-500/10 text-zinc-200',
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
  };
};
