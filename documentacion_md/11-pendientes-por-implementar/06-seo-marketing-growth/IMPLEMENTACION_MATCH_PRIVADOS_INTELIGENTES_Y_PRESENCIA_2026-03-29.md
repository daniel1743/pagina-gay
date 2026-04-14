# Implementación Match Inteligente + Privados Persistentes + Ajustes de Presencia/UI (29-03-2026)

## Objetivo
Empujar una evolución real del chat principal y del chat privado sin romper la arquitectura que ya venía funcionando.

La intención de esta fase fue:

- mejorar la conversión desde sala pública a privado
- bajar ruido conversacional y repetición vacía
- hacer más visible y más confiable el estado real del privado
- usar la bandeja persistente como capa de continuidad
- mejorar la percepción de actividad, disponibilidad y reenganche

---

## Problema de producto detectado
La observación de uso real mostró varios patrones:

- demasiados mensajes genéricos tipo `hola`, `alguien`, `activo?`, `pasivo?`
- mucha gente expresa intención clara, pero el sistema no la aprovecha
- el chat privado era crítico para la percepción de calidad, pero no siempre se sentía visible o confiable
- en mobile se perdían señales útiles porque dependían del sidebar
- se sugerían perfiles compatibles, pero faltaba controlar repetición y fatiga de recomendación
- había señales de presencia engañosas en privado, donde alguien podía verse como desconectado pese a estar escribiendo o recién haber respondido

---

## Estrategia aplicada
Se trabajó por capas, manteniendo compatibilidad con el sistema ya existente:

- aprovechar `private_inbox` como base persistente
- enriquecer la lectura de intención en mensajes públicos
- usar señales de compatibilidad para empujar privado con menor fricción
- penalizar repetición semántica y mensajes vacíos
- hacer que el estado del privado y de la presencia se apoye más en actividad real
- evitar ocupar espacio fijo en mobile con avisos permanentes

---

## Cambios implementados

### 1. Match inteligente desde mensajes públicos
Se agregó parsing de intención en mensajes de sala para detectar patrones como:

- `soy pasivo`
- `busco activo`
- `soy activo`
- `versátil`
- ubicación o comuna
- intención de conversar, conocer o concretar

Esto permitió convertir texto libre en señales estructuradas:

- rol ofrecido
- rol buscado
- contexto
- nivel de confianza

### 2. Toast contextual para abrir privado
Se agregó un micro-toast de oportunidad cuando el sistema detecta compatibilidad clara entre el usuario actual y un mensaje reciente de la sala.

Comportamiento:

- si el target está online: `Abrir privado`
- si el target está offline: `Dejar mensaje`
- el privado se abre con saludo contextual prellenado

### 3. Caso offline con continuidad real
Cuando el usuario compatible no está conectado:

- el sistema permite dejar mensaje igual
- ese mensaje queda como continuidad en `private_inbox`
- cuando la persona vuelve, se puede destacar que ya tiene un mensaje pendiente

### 4. Nudge cuando el usuario offline vuelve
Se agregó un nudge usando `private_inbox` para detectar:

- que el último mensaje del chat lo envió el usuario actual
- que el target volvió a aparecer online
- que la conversación no está abierta en ese momento

Resultado:

- aparece un aviso de reenganche
- el usuario puede retomar el privado directamente

### 5. Repetición semántica bloqueada
No se bloquea solo texto idéntico.
Ahora también se frena:

- duplicado exacto
- variante casi igual
- repetición genérica vacía
- repetición de intención equivalente

Ejemplos:

- `hola`
- `alguien?`
- `soy pasivo`
- `pasivo buscando activo`
- `acá pasivo`

Si el usuario repite esencialmente lo mismo en pocos minutos, el sistema le pide variar el mensaje.

### 6. Nudge para mejorar mensajes vacíos
Si un usuario manda mensajes demasiado genéricos, se le sugiere mejorar el mensaje con:

- comuna
- rol
- intención

Esto busca mover la sala desde broadcast vacío hacia mensajes con más contexto útil.

