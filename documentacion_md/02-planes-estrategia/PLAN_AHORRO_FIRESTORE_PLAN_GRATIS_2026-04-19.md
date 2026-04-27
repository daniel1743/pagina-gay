# Plan Ahorro Firestore Plan Gratis 2026-04-19

## Objetivo

Llevar `Chactivo` a un modo de operacion de costo ultra bajo.

Meta principal:

- evitar lecturas y escrituras innecesarias,
- mantener el producto usable,
- y diseñar todo para que el consumo normal quede cubierto por el plan gratis o lo mas cerca posible.

Este plan no asume crecimiento infinito.

Asume una regla simple:

> si una funcion no es imprescindible para que el usuario converse o responda, no debe estar leyendo o escribiendo en tiempo real.

---

## Regla madre

Desde ahora, el producto debe seguir estas reglas:

1. Nada en tiempo real por defecto salvo lo estrictamente necesario.
2. Nada de listeners para features ocultas, minimizadas o no abiertas.
3. Nada de precargas de features secundarias desde el chat principal.
4. Nada de fan-out por cada evento pequeño si puede resolverse por lote o bajo demanda.
5. Nada de escribir presencia, typing, tracking o hints con alta frecuencia.
6. Nada de consultas sin `limit`.
7. Nada de leer colecciones completas si se puede leer un doc resumido.
8. Nada de duplicar la misma señal en frontend y backend.

---

## Principio de producto

La app no tiene presupuesto para “lujo realtime”.

Entonces:

- el chat principal es prioridad 1,
- privados son prioridad 2,
- sugerencias son prioridad 3,
- analitica, ranking, actividad avanzada, discovery y extras deben vivir en modo ahorro.

Si una capa compite con esa prioridad y gasta, se apaga o se degrada.

---

## Meta tecnica realista

Para acercarnos al plan gratis:

- el chat publico debe tener solo 2 listeners esenciales:
  - mensajes de la sala,
  - una version minima de presencia o conteo.

- privados no deben leer nada hasta que el usuario abra privados.

- Baul no debe disparar nada desde el chat principal.

- typing debe ser opcional o apagado.

- notificaciones no deben duplicar caminos.

- backend no debe correr trabajo pesado por cada mensaje si puede hacerlo por lotes.

---

## P0 Inmediato

Estas son las medidas mas importantes. Son las que mas ahorran.

### 1. Sacar `tarjetas` del flujo base del chat principal

Estado actual:

- `ChatPage` carga `obtenerTarjetasRecientes(user.id, 45)` para sugerencias.

Problema:

- el chat paga lecturas de Baul aunque el usuario solo quiera conversar.

Cambio:

- prohibir lecturas de `tarjetas` al entrar al chat.
- las sugerencias persistentes deben salir de:
  - cache local previa,
  - datos ya presentes,
  - o un doc resumido liviano precalculado.

Regla:

- `ChatPage` no puede llamar servicios de Baul por defecto.

Impacto esperado:

- ahorro alto inmediato.

---

### 2. Cargar `private_inbox` y `private_match_state` solo bajo demanda

Estado actual:

- `ChatPage` escucha inbox y match-state apenas entra.

Problema:

- el usuario paga privados aunque no abra privados.

Cambio:

- no montar esos listeners al entrar al chat.
- montarlos solo si el usuario abre:
  - `Conecta`,
  - bandeja privada,
  - o una superficie explícita de privados.

Regla:

- no existe listener de privados en background si la UI de privados no esta abierta.

Impacto esperado:

- ahorro muy alto.

---

### 3. Reducir `roomPresence` a presencia minima

Estado actual:

- presencia soporta online, disponibilidad, typing, privado y rescates.

Problema:

- demasiada escritura y demasiada reactividad.

Cambio:

- dejar `roomPresence` solo para:
  - join,
  - leave,
  - una actualizacion ocasional de vida.

- sacar de presencia:
  - typing,
  - señales efimeras,
  - decoraciones de disponibilidad que no sean esenciales.

Regla:

- la presencia no puede ser un bus universal.

Impacto esperado:

- el ahorro mas grande del sistema.

---

### 4. Subir heartbeat o eliminar heartbeat continuo

Objetivo:

- bajar escrituras de presencia y sobre todo snapshots cruzados.

Modo ultra ahorro recomendado:

- heartbeat cada `5 min` o incluso eliminar heartbeat recurrente y depender de:
  - `joinRoom`,
  - `leaveRoom`,
  - `visibilitychange`,
  - y una actualizacion ligera cuando realmente interactua.

Regla:

- si el usuario esta idle o la pestaña no esta activa, no escribir.

Impacto esperado:

- ahorro extremo.

Riesgo:

- presencia menos exacta al segundo.

Decisión:

- aceptable. El plan gratis importa mas que una presencia “perfecta”.

---

### 5. Apagar typing por defecto

Estado actual:

- privados usan typing via `roomPresence/private_{chatId}/users`.

Problema:

- alto churn para poco valor real.

Cambio:

- apagar typing por defecto.
- si se quiere conservar, solo activarlo en modo desktop, ventana activa y no minimizada.

Regla:

- en mobile y modo ahorro, typing desactivado.

Impacto esperado:

- ahorro medio a alto.

---

## P1 Esta semana

### 6. Pausar listeners privados en ventanas minimizadas

Cambio:

- si una ventana privada esta minimizada:
  - no escuchar mensajes en vivo,
  - no escuchar `tarjetas/{partnerId}`,
  - no escuchar typing.

- en minimizado, solo refrescar al restaurar.

Regla:

