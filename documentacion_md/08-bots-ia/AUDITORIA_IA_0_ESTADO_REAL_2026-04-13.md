# AUDITORIA IA-0 - ESTADO REAL DEL SISTEMA DE IA

Fecha: 2026-04-13  
Proyecto: Chactivo  
Objetivo: determinar que piezas de IA estan realmente activas, cuales son remanentes y cuales deben eliminarse o migrarse

---

## 1. Veredicto ejecutivo

El estado real de IA en Chactivo hoy es mixto.

Hay una sola pieza claramente activa en el flujo principal:

- `moderationAIService.js`

El resto esta repartido entre:

- codigo importado pero desactivado por flags
- hooks no conectados al runtime principal
- sistemas legacy de bots o companion
- remanentes de arquitectura vieja que no deberian volver a ser el centro del producto

El hallazgo mas importante de esta auditoria no es solo funcional, sino de seguridad:

- existen llaves reales de proveedores IA configuradas en variables `VITE_*` del frontend
- eso significa que, si un modulo cliente llama directo a DeepSeek, OpenAI o Qwen, la clave queda expuesta al navegador

Conclusión directa:

- la IA activa hoy no esta suficientemente normalizada
- la moderacion IA actual funciona, pero corre con una arquitectura que no deberia consolidarse asi
- antes de implementar nuevas funciones IA, hay que separar claramente:
  - `conservar`
  - `migrar a backend`
  - `apagar`
  - `eliminar`

---

## 2. Hallazgos criticos

### 2.1 Moderacion IA activa en el chat actual

El flujo principal del chat usa IA de moderacion en runtime:

- `src/pages/ChatPage.jsx`
- `src/services/moderationAIService.js`
- `src/services/antiSpamService.js`

Se detecto:

- chequeo de mute IA antes del envio
- evaluacion IA post-envio para texto
- bloqueo previo por spam duplicado reutilizando logica del mismo servicio

Esto significa que la moderacion IA no es teorica ni remanente:

- si esta conectada al flujo real del chat

### 2.2 La moderacion IA actual es client-side

`src/services/moderationAIService.js` llama directamente desde frontend a:

- DeepSeek
- OpenAI
- Qwen

con claves tomadas de:

- `VITE_DEEPSEEK_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_QWEN_API_KEY`

Eso es una deuda critica porque:

- expone secretos al cliente
- dificulta control de costo
- permite abuso si alguien inspecciona el bundle o el navegador
- deja la politica IA dependiente del frontend

### 2.3 Nico existe pero esta apagado por flag

`src/services/nicoBot.js` sigue implementado y usa:

- DeepSeek como primario
- OpenAI como fallback
- Qwen como fallback final

Pero en `src/pages/ChatPage.jsx` existe:

- `const NICO_BOT_ENABLED = false;`

Por tanto:

- Nico no esta operando hoy en el flujo normal
- su codigo existe y puede reactivarse con muy poco cambio
- es un modulo dormido, no eliminado

### 2.4 Companion AI esta desactivado y sin integracion real

`src/hooks/useCompanionAI.js` y `src/services/companionAIService.js` muestran:

- arquitectura pensada para ayuda a usuarios anonimos
- provider OpenAI desactivado forzadamente
- fallback local si OpenAI no esta disponible

Pero:

- no se detecto uso real del hook en el flujo principal
- el servicio tiene `isOpenAIAvailable = false`

Conclusión:

- es un remanente util como idea de producto
- no es una pieza operativa actual

### 2.5 El sistema de bots legacy esta mayormente en standby o desconectado

Piezas relacionadas:

- `src/hooks/useBotSystem.js`
- `src/services/botCoordinator.js`
- `src/services/aiUserInteraction.js`
- `src/services/openAIBotService.js`
- `src/services/multiProviderAIConversation.js`

Se detecto:

- `useBotSystem` no aparece conectado al flujo principal
- `botCoordinator` tiene envio de bots desactivado internamente
- `multiProviderAIConversation.js` tiene `AI_SYSTEM_ENABLED = false`
- varias rutas hablan de OpenAI, DeepSeek, Gemini y Qwen, pero no se detectan hoy como camino principal del runtime real del chat

