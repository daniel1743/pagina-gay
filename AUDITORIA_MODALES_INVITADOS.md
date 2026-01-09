# 🔍 AUDITORÍA COMPLETA: MODALES DE INGRESO PARA INVITADOS

**Fecha:** 2025-01-07  
**Tipo:** Análisis exhaustivo de modales y flujos de entrada  
**Estado:** Basado exclusivamente en código fuente actual

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **Modales Activos** | 4 | ✅ Funcionales |
| **Modales Comentados/Eliminados** | 2 | ⚠️ No usados |
| **Componentes Inline** | 3 | ✅ Activos |
| **Landing Pages con Formularios** | 6+ | ✅ Activos |
| **Total Flujos de Entrada** | 10+ | Varios activos |

---

## 1️⃣ MODALES DE INGRESO PARA INVITADOS

### 1.1. ✅ GuestUsernameModal (PRINCIPAL)

**Ubicación:** `src/components/auth/GuestUsernameModal.jsx`  
**Estado:** `ACTIVO - PRINCIPAL`  
**Uso:** Modal principal para entrada rápida de invitados

#### Características:
- **Campos requeridos:**
  - Nickname (mínimo 3 caracteres, máximo 20)
  - Checkbox "Mantener sesión" (default: `true`)
- **Avatar:** Asignación automática aleatoria de 10 opciones
- **Validación:** Solo nickname, sin edad ni reglas
- **Navegación:** Optimistic navigation (navega antes de Firebase)
- **Persistencia:** Integrada con `guestIdentity.js`

#### Funcionamiento:

```javascript
// Auto-detección de identidad persistente
useEffect(() => {
  if (open && hasGuestIdentity()) {
    // Si ya tiene identidad guardada, entrar automáticamente
    onClose();
    navigate(`/chat/${chatRoomId}`, { replace: true });
  }
}, [open, chatRoomId, navigate, onClose]);

// Guardar datos para persistencia
if (keepSession) {
  saveTempGuestData({
    nombre: nickname.trim(),
    avatar: randomAvatar
  });
}

// Navegación optimista (antes de Firebase)
onClose();
navigate(`/chat/${chatRoomId}`, { replace: true });

// Autenticación en background
signInAsGuest(nickname.trim(), randomAvatar, keepSession)
```

#### Persistencia:
- **localStorage:** `guest_session_saved` (si `keepSession = true`)
- **guestIdentity.js:** Usa `saveTempGuestData()` para datos temporales
- **Verificación:** `hasGuestIdentity()` antes de mostrar modal

#### Dónde se usa:
- `src/pages/GlobalLandingPage.jsx` (línea 1006)
- `src/components/layout/Header.jsx` (línea 251)
- `src/pages/LobbyPage.jsx` (línea 2146)
- `src/pages/SantiagoLandingPage.jsx` (línea 1297)
- `src/pages/GamingLandingPage.jsx` (línea 1266)
- `src/pages/Mas30LandingPage.jsx` (línea 1029)

#### Flujo de entrada:
```
Usuario no autenticado → Click "Entrar" → GuestUsernameModal se abre
  ↓
Si hasGuestIdentity() === true → Auto-entrar al chat (sin mostrar modal)
  ↓
Si hasGuestIdentity() === false → Mostrar modal con formulario
  ↓
Usuario ingresa nickname → Click "Ir al Chat"
  ↓
Guardar en localStorage (si keepSession = true) → Navegar optimísticamente
  ↓
signInAsGuest() en background → Usuario en chat
```

---

### 1.2. ✅ AgeVerificationModal

**Ubicación:** `src/components/chat/AgeVerificationModal.jsx`  
**Estado:** `ACTIVO - SECUNDARIO`  
**Uso:** Verificación de edad y perfil para usuarios anónimos

#### Características:
- **Campos requeridos:**
  - Edad (número, mínimo 18)
  - Nombre de usuario (3-20 caracteres)
  - Avatar (selección entre 4 opciones predefinidas)
  - Checkbox "Mantener sesión" (default: `false`)
