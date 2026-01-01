/**
 * SCRIPT: Sembrar conversaciones REALES y coherentes en sala principal
 *
 * Genera conversaciones que parecen 100% humanas:
 * - Coherentes (siguen un hilo lógico)
 * - Morbosas/sexuales pero naturales
 * - Con errores de tipeo
 * - Con emojis naturales
 * - NO robóticas, NO spam, NO monótonas
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMcK3uedISDONlzMMqLlL5hbjsV4LTz1g",
  authDomain: "chat-gay-3016f.firebaseapp.com",
  projectId: "chat-gay-3016f",
  storageBucket: "chat-gay-3016f.firebasestorage.app",
  messagingSenderId: "1077495434635",
  appId: "1:1077495434635:web:f3bb30330a3f73e20a9f4f",
  measurementId: "G-D84X97QYZB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Usuarios REALES ficticios (parecen personas reales)
const USUARIOS_REALES = [
  { id: 'user_matias', username: 'Matías', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matias' },
  { id: 'user_diego', username: 'Diego', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego' },
  { id: 'user_lucas', username: 'Lucas', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'user_seba', username: 'Seba', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seba' },
  { id: 'user_nico', username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nico' },
  { id: 'user_franco', username: 'Franco', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Franco' },
  { id: 'user_martin', username: 'Martín', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin' },
  { id: 'user_pablo', username: 'Pablo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo' },
  { id: 'user_ale', username: 'Ale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ale' },
  { id: 'user_tomi', username: 'Tomi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomi' }
];

// CONVERSACIONES COHERENTES Y NATURALES
const CONVERSACIONES_COHERENTES = [
  // Conversación 1: Quedada después del gym
  {
    tema: "Gym y encuentro",
    mensajes: [
      { user: 0, text: "wena cabros, recién saliendo del gym 💪" },
      { user: 1, text: "uff q rico, yo toy recién llegando a la casa" },
      { user: 0, text: "jaja toy re sudado todavia" },
      { user: 2, text: "y solo? 👀" },
      { user: 0, text: "sip jaja, toy re caliente después de entrenar" },
      { user: 1, text: "te creo wn, el gym me deja re horny" },
      { user: 2, text: "deberíamos juntarnos algún dia después del gym jaja" },
      { user: 0, text: "me tinca! cuando quieran" },
      { user: 1, text: "mañana voy al gym a las 7, si quieren nos juntamos despues 😏" },
      { user: 2, text: "dale! yo puedo" },
      { user: 0, text: "perfecto, mañana nos vemos entonces" }
    ]
  },

  // Conversación 2: Apps de ligue
  {
    tema: "Apps y experiencias",
    mensajes: [
      { user: 3, text: "alguien usa grindr aca?" },
      { user: 4, text: "si wn, pero puro ghosting" },
      { user: 3, text: "jaja te creo, yo igual" },
      { user: 5, text: "es verdad, hablas con alguien y desaparece" },
      { user: 4, text: "yo prefiero tinder, es menos directo" },
      { user: 3, text: "tinder ta bueno pero hay poco match gay" },
      { user: 5, text: "prueben scruff, ahi hay mas onda" },
      { user: 4, text: "scruff es bueno si te gustan los osos jaja" },
      { user: 3, text: "me gustan de todo tipo la verdad 😅" },
      { user: 5, text: "same! versatil en todo sentido jaja" },
      { user: 4, text: "jajaja lo mejor es ser abierto" }
    ]
  },

  // Conversación 3: Primera vez (morbosa pero natural)
  {
    tema: "Primera vez - historia",
    mensajes: [
      { user: 6, text: "cabros, recuerdan su primera vez?" },
      { user: 7, text: "jaja si, fue re awkward" },
      { user: 6, text: "cuenta po!" },
      { user: 7, text: "fue con un amigo de la u, los dos re nerviosos" },
      { user: 8, text: "jaja esas son las mejores, sin presión" },
      { user: 7, text: "si wn, pero no cacho nada jaja" },
      { user: 6, text: "bueno pero lo pasaron bien?" },
      { user: 7, text: "sii, después repetimos varias veces mas 😏" },
      { user: 8, text: "jaja esa es la actitud" },
      { user: 6, text: "yo la mía fue con alguien de grindr" },
      { user: 7, text: "y como te fue?" },
      { user: 6, text: "bien! el wn sabia lo q hacia, me enseñó caleta" },
      { user: 8, text: "que buena experiencia entonces" },
      { user: 6, text: "si, le tengo buenrecuerdo jaja" }
    ]
  },

  // Conversación 4: Finde de carrete
  {
    tema: "Carrete y ligue",
    mensajes: [
      { user: 1, text: "q planes para el finde?" },
      { user: 2, text: "nose, pensaba ir a boliche" },
      { user: 3, text: "cual? fausto?" },
      { user: 2, text: "sipi, fausto o bunker" },
      { user: 1, text: "bunker ta bueno, harta gente linda" },
      { user: 3, text: "jaja toy viendo, me tinca" },
      { user: 2, text: "vamos los 3 entonces?" },
      { user: 1, text: "dale! el sábado?" },
      { user: 3, text: "perfecto, nos juntamos antes a tomarnos algo" },
      { user: 2, text: "sii, pre en mi depa" },
      { user: 1, text: "va, llevo ron 🍹" },
      { user: 3, text: "yo llevo energeticas jaja" }
    ]
  },

  // Conversación 5: Después de una noche (morbosa)
  {
    tema: "Post-noche caliente",
    mensajes: [
      { user: 4, text: "wn me desperté recién" },
      { user: 5, text: "jaja q hora te acostaste?" },
      { user: 4, text: "como a las 5am, llegué con alguien del bunker" },
      { user: 5, text: "uhhh q rico! y como estuvo?" },
      { user: 4, text: "la raja wn, el cabro sabia 😏" },
      { user: 6, text: "jaja cuentanos mas" },
      { user: 4, text: "jaja nah privado eso" },
      { user: 5, text: "al menos la pasaste bien entonces" },
      { user: 4, text: "sii, re bien jaja" },
      { user: 6, text: "yo toy en la misma, llegue re tarde" },
      { user: 5, text: "parece q todos tuvieron buena noche jaja" },
      { user: 4, text: "jaja así es, buen finde para todos" }
    ]
  },

  // Conversación 6: Salida del closet
  {
    tema: "Salir del closet - apoyo",
    mensajes: [
      { user: 7, text: "cabros, les puedo contar algo?" },
      { user: 8, text: "dale, que pasa?" },
      { user: 7, text: "estoy pensando en salir del closet con mi familia" },
      { user: 9, text: "ohh q fuerte, como te sientes?" },
      { user: 7, text: "nervioso wn, pero creo q es el momento" },
      { user: 8, text: "es un paso grande, pero te va a hacer bien" },
      { user: 9, text: "yo salí hace 2 años, al principio fue dificil pero después todo mejoro" },
      { user: 7, text: "enserio? me da esperanza eso" },
      { user: 8, text: "lo importante es que lo hagas cuando te sientas listo" },
      { user: 9, text: "exacto, y no importa la reacción, tu eres válido igual" },
      { user: 7, text: "gracias cabros, me ayuda caleta hablar de esto" },
      { user: 8, text: "para eso estamos! cuando quieras hablar acá estamos" }
    ]
  },

  // Conversación 7: Recomendaciones de series
  {
    tema: "Series LGBT",
    mensajes: [
      { user: 0, text: "alguien vio heartstopper?" },
      { user: 1, text: "siii, muy linda" },
      { user: 2, text: "yo la vi completa en un dia jaja" },
      { user: 0, text: "es re wholesome" },
      { user: 1, text: "si, aunq yo prefiero cosas mas realistas" },
      { user: 2, text: "tipo que?" },
      { user: 1, text: "looking, queer as folk" },
      { user: 0, text: "ahh esas son mas adultas" },
      { user: 2, text: "no las he visto, las recomiendas?" },
      { user: 1, text: "sii, muestran la vida gay mas real" },
      { user: 0, text: "las voy a ver entonces" }
    ]
  },

  // Conversación 8: Gym y cuerpo (tema recurrente)
  {
    tema: "Inseguridades de cuerpo",
    mensajes: [
      { user: 3, text: "wn alguien mas se siente presionado por tener cuerpo de gym?" },
      { user: 4, text: "todo el tiempo wn" },
      { user: 5, text: "yo igual, pero cada vez me importa menos" },
      { user: 3, text: "es q en grindr todos tienen six pack" },
      { user: 4, text: "eso es mentira, hay de todo" },
      { user: 5, text: "además hay gente q le gustan los cuerpos normales" },
      { user: 3, text: "supongo q si, pero igual me da lata" },
      { user: 4, text: "yo voy al gym pero por salud mental, no por las apps" },
      { user: 5, text: "esa es la actitud correcta" },
      { user: 3, text: "tienen razon, deberia dejar de compararme" }
    ]
  }
];

// Función para agregar delay realista entre mensajes
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para sembrar conversación
const sembrarConversacion = async (conversacion, roomId = 'principal') => {
  console.log(`\n📝 Sembrando conversación: "${conversacion.tema}"`);

  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  let baseTime = Date.now() - (conversacion.mensajes.length * 60000); // Empezar hace N minutos

  for (const [index, msg] of conversacion.mensajes.entries()) {
    const usuario = USUARIOS_REALES[msg.user];

    const messageData = {
      userId: usuario.id,
      username: usuario.username,
      avatar: usuario.avatar,
      content: msg.text,
      timestamp: new Date(baseTime + (index * 45000)), // 45 segundos entre mensajes
      type: 'text',
      isPremium: false,
      reactions: {}
    };

    await addDoc(messagesRef, messageData);
    console.log(`   ✅ ${usuario.username}: "${msg.text.substring(0, 50)}..."`);

    // Delay para no saturar Firestore
    await delay(100);
  }

  console.log(`✅ Conversación "${conversacion.tema}" sembrada (${conversacion.mensajes.length} mensajes)`);
};

// Función principal
const main = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     🌱 SEMBRANDO CONVERSACIONES REALES EN SALA PRINCIPAL   ║
╚════════════════════════════════════════════════════════════╝

📊 Total de conversaciones a sembrar: ${CONVERSACIONES_COHERENTES.length}
👥 Usuarios participantes: ${USUARIOS_REALES.length}
🎯 Sala destino: principal

Características de las conversaciones:
✅ Coherentes (siguen un hilo lógico)
✅ Morbosas/sexuales pero naturales
✅ Con errores de tipeo naturales
✅ Con emojis usados naturalmente
✅ NO robóticas, NO spam, NO monótonas
  `);

  let totalMensajes = 0;

  for (const conversacion of CONVERSACIONES_COHERENTES) {
    await sembrarConversacion(conversacion);
    totalMensajes += conversacion.mensajes.length;

    // Delay entre conversaciones
    await delay(500);
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  ✅ PROCESO COMPLETADO                     ║
╠════════════════════════════════════════════════════════════╣
║ 📊 Conversaciones sembradas: ${CONVERSACIONES_COHERENTES.length}                           ║
║ 💬 Total mensajes agregados: ${totalMensajes}                            ║
║ 🎯 Sala: principal                                         ║
║                                                            ║
║ 👥 Ahora la sala tiene un historial de conversaciones     ║
║    reales, coherentes y naturales que darán la sensación  ║
║    de que hubo gente real conversando.                    ║
╚════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
};

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
