# Implementación Vertical Hetero (20-03-2026)

## Objetivo ejecutado
Expandir un vertical hetero con cambios mínimos, sin romper el vertical gay existente y sin mezclar intención de páginas.

## Criterios aplicados
- Mantener intacto el flujo gay actual (rutas y landings existentes).
- Crear segmentación hetero con 3 landings de intención distinta.
- Usar una sola sala hetero inicial para conservar masa crítica.
- Evitar redirecciones masivas de landings indexables hacia la misma URL sin contenido.

## Cambios implementados

### 1) Nuevas landings hetero (3 URLs)
Se creó una nueva página reutilizable con variantes:
- `/hetero`
- `/hetero/chat`
- `/hetero/amistad`

Archivo creado:
- `src/pages/HeteroLandingPage.jsx`

Qué hace:
- Renderiza contenido distinto por intención (`home`, `chat`, `amistad`).
- Define `title`, `description`, `og:*`, `twitter:*` por variante.
- Usa `canonical` autocanónico por URL.
- Incluye CTA explícito a la sala hetero (`/chat/hetero-general`), sin auto-redirect.
- Registra eventos de analítica para vista y click CTA.

### 2) Ruteo segmentado sin romper rutas actuales
Archivo modificado:
- `src/App.jsx`

Rutas añadidas:
- `/gay` y `/gay/` como alias del vertical gay existente.
- `/hetero`, `/hetero/`, `/hetero/chat`, `/hetero/chat/`, `/hetero/amistad`, `/hetero/amistad/`.

Nota:
- Se mantuvo `/` como landing gay actual para no tocar tráfico SEO vigente.

### 3) Sala hetero separada en backend lógico
Archivo modificado:
- `src/config/rooms.js`

Cambios:
- Se añadió sala nueva:
  - `id: "hetero-general"`
  - `enabled: true`
  - `isHetero: true`
- Se añadió constante en configuración:
  - `HETERO_ROOM: "hetero-general"`

Resultado:
- Existe sala hetero propia sin mezclar mensajes con `principal`.

### 4) Acceso guest controlado para no mezclar comunidades
Archivo modificado:
- `src/pages/ChatPage.jsx`

Cambios:
- Invitados ahora pueden acceder solo a:
  - `principal`
  - `hetero-general`
- Se añadió SEO específico para la sala `hetero-general`.
- Se añadió mensaje de bienvenida para `hetero-general`.

Resultado:
- Vertical hetero tiene su sala pública propia.
- No se habilitaron salas intermedias adicionales.

### 5) Sidebar aislado cuando se está en sala hetero
Archivo modificado:
- `src/components/chat/ChatSidebar.jsx`

Cambios:
- Si `currentRoom === "hetero-general"`, el sidebar muestra solo esa sala.
- Se ajustó la suscripción de contadores a las salas visibles en ese contexto.

Resultado:
- Se reduce fuga de navegación entre comunidades durante sesión hetero.

### 6) SEO técnico y sitemaps segmentados
Archivos modificados:
- `public/robots.txt`
- `public/sitemap.xml`

Archivos creados:
- `public/sitemap-gay.xml`
- `public/sitemap-hetero.xml`
- `public/sitemap-index.xml`

Cambios:
- Se agregaron `Allow` para nuevas rutas hetero.
- Se añadió `Allow` para `/chat/hetero-general`.
- Se agregó referencia a `sitemap-index.xml` en `robots.txt`.
- Se incluyeron nuevas URLs hetero en sitemap principal.
- Se separaron URLs en sitemaps por vertical.

### 7) Canonical dinámico temprano en HTML
Archivo modificado:
- `index.html`

Cambio:
- Script temprano para actualizar `rel=canonical` según `pathname` actual.

Resultado:
- Mejor coherencia de canonical antes del render completo de la SPA.

## Validación técnica ejecutada
- Comando: `npm run build`
- Resultado: OK, build de producción completado sin errores.

## Estado final
- Vertical gay: mantenido.
- Vertical hetero: implementado con 3 landings + 1 sala única.
- Segmentación: separada por intención y por sala.
- Riesgo de mezcla: reducido con sidebar contextual en sala hetero.
- SEO técnico: reforzado con canonical dinámico y sitemaps separados.

## Decisiones de mínima intervención
- No se migró `/` a hub neutral para no arriesgar tráfico ya posicionado.
- No se crearon páginas por ciudad hetero en esta fase.
- No se multiplicaron salas hetero; se dejó una sola sala activa inicial.

## Próximo paso recomendado (fase 2 condicionada por datos)
- Evaluar 30 días de métricas:
  - CTR por landing hetero.
  - Entradas a `/chat/hetero-general`.
  - Retención D1/D7.
  - Conversión registro.
- Escalar solo si hay masa crítica real.

## Mejoras inmediatas aplicadas (alto impacto)

### 1) Contenido reforzado en landings (obligatorio)
Archivo modificado:
- `src/pages/HeteroLandingPage.jsx`

Aplicado:
- Cada landing (`/hetero`, `/hetero/chat`, `/hetero/amistad`) ahora tiene contenido extenso con intención propia.
- Se agregaron bloques largos de texto, beneficios claros y diferenciación real entre rutas.
- Se añadieron FAQs completas por variante.
- Volumen aproximado por variante:
  - `home`: ~654 palabras
  - `chat`: ~547 palabras
  - `amistad`: ~557 palabras

