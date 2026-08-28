# Notas de observación: producción y benchmark inicial

**Fecha:** 27 de agosto de 2026. Estas notas registran observaciones obtenidas durante la auditoría local y visitas públicas, no métricas de usuarios ni datos privados.

## Chactivo en producción

La home pública responde en `https://chactivo.com/` con el título “Chat Gay Chile En Vivo | Entra Gratis y Habla al Instante | Chactivo”. El contenido visible comunica una entrada rápida al chat gay de Chile, sin registro obligatorio y desde el navegador. El CTA principal es “Entrar ahora”, seguido por enlaces a Chat principal, Entrada Santiago, Mayores de 30, FAQ, México, Argentina, España y Brasil.

La vista capturada muestra una composición muy oscura con un fondo degradado púrpura/azul, marca en la esquina superior izquierda, indicador “En vivo ahora” y un hero centrado. El texto y varios controles aparecen con contraste visual bajo en la captura de producción, y el CTA principal no presenta un texto legible en el estado capturado; esto debe verificarse en una segunda captura sin overlays de diagnóstico antes de atribuirlo definitivamente a CSS o a una carga incompleta.

La home incluye las frases “Chile activo ahora”, “Gente real conectando ahora” y “Chat principal de Chile activo ahora mismo”. No se observó en el HTML extraído una cifra concreta de usuarios, lo cual evita una afirmación numérica falsa; aun así, cualquier afirmación de actividad debe provenir de una consulta real y fallar de forma honesta si no hay datos.

Los archivos públicos consultados exponen `robots.txt`, `sitemap.xml` y `sitemap-index.xml`. `robots.txt` permite numerosas landings y `/chat/principal`, pero bloquea áreas privadas, administrativas y varios verticales pausados. El sitemap consolidado observado contiene 15 URLs, entre ellas home, global, Santiago, +30, países, ciudades, FAQ, OPIN y chat principal. La última fecha declarada en esos archivos es 2026-04-09, por lo que debe revisarse su frescura respecto del código local de agosto de 2026.

El HTML público contiene un párrafo que explica abiertamente que la home está “enfocada en captar intención chilena” y en “reforzar búsquedas locales”. Ese texto es estrategia interna de SEO, no contenido útil para la persona visitante. Debe sustituirse por una explicación humana del servicio, sus salas, límites, privacidad y forma de participación.

## Grindr en producción pública

La página oficial de Grindr presenta la propuesta “The Global Gayborhood in Your Pocket™”, con dos CTAs claramente separados: “Log in with Web” y “Get the App”. La navegación institucional visible incluye About, Help, Advertise, Careers, Grindr for Equality, Blog, Unlimited, Shop, Investors, Terms, Privacy, Community Guidelines, Contact y opciones de privacidad.

La primera impresión utiliza una cuadrícula de perfiles con fotografías, nombre e indicador verde de presencia. La cuadrícula comunica de inmediato que existe una comunidad y convierte el concepto abstracto de “red social” en un escaparate visual. El patrón útil para Chactivo no es copiar fotografías o marca, sino comprender el principio: una entrada muy clara, una promesa específica, señales de vida auténticas y enlaces institucionales visibles.

La captura de Grindr fue obtenida con un overlay de diagnóstico visual del navegador; los recuadros numerados no forman parte del diseño real de Grindr y no deben tomarse como defectos del sitio.

## Evidencia pendiente

Estas notas no constituyen una auditoría Lighthouse ni una prueba con cuentas. Las diferencias entre producción y local deben contrastarse por URL, viewport y estado de carga. No se deben inferir cifras de usuarios, conversión o actividad a partir de texto promocional.

## Primera cohorte de plataformas gay/LGBT

### SCRUFF — https://www.scruff.com/

SCRUFF comunica una comunidad de “30+ million” y combina cuatro trabajos: Browse, Match, Venture y Events. Su propuesta no queda limitada al swipe: ofrece descubrimiento local/global, filtros, match que aprende del comportamiento, agenda de viaje y eventos queer con RSVP. La página afirma “No spambots” y destaca chat, filtros y presencia. El aprendizaje para Chactivo es convertir la intención en una acción concreta y combinar conversación con contexto local/eventos, pero sin afirmar volúmenes que Chactivo no haya medido.

