/**
 * SCRIPT DE LIMPIEZA EXHAUSTIVA DE BOTS SPAM
 * Elimina TODOS los mensajes de bots spam de Firestore
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';

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

// Lista de salas a limpiar
const ROOMS = [
  'conversas-libres',
  'global',
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

// NOMBRES DE BOTS SPAM A ELIMINAR
const SPAM_BOT_NAMES = [
  'ACTIVO24', 'ACTIVO30', 'AGRESIVO26', 'AGRESIVO27', 'AGRESIVO28',
  'BURLÓN25', 'BURLÓN26', 'BURLÓN27', 'SARCÁSTICO25', 'SARCÁSTICO26',
  'VERGON25', 'VERGON27', 'MACHO24', 'MACHO26', 'MACHO32', 'MACHO HOT',
  'MACHO ACTIVO', 'MACHO FIT', 'TÓXICO27', 'TÓXICO28', 'TÓXICO29',
  'PELIGROSO25', 'EXTREMO26', 'OFENSIVO24', 'OFENDIDO24',
  'PENETRADO27', 'PENETRA25', 'PENETRA HOT',
  'ORGÍA30', 'TRÍO HOT', 'TRÍO CALIENTE',
  'SAUNA HOT', 'PARQUE24', 'BARTENDER28',
  'BUSCO CULÓN', 'PASIVO FUERTE', 'SUGAR DADDY',
  'HOT29', 'Hawk', 'Dixie', 'Ridículo', 'Estúpido',
  'Culona', 'Macho hetero', 'Hetero vernáculo',
  'Cojo culo', 'Loco', 'Danin' // Danin debe MANTENERSE si es usuario real
];

/**
 * Verifica si un mensaje es de un bot spam
 */
const isSpamBotMessage = (messageData, username = null) => {
  const userId = messageData.userId || '';
  const msgUsername = username || messageData.username || '';

  // Detectar bots por userId que comienza con 'bot_', 'ai_', 'static_bot_'
  if (userId.startsWith('bot_') ||
      userId.startsWith('ai_') ||
      userId.startsWith('static_bot_') ||
      userId === 'system' ||
      userId.includes('bot_join')) {
    return true;
  }

  // Detectar bots por nombre en la lista de spam
  // IMPORTANTE: NO eliminar "Danin" ya que es el usuario real
  if (msgUsername === 'Danin') {
    return false; // NO ES BOT, es el usuario real
  }

  if (SPAM_BOT_NAMES.includes(msgUsername)) {
    return true;
  }

  // Detectar patrones de nombres de bots spam (MAYÚSCULAS + NÚMERO)
  if (/^[A-ZÑÁÉÍÓÚü\s]+[0-9]{2,3}$/.test(msgUsername)) {
    return true;
  }

  // Detectar bots por contenido sexual explícito repetitivo
  const content = (messageData.content || '').toLowerCase();
  const spamPatterns = [
    'toy en baquedano tmb',
    'busco vergón',
    'busco macho',
    'tienes verga',
    'toy caliente wn',
    'busco culo',
    'quiero follar',
    'toy listo pa',
    'busco orgía',
    'busco trío'
  ];

  if (spamPatterns.some(pattern => content.includes(pattern))) {
    return true;
  }

  return false;
};

/**
 * Limpia mensajes de bots spam de una sala
 */
const cleanRoomMessages = async (roomId) => {
  console.log(`\n🧹 Limpiando sala: ${roomId}`);

  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  try {
    const snapshot = await getDocs(messagesRef);

    let deletedCount = 0;
    let keptCount = 0;
    let totalCount = snapshot.size;

    console.log(`   📊 Total mensajes en sala: ${totalCount}`);

    const deletePromises = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const username = data.username || '';

      if (isSpamBotMessage(data, username)) {
        console.log(`   🗑️  ELIMINANDO BOT: ${username} - "${(data.content || '').substring(0, 50)}..."`);
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      } else {
        if (username === 'Danin' || !isSpamBotMessage(data)) {
          console.log(`   ✅ CONSERVANDO: ${username || 'Usuario'} - "${(data.content || '').substring(0, 30)}..."`);
          keptCount++;
        }
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`   ✅ Eliminados ${deletedCount} mensajes de bots spam de ${roomId}`);
      console.log(`   💚 Conservados ${keptCount} mensajes de usuarios reales`);
    } else {
      console.log(`   ✨ No hay mensajes de bots spam en ${roomId}`);
    }

    return { total: totalCount, deleted: deletedCount, kept: keptCount };

  } catch (error) {
    console.error(`   ❌ Error limpiando ${roomId}:`, error);
    return { total: 0, deleted: 0, kept: 0, error: true };
  }
};

/**
 * Limpia presencia de bots spam en roomPresence
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
      const username = data.username || '';

      // NO eliminar presencia de Danin (usuario real)
      if (username === 'Danin') {
        console.log(`   ✅ CONSERVANDO presencia de usuario real: ${username}`);
        return;
      }

      if (userId.startsWith('bot_') ||
          userId.startsWith('ai_') ||
          userId.startsWith('static_bot_') ||
          userId === 'system' ||
          userId.includes('bot_join') ||
          SPAM_BOT_NAMES.includes(username)) {
        console.log(`   🗑️  Eliminando presencia de bot spam: ${username || userId}`);
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`   ✅ Eliminadas ${deletedCount} presencias de bots spam de ${roomId}`);
    } else {
      console.log(`   ✨ No hay presencias de bots spam en ${roomId}`);
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
║       🧹 LIMPIEZA EXHAUSTIVA DE BOTS SPAM                  ║
╠════════════════════════════════════════════════════════════╣
║ 📍 Salas a limpiar: ${ROOMS.length}                                     ║
║ 🎯 Objetivo: Eliminar TODOS los bots spam                 ║
║ ✅ Conservar: Solo usuarios reales (ej: Danin)            ║
╚════════════════════════════════════════════════════════════╝
  `);

  let totalDeleted = 0;
  let totalKept = 0;
  let totalPresenceDeleted = 0;

  // Limpiar mensajes de todas las salas
  for (const roomId of ROOMS) {
    const result = await cleanRoomMessages(roomId);
    if (!result.error) {
      totalDeleted += result.deleted;
      totalKept += result.kept;
    }

    // Limpiar presencia
    const presenceDeleted = await cleanRoomPresence(roomId);
    totalPresenceDeleted += presenceDeleted;

    // Pequeño delay entre salas para no saturar Firestore
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                 ✅ LIMPIEZA COMPLETADA                     ║
╠════════════════════════════════════════════════════════════╣
║ 🗑️  Mensajes de bots eliminados: ${String(totalDeleted).padEnd(21)}        ║
║ 💚 Mensajes de usuarios conservados: ${String(totalKept).padEnd(16)}        ║
║ 👥 Presencias de bots eliminadas: ${String(totalPresenceDeleted).padEnd(19)}        ║
║ 🎯 Estado: Chat limpio, solo usuarios reales              ║
╚════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
};

// Ejecutar limpieza
runCleanup().catch(error => {
  console.error('❌ Error en limpieza:', error);
  process.exit(1);
});
