# CHACTIVO MASTER AUDIT

**Auditoría forense y plan de reestructuración local — 27 de agosto de 2026**  
**Autor:** Manus AI  
**Repositorio:** `/home/ubuntu/chactivo_clean_recovery`  
**Rama:** `audit/revision-extensa-2026`  
**Alcance:** código local, build local, pruebas estáticas, navegación pública de producción y benchmark de 20 productos/referentes oficiales.

> **Regla de evidencia.** Este informe distingue entre observación de producción, evidencia del repositorio local, resultado de pruebas locales e hipótesis de producto. No se afirma que una función remota esté operativa solo porque exista un componente, una migración o un adapter. Producción y Supabase remoto no fueron mutados ni verificados end-to-end en esta fase.

## A. Executive Summary

Chactivo tiene una base funcional valiosa, pero su problema principal no es la falta de funcionalidades. El problema es la distancia entre la promesa pública, la actividad real y los contratos técnicos que todavía dependen de validación remota. La reactivación debe comenzar por **confianza, claridad y utilidad inmediata**: una persona debe entender qué puede hacer, comprobar qué actividad existe, entrar sin fricción excesiva, protegerse y tener un motivo legítimo para volver.

La evidencia pública observada mostró cuatro bloqueos principales: `/mas-30` presentó un error visible; `/global` y `/santiago` mostraron actividad, testimonios, cifras o demos que no podían atribuirse a actividad real; `/politica-privacidad.html` devolvió 404; y `/faq` duplicó parte del layout global. El código local confirmó que la demo de chat contenía nombres, mensajes, reacciones, contador y temporizadores hardcodeados. Esa combinación perjudica conversión, SEO, credibilidad y exposición legal.

La corrección local aplicada elimina la actividad sintética de las entradas públicas corregidas, repara los documentos legales locales, evita el layout duplicado de FAQ, marca las salas dinámicas como noindex por defecto, retira satélites regionales del sitemap, reescribe el HTML SEO estático y añade una primera capa de tokens visuales, foco visible y reduced motion. No se ha realizado un rediseño completo de OPIN, perfiles, chat privado o Baúl: esos productos requieren una auditoría funcional conectada a los contratos reales y no deben ser maquillados como terminados.

El diferenciador defendible de Chactivo no es afirmar que tiene más usuarios que Grindr, SCRUFF o una red social. Es combinar **entrada web rápida, intención explícita en OPIN, contexto regional de grano grueso, continuidad entre chat y privado, y transparencia sobre actividad real**. Esa propuesta solo funcionará si se mantiene la prohibición de bots, semillas, contadores y testimonios inventados.

## B. System Map

El sistema real es una aplicación React 18 con Vite, Tailwind, React Router, Firebase heredado, Supabase preparado y varios proveedores/contextos. El repositorio no es un producto pequeño: contiene rutas públicas, autenticación, chat, OPIN, perfiles, media, solicitudes privadas, presencia, moderación, administración, integraciones de analítica y compatibilidad legacy.

| Capa | Evidencia local | Estado que puede afirmarse | Límite de evidencia |
|---|---|---|---|
| Frontend | React 18, Vite 4.5.14, Tailwind 3.3, Router 7.18 | El código y las rutas existen; el build local finaliza | No implica que cada flujo de navegador funcione contra datos reales |
| Autenticación | `AuthContext`, `SupabaseAuthProvider`, selector en `src/config/supabase.js` | Supabase-first está preparado bajo las dos flags requeridas; Firebase conserva compatibilidad histórica | No se verificó Auth remoto ni migración de cuentas antiguas |
| Datos | 35 migraciones Supabase y adapters de chat/perfiles/media/OPIN/Baúl/presencia | Existe un diseño local amplio | No se ejecutó SQL remoto, no se comprobó esquema, RLS ni RPC |
| Chat público | `ChatPage.jsx`, `supabaseChatService.js`, servicios históricos | El componente conserva contratos de replies, reacciones, media y Realtime | No se afirmó que envío de fotos, Storage o Realtime funcionen en el proyecto remoto |
| Chat privado | `supabasePrivateChatService.js`, receipts, typing, requests | Hay adapter y contratos estáticos | No se inspeccionaron conversaciones privadas ni se hizo prueba con dos cuentas |
| OPIN | `OpinFeedPage`, servicios y migraciones | Hay muro público con potencial y contenido observado en producción | La política de edad, moderación, publicación y noindex requiere validación de producto |
| Baúl | Servicios, componentes y SQL local | La capacidad está desactivada intencionalmente por `ENABLE_BAUL=false` | No debe declararse recuperado hasta probar Storage/RLS/Realtime/RPC |
| Hosting | Vite/Vercel esperado por el proyecto | El build local produce `dist` y HTML estático | No hubo deploy ni comprobación de Vercel después de los cambios |

La decisión arquitectónica vigente es **Supabase-first para registros, sesiones y funciones nuevas**. Firebase permanece solo como fuente histórica transitoria de cuentas antiguas. No se debe dejar un fallback Firestore silencioso que se active para una sesión Supabase, y no se deben usar Firebase Functions pagadas para funcionalidades nuevas.

## C. Routes

`App.jsx` es el mapa autoritativo de rutas. La aplicación conserva aliases y rutas históricas para no romper enlaces, pero no todas son destinos indexables ni deben recibir el mismo tratamiento SEO.

