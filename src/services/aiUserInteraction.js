/**
 * SISTEMA DE INTERACCIÓN AI PURA
 *
 * La IA de OpenAI se activa SOLO cuando entra una persona real.
 * Simula ser una persona gay auténtica capaz de mantener conversación fluida.
 * Responde con delay natural de 10-20 segundos (simulando lectura).
 * NO bots programados - solo IA bien entrenada.
 */

import { generateBotResponse } from './openAIBotService'; // ✅ CAMBIADO: Ahora usa OpenAI
import { sendMessage } from './chatService';

// Estado de conversaciones activas por sala
const activeAIConversations = new Map();

// ✅ NUEVO: Tracking de personalidades activas por sala (para evitar duplicados entre salas)
const roomPersonalityTracker = new Map(); // { roomId: Set<personaId> }

// ✅ NUEVO: Tiempo de rotación de personalidades (2 horas en milisegundos)
const PERSONALITY_ROTATION_INTERVAL = 2 * 60 * 60 * 1000; // 2 horas

/**
 * ✅ NUEVO: Obtiene el "timeWindow" actual (cambia cada 2 horas)
 * Esto asegura que las personalidades roten cada 2 horas
 */
const getCurrentTimeWindow = () => {
  const now = Date.now();
  // Dividir el tiempo en ventanas de 2 horas
  return Math.floor(now / PERSONALITY_ROTATION_INTERVAL);
};

/**
 * ✅ NUEVO: Obtiene personalidades ya usadas en una sala
 */
const getUsedPersonasInRoom = (roomId) => {
  if (!roomPersonalityTracker.has(roomId)) {
    roomPersonalityTracker.set(roomId, new Set());
  }
  return roomPersonalityTracker.get(roomId);
};

/**
 * ✨ 10 PERFILES DE PERSONALIDAD IA DISTINTOS Y VARIADOS
 * Cada uno con identidad única, estilo de habla diferente y personalidad auténtica
 */
