# Supabase: último paso manual pendiente

## Estado confirmado

Esta rama contiene el adaptador/configuración Supabase y `VERIFICACION_FINAL_ESQUEMA.sql`, pero `supabase/migrations/` solo contiene `.gitkeep`. La búsqueda en el historial Git local, refs recuperables y respaldos de esta sesión no encontró copias ejecutables de las migraciones `0001`–`0006`.

Por seguridad, **no se reconstruye SQL de memoria ni se inventan columnas, tipos, políticas RLS, triggers o funciones**. El archivo `VERIFICACION_FINAL_ESQUEMA.sql` es solo de lectura: verifica tablas, RLS, políticas, triggers, funciones y publicación Realtime, pero no crea ni modifica nada.

## Superficie de esquema documentada por la verificación existente

La verificación enumera estas tablas esperadas en `public`: `profiles`, `profile_private_settings`, `user_preferences`, `rooms`, `messages`, `message_reactions`, `message_receipts`, `conversations`, `conversation_members`, `private_messages`, `private_requests`, `opin_posts`, `opin_comments`, `opin_likes`, `opin_reactions`, `opin_actions`, `opin_follows`, `opin_saves`, `room_presence`, `blocks`, `reports`, `moderation_actions`, `notifications`, `media_objects`, `audit_events` y `user_migration_map`. También espera las funciones `set_updated_at`, `handle_new_user_profile` y `sync_opin_like_counter`, además de una publicación Realtime para las superficies indicadas en el SQL de verificación.

Esta lista es **un inventario de verificación, no una especificación suficiente para crear las tablas**. No autoriza a inferir el esquema exacto.

## Qué debe hacer Daniel mañana

1. Recuperar los textos originales de `0001` a `0006` desde una exportación, la conversación anterior o el historial de archivos donde fueron ejecutados. Deben conservarse en orden y revisarse antes de copiar.
2. Pegar y ejecutar una migración por vez en el editor SQL de Supabase, empezando por `0001` y deteniéndose ante cualquier error. No ejecutar un bloque improvisado que combine tablas o políticas desconocidas.
3. No activar todavía `VITE_ENABLE_SUPABASE`, `VITE_DATA_BACKEND`, `VITE_USE_SUPABASE_AUTH`, `VITE_USE_SUPABASE_CHAT` ni `VITE_USE_SUPABASE_OPIN`. La rama queda Firebase-first hasta completar pruebas y autorización de preview.
4. Después de ejecutar las seis migraciones originales, ejecutar `supabase/VERIFICACION_FINAL_ESQUEMA.sql` y guardar el resultado de estructura/políticas, sin exportar ni compartir datos personales.
5. Solo después de verificar RLS, triggers, Realtime y compatibilidad con los adapters se podrá preparar un preview secuencial. La migración de usuarios Firebase y el mapa `user_migration_map` son una fase posterior; no se realizan en este paso.

## Criterio de detención

Si no aparecen los SQL originales, la acción correcta es restaurarlos desde una fuente confiable o pedir un nuevo volcado de esquema sin datos. **No se debe usar este documento para crear tablas por aproximación.** Hasta entonces, Supabase permanece preparado pero no es el backend activo de esta rama.

## Archivos relacionados

- `supabase/VERIFICACION_FINAL_ESQUEMA.sql`: comprobación de solo lectura.
- `src/config/supabase.js`: cliente condicionado por flags.
- `src/services/supabaseAuthService.js`: adapter de autenticación preparado.
- `src/services/supabaseChatService.js`: adapter de chat preparado.
- `documentacion_md/07-firebase-supabase-db/PREPARACION_SUPABASE_PARA_CUTOVER_2026-04-24.md`: guía de cutover progresivo y banderas Firebase-first.
