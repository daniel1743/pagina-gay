# 🎭 SISTEMA DE CONVERSACIONES GRUPALES COHERENTES

## ✅ ARCHIVO CREADO: `src/services/botGroupConversation.js`

Sistema donde **3 bots mantienen una conversación lógica, coherente y amistosa** sobre temas específicos.

---

## 🌟 CARACTERÍSTICAS:

### 1. **Conversaciones Realistas**
- ✅ 3 bots hablan entre sí como amigos reales
- ✅ Siguen un hilo coherente sobre un tema
- ✅ Turnos naturales (no todos hablan al mismo tiempo)
- ✅ Respuestas que reaccionan a lo que dicen los otros bots
- ✅ Opiniones diferentes pero respetuosas
- ✅ Emojis y jerga gay latina natural

### 2. **8 Conversaciones Pre-Programadas**
1. **Salir del Closet** (12 mensajes) - Apoyo emocional y consejos
2. **Primera Cita** (12 mensajes) - Tips de moda y conversación
3. **Gym y Cuerpo** (12 mensajes) - Body positivity y motivación
4. **Familia y Aceptación** (12 mensajes) - Dolor y esperanza
5. **Apps de Ligue** (12 mensajes) - Frustración y optimismo
6. **Marcha del Orgullo** (12 mensajes) - Emoción e inclusión
7. **Series LGBT+** (12 mensajes) - Debate amistoso
8. **Viajes Gay-Friendly** (12 mensajes) - Recomendaciones

### 3. **Sistema de Roles**
Cada conversación tiene 2-3 roles que representan personalidades:
- `starter` - Inicia el tema
- `supporter` - Apoya emocionalmente
- `advisor` - Da consejos prácticos
- `fashionista` - Experto en estilo
- `experienced` - Voz de experiencia
- `bodypositive` - Promueve aceptación corporal
- `gymrat` - Fitness enthusiast
- `insecure` - Vulnerable y sincero
- `empathetic` - Empático y comprensivo
- `resilient` - Fuerte y motivador
- `frustrated` - Expresando frustración
- `realistic` - Pragmático
- `optimistic` - Positivo y esperanzado

### 4. **Timing Natural**
- ⏱️ Delay entre mensajes: 4-8 segundos (aleatorio)
- ⏱️ Primera conversación: 30 segundos después de iniciar
- ⏱️ Conversaciones periódicas: cada 10-15 minutos
- ⏱️ No se superponen conversaciones

---

## 📋 CÓMO INTEGRAR:

### **PASO 1: Importar en el Coordinador de Bots**

**Archivo:** `src/services/botCoordinator.js`

```javascript
// Agregar al inicio del archivo junto a otros imports
import {
  schedulePeriodicGroupConversations,
  stopPeriodicGroupConversations
} from './botGroupConversation';
```

### **PASO 2: Activar Conversaciones Grupales al Iniciar Sala**

Buscar la función donde se inician los bots en una sala (probablemente `initializeBotsForRoom` o similar):

```javascript
export const initializeBotsForRoom = async (roomId) => {
  // ... código existente para iniciar bots normales

  // AGREGAR ESTO:
  // Iniciar conversaciones grupales periódicas
  schedulePeriodicGroupConversations(roomId);

  console.log(`✅ Sala ${roomId} inicializada con bots y conversaciones grupales`);
};
```

### **PASO 3: Detener al Salir de la Sala**

Buscar donde se limpian los bots al salir:

```javascript
export const cleanupBotsForRoom = (roomId) => {
  // ... código existente

  // AGREGAR ESTO:
  // Detener conversaciones grupales
  stopPeriodicGroupConversations(roomId);

  console.log(`🧹 Limpieza completa de ${roomId}`);
};
```

### **PASO 4: Iniciar Conversación Manual (Opcional)**

Si quieres poder iniciar conversaciones grupales manualmente:

```javascript
import { startGroupConversation } from './botGroupConversation';

// En algún evento o botón
const handleStartGroupChat = async () => {
  await startGroupConversation(currentRoomId);
};
```

---

## 🎬 EJEMPLO DE CONVERSACIÓN GENERADA:

```
[09:15] Danielito: Chicos, estoy pensando en salir del closet
                   con mis papás este finde... qué nervios 😰

[09:19] PasivoLoco: Uy amigo, es un paso grande pero te va a
                    liberar tanto mrc 💕

[09:24] Verón: Yo ya pasé por eso kajaja, mi consejo es que
              elijas un momento tranquilo donde puedan hablar
              sin interrupciones

[09:28] Danielito: Sí, pensé hacerlo el domingo en la tarde...
                   pero me da pánico su reacción 😭

[09:33] PasivoLoco: Es normal tener miedo po, pero recuerda
                    que es TU verdad y mereces vivirla
                    auténticamente 🌈

[09:37] Verón: Exacto! Y si la reacción inicial es mala,
              dale tiempo... muchos padres necesitan
              procesarlo kajaja

... (continúa hasta completar la conversación)
```

