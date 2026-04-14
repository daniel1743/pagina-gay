# PLAN MAESTRO - IMPLEMENTACIONES FALTANTES E IA POR FASES

Fecha: 2026-04-13  
Proyecto: Chactivo  
Estado: Documento base de ejecucion

---

## 1. Objetivo del documento

Este documento deja una base unica para:

- ordenar lo que aun falta implementar en Chactivo
- separar lo urgente de lo opcional
- definir una ruta de IA por pasos pequenos y verificables
- evitar reactivar sistemas caros, inseguros o confusos
- avanzar con pruebas graduales antes de meter IA de lleno en produccion

La regla operativa desde este punto es simple:

1. primero documentar
2. despues implementar por fase
3. medir costo, friccion y precision
4. solo entonces ampliar alcance

---

## 2. Diagnostico resumido actual

### 2.1 Seguridad y producto

Ya existe un endurecimiento importante en:

- separacion de datos publicos y privados
- notificaciones sensibles desde backend
- ownership de media en storage
- control de invitados con edad y aceptacion de normas
- rate limit real
- cierre mayor de colecciones sensibles

Pero todavia faltan:

- despliegues y activacion final de todo lo pendiente
- pruebas negativas formales
- monitoreo post-hardening
- ajustes UX en notificaciones y admin
- cierre operativo de ciertos flujos de moderacion

### 2.2 Estado real de IA detectado en codigo

Hoy el proyecto tiene varias piezas de IA o remanentes:

- `src/services/moderationAIService.js`
- `src/services/nicoBot.js`
- `src/services/multiProviderAIConversation.js`
- `src/services/aiUserInteraction.js`
- `src/services/openAIBotService.js`
- `src/services/companionAIService.js`
- `src/hooks/useCompanionAI.js`
- `src/hooks/useBotSystem.js`

Tambien hay copy publico que promete cosas como:

- "IA detecta abusos"
- "moderacion 24/7"
- "sistema hibrido IA + humanos"

Eso obliga a ordenar dos cosas antes de tocar mas IA:

- que parte esta realmente activa
- que parte es herencia vieja, fallback, remanente o marketing no alineado

### 2.3 Decision estrategica vigente

No se debe volver a un modelo de:

- bots falsos para animar la sala
- respuestas IA constantes en la sala principal
- llamadas caras por cada mensaje o evento trivial
- IA en frontend con llaves sensibles

La IA de Chactivo debe quedar orientada a:

- moderacion de alto riesgo
- onboarding y guia personalizada
- clasificacion de intencion
- apoyo a matching y orden
- herramientas para admin y no teatro conversacional

---

## 3. Implementaciones faltantes fuera de IA

Esta seccion queda como backlog operativo general.

### 3.1 Bloque A - Cierre tecnico del hardening

Prioridad: critica

Falta:

- desplegar `firestore.rules`
- desplegar `storage.rules`
- desplegar frontend actualizado
- ejecutar `backfillPublicUserProfiles`
- validar que el espejo publico quede completo

Resultado esperado:

- reglas activas en produccion
- media protegida de verdad
- perfiles publicos sirviendo a los consumidores correctos

### 3.2 Bloque B - Pruebas S7

Prioridad: critica

Falta probar:

- invitado nuevo
- usuario registrado
- envio de mensaje
- envio de imagen
- privado
- notificacion
- perfil

Pruebas negativas pendientes:

- intento de leer datos privados ajenos
- intento de crear notificaciones falsas
- intento de borrar media ajena
- intento de flood rapido
- intento de acceso invitado sin edad valida o sin aceptar normas

Resultado esperado:

- endurecimiento sin regresion grave

### 3.3 Bloque C - Monitoreo S8

Prioridad: alta

Falta medir:

- mensajes enviados por invitados
- conversion landing a primer mensaje
- errores de permisos
- intentos bloqueados
- volumen de spam
- tasa de privados
- friccion nueva por validaciones de acceso

Resultado esperado:

- calibracion fina sin romper crecimiento

### 3.4 Bloque D - UX y operaciones

Prioridad: alta

Pendientes detectados:

- panel de notificaciones con cierre visual correcto
- acciones claras: borrar, borrar todos, marcar leidos
- simplificar descarga de informe admin 7d / 14d
- corregir errores actuales del informe
- revisar copy publico que promete capacidades de IA no confirmadas

### 3.5 Bloque E - Moderacion no-IA base

Prioridad: critica

Antes de ampliar IA, faltan capas deterministicas o mas baratas:

- deteccion local de menores explicitos e implicitos
- bloqueo de palabras de odio y violencia
- bloqueo de drogas y lenguaje de alto riesgo
- bloqueo de salida de plataforma:
  - WhatsApp
  - Telegram
  - Signal
  - correo
  - numeros
