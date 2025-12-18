# ✅ CHECKLIST DE IMPLEMENTACIÓN - CHACTIVO

**Objetivo:** Pasar de 8 visitas/mes a 300 visitas/mes en 30 días
**Conversión objetivo:** 0% → 16% (50 registros/mes)

**Fecha inicio:** _______________
**Fecha objetivo:** _______________

---

## 🔴 PRIORIDAD CRÍTICA - HOY MISMO (2 HORAS)

### CAMBIOS SIN CÓDIGO (30 MINUTOS)

- [ ] **1.1 Cambiar Meta Tags en index.html (5 min)**
  - **Archivo:** `index.html` líneas 7-8
  - **Acción:** Cambiar título y description
  - **De:** "sin registro, 1000+ usuarios"
  - **A:** "Regístrate en 30s, comunidad activa Chile"
  - **Código específico:** Ver sección "CÓDIGO 1.1" abajo ⬇️

- [ ] **1.2 Renombrar "Click Aquí" (2 min)**
  - **Archivo:** `src/components/lobby/LobbyPage.jsx` o donde estén las cards
  - **Acción:** Cambiar `title: "Click Aquí"` por `title: "🌍 Usuarios Cercanos"`
  - **Código específico:** Ver sección "CÓDIGO 1.2" abajo ⬇️

- [ ] **1.3 Eliminar "Próximamente" del Lobby (5 min)**
  - **Archivo:** `src/components/lobby/LobbyPage.jsx`
  - **Acción:** Comentar card de "Comunidades - Próximamente"
  - **Acción:** Comentar sección "Videos" si dice "Próximamente"
  - **Código específico:** Ver sección "CÓDIGO 1.3" abajo ⬇️

- [ ] **1.4 Reordenar Cards - Salas Primero (2 min)**
  - **Archivo:** `src/components/lobby/LobbyPage.jsx`
  - **Acción:** Mover "Salas de Chat" a primera posición
  - **Código específico:** Ver sección "CÓDIGO 1.4" abajo ⬇️

- [ ] **1.5 Crear Instagram @chactivo.cl (20 min)**
  - **Plataforma:** Instagram móvil o web
  - **Username:** @chactivo.cl
  - **Bio:** Ver texto exacto en sección "CÓDIGO 1.5" abajo ⬇️
  - **Primer post:** Copiar de `CONTENIDO_INSTAGRAM_LISTO.md`

---

## 🟡 PRIORIDAD ALTA - ESTA SEMANA (8 HORAS)

### CAMBIOS CON CÓDIGO (6 HORAS)

- [ ] **2.1 GlobalStats con Números REALES (30 min)**
  - **Archivo:** `src/components/lobby/GlobalStats.jsx`
  - **Acción:** Conectar a Firestore en tiempo real
  - **Resultado:** Mostrar usuarios online REALES (no fake)
  - **Código específico:** Ver sección "CÓDIGO 2.1" abajo ⬇️

- [ ] **2.2 Contador "Última Actividad" en Hero (1 hora)**
  - **Archivo:** `src/components/lobby/HeroSection.jsx`
  - **Acción:** Agregar "Juan se conectó hace 32s"
  - **Actualizar:** Cada 10 segundos desde Firestore
  - **Código específico:** Ver sección "CÓDIGO 2.2" abajo ⬇️

- [ ] **2.3 Chat Anónimo Limitado - 10 Mensajes (3 horas)**
  - **Archivo 1:** `src/pages/ChatPage.jsx` (handleSendMessage)
  - **Archivo 2:** `src/components/lobby/RoomsModal.jsx` (handleRoomSelect)
  - **Acción:** Permitir "Conversas Libres" a usuarios sin registro
  - **Límite:** 10 mensajes, después registro obligatorio
  - **Código específico:** Ver sección "CÓDIGO 2.3" abajo ⬇️
  - **IMPACTO:** Conversión esperada 30-40% (crítico para crecimiento)

- [ ] **2.4 Simplificar Onboarding a 3 Pasos (1.5 horas)**
  - **Archivo:** `src/components/auth/QuickSignupModal.jsx` (crear nuevo)
  - **Acción:** Modal de registro rápido en overlay
  - **Flujo:** Email/Pass → Username → ¡Chatear!
  - **Reducción:** 13 pasos → 3 pasos
  - **Código específico:** Ver sección "CÓDIGO 2.4" abajo ⬇️

