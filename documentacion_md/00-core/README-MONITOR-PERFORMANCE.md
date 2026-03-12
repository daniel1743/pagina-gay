# 📊 Sistema de Monitoreo de Rendimiento (Performance Monitor)

**Fecha de Implementación:** 09/01/2026
**Versión:** 1.0
**Estado:** ✅ Implementado y Activo

---

## 🎯 Propósito

Sistema de evaluación de velocidad que mide los tiempos críticos de la aplicación para detectar cuellos de botella y optimizar la experiencia del usuario.

**Características principales:**
- ✅ Activación/Desactivación vía consola (NO visible en la UI)
- ✅ Medición de 7 métricas críticas
- ✅ Logs con colores según velocidad
- ✅ Persistencia de estado (localStorage)
- ✅ Sin impacto en rendimiento cuando está desactivado

---

## 🚀 Uso Básico

### Activar el Monitor

Abre la consola del navegador (F12) y ejecuta:

```javascript
window.enablePerformanceMonitor()
```

Verás el siguiente mensaje:

```
🚀 PERFORMANCE MONITOR ACTIVADO

Se medirán los siguientes eventos:
    ✅ Carga del landing
    ✅ Apertura del modal
    ✅ Entrada a sala
    ✅ Carga de la sala
    ✅ Envío de mensajes
    ✅ Recepción de mensajes

Para ver métricas: window.getPerformanceMetrics()
Para desactivar: window.disablePerformanceMonitor()
```

### Desactivar el Monitor

```javascript
window.disablePerformanceMonitor()
```

### Ver Métricas Recopiladas

```javascript
window.getPerformanceMetrics()
```

Esto mostrará un resumen completo con:
- **Cantidad de muestras**: Cuántas veces se midió cada evento
- **Promedio**: Tiempo promedio en milisegundos
- **Mínimo**: Tiempo más rápido registrado
- **Máximo**: Tiempo más lento registrado

### Limpiar Métricas

```javascript
window.clearPerformanceMetrics()
```

---

## 📊 Métricas Monitoreadas

### 1. Landing Load (Carga del Landing)

**¿Qué mide?** Tiempo desde que se hace clic en el enlace hasta que el landing page se muestra completamente.

**Evento:** `landingLoad`

**Ubicación:** `src/pages/GlobalLandingPage.jsx`

**Cuándo se registra:**
- Cuando el evento `window.load` se dispara
- Usa la Navigation Timing API para precisión

**Ejemplo de log:**
```
✅ [landingLoad] 847.50ms - EXCELENTE
```

---

### 2. Modal Open (Apertura del Modal)

**¿Qué mide?** Velocidad con la que se abre el modal de entrada (desde click en "ENTRAR GRATIS" hasta que el modal aparece).

**Evento:** `modalOpen`

**Ubicación:** `src/components/auth/GuestUsernameModal.jsx`

**Cuándo se registra:**
- Cuando el modal se abre (`open` prop cambia a `true`)
- Usa `performance.now()` para medición precisa

**Ejemplo de log:**
```
✅ [modalOpen] 123.40ms - EXCELENTE
```

---

### 3. Chat Entry (Entrada a Sala)

**¿Qué mide?** Tiempo desde que el usuario hace clic en "Continuar" en el modal hasta que entra a la sala de chat.

**Evento:** `chatEntry`

**Ubicación:** `src/components/auth/GuestUsernameModal.jsx`

**Cuándo se registra:**
- Cuando se ejecuta `navigate()` para entrar al chat
- Medición desde inicio de `handleSubmit` hasta navegación

**Ejemplo de log:**
```
🔵 [chatEntry] 678.20ms - ACEPTABLE
```

---

### 4. Chat Load (Carga de la Sala)

**¿Qué mide?** Tiempo desde que entra a la sala hasta que la sala está completamente cargada (mensajes recibidos, usuarios cargados).

**Evento:** `chatLoad`

**Ubicación:** `src/pages/ChatPage.jsx`

**Cuándo se registra:**
- Cuando `setIsLoadingMessages(false)` se ejecuta
- Indica que los mensajes han sido recibidos de Firestore

**Ejemplo de log:**
```
✅ [chatLoad] 456.80ms - EXCELENTE
```

---

### 5. Message Sent (Envío de Mensaje)

