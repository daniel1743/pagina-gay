# ESENCIA_SERVICIOS_CHACTIVO_CHAT_OPIN_BAUL

Fecha de sintesis: 2026-02-15
Alcance: Chat Principal, OPIN y Baul (servicios activos en Chactivo)

## 0) Proposito y base documental
Este documento consolida la esencia, objetivo y funcionamiento real documentado en los MD del proyecto. Se prioriza la informacion funcional mas reciente y explicita y se senalan discrepancias cuando los MD no coinciden.

Base principal usada:
- AUDITORIA_FUNCIONAL_COMPLETA_IA.md (documento que declara ser completo)
- AUDITORIA_FUNCIONAL_CHAT_OPIN_BAUL.md (auditoria 2026-02-10)
- DOCUMENTACION_COMPLETA_CHAT.md
- docs/main-room-function.md
- SISTEMA-PERSISTENCIA-IDENTIDAD-GUEST.md
- SISTEMA-ANTI-SPAM.md
- OPIN_COMPLETO_RESUMEN.md
- OPIN_PLAN_EXTENDIDO.md
- OPIN_ESTRATEGIA_INVITADOS.md
- OPIN_FIRESTORE_RULES.md
- BAUL-TARJETAS-IMPLEMENTADO.md
- SISTEMA_GEOLOCALIZACION.md
- SISTEMA-SANCIONES-IMPLEMENTADO.md
- INVESTIGACION_MENSAJES_NO_AUTENTICADOS.md

## 1) Ecosistema y objetivos
Chactivo se disena como un ecosistema de tres pilares que resuelve tres problemas distintos de la comunidad gay.

| Problema | Solucion en Chactivo | Servicio |
|---|---|---|
| Quiero hablar con alguien ahora mismo sin barreras | Chat grupal inmediato sin registro obligatorio | Chat Principal |
| Quiero saber que buscan otros sin preguntar directo | Tablon de notas efimeras de 24h | OPIN |
| Quiero encontrar gente compatible y mantener identidad | Perfiles persistentes con matching | Baul |

Principios declarados en los MD:
- Cero friccion de entrada (entrar y chatear en segundos)
- Progresion natural: invitado -> registrado -> premium
- Contenido efimero y persistente: chat efimero, OPIN semi-efimero, Baul persistente
- Seguridad con filtros, pero sin bloquear conversacion adulta consensuada

## 2) Roles y acceso (resumen)

| Rol | Chat Principal | OPIN | Baul | Chat privado |
|---|---|---|---|---|
| Invitado | Lee y puede chatear en sala publica | Puede leer posts y ver vista parcial | Puede ver tarjetas en modo vista previa | No |
| Registrado | Acceso completo y salas desbloqueadas | Crear, comentar, reaccionar | Crear/editar tarjeta, likes, mensajes, match | Si |
| Premium (plan) | Sin limites y funciones premium | Igual, con badges | Perfil destacado | Si |
| Admin | Moderacion y sanciones | Posts estables y respuestas editoriales | Moderacion de tarjetas | Si |

Nota: La disponibilidad exacta de algunas capacidades varia entre MD y se lista en la seccion de inconsistencias.

## 3) Servicio 1: Chat Principal

### 3.1 Esencia y objetivo
- Sala grupal en tiempo real, equivalente a lobby publico (IRC/Discord) y puerta de entrada de menor friccion.
- Busca permitir conversacion real en menos de 5 segundos desde la llegada a la web.

### 3.2 Ruta y salas
- Ruta principal: /chat/principal (roomId: principal)
- No es landing, es sala funcional.

Salas documentadas en rooms.js (segun auditoria completa):
- principal (todos)
- gaming, mas-30, santiago (bloqueadas por umbral de usuarios activos)
- amistad, osos-activos, pasivos, versatiles, quedar-ya, hablar, morbosear (registrados)
- es-main, br-main, mx-main, ar-main (solo desde landing regional)

Comportamiento adicional documentado:
- Salas locked pueden redirigir a principal.
- Sala global antigua fue desactivada y reemplazada por principal.

### 3.3 Onboarding invitado y persistencia
- GuestUsernameModal solicita nickname y asigna avatar aleatorio.
- signInAnonymously y UUID local crean identidad persistente.
- Auto-login guest si existe identidad guardada.
- ChatInput fuerza modal de nickname si un guest intenta escribir sin nombre.

### 3.4 Flujo de mensaje
- UI optimista con clientId y deduplicacion.
- Ordenamiento por timestampMs con fallback a timestamp.
- Envio pasa por antiSpamService antes de enviar.
- Firestore: rooms/{roomId}/messages.

Campos del mensaje (documentado en auditoria completa):
- userId, username, avatar, content, type, timestamp, clientId, replyTo(opcional)

