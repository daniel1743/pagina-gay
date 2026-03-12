# OPIN UX Redesign — Tablón Compacto

**Versión:** 1.0  
**Fecha:** Enero 2026  
**Alcance:** Solo UX/UI y presentación. Sin cambios en lógica de negocio.

---

## 1. UX EXPLANATION

### Concepto: Tablón de Notas, No Tarjetas de Perfil

OPIN debe sentirse como un **tablón de anuncios** donde la gente deja notas breves sobre lo que busca. La referencia mental no es Instagram ni un foro: es un mural de post-its, un tablón del supermercado, un panel donde alguien pega un papel y sigue.

**Principio rector:** El contenido (el texto de la OPIN) es el protagonista. Todo lo demás (avatar, metadatos, acciones) debe apoyar la lectura, no competir con ella.

### Problemas Actuales

| Problema | Impacto |
|----------|---------|
| Tarjetas muy altas | Pocas notas visibles → sensación de poca actividad |
| Avatar grande (48px) | Desvía la mirada del texto |
| Countdown "Expirado" | Transmite error/muerte, no simple antigüedad |
| Varios colores por tarjeta | Compiten entre sí y con el texto |
| Botones de acción muy visibles | Respuesta → Responder llama más que leer |
| Mucho texto visible | Sobrecarga, no invita a escanear |

### Solución Propuesta

1. **Tarjetas compactas:** Altura máxima fija, 2–3 líneas de texto visible.
2. **Jerarquía visual clara:** Texto primero, meta secundaria, acciones sutiles.
3. **Un color dominante:** Una familia cromática para el tablón; variación mínima.
4. **Sin etiquetas negativas:** Antigüedad como "hace Xh", no "Expirado".
5. **Más notas en pantalla:** Más densidad → sensación de actividad.
6. **CTA discreto:** Invitación a participar sin bloquear ni saturar.

---

## 2. VISUAL STRUCTURE

### Layout del Tablón

```
┌─────────────────────────────────────────────────────────────┐
│  [← Volver]     Tablón                                      │
│  Aquí la gente deja lo que busca. Lee o deja la tuya.       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ¿Poca gente? Deja tu nota y que te encuentren.  [Dejar]   │  ← CTA sutil
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┤
│  │ Busco alguien... │  │ Plan para salir  │  │ Charla y    │
│  │ con quien ir al  │  │ este finde...    │  │ café...     │
│  │ gim. Santiago.   │  │ [Ver más]        │  │             │
│  │                  │  │                  │  │             │
│  │ Anónimo · hace 2h│  │ Anónimo · hace 5h│  │ Anónimo · 8h│
│  │ ❤️ 3  ·  Responder│  │ ❤️ 1  ·  Responder│  │ ❤️ 0  ·  Resp.│
│  └──────────────────┘  └──────────────────┘  └─────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┤
│  │ ...              │  │ ...              │  │ ...         │
│  └──────────────────┘  └──────────────────┘  └─────────────┤
│                                                             │
└─────────────────────────────────────────────────────────────┘

                                          [ + Dejar nota ]  ← FAB
```

### Especificaciones de Tarjeta

| Elemento | Actual | Propuesto |
|----------|--------|-----------|
| Altura total | Variable (~180–220px) | Máx. 120–140px |
| Padding | p-6 | p-4 |
| Texto visible | Completo | 2–3 líneas (~80–100 chars) + "Ver más" si excede |
| Avatar | 48×48px, prominente | 24×24px o 28×28px, esquina superior |
| Username | Visible, destacado | Oculto o "Anónimo" por defecto |
| Tiempo | "Expirado" / countdown | Solo "hace 2h", "hace 23h" |
| Acciones | Botones grandes | Iconos + número, estilo secundario |

### Sistema de Color

- **Un color dominante:** Morado/violeta (alineado con marca Chactivo).
- **Sin gradientes por tarjeta:** Borde o acento sutil en una sola tonalidad.
- **Acciones:** Gris/muted, no competir con el contenido.
- **Like activo:** Rojo suave, no chillón.

---

## 3. COMPONENT BREAKDOWN (React)

### OpinFeedPage (Page)

```
OpinFeedPage
├── OpinHeader (compacto)
│   ├── BackButton
│   ├── Title: "Tablón"
│   └── Subtitle: "Aquí la gente deja lo que busca. Lee o deja la tuya."
│
├── OpinEntryPrompt (CTA sutil, opcional)
│   └── Texto: "¿Poca gente? Deja tu nota y que te encuentren." + link/botón
│
├── OpinGrid (más columnas en desktop)
│   └── OpinCardCompact (por cada post)
│
└── OpinFab (flotante)
    └── "Dejar nota"
```

### OpinCardCompact (Nueva variante)

```
OpinCardCompact
├── OpinCardContent (área principal)
│   ├── OpinText (2–3 líneas, line-clamp)
│   │   └── "Ver más" (expandible o modal) si text.length > ~100
│   └── OpinMeta (secundario)
│       └── "Anónimo · hace 2h"
│
├── OpinCardAuthor (opcional, pequeño)
│   └── Avatar 24px + click → Baúl
│
└── OpinCardActions (footer sutil)
    ├── LikeButton (icono + count)
    └── ReplyButton (icono + "Responder")
```

