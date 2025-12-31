# Auditoría: Landing Pages Internacionales (ES/BR/MX/AR)

**Fecha:** 2025-01-XX  
**Auditor:** Senior Engineer  
**Alcance:** Landing pages de países internacionales y su impacto en SEO y funcionalidad de Chile

---

## A) Resumen Ejecutivo

- ✅ **SEO SPA-Safe:** Todas las landing pages internacionales (España, Brasil, México, Argentina) implementan cleanup correcto: guardan `document.title` y `meta[name="description"]` previos al montar y los restauran al desmontar. Esto previene contaminación SEO en navegación SPA.
- ⚠️ **Chile sin Cleanup:** `GlobalLandingPage.jsx` (Chile en `/landing`) NO restaura title/meta al desmontar. Si un usuario navega desde `/es` → `/landing` sin recargar, el title de España podría persistir brevemente hasta que Chile establezca el suyo.
- ✅ **Routing Correcto:** Todos los CTAs de las landing pages internacionales navegan correctamente a sus salas correspondientes (`/chat/es-main`, `/chat/br-main`, `/chat/mx-main`, `/chat/ar-main`).
- ⚠️ **Flujo Guest Incompleto:** `GuestUsernameModal` siempre redirige a `/chat/global` (hardcoded), ignorando el `chatRoomId` del país. Los usuarios guest que vienen de landing pages internacionales terminan en la sala global de Chile en lugar de su sala de país.
- ✅ **Integridad de Salas:** Todas las salas (`es-main`, `br-main`, `mx-main`, `ar-main`) existen en `rooms.js` y `ChatPage` valida correctamente contra `roomsData`.
- ⚠️ **Rutas Duplicadas:** Existen rutas con y sin barra final (`/es` y `/es/`) para cada país. El canonical apunta a la versión sin barra, pero ambas URLs son accesibles (riesgo de duplicación SEO bajo pero presente).

---

## B) Hallazgos por Severidad

### P0 (Crítico - Debe Corregirse)

#### 1. **GlobalLandingPage (Chile) no restaura SEO al desmontar**

**Descripción:**  
`GlobalLandingPage.jsx` establece `document.title` y `meta[name="description"]` en el mount, pero NO implementa cleanup en el unmount. Si un usuario navega desde una landing internacional (ej: `/es`) a `/landing` sin recargar la página, el title/meta de España podría persistir hasta que Chile establezca los suyos.

**Archivo(s):**  
- `src/pages/GlobalLandingPage.jsx` (líneas 50-62)

**Código relevante:**
```javascript
React.useEffect(() => {
  // ✅ SEO: Title y meta description optimizados
  document.title = 'Chat gay Chile | Gratis y anónimo';
  
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  
  metaDescription.content = 'Chat gay Chile sin registro...';
  // ❌ FALTA: return () => { /* cleanup */ }
}, []);
```

**Impacto:**  
- Riesgo de contaminación SEO: title/meta de países internacionales pueden "filtrarse" a la página de Chile durante navegación SPA.
- Afecta ranking y previews en redes sociales/buscadores.

**Cómo reproducir:**
1. Abrir `/es` en el navegador (verificar que title = "Chat gay España...")
2. Sin recargar, navegar a `/landing` (click en logo o link)
3. Inspeccionar `document.title` inmediatamente después de la navegación
4. **Resultado esperado:** Title debería ser "Chat gay Chile..." inmediatamente
5. **Resultado actual:** Title puede mostrar "Chat gay España..." brevemente

**Recomendación de fix:**
```javascript
React.useEffect(() => {
  const previousTitle = document.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  const hadMetaDescription = !!metaDescription;
  const previousDescription = metaDescription?.getAttribute('content') ?? '';

  document.title = 'Chat gay Chile | Gratis y anónimo';
  
  let ensuredMeta = metaDescription;
  if (!ensuredMeta) {
    ensuredMeta = document.createElement('meta');
    ensuredMeta.name = 'description';
    document.head.appendChild(ensuredMeta);
  }
  ensuredMeta.content = 'Chat gay Chile sin registro...';

  return () => {
    document.title = previousTitle;
    const currentMeta = document.querySelector('meta[name="description"]');
    if (!currentMeta) return;
    if (hadMetaDescription) {
      currentMeta.setAttribute('content', previousDescription);
    } else {
      currentMeta.remove();
    }
  };
}, []);
```

