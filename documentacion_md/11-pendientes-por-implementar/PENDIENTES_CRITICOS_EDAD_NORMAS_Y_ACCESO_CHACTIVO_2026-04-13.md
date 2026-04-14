# Pendientes Criticos - Edad, Normas y Acceso Guest

**Fecha:** 2026-04-13  
**Estado:** pendiente critico  
**Prioridad:** maxima

---

## 1. Resumen ejecutivo

Hoy Chactivo ya pide edad y aceptacion de normas en algunos modales, pero el blindaje todavia no es defendible.

El problema no es solo de UI.
El problema real es que el sistema todavia confia demasiado en `localStorage` y `sessionStorage`, y ademas conserva caminos de auto-restauracion y auto-validacion que permiten saltarse el gate de forma tecnica.

En paralelo, la deteccion de menores por moderacion funciona para casos obvios, pero sigue siendo evadible con variantes escritas para romper patrones simples.

---

## 2. Hallazgos principales

### 2.1 Evasion de edad por contenido ofuscado

La moderacion local detecta varias frases directas de menor de edad, pero sigue dependiendo de regex simples.

Ejemplos que hoy deberian endurecerse:

- `tengo 15baños`
- `tngo 15`
- `15 añitos`
- `quince`
- `1 5 años`
- `31 al reves`
- `casi 18`

Impacto:

- un menor puede intentar entrar o interactuar sin ser frenado en el primer mensaje
- el riesgo legal y reputacional sigue siendo alto

---

### 2.2 Confianza excesiva en storage local

La validacion guest depende de banderas locales como:

- `age_verified_*`
- `rules_accepted_*`
- `COMMUNITY_POLICY_STORAGE.acceptedFlag`

Esto hoy se consume desde:

- `src/utils/communityPolicyGuard.js`
- `src/contexts/AuthContext.jsx`
- `src/pages/ChatPage.jsx`
- `src/pages/ChatSecondaryPage.jsx`

Impacto:

- un usuario con conocimientos basicos puede falsear edad y aceptacion de reglas
- el sistema queda formalmente "protegido" en UI, pero no tecnicamente blindado

---

### 2.3 Autoasignacion de edad valida en ciertos flujos

Existen caminos donde la app termina guardando `18` y aceptacion de reglas en storage para no bloquear al usuario.

Esto debilita por completo el objetivo de control real.

Impacto:

- la verificacion de edad deja de ser confiable
- se puede restaurar acceso sin volver a exigir evidencia de paso por el modal correcto

---

### 2.4 Gate de normas no plenamente obligatorio en runtime

Aunque `GuestUsernameModal` y `AgeVerificationModal` piden aceptar normas, en `ChatPage` quedaron tramos comentados que ya no fuerzan el modal de reglas como gate obligatorio.

Impacto:

- la aceptacion de politicas no esta unificada
- distintas rutas de entrada pueden quedar con comportamientos inconsistentes

---

### 2.5 Multiples caminos de entrada y restauracion

El modal canonico guest ya esta mejorado, pero el sistema todavia conserva:

- restauracion de guest por storage
- accesos desde landing pages con su propia logica
- flujos secundarios que reinyectan verificacion local

Impacto:

- una ruta sana puede convivir con otra mas laxa
- el control de edad y normas no queda realmente unificado

---

## 3. Estado actual por componente

### 3.1 Bien encaminado

- `src/components/auth/GuestUsernameModal.jsx`
  ya exige nickname, edad, comuna, rol o sexo segun sala y aceptacion de normas
- `src/components/chat/AgeVerificationModal.jsx`
  tambien exige edad y aceptacion de normas

### 3.2 Debil o incongruente

- `src/pages/ChatPage.jsx`
  contiene restauraciones y auto-validaciones locales que debilitan el gate
- `src/pages/ChatSecondaryPage.jsx`
  repite el mismo problema
- `src/contexts/AuthContext.jsx`
  permite guest si `hasValidGuestCommunityAccess()` pasa, pero esa validacion depende de storage local
- `src/services/moderationAIService.js`
  detecta menores, pero aun no cierra variantes ofuscadas

---

## 4. Pendientes a implementar

## P1. Unificar el gate guest

Objetivo:

- que toda entrada guest pase por un unico flujo canonico

Trabajo:

- obligar a que toda entrada invitado use `GuestUsernameModal`
- eliminar caminos paralelos o restauraciones que permitan saltarse el modal
- revisar landings y accesos secundarios

---

## P2. Eliminar autoasignacion local de edad o reglas

Objetivo:

- impedir que la app marque sola `18` o `rules_accepted=true`

Trabajo:

- remover escrituras automaticas de edad valida en `ChatPage.jsx`
- remover escrituras automaticas en `ChatSecondaryPage.jsx`
- evitar que la restauracion local eleve privilegios sin pasar gate legitimo

---

## P3. Reforzar aceptacion real de normas

Objetivo:

- que aceptar reglas sea obligatorio y consistente

Trabajo:

- reactivar gate de normas donde hoy quedo comentado
- unificar storage y criterio de aceptacion
- dejar enlace claro a normas y politica de comunidad

---

## P4. Endurecer deteccion de menores ofuscados

Objetivo:

- detectar variantes que hoy rompen regex simples

Trabajo:

- ampliar patrones locales de menor
- normalizar texto antes del analisis
- contemplar numeros pegados a palabras
- contemplar edades escritas de forma ambigua o evasiva
- escalar a alerta fuerte si hay sospecha de menor

---

## P5. Verificacion funcional negativa

Objetivo:

- demostrar que ya no se evade facil

Pruebas minimas:

- intentar entrar sin edad
- intentar entrar con edad menor a 18
- intentar manipular `localStorage` para forzar acceso
- intentar mandar mensajes tipo `tengo 15baños`
- intentar reabrir sesion guest sin aceptar normas

---

## 5. Orden recomendado

1. unificar gate guest
2. eliminar autoasignacion de edad y reglas
3. reactivar aceptacion consistente de normas
4. endurecer deteccion de menores ofuscados
5. probar evasiones manuales

---

## 6. Criterio de cierre

Este pendiente se considera cerrado cuando:

- ningun invitado entra sin pasar por edad + normas
- `localStorage` ya no basta para elevar acceso por si solo
- `ChatPage` y `ChatSecondaryPage` ya no autocompletan `18`
- mensajes con variantes evidentes de menor quedan bloqueados o escalados
- las rutas de entrada son consistentes entre home, landing y chat

---

## 7. Veredicto

Hoy el sistema esta mejor que antes a nivel de UI, pero no blindado de verdad.

La correccion correcta no es agregar otro modal.
La correccion correcta es:

- unificar entrada
- quitar auto-validaciones locales
- endurecer deteccion
- probar evasiones reales
