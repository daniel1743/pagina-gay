# 🔍 VERIFICACIÓN: Mensajes de IA vs Usuarios Reales

## 📋 RESUMEN

Los mensajes que estás viendo son de **IAs (Inteligencias Artificiales)** configuradas en el sistema. Los nombres como "BUSCO CULÓN", "MACHO26", "ORGÍA30", "CULERO26", "PENETRA HOT" son personalidades de IA definidas en `src/services/multiProviderAIConversation.js`.

---

## ✅ CÓMO IDENTIFICAR SI UN MENSAJE ES DE IA

### 1. **Por UserId (en la consola del navegador)**

Abre la consola (F12) y busca en los logs. Los mensajes de IA tienen `userId` que empieza con `ai_`:

```javascript
// Ejemplos de userIds de IA:
- "ai_busca_pasivo1" → Username: "BUSCO CULÓN"
- "ai_mateo" → Username: "MACHO26"
- "ai_orgia2" → Username: "ORGÍA30"
- "ai_culero1" → Username: "CULERO26"
- "ai_penetracion3" → Username: "PENETRA HOT"
```

### 2. **Por Nombres de Usuario**

Los siguientes nombres son **SIEMPRE IAs** (definidos en el código):

- `BUSCO CULÓN` (userId: `ai_busca_pasivo1`)
- `BUSCO VERGÓN` (userId: `ai_busca_activo1`)
- `MACHO26` (userId: `ai_mateo`)
- `MACHO HOT` (userId: `ai_vale`)
- `MACHO ACTIVO` (userId: `ai_bruno`)
- `ORGÍA30` (userId: `ai_orgia2`)
- `PENETRA HOT` (userId: `ai_penetracion3`)
- `CULERO26` (userId: `ai_culero1`)
- `ACTIVO24` (userId: `ai_ivan`)
- `VERGON27` (userId: `ai_milo`)

### 3. **En la Consola del Navegador**

Cuando un mensaje de IA se envía, verás logs como:

```
╔════════════════════════════════════════════════════════════╗
║           📤 RASTREADOR DE MENSAJES                        ║
╠════════════════════════════════════════════════════════════╣
║ 👤 Remitente: BUSCO CULÓN     │ Tipo: 🤖 IA                ║
║ 🆔 UserID: ai_busca_pasivo1                                ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🚨 ESTADO ACTUAL DEL SISTEMA

### Sistema de IA: **DESACTIVADO** (pero aún activo)

En `src/services/multiProviderAIConversation.js` línea 24:

```javascript
const AI_SYSTEM_ENABLED = false; // ← Está en false
```

**PERO** el sistema aún puede estar activo porque:
1. Puede haber mensajes antiguos en Firestore
2. Puede haber alguna otra forma de activación
3. Puede haber código que ignora esta bandera

---

## 🔧 CÓMO DESACTIVAR COMPLETAMENTE EL SISTEMA DE IA

### Opción 1: Verificar y Desactivar en el Código

1. **Abrir** `src/services/multiProviderAIConversation.js`
2. **Buscar** la línea 24: `const AI_SYSTEM_ENABLED = false;`
3. **Asegurarse** de que esté en `false`
4. **Buscar** todas las funciones que llaman a `startRoomAI` o `updateRoomAIActivity`
5. **Comentar** o eliminar esas llamadas

### Opción 2: Desactivar en ChatPage.jsx

Buscar en `src/pages/ChatPage.jsx` cualquier llamada a:
- `updateRoomAIActivity(roomId, realUserCount)`
- `startRoomAI(roomId)`
- `recordHumanMessage(roomId, username, content)`

Y comentarlas o eliminarlas.

### Opción 3: Eliminar Mensajes de IA de Firestore

Si quieres limpiar los mensajes existentes, puedes usar el script `cleanup-bot-messages.js` o crear uno nuevo para eliminar mensajes con `userId` que empiece con `ai_`.

---

## 📊 PERSONALIDADES DE IA CONFIGURADAS

Las siguientes personalidades están definidas y pueden enviar mensajes:

| Username | UserId | Provider | Descripción |
|----------|--------|----------|-------------|
| BUSCO CULÓN | `ai_busca_pasivo1` | deepseek | Activo buscando pasivos |
| BUSCO VERGÓN | `ai_busca_activo1` | deepseek | Pasivo buscando activos |
| MACHO26 | `ai_mateo` | deepseek | Activo vergón, muy caliente |
| MACHO HOT | `ai_vale` | deepseek | Versátil, muy atrevido |
| MACHO ACTIVO | `ai_bruno` | deepseek | Activo, fiestero |
| ORGÍA30 | `ai_orgia2` | deepseek | Versátil, habla de orgías |
| PENETRA HOT | `ai_penetracion3` | deepseek | Activo, habla de penetración |
| CULERO26 | `ai_culero1` | deepseek | Grosero pero caliente |
| ACTIVO24 | `ai_ivan` | deepseek | Activo, deportista |
| VERGON27 | `ai_milo` | deepseek | Activo, optimista |

**Total:** ~50+ personalidades de IA configuradas.

---

## 🎯 RECOMENDACIONES

1. **Verificar en la consola:** Abre F12 y busca los logs de "RASTREADOR DE MENSAJES" para confirmar que son IAs.

2. **Revisar Firestore:** Ve a la consola de Firebase y revisa la colección `rooms/{roomId}/messages` para ver los `userId` de los mensajes.

3. **Desactivar completamente:** Si quieres desactivar el sistema, asegúrate de:
   - `AI_SYSTEM_ENABLED = false`
   - Comentar todas las llamadas a funciones de IA en `ChatPage.jsx`
   - Limpiar mensajes existentes de IA en Firestore

4. **Mejorar las IAs:** Si quieres mantenerlas pero hacerlas menos repetitivas, necesitas modificar los `systemPrompt` en `multiProviderAIConversation.js` para que sean más contextuales y menos repetitivos.

---

## 🔍 CÓDIGO PARA VERIFICAR EN CONSOLA

Pega esto en la consola del navegador (F12) para ver todos los mensajes de IA:

```javascript
// Ver mensajes de IA en tiempo real
const checkAIMessages = () => {
  console.log('🔍 Verificando mensajes de IA...');
  // Esto mostrará en la consola todos los mensajes que vengan de IAs
};
```

---

## 📝 NOTAS IMPORTANTES

- Los `userId` que empiezan con `ai_` son SIEMPRE IAs
- Los mensajes de usuarios reales tienen `userId` que es un UID de Firebase Auth
- El sistema está configurado para que las IAs sean "humanas" y no revelen que son IAs
- Las IAs están diseñadas para ser muy explícitas y repetitivas según los `systemPrompt` actuales

---

**Fecha de creación:** 2025-01-27
**Última actualización:** 2025-01-27

