# ✅ CHECKLIST DE VERIFICACIÓN: Landing Pages Internacionales

**Fecha**: 2026-01-03
**Problema Resuelto**: Pantalla oscura en landing pages /es /br /mx /ar

---

## 🔍 PROBLEMA IDENTIFICADO

Las landing pages internacionales se veían con **pantalla oscura** porque:

### ❌ **Causa Raíz**:
1. `<MainLayout>` agrega un **Header** de 4rem de altura
2. El Header empuja el contenido hacia abajo
3. Las landing pages NO tenían `marginTop: '-4rem'` para compensar
4. **Resultado**: Espacio negro arriba + contenido oculto debajo del Header

---

## ✅ SOLUCIÓN IMPLEMENTADA

### **Archivos Modificados** (4 landing pages):

1. ✅ `src/pages/SpainLandingPage.jsx`
2. ✅ `src/pages/BrazilLandingPage.jsx`
3. ✅ `src/pages/MexicoLandingPage.jsx`
4. ✅ `src/pages/ArgentinaLandingPage.jsx`

### **Cambio Aplicado**:

**ANTES** (pantalla oscura):
```jsx
<motion.div className="w-full relative overflow-hidden">
  {/* Sin compensación del Header */}
</motion.div>
```

**AHORA** (pantalla correcta):
```jsx
<motion.div
  className="w-full relative overflow-hidden"
  style={{
    marginTop: '-4rem',  // Compensa el Header
    zIndex: 1            // Asegura que esté encima
  }}
>
  {/* Hero visible desde arriba */}
</motion.div>
```

---

## 📋 VERIFICACIÓN PASO A PASO

### **1. Reinicia el servidor de desarrollo**:
```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo:
npm run dev
```

### **2. Prueba CADA landing page en localhost**:

#### ✅ **España** - http://localhost:5173/es
- [ ] Hero visible desde arriba (sin espacio negro)
- [ ] Header visible
- [ ] Footer visible
- [ ] Imágenes del carrusel cargando
- [ ] Texto legible sobre la imagen

#### ✅ **Brasil** - http://localhost:5173/br
- [ ] Hero visible desde arriba (sin espacio negro)
- [ ] Header visible
- [ ] Footer visible
- [ ] Imágenes del carrusel cargando
- [ ] Texto legible sobre la imagen

#### ✅ **México** - http://localhost:5173/mx
- [ ] Hero visible desde arriba (sin espacio negro)
- [ ] Header visible
- [ ] Footer visible
- [ ] Imágenes del carrusel cargando
- [ ] Texto legible sobre la imagen

#### ✅ **Argentina** - http://localhost:5173/ar
- [ ] Hero visible desde arriba (sin espacio negro)
- [ ] Header visible
- [ ] Footer visible
- [ ] Imágenes del carrusel cargando
- [ ] Texto legible sobre la imagen

---

## 🎨 QUÉ DEBERÍAS VER

### **Antes (Pantalla Oscura)**:
```
+----------------------+
|  HEADER              |  ← Header del MainLayout
+----------------------+
|                      |
|   ESPACIO NEGRO      |  ← Espacio vacío
|                      |
+----------------------+
|  Imagen muy abajo    |  ← Hero empujado hacia abajo
```

### **Ahora (Pantalla Correcta)**:
```
+----------------------+
|  HEADER (floating)   |  ← Header transparente encima
+----------------------+
|                      |
|   HERO CON IMAGEN    |  ← Hero desde arriba
|   Texto legible      |
|   CTA visible        |
+----------------------+
```

---

## 🔧 SI AÚN SE VE OSCURO

### **1. Verifica que el servidor se reinició**:
```bash
# Ctrl+C para detener
npm run dev
```

### **2. Limpia caché del navegador**:
- **Chrome/Edge**: Ctrl + Shift + R (hard reload)
- **Firefox**: Ctrl + F5

### **3. Verifica en modo incógnito**:
- Abre ventana incógnita
- Ve a http://localhost:5173/es
- Debería verse perfecto

### **4. Verifica en consola del navegador** (F12):
Busca errores en rojo. Si hay errores de imágenes:
```javascript
Error cargando imagen: /MODELO 1.jpeg
```
→ Las imágenes no están en la carpeta `public/`

---

## 📸 IMÁGENES ESPERADAS

Las landing pages buscan estas imágenes en `/public`:
```
/MODELO 1.jpeg
/MODELO 2.jpeg
/MODELO 3.jpeg
/MODELO 4.jpeg
/MODELO 5.jpeg
```

**Si no existen**: No es crítico, pero el carrusel no funcionará.

---

## ✅ CONFIRMACIÓN FINAL

Una vez que TODAS las páginas se vean bien, marca aquí:

- [ ] **España (/es)** - Hero visible, sin pantalla oscura
- [ ] **Brasil (/br)** - Hero visible, sin pantalla oscura
- [ ] **México (/mx)** - Hero visible, sin pantalla oscura
- [ ] **Argentina (/ar)** - Hero visible, sin pantalla oscura

---

## 🚨 TROUBLESHOOTING

### **Problema: Aún se ve oscuro**
**Solución**: Verifica que los archivos se guardaron correctamente
```bash
git status
# Deberías ver:
# modified:   src/pages/SpainLandingPage.jsx
# modified:   src/pages/BrazilLandingPage.jsx
# modified:   src/pages/MexicoLandingPage.jsx
# modified:   src/pages/ArgentinaLandingPage.jsx
```

### **Problema: Header duplicado**
**Solución**: Esto es normal, el Header está flotando encima del hero

### **Problema: Imágenes no cargan**
**Solución**: Verifica que las imágenes están en `public/MODELO X.jpeg`

---

## 📊 COMPARACIÓN ANTES/DESPUÉS

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| **Hero visible** | ❌ Empujado hacia abajo | ✅ Desde arriba |
| **Espacio negro** | ❌ 4rem de negro | ✅ Sin espacio |
| **Header** | ❌ Oculto/raro | ✅ Flotando encima |
| **Footer** | ✅ Visible | ✅ Visible |
| **Overlay** | ❌ Muy oscuro (70%) | ✅ Optimizado (50%) |

---

## 🎯 RESULTADO ESPERADO

Al abrir http://localhost:5173/es deberías ver:

1. **Header transparente** flotando arriba
2. **Hero con imagen de modelo** ocupando toda la pantalla
3. **Texto legible** sobre la imagen (gradiente)
4. **Botón "Chatear Ahora"** visible y funcional
5. **Sin espacios negros** en la parte superior

**Igual que la landing /global** que sí funciona ✅

---

**Si TODO funciona**: ¡Problema resuelto! 🎉
**Si algo falla**: Copia el error de la consola y avísame 🔧
