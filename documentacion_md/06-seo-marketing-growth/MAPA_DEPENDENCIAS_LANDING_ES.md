# 🗺️ MAPA DE DEPENDENCIAS - SpainLandingPage (/es)

## 📊 RESUMEN EJECUTIVO
**Total de archivos conectados: ~25-30 archivos**

---

## 🔴 NIVEL 1: IMPORTS DIRECTOS (10 archivos)

### 1. **React Core**
- `react` (librería externa)
- `react-router-dom` (librería externa)

### 2. **Librerías de UI**
- `framer-motion` (librería externa)
- `lucide-react` (librería externa)

### 3. **Componentes UI Locales**
- `@/components/ui/button` → `src/components/ui/button.jsx`
- `@/components/landing/ChatDemo` → `src/components/landing/ChatDemo.jsx`
- `@/components/auth/GuestUsernameModal` → `src/components/auth/GuestUsernameModal.jsx`
- `@/components/auth/EntryOptionsModal` → `src/components/auth/EntryOptionsModal.jsx`

### 4. **Contextos y Hooks**
- `@/contexts/AuthContext` → `src/contexts/AuthContext.jsx`
- `@/hooks/useCanonical` → `src/hooks/useCanonical.js`

---

## 🟡 NIVEL 2: DEPENDENCIAS DE COMPONENTES (15-20 archivos)

### **ChatDemo.jsx** (3 dependencias)
```
ChatDemo
├── react
├── framer-motion
└── lucide-react
```
**✅ SIMPLE - Sin dependencias locales complejas**

---

### **Button.jsx** (4 dependencias)
```
Button
├── @/lib/utils → src/lib/utils.ts/js
├── @radix-ui/react-slot
├── class-variance-authority
└── react
```
**⚠️ DEPENDENCIA CRÍTICA: `@/lib/utils` (cn function)**

---

### **GuestUsernameModal.jsx** (10+ dependencias)
```
GuestUsernameModal
├── react
├── react-router-dom
├── framer-motion
├── @/components/ui/dialog → src/components/ui/dialog.jsx
│   ├── @radix-ui/react-dialog
│   └── @/lib/utils
├── @/components/ui/button → src/components/ui/button.jsx
├── @/components/ui/input → src/components/ui/input.jsx
├── @/components/ui/use-toast → src/components/ui/use-toast.ts
├── lucide-react
└── @/contexts/AuthContext → src/contexts/AuthContext.jsx
    ├── firebase/auth
    ├── firebase/firestore
    ├── @/config/firebase → src/config/firebase.js
    ├── @/services/userService → src/services/userService.js
    ├── @/services/analyticsService → src/services/analyticsService.js
    ├── @/services/ga4Service → src/services/ga4Service.js
    ├── @/services/verificationService → src/services/verificationService.js
    ├── @/services/sanctionsService → src/services/sanctionsService.js
    ├── @/services/systemNotificationsService → src/services/systemNotificationsService.js
    └── @/components/ui/use-toast
```

**🔴 COMPONENTE COMPLEJO - Muchas dependencias de servicios**

---

### **EntryOptionsModal.jsx** (6 dependencias)
```
EntryOptionsModal
├── react
├── react-router-dom
├── @/components/ui/dialog → src/components/ui/dialog.jsx
├── @/components/ui/button → src/components/ui/button.jsx
└── lucide-react
```
**✅ RELATIVAMENTE SIMPLE**

---

### **AuthContext.jsx** (15+ dependencias)
```
AuthContext
├── react
├── firebase/auth
├── firebase/firestore
├── @/config/firebase → src/config/firebase.js
│   ├── firebase/app
│   ├── firebase/auth
│   ├── firebase/firestore
│   └── firebase/storage (posible)
├── @/services/userService → src/services/userService.js
│   ├── firebase/firestore
│   └── @/config/firebase
├── @/services/analyticsService → src/services/analyticsService.js
├── @/services/ga4Service → src/services/ga4Service.js
├── @/services/verificationService → src/services/verificationService.js
├── @/services/sanctionsService → src/services/sanctionsService.js
├── @/services/systemNotificationsService → src/services/systemNotificationsService.js
└── @/components/ui/use-toast → src/components/ui/use-toast.ts
```

