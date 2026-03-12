# ✅ Checklist de Testing - Modo Claro

## 🎯 Objetivo
Verificar que todos los elementos sean **claramente visibles y legibles** en modo claro sin comprometer el diseño oscuro.

---

## 📋 Testing Manual - Lobby Page

### 1. **Cards de Features** (6 tarjetas principales)

#### Visual:
- [ ] **Fondo de card**: ¿Es blanco puro y se distingue del gris del background?
- [ ] **Bordes**: ¿Son claramente visibles (gris medio)?
- [ ] **Sombras**: ¿Hay sombra sutil alrededor de la card?
- [ ] **Separación**: ¿Las cards se ven como elementos independientes?

#### Hover:
- [ ] **Elevación**: ¿La card se eleva -6px al hacer hover?
- [ ] **Sombra aumentada**: ¿La sombra se vuelve más pronunciada?
- [ ] **Borde hover**: ¿El borde cambia de color sutilmente?
- [ ] **Cursor**: ¿Se muestra pointer indicando que es clickeable?

#### Texto:
- [ ] **Título**: ¿Es negro profundo y legible instantáneamente?
- [ ] **Descripción**: ¿Es gris medio (no claro) y fácil de leer?
- [ ] **Stats**: ¿El texto es suficientemente oscuro?
- [ ] **Jerarquía**: ¿Se diferencia claramente título > descripción > stats?

#### Iconos:
- [ ] **Fondo del icono**: ¿Es de color (cyan-100, purple-100, etc)?
- [ ] **Icono**: ¿Es oscuro (cyan-700, purple-700) y claramente visible?
- [ ] **Borde del contenedor**: ¿Es visible pero sutil?

#### Badges:
- [ ] **Badge "Activo"**: ¿Fondo cyan-100 con texto cyan-800?
- [ ] **Badge "Nuevo"**: ¿Fondo pink-100 con texto pink-700?
- [ ] **Badge "Popular"**: ¿Fondo purple-100 con texto purple-700?
- [ ] **Iconos del badge**: ¿Se ven claramente?
- [ ] **Contraste total**: ¿Puedes leer el badge sin esfuerzo?

#### Flecha:
- [ ] **Color**: ¿Es oscura (cyan-700, purple-700)?
- [ ] **Animación**: ¿Se mueve 4px a la derecha en hover?
- [ ] **Visible**: ¿Se distingue claramente del fondo?

---

### 2. **Título "Explora Chactivo"**

- [ ] **Gradiente**: ¿Se ve vibrante pero no demasiado claro?
- [ ] **Legibilidad**: ¿Los colores cyan-600, purple-600, pink-600 son visibles?
- [ ] **Subtítulo**: ¿El texto gris es legible?

---

### 3. **Background General**

- [ ] **Color de fondo**: ¿Es gris muy claro (no blanco puro)?
- [ ] **Contraste con cards**: ¿Hay separación visual clara?
- [ ] **Texto general**: ¿Todo el texto negro/gris oscuro es legible?

---

## 🌓 Testing de Cambio de Tema

### Cambio Dark → Light:
1. Abre la app en modo oscuro
2. Cambia a modo claro (toggle de tema)
3. Verifica:
   - [ ] **Sin flash blanco**: La transición es suave
   - [ ] **Todos los elementos visible**: Nada desaparece
   - [ ] **Colores coherentes**: Los badges cambian correctamente
   - [ ] **Sombras aparecen**: Las cards tienen profundidad

### Cambio Light → Dark:
1. Abre la app en modo claro
2. Cambia a modo oscuro
3. Verifica:
   - [ ] **Glassmorphism activado**: Cards semitransparentes
   - [ ] **Badges pastel**: Colores con /20 opacity
   - [ ] **Glow effects**: Sombras de color en hover
   - [ ] **Texto claro**: Todo en blanco/gris claro

---

## 📱 Testing Responsive (Modo Claro)

### Mobile (375px):
- [ ] Cards ocupan 1 columna
- [ ] Texto legible sin zoom
- [ ] Badges visibles y no cortados
- [ ] Touch targets mínimo 44x44px

### Tablet (768px):
- [ ] Cards en 2 columnas
- [ ] Espaciado adecuado
- [ ] Hover states funcionan en touch

### Desktop (1280px+):
- [ ] Cards en 3 columnas
- [ ] Card principal (primary) ocupa 2 espacios
- [ ] Hover elevación claramente visible

---

## 🎨 Testing de Colores por Acento

### Cyan (Salas de Chat):
- [ ] **Badge**: Fondo cyan-100, texto cyan-800
- [ ] **Icono**: Fondo cyan-100, icono cyan-700
- [ ] **Flecha**: cyan-700

### Purple (Explora Comunidades):
- [ ] **Badge**: Fondo purple-100, texto purple-700
- [ ] **Icono**: Fondo purple-100, icono purple-700
- [ ] **Flecha**: purple-700

