/**
 * 🔥 SISTEMA DE DETECCIÓN DE SPAM POR FRECUENCIA
 * 
 * Monitorea y bloquea mensajes repetitivos de APIs en un corto período de tiempo
 * Previene spam masivo de IAs que envían mensajes similares repetidamente
 */

// Almacenamiento de mensajes recientes por API/personalidad
const messageHistory = new Map(); // { personalityId: [{ message, timestamp, normalized }, ...] }

// Penalizaciones activas
const activePenalties = new Map(); // { personalityId: { until: timestamp, reason: string } }

// Configuración
const CONFIG = {
  TIME_WINDOW_MS: 60 * 1000, // 1 minuto
  MAX_SIMILAR_MESSAGES: 3, // Máximo 3 mensajes similares en 1 minuto
  MAX_IDENTICAL_MESSAGES: 2, // Máximo 2 mensajes idénticos en 1 minuto
  SIMILARITY_THRESHOLD: 0.85, // 85% de similitud = spam
  PENALTY_DURATION_MS: 5 * 60 * 1000, // 5 minutos de bloqueo
  CLEANUP_INTERVAL_MS: 2 * 60 * 1000 // Limpiar cada 2 minutos
};

/**
 * Normaliza un mensaje para comparación
 */
const normalizeMessage = (message) => {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[.,!?;:()'"«»]/g, '') // Remover puntuación
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') // Remover emojis
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();
};

/**
 * Calcula similitud entre dos mensajes (0-1)
 */
const calculateSimilarity = (msg1, msg2) => {
  const normalized1 = normalizeMessage(msg1);
  const normalized2 = normalizeMessage(msg2);
  
  if (normalized1 === normalized2) return 1.0;
  
  // Similitud por palabras en común
  const words1 = new Set(normalized1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalized2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let commonWords = 0;
  words1.forEach(word => {
    if (words2.has(word)) commonWords++;
  });
  
  const similarity = commonWords / Math.max(words1.size, words2.size);
  return similarity;
};

/**
 * Verifica si un mensaje es similar a mensajes recientes
 */
const isSimilarToRecent = (personalityId, newMessage) => {
  const history = messageHistory.get(personalityId) || [];
  const now = Date.now();
  
  // Filtrar mensajes dentro de la ventana de tiempo
  const recentMessages = history.filter(
    entry => (now - entry.timestamp) <= CONFIG.TIME_WINDOW_MS
  );
  
  if (recentMessages.length === 0) return { isSimilar: false, count: 0 };
  
  const normalizedNew = normalizeMessage(newMessage);
  
  // Contar mensajes idénticos
  let identicalCount = 0;
  let similarCount = 0;
  
  for (const entry of recentMessages) {
    if (entry.normalized === normalizedNew) {
      identicalCount++;
    } else {
      const similarity = calculateSimilarity(newMessage, entry.message);
      if (similarity >= CONFIG.SIMILARITY_THRESHOLD) {
        similarCount++;
      }
    }
  }
  
  return {
    isSimilar: identicalCount >= CONFIG.MAX_IDENTICAL_MESSAGES || 
               similarCount >= CONFIG.MAX_SIMILAR_MESSAGES,
    identicalCount,
    similarCount,
    totalSimilar: identicalCount + similarCount
  };
};

/**
 * Verifica si una personalidad está penalizada
 */
export const isPenalized = (personalityId) => {
  const penalty = activePenalties.get(personalityId);
  if (!penalty) return false;
  
  if (Date.now() > penalty.until) {
    // Penalización expirada
    activePenalties.delete(personalityId);
    console.log(`[SPAM DETECTION] ✅ Penalización expirada para ${personalityId}`);
    return false;
  }
  
  return true;
};

/**
 * Aplica una penalización a una personalidad
 */
const applyPenalty = (personalityId, reason) => {
  const until = Date.now() + CONFIG.PENALTY_DURATION_MS;
  activePenalties.set(personalityId, { until, reason });
  
  console.warn(`[SPAM DETECTION] 🚫 PENALIZACIÓN APLICADA a ${personalityId}`);
  console.warn(`[SPAM DETECTION] ⏱️ Bloqueado hasta: ${new Date(until).toLocaleTimeString()}`);
  console.warn(`[SPAM DETECTION] 📋 Razón: ${reason}`);
  
  // Limpiar historial de mensajes para esta personalidad
  messageHistory.delete(personalityId);
};

/**
 * Valida un mensaje antes de enviarlo
 * Retorna { allowed: boolean, reason?: string, stats?: object }
 */
export const validateMessageForSpam = (personalityId, message) => {
  // 1. Verificar si está penalizado
  if (isPenalized(personalityId)) {
    const penalty = activePenalties.get(personalityId);
    const remainingMs = penalty.until - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    return {
      allowed: false,
      reason: `SPAM_BLOCKED: Penalizado por ${remainingMinutes} minuto(s) más. Razón: ${penalty.reason}`,
      penalty: {
        until: penalty.until,
        remainingMs,
        reason: penalty.reason
      }
    };
  }
  
  // 2. Verificar similitud con mensajes recientes
  const similarityCheck = isSimilarToRecent(personalityId, message);
  
  if (similarityCheck.isSimilar) {
    const reason = similarityCheck.identicalCount >= CONFIG.MAX_IDENTICAL_MESSAGES
      ? `${similarityCheck.identicalCount} mensajes idénticos en ${CONFIG.TIME_WINDOW_MS / 1000}s`
      : `${similarityCheck.similarCount} mensajes similares (${Math.round(CONFIG.SIMILARITY_THRESHOLD * 100)}%+) en ${CONFIG.TIME_WINDOW_MS / 1000}s`;
    
    // Aplicar penalización
    applyPenalty(personalityId, reason);
    
    return {
      allowed: false,
      reason: `SPAM_DETECTED: ${reason}`,
      stats: {
        identicalCount: similarityCheck.identicalCount,
        similarCount: similarityCheck.similarCount,
        totalSimilar: similarityCheck.totalSimilar
      }
    };
  }
  
  // 3. Mensaje válido - registrar en historial
  registerMessage(personalityId, message);
  
  return {
    allowed: true,
    stats: {
      identicalCount: similarityCheck.identicalCount,
      similarCount: similarityCheck.similarCount,
      totalSimilar: similarityCheck.totalSimilar
    }
  };
};

/**
 * Registra un mensaje en el historial
 */
const registerMessage = (personalityId, message) => {
  if (!messageHistory.has(personalityId)) {
    messageHistory.set(personalityId, []);
  }
  
  const history = messageHistory.get(personalityId);
  const normalized = normalizeMessage(message);
  
  history.push({
    message,
    normalized,
    timestamp: Date.now()
  });
  
  // Mantener solo mensajes dentro de la ventana de tiempo + buffer
  const cutoff = Date.now() - (CONFIG.TIME_WINDOW_MS * 2);
  const filtered = history.filter(entry => entry.timestamp > cutoff);
  messageHistory.set(personalityId, filtered);
};

/**
 * Limpia historiales antiguos y penalizaciones expiradas
 */
const cleanup = () => {
  const now = Date.now();
  
  // Limpiar historiales antiguos
  for (const [personalityId, history] of messageHistory.entries()) {
    const cutoff = now - (CONFIG.TIME_WINDOW_MS * 2);
    const filtered = history.filter(entry => entry.timestamp > cutoff);
    
    if (filtered.length === 0) {
      messageHistory.delete(personalityId);
    } else {
      messageHistory.set(personalityId, filtered);
    }
  }
  
  // Limpiar penalizaciones expiradas
  for (const [personalityId, penalty] of activePenalties.entries()) {
    if (now > penalty.until) {
      activePenalties.delete(personalityId);
    }
  }
  
  console.log(`[SPAM DETECTION] 🧹 Limpieza completada. Historiales: ${messageHistory.size}, Penalizaciones: ${activePenalties.size}`);
};

/**
 * Inicia el sistema de limpieza automática
 */
let cleanupInterval = null;

export const startSpamDetection = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(cleanup, CONFIG.CLEANUP_INTERVAL_MS);
  console.log(`[SPAM DETECTION] ✅ Sistema iniciado. Limpieza cada ${CONFIG.CLEANUP_INTERVAL_MS / 1000}s`);
};

/**
 * Detiene el sistema de limpieza
 */
export const stopSpamDetection = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  console.log(`[SPAM DETECTION] ⏹️ Sistema detenido`);
};