---

#### 2. **GuestUsernameModal redirige siempre a /chat/global (ignora país)**

**Descripción:**  
Cuando un usuario guest completa el modal de username, siempre se redirige a `/chat/global` (hardcoded), ignorando el `chatRoomId` del país desde donde vino. Esto rompe el flujo: usuarios de España/Brasil/México/Argentina terminan en la sala global de Chile.

**Archivo(s):**  
- `src/components/auth/GuestUsernameModal.jsx` (línea 96)

**Código relevante:**
```javascript
// Redirigir a la sala principal nueva (sin spam)
navigate('/chat/global'); // ❌ Hardcoded, ignora país
```

**Impacto:**  
- Usuarios internacionales que entran como guest no llegan a su sala de país.
- Pérdida de conversión y confusión de usuario.
- Afecta métricas de engagement por país.

**Cómo reproducir:**
1. Abrir `/es` (sin estar logueado)
2. Click en "ENTRAR AL CHAT YA!"
3. En `EntryOptionsModal`, click "Continuar sin Registro"
4. En `GuestUsernameModal`, ingresar username y click "Empezar"
5. **Resultado esperado:** Navegar a `/chat/es-main`
6. **Resultado actual:** Navega a `/chat/global`

**Recomendación de fix:**
- Opción A: Pasar `chatRoomId` como prop a `GuestUsernameModal` desde las landing pages.
- Opción B: Usar `sessionStorage` o `location.state` para persistir el `chatRoomId` durante el flujo de modales.
- Opción C: Modificar `signInAsGuest` para aceptar un parámetro `redirectTo` y usarlo en lugar de hardcodear `/chat/global`.

**Ejemplo (Opción A):**
```javascript
// En SpainLandingPage.jsx
<GuestUsernameModal
  open={showGuestModal}
  onClose={() => setShowGuestModal(false)}
  chatRoomId="es-main" // ✅ Nuevo prop
/>

// En GuestUsernameModal.jsx
export const GuestUsernameModal = ({ open, onClose, chatRoomId = 'global' }) => {
  // ...
  navigate(`/chat/${chatRoomId}`); // ✅ Usar prop
};
```

---

### P1 (Importante - Debería Corregirse)

#### 3. **Rutas duplicadas con/sin barra final (/es y /es/)**

**Descripción:**  
En `App.jsx` existen rutas duplicadas para cada país: `/es` y `/es/`, `/br` y `/br/`, etc. Ambas URLs renderizan el mismo componente. El canonical apunta a la versión sin barra (`/es`), pero ambas son accesibles, creando duplicación de contenido.

**Archivo(s):**  
- `src/App.jsx` (líneas 105-112)

**Código relevante:**
```javascript
<Route path="/es" element={...} />
<Route path="/es/" element={...} /> // ❌ Duplicado
<Route path="/br" element={...} />
<Route path="/br/" element={...} /> // ❌ Duplicado
// ... mismo patrón para /mx y /ar
```

**Impacto:**  
- Duplicación de contenido SEO (mismo contenido en dos URLs).
- Posible dilución de ranking entre las dos versiones.
- Confusión para crawlers y usuarios.

**Cómo reproducir:**
1. Abrir `/es` y verificar canonical en `<head>` (debería ser `https://chactivo.com/es`)
2. Abrir `/es/` y verificar canonical (también es `https://chactivo.com/es`)
3. Ambas URLs son accesibles y renderizan el mismo contenido

**Recomendación de fix:**
- Opción A: Eliminar las rutas con barra final y agregar redirects en el servidor (nginx/Apache) de `/es/` → `/es`.
- Opción B: Agregar redirects en React Router:
```javascript
<Route path="/es/" element={<Navigate to="/es" replace />} />
<Route path="/es" element={...} />
```

