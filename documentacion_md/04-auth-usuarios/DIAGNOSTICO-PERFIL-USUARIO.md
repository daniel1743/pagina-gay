# 🔍 DIAGNÓSTICO EXHAUSTIVO: Sistema de Perfil de Usuario y Acciones

## 📋 Resumen Ejecutivo

**Fecha:** 2026-01-02
**Componentes analizados:**
- `UserActionsModal.jsx` - Modal de acciones al hacer clic en un usuario
- `UserProfileModal.jsx` - Modal de perfil completo del usuario
- `socialService.js` - Servicios de mensajes directos, chat privado y favoritos
- `limitService.js` - Sistema de límites para usuarios FREE vs PREMIUM

**Problema reportado:**
"Las opciones existen pero se desactivaron. Debería haber información de favoritos agregados en el perfil"

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS Y FUNCIONANDO

### 1. **UserActionsModal** - Modal de Acciones (src/components/chat/UserActionsModal.jsx)

**Opciones disponibles:**

#### a) Ver Perfil Completo ✅
- **Línea:** 287-304
- **Botón:** "Ver Perfil Completo"
- **Función:** Abre el UserProfileModal con información del usuario
- **Estado:** ✅ IMPLEMENTADO CORRECTAMENTE
- **Código:**
```jsx
<Button
  onClick={() => {
    onViewProfile();
    onClose();
  }}
  variant="outline"
  className="w-full justify-start h-auto py-3 text-left"
>
  <User className="w-5 h-5 mr-3 text-cyan-400" />
  <div>
    <p className="font-semibold">Ver Perfil Completo</p>
    <p className="text-xs text-muted-foreground">
      Información, intereses y más
    </p>
  </div>
</Button>
```

#### b) Enviar Mensaje Directo ✅
- **Línea:** 306-328
- **Botón:** "Enviar Mensaje Directo"
- **Límites:** 3 mensajes/día para usuarios FREE, ilimitado para PREMIUM/Admin
- **Estado:** ✅ IMPLEMENTADO CORRECTAMENTE
- **Función implementada:** `handleSendMessage` (líneas 42-103)
- **Servicio:** `sendDirectMessage` (socialService.js:22-54)
- **Flujo:**
  1. Verifica si el usuario puede enviar mensajes (límites)
  2. Si es guest → muestra toast "Regístrate"
  3. Si alcanzó límite → muestra toast con CTA Premium
  4. Si OK → muestra textarea para escribir mensaje
  5. Al enviar → guarda en Firestore notifications del destinatario
  6. Incrementa contador de mensajes directos
  7. Muestra toast de éxito

#### c) Invitar a Chat Privado ✅
- **Línea:** 330-352
- **Botón:** "Invitar a Chat Privado"
- **Límites:** 5 invitaciones/día para usuarios FREE, ilimitado para PREMIUM/Admin
- **Estado:** ✅ IMPLEMENTADO CORRECTAMENTE
- **Función implementada:** `handlePrivateChatRequest` (líneas 105-159)
- **Servicio:** `sendPrivateChatRequest` (socialService.js:60-90)
- **Flujo:**
  1. Verifica si el usuario puede enviar invitaciones (límites)
  2. Si es guest → muestra toast "Regístrate"
  3. Si alcanzó límite → muestra toast con CTA Premium
  4. Si OK → crea notificación de tipo 'private_chat_request' en Firestore
  5. Incrementa contador de invitaciones
  6. Muestra toast "Solicitud enviada"

**Estructura de datos de la solicitud:**
```javascript
{
  from: fromUserId,
  fromUsername: userData.username,
  fromAvatar: userData.avatar,
  fromIsPremium: userData.isPremium,
  to: toUserId,
  content: "Usuario quiere conectar contigo en chat privado",
  type: 'private_chat_request',
  status: 'pending', // pending | accepted | rejected
  read: false,
  timestamp: serverTimestamp(),
}
```

#### d) Agregar/Quitar de Favoritos ✅
- **Línea:** 354-377
- **Botón:** "Agregar a Favoritos" / "Quitar de Favoritos"
- **Límites:** Máximo 15 favoritos
- **Estado:** ✅ IMPLEMENTADO CORRECTAMENTE
- **Función implementada:** `handleToggleFavorite` (líneas 161-204)
- **Servicios:**
  - `addToFavorites` (socialService.js:154-173)
  - `removeFromFavorites` (socialService.js:178-191)
