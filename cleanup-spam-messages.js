/**
 * SCRIPT DE LIMPIEZA DE MENSAJES SPAM
 * Elimina todos los mensajes que contengan patrones prohibidos
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

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

const PROHIBITED_PATTERNS = [
  'wn y cuando',
  'wn, y cuando',
  'wn y al final',
  'wn, y al final',
  'wn, es que',
  'el queso es el mejor',
  'con nachos y risas',
  'si rue llega',
  'un nacho con queso',
  'hasta el más',
  'hasta el mas',
  'momento absurdo',
  'momentos absurdos',
  'filosofía de la vida',
  'la vida es una comedia',
  'ninja de la risa',
  'bucle de felicidad',
  'epidemia de felicidad'
];

const ROOMS = [
  'conversas-libres',
  'gaming',
  'santiago',
  'mas-30',
  'amistad',
  'osos-activos',
  'pasivos-buscando',
  'versatiles',
  'quedar-ya',
  'hablar-primero',
  'morbosear'
];

const hasProhibitedPattern = (message) => {
  const normalized = message.toLowerCase();
  return PROHIBITED_PATTERNS.some(pattern => normalized.includes(pattern));
};

const cleanupRoom = async (roomId) => {
  console.log(`\n🔍 Limpiando sala: ${roomId}...`);

  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const snapshot = await getDocs(messagesRef);

  let totalMessages = 0;
  let deletedMessages = 0;

  for (const messageDoc of snapshot.docs) {
    totalMessages++;
    const data = messageDoc.data();
    const content = data.content || '';

    if (hasProhibitedPattern(content)) {
      console.log(`🚫 ELIMINANDO: "${content.substring(0, 60)}..."`);
      await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageDoc.id));
      deletedMessages++;
    }
  }

  console.log(`✅ Sala ${roomId}: ${deletedMessages}/${totalMessages} mensajes eliminados`);
  return { total: totalMessages, deleted: deletedMessages };
};

const main = async () => {
  console.log('🚀 INICIANDO LIMPIEZA DE MENSAJES SPAM...\n');

  let totalDeleted = 0;
  let totalScanned = 0;

  for (const roomId of ROOMS) {
    const stats = await cleanupRoom(roomId);
    totalScanned += stats.total;
    totalDeleted += stats.deleted;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ LIMPIEZA COMPLETADA`);
  console.log(`📊 Mensajes escaneados: ${totalScanned}`);
  console.log(`🗑️ Mensajes eliminados: ${totalDeleted}`);
  console.log(`💚 Mensajes conservados: ${totalScanned - totalDeleted}`);
  console.log('='.repeat(60));

  process.exit(0);
};

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
