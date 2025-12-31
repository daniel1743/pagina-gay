# 🔍 Diagnóstico: Pantalla Oscura en `/br` (Brazil Landing Page)

**Fecha:** 2025-01-XX  
**Problema:** La página `/br` muestra pantalla oscura sin contenido  
**URL:** `http://localhost:3000/br`

---

## ✅ Verificación del Código

### Estado del Código:
- ✅ `BrazilLandingPage.jsx` está completo (265 líneas)
- ✅ `export default` presente
- ✅ Estructura idéntica a `SpainLandingPage.jsx` (que funciona)
- ✅ Imports correctos
- ✅ Rutas configuradas en `App.jsx` (línea 107)
- ✅ Build exitoso sin errores

### Comparación con SpainLandingPage:
| Aspecto | SpainLandingPage | BrazilLandingPage | Estado |
|---------|------------------|-------------------|---------|
| Estructura JSX | ✅ Completa | ✅ Completa | ✅ Idéntica |
| Hooks (useState, useEffect) | ✅ Correctos | ✅ Correctos | ✅ Idénticos |
| Imports | ✅ Correctos | ✅ Correctos | ✅ Idénticos |
| Export default | ✅ Presente | ✅ Presente | ✅ Idéntico |
| Clases Tailwind | ✅ Correctas | ✅ Correctas | ✅ Idénticas |

**Conclusión:** El código es correcto. El problema NO es de sintaxis.

---

## 🔍 Posibles Causas

### 1. **Error de JavaScript en Runtime** (MÁS PROBABLE)
- Un error silencioso está rompiendo el render
- El componente se monta pero falla antes de mostrar contenido
- **Solución:** Revisar consola del navegador (F12)

### 2. **Problema con LandingRoute**
- `LandingRoute` podría estar redirigiendo incorrectamente
- Si `user` existe y no es guest, redirige a `/home`
- **Verificar:** ¿Estás logueado? Si sí, te redirige automáticamente

### 3. **Problema con MainLayout**
- `MainLayout` podría no estar renderizando correctamente
- **Verificar:** ¿Otras landing pages funcionan? (`/es`, `/mx`, `/ar`)

### 4. **Problema con CSS/Tailwind**
- Variables CSS no cargadas
- `bg-background` y `text-foreground` no aplican colores
- **Síntoma:** Pantalla oscura = fondo oscuro sin contenido visible

---

## 🛠️ Pasos de Diagnóstico

### Paso 1: Abrir Consola del Navegador
1. Presiona **F12** o **Ctrl+Shift+I**
2. Ve a la pestaña **"Console"**
3. Recarga la página (`Ctrl+R` o `F5`)
4. **Busca errores en rojo**

**Errores comunes:**
- `Cannot read property 'X' of undefined`
- `Module not found`
- `TypeError`
- `ReferenceError`

### Paso 2: Verificar Redirección
1. Abre la pestaña **"Network"** en DevTools
2. Recarga la página
3. **Busca:**
   - ¿Hay una redirección a `/home`?
   - ¿El status code es `302` o `307`?

**Si hay redirección:**
- Estás logueado y `LandingRoute` te está redirigiendo
- **Solución:** Cerrar sesión o usar modo incógnito

### Paso 3: Verificar Renderizado
1. En DevTools, ve a **"Elements"** o **"Inspector"**
2. Busca el elemento `<div className="min-h-screen bg-background text-foreground">`
3. **Verifica:**
   - ¿Existe el elemento?
   - ¿Tiene contenido dentro?
   - ¿Las clases CSS están aplicadas?

**Si el elemento existe pero está vacío:**
- El componente se monta pero no renderiza contenido
- Posible error en algún hook o componente hijo

### Paso 4: Comparar con Otra Landing
1. Abre `http://localhost:3000/es` (España)
2. **Compara:**
   - ¿España funciona?
   - ¿Brasil no funciona?
   - ¿Ambas tienen el mismo problema?

**Si España funciona pero Brasil no:**
- Problema específico de `BrazilLandingPage.jsx`
- Revisar diferencias en el código

**Si ambas tienen el mismo problema:**
- Problema general (MainLayout, LandingRoute, AuthContext)
- Revisar configuración global

---

## 🔧 Soluciones Rápidas

### Solución 1: Limpiar Cache y Recargar
```bash
# En el navegador:
Ctrl + Shift + R  (Hard reload)
# O
Ctrl + F5
```

### Solución 2: Verificar Servidor
```bash
# Verificar que el servidor esté corriendo
netstat -ano | findstr ":3000"
```

### Solución 3: Reiniciar Servidor
```bash
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### Solución 4: Verificar Autenticación
- Si estás logueado, `LandingRoute` te redirige a `/home`
- **Solución:** Cerrar sesión o usar modo incógnito

---

## 📋 Checklist de Verificación

- [ ] Consola del navegador sin errores
- [ ] No hay redirección a `/home`
- [ ] Elemento `<div className="min-h-screen...">` existe en DOM
- [ ] Elemento tiene contenido dentro
- [ ] CSS está aplicado (verificar en DevTools)
- [ ] Otras landing pages funcionan (`/es`, `/mx`, `/ar`)
- [ ] Servidor de desarrollo corriendo en puerto 3000
- [ ] No estás logueado (o estás en modo incógnito)

---

## 🎯 Próximos Pasos

**Si encuentras un error en la consola:**
1. Copia el mensaje de error completo
2. Compártelo para diagnóstico específico

**Si no hay errores pero sigue en blanco:**
1. Verifica que no estés logueado
2. Compara con `/es` que debería funcionar
3. Revisa si hay diferencias en el código

**Si el problema persiste:**
- Podría ser un problema de hot-reload
- Reiniciar el servidor de desarrollo
- Limpiar cache del navegador

---

**Fin del Documento**