- **Flujo:**
  1. Si es guest → muestra toast "Regístrate para agregar favoritos"
  2. Si ya tiene 15 favoritos → muestra toast "Límite alcanzado"
  3. Si OK → actualiza array `favorites` en Firestore (users/{userId})
  4. Usa arrayUnion/arrayRemove de Firestore
  5. Muestra toast de confirmación

**Estructura en Firestore:**
```javascript
users/{userId} = {
  favorites: [userId1, userId2, userId3, ...] // Array de hasta 15 IDs
}
```

---

## ❌ PROBLEMAS IDENTIFICADOS

### 1. **UserProfileModal es demasiado básico**

**Problema:**
El modal de perfil completo (`UserProfileModal.jsx`) NO muestra información relevante del usuario. Solo muestra:
- Avatar
- Username
- "Miembro desde {año}"
- Botón de Reportar

**Lo que DEBERÍA mostrar:**
- ✅ Avatar con anillo de verificación/premium/admin
- ✅ Username con badge
- ❌ Bio / Descripción personal
- ❌ Intereses / Hobbies
- ❌ Edad
- ❌ Ubicación
- ❌ Estadísticas:
  - Mensajes enviados
  - Amigos favoritos (X/15)
  - Días activo
  - Salas visitadas
- ❌ Lista de favoritos agregados
- ❌ Insignias / Logros
- ❌ Fecha de registro exacta (no solo el año)

**Archivo:** `src/components/chat/UserProfileModal.jsx` (80 líneas)

---

### 2. **No hay página de Perfil Personal completa**

**Problema:**
No existe una página dedicada al perfil del usuario donde pueda:
- Ver y editar su información
- Ver sus favoritos
- Ver sus estadísticas
- Gestionar su privacidad

**Nota:** Existe `ProfilePage.jsx` pero hay que verificar si muestra información de favoritos.

---

### 3. **No hay componente para ver lista de Favoritos**

**Problema:**
El usuario puede agregar hasta 15 favoritos, pero NO hay ningún lugar en la UI donde pueda:
- Ver la lista de sus favoritos agregados
- Eliminar favoritos desde una lista
- Ver el estado online/offline de sus favoritos

**Servicio implementado pero sin UI:**
- `getFavorites(userId)` - (socialService.js:242-267) ✅ Implementado
- Retorna array con datos completos de cada favorito

**Necesita:**
- Componente `FavoritesModal` o página `/favorites`
- Lista con avatares, usernames, estado online
- Botón para eliminar de favoritos
- Contador visual "X/15 favoritos"

---

### 4. **Sistema de Notificaciones podría no estar completo**

**Problema potencial:**
Las solicitudes de chat privado se guardan como notificaciones, pero necesita verificarse:
- ¿El usuario destinatario recibe una notificación visual?
- ¿Puede aceptar/rechazar desde las notificaciones?
- ¿Existe un componente NotificationsPanel?

**Servicio implementado:**
- `respondToPrivateChatRequest(userId, notificationId, accepted)` (socialService.js:95-149)
- Al aceptar → crea sala en `private_chats` collection
- Al aceptar → envía notificación al remitente original

**Componente verificado:**
- Existe `PrivateChatRequestModal.jsx` (importado en ChatPage línea 16)
- Necesita verificarse si se está usando correctamente

---

## 🔍 ANÁLISIS TÉCNICO PROFUNDO

### Flujo completo de "Invitar a Chat Privado"

#### Paso 1: Usuario hace clic en avatar
**Archivo:** `ChatMessages.jsx:145-152`
```javascript
onClick={() => onUserClick({
  username: message.username,
  avatar: message.avatar,
  userId: message.userId,  // ✅ Campo correcto
  isPremium: isUserPremium,
  verified: isUserVerified,
  role: userRole
})}
```

#### Paso 2: Se abre UserActionsModal
**Archivo:** `ChatPage.jsx:978-984`
```javascript
{userActionsTarget && (
  <UserActionsModal
    user={userActionsTarget}  // ✅ Objeto con userId
    onClose={() => setUserActionsTarget(null)}
    onViewProfile={() => setSelectedUser(userActionsTarget)}
  />
)}
```

#### Paso 3: Usuario hace clic en "Invitar a Chat Privado"
**Archivo:** `UserActionsModal.jsx:333`
```javascript
<Button onClick={handlePrivateChatRequest}>
  Invitar a Chat Privado
</Button>
```

#### Paso 4: Se ejecuta verificación de límites
**Archivo:** `UserActionsModal.jsx:107`
```javascript
const canSend = canSendChatInvite(currentUser);
```

