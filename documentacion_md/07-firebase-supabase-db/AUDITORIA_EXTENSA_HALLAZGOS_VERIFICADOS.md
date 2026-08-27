# Auditoría A–Z y reparación segura de Chactivo

**Fecha de cierre local:** 27 de agosto de 2026
**Rama auditada:** `audit/revision-extensa-2026`
**Base:** `e81ef697` (`origin/main`)
**Alcance:** runtime, rutas, seguridad, privacidad, actividad artificial, SEO, accesibilidad, dependencias, reglas Firestore, preparación Supabase y documentación de migración.

## 1. Veredicto ejecutivo

La aplicación quedó **compilable, navegable y significativamente más segura en el código local**, pero no es responsable afirmar que todos los flujos de producción estén end-to-end validados. El principal P0 de runtime —el `#root` vacío cuando faltaban las variables Firebase— fue reparado con un bootstrap dinámico y un fallback visible. El build de producción termina correctamente, genera las 12 páginas SEO estáticas y `npm audit --omit=dev` termina con cero vulnerabilidades reportadas en la instalación actual.

También se retiraron o neutralizaron rutas de actividad artificial: VOC, seeds de OPIN, módulos de generación de mensajes, identidades editoriales genéricas, mensajes de bienvenida automatizados y lecturas de claves/endpoints de IA desde el frontend. La ubicación exacta quedó explícitamente apagada. Las respuestas editoriales que sí se conservan exigen una identidad fija y visible de `Equipo Chactivo` en la capa de servicio y en las reglas locales.

La navegación real probada con Chromium/CDP montó la aplicación en `/`, `/auth`, `/opin` y `/chat/principal` sin excepciones JavaScript. Las rutas de prueba `/test`, `/test-modal` y `/es-test`, además de `/foro-gay`, terminan en `/chat/principal` en build de producción. Las rutas UGC `/opin`, `/profile/:userId` y `/thread/:threadId` quedan con `noindex, nofollow, noarchive` y canonical propio; la sala principal permanece indexable.

> **Límite decisivo:** no se ejecutó SQL Supabase, no se desplegaron reglas Firebase, no se hizo push, merge ni deploy, no se migraron usuarios y no se escribieron datos reales. Supabase no quedó como backend principal: la rama continúa Firebase-first por seguridad.

## 2. Metodología y límites de evidencia

La auditoría combinó inspección de código activo, escaneo estático de patrones de riesgo, tests locales, build de producción con configuración Firebase ficticia, preview local y navegación CDP. Las credenciales reales nunca se imprimieron ni se usaron; el navegador vio únicamente un `projectId` ficticio para comprobar el comportamiento del bundle y de la UI.

| Evidencia | Resultado | Qué demuestra | Qué no demuestra |
|---|---:|---|---|
| `npm test` | 2 archivos, 9 tests, 0 fallos | Invariantes locales de servicios, anti-automatización y reglas estáticas | Autorización real contra Firestore |
| `npm run build` | Correcto con heap de 1.5 GB | Transformación Vite, importaciones, React Router 7 y postbuild SEO | Rendimiento de usuarios reales o backend productivo |
| `npm audit --omit=dev` | 0 vulnerabilidades | Estado de dependencias de producción instalado en esta rama | Ausencia de vulnerabilidades de configuración, infraestructura o servicios externos |
| Preview + CDP | Rutas principales montan sin excepciones JS | Runtime y DOM real con Firebase ficticio | Registro, login, writes, Realtime o reglas reales |
| Preflight `npm run test:firestore` | Sale 2 porque no hay emulador en `127.0.0.1:8080` | La prueba no se ocultó ni produjo falsos positivos | Validación de reglas contra Emulator Suite |
| Escaneo de secretos/IA | 0 coincidencias prohibidas en `src` | No quedan claves/endpoints AI frontend buscados | Claves presentes fuera del árbol activo o configuración de hosting |
| Escaneo de claims sensibles | 0 coincidencias en el conjunto definido | Se retiraron contadores y promesas absolutas auditadas | Veracidad de cada claim de negocio no medido |

