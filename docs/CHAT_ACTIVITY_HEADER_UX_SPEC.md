# Chat Activity Context Header — Especificación UX y Técnica

> **Objetivo:** Reducir abandono cuando usuarios perciben la sala como "muerta" al ver gaps temporales. El header comunica honestamente: *"La gente SÍ usa esta sala, estás en un momento tranquilo."*

---

## 1. Fundamentación UX: Por qué mejora la retención

### Problema psicológico
Cuando un usuario entra al chat y ve mensajes con horas de diferencia, su **heurística cognitiva** le dice: "nadie está aquí, esto está muerto". Abandona en segundos sin dar tiempo a que lleguen más personas.

### Realidad vs percepción
Las salas LGBTQ+ suelen tener actividad **distribuida** a lo largo del día (mañana, tarde, noche), con picos en horarios típicos. El usuario llega en un valle, pero la sala no está muerta.

### Efecto del header
Al mostrar **información contextual real** (ej: "Hoy participaron 37 personas"), el usuario:
- **Reframea** su interpretación: no es una sala vacía, es un momento de calma
- **Reduce ansiedad** por la incertidumbre ("¿alguien vendrá?")
- **Mantiene expectativas realistas** sin falsas promesas
- **Aumenta la probabilidad de quedarse** a esperar o volver más tarde

### Principios aplicados
- **Transparencia:** Solo datos reales
- **Calma:** No presión, no urgencia
- **Empatía:** "Llegaste en un horario tranquilo" normaliza la situación

---

## 2. Estructura de UI (nivel componente)

### Ubicación
- **Encima** de la lista de mensajes
- **Dentro** del `messages-container` o como primer hijo del área de scroll
- **Fijo** (sticky) o estático en la parte superior del scroll — siempre visible al cargar

### Diagrama de estructura

```
┌─────────────────────────────────────────────┐
│  ChatHeader (título sala, menú)             │
├─────────────────────────────────────────────┤
│  [OpinDiscoveryBanner] (solo invitados)     │
│  [TarjetaPromoBanner] (solo registrados)    │
├─────────────────────────────────────────────┤
│  ChatActivityContextHeader  ← NUEVO         │
│  ┌───────────────────────────────────────┐ │
│  │ ℹ️ Hoy participaron 37 personas       │ │
│  │    Esta sala suele tener más actividad │ │
│  │    entre 18:00 y 23:00                 │ │
│  └───────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│  NewMessagesIndicator (flotante)            │
│  ┌───────────────────────────────────────┐ │
│  │ message-group 1                        │ │
│  │ message-group 2                        │ │
│  │ ...                                   │ │
│  └───────────────────────────────────────┘ │
│  messagesEndRef                             │
└─────────────────────────────────────────────┘
```

### Componente propuesto

**Nombre:** `ChatActivityContextHeader`  
**Ubicación:** `src/components/chat/ChatActivityContextHeader.jsx`

**Props:**
- `roomId` — ID de la sala
- `activityInfo` — `{ uniqueUsersToday, peakHours, currentHourHint }` (puede ser `null` si está cargando)
- `isGuest` — boolean (siempre visible para invitados)
- `isRegistered` — boolean (colapsable/opcional para registrados)

**Integración:** Renderizado como **primer hijo** dentro del contenedor que envuelve `ChatMessages`, antes del scroll de mensajes.

---

## 3. Copy de ejemplo (español)

### Variantes según datos disponibles

| Condición | Copy |
|-----------|------|
| Hay datos de hoy | "Hoy participaron **N** personas en esta sala" |
| Hay horario pico definido | "Esta sala suele tener más actividad entre **18:00 y 23:00**" |
| Usuario llega fuera de pico | "Llegaste en un horario tranquilo. La sala tiene más actividad al anochecer." |
| Solo hint genérico | "Las salas tienen picos a distintas horas. Vale la pena quedarse." |
| Sin datos (fallback) | "La actividad varía a lo largo del día. Si no hay mensajes, prueba más tarde." |

### Tonos a evitar
- ❌ "¡Únete! Hay mucha gente esperando" (falso)
- ❌ "¡No te pierdas la conversación!" (presión)
- ❌ "37 usuarios online ahora" (si no es cierto)

### Tonos correctos
- ✅ Informativo, neutro
- ✅ Tranquilizador
- ✅ Basado en hechos

---

