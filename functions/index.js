/**
 * Cloud Functions para Chactivo - Push Notifications
 *
 * 4 funciones:
 * 1. notifyOnNewMessage - Push cuando llega DM
 * 2. notifyOnMatch - Push cuando hay match en Baul
 * 3. notifyOnPrivateChatRequest - Push cuando piden chat privado
 * 4. notifyOnOpinReply - Push cuando responden un OPIN
 *
 * Limites: max 1-2 push por dia por usuario. Quiet hours 00:00-08:00.
 */

const { onDocumentCreated, onDocumentWritten, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const db = getFirestore();
const storage = getStorage();

const ROOM_RETENTION_MAX_MESSAGES = 205;
const ROOM_RETENTION_QUERY_LIMIT = ROOM_RETENTION_MAX_MESSAGES + 1; // 206 when max=205
const ROOM_RETENTION_DELETE_BATCH = 50;
const ROOM_RETENTION_LOCK_TTL_MS = 15 * 1000;
const PHOTO_UPLOADS_PER_HOUR_LIMIT = 3;
const PHOTO_VISIBLE_WINDOW_MESSAGES = 100;
const PHOTO_VISIBLE_WINDOW_USER_IMAGE_LIMIT = 3;
const PHOTO_UPLOAD_HOURLY_WINDOW_MS = 60 * 60 * 1000;
const PHOTO_PRIVILEGE_SCOPE = "principal";
const PHOTO_PRIVILEGE_STREAK_DAYS_REQUIRED = 2;
const PHOTO_PRIVILEGE_INACTIVITY_MS = 24 * 60 * 60 * 1000;
const PHOTO_PRIVILEGE_REVOKE_BATCH_SIZE = 200;
const CHILE_TIME_ZONE = "America/Santiago";
const PUSH_RATE_LIMITS = {
  realtime: 40,
  social: 10,
  event: 3,
  engagement: 1,
  default: 6,
};
const ENGAGEMENT_REMINDER_SLOTS = [13, 21]; // 13:00 y 21:00 hora Chile
const ENGAGEMENT_INACTIVITY_MS = 90 * 60 * 1000;
const ENGAGEMENT_REMINDER_BATCH = 150;
const EVENT_REMINDER_LOOKAHEAD_MS = 10 * 60 * 1000; // 10 min antes
const EVENT_REMINDER_START_WINDOW_MS = 5 * 60 * 1000; // 5 min post inicio
const EVENT_REMINDER_EVENT_LIMIT = 40;
const EVENT_REMINDER_USER_LIMIT = 300;
const ADMIN_ROOM_HISTORY_RETENTION_DAYS = 7;
const ADMIN_ROOM_HISTORY_DOWNLOAD_TTL_MS = 60 * 60 * 1000;
const PUBLIC_USER_PROFILES_COLLECTION = "public_user_profiles";
const PUBLIC_USER_PROFILE_PREVIEW_FAVORITES_LIMIT = 8;
const PRIVATE_GROUP_INVITES_COLLECTION = "private_chat_group_invites";
const DISCOVERABLE_USER_LOCATIONS_COLLECTION = "discoverable_user_locations";
const DISCOVERABLE_LOCATION_DECIMALS = 2;
const NOTIFICATION_ACTION_LOGS_COLLECTION = "notification_action_logs";
const NOTIFICATION_ACTION_LOG_LIMIT = 40;
const TARJETA_MAX_LIKES_DE = 100;
const TARJETA_MAX_VISITAS_DE = 50;
const TARJETA_MAX_IMPRESIONES_DE = 200;
const TARJETA_MAX_HUELLAS_DE = 200;
const TARJETA_HUELLAS_MAX_POR_DIA = 15;
const MODERATION_ALERT_ALLOWED_TYPES = new Set([
  "minor_risk",
  "minor_ambiguous",
  "drug_meetup",
  "drugs",
  "violence",
  "hate_speech",
  "external_contact",
  "coercion",
  "high_risk_ai",
]);
const MODERATION_ALERT_ALLOWED_SEVERITIES = new Set(["low", "medium", "high", "critical"]);
const CRITICAL_CHAT_SAFETY_SUSPEND_MINUTES = {
  minor_risk: 72 * 60,
  drugs: 24 * 60,
  drug_meetup: 24 * 60,
  coercion: 24 * 60,
};
const CRITICAL_CHAT_SAFETY_PATTERNS = {
  minor: [
    /\bsoy\s+menor(?:es)?\b/i,
    /\bmenor\s+de\s+edad\b/i,
    /\bbusco\s+menores\b/i,
    /\bde\s+menores\b/i,
    /\bvideos?\s+de\s+menores\b/i,
    /\b31\s+al\s+rev(?:e|é)s\b/i,
    /\b31\s+alrevez\b/i,
    /\bcasi\s+18\b/i,
    /\b18\s+casi\b/i,
    /\b-8\s*a(?:n|ñ)os?\b/i,
    /\bcp\b/i,
    /\bcsam\b/i,
  ],
  drugs: [
    /\bdroga(?:s)?\b/i,
    /\bfalopa\b/i,
    /\bfalopita\b/i,
    /\btusi\b/i,
    /\bcoca[ií]na\b/i,
    /\bperico\b/i,
    /\bketamina\b/i,
    /\bketa\b/i,
    /\bpoppers?\b/i,
    /\bsaque(?:sito)?\b/i,
    /\bmdma\b/i,
    /\bmolly\b/i,
    /\bpasta\s+base\b/i,
    /\bcristal\b/i,
  ],
  coercion: [
    /\bte\s+obligo\b/i,
    /\bobligarte\b/i,
    /\bforzarte\b/i,
    /\bforzar\b/i,
    /\bdrogarte\b/i,
    /\bte\s+drogo\b/i,
    /\bextors/i,
  ],
};
const CONTEXTUAL_ANTI_EVASION_QUERY_LIMIT = 12;
const CONTEXTUAL_ANTI_EVASION_WINDOW = 6;
const CONTEXTUAL_ANTI_EVASION_LOOKBACK_MS = 3 * 60 * 1000;
const CONTEXTUAL_CONTACT_HINTS = [
  "escr",
  "escrib",
  "escribeme",
  "habla",
  "hablame",
  "busca",
  "buscame",
  "agrega",
  "agregame",
  "contacta",
  "contactame",
  "numero",
  "num",
  "wsp",
  "wasap",
  "whatsapp",
  "telegram",
  "tg",
  "insta",
  "instagram",
  "ig",
  "discord",
  "signal",
  "sms",
  "otraapp",
  "otraaplicacion",
];
const CONTEXTUAL_WEAK_CONTACT_HINTS = ["tele", "afuera", "fuera"];
const CONTEXTUAL_MINOR_HINTS = [
  "tengo",
  "soy",
  "edad",
  "cumplo",
  "cumpli",
  "menor",
  "menordeedad",
  "colegio",
  "liceo",
  "secundaria",
  "media",
  "prepa",
];
const CONTEXTUAL_PLATFORM_TERMS = [
  "telegram",
  "tg",
  "whatsapp",
  "wsp",
  "instagram",
  "ig",
  "discord",
  "signal",
  "sms",
  "mensaje de texto",
  "mensajes de texto",
  "otra app",
  "otra aplicacion",
  "fuera de chactivo",
];
const CONTEXTUAL_BENIGN_NUMERIC_CONTEXT_REGEX =
  /\b(?:cm|kg|kilos?|metros?|m|hrs?|horas?|hora|min|mins|minutos?|anos?|años?|edad|x|por\s+ciento|%|capitulo|episodio)\b/i;

const chileDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHILE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const chileClockFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CHILE_TIME_ZONE,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
});

