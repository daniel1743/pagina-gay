# 🌱 INSTRUCCIONES PARA SEMBRAR CONVERSACIONES EN CHAT PRINCIPAL

**Fecha:** 2025-01-27  
**Sala:** Chat Principal (`principal`)

---

## ⚠️ PASO 1: ACTUALIZAR REGLAS DE FIRESTORE

**CRÍTICO:** Antes de sembrar, debes actualizar las reglas de Firestore en Firebase Console.

### Pasos:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **"Firestore Database"** → **"Reglas"** (Rules)
4. Copia el contenido de `firestore.rules` (ya actualizado localmente)
5. Pega y reemplaza todo el contenido
6. Click en **"Publicar"** (Publish)

**Sin este paso, los mensajes NO se podrán escribir en Firestore.**

---

## 🌱 PASO 2: SEMBRAR CONVERSACIONES

### Opción A: Automático (cuando alguien entra a la sala)

El servicio se ejecuta automáticamente cuando un usuario entra a "Chat Principal". Solo verifica si ya hay conversaciones y si no, las siembra.

### Opción B: Manual (desde la consola del navegador)

1. Abre la consola del navegador (F12)
2. Ejecuta:

```javascript
window.seedConversations('principal')
```

3. Espera a que termine (verás logs en la consola)
4. Recarga la página para ver las conversaciones

---

## 📋 ESTRUCTURA DE LAS CONVERSACIONES

### Total: 10 conversaciones (~60 mensajes)

1. **Carlos28 ↔ Miguel25** - Saludo y presentación
2. **ScortPro ↔ Javier30** - Scort con detalles
3. **Andrés27 ↔ Luis24** - Búsqueda casual
4. **Roberto29 ↔ Diego26** - Conversación larga
5. **Fernando31 ↔ Sergio23** - Intercambio directo
6. **Pablo28 ↔ Ricardo25** - Conversación casual
7. **ScortElite ↔ Mario32** - Scort con precios
8. **Alejandro27 ↔ Gonzalo24** - Búsqueda específica
9. **Héctor29 ↔ Cristian26** - Conversación amigable
10. **Eduardo30 ↔ Felipe25** - Intercambio directo

### Ejemplos de mensajes:

- "Hola, cómo están?"
- "Verga y tú?"
- "También, bueno yo doy verga"
- "Hola, soy scort"
- "Me mide 22cm, soy activo"
- "Santiago centro, tú?"
- "Alguien activo?"
- "Algo casual, pasivo aquí"
- "50k la hora"

---

## 🔍 VERIFICACIÓN

### Después de sembrar, verifica:

1. **En la consola del navegador:**
   - Deberías ver logs: `✅ [SEED] Mensaje sembrado: ...`
   - Al final: `✅ [SEED] 5 conversaciones sembradas exitosamente`

2. **En Firebase Console:**
   - Ve a Firestore Database
   - Navega a `rooms` → `principal` → `messages`
   - Deberías ver ~30 mensajes con `userId` que empieza con `seed_user_`

3. **En el chat:**
   - Recarga la página
   - Deberías ver las conversaciones aparecer en el historial

---

## ⚠️ PROBLEMAS COMUNES

### 1. No aparecen mensajes después de sembrar

**Causa:** Reglas de Firestore no actualizadas  
**Solución:** Actualiza las reglas en Firebase Console (ver Paso 1)

### 2. Error: "Permission denied"

**Causa:** Las reglas no permiten `seed_user_*`  
**Solución:** Verifica que las reglas incluyan `data.userId.matches('seed_user_.*')`

### 3. Ya hay conversaciones sembradas

**Causa:** El servicio detecta que ya hay mensajes con `seed_user_*`  
**Solución:** Si quieres volver a sembrar, elimina los mensajes antiguos de Firestore primero

---

## 🎯 RESULTADO ESPERADO

Después de sembrar, cuando un usuario entre a "Chat Principal", verá:

- ✅ Conversaciones genuinas entre usuarios
- ✅ Saludos naturales
- ✅ Búsquedas de activos/pasivos
- ✅ Información de scorts (22cm, precios, ubicación)
- ✅ Intercambios directos
- ✅ Conversaciones amigables

**Todo esto hace que la sala se vea activa y con usuarios reales conversando.**

---

## 📝 NOTAS

- Los mensajes aparecen como si hubieran ocurrido hace 20-120 minutos
- Cada conversación tiene delays naturales entre mensajes
- Los usuarios tienen avatares generados automáticamente
- Los mensajes son identificables por `userId` que empieza con `seed_user_`

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Servicio listo, requiere actualizar reglas de Firestore