**¿Qué mide?** Tiempo que tarda en enviarse un mensaje (desde que el usuario presiona Enter hasta que Firestore confirma la escritura).

**Evento:** `messageSent`

**Ubicación:** `src/services/chatService.js`

**Cuándo se registra:**
- Integrado con el performance monitor de chatService
- Medición incluye validación, escritura en Firestore y confirmación

**Ejemplo de log:**
```
✅ [messageSent] 234.50ms - EXCELENTE
  { messageId: "abc123xyz", type: "message" }
```

---

### 6. Message Received (Recepción de Mensaje)

**¿Qué mide?** Latencia desde que otro usuario envía un mensaje hasta que lo recibes en tu pantalla.

**Evento:** `messageReceived`

**Ubicación:** `src/services/chatService.js`

**Cuándo se registra:**
- Cuando un snapshot de Firestore trae nuevos mensajes
- Calcula diferencia entre `timestamp` del servidor y tiempo actual

**Ejemplo de log:**
```
⚠️ [messageReceived] 1234.00ms - LENTO
  { messageId: "xyz789abc", type: "message" }
```

---

### 7. Message Roundtrip (Ida y Vuelta de Mensaje)

**¿Qué mide?** Tiempo total desde que envías un mensaje hasta que lo ves confirmado en pantalla.

**Evento:** `messageRoundtrip`

**Ubicación:** `src/services/chatService.js`

**Cuándo se registra:**
- Combinación de envío + recepción
- Incluye escritura, propagación y snapshot

**Ejemplo de log:**
```
🔵 [messageRoundtrip] 567.30ms - ACEPTABLE
  { messageId: "def456ghi", type: "message_roundtrip" }
```

---

## 🎨 Códigos de Color

El sistema usa colores para clasificar la velocidad de cada evento:

| Color | Emoji | Estado | Rango (ms) | Significado |
|-------|-------|--------|------------|-------------|
| 🟢 Verde | ✅ | **EXCELENTE** | < 500ms | Rendimiento óptimo |
| 🔵 Azul | 🔵 | **ACEPTABLE** | 500-1000ms | Rendimiento bueno |
| 🟡 Amarillo | ⚠️ | **LENTO** | 1000-3000ms | Puede mejorar |
| 🔴 Rojo | ❌ | **MUY LENTO** | > 3000ms | Requiere optimización |

**Ejemplos:**

```javascript
✅ [landingLoad] 345.20ms - EXCELENTE     // Verde
🔵 [chatEntry] 789.50ms - ACEPTABLE       // Azul
⚠️ [messageReceived] 1567.30ms - LENTO   // Amarillo
❌ [chatLoad] 4234.80ms - MUY LENTO       // Rojo
```

---

## 📈 Ejemplo de Uso Completo

### Escenario: Evaluar rendimiento de entrada al chat

```javascript
// 1. Activar monitor
window.enablePerformanceMonitor()

// 2. Navegar como usuario nuevo
// - Visitar landing page
// - Click en "ENTRAR GRATIS"
// - Ingresar nombre
// - Click en "Ir al Chat"
// - Esperar a que cargue la sala
// - Enviar 3-5 mensajes

// 3. Ver métricas recopiladas
window.getPerformanceMetrics()

// Salida esperada:
// 📊 PERFORMANCE METRICS
//
// 📈 landingLoad:
//   Muestras: 1
//   Promedio: 847.50ms
//   Mínimo: 847.50ms
//   Máximo: 847.50ms
//
// 📈 modalOpen:
//   Muestras: 1
//   Promedio: 123.40ms
//   Mínimo: 123.40ms
//   Máximo: 123.40ms
//
// 📈 chatEntry:
//   Muestras: 1
//   Promedio: 678.20ms
//   Mínimo: 678.20ms
//   Máximo: 678.20ms
//
// 📈 chatLoad:
//   Muestras: 1
//   Promedio: 456.80ms
//   Mínimo: 456.80ms
//   Máximo: 456.80ms
//
// 📈 messageSent:
//   Muestras: 5
//   Promedio: 234.50ms
//   Mínimo: 189.30ms
//   Máximo: 312.70ms
//
// 📈 messageReceived:
//   Muestras: 12
//   Promedio: 567.80ms
//   Mínimo: 234.50ms
//   Máximo: 1234.90ms

// 4. Limpiar métricas para nueva medición
window.clearPerformanceMetrics()

// 5. Desactivar cuando termines
window.disablePerformanceMonitor()
```

