# Plan UI Premium Chat Chactivo V2

**Fecha:** 2026-04-13  
**Estado:** pendiente por implementar  
**Alcance:** chat principal, privados, overlays y componentes visuales adyacentes  
**Objetivo:** elevar la interfaz de chat a un nivel claramente premium, limpio y silencioso, sin perder velocidad de uso ni claridad operativa

---

## 1. Decision de direccion visual

La referencia correcta no es "hacerlo bonito".

La referencia correcta es:

- chat calmado
- jerarquia impecable
- aire visual
- microdetalle fino
- cero ruido gratuito

La mezcla objetivo sera:

- estructura y disciplina de Telegram
- control de detalle tipo Apple
- espaciado y limpieza tipo Stripe
- sobriedad funcional tipo Notion

En una frase:

**Chactivo debe verse menos "chat custom" y mas "producto premium serio".**

---

## 2. Lo que premium significa aqui

Premium no significa:

- mas colores
- mas decoracion
- mas chips
- mas sombras
- mas iconos
- mas elementos visibles al mismo tiempo

Premium si significa:

- menos elementos, mejor resueltos
- mejor espaciado
- mejor contraste
- mejor orden visual
- mejor densidad
- mejor consistencia entre estados

Regla maestra:

**si algo compite con el mensaje principal, sobra o debe bajar de jerarquia**

---

## 3. Problemas actuales que este plan corrige

### 3.1 Ruido visual

- demasiados chips o elementos secundarios pueden convivir junto al mensaje
- algunas acciones y ayudas visuales compiten con la conversacion
- ciertos bordes y fondos todavia se sienten mas "custom app" que "producto premium"

### 3.2 Densidad inconsistente

- algunas zonas del chat tienen buen aire y otras se sienten apretadas
- respuestas rapidas y acciones contextuales pueden comprimir el contenido
- privados, overlays y paneles no siempre comparten el mismo lenguaje visual

### 3.3 Jerarquia mejorable

- el ojo no siempre identifica de inmediato:
  - contenido principal
  - metadata
  - accion
  - estado

### 3.4 Sensacion visual no unificada

- hay componentes bien resueltos y otros mas utilitarios
- falta una sola disciplina visual transversal para:
  - header
  - burbujas
  - input
  - menus
  - listas
  - cards de sistema

---

## 4. Direccion visual aprobada

### 4.1 Sensacion buscada

- precisa
- ligera
- silenciosa
- moderna
- premium sin arrogancia
- elegante sin verse vacia

### 4.2 Sensacion que se debe evitar

- gamer
- neon agresivo
- demasiado "social network"
- demasiado "dashboard"
- demasiado "template de chat"

### 4.3 Regla de composicion

Cada pantalla debe poder leerse en 3 capas:

1. estructura
2. contenido
3. accion

Si accion o decoracion invade contenido, la UI deja de sentirse premium.

---

## 5. Sistema visual simplificado

Este documento reemplaza una especificacion demasiado larga por un sistema mas ejecutable.

### 5.1 Tipografia

Implementacion recomendada:

- primaria: `Inter`
- fallback: `system-ui`, `sans-serif`

Decision:

- `SF Pro` queda como referencia de sensacion, no como dependencia obligatoria

Escala base:

- titulo de pantalla: `22/28`, peso `600`
- titulo de chat: `17/22`, peso `600`
- subtitulo/estado: `12/16`, peso `500`
- texto base: `15/22`, peso `400`
- mensaje propio: `15/22`, peso `500`
- mensaje ajeno: `15/22`, peso `400`
- metadata: `11/14`, peso `500`

Reglas:

- maximo 4 tamanos activos por pantalla
- no abusar de `700`
- tracking sutil solo en titulos o labels cortos

### 5.2 Color

Paleta base aprobada:

