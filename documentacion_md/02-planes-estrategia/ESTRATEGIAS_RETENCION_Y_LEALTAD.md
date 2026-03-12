# 🎯 ESTRATEGIAS DE RETENCIÓN Y LEALTAD - CHACTIVO

**Fecha:** Enero 2026  
**Objetivo:** Estrategias genuinas para que usuarios permanezcan, regresen y generen lealtad — **sin simulaciones ni engaño** (no bots que saludan, no perfiles falsos).

---

## 📊 QUÉ ENTENDÍ DE CHACTIVO

### Producto
- **Chat gay Chile** para comunidad LGBT+
- Salas temáticas: Principal, Gaming, +30, Santiago, etc.
- Entrada como invitado (nickname + avatar asignado) o usuario registrado
- Chat en tiempo real vía Firestore

### Estrategias actuales
| Estrategia | Qué hace | Público | Limitación |
|------------|----------|---------|------------|
| **OPIN** | Feed tipo Stories: posts 24h, 1 por usuario, descubrimiento de perfiles | Registrados (invitados solo ven) | Requiere masa crítica para sentirse útil |
| **Baúl** | Tarjetas tipo Tinder: like/match, geolocalización, actividad | Solo registrados | Guests tienen error de permisos al crear tarjeta |
| **Engagement Nudge** | Toasts cada 10–15 min: "X personas vieron tu tarjeta", "Publica en OPIN" | Solo registrados | Puede sentirse spam si no hay valor real |
| **VOC** | Mensajes informativos cuando el chat está callado 30+ seg (horarios, icebreakers) | Todos | Útil pero no genera "vuelve mañana" |

### Problema central
1. **Entran, no hay movimiento → se van**
2. **Hay movimiento, pero a otras horas** (18:00 vs 22:00 vs 10:00) → no coinciden
3. **Falta un "enganche"** que genere: "volveré", "me avisan", "tengo algo pendiente"

---

## 🚫 LO QUE NO QUEREMOS (por tu definición)
- Bots que simulen personas
- Saludos automáticos falsos
- Perfiles o actividad inventada

---

## ✅ ESTRATEGIAS PROPUESTAS (genuinas, sin engaño)

### 1. EVENTOS PROGRAMADOS ("Happy Hours")
**Objetivo:** Concentrar a la gente en horarios predecibles.

**Implementación:**
```
┌─────────────────────────────────────────────┐
│ ⏰ Próximo: After Office en 2h 15min        │
│    Lunes–Viernes 18:00–20:00                │
│    [Recordarme]  [Ver calendario]           │
└─────────────────────────────────────────────┘
```

- Banner en chat y landing con countdown real
- Botón "Recordarme" → pide permiso de notificación y programa aviso 15 min antes
- Eventos iniciales: After Office 18–20h, Noche Gamer viernes 21–00h
- Si hay moderador humano en el horario, indicarlo: "Moderador presente 18–19h"

**Por qué funciona:** Crea hábito ("los lunes a las 6") y expectativa ("ahí habrá gente").

---

### 2. NOTIFICACIONES PUSH INTELIGENTES
**Objetivo:** Avisar solo cuando hay actividad real.

**Condiciones para enviar:**
- 3+ usuarios reales en sala
- 5+ mensajes en últimos 10 min
- Usuario inactivo 2+ horas pero activo en últimas 24h

**Mensaje ejemplo:**
> "🔥 Hay 4 personas chateando en Principal. ¿Te unes?"

**Segmentación:** Solo a quienes aceptaron notificaciones y estuvieron activos recientemente.

**Por qué funciona:** Trae gente cuando sí hay conversación, evita llegar a salas vacías.

---

### 3. HORARIOS DE ACTIVIDAD VISIBLES
**Objetivo:** Bajar expectativas falsas y ofrecer información útil.

**Implementación:**
- En la sala (o sidebar): "⏰ Esta sala suele estar más activa entre 18:00–22:00"
- Estadística real: "X personas distintas estuvieron hoy en esta sala" (no "X online ahora")
- Si está vacío: "La sala suele tener más movimiento por las tardes. ¿Quieres que te avisemos?"

**Por qué funciona:** Reduce frustración ("por qué está vacío") y da una razón clara para volver.

---

### 4. TEMA/PREGUNTA DEL DÍA (sistema, no bots)
**Objetivo:** Dar algo concreto para participar sin inventar usuarios.

**Implementación:**
```
┌─────────────────────────────────────────────┐
│ 💬 Tema del día (rota cada 24h)             │
│ "¿Cuál fue tu primera vez en un bar gay?"   │
│ 2 personas ya respondieron                  │
└─────────────────────────────────────────────┘
```

- Mensaje de sistema fijo (no personaje)
- Preguntas rotativas: coming out, relaciones, cultura, preferencias
- Contador real de respuestas
- Las respuestas son de usuarios reales en el chat

**Por qué funciona:** Da un motivo para escribir aunque haya poca gente; funciona con 1–2 personas.

---