### ARREGLOS TÉCNICOS CRÍTICOS (2 HORAS)

- [ ] **2.5 Arreglar Memory Leak en ChatMessages.jsx (15 min)**
  - **Archivo:** `src/components/chat/ChatMessages.jsx` líneas 19-34
  - **Problema:** setTimeout sin cleanup
  - **Acción:** Agregar clearTimeout en return
  - **Código específico:** Ver sección "CÓDIGO 2.5" abajo ⬇️

- [ ] **2.6 Agregar Link "Términos" en Footer (5 min)**
  - **Archivo:** `src/components/layout/Footer.jsx` (o donde esté el footer)
  - **Acción:** `<a href="/terminos-condiciones.html">Términos y Condiciones</a>`
  - **Código específico:** Ver sección "CÓDIGO 2.6" abajo ⬇️

- [ ] **2.7 CORS Más Restrictivo en vercel.json (5 min)**
  - **Archivo:** `vercel.json` línea 17
  - **Acción:** Cambiar `"value": "*"` por tu dominio
  - **Código específico:** Ver sección "CÓDIGO 2.7" abajo ⬇️

---

## 🟢 PRIORIDAD MEDIA - ESTE MES (CONTINUO)

### MARKETING Y CONTENIDO

- [ ] **3.1 Crear Google My Business (30 min)**
  - **URL:** https://business.google.com
  - **Categoría:** "Plataforma de redes sociales"
  - **Ubicación:** Santiago, Chile
  - **Acción:** Solicitar 10 reviews iniciales

- [ ] **3.2 Publicar 21 Posts Instagram (7 días)**
  - **Ritmo:** 3 posts/día (8am, 2pm, 8pm)
  - **Fuente:** `CONTENIDO_INSTAGRAM_LISTO.md`
  - **Tracking:** Engagement rate, seguidores ganados
  - **Meta Semana 1:** 100 seguidores

- [ ] **3.3 Registrar en 5 Directorios LGBT+ Chile (2 horas)**
  - [ ] MOVILH - contactar@movilh.cl
  - [ ] Fundación Iguales - info@iguales.cl
  - [ ] OTD Chile - otdchile@gmail.com
  - [ ] Todo Mejora - contacto@todomejora.org
  - [ ] Directorio LGBT+ Latinoamérica

- [ ] **3.4 Configurar Google Ads ($50/mes) (1 hora)**
  - **Campaña:** Búsqueda
  - **Keywords:** "chat gay santiago", "alternativa grindr"
  - **Presupuesto:** $50 USD/mes
  - **Objetivo:** 150 visitas, 25 registros

- [ ] **3.5 Escribir 5 Artículos Blog SEO (5 horas)**
  - [ ] "Alternativas a Grindr en Chile 2025"
  - [ ] "Cómo conocer gays en Santiago sin apps de hookups"
  - [ ] "Consejos para chat gay seguro"
  - [ ] "Diferencias entre Grindr y Chactivo"
  - [ ] "Comunidad LGBT+ en Chile: Dónde encontrar amigos"

- [ ] **3.6 Contactar 2 Micro-Influencers LGBT+ (1 hora)**
  - **Criterio:** 5k-20k seguidores, comunidad LGBT+ Chile
  - **Oferta:** Publicación patrocinada o canje
  - **Objetivo:** 500 visitas, 100 registros

---

## 📊 TRACKING Y VALIDACIÓN

### DESPUÉS DE CADA IMPLEMENTACIÓN

- [ ] **TEST 1: Verificar cambios en staging/local**
  - Abrir navegador
  - Probar funcionalidad
  - Verificar que NO rompe nada

- [ ] **TEST 2: Validar en producción**
  - Deploy a Vercel
  - Probar en diferentes dispositivos
  - Verificar métricas en Google Analytics

- [ ] **TEST 3: Medir impacto**
  - CTR en Search Console
  - Conversión en Analytics
  - Engagement en Instagram

---

## 📝 CÓDIGO ESPECÍFICO PARA IMPLEMENTAR