function getChileDayString(date = new Date()) {
  const parts = chileDayFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function getChileClockParts(date = new Date()) {
  const parts = chileClockFormatter.formatToParts(date);
  const hourRaw = parts.find((part) => part.type === "hour")?.value || "00";
  const minuteRaw = parts.find((part) => part.type === "minute")?.value || "00";
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);

  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function parseDayStringToUtc(dayString) {
  if (typeof dayString !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dayString)) {
    return null;
  }
  const parsed = new Date(`${dayString}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayDiff(previousDayString, currentDayString) {
  const previous = parseDayStringToUtc(previousDayString);
  const current = parseDayStringToUtc(currentDayString);
  if (!previous || !current) return null;
  return Math.floor((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));
}

function isAdminRoleValue(role = "") {
  return role === "admin" || role === "administrator" || role === "superadmin";
}

function isAdminOrSupportRoleValue(role = "") {
  return isAdminRoleValue(role) || role === "support";
}

function toMillisSafe(value) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePublicString(value, maxLength = 200) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function normalizePublicStringArray(values = [], maxItems = 8, maxLength = 40) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalizePublicString(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeFavoritePreviewIds(values = []) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, PUBLIC_USER_PROFILE_PREVIEW_FAVORITES_LIMIT);
}

function roundDiscoverableCoordinate(value, decimals = DISCOVERABLE_LOCATION_DECIMALS) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const factor = 10 ** decimals;
  return Math.round(numeric * factor) / factor;
}

function normalizePublicRole(userData = {}) {
  const profileRole = normalizePublicString(userData.profileRole, 40);
  if (profileRole) return profileRole;

  const rawRole = String(userData.role || "").trim();
  if (!rawRole || ["admin", "administrator", "superadmin", "support", "user"].includes(rawRole.toLowerCase())) {
    return null;
  }

  return normalizePublicString(rawRole, 40) || null;
}

function buildPublicUserProfile(userId, userData = {}) {
  const interests = normalizePublicStringArray(userData.interests, 5, 32);
  const createdAtMs = toMillisSafe(userData.createdAt);
  const updatedAtMs = toMillisSafe(userData.updatedAt);
  const ageNumber = Number.parseInt(String(userData.age ?? ""), 10);
  const profileViews = Number.parseInt(String(userData.profileViews ?? "0"), 10);
  const publicRole = normalizePublicRole(userData);

  return {
    id: userId,
    userId,
    username: normalizePublicString(userData.username, 30) || "Usuario",
    avatar: normalizePublicString(userData.avatar, 500) || "",
    description: normalizePublicString(userData.description, 500) || null,
    estado: normalizePublicString(userData.estado, 100) || null,
    profileRole: publicRole,
    role: publicRole,
    interests,
    comuna: normalizePublicString(userData.comuna, 80) || null,
    age: Number.isFinite(ageNumber) ? ageNumber : null,
    verified: Boolean(userData.verified),
    isPremium: Boolean(userData.isPremium),
    isProUser: Boolean(userData.isProUser),
    canUploadSecondPhoto: Boolean(userData.canUploadSecondPhoto),
    hasFeaturedCard: Boolean(userData.hasFeaturedCard),
    hasRainbowBorder: Boolean(userData.hasRainbowBorder),
    hasProBadge: Boolean(userData.hasProBadge),
    profileVisible: userData.profileVisible !== false,
    favoritesCount: Array.isArray(userData.favorites) ? userData.favorites.length : 0,
    profileViews: Number.isFinite(profileViews) ? profileViews : 0,
    createdAtMs,
    updatedAtMs,
    syncSource: "users_mirror_v2",
    syncedAt: FieldValue.serverTimestamp(),
  };
}

function buildDiscoverableUserLocation(userId, userData = {}) {
  const locationEnabled = userData.locationEnabled === true;
  const latitude = roundDiscoverableCoordinate(userData?.location?.latitude);
  const longitude = roundDiscoverableCoordinate(userData?.location?.longitude);
  if (!locationEnabled || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const publicRole = normalizePublicRole(userData);

  return {
    id: userId,
    userId,
    username: normalizePublicString(userData.username, 30) || "Usuario",
    age: Number.isFinite(Number(userData.age)) ? Number(userData.age) : null,
    bio: normalizePublicString(userData.bio || userData.description, 280) || null,
    role: publicRole,
    isOnline: Boolean(userData.isOnline),
    locationEnabled: true,
    location: {
      latitude,
      longitude,
    },
    precisionKmApprox: 1.1,
    syncedAt: FieldValue.serverTimestamp(),
  };
}

function buildPublicMirrorRelevantSnapshot(userData = {}) {
  const ageNumber = Number.parseInt(String(userData.age ?? ""), 10);
  const profileViews = Number.parseInt(String(userData.profileViews ?? "0"), 10);
  const latitude = roundDiscoverableCoordinate(userData?.location?.latitude);
  const longitude = roundDiscoverableCoordinate(userData?.location?.longitude);
  const hasValidLocation = Number.isFinite(latitude) && Number.isFinite(longitude);

  return {
    username: normalizePublicString(userData.username, 30) || "Usuario",
    avatar: normalizePublicString(userData.avatar, 500) || "",
    description: normalizePublicString(userData.description, 500) || null,
    estado: normalizePublicString(userData.estado, 100) || null,
    bio: normalizePublicString(userData.bio || userData.description, 280) || null,
    profileRole: normalizePublicRole(userData),
    interests: normalizePublicStringArray(userData.interests, 5, 32),
    comuna: normalizePublicString(userData.comuna, 80) || null,
    age: Number.isFinite(ageNumber) ? ageNumber : null,
    verified: Boolean(userData.verified),
    isPremium: Boolean(userData.isPremium),
    isProUser: Boolean(userData.isProUser),
    canUploadSecondPhoto: Boolean(userData.canUploadSecondPhoto),
    hasFeaturedCard: Boolean(userData.hasFeaturedCard),
    hasRainbowBorder: Boolean(userData.hasRainbowBorder),
    hasProBadge: Boolean(userData.hasProBadge),
    profileVisible: userData.profileVisible !== false,
    favoritesCount: Array.isArray(userData.favorites) ? userData.favorites.length : 0,
    profileViews: Number.isFinite(profileViews) ? profileViews : 0,
    locationEnabled: userData.locationEnabled === true,
    isOnline: Boolean(userData.isOnline),
    location: hasValidLocation
      ? {
          latitude,
          longitude,
        }
      : null,
  };
}

function hasRelevantPublicMirrorChange(previousData = null, nextData = null) {
  if (!previousData && !nextData) return false;
  if (!previousData || !nextData) return true;
  return JSON.stringify(buildPublicMirrorRelevantSnapshot(previousData)) !==
    JSON.stringify(buildPublicMirrorRelevantSnapshot(nextData));
}

async function isBlockedBetweenUsers(userAId, userBId) {
  if (!userAId || !userBId || userAId === userBId) return false;
  const [blockAB, blockBA] = await Promise.all([
    db.collection("blocks").doc(userAId).collection("blockedUsers").doc(userBId).get().catch(() => null),
    db.collection("blocks").doc(userBId).collection("blockedUsers").doc(userAId).get().catch(() => null),
  ]);
  return Boolean(blockAB?.exists || blockBA?.exists);
}

async function assertAdminCallableRequest(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const userDoc = await db.collection("users").doc(request.auth.uid).get();
  const role = String(userDoc.data()?.role || "");
  if (!isAdminRoleValue(role)) {
    throw new HttpsError("permission-denied", "Solo admins pueden acceder a informes.");
  }

  return {
    uid: request.auth.uid,
    role,
  };
}

function isAnonymousAuthRequest(request) {
  return request.auth?.token?.firebase?.sign_in_provider === "anonymous";
}

async function assertRegisteredCallableRequest(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesion.");
  }

  if (isAnonymousAuthRequest(request)) {
    throw new HttpsError("permission-denied", "Debes tener una cuenta registrada para esta accion.");
  }

  return {
    uid: request.auth.uid,
  };
}

function sanitizeAnalyticsSegment(value = "unknown") {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 80);
}

function sanitizeAnalyticsEventType(eventType = "") {
  return String(eventType || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 60);
}

function getAnalyticsTimeBucket(seconds) {
  const numeric = Number(seconds);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  if (numeric < 3) return "0-3s";
  if (numeric < 10) return "3-10s";
  if (numeric < 30) return "10-30s";
  if (numeric < 60) return "30-60s";
  if (numeric < 180) return "1-3m";
  if (numeric < 300) return "3-5m";
  return "5m+";
}

function buildTarjetaArrayWithCap(values = [], nextValue, maxItems = 100) {
  const next = Array.isArray(values) ? [...values] : [];
  if (!next.includes(nextValue)) {
    next.push(nextValue);
  }
  return next.slice(-maxItems);
}

function buildTarjetaArrayWithoutValue(values = [], removedValue) {
  return (Array.isArray(values) ? values : []).filter((value) => String(value || "") !== String(removedValue || ""));
}

async function getTarjetaIdentity(userId) {
  const safeUserId = String(userId || "").trim();
  if (!safeUserId) {
    return {
      exists: false,
      userId: "",
      username: "Usuario",
      nombre: "Usuario",
      avatar: "",
    };
  }

  const [userSnap, cardSnap] = await Promise.all([
    db.collection("users").doc(safeUserId).get().catch(() => null),
    db.collection("tarjetas").doc(safeUserId).get().catch(() => null),
  ]);

  const userData = userSnap?.exists ? userSnap.data() || {} : {};
  const cardData = cardSnap?.exists ? cardSnap.data() || {} : {};
  const username =
    normalizeNotificationString(userData.username || cardData.odIdUsuariNombre || cardData.nombre || "Usuario", 80) || "Usuario";
  const nombre =
    normalizeNotificationString(cardData.nombre || userData.username || cardData.odIdUsuariNombre || "Usuario", 80) || "Usuario";
  const avatar =
    normalizeNotificationString(userData.avatar || cardData.fotoUrl || cardData.fotoUrlThumb || "", 500) || "";

  return {
    exists: Boolean(cardSnap?.exists),
    userId: safeUserId,
    username,
    nombre,
    avatar,
  };
}

async function getUserDataById(userId) {
  if (!userId) return {};
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists ? (userDoc.data() || {}) : {};
}

async function assertAdminOrSupportActor(actorUid) {
  const actorData = await getUserDataById(actorUid);
  const role = String(actorData.role || "");
  if (!isAdminOrSupportRoleValue(role)) {
    throw new HttpsError("permission-denied", "Solo admin o support pueden hacer esto.");
  }
  return actorData;
}

function normalizeNotificationString(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.slice(0, maxLength);
}

function normalizeNotificationBoolean(value) {
  return value === true;
}

function normalizeModerationAlertType(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 40);

  return MODERATION_ALERT_ALLOWED_TYPES.has(normalized) ? normalized : null;
}

function normalizeModerationAlertSeverity(value = "medium") {
  const normalized = String(value || "medium").toLowerCase().trim();
  return MODERATION_ALERT_ALLOWED_SEVERITIES.has(normalized) ? normalized : "medium";
}

function getNotificationActionLogsRef(actorUid) {
  return db
    .collection("users")
    .doc(actorUid)
    .collection(NOTIFICATION_ACTION_LOGS_COLLECTION);
}

async function assertNotificationTargetUserExists(targetUserId) {
  const safeTargetUserId = String(targetUserId || "").trim();
  if (!safeTargetUserId) {
    throw new HttpsError("invalid-argument", "toUserId no es valido.");
  }

  const targetSnap = await db.collection("users").doc(safeTargetUserId).get();
  if (!targetSnap.exists) {
    throw new HttpsError("not-found", "Usuario destinatario no encontrado.");
  }

  return targetSnap.data() || {};
}

async function enforceNotificationActionRateLimit(
  actorUid,
  action,
  {
    targetUserId = null,
    windowMs = 60 * 60 * 1000,
    maxCount = 10,
    targetCooldownMs = 0,
  } = {}
) {
  const logsSnap = await getNotificationActionLogsRef(actorUid)
    .orderBy("createdAt", "desc")
    .limit(NOTIFICATION_ACTION_LOG_LIMIT)
    .get()
    .catch(() => null);

  if (!logsSnap) return;

  const now = Date.now();
  let actionCount = 0;

  for (const logDoc of logsSnap.docs) {
    const logData = logDoc.data() || {};
    if (String(logData.action || "") !== action) continue;

    const createdAtMs = toMillisSafe(logData.createdAt) || Number(logData.createdAtMs || 0);
    if (!createdAtMs) continue;

    if (now - createdAtMs <= windowMs) {
      actionCount += 1;
    }

    if (
      targetUserId &&
      targetCooldownMs > 0 &&
      String(logData.targetUserId || "") === String(targetUserId) &&
      now - createdAtMs <= targetCooldownMs
    ) {
      throw new HttpsError("resource-exhausted", "Debes esperar antes de repetir esta accion con el mismo usuario.");
    }
  }

  if (actionCount >= maxCount) {
    throw new HttpsError("resource-exhausted", "Has alcanzado el limite temporal para esta accion.");
  }
}

async function recordNotificationActionLog(actorUid, action, targetUserId = null, metadata = {}) {
  await getNotificationActionLogsRef(actorUid).add({
    action,
    actorUid,
    targetUserId: targetUserId || null,
    createdAt: FieldValue.serverTimestamp(),
    createdAtMs: Date.now(),
    metadata,
  });
}

function normalizeNotificationParticipantProfile(participant = {}) {
  const userId = String(participant?.userId || participant?.id || "").trim();
  if (!userId) return null;

  return {
    userId,
    username: normalizeNotificationString(participant?.username || "Usuario", 80) || "Usuario",
    avatar: normalizeNotificationString(participant?.avatar || "", 500),
    isPremium: Boolean(participant?.isPremium),
  };
}

function dedupeNotificationParticipantProfiles(participants = []) {
  const byId = new Map();
  for (const participant of participants || []) {
    const normalized = normalizeNotificationParticipantProfile(participant);
    if (!normalized?.userId) continue;
    byId.set(normalized.userId, normalized);
  }
  return Array.from(byId.values());
}

async function buildParticipantProfilesFromUserIds(participantIds = []) {
  const normalizedIds = [...new Set((participantIds || []).map((value) => String(value || "").trim()).filter(Boolean))];
  const profiles = await Promise.all(
    normalizedIds.map(async (participantId) => {
      const userData = await getUserDataById(participantId);
      return {
        userId: participantId,
        username: normalizeNotificationString(userData.username || "Usuario", 80) || "Usuario",
        avatar: normalizeNotificationString(userData.avatar || "", 500),
        isPremium: Boolean(userData.isPremium),
      };
    })
  );
  return dedupeNotificationParticipantProfiles(profiles);
}

function buildPrivateGroupTitleForNotifications(participantProfiles = [], currentUserId = null) {
  const others = (participantProfiles || []).filter((item) => item.userId !== currentUserId);
  const names = others.map((item) => normalizeNotificationString(item.username, 80)).filter(Boolean);
  if (names.length === 0) return "Grupo privado";
  if (names.length <= 2) return names.join(" + ");
  return `${names.slice(0, 2).join(" + ")} +${names.length - 2}`;
}

function buildPrivateChatMessagePreviewForNotifications(content, type = "text") {
  if (type === "image") return "📷 Foto";
  const normalized = normalizeNotificationString(content, 500);
  if (!normalized) return "Nuevo mensaje";
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function getSenderNotificationIdentity(actorUid, actorData = {}, overrides = {}) {
  return {
    from: actorUid,
    fromUsername: normalizeNotificationString(overrides.fromUsername || actorData.username || "Usuario", 80) || "Usuario",
    fromAvatar: normalizeNotificationString(overrides.fromAvatar || actorData.avatar || "", 500),
    fromIsPremium: Boolean(
      Object.prototype.hasOwnProperty.call(overrides, "fromIsPremium")
        ? overrides.fromIsPremium
        : actorData.isPremium
    ),
  };
}

async function createUserNotificationRecord(targetUserId, payload = {}) {
  const safeTargetUserId = String(targetUserId || "").trim();
  if (!safeTargetUserId) {
    throw new HttpsError("invalid-argument", "targetUserId es requerido.");
  }

  const notificationPayload = {
    ...payload,
    to: String(payload.to || safeTargetUserId),
    read: normalizeNotificationBoolean(payload.read),
    timestamp: payload.timestamp || FieldValue.serverTimestamp(),
  };

  if (!("createdAt" in notificationPayload)) {
    notificationPayload.createdAt = FieldValue.serverTimestamp();
  }

  const ref = await db.collection("users").doc(safeTargetUserId).collection("notifications").add(notificationPayload);
  return ref.id;
}

async function createMultipleUserNotifications(notificationSpecs = []) {
  const results = [];
  for (const spec of notificationSpecs) {
    const id = await createUserNotificationRecord(spec.userId, spec.payload);
    results.push({ userId: spec.userId, notificationId: id });
  }
  return results;
}

async function countFavoriteAudienceForUser(targetUserId) {
  const safeTargetUserId = String(targetUserId || "").trim();
  if (!safeTargetUserId) return 0;

  const usersSnap = await db.collection("users").get();
  let count = 0;

  for (const userDoc of usersSnap.docs) {
    const favorites = Array.isArray(userDoc.data()?.favorites) ? userDoc.data().favorites : [];
    if (favorites.includes(safeTargetUserId)) {
      count += 1;
    }
  }

  return count;
}

function getHistoryRawPath(roomId, dayString, messageId, createdAtMs) {
  return `admin-room-history/raw/${roomId}/${dayString}/${createdAtMs}_${messageId}.json`;
}

function getHistoryGeneratedPath(roomId, dayString, uid, days, extension) {
  return `admin-room-history/generated/${roomId}/${dayString}/${Date.now()}_${uid}_${days}d.${extension}`;
}

function extractHistoryDayFromPath(filePath = "") {
  const parts = String(filePath).split("/");
  if (parts.length < 5) return null;
  return parts[3] || null;
}

function getLastNDayStrings(days, baseDate = new Date()) {
  const safeDays = Math.max(1, Math.min(Number(days || 1), ADMIN_ROOM_HISTORY_RETENTION_DAYS));
  const results = [];
  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(baseDate.getTime() - offset * 24 * 60 * 60 * 1000);
    results.push(getChileDayString(date));
  }
  return results;
}

function buildRoomHistoryEntry(messageData = {}, roomId, messageId) {
  const timestampValue = messageData.timestamp;
  const timestampDate =
    typeof timestampValue?.toDate === "function"
      ? timestampValue.toDate()
      : timestampValue instanceof Date
        ? timestampValue
        : new Date();
  const createdAtMs = timestampDate.getTime();
  const type = String(messageData.type || "text");
  const content = typeof messageData.content === "string" ? messageData.content.trim() : "";
  const normalizedContent =
    type === "image"
      ? content ? `[Imagen] ${content}` : "[Imagen enviada]"
      : content || "[Mensaje sin contenido visible]";

  return {
    roomId,
    messageId,
    createdAtMs,
    timestampIso: timestampDate.toISOString(),
    dayString: getChileDayString(timestampDate),
    username: String(messageData.username || "Usuario"),
    userId: String(messageData.userId || ""),
    roleBadge: messageData.roleBadge ? String(messageData.roleBadge) : "",
    comuna: messageData.comuna ? String(messageData.comuna) : "",
    type,
    content: normalizedContent,
  };
}

function formatRoomHistoryReportLine(entry = {}) {
  const date = new Date(entry.timestampIso || Date.now());
  const parts = [entry.username || "Usuario"];
  if (entry.roleBadge) parts.push(entry.roleBadge);
  if (entry.comuna) parts.push(entry.comuna);
  const identity = parts.join(" | ");
  const stamp = new Intl.DateTimeFormat("es-CL", {
    timeZone: CHILE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `[${stamp}] ${identity}: ${entry.content || "[Mensaje sin contenido visible]"}`;
}

async function loadRoomHistoryEntries(roomId, days) {
  const bucket = storage.bucket();
  const dayStrings = getLastNDayStrings(days);
  const entries = [];

  for (const dayString of dayStrings) {
    const prefix = `admin-room-history/raw/${roomId}/${dayString}/`;
    const [files] = await bucket.getFiles({ prefix });
    if (!files.length) continue;

    const loadedEntries = await Promise.all(
      files.map(async (file) => {
        const [contents] = await file.download();
        return JSON.parse(contents.toString("utf8"));
      })
    );

    for (const entry of loadedEntries) {
      if (entry && typeof entry === "object") {
        entries.push(entry);
      }
    }
  }

  entries.sort((a, b) => Number(a.createdAtMs || 0) - Number(b.createdAtMs || 0));
  return entries;
}

async function buildRoomHistoryReportPayload({ roomId, days, entries }) {
  const generatedAtIso = new Date().toISOString();

  return {
    roomId,
    days,
    generatedAtIso,
    totalMessages: entries.length,
    messages: entries,
  };
}

function resolvePrivilegeSource(autoEligible, adminGranted) {
  if (autoEligible && adminGranted) return "auto+admin";
  if (autoEligible) return "auto";
  if (adminGranted) return "admin";
  return "none";
}

function isBotLikeUserId(userId = "") {
  return (
    userId.startsWith("bot_") ||
    userId.startsWith("ai_") ||
    userId.startsWith("seed_user_") ||
    userId.startsWith("static_bot_") ||
    userId === "system" ||
    userId === "system_moderator"
  );
}

function isRegisteredPresenceUser(presenceData = {}, fallbackUserId = "") {
  const userId = String(presenceData.userId || fallbackUserId || "");
  if (!userId) return false;
  if (isBotLikeUserId(userId)) return false;
  if (presenceData.isBot === true) return false;
  if (presenceData.isGuest === true) return false;
  if (presenceData.isAnonymous === true) return false;
  if (userId.startsWith("unauthenticated_")) return false;
  if (userId.startsWith("temp_")) return false;
  return true;
}

function getMonthlyUsageDocId(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `photo_usage_${year}_${month}`;
}

async function recordPhotoMetrics(increments = {}, date = new Date()) {
  const metricsRef = db.collection("analytics_stats").doc(getMonthlyUsageDocId(date));
  const payload = {};
  for (const [key, value] of Object.entries(increments)) {
    if (typeof value === "number" && Number.isFinite(value) && value !== 0) {
      payload[key] = FieldValue.increment(value);
    }
  }
  if (Object.keys(payload).length === 0) return;
  payload.updatedAt = date;
  await metricsRef.set(payload, { merge: true });
}

function extractImageUsageFromMessage(messageData = {}) {
  const isImageType = messageData?.type === "image";
  if (!isImageType) return { imageUploads: 0, imageUploadBytes: 0 };

  let imageUploads = 0;
  let imageUploadBytes = 0;

  if (Array.isArray(messageData.media) && messageData.media.length > 0) {
    for (const mediaItem of messageData.media) {
      if (!mediaItem || typeof mediaItem !== "object") continue;
      const path = typeof mediaItem.path === "string" ? mediaItem.path : "";
      if (!path || !path.startsWith("chat_media/")) continue;
      imageUploads += 1;
      const sizeBytes = Number(mediaItem.sizeBytes || 0);
      if (Number.isFinite(sizeBytes) && sizeBytes > 0) {
        imageUploadBytes += sizeBytes;
      }
    }
  }

  if (imageUploads === 0) {
    if (typeof messageData.imagePath === "string" && messageData.imagePath.startsWith("chat_media/")) {
      imageUploads = 1;
    } else if (typeof messageData.storagePath === "string" && messageData.storagePath.startsWith("chat_media/")) {
      imageUploads = 1;
    }
  }

  return { imageUploads, imageUploadBytes };
}

function buildInactivityNotification(userId, now) {
  return {
    userId,
    type: "announcement",
    title: "Perdiste el beneficio de fotos",
    message: "Han pasado 24 horas sin actividad. Vuelve dos dias seguidos para recuperarlo.",
    icon: "📷",
    link: "/chat/principal",
    read: false,
    createdAt: now,
    expiresAt: null,
    priority: "normal",
    createdBy: "system",
  };
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? 0 : asDate.getTime();
}

function normalizeStoragePath(rawPath) {
  if (typeof rawPath !== "string") return null;
  const value = rawPath.trim();
  if (!value) return null;

  // gs://bucket/path/to/object
  if (value.startsWith("gs://")) {
    const rest = value.slice("gs://".length);
    const slashIndex = rest.indexOf("/");
    if (slashIndex === -1) return null;
    const bucketName = rest.slice(0, slashIndex);
    const objectPath = rest.slice(slashIndex + 1);
    if (!bucketName || !objectPath) return null;
    return { bucketName, objectPath };
  }

  // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?...
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value);
      const marker = "/o/";
      const markerIndex = parsed.pathname.indexOf(marker);
      if (markerIndex >= 0) {
        const encoded = parsed.pathname.slice(markerIndex + marker.length);
        const objectPath = decodeURIComponent(encoded);
        if (!objectPath) return null;
        return { bucketName: null, objectPath };
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  // path directo en bucket por defecto: chat_media/...
  return { bucketName: null, objectPath: value.replace(/^\/+/, "") };
}

function extractMediaPaths(messageData = {}) {
  const rawPaths = new Set();

  if (Array.isArray(messageData.media)) {
    for (const mediaItem of messageData.media) {
      if (mediaItem && typeof mediaItem.path === "string" && mediaItem.path.trim()) {
        rawPaths.add(mediaItem.path.trim());
      }
    }
  }

  // Fallback para modelos antiguos o mixtos
  const fallbackPathFields = [
    "imagePath",
    "voicePath",
    "audioPath",
    "storagePath",
    "filePath",
    "mediaPath",
  ];

  for (const fieldName of fallbackPathFields) {
    const value = messageData[fieldName];
    if (typeof value === "string" && value.trim()) {
      rawPaths.add(value.trim());
    }
  }

  return Array.from(rawPaths)
    .map(normalizeStoragePath)
    .filter(Boolean);
}

function isNotFoundStorageError(error) {
  const code = error?.code;
  const message = error?.message || "";
  return (
    code === 404 ||
    code === "404" ||
    code === "storage/object-not-found" ||
    /No such object/i.test(message) ||
    /not found/i.test(message)
  );
}

async function deleteStorageAsset(asset) {
  const bucket = asset.bucketName ? storage.bucket(asset.bucketName) : storage.bucket();
  try {
    console.log(`[RETENTION] Deleting storage asset: ${asset.objectPath} (bucket=${bucket.name})`);
    await bucket.file(asset.objectPath).delete();
  } catch (error) {
    if (isNotFoundStorageError(error)) {
      console.log(`[RETENTION] Storage asset already missing, skip: ${asset.objectPath}`);
      return;
    }
    console.error(`[RETENTION] Error deleting storage asset: ${asset.objectPath}`, error);
  }
}

async function cleanupDeletedMessageMediaFromEvent(event, label) {
  const messageData = event.data?.data?.() || null;
  if (!messageData) return null;

  const assets = extractMediaPaths(messageData);
  if (!assets.length) return null;

  for (const asset of assets) {
    await deleteStorageAsset(asset);
  }

  console.log(`[MEDIA_CLEANUP] ${label} deletedAssets=${assets.length}`);
  return null;
}

function normalizeCriticalSafetyText(value = "") {
  const raw = String(value || "");
  const lowered = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const collapsed = lowered.replace(/[|\\/:;,[\](){}<>]+/g, " ").replace(/\s+/g, " ").trim();
  const digitsOnly = raw.replace(/\D/g, "");
  const compact = collapsed.replace(/[^a-z0-9]/g, "");
  const alphaOnly = collapsed.replace(/[^a-z]/g, "");
  return { raw, collapsed, digitsOnly, compact, alphaOnly };
}

function compactTerm(term = "") {
  return String(term || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function hasContextualFragment(normalized, terms = []) {
  const compact = normalized.compact || "";
  const tokens = String(normalized.collapsed || "").split(/\s+/).filter(Boolean);

  return terms.some((term) => {
    const normalizedTerm = compactTerm(term);
    if (!normalizedTerm) return false;
    if (normalizedTerm.length <= 3) {
      return compact === normalizedTerm || tokens.includes(normalizedTerm);
    }
    return compact.includes(normalizedTerm);
  });
}

function isBenignNumericContext(normalized) {
  const collapsed = String(normalized?.collapsed || "");
  if (!collapsed) return false;

  return (
    CONTEXTUAL_BENIGN_NUMERIC_CONTEXT_REGEX.test(collapsed) ||
    /^\d{1,2}:\d{2}$/.test(collapsed) ||
    /^\d{1,2}\/\d{1,2}$/.test(collapsed) ||
    /^\d{1,2}\s*(?:am|pm)$/.test(collapsed)
  );
}

function buildContextualGuardEntry(content = "", timestampMs = Date.now()) {
  const normalized = normalizeCriticalSafetyText(content);
  const hasPlatform = hasContextualFragment(normalized, CONTEXTUAL_PLATFORM_TERMS);
  const hasExitHint = hasContextualFragment(normalized, ["fuera de chactivo", "otra app", "otra aplicacion"]);
  const hasStrongContactHint = hasContextualFragment(normalized, CONTEXTUAL_CONTACT_HINTS);
  const hasWeakContactHint = hasContextualFragment(normalized, CONTEXTUAL_WEAK_CONTACT_HINTS);
  return {
    timestampMs,
    raw: normalized.raw,
    collapsed: normalized.collapsed,
    compact: normalized.compact,
    digitsOnly: normalized.digitsOnly,
    hasContactHint: hasStrongContactHint || (hasWeakContactHint && (hasPlatform || hasExitHint)),
    hasMinorHint: hasContextualFragment(normalized, CONTEXTUAL_MINOR_HINTS),
    hasPlatform,
    hasExitHint,
    hasBenignNumericContext: isBenignNumericContext(normalized),
  };
}

function finalizeContextualGuardEntry(entry = {}) {
  return {
    ...entry,
    hasRiskSignal: Boolean(
      entry.hasContactHint ||
      entry.hasMinorHint ||
      entry.hasPlatform ||
      entry.hasExitHint ||
      (!entry.hasBenignNumericContext && String(entry.digitsOnly || "").length >= 5)
    ),
  };
}

function extractContextualMinorAge(entries = []) {
  const parts = entries
    .map((entry) => String(entry?.digitsOnly || "").trim())
    .filter(Boolean)
    .slice(-4);

  const candidates = new Set();
  parts.forEach((part) => {
    if (/^\d{2}$/.test(part)) candidates.add(part);
  });

  for (let index = 0; index < parts.length - 1; index += 1) {
    if (/^\d$/.test(parts[index]) && /^\d$/.test(parts[index + 1])) {
      candidates.add(`${parts[index]}${parts[index + 1]}`);
    }
  }

  for (const candidate of candidates) {
    const age = Number(candidate);
    if (age >= 10 && age <= 17) {
      return age;
    }
  }

  return null;
}

function shouldInspectContextualEvasion(content = "") {
  const normalized = normalizeCriticalSafetyText(content);
  const hasPlatform = hasContextualFragment(normalized, CONTEXTUAL_PLATFORM_TERMS);
  const hasStrongContactHint = hasContextualFragment(normalized, CONTEXTUAL_CONTACT_HINTS);
  const hasMinorHint = hasContextualFragment(normalized, CONTEXTUAL_MINOR_HINTS);

  return (
    (!isBenignNumericContext(normalized) && normalized.digitsOnly.length >= 5) ||
    hasStrongContactHint ||
    hasMinorHint ||
    hasPlatform
  );
}

function detectContextualChatSafetyRisk(currentContent = "", recentMessages = []) {
  const nowMs = Date.now();
  const recentEntries = recentMessages
    .map((message) => finalizeContextualGuardEntry(buildContextualGuardEntry(message.content, message.timestampMs || nowMs)))
    .filter((entry) => nowMs - entry.timestampMs <= CONTEXTUAL_ANTI_EVASION_LOOKBACK_MS)
    .slice(-CONTEXTUAL_ANTI_EVASION_WINDOW);

  const currentEntry = finalizeContextualGuardEntry(buildContextualGuardEntry(currentContent, nowMs));
  const window = [...recentEntries, currentEntry].slice(-CONTEXTUAL_ANTI_EVASION_WINDOW);
  const mergedCompact = window.map((entry) => entry.compact || "").join("");
  const mergedCollapsed = window.map((entry) => entry.collapsed || "").join(" ");
  const mergedDigits = window
    .filter((entry) => !entry.hasBenignNumericContext)
    .map((entry) => entry.digitsOnly || "")
    .join("");
  const ageCandidate = extractContextualMinorAge(window);
  const hasMinorHint = window.some((entry) => entry.hasMinorHint);
  const hasContactHint = window.some((entry) => entry.hasContactHint);
  const hasPlatform = window.some((entry) => entry.hasPlatform);
  const hasExitHint = window.some((entry) => entry.hasExitHint);
  const suspiciousAttemptCount = window.filter((entry) => entry.hasRiskSignal).length;
  const hasContactOrExitIntent = hasContactHint || hasPlatform || hasExitHint || mergedDigits.length >= 7;

  if (hasMinorHint && ageCandidate && hasContactOrExitIntent) {
    return {
      blocked: true,
      type: "minor_risk",
      severity: "critical",
      reason: `Combinacion critica detectada: menor de edad + contacto o salida (${ageCandidate})`,
    };
  }

  if (
    (hasMinorHint && ageCandidate) ||
    mergedCompact.includes("soymenor") ||
    mergedCompact.includes("menordeedad") ||
    mergedCompact.includes("casi18") ||
    mergedCompact.includes("18casi")
  ) {
    return {
      blocked: true,
      type: "minor_risk",
      severity: "critical",
      reason: ageCandidate
        ? `Edad menor reconstruida por contexto reciente (${ageCandidate})`
        : "Referencia fragmentada a menor de edad detectada por contexto reciente",
    };
  }

  if ((hasContactHint || hasPlatform) && mergedDigits.length >= 7) {
    return {
      blocked: true,
      type: "external_contact",
      severity: "high",
      reason: "Contacto externo fragmentado detectado por contexto reciente",
    };
  }

  if (hasContactHint && hasPlatform) {
    return {
      blocked: true,
      type: "external_contact",
      severity: "high",
      reason: "Invitacion a salir de Chactivo detectada por contexto reciente",
    };
  }

  if (suspiciousAttemptCount >= 4 && hasContactOrExitIntent) {
    return {
      blocked: true,
      type: "external_contact",
      severity: "high",
      reason: "Reincidencia contextual de evasion detectada en ventana reciente",
    };
  }

  return { blocked: false };
}

async function loadRecentMessagesForContext(messagesRef, currentMessageId, userId) {
  const snapshot = await messagesRef
    .orderBy("timestamp", "desc")
    .limit(CONTEXTUAL_ANTI_EVASION_QUERY_LIMIT)
    .get()
    .catch(() => null);

  if (!snapshot || snapshot.empty) {
    return [];
  }

  return snapshot.docs
    .filter((docSnap) => docSnap.id !== currentMessageId)
    .map((docSnap) => ({
      id: docSnap.id,
      content: String(docSnap.get("content") || "").trim(),
      userId: String(docSnap.get("userId") || "").trim(),
      type: String(docSnap.get("type") || "text").trim().toLowerCase(),
      timestampMs: toMillis(docSnap.get("timestamp")),
    }))
    .filter((item) => item.userId === userId && item.type === "text" && item.content);
}

function detectCriticalChatSafetyRisk(message = "") {
  const normalized = normalizeCriticalSafetyText(message);
  const collapsed = normalized.collapsed;
  const raw = normalized.raw;

  for (const pattern of CRITICAL_CHAT_SAFETY_PATTERNS.minor) {
    if (pattern.test(collapsed) || pattern.test(raw)) {
      return {
        blocked: true,
        type: "minor_risk",
        severity: "critical",
        reason: "Referencia o solicitud vinculada a menores de edad",
      };
    }
  }

  if (
    /^\s*(?:tengo|soy|edad|cumpli|cumplo)\s*(?:de\s*)?(1[0-7])\s*$/i.test(collapsed)
  ) {
    return {
      blocked: true,
      type: "minor_risk",
      severity: "critical",
      reason: "Declaracion de edad menor a 18",
    };
  }

  if (
    /\b(1[0-7])\s*(?:anos?)\b/i.test(collapsed) &&
    !/\bcm\b/i.test(collapsed)
  ) {
    return {
      blocked: true,
      type: "minor_risk",
      severity: "critical",
      reason: "Edad menor a 18 detectada en el mensaje",
    };
  }

  if (
    /\b(?:tengo|soy|edad|cumpli|cumplo)\b[\s:,"'`.-]*(?:1[\s._\-]*[0-7])\b/i.test(collapsed) &&
    !/\bcm\b/i.test(collapsed)
  ) {
    return {
      blocked: true,
      type: "minor_risk",
      severity: "critical",
      reason: "Edad menor a 18 detectada con formato fragmentado",
    };
  }

  for (const pattern of CRITICAL_CHAT_SAFETY_PATTERNS.drugs) {
    if (pattern.test(collapsed) || pattern.test(raw)) {
      return {
        blocked: true,
        type: /\b(lugar|ahora|ya|ven|vente|ubi|ubicacion|encuentro|coordinar)\b/i.test(collapsed)
          ? "drug_meetup"
          : "drugs",
        severity: "critical",
        reason: "Referencia a drogas o sustancias ilegales",
      };
    }
  }

  for (const pattern of CRITICAL_CHAT_SAFETY_PATTERNS.coercion) {
    if (pattern.test(collapsed) || pattern.test(raw)) {
      return {
        blocked: true,
        type: "coercion",
        severity: "critical",
        reason: "Referencia a coercion, abuso o extorsion sexual",
      };
    }
  }

  return { blocked: false };
}

