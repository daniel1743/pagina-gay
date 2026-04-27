# Auditoria Estado Real IA Chactivo 2026-04-20

## Objetivo

Evaluar de forma exhaustiva como esta funcionando la "IA" dentro de `Chactivo` y responder con precision:

- que modulos de IA existen de verdad,
- cuales estan conectados al producto real,
- cuales estan desactivados,
- cuales son solo reglas o contenido estatico,
- y si hoy la IA de Chactivo realmente funciona o no.

---

## Veredicto ejecutivo

`Chactivo` no tiene una sola IA.

Tiene varias piezas distintas mezcladas bajo la etiqueta de IA:

1. moderacion contextual,
2. assistant de onboarding,
3. companion assistant,
4. bots conversacionales,
5. NicoBot,
6. assistant admin,
7. sanitizacion/seguridad de OPIN y privados.

El veredicto real hoy es este:

- La **IA de moderacion** si esta viva y conectada al chat principal, pero funciona en modo hibrido: reglas locales primero, IA remota solo para casos ambiguos.
- El **assistant de onboarding** si esta visible en producto, pero **no es IA real**. Es contenido predefinido y deterministicamente seleccionado.
- El **companion AI** **no esta funcionando como IA**. Esta desactivado y solo devuelve fallbacks.
- Los **bots conversacionales publicos** **no estan funcionando** en salas reales. El coordinador esta en standby y el hook ni siquiera aparece montado.
- `NicoBot` tiene servicio real con proveedores IA, pero en `ChatPage` esta **apagado** con flag.
- El **assistant admin** si funciona de verdad, pero es una IA de uso interno y bajo demanda, no una IA del chat para usuarios.
- OPIN y privados usan **seguridad por regex/sanitizacion**, no IA generativa ni clasificacion inteligente real.

Conclusion corta:

> La IA de Chactivo hoy funciona solo en dos lugares con valor real:
> `moderacion hibrida` y `assistant admin bajo demanda`.
>
> En casi todo lo demas, la IA esta desactivada, reemplazada por reglas, o presentada como assistant sin ser una IA real.

---

## Estado por modulo

### 1. Moderacion IA del chat principal

Archivo principal:

- `src/services/moderationAIService.js`

Uso real:

- `src/pages/ChatPage.jsx`

Estado:

- **Activa**
- **Conectada**
- **Funciona parcialmente como IA real**

Como opera:

- primero hace scoring local barato,
- si el mensaje es claramente peligroso lo bloquea por reglas locales,
- si no hay riesgo fuerte, permite sin llamar IA,
- solo si el mensaje es ambiguo pero riesgoso sube a proveedor remoto,
- proveedores en orden: `DeepSeek -> OpenAI -> Qwen`,
- si fallan las APIs, aplica `fail-open` y deja pasar.

Lo que si hace bien:

- evita gastar IA en cada mensaje,
- no modera lenguaje sexual gay normal por defecto,
- tiene cache local de estado de moderacion,
- guarda estado en `userModerationState/{userId}`,
- registra eventos en `moderationLogs`,
- puede crear alertas de alto riesgo para admin.

Problemas reales:

- sigue siendo **100% client-side**, lo que es fragil para seguridad real,
- depende de llaves frontend (`VITE_DEEPSEEK_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_QWEN_API_KEY`),
- parte de la politica vive duplicada en `antiSpamService.js`,
- no es una moderacion backend autoritativa.

Veredicto:

- **Si funciona**
- pero funciona como **IA auxiliar sobre un sistema de reglas**, no como motor central autonomo.

---

### 2. Anti-spam / anti-extraccion

Archivo principal:

- `src/services/antiSpamService.js`

Estado:

- **Activo**
- **Muy conectado**
- **No es IA**

Que hace:

- bloquea telefonos, correos, links y plataformas externas,
- detecta contacto fragmentado,
- detecta patrones criticos de menores, drogas y coercion,
- aplica sanciones y logs,
- reutiliza `checkDuplicateSpamBeforeSend` desde `moderationAIService`.

Hallazgo clave:

- esta pieza hoy gobierna una parte enorme de la "inteligencia" de seguridad,
- pero es casi totalmente heuristica/determinista,
- por lo tanto no debe contarse como IA real aunque sea avanzada.

Veredicto:

- **Funciona**
- pero es **motor de reglas**, no IA.

---

### 3. Assistant de onboarding en el input

Archivos:

- `src/components/chat/ChatInput.jsx`
- `src/components/chat/ChactivoAssistantCard.jsx`
- `src/services/chactivoOnboardingAssistantService.js`

Estado:

- **Activo**
- **Visible para usuarios**
- **No es IA real**

Prueba clara:

