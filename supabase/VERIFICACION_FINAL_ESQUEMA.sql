-- Verificación final de Supabase para 0001–0006.
-- Solo lectura: no inserta, actualiza ni elimina datos.

-- 1) Tablas esperadas y estado de RLS.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles', 'profile_private_settings', 'user_preferences', 'rooms',
    'messages', 'message_reactions', 'message_receipts', 'conversations',
    'conversation_members', 'private_messages', 'private_requests',
    'opin_posts', 'opin_comments', 'opin_likes', 'opin_reactions',
    'opin_actions', 'opin_follows', 'opin_saves', 'room_presence',
    'blocks', 'reports', 'moderation_actions', 'notifications',
    'media_objects', 'audit_events', 'user_migration_map'
  )
order by c.relname;

-- 2) Políticas RLS existentes. No muestra contenido de usuarios.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles', 'profile_private_settings', 'user_preferences', 'rooms',
    'messages', 'message_reactions', 'message_receipts', 'conversations',
    'conversation_members', 'private_messages', 'private_requests',
    'opin_posts', 'opin_comments', 'opin_likes', 'opin_reactions',
    'opin_actions', 'opin_follows', 'opin_saves', 'room_presence',
    'blocks', 'reports', 'moderation_actions', 'notifications',
    'media_objects', 'audit_events', 'user_migration_map'
  )
order by tablename, policyname;

-- 3) Triggers críticos del esquema.
select
  event_object_schema as schema_name,
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and (
    trigger_name ilike '%profile%'
    or trigger_name ilike '%updated%'
    or trigger_name ilike '%opin%'
    or trigger_name ilike '%presence%'
  )
order by event_object_table, trigger_name, event_manipulation;

-- 4) Funciones críticas instaladas por las migraciones.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'set_updated_at',
    'handle_new_user_profile',
    'sync_opin_like_counter'
  )
order by p.proname;

-- 5) Tablas expuestas en la publicación Realtime.
select
  schemaname,
  tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in (
    'rooms', 'messages', 'message_reactions', 'message_receipts',
    'conversations', 'conversation_members', 'private_messages',
    'private_requests', 'opin_posts', 'opin_comments', 'opin_likes',
    'opin_reactions', 'opin_actions', 'room_presence', 'notifications'
  )
order by tablename;

-- 6) Columnas de seguridad y presencia esperadas.
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'room_presence' and column_name in (
      'room_id', 'user_id', 'is_online', 'connection_status',
      'available_for_chat', 'available_for_chat_expires_at',
      'in_private_with', 'comuna', 'last_seen_at', 'created_at', 'updated_at'
    ))
    or (table_name = 'opin_posts' and column_name in (
      'id', 'author_id', 'content', 'is_guest', 'like_count', 'updated_at'
    ))
    or (table_name = 'notifications' and column_name in (
      'id', 'user_id', 'type', 'created_at', 'read_at'
    ))
  )
order by table_name, ordinal_position;
