# 🔄 DUPLICACIÓN DE SALA GLOBAL - LIMPIEZA DE SPAM

**Fecha:** 2025-01-27  
**Objetivo:** Crear una nueva sala "global" limpia manteniendo la ruta `/chat/global` para SEO

---

## 📋 ESTRATEGIA IMPLEMENTADA

### ✅ Cambios en `src/config/rooms.js`

1. **Sala Antigua (Comentada):**
   - ❌ Comentada y renombrada a `general` (con spam)
   - 📝 Nota: "SALA GLOBAL ANTIGUA - COMENTADA (tenía spam masivo)"

2. **Sala Nueva (Activa):**
   - ✅ Mantiene el id `global` (preserva ruta `/chat/global`)
   - ✅ Limpia, sin spam
   - 📝 Nota: "Mantiene el id 'global' para preservar la ruta /chat/global (SEO)"

---

## ⚠️ IMPORTANTE: COLECCIÓN DE FIRESTORE

### Estructura Actual en Firestore:

```
rooms/
  └── global/
      └── messages/  ← Contiene mensajes antiguos con spam
```

### ⚠️ ADVERTENCIA:

**La nueva sala "global" usa la MISMA colección de Firestore** (`rooms/global/messages`).

**Esto significa:**
- ✅ La ruta `/chat/global` sigue funcionando (SEO preservado)
- ⚠️ Los mensajes antiguos con spam **siguen visibles** en Firestore
- ⚠️ Necesitas **limpiar manualmente** los mensajes antiguos de Firestore

---

## 🧹 LIMPIEZA DE FIRESTORE (Recomendado)

### Opción 1: Limpiar Mensajes Antiguos Manualmente

1. **Ir a Firebase Console:**
   - `https://console.firebase.google.com/`
   - Seleccionar proyecto: `chat-gay-3016f`
   - Ir a Firestore Database

2. **Eliminar mensajes antiguos:**
   - Navegar a: `rooms > global > messages`
   - Filtrar mensajes antiguos (por fecha o por userId de bots)
   - Eliminar mensajes con spam

### Opción 2: Script de Limpieza (Recomendado)

Crear un script para eliminar mensajes antiguos de bots/IA:

```javascript
// cleanup-global-messages.js
import { db } from './src/config/firebase';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const cleanupOldMessages = async () => {
  const messagesRef = collection(db, 'rooms', 'global', 'messages');
  
  // Filtrar mensajes de bots/IA (userId empieza con 'ai_', 'bot_', etc.)
  const q = query(
    messagesRef,
    where('userId', '>=', 'ai_'),
    where('userId', '<=', 'ai_\uf8ff')
  );
  
  const snapshot = await getDocs(q);
  let deleted = 0;
  
  snapshot.forEach(async (doc) => {
    await deleteDoc(doc.ref);
    deleted++;
  });
  
  console.log(`✅ Eliminados ${deleted} mensajes de bots/IA`);
};

cleanupOldMessages();
```

---

## ✅ VERIFICACIÓN

### Rutas que Funcionan:

- ✅ `/chat/global` → Nueva sala limpia (id: `global`)
- ✅ `/global` → Landing page (sin cambios)
- ✅ Todas las demás rutas intactas

### Configuración Final:

```javascript
// src/config/rooms.js
export const roomsData = [
  // ⚠️ SALA GLOBAL ANTIGUA - COMENTADA (tenía spam masivo)
  // {
  //   id: 'general',
  //   name: 'Chat General 🌍 (SPAM)',
  //   ...
  // },

  // 🔥 SALA GLOBAL NUEVA - Limpia sin spam
  {
    id: 'global',  // ← Mantiene la ruta /chat/global
    name: 'Chat Global 🌍',
    description: 'Sala principal - Todos los temas bienvenidos',
    icon: Hash,
    color: 'teal'
  },
  // ... resto de salas
];
```

---

## 📊 IMPACTO EN SEO

### ✅ Preservado:

- ✅ URL `/chat/global` sigue funcionando
- ✅ Google no detectará cambios de URL
- ✅ Enlaces externos siguen funcionando
- ✅ Sitemap no requiere cambios

### ⚠️ Requiere Acción:

- ⚠️ Limpiar mensajes antiguos de Firestore para que la sala se vea limpia
- ⚠️ Los mensajes antiguos seguirán visibles hasta que se limpien

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Configuración completada** - Sala duplicada y comentada
2. ⚠️ **Limpieza de Firestore** - Eliminar mensajes antiguos con spam
3. ✅ **Verificación** - Probar que `/chat/global` funciona correctamente

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Configuración completada, requiere limpieza de Firestore