### Taimi — https://taimi.com/

Taimi muestra una arquitectura editorial mucho más amplia que una landing de app: páginas por identidad/intención, blog, wiki, historias, FAQ, estados/ciudades y recursos de seguridad. En la página observada destaca perfiles inclusivos, pronombres, “Vibes”, modo stealth, protección frente a screenshots, tarjetas privadas, chat instantáneo, exploración de otras ubicaciones y una sección de soporte y reglas comunitarias. La oportunidad que revela es construir confianza y cobertura semántica con contenido útil y rutas claras, no llenar el footer de keywords. Sus cifras de usuarios y likes son afirmaciones de Taimi y no deben trasladarse a Chactivo.

### Hornet — https://hornet.com/

Hornet se posiciona como red social queer y no solo como app de citas. Comunica Join, Discover, Share y Safety; incluye feed, hashtags, filtros, videos breves, viaje virtual, discusiones con líderes de comunidad, moderadores, soporte 24/7 y contenido editorial. El patrón relevante es que un feed y una comunidad dan razones para volver incluso cuando no se inicia una cita. Chactivo puede aprender de esa relación entre chat y OPIN, pero debe usar actividad real y moderación verificable.

### ROMEO — https://www.romeo.com/

ROMEO presenta una propuesta breve: “Dates, Friends, Love”, con “Sign up”, “Log in”, “No ads”, “No phone number required” y “One-minute signup”. La página observada mostraba “0 Online now”, lo que confirma por contraste que es mejor mostrar cero o estado vacío real que inventar actividad. El aprendizaje es reducir fricción del registro, declarar de forma visible qué datos no son obligatorios y diseñar el empty state como parte del producto.

### JACK'D — https://www.jackd.com/en

JACK'D usa un mensaje corto y accionable: “Meet them here”. Su landing combina Match y Browse, muestra filtros/búsqueda y utiliza una cuadrícula de perfiles como prueba visual de comunidad. La estructura es simple y orientada a la acción: descubrir, conectar y eventualmente ampliar funciones. Para Chactivo, la lección es reducir el hero a una promesa y un siguiente paso, con filtros/segmentos solo cuando exista una base de usuarios suficiente.

### Daddyhunt — https://daddyhunt.com/

Daddyhunt se posiciona en un nicho específico y comunica “Browse. Chat. Meet.”. Su diferenciación no intenta servir a todo el mundo: se apoya en una identidad clara, experiencia acumulada, respeto, autenticidad y conexiones reales. El aprendizaje es que Chactivo puede tener una intención principal reconocible —conversación gay en Chile— en vez de mezclar demasiados verticales antes de consolidar la sala principal.

### GROWLr — https://www.growlrapp.com/

GROWLr se presenta como red social de la comunidad bear y añade mensajería, exploración local/global, streaming en vivo y participación. La propuesta combina un nicho identitario con actividad visual y tiempo real. Para Chactivo, el patrón transferible es dar a OPIN una función de comunidad que complemente al chat; no conviene copiar live streaming ni monetización mientras no exista una necesidad validada y una infraestructura de moderación adecuada.

## Segunda cohorte: comunidad queer y referentes inclusivos

### Lex — https://www.lex.lgbt/

La propuesta observada en el resultado oficial es textual y comunitaria: “If it's queer, it's here”. Lex enfatiza explorar lo que ocurre en la comunidad queer, descubrir grupos y eventos cercanos y conocer amistades. Es un referente directo para estudiar un muro tipo OPIN: el valor principal puede estar en publicaciones e intención social, no únicamente en tarjetas de fotografías.

### HER — https://weareher.com/

HER comunica una experiencia de citas y comunidad queer con un equipo de Trust and Safety, moderación y verificación. Se incorpora como referente de confianza, onboarding y comunidad, aunque su público principal y sus necesidades no son idénticos a los de Chactivo.

### Feeld — https://feeld.co/

Feeld se posiciona en conexiones abiertas e inclusivas, con énfasis en explorar deseo, género y relaciones de forma segura. Se incorpora como referente de claridad de intención y control de límites; no se debe trasladar su modelo relacional a Chactivo sin validación de usuarios.

