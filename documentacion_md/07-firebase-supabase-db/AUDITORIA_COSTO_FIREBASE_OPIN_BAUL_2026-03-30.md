# Auditoría Costo Firebase: OPIN y Baúl (30-03-2026)

## Veredicto ejecutivo

### OPIN

`OPIN` está **bastante más alineado** con un modo ahorro que el chat en tiempo real.

No depende de listeners permanentes para el feed principal.
Su costo existe, pero hoy es más de:

- lecturas puntuales
- escrituras por interacción
- consultas por comentarios

que de suscripción continua.

Conclusión:

- `OPIN`: **aceptable con observaciones**

### Baúl

`Baúl` **no está dentro de un estándar estricto de ahorro**.

No porque tenga demasiados listeners, sino porque usa patrones caros de lectura y enriquecimiento:

- carga masiva de tarjetas
- consultas repetidas por tarjeta
- validaciones N+1
- actividad enriquecida con múltiples `getDoc`

Conclusión:

- `Baúl`: **sí se escapó del modo ahorro**

---

## Dictamen resumido

- `OPIN`: riesgo medio
- `Baúl`: riesgo alto

---

## OPIN: análisis de costo

## Lo bueno

### 1. No usa `onSnapshot` para el feed principal

El feed se carga por lectura puntual en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L280).

Eso es mucho más barato que mantener tiempo real abierto.

### 2. El flujo principal está basado en acciones puntuales

Las operaciones centrales son:

- crear post en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L203)
- leer feed en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L280)
- comentar en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L817)
- leer comentarios en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L921)

Eso hace que el costo crezca por uso real, no por permanencia pasiva.

---

## Lo malo

### 1. El feed lee demasiado para una pantalla pública

`getOpinFeed()` pide hasta `200` documentos y luego mezcla en cliente en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L280).

Eso no es catastrófico, pero sí es caro para:

- una visita casual
- tráfico SEO
- usuarios invitados
- sesiones repetidas

Riesgo:

- costo de lectura innecesario por sesión

### 2. Cada vista de tarjeta escribe

`incrementViewCount()` hace `updateDoc + increment(1)` por post visto en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L343), disparado desde el `IntersectionObserver` de [src/components/opin/OpinCard.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/opin/OpinCard.jsx#L87).

Esto significa:

- scrollear el feed también genera writes

No es un desastre, pero sí puede pegar si el feed tiene volumen.

### 3. Comentar es relativamente caro

`addComment()` hace varias operaciones:

- `getDoc` del post
- `getDocs` para contar comentarios
- `getDoc` del usuario
- `addDoc` del comentario
- `updateDoc` del post
- `addDoc` de notificación

Todo eso en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L817).

No es incorrecto, pero sí es una ruta de escritura más pesada que una simple respuesta.

### 4. El preview de respuestas añade lecturas extra