---

#### 4. **Open Graph tags no personalizados por país**

**Descripción:**  
Los tags Open Graph (`og:title`, `og:description`, `og:url`, etc.) están definidos solo en `index.html` (estáticos, globales). No se actualizan dinámicamente por landing page de país. Cuando se comparte `/es` en Facebook/WhatsApp, muestra el OG de Chile/global.

**Archivo(s):**  
- `index.html` (tags OG estáticos)
- Landing pages internacionales (NO establecen OG tags)

**Impacto:**  
- Previews incorrectos en redes sociales: compartir `/es` muestra información de Chile.
- Pérdida de oportunidad SEO: OG tags específicos por país mejoran CTR en shares.

**Cómo reproducir:**
1. Abrir `/es` en el navegador
2. Inspeccionar `<head>` y buscar `<meta property="og:title">`
3. **Resultado:** Muestra OG title/description de Chile (desde index.html)
4. Compartir `/es` en Facebook/WhatsApp
5. **Resultado:** Preview muestra información de Chile, no de España

**Recomendación de fix:**
Agregar `useEffect` en cada landing page internacional para establecer OG tags:
```javascript
useEffect(() => {
  // OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', 'Chat gay España – Comunidad LGBT española');

  // OG Description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute('content', 'Chat gay de España...');

  // OG URL
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', 'https://chactivo.com/es');

  return () => {
    // Restaurar OG tags originales si es necesario
  };
}, []);
```

---

### P2 (Menor - Mejora Opcional)

#### 5. **Nombres de imágenes con espacios en México/Argentina**

**Descripción:**  
`MexicoLandingPage.jsx` y `ArgentinaLandingPage.jsx` usan nombres de archivo con espacios (`/MODELO 1.jpeg`, `/MODELO 2.jpeg`), mientras que España y Brasil usan nombres sin espacios (`/modelo-1.jpeg`). Los espacios pueden causar problemas en algunos CDNs y afectar LCP (Largest Contentful Paint).

**Archivo(s):**  
- `src/pages/MexicoLandingPage.jsx` (líneas 19-24)
- `src/pages/ArgentinaLandingPage.jsx` (líneas 18-24)

**Código relevante:**
```javascript
// México/Argentina
const modelImages = [
  '/MODELO 1.jpeg', // ❌ Espacios
  '/MODELO 2.jpeg',
  // ...
];

// España/Brasil
const modelImages = useMemo(
  () => [
    '/modelo-1.jpeg', // ✅ Sin espacios
    '/modelo-2.jpeg',
    // ...
  ],
  []
);
```

**Impacto:**  
- Inconsistencia en el código.
- Posibles 404s en algunos CDNs que no manejan bien espacios en URLs.
- Impacto menor en performance (LCP).

**Cómo reproducir:**
1. Abrir `/mx` o `/ar`
2. Abrir DevTools → Network
3. Buscar requests a `/MODELO%201.jpeg` (URL encoded)
4. Verificar si hay errores 404 o delays

**Recomendación de fix:**
Renombrar archivos en `public/` de `MODELO 1.jpeg` → `modelo-1.jpeg` y actualizar referencias en código.

---

## C) Checklist de Verificación SEO

- [x] Cada landing internacional establece `document.title` y lo restaura al desmontar (ES/BR/MX/AR)
- [x] Cada landing internacional establece `meta[name="description"]` y lo restaura/elimina apropiadamente
- [x] `useCanonical` se llama con paths específicos por país (`/es`, `/br`, `/mx`, `/ar`); canonical se actualiza en navegación
- [ ] **Chile landing (`/landing` → `GlobalLandingPage`) restaura title/meta al desmontar** ❌ FALTA
- [ ] Duplicación de trailing-slash resuelta (actualmente existen `/es` y `/es/`)
- [ ] OG tags específicos por país presentes (actualmente solo globales)
- [x] Navegación SPA `/es` → `/landing` actualiza head tags (cleanup ocurre en unmount; nueva página establece los suyos, pero Chile no limpia)
- [x] `useCanonical` hook no sobrescribe globalmente (solo actualiza el tag canonical existente)

