# 🚨 SOLUCIÓN URGENTE - ERRORES DE PERMISOS

## ❌ PROBLEMAS ACTUALES

1. **Missing or insufficient permissions** - No puedes enviar mensajes
2. **Error subscribing to notifications** - Falta índice de Firestore
3. **Conteo de usuarios activos desapareció** - Error en nombre de colección

---

## ✅ SOLUCIÓN COMPLETA (10 MINUTOS)

### PASO 1: Aplicar Reglas Corregidas (3 minutos)

Las reglas tenían un error: usaban `presence` pero el código usa `roomPresence`.

**ACCIÓN:**

1. **Abre Firebase Console:**
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/rules

2. **Borra TODO el contenido actual**

3. **Copia y pega EXACTAMENTE este contenido:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ===========================
    // FUNCIONES AUXILIARES
    // ===========================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isPremium() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isPremium == true;
    }

    function isValidMessage() {
      let data = request.resource.data;
      return 'userId' in data && data.userId == request.auth.uid &&
             'username' in data && data.username is string &&
             'content' in data && data.content is string &&
             data.content.size() > 0 &&
             data.content.size() <= 1000 &&
             'type' in data && data.type in ['text', 'image', 'voice', 'system'] &&
             'timestamp' in data && data.timestamp is timestamp;
    }

    function hasNoProhibitedWords(content) {
      let prohibited = ['spam', 'phishing'];
      return !content.matches('.*(' + prohibited.join('|') + ').*');
    }

    function isAdult(age) {
      return age == null || (age is number && age >= 18);
    }

    // ===========================
    // INVITADOS
    // ===========================

    match /guests/{guestId} {
      allow read, write: if request.auth != null &&
                           request.auth.uid == guestId &&
                           request.auth.token.firebase.sign_in_provider == 'anonymous';
    }

    // ===========================
    // USUARIOS
    // ===========================

    match /users/{userId} {
      allow read: if true;

      allow create: if isOwner(userId) &&
                      request.resource.data.username is string &&
                      request.resource.data.username.size() >= 3 &&
                      request.resource.data.username.size() <= 30 &&
                      request.resource.data.email is string &&
                      request.resource.data.isPremium == false &&
                      request.resource.data.verified == false &&
                      isAdult(request.resource.data.get('age', null));

      allow update: if isOwner(userId) &&
                      request.resource.data.email == resource.data.email &&
                      request.resource.data.id == resource.data.id &&
                      (request.resource.data.isPremium == resource.data.isPremium ||
                       request.resource.data.isPremium == false);

      allow delete: if isOwner(userId);

      // NOTIFICACIONES
      match /notifications/{notificationId} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      // MENSAJES ENVIADOS
      match /sent_messages/{messageId} {
        allow read: if isOwner(userId);
        allow create: if isAuthenticated();
        allow update, delete: if false;
      }
    }

    // ===========================
    // PRESENCIA (USUARIOS CONECTADOS)
    // ===========================

    match /roomPresence/{roomId}/users/{userId} {
      allow read: if true;
      allow create, update, delete: if isOwner(userId);
    }

    // ===========================
    // SALAS DE CHAT
    // ===========================

    match /rooms/{roomId}/messages/{messageId} {
      allow read: if true;

      allow create: if isAuthenticated() &&
                      isValidMessage() &&
                      hasNoProhibitedWords(request.resource.data.content.lower()) &&
                      (request.auth.token.firebase.sign_in_provider != 'anonymous' ||
                       !exists(/databases/$(database)/documents/guests/$(request.auth.uid)) ||
                       get(/databases/$(database)/documents/guests/$(request.auth.uid)).data.messageCount < 3);

      allow update: if isAuthenticated() &&
                      request.resource.data.content == resource.data.content &&
                      request.resource.data.userId == resource.data.userId &&
                      request.resource.data.timestamp == resource.data.timestamp &&
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']);

      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // ===========================
    // CHATS PRIVADOS
    // ===========================

    match /private_chats/{chatId} {
      allow read: if isAuthenticated() &&
                    request.auth.uid in resource.data.participants;

      allow create: if isAuthenticated() &&
                      request.resource.data.keys().hasAll(['participants', 'createdAt']) &&
                      request.auth.uid in request.resource.data.participants &&
                      request.resource.data.participants.size() == 2;

      allow update: if isAuthenticated() &&
                       request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read: if isAuthenticated() &&
                      request.auth.uid in get(/databases/$(database)/documents/private_chats/$(chatId)).data.participants;

        allow create: if isAuthenticated() &&
                        request.auth.uid in get(/databases/$(database)/documents/private_chats/$(chatId)).data.participants &&
                        isValidMessage();

        allow update, delete: if false;
      }
    }

    // ===========================
    // REPORTES
    // ===========================

    match /reports/{reportId} {
      allow read: if false;

      allow create: if isAuthenticated() &&
                      'reporterId' in request.resource.data &&
                      request.resource.data.reporterId == request.auth.uid &&
                      'type' in request.resource.data &&
                      'description' in request.resource.data &&
                      request.resource.data.description is string &&
                      request.resource.data.description.size() > 10 &&
                      'targetUsername' in request.resource.data &&
                      'status' in request.resource.data &&
                      request.resource.data.status == 'pending';

      allow update, delete: if false;
    }

    // ===========================
    // DENEGAR TODO LO DEMÁS
    // ===========================

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Click en "Publicar"**

