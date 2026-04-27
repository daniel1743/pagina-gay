# Informe Forense IA Chactivo 2026-04-20

## Resumen ejecutivo

### Veredicto corto

La IA de `Chactivo` **si existe**, pero **no domina la experiencia principal del usuario**.

Hoy el sistema real se sostiene principalmente sobre:

- reglas heurísticas,
- validaciones deterministas,
- bloqueos de seguridad,
- y una moderación híbrida donde la IA solo entra en casos ambiguos.

La conclusión operativa es esta:

- **esto funciona**:
  - moderación crítica y anti-extracción,
  - moderación híbrida en chat principal,
  - assistant admin bajo demanda,
  - alertas de moderación en admin.
- **esto no funciona como IA real para usuarios**:
  - companion assistant,
  - bots conversacionales públicos,
  - NicoBot en producción,
  - onboarding assistant como “IA”.
- **esto no es IA**:
  - sanitización de OPIN,
  - seguridad en privados,
  - anti-spam / anti-extracción,
  - buena parte del “assistant” visible al usuario.

### Respuesta a la pregunta central

> ¿La IA de Chactivo realmente funciona o no?

**Funciona parcialmente.**

Funciona en moderación y admin.
No funciona como una capa conversacional viva para el usuario.

### Nivel de madurez

- **Madurez del sistema IA**: `media-baja`

Razón:

- hay piezas reales y valiosas,
- pero están fragmentadas,
- varias viven apagadas,
- y gran parte de lo que parece IA es en realidad lógica heurística o contenido estático.

---

## Metodología aplicada

Se auditó con foco en verdad operativa, no en intención del código.

### Se revisó

- frontend: componentes, hooks, flags y rutas reales de activación,
- servicios IA: OpenAI, DeepSeek, Gemini, Qwen y wrappers internos,
- servicios heurísticos: regex, anti-spam, sanitización y scoring local,
- backend: Cloud Functions, triggers críticos y callables,
- runtime real: flags, fallback chains, límites, dependencias de keys,
- impacto en usuario: qué ve realmente el usuario y qué no.

### Regla aplicada

Un módulo solo se consideró “funcionando” si cumple al menos una de estas:

- se ejecuta desde una pantalla real,
- participa del flujo efectivo de envío / moderación / respuesta,
- o impacta producción a través de trigger o callable.

Si existe solo en código pero no entra en runtime real, se clasificó como:

- `infraestructura IA no activa`
- o `feature experimental apagada`

---

## Diagnóstico final

### Lo que sí es verdad hoy

1. La moderación crítica de `Chactivo` sí toma medidas reales.
2. La moderación híbrida del chat sí usa modelos externos en ciertos casos.
3. El assistant admin sí opera de forma útil y económica.
4. La mayor parte de la seguridad visible no depende de IA, sino de reglas.

### Lo que no es verdad hoy

1. `Chactivo` no tiene una IA conversacional viva en la sala principal.
2. Los bots no están sosteniendo actividad real del chat.
3. El companion assistant no está activo.
4. El onboarding assistant no es IA, aunque visualmente lo parezca.

---

## Análisis por módulos

### 1. Moderación híbrida del chat principal

- **Nombre**: Moderación contextual híbrida
- **Archivos clave**:
  - `src/services/moderationAIService.js`
  - `src/pages/ChatPage.jsx`
- **Estado real**: `activo`
- **Tipo**: `IA híbrida (reglas + modelo)`
- **Impacto usuario**: `alto`
- **Riesgo**: `alto`
- **Nivel de confianza**: `alto`

#### Cómo funciona técnicamente

- aplica scoring local barato,
- bloquea directamente si el riesgo local es fuerte,
- evita llamar IA si no hay señal suficiente,
- escala a IA remota solo en ambiguos,
- orden de proveedores:
  - `DeepSeek -> OpenAI -> Qwen`

#### Cómo se activa en runtime

- `ChatPage.jsx` ejecuta:
  - `checkAIMute(currentUser.id)`
  - `evaluateMessage(content, currentUser.id, currentUser.username, currentRoom)`

#### Evidencia crítica

- usa keys frontend:
  - `VITE_DEEPSEEK_API_KEY`
  - `VITE_OPENAI_API_KEY`
  - `VITE_QWEN_API_KEY`
