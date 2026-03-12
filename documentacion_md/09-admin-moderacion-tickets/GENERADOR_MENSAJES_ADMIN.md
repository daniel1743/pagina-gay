# 🎭 GENERADOR DE MENSAJES PARA ADMINISTRADORES

**Fecha:** 2025-01-27  
**Ubicación:** Panel de Administración → Pestaña "Generador"

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 1. **Selector de Sala**
- Dropdown con todas las salas disponibles
- Permite elegir en qué sala enviar el mensaje
- Incluye: Chat Principal, Más de 30, Santiago, Gaming, España, Brasil, México, Argentina

### 2. **Selector de Username**
- Dropdown con ~30 nombres comunes predefinidos
- Opción para escribir como tú mismo (tu username de admin)
- Al seleccionar un username, se genera automáticamente un avatar único

### 3. **Generación Automática de Avatar**
- Cada username tiene un avatar único generado con DiceBear
- El avatar se genera basado en el nombre del usuario
- Se muestra un preview del avatar antes de enviar

### 4. **Dos Pestañas de Escritura**

#### **Pestaña "Escritura"**
- Para escribir mensajes normales (saludos, búsquedas, etc.)
- Campo de texto grande para escribir
- Botón "Enviar Mensaje"

#### **Pestaña "Respuesta"**
- Para responder a conversaciones existentes
- Campo de texto grande para escribir respuestas
- Botón "Enviar Respuesta"

### 5. **Respuestas Rápidas**
- 6 categorías de respuestas rápidas:
  - **Saludos:** "Hola, cómo estás?", "Hola, qué buscas?", etc.
  - **Búsquedas:** "Verga y tú?", "Busco activo", "Busco pasivo", etc.
  - **Respuestas:** "También, bueno yo doy verga", "Yo busco activo", etc.
  - **Explícito:** "Soy activo, me mide 22cm", "Busco culo rico", etc.
  - **Ubicaciones:** "Santiago centro", "Providencia", "Maipú", etc.
  - **Scort:** "Hola, soy scort", "Me mide 22cm, soy activo", etc.
- Click en cualquier respuesta rápida para insertarla en el campo de texto

---

## 🎯 CÓMO USAR

### Paso 1: Seleccionar Sala
1. Abre el dropdown "Sala de Chat"
2. Selecciona la sala donde quieres enviar el mensaje (ej: "Chat Principal")

### Paso 2: Seleccionar Username
1. Abre el dropdown "Username"
2. Elige:
   - **Tu username** (para escribir como tú mismo)
   - **Cualquier nombre de la lista** (para escribir como otro usuario ficticio)

### Paso 3: Escribir Mensaje
1. Selecciona la pestaña "Escritura" o "Respuesta"
2. Escribe tu mensaje en el campo de texto
3. O haz click en una respuesta rápida para insertarla

### Paso 4: Enviar
1. Click en "Enviar Mensaje" o "Enviar Respuesta"
2. El mensaje aparecerá inmediatamente en la sala seleccionada

---

## 🔧 DETALLES TÉCNICOS

### Generación de Usuarios Ficticios
- Cuando seleccionas un username que no es el tuyo, se genera un `userId` único con formato: `bot_admin_{username}_{timestamp}`
- Este formato pasa las reglas de Firestore para mensajes de bot
- El `senderUid` siempre es tu ID de admin (requerido por las reglas)

### Cuando Escribes como Tú Mismo
- Si seleccionas tu propio username, se usa tu `userId` real
- El mensaje aparece como si lo hubieras escrito normalmente
- Útil para mantener conversaciones consistentes

### Trazabilidad
- Todos los mensajes generados incluyen un `trace` con:
  - `origin: 'ADMIN'`
  - `source: 'MESSAGE_GENERATOR'`
  - `actorType: 'ADMIN'` o `'ADMIN_GENERATED'`
  - `adminId` y `adminUsername` para auditoría

---

## 📋 LISTA DE USERNAMES PREDEFINIDOS

```
Carlos28, Miguel25, Javier30, Andrés27, Luis24,
Roberto29, Diego26, Fernando31, Sergio23, Pablo28,
Ricardo25, Mario32, Alejandro27, Gonzalo24, Héctor29,
Cristian26, Eduardo30, Felipe25, Daniel28, Sebastián27,
Juan26, Pedro29, Manuel24, José30, Antonio28,
Francisco27, Rodrigo25, Gabriel26, Nicolás29, Matías24
```

---

## ⚠️ IMPORTANTE

### Reglas de Firestore
- Los mensajes de usuarios ficticios usan el prefijo `bot_admin_*` para pasar las reglas
- El `senderUid` siempre debe ser tu ID de admin
- Las reglas ya permiten `bot_*`, así que `bot_admin_*` funciona automáticamente

### Limitaciones
- No puedes editar mensajes después de enviarlos
- Los mensajes aparecen inmediatamente en la sala
- Los usuarios ficticios no tienen perfil completo (solo username y avatar)

---

## 🎨 INTERFAZ

### Preview de Usuario
- Muestra el avatar generado
- Muestra el username seleccionado
- Indica si es "Tu cuenta" o "Usuario ficticio"

### Respuestas Rápidas
- Organizadas por categorías
- Badges clickeables
- Se insertan en el campo de texto activo (Escritura o Respuesta)

---

## 📝 EJEMPLOS DE USO

### Ejemplo 1: Crear Conversación Inicial
1. Selecciona "Chat Principal"
2. Selecciona "Carlos28"
3. Pestaña "Escritura"
4. Escribe: "Hola, cómo están?"
5. Enviar

### Ejemplo 2: Responder como Otro Usuario
1. Selecciona "Chat Principal"
2. Selecciona "Miguel25"
3. Pestaña "Respuesta"
4. Escribe: "Hola, todo bien! Y tú?"
5. Enviar

### Ejemplo 3: Usar Respuestas Rápidas
1. Selecciona sala y username
2. Click en "Hola, qué buscas?" (respuesta rápida)
3. El texto se inserta automáticamente
4. Puedes agregar más texto si quieres
5. Enviar

---

## ✅ VERIFICACIÓN

Después de enviar un mensaje:
- ✅ Deberías ver un toast de confirmación
- ✅ El mensaje aparece inmediatamente en la sala seleccionada
- ✅ El mensaje tiene el avatar y username correctos
- ✅ En Firestore, el mensaje tiene el `trace` con información del admin

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Funcional y listo para usar