| Grupo | Rutas principales | Tratamiento local recomendado |
|---|---|---|
| Entrada principal | `/`, `/global` | Indexables solo con contenido público real y CTA único |
| Regiones | `/ar`, `/mx`, `/es`, `/br` | Indexables mientras mantengan idioma/contexto útil y no prometan actividad local no verificada |
| Contexto local | `/santiago`, `/mas-30` | Indexables como landings diferenciadas; sin barrios activos, ratings o testimonios inventados |
| Aliases SEO | `/gay`, `/landing`, `/chat-gay-chile`, `/chat-gay-santiago-centro`, `/argentina`, `/mexico`, `/brasil`, `/españa` | Redirección o noindex/canonical según el alias; no duplicar contenido en sitemap |
| Satélites locales | `/mx/cdmx`, `/ar/buenos-aires`, `/es/madrid`, `/br/sao-paulo` | Noindex y fuera del sitemap hasta tener contenido y demanda propios verificables |
| Chat dinámico | `/chat/:roomId`, `/anonymous-chat` | Noindex por defecto; contenido cambiante, UGC y posible sesión |
| OPIN | `/opin` | Noindex mientras se formalizan edad, moderación, privacidad y contenido UGC |
| Cuenta | `/auth`, `/home`, `/inicio`, `/lobby`, `/profile/*` | Noindex; superficies autenticadas o personales |
| Privado | `/private/*`, solicitudes y conversaciones | Noindex; nunca indexar datos personales |
| Administración | `/admin`, `/admin/*` | Bloqueado por robots y noindex; acceso autorizado |
| Legacy | `/chat`, `/chat/global`, `/chat/amistad`, `/chat/quedar-ya`, `/foro-gay`, `/anonymous-forum`, `/gaming` | Compatibilidad con notice/redirección, noindex y sin promesa de producto activo |
| Desarrollo | `/test`, `/test-modal`, `/es-test` | Solo bajo `import.meta.env.DEV`; comprobar que no se exponen en producción |

La política local no bloquea por `robots.txt` las rutas que necesitan que el crawler lea su `noindex`; sí mantiene fuera del sitemap las superficies dinámicas y los satélites noindex. Esta distinción evita esconder una URL antes de que pueda descubrir su directiva de exclusión.

## D. Function Inventory

El inventario identifica piezas que deben conservarse y piezas que necesitan verificación o reconstrucción. La existencia de un import no equivale a una función operativa.

| Función | Componentes/adapters observados | Valor para el usuario | Estado de auditoría |
|---|---|---|---|
| Entrada al chat | `ChatPage`, landings, selección de alias | Conversar ahora | Contrato local conservado; backend remoto pendiente |
| Mensajes y replies | `supabaseChatService`, `ChatPage` | Contexto y continuidad | Prueba estática, no E2E remoto |
| Reacciones | Adapter y UI histórica | Señal ligera de interés | Requiere verificar agregación y RLS |
| Fotos en chat | `ChatInput`, media services y Storage adapters | Expresión y confianza | Punto crítico: existencia local no demuestra Storage/RLS operativo |
| Perfil y avatar | perfiles, fallback y normalización de media | Identidad consistente | Debe probarse la misma fuente en chat, OPIN, privado y Baúl |
| OPIN | feed, publicación, respuestas, reacciones | Publicar una intención y recibir contexto | Potencial alto; UX y política UGC incompletas |
| Chat privado | requests, typing, receipts, notificaciones | Continuar una conversación con consentimiento | Contrato local; no validado con dos usuarios reales |
| Bloqueo/reporte | componentes y servicios de moderación | Reducir riesgo y recuperar control | Debe situarse cerca de cada acción y verificarse contra RLS |
| Presencia | adapters de presencia/realtime | Saber si una sala está viva | No se deben mostrar contadores si no hay fuente real y ventana explicada |
| Baúl | cards/matches/media/presencia | Descubrimiento por intención | Desactivado por política hasta validación real |
| Autenticación | Supabase provider y Firebase histórico | Sesiones nuevas y compatibilidad antigua | Migración preparada; remoto pendiente |
| Legal y ayuda | FAQ, normas, términos, privacidad, aviso legal | Confianza antes de publicar | Rutas locales reparadas; datos del titular pendientes |
| Analítica | `eventTrackingService` y eventos de funnel | Medir acciones reales | No debe generar actividad ni usar métricas ficticias |
| Administración | `AdminPage` y utilidades legacy | Moderación y operación | Código grande y condicionado; requiere plan separado |

## E. Hidden, Unlinked and Legacy Code

El repositorio conserva componentes y servicios que no están necesariamente enlazados desde la navegación actual. Entre ellos aparecen páginas antiguas de gaming, foro anónimo, landings regionales, modales de prueba, componentes de demos, servicios Firebase, migraciones, respaldos, utilidades de administración y adapters alternativos. Se deben auditar como **superficie de deuda**, no borrarlos a ciegas: una ruta legacy puede tener enlaces históricos, y un adapter puede ser requerido por fallback de cuentas antiguas.