- tiene fail-open explícito:
  - si fallan todas las APIs, el mensaje se permite
- persiste estado en:
  - `userModerationState/{userId}`
- registra logs en:
  - `moderationLogs`

#### Qué hace de verdad

- sí puede sancionar,
- sí puede mutear,
- sí puede generar alertas,
- sí impacta mensajes reales del chat.

#### Debilidades

- lógica crítica todavía en frontend,
- exposición de dependencia a keys frontend,
- se puede considerar frágil ante manipulación del cliente,
- fail-open reduce dureza si la IA remota falla.

#### Veredicto

- **esto funciona**
- **esto es IA real**, pero subordinada a reglas locales

---

### 2. Anti-spam / anti-extracción / seguridad crítica

- **Nombre**: Guard de seguridad textual
- **Archivos clave**:
  - `src/services/antiSpamService.js`
  - `src/services/chatService.js`
  - `functions/index.js`
- **Estado real**: `activo`
- **Tipo**: `sistema heurístico`
- **Impacto usuario**: `muy alto`
- **Riesgo**: `medio`
- **Nivel de confianza**: `alto`

#### Cómo funciona técnicamente

- bloquea teléfonos,
- correos,
- links,
- plataformas externas,
- contacto fragmentado,
- intenciones de sacar gente fuera de Chactivo,
- señales críticas de:
  - menores,
  - drogas,
  - coerción.

#### Cómo se activa en runtime

- `chatService.js` llama `sanitizeMessage(...)` antes de persistir el mensaje
- el flujo de chat principal depende de esta capa antes de Firestore
- backend además refuerza vía triggers para casos críticos

#### Qué hace de verdad

- bloquea mensajes antes de guardarlos,
- suspende usuarios por seguridad crítica,
- genera alertas admin,
- protege sala pública y privados.

#### Debilidades

- no es IA, aunque sea “inteligente”,
- depende de cobertura de patrones,
- siempre existe riesgo de evasión creativa,
- parte de la lógica se duplica con moderación IA.

#### Veredicto

- **esto funciona**
- **esto no es IA**
- hoy es una de las capas más importantes del producto

---

### 3. Onboarding assistant

- **Nombre**: Chactivo Assistant del input
- **Archivos clave**:
  - `src/components/chat/ChatInput.jsx`
  - `src/components/chat/ChactivoAssistantCard.jsx`
  - `src/services/chactivoOnboardingAssistantService.js`
- **Estado real**: `activo`
- **Tipo**: `contenido estático disfrazado de IA`
- **Impacto usuario**: `medio`
- **Riesgo**: `bajo`
- **Nivel de confianza**: `alto`

#### Cómo funciona técnicamente

- selecciona temas,
- responde con contenido fijo,
- personaliza un poco según guest / rol / comuna,
- no usa modelo ni inferencia.

#### Cómo se activa en runtime

- está montado en `ChatInput.jsx`
- aparece como parte del onboarding visible

#### Qué hace de verdad

- ayuda a redactar mejor,
- guía acciones,
- da ejemplo útil.

#### Qué no hace

- no genera texto nuevo,
- no clasifica,
- no aprende,
- no decide nada.

#### Veredicto

- **esto funciona**
- **esto no es IA**

---

### 4. Companion assistant

- **Nombre**: Companion AI
- **Archivos clave**:
  - `src/services/companionAIService.js`
  - `src/hooks/useCompanionAI.js`
- **Estado real**: `apagado`
- **Tipo**: `feature experimental apagada`
- **Impacto usuario**: `nulo`
- **Riesgo**: `bajo`
- **Nivel de confianza**: `alto`

#### Evidencia crítica

- `const isOpenAIAvailable = false`
- `const openai = null`
- el servicio cae siempre en fallback
- `useCompanionAI` no apareció montado en vistas reales auditadas

#### Veredicto

- **esto no funciona**
- **esto no es IA activa en producción**

---

### 5. Bots conversacionales públicos

- **Nombre**: Sistema de bots sociales del chat
- **Archivos clave**:
  - `src/hooks/useBotSystem.js`
  - `src/services/botCoordinator.js`
  - `src/services/aiUserInteraction.js`
  - `src/services/openAIBotService.js`
  - `src/services/geminiBotService.js`
  - `src/services/multiProviderAIConversation.js`