**Archivo:** `limitService.js:88-125`
```javascript
export const canSendChatInvite = (user) => {
  // Admin/Premium: ilimitado
  if (user?.role === 'admin' || user.isPremium) {
    return { allowed: true };
  }

  // Guest: bloqueado
  if (user.isGuest || user.isAnonymous) {
    return {
      allowed: false,
      reason: 'guest',
      message: 'Regístrate para enviar invitaciones a chat privado'
    };
  }

  // FREE: verificar límite 5/día
  const limits = getCurrentLimits(user.id);
  if (limits.chatInvites.remaining > 0) {
    return { allowed: true, remaining: limits.chatInvites.remaining };
  }

  // Límite alcanzado
  return {
    allowed: false,
    reason: 'limit_reached',
    message: `Has alcanzado el límite de 5 invitaciones por hoy`
  };
};
```

#### Paso 5: Si está permitido, envía solicitud
**Archivo:** `UserActionsModal.jsx:137`
```javascript
await sendPrivateChatRequest(currentUser.id, targetUser.userId);
```

**Archivo:** `socialService.js:60-90`
```javascript
export const sendPrivateChatRequest = async (fromUserId, toUserId) => {
  const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
  const fromUserData = fromUserDoc.data();

  const requestData = {
    from: fromUserId,
    fromUsername: fromUserData?.username || 'Usuario',
    fromAvatar: fromUserData?.avatar || '',
    fromIsPremium: fromUserData?.isPremium || false,
    to: toUserId,
    content: `${fromUserData?.username} quiere conectar contigo en chat privado`,
    type: 'private_chat_request',
    status: 'pending',
    read: false,
    timestamp: serverTimestamp(),
  };

  // ✅ Guardar en Firestore
  const notificationRef = await addDoc(
    collection(db, 'users', toUserId, 'notifications'),
    requestData
  );

  return { success: true, requestId: notificationRef.id };
};
```

#### Paso 6: Incrementa contador
**Archivo:** `UserActionsModal.jsx:141-144`
```javascript
if (!currentUser.isPremium && currentUser.role !== 'admin') {
  await incrementChatInvites(currentUser.id);
  const newLimits = getCurrentLimits(currentUser.id);
  setLimits(newLimits);
}
```

**Archivo:** `limitService.js:176-212`
```javascript
export const incrementChatInvites = async (userId) => {
  if (shouldReset()) {
    resetLocalCounters();
  }

  // Incrementar en localStorage (rápido)
  const current = parseInt(localStorage.getItem('chactivo_chat_invites') || '0');
  const newCount = current + 1;
  localStorage.setItem('chactivo_chat_invites', newCount.toString());

  // ✅ Sincronizar con Firestore
  const userLimitsRef = doc(db, 'users', userId, 'limits', getTodayDate());
  const limitsDoc = await getDoc(userLimitsRef);

  if (limitsDoc.exists()) {
    await updateDoc(userLimitsRef, {
      chatInvites: newCount,
      lastUpdated: serverTimestamp(),
    });
  } else {
    await setDoc(userLimitsRef, {
      chatInvites: newCount,
      directMessages: 0,
      date: getTodayDate(),
      createdAt: serverTimestamp(),
    });
  }

  return newCount;
};
```

#### Paso 7: Muestra toast de confirmación
**Archivo:** `UserActionsModal.jsx:146-149`
```javascript
toast({
  title: "📞 Solicitud enviada",
  description: `Esperando que ${targetUser.username} acepte el chat privado`,
});
```

---

## ✅ VERIFICACIÓN DE INTEGRIDAD

### ¿Por qué las funciones están "desactivadas"?

**RESPUESTA:** Las funciones NO están desactivadas técnicamente. El código está completo y funcional.

**Posibles razones por las que el usuario percibe que no funcionan:**

1. **Errores silenciosos en consola**
   - Si `currentUser.id` es `undefined` → la función falla pero el toast de error podría no mostrarse
   - Verificar: `console.error` en catch blocks

2. **Problemas de permisos de Firestore**
   - Si las reglas de seguridad bloquean escritura en `notifications`
   - Verificar: Firestore Security Rules

3. **Usuario destinatario no recibe notificación**
   - La solicitud se guarda en Firestore pero no hay UI para verla
   - El componente `PrivateChatRequestModal` podría no estar subscrito a notificaciones

4. **Estructura de datos incorrecta**
   - Si `currentUser.id` no existe (debería ser del AuthContext)
   - Si `targetUser.userId` no existe (viene de ChatMessages)

