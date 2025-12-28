# 🔥 SISTEMA DE DETECCIÓN DE SPAM POR FRECUENCIA

## 📋 RESUMEN

Sistema implementado para prevenir spam masivo de APIs que envían mensajes repetitivos o similares en un corto período de tiempo.

---

## 🎯 FUNCIONALIDADES

### 1. **Detección de Frecuencia**
- Monitorea mensajes de cada personalidad IA en tiempo real
- Ventana de tiempo: **1 minuto** (configurable)
- Detecta mensajes **idénticos** y **similares** (85%+ similitud)

### 2. **Umbrales Configurables**
```javascript
MAX_SIMILAR_MESSAGES: 3      // Máximo 3 mensajes similares en 1 minuto
MAX_IDENTICAL_MESSAGES: 2    // Máximo 2 mensajes idénticos en 1 minuto
SIMILARITY_THRESHOLD: 0.85   // 85% de similitud = spam
```

### 3. **Penalización Temporal**
- **Duración:** 5 minutos de bloqueo (configurable)
- **Automática:** Se aplica cuando se detecta spam
- **Auto-expiración:** Se libera automáticamente después del tiempo

### 4. **Limpieza Automática**
- Limpia historiales antiguos cada 2 minutos
- Elimina penalizaciones expiradas automáticamente

---

## 🔧 CONFIGURACIÓN

### Archivo: `src/services/spamDetectionService.js`

```javascript
const CONFIG = {
  TIME_WINDOW_MS: 60 * 1000,        // 1 minuto
  MAX_SIMILAR_MESSAGES: 3,          // 3 mensajes similares
  MAX_IDENTICAL_MESSAGES: 2,        // 2 mensajes idénticos
  SIMILARITY_THRESHOLD: 0.85,       // 85% similitud
  PENALTY_DURATION_MS: 5 * 60 * 1000, // 5 minutos
  CLEANUP_INTERVAL_MS: 2 * 60 * 1000  // Limpieza cada 2 min
};
```

---

## 📊 FUNCIONES PRINCIPALES

### `validateMessageForSpam(personalityId, message)`
Valida un mensaje antes de enviarlo.

**Retorna:**
```javascript
{
  allowed: boolean,
  reason?: string,
  stats?: {
    identicalCount: number,
    similarCount: number,
    totalSimilar: number
  },
  penalty?: {
    until: timestamp,
    remainingMs: number,
    reason: string
  }
}
```

**Ejemplo de uso:**
```javascript
const spamCheck = validateMessageForSpam('ai_mateo', 'toy bn wn');
if (!spamCheck.allowed) {
  console.error('Spam detectado:', spamCheck.reason);
  return; // No enviar
}
```

### `isPenalized(personalityId)`
Verifica si una personalidad está actualmente penalizada.

**Retorna:** `boolean`

### `getPersonalityStats(personalityId)`
Obtiene estadísticas de una personalidad.

**Retorna:**
```javascript
{
  totalMessages: number,
  recentMessages: number,
  isPenalized: boolean,
  penalty: {
    until: timestamp,
    remainingMs: number,
    reason: string
  } | null
}
```

---

## 🔄 FLUJO DE VALIDACIÓN

```
1. Mensaje generado por IA
   ↓
2. validateMessageForSpam() verifica:
   - ¿Está penalizado? → BLOQUEAR
   - ¿Es similar a mensajes recientes? → BLOQUEAR + PENALIZAR
   - ¿Es idéntico a mensajes recientes? → BLOQUEAR + PENALIZAR
   ↓
3. Si pasa validación:
   - Registrar en historial
   - Permitir envío
   ↓
4. Si falla:
   - Aplicar penalización (5 min)
   - Bloquear mensaje
   - Log de razón
```

---

## 📝 INTEGRACIÓN

### En `multiProviderAIConversation.js`:

```javascript
import { validateMessageForSpam } from './spamDetectionService';

const sendAIMessage = async (roomId, personality, content, source) => {
  // Validación anti-spam (PRIMERA VALIDACIÓN)
  const spamCheck = validateMessageForSpam(personality.userId, content);
  if (!spamCheck.allowed) {
    console.error('SPAM DETECTADO:', spamCheck.reason);
    return; // NO ENVIAR
  }
  
  // ... resto de validaciones y envío
};
```

---

## 🚨 LOGS Y DEBUGGING

### Logs de Spam Detectado:
```
[MULTI AI] 🚫🚫🚫 SPAM DETECTADO: Mateo bloqueado
[MULTI AI] 📋 Razón: 3 mensajes similares (85%+) en 60s
[MULTI AI] 📊 Stats: { identicalCount: 0, similarCount: 3, totalSimilar: 3 }
[MULTI AI] ⏱️ Penalizado por 5 minuto(s) más
```

### Logs de Validación Exitosa:
```
[MULTI AI] ✅ Mateo envió: "toy bn wn..."
[MULTI AI] 📊 Spam stats: 1 mensajes similares recientes
```

---

## ⚙️ AJUSTES RECOMENDADOS

### Para ser más estricto (menos spam):
```javascript
MAX_SIMILAR_MESSAGES: 2      // Reducir a 2
MAX_IDENTICAL_MESSAGES: 1    // Reducir a 1
SIMILARITY_THRESHOLD: 0.90   // Aumentar a 90%
PENALTY_DURATION_MS: 10 * 60 * 1000 // Aumentar a 10 min
```

### Para ser más permisivo (más variación):
```javascript
MAX_SIMILAR_MESSAGES: 5      // Aumentar a 5
MAX_IDENTICAL_MESSAGES: 3    // Aumentar a 3
SIMILARITY_THRESHOLD: 0.80   // Reducir a 80%
PENALTY_DURATION_MS: 3 * 60 * 1000 // Reducir a 3 min
```

---

## 🧪 TESTING

### Probar detección de spam:
```javascript
// En consola del navegador (F12):
import { validateMessageForSpam, getPersonalityStats } from './services/spamDetectionService';

// Enviar mismo mensaje 3 veces rápidamente
validateMessageForSpam('ai_mateo', 'toy bn wn');
validateMessageForSpam('ai_mateo', 'toy bn wn');
validateMessageForSpam('ai_mateo', 'toy bn wn'); // Debe bloquear

// Ver estadísticas
getPersonalityStats('ai_mateo');
```

---

## 📈 MÉTRICAS

El sistema rastrea:
- Total de mensajes por personalidad
- Mensajes recientes (último minuto)
- Penalizaciones activas
- Razones de bloqueo

---

## 🔍 MONITOREO

### Ver penalizaciones activas:
```javascript
import { getPersonalityStats } from './services/spamDetectionService';

// Ver stats de una IA
const stats = getPersonalityStats('ai_mateo');
console.log('Penalizado:', stats.isPenalized);
console.log('Tiempo restante:', stats.penalty?.remainingMs);
```

---

## ✅ BENEFICIOS

1. **Previene spam masivo** de APIs que envían mensajes repetitivos
2. **Bloqueo automático** sin intervención manual
3. **Penalización temporal** que se auto-libera
4. **Limpieza automática** de datos antiguos
5. **Logs detallados** para debugging
6. **Configuración flexible** según necesidades

---

## 🚀 PRÓXIMOS PASOS

- [ ] Agregar dashboard de monitoreo en consola
- [ ] Exportar métricas a analytics
- [ ] Ajustar umbrales basado en datos reales
- [ ] Agregar notificaciones cuando se detecta spam masivo