- **Estado real**: `standby / apagado`
- **Tipo**: `infraestructura IA no activa`
- **Impacto usuario**: `nulo o residual`
- **Riesgo**: `alto`
- **Nivel de confianza**: `medio-alto`

#### Evidencia crítica

- `botCoordinator.js` devuelve `botsCount: 0`
- `sendBotMessage` está desactivado
- `startBotActivity` está desactivado
- `useBotSystem` existe pero no apareció montado en UX real auditada
- `multiProviderAIConversation.js` contiene infraestructura grande, pero no se encontró conectada al flujo principal real del usuario

#### Lectura operativa

- hay mucho código,
- hay mucha intención,
- hay personalidades, prompts y proveedores,
- pero no hay evidencia de operación viva en la sala pública actual.

#### Veredicto

- **esto no funciona en producción**
- **esto sí es infraestructura IA, pero no activa**

---

### 6. NicoBot

- **Nombre**: NicoBot
- **Archivos clave**:
  - `src/services/nicoBot.js`
  - `src/pages/ChatPage.jsx`
- **Estado real**: `apagado por flag`
- **Tipo**: `IA real no activa`
- **Impacto usuario**: `nulo`
- **Riesgo**: `medio`
- **Nivel de confianza**: `alto`

#### Cómo funciona técnicamente

- usa proveedores reales con fallback:
  - `DeepSeek -> OpenAI -> Qwen -> fallback`
- genera:
  - bienvenidas,
  - preguntas para activar conversación

#### Evidencia crítica

- en `ChatPage.jsx`:
  - `const NICO_BOT_ENABLED = false`
- los efectos de Nico salen inmediatamente si el flag está apagado

#### Veredicto

- **esto no funciona hoy**
- **esto sí es IA real potencial**
- hoy está apagado por decisión explícita

---

### 7. Assistant admin

- **Nombre**: Assistant admin operativo
- **Archivos clave**:
  - `src/services/chactivoAssistantService.js`
  - `src/components/admin/AdminAIInsightsPanel.jsx`
  - `src/pages/AdminPage.jsx`
- **Estado real**: `activo`
- **Tipo**: `IA real activa`
- **Impacto usuario**: `indirecto`
- **Riesgo**: `medio`
- **Nivel de confianza**: `alto`

#### Cómo funciona técnicamente

- genera primero resumen local barato,
- permite luego consulta remota bajo demanda,
- usa `DeepSeek` si existe key,
- tiene cupo diario local controlado

#### Evidencia crítica

- `DAILY_REMOTE_ANALYSIS_LIMIT = 4`
- el panel dice explícitamente que no corre solo ni en tiempo real

#### Valor real

- sí aporta inteligencia operativa,
- sí ayuda a admin,
- sí está conectado a producción.

#### Veredicto

- **esto funciona**
- **esto sí es IA real**
- pero solo en experiencia admin

---

### 8. moderationService y Moderation Alerts

- **Nombre**: Infraestructura de alertas de moderación
- **Archivos clave**:
  - `src/services/moderationService.js`
  - `src/components/admin/ModerationAlerts.jsx`
  - `functions/index.js`
- **Estado real**: `parcial`
- **Tipo**: `infraestructura híbrida no plenamente IA`
- **Impacto usuario**: `indirecto`
- **Riesgo**: `medio`
- **Nivel de confianza**: `alto`

#### Evidencia crítica

- `moderationService.js` tiene:
  - `const isOpenAIAvailable = false`
- pero siguen vivos:
  - `createModerationIncidentAlert`
  - suscripciones a `moderation_alerts`
  - revisión admin
  - callable backend `createModerationIncidentAlert`

#### Veredicto

- **esto funciona como infraestructura de alertas**
- **esto no funciona como moderación IA OpenAI activa**

---

### 9. OPIN safety

- **Nombre**: Seguridad OPIN
- **Archivos clave**:
  - `src/services/opinSafetyService.js`
- **Estado real**: `activo`
- **Tipo**: `sistema heurístico`
- **Impacto usuario**: `alto`
- **Riesgo**: `bajo`
- **Nivel de confianza**: `alto`

#### Qué hace

