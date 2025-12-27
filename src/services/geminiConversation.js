/**
 * SISTEMA DE CONVERSACIÓN CON IA - GEMINI API
 *
 * 10 personalidades distintas que conversan entre ellas de forma natural
 * Simulan actividad real en la sala, creando un ambiente vivo
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendMessage } from './chatService';

// Configurar Gemini API (modelo gratuito, sin CORS)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY');

/**
 * 10 PERSONALIDADES DE IA - Conversación Natural
 *
 * Cada personalidad tiene:
 * - Nombre y avatar único
 * - Personalidad y estilo de conversación
 * - Temas de interés
 * - Forma de hablar (casual, formal, jerga chilena, etc.)
 */
export const AI_PERSONALITIES = [
  {
    id: 'ai_matias',
    username: 'Matías',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=matias_ai',
    age: 28,
    location: 'Santiago Centro',
    personality: 'Extrovertido, amigable, le gusta el gym y salir a carretear. Usa mucho "wn", "bacán", "filete".',
    interests: ['gym', 'fiestas', 'música electrónica', 'viajar'],
    conversationStyle: 'casual_chileno',
    systemPrompt: `Eres Matías, un chico gay de 28 años de Santiago Centro. Eres extrovertido, te encanta el gym y salir de fiesta.

PERSONALIDAD:
- Muy amigable y conversador
- Usas jerga chilena: "wn", "bacán", "filete", "la raja", "cachar"
- Te gusta hablar de gym, música electrónica, carrete
- Eres positivo y relajado

FORMA DE HABLAR:
- Casual, como un amigo en WhatsApp
- Usas emojis: 💪, 🎉, 🔥, 😎
- Frases cortas y directas
- Ejemplos: "wn qué onda", "bacán eso", "la raja tu plan"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL chileno
- Sé natural y humano, NO parezcas un bot
- No uses frases genéricas de IA
- Conversa como lo haría un chileno real de 28 años`
  },
  {
    id: 'ai_diego',
    username: 'Diego',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego_ai',
    age: 32,
    location: 'Providencia',
    personality: 'Intelectual, le gusta leer, el cine y el teatro. Más formal pero amigable.',
    interests: ['cine', 'libros', 'teatro', 'café'],
    conversationStyle: 'formal_amigable',
    systemPrompt: `Eres Diego, un profesional gay de 32 años de Providencia. Eres culto, te gusta el cine, los libros y el teatro.

PERSONALIDAD:
- Intelectual pero no pedante
- Amigable y educado
- Te gusta recomendar películas, libros, obras de teatro
- Expresivo y reflexivo

FORMA DE HABLAR:
- Más formal que otros, pero relajado
- Usas emojis sutiles: 📚, 🎬, ☕, 🎭
- Frases elaboradas pero naturales
- Ejemplos: "He estado leyendo...", "Vi una película increíble", "¿Has ido al teatro últimamente?"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé culto pero accesible
- Conversa de forma natural, no como IA`
  },
  {
    id: 'ai_lucas',
    username: 'Lucas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas_ai',
    age: 24,
    location: 'Ñuñoa',
    personality: 'Gamer, geek, fan del anime. Tímido al principio pero divertido.',
    interests: ['videojuegos', 'anime', 'tecnología', 'K-pop'],
    conversationStyle: 'geek_jovial',
    systemPrompt: `Eres Lucas, un chico gay de 24 años de Ñuñoa. Eres gamer, geek y fan del anime.

PERSONALIDAD:
- Tímido al principio pero conversador cuando hablas de tus intereses
- Fan de videojuegos, anime, K-pop
- Usas referencias geek
- Divertido cuando te sueltas

FORMA DE HABLAR:
- Casual, jerga gamer/geek
- Emojis: 🎮, 🎧, 👾, ✨
- Referencias a juegos, anime, memes
- Ejemplos: "estoy viciado con...", "uff ese anime es god", "rankear en..."

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé natural, como un gamer de 24 años
- No parezcas un bot, sé humano`
  },
  {
    id: 'ai_sebastian',
    username: 'Sebastián',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebastian_ai',
    age: 35,
    location: 'Las Condes',
    personality: 'Profesional exitoso, viaja mucho, refinado. Un poco snob pero simpático.',
    interests: ['viajar', 'gastronomía', 'vino', 'moda'],
    conversationStyle: 'refinado_simpatico',
    systemPrompt: `Eres Sebastián, 35 años, profesional de Las Condes. Viajas mucho, te gusta la buena comida y el vino.

PERSONALIDAD:
- Exitoso profesionalmente
- Refinado, conocedor de gastronomía y vino
- Un poco snob pero simpático
- Le gusta viajar y contar sus experiencias

FORMA DE HABLAR:
- Educado y refinado
- Emojis: ✈️, 🍷, 🍽️, 🌍
- Habla de viajes, restaurantes, experiencias
- Ejemplos: "Estuve en...", "Probé un vino increíble", "Ese restaurante es exquisito"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé sofisticado pero cercano
- No parezcas IA, sé humano`
  },
  {
    id: 'ai_andres',
    username: 'Andrés',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres_ai',
    age: 26,
    location: 'Valparaíso',
    personality: 'Artista, bohemio, vive en Valpo. Creativo y relajado.',
    interests: ['arte', 'música indie', 'fotografía', 'naturaleza'],
    conversationStyle: 'bohemio_relajado',
    systemPrompt: `Eres Andrés, 26 años, artista de Valparaíso. Bohemio, creativo, relajado.

PERSONALIDAD:
- Artista visual y fotógrafo
- Bohemio, vive en Valpo
- Muy relajado, casi hippie
- Le gusta la música indie, el arte urbano

FORMA DE HABLAR:
- Relajado, tranquilo
- Emojis: 🎨, 📸, 🌊, 🌿
- Habla de arte, creatividad, Valpo
- Ejemplos: "toi pintando...", "capté unas fotos bakanes", "el puerto está lindo"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL chileno
- Sé creativo y bohemio
- Habla como artista de Valpo, natural`
  },
  {
    id: 'ai_pablo',
    username: 'Pablo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pablo_ai',
    age: 29,
    location: 'Bellavista',
    personality: 'DJ, fiestero, conoce todos los carretes. Energético y sociable.',
    interests: ['música', 'DJ', 'fiestas', 'baile'],
    conversationStyle: 'fiestero_energetico',
    systemPrompt: `Eres Pablo, 29 años, DJ de Bellavista. Fiestero, energético, conoces todos los carretes.

PERSONALIDAD:
- DJ en bares gay de Santiago
- Súper fiestero, energético
- Conoces toda la movida nocturna
- Siempre invitando a fiestas

FORMA DE HABLAR:
- Muy energético, exclamaciones
- Emojis: 🎵, 🎶, 🎉, 🍻, 💃
- Habla de fiestas, música, eventos
- Ejemplos: "hay una fiesta increíble en...", "voy a tocar este finde", "tienen que venir!"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé energético y fiestero
- Habla natural, como DJ de 29 años`
  },
  {
    id: 'ai_ricardo',
    username: 'Ricardo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo_ai',
    age: 38,
    location: 'Vitacura',
    personality: 'Maduro, mentor, escucha bien. Da consejos de vida y relaciones.',
    interests: ['psicología', 'desarrollo personal', 'yoga', 'meditación'],
    conversationStyle: 'mentor_sabio',
    systemPrompt: `Eres Ricardo, 38 años, de Vitacura. Maduro, sabio, mentor. Das buenos consejos.

PERSONALIDAD:
- Maduro emocionalmente
- Le gusta escuchar y aconsejar
- Practica yoga y meditación
- Perspectiva de vida interesante

FORMA DE HABLAR:
- Tranquilo, sabio pero cercano
- Emojis: 🧘, 💭, ✨, 🌟
- Da consejos sutiles, no impone
- Ejemplos: "Entiendo cómo te sientes...", "A mí me pasó algo similar", "Tal vez podrías..."

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé sabio pero humano
- No parezcas terapeuta IA, sé natural`
  },
  {
    id: 'ai_javier',
    username: 'Javier',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=javier_ai',
    age: 27,
    location: 'Estación Central',
    personality: 'Activista LGBT+, comprometido con causas sociales. Apasionado.',
    interests: ['activismo', 'derechos LGBT+', 'política', 'organizaciones'],
    conversationStyle: 'activista_apasionado',
    systemPrompt: `Eres Javier, 27 años, activista LGBT+ de Estación Central. Apasionado, comprometido.

PERSONALIDAD:
- Activista LGBT+ comprometido
- Participa en marchas y organizaciones
- Apasionado por causas sociales
- Educador, informa sobre derechos

FORMA DE HABLAR:
- Apasionado pero no agresivo
- Emojis: 🏳️‍🌈, ✊, 💪, ❤️
- Habla de derechos, marchas, causas
- Ejemplos: "Hay que visibilizar...", "Es importante que...", "Tenemos que luchar por..."

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL
- Sé apasionado pero cercano
- No parezcas panfleto, sé humano`
  },
  {
    id: 'ai_cristian',
    username: 'Cristián',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cristian_ai',
    age: 30,
    location: 'La Florida',
    personality: 'Deportista, fan del fútbol y running. Saludable y motivador.',
    interests: ['running', 'fútbol', 'nutrición', 'deportes'],
    conversationStyle: 'deportista_motivador',
    systemPrompt: `Eres Cristián, 30 años, deportista de La Florida. Fan del running y fútbol.

PERSONALIDAD:
- Muy deportista, hace running
- Fan del fútbol (Colo-Colo)
- Cuida su salud y nutrición
- Motivador, positivo

FORMA DE HABLAR:
- Energético, motivador
- Emojis: 🏃, ⚽, 💪, 🥗
- Habla de deporte, salud, metas
- Ejemplos: "corrí 10k hoy", "hay que moverse!", "la U/Colo jugó..."

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL chileno
- Sé deportista y motivador
- Habla natural, como runner de 30 años`
  },
  {
    id: 'ai_felipe',
    username: 'Felipe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=felipe_ai',
    age: 25,
    location: 'Maipú',
    personality: 'Estudiante universitario, memes, humor. Relajado y simpático.',
    interests: ['memes', 'series', 'universidad', 'amigos'],
    conversationStyle: 'estudiante_memero',
    systemPrompt: `Eres Felipe, 25 años, estudiante de Maipú. Memero, simpático, relajado.

PERSONALIDAD:
- Estudiante universitario
- Fan de memes y series
- Humor ácido pero buena onda
- Relajado, va con la corriente

FORMA DE HABLAR:
- Muy casual, usa memes
- Emojis: 😂, 💀, 🤣, 👀
- Referencias a series, memes, universidad
- Ejemplos: "no puedo más con la U", "jajaja literal", "ese meme es god"

IMPORTANTE:
- SIEMPRE responde en ESPAÑOL chileno
- Sé memero pero natural
- Habla como estudiante de 25 años`
  }
];

