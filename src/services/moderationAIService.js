/**
 * MODERACIÓN IA — Chactivo
 *
 * Sistema de moderación contextual que usa IA (DeepSeek → OpenAI → Qwen)
 * para evaluar la INTENCIÓN del mensaje, no solo palabras clave.
 *
 * PRINCIPIO: Es mejor permitir un mensaje dudoso que castigar a un usuario inocente.
 *
 * CONTEXTO: Chactivo es un chat gay. Lenguaje sexual, coqueteo y jerga gay son SEGUROS.
 * Solo se sancionan: odio, acoso, amenazas, discriminación, spam.
 *
 * ESCALACIÓN PROGRESIVA:
 * 0 strikes → advertencia (toast)
 * 1 strike  → mute 5 min
 * 2 strikes → mute 15 min
 * 3+ strikes → mute 60 min
 *
 * 100% client-side. Estado en Firestore `userModerationState/{userId}`.
 * Logs en `moderationLogs/{logId}`.
 */

import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { createModerationIncidentAlert } from '@/services/moderationService';
import { startAITrace, finishAITrace, failAITrace } from '@/utils/runtimeDiagnostics';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// Escalación progresiva (en minutos)
const ESCALATION = [
  { strikes: 0, action: 'warning', muteMins: 0 },
  { strikes: 1, action: 'mute', muteMins: 5 },
  { strikes: 2, action: 'mute', muteMins: 15 },
  { strikes: 3, action: 'mute', muteMins: 60 },
];

// Spam: mensajes iguales en ventana de tiempo
// Regla: 1ª y 2ª repetición OK, 3ª bloquea + toast, 4ª bloquea + mute 5 min
const SPAM_CONFIG = {
  DUPLICATE_WINDOW_MS: 60_000,   // 60 segundos
  DUPLICATE_WARN_AT: 3,          // 3ª repetición = bloqueo + advertencia
  DUPLICATE_MUTE_AT: 4,          // 4ª repetición = bloqueo + mute 5 min
  DUPLICATE_MUTE_MINS: 5,
  FLOOD_WINDOW_MS: 10_000,       // 10 segundos
  FLOOD_THRESHOLD: 5,            // 5 mensajes en 10s = flood
  FLOOD_PREVENT_WINDOW_MS: 15_000,
  FLOOD_PREVENT_WARN_AT: 6,
  FLOOD_PREVENT_MUTE_AT: 8,
  FLOOD_PREVENT_MUTE_MINS: 5,
};

// Cache local de historial de mensajes por usuario (para detección de spam)
const userMessageHistory = new Map();

// Cache local de estado de moderación (evitar leer Firestore en cada mensaje)
const moderationStateCache = new Map();

const LOCAL_MODERATION_CONFIG = {
  AI_REVIEW_MIN_SCORE: 3,
  DIRECT_BLOCK_MIN_SCORE: 6,
};
const ENCOUNTER_NOW_REGEX = /\b(lugar|sitio|ahora|ya|ven|vente|manda ubi|ubicaci[oó]n|quedar|encuentro)\b/i;