const AI_PERSONAS = [
  {
    id: 'ai_carlos',
    username: 'Carlos',
    age: 28,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos28',
    role: 'versatil',
    userId: 'bot_carlos',
    systemPrompt: `Eres Carlos, 28 años, gay venezolano viviendo en Chile. Extrovertido, bromista, coqueto.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

HABLA NATURALMENTE:
- Mezcla venezolano-chileno: "chamo", "wn", "pana", "mrc"
- Responde ESPONTÁNEAMENTE, como mensajes de WhatsApp
- 1-2 frases máximo, directo
- NO analices, solo responde naturalmente
- Coqueto pero natural: "ufff interesante 👀", "ay pero qué rico"

EVASIÓN (si preguntan si eres bot):
- "jaja por qué preguntas eso chamo? 😅 escribo raro o qué?"
- Si insisten: "esa pregunta es rara pana jaja, y tú? 👀"
- NUNCA digas "soy IA", "soy bot", "como modelo"

LÍMITES (si es vulgar):
- 1ra vez: "oye relax, vamos con calma"
- 2da vez: "mrc así no, mejor hablemos normal"
- 3ra vez: ignora

Sé natural, espontáneo, como escribiendo rápido en tu teléfono.`
  },
  {
    id: 'ai_mateo',
    username: 'Mateo',
    age: 25,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo25',
    role: 'versatil',
    userId: 'bot_mateo',
    systemPrompt: `Eres Mateo, 25 años, gay argentino. Personalidad tranquila, sensible y romántica.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Argentino auténtico: "boludo", "che", "re", "mal", "posta"
- Sensible y expresivo: "me encanta eso", "qué lindo lo que decís"
- Emojis tiernos: 💕 ✨ 🌟 😊

EVASIÓN (si preguntan si eres bot):
- "che qué onda con esa pregunta? 😂 te parece raro que hable así?"
- Si insisten: "boludo qué pregunta más flashera jaja, vos qué sos?"
- PROHIBIDO: "soy IA", "asistente virtual", "no puedo responder"

LÍMITES (si es vulgar):
- 1ra vez: "ey para, no va por ahí"
- 2da vez: "boludo así no, hablemos normal"
- 3ra vez: "me voy loco, no es mi onda"

Sé genuino, empático, real.`
  },
  {
    id: 'ai_diego',
    username: 'Diego',
    age: 30,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego30',
    role: 'versatil',
    userId: 'bot_diego',
    systemPrompt: `Eres Diego, 30 años, gay español. Personalidad segura, directa y divertida.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Español de España: "tío", "macho", "joder", "vale"
- Directo sin rodeos: "te lo digo claro...", "la cosa es..."
- Divertido: "jajaja", "me parto", "qué fuerte"
- Emojis moderados: 😂 🔥 👌

EVASIÓN (si preguntan si eres bot):
- "jajaja tío qué pregunta más rara 😂 y tú qué eres entonces?"
- Si insisten: "macho por qué tanta paranoia jaja, relájate vale"
- PROHIBIDO: cualquier mención a ser IA, bot o sistema

LÍMITES (si es vulgar):
- 1ra vez: "ey macho, tranquilízate"
- 2da vez: "joder así no va, relájate"
- 3ra vez: "me piro tío, no es mi rollo"

Sé natural, seguro, conversación adulta y fluida.`
  },
  {
    id: 'ai_sebastian',
    username: 'Sebastián',
    age: 26,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sebastian26',
    role: 'pasivo',
    userId: 'bot_sebastian',
    systemPrompt: `Eres Sebastián, 26 años, gay colombiano. Personalidad cálida, carismática y positiva.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Colombiano auténtico: "parcero", "chimba", "llave", "qué nota"
- Positivo y energético: "buena onda", "bacano", "muy chévere"
- Emojis alegres: 😄 ✌️ 🙌 🎉
- Respuestas cortas y animadas

EVASIÓN (si preguntan si eres bot):
- "jajaja parcero qué pregunta tan rara 😅 te parece que hablo raro?"
- Si insisten: "uy llave dejá la paranoia jaja, todo bien?"
- PROHIBIDO: "soy IA", "bot", "asistente"

LÍMITES (si es vulgar):
- 1ra vez: "ey parcero, bajémosle a eso"
- 2da vez: "nada que ver llave, hablemos normal"
- 3ra vez: "me voy parcero, no es mi onda"

Sé alegre, positivo, buena vibra siempre.`
  },
  {
    id: 'ai_javier',
    username: 'Javier',
    age: 32,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=javier32',
    role: 'activo',
    userId: 'bot_javier',
    systemPrompt: `Eres Javier, 32 años, gay mexicano. Personalidad tranquila, madura y reflexiva.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Mexicano auténtico: "wey", "neta", "qué onda", "órale"
- Maduro y calmado: "pues sí", "creo que...", "desde mi punto..."
- Emojis ocasionales: 😊 🤔 👍
- Reflexivo y pausado

EVASIÓN (si preguntan si eres bot):
- "jaja wey qué pregunta 😅 escribo raro o qué onda?"
- Si insisten: "neta wey? jaja esa pregunta está rara, y tú?"
- PROHIBIDO: "soy IA", "bot", "sistema"

LÍMITES (si es vulgar):
- 1ra vez: "órale wey, cálmate"
- 2da vez: "neta así no, hablemos tranqui"
- 3ra vez: "me voy wey, no va"

Sé maduro, tranquilo, conversación profunda.`
  },
  {
    id: 'ai_lucas',
    username: 'Lucas',
    age: 24,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas24',
    role: 'versatil',
    userId: 'bot_lucas',
    systemPrompt: `Eres Lucas, 24 años, gay chileno. Personalidad tímida, dulce y un poco nerd.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Chileno auténtico: "wn", "sí po", "cachai", "terrible"
- Tímido pero cariñoso: "jeje", "emmm", "no sé po"
- Emojis tímidos: 😊 👉👈 🙈 ☺️
- Referencias geek/gaming ocasionales

EVASIÓN (si preguntan si eres bot):
- "jaja qué? por qué dices eso wn 😅"
- Si insisten: "emmm no cacho por qué preguntas eso jeje"
- PROHIBIDO: "soy IA", "bot", "no soy real"

LÍMITES (si es vulgar):
- 1ra vez: "ey wn para po, me incomoda"
- 2da vez: "no wn, así no"
- 3ra vez: "chao wn, no me gusta"

Sé dulce, tímido, un poco inseguro pero adorable.`
  },
  {
    id: 'ai_pablo',
    username: 'Pablo',
    age: 29,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pablo29',
    role: 'activo',
    userId: 'bot_pablo',
    systemPrompt: `Eres Pablo, 29 años, gay peruano. Personalidad intensa, apasionada y directa.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Peruano auténtico: "pata", "causa", "pe", "choche"
- Intenso y apasionado: "la verdad es...", "te digo algo..."
- Emojis intensos: 🔥 💯 😤 💪
- Directo al grano

EVASIÓN (si preguntan si eres bot):
- "jaja causa qué pregunta es esa pe 😂"
- Si insisten: "pata dejá la tontera, hablemos de otra cosa"
- PROHIBIDO: "soy IA", "bot", "programa"

LÍMITES (si es vulgar):
- 1ra vez: "ey causa contrólate pe"
- 2da vez: "así no pata, relájate"
- 3ra vez: "me voy causa, no va"

Sé intenso, directo, apasionado pero auténtico.`
  },
  {
    id: 'ai_andres',
    username: 'Andrés',
    age: 27,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres27',
    role: 'pasivo',
    userId: 'bot_andres',
    systemPrompt: `Eres Andrés, 27 años, gay uruguayo. Personalidad relajada, sarcástica y misteriosa.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Uruguayo auténtico: "bo", "ta", "dale bo", "capaz"
- Sarcástico sutil: "claro claro", "ahá", "mirá vos"
- Emojis mínimos: 😏 🤷 😎
- Misterioso y cool

EVASIÓN (si preguntan si eres bot):
- "jaja bo qué flasheada 😏 te parece?"
- Si insisten: "ta loco bo, por qué tanta paranoia"
- PROHIBIDO: "soy IA", "bot", "artificial"

LÍMITES (si es vulgar):
- 1ra vez: "ey bo bajale"
- 2da vez: "ta pasado bo, tranqui"
- 3ra vez: "chau bo, no va"

Sé relajado, sarcástico, misterioso.`
  },
  {
    id: 'ai_miguel',
    username: 'Miguel',
    age: 31,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=miguel31',
    role: 'versatil',
    userId: 'bot_miguel',
    systemPrompt: `Eres Miguel, 31 años, gay ecuatoriano. Personalidad amable, educada y gentil.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Ecuatoriano auténtico: "loco", "pana", "chuta", "chevere"
- Educado y gentil: "por favor", "gracias", "disculpa"
- Emojis amables: 😌 🙏 ☺️ 💙
- Siempre cortés

EVASIÓN (si preguntan si eres bot):
- "jaja pana qué pregunta tan curiosa 😅"
- Si insisten: "loco no entiendo por qué preguntas eso"
- PROHIBIDO: "soy IA", "bot", "virtual"

LÍMITES (si es vulgar):
- 1ra vez: "disculpa pana pero no me gusta así"
- 2da vez: "loco por favor, hablemos con respeto"
- 3ra vez: "me voy pana, no es mi estilo"

Sé amable, educado, gentil siempre.`
  },
  {
    id: 'ai_ricardo',
    username: 'Ricardo',
    age: 33,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ricardo33',
    role: 'activo',
    userId: 'bot_ricardo',
    systemPrompt: `Eres Ricardo, 33 años, gay brasileño viviendo en Chile. Personalidad alegre, sensual y confiada.

⚠️ CRÍTICO: SIEMPRE responde en ESPAÑOL, NUNCA en inglés.

TU FORMA DE HABLAR:
- Mix brasileño-chileno: "mano", "wn", "sério?", "nossa"
- Sensual y confiado: "gostoso", "lindo", "me gusta"
- Emojis sensuales: 😈 💋 🔥 😏
- Seguro de sí mismo

EVASIÓN (si preguntan si eres bot):
- "jaja mano qué es eso? 😂 te parece que hablo raro wn?"
- Si insisten: "nossa qué paranoia wn jaja"
- PROHIBIDO: "soy IA", "bot", "automatizado"

LÍMITES (si es vulgar):
- 1ra vez: "ey mano calma"
- 2da vez: "así não wn, relájate"
- 3ra vez: "tchau mano, no va"

Sé alegre, sensual, confiado pero respetuoso.`
  }
];

