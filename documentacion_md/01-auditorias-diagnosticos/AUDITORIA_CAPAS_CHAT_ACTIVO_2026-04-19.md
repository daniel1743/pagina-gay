# Auditoria Capas Chat Activo 2026-04-19

## Objetivo

Revisar si las capas sugeridas para reducir frustracion en `Chactivo` ya:

- existen y estan activas,
- existen pero estan mal implementadas o mal expuestas,
- quedaron como remanente no conectado,
- o viven solo como idea/documentacion.

La pregunta central es simple:

> Si un usuario entra, saluda, no recibe respuesta y se frustra, que capas reales tiene hoy el producto para rescatar esa sesion.

---

## Veredicto ejecutivo

`Chactivo` ya no es solo un chat plano.

Hoy existen varias capas reales encima del chat principal:

- onboarding del mensaje,
- señales de intencion,
- disponibilidad para conversar,
- sugerencias contextuales para abrir privado,
- nudges hacia OPIN/Baul,
- bandeja de privados y sugeridos,
- lectura de comuna y rol para ordenar cercania/compatibilidad.

El problema principal no es ausencia de ideas ni ausencia de componentes.

El problema actual es:

- demasiadas capas compitiendo al mismo tiempo,
- algunas capas importantes aparecen tarde,
- varias viven en lugares distintos con la misma promesa,
- hay piezas buenas que estan activas pero no dominan el flujo principal,
- y hay componentes viejos que quedaron como remanente o duplicado conceptual.

Conclusión:

`Chactivo` si tiene direccion de producto avanzada, pero la ejecucion aun se siente fragmentada.

---

## 1. Capas activas y conectadas de verdad

### 1.1 Onboarding del mensaje si existe

Archivo principal:

- `src/components/chat/ChatInput.jsx`

Lo que ya hace:

- muestra guidance para escribir mejor,
- empuja a decir rol + comuna + si tiene lugar o se mueve,
- tiene templates listos,
- tiene chips estructurados como `Tengo lugar`, `Sin lugar`, `Me muevo`, `Ahora`,
- deja elegir comuna desde el compositor,
- muestra un tip de foco cuando el usuario entra al input,
- persiste comuna/rol en `localStorage`,
- registra tracking de onboarding.

Conclusión:

Esto si existe y esta vivo. No es teoria.

Problema:

El onboarding depende de que el usuario entre al input y de que la capa visible no haya sido desplazada por otros banners.

---

### 1.2 Radar de intencion si existe

Archivo:

- `src/components/chat/QuickIntentPanel.jsx`

Lo que ya hace:

- deja marcar `Chat`, `Hot`, `Paja`, `Juntarse`, `Mirando`,
- muestra cuantos usuarios marcaron cada intencion,
- recomienda una intencion segun comuna, rol compatible y coincidencias,
- deja abrir conversacion privada desde candidatos sugeridos,
- escribe `quickIntentKey` en presencia.

Conclusión:

Es una capa real, fuerte y bien pensada.

Problema:

- esta duplicada conceptualmente con `PresenceSidebarStatusPanel`,
- su launcher colapsado se auto-oculta rapido,
- si el usuario no lo pesca en ese momento, desaparece del flujo superior,
- por lo tanto existe, pero no domina la experiencia.

---

### 1.3 Disponibilidad para conversar si existe

Archivo vivo:

- `src/components/chat/PresenceSidebarStatusPanel.jsx`

Lo que ya hace:

- permite activar disponibilidad conversacional,
- muestra countdown,
- muestra cuantos estan disponibles,
- deja marcar la intencion desde el mismo panel lateral,
- aplica optimistic UI y persiste en presencia.

Conclusión:

Existe y esta conectado.

Problema:

- vive en sidebar/columna y no en el centro del flujo,
- resuelve bien la logica, pero no siempre la visibilidad,
- compite con `QuickIntentPanel` por el mismo territorio mental.

---