### 3.5 Anti-spam y filtrado
Filtro estricto en salas publicas:
- Bloquea o reemplaza telefono, email, links externos y palabras prohibidas.
- Reemplaza datos sensibles por mascaras y muestra aviso.
- Excepciones para saludos y mensajes muy cortos.

Filtro permisivo en chat privado:
- Bloquea insultos graves y spam explicito.
- Permite compartir contacto.

Reglas adicionales de anti-spam por duplicados:
- 4 mensajes iguales: advertencia.
- 5+ mensajes iguales: expulsado temporalmente 15 min.
- Memoria de duplicados: 5 min.

### 3.6 Presencia y contadores
- Firestore: roomPresence/{roomId}/users/{userId}.
- joinRoom/leaveRoom solo con auth.
- lastSeen con filtro de inactividad de 5 min.
- typing indicator deshabilitado para evitar escrituras excesivas.

### 3.7 Moderacion
- Sanciones para registrados (mute, ban temporal, ban permanente).
- Invitados no pasan por sanciones de cuenta registradas.

### 3.8 Mensajes de sistema y automatizaciones
- VOC: mensajes de sistema si pasan 30s sin mensajes reales.
- Companion AI: sugiere mensajes al usuario pasivo (no postea por si mismo).
- Sistema de bots conversacionales existe en codigo pero esta documentado como desactivado desde 2026-01-06.

### 3.9 Tipos de mensaje
- Activos: text, gif, system.
- Bloqueados por premium: image y voice (Coming Soon).

## 4) Servicio 2: OPIN (Tablon de descubrimiento)

### 4.1 Esencia y objetivo
- Tablon social de notas efimeras de 24h con textos cortos.
- Resuelve descubrimiento pasivo de lo que busca la comunidad sin abrir perfiles uno a uno.
- Actua como palanca de conversion (invitados leen, registrados interactuan).

### 4.2 Rutas
- /opin (feed)
- /opin/new (crear post)

### 4.3 Reglas fundamentales
- Duracion del post: 24h.
- Posts activos por usuario: 1.
- Cooldown entre posts: 2h.
- Texto: 10-280 en UI y 10-500 en DB.
- Comentarios por post: 100.
- Ediciones/eliminaciones: max 4 en 24h (opin_actions).
- Posts estables admin: minimo 20 visibles para evitar feed vacio.

### 4.4 Modelo de datos (Firestore)
Colecciones clave:
- opin_posts
- opin_comments
- opin_actions

Campos clave en opin_posts:
- userId, username, avatar
- title (opcional, max 50)
- text, color (6 colores)
- createdAt, expiresAt, isActive, isStable, isSeeded
- viewCount, profileClickCount, likeCount, likedBy
- commentCount, reactions, reactionCounts

Campos clave en opin_comments:
- postId, userId, username, avatar, comment, createdAt, isAdminReply

### 4.5 Feed y ordenamiento
- getOpinFeed trae hasta 200 posts.
- Algoritmo de shuffle ponderado para rotar visibilidad.
- Garantia: al menos 3 posts reales en top 10 si existen.
- Si hay menos de 20 posts activos, no se aplica expiracion de 24h.

### 4.6 Interacciones
- Likes (toggle) y reacciones con 6 emojis.
- Comentarios en modal con contador.
- Vista parcial de comentarios para invitados (primeros 3).

### 4.7 Admin y seeding
- Admin puede crear posts estables.
- Existe seeding automatico de ejemplos con usernames genericos.
- Admin puede responder como editorial.

### 4.8 Boost de engagement
- EngagementBoostService incrementa viewCount y likeCount.
- OpinFeedPage puede aplicar boost a mis opiniones al cargar el feed.

## 5) Servicio 3: Baul (Tarjetas y matching)

### 5.1 Esencia y objetivo
- Sistema de perfiles persistentes con matching mutuo y actividad.
- Convierte el chat efimero en identidad permanente y razones para volver.

### 5.2 Ruta
- /baul

### 5.3 Tarjeta y modelo de datos
Colecciones:
- tarjetas/{userId}
- tarjetas/{userId}/actividad
- matches/{matchId}

Campos clave en tarjeta:
- Identidad: odIdUsuari, nombre, esInvitado
- Perfil: edad, sexo, rol, etnia, alturaCm, pesaje
- Ubicacion: ubicacionTexto, ubicacion {lat, lon}, ubicacionActiva
- Bio y buscando
- Horarios de conexion
- Fotos: fotoUrl, fotoUrlThumb, fotoUrlFull, fotoSensible
- Estado: estaOnline, ultimaConexion
- Metricas: likesRecibidos, visitasRecibidas, mensajesRecibidos, actividadNoLeida
- Arrays: likesDe, visitasDe
- Timestamps: creadaEn, actualizadaEn

