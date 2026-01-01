/**
 * UTILIDAD: Sembrar conversaciones REALES y coherentes
 *
 * Se ejecuta desde el frontend con autenticación
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Usuarios REALES ficticios (parecen personas reales)
const USUARIOS_REALES = [
  { id: 'user_matias_real', username: 'Matías', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matias' },
  { id: 'user_diego_real', username: 'Diego', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego' },
  { id: 'user_lucas_real', username: 'Lucas', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'user_seba_real', username: 'Seba', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seba' },
  { id: 'user_nico_real', username: 'Nico', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nico' },
  { id: 'user_franco_real', username: 'Franco', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Franco' },
  { id: 'user_martin_real', username: 'Martín', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Martin' },
  { id: 'user_pablo_real', username: 'Pablo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pablo' },
  { id: 'user_ale_real', username: 'Ale', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ale' },
  { id: 'user_tomi_real', username: 'Tomi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tomi' }
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
      { user: 7, text: "si wn, pero no caché nada jaja" },
      { user: 6, text: "bueno pero lo pasaron bien?" },
      { user: 7, text: "sii, después repetimos varias veces mas 😏" },
      { user: 8, text: "jaja esa es la actitud" },
      { user: 6, text: "yo la mía fue con alguien de grindr" },
      { user: 7, text: "y como te fue?" },
      { user: 6, text: "bien! el wn sabia lo q hacia, me enseñó caleta" },
      { user: 8, text: "que buena experiencia entonces" },
      { user: 6, text: "si, le tengo buen recuerdo jaja" }
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
      { user: 9, text: "yo salí hace 2 años, al principio fue dificil pero después todo mejoró" },
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
  },

  // Conversación 9: Citas y relaciones
  {
    tema: "Citas y relaciones",
    mensajes: [
      { user: 6, text: "alguien en relación aquí?" },
      { user: 7, text: "yo llevo 6 meses con mi pololo" },
      { user: 8, text: "q bacán! como se conocieron?" },
      { user: 7, text: "en una fiesta de un amigo en común" },
      { user: 6, text: "aww q lindo" },
      { user: 8, text: "y son monógamos o abiertos?" },
      { user: 7, text: "monógamos, nos funciona así" },
      { user: 6, text: "yo no sé si podría tener relación abierta" },
      { user: 8, text: "depende de cada pareja po" },
      { user: 7, text: "exacto, lo importante es la comunicación" },
      { user: 6, text: "tienen razón, cada pareja es diferente" }
    ]
  },

  // Conversación 10: Viajes (morbosa sutil)
  {
    tema: "Viajes gay-friendly",
    mensajes: [
      { user: 9, text: "alguien ha viajado a destinos gay?" },
      { user: 0, text: "yo fui a sitges el año pasado" },
      { user: 1, text: "uhhh como te fue?" },
      { user: 0, text: "increíble wn, pura libertad" },
      { user: 9, text: "me han dicho que es buenísimo" },
      { user: 1, text: "yo quiero ir a mykonos" },
      { user: 0, text: "mykonos ta caro pero vale la pena" },
      { user: 9, text: "y la gente es linda?" },
      { user: 0, text: "jaja sii, de todo el mundo" },
      { user: 1, text: "me lo anoto para el próximo verano" },
      { user: 9, text: "vamos todos juntos jaja" },
      { user: 0, text: "dale! seria la raja" }
    ]
  }
];

// Función para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función principal para sembrar
export const sembrarConversacionesReales = async (roomId = 'principal', onProgress = null) => {
  console.log('🌱 Iniciando sembrado de conversaciones reales...');

  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  let totalMensajes = 0;
  let baseTime = Date.now() - (24 * 60 * 60 * 1000); // Empezar hace 24 horas

  for (const [convIndex, conversacion] of CONVERSACIONES_COHERENTES.entries()) {
    console.log(`📝 Sembrando: "${conversacion.tema}" (${conversacion.mensajes.length} mensajes)`);

    if (onProgress) {
      onProgress({
        current: convIndex + 1,
        total: CONVERSACIONES_COHERENTES.length,
        tema: conversacion.tema,
        mensajes: totalMensajes
      });
    }

    for (const [msgIndex, msg] of conversacion.mensajes.entries()) {
      const usuario = USUARIOS_REALES[msg.user];

      const messageData = {
        userId: usuario.id,
        username: usuario.username,
        avatar: usuario.avatar,
        content: msg.text,
        timestamp: new Date(baseTime + ((convIndex * 2 * 60 * 60 * 1000) + (msgIndex * 45000))), // 2 horas entre conversaciones, 45seg entre mensajes
        type: 'text',
        isPremium: false,
        reactions: {}
      };

      await addDoc(messagesRef, messageData);
      totalMensajes++;

      // Delay para no saturar
      await delay(50);
    }

    console.log(`   ✅ Completado "${conversacion.tema}"`);
  }

  console.log(`✅ Sembrado completado: ${totalMensajes} mensajes en ${CONVERSACIONES_COHERENTES.length} conversaciones`);

  return {
    success: true,
    totalConversaciones: CONVERSACIONES_COHERENTES.length,
    totalMensajes
  };
};

export { CONVERSACIONES_COHERENTES, USUARIOS_REALES };