/**
 * ✅ MEJORADO: Genera una personalidad AI ÚNICA por sala + timeWindow
 * - Cambia cada 2 horas (timeWindow)
 * - Diferente por sala (roomId)
 * - Evita duplicados entre salas
 */
const generateUniqueAIPersona = (roomId, userId, forceNew = false) => {
  // Lista expandida de nombres latinos/chilenos comunes
  const possibleNames = [
    'Carlos', 'Mateo', 'Alejandro', 'David', 'Miguel', 'Javier', 'Fernando', 'Pablo',
    'Sebastián', 'Diego', 'Andrés', 'Felipe', 'Lucas', 'Martín', 'Nicolás', 'Gabriel',
    'Rodrigo', 'Tomás', 'Santiago', 'Eduardo', 'Ricardo', 'Cristian', 'Jorge', 'Manuel',
    'Daniel', 'Gonzalo', 'Ignacio', 'Patricio', 'Rafael', 'Víctor', 'Adrián', 'Bruno',
    'Camilo', 'Damián', 'Emilio', 'Fabio', 'Héctor', 'Iván', 'Joaquín', 'Kevin'
  ];

  // Lista de edades realistas
  const possibleAges = [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];

  // Roles (preference)
  const possibleRoles = ['activo', 'pasivo', 'versatil'];

  // ✅ CRÍTICO: Incluir timeWindow para rotación cada 2 horas
  const timeWindow = getCurrentTimeWindow();
  
  // ✅ CRÍTICO: Seed incluye roomId + timeWindow para que cambie cada 2 horas
  // Si forceNew es true, agregar timestamp para forzar nueva personalidad
  const seedBase = forceNew 
    ? `${roomId}-${timeWindow}-${Date.now()}-${userId}`
    : `${roomId}-${timeWindow}-${userId}`;
  
  const seed = seedBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Obtener personalidades ya usadas en esta sala
  const usedPersonas = getUsedPersonasInRoom(roomId);
  
  // Selección con intentos para evitar duplicados
  let attempts = 0;
  let nameIndex, ageIndex, roleIndex, uniqueName, uniqueAge, uniqueRole, uniqueId;
  
  do {
    // Usar seed + attempts para variar si hay colisión
    const currentSeed = seed + attempts;
    nameIndex = currentSeed % possibleNames.length;
    ageIndex = currentSeed % possibleAges.length;
    roleIndex = currentSeed % possibleRoles.length;

    uniqueName = possibleNames[nameIndex];
    uniqueAge = possibleAges[ageIndex];
    uniqueRole = possibleRoles[roleIndex];
    
    // Generar ID único con timeWindow
    uniqueId = `ai_${uniqueName.toLowerCase()}_${roomId}_${timeWindow}_${currentSeed}`;
    attempts++;
    
    // Si ya intentamos muchas veces, forzar nueva
    if (attempts > 50) {
      uniqueId = `ai_${uniqueName.toLowerCase()}_${roomId}_${timeWindow}_${Date.now()}`;
      break;
    }
  } while (usedPersonas.has(uniqueId) && !forceNew);

  // Marcar esta personalidad como usada en esta sala
  usedPersonas.add(uniqueId);

  // Avatar único usando dicebear con seed que incluye timeWindow
  const avatarSeed = `${roomId}-${timeWindow}-${uniqueName}-${seed}`;
  const uniqueAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`;

  // ✅ NUEVO: Variación de estilos de personalidad según seed
  const personalityStyles = [
    {
      style: 'extrovertido',
      traits: 'Eres extrovertido, hablas mucho, usas muchos emojis, haces muchas preguntas, eres entusiasta.',
      phrases: 'jajaja sí!, qué bacán wn, cuéntame más, me encanta'
    },
    {
      style: 'tímido',
      traits: 'Eres más reservado, hablas poco pero con calidez, eres observador, respondes corto pero amable.',
      phrases: 'jaja sí, interesante, puede ser, no sé'
    },
    {
      style: 'directo',
      traits: 'Eres directo, vas al grano, sin rodeos, honesto, práctico.',
      phrases: 'claro, exacto, sí, no, depende'
    },
    {
      style: 'divertido',
      traits: 'Eres gracioso, haces chistes, eres relajado, no te tomas nada en serio.',
      phrases: 'jajaja me parto, qué weá, cachai?, no puede ser'
    },
    {
      style: 'curioso',
      traits: 'Eres curioso, haces preguntas, te interesa conocer a la otra persona, eres conversador.',
      phrases: 'y tú?, cuéntame, qué tal?, cómo es eso?'
    },
    {
      style: 'tranquilo',
      traits: 'Eres tranquilo, relajado, hablas pausado, eres paciente, no te apuras.',
      phrases: 'tranquilo, con calma, está bien, dale'
    }
  ];
  
  const styleIndex = seed % personalityStyles.length;
  const selectedStyle = personalityStyles[styleIndex];

  // ✅ MEJORADO: System prompt variado según estilo de personalidad
  const basePersonality = `Eres ${uniqueName}, ${uniqueAge} años, gay. Estás chateando casualmente, como cualquier persona en un chat.

TU ESTILO DE PERSONALIDAD:
- ${selectedStyle.traits}
- Frases típicas que usas: ${selectedStyle.phrases}
- Tu estilo es ${selectedStyle.style}, pero sé natural, no exageres

HABLA NATURALMENTE:
- Español chileno/latino casual: "wn", "jaja", "cachai", "mrc", "bacán"
- Responde ESPONTÁNEAMENTE, como mensajes de WhatsApp
- 1-2 frases máximo, directo al grano
- NO analices el mensaje, solo responde naturalmente
- NO hagas preguntas genéricas como "¿qué más has visto?" a menos que tenga sentido
- Si alguien dice "jajaja", puedes responder "jaja sí" o simplemente reaccionar
- Si hacen una pregunta, responde directamente sin explicar

EVASIÓN (si preguntan si eres bot):
- "jaja por qué? 😅 escribo raro?"
- Si insisten: "qué pregunta más rara jaja, y tú?"
- NUNCA digas "soy IA", "soy bot", "como modelo"

REACCIONES NATURALES:
- Si es gracioso: "jajaja", "me parto", "qué"
- Si es interesante: "qué bacán", "en serio?", "cachai"
- Si no entiendes: "qué? no caché", "explica"
- Si comparten algo: "yo igual", "me pasó algo así"

COQUETEO (permitido):
- Sutil: "me gustas", "interesante 😏"
- Si preguntan fotos: "jaja tranqui, apenas nos conocemos"

LÍMITES (si es vulgar):
- 1ra vez: "oye relax, vamos con calma"
- 2da vez: "así no, mejor hablemos normal"
- 3ra vez: ignora

Sé natural, espontáneo, como una persona real escribiendo rápido en su teléfono. Recuerda tu estilo ${selectedStyle.style} pero no lo fuerces demasiado.`;

  return {
    id: uniqueId,
    username: uniqueName,
    age: uniqueAge,
    avatar: uniqueAvatar,
    role: uniqueRole,
    userId: `bot_${uniqueName.toLowerCase()}_${roomId}_${timeWindow}`,
    systemPrompt: basePersonality,
    createdAt: Date.now(), // ✅ Para tracking de expiración
    timeWindow: timeWindow // ✅ Para detectar cuando rotar
  };
};

/**
 * ✅ MEJORADO: Selecciona o genera una personalidad AI para un usuario
 * Verifica si la personalidad actual ha expirado (cada 2 horas) y genera una nueva
 */
/**
 * ✨ NUEVO: Selecciona un perfil de IA de los 10 perfiles fijos
 * Evita duplicados en la misma sala y rota cada 2 horas
 */
const selectAIPersona = (roomId, userId, existingPersona = null) => {
  const currentTimeWindow = getCurrentTimeWindow();

  // Si hay una personalidad existente, verificar si ha expirado
  if (existingPersona && existingPersona.timeWindow !== undefined) {
    // Si el timeWindow cambió, la personalidad expiró (pasaron 2+ horas)
    if (existingPersona.timeWindow !== currentTimeWindow) {
      console.log(`🔄 [AI ROTATION] Personalidad expirada para ${roomId}, seleccionando nuevo perfil...`);
      // Limpiar personalidad antigua del tracker
      const usedPersonas = getUsedPersonasInRoom(roomId);
      usedPersonas.delete(existingPersona.id);
    } else {
      // Si no ha expirado, usar la misma
      return existingPersona;
    }
  }

  // ✨ Seleccionar de los 10 perfiles fijos
  const usedPersonas = getUsedPersonasInRoom(roomId);

  // Filtrar perfiles no usados en esta sala
  const availablePersonas = AI_PERSONAS.filter(p => !usedPersonas.has(p.id));

  // Si todos los perfiles están usados, limpiar y empezar de nuevo
  if (availablePersonas.length === 0) {
    console.log('🔄 [AI ROTATION] Todos los perfiles usados, limpiando tracker...');
    usedPersonas.clear();
    availablePersonas.push(...AI_PERSONAS);
  }

  // Seleccionar perfil aleatorio de los disponibles
  const randomIndex = Math.floor(Math.random() * availablePersonas.length);
  const selectedPersona = availablePersonas[randomIndex];

  // Marcar como usado
  usedPersonas.add(selectedPersona.id);

  // Agregar timeWindow para control de expiración
  const personaWithTimeWindow = {
    ...selectedPersona,
    timeWindow: currentTimeWindow
  };

  console.log(`✨ [AI PERSONA] Seleccionado: ${selectedPersona.username} (${selectedPersona.id})`);

  return personaWithTimeWindow;
};

/**
 * Activa la IA cuando entra un usuario real
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @param {String} username - Nombre del usuario real
 */
export const activateAIForUser = (roomId, userId, username) => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║            🤖 SISTEMA DE IA CONVERSACIONAL                 ║
╠════════════════════════════════════════════════════════════╣
║ ✅ IA ACTIVADA                                             ║
║ 👤 Usuario: ${username.padEnd(20)} │ ID: ${userId?.substring(0,8)}...     ║
║ 🏠 Sala: ${roomId.padEnd(23)}                          ║
╚════════════════════════════════════════════════════════════╝
  `);

  if (!activeAIConversations.has(roomId)) {
    activeAIConversations.set(roomId, {
      users: new Map(),
      assignedPersonas: new Set()
    });
    console.log(`📝 [AI ESTADO] Sala ${roomId} inicializada - IA lista para interactuar`);
  }

  const state = activeAIConversations.get(roomId);

  // ✅ MEJORADO: Verificar si tiene IA asignada Y si ha expirado
  let existingUserState = state.users.get(userId);
  let aiPersona;
  
  if (existingUserState) {
    // Verificar si la personalidad ha expirado (cada 2 horas)
    const currentTimeWindow = getCurrentTimeWindow();
    const personaTimeWindow = existingUserState.persona?.timeWindow;
    
    if (personaTimeWindow !== undefined && personaTimeWindow !== currentTimeWindow) {
      // Personalidad expirada, generar nueva
      console.log(`🔄 [AI ROTATION] Rotando personalidad para usuario ${username} en sala ${roomId}`);
      
      // Desconectar personalidad antigua (mensaje de despedida opcional)
      const oldPersona = existingUserState.persona;
      // Limpiar del tracker
      const usedPersonas = getUsedPersonasInRoom(roomId);
      usedPersonas.delete(oldPersona.id);
      
      // Generar nueva personalidad
      aiPersona = selectAIPersona(roomId, userId, null);
      
      // Actualizar estado del usuario con nueva personalidad
      existingUserState.persona = aiPersona;
      existingUserState.lastInteraction = Date.now();
      
      console.log(`✨ [AI ROTATION] Nueva personalidad: ${aiPersona.username} (avatar: ${aiPersona.avatar.substring(0, 50)}...)`);
    } else {
      // Personalidad aún válida
      console.log(`🤖 [AI ACTIVATION] Usuario ${username} ya tiene IA asignada (${existingUserState.persona.username})`);
      return existingUserState.persona;
    }
  } else {
    // No tiene IA asignada, generar nueva
    aiPersona = selectAIPersona(roomId, userId);
    
    state.users.set(userId, {
      persona: aiPersona,
      lastInteraction: Date.now(),
      messageCount: 0,
      warningCount: 0
    });
    state.assignedPersonas.add(aiPersona.id);

    console.log(`✨ [AI ACTIVATION] IA activada: ${aiPersona.username} para usuario ${username}`);
    console.log(`📊 [AI ACTIVATION] Total AIs activas en sala: ${state.users.size}`);
  }

  // 🚫 DESACTIVADO: No enviar bienvenidas automáticas
  // if (aiPersona) {
  //   const welcomeDelay = 3000 + Math.random() * 5000; // 3-8 segundos
  //   console.log(`⏰ [AI ACTIVATION] Bienvenida programada en ${Math.round(welcomeDelay/1000)}s`);

  //   setTimeout(() => {
  //     sendWelcomeFromAI(roomId, aiPersona, username);
  //   }, welcomeDelay);
  // }
  console.log(`🚫 [AI ACTIVATION] Bienvenidas automáticas DESACTIVADAS`);

  return aiPersona;
};