---

## D) Checklist de Verificación de Routing y Chat

- [x] CTAs de España navegan a `/chat/es-main` (botón + `EntryOptionsModal` con `chatRoomId="es-main"`)
- [x] CTAs de Brasil navegan a `/chat/br-main`
- [x] CTAs de México navegan a `/chat/mx-main`
- [x] CTAs de Argentina navegan a `/chat/ar-main`
- [x] `roomsData` incluye ids `es-main`, `br-main`, `mx-main`, `ar-main`; `ChatPage` valida contra `roomsData`
- [x] Sidebar usa `roomsData` por lo que las salas de países aparecen y enrutan correctamente
- [ ] **Flujo guest: `GuestUsernameModal` navega a la sala correcta del país** ❌ ACTUALMENTE SIEMPRE A `/chat/global`
- [x] `LandingRoute` redirige usuarios autenticados (no-guest) a `/home` (no a `/chat/global`), preservando intención SEO
- [x] `EntryOptionsModal` recibe `chatRoomId` correcto desde cada landing page
- [x] `ChatPage` usa `roomId` de URL y valida contra `roomsData` antes de suscribirse
- [x] No hay redirecciones accidentales a `/chat/global` desde landing pages internacionales (excepto en flujo guest)

---

## E) Conclusión Final

**Riesgo de contaminación SEO de Chile: SÍ (BAJO, pero presente).**

**Razonamiento:**

1. **Protección Parcial:** Las landing pages internacionales (ES/BR/MX/AR) SÍ implementan cleanup correcto de title/meta al desmontar, lo que previene que contaminen otras rutas.

2. **Vulnerabilidad de Chile:** `GlobalLandingPage.jsx` NO restaura title/meta al desmontar. Si un usuario navega desde `/es` → `/landing` sin recargar:
   - España establece title = "Chat gay España..."
   - Usuario navega a `/landing`
   - España se desmonta y restaura el title previo (que podría ser de otra página)
   - Chile se monta y establece su title = "Chat gay Chile..."
   - **Ventana de contaminación:** Breve, pero existe durante el unmount de España y mount de Chile.

3. **Canonical Seguro:** `useCanonical` hook solo actualiza el tag canonical existente, no lo sobrescribe globalmente. Cada ruta establece su propio canonical correctamente.

4. **Componentes Compartidos:** `MainLayout`, `Header`, `Footer`, `ChatDemo`, `LandingRoute` NO modifican head tags globalmente. Solo las landing pages individuales lo hacen.

5. **Open Graph:** Los OG tags son estáticos en `index.html` y no se modifican dinámicamente, por lo que no hay riesgo de contaminación (pero tampoco hay personalización por país).

**Recomendación:**  
Implementar cleanup de SEO en `GlobalLandingPage.jsx` (P0) para eliminar completamente el riesgo de contaminación, incluso durante la breve ventana de transición entre componentes.

---

## F) Archivos Revisados

- ✅ `src/pages/SpainLandingPage.jsx`
- ✅ `src/pages/BrazilLandingPage.jsx`
- ✅ `src/pages/MexicoLandingPage.jsx`
- ✅ `src/pages/ArgentinaLandingPage.jsx`
- ✅ `src/pages/GlobalLandingPage.jsx`
- ✅ `src/App.jsx`
- ✅ `src/config/rooms.js`
- ✅ `src/pages/ChatPage.jsx`
- ✅ `src/components/auth/EntryOptionsModal.jsx`
- ✅ `src/components/auth/GuestUsernameModal.jsx`
- ✅ `src/components/chat/ChatSidebar.jsx`
- ✅ `src/hooks/useCanonical.js`
- ✅ `src/components/layout/Header.jsx`
- ✅ `src/components/layout/MainLayout.jsx` (implícito en App.jsx)

---

**Fin del Informe de Auditoría**