- rate limit por repeticion semantica o textual
- mejor sistema de alertas de moderacion para staff

---

## 4. Principios para la nueva ruta de IA

1. IA no reemplaza reglas basicas.
2. Mientras no haya capital para backend dedicado, la IA podra operar temporalmente desde frontend en modo restringido y de bajo consumo.
3. IA no se usa para fingir actividad humana.
4. IA debe entrar primero como apoyo interno, no como actor publico.
5. Cada fase debe tener:
   - trigger exacto
   - limite de costo
   - fallback sin IA
   - criterio de exito
   - kill switch

### 4.1 Restriccion economica actual

Condicion aprobada para esta etapa:

- no sumar costo Firebase para IA en este momento
- priorizar llamadas selectivas desde frontend
- evitar flujos de IA por mensaje normal o evento frecuente

Esto obliga a trabajar asi:

- DeepSeek como provider principal cuando haga falta
- llamadas bajo demanda o por umbral alto
- respuestas resumidas por bloques
- nada de analisis continuo cada pocos segundos

Advertencia tecnica:

- frontend-first reduce costo Firebase, pero aumenta riesgo por exposicion de claves
- por eso esta etapa solo se justifica si el uso es muy controlado y las llaves se rotan cuando corresponda

---

## 5. Ruta IA por fases

## Fase IA-0. Auditoria y limpieza de IA heredada

Estado: pendiente  
Prioridad: critica

Objetivo:

- saber exactamente que piezas de IA siguen activas, cuales son remanentes y cuales deben eliminarse o apagarse

Implementar:

- auditar `moderationAIService.js`
- auditar `nicoBot.js`
- auditar `multiProviderAIConversation.js`
- auditar `aiUserInteraction.js`
- auditar `openAIBotService.js`
- auditar `companionAIService.js`
- auditar `useCompanionAI.js`
- auditar `useBotSystem.js`
- mapear variables de entorno reales asociadas a DeepSeek y otros providers
- revisar landing pages y FAQ donde se promete IA

Entregable:

- matriz "activo / inactivo / remanente / eliminar"

Criterio de cierre:

- no queda duda sobre que IA corre hoy en runtime

---

## Fase IA-1. Normalizar postura de producto sobre IA

Estado: pendiente  
Prioridad: critica

Objetivo:

- alinear codigo, documentacion y copy publico

Implementar:

- eliminar copy exagerado si no esta soportado
- dejar una postura clara:
  - IA de apoyo de seguridad
  - revision humana cuando corresponda
  - no bots falsos de sala
- renombrar concepto operativo a `Chactivo Assistant` si se va a exponer alguna funcion futura

Postura temporal aprobada:

- la IA operara primero desde frontend
- no por comodidad tecnica, sino por restriccion economica
- debe usarse en eventos selectivos y no como capa permanente en todo el producto

Entregable:

- copy consistente en lobby, FAQ, landings y politica

Criterio de cierre:

- marketing y producto no prometen mas de lo que el sistema realmente hace

---

## Fase IA-2. Moderacion hibrida barata primero

Estado: pendiente  
Prioridad: critica

Objetivo:

- crear una capa util de seguridad sin llamar IA en cada mensaje

Modelo:

- capa 1: reglas deterministicas locales o backend
- capa 2: IA solo si el mensaje cae en "ambiguo pero riesgoso"
- capa 3: staff revisa casos altos

Implementar:

- motor local de scoring de riesgo por palabras, patrones y contexto
- categorias iniciales:
  - menor de edad
  - odio
  - violencia
  - drogas
  - extraccion a canales externos
  - acoso/coercion
- estados de salida:
  - permitir
  - advertir
  - bloquear
  - alertar staff
  - enviar a IA

IA en esta fase:

- DeepSeek solo para casos que superen umbral y no esten claros con reglas
- mientras siga la etapa frontend-first, limitar frecuencia y payload enviado

Criterio de costo:

- no mas de un porcentaje pequeno de mensajes totales debe ir a IA

Criterio de cierre:

- panel admin ve alertas utiles
- se reducen falsos negativos graves
- no explota el costo

---

## Fase IA-3. Alarmas de alto riesgo en tiempo casi real

Estado: pendiente  
Prioridad: alta

Objetivo:

- detectar rapido casos sensibles sin convertir toda la plataforma en un pipeline caro

Triggers candidatos:

- declaracion explicita de ser menor
- frase evasiva con patron de menor
- combinacion droga + encuentro
- amenaza o violencia
- intento repetido de sacar usuarios afuera

Implementar:

- cola o servicio de evaluacion selectiva
- registro de incidentes con severidad
- accion automatica limitada:
  - mute temporal
  - ocultamiento provisional
  - alerta staff

No implementar todavia:

- baneo automatico irreversible por IA sola

Criterio de cierre:

- alarmas utiles con baja tasa de ruido

---

## Fase IA-4. Chactivo Assistant para onboarding

Estado: pendiente  
Prioridad: alta

Objetivo:

- usar IA para guiar mejor a usuarios reales sin fingir personas ni poblar la sala

Rol de `Chactivo Assistant`:

- explicar como funciona el sistema
- orientar al usuario nuevo
- ayudar a elegir sala o flujo
- recordar normas
- sugerir acciones seguras

No debe:

- hablar como usuario humano comun
- simular interes sexual
- empujar conversaciones falsas

Version inicial recomendada:

- no conversacional libre
- respuestas guiadas por intents predefinidos
- fallback con arbol de decisiones antes de llamar IA

Casos iniciales:

- "como funciona"
- "como entrar al privado"
- "como encontrar gente cerca"
- "como denunciar"
- "por que me bloquearon un mensaje"

Criterio de cierre:

- menor confusion de usuarios nuevos
- menor repeticion de preguntas basicas en la sala

---

## Fase IA-5. Clasificacion de intencion y matching asistido

Estado: pendiente  
Prioridad: media-alta

Objetivo:

- ayudar a ordenar la demanda real del chat

Intenciones iniciales:

- saludo/presencia
- busqueda por comuna
- busqueda por rol
- encuentro ahora
- charla/morbo
- foto o multimedia
- usuario nuevo/desorientado

Implementar:

- clasificador ligero de intencion
- combinacion con comuna y rol
- sugerencias de:
  - personas activas
  - canales o zonas
  - acciones de producto

Uso de IA:

- opcional y solo donde reglas simples no alcancen

Resultado esperado:

- menos ruido
- mas precision
- mejor matching sin matar la sala principal

---

## Fase IA-6. Herramientas IA para admin y moderacion

Estado: pendiente  
Prioridad: media

Objetivo:

- dar al staff herramientas, no carga extra

Implementar:

- resumen de incidentes por rango de tiempo
- agrupacion por patron:
  - spam
  - menores
  - drogas
  - odio
- score de prioridad para revisar
- sugerencia de accion al moderador

Importante:

- el humano toma la decision final en sanciones mayores

### Subfase IA-6A. Panel Admin de lectura del dia

Estado: pendiente  
Prioridad: alta

Objetivo:

- crear una ventana exclusiva para admin donde puedas preguntarle a la IA como vio el chat hoy, que fallo, que encontro y que deberia mejorarse

Nombre recomendado:

- `Admin AI Insights`

Preguntas objetivo:

- "como viste el chat hoy"
- "que patrones de riesgo encontraste"
- "que fallo mas en UX o producto"
- "que repeticion viste en la sala"
- "que deberiamos mejorar primero manana"
- "hubo señales de menores, drogas, odio o spam"

Diseno optimo recomendado:

- no dar acceso libre a toda la base de datos en cada pregunta
- no enviar historiales completos sin resumen previo
- no correr IA automaticamente cada pocos minutos
- ejecutar solo bajo demanda del admin o por bloque horario

Modelo de consumo recomendado:

- capa 1: construir un paquete de contexto resumido
- capa 2: enviar ese paquete a DeepSeek solo cuando el admin lo solicite
- capa 3: responder en bloques estructurados

Paquete de contexto recomendado:

- ventana temporal elegida:
  - hoy
  - ultimas 6 horas
  - ultimas 24 horas
- total de mensajes
- volumen por sala
- muestras limitadas de mensajes relevantes
- top frases repetidas
- top comunas detectadas
- top intenciones detectadas
- incidentes de moderacion
- errores tecnicos relevantes
- metricas de entrada:
  - invitados
  - primer mensaje
  - privados

Regla de costo:

- enviar solo resumenes y muestras
- nunca pasar el historial completo si no hace falta
- truncar por bloques y tokens maximos
- paginar por secciones si el admin pide mas detalle

Formato de respuesta recomendado:

- `estado general`
- `riesgos detectados`
- `fallos de producto o UX`
- `patrones repetidos`
- `que mejorar primero`
- `prioridad alta / media / baja`

Modo de respuesta:

- respuesta por bloques cortos y concretos
- si el contexto es grande, dividir en:
  - bloque 1: resumen ejecutivo
  - bloque 2: riesgos
  - bloque 3: oportunidades
  - bloque 4: acciones sugeridas

No debe hacer:

- responder con texto largo sin estructura
- inventar conclusiones sin evidencia del bloque enviado
- escanear toda la base de datos en tiempo real para cada consulta
- actuar automaticamente sobre usuarios desde este panel