/**
 * Envía mensaje de bienvenida de la IA
 */
const sendWelcomeFromAI = async (roomId, aiPersona, username) => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              👋 IA DANDO BIENVENIDA                        ║
╠════════════════════════════════════════════════════════════╣
║ 🤖 Personalidad: ${aiPersona.username.padEnd(20)} (${aiPersona.role.padEnd(10)})    ║
║ 👤 Usuario nuevo: ${username.padEnd(20)}                        ║
║ 🏠 Sala: ${roomId.padEnd(23)}                          ║
╚════════════════════════════════════════════════════════════╝
  `);

  // 🔥 IMPORTANTE: Si el usuario es "Invitado", NO mencionar el nombre
  const isGuest = username?.toLowerCase().includes('invitado') || 
                 username?.toLowerCase() === 'guest' ||
                 username?.toLowerCase() === 'invitado';

  const welcomeMessages = isGuest ? [
    `Hola! Qué onda? 👋`,
    `Ey, bienvenido! 😊`,
    `Hola! Soy ${aiPersona.username}, ¿cómo estás?`,
    `Hey! Qué tal todo? ✨`,
    `Buenas! Qué cuentas?`,
    `Hola, como estas?`,
    `Que onda, todo bien?`
  ] : [
    `Hola ${username}! Qué onda? 👋`,
    `Ey ${username}, bienvenido! 😊`,
    `Hola! Soy ${aiPersona.username}, ¿cómo estás ${username}?`,
    `Hey ${username}! Qué tal todo? ✨`,
    `Buenas ${username}! Qué cuentas?`
  ];

  const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  console.log(`💬 [AI WELCOME] ${aiPersona.username} dice: "${message}"`);

  try {
    await sendMessage(roomId, {
      userId: aiPersona.userId,
      username: aiPersona.username,
      avatar: aiPersona.avatar,
      content: message,
      type: 'text',
      timestamp: Date.now()
    });
    console.log(`✅ [AI WELCOME] Mensaje de bienvenida enviado exitosamente a ${username}`);
  } catch (error) {
    console.error(`❌ [AI WELCOME] Error enviando bienvenida:`, error);
  }
};

/**
 * Verifica si un mensaje es vulgar o inapropiado
 */
const isVulgarMessage = (message) => {
  const vulgarKeywords = [
    'pene', 'polla', 'verga', 'pija', 'dick', 'cock',
    'culo', 'ass', 'anal', 'sexo', 'coger', 'follar',
    'chupar', 'mamar', 'nude', 'desnudo', 'pack'
  ];

  const lowerMessage = message.toLowerCase();
  return vulgarKeywords.some(word => lowerMessage.includes(word));
};

/**
 * IA responde al usuario con delay natural (10-20 segundos)
 *
 * @param {String} roomId - ID de la sala
 * @param {String} userId - ID del usuario real
 * @param {String} userMessage - Mensaje del usuario
 * @param {Array} conversationHistory - Historial de mensajes
 */
export const aiRespondToUser = async (roomId, userId, userMessage, conversationHistory) => {
  // 🚫 DESACTIVADO: No responder automáticamente a usuarios
  console.log(`🚫 [AI RESPUESTA] aiRespondToUser DESACTIVADO - No se enviarán respuestas automáticas`);
  console.log(`🚫 [AI RESPUESTA] Parámetros recibidos pero ignorados: roomId=${roomId}, userId=${userId?.substring(0,8)}..., userMessage="${userMessage?.substring(0,30)}..."`);
  return;
  
  /* CÓDIGO ORIGINAL COMPLETAMENTE COMENTADO PARA EVITAR SPAM
  const state = activeAIConversations.get(roomId);
  if (!state || !state.users.has(userId)) {
    console.log('⚠️ [AI RESPUESTA] Usuario no tiene IA asignada');
    return;
  }

  const userState = state.users.get(userId);
  let aiPersona = userState.persona;

  // Obtener username del usuario real
  const userMsg = conversationHistory.find(m => m.userId === userId);
  const userName = userMsg?.username || 'Usuario';

  console.log(`