- fondo app: `#F6F7F9`
- superficie principal: `#FFFFFF`
- superficie secundaria: `#F2F4F7`
- borde principal: `rgba(17,24,39,0.06)`
- borde sutil: `rgba(17,24,39,0.04)`
- texto principal: `#111827`
- texto secundario: `#6B7280`
- texto terciario: `#9CA3AF`
- acento unico: `#1473E6`
- acento hover: `#0F67D8`
- exito: `#18A957`
- alerta: `#F59E0B`
- error: `#EF4444`

Reglas:

- un solo color protagonista por pantalla
- neutros dominan
- no usar varios acentos compitiendo entre si
- el color fuerte debe aparecer solo donde hay accion o estado relevante

### 5.3 Radios

Escala unica:

- `12px`: items pequenos y menus
- `18px`: burbujas, cards medianas
- `24px`: overlays, superficies grandes, modal
- `999px`: pills

Regla:

- no inventar radios intermedios salvo justificacion clara

### 5.4 Bordes

- grosor visual objetivo: `0.5px` a `1px`
- color: `rgba(17,24,39,0.06)` o menos

Regla:

- si el borde se nota antes que el contenido, esta demasiado fuerte

### 5.5 Sombras

Uso aprobado:

- cards: casi invisibles
- input: suave
- modal/menu: un poco mas presentes, pero limpias

Regla:

- las sombras deben sentirse, no verse

---

## 6. Reglas no negociables de premium real

### 6.1 Mensajes mandan

- nada debe comprimir la burbuja
- nada debe tapar el input
- ninguna accion secundaria debe ocupar ancho critico del mensaje

### 6.2 Maximo de elementos por bloque

Por fila principal de mensaje solo pueden convivir:

- avatar
- nombre o identidad
- mensaje
- metadata discreta

No debe convivir todo a la vez:

- 3 chips
- 2 iconos
- badge
- label
- accion

### 6.3 Las ayudas viven abajo o afuera

Respuestas rapidas, ayudas de contexto y acciones derivadas deben:

- ir debajo de la burbuja
- o en overlay/hover
- o en tray contextual

Nunca deben achicar el contenido central.

### 6.4 Los estados deben ser discretos

- online: punto pequeno + texto fino
- escribiendo: texto liviano
- enviado/entregado/leido: microiconos
- error: corto, claro, no estridente

### 6.5 Lo importante no va en texto plano

Mensajes de sistema, seguridad, codigos o instrucciones relevantes deben vivir en:

- cards
- bloques
- modulos visuales

No en parrafos largos incrustados como si fueran un mensaje comun.

---

## 7. Componentes objetivo

## C1. Header del chat

Objetivo:

- parecer liviano
- dar contexto sin robar foco

Debe tener:

- fondo tipo vidrio muy sutil
- blur elegante
- borde inferior casi invisible
- iconos finos y pocos
- avatar bien contenido

No debe tener:

- demasiados botones visibles
- iconos gruesos
- labels innecesarios

## C2. Burbujas

Objetivo:

- limpias
- suaves
- legibles
- con mejor aire interno

Decisiones:

- propias: color acento controlado
- ajenas: gris-perla muy fino
- metadata mas silenciosa
- reply preview en bloque elegante, no pesado

## C3. Input bar

Objetivo:

- convertirse en una pieza premium evidente
- compacta pero respirada

Debe sentirse:

- flotante
- limpia
- centrada
- tactil

No debe sentirse:

- barra pesada
- toolbox recargada
- caja dura con demasiados bordes

## C4. Menus y overlays

Objetivo:

- parecer laminas premium
- no cajas duras

Debe haber:

- fondo solido translúcido
- blur fino
- sombra cuidada
- radios consistentes
- spacing limpio

## C5. Cards de sistema

Objetivo:

- elevar seguridad, codigos y alertas a bloques premium

Uso:

- codigos de acceso
- alertas importantes
- mensajes de seguridad
- acciones administrativas o del sistema

## C6. Listas y bandejas

Objetivo:

- hacer que privados, notificaciones y chat list se sientan premium y escaneables

Reglas:

- menos separadores
- mas aire
- mejor preview
- unread badge mas limpio
- item activo mas sutil

---

## 8. Reglas especificas para movil

Movil decide la verdad del premium.

Si en movil se comprime, se rompe o se siente apretado, no es premium.

Reglas:

- la burbuja siempre tiene prioridad sobre acciones
- respuestas rapidas en scroll horizontal si no caben
- ningun overlay invade el input
- header y input deben coexistir con teclado sin saltos bruscos
- los touch targets no pueden bajar de `44px`

---

## 9. Reglas especificas para acciones y chips

Las respuestas rapidas y chips contextuales deben obedecer esto:

- maximo 4 acciones visibles
- si no caben, scroll horizontal suave
- visualmente secundarias al mensaje
- mismo alto
- mismo radio
- sin competir con el CTA principal

Regla:

**si una accion rapida se ve mas importante que el mensaje, esta mal**

---

## 10. Microinteracciones aprobadas

Permitidas:

- entrada suave de mensaje
- hover discreto en iconos
- boton con escala minima al click
- highlight leve al recibir mensaje nuevo
- feedback corto al copiar o completar accion

No permitidas:

- rebotes fuertes
- brillos excesivos
- animaciones largas
- parpadeos

---

## 11. Fases de implementacion

## Fase 1. Base visual

Objetivo:

- establecer el lenguaje premium comun

Trabajo:

- unificar tipografia real
- ajustar paleta base
- bajar peso de bordes
- fijar radios oficiales
- fijar sombras oficiales

Archivos probables:

- tokens CSS globales
- layout del chat
- temas base

## Fase 2. Chat core

Objetivo:

- hacer premium lo que mas se ve

Trabajo:

- rediseñar header
- refinar burbujas
- refinar metadata
- mejorar input bar
- limpiar acciones contextuales

Archivos probables:

- `src/components/chat/ChatMessages.jsx`
- `src/components/chat/ChatMessages.css`
- componentes de input del chat
- layout principal de chat

## Fase 3. Superficies auxiliares

Objetivo:

- que lo premium no se rompa fuera del mensaje

Trabajo:

- bandeja de privados
- notificaciones
- menus contextuales
- modales
- overlays

## Fase 4. Sistema premium completo

Objetivo:

- elevar seguridad y sistema a modulo visual serio

Trabajo:

- cards de sistema
- cards de seguridad
- estados de error/exito
- perfiles y listas refinadas

## Fase 5. Pulido final

Objetivo:

- coherencia total

Trabajo:

- revisar consistencia de iconos
- revisar contraste
- revisar densidad movil
- revisar microinteracciones
- test visual completo

---

## 12. Criterios de aceptacion

Este plan solo se considera bien implementado si:

- el chat se ve mas limpio sin perder claridad
- el input se siente mejor que antes
- las burbujas se leen mejor
- las acciones ya no comprimen mensajes
- overlays y menus se ven de la misma familia visual
- los mensajes de sistema destacan mejor
- movil se siente mejor, no solo desktop

---

## 13. Checklist de revision visual

- el mensaje sigue siendo el protagonista
- el header no roba foco
- el input no se siente pesado
- los bordes casi desaparecen
- las sombras no llaman la atencion
- no hay dos acentos compitiendo
- los iconos tienen el mismo grosor visual
- los estados se entienden sin meter ruido
- las cards de sistema se distinguen del chat normal
- la interfaz se siente mas cara, no mas cargada

---

## 14. Veredicto final

La mejora premium correcta no consiste en decorar mas.

Consiste en:

- quitar ruido
- ordenar mejor
- usar mejor el espacio
- bajar agresividad visual
- subir precision y consistencia

La meta no es que Chactivo se vea "bonito".

La meta es que se vea:

**silencioso, preciso, moderno y claramente mejor resuelto que un chat improvisado**

