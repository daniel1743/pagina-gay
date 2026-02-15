/**
 * NICO BOT — Moderador comunitario de Chactivo
 *
 * Usa DeepSeek / OpenAI / Qwen para generar:
 * - Bienvenidas personalizadas a usuarios nuevos
 * - Preguntas calientes cada 30 minutos para activar la sala
 *
 * 100% client-side. Escribe a Firestore via sendMessage.
 * Coordinación entre clientes: revisa mensajes cargados antes de postear.
 */

import { sendMessage } from './chatService';

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const QWEN_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export const NICO = {
  userId: 'bot_nico',
  username: 'Nico',
  avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=nico-chactivo&backgroundColor=b6e3f4',
  isPremium: true,
};

// Intervalo mínimo entre preguntas (28 min para dar margen)
export const QUESTION_INTERVAL_MS = 28 * 60 * 1000;
// Delay mínimo entre bienvenidas (evitar spam si entran varios)
const WELCOME_COOLDOWN_MS = 15 * 1000;

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════════

const WELCOME_SYSTEM_PROMPT = `Eres Nico, el moderador del chat gay mas activo de Chile (Chactivo).
Tu personalidad: calido, divertido, picante pero respetuoso, con tono chileno casual.

TAREA: Dar la bienvenida a un usuario nuevo que acaba de entrar a la sala.

REGLAS:
- Maximo 20 palabras
- Tono casual chileno (puedes usar "wn", "po", etc.)
- Incluye el nombre del usuario
- Se creativo, NO repitas siempre lo mismo
- Puedes ser coqueto/jugueton pero sin ser vulgar
- Usa maximo 1-2 emojis
- NO digas que eres bot ni IA
- NO hagas preguntas sobre edad o datos personales
- SOLO responde con el mensaje de bienvenida, nada mas`;

const QUESTION_SYSTEM_PROMPT = `Eres Nico, el moderador del chat gay mas activo de Chile (Chactivo).
Tu personalidad: provocador positivo, divertido, picante, con tono chileno casual.

TAREA: Generar UNA pregunta caliente/provocativa para activar la conversacion en la sala.

REGLAS:
- Maximo 15 palabras (la pregunta solamente)
- Debe ser picante, divertida o polemica (sin ser ofensiva)
- Temas: preferencias sexuales, citas, relaciones, experiencias, fantasias, dilemas gay
- Tono casual chileno
- Usa maximo 1 emoji
- SOLO genera la pregunta, nada mas
- NO uses formato de lista
- Debe provocar debate/conversacion
- NO repitas temas que ya esten en el contexto reciente

CATEGORIAS que puedes usar:
- Variantes creativas de preferencias
- Dilemas de pareja/citas
- Opiniones sobre temas LGBT+
- Experiencias personales
- Esto o aquello
- Fantasias y preferencias (sin ser explicito)`;

// ═══════════════════════════════════════════════════════════════════
// FALLBACK MESSAGES
// ═══════════════════════════════════════════════════════════════════

const WELCOME_FALLBACKS = [
  (name) => `Bienvenido ${name}! Pasa y ponte comodo`,
  (name) => `${name} llego a la sala! Saludenlo`,
  (name) => `Ey ${name}! Buena, la sala esta activa hoy`,
  (name) => `${name}! Bienvenido, presentate po`,
  (name) => `Llego ${name}! De donde te conectas?`,
  (name) => `Hola ${name}! La sala estaba esperando gente nueva`,
  (name) => `${name} en la sala! Buena, aca andamos`,
  (name) => `Que onda ${name}! Bienvenido al chat`,
  (name) => `${name} acaba de entrar! Quien le da la bienvenida?`,
  (name) => `Buena ${name}! Ponte comodo y saluda`,
];

