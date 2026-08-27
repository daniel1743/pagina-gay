# 🔵 CONFIGURACIÓN DE SUPABASE

## 📋 Resumen

Este documento explica cómo configurar Supabase como alternativa o reemplazo de Firebase en Chactivo.

## 🎯 ¿Por qué Supabase?

Supabase es una alternativa open-source a Firebase que ofrece:
- ✅ PostgreSQL (base de datos relacional más potente que Firestore)
- ✅ Autenticación integrada
- ✅ Realtime subscriptions (similar a Firestore)
- ✅ Storage para archivos
- ✅ Row Level Security (RLS) más flexible que Firestore Rules
- ✅ API REST automática
- ✅ Plan gratuito generoso

## 📦 Instalación

### 1. Dependencias

Las dependencias ya están instaladas:
```bash
npm install @supabase/supabase-js
```

### 2. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Firebase (mantener para migración gradual)
VITE_FIREBASE_API_KEY=

VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Ve a **Settings** → **API**
5. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 🗄️ Estructura de Base de Datos

### Tablas Principales

```sql
-- Usuarios (equivalente a /users en Firestore)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  username TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  is_premium BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salas de chat (equivalente a /rooms en Firestore)
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes (equivalente a /rooms/{roomId}/messages)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id UUID REFERENCES users(id),
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  _unauthenticated BOOLEAN DEFAULT false,
  sender_uid TEXT
);

-- Notificaciones
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_messages_room_timestamp ON messages(room_id, timestamp DESC);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
```

## 🔒 Row Level Security (RLS)

### Políticas de Seguridad

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para mensajes
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Políticas para notificaciones
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

## 🔄 Migración desde Firebase

### Servicios Equivalentes

| Firebase | Supabase | Notas |
|----------|----------|-------|
| `auth` | `supabase.auth` | API similar |
| `firestore()` | `supabase.from('table')` | Usar SQL queries |
| `storage` | `supabase.storage` | API similar |
| `onSnapshot()` | `supabase.channel()` | Realtime subscriptions |

### Ejemplo: Migrar Chat Service

**Firebase (actual):**
```javascript
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

const messagesRef = collection(db, 'rooms', roomId, 'messages');
const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
  // ...
});
```

**Supabase (nuevo):**
```javascript
import { supabase } from '@/config/supabase';

const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`
  }, (payload) => {
    // ...
  })
  .subscribe();
```

## 🚀 Uso

### 1. Importar Supabase

```javascript
import { supabase, auth, db } from '@/config/supabase';
```

### 2. Autenticación

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in anonymously
const { data, error } = await supabase.auth.signInAnonymously();

// Sign out
await supabase.auth.signOut();
```

### 3. Base de Datos

```javascript
// Leer datos
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('room_id', 'principal')
  .order('timestamp', { ascending: false })
  .limit(50);

// Insertar datos
const { data, error } = await supabase
  .from('messages')
  .insert({
    room_id: 'principal',
    username: 'Usuario',
    content: 'Hola mundo'
  });

// Actualizar datos
const { data, error } = await supabase
  .from('users')
  .update({ username: 'NuevoNombre' })
  .eq('id', userId);
```

### 4. Realtime

```javascript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.principal`
  }, (payload) => {
    console.log('Nuevo mensaje:', payload.new);
  })
  .subscribe();

// Limpiar suscripción
channel.unsubscribe();
```

### 5. Storage

```javascript
// Subir archivo
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file);

// Obtener URL pública
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);
```

## 📊 Comparación Firebase vs Supabase

| Característica | Firebase | Supabase |
|---------------|----------|----------|
| Base de datos | Firestore (NoSQL) | PostgreSQL (SQL) |
| Query language | Firestore queries | SQL |
| Realtime | onSnapshot | Realtime subscriptions |
| Auth | Firebase Auth | Supabase Auth |
| Storage | Firebase Storage | Supabase Storage |
| Rules | Firestore Rules | Row Level Security |
| Plan gratuito | 50K lecturas/día | 500MB DB, 1GB storage |

## ✅ Checklist de Migración

- [ ] Instalar dependencias
- [ ] Configurar variables de entorno
- [ ] Crear proyecto en Supabase
- [ ] Crear tablas en PostgreSQL
- [ ] Configurar Row Level Security
- [ ] Migrar servicios de autenticación
- [ ] Migrar servicios de base de datos
- [ ] Migrar servicios de storage
- [ ] Migrar realtime subscriptions
- [ ] Probar en localhost
- [ ] Migrar datos de producción (si aplica)
- [ ] Actualizar documentación

## 🔗 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Migración Firebase → Supabase](https://supabase.com/docs/guides/migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Nota:** Este setup permite usar Supabase en paralelo con Firebase durante la migración. Puedes migrar gradualmente servicio por servicio.


