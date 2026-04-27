const PRIVATE_CHAT_EARLY_CONTACT_BLOCK_MESSAGE = 'Por seguridad, todavía no pueden compartir telefonos, redes ni links en este chat. Primero conversen un poco dentro de Chactivo.';

const PHONE_CANDIDATE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const EXTERNAL_LINK_REGEX = /\b(?:(?:https?:\/\/|www\.)\S+)\b/gi;
const HANDLE_REGEX = /(^|\s)@[a-z0-9._-]{3,}\b/gi;
const PLATFORM_HANDLE_REGEXES = [
  /\b(?:instagram|ig|telegram|tiktok|facebook|fb|discord|signal|messenger|teams|skype)\s*[:\-]?\s*[a-z0-9._-]{3,}\b/gi,
  /\b(?:whatsapp|wsp|wa\.me|sms|imessage|mensaje(?:s)?\s+de\s+texto)\s*[:\-]?\s*(?:\+?\d[\d\s().-]{7,}\d|[a-z0-9._-]{3,})\b/gi,
];
const PLATFORM_REGEX = /\b(?:whatsapp|wsp|wa\.me|telegram|t\.me|instagram|ig|facebook|fb|tiktok|discord|signal|messenger|teams|skype|sms|imessage|mensaje(?:s)?\s+de\s+texto)\b/gi;
const CONTACT_PROMPT_REGEX = /\b(?:mi|agregame|agr[eé]game|escribeme|escr[ií]beme|hablame|h[aá]blame|contactame|cont[aá]ctame|dm|direct|inbox|numero|n[uú]mero|hablemos|te\s+paso|te\s+mando|por\s+fuera|otra\s+app|otra\s+aplicacion|afuera\s+de\s+chactivo|fuera\s+de\s+chactivo)\b/gi;

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

export const detectPrivateChatExternalContact = (value = '') => {
  const text = normalizeText(value);
  if (!text) {
    return {
      hasExternalContact: false,
      matchedRules: [],
    };
  }

  const matchedRules = [];

  if (getPhoneMatches(text).length > 0) {
    matchedRules.push({ id: 'phone_number' });
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

  PLATFORM_HANDLE_REGEXES.forEach((regex) => {
    if (hasRegexMatch(text, regex)) {
      matchedRules.push({ id: 'platform_handle' });
    }
  });

  const hasPlatform = hasRegexMatch(text, PLATFORM_REGEX);
  const hasContactPrompt = hasRegexMatch(text, CONTACT_PROMPT_REGEX);
  if (hasPlatform && hasContactPrompt) {
    matchedRules.push({ id: 'platform_redirect' });
  }

  return {
    hasExternalContact: matchedRules.length > 0,
    matchedRules,
  };
};

export const getPrivateChatEarlyContactBlockMessage = () => PRIVATE_CHAT_EARLY_CONTACT_BLOCK_MESSAGE;
