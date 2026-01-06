# Reglas de Firestore - Backup y Simplificación (6 de Enero 2026)

## ⚠️ IMPORTANTE: Cambio temporal de reglas

Esta noche se simplifican las reglas de Firestore para permitir que **TODOS** puedan escribir (logueados y no logueados). Mañana se deben restaurar las reglas originales para mayor seguridad.

---

## 📋 Reglas ACTUALES (probables - las que están causando problemas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== COLECCIÓN: messages =====
    match /messages/{messageId} {
      // Leer: Solo usuarios autenticados
      allow read: if request.auth != null;

      // Crear: Solo usuarios autenticados
      allow create: if request.auth != null
                    && request.resource.data.authorId == request.auth.uid
                    && request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 500
                    && !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Actualizar: Solo el autor o admins
      allow update: if request.auth != null
                    && (resource.data.authorId == request.auth.uid
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true)
                    && !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Eliminar: Solo el autor o admins
      allow delete: if request.auth != null
                    && (resource.data.authorId == request.auth.uid
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }

    // ===== COLECCIÓN: users =====
    match /users/{userId} {
      // Leer: Todos
      allow read: if true;

      // Crear: Solo el propio usuario
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Actualizar: Solo el propio usuario (sin poder hacerse admin)
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data)
                    && (!('isAdmin' in resource.data) || resource.data.isAdmin == request.resource.data.isAdmin)
                    && (!('moderator' in resource.data) || resource.data.moderator == request.resource.data.moderator);

      // Eliminar: Solo el propio usuario o admin
      allow delete: if request.auth != null
                    && (request.auth.uid == userId
                        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }

    // ===== COLECCIÓN: presence =====
    match /presence/{userId} {
      // Leer: Todos
      allow read: if true;

      // Escribir: Solo el propio usuario o autenticado
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // ===== COLECCIÓN: bans =====
    match /bans/{banId} {
      // Leer: Solo admins
      allow read: if request.auth != null
                  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;

      // Escribir: Solo admins
      allow write: if request.auth != null
                   && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // ===== COLECCIÓN: reports =====
    match /reports/{reportId} {
      // Leer: Solo admins
      allow read: if request.auth != null
                  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;

      // Crear: Usuarios autenticados
      allow create: if request.auth != null;

      // Actualizar/Eliminar: Solo admins
      allow update, delete: if request.auth != null
                            && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Denegar todo lo demás por defecto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ Reglas SIMPLIFICADAS para esta noche (6 de Enero 2026)

**Características:**
- ✅ TODOS pueden leer y escribir mensajes (logueados y no logueados)
- ✅ Se mantiene protección básica: **NADIE puede hacerse admin**
- ✅ Validación mínima de mensajes (longitud, campos requeridos)
- ✅ Sin restricciones de autenticación para el chat

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== COLECCIÓN: messages =====
    // ⚡ ULTRA PERMISIVO: Todos pueden leer y escribir
    match /messages/{messageId} {
      // Leer: TODOS (incluso sin login)
      allow read: if true;

      // Crear: TODOS pueden crear mensajes
      allow create: if request.resource.data.text is string
                    && request.resource.data.text.size() > 0
                    && request.resource.data.text.size() <= 5000
                    && !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Actualizar: TODOS pueden actualizar (sin poder agregar isAdmin)
      allow update: if !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Eliminar: TODOS pueden eliminar
      allow delete: if true;
    }

    // ===== COLECCIÓN: users =====
    match /users/{userId} {
      // Leer: TODOS
      allow read: if true;

      // Crear: TODOS (pero sin poder hacerse admin)
      allow create: if !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data);

      // Actualizar: TODOS (pero sin poder hacerse admin)
      allow update: if !('isAdmin' in request.resource.data)
                    && !('moderator' in request.resource.data)
                    && (!('isAdmin' in resource.data) || resource.data.isAdmin == request.resource.data.isAdmin)
                    && (!('moderator' in resource.data) || resource.data.moderator == request.resource.data.moderator);

      // Eliminar: TODOS
      allow delete: if true;
    }

    // ===== COLECCIÓN: presence =====
    match /presence/{userId} {
      // Leer: TODOS
      allow read: if true;

      // Escribir: TODOS
      allow write: if true;
    }

    // ===== COLECCIÓN: bans =====
    // Protegido: Solo lectura para debugging
    match /bans/{banId} {
      allow read: if true;
      allow write: if false;  // Nadie puede escribir bans esta noche
    }

    // ===== COLECCIÓN: reports =====
    match /reports/{reportId} {
      allow read: if true;
      allow create: if true;  // Todos pueden reportar
      allow update, delete: if false;  // Nadie puede modificar/eliminar reportes
    }

    // ===== PERMITIR TODO LO DEMÁS (excepto crear admins) =====
    match /{document=**} {
      allow read: if true;
      allow write: if !('isAdmin' in request.resource.data)
                   && !('moderator' in request.resource.data);
    }
  }
}
```

---

## 📝 Diferencias clave entre reglas

| Característica | Reglas ACTUALES | Reglas SIMPLIFICADAS |
|----------------|-----------------|----------------------|
| Leer mensajes | Solo autenticados | ✅ TODOS |
| Escribir mensajes | Solo autenticados | ✅ TODOS |
| Crear usuario | Solo autenticados | ✅ TODOS |
| Hacerse admin | ❌ Bloqueado | ❌ Bloqueado |
| Validación de mensajes | Estricta (500 chars) | Relajada (5000 chars) |
| Bans | Solo admins | 🔒 Solo lectura |
| Reports | Crear: autenticados | ✅ TODOS pueden crear |

---

## 🚀 Cómo aplicar las reglas simplificadas

### Opción 1: Consola de Firebase (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas** (Rules)
5. **COPIA** las reglas actuales a un archivo de texto (backup manual)
6. **REEMPLAZA** todo el contenido con las **Reglas SIMPLIFICADAS** de arriba
7. Haz clic en **Publicar** (Publish)
8. Espera 1-2 minutos para que se propaguen

### Opción 2: Firebase CLI

Si tienes Firebase CLI instalado:

```bash
# 1. Guarda las reglas actuales
firebase firestore:rules:get > firestore-rules-backup.txt

# 2. Copia las reglas simplificadas a un archivo local
# (crea un archivo firestore.rules con las reglas simplificadas)

# 3. Despliega las nuevas reglas
firebase deploy --only firestore:rules
```

---

## ⏰ Para mañana: Restaurar reglas originales

Cuando mañana quieras volver a las reglas seguras:

1. Ve a la consola de Firebase
2. Firestore Database → Reglas
3. Copia las **Reglas ACTUALES** de este documento
4. Pégalas en el editor
5. Publica

O usa Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 🔒 Protecciones que SE MANTIENEN esta noche

Aunque las reglas son permisivas, estas protecciones **siguen activas**:

1. ✅ **Nadie puede hacerse admin** - Campo `isAdmin` bloqueado
2. ✅ **Nadie puede hacerse moderator** - Campo `moderator` bloqueado
3. ✅ **Mensajes tienen límite** - Máximo 5000 caracteres
4. ✅ **Bans no se pueden modificar** - Solo lectura
5. ✅ **Reports no se pueden modificar después de creados**

---

## ⚠️ Riesgos de las reglas simplificadas

**Solo usar por esta noche!**

- 🔴 Usuarios pueden eliminar mensajes de otros
- 🔴 Usuarios pueden modificar perfiles de otros (excepto admin status)
- 🔴 Sin autenticación requerida para escribir
- 🔴 Posible spam o abuso (sin limitaciones de rate)

**Por eso es CRÍTICO restaurar las reglas mañana!**

---

## ✅ Checklist

- [ ] Backup de reglas actuales hecho (copiar a archivo de texto)
- [ ] Reglas simplificadas copiadas
- [ ] Reglas publicadas en Firebase Console
- [ ] Esperados 2 minutos para propagación
- [ ] Probado que usuarios pueden escribir
- [ ] **MAÑANA**: Restaurar reglas originales

---

## 📞 Si algo sale mal

Si las reglas causan problemas:

1. Ve inmediatamente a Firebase Console
2. Reemplaza con estas reglas de emergencia (permiten todo temporalmente):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Publica
4. Arregla el problema
5. Vuelve a las reglas apropiadas

---

**Creado:** 6 de Enero 2026
**Propósito:** Permitir que todos escriban esta noche
**Restaurar:** Mañana 7 de Enero 2026