async function applyCriticalSafetyState(userId, riskType) {
  if (!userId) return;

  const suspendMinutes = CRITICAL_CHAT_SAFETY_SUSPEND_MINUTES[riskType] || (24 * 60);
  const stateRef = db.collection("userModerationState").doc(userId);
  const snapshot = await stateRef.get().catch(() => null);
  const current = snapshot?.exists ? (snapshot.data() || {}) : {};
  const offenseCount = Number(current.contactOffenseCount || 0) + 1;
  const strikes = Math.max(Number(current.strikes || 0), offenseCount);
  const nextSuspend = new Date(Date.now() + suspendMinutes * 60 * 1000);

  await stateRef.set({
    strikes,
    contactOffenseCount: offenseCount,
    contactSuspendUntil: nextSuspend,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function createCriticalSafetyAlertFromMessage({ userId, username, roomId, message, risk }) {
  if (!risk?.blocked || !userId) return;

  const roomKey = String(roomId || "principal").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "principal";
  const alertId = `${getChileDayString()}_${userId}_${risk.type}_${roomKey}`.slice(0, 140);
  const alertRef = db.collection("moderation_alerts").doc(alertId);
  const existingSnap = await alertRef.get().catch(() => null);
  const now = FieldValue.serverTimestamp();

  if (existingSnap?.exists) {
    const existingData = existingSnap.data() || {};
    await alertRef.set({
      type: risk.type,
      severity: "critical",
      userId,
      username: normalizePublicString(username || "Usuario", 80) || "Usuario",
      roomId,
      message: normalizePublicString(message, 500) || "[sin muestra]",
      latestMessage: normalizePublicString(message, 500) || "[sin muestra]",
      reason: normalizePublicString(risk.reason, 240) || "Incidente critico de seguridad",
      status: "pending",
      detectedBy: "critical_safety_backend",
      autoAction: "temporary_suspend",
      repeatCount: Number(existingData.repeatCount || 1) + 1,
      lastDetectedAt: now,
      updatedAt: now,
    }, { merge: true });
    return;
  }

  await alertRef.set({
    type: risk.type,
    severity: "critical",
    userId,
    username: normalizePublicString(username || "Usuario", 80) || "Usuario",
    roomId,
    message: normalizePublicString(message, 500) || "[sin muestra]",
    latestMessage: normalizePublicString(message, 500) || "[sin muestra]",
    reason: normalizePublicString(risk.reason, 240) || "Incidente critico de seguridad",
    status: "pending",
    detectedBy: "critical_safety_backend",
    autoAction: "temporary_suspend",
    repeatCount: 1,
    createdAt: now,
    detectedAt: now,
    lastDetectedAt: now,
    updatedAt: now,
  }, { merge: true });
}

async function sanitizePrivateChatAfterCriticalRemoval({ chatId, removedContent, senderId }) {
  if (!chatId) return [];

  const safePreview = "Mensaje eliminado por seguridad";
  const chatRef = db.collection("private_chats").doc(chatId);
  const chatSnap = await chatRef.get().catch(() => null);
  const chatData = chatSnap?.data() || {};
  const participants = Array.isArray(chatData.participants)
    ? chatData.participants.filter(Boolean)
    : [];

  const shouldRewritePreview =
    String(chatData.lastMessage || "").trim() === String(removedContent || "").trim() &&
    String(chatData.lastMessageSenderId || "").trim() === String(senderId || "").trim();

  if (!shouldRewritePreview) {
    return participants;
  }

  await chatRef.set({
    lastMessage: safePreview,
    lastMessageType: "system",
    lastMessageSenderId: "system_moderator",
    lastMessageAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  if (participants.length === 0) {
    return participants;
  }

  const batch = db.batch();
  participants.forEach((participantId) => {
    const inboxRef = db.collection("users").doc(participantId).collection("private_inbox").doc(chatId);
    batch.set(inboxRef, {
      lastMessagePreview: safePreview,
      lastMessageSenderId: "system_moderator",
      lastMessageType: "system",
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();

  return participants;
}

function getDocTimestampMs(docSnap) {
  return toMillis(docSnap.get("timestamp"));
}

function isRoomImageMessageForUser(docSnap, userId) {
  const data = docSnap.data() || {};
  return data.type === "image" && String(data.userId || "") === userId;
}

async function enforceImagePolicyForUser(messagesRef, roomId, createdMessageData = {}) {
  if (roomId !== PHOTO_PRIVILEGE_SCOPE || createdMessageData.type !== "image") {
    return { deletedMessages: 0, deletedAssets: 0, hourlyOverflow: 0, visibleOverflow: 0 };
  }

  const userId = String(createdMessageData.userId || "");
  if (!userId || isBotLikeUserId(userId)) {
    return { deletedMessages: 0, deletedAssets: 0, hourlyOverflow: 0, visibleOverflow: 0 };
  }

  const nowMs = toMillis(createdMessageData.timestamp) || Date.now();
  const hourlyCutoffMs = nowMs - PHOTO_UPLOAD_HOURLY_WINDOW_MS;

  const recentSnap = await messagesRef
    .orderBy("timestamp", "desc")
    .limit(ROOM_RETENTION_MAX_MESSAGES)
    .get();

  if (recentSnap.empty) {
    return { deletedMessages: 0, deletedAssets: 0, hourlyOverflow: 0, visibleOverflow: 0 };
  }

  const userImageDocsAsc = recentSnap.docs
    .filter((docSnap) => isRoomImageMessageForUser(docSnap, userId))
    .sort((a, b) => getDocTimestampMs(a) - getDocTimestampMs(b));

  const docsToDelete = new Map();
  let hourlyOverflow = 0;
  let visibleOverflow = 0;

  const hourlyUserImageDocs = userImageDocsAsc.filter((docSnap) => getDocTimestampMs(docSnap) >= hourlyCutoffMs);
  if (hourlyUserImageDocs.length > PHOTO_UPLOADS_PER_HOUR_LIMIT) {
    hourlyOverflow = hourlyUserImageDocs.length - PHOTO_UPLOADS_PER_HOUR_LIMIT;
    hourlyUserImageDocs.slice(0, hourlyOverflow).forEach((docSnap) => {
      docsToDelete.set(docSnap.id, docSnap);
    });
  }

  const visibleWindowDocs = recentSnap.docs.slice(0, PHOTO_VISIBLE_WINDOW_MESSAGES);
  const visibleUserImageDocsAsc = visibleWindowDocs
    .filter((docSnap) => isRoomImageMessageForUser(docSnap, userId))
    .sort((a, b) => getDocTimestampMs(a) - getDocTimestampMs(b));

  if (visibleUserImageDocsAsc.length > PHOTO_VISIBLE_WINDOW_USER_IMAGE_LIMIT) {
    visibleOverflow = visibleUserImageDocsAsc.length - PHOTO_VISIBLE_WINDOW_USER_IMAGE_LIMIT;
    visibleUserImageDocsAsc.slice(0, visibleOverflow).forEach((docSnap) => {
      docsToDelete.set(docSnap.id, docSnap);
    });
  }

  if (docsToDelete.size === 0) {
    return { deletedMessages: 0, deletedAssets: 0, hourlyOverflow, visibleOverflow };
  }

  console.log(
    `[PHOTO_LIMIT] Applying limits roomId=${roomId} userId=${userId} hourlyOverflow=${hourlyOverflow} visibleOverflow=${visibleOverflow} deleting=${docsToDelete.size}`
  );

  const batch = db.batch();
  for (const docSnap of docsToDelete.values()) {
    batch.delete(docSnap.ref);
  }
  await batch.commit();

  let deletedAssets = 0;
  for (const docSnap of docsToDelete.values()) {
    const messageData = docSnap.data() || {};
    const assets = extractMediaPaths(messageData);
    for (const asset of assets) {
      await deleteStorageAsset(asset);
      deletedAssets += 1;
    }
  }

  console.log(
    `[PHOTO_LIMIT] Done roomId=${roomId} userId=${userId} deletedMessages=${docsToDelete.size} deletedAssets=${deletedAssets}`
  );

  return {
    deletedMessages: docsToDelete.size,
    deletedAssets,
    hourlyOverflow,
    visibleOverflow,
  };
}

async function acquireRetentionLock(roomId, owner) {
  const lockRef = db.collection("rooms").doc(roomId).collection("meta").doc("retention_lock");

  return db.runTransaction(async (tx) => {
    const nowMs = Date.now();
    const lockSnap = await tx.get(lockRef);
    const lockedUntilMs = toMillis(lockSnap.exists ? lockSnap.get("lockedUntil") : null);

    if (lockedUntilMs > nowMs) {
      return false;
    }

    tx.set(lockRef, {
      lockedUntil: new Date(nowMs + ROOM_RETENTION_LOCK_TTL_MS),
      owner,
      updatedAt: new Date(nowMs),
    }, { merge: true });

    return true;
  });
}

async function runRoomRetentionSweepForRoom(roomId, lockOwner) {
  if (!roomId) {
    return {
      roomId: null,
      skipped: true,
      reason: "missing_room_id",
      deletedMessages: 0,
      deletedAssets: 0,
    };
  }

  const lockAcquired = await acquireRetentionLock(roomId, lockOwner);
  if (!lockAcquired) {
    console.log(`[RETENTION] Lock busy, skip roomId=${roomId} owner=${lockOwner}`);
    return {
      roomId,
      skipped: true,
      reason: "lock_busy",
      deletedMessages: 0,
      deletedAssets: 0,
    };
  }

  console.log(`[RETENTION] Lock acquired roomId=${roomId} owner=${lockOwner}`);

  const messagesRef = db.collection("rooms").doc(roomId).collection("messages");
  let retentionDeletedMessages = 0;
  let retentionDeletedAssets = 0;
  let safetyPasses = 0;
  const MAX_PASSES = 100;

  while (safetyPasses < MAX_PASSES) {
    safetyPasses += 1;

    const probeSnap = await messagesRef
      .orderBy("timestamp", "desc")
      .limit(ROOM_RETENTION_QUERY_LIMIT)
      .get();

    if (probeSnap.size < ROOM_RETENTION_QUERY_LIMIT) {
      break;
    }

    const cutoffDoc = probeSnap.docs[ROOM_RETENTION_MAX_MESSAGES];
    const cutoffTs = cutoffDoc.get("timestamp");

    if (!cutoffTs) {
      console.warn(`[RETENTION] Missing cutoff timestamp roomId=${roomId}, aborting loop`);
      break;
    }

    const oldBatchSnap = await messagesRef
      .orderBy("timestamp", "asc")
      .endAt(cutoffTs)
      .limit(ROOM_RETENTION_DELETE_BATCH)
      .get();

    if (oldBatchSnap.empty) {
      console.warn(`[RETENTION] No candidates found at cutoff roomId=${roomId}, stopping`);
      break;
    }

    const docsToDelete = oldBatchSnap.docs;
    const batch = db.batch();
    for (const docSnap of docsToDelete) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();

    retentionDeletedMessages += docsToDelete.length;

    for (const docSnap of docsToDelete) {
      const messageData = docSnap.data() || {};
      const assets = extractMediaPaths(messageData);
      for (const asset of assets) {
        await deleteStorageAsset(asset);
        retentionDeletedAssets += 1;
      }
    }
  }

  if (safetyPasses >= MAX_PASSES) {
    console.warn(`[RETENTION] Safety stop reached roomId=${roomId} passes=${MAX_PASSES}`);
  }

  if (retentionDeletedAssets > 0) {
    await recordPhotoMetrics({ photoAssetsDeletedByRetention: retentionDeletedAssets }, new Date()).catch((error) => {
      console.error("[PHOTO_PRIV] Error recording retention delete metrics", error);
    });
  }

  const finalProbe = await messagesRef
    .orderBy("timestamp", "desc")
    .limit(ROOM_RETENTION_QUERY_LIMIT)
    .get();

  console.log(
    `[RETENTION] Sweep done roomId=${roomId} deletedMessages=${retentionDeletedMessages} deletedAssets=${retentionDeletedAssets} finalProbeSize=${finalProbe.size}`
  );

  return {
    roomId,
    skipped: false,
    deletedMessages: retentionDeletedMessages,
    deletedAssets: retentionDeletedAssets,
    finalProbeSize: finalProbe.size,
  };
}

async function syncPhotoPrivilegeFromActivity(userId, roomId, nowDate) {
  const activityRef = db.collection("user_activity_state").doc(userId);
  const privilegeRef = db.collection("chat_photo_privileges").doc(userId);
  const currentDay = getChileDayString(nowDate);

  return db.runTransaction(async (tx) => {
    const [activitySnap, privilegeSnap] = await Promise.all([
      tx.get(activityRef),
      tx.get(privilegeRef),
    ]);

    const previousActivity = activitySnap.exists ? activitySnap.data() || {} : {};
    const previousPrivilege = privilegeSnap.exists ? privilegeSnap.data() || {} : {};

    const previousDay = previousActivity.lastActiveDay || "";
    const previousStreak = Number(previousActivity.streakDays || 0);
    let streakDays = 1;

    if (previousDay === currentDay) {
      streakDays = previousStreak > 0 ? previousStreak : 1;
    } else if (previousDay) {
      const dayDiff = getDayDiff(previousDay, currentDay);
      streakDays = dayDiff === 1 ? previousStreak + 1 : 1;
    }

    const activityPayload = {
      uid: userId,
      lastActiveAt: nowDate,
      lastActiveDay: currentDay,
      streakDays,
      updatedAt: nowDate,
      lastRoomId: roomId,
    };
    tx.set(activityRef, activityPayload, { merge: true });

    const wasActive = previousPrivilege.active === true;
    const adminGranted = previousPrivilege.adminGranted === true;
    const autoEligible = streakDays >= PHOTO_PRIVILEGE_STREAK_DAYS_REQUIRED;
    const nextActive = autoEligible || adminGranted;

    const privilegePayload = {
      uid: userId,
      scope: PHOTO_PRIVILEGE_SCOPE,
      streakDays,
      lastActiveAt: nowDate,
      autoEligible,
      adminGranted,
      active: nextActive,
      source: resolvePrivilegeSource(autoEligible, adminGranted),
      updatedAt: nowDate,
    };

    if (nextActive && !previousPrivilege.grantedAt) {
      privilegePayload.grantedAt = nowDate;
    }
    if (nextActive && !wasActive) {
      privilegePayload.revokedAt = null;
      privilegePayload.revokedReason = null;
    }

    tx.set(privilegeRef, privilegePayload, { merge: true });

    return {
      streakDays,
      previousStreak,
      wasActive,
      isActive: nextActive,
      adminGranted,
      autoEligible,
      previousAutoEligible: previousPrivilege.autoEligible === true,
      justGrantedByAuto: !wasActive && nextActive && autoEligible,
    };
  });
}

/**
 * Verificar si estamos en quiet hours (00:00 - 08:00 Chile, UTC-3)
 */
function isQuietHours() {
  const now = new Date();
  const chileHour = getChileClockParts(now).hour;
  return chileHour >= 0 && chileHour < 8;
}

function resolvePushRateLimitConfig(data = {}) {
  const type = String(data?.type || "").toLowerCase();

  if (
    type === "dm" ||
    type === "direct_message" ||
    type === "private_chat_request" ||
    type === "private_chat_accepted"
  ) {
    return { bucket: "realtime", limit: PUSH_RATE_LIMITS.realtime };
  }

  if (type === "match" || type === "profile_comment") {
    return { bucket: "social", limit: PUSH_RATE_LIMITS.social };
  }

  if (type === "opin_reply" || type.startsWith("opin_")) {
    return { bucket: "social", limit: PUSH_RATE_LIMITS.social };
  }

  if (type === "event_soon" || type === "event_start") {
    return { bucket: "event", limit: PUSH_RATE_LIMITS.event };
  }

  if (type === "engagement_reminder") {
    return { bucket: "engagement", limit: PUSH_RATE_LIMITS.engagement };
  }

  return { bucket: "default", limit: PUSH_RATE_LIMITS.default };
}

function shouldRespectQuietHours(type = "") {
  return type === "engagement_reminder";
}

/**
 * Obtener tokens FCM de un usuario
 */
async function getUserTokens(userId) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) return [];
  const data = userDoc.data();
  return data.fcmTokens || [];
}

/**
 * Enviar push notification a un usuario
 * Respeta quiet hours y limita a 2 notificaciones por dia
 */
async function sendPushToUser(userId, notification, data = {}) {
  const type = String(data?.type || "").toLowerCase();
  if (shouldRespectQuietHours(type) && isQuietHours()) {
    console.log(`[PUSH] Quiet hours - no se envia push a ${userId}`);
    return false;
  }

  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) {
    console.log(`[PUSH] Usuario ${userId} no tiene tokens FCM`);
    return false;
  }

  const { bucket, limit } = resolvePushRateLimitConfig(data);
  const today = getChileDayString(new Date());
  const rateLimitRef = db.collection("pushRateLimit").doc(`${userId}_${today}_${bucket}`);
  const rateLimitDoc = await rateLimitRef.get();
  const currentCount = rateLimitDoc.exists ? rateLimitDoc.data().count : 0;

  if (currentCount >= limit) {
    console.log(`[PUSH] Rate limit alcanzado para ${userId} (${currentCount}/${limit} hoy, bucket=${bucket})`);
    return false;
  }

  // Incrementar contador
  await rateLimitRef.set({
    count: currentCount + 1,
    lastSent: new Date(),
    bucket,
    type,
  }, { merge: true });

  const message = {
    notification,
    data: { ...data, url: data.url || "/" },
    tokens,
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`[PUSH] Enviado a ${userId}: ${response.successCount} exitosos, ${response.failureCount} fallidos`);

    // Limpiar tokens invalidos
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === "messaging/invalid-registration-token") {
          invalidTokens.push(tokens[idx]);
        }
        if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        const userRef = db.collection("users").doc(userId);
        await userRef.update({
          fcmTokens: FieldValue.arrayRemove(...invalidTokens),
        });
        console.log(`[PUSH] Limpiados ${invalidTokens.length} tokens invalidos de ${userId}`);
      }
    }
    return response.successCount > 0;
  } catch (error) {
    console.error(`[PUSH] Error enviando a ${userId}:`, error);
    return false;
  }
}

/**
 * 1. notifyOnNewMessage
 * Trigger: Nuevo documento en private_chats/{chatId}/messages/{messageId}
 * Envia push al destinatario del mensaje privado
 */
exports.notifyOnNewMessage = onDocumentCreated(
  "private_chats/{chatId}/messages/{messageId}",
  async (event) => {
    const message = event.data?.data();
    if (!message) return;
    if (message.type === "system") return;
    console.log(
      `[DM_PUSH] notifyOnNewMessage skip chatId=${event.params.chatId} reason=handled_via_user_notification`
    );
    return null;
  }
);

/**
 * cleanupPrivateChatMessageMedia
 * Trigger: private_chats/{chatId}/messages/{messageId} onDelete
 * Borra media asociada usando Admin SDK para evitar dependencia del cliente.
 */
exports.cleanupPrivateChatMessageMedia = onDocumentDeleted(
  "private_chats/{chatId}/messages/{messageId}",
  async (event) => cleanupDeletedMessageMediaFromEvent(event, "private_chat_message")
);

/**
 * 2. notifyOnMatch
 * Trigger: Nuevo documento en matches/{matchId}
 * Envia push a ambos usuarios del match
 */
exports.notifyOnMatch = onDocumentCreated(
  "matches/{matchId}",
  async (event) => {
    const match = event.data?.data();
    if (!match) return;

    const user1 = match.user1Id || match.userId1;
    const user2 = match.user2Id || match.userId2;

    if (!user1 || !user2) return;

    const notification = {
      title: "Tienes un nuevo match!",
      body: "Alguien tambien te dio like en el Baul. Entra a ver quien es.",
    };

    const data = {
      type: "match",
      matchId: event.params.matchId,
      url: "/baul",
      tag: "match",
    };

    await Promise.all([
      sendPushToUser(user1, notification, data),
      sendPushToUser(user2, notification, data),
    ]);
  }
);

/**
 * 3. notifyOnPrivateChatRequest
 * Trigger: Nuevo documento en users/{userId}/notifications
 * Envia push para:
 * - private_chat_request
 * - private_chat_accepted
 * - direct_message
 * - profile_comment
 */
exports.notifyOnPrivateChatRequest = onDocumentCreated(
  "users/{userId}/notifications/{notificationId}",
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const targetUserId = event.params.userId;
    const senderName = notification.fromUsername || notification.senderName || "Alguien";
    const type = String(notification.type || "").toLowerCase();

    if (type === "privatechatrequest" || type === "private_chat_request") {
      await sendPushToUser(targetUserId, {
        title: `${senderName} quiere chatear contigo`,
        body: "Te enviaron una solicitud de chat privado. Entra para responder.",
      }, {
        type: "private_chat_request",
        url: "/chat/principal",
        tag: "private_chat_request",
      });
      return;
    }

    if (type === "private_chat_accepted") {
      await sendPushToUser(targetUserId, {
        title: `${senderName} acepto tu invitacion`,
        body: "Tu chat privado ya esta listo. Entra para continuar la conversacion.",
      }, {
        type: "private_chat_accepted",
        chatId: notification.chatId || "",
        url: "/chat/principal",
        tag: notification.tag || "private_chat_accepted",
      });
      return;
    }

    if (type === "direct_message" || type === "dm") {
      const message = String(notification.content || notification.message || "Te enviaron un mensaje").trim();
      await sendPushToUser(targetUserId, {
        title: `${senderName} te escribio`,
        body: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      }, {
        type: "dm",
        url: "/chat/principal",
        tag: notification.tag || "direct_message",
      });
      return;
    }

    if (type === "profile_comment") {
      const message = String(notification.content || notification.message || "Comentaron tu perfil").trim();
      await sendPushToUser(targetUserId, {
        title: `${senderName} comento tu perfil`,
        body: message.length > 100 ? `${message.substring(0, 100)}...` : message,
      }, {
        type: "profile_comment",
        url: "/baul",
        tag: notification.tag || "profile_comment",
      });
    }
  }
);

/**
 * 4. notifyOnOpinReply
 * Trigger: Nuevo documento en users/{userId}/notifications con tipo opin_*
 * Envia push cuando alguien interactua con OPIN del usuario.
 */
exports.notifyOnOpinReply = onDocumentCreated(
  "users/{userId}/notifications/{notificationId}",
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const type = String(notification.type || "");
    if (!type.startsWith("opin_")) {
      return;
    }

    const targetUserId = event.params.userId;
    const senderName = notification.fromUsername || "Alguien";
    const message = String(notification.content || notification.message || "Respondieron tu OPIN").trim();
    const postId = notification.postId || "";
    const fallbackUrl = postId ? `/opin?postId=${postId}&openComments=1` : "/opin";

    await sendPushToUser(targetUserId, {
      title: `${senderName} interactuo con tu OPIN`,
      body: message.length > 100 ? `${message.substring(0, 100)}...` : message,
    }, {
      type,
      postId,
      commentId: notification.commentId || "",
      url: notification.url || fallbackUrl,
      tag: notification.tag || (postId ? `${type}_${postId}` : type),
    });
  }
);

