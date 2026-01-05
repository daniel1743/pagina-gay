# 🚨 Sistema de Logs de Expulsiones en F12

**Fecha:** 2026-01-05
**Prioridad:** P0 - Debugging Crítico
**Estado:** ✅ COMPLETADO

---

## 📋 Problema Original

**Solicitud del usuario:**
> "por favor por un script en codigo que diga en f12 porque el sistema expulsa personas motivo ya mismo integra eso"

**Necesidad:**
- Ver en la consola F12 (DevTools) el **motivo exacto** por el cual el sistema expulsa/bloquea usuarios
- Logs **MUY VISIBLES** con formato claro
- Información completa: usuario, motivo, tiempo, sala, mensaje bloqueado

---

## ✅ Solución Implementada

### **Logs Agregados en 2 Servicios:**

#### 1. **antiSpamService.js** (Sistema Anti-Spam Principal)
- ✅ Expulsión temporal aplicada
- ✅ Usuario expulsado intentando chatear
- ✅ Número de teléfono detectado
- ✅ Palabra prohibida detectada

#### 2. **rateLimitService.js** (Sistema de Rate Limiting)
- ✅ Usuario muteado (cache)
- ✅ Usuario muteado (Firestore)
- ✅ Mute aplicado por exceso de mensajes

---

## 📊 Tipos de Logs en F12

### 🔨 **1. EXPULSIÓN TEMPORAL APLICADA**

**Cuándo aparece:** Cuando el sistema expulsa a un usuario temporalmente

**Archivo:** `antiSpamService.js` línea 282-292

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🔨 EXPULSIÓN TEMPORAL APLICADA
╠═══════════════════════════════════════════════════════════════
║ Usuario: JuanPepe (ID: abc123)
║ Motivo: Spam por duplicados
║ Duración: 5 minutos
║ Sala: Chat Principal
║ Expira: 05/01/2026, 14:35:20
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- Nombre de usuario + ID
- Motivo exacto de la expulsión
- Duración en minutos
- Sala donde ocurrió
- Fecha/hora de expiración

---

### 🚫 **2. MENSAJE BLOQUEADO - Usuario Expulsado**

**Cuándo aparece:** Cuando un usuario expulsado intenta enviar un mensaje

**Archivo:** `antiSpamService.js` línea 399-408

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🚫 MENSAJE BLOQUEADO - Usuario Expulsado
╠═══════════════════════════════════════════════════════════════
║ Usuario: JuanPepe (ID: abc123)
║ Motivo expulsión: Spam por duplicados
║ Tiempo restante: 3 minuto(s)
║ Mensaje bloqueado: "hola hola hola hola hola..."
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- Usuario que intenta chatear
- Motivo original de la expulsión
- Tiempo restante de expulsión
- Contenido del mensaje bloqueado (primeros 50 caracteres)

---

### 🚫 **3. MENSAJE BLOQUEADO - Número de Teléfono**

**Cuándo aparece:** Cuando se detecta un número de teléfono en el mensaje

**Archivo:** `antiSpamService.js` línea 427-437

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🚫 MENSAJE BLOQUEADO - Número de Teléfono
╠═══════════════════════════════════════════════════════════════
║ Usuario: JuanPepe (ID: abc123)
║ Motivo: Número de teléfono detectado
║ Sala: Chat Principal
║ Mensaje: "mi numero es 912345678"
║ ⚠️  Advertencia registrada en spam_warnings
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- Usuario que envió el mensaje
- Sala donde intentó enviar
- Mensaje completo con el número
- Confirmación de advertencia registrada

**Números detectados:**
- +56 9 1234 5678
- +56912345678
- 912345678
- Y otras variantes

---

### 🚫 **4. MENSAJE BLOQUEADO - Palabra Prohibida**

**Cuándo aparece:** Cuando se detecta una palabra/frase prohibida

**Archivo:** `antiSpamService.js` línea 468-479

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🚫 MENSAJE BLOQUEADO - Palabra Prohibida
╠═══════════════════════════════════════════════════════════════
║ Usuario: JuanPepe (ID: abc123)
║ Palabra detectada: "whatsapp"
║ Categoría: Redes Sociales
║ Sala: Chat Principal
║ Mensaje: "agregame al whatsapp"
║ ⚠️  Advertencia registrada en spam_warnings
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- Usuario que envió el mensaje
- Palabra exacta que disparó el bloqueo
- Categoría (Redes Sociales, Contenido Comercial, Contenido Ilegal, General)
- Sala donde intentó enviar
- Mensaje completo
- Confirmación de advertencia

