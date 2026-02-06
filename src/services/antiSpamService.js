import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

/**
 * 🛡️ ANTI-SPAM SERVICE v3.0 (2026)
 * ESTRATEGIA: Bloquear datos personales en chat principal
 * - Teléfono, email, datos personales: BLOQUEADOS (no sanitizar)
 * - CTA: Usar OPIN o Baúl para compartir contacto de forma segura
 * - FORBIDDEN_WORDS (Instagram, Telegram, etc.): BLOQUEADOS
 */

// 📱 CTA para datos personales bloqueados
const CTA_OPIN_BAUL = 'Usa OPIN o el Baúl de Perfiles para compartir tu contacto de forma segura.';

const CONFIG = {
  // ⏳ Expulsión temporal (5 minutos es suficiente para calmar)
  TEMP_BAN_DURATION_MS: 5 * 60 * 1000,

  // 🗣️ Excepciones: Palabras que SIEMPRE pasan (aunque tengan signos o mayúsculas)
  EXCEPTIONS: [
    'hola', 'alo', 'hol', 'ola', 'holis', 'wena', 'buenas', // Saludos
    'jaja', 'jsjs', 'jeje', 'lol', 'xd', // Risas
    'si', 'no', 'ok', 'ya', 'bueno', 'gracias', 'dale', // Respuestas cortas
    'que', 'k', 'q', 'y', 'o' // Conectores
  ],

  // 📱 Detección de números de teléfono (Chile, Argentina, internacional)
  PHONE_PATTERNS: [
    // Chile
    /\+56\s?9\s?\d{4}\s?\d{4}/g,     // +56 9 1234 5678
    /\+56\s?9\s?\d{8}/g,              // +56 9 12345678
    /\+569\d{8}/g,                    // +56912345678
    /(?:^|\s)9\s?\d{4}\s?\d{4}(?:\s|$|[.,])/g,  // 9 1234 5678
    /(?:^|\s)9\d{8}(?:\s|$|[.,])/g,        // 912345678
    /\+56[\s.-]?9[\s.-]?\d{4}[\s.-]?\d{4}/g,
    /(?:^|\s)9\s+\d{2}\s+\d{2}\s+\d{2}\s+\d{2}(?:\s|$)/g,
    // Argentina
    /\+54\s?9?\s?\d{2,4}\s?-?\d{4}\s?-?\d{4}/g,
    /\+54\s?9\s?\d{2}\s?\d{4}\s?\d{4}/g,
    // Internacional genérico (secuencias con prefijo +)
    /\+\d{1,4}[\s.-]?\d{6,}/g,
    // Frases + número (ej: "mi numero 912345678")
    /(?:agregame|escribeme|hablame|whatsapp|wsp|ws|mi\s*(?:numero|número|cel|fono)|contacto)[\s:]*\d{6,}/gi,
  ],

  // 📧 Detección de email
  EMAIL_PATTERNS: [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/g,
    /(?:mi\s+)?(?:email|mail|correo|e-mail)\s*[:=]\s*[^\s,]+@[^\s,]+/gi,
  ],

  // 🔗 Patrones de WhatsApp/contacto
  WHATSAPP_PATTERNS: [
    /wa\.me\/\d+/gi,
    /whatsapp\.com/gi,
    /api\.whatsapp\.com/gi,
    /chat\.whatsapp\.com/gi,
  ],

  // 🚫 Palabras/frases que indican intención de compartir contacto
  CONTACT_INTENT_PHRASES: [
    'mi numero es', 'mi número es',
    'agregame al', 'agregame a mi',
    'escribeme al', 'escribeme a mi',
    'hablame al', 'hablame a mi',
    'mandame al', 'mandame a mi',
    'mi wsp es', 'mi whatsapp es', 'mi ws es',
    'dame tu numero', 'dame tu número',
    'pasame tu numero', 'pasame tu número',
    'pasa tu numero', 'pasa tu número',
  ],

  // 🚫 Palabras/frases prohibidas (se bloquean completamente)
  FORBIDDEN_WORDS: [
    // Redes sociales externas
    'instagram.com', 'sigueme en insta', '@ig',
    't.me/', 'telegram.org',
    'facebook.com', 'grupo de face',
    'tiktok.com', '@tiktok',
    'onlyfans', 'only fans', 'of.com',

    // Spam comercial
    'vendo contenido', 'vendo pack', 'paso pack',

    // Ilegal
    'vendo droga', 'vendo coca', 'vendo mari', 'compro droga'
  ],

  // 📝 Mensaje de reemplazo para números
  REPLACEMENT_MESSAGE: '📱 [número oculto - usa el chat privado de Chactivo]',

  // 📝 Mensaje corto para reemplazo inline
  REPLACEMENT_SHORT: '📱••••••••',
};