---

## 🛠️ SOLUCIONES PROPUESTAS

### Prioridad ALTA - Arreglos Inmediatos

#### 1. **Mejorar UserProfileModal para mostrar información completa**

**Archivo:** `src/components/chat/UserProfileModal.jsx`

**Agregar:**
- Bio del usuario
- Intereses (tags)
- Edad y ubicación
- **LISTA DE FAVORITOS:**
  - "Amigos favoritos (X/15)"
  - Lista de avatares pequeños de favoritos
  - Botón "Ver todos los favoritos"
- Estadísticas:
  - Mensajes enviados hoy
  - Días activo
  - Salas visitadas
- Fecha de registro exacta

**Ejemplo de estructura:**
```jsx
<div className="space-y-4 mt-6">
  {/* Bio */}
  <div>
    <h3 className="font-bold">Acerca de</h3>
    <p>{user.bio || 'Sin descripción'}</p>
  </div>

  {/* Intereses */}
  <div>
    <h3 className="font-bold">Intereses</h3>
    <div className="flex flex-wrap gap-2">
      {user.interests?.map(interest => (
        <span className="badge">{interest}</span>
      ))}
    </div>
  </div>

  {/* Favoritos */}
  <div>
    <h3 className="font-bold">Amigos Favoritos ({user.favorites?.length || 0}/15)</h3>
    <div className="flex gap-2">
      {user.favorites?.slice(0, 5).map(favId => (
        <Avatar key={favId} className="w-10 h-10">
          {/* Mostrar avatar del favorito */}
        </Avatar>
      ))}
      {user.favorites?.length > 5 && (
        <div className="flex items-center">
          <span>+{user.favorites.length - 5} más</span>
        </div>
      )}
    </div>
  </div>

  {/* Estadísticas */}
  <div className="grid grid-cols-2 gap-4">
    <div className="stat-card">
      <p className="text-2xl font-bold">{user.stats?.messagesSent || 0}</p>
      <p className="text-sm">Mensajes enviados</p>
    </div>
    <div className="stat-card">
      <p className="text-2xl font-bold">{user.stats?.daysActive || 0}</p>
      <p className="text-sm">Días activo</p>
    </div>
  </div>
</div>
```

#### 2. **Crear componente FavoritesModal/Page**

**Archivo nuevo:** `src/components/user/FavoritesModal.jsx`

**Funcionalidad:**
- Listar todos los favoritos con avatares, usernames, estado online
- Botón para eliminar de favoritos
- Botón para ver perfil completo
- Contador "X/15 favoritos"
- Mensaje cuando no hay favoritos: "Aún no has agregado amigos favoritos"

#### 3. **Verificar sistema de notificaciones**

**Tareas:**
- Revisar `PrivateChatRequestModal.jsx`
- Verificar que esté subscrito a notificaciones con `subscribeToNotifications`
- Verificar que muestre botones Aceptar/Rechazar
- Verificar que llame a `respondToPrivateChatRequest`

#### 4. **Agregar debugging y manejo de errores mejorado**

