# Fix: Auto-scroll estilo WhatsApp/Telegram/Discord

## Problema

El chat tenía problemas de experiencia de usuario relacionados con el scroll:

1. **Al abrir el chat**: La lista quedaba "a mitad" (no abajo), el usuario debía hacer scroll manual para ver los mensajes nuevos.

2. **Al recibir mensajes nuevos**: No hacía auto-scroll automático, incluso cuando el usuario estaba viendo los mensajes más recientes.

3. **Experiencia rota**: El usuario debía arrastrar con el dedo/mouse hacia abajo constantemente para ver mensajes nuevos, rompiendo la experiencia realtime esperada en apps modernas como WhatsApp, Telegram o Discord.

## Solución

Se implementaron dos cambios mínimos en el hook `useChatScrollManager`:

### Cambio 1: Scroll inicial al bottom

**Archivo:** `src/hooks/useChatScrollManager.js`

Se agregó un ref `didInitialScrollRef` para rastrear si ya se hizo el scroll inicial y hacerlo solo una vez cuando se cargan los primeros mensajes:

```javascript
const didInitialScrollRef = useRef(false); // ✅ Track si ya se hizo scroll inicial
```

Luego, en el useEffect que maneja nuevos mensajes, se agregó lógica para hacer scroll inicial:

```javascript
// ✅ SCROLL INICIAL: Si es la primera carga, hacer scroll al bottom inmediatamente (WhatsApp-style)
if (!didInitialScrollRef.current) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Doble RAF para asegurar que el DOM está renderizado
      scrollToBottom('auto');
      setScrollState('AUTO_FOLLOW');
      setUnreadCount(0);
      didInitialScrollRef.current = true;
    });
  });
  return; // Salir temprano, no procesar más lógica en la primera carga
}
```

**Características:**
- Se ejecuta solo una vez cuando se cargan los primeros mensajes
- Usa doble `requestAnimationFrame` para asegurar que el DOM está renderizado
- Scroll inmediato (`'auto'`) sin animación para velocidad
- Establece el estado a `AUTO_FOLLOW` para activar auto-scroll en mensajes futuros

### Cambio 2: Ajuste de threshold

**Archivo:** `src/hooks/useChatScrollManager.js`

Se ajustó el threshold de "near bottom" de 100px a 80px (dentro del rango recomendado de 80-120px):

```javascript
const THRESHOLD_AT_BOTTOM = 80; // px from bottom to consider "at bottom" (WhatsApp-style, ajustado a 80px como recomendado)
```

Este threshold determina qué tan cerca del bottom debe estar el usuario para considerarse "en el bottom" y activar el auto-follow.

## Archivos Modificados

1. **`src/hooks/useChatScrollManager.js`**
   - Línea 39: Agregado `didInitialScrollRef` ref
   - Línea 51: Ajustado `THRESHOLD_AT_BOTTOM` de 100px a 80px
   - Líneas 257-270: Agregada lógica de scroll inicial

## Comportamiento Implementado

### A) Al entrar a la sala (carga inicial)

- ✅ Si es carga inicial (primeros mensajes), posiciona automáticamente en el **BOTTOM**
- ✅ Scroll inmediato sin animación para velocidad máxima
- ✅ Se ejecuta solo una vez usando `didInitialScrollRef`

### B) Cuando llegan mensajes nuevos

El comportamiento ya estaba implementado correctamente, pero ahora funciona mejor con el scroll inicial:

- ✅ Si el usuario está cerca del bottom (dentro de 80px), hace **auto-follow** al bottom
- ✅ Si el usuario scrolleó hacia arriba manualmente (leyendo historial), NO fuerza scroll
- ✅ Muestra indicador "Nuevos mensajes" (`NewMessagesIndicator`) cuando hay mensajes nuevos y el usuario está arriba

### C) Cuando el usuario deja de interactuar

Ya estaba implementado:

- ✅ Si el usuario vuelve al bottom (manual o tocando el indicador), reactiva auto-follow
- ✅ El indicador desaparece automáticamente cuando el usuario vuelve al bottom

## Resultado Esperado

### Criterios de Aceptación

1. ✅ **Al abrir el chat**: 
   - El chat aterriza automáticamente en el bottom (como WhatsApp/Telegram)
   - No requiere scroll manual para ver los mensajes más recientes

2. ✅ **Al llegar mensaje nuevo**:
   - Si el usuario estaba abajo (dentro de 80px del bottom), el scroll sigue automáticamente al bottom
   - Si el usuario está leyendo arriba (historial), NO lo empuja, solo muestra indicador "Nuevos mensajes"

3. ✅ **Interacción del usuario**:
   - Al tocar el indicador "Nuevos mensajes" o volver al bottom manualmente, se reactiva el auto-follow
   - El indicador desaparece cuando el usuario está en el bottom

4. ✅ **Mobile-friendly**:
   - Usa `requestAnimationFrame` para esperar DOM antes de scrollear
   - No causa problemas en dispositivos móviles

## Notas Técnicas

- El scroll inicial se hace con `'auto'` (inmediato) en vez de `'smooth'` para velocidad máxima
- Se usa doble `requestAnimationFrame` para garantizar que el DOM está completamente renderizado
- El threshold de 80px es un balance entre sensibilidad y evitar scrolls innecesarios
- No se modificó la lógica existente de auto-follow, solo se agregó el scroll inicial
- Compatible con el comportamiento existente de pausar cuando el usuario lee historial

---

**Fecha de Implementación:** 2025-01-04  
**Estado:** ✅ Implementado y Verificado

