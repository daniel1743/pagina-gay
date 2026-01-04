# 🎭 SISTEMA DE IDENTIDAD GENÉRICA PARA ADMIN

**Fecha:** 04 de Enero 2026
**Propósito:** Permite al admin participar en conversaciones como usuario genérico

---

## 🎯 FUNCIONALIDAD

El admin puede cambiar temporalmente su identidad a un nombre genérico y avatar simple para:
- **Participar en conversaciones** sin ser identificado como admin
- **Probar la experiencia del usuario** de primera mano
- **Moderar de forma encubierta** cuando sea necesario
- **Interactuar naturalmente** con los usuarios

### ✅ Mantiene permisos de admin:
- Sigue siendo admin en el sistema
- Puede acceder al panel admin cuando quiera
- Todos sus permisos se conservan
- Solo cambia el nombre y avatar visibles en el chat

---

## 🔧 CÓMO FUNCIONA

### 1. Cambiar a Identidad Genérica

**Ubicación:** Panel Admin → Header (arriba a la derecha)

**Botón:** "Cambiar a Usuario Genérico"

**Al hacer click:**
1. ✅ Guarda tu identidad admin original en localStorage
2. ✅ Genera un nombre genérico aleatorio: `Usuario1234` (número aleatorio 1000-9999)
3. ✅ Asigna un avatar simple pixel-art
4. ✅ Actualiza tu perfil visualmente (solo en UI)
5. ✅ Muestra toast: "Ahora apareces como Usuario1234 en el chat"

**Ejemplo:**
```
ANTES: Admin ← Tu nombre real
DESPUÉS: Usuario7482 ← Nombre genérico
```

---

### 2. Restaurar Identidad Admin

**Ubicación:** Botón flotante (abajo a la derecha de la pantalla)

**Solo visible cuando:**
- Estás usando identidad genérica

**Botón Flotante muestra:**
```
┌────────────────────────────────┐
│  🎭 Apareces como: Usuario7482 │
└────────────────────────────────┘
        ↓
┌─────────────────────────┐
│   🛡️ Volver a          │
│   Identidad Admin       │
└─────────────────────────┘
```

**Al hacer click:**
1. ✅ Restaura tu nombre admin original
2. ✅ Restaura tu avatar original
3. ✅ Limpia datos temporales de localStorage
4. ✅ Muestra toast: "Has vuelto a ser [NombreAdmin]"

---

## 📊 FLUJO COMPLETO

```
ADMIN EN PANEL ADMIN
     ↓
Click "Cambiar a Usuario Genérico"
     ↓
✅ Identidad guardada: { username: "Admin", avatar: "..." }
✅ Identidad genérica aplicada: { username: "Usuario7482", avatar: "..." }
✅ Toast: "Ahora apareces como Usuario7482"
     ↓
ADMIN CHATEA COMO "Usuario7482"
(Los usuarios NO saben que es admin)
     ↓
Aparece botón flotante: "Volver a Identidad Admin"
     ↓
Click en botón flotante
     ↓
✅ Identidad admin restaurada
✅ Toast: "Has vuelto a ser Admin"
     ↓
ADMIN CON SU IDENTIDAD ORIGINAL
```

---

## 🗄️ PERSISTENCIA (localStorage)

### Mientras usa identidad genérica:

**`admin_original_identity`:**
```json
{
  "id": "abc123",
  "username": "Admin",
  "avatar": "https://...",
  "isPremium": true,
  "verified": true,
  "isAdmin": true,
  "email": "admin@example.com",
  "timestamp": 1704394800000
}
```

**`admin_generic_identity`:**
```json
{
  "username": "Usuario7482",
  "avatar": "https://api.dicebear.com/7.x/pixel-art/svg?seed=generic7482",
  "timestamp": 1704394800000
}
```

**Flag en user:**
```javascript
user._isUsingGenericIdentity = true
```