**Nota de evidencia:** estos tres puntos parten de sus páginas oficiales y snippets públicos localizados; se requiere completar la lectura de sus páginas antes de convertirlos en conclusiones de diseño o producto.

## Lectura directa de segunda cohorte

Lex estructura su propuesta alrededor de una comunidad queer y de la exploración de grupos/eventos cercanos. La página utiliza una demostración textual de convocatoria a un evento y testimonios breves. La lección para OPIN es que un muro puede generar intención social concreta —“qué ocurre”, “quién se reúne”, “qué busco”— si cada publicación tiene contexto, respuesta y una acción clara.

HER organiza su página en identidad, conexión, comunidades, seguridad, FAQ y contenido editorial. Declara comunidades, perfiles personalizables con pronombres/identidad/orientación, eventos, reportes y un equipo de Trust & Safety. También publica rutas editoriales y respuestas a preguntas específicas. El patrón transferible es que la confianza no debe estar escondida en un enlace de footer: debe aparecer cerca de la acción de registro y conversación.

Feeld presenta perfiles como personas completas, usa etiquetas de intereses/deseos y permite expresar distintas intenciones. También comunica perfiles verificados, protección de capturas, detección/blur de desnudos, control de visibilidad, reportes confidenciales, equipo de seguridad 24/7 y eventos presenciales. El aprendizaje para Chactivo es separar claramente identidad pública, intención y controles de privacidad; no es necesario ni conveniente copiar funcionalidades costosas o sensibles sin backend validado.

## Tercera cohorte: nichos, comunidad y grupos

### MR X — https://www.mrxapp.com/

MR X presenta una interfaz web mínima con login, recuperación de contraseña, términos, guía de fotos y contacto. Su frase “Real men - no attitude” busca una identidad de nicho, pero la landing ofrece poca información pública. El aprendizaje es que una marca clara no reemplaza la necesidad de explicar cómo empezar, cómo se protege a la comunidad y qué sucede después del registro.

### Queer Social — https://www.queersocial.us/

Queer Social se presenta como plataforma curada de espacios seguros y comunidad LGBTQ+, conectada con eventos presenciales, grupos, conversaciones, networking y una Social Hour semanal gratuita. Declara ausencia de anuncios, spam y venta de datos, y vincula su sostenibilidad a miembros/soporte comunitario. El aprendizaje para Chactivo es que la recurrencia puede venir de rituales y eventos reales, pero cualquier promesa de privacidad, moderación o gratuidad debe corresponder con controles verificables.

### Bumble — https://bumble.com/en-us/

Bumble separa Date y BFF, comunica una misión de relaciones auténticas y ofrece historias, intereses y un programa Member Circle donde usuarios participan en chats, discusiones y pruebas de producto. El patrón transferible es separar claramente intenciones —cita, amistad, conversación— y recoger feedback real, sin mezclar los recorridos dentro de la misma pantalla.

### Discord — https://discord.com/

Discord se centra en comunidades persistentes: espacios personalizados, chat de texto/voz/video, perfiles y estados, entrada y salida sin llamada, grupos y actividad compartida entre dispositivos. No es un competidor gay directo, pero es un referente fuerte para retención de chat: el usuario vuelve porque su comunidad, historial y estado social continúan existiendo.

## Cuarta cohorte: seguridad, eventos, moderación y mensajería

### Tinder — https://policies.tinder.com/community-resources/safety-features

Tinder expone un Safety Center accesible desde la aplicación, unmatch, bloqueo de perfiles y contactos, Photo Verification, filtro de mensajes potencialmente inapropiados, alertas al intercambiar datos de contacto y Traveler Alert para personas LGBTQ+ en países de riesgo. La lección transferible es que seguridad y privacidad deben acompañar el momento de conversación, no quedar solo en una página legal.

### Meetup — https://www.meetup.com/

Meetup convierte intereses en grupos y eventos cercanos. La portada ofrece acceso a eventos, categorías, ciudades, asistencia visible y creación de grupos. Es un referente de recurrencia legítima: hay motivos calendarizados para volver y un mecanismo para que la comunidad aporte actividad. Chactivo debe mostrar eventos únicamente cuando existan y estén moderados.

