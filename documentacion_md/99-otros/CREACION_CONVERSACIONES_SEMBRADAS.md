# 🌱 CREACIÓN DE CONVERSACIONES SEMBRADAS PARA "CHAT PRINCIPAL"

**Fecha:** 2025-01-27  
**Objetivo:** Crear conversaciones pre-escritas genuinas para que los usuarios vean actividad real al entrar a "Chat Principal"

---

## ✅ SERVICIO CREADO

Se ha creado el servicio `src/services/seedConversationsService.js` que genera conversaciones genuinas entre usuarios gays.

---

## 🎭 CONVERSACIONES INCLUIDAS

El servicio incluye **10 conversaciones pre-escritas** que simulan interacciones reales:

### Tipos de Conversaciones:

1. **Saludos y presentaciones**
   - "Hola, cómo están?"
   - "Hola, todo bien! Y tú?"
   - "Bien también, qué buscas?"
   - "Verga y tú?"
   - "También, bueno yo doy verga"

2. **Scorts**
   - "Hola, soy scort"
   - "Me mide 22cm, soy activo"
   - "Santiago centro, tú?"
   - "50k la hora"

3. **Búsquedas casuales**
   - "Hola, alguien activo?"
   - "Yo, qué buscas?"
   - "Algo casual, pasivo aquí"
   - "Perfecto, dónde estás?"

4. **Intercambios directos**
   - "Alguien en Providencia?"
   - "Yo, qué buscas?"
   - "Algo ahora mismo"
   - "Activo o pasivo?"

5. **Conversaciones amigables**
   - "Hola a todos"
   - "Bien, buscando conocer gente"
   - "De dónde eres?"
   - "Santiago centro, tú?"

---

## 🔧 FUNCIONAMIENTO

### Características:

1. **Solo se activa en "Chat Principal"**
   - Verifica que `roomId === 'principal'`
   - No afecta otras salas

2. **Se siembra solo una vez**
   - Verifica si ya hay conversaciones sembradas
   - Evita duplicar mensajes

3. **Timestamps realistas**
   - Las conversaciones aparecen como si hubieran ocurrido hace 2 horas
   - Cada mensaje tiene un delay natural entre ellos

4. **Usuarios simulados**
   - Nombres realistas: Carlos28, Miguel25, ScortPro, etc.
   - Avatares generados automáticamente
   - UserIds: `seed_user_*` (identificables como sembrados)

5. **Estructura de mensajes**
   - Compatible con Firestore
   - Incluye `trace` para identificar origen
   - Timestamps realistas

---

## 📋 ESTRUCTURA DE MENSAJES

```javascript
{
  userId: 'seed_user_carlos28',
  username: 'Carlos28',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos28&backgroundColor=b6e3f4',
  content: 'Hola, cómo están?',
  type: 'text',
  timestamp: Timestamp, // Hace 2 horas
  senderUid: 'seed_user_carlos28',
  trace: {
    origin: 'SYSTEM',
    source: 'SEEDED_CONVERSATION',
    actorId: 'seed_user_carlos28',
    actorType: 'BOT',
    system: 'seedConversationsService',
    traceId: 'seed_principal_0_0_...',
    createdAt: Date.now()
  }
}
```

---

## 🔄 INTEGRACIÓN

### En `ChatPage.jsx`:

```javascript
import { checkAndSeedConversations } from '@/services/seedConversationsService';

// Dentro del useEffect cuando el usuario entra a la sala:
checkAndSeedConversations(roomId);
```

### Comportamiento:

- Se ejecuta automáticamente cuando un usuario entra a "Chat Principal"
- Espera 2 segundos antes de sembrar (para no interferir con la carga inicial)
- Solo siembra si no hay conversaciones previas

---

## 📊 CONVERSACIONES SEMBRADAS

### Total: 10 conversaciones

1. **Carlos28 ↔ Miguel25** - Saludo y presentación (6 mensajes)
2. **ScortPro ↔ Javier30** - Scort con detalles (6 mensajes)
3. **Andrés27 ↔ Luis24** - Búsqueda casual (6 mensajes)
4. **Roberto29 ↔ Diego26** - Conversación larga (7 mensajes)
5. **Fernando31 ↔ Sergio23** - Intercambio directo (6 mensajes)
6. **Pablo28 ↔ Ricardo25** - Conversación casual (5 mensajes)
7. **ScortElite ↔ Mario32** - Scort con precios (6 mensajes)
8. **Alejandro27 ↔ Gonzalo24** - Búsqueda específica (6 mensajes)
9. **Héctor29 ↔ Cristian26** - Conversación amigable (6 mensajes)
10. **Eduardo30 ↔ Felipe25** - Intercambio directo (6 mensajes)

**Total de mensajes:** ~60 mensajes sembrados

---

## ✅ VERIFICACIÓN

### Estado:

- ✅ Servicio creado: `src/services/seedConversationsService.js`
- ✅ Integrado en `ChatPage.jsx`
- ✅ Solo se activa en sala "principal"
- ✅ Verifica duplicados antes de sembrar
- ✅ Timestamps realistas (hace 2 horas)
- ✅ Estructura compatible con Firestore

---

## 🎯 RESULTADO ESPERADO

Cuando un usuario entre a "Chat Principal", verá:

- ✅ Conversaciones genuinas entre usuarios
- ✅ Saludos naturales
- ✅ Búsquedas de activos/pasivos
- ✅ Información de scorts
- ✅ Intercambios directos
- ✅ Conversaciones amigables

**Todo esto hace que la sala se vea activa y con usuarios reales conversando.**

---

## ⚠️ NOTAS IMPORTANTES

1. **Identificación de mensajes sembrados:**
   - UserIds empiezan con `seed_user_`
   - Trace incluye `source: 'SEEDED_CONVERSATION'`
   - Fácil de identificar si se necesita filtrar

2. **No se duplican:**
   - El servicio verifica si ya hay mensajes sembrados
   - Solo siembra una vez por sala

3. **Timestamps:**
   - Las conversaciones aparecen como si ocurrieron hace 2 horas
   - Cada mensaje tiene un delay natural

---

**Última actualización:** 2025-01-27  
**Estado:** ✅ Servicio creado e integrado  
**Sala objetivo:** `principal` (Chat Principal)

