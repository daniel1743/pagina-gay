# Plan de Endurecimiento de Seguridad Chactivo

**Fecha:** 2026-04-09  
**Estado:** aprobado para ejecucion por fases  
**Objetivo principal:** cerrar vulnerabilidades criticas sin romper la experiencia central de conexion  
**Principio rector:** proteger usuarios, datos y costos sin convertir el chat en un flujo pesado

---

## 1. Veredicto inicial

El sistema **no debe endurecerse con un cierre bruto**.

La decision correcta no es:

- bloquear todo
- matar invitados
- convertir el chat en registro obligatorio pesado

La decision correcta es:

- mantener la experiencia de entrada rapida
- conservar invitados como concepto
- mover permisos sensibles fuera del alcance del cliente
- exigir ownership real donde hoy solo se exige autenticacion

En una frase:

**Chactivo debe pasar de "abierto y confiado" a "agil pero controlado".**

---

## 2. Lo que se busca proteger

### 2.1 Datos

- email
- telefono
- edad
- comuna
- tokens push
- estados internos de usuario

### 2.2 Superficies de abuso

- creacion de notificaciones
- escritura anonima en sala principal
- subida y borrado de media
- muteos y alertas de moderacion
- analytics manipulables
- inflado artificial de interacciones

### 2.3 Experiencia que no se debe romper

- entrar rapido al chat
- escribir como invitado controlado
- recibir notificaciones reales
- subir imagen propia
- abrir privado real
- ver perfiles publicos y tarjetas

---

## 3. Regla de producto para esta fase

### 3.1 Lo que se mantiene

- invitados pueden seguir entrando
- invitados pueden seguir escribiendo
- usuarios reales pueden seguir enviando mensajes, privados e imagenes
- perfiles publicos siguen visibles

### 3.2 Lo que deja de permitirse

- leer datos privados de otros usuarios
- crear notificaciones arbitrarias desde cliente
- borrar media ajena
- subir media a rutas que no sean propias
- escribir sin identidad temporal controlada
- mutear o alertar arbitrariamente sin ownership o backend

### 3.3 Modelo objetivo

El modelo objetivo es este:

- `lectura publica`: solo datos publicos
- `lectura privada`: solo dueño, admin o backend
- `escritura sensible`: solo backend o flujo controlado
- `invitado`: rapido, pero con identidad temporal y limites
- `abusador`: freno, captcha, cooldown, bloqueo o rechazo

---

## 4. Riesgos actuales que este plan debe cerrar

Prioridad actual:

1. lectura global de `/users`
2. creacion arbitraria de notificaciones
3. media del chat sin ownership fuerte
4. escritura abierta o demasiado laxa en chat principal
5. rate limiting deshabilitado
6. `muted_users`, `moderation_alerts` y `analytics_stats` demasiado abiertos
7. inflado de interacciones en tarjetas

---

## 5. Plan por fases

El plan se ejecutara en `8` fases.

## S0. Congelacion y respaldo

### Objetivo

Congelar estado actual antes de endurecer permisos.

### Trabajo aprobado

- respaldar `firestore.rules`
- respaldar `storage.rules`
- respaldar `functions/index.js`
- dejar checklist de rollback
- dejar lista de flujos criticos a probar

### Resultado esperado

- endurecer con control
- poder volver atras si una regla rompe UX real

### Impacto en usuarios

- ninguno

---

## S1. Separacion de datos publicos y privados de usuario

### Objetivo

Evitar que cualquier usuario autenticado lea informacion privada de otros usuarios.

### Trabajo aprobado

- cerrar lectura global de `/users/{userId}`
- definir subconjunto publico minimo visible
- mover o exponer de forma controlada solo:
  - `username`
  - avatar
  - edad visible si aplica
  - ciudad/comuna publica si aplica
  - banderas visuales necesarias
- mantener privados fuera del acceso general:
  - `email`
  - `phone`
  - `fcmTokens`
  - preferencias push
  - estados internos

### Archivos objetivo

- `firestore.rules`
- `src/services/userService.js`
- cualquier servicio o consulta que hoy lea directamente `/users`

### Resultado esperado

- privacidad real entre usuarios
- misma experiencia visual publica

### Impacto en usuarios sanos

- no deberian notar cambio visible en el chat
- solo dejaran de tener acceso tecnico a datos que nunca debieron ver

