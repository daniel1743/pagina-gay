# MAPA DE MEJORAS OPIN 2026-03-24

## Objetivo

Convertir OPIN de un tablón pasivo a un sistema que genere:

1. motivo para volver,
2. sensación de progreso,
3. conversaciones con continuidad,
4. conversión natural hacia chat privado, Baúl y notificaciones.

---

## Diagnóstico actual

Hoy OPIN ya tiene base funcional:

- feed público,
- creación de notas,
- comentarios,
- likes,
- reacciones,
- invitación a privado,
- CTA para instalar app y activar notificaciones.

Pero el loop sigue incompleto:

1. el usuario publica,
2. revisa un rato,
3. no siente que tenga algo pendiente,
4. se va,
5. no existe una expectativa clara para volver.

El problema no es falta de botones. El problema es falta de retorno.

---

## Principio de producto

Cada mejora de OPIN debe responder al menos una de estas preguntas:

- ¿Qué pendiente le queda al usuario?
- ¿Qué cambió desde su última visita?
- ¿Por qué debería volver hoy y no la próxima semana?
- ¿Cómo se acerca más rápido a una conversación real?

Si una mejora no mejora retorno, hábito o conversión, no es prioritaria.

---

## Norte del sistema

OPIN debe funcionar como:

- escaparate de intención,
- bandeja de señales sociales,
- antesala del privado,
- punto de retorno diario incluso cuando el chat está lento.

---

## Mapa de mejoras

### Fase 0. Base de medición y claridad

Objetivo: dejar de trabajar a ciegas.

#### Mejoras

- Agregar métricas explícitas de retorno:
  - visitas a OPIN por usuario por día,
  - usuarios que vuelven dentro de 24h,
  - notas con al menos 1 respuesta,
  - notas con paso a privado,
  - tiempo entre publicación y primera interacción.
- Mostrar estado más claro en el feed:
  - `sin respuestas`,
  - `nueva actividad`,
  - `cerrado por autor`.
- Añadir resumen visible para autor:
  - vistas,
  - respuestas nuevas,
  - invitaciones enviadas/recibidas relacionadas.

#### Impacto

- Alto en claridad interna.
- Medio en UX.

#### Esfuerzo

- Bajo.

#### Archivos probables

- `src/services/opinService.js`
- `src/services/eventTrackingService.js`
- `src/pages/OpinFeedPage.jsx`
- `src/components/opin/OpinCard.jsx`

---

### Fase 1. Loop de retorno mínimo viable

Objetivo: que publicar una nota deje algo pendiente y haga volver.

#### 1. Seguir nota

Permitir que un usuario siga una nota ajena para recibir avisos cuando:

- tenga nuevas respuestas,
- el autor cambie su estado,
- la conversación se active.

#### 2. Guardar nota

Permitir guardar notas interesantes en una vista tipo `Guardados`.

No es lo mismo que seguir:

- `seguir` implica avisos,
- `guardar` implica volver a revisar manualmente.

#### 3. Estado de la nota

Agregar estados simples al post:

- `buscando`,
- `hablando con alguien`,
- `quiero más respuestas`,
- `cerrado`.

Esto convierte la nota en un objeto vivo y reduce la sensación de post abandonado.

#### 4. Resumen desde tu última visita

Panel para el autor y para seguidores:

- `2 respuestas nuevas`,
- `7 personas vieron tu nota`,
- `1 usuario te invitó a privado`.

#### 5. Filtro “Actividad nueva”

Tab o filtro en feed:

- `Para ti`,
- `Actividad nueva`,
- `Seguidos`,
- `Recientes`.

#### Impacto

- Muy alto.

#### Esfuerzo

- Medio.

#### Dependencias

- notificaciones,
- nuevos campos en `opin_posts`,
- colección de seguimiento o guardado.

#### Archivos probables

- `src/pages/OpinFeedPage.jsx`
- `src/components/opin/OpinCard.jsx`
- `src/components/opin/OpinCommentsModal.jsx`
- `src/services/opinService.js`
- `src/services/pushNotificationService.js`
- `src/components/notifications/NotificationsPanel.jsx`
- `firestore.rules`
- `firestore.indexes.json`

---

### Fase 2. OPIN como motor de intención, no solo publicación

Objetivo: mejorar la calidad de interacción sin complicar demasiado el flujo.

#### 1. Etiquetas de intención

Agregar chips estructurados al crear la nota:

- `amistad`,
- `cita`,
- `chat`,
- `plan hoy`,
- `algo casual`,
- `algo serio`.

Esto mejora lectura del feed y futuros filtros.

#### 2. Respuestas rápidas inteligentes