- bloquea teléfonos,
- correos,
- links,
- handles,
- referencias a plataformas.

#### Veredicto

- **esto funciona**
- **esto no es IA**

---

### 10. Seguridad de privados

- **Nombre**: Private chat safety
- **Archivos clave**:
  - `src/services/privateChatSafetyService.js`
  - `src/services/socialService.js`
- **Estado real**: `activo`
- **Tipo**: `sistema heurístico`
- **Impacto usuario**: `alto`
- **Riesgo**: `medio`
- **Nivel de confianza**: `alto`

#### Qué hace

- detecta contacto externo temprano,
- bloquea compartir teléfono, handles, links y plataformas,
- contiene guard específico para privados.

#### Veredicto

- **esto funciona**
- **esto no es IA**

---

## Auditoría específica de moderación

### ¿La IA realmente modera mensajes?

Sí, pero solo parcialmente.

#### Qué parte sí depende de IA

- `moderationAIService.js` llama proveedores externos para casos ambiguos
- puede mutear, escalar y alertar

#### Qué parte no depende de IA

- menores,
- drogas,
- coerción,
- teléfonos,
- links,
- extracción a WhatsApp / Telegram / Discord / otra app,
- OPIN safety,
- private chat safety.

Es decir:

> La moderación más importante y más confiable hoy depende más de reglas que de IA.

### ¿La moderación ocurre client-side o backend?

- híbrida

#### Client-side

- `antiSpamService.js`
- `moderationAIService.js`
- parte de las decisiones previas al guardado

#### Backend

- `functions/index.js`
- `enforceCriticalRoomSafety`
- trigger de privados para mensajes críticos
- `createModerationIncidentAlert`

### ¿Se puede evadir?

Sí, parcialmente.

#### Motivos

- parte crítica aún vive en frontend,
- la IA híbrida remota es `fail-open`,
- un cliente manipulado puede intentar bypass de ciertas rutas frontend.

#### Qué reduce ese riesgo

- triggers backend para seguridad crítica,
- persistencia de sanciones en `userModerationState`,
- alertas admin en `moderation_alerts`.

### ¿Fail-open o fail-closed?

- `moderationAIService.js`: `fail-open`
- `antiSpamService.js` + `chatService.js` para anti-extracción: más cercano a `fail-closed`
- seguridad crítica backend: `fail-closed` real una vez el mensaje entra al backend

### Uso de proveedores externos

Se detectó uso directo desde frontend de:

- `VITE_OPENAI_API_KEY`
- `VITE_DEEPSEEK_API_KEY`
- `VITE_QWEN_API_KEY`

Esto implica:

- dependencia operacional del navegador,
- superficie de exposición mayor,
- y menor robustez que un gateway backend.

---

## Seguridad

### Hallazgos críticos

1. **Hay keys de proveedores IA referenciadas en frontend**
2. **La moderación híbrida todavía toma decisiones desde cliente**
3. **El sistema mezcla enforcement real con apariencia de IA**
4. **Hay duplicación entre heurísticas y moderación IA**

### Riesgos

- desalineación entre seguridad aparente y seguridad real,
- bypass parcial del cliente,
- complejidad operativa innecesaria,
- mantenimiento difícil.

---

## Impacto producto

### Qué ve realmente el usuario

- ve onboarding con assistant,
- ve bloqueos por seguridad,
- ve mensajes rechazados,
- ve menos extracción fuera de la app,
- no ve una IA conversacional real viva en la sala principal.

### Qué módulos afectan de verdad la experiencia

- `antiSpamService`
- `privateChatSafetyService`
- `opinSafetyService`
- `moderationAIService`
- `ChatInput` assistant estático

### Qué partes parecen IA pero no lo son

- assistant onboarding,
- parte del discurso de companion,
- parte de la narrativa de bots.

### Qué partes son invisibles pero críticas

- triggers backend críticos,
- `userModerationState`,
- `moderation_alerts`,
- callable `createModerationIncidentAlert`.

---

## Tabla resumen