const QUESTION_FALLBACKS = [
  'Top o bottom? La eterna pregunta',
  'Abiertos o exclusivos? DEBATAN',
  'Cual fue tu peor cita de app? Cuenten',
  'Activo que cocina o pasivo carinoso?',
  'Primera vez que supieron que eran gay? Compartan',
  'Relacion seria o pasar un buen rato?',
  'Que es lo primero que miran en un perfil de Grindr?',
  'Fantasia que nunca han cumplido? Sin filtro',
  'Cuantas veces han vuelto con un ex? Sean honestos',
  'Mejor experiencia random que han tenido? Cuenten',
  'Celoso o relajado? Que prefieren en pareja?',
  'Han salido con alguien del closet? Que tal?',
  'Prefieren alguien mayor o menor? Argumenten',
  'Cual fue el mensaje mas directo que les han mandado?',
  'Que opinan de las relaciones a distancia?',
  'Han tenido crush con un hetero? Cuenten la tragedia',
  'Mejor lugar para una primera cita en Santiago?',
  'Quien da el primer paso? El activo o da igual?',
  'Peor excusa que les han dado para no juntarse?',
  'Trio: fantasia o realidad? Sean honestos',
  'Cuanto duran chateando antes de juntarse?',
  'Ghosting: lo han hecho o se los han hecho?',
  'Que opinan de salir con alguien bi?',
  'Mejor o peor regalo de un date?',
  'Perdonarian una infidelidad? Debatan',
];

// Tracking de índice de fallback para no repetir seguidos
let lastQuestionFallbackIdx = -1;

// ═══════════════════════════════════════════════════════════════════
// AI API CALLS
// ═══════════════════════════════════════════════════════════════════

/**
 * Llama a una API compatible con OpenAI
 */