No solo respuestas genéricas.

Respuestas según contexto:

- si la nota es `plan hoy`: `me sumo`, `¿dónde?`, `hablamos`,
- si es `amistad`: `me interesa conversar`, `también busco amistad`,
- si es `cita`: `te escribo`, `quiero conocerte`.

#### 3. “Me interesa” sobre respuestas

El autor puede marcar una respuesta como interesante.

Eso alimenta una mini bandeja:

- `personas que te interesaron`,
- `personas interesadas en ti`.

#### 4. Prioridad visual por afinidad

Sin algoritmo complejo todavía:

- mostrar primero notas con etiquetas afines a interacciones previas,
- destacar notas con actividad nueva,
- destacar notas seguidas por el usuario.

#### Impacto

- Alto.

#### Esfuerzo

- Medio.

#### Archivos probables

- `src/pages/OpinComposerPage.jsx`
- `src/pages/OpinFeedPage.jsx`
- `src/components/opin/OpinCard.jsx`
- `src/components/opin/OpinCommentsModal.jsx`
- `src/services/opinService.js`
- `firestore.rules`
- `firestore.indexes.json`

---

### Fase 3. Hábito diario

Objetivo: que exista un motivo de entrada aunque el usuario no haya publicado.

#### 1. Tema del día

Bloque fijo arriba del feed:

- una pregunta diaria,
- contador real de respuestas,
- CTA para dejar nota relacionada.

Ejemplos:

- `¿Qué buscas hoy de verdad?`
- `¿Cita, amistad o charla sin presión?`
- `¿A qué hora te conectas más?`

#### 2. Rondas OPIN

Ventanas programadas:

- `Ronda amistad 19:00`,
- `Ronda plan hoy 21:00`,
- `Ronda cita 23:00`.

El efecto es concentrar actividad real en franjas claras.

#### 3. Recordatorios de vuelta

Usar el sistema de push existente para avisar:

- cuando empieza una ronda,
- cuando tu tema seguido se activa,
- cuando tu nota recibe interacción real.

#### 4. Banner de horario útil

Si el feed está lento:

- `OPIN suele activarse más entre 19:00 y 23:00`,
- `¿quieres que te avisemos?`

#### Impacto

- Muy alto.

#### Esfuerzo

- Medio.

#### Archivos probables

- `src/pages/OpinFeedPage.jsx`
- `src/components/eventos/EventoBanner.jsx`
- `src/services/pushNotificationService.js`
- `src/services/systemNotificationsService.js`
- `src/config/scheduledEvents.js`
- `src/services/opinService.js`

---

### Fase 4. Conversión a vínculo real

Objetivo: que OPIN termine en una conversación y no en consumo pasivo.

#### 1. Bandeja “Tus oportunidades”

Sección para usuarios registrados:

- respuestas nuevas a tu nota,
- notas que seguiste con actividad,
- personas marcadas como interesantes,
- invitaciones privadas pendientes.

#### 2. Siguiente mejor acción

CTA contextual por estado:

- si tienes nota con respuestas: `revisar respuestas`,
- si no tienes nota: `publicar lo que buscas`,
- si ya marcaste interés mutuo: `abrir privado`.

#### 3. CTA entre OPIN, Baúl y Chat

Cruces explícitos:

- desde OPIN hacia Baúl si quieres ver mejor a la persona,
- desde Baúl hacia OPIN si quieres expresar lo que buscas,
- desde chat hacia OPIN si no hay mucha actividad en sala.

#### 4. Perfil resumido confiable

Antes de abrir privado, mostrar señales simples:

- actividad reciente,
- intención declarada,
- si tiene perfil completado,
- si verificó foto o perfil.

#### Impacto

- Alto.

#### Esfuerzo

- Medio a alto.

#### Archivos probables

- `src/pages/OpinFeedPage.jsx`
- `src/pages/ProfilePage.jsx`
- `src/pages/BaulPage.jsx`
- `src/components/opin/OpinCard.jsx`
- `src/components/baul/BaulSection.jsx`
- `src/components/chat/PrivateChatRequestModal.jsx`
- `src/services/socialService.js`
- `src/services/opinService.js`

---

### Fase 5. Refinamiento posterior

Objetivo: optimizar cuando el loop principal ya funcione.

#### Mejoras

- ranking ligero de afinidad,
- recomendaciones personalizadas,
- mejores empty states,
- feed mixto `OPIN + actividad de Baúl`,
- analítica avanzada por tipo de intención,
- pruebas A/B de textos y CTA,
- resumen semanal para usuarios activos.

#### Impacto

- Medio.

#### Esfuerzo

- Medio a alto.

