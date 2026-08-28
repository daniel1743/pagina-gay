# Plan maestro de reestructuración visual y UI de Chactivo — 2026

**Autor:** Manus AI  
**Fecha:** 28 de agosto de 2026  
**Alcance:** investigación UI/UX, dirección visual y plan técnico de interfaz.  
**Fuera de alcance:** SQL remoto, migración de datos, configuración de Supabase/Vercel, deploy, push, pruebas con cuentas reales y cambios funcionales de backend.

## 1. Dictamen de partida

Chactivo no necesita otra colección de gradientes aislados. Necesita un **sistema visual reconocible, consistente y orientado a una acción**. La auditoría local muestra una base React/Vite/Tailwind ya funcional en estructura, con `ChatPage` como superficie compleja, `ChatSidebar` como navegación contextual, `ChatMessages` con densidad tipo Telegram, `ChatInput` con varias ayudas, `OpinFeedPage` con filtros e intenciones y Baúl con una card visual más avanzada, aunque `ENABLE_BAUL=false` mantiene esa experiencia pausada.

El problema visual principal es la fragmentación. Conviven `glass-effect`, `glassmorphism-card`, colores hardcodeados, gradientes magenta/cian, componentes Lucide y Hugeicons, radios variables, varios tratamientos de botones y diferentes densidades de información. Esto hace que el producto parezca una suma de módulos heredados en lugar de una plataforma con un lenguaje visual único.

La dirección propuesta es **Midnight Community / Electric Trust**: una interfaz nocturna sobria, con color eléctrico usado para orientar y accionar, superficies con profundidad moderada, cards menos decorativas y más informativas, tipografía consistente y microinteracciones que confirman acciones reales. La propuesta conserva el carácter LGBTQ+ de Chactivo sin convertirlo en una interfaz estridente ni depender de actividad sintética.

> **Principio de producto visual:** la pantalla debe hacer evidente qué puede hacer la persona ahora, qué resultado puede esperar y dónde podrá retomar la experiencia después.

## 2. Fase 1 — Investigación UI/UX y estándares 2026

### 2.1. Figma: Auto Layout, variables y tokens

Figma describe Auto Layout como un sistema para que los diseños respondan a cambios de contenido, elementos y tamaño de pantalla. Sus propiedades de dirección, spacing, padding, alineación y resize permiten que botones, listas, dashboards y páginas se adapten sin recolocar manualmente cada capa.[1]

> “Auto layout can be used on frames so that designs will respond dynamically to content changes … making your designs responsive and adaptable.” — Figma.[1]

Para Chactivo, esto significa que una card de OPIN no debe depender de que el nombre, la comuna o el texto tengan una longitud ideal. La card debe probarse con nombre largo, cero respuestas, muchas respuestas, estado cerrado, avatar ausente y CTA traducido. En Figma, cada componente debe construirse con Auto Layout anidado y propiedades Hug contents, Fill container, Minimum y Maximum.

Figma define Variables como valores reutilizables aplicables a propiedades de diseño y prototipos. Los modos permiten representar contextos como dark/light, densidad o dispositivo sin duplicar todos los frames.[2] La recomendación es crear una colección de variables primitivas y otra semántica, con aliases entre ambas. El desarrollador no debe copiar valores hex a mano en cada frame.

La estructura Figma propuesta es:

| Colección | Ejemplos | Uso |
|---|---|---|
| `Primitive/Color` | `blue-950`, `cyan-300`, `fuchsia-400`, `slate-50` | Valores cromáticos base, no usados directamente por la mayoría de componentes |
| `Primitive/Space` | `space-1` a `space-16` | Escala de 4 px para padding, gap y separación |
| `Primitive/Shape` | radios 8, 12, 16, 20, 999 | Forma y redondeado |
| `Primitive/Elevation` | `elevation-1` a `elevation-3` | Sombras y separación de capas |
| `Semantic/Surface` | `surface-page`, `surface-card`, `surface-elevated`, `surface-overlay` | Fondo según función |
| `Semantic/Content` | `content-primary`, `content-secondary`, `content-tertiary`, `content-on-accent` | Texto y contenido sobre superficies |
| `Semantic/Action` | `action-primary`, `action-secondary`, `action-danger`, `focus-ring` | CTA, estados y foco |
| `Component/*` | `chat-bubble-own`, `opin-card`, `baul-media-card` | Valores específicos sólo cuando un componente lo necesita |

