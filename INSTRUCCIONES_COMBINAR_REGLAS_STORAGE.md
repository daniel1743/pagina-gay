# 📋 INSTRUCCIONES: Combinar Reglas de Storage

## ⚠️ IMPORTANTE
**NO reemplaces las reglas existentes.** Necesitamos **AÑADIR** las nuevas reglas a las que ya tienes.

## 🔍 PASO 1: Obtener tus reglas actuales

1. Ve a Firebase Console: https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a **Storage** → **Reglas** (Rules)
4. **COPIA TODO** el contenido de las reglas actuales
5. Guárdalo en un archivo temporal o pégalo aquí

## 📝 PASO 2: Añadir las nuevas reglas

Una vez que tengas tus reglas actuales, necesitamos añadir estas líneas:

```javascript
// Reglas para fotos de perfil (AÑADIR ESTO)
match /profile_photos/{userId}/{allPaths=**} {
  // Cualquiera puede leer las fotos de perfil (públicas)
  allow read: if true;
  
  // Solo el usuario autenticado puede escribir en su propia carpeta
  allow write: if request.auth != null && request.auth.uid == userId
    && request.resource.size < 100 * 1024  // Máximo 100 KB (después de compresión)
    && request.resource.contentType.matches('image/.*');
  
  // Permitir eliminación solo del propio usuario
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

## ✅ PASO 3: Dónde añadirlas

Añade las reglas de `profile_photos` **DENTRO** del bloque `match /b/{bucket}/o { ... }`, 
**ANTES** de cualquier regla `match /{allPaths=**}` que tenga `allow read, write: if false;`

## 📋 Ejemplo de estructura:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // TUS REGLAS EXISTENTES AQUÍ
    // ... (mantén todas tus reglas actuales) ...
    
    // ⬇️ AÑADE ESTAS NUEVAS REGLAS AQUÍ ⬇️
    match /profile_photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 100 * 1024
        && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    // ⬆️ FIN DE NUEVAS REGLAS ⬆️
    
    // Si tienes una regla por defecto, déjala al final
    // match /{allPaths=**} {
    //   allow read, write: if false;
    // }
  }
}
```

## 🚨 IMPORTANTE
- **NO elimines** ninguna de tus reglas existentes
- **Solo AÑADE** las reglas de `profile_photos`
- Si tienes una regla `match /{allPaths=**}` que deniega todo, las reglas de `profile_photos` deben ir **ANTES** de esa regla

## 📤 PASO 4: Desplegar
Una vez combinadas, despliega con:
```bash
firebase deploy --only storage
```