---

## 🎯 VENTAJAS DEL SISTEMA:

### **Para la Experiencia del Usuario:**
✅ El chat nunca se ve vacío o muerto
✅ Conversaciones auténticas que generan comunidad
✅ Los usuarios reales pueden unirse a las conversaciones
✅ Se ve como un chat activo con gente real
✅ Temas relevantes para la comunidad LGBT+

### **Para Retención:**
✅ Los usuarios se quedan más tiempo viendo las conversas
✅ Se sienten parte de una comunidad activa
✅ Aprenden de las experiencias compartidas
✅ Se identifican con las situaciones

### **Técnicas:**
✅ No bloquea el hilo principal (async)
✅ Sistema de roles flexible
✅ Fácil agregar nuevas conversaciones
✅ Control de timing y frecuencia
✅ Auto-limpieza cuando termina

---

## 🔧 PERSONALIZACIÓN:

### **Agregar Nueva Conversación:**

```javascript
// En GROUP_CONVERSATIONS array
{
  topic: "Tu Tema Aquí",
  conversation: [
    {
      role: "starter",
      message: "Primer mensaje del tema..."
    },
    {
      role: "responder",
      message: "Respuesta lógica al mensaje anterior..."
    },
    {
      role: "advisor",
      message: "Consejo relacionado con el tema..."
    },
    // ... agregar 9-12 mensajes totales
  ]
}
```

### **Cambiar Frecuencia:**

```javascript
// En schedulePeriodicGroupConversations
const intervalId = setInterval(() => {
  if (!activeGroupConversations.has(roomId)) {
    startGroupConversation(roomId);
  }
}, 900000); // 15 minutos (900000 ms)
```

### **Cambiar Delay entre Mensajes:**

```javascript
// En sendNextGroupMessage
const delay = Math.random() * 3000 + 5000; // 5-8 segundos
```

---

## 📊 FLUJO DE EJECUCIÓN:

```
1. Usuario entra a sala
   ↓
2. initializeBotsForRoom(roomId)
   ↓
3. schedulePeriodicGroupConversations(roomId)
   ↓
4. Espera 30 segundos
   ↓
5. startGroupConversation(roomId)
   ↓
6. Selecciona conversación aleatoria
   ↓
7. Asigna 3 bots aleatorios a roles
   ↓
8. Envía mensajes con delay 4-8 seg
   ↓
9. Termina conversación (12 mensajes)
   ↓
10. Espera 10-15 minutos
    ↓
11. Vuelve al paso 5 (loop infinito)
```

---

## ⚠️ CONSIDERACIONES:

### **Evitar Saturación:**
- Solo 1 conversación grupal activa por sala simultáneamente
- Verificación para no duplicar conversaciones
- Delay aleatorio para naturalidad

### **Combinar con Sistema Existente:**
- Las conversaciones grupales NO interfieren con:
  - Respuestas a usuarios reales
  - Conversaciones 1-1 de bots
  - Mensajes de bienvenida

### **Memoria y Performance:**
- Sistema limpio: se auto-limpia al terminar
- Map() para manejo eficiente de estados
- setTimeout() en lugar de setInterval() para mensajes

---

## 🚀 RESULTADO ESPERADO:

**ANTES:**
```
[08:00] (sala vacía o con pocos mensajes esporádicos)
[08:15] Bot1: Hola
[08:45] (silencio)
```

**DESPUÉS:**
```
[08:00] Danielito: Chicos, estoy pensando en salir del closet...
[08:04] PasivoLoco: Uy amigo, es un paso grande pero te va a...
[08:09] Verón: Yo ya pasé por eso kajaja, mi consejo es que...
[08:13] Danielito: Sí, pensé hacerlo el domingo en la tarde...
[08:17] PasivoLoco: Es normal tener miedo po, pero recuerda...
[08:22] Verón: Exacto! Y si la reacción inicial es mala...
... (conversación fluida y continua)
```

---

## 💡 PRÓXIMOS PASOS RECOMENDADOS:

1. ✅ Integrar en botCoordinator.js (Pasos 1-3)
2. ⏳ Probar en ambiente de desarrollo
3. ⏳ Agregar más conversaciones (objetivo: 20+ temas)
4. ⏳ Permitir que usuarios reales se unan a conversaciones grupales
5. ⏳ Sistema de notificaciones cuando hay conversación activa

---

¿Quieres que cree más conversaciones o que integre directamente en botCoordinator.js?