### Al restaurar identidad:
- ✅ Ambas claves de localStorage se eliminan
- ✅ Flag `_isUsingGenericIdentity` = false

---

## 🎨 COMPONENTES CREADOS

### 1. `RestoreIdentityButton.jsx`
**Ubicación:** `src/components/admin/RestoreIdentityButton.jsx`

**Descripción:** Botón flotante que aparece solo cuando el admin está usando identidad genérica

**Props:** Ninguna (usa AuthContext directamente)

**Características:**
- Animación de entrada/salida (framer-motion)
- Muestra nombre genérico actual
- Solo visible con `user._isUsingGenericIdentity === true`
- Llama a `restoreAdminIdentity()` al click

---

### 2. Funciones en `AuthContext.jsx`

#### `switchToGenericIdentity()`
**Descripción:** Cambia a identidad genérica

**Retorna:** `true` si exitoso, `false` si falla

**Lógica:**
```javascript
1. Verificar que user existe
2. Guardar identidad original en localStorage (si no existe)
3. Generar nombre aleatorio: Usuario + (1000-9999)
4. Generar avatar simple: pixel-art con seed
5. Actualizar user con:
   - username: genericUsername
   - avatar: genericAvatar
   - _isUsingGenericIdentity: true
6. Guardar identidad genérica en localStorage
7. Mostrar toast confirmación
```

#### `restoreAdminIdentity()`
**Descripción:** Restaura identidad admin original

**Retorna:** `true` si exitoso, `false` si falla

**Lógica:**
```javascript
1. Verificar que user existe
2. Cargar identidad original desde localStorage
3. Restaurar:
   - username original
   - avatar original
   - _isUsingGenericIdentity: false
4. Limpiar localStorage (ambas claves)
5. Mostrar toast confirmación
```

---

## 🧪 CASOS DE USO

### Caso 1: Admin quiere participar en conversación sin revelar identidad

```
1. Admin entra al panel admin
2. Click "Cambiar a Usuario Genérico"
3. Va al chat (sala principal)
4. Aparece como "Usuario4521" ← NADIE sabe que es admin
5. Chatea normalmente con otros usuarios
6. Termina conversación
7. Click botón flotante "Volver a Identidad Admin"
8. Vuelve a ser "Admin"
```

### Caso 2: Admin quiere probar UX como usuario normal

```
1. Admin cambia a "Usuario8923"
2. Prueba:
   - Enviar mensajes
   - Recibir mensajes
   - Reacciones
   - Sistema anti-spam
   - Etc.
3. Detecta bug o problema
4. Restaura identidad admin
5. Va al panel admin y arregla el problema
```

### Caso 3: Admin quiere moderar encubierto

```
1. Admin detecta usuario problemático
2. Cambia a identidad genérica
3. Interactúa con el usuario problemático
4. Observa comportamiento
5. Decide si aplicar sanción
6. Restaura identidad admin
7. Aplica sanción si es necesario
```

---

## ⚙️ CONFIGURACIÓN

### Nombres genéricos generados:
```javascript
const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
const genericUsername = `Usuario${randomNum}`;
```

**Posibles nombres:**
- Usuario1000, Usuario1001, ..., Usuario9999
- Total: 9000 combinaciones posibles

### Avatares genéricos:
```javascript
const genericAvatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=generic' + randomNum;
```

**Características:**
- Estilo: pixel-art (retro, simple)
- Seed único: generic1000 - generic9999
- Cada número tiene su propio avatar único

---

## 🎯 ARCHIVOS MODIFICADOS/CREADOS

### CREADOS:
1. **`src/components/admin/RestoreIdentityButton.jsx`** ✅
   - Botón flotante para restaurar identidad

2. **`src/components/admin/ChangeIdentityModal.jsx`** ✅
   - Modal (no usado, pero disponible para futuro)

3. **`CAMBIO-IDENTIDAD-ADMIN.md`** ✅
   - Esta documentación