### Reddit — https://redditinc.com/policies/moderator-code-of-conduct

Reddit se incorpora como referente de comunidades temáticas y moderación. El código de conducta para moderadores y sus políticas públicas muestran que la gobernanza es parte del producto, no solo una función técnica. Para OPIN esto implica roles claros, reportes trazables, reglas visibles y separación entre contenido público y conversaciones privadas.

### Telegram — https://telegram.org/faq

Telegram comunica velocidad, sincronización entre dispositivos, usernames, grupos/canales, replies, menciones, hashtags, historial unificado, notificaciones inteligentes, moderación granular, anti-spam y eliminación de mensajes. Es un referente directo para diseñar el chat: volver debe recuperar contexto y no empezar de cero; la privacidad debe tener controles comprensibles. Sus afirmaciones de escala y capacidad son propias de Telegram y no deben reutilizarse en Chactivo.

### Signal — https://signal.org/

Signal se mantiene como referente de mensajería privada centrada en minimización de datos y seguridad. Su modelo sirve para contrastar la diferencia entre chat público de comunidad y chat privado: Chactivo debe declarar con precisión qué protege, qué guarda y qué no ofrece todavía, sin prometer cifrado de extremo a extremo si el backend no lo implementa.

### Signal — https://signal.org/ y https://signal.org/legal/

Signal comunica privacidad como propiedad central: cifrado de extremo a extremo por defecto, ausencia de anuncios/trackers, grupos y mensajería. Sus términos explican además que el servicio no puede acceder al contenido cifrado y que la cuenta requiere número de teléfono. El aprendizaje para Chactivo es declarar con precisión la frontera entre chat público, chat privado, datos de perfil y almacenamiento; no usar lenguaje de “privado” o “seguro” como sinónimo de cifrado de extremo a extremo si la implementación no lo soporta.

## Comprobación directa de landings en producción

### `/santiago`

La URL carga una landing extensa con título “Chat Gay Santiago | Conoce Gente De Santiago En Vivo | Chactivo”, hero “Chat Gay Santiago Chile”, CTA “Entrar al chat principal” y una segunda acción de registro. Visualmente utiliza fondo muy oscuro, acentos cian/magenta y varias secciones. La captura muestra una caja de demostración de chat con la etiqueta “24 activos”; al contrastarla con el código local, esa caja corresponde a `ChatDemo`, cuyos mensajes, nombres, avatares y reacciones están hardcodeados y animados. Es una violación del criterio de no inventar actividad y debe retirarse o sustituirse por un estado de actividad real/neutral.

La landing también presenta afirmaciones fuertes como “Privacidad Real”, “No rastreamos tu actividad”, “Moderación 24/7 Híbrida”, “Derecho al Olvido en 24 horas” y “Encriptación de Mensajes”. Estas afirmaciones deben auditarse contra la implementación y la política real; mientras no estén demostradas, deben reformularse de manera honesta.

### `/mas-30`

La navegación directa a `https://chactivo.com/mas-30` reprodujo un fallo visible: la aplicación mostró “Algo salió mal”, “Ocurrió un error inesperado” y botones de reintento/recarga/inicio. Este es un bug crítico de producción, no una opinión visual. Debe reproducirse en local con las mismas condiciones y aislarse antes de afirmar que la landing funciona. El error puede estar en un componente lazy, datos/servicio o una dependencia runtime, por lo que no se debe ocultar con una redirección sin entender la causa.

### `/global`

La landing global carga una demo de conversación con `ChatDemo` y muestra actividad simulada. El HTML público incluye cifras y testimonios concretos como “24 activos”, “Más de 1,000 usuarios confían”, “4.8/5 de 247 opiniones”, “150+ usuarios activos”, “12,847 conversaciones reales”, “100% moderado y seguro” y una promesa de carga “1ms”. Al contrastar el componente local, los mensajes, nombres, avatares, reacciones y temporizadores son datos hardcodeados, no lecturas de actividad real. Esta superficie debe reconstruirse para no presentar datos ni testimonios ficticios.

