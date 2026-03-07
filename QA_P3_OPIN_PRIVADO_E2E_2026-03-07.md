# QA_P3_OPIN_PRIVADO_E2E_2026-03-07

Fecha: 2026-03-07  
Proyecto: Chactivo  
Scope: P3 OPIN (invitar a chat privado + anti-spam)

## 1) Estado tecnico ya validado

- [x] Build OK con `npm run build`.
- [x] Boton de invitacion en:
  - `OpinCard` (autor del post)
  - `OpinCard` preview de comentarios
  - `OpinCommentsModal` (autor del post + comentarios)
- [x] Servicio anti-spam activo:
  - limite 4 invitaciones/hora
  - cooldown 15 min por destinatario
  - bloqueo de duplicado pendiente

## 2) Precondiciones para QA manual

- [ ] Tener 3 cuentas: `A` (tester), `B` (destino principal), `C` (destino extra).
- [ ] Abrir al menos 2 sesiones (incognito recomendado): sesion A y sesion B.
- [ ] A y B deben tener OPIN visible y acceso a notificaciones.
- [ ] B debe limpiar notificaciones antiguas si hay ruido.

## 3) Casos E2E (ejecutable)

### Caso 1: Invitar desde card OPIN (autor del post)
- [ ] A abre feed OPIN.
- [ ] A pulsa `Invitar privado` en un post de B.
- Esperado:
  - [ ] Toast de exito en A.
  - [ ] B recibe `private_chat_request`.

### Caso 2: Invitar desde preview de comentarios (card)
- [ ] En OPIN card expandida, A pulsa `Privado` sobre comentario de B.
- Esperado:
  - [ ] Toast de exito en A.
  - [ ] B recibe solicitud privada.

### Caso 3: Invitar desde modal de comentarios (autor del post)
- [ ] A abre modal de comentarios de un post de B.
- [ ] A pulsa `Invitar a privado` (header del post).
- Esperado:
  - [ ] Toast de exito en A.
  - [ ] B recibe solicitud privada.

### Caso 4: Invitar desde modal de comentarios (comentario)
- [ ] A pulsa `Privado` en una respuesta de B dentro del modal.
- Esperado:
  - [ ] Toast de exito en A.
  - [ ] B recibe solicitud privada.

### Caso 5: Duplicado pendiente bloqueado
- [ ] Con una solicitud pendiente A->B sin responder, A intenta invitar otra vez a B.
- Esperado:
  - [ ] Toast de error: ya existe invitacion pendiente.
  - [ ] No se crea una segunda notificacion pendiente.

### Caso 6: Cooldown por destinatario (15 min)
- [ ] A envia invitacion a B.
- [ ] B rechaza o acepta.
- [ ] A intenta invitar de nuevo a B antes de 15 min.
- Esperado:
  - [ ] Toast de error por cooldown.

### Caso 7: Rate limit por hora (4/h)
- [ ] A envia 4 invitaciones validas en menos de 1 hora (B/C y otros usuarios).
- [ ] A intenta la 5ta invitacion.
- Esperado:
  - [ ] Toast de error por limite por hora.
  - [ ] No se crea nueva solicitud.

### Caso 8: Aceptar abre/reutiliza chat privado
- [ ] B acepta la solicitud de A.
- Esperado:
  - [ ] Se abre chat privado.
  - [ ] Si ya existia chat A-B, se reutiliza (no crea duplicado).
  - [ ] A recibe `private_chat_accepted`.

### Caso 9: Usuario guest/anónimo no puede invitar
- [ ] Entrar como guest/anónimo.
- [ ] Abrir OPIN card y modal.
- Esperado:
  - [ ] Botones de invitar no visibles o bloqueados.
  - [ ] Si intenta por flujo indirecto, muestra mensaje de registro/login.

### Caso 10: Auto invitacion bloqueada
- [ ] A intenta invitarse a si mismo (post/comentario propio).
- Esperado:
  - [ ] No se envia solicitud.
  - [ ] Mensaje de auto-invitacion no permitida.

## 4) Validaciones en Firestore (opcional pero recomendado)

### Solicitudes privadas pendientes
- Ruta: `users/{B}/notifications`
- Verificar:
  - [ ] `type = private_chat_request`
  - [ ] `status = pending`
  - [ ] `from = A`

### Logs anti-spam
- Ruta: `users/{A}/private_chat_request_logs`
- Verificar:
  - [ ] Se agrega log por invitacion exitosa.
  - [ ] Incluye `source = opin`.
  - [ ] Incluye `postId` y `commentId` cuando aplica.

## 5) Criterio de cierre P3

- [ ] Casos 1, 2, 3, 4, 8 en verde.
- [ ] Casos 5, 6, 7, 10 bloquean correctamente.
- [ ] Caso 9 correcto para guest/anónimo.
- [ ] Sin errores de consola bloqueantes en OPIN.

## 6) Evidencia minima sugerida

- [ ] 1 screenshot de exito de invitacion.
- [ ] 1 screenshot de error por duplicado o cooldown.
- [ ] 1 screenshot de chat privado abierto tras aceptar.
- [ ] 1 captura de Firestore con log anti-spam.
