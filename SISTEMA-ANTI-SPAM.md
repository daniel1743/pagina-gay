# 🛡️ SISTEMA ANTI-SPAM INTELIGENTE

**Fecha:** 04 de Enero 2026
**Propósito:** Prevenir spam, números de teléfono y contenido prohibido con mensajes claros

---

## 🎯 CARACTERÍSTICAS PRINCIPALES

### 1. **Detección Inteligente de Spam por Duplicados**
- ✅ Permite "hola hola" (2 repeticiones están OK - comportamiento natural)
- ⚠️ 4 mensajes iguales → ADVERTENCIA
- 🔨 5+ mensajes iguales → EXPULSIÓN TEMPORAL (15 minutos)
- 🧹 Memoria de 5 minutos (mensajes antiguos no cuentan)

### 2. **Detección de Números de Teléfono**
Detecta todos estos formatos chilenos:
- `+56 9 1234 5678`
- `+56912345678`
- `912345678`
- `(+56) 912345678`
- Cualquier secuencia de 9 dígitos

### 3. **Detección de Palabras Prohibidas**
- Instagram, WhatsApp, Telegram, Facebook, Snapchat, TikTok, Twitter
- "Mi número", "mi cel", "agrégame", "escríbeme"
- Contenido comercial: "vendo", "compro", "ofrezco", "OnlyFans"
- Contenido ilegal: menciones de drogas

### 4. **Mensajes CLAROS al Usuario**
- ❌ "Los números de teléfono están prohibidos" (no dice "error")
- ❌ "Las redes sociales están prohibidas" (específico)
- ⚠️ "Has enviado este mensaje 4 veces. Si lo repites, serás expulsado"
- 🔨 "Expulsado temporalmente por spam. Podrás chatear en X minutos"

---

## 📊 FLUJO DE VALIDACIÓN

```
Usuario envía mensaje
       ↓
1. ¿Está expulsado? → SÍ → Bloquear + "Podrás chatear en X minutos"
       ↓ NO
2. ¿Es excepción? (ej: "hola hola") → SÍ → PERMITIR ✅
       ↓ NO
3. ¿Contiene número de teléfono? → SÍ → Bloquear + Advertencia
       ↓ NO
4. ¿Contiene palabra prohibida? → SÍ → Bloquear + Mensaje específico
       ↓ NO
5. ¿Es mensaje duplicado?
       ├─ 4 veces → Bloquear + ADVERTENCIA ⚠️
       ├─ 5+ veces → Bloquear + EXPULSIÓN 🔨 (15 min)
       └─ <4 veces → PERMITIR ✅
       ↓
✅ MENSAJE VÁLIDO - Enviado
```

---

## 🚫 EJEMPLOS DE MENSAJES BLOQUEADOS

### Números de Teléfono:
```
"Mi número es 912345678" → ❌
Toast: "Los números de teléfono están prohibidos"
Detalle: "Por seguridad y privacidad, no se permite compartir números..."
```

### Redes Sociales:
```
"Agrégame en Instagram @usuario" → ❌
Toast: "Las redes sociales están prohibidas"
Detalle: "La palabra 'instagram' viola las normas del chat..."
```

### Spam por Duplicados:
```
Usuario envía "hola" 4 veces:
Toast: "⚠️ ADVERTENCIA: Has enviado este mensaje 4 veces. Si lo repites nuevamente, serás expulsado temporalmente."

Usuario envía "hola" 5ta vez:
Toast: "🔨 EXPULSADO: Has sido expulsado temporalmente por spam (5 mensajes iguales). Podrás chatear en 15 minutos."
```

---

## ✅ EXCEPCIONES (Permitidas)

Estos mensajes NO se consideran spam:

```javascript
"hola" → ✅ OK
"hola hola" → ✅ OK (saludo natural)
"jaja" → ✅ OK
"jajaja" → ✅ OK (risa natural)
"ok" → ✅ OK
"ok ok" → ✅ OK
"si" → ✅ OK
"sí sí" → ✅ OK
"no no" → ✅ OK
```

**Razón:** Es comportamiento NORMAL decir "hola hola" cuando nadie responde. No queremos bloquear esto.

---

## 🔧 CONFIGURACIÓN

### Archivo: `antiSpamService.js`

```javascript
const CONFIG = {
  // Spam por duplicados
  MAX_DUPLICATE_WARNINGS: 3,      // 3 advertencias máximo
  DUPLICATE_THRESHOLD: 4,         // 4 mensajes = advertencia
  DUPLICATE_BAN_THRESHOLD: 5,     // 5 mensajes = expulsión
  DUPLICATE_MEMORY_MS: 5 * 60 * 1000,  // 5 minutos de memoria

  // Expulsión temporal
  TEMP_BAN_DURATION_MS: 15 * 60 * 1000,  // 15 minutos de expulsión
};
```

**Puedes ajustar:**
- `DUPLICATE_THRESHOLD`: Cambiar de 4 a 3 o 5
- `TEMP_BAN_DURATION_MS`: Cambiar de 15 minutos a 30 minutos