- **Validación:** Completa (edad, username, avatar)
- **Estilo:** Modal oscuro con gradientes (fuchsia/purple/cyan)

#### Funcionamiento:

```javascript
const handleConfirm = () => {
  // Validar edad
  if (parsedAge < 18) {
    setError('Debes ser mayor de 18 años');
    return;
  }
  
  // Validar username
  if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
    setError('Usuario inválido');
    return;
  }
  
  // Validar avatar
  if (!selectedAvatar) {
    setError('Selecciona un avatar');
    return;
  }
  
  // Llamar callback con todos los datos
  onConfirm(parsedAge, trimmedUsername, selectedAvatar, keepSession);
};
```

#### Persistencia:
- **localStorage:** Guarda `age_verified_${user.id}` = '18'
- **sessionStorage:** `age_verified_${username}` = 'true' (en algunos flujos)
- **No usa guestIdentity.js** directamente (se usa en ChatPage)

#### Dónde se usa:
- `src/pages/ChatPage.jsx` (línea 2185)
- Se muestra solo si:
  - Usuario es anónimo/invitado
  - No tiene edad verificada en localStorage
  - No viene desde landing page

#### Flujo de entrada:
```
Usuario anónimo en ChatPage → Verificar edad en localStorage
  ↓
Si NO tiene edad verificada → Mostrar AgeVerificationModal
  ↓
Usuario completa formulario → onConfirm()
  ↓
updateAnonymousUserProfile(username, avatar) → Guardar edad
  ↓
localStorage.setItem(`age_verified_${user.id}`, '18')
```

#### ⚠️ IMPORTANTE:
Este modal está siendo **auto-verificado** en ChatPage para usuarios invitados:

```javascript
// ChatPage.jsx línea 467-472
if (user.isGuest || user.isAnonymous) {
  setIsAgeVerified(true);
  setShowAgeVerification(false);
  localStorage.setItem(`age_verified_${user.id}`, '18');
  return; // NO mostrar modal adicional - CERO FRICCIÓN
}
```

Por lo tanto, **actualmente NO se muestra** para invitados que vienen desde landing pages.

---

### 1.3. ⚠️ EntryOptionsModal (COMENTADO/ELIMINADO)

**Ubicación:** `src/components/auth/EntryOptionsModal.jsx`  
**Estado:** `NO ACTIVO - COMENTADO`  
**Uso:** Eliminado para simplificar flujo

#### Razón de eliminación:
```javascript
// ⚠️ COMPONENTE COMENTADO - Ya no se usa
// Se eliminó para simplificar el flujo de entrada: ahora se usa entrada directa como invitado
// (similar a los modales de España/Argentina que tienen un solo modal con nickname)
```

#### Exportación:
```javascript
export const EntryOptionsModal = () => null; // Componente vacío
```

#### Dónde estaba referenciado (ahora comentado):
- `src/pages/GlobalLandingPage.jsx` (líneas 991-993, comentado)
- `src/components/layout/Header.jsx` (líneas 243-245, comentado)

---

### 1.4. ✅ RegistrationRequiredModal

**Ubicación:** `src/components/auth/RegistrationRequiredModal.jsx`  
**Estado:** `ACTIVO - AUXILIAR`  
**Uso:** Modal informativo cuando se requiere registro para funciones premium

#### Características:
- **No es modal de entrada:** Es modal informativo
- **Auto-cierre:** Se cierra automáticamente después de 5 segundos
- **Funciones personalizadas:** Muestra mensajes según función bloqueada (favoritos, chat privado, etc.)

#### Funcionamiento:

```javascript
// Auto-cierre después de 5 segundos
useEffect(() => {
  if (open) {
    autoCloseTimeoutRef.current = setTimeout(() => {
      handleDialogClose();
    }, 5000);
  }
}, [open]);

// Mensajes personalizados
const featureMessages = {
  'favoritos': { title: '...', description: '...' },
  'chat privado': { title: '...', description: '...' },
  // etc.
};
```