Version 1 recomendada:

- boton "analizar hoy"
- boton "analizar ultimas 6 horas"
- boton "analizar 24 horas"
- caja de pregunta libre para admin
- respuesta renderizada en tarjetas o secciones

Criterio de cierre:

- el admin obtiene un resumen util del chat sin costo excesivo
- la respuesta sale en bloques entendibles
- la herramienta no depende de leer toda la base cada vez

---

## Fase IA-7. Medicion, kill switches y presupuesto

Estado: pendiente  
Prioridad: critica

Objetivo:

- que la IA no quede fuera de control ni tecnica ni economicamente

Implementar:

- feature flags por modulo IA
- limite diario de llamadas IA
- limite por usuario
- limite por tipo de evento
- logging de:
  - llamadas
  - costo estimado
  - precision percibida
  - falsos positivos
  - falsos negativos reportados
- apagado rapido desde admin o config

Criterio de cierre:

- cualquier modulo IA puede pausarse sin romper la app

---

## 6. Orden recomendado de ejecucion

Orden aprobado para esta nueva etapa:

1. cerrar backlog tecnico no-IA critico
2. ejecutar IA-0
3. ejecutar IA-1
4. ejecutar IA-2
5. probar en entorno limitado
6. ejecutar IA-3
7. ejecutar IA-4
8. medir
9. ejecutar IA-5
10. ejecutar IA-6
11. consolidar IA-7

Razon:

- no tiene sentido meter IA encima de una base no desplegada o no verificada
- el primer valor real de IA esta en moderacion selectiva y onboarding, no en bots de conversacion

---

## 7. Checklist de implementacion inmediata

### 7.1 Antes de tocar IA

- [ ] desplegar frontend, rules y storage pendientes
- [ ] ejecutar backfill de perfiles publicos
- [ ] correr pruebas S7
- [ ] activar monitoreo basico S8
- [ ] revisar copy publico donde se promete IA

### 7.2 Primer sprint IA recomendado

- [ ] auditar servicios IA existentes
- [ ] listar variables de entorno usadas por IA
- [ ] confirmar si DeepSeek sera provider principal
- [ ] apagar o marcar remanentes de bots conversacionales
- [ ] definir eventos exactos que SI pueden invocar IA
- [ ] definir eventos que JAMAS deben invocar IA

### 7.3 Segundo sprint IA recomendado

- [ ] scoring local de riesgo
- [ ] cola de evaluacion selectiva
- [ ] primera integracion DeepSeek solo para mensajes ambiguos de alto riesgo
- [ ] registro admin de alertas
- [ ] metricas de precision y costo

### 7.4 Sprint panel admin IA recomendado

- [ ] definir fuentes de contexto resumido para admin
- [ ] diseñar `Admin AI Insights`
- [ ] crear modo "analizar hoy" por bloque temporal
- [ ] crear formato de respuesta por secciones
- [ ] limitar tokens y tamano del contexto
- [ ] medir costo por consulta
- [ ] agregar boton de "ver mas detalle" solo si el admin lo pide

---

## 8. Eventos que SI podrian usar IA

- mensaje con riesgo ambiguo de menor
- mensaje con riesgo ambiguo de odio o violencia
- mensaje con riesgo ambiguo de drogas/coercion
- usuario nuevo pidiendo ayuda u orientacion
- clasificacion de intencion para sugerencia de UX
- resumen admin de incidentes
- analisis admin del chat por bloque temporal y resumen controlado

## 9. Eventos que NO deben usar IA por ahora

- cada mensaje normal de sala
- cada refresh de presencia
- cada apertura de pagina
- cada carga de historial
- cada notificacion comun
- cada accion menor de UI
- respuestas automaticas teatrales en sala publica

---

## 10. Riesgos a vigilar

- costo oculto por llamadas excesivas
- falsos positivos que maten conversion
- promesas publicas de IA no soportadas
- llaves en frontend
- dependencia de IA para flujos esenciales
- confusion del usuario si `Chactivo Assistant` parece un humano mas

---

## 11. Definicion de exito

La estrategia queda bien si logra esto:

- mas seguridad sin multiplicar costo
- menos menores, odio, drogas y spam en sala
- mejor onboarding y menos confusion
- mejor orden de intenciones y matching
- cero necesidad de bots falsos para "dar vida"

---

## 12. Siguiente paso operativo

Usar este documento como backlog base y ejecutar primero:

1. auditoria IA real del codigo
2. limpieza de remanentes
3. definicion de triggers permitidos
4. primera fase de moderacion hibrida selectiva con DeepSeek

Ese sera el punto de partida correcto para implementar IA con control.
