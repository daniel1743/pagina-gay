/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker
 * Maneja push notifications cuando la app esta en background o cerrada
 */

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDXIxaMpL6F0U6g21WgIjZzBDMUqearAwc',
  authDomain: 'chat-gay-3016f.firebaseapp.com',
  projectId: 'chat-gay-3016f',
  storageBucket: 'chat-gay-3016f.firebasestorage.app',
  messagingSenderId: '659957232113',
  appId: '1:659957232113:web:e75fe8bb1a1a02b144d450',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};

  const notificationTitle = title || 'Chactivo';
  const notificationOptions = {
    body: body || 'Tienes una nueva notificacion',
    icon: icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'chactivo-notification',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Al hacer click en la notificacion, abrir la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes('chactivo.com') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      return clients.openWindow(url);
    })
  );
});