| Modulo | Estado real | Es IA real | Impacto usuario | Riesgo | Prioridad |
| --- | --- | --- | --- | --- | --- |
| Moderación híbrida chat principal | Activo | Sí, parcial | Alto | Alto | P0 |
| Anti-spam / anti-extracción | Activo | No | Muy alto | Medio | P0 |
| Seguridad crítica backend | Activo | No | Muy alto | Bajo | P0 |
| Assistant onboarding | Activo | No | Medio | Bajo | P2 |
| Companion AI | Apagado | No | Nulo | Bajo | P3 |
| Bots conversacionales públicos | Apagados | Potencialmente sí | Nulo | Alto | P3 |
| NicoBot | Apagado por flag | Sí potencial | Nulo | Medio | P3 |
| Assistant admin | Activo | Sí | Indirecto | Medio | P1 |
| Moderation alerts infra | Parcial | No | Indirecto | Medio | P1 |
| OPIN safety | Activo | No | Alto | Bajo | P1 |
| Private chat safety | Activo | No | Alto | Medio | P1 |

---

## Problemas raíz

### 1. Desalineación entre marketing técnico y realidad

Hay más narrativa de IA que operación real de IA para usuarios.

### 2. Fragmentación

La IA está repartida entre:

- moderación,
- bots,
- assistants,
- admin,
- safety heurística.

No hay una arquitectura única ni una jerarquía clara.

### 3. Dependencia excesiva en heurísticas

La mayor parte del valor real de seguridad no viene de IA sino de regex y reglas.

### 4. Features construidas pero no integradas

- companion,
- bots,
- NicoBot,
- infraestructura multi-provider conversacional.

### 5. Seguridad crítica todavía demasiado cerca del frontend

Eso baja robustez.

---

## Recomendaciones accionables

## Corto plazo

1. Consolidar el discurso técnico:
   - llamar “IA” solo a lo que realmente usa modelo.
2. Mantener prioridad en moderación y alertas.
3. Dejar explícito en documentación interna qué es:
   - IA real,
   - heurística,
   - assistant estático.
4. No reactivar bots sociales hasta tener una necesidad real.
5. Seguir endureciendo anti-extracción y seguridad crítica.

## Medio plazo

1. Mover la moderación híbrida a backend o gateway controlado.
2. Eliminar duplicación entre `moderationAIService` y `antiSpamService`.
3. Convertir `userModerationState` en fuente única y consistente.
4. Consolidar alertas críticas en una sola tubería de decisión.
5. Auditar si `multiProviderAIConversation` debe sobrevivir o archivarse.

## Largo plazo

1. Si Chactivo quiere IA real de producto, definir una sola visión:
   - moderación,
   - concierge real,
   - matching,
   - o assistant operativo.
2. Sacar la lógica crítica del cliente.
3. Crear una arquitectura IA con:
   - gateway backend,
   - presupuesto controlado,
   - observabilidad,
   - y feature flags claros.

---

## Qué activar, qué eliminar, qué consolidar

### Activar

- nada social por ahora
- solo lo que refuerce:
  - moderación,
  - alertas,
  - seguridad.

### Eliminar o archivar

- companion AI si no se va a reactivar pronto,
- bots públicos dormidos si siguen fuera de roadmap,
- narrativa de IA falsa en módulos estáticos.

### Consolidar

- `antiSpamService`
- `moderationAIService`
- backend crítico en `functions/index.js`
- `moderationService`

---

## Conclusión final

### Esto funciona

- moderación híbrida,
- seguridad textual,
- enforcement crítico,
- assistant admin,
- alertas admin.

### Esto no funciona

- bots públicos,
- companion AI,
- NicoBot en producción,
- IA conversacional principal para usuarios.

### Esto es IA real

- `moderationAIService` en casos ambiguos,
- `chactivoAssistantService` admin,
- `nicoBot` solo como infraestructura potencial,
- servicios bot conversacionales solo como infraestructura potencial.

### Esto no es IA

- anti-spam,
- anti-extracción,
- OPIN safety,
- private chat safety,
- onboarding assistant.

### Veredicto definitivo

`Chactivo` hoy no es un producto impulsado por IA conversacional real.

Es un producto donde:

- la seguridad real depende sobre todo de heurísticas,
- la IA útil está concentrada en moderación parcial y admin,
- y gran parte del resto es infraestructura dormida o apariencia de IA.

La frase exacta es:

> `La IA de Chactivo sí existe, pero hoy aporta valor real sobre todo en moderación y análisis admin; no en la conversación principal del usuario.`
