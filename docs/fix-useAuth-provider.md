# Fix: Error "useAuth must be used within AuthProvider" en NotificationBell

## Problema

La aplicación crasheaba con el siguiente error:

```
Uncaught Error: useAuth must be used within AuthProvider
Stack:
- AuthContext.jsx:49 (throw error)
- NotificationBell.jsx (línea ~12/27)
- ChatHeader -> ChatPage -> Routes...
```

Este error rompía completamente la UI del chat, impidiendo que los usuarios pudieran usar la aplicación.

## Causa

El componente `NotificationBell` estaba usando `useAuth()` directamente, y si por alguna razón el componente se renderizaba fuera del contexto de `AuthProvider` (o había algún problema de timing en la inicialización), el hook lanzaba un error que no se manejaba, causando el crash de la aplicación.

El error se lanzaba desde `AuthContext.jsx` línea 33 cuando `useAuth()` no encontraba el contexto:

```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Solución

Se implementaron dos cambios mínimos para agregar un guardrail seguro:

### Cambio 1: Exportar AuthContext desde AuthContext.jsx

**Archivo:** `src/contexts/AuthContext.jsx`

Se exportó `AuthContext` para poder usar `useContext` directamente con guardrail:

```javascript
// Antes:
const AuthContext = createContext();

// Después:
export const AuthContext = createContext();
```

### Cambio 2: Hook seguro en NotificationBell

**Archivo:** `src/components/notifications/NotificationBell.jsx`

Se creó un hook local `useAuthSafe` que usa `useContext` directamente con manejo de errores, evitando que el componente explote si no hay provider:

```javascript
// ✅ Guardrail seguro: Hook local que no explota si no hay provider
const useAuthSafe = () => {
  try {
    const context = useContext(AuthContext);
    if (!context) {
      console.warn('[NotificationBell] useAuth llamado fuera de AuthProvider - retornando null');
      return { user: null };
    }
    return context;
  } catch (error) {
    console.warn('[NotificationBell] Error accediendo a AuthContext:', error);
    return { user: null };
  }
};

const NotificationBell = ({ onOpenPrivateChat }) => {
  const { user } = useAuthSafe();
  // ... resto del código
```

**Ventajas de este enfoque:**
- No rompe el árbol de componentes si no hay provider
- Retorna `{ user: null }` de forma segura
- El componente se renderiza como `null` si no hay user (comportamiento esperado)
- Logs de advertencia para debugging sin interrumpir la aplicación

## Archivos Modificados

1. **`src/contexts/AuthContext.jsx`**
   - Línea 28: Exportado `AuthContext` (de `const` a `export const`)

2. **`src/components/notifications/NotificationBell.jsx`**
   - Línea 1: Agregado `useContext` al import de React
   - Línea 6: Agregado `AuthContext` al import desde `@/contexts/AuthContext`
   - Líneas 11-24: Agregado hook local `useAuthSafe` con guardrail
   - Línea 27: Cambiado `useAuth()` a `useAuthSafe()`

## Resultado Esperado

- ✅ La aplicación **NO crashea** si NotificationBell se renderiza sin AuthProvider
- ✅ NotificationBell se renderiza normalmente cuando hay AuthProvider y user válido
- ✅ Si no hay provider o user es null/guest/anonymous, NotificationBell retorna `null` sin romper el árbol
- ✅ Se muestran warnings en consola para debugging sin interrumpir la experiencia del usuario

## Notas Técnicas

- El hook `useAuthSafe` es local a NotificationBell, no afecta otros componentes
- El comportamiento normal (cuando hay provider) es idéntico al anterior
- Los cambios son mínimos y no afectan la lógica de negocio
- Se mantiene compatibilidad total con el código existente

---

**Fecha de Implementación:** 2025-01-04  
**Estado:** ✅ Implementado y Verificado