`getReplyPreview()` hace lecturas adicionales cuando el usuario despliega comentarios en [src/services/opinService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/opinService.js#L1214).

Esto es razonable.
No lo marco como fuga principal.

---

## Veredicto OPIN

`OPIN` **no parece haberse escapado gravemente** de los parámetros de ahorro.

Pero sí tiene dos puntos a vigilar:

- feed demasiado grande por carga
- write por vista de tarjeta

### Prioridad sugerida para OPIN

#### P1

- bajar `getOpinFeed()` de 200 a algo como 60-80
- evaluar muestreo de `viewCount` en vez de write 1:1

#### P2

- cachear mejor comentarios y previews
- separar mejor tráfico invitado del tráfico autenticado

---

## Baúl: análisis de costo

## Problema principal

`Baúl` tiene costo alto no por realtime masivo, sino por arquitectura de lectura.

La pantalla intenta construir mucha inteligencia en cliente a base de:

- traer demasiadas tarjetas
- enriquecer demasiado cada resultado
- verificar estado por tarjeta una por una

Eso es lo que rompe el modo ahorro.

---

## Hallazgos críticos

### 1. Carga masiva de tarjetas

`obtenerTarjetasCercanas()` y `obtenerTarjetasRecientes()` hacen una estrategia dual:

- query ordenada
- query completa adicional con `limit(2000)`

en:

- [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L391)
- [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L531)

Esto sí es costoso.

Especialmente porque después el componente solo usa alrededor de `50`.

Conclusión:

- este es el mayor problema de costo en Baúl

### 2. N+1 reads por like/huella en primeras tarjetas

En [src/components/baul/BaulSection.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/baul/BaulSection.jsx#L252) se toma `primeras20`, y luego:

- para cada una se llama `yaLeDiLike()`
- para cada una se llama `yaDejeHuella()`

Esas funciones a su vez hacen `getDoc` en:

- [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L956)
- [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L1214)

Resultado práctico:

- abrir Baúl puede disparar decenas de lecturas extra solo para pintar estados de UI

### 3. Registrar impresión es caro por tarjeta

`registrarImpresion()` hace:

- `getDoc`
- luego `updateDoc`

por tarjeta vista en [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L1086).

Esto es especialmente delicado porque el scroll del grid puede generar mucha actividad.

### 4. ActividadFeed enriquece con demasiadas lecturas

`ActividadFeed` carga actividad y luego por cada item hace:

- `obtenerTarjeta()`
- `yaLeDiLike()`

en [src/components/baul/ActividadFeed.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/baul/ActividadFeed.jsx#L286).

Eso es otro patrón N+1.

### 5. Métricas de tarjeta también agregan costo

`obtenerMetricasTarjeta()` combina:

- `getDoc` de tarjeta
- `getDocs` de actividad

en [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L1322).

No es la peor ruta, pero suma.

### 6. Promo card consulta conteos con polling

`BaulPromoCard` consulta:

- online
- recientes

y en la versión compacta refresca cada `30s` en [src/components/baul/BaulPromoCard.jsx](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/components/baul/BaulPromoCard.jsx#L20).

Esto no es lo más caro del sistema, pero sí es gasto recurrente para una pieza promocional.

### 7. El único realtime real de Baúl está controlado

La suscripción de `suscribirseAMiTarjeta()` en [src/services/tarjetaService.js](c:/Users/Lenovo/Desktop/proyectos%20desplegados%20importante/gay%20chat/src/services/tarjetaService.js#L1415) está razonablemente contenida:

- solo una tarjeta
- solo del usuario actual

Esto no es un problema importante de costo.

---

## Veredicto Baúl

`Baúl` **sí se escapó** del espíritu de ahorro de Firebase.

No por realtime abierto.
Sí por:

- sobrelectura
- consultas amplias
- enriquecimiento N+1
- writes por scroll

Si hoy hubiera que elegir dónde optimizar primero entre `OPIN` y `Baúl`, la respuesta correcta es:

**Baúl primero, por bastante margen.**

---

## Prioridades de corrección

## P0

### 1. Eliminar query completa de 2000 tarjetas como comportamiento por defecto

Esto es lo más importante.

Objetivo:

- no traer universo completo si solo se mostrarán 50

### 2. Eliminar `yaLeDiLike()` y `yaDejeHuella()` por tarjeta

Esos estados deben resolverse:

- desde datos ya presentes en la tarjeta
- o desde batch/payload agregado
- no con `getDoc` por item

### 3. Reducir writes de impresiones

Opciones:

- muestreo
- debounce por sesión
- buffer local y flush agrupado
- o directamente dejar de escribir por cada impresión

## P1

### 4. Rehacer enriquecimiento de `ActividadFeed`

No cargar perfil por perfil en serie.

### 5. Bajar polling del promo

Pasar de `30s` a algo más barato o cacheado.

## P2

### 6. Revisar métricas derivadas y paneles secundarios

No son el gran problema, pero contribuyen al total.

---

## Conclusión final

La respuesta corta es:

- `OPIN`: **no parece haberse escapado gravemente**
- `Baúl`: **sí, se escapó**

La respuesta útil para dirección es:

si hay que proteger costo Firebase sin romper producto, el foco inmediato debe estar en `Baúl`, no en `OPIN`.

