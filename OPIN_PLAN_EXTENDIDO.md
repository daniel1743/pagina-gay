# OPIN - Motor de Descubrimiento Social - Plan de Implementación EXTENDIDO

## RESUMEN EJECUTIVO

OPIN transforma Chactivo de chat efímero a plataforma de encuentros persistente. Posts duran 24 horas, 1 post activo por usuario, algoritmo Robin Hood garantiza visibilidad equitativa.

**Decisiones clave del usuario:**
- ✅ Posts expiran en 24h fijas (Instagram Stories style)
- ✅ 1 post activo por usuario (máxima diversidad)
- ✅ Analytics con lista de quién vio el post
- ✅ Click "Ver perfil" abre perfil completo + botón mensaje

---

## FASE 1: MVP BÁSICO (Semana 1-2) ✅ EN PROGRESO

### Backend: Firestore Structure

**Nueva colección: `opin_posts/{postId}`**
```javascript
{
  postId, userId, username, avatar,
  text: string (10-500 chars),
  tags: string[] (1-3 tags),
  createdAt, expiresAt: createdAt + 24h,
  priorityScore: 100 (inicial),
  isActive: true,
  moderationStatus: "active",
  reportCount: 0,
  reportedBy: string[],
  viewedBy: string[],
  profileViewedBy: string[],
  viewCount: 0,
  profileClickCount: 0
}
```

**Nueva colección: `opin_cooldowns/{userId}`**
```javascript
{
  userId,
  lastPostAt,
  canPostAgainAt: lastPostAt + 30min,
  postsToday: number
}
```

**Extender colección existente: `users/{userId}`**
```javascript
{
  // ... campos existentes ...
  opinStats: {
    totalPostsCreated: 0,
    totalViews: 0,
    totalProfileClicks: 0,
    totalMessagesFromOpin: 0,
    lastPostId: null,
    hasActivePost: false
  }
}
```

### Firestore Security Rules

**Archivo: `firestore.rules`**
```javascript
match /opin_posts/{postId} {
  // Lectura: todos los autenticados, solo posts activos
  allow read: if isAuthenticated() &&
                resource.data.isActive == true &&
                resource.data.moderationStatus == 'active';

  // Creación: validaciones estrictas
  allow create: if isAuthenticated() &&
                  !request.auth.token.firebase.sign_in_provider == 'anonymous' &&
                  request.resource.data.userId == request.auth.uid &&
                  request.resource.data.text.size() >= 10 &&
                  request.resource.data.text.size() <= 500 &&
                  request.resource.data.tags.size() >= 1 &&
                  request.resource.data.tags.size() <= 3 &&
                  request.resource.data.priorityScore == 100;

  // Actualización: solo analytics (viewedBy, profileViewedBy)
  allow update: if isAuthenticated() &&
                  request.resource.data.text == resource.data.text &&
                  request.resource.data.diff(resource.data).affectedKeys()
                    .hasOnly(['viewedBy', 'profileViewedBy', 'viewCount',
                             'profileClickCount', 'updatedAt']);

  // Eliminación: solo autor
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}

match /opin_cooldowns/{userId} {
  allow read: if isAuthenticated() && request.auth.uid == userId;
  allow create, update: if isAuthenticated() && request.auth.uid == userId;
}
```

### Índices Firestore