**Categorías de palabras prohibidas:**

| Categoría | Palabras Ejemplo |
|-----------|------------------|
| **Redes Sociales** | instagram, whatsapp, telegram, facebook, snapchat, tiktok, twitter |
| **Contenido Comercial** | vendo, compro, ofrezco, precio, pago, onlyfans |
| **Contenido Ilegal** | vendo drogas, vendo marihuana, vendo cocaina |
| **General** | mi numero, mandame, agregame, escribeme |

---

### 🔇 **5. USUARIO MUTEADO (Rate Limit)**

**Cuándo aparece:** Cuando se detecta que un usuario está muteado por exceso de mensajes

**Archivo:** `rateLimitService.js` línea 56-65 (cache) y 91-100 (Firestore)

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🔇 USUARIO MUTEADO (Rate Limit)
╠═══════════════════════════════════════════════════════════════
║ Usuario ID: abc123
║ Motivo: SPAM_RATE_LIMIT
║ Tiempo restante: 45 segundo(s)
║ Fuente: Cache en memoria
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- ID del usuario muteado
- Motivo del mute
- Tiempo restante en segundos
- Fuente (Cache o Firestore)

**⚠️ NOTA:** Actualmente el rate limiting está **DESACTIVADO** (MUTE_DURATION: 0), por lo que este log **NO debería aparecer** en condiciones normales.

---

### 🔨 **6. MUTE APLICADO (Rate Limit)**

**Cuándo aparece:** Cuando se aplica un mute nuevo por exceso de mensajes

**Archivo:** `rateLimitService.js` línea 140-150

**Ejemplo en F12:**
```
╔═══════════════════════════════════════════════════════════════
║ 🔨 MUTE APLICADO (Rate Limit)
╠═══════════════════════════════════════════════════════════════
║ Usuario ID: abc123
║ Motivo: Exceso de mensajes (SPAM_RATE_LIMIT)
║ Duración: 0 segundo(s)
║ Expira: 05/01/2026, 14:30:00
║ Límite excedido: 999 mensajes en 10s
╚═══════════════════════════════════════════════════════════════
```

**Información incluida:**
- ID del usuario
- Motivo específico
- Duración del mute
- Fecha/hora de expiración
- Límite que se excedió

**⚠️ NOTA:** Actualmente el rate limiting está **DESACTIVADO** (MUTE_DURATION: 0, MAX_MESSAGES: 999), por lo que este log **NO debería aparecer** en condiciones normales.

---

## 🧪 Cómo Verificar los Logs

### **Paso 1: Abrir DevTools (F12)**

1. En el navegador, presiona **F12**
2. Ve a la pestaña **Console**
3. Filtra por nivel de log:
   - **Errors** (rojo) → Expulsiones y mutes aplicados
   - **Warnings** (amarillo) → Mensajes bloqueados

### **Paso 2: Provocar un Bloqueo**

#### **Test A: Palabra Prohibida**
1. Escribe en el chat: `"agregame al whatsapp"`
2. **Resultado esperado en F12:**
   ```
   🚫 MENSAJE BLOQUEADO - Palabra Prohibida
   Palabra detectada: "whatsapp"
   Categoría: Redes Sociales
   ```

#### **Test B: Número de Teléfono**
1. Escribe en el chat: `"mi numero es 912345678"`
2. **Resultado esperado en F12:**
   ```
   🚫 MENSAJE BLOQUEADO - Número de Teléfono
   Motivo: Número de teléfono detectado
   ```

#### **Test C: Usuario Expulsado**
1. Expulsar manualmente a un usuario (desde panel admin o Firestore)
2. Como ese usuario, intentar enviar un mensaje
3. **Resultado esperado en F12:**
   ```
   🚫 MENSAJE BLOQUEADO - Usuario Expulsado
   Motivo expulsión: [motivo original]
   Tiempo restante: X minuto(s)
   ```

---

## 📁 Archivos Modificados