- minimizado no significa vivo.

---

### 7. Poner `limit` duro a inbox, match-state y notificaciones

Regla base:

- `private_inbox`: `limit(20)` o `limit(30)`.
- `private_match_state`: `limit(20)`.
- `notifications`: `limit(30)` si no es admin.
- `systemNotifications`: `limit(20)` en UI normal.

Nada debe crecer sin tope.

---

### 8. Unificar notificacion de mensaje privado

Problema:

- hoy parece haber duplicidad entre:
  - `dispatchUserNotification('direct_message')`
  - `notifyOnNewMessage`

Cambio:

- dejar un solo camino canonico.

Recomendacion:

- conservar el camino mas simple y menos duplicado.
- si el mensaje privado ya genera notificacion de usuario, el trigger adicional debe morir.

---

### 9. Mover retencion publica a proceso por lote

Problema:

- `enforceRoomRetention` corre por cada mensaje.

Cambio:

- mover retencion a:
  - scheduler cada cierto tiempo,
  - o limpieza por lote cuando el contador supere umbral.

Regla:

- no hacer trabajo pesado por cada mensaje publico nuevo.

---

### 10. Frenar espejos y sincronizaciones no criticas

Casos:

- `syncPublicUserProfileMirror`
- sincronias con `tarjetas`
- indicadores auxiliares

Cambio:

- solo escribir si cambian campos publicos relevantes.
- no reescribir espejo por cualquier update cosmético.

---

## P2 Estructural

### 11. Crear docs resumen baratos

En vez de leer colecciones enteras:

- crear docs resumen por usuario o por sala.

Ejemplos:

- `users/{uid}/ui_summary/private`
- `rooms/{roomId}/summary/live`
- `users/{uid}/suggested_contacts_summary`

Objetivo:

- un `getDoc` o un listener a un doc sintetico, no 3 o 4 listeners a colecciones.

---

### 12. Cache local como primera capa

Regla:

- si una UI secundaria puede abrir con datos de `localStorage` o `sessionStorage`, debe hacerlo.

Aplicar a:

- sugerencias,
- ultimos privados,
- ultima comuna,
- ultimo ranking,
- hints,
- superficies de rescate.

La red debe ser segunda capa, no primera.

---

### 13. Modo ahorro por feature flag

Crear un modo global:

- `ENABLE_ULTRA_LOW_COST_MODE = true`

Cuando este activo:

- typing apagado,
- privados bajo demanda,
- no preload de Baul,
- no ranking realtime,
- no analitica fina en Firestore,
- no listeners secundarios.

Esto debe poder encenderse sin refactor gigante.

---

## Kill list

Estas cosas deben dejar de disparar costo si no son imprescindibles.

### Matar o pausar

- preload de `tarjetas` desde `ChatPage`
- typing en privados por defecto
- listeners de `private_inbox` y `private_match_state` al entrar a sala
- `tarjetas/{partnerId}` en ventanas minimizadas
- ranking realtime de participantes si no mueve negocio real
- funciones admin o dashboards con barridos completos durante uso normal
- cualquier toast o rescue que necesite leer Firestore en vivo

---

## Regla de diseño para nuevas funciones

Antes de crear cualquier feature nueva, debe responderse:

1. ¿Esto necesita realtime de verdad?
2. ¿Puede abrir con cache local?
3. ¿Puede resolverse con un doc resumen?
4. ¿Cuántos listeners nuevos agrega?
5. ¿Cuántas escrituras por usuario/hora agrega?
6. ¿Puede vivir solo cuando el usuario abre esa pantalla?

Si la respuesta no es buena, no se implementa.

---

## Presupuesto operativo

### Modo permitido

- chat principal simple,
- privados manuales,
- presencia minima,
- discovery bajo demanda,
- sin lujos realtime.

### Modo prohibido

- realtime para todo,
- listeners paralelos por feature,
- sync constante de señales accesorias,
- consultas de Baul desde chat,
- fan-out por cada click pequeño.

---

## Orden exacto de ejecucion

### Fase 1

- cortar `obtenerTarjetasRecientes` desde `ChatPage`
- cortar listeners automáticos de `private_inbox`
- cortar listeners automáticos de `private_match_state`

### Fase 2

- apagar typing por defecto
- pausar listeners privados minimizados
- poner `limit` a inbox, notifications y match-state

### Fase 3

- subir o eliminar heartbeat continuo
- simplificar `roomPresence`
- dejar solo presencia minima

### Fase 4

- eliminar duplicidad de notificaciones DM
- mover retencion publica a lote
- filtrar `syncPublicUserProfileMirror`

### Fase 5

- crear docs resumen baratos
- consolidar cache local
- activar `ENABLE_ULTRA_LOW_COST_MODE`

---

## Criterio de exito

Este plan funciona si:

- al entrar al chat principal solo se monta lo esencial,
- privados no leen nada hasta que el usuario los abre,
- Baul no le cuesta al chat,
- presencia no escribe constantemente,
- y cada nueva feature pasa el filtro de costo antes de existir.

---

## Veredicto final

Si de verdad queremos sobrevivir con gasto ultra bajo, `Chactivo` debe operar como:

- chat primero,
- todo lo demas bajo demanda,
- y realtime solo donde no haya alternativa.

La version cara del producto es:

- muchas capas vivas a la vez,
- muchas señales en tiempo real,
- y demasiada inteligencia distribuida.

La version sostenible es:

- menos magia,
- mas jerarquia,
- mas cache,
- menos listeners,
- menos writes,
- y cero lujo tecnico que no se traduzca en respuesta real para el usuario.
