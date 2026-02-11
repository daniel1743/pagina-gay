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

initializeApp();
const db = getFirestore();

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