Conclusión:

- este bloque es legacy/remanente
- no deberia ser la base del nuevo plan IA
- hay demasiado ruido arquitectonico ahi para reutilizarlo sin limpieza

### 2.6 Hay copy publico que promete IA sin suficiente alineacion tecnica

Se detectaron textos en landings y FAQ del tipo:

- "IA detecta abusos"
- "moderacion 24/7"
- "sistema hibrido IA + humanos"

Eso puede ser parcialmente cierto como idea general, pero hoy no esta claramente alineado con:

- que modulo esta vivo
- cual esta apagado
- que parte es realmente automatica
- que parte depende de revision humana

---

## 3. Matriz por modulo

## 3.1 `src/services/moderationAIService.js`

Estado: activo  
Rol actual: moderacion contextual post-envio + mute IA + control de spam duplicado  
Provider actual en codigo: DeepSeek primario, OpenAI fallback, Qwen fallback  
Riesgo:

- alto por correr desde frontend con llaves `VITE_*`
- costo poco controlado si escala trafico
- mezcla de moderacion y politica IA en cliente

Decision recomendada:

- conservar la logica funcional
- migrar llamadas IA a backend
- mantener reglas deterministicas en cliente solo para prefiltrado barato

## 3.2 `src/services/antiSpamService.js`

Estado: activo indirectamente con apoyo IA  
Rol actual:

- usa `checkDuplicateSpamBeforeSend` desde `moderationAIService`

Riesgo:

- acoplamiento con servicio IA que hoy tambien contiene logica que deberia separarse

Decision recomendada:

- conservar
- desacoplar la parte deterministica de spam del servicio IA

## 3.3 `src/services/nicoBot.js`

Estado: dormido  
Rol actual:

- bienvenidas y preguntas de activacion de sala

Evidencia:

- importado en `ChatPage.jsx`
- bloqueado por `NICO_BOT_ENABLED = false`

Riesgo:

- reactivarlo seria volver a un modelo de bot visible en sala
- hoy ya no coincide con la estrategia decidida

Decision recomendada:

- no reactivar como bot publico
- conservar temporalmente solo si se quiere reciclar parte del tono para `Chactivo Assistant`
- si no se reutiliza, apagar de forma definitiva o archivar

## 3.4 `src/services/companionAIService.js`

Estado: inactivo  
Rol actual:

- motor de ayuda a usuarios anonimos

Evidencia:

- OpenAI desactivado a la fuerza
- sin integracion detectada en el flujo principal

Riesgo:

- bajo en runtime actual
- medio como ruido arquitectonico

Decision recomendada:

- conservar concepto
- no conservar implementacion tal como esta
- reciclar solo para futura fase `Chactivo Assistant`

## 3.5 `src/hooks/useCompanionAI.js`

Estado: inactivo / no conectado  
Rol actual:

- UX de companion para romper el hielo o ayudar a usuarios anonimos

Riesgo:

- bajo en runtime
- medio como deuda de codigo muerto

Decision recomendada:

- no usar como base directa
- extraer ideas de triggers y escenarios
- luego eliminar o reemplazar

## 3.6 `src/services/openAIBotService.js`

Estado: legacy/remanente  
Rol actual:

- motor de respuestas humanas simuladas para bots

Riesgo:

- alto si se reactiva, porque la estrategia actual rechaza bots falsos
- usa OpenAI cliente

Decision recomendada:

- no reutilizar como base principal
- marcar para retiro progresivo

## 3.7 `src/services/aiUserInteraction.js`

Estado: legacy/remanente  
Rol actual:

- interaccion IA con usuario real mediante perfiles simulados

Riesgo:

- alto por desalineacion con estrategia actual
- depende de `openAIBotService`

Decision recomendada:

- no conservar para la nueva etapa
- preparar eliminacion o archivo

## 3.8 `src/services/botCoordinator.js`

Estado: remanente en standby  
Rol actual:

- coordinador de bots y actividad artificial

Evidencia:

- varias rutas internas desactivadas
- `sendBotMessage` bloqueado
- actividad automatica comentada o anulada

Riesgo:

- alto como complejidad innecesaria

