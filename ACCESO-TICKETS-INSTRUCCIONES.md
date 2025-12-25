# 🔐 INSTRUCCIONES PARA ACCEDER AL SISTEMA DE TICKETS

## ⚠️ PROBLEMA: "NO TENGO ACCESO A /admin/tickets"

### SOLUCIÓN EN 3 PASOS:

---

## **PASO 1: Asignar Rol de Admin en Firestore** ✅ CRÍTICO

1. **Ve a Firebase Console**:
   - https://console.firebase.google.com
   - Selecciona tu proyecto "Chactivo"

2. **Abre Firestore Database**:
   - En el menú lateral: "Firestore Database"
   - Click en "Data" (arriba)

3. **Encuentra tu usuario**:
   - Navega a la colección `users`
   - Busca tu documento (tu User ID)
   - **¿Cómo saber cuál es tu User ID?**
     - Abre la consola del navegador (F12)
     - En la pestaña "Console" escribe:
       ```javascript
       localStorage.getItem('userId')
       ```
     - Copia el ID que aparece

4. **Agrega el campo `role`**:
   - Click en tu documento de usuario
   - Click en "Add field" (o editar si ya existe)
   - **Field name**: `role`
   - **Field type**: string
   - **Field value**: `admin` (o `support` si solo quieres acceso a tickets)
   - Click "Save"

**Ejemplo de cómo debe verse**:
```
users/
  └── TU_USER_ID/
      ├── username: "tu_username"
      ├── email: "tu@email.com"
      ├── role: "admin"        ← ESTE CAMPO ES CRÍTICO
      └── ...otros campos
```

---

## **PASO 2: Desplegar Firestore Rules** ✅ OBLIGATORIO

Las nuevas reglas de seguridad DEBEN estar desplegadas en Firebase.

**Abrir terminal en la raíz del proyecto**:

```bash
cd "C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat"
```

**Desplegar las reglas**:

```bash
firebase deploy --only firestore:rules
```

**Espera a que termine**:
```
✔  Deploy complete!
```

**Verificar que se desplegaron**:
1. Ve a Firebase Console → Firestore Database → Rules
2. Busca los comentarios "✅ NUEVO"
3. Debes ver reglas para:
   - `match /tickets/{ticketId}/messages/{messageId}`
   - `match /tickets/{ticketId}/logs/{logId}`
   - `match /usernames/{usernameLower}`
   - `match /admin_logs/{logId}`

---

## **PASO 3: Agregar Botón de Navegación** ✅ ACCESO RÁPIDO

Necesitas un botón en el panel de admin para ir a la nueva página.

**Opción A: Acceso Manual (Rápido)**

Simplemente navega directamente a:
```
http://localhost:5173/admin/tickets
```

**Opción B: Agregar Botón en AdminPage (Recomendado)**

Ya he preparado el código para agregarlo automáticamente.

---

## **VERIFICACIÓN FINAL**

### ✅ Checklist antes de intentar acceder:

- [ ] Campo `role: "admin"` agregado en `/users/{tu-uid}` en Firestore
- [ ] Firestore Rules desplegadas (`firebase deploy --only firestore:rules`)
- [ ] Cierre de sesión y volver a iniciar sesión (para que el frontend recargue el rol)
- [ ] Intenta navegar a `http://localhost:5173/admin/tickets`

---

## 🆘 TROUBLESHOOTING

### ❌ Error: "Acceso Denegado / No tienes permisos"

**Causa**: No tienes rol de admin/support en Firestore

**Solución**:
1. Verifica PASO 1 - asegúrate de que el campo `role: "admin"` existe
2. Cierra sesión y vuelve a iniciar sesión
3. Abre consola del navegador (F12) y escribe:
   ```javascript
   // Verifica tu rol actual
   const auth = getAuth();
   const user = auth.currentUser;
   console.log("User ID:", user.uid);

   // Luego busca este ID en Firestore y verifica que tenga role: "admin"
   ```

