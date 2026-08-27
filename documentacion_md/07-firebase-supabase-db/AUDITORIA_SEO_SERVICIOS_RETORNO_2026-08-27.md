# Segunda auditoría: SEO, servicios, experiencia y retorno de Chactivo

**Fecha:** 27 de agosto de 2026

**Rama:** `audit/revision-extensa-2026`

**Alcance:** revisión posterior al commit `66256f3b0a6552c9913c8f7c9a08579daf62c5a9`, enfocada en SEO que no había quedado cubierto, servicios realmente conectados, cambios visibles y motivos legítimos para volver.

## 1. Respuesta corta

Sí: los cambios principales anteriores siguen funcionando en un preview reproducible. El build con configuración Firebase ficticia terminó correctamente, generó 12 HTML SEO estáticos, los tests locales dieron 9/9, `npm audit --omit=dev` dio 0 vulnerabilidades y las pruebas CDP volvieron a montar las rutas principales sin excepciones JavaScript. En las cuatro rutas probadas, el sondeo CDP informó `unnamedVisibleControls: 0`. Las rutas UGC mantienen `noindex`, y `/chat/principal` conserva `index, follow`.

También encontré y corregí problemas SEO adicionales que no se habían cerrado completamente: el generador estático todavía contenía frases como “gente real”, “comunidad activa”, “borrar mi cuenta y mis datos” y lenguaje de “página satélite” orientado a capturar búsquedas; `/opin` aparecía en el sitemap aunque la ruta es UGC `noindex`; `robots.txt`, `sitemap.xml` y `sitemap-index.xml` tenían fechas antiguas; el enlace HTML de sitemap apuntaba al archivo secundario en vez del índice consolidado; y el `noscript` duplicaba el H1 del shell SEO. Esos cambios quedaron aplicados localmente y volvieron a pasar el gate completo de build, tests, audit y CDP descrito en esta auditoría.

La conclusión de producto es más matizada: Chactivo se siente **más claro, honesto y orientado a conversar**, pero todavía no se siente automáticamente como una comunidad con actividad abundante. Cuando no hay personas o mensajes reales en la sala, el usuario lo percibe de inmediato. La reparación eliminó la ilusión artificial; ahora la prioridad es crear un ciclo de valor real alrededor de OPIN, estados de 24 horas, conversación pública, privacidad y paso seguro a privado.

## 2. Pruebas realizadas y resultado

| Prueba | Resultado | Interpretación |
|---|---:|---|
| Build de producción con Firebase ficticio | Correcto; 9.410 módulos transformados; 12 páginas SEO generadas | El bundle y el postbuild funcionan sin credenciales reales |
| `npm test` | 9/9 tests; 2 archivos | Los invariantes locales de seguridad y servicios siguen pasando |
| `npm audit --omit=dev` | 0 vulnerabilidades | No quedan vulnerabilidades reportadas en dependencias de producción instaladas |
| `git diff --check` antes de esta segunda modificación | Correcto | No había errores de whitespace en el baseline |
| CDP de rutas | Correcto; `appLoaded: true` en las rutas principales | React Router, bootstrap y UI se montan |
| CDP SEO | Correcto | `/opin`, auth, profile y thread noindex; `/chat/principal` indexable |
| CDP a11y visible | 0 controles visibles sin nombre | Regresión dirigida positiva, no certificación WCAG completa |
| Preview home | Correcto | Se observan CTA, navegación local, copy honesto y ausencia de métricas inventadas |
| Preview chat principal | Correcto con datos ficticios/ausentes | Se observan guía, controles, estados, privacidad y campo de mensaje; la sala muestra 0 actividad porque no hay backend real disponible |
| Emulator Suite Firestore | No ejecutado | No había emulador en `127.0.0.1:8080`; no se afirmó seguridad end-to-end |

La prueba visual del preview mostró en la home “Entra y conversa con la comunidad”, “Entrar ahora”, “Sin app”, “Sin registro obligatorio”, las entradas a Chat principal, Santiago, Mayores de 30, FAQ y países, además de las tarjetas “Acceso inmediato”, “Sin fricción” y “Conversación clara”. En el chat principal se observaron “0 mensajes en 60 min”, “Último mensaje sin actividad reciente”, “0 personas”, guía rápida, modo privacidad, silenciar, reportar, nickname, comuna, estados de rol y campo de mensaje. El panel declara explícitamente que no simula usuarios ni empuja conversaciones falsas.