#### Dónde se usa:
- `src/pages/ChatPage.jsx` (línea 35, import)
- Se muestra cuando usuario invitado intenta usar funciones premium

---

### 1.5. ✅ QuickSignupModal

**Ubicación:** `src/components/auth/QuickSignupModal.jsx`  
**Estado:** `ACTIVO - REGISTRO`  
**Uso:** Modal de registro rápido en 3 pasos

#### Características:
- **3 pasos:** Email/Password → Username → Confirmación
- **Validación en tiempo real:** Verifica disponibilidad de username
- **No es para invitados:** Es para registro completo
- **Integración:** Usa `register()` de AuthContext

#### Funcionamiento:
```
Paso 1: Email y Contraseña
  ↓
Paso 2: Nombre de usuario (con validación en tiempo real)
  ↓
Paso 3: Confirmación y creación de cuenta
  ↓
Redirección a redirectTo
```

---

## 2️⃣ COMPONENTES INLINE (NO MODALES)

### 2.1. ✅ InlineGuestEntry

**Ubicación:** `src/pages/GlobalLandingPage.jsx` (líneas 33-185)  
**Estado:** `ACTIVO - PRINCIPAL`  
**Uso:** Formulario inline en GlobalLandingPage (no es modal)

#### Características:
- **No es modal:** Es componente inline dentro de la landing page
- **Campos:**
  - Nickname input
  - Checkbox "Acepto que soy mayor de 18 años"
  - Desplegable de reglas
- **Avatar:** Aleatorio (10 opciones)
- **Validación:** Nickname + checkbox de términos

#### Funcionamiento:

```javascript
const handleSubmit = async (e) => {
  // Validar nickname
  if (!nickname.trim() || nickname.trim().length < 3) {
    setError('Nickname inválido');
    return;
  }
  
  // Validar términos
  if (!acceptedTerms) {
    setError('Debes aceptar que eres mayor de 18 años');
    return;
  }
  
  // Avatar aleatorio
  const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  
  // Esperar autenticación ANTES de navegar (diferente a GuestUsernameModal)
  await signInAsGuest(nickname.trim(), randomAvatar);
  navigate(`/chat/${chatRoomId}`, { replace: true });
};
```

#### Diferencias clave vs GuestUsernameModal:
1. **No es modal:** Está embebido en la página
2. **No tiene "Mantener sesión":** No guarda persistencia
3. **Navegación NO optimista:** Espera `signInAsGuest()` antes de navegar
4. **Tiene checkbox de términos:** Requiere aceptación explícita

#### Dónde se usa:
- `src/pages/GlobalLandingPage.jsx` (línea 496)

---

### 2.2. ✅ Formulario Inline en LandingPage

**Ubicación:** `src/pages/LandingPage.jsx` (líneas 135-170)  
**Estado:** `ACTIVO`  
**Uso:** Formulario directo en landing principal

#### Características:
- **No es modal:** Input y botón directamente en la página
- **Campos:** Solo nickname
- **Avatar:** Aleatorio
- **Navegación:** Espera autenticación antes de navegar

#### Funcionamiento:
Similar a `InlineGuestEntry` pero más simple (sin checkbox de términos).

---

### 2.3. ✅ Formulario en ChatLandingPage

**Ubicación:** `src/components/chat/ChatLandingPage.jsx`  
**Estado:** `ACTIVO - PERO REDIRIGE`  
**Uso:** Landing page completa para salas específicas

#### Características:
- **NO tiene formulario inline:** Solo tiene botones que redirigen
- **Botón principal:** `handleJoinChat()` → `navigate('/auth?redirect=/chat/${roomSlug}&mode=guest')`
- **Botón secundario:** `handleSignup()` → `navigate('/auth?redirect=/chat/${roomSlug}')`

