# Plan de Implementacion Futura: OPIN + Buzon Estructural

**Fecha:** 08-04-2026  
**Estado:** plan de implementacion futura  
**Objetivo:** corregir OPIN estructuralmente en UI/UX y convertir `Buzon` en la accion principal de contacto asincronico

---

## 1. Diagnostico directo

El estado actual de `OPIN` tiene un problema de estructura visual y de producto:

- algunas tarjetas muestran acciones y badges en posiciones distintas
- las 3 tarjetas superiores y el resto del feed no se sienten parte del mismo sistema
- `Buzon` existe como idea, pero no tiene jerarquia de accion principal
- el usuario no entiende en menos de 2 segundos cual es el siguiente paso correcto

### Problema concreto detectado en la UI

- en unas tarjetas los badges quedan arriba
- en otras quedan abajo
- en otras las acciones quedan mezcladas con metadata
- no existe una grilla de lectura consistente

### Consecuencia

Esto genera:

- ruido cognitivo
- sensacion de desorden
- menor conversion
- menor claridad entre `leer`, `guardar`, `dejar nota`, `ir a privado`

---

## 2. Tesis de producto correcta

`OPIN` no debe sentirse como una mini red social.

`OPIN` debe sentirse como:

- sistema de intencion
- descubrimiento asincronico
- contacto filtrado

La accion central no debe ser reaccionar.

La accion central debe ser:

**dejar una nota de interes controlada en Buzon**

---

## 3. Decision principal

### Nombre correcto

Usar:

- `Buzon`

Evitar:

- `Muro`
- `Feed`
- `Tablon` como nombre principal de producto

`Tablon` puede seguir como referencia historica o conceptual, pero el modulo debe presentarse como:

- `OPIN`

y su accion principal de contacto debe ser:

- `Buzon`

---

## 4. Jerarquia correcta dentro de cada tarjeta

Cada tarjeta de OPIN debe tener una estructura fija.

## Orden visual obligatorio

1. estado
2. texto/intencion
3. metadata corta
4. acciones

## Layout propuesto

### Fila 1: estado

- badge de estado: `Buscando`, `Hablando`, `Pausado`, etc.
- opcional indicador de actividad nueva

### Fila 2: contenido principal

- texto de la intencion
- maximo 3 lineas visibles

### Fila 3: metadata

- usuario
- tiempo
- vistas
- interes

### Fila 4: acciones

- `Buzon`
- `Ver intencion`
- `Seguir`

### Regla de prioridad

`Buzon` debe ser el primer boton y el mas destacado.

`Ver intencion` debe ser secundario.

`Seguir` debe ser terciario.

---

## 5. Regla UX no negociable

Las acciones deben estar:

- siempre en la misma fila
- siempre en el mismo orden
- siempre con la misma jerarquia visual

No se deben mover segun:

- largo del texto
- tipo de tarjeta
- bloque superior o bloque inferior
- cantidad de metadata

### Regla tecnica

La tarjeta debe usar una estructura con:

- altura interna predecible
- `flex-col`
- bloque de acciones anclado abajo

Ejemplo conceptual:

- header fijo
- body flexible
- footer fijo

Eso elimina el problema de badges flotando en posiciones distintas.

---

## 6. Correccion estructural de UI

## P0 UI

### Objetivo

Unificar estructura visual de todas las tarjetas.

### Acciones

1. hacer que las 3 tarjetas superiores y el resto compartan la misma arquitectura base
2. usar un mismo componente visual o una misma subestructura reusable
3. fijar un contenedor de acciones abajo en todas las tarjetas
4. limitar el texto visible con `line-clamp`
5. impedir que metadata empuje acciones verticalmente

### Resultado esperado

- feed estable
- lectura rapida
- menos ruido

---

## 7. Jerarquia visual de botones

## Buzon

Debe verse como accion principal:

- fondo mas visible
- borde mas claro
- color con intencion
- label corto y fuerte

### Estilo sugerido

- `Buzon`: primario
- `Ver intencion`: secundario
- `Seguir`: ghost / terciario

### Regla

No poner `Seguir` visualmente mas fuerte que `Buzon`.

Hoy eso rompe la jerarquia real del producto.

---

## 8. Flujo correcto de Buzon

`Buzon` no debe abrir un caos de opciones.

Debe abrir una experiencia corta, clara y controlada.

## Flujo ideal

1. usuario toca `Buzon`
2. se abre mini modal o sheet pequeno
3. ve un campo simple con mensaje sugerido
4. opcionalmente elige tipo de nota
5. envia
6. el receptor recibe notificacion de Buzon

## Tipos de nota permitidos en P1

- mensaje libre corto
- interesado
- te escribo despues
- quiero conocerte
- revisa mi nota

### Importante

No abrir desde el inicio:

- WhatsApp
- Instagram
- Facebook
- TikTok

Eso debe quedar para una fase posterior o premium, porque:

- extrae al usuario fuera del producto
- rompe retencion
- sube spam
- debilita el valor de `Privados` y `Buzon`

