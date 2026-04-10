# Checklist Rollback S0 + S1

**Fecha:** 2026-04-09  
**Alcance:** respaldo inicial y preparacion de separacion publico/privado  
**Estado:** listo para usar si una prueba funcional falla

---

## 1. Respaldos creados

Carpeta:

`documentacion_md/07-firebase-supabase-db/backups-seguridad-2026-04-09/`

Archivos:

- `firestore.rules.pre-s0-s1.backup`
- `storage.rules.pre-s0-s1.backup`
- `functions.index.pre-s0-s1.backup.js`

---

## 2. Cuando hacer rollback

Hacer rollback si ocurre cualquiera de estos casos despues del deploy:

- chat principal deja de cargar o enviar mensajes
- perfil publico deja de abrir
- privados dejan de abrir o sincronizarse
- carga de notificaciones falla de forma general
- upload de imagen deja de funcionar
- errores de permisos crecen en flujos sanos

---

## 3. Secuencia de rollback

1. Restaurar `firestore.rules` desde `firestore.rules.pre-s0-s1.backup`.
2. Restaurar `storage.rules` solo si el problema vino por media.
3. Restaurar `functions/index.js` desde `functions.index.pre-s0-s1.backup.js` si el fallo vino por Functions.
4. Volver a desplegar solo la pieza afectada.

Comandos sugeridos:

```powershell
Copy-Item documentacion_md\07-firebase-supabase-db\backups-seguridad-2026-04-09\firestore.rules.pre-s0-s1.backup firestore.rules -Force
Copy-Item documentacion_md\07-firebase-supabase-db\backups-seguridad-2026-04-09\storage.rules.pre-s0-s1.backup storage.rules -Force
Copy-Item documentacion_md\07-firebase-supabase-db\backups-seguridad-2026-04-09\functions.index.pre-s0-s1.backup.js functions\index.js -Force
```

Deploy por pieza:

```powershell
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only functions
```

---

## 4. Flujos criticos a probar antes de cerrar fase

- entrar desde home al chat
- entrar como invitado y mandar primer mensaje
- usuario autenticado mandar mensaje
- abrir perfil publico
- abrir privado
- recibir notificacion legitima
- subir imagen propia

---

## 5. Nota de seguridad

En esta etapa `S1` puede requerir migracion progresiva de lecturas cruzadas hacia una coleccion publica espejo antes de cerrar `/users` completamente. Si una prueba de UX falla, se revierte primero y se retoma con migracion adicional.
