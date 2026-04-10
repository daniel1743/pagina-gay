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

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
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
const ADMIN_ROOM_HISTORY_RETENTION_DAYS = 14;
const ADMIN_ROOM_HISTORY_DOWNLOAD_TTL_MS = 60 * 60 * 1000;

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

async function writeRoomHistoryReportFiles({ roomId, days, entries, requesterUid }) {
  const bucket = storage.bucket();
  const generatedDay = getChileDayString();
  const generatedAtIso = new Date().toISOString();

  const reportPayload = {
    roomId,
    days,
    generatedAtIso,
    totalMessages: entries.length,
    messages: entries,
  };

  const reportLines = [
    `Sala: ${roomId}`,
    `Ventana: ${days} dias`,
    `Mensajes: ${entries.length}`,
    `Generado: ${generatedAtIso}`,
    "",
    ...entries.map((entry) => formatRoomHistoryReportLine(entry)),
  ];

  const txtPath = getHistoryGeneratedPath(roomId, generatedDay, requesterUid, days, "txt");
  const jsonPath = getHistoryGeneratedPath(roomId, generatedDay, requesterUid, days, "json");
  const txtFile = bucket.file(txtPath);
  const jsonFile = bucket.file(jsonPath);

  await Promise.all([
    txtFile.save(reportLines.join("\n"), {
      resumable: false,
      contentType: "text/plain; charset=utf-8",
    }),
    jsonFile.save(JSON.stringify(reportPayload, null, 2), {
      resumable: false,
      contentType: "application/json; charset=utf-8",
    }),
  ]);

  const expiresAt = Date.now() + ADMIN_ROOM_HISTORY_DOWNLOAD_TTL_MS;
  const [txtDownloadUrl, jsonDownloadUrl] = await Promise.all([
    txtFile.getSignedUrl({ action: "read", expires: expiresAt }).then((result) => result[0]),
    jsonFile.getSignedUrl({ action: "read", expires: expiresAt }).then((result) => result[0]),
  ]);

  return {
    txtDownloadUrl,
    jsonDownloadUrl,
    expiresAtIso: new Date(expiresAt).toISOString(),
    generatedAtIso,
    totalMessages: entries.length,
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

    const senderId = message.senderId || message.userId;
    if (!senderId) return;
    const senderName = message.senderName || message.username || "Alguien";
    const text = message.text || message.content || "Te envio un mensaje";

    // Obtener info del chat para saber el destinatario
    const chatDoc = await db.collection("private_chats").doc(event.params.chatId).get();
    if (!chatDoc.exists) return;

    const chatData = chatDoc.data();
    const participants = chatData.participants || [];
    const recipientId = participants.find((p) => p !== senderId);

    if (!recipientId) return;

    await sendPushToUser(recipientId, {
      title: `${senderName} te escribio`,
      body: text.length > 100 ? text.substring(0, 100) + "..." : text,
    }, {
      type: "dm",
      chatId: event.params.chatId,
      url: "/chat/principal",
      tag: `dm_${event.params.chatId}`,
    });
  }
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

    console.log(`[RETENTION] Retention check roomId=${roomId} messageId=${messageId}`);

    const lockOwner = `${messageId}:${event.id || "no_event_id"}`;
    const lockAcquired = await acquireRetentionLock(roomId, lockOwner);

    if (!lockAcquired) {
      console.log(`[RETENTION] Lock busy, skip roomId=${roomId} messageId=${messageId}`);
      return null;
    }

    console.log(`[RETENTION] Lock acquired roomId=${roomId} owner=${lockOwner}`);

    const messagesRef = db.collection("rooms").doc(roomId).collection("messages");
    let retentionDeletedMessages = 0;
    let retentionDeletedAssets = 0;
    let totalDeletedMessages = 0;
    let totalDeletedAssets = 0;
    let policyDeletedMessages = 0;
    let policyDeletedAssets = 0;
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

      console.log(`[RETENTION] Over limit roomId=${roomId} countReturned=${probeSnap.size}`);

      const oldBatchSnap = await messagesRef
        .orderBy("timestamp", "asc")
        .endAt(cutoffTs)
        .limit(ROOM_RETENTION_DELETE_BATCH)
        .get();

      if (oldBatchSnap.empty) {
        console.warn(`[RETENTION] No candidates found at cutoff roomId=${roomId}, stopping`);
        break;
      }

      console.log(`[RETENTION] Deleting old messages roomId=${roomId} numToDelete=${oldBatchSnap.size}`);

      const docsToDelete = oldBatchSnap.docs;
      const batch = db.batch();
      for (const docSnap of docsToDelete) {
        batch.delete(docSnap.ref);
      }
      await batch.commit();

      retentionDeletedMessages += docsToDelete.length;
      totalDeletedMessages += docsToDelete.length;

      for (const docSnap of docsToDelete) {
        const messageData = docSnap.data() || {};
        const assets = extractMediaPaths(messageData);
        for (const asset of assets) {
          await deleteStorageAsset(asset);
          retentionDeletedAssets += 1;
          totalDeletedAssets += 1;
        }
      }
    }

    try {
      const photoPolicyResult = await enforceImagePolicyForUser(messagesRef, roomId, createdMessageData);
      policyDeletedMessages = photoPolicyResult.deletedMessages;
      policyDeletedAssets = photoPolicyResult.deletedAssets;
      totalDeletedMessages += photoPolicyResult.deletedMessages;
      totalDeletedAssets += photoPolicyResult.deletedAssets;

      if (photoPolicyResult.hourlyOverflow > 0 || photoPolicyResult.visibleOverflow > 0) {
        console.log(
          `[PHOTO_LIMIT] roomId=${roomId} messageId=${messageId} hourlyOverflow=${photoPolicyResult.hourlyOverflow} visibleOverflow=${photoPolicyResult.visibleOverflow}`
        );
      }
    } catch (error) {
      console.error(`[PHOTO_LIMIT] Error enforcing photo policy roomId=${roomId} messageId=${messageId}`, error);
    }

    if (safetyPasses >= MAX_PASSES) {
      console.warn(`[RETENTION] Safety stop reached roomId=${roomId} passes=${MAX_PASSES}`);
    }

    if (retentionDeletedAssets > 0) {
      await recordPhotoMetrics({ photoAssetsDeletedByRetention: retentionDeletedAssets }, new Date()).catch((error) => {
        console.error("[PHOTO_PRIV] Error recording retention delete metrics", error);
      });
    }

    if (policyDeletedMessages > 0 || policyDeletedAssets > 0) {
      await recordPhotoMetrics({
        photoMessagesDeletedByPhotoLimit: policyDeletedMessages,
        photoAssetsDeletedByPhotoLimit: policyDeletedAssets,
      }, new Date()).catch((error) => {
        console.error("[PHOTO_PRIV] Error recording photo limit delete metrics", error);
      });
    }

    const finalProbe = await messagesRef
      .orderBy("timestamp", "desc")
      .limit(ROOM_RETENTION_QUERY_LIMIT)
      .get();

    console.log(
      `[RETENTION] Retention done roomId=${roomId} deletedMessages=${totalDeletedMessages} deletedAssets=${totalDeletedAssets} retentionDeletedMessages=${retentionDeletedMessages} retentionDeletedAssets=${retentionDeletedAssets} policyDeletedMessages=${policyDeletedMessages} policyDeletedAssets=${policyDeletedAssets} finalProbeSize=${finalProbe.size}`
    );

    return null;
  }
);

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
 * generateAdminRoomHistoryReport
 * Callable admin-only: genera informe descargable desde Storage para últimos 7/14 días.
 */
exports.generateAdminRoomHistoryReport = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const admin = await assertAdminCallableRequest(request);
    const roomId = String(request.data?.roomId || "principal").trim();
    const requestedDays = Number.parseInt(String(request.data?.days || "7"), 10);
    const days = requestedDays === 14 ? 14 : 7;

    if (!roomId) {
      throw new HttpsError("invalid-argument", "roomId es requerido.");
    }

    const entries = await loadRoomHistoryEntries(roomId, days);
    const report = await writeRoomHistoryReportFiles({
      roomId,
      days,
      entries,
      requesterUid: admin.uid,
    });

    return {
      roomId,
      days,
      ...report,
    };
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
