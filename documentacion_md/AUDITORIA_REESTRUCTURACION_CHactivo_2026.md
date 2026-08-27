# Auditoría y plan de reestructuración de Chactivo — 2026

**Autor:** Manus AI  
**Fecha de auditoría:** 27 de agosto de 2026  
**Alcance:** repositorio local `/home/ubuntu/chactivo_clean_recovery`, producción pública `https://chactivo.com/` y referentes oficiales de productos sociales, dating, comunidad, mensajería, SEO, rendimiento y accesibilidad.

> Este documento separa estrictamente tres niveles: **observación en producción**, **evidencia del código local** y **hipótesis/backlog de producto**. No se considera que Supabase, Auth, RLS, Storage, Realtime o RPC estén validados hasta ejecutar una comprobación controlada contra el proyecto real.

## Resumen ejecutivo

Chactivo no necesita comenzar por “agregar más funciones”. Necesita recuperar una promesa simple y verificable: **una comunidad gay de conversación en español donde es fácil saber qué se puede hacer, qué actividad es real, cómo protegerse y cuál es el siguiente paso**. El producto ya tiene piezas valiosas —chat principal, OPIN, perfiles, media, solicitudes privadas, moderación y una base local Supabase-first—, pero la experiencia pública mezcla superficies maduras con landings antiguas, demos sintéticas, afirmaciones absolutas, rutas rotas y diferentes estrategias de navegación.

El hallazgo más crítico de producción es que `/mas-30` devuelve un error visible de aplicación. El segundo es que `/global` y `/santiago` exponen demos de chat con mensajes, nombres, reacciones y cifras que no proceden de actividad real; el código local confirma que `ChatDemo.jsx` usa contenido hardcodeado y temporizadores. El tercero es que `/politica-privacidad.html` devuelve `404: NOT_FOUND`, aunque el footer público la enlaza. La FAQ carga, pero duplica header/footer porque `FAQPage` monta su propio layout dentro de `MainLayout`. OPIN tiene contenido público real y potencial de producto, pero se muestra como beta/solo lectura y requiere un contrato más claro de edad, publicación, privacidad y moderación.

La estrategia recomendada es una **reactivación por confianza y utilidad**, no por volumen artificial. Primero se retiran claims y actividad simulada, se reparan las rutas públicas y se concentra la propuesta en tres acciones: conversar ahora, publicar una intención en OPIN y completar un perfil seguro. Después se mejora la retención con contexto persistente, estados reales, respuestas, notificaciones y eventos solo cuando existan. Las funcionalidades que dependan de SQL/Supabase real se dejan detrás de estados honestos hasta que Daniel ejecute y verifique las migraciones.

## Estado de evidencia

| Nivel | Evidencia disponible | Qué permite afirmar | Qué no permite afirmar |
|---|---|---|---|
| Código local | Lectura estática del repositorio, contratos, migraciones 0001–0035, pruebas y build | Existen adapters, rutas, componentes y contratos; el proyecto compila | Que una RPC, policy, Storage, Realtime o flujo Auth funcione en Supabase real |
| Pruebas locales | 5 suites, 41 pruebas exitosas; build Vite exitoso; `git diff --check` limpio en el commit previo | No hay regresión cubierta por esas suites y el bundle se genera | Que los flujos de navegador, media, login o datos remotos funcionen end-to-end |
| Producción pública | Navegación directa a `/`, `/santiago`, `/mas-30`, `/global`, `/opin`, `/chat/principal`, `/faq`, robots, sitemaps y política | Se pueden documentar estados y errores visibles de las URLs públicas | Salud de cuentas, chats privados, perfiles privados, SQL remoto o datos no públicos |
| Backend remoto | Sin ejecución de SQL, sin credenciales privadas, sin mutación remota | Debe prepararse una checklist para validación manual | No se puede declarar migración completada ni “listo para producción” |

## Hallazgos P0: bloquear antes de promocionar