function buildEventSoonNotification(eventName, minutesToStart) {
  const safeMinutes = Math.max(1, Number.parseInt(minutesToStart, 10) || 1);
  return {
    title: "Tu evento empieza pronto",
    body: `${eventName} comienza en ${safeMinutes} min. Entra y conecta con la comunidad.`,
  };
}

function buildEventStartNotification(eventName) {
  return {
    title: "Evento en vivo ahora",
    body: `${eventName} ya comenzo. La sala del evento esta activa ahora.`,
  };
}

function buildEngagementReminderNotification(slotHour) {
  if (slotHour >= 20) {
    return {
      title: "Hora de reconectar en Chactivo",
      body: "La sala principal se mueve fuerte a esta hora. Entra y rompe el hielo.",
    };
  }

  return {
    title: "Comunidad conectandose ahora",
    body: "Hay hora pico de conversacion. Entra al chat principal y participa.",
  };
}

function shouldSkipReminderForUser(userData = {}) {
  if (userData.pushEnabled === false) return true;
  if (userData.pushReminderOptOut === true) return true;
  if (userData.engagementReminderOptOut === true) return true;
  return false;
}

async function hasReminderLog(collectionName, docId) {
  const snap = await db.collection(collectionName).doc(docId).get();
  return snap.exists;
}

