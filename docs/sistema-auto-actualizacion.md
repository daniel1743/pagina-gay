# 🔄 Sistema de Auto-Actualización

**Fecha:** 2025-01-28  
**Objetivo:** Sistema que detecta nuevos deploys, limpia el cache y actualiza automáticamente la aplicación

---

## 📋 RESUMEN

Sistema completo de auto-actualización que:
1. ✅ Genera un archivo `version.json` único en cada build
2. ✅ Verifica periódicamente si hay una nueva versión disponible
3. ✅ Limpia automáticamente todo el cache (localStorage, IndexedDB, Service Workers)
4. ✅ Recarga la aplicación automáticamente para aplicar los nuevos cambios

---

## 🔧 COMPONENTES IMPLEMENTADOS

### 1. Plugin de Vite: `vite-plugin-generate-version.js`

**Ubicación:** `vite-plugin-generate-version.js`

**Función:** Genera `public/version.json` antes de cada build con un identificador único.

**Contenido de version.json:**
```json
{
  "version": "1738099200000-abc1234",
  "timestamp": 1738099200000,
  "gitHash": "abc1234",
  "buildDate": "2025-01-28T12:00:00.000Z"
}
```

**Integración:** Se ejecuta automáticamente en cada build gracias al plugin de Vite.

---

### 2. Utilidad: `src/utils/versionChecker.js`

**Funciones principales:**
- `fetchServerVersion()`: Obtiene la versión del servidor desde `/version.json`
- `getStoredVersion()`: Obtiene la versión almacenada localmente
- `storeVersion(version)`: Guarda la versión actual en localStorage
- `clearAllCache()`: Limpia completamente el cache del sistema
- `checkForUpdates()`: Verifica si hay una nueva versión disponible
- `initVersionChecker(options)`: Inicializa el sistema de verificación

**Limpieza de cache:**
1. **localStorage**: Limpia todo excepto datos críticos (tema, verificaciones de edad)
2. **sessionStorage**: Limpia completamente
3. **IndexedDB**: Elimina databases de Firebase (Auth, Firestore)
4. **Service Worker Cache**: Elimina todos los caches de Service Workers
5. **Service Workers**: Desregistra todos los Service Workers activos

---

### 3. Hook de React: `src/hooks/useVersionChecker.js`

**Uso:**
```javascript
useVersionChecker({
  checkInterval: 60000, // Verificar cada 60 segundos
  autoReload: true // Recargar automáticamente si hay nueva versión
});
```

**Opciones:**
- `checkInterval`: Intervalo en milisegundos para verificar (default: 60000 = 1 minuto)
- `onUpdateAvailable`: Callback cuando se detecta actualización (opcional)
- `autoReload`: Si debe recargar automáticamente (default: true)

---

### 4. Integración en App.jsx

**Ubicación:** `src/App.jsx` (línea ~256)

**Implementación:**
```javascript
import { useVersionChecker } from '@/hooks/useVersionChecker';

function App() {
  // 🔄 Sistema de auto-actualización
  useVersionChecker({
    checkInterval: 60000, // Verificar cada 60 segundos
    autoReload: true // Recargar automáticamente
  });
  
  // ... resto del código
}
```

---

## 🚀 FLUJO DE FUNCIONAMIENTO

### Al Hacer Build
1. Plugin de Vite ejecuta `generateVersionPlugin()`
2. Se genera `public/version.json` con versión única
3. El archivo se copia al build final

### Al Cargar la Aplicación
1. `useVersionChecker` se inicializa
2. Verifica inmediatamente si hay nueva versión
3. Compara versión del servidor (`/version.json`) con versión local (localStorage)
4. Si coinciden: continúa normalmente
5. Si hay diferencia: limpia cache y recarga

### Verificación Periódica
1. Cada 60 segundos (configurable) verifica nuevamente
2. Si detecta nueva versión: limpia cache y recarga automáticamente
3. El proceso se repite continuamente

---

