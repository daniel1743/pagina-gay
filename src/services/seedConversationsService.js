/**
 * 🎭 SERVICIO DE CONVERSACIONES PRE-ESCRITAS
 * Genera conversaciones genuinas para la sala "Chat Principal"
 * Simula interacciones reales entre usuarios gays
 */

import { collection, addDoc, query, where, getDocs, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

// 🎭 CONVERSACIONES GENUINAS PRE-ESCRITAS
const GENUINE_CONVERSATIONS = [
  // Conversación 1: Saludo y presentación
  [
    { username: 'Carlos28', content: 'Hola, cómo están?', delay: 0 },
    { username: 'Miguel25', content: 'Hola, todo bien! Y tú?', delay: 3000 },
    { username: 'Carlos28', content: 'Bien también, qué buscas?', delay: 5000 },
    { username: 'Miguel25', content: 'Verga y tú?', delay: 4000 },
    { username: 'Carlos28', content: 'También, bueno yo doy verga', delay: 3500 },
    { username: 'Miguel25', content: 'Ah perfecto, yo busco activo', delay: 3000 },
  ],
  // Conversación 2: Scort
  [
    { username: 'ScortPro', content: 'Hola, soy scort', delay: 0 },
    { username: 'Javier30', content: 'Hola, cuéntame más', delay: 4000 },
    { username: 'ScortPro', content: 'Me mide 22cm, soy activo', delay: 3000 },
    { username: 'Javier30', content: 'Uff, interesante. Dónde estás?', delay: 5000 },
    { username: 'ScortPro', content: 'Santiago centro, tú?', delay: 3500 },
    { username: 'Javier30', content: 'Providencia, cerca entonces', delay: 4000 },
  ],
  // Conversación 3: Búsqueda casual
  [
    { username: 'Andrés27', content: 'Hola, alguien activo?', delay: 0 },
    { username: 'Luis24', content: 'Yo, qué buscas?', delay: 5000 },
    { username: 'Andrés27', content: 'Algo casual, pasivo aquí', delay: 4000 },
    { username: 'Luis24', content: 'Perfecto, dónde andas?', delay: 3500 },
    { username: 'Andrés27', content: 'Maipú, tú?', delay: 3000 },
    { username: 'Luis24', content: 'Centro, pero puedo moverme', delay: 4000 },
  ],
  // Conversación 4: Conversación más larga
  [
    { username: 'Roberto29', content: 'Hola a todos', delay: 0 },
    { username: 'Diego26', content: 'Hola, qué tal?', delay: 4000 },
    { username: 'Roberto29', content: 'Bien, buscando algo rico', delay: 5000 },
    { username: 'Diego26', content: 'Qué tipo de cosa rica?', delay: 4500 },
    { username: 'Roberto29', content: 'Alguien que me coja bien', delay: 4000 },
    { username: 'Diego26', content: 'Jaja, yo puedo ayudarte con eso', delay: 5000 },
    { username: 'Roberto29', content: 'Ah sí? Cuéntame más', delay: 3500 },
  ],
  // Conversación 5: Intercambio directo
  [
    { username: 'Fernando31', content: 'Hola, busco pasivo', delay: 0 },
    { username: 'Sergio23', content: 'Yo soy pasivo', delay: 5000 },
    { username: 'Fernando31', content: 'Perfecto, qué edad tienes?', delay: 4000 },
    { username: 'Sergio23', content: '23, y tú?', delay: 3000 },
    { username: 'Fernando31', content: '31, te gustan mayores?', delay: 4000 },
    { username: 'Sergio23', content: 'Sí, me encantan', delay: 3500 },
  ],
  // Conversación 6: Conversación casual
  [
    { username: 'Pablo28', content: 'Qué onda, cómo están?', delay: 0 },
    { username: 'Ricardo25', content: 'Todo bien, y tú?', delay: 4000 },
    { username: 'Pablo28', content: 'Bien también, qué hacen?', delay: 5000 },
    { username: 'Ricardo25', content: 'Nada, buscando algo caliente', delay: 4500 },
    { username: 'Pablo28', content: 'Jaja, yo también', delay: 3000 },
  ],
  // Conversación 7: Scort con detalles
  [
    { username: 'ScortElite', content: 'Hola, scort disponible', delay: 0 },
    { username: 'Mario32', content: 'Hola, cuéntame', delay: 5000 },
    { username: 'ScortElite', content: '22cm, activo, Santiago', delay: 4000 },
    { username: 'Mario32', content: 'Cuánto cobras?', delay: 6000 },
    { username: 'ScortElite', content: '50k la hora', delay: 3500 },
    { username: 'Mario32', content: 'Ok, interesante', delay: 4000 },
  ],
  // Conversación 8: Búsqueda específica
  [
    { username: 'Alejandro27', content: 'Alguien en Providencia?', delay: 0 },
    { username: 'Gonzalo24', content: 'Yo, qué buscas?', delay: 5000 },
    { username: 'Alejandro27', content: 'Algo ahora mismo', delay: 4000 },
    { username: 'Gonzalo24', content: 'Yo puedo, activo o pasivo?', delay: 4500 },
    { username: 'Alejandro27', content: 'Activo, yo pasivo', delay: 3500 },
    { username: 'Gonzalo24', content: 'Perfecto, escribeme', delay: 4000 },
  ],
  // Conversación 9: Conversación amigable
  [
    { username: 'Héctor29', content: 'Hola a todos', delay: 0 },
    { username: 'Cristian26', content: 'Hola, qué tal?', delay: 4000 },
    { username: 'Héctor29', content: 'Bien, buscando conocer gente', delay: 5000 },
    { username: 'Cristian26', content: 'Yo también, de dónde eres?', delay: 4500 },
    { username: 'Héctor29', content: 'Santiago centro, tú?', delay: 4000 },
    { username: 'Cristian26', content: 'Las Condes, cerca', delay: 3500 },
  ],
  // Conversación 10: Intercambio directo
  [
    { username: 'Eduardo30', content: 'Hola, alguien activo?', delay: 0 },
    { username: 'Felipe25', content: 'Yo, qué buscas?', delay: 5000 },
    { username: 'Eduardo30', content: 'Algo casual, pasivo aquí', delay: 4000 },
    { username: 'Felipe25', content: 'Perfecto, dónde estás?', delay: 4500 },
    { username: 'Eduardo30', content: 'Baquedano, tú?', delay: 3500 },
    { username: 'Felipe25', content: 'Providencia, cerca', delay: 4000 },
  ],
];

// 🎭 AVATARES PARA USUARIOS SIMULADOS
const generateAvatar = (username) => {
  const seed = username.toLowerCase().replace(/\s+/g, '-');
  const styles = ['avataaars', 'pixel-art', 'identicon', 'bottts'];
  const style = styles[seed.charCodeAt(0) % styles.length];
  const colors = ['b6e3f4', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
  const color = colors[seed.charCodeAt(1) % colors.length];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${color}`;
};

// 🎭 GENERAR USERID PARA USUARIOS SIMULADOS
const generateUserId = (username) => {
  return `seed_user_${username.toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Verifica si ya se han sembrado conversaciones en la sala
 */
const hasSeededConversations = async (roomId) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const seedQuery = query(
      messagesRef,
      where('userId', '>=', 'seed_user_'),
      where('userId', '<=', 'seed_user_\uf8ff'),
      limit(1)
    );
    const snapshot = await getDocs(seedQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('❌ Error verificando conversaciones sembradas:', error);
    return false;
  }
};

/**
 * Genera un timestamp pasado (hace X minutos/horas)
 */
const generatePastTimestamp = (minutesAgo) => {
  const now = Date.now();
  const past = now - (minutesAgo * 60 * 1000);
  return Timestamp.fromMillis(past);
};

/**
 * Siembra conversaciones genuinas en la sala "principal"
 * ✅ DESACTIVADO COMPLETAMENTE - No sembrar en ninguna sala
 */
export const seedGenuineConversations = async (roomId) => {
  // ✅ DESACTIVADO - No sembrar conversaciones automáticas
  console.log('⏸️ [SEED] Servicio de sembrado DESACTIVADO para sala:', roomId);
  return;

  // Código anterior comentado
  /*
  // Solo sembrar en la sala "principal"
  if (roomId !== 'principal') {
    return;
  }
  */

  try {
    // Verificar si ya se sembraron conversaciones
    const alreadySeeded = await hasSeededConversations(roomId);
    if (alreadySeeded) {
      console.log('✅ [SEED] Conversaciones ya sembradas en', roomId);
      return;
    }

    console.log('🌱 [SEED] Sembrando conversaciones genuinas en', roomId);

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const conversationsToSeed = GENUINE_CONVERSATIONS.slice(0, 5); // Sembrar solo 5 conversaciones inicialmente

    let totalDelay = 0;
    const baseTimeAgo = 120; // Hace 2 horas

    for (let convIndex = 0; convIndex < conversationsToSeed.length; convIndex++) {
      const conversation = conversationsToSeed[convIndex];
      const conversationStartTime = baseTimeAgo - (convIndex * 20); // Cada conversación empieza 20 min antes

      for (let msgIndex = 0; msgIndex < conversation.length; msgIndex++) {
        const msg = conversation[msgIndex];
        const userId = generateUserId(msg.username);
        const avatar = generateAvatar(msg.username);
        
        // Calcular timestamp: conversación empieza hace X minutos, cada mensaje tiene su delay
        const minutesAgo = conversationStartTime - (msg.delay / 60000);
        const timestamp = generatePastTimestamp(minutesAgo);

        const messageData = {
          userId: userId,
          username: msg.username,
          avatar: avatar,
          content: msg.content,
          type: 'text',
          timestamp: timestamp,
          senderUid: userId, // Para compatibilidad con reglas de Firestore
          trace: {
            origin: 'SYSTEM',
            source: 'SEEDED_CONVERSATION',
            actorId: userId,
            actorType: 'BOT',
            system: 'seedConversationsService',
            traceId: `seed_${roomId}_${convIndex}_${msgIndex}_${Date.now()}`,
            createdAt: Date.now()
          }
        };

        await addDoc(messagesRef, messageData);
        console.log(`✅ [SEED] Mensaje sembrado: ${msg.username} → "${msg.content}"`);

        // Pequeño delay entre mensajes para no saturar Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ [SEED] ${conversationsToSeed.length} conversaciones sembradas exitosamente en ${roomId}`);
  } catch (error) {
    console.error('❌ [SEED] Error sembrando conversaciones:', error);
  }
};

/**
 * Verifica y siembra conversaciones si es necesario
 * Se llama cuando un usuario entra a la sala "principal"
 * ✅ DESACTIVADO COMPLETAMENTE - No sembrar en ninguna sala
 */
export const checkAndSeedConversations = async (roomId) => {
  // ✅ DESACTIVADO - No verificar ni sembrar conversaciones
  console.log('⏸️ [SEED] Verificación de sembrado DESACTIVADA para sala:', roomId);
  return;

  // Código anterior comentado
  /*
  if (roomId !== 'principal') {
    return;
  }

  try {
    const alreadySeeded = await hasSeededConversations(roomId);
    if (!alreadySeeded) {
      console.log('🌱 [SEED] No hay conversaciones sembradas, iniciando sembrado...');
      // Esperar 2 segundos antes de sembrar (para no interferir con la carga inicial)
      setTimeout(() => {
        seedGenuineConversations(roomId).catch(err => {
          console.error('❌ [SEED] Error al sembrar conversaciones:', err);
        });
      }, 2000);
    } else {
      console.log('✅ [SEED] Conversaciones ya sembradas en', roomId);
    }
  } catch (error) {
    console.error('❌ [SEED] Error verificando conversaciones:', error);
  }
  */
};

/**
 * Función para ejecutar el sembrado manualmente (útil para debugging)
 * Se puede llamar desde la consola del navegador: window.seedConversations('principal')
 */
export const seedConversationsManual = async (roomId = 'principal') => {
  console.log('🌱 [SEED MANUAL] Iniciando sembrado manual en', roomId);
  try {
    await seedGenuineConversations(roomId);
    console.log('✅ [SEED MANUAL] Sembrado completado');
  } catch (error) {
    console.error('❌ [SEED MANUAL] Error:', error);
    throw error;
  }
};

// Exponer función globalmente para debugging
if (typeof window !== 'undefined') {
  window.seedConversations = seedConversationsManual;
  console.log('🌱 [SEED] Función disponible en consola: window.seedConversations("principal")');
}

