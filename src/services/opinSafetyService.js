const OPIN_PUBLIC_BLOCK_MESSAGE = 'Por seguridad, no compartas telefonos, redes ni usuarios externos en OPIN. Usa Buzon o chat interno.';

const PHONE_CANDIDATE_REGEX = /\+?\d[\d\s().-]{6,}\d/g;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const EXTERNAL_LINK_REGEX = /\b(?:(?:https?:\/\/|www\.)\S+)\b/gi;
const HANDLE_REGEX = /(^|\s)@[a-z0-9._-]{3,}\b/gi;
const PLATFORM_REGEXES = [
  { id: 'whatsapp', regex: /\b(?:whatsapp|wsp|wa\.me)\b/gi },
  { id: 'telegram', regex: /\b(?:telegram|t\.me)\b/gi },
  { id: 'instagram', regex: /\b(?:instagram|ig)\b/gi },
  { id: 'facebook', regex: /\b(?:facebook|fb)\b/gi },
  { id: 'tiktok', regex: /\b(?:tiktok)\b/gi },
];

const HIDDEN_CONTACT = '[contacto oculto por seguridad]';
const HIDDEN_EMAIL = '[correo oculto por seguridad]';
const HIDDEN_EXTERNAL = '[contacto externo oculto]';

const normalizeText = (value = '') => String(value || '').trim();

const isPhoneLikeMatch = (candidate = '') => {
  const digitsOnly = candidate.replace(/\D/g, '');
  return digitsOnly.length >= 9 && digitsOnly.length <= 15;
};

const getPhoneMatches = (text = '') => (
  Array.from(text.matchAll(PHONE_CANDIDATE_REGEX))
    .map((match) => match[0])
    .filter(isPhoneLikeMatch)
);

const hasRegexMatch = (text, regex) => {
  regex.lastIndex = 0;
  return regex.test(text);
};

export const validateOpinPublicText = (value = '') => {
  const text = normalizeText(value);
  if (!text) {
    return {
      allowed: true,
      reason: null,
      blockedType: null,
      matchedRules: [],
    };
  }

  const matchedRules = [];
  const phoneMatches = getPhoneMatches(text);

  if (phoneMatches.length > 0) {
    matchedRules.push({ id: 'phone_number', count: phoneMatches.length });
  }

  if (hasRegexMatch(text, EMAIL_REGEX)) {
    matchedRules.push({ id: 'email' });
  }

  if (hasRegexMatch(text, EXTERNAL_LINK_REGEX)) {
    matchedRules.push({ id: 'external_link' });
  }

  if (hasRegexMatch(text, HANDLE_REGEX)) {
    matchedRules.push({ id: 'external_handle' });
  }

  PLATFORM_REGEXES.forEach((entry) => {
    if (hasRegexMatch(text, entry.regex)) {
      matchedRules.push({ id: entry.id });
    }
  });

  if (matchedRules.length === 0) {
    return {
      allowed: true,
      reason: null,
      blockedType: null,
      matchedRules: [],
    };
  }

  return {
    allowed: false,
    reason: OPIN_PUBLIC_BLOCK_MESSAGE,
    blockedType: matchedRules[0]?.id || 'external_contact',
    matchedRules,
  };
};

export const sanitizeOpinPublicText = (value = '') => {
  const original = String(value || '');
  let sanitized = original;

  sanitized = sanitized.replace(PHONE_CANDIDATE_REGEX, (match) => (
    isPhoneLikeMatch(match) ? HIDDEN_CONTACT : match
  ));
  sanitized = sanitized.replace(EMAIL_REGEX, HIDDEN_EMAIL);
  sanitized = sanitized.replace(EXTERNAL_LINK_REGEX, HIDDEN_EXTERNAL);
  sanitized = sanitized.replace(HANDLE_REGEX, (match, prefix = '') => `${prefix}${HIDDEN_EXTERNAL}`);

  PLATFORM_REGEXES.forEach(({ regex }) => {
    sanitized = sanitized.replace(regex, HIDDEN_EXTERNAL);
  });

  return sanitized;
};

export const getOpinPublicBlockMessage = () => OPIN_PUBLIC_BLOCK_MESSAGE;
