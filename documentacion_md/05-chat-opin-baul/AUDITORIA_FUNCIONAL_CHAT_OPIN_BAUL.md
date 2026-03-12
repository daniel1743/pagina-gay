# AUDITORIA_FUNCIONAL_CHAT_OPIN_BAUL

Fecha de auditoria: 2026-02-10
Proyecto: Chactivo (chat principal, OPIN, Baul)
Objetivo: documentar el comportamiento real y actual del sistema para que una IA de investigacion pueda entender intencion, reglas, flujos, y detectar brechas frente a practicas exitosas del mercado, sin asumir nada.

## 1) Resumen ejecutivo
Este documento describe el comportamiento funcional observado en el codigo para tres subsistemas: Chat Principal, OPIN (tablon), y Baul (tarjetas). Se detalla el flujo real de usuarios (invitados, registrados, admin), las reglas de acceso, la logica de mensajes, presencia, feed, interacciones y las zonas donde se introducen senales no genuinas (boost, estados online simulados, contenido estable/seed). Se incluyen fuentes de codigo y reglas Firestore para que cualquier auditor o IA pueda verificar cada afirmacion.

## 2) Alcance y fuentes
Alcance:
- Chat Principal (ruta /chat/principal) y su infraestructura de mensajes, presencia, moderacion, on-boarding guest, y UI de apoyo.
- OPIN (ruta /opin y /opin/new) como tablon de notas con caducidad y reacciones.
- Baul (ruta /baul) como sistema de tarjetas, likes, mensajes, matches y geolocalizacion.

Fuentes principales (codigo y reglas):
- src/pages/ChatPage.jsx
- src/services/chatService.js
- src/services/presenceService.js
- src/services/antiSpamService.js
- src/services/vocService.js
- src/hooks/useEngagementNudge.js
- src/components/chat/TarjetaPromoBanner.jsx
- src/components/auth/GuestUsernameModal.jsx
- src/contexts/AuthContext.jsx
- src/config/rooms.js
- src/services/opinService.js
- src/pages/OpinFeedPage.jsx
- src/pages/OpinComposerPage.jsx
- src/components/opin/OpinCard.jsx
- src/components/opin/OpinCommentsModal.jsx
- src/services/engagementBoostService.js
- src/services/tarjetaService.js
- src/components/baul/BaulSection.jsx
- src/components/baul/TarjetaEditor.jsx
- src/components/baul/TarjetaUsuario.jsx
- firestore.rules

## 3) Mapa de entidades y colecciones
Chat
- rooms/{roomId}/messages: mensajes publicos del chat. Lectura publica y creacion sin auth en reglas (ver firestore.rules).
- roomPresence/{roomId}/users/{userId}: presencia en sala, solo usuarios autenticados (incluye anon/guest).

OPIN
- opin_posts: posts del tablon, publicos (read). Crear solo registrados.
- opin_comments: comentarios de posts, publicos (read). Crear solo registrados.
- opin_actions: acciones de editar/eliminar con limite diario, solo registrados.

Baul
- tarjetas/{odIdUsuari}: tarjeta principal del usuario.
- tarjetas/{odIdUsuari}/actividad: likes, visitas, mensajes recibidos.
- matches/{matchId}: matchs entre usuarios registrados.

Otros relevantes
- guests: identidad guest persistente y contador de mensajes.
- users: perfiles registrados.

## 4) Chat Principal: como actua
### 4.1 Rutas y acceso
- Sala principal unica activa: roomId principal.
- Salas locked (mas-30, santiago, gaming) se redirigen a principal.
- Salas internacionales solo accesibles desde landing correcta.
- Invitados solo pueden acceder a /chat/principal desde el flujo de UI.
Fuentes: src/config/rooms.js, src/pages/ChatPage.jsx, src/components/auth/GuestUsernameModal.jsx

### 4.2 Onboarding guest y persistencia
- Guest entra via GuestUsernameModal, elige nickname y recibe avatar aleatorio.
- signInAsGuest usa Firebase signInAnonymously y crea identidad persistente con UUID local.
- La sesion guest se auto-restaura si existe identidad guardada (auto-login en AuthContext).
- ChatInput fuerza modal de nickname si el guest intenta escribir sin nombre.
Fuentes: src/components/auth/GuestUsernameModal.jsx, src/contexts/AuthContext.jsx, src/components/chat/ChatInput.jsx

### 4.3 Suscripcion de mensajes y limites
- Al entrar a sala, se subscribe a mensajes con limite 50 para guest/anon, 100 para registrados.
- Mensajes se renderizan con UI optimista y se deduplican por clientId.
- Ordenamiento por timestampMs, fallback a timestamp.
Fuentes: src/pages/ChatPage.jsx, src/services/chatService.js