### 2.2. Tailwind, Bootstrap y primitives accesibles

El proyecto real usa Tailwind CSS 3.3.3, no Tailwind 4. La documentación actual de Tailwind 4 usa `@theme` para generar utilities desde variables CSS,[10] pero no se debe mezclar esa sintaxis sin una migración independiente. Para esta fase conviene conservar `:root` y `.dark` en `src/index.css`, mover gradualmente los valores a tokens semánticos y usar utilities existentes.

La guía responsive de Tailwind sigue un enfoque mobile-first: la utilidad sin prefijo es la base y los prefijos se aplican desde un breakpoint hacia arriba.[3] La regla para Chactivo será diseñar primero 320–430 px y después ampliar la composición a tablet y escritorio; no crear dos UIs independientes que diverjan con el tiempo.

Bootstrap 5.3 documenta Offcanvas como un panel que entra desde un borde, con trigger explícito, backdrop, cierre, control de scroll y comportamiento responsive.[4] No se propone instalar Bootstrap junto a Tailwind. Se adopta el patrón conceptual mediante los componentes Radix que ya están presentes en el proyecto: drawer/sheet móvil, panel lateral desktop, backdrop, Escape, restauración de foco y cierre visible.

Radix indica que sus primitives siguen patrones WAI-ARIA y cubren labels, navegación de teclado y gestión de foco.[6] En Chactivo deben priorizarse para Dialog, Select, Dropdown, Tabs, Label, ScrollArea y cualquier nuevo sheet. Un icono nunca será la única explicación de una acción: cada icon button debe tener nombre accesible, tooltip cuando corresponda y estado visible.

### 2.3. Cards, profundidad y glassmorphism

Material Design 3 trata tokens, cards, chips, icon buttons, navigation bars, drawers, bottom sheets y side sheets como piezas de un sistema adaptable, no como estilos aislados.[5] El patrón útil para Chactivo es separar jerarquía de contenido y decoración:

| Nivel | Tratamiento | Uso |
|---|---|---|
| Página | Fondo sólido con gradiente radial muy sutil | Evitar que el fondo compita con el feed |
| Superficie | Fondo opaco o semitransparente de baja variación | Feed, lista, panel principal |
| Elevada | Fondo ligeramente más claro y sombra corta | Card seleccionada, composer, sheet |
| Overlay | Backdrop + superficie opaca suficiente | Modal, galería, menú móvil |
| Acento | Borde o fill de color, no glow permanente | CTA, foco, estado activo |

El glassmorphism se reservará para header sticky, composer y overlays. No se aplicará a cada card: demasiado blur, transparencia y glow reduce contraste, dificulta la lectura y hace que todas las superficies parezcan iguales. La profundidad debe venir principalmente de **niveles de superficie**, no de sombras enormes.

### 2.4. Contraste, movimiento y capacidad de respuesta

WCAG 2.2 incluye criterios para contraste mínimo, contraste de elementos no textuales, reflow, foco visible, teclado, contenido en hover/focus y tiempo suficiente.[7] La guía visual utilizará como objetivo mínimo AA: 4.5:1 para texto normal, 3:1 para texto grande y 3:1 para controles/indicadores no textuales relevantes. El color no será la única señal de estado.

MDN documenta `prefers-reduced-motion` como la forma de detectar la preferencia del usuario para quitar, reducir o reemplazar movimiento no esencial; scaling y panning de elementos grandes pueden resultar problemáticos para personas con trastornos vestibulares.[8]

web.dev define INP como una medición de la latencia de clicks, taps y teclado durante la vida completa de la página, y explica que el navegador debe mostrar feedback visual en el siguiente frame aunque la operación de red tarde más.[9]

> En Chactivo, “se sintió rápido” significa que el botón cambió de estado inmediatamente, no que una operación remota haya terminado mágicamente.

## 3. Sistema visual propuesto

### 3.1. Paleta cromática

La paleta actual conserva magenta, cian y fondo oscuro, pero los colores deben pasar de ser decoración repetida a roles semánticos. Esta propuesta mantiene el ADN visual y reduce el uso indiscriminado de glow.

#### Modo oscuro

