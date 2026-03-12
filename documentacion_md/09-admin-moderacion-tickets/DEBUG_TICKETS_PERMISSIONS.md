# 🔍 DEBUGGER DE PERMISOS DE TICKETS

Este script intercepta automáticamente errores de permisos al leer tickets y muestra información detallada para diagnosticar problemas.

## 🚀 Cómo Usar

### 1. **Automático (ya activo)**

El interceptor ya está activo en `AdminPage`. Cada vez que haya un error de permisos, verás información detallada en la consola del navegador.

### 2. **Manual (desde la consola del navegador)**

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Probar acceso a tickets
testTicketAccess()

// Ver instrucciones de solución
showFixInstructions()
```

## 📋 Qué Verifica

El script verifica automáticamente:

1. ✅ **Usuario autenticado**: Verifica que estés logueado
2. ✅ **Documento existe**: Verifica que tu documento en `users/{uid}` exista
3. ✅ **Campo role definido**: Verifica que tengas el campo `role`
4. ✅ **Rol válido**: Verifica que tu rol sea `admin`, `administrator` o `support`
5. ✅ **Super Admin**: Verifica si eres super admin por email

## 🔧 Solución de Problemas

### Error: "Usuario no autenticado"

**Solución:**
- Cierra sesión y vuelve a iniciar sesión
- Verifica que tu sesión esté activa

### Error: "Documento de usuario NO existe en Firestore"

**Solución:**
1. Ve a Firebase Console: https://console.firebase.google.com/project/chat-gay-3016f/firestore
2. Navega a la colección `users`
3. Crea un documento con tu UID
4. Agrega estos campos:
   ```json
   {
     "id": "tu-uid-aqui",
     "username": "TuUsername",
     "email": "tu@email.com",
     "role": "admin"
   }
   ```

### Error: "Campo 'role' NO está definido"

**Solución:**
1. Ve a Firebase Console → Firestore → `users` → Tu documento
2. Agrega el campo:
   ```json
   {
     "role": "admin"
   }
   ```
3. Valores válidos: `"admin"`, `"administrator"`, `"support"`

### Error: "Rol NO permite acceso a tickets"

**Solución:**
- Tu rol actual no es válido para leer tickets
- Cambia tu rol a uno de estos: `"admin"`, `"administrator"`, `"support"`

## 📊 Ejemplo de Salida del Debugger

```
🚨 ERROR DE PERMISOS DE TICKETS DETECTADO
📋 INFORMACIÓN DEL USUARIO ACTUAL:
  ✅ Usuario autenticado: tu@email.com
  ✅ Documento de usuario existe en Firestore
  ✅ Campo "role" definido: admin
  ✅ Rol válido para acceso a tickets: admin
  ✅ Eres SUPER ADMIN (por email)
  
📊 RESUMEN DE PERMISOS:
  Autenticado: ✅
  Documento existe: ✅
  Role definido: ✅
  Role válido: ✅
  Super Admin: ✅
  Puede leer tickets: ✅ SÍ
```

## 🔐 Estructura Esperada del Documento de Usuario

```json
{
  "id": "abc123xyz",
  "username": "Admin",
  "email": "admin@chactivo.com",
  "role": "admin",  // ← CRÍTICO: Este campo es necesario
  "createdAt": "2025-12-23T...",
  "updatedAt": "2025-12-23T..."
}
```

## 📝 Notas Importantes

- El interceptor está activo automáticamente cuando accedes a AdminPage
- Los errores se muestran en la consola del navegador (F12)
- Ejecuta `testTicketAccess()` manualmente si quieres probar acceso sin esperar un error
- Ejecuta `showFixInstructions()` para ver instrucciones paso a paso

## 🆘 Si el Problema Persiste

1. Verifica que las reglas de Firestore estén actualizadas:
   ```bash
   npm run deploy:rules
   ```

2. Cierra sesión y vuelve a iniciar sesión

3. Limpia la caché del navegador (Ctrl+Shift+Del)

4. Prueba en una ventana incógnito

5. Verifica en Firebase Console que tu documento tenga el campo `role` correcto