/**
 * 🚀 CACHE DE BANS (Memoria RAM)
 * Evita leer Firestore en cada mensaje
 */
const tempBanCache = new Map();

/**
 * 🧹 LIMPIAR TEXTO PARA ANALIZAR
 * Elimina signos para comparar "Hola!!!" con "hola"
 */
function cleanText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^a-z0-9\s]/g, "") // Quita signos (bdeja solo letras y nums)
    .trim();
}

/**
 * ✅ VERIFICAR SI ES EXCEPCIÓN
 * Permite "Hola!!!", "Hola...", "HOLA"
 */
function isException(message) {
  const cleaned = cleanText(message);
  
  // 1. Coincidencia exacta o palabra suelta
  const words = cleaned.split(' ');
  return words.some(word => CONFIG.EXCEPTIONS.includes(word));
}

/**
 * 🔢 DETECTAR NÚMEROS DE TELÉFONO
 */
function containsPhoneNumber(message) {
  for (const pattern of CONFIG.PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(message)) return true;
  }
  return false;
}

/**
 * 📧 DETECTAR EMAIL
 */
function containsEmail(message) {
  if (!message || typeof message !== 'string') return false;
  for (const pattern of CONFIG.EMAIL_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(message)) return true;
  }
  return false;
}

/**
 * 📱 SANITIZAR NÚMEROS DE TELÉFONO
 * Reemplaza números detectados con mensaje de chat privado
 * RETORNA: { sanitized: string, wasModified: boolean, numbersFound: number }
 */
export function sanitizePhoneNumbers(message) {
  if (!message || typeof message !== 'string') {
    return { sanitized: message || '', wasModified: false, numbersFound: 0 };
  }

  let sanitized = message;
  let numbersFound = 0;

  // 1. Reemplazar patrones de WhatsApp URLs
  for (const pattern of CONFIG.WHATSAPP_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) {
      numbersFound++;
      sanitized = sanitized.replace(pattern, CONFIG.REPLACEMENT_SHORT);
    }
  }

  // 2. Reemplazar números de teléfono
  for (const pattern of CONFIG.PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = sanitized.match(pattern);
    if (matches) {
      numbersFound += matches.length;
      sanitized = sanitized.replace(pattern, CONFIG.REPLACEMENT_SHORT);
    }
  }

  // 3. Detectar frases de intención de contacto y agregar advertencia
  const lowerMessage = sanitized.toLowerCase();
  let hasContactIntent = false;
  for (const phrase of CONFIG.CONTACT_INTENT_PHRASES) {
    if (lowerMessage.includes(phrase)) {
      hasContactIntent = true;
      break;
    }
  }

  // Si detectamos intención de compartir contacto pero no encontramos número,
  // puede que el número venga en un mensaje siguiente. Agregar recordatorio suave.
  if (hasContactIntent && numbersFound === 0) {
    // No modificamos el mensaje, pero lo marcamos
    return {
      sanitized,
      wasModified: false,
      numbersFound: 0,
      hasContactIntent: true
    };
  }

  const wasModified = numbersFound > 0;

  // Si se modificó, agregar CTA al final
  if (wasModified) {
    sanitized = sanitized.trim();
    // Evitar duplicar el CTA si ya está
    if (!sanitized.includes('chat privado')) {
      sanitized += '\n\n💬 _Usa el chat privado de Chactivo para contactar_';
    }
  }

  return { sanitized, wasModified, numbersFound };
}