No se realizó una auditoría WCAG 2.2 completa con lector de pantalla, contraste instrumental, teclado de todas las rutas, zoom, preferencias de movimiento y combinaciones de navegador. El resultado de accesibilidad debe interpretarse como una **regresión CDP dirigida**, no como certificación AA. WCAG organiza la accesibilidad bajo los principios perceptible, operable, comprensible y robusto, y sus criterios son comprobables e independientes de una tecnología concreta [1].

## 3. Matriz A–Z de hallazgos

La siguiente matriz usa “confirmado” cuando existe evidencia reproducible en el código o en el preview, “parcial” cuando solo se cubrió una parte de la superficie y “pendiente” cuando depende de backend, emulador, credenciales o decisión manual.

| Letra | Dominio auditado | Estado verificable | Evidencia / reparación | Estado |
|---|---|---|---|---|
| A | Accesibilidad | Los controles visibles probados tienen nombre accesible; inputs de auth, foto y mensaje tienen labels; se corrigieron wrappers enfocables de Framer Motion | CDP en `/`, `/auth`, `/chat/principal`, `/opin`: `unnamedVisibleControls: 0`; faltan contraste y teclado exhaustivos | Parcial positivo |
| B | Bootstrap/runtime | El root ya no queda silenciosamente vacío si Firebase no puede evaluarse | `src/main.jsx` carga `App` dinámicamente y muestra estado/fallback explícito | Corregido localmente |
| C | Chat público | La UI real monta, muestra sala y controles; los datos de la sala ficticia no se validaron | CDP sin excepciones con configuración Firebase ficticia; Firestore aparece bloqueado por navegador/proyecto placeholder | Parcial |
| D | Dependencias | Firebase, Supabase, DiceBear, uuid, React Router y `react-is` actualizados de forma dirigida | `npm audit --omit=dev`: 0; React Router instalado `7.18.2` | Corregido localmente |
| E | Engagement artificial | VOC, seeds, generator de mensajes y bienvenida automatizada retirados o convertidos en no-op | Escaneo de patrones activos sin residuos, excepto bloqueadores `static_bot_` | Corregido |
| F | Firebase rules | Se endurecieron reglas locales para presencia, system messages, bots/seeds y respuestas editoriales | `firestore.rules` no fue desplegado; tests estáticos pasan | Pendiente deploy autorizado |
| G | Geolocalización | No se solicita ni guarda GPS exacto | Servicio explícitamente desactivado, modal y banner sin prompt, Baúl sin coordenadas | Corregido localmente |
| H | HTML/SEO base | Existe shell SEO visible mientras arranca React; canonical y metadata se gestionan por ruta | `index.html`, `NoindexMeta`, postbuild de 12 rutas | Positivo |
| I | IA frontend | No quedan lecturas de `VITE_OPENAI`, `VITE_DEEPSEEK`, `VITE_QWEN`, endpoints ni `Authorization` en los servicios auditados | Chactivo Assistant, moderación y companion funcionan localmente/determinísticamente | Corregido |
| J | JavaScript/errores | El build transforma 9.410 módulos y no reporta excepciones en rutas CDP probadas | Build y matriz de rutas final | Positivo con límite backend |
| K | Keyboard/focus | Se eliminaron focos duplicados de logos, wrappers de login y botón de envío | CDP móvil final sin controles visibles sin nombre; quedan pruebas manuales de orden/diálogo | Parcial positivo |
| L | Landings | Se retiraron contadores `1000+`, años no verificados y promesas de seguridad/identidad; copys principales reflejan participación variable | Global, Gaming, Lobby, Santiago, Mas30, Hetero, index y variantes regionales | Corregido localmente |
| M | Moderación | La clasificación frontend es local y transparente; acciones administrativas siguen dependiendo de Firestore | No hay proveedor AI remoto en servicios auditados; reglas live no fueron probadas | Parcial |
| N | Noindex UGC | OPIN, perfil e hilo quedan fuera del índice con canonical propio | CDP: `noindex, nofollow, noarchive` en `/opin`, `/profile/demo`, `/thread/demo`; auth también | Corregido localmente |
| O | OPIN | Lectura pública monta; el seed artificial está deshabilitado; respuestas editoriales quedan etiquetadas como oficiales | `ARTIFICIAL_SEEDING_DISABLED`, identidad fija Equipo Chactivo, marca visible en comentarios | Parcial |
| P | Privacidad | GPS exacto apagado; textos absolutos de anonimato, borrado, cifrado E2E, trackers y seguridad total fueron saneados | `geolocationService`, FAQ, VerificationModal, PWA banner y landings | Corregido localmente |
| Q | Quality/performance | Se midió el bundle, pero no se midieron CWV reales ni se hizo profiling de campo | App inicial sigue siendo grande; ver sección de rendimiento | Deuda conocida |
| R | React Router | Upgrade a `7.18.2` compila y las rutas probadas navegan | Build y CDP de rutas principales/extra sin excepciones | Positivo, vigilar regresiones |
| S | Seguridad de secretos | No hay `.env` activo en el worktree; solo `.env.example`; el escaneo de AI secrets da 0 | No se leyó ni se imprimió ninguna variable sensible | Positivo en rama local |
| T | Testabilidad | Hay tests Vitest y prueba estática de rules; el integration test requiere Emulator Suite | 9 tests pasan; preflight devuelve salida 2 clara sin emulador | Parcial |
| U | UX móvil | Auth no presenta overflow detectado; chat/OPIN tienen overflow interno que requiere revisión visual | Sondeo a viewport móvil: auth 0; chat 2; OPIN 1; home 11, en gran parte decoración/contendedores internos | Parcial |
| V | Veracidad de copy | Se retiraron ratings, testimonios, cifras y promesas de actividad/seguridad no demostradas | Scan final definido: 0 coincidencias | Corregido localmente |
| W | Web performance | El postbuild funciona y separa chunks, pero `App` y Firebase siguen pesados | App 1.651,17 kB / 510,67 kB gzip; Firebase 698,43 kB / 202,57 kB gzip | Deuda priorizada |
| X | XSS/HTML dinámico | No se encontró una nueva ruta de HTML remoto en el alcance de esta reparación; existe un uso heredado de `dangerouslySetInnerHTML` que requiere revisión específica | Escáner heurístico lo marcó una vez; no se eliminó a ciegas sin revisar contexto | Pendiente focalizado |
| Y | Yield/retención | Se conserva la propuesta de chat y OPIN, pero no se fabrican usuarios ni métricas para mejorar retención | Copy ahora indica que la actividad depende de participación real | Producto pendiente de datos reales |
| Z | Zero-downtime/migración | No se ejecutó cutover; flags permanecen Firebase-first y SQL queda manual | Roadmap separado y documento de último paso Supabase | Pendiente autorizado |

