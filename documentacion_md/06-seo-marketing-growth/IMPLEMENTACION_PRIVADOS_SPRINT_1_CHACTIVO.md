# Implementacion Privados Sprint 1 Chactivo (25-03-2026)

## Objetivo del sprint
Ejecutar la primera capa de mejora de visibilidad y activación del privado con cambios de alto impacto y bajo riesgo.

Documento base:
- [PLAN_PRIVADOS_CHACTIVO_2026-03-25.md](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\documentacion_md\06-seo-marketing-growth\PLAN_PRIVADOS_CHACTIVO_2026-03-25.md)

---

## MVP real del sprint

## P0
- clic en usuario -> flujo de privado claro y consistente
- CTA `Hablar en privado` visible en modal, perfiles y puntos críticos
- rescate cuando la sala tarda en cargar
- trigger por frustración explícita: 2 mensajes seguidos sin respuesta

## P1
- microcopy persistente en sala
- privados recientes más visibles
- trigger por mensaje sin respuesta en 10-15 segundos
- sugerencias de primer mensaje

## P2
- ranking simple de candidatos a privado
- badges de señal real
- tip contextual para primer privado en usuarios nuevos

---

## Quick wins

## 1. Unificar lenguaje visible
- reemplazar textos principales por `Hablar en privado`
- reducir protagonismo de `mensaje directo` e `invitar a chat privado`

Archivos probables:
- [UserActionsModal.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\UserActionsModal.jsx)
- [ChatOnlineUsersColumn.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatOnlineUsersColumn.jsx)
- [ChatBottomNav.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatBottomNav.jsx)

## 2. Reforzar acceso móvil
- hacer más visible `Privados` en bottom nav
- mostrar badge más claro cuando existan privados recientes o respuestas nuevas

Archivo probable:
- [ChatBottomNav.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatBottomNav.jsx)

## 3. Reforzar recientes
- hacer más visible el panel de recientes
- usar previews más útiles
- evitar que parezca solo historial pasivo

Archivo probable:
- [PrivateChatsQuickAccess.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\PrivateChatsQuickAccess.jsx)

## 4. Rescate durante carga lenta
- si la sala pública sigue cargando, mostrar CTA hacia privado y usuarios disponibles

Archivos probables:
- [ChatPage.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\pages\ChatPage.jsx)
- [ChatMessages.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatMessages.jsx)

## 5. Triggers por frustración
- si el usuario manda un mensaje y no recibe respuesta en 10-15 segundos, mostrar CTA a privado
- si manda 2 mensajes seguidos sin respuesta, mostrar nudge más fuerte
- aplicar cooldown por sesión para no repetir nudges sin control

Archivos probables:
- [ChatPage.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\pages\ChatPage.jsx)
- [ChatMessages.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatMessages.jsx)

## 6. Primer mensaje sugerido
- precargar opciones breves de apertura

Archivo probable:
- [PrivateChatWindow.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\PrivateChatWindow.jsx)

## 7. Ranking simple de candidatos
- destacar usuarios con mejor señal para abrir privado
- usar etiquetas visibles como `Disponible`, `Activo ahora`, `Cerca`

Archivo probable:
- [ChatOnlineUsersColumn.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatOnlineUsersColumn.jsx)

## 8. Rescate conductual mínimo
- si la sala parece vacía o tarda demasiado, no dejar solo skeleton
- acompañar la carga con candidatos a privado
- usar un módulo con CTA dominante y 2 o 3 perfiles sugeridos

Archivos probables:
- [ChatPage.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\pages\ChatPage.jsx)
- [ChatOnlineUsersColumn.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatOnlineUsersColumn.jsx)
- [ChatMessages.jsx](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\components\chat\ChatMessages.jsx)

---

## Orden real de ejecución

## Semana 1
- unificar copy visible del privado
- subir `Hablar en privado` como CTA dominante
- reforzar `Privados` en mobile
- asegurar clic consistente en avatar, nombre y modal

## Semana 2
- rescate durante carga lenta
- módulo de candidatos a privado cuando la sala no impresiona
- mejorar recientes y previews

## Semana 3
- trigger por mensaje sin respuesta
- trigger por 2 mensajes seguidos sin respuesta
- sugerencias de primer mensaje

## Semana 4
- ranking simple de usuarios
- badges por señal real
- instrumentación inicial
- ajuste de cooldowns y validación de ruido

---

## Checklist técnico

- revisar consistencia verbal en todas las entradas al privado
- validar que todos los accesos lleven al flujo real de apertura de privado
- validar que el panel de recientes no tape interacción crítica en mobile
- validar que el rescate durante carga no agregue ruido cuando la sala ya está viva
- validar que los nudges por frustración no se vuelvan spam
- validar que el ranking no prometa más de lo que el sistema sabe
- validar eventos de analytics para privado
- registrar cooldown de nudges por sesión
- no mostrar rescate si el usuario ya tiene un privado abierto
- no repetir trigger fuerte si ya hubo apertura de privado posterior al nudge

---

## Matriz de triggers del sprint

| Trigger | Condición mínima | UI | Métrica principal |
|---|---|---|---|
| Sala lenta | snapshot tarda más de 4-5s | rescate con CTA y perfiles | `private_rescue_module_click` |
| Mensaje sin respuesta | 1 mensaje propio sin respuesta en 10-15s | nudge discreto | `private_nudge_click_after_no_response` |
| Frustración explícita | 2 mensajes propios seguidos sin respuesta | nudge fuerte | `private_frustration_detected` |
| Usuario nuevo pasivo | sin privados abiertos en primeros 20-30s | tip de primer privado | `private_first_session_tip_view` |

---

## Eventos a instrumentar

- `private_cta_view`
- `private_cta_click`
- `private_opened`
- `private_first_message_sent`
- `private_reply_received`
- `private_return_open`
- `private_rescue_click_during_chat_load`
- `private_nudge_shown_after_no_response`
- `private_nudge_click_after_no_response`
- `private_candidate_ranked_click`
- `private_rescue_module_view`
- `private_rescue_module_click`
- `private_frustration_detected`
- `private_first_session_tip_view`

Archivos probables:
- [analyticsService.js](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\services\analyticsService.js)
- [eventTrackingService.js](C:\Users\Lenovo\Desktop\proyectos desplegados importante\gay chat\src\services\eventTrackingService.js)

---

## Resultado esperado del sprint 1

- el privado se vuelve mucho más visible
- la UX deja más claro qué hacer para hablar 1 a 1
- se reduce la ambigüedad verbal
- sube la probabilidad de apertura del primer privado
- se empieza a rescatar frustración antes del abandono
- queda lista la base para medir si el privado realmente mueve activación y retención
- quedan activos los triggers mínimos que más empujan comportamiento sin volver la experiencia invasiva