| Zona oculta o desconectada | Riesgo | Acción segura |
|---|---|---|
| `/test`, `/test-modal`, `/es-test` | Exposición accidental de herramientas | Mantener guardas DEV y comprobar build de producción |
| `GamingLandingPage`, `AnonymousForumPage` | Copy SEO antiguo y promesas incompatibles | Dejar fuera del router público o marcar legacy; no reutilizar copy sin revisar |
| Demos de landing | Riesgo de actividad sintética | Sustituir por estados explicativos o datos reales autorizados |
| Firebase services | Fallback silencioso y bundle grande | Mantener solo compatibilidad histórica; mapear consumidores antes de retirar |
| Migraciones SQL y backups | Falsa sensación de backend listo | Versionar y documentar; ejecutar manualmente en staging, nunca asumir éxito |
| Admin y cleanup legacy | Mutaciones peligrosas o contratos opacos | No tocar masivamente; probar módulos con entorno seguro y cuenta autorizada |
| Tracking/monkey patches | Silenciamiento de errores y diagnósticos opacos | Reducir gradualmente; nunca ocultar errores de UX o seguridad |

La auditoría no leyó chats privados ni perfiles privados. Tampoco creó cuentas de prueba, importó datos, hizo backfill ni ejecutó una operación remota.

## F. Problem Register

| Prioridad | Problema | Evidencia | Impacto | Tratamiento |
|---|---|---|---|---|
| P0 | Error visible en `/mas-30` | Producción mostró “Algo salió mal”; el código tenía callback inconsistente y uso de `React` no importado en la versión previa | Pérdida de tráfico y confianza | Landing local reemplazada y handler definido; build local pasa |
| P0 | Actividad pública sintética | Demo con nombres, mensajes, reacciones, contador y timers | Engaño, calidad SEO, riesgo legal | `ChatDemo` neutral y landings reescritas |
| P0 | Política de privacidad 404 | Producción devolvió Vercel `404: NOT_FOUND` | Confianza y cumplimiento | Documento local agregado; producción requiere deploy autorizado |
| P0 | Términos con asistentes automatizados | Documento histórico describía asistentes | Contradicción con la política actual | Términos locales reescritos |
| P0 | Claims absolutos | “100% anónimo”, E2EE, borrado en 24 h, 24/7, sin trackers y cifras no demostradas | Exposición y expectativas falsas | Retirados de superficies corregidas; confirmar legalmente antes de volver a prometer |
| P1 | FAQ duplicada | Header/Footer propios dentro de `MainLayout` | Ruido y reflujo | Importaciones de layout eliminadas |
| P1 | SEO oculto y copy para crawler | `sr-only` y frases sobre captar intención/Google/cluster | Contenido poco útil y posible doorway | SEOLanding y generador reescritos con contenido visible y humano |
| P1 | Satélites en sitemap pese a noindex | El sitemap local incluía ciudades satélite sin valor verificado | Señales contradictorias y thin content | Fuera del sitemap; noindex estático/runtime |
| P1 | Chat enorme | `ChatPage.jsx` ~8.548 líneas | Regresión y mantenimiento costosos | No se hizo refactor destructivo; dividir por submódulos después de mapear tests |
| P1 | Bundle Firebase grande | `firebase-vendor` ~698,43 KB sin gzip | Carga/parseo móvil | Medir consumidores; separar o retirar gradualmente |
| P1 | OPIN visualmente antiguo | Persisten cartas, emojis y colores históricos en la superficie funcional | Diferenciación baja | Próximo ciclo: intención, respuestas, estados, iconos y avatar real |
| P1 | Media/avatar no probado remotamente | El código existe, la experiencia reportada mostró imágenes rotas | Confianza y continuidad | Prueba controlada de Storage/RLS y fuente de avatar pendiente |
| P1 | Baúl no verificable | Flag apagada y SQL sin prueba remota | Falsa promesa si se activa | Mantener `ENABLE_BAUL=false` |

## G. Twenty Competitors and Reference Products

El benchmark de este ciclo cubre **20 productos o referentes**. No se inventan cifras de usuarios ni se presentan como equivalentes de negocio. Se observan patrones de producto y comunicación en sus superficies oficiales.