#### ⚠️ IMPORTANTE:
`ChatLandingPage` **NO tiene formulario de entrada inline**. Solo muestra una landing page con botones que redirigen a `/auth`. El formulario real está en `AuthPage.jsx`.

---

## 3️⃣ PERSISTENCIA ENTRE MODALES

### 3.1. Sistema de Persistencia Principal: `guestIdentity.js`

**Ubicación:** `src/utils/guestIdentity.js` (304 líneas)

#### Funciones clave:

```javascript
// Verificar si existe identidad
hasGuestIdentity() → boolean

// Crear nueva identidad (UUID v4)
createGuestIdentity() → { guestId: string, nombre: string, avatar: string }

// Obtener identidad guardada
getGuestIdentity() → { guestId, nombre, avatar } | null

// Actualizar nombre manteniendo guestId
updateGuestName(newName) → void

// Actualizar avatar manteniendo guestId
updateGuestAvatar(newAvatar) → void

// Guardar datos temporales
saveTempGuestData({ nombre, avatar }) → void

// Vincular guestId con Firebase UID
linkGuestToFirebase(guestId, firebaseUid) → void
```

#### Almacenamiento:

1. **localStorage keys:**
   - `guest_identity` → `{ guestId, nombre, avatar, createdAt }`
   - `guest_data_${username}` → Datos temporales del guest
   - `guest_session_saved` → Sesión persistente (si `keepSession = true`)
   - `age_verified_${user.id}` → Verificación de edad
   - `age_verified_${username}` → Verificación de edad por username

2. **sessionStorage keys:**
   - `age_verified_${username}` → Verificación temporal de edad
   - `rules_accepted_${username}` → Aceptación temporal de reglas
   - `auth_in_progress` → Flag para prevenir loops de redirección

---

### 3.2. Flujo de Persistencia Completo

#### Escenario 1: Usuario nuevo sin sesión guardada

```
1. Usuario visita /landing o /chat/principal
   ↓
2. GlobalLandingPage se muestra con InlineGuestEntry
   ↓
3. Usuario ingresa nickname → Click "Entrar"
   ↓
4. signInAsGuest(nickname, avatar, keepSession=false)
   ↓
5. Si keepSession=true → localStorage.setItem('guest_session_saved', {...})
   ↓
6. Firebase crea usuario anónimo
   ↓
7. linkGuestToFirebase(guestId, firebaseUid)
   ↓
8. localStorage.setItem('age_verified_${uid}', '18')
   ↓
9. Usuario navega a /chat/principal
```

#### Escenario 2: Usuario con sesión guardada (keepSession=true)

```
1. Usuario visita cualquier página
   ↓
2. AuthContext.onAuthStateChanged detecta que no hay usuario
   ↓
3. localStorage.getItem('guest_session_saved') → Existe
   ↓
4. signInAsGuest(savedSession.username, savedSession.avatar, false)
   ↓
5. Usuario se autentica automáticamente sin modales
   ↓
6. Navega directamente al chat
```

#### Escenario 3: Usuario intenta abrir GuestUsernameModal con identidad existente

```
1. Usuario hace click en botón que abre GuestUsernameModal
   ↓
2. useEffect en GuestUsernameModal detecta: hasGuestIdentity() === true
   ↓
3. Modal NO se abre, onClose() se llama inmediatamente
   ↓
4. navigate('/chat/principal') automáticamente
   ↓
5. Usuario entra directamente al chat sin ver modal
```

---

### 3.3. Diferenciación entre Flujos

#### Flujo A: GlobalLandingPage (Principal)

```
Ruta: / o /landing
Componente: GlobalLandingPage
Formulario: InlineGuestEntry (inline, no modal)
Campos: Nickname + Checkbox términos
Avatar: Aleatorio
Persistencia: NO guarda keepSession por defecto
Navegación: Espera autenticación antes de navegar
```

#### Flujo B: GuestUsernameModal (Desde Header/Lobby)