## 📊 FLUJO DETALLADO

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD Y DEPLOY                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  vite-plugin-generate-version │
        │  genera version.json          │
        └───────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  public/version.json creado   │
        │  { version: "timestamp-hash" }│
        └───────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  Deploy a producción          │
        └───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              APLICACIÓN EN PRODUCCIÓN                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  useVersionChecker inicia     │
        └───────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  fetchServerVersion()         │
        │  GET /version.json            │
        └───────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────┐
        │  Comparar con versión local   │
        └───────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
              Coincide          Diferente
                    │               │
                    ▼               ▼
        ┌─────────────────┐  ┌──────────────────┐
        │  Continuar      │  │  clearAllCache() │
        │  normal         │  └──────────────────┘
        └─────────────────┘           │
                            ┌─────────┘
                            ▼
                    ┌──────────────────┐
                    │  storeVersion()  │
                    │  reloadApplication() │
                    └──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │  window.location │
                    │  .reload()       │
                    └──────────────────┘
```

---

## 🧪 PRUEBAS

### Probar Localmente

1. **Generar versión manualmente:**
   ```bash
   node scripts/generate-version.js
   ```

2. **Verificar que se creó:**
   ```bash
   cat public/version.json
   ```

3. **Simular nueva versión:**
   - Cambiar manualmente `public/version.json` con un timestamp diferente
   - Recargar la aplicación
   - Debe detectar la diferencia y recargar automáticamente

### Probar en Producción

1. **Hacer deploy:**
   ```bash
   npm run build
   npm run deploy:hosting
   ```

2. **Verificar versión en producción:**
   - Visitar `https://chactivo.com/version.json`
   - Debe mostrar la versión actual

3. **Simular nuevo deploy:**
   - Hacer un cambio pequeño en el código
   - Hacer nuevo deploy
   - Esperar 60 segundos (o recargar manualmente)
   - La aplicación debe detectar la nueva versión y recargar automáticamente

---

## ⚙️ CONFIGURACIÓN

### Cambiar Intervalo de Verificación

En `src/App.jsx`:
```javascript
useVersionChecker({
  checkInterval: 30000, // 30 segundos (más frecuente)
  autoReload: true
});
```

### Desactivar Auto-Recarga (solo notificar)

En `src/App.jsx`:
```javascript
useVersionChecker({
  checkInterval: 60000,
  autoReload: false,
  onUpdateAvailable: () => {
    // Mostrar notificación al usuario
    alert('Nueva versión disponible. Recarga la página.');
  }
});
```

---

## 📝 DATOS PRESERVADOS

El sistema preserva los siguientes datos al limpiar cache:

- ✅ `chactivo-theme`: Tema del usuario (dark/light)
- ✅ `age_verified_*`: Verificaciones de edad por usuario

**Todo lo demás se elimina**, incluyendo:
- ❌ Datos de sesión temporal
- ❌ Cache de Firebase
- ❌ Service Workers
- ❌ Caches de navegador

---

## 🔍 DEBUGGING

### Verificar Versión Actual

En la consola del navegador:
```javascript
localStorage.getItem('app_version')
```

### Ver Versión del Servidor

En la consola del navegador:
```javascript
fetch('/version.json').then(r => r.json()).then(console.log)
```

### Forzar Limpieza de Cache

En la consola del navegador:
```javascript
// Importar la función (solo en desarrollo)
import { clearAllCache } from '@/utils/versionChecker';
await clearAllCache();
window.location.reload();
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Primera Carga**: Si no hay versión almacenada, se guarda la actual y no se recarga
2. **Frecuencia**: Por defecto verifica cada 60 segundos (no es inmediato)
3. **Cache Busting**: El `?t=${Date.now()}` en el fetch asegura que no use cache del navegador
4. **Errores Silenciosos**: Si hay error obteniendo la versión, no hace nada (no interrumpe la app)
5. **Preservación de Datos**: Algunos datos críticos se preservan (tema, edad)

---

## 📂 ARCHIVOS MODIFICADOS/CREADOS

1. ✅ `vite-plugin-generate-version.js` (nuevo)
2. ✅ `src/utils/versionChecker.js` (nuevo)
3. ✅ `src/hooks/useVersionChecker.js` (nuevo)
4. ✅ `src/App.jsx` (modificado - integración del hook)
5. ✅ `vite.config.js` (modificado - plugin agregado)
6. ✅ `docs/sistema-auto-actualizacion.md` (este documento)

---

## ✅ RESULTADO ESPERADO

Después de cada deploy:
- ✅ Los usuarios con la aplicación abierta detectan automáticamente la nueva versión
- ✅ El cache se limpia completamente (evita problemas con código antiguo)
- ✅ La aplicación se recarga automáticamente
- ✅ Los usuarios ven siempre la última versión sin intervención manual

---

*Documento creado el 2025-01-28 - Sistema de auto-actualización implementado*

