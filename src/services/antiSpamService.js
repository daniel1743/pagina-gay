import { auth, db } from '@/config/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { checkDuplicateSpamBeforeSend } from '@/services/moderationAIService';

/**
 * Anti-Extraction + Anti-External-Contact moderation
 * --------------------------------------------------
 * Design goals:
 * - deterministic and low-cost
 * - hard to evade (normalization + compact matching + context window)
 * - backend-like enforcement from send service (client is not source of truth)
 */

const CTA_OPIN_BAUL = 'Usa OPIN o el Baul de Perfiles para compartir contacto de forma segura.';
const GENERIC_BLOCK_MESSAGE = 'Tu mensaje contiene contenido no permitido por las reglas del chat.';
const GENERIC_EXTERNAL_BLOCK_MESSAGE =
  'Por seguridad, no se permite compartir contactos ni invitar a plataformas externas.';

const MODERATION_CONFIG = {
  recentWindowSize: 5,
  fragmentationWindowSize: 3,
  contextMaxAgeMs: 5 * 60 * 1000,
  cacheTtlMs: 30 * 1000,
  strictBlockThreshold: 6,
  warnThreshold: 4,
  weights: {
    directPlatformTerm: 5,
    invitationPhrase: 4,
    urlPattern: 5,
    longNumericSequence: 5,
    suspiciousNumericFragment: 2,
    repeatedNumericMessages: 4,
    evasiveAbbreviation: 3,
    rivalChatMention: 6,
    emailPattern: 5,
    fragmentedContact: 5,
    invitationFollowedByDigits: 4,
  },
  sanctions: {
    muteMinutes: 60,
    suspendHours: 24,
    shadowbanHours: 72,
    enableShadowban: false,
  },
};

const PLATFORM_TERMS = [
  'telegram', 'tg', 't.me',
  'skype',
  'whatsapp', 'wsp', 'wpp', 'wa.me',
  'facebook', 'fb',
  'instagram', 'ig', 'insta',
  'discord', 'dc', 'discord.gg',
  'snap', 'snapchat',
];

const INVITATION_PHRASES = [
  'buscame',
  'escribeme',
  'te espero en',
  'mi grupo',
  'mi canal',
  'te paso',
  'agregame',
  'te agrego',
  'hablame por',
  'vamos a telegram',
  'tengo grupo',
  'grupo de tg',
  'grupo telegram',
  'chat latino',
  'contactame',
  'te dejo mi',
];

const RIVAL_CHAT_TERMS = [
  'otro chat',
  'chat alterno',
  'sala alterna',
  'grupo privado',
  'canal privado',
];

const DOMAIN_HINT_REGEX =
  /\b[a-z0-9-]{2,}\.(com|net|org|me|gg|io|ru|app|xyz|cl|es|co|ar|mx)\b/i;
const URL_REGEX = /(https?:\/\/|www\.)\S+/i;
const EMAIL_REGEX = /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i;
const LONG_DIGIT_SEQUENCE_REGEX = /\d{7,}/;
const SPACED_DIGITS_REGEX = /(?:\d[\s._\-]*){7,}/;

const EVASIVE_PATTERNS = [
  { regex: /t[\s._\-]*g\b/i, label: 'tg' },
  { regex: /t[\s._\-]*\.?[\s._\-]*m[\s._\-]*\.?[\s._\-]*e/i, label: 't.me' },
  { regex: /w[\s._\-]*(s|\$)[\s._\-]*p/i, label: 'wsp' },
  { regex: /i[\s._\-]*g\b/i, label: 'ig' },
  { regex: /f[\s._\-]*b\b/i, label: 'fb' },
  { regex: /d[\s._\-]*c\b/i, label: 'dc' },
  { regex: /tele[\s._\-]*gram/i, label: 'telegram' },
  { regex: /insta[\s._\-]*gram/i, label: 'instagram' },
  { regex: /face[\s._\-]*book/i, label: 'facebook' },
  { regex: /what[\s._\-]*s?app/i, label: 'whatsapp' },
];