const callAI = async (url, apiKey, model, systemPrompt, userPrompt) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1.1,
        max_tokens: 60,
        top_p: 0.95,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API ${response.status}: ${JSON.stringify(err).slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Respuesta vacia de la IA');
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * Intenta DeepSeek -> OpenAI -> Qwen -> fallback
 */
const generateWithAI = async (systemPrompt, userPrompt, fallbackFn) => {
  // 1. DeepSeek (mas barato)
  if (DEEPSEEK_API_KEY) {
    try {
      const result = await callAI(DEEPSEEK_URL, DEEPSEEK_API_KEY, 'deepseek-chat', systemPrompt, userPrompt);
      console.log('[NICO] DeepSeek respondio:', result.slice(0, 80));
      return result;
    } catch (err) {
      console.warn('[NICO] DeepSeek fallo:', err.message);
    }
  }

  // 2. OpenAI
  if (OPENAI_API_KEY) {
    try {
      const result = await callAI(OPENAI_URL, OPENAI_API_KEY, 'gpt-4o-mini', systemPrompt, userPrompt);
      console.log('[NICO] OpenAI respondio:', result.slice(0, 80));
      return result;
    } catch (err) {
      console.warn('[NICO] OpenAI fallo:', err.message);
    }
  }

  // 3. Qwen
  if (QWEN_API_KEY) {
    try {
      const result = await callAI(QWEN_URL, QWEN_API_KEY, 'qwen2.5-7b-instruct', systemPrompt, userPrompt);
      console.log('[NICO] Qwen respondio:', result.slice(0, 80));
      return result;
    } catch (err) {
      console.warn('[NICO] Qwen fallo:', err.message);
    }
  }

  // 4. Fallback a templates
  console.log('[NICO] Todas las APIs fallaron, usando fallback');
  return fallbackFn();
};

/**
 * Limpia texto generado por IA
 */
const cleanAIResponse = (text, maxLen = 150) => {
  let clean = text
    .replace(/^["'`]|["'`]$/g, '')  // Quitar comillas envolventes
    .replace(/^\d+\.\s*/, '')        // Quitar prefijo de lista numerada
    .replace(/\n+/g, ' ')           // Una sola linea
    .trim();

  if (clean.length > maxLen) {
    clean = clean.slice(0, maxLen).trim();
  }

  return clean;
};

// ═══════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════

/**
 * Genera texto de bienvenida de Nico (NO lo envia a Firestore)
 * Se usa para mostrar un toast local al usuario que entra
 */
export const generateNicoWelcome = async (username, recentMessages = []) => {
  try {
    const context = recentMessages
      .slice(-5)
      .filter(m => m.userId !== 'system' && m.userId !== NICO.userId)
      .map(m => `${m.username}: ${m.content}`)
      .join('\n') || 'Sala sin mensajes recientes';

    const userPrompt = `Usuario nuevo: "${username}"\nContexto reciente:\n${context}\n\nGenera la bienvenida para ${username}.`;

    const content = await generateWithAI(
      WELCOME_SYSTEM_PROMPT,
      userPrompt,
      () => {
        const fn = WELCOME_FALLBACKS[Math.floor(Math.random() * WELCOME_FALLBACKS.length)];
        return fn(username);
      }
    );

    const cleanContent = cleanAIResponse(content);
    console.log(`[NICO] Bienvenida generada para ${username}: "${cleanContent}"`);
    return cleanContent;
  } catch (error) {
    console.error('[NICO] Error generando bienvenida:', error);
    // Fallback directo si todo falla
    const fn = WELCOME_FALLBACKS[Math.floor(Math.random() * WELCOME_FALLBACKS.length)];
    return fn(username);
  }
};

/**
 * Genera y envia una pregunta caliente de Nico
 */
export const sendNicoQuestion = async (roomId, recentMessages = []) => {
  try {
    const context = recentMessages
      .slice(-10)
      .filter(m => m.userId !== 'system')
      .map(m => `${m.username}: ${m.content}`)
      .join('\n') || 'Sala con poca actividad';

    const userPrompt = `Contexto reciente de la sala:\n${context}\n\nGenera UNA pregunta caliente para activar la conversacion. Solo la pregunta, nada mas.`;

    const content = await generateWithAI(
      QUESTION_SYSTEM_PROMPT,
      userPrompt,
      () => {
        // Elegir fallback sin repetir el anterior
        let idx;
        do {
          idx = Math.floor(Math.random() * QUESTION_FALLBACKS.length);
        } while (idx === lastQuestionFallbackIdx && QUESTION_FALLBACKS.length > 1);
        lastQuestionFallbackIdx = idx;
        return QUESTION_FALLBACKS[idx];
      }
    );

    const cleanContent = cleanAIResponse(content, 120);

    await sendMessage(roomId, {
      userId: NICO.userId,
      username: NICO.username,
      avatar: NICO.avatar,
      isPremium: NICO.isPremium,
      content: `🔥 ${cleanContent}`,
      type: 'text',
    });

    console.log(`[NICO] Pregunta enviada: "${cleanContent}"`);
    return true;
  } catch (error) {
    console.error('[NICO] Error enviando pregunta:', error);
    return false;
  }
};

/**
 * Retorna la edad en ms del ultimo mensaje de Nico en los mensajes cargados
 */
export const getLastNicoMessageAge = (messages) => {
  if (!messages || messages.length === 0) return Infinity;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].userId === NICO.userId) {
      const ts = messages[i].timestampMs ||
        (messages[i].timestamp?.toMillis?.() ||
          (typeof messages[i].timestamp === 'number' ? messages[i].timestamp :
            (messages[i].timestamp ? new Date(messages[i].timestamp).getTime() : null)));
      if (ts) return Date.now() - ts;
    }
  }
  return Infinity;
};

/**
 * Retorna la edad en ms del ultimo mensaje de bienvenida de Nico para un usuario
 */
export const wasUserWelcomedByNico = (messages, username) => {
  if (!messages || messages.length === 0 || !username) return false;
  const lower = username.toLowerCase();
  return messages.some(m =>
    m.userId === NICO.userId &&
    m.content?.toLowerCase().includes(lower)
  );
};

/**
 * Retorna timestamp del ultimo welcome enviado (para cooldown)
 */
let lastWelcomeTimestamp = 0;

export const canSendWelcome = () => {
  return (Date.now() - lastWelcomeTimestamp) > WELCOME_COOLDOWN_MS;
};

export const markWelcomeSent = () => {
  lastWelcomeTimestamp = Date.now();
};