const LOCAL_RISK_PATTERNS = {
  minorDirect: [
    /\bsoy menor\b/i,
    /\bmenor de edad\b/i,
    /\btengo\s*(1[0-7])\b/i,
    /\b(1[0-7])\s*a[nñ]os\b/i,
    /\btengo\s*14\b/i,
    /\bsoy de 16\b/i,
    /\bsoy de 17\b/i,
  ],
  minorAmbiguous: [
    /\b31 al rev[eé]s\b/i,
    /\b18 casi\b/i,
    /\bcasi 18\b/i,
    /\bparezco menor\b/i,
    /\b-8 a[nñ]os\b/i,
  ],
  externalDirect: [
    /\bwhatsapp\b/i,
    /\bwsp\b/i,
    /\bwapp\b/i,
    /\bwasap+\b/i,
    /\bwassap+\b/i,
    /\bguasap+\b/i,
    /\bwhap+s+a+p+t?\b/i,
    /\btelegram\b/i,
    /\btelegrm\b/i,
    /\btlg\b/i,
    /\bsignal\b/i,
    /\bdiscord\b/i,
    /\bteams?\b/i,
    /\binstagram\b/i,
    /\big\b/i,
    /\bcorreo\b/i,
    /\bgmail\b/i,
    /\bhotmail\b/i,
    /\boutlook\b/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\b\d{8,}\b/,
  ],
  externalAmbiguous: [
    /\bte paso mi contacto\b/i,
    /\bhablemos por fuera\b/i,
    /\bafuera de la app\b/i,
    /\bte escribo afuera\b/i,
  ],
  drugDirect: [
    /\bdroga\b/i,
    /\bdrogas\b/i,
    /\btusi\b/i,
    /\bcoca[ií]?na\b/i,
    /\bketamina\b/i,
    /\bporro\b/i,
    /\bsaque\b/i,
    /\bpoppers?\b/i,
  ],
  violenceDirect: [
    /\bte voy a matar\b/i,
    /\bmatarte\b/i,
    /\bgolpear\b/i,
    /\bapu[nñ]alar\b/i,
    /\bviolar\b/i,
    /\bamenaza\b/i,
  ],
  hateDirect: [
    /\bnazi\b/i,
    /\bracista\b/i,
    /\bxenofob/i,
    /\bhomofob/i,
    /\btransfob/i,
    /\bnegro culiao\b/i,
    /\bveneco culiao\b/i,
    /\bmaric[oó]n culiao\b/i,
  ],
  coercionAmbiguous: [
    /\bsi no\b/i,
    /\bforzar\b/i,
    /\bobligar\b/i,
    /\bte obligo\b/i,
    /\bhazlo ahora\b/i,
    /\bmanda foto ya\b/i,
  ],
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT para IA
// ═══════════════════════════════════════════════════════════════════

const MODERATION_SYSTEM_PROMPT = `Eres un moderador de contenido para Chactivo, un chat gay de Chile.

CONTEXTO IMPORTANTE:
- Es un chat para hombres gay. El lenguaje sexual, coqueteo, jerga gay y picardía son NORMALES y PERMITIDOS.
- Palabras como "coger", "culiar", "pico", "potito", "caliente", "activo", "pasivo", "versátil", "top", "bottom" son SEGURAS.
- Los usuarios hablan de sexo, citas, relaciones, y eso está BIEN.
- El humor subido de tono entre usuarios gay es parte de la cultura y es SEGURO.

SOLO sancionar mensajes con INTENCIÓN CLARA de:
1. ODIO/DISCRIMINACIÓN: homofobia, transfobia, racismo, misoginia, ataques a identidad
2. ACOSO DIRECTO: amenazas, intimidación repetida contra un usuario específico
3. CONTENIDO ILEGAL: menores, violencia explícita, doxxing

NUNCA sancionar:
- Lenguaje sexual entre adultos
- Coqueteo o insinuaciones
- Groserías casuales o jerga chilena ("wn", "ctm", "chucha")
- Opiniones controvertidas expresadas respetuosamente
- Humor ácido o sarcasmo

IMPORTANTE: Ante la DUDA, el mensaje es SEGURO. Preferir falsos negativos sobre falsos positivos.

Responde SOLO con JSON válido:
{"safe": true} si el mensaje es seguro
{"safe": false, "reason": "explicación breve en español", "severity": "low|medium|high"} si viola las reglas`;

// ═══════════════════════════════════════════════════════════════════
// AI API CALL (reutiliza patrón de nicoBot)
// ═══════════════════════════════════════════════════════════════════

const callModerationAI = async (url, apiKey, model, message) => {
  const providerLabel = url.includes('deepseek')
    ? 'deepseek'
    : url.includes('openai')
      ? 'openai'
      : url.includes('dashscope') || url.includes('qwen')
        ? 'qwen'
        : 'moderation_ai';
  const traceId = startAITrace({
    source: 'moderation_ai',
    provider: providerLabel,
    action: 'moderate_message',
  });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout (moderación debe ser rápida)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: MODERATION_SYSTEM_PROMPT },
          { role: 'user', content: `Analiza este mensaje: "${message}"` },
        ],
        temperature: 0.1, // Baja temperatura para consistencia
        max_tokens: 100,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Respuesta vacía');
    }

    // Parsear JSON (puede venir con markdown)
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    finishAITrace(traceId, {
      summary: parsed?.safe === false ? `Moderación respondió unsafe (${parsed?.severity || 'sin severidad'})` : 'Moderación respondió safe',
    });
    return parsed;
  } catch (err) {
    clearTimeout(timeoutId);
    failAITrace(traceId, { error: err });
    throw err;
  }
};

