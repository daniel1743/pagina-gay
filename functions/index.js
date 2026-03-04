/**
 * Cloud Functions para Chactivo - Push Notifications
 *
 * 3 funciones:
 * 1. notifyOnNewMessage - Push cuando llega DM
 * 2. notifyOnMatch - Push cuando hay match en Baul
 * 3. notifyOnPrivateChatRequest - Push cuando piden chat privado
 *
 * Limites: max 1-2 push por dia por usuario. Quiet hours 00:00-08:00.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
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

const chileDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHILE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getChileDayString(date = new Date()) {
  const parts = chileDayFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
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
  const chileHour = (now.getUTCHours() - 3 + 24) % 24;
  return chileHour >= 0 && chileHour < 8;
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
  if (isQuietHours()) {
    console.log(`[PUSH] Quiet hours - no se envia push a ${userId}`);
    return;
  }

  const tokens = await getUserTokens(userId);
  if (tokens.length === 0) {
    console.log(`[PUSH] Usuario ${userId} no tiene tokens FCM`);
    return;
  }

  // Rate limit: max 2 push por dia
  const today = new Date().toISOString().split("T")[0];
  const rateLimitRef = db.collection("pushRateLimit").doc(`${userId}_${today}`);
  const rateLimitDoc = await rateLimitRef.get();
  const currentCount = rateLimitDoc.exists ? rateLimitDoc.data().count : 0;

  if (currentCount >= 2) {
    console.log(`[PUSH] Rate limit alcanzado para ${userId} (${currentCount}/2 hoy)`);
    return;
  }

  // Incrementar contador
  await rateLimitRef.set({ count: currentCount + 1, lastSent: new Date() }, { merge: true });

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
  } catch (error) {
    console.error(`[PUSH] Error enviando a ${userId}:`, error);
  }
}

/**
 * 1. notifyOnNewMessage
 * Trigger: Nuevo documento en privateChats/{chatId}/messages/{messageId}
 * Envia push al destinatario del DM
 */
exports.notifyOnNewMessage = onDocumentCreated(
  "privateChats/{chatId}/messages/{messageId}",
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const senderId = message.senderId || message.userId;
    const senderName = message.senderName || message.username || "Alguien";
    const text = message.text || "Te envio un mensaje";

    // Obtener info del chat para saber el destinatario
    const chatDoc = await db.collection("privateChats").doc(event.params.chatId).get();
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
      url: `/chat`,
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
 * Trigger: Nuevo documento en users/{userId}/notifications con tipo privateChatRequest
 * Envia push cuando alguien pide chat privado
 */
exports.notifyOnPrivateChatRequest = onDocumentCreated(
  "users/{userId}/notifications/{notificationId}",
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    // Solo procesar solicitudes de chat privado
    if (notification.type !== "privateChatRequest" && notification.type !== "private_chat_request") {
      return;
    }

    const targetUserId = event.params.userId;
    const senderName = notification.fromUsername || notification.senderName || "Alguien";

    await sendPushToUser(targetUserId, {
      title: `${senderName} quiere chatear contigo`,
      body: "Te enviaron una solicitud de chat privado. Entra para responder.",
    }, {
      type: "private_chat_request",
      url: "/chat",
      tag: "private_chat_request",
    });
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