## 4. Correcciones aplicadas

### Runtime y navegación

Se reescribió el arranque en `src/main.jsx` para cargar `App` dinámicamente. Esto no oculta el error de configuración: si faltan las seis variables Firebase, el usuario recibe una explicación visible y el shell SEO no se convierte en una pantalla blanca. Con una configuración Firebase ficticia, `/`, `/auth`, `/opin` y `/chat/principal` montaron UI real y añadieron `html.app-loaded` sin excepciones JavaScript.

Las rutas de prueba permanecen disponibles solo en desarrollo. En producción, `/test`, `/test-modal` y `/es-test` terminaron en `/chat/principal`; `/foro-gay` también terminó en la sala principal. Esto evita exponer páginas de diagnóstico o rutas legacy como si fueran producto público.

### Actividad artificial, suplantación e IA

`vocService.js` quedó como no-op compatible para que consumidores legacy no fabriquen actividad. Se retiraron del panel administrativo el generador de mensajes y el panel de OPIN estables. Los módulos heredados fueron archivados fuera del repositorio activo. `seedStableOpinExamples()` rechaza explícitamente la creación artificial. `createStableOpinPost()` ya no acepta nombres, avatares o banderas de seed para aparentar usuarios.

Las respuestas editoriales conservadas requieren identidad oficial fija. `AdminOpinRepliesPanel`, `opinService`, `OpinCommentsModal` y `firestore.rules` utilizan la señal `isAdminReply` de forma visible y no permiten que un usuario normal se autodenomine Equipo Chactivo. Los bloqueadores de IDs automatizados permanecen solo como defensas; no son una fuente de actividad.

