# 🔵 CONFIGURACIÓN COMPLETA DE SUPABASE

## ✅ Credenciales Configuradas

Las credenciales de Supabase han sido configuradas en el archivo `.env`.

---

## 📋 PASO 1: Configurar en Supabase Dashboard

### 1.1 Crear Tablas en PostgreSQL

Ve a **Supabase Dashboard** → **SQL Editor** y ejecuta este script:

```sql
-- ============================================
-- TABLA: users (Usuarios)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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

-- ============================================
-- TABLA: rooms (Salas de Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: messages (Mensajes)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  _unauthenticated BOOLEAN DEFAULT false,
  sender_uid TEXT
);

-- ============================================
-- TABLA: notifications (Notificaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_room_timestamp 
  ON messages(room_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_user 
  ON messages(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- ============================================
-- INSERTAR SALAS PREDETERMINADAS
-- ============================================
INSERT INTO rooms (id, name, description) VALUES
  ('principal', 'Chat Principal', 'Sala principal de conversación'),
  ('gaming', 'Gaming', 'Chat para gamers'),
  ('mas-30', '+30', 'Chat para mayores de 30'),
  ('amistad', 'Amistad', 'Chat para hacer amigos'),
  ('osos-activos', 'Osos Activos', 'Chat para osos activos'),
  ('pasivos-buscando', 'Pasivos Buscando', 'Chat para pasivos'),
  ('versatiles', 'Versátiles', 'Chat para versátiles'),
  ('quedar-ya', 'Quedar Ya', 'Chat para quedar ya'),
  ('hablar-primero', 'Hablar Primero', 'Chat para iniciar conversación'),
  ('morbosear', 'Morbosear', 'Chat para morbo')
ON CONFLICT (id) DO NOTHING;
```

### 1.2 Configurar Row Level Security (RLS)

Ejecuta este script en el **SQL Editor**:

```sql
-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA USUARIOS
-- ============================================
-- Todos pueden leer perfiles públicos
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  USING (true);

-- Solo el dueño puede actualizar su perfil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Cualquiera puede crear un usuario (registro)
CREATE POLICY "Anyone can create user"
  ON users FOR INSERT
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA MENSAJES
-- ============================================
-- Todos pueden leer mensajes
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

-- Usuarios autenticados y anónimos pueden crear mensajes
CREATE POLICY "Authenticated and anonymous can create messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Solo el dueño puede actualizar/eliminar sus mensajes
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid()::text = sender_uid OR user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid()::text = sender_uid OR user_id = auth.uid());

-- ============================================
-- POLÍTICAS PARA NOTIFICACIONES
-- ============================================
-- Solo el dueño puede leer sus notificaciones
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Cualquiera puede crear notificaciones
CREATE POLICY "Anyone can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Solo el dueño puede actualizar sus notificaciones
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS PARA SALAS
-- ============================================
-- Todos pueden leer salas
CREATE POLICY "Anyone can read rooms"
  ON rooms FOR SELECT
  USING (true);
```

### 1.3 Configurar Storage (Opcional - para avatares/fotos)

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un bucket llamado `avatars`
3. Configura las políticas:

```sql
-- Política para leer avatares (público)
CREATE POLICY "Avatares are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Política para subir avatares (solo autenticados)
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para actualizar avatares (solo dueño)
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 📋 PASO 2: Configurar en Vercel (si usas Vercel)

### 2.1 Variables de Entorno en Vercel

1. Ve a tu proyecto en **Vercel Dashboard**
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

```
VITE_SUPABASE_URL = https://xlnwpixqkjcozkqgoutf.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbndwaXhxa2pjb3prcWdvdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDQ3MDMsImV4cCI6MjA4MzMyMDcwM30.FojzbtBDvQSXq9E7PXiw8fXgiX_ena96JlyZxxffHn8
```

**⚠️ IMPORTANTE:**
- NO agregues la `service_role` key en Vercel (solo en backend/server)
- La `anon` key es segura para el frontend
- Después de agregar las variables, **redespliega** tu aplicación

### 2.2 Verificar Configuración

Después de configurar, verifica que las variables estén disponibles:
- Ve a **Deployments** → Selecciona el último deployment
- Revisa los logs para confirmar que las variables se cargaron

---

## 📋 PASO 3: Verificar en Localhost

### 3.1 Archivo .env

El archivo `.env` ya está configurado con:
```env
VITE_SUPABASE_URL=https://xlnwpixqkjcozkqgoutf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbndwaXhxa2pjb3prcWdvdXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDQ3MDMsImV4cCI6MjA4MzMyMDcwM30.FojzbtBDvQSXq9E7PXiw8fXgiX_ena96JlyZxxffHn8
```

### 3.2 Probar Conexión

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   ✅ [SUPABASE] Cliente inicializado
   ✅ [SUPABASE] URL: https://xlnwpixqkjcozkqgoutf.supabase.co
   ```

---

## 🔒 Seguridad

### ⚠️ NUNCA Expongas:

- ❌ `service_role` key en el frontend
- ❌ `service_role` key en Vercel (solo si tienes funciones serverless)
- ❌ Credenciales en el código fuente
- ❌ Credenciales en commits de Git

### ✅ SÍ Puedes Exponer:

- ✅ `anon` key en el frontend (está diseñada para eso)
- ✅ `anon` key en Vercel
- ✅ URL de Supabase

---

## ✅ Checklist de Configuración

### Supabase Dashboard:
- [ ] Ejecutar script SQL para crear tablas
- [ ] Ejecutar script SQL para configurar RLS
- [ ] Crear bucket de storage `avatars` (opcional)
- [ ] Configurar políticas de storage (opcional)

### Vercel (si aplica):
- [ ] Agregar `VITE_SUPABASE_URL` en Environment Variables
- [ ] Agregar `VITE_SUPABASE_ANON_KEY` en Environment Variables
- [ ] Redesplegar aplicación

### Localhost:
- [x] Archivo `.env` configurado
- [ ] Probar conexión con `npm run dev`

---

## 🚀 Siguiente Paso

Una vez completada la configuración:

1. **Probar autenticación:**
   ```javascript
   import { signInAnonymously } from '@/services/supabaseAuthService';
   const { user } = await signInAnonymously();
   ```

2. **Probar chat:**
   ```javascript
   import { subscribeToRoomMessages } from '@/services/supabaseChatService';
   const unsubscribe = subscribeToRoomMessages('principal', (messages) => {
     console.log('Mensajes:', messages);
   });
   ```

---

## 📚 Documentación Adicional

- **Guía completa:** `docs/supabase-setup.md`
- **Servicios:** `src/services/supabaseAuthService.js` y `src/services/supabaseChatService.js`
- **Configuración:** `src/config/supabase.js`

---

**✅ Estado:** Credenciales configuradas - Listo para usar Supabase


