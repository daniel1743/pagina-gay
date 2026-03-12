# 🔧 Solución: Advertencia Firebase OAuth

## ⚠️ Problema
```
Info: The current domain is not authorized for OAuth operations.
Domain: 172.26.224.1
```

## ✅ Solución Rápida

### Opción 1: Agregar IP a Firebase Console (Recomendado)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Settings** → **Authorized domains**
4. Haz clic en **Add domain**
5. Agrega: `172.26.224.1`
6. Guarda

### Opción 2: Usar localhost (Alternativa)

Si prefieres usar `localhost` en lugar de la IP:

1. En Firebase Console → Authentication → Settings → Authorized domains
2. Verifica que `localhost` esté en la lista (debería estar por defecto)
3. Accede a tu app usando `http://localhost:3000` en lugar de la IP

### Opción 3: Desactivar la advertencia (Solo desarrollo)

Si solo quieres silenciar la advertencia en desarrollo, puedes modificar `src/config/firebase.js`:

```javascript
// Agregar después de inicializar auth
if (import.meta.env.DEV) {
  // Silenciar advertencias de OAuth en desarrollo
  console.warn = ((originalWarn) => {
    return function(...args) {
      if (args[0]?.includes?.('OAuth') || args[0]?.includes?.('authorized')) {
        return; // No mostrar esta advertencia
      }
      originalWarn.apply(console, args);
    };
  })(console.warn);
}
```

## 📝 Nota
Esta advertencia **NO afecta** el funcionamiento normal de la app. Solo afecta:
- Login con Google/Facebook (popup/redirect)
- El login con email/password funciona normalmente

