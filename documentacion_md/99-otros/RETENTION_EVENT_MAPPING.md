# Event Mapping Document - Chactivo

Fecha: 2026-02-14
Objetivo: definir eventos unificados para retención, engagement y funnels.
Regla: no simular actividad. Todos los eventos deben provenir de acciones reales.

## Convenciones
- `event_type`: string sin espacios. Usar snake_case.
- `session_id`: UUID por sesión (sessionStorage).
- `user_id`: `user.id` si existe, sino `auth.currentUser.uid` o `null`.
- `is_guest`: boolean.
- `is_anonymous`: boolean.
- `page_path`: ruta actual.
- `room_id`: para chat público.
- `post_id`: para OPIN.
- `card_id`: para Baúl.

## Eventos de Sesión y Navegación
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| session_start | App monta por primera vez en la sesión | `useSessionTracking` | analytics_stats + GA4 | session_id, user_id, is_guest, is_anonymous | Si hay `last_seen_at`, calcular `days_since_last` y disparar `return_visit`. |
| session_end | `visibilitychange` a hidden o `beforeunload` | `useSessionTracking` | analytics_stats + GA4 | session_id, duration_ms | Guardar `last_seen_at` en localStorage. |
| return_visit | Nueva sesión con `last_seen_at` previo | `useSessionTracking` | analytics_stats + GA4 | days_since_last | Usar solo una vez por sesión. |
| page_view | Render de página (Lobby, Chat, OPIN, Baúl, Profile, Premium) | páginas | analytics_stats + GA4 | page_path, page_title | Recomendado medir en `useEffect`. |
| page_exit | Salida de página | páginas | analytics_stats + GA4 | page_path, time_on_page | Corregir para usar `time_on_page`. |

## Eventos de Autenticación
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| user_register | Registro exitoso | `AuthContext` | analytics_stats + GA4 | user_id, method | Ya existe. Migrar a eventTrackingService. |
| user_login | Login exitoso | `AuthContext` | analytics_stats + GA4 | user_id, method | Ya existe. |
| guest_login | Invitado entra con modal | `GuestUsernameModal` | analytics_stats | user_id, guest_id | Señal de activación temprana. |

## Eventos Chat
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| room_joined | Usuario entra a sala | `ChatPage` | analytics_stats + GA4 | room_id, user_id | Ya existe. |
| message_sent | Mensaje enviado | `ChatPage` + `chatService` | analytics_stats + GA4 | room_id, user_id | Ya existe. |
| reaction_added | Reacción en mensaje | `ChatPage` | analytics_stats | room_id, message_id | Solo registrados. |

## Eventos OPIN
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| opin_feed_view | Entrada a /opin | `OpinFeedPage` | analytics_stats | page_path | Usar una vez por sesión. |
| opin_view | Nota entra en viewport | `OpinCard` | analytics_stats | post_id, author_id | También incrementa `viewCount` real. |
| opin_like | Like agregado | `opinService.toggleLike` | analytics_stats | post_id, author_id | Solo cuando `liked=true`. |
| opin_reaction | Reacción emoji | `opinService.toggleReaction` | analytics_stats | post_id, emoji, author_id | Solo cuando `reacted=true`. |
| opin_comment | Comentario creado | `opinService.addComment` | analytics_stats | post_id, author_id | Incremento real de `commentCount`. |

## Eventos Baúl
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| baul_view | Entrada a /baul o apertura modal Baúl | `BaulSection` | analytics_stats | page_path | Una vez por sesión. |
| tarjeta_view | Perfil abierto | `tarjetaService.registrarVisita` | analytics_stats | card_id, viewer_id | Incremento real `visitasRecibidas`. |
| tarjeta_like | Like agregado | `tarjetaService.darLike` | analytics_stats | card_id, viewer_id | Solo cuando es like real. |
| tarjeta_message | Mensaje enviado | `tarjetaService.enviarMensajeTarjeta` | analytics_stats | card_id, viewer_id | Actividad real. |
| match_created | Match real | `tarjetaService.crearMatch` | analytics_stats | match_id, user_a, user_b | Emitir una vez por match. |

## Eventos Seguridad
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| report_created | Reporte enviado | `ReportModal`, `DenunciaModal` | analytics_stats + GA4 | reporter_id, reported_user_id, context | No exponer reporter al reportado. |
| user_blocked | Usuario bloqueado | `blockService` | analytics_stats | user_id, blocked_user_id | Señal de seguridad percibida. |

## Eventos Notificaciones
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| notification_received | Notificación creada | `systemNotificationsService` | analytics_stats | user_id, type | Para medir eficacia. |
| notification_clicked | Click en notificación | `NotificationsPanel` | analytics_stats | notification_id, type | Útil para retorno. |

## Eventos Performance (Opcional)
| event_type | Trigger | Origen | Destino | Propiedades mínimas | Notas |
| --- | --- | --- | --- | --- | --- |
| performance_metric | Medición puntual | `performanceMonitor` | analytics_stats | metric_name, duration_ms | Recomendado solo en sampling. |

## Reglas de deduplicación
- `opin_view`: 1 por post por sesión.
- `baul_view`: 1 por sesión.
- `tarjeta_view`: 1 por tarjeta por sesión.
- `session_start` y `session_end`: 1 por sesión.

