# 🔧 FIX: Error de Login + CORS de OpenAI API

**Fecha:** 2026-01-05
**Autor:** Sistema de desarrollo
**Estado:** ✅ COMPLETADO

---

## 📋 Problemas Identificados

### 🔴 **PROBLEMA 1: Error de Login - `auth/invalid-credential`**

#### Síntoma
Usuario reporta: "no puedo entrar a mi cuenta"

Error en consola:
```
auth/invalid-credential
at signInWithEmailAndPassword (index-59210f9d.js:530:481)
```

#### Causa
El error `auth/invalid-credential` ocurre cuando:
1. El **email NO existe** en Firebase Auth
2. La **contraseña es incorrecta**
3. La **cuenta fue eliminada** o deshabilitada
4. Formato de credenciales inválido

#### Ubicación del Error
- **Archivo:** `src/contexts/AuthContext.jsx`
- **Función:** `login` (línea 284)
- **Código:**
  ```javascript
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  ```

---

### 🔴 **PROBLEMA 2: Error CORS - OpenAI API Bloqueada**

#### Síntoma
Errores en consola:
```
Access to fetch at 'https://api.openai.com/v1/chat/completions'
from origin 'https://chactivo.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST https://api.openai.com/v1/chat/completions net::ERR_FAILED 401 (Unauthorized)
```

#### Causa Raíz
**OpenAI NO puede llamarse directamente desde el frontend** porque:

1. **CORS bloqueado por OpenAI**
   - OpenAI NO permite peticiones desde navegadores
   - Solo permite llamadas desde servidores (backends)
   - Política de seguridad de OpenAI

2. **API Key expuesta en frontend**
   - `.env` tiene la API key comentada (línea 33)
   - Aunque esté activa, NUNCA debe estar en frontend
   - **RIESGO:** Usuarios pueden robar tu API key desde DevTools
   - **RIESGO:** Gastar tu crédito de OpenAI sin tu permiso

3. **Error 401 Unauthorized**
   - La API key no es válida (comentada o incorrecta)
   - OpenAI rechaza la petición

#### Ubicación del Error
**Servicios afectados:**
1. `src/services/companionAIService.js` (línea 11-20)
2. `src/services/moderationService.js` (línea 5-17)
3. `src/services/multiProviderAIConversation.js` (desactivado)
4. `src/services/openAIBotService.js`

**Evidencia en `.env`:**
```bash
# ❌ API key comentada (línea 33)
# VITE_OPENAI_API_KEY=sk-proj-...
```

---

## ✅ Soluciones Implementadas

### **1. Fix Error de Login - Mensaje Mejorado**

**Archivo:** `src/contexts/AuthContext.jsx`

**Cambio:**
```javascript
// ✅ AGREGADO: Manejo específico de auth/invalid-credential
case 'auth/invalid-credential':
  errorMessage = "Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente";
  break;
```

**Ubicación:** Línea 339-341

**Resultado:**
- ✅ Mensaje claro para el usuario
- ✅ Indica exactamente qué hacer
- ✅ No expone información sensible (no dice si el email existe o no)

---

### **2. Fix CORS OpenAI - Desactivación Completa en Frontend**

#### 2.1. `companionAIService.js`

**Archivo:** `src/services/companionAIService.js`

**Cambio:**
```javascript
// ✅ DESACTIVADO (05/01/2026): OpenAI NO puede llamarse desde frontend
// Motivo: CORS bloqueado + API key expuesta = riesgo de seguridad
// TODO: Mover a Cloud Functions cuando se reactive
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const isOpenAIAvailable = false; // ← FORZADO A FALSE

// ❌ DESACTIVADO: No crear instancia de OpenAI desde frontend
const openai = null;
```

**Ubicación:** Líneas 13-20

**Comportamiento:**
- ✅ NO intenta llamar a OpenAI
- ✅ Usa mensajes de fallback predefinidos
- ✅ NO hay errores CORS
- ✅ Función `generateCompanionMessage` retorna fallback automáticamente