Decision recomendada:

- no usar para la nueva estrategia IA
- archivar o retirar luego de auditoria completa de dependencias

## 3.9 `src/hooks/useBotSystem.js`

Estado: no conectado / remanente  
Rol actual:

- hook para sistema de bots en sala

Riesgo:

- medio por ruido y posibilidad de reactivacion accidental

Decision recomendada:

- no integrar a nada nuevo
- dejar fuera del plan principal

## 3.10 `src/services/multiProviderAIConversation.js`

Estado: remanente desactivado  
Rol actual:

- sistema multi-provider de personalidades IA

Evidencia:

- `AI_SYSTEM_ENABLED = false`
- no se detecto conexion actual al flujo principal del chat

Riesgo:

- alto si alguien lo reactiva sin limpieza
- muy complejo para el objetivo actual

Decision recomendada:

- no reutilizar
- dejarlo fuera del nuevo camino
- considerar archivo o retiro progresivo

---

## 4. Estado real por categoria

### 4.1 Modulos a conservar

- `moderationAIService.js` como funcionalidad, no como arquitectura final
- partes deterministicas de `antiSpamService.js`

### 4.2 Modulos a migrar

- `moderationAIService.js`

Migracion esperada:

- scoring barato local
- IA selectiva en backend
- llaves fuera del cliente

### 4.3 Modulos a apagar o congelar

- `nicoBot.js`
- `companionAIService.js`
- `useCompanionAI.js`

### 4.4 Modulos a preparar para retiro

- `openAIBotService.js`
- `aiUserInteraction.js`
- `botCoordinator.js`
- `useBotSystem.js`
- `multiProviderAIConversation.js`

---

## 5. Riesgos principales detectados

## Riesgo 1. Exposicion de llaves IA en frontend

Se detecto configuracion real de:

- OpenAI
- DeepSeek
- Qwen

en variables `VITE_*`.

Esto implica:

- secreto expuesto al bundle cliente
- riesgo economico
- riesgo operativo

Accion recomendada:

- rotar las llaves expuestas
- migrar cualquier llamada IA sensible a backend

## Riesgo 2. Arquitectura IA fragmentada

Hoy hay demasiados caminos historicos:

- moderacion
- bots
- companion
- multi-provider
- nico

Eso dificulta:

- saber que corre
- controlar costo
- depurar errores
- diseñar producto coherente

## Riesgo 3. Reutilizacion accidental de sistemas viejos

Hay modulos que estan desactivados por flags o comentarios, no eliminados.

Eso significa que:

- pueden reactivarse por error
- pueden contaminar el nuevo enfoque de IA

---

## 6. Recomendacion de arquitectura para la siguiente etapa

No continuar desde la arquitectura legacy de bots.

La siguiente etapa debe salir desde este esquema:

### Capa 1. Reglas deterministicas locales o backend

- spam
- duplicados
- contacto externo
- patrones obvios de riesgo

### Capa 2. IA selectiva y bajo demanda

- DeepSeek como proveedor primario
- solo para casos ambiguos o panel admin

### Capa 3. Herramientas admin

- `Admin AI Insights`
- resúmenes por bloque temporal
- alertas de moderacion
- recomendaciones por bloques

### Capa 4. `Chactivo Assistant`

- onboarding
- ayuda
- explicacion del sistema
- cero teatralidad de usuario falso

---

## 7. Primeras acciones recomendadas despues de IA-0

1. congelar oficialmente todos los modulos legacy de bots
2. decidir que se migra y que se retira
3. mover la moderacion IA a backend o dejarla en modo mixto transitorio
4. rotar llaves expuestas en frontend
5. crear `Admin AI Insights v1`
6. despues crear `Chactivo Assistant`

---

## 8. Decision final de IA-0

La auditoria deja esta conclusion:

- la unica IA con impacto real hoy en el chat es la moderacion
- casi todo lo demas es legado, remanente o codigo desactivado
- el nuevo plan no debe construirse sobre bots conversacionales
- el nuevo plan debe construirse sobre:
  - moderacion selectiva
  - panel admin inteligente
  - onboarding asistido

Ese es el camino correcto para la siguiente fase.