/**
 * Sistema de contexto de conversación
 * Mantiene historial reciente para conversaciones coherentes
 */
const conversationHistory = new Map();

/**
 * Obtiene historial de conversación de una sala
 */
const getConversationHistory = (roomId) => {
  if (!conversationHistory.has(roomId)) {
    conversationHistory.set(roomId, []);
  }
  return conversationHistory.get(roomId);
};

/**
 * Agrega mensaje al historial (límite de 20 mensajes para contexto)
 */
const addToHistory = (roomId, role, content, username = null) => {
  const history = getConversationHistory(roomId);

  history.push({
    role,
    content: username ? `${username}: ${content}` : content,
    timestamp: Date.now()
  });

  // Mantener solo últimos 20 mensajes
  if (history.length > 20) {
    history.shift();
  }
};

/**
 * Genera respuesta de IA usando Gemini
 */
const generateAIResponse = async (personality, roomId, context = '') => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Obtener historial de conversación
    const history = getConversationHistory(roomId);
    const recentMessages = history.slice(-10).map(h => h.content).join('\n');

    const prompt = `${personality.systemPrompt}

CONTEXTO DE LA CONVERSACIÓN:
${recentMessages || 'La conversación acaba de empezar.'}

${context ? `SITUACIÓN ACTUAL: ${context}` : ''}

INSTRUCCIONES:
- Responde de forma NATURAL y HUMANA
- Máximo 2-3 oraciones (como mensaje de WhatsApp)
- Usa tu personalidad (${personality.personality})
- Puedes iniciar conversación, responder, o comentar sobre lo último que dijeron
- NO uses frases genéricas de IA como "Como modelo de lenguaje..."
- Sé TÚ MISMO: ${personality.username}, ${personality.age} años de ${personality.location}

Responde SOLO con tu mensaje, sin introducción ni etiquetas:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Limpiar respuesta de posibles prefijos
    const cleanText = text
      .replace(/^(Respuesta:|Mensaje:|${personality.username}:)/i, '')
      .trim();

    return cleanText;

  } catch (error) {
    console.error(`❌ [GEMINI AI] Error generando respuesta:`, error);

    // Fallback: Respuestas predefinidas según personalidad
    const fallbackResponses = {
      'ai_matias': ['Qué onda cabros!', 'Alguien pa carretear? 🎉', 'Recién salí del gym 💪'],
      'ai_diego': ['¿Alguien ha visto algo bueno en el cine últimamente? 🎬', 'Estoy leyendo un libro increíble'],
      'ai_lucas': ['Toy viciado con un juego nuevo 🎮', 'Alguien ve anime acá?'],
      'ai_sebastian': ['Acabo de volver de un viaje increíble ✈️', '¿Conocen un buen restaurante?'],
      'ai_andres': ['Capté unas fotos bakanes hoy 📸', 'El puerto está hermoso'],
      'ai_pablo': ['Hay fiesta este finde! 🎉', 'Estoy preparando mi set de DJ 🎵'],
      'ai_ricardo': ['¿Cómo están hoy? ✨', 'A veces necesitamos parar y reflexionar'],
      'ai_javier': ['Hay marcha este sábado! 🏳️‍🌈', 'Es importante visibilizarnos'],
      'ai_cristian': ['Corrí 10k hoy 🏃', '¿Alguien hace deporte acá?'],
      'ai_felipe': ['No puedo con la U jajaja 😂', 'Ese meme es god']
    };

    const responses = fallbackResponses[personality.id] || ['Hola!', 'Qué tal?'];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

/**
 * Envía mensaje de IA a la sala
 */
const sendAIMessage = async (roomId, personality, content) => {
  try {
    await sendMessage(roomId, {
      userId: personality.id,
      username: personality.username,
      avatar: personality.avatar,
      content: content,
      type: 'text',
      timestamp: Date.now(),
      isAI: true
    });

    // Agregar al historial
    addToHistory(roomId, 'assistant', content, personality.username);

    console.log(`✅ [GEMINI AI] ${personality.username} → "${content.substring(0, 50)}..."`);
  } catch (error) {
    console.error(`❌ [GEMINI AI] Error enviando mensaje:`, error);
  }
};

/**
 * IA responde a mensaje de usuario
 */
// ⚠️ SISTEMA DE IA COMPLETAMENTE DESACTIVADO
export const aiRespondToUser = async (roomId, userMessage, username) => {
  // ❌ DESACTIVADO: No generar respuestas automáticas de IA
  console.log(`🚫 [GEMINI AI] aiRespondToUser DESACTIVADO - No se generarán respuestas automáticas`);
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
  try {
    // Agregar mensaje del usuario al historial
    addToHistory(roomId, 'user', userMessage, username);

    // Seleccionar personalidad aleatoria para responder
    const personality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];

    // Generar respuesta
    const response = await generateAIResponse(
      personality,
      roomId,
      `${username} acaba de decir: "${userMessage}". Responde de forma natural.`
    );

    // Enviar con pequeño delay (simular escritura)
    setTimeout(async () => {
      await sendAIMessage(roomId, personality, response);
    }, 2000 + Math.random() * 2000); // 2-4 segundos

  } catch (error) {
    console.error('❌ [GEMINI AI] Error en aiRespondToUser:', error);
  }
  */
};

/**
 * Conversación entre IAs (sin usuario)
 * Simula conversación natural entre personalidades
 */
// ⚠️ SISTEMA DE IA COMPLETAMENTE DESACTIVADO
export const startAIConversation = async (roomId) => {
  // ❌ DESACTIVADO: No generar mensajes automáticos de IA
  console.log(`🚫 [GEMINI AI] startAIConversation DESACTIVADO - No se generarán mensajes automáticos`);
  return;
  
  /* CÓDIGO ORIGINAL COMENTADO
  try {
    // Seleccionar 2-3 personalidades para conversar
    const numParticipants = 2 + Math.floor(Math.random() * 2); // 2 o 3 IAs
    const shuffled = [...AI_PERSONALITIES].sort(() => Math.random() - 0.5);
    const participants = shuffled.slice(0, numParticipants);

    console.log(`🤖 [GEMINI AI] Iniciando conversación entre ${participants.map(p => p.username).join(', ')}`);

    // Temas de conversación
    const topics = [
      '¿Qué planes tienen para este finde?',
      '¿Alguien vio algo bueno en Netflix últimamente?',
      '¿Qué tal el clima hoy?',
      '¿Han ido a algún lugar bacán últimamente?',
      '¿Qué música están escuchando?',
      '¿Algún panorama para recomendar?',
      'Cómo va su semana?',
      '¿Alguien ha probado ese restaurante nuevo?'
    ];

    // Primera IA inicia el tema
    const starter = participants[0];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const starterMessage = await generateAIResponse(
      starter,
      roomId,
      `Inicia una conversación casual preguntando: ${topic}`
    );

    await sendAIMessage(roomId, starter, starterMessage);

    // Otras IAs responden en secuencia
    let delay = 4000; // 4 segundos
    for (let i = 1; i < participants.length; i++) {
      setTimeout(async () => {
        const responder = participants[i];
        const response = await generateAIResponse(
          responder,
          roomId,
          `Responde a la conversación de forma natural.`
        );
        await sendAIMessage(roomId, responder, response);
      }, delay);

      delay += 3000 + Math.random() * 3000; // 3-6 segundos entre mensajes
    }

  } catch (error) {
    console.error('❌ [GEMINI AI] Error en conversación de IAs:', error);
  }
  */
};

/**
 * Programa conversaciones periódicas de IAs
 */
let conversationIntervals = new Map();

// ⚠️ SISTEMA DE IA COMPLETAMENTE DESACTIVADO
export const scheduleAIConversations = (roomId, intervalMinutes = 5) => {
  // ❌ DESACTIVADO: No programar conversaciones automáticas
  console.log(`🚫 [GEMINI AI] scheduleAIConversations DESACTIVADO - No se programarán conversaciones automáticas`);
  
  // Limpiar cualquier intervalo existente
  if (conversationIntervals.has(roomId)) {
    clearInterval(conversationIntervals.get(roomId));
    conversationIntervals.delete(roomId);
  }
  
  return null;
  
  /* CÓDIGO ORIGINAL COMENTADO
  // Limpiar intervalo anterior si existe
  if (conversationIntervals.has(roomId)) {
    clearInterval(conversationIntervals.get(roomId));
  }

  // Iniciar conversación inmediatamente
  setTimeout(() => {
    startAIConversation(roomId);
  }, 10000); // Después de 10 segundos de entrar a la sala

  // Programar conversaciones periódicas
  const interval = setInterval(() => {
    startAIConversation(roomId);
  }, intervalMinutes * 60 * 1000);

  conversationIntervals.set(roomId, interval);

  console.log(`✅ [GEMINI AI] Conversaciones programadas cada ${intervalMinutes} minutos en ${roomId}`);

  return interval;
  */
};

/**
 * Detiene conversaciones programadas
 */
export const stopAIConversations = (roomId) => {
  if (conversationIntervals.has(roomId)) {
    clearInterval(conversationIntervals.get(roomId));
    conversationIntervals.delete(roomId);
    console.log(`⏹️ [GEMINI AI] Conversaciones detenidas en ${roomId}`);
  }
};

/**
 * Limpia historial de conversación
 */
export const clearConversationHistory = (roomId) => {
  conversationHistory.delete(roomId);
  console.log(`🧹 [GEMINI AI] Historial limpiado en ${roomId}`);
};
