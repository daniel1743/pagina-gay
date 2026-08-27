# 🔵 VARIABLES DE ENTORNO PARA SUPABASE

## 📋 Variables Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui

# ============================================
# FIREBASE (Mantener durante migración)
# ============================================
VITE_FIREBASE_API_KEY=

VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🔑 Cómo Obtener las Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto o selecciona uno existente
4. Ve a **Settings** → **API**
5. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## ⚠️ Importante

- **NO** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Las variables deben empezar con `VITE_` para que Vite las exponga al frontend
- Puedes usar Supabase y Firebase en paralelo durante la migración

## 📚 Más Información

Consulta `docs/supabase-setup.md` para la guía completa de configuración.