### 4.4 Envio de mensajes
- Envio es optimista y luego se valida en background con antiSpamService.
- Validacion bloquea telefono, email, enlaces, y palabras prohibidas; sugiere OPIN/Baul.
- En chatService, si no hay auth.currentUser, bloquea links y genera userId temporal.
- En reglas Firestore, crear mensajes solo requiere content valido (sin auth).
Fuentes: src/pages/ChatPage.jsx, src/services/antiSpamService.js, src/services/chatService.js, firestore.rules

### 4.5 Moderacion y sanciones
- Usuarios registrados pueden estar muteados o baneados y no enviar.
- Invitados no pasan por sanciones de cuenta registradas.
- Reacciones (like/dislike) solo para registrados (guest bloqueado).
Fuentes: src/pages/ChatPage.jsx, src/services/sanctionsService.js, firestore.rules

### 4.6 Presencia y contadores
- joinRoom y leaveRoom solo si hay auth.currentUser.
- Presencia en roomPresence, filtro de inactividad local 5 minutos.
- Typing status deshabilitado en presenceService.
- Contadores globales deshabilitados para evitar loops.
Fuentes: src/services/presenceService.js, src/pages/ChatPage.jsx

### 4.7 Mensajes de sistema y ayuda
- VOC: envia mensajes de sistema si pasan 30s sin mensajes reales.
- Companion AI: sugiere mensajes al usuario pasivo, no postea por si mismo.
Fuentes: src/services/vocService.js, src/hooks/useCompanionAI.js

### 4.8 Cross-promocion OPIN/Baul
- useEngagementNudge muestra toasts hacia OPIN/Baul segun actividad.
- TarjetaPromoBanner muestra CTA a Baul u OPIN para registrados.
Fuentes: src/hooks/useEngagementNudge.js, src/components/chat/TarjetaPromoBanner.jsx

## 5) OPIN: como actua
### 5.1 Acceso y modos
- Lectura publica (guest puede ver).
- Crear post solo usuarios registrados (no guest/anon).
- Comentarios solo registrados.
Fuentes: src/pages/OpinFeedPage.jsx, src/services/opinService.js, firestore.rules

### 5.2 Publicacion
- Min 10 caracteres, max 500 en servicio (UI limita a 280).
- Cooldown 2 horas entre posts por usuario.
- Expira a 24h (expiresAt), salvo regla especial del feed.
Fuentes: src/services/opinService.js, src/pages/OpinComposerPage.jsx

### 5.3 Feed
- getOpinFeed trae hasta 200 posts y arma feed ponderado.
- Existen posts estables (isStable=true) que no expiran.
- Si total de posts activos < 20, no se aplica expiracion 24h.
- Se asegura al menos 3 posts reales en top 10 si existen.
Fuentes: src/services/opinService.js

### 5.4 Interacciones
- likes y reacciones eroticas (emoji) por post.
- comentarios con modal y contador.
- acciones de editar/eliminar limitadas (max 4/24h) via opin_actions.
Fuentes: src/components/opin/OpinCard.jsx, src/components/opin/OpinCommentsModal.jsx, src/services/opinService.js

### 5.5 Admin y seeding
- Admin puede crear OPIN estables.
- Existe funcion seedStableOpinExamples que crea ejemplos con usernames genericos.
Fuentes: src/services/opinService.js, src/components/admin/OpinStablesPanel.jsx

### 5.6 Boost de engagement
- procesarBoostOpinion incrementa viewCount y likeCount en Firestore.
- OpinFeedPage aplica boost a mis opiniones cuando cargo feed.
Fuentes: src/services/engagementBoostService.js, src/pages/OpinFeedPage.jsx

## 6) Baul: como actua
### 6.1 Acceso
- Lectura de tarjetas requiere auth (incluye anon/guest).
- Crear tarjeta solo el owner; invitados tambien crean su propia tarjeta.
- Matches y chats privados solo registrados.
Fuentes: firestore.rules, src/contexts/AuthContext.jsx

### 6.2 Creacion y edicion de tarjeta
- Tarjeta se crea automaticamente al autenticar (registrado o guest).
- Editor permite campos de perfil, bio, ubicacion, foto, rol, horarios.
Fuentes: src/contexts/AuthContext.jsx, src/services/tarjetaService.js, src/components/baul/TarjetaEditor.jsx

### 6.3 Descubrimiento y orden
- Baul carga tarjetas recientes o cercanas si hay geolocalizacion.
- Se arma score de perfil para ordenar y se muestra mi tarjeta primero.
Fuentes: src/components/baul/BaulSection.jsx, src/services/tarjetaService.js

### 6.4 Estado online y visibilidad
- Se calcula estado real desde ultimaConexion.
- aplicarBoostEstadoConexion fuerza minimo de online (10-15), el resto queda como reciente.
- MOSTRAR_OFFLINE=false evita mostrar offline, se usa reciente.
Fuentes: src/services/tarjetaService.js