### Cambios en OpinCard (actual)

Sin tocar lógica:

1. Añadir `variant="compact"` que use layout reducido.
2. Usar `line-clamp-3` para el texto; estado `expanded` para "Ver más".
3. Reemplazar `getTimeRemaining` (Expirado) por `getTimeAgo` ("hace Xh").
4. Reducir tamaño de avatar; mover a esquina o hacer opcional.
5. Simplificar footer: iconos más pequeños, menos padding.

### OpinEntryPrompt (Nuevo componente)

- Texto amigable, no invasivo.
- Ubicación: después del header, antes del grid, o entre bloques de cards.
- Sin modal, sin bloqueo.
- Ejemplo: `"¿Poca gente? Deja tu nota y que te encuentren"` + enlace a `/opin/new`.

---

## 4. SUGGESTED SPANISH MICROCOPY

### Neutral, Chile-friendly, sin hype

| Contexto | Propuesta |
|----------|-----------|
| **Header subtitle** | "Aquí la gente deja lo que busca. Lee o deja la tuya." |
| **Entry prompt** | "¿Poca gente ahora? Deja tu nota y que te encuentren." |
| **FAB button** | "Dejar nota" |
| **Empty state** | "El tablón está vacío... por ahora. Sé el primero en dejar una nota." |
| **Ver más (texto largo)** | "Ver más" |
| **Meta (anon + tiempo)** | "Anónimo · hace 2h" / "hace 23h" |
| **Like** | Solo icono ❤️ + número |
| **Responder** | "Responder" (o icono + "Resp." en móvil) |
| **Stats dueño** | "3 personas te vieron" |

### Evitar

- "Expirado", "Caducado", "Vencido"
- "¡Únete ahora!", "¡No te pierdas!"
- "Descubre", "Explora" (demasiado genérico)

---

## 5. WHY THIS REDUCES CONFUSION & INCREASES ENGAGEMENT

### Reduce confusión

1. **Identidad clara:** "Tablón de notas" es una metáfora simple y conocida.
2. **Menos elementos:** Menos decisiones visuales = menos carga cognitiva.
3. **Jerarquía obvia:** El texto es lo primero que se lee.
4. **Sin etiquetas negativas:** "hace 23h" es informativo, no punitivo.
5. **Color coherente:** Un solo tono dominante evita ruido visual.

### Aumenta engagement

1. **Más notas visibles:** Más contenido en pantalla → sensación de actividad.
2. **Escaneo rápido:** 2–3 líneas por nota → lectura rápida, ideal para usuarios fugitivos.
3. **CTA discreto:** Invita sin obligar; reduce fricción psicológica.
4. **Acciones accesibles:** Like y Responder visibles pero no dominantes.
5. **Confianza:** Diseño sobrio transmite seriedad y control, no caos.

### Alineado con usuarios objetivo

- **Rápidos y fugitivos:** Menos contenido por tarjeta = decisión más rápida.
- **Alta sensibilidad visual:** Colores calmados, sin competencia.
- **Escanean, no leen:** Líneas limitadas favorecen el scan.
- **Paciencia baja:** Menos pasos para entender y actuar.

---

## 6. IMPLEMENTATION NOTES (UI only)

### OpinCard — cambios visuales sugeridos

1. `max-height` fija o `min-h` + `line-clamp` en el texto.
2. Avatar: `w-6 h-6` o `w-7 h-7` (24–28px).
3. `getTimeRemaining` → `getTimeAgo(post.createdAt)` (ej. "hace 2h").
4. Eliminar uso de "Expirado"; posts antiguos con opacidad reducida si se mantienen.
5. Un color por defecto (p. ej. purple); opcionalmente respetar `post.color` con variación mínima.
6. Footer: `flex` con iconos pequeños, `text-xs`, `text-muted-foreground`.

### OpinFeedPage — cambios sugeridos

1. Subtitle: "Aquí la gente deja lo que busca. Lee o deja la tuya."
2. Nuevo bloque `OpinEntryPrompt` con copy amigable.
3. Grid: considerar 4 columnas en desktop (`lg:grid-cols-4`) si las cards son compactas.
4. Mantener FAB "Dejar nota".

### No cambiar

- Lógica de likes, comentarios, `toggleLike`, `OpinCommentsModal`.
- Reglas de creación (1 post activo, 3/semana).
- Algoritmo de rotación (Robin Hood) si existe.
- Integración con Baúl (click en avatar → tarjeta).

---

## 7. QUICK REFERENCE: Before / After

| Aspecto | Antes | Después |
|---------|-------|---------|
| Altura card | ~180–220px | ~120–140px max |
| Texto | Completo | 2–3 líneas + "Ver más" |
| Avatar | 48px, protagonista | 24–28px, secundario |
| Tiempo | "Expirado" / countdown | "hace 2h" |
| Colores | Varios por card | Un dominante |
| CTA | FAB solo | + prompt sutil arriba |
| Tono | — | Calmado, mínimo, humano |
