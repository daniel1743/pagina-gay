# CHECKLIST_ESTRATEGICO_DEFINITIVO_CHACTIVO

Fecha: 2026-02-10
Enfoque: crecimiento real, sin fake, sin monetizacion, sin postureo

Reglas de oro (no negociar)
- No inventar actividad, likes, vistas ni presencia.
- No bots que simulen personas.
- Si algo es editorial o sistema, debe estar etiquetado como tal.
- No bloquear funciones core por monetizacion.

## FASE 1 - DESINTOXICACION TOTAL (SEMANA 1)
Objetivo: restaurar confianza y eliminar todo lo que distorsiona la percepcion.

1) Centralizacion absoluta de la comunidad (CRITICO)
- [ ] Dejar activa SOLO la sala principal.
- [ ] (Opcional) mantener sala santiago solo si tiene trafico real verificable.
- [ ] Redirigir automaticamente cualquier acceso a salas vacias -> /chat/principal.
- [ ] Ocultar UI de salas tematicas hasta masa critica real.

Criterio de trafico real (si se habilita santiago):
- >= 30 usuarios reales concurrentes sostenidos durante 7 dias, sin boosts.

Archivos a tocar (referencia):
- src/config/rooms.js
- src/pages/ChatPage.jsx
- src/components/lobby/RoomsModal.jsx

2) Honestidad total de datos
- [ ] Eliminar engagementBoostService.js (o desactivar toda la escritura de boosts).
- [ ] Eliminar boosts de likes, vistas y estados online minimos.
- [ ] Mostrar solo online real y reciente real.
- [ ] Etiquetar claramente cualquier contenido editorial (si existe).

Archivos a tocar (referencia):
- src/services/engagementBoostService.js
- src/services/tarjetaService.js
- src/pages/OpinFeedPage.jsx
- src/components/chat/TarjetaPromoBanner.jsx

3) Moderacion funcional (no simbolica)
- [ ] Mover reportes de localStorage a Firestore.
- [ ] Vista basica de reportes en Admin.
- [ ] Acciones inmediatas: ban, mute, delete message.
- [ ] Implementar BLOCK de usuarios (no ver, no DM, no interaccion).

Archivos a tocar (referencia):
- src/services/reportService.js (crear si no existe)
- src/pages/AdminPage.jsx
- firestore.rules

## FASE 2 - VIDA REAL EN EL CHAT (SEMANA 2)
Objetivo: que el chat se sienta humano y activo sin simulacion.

4) Ritmo social sin bots
- [ ] Mensajes de sistema claramente etiquetados.
- [ ] Ritual diario (max 1) con copy humano.
- [ ] NO usar numeros si no son 100% reales.
- [ ] NO mensajes automaticos cada X minutos.

Archivos a tocar (referencia):
- src/services/vocService.js
- src/pages/ChatPage.jsx

5) Eliminacion del "empty scroll"
- [ ] Cuando haya silencio, mostrar sugerencias de conversacion (UI hints).
- [ ] NO enviar mensajes falsos.
- [ ] Prompts simples (ej: "De donde eres?" "Que buscas hoy?").

Archivos a tocar (referencia):
- src/components/chat/ContextualMessages.jsx
- src/pages/ChatPage.jsx

## FASE 3 - MEMORIA Y RETORNO (SEMANA 3-4)
Objetivo: que el usuario vuelva porque paso algo REAL.

6) Push notifications (solo humanas)
- [ ] Implementar FCM.
- [ ] Solo 2 triggers: nuevo mensaje privado, nuevo match/like directo.
- [ ] No notificar OPIN ni recordatorios vacios.
- [ ] Quiet hours activas.

Archivos a tocar (referencia):
- functions/ (FCM)
- src/services/notificationsService.js
- firestore.rules

7) Baul orientado a "ahora"
- [ ] Ordenar tarjetas por: online real ahora, ultima conexion reciente, proximidad (si existe).
- [ ] Quitar peso excesivo a "completitud de perfil".
- [ ] Priorizar perfiles con actividad hoy.

Archivos a tocar (referencia):
- src/services/tarjetaService.js
- src/components/baul/BaulSection.jsx

## FASE 4 - HABITO MINIMO (SEMANA 5-8)
Objetivo: razones suaves para volver sin presion social.

8) Streaks personales (no publicos)
- [ ] Contador privado de dias activos.
- [ ] Mensaje simple: "Llevas 3 dias activo".
- [ ] Sin rankings, sin comparaciones.

Archivos a tocar (referencia):
- src/services/streakService.js (crear si no existe)
- src/components/chat/ChatHeader.jsx

9) Simplificacion visual
- [ ] Ocultar metricas que no ayudan (vistas totales, likes historicos).
- [ ] Mostrar solo actividad reciente y novedades desde ultima visita.

Archivos a tocar (referencia):
- src/components/baul/TarjetaUsuario.jsx
- src/components/opin/OpinCard.jsx

## FASE 5 - ESCALA CONTROLADA (CUANDO HAYA SENALES)
Objetivo: crecer sin romper lo logrado.

10) Reapertura progresiva de salas
- [ ] Abrir nueva sala SOLO si hay >= 30 concurrentes reales estables.
- [ ] Cerrar salas automaticamente si caen por debajo del umbral.
- [ ] Nunca mas de 2-3 salas activas al inicio.

Archivos a tocar (referencia):
- src/config/rooms.js
- src/services/roomScheduler.js (crear si no existe)

## Definicion de "real"
- Online real = presencia en roomPresence sin boosts ni bots.
- Likes/vistas reales = acciones registradas por usuarios autenticados.
- Mensajes reales = escritos por humanos, no por sistemas simulados.

## Medicion minima (sin vanity)
- D1/D7 de invitados vs registrados.
- Mensajes reales por hora (principal).
- Matches reales por dia.
- Reportes procesados y tiempo de respuesta.

## Riesgos si no se cumple
- Perdida de confianza por datos inflados.
- Percepcion de sala vacia pese a actividad real.
- Abuso de spam si reglas no se endurecen.