const tempBanCache = new Map(); // compatibility API
const moderationContextCache = new Map();
const moderationStateCache = new Map();

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripAccents = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const applyLeetMap = (value = '') =>
  value
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b');

export function normalizeModerationText(rawMessage = '') {
  const raw = String(rawMessage || '');
  const lowered = stripAccents(raw.toLowerCase());
  const separatorNormalized = lowered.replace(/[|\\/:;,[\](){}<>]+/g, ' ');
  const collapsed = separatorNormalized.replace(/\s+/g, ' ').trim();
  const leetComparable = applyLeetMap(collapsed);
  const compact = leetComparable.replace(/[^a-z0-9]/g, '');
  const digitsOnly = raw.replace(/\D/g, '');
  const alphaOnly = collapsed.replace(/[^a-z]/g, '');

  return {
    raw,
    lowered,
    collapsed,
    compact,
    digitsOnly,
    alphaOnly,
    hasUrlPrefix: URL_REGEX.test(lowered),
    hasDomainHint: DOMAIN_HINT_REGEX.test(lowered),
    hasEmail: EMAIL_REGEX.test(lowered),
  };
}

const hasTokenTerm = (collapsed, term) => {
  const normalizedTerm = stripAccents(term.toLowerCase()).trim();
  if (!normalizedTerm) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegex(normalizedTerm)}(\\s|$)`, 'i');
  return pattern.test(collapsed);
};

const hasCompactTerm = (compact, term) => {
  const termCompact = applyLeetMap(stripAccents(term.toLowerCase())).replace(/[^a-z0-9]/g, '');
  // Evitar falsos positivos por bigramas cortos (ej: "ig" en "iglesia")
  if (!termCompact || termCompact.length < 3) return false;
  return compact.includes(termCompact);
};

const getContextKey = (roomId, userId) => `${roomId || 'global'}::${userId || 'unknown'}`;

const getContextEntries = (roomId, userId, now = Date.now()) => {
  const key = getContextKey(roomId, userId);
  const existing = moderationContextCache.get(key) || [];
  const filtered = existing.filter((entry) => now - entry.timestamp <= MODERATION_CONFIG.contextMaxAgeMs);
  moderationContextCache.set(key, filtered.slice(-MODERATION_CONFIG.recentWindowSize));
  return moderationContextCache.get(key) || [];
};

const pushContextEntry = (roomId, userId, entry) => {
  const key = getContextKey(roomId, userId);
  const existing = moderationContextCache.get(key) || [];
  const next = [...existing, entry].slice(-MODERATION_CONFIG.recentWindowSize);
  moderationContextCache.set(key, next);
};

const isMostlyNumericMessage = (normalized) => {
  const digits = normalized.digitsOnly.length;
  const letters = normalized.alphaOnly.length;
  return digits >= 3 && digits >= letters;
};

const evaluateContextualRisk = (currentNormalized, recentEntries = []) => {
  const matchedRules = [];
  let score = 0;

  const recentWindow = [...recentEntries, {
    compact: currentNormalized.compact,
    collapsed: currentNormalized.collapsed,
    digitsOnly: currentNormalized.digitsOnly,
    mostlyNumeric: isMostlyNumericMessage(currentNormalized),
    hasInvitation: false,
    hasPlatform: false,
  }].slice(-MODERATION_CONFIG.fragmentationWindowSize);

  const numericLike = recentWindow.filter((entry) => entry.mostlyNumeric || entry.digitsOnly.length >= 3);
  const joinedDigits = recentWindow.map((entry) => entry.digitsOnly || '').join('');

  if (numericLike.length >= 2 && joinedDigits.length >= 7) {
    score += MODERATION_CONFIG.weights.repeatedNumericMessages;
    matchedRules.push({
      id: 'repeated_numeric_messages',
      weight: MODERATION_CONFIG.weights.repeatedNumericMessages,
      evidence: `${numericLike.length} mensajes numericos recientes`,
      category: 'phone',
    });
  }

  const hadInvitationBefore = recentEntries.some((entry) => entry.hasInvitation);
  const hadPlatformBefore = recentEntries.some((entry) => entry.hasPlatform);
  if (hadInvitationBefore && currentNormalized.digitsOnly.length >= 3) {
    score += MODERATION_CONFIG.weights.invitationFollowedByDigits;
    matchedRules.push({
      id: 'invitation_followed_by_digits',
      weight: MODERATION_CONFIG.weights.invitationFollowedByDigits,
      evidence: 'invitacion seguida por numeros',
      category: 'phone',
    });
  }

  const compactLooksLikeHandle =
    /[a-z]{3,}\\d{2,}/.test(currentNormalized.compact) ||
    (currentNormalized.alphaOnly.length >= 4 && currentNormalized.digitsOnly.length >= 2);

  if (hadPlatformBefore && compactLooksLikeHandle) {
    score += MODERATION_CONFIG.weights.fragmentedContact;
    matchedRules.push({
      id: 'platform_then_handle_fragment',
      weight: MODERATION_CONFIG.weights.fragmentedContact,
      evidence: 'plataforma previa seguida por usuario/contacto',
      category: 'platform',
    });
  }

  const mergedCompact = recentWindow.map((entry) => entry.compact || '').join('');
  const mergedDigits = recentWindow.map((entry) => entry.digitsOnly || '').join('');
  const mergedCollapsed = recentWindow.map((entry) => entry.collapsed || '').join(' ');
  const hadInvitationAndPlatform = recentWindow.some((entry) => entry.hasInvitation) &&
    recentWindow.some((entry) => entry.hasPlatform);

  if (hadInvitationAndPlatform) {
    score += MODERATION_CONFIG.weights.invitationPhrase;
    matchedRules.push({
      id: 'invitation_platform_sequence',
      weight: MODERATION_CONFIG.weights.invitationPhrase,
      evidence: 'secuencia invitacion + plataforma en ventana reciente',
      category: 'invitation',
    });
  }

  const fragmentedPlatform = PLATFORM_TERMS.some((term) => {
    const termCompact = applyLeetMap(stripAccents(term.toLowerCase())).replace(/[^a-z0-9]/g, '');
    if (termCompact.length >= 3) {
      return mergedCompact.includes(termCompact);
    }
    if (['tg', 'ig', 'fb', 'dc'].includes(termCompact)) {
      const tokenPattern = new RegExp(`(^|\\s)${escapeRegex(termCompact)}(\\s|$)`, 'i');
      return tokenPattern.test(mergedCollapsed);
    }
    return false;
  });

  if (fragmentedPlatform && recentWindow.length >= 2) {
    score += MODERATION_CONFIG.weights.fragmentedContact;
    matchedRules.push({
      id: 'fragmented_platform_contact',
      weight: MODERATION_CONFIG.weights.fragmentedContact,
      evidence: 'plataforma fragmentada en multiples mensajes',
      category: 'platform',
    });
  }

  if (mergedDigits.length >= 9 && numericLike.length >= 2) {
    score += MODERATION_CONFIG.weights.fragmentedContact;
    matchedRules.push({
      id: 'fragmented_numeric_contact',
      weight: MODERATION_CONFIG.weights.fragmentedContact,
      evidence: 'telefono fragmentado en mensajes consecutivos',
      category: 'phone',
    });
  }

  return { score, matchedRules };
};

export function evaluateExternalContactRisk(message, recentEntries = []) {
  const normalized = normalizeModerationText(message);
  const matchedRules = [];
  let score = 0;

  const mark = (id, weight, evidence, category = 'generic') => {
    score += weight;
    matchedRules.push({ id, weight, evidence, category });
  };

  // URL and domain patterns
  if (normalized.hasUrlPrefix || normalized.hasDomainHint) {
    mark('url_pattern', MODERATION_CONFIG.weights.urlPattern, 'url o dominio detectado', 'url');
  }

  // Email
  if (normalized.hasEmail) {
    mark('email_pattern', MODERATION_CONFIG.weights.emailPattern, 'correo detectado', 'email');
  }

  // Long numeric sequence (direct or spaced)
  const compactedDigitsRaw = normalized.raw.replace(/(\d)[\s._\-\/|]+(?=\d)/g, '$1');
  if (LONG_DIGIT_SEQUENCE_REGEX.test(compactedDigitsRaw) || SPACED_DIGITS_REGEX.test(normalized.raw)) {
    mark('long_numeric_sequence', MODERATION_CONFIG.weights.longNumericSequence, 'secuencia numerica larga', 'phone');
  } else {
    const digits = normalized.digitsOnly.length;
    const visibleChars = normalized.raw.replace(/\s+/g, '').length || 1;
    const density = digits / visibleChars;
    if (digits >= 5 && density >= 0.35) {
      mark('suspicious_numeric_fragment', MODERATION_CONFIG.weights.suspiciousNumericFragment, 'densidad numerica sospechosa', 'phone');
    }
  }

  // Platform terms and invitation phrases
  let platformDetected = false;
  let invitationDetected = false;

  for (const term of PLATFORM_TERMS) {
    const tokenHit = hasTokenTerm(normalized.collapsed, term);
    const compactHit = hasCompactTerm(normalized.compact, term);
    if (tokenHit) {
      platformDetected = true;
      mark('direct_platform_term', MODERATION_CONFIG.weights.directPlatformTerm, term, 'platform');
      break;
    }
    if (compactHit) {
      platformDetected = true;
      mark('evasive_abbreviation', MODERATION_CONFIG.weights.evasiveAbbreviation, term, 'platform');
      break;
    }
  }

  for (const phrase of INVITATION_PHRASES) {
    if (hasTokenTerm(normalized.collapsed, phrase) || hasCompactTerm(normalized.compact, phrase)) {
      invitationDetected = true;
      mark('invitation_phrase', MODERATION_CONFIG.weights.invitationPhrase, phrase, 'invitation');
      break;
    }
  }

  for (const phrase of RIVAL_CHAT_TERMS) {
    if (hasTokenTerm(normalized.collapsed, phrase) || hasCompactTerm(normalized.compact, phrase)) {
      mark('rival_chat_mention', MODERATION_CONFIG.weights.rivalChatMention, phrase, 'invitation');
      break;
    }
  }

  for (const evasive of EVASIVE_PATTERNS) {
    if (evasive.regex.test(normalized.raw) || evasive.regex.test(normalized.collapsed)) {
      mark('evasive_abbreviation', MODERATION_CONFIG.weights.evasiveAbbreviation, evasive.label, 'platform');
      break;
    }
  }

  const contextual = evaluateContextualRisk(normalized, recentEntries);
  score += contextual.score;
  matchedRules.push(...contextual.matchedRules);

  const categories = new Set(matchedRules.map((rule) => rule.category));
  const highIntent =
    categories.has('url') ||
    categories.has('email') ||
    categories.has('phone') ||
    (platformDetected && invitationDetected) ||
    matchedRules.some((rule) => rule.id.startsWith('fragmented_'));

  const shouldBlock =
    score >= MODERATION_CONFIG.strictBlockThreshold ||
    (score >= MODERATION_CONFIG.warnThreshold && highIntent);

  const primaryCategory =
    categories.has('email') ? 'email' :
    categories.has('phone') ? 'phone_number' :
    categories.has('url') || categories.has('platform') || categories.has('invitation') ? 'forbidden_word' :
    'generic';

  return {
    score,
    shouldBlock,
    highIntent,
    primaryCategory,
    platformDetected,
    invitationDetected,
    normalized,
    matchedRules,
  };
}

const hashMessage = (value = '') => {
  let hash = 5381;
  const input = String(value || '');
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return `h_${(hash >>> 0).toString(16)}`;
};

const getModerationState = async (userId) => {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    return {
      offenseCount: 0,
      muteUntilMs: 0,
      suspendUntilMs: 0,
      shadowbanUntilMs: 0,
      strikes: 0,
    };
  }

  const cached = moderationStateCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt <= MODERATION_CONFIG.cacheTtlMs) {
    return cached.state;
  }

  const snapshot = await getDoc(doc(db, 'userModerationState', userId));
  const data = snapshot.exists() ? snapshot.data() : {};

  const state = {
    offenseCount: Number(data.contactOffenseCount || 0),
    muteUntilMs: data.contactMuteUntil?.toMillis?.() || 0,
    suspendUntilMs: data.contactSuspendUntil?.toMillis?.() || 0,
    shadowbanUntilMs: data.contactShadowbanUntil?.toMillis?.() || 0,
    strikes: Number(data.strikes || 0),
  };

  moderationStateCache.set(userId, { state, fetchedAt: Date.now() });
  return state;
};

const persistModerationState = async (userId, state) => {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;

  await setDoc(
    doc(db, 'userModerationState', userId),
    {
      strikes: Number(state.strikes || 0), // field required by rules
      contactOffenseCount: Number(state.offenseCount || 0),
      contactMuteUntil: state.muteUntilMs ? new Date(state.muteUntilMs) : null,
      contactSuspendUntil: state.suspendUntilMs ? new Date(state.suspendUntilMs) : null,
      contactShadowbanUntil: state.shadowbanUntilMs ? new Date(state.shadowbanUntilMs) : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  moderationStateCache.set(userId, { state, fetchedAt: Date.now() });
};

const logModerationEvent = async ({
  userId,
  roomId,
  message,
  normalized,
  matchedRules,
  actionTaken,
  riskScore,
}) => {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) return;

  try {
    await addDoc(collection(db, 'moderationLogs'), {
      userId,
      roomId: roomId || 'global',
      message: String(message || '').slice(0, 500),
      result: actionTaken,
      reason: GENERIC_EXTERNAL_BLOCK_MESSAGE,
      severity: riskScore >= 10 ? 'high' : riskScore >= 6 ? 'medium' : 'low',
      action: actionTaken,
      muteMins: actionTaken === 'temporary_mute' ? MODERATION_CONFIG.sanctions.muteMinutes : 0,
      detectedBy: 'anti_extraction_v1',
      createdAt: serverTimestamp(),
      messageHash: hashMessage(message),
      normalizedIndicators: {
        collapsed: normalized.collapsed.slice(0, 180),
        compact: normalized.compact.slice(0, 180),
        digitsLen: normalized.digitsOnly.length,
      },
      matchedRules: matchedRules.map((rule) => ({
        id: rule.id,
        weight: rule.weight,
        evidence: String(rule.evidence || '').slice(0, 80),
      })),
      riskScore,
    });
  } catch (error) {
    // no-op: logging must never block chat
    console.warn('[ANTI-SPAM] moderationLogs write failed:', error?.message || error);
  }
};

const resolveActiveSanction = (state, now = Date.now()) => {
  if (state.shadowbanUntilMs && now < state.shadowbanUntilMs) {
    return {
      active: true,
      type: 'shadowban',
      reason: GENERIC_BLOCK_MESSAGE,
      remainingMinutes: Math.ceil((state.shadowbanUntilMs - now) / 60000),
    };
  }

  if (state.suspendUntilMs && now < state.suspendUntilMs) {
    return {
      active: true,
      type: 'temp_ban',
      reason: 'Tu cuenta tiene una suspension temporal por incumplir reglas del chat.',
      remainingMinutes: Math.ceil((state.suspendUntilMs - now) / 60000),
    };
  }

  if (state.muteUntilMs && now < state.muteUntilMs) {
    return {
      active: true,
      type: 'temp_ban',
      reason: 'No puedes enviar mensajes temporalmente por incumplir reglas del chat.',
      remainingMinutes: Math.ceil((state.muteUntilMs - now) / 60000),
    };
  }

  return { active: false };
};

const classifyPenaltyAction = (offenseCount) => {
  if (offenseCount <= 1) return 'warn_and_block_message';
  if (offenseCount === 2) return 'temporary_mute';
  if (offenseCount >= 3) {
    return MODERATION_CONFIG.sanctions.enableShadowban ? 'shadowban' : 'temporary_suspend';
  }
  return 'warn_and_block_message';
};

const applyPenaltyIfNeeded = async ({
  userId,
  roomId,
  message,
  normalized,
  matchedRules,
  riskScore,
  dryRun,
}) => {
  if (!userId || dryRun || !auth.currentUser || auth.currentUser.uid !== userId) {
    return {
      penaltyAction: 'warn_and_block_message',
      offenseCount: 1,
      remainingMinutes: null,
    };
  }

  const now = Date.now();
  const state = await getModerationState(userId);
  const activeSanction = resolveActiveSanction(state, now);

  if (activeSanction.active) {
    return {
      penaltyAction: activeSanction.type,
      offenseCount: state.offenseCount,
      remainingMinutes: activeSanction.remainingMinutes,
      alreadySanctioned: true,
      reason: activeSanction.reason,
    };
  }

  const nextOffenseCount = (state.offenseCount || 0) + 1;
  const penaltyAction = classifyPenaltyAction(nextOffenseCount);

  const nextState = {
    ...state,
    offenseCount: nextOffenseCount,
    muteUntilMs: state.muteUntilMs || 0,
    suspendUntilMs: state.suspendUntilMs || 0,
    shadowbanUntilMs: state.shadowbanUntilMs || 0,
  };

  if (penaltyAction === 'temporary_mute') {
    nextState.muteUntilMs = now + MODERATION_CONFIG.sanctions.muteMinutes * 60 * 1000;
  } else if (penaltyAction === 'temporary_suspend') {
    nextState.suspendUntilMs = now + MODERATION_CONFIG.sanctions.suspendHours * 60 * 60 * 1000;
  } else if (penaltyAction === 'shadowban') {
    nextState.shadowbanUntilMs = now + MODERATION_CONFIG.sanctions.shadowbanHours * 60 * 60 * 1000;
  }

  await persistModerationState(userId, nextState);
  await logModerationEvent({
    userId,
    roomId,
    message,
    normalized,
    matchedRules,
    actionTaken: penaltyAction,
    riskScore,
  });

  return {
    penaltyAction,
    offenseCount: nextOffenseCount,
    remainingMinutes:
      penaltyAction === 'temporary_mute'
        ? MODERATION_CONFIG.sanctions.muteMinutes
        : penaltyAction === 'temporary_suspend'
          ? MODERATION_CONFIG.sanctions.suspendHours * 60
          : penaltyAction === 'shadowban'
            ? MODERATION_CONFIG.sanctions.shadowbanHours * 60
            : null,
  };
};

const deriveBlockedType = (primaryCategory) => {
  if (primaryCategory === 'email') return 'email';
  if (primaryCategory === 'phone_number') return 'phone_number';
  return 'forbidden_word';
};

const buildBlockedResponse = (type, penalty = {}, fallbackReason = GENERIC_EXTERNAL_BLOCK_MESSAGE) => {
  if (penalty.alreadySanctioned && penalty.reason) {
    return {
      allowed: false,
      type: penalty.penaltyAction === 'shadowban' ? 'shadowban' : 'temp_ban',
      reason: penalty.reason,
      details: CTA_OPIN_BAUL,
      remainingMinutes: penalty.remainingMinutes || null,
    };
  }

  if (penalty.penaltyAction === 'temporary_mute') {
    return {
      allowed: false,
      type: 'temp_ban',
      reason: `No puedes enviar mensajes por ${penalty.remainingMinutes || MODERATION_CONFIG.sanctions.muteMinutes} minutos.`,
      details: CTA_OPIN_BAUL,
      remainingMinutes: penalty.remainingMinutes || MODERATION_CONFIG.sanctions.muteMinutes,
    };
  }

  if (penalty.penaltyAction === 'temporary_suspend') {
    return {
      allowed: false,
      type: 'temp_ban',
      reason: `Tu cuenta quedo suspendida temporalmente por ${penalty.remainingMinutes || (MODERATION_CONFIG.sanctions.suspendHours * 60)} minutos.`,
      details: CTA_OPIN_BAUL,
      remainingMinutes: penalty.remainingMinutes || (MODERATION_CONFIG.sanctions.suspendHours * 60),
    };
  }

  if (penalty.penaltyAction === 'shadowban') {
    return {
      allowed: false,
      type: 'shadowban',
      reason: GENERIC_BLOCK_MESSAGE,
      details: CTA_OPIN_BAUL,
      remainingMinutes: penalty.remainingMinutes,
    };
  }

  return {
    allowed: false,
    type,
    reason: fallbackReason,
    details: CTA_OPIN_BAUL,
  };
};

const shouldApplyStrictMode = (userId) => {
  if (!userId) return true;
  if (userId.startsWith('unauthenticated_')) return true;
  const provider = auth.currentUser?.providerData?.[0]?.providerId;
  return !auth.currentUser || provider === 'anonymous';
};

/**
 * Compatibility API - now it blocks instead of sanitizing.
 */
export function sanitizePhoneNumbers(message) {
  const risk = evaluateExternalContactRisk(message, []);
  return {
    sanitized: String(message || '').trim(),
    wasModified: false,
    numbersFound: risk.normalized.digitsOnly.length >= 7 ? 1 : 0,
    hasContactIntent: risk.matchedRules.some((rule) => rule.id === 'invitation_phrase'),
  };
}

/**
 * Compatibility API used in older flows.
 */
export function processMessageContent(message) {
  return {
    content: String(message || '').trim(),
    allowed: true,
    wasModified: false,
    reason: null,
  };
}

/**
 * Compatibility API used by legacy UI checks.
 */
export async function clearUserTempBan(userId) {
  if (!userId) return;
  tempBanCache.delete(userId);
  const cached = moderationStateCache.get(userId);
  if (cached) {
    cached.state.muteUntilMs = 0;
    cached.state.suspendUntilMs = 0;
    cached.state.shadowbanUntilMs = 0;
    moderationStateCache.set(userId, cached);
  }
}

/**
 * Compatibility API used by legacy checks.
 */
export async function checkTempBan(userId) {
  if (!userId) return { isBanned: false };

  const cached = tempBanCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      isBanned: true,
      reason: cached.reason || GENERIC_BLOCK_MESSAGE,
      remainingMinutes: Math.ceil((cached.expiresAt - Date.now()) / 60000),
    };
  }

  try {
    const state = await getModerationState(userId);
    const active = resolveActiveSanction(state, Date.now());
    if (active.active) {
      return {
        isBanned: true,
        reason: active.reason,
        remainingMinutes: active.remainingMinutes,
      };
    }
  } catch (error) {
    console.warn('[ANTI-SPAM] checkTempBan error:', error?.message || error);
  }

  return { isBanned: false };
}

/**
 * Main moderation gate.
 * options:
 * - dryRun: true => evaluate only (no strikes/sanctions writes)
 */
export async function validateMessage(message, userId, username, roomId, options = {}) {
  const opts = {
    dryRun: false,
    ...options,
  };

  try {
    const raw = String(message || '');
    const trimmed = raw.trim();

    if (!trimmed) {
      return { allowed: true, content: '', wasModified: false, riskScore: 0, matchedRules: [] };
    }

    const now = Date.now();

    // Legacy duplicate spam guard (kept)
    const duplicateCheck = checkDuplicateSpamBeforeSend(userId, trimmed);
    if (duplicateCheck.block) {
      return {
        allowed: false,
        content: trimmed,
        type: duplicateCheck.type,
        reason: duplicateCheck.reason || GENERIC_BLOCK_MESSAGE,
        muteMins: duplicateCheck.muteMins,
      };
    }

    const recentEntries = getContextEntries(roomId, userId, now);
    const risk = evaluateExternalContactRisk(trimmed, recentEntries);
    const strictMode = shouldApplyStrictMode(userId);

    const entryForContext = {
      timestamp: now,
      compact: risk.normalized.compact,
      collapsed: risk.normalized.collapsed,
      digitsOnly: risk.normalized.digitsOnly,
      mostlyNumeric: isMostlyNumericMessage(risk.normalized),
      hasInvitation: risk.matchedRules.some((rule) => rule.id === 'invitation_phrase'),
      hasPlatform: risk.matchedRules.some((rule) => rule.category === 'platform'),
    };

    pushContextEntry(roomId, userId, entryForContext);

    const shouldBlock =
      risk.shouldBlock ||
      (strictMode && risk.score >= MODERATION_CONFIG.warnThreshold);

    if (!shouldBlock) {
      return {
        allowed: true,
        content: trimmed,
        wasModified: false,
        riskScore: risk.score,
        matchedRules: risk.matchedRules,
      };
    }

    const penalty = await applyPenaltyIfNeeded({
      userId,
      roomId,
      message: trimmed,
      normalized: risk.normalized,
      matchedRules: risk.matchedRules,
      riskScore: risk.score,
      dryRun: opts.dryRun,
    });

    const blockedType = deriveBlockedType(risk.primaryCategory);
    const blocked = buildBlockedResponse(
      blockedType,
      penalty,
      risk.primaryCategory === 'email'
        ? 'Correos electronicos no estan permitidos en el chat principal.'
        : risk.primaryCategory === 'phone_number'
          ? 'No se permite compartir numeros de telefono en el chat principal.'
          : GENERIC_EXTERNAL_BLOCK_MESSAGE
    );

    return {
      ...blocked,
      content: trimmed,
      riskScore: risk.score,
      matchedRules: risk.matchedRules,
      offenseCount: penalty.offenseCount,
    };
  } catch (error) {
    console.error('[ANTI-SPAM] validateMessage error:', error);
    // fail-safe: do not break chat on moderation errors
    return {
      allowed: true,
      content: String(message || '').trim(),
      wasModified: false,
      riskScore: 0,
      matchedRules: [],
    };
  }
}

// periodic cleanup
setInterval(() => {
  const now = Date.now();

  for (const [key, value] of moderationContextCache.entries()) {
    const filtered = (value || []).filter((entry) => now - entry.timestamp <= MODERATION_CONFIG.contextMaxAgeMs);
    if (filtered.length === 0) moderationContextCache.delete(key);
    else moderationContextCache.set(key, filtered);
  }

  for (const [userId, cache] of moderationStateCache.entries()) {
    if (!cache?.fetchedAt || now - cache.fetchedAt > 10 * MODERATION_CONFIG.cacheTtlMs) {
      moderationStateCache.delete(userId);
    }
  }

  for (const [userId, ban] of tempBanCache.entries()) {
    if (!ban?.expiresAt || ban.expiresAt <= now) {
      tempBanCache.delete(userId);
    }
  }
}, 60 * 1000);