async function saveReminderLog(collectionName, docId, payload = {}) {
  await db.collection(collectionName).doc(docId).set({
    ...payload,
    createdAt: new Date(),
  }, { merge: true });
}

/**
 * Recordatorio de hora pico para usuarios inactivos con push habilitado.
 * Ejecuta cada 30 min y solo dispara en slots definidos.
 */
exports.sendPeakHourConnectionReminders = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: CHILE_TIME_ZONE,
    region: "us-central1",
  },
  async () => {
    const now = new Date();
    const { hour, minute } = getChileClockParts(now);

    if (!ENGAGEMENT_REMINDER_SLOTS.includes(hour) || minute > 20) {
      return null;
    }

    const cutoffDate = new Date(now.getTime() - ENGAGEMENT_INACTIVITY_MS);
    const dayKey = getChileDayString(now);
    const slotKey = `${dayKey}_${String(hour).padStart(2, "0")}`;

    const inactiveSnap = await db
      .collection("user_activity_state")
      .where("lastActiveAt", "<=", cutoffDate)
      .orderBy("lastActiveAt", "asc")
      .limit(ENGAGEMENT_REMINDER_BATCH)
      .get();

    if (inactiveSnap.empty) {
      console.log(`[PUSH_REMINDER] slot=${slotKey} sin candidatos inactivos`);
      return null;
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const activityDoc of inactiveSnap.docs) {
      const activityData = activityDoc.data() || {};
      const userId = String(activityData.uid || activityDoc.id || "");
      if (!userId || isBotLikeUserId(userId)) {
        skippedCount += 1;
        continue;
      }

      const logDocId = `${slotKey}_${userId}`;
      const alreadySent = await hasReminderLog("pushReminderLog", logDocId);
      if (alreadySent) {
        skippedCount += 1;
        continue;
      }

      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        skippedCount += 1;
        continue;
      }

      const userData = userDoc.data() || {};
      if (shouldSkipReminderForUser(userData)) {
        skippedCount += 1;
        continue;
      }

      if (!Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
        skippedCount += 1;
        continue;
      }

      const notification = buildEngagementReminderNotification(hour);
      const sent = await sendPushToUser(userId, notification, {
        type: "engagement_reminder",
        slotHour: String(hour),
        url: "/chat/principal",
        tag: `engagement_${slotKey}`,
      });

      if (!sent) {
        skippedCount += 1;
        continue;
      }

      await saveReminderLog("pushReminderLog", logDocId, {
        userId,
        slotKey,
        type: "engagement_reminder",
        lastActiveAt: activityData.lastActiveAt || null,
      });
      sentCount += 1;
    }

    console.log(`[PUSH_REMINDER] slot=${slotKey} sent=${sentCount} skipped=${skippedCount}`);
    return null;
  }
);

exports.enforceCriticalRoomSafety = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const roomId = String(event.params.roomId || "").trim();
    const messageId = String(event.params.messageId || "").trim();
    const messageData = event.data?.data() || {};
    const messageType = String(messageData.type || "text").trim().toLowerCase();
    const userId = String(messageData.userId || "").trim();

    if (!roomId || !messageId || messageType !== "text" || !userId) {
      return null;
    }

    if (
      userId === "system" ||
      userId === "system_moderator" ||
      userId.startsWith("system_") ||
      userId.startsWith("bot_") ||
      userId.startsWith("ai_")
    ) {
      return null;
    }

    const content = String(messageData.content || "").trim();
    if (!content) return null;

    let risk = detectCriticalChatSafetyRisk(content);
    if (!risk.blocked && shouldInspectContextualEvasion(content)) {
      const recentMessages = await loadRecentMessagesForContext(
        db.collection("rooms").doc(roomId).collection("messages"),
        messageId,
        userId
      );
      risk = detectContextualChatSafetyRisk(content, recentMessages);
    }
    if (!risk.blocked) return null;

    const messageRef = db.collection("rooms").doc(roomId).collection("messages").doc(messageId);

    await Promise.all([
      messageRef.delete().catch((error) => {
        console.warn(`[CRITICAL_SAFETY] delete failed roomId=${roomId} messageId=${messageId}`, error?.message || error);
      }),
      applyCriticalSafetyState(userId, risk.type).catch((error) => {
        console.warn(`[CRITICAL_SAFETY] state update failed userId=${userId}`, error?.message || error);
      }),
      createCriticalSafetyAlertFromMessage({
        userId,
        username: messageData.username,
        roomId,
        message: content,
        risk,
      }).catch((error) => {
        console.warn(`[CRITICAL_SAFETY] alert creation failed userId=${userId}`, error?.message || error);
      }),
    ]);

    console.log(
      `[CRITICAL_SAFETY] removed roomId=${roomId} messageId=${messageId} userId=${userId} type=${risk.type}`
    );

    return null;
  }
);

exports.enforceCriticalPrivateChatSafety = onDocumentCreated(
  "private_chats/{chatId}/messages/{messageId}",
  async (event) => {
    const chatId = String(event.params.chatId || "").trim();
    const messageId = String(event.params.messageId || "").trim();
    const messageData = event.data?.data() || {};
    const messageType = String(messageData.type || "text").trim().toLowerCase();
    const userId = String(messageData.userId || "").trim();

    if (!chatId || !messageId || messageType !== "text" || !userId) {
      return null;
    }

    if (
      userId === "system" ||
      userId === "system_moderator" ||
      userId.startsWith("system_") ||
      userId.startsWith("bot_") ||
      userId.startsWith("ai_")
    ) {
      return null;
    }

    const content = String(messageData.content || "").trim();
    if (!content) return null;

    let risk = detectCriticalChatSafetyRisk(content);
    if (!risk.blocked && shouldInspectContextualEvasion(content)) {
      const recentMessages = await loadRecentMessagesForContext(
        db.collection("private_chats").doc(chatId).collection("messages"),
        messageId,
        userId
      );
      risk = detectContextualChatSafetyRisk(content, recentMessages);
    }
    if (!risk.blocked) return null;

    const messageRef = db.collection("private_chats").doc(chatId).collection("messages").doc(messageId);

    await Promise.all([
      messageRef.delete().catch((error) => {
        console.warn(`[CRITICAL_PRIVATE_SAFETY] delete failed chatId=${chatId} messageId=${messageId}`, error?.message || error);
      }),
      applyCriticalSafetyState(userId, risk.type).catch((error) => {
        console.warn(`[CRITICAL_PRIVATE_SAFETY] state update failed userId=${userId}`, error?.message || error);
      }),
      createCriticalSafetyAlertFromMessage({
        userId,
        username: messageData.username,
        roomId: `private:${chatId}`,
        message: content,
        risk,
      }).catch((error) => {
        console.warn(`[CRITICAL_PRIVATE_SAFETY] alert creation failed userId=${userId}`, error?.message || error);
      }),
      sanitizePrivateChatAfterCriticalRemoval({
        chatId,
        removedContent: content,
        senderId: userId,
      }).catch((error) => {
        console.warn(`[CRITICAL_PRIVATE_SAFETY] preview sanitize failed chatId=${chatId}`, error?.message || error);
      }),
    ]);

    console.log(
      `[CRITICAL_PRIVATE_SAFETY] removed chatId=${chatId} messageId=${messageId} userId=${userId} type=${risk.type}`
    );

    return null;
  }
);

/**
 * Recordatorios de eventos:
 * - 10 minutos antes (event_soon)
 * - cuando inicia (event_start)
 * Solo para asistentes registrados del evento.
 */
exports.sendEventReminderPushes = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: CHILE_TIME_ZONE,
    region: "us-central1",
  },
  async () => {
    const now = new Date();
    const nowMs = now.getTime();
    const dayKey = getChileDayString(now);

    const eventsSnap = await db
      .collection("eventos")
      .where("activo", "==", true)
      .limit(EVENT_REMINDER_EVENT_LIMIT)
      .get();

    if (eventsSnap.empty) {
      return null;
    }

    let remindersSent = 0;
    let eventsConsidered = 0;

    for (const eventDoc of eventsSnap.docs) {
      const eventData = eventDoc.data() || {};
      const startMs = toMillis(eventData.fechaInicio);
      const roomId = String(eventData.roomId || "");
      const eventName = String(eventData.nombre || "Tu evento");
      if (!startMs || !roomId) continue;

      const deltaMs = startMs - nowMs;
      let stage = "";

      if (deltaMs > 0 && deltaMs <= EVENT_REMINDER_LOOKAHEAD_MS) {
        stage = "soon";
      } else if (deltaMs <= 0 && Math.abs(deltaMs) <= EVENT_REMINDER_START_WINDOW_MS) {
        stage = "start";
      }

      if (!stage) continue;
      eventsConsidered += 1;

      const attendeesSnap = await eventDoc.ref
        .collection("asistentes")
        .limit(EVENT_REMINDER_USER_LIMIT)
        .get();

      if (attendeesSnap.empty) continue;

      for (const attendeeDoc of attendeesSnap.docs) {
        const attendeeData = attendeeDoc.data() || {};
        const userId = String(attendeeData.userId || attendeeDoc.id || "");
        if (!userId || isBotLikeUserId(userId)) continue;

        const logDocId = `${eventDoc.id}_${stage}_${dayKey}_${userId}`;
        const alreadySent = await hasReminderLog("eventPushReminderLog", logDocId);
        if (alreadySent) continue;

        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) continue;

        const userData = userDoc.data() || {};
        if (shouldSkipReminderForUser(userData)) continue;
        if (!Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) continue;

        const pushType = stage === "start" ? "event_start" : "event_soon";
        const notification = stage === "start"
          ? buildEventStartNotification(eventName)
          : buildEventSoonNotification(eventName, Math.round(deltaMs / 60000));

        const sent = await sendPushToUser(userId, notification, {
          type: pushType,
          eventId: eventDoc.id,
          roomId,
          url: `/chat/${roomId}`,
          tag: `event_${eventDoc.id}_${stage}`,
        });

        if (!sent) continue;

        await saveReminderLog("eventPushReminderLog", logDocId, {
          userId,
          eventId: eventDoc.id,
          roomId,
          stage,
        });
        remindersSent += 1;
      }
    }

    if (eventsConsidered > 0) {
      console.log(`[EVENT_PUSH] consideredEvents=${eventsConsidered} remindersSent=${remindersSent}`);
    }
    return null;
  }
);

/**
 * syncPhotoPrivilegeFromPresence
 * Trigger: roomPresence/{roomId}/users/{presenceId} onCreate
 * Regla de negocio:
 * - Solo sala principal
 * - Solo usuarios registrados (no guest/anónimo/bot)
 * - Beneficio auto tras 2 días seguidos de actividad
 */
exports.syncPhotoPrivilegeFromPresence = onDocumentCreated(
  "roomPresence/{roomId}/users/{presenceId}",
  async (event) => {
    const roomId = event.params.roomId;
    const presenceId = event.params.presenceId;
    const presenceData = event.data?.data() || {};

    if (roomId !== PHOTO_PRIVILEGE_SCOPE) {
      return null;
    }

    if (!isRegisteredPresenceUser(presenceData, presenceId)) {
      console.log(`[PHOTO_PRIV] Skip ineligible presence user roomId=${roomId} presenceId=${presenceId}`);
      return null;
    }

    const userId = String(presenceData.userId || presenceId);
    const now = new Date();

    try {
      const result = await syncPhotoPrivilegeFromActivity(userId, roomId, now);
      console.log(
        `[PHOTO_PRIV] Synced from presence uid=${userId} streak=${result.streakDays} active=${result.isActive} autoEligible=${result.autoEligible} adminGranted=${result.adminGranted}`
      );

      if (result.justGrantedByAuto) {
        await recordPhotoMetrics({ photoPrivilegeAutoGrants: 1 }, now).catch((error) => {
          console.error("[PHOTO_PRIV] Error recording auto grant metrics", error);
        });
        console.log(`[PHOTO_PRIV] Auto grant applied uid=${userId}`);
      }
    } catch (error) {
      console.error(`[PHOTO_PRIV] Error syncing privilege uid=${userId}`, error);
    }

    return null;
  }
);

/**
 * revokePhotoPrivilegeForInactivity
 * Job cada hora:
 * - Busca privilegios activos con lastActiveAt <= now-24h
 * - Revoca privilegios y notifica al usuario
 */
exports.revokePhotoPrivilegeForInactivity = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: CHILE_TIME_ZONE,
    region: "us-central1",
  },
  async () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - PHOTO_PRIVILEGE_INACTIVITY_MS);
    let totalRevoked = 0;

    console.log(`[PHOTO_PRIV] Inactivity revoke run start cutoff=${cutoff.toISOString()}`);

    while (true) {
      const snap = await db
        .collection("chat_photo_privileges")
        .where("active", "==", true)
        .where("lastActiveAt", "<=", cutoff)
        .orderBy("lastActiveAt", "asc")
        .limit(PHOTO_PRIVILEGE_REVOKE_BATCH_SIZE)
        .get();

      if (snap.empty) break;

      const batch = db.batch();
      for (const docSnap of snap.docs) {
        const data = docSnap.data() || {};
        const userId = String(data.uid || docSnap.id);
        if (!userId) continue;

        batch.set(
          docSnap.ref,
          {
            uid: userId,
            active: false,
            autoEligible: false,
            adminGranted: false,
            source: "none",
            revokedAt: now,
            revokedReason: "inactive_24h",
            updatedAt: now,
            grantedBy: null,
          },
          { merge: true }
        );

        const notificationRef = db.collection("systemNotifications").doc();
        batch.set(notificationRef, buildInactivityNotification(userId, now));
      }

      await batch.commit();
      totalRevoked += snap.size;
      console.log(`[PHOTO_PRIV] Revoked by inactivity batchSize=${snap.size} total=${totalRevoked}`);
    }

    if (totalRevoked > 0) {
      await recordPhotoMetrics({ photoPrivilegeRevocationsInactivity: totalRevoked }, now).catch((error) => {
        console.error("[PHOTO_PRIV] Error recording inactivity revoke metrics", error);
      });
    }

    console.log(`[PHOTO_PRIV] Inactivity revoke run done totalRevoked=${totalRevoked}`);
    return null;
  }
);

/**
 * enforceRoomRetention
 * Trigger: rooms/{roomId}/messages/{messageId} onCreate
 * Mantiene máximo de 205 mensajes por sala.
 * Si se eliminan mensajes con media en Storage, elimina también esos archivos.
 */