### Orange (Centro de Seguridad):
- [ ] **Icono**: Fondo orange-100, icono orange-700
- [ ] **Flecha**: orange-700

### Green (Eventos, Salud):
- [ ] **Icono**: Fondo green-100, icono green-700
- [ ] **Flecha**: green-700

---

## 🔍 Testing de Accesibilidad

### Contraste Automático (Chrome DevTools):
1. Abre DevTools (F12)
2. Click derecho en cualquier texto > Inspect
3. En panel Styles, busca el color
4. Verifica que aparezca ✅ verde (WCAG AA pass)

### Elementos críticos a verificar:
- [ ] **Títulos H2**: Ratio ≥ 7:1 (AAA)
- [ ] **Títulos H3 (cards)**: Ratio ≥ 7:1 (AAA)
- [ ] **Descripción**: Ratio ≥ 4.5:1 (AA)
- [ ] **Stats/labels**: Ratio ≥ 4.5:1 (AA)
- [ ] **Badges**: Ratio ≥ 4.5:1 (AA)
- [ ] **Bordes**: Ratio ≥ 3:1 (AA para elementos no-texto)

### Navegación por Teclado:
- [ ] Tab recorre todas las cards
- [ ] Focus visible (outline claro)
- [ ] Enter/Space activa la card
- [ ] Escape cierra modales

---

## 🐛 Problemas Comunes a Buscar

### ❌ ROJO (Crítico):
- [ ] Texto blanco sobre fondo blanco
- [ ] Bordes invisibles (white/[0.08] en light)
- [ ] Badges con opacidad /20 en light
- [ ] Iconos pastel (cyan-400) sobre blanco
- [ ] Sin sombras en cards (se pierden en fondo)

### ⚠️ AMARILLO (Advertencia):
- [ ] Texto gris muy claro (< ratio 4.5:1)
- [ ] Bordes muy tenues
- [ ] Sombras demasiado sutiles
- [ ] Gradientes apenas visibles

### ✅ VERDE (Correcto):
- [ ] Texto negro/gris oscuro sobre blanco
- [ ] Bordes grises visibles (70% lightness)
- [ ] Sombras Material Design claras
- [ ] Badges con colores sólidos (100-800)
- [ ] Iconos oscuros sobre fondos claros

---

## 📊 Checklist de Comparación

| Elemento | Modo Dark ✅ | Modo Light ✅ | Notas |
|----------|-------------|--------------|-------|
| Card Background | Glassmorphism | Blanco sólido | ✓ |
| Card Border | white/20 | gray-300 | ✓ |
| Título | white | gray-900 | ✓ |
| Descripción | gray-400 | gray-600 | ✓ |
| Badge BG | color/20 | color-100 | ✓ |
| Badge Text | color-300 | color-800 | ✓ |
| Icon BG | color/10 | color-100 | ✓ |
| Icon Color | color-400 | color-700 | ✓ |
| Sombras | Glow colors | Material Design | ✓ |
| Bordes internos | white/5 | gray-200 | ✓ |

---

## 🚀 Comandos de Testing

### Test en diferentes navegadores:
```bash
# Chrome/Edge (mejor DevTools para contraste)
start chrome http://localhost:5173

# Firefox (mejor simulador daltonismo)
start firefox http://localhost:5173

# Navegador predeterminado
start http://localhost:5173
```

### Toggle tema rápido:
1. **Via UI**: Click en botón de sol/luna en la navbar
2. **Via DevTools**: `document.documentElement.classList.toggle('light')`
3. **Via Lighthouse**: Ejecutar audit de accesibilidad

### Verificar ratio de contraste:
```javascript
// En consola del navegador
const computeContrast = (fg, bg) => {
  // Copiar de: https://webaim.org/resources/contrastchecker/
  // O usar extensión: "WCAG Color contrast checker"
}
```

---

## ✅ Criterios de Aceptación

Para considerar el modo claro **APROBADO**, todos estos deben cumplirse:

1. **Visibilidad Total**: Cada elemento es visible sin esfuerzo visual
2. **WCAG AA**: Todos los textos cumplen ratio mínimo 4.5:1
3. **Jerarquía Clara**: Títulos > Descripción > Stats visualmente diferenciados
4. **Sombras Profesionales**: Cards tienen profundidad sin ser excesivas
5. **Badges Legibles**: 100% de legibilidad instantánea
6. **Coherencia**: Colores consistentes entre accentColors
7. **No Regresión Dark**: Modo oscuro sigue perfecto después de cambios
8. **Performance**: Sin flashes, transiciones suaves

---

## 🎯 Próximo Testing Session

Después de verificar el checklist:

1. **Captura screenshots** de modo claro vs oscuro
2. **Ejecuta Lighthouse** (target: 100 en Accesibilidad)
3. **Prueba con usuarios reales** (feedback cualitativo)
4. **Test en dispositivos móviles** (iOS Safari, Android Chrome)

---

**Última actualización**: 2025-12-18
**Estado**: ✅ Implementación completa, pendiente de testing manual
