# Auditoría de Costo Firebase: Fugas, Causas Probables y Modo Ahorro (29-03-2026)

## Resumen ejecutivo
Sí hay señales reales en el código de que Chactivo puede estar gastando bastante más de lo esperable para una base de usuarios pequeña.

La conclusión principal de esta auditoría es esta:

- el problema no parece ser “demasiados usuarios”
- el problema parece ser amplificación de lecturas y escrituras en tiempo real
- la principal sospecha está en presencia
- la segunda sospecha fuerte está en typing privado
- la tercera está en escrituras extra de inbox para eventos de UI
- analytics y otras capas también suman, pero no parecen el núcleo del sobrecosto

Con menos de 200 usuarios por día, un cobro de `50 USD` en menos de un mes es consistente con este patrón:

- pocos usuarios
- pero con listeners costosos
- y con documentos que se actualizan muchas veces
- propagando cambios a muchos listeners a la vez

En Firestore, ese patrón es mucho más peligroso que el volumen bruto de usuarios.

---

## Conclusión corta
Lo más probable es que Firebase te esté cobrando mucho por esta combinación:

### 1. Presencia de sala con heartbeat agresivo
- `10s` por usuario
- con listener completo de usuarios de sala
- y además listener paralelo de conteo en sidebar

### 2. Typing privado escribiendo demasiado
- la V2 parece disparar escritura de typing en cada cambio del input
- no solo al inicio y al fin de una ráfaga

### 3. `private_inbox` usado también para meta-eventos
- abrir/reabrir chat privado sigue escribiendo en inbox
- eso agrega escrituras que no siempre aportan valor real

### 4. Persistencia detallada de analytics
- hay eventos individuales en `analytics_events`
- no es el mayor sospechoso, pero sí puede sumar bastante si se trackean muchas acciones

---

## Alcance de la auditoría
Esta revisión fue hecha sobre el código del repo, no sobre la consola de billing de Firebase.

Eso significa:

- sí se puede detectar qué rutas son caras por diseño
- sí se puede identificar fugas probables
- no se puede asignar con precisión matemática el monto exacto por colección sin exportar datos de uso reales de Firebase Console

La lectura correcta entonces es:

- esto es una auditoría técnica de probabilidad de costo
- no una liquidación contable exacta

---

## Qué sí se ve ya optimizado
Antes de entrar a los hallazgos, hay cosas que no parecen ser el gran problema.

### 1. Mensajes de sala compartidos
En [chatService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/chatService.js) los listeners de mensajes están compartidos por sala y límite.

Eso es bueno.

### 2. Notificaciones del sistema compartidas
En [systemNotificationsService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/systemNotificationsService.js) el listener está compartido por usuario.

Eso también es bueno.

### 3. Notificaciones sociales compartidas
En [socialService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/socialService.js), `subscribeToNotifications(...)` también comparte listener por usuario.

### 4. Typing del chat principal deshabilitado
En [presenceService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js), el typing público está deshabilitado.

Eso evita una fuga importante.

### 5. `recentPrivateChats` no es el gran culpable del billing
En [PrivateChatContext.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/contexts/PrivateChatContext.jsx), `recentPrivateChats` vive en `localStorage`.

Eso significa:

- sí genera deuda de arquitectura
- no parece ser un gran costo directo de Firestore

Esto es importante para no optimizar lo equivocado.

---

## Hallazgos principales

| id | hallazgo | por qué cuesta | ahorro esperado | riesgo funcional si se cambia | prioridad |
| --- | --- | --- | --- | --- | --- |
| C1 | Presencia de sala con heartbeat cada 10s | cada `updateUserActivity` escribe y despierta listeners de presencia de otros clientes | alto: `50%` a `66%` solo subiendo heartbeat a `20-30s` | estado online menos inmediato | P0 |
| C2 | Duplicación funcional de lectura sobre presencia de sala | el cliente escucha usuarios completos de sala y además conteo de sala por otro listener | alto en desktop: puede reducir lecturas de presencia por cliente de forma significativa | conteo de sala menos “live” o menos detallado si se simplifica | P0 |
| C3 | Typing privado escribiendo en cada cambio del input | la V2 llama `updatePrivateChatTypingStatus(true)` por cada cambio de `newMessage` | muy alto en chats activos: `80%` a `95%` del costo de typing privado | typing puede volverse menos preciso o más lento | P0 |
| C4 | `private_inbox` se actualiza también por eventos de apertura/reapertura | se escribe backend para meta-eventos que podrían resolverse con UI local o notificación efímera | medio-alto | se pierde señal de reapertura si no se reemplaza bien | P1 |
| C5 | `subscribeToRoomUsers` escucha colección completa sin query liviana | cada cambio de un usuario en presencia impacta el listener del listado completo | alto cuando hay concurrencia real | usuarios online pueden verse con más latencia si se sustituye por resumen | P1 |
| C6 | Persistencia detallada de `analytics_events` | muchos eventos de producto escriben documentos individuales además de agregación diaria | medio | menos granularidad analítica y embudo | P2 |
| C7 | `private_inbox` tiene listener completo sin shared hub | hoy parece haber un solo consumidor principal, así que no es gran fuga todavía | bajo | casi nulo si se deja igual por ahora | P3 |
| C8 | Consultas admin / broadcast / activity existen, pero no parecen explicar gasto diario principal | son caras cuando se usan, pero no parecen steady-state de todos los usuarios | bajo a medio | herramientas admin menos completas si se recortan | P3 |