---

## S2. Notificaciones solo desde backend o flujos controlados

### Objetivo

Eliminar la capacidad del cliente de crear notificaciones arbitrarias en la cuenta de otro usuario.

### Trabajo aprobado

- cerrar `create` abierto en `/users/{userId}/notifications/{notificationId}`
- mover creacion de notificaciones a:
  - Cloud Functions
  - triggers del sistema
  - endpoints o llamadas controladas
- dejar permitido al cliente solo leer sus propias notificaciones y actualizar estado local seguro si aplica

### Archivos objetivo

- `firestore.rules`
- `functions/index.js`
- servicios de privados, mensajes directos, comentarios y OPIN que disparen notificaciones

### Resultado esperado

- no mas push falsos desde cliente
- notificaciones reales siguen funcionando

### Impacto en usuarios sanos

- no deberian notar cambio funcional
- siguen recibiendo notificaciones legitimas

---

## S3. Ownership real en media del chat

### Objetivo

Permitir subir y borrar solo media propia o media administrada por backend.

### Trabajo aprobado

- endurecer `storage.rules` para que la ruta de media quede ligada al autor
- impedir borrado por terceros
- mantener limite de tamano y tipo
- opcional:
  - ruta estandar con `uid`
  - borrado por Cloud Function cuando corresponda

### Archivos objetivo

- `storage.rules`
- servicios de upload de imagenes del chat
- funciones de cleanup si aplica

### Resultado esperado

- menos vandalismo
- menos abuso de storage

### Impacto en usuarios sanos

- siguen subiendo imagenes
- solo dejan de poder tocar archivos ajenos

---

## S4. Invitado controlado sin romper entrada rapida

### Objetivo

Mantener invitados, pero con identidad temporal controlada y no como escritura totalmente suelta.

### Trabajo aprobado

- mantener concepto de invitado
- exigir identidad temporal consistente antes de escribir:
  - sesion guest real
  - `uid` temporal
  - nickname temporal
- revisar si la escritura no autenticada pura debe eliminarse
- preferir:
  - invitado rapido autenticado anonimamente
  - no invitado totalmente libre

### Archivos objetivo

- `firestore.rules`
- `src/contexts/AuthContext.jsx`
- modal o flujo de entrada invitado
- servicios del chat principal

### Resultado esperado

- entrada sigue siendo rapida
- menos abuso automatizado
- mejor trazabilidad tecnica

### Impacto en usuarios sanos

- pueden seguir entrando como invitados
- posible friccion nueva minima:
  - elegir nickname
  - obtener sesion guest antes del primer mensaje

### Decision de UX aprobada

No se implementara registro pesado obligatorio en esta fase.

---

## S5. Rate limit real y freno de abuso

### Objetivo

Evitar flood, repeticion y automatizacion simple sin castigar conversacion normal.

### Trabajo aprobado

- reactivar `rateLimitService`
- agregar limites por:
  - usuario
  - invitado
  - sala
  - repeticion de contenido
- cooldown corto
- opcional:
  - captcha o challenge solo en comportamiento sospechoso

### Archivos objetivo

- `src/services/rateLimitService.js`
- reglas o backend complementario si hace falta
- flujo del chat principal

### Resultado esperado

- el usuario normal casi no lo nota
- el spammer si lo nota

### Impacto en usuarios sanos

- pequena restriccion solo si escriben demasiado rapido
- no deberia afectar conversacion humana normal

---

## S6. Cierre de colecciones sensibles mal expuestas

### Objetivo

Cerrar colecciones que hoy permiten manipulacion innecesaria desde cliente.

### Trabajo aprobado

- restringir `muted_users`
- restringir `moderation_alerts`
- restringir `analytics_stats`
- revisar `tarjetas` para que interacciones no puedan inflarse libremente

### Archivos objetivo

- `firestore.rules`
- servicios de moderacion
- servicios de analytics
- servicios de tarjetas / baul

### Resultado esperado

- menos envenenamiento de paneles y datos
- menos capacidad de sabotaje interno

### Impacto en usuarios sanos

- practicamente ninguno visible
- el cambio es de permiso interno, no de experiencia central

---

## S7. Verificacion funcional y despliegue por capas

### Objetivo

Verificar que el endurecimiento no rompa chat, invitados, privados, imagenes ni notificaciones.

### Trabajo aprobado