function matchAnyPattern(patterns, message) {
  return patterns.some((pattern) => pattern.test(message));
}

function analyzeLocalRisk(message) {
  const content = String(message || '').trim();
  const flags = [];
  let score = 0;

  const addFlag = (category, label, severity, points, route = 'block') => {
    flags.push({ category, label, severity, points, route });
    score += points;
  };

  if (matchAnyPattern(LOCAL_RISK_PATTERNS.minorDirect, content)) {
    addFlag('minor', 'Referencia explicita a menor de edad', 'high', 10, 'block');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.minorAmbiguous, content)) {
    addFlag('minor', 'Referencia ambigua de menor de edad', 'high', 5, 'ai');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.externalDirect, content)) {
    addFlag('external_contact', 'Intento de sacar la conversacion fuera de Chactivo', 'medium', 7, 'block');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.externalAmbiguous, content)) {
    addFlag('external_contact', 'Posible extraccion a canal externo', 'medium', 4, 'ai');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.drugDirect, content)) {
    addFlag('drugs', 'Lenguaje asociado a drogas o sustancias', 'high', 7, 'block');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.violenceDirect, content)) {
    addFlag('violence', 'Amenaza o violencia explicita', 'high', 9, 'block');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.hateDirect, content)) {
    addFlag('hate', 'Lenguaje de odio o discriminacion', 'high', 9, 'block');
  }
  if (matchAnyPattern(LOCAL_RISK_PATTERNS.coercionAmbiguous, content)) {
    addFlag('coercion', 'Posible coercion o presion directa', 'medium', 3, 'ai');
  }

  const directBlock = flags.some((flag) => flag.route === 'block')
    && score >= LOCAL_MODERATION_CONFIG.DIRECT_BLOCK_MIN_SCORE;
  const needsAIReview = !directBlock
    && flags.some((flag) => flag.route === 'ai')
    && score >= LOCAL_MODERATION_CONFIG.AI_REVIEW_MIN_SCORE;

  const primaryFlag = flags[0] || null;

  return {
    score,
    flags,
    directBlock,
    needsAIReview,
    primaryFlag,
  };
}

async function runAIModeration(message) {
  let aiResult = null;

  if (DEEPSEEK_API_KEY) {
    try {
      aiResult = await callModerationAI(DEEPSEEK_URL, DEEPSEEK_API_KEY, 'deepseek-chat', message);
    } catch (err) {
      console.warn('[MOD-AI] DeepSeek falló:', err.message);
    }
  }

  if (!aiResult && OPENAI_API_KEY) {
    try {
      aiResult = await callModerationAI(OPENAI_URL, OPENAI_API_KEY, 'gpt-4o-mini', message);
    } catch (err) {
      console.warn('[MOD-AI] OpenAI falló:', err.message);
    }
  }

  if (!aiResult && QWEN_API_KEY) {
    try {
      aiResult = await callModerationAI(QWEN_URL, QWEN_API_KEY, 'qwen2.5-7b-instruct', message);
    } catch (err) {
      console.warn('[MOD-AI] Qwen falló:', err.message);
    }
  }

  return aiResult;
}

