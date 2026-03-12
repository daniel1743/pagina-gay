# 📱 Chat Demo - Documentación Completa de Backup y Recuperación

## 🎯 Propósito

Este documento sirve como **backup completo** de todo lo implementado en el componente `ChatDemo` (ventana de demostración del chat en la landing page). En caso de pérdida de código o cambios accidentales, este documento permite recuperar toda la funcionalidad.

---

## 📋 Índice

1. [Resumen de Implementación](#resumen-de-implementación)
2. [Estructura del Componente](#estructura-del-componente)
3. [Mensajes del Chat](#mensajes-del-chat)
4. [Sistema de Emojis Flotantes](#sistema-de-emojis-flotantes)
5. [Perfiles Individuales](#perfiles-individuales)
6. [Sistema de Grupos](#sistema-de-grupos)
7. [Burbujas de Chat Privado](#burbujas-de-chat-privado)
8. [Velocidades y Timing](#velocidades-y-timing)
9. [Lógica de Re-implementación](#lógica-de-re-implementación)
10. [Código Completo](#código-completo)

---

## 📝 Resumen de Implementación

### Características Principales

1. **Chat de Demostración Interactivo**
   - Mensajes que aparecen alternados (izquierda/derecha)
   - Contenido directo/morboso
   - Animaciones rápidas y fluidas

2. **Sistema de Emojis Flotantes**
   - Emojis que salen desde abajo y suben desapareciendo (estilo TikTok/Instagram)
   - 9 tipos de emojis diferentes
   - Animación swing con rotación

3. **Perfiles Individuales**
   - Aparecen en los lados (izquierda/derecha)
   - Se mueven y flotan
   - Desaparecen cuando se unen a grupos

4. **Sistema de Grupos**
   - 3-5 perfiles se juntan
   - Los perfiles individuales desaparecen
   - Se encapsulan en una burbuja de grupo

5. **Burbujas de Chat Privado**
   - 2 personas se unen para chatear
   - Burbujas flotantes con animación

6. **Velocidad Optimizada**
   - Todo ocurre muy rápido para crear sensación de actividad
   - Intervalos cortos entre eventos
   - Animaciones rápidas

---

## 🏗️ Estructura del Componente

### Ubicación del Archivo
```
src/components/landing/ChatDemo.jsx
```

### Dependencias
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, ThumbsUp, Users, UserPlus, Sparkles } from 'lucide-react';
```

### Estados del Componente
```javascript
const [visibleMessages, setVisibleMessages] = useState([]);        // Mensajes visibles
const [reactions, setReactions] = useState([]);                    // Reacciones (no usado actualmente)
const [privateChatBubbles, setPrivateChatBubbles] = useState([]);  // Burbujas de chat privado
const [groupBubbles, setGroupBubbles] = useState([]);              // Burbujas de grupos
const [floatingEmojis, setFloatingEmojis] = useState([]);          // Emojis flotantes
const [individualProfiles, setIndividualProfiles] = useState([]); // Perfiles individuales
```

### Refs para IDs Únicos
```javascript
const messageIndexRef = useRef(0);      // Índice del mensaje actual
const reactionIdRef = useRef(0);        // ID para reacciones
const profileIdRef = useRef(0);         // ID para perfiles
const emojiIdRef = useRef(0);           // ID para emojis
```

---

## 💬 Mensajes del Chat

### Array de Mensajes

```javascript
const messages = [
  { id: 1, user: 'Alex', text: 'Quiero coger 🔥', color: 'text-cyan-400', avatar: '👤', isOwn: false },
  { id: 2, user: 'Bruno', text: 'Tu perfil está que arde 😈', color: 'text-purple-400', avatar: '👤', isOwn: true },
  { id: 3, user: 'Dani', text: '¿Dónde estás? Estoy caliente 🥵', color: 'text-pink-400', avatar: '👤', isOwn: false },
  { id: 4, user: 'Lucas', text: '¡Qué rico! Quedemos esta noche 😏', color: 'text-green-400', avatar: '👤', isOwn: true },
  { id: 5, user: 'Mati', text: 'Hagamos algo ya 🔥💦', color: 'text-yellow-400', avatar: '👤', isOwn: false },
  { id: 6, user: 'Carlos', text: 'Estoy solo y caliente 😈', color: 'text-blue-400', avatar: '👤', isOwn: true },
  { id: 7, user: 'Pedro', text: 'Tu culo está delicioso 🍑🔥', color: 'text-red-400', avatar: '👤', isOwn: false },
  { id: 8, user: 'Juan', text: 'Vamos a follar esta noche 💦', color: 'text-indigo-400', avatar: '👤', isOwn: true },
  { id: 9, user: 'Sergio', text: 'Estoy duro y listo 😏', color: 'text-orange-400', avatar: '👤', isOwn: false },
  { id: 10, user: 'Miguel', text: 'Quiero chuparte todo 🍆💦', color: 'text-teal-400', avatar: '👤', isOwn: true },
];
```

### Propiedades de Cada Mensaje

- **id**: Identificador único
- **user**: Nombre del usuario
- **text**: Contenido del mensaje (directo/morboso)
- **color**: Clase de color de Tailwind para el nombre
- **avatar**: Emoji del avatar (actualmente todos son 👤)
- **isOwn**: `true` = mensaje propio (derecha), `false` = mensaje de otro (izquierda)

### Lógica de Mensajes

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    setVisibleMessages((prev) => {
      const next = [...prev, { ...messages[messageIndexRef.current], timestamp: Date.now() }];
      if (next.length > 5) next.shift(); // Máximo 5 mensajes visibles
      messageIndexRef.current = (messageIndexRef.current + 1) % messages.length;
      return next;
    });
  }, 1200); // Cada 1.2 segundos

  return () => clearInterval(interval);
}, []);
```

**Características:**
- Aparece un nuevo mensaje cada **1.2 segundos**
- Máximo **5 mensajes** visibles simultáneamente
- Los mensajes antiguos se eliminan automáticamente
- Se agrega `timestamp` para identificación única

---

## 🎨 Sistema de Emojis Flotantes

### Array de Emojis Disponibles

```javascript
const emojiReactions = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😈', name: 'devil' },
  { emoji: '💦', name: 'droplet' },
  { emoji: '🍆', name: 'eggplant' },
  { emoji: '🍑', name: 'peach' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '🥵', name: 'hot' },
];
```

### Lógica de Generación

```javascript
useEffect(() => {
  const emojiInterval = setInterval(() => {
    if (visibleMessages.length > 0 && Math.random() > 0.2) { // 80% probabilidad
      const randomMessage = visibleMessages[Math.floor(Math.random() * visibleMessages.length)];
      const emojiCount = Math.floor(Math.random() * 4) + 3; // 3-6 emojis
      
      const newEmojis = [];
      for (let i = 0; i < emojiCount; i++) {
        const randomEmoji = emojiReactions[Math.floor(Math.random() * emojiReactions.length)];
        newEmojis.push({
          id: emojiIdRef.current++,
          messageId: randomMessage.id,
          emoji: randomEmoji.emoji,
          x: (Math.random() * 60 + 20) + '%', // Posición horizontal 20-80%
          startY: '100%', // Empiezan desde abajo
          delay: i * 100, // Delay escalonado (0ms, 100ms, 200ms...)
          timestamp: Date.now(),
        });
      }
      setFloatingEmojis((prev) => [...prev, ...newEmojis].slice(-40)); // Máximo 40 emojis
    }
  }, 1500); // Cada 1.5 segundos

  return () => clearInterval(emojiInterval);
}, [visibleMessages]);
```

### Animación de Emojis

```javascript
<motion.div
  key={emoji.id}
  initial={{ 
    opacity: 0, 
    scale: 0,
    y: 0,
    x: 0,
  }}
  animate={{ 
    opacity: [0, 1, 1, 0],           // Aparecen y desaparecen
    scale: [0, 1.4, 1.2, 0.9],       // Crece y se reduce
    y: -140,                          // Suben 140px
    x: (Math.random() - 0.5) * 80,   // Movimiento horizontal aleatorio
    rotate: [0, 20, -20, 0],        // Rotación tipo swing
  }}
  exit={{ opacity: 0 }}
  transition={{
    duration: 2.2,                    // Duración total
    delay: emoji.delay / 1000,        // Delay escalonado
    ease: [0.16, 1, 0.3, 1],          // Ease out cubic (suave)
  }}
  className="absolute bottom-0 text-2xl"
  style={{ 
    left: emoji.x,
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  }}
>
  {emoji.emoji}
</motion.div>
```

**Características:**
- **Frecuencia**: Cada 1.5 segundos (80% probabilidad)
- **Cantidad**: 3-6 emojis por reacción
- **Animación**: Suben desde abajo, rotan, se mueven horizontalmente
- **Duración**: 2.2 segundos
- **Tamaño**: `text-2xl` (grande y visible)
- **Sombra**: Drop shadow para mejor visibilidad

### Limpieza de Emojis

```javascript
useEffect(() => {
  const emojiCleanup = setInterval(() => {
    setFloatingEmojis((prev) => prev.filter((e) => Date.now() - e.timestamp < 2500));
  }, 800);
  return () => clearInterval(emojiCleanup);
}, []);
```

---

## 👤 Perfiles Individuales

### Lógica de Generación

```javascript
useEffect(() => {
  const profileInterval = setInterval(() => {
    if (Math.random() > 0.3) { // 70% probabilidad
      const names = ['Juan', 'Pedro', 'Alex', 'Bruno', 'Dani', 'Lucas', 'Mati', 'Carlos', 'Sergio', 'Miguel'];
      const side = Math.random() > 0.5 ? 'left' : 'right';
      
      setIndividualProfiles((prev) => [
        ...prev,
        {
          id: profileIdRef.current++,
          name: names[Math.floor(Math.random() * names.length)],
          side,
          x: side === 'left' ? Math.random() * 20 + 5 : Math.random() * 20 + 75,
          y: Math.random() * 70 + 15,
          timestamp: Date.now(),
        },
      ].slice(-10)); // Máximo 10 perfiles
    }
  }, 1500); // Cada 1.5 segundos

  return () => clearInterval(profileInterval);
}, []);
```

### Estructura del Perfil

```javascript
{
  id: profileIdRef.current++,
  name: 'Juan',                    // Nombre aleatorio
  side: 'left' | 'right',          // Lado de la pantalla
  x: 10,                           // Posición X en porcentaje
  y: 30,                           // Posición Y en porcentaje
  timestamp: Date.now(),           // Para limpieza
}
```

### Animación de Perfiles

```javascript
<motion.div
  key={profile.id}
  initial={{ opacity: 0, scale: 0, x: profile.side === 'left' ? -50 : 50 }}
  animate={{ 
    opacity: 1, 
    scale: 1,
    x: 0,
    y: 0,
  }}
  exit={{ 
    opacity: 0, 
    scale: 0,
    x: profile.side === 'left' ? -50 : 50,
  }}
  transition={{ duration: 0.4, type: 'spring' }}
  className="absolute z-30 pointer-events-none"
  style={{ left: `${profile.x}%`, top: `${profile.y}%` }}
>
  <motion.div
    animate={{ 
      y: [0, -5, 0],                // Flotación vertical
      rotate: [0, 2, -2, 0],        // Rotación suave
    }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="bg-gradient-to-br from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border border-white/20 flex items-center gap-2"
  >
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
      {profile.name[0]}
    </div>
    <span className="text-xs font-bold text-white">{profile.name}</span>
  </motion.div>
</motion.div>
```

**Características:**
- **Frecuencia**: Cada 1.5 segundos (70% probabilidad)
- **Posición**: Lados izquierdo/derecho aleatorios
- **Animación**: Flotación continua y rotación suave
- **Máximo**: 10 perfiles simultáneos

---

## 👥 Sistema de Grupos

### Lógica de Formación de Grupos

```javascript
useEffect(() => {
  const groupInterval = setInterval(() => {
    if (Math.random() > 0.5 && individualProfiles.length >= 3) { // 50% probabilidad, mínimo 3 perfiles
      // Tomar 3-5 perfiles aleatorios
      const profilesToGroup = individualProfiles
        .slice()
        .sort(() => Math.random() - 0.5)  // Mezclar aleatoriamente
        .slice(0, Math.min(5, Math.floor(Math.random() * 3) + 3)); // 3-5 perfiles

      if (profilesToGroup.length >= 3) {
        const names = profilesToGroup.map(p => p.name).join(', ');
        const avgX = profilesToGroup.reduce((sum, p) => sum + p.x, 0) / profilesToGroup.length;
        const avgY = profilesToGroup.reduce((sum, p) => sum + p.y, 0) / profilesToGroup.length;

        // ⚡ CRÍTICO: Eliminar perfiles individuales
        setIndividualProfiles((prev) => 
          prev.filter(p => !profilesToGroup.some(gp => gp.id === p.id))
        );

        // Crear burbuja de grupo
        setGroupBubbles((prev) => [
          ...prev,
          {
            id: Date.now(),
            names,
            count: profilesToGroup.length,
            x: avgX,
            y: avgY,
            timestamp: Date.now(),
          },
        ].slice(-4)); // Máximo 4 grupos
      }
    }
  }, 3000); // Cada 3 segundos

  return () => clearInterval(groupInterval);
}, [individualProfiles]);
```

### Estructura del Grupo

```javascript
{
  id: Date.now(),
  names: 'Juan, Pedro, Alex',     // Nombres separados por comas
  count: 5,                        // Cantidad de personas
  x: 45,                           // Posición X promedio
  y: 50,                           // Posición Y promedio
  timestamp: Date.now(),           // Para limpieza
}
```

### Animación del Grupo

```javascript
<motion.div
  key={group.id}
  initial={{ opacity: 0, scale: 0, x: group.x + '%', y: group.y + '%' }}
  animate={{
    opacity: [0, 1, 1],
    scale: [0, 1.2, 1],            // Aparece con escala mayor y luego se normaliza
    x: group.x + '%',
    y: group.y + '%',
  }}
  exit={{ opacity: 0, scale: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
  className="absolute z-40 pointer-events-none"
  style={{ left: `${group.x}%`, top: `${group.y}%` }}
>
  <motion.div
    animate={{ 
      rotate: [0, 5, -5, 0],        // Rotación continua
      scale: [1, 1.05, 1],          // Pulso suave
    }}
    transition={{ duration: 2, repeat: Infinity }}
    className="bg-gradient-to-br from-pink-500/95 to-purple-500/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-2xl border-2 border-yellow-400/60 flex items-center gap-2"
  >
    <motion.div
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      <Users className="w-5 h-5 text-white" />
    </motion.div>
    <div className="flex flex-col">
      <span className="text-xs font-bold text-white">
        {group.count === 5 
          ? 'Cinco personas han creado un grupo'
          : `${group.names} han creado un grupo`}
      </span>
    </div>
    <motion.div
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    >
      <Sparkles className="w-4 h-4 text-yellow-300" />
    </motion.div>
  </motion.div>
</motion.div>
```

**Características:**
- **Frecuencia**: Cada 3 segundos (50% probabilidad)
- **Requisito**: Mínimo 3 perfiles individuales disponibles
- **Tamaño**: 3-5 personas por grupo
- **Efecto**: Los perfiles individuales **desaparecen** y se encapsulan en el grupo
- **Mensaje**: "Cinco personas han creado un grupo" o "Juan, Pedro, Alex han creado un grupo"

### Limpieza de Grupos

```javascript
useEffect(() => {
  const groupCleanup = setInterval(() => {
    setGroupBubbles((prev) => prev.filter((g) => Date.now() - g.timestamp < 5000));
  }, 1500);
  return () => clearInterval(groupCleanup);
}, []);
```

---

## 💬 Burbujas de Chat Privado

### Lógica de Generación

```javascript
useEffect(() => {
  const privateChatInterval = setInterval(() => {
    if (Math.random() > 0.4) { // 60% probabilidad
      const users = ['Juan', 'Pedro', 'Alex', 'Bruno', 'Dani', 'Lucas', 'Mati', 'Carlos'];
      const user1 = users[Math.floor(Math.random() * users.length)];
      let user2 = users[Math.floor(Math.random() * users.length)];
      while (user2 === user1) {
        user2 = users[Math.floor(Math.random() * users.length)];
      }

      setPrivateChatBubbles((prev) => [
        ...prev,
        {
          id: Date.now(),
          user1,
          user2,
          x: Math.random() * 80 + 10,  // Posición X 10-90%
          y: Math.random() * 60 + 20,   // Posición Y 20-80%
          timestamp: Date.now(),
        },
      ].slice(-4)); // Máximo 4 burbujas
    }
  }, 2500); // Cada 2.5 segundos

  return () => clearInterval(privateChatInterval);
}, []);
```

### Estructura de la Burbuja

```javascript
{
  id: Date.now(),
  user1: 'Juan',
  user2: 'Pedro',
  x: 45,
  y: 50,
  timestamp: Date.now(),
}
```

### Animación de la Burbuja

```javascript
<motion.div
  key={bubble.id}
  initial={{ opacity: 0, scale: 0, x: bubble.x + '%', y: bubble.y + '%' }}
  animate={{
    opacity: [0, 1, 1, 0],
    scale: [0, 1, 1, 0.8],
    x: [bubble.x + '%', (bubble.x + 5) + '%', (bubble.x - 5) + '%', bubble.x + '%'],
    y: [bubble.y + '%', (bubble.y - 10) + '%', (bubble.y + 10) + '%', bubble.y + '%'],
  }}
  exit={{ opacity: 0, scale: 0 }}
  transition={{ duration: 3, ease: 'easeInOut' }}
  className="absolute z-30 pointer-events-none"
  style={{ left: `${bubble.x}%`, top: `${bubble.y}%` }}
>
  <motion.div
    animate={{ rotate: [0, 10, -10, 0] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className="bg-gradient-to-br from-blue-500/80 to-purple-500/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border border-white/20 flex items-center gap-2"
  >
    <Users className="w-4 h-4 text-white" />
    <span className="text-xs font-bold text-white">
      {bubble.user1} + {bubble.user2}
    </span>
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    >
      <UserPlus className="w-3 h-3 text-green-300" />
    </motion.div>
  </motion.div>
</motion.div>
```

**Características:**
- **Frecuencia**: Cada 2.5 segundos (60% probabilidad)
- **Usuarios**: 2 personas diferentes aleatorias
- **Animación**: Flotación con movimiento suave
- **Duración**: 3 segundos
- **Máximo**: 4 burbujas simultáneas

### Limpieza de Burbujas

```javascript
useEffect(() => {
  const privateCleanup = setInterval(() => {
    setPrivateChatBubbles((prev) => prev.filter((b) => Date.now() - b.timestamp < 4000));
  }, 1500);
  return () => clearInterval(privateCleanup);
}, []);
```

---

## ⚡ Velocidades y Timing

### Tabla de Intervalos

| Elemento | Intervalo | Probabilidad | Máximo Simultáneo |
|---------|-----------|--------------|-------------------|
| Mensajes | 1.2 segundos | 100% | 5 mensajes |
| Emojis Flotantes | 1.5 segundos | 80% | 40 emojis |
| Perfiles Individuales | 1.5 segundos | 70% | 10 perfiles |
| Grupos | 3 segundos | 50% | 4 grupos |
| Chat Privado | 2.5 segundos | 60% | 4 burbujas |

### Tabla de Duraciones de Animación

| Elemento | Duración | Tipo |
|-----------|----------|------|
| Mensajes (entrada) | 0.4s | Spring |
| Emojis (subida) | 2.2s | Ease Out Cubic |
| Perfiles (entrada) | 0.4s | Spring |
| Grupos (formación) | 0.6s | Ease Out |
| Chat Privado | 3s | Ease In Out |

### Tabla de Limpieza

| Elemento | Intervalo de Limpieza | Tiempo de Vida |
|----------|----------------------|----------------|
| Emojis | 800ms | 2.5 segundos |
| Perfiles | Automático (al unirse a grupo) | - |
| Grupos | 1.5s | 5 segundos |
| Chat Privado | 1.5s | 4 segundos |

---

## 🔄 Lógica de Re-implementación

### Paso 1: Crear el Archivo

```bash
# Crear el archivo en la ubicación correcta
touch src/components/landing/ChatDemo.jsx
```

### Paso 2: Estructura Básica

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, ThumbsUp, Users, UserPlus, Sparkles } from 'lucide-react';
```

### Paso 3: Arrays de Datos

**Mensajes:**
```javascript
const messages = [
  { id: 1, user: 'Alex', text: 'Quiero coger 🔥', color: 'text-cyan-400', avatar: '👤', isOwn: false },
  { id: 2, user: 'Bruno', text: 'Tu perfil está que arde 😈', color: 'text-purple-400', avatar: '👤', isOwn: true },
  // ... (ver sección completa más abajo)
];
```

**Emojis:**
```javascript
const emojiReactions = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😈', name: 'devil' },
  { emoji: '💦', name: 'droplet' },
  { emoji: '🍆', name: 'eggplant' },
  { emoji: '🍑', name: 'peach' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '🥵', name: 'hot' },
];
```

### Paso 4: Estados y Refs

```javascript
const ChatDemo = ({ onJoinClick }) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [privateChatBubbles, setPrivateChatBubbles] = useState([]);
  const [groupBubbles, setGroupBubbles] = useState([]);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [individualProfiles, setIndividualProfiles] = useState([]);
  
  const messageIndexRef = useRef(0);
  const reactionIdRef = useRef(0);
  const profileIdRef = useRef(0);
  const emojiIdRef = useRef(0);
  
  // ... (useEffects aquí)
  
  return (
    // ... (JSX aquí)
  );
};
```

### Paso 5: Implementar useEffects en Orden

1. **Mensajes** (primero)
2. **Emojis Flotantes** (depende de mensajes)
3. **Perfiles Individuales** (independiente)
4. **Grupos** (depende de perfiles)
5. **Chat Privado** (independiente)
6. **Limpieza** (al final)

### Paso 6: JSX Structure

```jsx
<div className="w-full max-w-7xl mx-auto">
  <motion.div className="...">
    {/* Header */}
    <div className="...">...</div>
    
    {/* Área de chat */}
    <div className="relative h-96 sm:h-[500px] md:h-[600px] p-6 overflow-hidden">
      {/* Gradientes de fondo */}
      {/* Mensajes */}
      {/* Perfiles individuales */}
      {/* Grupos */}
      {/* Chat privado */}
    </div>
    
    {/* Botón */}
    <div className="...">
      <motion.button onClick={onJoinClick}>...</motion.button>
    </div>
  </motion.div>
</div>
```

---

## 📦 Código Completo

### Importaciones

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, ThumbsUp, Users, UserPlus, Sparkles } from 'lucide-react';
```

### Datos Estáticos

```javascript
const messages = [
  { id: 1, user: 'Alex', text: 'Quiero coger 🔥', color: 'text-cyan-400', avatar: '👤', isOwn: false },
  { id: 2, user: 'Bruno', text: 'Tu perfil está que arde 😈', color: 'text-purple-400', avatar: '👤', isOwn: true },
  { id: 3, user: 'Dani', text: '¿Dónde estás? Estoy caliente 🥵', color: 'text-pink-400', avatar: '👤', isOwn: false },
  { id: 4, user: 'Lucas', text: '¡Qué rico! Quedemos esta noche 😏', color: 'text-green-400', avatar: '👤', isOwn: true },
  { id: 5, user: 'Mati', text: 'Hagamos algo ya 🔥💦', color: 'text-yellow-400', avatar: '👤', isOwn: false },
  { id: 6, user: 'Carlos', text: 'Estoy solo y caliente 😈', color: 'text-blue-400', avatar: '👤', isOwn: true },
  { id: 7, user: 'Pedro', text: 'Tu culo está delicioso 🍑🔥', color: 'text-red-400', avatar: '👤', isOwn: false },
  { id: 8, user: 'Juan', text: 'Vamos a follar esta noche 💦', color: 'text-indigo-400', avatar: '👤', isOwn: true },
  { id: 9, user: 'Sergio', text: 'Estoy duro y listo 😏', color: 'text-orange-400', avatar: '👤', isOwn: false },
  { id: 10, user: 'Miguel', text: 'Quiero chuparte todo 🍆💦', color: 'text-teal-400', avatar: '👤', isOwn: true },
];

const emojiReactions = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😈', name: 'devil' },
  { emoji: '💦', name: 'droplet' },
  { emoji: '🍆', name: 'eggplant' },
  { emoji: '🍑', name: 'peach' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '🥵', name: 'hot' },
];
```

### Componente Completo

Ver archivo `src/components/landing/ChatDemo.jsx` para el código completo.

---

## 🎨 Estilos y Clases CSS

### Contenedor Principal

```jsx
className="w-full max-w-7xl mx-auto"
```

### Ventana del Chat

```jsx
className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border-2 border-purple-500/30 overflow-hidden shadow-2xl relative"
```

### Header

```jsx
className="bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 px-6 py-4 flex items-center justify-between border-b border-purple-500/20 backdrop-blur-sm"
```

### Área de Mensajes

```jsx
className="relative h-96 sm:h-[500px] md:h-[600px] p-6 overflow-hidden"
```

### Mensaje Propio (Derecha)

```jsx
className="rounded-tr-none bg-gradient-to-br from-purple-600/90 to-pink-600/90"
```

### Mensaje de Otro (Izquierda)

```jsx
className="rounded-tl-none bg-gray-800/90 backdrop-blur-sm"
```

### Botón de Unirse

```jsx
className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white text-base sm:text-lg font-extrabold py-4 sm:py-5 rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 group relative overflow-hidden"
```

---

## 🔧 Configuración de Velocidad

### Para Hacer Más Rápido

Reducir los intervalos en los `useEffect`:

```javascript
// Mensajes: de 1200ms a 800ms
}, 800);

// Emojis: de 1500ms a 1000ms
}, 1000);

// Perfiles: de 1500ms a 1000ms
}, 1000);

// Grupos: de 3000ms a 2000ms
}, 2000);

// Chat privado: de 2500ms a 1500ms
}, 1500);
```

### Para Hacer Más Lento

Aumentar los intervalos:

```javascript
// Mensajes: de 1200ms a 2000ms
}, 2000);

// Emojis: de 1500ms a 2500ms
}, 2500);
```

---

## 🐛 Troubleshooting

### Problema: Los emojis no aparecen

**Solución:**
1. Verificar que `visibleMessages.length > 0`
2. Verificar que `Math.random() > 0.2` (80% probabilidad)
3. Verificar que `emojiIdRef` se incrementa correctamente

### Problema: Los perfiles no se unen a grupos

**Solución:**
1. Verificar que hay al menos 3 perfiles en `individualProfiles`
2. Verificar que `Math.random() > 0.5` (50% probabilidad)
3. Verificar que los IDs coinciden al filtrar

### Problema: Animaciones muy lentas

**Solución:**
1. Reducir `duration` en las transiciones
2. Reducir intervalos en los `useEffect`
3. Verificar que no hay conflictos de z-index

### Problema: Elementos se acumulan sin limpiarse

**Solución:**
1. Verificar que los `useEffect` de limpieza están activos
2. Verificar que `timestamp` se guarda correctamente
3. Verificar que el filtro por tiempo funciona

---

## 📊 Métricas de Rendimiento

### Límites Actuales

- **Mensajes visibles**: 5 máximo
- **Emojis flotantes**: 40 máximo
- **Perfiles individuales**: 10 máximo
- **Grupos**: 4 máximo
- **Chat privado**: 4 máximo

### Optimizaciones

- Uso de `slice()` para limitar arrays
- Limpieza automática con `setInterval`
- `pointer-events-none` en elementos flotantes
- `z-index` optimizado para capas

---

## 🔄 Checklist de Recuperación

Si el código se pierde, seguir este checklist:

- [ ] Crear archivo `src/components/landing/ChatDemo.jsx`
- [ ] Agregar importaciones (React, framer-motion, lucide-react)
- [ ] Definir arrays `messages` y `emojiReactions`
- [ ] Crear componente `ChatDemo` con prop `onJoinClick`
- [ ] Agregar todos los estados con `useState`
- [ ] Agregar todos los refs con `useRef`
- [ ] Implementar `useEffect` para mensajes (1.2s)
- [ ] Implementar `useEffect` para emojis (1.5s)
- [ ] Implementar `useEffect` para perfiles (1.5s)
- [ ] Implementar `useEffect` para grupos (3s)
- [ ] Implementar `useEffect` para chat privado (2.5s)
- [ ] Implementar `useEffect` de limpieza para cada elemento
- [ ] Crear JSX con estructura completa
- [ ] Agregar animaciones con `framer-motion`
- [ ] Verificar que los mensajes alternan izquierda/derecha
- [ ] Verificar que los emojis suben desde abajo
- [ ] Verificar que los perfiles desaparecen al unirse a grupos
- [ ] Probar en navegador

---

## 📝 Notas Finales

### Características Clave a Recordar

1. **Velocidad**: Todo debe ser rápido para crear sensación de actividad
2. **Mensajes**: Alternados izquierda/derecha, contenido directo
3. **Emojis**: Salen desde abajo, suben y desaparecen (estilo TikTok)
4. **Grupos**: Los perfiles individuales desaparecen al unirse
5. **Limpieza**: Automática para evitar acumulación

### Dependencias Críticas

- `framer-motion`: Para todas las animaciones
- `lucide-react`: Para iconos (MessageSquare, Users, etc.)
- React Hooks: `useState`, `useEffect`, `useRef`

### Archivos Relacionados

- `src/pages/GlobalLandingPage.jsx`: Usa `<ChatDemo onJoinClick={handleChatearAhora} />`
- `src/components/landing/ChatDemo.jsx`: Componente principal

---

**Fecha de Creación**: 2025-01-04  
**Última Actualización**: 2025-01-04  
**Versión**: 2.0.0 (Versión Morbosa y Rápida)

---

## 🚨 IMPORTANTE: En Caso de Pérdida Total

Si el archivo `src/components/landing/ChatDemo.jsx` se pierde completamente:

1. **Crear el archivo** en la ubicación correcta
2. **Copiar el código completo** de la sección "Código Completo" de este documento
3. **Verificar dependencias** en `package.json`:
   - `framer-motion`
   - `lucide-react`
4. **Probar** que todo funciona correctamente
5. **Ajustar velocidades** si es necesario según este documento

---

**Este documento es el backup oficial del sistema ChatDemo. Mantener actualizado.**