**Archivo: `firestore.indexes.json`**
```json
{
  "indexes": [
    {
      "collectionGroup": "opin_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "moderationStatus", "order": "ASCENDING" },
        { "fieldPath": "priorityScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "opin_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Frontend: Servicios

**Crear: `src/services/opinService.js`** ✅ HECHO
- `canCreatePost()` - Valida cooldown y post activo
- `createOpinPost({ text, tags })` - Crea post con validaciones
- `getOpinFeed(limit)` - Obtiene feed ordenado por priorityScore
- `markPostAsViewed(postId)` - Tracking de vista
- `trackProfileView(postId)` - Tracking de click a perfil
- `getMyOpinPosts()` - Posts propios
- `deleteOpinPost(postId)` - Eliminar post
- `reportOpinPost(postId, reason)` - Reportar

### Frontend: Componentes

**Crear: `src/components/opin/OpinCard.jsx`**
- Basado en: `ForumThread.jsx`
- Props: post, index, onProfileClick, onReport
- Diseño: glass-effect, avatar, username, texto, tags, countdown
- Stats: viewCount, profileClickCount
- Botones: "Ver perfil", "Reportar"
- Tracking: Intersection Observer para markPostAsViewed()

**Crear: `src/pages/OpinFeedPage.jsx`**
- Basado en: `AnonymousForumPage.jsx`
- Feed grid con OpinCard components
- Filtros por tags
- Infinite scroll
- Botón flotante "Publicar" (si no tiene post activo)
- Animaciones framer-motion

**Crear: `src/pages/OpinComposerPage.jsx`**
- Formulario: Textarea (10-500 chars), selector tags (1-3)
- Contador de caracteres
- Preview en tiempo real
- Validación cooldown
- Botón "Publicar"

**Crear: `src/components/opin/OpinProfileModal.jsx`**
- Reutiliza UserProfileModal existente
- Botón "Enviar mensaje"
- Tracking: trackProfileView() al abrir

### Rutas

**Actualizar: `src/App.jsx`**
```jsx
import OpinFeedPage from '@/pages/OpinFeedPage';
import OpinComposerPage from '@/pages/OpinComposerPage';

<Route path="/opin" element={<MainLayout><OpinFeedPage /></MainLayout>} />
<Route path="/opin/new" element={<PrivateRoute><MainLayout><OpinComposerPage /></MainLayout></PrivateRoute>} />
```

### Integraciones

**Actualizar: `src/pages/LobbyPage.jsx`**
- Agregar card "OPIN - Descubrimiento" con purple-gradient

**Actualizar: `src/components/layout/Header.jsx`**
- Agregar link "OPIN" (solo usuarios registrados)

---

## FASE 2: ROBIN HOOD ALGORITHM (Semana 3) 🔮 FUTURO

### Cloud Functions Setup

**Crear directorio: `/functions`**
```
/functions
  /package.json
  /index.js
  /src
    /robinHood.js
    /postExpiration.js
    /moderation.js
```

**`functions/package.json`**
```json
{
  "name": "chactivo-functions",
  "engines": { "node": "18" },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  }
}
```

### Robin Hood Function

**`functions/src/robinHood.js`**
- Schedule: cada 15 minutos
- Lógica:
  1. Obtener posts activos
  2. Calcular avgViews y maxViews
  3. Posts con viewRatio > 0.7 → priorityScore -= 15
  4. Posts con viewRatio < 0.3 → priorityScore += 15
  5. Posts < 1h → mantener score >= 90
  6. Posts > 20h → score -= 20
  7. Limitar score entre 0-100
  8. Batch update

### Post Expiration Function

**`functions/src/postExpiration.js`**
- Schedule: cada 1 hora
- Buscar posts con expiresAt <= now
- Marcar isActive = false
- Actualizar user opinStats.hasActivePost = false

### Auto-Moderation Function

**`functions/src/moderation.js`**
- Trigger: onUpdate de opin_posts
- Si reportCount >= 3 → moderationStatus = "under_review", isActive = false

### Deploy

```bash
firebase init functions
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## FASE 3: ANALYTICS Y VIEWS (Semana 4) 🔮 FUTURO

### Frontend: Analytics

**Crear: `src/components/opin/OpinAnalyticsModal.jsx`**
- Tabs: "Vistas" y "Clicks a perfil"
- Lista de usuarios (avatar + username)
- Total count badges

**Crear: `src/pages/OpinMyPostsPage.jsx`**
- Lista de posts propios (activos + históricos)
- Analytics por post
- Botón "Eliminar post activo"
- Cooldown timer