/**
 * 🛡️ PROCESAR MENSAJE COMPLETO
 * Sanitiza el contenido y retorna información útil
 * SIEMPRE permite el mensaje (nunca bloquea)
 */
export function processMessageContent(message, userId, username) {
  if (!message || typeof message !== 'string') {
    return {
      content: message || '',
      allowed: true,
      wasModified: false,
      reason: null
    };
  }

  const trimmed = message.trim();

  // 1. Verificar excepciones (saludos simples pasan sin procesar)
  if (isException(trimmed)) {
    return {
      content: trimmed,
      allowed: true,
      wasModified: false,
      reason: null
    };
  }

  // 2. Sanitizar números de teléfono/WhatsApp
  const { sanitized, wasModified, numbersFound, hasContactIntent } = sanitizePhoneNumbers(trimmed);

  // 3. Log para analytics (sin bloquear)
  if (wasModified) {
    console.log(`[ANTI-SPAM] 📱 Números sanitizados para ${username}:`, {
      original: trimmed.substring(0, 50) + '...',
      numbersFound,
      userId
    });

    // Registrar advertencia en background (no bloqueante)
    recordSpamWarning(userId, username, `Número sanitizado (${numbersFound})`, 'global').catch(() => {});
  }

  if (hasContactIntent) {
    console.log(`[ANTI-SPAM] 👀 Intención de contacto detectada para ${username}`);
  }

  return {
    content: sanitized,
    allowed: true,
    wasModified,
    numbersFound,
    hasContactIntent,
    reason: wasModified ? 'phone_sanitized' : null
  };
}

/**
 * 🚫 DETECTAR PALABRAS PROHIBIDAS
 */
function containsForbiddenWords(message) {
  const normalized = message.toLowerCase();
  
  for (const word of CONFIG.FORBIDDEN_WORDS) {
    if (normalized.includes(word)) {
      return { found: true, word };
    }
  }
  return { found: false, word: null };
}

/**
 * ⚠️ REGISTRAR ADVERTENCIA (Sin bloquear inmediatamente)
 */
async function recordSpamWarning(userId, username, reason, roomId) {
  try {
    if (!auth.currentUser) return;
    const warningsRef = doc(db, 'spam_warnings', userId);
    // Solo actualizamos contador, lógica simple
    await setDoc(warningsRef, {
      userId, username,
      lastWarning: serverTimestamp(),
      lastReason: reason,
      count: increment(1)
    }, { merge: true });
  } catch (error) {
    console.error('Error warning:', error);
  }
}

/**
 * 🧹 LIMPIAR BAN (Función auxiliar)
 */
export async function clearUserTempBan(userId) {
  if (!userId) return;
  tempBanCache.delete(userId);
  try {
    await deleteDoc(doc(db, 'temp_bans', userId));
  } catch (e) { console.error(e); }
}

/**
 * 🛡️ VERIFICAR SI ESTÁ BANEADO (Con Cache)
 */
export async function checkTempBan(userId) {
  if (!userId) return { isBanned: false };

  const now = Date.now();
  
  // 1. Revisar Cache
  const cached = tempBanCache.get(userId);
  if (cached) {
    if (cached.expiresAt > now) {
      const remainingMinutes = Math.ceil((cached.expiresAt - now) / 60000);
      return { isBanned: true, reason: cached.reason, remainingMinutes };
    } else {
      tempBanCache.delete(userId); // Expiró
    }
  }

  // 2. Si no está en cache, revisamos DB (Solo si sospechamos)
  // Para optimizar, asumimos NO baneado si no está en cache local en esta sesión,
  // pero hacemos una lectura rápida por seguridad si es la primera vez.
  try {
    const banDoc = await getDoc(doc(db, 'temp_bans', userId));
    if (banDoc.exists()) {
      const data = banDoc.data();
      if (data.expiresAt > now) {
        // Guardar en cache
        const remainingMinutes = Math.ceil((data.expiresAt - now) / 60000);
        tempBanCache.set(userId, { ...data, remainingMinutes });
        return { isBanned: true, reason: data.reason, remainingMinutes };
      } else {
        // Limpiar DB si expiró
        await deleteDoc(doc(db, 'temp_bans', userId));
      }
    }
  } catch (error) {
    console.warn('Error checking ban:', error);
  }

  return { isBanned: false };
}

