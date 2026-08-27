# Inventario final de referencias Firebase en Chactivo

**Fecha:** 27 de agosto de 2026
**Alcance:** revisión estática local de `src/` después de los cambios Supabase-first.

> Este inventario clasifica imports y ramas de compatibilidad. No prueba por sí mismo qué rutas ha visitado un usuario en producción. La clasificación “guardado” significa que, con `VITE_ENABLE_SUPABASE=true` y `VITE_AUTH_PROVIDER=supabase`, el flujo relevante retorna o se detiene antes de ejecutar Firebase.

## Resumen

| Clasificación | Significado |
|---|---|
| Fallback histórico guardado | Firebase sigue importado para instalaciones con flags Supabase apagadas; el servicio tiene un branch Supabase previo al fallback funcional |
| Bloqueado explícitamente | La superficie todavía no tiene adapter administrativo equivalente y devuelve una pantalla/estado honesto en modo Supabase |
| Fallback interno restante | La misma superficie contiene rutas Firebase para compatibilidad; cada branch Supabase debe seguir siendo revisado si se amplía el producto |
| Fase posterior | Servicio o backup que no forma parte del flujo Supabase activo y debe migrarse, retirarse o mantenerse fuera del bundle en una limpieza posterior |

## Superficies visibles y montadas

| Archivo o módulo | Referencia Firebase | Clasificación | Estado |
|---|---|---|---|
| `src/contexts/AuthContext.jsx` | Firebase Auth y Firestore para fallback histórico | Fallback histórico guardado | `AuthContext` selecciona `SupabaseAuthProvider` cuando ambas flags están activas |
| `src/App.jsx` / `RewardInboxListener` | Firestore para historial local de modales | Fallback histórico guardado | Carga y persistencia Firestore quedan condicionadas a `!isSupabaseAuthEnabled()`; rewards Supabase se suscribe por adapter |
| `src/pages/ChatPage.jsx` | `auth`, `db`, `getDoc`, `deleteDoc` y textos legacy | Fallback histórico guardado | ID activo usa `appUser` Supabase; el flujo de envío/eliminación delega al backend Supabase antes del fallback |
| `src/pages/ChatSecondaryPage.jsx` | Dependencias transitivas de chat legacy | Fallback histórico guardado | Usa `chatService`; no debe activar Firestore cuando el selector Supabase está activo |
| `src/components/chat/ChatInput.jsx` | Firebase Storage para fallback | Fallback histórico guardado | Upload público Supabase retorna metadata de Storage; Firebase queda para flags apagadas |
| `src/components/chat/GlobalPrivateChatWindow.jsx` | No importa Firebase directamente | Supabase activo | Monta `PrivateChatWindowV2` |
| `src/components/chat/PrivateChatWindowV2.jsx` | Firestore/Storage en branches legacy | Fallback histórico guardado | Branch Supabase usa `supabasePrivateChatService`, `chat-private` y URLs firmadas; las consultas Firebase están detrás de guards |
| `src/components/chat/PrivateChatWindow.jsx` | Firestore/Storage legacy | Bloqueado explícitamente | Devuelve estado no disponible cuando Supabase está activo; no debe montarse desde GlobalPrivateChatWindow |
| `src/components/baul/BaulPromoCard.jsx` | Firestore para conteos legacy | Fallback histórico guardado | En Supabase consulta `room_presence` y `baul_cards`; no inventa usuarios |
| `src/components/esencias/EsenciasColumn.jsx` | Firebase legacy | Fallback histórico guardado | Identidad activa se toma del usuario normalizado/adapter Supabase |
| `src/pages/AdminPage.jsx` | Firestore y listeners administrativos | Bloqueado explícitamente | Se detiene antes de sus listeners Firebase en modo Supabase |
| `src/pages/AdminCleanup.jsx` | `deleteDoc` sobre salas Firebase | Bloqueado explícitamente | Se detiene antes de operaciones destructivas Firebase |
| `src/components/admin/AdminChatWindow.jsx` | Firestore para chat/usuarios admin | Bloqueado explícitamente | Se detiene si Supabase está activo |
| `src/pages/AdminTicketsPage.jsx` | Consume `ticketService` | Adapter Supabase disponible | Debe probarse con rol admin real; no asumir que ser usuario autenticado basta |
| `src/pages/TicketDetailPage.jsx` | Consume `ticketService` | Adapter Supabase disponible | Mensajes externos y logs requieren prueba RLS; notas internas no están soportadas por la RPC actual |

## Servicios con branch Supabase