```
Trigger: Botón en Header o LobbyPage
Componente: GuestUsernameModal (modal)
Campos: Nickname + Checkbox "Mantener sesión" (default true)
Avatar: Aleatorio
Persistencia: SÍ guarda keepSession si está marcado
Navegación: Optimista (navega antes de Firebase)
Auto-detección: Si tiene identidad guardada, NO muestra modal
```

#### Flujo C: ChatLandingPage (Salas específicas)

```
Ruta: /chat/{roomSlug} (sin usuario)
Componente: ChatLandingPage
Formulario: NO tiene formulario, solo botones
Acción: Redirige a /auth?redirect=/chat/{roomSlug}&mode=guest
Resultado: Usuario ve AuthPage, luego vuelve a ChatPage
```

#### Flujo D: AgeVerificationModal (ChatPage)

```
Trigger: Usuario anónimo en ChatPage sin edad verificada
Componente: AgeVerificationModal (modal)
Campos: Edad + Username + Avatar (selección) + Checkbox mantener sesión
Estado: ⚠️ ACTUALMENTE AUTO-VERIFICADO (no se muestra)
Persistencia: Guarda edad en localStorage
```

---

## 4️⃣ ANÁLISIS DE CONFLICTOS Y PROBLEMAS POTENCIALES

### 4.1. ⚠️ Conflicto: Múltiples Formularios de Entrada

**Problema:** Existen 3+ formas diferentes de entrar como invitado:
1. `InlineGuestEntry` en GlobalLandingPage
2. `GuestUsernameModal` en Header/Lobby
3. `ChatLandingPage` que redirige a AuthPage
4. Formularios inline en landing pages específicas (SantiagoLandingPage, etc.)

**Riesgo:** Experiencia inconsistente, diferentes validaciones, diferentes persistencia.

### 4.2. ⚠️ Conflicto: Persistencia Inconsistente

**Problema:**
- `InlineGuestEntry` NO tiene checkbox "Mantener sesión"
- `GuestUsernameModal` SÍ tiene checkbox "Mantener sesión" (default true)
- `AgeVerificationModal` tiene checkbox pero NO se muestra para invitados

**Riesgo:** Usuario puede perder sesión dependiendo de qué formulario use.

### 4.3. ⚠️ Conflicto: Navegación Optimista vs Espera

**Problema:**
- `GuestUsernameModal`: Navegación optimista (antes de Firebase)
- `InlineGuestEntry`: Espera autenticación antes de navegar
- `LandingPage`: Espera autenticación antes de navegar

**Riesgo:** Diferentes tiempos de carga, posible estado inconsistente.

### 4.4. ⚠️ Conflicto: Auto-verificación de Edad

**Problema:**
- `AgeVerificationModal` existe pero NO se muestra para invitados
- ChatPage auto-verifica edad para invitados (línea 467-472)
- Usuario nunca ve el modal de verificación de edad

**Riesgo:** Si se requiere verificación de edad real, no funciona para invitados.

---

## 5️⃣ LANDING PAGES CON FORMULARIOS INLINE

### 5.1. GlobalLandingPage
- **Formulario:** `InlineGuestEntry` (inline, no modal)
- **Campos:** Nickname + Checkbox términos
- **Avatar:** Aleatorio
- **Persistencia:** No

### 5.2. LandingPage
- **Formulario:** Input directo en página
- **Campos:** Solo nickname
- **Avatar:** Aleatorio
- **Persistencia:** No

### 5.3. SantiagoLandingPage, GamingLandingPage, Mas30LandingPage
- **Formulario:** `GuestUsernameModal` (modal, no inline)
- **Campos:** Nickname + Checkbox mantener sesión
- **Avatar:** Aleatorio
- **Persistencia:** Sí (si checkbox marcado)

### 5.4. ChatLandingPage
- **Formulario:** NO tiene formulario
- **Acción:** Redirige a `/auth`

### 5.5. SpainLandingPage (Ejemplo)
- **Formulario:** Inline completo (edad, username, avatar, reglas)
- **Campos:** Nickname + Edad + Avatar (selección) + Checkbox reglas
- **Persistencia:** Guarda en sessionStorage

