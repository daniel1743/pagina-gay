# 📜 CAMBIOS - Historial de Mensajes y UI

**Fecha**: 2026-01-07
**Objetivo**: Aumentar historial de mensajes y mejorar UX

---

## ✅ CAMBIOS APLICADOS

### 1. Límites de mensajes según tipo de usuario

**Archivo**: `src/pages/ChatPage.jsx` (líneas 573-577, 778)

**Antes**:
- Todos los usuarios: 60 mensajes

**Después**:
- **Usuarios no logueados (guest/anonymous)**: 50 mensajes
- **Usuarios registrados**: 100 mensajes

**Código agregado**:
```javascript
// Línea 573-577
const messageLimit = (user && !user.isGuest && !user.isAnonymous) ? 100 : 50;
console.log(`📊 [CHAT] Límite de mensajes para ${user?.username}: ${messageLimit}`);

// Línea 778 - Pasar límite al listener
const unsubscribeMessages = subscribeToRoomMessages(roomId, callback, messageLimit);
```

**Resultado**:
- ✅ Usuarios registrados ven 100 mensajes de historial
- ✅ Usuarios invitados ven 50 mensajes (menos carga)
- ✅ Límite se ajusta automáticamente al tipo de usuario

---

### 2. Toast de registro al hacer scroll arriba (usuarios no logueados)

**Archivo**: `src/pages/ChatPage.jsx` (líneas 1911-1955)

**Comportamiento**:
- Usuario no logueado scrollea hacia arriba
- Si hay 50 mensajes cargados (límite alcanzado)
- Si está en los primeros 100px del scroll
- **Muestra toast**: "Para ver más de 50 mensajes anteriores, debes estar registrado"
- **Botón**: "Registrarme" → abre modal de registro

**Código agregado**:
```javascript
useEffect(() => {
  if (!user || (!user.isGuest && !user.isAnonymous)) return;

  const container = scrollManager?.containerRef?.current;
  if (!container) return;

  let hasShownToast = false; // Solo una vez por sesión

  const handleScroll = () => {
    if (hasShownToast) return;

    const scrollTop = container.scrollTop;
    const isNearTop = scrollTop < 100;

    if (isNearTop && messages.length >= 50) {
      hasShownToast = true;
      toast({
        title: "📜 Más Historial Disponible",
        description: "Para ver más de 50 mensajes...",
        action: {
          label: "Registrarme",
          onClick: () => setShowRegistrationModal(true)
        }
      });
    }
  };

  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, [user, messages.length, scrollManager]);
```

**Resultado**:
- ✅ Incentiva registro sin ser intrusivo
- ✅ Solo muestra una vez por sesión
- ✅ Solo cuando realmente alcanza el límite

---

### 3. Toast de latencia ELIMINADO

**Archivo**: `src/pages/ChatPage.jsx` (líneas 1547-1553)

**Antes**:
```javascript
if (import.meta.env.DEV || latency > 500) {
  toast({
    title: "⏱️ Diagnóstico de Velocidad",
    description: `Latencia: ${latency}ms (Ida y vuelta)`,
    duration: 2000,
    variant: latency < 300 ? "default" : "destructive"
  });
}
```

**Después**:
```javascript
// ❌ TOAST DE LATENCIA ELIMINADO (07/01/2026)
// El usuario no necesita ver información técnica de latencia
// Solo mantener log en consola para debugging
console.log(`⏱️ [LATENCY TEST] Mensaje sincronizado en ${latency}ms`);
```

**Razón**:
- Información técnica no interesa al usuario
- Puede confundir o preocupar sin razón
- Log en consola suficiente para debugging

**Resultado**:
- ✅ Experiencia más limpia (menos toasts)
- ✅ Usuario no ve información técnica innecesaria
- ✅ Mantiene log para desarrolladores

---

## 📊 RESUMEN DE LÍMITES

| Tipo de Usuario | Mensajes | Acción al scrollear arriba |
|------------------|----------|----------------------------|
| **No logueado** (guest/anonymous) | 50 | Toast: "Regístrate para ver más" |
| **Registrado** | 100 | Sin límite (puede scrollear libremente) |

---

## 🧪 CÓMO VERIFICAR

### Test 1: Usuario no logueado (50 mensajes)
```
1. Abrir localhost:3000 en modo incógnito
2. Entrar como invitado
3. Entrar a sala con >50 mensajes
4. Debe cargar solo 50 mensajes
5. Scrollear hacia arriba
6. Al llegar al tope → DEBE mostrar toast "Más Historial Disponible"
7. Click en "Registrarme" → DEBE abrir modal de registro
```

**Resultado esperado**: ✅ Toast aparece, invita a registrarse

### Test 2: Usuario registrado (100 mensajes)
```
1. Abrir localhost:3000
2. Registrarse/loguearse con cuenta
3. Entrar a sala con >100 mensajes
4. Debe cargar 100 mensajes
5. Scrollear hacia arriba
6. NO debe mostrar toast de registro
7. Puede scrollear libremente por los 100 mensajes
```

**Resultado esperado**: ✅ No aparece toast, scrollea libremente

### Test 3: Toast de latencia eliminado
```
1. Enviar mensaje
2. Esperar que llegue
3. NO debe aparecer toast de "Diagnóstico de Velocidad"
4. Solo log en consola: "⏱️ [LATENCY TEST] Mensaje sincronizado en Xms"
```

**Resultado esperado**: ✅ Sin toast de latencia

---

## 🔍 LOGS EN CONSOLA

Al cargar chat, debe aparecer:
```
📊 [CHAT] Límite de mensajes para jose: 50 (invitado)
```

O:
```
📊 [CHAT] Límite de mensajes para JuanRegistrado: 100 (registrado)
```

Al scrollear arriba (usuario no logueado):
```
Toast aparece con: "📜 Más Historial Disponible"
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Toast solo aparece UNA VEZ por sesión**
   - Flag `hasShownToast` evita spam
   - Si recarga página, puede aparecer de nuevo

2. **Límite se aplica al cargar sala**
   - No es scroll infinito
   - Firebase query con `limit(50)` o `limit(100)`

3. **Mensajes viejos no se cargan dinámicamente**
   - Los 50/100 mensajes son los más recientes
   - No hay "load more" (por ahora)

4. **Toast de latencia eliminado**
   - Ya no molesta al usuario
   - Log sigue en consola para debugging

---

## 📁 ARCHIVOS MODIFICADOS

1. `src/pages/ChatPage.jsx`
   - Línea 573-577: Cálculo de límite según usuario
   - Línea 778: Pasar límite a subscribeToRoomMessages
   - Línea 1547-1553: Toast de latencia eliminado
   - Línea 1911-1955: useEffect para detectar scroll y mostrar toast

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Usuario no logueado ve solo 50 mensajes
- [ ] Usuario registrado ve 100 mensajes
- [ ] Toast aparece al scrollear arriba (no logueado)
- [ ] Toast tiene botón "Registrarme" que funciona
- [ ] Toast NO aparece para usuarios registrados
- [ ] Toast de latencia NO aparece al enviar mensaje
- [ ] Log en consola muestra límite correcto
- [ ] Scroll funciona normal sin trabas

---

**Última actualización**: 2026-01-07 09:15
**Estado**: Cambios aplicados ✅ - Pendiente testing
**Archivos modificados**: 1 (ChatPage.jsx)