### 6.5 Likes, visitas, mensajes y matches
- darLike incrementa likes y crea match si es mutuo.
- registrarVisita incrementa visitas y registra actividad.
- enviarMensajeTarjeta crea actividad tipo mensaje (nota asinc, no es chat privado).
- matches se guardan en coleccion matches y se muestran en UI.
Fuentes: src/services/tarjetaService.js, src/components/baul/BaulSection.jsx, src/components/baul/MatchesList.jsx, src/components/baul/MensajeTarjetaModal.jsx

### 6.6 Boost de engagement
- aplicarBoostVisualATodas sustituye likes/visitas por valores esperados al render.
- procesarBoostTarjeta puede escribir incrementos en Firestore para likes/visitas.
- TarjetaPromoBanner usa conteos esperados como gancho.
Fuentes: src/services/tarjetaService.js, src/services/engagementBoostService.js, src/components/chat/TarjetaPromoBanner.jsx

## 7) Senales no genuinas detectadas
Estas son conductas observadas en codigo que generan actividad o numeros no reales:
- EngagementBoostService incrementa likes y vistas en OPIN y Baul.
- Baul aplica boost de estado online para mostrar 10-15 online aunque no existan.
- OPIN incluye posts estables y puede seedear ejemplos con usernames genericos.
- VOC envia mensajes de sistema automaticos tras 30s de silencio.
- Existen servicios de bots estaticos y seed de conversaciones, aunque no estan conectados en ChatPage hoy.
Fuentes: src/services/engagementBoostService.js, src/services/tarjetaService.js, src/services/opinService.js, src/services/vocService.js, src/services/staticBotMessages.js, src/services/seedConversationsService.js

## 8) Brechas vs principio "sin simulacion"
- Likes/vistas artificiales violan el criterio de datos reales.
- Estado online simulado contradice el principio de actividad real.
- OPIN estable con usernames genericos puede percibirse como falso si no se etiqueta.
- VOC puede confundirse con mensajes humanos si no se etiqueta de sistema.

## 9) Dimensiones para comparacion con apps exitosas (guia de benchmarking)
Esta seccion no asume apps especificas. Es una matriz de comparacion para que una IA investigue patrones.
- Onboarding: friccion, tiempo al primer mensaje, calidad del primer loop.
- Retencion: recordatorios basados en actividad real, eventos programados, agendas.
- Descubrimiento: feed con contenido real, mecanismos de exploracion sin falsos positivos.
- Social proof honesto: contadores basados en presencia real o historicos verificados.
- Seguridad: control de spam, bloqueo de contacto publico, reputacion.
- Privacidad: ubicacion, control de visibilidad, opciones de anonimo.
- Conversacion: herramientas de arranque (temas, prompts), no simuladas.
- Conversion: gating de funciones premium sin bloquear funciones core.

## 10) Recomendaciones de cambios (orientadas a honestidad y rendimiento)
Prioridad alta
- Eliminar o desactivar engagementBoostService en OPIN y Baul. Sustituir por "estimado" o por metricas reales.
- Remover boost de estado online en Baul o etiquetarlo explicitamente como "reciente" sin contar online.
- Etiquetar mensajes VOC como "mensaje del sistema" visible y diferenciado.

Prioridad media
- Limitar reglas Firestore para crear mensajes a usuarios autenticados o con un token de session, evitando abuso.
- En OPIN, etiquetar posts estables como "editorial" o "fijado" y eliminar seeding automatico.
- Ajustar banners de promo para no mostrar numeros derivados de boost.

Prioridad baja
- Consolidar un panel de transparencia: mostrar porcentaje de actividad real vs sistema.
- Crear indicadores honestos de actividad (personas distintas hoy, ultimo mensaje real).

## 11) Preguntas abiertas para investigacion adicional
- Cual es la tasa real de concurrencia por franja horaria y por sala.
- Que features aumentan repeticion de visitas sin usar simulacion.
- Que formato de feed genera mas conversion a registro sin inflar numeros.
- Que mensajes de sistema son percibidos como utiles vs intrusivos.

## 12) Anexo: archivos clave por subsistema
Chat Principal
- src/pages/ChatPage.jsx
- src/components/chat/ChatInput.jsx
- src/services/chatService.js
- src/services/presenceService.js
- src/services/antiSpamService.js
- src/services/vocService.js
- src/components/auth/GuestUsernameModal.jsx
- src/contexts/AuthContext.jsx
- firestore.rules

OPIN
- src/pages/OpinFeedPage.jsx
- src/pages/OpinComposerPage.jsx
- src/services/opinService.js
- src/components/opin/OpinCard.jsx
- src/components/opin/OpinCommentsModal.jsx
- firestore.rules

Baul
- src/components/baul/BaulSection.jsx
- src/services/tarjetaService.js
- src/components/baul/TarjetaEditor.jsx
- src/components/baul/TarjetaUsuario.jsx
- src/components/baul/MensajeTarjetaModal.jsx
- src/components/baul/MatchesList.jsx
- firestore.rules