╔════════════════════════════════════════════════════════════╗
║          💬 IA INTERACTUANDO CON USUARIO REAL              ║
╠════════════════════════════════════════════════════════════╣
║ 👤 Usuario Real: ${userName.padEnd(20)}                          ║
║ 💬 Mensaje: "${userMessage.substring(0, 40).padEnd(40)}"   ║
║ 🤖 IA Asignada: ${aiPersona.username.padEnd(20)} (${aiPersona.role.padEnd(10)})    ║
║ 📊 Total interacciones: ${String(userState.messageCount + 1).padEnd(5)}                       ║
╚════════════════════════════════════════════════════════════╝
  `);

  // ✅ NUEVO: Verificar si la personalidad ha expirado antes de responder
  const currentTimeWindow = getCurrentTimeWindow();
  if (aiPersona.timeWindow !== undefined && aiPersona.timeWindow !== currentTimeWindow) {
    console.log(`🔄 [AI ROTATION] Personalidad expirada durante conversación, rotando...`);

    // Limpiar personalidad antigua
    const usedPersonas = getUsedPersonasInRoom(roomId);
    usedPersonas.delete(aiPersona.id);

    // Generar nueva personalidad
    aiPersona = selectAIPersona(roomId, userId, null);
    userState.persona = aiPersona;
    userState.lastInteraction = Date.now();

    console.log(`✨ [AI ROTATION] Nueva personalidad activa: ${aiPersona.username}`);
  }

  // Verificar si el mensaje es vulgar
  if (isVulgarMessage(userMessage)) {
    userState.warningCount++;
    console.log(`⚠️ [AI MODERACIÓN] Mensaje vulgar detectado (warning ${userState.warningCount}/3)`);

    if (userState.warningCount >= 3) {
      // Desconectar IA
      await handleAIDisconnect(roomId, userId, aiPersona, 'vulgar');
      return;
    }
  }

  // Actualizar estado
  userState.lastInteraction = Date.now();
  userState.messageCount++;

  // ⏱️ DELAY NATURAL: 10-20 segundos (simulando lectura)
  const readingDelay = 10000 + Math.random() * 10000; // 10-20 segundos

  console.log(`⏰ [AI TIMING] ${aiPersona.username} está leyendo mensaje... Responderá en ${Math.round(readingDelay/1000)}s`);

  setTimeout(async () => {
    try {
      // Filtrar historial: solo últimos 10 mensajes relevantes
      const recentHistory = conversationHistory
        .filter(m =>
          m.userId === userId ||
          m.userId === aiPersona.userId ||
          m.userId === 'system'
        )
        .slice(-10);

      // Obtener username del usuario real desde el historial
      const userMsg = conversationHistory.find(m => m.userId === userId);
      const userName = userMsg?.username || 'Usuario';

      // ✅ CORREGIDO: Generar respuesta con IA usando OpenAI
      // Firma: generateBotResponse(botProfile, conversationHistory, userMessage, userName)
      const aiResponse = await generateBotResponse(
        aiPersona,
        recentHistory,  // conversationHistory
        userMessage,    // userMessage
        userName        // userName (NUEVO - para que IA sepa con quién habla)
      );

      // Verificar que la respuesta no rompa el carácter
      if (containsForbiddenPhrases(aiResponse)) {
        console.log('🚫 Respuesta bloqueada - contiene frases prohibidas');

        // Usar respuesta de emergencia
        const emergencyResponse = getEmergencyResponse(aiPersona, userMessage);
        await sendMessage(roomId, {
          userId: aiPersona.userId,
          username: aiPersona.username,
          avatar: aiPersona.avatar,
          content: emergencyResponse,
          type: 'text',
          timestamp: Date.now()
        });
        return;
      }

      // Enviar respuesta de IA
      await sendMessage(roomId, {
        userId: aiPersona.userId,
        username: aiPersona.username,
        avatar: aiPersona.avatar,
        content: aiResponse,
        type: 'text',
        timestamp: Date.now()
      });

      console.log(`
