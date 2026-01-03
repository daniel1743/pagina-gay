# 🔴 PROBLEMA CRÍTICO: AuthContext causa Loop Infinito

**Fecha**: 2026-01-03
**Problema**: Landing pages `/es` `/br` `/mx` `/ar` muestran pantalla oscura/negra
**Causa Raíz**: `AuthContext.jsx` está causando un **loop infinito de re-renders**

---

## 🔍 DIAGNÓSTICO COMPLETO

### Pruebas Realizadas (en orden)

1. ✅ **Landing pages tienen código correcto**
   - SpainLandingPage.jsx tiene `marginTop: '-4rem'` ✓
   - BrazilLandingPage.jsx tiene `marginTop: '-4rem'` ✓
   - MexicoLandingPage.jsx tiene `marginTop: '-4rem'` ✓
   - ArgentinaLandingPage.jsx tiene `marginTop: '-4rem'` ✓

2. ✅ **React Router funciona**
   - Router detecta ruta `/es` correctamente
   - Routes se ejecuta
   - No hay problema de routing

3. ✅ **ThemeProvider funciona**
   - Test con solo ThemeProvider → Pantalla VERDE ✓
   - ThemeProvider NO causa problemas

4. ❌ **AuthProvider es el culpable**
   - Test SIN AuthProvider → Pantalla AZUL (funciona) ✓
   - Test CON AuthProvider → Loop infinito, pantalla oscura ✗

---

## 📊 EVIDENCIA DEL LOOP INFINITO

### Logs que demuestran el problema:

```
🛣️ [APP ROUTES] Renderizando rutas...
📍 [APP ROUTES] URL actual: /es
🛣️ [APP ROUTES] Renderizando rutas...  ← SE REPITE INFINITAMENTE
📍 [APP ROUTES] URL actual: /es
🛣️ [APP ROUTES] Renderizando rutas...  ← OTRA VEZ
📍 [APP ROUTES] URL actual: /es
```

**AppRoutes se renderiza múltiples veces en bucle**, impidiendo que React complete el render.

---

## 🎯 CAUSA RAÍZ: AuthContext.jsx

El archivo `src/contexts/AuthContext.jsx` tiene un problema que causa re-renders infinitos.

### Problemas comunes en AuthContext que causan loops:

1. **useEffect sin dependencias correctas**
   ```javascript
   // ❌ MAL - Causa loop
   useEffect(() => {
     setUser(someValue);  // Actualiza state
   }, [user]); // Depende del state que actualiza = LOOP
   ```

2. **onAuthStateChanged sin cleanup**
   ```javascript
   // ❌ MAL - Se subscribe múltiples veces
   useEffect(() => {
     onAuthStateChanged(auth, (user) => {
       setUser(user);
     });
     // FALTA: return () => unsubscribe();
   }, []);
   ```

3. **Objetos creados en cada render**
   ```javascript
   // ❌ MAL - Crea nuevo objeto cada vez
   const value = {
     user,
     login: async () => {},
     logout: async () => {}
   };
   // Debería usar useMemo
   ```

---

## ✅ SOLUCIÓN

### Opción 1: Arreglar AuthContext.jsx (RECOMENDADO)

Necesitas revisar `src/contexts/AuthContext.jsx` línea por línea y arreglar:

1. **Verificar useEffect con onAuthStateChanged** (aproximadamente línea 44-100):
   ```javascript
   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
       // ... código
     });

     return () => unsubscribe(); // ✅ CRÍTICO: Debe estar
   }, []); // ✅ Array vacío
   ```

2. **Usar useMemo para el value del context**:
   ```javascript
   const value = useMemo(() => ({
     user,
     loading,
     signUp,
     signIn,
     logout,
     // ... otras funciones
   }), [user, loading]); // Solo depende de user y loading
   ```

3. **Evitar setUser dentro de useEffect que depende de user**:
   ```javascript
   // ❌ MAL
   useEffect(() => {
     if (user) {
       setUser({ ...user, newProp: true });
     }
   }, [user]); // LOOP!

   // ✅ BIEN
   useEffect(() => {
     if (user) {
       // Operación que NO llama setUser
     }
   }, [user]);
   ```

### Opción 2: Usar AuthContext de otra landing page que funcione

Si tienes otras landing pages que SÍ funcionan (como `/global`), revisa qué AuthContext están usando y úsalo para las internacionales.

---

## 🔧 CAMBIOS TEMPORALES APLICADOS (REVERTIR DESPUÉS)

Mientras arreglas el AuthContext, he hecho estos cambios TEMPORALES en `App.jsx`:

```javascript
// 🔧 TEMPORAL - Comentado el AuthContext original
// import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// 🔧 TEMPORAL - SimpleAuthProvider básico (sin funcionalidad completa)
const AuthContext = React.createContext(null);

function SimpleAuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const value = React.useMemo(() => ({
    user,
    loading,
    signInAsGuest: async () => {},
    signUp: async () => {},
    signIn: async () => {},
    logout: async () => {},
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

⚠️ **ADVERTENCIA**: Este `SimpleAuthProvider` es temporal y **NO tiene funcionalidad completa**.
- Login NO funciona
- Registro NO funciona
- Chat NO funciona

Solo sirve para probar que el problema está en AuthContext.

---

## 📋 PASOS PARA ARREGLAR DEFINITIVAMENTE

### 1. Hacer backup del AuthContext actual

```bash
cd "C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat"
cp src/contexts/AuthContext.jsx src/contexts/AuthContext.jsx.BACKUP
```

### 2. Revisar AuthContext.jsx línea por línea

Abre `src/contexts/AuthContext.jsx` y busca:

- [ ] **Línea ~44-100**: `useEffect` con `onAuthStateChanged`
  - ¿Tiene `return () => unsubscribe()`?
  - ¿El array de dependencias está vacío `[]`?

- [ ] **Línea donde se crea `value`**: ¿Usa `useMemo`?
  ```javascript
  const value = useMemo(() => ({...}), [dependencias]);
  ```

- [ ] **Cualquier `useEffect`** que:
  - Llama `setUser` o `setLoading`
  - Tiene `user` o `loading` en sus dependencias
  - → Potencial LOOP

### 3. Aplicar los fixes

Ejemplo de fix típico:

```javascript
// ANTES ❌
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    // FALTA return
  }, []); // OK

  const value = {  // ❌ Se recrea cada render
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// DESPUÉS ✅
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe(); // ✅ AGREGADO
  }, []);

  const value = useMemo(() => ({  // ✅ useMemo
    user,
    login,
    logout
  }), [user]); // Solo depende de user

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4. Revertir los cambios temporales en App.jsx

Una vez arreglado AuthContext.jsx:

```javascript
// Descomentar:
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Eliminar SimpleAuthProvider y usar el original:
return (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>  {/* ← Original, ya arreglado */}
        {splashCompleted && <AppRoutes />}
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
```

### 5. Probar

```bash
# Reiniciar servidor
npm run dev

# Abrir en navegador
http://localhost:PUERTO/es
```

Deberías ver:
- ✅ Landing page de España renderizada
- ✅ Hero con imágenes visible
- ✅ Sin loops infinitos en los logs
- ✅ Login/Register funciona
- ✅ Chat funciona

---

## 🚨 SI NO PUEDES ARREGLAR AUTHCONTEXT

Si el AuthContext es muy complejo o no encuentras el bug:

### Plan B: Crear AuthContext específico para landing pages

1. Crear `src/contexts/LandingAuthContext.jsx` (simplificado, sin Firebase)
2. Usar ese context SOLO para las rutas `/es` `/br` `/mx` `/ar`
3. Mantener el AuthContext original para el resto de la app

```javascript
// En App.jsx, rutas landing:
<Route
  path="/es"
  element={
    <LandingAuthProvider>  {/* Contexto simple */}
      <MainLayout>
        <SpainLandingPage />
      </MainLayout>
    </LandingAuthProvider>
  }
/>

// Rutas normales:
<AuthProvider>  {/* Contexto completo */}
  <Route path="/chat/:roomId" element={<ChatPage />} />
</AuthProvider>
```

---

## 📌 RESUMEN

| Componente | Estado | Problema |
|------------|--------|----------|
| **SpainLandingPage.jsx** | ✅ OK | Código correcto |
| **BrazilLandingPage.jsx** | ✅ OK | Código correcto |
| **MexicoLandingPage.jsx** | ✅ OK | Código correcto |
| **ArgentinaLandingPage.jsx** | ✅ OK | Código correcto |
| **ThemeProvider** | ✅ OK | Funciona bien |
| **React Router** | ✅ OK | Routing correcto |
| **AuthContext.jsx** | ❌ BUG | **Loop infinito** |

**Solución**: Arreglar `src/contexts/AuthContext.jsx`

---

## 🔗 ARCHIVOS RELACIONADOS

- `src/contexts/AuthContext.jsx` → **Arreglar aquí**
- `src/App.jsx` → Tiene cambios temporales (revertir después)
- `src/pages/SpainLandingPage.jsx` → OK (tiene logging detallado)
- `VERIFICACION-LANDING-PAGES.md` → Checklist de testing
- `DEBUG-LANDING-PAGES.md` → Guía de interpretación de logs

---

**Creado**: 2026-01-03
**Siguiente paso**: Arreglar `AuthContext.jsx` siguiendo los pasos de este documento