**Mensajes de fallback:**
```javascript
const FALLBACK_MESSAGES = {
  firstMessageHelp: "Si quieres, puedo sugerirte un primer mensaje 😊",
  passiveReader: "Eres anónimo, puedes participar cuando quieras",
  generalHelp: "Estoy aquí para ayudarte a romper el hielo",
  suggestFirstMessage: "1. Hola wn, qué onda?\n2. Alguien de Santiago?\n3. Toy en Provi, 28"
};
```

#### 2.2. `moderationService.js`

**Archivo:** `src/services/moderationService.js`

**Cambio:**
```javascript
// ✅ DESACTIVADO (05/01/2026): OpenAI NO puede llamarse desde frontend
// Motivo: CORS bloqueado + API key expuesta = riesgo de seguridad
// La moderación ahora se hace solo en antiSpamService.js (palabras prohibidas)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const isOpenAIAvailable = false; // ← FORZADO A FALSE
```

**Ubicación:** Líneas 5-9

**Comportamiento:**
- ✅ NO intenta moderar con OpenAI
- ✅ Retorna `{ safe: true }` por defecto
- ✅ La moderación se hace solo en `antiSpamService.js` (palabras prohibidas)
- ✅ NO hay errores CORS

#### 2.3. `multiProviderAIConversation.js`

**Estado:** Ya estaba desactivado

```javascript
// ⚠️⚠️⚠️ DESACTIVACIÓN GLOBAL DEL SISTEMA DE IA ⚠️⚠️⚠️
const AI_SYSTEM_ENABLED = false; // ← Ya desactivado
```

**Línea:** 42

---

## 📊 Antes vs Ahora

### ❌ **ANTES**

| Problema | Síntoma |
|----------|---------|
| Login con credenciales incorrectas | Error genérico sin mensaje claro |
| Companion AI intenta llamar OpenAI | CORS error + 401 Unauthorized |
| Moderación intenta llamar OpenAI | CORS error + 401 Unauthorized |
| Consola del navegador | Inundada de errores CORS rojos |

**Experiencia del usuario:**
- ❌ No sabe por qué no puede entrar
- ❌ Ve errores rojos en consola (si abre DevTools)
- ❌ Puede pensar que el sitio está roto

---

### ✅ **AHORA**

| Problema | Solución |
|----------|----------|
| Login con credenciales incorrectas | Mensaje claro: "Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente" |
| Companion AI | Usa mensajes de fallback, NO intenta llamar OpenAI |
| Moderación | Retorna `{ safe: true }`, moderación solo por palabras prohibidas |
| Consola del navegador | ✅ SIN errores CORS de OpenAI |

**Experiencia del usuario:**
- ✅ Mensaje claro cuando falla el login
- ✅ Companion AI funciona con fallbacks
- ✅ Sin errores visibles en consola

---

## 🔐 Solución Correcta para OpenAI (Futuro)

### **❌ NUNCA hacer esto:**
```javascript
// ❌ MAL: Llamar OpenAI desde frontend
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // ← PELIGROSO!
});
```

**Problemas:**
1. ❌ CORS bloqueado por OpenAI
2. ❌ API key visible en DevTools
3. ❌ Usuarios pueden robar tu crédito
4. ❌ No puedes controlar el uso

---

### **✅ Solución correcta:**

#### **Opción 1: Cloud Functions (Firebase)**

1. Crear Cloud Function:

```javascript
// functions/src/index.js
const functions = require('firebase-functions');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: functions.config().openai.key // ← Segura en servidor
});
const openai = new OpenAIApi(configuration);

exports.generateCompanionMessage = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const { scenario, context: msgContext } = data;

  // Llamar OpenAI desde servidor
  const response = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [/* ... */],
  });

  return response.data.choices[0].message.content;
});
```

2. Llamar desde frontend:

```javascript
// frontend: src/services/companionAIService.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const generateMessage = httpsCallable(functions, 'generateCompanionMessage');

export const generateCompanionMessage = async (scenario, context) => {
  try {
    const result = await generateMessage({ scenario, context });
    return result.data;
  } catch (error) {
    console.error('Error:', error);
    return FALLBACK_MESSAGES[scenario];
  }
};
```

