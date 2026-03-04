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
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const db = getFirestore();
const storage = getStorage();

const ROOM_RETENTION_MAX_MESSAGES = 200;
const ROOM_RETENTION_QUERY_LIMIT = ROOM_RETENTION_MAX_MESSAGES + 1; // 201
const ROOM_RETENTION_DELETE_BATCH = 50;
const ROOM_RETENTION_LOCK_TTL_MS = 15 * 1000;

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
        const { FieldValue } = require("firebase-admin/firestore");
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
 * enforceRoomRetention
 * Trigger: rooms/{roomId}/messages/{messageId} onCreate
 * Mantiene máximo de 200 mensajes por sala.
 * Si se eliminan mensajes con media en Storage, elimina también esos archivos.
 */
exports.enforceRoomRetention = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const roomId = event.params.roomId;
    const messageId = event.params.messageId;

    console.log(`[RETENTION] Retention check roomId=${roomId} messageId=${messageId}`);

    const lockOwner = `${messageId}:${event.id || "no_event_id"}`;
    const lockAcquired = await acquireRetentionLock(roomId, lockOwner);

    if (!lockAcquired) {
      console.log(`[RETENTION] Lock busy, skip roomId=${roomId} messageId=${messageId}`);
      return null;
    }

    console.log(`[RETENTION] Lock acquired roomId=${roomId} owner=${lockOwner}`);

    const messagesRef = db.collection("rooms").doc(roomId).collection("messages");
    let totalDeletedMessages = 0;
    let totalDeletedAssets = 0;
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

      totalDeletedMessages += docsToDelete.length;

      for (const docSnap of docsToDelete) {
        const messageData = docSnap.data() || {};
        const assets = extractMediaPaths(messageData);
        for (const asset of assets) {
          await deleteStorageAsset(asset);
          totalDeletedAssets += 1;
        }
      }
    }

    if (safetyPasses >= MAX_PASSES) {
      console.warn(`[RETENTION] Safety stop reached roomId=${roomId} passes=${MAX_PASSES}`);
    }

    const finalProbe = await messagesRef
      .orderBy("timestamp", "desc")
      .limit(ROOM_RETENTION_QUERY_LIMIT)
      .get();

    console.log(
      `[RETENTION] Retention done roomId=${roomId} deletedMessages=${totalDeletedMessages} deletedAssets=${totalDeletedAssets} finalProbeSize=${finalProbe.size}`
    );

    return null;
  }
);
