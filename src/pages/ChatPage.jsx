import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { useChatScrollManager } from '@/hooks/useChatScrollManager';

import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import NewMessagesIndicator from '@/components/chat/NewMessagesIndicator';
import ScreenSaver from '@/components/chat/ScreenSaver';

import UserProfileModal from '@/components/chat/UserProfileModal';
import UserActionsModal from '@/components/chat/UserActionsModal';
import ReportModal from '@/components/chat/ReportModal';
import PrivateChatRequestModal from '@/components/chat/PrivateChatRequestModal';
import PrivateChatInviteToast from '@/components/chat/PrivateChatInviteToast';
import PrivateChatDirectMessageToast from '@/components/chat/PrivateChatDirectMessageToast';
import VerificationModal from '@/components/chat/VerificationModal';
import TypingIndicator from '@/components/chat/TypingIndicator';
// ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
// import { PremiumWelcomeModal } from '@/components/chat/PremiumWelcomeModal';
// ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
// import ChatRulesModal from '@/components/chat/ChatRulesModal';
import AgeVerificationModal from '@/components/chat/AgeVerificationModal';
// ⚠️ ChatLandingPage COMENTADO - Experimento directo al chat sin landing
// import ChatLandingPage from '@/components/chat/ChatLandingPage';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
// ⚠️ MODALES DE INSTRUCCIONES ELIMINADOS (17/01/2026) - A petición del usuario
// import LoadingMessagesPrompt from '@/components/chat/LoadingMessagesPrompt';
import ReplyIndicator from '@/components/chat/ReplyIndicator';
// 🎯 OPIN Discovery Banner - Para que invitados descubran OPIN
// 📢 Telegram Banner - Promoción del grupo
import TelegramBanner from '@/components/ui/TelegramBanner';
import ChatBottomNav from '@/components/chat/ChatBottomNav';
import FeaturedChannelsColumn from '@/components/featured/FeaturedChannelsColumn';
import ChatOnlineUsersColumn from '@/components/chat/ChatOnlineUsersColumn';
import ChatPrimaryResolutionPanel from '@/components/chat/ChatPrimaryResolutionPanel';
import { useEngagementNudge } from '@/hooks/useEngagementNudge';
// ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
// import RulesBanner from '@/components/chat/RulesBanner';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';
import {
  sendMessage,
  subscribeToRoomMessages,
  addReactionToMessage,
  deleteMessageWithMedia,
  deleteUserMessagesInRoom,
  deleteAllMessagesInRoom,
  markMessagesAsRead,
  generateUUID
} from '@/services/chatService';
import { CHAT_AVAILABILITY_HEARTBEAT_MS, joinRoom, leaveRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, updateUserActivity, cleanInactiveUsers, filterActiveUsers, subscribeToTypingUsers, updatePresenceFields, validateUserAvailabilityInRoom, isUserAvailableForConversation, getPresenceActivityMs } from '@/services/presenceService';
import { validateMessage, detectCriticalSafetyRisk, checkTempBan } from '@/services/antiSpamService';
import { auth, db } from '@/config/firebase'; // ✅ CRÍTICO: Necesario para obtener UID real de Firebase Auth
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { evaluateMessage, checkAIMute, formatMuteRemaining } from '@/services/moderationAIService';
import {
  sendPrivateChatRequest,
  respondToPrivateChatRequest,
  subscribeToNotifications,
  subscribeToPrivateInbox,
  subscribeToPrivateMatchState,
  markPrivateInboxConversationRead,
  markNotificationAsRead,
  getOrCreatePrivateChat,
  signalPrivateChatOpen,
  upsertPrivateMatchState,
  respondToPrivateGroupInvite
} from '@/services/socialService';
import { subscribeToBlockedUsers, isBlocked, isBlockedBetween } from '@/services/blockService';
import { requestNotificationPermission, canRequestPush, setupForegroundMessages } from '@/services/pushNotificationService';
// ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
// import { sendModeratorWelcome } from '@/services/moderatorWelcome';
// ⚠️ BOTS ELIMINADOS (06/01/2026) - A petición del usuario
// import { checkAndSeedConversations } from '@/services/seedConversationsService';
import { track, getSessionId, trackPageView, trackPageExit, trackRoomJoined, trackMessageSent } from '@/services/eventTrackingService';
import { useCanonical } from '@/hooks/useCanonical';
import { checkUserSanctions, createSanction, SANCTION_TYPES, SANCTION_REASONS } from '@/services/sanctionsService';
import { roomsData, canAccessRoom } from '@/config/rooms';
import { traceEvent, TRACE_EVENTS, isMessageTraceEnabled } from '@/utils/messageTrace';
import { startEngagementTracking, hasReachedOneHourLimit, getTotalEngagementTime, hasSeenEngagementModal, markEngagementModalAsShown } from '@/services/engagementService';
import { notificationSounds, initAudioOnFirstGesture } from '@/services/notificationSounds';
import { monitorActivityAndSendVOC, resetVOCCooldown } from '@/services/vocService';
import { generateNicoWelcome, sendNicoQuestion, getLastNicoMessageAge, NICO, QUESTION_INTERVAL_MS } from '@/services/nicoBot';
import ProCongratsModal from '@/components/rewards/ProCongratsModal';
import { markReminderPopupShown, wasReminderPopupShown, cleanOldReminders } from '@/utils/eventReminderUtils';
import { registrarParticipacionEvento } from '@/services/eventosService';
import { resolveProfileRole } from '@/config/profileRoles';
import { COMUNA_OPTIONS, getComunaKey, normalizeComuna, ONBOARDING_COMUNA_KEY } from '@/config/comunas';
import { MessageCircle } from 'lucide-react';
import { getOpenOpinIntentsByUserIds, getOpinPostActivityMs, getOpinStatusMeta } from '@/services/opinService';
import { readPendingPrivateChatRestore, clearPendingPrivateChatRestore } from '@/utils/privateChatRestore';
import { clearSeoFunnelContext, readSeoFunnelContext } from '@/utils/seoFunnelContext';
import { hasValidGuestCommunityAccess, syncGuestCommunityAccess } from '@/utils/communityPolicyGuard';
import { ENABLE_BAUL } from '@/config/featureFlags';
import '@/utils/chatDiagnostics'; // 🔍 Cargar diagnóstico en consola
import { 
  trackChatLoad, 
  trackMessagesLoad, 
  trackMessagesSubscription,
  trackMessageSent as trackMessageSentPerformance,
  startTiming,
  endTiming,
} from '@/utils/performanceMonitor';

const roomWelcomeMessages = {
  // 'global': '¡Bienvenido a Chat Global! Habla de lo que quieras.', // ⚠️ DESACTIVADA
  'principal': '¡Bienvenido a Chat Principal! Habla de lo que quieras.',
  'hetero-general': '¡Bienvenido al Chat Principal! Conversa, conoce gente y pásalo bien.',
  'gaming': '¡Gamers, uníos! ¿A qué están jugando?',
  'mas-30': 'Espacio para mayores de 30. ¡Comparte tus experiencias!',
  'amistad': '¿Buscas nuevos amigos? ¡Este es el lugar!',
  'santiago': '🏙️ ¡Bienvenido a la sala de Santiago! Gays de la capital, ¿qué tal el día?',
  'valparaiso': '🌊 ¡Bienvenido a la sala de Valparaíso! Puerto, cerros y buena onda.',
  'osos-activos': 'Sala para osos activos y quienes los buscan. ¡Grrr!',
  'pasivos-buscando': 'Pasivos buscando activos. ¡Encuentra tu match!',
  'versatiles': 'Para los versátiles que disfrutan de todo. ¡Bienvenidos!',
  'quedar-ya': '¿Quieres organizar algo? ¡Coordina aquí!',
  'hablar-primero': 'Para los que prefieren conocerse bien antes de todo.',
  'morbosear': 'Sala para conversar con un toque de morbo. ¡Con respeto!',
};

// 🤖 NICO BOT: DESACTIVADO POR SPAM EN SALA PRINCIPAL
const NICO_BOT_ENABLED = false;
const PRIVATE_MATCH_IDLE_MS = 30000;
const PRIVATE_MATCH_NO_RESPONSE_MS = 20000;
const PRIVATE_MATCH_FRUSTRATION_MS = 20000;
const PRIVATE_MATCH_REQUEST_WINDOW_MS = 30000;
const PRIVATE_MATCH_COOLDOWN_MS = 2 * 60 * 1000;
const IN_PRIVATE_STRIP_INTERVAL_MS = 45 * 1000;
const IN_PRIVATE_STRIP_VISIBLE_MS = 7 * 1000;
const PRIVATE_MATCH_QUICK_GREETINGS = ['Hola 👋', '¿Qué haces?', '¿De dónde eres?'];
const RANDOM_CONNECT_SOURCE = 'random_connect_chain';
const RANDOM_CONNECT_STARTERS = ['Hola 👋', '¿Qué tal?', '¿De dónde eres?', '¿Te tinca hablar?'];
const PRIVATE_MATCH_TOP_LIMIT = 3;
const PRIVATE_MATCH_INTENT_WINDOW_MS = 45 * 60 * 1000;
const PRIVATE_MATCH_INITIAL_SUGGESTION_DELAY_MS = 6000;
const PRIVATE_MATCH_SUGGESTION_VISIBLE_MS = 18000;
const PRIVATE_MATCH_FETCH_LIMIT = 15;
const PRIVATE_MATCH_OPIN_CACHE_TTL_MS = 5 * 60 * 1000;
const PRESENCE_HEARTBEAT_IDLE_GRACE_MS = 12 * 60 * 1000;
const PRIVATE_UI_MEMORY_STORAGE_PREFIX = 'chactivo:private_ui_memory:v1:';
const PRIVATE_UI_NOTIFICATION_TTL_MS = 48 * 60 * 60 * 1000;
const PRIVATE_UI_REQUEST_SUPPRESSION_MS = 24 * 60 * 60 * 1000;
const PRIVATE_UI_REQUEST_COOLDOWN_MS = 2 * 60 * 1000;

const prunePrivateUiMemoryEntries = (entries = {}, now = Date.now()) => Object.entries(entries || {}).reduce((acc, [key, expiresAt]) => {
  const untilMs = Number(expiresAt || 0);
  if (!key || !Number.isFinite(untilMs) || untilMs <= now) return acc;
  acc[key] = untilMs;
  return acc;
}, {});

const getPrivateUiMemoryStorageKey = (userId) => {
  if (!userId) return null;
  return `${PRIVATE_UI_MEMORY_STORAGE_PREFIX}${userId}`;
};

const readPrivateUiMemoryEntries = (userId) => {
  const storageKey = getPrivateUiMemoryStorageKey(userId);
  if (!storageKey || typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return prunePrivateUiMemoryEntries(parsed);
  } catch {
    return {};
  }
};

const writePrivateUiMemoryEntries = (userId, entries = {}) => {
  const storageKey = getPrivateUiMemoryStorageKey(userId);
  if (!storageKey || typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(prunePrivateUiMemoryEntries(entries)));
  } catch {
    // noop
  }
};

const getPrivateNotificationSeenKey = (notificationId) => (
  notificationId ? `notification-seen:${notificationId}` : null
);

const getPrivateRequestMuteKey = (scope) => (
  scope ? `request-muted:${scope}` : null
);

const getPrivateRequestCooldownKey = (scope) => (
  scope ? `request-cooldown:${scope}` : null
);

const isChatDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return import.meta.env.DEV && (
    params.get('chatdebug') === '1' ||
    localStorage.getItem('ENABLE_CHAT_DEBUG') === 'true'
  );
};

const getRoleBucket = (roleLabel) => {
  const normalized = String(roleLabel || '').toLowerCase();
  if (normalized.includes('activo')) return 'activo';
  if (normalized.includes('pasivo')) return 'pasivo';
  if (normalized.includes('versátil') || normalized.includes('versatil')) return 'versatil';
  return 'otro';
};

const CHAT_SEEKING_BADGE_OPTIONS = [
  { key: 'activo', label: 'Busca activo' },
  { key: 'pasivo', label: 'Busca pasivo' },
  { key: 'versatil', label: 'Busca versátil' },
  { key: 'mamar', label: 'Busca mamar' },
];

const normalizeChatSeekingBadgeKey = (value) => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (!normalized) return null;
  if (normalized.includes('mamar') || normalized.includes('oral')) return 'mamar';
  if (normalized.includes('versatil')) return 'versatil';
  if (normalized.includes('activo')) return 'activo';
  if (normalized.includes('pasivo')) return 'pasivo';
  return null;
};

const getChatSeekingBadgeLabel = (value) => (
  CHAT_SEEKING_BADGE_OPTIONS.find((option) => option.key === value)?.label || null
);

const getDefaultChatSeekingBadgeKey = (roleLabel) => {
  const normalizedRole = resolveProfileRole(roleLabel);
  if (!normalizedRole) return null;

  if (normalizedRole === 'Pasivo') return 'activo';
  if (normalizedRole === 'Activo') return 'pasivo';
  if (
    normalizedRole === 'Versátil Act'
    || normalizedRole === 'Versátil Pasivo'
    || normalizedRole === 'Inter'
  ) {
    return 'versatil';
  }
  if (normalizedRole === 'Solo Mamar') return 'mamar';
  return null;
};

const getRoleCompatibilityScore = (selfRole, candidateRole) => {
  const selfBucket = getRoleBucket(selfRole);
  const candidateBucket = getRoleBucket(candidateRole);

  if (!selfRole && !candidateRole) return 20;
  if (!selfRole) {
    if (candidateBucket === 'activo' || candidateBucket === 'pasivo' || candidateBucket === 'versatil') return 70;
    return 40;
  }

  if (selfBucket === 'activo') {
    if (candidateBucket === 'pasivo') return 100;
    if (candidateBucket === 'versatil') return 92;
    if (candidateBucket === 'activo') return 55;
  }

  if (selfBucket === 'pasivo') {
    if (candidateBucket === 'activo') return 100;
    if (candidateBucket === 'versatil') return 90;
    if (candidateBucket === 'pasivo') return 52;
  }

  if (selfBucket === 'versatil') {
    if (candidateBucket === 'activo' || candidateBucket === 'pasivo') return 94;
    if (candidateBucket === 'versatil') return 82;
  }

  if (candidateBucket === 'otro') return 35;
  return 45;
};

const getComunaMatchBoost = (selfComuna, candidateComuna) => {
  const selfKey = getComunaKey(selfComuna);
  const candidateKey = getComunaKey(candidateComuna);
  if (!selfKey || !candidateKey) return 0;
  if (selfKey === candidateKey) return 28;
  return 0;
};

const clampScore = (value, min = 0, max = 100) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

const getActivityRecencyScore = (lastActivityMs, nowMs = Date.now()) => {
  if (!Number.isFinite(lastActivityMs)) return 18;
  const diffMs = Math.max(0, nowMs - lastActivityMs);
  if (diffMs <= 30 * 1000) return 100;
  if (diffMs <= 60 * 1000) return 92;
  if (diffMs <= 2 * 60 * 1000) return 78;
  if (diffMs <= 5 * 60 * 1000) return 58;
  if (diffMs <= 10 * 60 * 1000) return 38;
  return 20;
};

const getTimeProximityScore = ({ availableForChat = false, lastActivityMs = null, nowMs = Date.now() }) => {
  if (availableForChat) return 100;
  if (!Number.isFinite(lastActivityMs)) return 28;
  const diffMs = Math.max(0, nowMs - lastActivityMs);
  if (diffMs <= 60 * 1000) return 78;
  if (diffMs <= 3 * 60 * 1000) return 58;
  if (diffMs <= 10 * 60 * 1000) return 42;
  return 24;
};

const buildPrivateMatchReasons = ({ candidate = {}, nowMs = Date.now() }) => {
  const reasons = [];

  if (candidate?.sameComuna) {
    reasons.push('Misma comuna');
  }

  if (candidate?.availableForChat) {
    reasons.push('Disponible ahora');
  } else if (
    Number.isFinite(candidate?.lastActivityMs)
    && Math.max(0, nowMs - candidate.lastActivityMs) <= (2 * 60 * 1000)
  ) {
    reasons.push('Activo hace poco');
  }

  if (Number(candidate?.scoring?.compatibility || 0) >= 88) {
    reasons.push('Rol compatible');
  }

  if (candidate?.opinIntent || candidate?.intentSummary || candidate?.chatSeekingBadgeLabel) {
    reasons.push('Busca algo parecido');
  } else if (candidate?.opportunitySource === 'catalog') {
    reasons.push('Perfil alineado');
  }

  return Array.from(new Set(reasons)).slice(0, 4);
};

const buildPrivateMatchHeadline = (reasons = []) => {
  const safeReasons = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
  if (safeReasons.length === 0) return 'Compatible contigo ahora';
  if (safeReasons.includes('Misma comuna') && safeReasons.includes('Disponible ahora')) {
    return 'Misma comuna y disponible ahora';
  }
  if (safeReasons.includes('Rol compatible') && safeReasons.includes('Busca algo parecido')) {
    return 'Rol compatible y misma intención';
  }
  if (safeReasons.includes('Disponible ahora')) {
    return 'Disponible ahora para hablar';
  }
  return safeReasons.slice(0, 2).join(' · ');
};

const normalizeIntentText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokenizeSuggestionText = (value) => (
  normalizeIntentText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
);

const buildSuggestionTokenSet = ({ interests = [], description = '', buscando = '', badgeLabel = '' }) => {
  const tokens = new Set();

  (Array.isArray(interests) ? interests : []).forEach((interest) => {
    tokenizeSuggestionText(interest).forEach((token) => tokens.add(token));
  });

  [description, buscando, badgeLabel].forEach((value) => {
    tokenizeSuggestionText(value).forEach((token) => tokens.add(token));
  });

  return tokens;
};

const getInterestOverlapScore = (sourceTokens, candidateTokens) => {
  if (!(sourceTokens instanceof Set) || sourceTokens.size === 0) return 22;
  if (!(candidateTokens instanceof Set) || candidateTokens.size === 0) return 18;

  let matches = 0;
  sourceTokens.forEach((token) => {
    if (candidateTokens.has(token)) matches += 1;
  });

  if (matches === 0) return 12;
  return clampScore(38 + matches * 18);
};

const hasIntentPhrase = (text, phrases = []) => phrases.some((phrase) => text.includes(phrase));

const getImplicitSeekingBuckets = (offeredRole) => {
  const roleBucket = getRoleBucket(offeredRole);
  if (roleBucket === 'activo') return ['pasivo', 'versatil'];
  if (roleBucket === 'pasivo') return ['activo', 'versatil'];
  if (roleBucket === 'versatil') return ['activo', 'pasivo', 'versatil'];
  return [];
};

const extractPublicMatchIntent = ({ content, fallbackRole = null }) => {
  const text = normalizeIntentText(content);
  const normalizedRole = resolveProfileRole(fallbackRole);
  const offeredBuckets = new Set();
  const seekingBuckets = new Set();
  let confidence = 0;

  if (!text) {
    return {
      text,
      confidence: 0,
      offeredRole: normalizedRole,
      offeredBucket: getRoleBucket(normalizedRole),
      seekingBuckets: [],
      hasExplicitSeek: false,
      isContextual: false,
    };
  }

  const passivePhrases = ['soy pasivo', 'aca pasivo', 'hola soy pasivo', 'pasivo aqui', 'pasivo por aca', 'pasivo disponible'];
  const activePhrases = ['soy activo', 'aca activo', 'hola soy activo', 'activo aqui', 'activo por aca', 'activo disponible'];
  const versatilPhrases = ['soy versatil', 'soy vers', 'versatil por aca', 'versatil aqui', 'vers por aca', 'vers aqui'];

  if (hasIntentPhrase(text, passivePhrases)) {
    offeredBuckets.add('pasivo');
    confidence += 30;
  }
  if (hasIntentPhrase(text, activePhrases)) {
    offeredBuckets.add('activo');
    confidence += 30;
  }
  if (hasIntentPhrase(text, versatilPhrases) || text.includes('versatil') || text.includes(' vers ')) {
    offeredBuckets.add('versatil');
    confidence += 24;
  }

  if (hasIntentPhrase(text, ['busco activo', 'algun activo', 'alguno activo', 'activos?', 'activo?'])) {
    seekingBuckets.add('activo');
    confidence += 34;
  }
  if (hasIntentPhrase(text, ['busco pasivo', 'algun pasivo', 'alguno pasivo', 'pasivos?', 'pasivo?'])) {
    seekingBuckets.add('pasivo');
    confidence += 34;
  }
  if (hasIntentPhrase(text, ['busco versatil', 'algun versatil', 'alguno versatil', 'versatiles?', 'versatil?'])) {
    seekingBuckets.add('versatil');
    confidence += 28;
  }

  if (offeredBuckets.size === 0 && normalizedRole) {
    const fallbackBucket = getRoleBucket(normalizedRole);
    if (fallbackBucket !== 'otro') {
      offeredBuckets.add(fallbackBucket);
      confidence += 18;
    }
  }

  const hasExplicitSeek = seekingBuckets.size > 0;
  if (!hasExplicitSeek && offeredBuckets.size > 0) {
    getImplicitSeekingBuckets(normalizedRole || Array.from(offeredBuckets)[0]).forEach((bucket) => {
      seekingBuckets.add(bucket);
    });
    confidence += 12;
  }

  const hasLocationContext = /(providencia|vitacura|santiago|vina|viña|concepcion|conce|maipu|maipu|curico|curico|puerto montt|las condes|penalolen|peñalolen|villa alemana)/.test(text);
  if (hasLocationContext) confidence += 10;

  const hasIntentVerb = /(busco|ando|quiero|conocer|hablar|charlar|disponible|por aca|por aqui|de donde)/.test(text);
  if (hasIntentVerb) confidence += 8;

  const offeredBucket = Array.from(offeredBuckets)[0] || getRoleBucket(normalizedRole);
  return {
    text,
    confidence,
    offeredRole: normalizedRole,
    offeredBucket,
    seekingBuckets: Array.from(seekingBuckets),
    hasExplicitSeek,
    hasLocationContext,
    hasIntentVerb,
    isContextual: Boolean(hasIntentVerb || hasLocationContext || hasExplicitSeek || offeredBuckets.size > 0),
  };
};

const getIntentMatchCopy = ({ username, offeredRole, seekingBucket, isOnline = true }) => {
  const fallbackName = username || 'Este usuario';
  const roleLabel = offeredRole ? offeredRole.toLowerCase() : 'compatible contigo';
  const targetText = seekingBucket === 'activo'
    ? 'busca un activo'
    : seekingBucket === 'pasivo'
      ? 'busca un pasivo'
      : seekingBucket === 'versatil'
        ? 'busca alguien versátil'
        : `es ${roleLabel}`;

  return {
    title: `${fallbackName} ${targetText}`,
    description: isOnline
      ? 'Escríbele en privado ahora.'
      : 'Déjale un mensaje para cuando se conecte.',
  };
};

const getIntentDrivenGreeting = ({ username, seekingBucket, offeredRole }) => {
  const fallbackName = username || 'hola';
  const roleLabel = offeredRole ? offeredRole.toLowerCase() : null;

  if (seekingBucket === 'activo') {
    return `Hola ${fallbackName}, vi que buscas un activo 👋`;
  }

  if (seekingBucket === 'pasivo') {
    return `Hola ${fallbackName}, vi que buscas un pasivo 👋`;
  }

  if (seekingBucket === 'versatil') {
    return roleLabel
      ? `Hola ${fallbackName}, vi tu mensaje de ${roleLabel} en la sala 👋`
      : `Hola ${fallbackName}, vi tu mensaje en la sala 👋`;
  }

  return roleLabel
    ? `Hola ${fallbackName}, vi tu mensaje de ${roleLabel} en la sala 👋`
    : `Hola ${fallbackName}, vi tu mensaje en la sala 👋`;
};

const LOW_SIGNAL_PUBLIC_PATTERNS = new Set([
  'hola',
  'holaa',
  'holaa',
  'ola',
  'buenas',
  'buenas noches',
  'hey',
  'hi',
  'alguien',
  'alguno',
  'alguna',
  'q tal',
  'que tal',
  'activo',
  'pasivo',
  'versatil',
  'activo?',
  'pasivo?',
  'versatil?',
]);

const PRIVATE_SUGGESTION_SCORE_STORAGE_KEY = 'chactivo:private-suggestion-scores:v1';
const PRIVATE_MATCH_STATE_TTL_MS = 21 * 24 * 60 * 60 * 1000;

const getPrivateMatchDayKey = (value = Date.now()) => {
  try {
    return new Intl.DateTimeFormat('sv-SE').format(new Date(value));
  } catch {
    return new Date(value).toISOString().slice(0, 10);
  }
};

const normalizePrivateSuggestionEntry = (entry = {}) => {
  const normalized = {
    score: Math.max(0, Number(entry?.score || 0)),
    updatedAt: Math.max(0, Number(entry?.updatedAt || entry?.updatedAtMs || 0)),
    lastSuggestedAtMs: Math.max(0, Number(entry?.lastSuggestedAtMs || 0)),
    lastOpenedAtMs: Math.max(0, Number(entry?.lastOpenedAtMs || 0)),
    lastSuccessAtMs: Math.max(0, Number(entry?.lastSuccessAtMs || 0)),
    lastDismissedAtMs: Math.max(0, Number(entry?.lastDismissedAtMs || 0)),
    shownCount: Math.max(0, Number(entry?.shownCount || 0)),
    openedCount: Math.max(0, Number(entry?.openedCount || 0)),
    successCount: Math.max(0, Number(entry?.successCount || 0)),
    dismissedCount: Math.max(0, Number(entry?.dismissedCount || 0)),
    suggestedDayKey: typeof entry?.suggestedDayKey === 'string' ? entry.suggestedDayKey : '',
  };

  if (!normalized.updatedAt) {
    normalized.updatedAt = Math.max(
      normalized.lastSuggestedAtMs,
      normalized.lastOpenedAtMs,
      normalized.lastSuccessAtMs,
      normalized.lastDismissedAtMs,
      0
    );
  }

  return normalized;
};

const mergePrivateSuggestionEntries = (...entries) => entries
  .filter(Boolean)
  .map((entry) => normalizePrivateSuggestionEntry(entry))
  .reduce((acc, entry) => ({
    score: Math.max(acc.score, entry.score),
    updatedAt: Math.max(acc.updatedAt, entry.updatedAt),
    lastSuggestedAtMs: Math.max(acc.lastSuggestedAtMs, entry.lastSuggestedAtMs),
    lastOpenedAtMs: Math.max(acc.lastOpenedAtMs, entry.lastOpenedAtMs),
    lastSuccessAtMs: Math.max(acc.lastSuccessAtMs, entry.lastSuccessAtMs),
    lastDismissedAtMs: Math.max(acc.lastDismissedAtMs, entry.lastDismissedAtMs),
    shownCount: Math.max(acc.shownCount, entry.shownCount),
    openedCount: Math.max(acc.openedCount, entry.openedCount),
    successCount: Math.max(acc.successCount, entry.successCount),
    dismissedCount: Math.max(acc.dismissedCount, entry.dismissedCount),
    suggestedDayKey: acc.suggestedDayKey || entry.suggestedDayKey,
  }), normalizePrivateSuggestionEntry());

const getAgePenalty = (timestampMs, nowMs, levels = []) => {
  if (!timestampMs) return 0;
  const ageMs = Math.max(0, nowMs - timestampMs);
  const level = levels.find((item) => ageMs <= item.untilMs);
  return level ? level.penalty : 0;
};

const getPrivateSuggestionPenalty = (entry, nowMs = Date.now()) => {
  const normalized = normalizePrivateSuggestionEntry(entry);
  if (!normalized.updatedAt) return 0;

  const ageMs = Math.max(0, nowMs - normalized.updatedAt);
  let basePenaltyFactor = 1;
  if (ageMs > (7 * 24 * 60 * 60 * 1000)) basePenaltyFactor = 0.12;
  else if (ageMs > (3 * 24 * 60 * 60 * 1000)) basePenaltyFactor = 0.25;
  else if (ageMs > (24 * 60 * 60 * 1000)) basePenaltyFactor = 0.45;
  else if (ageMs > (6 * 60 * 60 * 1000)) basePenaltyFactor = 0.7;
  else if (ageMs > (60 * 60 * 1000)) basePenaltyFactor = 0.88;

  const basePenalty = normalized.score * 4.2 * basePenaltyFactor;
  const suggestedTodayPenalty = normalized.suggestedDayKey === getPrivateMatchDayKey(nowMs) ? 20 : 0;
  const shownPenalty = getAgePenalty(normalized.lastSuggestedAtMs, nowMs, [
    { untilMs: 60 * 60 * 1000, penalty: 12 },
    { untilMs: 6 * 60 * 60 * 1000, penalty: 8 },
    { untilMs: 24 * 60 * 60 * 1000, penalty: 5 },
    { untilMs: 72 * 60 * 60 * 1000, penalty: 2 },
  ]);
  const openedPenalty = getAgePenalty(normalized.lastOpenedAtMs, nowMs, [
    { untilMs: 6 * 60 * 60 * 1000, penalty: 16 },
    { untilMs: 24 * 60 * 60 * 1000, penalty: 10 },
    { untilMs: 72 * 60 * 60 * 1000, penalty: 4 },
  ]);
  const successPenalty = getAgePenalty(normalized.lastSuccessAtMs, nowMs, [
    { untilMs: 24 * 60 * 60 * 1000, penalty: 18 },
    { untilMs: 3 * 24 * 60 * 60 * 1000, penalty: 10 },
    { untilMs: 7 * 24 * 60 * 60 * 1000, penalty: 5 },
  ]);
  const dismissedPenalty = getAgePenalty(normalized.lastDismissedAtMs, nowMs, [
    { untilMs: 2 * 60 * 60 * 1000, penalty: 12 },
    { untilMs: 24 * 60 * 60 * 1000, penalty: 6 },
    { untilMs: 72 * 60 * 60 * 1000, penalty: 3 },
  ]);

  return Math.round(
    basePenalty
    + suggestedTodayPenalty
    + shownPenalty
    + openedPenalty
    + successPenalty
    + dismissedPenalty
  );
};

const getPublicMessageSignalMeta = ({ content, fallbackRole = null }) => {
  const text = normalizeIntentText(content);
  const intent = extractPublicMatchIntent({ content, fallbackRole });
  const words = text ? text.split(' ').filter(Boolean) : [];
  const roleLabel = intent.offeredRole ? intent.offeredRole.toLowerCase() : null;
  const firstSeekingBucket = intent.seekingBuckets?.[0] || null;

  const isGenericLowSignal = Boolean(
    text
    && !intent.hasExplicitSeek
    && !intent.hasLocationContext
    && !intent.hasIntentVerb
    && (
      LOW_SIGNAL_PUBLIC_PATTERNS.has(text)
      || (words.length <= 2 && LOW_SIGNAL_PUBLIC_PATTERNS.has(words.join(' ')))
    )
  );

  const isContextualHighSignal = Boolean(
    text
    && !isGenericLowSignal
    && (
      intent.confidence >= 34
      || intent.hasExplicitSeek
      || intent.hasLocationContext
      || (intent.hasIntentVerb && Boolean(roleLabel))
    )
  );

  let accentLabel = null;
  if (firstSeekingBucket === 'activo') accentLabel = 'Busca activo';
  else if (firstSeekingBucket === 'pasivo') accentLabel = 'Busca pasivo';
  else if (firstSeekingBucket === 'versatil') accentLabel = 'Busca versátil';
  else if (roleLabel) accentLabel = roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1);
  else if (intent.hasLocationContext) accentLabel = 'Con contexto';

  return {
    isGenericLowSignal,
    isContextualHighSignal,
    confidence: intent.confidence,
    accentLabel,
  };
};

const getIntentTokens = (value) => normalizeIntentText(value)
  .split(' ')
  .map((token) => token.trim())
  .filter((token) => token && token.length > 1);

const getTokenOverlapRatio = (sourceTokens = [], targetTokens = []) => {
  if (!sourceTokens.length || !targetTokens.length) return 0;
  const sourceSet = new Set(sourceTokens);
  const targetSet = new Set(targetTokens);
  let shared = 0;
  sourceSet.forEach((token) => {
    if (targetSet.has(token)) shared += 1;
  });
  return shared / Math.max(sourceSet.size, targetSet.size, 1);
};

const getRepeatedPublicMessageMeta = ({ content, userId, messages = [], nowMs = Date.now() }) => {
  const normalizedIncoming = normalizeIntentText(content);
  if (!normalizedIncoming || !userId || !Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  const incomingTokens = getIntentTokens(content);
  const incomingSignal = getPublicMessageSignalMeta({ content });
  const incomingIntent = extractPublicMatchIntent({ content });
  const repeatWindowMs = 4 * 60 * 1000;

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || msg.userId !== userId || msg.type !== 'text') continue;

    const timestampMs = msg.timestampMs ||
      (msg.timestamp?.toMillis?.() ||
        (typeof msg.timestamp === 'number'
          ? msg.timestamp
          : (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));
    if (!timestampMs || (nowMs - timestampMs) > repeatWindowMs) continue;

    const normalizedExisting = normalizeIntentText(msg.content || '');
    if (!normalizedExisting) continue;

    if (normalizedExisting === normalizedIncoming) {
      return { reason: 'exact', previousMessage: msg };
    }

    const existingTokens = getIntentTokens(msg.content || '');
    const overlapRatio = getTokenOverlapRatio(incomingTokens, existingTokens);
    const minTokenCount = Math.min(incomingTokens.length, existingTokens.length);
    const isNearDuplicate = overlapRatio >= 0.82 && minTokenCount >= 3;
    const isContainedVariant = minTokenCount >= 3 && (
      normalizedExisting.includes(normalizedIncoming) || normalizedIncoming.includes(normalizedExisting)
    );

    if (isNearDuplicate || isContainedVariant) {
      return { reason: 'semantic', previousMessage: msg };
    }

    const existingSignal = getPublicMessageSignalMeta({ content: msg.content || '' });
    const existingIntent = extractPublicMatchIntent({ content: msg.content || '' });
    const sameOfferedBucket = incomingIntent?.offeredBucket
      && incomingIntent.offeredBucket !== 'otro'
      && incomingIntent.offeredBucket === existingIntent?.offeredBucket;
    const incomingSeekingKey = (incomingIntent?.seekingBuckets || []).slice().sort().join('|');
    const existingSeekingKey = (existingIntent?.seekingBuckets || []).slice().sort().join('|');
    const sameSeekingIntent = Boolean(incomingSeekingKey && incomingSeekingKey === existingSeekingKey);
    const hasRepeatedStructuredIntent = (
      incomingIntent?.confidence >= 28
      && existingIntent?.confidence >= 28
      && (sameOfferedBucket || sameSeekingIntent)
      && (
        incomingIntent.hasExplicitSeek
        || existingIntent.hasExplicitSeek
        || incomingSignal?.isContextualHighSignal
        || existingSignal?.isContextualHighSignal
      )
    );

    if (hasRepeatedStructuredIntent) {
      return { reason: 'intent_repeat', previousMessage: msg };
    }

    if (
      incomingSignal?.isGenericLowSignal
      && existingSignal?.isGenericLowSignal
      && minTokenCount <= 2
    ) {
      return { reason: 'generic_repeat', previousMessage: msg };
    }
  }

  return null;
};

// 💬 Frases rápidas reales — rol, intención y ubicación
const QUICK_STARTER_PHRASES = [
  'Hola, soy pasivo 👋',
  'Soy activo, quién?',
  'Pasivo buscando activo',
  'Activo buscando pasivo',
  'Soy vers, y ustedes?',
  'Wena, quién anda despierto? 👀',
  'Busco pasivo por acá',
  'Busco activo por acá',
  'Ando con intención de concretar 🔥',
  'Hola cabros, de qué comuna?',
  'Quiero conversa con intención',
  'Activo disponible ahora',
  'Pasivo disponible, alguien?',
  // Originales (más genéricas):
  // 'Wena, quién anda despierto por acá? 👀',
  // 'Hola cabros, de qué comuna son? 🌆',
  // 'Yo ando en modo charla con intención 😏',
  // 'Recién llegué, qué se cuenta hoy? 💬',
  // 'Quién de Santiago centro conectado ahora?',
  // 'Activos, pasivos o vers por acá? 🔥',
  // 'Busco buena conversa y ver qué sale',
  // 'Alguien con buena onda para hablar un rato?',
  // 'Qué plan tienen para esta noche? ✨',
  // 'Estoy por [tu comuna], alguien cerca?',
];

const MAX_OPEN_PRIVATE_CHATS = 3;
const DEFAULT_CHAT_AVATAR = '/avatar_por_defecto.jpeg';
const HETERO_INDEXING_ENABLED = false;

const resolveChatAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return DEFAULT_CHAT_AVATAR;
  const normalized = avatar.trim().toLowerCase();
  if (!normalized) return DEFAULT_CHAT_AVATAR;
  if (normalized === 'undefined' || normalized === 'null') return DEFAULT_CHAT_AVATAR;
  if (normalized.includes('api.dicebear.com')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('data:image/svg+xml')) return DEFAULT_CHAT_AVATAR;
  if (normalized.startsWith('blob:')) return DEFAULT_CHAT_AVATAR;
  return avatar;
};

const formatRelativePulse = (timestampMs, nowMs = Date.now()) => {
  if (!timestampMs) return 'sin actividad reciente';
  const diffMs = Math.max(0, nowMs - timestampMs);
  const diffSeconds = Math.round(diffMs / 1000);

  if (diffSeconds <= 4) return 'hace segundos';
  if (diffSeconds < 60) return `hace ${diffSeconds}s`;

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} d`;
};

const truncateOpportunityText = (value, maxLength = 76) => {
  const safe = String(value || '').replace(/\s+/g, ' ').trim();
  if (!safe) return '';
  if (safe.length <= maxLength) return safe;
  return `${safe.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const getContextualSuggestionMeta = (source) => {
  switch (source) {
    case 'room_entry_suggestion':
      return {
        title: 'Disponible ahora',
        subtitle: 'Acabas de entrar. Aqui hay gente que ya viene alineada contigo.',
        badgeLabel: 'Entrada',
      };
    case 'no_response_nudge':
      return {
        title: 'Disponible ahora',
        subtitle: 'Si la sala no responde, empuja una conversacion con mejor contexto.',
        badgeLabel: 'Sin respuesta',
      };
    case 'frustration_nudge':
      return {
        title: 'Disponible ahora',
        subtitle: 'Llevas rato sin enganchar. Te mostramos las mas relevantes ahora.',
        badgeLabel: 'Rescate',
      };
    case 'loading_rescue':
      return {
        title: 'Disponible ahora',
        subtitle: 'Mientras la sala baja el ritmo, estas oportunidades siguen activas.',
        badgeLabel: 'Sala lenta',
      };
    default:
      return {
        title: 'Disponible ahora',
        subtitle: '1 buena oportunidad > 10 irrelevantes.',
        badgeLabel: 'Contextual',
      };
  }
};

const getBoostedMetricsMessagesCount = (rawCount) => {
  const safeCount = Math.max(0, Number(rawCount) || 0);
  if (safeCount >= 40) return safeCount + 50;
  if (safeCount >= 30) return safeCount + 30;
  if (safeCount >= 20) return safeCount + 15;
  if (safeCount >= 10) return safeCount + 10;
  return safeCount;
};

const formatMetricsLastMessage = (timestampMs, nowMs = Date.now()) => {
  if (!timestampMs) return 'sin actividad reciente';
  const diffMs = Math.max(0, nowMs - timestampMs);
  const diffMinutes = Math.max(0, Math.round(diffMs / (60 * 1000)));

  if (diffMinutes <= 0) return 'hace segundos';
  if (diffMinutes >= 4) return 'hace 4 min';
  return `hace ${diffMinutes} min`;
};

const shuffleArray = (items) => {
  const next = Array.isArray(items) ? [...items] : [];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const ChatPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    loading: authLoading,
    authReady,
    guestMessageCount,
    setGuestMessageCount,
    updateAnonymousUserProfile,
    updateProfile,
    signInAsGuest
  } = useAuth();

  // ✅ Estados y refs - DEBEN estar ANTES del early return
  const [currentRoom, setCurrentRoom] = useState(roomId);
  const [messages, setMessages] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());
  const [blockedByUserIds, setBlockedByUserIds] = useState(new Set());
  const [persistentPrivateSuggestionCatalog, setPersistentPrivateSuggestionCatalog] = useState([]);
  const blockedUserIdsRef = useRef(new Set());
  const blockedByUserIdsRef = useRef(new Set());
  const blockedByCacheRef = useRef(new Set());
  const blockedByPendingRef = useRef(new Set());
  const pageStartRef = useRef(Date.now());
  const isHeteroRoom = roomId === 'hetero-general';
  const [showProfileComunaPrompt, setShowProfileComunaPrompt] = useState(false);
  const [profileComunaValue, setProfileComunaValue] = useState('');
  const [isSavingProfileComuna, setIsSavingProfileComuna] = useState(false);
  const heteroRoomSessionStartRef = useRef(null);
  const heteroRoomSentCountRef = useRef(0);
  const heteroRoomReturningRef = useRef(false);
  // ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
  // const [moderatorMessage, setModeratorMessage] = useState(null); // 👮 Mensaje del moderador (para RulesBanner)
  const [roomUsers, setRoomUsers] = useState([]); // 🤖 Usuarios en la sala (para sistema de bots)
  const [isPageVisible, setIsPageVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionsTarget, setUserActionsTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  // Sidebar cerrado en móvil (< 1024px), abierto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false; // Valor por defecto para SSR
  });

  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showCercaniaBanner, setShowCercaniaBanner] = useState(false);
  const [showHeteroRoomIntroBanner, setShowHeteroRoomIntroBanner] = useState(false);
  const [showMobileSidebarBadge, setShowMobileSidebarBadge] = useState(false);
  const lastForegroundPushRef = useRef({ key: '', at: 0 });
  const pushBannerDismissKey = user?.id
    ? `push_banner_dismissed_${user.id}`
    : 'push_banner_dismissed_guest';
  const pushBannerSeenKey = user?.id
    ? `push_banner_seen_${user.id}`
    : 'push_banner_seen_guest';
  const cercaniaBannerDismissKey = user?.id
    ? `chactivo:cercania_banner:dismissed:${user.id}`
    : 'chactivo:cercania_banner:dismissed:guest';
  const cercaniaBannerSeenKey = user?.id
    ? `chactivo:cercania_banner:seen_forever:${user.id}`
    : 'chactivo:cercania_banner:seen_forever:guest';
  const cercaniaBannerSessionKey = user?.id
    ? `chactivo:cercania_banner:seen:${currentRoom}:${user.id}`
    : `chactivo:cercania_banner:seen:${currentRoom}:guest`;
  const heteroIntroSeenKey = user?.id
    ? `chactivo:hetero_intro:seen:${user.id}`
    : 'chactivo:hetero_intro:seen:guest';
  const mobileSidebarBadgeSeenKey = user?.id
    ? `chactivo:mobile_sidebar_badge:shown:${user.id}`
    : 'chactivo:mobile_sidebar_badge:shown:guest';
  const mobileSidebarBadgeSessionKey = user?.id
    ? `chactivo:mobile_sidebar_badge:session:${user.id}`
    : 'chactivo:mobile_sidebar_badge:session:guest';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.innerWidth >= 1024) {
      setShowMobileSidebarBadge(false);
      return;
    }

    try {
      const sessionState = sessionStorage.getItem(mobileSidebarBadgeSessionKey);

      if (sessionState === 'consumed') {
        setShowMobileSidebarBadge(false);
        return;
      }

      if (sessionState === 'shown') {
        setShowMobileSidebarBadge(true);
        return;
      }

      const shownCount = Number.parseInt(localStorage.getItem(mobileSidebarBadgeSeenKey) || '0', 10);

      if (shownCount >= 2) {
        setShowMobileSidebarBadge(false);
        return;
      }

      localStorage.setItem(mobileSidebarBadgeSeenKey, String(shownCount + 1));
      sessionStorage.setItem(mobileSidebarBadgeSessionKey, 'shown');
      setShowMobileSidebarBadge(true);
    } catch (error) {
      console.warn('No se pudo inicializar el badge del menú móvil:', error);
      setShowMobileSidebarBadge(false);
    }
  }, [mobileSidebarBadgeSeenKey, mobileSidebarBadgeSessionKey]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleOpenSidebarFromMenu = useCallback(() => {
    setSidebarOpen(true);
    setShowMobileSidebarBadge(false);

    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(mobileSidebarBadgeSessionKey, 'consumed');
    } catch (error) {
      console.warn('No se pudo persistir el cierre del badge del menú móvil:', error);
    }
  }, [mobileSidebarBadgeSessionKey]);

  // Mostrar banner de push despues de 30s (solo una vez por sesion, solo si no ha dado permiso)
  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) return;
    if (!canRequestPush()) return;
    if (localStorage.getItem(pushBannerDismissKey)) return;
    if (localStorage.getItem(pushBannerSeenKey)) return;
    if (sessionStorage.getItem('push_banner_shown')) return;

    const timer = setTimeout(() => {
      setShowPushBanner(true);
      localStorage.setItem(pushBannerSeenKey, Date.now().toString());
      sessionStorage.setItem('push_banner_shown', '1');
    }, 30000);

    return () => clearTimeout(timer);
  }, [user, pushBannerDismissKey, pushBannerSeenKey]);

  useEffect(() => {
    if (currentRoom !== 'hetero-general') {
      setShowHeteroRoomIntroBanner(false);
      return;
    }

    if (localStorage.getItem(heteroIntroSeenKey)) {
      setShowHeteroRoomIntroBanner(false);
      return;
    }

    setShowHeteroRoomIntroBanner(true);
    localStorage.setItem(heteroIntroSeenKey, Date.now().toString());
  }, [currentRoom, heteroIntroSeenKey]);

  useEffect(() => {
    if (!showHeteroRoomIntroBanner) return undefined;

    const timer = setTimeout(() => {
      setShowHeteroRoomIntroBanner(false);
    }, 9000);

    return () => clearTimeout(timer);
  }, [showHeteroRoomIntroBanner]);

  const handleEnablePush = async () => {
    setShowPushBanner(false);
    localStorage.setItem(pushBannerDismissKey, Date.now().toString());
    await requestNotificationPermission();
  };

  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) return undefined;

    let cancelled = false;
    let unsubscribeForeground = null;

    Promise.resolve(setupForegroundMessages((payload) => {
      const title = payload?.notification?.title || 'Chactivo';
      const body = payload?.notification?.body || 'Tienes una nueva notificación';
      const tag = payload?.data?.tag || payload?.messageId || `${title}:${body}`;
      const now = Date.now();

      // Evitar duplicados visuales/sonoros del mismo push en una ventana corta
      if (
        lastForegroundPushRef.current.key === tag &&
        (now - lastForegroundPushRef.current.at) < 4000
      ) {
        return;
      }
      lastForegroundPushRef.current = { key: tag, at: now };

      notificationSounds.playMessageSound();
      toast({
        title,
        description: body,
        duration: 5500,
      });
    })).then((unsubscribe) => {
      if (cancelled) {
        if (typeof unsubscribe === 'function') unsubscribe();
        return;
      }
      if (typeof unsubscribe === 'function') {
        unsubscribeForeground = unsubscribe;
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (typeof unsubscribeForeground === 'function') {
        unsubscribeForeground();
      }
    };
  }, [user?.id, user?.isAnonymous, user?.isGuest]);

  const isSystemUserId = useCallback((userId) => {
    if (!userId) return false;
    return userId === 'system' || userId.startsWith('system_');
  }, []);

  useEffect(() => {
    if (authReady && user?.id) return;
    setRoomUsers([]);
    previousRealUserCountRef.current = 0;
    lastUserCountsRef.current = { total: 0, active: 0, real: 0 };
  }, [authReady, user?.id]);

  const isAutomatedUserId = useCallback((userId) => {
    if (!userId) return false;
    return userId.startsWith('bot_') ||
           userId.startsWith('ai_') ||
           userId.startsWith('seed_user_') ||
           userId.startsWith('static_bot_');
  }, []);

  const filterAutomatedMessagesInPrincipal = useCallback((incomingMessages) => {
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) return [];
    if (currentRoom !== 'principal') return incomingMessages;
    return incomingMessages.filter((msg) => !isAutomatedUserId(msg?.userId));
  }, [currentRoom, isAutomatedUserId]);

  const refreshBlockedByUsers = useCallback(async (userIds) => {
    if (!user?.id || user?.isGuest || user?.isAnonymous || !Array.isArray(userIds)) return;
    const candidates = userIds.filter(id =>
      id &&
      id !== user.id &&
      !isSystemUserId(id) &&
      !blockedByCacheRef.current.has(id) &&
      !blockedByPendingRef.current.has(id)
    );
    if (candidates.length === 0) return;

    const newlyBlockedIds = [];

    await Promise.all(candidates.map(async (id) => {
      blockedByPendingRef.current.add(id);
      try {
        const blocked = await isBlocked(id, user.id);
        if (blocked) {
          newlyBlockedIds.push(id);
        }
      } catch (error) {
        console.warn('[BLOCK] Error verificando bloqueo:', error);
      } finally {
        blockedByPendingRef.current.delete(id);
        blockedByCacheRef.current.add(id);
      }
    }));

    if (newlyBlockedIds.length > 0) {
      setBlockedByUserIds((prev) => {
        const next = new Set(prev);
        newlyBlockedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [user?.id, user?.isGuest, user?.isAnonymous, isSystemUserId]);

  const filterBlockedMessages = useCallback((incomingMessages) => {
    if (!incomingMessages || incomingMessages.length === 0) return [];
    const blockedIds = new Set([
      ...blockedUserIdsRef.current,
      ...blockedByUserIdsRef.current
    ]);
    return incomingMessages.filter(msg => {
      const uid = msg.userId;
      if (!uid || isSystemUserId(uid)) return true;
      return !blockedIds.has(uid);
    });
  }, [isSystemUserId]);

  useEffect(() => {
    if (!authReady || !user?.id || user?.isGuest || user?.isAnonymous) {
      setBlockedUserIds(new Set());
      setBlockedByUserIds(new Set());
      blockedByCacheRef.current = new Set();
      blockedByPendingRef.current = new Set();
      return;
    }
    const unsubscribe = subscribeToBlockedUsers(user.id, (ids) => {
      setBlockedUserIds(new Set(ids));
    });
    return () => unsubscribe?.();
  }, [authReady, user?.id, user?.isGuest, user?.isAnonymous]);

  useEffect(() => {
    blockedUserIdsRef.current = blockedUserIds;
  }, [blockedUserIds]);

  useEffect(() => {
    blockedByUserIdsRef.current = blockedByUserIds;
  }, [blockedByUserIds]);

  useEffect(() => {
    if (blockedUserIds.size === 0 && blockedByUserIds.size === 0) return;
    setMessages(prev => filterBlockedMessages(prev));
  }, [blockedUserIds, blockedByUserIds, filterBlockedMessages]);

  // 🏆 PRO: Modal de felicitaciones
  const [showProCongrats, setShowProCongrats] = useState(false);

  // Mostrar modal de felicitaciones PRO (solo una vez)
  useEffect(() => {
    if (!user?.id || !user?.isProUser) return;
    const key = `pro_congrats_seen:${user.id}`;
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setShowProCongrats(true);
      localStorage.setItem(key, '1');
    }, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, user?.isProUser]);

  // 🏆 PRO: Sincronizar presencia cuando isProUser cambia en tiempo real
  useEffect(() => {
    if (!authReady || !user?.id || !roomId) return;
    updatePresenceFields(roomId, {
      isProUser: user.isProUser || false,
      hasRainbowBorder: user.hasRainbowBorder || false,
      hasProBadge: user.hasProBadge || false,
      hasFeaturedCard: user.hasFeaturedCard || false,
      canUploadSecondPhoto: user.canUploadSecondPhoto || false,
    });
  }, [
    user?.isProUser,
    user?.hasRainbowBorder,
    user?.hasProBadge,
    user?.hasFeaturedCard,
    user?.canUploadSecondPhoto,
    roomId,
    user?.id,
    authReady,
  ]);

  // 🔒 VERIFICAR ACCESO A LA SALA - Redirigir si no tiene permiso
  useEffect(() => {
    const referrer = document.referrer || '';
    const accessCheck = canAccessRoom(roomId, referrer, user);

    if (!accessCheck.allowed) {
      console.log(`[ROOM ACCESS] 🔒 Acceso denegado a sala "${roomId}": ${accessCheck.message}`);
      toast({
        title: '🔒 Sala no disponible',
        description: accessCheck.message,
        duration: 4000,
      });
      navigate(accessCheck.redirect, { replace: true });
    }
  }, [roomId, navigate, user]);

  // ✅ Cerrar sidebar automáticamente en móvil cuando cambia el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Verificar al montar
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Cerrar sidebar automáticamente cuando se cambia de sala en móvil
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [currentRoom]);
  const [privateChatRequest, setPrivateChatRequest] = useState(null);
  const [pendingPrivateRequests, setPendingPrivateRequests] = useState([]);
  const [unreadPrivateMessages, setUnreadPrivateMessages] = useState({});
  const [privateInboxItems, setPrivateInboxItems] = useState([]);
  const [privateMatchStateItems, setPrivateMatchStateItems] = useState([]);
  const [privateDirectMessageToast, setPrivateDirectMessageToast] = useState(null);
  const [hasActivatedPrivateSurfaces, setHasActivatedPrivateSurfaces] = useState(false);
  const [showInPrivateUsersStrip, setShowInPrivateUsersStrip] = useState(false);
  const [isInPrivateUsersStripPinned, setIsInPrivateUsersStripPinned] = useState(false);
  const [activeOpinIntents, setActiveOpinIntents] = useState([]);
  const [privateMatchSuggestion, setPrivateMatchSuggestion] = useState(null);
  const [isSendingPrivateMatchRequest, setIsSendingPrivateMatchRequest] = useState(false);
  const [isOpeningContextualOpportunity, setIsOpeningContextualOpportunity] = useState(false);
  const [isRandomConnectActive, setIsRandomConnectActive] = useState(false);
  // Chat privado persistente: usa contexto global para mantener conversación al navegar
  const { openPrivateChats, setActivePrivateChat, closePrivateChat, discardPrivateChat, dismissedChatIds, addDismissedChat, maxOpenPrivateChats } = usePrivateChat();
  // 🔔 Estado para popup de recordatorio de evento
  const [reminderEvento, setReminderEvento] = useState(null);
  // Refs para leer estado actual dentro del callback del listener sin re-crear el listener
  const privateChatRequestRef = useRef(null);
  const privateMatchSuggestionRef = useRef(null);
  const openPrivateChatsRef = useRef([]);
  const dismissedChatIdsRef = useRef(new Set());
  const privateUiMemoryRef = useRef({});
  const privateDirectMessageToastRef = useRef(null);
  const currentRoomRef = useRef(null);
  const userRef = useRef(null);
  const isOpeningContextualOpportunityRef = useRef(false);
  const openPrivateChatWindowRef = useRef(null);
  const openGroupPrivateChatWindowRef = useRef(null);
  const clearRandomConnectPendingTimeoutRef = useRef(null);
  const stopRandomConnectRef = useRef(null);
  const sendNextRandomConnectInviteRef = useRef(null);
  const handledDirectMessageNotificationIdsRef = useRef(new Set());
  const handledPrivateConversationNotificationIdsRef = useRef(new Set());
  const lastInteractionAtRef = useRef(Date.now());
  const privateMatchLastShownAtRef = useRef(0);
  const privateMatchCooldownByTargetRef = useRef(new Map());
  const intentMatchShownKeysRef = useRef(new Set());
  const privateInboxReturnToastKeysRef = useRef(new Set());
  const roomEntrySuggestionShownRef = useRef(new Set());
  const inPrivateUsersAutoHideTimeoutRef = useRef(null);
  const inPrivateUsersIntervalRef = useRef(null);
  const lastInPrivateUsersSignatureRef = useRef('');
  const genericMessageNudgeAtRef = useRef(0);
  const isSendingPrivateMatchRequestRef = useRef(false);
  const trackedContextualViewKeysRef = useRef(new Set());
  const opinMatchCacheRef = useRef({ key: '', ts: 0, posts: [] });
  const responseRescueShownKeysRef = useRef(new Set());
  const loadingRescueShownRef = useRef(false);
  const randomConnectSessionRef = useRef({
    active: false,
    queue: [],
    pendingRequestId: null,
    pendingTargetId: null,
    pendingTargetName: '',
    pendingTimeoutId: null,
  });
  // Mantener refs sincronizados con state/contexto
  privateChatRequestRef.current = privateChatRequest;
  privateMatchSuggestionRef.current = privateMatchSuggestion;
  openPrivateChatsRef.current = openPrivateChats;
  dismissedChatIdsRef.current = dismissedChatIds;
  privateDirectMessageToastRef.current = privateDirectMessageToast;
  currentRoomRef.current = currentRoom;
  userRef.current = user;
  isSendingPrivateMatchRequestRef.current = isSendingPrivateMatchRequest;
  isOpeningContextualOpportunityRef.current = isOpeningContextualOpportunity;

  useEffect(() => {
    privateUiMemoryRef.current = readPrivateUiMemoryEntries(user?.id);
    if (user?.id) {
      writePrivateUiMemoryEntries(user.id, privateUiMemoryRef.current);
    }
  }, [user?.id]);

  const commitPrivateUiMemory = useCallback((entries) => {
    const pruned = prunePrivateUiMemoryEntries(entries);
    privateUiMemoryRef.current = pruned;
    if (user?.id) {
      writePrivateUiMemoryEntries(user.id, pruned);
    }
    return pruned;
  }, [user?.id]);

  const rememberPrivateUiKey = useCallback((key, ttlMs) => {
    if (!key || !ttlMs) return;
    commitPrivateUiMemory({
      ...privateUiMemoryRef.current,
      [key]: Date.now() + ttlMs,
    });
  }, [commitPrivateUiMemory]);

  const isPrivateUiKeyActive = useCallback((key) => {
    if (!key) return false;

    const now = Date.now();
    const currentEntries = privateUiMemoryRef.current || {};
    let hasExpired = false;

    Object.values(currentEntries).forEach((value) => {
      if (Number(value || 0) <= now) {
        hasExpired = true;
      }
    });

    if (hasExpired) {
      commitPrivateUiMemory(currentEntries);
    }

    return Number(privateUiMemoryRef.current?.[key] || 0) > now;
  }, [commitPrivateUiMemory]);

  const activatePrivateSurfaces = useCallback(() => {
    setHasActivatedPrivateSurfaces(true);
  }, []);

  useEffect(() => {
    if ((openPrivateChats?.length || 0) > 0) {
      setHasActivatedPrivateSurfaces(true);
    }
  }, [openPrivateChats]);

  const getPrivateRequestSurfaceScope = useCallback((request = {}) => {
    const type = request?.type === 'private_group_invite_request' ? 'group' : 'direct';
    const currentUserId = userRef.current?.id || user?.id || '';
    const fromId = request?.from?.id || request?.from?.userId || request?.from || '';
    const toId = request?.to?.id || request?.to?.userId || request?.to || '';
    const requestedUserId = request?.requestedUser?.userId || request?.requestedUser?.id || '';
    const otherPartyId = [fromId, toId].find((candidateId) => candidateId && candidateId !== currentUserId)
      || fromId
      || toId
      || 'unknown';

    if (type === 'group') {
      return `${type}:${otherPartyId}:${requestedUserId || request?.inviteId || request?.notificationId || 'pending'}`;
    }

    return `${type}:${otherPartyId}`;
  }, [user?.id]);

  const suppressPrivateRequestSurface = useCallback((request, ttlMs = PRIVATE_UI_REQUEST_SUPPRESSION_MS) => {
    if (!request) return;
    const scope = getPrivateRequestSurfaceScope(request);
    rememberPrivateUiKey(getPrivateRequestMuteKey(scope), ttlMs);
    rememberPrivateUiKey(getPrivateNotificationSeenKey(request?.notificationId), ttlMs);
  }, [getPrivateRequestSurfaceScope, rememberPrivateUiKey]);

  const closePrivateRequestSurface = useCallback((request, meta = {}) => {
    if ((meta?.reason === 'dismiss' || meta?.reason === 'timeout') && request) {
      suppressPrivateRequestSurface(request);
    }
    setPrivateChatRequest((prev) => {
      if (!prev) return null;
      if (request?.notificationId && prev.notificationId && prev.notificationId !== request.notificationId) {
        return prev;
      }
      return null;
    });
  }, [suppressPrivateRequestSurface]);

  const closePrivateDirectToast = useCallback((meta = {}) => {
    const currentToast = privateDirectMessageToastRef.current;
    if (currentToast?.chatId && meta?.reason !== 'open') {
      addDismissedChat(currentToast.chatId);
    }
    setPrivateDirectMessageToast(null);
  }, [addDismissedChat]);

  useEffect(() => {
    if (privateChatRequest || (openPrivateChats?.length || 0) > 0) {
      setPrivateMatchSuggestion(null);
    }
  }, [privateChatRequest, openPrivateChats]);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  // ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
  // const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [showChatRules, setShowChatRules] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false); // ✅ Modal de edad
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationModalFeature, setRegistrationModalFeature] = useState(null);
  const [needsNickname, setNeedsNickname] = useState(false); // ✅ Exigir nickname después de primer mensaje rápido
  const [pendingPrivateTarget, setPendingPrivateTarget] = useState(null);
  const [pendingPrivateOptions, setPendingPrivateOptions] = useState(null);

  // 🔔 Limpiar recordatorios de eventos viejos al montar
  useEffect(() => { cleanOldReminders(); }, []);

  // 🔕 Deshabilitado por ahora: si vuelve, mejor llevarlo a campana y no a popup.
  const handleEventoActivoConRecordatorio = useCallback(() => {}, []);

  const handleDismissReminderPopup = useCallback(() => {
    setReminderEvento(null);
  }, []);

  useEffect(() => {
    if (user && !user.isGuest && needsNickname) {
      setNeedsNickname(false);
    }
  }, [user, needsNickname]);
  // ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
  // const [showGuestNicknameModal, setShowGuestNicknameModal] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false); // ✅ Flag mayor de edad
  // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
  // const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [roomCounts, setRoomCounts] = useState({}); // Contadores de usuarios por sala
  const [activityNow, setActivityNow] = useState(Date.now());
  const [engagementTime, setEngagementTime] = useState(''); // ⏱️ Tiempo total de engagement
  const [showScreenSaver, setShowScreenSaver] = useState(false); // 🔒 Protector de pantalla
  const [showNicknameModal, setShowNicknameModal] = useState(false); // ✅ Modal nickname - solo al intentar escribir
  const [nicknameModalSource, setNicknameModalSource] = useState('user');
  const [isInputFocused, setIsInputFocused] = useState(false); // 📝 Input focus state for scroll manager
  const [suggestedMessage, setSuggestedMessage] = useState(null); // 🤖 Mensaje sugerido por Companion AI
  const [replyTo, setReplyTo] = useState(null); // 💬 Mensaje al que se está respondiendo { messageId, username, content }
  const [isFeaturedChannelsMobileOpen, setIsFeaturedChannelsMobileOpen] = useState(false); // ✨ Panel de canales destacados en móvil
  const [isLoadingMessages, setIsLoadingMessages] = useState(true); // ⏳ Estado de carga de mensajes
  const [messagesLoadingStage, setMessagesLoadingStage] = useState('initial'); // initial | delayed | extended
  const [unreadRepliesCount, setUnreadRepliesCount] = useState(0); // 💬 Contador de respuestas no leídas
  const lastReadMessageIdRef = useRef(null); // Para rastrear último mensaje leído
  const latestReplyToastIdRef = useRef(null); // Evita repetir toast por la misma respuesta
  const unsubscribeRef = useRef(null);
  const aiActivatedRef = useRef(false); // Flag para evitar activaciones múltiples de IA
  const lastUserCountRef = useRef(0); // Para evitar ejecuciones innecesarias del useEffect
  // ⚠️ MODERADOR ELIMINADO (06/01/2026) - A petición del usuario
  // const moderatorWelcomeSentRef = useRef(new Set()); // Para evitar mensajes duplicados del moderador
  const previousMessageCountRef = useRef(0); // Para detectar nuevos mensajes y reproducir sonido
  const lastUserCountsRef = useRef({ total: 0, active: 0, real: 0 }); // Para rastrear conteos de usuarios
  const previousRealUserCountRef = useRef(0); // Para detectar cuando usuarios se desconectan y reproducir sonido
  const deliveryTimeoutsRef = useRef(new Map()); // ⏱️ Timeouts para detectar fallos de entrega (20 segundos)
  const autoLoginAttemptedRef = useRef(false); // ✅ FIX: Prevenir múltiples intentos de auto-login
  const userRolesCacheRef = useRef(new Map()); // ✅ Cache de roles de usuarios para filtrar moderadores
  const checkingRolesRef = useRef(new Set()); // ✅ Flag para evitar consultas duplicadas de roles
  const roleCheckDebounceRef = useRef(null); // ✅ Debounce para consultas de roles
  const usersUpdateInProgressRef = useRef(false); // 🔒 CRÍTICO: Evitar loops infinitos en setRoomUsers
  const chatLoadStartTimeRef = useRef(null); // 📊 PERFORMANCE: Timestamp cuando inicia carga del chat
  const chatLoadTrackedRef = useRef(false); // 📊 PERFORMANCE: Flag para evitar tracking duplicado
  const seoChatArrivalTrackedRef = useRef(null);
  const seoChatCompletionTrackedRef = useRef(null);
  const firstNonEmptySnapshotRef = useRef(false); // Evita flicker "vacío" cuando Firestore responde tarde
  const firstSnapshotReceivedRef = useRef(false); // Marca llegada del primer snapshot (aunque venga vacío)
  const loadingFallbackTimeoutRef = useRef(null); // Cambio a carga lenta
  const loadingExtendedTimeoutRef = useRef(null); // Carga anormalmente lenta
  const nicoWelcomedUsersRef = useRef(new Set()); // 🤖 NICO: Usuarios ya bienvenidos esta sesion
  const nicoQuestionIntervalRef = useRef(null); // 🤖 NICO: Intervalo de preguntas cada 30min
  const nicoPreviousRoomUsersRef = useRef(null); // 🤖 NICO: null = primer render (no enviar bienvenidas)
  const messagesRef = useRef([]); // 🤖 NICO: Ref a mensajes actuales (para closures)
  const roomUsersRef = useRef([]); // 🤖 NICO: Ref a usuarios actuales (para closures)

  // 🤖 NICO: Sincronizar refs con estado actual
  messagesRef.current = messages;
  roomUsersRef.current = roomUsers;

  const DAILY_TOPICS = [
    'Tip de sala: di rol + comuna + si tienes lugar o te mueves',
    'Tip de sala: los mensajes con contexto reciben más respuesta',
    'Tip de sala: si conectas con alguien, pasa a privado interno',
    'Tip de sala: evita “hola” y di directo qué buscas',
    'Tip de sala: decir si te mueves o tienes lugar acelera la conversación',
    'Tip de sala: si buscas algo ahora, dilo en el primer mensaje',
  ];

  const openNicknameModal = useCallback((source = 'user') => {
    setNicknameModalSource(source);
    setShowNicknameModal(true);
  }, []);

  const closeNicknameModal = useCallback(() => {
    setShowNicknameModal(false);
    setNicknameModalSource('user');
  }, []);

  const countRealUsers = useCallback((users) => {
    if (!users || users.length === 0) return 0;
    return users.filter(u => {
      const userId = u.userId || u.id;
      return userId !== 'system' &&
             !userId?.startsWith('bot_') &&
             !userId?.startsWith('bot-') &&
             !userId?.startsWith('static_bot_') &&
             !userId?.includes('bot_join');
    }).length;
  }, []);

  const activeUsersCount = useMemo(() => countRealUsers(roomUsers), [roomUsers, countRealUsers]);
  const isCurrentUserAdmin = useMemo(() => {
    const roleValue = String(user?.role || '').toLowerCase();
    return roleValue === 'admin' || roleValue === 'administrator' || roleValue === 'superadmin';
  }, [user?.role]);

  // Filtrar mensajes de usuarios bloqueados
  const filteredMessages = useMemo(() => {
    if (blockedUserIds.size === 0) return messages;
    return messages.filter(msg => !blockedUserIds.has(msg.userId));
  }, [messages, blockedUserIds]);

  const photoUsageStats = useMemo(() => {
    if (!user?.id) {
      return { hourlyCount: 0, visibleCount: 0 };
    }

    const nowMs = Date.now();
    const oneHourAgoMs = nowMs - (60 * 60 * 1000);
    const lastVisibleWindow = filteredMessages.slice(-100);

    const getMessageTimestampMs = (msg) => (
      msg?.timestampMs ||
      (msg?.timestamp?.toMillis?.() ||
        (typeof msg?.timestamp === 'number'
          ? msg.timestamp
          : (msg?.timestamp ? new Date(msg.timestamp).getTime() : null)))
    );

    const isOwnImage = (msg) => (
      msg?.type === 'image' &&
      msg?.userId === user.id
    );

    let hourlyCount = 0;
    for (const msg of filteredMessages) {
      if (!isOwnImage(msg)) continue;
      const ts = getMessageTimestampMs(msg);
      if (ts && ts >= oneHourAgoMs) {
        hourlyCount += 1;
      }
    }

    let visibleCount = 0;
    for (const msg of lastVisibleWindow) {
      if (isOwnImage(msg)) {
        visibleCount += 1;
      }
    }

    return { hourlyCount, visibleCount };
  }, [filteredMessages, user?.id]);

  const lastMessageMs = useMemo(() => {
    if (!messages || messages.length === 0) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));
      if (ts) return ts;
    }
    return null;
  }, [messages]);

  const recentMessagesCount10m = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return 0;
    const thresholdMs = Date.now() - (10 * 60 * 1000);

    return messages.reduce((count, msg) => {
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) {
        return count;
      }

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));

      if (!ts || ts < thresholdMs) return count;
      return count + 1;
    }, 0);
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const recentMessagesCount20m = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return 0;
    const thresholdMs = Date.now() - (20 * 60 * 1000);

    return messages.reduce((count, msg) => {
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) {
        return count;
      }

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));

      if (!ts || ts < thresholdMs) return count;
      return count + 1;
    }, 0);
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const recentMessagesCount60m = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return 0;
    const thresholdMs = Date.now() - (60 * 60 * 1000);

    return messages.reduce((count, msg) => {
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) {
        return count;
      }

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));

      if (!ts || ts < thresholdMs) return count;
      return count + 1;
    }, 0);
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const previousMessagesCount10m = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return 0;
    const upperThresholdMs = Date.now() - (10 * 60 * 1000);
    const lowerThresholdMs = Date.now() - (20 * 60 * 1000);

    return messages.reduce((count, msg) => {
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) {
        return count;
      }

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));

      if (!ts || ts < lowerThresholdMs || ts >= upperThresholdMs) return count;
      return count + 1;
    }, 0);
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const recentParticipants20m = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return { count: 0, connectedNames: [], activosOnline: 0, pasivosOnline: 0 };
    }

    const thresholdMs = Date.now() - (20 * 60 * 1000);
    const byUser = new Map();

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) continue;

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));

      if (!ts || ts < thresholdMs) continue;
      if (byUser.has(senderId)) continue;

      const role = resolveProfileRole(
        msg?.roleBadge,
        msg?.profileRole,
        msg?.role
      );

      byUser.set(senderId, {
        userId: senderId,
        username: msg?.username || 'Usuario',
        role,
      });
    }

    let activosOnline = 0;
    let pasivosOnline = 0;
    const connectedNames = [];

    byUser.forEach((item) => {
      connectedNames.push(item.username);
      if (item.role === 'Activo' || item.role === 'Versátil Act') activosOnline += 1;
      if (item.role === 'Pasivo' || item.role === 'Versátil Pasivo') pasivosOnline += 1;
    });

    return {
      count: byUser.size,
      connectedNames,
      activosOnline,
      pasivosOnline,
    };
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const recentPresenceFallbackUsers = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    const byUser = new Map();

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const senderId = msg?.userId || '';
      if (!senderId || isSystemUserId(senderId) || isAutomatedUserId(senderId)) continue;
      if (byUser.has(senderId)) continue;

      const ts = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number' ? msg.timestamp :
            (msg.timestamp ? new Date(msg.timestamp).getTime() : null))) ||
        Date.now();

      byUser.set(senderId, {
        userId: senderId,
        username: msg?.username || 'Usuario',
        avatar: resolveChatAvatar(msg?.avatar),
        roleBadge: resolveProfileRole(msg?.roleBadge, msg?.profileRole, msg?.role),
        comuna: normalizeComuna(msg?.comuna || msg?.profileComuna || msg?.userComuna || '') || null,
        isPremium: Boolean(msg?.isPremium || msg?.isProUser),
        isGuest: Boolean(msg?.isGuest || msg?.isAnonymous),
        lastConnectedAt: ts,
      });

      if (byUser.size >= 80) break;
    }

    return Array.from(byUser.values());
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const latestRoleByConnectedUser = useMemo(() => {
    const roleByUser = new Map();
    if (!Array.isArray(messages) || messages.length === 0) return roleByUser;

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const userId = msg?.userId;
      if (!userId || roleByUser.has(userId)) continue;
      if (isSystemUserId(userId) || isAutomatedUserId(userId)) continue;

      const normalizedRole = resolveProfileRole(
        msg?.roleBadge,
        msg?.profileRole,
        msg?.role
      );

      if (normalizedRole) {
        roleByUser.set(userId, normalizedRole);
      }
    }

    return roleByUser;
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const latestComunaByConnectedUser = useMemo(() => {
    const comunaByUser = new Map();

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      const userId = msg?.userId;
      if (!userId || comunaByUser.has(userId)) continue;
      if (isSystemUserId(userId) || isAutomatedUserId(userId)) continue;

      const normalizedComuna = normalizeComuna(msg?.comuna);
      if (normalizedComuna) {
        comunaByUser.set(userId, normalizedComuna);
      }
    }

    return comunaByUser;
  }, [messages, isSystemUserId, isAutomatedUserId]);

  const onlineRoleStats = useMemo(() => {
    const safeUsers = Array.isArray(roomUsers) ? roomUsers : [];
    let activosOnline = 0;
    let pasivosOnline = 0;
    const connectedNames = [];

    safeUsers.forEach((presenceUser) => {
      const userId = presenceUser?.userId || presenceUser?.id || '';
      if (!userId || isSystemUserId(userId) || isAutomatedUserId(userId)) return;

      if (presenceUser?.username) {
        connectedNames.push(String(presenceUser.username));
      }

      const normalizedRole = resolveProfileRole(
        presenceUser?.roleBadge,
        presenceUser?.profileRole,
        latestRoleByConnectedUser.get(userId)
      );

      if (normalizedRole === 'Activo' || normalizedRole === 'Versátil Act') {
        activosOnline += 1;
      }

      if (normalizedRole === 'Pasivo' || normalizedRole === 'Versátil Pasivo') {
        pasivosOnline += 1;
      }
    });

    const uniqueNames = Array.from(new Set(connectedNames));

    return {
      // ✅ Solo presencia real en vivo (sin fallback histórico)
      activosOnline,
      pasivosOnline,
      connectedNames: uniqueNames,
    };
  }, [roomUsers, latestRoleByConnectedUser, isSystemUserId, isAutomatedUserId]);

  const currentUserResolvedRole = useMemo(() => (
    resolveProfileRole(
      user?.roleBadge,
      user?.profileRole,
      user?.role,
      latestRoleByConnectedUser.get(user?.id)
    )
  ), [user?.roleBadge, user?.profileRole, user?.role, user?.id, latestRoleByConnectedUser]);

  const currentUserComuna = useMemo(() => {
    const ownPresence = (Array.isArray(roomUsers) ? roomUsers : []).find((presenceUser) => {
      const presenceUserId = presenceUser?.userId || presenceUser?.id;
      return presenceUserId && presenceUserId === user?.id;
    });

    return normalizeComuna(
      ownPresence?.comuna ||
      latestComunaByConnectedUser.get(user?.id) ||
      user?.comuna ||
      (typeof window !== 'undefined' ? localStorage.getItem(ONBOARDING_COMUNA_KEY) : '')
    );
  }, [roomUsers, user?.id, user?.comuna, latestComunaByConnectedUser]);

  const chatSeekingStorageKey = useMemo(
    () => (user?.id ? `chactivo:chat-seeking-badge:${user.id}` : null),
    [user?.id]
  );
  const [currentUserSeekingBadgeOverride, setCurrentUserSeekingBadgeOverride] = useState(null);
  const [isSavingCurrentUserSeekingBadge, setIsSavingCurrentUserSeekingBadge] = useState(false);

  useEffect(() => {
    if (!chatSeekingStorageKey || typeof window === 'undefined') {
      setCurrentUserSeekingBadgeOverride(null);
      return;
    }

    const storedKey = normalizeChatSeekingBadgeKey(localStorage.getItem(chatSeekingStorageKey));
    const profileKey = normalizeChatSeekingBadgeKey(
      user?.chatSeekingBadgeKey || user?.chatSeekingBadgeLabel
    );

    setCurrentUserSeekingBadgeOverride(profileKey || storedKey || null);
  }, [chatSeekingStorageKey, user?.chatSeekingBadgeKey, user?.chatSeekingBadgeLabel]);

  const currentUserSeekingBadgeMeta = useMemo(() => {
    const effectiveKey = (
      normalizeChatSeekingBadgeKey(currentUserSeekingBadgeOverride)
      || normalizeChatSeekingBadgeKey(user?.chatSeekingBadgeKey || user?.chatSeekingBadgeLabel)
      || getDefaultChatSeekingBadgeKey(currentUserResolvedRole)
    );

    if (!effectiveKey) return null;
    return {
      key: effectiveKey,
      label: getChatSeekingBadgeLabel(effectiveKey),
    };
  }, [
    currentUserSeekingBadgeOverride,
    currentUserResolvedRole,
    user?.chatSeekingBadgeKey,
    user?.chatSeekingBadgeLabel,
  ]);

  const currentUserSuggestionTokens = useMemo(() => (
    buildSuggestionTokenSet({
      interests: user?.interests || [],
      description: user?.description || user?.estado || '',
      buscando: '',
      badgeLabel: currentUserSeekingBadgeMeta?.label || '',
    })
  ), [
    user?.interests,
    user?.description,
    user?.estado,
    currentUserSeekingBadgeMeta?.label,
  ]);

  const handleUpdateCurrentUserSeekingBadge = useCallback(async (nextKey) => {
    const normalizedKey = normalizeChatSeekingBadgeKey(nextKey);
    if (!normalizedKey) return false;

    const nextLabel = getChatSeekingBadgeLabel(normalizedKey);
    if (!nextLabel) return false;

    setCurrentUserSeekingBadgeOverride(normalizedKey);
    if (chatSeekingStorageKey && typeof window !== 'undefined') {
      localStorage.setItem(chatSeekingStorageKey, normalizedKey);
    }

    setIsSavingCurrentUserSeekingBadge(true);
    try {
      if (roomId && authReady && user?.id) {
        await updatePresenceFields(roomId, {
          chatSeekingBadgeKey: normalizedKey,
          chatSeekingBadgeLabel: nextLabel,
        });
      }

      if (user && !user.isGuest && !user.isAnonymous) {
        await updateProfile({
          chatSeekingBadgeKey: normalizedKey,
          chatSeekingBadgeLabel: nextLabel,
        });
      }

      return true;
    } catch (error) {
      console.error('[CHAT] Error actualizando badge de búsqueda:', error);
      toast({
        title: 'No se pudo actualizar',
        description: 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSavingCurrentUserSeekingBadge(false);
    }
  }, [authReady, chatSeekingStorageKey, roomId, updateProfile, user]);

  useEffect(() => {
    if (!authReady || !user?.id || !roomId) return;
    updatePresenceFields(roomId, {
      comuna: currentUserComuna || null,
    });
  }, [currentUserComuna, roomId, user?.id, authReady]);

  useEffect(() => {
    if (!showCercaniaBanner) return undefined;

    const timer = setTimeout(() => {
      setShowCercaniaBanner(false);
    }, 9000);

    return () => clearTimeout(timer);
  }, [showCercaniaBanner]);

  const handleDismissCercaniaBanner = useCallback(() => {
    setShowCercaniaBanner(false);
    localStorage.setItem(cercaniaBannerDismissKey, String(Date.now()));
  }, [cercaniaBannerDismissKey]);

  const nearbySignals = useMemo(() => {
    const sameComunaUsers = [];
    const comunaCounts = new Map();
    let knownComunaUsers = 0;
    let availableNowCount = 0;

    (Array.isArray(roomUsers) ? roomUsers : []).forEach((presenceUser) => {
      const userId = presenceUser?.userId || presenceUser?.id || '';
      if (!userId || userId === user?.id) return;
      if (isSystemUserId(userId) || isAutomatedUserId(userId)) return;

      if (isUserAvailableForConversation(presenceUser)) {
        availableNowCount += 1;
      }

      const comuna = normalizeComuna(
        presenceUser?.comuna ||
        latestComunaByConnectedUser.get(userId)
      );
      if (!comuna) return;

      knownComunaUsers += 1;
      comunaCounts.set(comuna, (comunaCounts.get(comuna) || 0) + 1);

      if (currentUserComuna && getComunaKey(comuna) === getComunaKey(currentUserComuna)) {
        sameComunaUsers.push({
          userId,
          username: presenceUser?.username || 'Usuario',
          comuna,
          available: isUserAvailableForConversation(presenceUser),
        });
      }
    });

    const topComunas = Array.from(comunaCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([comuna, count]) => ({ comuna, count }));

    return {
      sameComunaCount: sameComunaUsers.length,
      sameComunaAvailableCount: sameComunaUsers.filter((item) => item.available).length,
      sameComunaNames: sameComunaUsers.slice(0, 3).map((item) => item.username),
      knownComunaUsers,
      topComunas,
      availableNowCount,
    };
  }, [
    roomUsers,
    user?.id,
    currentUserComuna,
    latestComunaByConnectedUser,
    isSystemUserId,
    isAutomatedUserId,
  ]);

  useEffect(() => {
    const isEligibleRoom = currentRoom === 'principal' || currentRoom === 'hetero-general';
    const isActionable = !currentUserComuna || nearbySignals.sameComunaCount > 0;

    if (!isEligibleRoom || !isActionable) {
      setShowCercaniaBanner(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(cercaniaBannerDismissKey) || 0);
    const dismissedRecently = dismissedAt > 0 && (Date.now() - dismissedAt) < (12 * 60 * 60 * 1000);
    const seenForever = Boolean(localStorage.getItem(cercaniaBannerSeenKey));
    const seenInSession = sessionStorage.getItem(cercaniaBannerSessionKey) === '1';

    if (dismissedRecently || seenForever || seenInSession) {
      setShowCercaniaBanner(false);
      return;
    }

    setShowCercaniaBanner(true);
    localStorage.setItem(cercaniaBannerSeenKey, Date.now().toString());
    sessionStorage.setItem(cercaniaBannerSessionKey, '1');
  }, [
    currentRoom,
    currentUserComuna,
    nearbySignals.sameComunaCount,
    cercaniaBannerDismissKey,
    cercaniaBannerSeenKey,
    cercaniaBannerSessionKey,
  ]);

  const profileComunaPromptDismissKey = user?.id
    ? `chactivo:profile_comuna_prompt:dismissed:${user.id}`
    : 'chactivo:profile_comuna_prompt:dismissed:guest';
  const profileComunaPromptSeenKey = user?.id
    ? `chactivo:profile_comuna_prompt:seen:${user.id}`
    : 'chactivo:profile_comuna_prompt:seen:guest';

  useEffect(() => {
    setProfileComunaValue(currentUserComuna || '');
  }, [currentUserComuna]);

  useEffect(() => {
    if (!user?.id || user?.isGuest || user?.isAnonymous) return;
    if (currentRoom !== 'principal' && currentRoom !== 'hetero-general') return;
    if (currentUserComuna) {
      setShowProfileComunaPrompt(false);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(profileComunaPromptDismissKey) || 0);
    const alreadySeen = localStorage.getItem(profileComunaPromptSeenKey) === '1';
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    if (alreadySeen) return;
    if (dismissedAt && (Date.now() - dismissedAt) < fortyEightHoursMs) return;

    const timer = window.setTimeout(() => {
      setShowProfileComunaPrompt(true);
      localStorage.setItem(profileComunaPromptSeenKey, '1');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [user?.id, user?.isGuest, user?.isAnonymous, currentRoom, currentUserComuna, profileComunaPromptDismissKey, profileComunaPromptSeenKey]);

  const handleDismissProfileComunaPrompt = useCallback(() => {
    setShowProfileComunaPrompt(false);
    if (user?.id) {
      localStorage.setItem(profileComunaPromptDismissKey, String(Date.now()));
    }
  }, [user?.id, profileComunaPromptDismissKey]);

  const handleSaveProfileComuna = useCallback(async () => {
    const normalizedComuna = normalizeComuna(profileComunaValue);
    if (!normalizedComuna) {
      toast({
        title: 'Falta tu zona',
        description: 'Selecciona tu comuna o ciudad para segmentar mejor el chat.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfileComuna(true);
    try {
      const saved = await updateProfile({ comuna: normalizedComuna });
      if (!saved) return;
      localStorage.removeItem(profileComunaPromptDismissKey);
      setShowProfileComunaPrompt(false);
      toast({
        title: 'Zona actualizada',
        description: `${normalizedComuna} ya quedó visible para ordenar cercanía.`,
      });
    } finally {
      setIsSavingProfileComuna(false);
    }
  }, [profileComunaValue, updateProfile, profileComunaPromptDismissKey]);

  const activePrivatePartnerIds = useMemo(() => {
    const ids = new Set();
    (openPrivateChats || []).forEach((chatWindow) => {
      const partnerId = chatWindow?.partner?.userId || chatWindow?.partner?.id;
      if (partnerId) ids.add(partnerId);
    });
    return ids;
  }, [openPrivateChats]);

  useEffect(() => {
    if (!user?.id) {
      setPersistentPrivateSuggestionCatalog([]);
      return;
    }

    const cacheKey = `chactivo:private-suggestions-catalog:v2:${user.id}`;

    try {
      const cachedCatalogRaw = localStorage.getItem(cacheKey);
      if (cachedCatalogRaw) {
        const cachedCatalog = JSON.parse(cachedCatalogRaw);
        if (Array.isArray(cachedCatalog) && cachedCatalog.length > 0) {
          setPersistentPrivateSuggestionCatalog(cachedCatalog);
          return;
        }
      }
    } catch {
      // noop
    }

    // Fase 1 de ahorro: el chat principal deja de leer Baúl/tarjetas al entrar.
    // Solo se reutiliza lo que ya exista en caché local.
    setPersistentPrivateSuggestionCatalog([]);
  }, [user?.id]);

  const [privateSuggestionScoreVersion, setPrivateSuggestionScoreVersion] = useState(0);
  const privateSuggestionScoreMapRef = useRef(new Map());
  const privateMatchStateByTarget = useMemo(() => {
    const nextMap = new Map();
    (privateMatchStateItems || []).forEach((item) => {
      const targetUserId = item?.targetUserId || item?.id;
      if (!targetUserId) return;
      nextMap.set(targetUserId, normalizePrivateSuggestionEntry(item));
    });
    return nextMap;
  }, [privateMatchStateItems]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(PRIVATE_SUGGESTION_SCORE_STORAGE_KEY);
      if (!raw) {
        privateSuggestionScoreMapRef.current = new Map();
        setPrivateSuggestionScoreVersion((prev) => prev + 1);
        return;
      }

      const parsed = JSON.parse(raw);
      const nextMap = new Map();
      const now = Date.now();

      Object.entries(parsed || {}).forEach(([targetUserId, entry]) => {
        if (!targetUserId || !entry || typeof entry !== 'object') return;
        const normalizedEntry = normalizePrivateSuggestionEntry(entry);
        if (normalizedEntry.score <= 0 && !normalizedEntry.lastSuggestedAtMs && !normalizedEntry.lastOpenedAtMs && !normalizedEntry.lastDismissedAtMs) {
          return;
        }
        if (!normalizedEntry.updatedAt) return;
        if ((now - normalizedEntry.updatedAt) > PRIVATE_MATCH_STATE_TTL_MS) return;
        nextMap.set(targetUserId, normalizedEntry);
      });

      privateSuggestionScoreMapRef.current = nextMap;
      setPrivateSuggestionScoreVersion((prev) => prev + 1);
    } catch {
      privateSuggestionScoreMapRef.current = new Map();
      setPrivateSuggestionScoreVersion((prev) => prev + 1);
    }
  }, [user?.id]);

  const bumpPrivateSuggestionScore = useCallback((targetUserId, delta = 1, eventType = 'shown') => {
    if (!targetUserId || typeof window === 'undefined') return;

    const now = Date.now();
    const dayKey = getPrivateMatchDayKey(now);
    const nextMap = new Map(privateSuggestionScoreMapRef.current);
    const currentEntry = normalizePrivateSuggestionEntry(nextMap.get(targetUserId) || {});
    const nextEntry = {
      ...currentEntry,
      score: Math.max(0, Math.min(24, Number(currentEntry.score || 0) + delta)),
      updatedAt: now,
    };

    if (eventType === 'shown') {
      nextEntry.lastSuggestedAtMs = now;
      nextEntry.shownCount = Number(nextEntry.shownCount || 0) + 1;
      nextEntry.suggestedDayKey = dayKey;
    } else if (eventType === 'opened') {
      nextEntry.lastOpenedAtMs = now;
      nextEntry.openedCount = Number(nextEntry.openedCount || 0) + 1;
    } else if (eventType === 'success') {
      nextEntry.lastSuccessAtMs = now;
      nextEntry.successCount = Number(nextEntry.successCount || 0) + 1;
    } else if (eventType === 'dismissed') {
      nextEntry.lastDismissedAtMs = now;
      nextEntry.dismissedCount = Number(nextEntry.dismissedCount || 0) + 1;
    }

    nextMap.set(targetUserId, nextEntry);

    privateSuggestionScoreMapRef.current = nextMap;

    const serializable = {};
    nextMap.forEach((entry, key) => {
      serializable[key] = entry;
    });
    localStorage.setItem(PRIVATE_SUGGESTION_SCORE_STORAGE_KEY, JSON.stringify(serializable));
    setPrivateSuggestionScoreVersion((prev) => prev + 1);
    if (user?.id) {
      const remotePatch = {
        score: nextEntry.score,
        shownCount: nextEntry.shownCount,
        openedCount: nextEntry.openedCount,
        successCount: nextEntry.successCount,
        dismissedCount: nextEntry.dismissedCount,
        suggestedDayKey: nextEntry.suggestedDayKey || '',
      };
      if (nextEntry.lastSuggestedAtMs) remotePatch.lastSuggestedAtMs = nextEntry.lastSuggestedAtMs;
      if (nextEntry.lastOpenedAtMs) remotePatch.lastOpenedAtMs = nextEntry.lastOpenedAtMs;
      if (nextEntry.lastSuccessAtMs) remotePatch.lastSuccessAtMs = nextEntry.lastSuccessAtMs;
      if (nextEntry.lastDismissedAtMs) remotePatch.lastDismissedAtMs = nextEntry.lastDismissedAtMs;

      void upsertPrivateMatchState(user.id, targetUserId, remotePatch).catch(() => {});
    }
  }, [user?.id]);

  const recentIntentSignalByUserId = useMemo(() => {
    if (isHeteroRoom || !user?.id || !currentUserResolvedRole) return new Map();
    if (!Array.isArray(filteredMessages) || filteredMessages.length === 0) return new Map();

    const nowMs = Date.now();
    const currentRoleBucket = getRoleBucket(currentUserResolvedRole);
    if (currentRoleBucket === 'otro') return new Map();

    const byUserId = new Map();

    filteredMessages.forEach((msg) => {
      const senderId = msg?.userId || '';
      if (!senderId || senderId === user.id) return;
      if (isSystemUserId(senderId) || isAutomatedUserId(senderId)) return;

      const timestampMs = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number'
            ? msg.timestamp
            : (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));
      if (!timestampMs || (nowMs - timestampMs) > PRIVATE_MATCH_INTENT_WINDOW_MS) return;

      const intent = extractPublicMatchIntent({
        content: msg?.content || '',
        fallbackRole: msg?.roleBadge || msg?.profileRole || msg?.role,
      });
      if (!intent.isContextual || intent.confidence < 34) return;

      const seekingBuckets = intent.seekingBuckets || [];
      const directRoleMatch = (
        seekingBuckets.includes(currentRoleBucket)
        || seekingBuckets.includes('versatil')
      );
      const matchScore = clampScore(
        directRoleMatch
          ? intent.confidence + (intent.hasExplicitSeek ? 20 : 8)
          : Math.max(18, intent.confidence * 0.35)
      );
      const summarySource = String(msg?.content || '').trim();
      const summary = summarySource.length > 64
        ? `${summarySource.slice(0, 61)}...`
        : summarySource;

      const current = byUserId.get(senderId);
      if (!current || matchScore > current.matchScore || timestampMs > current.timestampMs) {
        byUserId.set(senderId, {
          matchScore,
          summary,
          timestampMs,
          confidence: intent.confidence,
          directRoleMatch,
        });
      }
    });

    return byUserId;
  }, [
    currentUserResolvedRole,
    filteredMessages,
    isAutomatedUserId,
    isHeteroRoom,
    isSystemUserId,
    user?.id,
  ]);

  const opinCandidateUserIds = useMemo(() => {
    if (isHeteroRoom || !user?.id || !Array.isArray(roomUsers) || roomUsers.length === 0) return [];

    return Array.from(new Set(
      [...roomUsers]
        .sort((a, b) => {
          const aActivity = Number(getPresenceActivityMs(a) || 0);
          const bActivity = Number(getPresenceActivityMs(b) || 0);
          return bActivity - aActivity;
        })
        .slice(0, PRIVATE_MATCH_FETCH_LIMIT)
        .map((presenceUser) => presenceUser?.userId || presenceUser?.id || '')
        .filter((candidateUserId) => (
          candidateUserId
          && candidateUserId !== user.id
          && !isSystemUserId(candidateUserId)
          && !isAutomatedUserId(candidateUserId)
        ))
    ));
  }, [roomUsers, user?.id, isHeteroRoom, isSystemUserId, isAutomatedUserId]);

  useEffect(() => {
    if (currentRoom !== 'principal' || isHeteroRoom || !user?.id || opinCandidateUserIds.length === 0) {
      setActiveOpinIntents([]);
      return undefined;
    }

    if (!isPageVisible) {
      return undefined;
    }

    let cancelled = false;
    const cacheKey = opinCandidateUserIds.join('|');
    const now = Date.now();
    const cacheEntry = opinMatchCacheRef.current;

    if (
      cacheEntry.key === cacheKey
      && Array.isArray(cacheEntry.posts)
      && (now - Number(cacheEntry.ts || 0)) < PRIVATE_MATCH_OPIN_CACHE_TTL_MS
    ) {
      setActiveOpinIntents(cacheEntry.posts);
      return undefined;
    }

    getOpenOpinIntentsByUserIds(opinCandidateUserIds)
      .then((posts) => {
        if (cancelled) return;
        const safePosts = Array.isArray(posts) ? posts : [];
        opinMatchCacheRef.current = {
          key: cacheKey,
          ts: Date.now(),
          posts: safePosts,
        };
        setActiveOpinIntents(safePosts);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[OPIN_CONTEXT] No se pudieron cargar intenciones OPIN activas:', error?.message || error);
        setActiveOpinIntents([]);
      });

    return () => {
      cancelled = true;
    };
  }, [currentRoom, isHeteroRoom, opinCandidateUserIds, user?.id, isPageVisible]);

  const opinIntentByUserId = useMemo(() => {
    const nextMap = new Map();

    (activeOpinIntents || []).forEach((post) => {
      const targetUserId = post?.userId || '';
      if (!targetUserId) return;
      if (!nextMap.has(targetUserId) || getOpinPostActivityMs(post) > getOpinPostActivityMs(nextMap.get(targetUserId))) {
        nextMap.set(targetUserId, post);
      }
    });

    return nextMap;
  }, [activeOpinIntents]);

  const privateMatchCandidates = useMemo(() => {
    const nowMs = Date.now();
    if (isHeteroRoom || !user?.id || !Array.isArray(roomUsers) || roomUsers.length === 0) return [];

    return roomUsers
      .map((presenceUser) => {
        const userId = presenceUser?.userId || presenceUser?.id || '';
        if (!userId || userId === user.id) return null;
        if (isSystemUserId(userId) || isAutomatedUserId(userId)) return null;
        if (blockedUserIds.has(userId) || blockedByUserIds.has(userId)) return null;
        if (activePrivatePartnerIds.has(userId)) return null;

        const normalizedRole = resolveProfileRole(
          presenceUser?.roleBadge,
          presenceUser?.profileRole,
          latestRoleByConnectedUser.get(userId)
        );
        const candidateComuna = normalizeComuna(
          presenceUser?.comuna ||
          latestComunaByConnectedUser.get(userId)
        );
        const lastActivityMs = getPresenceActivityMs(presenceUser);
        const availableForChat = isUserAvailableForConversation(presenceUser, nowMs);
        const roleCompatibilityScore = clampScore(
          getRoleCompatibilityScore(currentUserResolvedRole, normalizedRole)
          + getComunaMatchBoost(currentUserComuna, candidateComuna)
        );
        const activityRecentScore = getActivityRecencyScore(lastActivityMs, nowMs);
        const timeProximityScore = getTimeProximityScore({
          availableForChat,
          lastActivityMs,
          nowMs,
        });
        const opinIntent = opinIntentByUserId.get(userId) || null;
        const intentSignal = recentIntentSignalByUserId.get(userId) || null;
        const opinIntentScore = opinIntent
          ? clampScore(68 + getActivityRecencyScore(getOpinPostActivityMs(opinIntent), nowMs) * 0.24)
          : 0;
        const publicIntentScore = clampScore(intentSignal?.matchScore || 0);
        const intentScore = clampScore(Math.max(publicIntentScore, opinIntentScore));
        const weightedScore = (
          roleCompatibilityScore * 0.4
          + activityRecentScore * 0.3
          + intentScore * 0.2
          + timeProximityScore * 0.1
        );
        const persistedState = mergePrivateSuggestionEntries(
          privateSuggestionScoreMapRef.current.get(userId),
          privateMatchStateByTarget.get(userId)
        );
        const persistedPenalty = getPrivateSuggestionPenalty(persistedState);
        const score = weightedScore - persistedPenalty;

        const baseCandidate = {
          id: userId,
          userId,
          username: presenceUser?.username || 'Usuario',
          avatar: resolveChatAvatar(presenceUser?.avatar),
          isPremium: Boolean(presenceUser?.isPremium || presenceUser?.isProUser),
          isGuest: Boolean(presenceUser?.isGuest || presenceUser?.isAnonymous),
          roleBadge: normalizedRole || null,
          chatSeekingBadgeLabel: presenceUser?.chatSeekingBadgeLabel || null,
          comuna: candidateComuna || null,
          sameComuna: Boolean(candidateComuna && currentUserComuna && getComunaKey(candidateComuna) === getComunaKey(currentUserComuna)),
          suggestionState: persistedState,
          availableForChat,
          lastActivityMs,
          intentSummary: intentSignal?.summary || '',
          opinIntent,
          opportunityText: truncateOpportunityText(
            opinIntent?.text || intentSignal?.summary || [normalizedRole, candidateComuna].filter(Boolean).join(' · ')
          ),
          opportunityMeta: opinIntent
            ? getOpinStatusMeta(opinIntent.status).shortLabel
            : (intentSignal?.directRoleMatch ? 'En sala' : 'Reciente'),
          opportunitySource: opinIntent ? 'opin' : (intentSignal ? 'chat' : 'presence'),
          scoring: {
            compatibility: Math.round(roleCompatibilityScore),
            activity: Math.round(activityRecentScore),
            intent: Math.round(intentScore),
            time: Math.round(timeProximityScore),
          },
          score,
        };
        const matchReasons = buildPrivateMatchReasons({
          candidate: baseCandidate,
          nowMs,
        });

        return {
          ...baseCandidate,
          matchReasons,
          matchHeadline: buildPrivateMatchHeadline(matchReasons),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [
    roomUsers,
    user?.id,
    blockedUserIds,
    blockedByUserIds,
    activePrivatePartnerIds,
    currentUserResolvedRole,
    currentUserComuna,
    latestRoleByConnectedUser,
    latestComunaByConnectedUser,
    isSystemUserId,
    isAutomatedUserId,
    isHeteroRoom,
    privateMatchStateByTarget,
    privateSuggestionScoreVersion,
    recentIntentSignalByUserId,
    opinIntentByUserId,
  ]);

  const persistentPrivateSuggestionCandidates = useMemo(() => {
    if (!user?.id || !Array.isArray(persistentPrivateSuggestionCatalog) || persistentPrivateSuggestionCatalog.length === 0) return [];

    const nowMs = Date.now();

    return persistentPrivateSuggestionCatalog
      .map((candidate) => {
        const targetUserId = candidate?.userId || candidate?.id || '';
        if (!targetUserId || targetUserId === user.id) return null;
        if (blockedUserIds.has(targetUserId) || blockedByUserIds.has(targetUserId)) return null;
        if (activePrivatePartnerIds.has(targetUserId)) return null;

        const normalizedRole = resolveProfileRole(candidate?.roleBadge);
        const candidateComuna = normalizeComuna(candidate?.comuna || '') || null;
        const sameComuna = Boolean(
          candidateComuna
          && currentUserComuna
          && getComunaKey(candidateComuna) === getComunaKey(currentUserComuna)
        );
        const roleCompatibilityScore = clampScore(
          getRoleCompatibilityScore(currentUserResolvedRole, normalizedRole)
          + getComunaMatchBoost(currentUserComuna, candidateComuna)
        );
        const interestScore = getInterestOverlapScore(
          currentUserSuggestionTokens,
          candidate?.candidateTokens
        );
        const offlineIntent = extractPublicMatchIntent({
          content: [candidate?.buscando, candidate?.description, candidate?.chatSeekingBadgeLabel].filter(Boolean).join('. '),
          fallbackRole: normalizedRole,
        });
        const publicIntentScore = clampScore(
          Math.max(
            offlineIntent?.confidence || 0,
            candidate?.buscando ? 48 : 0,
            candidate?.chatSeekingBadgeLabel ? 40 : 0
          )
        );
        const activityRecentScore = getActivityRecencyScore(candidate?.lastActivityMs, nowMs);
        const weightedScore = (
          roleCompatibilityScore * 0.42
          + interestScore * 0.3
          + publicIntentScore * 0.18
          + activityRecentScore * 0.1
        );
        const persistedState = mergePrivateSuggestionEntries(
          privateSuggestionScoreMapRef.current.get(targetUserId),
          privateMatchStateByTarget.get(targetUserId)
        );
        const persistedPenalty = getPrivateSuggestionPenalty(persistedState);
        const score = weightedScore - persistedPenalty;
        const summarySource = candidate?.buscando || candidate?.description || candidate?.chatSeekingBadgeLabel || '';

        const baseCandidate = {
          id: targetUserId,
          userId: targetUserId,
          username: candidate?.username || 'Usuario',
          avatar: candidate?.avatar || '',
          isPremium: Boolean(candidate?.isPremium),
          isGuest: Boolean(candidate?.isGuest),
          roleBadge: normalizedRole || null,
          chatSeekingBadgeLabel: candidate?.chatSeekingBadgeLabel || null,
          comuna: candidateComuna,
          sameComuna,
          suggestionState: persistedState,
          availableForChat: false,
          lastActivityMs: candidate?.lastActivityMs || null,
          intentSummary: summarySource,
          opinIntent: null,
          opportunityText: truncateOpportunityText(
            summarySource || [normalizedRole, candidateComuna].filter(Boolean).join(' · ')
          ),
          opportunityMeta: sameComuna ? 'Tu comuna' : 'Perfil',
          opportunitySource: 'catalog',
          scoring: {
            compatibility: Math.round(roleCompatibilityScore),
            activity: Math.round(activityRecentScore),
            intent: Math.round(Math.max(interestScore, publicIntentScore)),
            time: Math.round(activityRecentScore),
          },
          score,
        };
        const matchReasons = buildPrivateMatchReasons({
          candidate: baseCandidate,
          nowMs,
        });

        return {
          ...baseCandidate,
          matchReasons,
          matchHeadline: buildPrivateMatchHeadline(matchReasons),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [
    persistentPrivateSuggestionCatalog,
    user?.id,
    blockedUserIds,
    blockedByUserIds,
    activePrivatePartnerIds,
    currentUserResolvedRole,
    currentUserComuna,
    currentUserSuggestionTokens,
    privateMatchStateByTarget,
    privateSuggestionScoreVersion,
  ]);

  const mergedPrivateSuggestionCandidates = useMemo(() => {
    const merged = new Map();

    [...persistentPrivateSuggestionCandidates, ...privateMatchCandidates].forEach((candidate) => {
      const targetUserId = candidate?.userId || candidate?.id;
      if (!targetUserId) return;

      const existing = merged.get(targetUserId);
      if (!existing || Number(candidate?.score || 0) > Number(existing?.score || 0)) {
        merged.set(targetUserId, candidate);
      } else if (existing && candidate?.opportunitySource === 'presence') {
        const nextCandidate = {
          ...existing,
          availableForChat: Boolean(candidate?.availableForChat),
          opportunityMeta: existing?.opportunityMeta === 'Perfil' ? candidate?.opportunityMeta : existing?.opportunityMeta,
          opportunitySource: candidate?.opportunitySource,
          lastActivityMs: candidate?.lastActivityMs || existing?.lastActivityMs,
          sameComuna: Boolean(existing?.sameComuna || candidate?.sameComuna),
        };
        const matchReasons = buildPrivateMatchReasons({
          candidate: nextCandidate,
        });

        merged.set(targetUserId, {
          ...nextCandidate,
          matchReasons,
          matchHeadline: buildPrivateMatchHeadline(matchReasons),
        });
      }
    });

    return Array.from(merged.values()).sort((a, b) => Number(b?.score || 0) - Number(a?.score || 0));
  }, [persistentPrivateSuggestionCandidates, privateMatchCandidates]);

  const intentDrivenPrivateMatchSignal = useMemo(() => {
    if (isHeteroRoom || !user?.id || !currentUserResolvedRole) return null;
    if (!Array.isArray(filteredMessages) || filteredMessages.length === 0) return null;
    if (!Array.isArray(privateMatchCandidates) || privateMatchCandidates.length === 0) return null;

    const candidateByUserId = new Map(
      privateMatchCandidates.map((candidate) => [candidate.userId || candidate.id, candidate])
    );
    const currentRoleBucket = getRoleBucket(currentUserResolvedRole);
    if (currentRoleBucket === 'otro') return null;

    for (let i = filteredMessages.length - 1; i >= 0; i -= 1) {
      const msg = filteredMessages[i];
      const senderId = msg?.userId || '';
      if (!senderId || senderId === user.id) continue;
      if (isSystemUserId(senderId) || isAutomatedUserId(senderId)) continue;

      const candidate = candidateByUserId.get(senderId);
      if (!candidate) continue;

      const timestampMs = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number'
            ? msg.timestamp
            : (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));
      if (!timestampMs || (Date.now() - timestampMs) > 45000) continue;

      const fallbackRole = candidate.roleBadge || msg?.roleBadge || msg?.profileRole || msg?.role;
      const intent = extractPublicMatchIntent({
        content: msg?.content || '',
        fallbackRole,
      });
      if (!intent.isContextual || intent.confidence < 34) continue;

      const seekingBuckets = intent.seekingBuckets || [];
      if (!seekingBuckets.includes(currentRoleBucket) && !seekingBuckets.includes('versatil')) continue;

      const boostedScore = candidate.score + intent.confidence + (intent.hasExplicitSeek ? 24 : 0);
      return {
        key: `${senderId}:${timestampMs}:${String(msg?.content || '').slice(0, 40)}`,
        partner: candidate,
        confidence: intent.confidence,
        score: boostedScore,
        offeredRole: candidate.roleBadge || fallbackRole || null,
        seekingBucket: currentRoleBucket,
        messageId: msg?.id || null,
        messageTimestampMs: timestampMs,
      };
    }

    return null;
  }, [
    currentUserResolvedRole,
    filteredMessages,
    isAutomatedUserId,
    isHeteroRoom,
    isSystemUserId,
    privateMatchCandidates,
    user?.id,
  ]);

  const offlineIntentDrivenPrivateMatchSignal = useMemo(() => {
    if (isHeteroRoom || !user?.id || !currentUserResolvedRole) return null;
    if (!Array.isArray(filteredMessages) || filteredMessages.length === 0) return null;
    if (!Array.isArray(recentPresenceFallbackUsers) || recentPresenceFallbackUsers.length === 0) return null;

    const activeCandidateIds = new Set(
      (privateMatchCandidates || []).map((candidate) => candidate.userId || candidate.id).filter(Boolean)
    );
    const offlineCandidateByUserId = new Map(
      recentPresenceFallbackUsers
        .filter((candidate) => {
          const candidateId = candidate?.userId || candidate?.id;
          if (!candidateId || candidateId === user.id) return false;
          if (activeCandidateIds.has(candidateId)) return false;
          if (candidate?.isGuest || candidate?.isAnonymous) return false;
          const lastConnectedAt = Number(candidate?.lastConnectedAt || 0);
          return lastConnectedAt > 0 && (Date.now() - lastConnectedAt) <= (3 * 60 * 60 * 1000);
        })
        .map((candidate) => [candidate.userId || candidate.id, candidate])
    );

    if (offlineCandidateByUserId.size === 0) return null;

    const currentRoleBucket = getRoleBucket(currentUserResolvedRole);
    if (currentRoleBucket === 'otro') return null;

    for (let i = filteredMessages.length - 1; i >= 0; i -= 1) {
      const msg = filteredMessages[i];
      const senderId = msg?.userId || '';
      if (!senderId || senderId === user.id) continue;
      if (isSystemUserId(senderId) || isAutomatedUserId(senderId)) continue;

      const candidate = offlineCandidateByUserId.get(senderId);
      if (!candidate) continue;

      const timestampMs = msg.timestampMs ||
        (msg.timestamp?.toMillis?.() ||
          (typeof msg.timestamp === 'number'
            ? msg.timestamp
            : (msg.timestamp ? new Date(msg.timestamp).getTime() : null)));
      if (!timestampMs || (Date.now() - timestampMs) > (3 * 60 * 60 * 1000)) continue;

      const fallbackRole = candidate.roleBadge || msg?.roleBadge || msg?.profileRole || msg?.role;
      const intent = extractPublicMatchIntent({
        content: msg?.content || '',
        fallbackRole,
      });
      if (!intent.isContextual || intent.confidence < 34) continue;

      const seekingBuckets = intent.seekingBuckets || [];
      if (!seekingBuckets.includes(currentRoleBucket) && !seekingBuckets.includes('versatil')) continue;

      return {
        key: `offline:${senderId}:${timestampMs}:${String(msg?.content || '').slice(0, 40)}`,
        partner: {
          ...candidate,
          score: (
            getRoleCompatibilityScore(currentUserResolvedRole, candidate.roleBadge)
            + getComunaMatchBoost(currentUserComuna, candidate.comuna)
          ) - getPrivateSuggestionPenalty(mergePrivateSuggestionEntries(
            privateSuggestionScoreMapRef.current.get(senderId),
            privateMatchStateByTarget.get(senderId)
          )),
        },
        confidence: intent.confidence,
        offeredRole: candidate.roleBadge || fallbackRole || null,
        seekingBucket: currentRoleBucket,
        messageId: msg?.id || null,
        messageTimestampMs: timestampMs,
        isOnline: false,
      };
    }

    return null;
  }, [
    currentUserComuna,
    currentUserResolvedRole,
    filteredMessages,
    isAutomatedUserId,
    isHeteroRoom,
    isSystemUserId,
    privateMatchCandidates,
    privateMatchStateByTarget,
    recentPresenceFallbackUsers,
    user?.id,
  ]);

  const compatibleNowStripUsers = useMemo(() => {
    if (isHeteroRoom) return [];
    const todayKey = getPrivateMatchDayKey();
    return (privateMatchCandidates || [])
      .filter((candidate) => (
        !candidate?.isGuest
        && !candidate?.isAnonymous
        && candidate?.suggestionState?.suggestedDayKey !== todayKey
      ))
      .slice(0, PRIVATE_MATCH_TOP_LIMIT);
  }, [isHeteroRoom, privateMatchCandidates]);

  const pendingPrivateInboxReturnSignal = useMemo(() => {
    if (!user?.id || !Array.isArray(privateInboxItems) || privateInboxItems.length === 0) return null;
    if (!Array.isArray(roomUsers) || roomUsers.length === 0) return null;

    const onlineUsersById = new Map(
      roomUsers
        .map((presenceUser) => {
          const candidateId = presenceUser?.userId || presenceUser?.id || '';
          if (!candidateId || candidateId === user.id) return null;
          if (isSystemUserId(candidateId) || isAutomatedUserId(candidateId)) return null;
          return [candidateId, presenceUser];
        })
        .filter(Boolean)
    );
    if (onlineUsersById.size === 0) return null;

    const openPartnerIds = new Set(
      (openPrivateChats || [])
        .map((chatWindow) => chatWindow?.partner?.userId || chatWindow?.partner?.id)
        .filter(Boolean)
    );

    for (const item of privateInboxItems) {
      const targetUserId = item?.otherUserId || null;
      if (!targetUserId || targetUserId === user.id) continue;
      if (openPartnerIds.has(targetUserId)) continue;
      if (item?.lastMessageSenderId !== user.id) continue;
      if (!onlineUsersById.has(targetUserId)) continue;

      const lastMessageAtMs = Number(
        item?.lastMessageAt?.toMillis?.()
        || item?.updatedAt?.toMillis?.()
        || item?.lastMessageAt
        || item?.updatedAt
        || 0
      );
      if (!lastMessageAtMs || (Date.now() - lastMessageAtMs) > (2 * 24 * 60 * 60 * 1000)) continue;

      const onlineProfile = onlineUsersById.get(targetUserId) || {};
      return {
        key: `${item?.chatId || item?.conversationId || 'private'}:${targetUserId}:${lastMessageAtMs}`,
        chatId: item?.chatId || item?.conversationId || null,
        targetUserId,
        username: onlineProfile?.username || item?.otherUserDisplayName || 'Usuario',
        avatar: resolveChatAvatar(onlineProfile?.avatar || item?.otherUserAvatar || ''),
        roleBadge: resolveProfileRole(
          onlineProfile?.roleBadge,
          onlineProfile?.profileRole,
          latestRoleByConnectedUser.get(targetUserId)
        ),
        comuna: normalizeComuna(
          onlineProfile?.comuna ||
          latestComunaByConnectedUser.get(targetUserId) ||
          ''
        ),
      };
    }

    return null;
  }, [
    user?.id,
    privateInboxItems,
    roomUsers,
    openPrivateChats,
    latestRoleByConnectedUser,
    latestComunaByConnectedUser,
    isSystemUserId,
    isAutomatedUserId,
  ]);

  const clearRandomConnectPendingTimeout = useCallback(() => {
    const session = randomConnectSessionRef.current;
    if (session.pendingTimeoutId) {
      window.clearTimeout(session.pendingTimeoutId);
      session.pendingTimeoutId = null;
    }
  }, []);
  clearRandomConnectPendingTimeoutRef.current = clearRandomConnectPendingTimeout;

  const stopRandomConnect = useCallback(() => {
    const session = randomConnectSessionRef.current;
    session.active = false;
    session.queue = [];
    session.pendingRequestId = null;
    session.pendingTargetId = null;
    session.pendingTargetName = '';
    if (session.pendingTimeoutId) {
      window.clearTimeout(session.pendingTimeoutId);
      session.pendingTimeoutId = null;
    }
    setIsRandomConnectActive(false);
  }, []);
  stopRandomConnectRef.current = stopRandomConnect;

  const sendNextRandomConnectInvite = useCallback(async ({ reason = 'initial' } = {}) => {
    const session = randomConnectSessionRef.current;
    if (!session.active || session.pendingRequestId) return;
    if (!user?.id) {
      stopRandomConnect();
      return;
    }

    while (session.active && session.queue.length > 0) {
      const nextCandidate = session.queue.shift();
      const targetUserId = nextCandidate?.userId || nextCandidate?.id || null;
      if (!targetUserId || targetUserId === user.id) continue;
      if (nextCandidate?.isGuest || nextCandidate?.isAnonymous) continue;

      const blockedUntil = privateMatchCooldownByTargetRef.current.get(targetUserId) || 0;
      const now = Date.now();
      if (blockedUntil > now) continue;
      if (blockedUntil > 0 && blockedUntil <= now) {
        privateMatchCooldownByTargetRef.current.delete(targetUserId);
      }

      try {
        const blocked = await isBlockedBetween(user.id, targetUserId);
        if (blocked) continue;

        const selectedStarter = RANDOM_CONNECT_STARTERS[
          Math.floor(Math.random() * RANDOM_CONNECT_STARTERS.length)
        ];

        const result = await sendPrivateChatRequest(user.id, targetUserId, {
          source: RANDOM_CONNECT_SOURCE,
          systemPrompt: 'Conexión aleatoria rápida: ambos están en línea para conversar.',
          suggestedStarter: selectedStarter,
          expiresAtMs: Date.now() + PRIVATE_MATCH_REQUEST_WINDOW_MS,
        });

        if (!session.active) return;

        session.pendingRequestId = result?.requestId || null;
        session.pendingTargetId = targetUserId;
        session.pendingTargetName = nextCandidate?.username || 'este usuario';
        privateMatchCooldownByTargetRef.current.set(
          targetUserId,
          Date.now() + PRIVATE_MATCH_COOLDOWN_MS
        );

        clearRandomConnectPendingTimeout();
        session.pendingTimeoutId = window.setTimeout(() => {
          const currentSession = randomConnectSessionRef.current;
          if (!currentSession.active) return;
          if (currentSession.pendingTargetId !== targetUserId) return;

          const timedOutName = currentSession.pendingTargetName || 'este usuario';
          currentSession.pendingRequestId = null;
          currentSession.pendingTargetId = null;
          currentSession.pendingTargetName = '';
          currentSession.pendingTimeoutId = null;

          toast({
            title: 'Sin respuesta',
            description: `${timedOutName} no respondió a tiempo. Probando con otro usuario...`,
          });

          void sendNextRandomConnectInvite({ reason: 'timeout' });
        }, PRIVATE_MATCH_REQUEST_WINDOW_MS + 1200);

        setPrivateMatchSuggestion(null);
        lastInteractionAtRef.current = Date.now();

        toast({
          title: reason === 'initial' ? 'Conexión aleatoria activada' : 'Probando otro usuario',
          description: `Invitación enviada a ${session.pendingTargetName}.`,
        });
        return;
      } catch (error) {
        const recoverable = error?.message === 'BLOCKED' || error?.message === 'SELF_REQUEST_NOT_ALLOWED';
        if (recoverable) continue;

        console.error('Error sending random connect request:', error);
        stopRandomConnect();
        toast({
          title: 'No pudimos iniciar conexión al azar',
          description: 'Intenta de nuevo en unos segundos.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (session.active) {
      stopRandomConnect();
      toast({
        title: 'Sin usuarios disponibles',
        description: 'No hay más usuarios disponibles para conexión al azar en este momento.',
      });
    }
  }, [clearRandomConnectPendingTimeout, stopRandomConnect, user?.id]);
  sendNextRandomConnectInviteRef.current = sendNextRandomConnectInvite;

  const handleToggleRandomConnect = useCallback(() => {
    if (!auth.currentUser || !user?.id) {
      setRegistrationModalFeature('chat privado');
      setShowRegistrationModal(true);
      return;
    }

    if (isRandomConnectActive) {
      stopRandomConnect();
      toast({
        title: 'Conexión al azar detenida',
        description: 'No se enviarán más invitaciones automáticas.',
      });
      return;
    }

    if ((openPrivateChatsRef.current || []).length > 0) {
      toast({
        title: 'Ya tienes un chat privado abierto',
        description: 'Cierra el privado actual para iniciar una conexión al azar.',
      });
      return;
    }

    const availableCandidates = shuffleArray(
      (privateMatchCandidates || []).filter(
        (candidate) => !candidate?.isGuest && !candidate?.isAnonymous
      )
    );

    if (availableCandidates.length === 0) {
      toast({
        title: 'Sin usuarios disponibles',
        description: 'Ahora mismo no hay usuarios aptos para conectar al azar.',
      });
      return;
    }

    const session = randomConnectSessionRef.current;
    clearRandomConnectPendingTimeout();
    session.active = true;
    session.queue = availableCandidates;
    session.pendingRequestId = null;
    session.pendingTargetId = null;
    session.pendingTargetName = '';
    setIsRandomConnectActive(true);
    setPrivateMatchSuggestion(null);

    void sendNextRandomConnectInvite({ reason: 'initial' });
  }, [
    clearRandomConnectPendingTimeout,
    isRandomConnectActive,
    privateMatchCandidates,
    sendNextRandomConnectInvite,
    stopRandomConnect,
    user?.id,
    user?.isAnonymous,
    user?.isGuest,
  ]);

  useEffect(() => () => {
    const session = randomConnectSessionRef.current;
    if (session.pendingTimeoutId) {
      window.clearTimeout(session.pendingTimeoutId);
      session.pendingTimeoutId = null;
    }
  }, []);

  useEffect(() => {
    if (!isRandomConnectActive) return;
    if ((openPrivateChats?.length || 0) > 0) {
      stopRandomConnect();
    }
  }, [openPrivateChats, isRandomConnectActive, stopRandomConnect]);

  const markChatInteraction = useCallback(() => {
    lastInteractionAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    const markInteraction = () => {
      lastInteractionAtRef.current = Date.now();
      const activeSuggestion = privateMatchSuggestionRef.current;
      if (
        activeSuggestion
        && !isSendingPrivateMatchRequestRef.current
        && !isOpeningContextualOpportunityRef.current
        && (Date.now() - Number(activeSuggestion?.shownAtMs || 0)) > 600
      ) {
        setPrivateMatchSuggestion(null);
      }
    };

    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });
    };
  }, []);

  useEffect(() => {
    lastInteractionAtRef.current = Date.now();
    setPrivateMatchSuggestion(null);
    responseRescueShownKeysRef.current.clear();
    loadingRescueShownRef.current = false;
    stopRandomConnect();
  }, [currentRoom, user?.id, stopRandomConnect]);

  const getMessageTimestampMs = useCallback((msg) => (
    msg?.timestampMs ||
    (msg?.timestamp?.toMillis?.() ||
      (typeof msg?.timestamp === 'number'
        ? msg.timestamp
        : (msg?.timestamp ? new Date(msg.timestamp).getTime() : null))) ||
    null
  ), []);

  const getMessageSignalKey = useCallback((msg) => {
    if (!msg) return null;
    return [
      msg.userId || 'nouser',
      getMessageTimestampMs(msg) || 'notime',
      String(msg.content || '').slice(0, 40),
      msg.type || 'text',
    ].join(':');
  }, [getMessageTimestampMs]);

  const getNextPrivateMatchCandidate = useCallback(() => {
    if (!Array.isArray(privateMatchCandidates) || privateMatchCandidates.length === 0) return null;

    const now = Date.now();
    const todayKey = getPrivateMatchDayKey(now);
    const cooldownMap = privateMatchCooldownByTargetRef.current;

    return privateMatchCandidates.find((item) => {
      const candidateId = item?.userId || item?.id;
      if (!candidateId) return false;
      if (item?.isGuest || item?.isAnonymous) return false;
      if (item?.suggestionState?.suggestedDayKey === todayKey) return false;

      const blockedUntil = cooldownMap.get(candidateId) || 0;
      if (blockedUntil > now) return false;
      if (blockedUntil > 0 && blockedUntil <= now) cooldownMap.delete(candidateId);
      return true;
    }) || null;
  }, [privateMatchCandidates]);

  useEffect(() => {
    if (!user?.id || currentRoom !== 'principal' || isHeteroRoom) return undefined;
    if (!Array.isArray(privateMatchCandidates) || privateMatchCandidates.length === 0) return undefined;

    const entryKey = `${user.id}:${currentRoom}`;
    if (roomEntrySuggestionShownRef.current.has(entryKey)) return undefined;

    const timeoutId = window.setTimeout(() => {
      if (roomEntrySuggestionShownRef.current.has(entryKey)) return;
      if (privateChatRequestRef.current || privateMatchSuggestionRef.current) return;
      if (isSendingPrivateMatchRequestRef.current || isOpeningContextualOpportunityRef.current) return;
      if ((openPrivateChatsRef.current || []).length > 0) return;

      const candidate = getNextPrivateMatchCandidate();
      if (!candidate) return;

      roomEntrySuggestionShownRef.current.add(entryKey);
      if (roomEntrySuggestionShownRef.current.size > 40) {
        roomEntrySuggestionShownRef.current = new Set(
          Array.from(roomEntrySuggestionShownRef.current).slice(-20)
        );
      }

      privateMatchLastShownAtRef.current = Date.now();
      bumpPrivateSuggestionScore(candidate.userId, 1, 'shown');
      setPrivateMatchSuggestion({
        partner: candidate,
        source: 'room_entry_suggestion',
        shownAtMs: Date.now(),
        systemText: candidate.intentSummary
          ? `Hay una oportunidad relevante ahora: "${candidate.intentSummary}".`
          : 'Hay alguien compatible y activo ahora mismo para abrir privado.',
        quickGreetings: PRIVATE_MATCH_QUICK_GREETINGS,
      });
    }, PRIVATE_MATCH_INITIAL_SUGGESTION_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    bumpPrivateSuggestionScore,
    currentRoom,
    getNextPrivateMatchCandidate,
    isHeteroRoom,
    privateMatchCandidates,
    user?.id,
  ]);

  const privateResponseRescueSignal = useMemo(() => {
    if (!user?.id || !Array.isArray(filteredMessages) || filteredMessages.length === 0) {
      return null;
    }

    const realMessages = filteredMessages.filter((msg) => {
      const senderId = msg?.userId || '';
      return senderId && !isSystemUserId(senderId) && !isAutomatedUserId(senderId);
    });

    if (realMessages.length === 0) return null;

    const lastRealMessage = realMessages[realMessages.length - 1];
    if (!lastRealMessage || lastRealMessage.userId !== user.id) return null;

    const trailingOwnMessages = [];
    for (let i = realMessages.length - 1; i >= 0; i -= 1) {
      const msg = realMessages[i];
      if (msg.userId !== user.id) break;
      trailingOwnMessages.unshift(msg);
    }

    if (trailingOwnMessages.length === 0) return null;

    const latestOwnMessage = trailingOwnMessages[trailingOwnMessages.length - 1];
    const latestOwnTimestampMs = getMessageTimestampMs(latestOwnMessage);
    if (!latestOwnTimestampMs) return null;

    const ageMs = Date.now() - latestOwnTimestampMs;
    const latestOwnMessageKey = getMessageSignalKey(latestOwnMessage);
    if (!latestOwnMessageKey) return null;

    if (trailingOwnMessages.length >= 2 && ageMs >= PRIVATE_MATCH_FRUSTRATION_MS) {
      return {
        type: 'frustration',
        messageKey: latestOwnMessageKey,
        ageMs,
        trailingOwnCount: trailingOwnMessages.length,
      };
    }

    if (trailingOwnMessages.length === 1 && ageMs >= PRIVATE_MATCH_NO_RESPONSE_MS) {
      return {
        type: 'no_response',
        messageKey: latestOwnMessageKey,
        ageMs,
        trailingOwnCount: 1,
      };
    }

    return null;
  }, [
    filteredMessages,
    user?.id,
    isSystemUserId,
    isAutomatedUserId,
    getMessageTimestampMs,
    getMessageSignalKey,
  ]);

  useEffect(() => {
    if (!user?.id || currentRoom !== 'principal') return undefined;

    const interval = setInterval(() => {
      const now = Date.now();

      if (privateChatRequestRef.current) return;
      if (privateMatchSuggestionRef.current) return;
      if (isSendingPrivateMatchRequestRef.current || isOpeningContextualOpportunityRef.current) return;
      if (isInputFocused) return;
      if ((openPrivateChatsRef.current || []).length > 0) return;
      if (now - lastInteractionAtRef.current < PRIVATE_MATCH_IDLE_MS) return;
      if (now - privateMatchLastShownAtRef.current < PRIVATE_MATCH_COOLDOWN_MS) return;

      const cooldownMap = privateMatchCooldownByTargetRef.current;
      const candidate = privateMatchCandidates.find((item) => {
        const blockedUntil = cooldownMap.get(item.userId) || 0;
        if (blockedUntil > now) return false;
        if (blockedUntil > 0 && blockedUntil <= now) cooldownMap.delete(item.userId);
        return true;
      });

      if (!candidate) return;

      bumpPrivateSuggestionScore(candidate.userId, 1);
      setPrivateMatchSuggestion({
        partner: candidate,
        source: 'idle_matching_engine_v1',
        shownAtMs: now,
        systemText: candidate.intentSummary
          ? `Vimos una oportunidad relevante ahora: "${candidate.intentSummary}".`
          : 'Chactivo detectó una oportunidad relevante para abrir privado ahora.',
        quickGreetings: PRIVATE_MATCH_QUICK_GREETINGS,
      });
      privateMatchLastShownAtRef.current = now;
    }, 1000);

    return () => clearInterval(interval);
  }, [bumpPrivateSuggestionScore, currentRoom, privateMatchCandidates, user?.id, isInputFocused]);

  useEffect(() => {
    if (!user?.id || currentRoom !== 'principal' || isHeteroRoom) return;
    if (!isLoadingMessages) return;
    if (!['delayed', 'extended'].includes(messagesLoadingStage)) return;
    if (loadingRescueShownRef.current) return;
    if (privateChatRequestRef.current || privateMatchSuggestionRef.current) return;
    if ((openPrivateChatsRef.current || []).length > 0) return;

    const candidate = getNextPrivateMatchCandidate();
    if (!candidate) return;

    loadingRescueShownRef.current = true;
    privateMatchLastShownAtRef.current = Date.now();
    bumpPrivateSuggestionScore(candidate.userId, 1);

    setPrivateMatchSuggestion({
      partner: candidate,
      source: 'loading_rescue',
      shownAtMs: Date.now(),
      systemText: candidate.intentSummary
        ? `La sala viene lenta, pero hay una oportunidad activa: "${candidate.intentSummary}".`
        : 'La sala viene lenta, pero hay gente disponible ahora mismo para hablar 1 a 1.',
      quickGreetings: PRIVATE_MATCH_QUICK_GREETINGS,
    });

    track('private_rescue_module_view', {
      roomId: currentRoom,
      stage: messagesLoadingStage,
      candidateUserId: candidate.userId,
    }, { user }).catch(() => {});
  }, [
    currentRoom,
    user,
    isHeteroRoom,
    isLoadingMessages,
    messagesLoadingStage,
    bumpPrivateSuggestionScore,
    getNextPrivateMatchCandidate,
  ]);

  useEffect(() => {
    if (!user?.id || currentRoom !== 'principal' || isHeteroRoom) return;
    if (!privateResponseRescueSignal) return;
    if (privateChatRequestRef.current || privateMatchSuggestionRef.current) return;
    if ((openPrivateChatsRef.current || []).length > 0) return;

    const signalKey = privateResponseRescueSignal.messageKey;
    if (!signalKey || responseRescueShownKeysRef.current.has(signalKey)) return;

    const candidate = getNextPrivateMatchCandidate();
    if (!candidate) return;

    responseRescueShownKeysRef.current.add(signalKey);
    privateMatchLastShownAtRef.current = Date.now();
    bumpPrivateSuggestionScore(candidate.userId, 1);

    const isFrustration = privateResponseRescueSignal.type === 'frustration';
    setPrivateMatchSuggestion({
      partner: candidate,
      source: isFrustration ? 'frustration_nudge' : 'no_response_nudge',
      shownAtMs: Date.now(),
      systemText: isFrustration
        ? (candidate.intentSummary
          ? `Llevas un rato sin respuesta. Esta oportunidad parece más alineada: "${candidate.intentSummary}".`
          : 'Llevas un rato sin respuesta en sala. En privado suelen responder más rápido.')
        : (candidate.intentSummary
          ? `Si no te responden en sala, prueba con esto: "${candidate.intentSummary}".`
          : 'Hay personas disponibles ahora mismo. Si no te responden en sala, prueba abrir un privado.'),
      quickGreetings: PRIVATE_MATCH_QUICK_GREETINGS,
    });

    track(
      isFrustration ? 'private_frustration_detected' : 'private_nudge_shown_after_no_response',
      {
        roomId: currentRoom,
        candidateUserId: candidate.userId,
        trailingOwnCount: privateResponseRescueSignal.trailingOwnCount,
        ageMs: privateResponseRescueSignal.ageMs,
      },
      { user }
    ).catch(() => {});
  }, [
    currentRoom,
    user,
    isHeteroRoom,
    privateResponseRescueSignal,
    bumpPrivateSuggestionScore,
    getNextPrivateMatchCandidate,
  ]);

  const formatRelativeTime = useCallback((timestampMs, nowMs) => {
    if (!timestampMs || !nowMs) return '';
    const diffMs = Math.max(0, nowMs - timestampMs);
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'menos de 1 min';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} d`;
  }, []);

  // Inyectar mensajes de sistema: hora pico + nudges de inactividad
  const visibleMessages = useMemo(() => {
    const now = new Date();
    const chileHour = (now.getUTCHours() - 3 + 24) % 24;
    const isPeakHour = chileHour >= 21 || chileHour < 1;
    const result = filteredMessages.map((message) => {
      if (!message || message.type !== 'text' || message.userId === 'system') {
        return message;
      }

      return {
        ...message,
        _signalMeta: getPublicMessageSignalMeta({
          content: message.content || '',
          fallbackRole: message.roleBadge || message.profileRole || message.role,
        }),
      };
    });
    let isPeakHourShown = false;
    let idleNudgeShown = false;

    // Hora pico: si hay 5+ usuarios en horario peak
    if (isPeakHour && activeUsersCount >= 5) {
      result.push({
        id: '_peak_hour_system',
        type: 'system',
        text: `Hora pico — hay ${activeUsersCount} personas activas ahora`,
        timestamp: now,
        userId: 'system',
        username: 'Sistema',
      });
      isPeakHourShown = true;
    }

    // Nudges de engagement (sin revelar tiempo de inactividad)
    if (!isPeakHourShown && filteredMessages.length > 0 && lastMessageMs) {
      const idleMs = activityNow - lastMessageMs;
      const idleMinutes = Math.floor(idleMs / 60000);

      if (idleMinutes >= 3) {
        let nudge = null;
        const topicIndex = Math.abs(new Date(activityNow).getUTCDate() + (idleMinutes > 60 ? 1 : 0)) % DAILY_TOPICS.length;

        if (activeUsersCount >= 4) {
          nudge = {
            id: '_nudge_idle_crowd',
            text: `${activeUsersCount} personas conectadas · ¿Quién rompe el hielo?`,
          };
        } else if (activeUsersCount >= 2) {
          nudge = {
            id: '_nudge_idle_few',
            text: DAILY_TOPICS[topicIndex],
          };
        } else {
          nudge = {
            id: '_nudge_idle_alone',
            text: `Escribe algo — alguien se sumará`,
          };
        }

        if (nudge) {
          result.push({
            ...nudge,
            type: 'system',
            timestamp: now,
            userId: 'system',
            username: 'Sistema',
          });
          idleNudgeShown = true;
        }
      }
    }

    // Nudge progresivo para invitados que ya interactuaron
    if ((user?.isGuest || user?.isAnonymous) && !isPeakHourShown && !idleNudgeShown) {
      const guestMsgCount = filteredMessages.filter(m => m.userId === user?.id).length;
      if (guestMsgCount >= 3) {
        result.push({
          id: '_nudge_guest_register',
          type: 'system',
          text: 'Estás chateando como invitado · Prueba los privados y regístrate para más mensajes, más salas y favoritos',
          timestamp: now,
          userId: 'system',
          username: 'Sistema',
        });
      }
    }

    return result;
  }, [filteredMessages, activeUsersCount, lastMessageMs, activityNow, formatRelativeTime, DAILY_TOPICS, user]);

  const headerActivitySnapshot = useMemo(() => {
    // ✅ "conectados" debe reflejar solo usuarios realmente presentes ahora
    const visibleOnlineCount = activeUsersCount;
    const roleSignal = isHeteroRoom ? 0 : (onlineRoleStats.activosOnline + onlineRoleStats.pasivosOnline);
    const hasConnectedPeople = visibleOnlineCount > 0 || roleSignal > 0 || onlineRoleStats.connectedNames.length > 0;

    let intensity = 'quiet';
    if (recentMessagesCount20m >= 18 || visibleOnlineCount >= 10) {
      intensity = 'high';
    } else if (recentMessagesCount20m >= 8 || visibleOnlineCount >= 5) {
      intensity = 'medium';
    } else if (recentMessagesCount20m >= 2 || hasConnectedPeople) {
      intensity = 'warm';
    }

    return {
      intensity,
      visibleOnlineCount,
      hasConnectedPeople,
    };
  }, [activeUsersCount, onlineRoleStats, recentMessagesCount20m, recentParticipants20m.count, isHeteroRoom]);

  const activityText = useMemo(() => {
    if (currentUserComuna && nearbySignals.sameComunaCount > 0) {
      return `Hay ${nearbySignals.sameComunaCount} personas por ${currentUserComuna} ahora`;
    }

    let baseText = 'Se quien abre la conversacion hoy ✨';

    if (headerActivitySnapshot.intensity === 'high') {
      baseText = '🔥 Sala muy activa ahora';
    } else if (headerActivitySnapshot.intensity === 'medium') {
      baseText = 'Hay movimiento en este momento';
    } else if (headerActivitySnapshot.intensity === 'warm') {
      baseText = 'Buena hora para romper el hielo';
    }

    if (recentMessagesCount10m >= 8) {
      return `${baseText} · Conversacion en marcha`;
    }

    if (recentMessagesCount10m > 0) {
      return `${baseText} · Ya hay actividad reciente`;
    }

    return baseText;
  }, [currentUserComuna, nearbySignals.sameComunaCount, headerActivitySnapshot.intensity, recentMessagesCount10m]);

  const headerTickerItems = useMemo(() => {
    const items = [];

    if (headerActivitySnapshot.intensity === 'high') {
      items.push('🔥 Sala activa ahora · Entra al hilo');
    } else if (headerActivitySnapshot.intensity === 'medium') {
      items.push('Hay movimiento ahora · Escribe y te responden');
    } else if (headerActivitySnapshot.intensity === 'warm') {
      items.push('Buena hora para romper el hielo');
    } else {
      items.push('Empieza tu la conversacion ✨');
    }

    if (headerActivitySnapshot.visibleOnlineCount >= 6) {
      items.push(`${headerActivitySnapshot.visibleOnlineCount} personas conectadas ahora`);
    } else if (headerActivitySnapshot.hasConnectedPeople) {
      items.push('Hay personas conectadas ahora');
    } else {
      items.push('Tu mensaje puede activar la sala en segundos');
    }

    if (currentUserComuna && nearbySignals.sameComunaCount > 0) {
      items.push(`${nearbySignals.sameComunaCount} personas marcaron ${currentUserComuna}`);
    } else if (currentUserComuna) {
      items.push(`Tu comuna guardada: ${currentUserComuna}`);
    } else if (nearbySignals.topComunas.length > 0) {
      items.push(`Hoy se mueven: ${nearbySignals.topComunas.map((item) => item.comuna).join(', ')}`);
    } else {
      items.push('Marca tu comuna para priorizar gente cercana');
    }

    if (isHeteroRoom) {
      items.push('Tip: saluda con contexto para recibir respuesta mas rapido');
    } else if (onlineRoleStats.activosOnline > 0 && onlineRoleStats.pasivosOnline > 0) {
      items.push('Hay activos y pasivos en linea');
    } else if (onlineRoleStats.activosOnline > 0) {
      items.push('Hay activos en linea ahora');
    } else if (onlineRoleStats.pasivosOnline > 0) {
      items.push('Hay pasivos en linea ahora');
    } else {
      items.push('Tip: indicar rol y comuna mejora respuestas');
    }

    if (recentMessagesCount20m >= 10) {
      items.push('Conversacion en ritmo alto en los ultimos minutos');
    } else if (recentMessagesCount20m >= 3) {
      items.push('Conversacion en marcha en los ultimos minutos');
    } else if (recentMessagesCount20m > 0) {
      items.push('Ya hubo mensajes recientes en la sala');
    } else {
      items.push('Aun no arranca el hilo: abre tu la conversacion');
    }

    if (onlineRoleStats.connectedNames.length > 0) {
      const visibleNames = onlineRoleStats.connectedNames.slice(0, 4);
      const extraCount = Math.max(0, onlineRoleStats.connectedNames.length - visibleNames.length);
      const suffix = extraCount > 0 ? ` +${extraCount}` : '';
      items.push(`En sala: ${visibleNames.join(', ')}${suffix}`);
    }

    return items;
  }, [headerActivitySnapshot, onlineRoleStats, recentMessagesCount20m, isHeteroRoom, currentUserComuna, nearbySignals]);

  const dailyTopic = useMemo(() => {
    if (currentUserComuna) {
      return `Tip de sala: si estás en ${currentUserComuna}, dilo junto con lo que buscas y si te mueves`;
    }
    const now = new Date(activityNow);
    const key = now.getUTCFullYear() * 10000 + (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
    const index = Math.abs(key) % DAILY_TOPICS.length;
    return DAILY_TOPICS[index];
  }, [activityNow, DAILY_TOPICS, currentUserComuna]);

  const inPrivateUsersCount = useMemo(() => {
    if (!Array.isArray(roomUsers) || roomUsers.length === 0) return 0;
    const uniqueUsers = new Set();

    roomUsers.forEach((roomUser) => {
      const roomUserId = roomUser?.userId || roomUser?.id;
      if (!roomUserId || !roomUser?.inPrivateWith) return;
      uniqueUsers.add(roomUserId);
    });

    return uniqueUsers.size;
  }, [roomUsers]);

  const inPrivateUsersPreview = useMemo(() => {
    const byUserId = new Map();

    (Array.isArray(recentPresenceFallbackUsers) ? recentPresenceFallbackUsers : []).forEach((item) => {
      const userId = item?.userId || item?.id;
      if (!userId) return;
      byUserId.set(userId, {
        userId,
        username: item?.username || 'Usuario',
        avatar: resolveChatAvatar(item?.avatar),
        roleBadge: resolveProfileRole(item?.roleBadge, item?.profileRole, item?.role),
        comuna: normalizeComuna(item?.comuna || item?.profileComuna || item?.userComuna || '') || null,
        inPrivateWith: null,
      });
    });

    (Array.isArray(roomUsers) ? roomUsers : []).forEach((item) => {
      const userId = item?.userId || item?.id;
      if (!userId || isSystemUserId(userId) || isAutomatedUserId(userId)) return;

      const previous = byUserId.get(userId) || {};
      byUserId.set(userId, {
        ...previous,
        userId,
        username: item?.username || previous.username || 'Usuario',
        avatar: resolveChatAvatar(item?.avatar || previous.avatar),
        roleBadge: resolveProfileRole(
          item?.roleBadge,
          item?.profileRole,
          previous.roleBadge
        ) || previous.roleBadge || null,
        comuna: normalizeComuna(item?.comuna || previous.comuna || '') || previous.comuna || null,
        inPrivateWith: item?.inPrivateWith || null,
      });
    });

    return Array.from(byUserId.values())
      .filter((item) => item?.inPrivateWith && item.userId !== user?.id)
      .slice(0, 8);
  }, [recentPresenceFallbackUsers, roomUsers, isSystemUserId, isAutomatedUserId, user?.id]);

  const inPrivateUsersSignature = useMemo(
    () => inPrivateUsersPreview.map((item) => `${item.userId}:${item.inPrivateWith || 'private'}`).join('|'),
    [inPrivateUsersPreview]
  );

  useEffect(() => {
    const clearAutoHide = () => {
      if (inPrivateUsersAutoHideTimeoutRef.current) {
        window.clearTimeout(inPrivateUsersAutoHideTimeoutRef.current);
        inPrivateUsersAutoHideTimeoutRef.current = null;
      }
    };

    const clearPulseInterval = () => {
      if (inPrivateUsersIntervalRef.current) {
        window.clearInterval(inPrivateUsersIntervalRef.current);
        inPrivateUsersIntervalRef.current = null;
      }
    };

    if (isHeteroRoom || inPrivateUsersPreview.length === 0) {
      clearAutoHide();
      clearPulseInterval();
      setShowInPrivateUsersStrip(false);
      setIsInPrivateUsersStripPinned(false);
      lastInPrivateUsersSignatureRef.current = '';
      return undefined;
    }

    const scheduleAutoVisibleStrip = () => {
      setShowInPrivateUsersStrip(true);
      clearAutoHide();
      if (!isInPrivateUsersStripPinned) {
        inPrivateUsersAutoHideTimeoutRef.current = window.setTimeout(() => {
          setShowInPrivateUsersStrip(false);
        }, IN_PRIVATE_STRIP_VISIBLE_MS);
      }
    };

    if (lastInPrivateUsersSignatureRef.current !== inPrivateUsersSignature) {
      lastInPrivateUsersSignatureRef.current = inPrivateUsersSignature;
      scheduleAutoVisibleStrip();
    } else if (isInPrivateUsersStripPinned) {
      setShowInPrivateUsersStrip(true);
    }

    clearPulseInterval();
    if (!isInPrivateUsersStripPinned) {
      inPrivateUsersIntervalRef.current = window.setInterval(() => {
        scheduleAutoVisibleStrip();
      }, IN_PRIVATE_STRIP_INTERVAL_MS);
    }

    return () => {
      clearAutoHide();
      clearPulseInterval();
    };
  }, [inPrivateUsersPreview.length, inPrivateUsersSignature, isHeteroRoom, isInPrivateUsersStripPinned]);

  const activityPulseBadges = useMemo(() => {
    const boostedMessagesCount60m = getBoostedMetricsMessagesCount(recentMessagesCount60m);
    const badges = [
      {
        id: 'messages_60m',
        label: `${boostedMessagesCount60m} mensajes en 60 min`,
        tone: boostedMessagesCount60m >= 20 ? 'emerald' : 'slate',
      },
      {
        id: 'last_message',
        label: `Último mensaje ${formatMetricsLastMessage(lastMessageMs, activityNow)}`,
        tone: lastMessageMs && (activityNow - lastMessageMs) < (2 * 60 * 1000) ? 'violet' : 'slate',
      },
    ];

    if (inPrivateUsersCount > 0) {
      badges.push({
        id: 'in_private_now',
        label: `${inPrivateUsersCount} están en privado`,
        tone: 'amber',
      });
    }

    return badges;
  }, [
    recentMessagesCount60m,
    lastMessageMs,
    activityNow,
    inPrivateUsersCount,
  ]);

  // 🎯 PRO SCROLL MANAGER: Discord/Slack-inspired scroll behavior
  // ✅ IMPORTANTE: Debe estar ANTES del early return para respetar reglas de hooks
  // El hook maneja internamente el caso cuando user es null
  const scrollManager = useChatScrollManager({
    messages,
    currentUserId: user?.id || null,
    isInputFocused,
  });


  // 🚀 ENGAGEMENT: Nudges contextuales OPIN + BAÚL
  const { handleChatInteraction, handleChatScroll, detenerNudges } = useEngagementNudge();

  const handleOpenBaul = useCallback(() => {
    detenerNudges();
    navigate(ENABLE_BAUL ? '/baul' : '/chat/principal');
    return true;
  }, [detenerNudges, navigate]);

  const handleOpenOpin = useCallback(() => {
    detenerNudges();
    navigate('/opin');
    return true;
  }, [detenerNudges, navigate]);

  const handleMessagesScroll = useCallback((event) => {
    handleChatScroll();
  }, [handleChatScroll]);

  // ✅ VALIDACIÓN: Salas restringidas requieren autenticación
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return) para respetar reglas de hooks
  useEffect(() => {
    // Guard interno: solo ejecutar si hay user
    if (!user) return;
    // ✅ SEO: Validar que la sala existe en roomsData o es sala de evento dinámico
    const activeSalas = roomsData.filter(room => room.enabled !== false).map(room => room.id);
    const esSalaDeEvento = roomId?.startsWith('evento_');
    if (!activeSalas.includes(roomId) && !esSalaDeEvento) {
      toast({
        title: "Sala Temporalmente Cerrada",
        description: "Esta sala no está disponible por el momento. Te redirigimos a Chat Principal.",
        variant: "default",
      });
      navigate('/chat/principal', { replace: true });
      return;
    }

    // 🔒 SALAS RESTRINGIDAS: mas-30, santiago, gaming requieren autenticación
    const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
    const isRestrictedRoom = restrictedRooms.includes(roomId);
    const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);

    if (isRestrictedRoom && isGuestOrAnonymous) {
      toast({
        title: "🔒 Registro Requerido",
        description: "Esta sala es exclusiva para usuarios registrados. Regístrate gratis para acceder.",
        variant: "default",
      });
      navigate('/chat/principal', { replace: true });
      return;
    }
  }, [user, navigate, roomId]);

  // ✅ SEO: Actualizar título, meta description Y Open Graph dinámicamente por sala
  React.useEffect(() => {
    // Meta information específica por sala (SIN números dinámicos para SEO estable)
    const roomSEO = {
      'gaming': {
        title: 'Video Chat Gay Gamers Chile 🎮 | Sala Gaming LGBT+ | Chactivo',
        description: 'Video chat gay gamers Chile para hablar de LoL, Valorant, Minecraft y más. Comunidad LGBT+ gamer activa, segura y sin toxicidad.',
        ogTitle: 'Chat Gay para Gamers Chile 🎮 | Comunidad Gaming LGBT+',
        ogDescription: '🎮 Conecta con gamers LGBT+ de Chile. Sala activa 24/7 con +50 gamers. Todas las plataformas: PC, PS5, Xbox, Switch, Móvil. ¡Únete ahora!'
      },
      'mas-30': {
        title: 'Chat Gay +30 Años Chile 💪 | Sala Mayores LGBT+ | Chactivo',
        description: '💪 Chat gay para mayores de 30 años en Chile. Conversación madura, sin presión. Conoce gays de tu edad en Santiago, Valparaíso y todo Chile. Comunidad LGBT+ +30 activa 24/7.',
        ogTitle: 'Chat Gay +30 Años Chile | Comunidad Madura LGBT+',
        ogDescription: '💪 Sala exclusiva para mayores de 30. Conversación madura, respeto y buena onda. Conoce gays de tu generación.'
      },
      'santiago': {
        title: 'Chat Gay Santiago Chile 🏙️ | Sala LGBT+ Capital | Chactivo',
        description: '🏙️ Chat gay Santiago Chile. Conecta con gays de la capital en tiempo real. Salas temáticas, conversación segura, comunidad LGBT+ activa 24/7. ¡Regístrate gratis!',
        ogTitle: 'Chat Gay Santiago | Conoce LGBT+ de la Capital',
        ogDescription: '🏙️ Sala exclusiva de Santiago. Conecta con gays de Providencia, Las Condes, Ñuñoa y toda la capital.'
      },
      // ⚠️ SALA GLOBAL - DESACTIVADA (reemplazada por 'principal')
      // 'global': {
      //   title: 'Chat Global - Chat Gay Chile 💬 | Sala General LGBT+ | Chactivo',
      //   description: '💬 Sala de chat gay general Chile. Todos los temas bienvenidos: amistad, relaciones, gaming, cultura. Conversación libre, ambiente relajado. La sala más activa de Chactivo. ¡Regístrate en 30 segundos!',
      //   ogTitle: 'Chat Global | Chat Gay Chile General 💬',
      //   ogDescription: '💬 La sala más popular de Chactivo. Todos los temas, todos bienvenidos. Ambiente relajado y conversación real.'
      // },
      'principal': {
        title: 'Chat Gay Chile Gratis 💬 | En Vivo Sin Registro | Chactivo',
        description: 'Chat gay Chile en vivo. Entra gratis en segundos, conoce gente real y conversa sin registro obligatorio.',
        ogTitle: 'Chat Gay Chile Gratis 💬 | En Vivo Sin Registro',
        ogDescription: 'Conecta con gente real de Chile en segundos: chat en vivo, gratis y sin registro obligatorio.'
      },
      'hetero-general': {
        title: 'Chat Hetero Gratis 💬 | En Vivo y Activo | Chactivo',
        description: 'Chat hetero en vivo. Conoce gente real, conversa en tiempo real y entra sin pasos complejos.',
        ogTitle: 'Chat Hetero Gratis 💬 | En Vivo y Activo',
        ogDescription: 'Conecta con personas reales en una sala hetero activa, rápida y sin fricción.'
      }
    };

    const seoData = roomSEO[roomId] || {
      title: `Chat ${roomId} - Chactivo | Chat Gay Chile`,
      description: `Sala de chat gay ${roomId} en Chile. Conoce gays, chatea en vivo, comunidad LGBT+ activa. ¡Regístrate gratis en 30 segundos!`,
      ogTitle: `Sala ${roomId} | Chactivo`,
      ogDescription: `Únete a la sala ${roomId}. Comunidad gay activa de Chile.`
    };

    // Actualizar title
    document.title = seoData.title;

    // Actualizar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = seoData.description;

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    const shouldNoindexRoom = roomId === 'hetero-general' && !HETERO_INDEXING_ENABLED;
    robotsMeta.setAttribute(
      'content',
      shouldNoindexRoom ? 'noindex, nofollow, noarchive, nosnippet' : 'index, follow, max-image-preview:large'
    );

    // ✅ CRÍTICO: Actualizar Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', seoData.ogTitle);

    // ✅ CRÍTICO: Actualizar Open Graph description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', seoData.ogDescription);

    // ✅ CRÍTICO: Actualizar Open Graph URL (único por sala)
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', `https://chactivo.com/chat/${roomId}`);

    // ✅ Twitter Card title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', seoData.ogTitle);

    // ✅ Twitter Card description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', seoData.ogDescription);

    const heteroSchemaId = 'schema-hetero-chat-webpage';
    const heteroBreadcrumbSchemaId = 'schema-hetero-chat-breadcrumb';
    document.getElementById(heteroSchemaId)?.remove();
    document.getElementById(heteroBreadcrumbSchemaId)?.remove();

    if (roomId === 'hetero-general' && HETERO_INDEXING_ENABLED) {
      const webpageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': 'https://chactivo.com/chat/hetero-general#webpage',
        url: 'https://chactivo.com/chat/hetero-general',
        name: seoData.title,
        description: seoData.description,
        inLanguage: 'es',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://chactivo.com/#website',
        },
      };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://chactivo.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Hetero',
            item: 'https://chactivo.com/hetero',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Chat',
            item: 'https://chactivo.com/chat/hetero-general',
          },
        ],
      };

      const webpageScript = document.createElement('script');
      webpageScript.type = 'application/ld+json';
      webpageScript.id = heteroSchemaId;
      webpageScript.textContent = JSON.stringify(webpageSchema);
      document.head.appendChild(webpageScript);

      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.id = heteroBreadcrumbSchemaId;
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);
    }

    return () => {
      document.getElementById(heteroSchemaId)?.remove();
      document.getElementById(heteroBreadcrumbSchemaId)?.remove();
      // Limpiar meta description al desmontar (volver a la del index.html)
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = 'Habla y conecta en tiempo real con gente de Chile. Entra gratis en segundos, sin registro obligatorio y con cero anuncios molestos.';
      }
    };
  }, [roomId]);

  // SEO: Canonical tag dinámico para cada sala
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  useCanonical(`/chat/${roomId}`);

  // Track page view and room join
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  useEffect(() => {
    const runTrackingSafely = (fn) => {
      queueMicrotask(() => {
        Promise.resolve()
          .then(fn)
          .catch(() => {});
      });
    };

    if (roomId) {
      pageStartRef.current = Date.now();
      runTrackingSafely(() => trackPageView(`/chat/${roomId}`, `Chat - ${roomId}`, { user }));
      runTrackingSafely(() => trackRoomJoined(roomId, { user }));
      runTrackingSafely(() => track('chat_room_view', { roomId, roomName: roomId }, { user }));
    }

    return () => {
      if (roomId) {
        const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
        runTrackingSafely(() => trackPageExit(`/chat/${roomId}`, timeOnPage, { user }));
      }
    };
  }, [roomId, user]);

  useEffect(() => {
    const seoContext = readSeoFunnelContext();
    if (!seoContext || seoContext.roomId !== roomId) return;

    const arrivalKey = `${seoContext.contextId}:${roomId}`;
    if (seoChatArrivalTrackedRef.current === arrivalKey) return;

    seoChatArrivalTrackedRef.current = arrivalKey;
    track('seo_chat_arrival', {
      room_id: roomId,
      page_path: location.pathname,
      seo_context_id: seoContext.contextId,
      seo_from_path: seoContext.fromPath,
      seo_country_path: seoContext.countryPath,
      seo_entry_method: seoContext.entryMethod,
      seo_landing_variant: seoContext.landingVariant,
    }, { user }).catch(() => {});
  }, [location.pathname, roomId, user]);

  useEffect(() => {
    const seoContext = readSeoFunnelContext();
    if (!seoContext || seoContext.roomId !== roomId) return;
    if (!user || user.isGuest || user.isAnonymous) return;

    const completionKey = `${seoContext.contextId}:${user.id || 'authenticated'}`;
    if (seoChatCompletionTrackedRef.current === completionKey) return;

    seoChatCompletionTrackedRef.current = completionKey;
    track('seo_chat_entry_completed', {
      room_id: roomId,
      completion_type: 'authenticated_user',
      seo_context_id: seoContext.contextId,
      seo_from_path: seoContext.fromPath,
      seo_country_path: seoContext.countryPath,
      seo_entry_method: seoContext.entryMethod,
      seo_landing_variant: seoContext.landingVariant,
    }, { user }).catch(() => {});
    clearSeoFunnelContext();
  }, [roomId, user]);

  // 📊 Señales de comportamiento para vertical hetero: tiempo en chat, mensajes y retorno
  useEffect(() => {
    if (roomId !== 'hetero-general') return undefined;

    const now = Date.now();
    heteroRoomSessionStartRef.current = now;
    heteroRoomSentCountRef.current = 0;

    let isReturning = false;
    let hoursSinceLastVisit = null;
    const visitKey = 'hetero_general_last_visit_at';

    if (typeof window !== 'undefined') {
      const lastVisitRaw = localStorage.getItem(visitKey) || '0';
      const lastVisit = Number(lastVisitRaw);
      if (Number.isFinite(lastVisit) && lastVisit > 0) {
        isReturning = true;
        hoursSinceLastVisit = Math.max(0, Math.round((now - lastVisit) / 3600000));
      }
      localStorage.setItem(visitKey, String(now));
    }

    heteroRoomReturningRef.current = isReturning;

    const entrySource = new URLSearchParams(location.search).get('entry') || 'direct';
    track(
      'hetero_chat_session_start',
      {
        roomId,
        entry_source: entrySource,
        is_returning: isReturning,
        hours_since_last_visit: hoursSinceLastVisit,
      },
      { user }
    ).catch(() => {});

    return () => {
      const startedAt = heteroRoomSessionStartRef.current || now;
      const durationSeconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
      track(
        'hetero_chat_session_end',
        {
          roomId: 'hetero-general',
          duration_seconds: durationSeconds,
          messages_sent: heteroRoomSentCountRef.current,
          is_returning: heteroRoomReturningRef.current,
        },
        { user }
      ).catch(() => {});
    };
  }, [roomId, location.search, user]);

  // ⏱️ ENGAGEMENT TRACKING: Sistema de 1 hora gratuita
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  useEffect(() => {
    // Guard interno: solo para usuarios guest/anonymous
    if (!user || (!user.isGuest && !user.isAnonymous)) {
      return;
    }

    // 🔥 DESHABILITADO: Invitados pueden chatear sin límite de tiempo
    // startEngagementTracking(user);

    // 🔥 DESHABILITADO: Ya no verificamos límite de 1 hora para invitados
    // const checkInterval = setInterval(() => {
    //   if (hasReachedOneHourLimit(user) && !hasSeenEngagementModal()) {
    //     const totalTime = getTotalEngagementTime(user);
    //     setEngagementTime(totalTime);
    //     setShowVerificationModal(true);
    //     markEngagementModalAsShown();
    //     console.log('🎉 ¡1 hora alcanzada! Mostrando modal celebratorio');
    //   }
    // }, 10000);

    // return () => clearInterval(checkInterval);
  }, [user]);

  // ⚠️ MODAL COMENTADO - No está en uso hasta que se repare
  // 🎁 Mostrar modal de bienvenida premium solo una vez
  // ⚠️ CRITICAL: Este hook DEBE ejecutarse siempre (antes del return)
  // useEffect(() => {
  //   const hasSeenPremiumWelcome = localStorage.getItem('hasSeenPremiumWelcome');
  //
  //   if (!hasSeenPremiumWelcome) {
  //     // Mostrar después de 2 segundos de entrar a la sala
  //     const timer = setTimeout(() => {
  //       setShowPremiumWelcome(true);
  //     }, 2000);
  //
  //     return () => clearTimeout(timer);
  //   }
  // }, []);

  // const handleClosePremiumWelcome = () => {
  //   setShowPremiumWelcome(false);
  //   localStorage.setItem('hasSeenPremiumWelcome', 'true');
  // };

  // 🤖 Callback para notificar cuando un bot se conecta
  const handleBotJoin = (botData) => {
    toast({
      title: `👋 ${botData.username} se ha conectado`,
      description: `${botData.role}`,
      duration: 3000,
    });
  };

  // 🤖 SISTEMA DE BOTS: DESACTIVADO COMPLETAMENTE
  // ⚠️ Los bots activos están desactivados para evitar que se cuenten como usuarios reales
  // ✅ PERO la IA conversacional SÍ está activa (importada directamente)

  // Valores por defecto para evitar errores
  const botStatus = { active: false, botCount: 0, bots: [] };
  const triggerBotResponse = () => {}; // Función vacía
  const botsActive = false;

  // ✅ NUEVO: Verificar si el usuario ya aceptó las reglas del chat
  useEffect(() => {
    if (!user || !user.id) return;

    // ✅ Verificar si viene desde landing page (sessionStorage tiene prioridad)
    const ageVerifiedFromLanding = sessionStorage.getItem(`age_verified_${user.username}`) === 'true';
    // ⚠️ MODAL COMENTADO - Ya no verificamos reglas
    // const rulesAcceptedFromLanding = sessionStorage.getItem(`rules_accepted_${user.username}`) === 'true';

    // ⚡ PERSISTENCIA: Verificar si el usuario invitado tiene datos guardados
    if (user.isGuest || user.isAnonymous) {
      // Buscar datos guardados por nickname
      const activeGuests = JSON.parse(localStorage.getItem('active_guests') || '[]');
      if (activeGuests.length > 0) {
        const lastGuest = activeGuests[0];
        const guestDataKey = `guest_data_${lastGuest.username.toLowerCase().trim()}`;
        const savedData = localStorage.getItem(guestDataKey);
        
        if (savedData) {
          try {
            const saved = JSON.parse(savedData);
            // Si el username coincide, restaurar verificación de edad
            if (saved.username && (saved.username.toLowerCase() === user.username.toLowerCase() || saved.uid === user.id)) {
              // Verificar por UID primero
              let storedAge = localStorage.getItem(`age_verified_${saved.uid || user.id}`);
              
              // Si no hay por UID, verificar por username
              if (!storedAge) {
                storedAge = localStorage.getItem(`age_verified_${saved.username.toLowerCase().trim()}`);
              }
              
              // Si hay edad guardada en los datos del guest
              if (!storedAge && saved.age) {
                storedAge = String(saved.age);
              }
              
              if (storedAge && Number(storedAge) >= 18) {
                setIsAgeVerified(true);
                setShowAgeVerification(false);
                syncGuestCommunityAccess({ userId: user.id, username: saved.username, fallbackAge: storedAge });
                // console.log(`[AGE VERIFICATION] ✅ Usuario invitado ${user.username} ya verificó edad en sesión anterior`);
                return; // No mostrar modal
              }
            }
          } catch (e) {
            console.debug('[AGE VERIFICATION] Error verificando datos guardados:', e);
          }
        }
      }
    }

    // ✅ Si viene desde landing, NO mostrar modales
    if (ageVerifiedFromLanding) {
      setIsAgeVerified(true);
      setShowAgeVerification(false);
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem(`age_verified_${user.id}`, '18');
      localStorage.setItem(`rules_accepted_${user.id}`, 'true');
      // console.log(`[AGE VERIFICATION] ✅ Usuario ${user.username} ya verificó edad en landing page`);
    } else {
      if (user.isGuest || user.isAnonymous) {
        const hasValidGuestAccess = hasValidGuestCommunityAccess({
          userId: user.id,
          username: user.username,
          fallbackAge: user.age || user.edad || null,
        });

        if (hasValidGuestAccess) {
          setIsAgeVerified(true);
          setShowAgeVerification(false);
          syncGuestCommunityAccess({
            userId: user.id,
            username: user.username,
            fallbackAge: user.age || user.edad || null,
          });
        } else {
          setIsAgeVerified(false);
          setShowAgeVerification(true);
        }
        return;
      }

      // ✅ USUARIOS REGISTRADOS (NO invitados, NO anónimos): Auto-verificar SIEMPRE
      // Los usuarios registrados YA completaron su perfil (username, email, avatar) al registrarse
      // Por lo tanto, NO deben ver el modal de invitado (que pide edad, username y avatar)
      // console.log(`[AGE VERIFICATION] ✅ Usuario REGISTRADO ${user.username} (${user.id}) - Auto-verificado (ya tiene cuenta)`);
        setIsAgeVerified(true);
        setShowAgeVerification(false);

      // Guardar en localStorage para futuras sesiones
      const ageKey = `age_verified_${user.id}`;
      if (!localStorage.getItem(ageKey)) {
        localStorage.setItem(ageKey, '18'); // Asumir +18 para usuarios registrados
      }
    }

    // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
    // Ya no verificamos ni mostramos el modal de reglas
    // if (rulesAcceptedFromLanding) {
    //   setHasAcceptedRules(true);
    //   setShowChatRules(false);
    //   localStorage.setItem(`chat_rules_accepted_${user.id}`, 'true');
    //   console.log(`[CHAT RULES] ✅ Usuario ${user.username} ya aceptó reglas en landing page`);
    // } else {
    //   const rulesKey = `chat_rules_accepted_${user.id}`;
    //   const hasAccepted = localStorage.getItem(rulesKey) === 'true';
    //
    //   if (!hasAccepted) {
    //     setShowChatRules(true);
    //     setHasAcceptedRules(false);
    //   } else {
    //     setHasAcceptedRules(true);
    //   }
    // }
  }, [user]);

  // 🔊 Audio: armar unlock por gesto (sin inicializar AudioContext hasta interacción real)
  useEffect(() => {
    initAudioOnFirstGesture();
  }, []);

  // Evitar flicker de "chat vacío": mantener loading hasta que llegue snapshot real o timeout largo controlado.
  useEffect(() => {
    return () => {
      if (loadingFallbackTimeoutRef.current) {
        clearTimeout(loadingFallbackTimeoutRef.current);
      }
      if (loadingExtendedTimeoutRef.current) {
        clearTimeout(loadingExtendedTimeoutRef.current);
      }
    };
  }, []);

  // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes ANTES de verificar edad
  // Esto permite que los mensajes carguen instantáneamente, incluso con usuario temporal
  // 🚀 EXPERIMENTO: Permitir suscripción SIN usuario para ver mensajes inmediatamente
  useEffect(() => {
    setCurrentRoom(roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al cambiar de sala
    setMessagesLoadingStage('initial');
    firstNonEmptySnapshotRef.current = false;
    firstSnapshotReceivedRef.current = false;
    if (loadingFallbackTimeoutRef.current) {
      clearTimeout(loadingFallbackTimeoutRef.current);
      loadingFallbackTimeoutRef.current = null;
    }
    if (loadingExtendedTimeoutRef.current) {
      clearTimeout(loadingExtendedTimeoutRef.current);
      loadingExtendedTimeoutRef.current = null;
    }
    aiActivatedRef.current = false; // Resetear flag de IA cuando cambia de sala
    nicoWelcomedUsersRef.current = new Set(); // 🤖 NICO: Resetear bienvenidas al cambiar de sala
    nicoPreviousRoomUsersRef.current = null; // 🤖 NICO: null = primer render (no enviar bienvenidas al entrar a sala)

    // 📊 PERFORMANCE MONITOR: Iniciar medición de carga del chat
    chatLoadStartTimeRef.current = performance.now();
    chatLoadTrackedRef.current = false; // Reset tracking flag
    startTiming('chatLoad', { roomId });
    startTiming('messagesSubscription', { roomId }); // Iniciar tracking de suscripción

    // ⚡ SUSCRIPCIÓN INMEDIATA: Suscribirse a mensajes SIN esperar verificación de edad
    // 🔒 CRITICAL: Limpiar suscripción anterior si existe
    if (unsubscribeRef.current) {
      // console.log('🧹 [CHAT] Limpiando suscripción anterior antes de crear nueva');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // 📊 LÍMITE DE MENSAJES según tipo de usuario
    // - Invitados (guest/anonymous): 80 mensajes
    // - Logueados (registrados): 160 mensajes
    const messageLimit = (user && !user.isGuest && !user.isAnonymous) ? 160 : 80;
    const chatDebug = isChatDebugEnabled();
    if (chatDebug) {
      console.log(`📊 [CHAT] Límite de mensajes para ${user?.username}: ${messageLimit} (${user?.isGuest || user?.isAnonymous ? 'invitado' : 'registrado'})`);
    }

    // console.log('📡 [CHAT] Suscribiéndose a mensajes INMEDIATAMENTE para sala:', roomId);
    setIsLoadingMessages(true); // ⏳ Marcar como cargando al iniciar suscripción

    // ⚡ TIMEOUTS DE SEGURIDAD: nunca mostrar "chat vacío" antes del primer snapshot real
    loadingFallbackTimeoutRef.current = setTimeout(() => {
      if (chatDebug) {
        console.warn('⏰ [CHAT] La carga inicial superó 4.5s - pasando a estado de sincronización lenta');
      }
      if (!firstSnapshotReceivedRef.current) {
        setMessagesLoadingStage('delayed');
      }
      loadingFallbackTimeoutRef.current = null;
    }, 4500);

    loadingExtendedTimeoutRef.current = setTimeout(() => {
      if (!firstSnapshotReceivedRef.current) {
        setMessagesLoadingStage('extended');
        if (chatDebug) {
          console.warn('⏰ [CHAT] La carga inicial superó 15s - manteniendo sala en sincronización extendida');
        }
      }
      loadingExtendedTimeoutRef.current = null;
    }, 15000);

    if (chatDebug) {
      console.log(`[CHAT PAGE] 🚀 Llamando a subscribeToRoomMessages para sala ${roomId} con límite ${messageLimit}`);
    }
    const subscriptionStartMs = performance.now();
    const unsubscribeMessages = subscribeToRoomMessages(roomId, (newMessages) => {
      const traceEnabled = isMessageTraceEnabled();
      if (chatDebug) {
        console.log(`[CHAT PAGE] 📨 Callback ejecutado con ${newMessages.length} mensajes para sala ${roomId}`);
      }
      if (chatDebug && newMessages.length === 0) {
        console.warn(`[CHAT PAGE] ⚠️ ARRAY VACÍO recibido en callback para sala ${roomId} - esto NO debería pasar si la sala tiene mensajes`);
      }

      if (!firstSnapshotReceivedRef.current) {
        firstSnapshotReceivedRef.current = true;
        const firstSnapshotMs = Math.round(performance.now() - subscriptionStartMs);
        if (chatDebug) {
          console.log(`[CHAT PAGE] ⚡ Primer snapshot en ${firstSnapshotMs}ms (${roomId})`);
        }
      }

      if (newMessages.length > 0) {
        firstNonEmptySnapshotRef.current = true;
      }

      if (loadingFallbackTimeoutRef.current) {
        clearTimeout(loadingFallbackTimeoutRef.current);
        loadingFallbackTimeoutRef.current = null;
      }
      if (loadingExtendedTimeoutRef.current) {
        clearTimeout(loadingExtendedTimeoutRef.current);
        loadingExtendedTimeoutRef.current = null;
      }
      setMessagesLoadingStage('ready');
      setIsLoadingMessages(false);
      
      // 🔍 DEBUG: Loguear siempre en desarrollo para diagnóstico
      if (chatDebug) {
        console.log('[CHAT PAGE] 📨 Mensajes recibidos del listener:', {
          count: newMessages.length,
          roomId,
          timestamp: new Date().toISOString(),
          firstMessage: newMessages[0]?.content?.substring(0, 50) || 'N/A'
        });
      }

      // 📊 PERFORMANCE MONITOR: Registrar carga completa del chat (solo la primera vez)
      if (!chatLoadTrackedRef.current && chatLoadStartTimeRef.current && newMessages.length > 0) {
        trackChatLoad(chatLoadStartTimeRef.current);
        chatLoadTrackedRef.current = true; // Marcar como ya tracked
        
        // 📊 PERFORMANCE MONITOR: Completar tracking de carga
        endTiming('chatLoad', { roomId, messageCount: newMessages.length });
        trackMessagesLoad(chatLoadStartTimeRef.current, newMessages.length);
        endTiming('messagesSubscription', { roomId, messageCount: newMessages.length });
      }

      // ⚠️ VENTANA DE MODERACIÓN COMENTADA (06/01/2026) - A petición del usuario
      // 👮 SEPARAR mensajes del moderador (para RulesBanner) del resto
      // const moderatorMsg = newMessages.find(m => m.userId === 'system_moderator');
      // const regularMessages = newMessages.filter(m => m.userId !== 'system_moderator');
      // ✅ Verificar bloqueos en background y filtrar mensajes bloqueados
      const principalSafeMessages = filterAutomatedMessagesInPrincipal(newMessages);
      const senderIds = Array.from(new Set(principalSafeMessages.map(m => m.userId).filter(Boolean)));
      refreshBlockedByUsers(senderIds);
      const regularMessages = filterBlockedMessages(principalSafeMessages); // ✅ Solo mensajes visibles

      // 🔍 TRACE: Estado actualizado con mensajes recibidos
      if (traceEnabled) {
        traceEvent(TRACE_EVENTS.STATE_UPDATED, {
          roomId,
          messageCount: regularMessages.length,
          newMessageIds: regularMessages.slice(-5).map((m) => m.id),
        });
      }
      
      // 🔍 TRACE: Verificar si hay mensajes optimistas que deben ser reemplazados
      if (traceEnabled && messages.length > 0) {
        const optimisticByClientId = new Map();
        messages.forEach((m) => {
          if (m?._optimistic && m?.clientId) optimisticByClientId.set(m.clientId, m);
        });

        regularMessages.forEach((msg) => {
          if (!msg?.clientId) return;
          const optimistic = optimisticByClientId.get(msg.clientId);
          if (!optimistic) return;
          traceEvent(TRACE_EVENTS.OPTIMISTIC_MESSAGE_REPLACED, {
            traceId: msg.clientId,
            optimisticId: optimistic.id,
            realId: msg.id,
            userId: msg.userId,
            roomId,
          });
        });
      }

      // Si hay mensaje del moderador, guardarlo en estado separado (solo una vez)
      // if (moderatorMsg) {
      //   setModeratorMessage(prev => prev || moderatorMsg); // Solo setear si no existe
      // }

      // 🔊 Reproducir sonido si llegaron mensajes nuevos (no en carga inicial)
      if (previousMessageCountRef.current > 0 && regularMessages.length > previousMessageCountRef.current) {
        const newMessageCount = regularMessages.length - previousMessageCountRef.current;
        // Reproducir sonido por cada mensaje nuevo (el servicio agrupa automáticamente si son 4+)
        // 🔊 Reproducir sonido: ENVOLVER EN TRY/CATCH para evitar que errores de audio bloqueen la UI
        try {
        for (let i = 0; i < newMessageCount; i++) {
          notificationSounds.playMessageSound();
          }
        } catch (e) {
          console.warn('[CHAT] 🔇 Error reproduciendo sonido (UI segura):', e);
        }
      }

      // Actualizar contador de mensajes (solo regulares)
      previousMessageCountRef.current = regularMessages.length;

      // 🚀 OPTIMISTIC UI: Fusionar mensajes reales con optimistas y DEDUPLICAR
      // 💬 NOTA: La detección de respuestas se hace en el useEffect separado para mejor rendimiento
      setMessages(prevMessages => {
        const optimisticMessages = prevMessages.filter(m => m._optimistic);
        const mergedMessages = [...regularMessages]; // ✅ Solo mensajes regulares (sin moderador)
        const now = Date.now();
        const realByClientId = new Map();
        const realIds = new Set();

        for (let i = 0; i < regularMessages.length; i += 1) {
          const realMsg = regularMessages[i];
          if (realMsg?.id) realIds.add(realMsg.id);
          if (realMsg?.clientId) realByClientId.set(realMsg.clientId, realMsg);
        }

        // ⚡ DEDUPLICACIÓN ULTRA-OPTIMIZADA: Sin parpadeos, sin reordenamiento
        if (optimisticMessages.length > 0) {
          // ⚡ DEDUPLICACIÓN RÁPIDA: Filtrar optimistas que ya tienen match
          const remainingOptimistic = optimisticMessages.filter(optMsg => {
            // Prioridad 1: clientId (más confiable, evita duplicados)
            if (optMsg.clientId && realByClientId.has(optMsg.clientId)) {
              // ✅ DETECTAR ENTREGA: Si el mensaje real llegó, marcar como 'delivered'
              const realMessage = realByClientId.get(optMsg.clientId);
              if (realMessage && optMsg.userId === user?.id) {
                // Este es nuestro mensaje que fue recibido por otro dispositivo
                // Marcar como 'delivered' (doble check azul)
                optMsg.status = 'delivered';
                optMsg._deliveredAt = now;
              }
              return false; // Ya llegó el real, eliminar optimista
            }
            // Prioridad 2: _realId (compatibilidad con sistema anterior)
            if (optMsg._realId && realIds.has(optMsg._realId)) {
              // ✅ DETECTAR ENTREGA: Si el mensaje real llegó, marcar como 'delivered'
              if (optMsg.userId === user?.id) {
                optMsg.status = 'delivered';
                optMsg._deliveredAt = now;
              }
              return false; // Ya llegó el real
            }
            return true; // Mantener este optimista (aún no llegó el real)
          });

          // ⚡ FUSIÓN: Agregar optimistas restantes (mantener orden temporal)
          if (remainingOptimistic.length > 0) {
            mergedMessages.push(...remainingOptimistic);
          }
        }
        
        // ✅ ACTUALIZAR ESTADO DE ENTREGA: Marcar mensajes propios como 'delivered' si fueron recibidos
        // Esto detecta cuando nuestro mensaje es recibido por otro dispositivo
        const updatedMessages = mergedMessages.map(msg => {
          // Solo procesar mensajes propios que ya están en 'sent' o tienen _realId
          if (msg.userId === user?.id && (msg.status === 'sent' || msg._realId) && !msg._deliveredAt) {
            // Verificar si este mensaje fue recibido (existe en regularMessages)
            // Un mensaje está "entregado" cuando aparece en regularMessages (fue recibido por otro dispositivo)
            const wasReceived =
              (msg.clientId && realByClientId.has(msg.clientId)) ||
              (msg._realId && realIds.has(msg._realId)) ||
              (msg.id && realIds.has(msg.id));
            
            if (wasReceived) {
              // ✅ MENSAJE ENTREGADO: Marcar como 'delivered' (doble check azul)
              // Limpiar timeout si existe (mensaje entregado antes de 20s)
              const timeoutId = deliveryTimeoutsRef.current.get(msg.id);
              if (timeoutId) {
                clearTimeout(timeoutId);
                deliveryTimeoutsRef.current.delete(msg.id);
              }
              
              // También limpiar por _realId si existe
              if (msg._realId) {
                const timeoutId2 = deliveryTimeoutsRef.current.get(msg._realId);
                if (timeoutId2) {
                  clearTimeout(timeoutId2);
                  deliveryTimeoutsRef.current.delete(msg._realId);
                }
              }
              
              return {
                ...msg,
                status: 'delivered',
                _deliveredAt: now
              };
            }
          }
          return msg;
        });
        
        // ⚡ ORDENAMIENTO: Por timestampMs (mantener posición correcta, sin moverse)
        // ⚡ FIX: Mensajes con timestampMs null se ordenan al final temporalmente
        updatedMessages.sort((a, b) => {
          const timeA = a.timestampMs ?? (a.timestamp ? new Date(a.timestamp).getTime() : null);
          const timeB = b.timestampMs ?? (b.timestamp ? new Date(b.timestamp).getTime() : null);
          
          // Si ambos tienen timestamp, ordenar normalmente
          if (timeA !== null && timeB !== null) {
          return timeA - timeB;
          }
          // Si solo uno tiene timestamp, el que tiene timestamp va primero
          if (timeA !== null && timeB === null) return -1;
          if (timeA === null && timeB !== null) return 1;
          // Si ambos son null, mantener orden de llegada (por índice)
          return 0;
        });
        
        // ⚡ DEDUPLICACIÓN FINAL: Eliminar duplicados por ID (evitar mensajes duplicados)
        const uniqueMessages = [];
        const seenIds = new Set();
        
        for (const msg of updatedMessages) {
          const dedupeKey = msg.id || msg._realId || msg.clientId;
          if (!dedupeKey || seenIds.has(dedupeKey)) {
            continue; // Saltar duplicado
          }
          uniqueMessages.push(msg);
          seenIds.add(dedupeKey);
        }
        
        return uniqueMessages;
      });

    }, messageLimit); // ✅ Pasar límite de mensajes según tipo de usuario

    // Guardar funciones de desuscripción
    const baseCleanup = () => {
      // ✅ Limpiar timeout de loading
      if (loadingFallbackTimeoutRef.current) {
        clearTimeout(loadingFallbackTimeoutRef.current);
        loadingFallbackTimeoutRef.current = null;
      }
      if (loadingExtendedTimeoutRef.current) {
        clearTimeout(loadingExtendedTimeoutRef.current);
        loadingExtendedTimeoutRef.current = null;
      }

      try {
        unsubscribeMessages();
      } catch (error) {
        // Ignorar errores de cancelación (AbortError es normal)
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error canceling message subscription:', error);
        }
      }
    };
    
    unsubscribeRef.current = baseCleanup;

    // ⚠️ TOAST DE BIENVENIDA ELIMINADO (06/01/2026) - A petición del usuario
    // Toast de bienvenida
    // toast({
    //   title: `👋 ¡${user.username} se ha unido a la sala!`,
    //   description: `Estás en #${roomId}`,
    // });

    // 👮 Mensaje de bienvenida del moderador (solo una vez)
    // ⚠️ MODERADOR COMENTADO (06/01/2026) - Desactivado a petición del usuario
    /*
    const moderatorKey = `${roomId}_${user.id}`;
    const hasSeenModerator = sessionStorage.getItem(`moderator_welcome_${moderatorKey}`);
    
    // Verificar también en el ref para evitar duplicados en el mismo render
    if (!hasSeenModerator && !moderatorWelcomeSentRef.current.has(moderatorKey)) {
      // Marcar inmediatamente para evitar duplicados
      moderatorWelcomeSentRef.current.add(moderatorKey);
      sessionStorage.setItem(`moderator_welcome_${moderatorKey}`, 'true');
      
      setTimeout(() => {
        // ✅ FIX: Validar que username existe antes de enviar bienvenida
        if (user?.username) {
        sendModeratorWelcome(roomId, user.username);
        }
      }, 2000); // Enviar después de 2 segundos
    }
    */

    // ⚠️ BOTS ELIMINADOS (06/01/2026) - A petición del usuario
    // 🌱 Sembrar conversaciones genuinas en "Chat Principal"
    // checkAndSeedConversations(roomId);


    // Cleanup: desuscribirse y remover presencia cuando se desmonta o cambia de sala
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null; // Limpiar referencia
      }
    };
  }, [roomId, user?.id, currentUserComuna]); // ✅ F3: user?.id en vez de user (evita re-suscripciones por cambio de referencia)

  // 🟢 PRESENCIA: Mantener presencia básica de sala mientras la vista esté abierta.
  useEffect(() => {
    if (!roomId || !authReady || !user?.id) return;

    cleanInactiveUsers(roomId);
    joinRoom(roomId, {
      ...user,
      comuna: currentUserComuna || null,
    });
    if (roomId?.startsWith('evento_')) {
      registrarParticipacionEvento(roomId, user).catch(() => {});
    }

    return () => {
      leaveRoom(roomId).catch(error => {
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error leaving room:', error);
        }
      });
    };
  }, [roomId, authReady, user?.id]);

  // 🟢 LECTURAS AHORRO: solo escuchar usuarios cuando la pestaña está visible.
  useEffect(() => {
    if (!roomId || !authReady || !user?.id || !isPageVisible) return;

    const unsubscribeUsers = subscribeToRoomUsers(roomId, (users) => {
      if (usersUpdateInProgressRef.current) return;

      const activeUsers = filterActiveUsers(users);
      const filteredUsers = [];
      const usersToCheck = [];

      for (const u of activeUsers) {
        const userId = u.userId || u.id;
        if (userId === 'system' || userId?.startsWith('bot_') || userId?.startsWith('static_bot_')) {
          continue;
        }

        const cachedRole = userRolesCacheRef.current.get(userId);
        if (cachedRole === 'admin' || cachedRole === 'administrator' || cachedRole === 'moderator') {
          continue;
        }

        if (cachedRole === 'user' || cachedRole === null) {
          filteredUsers.push(u);
        } else if (!checkingRolesRef.current.has(userId)) {
          usersToCheck.push({ user: u, userId });
        } else {
          filteredUsers.push(u);
        }
      }

      const dedupedByUid = new Map();
      [...filteredUsers, ...usersToCheck.map(({ user }) => user)].forEach((presenceUser) => {
        const uid = presenceUser?.userId || presenceUser?.id;
        if (!uid) return;
        dedupedByUid.set(uid, presenceUser);
      });
      const finalUsers = Array.from(dedupedByUid.values());
      const currentCounts = {
        total: users.length,
        active: activeUsers.length,
        real: finalUsers.length
      };

      const hasChanged =
        currentCounts.total !== lastUserCountsRef.current.total ||
        currentCounts.active !== lastUserCountsRef.current.active ||
        currentCounts.real !== lastUserCountsRef.current.real;

      if (hasChanged) {
        if (previousRealUserCountRef.current > 0 && currentCounts.real > previousRealUserCountRef.current) {
          notificationSounds.playUserJoinSound();
        }
        if (previousRealUserCountRef.current > 0 && currentCounts.real < previousRealUserCountRef.current) {
          notificationSounds.playDisconnectSound();
        }
        previousRealUserCountRef.current = currentCounts.real;
        lastUserCountsRef.current = currentCounts;
      }

      usersUpdateInProgressRef.current = true;
      setRoomUsers(prevUsers => {
        const prevIds = new Set(prevUsers.map(u => (u.userId || u.id)));
        const newIds = new Set(finalUsers.map(u => (u.userId || u.id)));

        if (prevIds.size !== newIds.size) {
          setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
          return finalUsers;
        }

        for (const id of prevIds) {
          if (!newIds.has(id)) {
            setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
            return finalUsers;
          }
        }

        const prevInPrivate = new Map(prevUsers.filter(u => u.inPrivateWith).map(u => [(u.userId || u.id), u.inPrivateWith]));
        const newInPrivate = new Map(finalUsers.filter(u => u.inPrivateWith).map(u => [(u.userId || u.id), u.inPrivateWith]));
        if (prevInPrivate.size !== newInPrivate.size) {
          setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
          return finalUsers;
        }
        for (const [id, pw] of newInPrivate) {
          if (prevInPrivate.get(id) !== pw) {
            setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
            return finalUsers;
          }
        }

        setTimeout(() => { usersUpdateInProgressRef.current = false; }, 50);
        return prevUsers;
      });
    });

    return () => {
      if (roleCheckDebounceRef.current) {
        clearTimeout(roleCheckDebounceRef.current);
        roleCheckDebounceRef.current = null;
      }
      checkingRolesRef.current.clear();
      usersUpdateInProgressRef.current = false;

      try {
        unsubscribeUsers();
      } catch (error) {
        if (error.name !== 'AbortError' && error.code !== 'cancelled') {
          console.error('Error canceling user subscription:', error);
        }
      }
    };
  }, [roomId, authReady, user?.id, isPageVisible]);

  // 💓 Heartbeat de presencia: refresca lastSeen para conteo online real y puntos de estado.
  useEffect(() => {
    if (!roomId || !authReady || !user?.id || !isPageVisible) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const wasRecentlyActive = (now - lastInteractionAtRef.current) <= PRESENCE_HEARTBEAT_IDLE_GRACE_MS;
      if (!wasRecentlyActive) return;
      updateUserActivity(roomId).catch(() => {});
    }, CHAT_AVAILABILITY_HEARTBEAT_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId, authReady, user?.id, isPageVisible]);

  useEffect(() => {
    if (!roomId || !authReady || !user?.id || !isPageVisible) return;
    updateUserActivity(roomId).catch(() => {});
  }, [roomId, authReady, user?.id, isPageVisible]);

  // 💓 Control liviano de presencia derivada: evita trabajo si el conteo real no cambio.
  useEffect(() => {
    // ? CRÍTICO: Validar que el usuario existe antes de continuar
    if (!user || !user.id || !user.username) {
      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola (loop durante carga)
      // console.warn('? [CHAT PAGE] Usuario no disponible, no se puede activar IA');
      return;
    }

    const realUserCount = countRealUsers(roomUsers);
    
    // ? Solo ejecutar cuando realmente cambia el número de usuarios reales
    if (realUserCount === lastUserCountRef.current) {
      return; // No hacer nada si el conteo no cambió
    }
    
    lastUserCountRef.current = realUserCount;

  }, [roomUsers.length, roomId, user?.id, countRealUsers]); // 🔒 CRÍTICO: user?.id en vez de user (evita loops por cambio de referencia de objeto)

  // ⏱️ Actualizar indicador de actividad cada 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityNow(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ⚠️ DESACTIVADO TEMPORALMENTE: Contadores de salas (causa consumo excesivo)
  // Solo necesitamos el chat básico funcionando
  // useEffect(() => {
  //   if (!user?.id) return;
  //   const priorityRooms = ['principal'];
  //   const unsubscribe = subscribeToMultipleRoomCounts(priorityRooms, (counts) => {
  //     setRoomCounts(counts);
  //   });
  //   return () => unsubscribe();
  // }, [user?.id]);

  // 🤖 NICO BOT: Toast de bienvenida personal al entrar a sala
  useEffect(() => {
    if (!NICO_BOT_ENABLED) return;
    if (!user?.id || !currentRoom) return;
    const username = user?.username || user?.displayName || 'Usuario';

    // Delay de 2s para que el chat cargue primero
    const timer = setTimeout(async () => {
      const welcomeText = await generateNicoWelcome(username, messagesRef.current);
      toast({
        title: `👋 ${NICO.username}`,
        description: welcomeText,
        duration: 5000,
      });
    }, 2000);

    return () => clearTimeout(timer);
    // Solo al entrar a una sala (cambio de currentRoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom]);

  // 🤖 NICO BOT: Notificar a los demás cuando alguien se conecta (toast, NO mensaje en chat)
  useEffect(() => {
    if (!NICO_BOT_ENABLED) return;
    if (!user?.id || !roomUsers || roomUsers.length === 0) return;

    // Obtener IDs actuales (sin bots, sistema ni yo mismo)
    const currentUserIds = new Set();
    const currentUserMap = new Map();
    for (const u of roomUsers) {
      const uid = u.userId || u.id;
      if (uid && uid !== 'system' && !uid.startsWith('bot_') && !uid.startsWith('static_bot_') && uid !== user.id) {
        currentUserIds.add(uid);
        currentUserMap.set(uid, u);
      }
    }

    // Primer render: solo registrar usuarios existentes
    if (nicoPreviousRoomUsersRef.current === null) {
      nicoPreviousRoomUsersRef.current = currentUserIds;
      return;
    }

    // Detectar usuarios NUEVOS
    const previousIds = nicoPreviousRoomUsersRef.current;
    const newUserIds = [];
    for (const uid of currentUserIds) {
      if (!previousIds.has(uid) && !nicoWelcomedUsersRef.current.has(uid)) {
        newUserIds.push(uid);
      }
    }

    // Actualizar referencia anterior
    nicoPreviousRoomUsersRef.current = currentUserIds;

    // Si hay usuarios nuevos, elegir UNO al azar y mostrar toast
    if (newUserIds.length > 0) {
      // Marcar todos como notificados
      newUserIds.forEach(uid => nicoWelcomedUsersRef.current.add(uid));

      // Elegir uno al azar para el toast
      const randomUid = newUserIds[Math.floor(Math.random() * newUserIds.length)];
      const randomUser = currentUserMap.get(randomUid);

      if (randomUser?.username) {
        // Delay corto para no interrumpir inmediatamente
        setTimeout(() => {
          toast({
            title: `${randomUser.username} se ha conectado 👋`,
            description: newUserIds.length > 1
              ? `y ${newUserIds.length - 1} más · ¡Salúdalos!`
              : '¡Salúdalo!',
            duration: 3000,
          });
        }, 1500);
      }
    }
  }, [roomUsers, user?.id]);

  // 🤖 NICO BOT: Pregunta caliente cada 30 minutos
  useEffect(() => {
    if (!NICO_BOT_ENABLED) return;
    if (!user?.id || !currentRoom) return;

    // Limpiar intervalo anterior
    if (nicoQuestionIntervalRef.current) {
      clearInterval(nicoQuestionIntervalRef.current);
    }

    // Funcion que verifica y envia pregunta (usa refs para valores frescos)
    const checkAndSendQuestion = () => {
      // Solo enviar si hay al menos 2 usuarios reales
      const realCount = countRealUsers(roomUsersRef.current);
      if (realCount < 2) return;

      // Verificar edad del ultimo mensaje de Nico
      const currentMessages = messagesRef.current;
      const lastNicoAge = getLastNicoMessageAge(currentMessages);
      if (lastNicoAge < QUESTION_INTERVAL_MS) return;

      // Delay aleatorio (0-60s) para evitar colision entre clientes
      const randomDelay = Math.random() * 60000;
      setTimeout(() => {
        // Re-verificar despues del delay (con refs frescos)
        const freshMessages = messagesRef.current;
        const freshAge = getLastNicoMessageAge(freshMessages);
        if (freshAge < QUESTION_INTERVAL_MS) return;

        sendNicoQuestion(currentRoom, freshMessages);
      }, randomDelay);
    };

    // Primera verificacion despues de 2 minutos (dar tiempo a que cargue todo)
    const initialTimeout = setTimeout(checkAndSendQuestion, 120000);

    // Verificar cada 5 minutos (el intervalo real es de 30min, verificamos seguido por si acaso)
    nicoQuestionIntervalRef.current = setInterval(checkAndSendQuestion, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (nicoQuestionIntervalRef.current) {
        clearInterval(nicoQuestionIntervalRef.current);
      }
    };
  }, [currentRoom, user?.id, countRealUsers]); // No incluir messages/roomUsers para evitar re-crear el intervalo

  const openPrivateChatWindow = useCallback((chatPayload) => {
    activatePrivateSurfaces();
    const result = setActivePrivateChat(chatPayload);
    if (!result?.ok && result?.reason === 'limit_reached') {
      toast({
        title: 'Límite de chats privados',
        description: `Puedes tener hasta ${maxOpenPrivateChats || MAX_OPEN_PRIVATE_CHATS} conversaciones privadas abiertas. Cierra una para abrir otra.`,
        variant: 'destructive',
      });
      return false;
    }
    return Boolean(result?.ok);
  }, [activatePrivateSurfaces, setActivePrivateChat, maxOpenPrivateChats]);
  openPrivateChatWindowRef.current = openPrivateChatWindow;

  const showPrivateConversationToast = useCallback((payload = {}) => {
    if (!payload?.notificationId || handledPrivateConversationNotificationIdsRef.current.has(payload.notificationId)) {
      return false;
    }

    if (
      dismissedChatIdsRef.current?.has(payload.chatId)
      || isPrivateUiKeyActive(getPrivateNotificationSeenKey(payload.notificationId))
      || privateDirectMessageToastRef.current
    ) {
      return false;
    }

    const currentChatWindow = (openPrivateChatsRef.current || []).find((chat) => chat?.chatId === payload.chatId);
    const currentChatState = !currentChatWindow
      ? 'closed'
      : (currentChatWindow?.isMinimized ? 'minimized' : 'visible');
    if (currentChatState === 'visible') {
      return false;
    }

    handledPrivateConversationNotificationIdsRef.current.add(payload.notificationId);
    if (handledPrivateConversationNotificationIdsRef.current.size > 150) {
      handledPrivateConversationNotificationIdsRef.current = new Set(
        Array.from(handledPrivateConversationNotificationIdsRef.current).slice(-80)
      );
    }

    rememberPrivateUiKey(getPrivateNotificationSeenKey(payload.notificationId), PRIVATE_UI_NOTIFICATION_TTL_MS);

    setPrivateDirectMessageToast({
      notificationId: payload.notificationId,
      chatId: payload.chatId,
      from: payload.from || '',
      fromUsername: payload.fromUsername || 'Usuario',
      fromAvatar: payload.fromAvatar || '',
      fromIsPremium: payload.fromIsPremium || false,
      content: payload.content || '',
      title: payload.title || null,
      hint: payload.hint || 'No se abrirá automáticamente. Ábrelo solo si quieres responder ahora.',
      actionLabel: payload.actionLabel || 'Abrir chat',
    });

    return true;
  }, [isPrivateUiKeyActive, rememberPrivateUiKey]);

  const getPrivateChatWindowState = useCallback((chatId, chatWindows = []) => {
    if (!chatId) return 'closed';
    const chatWindow = (chatWindows || []).find((chat) => chat?.chatId === chatId);
    if (!chatWindow) return 'closed';
    return chatWindow?.isMinimized ? 'minimized' : 'visible';
  }, []);

  useEffect(() => {
    if (!authReady || !user?.id || user?.isGuest || user?.isAnonymous) return;

    const pendingPrivateChatRestore = readPendingPrivateChatRestore();
    if (!pendingPrivateChatRestore?.chatId) return;

    const targetRoomId = pendingPrivateChatRestore.roomId || 'principal';
    if (targetRoomId !== currentRoom) return;

    const opened = openPrivateChatWindow({
      user,
      partner: pendingPrivateChatRestore.partner,
      participants: pendingPrivateChatRestore.participants || [],
      title: pendingPrivateChatRestore.title || '',
      chatId: pendingPrivateChatRestore.chatId,
      roomId: targetRoomId,
      initialMessage: pendingPrivateChatRestore.initialMessage || '',
      isPending: false,
    });

    if (!opened) return;

    clearPendingPrivateChatRestore();
    toast({
      title: 'Privado restaurado',
      description: 'Retomamos tu conversación después del registro.',
    });
  }, [authReady, currentRoom, openPrivateChatWindow, user]);

  const openGroupPrivateChatWindow = useCallback((chatPayload = {}) => {
    const currentUser = userRef.current || user;
    const participantProfiles = Array.isArray(chatPayload.participantProfiles)
      ? chatPayload.participantProfiles
      : [];
    const fallbackPartner = participantProfiles.find((participant) => participant?.userId !== currentUser?.id)
      || {
        userId: chatPayload.chatId || 'group-private-chat',
        username: chatPayload.title || 'Chat grupal privado',
        avatar: '',
      };

    return openPrivateChatWindow({
      user: currentUser,
      partner: {
        userId: fallbackPartner.userId || chatPayload.chatId || 'group-private-chat',
        username: fallbackPartner.username || chatPayload.title || 'Chat grupal privado',
        avatar: fallbackPartner.avatar || '',
        isPremium: Boolean(fallbackPartner.isPremium),
      },
      participants: participantProfiles,
      title: chatPayload.title || 'Chat grupal privado',
      chatId: chatPayload.chatId,
      roomId: chatPayload.roomId || currentRoomRef.current || null,
    });
  }, [openPrivateChatWindow, user]);
  openGroupPrivateChatWindowRef.current = openGroupPrivateChatWindow;

  // Suscribirse a notificaciones de chat privado (un solo listener por user.id)
  useEffect(() => {
    if (!user?.id || !isPageVisible) return;

    const unsubscribe = subscribeToNotifications(user.id, (notifications) => {
      // Leer estado actual desde refs (no re-crea el listener)
      const currentRequest = privateChatRequestRef.current;
      const currentOpenChats = openPrivateChatsRef.current;
      const currentDismissed = dismissedChatIdsRef.current;
      const currentUser = userRef.current;

      const completedGroupInviteIds = new Set(
        notifications
          .filter((n) => n.type === 'private_group_chat_ready' || n.type === 'private_group_invite_rejected')
          .map((n) => n.inviteId)
          .filter(Boolean)
      );

      // Buscar solicitudes de chat privado pendientes
      const pendingRequests = notifications.filter((n) => (
        n.type === 'private_chat_request' && n.status === 'pending'
      ));
      const now = Date.now();
      const pendingGroupRequests = notifications.filter((n) => {
        if (n.type !== 'private_group_invite_request' || n.status !== 'pending') return false;
        if (n.inviteId && completedGroupInviteIds.has(n.inviteId)) return false;
        const expiresAtMs = Number(n.expiresAtMs || 0);
        if (!Number.isFinite(expiresAtMs) || expiresAtMs <= 0) return true;
        return expiresAtMs >= now;
      });

      const currentUserId = currentUser?.id || currentUser?.userId || user?.id || null;
      const normalizedPendingRequests = pendingRequests.map((item) => ({
        type: 'private_chat_request',
        from: {
          id: item.from,
          userId: item.from,
          username: item.fromUsername,
          avatar: item.fromAvatar,
          isPremium: item.fromIsPremium,
        },
        to: {
          ...(currentUser || {}),
          id: currentUserId,
          userId: currentUserId,
        },
        notificationId: item.id,
        source: item.source || 'manual',
        suggestedStarter: item.suggestedStarter || '',
        systemPrompt: item.systemPrompt || '',
        expiresAtMs: item.expiresAtMs || null,
      }));

      const normalizedPendingGroupRequests = pendingGroupRequests.map((item) => {
        const participantProfiles = Array.isArray(item.participantProfiles)
          ? item.participantProfiles
          : [];
        const inviteeProfile = participantProfiles.find((participant) => (
          participant?.userId === item.requestedUserId
        )) || {
          userId: item.requestedUserId,
          username: item.requestedUsername || 'Usuario',
          avatar: '',
        };

        return {
          type: 'private_group_invite_request',
          from: {
            id: item.from,
            userId: item.from,
            username: item.fromUsername,
            avatar: item.fromAvatar,
            isPremium: item.fromIsPremium,
          },
          to: {
            ...(currentUser || {}),
            id: currentUserId,
            userId: currentUserId,
          },
          requestedUser: inviteeProfile,
          participantProfiles,
          notificationId: item.id,
          inviteId: item.inviteId,
          sourceChatId: item.sourceChatId || null,
          expiresAtMs: item.expiresAtMs || null,
        };
      });

      const normalizedPendingItems = [...normalizedPendingRequests, ...normalizedPendingGroupRequests];
      setPendingPrivateRequests(normalizedPendingItems);

      if (!currentRequest) {
        const nextPendingRequest = normalizedPendingItems.find((item) => {
          const scope = getPrivateRequestSurfaceScope(item);
          return !isPrivateUiKeyActive(getPrivateRequestMuteKey(scope))
            && !isPrivateUiKeyActive(getPrivateRequestCooldownKey(scope))
            && !isPrivateUiKeyActive(getPrivateNotificationSeenKey(item?.notificationId));
        });

        if (nextPendingRequest) {
          const scope = getPrivateRequestSurfaceScope(nextPendingRequest);
          rememberPrivateUiKey(getPrivateRequestCooldownKey(scope), PRIVATE_UI_REQUEST_COOLDOWN_MS);
          setPrivateChatRequest(nextPendingRequest);
        }
      }

      // Rechazos de chat privado (importante para encadenar "conectar al azar")
      const rejectedChats = notifications.filter((n) => n.type === 'private_chat_rejected');
      if (rejectedChats.length > 0) {
        const currentRandomSession = randomConnectSessionRef.current;
        let handledRandomRejection = null;

        if (currentRandomSession.active) {
          const relevantRejection = rejectedChats.find((item) => {
            const sameSource = item.source === RANDOM_CONNECT_SOURCE;
            const sameRequest = currentRandomSession.pendingRequestId && item.requestId === currentRandomSession.pendingRequestId;
            const sameTarget = currentRandomSession.pendingTargetId && item.from === currentRandomSession.pendingTargetId;
            return sameSource && (sameRequest || sameTarget);
          });

          if (relevantRejection) {
            handledRandomRejection = relevantRejection;
            markNotificationAsRead(user.id, relevantRejection.id).catch(() => {});
            const rejectedName = relevantRejection.fromUsername || currentRandomSession.pendingTargetName || 'este usuario';
            clearRandomConnectPendingTimeoutRef.current?.();
            currentRandomSession.pendingRequestId = null;
            currentRandomSession.pendingTargetId = null;
            currentRandomSession.pendingTargetName = '';

            toast({
              title: 'Invitación rechazada',
              description: `${rejectedName} rechazó. Buscando otro usuario...`,
            });
            void sendNextRandomConnectInviteRef.current?.({ reason: 'rejected' });
          }
        }

        const remainingRejections = rejectedChats.filter(
          (item) => item.id !== handledRandomRejection?.id
        );
        const manualRejection = remainingRejections.find(
          (item) => item.source !== RANDOM_CONNECT_SOURCE
        );

        if (manualRejection) {
          toast({
            title: 'Invitación rechazada',
            description: `${manualRejection.fromUsername || 'Un usuario'} rechazó tu invitación.`,
            variant: 'destructive',
          });
        }

        remainingRejections.forEach((item) => {
          markNotificationAsRead(user.id, item.id).catch(() => {});
        });
      }

      // Buscar notificaciones de chat aceptado
      const acceptedChats = notifications.filter(n =>
        n.type === 'private_chat_accepted' && !currentDismissed.has(n.chatId)
      );

      if (acceptedChats.length > 0) {
        const latestAccepted = acceptedChats.find(
          (n) => getPrivateChatWindowState(n.chatId, currentOpenChats) === 'closed'
        ) || acceptedChats[0];

        const currentRandomSession = randomConnectSessionRef.current;
        if (currentRandomSession.active && currentRandomSession.pendingTargetId === latestAccepted.from) {
          stopRandomConnectRef.current?.();
        }

        const acceptedChatState = getPrivateChatWindowState(latestAccepted.chatId, currentOpenChats);
        if (acceptedChatState === 'visible') {
          markNotificationAsRead(user.id, latestAccepted.id).catch(() => {});
        } else if (acceptedChatState === 'closed' || acceptedChatState === 'minimized') {
          showPrivateConversationToast({
            notificationId: latestAccepted.id,
            chatId: latestAccepted.chatId,
            from: latestAccepted.from,
            fromUsername: latestAccepted.fromUsername || 'Usuario',
            fromAvatar: latestAccepted.fromAvatar || '',
            fromIsPremium: latestAccepted.fromIsPremium,
            title: `${latestAccepted.fromUsername || 'Un usuario'} aceptó tu privado`,
            content: latestAccepted.content || 'La conversación privada ya está lista.',
            hint: acceptedChatState === 'minimized'
              ? 'Tu chat sigue minimizado. Puedes retomarlo ahora o dejarlo en Conecta.'
              : 'No se abrirá sola. Puedes entrar ahora o dejarla en Conecta para después.',
          });
        }
      }

      const reopenedChats = notifications.filter((n) =>
        n.type === 'private_chat_reopened' && !n.read && !currentDismissed.has(n.chatId)
      );

      if (reopenedChats.length > 0) {
        const latestReopened = reopenedChats.find(
          (n) => getPrivateChatWindowState(n.chatId, currentOpenChats) === 'closed'
        ) || reopenedChats[0];

        const participantProfiles = Array.isArray(latestReopened.participantProfiles)
          ? latestReopened.participantProfiles
          : [];

        const reopenedChatState = getPrivateChatWindowState(latestReopened.chatId, currentOpenChats);
        if (reopenedChatState === 'visible') {
          markNotificationAsRead(user.id, latestReopened.id).catch(() => {});
        } else if (reopenedChatState === 'closed' || reopenedChatState === 'minimized') {
          showPrivateConversationToast({
            notificationId: latestReopened.id,
            chatId: latestReopened.chatId,
            from: latestReopened.from,
            fromUsername: latestReopened.fromUsername || 'Usuario',
            fromAvatar: latestReopened.fromAvatar || '',
            fromIsPremium: latestReopened.fromIsPremium,
            title: latestReopened.fromUsername || 'Nuevo privado',
            content: latestReopened.content || 'Hay una conversación privada nueva esperándote.',
            hint: reopenedChatState === 'minimized'
              ? 'La conversación sigue minimizada. Solo vuelve al frente si tú quieres.'
              : 'Quedó disponible en Conecta. Se abre solo si haces clic.',
          });
        }
      }

      const directMessages = notifications.filter((n) => (
        n.type === 'direct_message'
        && n.chatId
        && !currentDismissed.has(n.chatId)
      ));

      if (directMessages.length > 0) {
        const openChatStateById = new Map(
          (currentOpenChats || [])
            .filter((chat) => chat?.chatId)
            .map((chat) => [chat.chatId, chat])
        );

        const unreadDirectByChat = {};
        directMessages.forEach((item) => {
          if (!item?.chatId) return;

          const currentChatState = openChatStateById.get(item.chatId);
          const isChatVisible = Boolean(currentChatState && !currentChatState.isMinimized);

          if (isChatVisible) {
            markNotificationAsRead(user.id, item.id).catch(() => {});
            return;
          }

          if (!unreadDirectByChat[item.chatId]) {
            unreadDirectByChat[item.chatId] = {
              chatId: item.chatId,
              count: 0,
              latestContent: item.content || '',
              latestTimestamp: item.timestamp || new Date().toISOString(),
              partner: {
                userId: item.from,
                username: item.fromUsername || 'Usuario',
                avatar: item.fromAvatar || '',
                isPremium: item.fromIsPremium,
              },
              notificationIds: [],
            };
          }

          unreadDirectByChat[item.chatId].count += 1;
          unreadDirectByChat[item.chatId].notificationIds.push(item.id);

          const currentLatest = new Date(unreadDirectByChat[item.chatId].latestTimestamp || 0).getTime();
          const candidateLatest = new Date(item.timestamp || 0).getTime();
          if (candidateLatest >= currentLatest) {
            unreadDirectByChat[item.chatId].latestContent = item.content || '';
            unreadDirectByChat[item.chatId].latestTimestamp = item.timestamp || new Date().toISOString();
            unreadDirectByChat[item.chatId].partner = {
              userId: item.from,
              username: item.fromUsername || 'Usuario',
              avatar: item.fromAvatar || '',
              isPremium: item.fromIsPremium,
            };
          }
        });

        setUnreadPrivateMessages(unreadDirectByChat);

        const latestUnshownMessage = directMessages.find((item) => {
          if (!item?.id || !item?.chatId) return false;
          const currentChatState = openChatStateById.get(item.chatId);
          if (currentChatState && !currentChatState.isMinimized) return false;
          if (dismissedChatIdsRef.current?.has(item.chatId)) return false;
          if (privateDirectMessageToastRef.current) return false;
          if (isPrivateUiKeyActive(getPrivateNotificationSeenKey(item.id))) return false;
          return !handledDirectMessageNotificationIdsRef.current.has(item.id);
        });

        if (latestUnshownMessage) {
          handledDirectMessageNotificationIdsRef.current.add(latestUnshownMessage.id);
          rememberPrivateUiKey(getPrivateNotificationSeenKey(latestUnshownMessage.id), PRIVATE_UI_NOTIFICATION_TTL_MS);
          setPrivateDirectMessageToast({
            notificationId: latestUnshownMessage.id,
            chatId: latestUnshownMessage.chatId,
            from: latestUnshownMessage.from,
            fromUsername: latestUnshownMessage.fromUsername || 'Usuario',
            fromAvatar: latestUnshownMessage.fromAvatar || '',
            fromIsPremium: latestUnshownMessage.fromIsPremium,
            content: latestUnshownMessage.content || '',
            title: 'Nuevo mensaje privado',
            hint: openChatStateById.get(latestUnshownMessage.chatId)?.isMinimized
              ? 'Tu privado está minimizado. Puedes retomarlo ahora o dejarlo con badge.'
              : 'Queda en Conecta con badge. Solo se abre si tú decides entrar.',
            actionLabel: 'Abrir',
          });
        }
      } else {
        setUnreadPrivateMessages({});
      }

      const rejectedGroupInvites = notifications.filter((n) => n.type === 'private_group_invite_rejected' && !n.read);
      rejectedGroupInvites.forEach((item) => {
        if (currentRequest?.inviteId && currentRequest.inviteId === item.inviteId) {
          setPrivateChatRequest(null);
        }
        toast({
          title: 'Invitación grupal cancelada',
          description: `${item.fromUsername || 'Un usuario'} rechazó sumar a ${item.requestedUsername || 'ese usuario'} al chat.`,
          variant: 'destructive',
        });
        markNotificationAsRead(user.id, item.id).catch(() => {});
      });

      const readyGroupChats = notifications.filter((n) => (
        n.type === 'private_group_chat_ready' && !n.read && !currentDismissed.has(n.chatId)
      ));
      if (readyGroupChats.length > 0) {
        const latestReady = readyGroupChats.find(
          (n) => getPrivateChatWindowState(n.chatId, currentOpenChats) === 'closed'
        ) || readyGroupChats[0];

        if (currentRequest?.inviteId && currentRequest.inviteId === latestReady.inviteId) {
          setPrivateChatRequest(null);
        }

        const readyGroupChatState = getPrivateChatWindowState(latestReady.chatId, currentOpenChats);
        if (readyGroupChatState === 'visible') {
          markNotificationAsRead(user.id, latestReady.id).catch(() => {});
        } else if (readyGroupChatState === 'closed' || readyGroupChatState === 'minimized') {
          showPrivateConversationToast({
            notificationId: latestReady.id,
            chatId: latestReady.chatId,
            from: latestReady.from,
            fromUsername: latestReady.fromUsername || 'Chat grupal',
            fromAvatar: latestReady.fromAvatar || '',
            fromIsPremium: latestReady.fromIsPremium,
            title: latestReady.title || 'Chat grupal privado listo',
            content: latestReady.content || 'El grupo privado quedó disponible para abrir.',
            hint: readyGroupChatState === 'minimized'
              ? 'El grupo quedó minimizado. Puedes volver cuando quieras.'
              : 'No se abrirá automáticamente. Puedes entrar cuando quieras.',
          });
        }
      }
    });

    return () => unsubscribe();
  }, [user?.id, isPageVisible, getPrivateChatWindowState, getPrivateRequestSurfaceScope, isPrivateUiKeyActive, rememberPrivateUiKey, showPrivateConversationToast]); // refs manejan el estado mutable

  useEffect(() => {
    if (!authReady || !user?.id || auth.currentUser?.uid !== user.id) {
      setPrivateInboxItems([]);
      return;
    }

    if (!hasActivatedPrivateSurfaces) {
      setPrivateInboxItems([]);
      return;
    }

    if (!isPageVisible) return;

    const unsubscribe = subscribeToPrivateInbox(user.id, (items) => {
      setPrivateInboxItems(Array.isArray(items) ? items : []);
    });

    return () => unsubscribe();
  }, [authReady, hasActivatedPrivateSurfaces, user?.id, isPageVisible]);

  useEffect(() => {
    if (!authReady || !user?.id || auth.currentUser?.uid !== user.id) {
      setPrivateMatchStateItems([]);
      return;
    }

    if (!hasActivatedPrivateSurfaces) {
      setPrivateMatchStateItems([]);
      return;
    }

    if (!isPageVisible) return;

    const unsubscribe = subscribeToPrivateMatchState(user.id, (items) => {
      setPrivateMatchStateItems(Array.isArray(items) ? items : []);
    });

    return () => unsubscribe();
  }, [authReady, hasActivatedPrivateSurfaces, user?.id, isPageVisible]);

  useEffect(() => {
    if (!user?.id) return;
    const visibleOpenChatIds = new Set(
      (openPrivateChats || [])
        .filter((chat) => chat?.chatId && !chat?.isMinimized)
        .map((chat) => chat.chatId)
    );
    if (visibleOpenChatIds.size === 0) return;

    const notificationIdsToRead = Object.values(unreadPrivateMessages || {})
      .filter((entry) => entry?.chatId && visibleOpenChatIds.has(entry.chatId))
      .flatMap((entry) => entry?.notificationIds || []);

    if (notificationIdsToRead.length === 0) return;

    notificationIdsToRead.forEach((notificationId) => {
      markNotificationAsRead(user.id, notificationId).catch(() => {});
    });

    setUnreadPrivateMessages((prev) => {
      const next = { ...(prev || {}) };
      let changed = false;
      Object.keys(next).forEach((chatId) => {
        if (visibleOpenChatIds.has(chatId)) {
          delete next[chatId];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [user?.id, openPrivateChats, unreadPrivateMessages]);

  useEffect(() => {
    if (!user?.id) return;
    const visibleOpenChatIds = (openPrivateChats || [])
      .filter((chat) => chat?.chatId && !chat?.isMinimized)
      .map((chat) => chat.chatId);
    if (visibleOpenChatIds.length === 0) return;

    visibleOpenChatIds.forEach((chatId) => {
      markPrivateInboxConversationRead(user.id, chatId).catch(() => {});
    });
  }, [user?.id, openPrivateChats]);

  useEffect(() => {
    if (!privateDirectMessageToast?.chatId) return;
    const isNowVisible = (openPrivateChats || []).some(
      (chat) => chat?.chatId === privateDirectMessageToast.chatId && !chat?.isMinimized
    );
    if (isNowVisible) {
      setPrivateDirectMessageToast(null);
    }
  }, [openPrivateChats, privateDirectMessageToast]);

  // ✅ OLD SCROLL LOGIC REMOVED - Now using useChatScrollManager hook

  // Marcar mensajes como leídos cuando la sala está activa
  // TEMPORALMENTE DESHABILITADO: Requiere índice de Firestore
  // useEffect(() => {
  //   if (roomId && user && messages.length > 0) {
  //     // Esperar 1 segundo antes de marcar como leídos (simula que el usuario los vio)
  //     const timer = setTimeout(() => {
  //       markMessagesAsRead(roomId, user.id);
  //     }, 1000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [roomId, user, messages.length]);

  /**
   * Manejar reacciones a mensajes
   * ✅ Actualiza Firestore directamente
   */
  const handleMessageReaction = async (messageId, reaction) => {
    console.log('[REACTION] 🎯 Intentando reacción:', { messageId, reaction, currentRoom, userId: user?.id });

    // ⚠️ RESTRICCIÓN: Usuarios no autenticados o anónimos NO pueden dar reacciones
    if (!auth.currentUser || auth.currentUser.isAnonymous || user?.isGuest || user?.isAnonymous || !user?.id) {
      console.log('[REACTION] ❌ Usuario no autenticado o invitado');
      toast({
        title: "¿Te gustó? Regístrate para reaccionar",
        description: "Es gratis y toma 30 segundos",
        variant: "default",
        duration: 4000,
        action: {
          label: "Registrarse",
          onClick: () => navigate('/auth')
        }
      });
      return false;
    }

    if (!currentRoom) {
      console.error('[REACTION] ❌ No hay sala activa');
      return false;
    }

    if (!messageId) {
      console.error('[REACTION] ❌ No hay messageId');
      return false;
    }

    try {
      const targetMessage = messages.find(m => (m._realId || m.id) === messageId);
      const targetUserId = targetMessage?.userId;
      if (targetUserId) {
        const blocked = await isBlockedBetween(user.id, targetUserId);
        if (blocked) {
          toast({
            title: "No disponible",
            description: "No puedes interactuar con este usuario.",
            variant: "destructive",
          });
          return false;
        }
      }
      console.log('[REACTION] 📤 Enviando a Firestore...');
      const persistedReactions = await addReactionToMessage(currentRoom, messageId, reaction);
      console.log('[REACTION] ✅ Reacción guardada');

      // Reflejar inmediatamente en UI local
      setMessages((prev) => prev.map((msg) => {
        const msgId = msg._realId || msg.id;
        if (msgId !== messageId) return msg;

        return {
          ...msg,
          reactions: persistedReactions || msg.reactions,
        };
      }));

      // Feedback visual
      const reactionToastMap = {
        like: '👍 Like agregado',
        dislike: '👎 Dislike agregado',
        fire: '🔥 Reacción agregada',
        heart: '❤️ Reacción agregada',
        devil: '😈 Reacción agregada',
      };
      toast({
        description: reactionToastMap[reaction] || '✅ Reacción agregada',
        duration: 1500,
      });
      return true;
    } catch (error) {
      console.error('[REACTION] ❌ Error:', error);
      toast({
        title: error?.message === 'REQUIRES_REGISTERED_USER'
          ? "Regístrate para reaccionar"
          : "No pudimos agregar la reacción",
        description: error?.message === 'REQUIRES_REGISTERED_USER'
          ? "Solo usuarios registrados pueden reaccionar."
          : (error.message || "Intenta de nuevo"),
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteOwnMessage = async (message) => {
    const firestoreId = message?._realId || message?.id;
    if (!firestoreId || message?._optimistic) return;

    if (!user?.id) {
      toast({
        title: 'Debes iniciar sesión',
        description: 'Inicia sesión para eliminar mensajes.',
        variant: 'destructive',
      });
      return;
    }

    const isOwner = (message?.userId || '') === user.id;
    if (!isOwner && !isCurrentUserAdmin) {
      toast({
        title: 'Acción no permitida',
        description: 'Solo puedes eliminar tus propias fotos.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm(
      isCurrentUserAdmin && !isOwner
        ? '¿Eliminar este mensaje como admin?'
        : '¿Eliminar esta foto del chat?'
    );
    if (!confirmed) return;

    try {
      await deleteMessageWithMedia(currentRoom, firestoreId, message, {
        isAdmin: isCurrentUserAdmin,
        roomScope: 'rooms',
      });
      setMessages((prev) => prev.filter((m) => (m._realId || m.id) !== firestoreId));
      toast({
        description: isCurrentUserAdmin && !isOwner ? '🗑️ Mensaje eliminado' : '🗑️ Foto eliminada',
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: 'No se pudo eliminar',
        description: error?.code === 'permission-denied'
          ? 'Permiso denegado en reglas de Firestore para borrar este mensaje.'
          : (error?.message === 'NOT_MESSAGE_OWNER'
            ? 'Solo puedes eliminar tus propias fotos.'
            : 'Intenta nuevamente en unos segundos.'),
        variant: 'destructive',
      });
    }
  };

  const handleAdminQuickSanction = async (targetUser, actionType) => {
    if (!isCurrentUserAdmin) return;
    if (!targetUser?.userId) return;

    if (targetUser.userId === user?.id) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes sancionarte a ti mismo.',
        variant: 'destructive',
      });
      return;
    }

    if (targetUser?.isGuest || targetUser?.isAnonymous || String(targetUser.userId).startsWith('unauthenticated_')) {
      toast({
        title: 'Usuario no sancionable',
        description: 'Este perfil es invitado/no registrado. Puedes borrar sus mensajes pero no aplicar sanción de cuenta.',
        variant: 'destructive',
      });
      return;
    }

    const basePayload = {
      userId: targetUser.userId,
      username: targetUser.username || 'Usuario',
      issuedByUsername: user?.username || 'Admin',
      reason: SANCTION_REASONS.OTHER,
      notes: `Acción rápida desde chat/${currentRoom}`,
    };

    if (actionType === 'warning') {
      await createSanction({
        ...basePayload,
        type: SANCTION_TYPES.WARNING,
        reasonDescription: `Advertencia emitida por moderación en sala ${currentRoom}.`,
      });
      toast({
        title: 'Advertencia enviada',
        description: `${targetUser.username} recibió advertencia.`,
      });
      return;
    }

    if (actionType === 'mute') {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await createSanction({
        ...basePayload,
        type: SANCTION_TYPES.MUTE,
        duration: 1,
        expiresAt,
        reasonDescription: `Silencio temporal de 24 horas en sala ${currentRoom}.`,
      });
      toast({
        title: 'Usuario silenciado',
        description: `${targetUser.username} quedó silenciado por 24 horas.`,
      });
      return;
    }

    if (actionType === 'ban') {
      const confirmed = window.confirm(`¿Expulsar permanentemente a ${targetUser.username}?`);
      if (!confirmed) return;

      await createSanction({
        ...basePayload,
        type: SANCTION_TYPES.PERM_BAN,
        reasonDescription: `Expulsión permanente desde moderación en sala ${currentRoom}.`,
      });
      toast({
        title: 'Usuario expulsado',
        description: `${targetUser.username} fue expulsado permanentemente.`,
      });
    }
  };

  const handleAdminDeleteUserMessages = async (targetUser) => {
    if (!isCurrentUserAdmin) return;
    if (!targetUser?.userId) return;

    const confirmed = window.confirm(
      `¿Borrar todos los mensajes de ${targetUser.username || 'este usuario'} en la sala ${currentRoom}?`
    );
    if (!confirmed) return;

    try {
      const { deletedCount } = await deleteUserMessagesInRoom(currentRoom, targetUser.userId, {
        isAdmin: true,
        roomScope: 'rooms',
      });
      setMessages((prev) => prev.filter((msg) => msg.userId !== targetUser.userId));
      toast({
        title: 'Mensajes eliminados',
        description: `Se eliminaron ${deletedCount} mensajes en ${currentRoom}.`,
      });
    } catch (error) {
      console.error('[ADMIN DELETE USER MESSAGES] Error:', error);
      toast({
        title: 'No se pudo borrar mensajes',
        description: error?.code === 'permission-denied'
          ? 'Permiso denegado por reglas de Firestore.'
          : 'Intenta nuevamente en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  const handleAdminDeleteRoomMessages = async () => {
    if (!isCurrentUserAdmin) return;

    const confirmed = window.confirm(
      `¿Vaciar completamente la sala ${currentRoom}? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const { deletedCount } = await deleteAllMessagesInRoom(currentRoom, {
        isAdmin: true,
        roomScope: 'rooms',
        includeSystem: true,
      });
      setMessages([]);
      toast({
        title: 'Sala vaciada',
        description: `Se eliminaron ${deletedCount} mensajes de ${currentRoom}.`,
      });
    } catch (error) {
      console.error('[ADMIN CLEAR ROOM] Error:', error);
      toast({
        title: 'No se pudo vaciar la sala',
        description: error?.code === 'permission-denied'
          ? 'Permiso denegado por reglas de Firestore.'
          : 'Intenta nuevamente en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  /**
   * 💬 REPLY: Handler cuando usuario presiona botón de responder
   */
  const handleReply = (messageData) => {
    setReplyTo(messageData);
    // Hacer focus en el input para que el usuario empiece a escribir
    setTimeout(() => {
      const textarea = document.querySelector('textarea[aria-label="Campo de texto para escribir mensaje"]');
      if (textarea) {
        textarea.focus();
      }
    }, 100);
  };

  const handleSuggestedReply = useCallback((text, replyMessage = null) => {
    const nextText = String(text || '').trim();
    if (!nextText) return;

    if (replyMessage) {
      handleReply(replyMessage);
    } else {
      setTimeout(() => {
        const textarea = document.querySelector('textarea[aria-label="Campo de texto para escribir mensaje"]');
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }

    setSuggestedMessage(null);
    setTimeout(() => {
      setSuggestedMessage(nextText);
    }, 0);
  }, []);

  /**
   * 💬 REPLY: Handler para cancelar respuesta
   */
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  /**
   * Enviar mensaje
   * ✅ Guarda en Firestore en tiempo real
   * ✅ Validación para usuarios invitados (máx 10 mensajes)
   * ✅ Contador persistente en Firestore para anónimos
   * 🤖 Activa respuesta de bots si están activos
   */
  const handleSendMessage = async (content, type = 'text', replyData = null, options = {}) => {
    const trimmedContent = typeof content === 'string' ? content.trim() : content;
    const isQuickStarter = QUICK_STARTER_PHRASES.includes(trimmedContent);
    const allowGuestAutoStart = options?.allowGuestAutoStart === true;
    const messageType = type || 'text';
    const isTextMessage = messageType === 'text';
    const messageMedia = Array.isArray(options?.media)
      ? options.media.filter((item) => item && typeof item.path === 'string' && item.path.trim())
      : [];
    const publicMessageSignalMeta = isTextMessage
      ? getPublicMessageSignalMeta({
          content: trimmedContent,
          fallbackRole: user?.profileRole || user?.role || localStorage.getItem('chactivo:role') || null,
        })
      : null;

    // 🔒 Si ya exigimos nickname (después del primer mensaje rápido), bloquear cualquier envío
    if (needsNickname && !(allowGuestAutoStart && isQuickStarter)) {
      openNicknameModal('message_gate');
      toast({
        title: 'Elige tu nickname',
        description: 'Para seguir chateando, primero ingresa tu nickname.',
        duration: 4000,
        variant: 'default',
      });
      return;
    }

    // ✅ Permitir primer mensaje rápido sin nickname
    let currentUser = userRef.current || user;
    if (!currentUser || !currentUser.id) {
      if (allowGuestAutoStart && isQuickStarter) {
        // Crear guest automático (GuestXXXX)
        const autoGuestOk = await signInAsGuest(null, null, false);
        if (!autoGuestOk) {
          toast({
            title: 'Error',
            description: 'No pudimos iniciar tu sesión de invitado. Intenta de nuevo.',
            variant: 'destructive',
          });
          return;
        }

        // Esperar a que el usuario optimista esté disponible
        let attempts = 0;
        const maxAttempts = 30;
        while ((!userRef.current || !userRef.current.id) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 50));
          attempts++;
        }
        currentUser = userRef.current || user;

        if (!currentUser || !currentUser.id) {
          toast({
            title: 'Error',
            description: 'No pudimos crear tu identidad de invitado. Intenta nuevamente.',
            variant: 'destructive',
          });
          return;
        }

        // Exigir nickname para el siguiente mensaje
        setNeedsNickname(true);
      } else {
        toast({
          title: 'Elige tu nickname',
          description: 'Ingresa tu nombre en el cuadro de arriba para empezar a chatear.',
          duration: 4000,
          variant: 'default',
        });
        return;
      }
    }

    // ✅ A partir de aquí usamos el usuario efectivo (puede ser invitado auto-creado)
    // ✅ Chat principal: SIEMPRE permitir enviar mensajes (registrados e invitados)
    // Solo Baúl (cambio foto) y OPIN (publicar) requieren registro
    if (auth.currentUser) {
      // Si hay auth, esperar a que esté disponible
      let attempts = 0;
      const maxAttempts = 30;

      while (!auth.currentUser && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }

    // ✅ CRÍTICO: Validar mayoría de edad (verificar localStorage también)
    if (!isAgeVerified) {
      const ageKey = `age_verified_${currentUser.id}`;
      const storedAge = localStorage.getItem(ageKey);
      
      // ✅ Si está en localStorage, actualizar estado y continuar
      if (storedAge && Number(storedAge) >= 18) {
        setIsAgeVerified(true);
        setShowAgeVerification(false);
        // Continuar sin mostrar modal
      } else {
        // ✅ Solo mostrar modal si realmente NO está verificado
        const hasShownKey = `age_modal_shown_${currentUser.id}`;
        const hasShown = sessionStorage.getItem(hasShownKey);
        if (!hasShown) {
          setShowAgeVerification(true);
          sessionStorage.setItem(hasShownKey, 'true');
          toast({
            title: "Verifica tu edad",
            description: "Debes confirmar que eres mayor de 18 años para chatear.",
            variant: "destructive",
          });
        }
        return;
      }
    }

    // ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar
    // Ya no verificamos si el usuario aceptó las reglas antes de enviar mensajes
    // if (!hasAcceptedRules) {
    //   setShowChatRules(true);
    //   toast({
    //     title: "Reglas del Chat",
    //     description: "Debes aceptar las reglas del chat antes de enviar mensajes.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    // 🔥 DESHABILITADO: Invitados pueden chatear sin límite de tiempo
    // if (user.isAnonymous && hasReachedOneHourLimit(user)) {
    //   const totalTime = getTotalEngagementTime(user);
    //   setEngagementTime(totalTime);
    //   setShowVerificationModal(true);
    //   markEngagementModalAsShown();
    //   return;
    // }

    // Verificar si el usuario está silenciado o baneado
    if (!currentUser.isAnonymous && !currentUser.isGuest) {
      const sanctions = await checkUserSanctions(currentUser.id);
      
      if (sanctions.isBanned) {
        toast({
          title: "Acceso Denegado",
          description: sanctions.banType === 'perm_ban' 
            ? "Tu cuenta ha sido expulsada permanentemente."
            : "Tu cuenta está suspendida temporalmente.",
          variant: "destructive",
        });
        return;
      }

      // Verificar si está silenciado
      const isMuted = sanctions.sanctions.some(s => 
        s.type === SANCTION_TYPES.MUTE && s.status === 'active'
      );
      
      if (isMuted) {
        toast({
          title: "No puedes enviar mensajes",
          description: "Estás silenciado y no puedes enviar mensajes en este momento.",
          variant: "destructive",
        });
        return;
      }
    }

    // 🤖 MODERACIÓN IA: Verificar si el usuario tiene mute activo por moderación automática
    try {
      const aiMuteStatus = await checkAIMute(currentUser.id);
      if (aiMuteStatus.isMuted) {
        const remaining = formatMuteRemaining(aiMuteStatus.remainingMs);
        toast({
          title: `Silenciado por ${remaining}`,
          description: aiMuteStatus.reason || 'Has sido silenciado temporalmente por violar las normas.',
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
    } catch (err) {
      // Fail-open: si falla la verificación, permitir envío
      console.warn('[MOD-AI] Error verificando mute:', err.message);
    }

    try {
      const contactSafetyBan = await checkTempBan(currentUser.id);
      if (contactSafetyBan.isBanned) {
        toast({
          title: "Bloqueado por seguridad",
          description: contactSafetyBan.reason || "Tu cuenta tiene una restriccion temporal por seguridad.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }
    } catch (err) {
      console.warn('[ANTI-SPAM] Error verificando sancion critica:', err.message);
    }

    // 🔍 TRACE: Usuario escribió mensaje
    traceEvent(TRACE_EVENTS.USER_INPUT_TYPED, {
      content: content.substring(0, 50),
      type: messageType,
      userId: currentUser.id,
      username: currentUser.username,
      roomId: currentRoom,
    });

    if (isTextMessage) {
      const repeatedMessageMeta = getRepeatedPublicMessageMeta({
        content: trimmedContent,
        userId: currentUser.id,
        messages: filteredMessages,
        nowMs: Date.now(),
      });

      if (repeatedMessageMeta) {
        const repeatDescription = repeatedMessageMeta.reason === 'generic_repeat'
          ? 'Ya enviaste algo muy parecido hace poco. Agrega comuna, rol o lo que buscas antes de repetir.'
          : repeatedMessageMeta.reason === 'intent_repeat'
            ? 'Ya dijiste prácticamente la misma intención hace poco. Cambia el enfoque o responde a alguien concreto antes de repetir.'
            : 'Ese mensaje es demasiado parecido a uno que acabas de enviar. Cámbialo un poco antes de repetirlo.';

        toast({
          title: 'Evita repetir lo mismo',
          description: repeatDescription,
          duration: 3200,
        });
        return;
      }

      const criticalSafetyRisk = detectCriticalSafetyRisk(trimmedContent);
      if (criticalSafetyRisk.blocked) {
        const criticalReason = criticalSafetyRisk.reason || 'Contenido bloqueado por seguridad critica.';
        toast({
          title: "Mensaje bloqueado por seguridad",
          description: criticalReason,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
    }

    // 🚀 OPTIMISTIC UI: Mostrar mensaje INSTANTÁNEAMENTE (Zero Latency - como WhatsApp/Telegram)
    // ⚡ CRÍTICO: Mostrar primero, validar después (experiencia instantánea)
    const optimisticId = `temp_${Date.now()}_${Math.random()}`;
    const clientId = generateUUID(); // ✅ UUID real para correlación optimista/real (evitar colisiones)
    const nowMs = Date.now();

    const storedRoleRaw = localStorage.getItem('chactivo:role') || '';
    const storedComunaRaw = localStorage.getItem('chactivo:comuna') || '';
    const roleBadge = isHeteroRoom
      ? null
      : resolveProfileRole(
          storedRoleRaw,
          currentUser?.profileRole,
          currentUser?.role
        );
    const comuna = normalizeComuna(storedComunaRaw) || null;
    
    // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined en optimistic message
    const optimisticAvatar = resolveChatAvatar(currentUser.avatar);
    
    const optimisticMessage = {
      id: optimisticId,
      clientId, // ✅ F1: ID estable para correlación
      userId: currentUser.id,
      username: currentUser.username || 'Usuario', // ✅ FIX: Fallback si username es undefined
      avatar: optimisticAvatar, // ✅ SIEMPRE tiene valor válido
      isPremium: currentUser.isPremium || false,
      isProUser: currentUser.isProUser || false, // ⚡ PRO para arcoíris y badge
      hasRainbowBorder: currentUser.hasRainbowBorder || false,
      hasProBadge: currentUser.hasProBadge || false,
      hasFeaturedCard: currentUser.hasFeaturedCard || false,
      canUploadSecondPhoto: currentUser.canUploadSecondPhoto || false,
      badge: currentUser.badge || 'Nuevo', // 🏅 Badge de participación
      roleBadge,
      comuna,
      content,
      type: messageType,
      timestamp: new Date().toISOString(),
      timestampMs: nowMs, // ✅ CRÍTICO: timestampMs para ordenamiento correcto (sin esto aparecen arriba)
      replyTo: replyData,
      _optimistic: true, // Marca para saber que es temporal
      status: 'sending', // ⚡ Estado: 'sending' -> 'sent' -> 'error' (para indicadores visuales)
      _retryCount: 0, // Contador de reintentos
      ...(publicMessageSignalMeta ? { _signalMeta: publicMessageSignalMeta } : {}),
      ...(messageMedia.length > 0 ? { media: messageMedia } : {}),
    };

    // ⚡ INSTANTÁNEO: Agregar mensaje inmediatamente a la UI (usuario lo ve al instante)
    setMessages(prev => [...prev, optimisticMessage]);

    // 🔔 NUDGE: interacción en chat (no bloqueante)
    handleChatInteraction?.();

    if (
      isTextMessage
      && currentRoom === 'principal'
      && publicMessageSignalMeta?.isGenericLowSignal
      && (Date.now() - genericMessageNudgeAtRef.current) > 120000
    ) {
      genericMessageNudgeAtRef.current = Date.now();
      toast({
        title: 'Mejor con contexto',
        description: 'Prueba agregar comuna, rol o lo que buscas. Esos mensajes reciben más respuesta.',
        duration: 2600,
      });
    }
    
    // 🔍 TRACE: Mensaje optimista renderizado localmente
    traceEvent(TRACE_EVENTS.UI_LOCAL_RENDER, {
      traceId: clientId,
      optimisticId,
      content: content.substring(0, 50),
      userId: currentUser.id,
      roomId: currentRoom,
    });
    
    // 🔍 TRACE: Mensaje optimista creado
    traceEvent(TRACE_EVENTS.OPTIMISTIC_MESSAGE_CREATED, {
      traceId: clientId,
      optimisticId,
      content: content.substring(0, 50),
      userId: currentUser.id,
      roomId: currentRoom,
    });

    // ⚡ SCROLL ULTRA-RÁPIDO: Scroll inmediato sin esperar RAF (máxima velocidad)
    // Usar setTimeout(0) es más rápido que RAF para scroll directo
    setTimeout(() => {
      const container = scrollManager?.containerRef?.current;
      if (container) {
        // Scroll directo sin animación para máxima velocidad (como WhatsApp/Telegram)
        container.scrollTop = container.scrollHeight;
      }
    }, 0);

    // 🔊 Reproducir sonido inmediatamente (no bloquea UI, async)
    notificationSounds.playMessageSentSound();

    // 🔍 TRACE: Handler de envío activado
    traceEvent(TRACE_EVENTS.SEND_HANDLER_TRIGGERED, {
      traceId: clientId,
      content: content.substring(0, 50),
      userId: currentUser.id,
      roomId: currentRoom,
    });

    // 🛡️ VALIDACIÓN EN BACKGROUND: Validar después de mostrar (no bloquea UI)
    // ⚡ CRÍTICO: Las validaciones se ejecutan en background para no retrasar la experiencia visual
    const validationPromise = isTextMessage
      ? validateMessage(content, currentUser.id, currentUser.username, currentRoom, { dryRun: true })
          .then(validation => {
            if (!validation.allowed) {
              // 🔍 TRACE: Validación falló
              traceEvent(TRACE_EVENTS.PAYLOAD_VALIDATION_FAILED, {
                traceId: clientId,
                reason: validation.reason,
                userId: currentUser.id,
                roomId: currentRoom,
              });
              // ❌ VALIDACIÓN FALLÓ: Eliminar mensaje optimista y mostrar error
              setMessages(prev => prev.filter(m => m.id !== optimisticId));

              // Mostrar mensaje amigable con explicación y botón a OPIN (no rojo, no punitivo)
              const opinToastCommon = {
                variant: "default",
                duration: 8000,
                action: {
                  label: "Ir a OPIN",
                  onClick: () => {
                    navigate('/opin');
                  },
                },
              };

              if (validation.type === 'phone_number') {
                toast({
                  ...opinToastCommon,
                  title: "Teléfono no permitido aquí",
                  description: "OPIN es donde puedes publicar lo que buscas sin exponer tu contacto y luego mover la conversacion a privado interno.",
                });
              } else if (validation.type === 'email') {
                toast({
                  ...opinToastCommon,
                  title: "Email no permitido aquí",
                  description: "OPIN es donde puedes publicar tu intencion sin exponer correo ni telefono, y seguir dentro de Chactivo.",
                });
              } else if (validation.type === 'forbidden_word') {
                toast({
                  ...opinToastCommon,
                  title: "Enlaces externos no permitidos aquí",
                  description: "OPIN es donde puedes publicar lo que buscas sin sacar a la gente fuera de Chactivo.",
                });
              } else if (validation.type === 'private_redirect') {
                toast({
                  title: "Usa el privado interno",
                  description: auth.currentUser
                    ? "Si quieres seguir 1 a 1, toca el nombre del usuario y usa Invitar a privado dentro de Chactivo."
                    : "Para pasar a privado dentro de Chactivo primero debes registrarte.",
                  variant: "default",
                  duration: 8000,
                  action: auth.currentUser
                    ? undefined
                    : {
                        label: "Registrarme",
                        onClick: () => {
                          setShowRegistrationModal(true);
                          setRegistrationModalFeature('chat privado');
                        },
                      },
                });
              } else if (validation.type === 'spam_duplicate_warning') {
                toast({
                  title: "⚠️ ADVERTENCIA DE SPAM",
                  description: validation.reason,
                  variant: "destructive",
                  duration: 7000,
                });
              } else if (validation.type === 'spam_duplicate_ban') {
                const mins = validation.muteMins ?? 5;
                toast({
                  title: "🔨 Silenciado por spam",
                  description: `No puedes enviar mensajes por ${mins} minutos. Si intentas enviar verás el tiempo restante.`,
                  variant: "destructive",
                  duration: 10000,
                });
              } else if (validation.type === 'spam_flood_warning') {
                toast({
                  title: "Baja el ritmo",
                  description: validation.reason,
                  variant: "default",
                  duration: 7000,
                });
              } else if (validation.type === 'spam_flood_ban') {
                const mins = validation.muteMins ?? 5;
                toast({
                  title: "Silenciado por saturar la sala",
                  description: `Espera ${mins} minutos o usa el privado interno si ya encontraste a alguien.`,
                  variant: "destructive",
                  duration: 10000,
                });
              } else if (validation.type === 'temp_ban') {
                toast({
                  title: "🔨 EXPULSADO TEMPORALMENTE",
                  description: validation.reason,
                  variant: "destructive",
                  duration: 10000,
                });
              } else {
                // Genérico
                toast({
                  title: "❌ Mensaje Bloqueado",
                  description: validation.reason,
                  variant: "destructive",
                  duration: 5000,
                });
              }
              return false; // No enviar
            }

            // 🔍 TRACE: Validación exitosa
            traceEvent(TRACE_EVENTS.PAYLOAD_VALIDATED, {
              traceId: clientId,
              userId: currentUser.id,
              roomId: currentRoom,
            });

            return true; // Validación OK, continuar
          })
          .catch(() => true) // Si falla validación, permitir envío (fail-open)
      : Promise.resolve(true);

    // ⚡ INSTANTÁNEO: Enviar mensaje a Firestore en segundo plano (NO bloquear UI)
    // El mensaje optimista ya está visible, Firestore se sincroniza en background
    // ✅ CRÍTICO: Usar auth.currentUser.uid directamente (ya validado arriba)
    // Firestore rules requieren que data.userId == request.auth.uid exactamente

    // 📊 PERFORMANCE MONITOR: Capturar tiempo de inicio ANTES del Promise chain
    const messageSendStartTime = performance.now();

    Promise.all([validationPromise])
      .then(([isValid]) => {
        if (!isValid) return; // Validación falló, no enviar
        
        // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined
        const messageAvatar = resolveChatAvatar(currentUser.avatar);

        // 🔍 TRACE: Intentando escribir en Firebase
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_ATTEMPT, {
          traceId: clientId,
          userId: auth.currentUser?.uid || currentUser.id,
          roomId: currentRoom,
          content: content.substring(0, 50),
        });

        // 📊 PERFORMANCE MONITOR: Iniciar tracking de envío de mensaje
        startTiming('messageSent', { 
          clientId,
          roomId: currentRoom,
          contentLength: content.length 
        });

        return sendMessage(
      currentRoom,
      {
        clientId, // ✅ F1: Pasar clientId para correlación
        userId: auth.currentUser?.uid || currentUser.id, // ✅ Fallback si no hay auth aún
        username: currentUser.username || 'Usuario', // ✅ FIX: Fallback si username es undefined
        avatar: messageAvatar, // ✅ SIEMPRE tiene valor válido
        isPremium: currentUser.isPremium || false,
        isProUser: currentUser.isProUser || false,
        hasRainbowBorder: currentUser.hasRainbowBorder || false,
        hasProBadge: currentUser.hasProBadge || false,
        hasFeaturedCard: currentUser.hasFeaturedCard || false,
        canUploadSecondPhoto: currentUser.canUploadSecondPhoto || false,
        badge: currentUser.badge || 'Nuevo', // 🏅 Badge de participación
        roleBadge,
        comuna,
        content,
        type: messageType,
        replyTo: replyData,
        traceId: clientId, // ✅ Pasar traceId para correlación
        ...(messageMedia.length > 0 ? { media: messageMedia } : {}),
      },
      currentUser.isAnonymous
        );
      })
      .then((sentMessage) => {
        if (!sentMessage) return; // Validación falló o no se envió
        
        // 🔍 TRACE: Escritura en Firebase exitosa
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_SUCCESS, {
          traceId: clientId,
          messageId: sentMessage.id,
          userId: currentUser.id,
          roomId: currentRoom,
          firestoreId: sentMessage.id,
        });
        
        // ✅ Mensaje enviado exitosamente - se actualizará automáticamente vía onSnapshot
        // Track GA4 (background, no bloquea)
        trackMessageSent(currentRoom, { user: currentUser });
        if (currentRoom === 'hetero-general') {
          heteroRoomSentCountRef.current += 1;
          track(
            'hetero_chat_message_sent',
            {
              roomId: currentRoom,
              session_message_count: heteroRoomSentCountRef.current,
            },
            { user: currentUser }
          ).catch(() => {});
        }

        try {
          const sessionId = getSessionId();
          const firstMessageKey = `first_message_sent:${sessionId}`;
          if (sessionStorage.getItem(firstMessageKey) !== '1') {
            sessionStorage.setItem(firstMessageKey, '1');
            track('first_message_sent', {
              roomId: currentRoom,
              roomName: currentRoom,
              isGuest: !!(currentUser?.isGuest || currentUser?.isAnonymous),
            }, { user: currentUser }).catch(() => {});
          }
        } catch {
          // Non-blocking tracking
        }
        
        // 📊 PERFORMANCE MONITOR: Completar tracking de envío
        endTiming('messageSent', { 
          clientId,
          messageId: sentMessage?.id,
          status: 'success' 
        });
        trackMessageSentPerformance(messageSendStartTime, sentMessage?.id || clientId, {
          roomId: currentRoom,
          contentLength: content.length,
        });

        // 🎯 VOC: Resetear cooldown cuando hay nueva actividad
        resetVOCCooldown(currentRoom);

        // ⚡ LATENCY CHECK: Solo log en consola (sin toast al usuario)
        const latency = Date.now() - optimisticMessage.timestampMs;
        console.log(`⏱️ [LATENCY TEST] Mensaje sincronizado en ${latency}ms`);

        // 🤖 MODERACIÓN IA: solo para texto
        if (isTextMessage) {
          evaluateMessage(content, currentUser.id, currentUser.username, currentRoom)
            .then((modResult) => {
              if (!modResult.safe) {
                console.log(`[MOD-AI] Violación detectada post-send:`, modResult);

                // Eliminar mensaje de Firestore
                if (sentMessage?.id) {
                  deleteDoc(doc(db, 'rooms', currentRoom, 'messages', sentMessage.id)).catch(e =>
                    console.warn('[MOD-AI] Error eliminando mensaje:', e.message)
                  );
                }

                // Eliminar mensaje optimista de la UI
                setMessages(prev => prev.filter(m => m.id !== optimisticId && m._realId !== sentMessage?.id));

                // Mostrar feedback según acción
                if (modResult.action === 'warning') {
                  toast({
                    title: "Advertencia",
                    description: modResult.reason || 'Tu mensaje fue eliminado por violar las normas.',
                    variant: "destructive",
                    duration: 6000,
                  });
                } else if (modResult.action === 'mute') {
                  toast({
                    title: `Silenciado por ${modResult.muteMins} minutos`,
                    description: `${modResult.reason || 'Violación de normas'} (Strike ${modResult.strikes})`,
                    variant: "destructive",
                    duration: 8000,
                  });
                }
              }
            })
            .catch(() => {}); // Fail silently, never block
        }

        // ❌ TOAST DE LATENCIA ELIMINADO (07/01/2026) - No interesa al usuario
        // El usuario no necesita ver información técnica de latencia
        // Solo mantener log en consola para debugging

        // ✅ ACTUALIZAR ESTADO: Marcar como 'sent' cuando Firestore confirma
        // El listener de onSnapshot se encargará de eliminar el optimista cuando detecte el real
        if (sentMessage?.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticId 
              ? { ...msg, _realId: sentMessage.id, status: 'sent', _sentAt: Date.now() } // ⚡ Estado: 'sent' (doble check gris)
              : msg
          ));

          // ⏱️ DESHABILITADO: Timeout de 20 segundos causaba falsos positivos
          // Si el mensaje se escribió exitosamente en Firebase (.then), confiar en que se envió
          // El estado 'delivered' se detectará automáticamente cuando llegue el snapshot

          /* CÓDIGO ANTERIOR: Timeout agresivo que marcaba mensajes como fallidos incorrectamente
          const deliveryTimeout = setTimeout(() => {
            setMessages(prev => {
              const message = prev.find(m => m.id === optimisticId || m._realId === sentMessage.id);
              if (message && message.status !== 'delivered' && message.userId === user?.id) {
                console.error('🚨 [MENSAJE NO ENTREGADO] FALLA:', {
                  messageId: message.id,
                  realId: message._realId || sentMessage.id,
                  content: message.content?.substring(0, 50) + '...',
                  timestamp: new Date().toISOString(),
                  elapsed: Date.now() - (message._sentAt || Date.now()),
                  status: message.status
                });

                return prev.map(msg =>
                  (msg.id === optimisticId || msg._realId === sentMessage.id) && msg.userId === user?.id
                    ? { ...msg, status: 'failed', _deliveryFailed: true }
                    : msg
                );
              }
              return prev;
            });
          }, 20000);

          deliveryTimeoutsRef.current.set(optimisticId, deliveryTimeout);
          */
        }
      })
      .catch((error) => {
        console.error('❌ Error enviando mensaje:', error);

        if (error?.code === 'guest-auth-required') {
          openNicknameModal('message_gate');
          toast({
            title: 'Elige tu nickname',
            description: 'Necesitamos crear tu sesión de invitado para enviar el mensaje.',
            duration: 4000,
            variant: 'default',
          });
        } else if ((error?.code || '').startsWith('rate-limit')) {
          toast({
            title: 'Vas muy rápido',
            description: error?.message || `Espera ${error?.retryAfterSeconds || 1}s antes de volver a escribir.`,
            duration: 3500,
            variant: 'default',
          });
        }

        // 🔍 TRACE: Escritura en Firebase falló
        traceEvent(TRACE_EVENTS.FIREBASE_WRITE_FAIL, {
          traceId: clientId,
          error: error.message,
          errorCode: error.code,
          userId: currentUser.id,
          roomId: currentRoom,
        });

        // ❌ FALLÓ - Marcar como error (NO eliminar, permitir reintento)
        setMessages(prev => prev.map(msg =>
          msg.id === optimisticId
            ? { ...msg, status: 'error', _error: error } // ⚡ Estado: 'error' (mostrar indicador rojo)
            : msg
        ));

        // ⚡ Toast de error DESHABILITADO - Causaba confusión
        // El mensaje sí se entrega pero el toast aparecía por errores de tracking
        // Solo log en consola para debug
        // if (import.meta.env.DEV) {
        //   toast({
        //     title: "No pudimos entregar este mensaje",
        //     description: "Toca el mensaje para reintentar",
        //     variant: "destructive",
        //     duration: 5000,
        //   });
        // }
      });
  };

  /**
   * 🔄 REINTENTAR MENSAJE: Reintentar envío de mensaje fallido
   */
  const handleRetryMessage = async (optimisticMessage) => {
    const { id: optimisticId, content, type, replyTo, media, _retryCount = 0 } = optimisticMessage;
    
    // Limitar reintentos (máximo 3)
    if (_retryCount >= 3) {
      toast({
        title: "Límite de reintentos alcanzado",
        description: "Por favor, recarga la página o verifica tu conexión",
        variant: "destructive",
      });
      return;
    }

    // Marcar como 'sending' nuevamente
    setMessages(prev => prev.map(msg => 
      msg.id === optimisticId 
        ? { ...msg, status: 'sending', _retryCount: _retryCount + 1 }
        : msg
    ));

    // Reintentar envío
    try {
      // ✅ GARANTIZAR AVATAR: Nunca enviar null o undefined
      const messageAvatar = resolveChatAvatar(user.avatar);

      const sentMessage = await sendMessage(
        currentRoom,
        {
          clientId: optimisticMessage.clientId,
          userId: auth.currentUser.uid,
          username: user.username,
          avatar: messageAvatar, // ✅ SIEMPRE tiene valor válido
          isPremium: user.isPremium,
          badge: user.badge || 'Nuevo', // 🏅 Badge de participación
          content,
          type,
          replyTo,
          ...(Array.isArray(media) && media.length > 0 ? { media } : {}),
        },
        user.isAnonymous
      );

      if (sentMessage?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, _realId: sentMessage.id, status: 'sent' }
            : msg
        ));
      }
    } catch (error) {
      // Marcar como error nuevamente
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, status: 'error', _error: error }
          : msg
      ));

      if ((error?.code || '').startsWith('rate-limit')) {
        toast({
          title: 'Vas muy rápido',
          description: error?.message || `Espera ${error?.retryAfterSeconds || 1}s antes de volver a escribir.`,
          duration: 3500,
          variant: 'default',
        });
      }
    }
  };


  /**
   * Solicitud de chat privado
   */
  const handleDismissPrivateMatchSuggestion = useCallback(() => {
    const activeSuggestion = privateMatchSuggestionRef.current;
    if (activeSuggestion?.partner?.userId) {
      bumpPrivateSuggestionScore(activeSuggestion.partner.userId, 2, 'dismissed');
      privateMatchCooldownByTargetRef.current.set(
        activeSuggestion.partner.userId,
        Date.now() + PRIVATE_MATCH_COOLDOWN_MS
      );
    }
    setPrivateMatchSuggestion(null);
    lastInteractionAtRef.current = Date.now();
  }, [bumpPrivateSuggestionScore]);

  useEffect(() => {
    if (!privateMatchSuggestion) return undefined;
    if (isSendingPrivateMatchRequest || isOpeningContextualOpportunity) return undefined;

    const autoDismissTimer = setTimeout(() => {
      if (
        privateMatchSuggestionRef.current
        && !isSendingPrivateMatchRequestRef.current
        && !isOpeningContextualOpportunityRef.current
      ) {
        handleDismissPrivateMatchSuggestion();
      }
    }, PRIVATE_MATCH_SUGGESTION_VISIBLE_MS);

    return () => clearTimeout(autoDismissTimer);
  }, [
    privateMatchSuggestion,
    isOpeningContextualOpportunity,
    isSendingPrivateMatchRequest,
    handleDismissPrivateMatchSuggestion,
  ]);

  const handleSendPrivateMatchGreeting = useCallback(async (greetingText) => {
    const activeSuggestion = privateMatchSuggestionRef.current;
    const targetPartner = activeSuggestion?.partner;
    const suggestionSource = activeSuggestion?.source || 'idle_match_suggestion';
    const targetUserId = targetPartner?.userId || targetPartner?.id;
    if (!targetUserId || !user?.id) return;
    if (targetUserId === user.id) return;

    if (!auth.currentUser) {
      setShowRegistrationModal(true);
      setRegistrationModalFeature('chat privado');
      return;
    }

    try {
      setIsSendingPrivateMatchRequest(true);
      const blocked = await isBlockedBetween(user.id, targetUserId);
      if (blocked) {
        toast({
          title: 'No disponible',
          description: 'No puedes iniciar un chat privado con este usuario.',
          variant: 'destructive',
        });
        return;
      }

      await sendPrivateChatRequest(user.id, targetUserId, {
        source: suggestionSource,
        systemPrompt: activeSuggestion?.systemText || 'Chactivo los conectó porque ambos están en línea ahora.',
        suggestedStarter: greetingText,
        expiresAtMs: Date.now() + PRIVATE_MATCH_REQUEST_WINDOW_MS,
      });

      setPrivateMatchSuggestion(null);
      bumpPrivateSuggestionScore(targetUserId, 4, 'success');
      setPrivateChatRequest({
        from: user,
        to: {
          ...targetPartner,
          id: targetUserId,
          userId: targetUserId,
        },
        source: suggestionSource,
        suggestedStarter: greetingText,
      });
      privateMatchCooldownByTargetRef.current.set(
        targetUserId,
        Date.now() + PRIVATE_MATCH_COOLDOWN_MS
      );
      lastInteractionAtRef.current = Date.now();

      if (suggestionSource === 'loading_rescue') {
        track('private_rescue_module_click', {
          roomId: currentRoom,
          candidateUserId: targetUserId,
        }, { user }).catch(() => {});
      } else if (suggestionSource === 'no_response_nudge' || suggestionSource === 'frustration_nudge') {
        track('private_nudge_click_after_no_response', {
          roomId: currentRoom,
          candidateUserId: targetUserId,
          source: suggestionSource,
        }, { user }).catch(() => {});
      }

      toast({
        title: 'Solicitud enviada',
        description: `Invitaste a ${targetPartner.username || 'este usuario'} con “${greetingText}”.`,
      });
    } catch (error) {
      console.error('Error sending private match request:', error);
      toast({
        title: error?.message === 'BLOCKED' ? 'No disponible' : 'No pudimos enviar la invitación',
        description: error?.message === 'BLOCKED'
          ? 'No puedes iniciar un chat privado con este usuario.'
          : 'Intenta de nuevo en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingPrivateMatchRequest(false);
    }
  }, [bumpPrivateSuggestionScore, currentRoom, user, setShowRegistrationModal, setRegistrationModalFeature]);

  const openOrCreatePrivateChatWithTarget = useCallback(async (targetUser, options = {}) => {
    const targetUserId = targetUser?.userId || targetUser?.id || null;
    const hasRealAuthenticatedUid = Boolean(
      auth.currentUser?.uid &&
      user?.id &&
      auth.currentUser.uid === user.id &&
      !String(user.id).startsWith('temp_')
    );

    if (!auth.currentUser || !user?.id) {
      setPendingPrivateTarget(targetUser || null);
      setPendingPrivateOptions(options || null);
      openNicknameModal('private_chat_request');
      return { ok: false, reason: 'guest_setup_required' };
    }

    if (!hasRealAuthenticatedUid) {
      setPendingPrivateTarget(targetUser || null);
      setPendingPrivateOptions(options || null);
      toast({
        title: 'Preparando modo invitado',
        description: 'Espera un momento mientras terminamos de conectar tu sesión.',
      });
      return { ok: false, reason: 'auth_sync_pending' };
    }

    if (!targetUserId || targetUserId === user.id) {
      return { ok: false, reason: 'invalid_target' };
    }

    const optimisticChatId = [user.id, targetUserId].sort().join('_');
    const optimisticPayload = {
      user,
      partner: {
        ...targetUser,
        id: targetUserId,
        userId: targetUserId,
      },
      roomId: options.roomId ?? currentRoom,
      chatId: optimisticChatId,
      initialMessage: options.initialMessage || '',
      isPending: true,
    };

    const opened = openPrivateChatWindow(optimisticPayload);

    if (!opened) {
      return { ok: false, reason: 'limit_reached' };
    }

    try {
      const blocked = await isBlockedBetween(user.id, targetUserId);
      if (blocked) {
        discardPrivateChat(optimisticChatId);
        toast({
          title: 'No disponible',
          description: 'No puedes iniciar un chat privado con este usuario.',
          variant: 'destructive',
        });
        return { ok: false, reason: 'blocked' };
      }

      const { chatId, created } = await getOrCreatePrivateChat(user.id, targetUserId);

      if (chatId !== optimisticChatId) {
        discardPrivateChat(optimisticChatId);
      }

      openPrivateChatWindow({
        ...optimisticPayload,
        chatId,
        isPending: false,
      });
      bumpPrivateSuggestionScore(targetUserId, 4, 'opened');

      void signalPrivateChatOpen({
        chatId,
        fromUserId: user.id,
        toUserId: targetUserId,
        created: Boolean(created),
      }).catch((error) => {
        console.info('[PRIVATE_CHAT_SYNC] No se pudo emitir señal remota de apertura', {
          chatId,
          targetUserId,
          message: error?.message || String(error),
        });
      });

      return { ok: true, chatId, targetUserId };
    } catch (error) {
      discardPrivateChat(optimisticChatId);
      throw error;
    }
  }, [
    bumpPrivateSuggestionScore,
    currentRoom,
    discardPrivateChat,
    openNicknameModal,
    openPrivateChatWindow,
    user,
  ]);

  const beginContextualOpportunityOpen = useCallback(() => {
    isOpeningContextualOpportunityRef.current = true;
    setIsOpeningContextualOpportunity(true);
  }, []);

  const finishContextualOpportunityOpen = useCallback(() => {
    isOpeningContextualOpportunityRef.current = false;
    setIsOpeningContextualOpportunity(false);
  }, []);

  const handleOpenCompatibleNowCandidate = useCallback((candidate) => {
    if (!candidate) return;
    const targetUserId = candidate.userId || candidate.id || null;
    if (!targetUserId) return;

    beginContextualOpportunityOpen();

    track('match_click', {
      roomId: currentRoom,
      source: 'contextual_match_sidebar',
      target_user_id: targetUserId,
      target_role: candidate.roleBadge || null,
      has_opin_intent: Boolean(candidate.opinIntent),
    }, { user }).catch(() => {});

    Promise.resolve()
      .then(() => openOrCreatePrivateChatWithTarget(candidate, {
        initialMessage: getIntentDrivenGreeting({
          username: candidate.username,
          seekingBucket: getRoleBucket(currentUserResolvedRole),
          offeredRole: candidate.roleBadge,
        }),
        roomId: currentRoom,
        source: 'contextual_match_sidebar',
      }))
      .then((result) => {
        if (result?.ok) {
          bumpPrivateSuggestionScore(targetUserId, 3, 'opened');
          setPrivateMatchSuggestion(null);
          track('match_private_chat_started', {
            roomId: currentRoom,
            source: 'contextual_match_sidebar',
            target_user_id: targetUserId,
          }, { user }).catch(() => {});
          return;
        }

        if (result?.reason === 'invalid_target') {
          toast({
            title: 'Ya no está disponible',
            description: 'Este usuario ya no se puede abrir en privado ahora mismo.',
            variant: 'destructive',
          });
        }
      })
      .catch((error) => {
        console.error('Error opening compatible-now private chat:', error);
        toast({
          title: 'No pudimos abrir el privado',
          description: 'Intenta de nuevo en unos segundos.',
          variant: 'destructive',
        });
      })
      .finally(() => {
        finishContextualOpportunityOpen();
      });
  }, [
    beginContextualOpportunityOpen,
    bumpPrivateSuggestionScore,
    currentRoom,
    currentUserResolvedRole,
    finishContextualOpportunityOpen,
    openOrCreatePrivateChatWithTarget,
    user,
  ]);

  const contextualSuggestionMeta = useMemo(
    () => getContextualSuggestionMeta(privateMatchSuggestion?.source),
    [privateMatchSuggestion?.source]
  );

  const contextualOpportunityItems = useMemo(() => {
    if (isHeteroRoom || !privateMatchSuggestion?.partner) return [];

    const primarySuggestionUserId = privateMatchSuggestion.partner.userId || privateMatchSuggestion.partner.id;
    const candidatesById = new Map(
      (privateMatchCandidates || []).map((candidate) => [candidate.userId || candidate.id, candidate])
    );
    const nextItems = [];
    const seen = new Set();

    const pushCandidate = (rawCandidate, { primary = false } = {}) => {
      const candidateId = rawCandidate?.userId || rawCandidate?.id;
      if (!candidateId || seen.has(candidateId)) return;

      const mergedCandidate = {
        ...(candidatesById.get(candidateId) || {}),
        ...rawCandidate,
      };

      seen.add(candidateId);
      const candidateWithExplanation = {
        ...mergedCandidate,
        isPrimary: primary,
        opportunityText: truncateOpportunityText(
          mergedCandidate?.opportunityText
          || mergedCandidate?.opinIntent?.text
          || mergedCandidate?.intentSummary
          || [mergedCandidate?.roleBadge, mergedCandidate?.comuna].filter(Boolean).join(' · ')
          || 'Disponible ahora'
        ),
        activityText: mergedCandidate?.availableForChat
          ? 'Activo ahora'
          : formatRelativePulse(mergedCandidate?.lastActivityMs, activityNow),
        opportunityMeta: mergedCandidate?.opinIntent
          ? `OPIN ${getOpinStatusMeta(mergedCandidate.opinIntent.status).shortLabel}`
          : mergedCandidate?.opportunityMeta,
      };
      const matchReasons = (Array.isArray(mergedCandidate?.matchReasons) && mergedCandidate.matchReasons.length > 0)
        ? mergedCandidate.matchReasons
        : buildPrivateMatchReasons({
          candidate: candidateWithExplanation,
          nowMs: activityNow,
        });

      nextItems.push({
        ...candidateWithExplanation,
        matchReasons,
        matchHeadline: mergedCandidate?.matchHeadline || buildPrivateMatchHeadline(matchReasons),
      });
    };

    pushCandidate(privateMatchSuggestion.partner, { primary: true });
    compatibleNowStripUsers.forEach((candidate) => pushCandidate(candidate));
    (privateMatchCandidates || []).forEach((candidate) => pushCandidate(candidate));

    return nextItems
      .filter((candidate) => {
        const candidateId = candidate?.userId || candidate?.id;
        if (!candidateId) return false;
        if (candidateId === primarySuggestionUserId) return true;
        return !candidate?.isGuest && !candidate?.isAnonymous;
      })
      .slice(0, PRIVATE_MATCH_TOP_LIMIT);
  }, [
    activityNow,
    compatibleNowStripUsers,
    isHeteroRoom,
    privateMatchCandidates,
    privateMatchSuggestion,
  ]);

  const contextualChatHighlight = useMemo(() => {
    if (isHeteroRoom || currentRoom !== 'principal' || contextualOpportunityItems.length === 0) return null;

    const primaryCandidate = contextualOpportunityItems[0] || null;
    const count = contextualOpportunityItems.length;
    const title = count > 1
      ? `${count} personas buscan algo compatible contigo ahora`
      : `${primaryCandidate?.username || 'Alguien'} está disponible y calza contigo ahora`;

    return {
      candidate: primaryCandidate,
      title,
      subtitle: primaryCandidate?.opportunityText || 'Evita el hola al azar y entra directo con contexto.',
      ctaLabel: count > 1 ? 'Ver oportunidad' : 'Hablar ahora',
    };
  }, [contextualOpportunityItems, currentRoom, isHeteroRoom]);

  useEffect(() => {
    if (!user?.id || isHeteroRoom || currentRoom !== 'principal' || contextualOpportunityItems.length === 0) return;

    const viewKey = contextualOpportunityItems
      .map((item) => item?.userId || item?.id || '')
      .filter(Boolean)
      .join('|');

    if (!viewKey || trackedContextualViewKeysRef.current.has(viewKey)) return;

    trackedContextualViewKeysRef.current.add(viewKey);
    if (trackedContextualViewKeysRef.current.size > 80) {
      trackedContextualViewKeysRef.current = new Set(
        Array.from(trackedContextualViewKeysRef.current).slice(-40)
      );
    }

    track('match_sidebar_view', {
      roomId: currentRoom,
      source: privateMatchSuggestion?.source || 'contextual_match_sidebar',
      items_count: contextualOpportunityItems.length,
      candidate_ids: contextualOpportunityItems
        .map((item) => item?.userId || item?.id || null)
        .filter(Boolean),
    }, { user }).catch(() => {});
  }, [
    contextualOpportunityItems,
    currentRoom,
    isHeteroRoom,
    privateMatchSuggestion?.source,
    user,
  ]);

  useEffect(() => {
    if (!user?.id || !pendingPrivateTarget) return;
    if (!authReady || auth.currentUser?.uid !== user.id || String(user.id).startsWith('temp_')) return;

    const targetToOpen = pendingPrivateTarget;
    const optionsToUse = pendingPrivateOptions || {};
    setPendingPrivateTarget(null);
    setPendingPrivateOptions(null);

    Promise.resolve().then(() => openOrCreatePrivateChatWithTarget(targetToOpen, optionsToUse)).catch((error) => {
      console.error('Error opening pending private chat after guest setup:', error);
      toast({
        title: 'No pudimos abrir el chat privado',
        description: 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    });
  }, [authReady, openOrCreatePrivateChatWithTarget, pendingPrivateOptions, pendingPrivateTarget, user?.id]);

  useEffect(() => {
    if (!user?.id || !pendingPrivateInboxReturnSignal?.targetUserId) return;
    const signalKey = pendingPrivateInboxReturnSignal.key;
    if (!signalKey || privateInboxReturnToastKeysRef.current.has(signalKey)) return;

    privateInboxReturnToastKeysRef.current.add(signalKey);
    if (privateInboxReturnToastKeysRef.current.size > 120) {
      privateInboxReturnToastKeysRef.current = new Set(
        Array.from(privateInboxReturnToastKeysRef.current).slice(-60)
      );
    }

    toast({
      title: `${pendingPrivateInboxReturnSignal.username} volvió a conectarse`,
      description: 'Tu último mensaje privado sigue pendiente en su inbox. Si quieres, retoma la conversación ahora.',
      duration: 4200,
      action: {
        label: 'Abrir privado',
        onClick: () => {
          Promise.resolve()
            .then(() => openOrCreatePrivateChatWithTarget({
              userId: pendingPrivateInboxReturnSignal.targetUserId,
              id: pendingPrivateInboxReturnSignal.targetUserId,
              username: pendingPrivateInboxReturnSignal.username,
              avatar: pendingPrivateInboxReturnSignal.avatar,
              roleBadge: pendingPrivateInboxReturnSignal.roleBadge,
              comuna: pendingPrivateInboxReturnSignal.comuna,
            }, {
              roomId: currentRoom,
              source: 'pending_inbox_return',
            }))
            .catch((error) => {
              console.error('Error reopening pending private inbox chat:', error);
            });
        },
      },
    });
  }, [
    currentRoom,
    openOrCreatePrivateChatWithTarget,
    pendingPrivateInboxReturnSignal,
    user?.id,
  ]);

  useEffect(() => {
    if (!user?.id || currentRoom !== 'principal' || isHeteroRoom) return;
    const signal = intentDrivenPrivateMatchSignal?.partner
      ? intentDrivenPrivateMatchSignal
      : offlineIntentDrivenPrivateMatchSignal;
    if (!signal?.partner) return;
    if (privateChatRequestRef.current || privateMatchSuggestionRef.current) return;
    if (isSendingPrivateMatchRequestRef.current || isOpeningContextualOpportunityRef.current) return;
    if ((openPrivateChatsRef.current || []).length > 0) return;

    const targetPartner = signal.partner;
    const targetUserId = targetPartner?.userId || targetPartner?.id || null;
    if (!targetUserId || targetUserId === user.id) return;
    if (Array.isArray(activePrivatePartnerIds) && activePrivatePartnerIds.includes(targetUserId)) return;

    const now = Date.now();
    const targetSuggestionState = mergePrivateSuggestionEntries(
      targetPartner?.suggestionState,
      privateSuggestionScoreMapRef.current.get(targetUserId),
      privateMatchStateByTarget.get(targetUserId)
    );
    const blockedUntil = privateMatchCooldownByTargetRef.current.get(targetUserId) || 0;
    if (blockedUntil > now) return;
    if (blockedUntil > 0 && blockedUntil <= now) {
      privateMatchCooldownByTargetRef.current.delete(targetUserId);
    }

    if (intentMatchShownKeysRef.current.has(signal.key)) return;
    if (targetSuggestionState?.suggestedDayKey === getPrivateMatchDayKey(now)) return;

    intentMatchShownKeysRef.current.add(signal.key);
    if (intentMatchShownKeysRef.current.size > 250) {
      intentMatchShownKeysRef.current = new Set(Array.from(intentMatchShownKeysRef.current).slice(-120));
    }

    privateMatchLastShownAtRef.current = now;
    bumpPrivateSuggestionScore(targetUserId, 1, 'shown');
    privateMatchCooldownByTargetRef.current.set(
      targetUserId,
      now + PRIVATE_MATCH_COOLDOWN_MS
    );

    const copy = getIntentMatchCopy({
      username: targetPartner?.username,
      offeredRole: signal.offeredRole,
      seekingBucket: signal.seekingBucket,
      isOnline: signal.isOnline !== false,
    });

    const greetingText = getIntentDrivenGreeting({
      username: targetPartner?.username,
      seekingBucket: signal.seekingBucket,
      offeredRole: signal.offeredRole,
    });

    toast({
      title: copy.title,
      description: copy.description,
      duration: 3400,
      action: {
        label: signal.isOnline === false ? 'Dejar mensaje' : 'Abrir privado',
        onClick: () => {
          lastInteractionAtRef.current = Date.now();
          Promise.resolve()
            .then(() => openOrCreatePrivateChatWithTarget(targetPartner, {
              initialMessage: greetingText,
              roomId: currentRoom,
              source: 'intent_match_toast',
            }))
            .then((result) => {
              if (result?.ok) {
                bumpPrivateSuggestionScore(targetUserId, 3, 'opened');
                if (signal.isOnline === false) {
                  toast({
                    title: 'Privado listo para dejar mensaje',
                    description: 'Escríbele ahora. Quedará en su inbox y lo verá cuando vuelva a conectarse.',
                    duration: 3600,
                  });
                }
              }
            })
            .catch((error) => {
              console.error('Error opening intent-driven private chat:', error);
              toast({
                title: 'No pudimos abrir el privado',
                description: 'Intenta de nuevo en unos segundos.',
                variant: 'destructive',
              });
            });
        },
      },
    });
  }, [
    activePrivatePartnerIds,
    currentRoom,
    offlineIntentDrivenPrivateMatchSignal,
    intentDrivenPrivateMatchSignal,
    isHeteroRoom,
    privateMatchStateByTarget,
    openOrCreatePrivateChatWithTarget,
    bumpPrivateSuggestionScore,
    user?.id,
  ]);

  const handlePrivateChatRequest = async (targetUser, options = {}) => {
    activatePrivateSurfaces();
    if (targetUser.userId === 'demo-user-123') {
      openPrivateChatWindow({ user, partner: targetUser, roomId: currentRoom });
      return { ok: true, reason: 'demo' };
    }

    try {
      const opened = await openOrCreatePrivateChatWithTarget(targetUser);
      if (!opened?.ok) return opened;
      if (!options?.silentSuccess) {
        toast({
          title: 'Chat privado abierto',
          description: `Ya puedes conversar con ${targetUser.username || 'este usuario'}.`,
        });
      }
      return opened;
    } catch (error) {
      console.error('Error opening private chat:', error);
      toast({
        title: error?.message === 'BLOCKED' ? 'No disponible' : 'No pudimos abrir el chat privado',
        description: error?.message === 'BLOCKED'
          ? 'No puedes iniciar un chat privado con este usuario.'
          : 'Intenta de nuevo en un momento',
        variant: 'destructive',
      });
      return { ok: false, reason: error?.message || 'unknown_error' };
    }
  };

  const handleStartAvailableConversation = useCallback(async (targetUser) => {
    if (!targetUser?.userId) return;
    activatePrivateSurfaces();

    try {
      const validation = await validateUserAvailabilityInRoom(currentRoom || roomId, targetUser.userId);
      if (!validation.valid) {
        toast({
          title: 'Ya no está disponible',
          description: 'Este usuario ya no figura disponible para conversar.',
          variant: 'destructive',
        });
        return;
      }

      const opened = await openOrCreatePrivateChatWithTarget(targetUser, {
        initialMessage: 'Hola, vi que estás disponible para conversar 🙋',
      });
      if (!opened?.ok) return;
      toast({
        title: 'Chat privado abierto',
        description: `Ya puedes conversar con ${targetUser.username || 'este usuario'}.`,
      });
    } catch (error) {
      console.error('Error iniciando conversación desde disponibilidad:', error);
      toast({
        title: error?.message === 'BLOCKED' ? 'No disponible' : 'No pudimos enviar la invitación',
        description: error?.message === 'BLOCKED'
          ? 'No puedes iniciar un chat privado con este usuario.'
          : 'Intenta de nuevo en unos segundos.',
        variant: 'destructive',
      });
    }
  }, [activatePrivateSurfaces, currentRoom, openOrCreatePrivateChatWithTarget, roomId]);

  /**
   * Respuesta a solicitud de chat privado
   */
  const handlePrivateChatResponse = async (accepted, notificationId = null, requestOverride = null) => {
    const requestToHandle = requestOverride || privateChatRequest;
    if (!requestToHandle) return;
    const currentUserId = user?.id || user?.uid || null;
    if (!currentUserId) return;

    if (requestToHandle?.type === 'private_group_invite_request' && notificationId) {
      try {
        const result = await respondToPrivateGroupInvite(currentUserId, notificationId, accepted);

        if (!accepted) {
          toast({
            title: 'Invitación rechazada',
            description: 'No se sumará ningún participante nuevo a este chat.',
            variant: 'destructive',
          });
        } else if (result?.chatId) {
          const opened = openGroupPrivateChatWindow({
            chatId: result.chatId,
            title: result.title || 'Chat grupal privado',
            participantProfiles: result.participantProfiles || requestToHandle.participantProfiles || [],
            roomId: currentRoom,
          });

          if (opened) {
            toast({
              title: 'Chat grupal listo',
              description: 'La nueva conversación privada ya está disponible.',
            });
          }
        } else if (result?.waiting) {
          toast({
            title: 'Aprobación registrada',
            description: 'Falta que las otras personas acepten para abrir el chat grupal.',
          });
        }
      } catch (error) {
        console.error('Error responding to private group invite:', error);
        toast({
          title: error?.message === 'REQUEST_EXPIRED'
            ? 'Invitación expirada'
            : error?.message === 'REQUEST_REJECTED'
              ? 'Invitación cancelada'
              : 'No pudimos procesar tu respuesta',
          description: error?.message === 'REQUEST_EXPIRED'
            ? 'La invitación ya no está disponible.'
            : error?.message === 'REQUEST_REJECTED'
              ? 'Otra persona rechazó esta invitación.'
              : 'Intenta de nuevo en un momento.',
          variant: 'destructive',
        });
      }

      setPrivateChatRequest(null);
      return;
    }

    const receiverId = requestToHandle?.to?.id || requestToHandle?.to?.userId || null;
    const isReceiver = currentUserId === receiverId;
    const partner = notificationId
      ? requestToHandle.from
      : (isReceiver ? requestToHandle.from : requestToHandle.to);
    const partnerName = partner?.username || 'Usuario';
    const requiresAvailabilityValidation = requestToHandle?.source === 'availability_signal';

    const ensurePartnerStillAvailable = async () => {
      if (!accepted || !requiresAvailabilityValidation) return true;
      const partnerId = partner?.userId || partner?.id;
      if (!partnerId) return false;

      const validation = await validateUserAvailabilityInRoom(currentRoom || roomId, partnerId);
      if (validation.valid) return true;

      toast({
        title: 'Ya no está disponible',
        description: 'La otra persona ya no figura disponible en la sala en este momento.',
        variant: 'destructive',
      });
      return false;
    };

    // Si existe notificationId, responder SIEMPRE vía notificación para evitar rutas ambiguas
    if (notificationId) {
      let optimisticChatId = null;
      let openedOptimistically = false;
      const acceptStartedAt = Date.now();
      try {
        if (!(await ensurePartnerStillAvailable())) {
          setPrivateChatRequest(null);
          return;
        }

        const partnerId = partner?.userId || partner?.id || null;
        if (accepted) {
          setPrivateChatRequest(null);
        }
        if (accepted && partnerId) {
          optimisticChatId = [currentUserId, partnerId].sort().join('_');
          openedOptimistically = openPrivateChatWindow({
            user: user,
            partner: partner,
            chatId: optimisticChatId,
            roomId: currentRoom
          });
          console.info('[PRIVATE_CHAT_ACCEPT] Apertura optimista lanzada', {
            notificationId,
            optimisticChatId,
            openedOptimistically,
            elapsedMs: Date.now() - acceptStartedAt,
          });
        }

        const result = await respondToPrivateChatRequest(currentUserId, notificationId, accepted);
        
        if (accepted && result?.chatId) {
          if (optimisticChatId && result.chatId !== optimisticChatId) {
            closePrivateChat(optimisticChatId);
          }
          const opened = openPrivateChatWindow({
            user: user,
            partner: partner,
            chatId: result.chatId,
            roomId: currentRoom
          });
          if (opened) {
            toast({
              title: "¡Chat privado aceptado!",
              description: `Ahora estás en un chat privado con ${partnerName}.`,
            });
          }
          console.info('[PRIVATE_CHAT_ACCEPT] Chat confirmado', {
            notificationId,
            chatId: result.chatId,
            elapsedMs: Date.now() - acceptStartedAt,
          });
        } else if (!accepted) {
          setPrivateChatRequest(null);
          toast({
            title: "Solicitud rechazada",
            description: `Has rechazado la invitación de ${partnerName}.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error responding to private chat request:', error);
        if (accepted && openedOptimistically && optimisticChatId) {
          closePrivateChat(optimisticChatId);
        }
        if (accepted) {
          setPrivateChatRequest(requestToHandle);
        }
        const permissionDenied = error?.code === 'permission-denied' || String(error?.message || '').includes('insufficient permissions');
        toast({
          title: error?.message === 'BLOCKED'
              ? "No disponible"
              : permissionDenied
                ? "No pudimos abrir el privado"
              : "No pudimos procesar tu respuesta",
          description: error?.message === 'BLOCKED'
              ? "No puedes abrir un chat privado con este usuario."
              : permissionDenied
                ? "Tu sesión no pudo validar este chat privado. Intenta otra vez en unos segundos."
              : "Intenta de nuevo en un momento",
          variant: "destructive",
        });
        console.info('[PRIVATE_CHAT_ACCEPT] Falló la apertura', {
          notificationId,
          optimisticChatId,
          elapsedMs: Date.now() - acceptStartedAt,
          message: error?.message || String(error),
        });
      }
      return;
    } else {
      // Para el emisor o cuando no hay notificationId (compatibilidad)
      if (accepted) {
        try {
          if (!(await ensurePartnerStillAvailable())) {
            setPrivateChatRequest(null);
            return;
          }

          const partnerId = partner?.userId || partner?.id;
          if (!partnerId) throw new Error('MISSING_PARTNER');

          const { chatId } = await getOrCreatePrivateChat(currentUserId, partnerId);
          const opened = openPrivateChatWindow({
            user: user,
            partner: partner,
            chatId,
            roomId: currentRoom
          });
          if (opened) {
            toast({
              title: "¡Chat privado aceptado!",
              description: `Ahora estás en un chat privado con ${partnerName}.`,
            });
          }
        } catch (error) {
          console.error('Error abriendo chat privado existente:', error);
          toast({
            title: "No pudimos abrir el chat",
            description: "Intenta de nuevo en un momento",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Solicitud rechazada",
          description: `Has rechazado la invitación de ${partnerName}.`,
          variant: "destructive"
        });
      }
    }
    
    setPrivateChatRequest(null);
  };

  /**
   * Abrir chat privado desde notificaciones
   */
  const handleOpenPrivateChatFromNotification = useCallback(({ chatId, partner }) => {
    const currentUser = userRef.current;
    const roomId = currentRoomRef.current || null;
    if (!currentUser?.id) return;
    openPrivateChatWindow({
      chatId,
      user: currentUser,
      partner: partner,
      roomId
    });
  }, [openPrivateChatWindow]);

  // ========================================
  // 💬 DETECTAR RESPUESTAS: Verificar si hay respuestas cuando el usuario está scrolleado arriba
  // ========================================
  useEffect(() => {
    if (!user || !user.id || messages.length === 0) return;

    // Buscar mensajes que responden a mensajes del usuario
    const userMessages = messages.filter(m => m.userId === user.id);
    const userMessageIds = new Set(userMessages.map(m => m.id));
    
    const repliesToUser = messages.filter(m => 
      m.replyTo && 
      m.replyTo.messageId && 
      userMessageIds.has(m.replyTo.messageId) &&
      m.userId !== user.id // No contar respuestas propias
    );

    // Filtrar solo respuestas que están después del último mensaje leído
    let unreadReplies = repliesToUser;
    if (lastReadMessageIdRef.current) {
      const lastReadIndex = messages.findIndex(m => m.id === lastReadMessageIdRef.current);
      if (lastReadIndex >= 0) {
        unreadReplies = repliesToUser.filter((reply) => {
          const replyIndex = messages.findIndex(m => m.id === reply.id);
          return replyIndex > lastReadIndex;
        });
      }
    }

    if (scrollManager.scrollState === 'AUTO_FOLLOW') {
      // Usuario está en el bottom - ocultar indicador y actualizar último mensaje leído
      setUnreadRepliesCount(0);
      if (messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
      }
    } else if (unreadReplies.length > 0) {
      // Usuario está scrolleado arriba y hay respuestas no leídas
      setUnreadRepliesCount(unreadReplies.length);
    } else {
      // No hay respuestas no leídas
      setUnreadRepliesCount(0);
    }
  }, [messages, user, scrollManager.scrollState]);

  useEffect(() => {
    if (!user?.id || !Array.isArray(messages) || messages.length === 0) return;
    if (scrollManager.scrollState !== 'AUTO_FOLLOW') return;

    const userMessageIds = new Set(
      messages
        .filter((message) => message.userId === user.id)
        .map((message) => message.id)
        .filter(Boolean)
    );

    if (userMessageIds.size === 0) return;

    const latestReply = [...messages].reverse().find((message) => (
      message?.replyTo?.messageId &&
      userMessageIds.has(message.replyTo.messageId) &&
      message.userId !== user.id
    ));

    if (!latestReply?.id) return;
    if (latestReplyToastIdRef.current === latestReply.id) return;

    const latestReplyTimestamp = latestReply.timestampMs ||
      (latestReply.timestamp?.toMillis?.() ||
        (typeof latestReply.timestamp === 'number'
          ? latestReply.timestamp
          : (latestReply.timestamp ? new Date(latestReply.timestamp).getTime() : null)));

    if (!latestReplyTimestamp || (Date.now() - latestReplyTimestamp) > 20000) {
      latestReplyToastIdRef.current = latestReply.id;
      return;
    }

    latestReplyToastIdRef.current = latestReply.id;
    toast({
      title: `${latestReply.username || 'Alguien'} te respondió`,
      description: String(latestReply.content || 'Ya llegó una respuesta a tu mensaje.').slice(0, 120),
      duration: 3000,
    });
  }, [messages, user?.id, scrollManager.scrollState]);

  // ========================================
  // 🔒 LANDING PAGE: Guard clause para user === null
  // ========================================
  // ✅ CRITICAL: Este return DEBE estar DESPUÉS de TODOS los hooks
  // ⚡ FIX: Solo mostrar landing si auth terminó de cargar Y no hay usuario
  // Si está cargando, esperar (evita mostrar landing durante carga inicial)
  // Si hay usuario (guest o registrado), mostrar chat directamente
  
  // ⚡ AUTO-LOGIN GUEST: Si accede directamente a /chat/principal sin sesión, crear sesión guest automáticamente
  useEffect(() => {
    // Prevenir múltiples intentos de auto-login
    // ✅ NO auto-crear guest con nombre aleatorio - el usuario DEBE elegir su nickname en el modal
    // Si !user, se muestra GuestUsernameModal para que ingresen su nombre
  }, [authLoading, user, roomId]);

  // 📜 DETECCIÓN DE SCROLL: Toast para usuarios no logueados
  // Si un usuario no logueado llega al tope (50 mensajes), mostrar toast
  // ✅ CRITICAL: Este hook DEBE estar ANTES de cualquier return condicional
  // ✅ FIX: Asegurar que siempre se ejecute (no condicionalmente) para respetar reglas de hooks
  useEffect(() => {
    // Guard interno: solo ejecutar lógica si hay user y es guest/anonymous
    if (!user || (!user.isGuest && !user.isAnonymous)) {
      return;
    }

    // Guard interno: solo ejecutar si scrollManager está disponible
    if (!scrollManager?.containerRef?.current) return;
    
    const container = scrollManager.containerRef.current;

    let hasShownToast = false; // Flag para mostrar toast solo una vez por sesión

    const handleScroll = () => {
      // Si ya mostró el toast, no volver a mostrar
      if (hasShownToast) return;

      // Verificar que tiene exactamente 50 mensajes (límite para no autenticados)
      if (messages.length !== 50) return;

      // Si está en el tope (scrollTop === 0 o muy cerca, primeros 50px)
      const scrollTop = container.scrollTop;
      const isAtTop = scrollTop <= 50;

      // Si alcanzó el límite de 50 mensajes y está en el tope
      if (isAtTop && messages.length === 50) {
        hasShownToast = true;
        toast({
          title: "Estás viendo los últimos 50 mensajes",
          description: "Regístrate para ver el doble de historial",
          duration: 4000, // 4 segundos
        });
      }
    };

    container.addEventListener('scroll', handleScroll);

    // También verificar al montar si ya está en el tope
    setTimeout(() => {
      if (!hasShownToast && messages.length === 50) {
        const scrollTop = container.scrollTop;
        if (scrollTop <= 50) {
          handleScroll();
        }
      }
    }, 1000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [user, messages.length, scrollManager]);

  // Mostrar loading mientras auth carga (máximo 3 segundos)
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // 🚀 EXPERIMENTO: NO mostrar landing - Directo al chat
  // Si no hay usuario, mostramos el chat igual pero con funcionalidad limitada
  // El modal de nickname aparece cuando intenten escribir
  // if (!user) {
  //   return <ChatLandingPage roomSlug={roomId} />;
  // }

  // 🔒 FASE 1: RESTRICCIÓN - Invitados solo pueden acceder a salas públicas habilitadas
  if (user && (user.isGuest || user.isAnonymous)) {
    const isEventRoom = roomId?.startsWith('evento_');
    const guestAllowedRooms = ['principal', 'hetero-general'];
    if (!guestAllowedRooms.includes(roomId) && !isEventRoom) {
      // Invitado intenta acceder a otra sala → Redirigir a principal
      console.log(`[ChatPage] ⚠️ Invitado intentando acceder a /chat/${roomId} → Redirigiendo a /chat/principal`);
      navigate('/chat/principal', { replace: true });
      return (
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="text-muted-foreground">Redirigiendo a la sala principal...</p>
          </div>
        </div>
      );
    }
  }

  const activeTopBanner = showCercaniaBanner
    ? 'cercania'
    : showPushBanner
      ? 'push'
      : showHeteroRoomIntroBanner
        ? 'hetero_intro'
        : null;

  return (
    <>
      {/* ✅ Layout Chat: Sidebar + Chat + Usuarios en línea (desktop) */}
      <div className="h-screen overflow-hidden bg-background lg:flex" style={{ height: '100dvh', maxHeight: '100dvh' }}>
        <ChatSidebar
          currentRoom={currentRoom}
          setCurrentRoom={setCurrentRoom}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenBaul={handleOpenBaul}
          onOpenOpin={handleOpenOpin}
          privateInboxItems={privateInboxItems}
          unreadPrivateMessages={unreadPrivateMessages}
          currentRoomUserCount={roomUsers.length}
          roomUsers={roomUsers}
          fallbackUsers={recentPresenceFallbackUsers}
          onUserClick={(targetUser) => setUserActionsTarget(targetUser)}
          onRequestNickname={() => openNicknameModal('chat_sidebar')}
          onOpenPrivates={activatePrivateSurfaces}
        />

        {/* ✅ FIX: Contenedor del chat - Asegurar que esté visible en móvil cuando sidebar está cerrado */}
        {/* En móvil: ancho completo (100vw), pb-16 para barra inferior; en desktop: flex-1 */}
        <div className="w-full lg:flex-1 flex flex-col overflow-hidden min-w-0 h-full pb-16 lg:pb-0">
          <ChatHeader
            currentRoom={currentRoom}
            onMenuClick={handleOpenSidebarFromMenu}
            showMenuBadge={showMobileSidebarBadge}
            onOpenPrivateChat={handleOpenPrivateChatFromNotification}
            onRandomConnect={handleToggleRandomConnect}
            isRandomConnectActive={isRandomConnectActive}
            onSimulate={() => setShowScreenSaver(true)}
            activityText={activityText}
            activityTickerItems={headerTickerItems}
          />

          <section className="border-b border-[var(--chat-divider)] bg-[var(--chat-header-surface)]/70 px-3 py-2 backdrop-blur-[14px]">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {activityPulseBadges.map((badge) => {
                const toneClass = badge.tone === 'cyan'
                  ? 'border-[#1473E6]/12 bg-[#1473E6]/8 text-[#0F67D8] dark:text-[#B8D4FF]'
                  : badge.tone === 'emerald'
                    ? 'border-emerald-500/14 bg-emerald-500/8 text-emerald-700 dark:text-emerald-200'
                    : badge.tone === 'amber'
                      ? 'border-amber-500/14 bg-amber-500/8 text-amber-700 dark:text-amber-200'
                      : badge.tone === 'violet'
                        ? 'border-violet-500/14 bg-violet-500/8 text-violet-700 dark:text-violet-200'
                        : 'border-[var(--chat-divider)] bg-[var(--chat-surface-feed)]/64 text-muted-foreground';

                return (
                  <div
                    key={badge.id}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.01em] ${toneClass}`}
                  >
                    {badge.label}
                  </div>
                );
              })}
            </div>
          </section>

          {!isHeteroRoom && inPrivateUsersPreview.length > 0 && (
            <>
              <div className="border-b border-border/30 bg-secondary/5 px-3 py-2">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className={[
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                      showInPrivateUsersStrip || isInPrivateUsersStripPinned
                        ? 'border-amber-400/40 bg-amber-500/12 text-amber-200'
                        : 'border-fuchsia-500/22 bg-background/60 text-fuchsia-200 hover:border-fuchsia-400/40 hover:bg-background/80',
                    ].join(' ')}
                    onClick={() => {
                      const nextPinned = !isInPrivateUsersStripPinned;
                      setIsInPrivateUsersStripPinned(nextPinned);
                      setShowInPrivateUsersStrip(nextPinned ? true : false);
                    }}
                    aria-label="Mostrar conversaciones privadas activas"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{inPrivateUsersCount}</span>
                    <span className="hidden sm:inline">
                      {isInPrivateUsersStripPinned ? 'Ocultar conecta' : 'Conecta activo'}
                    </span>
                  </button>
                </div>
              </div>

              {showInPrivateUsersStrip && (
                <section className="border-b border-border/40 bg-secondary/5 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                        En privado ahora
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Se muestra unos segundos y puedes desplegarlo cuando quieras.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                        {inPrivateUsersCount}
                      </div>
                      {!isInPrivateUsersStripPinned && (
                        <button
                          type="button"
                          className="rounded-full px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-background/50 hover:text-foreground"
                          onClick={() => setShowInPrivateUsersStrip(false)}
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                    {inPrivateUsersPreview.map((item) => (
                      <button
                        key={item.userId}
                        type="button"
                        className="shrink-0 rounded-2xl border border-amber-500/18 bg-background/60 px-3 py-2 text-left transition-colors hover:border-amber-400/40 hover:bg-background/80"
                        onClick={() => setUserActionsTarget(item)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10">
                            <img
                              src={item.avatar}
                              alt={item.username}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[120px] truncate text-sm font-semibold text-foreground">
                              {item.username}
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                              {item.roleBadge ? (
                                <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
                                  {item.roleBadge}
                                </span>
                              ) : null}
                              <span className="rounded-full border border-fuchsia-500/25 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-200">
                                En privado
                              </span>
                            </div>
                            {item.comuna ? (
                              <p className="mt-1 max-w-[140px] truncate text-[10px] text-muted-foreground">
                                {item.comuna}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTopBanner === 'push' && (
            <div className="hidden md:flex px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 items-center justify-between gap-3">
              <p className="text-sm text-purple-300">Activa notificaciones para mensajes, eventos y recordatorios de hora pico</p>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleEnablePush}
                  className="px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                >
                  Activar
                </button>
                <button
                  onClick={() => {
                    setShowPushBanner(false);
                    localStorage.setItem(pushBannerDismissKey, Date.now().toString());
                  }}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}

          {activeTopBanner === 'cercania' && currentRoom === 'hetero-general' && (
            <section className="border-b border-border/50 bg-secondary/10 px-4 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {currentUserComuna ? (
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                        {nearbySignals.sameComunaCount > 0
                          ? `Cerca de ti: ${nearbySignals.sameComunaCount}`
                          : `Tu comuna: ${currentUserComuna}`}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                        Falta tu comuna
                      </span>
                    )}

                    {nearbySignals.sameComunaCount > 0 && currentUserComuna ? (
                      <span className="rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                        {currentUserComuna}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-sm text-foreground">
                    {currentUserComuna && nearbySignals.sameComunaCount > 0
                      ? `Hay movimiento por ${currentUserComuna}. Si conectas con alguien, usa el privado interno.`
                      : 'Configura tu comuna y el sistema ordena mejor la cercania.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismissCercaniaBanner}
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-muted-foreground transition hover:bg-background/50 hover:text-foreground"
                  aria-label="Cerrar aviso de cercania"
                >
                  Cerrar
                </button>
              </div>
            </section>
          )}

          {activeTopBanner === 'hetero_intro' && currentRoom === 'hetero-general' && (
            <section className="border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cyan-200">
                    Sala activa en vivo: escribe y conversa sin salir de Chactivo.
                  </p>
                  <p className="mt-1 text-xs text-cyan-100/80">
                    {Math.max(0, activeUsersCount)} conectados ahora · {Math.max(0, recentMessagesCount20m)} mensajes recientes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHeteroRoomIntroBanner(false)}
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-cyan-100/70 transition hover:bg-white/10 hover:text-cyan-100"
                  aria-label="Cerrar aviso de sala"
                >
                  Cerrar
                </button>
              </div>
            </section>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {currentRoom === 'principal' && !isHeteroRoom && (
              <ChatPrimaryResolutionPanel
                roomId={currentRoom || roomId}
                roomUsers={roomUsers}
                user={user}
                currentUserComuna={currentUserComuna}
                nearbySignals={nearbySignals}
                opportunityItems={contextualOpportunityItems}
                onBeforeOpenOpportunity={beginContextualOpportunityOpen}
                onOpenOpportunity={handleOpenCompatibleNowCandidate}
                onRequestNickname={() => openNicknameModal('chat_primary_resolution_panel')}
                onRequestComuna={() => setShowProfileComunaPrompt(true)}
                onPrefillMessage={handleSuggestedReply}
                isOpeningOpportunity={isSendingPrivateMatchRequest || isOpeningContextualOpportunity}
              />
            )}

            {/* ⏳ Siempre renderizar ChatMessages; él decide si mostrar loading o contenido */}
            <ChatMessages
              messages={visibleMessages}
              isLoadingMessages={isLoadingMessages}
              messagesLoadingStage={messagesLoadingStage}
              currentUserId={user?.id || null}
              currentUserSeekingBadgeMeta={currentUserSeekingBadgeMeta}
              currentUserSeekingBadgeOptions={CHAT_SEEKING_BADGE_OPTIONS}
              onUpdateCurrentUserSeekingBadge={handleUpdateCurrentUserSeekingBadge}
              isSavingCurrentUserSeekingBadge={isSavingCurrentUserSeekingBadge}
              onUserClick={setUserActionsTarget}
              onReport={setReportTarget}
              onPrivateChat={handlePrivateChatRequest}
              onReaction={handleMessageReaction}
              onDeleteMessage={handleDeleteOwnMessage}
              canModerateMessages={isCurrentUserAdmin}
              onReply={handleReply}
              lastReadMessageIndex={-1}
              messagesEndRef={scrollManager.endMarkerRef}
              messagesContainerRef={scrollManager.containerRef}
              onScroll={handleMessagesScroll}
              roomUsers={roomUsers}
              dailyTopic={dailyTopic}
              hideRoleBadges={isHeteroRoom}
              contextualHighlight={contextualChatHighlight}
              onOpenContextualHighlight={handleOpenCompatibleNowCandidate}
              onSuggestReply={handleSuggestedReply}
              newMessagesIndicator={
                <NewMessagesIndicator
                  count={scrollManager.unreadCount}
                  onClick={scrollManager.scrollToBottom}
                  show={scrollManager.scrollState !== 'AUTO_FOLLOW' && scrollManager.unreadCount > 0}
                />
              }
            />
          </div>

          <TypingIndicator typingUsers={[]} />

          {/* 💬 Indicador de respuestas - pequeño círculo con número */}
          <ReplyIndicator
            show={unreadRepliesCount > 0 && scrollManager.scrollState !== 'AUTO_FOLLOW'}
            onClick={() => {
              scrollManager.scrollToBottom();
              setUnreadRepliesCount(0);
            }}
            count={unreadRepliesCount}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            onFocus={() => {
              markChatInteraction();
              setIsInputFocused(true);
            }}
            onBlur={() => {
              markChatInteraction();
              setIsInputFocused(false);
            }}
            externalMessage={suggestedMessage}
            roomId={roomId}
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
            onRequestNickname={() => openNicknameModal('chat_input')}
            isGuest={!user || needsNickname}
            showOnboardingHints={!needsNickname && !isHeteroRoom}
            isHeteroContext={isHeteroRoom}
            photoUsageStats={photoUsageStats}
            currentUserComuna={currentUserComuna}
            preventiveOpportunity={!isHeteroRoom ? (contextualOpportunityItems[0] || null) : null}
            onOpenPreventiveOpportunity={handleOpenCompatibleNowCandidate}
          />
        </div>

        <ChatOnlineUsersColumn
          roomUsers={roomUsers}
          fallbackUsers={recentPresenceFallbackUsers}
          roomId={currentRoom || 'principal'}
          currentUserId={user?.id || null}
          currentUser={user}
          privateInboxItems={privateInboxItems}
          unreadPrivateMessages={unreadPrivateMessages}
          onUserClick={(targetUser) => setUserActionsTarget(targetUser)}
          onStartConversation={handleStartAvailableConversation}
          onRequestNickname={() => openNicknameModal('online_users_column')}
          hideRoleBadges={isHeteroRoom}
          contextualOpportunities={!isHeteroRoom ? contextualOpportunityItems : []}
          contextualTitle={contextualSuggestionMeta.title}
          contextualSubtitle={contextualSuggestionMeta.subtitle}
          contextualBadgeLabel={contextualSuggestionMeta.badgeLabel}
          onBeforeOpenContextualOpportunity={beginContextualOpportunityOpen}
          onOpenContextualOpportunity={handleOpenCompatibleNowCandidate}
          onDismissContextualOpportunities={handleDismissPrivateMatchSuggestion}
          isContextualSending={isSendingPrivateMatchRequest || isOpeningContextualOpportunity}
        />

        <FeaturedChannelsColumn
          showDesktop={false}
          showMobileLauncher={false}
          mobilePanelOpen={isFeaturedChannelsMobileOpen}
          onMobilePanelOpenChange={setIsFeaturedChannelsMobileOpen}
        />

        {/* ⚠️ MODERADOR COMPLETAMENTE ELIMINADO (06/01/2026) - A petición del usuario */}
        {/* 👮 Banner de reglas del moderador (NO bloqueante) - ELIMINADO */}
        {/* El componente RulesBanner y todo el sistema de moderador ha sido eliminado */}
        {/* {moderatorMessage && (
          <RulesBanner
            message={moderatorMessage}
            onDismiss={() => setModeratorMessage(null)}
            roomId={currentRoom}
            userId={user?.id}
          />
        )} */}


        {userActionsTarget && (
          <UserActionsModal
            user={{
              ...userActionsTarget,
              // Buscar información completa del usuario en roomUsers para verificar si es anónimo
              isAnonymous: roomUsers.find(u => (u.userId || u.id) === userActionsTarget.userId)?.isAnonymous || false,
              isGuest: roomUsers.find(u => (u.userId || u.id) === userActionsTarget.userId)?.isGuest || false,
            }}
            onClose={() => setUserActionsTarget(null)}
            onViewProfile={() => setSelectedUser(userActionsTarget)}
            onShowRegistrationModal={(feature, targetUserForPrivate = null) => {
              if (feature === 'chat privado' && !user?.id) {
                setPendingPrivateTarget(targetUserForPrivate || userActionsTarget || null);
                setPendingPrivateOptions(null);
                openNicknameModal('private_chat_request');
                return;
              }
              setRegistrationModalFeature(feature);
              setShowRegistrationModal(true);
            }}
            onAdminQuickSanction={handleAdminQuickSanction}
            onAdminDeleteUserMessages={handleAdminDeleteUserMessages}
            onAdminDeleteRoomMessages={handleAdminDeleteRoomMessages}
          />
        )}

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onReport={() => {
              setReportTarget({ type: 'user', ...selectedUser });
              setSelectedUser(null);
            }}
            onSelectUser={(favoriteUser) => {
              // Abrir modal de acciones para el favorito seleccionado
              setSelectedUserForActions(favoriteUser);
              setSelectedUser(null);
            }}
          />
        )}

        {reportTarget && (
          <ReportModal
            target={reportTarget}
            onClose={() => setReportTarget(null)}
            isGuest={user.isGuest}
          />
        )}

        {privateChatRequest && (() => {
          const receiverId = privateChatRequest?.to?.id || privateChatRequest?.to?.userId || null;
          const senderId = privateChatRequest?.from?.id || privateChatRequest?.from?.userId || null;
          const isReceiver = user.id === receiverId;
          const isSender = user.id === senderId;

          // ✅ Si es el receptor, mostrar toast discreto arriba
          if (isReceiver) {
            return (
              <PrivateChatInviteToast
                request={privateChatRequest}
                onAccept={() => handlePrivateChatResponse(true, privateChatRequest.notificationId, privateChatRequest)}
                onDecline={() => handlePrivateChatResponse(false, privateChatRequest.notificationId, privateChatRequest)}
                onClose={(meta) => closePrivateRequestSurface(privateChatRequest, meta)}
              />
            );
          }

          // ✅ Si es el emisor, mostrar modal tradicional (Solicitud Enviada)
          if (isSender) {
            return (
              <PrivateChatRequestModal
                request={privateChatRequest}
                currentUser={user}
                onResponse={handlePrivateChatResponse}
                onClose={() => closePrivateRequestSurface(privateChatRequest, { reason: 'dismiss' })}
              />
            );
          }

          return null;
        })()}

        {privateDirectMessageToast ? (
          <PrivateChatDirectMessageToast
            message={privateDirectMessageToast}
            onOpen={() => {
              openPrivateChatWindow({
                user,
                partner: {
                  userId: privateDirectMessageToast.from,
                  username: privateDirectMessageToast.fromUsername || 'Usuario',
                  avatar: privateDirectMessageToast.fromAvatar || '',
                  isPremium: privateDirectMessageToast.fromIsPremium,
                },
                chatId: privateDirectMessageToast.chatId,
                roomId: currentRoomRef.current || null,
              });
            }}
            onClose={closePrivateDirectToast}
          />
        ) : null}

        {/* 🔥 DESHABILITADO: Modal de tiempo eliminado para invitados */}
        {/* {showVerificationModal && (
          <VerificationModal
            onClose={() => setShowVerificationModal(false)}
            engagementTime={engagementTime}
          />
        )} */}

        {/* Chat privado renderizado globalmente para persistir entre secciones */}

        {/* 🔔 Popup de recordatorio de evento deshabilitado.
            Si vuelve más adelante, mejor llevarlo a campana/notificaciones y no a popup. */}

        {/* ⚠️ MODAL COMENTADO - No está en uso hasta que se repare */}
        {/* 🎁 Modal de Bienvenida Premium */}
        {/* <PremiumWelcomeModal
          open={showPremiumWelcome}
          onClose={handleClosePremiumWelcome}
        /> */}

        {/* 🏆 Modal de Felicitaciones PRO */}
        <ProCongratsModal
          isOpen={showProCongrats}
          onClose={() => setShowProCongrats(false)}
          username={user?.username || 'Usuario'}
        />

        <AgeVerificationModal
          isOpen={showAgeVerification}
          onClose={() => setShowAgeVerification(false)}
          onConfirm={async (age, username, avatar, keepSession = false) => {
            if (!user || !user.id) return;
            
            try {
              // Actualizar usuario anónimo con nombre y avatar
              if (user.isAnonymous) {
                const updated = await updateAnonymousUserProfile(username, avatar.url);
                if (!updated) {
                  toast({
                    title: "Error",
                    description: "No se pudo actualizar el perfil. Intenta nuevamente.",
                    variant: "destructive",
                  });
                  return;
                }
              }

              // Guardar edad en localStorage (múltiples claves para persistencia)
              const ageKey = `age_verified_${user.id}`;
              localStorage.setItem(ageKey, String(age));
              localStorage.setItem(`rules_accepted_${user.id}`, 'true');
              
              // ⚡ PERSISTENCIA: Guardar también por username para restaurar si cambia el UID
              if (user.isGuest || user.isAnonymous) {
                const usernameAgeKey = `age_verified_${username.toLowerCase().trim()}`;
                localStorage.setItem(usernameAgeKey, String(age));
                localStorage.setItem(`rules_accepted_${username.toLowerCase().trim()}`, 'true');
                
                // ✅ GUARDAR SESIÓN si el usuario marcó "Mantener sesión"
                if (keepSession) {
                  localStorage.setItem('guest_session_saved', JSON.stringify({
                    username: username,
                    avatar: avatar.url,
                    uid: user.id,
                    timestamp: Date.now(),
                  }));
                } else {
                  // Si no marca mantener sesión, eliminar cualquier sesión guardada anterior
                  localStorage.removeItem('guest_session_saved');
                }
                
                // Actualizar datos guardados del guest
                const guestDataKey = `guest_data_${username.toLowerCase().trim()}`;
                const savedData = localStorage.getItem(guestDataKey);
                if (savedData) {
                  try {
                    const saved = JSON.parse(savedData);
                    saved.age = age;
                    saved.lastUsed = Date.now();
                    if (keepSession) {
                      saved.keepSession = true;
                    }
                    localStorage.setItem(guestDataKey, JSON.stringify(saved));
                  } catch (e) {
                    console.debug('[AGE VERIFICATION] Error actualizando datos guardados:', e);
                  }
                }
              }
              
              // Limpiar flag de sesión para que no se vuelva a mostrar
              const hasShownKey = `age_modal_shown_${user.id}`;
              sessionStorage.removeItem(hasShownKey);
              
              setIsAgeVerified(true);
              setShowAgeVerification(false);
              
              console.log(`[AGE VERIFICATION] ✅ Usuario ${user.id} confirmó edad: ${age} años, nombre: ${username} - NO se mostrará más`);
              
              toast({
                title: "✅ Perfil completado",
                description: `Bienvenido ${username}! Recuerda seguir las reglas del chat.`,
              });
            } catch (error) {
              console.error('Error updating anonymous user:', error);
              toast({
                title: "Error",
                description: "No se pudo guardar el perfil. Intenta nuevamente.",
                variant: "destructive",
              });
            }
          }}
        />

        {/* ⚠️ MODAL COMENTADO - El bot moderador ya informa las reglas al ingresar */}
      </div>

      {/* Protector de pantalla - Se muestra sobre todo */}
      {showScreenSaver && (
        <ScreenSaver onClose={() => setShowScreenSaver(false)} />
      )}

      <Dialog
        open={showProfileComunaPrompt}
        onOpenChange={(open) => {
          if (open) {
            setShowProfileComunaPrompt(true);
            return;
          }
          handleDismissProfileComunaPrompt();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configura tu zona</DialogTitle>
            <DialogDescription>
              Si guardas tu comuna o ciudad, el chat puede destacar gente cercana y ordenar mejor las coincidencias.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <select
              value={profileComunaValue}
              onChange={(event) => setProfileComunaValue(event.target.value)}
              className="flex h-11 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecciona tu comuna o ciudad</option>
              {COMUNA_OPTIONS.map((comunaOption) => (
                <option key={comunaOption} value={comunaOption}>
                  {comunaOption}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveProfileComuna}
                disabled={isSavingProfileComuna}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfileComuna ? 'Guardando...' : 'Guardar zona'}
              </button>
              <button
                type="button"
                onClick={handleDismissProfileComunaPrompt}
                disabled={isSavingProfileComuna}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Más tarde
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de registro requerido */}
      <RegistrationRequiredModal
        open={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        featureName={registrationModalFeature}
      />

      {/* ✅ Modal de nickname para invitados: aparece SOLO al intentar escribir */}
      <GuestUsernameModal
        open={showNicknameModal}
        onClose={closeNicknameModal}
        chatRoomId={currentRoom || roomId || 'principal'}
        openSource={nicknameModalSource}
        onGuestReady={() => {
          closeNicknameModal();
          setNeedsNickname(false);
        }}
      />

      {/* 📋 BAÚL DE TARJETAS - Accesible desde banner promocional */}
      {/* 📱 Barra inferior móvil: Baúl, OPIN, Canales, Chat */}
      <ChatBottomNav
        onOpenBaul={handleOpenBaul}
        onOpenOpin={handleOpenOpin}
        onOpenFeaturedChannels={() => setIsFeaturedChannelsMobileOpen(true)}
        pendingPrivateRequests={pendingPrivateRequests}
        unreadPrivateMessages={unreadPrivateMessages}
        privateInboxItems={privateInboxItems}
        privateSuggestedUsers={mergedPrivateSuggestionCandidates}
        currentUserResolvedRole={currentUserResolvedRole}
        currentUserComuna={currentUserComuna}
        onStartPrivateChat={handlePrivateChatRequest}
        onAcceptPrivateRequest={(request) => handlePrivateChatResponse(true, request?.notificationId, request)}
        onDeclinePrivateRequest={(request) => handlePrivateChatResponse(false, request?.notificationId, request)}
        onOpenPrivates={activatePrivateSurfaces}
      />
    </>
  );
};

export default ChatPage;