function buildHighRiskAlertPayload(message, roomId, violation, localRisk) {
  const primaryFlag = localRisk?.primaryFlag || null;
  const category = primaryFlag?.category || null;
  let type = null;
  let severity = String(violation?.severity || primaryFlag?.severity || 'medium').toLowerCase();

  if (category === 'minor') {
    type = primaryFlag?.route === 'ai' ? 'minor_ambiguous' : 'minor_risk';
    severity = 'critical';
  } else if (category === 'violence') {
    type = 'violence';
    severity = 'critical';
  } else if (category === 'hate') {
    type = 'hate_speech';
    severity = severity === 'critical' ? 'critical' : 'high';
  } else if (category === 'drugs') {
    type = ENCOUNTER_NOW_REGEX.test(String(message || '')) ? 'drug_meetup' : 'drugs';
    severity = type === 'drug_meetup' ? 'critical' : 'high';
  } else if (category === 'external_contact') {
    type = 'external_contact';
    severity = 'high';
  } else if (category === 'coercion') {
    type = 'coercion';
    severity = severity === 'critical' ? 'critical' : 'high';
  } else if (violation?.detectedBy === 'ai' && ['high', 'critical'].includes(severity)) {
    type = 'high_risk_ai';
  }

  if (!type) return null;

  return {
    type,
    severity,
    roomId,
    reason: violation?.reason || primaryFlag?.label || 'Incidente de moderacion detectado',
    message: String(message || '').trim().slice(0, 500),
    detectedBy: violation?.detectedBy || 'hybrid_moderation',
    autoAction: violation?.action || 'warning',
  };
}