Los servicios `chactivoAssistantService.js`, `moderationAIService.js`, `moderationService.js` y `companionAIService.js` ya no leen claves AI desde Vite ni realizan llamadas frontend a proveedores remotos. La ayuda companion es local y transparente; no publica mensajes en nombre de personas.

### Privacidad y geolocalización

`geolocationService.js` fue convertido en una API explícitamente apagada que limpia caché heredada y rechaza solicitudes o guardados exactos. `NearbyUsersModal`, `BaulSection` y `LocationPermissionBanner` ya no solicitan ni escriben coordenadas. El futuro recomendado es ciudad/comuna opcional y aproximada, no GPS exacto.

Se reemplazaron claims absolutos de anonimato, cifrado, borrado, ausencia de trackers, moderación garantizada y seguridad total por lenguaje verificable. Esto incluye FAQ, PWA install banner, VerificationModal y las landings regionales. El botón de privacidad del chat se llama ahora **“Ocultar chat / modo privacidad”**; se conservó la función porque es útil, pero se retiró la palabra “Simular”.

### SEO y veracidad

`NoindexMeta.jsx` se aplica a `/opin`, `/opin/new`, `/profile/:userId` y `/thread/:threadId`. La prueba CDP observó canonicales propios y `noindex, nofollow, noarchive`. La sala principal conserva `index, follow` y canonical `/chat/principal`.

Se eliminaron contadores, ratings, testimonios y claims de actividad no sustentados. Las descripciones mencionan participación y disponibilidad cuando corresponde, no una cantidad inventada de usuarios. También se corrigió el JSON-LD para que la descripción coincida con el metadata visible y se retiró `aggregateRating`.

Google Search Essentials separa requisitos técnicos, políticas de spam y buenas prácticas; cumplir requisitos técnicos por sí solo no garantiza visibilidad, y el contenido debe ser útil para personas [3]. La eliminación de seeds, identidades ficticias, testimonios inventados y páginas UGC indexables reduce riesgos de contenido manipulativo, coherentemente con la política de spam sobre contenido escalado cuyo propósito principal sea manipular rankings [4]. No se promete tráfico, ranking ni recuperación de posición.

### Accesibilidad y UX

Se añadieron nombres accesibles a cierres, botones icónicos de companion, selección de foto, mostrar/ocultar contraseña, retorno/refresh de OPIN y botones de ayuda. Se corrigieron wrappers de Framer Motion que generaban focos duplicados alrededor de logos, login y envío de mensaje. La regresión CDP final informó cero controles visibles sin nombre en las cuatro rutas auditadas.

El sondeo móvil observó overflow interno en home, chat y OPIN. Los casos de home incluyen elementos decorativos/absolutos; chat y OPIN conservan contenedores internos que deben revisarse visualmente antes de declarar la experiencia móvil terminada. No se afirmó cumplimiento WCAG AA completo.

## 5. Seguridad y reglas Firestore

El archivo `firestore.rules` contiene una propuesta local más estricta. La presencia exige que el usuario escriba su propia identidad. Los mensajes de sistema exigen `isAdmin()` y `userId == 'system'`. Se eliminaron excepciones de bot, seed, `admin_seeded_rooms` y presencias artificiales. Las reglas siguen bloqueando identificadores automatizados conocidos en chat.

Las respuestas editoriales en `opin_comments` están restringidas a administradores y a la identidad fija esperada. Se añadieron pruebas estáticas para evitar que usuarios comunes o identidades genéricas reintroduzcan la marca oficial.