| Archivo | Líneas Modificadas | Cambios |
|---------|-------------------|---------|
| `src/services/antiSpamService.js` | 282-292 | Log: Expulsión temporal aplicada |
| `src/services/antiSpamService.js` | 399-408 | Log: Usuario expulsado intentando chatear |
| `src/services/antiSpamService.js` | 427-437 | Log: Número de teléfono detectado |
| `src/services/antiSpamService.js` | 468-479 | Log: Palabra prohibida detectada |
| `src/services/rateLimitService.js` | 56-65 | Log: Usuario muteado (cache) |
| `src/services/rateLimitService.js` | 91-100 | Log: Usuario muteado (Firestore) |
| `src/services/rateLimitService.js` | 140-150 | Log: Mute aplicado |
| `docs/sistema-logs-expulsiones-f12.md` | - | Documentación completa |

---

## 🔍 Interpretación de Logs

### **Si ves muchos logs de "PALABRA PROHIBIDA"**
→ Usuarios intentando compartir redes sociales/números
→ Sistema funcionando correctamente
→ **Acción:** Verificar que la lista de palabras prohibidas es la correcta

### **Si ves logs de "EXPULSIÓN TEMPORAL APLICADA"**
→ Sistema está expulsando usuarios activamente
→ Revisar el motivo: ¿spam real o falso positivo?
→ **Acción:** Ajustar CONFIG en antiSpamService.js si es necesario

### **Si ves logs de "USUARIO MUTEADO (Rate Limit)"**
→ ⚠️ **ALERTA:** El rate limiting está activo (debería estar desactivado)
→ **Acción:** Verificar que MUTE_DURATION esté en 0

### **Si NO ves logs aunque haya bloqueos**
→ Verificar que estás viendo la pestaña **Console** en F12
→ Verificar filtros de log (mostrar errors y warnings)
→ Refrescar la página y volver a intentar

---

## 🚀 Beneficios de Este Sistema

### 1. **Debugging Instantáneo**
- Ver en tiempo real POR QUÉ se bloquea un usuario
- No necesitas revisar Firestore ni logs de servidor
- Información completa en un solo lugar

### 2. **Formato Muy Visible**
- Bordes con caracteres especiales (╔══╗)
- Emojis claros (🔨, 🚫, 🔇)
- `console.error` (rojo) y `console.warn` (amarillo)

### 3. **Información Completa**
- Usuario afectado
- Motivo exacto
- Tiempo restante (para expulsiones/mutes)
- Mensaje bloqueado
- Sala donde ocurrió

### 4. **No Invasivo**
- Solo aparece en la consola F12
- No afecta la UI del chat
- No ralentiza el sistema
- Solo para debugging/monitoreo

---

## 📊 Estado Actual del Anti-Spam

### **antiSpamService.js (✅ ACTIVO)**
- ✅ Bloqueo por números de teléfono
- ✅ Bloqueo por palabras prohibidas
- ✅ Expulsiones temporales (5 minutos)
- ⚠️ Detección de duplicados **DESACTIVADA** (línea 436-442)

### **rateLimitService.js (❌ DESACTIVADO)**
- ❌ MUTE_DURATION: 0 (no mutea)
- ❌ MIN_INTERVAL_MS: 0 (no bloquea doble click)
- ❌ MAX_MESSAGES: 999 (sin límite real)

---

## 🐛 Solución de Problemas

### **Problema: Los logs no aparecen**
1. ✅ Abre la consola F12
2. ✅ Activa filtros: Errors + Warnings
3. ✅ Provoca un bloqueo (palabra prohibida, número)
4. ✅ Verifica que no hay filtros de texto activos

### **Problema: Aparecen logs de "USUARIO MUTEADO" sin razón**
→ El rate limiting se reactivó accidentalmente
→ **Solución:** Verificar que en `rateLimitService.js`:
   - `MUTE_DURATION: 0`
   - `MIN_INTERVAL_MS: 0`

### **Problema: No se registran las advertencias en Firestore**
→ Error de permisos o autenticación
→ **Solución:** Verificar firestore.rules permite escribir en `spam_warnings` y `temp_bans`

---

**✅ IMPLEMENTACIÓN COMPLETADA - 2026-01-05**

**Resultado:** Sistema de logs completo en F12 que muestra el motivo exacto de cada expulsión/bloqueo.