### 7. Realce visual de mensajes contextuales
Los mensajes con señal útil ahora tienen más peso visual en la sala:

- pill o etiqueta contextual
- mejor lectura de intención
- prioridad visual frente al mensaje genérico

### 8. Carril `Gente compatible ahora`
Se agregó un carril superior con perfiles que ya calzan mejor con el usuario actual.

Objetivo:

- abrir privado más rápido
- convertir compatibilidad en acción
- reducir fricción de descubrimiento

### 9. Persistencia de score de sugerencias
Se implementó un score para no insistir siempre con el mismo perfil.

Primero se trabajó en `localStorage` y luego se extendió a backend para consistencia entre dispositivos.

Ahora el sistema considera:

- cuántas veces se mostró un perfil
- si fue descartado
- si fue abierto
- si hubo una acción más fuerte de éxito
- si ya fue sugerido hoy

### 10. Decaimiento fino del score
El score no queda estático.
Ahora decae según:

- tiempo transcurrido
- show reciente
- dismiss reciente
- open reciente
- success reciente

Eso evita dos extremos:

- insistencia excesiva
- olvido demasiado rápido

### 11. Estado de sugerencia cross-device
Se agregó subcolección backend:

- `users/{userId}/private_match_state/{targetUserId}`

Propósito:

- recordar que un perfil ya fue sugerido hoy
- compartir esa memoria entre desktop y mobile/PWA
- hacer el ranking más estable y menos repetitivo

### 12. `private_inbox` enriquecido
Se extendió la entrada de inbox con metadatos adicionales como:

- `lastMessageSenderId`
- `lastMessageType`

Esto mejora:

- continuidad
- nudges de reenganche
- lectura más inteligente del estado de conversación

### 13. Visibilidad de usuarios en privado también en sala principal
Como en mobile no siempre se usa sidebar, se agregó visibilidad de quién está en privado desde la propia sala principal.

Luego se refinó para no dejarlo ocupando espacio fijo.

### 14. Bloque `En privado ahora` convertido a aviso discreto
En vez de quedar permanentemente visible:

- aparece automáticamente unos segundos
- reaparece por intervalo aproximado de 45 segundos
- reaparece si entra alguien nuevo en privado
- luego queda colapsado en un badge discreto con icono de conversación privada
- el usuario puede desplegarlo manualmente

Esto reduce sobrecarga visual sin perder la señal.

### 15. Ajuste de presencia real dentro del privado
Se corrigió el problema donde un usuario podía verse como `desconectado` aunque estuviera escribiendo o recién hubiera respondido.

Ahora la cabecera del privado considera:

- typing en tiempo real
- actividad reciente real en ese chat privado
- presencia tradicional como fallback

Resultado:

- punto verde más confiable
- estado `escribiendo...`
- estado `activo en privado` cuando corresponde

### 16. Ajustes previos integrados en esta línea de trabajo
Dentro del mismo proceso también quedaron consolidados:

- toast de DM más corto
- icono mobile animado para privados/unread
- burbuja optimista en privado V2
- contraste más fuerte en reply/swipe-to-reply
- checks de privado más visibles
- limpieza del header mobile
- ocultamiento del banner flotante de eventos en sala principal

---

## Beneficios esperados para Chactivo

### 1. Mayor conversión de sala pública a chat privado
El sistema deja de esperar que el usuario descubra por sí solo a quién escribirle.
Ahora detecta oportunidad y la acerca.

Impacto esperado:

- más aperturas de privado
- más primeros mensajes enviados
- mayor profundidad de sesión

### 2. Menos ruido y mejor calidad conversacional
La sala debería dejar de llenarse tan fácilmente de:

- saludos repetidos
- spam conversacional de baja señal
- variantes del mismo mensaje una y otra vez

Impacto esperado:

- feed más útil
- menos cansancio visual
- mejor percepción de comunidad real

### 3. Más percepción de producto inteligente
Cuando la app detecta intención, sugiere, reengancha y recuerda contexto, deja de sentirse como un muro plano y empieza a sentirse como producto guiado.

Impacto esperado:

- mayor valor percibido
- mejor retención
- mayor diferenciación frente a chats simples o caóticos