- `ChatInput.jsx` usa `getChactivoAssistantReply(...)`
- `chactivoOnboardingAssistantService.js` devuelve temas y respuestas fijas
- `ChactivoAssistantCard.jsx` incluso declara:
  - `Guia rapida real. No simula usuarios ni empuja conversaciones falsas.`

Que hace realmente:

- muestra ayuda contextual,
- cambia el contenido segun rol/comuna/guest,
- ofrece ejemplos y quick actions.

Lo que no hace:

- no llama a modelos,
- no genera texto nuevo,
- no clasifica mensajes con LLM,
- no aprende del contexto real de la sala.

Veredicto:

- **Funciona como onboarding UX**
- **No funciona como IA**

---

### 4. Companion AI

Archivos:

- `src/services/companionAIService.js`
- `src/hooks/useCompanionAI.js`

Estado:

- **Desactivado**
- **No montado**
- **No funciona como IA real**

Prueba clara:

- `companionAIService.js` fuerza:
  - `const isOpenAIAvailable = false`
  - `const openai = null`
- el servicio siempre cae en mensajes fallback
- `useCompanionAI` existe pero no aparece montado en ninguna vista real encontrada.

Implicacion:

- aunque el código promete ayuda sutil, primer mensaje y asistencia contextual,
- en runtime actual eso no opera como feature viva del producto.

Veredicto:

- **No funciona**

---

### 5. Bots conversacionales publicos

Archivos:

- `src/hooks/useBotSystem.js`
- `src/services/botCoordinator.js`
- `src/services/aiUserInteraction.js`
- `src/services/openAIBotService.js`
- `src/services/geminiBotService.js`

Estado:

- **Arquitectura grande existente**
- **No activa en experiencia real**

Hallazgos clave:

- `useBotSystem` existe, pero no aparecio montado en pantallas reales.
- `botCoordinator.js` devuelve `botsCount: 0`.
- `sendBotMessage` esta explicitamente desactivado y retorna sin enviar.
- `startBotActivity` esta explicitamente desactivado.
- el propio coordinador deja claro que los bots de fondo estan apagados.

Sobre `aiUserInteraction.js`:

- es una pieza extensa y sofisticada,
- contiene personas, estilo de habla y logica de activacion,
- pero depende de un ecosistema que hoy no esta realmente encendido.

Sobre `openAIBotService.js` y `geminiBotService.js`:

- los servicios existen,
- la infraestructura de prompts tambien,
- pero no hay evidencia de que hoy muevan la sala principal.

Veredicto:

- **No funcionan en produccion como sistema vivo**
- hoy son mas bien **infraestructura dormida o experimental**.

---

### 6. BotControlPanel

Archivos:

- `src/components/admin/BotControlPanel.jsx`
- `src/services/botEngine.js`
- `src/pages/AdminPage.jsx`

Estado:

- **Activo en admin**
- **No es IA del chat principal**

Hallazgo:

- `BotControlPanel` si esta conectado al panel admin.
- `botEngine.js` esta restringido a `admin-testing`.
- usa conversaciones pregrabadas y control operativo.

Veredicto:

- **Funciona como herramienta admin/test**
- **No cuenta como IA viva para usuarios reales en Chactivo**.

---

### 7. NicoBot

Archivos:

- `src/services/nicoBot.js`
- `src/pages/ChatPage.jsx`

Estado:

- **Servicio real existe**
- **Integracion real existe**
- **Actualmente apagado**

Lo importante:

- `nicoBot.js` si usa modelo real con fallback:
  - `DeepSeek -> OpenAI -> Qwen -> fallback`
- genera:
  - bienvenidas,
  - preguntas calientes para activar sala.

Pero en `ChatPage.jsx`:

- `const NICO_BOT_ENABLED = false`

y todos los efectos de Nico salen inmediatamente si ese flag esta apagado.

Consecuencia:

- hoy Nico no esta aportando a la sala principal,
- aunque el servicio este bien armado.

Veredicto:

- **No funciona hoy en runtime real**
- pero **seria reactivable rapido**.

---

### 8. Assistant admin

Archivos:

- `src/services/chactivoAssistantService.js`
- `src/components/admin/AdminAIInsightsPanel.jsx`
- `src/pages/AdminPage.jsx`

Estado:

- **Activo**
- **Bien pensado**
- **Funciona**

Como opera:

- primero arma un resumen local barato con `buildLocalChactivoAssistantInsight`,
- luego permite consulta remota solo bajo demanda con `generateChactivoAssistantInsight`,
- usa `DeepSeek` si hay key,
- tiene limite diario local:
  - `DAILY_REMOTE_ANALYSIS_LIMIT = 4`

Lo bueno:

