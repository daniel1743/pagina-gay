# 🔥 CONFIGURACIÓN DE FIRESTORE - Panel Admin

**Fecha:** 2025-12-11  
**Importante:** Debes actualizar las reglas de Firestore para que el panel admin funcione

---

## ✅ QUÉ DEBES HACER

### 1. **Actualizar Reglas de Firestore**

Las reglas ya están actualizadas en el archivo `firestore.rules`, pero **debes subirlas a Firebase Console**.

#### Pasos:

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/rules
   ```

2. **Copia el contenido completo de `firestore.rules`**

3. **Pega en Firebase Console** (pestaña "Reglas")

4. **Click en "Publicar"**

---

## 📋 NUEVAS COLECCIONES QUE SE CREARÁN AUTOMÁTICAMENTE

### ✅ **NO necesitas crear manualmente** - Se crean automáticamente cuando se usan:

1. **`analytics_stats`** - Estadísticas diarias de analytics
   - Se crea cuando alguien visita una página
   - Estructura: `analytics_stats/{YYYY-MM-DD}`
   - Ejemplo: `analytics_stats/2025-12-11`

2. **`tickets`** - Tickets de soporte
   - Se crea cuando un usuario crea un ticket
   - Estructura: `tickets/{ticketId}`

---

## 🔐 REGLAS AGREGADAS

### **analytics_stats**
- ✅ Cualquier usuario autenticado puede escribir (para tracking)
- ✅ Solo admins pueden leer

### **tickets**
- ✅ Usuarios pueden leer sus propios tickets
- ✅ Admins pueden leer todos los tickets
- ✅ Usuarios autenticados pueden crear tickets
- ✅ Solo admins pueden actualizar tickets
- ✅ No se pueden eliminar tickets

---

## ⚠️ IMPORTANTE

### **Si NO actualizas las reglas:**
- ❌ El tracking de analytics NO funcionará
- ❌ Los usuarios NO podrán crear tickets
- ❌ Los admins NO podrán ver tickets ni analytics

### **Después de actualizar las reglas:**
- ✅ Todo funcionará automáticamente
- ✅ Las colecciones se crearán solas cuando se usen
- ✅ No necesitas crear nada manualmente

---

## 🎯 VERIFICACIÓN

### Después de subir las reglas:

1. **Visita una página** (ej: `/lobby`)
   - Debería crear automáticamente `analytics_stats/2025-12-11`

2. **Crea un ticket desde el perfil**
   - Debería crear automáticamente un documento en `tickets`

3. **Ve al panel admin** (`/admin`)
   - Deberías ver las estadísticas y tickets

---

## 📝 RESUMEN

**¿Debes subir algo a Firestore?**

✅ **SÍ** - Debes subir las **reglas actualizadas** a Firebase Console

❌ **NO** - No necesitas crear colecciones manualmente (se crean solas)

---

**Última actualización:** 2025-12-11

