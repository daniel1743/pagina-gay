# 🧪 GUÍA DE PRUEBAS - CHACTIVO

## ✅ ESTADO ACTUAL

### Servidor de Desarrollo
- ✅ Corriendo en: `http://localhost:3002/`
- ✅ Todos los archivos compilados correctamente
- ✅ Sin errores de sintaxis

### Código Implementado
- ✅ UserActionsModal.jsx - Modal con 4 acciones sociales
- ✅ socialService.js - Backend para mensajes, solicitudes y favoritos
- ✅ NotificationBell.jsx - Campanita con contador de notificaciones
- ✅ NotificationsPanel.jsx - Panel con mensajes y solicitudes
- ✅ ChatSidebar.jsx - Sidebar permanente en desktop
- ✅ Microinteracciones en ChatInput y ChatMessages

---

## 🔥 PASO 1: APLICAR REGLAS DE FIRESTORE (CRÍTICO)

**Sin este paso, NADA funcionará. Debes hacerlo AHORA.**

1. **Abrir Firebase Console:**
   - Ve a: https://console.firebase.google.com/
   - Selecciona tu proyecto: **chat-gay-3016f**

2. **Navegar a Firestore Database:**
   - Click en "Firestore Database" en el menú lateral izquierdo

3. **Ir a la pestaña "Reglas" (Rules):**
   - En la parte superior verás pestañas: Datos, Reglas, Índices
   - Click en "**Reglas**"

4. **Reemplazar TODO el contenido:**
   - Borra todo lo que esté ahí
   - Copia las líneas **15 a 139** del archivo `FIRESTORE_RULES.txt`
   - Pega en el editor de Firebase Console

5. **Publicar:**
   - Click en el botón "**Publicar**" (Publish)
   - Espera confirmación de que las reglas se aplicaron

6. **Verificar:**
   - Deberías ver un mensaje verde: "Tus reglas se publicaron correctamente"

**⚠️ IMPORTANTE:** Sin este paso, verás errores de "Missing or insufficient permissions" y NADA funcionará.

---

## 🧪 PASO 2: PRUEBAS LOCALES

### A. Preparación

1. **Abrir la aplicación:**
   - Ve a: `http://localhost:3002/`

2. **Crear dos usuarios de prueba:**
   - **Usuario 1:** Usa Chrome normal
     - Email: `test1@test.com`
     - Password: `test123456`
     - Username: `TestUser1`

   - **Usuario 2:** Usa Chrome en modo incógnito (o Firefox)
     - Email: `test2@test.com`
     - Password: `test123456`
     - Username: `TestUser2`

### B. Prueba 1: Sidebar Permanente en Desktop

**Objetivo:** Verificar que el sidebar de salas está siempre visible en desktop

**Pasos:**
1. Con pantalla en modo desktop (> 1024px de ancho)
2. Entra a cualquier sala de chat
3. **Verificar:**
   - ✅ El sidebar debe estar visible en el lado izquierdo
   - ✅ No debería desaparecer al entrar a una sala
   - ✅ Debe mostrar las 11 salas con íconos de colores
   - ✅ Debe mostrar "X usuarios conectados" en cada sala
   - ✅ La sala activa debe tener un borde azul a la izquierda

**Resultado esperado:** Sidebar siempre visible, puedes cambiar de sala sin volver atrás.

---

### C. Prueba 2: UserActionsModal al Hacer Click en Nombre

**Objetivo:** Verificar que se abre el modal de acciones al hacer click en un nombre de usuario

**Pasos:**
1. Con **Usuario 1** envía un mensaje en cualquier sala
2. Con **Usuario 2** haz click en el nombre de usuario o avatar de Usuario 1
3. **Verificar:**
   - ✅ Se abre un modal con el perfil de Usuario 1
   - ✅ Aparecen 4 botones:
     - 🔵 Ver Perfil Completo
     - 🟢 Enviar Mensaje Directo
     - 🟣 Invitar a Chat Privado
     - 💖 Agregar a Favoritos

**Resultado esperado:** Modal se abre correctamente con las 4 opciones.

---

### D. Prueba 3: Enviar Mensaje Directo

**Objetivo:** Verificar que se pueden enviar mensajes directos sin abrir chat

**Pasos:**
1. Con **Usuario 2**, abre el UserActionsModal de Usuario 1
2. Click en "**Enviar Mensaje Directo**"
3. **Verificar:**
   - ✅ Aparece un textarea para escribir
   - ✅ Contador de caracteres: "0/500"
   - ✅ Botones: Cancelar y Enviar Mensaje

4. Escribe: "Hola, ¿cómo estás?"
5. Click en "**Enviar Mensaje**"
6. **Verificar:**
   - ✅ Aparece toast: "✉️ Mensaje enviado"
   - ✅ El modal se cierra automáticamente

**Resultado esperado:** Mensaje enviado correctamente, modal cerrado.

---

### E. Prueba 4: Recibir Notificación de Mensaje Directo

**Objetivo:** Verificar que las notificaciones llegan en tiempo real