/**
 * Obtiene estadísticas de una personalidad
 */
export const getPersonalityStats = (personalityId) => {
  const history = messageHistory.get(personalityId) || [];
  const penalty = activePenalties.get(personalityId);
  const now = Date.now();
  
  const recentMessages = history.filter(
    entry => (now - entry.timestamp) <= CONFIG.TIME_WINDOW_MS
  );
  
  return {
    totalMessages: history.length,
    recentMessages: recentMessages.length,
    isPenalized: penalty ? Date.now() < penalty.until : false,
    penalty: penalty ? {
      until: penalty.until,
      remainingMs: Math.max(0, penalty.until - now),
      reason: penalty.reason
    } : null
  };
};

/**
 * Resetea penalización de una personalidad (útil para debugging)
 */
export const resetPenalty = (personalityId) => {
  activePenalties.delete(personalityId);
  console.log(`[SPAM DETECTION] 🔄 Penalización reseteada para ${personalityId}`);
};

/**
 * Resetea historial de una personalidad (útil para debugging)
 */
export const resetHistory = (personalityId) => {
  messageHistory.delete(personalityId);
  console.log(`[SPAM DETECTION] 🔄 Historial reseteado para ${personalityId}`);
};

// Iniciar limpieza automática al cargar el módulo
if (typeof window !== 'undefined') {
  startSpamDetection();
}