## 3. Problemas SEO adicionales corregidos

### 3.1 Sitemap y robots

El sitemap incluía `/opin`, aunque esa ruta tiene `noindex, nofollow, noarchive`. Google recomienda incluir en el sitemap las URLs que se quieren mostrar en resultados y normalmente utiliza las URLs canónicas; por eso OPIN debe permanecer fuera mientras sea UGC no indexable [1]. Se retiró la entrada de `/opin`.

`robots.txt` declaraba correctamente `https://chactivo.com/sitemap-index.xml`, y el archivo sí existía. Sin embargo, `sitemap.xml`, `sitemap-index.xml` y el comentario de `robots.txt` conservaban `2026-04-09` después de esta revisión. Se actualizaron a `2026-08-27`, porque el contenido de las landings y el generador sí cambió durante esta auditoría. El `rel=sitemap` del HTML base ahora apunta al índice consolidado.

No se bloquearon recursos CSS o JavaScript. Esto es importante: `robots.txt` debe controlar rastreo de rutas privadas o legacy, no impedir que Google renderice la aplicación pública.

### 3.2 Generador estático

El generador de 12 páginas producía contenido visible para crawlers, pero algunos textos describían la estrategia SEO en vez de servir al usuario: “página satélite”, “captar búsquedas”, “cluster”, “repartir el crecimiento” y “empujar” tráfico a otro hub. Ese lenguaje no aporta utilidad y puede hacer que una página parezca creada para buscadores. Google separa requisitos técnicos, contenido útil y políticas de spam; una estructura técnica correcta no convierte automáticamente contenido delgado en buen contenido [2] [3]. Se reemplazó por explicaciones reales sobre acceso regional, disponibilidad variable y conversación.

También se retiraron del generador las afirmaciones de “gente real”, “comunidad activa”, “borrar mi cuenta y mis datos” y “anonimato y seguridad” como promesas generales. La nueva redacción comunica límites y enlaza a normas y privacidad sin ofrecer garantías que el runtime no demuestra.

### 3.3 Doble H1 en fallback

El HTML generado contenía un H1 del shell SEO y otro H1 dentro de `noscript`. En un navegador con JavaScript activo el shell se oculta tras `html.app-loaded`, pero un crawler o herramienta de extracción podía ver ambos. Se eliminó el bloque `noscript` duplicado, porque el shell SEO ya funciona como fallback sin JavaScript y contiene el enlace al chat.

La auditoría estática posterior identificó 12 archivos HTML, sin títulos duplicados, todos con descripción, canonical, robots, H1, H2 y JSON-LD; tras retirar `noscript`, el HTML generado conserva un único H1 principal por página. La estructura no garantiza posicionamiento; demuestra que las señales técnicas están presentes y coherentes.

### 3.4 Manifest PWA

El manifest decía “la comunidad LGBTQ+ más segura de Chile”, una afirmación absoluta no demostrada. Se reemplazó por “Acceso web a conversación comunitaria LGBTQ+ en Chile; la participación puede variar.” El manifest describe ahora la función, no una superioridad de seguridad.

## 4. Qué servicios están realmente conectados

| Servicio o superficie | Estado observado | Motivo de regreso que puede crear |
|---|---|---|
| Chat público principal | UI y servicios Firebase-first conectados; presencia/mensajes reales dependen del backend | Volver a conversar y encontrar respuesta en el momento |
| OPIN | Feed, categorías, comentarios, reacciones, seguir, guardar local/persistente, buzón, invitación a privado y contacto condicionado | Volver a revisar respuestas, interés y cambios en una publicación |
| Estados de sala | Activos para `roomId === 'principal'`; duración visible de 24 horas, reacciones y cooldown | Publicar disponibilidad concreta y revisar reacciones |
| Chat privado | Montado globalmente mediante `GlobalPrivateChatWindow`/contexto | Continuar una conversación que empezó en la sala pública o OPIN |
| Bloqueo/reporte | UI y servicios presentes | Reducir riesgo y recuperar control cuando una interacción incomoda |
| Presencia | Muestra disponibilidad si existen señales reales; no crea usuarios | Saber si vale la pena intentar conversar ahora |
| PWA | Manifest e instalación opcional | Volver más rápido desde el dispositivo, si la instalación resulta útil |
| Notificaciones push | Hay preparación y lógica condicionada a permisos, backend y token | Avisar de actividad propia si el entorno y permisos funcionan |
| Baúl/tarjetas | Existe, pero la geolocalización exacta fue apagada y el acceso está condicionado por flag | Futuro canal de descubrimiento, no prometer cercanía GPS ahora |
| Supabase | Adapters parciales, no consumidos como backend principal | No es una función de usuario todavía |