**Pasos:**
1. Con **Usuario 1** (quien recibió el mensaje), mira la campanita en el header
2. **Verificar:**
   - ✅ La campanita tiene un badge rojo con el número "1"
   - ✅ Hay una animación de pulso alrededor de la campanita

3. Click en la campanita
4. **Verificar:**
   - ✅ Se abre un panel desde la esquina superior derecha
   - ✅ El panel dice "Notificaciones" en el header
   - ✅ Aparece la notificación con:
     - Ícono de mensaje verde
     - Texto: "Mensaje de TestUser2"
     - Contenido: "Hola, ¿cómo estás?"
     - Tiempo: "hace un momento"

**Resultado esperado:** Notificación aparece en tiempo real con todos los detalles.

---

### F. Prueba 5: Enviar Solicitud de Chat Privado

**Objetivo:** Verificar que se pueden enviar solicitudes de chat privado

**Pasos:**
1. Con **Usuario 2**, abre el UserActionsModal de Usuario 1
2. Click en "**Invitar a Chat Privado**"
3. **Verificar:**
   - ✅ Aparece toast: "📞 Solicitud enviada"
   - ✅ Dice: "Esperando que TestUser1 acepte el chat privado"
   - ✅ El modal se cierra

**Resultado esperado:** Solicitud enviada correctamente.

---

### G. Prueba 6: Recibir y Responder Solicitud de Chat Privado

**Objetivo:** Verificar que se pueden aceptar/rechazar solicitudes

**Pasos:**
1. Con **Usuario 1**, mira la campanita
2. **Verificar:**
   - ✅ Badge ahora dice "2" (1 mensaje + 1 solicitud)

3. Click en la campanita
4. **Verificar:**
   - ✅ Aparece una notificación con:
     - Avatar de TestUser2
     - Ícono de video morado
     - Texto: "TestUser2 quiere conectar en chat privado"
     - **Dos botones:**
       - ❌ Rechazar (rojo)
       - ✅ Aceptar (gradiente magenta)

5. Click en "**Aceptar**"
6. **Verificar:**
   - ✅ Aparece toast: "✅ Chat privado aceptado"
   - ✅ Dice: "Ahora estás conectado con TestUser2"
   - ✅ La notificación cambia a: "Aceptada - Chat activo"
   - ✅ Los botones desaparecen

**Resultado esperado:** Solicitud aceptada, estado actualizado correctamente.

---

### H. Prueba 7: Sistema de Favoritos

**Objetivo:** Verificar que se pueden agregar/quitar favoritos (máximo 15)

**Pasos:**
1. Con **Usuario 1**, abre el UserActionsModal de Usuario 2
2. Click en "**Agregar a Favoritos**"
3. **Verificar:**
   - ✅ Aparece toast: "💖 Agregado a favoritos"
   - ✅ El botón cambia a "Quitar de Favoritos"
   - ✅ El ícono de corazón se rellena de rosa
   - ✅ El botón tiene borde rosa

4. Cierra y vuelve a abrir el modal
5. **Verificar:**
   - ✅ El botón sigue mostrando "Quitar de Favoritos" (persistencia)

6. Click en "**Quitar de Favoritos**"
7. **Verificar:**
   - ✅ Aparece toast: "💔 Eliminado de favoritos"
   - ✅ El botón vuelve a "Agregar a Favoritos"

**Resultado esperado:** Favoritos funcionan con persistencia correcta.

---

### I. Prueba 8: Límite de 15 Favoritos

**Objetivo:** Verificar que no se pueden agregar más de 15 favoritos

**Pasos:**
1. Necesitarías crear 16 usuarios diferentes
2. Agregar 15 a favoritos
3. Intentar agregar el 16to
4. **Verificar:**
   - ✅ Aparece toast: "Límite alcanzado"
   - ✅ Dice: "Solo puedes tener hasta 15 amigos favoritos"
   - ✅ No se agrega el favorito

**Resultado esperado:** Límite de 15 respetado.

---

### J. Prueba 9: Microinteracciones en Chat

**Objetivo:** Verificar animaciones de velocidad al enviar mensajes

**Pasos:**
1. Con **Usuario 1** en una sala de chat
2. Escribe un mensaje
3. Click en Enviar
4. **Verificar:**
   - ✅ El input se limpia INMEDIATAMENTE (antes de que llegue la respuesta)
   - ✅ El botón de enviar rota 360° mientras envía
   - ✅ Aparece efecto de shimmer en el botón
   - ✅ Si estás en móvil, sientes vibración sutil

**Resultado esperado:** Sensación de velocidad instantánea.

---

### K. Prueba 10: Hover Effects en Mensajes

**Objetivo:** Verificar animaciones al pasar el mouse sobre mensajes

**Pasos:**
1. En cualquier sala con mensajes
2. Pasa el mouse sobre un mensaje de otro usuario
3. **Verificar:**
   - ✅ El mensaje tiene un borde cyan que aparece suavemente
   - ✅ El mensaje hace zoom sutil (scale 1.01)

