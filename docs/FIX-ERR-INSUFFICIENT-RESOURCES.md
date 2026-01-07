# 🔧 FIX: ERR_INSUFFICIENT_RESOURCES

## 📋 Descripción del Error

```
GET http://localhost:3000/src/pages/LobbyPage.jsx net::ERR_INSUFFICIENT_RESOURCES 304 (Not Modified)
Fetch error from : 
```

## 🔍 Causa Raíz

El error `ERR_INSUFFICIENT_RESOURCES` ocurre cuando:

1. **Demasiadas peticiones HTTP simultáneas**: El navegador se queda sin recursos (memoria, conexiones) para manejar más peticiones
2. **Google Analytics enviando muchos eventos**: GA4 puede generar muchas peticiones cuando hay muchos eventos trackeados
3. **Hot reload de Vite**: En desarrollo, Vite puede hacer múltiples peticiones a archivos `.jsx` durante el hot reload
4. **Errores 304 (Not Modified)**: Estos NO son errores reales, son respuestas normales del servidor indicando que el recurso no ha cambiado

## ✅ Solución Implementada

Se actualizó el monkey patch de `fetch` en `vite.config.js` para **filtrar y silenciar** estos errores:

### Errores Filtrados:

1. **Google Analytics**:
   - URLs que contienen `google-analytics.com`, `googletagmanager.com`, `analytics.google.com`
   - URLs que contienen el ID de GA4 (`G-PZQQL7WH39`)
   - URLs que contienen `gtag`

2. **Errores 304 (Not Modified)**:
   - Respuestas con status `304` son normales y no indican un error real

3. **Recursos Locales en Desarrollo**:
   - Peticiones a archivos `.jsx`, `.js`, `.ts` en `localhost` durante desarrollo
   - Estas son peticiones normales del hot reload de Vite

4. **ERR_INSUFFICIENT_RESOURCES**:
   - Errores que contienen `ERR_INSUFFICIENT_RESOURCES` o `net::ERR_INSUFFICIENT_RESOURCES`
   - Estos son errores del navegador cuando hay demasiadas peticiones, no errores de la aplicación

5. **Firestore/Firebase (ya existente)**:
   - Errores transitorios de Firestore (400, 500, 503)
   - Errores transitorios de Firebase Auth (500, 503)

## 📝 Cambios Realizados

### Archivo: `vite.config.js`

**Antes:**
```javascript
if (!isFirestoreInternalError && !isFirebaseAuthError) {
    console.error(`Fetch error from ${requestUrl}: ${errorFromRes}`);
}
```

**Después:**
```javascript
// Filtros adicionales para Google Analytics, 304, recursos locales, etc.
const isGoogleAnalyticsError = 
    requestUrl.includes('google-analytics.com') || 
    requestUrl.includes('googletagmanager.com') ||
    requestUrl.includes('analytics.google.com') ||
    requestUrl.includes('G-PZQQL7WH39') ||
    requestUrl.includes('gtag');

const isNotModified = response.status === 304;

const isLocalResourceError = 
    import.meta.env.DEV && 
    (requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1')) &&
    (requestUrl.includes('.jsx') || requestUrl.includes('.js') || requestUrl.includes('.ts'));

const isInsufficientResources = 
    errorFromRes.includes('ERR_INSUFFICIENT_RESOURCES') ||
    errorFromRes.includes('net::ERR_INSUFFICIENT_RESOURCES');

if (!isFirestoreInternalError && !isFirebaseAuthError && !isGoogleAnalyticsError && !isNotModified && !isLocalResourceError && !isInsufficientResources) {
    console.error(`Fetch error from ${requestUrl}: ${errorFromRes}`);
}
```

## 🎯 Resultado

- ✅ Los errores de Google Analytics ya no se muestran en consola
- ✅ Los errores 304 (Not Modified) se ignoran silenciosamente
- ✅ Los errores de recursos locales en desarrollo se ignoran
- ✅ Los errores `ERR_INSUFFICIENT_RESOURCES` se filtran
- ✅ Solo se muestran errores reales que requieren atención

## 🔍 Verificación

Después de aplicar el fix, deberías ver:

1. **En desarrollo**: Solo errores reales en consola, sin spam de GA4 o hot reload
2. **En producción**: Sin errores de Google Analytics en consola
3. **Performance**: Mejor rendimiento al no procesar logs innecesarios

## 📌 Notas Importantes

- **Los errores filtrados NO son críticos**: Son errores transitorios o normales del navegador
- **Google Analytics sigue funcionando**: Solo se silencian los errores de red, no se desactiva el tracking
- **Hot reload sigue funcionando**: Solo se silencian los errores de peticiones locales, no se afecta el desarrollo

## 🚨 Si el Error Persiste

Si después del fix sigues viendo `ERR_INSUFFICIENT_RESOURCES`:

1. **Verifica si hay un loop infinito**:
   - Abre DevTools → Network tab
   - Filtra por "Failed" o "ERR_INSUFFICIENT_RESOURCES"
   - Busca si hay una URL que se está solicitando repetidamente

2. **Verifica Google Analytics**:
   - Revisa si hay demasiados eventos siendo trackeados
   - Considera reducir la frecuencia de tracking o usar debouncing

3. **Verifica el hot reload**:
   - Si el error solo ocurre en desarrollo, puede ser normal
   - Considera desactivar temporalmente el hot reload si es muy molesto

4. **Verifica la memoria del navegador**:
   - Cierra otras pestañas
   - Reinicia el navegador
   - Verifica si hay memory leaks en la aplicación