| Token | Valor | Uso |
|---|---|---|
| `--color-page` | `#0B1020` | Fondo de aplicación |
| `--color-surface` | `#11182B` | Card y panel principal |
| `--color-surface-elevated` | `#17223A` | Composer, card activa, drawer |
| `--color-surface-hover` | `#1E2B49` | Hover/pressed no destructivo |
| `--color-content-primary` | `#F8FAFC` | Títulos y mensaje principal |
| `--color-content-secondary` | `#B5C0D2` | Descripción, preview y metadata |
| `--color-content-tertiary` | `#8290A7` | Metadata de menor prioridad |
| `--color-action-primary` | `#F472B6` | CTA de intención/conexión |
| `--color-action-guidance` | `#6EE7F2` | Foco, navegación, enlaces y orientación |
| `--color-success` | `#6EE7B7` | Estado real confirmado |
| `--color-warning` | `#F7C96B` | Aviso, expiración o atención |
| `--color-danger` | `#FF8798` | Error, bloqueo o eliminación |
| `--color-content-on-accent` | `#0B1020` | Texto sobre cyan/fucsia claro |

#### Modo claro

| Token | Valor | Uso |
|---|---|---|
| `--color-page` | `#F7F8FC` | Fondo de aplicación |
| `--color-surface` | `#FFFFFF` | Card y panel principal |
| `--color-surface-elevated` | `#F1F4FA` | Card elevada y composer |
| `--color-surface-hover` | `#E8EDF6` | Hover/pressed |
| `--color-content-primary` | `#0B1220` | Títulos y texto principal |
| `--color-content-secondary` | `#48566B` | Descripciones y metadata legible |
| `--color-content-tertiary` | `#62718A` | Metadata secundaria; comprobar en contexto |
| `--color-action-primary` | `#B4236D` | CTA principal con texto blanco |
| `--color-action-guidance` | `#0E7490` | Enlaces, foco y orientación |
| `--color-success` | `#087F5B` | Confirmación |
| `--color-warning` | `#8A5A00` | Aviso |
| `--color-danger` | `#B4233C` | Error/destructivo |
| `--color-content-on-accent` | `#FFFFFF` | Texto sobre action-primary |

El chequeo determinista realizado sobre pares representativos produjo estos ratios: texto primario oscuro sobre fondo oscuro **18.10:1**, texto secundario oscuro sobre superficie **9.61:1**, cian oscuro sobre página **12.96:1**, fucsia oscuro sobre página **7.15:1**, texto primario claro sobre página clara **17.64:1**, cyan oscuro sobre blanco **5.36:1**, fucsia oscuro sobre blanco **6.17:1** y success oscuro sobre blanco **5.00:1**. Son validaciones de pares de referencia; cada componente debe volver a medirse sobre su fondo final.

### 3.2. Tipografía

Se propone conservar **Inter Variable o Inter con fallback system-ui** para evitar el coste de dos familias y mantener estabilidad de layout. La diferencia no debe venir de cargar una fuente decorativa, sino de una escala y jerarquía mejor aplicadas.

| Rol | Tamaño / line-height | Peso | Uso |
|---|---:|---:|---|
| Display | `clamp(2rem, 4vw, 3.5rem)` / 1.05 | 800 | Hero público, sólo una vez por página |
| H1 | `2rem` / 2.4rem | 750 | Título de módulo |
| H2 | `1.375rem` / 1.75rem | 700 | Bloque principal |
| H3 | `1.125rem` / 1.5rem | 650 | Card y sección |
| Body | `0.9375rem` / 1.45rem | 400 | Mensajes y publicaciones |
| Body strong | `0.9375rem` / 1.45rem | 600 | Nombre, CTA textual |
| Label | `0.8125rem` / 1.125rem | 600 | Chips, filtros y controles |
| Meta | `0.75rem` / 1rem | 500 | Hora, estado, conteo real |
| Chat message | `0.9375rem` / 1.45rem | 400/500 | Burbujas entrantes/salientes |

Los títulos deben aceptar dos líneas cuando sea necesario. Nunca se usará `truncate` para ocultar información que determine una acción; se reserva para previews secundarios.

### 3.3. Espaciado, forma, bordes y sombras

La escala base será de 4 px: `space-1=4`, `space-2=8`, `space-3=12`, `space-4=16`, `space-5=20`, `space-6=24`, `space-8=32`, `space-10=40`, `space-12=48`, `space-16=64`. El padding de pantalla será 16 px en móvil, 24 px en tablet y 32 px en desktop amplio.