exports.enforceRoomRetention = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const roomId = event.params.roomId;
    const messageId = event.params.messageId;
    const createdMessageData = event.data?.data() || {};

    const imageUsage = extractImageUsageFromMessage(createdMessageData);
    if (imageUsage.imageUploads > 0 || imageUsage.imageUploadBytes > 0) {
      await recordPhotoMetrics(imageUsage, new Date()).catch((error) => {
        console.error("[PHOTO_PRIV] Error recording image upload metrics", error);
      });
      console.log(
        `[PHOTO_PRIV] Image upload metric roomId=${roomId} messageId=${messageId} uploads=${imageUsage.imageUploads} bytes=${imageUsage.imageUploadBytes}`
      );
    }

    const messagesRef = db.collection("rooms").doc(roomId).collection("messages");
    if (createdMessageData.type !== "image") {
      return null;
    }

    try {
      const photoPolicyResult = await enforceImagePolicyForUser(messagesRef, roomId, createdMessageData);
      if (photoPolicyResult.deletedMessages > 0 || photoPolicyResult.deletedAssets > 0) {
        await recordPhotoMetrics({
          photoMessagesDeletedByPhotoLimit: photoPolicyResult.deletedMessages,
          photoAssetsDeletedByPhotoLimit: photoPolicyResult.deletedAssets,
        }, new Date()).catch((error) => {
          console.error("[PHOTO_PRIV] Error recording photo limit delete metrics", error);
        });
      }

      if (photoPolicyResult.hourlyOverflow > 0 || photoPolicyResult.visibleOverflow > 0) {
        console.log(
          `[PHOTO_LIMIT] roomId=${roomId} messageId=${messageId} hourlyOverflow=${photoPolicyResult.hourlyOverflow} visibleOverflow=${photoPolicyResult.visibleOverflow}`
        );
      }
    } catch (error) {
      console.error(`[PHOTO_LIMIT] Error enforcing photo policy roomId=${roomId} messageId=${messageId}`, error);
    }

    return null;
  }
);

/**
 * enforceRoomRetentionScheduled
 * Job periódico: aplica retención por lote y evita correr barridos pesados por cada mensaje nuevo.
 */
exports.enforceRoomRetentionScheduled = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: CHILE_TIME_ZONE,
    region: "us-central1",
  },
  async () => {
    const roomRefs = await db.collection("rooms").listDocuments();
    let processedRooms = 0;
    let skippedRooms = 0;
    let totalDeletedMessages = 0;
    let totalDeletedAssets = 0;

    for (const roomRef of roomRefs) {
      const result = await runRoomRetentionSweepForRoom(
        roomRef.id,
        `scheduled:${Date.now()}:${roomRef.id}`
      );
      if (result?.skipped) {
        skippedRooms += 1;
        continue;
      }
      processedRooms += 1;
      totalDeletedMessages += Number(result?.deletedMessages || 0);
      totalDeletedAssets += Number(result?.deletedAssets || 0);
    }

    console.log(
      `[RETENTION] Scheduled run done processedRooms=${processedRooms} skippedRooms=${skippedRooms} deletedMessages=${totalDeletedMessages} deletedAssets=${totalDeletedAssets}`
    );

    return null;
  }
);

/**
 * dispatchUserNotification
 * Callable controlada para notificaciones de usuario.
 * Reemplaza las escrituras directas del cliente sobre users/{uid}/notifications.
 */
exports.dispatchUserNotification = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const actorUid = String(request.auth?.uid || "").trim();
    if (!actorUid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const action = normalizeNotificationString(request.data?.action, 80);
    const payload = request.data?.payload && typeof request.data.payload === "object"
      ? request.data.payload
      : {};

    const actorData = await getUserDataById(actorUid);
    const senderIdentity = getSenderNotificationIdentity(actorUid, actorData);

    if (action === "direct_message") {
      const chatId = normalizeNotificationString(payload.chatId, 120);
      const messageType = normalizeNotificationString(payload.messageType || payload.type || "text", 40) || "text";
      const content = normalizeNotificationString(payload.content, 1000);

      let recipientIds = Array.isArray(payload.recipientIds) ? payload.recipientIds : [];
      const singleRecipient = normalizeNotificationString(payload.toUserId || payload.recipientId, 120);
      if (singleRecipient) recipientIds = [...recipientIds, singleRecipient];

      const validRecipients = [...new Set(
        recipientIds.map((value) => String(value || "").trim()).filter(Boolean)
      )].filter((recipientId) => recipientId !== actorUid);

      if (validRecipients.length === 0) {
        throw new HttpsError("invalid-argument", "Debes indicar al menos un destinatario.");
      }

      if (!chatId) {
        throw new HttpsError("failed-precondition", "Los mensajes directos deben enviarse dentro de un chat privado.");
      }

      const chatDoc = await db.collection("private_chats").doc(chatId).get();
      if (!chatDoc.exists) {
        throw new HttpsError("not-found", "Chat privado no encontrado.");
      }
      const participants = Array.isArray(chatDoc.data()?.participants) ? chatDoc.data().participants : [];
      if (!participants.includes(actorUid)) {
        throw new HttpsError("permission-denied", "No participas en este chat.");
      }
      if (!validRecipients.every((recipientId) => participants.includes(recipientId))) {
        throw new HttpsError("permission-denied", "Destinatario no valido para este chat.");
      }

      const blockedChecks = await Promise.all(
        validRecipients.map((recipientId) => isBlockedBetweenUsers(actorUid, recipientId))
      );
      if (blockedChecks.some(Boolean)) {
        throw new HttpsError("permission-denied", "No puedes notificar a un usuario bloqueado.");
      }

      const preview = chatId
        ? buildPrivateChatMessagePreviewForNotifications(content, messageType)
        : (content || "Nuevo mensaje");

      const created = await createMultipleUserNotifications(
        validRecipients.map((recipientId) => ({
          userId: recipientId,
          payload: {
            ...senderIdentity,
            to: recipientId,
            type: "direct_message",
            chatId: chatId || null,
            content: preview,
            source: chatId ? "private_chat_direct" : (normalizeNotificationString(payload.source, 80) || "direct_message"),
            read: false,
          },
        }))
      );

      await Promise.all(
        validRecipients.map((recipientId) => recordNotificationActionLog(actorUid, action, recipientId, { chatId }))
      );

      return { success: true, created };
    }

    if (action === "private_chat_reopened") {
      const chatId = normalizeNotificationString(payload.chatId, 120);
      const toUserId = normalizeNotificationString(payload.toUserId, 120);
      const createdFlag = normalizeNotificationBoolean(payload.created);
      const fallbackTitle = normalizeNotificationString(payload.title, 160);

      if (!chatId || !toUserId || toUserId === actorUid) {
        throw new HttpsError("invalid-argument", "chatId y toUserId son requeridos.");
      }

      const chatDoc = await db.collection("private_chats").doc(chatId).get();
      if (!chatDoc.exists) {
        throw new HttpsError("not-found", "Chat privado no encontrado.");
      }

      const chatData = chatDoc.data() || {};
      const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
      if (!participants.includes(actorUid) || !participants.includes(toUserId)) {
        throw new HttpsError("permission-denied", "No puedes notificar este chat.");
      }

      const participantProfiles = Array.isArray(chatData.participantProfiles) && chatData.participantProfiles.length > 0
        ? dedupeNotificationParticipantProfiles(chatData.participantProfiles)
        : await buildParticipantProfilesFromUserIds(participants);
      const conversationTitle = normalizeNotificationString(chatData.title, 160) || fallbackTitle;

      const notificationId = await createUserNotificationRecord(toUserId, {
        ...senderIdentity,
        to: toUserId,
        type: "private_chat_reopened",
        chatId,
        title: conversationTitle || "",
        participantProfiles,
        created: createdFlag,
        content: createdFlag
          ? `${senderIdentity.fromUsername} abrió un chat privado contigo`
          : `${senderIdentity.fromUsername} volvió a abrir el chat privado`,
        read: false,
      });

      return { success: true, notificationId };
    }

    if (action === "private_group_invite_request") {
      const inviteId = normalizeNotificationString(payload.inviteId, 120);
      if (!inviteId) {
        throw new HttpsError("invalid-argument", "inviteId es requerido.");
      }

      const inviteDoc = await db.collection(PRIVATE_GROUP_INVITES_COLLECTION).doc(inviteId).get();
      if (!inviteDoc.exists) {
        throw new HttpsError("not-found", "Invitacion no encontrada.");
      }

      const inviteData = inviteDoc.data() || {};
      if (String(inviteData.inviterId || "") !== actorUid) {
        throw new HttpsError("permission-denied", "Solo el invitador puede emitir esta notificacion.");
      }
      if (String(inviteData.status || "pending") !== "pending") {
        throw new HttpsError("failed-precondition", "La invitacion ya no esta pendiente.");
      }

      const approverUserIds = [...new Set(
        Array.isArray(inviteData.approverUserIds)
          ? inviteData.approverUserIds.map((value) => String(value || "").trim()).filter(Boolean)
          : []
      )];
      if (approverUserIds.length === 0) {
        throw new HttpsError("failed-precondition", "La invitacion no tiene aprobadores.");
      }

      const participantProfiles = dedupeNotificationParticipantProfiles(inviteData.participantProfiles || []);
      const requestedUserId = normalizeNotificationString(inviteData.requestedUserId, 120);
      const requestedUsername = participantProfiles.find((item) => item.userId === requestedUserId)?.username || "Usuario";
      const expiresAtMs = Number.parseInt(String(inviteData.expiresAtMs || "0"), 10) || (Date.now() + 2 * 60 * 1000);

      const created = await createMultipleUserNotifications(
        approverUserIds.map((targetUserId) => ({
          userId: targetUserId,
          payload: {
            ...senderIdentity,
            to: targetUserId,
            type: "private_group_invite_request",
            inviteId,
            sourceChatId: normalizeNotificationString(inviteData.sourceChatId, 120) || null,
            requestedUserId,
            requestedUsername,
            participantProfiles,
            approverUserIds,
            read: false,
            status: "pending",
            expiresAtMs,
          },
        }))
      );

      return { success: true, created };
    }

    if (action === "private_group_invite_rejected") {
      const inviteId = normalizeNotificationString(payload.inviteId, 120);
      if (!inviteId) {
        throw new HttpsError("invalid-argument", "inviteId es requerido.");
      }

      const inviteDoc = await db.collection(PRIVATE_GROUP_INVITES_COLLECTION).doc(inviteId).get();
      if (!inviteDoc.exists) {
        throw new HttpsError("not-found", "Invitacion no encontrada.");
      }

      const inviteData = inviteDoc.data() || {};
      const allParticipantIds = [...new Set(
        Array.isArray(inviteData.allParticipantIds)
          ? inviteData.allParticipantIds.map((value) => String(value || "").trim()).filter(Boolean)
          : []
      )];
      if (!allParticipantIds.includes(actorUid)) {
        throw new HttpsError("permission-denied", "No participas en esta invitacion.");
      }
      if (String(inviteData.status || "") !== "rejected") {
        throw new HttpsError("failed-precondition", "La invitacion no esta rechazada.");
      }

      const participantProfiles = dedupeNotificationParticipantProfiles(inviteData.participantProfiles || []);
      const requestedUserId = normalizeNotificationString(inviteData.requestedUserId, 120);
      const requestedUsername = participantProfiles.find((item) => item.userId === requestedUserId)?.username || "Usuario";
      const targetUserIds = allParticipantIds.filter((userId) => userId !== actorUid);

      const created = await createMultipleUserNotifications(
        targetUserIds.map((targetUserId) => ({
          userId: targetUserId,
          payload: {
            ...senderIdentity,
            to: targetUserId,
            type: "private_group_invite_rejected",
            inviteId,
            requestedUserId: requestedUserId || null,
            requestedUsername,
            participantProfiles,
            read: false,
          },
        }))
      );

      return { success: true, created };
    }

    if (action === "private_group_chat_ready") {
      const inviteId = normalizeNotificationString(payload.inviteId, 120);
      if (!inviteId) {
        throw new HttpsError("invalid-argument", "inviteId es requerido.");
      }

      const inviteDoc = await db.collection(PRIVATE_GROUP_INVITES_COLLECTION).doc(inviteId).get();
      if (!inviteDoc.exists) {
        throw new HttpsError("not-found", "Invitacion no encontrada.");
      }

      const inviteData = inviteDoc.data() || {};
      const participantProfiles = dedupeNotificationParticipantProfiles(inviteData.participantProfiles || []);
      const participantUserIds = [...new Set(participantProfiles.map((item) => item.userId).filter(Boolean))];
      if (!participantUserIds.includes(actorUid)) {
        throw new HttpsError("permission-denied", "No participas en esta invitacion.");
      }
      if (String(inviteData.status || "") !== "completed") {
        throw new HttpsError("failed-precondition", "La invitacion aun no esta completada.");
      }

      const inviterId = normalizeNotificationString(inviteData.inviterId, 120) || actorUid;
      const inviterData = await getUserDataById(inviterId);
      const inviterIdentity = getSenderNotificationIdentity(inviterId, inviterData);
      const title = normalizeNotificationString(inviteData.title, 160)
        || buildPrivateGroupTitleForNotifications(participantProfiles, actorUid);
      const chatId = normalizeNotificationString(inviteData.targetChatId, 120);

      const created = await createMultipleUserNotifications(
        participantUserIds.map((targetUserId) => ({
          userId: targetUserId,
          payload: {
            ...inviterIdentity,
            to: targetUserId,
            type: "private_group_chat_ready",
            inviteId,
            chatId,
            participantProfiles,
            title,
            read: false,
          },
        }))
      );

      return { success: true, created };
    }

    if (action === "private_chat_request") {
      const toUserId = normalizeNotificationString(payload.toUserId, 120);
      if (!toUserId || toUserId === actorUid) {
        throw new HttpsError("invalid-argument", "toUserId no es valido.");
      }

      await assertNotificationTargetUserExists(toUserId);
      await enforceNotificationActionRateLimit(actorUid, action, {
        targetUserId: toUserId,
        windowMs: 60 * 60 * 1000,
        maxCount: 8,
        targetCooldownMs: 10 * 60 * 1000,
      });

      const blocked = await isBlockedBetweenUsers(actorUid, toUserId);
      if (blocked) {
        throw new HttpsError("permission-denied", "No puedes solicitar chat privado con este usuario.");
      }

      const notificationId = await createUserNotificationRecord(toUserId, {
        ...senderIdentity,
        to: toUserId,
        content: `${senderIdentity.fromUsername} quiere conectar contigo en chat privado`,
        type: "private_chat_request",
        status: "pending",
        read: false,
        source: normalizeNotificationString(payload.source, 80) || "manual",
        ...(normalizeNotificationString(payload.systemPrompt, 280) ? { systemPrompt: normalizeNotificationString(payload.systemPrompt, 280) } : {}),
        ...(normalizeNotificationString(payload.suggestedStarter, 280) ? { suggestedStarter: normalizeNotificationString(payload.suggestedStarter, 280) } : {}),
      });

      await recordNotificationActionLog(actorUid, action, toUserId, {
        requestId: notificationId,
        source: normalizeNotificationString(payload.source, 80) || "manual",
      });

      return { success: true, requestId: notificationId };
    }

    if (action === "private_chat_request_response") {
      const requestId = normalizeNotificationString(payload.requestId, 120);
      const accepted = normalizeNotificationBoolean(payload.accepted);
      const chatId = normalizeNotificationString(payload.chatId, 120);
      if (!requestId) {
        throw new HttpsError("invalid-argument", "requestId es requerido.");
      }
      if (accepted && !chatId) {
        throw new HttpsError("invalid-argument", "chatId es requerido cuando la solicitud fue aceptada.");
      }

      const requestDoc = await db.collection("users").doc(actorUid).collection("notifications").doc(requestId).get();
      if (!requestDoc.exists) {
        throw new HttpsError("not-found", "Solicitud no encontrada.");
      }

      const requestData = requestDoc.data() || {};
      if (String(requestData.type || "") !== "private_chat_request") {
        throw new HttpsError("failed-precondition", "La notificacion no corresponde a una solicitud de chat.");
      }

      const originalSenderId = normalizeNotificationString(requestData.from, 120);
      if (!originalSenderId) {
        throw new HttpsError("failed-precondition", "La solicitud no tiene remitente.");
      }

      const requestStatus = normalizeNotificationString(requestData.status, 40) || "pending";
      if (accepted && !["pending", "accepted"].includes(requestStatus)) {
        throw new HttpsError("failed-precondition", "La solicitud ya no puede aceptarse.");
      }
      if (!accepted && !["pending", "rejected"].includes(requestStatus)) {
        throw new HttpsError("failed-precondition", "La solicitud ya no puede rechazarse.");
      }

      const blocked = await isBlockedBetweenUsers(actorUid, originalSenderId);
      if (blocked) {
        throw new HttpsError("permission-denied", "No puedes responder a una solicitud bloqueada.");
      }

      if (accepted) {
        const chatDoc = await db.collection("private_chats").doc(chatId).get();
        if (!chatDoc.exists) {
          throw new HttpsError("not-found", "Chat privado no encontrado.");
        }

        const participants = Array.isArray(chatDoc.data()?.participants) ? chatDoc.data().participants : [];
        if (!participants.includes(actorUid) || !participants.includes(originalSenderId)) {
          throw new HttpsError("permission-denied", "El chat aceptado no coincide con la solicitud.");
        }
      }

      const notificationId = await createUserNotificationRecord(originalSenderId, {
        ...senderIdentity,
        to: originalSenderId,
        type: accepted ? "private_chat_accepted" : "private_chat_rejected",
        ...(accepted ? { chatId } : {}),
        ...(accepted ? {} : { source: normalizeNotificationString(requestData.source, 80) || "manual" }),
        requestId,
        read: false,
      });

      return { success: true, notificationId };
    }

    if (action === "profile_comment") {
      const toUserId = normalizeNotificationString(payload.toUserId, 120);
      const content = normalizeNotificationString(payload.content, 500);
      if (!toUserId || !content || toUserId === actorUid) {
        throw new HttpsError("invalid-argument", "Comentario o destinatario invalido.");
      }

      await assertNotificationTargetUserExists(toUserId);
      await enforceNotificationActionRateLimit(actorUid, action, {
        targetUserId: toUserId,
        windowMs: 60 * 60 * 1000,
        maxCount: 6,
        targetCooldownMs: 5 * 60 * 1000,
      });

      const blocked = await isBlockedBetweenUsers(actorUid, toUserId);
      if (blocked) {
        throw new HttpsError("permission-denied", "No puedes comentar a un usuario bloqueado.");
      }

      const notificationId = await createUserNotificationRecord(toUserId, {
        ...senderIdentity,
        to: toUserId,
        content,
        type: "profile_comment",
        read: false,
      });

      await recordNotificationActionLog(actorUid, action, toUserId, {
        contentPreview: content.slice(0, 120),
      });

      return { success: true, notificationId };
    }

    if (action === "opin_reply") {
      const postId = normalizeNotificationString(payload.postId, 120);
      const commentId = normalizeNotificationString(payload.commentId, 120);
      if (!postId || !commentId) {
        throw new HttpsError("invalid-argument", "postId y commentId son requeridos.");
      }

      const [postDoc, commentDoc] = await Promise.all([
        db.collection("opin_posts").doc(postId).get(),
        db.collection("opin_comments").doc(commentId).get(),
      ]);

      if (!postDoc.exists || !commentDoc.exists) {
        throw new HttpsError("not-found", "Post o comentario no encontrado.");
      }

      const postData = postDoc.data() || {};
      const commentData = commentDoc.data() || {};
      if (String(commentData.postId || "") !== postId) {
        throw new HttpsError("failed-precondition", "Comentario no corresponde al post.");
      }
      if (String(commentData.userId || "") !== actorUid) {
        throw new HttpsError("permission-denied", "Solo el autor del comentario puede notificar esta respuesta.");
      }

      const targetUserId = normalizeNotificationString(postData.userId, 120);
      if (!targetUserId || targetUserId === actorUid) {
        return { success: true, skipped: true };
      }

      const commenterName = normalizeNotificationString(commentData.username, 80) || senderIdentity.fromUsername;
      const commentText = normalizeNotificationString(commentData.comment, 150);
      const replySnippet = commentText.length > 90 ? `${commentText.slice(0, 90)}...` : commentText;
      const postSnippetRaw = normalizeNotificationString(postData.text, 160);
      const postPreview = postSnippetRaw.length > 110 ? `${postSnippetRaw.slice(0, 110)}...` : postSnippetRaw;

      const notificationId = await createUserNotificationRecord(targetUserId, {
        from: actorUid,
        fromUsername: commenterName,
        fromAvatar: normalizeNotificationString(commentData.avatar, 500) || senderIdentity.fromAvatar,
        to: targetUserId,
        type: "opin_reply",
        title: `${commenterName} respondió tu OPIN`,
        content: replySnippet || "Alguien respondió tu nota en OPIN",
        postId,
        commentId,
        postPreview,
        read: false,
        url: `/opin?postId=${postId}&openComments=1`,
        tag: `opin_reply_${postId}`,
      });

      return { success: true, notificationId };
    }

    if (action === "tarjeta_like") {
      const toUserId = normalizeNotificationString(payload.toUserId, 120);
      if (!toUserId || toUserId === actorUid) {
        throw new HttpsError("invalid-argument", "toUserId no es valido.");
      }

      await assertNotificationTargetUserExists(toUserId);
      await enforceNotificationActionRateLimit(actorUid, action, {
        targetUserId: toUserId,
        windowMs: 60 * 60 * 1000,
        maxCount: 80,
        targetCooldownMs: 30 * 1000,
      });

      const blocked = await isBlockedBetweenUsers(actorUid, toUserId);
      if (blocked) {
        throw new HttpsError("permission-denied", "No puedes interactuar con un usuario bloqueado.");
      }

      const targetCardSnap = await db.collection("tarjetas").doc(toUserId).get();
      if (!targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
      }

      const notificationId = await createUserNotificationRecord(toUserId, {
        type: "tarjeta_like",
        fromUserId: actorUid,
        fromUsername: senderIdentity.fromUsername,
        message: `${senderIdentity.fromUsername} le dio like a tu tarjeta`,
        read: false,
      });

      await recordNotificationActionLog(actorUid, action, toUserId, {
        notificationId,
      });

      return { success: true, notificationId };
    }

    if (action === "ticket_update") {
      const toUserId = normalizeNotificationString(payload.toUserId, 120);
      const type = normalizeNotificationString(payload.type, 80);
      const ticketId = normalizeNotificationString(payload.ticketId, 120);
      const title = normalizeNotificationString(payload.title, 180);
      const body = normalizeNotificationString(payload.body, 1000);
      if (!toUserId || !type || !ticketId || !title || !body) {
        throw new HttpsError("invalid-argument", "Faltan datos de la notificacion del ticket.");
      }

      await assertAdminOrSupportActor(actorUid);
      const notificationId = await createUserNotificationRecord(toUserId, {
        type,
        ticketId,
        title,
        body,
        read: false,
      });

      return { success: true, notificationId };
    }

    if (action === "system_welcome") {
      const targetUserId = normalizeNotificationString(payload.userId, 120) || actorUid;
      if (targetUserId !== actorUid) {
        await assertAdminOrSupportActor(actorUid);
      }

      const username = normalizeNotificationString(payload.username || actorData.username, 80);
      const notificationId = await createUserNotificationRecord(targetUserId, {
        type: "system_welcome",
        title: "¡Ya estás dentro de Chactivo! 🔥",
        content: `Bienvenido ${username || ""}. Entra a la sala y empieza a conversar 😉`.trim(),
        from: "system",
        fromName: "Chactivo",
        fromAvatar: "/transparente_logo.png",
        status: "unread",
        read: false,
        metadata: {
          link: "/chat/principal",
          priority: "high",
        },
      });

      return { success: true, notificationId };
    }

    throw new HttpsError("invalid-argument", "Action no soportada.");
  }
);