### CÓDIGO 1.1 - Meta Tags en index.html

**Ubicación:** `index.html` líneas 7-8

**BUSCAR:**
```html
<title>💬 Chat Gay Santiago | Usuarios Conectados AHORA | Gratis y Anónimo</title>
<meta name="description" content="🔥 Chatea con gays de Santiago AHORA ➤ Gratis, sin registro, 100% anónimo ✓ Salas: Osos, +30, Gaming, Amistad ✓ Mejor que Grindr para conversación real ✓ Entra en 10 segundos ⭐ Comunidad activa 24/7">
```

**REEMPLAZAR CON:**
```html
<title>💬 Chat Gay Chile - Alternativa Gratis a Grindr | Chactivo</title>
<meta name="description" content="🏳️‍🌈 Chat gay chileno 100% gratis. Salas por interés: Gaming 🎮, +30 💪, Osos 🐻, Amistad 💬. Conversación real, sin presión de hookups. Regístrate en 30 segundos y empieza a chatear. Comunidad activa de Chile.">
```

**¿Por qué?**
- ✅ Elimina "sin registro" (mentira)
- ✅ Elimina "1000 usuarios" (fake)
- ✅ Honesto sobre registro rápido
- ✅ Enfoque en diferenciación vs Grindr

---

### CÓDIGO 1.2 - Renombrar "Click Aquí"

**Ubicación:** Busca en `src/components/lobby/LobbyPage.jsx` o donde estén definidas las cards

**BUSCAR:**
```jsx
{
  title: "Click Aquí",
  description: "Descubre usuarios cercanos a ti...",
  // ...
}
```

**REEMPLAZAR CON:**
```jsx
{
  title: "🌍 Usuarios Cercanos",
  description: "Encuentra gays cerca de ti con geolocalización",
  // ...
}
```

---

### CÓDIGO 1.3 - Eliminar "Próximamente"

**Ubicación:** `src/components/lobby/LobbyPage.jsx`

**BUSCAR y COMENTAR:**
```jsx
// COMENTAR TODO ESTO:
/*
{
  icon: Users,
  title: "Comunidades",
  description: "Próximamente: Grupos privados por intereses",
  path: "/communities",
  badge: "Próximamente",
  color: "from-orange-500 to-red-500"
},
*/
```

**También buscar y comentar sección de Videos si dice "Próximamente"**

---

### CÓDIGO 1.4 - Reordenar Cards

**Ubicación:** `src/components/lobby/LobbyPage.jsx`

**ASEGURAR que el array esté en este orden:**
```jsx
const lobbyCards = [
  // 1. PRIMERO: Salas de Chat
  {
    icon: MessageSquare,
    title: "🔥 Salas de Chat",
    description: "Conversas Libres, +30, Gaming, Santiago - Activas 24/7",
    path: "/rooms",
    badge: "Popular",
    color: "from-purple-500 to-pink-500"
  },

  // 2. SEGUNDO: Usuarios Cercanos
  {
    icon: MapPin,
    title: "🌍 Usuarios Cercanos",
    description: "Encuentra gays cerca de ti con geolocalización",
    // ...
  },

  // 3. RESTO: Centro de Denuncias, Eventos, etc.
  // ...
];
```

---

### CÓDIGO 1.5 - Instagram Setup

**Bio exacta:**
```
💬 Chat Gay Chile 🇨🇱
🏳️‍🌈 100% Gratis | Alternativa a Grindr
🎮 Gaming | 🐻 Osos | 💪 +30 | 💬 Amistad
👇 Empieza a chatear ahora
```

**Link en bio:**
```
https://chactivo.com
```

**Primer post (copiar de CONTENIDO_INSTAGRAM_LISTO.md):**
- Imagen: Meme Drake
- Caption: "Lunes de verdades 💅..." (ver archivo completo)
- Hashtags: #GayChile #ChatGay #GaysSantiago etc.

---

### CÓDIGO 2.1 - GlobalStats REAL

**Ubicación:** `src/components/lobby/GlobalStats.jsx`