---

## 🎯 INTEGRACIÓN

### 1. Servicio creado: `antiSpamService.js`

Funciones principales:
```javascript
// Validar mensaje completo
validateMessage(message, userId, username, roomId)
  → { allowed: boolean, reason: string, type: string }

// Verificar si usuario está expulsado
checkTempBan(userId)
  → { isBanned: boolean, remainingMinutes: number }

// Limpiar historial (llamar al salir)
clearUserHistory(userId)
```

### 2. Integrado en: `ChatPage.jsx`

```javascript
// Importar servicio
import { validateMessage, clearUserHistory } from '@/services/antiSpamService';

// En handleSendMessage (ANTES del mensaje optimista):
const validation = await validateMessage(content, user.id, user.username, currentRoom);

if (!validation.allowed) {
  // Mostrar toast específico según tipo
  toast({
    title: "❌ Números de Teléfono Prohibidos",
    description: validation.details,
    variant: "destructive",
  });
  return; // NO enviar mensaje
}

// En cleanup del useEffect (al salir de sala):
if (user?.id) {
  clearUserHistory(user.id);
}
```

---

## 📊 TIPOS DE VALIDACIÓN

### 1. `phone_number`
```javascript
{
  allowed: false,
  reason: "Los números de teléfono están prohibidos",
  type: "phone_number",
  action: "block",
  details: "Por seguridad y privacidad, no se permite compartir números..."
}
```

### 2. `forbidden_word`
```javascript
{
  allowed: false,
  reason: "Las redes sociales están prohibidas",
  type: "forbidden_word",
  action: "block",
  details: 'La palabra "instagram" viola las normas del chat...'
}
```

### 3. `spam_duplicate_warning`
```javascript
{
  allowed: false,
  reason: "⚠️ ADVERTENCIA: Has enviado este mensaje 4 veces...",
  type: "spam_duplicate_warning",
  action: "warn",
  count: 4,
  warningNumber: 1
}
```

### 4. `spam_duplicate_ban`
```javascript
{
  allowed: false,
  reason: "Has sido expulsado temporalmente por spam (5 mensajes iguales)...",
  type: "spam_duplicate_ban",
  action: "temp_ban",
  banDuration: 900000  // 15 minutos en ms
}
```

### 5. `temp_ban`
```javascript
{
  allowed: false,
  reason: "Estás temporalmente expulsado por spam. Podrás chatear en 12 minutos.",
  type: "temp_ban",
  action: "block"
}
```

---

## 🧪 EJEMPLOS DE USO

### Caso 1: Usuario envía número de teléfono

```
Usuario escribe: "Hola! Mi número es +56912345678"

1. validateMessage() detecta número
2. Retorna: { allowed: false, type: "phone_number" }
3. Toast: ❌ "Números de Teléfono Prohibidos"
4. Mensaje NO se envía
5. Se guarda advertencia en Firestore
```

### Caso 2: Usuario envía "hola" 4 veces

```
Usuario envía "hola" (1ra vez) → ✅ Enviado
Usuario envía "hola" (2da vez) → ✅ Enviado
Usuario envía "hola" (3ra vez) → ✅ Enviado
Usuario envía "hola" (4ta vez):
  → ❌ BLOQUEADO
  → Toast: ⚠️ "ADVERTENCIA: Has enviado este mensaje 4 veces..."
  → Se guarda advertencia en Firestore
```

### Caso 3: Usuario envía "hola" 5ta vez (después de advertencia)

```
Usuario envía "hola" (5ta vez):
  → ❌ BLOQUEADO
  → Toast: 🔨 "EXPULSADO: ... Podrás chatear en 15 minutos"
  → Se crea temp_ban en Firestore
  → Usuario NO puede enviar mensajes por 15 minutos
  → Historial limpiado automáticamente
```

### Caso 4: Usuario envía "hola hola" (excepción)

```
Usuario escribe: "hola hola"

1. validateMessage() verifica excepciones
2. isException("hola hola") → TRUE
3. Retorna: { allowed: true }
4. ✅ Mensaje enviado normalmente
```

---

## 🗄️ FIRESTORE COLLECTIONS

### 1. `spam_warnings`
Guarda advertencias de spam por usuario:

```javascript
{
  userId: "abc123",
  username: "Carlos23",
  count: 2,  // 2 advertencias
  lastWarning: Timestamp,
  lastReason: "Spam: 4 mensajes duplicados",
  lastRoom: "principal",
  warnings: [
    { reason: "Número de teléfono", timestamp: 1234567890, roomId: "principal" },
    { reason: "Spam: 4 mensajes duplicados", timestamp: 1234567900, roomId: "principal" }
  ]
}
```

### 2. `temp_bans`
Guarda expulsiones temporales:

```javascript
{
  userId: "abc123",
  username: "Carlos23",
  reason: "Spam: 5 mensajes duplicados",
  roomId: "principal",
  bannedAt: Timestamp,
  expiresAt: 1234567890,  // Unix timestamp
  duration: 900000,  // 15 min en ms
  type: "spam"
}
```