**🔴 CONTEXTO CRÍTICO - Depende de Firebase y múltiples servicios**

---

### **useCanonical.js** (2 dependencias)
```
useCanonical
├── react
└── react-router-dom
```
**✅ MUY SIMPLE**

---

## 🟢 NIVEL 3: DEPENDENCIAS DE SERVICIOS (5-10 archivos adicionales)

### **Firebase Config**
- `src/config/firebase.js` → Depende de variables de entorno y configuración Firebase

### **Servicios**
- `src/services/userService.js`
- `src/services/analyticsService.js`
- `src/services/ga4Service.js`
- `src/services/verificationService.js`
- `src/services/sanctionsService.js`
- `src/services/systemNotificationsService.js`

---

## 🔵 NIVEL 4: DEPENDENCIAS DE UTILIDADES (2-3 archivos)

### **Utils**
- `src/lib/utils.ts` o `src/lib/utils.js` → Función `cn()` para clases CSS

### **Toast System**
- `src/components/ui/use-toast.ts` → Sistema de notificaciones

---

## 📋 ARCHIVOS CRÍTICOS PARA DEBUGGING

### 🔴 **ALTA PRIORIDAD** (Verificar primero)
1. `src/contexts/AuthContext.jsx` - Si falla, toda la página falla
2. `src/config/firebase.js` - Si Firebase no está configurado, AuthContext falla
3. `src/components/auth/GuestUsernameModal.jsx` - Componente complejo con muchas dependencias
4. `src/lib/utils.ts/js` - Si `cn()` no existe, Button falla

### 🟡 **MEDIA PRIORIDAD**
5. `src/components/ui/dialog.jsx` - Usado por modales
6. `src/components/ui/button.jsx` - Usado en toda la página
7. `src/components/landing/ChatDemo.jsx` - Componente visual principal

### 🟢 **BAJA PRIORIDAD**
8. `src/hooks/useCanonical.js` - Solo afecta SEO, no renderizado
9. `src/components/auth/EntryOptionsModal.jsx` - Solo se muestra al hacer clic

---

## 🎯 ESTRATEGIA DE SEGMENTACIÓN

### **Fase 1: Aislar Componentes Visuales**
```jsx
// Comentar temporalmente en SpainLandingPage.jsx
// import ChatDemo from '@/components/landing/ChatDemo';
// import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
// import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';
```

### **Fase 2: Aislar Contexto**
```jsx
// Comentar temporalmente
// const { user } = useAuth();
// Reemplazar con: const user = null;
```

### **Fase 3: Aislar Hooks**
```jsx
// Comentar temporalmente
// useCanonical('/es');
```

### **Fase 4: Verificar Dependencias Externas**
- Verificar que `framer-motion` esté instalado
- Verificar que `lucide-react` esté instalado
- Verificar que `@radix-ui/react-dialog` esté instalado
- Verificar que `class-variance-authority` esté instalado

---

## 🔍 CHECKLIST DE VERIFICACIÓN

- [ ] ¿Firebase está configurado correctamente?
- [ ] ¿Todos los servicios existen y están exportando correctamente?
- [ ] ¿`src/lib/utils` existe y exporta `cn`?
- [ ] ¿Todos los componentes UI existen?
- [ ] ¿Las dependencias de npm están instaladas?
- [ ] ¿Hay errores en la consola del navegador?
- [ ] ¿El ErrorBoundary está capturando errores?

---

## 📝 NOTAS

1. **El componente más complejo es `GuestUsernameModal`** - Tiene 10+ dependencias
2. **`AuthContext` es crítico** - Si falla, toda la autenticación falla
3. **Firebase es la dependencia externa más crítica** - Si no está configurado, nada funciona
4. **Los componentes UI son relativamente simples** - Menos probabilidad de error

---

## 🚀 PRÓXIMOS PASOS

1. Verificar que todos los archivos listados existan
2. Verificar que todas las exportaciones sean correctas
3. Revisar la consola del navegador para errores específicos
4. Aislar componentes uno por uno para identificar el problema