| Elemento | Radio | Borde | Elevación |
|---|---:|---|---|
| Icon button | 10–12 px | 1 px sutil | Ninguna; feedback por fill/foco |
| Button | 12 px | Sólo outline/secondary | Sombra mínima |
| Chip | 999 px | 1 px semántico | Ninguna |
| Card de feed | 16 px | `1px solid rgba(255,255,255,.10)` dark | `0 8px 24px rgba(0,0,0,.18)` |
| Card de media | 20 px | Borde sutil | `0 12px 36px rgba(0,0,0,.24)` |
| Sheet/drawer | 20 px en esquinas internas | Borde superior/lateral | `0 24px 80px rgba(0,0,0,.36)` |
| Modal | 20–24 px | Borde visible | `0 24px 80px rgba(0,0,0,.42)` |
| Foco | No aplica | `3px solid focus` + offset | No depender sólo de glow |

La animación de botón será aproximadamente 120–160 ms; popover 160–220 ms; drawer 220–280 ms; modal 220–320 ms. Se animarán principalmente `opacity` y `transform`; el modo reducido debe reemplazar movimientos amplios por fade o transición instantánea.

## 4. Fase 2 — Reestructuración visual por módulo

### 4.1. Sistema de Chat: mobile y desktop

#### Diagnóstico visual actual

`ChatPage` ya monta sidebar, header, área de mensajes, composer, columna desktop de usuarios y navegación inferior. `ChatMessages.css` usa una densidad tipo Telegram: grupos de mensajes, burbujas de hasta aproximadamente 78 %, avatares de 34 px, radios unidos y colores distintos para mensajes propios y ajenos. `ChatInput` ya tiene replies, emojis, borradores, chips, ayudas, safe area y estados de foto. La oportunidad no es añadir más widgets; es **ordenar la jerarquía y reducir la competencia visual**.

#### Propuesta de layout

| Viewport | Estructura propuesta |
|---|---|
| 320–767 px | Un solo panel: header 56 px, mensajes, composer sticky y bottom nav de 64 px con safe area |
| 768–1023 px | Panel de chat completo; sidebar como drawer; bottom nav o top navigation según contexto |
| 1024–1279 px | Sidebar de 272–288 px + chat flexible; columna de usuarios se convierte en drawer/context sheet |
| 1280 px o más | Sidebar de 280 px + chat central de 640–760 px + rail de contexto de 280 px |
| 1536 px o más | Mantener ancho legible del chat; el espacio adicional se usa en rail, no en burbujas gigantes |

La lista de conversaciones privadas debe dejar de ser una mezcla visual de acciones y lista. Cada fila tendrá avatar de 40 px, nombre, preview de una o dos líneas, tiempo, badge de no leídos y estado sólo si existe una señal real. Las filas tendrán altura mínima de 68–72 px y estados `default`, `hover`, `selected`, `unread`, `muted` y `offline`.

El panel activo tendrá un header de 60 px con nombre de sala, contexto, menú de acciones y un solo indicador de estado. El cuerpo de mensajes tendrá ancho máximo legible y separación clara entre grupos. Los globos entrantes usarán superficie elevada y los propios un color de acción más oscuro o un gradiente muy controlado; ambos deben conservar texto legible. Las marcas de enviado, entregado y leído aparecerán únicamente cuando el dato exista. Si el estado no está disponible, no se dibujará una marca que parezca confirmación.

El avatar se mostrará en el primer mensaje del grupo y como placeholder de igual ancho en mensajes sucesivos para mantener alineación. La identidad se reducirá a nombre, badge de rol opcional e intención corta cuando exista. El rol nunca debe competir con el texto del mensaje.

El composer se dividirá visualmente en tres zonas: campo principal, acciones multimedia y acción de envío. El campo tendrá mínimo 48 px de alto y crecerá hasta un máximo controlado. Reply preview ocupará una fila contextual con nombre, extracto y cerrar. Emoji picker será una hoja móvil o popover desktop; los emojis no sustituirán labels de botones. El estado de foto tendrá cuatro apariencias: disponible, subiendo, completada y error/reintentar.

#### Microinteracciones

El envío debe limpiar el campo y mostrar feedback inicial inmediatamente, pero mantener una señal de error/retry si la persistencia falla. El indicador de nuevos mensajes será una pill contextual que salta al final; no cubrirá la conversación. Swipe-to-reply en móvil se mantendrá sólo si la acción queda visible y no interfiere con scroll. Typing se mostrará sólo con presencia real y desaparecerá tras timeout. Las animaciones de reacción serán breves, discretas y se desactivarán bajo reduced motion.

#### CTA del chat