5. **Espera mensaje verde:** "Tus reglas se publicaron correctamente"

---

### PASO 2: Crear Índice de Notificaciones (2 minutos)

**ACCIÓN:**

1. **Abre Índices:**
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/indexes

2. **Click en "Crear índice" (botón azul)**

3. **Configuración del índice:**
   ```
   Colección:        users/{userId}/notifications
   Campo 1:          read          Ascendente
   Campo 2:          timestamp     Descendente
   ```

4. **Click en "Guardar"**

5. **Espera 1-2 minutos** (aparecerá un círculo de carga)

6. **Verifica que cambie a "Habilitado" (verde)**

---

### PASO 3: Recargar la Aplicación (1 minuto)

**ACCIÓN:**

1. Ve a: http://localhost:3002/

2. **Presiona F5** (o Ctrl+R)

3. **Abre la consola** (F12)

4. **Verifica que NO aparezcan errores de:**
   - ❌ "Missing or insufficient permissions"
   - ❌ "The query requires an index"
   - ❌ "Error subscribing to room"
   - ❌ "Error joining room"

---

## ✅ CÓMO VERIFICAR QUE FUNCIONÓ

### 1. Conteo de Usuarios Activos

**Debe aparecer:**
- En el sidebar izquierdo
- Debajo del nombre de cada sala
- Ejemplo: "3 usuarios conectados"

**Si no aparece:**
- Abre F12 → Consola
- Busca errores de "roomPresence"
- Verifica que las reglas digan `roomPresence` (no `presence`)

---

### 2. Enviar Mensajes

**Prueba:**
1. Entra a cualquier sala
2. Escribe: "Hola mundo"
3. Presiona Enter

**Debe pasar:**
- ✅ El mensaje se envía inmediatamente
- ✅ Aparece en la sala con tu nombre y avatar
- ✅ No hay error en consola

**Si falla:**
- Verifica que las reglas estén publicadas
- Verifica que estés autenticado (no invitado)
- Mira consola para ver el error específico

---

### 3. Sistema de Notificaciones

**Prueba:**
1. Con Usuario 1, envía un mensaje en una sala
2. Con Usuario 2, haz click en el nombre de Usuario 1
3. Click en "Enviar Mensaje Directo"
4. Escribe: "Hola, esto es una prueba"
5. Click en "Enviar Mensaje"

**Debe pasar:**
- ✅ Toast: "✉️ Mensaje enviado"
- ✅ Con Usuario 1, aparece campanita con badge "1"
- ✅ Click en campanita abre panel
- ✅ Aparece el mensaje de Usuario 2

**Si falla:**
- Verifica que el índice esté "Habilitado"
- Espera 1-2 minutos más si está "Creando..."
- Verifica reglas para `notifications`

---

## 🐛 ERRORES COMUNES

### Error: "presence is not defined"

**Solución:** Las reglas usan `presence` pero debe ser `roomPresence`.
Verifica que la línea 142 de las reglas diga:
```
match /roomPresence/{roomId}/users/{userId} {
```

---

### Error: "The query requires an index"

**Solución:** El índice aún no está listo.
- Ve a Firebase Console → Índices
- Espera a que diga "Habilitado" (verde)
- Si dice "Error", bórralo y créalo de nuevo

---

### Error: "Missing or insufficient permissions" (persiste)

**Causas posibles:**
1. Las reglas no se publicaron correctamente
2. Hay un typo en las reglas
3. Estás usando un usuario invitado (anónimo)

**Solución:**
1. Ve a Firebase Console → Reglas
2. Click "Publicar" de nuevo
3. Espera confirmación verde
4. Recarga la app (F5)

---

## 📊 CHECKLIST FINAL

Antes de continuar, verifica:

- [ ] Reglas publicadas correctamente (mensaje verde)
- [ ] Índice creado y "Habilitado" (verde)
- [ ] Página recargada (F5)
- [ ] Consola sin errores de permisos
- [ ] Conteo de usuarios aparece en sidebar
- [ ] Puedes enviar mensajes en salas
- [ ] Campanita aparece en header
- [ ] Click en nombres abre modal

**Si TODOS están ✅, continúa con las pruebas del sistema social.**

**Si alguno está ❌, revisa la sección de errores comunes arriba.**

---

## ⏱️ TIEMPO TOTAL: 6-10 MINUTOS

- Aplicar reglas: 3 min
- Crear índice: 2 min
- Esperar índice: 1-2 min
- Verificar: 1 min

**¡Avísame cuando hayas completado estos pasos y te ayudo con lo que siga!**
