# 📊 EXPLICACIÓN: CÓMO FUNCIONA EL ANALYTICS Y LOS ERRORES

**Fecha:** 2025-12-11

---

## 🔍 CÓMO FUNCIONA EL SISTEMA DE ANALYTICS

### **1. ¿De dónde se saca la información?**

El sistema de analytics **NO lee datos de Google Analytics** ni de fuentes externas. **Todo se genera internamente** en tu aplicación.

#### **Flujo de datos:**

```
Usuario hace acción → Código trackea evento → Se guarda en Firestore → Panel Admin lee
```

### **2. ¿Qué eventos se trackean automáticamente?**

#### **Eventos que se registran automáticamente:**

1. **`page_view`** (Visualizaciones de página)
   - **Cuándo:** Cada vez que alguien visita una página
   - **Dónde se trackea:**
     - `LobbyPage.jsx` - Cuando cargas el lobby
     - `ChatPage.jsx` - Cuando entras a una sala
     - Cualquier página que use `trackPageView()`

2. **`user_register`** (Registros)
   - **Cuándo:** Cuando un usuario se registra
   - **Dónde se trackea:** `AuthContext.jsx` - función `register()`

3. **`user_login`** (Logins)
   - **Cuándo:** Cuando un usuario inicia sesión
   - **Dónde se trackea:** `AuthContext.jsx` - función `login()`

4. **`message_sent`** (Mensajes enviados)
   - **Cuándo:** Cada vez que se envía un mensaje en chat
   - **Dónde se trackea:** `ChatPage.jsx` - función `handleSendMessage()`

5. **`room_joined`** (Entrada a salas)
   - **Cuándo:** Cuando un usuario entra a una sala de chat
   - **Dónde se trackea:** `ChatPage.jsx` - useEffect cuando cambia `roomId`

6. **`page_exit`** (Salidas de página)
   - **Cuándo:** Cuando un usuario sale de una página
   - **Dónde se trackea:** `LobbyPage.jsx` - cleanup del useEffect

### **3. ¿Dónde se guarda la información?**

#### **Colección en Firestore: `analytics_stats`**

Estructura:
```
analytics_stats/
  └── 2025-12-11/          ← ID del documento = fecha (YYYY-MM-DD)
      ├── date: "2025-12-11"
      ├── pageViews: 150    ← Contador de visualizaciones
      ├── registrations: 5  ← Contador de registros
      ├── logins: 20        ← Contador de logins
      ├── messagesSent: 500 ← Contador de mensajes
      ├── roomsCreated: 2
      ├── roomsJoined: 30
      ├── pageExits: 80
      ├── lastPagePath: "/chat/room123"
      ├── lastExitPage: "/"
      └── lastUpdated: Timestamp
```

**IMPORTANTE:**
- ✅ **1 documento por día** (no miles de eventos)
- ✅ Se actualiza en tiempo real con `increment()`
- ✅ Se crea automáticamente cuando alguien visita una página

### **4. ¿Cómo se calculan las estadísticas?**

#### **Estadísticas del día actual:**
- Lee directamente `analytics_stats/2025-12-11`
- Muestra los contadores en tiempo real

#### **Funcionalidades más usadas (últimos 7 días):**
1. Lee 7 documentos: `analytics_stats/2025-12-11`, `2025-12-10`, ... `2025-12-05`
2. Suma todos los contadores de cada tipo de evento
3. Ordena de mayor a menor

#### **Páginas de abandono:**
1. Lee los últimos 7 días
2. Cuenta cuántas veces se salió de cada página (`lastExitPage`)
3. Ordena por cantidad de salidas

---

## ❌ POR QUÉ ESTÁN FALLANDO LOS ERRORES

### **Error 1: "Missing or insufficient permissions" en tickets**

**Causa:**
Las reglas de Firestore en Firebase Console **NO están actualizadas**. 

**Regla actual en código:**
```javascript
match /tickets/{ticketId} {
  allow read: if isAdmin() || 
                (isAuthenticated() && resource.data.userId == request.auth.uid);
}
```

**Problema:**
- Las reglas en Firebase Console probablemente tienen la regla por defecto que deniega todo
- Necesitas subir las reglas actualizadas

### **Error 2: "Missing or insufficient permissions" en analytics_stats**

**Causa:**
Mismo problema - las reglas no están actualizadas en Firebase Console.

**Regla actual en código:**
```javascript
match /analytics_stats/{dateId} {
  allow write: if isAuthenticated();  // Cualquiera puede escribir
  allow read: if isAdmin();            // Solo admins pueden leer
}
```

**Problema:**
- Si las reglas no están actualizadas, la regla por defecto (`allow read, write: if false`) bloquea todo

---

## ✅ SOLUCIÓN

### **PASO 1: Subir reglas a Firebase Console**

1. **Abre Firebase Console:**
   ```
   https://console.firebase.google.com/project/chat-gay-3016f/firestore/rules
   ```

2. **Copia TODO el contenido de `firestore.rules`**

3. **Pega en Firebase Console** (reemplaza todo lo que hay)

4. **Click en "Publicar"**

5. **Espera 1-2 minutos** para que se propaguen las reglas

### **PASO 2: Verificar que eres admin**

Asegúrate de que tu usuario tenga el campo `role: "admin"` en Firestore:

1. Ve a: `users/{tu-uid}`
2. Verifica que exista: `role: "admin"` (string)
3. Si no existe, agrégalo

### **PASO 3: Recargar la página**

Después de publicar las reglas, recarga el panel admin.

---

## 📊 RESUMEN: DE DÓNDE VIENE LA INFORMACIÓN

| Métrica | Fuente | Cómo se genera |
|---------|--------|----------------|
| Visualizaciones | `trackPageView()` en páginas | Cada vez que alguien visita una página |
| Registros | `trackUserRegister()` en `AuthContext` | Cuando alguien se registra |
| Logins | `trackUserLogin()` en `AuthContext` | Cuando alguien inicia sesión |
| Mensajes | `trackMessageSent()` en `ChatPage` | Cada vez que se envía un mensaje |
| Salas unidas | `trackRoomJoined()` en `ChatPage` | Cuando alguien entra a una sala |
| Salidas | `trackPageExit()` en páginas | Cuando alguien sale de una página |

**TODA la información viene de eventos que tu aplicación trackea internamente.**

---

## 🔧 VERIFICACIÓN

### **Después de subir las reglas:**

1. **Visita una página** (ej: `/lobby`)
   - Debería crear automáticamente `analytics_stats/2025-12-11`
   - Verifica en Firebase Console → Firestore → `analytics_stats`

2. **Ve al panel admin** (`/admin`)
   - Deberías ver las estadísticas sin errores
   - Los tickets deberían cargarse

3. **Crea un ticket desde el perfil**
   - Debería aparecer en el panel admin

---

**Última actualización:** 2025-12-11