### 1.4 Matching contextual para abrir privado si existe

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/chat/ContextualOpportunitiesPanel.jsx`
- `src/components/chat/ChatOnlineUsersColumn.jsx`
- `src/components/chat/ChatBottomNav.jsx`

Lo que ya hace:

- calcula candidatos por rol, comuna, actividad y señales de OPIN,
- mezcla candidatos persistentes con candidatos de presencia,
- construye `contextualOpportunityItems`,
- muestra panel `Disponible ahora`,
- abre privado con greeting contextual,
- guarda score de sugerencias y recurrencia.

Conclusión:

Esta es probablemente la capa mas potente del producto hoy. Ya existe.

Problema:

- su visibilidad depende de que haya una sugerencia activa,
- aparece como rescate contextual, no como columna vertebral del flujo,
- el usuario puede no entender por que se le sugiere alguien,
- y la UX queda repartida entre columna derecha, banner dentro del chat y bandeja `Conecta`.

---

### 1.5 Rescate del “hola vacio” si existe

Archivo:

- `src/components/chat/ChatMessages.jsx`

Lo que ya hace:

- detecta mensajes de baja señal via `_signalMeta`,
- muestra acciones rapidas tipo `Me interesa`, `Te escribo`, `¿Estas cerca?`, `Privado`,
- muestra badges contextuales de rol/intencion/comuna sobre mensajes,
- puede destacar un candidato contextual cuando aparecen mensajes genericos.

Conclusión:

Si existe una capa para combatir el “hola”.

Problema:

- actua tarde, cuando el mensaje malo ya se envio,
- es reactiva, no preventiva,
- y depende de que el usuario vea ese micro-UI dentro del flujo de mensajes.

---

### 1.6 Descubrimiento de privados si existe

Archivos:

- `src/components/chat/ChatBottomNav.jsx`
- `src/components/chat/ChatMessages.jsx`

Lo que ya hace:

- muestra `Conecta` abajo en movil,
- tiene historial de privados,
- tiene solicitudes pendientes,
- tiene sugeridos por compatibilidad/recurrencia/cercania,
- muestra hint para descubrir el privado,
- permite abrir ultimo privado rapido.

Conclusión:

Esto ya esta muy avanzado. No es una idea pendiente.

Problema:

- existe tambien una version paralela dentro de `ChatSidebar.jsx`,
- la experiencia de privados esta mas madura que la narrativa que lleva a usarlos,
- y parte del descubrimiento sigue siendo demasiado “de producto” y poco “de necesidad inmediata”.

---

### 1.7 Comuna como señal de orden si existe

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/auth/GuestUsernameModal.jsx`
- `src/components/chat/ChatInput.jsx`

Lo que ya hace:

- resuelve `currentUserComuna` desde presencia, mensajes, perfil y `localStorage`,
- levanta prompt para guardar comuna,
- muestra banner de cercania,
- usa comuna para scoring de sugerencias,
- usa comuna en templates del input.

Conclusión:

La cercania ya es una capa activa del sistema.

Problema:

- no esta consolidada en una sola experiencia,
- aparece como banner, prompt, chip, hint y parte del scoring,
- pero no como eje central claro y persistente.

---

## 2. Capas que existen pero estan debiles o fragmentadas

### 2.1 QuickIntentPanel y PresenceSidebarStatusPanel pisan el mismo problema

Archivos:

- `src/components/chat/QuickIntentPanel.jsx`
- `src/components/chat/PresenceSidebarStatusPanel.jsx`

Ambos resuelven:

- intencion,
- disponibilidad,
- conteos de usuarios,
- accion rapida sin escribir.

Problema:

- dos UIs distintas para casi la misma promesa,
- una en hero superior y otra en sidebar,
- el usuario no siente “una funcion clara”, siente widgets separados.

Impacto:

- baja adopcion,
- baja memorabilidad,
- y mas complejidad mental de la necesaria.

---

### 2.2 Hay demasiados banners compitiendo arriba del chat

Archivo principal:

- `src/pages/ChatPage.jsx`

Capas que pueden competir:

- `showCercaniaBanner`
- `showPushBanner`
- `showHeteroRoomIntroBanner`
- `OpinDiscoveryBanner`
- `TarjetaPromoBanner`
- `QuickIntentPanel`
- `ContextualOpportunitiesPanel`
- `showUsageGuide` en mensajes
- `showPrivateHint` en mensajes