- no escucha en tiempo real,
- no procesa cada mensaje,
- no manda historial completo todo el tiempo,
- tiene modo economico claro.

Lo importante:

- esta es probablemente la pieza de IA mejor resuelta del repo hoy.

Veredicto:

- **Si funciona**
- pero es **IA de admin**, no IA del usuario final.

---

### 9. Moderation Alerts / moderationService

Archivos:

- `src/services/moderationService.js`
- `src/components/admin/ModerationAlerts.jsx`
- `functions/index.js`

Estado:

- **Parcial**

Hallazgos:

- `moderationService.js` tenia integracion OpenAI, pero esta forzada a:
  - `isOpenAIAvailable = false`
- aun asi sigue viva la parte de:
  - `createModerationIncidentAlert`
  - suscripciones admin a alertas
  - revision de alertas de contacto

Consecuencia:

- como moderacion IA generativa directa, esta pieza no esta viva,
- como infraestructura admin para alertas, si funciona.

Veredicto:

- **Funciona como capa de alertas**
- **No funciona como IA activa de moderacion por OpenAI**

---

### 10. OPIN y privados

Archivos:

- `src/services/opinSafetyService.js`
- `src/services/privateChatSafetyService.js`

Estado:

- **Activos**
- **No son IA**

Que hacen:

- sanitizan texto publico,
- bloquean telefonos, handles, links, email,
- contienen regex y reglas de seguridad temprana.

Veredicto:

- **Funcionan**
- pero **no son IA**.

---

## Tabla resumen

| Modulo | Estado real | Es IA real | Funciona hoy |
| --- | --- | --- | --- |
| Moderacion contextual | Activo | Si, parcial/hibrido | Si |
| Anti-spam / anti-extraccion | Activo | No | Si |
| Assistant onboarding | Activo | No | Si |
| Companion AI | Desactivado | No en runtime | No |
| Bots conversacionales publicos | Desactivados / standby | Potencialmente si | No |
| BotControlPanel admin-testing | Activo en admin | No necesariamente | Si, solo admin/test |
| NicoBot | Apagado por flag | Si, potencialmente | No |
| Assistant admin | Activo bajo demanda | Si | Si |
| Moderation alerts | Parcial | No como IA activa | Si, como alertas |
| OPIN / private safety | Activo | No | Si |

---

## Lo que si esta funcionando de verdad

### Funciona y aporta valor real

- `moderationAIService.js`
- `chactivoAssistantService.js`
- `AdminAIInsightsPanel.jsx`
- `antiSpamService.js`
- `opinSafetyService.js`
- `privateChatSafetyService.js`

### Funciona pero no es IA real

- `chactivoOnboardingAssistantService.js`
- `ChactivoAssistantCard.jsx`
- buena parte del stack de seguridad textual

---

## Lo que no esta funcionando hoy

### Apagado o dormido

- `companionAIService.js`
- `useCompanionAI.js`
- `botCoordinator.js` como sistema de bots reales
- `useBotSystem.js` en UX real
- `NicoBot` en la sala principal
- `moderationService.js` como moderacion OpenAI directa

---

## Problema estructural detectado

El problema principal no es falta de ideas.

El problema es que el proyecto mezcla bajo la palabra "IA" cuatro categorias distintas:

1. IA real por modelo remoto,
2. reglas heuristicas,
3. contenido estatico disfrazado de assistant,
4. sistemas experimentales apagados.

Eso genera confusion tecnica y de producto:

- parece que hay mucha IA,
- pero en la experiencia real del usuario casi toda esa capa esta apagada o degradada,
- y lo que verdaderamente sostiene el sistema hoy es seguridad heuristica + onboarding guiado + moderacion hibrida.

---

## Veredicto final

### Si la pregunta es:

> "La IA de Chactivo funciona o no?"

La respuesta correcta es:

- **Si funciona parcialmente**, pero **no en el sentido amplio que parece sugerir el repo**.

### Lo que si funciona

- moderacion hibrida con IA para ambiguos,
- assistant admin bajo demanda,
- seguridad por reglas muy agresiva.

### Lo que no funciona hoy

- companion IA para usuarios,
- bots IA conversando en la sala,
- NicoBot en produccion,
- varias capas que prometen IA social o conversacional.

### Conclusión raíz

`Chactivo` hoy **no es un producto impulsado por IA conversacional viva**.

Es un producto que:

- usa algo de IA real en moderacion y analisis admin,
- se apoya mucho mas en reglas locales y contenido guiado,
- y mantiene varios sistemas de IA social construidos pero desactivados.

La frase mas precisa seria:

> `La IA de Chactivo hoy existe, pero esta concentrada en moderacion y admin; no en la experiencia conversacional principal del usuario.`