El CTA principal del chat es **Enviar mensaje**. Los CTA secundarios son `Responder`, `Abrir privado`, `Adjuntar foto` y `Ver perfil`. La llamada a `Conecta` debe aparecer como contexto cuando existe una conversación o señal real, no como un panel promocional permanente. El usuario vuelve porque puede retomar una conversación y ver una respuesta, no porque el chrome le impida salir.

### 4.2. Sistema de muro / OPIN

#### Diagnóstico visual actual

`OpinFeedPage` tiene una cabecera sticky, filtros `Para ti`, `Más recientes`, `Seguidos` y otros estados, filtros por intención, grid de una a tres columnas, CTA flotante y varias secciones de actividad propia. `OpinCard` ya usa Hugeicons en varias acciones y tiene respuestas inline, seguimiento, buzón, invitación privada y fallback de avatar. Sin embargo, la card principal sigue siendo compacta, usa muchas pills y puede repartir el texto en grids demasiado anchos para una lectura social cómoda.

#### Nueva composición

La estructura objetivo será un **feed editorial legible**, no un tablero de mosaicos. En móvil habrá una columna. En desktop habrá una columna de feed de `min(100%, 720px)` y una rail secundaria de 280 px para `Tu intención`, filtros y reglas de participación. El grid de tres columnas se reservará sólo para una vista exploratoria futura y no será el default para texto.

Cada publicación tendrá:

1. Cabecera: avatar 40 px, nombre, tiempo relativo y estado de intención.
2. Contexto: chip de intención y, si la persona lo eligió, comuna coarse.
3. Texto: máximo de lectura cómodo, con `Ver más` si excede el límite.
4. Resultado: respuestas, interés o estado; sólo con datos reales.
5. Acción primaria: `Responder` o `Ver respuestas`.
6. Acciones secundarias: `Seguir`, `Buzón`, menú de seguridad y, cuando corresponda, `Invitar a privado`.

La card tendrá variantes `default`, `nueva`, `siguiendo`, `con respuestas`, `cerrada` y `propia`. No se cambiará el color completo de cada card según la intención: se usará un acento corto en el chip para evitar un feed visualmente ruidoso. `Cita`, `Conversar`, `Amistad` y otras categorías deben distinguirse por label y forma, no sólo por color.

Las reacciones se convertirán en una fila horizontal de icon buttons con nombre accesible, estado pressed y conteo. No se mostrarán emojis como sustitutos de un sistema iconográfico consistente. Si una reacción aún se representa con emoji por compatibilidad, se la encapsulará con label, tooltip y token de color.

#### Flujo de publicación

El CTA de creación será `Abrir intención` o `Publicar intención`, no una acción ambigua de “opinar”. El composer se diseñará en una tarjeta/hoja de tres pasos ligeros: qué busca la persona, qué zona aproximada desea compartir y cuándo está disponible. Se incluirá un preview antes de publicar y un estado posterior `Activa`, `Pausada` o `Cerrada`.

La cabecera explicará el circuito: **publica → recibe respuestas → pasa a privado si hay consentimiento → actualiza o cierra la intención**. En móvil, el CTA será un FAB accesible o botón sticky sólo cuando no tape el contenido; en desktop será un botón de cabecera. Nunca habrá contadores de actividad ficticios para dar sensación de vida.

#### Retorno visual

El motivo de retorno aparecerá como un centro de novedades real: `3 respuestas nuevas`, `1 interés nuevo`, `tu intención vence pronto` o `sin novedades desde tu última visita`. Las novedades se agruparán en una sección colapsable y no en banners repetitivos. Para que el usuario sienta progreso, la propia card mostrará el estado de su intención y el siguiente paso disponible.

### 4.3. El Baúl

#### Diagnóstico y estado

La card de `TarjetaUsuario` ya contiene una base media-first: proporción 4:5, imagen dominante, overlay, segunda foto, blur/reveal, estado, rol, intención, comuna coarse y CTAs `Me interesa`, privado y huella. `BaulSection` añade header sticky, refresh, filtros y orden reciente. Esta base es aprovechable, pero Baúl continúa pausado por `ENABLE_BAUL=false`; la propuesta visual no debe interpretarse como activación operativa.

#### Galería y grid

