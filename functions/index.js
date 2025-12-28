const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const FINGERPRINT_COLLECTION = 'ai_message_fingerprints';
const DUPLICATE_LOG_COLLECTION = 'ai_message_duplicates';
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_CHECK = 500;
const SIMILARITY_THRESHOLD = 0.82;

const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d]+/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenize = (text) => {
  if (!text) return [];
  const tokens = text.split(' ').filter((t) => t.length >= 3);
  return Array.from(new Set(tokens));
};

const jaccardSimilarity = (aTokens, bTokens) => {
  if (!aTokens.length || !bTokens.length) return 0;
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const isAIMessage = (data) => {
  const userId = data.userId || '';
  if (userId === 'system') return false;
  return userId.startsWith('ai_') || userId.startsWith('bot_') || userId.startsWith('static_bot_');
};

exports.blockSimilarMessages = functions.firestore
  .document('rooms/{roomId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.content) return;
    if (!isAIMessage(data)) return;

    const normalized = normalizeText(data.content);
    if (!normalized || normalized.length < 6) return;

    const tokens = tokenize(normalized);
    if (tokens.length < 3) return;

    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - ONE_HOUR_MS);

    const fingerprintsRef = admin.firestore().collection(FINGERPRINT_COLLECTION);
    const recent = await fingerprintsRef
      .where('createdAt', '>=', cutoff)
      .orderBy('createdAt', 'desc')
      .limit(MAX_CHECK)
      .get();

    let isDuplicate = false;
    let matchInfo = null;

    for (const doc of recent.docs) {
      const fp = doc.data();
      if (!fp || !fp.tokens || !fp.normalized) continue;
      if (fp.normalized === normalized) {
        isDuplicate = true;
        matchInfo = {
          type: 'exact',
          fingerprintId: doc.id,
          similarity: 1
        };
        break;
      }

      const similarity = jaccardSimilarity(tokens, fp.tokens || []);
      if (similarity >= SIMILARITY_THRESHOLD) {
        isDuplicate = true;
        matchInfo = {
          type: 'similar',
          fingerprintId: doc.id,
          similarity
        };
        break;
      }
    }

    if (isDuplicate) {
      await admin.firestore().collection(DUPLICATE_LOG_COLLECTION).add({
        roomId: context.params.roomId,
        messageId: context.params.messageId,
        userId: data.userId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        normalized,
        matchInfo
      });

      await snap.ref.delete();
      return;
    }

    await fingerprintsRef.add({
      roomId: context.params.roomId,
      messageId: context.params.messageId,
      userId: data.userId || null,
      normalized,
      tokens,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