**Ventajas:**
- ✅ API key segura en servidor
- ✅ Sin CORS (llamada a tu propio backend)
- ✅ Control total del uso
- ✅ Puedes agregar rate limiting
- ✅ Puedes loguear el uso

---

#### **Opción 2: Backend Propio (Express/Node)**

```javascript
// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY // ← Variable de entorno
}));

router.post('/generate-message', async (req, res) => {
  try {
    const { scenario, context } = req.body;

    // Verificar autenticación con token JWT/Firebase
    // ...

    const response = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [/* ... */],
    });

    res.json({ message: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: 'Error generando mensaje' });
  }
});

module.exports = router;
```

---

#### **Opción 3: Qwen API (Ya Configurada)**

Tu `.env` ya tiene Qwen configurado:
```bash
VITE_QWEN_API_KEY=


**Verificar si Qwen permite CORS desde frontend** o si también necesita backend.

---

## 🧪 Cómo Verificar que Está Solucionado

### **1. Error de Login**

1. Ir a página de login
2. Intentar entrar con email/contraseña incorrectos
3. **Verificar que aparece:**
   ```
   Error de autenticación
   Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente
   ```

---

### **2. Error CORS OpenAI**

1. Abrir página principal en incógnito
2. Abrir `DevTools → Console`
3. Esperar 30 segundos (para que Companion AI intente activarse)
4. **Verificar que NO aparece:**
   ```
   Access to fetch at 'https://api.openai.com/v1/chat/completions'
   has been blocked by CORS policy
   ```

5. **Verificar que SÍ aparece:**
   ```
   ⚠️ [COMPANION AI] OpenAI no disponible, usando fallback: "..."
   ```

---

## 📁 Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `src/contexts/AuthContext.jsx` | Agregado manejo de `auth/invalid-credential` | 339-341 |
| `src/services/companionAIService.js` | Desactivado OpenAI, forzado fallback | 13-20 |
| `src/services/moderationService.js` | Desactivado OpenAI, retorna `{ safe: true }` | 5-9 |
| `docs/fix-login-cors-errors.md` | ✅ Documentación completa creada | - |

---

## 🚨 Notas Importantes

### **Para el Usuario que No Puede Entrar:**

Si el usuario sigue sin poder entrar después de este fix, las causas posibles son:

1. **Credenciales incorrectas**
   - Verificar que el email está bien escrito
   - Verificar que la contraseña es correcta
   - Probar "Olvidé mi contraseña" para resetear

2. **Cuenta no existe**
   - Verificar si se registró con otro método (Google, etc.)
   - Crear una cuenta nueva si no existe

3. **Cuenta baneada/deshabilitada**
   - Verificar en Firebase Console → Authentication
   - Verificar en Firestore → `sanctions` collection
   - Contactar al administrador

4. **Problema de Firebase Auth**
   - Verificar configuración en Firebase Console
   - Verificar que Email/Password provider está habilitado
   - Verificar que el proyecto de Firebase está activo

---

### **IMPORTANTE: API Keys**

**NUNCA** subir las API keys a GitHub:
```bash
# ❌ MAL
VITE_OPENAI_API_KEY=

# ✅ BIEN
# VITE_OPENAI_API_KEY=TU_API_KEY_AQUI
```

**Siempre** usar `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 🔄 Próximos Pasos

1. **Verificar si el usuario puede entrar ahora**
   - Si sigue sin poder, investigar la cuenta específica

2. **Decidir si reactivar OpenAI**
   - Si sí: Implementar Cloud Functions (Opción 1)
   - Si no: Usar solo fallbacks (actual)

3. **Considerar alternativas**
   - Qwen API (ya configurada)
   - Gemini API (disponible)
   - Otros LLMs con CORS permitido

---

**✅ FIX COMPLETADO - 2026-01-05**

**Resultado:**
- ✅ Mensaje de error de login mejorado
- ✅ Sin errores CORS de OpenAI
- ✅ Companion AI funciona con fallbacks
- ✅ Moderación funciona sin OpenAI