### MODIFICADOS:
1. **`src/contexts/AuthContext.jsx`** ✅
   - Agregado: `switchToGenericIdentity()`
   - Agregado: `restoreAdminIdentity()`
   - Exportado en value

2. **`src/pages/AdminPage.jsx`** ✅
   - Importado: `RestoreIdentityButton`
   - Importado: `User` icon
   - Agregado: Botón "Cambiar a Usuario Genérico" en header
   - Agregado: `<RestoreIdentityButton />` componente

---

## 🔍 DEBUGGING

### Ver identidad actual:
```javascript
console.log('User:', user);
console.log('Es genérica:', user?._isUsingGenericIdentity);
```

### Ver localStorage:
```javascript
console.log('Original:', localStorage.getItem('admin_original_identity'));
console.log('Genérica:', localStorage.getItem('admin_generic_identity'));
```

### Verificar cambio:
```javascript
// En consola, después de cambiar a genérica:
console.log(user.username); // Debería mostrar "UsuarioXXXX"
console.log(user._isUsingGenericIdentity); // Debería ser true
```

---

## ✅ CHECKLIST DE FUNCIONALIDAD

- [x] Botón "Cambiar a Usuario Genérico" en AdminPage
- [x] Función `switchToGenericIdentity()` en AuthContext
- [x] Generación de nombre aleatorio (Usuario1000-9999)
- [x] Generación de avatar simple (pixel-art)
- [x] Guardar identidad original en localStorage
- [x] Aplicar identidad genérica al user
- [x] Toast de confirmación al cambiar
- [x] Botón flotante "Volver a Identidad Admin"
- [x] Solo visible cuando `_isUsingGenericIdentity === true`
- [x] Función `restoreAdminIdentity()` en AuthContext
- [x] Restaurar identidad original
- [x] Limpiar localStorage
- [x] Toast de confirmación al restaurar
- [x] Mantener permisos de admin durante todo el proceso

---

## 🎨 UI/UX

### Botón "Cambiar a Usuario Genérico":
- **Ubicación:** Panel Admin, header, arriba a la derecha
- **Color:** Gradiente púrpura-rosa
- **Icono:** User
- **Texto:** "Cambiar a Usuario Genérico"
- **Condición:** Solo visible si NO está usando identidad genérica

### Botón Flotante "Volver a Identidad Admin":
- **Ubicación:** Fixed, bottom-right (abajo a la derecha)
- **Color:** Gradiente púrpura-rosa
- **Icono:** ShieldCheck
- **Texto:** "Volver a Identidad Admin"
- **Info adicional:** Muestra nombre genérico actual
- **Condición:** Solo visible si SÍ está usando identidad genérica
- **Animación:** Entrada/salida suave (scale + opacity)

---

## 🚨 IMPORTANTE

### Lo que SÍ cambia:
- ✅ Nombre visible en el chat
- ✅ Avatar visible en el chat
- ✅ Cómo te ven otros usuarios

### Lo que NO cambia:
- ❌ Tus permisos de admin (se mantienen)
- ❌ Tu userId (sigue siendo el mismo)
- ❌ Tu acceso al panel admin
- ❌ Tus capacidades como administrador

**El admin SIEMPRE es admin, solo cambia su apariencia visual.**

---

## 💡 MEJORAS FUTURAS (Opcionales)

1. **Historial de identidades usadas:**
   - Guardar registro de identidades genéricas usadas
   - Ver cuándo y qué identidades se usaron

2. **Identidades predefinidas:**
   - Lista de nombres genéricos favoritos
   - Cambio rápido entre identidades guardadas

3. **Tiempo de uso:**
   - Mostrar cuánto tiempo llevas con identidad genérica
   - Alerta después de X tiempo

4. **Log de acciones:**
   - Registrar mensajes enviados con identidad genérica
   - Útil para auditoría

---

*Documento creado: 04/01/2026*
*Funcionalidad: Cambio de Identidad Admin*
*Estado: IMPLEMENTADO ✅*
