# 🔥 INSTRUCCIONES URGENTES: Actualizar Reglas de Firestore

## ⚠️ PROBLEMA ACTUAL

Estás viendo errores de permisos porque las reglas de Firestore **NO están actualizadas en Firebase Console**. Las reglas en el archivo `firestore.rules` están correctas, pero **debes subirlas manualmente**.

## ✅ SOLUCIÓN PASO A PASO

### 1. Abre Firebase Console
```
https://console.firebase.google.com/
```

### 2. Selecciona tu proyecto
- Proyecto: **chat-gay-3016f**

### 3. Ve a Firestore Database
- En el menú lateral izquierdo, haz clic en **"Firestore Database"**
- O ve directamente a: https://console.firebase.google.com/project/chat-gay-3016f/firestore

### 4. Abre la pestaña "Reglas"
- Haz clic en la pestaña **"Reglas"** (Rules) en la parte superior

### 5. Copia el contenido completo
- Abre el archivo `firestore.rules` en tu editor
- **Selecciona TODO** el contenido (Ctrl+A / Cmd+A)
- **Copia** (Ctrl+C / Cmd+C)

### 6. Pega en Firebase Console
- **Borra TODO** el contenido actual en Firebase Console
- **Pega** el contenido copiado (Ctrl+V / Cmd+V)

### 7. Publica las reglas
- Haz clic en el botón **"Publicar"** (Publish) en la parte superior
- Espera a que se publique (verás un mensaje de confirmación)

## ✅ VERIFICACIÓN

Después de publicar, deberías ver:
- ✅ No más errores de "Missing or insufficient permissions" para el foro
- ✅ No más errores de "Missing or insufficient permissions" para globalActivity
- ✅ El foro debería poder leer threads
- ✅ Los usuarios registrados deberían poder crear threads

## 📋 REGLAS AGREGADAS

Las nuevas reglas incluyen:

1. **`forum_threads`** - Foro anónimo
   - ✅ Lectura pública (cualquiera puede ver)
   - ✅ Escritura solo para usuarios registrados

2. **`forum_replies`** - Respuestas del foro
   - ✅ Lectura pública
   - ✅ Escritura solo para usuarios registrados

3. **`globalActivity`** - Actividad global de usuarios
   - ✅ Lectura pública (para mostrar en lobby)
   - ✅ Escritura solo para el propio usuario

## ⚠️ IMPORTANTE

**NO cierres esta ventana hasta que hayas publicado las reglas**, o los errores continuarán.

## 🆘 SI SIGUES VIENDO ERRORES

1. Verifica que copiaste **TODO** el contenido de `firestore.rules`
2. Verifica que no haya errores de sintaxis en Firebase Console (aparecerán en rojo)
3. Espera 1-2 minutos después de publicar (puede tardar en propagarse)
4. Recarga la página de tu aplicación