### ❌ Error: "Missing or insufficient permissions"

**Causa**: Firestore Rules no están desplegadas

**Solución**:
1. Ejecuta: `firebase deploy --only firestore:rules`
2. Espera a que termine completamente
3. Refresca la página

### ❌ Error: "Page not found / 404"

**Causa**: Las rutas no están registradas en App.jsx

**Solución**: Las rutas ya están agregadas en el código. Asegúrate de que:
1. El servidor de desarrollo esté corriendo (`npm run dev`)
2. No haya errores en la consola
3. La URL sea exactamente: `/admin/tickets`

### ❌ No aparece nada / Página en blanco

**Causa**: Error de JavaScript o permisos

**Solución**:
1. Abre consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Si ves errores de "permissions", ejecuta PASO 2
5. Si ves errores de "role", ejecuta PASO 1

---

## 🎯 ACCESO RÁPIDO ALTERNATIVO

Si quieres acceder AHORA MISMO sin esperar:

### Método 1: Editar directamente en Firebase Console

1. Ve a Firebase Console
2. Firestore Database → users → tu documento
3. Agrega campo: `role: "admin"`
4. Guarda
5. **Cierra sesión en tu app**
6. **Vuelve a iniciar sesión**
7. Ve a: `http://localhost:5173/admin/tickets`

### Método 2: Usar consola del navegador (temporal)

**⚠️ Esto es solo para testing, NO es seguro en producción**

1. Abre consola (F12)
2. Ve al tab "Application" → Local Storage
3. Encuentra la key con tu usuario
4. Edita temporalmente el objeto para agregar `role: "admin"`
5. Refresca la página

**Nota**: Este método es temporal y se perderá al cerrar sesión.

---

## 📍 URLS IMPORTANTES

Una vez configurado, estas son las URLs del sistema de tickets:

- **Lista de tickets**: `http://localhost:5173/admin/tickets`
- **Detalle de ticket**: `http://localhost:5173/admin/tickets/{ticketId}`
- **Panel principal admin**: `http://localhost:5173/admin`

---

## ✅ CONFIRMACIÓN DE ACCESO EXITOSO

Sabrás que todo funciona cuando:

1. Al navegar a `/admin/tickets` ves:
   - ✅ 6 tarjetas de estadísticas (Total, Abiertos, En Progreso, etc.)
   - ✅ Barra de búsqueda y filtros
   - ✅ Lista de tickets (puede estar vacía si no hay tickets)
   - ✅ NO ves mensaje de "Acceso Denegado"

2. Al hacer click en un ticket ves:
   - ✅ Información del ticket
   - ✅ Tarjeta de usuario
   - ✅ Thread de mensajes
   - ✅ Caja de respuesta
   - ✅ Panel de acciones

---

## 🚀 DESPUÉS DE CONFIGURAR

Una vez tengas acceso, puedes:

1. **Ver todos los tickets** en la lista
2. **Buscar tickets** por ID, username, categoría
3. **Filtrar** por estado, categoría, prioridad
4. **Hacer click en un ticket** para ver detalle completo
5. **Responder tickets** con mensajes externos o notas internas
6. **Ejecutar acciones** como cambio de username
7. **Ver logs** de auditoría

---

## 📞 ¿SIGUES SIN ACCESO?

Si después de seguir TODOS los pasos anteriores aún no tienes acceso:

1. Comparte el mensaje de error exacto que ves
2. Abre consola del navegador (F12) y comparte los errores
3. Verifica en Firebase Console que:
   - Tu usuario tiene `role: "admin"`
   - Las Rules se desplegaron correctamente
4. Reinicia el servidor de desarrollo:
   ```bash
   # Ctrl+C para detener
   npm run dev
   ```

---

**La causa más común de "sin acceso" es NO tener el campo `role` en Firestore.**

**La segunda causa más común es no haber desplegado las Firestore Rules.**

**Verifica AMBAS antes de continuar.**
