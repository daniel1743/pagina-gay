# 🚀 Guía Rápida: Deploy en Vercel

## ✅ Pre-requisitos Completados

Ya tienes todo listo:
- ✅ `vercel.json` configurado
- ✅ `robots.txt` creado
- ✅ `sitemap.xml` creado
- ✅ `manifest.json` (PWA) creado
- ✅ `.vercelignore` configurado
- ✅ `index.html` optimizado con SEO
- ✅ Build scripts funcionando

---

## 📋 Pasos para Deploy

### 1. Crear Cuenta en Vercel

Ve a [vercel.com](https://vercel.com) y:
- Registra con GitHub
- Conecta tu repositorio

### 2. Importar Proyecto

En Vercel Dashboard:
1. Click "Add New Project"
2. Selecciona tu repositorio de GitHub
3. Vercel detectará automáticamente que es Vite

### 3. Configurar Variables de Entorno

En Project Settings → Environment Variables, agrega:

```
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

**IMPORTANTE:** Estos valores están en tu archivo `.env` actual.

### 4. Deploy

1. Click "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

---

## 🌐 Configurar Dominio Personalizado

### Si tienes dominio propio:

1. Ve a Project Settings → Domains
2. Agrega tu dominio (ej: `chactivo.app`)
3. Configura DNS según instrucciones de Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

## 🔥 Configurar Firebase para Producción

### 1. Agregar Dominio Autorizado

En Firebase Console → Authentication → Settings:

**Authorized Domains:** Agrega tu dominio de Vercel:
```
tu-proyecto.vercel.app
chactivo.app (si tienes dominio custom)
```

### 2. Actualizar CORS (si usas Storage)

En Firebase Console → Storage → Rules:
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🧪 Testing Post-Deploy

### Checklist de pruebas:

- [ ] Login funciona
- [ ] Registro funciona
- [ ] Chat en tiempo real funciona
- [ ] Cargar salas funciona
- [ ] Enviar mensajes funciona
- [ ] Denuncias se guardan
- [ ] Modo oscuro/claro funciona
- [ ] Responsive en mobile
- [ ] PWA instalable

### Comandos útiles:

```bash
# Probar build localmente
npm run build
npm run preview

# Ver logs de Vercel
vercel logs

# Hacer rollback si algo falla
vercel rollback
```

---

## 📊 Configurar Google Analytics (Opcional)

### 1. Crear cuenta GA4

1. Ve a [analytics.google.com](https://analytics.google.com)
2. Crea propiedad nueva (GA4)
3. Copia tu Measurement ID (ej: `G-XXXXXXXXXX`)

### 2. Agregar a tu app

En `index.html`, antes de cerrar `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🔍 Configurar Google Search Console

1. Ve a [search.google.com/search-console](https://search.google.com/search-console)
2. Agrega tu dominio
3. Verifica propiedad (opción: HTML tag)
4. Envía tu sitemap: `https://chactivo.app/sitemap.xml`

---

## ⚡ Optimizaciones Post-Deploy

### Performance:

```bash
# Analizar bundle size
npm run build
npx vite-bundle-visualizer
```

### Comprimir imágenes:

Usa [tinypng.com](https://tinypng.com) o:
```bash
npm install -D vite-plugin-imagemin
```

---

## 🐛 Solución de Problemas

### Build falla en Vercel:

**Error:** "Cannot find module X"
**Solución:** Verifica que todas las dependencias estén en `package.json`

```bash
npm install --save-dev @types/node
```

### Firebase Auth no funciona:

**Error:** "auth/unauthorized-domain"
**Solución:** Agrega dominio de Vercel en Firebase Console

### Rutas 404:

**Error:** Refresh da 404
**Solución:** Ya configurado en `vercel.json` (rewrites)

---

## 📈 Monitoreo

### Métricas importantes:

- **Page Load Time:** < 3 segundos
- **First Contentful Paint:** < 1.5 segundos
- **Time to Interactive:** < 3.5 segundos

### Ver en Vercel:

Analytics → Speed Insights (automático en plan Pro)

---

## 🎉 ¡Listo!

Tu app está en producción. Ahora puedes:

1. ✅ Compartir el link con usuarios beta
2. ✅ Monitorear errores en tiempo real
3. ✅ Implementar más features
4. ✅ Configurar pasarela de pago

**Próximos pasos:** Ver `INFORME_PREMIUM_DEPLOY_SEO.md` para roadmap completo.

---

## 🆘 Soporte

**Documentación oficial:**
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs
- Vite: https://vitejs.dev/guide/

**Comandos útiles:**

```bash
# Deploy manual (si no usas GitHub)
npm install -g vercel
vercel

# Ver logs en tiempo real
vercel logs --follow

# Ver deployment actual
vercel inspect
```

---

**¿Dudas?** Revisa el archivo `INFORME_PREMIUM_DEPLOY_SEO.md` para más detalles.