---

## 6️⃣ RESUMEN DE PERSISTENCIA POR COMPONENTE

| Componente | keepSession | localStorage | sessionStorage | Auto-restauración |
|------------|-------------|--------------|----------------|-------------------|
| GuestUsernameModal | ✅ Sí (default true) | ✅ guest_session_saved | ❌ No | ✅ Sí (hasGuestIdentity) |
| AgeVerificationModal | ✅ Sí (default false) | ✅ age_verified_{uid} | ✅ age_verified_{username} | ❌ No |
| InlineGuestEntry | ❌ No | ❌ No | ❌ No | ❌ No |
| LandingPage | ❌ No | ❌ No | ❌ No | ❌ No |
| SantiagoLandingPage | ✅ Sí (GuestUsernameModal) | ✅ Sí | ❌ No | ✅ Sí |
| ChatLandingPage | ❌ No (redirige) | ❌ No | ❌ No | ❌ No |

---

## 7️⃣ RECOMENDACIONES

### 7.1. Unificar Flujo de Entrada
- **Eliminar:** Múltiples formularios inline
- **Consolidar:** Un solo formulario principal (GuestUsernameModal o InlineGuestEntry)
- **Usar:** GuestUsernameModal como estándar (tiene mejor persistencia)

### 7.2. Unificar Persistencia
- **Agregar:** Checkbox "Mantener sesión" a InlineGuestEntry
- **Estandarizar:** Mismo comportamiento de persistencia en todos los formularios
- **Documentar:** Claramente qué se guarda y dónde

### 7.3. Eliminar AgeVerificationModal para Invitados
- **Actual:** No se muestra (auto-verificado)
- **Recomendación:** Eliminar código muerto o hacerlo funcional
- **Alternativa:** Mostrar solo para usuarios anónimos sin datos

### 7.4. Simplificar ChatLandingPage
- **Actual:** Redirige a /auth (crea fricción)
- **Recomendación:** Agregar formulario inline similar a GlobalLandingPage
- **Beneficio:** Menos redirecciones, mejor UX

---

## 8️⃣ FLUJOS DE ENTRADA DETALLADOS

### Flujo 1: Usuario Nuevo → GlobalLandingPage

```
1. Usuario visita /
   ↓
2. GlobalLandingPage se renderiza
   ↓
3. Usuario ve InlineGuestEntry (formulario inline)
   ↓
4. Usuario ingresa nickname + marca checkbox términos
   ↓
5. Click "ENTRAR AL CHAT"
   ↓
6. signInAsGuest(nickname, randomAvatar) → Espera
   ↓
7. Firebase crea usuario anónimo
   ↓
8. localStorage.setItem('age_verified_${uid}', '18')
   ↓
9. navigate('/chat/principal')
   ↓
10. ChatPage verifica edad → Auto-verificado (no muestra modal)
   ↓
11. Usuario está en chat
```

**Persistencia:** ❌ NO se guarda sesión (no hay checkbox keepSession)

---

### Flujo 2: Usuario Nuevo → GuestUsernameModal (Header/Lobby)

```
1. Usuario click en botón "Entrar" en Header o LobbyPage
   ↓
2. GuestUsernameModal se abre (modal)
   ↓
3. Verificación: hasGuestIdentity() → false (usuario nuevo)
   ↓
4. Modal se muestra normalmente
   ↓
5. Usuario ingresa nickname
   ↓
6. Checkbox "Mantener sesión" está marcado por defecto
   ↓
7. Click "Ir al Chat"
   ↓
8. saveTempGuestData({ nombre, avatar }) (si keepSession)
   ↓
9. localStorage.setItem('guest_session_saved', {...}) (si keepSession)
   ↓
10. onClose() + navigate('/chat/principal') → Navegación optimista
   ↓
11. signInAsGuest(nickname, avatar, keepSession) → Background
   ↓
12. Usuario está en chat mientras Firebase procesa
```