La landing también publica afirmaciones absolutas de ausencia de bots/estafas y una historia personal del creador. La historia puede mantenerse solo si es auténtica y autorizada, pero las cifras, calificaciones, moderación y seguridad deben provenir de evidencia auditable o desaparecer. La ruta `/global` está indexable según el sitemap y por eso el problema afecta tanto a usuarios como a confianza de buscadores.

### `/opin`

OPIN carga como “Chactivo BETA” y “Solo lectura” para visitantes, con filtros de intención, un contador de notas y un CTA de registro. La vista pública sí contiene publicaciones reales generadas por usuarios, con texto sexual explícito, ubicaciones aproximadas, estados de intención, comentarios y algunos avatares provenientes de DiceBear/Cloudinary. No se copiaron ni se incluirán esos datos en el informe; se registran solo como observación funcional de contenido público.

La superficie tiene potencial como muro de intención y descubrimiento, pero debe reforzar control de edad, reglas de publicación, reportar/bloquear, consentimiento y moderación antes de promocionarse como experiencia segura. También debe decidir explícitamente qué parte es indexable: actualmente la ruta usa `NoindexMeta` en local, mientras que el sitemap público observado la incluye. Esa incoherencia debe resolverse y verificarse en producción.

El CTA y el estado de solo lectura son comprensibles, pero el usuario visitante no recibe una explicación suficientemente concreta de qué puede hacer después de registrarse. El contador “17 notas” parece un dato real de la vista pública, pero cualquier contador o estado de actividad debe manejar correctamente cero, carga, error y frescura.

### `/chat/principal`

La ruta pública muestra una shell de sala con carga inicial, “0 mensajes en 60 min”, “0 activos”, guía para completar rol/comuna/intención, elección de nickname, enlaces al tablón y un estado de usuarios conectados. El producto intenta orientar a mensajes concretos, lo cual es valioso, pero hay mucha densidad de instrucciones antes del primer mensaje. En producción la captura quedó en estado de carga visual mientras el HTML extraído mostró la estructura de la sala; se debe reproducir con un flujo real y medir el tiempo hasta poder escribir.

La propia interfaz declara que el asistente no simula usuarios y que la sala debe llevar a conversación privada; esto es coherente con el criterio de honestidad. Sin embargo, el valor “0 activos” y el estado de “Cargando personas…” deben tener una transición clara de carga, vacío, error y reconexión.

### `/faq`

La FAQ carga, pero aparece duplicada visualmente —header/marca y misión/footer se repiten— y contiene afirmaciones absolutas que no están demostradas por la evidencia local: cifrado de conversaciones, moderación humana 24/7, ausencia total de trackers, borrado garantizado en 24 horas, verificación opcional, seguridad absoluta para profesionales y “sin perfiles fake”. También dice que el chat público es siempre gratuito y que Premium incluye funciones que deben coincidir con el modelo actual.

La FAQ sí cubre preguntas relevantes sobre gratuidad, registro, privacidad, moderación, eliminación, reportes y verificación. La corrección necesaria no es eliminar confianza, sino hacerla verificable: diferenciar lo que existe hoy, lo que depende de Supabase configurado, lo que es opcional y lo que sigue en preparación. La duplicación de layout y las respuestas absolutas son problemas de UX/E-E-A-T prioritarios.

## Estándares externos para SEO, performance y accesibilidad

### Google Search Central — https://developers.google.com/search/docs/fundamentals/seo-starter-guide

La guía oficial define SEO como ayudar a los buscadores a entender el contenido y a las personas a decidir si visitar un resultado. Recomienda contenido único, actualizado, útil y orientado a personas; URLs descriptivas; reducir duplicados con canonical; enlaces relevantes con anchor text apropiado; títulos y meta descripciones claros; imágenes de calidad con alt descriptivo; y evitar anuncios/intersticiales que distraigan. También advierte que no hay garantía de indexación y que el meta tag `keywords` no es una vía de posicionamiento. Para Chactivo esto confirma que el contenido oculto “solo para Google”, las landings repetidas y las redirecciones rápidas no deben ser el centro de la estrategia.

La observación fue hecha sobre la página oficial de Google Search Central y se conservará como referencia para el informe final. Las recomendaciones se aplicarán sin crear páginas doorway, sin keyword stuffing y sin inventar actividad.

### web.dev Web Vitals — https://web.dev/articles/vitals

