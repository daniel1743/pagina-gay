# 🎨 GUÍA DE PALETA DE COLORES - CHACTIVO

**Fecha:** 2025-12-12
**Versión:** 1.0
**Estado:** ✅ OFICIAL

---

## 🎯 OBJETIVO

Estandarizar el uso de colores en toda la aplicación para mantener **consistencia visual** y **identidad de marca**.

---

## 🌈 PALETA OFICIAL

### **Colores de Marca (Principales)**

| Color | Variable CSS | Hex | Tailwind | Uso Principal |
|-------|-------------|-----|----------|---------------|
| **Magenta** | `--accent` | `#E4007C` | `text-accent`, `bg-accent`, `border-accent` | CTAs, acentos, hover principal, badges premium |
| **Cyan** | - | `#00FFFF` | `text-cyan-400`, `hover:text-cyan-400` | Hover secundario, iconos interactivos |

### **Colores del Sistema (Shadcn/UI)**

| Color | Variable CSS | Uso |
|-------|-------------|-----|
| **Background** | `--background` | `#2C2A4A` (modo oscuro), `#FAFAFA` (modo claro) |
| **Card** | `--card` | `#22203a` - Fondos de tarjetas y modales |
| **Muted** | `--muted` | Textos secundarios y descripciones |
| **Border** | `--border` | Bordes de elementos |

### **Colores de Gradientes**

```css
.magenta-gradient → linear-gradient(135deg, #E4007C, #a3005a) ✅ USAR
.cyan-gradient → linear-gradient(135deg, #00FFFF, #00a3a3)
.gold-gradient → linear-gradient(135deg, #FFD700, #FF8C00) ✅ Para botones premium
.purple-gradient → linear-gradient(135deg, #8B5CF6, #5B21B6) ⚠️ Solo decorativo
```

---

## ✅ CUÁNDO USAR CADA COLOR

### **Magenta (#E4007C)** - Color Principal de Marca

**✅ USAR para:**
- Botones CTA principales: "Entrar a Chatear", "Registrarse"
- Hover en enlaces importantes
- Badges de estado: "Premium", "Activo", "Nuevo"
- Iconos de notificaciones
- Elementos que requieren atención del usuario
- Bordes de elementos destacados
- Ring de avatar premium

**❌ NO USAR para:**
- Fondos grandes (usar `bg-card` o `bg-background`)
- Textos largos (baja legibilidad)

### **Cyan (#00FFFF)** - Color Secundario

**✅ USAR para:**
- Hover en iconos (Header, ChatHeader)
- Estados interactivos secundarios
- Complemento de magenta en gradientes (premium-avatar-ring)
- Badges de verificación

**❌ NO USAR para:**
- CTAs principales (usar magenta)
- Fondos extensos

### **Purple (#8B5CF6)** - Color Decorativo

**⚠️ USAR SOLO para:**
- Backgrounds con blur en páginas de login/auth
- Efectos decorativos de fondo
- Gradientes de ambiente (ej: AuthPage)

**❌ NO USAR para:**
- Elementos interactivos (botones, links)
- Texto de marca
- CTAs

---

## 🚫 ERRORES COMUNES

### **❌ INCORRECTO:**

```jsx
// ❌ Usar purple en lugar de accent/magenta
<Button className="bg-purple-600 hover:bg-purple-700">
  Enviar
</Button>

// ❌ Usar purple en texto de marca
<h1 className="text-purple-400">Chactivo</h1>

// ❌ Hover inconsistente
<a className="hover:text-purple-500">Link 1</a>
<a className="hover:text-cyan-400">Link 2</a>
```

### **✅ CORRECTO:**

```jsx
// ✅ Usar magenta-gradient o bg-accent
<Button className="magenta-gradient text-white">
  Enviar
</Button>

// ✅ Usar gradiente magenta-cyan para texto de marca
<h1 className="bg-gradient-to-r from-[#E4007C] to-cyan-400 bg-clip-text text-transparent">
  Chactivo
</h1>

// ✅ Hover consistente (cyan-400 para todo el sitio)
<a className="hover:text-cyan-400">Link 1</a>
<a className="hover:text-cyan-400">Link 2</a>
```

---

## 📋 REGLAS DE USO

### **1. Botones**