### 5.4 Creacion y edicion
- crearTarjetaAutomatica se ejecuta al autenticar (registrado o guest).
- Editor permite campos de perfil, bio, ubicacion, foto, rol, horarios.

### 5.5 Descubrimiento y orden
- Grid responsivo en BaulSection.
- Mi tarjeta siempre primero.
- Score de completitud con prioridad alta a foto real.
- Desempate por ultimaConexion.
- Si hay geolocalizacion, puede ordenar por cercania.

### 5.6 Estado online y visibilidad
- estado real basado en ultimaConexion.
- aplicarBoostEstadoConexion fuerza minimo 10-15 online y el resto queda como reciente.
- MOSTRAR_OFFLINE=false evita mostrar offline, se usa estado reciente.

### 5.7 Interacciones, actividad y match
- darLike incrementa likes y crea match si es mutuo.
- registrarVisita incrementa visitas y registra actividad.
- enviarMensajeTarjeta crea actividad tipo mensaje (nota asincrona, no DM).
- Match crea documento en matches y habilita chat privado.
- ActividadFeed ordena por prioridad: mensaje, match, like, visita.

### 5.8 Fotos y privacidad
- Compresion client-side en 3 tamanos.
- Subida a Cloudinary y guardado de 3 URLs.
- Foto sensible con blur hasta que el usuario la revele.

### 5.9 Boost de engagement
- aplicarBoostVisualATodas usa valores esperados en memoria.
- procesarBoostTarjeta puede escribir incrementos en Firestore.
- TarjetaPromoBanner usa conteos esperados como gancho.

## 6) Conexiones entre servicios
- Chat Principal -> OPIN: banner de descubrimiento para invitados.
- Chat Principal -> Baul: TarjetaPromoBanner y nudge.
- OPIN -> Baul: click en autor abre tarjeta.
- Baul -> Chat privado: match habilita DM.
- Invitado ve valor, pero se bloquea la interaccion para convertir a registro.

## 7) Senales no genuinas documentadas
- Boosts de engagement en OPIN y Baul (likes, vistas, visitas).
- Boost de estado online en Baul.
- Posts estables y seeding de OPIN.
- Mensajes de sistema VOC tras 30s.
- Servicios de bots y seed de conversaciones existen aunque estan documentados como desactivados.

## 8) Inconsistencias entre MD (requiere verificacion en codigo/reglas)
- Chat: reglas de Firestore para crear mensajes aparecen como auth requerida en INVESTIGACION_MENSAJES_NO_AUTENTICADOS.md, mientras la auditoria funcional indica creacion sin auth.
- Chat: DOCUMENTACION_COMPLETA_CHAT.md indica limite de 10 mensajes para invitados, mientras auditorias no lo mencionan.
- Chat: DOCUMENTACION_COMPLETA_CHAT.md describe typing indicator activo, auditorias indican desactivado.
- OPIN: OPIN_FIRESTORE_RULES.md indica lectura solo para autenticados; auditorias indican lectura publica.
- OPIN: longitud de comentarios aparece como 1-150 en auditoria completa y 1-500 en OPIN_COMPLETO_RESUMEN.md.
- Baul: reglas en BAUL-TARJETAS-IMPLEMENTADO.md indican lectura publica; auditoria funcional 2026-02-10 indica lectura requiere auth.
- Bots: SISTEMA_BOTS_IMPLEMENTADO.md describe bots activos; auditoria completa indica bots desactivados desde 2026-01-06.

## 9) Archivos clave por servicio (referencia rapida)
Chat Principal:
- src/pages/ChatPage.jsx
- src/components/chat/ChatInput.jsx
- src/services/chatService.js
- src/services/presenceService.js
- src/services/antiSpamService.js
- src/services/vocService.js
- src/components/auth/GuestUsernameModal.jsx
- src/contexts/AuthContext.jsx
- firestore.rules

OPIN:
- src/pages/OpinFeedPage.jsx
- src/pages/OpinComposerPage.jsx
- src/services/opinService.js
- src/components/opin/OpinCard.jsx
- src/components/opin/OpinCommentsModal.jsx
- src/components/opin/OpinDiscoveryBanner.jsx
- src/components/admin/OpinStablesPanel.jsx
- firestore.rules

Baul:
- src/pages/BaulPage.jsx
- src/components/baul/BaulSection.jsx
- src/components/baul/TarjetaEditor.jsx
- src/components/baul/TarjetaUsuario.jsx
- src/components/baul/MensajeTarjetaModal.jsx
- src/components/baul/ActividadFeed.jsx
- src/components/baul/MatchesList.jsx
- src/services/tarjetaService.js
- firestore.rules
