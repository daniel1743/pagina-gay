/**
 * Script para limpiar datos de prueba de Firestore
 * Mantiene: users, rooms
 * Limpia: private_chats, roomPresence, reports, guests, mensajes de salas
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

// Configuración de Firebase (copia de tu config/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyDnKZ1tOjhdznfNRu-tb24YOF06TsTgQUQ",
  authDomain: "chat-gay-1a4d8.firebaseapp.com",
  projectId: "chat-gay-1a4d8",
  storageBucket: "chat-gay-1a4d8.firebasestorage.app",
  messagingSenderId: "619610898132",
  appId: "1:619610898132:web:e5fc54ee8b8b64d91ca8ae",
  measurementId: "G-PWPTHBDXST"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función auxiliar para borrar una colección completa
async function deleteCollection(collectionPath) {
  const collectionRef = collection(db, collectionPath);
  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty) {
    console.log(`✅ ${collectionPath}: Ya está vacía`);
    return 0;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
    count++;
  });

  await batch.commit();
  console.log(`✅ ${collectionPath}: Eliminados ${count} documentos`);
  return count;
}

// Función para borrar mensajes de todas las salas
async function deleteAllRoomMessages() {
  const roomIds = [
    'conversas-libres',
    'gaming',
    'mas-30',
    'amistad',
    'osos-activos',
    'pasivos-buscando',
    'versatiles',
    'quedar-ya',
    'hablar-primero',
    'morbosear'
  ];

  let totalMessages = 0;

  for (const roomId of roomIds) {
    const messagesPath = `rooms/${roomId}/messages`;
    const count = await deleteCollection(messagesPath);
    totalMessages += count;
  }

  console.log(`✅ Total mensajes de salas eliminados: ${totalMessages}`);
}

// Función para borrar todos los chats privados
async function deleteAllPrivateChats() {
  const privateChatsRef = collection(db, 'private_chats');
  const snapshot = await getDocs(privateChatsRef);

  if (snapshot.empty) {
    console.log('✅ private_chats: Ya está vacía');
    return;
  }

  let totalChats = 0;
  let totalMessages = 0;

  // Borrar mensajes de cada chat privado primero
  for (const chatDoc of snapshot.docs) {
    const messagesRef = collection(db, 'private_chats', chatDoc.id, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);

    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach((msgDoc) => {
      batch.delete(msgDoc.ref);
      totalMessages++;
    });

    if (messagesSnapshot.docs.length > 0) {
      await batch.commit();
    }

    // Borrar el chat en sí
    await deleteDoc(chatDoc.ref);
    totalChats++;
  }

  console.log(`✅ private_chats: Eliminados ${totalChats} chats con ${totalMessages} mensajes`);
}

// Función para borrar notificaciones de todos los usuarios
async function deleteAllNotifications() {
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  let totalNotifications = 0;

  for (const userDoc of usersSnapshot.docs) {
    const notificationsRef = collection(db, 'users', userDoc.id, 'notifications');
    const notificationsSnapshot = await getDocs(notificationsRef);

    if (notificationsSnapshot.empty) continue;

    const batch = writeBatch(db);
    notificationsSnapshot.docs.forEach((notifDoc) => {
      batch.delete(notifDoc.ref);
      totalNotifications++;
    });

    await batch.commit();
  }

  console.log(`✅ Notificaciones de usuarios: Eliminadas ${totalNotifications} notificaciones`);
}

// Función principal
async function cleanFirestore() {
  console.log('🧹 Iniciando limpieza de Firestore...\n');
  console.log('⚠️  Manteniendo intactos: users, rooms (configuración)\n');

  try {
    // 1. Borrar chats privados
    console.log('📱 Limpiando chats privados...');
    await deleteAllPrivateChats();

    // 2. Borrar mensajes de salas públicas
    console.log('\n💬 Limpiando mensajes de salas públicas...');
    await deleteAllRoomMessages();

    // 3. Borrar notificaciones
    console.log('\n🔔 Limpiando notificaciones...');
    await deleteAllNotifications();

    // 4. Borrar roomPresence
    console.log('\n👥 Limpiando presencia de usuarios...');
    await deleteCollection('roomPresence');

    // 5. Borrar reports
    console.log('\n🚩 Limpiando reportes...');
    await deleteCollection('reports');

    // 6. Borrar guests
    console.log('\n👤 Limpiando usuarios invitados...');
    await deleteCollection('guests');

    console.log('\n✅ ¡Limpieza completada exitosamente!');
    console.log('✅ Se mantuvieron: users, rooms');
    console.log('✅ El sistema está listo para usar sin datos de prueba\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar limpieza
cleanFirestore();