| Prioridad | Hallazgo | Evidencia | Riesgo | Tratamiento |
|---|---|---|---|---|
| P0 | `/mas-30` falla en producción | Navegador mostró `Algo salió mal` y error inesperado | Pérdida directa de tráfico y confianza | Corregir `handleEnterChat` indefinido y probar navegación |
| P0 | Demo de chat con actividad sintética | `ChatDemo.jsx` contiene nombres, textos, emojis, “24 activos” y timers; se monta en `/global`, `/santiago` y `/mas-30` | Engaño, riesgo legal, pérdida de confianza y mala calidad de contenido | Sustituir por preview sin usuarios inventados o actividad real validada |
| P0 | Política de privacidad enlazada devuelve 404 | `https://chactivo.com/politica-privacidad.html` confirmó `404: NOT_FOUND` | Falta legal y de confianza en registro/publicación | Crear una ruta estática válida en local y enlazarla de forma coherente |
| P0 | Términos declaran asistentes automatizados | `public/terminos-condiciones.html`, sección 3 | Contradicción con política actual de no bots/actividad ficticia | Reescribir esa sección antes de desplegar |
| P0 | Claims absolutos de seguridad y tracción | `/global`, `/santiago`, `/faq`, `/mas-30`: cifras, rating, “100% seguro”, “encriptación”, “24/7” y “sin trackers” | Promesas no demostradas | Convertirlos en capacidades verificables o eliminarlos |
| P0 | Divergencia sitemap/noindex | Producción enumera `/opin` y `/chat/principal`; local marca OPIN noindex y lo deja fuera del sitemap | Indexación de UGC sexual y contenido cambiante sin política clara | Decidir superficie indexable; por defecto OPIN y chat deben ser noindex |

## Hallazgos P1: arreglar en el primer ciclo

| Área | Hallazgo | Consecuencia | Corrección propuesta |
|---|---|---|---|
| FAQ | Header y footer duplicados | Pantalla repetida y menor claridad | Mantener layout global en `App.jsx`; `FAQPage` debe renderizar solo contenido |
| Navegación | Muchas rutas legacy, aliases, redirects y landings antiguas | Dificulta rastreo, mantenimiento y comprensión del producto | Mantener aliases funcionales, pero reducir superficies públicas y documentar canonical/noindex |
| OPIN | Visitante ve solo lectura y CTA sin explicar el recorrido | El muro no comunica su beneficio ni su siguiente paso | Mostrar “leer → registrarse → publicar intención”; controles de reportar/bloquear y edad |
| Chat | Mucha guía antes del primer mensaje y estado vacío poco accionable | Fricción cuando no hay actividad | Mantener orientación, pero compactarla en una tarjeta progresiva y un estado vacío claro |
| Diseño | Hero usa `lucide-react` mientras el resto mezcla SVG/emoji; texto `white/48`/`white/52` y gradientes oscuros | Inconsistencia, contraste incierto y sensación de producto antiguo | Crear tokens, usar una sola familia de iconos y validar contraste/foco |
| Performance | Bundle inicial actual incluye `App` de aproximadamente 1,95 MB y `firebase-vendor` de aproximadamente 698 KB sin gzip | Mayor coste de descarga/parseo e impacto móvil | Reducir imports síncronos globales, separar admin/landing, evitar dependencias duplicadas |
| Legal | Footer apunta a URLs estáticas que no están todas verificadas | Usuario no puede revisar reglas antes de publicar | Inventario de URLs legales con pruebas HTTP y contenido alineado |

## Qué conservar y qué congelar

El **chat principal**, el proveedor de autenticación, el adapter Supabase, la normalización de media, el modelo de perfiles, las pruebas de contratos y la bandera `ENABLE_BAUL=false` deben tratarse como activos protegidos. No se rediseñarán sus contratos sin tests. El chat no debe perder sus capacidades de replies, reacciones, receipts, reportes, bloqueo, selección de nickname y subida de fotos.

Las landings largas con contenido duplicado, claims históricos, demos sintéticas y testimonios no verificables no son activos que deban congelarse. Se conservarán sus rutas si tienen enlaces históricos, pero se simplificarán y marcarán con canonical/noindex cuando no representen una experiencia pública estable.

## Estrategia de producto: una comunidad con tres entradas

| Entrada | Necesidad que resuelve | Acción primaria | Retorno legítimo |
|---|---|---|---|
| **Chat principal** | “Quiero hablar ahora” | Elegir alias y entrar | Volver a conversaciones, respuestas y personas conocidas |
| **OPIN** | “Quiero publicar lo que busco y encontrar contexto” | Leer o publicar una intención | Recibir respuestas, seguir oportunidades y actualizar estado |
| **Perfil + privado** | “Quiero continuar con alguien con más control” | Completar foto/alias/intención y solicitar privado | Mensajes, receipts, contacto consentido y seguridad |