---

## 🔧 Implementación Técnica

### Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `src/utils/performanceMonitor.js` | **CREADO** - Sistema completo de monitoreo | 390 |
| `src/pages/GlobalLandingPage.jsx` | Import + `trackLandingLoad()` | 10, 226 |
| `src/components/auth/GuestUsernameModal.jsx` | Import + `trackModalOpen()` + `trackChatEntry()` | 16, 61, 108 |
| `src/pages/ChatPage.jsx` | Import + `trackChatLoad()` | 55, 607-610 |
| `src/services/chatService.js` | Ya usa performance monitor | 22, 349 |

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│  1. LANDING PAGE                                        │
│     - Usuario visita landing                            │
│     - window.load se dispara                            │
│     - trackLandingLoad() registra tiempo                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. MODAL OPEN                                          │
│     - Click en "ENTRAR GRATIS"                          │
│     - Modal se abre (open = true)                       │
│     - trackModalOpen() registra tiempo                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. CHAT ENTRY                                          │
│     - Usuario ingresa nombre                            │
│     - Click en "Ir al Chat"                             │
│     - trackChatEntry() registra tiempo                  │
│     - navigate() ejecuta navegación                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. CHAT LOAD                                           │
│     - ChatPage monta                                    │
│     - subscribeToRoomMessages() inicia                  │
│     - Mensajes llegan de Firestore                      │
│     - trackChatLoad() registra tiempo                   │
│     - setIsLoadingMessages(false)                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. MESSAGES                                            │
│     - Usuario envía mensaje                             │
│     - sendMessage() ejecuta                             │
│     - Firestore escribe                                 │
│     - trackMessageSent() registra                       │
│     - Otros usuarios reciben snapshot                   │
│     - trackMessageReceived() registra                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing y Validación

### Checklist de Pruebas

- [x] **Activación/Desactivación**
  - `window.enablePerformanceMonitor()` muestra mensaje
  - `window.disablePerformanceMonitor()` oculta logs
  - Estado persiste en localStorage

- [x] **Landing Load**
  - Se mide en carga inicial
  - Usa Navigation Timing API
  - Aparece en métricas

- [x] **Modal Open**
  - Se mide al abrir modal de entrada
  - Tiempo < 200ms (rápido)

- [x] **Chat Entry**
  - Se mide desde submit hasta navegación
  - Incluye validación y guardado

- [x] **Chat Load**
  - Se mide solo la primera vez (no en cada snapshot)
  - Indica cuando chat está listo

- [x] **Messages**
  - `messageSent` mide envío
  - `messageReceived` mide recepción
  - `messageRoundtrip` mide ciclo completo

### Comandos de Prueba Rápida

```javascript
// Test completo
window.enablePerformanceMonitor();
// [Navegar por la app: landing → modal → chat → enviar 5 mensajes]
window.getPerformanceMetrics();
window.clearPerformanceMetrics();
window.disablePerformanceMonitor();
```

---

## ⚠️ Consideraciones Importantes

### 1. **Sin Impacto en Producción**

El monitor verifica `isPerformanceMonitorEnabled()` en CADA llamada antes de ejecutar cualquier lógica. Si está desactivado, el overhead es mínimo (<1μs).

```javascript
export function trackLandingLoad() {
  if (!isPerformanceMonitorEnabled()) return; // ⚡ Early return inmediato
  // ... resto del código
}
```

### 2. **No Visible en UI**

El sistema NO muestra NADA en la interfaz de usuario. Todo es vía consola del navegador (F12). Los usuarios finales no ven ningún indicador.

### 3. **Persistencia de Estado**

El estado (activado/desactivado) se guarda en `localStorage` con la clave `chactivo_performance_monitor_enabled`.

```javascript
// Ver estado actual
localStorage.getItem('chactivo_performance_monitor_enabled') // 'true' o 'false'
```

### 4. **Almacenamiento de Métricas**

Las métricas se almacenan en memoria (NO en localStorage) y se pierden al refrescar la página. Esto es intencional para evitar contaminar localStorage con datos de desarrollo.

---