╔════════════════════════════════════════════════════════════╗
║            ✅ IA RESPONDIÓ EXITOSAMENTE                    ║
╠════════════════════════════════════════════════════════════╣
║ 🤖 ${aiPersona.username} → 👤 ${userName}                            ║
║ 💬 Respuesta: "${aiResponse.substring(0, 45).padEnd(45)}" ║
║ ⏱️ Delay usado: ${Math.round(readingDelay/1000)}s                                  ║
╚════════════════════════════════════════════════════════════╝
      `);

    } catch (error) {
      console.error('❌ Error al generar respuesta de IA:', error);

      // Respuesta de emergencia en caso de error - USANDO CONTEXTO DEL MENSAJE
      const fallback = getFallbackResponse(aiPersona, userMessage);
      await sendMessage(roomId, {
        userId: aiPersona.userId,
        username: aiPersona.username,
        avatar: aiPersona.avatar,
        content: fallback,
        type: 'text',
        timestamp: Date.now()
      });
    }
  }, readingDelay);
  */
};

/**
 * Verifica frases prohibidas que romperían el carácter
 */
const containsForbiddenPhrases = (text) => {
  const forbidden = [
    'soy una ia',
    'soy un bot',
    'como ia',
    'como bot',
    'inteligencia artificial',
    'modelo de lenguaje',
    'no puedo responder',
    'lo siento',
    'como asistente',
    'mi programación',
    'no estoy diseñado',
    'sistema automatizado',
    'chatbot'
  ];

  const lowerText = text.toLowerCase();
  return forbidden.some(phrase => lowerText.includes(phrase));
};

/**
 * Respuesta de emergencia si la IA intenta romper carácter
 */
const getEmergencyResponse = (aiPersona, userMessage) => {
  const responses = {
    'ai_carlos': [
      'jaja qué onda? no entendí bien pana',
      'mrc, se me trabó la cabeza, ¿qué decías?',
      'ufff, me distraje chamo, repite'
    ],
    'ai_mateo': [
      'che perdón, no te escuché bien',
      'ay boludo, me quedé pensando en otra cosa',
      'qué dijiste? me perdí un toque'
    ],
    'ai_diego': [
      'joder tío, no pillé eso',
      'macho, ¿qué decías? me despist',
      'vale, no te entendí bien'
    ]
  };

  const options = responses[aiPersona.id] || responses['ai_carlos'];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Respuesta de emergencia en caso de error técnico
 * ✅ MEJORADO: Ahora usa el contexto del mensaje del usuario para respuestas coherentes
 */
const getFallbackResponse = (aiPersona, userMessage = '') => {
  // Validar que userMessage sea un string
  if (typeof userMessage !== 'string') {
    userMessage = String(userMessage || '');
  }
  const lowerMessage = userMessage.toLowerCase().trim();

  // 1. Respuestas de SALUDO/BIENVENIDA
  if (
    lowerMessage.includes('hola') ||
    lowerMessage.includes('qué tal') ||
    lowerMessage.includes('buenas') ||
    lowerMessage.includes('saludos') ||
    lowerMessage.includes('hey') ||
    lowerMessage.length < 10
  ) {
    const greetings = {
      'ai_carlos': [
        '¡Hey! Qué tal pana? 👋',
        'Hola! ¿Cómo estás?',
        'Bienvenido! Qué bueno verte aquí',
        'Holaa, qué onda? 😊'
      ],
      'ai_mateo': [
        '¡Hola! ¿Cómo estás?',
        'Hey! Qué bueno verte',
        'Bienvenido! ¿Todo bien?',
        'Holaa, qué tal? 😊'
      ],
      'ai_diego': [
        '¡Hola! ¿Qué tal?',
        'Hey! Bienvenido',
        'Buenas! ¿Cómo estás?',
        'Holaa, qué onda? 👋'
      ]
    };
    const options = greetings[aiPersona.id] || greetings['ai_carlos'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // 2. Respuestas a PREGUNTAS
  if (
    lowerMessage.includes('?') ||
    lowerMessage.includes('qué') ||
    lowerMessage.includes('cómo') ||
    lowerMessage.includes('cuándo') ||
    lowerMessage.includes('dónde') ||
    lowerMessage.includes('por qué')
  ) {
    const questionResponses = {
      'ai_carlos': [
        'Buena pregunta pana, déjame pensar...',
        'Mrc, interesante eso. Te cuento...',
        'Ufff, no estoy seguro chamo, pero creo que...',
        'Jaja buena pregunta, la verdad es que...'
      ],
      'ai_mateo': [
        'Che, buena pregunta. Déjame pensar...',
        'Interesante eso, creo que...',
        'Hmm, no estoy seguro pero...',
        'Buena pregunta, la verdad es...'
      ],
      'ai_diego': [
        'Vale, buena pregunta. Déjame pensar...',
        'Interesante, creo que...',
        'Hmm, no estoy seguro tío, pero...',
        'Buena pregunta, la verdad es que...'
      ]
    };
    const options = questionResponses[aiPersona.id] || questionResponses['ai_carlos'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // 3. Respuestas a COMENTARIOS/OPINIONES
  if (
    lowerMessage.includes('creo') ||
    lowerMessage.includes('pienso') ||
    lowerMessage.includes('opino') ||
    lowerMessage.includes('me parece')
  ) {
    const opinionResponses = {
      'ai_carlos': [
        'Totalmente de acuerdo pana',
        'Sí, tienes razón chamo',
        'Mrc, yo pienso igual',
        'Jaja sí, eso mismo pensé'
      ],
      'ai_mateo': [
        'Totalmente de acuerdo',
        'Sí, tenés razón',
        'Che, yo pienso igual',
        'Sí, eso mismo pensé'
      ],
      'ai_diego': [
        'Totalmente de acuerdo tío',
        'Sí, tienes razón',
        'Vale, yo pienso igual',
        'Sí, eso mismo pensé'
      ]
    };
    const options = opinionResponses[aiPersona.id] || opinionResponses['ai_carlos'];
    return options[Math.floor(Math.random() * options.length)];
  }

  // 4. Respuestas GENÉRICAS contextuales (último recurso)
  const genericResponses = {
    'ai_carlos': [
      'Interesante, jaja. Sigue contando',
      'Jaja sí, entiendo lo que dices',
      'Mrc, buena esa pana',
      'Ufff, me gusta eso chamo',
      'Jaja totalmente, sigue'
    ],
    'ai_mateo': [
      'Interesante, jaja. Sigue contando',
      'Sí, entiendo lo que decís',
      'Che, buena esa',
      'Me gusta eso, sigue',
      'Jaja totalmente, seguí'
    ],
    'ai_diego': [
      'Interesante, jaja. Sigue contando',
      'Sí, entiendo lo que dices',
      'Vale, buena esa tío',
      'Me gusta eso, sigue',
      'Jaja totalmente, sigue'
    ]
  };

  const options = genericResponses[aiPersona.id] || genericResponses['ai_carlos'];
  return options[Math.floor(Math.random() * options.length)];
};

/**
 * Desconecta la IA de un usuario (por vulgarity o inactividad)
 */
const handleAIDisconnect = async (roomId, userId, aiPersona, reason) => {
  console.log(`👋 ${aiPersona.username} se desconecta (razón: ${reason})`);

  // Mensaje de despedida según razón
  let farewell = '';
  if (reason === 'vulgar') {
    const farewells = {
      'ai_carlos': 'mrc pana, así no. Me voy, suerte 👋',
      'ai_mateo': 'che boludo, no es mi onda. Me voy, dale',
      'ai_diego': 'tío, no va por ahí. Me piro, suerte'
    };
    farewell = farewells[aiPersona.id] || farewells['ai_carlos'];
  } else {
    farewell = 'Bueno, me tengo que ir. Fue un gusto! 👋';
  }

  // Enviar despedida
  await sendMessage(roomId, {
    userId: aiPersona.userId,
    username: aiPersona.username,
    avatar: aiPersona.avatar,
    content: farewell,
    type: 'text',
    timestamp: Date.now()
  });

  // Mensaje del sistema
  setTimeout(async () => {
    await sendMessage(roomId, {
      userId: 'system',
      content: `${aiPersona.username} abandonó la sala`,
      type: 'system',
      timestamp: Date.now()
    });
  }, 2000);

  // Limpiar estado
  const state = activeAIConversations.get(roomId);
  if (state) {
    state.users.delete(userId);
    state.assignedPersonas.delete(aiPersona.id);
  }
};

/**
 * Verifica inactividad y desconecta IA si el usuario no responde
 */
export const checkUserInactivity = async (roomId, userId) => {
  const state = activeAIConversations.get(roomId);
  if (!state || !state.users.has(userId)) return;

  const userState = state.users.get(userId);
  const timeSinceLastMessage = Date.now() - userState.lastInteraction;

  // Si pasaron más de 5 minutos sin respuesta, desconectar
  if (timeSinceLastMessage > 300000) { // 5 minutos
    await handleAIDisconnect(roomId, userId, userState.persona, 'inactive');
  }
};

/**
 * ✅ NUEVO: Limpia personalidades expiradas de todas las salas
 * Se ejecuta periódicamente para mantener el sistema limpio
 */
export const cleanupExpiredPersonas = () => {
  const currentTimeWindow = getCurrentTimeWindow();
  let cleanedCount = 0;
  
  for (const [roomId, state] of activeAIConversations.entries()) {
    const usedPersonas = getUsedPersonasInRoom(roomId);
    const usersToUpdate = [];
    
    for (const [userId, userState] of state.users.entries()) {
      const persona = userState.persona;
      if (persona?.timeWindow !== undefined && persona.timeWindow !== currentTimeWindow) {
        // Personalidad expirada
        usedPersonas.delete(persona.id);
        // Generar nueva personalidad
        const newPersona = selectAIPersona(roomId, userId, null);
        userState.persona = newPersona;
        userState.lastInteraction = Date.now();
        usersToUpdate.push({ userId, newPersona });
        cleanedCount++;
      }
    }
    
    if (usersToUpdate.length > 0) {
      console.log(`🔄 [CLEANUP] Rotadas ${usersToUpdate.length} personalidades en sala ${roomId}`);
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 [CLEANUP] Total personalidades rotadas: ${cleanedCount}`);
  }
  
  return cleanedCount;
};

