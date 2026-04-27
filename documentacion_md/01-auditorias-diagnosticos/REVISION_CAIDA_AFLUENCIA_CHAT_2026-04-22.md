# Revision Caida Afluencia Chat 2026-04-22

## Objetivo

Revisar si algun cambio reciente pudo dañar la experiencia de la sala principal y reducir la cantidad de mensajes visibles.

La revision se enfoco en:

- friccion antes de enviar mensajes,
- presencia y percepcion de sala activa,
- bloqueos de seguridad recientes,
- y costo Firebase bajo.

---

## Veredicto

No se encontro evidencia clara de que el backend este eliminando masivamente mensajes publicos.

Si se encontraron dos cambios con alto potencial de dañar la afluencia:

1. El checklist preventivo del input podia frenar mensajes cortos como `hola`.
2. La presencia estaba demasiado agresiva para modo ahorro y podia hacer desaparecer usuarios pasivos rapido.

Ambos problemas afectan la sensacion de actividad:

- menos mensajes enviados por friccion,
- menos usuarios aparentes en sala,
- menor incentivo a escribir.

---

## Hallazgo 1: el primer mensaje corto podia quedar frenado

Archivo:

- `src/components/chat/ChatInput.jsx`

Problema:

El flujo preventivo detectaba mensajes de baja senal y hacia `return` antes de enviar.

Impacto:

- un usuario que escribe algo simple como `hola` podia tener que hacer una accion extra,
- eso reduce mensajes espontaneos,
- aumenta friccion en el momento mas sensible: el primer envio.

Decision aplicada:

- el checklist queda como ayuda visual,
- pero ya no bloquea el envio,
- el usuario puede mandar mensajes cortos sin quedar atrapado.

Regla de producto:

> La ayuda debe orientar, no impedir que la sala se mueva.

---

## Hallazgo 2: la presencia desaparecia demasiado rapido

Archivos:

- `src/pages/ChatPage.jsx`
- `src/services/presenceService.js`

Problema:

El modo ahorro habia bajado escrituras, pero la ventana de actividad quedo demasiado estricta:

- heartbeat cada 5 minutos,
- gracia de actividad visible de 3 minutos,
- timeout de presencia de 8 minutos.

Impacto:

- usuarios que miran la sala sin tocar la pantalla pueden desaparecer como activos,
- la sala parece mas vacia,
- baja el efecto social de “hay gente”.

Decision aplicada:

- se mantuvo heartbeat cada 5 minutos para no disparar costo,
- se amplio la gracia de actividad visible a 12 minutos,
- se amplio el timeout de presencia a 12 minutos.

Resultado esperado:

- usuarios reales permanecen visibles mas tiempo,
- menos sensacion de sala muerta,
- sin volver al heartbeat caro anterior.

---

## Lo que no se cambio

No se debilito:

- bloqueo de menores,
- bloqueo de contacto externo,
- bloqueo de salida a WhatsApp / Telegram / Discord / otra app,
- funciones backend criticas.

Motivo:

La seguridad no debe sacrificarse para subir actividad. El ajuste correcto era quitar friccion de UX y mejorar presencia sin aumentar lecturas innecesarias.

---

## Validacion

Se ejecuto:

```bash
npm run build
```

Resultado:

- build exitoso,
- no se tocaron Cloud Functions,
- solo requiere deploy de Hosting.

---

## Cambios aplicados

### `ChatInput.jsx`

- El checklist preventivo ya no bloquea mensajes de baja senal.
- El primer mensaje corto puede salir directo.
- La UI preventiva queda como asistencia, no como barrera.

### `ChatPage.jsx`

- `PRESENCE_HEARTBEAT_IDLE_GRACE_MS` paso de 3 minutos a 12 minutos.

### `presenceService.js`

- `ACTIVE_THRESHOLD_MS` paso de 8 minutos a 12 minutos.
- `CHAT_AVAILABILITY_TIMEOUT_MS` paso de 8 minutos a 12 minutos.
- `CHAT_AVAILABILITY_HEARTBEAT_MS` se mantiene en 5 minutos.

---

## Riesgo residual

Todavia conviene observar:

- si el modal de nickname sigue siendo demasiada friccion para invitados,
- si el panel superior ocupa demasiado espacio en movil,
- si los bloqueos frontend muestran mensajes demasiado duros en casos no criticos,
- si la sala necesita una ruta mas directa para escribir sin completar perfil.

---

## Conclusion

La caida de afluencia probablemente no viene de un solo fallo fatal.

La causa mas plausible es combinada:

- ayuda preventiva demasiado bloqueante,
- presencia demasiado austera,
- percepcion de sala con poca gente.

La correccion aplicada reduce friccion sin aumentar listeners y sin debilitar seguridad critica.