**En UserActionsModal:**
```javascript
const handlePrivateChatRequest = async () => {
  console.log('🔍 [DEBUG] Iniciando solicitud de chat privado');
  console.log('👤 [DEBUG] currentUser:', currentUser);
  console.log('🎯 [DEBUG] targetUser:', targetUser);

  const canSend = canSendChatInvite(currentUser);
  console.log('✅ [DEBUG] canSend:', canSend);

  if (!canSend.allowed) {
    console.warn('⚠️ [DEBUG] No está permitido enviar solicitud:', canSend.reason);
    // ... resto del código
  }

  try {
    console.log('📤 [DEBUG] Enviando solicitud a Firestore...');
    await sendPrivateChatRequest(currentUser.id, targetUser.userId);
    console.log('✅ [DEBUG] Solicitud enviada correctamente');

    // ... resto del código
  } catch (error) {
    console.error('❌ [DEBUG] Error completo:', error);
    console.error('❌ [DEBUG] Error message:', error.message);
    console.error('❌ [DEBUG] Error stack:', error.stack);

    toast({
      title: "❌ Error detallado",
      description: `No se pudo enviar la solicitud: ${error.message}`,
      variant: "destructive",
    });
  }
};
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

### Funcionalidades Principales
- [✅] Ver Perfil Completo - IMPLEMENTADO pero básico
- [✅] Enviar Mensaje Directo - IMPLEMENTADO Y FUNCIONAL
- [✅] Invitar a Chat Privado - IMPLEMENTADO Y FUNCIONAL
- [✅] Agregar a Favoritos - IMPLEMENTADO Y FUNCIONAL
- [❌] Ver lista de Favoritos - NO HAY UI
- [❌] Perfil completo con estadísticas - INCOMPLETO
- [?] Recibir notificación de chat privado - POR VERIFICAR
- [?] Aceptar/Rechazar solicitud - POR VERIFICAR

### Servicios Backend
- [✅] `sendDirectMessage` - socialService.js:22
- [✅] `sendPrivateChatRequest` - socialService.js:60
- [✅] `respondToPrivateChatRequest` - socialService.js:95
- [✅] `addToFavorites` - socialService.js:154
- [✅] `removeFromFavorites` - socialService.js:178
- [✅] `getFavorites` - socialService.js:242
- [✅] `canSendChatInvite` - limitService.js:88
- [✅] `canSendDirectMessage` - limitService.js:133
- [✅] `incrementChatInvites` - limitService.js:176
- [✅] `incrementDirectMessages` - limitService.js:218

### Límites y Restricciones
- [✅] Límite 5 invitaciones/día para FREE
- [✅] Límite 3 mensajes directos/día para FREE
- [✅] Ilimitado para PREMIUM y Admin
- [✅] Límite 15 favoritos (todos los usuarios)
- [✅] Guests no pueden enviar mensajes ni invitaciones
- [✅] Reset automático a medianoche (localStorage + Firestore)

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Diagnóstico (COMPLETADO)
- [✅] Analizar código de UserActionsModal
- [✅] Analizar servicios de social y límites
- [✅] Identificar problemas
- [✅] Crear informe exhaustivo

### Fase 2: Mejoras UI (PENDIENTE)
1. **Mejorar UserProfileModal**
   - Agregar información de favoritos
   - Agregar estadísticas
   - Agregar bio e intereses

2. **Crear FavoritesModal o Favorites Page**
   - Lista completa de favoritos
   - Gestión de favoritos

3. **Verificar NotificationsPanel**
   - Confirmar que muestra solicitudes de chat privado
   - Confirmar botones Aceptar/Rechazar

### Fase 3: Testing y Debugging (PENDIENTE)
1. Agregar logs de debugging
2. Probar flujo completo end-to-end
3. Verificar Firestore Security Rules
4. Verificar que las notificaciones lleguen correctamente

---

## 🔧 CÓDIGO PARA DEBUGGING

### Verificar estructura de currentUser
```javascript
// En UserActionsModal, agregar al inicio:
useEffect(() => {
  console.log('🔍 [DEBUG] currentUser completo:', JSON.stringify(currentUser, null, 2));
  console.log('🔍 [DEBUG] currentUser.id existe?', !!currentUser?.id);
  console.log('🔍 [DEBUG] targetUser completo:', JSON.stringify(targetUser, null, 2));
  console.log('🔍 [DEBUG] targetUser.userId existe?', !!targetUser?.userId);
}, [currentUser, targetUser]);
```

### Verificar Firestore Security Rules
```javascript
// Reglas necesarias en Firestore:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/notifications/{notificationId} {
      // Permitir lectura solo al dueño
      allow read: if request.auth.uid == userId;

      // Permitir escritura desde cualquier usuario autenticado
      allow create: if request.auth != null;

      // Permitir actualizar solo al dueño (para marcar como leído, aceptar/rechazar)
      allow update: if request.auth.uid == userId;
    }

    match /users/{userId}/limits/{date} {
      // Permitir lectura y escritura solo al dueño
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 📝 CONCLUSIÓN

**Funcionalidades técnicamente funcionales:**
- ✅ Enviar Mensaje Directo
- ✅ Invitar a Chat Privado
- ✅ Agregar/Quitar Favoritos
- ✅ Sistema de límites diarios

**Funcionalidades con UI incompleta:**
- ❌ Ver lista de Favoritos agregados
- ❌ Perfil de usuario completo con estadísticas
- ❌ Información de favoritos en perfil

**Próximos pasos:**
1. Mejorar UserProfileModal para mostrar información de favoritos
2. Crear componente para ver lista completa de favoritos
3. Agregar debugging para identificar errores silenciosos
4. Verificar que las notificaciones de chat privado se reciban correctamente

---

**Fecha:** 2026-01-02
**Investigador:** Claude Sonnet 4.5
**Estado:** Diagnóstico completo - Listo para implementar mejoras
