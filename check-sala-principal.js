/**
 * SCRIPT: Verificar mensajes en sala principal
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

const SALAS_A_VERIFICAR = [
  'principal',       // Sala principal actual
  'global',          // Sala antigua
  'conversas-libres' // Sala antigua con spam
];

const verificarSala = async (roomId) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 VERIFICANDO SALA: ${roomId}`);
  console.log('='.repeat(60));

  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');

    // Obtener TODOS los mensajes
    const allSnapshot = await getDocs(messagesRef);
    const totalMessages = allSnapshot.size;

    console.log(`📊 Total de mensajes en sala: ${totalMessages}`);

    if (totalMessages === 0) {
      console.log(`❌ LA SALA "${roomId}" NO TIENE MENSAJES`);
      return { roomId, total: 0, recent: [] };
    }

    // Obtener los últimos 10 mensajes
    const recentQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(10));
    const recentSnapshot = await getDocs(recentQuery);

    const recentMessages = [];
    recentSnapshot.forEach(doc => {
      const data = doc.data();
      recentMessages.push({
        id: doc.id,
        username: data.username || 'Anónimo',
        content: (data.content || '').substring(0, 80),
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        userId: data.userId
      });
    });

    console.log(`\n📝 ÚLTIMOS ${recentMessages.length} MENSAJES:\n`);
    recentMessages.forEach((msg, index) => {
      const date = msg.timestamp instanceof Date ? msg.timestamp.toLocaleString() : msg.timestamp;
      console.log(`${index + 1}. [${date}] ${msg.username}: "${msg.content}..."`);
      console.log(`   └─ userId: ${msg.userId}`);
    });

    return { roomId, total: totalMessages, recent: recentMessages };

  } catch (error) {
    console.error(`❌ ERROR verificando sala ${roomId}:`, error.message);
    return { roomId, total: 0, recent: [], error: error.message };
  }
};

const main = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🔍 VERIFICACIÓN DE SALAS DE CHAT                  ║
╚════════════════════════════════════════════════════════════╝
  `);

  const resultados = [];

  for (const roomId of SALAS_A_VERIFICAR) {
    const resultado = await verificarSala(roomId);
    resultados.push(resultado);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMEN GENERAL');
  console.log('='.repeat(60));

  resultados.forEach(r => {
    const status = r.total > 0 ? '✅' : '❌';
    console.log(`${status} ${r.roomId.padEnd(20)} - ${r.total} mensajes`);
  });

  console.log('\n💡 RECOMENDACIÓN:');
  const salaPrincipal = resultados.find(r => r.roomId === 'principal');

  if (salaPrincipal && salaPrincipal.total === 0) {
    console.log(`
⚠️  LA SALA "principal" NO TIENE MENSAJES

Posibles causas:
1. Es una sala nueva que acaba de ser creada
2. Los mensajes están en otra sala (global o conversas-libres)
3. Se eliminaron todos los mensajes durante la limpieza

Soluciones:
1. Verificar si hay mensajes en las salas antiguas
2. Migrar mensajes de "global" o "conversas-libres" a "principal"
3. Sembrar algunos mensajes iniciales en la sala
    `);
  } else if (salaPrincipal && salaPrincipal.total > 0) {
    console.log(`✅ La sala "principal" tiene ${salaPrincipal.total} mensajes`);
  }

  process.exit(0);
};

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
