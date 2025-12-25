# 🔑 GUÍA RÁPIDA: VERIFICAR Y CONFIGURAR TU ROL DE ADMIN

## ✅ PASO 1: OBTENER TU USER ID

### Opción A: Desde la Consola del Navegador (MÁS FÁCIL)

1. Abre tu app en el navegador
2. Presiona **F12** para abrir la consola
3. Ve a la pestaña **"Console"**
4. Escribe y presiona Enter:
   ```javascript
   localStorage.getItem('userId')
   ```
5. **COPIA** el texto que aparece (es tu User ID, algo como: `"abc123xyz789..."`)

### Opción B: Desde Firebase Console

1. Ve a Firebase Console → Authentication
2. Busca tu email en la lista de usuarios
3. El **User UID** es tu User ID

---

## ✅ PASO 2: VERIFICAR TU ROL EN FIRESTORE

1. **Abre Firebase Console**:
   - https://console.firebase.google.com
   - Selecciona tu proyecto

2. **Ve a Firestore Database**:
   - Menú lateral → "Firestore Database"
   - Click en "Data"

3. **Busca tu usuario**:
   - Click en la colección `users`
   - Busca el documento con TU USER ID (el que copiaste en Paso 1)
   - **Si no lo encuentras**: usa Ctrl+F y pega tu User ID

4. **Verifica el campo `role`**:

   ### ✅ SI VES ESTO = TODO BIEN:
   ```
   username: "tu_username"
   email: "tu@email.com"
   role: "admin"          ← ESTE ES EL CAMPO IMPORTANTE
   isPremium: false
   ...
   ```

   ### ❌ SI NO VES EL CAMPO `role` = DEBES AGREGARLO:

   **Agrega el campo ahora:**
   1. Click en tu documento de usuario
   2. Click en **"Add field"**
   3. **Field**: `role`
   4. **Type**: string
   5. **Value**: `admin`
   6. Click **"Update"**

---

## ✅ PASO 3: DESPLEGAR FIRESTORE RULES

**Abre terminal** en la raíz del proyecto:

```bash
cd "C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat"
```

**Ejecuta**:
```bash
firebase deploy --only firestore:rules
```

**Espera a ver**:
```
✔  Deploy complete!
```

---

## ✅ PASO 4: REINICIAR SESIÓN

**MUY IMPORTANTE**: Después de agregar el rol, debes reiniciar sesión para que el frontend lo detecte.

1. **Cierra sesión** en tu app
2. **Vuelve a iniciar sesión**
3. Ve a `/admin`
4. Click en el tab **"Tickets"**
5. Click en el botón **"Ir al Sistema Completo de Tickets"**

---

## 🎯 VERIFICACIÓN FINAL

### Sabrás que TODO ESTÁ BIEN cuando:

✅ Al hacer click en **"Ir al Sistema Completo de Tickets"**:
- La página carga sin errores
- Ves 6 tarjetas de estadísticas
- Ves la barra de búsqueda y filtros
- **NO** ves mensaje de "Acceso Denegado"

### Si ves "Acceso Denegado":

❌ **Causa más común**: No agregaste el campo `role` en Firestore

**Solución**:
1. Repite PASO 2 y asegúrate de que el campo `role: "admin"` existe
2. Cierra sesión y vuelve a iniciar sesión
3. Intenta de nuevo

---

## 🆘 COMANDOS DE DIAGNÓSTICO

Si sigues sin acceso, pega esto en la consola del navegador (F12):

```javascript
// 1. Verifica tu User ID
console.log("Mi User ID:", localStorage.getItem('userId'));

// 2. Verifica si estás autenticado
const auth = getAuth();
if (auth.currentUser) {
  console.log("✅ Estás autenticado");
  console.log("Email:", auth.currentUser.email);
  console.log("UID:", auth.currentUser.uid);
} else {
  console.log("❌ NO estás autenticado - debes iniciar sesión");
}

// 3. Verifica tu rol (después de agregar el campo en Firestore)
const db = getFirestore();
const userRef = doc(db, 'users', auth.currentUser.uid);
getDoc(userRef).then(docSnap => {
  if (docSnap.exists()) {
    console.log("Tu rol es:", docSnap.data().role);
    if (docSnap.data().role === 'admin' || docSnap.data().role === 'support') {
      console.log("✅ Tienes permisos de admin/support");
    } else {
      console.log("❌ NO tienes permisos - agrega el campo 'role: admin' en Firestore");
    }
  }
});
```

---

## 📋 CHECKLIST COMPLETO

Marca cada paso conforme lo completes:

- [ ] **Paso 1**: Obtuve mi User ID
- [ ] **Paso 2**: Verifiqué mi rol en Firestore
  - [ ] El campo `role: "admin"` existe en mi documento `/users/{mi-uid}`
- [ ] **Paso 3**: Desplegué Firestore Rules (`firebase deploy --only firestore:rules`)
- [ ] **Paso 4**: Cerré sesión y volví a iniciar sesión
- [ ] **Verificación**: Puedo acceder a `/admin/tickets` sin errores

---

## ✅ RESUMEN EN 3 LÍNEAS

1. **Agrega** `role: "admin"` en Firestore → `/users/{tu-uid}`
2. **Despliega** rules: `firebase deploy --only firestore:rules`
3. **Cierra sesión** y vuelve a iniciar sesión

**Listo!** 🎉

---

## 🔗 ENLACES ÚTILES

- Firebase Console: https://console.firebase.google.com
- Documentación completa: `SISTEMA-TICKETS-IMPLEMENTADO.md`
- Instrucciones de acceso: `ACCESO-TICKETS-INSTRUCCIONES.md`