| # | Producto | Tipo | Patrón relevante observado | Lección transferible a Chactivo |
|---:|---|---|---|---|
| 1 | [Grindr][11] | Descubrimiento gay | Entrada directa a perfiles, proximidad y filtros | Si Chactivo usa contexto local, debe ser opt-in y de grano grueso; no fingir precisión |
| 2 | [SCRUFF][12] | Dating gay | Perfil, intereses, eventos y continuidad | Un perfil útil necesita intención y límites, no solo avatar |
| 3 | [Taimi][13] | Red LGBTQ+ | Mezcla de social, dating y comunidad | Explicar la propuesta evita que chat, muro y perfil compitan sin jerarquía |
| 4 | [Hornet][14] | Red social gay | Feed, perfiles y contenido comunitario | OPIN puede ser un muro contextual, pero debe moderarse y tener siguiente paso |
| 5 | [ROMEO][15] | Dating/chat gay | Presencia y descubrimiento con estados reales | Es preferible mostrar cero actividad a inventar un contador |
| 6 | [JACK'D][16] | Dating gay | Descubrimiento móvil y perfiles | El catálogo solo sirve si los perfiles y permisos son reales |
| 7 | [Daddyhunt][17] | Dating gay | Segmento e identidad de nicho | Una intención de edad o estilo puede mejorar afinidad si no estigmatiza |
| 8 | [GROWLr][18] | Dating gay | Comunidad por interés/identidad | La segmentación debe ser voluntaria, no inferida de GPS o apariencia |
| 9 | [Lex][19] | Social queer | Publicaciones basadas en texto e intención | OPIN debe comunicar “publica lo que buscas” y facilitar respuestas |
| 10 | [HER][20] | Comunidad LGBTQ+ | Comunidad, seguridad, grupos y eventos | Seguridad visible cerca de publicar y conversar es parte del producto |
| 11 | [Feeld][21] | Conexiones e identidades | Intenciones y acuerdos explícitos | OPIN puede usar etiquetas de intención sin convertirlas en promesas |
| 12 | [MR X][22] | Dating gay | Perfil y comunicación segmentada | La tarjeta debe llevar a una acción y explicar qué se puede compartir |
| 13 | [Queer Social][23] | Comunidad LGBTQ+ | Comunidad y pertenencia | Ritual y grupos reales pueden retener más que un contador |
| 14 | [Bumble][24] | Dating | Intención y límites de contacto | El consentimiento y el control de solicitudes deben ser visibles |
| 15 | [Discord][25] | Comunidad/chat | Canales persistentes, historial y roles | El retorno del chat necesita memoria, respuestas y normas claras |
| 16 | [Tinder Safety][26] | Dating/seguridad | Recursos de seguridad junto a la acción | Reporte, bloqueo y prevención deben estar a un toque |
| 17 | [Meetup][27] | Grupos/eventos | Actividad organizada por intereses | Eventos solo cuando existan organizadores, fecha y asistencia reales |
| 18 | [Reddit][28] | Comunidad/UGC | Gobernanza, moderación y reglas | OPIN necesita política de publicación y herramientas operativas, no solo feed |
| 19 | [Telegram][29] | Mensajería | Historial, grupos y continuidad entre dispositivos | Las conversaciones deben ser retomables y no desaparecer sin explicación |
| 20 | [Signal][30] | Mensajería privada | Privacidad clara y comunicación controlada | No prometer E2EE; explicar con precisión qué protege cada canal |

## H. Competitive Matrix: 20 Transferable Ideas

La siguiente matriz no propone copiar todas las funciones. Prioriza ideas según impacto esperado para el dolor observado, dificultad local aproximada, riesgo y compatibilidad con la dirección Supabase-first. Impacto y dificultad son **priorización cualitativa**, no una predicción de tráfico.

| # | Idea | Referente/patrón | Impacto | Dificultad | Riesgo | Compatibilidad |
|---:|---|---|---|---|---|---|
| 1 | CTA único “Entrar al chat” | Grindr, ROMEO | Alto | Baja | Bajo | Alta |
| 2 | Estado honesto de actividad | ROMEO, Discord | Alto | Media | Bajo | Alta |
| 3 | OPIN como publicación de intención | Lex, Hornet | Alto | Media | Medio | Alta |
| 4 | Etiquetas opt-in: conversar, conocer, salir | Feeld, Taimi | Alto | Media | Medio | Alta |
| 5 | Contexto regional sin GPS exacto | Grindr, Meetup | Medio | Media | Alto si se excede | Alta si es coarse/opt-in |
| 6 | Cohorte de mayores de 30 sin testimonios | Daddyhunt | Medio | Baja | Bajo | Alta |
| 7 | Historial y respuestas retomables | Discord, Telegram | Alto | Media | Medio | Alta |
| 8 | Solicitud privada con consentimiento | Bumble, Tinder | Alto | Media | Medio | Alta |
| 9 | Avatar desde una fuente de verdad | Todas las apps de perfil | Alto | Media | Alto si Storage falla | Alta tras validar Storage |
| 10 | Subida de foto con loading/error/retry | Dating móvil | Alto | Media | Alto si RLS falla | Alta tras SQL/RLS |
| 11 | Bloqueo/reporte junto a mensaje o perfil | Tinder Safety, HER | Alto | Media | Alto | Alta |
| 12 | Normas de comunidad antes de publicar | Reddit, Meetup | Medio | Baja | Bajo | Alta |
| 13 | Moderación operable y trazable | Reddit, Discord | Alto | Alta | Alto | Alta, requiere backend |
| 14 | Eventos únicamente verificados | Meetup, Queer Social | Medio | Alta | Alto si se inventan | Condicionada |
| 15 | Onboarding progresivo, no pared de instrucciones | Taimi, Bumble | Alto | Media | Bajo | Alta |
| 16 | Métricas solo de acciones reales | Todas las plataformas maduras | Alto | Baja | Bajo | Alta |
| 17 | Estados offline/retry visibles | Telegram, Signal | Alto | Media | Medio | Alta |
| 18 | Experiencia de bajo ancho de banda | Web móvil | Medio | Media | Bajo | Alta |
| 19 | Privacidad y borrado explicados sin promesas | Signal, HER | Alto | Media | Alto legal | Condicionada a operación real |
| 20 | Diseño consistente de iconos y foco | Apps accesibles | Medio | Baja | Bajo | Alta |

La recomendación es ejecutar primero las ideas 1, 2, 3, 8, 9, 10, 11, 12, 15, 16, 17 y 20. Las ideas 5, 13, 14 y 19 requieren más validación de backend, legalidad o moderación y no deben convertirse en marketing antes de estar operativas.

## I. SEO

La estrategia SEO se alinea con el principio de que el contenido debe servir primero a las personas. Google Search Central recomienda contenido útil y único, títulos y descripciones descriptivos, URLs coherentes, canonicalización y evitar prácticas destinadas a manipular la indexación; además, el meta tag `keywords` no es una señal de posicionamiento.[1]

La implementación local sustituye `sr-only` SEO por contenido visible, elimina la generación de meta keywords en `SEOLanding`, establece `indexable` explícito, mantiene alternates solo en hubs equivalentes y marca satélites como noindex. El generador estático ahora entrega un shell humano antes de hidratar, sin textos sobre “captar intención”, “dar a Google”, “cluster semántico” o “dominancia semántica”.

| Superficie | Directiva | Razón |
|---|---|---|
| `/` | `index,follow` | Propuesta principal y contenido público útil |
| `/faq` | `index,follow` | Respuestas públicas mantenibles |
| `/normas-comunidad` | `index,follow` | Confianza y gobernanza |
| `/santiago`, `/mas-30` | `index,follow` si se conserva contenido diferenciado | Contexto humano, sin actividad falsa |
| `/ar`, `/mx`, `/es`, `/br` | `index,follow` mientras tengan idioma/contexto real | Hubs regionales, no doorway pages |
| Satélites regionales | `noindex,nofollow` y fuera del sitemap | Poco valor diferenciado actualmente |
| `/chat/*` | `noindex,nofollow` por defecto | UGC dinámico, sesión y cambios constantes |
| `/opin` | `noindex,nofollow` por defecto | UGC que puede incluir contexto sensible |
| Perfil, privado, auth, premium, admin | `noindex` | Datos personales o superficie operativa |

La indexación no garantiza posiciones ni tráfico. La recuperación orgánica debe medirse con Search Console, logs autorizados y analítica de acciones reales después de desplegar; no se debe atribuir una mejora porcentual antes de tener baseline de campo.

## J. UX/UI

La experiencia pública anterior confundía “producto” con “promoción”: gradientes, tarjetas y demos intentaban demostrar actividad antes de que el usuario pudiera comprobarla. La dirección corregida usa una jerarquía más sobria: una acción primaria, explicación de qué ocurrirá, límites de privacidad y rutas secundarias visibles.

Las nuevas landings usan una paleta nocturna con cyan/fucsia, tarjetas de superficie y Hugeicons para reducir la mezcla de emojis, SVGs y packs. La intervención es deliberadamente gradual: no se reemplazaron cientos de imports Lucide ni se reescribieron todas las tarjetas de OPIN, porque eso aumentaría la probabilidad de regresiones sin resolver contratos de datos.

El punto pendiente más visible es OPIN. En esta tanda no se afirma que sus tarjetas, colores, orden, historial, reacciones o emojis hayan sido rediseñados de forma integral. El siguiente trabajo debe diseñar un feed que muestre intención, tiempo, respuestas y controles de seguridad; ordenar por actividad reciente real con paginación; y reflejar el avatar real o un fallback consistente.

## K. Mobile

El producto debe considerarse primero en anchos de 320, 360, 375, 390 y 430 px, y después en tablet/escritorio. Las landings corregidas usan contenedores fluidos, botones con altura mínima aproximada de 48 px, columnas que colapsan y texto que evita depender de una imagen para comunicar la acción.

| Punto móvil | Criterio de aceptación | Estado en esta fase |
|---|---|---|
| CTA principal | Tap target >= 44–48 px, texto completo, foco | Implementado en landings nuevas; falta recorrido E2E completo |
| Reflow | Sin scroll horizontal a 320 px | Clases responsive revisadas; falta prueba automatizada por viewport |
| Safe area | No ocultar header/composer bajo notch o teclado | Reglas globales existentes; chat requiere prueba manual |
| Composer | Teclado, adjunto, enviar y errores visibles | Contrato conservado; Storage remoto pendiente |
| Modal de alias | Escape, foco, labels, teclado | Debe probarse con navegador y sesión invitado |
| Feed OPIN | Cards legibles, acciones no ambiguas | Rediseño pendiente |
| Imagen/avatar | Fallback sin layout shift y alt razonable | Contrato local existe; URL firmada pendiente |

## L. Performance

El baseline previo al mandato maestro fue un build exitoso de aproximadamente 49,76 segundos, con 9.462 módulos transformados, un chunk `App` cercano a 1,95 MB, `firebase-vendor` cercano a 698 KB, CSS cercano a 241 KB y `dist` alrededor de 15 MB. Tras la tanda local, el build controlado con `NODE_OPTIONS=--max-old-space-size=1200` finalizó en 46,40 segundos, transformó 9.461 módulos y generó 12 rutas SEO estáticas.

| Artefacto final medido | Tamaño sin gzip | Gzip | Lectura |
|---|---:|---:|---|
| `App-e536e3a9.js` | 1.936,84 KB | 579,72 KB | Sigue siendo grande; requiere separación de imports |
| `firebase-vendor-79e14b49.js` | 698,43 KB | 202,57 KB | Firebase histórico todavía pesa |
| `AdminPage-d62c984e.js` | 613,28 KB | 162,46 KB | Candidato a aislamiento más estricto |
| `ChatPage-3439bbd4.js` | 358,21 KB | 96,01 KB | Funcionalidad compleja; no eliminar a ciegas |
| `index-0fb02ccd.css` | 242,05 KB | 34,34 KB | Debe reducirse gradualmente |
| `dist` | 15 MB | N/A | Incluye assets y chunks del build |

Las referencias de campo de web.dev son LCP <= 2,5 s, INP <= 200 ms y CLS <= 0,1.[2] Esos valores no fueron medidos en usuarios reales, por lo que este informe no los atribuye a Chactivo. Próximas optimizaciones: lazy imports en App, aislamiento de Admin, reducción de assets grandes (`logo_chact.png` y `transparente_logo.png`), y retirada de Firebase solo cuando el fallback histórico deje de ser necesario.

## M. Accessibility

WCAG 2.2 exige foco visible, foco no oculto, contraste suficiente, navegación por teclado, nombre accesible para controles y reflow adecuado.[3] La tanda local agrega tokens de foco, un `focus-visible` global, una política de `prefers-reduced-motion` y botones semánticos en las landings reescritas. Se usan labels textuales y `aria-hidden` en iconos decorativos de Hugeicons.

Esto no equivale a una certificación WCAG. Faltan una pasada con teclado, auditoría con lector de pantalla, contraste medido de combinaciones reales, prueba de modal, mensajes de error de formularios, focus trap, alt text de avatares, scroll del chat y revisión del feed OPIN. El color por sí solo nunca debe ser la única señal de estado.

## N. Technical Architecture

La arquitectura objetivo es una separación progresiva entre superficies públicas, sesión y backend. Las nuevas altas y sesiones deben usar Supabase bajo `VITE_ENABLE_SUPABASE=true` y `VITE_AUTH_PROVIDER=supabase`. Firebase queda como compatibilidad histórica para cuentas antiguas, no como proveedor silencioso de funciones nuevas.

| Decisión | Estado local | Próximo control |
|---|---|---|
| Auth Supabase-first | Implementado en selector/provider | Login, registro, refresh y logout en staging real |
| Tablas/migraciones | 0001–0035 consolidadas localmente | Ejecutar manualmente y comprobar cada migración en Supabase |
| RLS | SQL local preparado | Probar lecturas/escrituras anon/auth y negar acceso cruzado |
| Storage/media | Adapters locales | Buckets, policies, URLs firmadas, expiración y eliminación |
| Realtime | Adapters presentes | Canal, presencia, reconexión y cleanup |
| RPC | Varias funciones previstas | Confirmar firmas, permisos y errores en PostgreSQL real |
| Baúl | Flag `false` | No activar antes de todos los controles anteriores |
| Firebase | Bundle/fallback histórico | Mapear consumidores y retirar solo tras migración verificada |

No se usó service-role en frontend, documentación ni repositorio. No se modificaron credenciales ni variables de entorno.

## O. Chat

El chat sigue siendo el activo funcional central y se trata como código protegido. La intervención local aplica `noindex,nofollow,noarchive,nosnippet` a las salas dinámicas por defecto, excepto que exista una flag explícita y revisada para el vertical hetero. Se conserva la arquitectura de mensajes, replies, reacciones, receipts, reportes, bloqueo, nickname y media a nivel de contratos locales.

La guía inicial del chat debe pasar a un modelo progresivo: primero estado de conexión, sala, alias y composer; después ayuda contextual bajo demanda. Los estados mínimos son loading, vacío, offline, reconexión, error, retry y publicación exitosa. Ningún estado vacío debe rellenarse con mensajes o avatares de muestra.

La función de envío de foto es un pendiente crítico de verificación. El código local contiene piezas de media y migraciones, pero no hay evidencia de que Storage, bucket, RLS, URL firmada y persistencia estén operativos en Supabase remoto. Por tanto, el resultado honesto es **preparado localmente, no verificado remotamente**, no “funcional al 100 %”.

## P. Security, Privacy and Legal

La seguridad de una comunidad no se resuelve con un gradiente ni con una frase absoluta. Chactivo debe explicar qué se recopila, qué se publica, cuánto dura, cómo se bloquea/reportan cuentas y qué ocurre con media. No se debe afirmar E2EE, anonimato total, borrado en 24 horas, ausencia de trackers, moderación humana 24/7 o seguridad absoluta sin documentación operativa que lo respalde.

Los documentos locales agregados o reescritos son prudentes y dejan campos jurídicos que Daniel debe completar antes de tratarlos como aviso legal definitivo. El correo `soporte@chactivo.app` debe confirmarse como canal operativo antes de presentarlo como soporte garantizado. La política de edad debe ser coherente con contenido adulto, publicación y moderación.

| Control | Regla de esta fase | Pendiente externo |
|---|---|---|
| Secretos | No crear, mostrar o commitear `.env`, service-role o claves privadas | Daniel gestiona credenciales y Vercel |
| GPS | Nunca exacto; solo ciudad/comuna coarse y opt-in | Diseño de consentimiento y retención |
| Datos privados | No inspeccionar ni usar sin consentimiento | Prueba con cuentas autorizadas |
| Media | URLs firmadas y policies, no URLs públicas por defecto | Bucket/RLS real |
| Reporte/bloqueo | Acción próxima al contenido | Flujo remoto y moderación |
| Legal | Copias locales accesibles y claims prudentes | Datos del titular y revisión jurídica |

## Q. Visual Direction

La dirección visual propuesta es **“Midnight Community / Electric Trust”**: fondo oscuro profundo, superficies separadas, cyan para orientación y foco, fucsia para el CTA, violeta para pertenencia y verde solo para estados reales. Se evita el exceso de glassmorphism, el rojo ambiguo en acciones normales y el uso de emojis como iconos de control.

Los tokens iniciales añadidos a `src/index.css` incluyen `--surface`, `--surface-elevated`, `--surface-hover`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--success`, `--warning`, `--error`, `--focus`, `--disabled` y `--font-ui`, con variantes dark/light. La migración debe ser gradual: primero entradas públicas y componentes compartidos, luego OPIN y perfil, y por último las piezas más grandes del chat.

Hugeicons es la preferencia para componentes nuevos. Lucide no se elimina globalmente en esta fase porque está ampliamente consumido y una sustitución masiva rompería contratos o aumentaría el diff sin resolver el backend.

## R. Product Architecture

La arquitectura de producto debe concentrarse en tres entradas que resuelven intenciones diferentes:

| Entrada | Promesa verificable | Acción | Motivo legítimo para volver |
|---|---|---|---|
| Chat principal | Conversar si hay actividad | Elegir alias y entrar | Respuestas, historial y personas conocidas |
| OPIN | Publicar o leer una intención | Escribir, responder, seguir | Respuestas reales y actualización de estado |
| Perfil/privado | Continuar con más control | Completar perfil y solicitar | Consentimiento, receipts y conversación retomable |

El avatar debe tener una única fuente de verdad: perfil -> referencia de media -> URL firmada renovable -> fallback accesible. Esa misma resolución debe ser consumida por OPIN, burbuja del chat general, chat privado y Baúl cuando se habilite. La inconsistencia de avatares es un fallo de confianza, no un detalle cosmético.

La recuperación de Baúl no debe comenzar con tarjetas bonitas. Debe empezar con contratos: qué significa una tarjeta, qué datos devuelve, qué consentimiento existe, cómo se filtra, qué RLS protege cada estado y cómo se refleja un avatar. Hasta entonces, la flag permanece apagada.

## S. Roadmap

| Fase | Resultado | Acciones | Criterio de salida |
|---|---|---|---|
| 0 — Integridad pública | Cero promesas evidentemente falsas | Hecho local: landings, legales, FAQ, noindex, sitemap, SEO estático | Tests y build locales verdes |
| 1 — OPIN útil | Muro con intención y retorno | Orden reciente real, paginación, respuestas, estados vacíos, reportes, avatar | E2E con datos reales autorizados |
| 2 — Media/avatar | Imagen consistente en todo el ecosistema | Bucket, RLS, signed URLs, fallback, retry, eliminación | Prueba con dos cuentas en staging |
| 3 — Chat retentivo | Menos fricción y más continuidad | Guía progresiva, historial, offline/retry, typing/receipts | Prueba móvil y remoto verificable |
| 4 — Privado seguro | Conversación consentida | Requests, bloqueo, receipts, privacidad y notificaciones | Matriz auth/RLS completa |
| 5 — Baúl controlado | Tarjetas con utilidad real | Solo con SQL, Storage, Realtime, RLS y métricas reales | Activación explícita después de staging |
| 6 — Performance | Menos coste móvil | Lazy routes, assets optimizados, Firebase aislado | Comparativa reproducible de build y campo |
| 7 — Crecimiento | SEO y retorno medibles | Search Console, cohortes reales, contenido editorial humano | No usar cifras sin fuente |

Las tareas que dependan de la cuenta Supabase o de Vercel quedan expresamente para Daniel: crear/confirmar proyecto, ejecutar migraciones, probar policies, cargar variables, revisar buckets y decidir el despliegue. Esta auditoría no ejecuta esas acciones.

## T. Local Baseline

| Indicador | Baseline disponible | Resultado actual | Interpretación |
|---|---:|---:|---|
| JSX | 217 archivos | No se redujo globalmente | Magnitud del frontend |
| JS | 117 archivos | No se redujo globalmente | Deuda y fragmentación |
| SQL | 36 archivos | 35 migraciones Supabase consolidadas | Preparación local, no validación remota |
| TODO/FIXME/HACK/PENDING | 498 | No se limpió masivamente | Backlog real, no todo es bug activo |
| `console` | 1.339 | No se silenció globalmente | Requiere diagnóstico por módulo |
| Hex hardcodeados | 815 | Se agregaron tokens, no migración total | Design system gradual |
| Tests | 41 antes de esta tanda | 48 pasando en 6 archivos | Contratos estáticos, no E2E |
| Módulos transformados | 9.462 antes | 9.461 final | Build estable |
| Build | ~49,76 s previo | 46,40 s controlado | Variación local, no métrica de usuario |
| App chunk | ~1,95 MB previo | 1.936,84 KB | Sigue siendo prioridad |
| Firebase vendor | ~698 KB previo | 698,43 KB | Sin reducción todavía |
| CSS principal | ~241 KB previo | 242,05 KB | Tokens no redujeron peso |
| Dist | ~15 MB previo | 15 MB | Pendiente optimización de assets |

## U. Objectives and Acceptance Criteria

Los objetivos de reactivación deben expresarse como comportamiento verificable, no como promesas de “miles de usuarios”.

| Objetivo | Indicador legítimo | Criterio de aceptación |
|---|---|---|
| Comprensión | Usuario identifica chat, OPIN y siguiente paso | Prueba moderada y eventos de CTA reales |
| Confianza | Menos errores, documentos accesibles, claims sostenibles | Rutas legales 200 tras deploy y revisión jurídica |
| Entrada | Tiempo hasta primer control interactivo | Medición de campo, no texto promocional |
| Conversación | Primer mensaje y conversación retomada | Datos reales, sin semillas |
| OPIN | Publicación y respuesta con intención | Flujo auth/RLS y moderación verificados |
| Retención | Retornos y respuestas por cohorte | Cohortes reales, sin notificaciones ficticias |
| Seguridad | Reporte/bloqueo y estados auditables | Acción operativa y RLS probado |
| SEO | Impresiones/clicks y páginas indexadas útiles | Search Console después de despliegue |
| Rendimiento | LCP/INP/CLS medidos | Web Vitals de campo con metodología documentada |
| Accesibilidad | Teclado, foco, contraste, lector y reflow | Checklist WCAG reproducible |

No se fija una cifra porcentual de mejora. Sin tráfico real, baseline de Search Console y medición de campo, una predicción numérica sería inventada.

## V. Evidence, Limitations and References

### Evidencia y límites

La navegación pública de producción se realizó con alcance pasivo: se observaron `/`, `/santiago`, `/mas-30`, `/global`, `/opin`, `/chat/principal`, `/faq`, `robots.txt`, sitemaps y la política de privacidad. Se registró el error de `/mas-30`, la actividad sintética visible en algunas landings, el estado público de OPIN, la sala vacía/cargando del chat y el 404 legal. No se copiaron contenidos sexuales ni se inspeccionaron perfiles o chats privados.

En local, `npm test` finalizó con **6 archivos y 48 pruebas pasando**. `NODE_OPTIONS=--max-old-space-size=1200 npm run build` finalizó con **9.461 módulos transformados**, build en **46,40 s** y generación de **12 rutas SEO estáticas**. `git diff --check` pasó. `npm run lint` y `npm run typecheck` no están definidos en `package.json`; sus salidas son “Missing script”, no resultados de lint/typecheck.

El navegador local mostró correctamente el shell HTML de `/`, `/mas-30` y `/faq`, pero informó que la parte interactiva no pudo iniciar en ese entorno de prueba. Eso no demuestra un fallo de producción ni una operación correcta de Supabase. El preview local se detuvo después de la comprobación. No hubo push, PR, merge, deploy, SQL remoto, importación, backfill, cambio de DNS, cambio de credenciales ni mutación de producción.

### Referencias

[1]: https://developers.google.com/search/docs/fundamentals/seo-starter-guide — Google Search Central, “SEO Starter Guide”.

[2]: https://web.dev/articles/vitals — web.dev, “Web Vitals”.

[3]: https://www.w3.org/TR/WCAG22/ — W3C, “Web Content Accessibility Guidelines (WCAG) 2.2”.

[4]: https://supabase.com/docs/guides/auth — Supabase, documentación de Auth.

[5]: https://supabase.com/docs/guides/database/postgres/row-level-security — Supabase, documentación de Row Level Security.

[6]: https://supabase.com/docs/guides/storage — Supabase, documentación de Storage.

[7]: https://supabase.com/docs/guides/realtime — Supabase, documentación de Realtime.

[11]: https://www.grindr.com/ — Grindr, sitio oficial.

[12]: https://www.scruff.com/ — SCRUFF, sitio oficial.

[13]: https://taimi.com/ — Taimi, sitio oficial.

[14]: https://hornet.com/ — Hornet, sitio oficial.

[15]: https://www.romeo.com/ — ROMEO, sitio oficial.

[16]: https://www.jackd.com/en — JACK'D, sitio oficial.

[17]: https://www.daddyhunt.com/ — Daddyhunt, sitio oficial.

[18]: https://www.growlrapp.com/ — GROWLr, sitio oficial.

[19]: https://www.lex.lgbt/ — Lex, sitio oficial.

[20]: https://weareher.com/ — HER, sitio oficial.

[21]: https://feeld.co/ — Feeld, sitio oficial.

[22]: https://www.mrxapp.com/ — MR X, sitio oficial.

[23]: https://www.queersocial.us/ — Queer Social, sitio oficial.

[24]: https://bumble.com/ — Bumble, sitio oficial.

[25]: https://discord.com/ — Discord, sitio oficial.

[26]: https://www.tinder.com/safety — Tinder, Safety Center.

[27]: https://www.meetup.com/ — Meetup, sitio oficial.

[28]: https://redditinc.com/policies/moderator-code-of-conduct — Reddit, Moderator Code of Conduct.

[29]: https://telegram.org/faq — Telegram, FAQ oficial.

[30]: https://signal.org/ — Signal, sitio oficial.
