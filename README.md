# 🌈 Chactivo - Hub Comunitario LGBTQ+

**Chactivo** es una plataforma de chat en tiempo real diseñada para la comunidad LGBTQ+, ofreciendo un espacio seguro para conectar, compartir y crecer.

![React](https://img.shields.io/badge/React-18.2.0-blue)
![Firebase](https://img.shields.io/badge/Firebase-10.x-orange)
![Vite](https://img.shields.io/badge/Vite-4.4.5-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3.3-cyan)

---

## ✨ Características

### 🔐 Seguridad Implementada
- ✅ **Autenticación segura con Firebase** - Contraseñas hasheadas automáticamente (bcrypt)
- ✅ **Validaciones del lado del servidor** - Firestore Security Rules robustas
- ✅ **Persistencia real** - Base de datos Firestore con sincronización en tiempo real
- ✅ **Tests de seguridad** - Suite completa de tests para Security Rules

### 💬 Funcionalidades de Chat
- Chat en tiempo real con Firebase Realtime Database
- Múltiples salas temáticas
- Mensajes privados entre usuarios
- Reacciones a mensajes (like, dislike)
- Indicador de "escribiendo..."
- Detección de contenido sensible
- Sistema de reportes/denuncias

### 👤 Gestión de Usuarios
- Registro y login seguro
- Perfiles personalizables con avatares
- Sistema de usuarios Premium con funciones exclusivas
- Frases rápidas personalizables
- Temas claros y oscuros
- Verificación de edad (18+)

### 🎨 UI/UX
- Diseño moderno con Tailwind CSS
- Animaciones fluidas con Framer Motion
- Componentes accesibles con Radix UI
- Responsive design
- Efectos glass y gradientes atractivos

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Firebase (gratuita)
- Firebase CLI (para emuladores y deployment)

```bash
npm install -g firebase-tools
```

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd gay\ chat
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

#### 3.1 Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "Chactivo" (o el nombre que prefieras)
3. Habilita **Authentication** → Email/Password
4. Crea una base de datos **Firestore** en modo producción

#### 3.2 Obtener credenciales

1. En Firebase Console, ve a Configuración del proyecto
2. En "Tus apps", añade una aplicación web
3. Copia las credenciales que te muestra

#### 3.3 Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` y completa con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id (opcional)

# Para desarrollo local con emuladores
VITE_USE_FIREBASE_EMULATOR=false
```

### 4. Desplegar Security Rules a Firebase

```bash
# Login en Firebase
firebase login

# Inicializar Firebase en el proyecto (si es necesario)
firebase init

# Desplegar solo las rules de Firestore
firebase deploy --only firestore:rules
```

### 5. Activar los archivos Firebase (Migración)

Por defecto, el proyecto usa localStorage. Para activar Firebase:

1. **Reemplazar AuthContext:**
```bash
# Backup del archivo original
mv src/contexts/AuthContext.jsx src/contexts/AuthContext.backup.jsx

# Activar versión Firebase
mv src/contexts/AuthContext.firebase.jsx src/contexts/AuthContext.jsx
```

2. **Reemplazar ChatPage:**
```bash
# Backup del archivo original
mv src/pages/ChatPage.jsx src/pages/ChatPage.backup.jsx

# Activar versión Firebase
mv src/pages/ChatPage.firebase.jsx src/pages/ChatPage.jsx
```

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🧪 Testing

### Configurar Emuladores de Firebase

Los emuladores permiten desarrollar y testear localmente sin tocar la base de datos de producción.

```bash
# Iniciar emuladores
firebase emulators:start
```

Esto iniciará:
- **Auth Emulator**: `http://localhost:9099`
- **Firestore Emulator**: `http://localhost:8080`
- **Emulator UI**: `http://localhost:4000`

Para usar emuladores, cambia en `.env`:
```env
VITE_USE_FIREBASE_EMULATOR=true
```

### Ejecutar Tests de Security Rules

```bash
# Instalar dependencias de testing
npm install -D @firebase/rules-unit-testing jest

# Ejecutar tests
npm run test:firestore
```

Los tests verifican:
- ✅ Usuarios no autenticados no pueden acceder
- ✅ Usuarios solo pueden editar su propio perfil
- ✅ No se puede auto-promocionar a Premium
- ✅ Validación de edad (18+)
- ✅ Mensajes requieren autenticación
- ✅ No se puede suplantar identidad
- ✅ Límites de longitud de mensajes
- ✅ Y mucho más...

---

## 📁 Estructura del Proyecto

```
gay chat/
├── src/
│   ├── components/          # Componentes React
│   │   ├── chat/           # Componentes de chat
│   │   ├── lobby/          # Componentes del lobby
│   │   ├── layout/         # Header, Footer
│   │   ├── profile/        # Componentes de perfil
│   │   └── ui/             # Componentes UI (Radix)
│   ├── contexts/           # Context API (Auth, Theme)
│   ├── pages/              # Páginas principales
│   ├── services/           # Servicios de Firebase
│   │   ├── userService.js  # Gestión de usuarios
│   │   └── chatService.js  # Gestión de mensajes
│   ├── config/             # Configuración
│   │   └── firebase.js     # Config de Firebase
│   ├── lib/                # Utilidades
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Entry point
│   └── index.css           # Estilos globales
├── tests/                  # Tests
│   └── firestore.rules.test.js
├── public/                 # Assets estáticos
├── firestore.rules         # Security Rules de Firestore
├── firestore.indexes.json  # Índices de Firestore
├── firebase.json           # Config de Firebase
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🔒 Seguridad

### ✅ Puntos Críticos Resueltos

| # | Problema Anterior | Solución Implementada |
|---|------------------|----------------------|
| 1 | ⚠️ Contraseñas en texto plano | ✅ Firebase hashea automáticamente (bcrypt) |
| 2 | ⚠️ Sin backend real | ✅ Firebase como backend serverless |
| 3 | ⚠️ Sin validación del servidor | ✅ Firestore Security Rules robustas |
| 4 | ⚠️ Sin tests | ✅ Suite completa de tests de seguridad |

### Security Rules Implementadas

Las reglas de Firestore (`firestore.rules`) incluyen:

- ✅ **Autenticación obligatoria** para todas las operaciones
- ✅ **Validación de edad** (18+) al registrarse
- ✅ **Prevención de suplantación** de identidad
- ✅ **Límites de longitud** en mensajes (1000 caracteres max)
- ✅ **Protección contra auto-promoción** a Premium
- ✅ **Usuarios solo pueden editar** su propio perfil
- ✅ **Emails inmutables** una vez creados
- ✅ **Validación de formato** de email
- ✅ **Filtro básico** de palabras prohibidas
- ✅ **Reportes anónimos** con validación

Ver `firestore.rules` para detalles completos.

---

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Iniciar servidor de desarrollo

# Producción
npm run build              # Compilar para producción
npm run preview            # Preview de build de producción

# Firebase
firebase emulators:start   # Iniciar emuladores locales
firebase deploy            # Desplegar a Firebase Hosting
firebase deploy --only firestore:rules  # Solo desplegar rules

# Testing
npm run test:firestore     # Ejecutar tests de Security Rules

# Linting
npm run lint               # Ejecutar ESLint
```

---

## 🌐 Deployment a Producción

### Opción 1: Firebase Hosting (Recomendado)

```bash
# Build de producción
npm run build

# Inicializar hosting (primera vez)
firebase init hosting

# Desplegar
firebase deploy
```

Tu app estará disponible en: `https://tu-proyecto.web.app`

### Opción 2: Otros servicios

El build generado en `dist/` puede desplegarse en:
- Vercel
- Netlify
- GitHub Pages
- Cualquier hosting estático

**IMPORTANTE**: No olvides configurar las variables de entorno en tu servicio de hosting.

---

## 🔧 Configuración Adicional

### Configurar índices de Firestore

Algunos queries requieren índices compuestos. Firebase te mostrará un link en la consola cuando sea necesario, o puedes desplegarlos manualmente:

```bash
firebase deploy --only firestore:indexes
```

### Habilitar Analytics (Opcional)

1. En Firebase Console, habilita Google Analytics
2. Añade `VITE_FIREBASE_MEASUREMENT_ID` a tu `.env`

---

## 📚 Recursos

### Firebase
- [Documentación oficial](https://firebase.google.com/docs)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Authentication Guide](https://firebase.google.com/docs/auth)

### Stack del Proyecto
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

## 🐛 Troubleshooting

### Error: "Firebase not initialized"
- Verifica que `.env` esté correctamente configurado
- Asegúrate de haber copiado todas las credenciales de Firebase

### Error: "Permission denied" en Firestore
- Verifica que las Security Rules estén desplegadas: `firebase deploy --only firestore:rules`
- Revisa que el usuario esté autenticado

### Tests fallan
- Asegúrate de tener los emuladores corriendo: `firebase emulators:start`
- Verifica que el puerto 8080 no esté ocupado

### npm install muy lento
- El primer `npm install` puede tardar varios minutos
- Si se interrumpe, intenta de nuevo: `npm install`

---

## 📝 Notas de Migración

Si vienes de la versión localStorage, tus datos locales **no se migrarán automáticamente**. Para migrar usuarios:

1. Los usuarios deberán registrarse nuevamente
2. La migración manual requiere un script personalizado

**Backup recomendado** antes de migrar:
```bash
# Copia los archivos originales
cp src/contexts/AuthContext.jsx src/contexts/AuthContext.backup.jsx
cp src/pages/ChatPage.jsx src/pages/ChatPage.backup.jsx
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👥 Autores

- **Tu Nombre** - Desarrollo principal

---

## 🙏 Agradecimientos

- Comunidad LGBTQ+ por la inspiración
- Firebase por la infraestructura
- Radix UI por componentes accesibles
- Tailwind CSS por el sistema de diseño

---

## 📞 Soporte

Si tienes preguntas o problemas:
- 📧 Email: soporte@chactivo.app
- 💬 Discord: [Link al servidor]
- 🐛 Issues: [GitHub Issues]

---

**¡Gracias por usar Chactivo! 🌈**
