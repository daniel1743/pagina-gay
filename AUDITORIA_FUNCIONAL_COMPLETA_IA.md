# AUDITORIA FUNCIONAL COMPLETA - CHACTIVO
## Documento de Contexto para IA de Investigacion Avanzada

> **Proposito de este documento:** Proporcionar a una IA de investigacion avanzada una comprension total, sin ambiguedades, del concepto, la intencion, la arquitectura y el funcionamiento de las tres funcionalidades principales de Chactivo: **Chat Principal**, **Opin** y **Baul**. Nada debe darse por sentado. Todo esta explicado desde cero para que la IA pueda comparar con aplicaciones exitosas del mismo nicho y sugerir mejoras estrategicas.

---

## TABLA DE CONTENIDOS

1. [Que es Chactivo - Vision General](#1-que-es-chactivo---vision-general)
2. [Stack Tecnologico y Arquitectura](#2-stack-tecnologico-y-arquitectura)
3. [Sistema de Usuarios y Autenticacion](#3-sistema-de-usuarios-y-autenticacion)
4. [FUNCIONALIDAD 1: Chat Principal](#4-funcionalidad-1-chat-principal)
5. [FUNCIONALIDAD 2: Opin (Tablon de Descubrimiento)](#5-funcionalidad-2-opin-tablon-de-descubrimiento)
6. [FUNCIONALIDAD 3: Baul (Sistema de Tarjetas y Matching)](#6-funcionalidad-3-baul-sistema-de-tarjetas-y-matching)
7. [Como se Conectan las 3 Funcionalidades](#7-como-se-conectan-las-3-funcionalidades)
8. [Flujo Completo del Usuario](#8-flujo-completo-del-usuario)
9. [Moderacion y Seguridad](#9-moderacion-y-seguridad)
10. [SEO y Estrategia de Adquisicion](#10-seo-y-estrategia-de-adquisicion)
11. [Panel de Administracion](#11-panel-de-administracion)
12. [Problemas Conocidos y Deuda Tecnica](#12-problemas-conocidos-y-deuda-tecnica)
13. [Metricas Actuales y Objetivo](#13-metricas-actuales-y-objetivo)
14. [Contexto Competitivo: Apps Exitosas del Nicho](#14-contexto-competitivo-apps-exitosas-del-nicho)
15. [Mapa Completo de Archivos Criticos](#15-mapa-completo-de-archivos-criticos)

---

## 1. QUE ES CHACTIVO - VISION GENERAL

### 1.1 Concepto

**Chactivo** es una plataforma web de chat en tiempo real diseñada exclusivamente para la **comunidad LGBTQ+ en America Latina**, con foco inicial en Chile. No es solo un chat: es un ecosistema de tres pilares que busca resolver los tres problemas principales de las plataformas gay existentes:

| Problema | Solucion en Chactivo | Funcionalidad |
|----------|----------------------|---------------|
| "Quiero hablar con alguien ahora mismo, sin barreras" | Chat grupal instantaneo, sin registro obligatorio | **Chat Principal** |
| "Quiero saber que buscan otros sin exponerme" | Tablon anonimo de notas efimeras | **Opin** |
| "Quiero encontrar a alguien compatible cerca de mi" | Perfiles persistentes con matching mutuo | **Baul** |

### 1.2 Filosofia de Diseno

- **Cero friccion de entrada:** Un usuario puede estar chateando en menos de 3 segundos sin registrarse
- **Progresion natural:** Invitado → Registrado → Premium (cada nivel desbloquea mas)
- **Contenido efimero + persistente:** Chat es efimero (fluye), Opin es semi-efimero (24h), Baul es persistente (perfil permanente)
- **Seguridad sin rigidez:** Filtros de spam y contacto externo, pero permitiendo conversaciones adultas consensuadas
- **Latinoamerica primero:** Jerga chilena, expansion a Espana, Brasil, Mexico, Argentina

### 1.3 Modelo de Negocio (Planeado)

- **Freemium:** Chat basico gratuito, funciones premium de pago
- **Premium incluiria:** Mensajes de voz, envio de imagenes, perfil destacado en Baul, salas exclusivas
- **Publicidad:** Sistema de AdCarousel en lobby (implementado pero sin anunciantes activos)
- **Estado actual:** Pre-monetizacion, enfocado en crecimiento de base de usuarios

### 1.4 Publico Objetivo

- Hombres gay y bisexuales de 18-45 anos
- Region primaria: Chile (Santiago)
- Regiones secundarias: Espana, Brasil, Mexico, Argentina
- Usuarios que buscan: chat casual, conexiones, citas, amistad, encuentros
- Perfil tecnologico: Movil primero (80%+ del trafico esperado)

---

## 2. STACK TECNOLOGICO Y ARQUITECTURA

### 2.1 Tecnologias

| Capa | Tecnologia | Version | Proposito |
|------|-----------|---------|-----------|
| Frontend | React | 18.2.0 | UI Library |
| Build | Vite | 4.4.5 | Bundler + Dev Server |
| Estilos | Tailwind CSS | 3.3.3 | Utility-first CSS |
| Componentes UI | Radix UI | Ultima | Componentes accesibles |
| Animaciones | Framer Motion | 10.16.4 | Animaciones fluidas |
| Routing | React Router | 6.16.0 | Navegacion SPA |
| Backend | Firebase | 12.4.0 | Auth + Firestore + Storage |
| IA | Google Gemini | 0.24.1 | Bots conversacionales (desactivado) |
| IA | OpenAI | 6.15.0 | Bots conversacionales (desactivado) |
| Analytics | Google Analytics 4 | - | Seguimiento de usuarios |
| Deploy | Vercel + Firebase Hosting | - | CDN + Hosting |
| PWA | Service Worker | - | App instalable |

### 2.2 Arquitectura de la Aplicacion

```
CLIENTE (React SPA)
├── AuthProvider (Context API) ──→ Firebase Auth
├── ThemeProvider (Context API) ──→ Dark/Light mode
├── Router (React Router v6)
│   ├── Landing Pages (SEO) ──→ Auto-redirect a chat
│   ├── Chat Principal ──→ Firestore real-time
│   ├── Opin Feed ──→ Firestore queries
│   ├── Baul ──→ Firestore queries + Storage
│   ├── Admin Panel ──→ Firestore admin ops
│   └── Profile/Premium ──→ Firestore user docs
│
BACKEND (Firebase)
├── Authentication ──→ Email/Password + Anonymous
├── Firestore ──→ Base de datos documental en tiempo real
│   ├── users/{userId}
│   ├── rooms/{roomId}/messages/{msgId}
│   ├── private_chats/{chatId}/messages/{msgId}
│   ├── opin_posts/{postId}
│   ├── opin_comments/{commentId}
│   ├── tarjetas/{userId} (Baul)
│   ├── matches/{matchId}
│   ├── roomPresence/{roomId}/users/{userId}
│   ├── moderation_alerts/{alertId}
│   ├── tickets/{ticketId}
│   └── reports/{reportId}
├── Cloud Storage ──→ Fotos de perfil (via Cloudinary)
└── Cloud Functions ──→ (planificadas, minimas actualmente)
```

### 2.3 Gestion de Estado

- **Estado global:** React Context API (AuthContext, ThemeContext)
- **Estado local:** useState/useReducer en componentes
- **Estado persistente:** localStorage para identidad de invitado, preferencias, borradores
- **Estado en tiempo real:** Firebase onSnapshot listeners para mensajes y presencia
- **NO se usa:** Redux, Zustand, MobX (decision de simplicidad)

### 2.4 Optimizaciones de Rendimiento Implementadas

1. **Code Splitting:** Todas las paginas excepto 3 criticas son lazy-loaded con React.lazy()
2. **Chunks manuales:** React, Firebase, UI, Animaciones en bundles separados
3. **Minificacion Terser:** Compresion avanzada con passes=2
4. **Eliminacion de console.log** en produccion
5. **Compresion de imagenes** client-side (320x320, 128x128, 800x800)
6. **UI optimista** para login de invitados (<500ms hasta ver el chat)
7. **Sin persistencia offline de Firestore** (causaba problemas de sincronizacion)

---

## 3. SISTEMA DE USUARIOS Y AUTENTICACION

### 3.1 Tipos de Usuario

La aplicacion soporta **tres niveles de usuario** con capacidades progresivas:

#### Nivel 1: Invitado (Guest)
```
Como entra: Click en "Entrar como invitado" → Escribe nickname → En el chat en <3 segundos
Identidad: UUID local (persistente en localStorage) + Firebase Anonymous Auth
Puede:
  ✅ Ver y enviar mensajes en Chat Principal (sala publica)
  ✅ Ver publicaciones en Opin (todas)
  ✅ Ver primeros 3 comentarios de Opin
  ✅ Ver tarjetas en Baul (modo lectura)
  ✅ Navegar todas las landing pages
No puede:
  ❌ Chat privado / DMs
  ❌ Publicar en Opin
  ❌ Comentar en Opin
  ❌ Dar like/reaccionar en Opin
  ❌ Interactuar en Baul (like, mensaje, match)
  ❌ Acceso a salas bloqueadas (mas-30, santiago, gaming)
  ❌ Acceso al lobby/home
  ❌ Editar perfil
Restricciones de mensajes:
  - Filtro estricto anti-spam
  - Sin links externos permitidos
  - Sin numeros de telefono
```

#### Nivel 2: Usuario Registrado
```
Como entra: Registro con email/password + verificacion edad (18+)
Identidad: Firebase Auth UID + Perfil en Firestore
Puede todo lo del invitado MAS:
  ✅ Chat privado con otros usuarios registrados
  ✅ Publicar notas en Opin (1 activa, cada 2h)
  ✅ Comentar y reaccionar en Opin
  ✅ Interactuar en Baul (like, mensaje, match)
  ✅ Editar su tarjeta de Baul
  ✅ Acceso al lobby/home
  ✅ Acceso a salas desbloqueadas
  ✅ Favoritos y lista de matches
  ✅ Personalizar perfil (avatar, bio)
  ✅ Sistema de tickets de soporte
```

#### Nivel 3: Usuario Premium (Planificado)
```
Todo lo del registrado MAS:
  ✅ Envio de imagenes en chat
  ✅ Mensajes de voz
  ✅ Perfil destacado en Baul
  ✅ Salas premium exclusivas
  ✅ Sin publicidad
  ✅ Badge premium visible
Estado: Infraestructura implementada, funciones bloqueadas con "Coming Soon"
```

#### Nivel Especial: Admin/Superadmin
```
Superadmin: Email hardcodeado (caribenosvenezolanos@gmail.com)
Admin: Campo role='admin' en documento de usuario
Puede:
  ✅ Panel de administracion completo
  ✅ Moderacion de mensajes y usuarios
  ✅ Gestion de posts estables en Opin
  ✅ Respuestas editoriales en Opin
  ✅ Sistema de sanciones (ban temporal/permanente)
  ✅ Cambio de identidad (para moderar de incognito)
  ✅ Analytics y metricas
  ✅ Gestion de tickets
```

### 3.2 Flujo de Autenticacion Tecnico

**Archivo principal:** `src/contexts/AuthContext.jsx` (1,038 lineas)

#### Flujo Invitado (Optimizado <500ms):
```
1. Usuario hace click "Entrar como invitado"
2. GuestUsernameModal se abre → usuario escribe nickname
3. createGuestIdentity() genera UUID localmente (instantaneo)
4. setUser() se ejecuta INMEDIATAMENTE (UI optimista)
5. Usuario ve el chat ANTES de que Firebase responda
6. En background: signInAnonymously() crea sesion Firebase
7. onAuthStateChanged actualiza el UID real
8. Identidad guardada en localStorage (persistente entre sesiones)
9. Proxima visita: auto-restauracion sin modal
```

#### Flujo Registro:
```
1. Usuario navega a /auth
2. AuthModal muestra pestanas login/registro
3. Registro: email + password + edad (minimo 18)
4. createUserWithEmailAndPassword() en Firebase
5. Crea perfil en Firestore: users/{uid}
6. Verifica si tiene sanciones activas
7. Auto-crea tarjeta en Baul (crearTarjetaAutomatica)
8. Muestra tour de bienvenida
9. Redirige a /home (lobby)
```

### 3.3 Estructura de Datos del Usuario

```javascript
// Firestore: users/{userId}
{
  uid: "firebase_uid",
  email: "user@example.com",
  username: "Carlos28",
  displayName: "Carlos",
  avatar: "https://...",
  bio: "Hola, buscando amigos",
  age: 28,
  role: "user" | "admin" | "support",
  isPremium: false,
  isVerified: false,
  isBanned: false,
  createdAt: Timestamp,
  lastSeen: Timestamp,
  theme: "dark" | "light",
  quickPhrases: ["Hola!", "¿De donde eres?"],
  // ... campos adicionales
}
```

---

## 4. FUNCIONALIDAD 1: CHAT PRINCIPAL

### 4.1 Que es y Para Que Existe

El **Chat Principal** es el corazon de Chactivo. Es una sala de chat grupal en tiempo real donde multiples usuarios conversan simultaneamente. Es el equivalente a un "lobby publico" de un IRC moderno o el chat general de Discord, pero diseñado especificamente para hombres gay.

**Intencion estrategica:** Ser la puerta de entrada de menor friccion posible. Un usuario debe poder estar conversando con personas reales en menos de 5 segundos desde que llega a la web.

**Por que existe:** Las apps de citas gay (Grindr, Scruff) son 1-a-1 y requieren perfil. Los foros son lentos. Chactivo llena el hueco de "quiero hablar con gente gay AHORA MISMO, sin barreras."

### 4.2 Sistema de Salas

**Archivo de configuracion:** `src/config/rooms.js`

```
SALAS DISPONIBLES:
┌─────────────────────┬──────────────┬────────────────────────────────┐
│ Sala                │ ID           │ Acceso                         │
├─────────────────────┼──────────────┼────────────────────────────────┤
│ Chat Principal      │ principal    │ Todos (invitados + registrados)│
│ Chat Gaming         │ gaming       │ Solo registrados (100+ users)  │
│ Chat +30            │ mas-30       │ Solo registrados (100+ users)  │
│ Chat Amistad        │ amistad      │ Registrados                    │
│ Osos & Activos      │ osos-activos │ Registrados                    │
│ Pasivos Buscando    │ pasivos      │ Registrados                    │
│ Versatiles          │ versatiles   │ Registrados                    │
│ Quedar Ya           │ quedar-ya    │ Registrados                    │
│ Hablar Primero      │ hablar       │ Registrados                    │
│ Morbosear           │ morbosear    │ Registrados                    │
│ Santiago             │ santiago     │ Solo registrados (100+ users)  │
│ Espana (es-main)    │ es-main      │ Desde landing /españa          │
│ Brasil (br-main)    │ br-main      │ Desde landing /brasil          │
│ Mexico (mx-main)    │ mx-main      │ Desde landing /mexico          │
│ Argentina (ar-main) │ ar-main      │ Desde landing /argentina       │
└─────────────────────┴──────────────┴────────────────────────────────┘
```

**Logica de desbloqueo:** Las salas "bloqueadas" (gaming, mas-30, santiago) requieren que haya 100+ usuarios activos en la plataforma para activarse. Esto evita salas vacias que desmotivan.

### 4.3 Arquitectura Tecnica del Chat

#### Componentes Principales:
```
ChatPage.jsx (contenedor principal, ~32,000 lineas de codigo generado)
├── ChatHeader.jsx ──→ Info de sala, usuarios activos, ultimo mensaje
├── ChatSidebar.jsx ──→ Lista de usuarios en la sala, estado online
├── ChatMessages.jsx ──→ Renderizado de mensajes con agrupacion
│   ├── Agrupacion por usuario (2 min ventana)
│   ├── Avatar solo en primer mensaje del grupo
│   ├── Timestamp en ultimo mensaje del grupo
│   ├── Mensajes del sistema centrados como banners
│   ├── Indicador "mensajes nuevos" al scrollear arriba
│   └── Reacciones (thumbs up/down) en hover
├── ChatInput.jsx ──→ Campo de texto, emoji picker, envio
│   ├── Enter para enviar (movil: sin Shift+Enter)
│   ├── Borrador guardado en localStorage
│   ├── Selector de emojis (lazy loaded)
│   ├── Cita/Respuesta a mensajes
│   └── Validacion anti-spam antes de enviar
├── ChatBottomNav.jsx ──→ Navegacion movil (Home, Chat, Perfil)
├── PrivateChatWindow.jsx ──→ Ventana de chat privado (DMs)
├── CompanionWidget.jsx ──→ Widget de IA companera
└── [20+ componentes auxiliares: modales, banners, indicadores...]
```

#### Flujo de un Mensaje (de escritura a pantalla):

```
PASO 1: Usuario escribe en ChatInput
   ↓
PASO 2: validateMessage() en antiSpamService.js
   - Detecta numeros de telefono → reemplaza con "📱••••••••"
   - Detecta emails → reemplaza con "[email oculto]"
   - Detecta links de WhatsApp/Telegram/Instagram → bloquea
   - Detecta palabras prohibidas → filtra
   - Mensajes cortos de saludo ("hola", "jaja") → pasan sin filtro
   ↓
PASO 3: sendMessage() en chatService.js
   - Genera clientId unico (para renderizado optimista)
   - Estructura del mensaje:
     {
       userId: "uid",
       username: "Carlos",
       avatar: "url",
       content: "texto sanitizado",
       type: "text" | "gif" | "image" | "voice" | "system",
       timestamp: serverTimestamp(),
       clientId: "uuid",
       replyTo: { messageId, username, content } (opcional)
     }
   - Escribe en Firestore: rooms/{roomId}/messages/{auto-id}
   ↓
PASO 4: Firestore Security Rules validan:
   - userId == request.auth.uid (anti-suplantacion)
   - content es string de 1-1000 caracteres
   - hasNoProhibitedWordsPublic() (filtro de palabras)
   - timestamp presente
   ↓
PASO 5: onSnapshot listener en TODOS los clientes conectados
   - Firestore dispara evento en tiempo real
   - ChatMessages.jsx recibe nuevo mensaje
   - Si usuario esta al final del scroll → auto-scroll suave
   - Si usuario esta leyendo historial → indicador "Nuevos mensajes ↓"
   - Sonido de notificacion (si no esta en silencio)
   ↓
PASO 6: Mensaje renderizado en pantalla
   - Se agrupa con mensajes previos del mismo usuario (ventana 2 min)
   - Se muestra con estado de entrega (✓ enviado, ✓✓ entregado)
   - Otros usuarios pueden reaccionar o responder
```

### 4.4 Sistema de Presencia (Quien esta online)

**Archivo:** `src/services/presenceService.js`

```
Firestore: roomPresence/{roomId}/users/{userId}
{
  userId: "uid",
  username: "Carlos",
  avatar: "url",
  isPremium: false,
  isAnonymous: true/false,
  isGuest: true/false,
  joinedAt: Timestamp,
  lastSeen: Timestamp
}
```

**Cuando se actualiza:**
- `joinRoom()` → Al entrar a una sala (crea documento)
- `leaveRoom()` → Al salir (elimina documento)
- `beforeunload` event → Al cerrar pestaña (cleanup)

**Indicadores visuales en ChatSidebar:**
- 0 usuarios → Sin indicador
- 1-5 usuarios → "ACTIVA" (punto verde)
- 6-15 usuarios → "MUY ACTIVA" (punto naranja, pulso suave)
- 16+ usuarios → "MUY ACTIVA" (punto naranja, pulso intenso)

**Optimizacion importante:** El typing indicator esta DESACTIVADO para evitar escrituras excesivas a Firestore.

### 4.5 Chat Privado (DMs)

**Archivo:** `src/services/socialService.js`

**Flujo completo:**
```
1. Usuario A ve perfil de Usuario B en el chat
2. Click en "Enviar solicitud de chat privado"
3. Se crea notificacion en users/{B}/notifications
4. Usuario B ve PrivateChatRequestModal con opciones:
   - Aceptar → Crea private_chats/{chatId} con ambos como participants
   - Rechazar → Notifica a A
   - Ver perfil → Abre perfil de A
5. Si acepta: Se abre PrivateChatWindow
6. Mensajes en private_chats/{chatId}/messages/
7. Filtro de contenido RELAJADO (permite contacto, bloquea insultos)
```

**Restriccion critica:** Solo usuarios REGISTRADOS pueden usar chat privado. Los invitados ven un prompt para registrarse. Esta es una de las principales palancas de conversion invitado→registrado.

### 4.6 Sistema Anti-Spam y Filtrado de Contenido

**Archivo:** `src/services/antiSpamService.js`

#### Filtro ESTRICTO (salas publicas):
```
BLOQUEA:
- Numeros de telefono: +56 9 XXXX, 9XXXXXXXX, variaciones con puntos/espacios
- Emails: user@domain.com, variaciones con espacios
- Links externos: wa.me, whatsapp.com, t.me, telegram, instagram, tiktok,
  snapchat, discord, signal, onlyfans
- Palabras clave: "mi numero es", "agregame al", "mi insta", "vendo pack"

ACCION: No bloquea el mensaje, sino que REEMPLAZA la informacion sensible:
- Telefono → "📱••••••••"
- Contacto → "📱 [numero oculto - usa el chat privado]"
- Muestra warning al usuario: "Usa OPIN o Baul para compartir contacto"
```

#### Filtro PERMISIVO (chat privado):
```
SOLO BLOQUEA:
- Insultos: "puto", "maricon", "sidoso", "enfermo", "degenerado"
- Spam: "spam", "phishing", "scam", "hack", "viagra"
- TODO lo demas PERMITIDO (incluido contacto personal)
```

#### Excepciones (pasan siempre):
```
Saludos: "hola", "alo", "buenas", "wena"
Risas: "jaja", "jsjs", "jeje", "lol", "xd"
Respuestas cortas: "si", "no", "ok", "ya", "bueno", "gracias"
```

### 4.7 Sistema de Bots/IA (ACTUALMENTE DESACTIVADO)

**Estado actual:** Completamente desactivado desde 06/01/2026

**Que era:** Un sistema sofisticado de bots que simulaban ser usuarios reales:
- 10+ perfiles de bot con personalidades unicas (Carlos 28M activo, Mateo 25M pasivo, etc.)
- Respuestas generadas por Gemini/OpenAI con instruccion explicita de "JAMAS MENCIONAR SER IA"
- Sistema de coordinacion: mas bots cuando habia pocos usuarios reales
- Conversaciones grupales entre bots para simular actividad
- Mensajes estaticos pre-escritos como fallback

**Por que se desactivo:** Problemas de spam, falsos conteos de usuarios, solicitud del propietario

**Infraestructura:** Completamente implementada pero con `getBotConfigDynamic()` retornando 0 bots para cualquier cantidad de usuarios reales.

### 4.8 Tipos de Mensaje Soportados

| Tipo | Estado | Descripcion |
|------|--------|-------------|
| `text` | ✅ Activo | Mensaje de texto plano (1-1000 chars) |
| `gif` | ✅ Activo | GIF animado (renderizado como imagen) |
| `image` | ⏳ Premium | Envio de imagenes (bloqueado con "Coming Soon") |
| `voice` | ⏳ Premium | Mensajes de voz (bloqueado con "Coming Soon") |
| `system` | ✅ Activo | Notificaciones del sistema (centradas, sin avatar) |

### 4.9 Scroll y Carga de Mensajes

**Archivo:** `src/hooks/useChatScrollManager.js`

**Comportamiento tipo Discord/Slack:**
1. **Carga inicial:** Primeros 50 mensajes
2. **Scroll arriba:** Carga 50 mas (paginacion infinita)
3. **Usuario al final:** Auto-scroll suave con cada mensaje nuevo
4. **Usuario leyendo historial:** Scroll congelado + indicador "Nuevos mensajes ↓"
5. **Click en indicador:** Salta al ultimo mensaje

### 4.10 SEO del Chat

**Meta tags dinamicos por sala:**
```
/chat/principal → "Chat Principal - Chat Gay Chile"
/chat/gaming    → "Chat Gay Gamers Chile"
/chat/mas-30    → "Chat Gay +30 Anos Chile"
```

---

## 5. FUNCIONALIDAD 2: OPIN (TABLON DE DESCUBRIMIENTO)

### 5.1 Que es y Para Que Existe

**Opin** es un **tablon social de notas efimeras** donde los usuarios publican textos cortos sobre lo que buscan, piensan o quieren compartir. Es como un muro de "historias" de Instagram pero en formato texto, con duracion de 24 horas.

**Intencion estrategica:** Resolver el problema de "no se que buscan los demas sin preguntar directamente". En apps como Grindr, tienes que abrir perfiles uno a uno. En Opin, ves de un vistazo que busca la comunidad AHORA.

**Por que existe:**
1. **Descubrimiento:** Los usuarios descubren que buscan otros sin contacto directo
2. **Conversion:** Los invitados ven el contenido pero necesitan registrarse para interactuar
3. **Retencion:** Los usuarios publican y vuelven a ver si alguien respondio
4. **Red social ligera:** Crea la sensacion de "comunidad activa" mas alla del chat

### 5.2 Reglas Fundamentales de Opin

| Regla | Valor | Razon |
|-------|-------|-------|
| Duracion de un post | 24 horas | Contenido fresco, urgencia de interaccion |
| Posts activos por usuario | 1 maximo | Diversidad en el feed, sin monopolizacion |
| Cooldown entre posts | 2 horas | Anti-spam, calidad sobre cantidad |
| Longitud del texto | 10-280 chars (UI) / 10-500 (DB) | Mensajes concisos y legibles |
| Comentarios por post | 100 maximo | Evitar hilos infinitos |
| Longitud de comentario | 1-150 chars | Respuestas breves |
| Ediciones/eliminaciones | 4 por 24h | Prevenir abuso de edicion |
| Posts estables (admin) | Minimo 20 siempre visibles | Feed nunca vacio |

### 5.3 Arquitectura Tecnica de Opin

#### Modelo de Datos Firestore:

```javascript
// Coleccion: opin_posts/{postId}
{
  userId: "uid",               // Autor
  username: "Carlos28",        // Nombre visible
  avatar: "url",               // Avatar del autor
  title: "Opcional",           // Titulo (max 50 chars, opcional)
  text: "Buscando alguien para tomar algo hoy en Santiago centro",
  color: "purple",             // 1 de 6 colores (asignado aleatoriamente)
  createdAt: Timestamp,        // Momento de creacion
  expiresAt: Timestamp,        // createdAt + 24 horas
  isActive: true,              // false = eliminado (soft delete)
  isStable: false,             // true = admin, no expira nunca
  isSeeded: false,             // true = creado con username personalizado
  viewCount: 0,                // Veces visto
  profileClickCount: 0,        // Veces que clickearon el perfil desde este post
  likeCount: 0,                // Total likes
  likedBy: [],                 // Array de userIds que dieron like
  commentCount: 0,             // Total comentarios
  reactions: {                 // Emoji → array de userIds
    "🔥": ["uid1", "uid2"],
    "🍑": ["uid3"]
  },
  reactionCounts: {            // Emoji → conteo
    "🔥": 2,
    "🍑": 1
  }
}

// Coleccion: opin_comments/{commentId}
{
  postId: "ref_post_id",       // Foreign key al post
  userId: "uid",               // Autor del comentario
  username: "Pedro",
  avatar: "url",
  comment: "Me interesa, escríbeme",
  createdAt: Timestamp,
  isAdminReply: false          // true si es respuesta editorial del admin
}

// Coleccion: opin_actions/{actionId} (audit trail)
{
  userId: "uid",
  actionType: "edit" | "delete",
  postId: "ref_post_id",
  timestamp: Timestamp
}
```

#### Componentes:
```
OpinFeedPage.jsx ──→ Feed principal con scroll infinito
├── OpinCard.jsx ──→ Tarjeta individual de post
│   ├── Punto de color a la izquierda
│   ├── Texto truncado a 120 chars con "Ver mas"
│   ├── Nombre del autor (clickeable → abre Baul)
│   ├── Tiempo relativo ("hace 5m", "hace 2h")
│   ├── Boton de like con contador
│   ├── Boton "Responder" con contador de comentarios
│   ├── 6 emojis de reaccion: 🔥 🍑 🍆 😈 💦 👅
│   ├── Preview de primeros 3 comentarios
│   └── Menu (⋯) para eliminar (solo autor)
├── OpinCommentsModal.jsx ──→ Modal de comentarios completo
│   ├── Lista completa de comentarios (registrados)
│   ├── Solo primeros 3 para invitados + CTA "Crear cuenta"
│   ├── Chips de respuesta rapida: "Me interesa", "Yo tambien busco", etc.
│   └── Campo de texto para comentario personalizado
└── OpinDiscoveryBanner.jsx ──→ Banner en chat para invitados
    └── "OPIN: Mira lo que otros buscan" → auto-dismiss 7s

OpinComposerPage.jsx ──→ Crear nuevo post (/opin/new)
├── Textarea con contador de caracteres
├── Color aleatorio auto-asignado
├── Preview en tiempo real
└── Validacion de cooldown (2h entre posts)
```

### 5.4 Algoritmo de Ordenamiento del Feed (Shuffle Ponderado)

El feed NO es cronologico puro. Usa un **algoritmo de shuffle ponderado** para garantizar visibilidad justa:

```
Para cada post, calcular peso base:

POSTS REALES (de usuarios, expiran en 24h):
  - < 3 horas de antiguedad: peso = 60
  - < 8 horas: peso = 50
  - < 16 horas: peso = 40
  - > 16 horas: peso = 30

POSTS ESTABLES (del admin, no expiran):
  - > 10 likes/reacciones: peso = 45
  - > 5 likes/reacciones: peso = 35
  - >= 1 like/reaccion: peso = 25
  - 0 likes/reacciones: peso = 15

LUEGO:
  1. Sumar factor aleatorio (0-50) al peso
  2. Ordenar por peso total (descendente)
  3. Garantizar: al menos 3 posts reales en top 10
  4. Retornar top N posts

EFECTO: Los posts no se quedan atrapados arriba/abajo.
Cada refresh muestra orden diferente = descubrimiento constante.
```

### 5.5 Sistema de Colores

6 colores disponibles (asignados aleatoriamente al crear):
- **Purple** (morado)
- **Pink** (rosa)
- **Cyan** (cian)
- **Orange** (naranja)
- **Green** (verde)
- **Blue** (azul)

Cada color tiene gradiente, fondo y borde configurado. Son puramente esteticos (no representan categorias).

### 5.6 Sistema de Reacciones

6 emojis con tematica sugestiva para la comunidad:
- 🔥 Fuego
- 🍑 Durazno
- 🍆 Berenjena
- 😈 Diablito
- 💦 Gotas
- 👅 Lengua

Cada emoji funciona como toggle: click para agregar, click de nuevo para quitar.
Un usuario puede usar multiples emojis diferentes en el mismo post.

### 5.7 Posts Estables (Contenido Semilla)

Para evitar un feed vacio, el admin puede crear "posts estables" que:
- **Nunca expiran** (no tienen las 24h de limite)
- Se mezclan con posts reales en el feed
- Tienen un label "Fijado" en lugar de tiempo restante
- Minimo 20 siempre presentes en el feed

**Sistema de seeding automatico:** 20 templates pre-escritos con usernames genericos:
- Carlos_28, JuanMadrid, Alex_BCN, DavidGym, etc.
- Temas variados: amistad, citas, gaming, deportes, etc.

### 5.8 Experiencia Invitado vs Registrado en Opin

| Accion | Invitado | Registrado |
|--------|----------|-----------|
| Ver posts | ✅ Todos | ✅ Todos |
| Ver comentarios | ❌ Solo primeros 3 | ✅ Todos |
| Dar like | ❌ Toast: "Registrate" | ✅ Si |
| Reaccionar (emoji) | ❌ Botones desactivados | ✅ Si |
| Comentar | ❌ Bloqueado + CTA registro | ✅ Si |
| Crear post | ❌ Bloqueado + CTA registro | ✅ Si (cooldown 2h) |
| Ver perfil del autor | ❌ Toast: "Crea tu cuenta" | ✅ Si (abre Baul) |
| Ver stats propios | N/A | ✅ Views + clicks |

### 5.9 Funnel de Conversion Invitado → Registrado via Opin

```
1. Invitado entra al chat
2. Ve OpinDiscoveryBanner: "OPIN: Mira lo que otros buscan"
3. Click → navega a /opin
4. Ve posts con engagement (likes, comentarios)
5. Intenta interactuar → bloqueado con toast
6. CTA: "Crear cuenta gratis" → /auth
7. Se registra
8. Vuelve a /opin con acceso completo
9. Crea primer post
10. Recibe engagement → mayor retencion
```

---

## 6. FUNCIONALIDAD 3: BAUL (SISTEMA DE TARJETAS Y MATCHING)

### 6.1 Que es y Para Que Existe

**Baul** (baul = cofre/tesoro) es un **sistema de perfiles persistentes con mecanica de matching** similar a Tinder pero integrado dentro de la plataforma de chat. Cada usuario tiene una "tarjeta" que funciona como su identidad social permanente.

**Intencion estrategica:** Transformar el chat efimero en una plataforma con identidad persistente. Mientras el chat fluye y se pierde, la tarjeta de Baul permanece. Esto crea razones para volver: "alguien me dio like", "tengo un match nuevo", "vieron mi perfil".

**Por que existe:**
1. **Retencion:** La tarjeta acumula metricas (likes, visitas) = razon para volver
2. **Descubrimiento:** Grid de perfiles para encontrar gente compatible
3. **Matching:** Like mutuo crea "match" = conexion significativa
4. **Conversion:** Invitados ven tarjetas pero no pueden interactuar → registrarse
5. **Identidad:** Crea sentido de pertenencia y permanencia en la comunidad

### 6.2 Que es una Tarjeta

Una tarjeta es el perfil persistente de un usuario dentro de Baul. Contiene:

```javascript
// Firestore: tarjetas/{userId}
{
  // IDENTIFICACION
  odIdUsuari: "uid",            // Firebase UID (clave primaria)
  nombre: "Carlos",             // Nombre visible
  esInvitado: false,            // Flag de invitado

  // INFO BASICA (editable)
  edad: 28,
  sexo: "Hombre",               // Hombre | Mujer | Trans | No binario | etc
  rol: "Activo",                // Activo | Pasivo | Versatil | V.Activo | V.Pasivo

  // INFO FISICA (opcional)
  alturaCm: 175,                // Altura en cm (120-230)
  pesaje: 17,                   // Medida en cm (5-40, opcional)
  etnia: "Latino",

  // UBICACION
  ubicacionTexto: "Santiago Centro",
  ubicacion: { latitude, longitude },  // Para queries de proximidad
  ubicacionActiva: true,

  // NARRATIVA
  bio: "Buscando pasivos discretos...", // Max 200 chars
  buscando: "Encuentros casuales",       // Max 100 chars

  // HORARIOS DE CONEXION
  horariosConexion: {
    manana: false,   // 6-12
    tarde: false,    // 12-18
    noche: true,     // 18-00
    madrugada: false // 00-6
  },

  // FOTOS (3 resoluciones optimizadas)
  fotoUrl: "url",         // 320x320 para grid de tarjetas
  fotoUrlThumb: "url",    // 128x128 para avatares en chat
  fotoUrlFull: "url",     // 800x800 para modal de perfil
  fotoSensible: false,    // Si true → blur hasta que se toque

  // ESTADO
  estaOnline: true,
  ultimaConexion: Timestamp,

  // METRICAS DE ENGAGEMENT
  likesRecibidos: 12,
  visitasRecibidas: 45,
  mensajesRecibidos: 3,
  actividadNoLeida: 5,    // Badge de notificaciones

  // ARRAYS DE INTERACCION (con tope)
  likesDe: ["uid1", "uid2"],    // Max 100 entries
  visitasDe: ["uid3", "uid4"],  // Max 50 entries

  // TIMESTAMPS
  creadaEn: Timestamp,
  actualizadaEn: Timestamp
}
```

### 6.3 Creacion Automatica de Tarjeta

Cuando un usuario se registra o inicia sesion, se ejecuta `crearTarjetaAutomatica()`:
- Se llama desde el flujo de auth (AuthContext)
- Crea tarjeta con datos basicos del perfil
- Valores por defecto: `noche: true`, sin foto, sin bio, metricas en 0
- Para invitados: `esInvitado: true` (vista limitada)

### 6.4 Grid de Tarjetas y Ordenamiento

#### Pantalla de Baul (BaulSection):
```
Layout responsivo:
- Movil: 2 columnas
- Tablet: 3 columnas
- Desktop: 4 columnas
- Pantalla grande: 5 columnas
```

#### Algoritmo de Ordenamiento por Completitud:

```
1. MI TARJETA siempre primero (arriba)

2. Para el resto, calcular SCORE de completitud:
   - Foto real (no avatar generico): +1000 puntos (maxima prioridad)
   - Rol definido: +50
   - Bio escrita: +40
   - Edad definida: +30
   - "Buscando" escrito: +25
   - Ubicacion: +20
   - Etnia: +15
   - Altura: +10
   - Medida: +10
   - Bonus engagement: +5 si likes > 5 o visitas > 10

3. Desempate: Por ultima conexion (mas reciente primero)

EFECTO: Perfiles completos con foto aparecen arriba.
Incentiva a los usuarios a completar su perfil.
```

#### Engagement Boost Visual (SOLO en memoria, NO en Firestore):

Para evitar que usuarios nuevos vean "0 likes" desmotivante:
- Minimo 10 usuarios mostrados como "online" (si hay menos, se agregan estados falsos)
- Se calcula engagement esperado segun antiguedad de la tarjeta
- Se muestra `max(real, esperado)` → nunca se oculta engagement real
- Indicadores: Verde = online, Naranja = reciente (<2h), Gris = offline (mostrado como "Reciente")

### 6.5 Sistema de Likes y Matches

#### Dar Like:

```
1. Usuario A da like a tarjeta de Usuario B
2. darLike(tarjetaB, miUserId, miUsername, miAvatar)
3. Verificar que no es like a si mismo
4. DETECCION DE MATCH: ¿B ya le dio like a A?
   - Revisar: B.likesDe.includes(A) ?

   SI → MATCH:
     - crearMatch() → matches/{A_B} (IDs ordenados alfabeticamente)
     - Documento de match:
       {
         id: "uid1_uid2",
         users: ["uid1", "uid2"],
         userA: { info de quien dio like primero },
         userB: { info de quien dio like despues },
         createdAt: Timestamp,
         status: "active",
         chatStarted: false
       }
     - Modal de celebracion (MatchModal, 10s auto-close)
     - Actividad registrada en ambos feeds
     - Chat privado disponible entre ambos

   NO → LIKE SIMPLE:
     - Incrementar likesRecibidos en tarjeta B
     - Agregar A a likesDe[] de B
     - Crear entrada en actividad de B
     - Incrementar actividadNoLeida de B

5. B ve en su feed de actividad: "Carlos te dio like"
   - Puede devolver like → match
   - O ignorar
```

#### Match ID siempre consistente:
```javascript
const matchId = [userId1, userId2].sort().join('_');
// Ejemplo: "abc123_xyz789" (siempre igual sin importar quien da like primero)
```

### 6.6 Feed de Actividad (ActividadFeed)

Centro de notificaciones personalizado donde el usuario ve todas las interacciones con su tarjeta:

**Tipos de actividad (por prioridad):**
1. **Mensaje** → Alguien dejo un mensaje en tu tarjeta
2. **Match** → Like mutuo detectado
3. **Like** → Alguien le gusto tu tarjeta
4. **Visita** → Alguien vio tu perfil

**Interacciones desde el feed:**
- Mensaje: Boton "Responder" → abre perfil del remitente
- Like: Boton "Devolver" → like instantaneo con deteccion de match
- Match: "Ver match" → abre perfil
- Visita: "Ver perfil" → abre tarjeta del visitante

**Badge:** Numero rojo con `actividadNoLeida` que se resetea al abrir el feed.

### 6.7 Modal de Perfil (MensajeTarjetaModal)

Al hacer click en cualquier tarjeta se abre un modal con:
- Foto grande (fotoUrlFull preferida)
- Nombre, edad, badge de rol
- Stats: likes recibidos, visitas (distancia si ≤5km)
- Grid de detalles: ubicacion, etnia, medidas, horario
- Bio (italica, estilo cita)
- "Buscando" (que busca el usuario)
- Foto sensible: blur con boton "Tocar para ver"

**Acciones disponibles:**
- Dar like ❤️
- Enviar mensaje (texto, max 200 chars, guardado en actividad)
- "Abrir chat privado" (solo si hay match/interes mutuo)

**Invitados:** Banner amarillo "Vista previa - Crea cuenta para interactuar"

### 6.8 Fotos y Privacidad

**Subida de fotos:**
1. Usuario selecciona imagen
2. Compresion client-side en 3 resoluciones:
   - 320x320 (~25KB) para grid
   - 128x128 (~8KB) para avatares en chat
   - 800x800 (~80KB) para modal de perfil
3. Upload a Cloudinary (servicio gratuito)
4. 3 URLs guardadas en Firestore

**Foto sensible:**
- Usuario marca `fotoSensible: true`
- Se muestra con CSS `blur-[10px]`
- Boton "Tocar para ver" sobre la foto
- El reveal se guarda en `sessionStorage` (expira al cerrar pestaña)

**Deteccion foto real vs avatar:**
- Analiza URL: cloudinary, firebasestorage, imgbb → foto real
- dicebear, ui-avatars, robohash, gravatar → avatar generico
- Fotos reales reciben +1000 puntos en el algoritmo de ordenamiento

### 6.9 Seguridad de Firestore para Baul

```javascript
// tarjetas/{userId}
allow read: if true;  // Cualquiera puede ver tarjetas (discovery publico)
allow write: if request.auth != null && request.auth.uid == userId;  // Solo el dueno

// tarjetas/{userId}/actividad/{actividadId}
allow read: if request.auth != null && request.auth.uid == userId;  // Solo dueno ve su actividad
allow create: if request.auth != null;  // Cualquier autenticado puede crear actividad (dejar like/mensaje)

// matches/{matchId}
allow read: if request.auth != null && request.auth.uid in resource.data.users;
allow create: if request.auth != null;
```

### 6.10 Experiencia Invitado vs Registrado en Baul

| Accion | Invitado | Registrado |
|--------|----------|-----------|
| Ver grid de tarjetas | ✅ Limitado | ✅ Completo |
| Ver perfil detallado | ✅ Vista previa | ✅ Completo |
| Dar like | ❌ CTA registro | ✅ Si |
| Enviar mensaje | ❌ CTA registro | ✅ Si |
| Match | ❌ Imposible | ✅ Si |
| Chat privado | ❌ Imposible | ✅ Si (tras match) |
| Editar tarjeta | ❌ Imposible | ✅ Si |
| Ver actividad | ❌ N/A | ✅ Si |
| Subir foto | ❌ Imposible | ✅ Si |

---

## 7. COMO SE CONECTAN LAS 3 FUNCIONALIDADES

### 7.1 Ecosistema Integrado

Las tres funcionalidades no son independientes. Forman un **ciclo de engagement** interconectado:

```
                    ┌─────────────────┐
                    │  CHAT PRINCIPAL  │
                    │  (Puerta de     │
                    │   entrada)       │
                    └───────┬─────────┘
                            │
                   Usuario llega, chatea
                            │
              ┌─────────────┼─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │      OPIN       │         │      BAUL       │
    │  (Descubrimiento│         │  (Conexion      │
    │   pasivo)       │◄───────►│   activa)       │
    └─────────────────┘         └─────────────────┘
              │                           │
              │   Click en autor de Opin  │
              │   → abre tarjeta en Baul  │
              │                           │
              └─────────────┬─────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │  CHAT PRIVADO   │
                    │  (Conexion 1:1) │
                    └─────────────────┘
```

### 7.2 Puntos de Conexion Especificos

| Desde | Hacia | Accion |
|-------|-------|--------|
| Chat Principal | Opin | OpinDiscoveryBanner para invitados ("Mira lo que buscan") |
| Chat Principal | Baul | TarjetaPromoBanner en el chat |
| Chat Principal | Chat Privado | Solicitud de DM desde perfil de usuario |
| Opin | Baul | Click en autor del post → abre tarjeta en Baul |
| Opin | Registro | Invitados bloqueados → CTA "Crear cuenta" |
| Baul | Chat Privado | Match → "Abrir chat privado" |
| Baul | Registro | Invitados no pueden interactuar → CTA registro |
| Baul | Chat Principal | Mensaje sugerido: "Hola, te vi en Baul" |

### 7.3 Estrategia de Conversion Progresiva

```
ETAPA 1 - DESCUBRIMIENTO (Invitado):
  → Llega via landing page SEO
  → Entra como invitado en 3 segundos
  → Chatea en sala publica
  → Ve banner de Opin → navega al feed
  → Ve posts interesantes pero no puede interactuar
  → Ve tarjetas en Baul pero no puede dar like

ETAPA 2 - FRICCION POSITIVA:
  → Cada interaccion bloqueada muestra CTA de registro
  → "Registrate gratis para comentar"
  → "Crea tu cuenta para dar like"
  → "Necesitas cuenta para chat privado"
  → El usuario QUIERE registrarse porque ya vio valor

ETAPA 3 - ACTIVACION (Registrado):
  → Se registra (email + password)
  → Se crea tarjeta automatica en Baul
  → Puede publicar en Opin
  → Puede dar likes en Baul
  → Primer match → celebracion modal

ETAPA 4 - RETENCION:
  → Recibe likes en su tarjeta → notificacion en Baul
  → Recibe comentarios en su post de Opin
  → Tiene matches activos con chat privado
  → RAZON PARA VOLVER cada dia
```

---

## 8. FLUJO COMPLETO DEL USUARIO

### 8.1 Usuario Nuevo (Primera Visita)

```
1. Google busca "chat gay chile"
2. Llega a landing page SEO (/ o variante regional)
3. Landing auto-redirige a /chat/principal en 1 segundo
4. Ve GuestUsernameModal: "Elige un nickname"
5. Escribe "Carlos28", confirma edad 18+
6. UI optimista: ve el chat EN MENOS DE 500ms
7. Firebase crea sesion anonima en background
8. Carlos28 esta en el Chat Principal, ve mensajes en tiempo real
9. Lee, escribe, interactua
10. Ve OpinDiscoveryBanner → navega a /opin
11. Lee posts, intenta dar like → "Registrate"
12. Navega a /baul → ve tarjetas, intenta interactuar → "Registrate"
13. Decide registrarse
14. /auth → email + password + edad
15. Ahora tiene acceso completo
16. Se crea su tarjeta en Baul automaticamente
17. Completa su perfil, sube foto
18. Publica su primer post en Opin
19. Da likes en Baul, recibe likes
20. Primer match → celebracion
21. Abre chat privado con su match
22. RETENCION: Vuelve al dia siguiente a ver notificaciones
```

### 8.2 Usuario Recurrente

```
1. Abre chactivo.com
2. Auto-login (sesion persistente)
3. Ve lobby con salas disponibles
4. Entra a Chat Principal → conversa
5. Revisa Opin → ve si respondieron a su post
6. Revisa Baul → ve likes nuevos, visitas, mensajes
7. Responde a actividad
8. Publica nuevo post en Opin si el anterior expiro
9. Chatea privado con matches
```

---

## 9. MODERACION Y SEGURIDAD

### 9.1 Capas de Proteccion

```
CAPA 1: Frontend (antiSpamService.js)
  → Filtra contenido ANTES de enviar
  → Reemplaza info de contacto
  → Muestra warnings al usuario

CAPA 2: Firestore Security Rules
  → Valida en servidor que el mensaje cumple reglas
  → Verifica autenticacion y propiedad
  → Filtra palabras prohibidas
  → Rechaza mensajes que no cumplen

CAPA 3: Moderacion Manual (Admin Panel)
  → Panel de alertas de moderacion
  → Sistema de sanciones (ban temporal/permanente)
  → Cambio de identidad para moderar incognito
  → Tickets de soporte

CAPA 4: IA de Moderacion (DESACTIVADA)
  → OpenAI content analysis (CORS bloqueado)
  → Detectaba: hate speech, acoso, autolesion
  → Estado: infraestructura lista, API desactivada
```

### 9.2 Sistema de Sanciones

```
Archivo: src/services/sanctionsService.js

Tipos de sancion:
  - Advertencia (warning)
  - Silencio temporal (mute, X horas)
  - Ban temporal (suspension, X dias)
  - Ban permanente

Flujo:
  1. Admin detecta comportamiento
  2. Abre SanctionUserModal
  3. Selecciona tipo + duracion + razon
  4. Se aplica: campo isBanned en documento de usuario
  5. AuthContext verifica ban en cada login
  6. Usuario baneado no puede acceder
```

### 9.3 Sistema de Reportes

**PROBLEMA CRITICO ACTUAL:** Los reportes se guardan SOLO en localStorage del cliente (ReportModal.jsx). No se envian al servidor. El admin no tiene forma de ver reportes de usuarios.

```javascript
// Estado actual (PROBLEMATICO):
localStorage.setItem('chactivo_reports', JSON.stringify(reports));
// Los reportes NUNCA llegan al admin
```

---

## 10. SEO Y ESTRATEGIA DE ADQUISICION

### 10.1 Landing Pages Regionales

| Ruta | Region | Sala destino |
|------|--------|-------------|
| `/` | Chile (principal) | principal |
| `/es`, `/españa` | Espana | es-main |
| `/br`, `/brasil` | Brasil | br-main |
| `/mx`, `/mexico` | Mexico | mx-main |
| `/ar`, `/argentina` | Argentina | ar-main |

**Estrategia SEO:**
- Landing pages minimalistas con contenido SEO (schema.org, meta tags, OG)
- Auto-redirect a chat en 1 segundo
- Contenido `sr-only` para crawlers de Google
- Canonical tags por pagina
- Meta tags dinamicos por sala

### 10.2 PWA (Progressive Web App)

- Manifest.json configurado
- Iconos en multiples resoluciones (48, 192, 512)
- Instalable como app nativa
- PWASplashScreen al cargar
- PWAInstallBanner para promover instalacion

---

## 11. PANEL DE ADMINISTRACION

### 11.1 Funcionalidades del Admin

**Archivo:** `src/pages/AdminPage.jsx` (136 KB)

```
Panel de Admin:
├── Dashboard de Analytics
│   ├── Usuarios activos
│   ├── Mensajes por hora
│   ├── Graficos de actividad
│   └── Fuentes de trafico
├── Moderacion
│   ├── Alertas de moderacion
│   ├── Aplicar sanciones
│   ├── Limpiar mensajes spam
│   └── Cambiar identidad (incognito)
├── Opin Management
│   ├── OpinStablesPanel (crear/editar posts estables)
│   └── AdminOpinRepliesPanel (respuestas editoriales)
├── Tickets de Soporte
│   ├── Lista de tickets
│   ├── Detalle y respuesta
│   └── Estado del ticket
├── Generador de Mensajes
│   ├── Crear mensajes seeded
│   └── Templates predefinidos
└── Utilidades
    ├── Limpiar bots/spam
    ├── Debug tools
    └── Performance monitor
```

### 11.2 Capacidades Especiales del Admin

- **Cambio de identidad:** Puede adoptar nombre/avatar generico para moderar sin ser detectado
- **Respuestas editoriales en Opin:** Puede responder posts como "Equipo Chactivo", "Moderador", nombres personalizados
- **Crear posts estables:** Puede sembrar contenido en Opin que nunca expira
- **Seed de conversaciones:** Puede crear mensajes iniciales en salas para que no parezcan vacias
- **Super Admin por email:** caribenosvenezolanos@gmail.com tiene acceso total automatico

---

## 12. PROBLEMAS CONOCIDOS Y DEUDA TECNICA

### 12.1 Problemas Criticos

| # | Problema | Impacto | Archivo |
|---|---------|---------|---------|
| 1 | **Reportes solo en localStorage** | Admin NUNCA ve reportes de usuarios | ReportModal.jsx |
| 2 | **Moderacion IA desactivada** | Solo filtros de palabras activos, sin analisis contextual | moderationService.js |
| 3 | **Sin rate limit en chat privado** | Posible spam entre usuarios en DMs | socialService.js |
| 4 | **Typing indicator desactivado** | UX degradada, usuarios no saben si otro esta escribiendo | presenceService.js |
| 5 | **Bots desactivados pero codigo activo** | 10+ archivos de bots en codebase sin usar | bot*.js |

### 12.2 Deuda Tecnica

| # | Item | Descripcion |
|---|------|-------------|
| 1 | ChatPage.jsx ~32,000 lineas | Archivo demasiado grande, deberia dividirse |
| 2 | AdminPage.jsx 136 KB | Necesita refactorizacion en sub-componentes |
| 3 | LobbyPage.jsx 117 KB | Excesivamente grande |
| 4 | 200+ archivos .md en raiz | Documentacion desorganizada, deberia estar en /docs |
| 5 | Sin tests automatizados | Solo 1 archivo de test (firestore.rules.test.js) |
| 6 | APIs keys en .env sin rotacion | Gemini y OpenAI keys expuestas en frontend |
| 7 | Supabase config sin usar | Archivos de Supabase presentes pero no integrados |
| 8 | Sin Cloud Functions activas | Toda la logica es client-side |
| 9 | Sin encriptacion E2E | Mensajes privados visibles en Firestore |
| 10 | Sin busqueda de mensajes | No hay Algolia/Meilisearch integrado |

### 12.3 Funcionalidades Planeadas No Implementadas

- [ ] Push notifications para likes/matches (Baul)
- [ ] Interfaz swipe para tarjetas (actualmente solo grid)
- [ ] Filtros avanzados en Baul (edad, rol, distancia)
- [ ] Imagenes en posts de Opin (1 por post)
- [ ] Categoria/tags en Opin
- [ ] Robin Hood algorithm completo en Opin
- [ ] Busqueda full-text de mensajes
- [ ] Mensajes de voz (premium)
- [ ] Envio de imagenes en chat (premium)
- [ ] Cloud Functions para expiracion automatica de posts
- [ ] E2E encryption para DMs
- [ ] Block/report desde Baul
- [ ] Perfil publico compartible (URL unica)

---

## 13. METRICAS ACTUALES Y OBJETIVO

### 13.1 Metricas Esperadas del Baul (segun documentacion interna)

| Metrica | Objetivo |
|---------|---------|
| Retencion D1 | +30-50% |
| Tiempo en app | +40% |
| Churn a WhatsApp | -60% |
| Tasa de retorno | +50% |

### 13.2 Analytics Implementados

- Google Analytics 4 integrado
- Eventos trackeados: page views, room joins, messages sent, page exits
- Performance timing: auth time, message load time, chat entry time
- Landing page analytics (conversion por region)

---

## 14. CONTEXTO COMPETITIVO: APPS EXITOSAS DEL NICHO

Para que la IA de investigacion pueda comparar y sugerir mejoras, aqui estan las aplicaciones de referencia:

### 14.1 Competidores Directos (Chat Gay)

| App | Modelo | Fortalezas | Debilidades |
|-----|--------|-----------|-------------|
| **Grindr** | Grid + DMs | Geolocalizacion, base masiva, monetizacion probada | Toxico, superficial, sin chat grupal |
| **Scruff** | Grid + DMs | Comunidad "bear", eventos, viajes | Nicho limitado, UX anticuada |
| **Hornet** | Feed + DMs | Red social, stories, noticias LGBT | Copia de Instagram, engagement bajo |
| **ROMEO (PlanetRomeo)** | Perfiles + Chat | Popular en Europa, perfiles detallados | UX anticuada, lento |
| **Blued** | Feed + Live + DMs | Popular en Asia, livestreaming | No relevante en LATAM |

### 14.2 Competidores Indirectos (Chat General)

| App | Relevancia |
|-----|-----------|
| **Discord** | Salas de chat grupal, roles, comunidades |
| **Telegram** | Grupos, canales, bots |
| **Reddit** | Foros anonimos, comunidades tematicas |
| **Omegle (cerrado)** | Chat anonimo instantaneo |

### 14.3 Donde Chactivo se Diferencia

- **Chat grupal instantaneo sin registro** (ninguna app gay tiene esto)
- **Tres funcionalidades integradas** (chat + descubrimiento + matching)
- **Foco LATAM** (competidores son globales sin localizacion)
- **Efimero + Persistente** (mezcla que ninguna app tiene)
- **Sin descarga requerida** (PWA web, no app store)

---

## 15. MAPA COMPLETO DE ARCHIVOS CRITICOS

### 15.1 Archivos por Funcionalidad

#### Chat Principal:
```
src/pages/ChatPage.jsx                    (Contenedor principal, ~32K lineas)
src/pages/ChatSecondaryPage.jsx           (Vista secundaria, 25.8 KB)
src/components/chat/ChatMessages.jsx      (Renderizado de mensajes, 408 lineas)
src/components/chat/ChatInput.jsx         (Input de mensajes, 557 lineas)
src/components/chat/ChatHeader.jsx        (Header de sala)
src/components/chat/ChatSidebar.jsx       (Lista de usuarios)
src/components/chat/PrivateChatWindow.jsx (Chat privado)
src/services/chatService.js              (CRUD de mensajes, ~400 lineas)
src/services/presenceService.js          (Presencia, 230 lineas)
src/services/antiSpamService.js          (Anti-spam, ~500 lineas)
src/services/socialService.js            (DMs, favoritos, ~400 lineas)
src/hooks/useChatScrollManager.js        (Scroll inteligente, 14.7 KB)
```

#### Opin:
```
src/pages/OpinFeedPage.jsx               (Feed principal, 10.5 KB)
src/pages/OpinComposerPage.jsx           (Crear post)
src/components/opin/OpinCard.jsx         (Tarjeta de post)
src/components/opin/OpinCommentsModal.jsx (Modal de comentarios)
src/components/opin/OpinDiscoveryBanner.jsx (Banner para invitados)
src/components/admin/OpinStablesPanel.jsx (Admin: posts estables)
src/components/admin/AdminOpinRepliesPanel.jsx (Admin: respuestas)
src/services/opinService.js              (Toda la logica, 1253 lineas)
```

#### Baul:
```
src/pages/BaulPage.jsx                   (Pagina principal, 65 lineas)
src/components/baul/BaulSection.jsx      (Contenedor, 790 lineas)
src/components/baul/TarjetaUsuario.jsx   (Componente de tarjeta, 306 lineas)
src/components/baul/TarjetaEditor.jsx    (Editor de tarjeta, 785 lineas)
src/components/baul/MensajeTarjetaModal.jsx (Modal de perfil, 385 lineas)
src/components/baul/ActividadFeed.jsx    (Feed de actividad, 565 lineas)
src/components/baul/MatchesList.jsx      (Lista de matches, 231 lineas)
src/components/baul/MatchModal.jsx       (Celebracion de match, 191 lineas)
src/components/baul/BaulPromoCard.jsx    (Banner promocional, 226 lineas)
src/services/tarjetaService.js           (Toda la logica, 1452 lineas)
```

#### Arquitectura Core:
```
src/App.jsx                              (Router, rutas, guards)
src/main.jsx                             (Entry point)
src/contexts/AuthContext.jsx             (Autenticacion, 1038 lineas)
src/contexts/ThemeContext.jsx            (Tema dark/light)
src/config/firebase.js                   (Config Firebase)
src/config/rooms.js                      (Definicion de salas)
firestore.rules                          (Reglas de seguridad, 37 KB)
storage.rules                            (Reglas de storage)
```

---

## RESUMEN EJECUTIVO PARA LA IA DE INVESTIGACION

**Chactivo** es una plataforma web de chat LGBTQ+ con tres funcionalidades core que forman un ecosistema integrado:

1. **Chat Principal:** Sala grupal en tiempo real, cero friccion de entrada (<3s como invitado), filtros anti-spam, presencia en tiempo real, chat privado para registrados. Es la PUERTA DE ENTRADA.

2. **Opin:** Tablon de notas efimeras (24h), descubrimiento pasivo de lo que buscan otros, sistema de reacciones con emojis sugestivos, conversion de invitados a registrados. Es el DESCUBRIMIENTO.

3. **Baul:** Perfiles persistentes con fotos, matching por likes mutuos, feed de actividad (likes, visitas, mensajes), chat privado tras match. Es la RETENCION.

**Las tres se conectan:** Chat → atrae usuarios → Opin → muestra valor → Baul → crea conexiones → Chat Privado → retencion.

**Estado actual:** Produccion, funcional, con deuda tecnica significativa (archivos enormes, bots desactivados, reportes rotos, moderacion IA desactivada).

**Oportunidad:** La plataforma tiene infraestructura solida pero necesita refinamiento de UX, activacion de funciones premium, implementacion de features faltantes, y optimizacion de los funnels de conversion para competir efectivamente con apps establecidas como Grindr/Scruff/Hornet en el mercado LATAM.

---

> **Nota para la IA de investigacion:** Este documento contiene TODA la informacion funcional de las tres features principales. Puedes asumir que es completo y preciso. Usa esta base para comparar con las mejores practicas de la industria (Grindr, Scruff, Hornet, Discord, Telegram) y sugerir mejoras estrategicas e implementaciones que refuercen al 1000% la propuesta de valor de Chactivo.