**REEMPLAZAR TODO el componente con:**
```jsx
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

export const GlobalStats = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usuarios online AHORA (últimos 5 minutos)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const onlineQuery = query(
      collection(db, 'users'),
      where('lastSeen', '>', Timestamp.fromMillis(fiveMinutesAgo))
    );

    const unsubOnline = onSnapshot(onlineQuery, (snapshot) => {
      const count = snapshot.size;
      setOnlineCount(count);
      setLoading(false);
      console.log('👥 Usuarios online:', count);
    }, (error) => {
      console.error('Error obteniendo usuarios online:', error);
      setOnlineCount(0);
      setLoading(false);
    });

    // Total usuarios registrados
    const totalQuery = collection(db, 'users');
    const unsubTotal = onSnapshot(totalQuery, (snapshot) => {
      setTotalUsers(snapshot.size);
      console.log('📊 Total usuarios:', snapshot.size);
    }, (error) => {
      console.error('Error obteniendo total usuarios:', error);
    });

    return () => {
      unsubOnline();
      unsubTotal();
    };
  }, []);

  if (loading) {
    return (
      <div className="stats-loading">
        <span className="animate-pulse">Cargando estadísticas...</span>
      </div>
    );
  }

  return (
    <div className="global-stats">
      <AnimatedNumber value={totalUsers} suffix="" label="Usuarios registrados" />
      <AnimatedNumber
        value={onlineCount}
        suffix=""
        label="Online ahora"
        highlight={onlineCount > 0}
      />
    </div>
  );
};
```

**IMPORTANTE:** Si AnimatedNumber no existe, crear componente simple o usar texto normal.

---

### CÓDIGO 2.2 - Contador "Última Actividad"

**Ubicación:** `src/components/lobby/HeroSection.jsx`

**AGREGAR al final del componente, antes del closing div:**
```jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

// Dentro del componente HeroSection:
const [lastActivity, setLastActivity] = useState(null);

useEffect(() => {
  // Obtener último usuario que se conectó
  const q = query(
    collection(db, 'users'),
    orderBy('lastSeen', 'desc'),
    limit(1)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const lastUser = snapshot.docs[0].data();
      const lastSeen = lastUser.lastSeen?.toMillis() || Date.now();
      const secondsAgo = Math.floor((Date.now() - lastSeen) / 1000);

      setLastActivity({
        username: lastUser.username || 'Usuario',
        secondsAgo: secondsAgo
      });
    }
  }, (error) => {
    console.error('Error obteniendo última actividad:', error);
  });

  return () => unsubscribe();
}, []);

// Actualizar cada 10 segundos
useEffect(() => {
  const interval = setInterval(() => {
    if (lastActivity) {
      setLastActivity(prev => ({
        ...prev,
        secondsAgo: prev.secondsAgo + 10
      }));
    }
  }, 10000);

  return () => clearInterval(interval);
}, [lastActivity]);

// En el JSX, agregar después del CTA:
{lastActivity && (
  <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </span>
    <span>
      <strong>{lastActivity.username}</strong> se conectó hace{' '}
      <strong>
        {lastActivity.secondsAgo < 60 ?
          `${lastActivity.secondsAgo}s` :
          `${Math.floor(lastActivity.secondsAgo / 60)} min`}
      </strong>
    </span>
  </div>
)}
```

---

### CÓDIGO 2.3 - Chat Anónimo Limitado

**ARCHIVO 1:** `src/pages/ChatPage.jsx`

**BUSCAR la función `handleSendMessage` y MODIFICAR:**
```jsx
const handleSendMessage = async (content, type = 'text') => {
  // ✅ NUEVO: Permitir chat anónimo con límite de 10 mensajes
  if (user.isAnonymous) {
    if (guestMessageCount >= 10) {
      // Alcanzó límite → Mostrar modal de registro
      setShowVerificationModal(true);
      toast({
        title: "¡Te enganchaste! 🎉",
        description: "Has usado tus 10 mensajes gratis. Regístrate para continuar la conversación.",
        variant: "default",
      });
      return;
    }

    // Mostrar contador de mensajes restantes
    const remaining = 10 - guestMessageCount;
    if (remaining <= 3) {
      toast({
        title: `⏰ ${remaining} mensajes restantes`,
        description: "Regístrate gratis para chat ilimitado",
        duration: 2000,
      });
    }
  }

  // Validación: usuarios anónimos solo 3 mensajes (COMENTAR O ELIMINAR ESTO)
  // if (user.isAnonymous && guestMessageCount >= 3) {
  //   setShowVerificationModal(true);
  //   return;
  // }

  // ... resto del código existente sin cambios ...
};
```