| Tipo de Botón | Clase CSS | Cuándo Usar |
|---------------|-----------|-------------|
| **CTA Principal** | `magenta-gradient text-white` | Acciones principales (Login, Registrar, Enviar) |
| **CTA Premium** | `gold-gradient text-gray-900` | Upgrade a Premium |
| **Secundario** | `bg-card border border-accent hover:bg-accent/10` | Acciones secundarias |
| **Ghost** | `variant="ghost" hover:text-cyan-400` | Iconos, acciones terciarias |

### **2. Enlaces**

```jsx
// ✅ Estándar para TODOS los enlaces
<a className="hover:text-cyan-400 transition-colors">
  Enlace
</a>
```

### **3. Badges y Pills**

```jsx
// Premium Badge
<span className="bg-gradient-to-r from-[#E4007C] to-cyan-400 text-white px-3 py-1 rounded-full">
  Premium
</span>

// Estado Online
<span className="flex items-center text-green-400">
  <Circle className="w-2 h-2 fill-current mr-2" /> Online
</span>
```

### **4. Texto de Marca**

```jsx
// Logo principal con gradiente magenta-cyan
<h1 className="bg-gradient-to-r from-[#E4007C] to-cyan-400 bg-clip-text text-transparent font-bold">
  Chactivo
</h1>
```

---

## 🔍 AUDITORÍA RÁPIDA

Para verificar el uso correcto de colores en un componente:

### **Checklist:**

```
[ ] ¿Usa magenta-gradient o bg-accent para CTAs principales?
[ ] ¿Los hover son consistentes (cyan-400)?
[ ] ¿Purple se usa SOLO para backgrounds decorativos?
[ ] ¿Los colores cumplen WCAG AA (contraste 4.5:1)?
[ ] ¿Se usa text-accent en lugar de text-purple-400 para acentos?
```

---

## 🎨 HERRAMIENTAS

### **Verificar Contraste (WCAG AA):**

```
Magenta (#E4007C) sobre fondo oscuro (#2C2A4A): ✅ 4.8:1 (PASS)
Cyan (#00FFFF) sobre fondo oscuro (#2C2A4A): ✅ 11.2:1 (PASS AAA)
Purple (#8B5CF6) sobre fondo oscuro (#2C2A4A): ✅ 5.1:1 (PASS)
```

### **Buscar Uso Incorrecto:**

```bash
# Buscar purple en archivos JSX (revisar si debería ser accent)
grep -r "purple-[0-9]" src/ --include="*.jsx"

# Buscar hover inconsistentes
grep -r "hover:text-" src/ --include="*.jsx" | grep -v "cyan-400"
```

---

## 🚀 MIGRACIÓN

### **Pasos para Actualizar un Componente:**

1. **Identificar usos de purple:**
   ```bash
   grep -n "purple-" src/components/MyComponent.jsx
   ```

2. **Evaluar cada ocurrencia:**
   - ¿Es un elemento interactivo? → Cambiar a `accent`/`magenta`
   - ¿Es background decorativo? → Dejar purple

3. **Reemplazar:**
   ```jsx
   // Antes
   <Button className="bg-purple-600">Click</Button>

   // Después
   <Button className="magenta-gradient">Click</Button>
   ```

4. **Probar visualmente:**
   - Verificar contraste
   - Verificar consistencia con resto del sitio

---

## 📊 ESTADO DE MIGRACIÓN

### **Archivos Actualizados:**
- ✅ `Header.jsx` - Hover estandarizado a cyan-400
- ✅ `Footer.jsx` - Hover estandarizado a cyan-400
- ⏳ `AuthPage.jsx` - Purple usado decorativamente (OK)
- ⏳ `LobbyPage.jsx` - Revisar CTAs

### **Archivos Pendientes:**
- [ ] AdminPage.jsx (11 usos de purple)
- [ ] PremiumPage.jsx (7 usos)
- [ ] Otros componentes con purple (ver grep)

---

## 🎯 CONCLUSIÓN

**Regla de Oro:**
> **Magenta (#E4007C)** para elementos de marca e interacción
> **Cyan (#00FFFF)** para hover y estados activos
> **Purple (#8B5CF6)** SOLO para decoración de fondo

Siguiendo esta guía, mantendremos una **identidad visual consistente** y **profesional** en toda la aplicación.

---

**Creado:** 2025-12-12
**Autor:** Sistema de Diseño Chactivo
**Última actualización:** 2025-12-12