> **Estado de despliegue:** las reglas live de Firebase no fueron modificadas. El archivo local es una propuesta pendiente de probar con Emulator Suite y de desplegar solo con autorización específica.

El integration test `tests/firestore.rules.test.js` se mantiene preparado para Emulator Suite, pero `npm run test:firestore` terminó con salida 2 porque el emulador no estaba disponible en `127.0.0.1:8080`. Esto es intencional: no se inició un emulador ni se presentó una prueba incompleta como aprobación de seguridad.

## 6. Dependencias y rendimiento

Se actualizaron de forma dirigida Firebase a `12.18.0`, Supabase JS a `2.112.4`, DiceBear a `9.4.3`, uuid a `13.0.1`, React Router y React Router DOM a `7.18.2`, y se añadió `react-is` para Recharts. El paquete `openai` no usado fue retirado. No se ejecutó `npm audit fix` masivo.

| Artefacto del build final | Tamaño raw | Gzip | Lectura |
|---|---:|---:|---|
| `App-*.js` | 1.651,17 kB | 510,67 kB | Chunk inicial demasiado grande; deuda principal |
| `firebase-vendor-*.js` | 698,43 kB | 202,57 kB | Coste relevante mientras Firebase siga globalmente acoplado |
| `AdminPage-*.js` | 612,81 kB | 162,24 kB | Correctamente separado por ruta, pero pesado |
| `ChatPage-*.js` | 382,21 kB | 103,98 kB | Superficie principal a optimizar después de estabilizar |
| `index-*.css` | 235,72 kB | 32,91 kB | Revisar CSS global y utilidades no usadas |

Los Core Web Vitals son métricas de experiencia real: LCP, INP y CLS. Google usa como objetivos de buena experiencia LCP de hasta 2,5 s, INP inferior a 200 ms y CLS inferior a 0,1 [2]. En esta auditoría no se recogieron métricas de campo ni laboratorio; por tanto, estos valores son **objetivos posteriores**, no resultados de Chactivo. La guía de Page Experience también aclara que no existe una única señal y que buenos Core Web Vitals no garantizan una posición superior [5].

La optimización recomendada, sin gasto adicional, es diferir imports globales de Firebase y paneles administrativos, separar rutas que aún entran en `App`, revisar imports de iconos y medir LCP/INP/CLS en un preview con Chrome DevTools. No se hizo una refactorización agresiva esta noche para no romper código funcional.

## 7. Estado real de Supabase

Supabase no quedó activado como backend principal. Solo permanecen la configuración condicionada por flags, `supabaseAuthService.js`, `supabaseChatService.js`, la verificación de esquema y la carpeta de migraciones con `.gitkeep`. La guía interna confirma que la aplicación sigue Firebase-first y que los adapters Supabase todavía no son consumidos por páginas reales.

| Elemento | Estado de esta rama |
|---|---|
| `VITE_ENABLE_SUPABASE` | `false` en la estrategia de release |
| `VITE_DATA_BACKEND` | `firebase` |
| Auth Supabase | Adapter preparado, no cutover |
| Chat Supabase | Adapter preparado, no conectado al producto real |
| Migraciones `0001`–`0006` | No están recuperables en esta rama |
| SQL ejecutado | Ninguno durante esta auditoría |
| Usuarios Firebase | No descargados, migrados ni alterados |
| RLS / Realtime live | No se tocaron ni se afirmaron como verificados |

La verificación existente enumera las superficies esperadas —perfiles, preferencias, salas, mensajes, privados, OPIN, presencia, bloqueos, reportes, moderación, notificaciones, media, auditoría y mapa de migración—, pero esa enumeración no contiene tipos, claves, políticas completas ni triggers suficientes para recrear tablas con seguridad. Por eso no se inventaron migraciones.

El detalle de esta detención manual quedó en [`supabase/SUPABASE_SQL_ULTIMO_PASO_MANUAL.md`](../../supabase/SUPABASE_SQL_ULTIMO_PASO_MANUAL.md). Daniel debe recuperar los SQL originales o un volcado de esquema sin datos antes de pegarlos uno por uno. Después puede ejecutar el SQL de verificación de solo lectura. **No se debe usar una reconstrucción aproximada.**