## 5. Qué sentirá un usuario ahora

Un visitante nuevo recibirá una entrada más directa: entiende que puede entrar desde el navegador, sin instalar una app y sin registrarse obligatoriamente. La home ya no intenta convencerlo con cifras, testimonios o supuestas multitudes. Visualmente encuentra una estética oscura con acentos fucsia, azul y verde, una jerarquía clara y botones para ir al chat, a Santiago, a +30, a FAQ o a otras entradas regionales.

Al llegar al chat, sentirá más orientación que antes. La guía explica cómo escribir un mensaje útil —rol, comuna y disponibilidad—, muestra acciones para nickname, comuna, estados, privado, privacidad y reporte, y ofrece un ejemplo concreto. Esto reduce la pregunta “¿qué hago aquí?” y evita que la primera interacción sea solamente escribir “hola”.

Pero también sentirá la verdad del producto: si en ese momento no hay mensajes o personas conectadas, verá “0 mensajes en 60 min” y “0 personas”. Esto es mejor que fingir actividad, pero puede producir abandono. La siguiente prioridad no es ocultar ese vacío, sino ofrecer un segundo valor inmediato: leer OPIN, publicar una intención, guardar un hilo, seguir una publicación o volver cuando exista una respuesta. La interfaz ya tiene parte de ese camino, pero todavía debe comprobarse con usuarios reales y datos reales.

## 6. Diferenciación real frente a otras aplicaciones

Chactivo no puede competir hoy con Grindr o SCRUFF por densidad, volumen, filtros avanzados o red internacional. Tampoco debe copiar promesas de moderación o verificación que no están operativamente demostradas. Su diferenciación potencial, con bajo presupuesto, es otra:

> **Un punto de encuentro LGBTQ+ chileno, web y de baja fricción, que combina conversación pública con intención explícita y un paso controlado a privado, sin simular actividad ni exigir GPS exacto.**

La diferencia no es “hay más usuarios”; hoy eso no está probado. La diferencia es el flujo: una persona puede decir qué busca, en qué comuna está, si se mueve o tiene lugar, recibir reacciones/comentarios, seguir una intención y pasar a privado sin exponer el teléfono desde el primer contacto. OPIN funciona como muro de intención, mientras el chat sirve para conversación inmediata. Esa combinación puede ser más útil que un chat vacío o un grid puramente visual, pero todavía necesita masa crítica real.

La comparación oficial consultada muestra patrones claros. SCRUFF ofrece Browse, filtros, Match, agenda de viaje, eventos, RSVP y conversación local/global; cada función genera una razón distinta para volver [4]. HER comunica comunidad, grupos/eventos y un equipo de Trust and Safety con reportes y moderación [5]. Grindr for Equality presenta la conexión online como útil para la comunidad LGBTQI+, pero advierte que las funciones también pueden poner a usuarios en riesgo [6]. Chactivo ya tiene piezas parciales de chat, OPIN, estados, reportes y privados, pero no tiene todavía la densidad, agenda de eventos verificada, filtros maduros ni operación de seguridad de esas plataformas.

## 7. Qué dolor puede curar Chactivo

El dolor central no es simplemente “quiero una app gay”. Es la combinación de **soledad o falta de conexión local, fricción para iniciar una conversación, miedo a compartir datos demasiado pronto y cansancio de espacios centrados exclusivamente en deslizar o intercambiar fotos**. La literatura y las fuentes de seguridad sobre citas LGBTQ+ describen beneficios de conexión, pero también exposición a acoso, discriminación, coerción y riesgos de privacidad [6] [7]. No se deben extrapolar porcentajes extranjeros directamente a Chile, pero sí tomar esos problemas como hipótesis de diseño.

Chactivo puede intentar resolver cuatro microproblemas concretos:

| Dolor | Respuesta actual o posible | Prueba que falta |
|---|---|---|
| “No sé cómo iniciar” | Guías y ejemplos de rol, comuna y disponibilidad | Medir si aumenta el primer mensaje y la respuesta |
| “No quiero entregar mi teléfono enseguida” | Sala pública → privado; buzón e invitación; contacto condicionado | Probar comprensión, consentimiento y bloqueo |
| “Quiero expresar una intención concreta” | OPIN con categorías, estados y acciones | Medir publicaciones, respuestas y retorno a 24/72 horas |
| “No quiero ser localizado exactamente” | GPS exacto apagado; futuro opt-in de ciudad/comuna | Probar que la gente entiende el límite de ubicación |

