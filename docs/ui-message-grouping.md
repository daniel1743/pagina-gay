# Agrupación de Mensajes (Message Grouping)

## Problema

En el chat, cuando un usuario envía múltiples mensajes consecutivos, la UI renderiza el avatar y nombre del usuario en cada mensaje. Esto consume demasiado espacio vertical y empeora la experiencia de usuario, alejándose del estilo tipo WhatsApp/Telegram donde los mensajes consecutivos del mismo usuario se agrupan visualmente.

**Ejemplo del problema:**
- Usuario "Danin" envía 2 mensajes seguidos
- Resultado: Aparecen 2 avatares y 2 nombres repetidos
- Problema: Desperdicio de espacio vertical, experiencia poco intuitiva

## Solución Implementada

Se implementó un sistema de agrupación de mensajes (`message grouping`) que:

1. **Agrupa mensajes consecutivos del mismo usuario** cuando:
   - El `userId` es el mismo que el mensaje anterior
   - La diferencia de tiempo entre mensajes es ≤ 2 minutos (120 segundos)

2. **Renderiza los grupos de forma optimizada**:
   - Muestra el avatar UNA sola vez por grupo (en el primer mensaje)
   - Muestra el nombre UNA sola vez por grupo (en el primer mensaje, solo si NO es propio)
   - Renderiza los mensajes del grupo como burbujas separadas debajo del avatar/nombre
   - Los mensajes del grupo se muestran verticalmente con espaciado (`space-y-1`)

3. **Mantiene funcionalidad existente**:
   - Mensajes de sistema (`system`) y moderador (`system_moderator`) no se agrupan (siempre individuales)
   - Reacciones, reply, click en usuario, etc. funcionan por mensaje individual
   - Todas las props existentes se mantienen intactas

## Archivos Modificados

- **`src/components/chat/ChatMessages.jsx`**:
  - Función `groupMessages(messages)`: Agrupa mensajes consecutivos del mismo usuario
  - Modificación del render: Cambia de `messages.map()` a `messageGroups.map()` con lógica de agrupación
  - Avatar y nombre se muestran solo una vez por grupo

## Detalles Técnicos

### Función `groupMessages`

```javascript
const groupMessages = (messages) => {
  // Agrupa mensajes consecutivos del mismo userId
  // Threshold: 2 minutos (120,000 ms)
  // Mensajes de sistema/moderador: siempre individuales
  // Retorna array de grupos: [{ groupId, userId, username, avatar, messages: [...] }, ...]
}
```

### Reglas de Agrupación

1. **Agrupar si:**
   - `prevMessage.userId === currentMessage.userId`
   - `timeDiff <= 2 minutos` (120,000 ms)
   - Ambos mensajes NO son de sistema/moderador

2. **NO agrupar si:**
   - Mensaje es de sistema (`userId === 'system'`)
   - Mensaje es de moderador (`userId === 'system_moderator'`)
   - Cambia el `userId` entre mensajes
   - Diferencia de tiempo > 2 minutos

### Estructura de Grupo

```javascript
{
  groupId: "group_<messageId>", // ID único del grupo
  userId: "...", // userId del usuario
  username: "...", // nombre del usuario
  avatar: "...", // URL del avatar
  isPremium: boolean, // estado premium
  messages: [msg1, msg2, msg3], // array de mensajes consecutivos
  isSystem: false,
  isModerator: false
}
```

## Resultado Esperado

### Antes (sin agrupación)
```
[Avatar] Danin
         Mensaje 1

[Avatar] Danin  
         Mensaje 2

[Avatar] Danin
         Mensaje 3
```

### Después (con agrupación)
```
[Avatar] Danin
         Mensaje 1
         Mensaje 2
         Mensaje 3
```

**Beneficios:**
- ✅ Menos espacio vertical ocupado
- ✅ Experiencia más limpia y tipo WhatsApp/Telegram
- ✅ Mejor legibilidad cuando un usuario envía múltiples mensajes
- ✅ Si otro usuario responde entre medio, se corta el grupo y empieza otro

## Cómo Probar

### Prueba Manual (Pasos)

1. **Abrir el chat en dos navegadores/pestañas diferentes**
   - Navegador 1: Usuario A
   - Navegador 2: Usuario B

2. **Usuario A envía 3+ mensajes consecutivos rápidamente**
   - Ejemplo: "Hola", "¿Cómo estás?", "Todo bien?"
   - **Resultado esperado**: 
     - Se ve 1 avatar
     - Se ve 1 nombre ("Usuario A")
     - Se ven 3 mensajes debajo

3. **Usuario B envía 1 mensaje entre medio**
   - Ejemplo: "Hola también!"
   - **Resultado esperado**:
     - Se corta el grupo de Usuario A
     - Aparece nuevo grupo con avatar/nombre de Usuario B
     - Si Usuario A envía más mensajes después, forman un nuevo grupo

4. **Usuario A envía mensajes con más de 2 minutos de diferencia**
   - Mensaje 1 (hora: 10:00)
   - Esperar 3 minutos
   - Mensaje 2 (hora: 10:03)
   - **Resultado esperado**: 
     - Se forman 2 grupos separados (diferencia > 2 min)

5. **Verificar mensajes de sistema/moderador**
   - Los mensajes de sistema/moderador NO se agrupan
   - Cada uno aparece individualmente con su formato especial

### Casos de Prueba Adicionales

- ✅ Reacciones (like/dislike) funcionan por mensaje individual
- ✅ Reply funciona por mensaje individual
- ✅ Click en usuario abre perfil correctamente
- ✅ Scroll y auto-scroll funcionan normalmente
- ✅ Divider "Mensajes nuevos" aparece correctamente
- ✅ Timestamps se muestran correctamente

