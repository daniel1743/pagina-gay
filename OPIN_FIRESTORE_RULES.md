# 🔒 Firestore Security Rules para OPIN

## Instrucciones de Deploy

Estas reglas deben agregarse al archivo `firestore.rules` de tu proyecto Firebase.

**⚠️ IMPORTANTE:** NO borres las reglas existentes. Agrega estas al final del archivo.

---

## Reglas para `opin_posts` collection

```javascript
// 🎯 OPIN Posts - Discovery Wall
match /opin_posts/{postId} {
  // ✅ Lectura: Todos los usuarios autenticados pueden leer posts activos
  allow read: if request.auth != null &&
                get(/databases/$(database)/documents/opin_posts/$(postId)).data.isActive == true;

  // ✅ Creación: Solo usuarios registrados (no guests)
  allow create: if request.auth != null &&
                  request.auth.token.firebase.sign_in_provider != 'anonymous' &&
                  request.resource.data.userId == request.auth.uid &&
                  request.resource.data.text is string &&
                  request.resource.data.text.size() >= 10 &&
                  request.resource.data.text.size() <= 500 &&
                  request.resource.data.isActive == true;

  // ✅ Actualización: Solo para incrementar contadores (viewCount, profileClickCount)
  allow update: if request.auth != null &&
                  (
                    // Permitir incremento de viewCount
                    (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount', 'updatedAt'])) ||
                    // Permitir incremento de profileClickCount
                    (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['profileClickCount', 'updatedAt']))
                  );

  // ✅ Eliminación: Solo el autor del post
  allow delete: if request.auth != null &&
                  resource.data.userId == request.auth.uid;
}
```

---

## Índice Compuesto Requerido

Firebase te pedirá crear este índice cuando hagas la primera query. Pero puedes agregarlo manualmente:

**En Firebase Console:**
1. Ve a Firestore Database → Indexes
2. Click "Create Index"
3. Collection ID: `opin_posts`
4. Agrega estos campos:
   - `isActive` (Ascending)
   - `expiresAt` (Ascending)
   - `createdAt` (Descending)

**O usa este JSON en `firestore.indexes.json`:**

```json
{
  "indexes": [
    {
      "collectionGroup": "opin_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "opin_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Deploy de Rules

### Opción 1: Firebase Console (Recomendado para MVP)

1. Ve a Firebase Console → Firestore Database
2. Click en "Rules" tab
3. Copia y pega las reglas de OPIN al final del archivo
4. Click "Publish"

### Opción 2: Firebase CLI

```bash
# Si ya tienes firestore.rules local
firebase deploy --only firestore:rules

# Si también necesitas índices
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Validaciones Implementadas

### ✅ Lectura
- Solo usuarios autenticados
- Solo posts con `isActive = true`

### ✅ Creación
- Solo usuarios registrados (NO guests/anonymous)
- Usuario autenticado === userId del post
- Texto entre 10-500 caracteres
- Post inicial con `isActive = true`

### ✅ Actualización
- Solo para incrementar contadores (`viewCount`, `profileClickCount`)
- NO permite editar el texto del post
- NO permite cambiar `isActive` (excepto via delete)

### ✅ Eliminación
- Solo el autor puede eliminar su propio post

---

## Testing de Rules

Puedes testear las rules en Firebase Console:

1. Ve a Firestore → Rules → Playground
2. Simula operaciones:

```javascript
// Test: Usuario registrado crea post (DEBE PASAR ✅)
operation: create
path: /opin_posts/test123
data: {
  userId: "user123",
  username: "TestUser",
  avatar: "url",
  profileId: "user123",
  text: "Este es un post de prueba para OPIN",
  createdAt: timestamp,
  expiresAt: timestamp,
  isActive: true,
  viewCount: 0,
  profileClickCount: 0
}
authenticated: user123

// Test: Guest intenta crear post (DEBE FALLAR ❌)
operation: create
authenticated: anonymous
```

---

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Verifica que las rules estén publicadas
- Verifica que el usuario esté autenticado
- Verifica que el usuario NO sea guest/anonymous

### Error: "The query requires an index"
- Crea el índice compuesto desde Firebase Console
- O usa el link que Firebase te da en el error

### Posts no aparecen en el feed
- Verifica que `isActive = true`
- Verifica que `expiresAt > now`
- Verifica que el índice esté creado

---

## Próximos Pasos (Para Fase 2)

Cuando implementes features avanzadas, necesitarás:

1. **Moderación Automática:**
```javascript
match /opin_posts/{postId} {
  allow update: if resource.data.reportCount < 3;
}
```

2. **Cooldowns:**
```javascript
match /opin_cooldowns/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

3. **Analytics Avanzados:**
```javascript
match /opin_posts/{postId} {
  allow update: if request.resource.data.diff(resource.data).affectedKeys()
                  .hasOnly(['viewedBy', 'profileViewedBy', 'viewCount', 'profileClickCount']);
}
```

---

**Fecha:** 2026-01-13
**Estado:** MVP - Listo para deploy