#### Prioridad

- Posterior.

---

## Orden recomendado de implementación

### Sprint 1

- resumen desde última visita,
- estado de nota,
- eventos de tracking faltantes,
- UI de `actividad nueva`.

### Sprint 2

- seguir nota,
- guardar nota,
- notificaciones por actividad en nota seguida,
- pestaña `Seguidos`.

### Sprint 3

- etiquetas de intención,
- composer mejorado,
- respuestas rápidas contextuales,
- CTA de conversión a privado.

### Sprint 4

- tema del día,
- rondas OPIN,
- recordatorios programados,
- banner de mejores horarios.

### Sprint 5

- bandeja `Tus oportunidades`,
- afinidad ligera,
- integración más fuerte con Baúl y perfil.

---

## Cambios de datos recomendados

### `opin_posts/{postId}`

Agregar campos:

```js
{
  status: "buscando" | "hablando" | "quiero_mas" | "cerrado",
  intentTags: ["amistad", "chat"],
  lastInteractionAt: Timestamp,
  lastCommentAt: Timestamp,
  followersCount: 0,
  savesCount: 0,
  highlightedReplyIds: [],
  activityScore: 0
}
```

### `opin_post_followers/{id}` o subcolección

```js
{
  postId,
  userId,
  createdAt,
  lastSeenAt,
  notificationsEnabled: true
}
```

### `opin_post_saves/{id}` o subcolección

```js
{
  postId,
  userId,
  createdAt
}
```

### `opin_daily_topics/{topicId}`

```js
{
  text,
  activeFrom,
  activeTo,
  category,
  relatedIntentTags: []
}
```

### `opin_activity_digest/{userId}` opcional

Se puede evitar al inicio si se calcula en cliente o desde notificaciones existentes.

---

## UI mínima necesaria

### Feed

- tabs: `Para ti`, `Actividad nueva`, `Seguidos`,
- badge de estado por nota,
- indicador de novedad desde última visita,
- botón `Seguir`,
- botón `Guardar`.

### Composer

- selector de intención,
- estado inicial del post,
- copy más orientado a lo que el usuario busca.

### Modal de comentarios

- bloque de resumen para autor,
- acción `me interesa`,
- acceso rápido a privado,
- opción de cambiar estado de la nota.

### Lobby

- mejor entrada a OPIN:
  - `Mira qué busca la gente hoy`,
  - `X notas con actividad nueva`,
  - `Ronda OPIN a las 21:00`.

---

## Métricas de éxito

### KPIs principales

- porcentaje de usuarios que vuelven a OPIN en 24h,
- porcentaje de notas con al menos 1 respuesta,
- porcentaje de notas que terminan en invitación a privado,
- tiempo medio hasta la primera respuesta,
- usuarios que activan push desde OPIN,
- porcentaje de usuarios con uso repetido de `seguir`.

### Señales cualitativas

- más usuarios revisando OPIN sin necesidad de haber publicado,
- menor sensación de feed muerto,
- más continuidad entre nota, respuesta y privado.

---

## Qué no hacer ahora

No priorizar todavía:

- más emojis,
- más colores,
- más decoraciones visuales,
- rediseño completo del card sin cambiar el loop,
- features complejas de matching antes de resolver retorno,
- otro canal separado que compita con OPIN.

Eso aumenta complejidad y no arregla el problema principal.

---

## Recomendación ejecutiva

Si hubiera que elegir solo una línea de trabajo inmediata, debe ser esta:

1. `estado de nota`,
2. `resumen desde tu última visita`,
3. `seguir nota`,
4. `tab de actividad nueva`.

Ese bloque es el primer cambio que realmente puede hacer que OPIN deje de sentirse como un tablón estático.

---

## Archivos más probables para la primera implementación

- `src/pages/OpinFeedPage.jsx`
- `src/components/opin/OpinCard.jsx`
- `src/components/opin/OpinCommentsModal.jsx`
- `src/pages/OpinComposerPage.jsx`
- `src/services/opinService.js`
- `src/services/pushNotificationService.js`
- `src/components/notifications/NotificationsPanel.jsx`
- `src/components/opin/OpinDiscoveryBanner.jsx`
- `src/hooks/useEngagementNudge.js`
- `firestore.rules`
- `firestore.indexes.json`

---

## Primera entrega ideal

La primera entrega no debería intentar “hacer OPIN gigante”.

Debería lograr solo esto:

- publicar una nota,
- ver si cambió algo desde tu última visita,
- seguir una nota que te interesa,
- volver cuando haya novedad real.

Si eso funciona, recién conviene escalar a hábitos diarios y rondas programadas.