| Viewport | Galería propuesta |
|---|---|
| 320–767 px | Grid de 2 columnas, gap 12 px, ratio 4:5, información mínima sobre la foto |
| 768–1023 px | Grid de 2–3 columnas, filtros en bottom sheet o toolbar |
| 1024–1279 px | Rail de filtros de 240–280 px + grid de 3 columnas |
| 1280 px o más | Rail + grid de 3–4 columnas, max-width 1280–1440 px |

En la miniatura sólo aparecerán nombre, estado real si existe, intención corta y una etiqueta contextual. Las acciones completas no se amontonarán dentro de cada tile. Al tocar una tarjeta en móvil se abrirá un detail sheet con foto, bio, intención y tres acciones ordenadas: `Me interesa`, `Abrir privado` y menú secundario. En desktop, hover puede revelar acciones sin ocultarlas para teclado.

El visor modal tendrá fondo de contraste alto, foto con `object-contain`, navegación por flechas y swipe, contador `1/2`, thumbnails opcionales, cierre visible, Escape, foco atrapado y restaurado. La transición entre fotos será crossfade corto. El contenido sensible usará blur/reveal con copy claro, sin convertir el blur en una promesa de seguridad absoluta.

Los filtros serán chips de intención y estado, con una opción de zona coarse si el usuario la eligió. No se mostrará distancia exacta ni se inferirá proximidad sin consentimiento. Las cards con intención vencida bajarán de énfasis, pero permanecerán legibles y no se presentarán como disponibilidad actual.

### 4.4. Áreas globales, paneles y cards

La cabecera global actual mezcla marca, navegación, tema, notificaciones, avatar y CTA visitante. La reestructuración visual debe separarla en cuatro grupos: marca, navegación primaria, utilidades y cuenta. En móvil la navegación primaria se mueve a una bottom bar de máximo cuatro destinos: `Chat`, `OPIN`, `Baúl` cuando esté activo y `Conecta`. `Canales` será secundario dentro del chat o de un sheet; no debe competir como quinto destino permanente.

El CTA visitante será un único `Entrar al chat` o `Explorar OPIN`, según la pantalla. Se eliminarán adornos que parezcan una oferta o actividad no confirmada, incluido el uso de emoji como el cohete en un botón de navegación. Las acciones de tema, notificaciones y cuenta usarán icon buttons con labels.

Los paneles laterales y menús flotantes usarán el patrón de sheet: backdrop, cierre, focus management, scroll interno y ancho máximo. En desktop se convierten en rail o panel fijo cuando el espacio lo permite. Los empty states deben tener icono, título, explicación de una frase y una acción; nunca un bloque de números inventados.

## 5. Matriz de especificación visual

| Módulo | Problema visual detectado | Patrón 2026 recomendado | Impacto visual esperado |
|---|---|---|---|
| Global | Colores y gradientes aparecen sin jerarquía común | Tokens primitivo → semántico → componente | Marca unificada y menor ruido |
| Global | Glassmorphism repetido en demasiadas superficies | Glass sólo en shell/overlay; surfaces opacas por niveles | Mejor contraste y profundidad más profesional |
| Global | Header mezcla marca, CTA y utilidades | Header por grupos + CTA único | Comprensión más rápida |
| Global | Cinco destinos pueden competir en navegación móvil | Bottom bar de máximo cuatro; secundarios en sheet | Menos carga cognitiva |
| Global | Iconos y emojis conviven sin criterio | Hugeicons para acciones nuevas; labels accesibles; compatibilidad gradual | Mayor coherencia y reconocimiento |
| Chat | Sidebar, chat y rail no tienen una jerarquía responsive explícita | Desktop de dos/tres columnas; móvil de una tarea + drawer | Más espacio útil y orientación clara |
| Chat | Burbuja y metadata pueden competir | Bubble max 640–760 px, metadata secundaria y grupos | Lectura más cómoda |
| Chat | Estados de lectura podrían parecer confirmados aunque falte dato | Mostrar enviado/entregado/leído sólo si existe | Confianza y comprensión |
| Chat | Composer reúne demasiadas ayudas | Campo principal + tools secundarios + feedback inline | Menos fricción para escribir |
| Chat | Foto necesita estados visibles | Disponible/subiendo/éxito/error/retry | Menos incertidumbre |
| OPIN | Grid amplio reduce lectura del texto | Feed de 720 px + rail contextual desktop | Más legibilidad y conversación |
| OPIN | Muchas pills de colores saturan la vista | Una etiqueta de intención + estados semánticos | Más foco en la publicación |
| OPIN | Reacciones dependen de emoji | Icon buttons con pressed/count/tooltip | Mejor comprensión y accesibilidad |
| OPIN | CTA de publicación no comunica resultado | `Publicar intención` + preview + estado | Mayor claridad de propósito |
| OPIN | Retorno disperso en varias secciones | Centro de novedades real y estado de intención | Más motivos legítimos para volver |
| Baúl | Media y acciones pueden competir | Tile 4:5 + detail sheet/modal con CTA jerarquizado | Consumo visual rápido sin perder contexto |
| Baúl | Visor necesita contexto y control | Lightbox accesible con swipe, arrows, counter y reveal | Mejor consumo y seguridad percibida |
| Baúl | Geolocalización puede dominar la card | Zona coarse opt-in, sin distancia exacta | Privacidad y confianza |
| Baúl | Función pausada puede parecer rota | Empty state de disponibilidad explícita | Expectativa correcta hasta activar backend |
| Cards | Radios, sombras y bordes varían por módulo | Shape/elevation tokens | Lenguaje visual consistente |
| Responsive | Elementos se ocultan sin una estrategia común | Mobile-first + Auto Layout + min/max + reflow | Menos saltos y mejor uso en 320 px |
| Motion | Animaciones grandes o permanentes distraen | Duraciones cortas, causalidad y reduced motion | Sensación de calidad sin fatiga |