---

## Hallazgo C1: Presencia de sala demasiado agresiva

### Evidencia
En [presenceService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js):

- `CHAT_AVAILABILITY_HEARTBEAT_MS = 10 * 1000`

En [ChatPage.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx):

- se ejecuta `updateUserActivity(roomId)` por intervalo
- también se dispara al volver la visibilidad

### Por qué cuesta
Cada heartbeat:

- escribe en `roomPresence/{roomId}/users/{userId}`
- actualiza al menos `lastSeenMs`, `lastSeen`, `connectionStatus`

Eso por sí solo ya cuesta escrituras.
Pero el problema mayor es que cada cambio también:

- despierta listeners de presencia
- produce nuevas lecturas en los clientes conectados que observan esa colección

### Por qué este patrón es peligroso
Con Firestore, no pagas solo la escritura.
También pagas la propagación de cambios a listeners.

Ejemplo de orden de magnitud:

- `20` usuarios concurrentes
- heartbeat cada `10s`
- cada usuario escribe `6` veces por minuto
- eso da `120` updates de presencia por minuto

Si además cada cliente escucha presencia del room:

- `20` listeners de usuarios de sala

y en desktop además escucha conteo por otro listener:

- otros `20` listeners equivalentes

entonces quedas en un orden de magnitud aproximado de:

- `120 * 40 = 4.800` entregas de cambio por minuto

No es una cuenta exacta de billing, pero sí muestra por qué puedes pagar mucho con poca gente.

### Ahorro esperado
- subir heartbeat a `20s`: ahorro aproximado del `50%` en esa capa
- subir heartbeat a `30s`: ahorro aproximado del `66%`

### Solución recomendada
- mover heartbeat a `20s` o `30s`
- usar actualización inmediata solo en:
  - entrada a sala
  - volver a visibilidad
  - enviar mensaje
  - abrir privado

### Negativo si se cambia a modo ahorro
- punto verde menos instantáneo
- conteo “activos ahora” ligeramente más lento
- presencia puede tardar un poco más en caer

---

## Hallazgo C2: Duplicación de listeners de presencia

### Evidencia
En [ChatPage.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/pages/ChatPage.jsx):

- `subscribeToRoomUsers(roomId, ...)`

En [ChatSidebar.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/chat/ChatSidebar.jsx):

- `subscribeToMultipleRoomCounts(roomIds, ...)`

Y ese servicio en [presenceService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js):

- vuelve a escuchar `roomPresence/{roomId}/users`

### Por qué cuesta
Aunque `subscribeToMultipleRoomCounts` comparte listener dentro de la pestaña, no comparte con `subscribeToRoomUsers`.

Entonces un mismo cliente puede tener:

- un listener para lista completa de usuarios de sala
- otro listener para conteo de la misma colección

Esto es duplicación funcional sobre la misma fuente.

### Ahorro esperado
- medio a alto
- especialmente en desktop, donde sidebar está activo

### Solución recomendada
- derivar el conteo desde `roomUsers` ya suscrito en `ChatPage`
- o centralizar la presencia en un hub único y redistribuir

### Negativo si se cambia a modo ahorro
- el sidebar podría perder refresco independiente
- si el hub se rompe, varios consumidores se quedan sin dato

---

## Hallazgo C3: Typing privado probablemente demasiado costoso

### Evidencia
En [PrivateChatWindowV2.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/chat/PrivateChatWindowV2.jsx), el efecto depende de `newMessage` y hace:

- `updatePrivateChatTypingStatus(chatId, user.id, true, user.username)`

En [socialService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/socialService.js):

- `updatePrivateChatTypingStatus(...)` hace `setDoc(...)` cuando `isTyping=true`
- y `deleteDoc(...)` cuando `isTyping=false`

### Por qué cuesta
Tal como está planteado:

- si el usuario escribe `hola como estas`
- el efecto se reevalúa muchas veces
- y puede escribir `typing=true` repetidamente

Eso significa:

- muchas escrituras de typing
- muchas lecturas en el listener del otro participante

### Ahorro esperado
Muy alto si se corrige bien.

En una UX de chat activo, esta capa podría reducirse fácilmente en `80%` a `95%`:

- disparar `typing=true` solo cuando pasa de vacío a no vacío
- no reescribir `true` en cada tecla
- apagar `typing=false` solo por debounce o al enviar/salir

### Solución recomendada
- edge-trigger real:
  - `false -> true` una sola vez
  - `true -> false` al expirar debounce o enviar

### Negativo si se cambia a modo ahorro
- typing menos fino
- puede tardar 1-2 segundos más en verse o apagarse

Pero ese tradeoff suele ser totalmente aceptable frente al costo.

---

## Hallazgo C4: `private_inbox` se usa para eventos de UI

### Evidencia
En [socialService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/socialService.js), `signalPrivateChatOpen(...)` sigue sincronizando inbox con textos tipo:

- “abrió un chat privado”
- “volvió al chat privado”

### Por qué cuesta
Estás usando backend persistente para expresar un evento que en muchos casos podría ser:

- estado local
- toast
- notificación efímera
- señal de presencia

Cada reapertura agrega:

- escrituras extra
- posible lectura extra en inbox
- ruido en la fuente de verdad conversacional

### Ahorro esperado
Medio a alto si los privados se abren con frecuencia.

### Solución recomendada
- dejar `private_inbox` para:
  - llega mensaje
  - se lee
  - cambia unread
  - cambia preview conversacional
- mover apertura/reapertura a señal efímera o presencia

### Negativo si se cambia a modo ahorro
- menos persistencia de “alguien abrió tu privado”
- requiere otra capa si esa UX se quiere mantener

---

## Hallazgo C5: Listener completo de presencia de sala

### Evidencia
En [presenceService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/presenceService.js):

- `subscribeToRoomUsers(roomId, callback)` escucha toda la colección `roomPresence/{roomId}/users`

### Por qué cuesta
Escuchar una colección completa es razonable si realmente necesitas toda la lista viva.
El problema es cuando esa colección cambia muy seguido por heartbeat.

Entonces tienes:

- listener correcto en concepto
- pero montado sobre una colección demasiado ruidosa

### Ahorro esperado
No tan grande por quitar el listener en sí, porque sí cumple una función real.
El ahorro viene más por:

- reducir cambios en esa colección
- o separar presencia rica de presencia mínima

### Solución recomendada
- mantener el listener solo si la colección se vuelve menos ruidosa
- o separar:
  - `roomPresenceLive` mínima
  - datos enrich/derivados menos frecuentes

### Negativo si se cambia a modo ahorro
- puede empeorar la frescura de la lista visible de usuarios

---

## Hallazgo C6: Analytics también escribe bastante

### Evidencia
En [analyticsService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/analyticsService.js):

- se actualiza agregación diaria
- y además se guarda documento individual en `analytics_events` para ciertos tipos

En [eventTrackingService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/eventTrackingService.js):

- se dispara tracking para muchas acciones

### Por qué cuesta
Cada evento puede significar:

- una escritura agregada
- y otra escritura detallada

Esto no suele ser el mayor costo de Firestore frente a listeners ruidosos, pero sí puede sumar si:

- trackeas muchas acciones de chat
- trackeas nudges
- trackeas clicks de rescate, onboarding, etc.

### Ahorro esperado
Medio.

### Solución recomendada
- dejar analytics detallado solo para eventos realmente críticos de embudo
- el resto llevarlo solo a agregación diaria
- o muestrear eventos no esenciales

### Negativo si se cambia a modo ahorro
- menos granularidad de producto
- menos capacidad de análisis fino de conversión

---

## Qué NO parece ser el principal culpable

### 1. `recentPrivateChats`
No es el villano del billing.

Está en `localStorage`.
Sí conviene eliminarlo por arquitectura, pero no por ahorro directo grande.

### 2. Typing del chat principal
Está deshabilitado.

### 3. Listeners de mensajes de sala
Ya están compartidos en [chatService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/chatService.js).

### 4. Notificaciones compartidas
Las capas principales de notificación ya comparten listener por usuario.

---

## Por qué te pueden cobrar tanto aunque tengas pocos usuarios

## Idea clave
Firestore castiga más:

- frecuencia de cambio
- cantidad de listeners afectados

que simplemente la cantidad de usuarios registrados.

Un producto con:

- pocos usuarios
- pero muy ruidoso en presencia
- y con listeners duplicados

puede costar más que otro con más usuarios pero menos eventos en tiempo real.