exports.trackAnalyticsEvent = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesion.");
  }

  const eventType = sanitizeAnalyticsEventType(request.data?.eventType || request.data?.type || "");
  if (!eventType) {
    throw new HttpsError("invalid-argument", "eventType es requerido.");
  }

  const eventData = request.data?.eventData && typeof request.data.eventData === "object" ?
    request.data.eventData :
    {};

  const actorUid = request.auth.uid;
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0];
  const statsRef = db.collection("analytics_stats").doc(dateKey);
  const updates = {
    date: dateKey,
    lastUpdated: FieldValue.serverTimestamp(),
  };

  let handled = false;
  const pagePath = normalizeNotificationString(eventData.pagePath, 240);
  const source = normalizeNotificationString(eventData.source, 120);
  const sessionId = normalizeNotificationString(eventData.sessionId, 120);
  const roomId = normalizeNotificationString(eventData.roomId, 120);
  const roomName = normalizeNotificationString(eventData.roomName, 120);
  const campaign = normalizeNotificationString(eventData.campaign, 120);
  const medium = normalizeNotificationString(eventData.medium, 120);

  switch (eventType) {
    case "page_view": {
      updates.pageViews = FieldValue.increment(1);
      if (pagePath) {
        const pageKey = sanitizeAnalyticsSegment(pagePath);
        updates.lastPagePath = pagePath;
        updates[`pageViewsByPath.${pageKey}`] = FieldValue.increment(1);
        updates[`pagePathMap.${pageKey}`] = pagePath;
      }
      const timeBucket = getAnalyticsTimeBucket(eventData.timeOnPage);
      if (timeBucket) {
        updates[`timeDistribution.${timeBucket}`] = FieldValue.increment(1);
      }
      if (source) {
        updates[`trafficSources.${sanitizeAnalyticsSegment(source)}`] = FieldValue.increment(1);
      }
      if (campaign) {
        updates[`campaigns.${sanitizeAnalyticsSegment(campaign)}`] = FieldValue.increment(1);
      }
      handled = true;
      break;
    }
    case "user_register":
      updates.registrations = FieldValue.increment(1);
      handled = true;
      break;
    case "user_login":
      updates.logins = FieldValue.increment(1);
      handled = true;
      break;
    case "message_sent":
      updates.messagesSent = FieldValue.increment(1);
      handled = true;
      break;
    case "room_created":
      updates.roomsCreated = FieldValue.increment(1);
      handled = true;
      break;
    case "room_joined":
      updates.roomsJoined = FieldValue.increment(1);
      handled = true;
      break;
    case "page_exit": {
      updates.pageExits = FieldValue.increment(1);
      if (pagePath) {
        const pageKey = sanitizeAnalyticsSegment(pagePath);
        updates.lastExitPage = pagePath;
        updates[`exitPagesByPath.${pageKey}`] = FieldValue.increment(1);
        updates[`pagePathMap.${pageKey}`] = pagePath;
      }
      const timeBucket = getAnalyticsTimeBucket(eventData.timeOnPage);
      if (timeBucket) {
        updates[`exitTimeDistribution.${timeBucket}`] = FieldValue.increment(1);
      }
      handled = true;
      break;
    }
    default:
      break;
  }

  if (!handled) {
    updates[`customEvents.${eventType}`] = FieldValue.increment(1);
  }

  await statsRef.set(updates, { merge: true });

  const storedEventTypes = new Set([
    "user_login",
    "user_register",
    "message_sent",
    "landing_view",
    "entry_to_chat",
    "auth_page_view",
    "auth_submit",
    "auth_success",
    "chat_room_view",
    "first_message_sent",
    "onboarding_chip_click",
    "onboarding_prompt_click",
    "onboarding_nudge_shown",
    "onboarding_dismissed",
    "onboarding_first_message_sent",
    "onboarding_time_to_first_message",
    "baul_view",
    "opin_feed_view",
    "opin_view",
    "opin_like",
    "opin_comment",
    "opin_reaction",
    "opin_status_updated",
    "opin_follow_toggle",
    "match_private_chat_started",
  ]);

  if (storedEventTypes.has(eventType)) {
    const sessionPart = String(sessionId || "nosession").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    await db.collection("analytics_events").doc(
      `${dateKey}_${eventType}_${sessionPart}_${actorUid}_${Date.now()}`
    ).set({
      type: eventType,
      userId: actorUid,
      sessionId: sessionId || null,
      date: dateKey,
      timestamp: FieldValue.serverTimestamp(),
      pagePath: pagePath || null,
      roomId: roomId || null,
      roomName: roomName || null,
      mode: normalizeNotificationString(eventData.mode, 80) || null,
      source: source || null,
      medium: medium || null,
      campaign: campaign || null,
      isGuest: Boolean(eventData.isGuest),
      isAnonymous: isAnonymousAuthRequest(request) || Boolean(eventData.isAnonymous),
    });
  }

  return { success: true };
});

