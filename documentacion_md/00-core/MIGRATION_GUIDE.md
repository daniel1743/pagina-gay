# 🔄 Guía de Migración a Firebase

Esta guía te ayudará a migrar Chactivo de localStorage a Firebase paso a paso.

---

## ✅ Checklist de Migración

### Fase 1: Preparación (15 minutos)

- [ ] **1.1** Crear cuenta en [Firebase Console](https://console.firebase.google.com/)
- [ ] **1.2** Crear nuevo proyecto "Chactivo"
- [ ] **1.3** Habilitar Authentication (Email/Password)
- [ ] **1.4** Crear base de datos Firestore (modo producción)
- [ ] **1.5** Instalar Firebase CLI: `npm install -g firebase-tools`
- [ ] **1.6** Login en Firebase: `firebase login`

### Fase 2: Instalación (10 minutos)

```bash
cd "C:\Users\Lenovo\Downloads\gay chat"
npm install firebase
```

- [ ] **2.1** Ejecutar comando de instalación
- [ ] **2.2** Verificar que se instaló correctamente: `npm list firebase`

### Fase 3: Configuración (10 minutos)

- [ ] **3.1** Copiar `.env.example` a `.env`: `copy .env.example .env`
- [ ] **3.2** Ir a Firebase Console → Configuración del proyecto
- [ ] **3.3** Añadir app web y copiar credenciales
- [ ] **3.4** Pegar credenciales en `.env`

Ejemplo de `.env`:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=chactivo-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chactivo-12345
VITE_FIREBASE_STORAGE_BUCKET=chactivo-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_USE_FIREBASE_EMULATOR=false
```

- [ ] **3.5** Guardar archivo `.env`

### Fase 4: Desplegar Security Rules (5 minutos)

```bash
firebase init firestore
# Seleccionar proyecto existente
# Usar archivos por defecto (firestore.rules, firestore.indexes.json)

firebase deploy --only firestore:rules
```

- [ ] **4.1** Inicializar Firestore
- [ ] **4.2** Desplegar rules
- [ ] **4.3** Verificar en Firebase Console que las rules se desplegaron

### Fase 5: Activar Firebase en el Código (5 minutos)

#### Opción A: Reemplazar archivos (Recomendado)

```bash
# Backup de archivos originales
move src\contexts\AuthContext.jsx src\contexts\AuthContext.backup.jsx
move src\pages\ChatPage.jsx src\pages\ChatPage.backup.jsx

# Activar versión Firebase
move src\contexts\AuthContext.firebase.jsx src\contexts\AuthContext.jsx
move src\pages\ChatPage.firebase.jsx src\pages\ChatPage.jsx
```

- [ ] **5.1** Ejecutar comandos de backup
- [ ] **5.2** Activar archivos Firebase
- [ ] **5.3** Verificar que los archivos existen en las rutas correctas

#### Opción B: Editar manualmente (Avanzado)

Si prefieres integrar el código tú mismo, revisa:
- `src/contexts/AuthContext.firebase.jsx` (nueva autenticación)
- `src/pages/ChatPage.firebase.jsx` (chat en tiempo real)
- `src/services/userService.js` (servicios de usuario)
- `src/services/chatService.js` (servicios de chat)

### Fase 6: Probar Localmente (10 minutos)

```bash
npm run dev
```

- [ ] **6.1** Iniciar servidor de desarrollo
- [ ] **6.2** Abrir `http://localhost:3000`
- [ ] **6.3** Registrar nuevo usuario de prueba
- [ ] **6.4** Verificar en Firebase Console → Authentication que se creó
- [ ] **6.5** Enviar mensaje en un chat
- [ ] **6.6** Verificar en Firebase Console → Firestore que se guardó

### Fase 7: Testing (Opcional, 15 minutos)

```bash
# Instalar dependencias de testing
npm install -D @firebase/rules-unit-testing jest

# Iniciar emuladores en terminal separada
npm run emulators

# En otra terminal, ejecutar tests
npm run test:firestore
```

- [ ] **7.1** Instalar dependencias de tests
- [ ] **7.2** Iniciar emuladores
- [ ] **7.3** Ejecutar tests
- [ ] **7.4** Verificar que todos los tests pasan ✅

---

## 🚨 Problemas Comunes

### Error: "Firebase not initialized"

**Causa**: `.env` no está configurado o no se cargó

**Solución**:
```bash
# Verificar que .env existe
dir .env

# Si no existe, copiar desde ejemplo
copy .env.example .env

# Reiniciar servidor de desarrollo
npm run dev
```

### Error: "Permission denied" al crear usuario

**Causa**: Security Rules no se desplegaron

**Solución**:
```bash
firebase deploy --only firestore:rules
```

### Error: "Module not found: firebase"

**Causa**: Firebase no se instaló correctamente

**Solución**:
```bash
# Limpiar caché e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
npm install firebase
```

### Emuladores no inician

**Causa**: Puerto ocupado o Java no instalado

**Solución**:
```bash
# Verificar puertos ocupados
netstat -ano | findstr :8080
netstat -ano | findstr :9099

# Matar procesos si es necesario
taskkill /PID <PID> /F

# Instalar Java si no está instalado
# Descargar de: https://www.java.com/download/
```

---

## 📊 Verificación de Migración Exitosa

### Checklist Final

- [ ] ✅ Puedes registrar nuevos usuarios
- [ ] ✅ Los usuarios aparecen en Firebase Console → Authentication
- [ ] ✅ Puedes iniciar sesión con credenciales correctas
- [ ] ✅ Sesión incorrecta muestra error apropiado
- [ ] ✅ Puedes enviar mensajes en salas de chat
- [ ] ✅ Los mensajes aparecen en Firebase Console → Firestore
- [ ] ✅ Los mensajes se sincronizan en tiempo real
- [ ] ✅ Puedes actualizar tu perfil
- [ ] ✅ Los cambios persisten al recargar la página
- [ ] ✅ Usuarios invitados tienen límite de 3 mensajes

---

## 🔐 Verificación de Seguridad

### Tests Manuales de Seguridad

1. **Test de contraseña hasheada**:
   - [ ] Ve a Firebase Console → Authentication
   - [ ] No deberías poder ver las contraseñas en texto plano ✅
   - [ ] Solo se muestra información cifrada

2. **Test de validación de edad**:
   ```javascript
   // Intenta registrar usuario menor de edad desde consola del navegador
   // Debería fallar
   ```

3. **Test de edición de perfil ajeno**:
   ```javascript
   // Intenta actualizar perfil de otro usuario
   // Debería fallar con "Permission denied"
   ```

4. **Test de mensajes sin autenticación**:
   - [ ] Cierra sesión
   - [ ] Intenta acceder directamente a `/chat/conversas-libres`
   - [ ] Debería redirigir a login

---

## 📈 Métricas de Éxito

Después de migrar, verifica en Firebase Console:

### Authentication
- Nuevos usuarios registrados: ✅
- Login/Logout funcionando: ✅
- Tokens de sesión válidos: ✅

### Firestore
- Colección `users` con perfiles: ✅
- Colección `rooms/{roomId}/messages`: ✅
- Timestamps correctos: ✅

### Security Rules
- Reglas activas y validando: ✅
- No errores de permission denied incorrectos: ✅

---

## 🎉 ¡Migración Completada!

Si todos los checkboxes están marcados, ¡felicidades! Has migrado exitosamente a Firebase.

### Próximos Pasos

1. **Backup de archivos antiguos**:
   ```bash
   # Los archivos .backup.jsx se pueden eliminar después de verificar
   # que todo funciona correctamente
   ```

2. **Desplegar a producción** (cuando estés listo):
   ```bash
   npm run deploy
   ```

3. **Monitorear métricas** en Firebase Console:
   - Authentication → Usuarios activos
   - Firestore → Uso de datos
   - Performance → Tiempos de respuesta

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa logs**:
   - Consola del navegador (F12)
   - Terminal donde corre `npm run dev`
   - Firebase Console → Firestore → Logs

2. **Revisa documentación**:
   - [README.md](./README.md)
   - [Firebase Docs](https://firebase.google.com/docs)

3. **Rollback si es necesario**:
   ```bash
   # Restaurar archivos originales
   move src\contexts\AuthContext.backup.jsx src\contexts\AuthContext.jsx
   move src\pages\ChatPage.backup.jsx src\pages\ChatPage.jsx
   ```

---

**Tiempo total estimado**: 1-2 horas

**Dificultad**: Media

**Requiere conocimientos**: Básicos de terminal, JavaScript, configuración de servicios cloud