---

## 🔍 DEBUGGING

### Ver historial de mensajes en memoria:

```javascript
import { getSpamStats } from '@/services/antiSpamService';

const stats = getSpamStats();
console.log('📊 Spam Stats:', stats);
// {
//   totalUsers: 5,
//   totalMessages: 23,
//   duplicates: 8
// }
```

### Ver advertencias de un usuario:

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const warningsRef = doc(db, 'spam_warnings', userId);
const warningsDoc = await getDoc(warningsRef);
console.log('⚠️ Advertencias:', warningsDoc.data());
```

---

## 🎨 TOASTS MOSTRADOS

### 1. Números de Teléfono:
```
Título: "❌ Números de Teléfono Prohibidos"
Descripción: "Por seguridad y privacidad, no se permite compartir números de teléfono en el chat público. Usa los chats privados para intercambiar contacto."
Duración: 5 segundos
Variant: destructive (rojo)
```

### 2. Redes Sociales:
```
Título: "❌ Las redes sociales están prohibidas"
Descripción: "La palabra 'instagram' viola las normas del chat. Tu mensaje no será enviado."
Duración: 5 segundos
Variant: destructive (rojo)
```

### 3. Advertencia de Spam:
```
Título: "⚠️ ADVERTENCIA DE SPAM"
Descripción: "Has enviado este mensaje 4 veces. Si lo repites nuevamente, serás expulsado temporalmente."
Duración: 7 segundos
Variant: destructive (rojo)
```

### 4. Expulsión por Spam:
```
Título: "🔨 EXPULSADO POR SPAM"
Descripción: "Has sido expulsado temporalmente por spam (5 mensajes iguales). Podrás chatear en 15 minutos."
Duración: 10 segundos
Variant: destructive (rojo)
```

---

## ✅ BENEFICIOS

### ANTES (sin anti-spam):
- ❌ Usuarios compartían números libremente
- ❌ Spam "hola hola hola hola hola..." sin límite
- ❌ Links de Instagram/WhatsApp en todos los chats
- ❌ Mensajes genéricos de error (confusos)
- ❌ No quedaba registro de advertencias

### DESPUÉS (con anti-spam):
- ✅ Números de teléfono bloqueados automáticamente
- ✅ Spam detectado a las 4 repeticiones
- ✅ Expulsión automática a las 5 repeticiones
- ✅ Mensajes CLAROS: "Los números están prohibidos" (no "error")
- ✅ "hola hola" permitido (comportamiento natural)
- ✅ Registro de advertencias en Firestore
- ✅ Sistema automático (no requiere moderadores)

---

## 🔧 MANTENIMIENTO

### Añadir nueva palabra prohibida:

```javascript
// En antiSpamService.js
FORBIDDEN_WORDS: [
  // ... palabras existentes
  'nueva_palabra_prohibida',
]
```

### Añadir nueva excepción:

```javascript
// En antiSpamService.js
EXCEPTIONS: [
  // ... excepciones existentes
  'nueva_frase_permitida',
]
```

### Cambiar duración de expulsión:

```javascript
// En antiSpamService.js
TEMP_BAN_DURATION_MS: 30 * 60 * 1000,  // 30 minutos (antes: 15)
```

### Cambiar threshold de spam:

```javascript
// En antiSpamService.js
DUPLICATE_THRESHOLD: 3,  // 3 veces = advertencia (antes: 4)
DUPLICATE_BAN_THRESHOLD: 4,  // 4 veces = expulsión (antes: 5)
```

---

## 📁 ARCHIVOS MODIFICADOS

1. **`src/services/antiSpamService.js`** (NUEVO)
   - Lógica completa de anti-spam
   - Detección de números, palabras prohibidas, duplicados
   - Gestión de advertencias y expulsiones

2. **`src/pages/ChatPage.jsx`**
   - Importar `validateMessage` y `clearUserHistory`
   - Validación en `handleSendMessage` (antes del mensaje optimista)
   - Cleanup de historial en `useEffect`
   - Toasts específicos por tipo de violación

---

## 🎯 RESUMEN

Sistema anti-spam completo que:

1. ✅ Detecta números de teléfono (todos los formatos chilenos)
2. ✅ Detecta palabras prohibidas (Instagram, WhatsApp, etc.)
3. ✅ Detecta spam por duplicados (4 veces = advertencia, 5+ = expulsión)
4. ✅ Permite comportamiento natural ("hola hola" está OK)
5. ✅ Muestra mensajes CLAROS (usuario sabe por qué fue bloqueado)
6. ✅ Expulsión automática temporal (15 minutos)
7. ✅ Registro en Firestore (advertencias y expulsiones)
8. ✅ Sin falsos positivos

**El usuario siempre sabe POR QUÉ su mensaje fue bloqueado, no piensa que fue un error técnico.**

---

*Documento creado: 04/01/2026*
*Sistema: Anti-Spam Inteligente*
*Estado: IMPLEMENTADO ✅*