**Ruta:**
```jsx
<Route path="/opin/my-posts" element={<PrivateRoute><MainLayout><OpinMyPostsPage /></MainLayout></PrivateRoute>} />
```

### Tracking Avanzado

- Integrar con `analyticsService.js` existente
- Eventos: opin_post_created, opin_post_viewed, opin_profile_clicked, opin_message_sent

---

## FASE 4: MODERACIÓN Y REFINAMIENTO (Semana 5) 🔮 FUTURO

### Moderación

- Botón "Reportar" en OpinCard
- Integración con reportService existente
- Badge "En revisión" para posts reportados
- Toast confirmación de reporte

### UX Refinamiento

- Optimizar animaciones
- Tooltips informativos
- Mejorar mensajes de error
- Responsive testing completo
- A/B testing de colores

---

## ARCHIVOS CRÍTICOS A MODIFICAR

### 1. `firestore.rules` (EXTENDER)
- Agregar reglas para opin_posts y opin_cooldowns
- No romper reglas existentes

### 2. `src/services/userService.js` (EXTENDER)
- Agregar opinStats en createUserProfile()
- Agregar opinStats en updateUserProfile()

### 3. `src/App.jsx` (AGREGAR RUTAS)
- Importar OpinFeedPage, OpinComposerPage, OpinMyPostsPage
- Agregar 3 rutas nuevas

### 4. `src/pages/LobbyPage.jsx` (AGREGAR CARD)
- Card OPIN con purple-gradient
- onClick → navigate('/opin')

### 5. `src/components/layout/Header.jsx` (AGREGAR LINK)
- Link "OPIN" solo para usuarios registrados
- Icon: Users de lucide-react

---

## PATRONES A REUTILIZAR

### De `ForumThread.jsx` → `OpinCard.jsx`
- glass-effect border
- Animaciones hover (border-cyan-400)
- Badges de categoría con colores
- Timestamps relativos
- Estructura: avatar + header + content + footer

### De `AnonymousForumPage.jsx` → `OpinFeedPage.jsx`
- Filtros por categorías
- Sorting options
- AnimatePresence para lista
- Botón flotante con magenta-gradient
- Grid responsive

### De `UserProfileModal.jsx` → `OpinProfileModal.jsx`
- Modal structure
- Avatar con premium ring
- Username con badges
- Botones de acción

---

## SISTEMA DE DISEÑO

### Colores (ya existentes)
- Primary: #E4007C (magenta)
- Secondary: #00FFFF (cyan)
- Glass-effect: rgba(255,255,255,0.05) + backdrop-blur
- Gradientes: magenta-gradient, purple-gradient, cyan-gradient

### Tags Colors
- Amistad: cyan-500
- Citas: pink-500
- Chat: purple-500
- Networking: blue-500
- Eventos: amber-500

### Animaciones (framer-motion)
```jsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, delay: index * 0.05 }}
```

---

## VALIDACIONES Y LÍMITES

### Creación de Post
- ❌ Usuarios guest no pueden publicar
- ❌ Solo 1 post activo por usuario
- ❌ Cooldown 30 minutos entre posts
- ❌ Texto: 10-500 caracteres
- ❌ Tags: 1-3 tags
- ✅ Duración: 24 horas fijas

### Seguridad
- Solo usuarios registrados (no anonymous)
- Autor puede eliminar su post
- 3 reportes → ocultar automáticamente
- viewedBy/profileViewedBy solo visible para autor

---

## MÉTRICAS DE ÉXITO

Track en analyticsService:
- Posts creados totales
- Promedio views por post
- Tasa conversión: views → clicks perfil
- Tasa conversión: clicks → mensajes
- Tags más populares
- Robin Hood effectiveness (distribución de views)

---

## TESTING CHECKLIST