## 4. Lógica de datos

### 4.1 Usuarios únicos hoy

**Fuente:** `rooms/{roomId}/messages`  
**Criterio:** Mensajes con `timestamp` dentro del día actual (zona Chile: `America/Santiago`).

**Opciones de implementación:**

| Opción | Pros | Contras |
|--------|------|---------|
| **A) Query client-side** | Sin backend nuevo | Costoso en lecturas si hay muchos mensajes |
| **B) Cloud Function** | Escalable, eficiente | Requiere deploy |
| **C) Doc agregado** | Lectura barata, actualización en escritura | Lógica en `sendMessage` + posible CF |

**Recomendación inicial:** Opción A con query acotada:

```javascript
// Pseudocódigo
const startOfDay = startOfDayChile(); // 00:00 Chile
const q = query(
  collection(db, 'rooms', roomId, 'messages'),
  where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
  where('timestamp', '<=', Timestamp.fromDate(new Date())),
  limit(500) // acotar para no saturar
);
// En cliente: contar Set(userIds) únicos
```

**Alternativa más ligera:** Usar los mensajes **ya cargados** en `ChatMessages` y filtrar por `timestampMs` del día actual. Si el límite es 60 mensajes, puede que no cubra todo el día; en ese caso, hacer una query separada solo para el conteo (una vez al montar, no en tiempo real).

### 4.2 Horas pico

**Opciones:**

| Opción | Descripción |
|--------|-------------|
| **a) Pre-definido por sala** | Campo en `rooms/{roomId}`: `peakHours: { start: 18, end: 23 }` |
| **b) Calculado histórico** | Cloud Function que analiza mensajes de últimos 7–14 días y calcula picos (complejo) |
| **c) Config manual** | Admin define por sala en panel |
| **d) Default genérico** | "18:00–23:00" para todas las salas (Chile típico) |

**Recomendación:** Empezar con **(d) default** y después añadir **(a)** si las salas difieren.

### 4.3 Hint "horario tranquilo"

**Lógica:**
- Hora actual (Chile) fuera del rango pico → mostrar "Llegaste en un horario tranquilo"
- Dentro del pico → no mostrar ese hint (o variante más suave)

---

## 5. Comportamiento del componente

| Aspecto | Invitados | Registrados |
|---------|-----------|-------------|
| Visibilidad | Siempre visible | Opcional: colapsable o visible por defecto |
| Colapso | No | Sí: botón "ℹ️" o texto pequeño que se pliega |
| Repetición | Una vez por sesión/sala | No repetir de forma intrusiva |

**Estilo visual:**
- Color: `text-muted-foreground` o similar
- Tamaño: `text-xs` o `text-sm`
- Sin bordes llamativos, sin gradientes
- Icono: ℹ️ o `Info` de Lucide, pequeño
- Aspecto de "info del sistema", no de banner promocional

**Animaciones:** Ninguna que llame la atención. A lo sumo, fade-in suave al cargar.

---

## 6. Qué NO hacer

| Evitar | Razón |
|--------|-------|
| Inventar números | Destruye confianza |
| Simular usuarios o actividad | Engaño, riesgo legal/ético |
| Presionar ("¡Únete ahora!") | Aumenta ansiedad |
| Banner grande o animado | Roba foco del chat |
| Mensajes que cambian cada pocos segundos | Molesto, parece spam |
| Contar bots/IA como usuarios | Datos falsos |
| Prometer "alguien te responderá" | No se puede garantizar |

---

## 7. Resumen técnico

1. **Componente:** `ChatActivityContextHeader`
2. **Servicio:** `chatActivityService.js` — funciones para obtener `uniqueUsersToday` y `peakHours`
3. **Datos:** Firestore `rooms/{roomId}/messages` (y opcional `rooms/{roomId}` para metadata)
4. **Integración:** ChatPage → pasar `roomId`, `activityInfo`, `isGuest`/`isRegistered` al header

---

## 8. Checklist de implementación

- [ ] Crear `chatActivityService.js` con `getRoomActivityInfo(roomId)`
- [ ] Crear `ChatActivityContextHeader.jsx`
- [ ] Integrar en ChatPage encima de ChatMessages
- [ ] Definir copy por variante de datos
- [ ] Comportamiento colapsable para registrados (opcional)
- [ ] Tests manuales con sala vacía, con datos, y en distintos horarios