4. Pasa el mouse sobre un avatar
5. **Verificar:**
   - ✅ El avatar hace zoom (scale 1.1)
   - ✅ El avatar se mueve ligeramente (wiggle)

**Resultado esperado:** Animaciones suaves y modernas.

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error: "Missing or insufficient permissions"

**Causa:** No aplicaste las reglas de Firestore

**Solución:**
1. Ve al PASO 1 de esta guía
2. Aplica las reglas en Firebase Console
3. Recarga la página

---

### Error: La campanita no aparece

**Causa:** Estás usando un usuario invitado/anónimo

**Solución:**
- Las notificaciones solo funcionan para usuarios registrados
- Regístrate con email y contraseña

---

### Error: No llegan las notificaciones

**Causa:** Firestore rules no incluyen permisos para subcollections

**Solución:**
1. Verifica que copiaste TODO el contenido de FIRESTORE_RULES.txt
2. Las reglas deben incluir:
   ```
   match /users/{userId}/notifications/{notificationId} {
     allow read: if request.auth != null && request.auth.uid == userId;
     allow create: if request.auth != null;
   }
   ```

---

### Error: Los favoritos no persisten

**Causa:** El campo `favorites` no existe en el documento del usuario

**Solución:**
- Agrega al menos un favorito
- El campo se creará automáticamente
- Firestore usará `arrayUnion` para inicializarlo

---

### Error: El sidebar no se ve en desktop

**Causa:** Pantalla muy pequeña (< 1024px)

**Solución:**
- Aumenta el ancho de la ventana del navegador
- El sidebar es permanente solo en pantallas `lg:` (>= 1024px)
- En móvil/tablet usa el botón de menú hamburguesa

---

## 📊 CHECKLIST FINAL ANTES DE DEPLOY

### Funcionalidad
- [ ] Sidebar permanente funciona en desktop
- [ ] UserActionsModal abre al hacer click en nombres
- [ ] Se pueden enviar mensajes directos
- [ ] Notificaciones llegan en tiempo real
- [ ] Badge de campanita muestra conteo correcto
- [ ] Solicitudes de chat privado se envían
- [ ] Solicitudes se pueden aceptar/rechazar
- [ ] Sistema de favoritos funciona (agregar/quitar)
- [ ] Límite de 15 favoritos se respeta
- [ ] Microinteracciones funcionan (input, botón)
- [ ] Hover effects en mensajes

### Firestore
- [ ] Reglas de seguridad aplicadas
- [ ] Colección `users` con subcollección `notifications`
- [ ] Colección `private_chats` se crea al aceptar
- [ ] Favoritos se guardan en campo `favorites` (array)

### UI/UX
- [ ] Modales no se desbordan en desktop
- [ ] Sidebar visible en desktop, overlay en móvil
- [ ] Animaciones suaves sin lag
- [ ] Toasts informativos aparecen en cada acción
- [ ] Colores consistentes con el tema

### Performance
- [ ] Listeners se desuscriben al desmontar componentes
- [ ] No hay memory leaks
- [ ] Real-time updates funcionan sin refresh manual

---

## 🚀 LISTO PARA PRODUCCIÓN

Si **TODAS** las pruebas pasan:

1. **Deploy a Vercel:**
   ```bash
   npm run build
   git add .
   git commit -m "Sistema social completo con notificaciones"
   git push
   ```

2. **Verificar en producción:**
   - Repite las pruebas principales en la URL de Vercel
   - Verifica que las reglas de Firestore están aplicadas en producción

3. **Monitoreo:**
   - Ve a Firebase Console → Firestore → Reglas
   - Mira la pestaña "Uso" para ver las operaciones
   - Revisa errores en "Authentication" y "Firestore Database"

---

## 💡 PRÓXIMOS PASOS (OPCIONAL)

1. **Abrir ventana de chat privado automáticamente:**
   - Cuando se acepta una solicitud, abrir `PrivateChatWindow`
   - Usar el `chatId` devuelto por `respondToPrivateChatRequest`

2. **Notificaciones push:**
   - Firebase Cloud Messaging
   - Notificaciones de navegador cuando llega mensaje

3. **Ver historial de mensajes enviados:**
   - Leer de `users/{userId}/sent_messages`
   - Mostrar en sección "Mensajes enviados"

4. **Lista de favoritos:**
   - Crear componente `FavoritesList`
   - Usar `getFavorites()` de socialService
   - Mostrar grid de avatares con acceso rápido

---

## 🎉 ¡ÉXITO!

Si todas las pruebas pasan, tu sistema social está **100% funcional**.

**Características implementadas:**
- ✅ Mensajes directos sin abrir chat
- ✅ Solicitudes de chat privado con aceptar/rechazar
- ✅ Sistema de favoritos (máx 15)
- ✅ Notificaciones en tiempo real
- ✅ Badge con contador
- ✅ Panel de notificaciones animado
- ✅ Sidebar permanente en desktop
- ✅ Microinteracciones de velocidad
- ✅ Hover effects modernos

**¡Felicitaciones! 🎊**