| Servicio | Firebase que permanece | Clasificación | Observación |
|---|---|---|---|
| `chatService.js` | Firestore, Storage y Auth en `doSendMessage` | Fallback histórico guardado | `sendMessage` retorna al adapter Supabase antes de entrar en `doSendMessage` |
| `supabaseChatService.js` | Ninguno funcional | Supabase activo | Public chat, replies, reactions, media y Realtime |
| `supabasePrivateChatService.js` | Ninguno funcional | Supabase activo | Conversations, private messages, receipts, typing, requests y notifications |
| `socialService.js` | Firestore/private chat legacy | Fallback histórico guardado | Branch Supabase delega solicitudes, mensajes y contacto al adapter/RPC |
| `opinService.js` | Firestore/Auth legacy | Fallback histórico guardado | Branch Supabase delega OPIN a `supabaseOpinService` |
| `tarjetaService.js` | Firestore/Functions legacy | Fallback histórico guardado | Branch Supabase usa `supabaseBaulService`; Baúl permanece disabled |
| `supabaseBaulService.js` | Ninguno funcional | Supabase preparado, no activado | Likes deterministas, match reads, media privada y presencia por lote |
| `photoUploadService.js` | Firebase Auth para fallback | Fallback histórico guardado | Supabase usa `supabaseMediaService`; no subir service-role al frontend |
| `presenceService.js` | Firestore/Auth legacy | Fallback histórico guardado | Supabase delega a `supabasePresenceService` |
| `blockService.js` | Firestore legacy | Fallback histórico guardado | Supabase usa `public.blocks` y Realtime |
| `reportService.js` | Firestore/Auth legacy | Fallback histórico guardado | Supabase usa tabla/RLS y debe probarse con datos reales |
| `moderationService.js`, `sanctionsService.js`, `antiSpamService.js`, `moderationAIService.js` | Firestore/Functions legacy | Fallback histórico guardado | Supabase usa RPCs/auditoría reducida; no hay chatbot/bot automático activo |
| `systemNotificationsService.js` | Firestore legacy | Fallback histórico guardado | Supabase usa `notifications`; no depende de FCM para modo Supabase |
| `pushNotificationService.js` | Firebase Messaging/Firestore | Desactivado en modo Supabase | Retorna no-op/false de forma explícita; requiere diseño server-side posterior si se desea push |
| `eventosService.js`, `verificationService.js`, `rewardsService.js`, `badgeService.js` | Firestore/Auth legacy | Fallback histórico guardado | Branch Supabase usa tablas/RPCs; flags de perfil están protegidos por trigger |
| `ticketService.js` | Firestore legacy | Fallback histórico guardado | Branch Supabase usa tickets, messages, logs y RPC externa |
| `analyticsService.js`, `limitService.js` | Firestore legacy | Fallback histórico guardado | Branch Supabase usa eventos/cuotas persistentes |
| `forumService.js`, `esenciasService.js`, `featuredAdsService.js`, `topParticipantsService.js`, `contactSafetyTelemetryService.js` | Firestore legacy | Fallback histórico guardado | Branch Supabase añadido; requiere pruebas de contrato y datos reales |
| `userNotificationDispatchService.js` | Firebase Functions callable | Desactivado en modo Supabase | Evita Functions Firebase sin equivalente seguro |

## Archivos no productivos o de fase posterior

| Archivo | Motivo para no tratarlo como runtime nuevo |
|---|---|
| `src/services/activityService.js` | Servicio histórico sin branch Supabase; debe migrarse o excluirse de rutas Supabase si alguna pantalla lo monta |
| `src/services/adminService.js` | Operaciones administrativas Firebase; no reactivar en modo Supabase sin adapter y RLS equivalente |
| `src/services/adminFeaturePulseService.js` | Métricas administrativas Firebase; requiere fuente Supabase antes de utilizarse |
| `src/services/adminRoomHistoryService.js` | Callable Firebase; debe permanecer fuera de la consola Supabase hasta migrarse |
| `src/lib/avatars/avatarStorage.js` | Utilidad de avatar legacy; revisar si alguna pantalla la importa directamente fuera de `photoUploadService` |
| `src/services/photoUploadService.BACKUP.js` y `photoUploadService.OPTIMIZADO.js` | Backups históricos, no deben importarse como rutas de producción |
| `src/pages/ChatPage.backup.jsx` | Backup que monta `PrivateChatWindow` legacy; no es la ruta activa de `App.jsx` |
| `src/config/firebase.js` | Configuración histórica necesaria para fallback; no implica que Supabase use Firebase en modo activo |

## Reglas de mantenimiento

Toda nueva función debe elegir primero el proveedor activo y no consultar `auth.currentUser`, Firestore, Firebase Storage o Firebase Functions antes de esa decisión. Si no existe adapter Supabase, la UI debe bloquearse o mostrar “no disponible”, nunca caer silenciosamente a Firebase.

Las referencias Firebase que queden en el bundle deben considerarse deuda técnica y compatibilidad transitoria. La siguiente fase puede eliminar backups, dividir servicios administrativos y retirar imports no utilizados después de comprobar con `rg`, el grafo de imports y una build limpia que ninguna ruta visible los necesita.

La presencia de Firebase en el bundle no debe confundirse con una dependencia funcional de las nuevas altas, sesiones, mensajes, fotos, OPIN o Baúl. Esa afirmación solo es válida bajo las flags Supabase activas y después de ejecutar las migraciones y pruebas remotas pendientes.