El factor diferenciador no debe ser afirmar que Chactivo tiene más usuarios que otras plataformas. Debe ser **contexto local, conversación sin pasos largos, intención explícita y transparencia sobre actividad real**. Grindr, SCRUFF, Hornet, ROMEO, JACK'D, Daddyhunt, GROWLr, Taimi, Lex, HER y Feeld muestran diferentes combinaciones de descubrimiento, identidad, intereses, eventos y seguridad; los referentes de comunidad como Discord, Meetup, Reddit y Queer Social enseñan que el retorno nace de grupos, historial, rituales y gobernanza, no de contadores inventados.

## Plan de implementación por ciclos

| Ciclo | Resultado | Cambios locales |
|---|---|---|
| A — Integridad pública | Ninguna ruta prioritaria rota ni promesa evidentemente falsa | Reparar `/mas-30`, sustituir `ChatDemo`, arreglar privacidad, quitar FAQ duplicada, revisar términos |
| B — Sistema visual | UI coherente, legible y accesible | Tokens de color/espaciado, estados de carga/vacío/error, botones y foco, iconos consistentes |
| C — OPIN útil | Muro con intención y siguiente paso claro | CTA de publicar, filtros de intención, respuesta/seguimiento, reportar/bloquear y noindex coherente |
| D — Chat retentivo | Conversación útil sin forzar actividad | Presencia real, historial paginado, replies/reacciones, receipts y media con estados honestos |
| E — Perfiles y media | Avatar consistente en chat, OPIN, privado y Baúl | Una fuente de verdad de avatar, URL firmada renovable, fallback visual accesible, eliminación segura |
| F — Supabase verificado | Backend real con RLS/Storage/Realtime/RPC comprobados | Daniel ejecuta migraciones en entorno de prueba; después se documentan resultados, no antes |

## SEO 2026: arquitectura propuesta

Google recomienda contenido único, útil, actualizado y orientado a personas; URLs descriptivas, reducción de duplicados, canonical, títulos/meta descripciones claras, alt descriptivo y evitar intersticiales que bloqueen la experiencia. También indica que el meta tag `keywords` no es una señal de posicionamiento y que no hay garantía de indexación. [1]

La estructura recomendada es un hub real para Chile, entradas regionales solo cuando tengan contenido propio y útil, una FAQ pública honesta, una página de normas/seguridad y superficies de producto noindex cuando requieren sesión o contienen UGC cambiante. Las páginas `/global`, `/santiago`, `/mas-30` y las regionales deben dejar de ser variantes decorativas de una misma plantilla. Si no hay datos o comunidad local que justifiquen una página, debe consolidarse o quedar fuera del índice.

| Superficie | Indexación recomendada | Justificación |
|---|---|---|
| `/` | Indexable | Propuesta principal de Chat gay Chile, contenido estático útil y CTA claro |
| `/faq` | Indexable | Respuestas públicas, veraces y actualizadas |
| `/normas-comunidad` | Indexable | Confianza, reglas, reportes y edad |
| Hubs regionales | Indexable solo con contenido realmente diferenciado | Evitar doorway/duplicado |
| `/chat/*` | Noindex por defecto | Interfaz dinámica, sesión y actividad cambiante |
| `/opin` | Noindex por defecto hasta política UGC/edad/mode­ración validada | Puede contener texto sexual y datos de contexto |
| `/profile/*`, `/private/*`, `/baul` | Noindex | Datos personales o producto autenticado |
| `/admin`, `/auth`, `/premium` | Noindex | Superficies operativas o incompletas |

## Rendimiento y accesibilidad

Los objetivos de campo deben medirse, no asumirse. web.dev usa como referencia LCP de hasta 2,5 s, INP de 200 ms o menos y CLS de 0,1 o menos. [2] El baseline local ya muestra que el bundle inicial requiere trabajo, pero no equivale a una métrica de usuario real. Después de cada ciclo se debe comparar al menos una ruta pública y una ruta de chat en móvil y escritorio.

WCAG 2.2 AA exige, entre otros criterios, contraste de texto normal de 4,5:1, foco visible, foco no oculto, navegación por teclado, alternativas textuales y reflow. [3] La auditoría debe comprobar botones con emoji, iconos sin nombre, summaries, inputs, modal de nickname, composer, filtros y mensajes que aparecen en Realtime. No basta con que el JSX compile.