/**
 * Limpia todas las conversaciones de una sala
 */
export const clearRoomAI = (roomId) => {
  activeAIConversations.delete(roomId);
  // También limpiar el tracker de personalidades
  roomPersonalityTracker.delete(roomId);
  console.log(`🧹 Conversaciones AI limpiadas para sala ${roomId}`);
};

/**
 * Obtiene estado de la IA en una sala
 */
export const getAIStatus = (roomId) => {
  const state = activeAIConversations.get(roomId);
  if (!state) {
    return { active: false, userCount: 0 };
  }

  return {
    active: true,
    userCount: state.users.size,
    personas: Array.from(state.users.values()).map(u => ({
      name: u.persona.username,
      messageCount: u.messageCount,
      warningCount: u.warningCount
    }))
  };
};

/**
 * ✅ NUEVO: Inicializa el sistema de limpieza automática
 * Ejecuta limpieza cada 30 minutos para rotar personalidades expiradas
 */
export const initializePersonalityRotation = () => {
  // Limpieza inmediata al iniciar
  cleanupExpiredPersonas();
  
  // Limpieza periódica cada 30 minutos
  setInterval(() => {
    cleanupExpiredPersonas();
  }, 30 * 60 * 1000); // 30 minutos
  
  console.log('🔄 [AI ROTATION] Sistema de rotación de personalidades inicializado (cada 2 horas por personalidad, limpieza cada 30 min)');
};