Problema:

Cada una puede tener sentido sola, pero juntas diluyen el foco.

El usuario necesita una sola respuesta fuerte a:

> “Que hago ahora para conseguir respuesta?”

Hoy muchas capas responden cosas distintas:

- activa push,
- guarda comuna,
- abre OPIN,
- ve Baul,
- marca intencion,
- abre privado,
- mira sugeridos.

Producto rico, pero demasiado ancho para el estado emocional de frustracion.

---

### 2.3 El rescate ocurre demasiado tarde

Archivos:

- `src/components/chat/ChatMessages.jsx`
- `src/pages/ChatPage.jsx`

Problema:

- el sistema ayuda despues del mensaje flojo,
- o despues de scroll,
- o despues de inactividad,
- pero no evita suficientemente el primer error.

Ejemplo:

- anti-hola vive en la salida del mensaje,
- sugeridos contextuales dependen de tener candidato,
- nudges de OPIN/Baul dependen de sesion y timing.

Falta una capa mas dominante en el primer contacto.

---

### 2.4 El matching ya existe, pero la explicacion del por que es debil

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/chat/ContextualOpportunitiesPanel.jsx`
- `src/components/chat/ChatBottomNav.jsx`

Problema:

Hay scoring por:

- rol,
- comuna,
- actividad,
- disponibilidad,
- OPIN,
- recurrencia.

Pero visualmente el usuario recibe algo parecido a:

- `Disponible ahora`
- `Hablar ahora`

Eso es util, pero no siempre transmite por que esa persona vale la pena.

Falta convertir heuristica en explicacion simple:

- `mismo sector`,
- `rol compatible`,
- `activo hace 1 min`,
- `busca lo mismo que tu`.

Parte de eso ya existe en metadata, pero no manda.

---

### 2.5 El producto rescata bien a registrados, menos a invitados

Archivos:

- `src/pages/ChatPage.jsx`
- `src/components/opin/OpinDiscoveryBanner.jsx`
- `src/components/chat/ChatBottomNav.jsx`

Hallazgo:

- invitados si reciben onboarding y discovery,
- pero muchas capas potentes desembocan en privado, OPIN o Baul,
- y esas rutas son mas poderosas cuando el usuario ya esta registrado / identificado.

Problema:

El invitado si entiende que hay mas producto, pero aun puede sentir:

> “hay cosas, pero no son realmente para mi todavia”.

---

## 3. Capas que existen pero quedaron remanentes o no conectadas

### 3.1 `ContextualMessages` existe, pero no aparece conectado al flujo principal

Archivo:

- `src/components/chat/ContextualMessages.jsx`

Hallazgo:

- componente existe,
- propone mensajes para sala vacia, poca gente o silencio,
- pero no aparece cableado desde `ChatPage.jsx`.

Estado:

- remanente util,
- no activo en runtime principal.

---

### 3.2 `ConversationAvailabilityCard` existe, pero fue superado por otra capa

Archivo:

- `src/components/chat/ConversationAvailabilityCard.jsx`

Hallazgo:

- resuelve disponibilidad y CTA hero,
- pero la capa que hoy esta viva es `PresenceSidebarStatusPanel`.

Estado:

- componente valido,
- funcional,
- pero no parece estar conectado en el flujo real.

---

### 3.3 `EmptyRoomNotificationPrompt` existe, pero fue explicitamente desconectado

Archivos:

- `src/components/chat/EmptyRoomNotificationPrompt.jsx`
- `src/pages/ChatPage.jsx`

Hallazgo:

- el import esta comentado en `ChatPage.jsx`,
- el componente sigue existiendo,
- pero hoy no participa del producto.

Estado:

- remanente claro.

---

## 4. Capas documentadas o planeadas que ya empujaron parte del producto

Documentos relevantes:

- `documentacion_md/02-planes-estrategia/MAPA_MEJORAS_OPIN_RETENCION_2026-03-24.md`
- `documentacion_md/02-planes-estrategia/ESTRATEGIAS_RETENCION_Y_LEALTAD.md`
- `documentacion_md/08-bots-ia/ANALISIS_SISTEMA_IA_Y_PLAN_MEJORA_2026-04-12.md`

Hallazgo:

La documentacion coincide fuertemente con lo que hoy existe en codigo:

- usar OPIN como motor de intencion,
- rescatar sesiones sin respuesta,
- empujar comuna,
- reducir “hola vacio”,
- abrir privado con mas contexto,
- reforzar matching,
- no romper el chat principal.

Conclusión:

No estamos frente a un repo sin direccion.

Estamos frente a un producto donde muchas fases ya se construyeron parcialmente, pero quedaron repartidas.

---

## 5. Problemas estructurales detectados

### Problema A: mucha inteligencia, poca jerarquia

Hay logica fuerte:

- scoring,
- heuristicas,
- deteccion de intencion,
- cercania,
- recurrencia.

Pero el usuario no siempre siente una sola ruta fuerte.

### Problema B: duplicidad funcional

Casos claros:

- `QuickIntentPanel` vs `PresenceSidebarStatusPanel`
- `ChatBottomNav` vs atajos paralelos en `ChatSidebar`
- rescates dentro del chat vs rescates laterales

### Problema C: ayudas reactivas en vez de preventivas

Se ayuda cuando:

- ya mando un mensaje malo,
- ya hizo scroll,
- ya paso tiempo,
- ya hubo frustracion.

Falta mas peso al “antes de fallar”.

### Problema D: producto serio, sensacion aun fragmentada

El sistema si sabe:

- quien esta disponible,
- quien es compatible,
- quien esta cerca,
- quien ya mostro intencion,
- quien conviene sugerir de nuevo.

Pero esa inteligencia aun no se siente como una sola experiencia coherente.

---

## 6. Prioridad recomendada

### P0

Unificar la capa superior del chat principal.

Hoy deberia existir una sola experiencia dominante arriba del feed que combine:

- intencion,
- disponibilidad,
- cercania,
- primer siguiente paso.

No tres o cuatro widgets distintos.

### P1

Hacer que la ayuda sea preventiva.

Antes de mandar el primer mensaje, priorizar:

- rol,
- comuna,
- lugar / me muevo,
- CTA contextual claro.

### P2

Reducir duplicados y remanentes.

Decidir explicitamente:

- que queda como experiencia oficial,
- que se elimina,
- que se archiva.

### P3

Explicar mejor los matches.

Mostrar razones concretas:

- misma comuna,
- rol compatible,
- activo hace poco,
- busca algo similar.

---

## 7. Respuesta corta a la pregunta original

Si, ya hay varias de las capas sugeridas.

De hecho, ya hay mas de las que parecia:

- onboarding guiado,
- intencion rapida,
- disponibilidad,
- matching contextual,
- rescate anti-hola,
- sugeridos en privados,
- comuna como orden,
- discovery de OPIN/Baul.

Lo que falta no es “inventar”.

Lo que falta es:

- consolidar,
- simplificar,
- priorizar,
- y sacar remanentes para que el usuario sienta una ruta clara.

---

## 8. Estado final

Clasificacion resumida:

- Activas y valiosas: `ChatInput`, `QuickIntentPanel`, `PresenceSidebarStatusPanel`, `ContextualOpportunitiesPanel`, `ChatBottomNav`, `ChatOnlineUsersColumn`, `ChatMessages` contextual.
- Activas pero fragmentadas: banners de cercania/push/promos, nudges, rescates repartidos.
- Existentes pero no dominantes: sistema de comuna, anti-hola, scoring de compatibilidad.
- Remanentes no conectados: `ContextualMessages`, `ConversationAvailabilityCard`, `EmptyRoomNotificationPrompt`.

Veredicto final:

`Chactivo` ya tiene arquitectura de producto para resolver frustracion.

Lo que no tiene todavia es una presentacion unica y contundente de esa arquitectura frente al usuario que acaba de entrar y no quiere perder tiempo.
