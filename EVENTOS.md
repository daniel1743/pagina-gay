# Sistema de Eventos Programados - Chactivo

## Que es

Sistema de eventos que permite crear salas de chat especiales que se abren automaticamente en un horario programado. Los eventos aparecen como banner en el chat principal, notificando a los usuarios que hay un evento activo o proximo.

## Como funciona

### Ciclo de vida de un evento

1. **Programado** - El admin crea el evento con fecha/hora futura. Aparece en el chat con countdown
2. **Activo (EN VIVO)** - Cuando llega la hora, la sala se abre automaticamente. El banner cambia a rojo con boton "Entrar"
3. **Finalizado** - Cuando pasa la duracion, el evento se cierra. Los mensajes quedan en Firestore

### Salas dinamicas

Cada evento genera un roomId unico: `evento_{timestamp}`. Estas salas funcionan igual que las salas normales (principal, gaming, etc.) pero son temporales. Los mensajes se guardan en `rooms/evento_{timestamp}/messages/`.

No necesitan configuracion previa en rooms.js. Se crean automaticamente cuando el primer usuario envia un mensaje.

## Archivos creados

| Archivo | Que hace |
|---------|----------|
| `src/utils/eventosUtils.js` | Funciones utilitarias: isEventoActivo, isEventoProgramado, formatCountdown, formatFechaEvento |
| `src/services/eventosService.js` | CRUD Firestore: crearEvento, obtenerEventosVisibles, suscribirseAEventos, unirseAEvento, desactivarEvento |
| `src/components/admin/AdminEventosPanel.jsx` | Panel admin con formulario para crear eventos y lista de eventos existentes |
| `src/components/eventos/EventoBanner.jsx` | Banner que aparece arriba del chat mostrando evento activo o proximo con countdown en tiempo real |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/ChatPage.jsx` | Import EventoBanner + mostrarlo arriba del chat + permitir roomId `evento_*` |
| `src/pages/AdminPage.jsx` | Import AdminEventosPanel + tab "Eventos" en el panel admin |
| `src/config/rooms.js` | `canAccessRoom()` permite salas que empiecen con `evento_` |
| `firestore.rules` | Reglas para coleccion `eventos` (read: todos, write: admin) y subcoleccion `asistentes` |

## Como crear un evento

1. Ir al panel admin (`/admin`)
2. Click en tab "Eventos"
3. Click "Nuevo Evento"
4. Llenar: nombre, descripcion (opcional), fecha, hora, duracion
5. Click "Crear Evento"

El evento aparece automaticamente en el chat de todos los usuarios como banner.

## Estructura Firestore

```
eventos/{eventoId}
  - nombre: string
  - descripcion: string
  - roomId: string (evento_{timestamp})
  - fechaInicio: timestamp
  - fechaFin: timestamp
  - duracionMinutos: number
  - creadoPor: string (uid)
  - creadoEn: timestamp
  - activo: boolean
  - asistentesCount: number

eventos/{eventoId}/asistentes/{userId}
  - userId: string
  - username: string
  - joinedAt: timestamp

rooms/evento_{timestamp}/messages/{messageId}
  - (misma estructura que mensajes normales del chat)
```

## Comportamiento del banner

- **Evento programado**: Fondo azul, icono reloj, muestra countdown en tiempo real ("2h 15m", "45m", "3s")
- **Evento activo (EN VIVO)**: Fondo rojo, icono pulsante, boton "Entrar" que lleva a la sala
- **Si ya estas en la sala del evento**: El banner no aparece
- **Se puede cerrar**: Boton X para dismissear (reaparece si hay evento nuevo)
- **Actualizacion real-time**: Usa Firestore onSnapshot, se actualiza sin refresh

## Requisitos tecnicos

- Todo client-side, sin Cloud Functions
- No requiere Firebase Blaze (plan gratuito)
- El estado del evento (activo/programado/finalizado) se calcula en el cliente comparando timestamps
- Compatible con usuarios invitados (pueden ver el banner y entrar a la sala)
- Solo admins pueden crear eventos (validado en Firestore rules)

## Ideas para eventos

- Noche de Confesiones (viernes 22:00)
- Speed Dating Anonimo (sabado 21:00)
- Debate Caliente (tema semanal)
- Karaoke Virtual / Juegos
- Hora del Consejo (apoyo emocional)
- Encuentro Regional (por ciudad)