## 6. Plan técnico de implementación visual

### Fase 0 — Figma y contrato visual

Crear un archivo Figma con páginas `Foundations`, `Components`, `Chat`, `OPIN`, `Baúl` y `Responsive QA`. Definir variables de color, spacing, typography, radius, elevation y motion. Crear componentes con variantes `default`, `hover`, `pressed`, `focus`, `disabled`, `loading`, `error` y `empty`. Probar contenido largo y ausencia de avatar antes de exportar cualquier especificación.

Los componentes mínimos de Figma serán `AppShell`, `Header`, `BottomNav`, `IconButton`, `Avatar`, `StatusPill`, `Surface`, `ConversationRow`, `MessageBubble`, `Composer`, `OpinCard`, `IntentChip`, `BaulMediaCard`, `DetailSheet` y `MediaViewer`.

### Fase 1 — Tokens y primitives en React/Tailwind 3

Mantener `src/index.css` como fuente CSS compatible con Tailwind 3.3.3. Añadir tokens semánticos para página, superficie, contenido, acción, foco, estado, spacing, radius, elevation y motion. Evitar introducir `@theme` de Tailwind 4 en este repositorio.

Crear o consolidar primitives reutilizables en `src/components/ui/`: `Surface`, `IconButton`, `StatusPill`, `Avatar`, `EmptyState`, `Sheet` y `FocusRing`. Usar Radix para Dialog, Select, Dropdown, Tabs, ScrollArea y Label. No instalar Bootstrap; reutilizar su patrón Offcanvas con los primitives existentes.

Criterio de salida: no más de un conjunto de tokens para cada rol, foco visible, dark/light consistente, no degradación del layout actual y una matriz de contraste documentada.

### Fase 2 — Shell global y navegación

Refactorizar visualmente `Header`, `Footer`, `ChatBottomNav` y wrappers de página, sin cambiar todavía el contrato de datos. Separar marca, navegación, utilidades y cuenta. Limitar la bottom navigation a cuatro destinos cuando Baúl esté habilitado. Eliminar la dependencia visual de emojis para acciones de navegación.

Criterio de salida: el usuario identifica Chat, OPIN, Conecta y la salida de la pantalla en menos de cinco segundos; no existe un CTA duplicado que compita por prioridad.

### Fase 3 — Chat

Aplicar el layout responsive a `ChatPage`, `ChatSidebar`, `ChatHeader`, `ChatMessages`, `ChatInput`, `ChatOnlineUsersColumn` y `ChatBottomNav`. Extraer `ConversationRow`, `MessageBubble`, `MessageGroup`, `UnreadPill`, `ComposerToolbar` y `AttachmentState` sin reescribir la lógica de persistencia.

Prioridades visuales: una sola acción primaria por superficie, estados de envío inmediatos, feedback de error/retry, composer estable sobre teclado y safe area, rail desktop sólo cuando haya ancho y drawers con foco correcto.

Criterio de salida: 320, 360, 390, 430, 768, 1024, 1280 y 1536 px; teclado; Escape; Tab; reduced motion; light/dark; mensaje largo; imagen pendiente/error; conversación vacía y desconectada.