## Métricas sin datos ficticios

Solo se deben medir eventos derivados de acciones reales: visita, CTA, llegada a chat, envío de mensaje, publicación OPIN, respuesta, solicitud privada, aceptación, reporte, bloqueo y retorno. No se deben crear contadores, testimonios, perfiles, bots ni “usuarios activos” sintéticos para mejorar conversión. Cuando no exista una medición, la UI debe mostrar “sin datos recientes”, “actividad no disponible” o no mostrar la cifra.

| Pregunta | Métrica legítima | No hacer |
|---|---|---|
| ¿La entrada funciona? | Tiempo real hasta shell interactiva y hasta primer input utilizable | Mostrar “1 ms” sin medición |
| ¿Hay comunidad? | Conteo derivado de presencia real con ventana explicada | “24 activos”, “150+” o “12.847” inventados |
| ¿OPIN retiene? | Publicaciones reales, respuestas reales, retornos por cohorte | Sembrar publicaciones o likes |
| ¿La seguridad funciona? | Reportes y estados operativos registrados, con tiempos reales | “100% seguro”, “moderación 24/7” sin capacidad demostrada |

## Riesgo y límites pendientes

La migración local a Supabase contiene un conjunto amplio de migraciones y adapters, pero el sandbox no tiene `psql`, Supabase CLI ni un proyecto remoto conectado para validar PostgreSQL. Las migraciones deben ejecutarse una sola vez en un entorno de prueba, con respaldo y verificación de tablas, columnas, políticas, Storage, Realtime y RPCs. No se deben importar cuentas históricas ni leer chats/perfiles privados durante esta fase.

Firebase debe quedar únicamente como fuente histórica transitoria de cuentas antiguas, no como backend silencioso de nuevas funciones. Las superficies administrativas legacy deben estar bloqueadas o migradas; no se debe dejar un fallback Firestore que se active bajo una sesión Supabase por accidente. Baúl permanece desactivado hasta validar su Storage privado, sus RPCs, sus policies y sus estados de match.

## Criterios de aceptación del ciclo local

La primera entrega de código se considerará aceptable cuando `/mas-30` ya no muestre error, no existan demos de usuarios falsos en rutas públicas, la política enlazada no devuelva 404 en el repositorio, la FAQ no duplique layout, los claims de seguridad/tracción sean verificables o hayan sido eliminados, y las pruebas estáticas/build sigan pasando. Se documentará por separado lo que requiera ejecución manual en Supabase.

## Referencias

[1]: https://developers.google.com/search/docs/fundamentals/seo-starter-guide — Google Search Central, “SEO Starter Guide: The Basics”.

[2]: https://web.dev/articles/vitals — web.dev, “Web Vitals”.

[3]: https://www.w3.org/TR/WCAG22/ — W3C, “Web Content Accessibility Guidelines (WCAG) 2.2”.

[4]: https://www.grindr.com/ — Grindr, sitio oficial.

[5]: https://www.scruff.com/ — SCRUFF, sitio oficial.

[6]: https://hornet.com/ — Hornet, red social queer.

[7]: https://www.romeo.com/ — ROMEO, plataforma gay.

[8]: https://www.jackd.com/en — JACK'D, sitio oficial.

[9]: https://www.mrxapp.com/ — MR X, sitio web oficial.

[10]: https://www.queersocial.us/ — Queer Social, comunidad LGBTQ+.

[11]: https://bumble.com/en-us/ — Bumble, sitio oficial.

[12]: https://discord.com/ — Discord, comunidad y chat persistente.

[13]: https://policies.tinder.com/community-resources/safety-features — Tinder, funciones de seguridad.

[14]: https://www.meetup.com/ — Meetup, grupos y eventos.

[15]: https://redditinc.com/policies/moderator-code-of-conduct — Reddit, código de conducta para moderadores.

[16]: https://telegram.org/faq — Telegram, FAQ oficial.

[17]: https://signal.org/ — Signal, mensajería privada.

[18]: https://www.lex.lgbt/ — Lex, comunidad social queer.

[19]: https://weareher.com/ — HER, comunidad LGBTQ+.

[20]: https://feeld.co/ — Feeld, conexiones e identidades.