/**
 * 🛡️ VALIDAR MENSAJE (FUNCIÓN PRINCIPAL v3.0)
 *
 * ESTRATEGIA: BLOQUEAR datos personales en chat principal
 * - Teléfono/WhatsApp: BLOQUEADO + CTA OPIN/Baúl
 * - Email: BLOQUEADO + CTA OPIN/Baúl
 * - FORBIDDEN_WORDS: BLOQUEADO
 *
 * @returns {Object} { allowed, content, type?, details?, reason? }
 */
export async function validateMessage(message, userId, username, roomId) {
  try {
    if (!message || !message.trim()) {
      return { allowed: true, content: message || '', wasModified: false };
    }

    const trimmed = message.trim();

    // 1. 🚫 PALABRAS PROHIBIDAS (Instagram, Telegram, etc.)
    const forbidden = containsForbiddenWords(trimmed);
    if (forbidden.found) {
      console.log(`[ANTI-SPAM] 🚫 Palabra prohibida bloqueada para ${username}:`, forbidden.word);
      return {
        allowed: false,
        content: trimmed,
        type: 'forbidden_word',
        reason: `"${forbidden.word}" no permitido en el chat.`,
        details: CTA_OPIN_BAUL,
      };
    }

    // 2. 📱 NÚMEROS DE TELÉFONO / WHATSAPP
    if (containsPhoneNumber(trimmed)) {
      console.log(`[ANTI-SPAM] 🚫 Número de teléfono bloqueado para ${username}`);
      recordSpamWarning(userId, username, 'Número bloqueado', roomId).catch(() => {});
      return {
        allowed: false,
        content: trimmed,
        type: 'phone_number',
        reason: 'Números de teléfono no están permitidos en el chat principal.',
        details: CTA_OPIN_BAUL,
      };
    }

    // 3. 🔗 URLs de WhatsApp
    for (const pattern of CONFIG.WHATSAPP_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(trimmed)) {
        console.log(`[ANTI-SPAM] 🚫 Enlace WhatsApp bloqueado para ${username}`);
        return {
          allowed: false,
          content: trimmed,
          type: 'phone_number',
          reason: 'Enlaces de WhatsApp no están permitidos en el chat principal.',
          details: CTA_OPIN_BAUL,
        };
      }
    }

    // 4. 📧 EMAIL
    if (containsEmail(trimmed)) {
      console.log(`[ANTI-SPAM] 🚫 Email bloqueado para ${username}`);
      recordSpamWarning(userId, username, 'Email bloqueado', roomId).catch(() => {});
      return {
        allowed: false,
        content: trimmed,
        type: 'email',
        reason: 'Correos electrónicos no están permitidos en el chat principal.',
        details: CTA_OPIN_BAUL,
      };
    }

    // 5. ✅ Mensaje permitido - retornar sin modificar (chatService ya no sanitiza, bloqueamos aquí)
    return {
      allowed: true,
      content: trimmed,
      wasModified: false,
    };

  } catch (error) {
    console.error('[ANTI-SPAM CRITICAL ERROR]:', error);
    return { allowed: true, content: message, wasModified: false };
  }
}

/**
 * 🗑️ Limpieza periódica de memoria
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tempBanCache) {
    if (val.expiresAt < now) tempBanCache.delete(key);
  }
}, 60000);