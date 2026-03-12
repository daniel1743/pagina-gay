# PLAN_P0_NOTIFICACIONES_OPIN_PREMIUM_2026-03-07

Fecha: 2026-03-07  
Proyecto: Chactivo  
Objetivo: activar reenganche real con badges visibles + base para notificaciones OPIN y chat privado desde OPIN.

## 1) Estado actual (snapshot)

### P0 implementado hoy
- Contador de **notificaciones importantes** en campana (`1`, `3`, `9+`).
- Sincronizacion del contador con **App Badge API** (`setAppBadge/clearAppBadge`) para icono de app cuando el navegador lo soporta.
- Sincronizacion de estado de contador en `localStorage` + evento global `chactivo:important-notifications`.
- Banner de instalacion PWA ahora muestra:
  - texto de avisos pendientes
  - badge visual sobre el boton `Instalar Ahora`.

### P1 implementado hoy
- Al crear comentario en OPIN, se crea notificacion `opin_reply` para el autor del post (si responde otra persona).
- Deep link en notificacion a `'/opin?postId=...&openComments=1'`.
- `OpinFeedPage` abre automaticamente el modal de respuestas si llega con esos params.
- `NotificationsPanel` renderiza bloque dedicado para `opin_reply` y abre OPIN al click.
- Cloud Function `notifyOnOpinReply` envia push al usuario destino cuando se crea `opin_reply`.

### P2 implementado hoy
- Cuando un usuario publica OPIN, vuelve a `/opin?fromComposer=1` y se activa CTA contextual.
- CTA aparece solo para usuarios logueados con intencion de publicar y que aun no cumplen:
  - app instalada, o
  - push activo.
- Acciones en CTA:
  - `Activar avisos` (solicita permiso push en el momento de mayor intencion).
  - `Instalar app` (usa prompt nativo cuando disponible o muestra instruccion manual).
- Si el usuario ya tiene app instalada + push activo, se limpia el flag de intencion y no vuelve a mostrarse.

### Archivos tocados en P0
- `src/components/notifications/NotificationBell.jsx`
- `src/services/pushNotificationService.js`
- `src/components/ui/PWAInstallBanner.jsx`

### Archivos tocados en P1
- `src/services/opinService.js`
- `src/pages/OpinFeedPage.jsx`
- `src/components/notifications/NotificationsPanel.jsx`
- `functions/index.js`

### Archivos tocados en P2
- `src/pages/OpinComposerPage.jsx`
- `src/pages/OpinFeedPage.jsx`

## 2) Definicion de "notificacion importante" (P0)

Tipos incluidos:
- `direct_message`
- `private_chat_request`
- `private_chat_accepted`
- `opin_reply`
- `opin_response`
- `opin_comment`
- `opin_mention`
- cualquier tipo que empiece por `opin_`

## 3) Checklist ejecutable P0 (QA)

### A. Build
- [ ] Ejecutar `npm run build`.
- [ ] Confirmar build sin errores.

### B. Campana (chat)
- [ ] Iniciar sesion con usuario registrado.
- [ ] Generar 1 evento importante (ej: solicitud de chat privado).
- [ ] Verificar que la campana muestre `1`.
- [ ] Generar 2 eventos mas importantes.
- [ ] Verificar que suba a `3`.
- [ ] Verificar `9+` cuando supere 9.

### C. App badge del icono
- [ ] Probar en navegador con soporte App Badge (Chrome/Edge compatible).
- [ ] Con notificaciones importantes > 0, validar badge en icono de app/sistema.
- [ ] Al dejar contador en 0, validar que se limpie el badge.

### D. Banner de instalacion PWA
- [ ] Abrir pagina con `PWAInstallBanner` visible.
- [ ] Con contador importante > 0, verificar texto "avisos pendientes".
- [ ] Verificar burbuja numerica en boton `Instalar Ahora`.

## 4) Plan OPIN (siguiente fase)

## P1 - Notificar respuesta en OPIN (retencion)
- Crear notificacion `opin_reply` cuando alguien responde una opinion.
- Guardar en `users/{authorId}/notifications`:
  - `type`, `from`, `fromUsername`, `threadId`, `replyId`, `snippet`, `timestamp`, `read`.
- Push al autor si tiene push habilitado.
- Deep link directo al hilo/comentario.

### QA ejecutable P1
- [ ] Usuario A publica OPIN.
- [ ] Usuario B responde ese OPIN.
- [ ] Usuario A ve nueva notificacion `opin_reply` en campana.
- [ ] Click en notificacion abre OPIN con modal de respuestas del post correcto.
- [ ] Si Usuario A tiene push activo y app en background/cerrada, recibe push con texto de respuesta.

## P2 - CTA instalacion por intencion
- En OPIN, mostrar CTA contextual:
  - "Instala la app para enterarte cuando te respondan".
- Mostrar solo cuando:
  - usuario publico una opinion
  - no tiene push activo o no esta en modo instalado.

### QA ejecutable P2
- [ ] Publicar OPIN con usuario registrado.
- [ ] Ver retorno a `/opin` con CTA contextual visible.
- [ ] Si push esta en `default`, validar boton `Activar avisos` y flujo de permiso.
- [ ] Si no esta instalada la app, validar boton `Instalar app`.
- [ ] Si app ya instalada y push activo, validar que CTA no vuelva a mostrarse.

## P3 - Invitar a chat privado desde OPIN
- Boton por respuesta/usuario: `Invitar a privado`.
- Reusar flujo existente `private_chat_request`.
- Al aceptar, abrir ventana privada individual.
- Agregar anti-spam:
  - limite por hora
  - cooldown por destinatario.

### P3 implementado hoy
- Servicio nuevo `sendPrivateChatRequestFromOpin(...)` con:
  - limite de 4 invitaciones por hora por emisor.
  - cooldown de 15 minutos por destinatario.
  - bloqueo de duplicado si ya existe solicitud pendiente.
- Boton `Invitar privado` en:
  - tarjeta OPIN (autor del post).
  - preview de respuestas en tarjeta OPIN.
  - modal de comentarios OPIN (autor del post + cada comentario).
- Manejo UX de errores con mensajes claros:
  - bloqueado, pendiente existente, limite por hora, cooldown, auto-invitacion.

### QA ejecutable P3
- [ ] Usuario A abre OPIN y pulsa `Invitar privado` sobre usuario B.
- [ ] Usuario B recibe `private_chat_request` en notificaciones.
- [ ] Usuario A intenta invitar de nuevo a B con solicitud pendiente y se bloquea por duplicado.
- [ ] Usuario A envia 4 invitaciones en < 1 hora y la 5ta se bloquea por rate limit.
- [ ] Usuario A invita a B y vuelve a intentar antes de 15 min: se bloquea por cooldown.
- [ ] Usuario B acepta y se abre/reutiliza chat privado correctamente.

## 5) KPI de validacion (14 dias)

- % opiniones con al menos 1 respuesta.
- % autores que regresan tras notificacion OPIN.
- % respuesta OPIN -> invitacion privada.
- % activacion push tras CTA de instalacion.

## 6) Riesgos y mitigacion

- Riesgo: exceso de notificaciones.
  - Mitigacion: deduplicacion por `threadId` + ventana temporal.
- Riesgo: spam de invitaciones privadas.
  - Mitigacion: rate limit + bloqueo por usuario.
- Riesgo: navegadores sin App Badge.
  - Mitigacion: fallback visual en campana y banner PWA.