**ARCHIVO 2:** `src/components/lobby/RoomsModal.jsx`

**BUSCAR `handleRoomSelect` y MODIFICAR:**
```jsx
const handleRoomSelect = (roomId) => {
  // ✅ NUEVO: Permitir "Conversas Libres" a usuarios anónimos
  if (!user || user.isAnonymous) {
    if (roomId === 'conversas-libres') {
      // Permitir acceso con mensaje informativo
      toast({
        title: "🎁 Modo Prueba: 10 mensajes gratis",
        description: "Estás chateando como invitado. Regístrate para acceso ilimitado.",
        duration: 5000,
      });
      navigate(`/chat/${roomId}`);
      return; // ← IMPORTANTE: return aquí
    } else {
      // Otras salas requieren registro
      setShowVerificationModal(true);
      toast({
        title: "Registro Requerido 🔒",
        description: "Esta sala requiere registro. Conversas Libres está disponible sin registro.",
        variant: "default",
      });
      return;
    }
  }

  // Usuario registrado: acceso normal a todas las salas
  navigate(`/chat/${roomId}`);
};
```

---

### CÓDIGO 2.4 - Simplificar Onboarding

**CREAR NUEVO ARCHIVO:** `src/components/auth/QuickSignupModal.jsx`

```jsx
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const QuickSignupModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    age: ''
  });
  const navigate = useNavigate();

  const handleNext = async () => {
    setLoading(true);

    try {
      // PASO 1: Crear cuenta
      if (step === 1) {
        // Validar campos
        if (!formData.email || !formData.password || !formData.age) {
          toast({
            title: "Campos incompletos",
            description: "Por favor completa todos los campos",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        if (parseInt(formData.age) < 18) {
          toast({
            title: "Debes ser mayor de edad",
            description: "Necesitas tener 18+ años",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Crear cuenta en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        console.log('✅ Cuenta creada:', userCredential.user.uid);
        setStep(2);
        setLoading(false);
        return;
      }

      // PASO 2: Elegir username y guardar en Firestore
      if (step === 2) {
        if (!formData.username || formData.username.length < 3) {
          toast({
            title: "Username muy corto",
            description: "Mínimo 3 caracteres",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Actualizar perfil en Auth
        await updateProfile(auth.currentUser, {
          displayName: formData.username
        });

        // Guardar en Firestore
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          id: auth.currentUser.uid,
          email: formData.email,
          username: formData.username,
          age: parseInt(formData.age),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
          isPremium: false,
          verified: false,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp()
        });

        // ¡Éxito!
        toast({
          title: "¡Bienvenido a Chactivo! 🎉",
          description: "Redirigiendo al chat...",
        });

        // Redirigir directamente a chat
        setTimeout(() => {
          navigate('/chat/conversas-libres');
          onClose();
        }, 1000);

        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast({
        title: "Error al registrar",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        {/* PASO 1: Email, Password, Edad */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Regístrate en 30 segundos</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Paso 1 de 2: Crea tu cuenta
            </p>

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border rounded-lg mb-3"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            <input
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              className="w-full p-3 border rounded-lg mb-3"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <input
              type="number"
              placeholder="Edad (18+)"
              className="w-full p-3 border rounded-lg mb-6"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creando cuenta...' : 'Continuar →'}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-3 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* PASO 2: Username */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Elige tu nombre de usuario</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Paso 2 de 2: ¡Ya casi!
            </p>

            <input
              type="text"
              placeholder="Username (ej: Daniel28)"
              className="w-full p-3 border rounded-lg mb-6"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Empezar a chatear 🎉'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

**LUEGO, en `src/components/lobby/HeroSection.jsx` o donde esté el CTA:**
```jsx
import { QuickSignupModal } from '@/components/auth/QuickSignupModal';

// Agregar estado:
const [showSignup, setShowSignup] = useState(false);

// En el botón CTA:
<button onClick={() => setShowSignup(true)}>
  REGÍSTRATE PARA CHATEAR