- pruebas manuales con:
  - invitado nuevo
  - usuario autenticado normal
  - envio de mensaje
  - envio de imagen
  - privado
  - notificacion
  - perfil
- pruebas negativas:
  - intento de leer datos ajenos
  - intento de notificar a otro desde cliente
  - intento de borrar media ajena
  - flood rapido

### Resultado esperado

- deploy seguro
- endurecimiento sin regresion grave

### Impacto en usuarios

- ninguno si se hace bien

---

## S8. Monitoreo post-hardening

### Objetivo

Medir si la seguridad mejoro sin matar conversion ni actividad.

### Trabajo aprobado

- medir:
  - mensajes enviados por invitados
  - conversion de landing a primer mensaje
  - errores de permisos
  - intentos bloqueados
  - volumen de spam
  - tasa de privados
- revisar si hizo falta demasiada friccion
- ajustar thresholds y no filosofia

### Resultado esperado

- seguridad con calibracion fina

---

## 6. Orden correcto de ejecucion

Orden aprobado:

1. `S0`
2. `S1`
3. `S2`
4. `S3`
5. `S4`
6. `S5`
7. `S6`
8. `S7`
9. `S8`

Razon:

- primero cerrar fuga de datos
- despues cerrar push falsos
- luego cerrar media
- despues endurecer invitados sin romper UX
- luego meter freno de abuso
- finalmente verificar y calibrar

---

## 7. Flujos que no deben romperse

Checklist obligatorio:

- entrar desde home y llegar al chat
- entrar como invitado y enviar primer mensaje
- usuario autenticado enviar mensaje normal
- abrir privado
- recibir notificacion legitima
- subir imagen propia
- ver perfiles publicos
- ver tarjetas publicas

Si alguno de estos flujos se rompe, la fase no se considera cerrada.

---

## 8. Restricciones nuevas aceptables para usuarios sanos

Se consideran aceptables:

- invitado con identidad temporal antes de escribir
- cooldown corto anti flood
- captcha solo si el comportamiento parece abusivo
- no poder leer datos privados de otros
- no poder borrar archivos ajenos
- no poder generar notificaciones arbitrarias

No se considera aceptable en esta fase:

- obligar registro completo para hablar
- impedir invitados por defecto
- romper privados
- romper imagenes normales
- meter friccion alta antes del primer mensaje

---

## 9. Resultado esperado al terminar

Se espera:

- menos superficie de ataque
- menos riesgo de fuga de datos
- menos spam y sabotaje
- menos costo por abuso
- misma experiencia base de conexion
- invitados todavia funcionales
- backend con permisos mas defendibles

No se espera:

- seguridad absoluta
- cero abuso
- cero spam al instante

Si se espera:

- pasar de un estado vulnerable a un estado razonablemente defendible

---

## 10. Criterio de cierre

Este plan se considera correctamente ejecutado cuando:

- un usuario normal puede seguir entrando y chateando
- un invitado puede seguir iniciar conversacion con friccion minima
- un usuario no puede leer informacion privada ajena
- un cliente no puede crear push falsos
- un usuario no puede borrar media ajena
- el flood rapido queda controlado
- moderacion y analytics dejan de estar expuestos a manipulacion simple

---

## 11. Archivo de implementacion previsto

Cuando se complete `S0 + S1 + S2 + S3 + S4 + S5 + S6 + S7 + S8`, se debera crear un documento de cierre con:

- implementacion total realizada
- archivos tocados
- reglas endurecidas
- impacto UX real observado
- cambios descartados
- checklist de pruebas
- resultado post deploy

Nombre reservado para ese documento:

`documentacion_md/07-firebase-supabase-db/IMPLEMENTACION_ENDURECIMIENTO_SEGURIDAD_CHACTIVO_2026-04-09.md`

---

## 12. Veredicto final

La decision correcta no es endurecer rompiendo conversion.

La decision correcta es:

**endurecer donde hoy hay permisos abiertos y mantener la experiencia de entrada rapida para usuarios sanos.**

En sintesis:

- invitados deben seguir existiendo
- pero ya no deben operar como escritura totalmente libre
- datos privados deben dejar de estar expuestos
- acciones sensibles deben salir del cliente
- el chat debe seguir sintiendose facil

La meta no es un sistema duro.

La meta es un sistema:

**amigable para conectar, hostil para abusar**
