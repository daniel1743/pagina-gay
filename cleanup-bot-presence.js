/**
 * SCRIPT DE LIMPIEZA: Elimina TODAS las presencias de bots/IAs de roomPresence
 *
 * Este script elimina presencias con userId:
 * - bot_*
 * - ai_*
 * - static_bot_*
 * - system
 * - system_moderator
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDXIxaMpL6F0U6g21WgIjZzBDMUqearAwc",
  authDomain: "chat-gay-3016f.firebaseapp.com",
  projectId: "chat-gay-3016f",
  storageBucket: "chat-gay-3016f.firebasestorage.app",
  messagingSenderId: "659957232113",
  appId: "1:659957232113:web:e75fe8bb1a1a02b144d450",
  measurementId: "G-PZQQL7WH39"
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
 * Verifica si un userId es de bot/IA
 */
const isBotOrAI = (userId) => {
  return userId === 'system' ||
         userId === 'system_moderator' ||
         userId.startsWith('bot_') ||
         userId.startsWith('bot-') ||
         userId.startsWith('static_bot_') ||
         userId.startsWith('ai_') ||
         userId.includes('bot_join');
};

/**
 * Limpia presencias de bots/IAs de una sala
 */
const cleanRoomPresence = async (roomId) => {
  console.log(`\n👥 Limpiando presencias de bots/IAs en: ${roomId}`);

  const presenceRef = collection(db, 'roomPresence', roomId, 'users');

  try {
    const snapshot = await getDocs(presenceRef);

    let deletedCount = 0;
    let totalCount = snapshot.size;

    console.log(`   📊 Total presencias en sala: ${totalCount}`);

    const deletePromises = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = data.userId || docSnap.id;

      if (isBotOrAI(userId)) {
        console.log(`   🗑️  Eliminando presencia: ${data.username || userId} (ID: ${userId})`);
        deletePromises.push(deleteDoc(docSnap.ref));
        deletedCount++;
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`   ✅ Eliminadas ${deletedCount} presencias de bots/IAs de ${roomId}`);
    } else {
      console.log(`   ✨ No hay presencias de bots/IAs en ${roomId}`);
    }

    return { total: totalCount, deleted: deletedCount };

  } catch (error) {
    console.error(`   ❌ Error limpiando presencia ${roomId}:`, error);
    return { total: 0, deleted: 0, error: true };
  }
};

/**
 * Ejecuta limpieza completa de presencias
 */
const runCleanup = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🧹 LIMPIEZA DE PRESENCIAS DE BOTS/IAs             ║
╠════════════════════════════════════════════════════════════╣
║ 📍 Salas a limpiar: ${ROOMS.length}                                     ║
║ 🎯 Objetivo: Eliminar TODAS las presencias de bots/IAs    ║
╚════════════════════════════════════════════════════════════╝
  `);

  let totalDeleted = 0;
  let totalPresences = 0;

  // Limpiar presencia de todas las salas
  for (const roomId of ROOMS) {
    const result = await cleanRoomPresence(roomId);
    if (!result.error) {
      totalDeleted += result.deleted;
      totalPresences += result.total;
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                 ✅ LIMPIEZA COMPLETADA                     ║
╠════════════════════════════════════════════════════════════╣
║ 👥 Total presencias encontradas: ${String(totalPresences).padEnd(10)}               ║
║ 🗑️  Total presencias eliminadas: ${String(totalDeleted).padEnd(10)}               ║
║ 🎯 Estado: Salas limpias, solo usuarios reales            ║
╚════════════════════════════════════════════════════════════╝
  `);

  process.exit(0);
};

// Ejecutar limpieza
runCleanup().catch(error => {
  console.error('❌ Error en limpieza de presencias:', error);
  process.exit(1);
});