### 2) Optimización de `/chat/hetero-general`
Archivo modificado:
- `src/pages/ChatPage.jsx`

Aplicado:
- Se agregó bloque indexable visible al entrar a `hetero-general`.
- Incluye H1 claro, texto descriptivo y enlaces internos útiles.
- Se añadieron metadatos SEO específicos para esta sala.

### 3) Interlinking interno
Archivo modificado:
- `src/pages/HeteroLandingPage.jsx`

Aplicado:
- Enlaces cruzados entre:
  - `/hetero` -> `/hetero/chat` y `/hetero/amistad`
  - `/hetero/chat` -> `/hetero` y `/hetero/amistad`
  - `/hetero/amistad` -> `/hetero/chat` y `/hetero`

### 4) Señales de comportamiento (medición priorizada)
Archivo modificado:
- `src/pages/ChatPage.jsx`

Aplicado:
- Tracking de inicio de sesión hetero: `hetero_chat_session_start`
- Tracking de mensajes enviados en sesión hetero: `hetero_chat_message_sent`
- Tracking de cierre de sesión hetero con duración y mensajes: `hetero_chat_session_end`
- Señal de retorno basada en última visita local (`is_returning`, `hours_since_last_visit`).

### 5) Schema básico recomendado
Archivos modificados:
- `src/pages/HeteroLandingPage.jsx`
- `src/pages/ChatPage.jsx`

Aplicado:
- `WebPage` + `BreadcrumbList` en las landings hetero.
- `WebPage` + `BreadcrumbList` en `/chat/hetero-general`.

## Revalidación técnica tras mejoras inmediatas
- Comando: `npm run build`
- Resultado: OK, compilación exitosa sin errores.

## Ajuste UX inmediato (20-03-2026, etiqueta visual neutral)
Objetivo:
- Evitar que el usuario vea la etiqueta "hetero" dentro del chat y mantener posicionamiento/segmentación en SEO técnico.

Archivos modificados:
- `src/config/rooms.js`
- `src/components/chat/ChatHeader.jsx`
- `src/pages/ChatPage.jsx`

Aplicado:
- `hetero-general` ahora se muestra visualmente como **Chat Principal** en sidebar y header.
- Mensaje de bienvenida del chat actualizado a tono neutral (sin "hetero").
- Bloque superior informativo de `/chat/hetero-general` actualizado a copy neutral:
  - "Chat principal en vivo..."
  - enlace "Ver landing principal"

No modificado:
- URL técnica `/chat/hetero-general`.
- Metadatos SEO/estructura para Google del vertical hetero.

## Ajuste UX Copy Landings (20-03-2026, conversión por intención)
Objetivo:
- Maximizar CTR interno hacia chat.
- Diferenciar intención entre `/hetero`, `/hetero/chat`, `/hetero/amistad` sin fragmentar backend.
- Mejorar señales de interacción desde entrada.

Archivos modificados:
- `src/pages/HeteroLandingPage.jsx` (reestructura completa de copy/UX)
- `src/pages/ChatPage.jsx` (bloque superior de `/chat/hetero-general`)

Aplicado en landings:
- Hero optimizado por intención en cada ruta (H1, subtexto y CTA directo).
- Bloques claros de valor: prueba social, beneficios, mensaje emocional, FAQs.
- Interlinking interno enfocado en intención:
  - `/hetero/` -> `/hetero/chat` y `/hetero/amistad`
  - `/hetero/chat` -> `/hetero/amistad`
  - `/hetero/amistad` -> `/hetero/chat`
- CTA final repetido para conversión en cada landing.
- Se mantiene destino único: `/chat/hetero-general`.

Aplicado en `/chat/hetero-general`:
- Bloque superior con texto indexable y foco en acción.
- Indicador visible de actividad en tiempo real:
  - conectados ahora
  - mensajes recientes (20 min)
- Enlaces internos a landing principal y amistad.

Revalidación:
- Comando: `npm run build`
- Resultado: OK, compilación exitosa tras ajuste de copy UX.

## Landing Visual Upgrade (20-03-2026, impacto y conversion)
Objetivo:
- Impacto visual inmediato.
- Transmitir actividad y vida.
- Empujar al usuario a entrar al chat.

Archivo modificado:
- `src/pages/HeteroLandingPage.jsx`

Aplicado:
- Hero en 2 columnas:
  - Izquierda: H1 fuerte, subtexto directo, CTA primario y CTA secundario.
  - Derecha: cluster visual de perfiles con estado online y micro-animaciones.
- Estilo visual renovado:
  - Fondo con gradiente moderno y acento cyan.
  - Tarjetas con glassmorphism ligero (blur, borde suave, glow sutil).
  - Botones primarios de alto contraste y hover mas brillante.
- Prueba social en formato chips visuales (no texto plano).
- Beneficios en 3 cards horizontales (icono + texto corto).
- Bloque dinamico tipo simulacion de chat para transmitir actividad sin depender de backend adicional.
- CTA repetido despues de bloques clave para mejorar conversion.
- CTA sticky inferior para mantener accion visible durante scroll.

No modificado:
- Rutas y arquitectura SEO (`/hetero`, `/hetero/chat`, `/hetero/amistad`).
- Destino unico de conversion: `/chat/hetero-general`.
- Segmentacion backend existente.