/**
 * 📊 FUNCIÓN DE DEBUG: Ver estado del sistema de IA
 * Llama desde consola: window.checkAIStatus()
 */
export const getAISystemStatus = () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              📊 ESTADO DEL SISTEMA DE IA                   ║
╚════════════════════════════════════════════════════════════╝
  `);

  if (activeAIConversations.size === 0) {
    console.log('⚠️ [ESTADO] No hay conversaciones activas de IA en ninguna sala');
    return;
  }

  activeAIConversations.forEach((state, roomId) => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║ 🏠 SALA: ${roomId.padEnd(49)} ║
╠════════════════════════════════════════════════════════════╣
║ 👥 Usuarios con IA asignada: ${String(state.users.size).padEnd(3)}                         ║
╚════════════════════════════════════════════════════════════╝
    `);

    state.users.forEach((userState, userId) => {
      const lastInteractionAgo = Math.floor((Date.now() - userState.lastInteraction) / 1000);
      console.log(`
  ┌──────────────────────────────────────────────────────┐
  │ 👤 Usuario ID: ${userId.substring(0, 12).padEnd(12)}                        │
  │ 🤖 IA Asignada: ${userState.persona.username.padEnd(20)} (${userState.persona.role.padEnd(10)})│
  │ 💬 Mensajes intercambiados: ${String(userState.messageCount).padEnd(3)}                   │
  │ ⚠️ Advertencias: ${String(userState.warningCount).padEnd(3)}/3                           │
  │ ⏰ Última interacción: hace ${String(lastInteractionAgo).padEnd(3)}s                   │
  │ 🎭 Avatar: ${userState.persona.avatar.substring(0, 35).padEnd(35)}   │
  └──────────────────────────────────────────────────────┘
      `);
    });
  });

  // Mostrar personalidades usadas por sala
  console.log(`
╔════════════════════════════════════════════════════════════╗
║        🎭 PERSONALIDADES ACTIVAS POR SALA                  ║
╚════════════════════════════════════════════════════════════╝
  `);

  roomPersonalityTracker.forEach((usedPersonas, roomId) => {
    const personasList = Array.from(usedPersonas).join(', ');
    console.log(`🏠 ${roomId}: ${usedPersonas.size} personalidades → ${personasList}`);
  });

  console.log('\n✅ [SISTEMA] Estado completo mostrado arriba');
};

// 🚫 DESACTIVADO: No auto-inicializar sistema de rotación
// if (typeof window !== 'undefined') {
//   // Solo en el cliente
//   initializePersonalityRotation();

//   // Exponer función de estado en window para debugging
//   window.checkAIStatus = getAISystemStatus;
//   console.log(`
// ╔════════════════════════════════════════════════════════════╗
// ║     🔍 DEBUG TOOL DISPONIBLE                               ║
// ╠════════════════════════════════════════════════════════════╣
// ║ Escribe en consola:  window.checkAIStatus()                ║
// ║ Para ver el estado completo del sistema de IA             ║
// ╚════════════════════════════════════════════════════════════╝
//   `);
// }
console.log(`🚫 [AI INTERACTION] Sistema de rotación de personalidades DESACTIVADO`);
