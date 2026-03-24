export const ONBOARDING_COMUNA_KEY = 'chactivo:comuna';

export const COMUNA_OPTIONS = [
  'Santiago Centro',
  'Providencia',
  'Ñuñoa',
  'Las Condes',
  'La Reina',
  'La Florida',
  'Macul',
  'Peñalolén',
  'San Miguel',
  'Maipú',
  'Puente Alto',
  'Quilicura',
  'Independencia',
  'Recoleta',
  'Estación Central',
  'San Bernardo',
  'Viña del Mar',
  'Valparaíso',
  'Quilpué',
  'Villa Alemana',
  'Rancagua',
  'Concepción',
  'Temuco',
  'Antofagasta',
  'Otra comuna o ciudad',
];

const COMUNA_ALIAS_MAP = new Map([
  ['santiago', 'Santiago Centro'],
  ['stgo', 'Santiago Centro'],
  ['stgo centro', 'Santiago Centro'],
  ['vina', 'Viña del Mar'],
  ['vina del mar', 'Viña del Mar'],
  ['valpo', 'Valparaíso'],
  ['nunoa', 'Ñuñoa'],
]);

const normalizeKey = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const getComunaKey = (value = '') => normalizeKey(value);

export const normalizeComuna = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const normalizedKey = normalizeKey(raw);
  if (!normalizedKey) return '';

  const aliased = COMUNA_ALIAS_MAP.get(normalizedKey);
  if (aliased) return aliased;

  const knownOption = COMUNA_OPTIONS.find((option) => normalizeKey(option) === normalizedKey);
  if (knownOption) return knownOption;

  return raw.replace(/\s+/g, ' ').trim();
};
