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
const SPAM_CONFIG = {
  DUPLICATE_WINDOW_MS: 60_000,   // 60 segundos
  DUPLICATE_THRESHOLD: 3,        // 3 mensajes iguales = spam
  FLOOD_WINDOW_MS: 10_000,       // 10 segundos
  FLOOD_THRESHOLD: 5,            // 5 mensajes en 10s = flood
};

// Cache local de historial de mensajes por usuario (para detección de spam)
const userMessageHistory = new Map();

// Cache local de estado de moderación (evitar leer Firestore en cada mensaje)
const moderationStateCache = new Map();

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
    if (!text) throw new Error('Respuesta vacía');

    // Parsear JSON (puede venir con markdown)
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

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
  if (duplicates.length >= SPAM_CONFIG.DUPLICATE_THRESHOLD) {
    return {
      isSpam: true,
      type: 'duplicate',
      reason: `Mensaje repetido ${duplicates.length} veces en ${SPAM_CONFIG.DUPLICATE_WINDOW_MS / 1000}s`,
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
 *   detectedBy?: 'spam' | 'ai',
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
      return await applyEscalation(userId, username, message, roomId, {
        safe: false,
        reason: spamResult.reason,
        severity: 'medium',
        detectedBy: 'spam',
      });
    }

    // 2. AI MODERATION (DeepSeek → OpenAI → Qwen)
    let aiResult = null;

    // DeepSeek (primario, más barato)
    if (DEEPSEEK_API_KEY) {
      try {
        aiResult = await callModerationAI(DEEPSEEK_URL, DEEPSEEK_API_KEY, 'deepseek-chat', message);
        console.log('[MOD-AI] DeepSeek respondió:', JSON.stringify(aiResult));
      } catch (err) {
        console.warn('[MOD-AI] DeepSeek falló:', err.message);
      }
    }

    // OpenAI (fallback)
    if (!aiResult && OPENAI_API_KEY) {
      try {
        aiResult = await callModerationAI(OPENAI_URL, OPENAI_API_KEY, 'gpt-4o-mini', message);
        console.log('[MOD-AI] OpenAI respondió:', JSON.stringify(aiResult));
      } catch (err) {
        console.warn('[MOD-AI] OpenAI falló:', err.message);
      }
    }

    // Qwen (último recurso)
    if (!aiResult && QWEN_API_KEY) {
      try {
        aiResult = await callModerationAI(QWEN_URL, QWEN_API_KEY, 'qwen2.5-7b-instruct', message);
        console.log('[MOD-AI] Qwen respondió:', JSON.stringify(aiResult));
      } catch (err) {
        console.warn('[MOD-AI] Qwen falló:', err.message);
      }
    }

    // Si todas las APIs fallan → permitir (fail-open, NUNCA castigar por error técnico)
    if (!aiResult) {
      console.log('[MOD-AI] Todas las APIs fallaron, mensaje permitido (fail-open)');
      return { safe: true };
    }

    // Si la IA dice que es seguro → permitir
    if (aiResult.safe) {
      return { safe: true };
    }

    // 3. VIOLACIÓN DETECTADA: aplicar escalación
    return await applyEscalation(userId, username, message, roomId, {
      safe: false,
      reason: aiResult.reason || 'Contenido no permitido',
      severity: aiResult.severity || 'low',
      detectedBy: 'ai',
    });
  } catch (err) {
    console.error('[MOD-AI] Error general:', err);
    return { safe: true }; // Fail-open siempre
  }
}

/**
 * Aplica escalación progresiva basada en strikes del usuario
 */
async function applyEscalation(userId, username, message, roomId, violation) {
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