### MVP (Fase 1)
- [ ] Usuario registrado crea post exitosamente
- [ ] Guest intenta crear → error "Solo usuarios registrados"
- [ ] Usuario con post activo intenta crear otro → error "Ya tienes post activo"
- [ ] Validación 10-500 chars funciona
- [ ] Validación 1-3 tags funciona
- [ ] Feed muestra posts ordenados por priorityScore
- [ ] Countdown muestra tiempo restante correcto
- [ ] Click "Ver perfil" abre modal correcto
- [ ] Cooldown 30 min funciona

### Robin Hood (Fase 2)
- [ ] Function ejecuta cada 15 min
- [ ] Posts con muchas views bajan score
- [ ] Posts con pocas views suben score
- [ ] Posts nuevos mantienen score alto
- [ ] Posts viejos degradan gradualmente
- [ ] Logs en Firebase Console visibles

### Analytics (Fase 3)
- [ ] Intersection Observer detecta views correctamente
- [ ] viewedBy array se actualiza
- [ ] viewCount incrementa (solo una vez por usuario)
- [ ] profileViewedBy array se actualiza al click
- [ ] OpinAnalyticsModal muestra lista correcta
- [ ] "Mis posts" muestra stats correctos

### Moderación (Fase 4)
- [ ] Botón "Reportar" funciona
- [ ] 3 reportes ocultan post automáticamente
- [ ] Post oculto no aparece en feed
- [ ] Toast de confirmación aparece
- [ ] Integración con reportService funciona

---

## COSTOS ESTIMADOS

### Firebase Functions (Blaze Plan)
- Robin Hood: 2,880 ejecuciones/mes = ~$0.48/mes
- Expiration: 720 ejecuciones/mes = ~$0.12/mes
- Firestore reads: 1M lecturas = ~$0.36

**Total:** < $5/mes para 1000 usuarios activos

---

## COMANDOS DE DEPLOY

```bash
# Setup inicial
firebase init functions
firebase init firestore

# Deploy functions
firebase deploy --only functions

# Deploy rules e índices
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Deploy todo
firebase deploy
```

---

## DOCUMENTACIÓN A CREAR

- `/docs/OPIN_README.md` - Guía de uso
- `/docs/OPIN_ARCHITECTURE.md` - Arquitectura técnica
- `/docs/OPIN_STYLE_GUIDE.md` - Guía de estilos UI

---

## RIESGOS Y MITIGACIONES

### Riesgo 1: Firebase Functions requiere Blaze plan
**Mitigación:** Monitorear costos semanalmente, alertas configuradas

### Riesgo 2: Índices compuestos tardan en crearse
**Mitigación:** Crear índices en desarrollo primero, probar queries

### Riesgo 3: Robin Hood necesita fine-tuning
**Mitigación:** Logs detallados, ajustar parámetros según métricas reales

### Riesgo 4: Moderación automática genera falsos positivos
**Mitigación:** Sistema de apelación, revisión manual de admins

---

## VERIFICACIÓN END-TO-END

### Flujo Completo de Usuario

1. Usuario registrado entra a /opin
2. Ve feed con posts de otros usuarios
3. Click "Publicar" → /opin/new
4. Escribe texto, selecciona tags, click "Publicar"
5. Post aparece en feed con priorityScore = 100
6. Otro usuario ve el post → viewCount incrementa
7. Otro usuario click "Ver perfil" → profileClickCount incrementa
8. Autor ve analytics en /opin/my-posts
9. Robin Hood ajusta scores cada 15 min
10. Después de 24h, post expira automáticamente

### Comandos de Verificación

```bash
# Ver logs de functions
firebase functions:log

# Ver índices
firebase firestore:indexes

# Ver rules deployed
firebase firestore:rules --version
```

---

## PRÓXIMOS PASOS

1. ✅ MVP implementándose ahora
2. ⏳ Testing completo de MVP
3. ⏳ Medir métricas de éxito
4. ⏳ Decidir si continuar con Fase 2-4

---

**Tiempo estimado total:** 5 semanas (1 desarrollador full-time)
**Estado:** ✅ MVP en desarrollo
**Fecha creación:** 2026-01-13

**Prioridad:** CRITICAL - Growth Experiment