**Persistencia:** ✅ SÍ se guarda sesión (default true)

---

### Flujo 3: Usuario con Sesión Guardada → GuestUsernameModal

```
1. Usuario click en botón "Entrar"
   ↓
2. GuestUsernameModal intenta abrirse
   ↓
3. useEffect detecta: hasGuestIdentity() === true
   ↓
4. Modal NO se abre, onClose() se llama
   ↓
5. navigate('/chat/principal') automáticamente
   ↓
6. AuthContext.onAuthStateChanged detecta 'guest_session_saved'
   ↓
7. signInAsGuest(savedSession.username, savedSession.avatar, false)
   ↓
8. Usuario autenticado automáticamente
   ↓
9. Usuario está en chat sin ver ningún modal
```

**Persistencia:** ✅ Restaura sesión automáticamente

---

### Flujo 4: Usuario Accede Directamente a /chat/principal

```
1. Usuario visita /chat/principal sin sesión
   ↓
2. ChatPage se monta
   ↓
3. authLoading === true → Muestra loading
   ↓
4. authLoading === false, user === null
   ↓
5. ChatPage renderiza <ChatLandingPage roomSlug="principal" />
   ↓
6. ChatLandingPage muestra landing completa
   ↓
7. Usuario click "Entrar al chat gratis"
   ↓
8. navigate('/auth?redirect=/chat/principal&mode=guest')
   ↓
9. AuthPage se muestra (formulario de registro/login)
   ↓
10. Usuario debe usar formulario de AuthPage
   ↓
11. Después de auth → Redirige a /chat/principal
```

**Persistencia:** ❌ No hay persistencia en este flujo

**⚠️ PROBLEMA:** Este flujo crea fricción (ChatLandingPage → AuthPage → ChatPage)

---

## 9️⃣ TABLA COMPARATIVA FINAL

| Característica | GuestUsernameModal | InlineGuestEntry | AgeVerificationModal | ChatLandingPage |
|----------------|-------------------|------------------|---------------------|-----------------|
| **Tipo** | Modal | Inline | Modal | Landing Page |
| **Ubicación Principal** | Header/Lobby | GlobalLandingPage | ChatPage | /chat/{room} |
| **Nickname** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No (redirige) |
| **Edad** | ❌ No | ❌ No (checkbox) | ✅ Sí | ❌ No |
| **Avatar Selección** | ❌ No (aleatorio) | ❌ No (aleatorio) | ✅ Sí (4 opciones) | ❌ No |
| **Checkbox Mantener Sesión** | ✅ Sí (default true) | ❌ No | ✅ Sí (default false) | ❌ No |
| **Persistencia localStorage** | ✅ Sí | ❌ No | ✅ Sí (edad) | ❌ No |
| **Auto-restauración** | ✅ Sí | ❌ No | ❌ No | ❌ No |
| **Navegación** | Optimista | Espera auth | Espera auth | Redirige |
| **Se muestra actualmente** | ✅ Sí | ✅ Sí | ❌ No (auto-verificado) | ✅ Sí |

---

## 🔟 CONCLUSIÓN

### Estado Actual:
- ✅ **GuestUsernameModal** es el modal más completo y funcional
- ✅ **Persistencia funciona** correctamente cuando se usa GuestUsernameModal
- ⚠️ **InlineGuestEntry** no tiene persistencia (problema)
- ⚠️ **Múltiples flujos** crean confusión e inconsistencias
- ⚠️ **ChatLandingPage** crea fricción (redirige a AuthPage)

### Prioridades:
1. **CRÍTICO:** Agregar persistencia a InlineGuestEntry (checkbox "Mantener sesión")
2. **ALTO:** Unificar flujos de entrada (usar un solo formulario estándar)
3. **MEDIO:** Eliminar o activar AgeVerificationModal para invitados
4. **BAJO:** Simplificar ChatLandingPage (agregar formulario inline)

---

**Fin del documento**