async function queueHighRiskModerationAlert({ message, roomId, violation, localRisk }) {
  try {
    const payload = buildHighRiskAlertPayload(message, roomId, violation, localRisk);
    if (!payload) return;
    await createModerationIncidentAlert(payload);
  } catch (error) {
    console.warn('[MOD-AI] Error creando alerta de alto riesgo:', error?.message || error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// DETECCIÓN DE SPAM (local, sin IA)
// ═══════════════════════════════════════════════════════════════════

/**
 * Registra un mensaje en el historial local y detecta spam
 * @returns {{ isSpam: boolean, type?: string, reason?: string }}
 */
function detectSpam(userId, message) {
  const now = Date.now();
  const normalized = message.trim().toLowerCase();

  // Obtener o crear historial del usuario
  if (!userMessageHistory.has(userId)) {
    userMessageHistory.set(userId, []);
  }
  const history = userMessageHistory.get(userId);

  // Agregar mensaje actual
  history.push({ text: normalized, timestamp: now });

  // Limpiar mensajes antiguos (más de 2 minutos)
  const cutoff = now - 120_000;
  while (history.length > 0 && history[0].timestamp < cutoff) {
    history.shift();
  }

  // 1. Detectar duplicados (mismo mensaje repetido)
  const recentWindow = now - SPAM_CONFIG.DUPLICATE_WINDOW_MS;
  const duplicates = history.filter(
    m => m.timestamp >= recentWindow && m.text === normalized
  );
  if (duplicates.length >= SPAM_CONFIG.DUPLICATE_MUTE_AT) {
    return {
      isSpam: true,
      type: 'duplicate',
      duplicateCount: duplicates.length,
      severity: 'mute',
      reason: `Mensaje repetido ${duplicates.length} veces`,
    };
  }
  if (duplicates.length >= SPAM_CONFIG.DUPLICATE_WARN_AT) {
    return {
      isSpam: true,
      type: 'duplicate',
      duplicateCount: duplicates.length,
      severity: 'warn',
      reason: `Mensaje repetido ${duplicates.length} veces`,
    };
  }

  // 2. Detectar flood (muchos mensajes rápidos)
  const floodWindow = now - SPAM_CONFIG.FLOOD_WINDOW_MS;
  const recentMessages = history.filter(m => m.timestamp >= floodWindow);
  if (recentMessages.length >= SPAM_CONFIG.FLOOD_THRESHOLD) {
    return {
      isSpam: true,
      type: 'flood',
      reason: `${recentMessages.length} mensajes en ${SPAM_CONFIG.FLOOD_WINDOW_MS / 1000}s`,
    };
  }

  return { isSpam: false };
}

/**
 * Verifica spam por duplicados ANTES de enviar (pre-send).
 * 3ª repetición: bloquea + toast. 4ª: bloquea + mute 5 min.
 * Registra intentos bloqueados en historial para conteo correcto.
 *
 * @returns {{ block: boolean, type?: 'spam_duplicate_warning'|'spam_duplicate_ban', reason?: string, muteMins?: number }}
 */
export function checkDuplicateSpamBeforeSend(userId, message) {
  const now = Date.now();
  const normalized = (message || '').trim().toLowerCase();
  if (!normalized) return { block: false };

  if (!userMessageHistory.has(userId)) {
    userMessageHistory.set(userId, []);
  }
  const history = userMessageHistory.get(userId);

  const recentFloodWindow = now - SPAM_CONFIG.FLOOD_PREVENT_WINDOW_MS;
  const rapidMessages = history.filter((m) => m.timestamp >= recentFloodWindow);

  if (rapidMessages.length >= SPAM_CONFIG.FLOOD_PREVENT_MUTE_AT) {
    history.push({ text: normalized, timestamp: now });
    applyDuplicateSpamMute(userId, SPAM_CONFIG.FLOOD_PREVENT_MUTE_MINS).catch(() => {});
    return {
      block: true,
      type: 'spam_flood_ban',
      reason: 'Estás enviando demasiados mensajes seguidos. Usa el privado interno o deja espacio para que respondan.',
      muteMins: SPAM_CONFIG.FLOOD_PREVENT_MUTE_MINS,
    };
  }

  if (rapidMessages.length >= SPAM_CONFIG.FLOOD_PREVENT_WARN_AT) {
    history.push({ text: normalized, timestamp: now });
    return {
      block: true,
      type: 'spam_flood_warning',
      reason: 'Baja el ritmo. Deja espacio a la conversación o pasa al privado interno.',
    };
  }

  const recentWindow = now - SPAM_CONFIG.DUPLICATE_WINDOW_MS;
  const duplicates = history.filter(
    m => m.timestamp >= recentWindow && m.text === normalized
  );

  // 4ª repetición: count >= 3 en historial → próxima sería la 4ª → bloquear + mute
  if (duplicates.length >= 3) {
    history.push({ text: normalized, timestamp: now });
    applyDuplicateSpamMute(userId, SPAM_CONFIG.DUPLICATE_MUTE_MINS).catch(() => {});
    return {
      block: true,
      type: 'spam_duplicate_ban',
      reason: 'No se permite spam. Silenciado 5 minutos.',
      muteMins: SPAM_CONFIG.DUPLICATE_MUTE_MINS,
    };
  }

  // 3ª repetición: count >= 2 en historial → bloquear + toast
  if (duplicates.length >= 2) {
    history.push({ text: normalized, timestamp: now });
    return {
      block: true,
      type: 'spam_duplicate_warning',
      reason: 'No se permite repetir el mismo mensaje tantas veces.',
    };
  }

  return { block: false };
}

/**
 * Aplica mute por spam duplicado (sin incrementar strikes de moderación IA)
 */
async function applyDuplicateSpamMute(userId, minutes) {
  const state = await getModerationState(userId);
  const now = Date.now();
  const muteUntil = now + (minutes * 60_000);
  await updateModerationState(userId, {
    strikes: state.strikes,
    lastStrikeAt: state.lastStrikeAt || now,
    muteUntil,
    lastReason: 'Spam: mensaje repetido repetidamente',
  });
}

// ═══════════════════════════════════════════════════════════════════
// ESTADO DE MODERACIÓN (Firestore + Cache)
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtiene el estado de moderación del usuario (cache → Firestore)
 */
async function getModerationState(userId) {
  // 1. Cache local
  const cached = moderationStateCache.get(userId);
  if (cached && (Date.now() - cached._fetchedAt) < 60_000) {
    return cached;
  }

  // 2. Firestore
  try {
    const docRef = doc(db, 'userModerationState', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const state = {
        strikes: data.strikes || 0,
        lastStrikeAt: data.lastStrikeAt?.toMillis?.() || 0,
        muteUntil: data.muteUntil?.toMillis?.() || 0,
        lastReason: data.lastReason || '',
        _fetchedAt: Date.now(),
      };
      moderationStateCache.set(userId, state);
      return state;
    }
  } catch (err) {
    console.warn('[MOD-AI] Error leyendo estado:', err.message);
  }

  // Default: sin strikes
  const defaultState = { strikes: 0, lastStrikeAt: 0, muteUntil: 0, lastReason: '', _fetchedAt: Date.now() };
  moderationStateCache.set(userId, defaultState);
  return defaultState;
}

/**
 * Actualiza el estado de moderación (Firestore + cache)
 */
async function updateModerationState(userId, newState) {
  try {
    const docRef = doc(db, 'userModerationState', userId);
    const firestoreData = {
      strikes: newState.strikes,
      lastStrikeAt: Timestamp.fromMillis(newState.lastStrikeAt || Date.now()),
      muteUntil: newState.muteUntil ? Timestamp.fromMillis(newState.muteUntil) : null,
      lastReason: newState.lastReason || '',
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, firestoreData, { merge: true });
    moderationStateCache.set(userId, { ...newState, _fetchedAt: Date.now() });
  } catch (err) {
    console.warn('[MOD-AI] Error guardando estado:', err.message);
  }
}

/**
 * Registra un log de moderación
 */
async function logModeration(userId, username, message, roomId, result) {
  try {
    await addDoc(collection(db, 'moderationLogs'), {
      userId,
      username,
      message: message.substring(0, 500),
      roomId,
      result: result.safe ? 'safe' : 'violation',
      reason: result.reason || null,
      severity: result.severity || null,
      action: result.action || null,
      muteMins: result.muteMins || 0,
      detectedBy: result.detectedBy || 'ai',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[MOD-AI] Error guardando log:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: Evaluar mensaje
// ═══════════════════════════════════════════════════════════════════

/**
 * Evalúa un mensaje con IA y spam detection.
 * Se ejecuta DESPUÉS de que el mensaje se muestra (post-send, async).
 *
 * @param {string} message - Contenido del mensaje
 * @param {string} userId - ID del usuario
 * @param {string} username - Username
 * @param {string} roomId - Sala actual
 * @returns {Promise<{
 *   safe: boolean,
 *   action?: 'warning' | 'mute',
 *   muteMins?: number,
 *   muteUntil?: number,
 *   reason?: string,
 *   severity?: string,
 *   detectedBy?: 'spam' | 'ai' | 'rules' | 'local',
 * }>}
 */
export async function evaluateMessage(message, userId, username, roomId) {
  try {
    // 0. No moderar mensajes muy cortos (saludos, "si", "no", etc.)
    if (!message || message.trim().length <= 3) {
      return { safe: true };
    }

    // 1. SPAM DETECTION (local, instantáneo)
    const spamResult = detectSpam(userId, message);
    if (spamResult.isSpam) {
      console.log(`[MOD-AI] Spam detectado para ${username}:`, spamResult.reason);
      // Duplicados: aplicar mute sin strikes (evitar doble sanción con pre-send)
      if (spamResult.type === 'duplicate' && spamResult.severity === 'mute') {
        await applyDuplicateSpamMute(userId, SPAM_CONFIG.DUPLICATE_MUTE_MINS);
        return {
          safe: false,
          action: 'mute',
          muteMins: SPAM_CONFIG.DUPLICATE_MUTE_MINS,
          reason: spamResult.reason,
          severity: 'medium',
          detectedBy: 'spam',
        };
      }
      // Duplicados warn o flood: solo eliminar mensaje, sin mute (pre-send ya bloquea 3ª/4ª)
      return {
        safe: false,
        action: 'warning',
        reason: spamResult.reason,
        severity: 'medium',
        detectedBy: 'spam',
      };
    }

    // 2. SCORING LOCAL BARATO
    const localRisk = analyzeLocalRisk(message);

    if (localRisk.directBlock) {
      const primaryFlag = localRisk.primaryFlag || {
        category: 'policy',
        label: 'Contenido no permitido',
        severity: 'high',
      };
      return await applyEscalation(userId, username, message, roomId, {
        safe: false,
        reason: primaryFlag.label,
        severity: primaryFlag.severity,
        detectedBy: 'rules',
      }, { localRisk });
    }

    // 3. Si no hay señal local, permitir sin gastar IA
    if (!localRisk.needsAIReview) {
      return { safe: true, detectedBy: 'local' };
    }

    // 4. Solo lo ambiguo pero riesgoso sube a IA
    const aiResult = await runAIModeration(message);

    // Si todas las APIs fallan → permitir (fail-open, NUNCA castigar por error técnico)
    if (!aiResult) {
      console.log('[MOD-AI] Todas las APIs fallaron, mensaje permitido (fail-open)');
      return { safe: true, detectedBy: 'local' };
    }

    // Si la IA dice que es seguro → permitir
    if (aiResult.safe) {
      return { safe: true, detectedBy: 'ai' };
    }

    // 5. VIOLACIÓN DETECTADA: aplicar escalación
    return await applyEscalation(userId, username, message, roomId, {
      safe: false,
      reason: aiResult.reason || 'Contenido no permitido',
      severity: aiResult.severity || 'low',
      detectedBy: 'ai',
    }, { localRisk });
  } catch (err) {
    console.error('[MOD-AI] Error general:', err);
    return { safe: true }; // Fail-open siempre
  }
}

/**
 * Aplica escalación progresiva basada en strikes del usuario
 */
async function applyEscalation(userId, username, message, roomId, violation, options = {}) {
  const state = await getModerationState(userId);
  const newStrikes = state.strikes + 1;

  // Determinar acción según strikes
  const level = ESCALATION.find(e => e.strikes >= newStrikes) || ESCALATION[ESCALATION.length - 1];
  const muteMins = newStrikes >= 3 ? 60 : (ESCALATION[newStrikes]?.muteMins || level.muteMins);
  const action = newStrikes === 1 ? 'warning' : 'mute'; // Primer strike = advertencia, resto = mute

  // Calcular acción real basada en strikes acumulados
  let finalAction = 'warning';
  let finalMuteMins = 0;

  if (newStrikes === 1) {
    finalAction = 'warning';
    finalMuteMins = 0;
  } else if (newStrikes === 2) {
    finalAction = 'mute';
    finalMuteMins = 5;
  } else if (newStrikes === 3) {
    finalAction = 'mute';
    finalMuteMins = 15;
  } else {
    finalAction = 'mute';
    finalMuteMins = 60;
  }

  const now = Date.now();
  const muteUntil = finalAction === 'mute' ? now + (finalMuteMins * 60_000) : 0;

  // Actualizar estado
  await updateModerationState(userId, {
    strikes: newStrikes,
    lastStrikeAt: now,
    muteUntil,
    lastReason: violation.reason,
  });

  // Log
  const result = {
    safe: false,
    action: finalAction,
    muteMins: finalMuteMins,
    muteUntil,
    reason: violation.reason,
    severity: violation.severity,
    detectedBy: violation.detectedBy,
    strikes: newStrikes,
  };
  logModeration(userId, username, message, roomId, result);
  await queueHighRiskModerationAlert({
    message,
    roomId,
    violation: result,
    localRisk: options.localRisk || null,
  });

  console.log(`[MOD-AI] ${finalAction.toUpperCase()} para ${username} (strike ${newStrikes}): ${violation.reason}`);

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICAR MUTE ACTIVO
// ═══════════════════════════════════════════════════════════════════

/**
 * Verifica si un usuario está actualmente muteado por el sistema de moderación IA
 * @returns {{ isMuted: boolean, remainingMs?: number, reason?: string }}
 */
export async function checkAIMute(userId) {
  const state = await getModerationState(userId);
  const now = Date.now();

  if (state.muteUntil && state.muteUntil > now) {
    return {
      isMuted: true,
      remainingMs: state.muteUntil - now,
      reason: state.lastReason,
    };
  }

  return { isMuted: false };
}

/**
 * Formatea milisegundos restantes a string legible
 */
export function formatMuteRemaining(ms) {
  if (ms <= 0) return '';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

// ═══════════════════════════════════════════════════════════════════
// LIMPIEZA PERIÓDICA
// ═══════════════════════════════════════════════════════════════════

// Limpiar historial de spam cada 2 minutos
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 120_000;
  for (const [userId, history] of userMessageHistory) {
    const filtered = history.filter(m => m.timestamp >= cutoff);
    if (filtered.length === 0) {
      userMessageHistory.delete(userId);
    } else {
      userMessageHistory.set(userId, filtered);
    }
  }
}, 120_000);

// Limpiar cache de estados cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [userId, state] of moderationStateCache) {
    if (now - state._fetchedAt > 300_000) {
      moderationStateCache.delete(userId);
    }
  }
}, 300_000);