La promesa correcta es **reducir fricción y exposición temprana**, no prometer que toda persona recibirá una respuesta. La plataforma solo puede decir “habrá respuesta” cuando existan usuarios y actividad medidos.

## 8. Por qué alguien volvería

El retorno sostenible necesita un bucle legítimo:

1. La persona publica una intención útil en OPIN o un estado temporal.
2. Otras personas reaccionan, comentan, siguen la publicación o dejan una nota.
3. La persona vuelve para revisar actividad nueva.
4. Si hay interés mutuo, la conversación pasa a privado con menos exposición.
5. La siguiente visita puede empezar revisando respuestas, publicando un nuevo estado cuando el cooldown lo permita o entrando al chat principal.

Hoy el código ya contiene partes de este bucle: `previousVisitAt`, snapshots de actividad propia, contadores de vistas/respuestas/interés, posts seguidos, push condicionado a permiso/backend/token, categorías, buzón, reacciones y paso a privado. El punto crítico es que ese circuito depende de actividad humana real. No se debe rellenar con seeds, bots, VOC o mensajes simulados.

Los motivos de regreso prioritarios, sin pagar servicios externos, serían: “revisar quién respondió a mi OPIN”, “ver nuevas publicaciones de mi categoría”, “publicar un estado de 24 horas”, “continuar un privado”, “consultar una agenda comunitaria real” y “volver cuando la sala tenga presencia”. Eventos y agenda solo deben incorporarse cuando existan datos reales y responsables de actualización; una agenda ficticia sería otro problema de confianza.

## 9. Qué todavía falta para que la diferenciación sea fuerte

La experiencia actual está más limpia, pero todavía tiene una debilidad estructural: el chat principal puede mostrar vacío y OPIN puede no tener suficiente actividad. También existe mucha densidad visual en el chat, especialmente en móvil, y la auditoría anterior observó overflow interno que requiere revisión manual. El bundle inicial sigue siendo grande —aproximadamente 1.651 kB raw y 510,66 kB gzip para `App`—, por lo que la entrada puede sentirse pesada en dispositivos modestos.

La prioridad de producto no debe ser añadir más módulos. Debe ser concentrar la propuesta en tres superficies: **Chat principal**, **OPIN** y **privado seguro**. La prioridad técnica es hacer que esos tres recorridos sean confiables con Firebase, medir eventos básicos sin datos sensibles y luego activar notificaciones solo cuando el permiso, el token y el backend estén confirmados.

## 10. Conclusión honesta

Los cambios sí son visibles y funcionales en la capa comprobable: la home es más clara, el chat explica mejor qué hacer, la UI ya no muestra contadores o testimonios inventados, la ayuda declara que no simula usuarios, OPIN tiene rutas noindex y el GPS exacto no se solicita. El usuario nuevo percibirá más transparencia y menos fricción inicial.

Lo que todavía no está demostrado es el resultado de negocio: no se puede afirmar que la gente volverá, que Google volverá a posicionar Chactivo, que habrá miles de visitas o que la comunidad está activa. El factor diferenciador es una **comunidad web chilena basada en intención y conversación, no en actividad artificial**, pero se convertirá en una ventaja solo si logra respuestas humanas consistentes.

## Referencias

[1]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google Search Central — Build and Submit a Sitemap"
[2]: https://developers.google.com/search/docs/essentials "Google Search Essentials"
[3]: https://developers.google.com/search/docs/essentials/spam-policies "Google Search Central — Spam Policies"
[4]: https://www.scruff.com/ "SCRUFF — Browse, Match, Venture, Events and Pro"
[5]: https://weareher.com/ "HER — Lesbian, bi & queer dating and Trust & Safety"
[6]: https://cdn.prod.website-files.com/641dc6058ca7b72a1422b5d7/6436c2bf48bde3005f39e0eb_G4E-HolisticSecurityGuide-English.pdf "Grindr for Equality — Holistic Security Guide"
[7]: https://www.pewresearch.org/short-reads/2020/04/09/lesbian-gay-and-bisexual-online-daters-report-positive-experiences-but-also-harassment/ "Pew Research Center — LGB online daters have positive experiences overall but face harassment"