### Patrón peligroso actual

#### Usuario conectado
- entra a sala
- heartbeat cada `10s`
- escucha mensajes
- escucha usuarios en sala
- escucha notificaciones
- escucha inbox

#### Además en desktop
- escucha conteo de sala en sidebar

#### Además en privado
- escucha mensajes privados
- escucha typing privado
- escucha presencia del partner
- escribe typing mientras teclea

No necesitas miles de usuarios para que esto se vuelva caro.

---

## Modo ahorro: qué haría y qué perderías

| cambio | ahorro esperado | pérdida o costo UX |
| --- | --- | --- |
| subir heartbeat de presencia a `20-30s` | alto | presencia menos instantánea |
| eliminar listener duplicado de conteo de sala | medio-alto | sidebar menos autónomo |
| corregir typing privado a edge-trigger | muy alto | typing menos “milimétrico” |
| dejar de escribir inbox al abrir/reabrir | medio | menos trazabilidad de reapertura |
| muestrear analytics detallados | medio | menos detalle analítico |
| consolidar `private_inbox` y quitar legados | bajo en billing, alto en orden | menos fallback temporal |

---

## Plan recomendado por prioridad

## Prioridad P0

### Acción 1
- hallazgo: heartbeat de presencia demasiado agresivo
- por_qué_cuesta: muchas escrituras y fan-out a listeners
- ahorro_esperado: alto
- riesgo_funcional: presencia menos inmediata
- prioridad_de_ejecución: P0

### Acción 2
- hallazgo: typing privado escribe demasiado
- por_qué_cuesta: `setDoc/deleteDoc` sobre cada ráfaga de input, con riesgo de escribir muchas veces
- ahorro_esperado: muy alto
- riesgo_funcional: typing menos fino
- prioridad_de_ejecución: P0

### Acción 3
- hallazgo: listener duplicado de presencia entre sala y sidebar
- por_qué_cuesta: dos suscripciones funcionalmente parecidas a la misma fuente
- ahorro_esperado: alto en desktop
- riesgo_funcional: menor independencia del sidebar
- prioridad_de_ejecución: P0

## Prioridad P1

### Acción 4
- hallazgo: inbox usado para meta-eventos
- por_qué_cuesta: escrituras extra en eventos no conversacionales
- ahorro_esperado: medio-alto
- riesgo_funcional: menos señal persistente de reapertura
- prioridad_de_ejecución: P1

### Acción 5
- hallazgo: analytics detallado puede sumar muchas escrituras
- por_qué_cuesta: documentos individuales en `analytics_events`
- ahorro_esperado: medio
- riesgo_funcional: menos granularidad
- prioridad_de_ejecución: P1

## Prioridad P2

### Acción 6
- hallazgo: `recentPrivateChats` y fallback legacy
- por_qué_cuesta: no por billing fuerte, sí por complejidad e inconsistencias
- ahorro_esperado: bajo en costo, alto en claridad
- riesgo_funcional: perder fallback si se corta antes de tiempo
- prioridad_de_ejecución: P2

---

## Qué revisar en Firebase Console para confirmar
Para cerrar el diagnóstico con evidencia total, hay que mirar:

### 1. Usage / Firestore
- lecturas por día
- escrituras por día
- picos horarios

### 2. Top collections más calientes
Especialmente:

- `roomPresence`
- `private_chats`
- `users/{uid}/private_inbox`
- `users/{uid}/notifications`
- `analytics_events`
- `systemNotifications`

### 3. Momento del día donde sube el costo
Si el patrón sube cuando hay poquitos conectados pero activos:

- casi seguro el fan-out de presencia está pesando mucho

---

## Recomendación final
Sí hay base técnica para pensar que estás pagando demasiado para el tráfico real que tienes.

Lo más probable no es:

- “demasiados usuarios”
- “demasiados mensajes”

Lo más probable es:

- presencia demasiado frecuente
- listeners de presencia multiplicados
- typing privado demasiado costoso
- escrituras de backend para eventos que podrían resolverse en UI

La mejor estrategia no es “migrar ya a Supabase” por costo.
La mejor estrategia inmediata es:

1. bajar ruido de presencia
2. corregir typing privado
3. quitar duplicación de listeners de presencia
4. dejar inbox solo para cambios conversacionales reales
5. recortar analytics detallado no esencial

---

## Conclusión
Sí, es totalmente plausible que Chactivo esté malgastando Firebase aunque tenga pocos usuarios diarios.

La razón más probable no es volumen.
Es diseño de tiempo real con demasiada frecuencia y demasiada propagación.

En una frase:

el gasto parece venir más de la arquitectura de presencia y typing que del tráfico real del producto.