---

## 9. Definicion correcta de Buzon

`Buzon` debe ser una bandeja asincronica interna.

No debe ser solo:

- comentario camuflado

No debe ser solo:

- atajo a redes

Debe ser:

**canal interno de primer contacto filtrado**

---

## 10. Arquitectura de producto recomendada

## P1

### Buzon minimo viable

Coleccion sugerida:

- `opin_mailbox_threads`

Campos base:

- `id`
- `opinPostId`
- `ownerUserId`
- `senderUserId`
- `status`
- `createdAt`
- `updatedAt`
- `lastMessagePreview`
- `lastMessageAt`
- `unreadByOwner`
- `unreadBySender`

Subcoleccion:

- `messages`

Campos por mensaje:

- `senderUserId`
- `text`
- `type`
- `createdAt`

### Estados del thread

- `open`
- `accepted`
- `closed`
- `blocked`

---

## 11. Notificacion correcta

Cuando alguien use `Buzon`, el receptor debe ver algo como:

- `X te dejo un mensaje en Buzon`

No:

- `nuevo comentario`

porque eso diluye el valor del sistema.

## Eventos base

- `opin_mailbox_open`
- `opin_mailbox_message_sent`
- `opin_mailbox_thread_viewed`
- `opin_mailbox_reply_sent`
- `opin_mailbox_accept_to_private`

---

## 12. Regla de migracion funcional

No mezclar `Buzon` con comentarios publicos.

### Comentarios publicos deben quedar para:

- respuesta visible
- interes abierto
- dinamica publica

### Buzon debe quedar para:

- primer contacto privado asincronico
- nota dirigida
- continuidad filtrada

---

## 13. Plan paso a paso

## Fase 0

### Solo orden visual

1. unificar layout de tarjetas superiores e inferiores
2. fijar footer de acciones
3. mover `Buzon` a posicion primaria
4. dejar `Ver intencion` como secundaria
5. dejar `Seguir` como terciaria

### Criterio de exito

- todas las tarjetas se leen igual
- todos los botones quedan alineados
- no hay badges “flotando”

## Fase 1

### Buzon UI real

1. crear modal/sheet exclusivo de `Buzon`
2. poner mensajes sugeridos cortos
3. permitir mensaje editable
4. separar completamente de comentarios publicos

### Criterio de exito

- enviar mensaje en maximo 2 pasos
- mobile first
- sin saturacion visual

## Fase 2

### Buzon backend

1. crear threads
2. crear mensajes
3. crear unread state
4. crear notificacion de entrada

### Criterio de exito

- el receptor puede volver y encontrar el mensaje
- el emisor puede continuar sin ir a privados todavia

## Fase 3

### Puente a privado

1. desde un thread de `Buzon`, permitir `Pasar a privado`
2. al aceptar, crear o abrir privado interno
3. marcar thread como `accepted`

### Criterio de exito

- `Buzon` se convierte en embudo real a `Privados`

## Fase 4

### Redes externas opcionales

Solo evaluar despues de medir:

- uso real de Buzon
- conversion a privado
- retencion

Si se habilita, hacerlo con:

- friccion controlada
- reglas premium o limite
- trazabilidad

---

## 14. Regla mobile-first

Todo el sistema de `Buzon` debe diseñarse primero para movil.

### Reglas

- botones de accion apilables si no caben
- nunca romper la tarjeta por largo del label
- modal tipo bottom sheet
- CTA principal visible con pulgar
- no usar menus pequenos dificiles de tocar

### En movil no hacer

- 4 botones iguales compitiendo
- dropdown minusculo
- chips demasiado estrechos

---

## 15. Archivos que probablemente habra que tocar

## UI

- `src/pages/OpinFeedPage.jsx`
- `src/components/opin/OpinCard.jsx`
- `src/components/opin/OpinCommentsModal.jsx`

## Servicios

- `src/services/opinService.js`
- `src/services/socialService.js`

## Nuevo modulo sugerido

- `src/components/opin/OpinMailboxModal.jsx`
- `src/services/opinMailboxService.js`

---

## 16. Criterios de calidad antes de lanzar

No lanzar si ocurre cualquiera de estas:

- `Buzon` no se distingue visualmente como accion principal
- las acciones siguen quedando en posiciones distintas entre tarjetas
- en movil el footer se rompe o salta de linea de forma caotica
- `Buzon` y comentarios publicos se sienten lo mismo
- el receptor no entiende que recibio algo diferente a un comentario

---

## 17. Veredicto ejecutivo

La correccion correcta no es agregar mas opciones.

La correccion correcta es:

1. ordenar la tarjeta
2. fijar jerarquia
3. hacer `Buzon` principal
4. separar `Buzon` de comentario publico
5. convertir `Buzon` en embudo a `Privados`

Si eso se ejecuta bien, `OPIN` deja de ser un feed raro y pasa a ser:

**sistema asincronico de intencion + contacto filtrado**

Ese es el camino correcto.