### 4. Mejor experiencia en mobile
Se redujo dependencia del sidebar y se controló la sobrecarga visual.

Impacto esperado:

- menos fricción en pantallas pequeñas
- mejor descubrimiento de privados
- mejor lectura del estado social del chat

### 5. Más consistencia entre dispositivos
Al guardar parte del estado de sugerencia en backend:

- desktop y PWA dejan de comportarse como dos mundos separados
- la lógica de recomendación se vuelve más coherente

### 6. Más confianza en el privado
La percepción de un chat privado maduro depende mucho de señales correctas:

- si está activo
- si está escribiendo
- si quedó un mensaje pendiente
- si vuelve a conectarse

Impacto esperado:

- más sensación de continuidad
- menos abandono por confusión
- mejor experiencia premium

---

## Beneficios esperados para los usuarios

### Usuarios que quieren conectar rápido
Van a recibir ayuda más directa para detectar personas compatibles sin tener que escanear toda la sala manualmente.

### Usuarios que escriben con intención
Sus mensajes deberían ganar más visibilidad que un simple `hola`.

### Usuarios que usan mobile
Van a perder menos contexto importante por no tener abierto el sidebar.

### Usuarios que dejan mensaje en privado
Van a tener más continuidad cuando la otra persona vuelva.

### Usuarios con baja tolerancia al ruido
Deberían notar menos repetición vacía y una sala más útil.

---

## Qué se espera que ocurra en comportamiento de usuario

### Se espera más de esto

- mensajes con comuna o ubicación
- mensajes con rol e intención
- apertura de privado desde sugerencia
- continuación de conversaciones pendientes
- respuestas más dirigidas y menos broadcast masivo

### Se espera menos de esto

- repetir `hola`
- repetir la misma intención cada pocos minutos
- depender de gritar a la sala para encontrar match
- perder continuidad cuando la otra persona no está conectada en ese momento

---

## Qué se mantiene compatible
Estos cambios no desmontan el sistema anterior de golpe.

Se mantiene:

- `private_chats`
- `private_inbox`
- listeners actuales
- ventana privada V2
- flujos existentes de notificación y fallback

La lógica nueva se apoya sobre la base existente y la endurece gradualmente.

---

## Riesgos o puntos a vigilar

### 1. Sobre-sugerencia
Si el sistema se pasa de insistente, la ayuda puede sentirse invasiva.
Por eso se agregaron cooldowns, score y dedupe.

### 2. Falsos positivos de intención
No todo `soy activo` significa exactamente lo mismo en todos los casos.
Se debe seguir ajustando el parser con uso real.

### 3. Dependencia de reglas publicadas
La persistencia backend nueva requiere reglas actualizadas.

### 4. Balance entre visibilidad y limpieza
El bloque de `En privado ahora` se hizo intermitente para no saturar la UI, pero ese balance debe seguir observándose con usuarios reales.

---

## Verificación técnica realizada

### Build
Se ejecutó:

```powershell
npm run build
```

Resultado:

- compilación correcta con `vite build`
- sin errores de sintaxis en la línea de cambios documentada

### Reglas requeridas
Para la persistencia completa se requiere desplegar reglas:

```powershell
firebase deploy --only firestore:rules --project chat-gay-3016f
```

---

## Conclusión
Esta fase no fue una mejora aislada.

Fue una capa estratégica sobre el chat:

- interpreta mejor intención
- empuja mejor el privado
- reduce ruido
- recuerda contexto
- reengancha mejor
- mejora presencia y percepción de actividad
- limpia la UI sin esconder información importante

Si esta línea sigue bien calibrada, Chactivo debería recibir:

- más chats privados abiertos
- más continuidad entre sesiones
- mejor percepción de producto premium
- menos fatiga por ruido en sala
- mayor sensación de matchmaking inteligente sin necesidad de una app de matching clásica

Y los usuarios deberían sentir:

- que la app los ayuda a conectar
- que el privado sí acompaña la conversación real
- que hay menos caos
- que hay más continuidad, contexto y oportunidad de conversación útil