### 5. "DEJA UN MENSAJE PARA CUANDO LLEGUEN"
**Objetivo:** Ofrecer valor cuando la sala está vacía.

**Implementación:**
- Si está solo 1–2 min: panel "¿Quieres dejar un mensaje? Cuando alguien entre lo verá"
- El mensaje se muestra como destacado al siguiente que entre
- Ejemplo: "Carlos dejó: 'Hola, busco hablar de viajes. Escríbanme'"
- Quien entra puede responder en el chat o con un clic

**Por qué funciona:** Convierte "estoy solo" en "dejo algo y alguien lo verá después".

---

### 6. GAMIFICACIÓN HONESTA
**Objetivo:** Celebrar comportamiento real.

**Ideas:**
- Racha: "Llevas 3 días entrando 🔥"
- Badge: "Miembro desde enero 2026"
- "Primer mensaje" celebrado con toast sutil
- Sin inventar actividad: todo basado en datos reales

**Por qué funciona:** Recompensa uso real y genera hábito sin engaño.

---

### 7. MEJORAR VISIBILIDAD DE OPIN
**Objetivo:** Más descubrimiento sin forzar registro.

- Invitados ya pueden ver OPIN
- Mostrar: "5 posts nuevos hoy" (número real)
- CTA: "Publica lo que buscas" (lleva a registro)
- En chat vacío: "Mientras esperas: mira qué buscan otros en OPIN →"

**Por qué funciona:** Da algo útil cuando el chat está quieto y crea interés en registrarse.

---

### 8. ARREGLAR BAÚL PARA INVITADOS
**Objetivo:** Eliminar fricción y errores de permisos.

- Corregir reglas Firestore para que invitados puedan ver tarjetas (aunque no crear)
- O mensaje claro: "Regístrate para ver tu tarjeta y quién te dio like"
- Evitar errores tipo "Missing or insufficient permissions"

---

### 9. "QUIÉN ESTUVO HOY" (privacidad respetada)
**Objetivo:** Mostrar que la sala tiene uso sin inflar números.

**Implementación:**
- "15 personas distintas estuvieron hoy en esta sala"
- No "15 online ahora" si hay 0
- Contador basado en presencia real (Firestore)

**Por qué funciona:** Demuestra que la sala está viva aunque en este momento no haya nadie.

---

### 10. RECORDATORIO AL SALIR (cuando está vacío)
**Objetivo:** Capturar intención de volver.

**Implementación:**
- Al salir con 0–1 personas: "La sala suele tener más actividad 18:00–22:00. ¿Te avisamos?"
- Opt-in para notificación
- No enviar si el usuario rechazó antes

**Por qué funciona:** Convierte una salida frustrante en una próxima visita programada.

---

## 📋 PRIORIZACIÓN SUGERIDA

| # | Estrategia | Esfuerzo | Impacto | Dependencias |
|---|------------|----------|---------|--------------|
| 1 | Horarios de actividad visibles | Bajo | Medio | Ninguna |
| 2 | Tema del día | Bajo | Alto | Ninguna |
| 3 | "Deja un mensaje" | Medio | Alto | Firestore (colección mensajes pendientes) |
| 4 | Eventos programados + countdown | Medio | Muy alto | Calendario, notificaciones |
| 5 | Notificaciones push | Medio | Muy alto | Permisos browser, backend |
| 6 | "Quién estuvo hoy" | Bajo | Medio | Queries de presencia |
| 7 | Recordatorio al salir | Bajo | Medio | LocalStorage + notificaciones |
| 8 | Arreglar Baúl invitados | Bajo | Medio | Firestore rules |
| 9 | Gamificación | Medio | Medio | Tracking de sesiones |
| 10 | Mejorar OPIN para invitados | Bajo | Medio | UI/copy |

---

## 🎯 RECOMENDACIÓN INICIAL (primeras 2–4 semanas)

1. **Horarios de actividad visibles** – Implementación rápida, reduce frustración.
2. **Tema del día** – Da algo concreto para participar; ayuda con cold start.
3. **"Deja un mensaje"** – Ofrece valor cuando la sala está vacía.
4. **Eventos programados** – Alto impacto; empieza con 1 evento fijo (ej. After Office 18–20h).

Estas cuatro estrategias son transparentes, no simulan personas y atacan directo el problema de "entran, no hay movimiento, se van" y "no coinciden en horarios".

---

## 📁 ARCHIVOS RELEVANTES EN EL PROYECTO

- `src/services/vocService.js` – Mensajes informativos en silencio
- `src/hooks/useEngagementNudge.js` – Nudges Baúl/OPIN
- `src/components/opin/OpinDiscoveryBanner.jsx` – Descubrimiento OPIN
- `src/components/baul/BaulSection.jsx` – Baúl de tarjetas
- `ANALISIS-BOTS-Y-ALTERNATIVAS.md` – Base de Eventos, Push, Tema del día

---

**Resumen:** El objetivo es generar motivos reales para quedarse y volver: información honesta, horarios predecibles, contenido que invite a participar y avisos cuando hay actividad real. Sin bots que simulen personas ni números falsos.