## 🎓 Casos de Uso

### Caso 1: Detectar Lentitud en Modal

**Problema Reportado:** "El modal tarda mucho en abrirse"

**Solución:**
```javascript
window.enablePerformanceMonitor()
// [Abrir modal varias veces]
window.getPerformanceMetrics()

// Si modalOpen > 500ms consistentemente:
// - Revisar tamaño de imagen de fondo
// - Verificar animaciones CSS
// - Reducir componentes renderizados
```

### Caso 2: Optimizar Carga de Chat

**Problema Reportado:** "La sala tarda en cargar"

**Solución:**
```javascript
window.enablePerformanceMonitor()
// [Entrar a sala]
window.getPerformanceMetrics()

// Si chatLoad > 2000ms:
// - Reducir límite de mensajes
// - Verificar índices de Firestore
// - Optimizar consultas
```

### Caso 3: Analizar Latencia de Mensajes

**Problema Reportado:** "Los mensajes no llegan rápido"

**Solución:**
```javascript
window.enablePerformanceMonitor()
// [Enviar 10-20 mensajes]
window.getPerformanceMetrics()

// Analizar:
// - messageSent: Si > 500ms, problema de escritura
// - messageReceived: Si > 1000ms, problema de propagación
// - messageRoundtrip: Si > 1500ms, problema de ciclo completo
```

---

## 📝 Notas de Desarrollo

### Por Qué No Usar console.time()?

`console.time()` es útil pero limitado:
- ❌ No persiste métricas
- ❌ No calcula promedios
- ❌ No permite desactivar globalmente
- ❌ No tiene clasificación por colores

Nuestro sistema:
- ✅ Almacena todas las muestras
- ✅ Calcula min/max/avg
- ✅ Desactivación global
- ✅ Logs con colores intuitivos

### Performance Overhead

Cuando está **desactivado** (producción):
- Overhead por llamada: <0.001ms (1 microsegundo)
- Impacto total: Despreciable

Cuando está **activado** (desarrollo):
- Overhead por llamada: ~0.1ms (incluye console.log)
- Impacto total: Mínimo, aceptable para debugging

---

## 🚀 Próximas Mejoras (Opcional)

### V1.1 - Exportación de Datos

```javascript
// Exportar métricas a JSON
window.exportPerformanceMetrics()
// Descarga archivo: performance-metrics-2026-01-09.json
```

### V1.2 - Visualización Gráfica

```javascript
// Abrir panel visual en nueva pestaña
window.visualizePerformanceMetrics()
// Muestra gráficos de barras, líneas, etc.
```

### V1.3 - Alertas Automáticas

```javascript
// Configurar umbrales personalizados
window.setPerformanceThresholds({
  chatLoad: 1500,    // Alertar si > 1.5s
  messageSent: 400   // Alertar si > 400ms
})
```

---

## 📞 Contacto y Soporte

**Implementado por:** Claude Code
**Fecha:** 09/01/2026
**Versión:** 1.0

**Documentos Relacionados:**
- `RESUMEN-FINAL-SESION-09-ENE-2026.md` - Resumen completo de la sesión
- `HOTFIX-USUARIO-OPTIMISTA.md` - Optimización de entrada al chat
- `FIX-FIRESTORE-ERRORS.md` - Limpieza de errores de consola

---

## ✅ Resumen Ejecutivo

### Lo Que Se Mide

| Métrica | Qué es | Umbral Óptimo |
|---------|--------|---------------|
| `landingLoad` | Carga inicial de la página | < 1000ms |
| `modalOpen` | Apertura del modal | < 200ms |
| `chatEntry` | Entrada a la sala | < 800ms |
| `chatLoad` | Carga completa del chat | < 1500ms |
| `messageSent` | Envío de mensaje | < 500ms |
| `messageReceived` | Recepción de mensaje | < 800ms |
| `messageRoundtrip` | Ciclo completo de mensaje | < 1200ms |

### Comandos Esenciales

```javascript
// Activar
window.enablePerformanceMonitor()

// Ver métricas
window.getPerformanceMetrics()

// Limpiar
window.clearPerformanceMetrics()

// Desactivar
window.disablePerformanceMonitor()
```

---

**¡El sistema está listo para usar!** 🎉

Solo abre la consola (F12) y empieza a medir.