exports.recordTarjetaInteraction = onCall(async (request) => {
  const { uid: actorUid } = await assertRegisteredCallableRequest(request);
  const action = normalizeNotificationString(request.data?.action, 80);
  const targetUserId = normalizeNotificationString(request.data?.targetUserId || request.data?.tarjetaId, 120);
  const payload = request.data?.payload && typeof request.data.payload === "object" ?
    request.data.payload :
    {};

  if (!action) {
    throw new HttpsError("invalid-argument", "action es requerido.");
  }

  const actorIdentity = await getTarjetaIdentity(actorUid);

  if (action === "mark_activity_read") {
    const actorCardRef = db.collection("tarjetas").doc(actorUid);
    const actorCardSnap = await actorCardRef.get();
    if (!actorCardSnap.exists) {
      throw new HttpsError("not-found", "Tu tarjeta no existe.");
    }

    await actorCardRef.set({
      odIdUsuari: actorUid,
      actividadNoLeida: 0,
      actualizadaEn: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { success: true };
  }

  if (!targetUserId || targetUserId === actorUid) {
    throw new HttpsError("invalid-argument", "targetUserId no es valido.");
  }

  const blocked = await isBlockedBetweenUsers(actorUid, targetUserId);
  if (blocked) {
    throw new HttpsError("permission-denied", "No puedes interactuar con un usuario bloqueado.");
  }

  const targetIdentity = await getTarjetaIdentity(targetUserId);
  if (!targetIdentity.exists) {
    throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
  }

  const actorCardRef = db.collection("tarjetas").doc(actorUid);
  const targetCardRef = db.collection("tarjetas").doc(targetUserId);

  if (action === "toggle_like") {
    const matchId = [actorUid, targetUserId].sort().join("_");
    const matchRef = db.collection("matches").doc(matchId);

    const result = await db.runTransaction(async (tx) => {
      const [actorCardSnap, targetCardSnap, matchSnap] = await Promise.all([
        tx.get(actorCardRef),
        tx.get(targetCardRef),
        tx.get(matchRef),
      ]);

      if (!actorCardSnap.exists || !targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta no encontrada.");
      }

      const actorCard = actorCardSnap.data() || {};
      const targetCard = targetCardSnap.data() || {};
      const targetLikesDe = Array.isArray(targetCard.likesDe) ? targetCard.likesDe : [];
      const actorLikesDe = Array.isArray(actorCard.likesDe) ? actorCard.likesDe : [];
      const alreadyLiked = targetLikesDe.includes(actorUid);

      if (alreadyLiked) {
        tx.update(targetCardRef, {
          likesRecibidos: Math.max(Number(targetCard.likesRecibidos || 0) - 1, 0),
          likesDe: buildTarjetaArrayWithoutValue(targetLikesDe, actorUid),
          actualizadaEn: FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          liked: false,
          isMatch: false,
        };
      }

      const isMatch = actorLikesDe.includes(targetUserId);
      const nextTargetActivity = Number(targetCard.actividadNoLeida || 0) + (isMatch ? 2 : 1);

      tx.update(targetCardRef, {
        likesRecibidos: Number(targetCard.likesRecibidos || 0) + 1,
        likesDe: buildTarjetaArrayWithCap(targetLikesDe, actorUid, TARJETA_MAX_LIKES_DE),
        actividadNoLeida: nextTargetActivity,
        actualizadaEn: FieldValue.serverTimestamp(),
      });

      tx.set(targetCardRef.collection("actividad").doc(), {
        tipo: "like",
        deUserId: actorUid,
        deUsername: actorIdentity.nombre || actorIdentity.username,
        leida: false,
        timestamp: FieldValue.serverTimestamp(),
      });

      let matchData = null;
      if (isMatch && !matchSnap.exists) {
        matchData = {
          id: matchId,
          users: [actorUid, targetUserId].sort(),
          user1Id: actorUid,
          user2Id: targetUserId,
          userA: {
            odIdUsuari: actorUid,
            username: actorIdentity.username,
            avatar: actorIdentity.avatar || "",
            nombre: actorIdentity.nombre,
          },
          userB: {
            odIdUsuari: targetUserId,
            username: targetIdentity.username,
            avatar: targetIdentity.avatar || "",
            nombre: targetIdentity.nombre,
          },
          createdAt: FieldValue.serverTimestamp(),
          lastInteraction: FieldValue.serverTimestamp(),
          status: "active",
          chatStarted: false,
          unreadByA: true,
          unreadByB: true,
        };

        tx.set(matchRef, matchData);
        tx.set(actorCardRef.collection("actividad").doc(), {
          tipo: "match",
          deUserId: targetUserId,
          deUsername: targetIdentity.nombre,
          mensaje: `¡Hiciste match con ${targetIdentity.nombre}!`,
          matchId,
          leida: false,
          timestamp: FieldValue.serverTimestamp(),
        });
        tx.set(targetCardRef.collection("actividad").doc(), {
          tipo: "match",
          deUserId: actorUid,
          deUsername: actorIdentity.nombre,
          mensaje: `¡Hiciste match con ${actorIdentity.nombre}!`,
          matchId,
          leida: false,
          timestamp: FieldValue.serverTimestamp(),
        });
        tx.update(actorCardRef, {
          actividadNoLeida: Number(actorCard.actividadNoLeida || 0) + 1,
          actualizadaEn: FieldValue.serverTimestamp(),
        });
      }

      return {
        success: true,
        liked: true,
        isMatch,
        matchData,
      };
    });

    if (result.liked) {
      await createUserNotificationRecord(targetUserId, {
        type: "tarjeta_like",
        fromUserId: actorUid,
        fromUsername: actorIdentity.username,
        message: `${actorIdentity.username} le dio like a tu tarjeta`,
        read: false,
      }).catch(() => null);
    }

    return result;
  }

  if (action === "send_message") {
    const message = normalizeNotificationString(payload.message, 200);
    if (!message) {
      throw new HttpsError("invalid-argument", "message es requerido.");
    }

    await db.runTransaction(async (tx) => {
      const targetCardSnap = await tx.get(targetCardRef);
      if (!targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
      }

      const targetCard = targetCardSnap.data() || {};
      tx.update(targetCardRef, {
        mensajesRecibidos: Number(targetCard.mensajesRecibidos || 0) + 1,
        actividadNoLeida: Number(targetCard.actividadNoLeida || 0) + 1,
        actualizadaEn: FieldValue.serverTimestamp(),
      });
      tx.set(targetCardRef.collection("actividad").doc(), {
        tipo: "mensaje",
        deUserId: actorUid,
        deUsername: actorIdentity.nombre || actorIdentity.username,
        mensaje: message,
        leida: false,
        timestamp: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  }

  if (action === "record_visit") {
    return db.runTransaction(async (tx) => {
      const targetCardSnap = await tx.get(targetCardRef);
      if (!targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
      }

      const targetCard = targetCardSnap.data() || {};
      const visitasDe = Array.isArray(targetCard.visitasDe) ? targetCard.visitasDe : [];
      if (visitasDe.includes(actorUid)) {
        return { success: true, skipped: true };
      }

      tx.update(targetCardRef, {
        visitasRecibidas: Number(targetCard.visitasRecibidas || 0) + 1,
        visitasDe: buildTarjetaArrayWithCap(visitasDe, actorUid, TARJETA_MAX_VISITAS_DE),
        actividadNoLeida: Number(targetCard.actividadNoLeida || 0) + 1,
        actualizadaEn: FieldValue.serverTimestamp(),
      });
      tx.set(targetCardRef.collection("actividad").doc(), {
        tipo: "visita",
        deUserId: actorUid,
        deUsername: actorIdentity.nombre || actorIdentity.username,
        leida: false,
        timestamp: FieldValue.serverTimestamp(),
      });

      return { success: true, skipped: false };
    });
  }

  if (action === "record_impression") {
    const today = getChileDayString(new Date()) || new Date().toISOString().slice(0, 10);
    const impressionKey = `${actorUid}_${today}`;

    return db.runTransaction(async (tx) => {
      const targetCardSnap = await tx.get(targetCardRef);
      if (!targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
      }

      const targetCard = targetCardSnap.data() || {};
      const impresionesDe = Array.isArray(targetCard.impresionesDe) ? targetCard.impresionesDe : [];
      if (impresionesDe.includes(impressionKey)) {
        return { success: true, skipped: true };
      }

      tx.update(targetCardRef, {
        impresionesRecibidas: Number(targetCard.impresionesRecibidas || 0) + 1,
        impresionesDe: buildTarjetaArrayWithCap(impresionesDe, impressionKey, TARJETA_MAX_IMPRESIONES_DE),
        actualizadaEn: FieldValue.serverTimestamp(),
      });

      return { success: true, skipped: false };
    });
  }

  if (action === "leave_footprint") {
    const today = getChileDayString(new Date()) || new Date().toISOString().slice(0, 10);
    const huellaKey = `${actorUid}_${today}`;
    const userHuellasRef = db.collection("userHuellas").doc(actorUid);

    return db.runTransaction(async (tx) => {
      const [targetCardSnap, userHuellasSnap] = await Promise.all([
        tx.get(targetCardRef),
        tx.get(userHuellasRef),
      ]);

      if (!targetCardSnap.exists) {
        throw new HttpsError("not-found", "Tarjeta destinataria no encontrada.");
      }

      const targetCard = targetCardSnap.data() || {};
      const huellasDe = Array.isArray(targetCard.huellasDe) ? targetCard.huellasDe : [];
      if (huellasDe.includes(huellaKey)) {
        return { success: false, reason: "already_left", message: "Ya pasaste por aqui hoy" };
      }

      const userHuellas = userHuellasSnap.exists ? userHuellasSnap.data() || {} : {};
      const storedDate = String(userHuellas.date || "");
      const count = storedDate === today ? Number(userHuellas.count || 0) : 0;
      if (count >= TARJETA_HUELLAS_MAX_POR_DIA) {
        return {
          success: false,
          reason: "limit",
          message: `Maximo ${TARJETA_HUELLAS_MAX_POR_DIA} huellas por dia`,
        };
      }

      tx.update(targetCardRef, {
        huellasRecibidas: Number(targetCard.huellasRecibidas || 0) + 1,
        huellasDe: buildTarjetaArrayWithCap(huellasDe, huellaKey, TARJETA_MAX_HUELLAS_DE),
        actividadNoLeida: Number(targetCard.actividadNoLeida || 0) + 1,
        actualizadaEn: FieldValue.serverTimestamp(),
      });
      tx.set(userHuellasRef, {
        count: count + 1,
        date: today,
        lastAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(targetCardRef.collection("actividad").doc(), {
        tipo: "huella",
        deUserId: actorUid,
        deUsername: actorIdentity.nombre || actorIdentity.username,
        mensaje: `${actorIdentity.nombre || actorIdentity.username} paso por tu perfil`,
        leida: false,
        timestamp: FieldValue.serverTimestamp(),
      });

      return { success: true };
    });
  }

  throw new HttpsError("invalid-argument", "Action no soportada.");
});

/**
 * archiveRoomMessageForAdminHistory
 * Trigger: rooms/{roomId}/messages/{messageId} onCreate
 * Guarda una copia mínima por mensaje en Cloud Storage para análisis admin.
 */
exports.archiveRoomMessageForAdminHistory = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const roomId = String(event.params.roomId || "").trim();
    const messageId = String(event.params.messageId || "").trim();
    const messageData = event.data?.data() || {};

    if (!roomId || !messageId) {
      return null;
    }

    try {
      const entry = buildRoomHistoryEntry(messageData, roomId, messageId);
      const objectPath = getHistoryRawPath(roomId, entry.dayString, messageId, entry.createdAtMs);
      const file = storage.bucket().file(objectPath);

      await file.save(JSON.stringify(entry), {
        resumable: false,
        contentType: "application/json; charset=utf-8",
      });

      console.log(`[ROOM_HISTORY] Archived message roomId=${roomId} messageId=${messageId} path=${objectPath}`);
    } catch (error) {
      console.error(`[ROOM_HISTORY] Error archiving message roomId=${roomId} messageId=${messageId}`, error);
    }

    return null;
  }
);

/**
 * cleanupRoomMessageMedia
 * Trigger: rooms/{roomId}/messages/{messageId} onDelete
 * Borra media asociada con Admin SDK para cubrir borrados de usuario/admin.
 */
exports.cleanupRoomMessageMedia = onDocumentDeleted(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => cleanupDeletedMessageMediaFromEvent(event, "room_message")
);

/**
 * syncPublicUserProfileMirror
 * Trigger: users/{userId} onWrite
 * Mantiene un espejo público mínimo para perfiles visibles sin exponer /users completo.
 */
exports.syncPublicUserProfileMirror = onDocumentWritten(
  "users/{userId}",
  async (event) => {
    const userId = String(event.params.userId || "").trim();
    if (!userId) {
      return null;
    }

    const targetRef = db.collection(PUBLIC_USER_PROFILES_COLLECTION).doc(userId);
    const discoverableRef = db.collection(DISCOVERABLE_USER_LOCATIONS_COLLECTION).doc(userId);
    const previousData = event.data?.before?.data?.() || null;
    const nextData = event.data?.after?.data?.() || null;

    if (!nextData) {
      await Promise.all([
        targetRef.delete().catch(() => {}),
        discoverableRef.delete().catch(() => {}),
      ]);
      console.log(`[PUBLIC_PROFILE] Deleted mirror userId=${userId}`);
      return null;
    }

    if (!hasRelevantPublicMirrorChange(previousData, nextData)) {
      console.log(`[PUBLIC_PROFILE] Skip sync userId=${userId} reason=no_relevant_public_change`);
      return null;
    }

    const publicProfile = buildPublicUserProfile(userId, nextData);
    const discoverableLocation = buildDiscoverableUserLocation(userId, nextData);

    await targetRef.set(publicProfile);
    if (discoverableLocation) {
      await discoverableRef.set(discoverableLocation);
    } else {
      await discoverableRef.delete().catch(() => {});
    }
    console.log(`[PUBLIC_PROFILE] Synced mirror userId=${userId}`);
    return null;
  }
);

/**
 * backfillPublicUserProfiles
 * Callable admin-only: genera o corrige el espejo público para usuarios existentes.
 */
exports.backfillPublicUserProfiles = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    await assertAdminCallableRequest(request);

    const usersSnap = await db.collection("users").get();
    let batch = db.batch();
    let pendingOps = 0;
    let processed = 0;

    for (const userDoc of usersSnap.docs) {
      const userId = String(userDoc.id || "").trim();
      if (!userId) continue;

      const targetRef = db.collection(PUBLIC_USER_PROFILES_COLLECTION).doc(userId);
      const discoverableRef = db.collection(DISCOVERABLE_USER_LOCATIONS_COLLECTION).doc(userId);
      const publicProfile = buildPublicUserProfile(userId, userDoc.data() || {});
      const discoverableLocation = buildDiscoverableUserLocation(userId, userDoc.data() || {});
      batch.set(targetRef, publicProfile);
      if (discoverableLocation) {
        batch.set(discoverableRef, discoverableLocation);
      } else {
        batch.delete(discoverableRef);
      }
      pendingOps += 1;
      processed += 1;

      if (pendingOps >= 180) {
        await batch.commit();
        batch = db.batch();
        pendingOps = 0;
      }
    }

    if (pendingOps > 0) {
      await batch.commit();
    }

    console.log(`[PUBLIC_PROFILE] Backfill completed processed=${processed}`);
    return {
      success: true,
      processed,
      collection: PUBLIC_USER_PROFILES_COLLECTION,
      discoverableCollection: DISCOVERABLE_USER_LOCATIONS_COLLECTION,
    };
  }
);

/**
 * getPrivateChatSharedContacts
 * Callable autenticada: devuelve telefonos ya compartidos y visibles dentro de un chat privado.
 */
exports.getPrivateChatSharedContacts = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const actorUid = String(request.auth?.uid || "").trim();
    if (!actorUid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const chatId = normalizeNotificationString(request.data?.chatId, 120);
    if (!chatId) {
      throw new HttpsError("invalid-argument", "chatId es requerido.");
    }

    const requestedOwnerIds = Array.isArray(request.data?.ownerIds)
      ? request.data.ownerIds.map((value) => String(value || "").trim()).filter(Boolean)
      : [];

    const chatDoc = await db.collection("private_chats").doc(chatId).get();
    if (!chatDoc.exists) {
      throw new HttpsError("not-found", "Chat privado no encontrado.");
    }

    const chatData = chatDoc.data() || {};
    const participants = Array.isArray(chatData.participants) ? chatData.participants : [];
    if (!participants.includes(actorUid)) {
      throw new HttpsError("permission-denied", "No participas en este chat.");
    }

    const ownerIds = [...new Set(
      (requestedOwnerIds.length > 0 ? requestedOwnerIds : participants)
        .filter((ownerId) => ownerId && ownerId !== actorUid)
    )];

    const contacts = {};
    for (const ownerId of ownerIds) {
      const visibility = chatData?.contactShareVisibility?.[ownerId]?.[actorUid];
      if (!visibility) continue;

      const expiresAtMs = Number(visibility?.expiresAtMs || 0) || null;
      if (expiresAtMs && expiresAtMs <= Date.now()) continue;

      const ownerData = await getUserDataById(ownerId);
      const phone = normalizeNotificationString(ownerData.phone, 40);
      if (!phone) continue;

      contacts[ownerId] = {
        userId: ownerId,
        username: normalizeNotificationString(ownerData.username, 80) || "Usuario",
        phone,
      };
    }

    return {
      success: true,
      chatId,
      contacts,
    };
  }
);

/**
 * getFavoriteAudienceCount
 * Callable autenticada: cuenta cuantos usuarios tienen a targetUserId en favoritos.
 */
exports.getFavoriteAudienceCount = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const actorUid = String(request.auth?.uid || "").trim();
    if (!actorUid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const requestedTargetUserId = normalizeNotificationString(request.data?.userId, 120);
    const targetUserId = requestedTargetUserId || actorUid;
    if (targetUserId !== actorUid) {
      const actorData = await getUserDataById(actorUid);
      if (!isAdminOrSupportRoleValue(String(actorData.role || ""))) {
        throw new HttpsError("permission-denied", "No puedes consultar favoritos de otro usuario.");
      }
    }

    const count = await countFavoriteAudienceForUser(targetUserId);
    return {
      success: true,
      userId: targetUserId,
      count,
    };
  }
);

exports.createModerationIncidentAlert = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const actorUid = String(request.auth?.uid || "").trim();
    if (!actorUid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const alertType = normalizeModerationAlertType(request.data?.type);
    if (!alertType) {
      throw new HttpsError("invalid-argument", "Tipo de alerta no valido.");
    }

    const severity = normalizeModerationAlertSeverity(request.data?.severity);
    const roomId = normalizePublicString(request.data?.roomId, 80) || "principal";
    const roomKey = roomId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "principal";
    const reason = normalizePublicString(request.data?.reason, 240) || "Incidente de moderacion detectado";
    const message = normalizePublicString(request.data?.message, 500) || "[sin muestra]";
    const detectedBy = normalizePublicString(request.data?.detectedBy, 40) || "hybrid_moderation";
    const autoAction = normalizePublicString(request.data?.autoAction, 40) || null;

    const [userSnap, guestSnap] = await Promise.all([
      db.collection("users").doc(actorUid).get().catch(() => null),
      db.collection("guests").doc(actorUid).get().catch(() => null),
    ]);

    const userData = userSnap?.exists ? (userSnap.data() || {}) : {};
    const guestData = guestSnap?.exists ? (guestSnap.data() || {}) : {};
    const username =
      normalizePublicString(userData.username || guestData.username || "Usuario", 80) || "Usuario";

    const alertId = `${getChileDayString()}_${actorUid}_${alertType}_${roomKey}`.slice(0, 140);
    const alertRef = db.collection("moderation_alerts").doc(alertId);
    const existingSnap = await alertRef.get().catch(() => null);
    const now = FieldValue.serverTimestamp();

    if (existingSnap?.exists) {
      const existingData = existingSnap.data() || {};
      const repeatCount = Number(existingData.repeatCount || 1) + 1;

      await alertRef.set({
        type: alertType,
        severity,
        userId: actorUid,
        username,
        roomId,
        message,
        latestMessage: message,
        reason,
        status: "pending",
        detectedBy,
        autoAction,
        repeatCount,
        lastDetectedAt: now,
        updatedAt: now,
      }, { merge: true });

      return {
        created: false,
        alertId,
        repeatCount,
      };
    }

    await alertRef.set({
      type: alertType,
      severity,
      userId: actorUid,
      username,
      roomId,
      message,
      latestMessage: message,
      reason,
      status: "pending",
      needsHelp: alertType === "minor_risk",
      detectedBy,
      autoAction,
      repeatCount: 1,
      createdAt: now,
      detectedAt: now,
      lastDetectedAt: now,
      updatedAt: now,
    }, { merge: true });

    return {
      created: true,
      alertId,
      repeatCount: 1,
    };
  }
);

/**
 * generateAdminRoomHistoryReport
 * Callable admin-only: devuelve historial admin de 7 dias directamente al panel.
 * El frontend decide si mostrar, copiar o descargar localmente.
 */
exports.generateAdminRoomHistoryReport = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const admin = await assertAdminCallableRequest(request);
    const roomId = String(request.data?.roomId || "principal").trim();
    const days = 7;

    if (!roomId) {
      throw new HttpsError("invalid-argument", "roomId es requerido.");
    }

    const entries = await loadRoomHistoryEntries(roomId, days);
    const report = await buildRoomHistoryReportPayload({
      roomId,
      days,
      entries,
    });

    return report;
  }
);

/**
 * cleanupAdminRoomHistoryArchive
 * Job diario: elimina raw/generados más antiguos que la retención definida.
 */
exports.cleanupAdminRoomHistoryArchive = onSchedule(
  {
    schedule: "15 3 * * *",
    timeZone: CHILE_TIME_ZONE,
    region: "us-central1",
  },
  async () => {
    const bucket = storage.bucket();
    const currentDay = getChileDayString();
    const [files] = await bucket.getFiles({ prefix: "admin-room-history/" });
    let deleted = 0;

    for (const file of files) {
      const fileDay = extractHistoryDayFromPath(file.name);
      if (!fileDay) continue;

      const diff = getDayDiff(fileDay, currentDay);
      if (diff === null || diff < ADMIN_ROOM_HISTORY_RETENTION_DAYS) {
        continue;
      }

      await file.delete({ ignoreNotFound: true });
      deleted += 1;
    }

    console.log(`[ROOM_HISTORY] Cleanup finished deletedFiles=${deleted}`);
    return null;
  }
);
