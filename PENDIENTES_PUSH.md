# Push Notifications - Pendiente (cuando haya trafico)

Todo el codigo ya esta escrito. Solo faltan 3 pasos manuales para activar.

## 1. Generar VAPID Key
- Ir a Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
- Click "Generate key pair"
- Copiar la clave y agregarla en `.env`:
```
VITE_FIREBASE_VAPID_KEY=tu_clave_aqui
```

## 2. Activar plan Blaze en Firebase
- Firebase Console > Upgrade > Blaze (pay-as-you-go)
- Con 250 DAU el costo es $0/mes (free tier cubre 2M invocaciones)

## 3. Deployear Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

## Que se activa con esto
- Push cuando alguien te manda DM (app cerrada)
- Push cuando hay match en Baul
- Push cuando piden chat privado
- Limite: max 2 push/dia por usuario
- Quiet hours: 00:00 - 08:00 (no molesta de noche)

## Archivos involucrados (ya listos)
- `public/firebase-messaging-sw.js` — service worker background
- `src/services/pushNotificationService.js` — permisos + token
- `src/config/firebase.js` — export de messaging
- `functions/index.js` — 3 cloud functions
- `src/pages/ChatPage.jsx` — banner "Activa notificaciones"