## 8. Roadmap de continuación

El roadmap operativo está en [`ROADMAP_REARQUITECTURA_MIGRACION_PROGRESSIVA.md`](./ROADMAP_REARQUITECTURA_MIGRACION_PROGRESSIVA.md). Su orden es: preview local; esquema y RLS; auth Supabase detrás de flag; chat y presencia; OPIN/privados/seguridad; y solo al final identidad e historial Firebase. Cada superficie necesita pruebas positivas y negativas, rollback de flag y comprobación de noindex/anti-automatización.

El criterio de migración no es “las tablas existen”. También debe existir un adapter consumido por una pantalla real, autorización probada, observabilidad, backup, reconciliación y rollback. La identidad Firebase no se reemplaza copiando contraseñas ni se hace un corte destructivo.

## 9. Archivos principales de esta auditoría

| Archivo | Propósito |
|---|---|
| `src/main.jsx` | Bootstrap dinámico y fallback visible |
| `src/components/seo/NoindexMeta.jsx` | Noindex/canonical para UGC |
| `firestore.rules` | Propuesta local de rules endurecidas, no desplegada |
| `tests/safety-and-local-services.test.js` | Tests locales de AI/GPS/VOC |
| `tests/firestore.rules.static.test.js` | Invariantes estáticos de seguridad |
| `tests/firestore.rules.test.js` | Integración preparada para Emulator Suite |
| `scripts/run-firestore-rules-test.mjs` | Preflight explícito sin falso positivo |
| `supabase/VERIFICACION_FINAL_ESQUEMA.sql` | SQL de solo lectura para verificación posterior |
| `supabase/SUPABASE_SQL_ULTIMO_PASO_MANUAL.md` | Detención y recuperación manual de migraciones |
| `documentacion_md/07-firebase-supabase-db/ROADMAP_REARQUITECTURA_MIGRACION_PROGRESSIVA.md` | Plan de cutover progresivo |

## 10. Gate de release local

El gate reproducido antes de cerrar fue: `npm test` con 9 tests exitosos; `npm run build` exitoso con configuración Firebase ficticia y postbuild de 12 rutas; `npm audit --omit=dev` con 0 vulnerabilidades; `git diff --check` sin errores; escaneo de AI secrets con 0 coincidencias; y CDP final de rutas, SEO, accesibilidad, móvil y rutas extra con salida 0.

Los errores de red visibles en CDP corresponden al bloqueador del navegador y al `projectId` Firebase ficticio usado para la prueba aislada. No deben interpretarse como validación ni como fallo concluyente de la configuración real. La siguiente prueba necesaria, una vez que Daniel autorice y disponga del entorno, es Emulator Suite para rules y después un preview con credenciales reales sin publicar datos.

## 11. No ejecutado deliberadamente

No se hizo push a GitHub, no se modificó `main`, no se hizo merge, no se desplegó Vercel, no se desplegaron rules Firebase, no se ejecutaron tablas o migraciones Supabase, no se migraron usuarios, no se crearon cuentas de prueba, no se publicaron mensajes, no se inspeccionaron mensajes personales ni perfiles reales y no se rotaron o revocaron claves.

La auditoría no garantiza tráfico, ranking, miles de visitas, disponibilidad 24/7, moderación humana permanente, borrado en un plazo fijo, anonimato absoluto ni crecimiento de la comunidad. Esas afirmaciones requieren políticas implementadas, mediciones y operación verificable.

## Referencias

[1]: https://www.w3.org/TR/WCAG22/ "W3C — Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://developers.google.com/search/docs/appearance/core-web-vitals "Google Search Central — Core Web Vitals"
[3]: https://developers.google.com/search/docs/essentials "Google Search Essentials"
[4]: https://developers.google.com/search/docs/essentials/spam-policies "Google Search Central — Spam Policies"
[5]: https://developers.google.com/search/docs/appearance/page-experience "Google Search Central — Page Experience"