### Fase 4 — OPIN

Rediseñar `OpinCard`, `OpinFeedPage`, `OpinCommentsModal` y el composer de nueva intención. Pasar de grid de cards compactas como default a feed legible con rail contextual en desktop. Simplificar reacciones, ordenar CTA, mejorar estados y hacer visible el ciclo publicar → responder → privado → actualizar/cerrar.

No modificar el significado de los datos en esta fase. No inventar conteos para llenar la card. Si una métrica no está disponible, usar estado vacío o no mostrarla. Los colores de intención deben ser tokens y no combinaciones hex repetidas.

Criterio de salida: una persona puede identificar autor, intención, antigüedad, respuestas y acción principal sin abrir un menú; una publicación propia muestra su siguiente paso.

### Fase 5 — Baúl

Cuando producto y backend autoricen su reactivación, aplicar el nuevo grid a `BaulSection`, `TarjetaUsuario`, `MatchModal` y el visor de media. La implementación visual debe mantenerse compatible con `ENABLE_BAUL=false`: el estado pausado será un empty state deliberado, no una pantalla que simule tarjetas.

Criterio de salida visual: tile legible en dos columnas móviles, detalle accesible, visor usable con teclado/touch, blur/reveal controlado, CTA jerarquizado, avatar con fallback y zona coarse. La activación funcional exige una validación separada de Auth, Storage, RLS, RPC y Realtime; este plan no la ejecuta.

### Fase 6 — QA visual y medición

Usar una matriz de pruebas con los viewports indicados, zoom de 200 %, contraste medido, navegación por teclado, lector de pantalla básico, `prefers-reduced-motion`, red lenta, estados vacíos y contenido de longitud extrema. Ejecutar build y tests locales después de cada fase.

Medir en campo sólo después de desplegar y con consentimiento: CTR de `Entrar al chat`, primer mensaje, publicación de intención, respuesta a OPIN, transición a privado, retorno a 7 días, error de upload y Web Vitals/INP. Estas métricas son criterios de evaluación, no promesas de crecimiento.

## 7. Orden recomendado de trabajo

| Orden | Entrega | Riesgo | Motivo |
|---:|---|---|---|
| 1 | Tokens, surfaces, typography, button/icon states | Bajo | Evita rediseñar cada módulo con valores distintos |
| 2 | Header, bottom nav, sheets y empty states | Medio | Hace visible la nueva identidad desde cualquier ruta |
| 3 | Chat shell y composer | Medio | Es el activo central y tiene más tráfico/uso |
| 4 | OPIN feed/card/composer | Medio | Convierte el muro en producto reconocible |
| 5 | Baúl grid/detail/viewer | Alto | La función sigue pausada y no debe activarse sólo por estética |
| 6 | QA visual, accesibilidad y performance | Medio | Evita confundir un screenshot atractivo con calidad operativa |

## 8. Criterios de éxito y límites

El éxito visual no será “añadir más brillo”. Será que una persona reconozca una acción principal, lea el contenido sin pelear con la interfaz, entienda los estados, pueda navegar con dedo o teclado y perciba que Chat, OPIN y Baúl pertenecen al mismo producto.

No se promete una tasa específica de conversión, retención o crecimiento. La retención visual sólo puede medirse con tráfico real y cohortes reales. La propuesta tampoco certifica que Storage, Realtime, RLS o cualquier función remota esté operativa. El plan es estrictamente visual y no sustituye la validación de backend.

## Referencias

[1]: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout "Figma Learn — Guide to auto layout"

[2]: https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma "Figma Learn — Guide to variables in Figma"

[3]: https://tailwindcss.com/docs/responsive-design "Tailwind CSS — Responsive design"

[4]: https://getbootstrap.com/docs/5.3/components/offcanvas/ "Bootstrap 5.3 — Offcanvas"

[5]: https://m3.material.io/foundations/design-tokens "Material Design 3 — Design tokens"

[6]: https://www.radix-ui.com/primitives/docs/overview/accessibility "Radix Primitives — Accessibility"

[7]: https://www.w3.org/TR/WCAG22/ "W3C — Web Content Accessibility Guidelines 2.2"

[8]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion "MDN — prefers-reduced-motion CSS media feature"

[9]: https://web.dev/articles/inp "web.dev — Interaction to Next Paint"

[10]: https://tailwindcss.com/docs/theme "Tailwind CSS — Theme variables"
