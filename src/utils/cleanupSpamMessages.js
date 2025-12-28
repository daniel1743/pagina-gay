/**
 * UTILIDAD DE LIMPIEZA DE MENSAJES SPAM
 * Ejecuta desde el navegador con permisos del usuario autenticado
 */

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
  'meme del',
  'como si realmente'
];

const hasProhibitedPattern = (message) => {
  const normalized = message.toLowerCase();
  return PROHIBITED_PATTERNS.some(pattern => normalized.includes(pattern));
};

export const cleanupSpamMessagesInRoom = async (roomId) => {
  console.log(`🧹 Limpiando mensajes spam en sala: ${roomId}...`);

  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const snapshot = await getDocs(messagesRef);

  let totalMessages = 0;
  let deletedMessages = 0;
  const deletedList = [];

  for (const messageDoc of snapshot.docs) {
    totalMessages++;
    const data = messageDoc.data();
    const content = data.content || '';
    const username = data.username || 'Desconocido';

    if (hasProhibitedPattern(content)) {
      console.log(`🚫 ELIMINANDO (${username}): "${content.substring(0, 60)}..."`);
      deletedList.push({ username, content: content.substring(0, 60) });

      try {
        await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageDoc.id));
        deletedMessages++;
      } catch (error) {
        console.error(`❌ Error eliminando mensaje: ${error.message}`);
      }
    }
  }

  console.log(`✅ Sala ${roomId}: ${deletedMessages}/${totalMessages} mensajes eliminados`);

  return {
    roomId,
    total: totalMessages,
    deleted: deletedMessages,
    kept: totalMessages - deletedMessages,
    deletedList
  };
};

export const cleanupAllRooms = async () => {
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

  console.log('🚀 INICIANDO LIMPIEZA MASIVA DE SPAM...\n');

  const results = [];
  let totalDeleted = 0;
  let totalScanned = 0;

  for (const roomId of ROOMS) {
    const stats = await cleanupSpamMessagesInRoom(roomId);
    results.push(stats);
    totalScanned += stats.total;
    totalDeleted += stats.deleted;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ LIMPIEZA COMPLETADA`);
  console.log(`📊 Mensajes escaneados: ${totalScanned}`);
  console.log(`🗑️ Mensajes eliminados: ${totalDeleted}`);
  console.log(`💚 Mensajes conservados: ${totalScanned - totalDeleted}`);
  console.log('='.repeat(60));

  return {
    totalScanned,
    totalDeleted,
    totalKept: totalScanned - totalDeleted,
    results
  };
};