La documentación oficial de web.dev fija como orientación de buena experiencia un LCP de hasta 2,5 s, INP de 200 ms o menos y CLS de 0,1 o menos. Estas cifras son umbrales de referencia, no métricas observadas de Chactivo. El baseline local debe registrar el tamaño de los chunks y el tiempo de build; las métricas de campo de producción requieren Lighthouse/PageSpeed/CrUX o RUM y no deben inventarse.

### W3C WCAG 2.2 — https://www.w3.org/TR/WCAG22/ y https://www.w3.org/WAI/WCAG22/quickref/

WCAG 2.2 AA exige, entre otros criterios, contraste mínimo de 4,5:1 para texto normal y 3:1 para texto grande; foco visible para toda interfaz operable por teclado; foco no oculto por contenido del autor; reflow y objetivos táctiles adecuados; alternativas textuales para contenido no textual; y mensajes/etiquetas comprensibles. La auditoría de Chactivo debe verificar estos puntos en botones, filtros, composer, modales, avatares, mensajes dinámicos y navegación móvil. No se debe afirmar conformidad WCAG hasta medir y probar los flujos.

## Robots, sitemap y legal público

### Robots y sitemap

`https://chactivo.com/robots.txt` permite varias landings, `/opin` y `/chat/principal`, bloquea áreas privadas/técnicas y apunta a `sitemap-index.xml`. El `sitemap.xml` observado enumera 15 URLs con prioridades/frecuencias, incluidas `/global`, `/santiago`, `/mas-30`, hubs internacionales, satélites, `/faq`, `/opin` y `/chat/principal`. Debe verificarse si el índice enlazado existe y si el sitemap que realmente procesa el servidor coincide con el que se mantiene en el repositorio.

La inclusión de `/opin` y `/chat/principal` exige una política editorial clara: contenido de usuario y chat cambian, pueden contener material sexual y no deben indexarse sin controles de edad, moderación, canonicalización y revisión de exposición. El sitemap no debe usar `priority` o `changefreq` como sustituto de contenido útil; son solo metadatos secundarios frente a calidad, rastreabilidad y experiencia.

### Términos públicos

`https://chactivo.com/terminos-condiciones.html` exige ser mayor de 18 años, prohíbe spam y contenido ilegal, y describe asistentes automatizados que participarían en salas hasta que haya suficientes usuarios. Esa declaración entra en conflicto con el mandato actual de no bots, no actividad ficticia y no engaño; antes de cualquier relanzamiento debe eliminarse o reescribirse conforme al producto real. La página también afirma responsabilidades y prácticas de moderación que deben coincidir con la implementación Supabase y la capacidad operativa.

`https://chactivo.com/politica-privacidad.html` no devolvió contenido extraíble en la comprobación pública; esto deja una señal legal/SEO crítica que debe verificarse directamente en navegador/servidor y corregirse si la URL está rota, vacía o no enlaza a la política vigente.

### Comprobación adicional de producción

`https://chactivo.com/politica-privacidad.html` devuelve una página Vercel `404: NOT_FOUND`. No es solo un fallo de extracción: el navegador confirmó que la política enlazada desde las landings no está disponible en esa URL. Esto es crítico para confianza, cumplimiento y SEO, y debe repararse con una ruta válida o un enlace corregido antes de promover registros.

`https://chactivo.com/sitemap-index.xml` sí existe y apunta únicamente a `https://chactivo.com/sitemap.xml`, con `lastmod` 2026-04-09. Robots y sitemap-index son coherentes entre sí, pero hay que revisar que el contenido y los estados de indexación de las 15 URLs sigan siendo legítimos después de retirar demos sintéticas y corregir páginas rotas.

### Reproducción local posterior a los cambios

El servidor Vite local respondió correctamente para `http://127.0.0.1:4173/mas-30` y mostró el shell SEO con enlaces estáticos y el nodo React. La sesión del navegador no llegó a completar la hidratación antes de quedar no disponible en la consulta siguiente; por tanto, esto confirma respuesta HTTP/shell, pero **no** se contabiliza como validación visual completa del flujo React. La validación final debe incluir navegador local o una revisión manual después de que Daniel configure las variables de entorno necesarias.
