-- Chactivo / Supabase-first: verificación posterior a la ejecución manual.
-- Estas consultas son de lectura. Ejecutarlas después de aplicar las migraciones.
-- No muestran mensajes privados, teléfonos, emails, perfiles privados ni cuerpos de mensajes.
-- La presencia de filas/tablas no demuestra por sí sola que la UI esté operativa; revisar también
-- errores del Dashboard y ejecutar pruebas RLS/pgTAP en un entorno de prueba.

-- 1) Tablas públicas esperadas.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles','profile_private_settings','user_preferences','user_migration_map','rooms',
    'messages','message_reactions','message_receipts','conversations','conversation_members',
    'private_messages','private_message_receipts','private_requests','private_typing','room_presence',
    'notifications','blocks','reports','moderation_actions','audit_events','media_objects',
    'opin_posts','opin_comments','opin_likes','opin_reactions','opin_saves','opin_follows','opin_actions',
    'baul_cards','baul_likes','baul_matches','baul_match_reads','baul_notes','baul_footprints',
    'baul_visits','baul_impressions','baul_actions','contacts','saved_profiles',
    'events','event_attendees','user_verification','user_rewards','tickets','ticket_messages','ticket_logs',
    'analytics_events','analytics_daily','daily_user_limits','esencias','forum_threads','forum_replies',
    'forum_votes','featured_ads','contact_safety_events','contact_safety_profiles'
  )
order by table_name;

-- 2) RLS activo en las tablas públicas que exponen datos o reciben datos.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','profile_private_settings','user_preferences','rooms','messages','message_reactions',
    'message_receipts','conversations','conversation_members','private_messages','private_message_receipts',
    'private_requests','private_typing','room_presence','notifications','blocks','reports',
    'moderation_actions','audit_events','media_objects','opin_posts','opin_comments','opin_likes',
    'opin_reactions','opin_saves','opin_follows','opin_actions','baul_cards','baul_likes','baul_matches',
    'baul_match_reads','baul_notes','baul_footprints','baul_visits','baul_impressions','baul_actions',
    'contacts','saved_profiles','events','event_attendees','user_verification','user_rewards',
    'tickets','ticket_messages','ticket_logs','analytics_events','analytics_daily','daily_user_limits',
    'esencias','forum_threads','forum_replies','forum_votes','featured_ads','contact_safety_events',
    'contact_safety_profiles'
  )
order by tablename;

-- 3) Policies de Storage. Revisar que card-media, chat-public y chat-private sean privados.
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 4) Buckets esperados y privacidad efectiva.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('avatars','card-media','chat-public','chat-private')
order by id;

-- 5) Publicación Realtime. Las tablas presentes aquí son las habilitadas en la publicación.
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
order by tablename;

-- 6) RPCs esenciales instaladas; no devuelve sus cuerpos ni datos de usuarios.
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
       has_function_privilege('public', p.oid, 'EXECUTE') as public_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_or_create_direct_conversation','send_private_request','send_private_message',
    'respond_private_request','mark_private_message_receipts','mark_private_conversation_read',
    'toggle_baul_like','set_baul_like','record_baul_daily_event','send_baul_note',
    'get_my_baul_unread_match_count','mark_my_baul_match_read','record_opin_action',
    'record_moderation_violation','admin_delete_public_message','admin_delete_public_messages',
    'create_system_notification','send_ticket_message','record_analytics_event',
    'increment_my_daily_limit','record_contact_safety_event','record_featured_ad_click',
    'increment_my_event_participation','toggle_forum_vote','increment_forum_view',
    'profile_system_write_authorized','sync_private_request_notification_state'
  )
order by function_name, arguments;

-- 7) Columnas críticas: confirma que el contrato de media, replies y flags existe.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in (
      'id','username','avatar_url','role','is_guest','is_premium','verified',
      'has_special_avatar','is_featured','is_moderator','is_pro_user',
      'can_upload_second_photo','has_featured_card','has_rainbow_border','has_pro_badge',
      'chat_photo_access','badge','events_participated'
    ))
    or (table_name = 'messages' and column_name in ('author_id','client_id','media_path','media_bucket','reply_to','deleted_at'))
    or (table_name = 'private_messages' and column_name in ('sender_id','client_id','media_path','media_bucket','reply_to','deleted_at'))
    or (table_name = 'baul_cards' and column_name in ('user_id','foto_url','foto_path','foto_bucket','foto2_path','foto2_bucket'))
    or (table_name = 'baul_match_reads' and column_name in ('user_a','user_b','user_id','read_at'))
  )
order by table_name, column_name;

-- 8) Índices mínimos para consultas de identidad, feed, receipts, Baúl y tickets.
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and (
    tablename in ('profiles','messages','message_reactions','private_messages','private_message_receipts',
                  'notifications','baul_cards','baul_matches','baul_match_reads','tickets','ticket_messages')
    or indexname like '%user%'
  )
order by tablename, indexname;

-- 9) Comprobación de que el esquema no creó columnas obvias de claves secretas.
select count(*) as suspicious_service_key_columns
from information_schema.columns
where lower(column_name) in ('service_role_key','service_key','private_key','firebase_private_key','anon_key');

-- 10) Evidencia de instalación, no de operación completa.
select current_database() as database_name, current_user as executing_role, now() as checked_at;
-- No ejecutar consultas de contenido para probar chats, teléfonos, perfiles privados o cuerpos de OPIN.