</button>

// Al final del JSX:
<QuickSignupModal
  isOpen={showSignup}
  onClose={() => setShowSignup(false)}
/>
```

---

### CÓDIGO 2.5 - Arreglar Memory Leak

**Ubicación:** `src/components/chat/ChatMessages.jsx` líneas 19-34

**BUSCAR:**
```jsx
useEffect(() => {
  messages.forEach((message) => {
    const isOwn = message.userId === currentUserId;

    if (isOwn && !messageChecks[message.id]) {
      setMessageChecks(prev => ({ ...prev, [message.id]: 'single' }));

      // Después de 2 segundos, cambiar a 2 checks azules
      setTimeout(() => {
        setMessageChecks(prev => ({ ...prev, [message.id]: 'double' }));
      }, 2000); // ← PROBLEMA: No hay cleanup
    }
  });
}, [messages, currentUserId]);
```

**REEMPLAZAR CON:**
```jsx
useEffect(() => {
  const timers = []; // ← NUEVO: Array para guardar timers

  messages.forEach((message) => {
    const isOwn = message.userId === currentUserId;

    if (isOwn && !messageChecks[message.id]) {
      setMessageChecks(prev => ({ ...prev, [message.id]: 'single' }));

      // Después de 2 segundos, cambiar a 2 checks azules
      const timer = setTimeout(() => {
        setMessageChecks(prev => ({ ...prev, [message.id]: 'double' }));
      }, 2000);

      timers.push(timer); // ← NUEVO: Guardar timer
    }
  });

  // ✅ CLEANUP: Limpiar todos los timers cuando se desmonta
  return () => {
    timers.forEach(timer => clearTimeout(timer));
  };
}, [messages, currentUserId]);
```

---

### CÓDIGO 2.6 - Link Términos en Footer

**Ubicación:** Busca el archivo del footer (puede ser `src/components/layout/Footer.jsx` o similar)

**AGREGAR en el footer:**
```jsx
<footer className="footer">
  {/* ... contenido existente ... */}

  <div className="footer-links">
    <a href="/terminos-condiciones.html" target="_blank" rel="noopener noreferrer">
      Términos y Condiciones
    </a>
    {' | '}
    <a href="mailto:soporte@chactivo.com">
      Contacto
    </a>
  </div>
</footer>
```

---

### CÓDIGO 2.7 - CORS Restrictivo

**Ubicación:** `vercel.json` línea 17

**BUSCAR:**
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "*"
}
```

**REEMPLAZAR CON:**
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "https://chactivo.com"
}
```

**NOTA:** Si tienes dominio diferente, usar ese. Si usas www también, agregar:
```json
{
  "key": "Access-Control-Allow-Origin",
  "value": "https://chactivo.com, https://www.chactivo.com"
}
```

---

## 🎯 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

**DÍA 1 (HOY):**
1. ✅ Meta tags (5 min)
2. ✅ Renombrar "Click Aquí" (2 min)
3. ✅ Eliminar "Próximamente" (5 min)
4. ✅ Crear Instagram (20 min)
5. ✅ Publicar primer post Instagram (5 min)

**DÍA 2:**
6. ✅ GlobalStats real (30 min)
7. ✅ Arreglar memory leak (15 min)
8. ✅ Link términos footer (5 min)

**DÍA 3-4:**
9. ✅ Chat anónimo limitado (3 horas)

**DÍA 5-6:**
10. ✅ Simplificar onboarding (1.5 horas)
11. ✅ Contador última actividad (1 hora)

**DÍA 7 EN ADELANTE:**
- Instagram 3 posts/día
- Google Ads
- Directorios LGBT+
- Blog posts

---

## 📊 VALIDACIÓN FINAL

Después de cada implementación, verificar:

- [ ] ¿Se ve bien en desktop?
- [ ] ¿Se ve bien en móvil?
- [ ] ¿No rompe funcionalidad existente?
- [ ] ¿Los logs de consola están limpios?
- [ ] ¿Analytics tracking funciona?

---

**¡EMPIEZA CON EL ITEM 1.1 AHORA MISMO!** 🚀

¿Cuál quieres implementar primero? Te ayudo con el código específico.
