/**
 * SCRIPT DE LIMPIEZA: Elimina TODOS los mensajes de bots de Firestore
 *
 * Este script elimina:
 * - Mensajes de bots transparentes (bot_carlos, bot_mateo, etc.)
 * - Mensajes de bots grupales
 * - Mensajes de sistema
 * - Presencia de bots en roomPresence
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

// Configuración de Firebase (desde tu .env o firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyBOb6EZ-GdFqoLdRVo1P5rIXkPjsXvgFXs",
  authDomain: "chat-gay-3016f.firebaseapp.com",
  projectId: "chat-gay-3016f",
  storageBucket: "chat-gay-3016f.firebasestorage.app",
  messagingSenderId: "1070686773257",
  appId: "1:1070686773257:web:3dc1d11bbfa99fb09a22b5",
  measurementId: "G-NJQG7VE25M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de salas a limpiar
const ROOMS = [
  'conversas-libres',
  'gaming',
  'santiago',
  'valparaiso',
  'mas-30',
  'amistad',
  'osos-activos',
  'pasivos-buscando',
  'versatiles',
  'quedar-ya',
  'hablar-primero',
  'morbosear'
];

/**
 * Verifica si un mensaje es de un bot
 */
const isBotMessage = (messageData) => {
  const userId = messageData.userId || '';
  const username = messageData.username || '';

  // Detectar bots por userId
  if (userId.startsWith('bot_') ||
      userId.startsWith('static_bot_') ||
      userId === 'system' ||
      userId.includes('bot_join')) {
    return true;
  }

  // Detectar bots por username (bots transparentes tienen 🤖)
  if (username.includes('🤖') || username.includes('Bot')) {
    return true;
  }

  return false;
};

/**
 * Limpia mensajes de bots de una sala
 */
const cleanRoomMessages = async (roomId) => {
  console.log(`\n🧹 Limpiando sala: ${roomId}`);

  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  try {
    const snapshot = await getDocs(messagesRef);

    let deletedCount = 0;
    let totalCount = snapshot.size;

    console.log(`   📊 Total mensajes en sala: ${totalCount}`);

    const deletePromises = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (isBotMessage(data)) {
        console.log(`   🗑️  Eliminando: ${data.username} - "${data.content?.substring(0, 50)}..."`);
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`   ✅ Eliminados ${deletedCount} mensajes de bots de ${roomId}`);
    } else {
      console.log(`   ✨ No hay mensajes de bots en ${roomId}`);
    }

    return { total: totalCount, deleted: deletedCount };

  } catch (error) {
    console.error(`   ❌ Error limpiando ${roomId}:`, error);
    return { total: 0, deleted: 0, error: true };
  }
};

/**
 * Limpia presencia de bots en roomPresence
 */
const cleanRoomPresence = async (roomId) => {
  console.log(`\n👥 Limpiando presencia en: ${roomId}`);

  const presenceRef = collection(db, 'roomPresence', roomId, 'users');

  try {
    const snapshot = await getDocs(presenceRef);

    let deletedCount = 0;

    const deletePromises = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId || docSnap.id;

      if (userId.startsWith('bot_') ||
          userId.startsWith('static_bot_') ||
          userId === 'system' ||
          userId.includes('bot_join')) {
        console.log(`   🗑️  Eliminando presencia: ${data.username || userId}`);
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`   ✅ Eliminadas ${deletedCount} presencias de bots de ${roomId}`);
    } else {
      console.log(`   ✨ No hay presencias de bots en ${roomId}`);
    }

    return deletedCount;

  } catch (error) {
    console.error(`   ❌ Error limpiando presencia ${roomId}:`, error);
    return 0;
  }
};

/**
 * Ejecuta limpieza completa
 */
const runCleanup = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       🧹 LIMPIEZA DE MENSAJES Y PRESENCIA DE BOTS         ║
╠════════════════════════════════════════════════════════════╣
║ 📍 Salas a limpiar: ${ROOMS.length}                                     ║
║ 🎯 Objetivo: Eliminar TODOS los mensajes de bots          ║
╚════════════════════════════════════════════════════════════╝
  `);

  let totalDeleted = 0;
  let totalPresenceDeleted = 0;

  // Limpiar mensajes de todas las salas
  for (const roomId of ROOMS) {
    const result = await cleanRoomMessages(roomId);
    if (!result.error) {
      totalDeleted += result.deleted;
    }

    // Limpiar presencia
    const presenceDeleted = await cleanRoomPresence(roomId);
    totalPresenceDeleted += presenceDeleted;
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                 ✅ LIMPIEZA COMPLETADA                     ║
╠════════════════════════════════════════════════════════════╣
║ 🗑️  Total mensajes eliminados: ${String(totalDeleted).padEnd(10)}                ║
║ 👥 Total presencias eliminadas: ${String(totalPresenceDeleted).padEnd(9)}                ║
║ 🎯 Estado: Salas limpias, solo IA activa                  ║
╚════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
};

// Ejecutar limpieza
runCleanup().catch(error => {
  console.error('❌ Error en limpieza:', error);
  process.exit(1);
});
