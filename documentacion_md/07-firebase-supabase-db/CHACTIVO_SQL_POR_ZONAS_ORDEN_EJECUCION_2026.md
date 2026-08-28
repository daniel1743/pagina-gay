# Chactivo — paquete SQL de Supabase por zonas

**Documento ejecutable manualmente · orden obligatorio · preparado localmente**

> Este documento contiene las migraciones versionadas que existen en el repositorio de Chactivo. No fueron ejecutadas ni validadas contra el proyecto remoto de Supabase desde esta sesión. Debes ejecutar cada bloque manualmente, en orden, y detenerte ante el primer error.

## Cómo usar este documento

Crea o abre el proyecto Supabase correcto de Chactivo y utiliza el **SQL Editor**. Ejecuta `SQL 1` y espera el resultado; después continúa con `SQL 2`, y así sucesivamente hasta `SQL 35`. Cada bloque reproduce el archivo versionado correspondiente de `supabase/migrations/` y debe pegarse completo, sin mezclarlo con otro bloque.

Si una migración ya fue aplicada anteriormente, **no la ejecutes de nuevo a ciegas**. Algunas instrucciones son defensivas, pero las políticas, triggers y permisos pueden producir conflictos al repetirse. En ese caso conserva el resultado existente y continúa sólo después de comprobar en el panel de Supabase que el objeto y su definición son los esperados.

No actives todavía las banderas de producción ni migres usuarios Firebase durante esta carga. Primero completa el esquema, ejecuta la verificación final y prueba autenticación, perfiles, Storage, chat, OPIN y permisos con una cuenta de prueba propia. La autenticación histórica de Firebase no se convierte automáticamente por estas SQL.

## Orden maestro y zonas

| SQL | Migración | Zona | Función |
|---:|---|---|---|
| 1 | `202608270001_identity_profiles.sql` | Zona 1: Identidad, perfiles y salas base | Migración versionada |
| 2 | `202608270002_chat_private_moderation.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 3 | `202608270003_opin_baul_media.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 4 | `202608270004_rls_storage_realtime.sql` | Zona 4: Seguridad, RLS, Storage, Realtime y permisos | Migración versionada |
| 5 | `202608270005_baul_rpc.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 6 | `202608270006_private_chat_rpc.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 7 | `202608270007_opin_metrics.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 8 | `202608270008_private_contacts.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 9 | `202608270009_moderation_rpc.sql` | Zona 5: Moderación, denuncias y seguridad comunitaria | Migración versionada |
| 10 | `202608270010_public_chat_moderation.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 11 | `202608270011_system_notifications.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 12 | `202608270012_chat_states.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 13 | `202608270013_reports_moderation.sql` | Zona 5: Moderación, denuncias y seguridad comunitaria | Migración versionada |
| 14 | `202608270014_events.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 15 | `202608270015_verification.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 16 | `202608270016_rewards.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 17 | `202608270017_activity_ranking.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 18 | `202608270018_tickets.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 19 | `202608270019_analytics.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 20 | `202608270020_daily_limits.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 21 | `202608270021_esencias.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 22 | `202608270022_forum.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 23 | `202608270023_contact_safety.sql` | Zona 5: Moderación, denuncias y seguridad comunitaria | Migración versionada |
| 24 | `202608270024_badges.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 25 | `202608270025_featured_ads.sql` | Zona 6: Comunidad, eventos, verificación, soporte y analítica | Migración versionada |
| 26 | `202608270026_baul_media_paths.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 27 | `202608270027_chat_replies_profile_guards.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 28 | `202608270028_private_replies_rpc.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 29 | `202608270029_security_definer_grants.sql` | Zona 4: Seguridad, RLS, Storage, Realtime y permisos | Migración versionada |
| 30 | `202608270030_baul_set_like.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 31 | `202608270031_baul_match_reads.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 32 | `202608270032_baul_media_read_policies.sql` | Zona 3: OPIN, Baúl, contactos y media | Migración versionada |
| 33 | `202608270033_ticket_log_hardening.sql` | Zona 5: Moderación, denuncias y seguridad comunitaria | Migración versionada |
| 34 | `202608270034_private_request_notification_state.sql` | Zona 2: Chat público, chat privado y estado de conversación | Migración versionada |
| 35 | `202608270035_explicit_table_grants.sql` | Zona 4: Seguridad, RLS, Storage, Realtime y permisos | Migración versionada |

## Reglas de seguridad antes de pegar SQL

No pegues claves anon, service-role keys, contraseñas, tokens ni datos personales en este documento o en el SQL Editor. Haz una copia de seguridad del proyecto correcto, confirma que el esquema seleccionado es `public` y conserva los mensajes de error completos si alguna instrucción falla.

Las migraciones contienen tablas, funciones, triggers, políticas RLS, Storage y permisos. Una ejecución parcial puede dejar el esquema a mitad de camino. Si falla una sección, no saltes a la siguiente: guarda el error, revisa qué objetos sí se crearon y solicita una corrección específica antes de reintentar.

## Bloques ejecutables en orden numérico

Los bloques siguientes están ordenados de `SQL 01` a `SQL 35`. La zona aparece en el encabezado de cada bloque para facilitar la revisión, pero **debes ejecutarlos exactamente en este orden numérico**, no agrupando por zona.

### SQL 01 — Zona 1: Identidad, perfiles y salas base

**Archivo fuente:** `supabase/migrations/202608270001_identity_profiles.sql`

```sql
-- Chactivo / Supabase migration 001
-- Identity and public profile foundation.
-- This file is prepared locally and is NOT executed by this task.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 2 and 40),
  email text,
  avatar_url text,
  display_name text,
  bio text check (bio is null or char_length(bio) <= 800),
  age smallint check (age is null or age between 18 and 120),
  profile_role text,
  comuna text check (comuna is null or char_length(comuna) <= 80),
  is_guest boolean not null default false,
  is_premium boolean not null default false,
  verified boolean not null default false,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  profile_visible boolean not null default true,
  community_policy_accepted_at timestamptz,
  community_policy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.profile_private_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  show_age boolean not null default false,
  show_comuna boolean not null default true,
  allow_private_messages boolean not null default true,
  allow_card_interactions boolean not null default true,
  searchable boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  locale text not null default 'es',
  timezone text not null default 'America/Santiago',
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_migration_map (
  firebase_uid text primary key check (char_length(firebase_uid) between 1 and 128),
  supabase_user_id uuid unique references public.profiles(id) on delete set null,
  migration_status text not null default 'pending'
    check (migration_status in ('pending', 'imported', 'linked', 'recovery_required', 'skipped', 'error')),
  migration_method text,
  imported_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key check (char_length(id) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  is_active boolean not null default true,
  is_public boolean not null default true,
  min_age smallint check (min_age is null or min_age between 18 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.rooms (id, name, description)
values
  ('principal', 'Chat Principal', 'Sala principal de conversación'),
  ('gaming', 'Gaming', 'Chat para gamers'),
  ('mas-30', '+30', 'Chat para mayores de 30'),
  ('amistad', 'Amistad', 'Chat para hacer amigos'),
  ('osos-activos', 'Osos Activos', 'Chat para osos activos'),
  ('pasivos-buscando', 'Pasivos Buscando', 'Chat para pasivos'),
  ('versatiles', 'Versátiles', 'Chat para versátiles'),
  ('quedar-ya', 'Quedar Ya', 'Chat para quedar ya'),
  ('hablar-primero', 'Hablar Primero', 'Chat para iniciar conversación'),
  ('morbosear', 'Morbosear', 'Chat para conversar con intención')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    email,
    display_name,
    profile_role,
    is_guest,
    community_policy_accepted_at,
    community_policy_version
  )
  values (
    new.id,
    coalesce(nullif(left(new.raw_user_meta_data ->> 'username', 40), ''), 'Usuario_' || left(replace(new.id::text, '-', ''), 8)),
    lower(new.email),
    nullif(left(new.raw_user_meta_data ->> 'display_name', 120), ''),
    nullif(left(new.raw_user_meta_data ->> 'profile_role', 40), ''),
    coalesce((new.is_anonymous is true), false),
    case
      when coalesce((new.raw_user_meta_data ->> 'community_policy_accepted')::boolean, false)
        then now()
      else null
    end,
    nullif(left(new.raw_user_meta_data ->> 'community_policy_version', 40), '')
  )
  on conflict (id) do nothing;

  insert into public.profile_private_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists profile_private_settings_set_updated_at on public.profile_private_settings;
create trigger profile_private_settings_set_updated_at
before update on public.profile_private_settings
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

drop trigger if exists user_migration_map_set_updated_at on public.user_migration_map;
create trigger user_migration_map_set_updated_at
before update on public.user_migration_map
for each row execute function public.set_updated_at();

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

comment on table public.user_migration_map is
  'Private mapping from historical Firebase UID to Supabase Auth UUID; never expose through public views or client policies.';
comment on table public.profiles is
  'Safe public identity fields owned by the Supabase Auth user.';
```

### SQL 02 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270002_chat_private_moderation.sql`

```sql
-- Chactivo / Supabase migration 002
-- Public chat, private chat, presence, notifications and moderation primitives.
-- This file is prepared locally and is NOT executed by this task.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  message_type text not null default 'text'
    check (message_type in ('text', 'image', 'system')),
  client_id text check (client_id is null or char_length(client_id) between 8 and 160),
  media_path text,
  media_bucket text,
  media_mime text check (media_mime is null or media_mime in ('image/jpeg', 'image/png', 'image/webp')),
  media_size integer check (media_size is null or media_size between 1 and 143360),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_media_consistency check (
    (message_type = 'image' and media_path is not null and media_bucket is not null and media_mime is not null and media_size is not null)
    or (message_type <> 'image' and media_path is null and media_bucket is null and media_mime is null and media_size is null)
  )
);

create index if not exists messages_room_created_idx
  on public.messages (room_id, created_at desc);
create index if not exists messages_author_created_idx
  on public.messages (author_id, created_at desc);
create unique index if not exists messages_room_client_id_idx
  on public.messages (room_id, author_id, client_id)
  where client_id is not null;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id),
  check (read_at is null or delivered_at is not null)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct', 'group')),
  direct_key text unique check (direct_key is null or char_length(direct_key) between 3 and 180),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text check (title is null or char_length(title) between 1 and 120),
  last_message_id uuid,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_type text,
  last_message_sender_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member' check (member_role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  muted boolean not null default false,
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id, joined_at desc);
create unique index if not exists conversations_direct_key_idx
  on public.conversations (direct_key)
  where direct_key is not null;

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null check (char_length(client_id) between 8 and 160),
  content text not null check (char_length(content) between 1 and 2000),
  message_type text not null default 'text'
    check (message_type in ('text', 'image', 'system')),
  media_path text,
  media_bucket text,
  media_mime text check (media_mime is null or media_mime in ('image/jpeg', 'image/png', 'image/webp')),
  media_size integer check (media_size is null or media_size between 1 and 143360),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint private_messages_media_consistency check (
    (message_type = 'image' and media_path is not null and media_bucket is not null and media_mime is not null and media_size is not null)
    or (message_type <> 'image' and media_path is null and media_bucket is null and media_mime is null and media_size is null)
  ),
  unique (conversation_id, sender_id, client_id)
);

create index if not exists private_messages_conversation_created_idx
  on public.private_messages (conversation_id, created_at desc);
create index if not exists private_messages_sender_created_idx
  on public.private_messages (sender_id, created_at desc);

alter table public.conversations
  drop constraint if exists conversations_last_message_id_fkey;
alter table public.conversations
  add constraint conversations_last_message_id_fkey
  foreign key (last_message_id) references public.private_messages(id) on delete set null;

alter table public.conversations add column if not exists direct_key text;
alter table public.conversations add column if not exists last_message_preview text;
alter table public.conversations add column if not exists last_message_type text;
alter table public.conversations add column if not exists last_message_sender_id uuid references public.profiles(id) on delete set null;

create table if not exists public.private_typing (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null default '' check (char_length(username) <= 80),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists private_typing_conversation_updated_idx
  on public.private_typing (conversation_id, updated_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table if not exists public.private_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'blocked')),
  message text check (message is null or char_length(message) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create unique index if not exists private_requests_open_pair_idx
  on public.private_requests (requester_id, recipient_id)
  where status = 'pending';
create index if not exists private_requests_recipient_status_idx
  on public.private_requests (recipient_id, status, created_at desc);
create index if not exists private_requests_requester_status_idx
  on public.private_requests (requester_id, status, created_at desc);

drop trigger if exists private_requests_set_updated_at on public.private_requests;
create trigger private_requests_set_updated_at
before update on public.private_requests
for each row execute function public.set_updated_at();

create table if not exists public.room_presence (
  room_id text not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_online boolean not null default false,
  connection_status text not null default 'offline'
    check (connection_status in ('online', 'idle', 'offline')),
  available_for_chat boolean not null default false,
  available_for_chat_expires_at timestamptz,
  in_private_with uuid references public.profiles(id) on delete set null,
  comuna text check (comuna is null or char_length(comuna) <= 80),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists room_presence_room_online_idx
  on public.room_presence (room_id, is_online, last_seen_at desc);

drop trigger if exists room_presence_set_updated_at on public.room_presence;
create trigger room_presence_set_updated_at
before update on public.room_presence
for each row execute function public.set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (char_length(type) between 1 and 80),
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (char_length(content) between 1 and 500),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, created_at desc);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 240),
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  private_message_id uuid references public.private_messages(id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 120),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (reported_user_id is not null or message_id is not null or private_message_id is not null)
);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  action_type text not null check (char_length(action_type) between 1 and 80),
  reason text check (reason is null or char_length(reason) <= 1000),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 100),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### SQL 03 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270003_opin_baul_media.sql`

```sql
-- Chactivo / Supabase migration 003
-- OPIN, Baul, contacts, matches and media metadata.
-- This file is prepared locally and is NOT executed by this task.

create table if not exists public.media_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  bucket_id text not null check (bucket_id in ('avatars', 'card-media', 'chat-public', 'chat-private')),
  object_path text not null check (char_length(object_path) between 1 and 500),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer not null check (byte_size between 1 and 10485760),
  visibility text not null default 'private' check (visibility in ('public', 'authenticated', 'private')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket_id, object_path)
);

create index if not exists media_objects_owner_created_idx
  on public.media_objects (owner_id, created_at desc);

create table if not exists public.opin_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 160),
  content text not null check (char_length(content) between 1 and 3000),
  color text not null default 'purple' check (char_length(color) between 1 and 40),
  status text not null default 'buscando' check (status in ('buscando', 'hablando', 'quiero_mas', 'cerrado', 'active', 'hidden', 'deleted', 'expired')),
  type text not null default 'crush' check (char_length(type) between 1 and 60),
  intent_type text check (intent_type is null or char_length(intent_type) between 1 and 60),
  intent_expires_at timestamptz,
  expires_at timestamptz,
  contact_method text not null default 'chactivo' check (char_length(contact_method) between 1 and 40),
  contact_value text check (contact_value is null or char_length(contact_value) <= 200),
  image_url text,
  is_guest boolean not null default false,
  is_active boolean not null default true,
  is_stable boolean not null default false,
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  view_count integer not null default 0 check (view_count >= 0),
  profile_click_count integer not null default 0 check (profile_click_count >= 0),
  reaction_counts jsonb not null default '{}'::jsonb,
  last_comment_at timestamptz,
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists opin_posts_feed_idx
  on public.opin_posts (status, created_at desc);
create index if not exists opin_posts_author_idx
  on public.opin_posts (author_id, created_at desc);

drop trigger if exists opin_posts_set_updated_at on public.opin_posts;
create trigger opin_posts_set_updated_at
before update on public.opin_posts
for each row execute function public.set_updated_at();

create table if not exists public.opin_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.opin_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1200),
  status text not null default 'active' check (status in ('active', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists opin_comments_post_created_idx
  on public.opin_comments (post_id, created_at desc);

drop trigger if exists opin_comments_set_updated_at on public.opin_comments;
create trigger opin_comments_set_updated_at
before update on public.opin_comments
for each row execute function public.set_updated_at();

create table if not exists public.opin_likes (
  post_id uuid not null references public.opin_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.opin_reactions (
  post_id uuid not null references public.opin_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (char_length(reaction) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

create table if not exists public.opin_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.opin_posts(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('view', 'share', 'open_profile', 'open_chat', 'report')),
  created_at timestamptz not null default now()
);

create index if not exists opin_actions_post_created_idx
  on public.opin_actions (post_id, created_at desc);

create table if not exists public.opin_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.opin_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.opin_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.baul_cards (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  card_visible boolean not null default false,
  intent_type text not null default 'conversar'
    check (intent_type in ('conversar', 'ligar_ahora', 'ligar_esta_semana', 'amistad', 'panorama', 'sin_definir')),
  intent_text text check (intent_text is null or char_length(intent_text) <= 280),
  intent_expires_at timestamptz,
  comuna text check (comuna is null or char_length(comuna) <= 80),
  mostrar_edad boolean not null default false,
  foto_url text,
  legacy_buscando text check (legacy_buscando is null or char_length(legacy_buscando) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists baul_cards_visible_expiry_idx
  on public.baul_cards (card_visible, intent_expires_at, updated_at desc);
create index if not exists baul_cards_comuna_idx
  on public.baul_cards (comuna, updated_at desc);

drop trigger if exists baul_cards_set_updated_at on public.baul_cards;
create trigger baul_cards_set_updated_at
before update on public.baul_cards
for each row execute function public.set_updated_at();

create table if not exists public.baul_likes (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id),
  check (actor_id <> target_id)
);

create index if not exists baul_likes_target_idx
  on public.baul_likes (target_id, created_at desc);

create table if not exists public.baul_footprints (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  local_day date not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id, local_day),
  check (actor_id <> target_id)
);

create index if not exists baul_footprints_target_day_idx
  on public.baul_footprints (target_id, local_day desc);

create table if not exists public.baul_visits (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  local_day date not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id, local_day),
  check (actor_id <> target_id)
);

create table if not exists public.baul_impressions (
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  local_day date not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, target_id, local_day),
  check (actor_id <> target_id)
);

create table if not exists public.baul_notes (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  check (actor_id <> target_id)
);

create index if not exists baul_notes_target_created_idx
  on public.baul_notes (target_id, created_at desc);

create table if not exists public.baul_matches (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create index if not exists baul_matches_user_a_idx on public.baul_matches (user_a, updated_at desc);
create index if not exists baul_matches_user_b_idx on public.baul_matches (user_b, updated_at desc);

drop trigger if exists baul_matches_set_updated_at on public.baul_matches;
create trigger baul_matches_set_updated_at
before update on public.baul_matches
for each row execute function public.set_updated_at();

create table if not exists public.contacts (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  label text check (label is null or char_length(label) <= 120),
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id),
  check (owner_id <> contact_id)
);

create table if not exists public.saved_profiles (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, profile_id),
  check (owner_id <> profile_id)
);
```

### SQL 04 — Zona 4: Seguridad, RLS, Storage, Realtime y permisos

**Archivo fuente:** `supabase/migrations/202608270004_rls_storage_realtime.sql`

```sql
-- Chactivo / Supabase migration 004
-- Row Level Security, Storage policies and Realtime publication.
-- This file is prepared locally and is NOT executed by this task.

create or replace function public.is_conversation_member(target_conversation_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = coalesce(target_user_id, auth.uid())
      and cm.left_at is null
  );
$$;

create or replace function public.is_admin_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(target_user_id, auth.uid())
      and p.role in ('admin', 'moderator')
  );
$$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and (new.role is distinct from old.role
       or new.is_premium is distinct from old.is_premium
       or new.verified is distinct from old.verified) then
    raise exception 'system_profile_fields_are_server_owned';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_system_fields on public.profiles;
create trigger profiles_protect_system_fields
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

create or replace function public.protect_message_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.author_id is distinct from old.author_id
     or new.room_id is distinct from old.room_id
     or new.created_at is distinct from old.created_at then
    raise exception 'message_identity_fields_are_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_protect_ownership on public.messages;
create trigger messages_protect_ownership
before update on public.messages
for each row execute function public.protect_message_ownership();

create or replace function public.protect_private_message_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.client_id is distinct from old.client_id
     or new.created_at is distinct from old.created_at then
    raise exception 'private_message_identity_fields_are_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists private_messages_protect_ownership on public.private_messages;
create trigger private_messages_protect_ownership
before update on public.private_messages
for each row execute function public.protect_private_message_ownership();

create or replace function public.protect_private_request_identity()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.requester_id is distinct from old.requester_id
     or new.recipient_id is distinct from old.recipient_id
     or new.created_at is distinct from old.created_at then
    raise exception 'private_request_identity_fields_are_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists private_requests_protect_identity on public.private_requests;
create trigger private_requests_protect_identity
before update on public.private_requests
for each row execute function public.protect_private_request_identity();

alter table public.profiles enable row level security;
alter table public.profile_private_settings enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_migration_map enable row level security;
alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.message_receipts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.private_messages enable row level security;
alter table public.private_requests enable row level security;
alter table public.room_presence enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_events enable row level security;
alter table public.media_objects enable row level security;
alter table public.opin_posts enable row level security;
alter table public.opin_comments enable row level security;
alter table public.opin_likes enable row level security;
alter table public.opin_reactions enable row level security;
alter table public.opin_actions enable row level security;
alter table public.opin_follows enable row level security;
alter table public.opin_saves enable row level security;
alter table public.baul_cards enable row level security;
alter table public.baul_likes enable row level security;
alter table public.baul_footprints enable row level security;
alter table public.baul_visits enable row level security;
alter table public.baul_impressions enable row level security;
alter table public.baul_notes enable row level security;
alter table public.baul_matches enable row level security;
alter table public.contacts enable row level security;
alter table public.saved_profiles enable row level security;

-- Identity and preferences.
drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible on public.profiles
for select to anon, authenticated
using (profile_visible = true or id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (id = auth.uid() and is_guest = false);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_delete_self on public.profiles;
create policy profiles_delete_self on public.profiles
for delete to authenticated
using (id = auth.uid());

drop policy if exists profile_private_settings_owner on public.profile_private_settings;
create policy profile_private_settings_owner on public.profile_private_settings
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists user_preferences_owner on public.user_preferences;
create policy user_preferences_owner on public.user_preferences
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- No client policy is granted to user_migration_map.

-- Rooms and public chat.
drop policy if exists rooms_select_active on public.rooms;
create policy rooms_select_active on public.rooms
for select to anon, authenticated
using (is_active = true and is_public = true);

drop policy if exists messages_select_public on public.messages;
create policy messages_select_public on public.messages
for select to anon, authenticated
using (
  deleted_at is null
  and exists (select 1 from public.rooms r where r.id = room_id and r.is_active = true and r.is_public = true)
);

drop policy if exists messages_insert_self on public.messages;
create policy messages_insert_self on public.messages
for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (select 1 from public.rooms r where r.id = room_id and r.is_active = true and r.is_public = true)
);

drop policy if exists messages_update_self on public.messages;
create policy messages_update_self on public.messages
for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists messages_delete_self on public.messages;
create policy messages_delete_self on public.messages
for delete to authenticated
using (author_id = auth.uid());

drop policy if exists message_reactions_select_public on public.message_reactions;
create policy message_reactions_select_public on public.message_reactions
for select to anon, authenticated
using (exists (select 1 from public.messages m where m.id = message_id and m.deleted_at is null));

drop policy if exists message_reactions_owner on public.message_reactions;
create policy message_reactions_owner on public.message_reactions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists message_receipts_owner_or_sender on public.message_receipts;
create policy message_receipts_owner_or_sender on public.message_receipts
for all to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.messages m where m.id = message_id and m.author_id = auth.uid())
)
with check (user_id = auth.uid());

-- Private conversations.
drop policy if exists conversations_member_select on public.conversations;
create policy conversations_member_select on public.conversations
for select to authenticated
using (public.is_conversation_member(id));

drop policy if exists conversations_create_self on public.conversations;
create policy conversations_create_self on public.conversations
for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists conversations_owner_update on public.conversations;
create policy conversations_owner_update on public.conversations
for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists conversation_members_member_select on public.conversation_members;
create policy conversation_members_member_select on public.conversation_members
for select to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists conversation_members_self_insert on public.conversation_members;
create policy conversation_members_self_insert on public.conversation_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
    or public.is_conversation_member(conversation_id, auth.uid())
  )
);

drop policy if exists conversation_members_self_update on public.conversation_members;
create policy conversation_members_self_update on public.conversation_members
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists private_messages_member_select on public.private_messages;
create policy private_messages_member_select on public.private_messages
for select to authenticated
using (public.is_conversation_member(conversation_id) and deleted_at is null);

drop policy if exists private_messages_member_insert on public.private_messages;
create policy private_messages_member_insert on public.private_messages
for insert to authenticated
with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

drop policy if exists private_messages_sender_update on public.private_messages;
create policy private_messages_sender_update on public.private_messages
for update to authenticated
using (sender_id = auth.uid() and public.is_conversation_member(conversation_id))
with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

drop policy if exists private_messages_sender_delete on public.private_messages;
create policy private_messages_sender_delete on public.private_messages
for delete to authenticated
using (sender_id = auth.uid());

drop policy if exists private_requests_participant_select on public.private_requests;
create policy private_requests_participant_select on public.private_requests
for select to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists private_requests_requester_insert on public.private_requests;
create policy private_requests_requester_insert on public.private_requests
for insert to authenticated
with check (requester_id = auth.uid() and requester_id <> recipient_id);

drop policy if exists private_requests_participant_update on public.private_requests;
create policy private_requests_participant_update on public.private_requests
for update to authenticated
using (requester_id = auth.uid() or recipient_id = auth.uid())
with check (requester_id = auth.uid() or recipient_id = auth.uid());

-- Presence is visible only in public rooms; each user owns its own row.
drop policy if exists room_presence_select_public on public.room_presence;
create policy room_presence_select_public on public.room_presence
for select to authenticated
using (exists (select 1 from public.rooms r where r.id = room_id and r.is_public = true and r.is_active = true));

drop policy if exists room_presence_owner on public.room_presence;
create policy room_presence_owner on public.room_presence
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Notifications, blocks and reports.
drop policy if exists notifications_owner_select on public.notifications;
create policy notifications_owner_select on public.notifications
for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists blocks_participant_select on public.blocks;
create policy blocks_participant_select on public.blocks
for select to authenticated using (blocker_id = auth.uid() or blocked_id = auth.uid());

drop policy if exists blocks_owner_write on public.blocks;
create policy blocks_owner_write on public.blocks
for insert to authenticated with check (blocker_id = auth.uid() and blocker_id <> blocked_id);
drop policy if exists blocks_owner_delete on public.blocks;
create policy blocks_owner_delete on public.blocks
for delete to authenticated using (blocker_id = auth.uid());

drop policy if exists reports_owner_insert on public.reports;
create policy reports_owner_insert on public.reports
for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists reports_owner_select on public.reports;
create policy reports_owner_select on public.reports
for select to authenticated using (reporter_id = auth.uid() or public.is_admin_user());

-- OPIN.
drop policy if exists opin_posts_select_active on public.opin_posts;
create policy opin_posts_select_active on public.opin_posts
for select to anon, authenticated
using (status = 'active' and deleted_at is null);
drop policy if exists opin_posts_owner_insert on public.opin_posts;
create policy opin_posts_owner_insert on public.opin_posts
for insert to authenticated with check (author_id = auth.uid() and is_guest = false);
drop policy if exists opin_posts_owner_update on public.opin_posts;
create policy opin_posts_owner_update on public.opin_posts
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists opin_posts_owner_delete on public.opin_posts;
create policy opin_posts_owner_delete on public.opin_posts
for delete to authenticated using (author_id = auth.uid());
drop policy if exists opin_comments_select_active on public.opin_comments;
create policy opin_comments_select_active on public.opin_comments
for select to anon, authenticated using (status = 'active' and deleted_at is null);
drop policy if exists opin_comments_owner_insert on public.opin_comments;
create policy opin_comments_owner_insert on public.opin_comments
for insert to authenticated with check (author_id = auth.uid());
drop policy if exists opin_comments_owner_update on public.opin_comments;
create policy opin_comments_owner_update on public.opin_comments
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists opin_comments_owner_delete on public.opin_comments;
create policy opin_comments_owner_delete on public.opin_comments
for delete to authenticated using (author_id = auth.uid());
drop policy if exists opin_likes_select_authenticated on public.opin_likes;
create policy opin_likes_select_authenticated on public.opin_likes
for select to authenticated using (true);
drop policy if exists opin_likes_owner_write on public.opin_likes;
create policy opin_likes_owner_write on public.opin_likes
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists opin_reactions_select_authenticated on public.opin_reactions;
create policy opin_reactions_select_authenticated on public.opin_reactions
for select to authenticated using (true);
drop policy if exists opin_reactions_owner_write on public.opin_reactions;
create policy opin_reactions_owner_write on public.opin_reactions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists opin_follows_participant on public.opin_follows;
create policy opin_follows_participant on public.opin_follows
for all to authenticated using (follower_id = auth.uid() or followed_id = auth.uid()) with check (follower_id = auth.uid());
drop policy if exists opin_saves_owner on public.opin_saves;
create policy opin_saves_owner on public.opin_saves
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Baul public cards are readable only while visible; interaction rows are server-owned.
drop policy if exists baul_cards_select_visible on public.baul_cards;
create policy baul_cards_select_visible on public.baul_cards
for select to anon, authenticated
using (card_visible = true and (intent_expires_at is null or intent_expires_at > now()));
drop policy if exists baul_cards_owner_insert on public.baul_cards;
create policy baul_cards_owner_insert on public.baul_cards
for insert to authenticated with check (user_id = auth.uid());
drop policy if exists baul_cards_owner_update on public.baul_cards;
create policy baul_cards_owner_update on public.baul_cards
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists baul_cards_owner_delete on public.baul_cards;
create policy baul_cards_owner_delete on public.baul_cards
for delete to authenticated using (user_id = auth.uid());
drop policy if exists baul_matches_participant_select on public.baul_matches;
create policy baul_matches_participant_select on public.baul_matches
for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());
drop policy if exists contacts_owner on public.contacts;
create policy contacts_owner on public.contacts
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists saved_profiles_owner on public.saved_profiles;
create policy saved_profiles_owner on public.saved_profiles
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- No client write policies for baul_likes, footprints, visits, impressions, notes, actions,
-- matches, media_objects, moderation_actions or audit_events. Use authenticated RPCs/Edge Functions.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 143360, array['image/jpeg', 'image/png', 'image/webp']),
  ('card-media', 'card-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-public', 'chat-public', false, 143360, array['image/jpeg', 'image/png', 'image/webp']),
  ('chat-private', 'chat-private', false, 143360, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists card_media_owner_write on storage.objects;
create policy card_media_owner_write on storage.objects
for all to authenticated
using (bucket_id = 'card-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'card-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists chat_public_owner_write on storage.objects;
create policy chat_public_owner_write on storage.objects
for all to authenticated
using (bucket_id = 'chat-public' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'chat-public' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists chat_private_member_read on storage.objects;
create policy chat_private_member_read on storage.objects
for select to authenticated
using (
  bucket_id = 'chat-private'
  and public.is_conversation_member((storage.foldername(name))[1]::uuid)
);
drop policy if exists chat_private_owner_insert on storage.objects;
create policy chat_private_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'chat-private'
  and public.is_conversation_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);
drop policy if exists chat_private_owner_update on storage.objects;
create policy chat_private_owner_update on storage.objects
for update to authenticated
using (
  bucket_id = 'chat-private'
  and public.is_conversation_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'chat-private'
  and public.is_conversation_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);
drop policy if exists chat_private_owner_delete on storage.objects;
create policy chat_private_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'chat-private'
  and public.is_conversation_member((storage.foldername(name))[1]::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);

alter table public.messages replica identity full;
alter table public.private_messages replica identity full;
alter table public.opin_posts replica identity full;
alter table public.opin_comments replica identity full;
alter table public.notifications replica identity full;
alter table public.room_presence replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions') then
      alter publication supabase_realtime add table public.message_reactions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_receipts') then
      alter publication supabase_realtime add table public.message_receipts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_messages') then
      alter publication supabase_realtime add table public.private_messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_requests') then
      alter publication supabase_realtime add table public.private_requests;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'opin_posts') then
      alter publication supabase_realtime add table public.opin_posts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'opin_comments') then
      alter publication supabase_realtime add table public.opin_comments;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_presence') then
      alter publication supabase_realtime add table public.room_presence;
    end if;
  end if;
end;
$$;
```

### SQL 05 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270005_baul_rpc.sql`

```sql
-- Chactivo / Supabase migration 005
-- Server-authoritative Baul interactions.
-- This file is prepared locally and is NOT executed by this task.

create or replace function public.is_blocked_between(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = first_user_id and b.blocked_id = second_user_id)
       or (b.blocker_id = second_user_id and b.blocked_id = first_user_id)
  );
$$;

create or replace function public.assert_baul_target(target_user_id uuid)
returns void
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'invalid_baul_target' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = target_user_id and p.profile_visible = true
  ) then
    raise exception 'baul_target_not_available' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.baul_cards c
    where c.user_id = target_user_id
      and c.card_visible = true
      and (c.intent_expires_at is null or c.intent_expires_at > now())
  ) then
    raise exception 'baul_card_not_available' using errcode = '42501';
  end if;
  if public.is_blocked_between(auth.uid(), target_user_id) then
    raise exception 'baul_target_blocked' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.toggle_baul_like(target_user_id uuid)
returns table (liked boolean, is_match boolean, match_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  actor_liked_target boolean;
  target_liked_actor boolean;
  next_user_a uuid;
  next_user_b uuid;
  next_match_key text;
  existing_active_match boolean;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform public.assert_baul_target(target_user_id);
  if not exists (select 1 from public.baul_cards where user_id = v_actor_id) then
    raise exception 'actor_baul_card_missing' using errcode = '42501';
  end if;

  -- Serialize the pair for a stable toggle and reciprocal-match calculation.
  perform pg_advisory_xact_lock(hashtextextended(least(v_actor_id::text, target_user_id::text) || ':' || greatest(v_actor_id::text, target_user_id::text), 0));

  select exists (
    select 1 from public.baul_likes bl
    where bl.actor_id = v_actor_id and bl.target_id = target_user_id
  ) into actor_liked_target;

  if actor_liked_target then
    delete from public.baul_likes
    where baul_likes.actor_id = v_actor_id and baul_likes.target_id = target_user_id;
    liked := false;
  else
    insert into public.baul_likes (actor_id, target_id)
    values (v_actor_id, target_user_id)
    on conflict do nothing;
    liked := true;
  end if;

  select exists (
    select 1 from public.baul_likes bl
    where bl.actor_id = target_user_id and bl.target_id = v_actor_id
  ) into target_liked_actor;

  next_user_a := least(v_actor_id, target_user_id);
  next_user_b := greatest(v_actor_id, target_user_id);
  next_match_key := next_user_a::text || '_' || next_user_b::text;
  is_match := liked and target_liked_actor;
  match_key := case when is_match then next_match_key else null end;

  select exists (
    select 1 from public.baul_matches bm
    where bm.user_a = next_user_a and bm.user_b = next_user_b and bm.status = 'active'
  ) into existing_active_match;

  if is_match then
    insert into public.baul_matches (user_a, user_b, status)
    values (next_user_a, next_user_b, 'active')
    on conflict (user_a, user_b) do update
      set status = 'active', updated_at = now();
  else
    delete from public.baul_matches
    where user_a = next_user_a and user_b = next_user_b;
  end if;

  if liked then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      target_user_id,
      v_actor_id,
      case when is_match then 'baul_match' else 'baul_like' end,
      case when is_match then 'Nuevo match en Baúl' else 'Interés en tu tarjeta' end,
      case when is_match then 'También se interesaron mutuamente.' else 'Alguien marcó tu tarjeta como interesante.' end,
      'baul_card'
    );
  end if;

  if is_match and not existing_active_match then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      v_actor_id,
      target_user_id,
      'baul_match',
      'Nuevo match en Baúl',
      'El interés es mutuo. Ya pueden iniciar una conversación.',
      'baul_match'
    );
  end if;

  return next;
end;
$$;

create or replace function public.record_baul_daily_event(target_user_id uuid, event_type text)
returns table (recorded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  local_day date := (now() at time zone 'America/Santiago')::date;
  inserted_count integer := 0;
  daily_count integer := 0;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if event_type not in ('footprint', 'visit', 'impression') then
    raise exception 'invalid_baul_event' using errcode = '22023';
  end if;
  perform public.assert_baul_target(target_user_id);

  if event_type = 'footprint' then
    select count(*) into daily_count
    from public.baul_footprints bf
    where bf.actor_id = v_actor_id and bf.local_day = local_day;
    if daily_count >= 15 then
      raise exception 'baul_daily_limit_reached' using errcode = '42901';
    end if;
    insert into public.baul_footprints (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  elsif event_type = 'visit' then
    insert into public.baul_visits (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  else
    insert into public.baul_impressions (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  end if;

  recorded := inserted_count > 0;

  if recorded and event_type in ('footprint', 'visit') then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      target_user_id,
      v_actor_id,
      case when event_type = 'footprint' then 'baul_footprint' else 'baul_visit' end,
      case when event_type = 'footprint' then 'Nueva huella en tu tarjeta' else 'Visita a tu tarjeta' end,
      case when event_type = 'footprint' then 'Alguien dejó una huella en tu tarjeta.' else 'Alguien abrió tu tarjeta.' end,
      'baul_card'
    );
  end if;

  return next;
end;
$$;

create or replace function public.send_baul_note(target_user_id uuid, note_content text)
returns table (note_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  normalized_content text := regexp_replace(trim(coalesce(note_content, '')), '\s+', ' ', 'g');
  created_note_id uuid;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform public.assert_baul_target(target_user_id);
  if char_length(normalized_content) < 1 or char_length(normalized_content) > 500 then
    raise exception 'invalid_baul_note' using errcode = '22023';
  end if;
  if normalized_content ~* '(https?://|www\.|wa\.me|t\.me|whatsapp|telegram|instagram|facebook|discord|snapchat|fuera de chactivo)' then
    raise exception 'external_contact_not_allowed' using errcode = '22023';
  end if;

  insert into public.baul_notes (actor_id, target_id, content)
  values (v_actor_id, target_user_id, normalized_content)
  returning id into created_note_id;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (
    target_user_id,
    v_actor_id,
    'baul_note',
    'Nueva nota en Baúl',
    left(normalized_content, 500),
    'baul_note',
    created_note_id
  );

  note_id := created_note_id;
  return next;
end;
$$;

revoke all on function public.toggle_baul_like(uuid) from public, anon, authenticated;
grant execute on function public.toggle_baul_like(uuid) to authenticated;
revoke all on function public.record_baul_daily_event(uuid, text) from public, anon, authenticated;
grant execute on function public.record_baul_daily_event(uuid, text) to authenticated;
revoke all on function public.send_baul_note(uuid, text) from public, anon, authenticated;
grant execute on function public.send_baul_note(uuid, text) to authenticated;

comment on function public.toggle_baul_like(uuid) is 'Server-authoritative Baul like/unlike and reciprocal match creation.';
comment on function public.record_baul_daily_event(uuid, text) is 'Idempotent daily Baul footprint, visit or impression with Chile day limits.';
comment on function public.send_baul_note(uuid, text) is 'Validated first contact note for a visible Baul card.';
```

### SQL 06 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270006_private_chat_rpc.sql`

```sql
-- Private chat hardening: atomic, server-authoritative writes.
-- Prepared locally only. Do NOT execute without reviewing against the target Supabase project.

create table if not exists public.private_message_receipts (
  private_message_id uuid not null references public.private_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (private_message_id, user_id),
  check (read_at is null or delivered_at is not null)
);

create index if not exists private_message_receipts_user_idx
  on public.private_message_receipts (user_id, read_at, delivered_at);

alter table public.private_message_receipts enable row level security;

 drop policy if exists private_message_receipts_member_select on public.private_message_receipts;
create policy private_message_receipts_member_select on public.private_message_receipts
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.private_messages pm
    where pm.id = private_message_id
      and public.is_conversation_member(pm.conversation_id)
  )
);

-- Receipts are written only by the RPC below; there is intentionally no client write policy.

drop policy if exists private_typing_member_select on public.private_typing;
create policy private_typing_member_select on public.private_typing
for select to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists private_typing_owner_insert on public.private_typing;
create policy private_typing_owner_insert on public.private_typing
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);

drop policy if exists private_typing_owner_update on public.private_typing;
create policy private_typing_owner_update on public.private_typing
for update to authenticated
using (user_id = auth.uid() and public.is_conversation_member(conversation_id))
with check (user_id = auth.uid() and public.is_conversation_member(conversation_id));

drop policy if exists private_typing_owner_delete on public.private_typing;
create policy private_typing_owner_delete on public.private_typing
for delete to authenticated
using (user_id = auth.uid());

-- Remove dangerous direct writes. SELECT remains available under the existing RLS policies.
revoke insert, update, delete on table public.private_messages from authenticated;
revoke insert, update, delete on table public.conversations from authenticated;
revoke insert, update, delete on table public.conversation_members from authenticated;
revoke insert, update, delete on table public.private_message_receipts from authenticated;
revoke insert, update, delete on table public.private_requests from authenticated;

create or replace function public.get_or_create_direct_conversation(target_user_id uuid)
returns table (conversation_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  direct_key_value text;
  existing_id uuid;
  was_created boolean := false;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_user_id is null or target_user_id = actor_id then raise exception 'SELF_CHAT_NOT_ALLOWED'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then raise exception 'TARGET_USER_NOT_FOUND'; end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = actor_id and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = actor_id)
  ) then raise exception 'BLOCKED'; end if;

  direct_key_value := least(actor_id::text, target_user_id::text) || ':' || greatest(actor_id::text, target_user_id::text);
  select c.id into existing_id
  from public.conversations c
  where c.kind = 'direct' and c.direct_key = direct_key_value
  limit 1;

  if existing_id is null then
    begin
      insert into public.conversations (kind, direct_key, created_by)
      values ('direct', direct_key_value, actor_id)
      returning id into existing_id;
      was_created := true;
    exception when unique_violation then
      select c.id into existing_id
      from public.conversations c
      where c.kind = 'direct' and c.direct_key = direct_key_value
      limit 1;
    end;
  end if;

  if existing_id is null then raise exception 'CONVERSATION_CREATE_FAILED'; end if;

  insert into public.conversation_members (conversation_id, user_id, member_role)
  values
    (existing_id, actor_id, 'owner'),
    (existing_id, target_user_id, 'member')
  on conflict (conversation_id, user_id) do update set left_at = null;

  return query select existing_id, was_created;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;

create or replace function public.send_private_request(target_user_id uuid, request_message text default null)
returns table (request_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  existing_id uuid;
  new_id uuid;
  normalized_message text := nullif(left(btrim(coalesce(request_message, '')), 500), '');
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_user_id is null or target_user_id = actor_id then raise exception 'SELF_REQUEST_NOT_ALLOWED'; end if;
  if not exists (select 1 from public.profiles where id = target_user_id) then raise exception 'TARGET_USER_NOT_FOUND'; end if;
  if exists (
    select 1 from public.blocks b
    where (b.blocker_id = actor_id and b.blocked_id = target_user_id)
       or (b.blocker_id = target_user_id and b.blocked_id = actor_id)
  ) then raise exception 'BLOCKED'; end if;

  select r.id into existing_id
  from public.private_requests r
  where r.requester_id = actor_id
    and r.recipient_id = target_user_id
    and r.status = 'pending'
  limit 1;
  if existing_id is not null then
    return query select existing_id, false;
    return;
  end if;

  begin
    insert into public.private_requests (requester_id, recipient_id, status, message)
    values (actor_id, target_user_id, 'pending', normalized_message)
    returning id into new_id;
  exception when unique_violation then
    select r.id into new_id
    from public.private_requests r
    where r.requester_id = actor_id
      and r.recipient_id = target_user_id
      and r.status = 'pending'
    limit 1;
    return query select new_id, false;
    return;
  end;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (
    target_user_id,
    actor_id,
    'private_request',
    'Nueva invitación a privado',
    coalesce(normalized_message, 'Alguien quiere conversar contigo en privado.'),
    'private_request',
    new_id
  );

  return query select new_id, true;
end;
$$;

grant execute on function public.send_private_request(uuid, text) to authenticated;

create or replace function public.send_private_message(
  target_conversation_id uuid,
  target_client_id text,
  target_content text default '',
  target_message_type text default 'text',
  target_media_path text default null,
  target_media_bucket text default null,
  target_media_mime text default null,
  target_media_size integer default null
)
returns table (message_id uuid, created_at timestamptz, client_id text, inserted boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  message_row public.private_messages%rowtype;
  normalized_type text := lower(coalesce(target_message_type, 'text'));
  normalized_content text := btrim(coalesce(target_content, ''));
  normalized_bucket text := nullif(btrim(coalesce(target_media_bucket, '')), '');
  normalized_path text := nullif(btrim(coalesce(target_media_path, '')), '');
  normalized_mime text := lower(nullif(btrim(coalesce(target_media_mime, '')), ''));
  inserted_now boolean := false;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_conversation_id is null then raise exception 'INVALID_CONVERSATION'; end if;
  if target_client_id is null or char_length(target_client_id) < 8 or char_length(target_client_id) > 160 then raise exception 'INVALID_CLIENT_ID'; end if;
  if normalized_type not in ('text', 'image') then raise exception 'INVALID_MESSAGE_TYPE'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  if exists (
    select 1
    from public.blocks b
    where (
      b.blocker_id = actor_id
      and b.blocked_id in (select cm.user_id from public.conversation_members cm where cm.conversation_id = target_conversation_id and cm.left_at is null and cm.user_id <> actor_id)
    ) or (
      b.blocked_id = actor_id
      and b.blocker_id in (select cm.user_id from public.conversation_members cm where cm.conversation_id = target_conversation_id and cm.left_at is null and cm.user_id <> actor_id)
    )
  ) then raise exception 'BLOCKED'; end if;

  if normalized_type = 'text' then
    if normalized_content = '' or char_length(normalized_content) > 2000 then raise exception 'INVALID_MESSAGE_CONTENT'; end if;
    normalized_bucket := null;
    normalized_path := null;
    normalized_mime := null;
    target_media_size := null;
  else
    if normalized_bucket <> 'chat-private'
       or normalized_path is null
       or split_part(normalized_path, '/', 1) <> target_conversation_id::text
       or split_part(normalized_path, '/', 2) <> actor_id::text
       or normalized_mime not in ('image/jpeg', 'image/png', 'image/webp')
       or target_media_size is null
       or target_media_size < 1
       or target_media_size > 143360 then
      raise exception 'INVALID_PRIVATE_IMAGE';
    end if;
    normalized_content := 'Imagen';
  end if;

  insert into public.private_messages (
    conversation_id, sender_id, client_id, content, message_type,
    media_path, media_bucket, media_mime, media_size
  )
  values (
    target_conversation_id, actor_id, left(target_client_id, 160), normalized_content, normalized_type,
    normalized_path, normalized_bucket, normalized_mime, target_media_size
  )
  on conflict (conversation_id, sender_id, client_id) do nothing
  returning * into message_row;

  if message_row.id is null then
    select pm.* into message_row
    from public.private_messages pm
    where pm.conversation_id = target_conversation_id
      and pm.sender_id = actor_id
      and pm.client_id = left(target_client_id, 160)
    limit 1;
    if message_row.id is null then raise exception 'MESSAGE_INSERT_FAILED'; end if;
  else
    inserted_now := true;
  end if;

  if inserted_now then
    update public.conversations
    set last_message_id = message_row.id,
        last_message_at = message_row.created_at,
        last_message_preview = case when normalized_type = 'image' then 'Imagen' else left(normalized_content, 160) end,
        last_message_type = normalized_type,
        last_message_sender_id = actor_id,
        updated_at = now()
    where id = target_conversation_id;

    insert into public.private_message_receipts (private_message_id, user_id, delivered_at, read_at)
    select message_row.id, cm.user_id,
      case when cm.user_id = actor_id then now() else null end,
      case when cm.user_id = actor_id then now() else null end
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.left_at is null
    on conflict (private_message_id, user_id) do nothing;

    insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
    select cm.user_id, actor_id, 'private_message', 'Nuevo mensaje privado',
      case when normalized_type = 'image' then 'Te enviaron una imagen.' else left(normalized_content, 500) end,
      'private_message', message_row.id
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.left_at is null
      and cm.user_id <> actor_id;
  end if;

  return query select message_row.id, message_row.created_at, message_row.client_id, inserted_now;
end;
$$;

grant execute on function public.send_private_message(uuid, text, text, text, text, text, text, integer) to authenticated;

create or replace function public.mark_private_message_receipts(
  target_conversation_id uuid,
  target_message_ids uuid[] default '{}',
  mark_read boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  changed_count integer := 0;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;

  insert into public.private_message_receipts (private_message_id, user_id, delivered_at, read_at)
  select pm.id, actor_id, now(), case when mark_read then now() else null end
  from public.private_messages pm
  where pm.conversation_id = target_conversation_id
    and pm.sender_id <> actor_id
    and pm.id = any(coalesce(target_message_ids, '{}'::uuid[]))
    and pm.deleted_at is null
  on conflict (private_message_id, user_id) do update
    set delivered_at = coalesce(public.private_message_receipts.delivered_at, excluded.delivered_at),
        read_at = case when mark_read then coalesce(public.private_message_receipts.read_at, excluded.read_at) else public.private_message_receipts.read_at end;

  get diagnostics changed_count = row_count;
  if mark_read then
    update public.conversation_members
    set last_read_at = now()
    where conversation_id = target_conversation_id and user_id = actor_id and left_at is null;
  end if;
  return changed_count;
end;
$$;

grant execute on function public.mark_private_message_receipts(uuid, uuid[], boolean) to authenticated;

create or replace function public.mark_private_conversation_read(target_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = target_conversation_id and user_id = actor_id and left_at is null;
  if not found then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  return true;
end;
$$;

grant execute on function public.mark_private_conversation_read(uuid) to authenticated;

create or replace function public.respond_private_request(target_request_id uuid, accept_request boolean)
returns table (accepted boolean, conversation_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  request_row public.private_requests%rowtype;
  conversation_row record;
  next_conversation_id uuid := null;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select r.* into request_row
  from public.private_requests r
  where r.id = target_request_id and r.recipient_id = actor_id
  for update;
  if request_row.id is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  if request_row.status <> 'pending' then raise exception 'REQUEST_NOT_PENDING'; end if;

  if not accept_request then
    update public.private_requests set status = 'rejected', updated_at = now() where id = request_row.id;
    return query select false, null::uuid;
    return;
  end if;

  select * into conversation_row
  from public.get_or_create_direct_conversation(request_row.requester_id);
  next_conversation_id := conversation_row.conversation_id;

  update public.private_requests
  set status = 'accepted', conversation_id = next_conversation_id, updated_at = now()
  where id = request_row.id;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (request_row.requester_id, actor_id, 'private_request_accepted', 'Invitación aceptada', 'Tu invitación a privado fue aceptada.', 'conversation', next_conversation_id);

  return query select true, next_conversation_id;
end;
$$;

grant execute on function public.respond_private_request(uuid, boolean) to authenticated;

-- Keep the private receipt table available to the Realtime stream; payload visibility is still controlled by RLS.
alter table public.private_message_receipts replica identity full;
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_message_receipts') then
      alter publication supabase_realtime add table public.private_message_receipts;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_typing') then
      alter publication supabase_realtime add table public.private_typing;
    end if;
  end if;
end;
$$;
```

### SQL 07 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270007_opin_metrics.sql`

```sql
-- OPIN metrics hardening: counters are derived from interaction rows, not client input.
-- Prepared locally only. Do NOT execute without reviewing against the target Supabase project.

create or replace function public.protect_opin_server_metrics()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.like_count := 0;
    new.comment_count := 0;
    new.view_count := 0;
    new.profile_click_count := 0;
    new.reaction_counts := '{}'::jsonb;
    new.last_comment_at := null;
    new.last_interaction_at := null;
  elsif coalesce(current_setting('chactivo.allow_server_metrics', true), '') <> '1'
    and (
      new.like_count is distinct from old.like_count
      or new.comment_count is distinct from old.comment_count
      or new.view_count is distinct from old.view_count
      or new.profile_click_count is distinct from old.profile_click_count
      or new.reaction_counts is distinct from old.reaction_counts
      or new.last_comment_at is distinct from old.last_comment_at
      or new.last_interaction_at is distinct from old.last_interaction_at
    ) then
    raise exception 'opin_metrics_are_server_owned';
  end if;
  return new;
end;
$$;

drop trigger if exists opin_posts_protect_metrics on public.opin_posts;
create trigger opin_posts_protect_metrics
before insert or update on public.opin_posts
for each row execute function public.protect_opin_server_metrics();

create or replace function public.refresh_opin_post_metrics(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  reaction_map jsonb;
  like_total integer;
  comment_total integer;
  latest_comment timestamptz;
  latest_interaction timestamptz;
begin
  select count(*)::integer into like_total from public.opin_likes where post_id = target_post_id;
  select count(*)::integer into comment_total from public.opin_comments where post_id = target_post_id and status = 'active' and deleted_at is null;
  select max(created_at) into latest_comment from public.opin_comments where post_id = target_post_id and status = 'active' and deleted_at is null;
  select coalesce(jsonb_object_agg(reaction, reaction_count), '{}'::jsonb)
  into reaction_map
  from (
    select reaction, count(*)::integer as reaction_count
    from public.opin_reactions
    where post_id = target_post_id
    group by reaction
  ) grouped_reactions;
  select greatest(
    (select max(created_at) from public.opin_likes where post_id = target_post_id),
    (select max(created_at) from public.opin_reactions where post_id = target_post_id),
    (select max(created_at) from public.opin_comments where post_id = target_post_id)
  ) into latest_interaction;

  perform set_config('chactivo.allow_server_metrics', '1', true);
  update public.opin_posts
  set like_count = coalesce(like_total, 0),
      comment_count = coalesce(comment_total, 0),
      reaction_counts = coalesce(reaction_map, '{}'::jsonb),
      last_comment_at = latest_comment,
      last_interaction_at = latest_interaction,
      updated_at = now()
  where id = target_post_id;
  perform set_config('chactivo.allow_server_metrics', '', true);
end;
$$;

grant execute on function public.refresh_opin_post_metrics(uuid) to authenticated;

create or replace function public.trg_refresh_opin_post_metrics()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.refresh_opin_post_metrics(coalesce(new.post_id, old.post_id));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists opin_likes_refresh_metrics on public.opin_likes;
create trigger opin_likes_refresh_metrics
after insert or delete on public.opin_likes
for each row execute function public.trg_refresh_opin_post_metrics();

drop trigger if exists opin_reactions_refresh_metrics on public.opin_reactions;
create trigger opin_reactions_refresh_metrics
after insert or update or delete on public.opin_reactions
for each row execute function public.trg_refresh_opin_post_metrics();

drop trigger if exists opin_comments_refresh_metrics on public.opin_comments;
create trigger opin_comments_refresh_metrics
after insert or update or delete on public.opin_comments
for each row execute function public.trg_refresh_opin_post_metrics();

create or replace function public.record_opin_action(target_post_id uuid, target_action_type text)
returns table (recorded boolean, view_count integer, profile_click_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_action_key text := lower(btrim(coalesce(target_action_type, '')));
  already_recorded boolean;
  next_view_count integer;
  next_profile_click_count integer;
begin
  if v_actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if v_action_key not in ('view', 'share', 'open_profile', 'open_chat', 'report') then raise exception 'INVALID_OPIN_ACTION'; end if;
  if not exists (select 1 from public.opin_posts where id = target_post_id and status = 'active' and deleted_at is null) then raise exception 'OPIN_POST_NOT_FOUND'; end if;

  select exists (
    select 1     from public.opin_actions oa
    where oa.post_id = target_post_id
      and oa.actor_id = v_actor_id
      and oa.action_type = v_action_key
      and oa.created_at > now() - interval '24 hours'
  ) into already_recorded;

  if not already_recorded then
    insert into public.opin_actions (post_id, actor_id, action_type)
    values (target_post_id, v_actor_id, v_action_key);
    if v_action_key in ('view', 'open_profile') then
      perform set_config('chactivo.allow_server_metrics', '1', true);
      update public.opin_posts
      set view_count = case when v_action_key = 'view' then view_count + 1 else view_count end,
          profile_click_count = case when v_action_key = 'open_profile' then profile_click_count + 1 else profile_click_count end,
          last_interaction_at = now(),
          updated_at = now()
      where id = target_post_id;
      perform set_config('chactivo.allow_server_metrics', '', true);
    end if;
  end if;

  select p.view_count, p.profile_click_count
  into next_view_count, next_profile_click_count
  from public.opin_posts p where p.id = target_post_id;
  return query select not already_recorded, next_view_count, next_profile_click_count;
end;
$$;

grant execute on function public.record_opin_action(uuid, text) to authenticated;
```

### SQL 08 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270008_private_contacts.sql`

```sql
-- Private contact sharing. Phone values are never stored in public.profiles or returned by normal profile queries.
-- Prepared locally only. Do NOT execute without reviewing against the target Supabase project.

create table if not exists public.profile_private_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null check (char_length(phone) between 3 and 40),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_contact_shares (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'revoked')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  primary key (conversation_id, owner_id, recipient_id),
  check (owner_id <> recipient_id)
);

create index if not exists private_contact_shares_recipient_idx
  on public.private_contact_shares (recipient_id, status, expires_at);
create unique index if not exists private_contact_shares_pending_idx
  on public.private_contact_shares (conversation_id, owner_id, recipient_id)
  where status = 'pending';

alter table public.profile_private_contacts enable row level security;
alter table public.private_contact_shares enable row level security;

create policy profile_private_contacts_owner on public.profile_private_contacts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy private_contact_shares_participant_select on public.private_contact_shares
for select to authenticated
using (public.is_conversation_member(conversation_id));

-- All share state changes and phone disclosure happen through the RPCs below.
revoke insert, update, delete on table public.private_contact_shares from authenticated;

create or replace function public.request_private_contact_share(target_conversation_id uuid)
returns table (success boolean, status text, recipient_id uuid, already_shared boolean, already_pending boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  other_id uuid;
  chat_created_at timestamptz;
  my_message_count integer;
  other_message_count integer;
  existing_status text;
  existing_expires timestamptz;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;

  select min(c.created_at) into chat_created_at from public.conversations c where c.id = target_conversation_id and c.kind = 'direct';
  select cm.user_id into other_id
  from public.conversation_members cm
  where cm.conversation_id = target_conversation_id and cm.user_id <> actor_id and cm.left_at is null
  limit 1;
  if other_id is null then raise exception 'PRIVATE_CONTACT_GROUP_UNSUPPORTED'; end if;
  if not exists (select 1 from public.profile_private_contacts where user_id = actor_id) then raise exception 'PRIVATE_CONTACT_PHONE_MISSING'; end if;
  if chat_created_at is null or now() - chat_created_at < interval '10 minutes' then raise exception 'PRIVATE_CONTACT_LOCKED'; end if;

  select count(*)::integer into my_message_count from public.private_messages where conversation_id = target_conversation_id and sender_id = actor_id and deleted_at is null;
  select count(*)::integer into other_message_count from public.private_messages where conversation_id = target_conversation_id and sender_id = other_id and deleted_at is null;
  if my_message_count < 3 or other_message_count < 3 then raise exception 'PRIVATE_CONTACT_LOCKED'; end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = actor_id and b.blocked_id = other_id) or (b.blocker_id = other_id and b.blocked_id = actor_id)) then raise exception 'BLOCKED'; end if;

  select s.status, s.expires_at into existing_status, existing_expires
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id and s.owner_id = actor_id and s.recipient_id = other_id;

  if existing_status = 'accepted' and existing_expires > now() then
    return query select true, existing_status, other_id, true, false;
    return;
  end if;
  if existing_status = 'pending' then
    return query select true, existing_status, other_id, false, true;
    return;
  end if;

  insert into public.private_contact_shares (conversation_id, owner_id, recipient_id, status, requested_at, responded_at, expires_at)
  values (target_conversation_id, actor_id, other_id, 'pending', now(), null, null)
  on conflict (conversation_id, owner_id, recipient_id) do update
    set status = 'pending', requested_at = now(), responded_at = null, expires_at = null;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (other_id, actor_id, 'private_contact_request', 'Solicitud de contacto', 'La otra persona quiere compartir su teléfono contigo.', 'conversation', target_conversation_id);

  return query select true, 'pending'::text, other_id, false, false;
end;
$$;

grant execute on function public.request_private_contact_share(uuid) to authenticated;

create or replace function public.respond_private_contact_share(target_conversation_id uuid, target_owner_id uuid, accept_share boolean)
returns table (success boolean, accepted boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  share_row public.private_contact_shares%rowtype;
  expiry timestamptz := case when accept_share then now() + interval '7 days' else null end;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  select s.* into share_row
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id and s.owner_id = target_owner_id and s.recipient_id = actor_id
  for update;
  if share_row.owner_id is null or share_row.status <> 'pending' then raise exception 'PRIVATE_CONTACT_REQUEST_NOT_PENDING'; end if;
  if not exists (select 1 from public.profile_private_contacts where user_id = target_owner_id) then raise exception 'PRIVATE_CONTACT_PHONE_MISSING'; end if;

  update public.private_contact_shares
  set status = case when accept_share then 'accepted' else 'rejected' end,
      responded_at = now(),
      expires_at = expiry
  where conversation_id = target_conversation_id and owner_id = target_owner_id and recipient_id = actor_id;

  if accept_share then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
    values (target_owner_id, actor_id, 'private_contact_accepted', 'Contacto habilitado', 'La otra persona aceptó recibir tu teléfono.', 'conversation', target_conversation_id);
  end if;
  return query select true, accept_share, expiry;
end;
$$;

grant execute on function public.respond_private_contact_share(uuid, uuid, boolean) to authenticated;

create or replace function public.revoke_private_contact_share(target_conversation_id uuid, target_recipient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  update public.private_contact_shares
  set status = 'revoked', responded_at = now(), expires_at = null
  where conversation_id = target_conversation_id and owner_id = actor_id and recipient_id = target_recipient_id;
  return found;
end;
$$;

grant execute on function public.revoke_private_contact_share(uuid, uuid) to authenticated;

create or replace function public.get_private_chat_shared_contacts(target_conversation_id uuid, target_owner_ids uuid[] default '{}')
returns table (owner_id uuid, user_id uuid, username text, phone text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select s.owner_id, p.id, p.username, pc.phone
  from public.private_contact_shares s
  join public.profiles p on p.id = s.owner_id
  join public.profile_private_contacts pc on pc.user_id = s.owner_id
  where s.conversation_id = target_conversation_id
    and s.recipient_id = auth.uid()
    and s.status = 'accepted'
    and s.expires_at > now()
    and (coalesce(array_length(target_owner_ids, 1), 0) = 0 or s.owner_id = any(target_owner_ids))
    and public.is_conversation_member(target_conversation_id, auth.uid());
$$;

grant execute on function public.get_private_chat_shared_contacts(uuid, uuid[]) to authenticated;

create or replace function public.get_private_contact_state(target_conversation_id uuid)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'contactShareRequests', coalesce(jsonb_object_agg(s.owner_id::text, jsonb_build_object(
      'requesterId', s.owner_id,
      'recipientId', s.recipient_id,
      'contactType', 'phone',
      'status', s.status,
      'requestedAt', s.requested_at,
      'respondedAt', s.responded_at
    )) filter (where s.status in ('pending', 'accepted', 'rejected')), '{}'::jsonb),
    'contactShareVisibility', coalesce(jsonb_object_agg(s.owner_id::text, jsonb_build_object(
      s.recipient_id::text, jsonb_build_object('allowed', true, 'expiresAt', s.expires_at, 'expiresAtMs', extract(epoch from s.expires_at) * 1000)
    )) filter (where s.status = 'accepted' and s.expires_at > now()), '{}'::jsonb)
  )
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id
    and public.is_conversation_member(target_conversation_id, auth.uid());
$$;

grant execute on function public.get_private_contact_state(uuid) to authenticated;
```

### SQL 09 — Zona 5: Moderación, denuncias y seguridad comunitaria

**Archivo fuente:** `supabase/migrations/202608270009_moderation_rpc.sql`

```sql
-- Moderation state and audit RPCs for the Supabase cutover.
-- Locally prepared only. Do NOT execute from this task.

alter table public.moderation_actions add column if not exists revoked_at timestamptz;

create index if not exists moderation_actions_target_created_idx
  on public.moderation_actions (target_user_id, created_at desc);
create index if not exists moderation_actions_target_expiry_idx
  on public.moderation_actions (target_user_id, expires_at);

drop policy if exists moderation_actions_self_select on public.moderation_actions;
create policy moderation_actions_self_select on public.moderation_actions
for select to authenticated
using (target_user_id = auth.uid() or public.is_admin_user());

create or replace function public.get_my_moderation_state()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  with active_actions as (
    select action_type, reason, expires_at, created_at
    from public.moderation_actions
    where target_user_id = auth.uid()
      and revoked_at is null
      and (expires_at is null or expires_at > now())
      and action_type in ('perm_ban', 'temp_ban', 'suspend', 'mute', 'shadowban', 'warning')
    order by created_at desc
  ),
  summary as (
    select
      count(*)::integer as strikes,
      max(created_at) as last_strike_at,
      max(expires_at) filter (where action_type in ('temp_ban', 'suspend')) as suspend_until,
      max(expires_at) filter (where action_type = 'mute') as mute_until,
      max(expires_at) filter (where action_type = 'shadowban') as shadowban_until,
      bool_or(action_type = 'perm_ban') as permanent_ban,
      (array_agg(reason order by created_at desc))[1] as last_reason
    from active_actions
  )
  select jsonb_build_object(
    'strikes', coalesce(strikes, 0),
    'lastStrikeAt', extract(epoch from last_strike_at) * 1000,
    'suspendUntilMs', extract(epoch from suspend_until) * 1000,
    'muteUntilMs', extract(epoch from mute_until) * 1000,
    'shadowbanUntilMs', extract(epoch from shadowban_until) * 1000,
    'permanentBan', coalesce(permanent_ban, false),
    'lastReason', coalesce(last_reason, '')
  )
  from summary;
$$;

grant execute on function public.get_my_moderation_state() to authenticated;

create or replace function public.record_moderation_violation(
  target_action_type text,
  target_reason text default null,
  duration_minutes integer default null,
  source text default 'local_safety_guard'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  safe_action text := lower(trim(target_action_type));
  safe_minutes integer := greatest(1, least(coalesce(duration_minutes, 1), 43200));
  expires_at_value timestamptz;
  created_id uuid;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if safe_action not in ('warning', 'mute', 'temp_ban', 'suspend', 'shadowban') then raise exception 'INVALID_MODERATION_ACTION'; end if;
  if safe_action = 'warning' then expires_at_value := null;
  else expires_at_value := now() + make_interval(mins => safe_minutes);
  end if;

  insert into public.moderation_actions (moderator_id, target_user_id, action_type, reason, expires_at)
  values (
    actor_id,
    actor_id,
    safe_action,
    left(coalesce(target_reason, 'Regla de seguridad activada') || ' [' || left(coalesce(source, 'local_safety_guard'), 60) || ']', 1000),
    expires_at_value
  )
  returning id into created_id;

  return jsonb_build_object('id', created_id, 'actionType', safe_action, 'expiresAt', expires_at_value);
end;
$$;

grant execute on function public.record_moderation_violation(text, text, integer, text) to authenticated;

create or replace function public.record_moderation_event(
  target_user_id uuid,
  event_type text,
  event_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  event_id uuid;
  safe_event_type text;
begin
  if actor_id is null or target_user_id is null or actor_id <> target_user_id then raise exception 'AUTH_USER_MISMATCH'; end if;
  safe_event_type := left(coalesce($2, 'moderation_event'), 100);
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (actor_id, safe_event_type, 'profile', target_user_id, coalesce(event_metadata, '{}'::jsonb))
  returning id into event_id;
  return event_id;
end;
$$;

grant execute on function public.record_moderation_event(uuid, text, jsonb) to authenticated;

create or replace function public.admin_create_moderation_action(
  target_user_id uuid,
  target_action_type text,
  target_reason text default null,
  target_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  action_id uuid;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if target_user_id is null or lower(trim(target_action_type)) not in ('warning', 'mute', 'temp_ban', 'suspend', 'shadowban', 'perm_ban') then raise exception 'INVALID_MODERATION_ACTION'; end if;
  insert into public.moderation_actions (moderator_id, target_user_id, action_type, reason, expires_at)
  values (actor_id, target_user_id, lower(trim(target_action_type)), left(target_reason, 1000), target_expires_at)
  returning id into action_id;
  return action_id;
end;
$$;

grant execute on function public.admin_create_moderation_action(uuid, text, text, timestamptz) to authenticated;

create or replace function public.admin_revoke_moderation_action(target_action_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin_user(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.moderation_actions set revoked_at = now() where id = target_action_id and revoked_at is null;
  return found;
end;
$$;

grant execute on function public.admin_revoke_moderation_action(uuid) to authenticated;
```

### SQL 10 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270010_public_chat_moderation.sql`

```sql
-- Public chat moderation RPCs. Prepared locally only; do NOT execute from this task.

create or replace function public.admin_delete_public_messages(
  target_room_id text,
  target_user_id uuid default null,
  include_system boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  deleted_count integer := 0;
  media_rows jsonb := '[]'::jsonb;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if target_room_id is null or char_length(trim(target_room_id)) = 0 then raise exception 'ROOM_REQUIRED'; end if;

  with deleted as (
    delete from public.messages m
    where m.room_id = target_room_id
      and (target_user_id is null or m.author_id = target_user_id)
      and (include_system or m.author_id is not null)
    returning m.media_bucket, m.media_path
  )
  select count(*)::integer,
         coalesce(jsonb_agg(jsonb_build_object('bucket', media_bucket, 'path', media_path)) filter (where media_path is not null and media_bucket is not null), '[]'::jsonb)
  into deleted_count, media_rows
  from deleted;

  insert into public.audit_events (actor_id, event_type, entity_type, metadata)
  values (actor_id, 'public_chat_bulk_delete', 'room', jsonb_build_object('roomId', target_room_id, 'targetUserId', target_user_id, 'includeSystem', include_system, 'deletedCount', deleted_count));

  return jsonb_build_object('deletedCount', deleted_count, 'media', media_rows);
end;
$$;

grant execute on function public.admin_delete_public_messages(text, uuid, boolean) to authenticated;

create or replace function public.admin_delete_public_message(target_room_id text, target_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  deleted_count integer := 0;
  media_rows jsonb := '[]'::jsonb;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  with deleted as (
    delete from public.messages m
    where m.room_id = target_room_id and m.id = target_message_id
    returning m.media_bucket, m.media_path
  )
  select count(*)::integer,
         coalesce(jsonb_agg(jsonb_build_object('bucket', media_bucket, 'path', media_path)) filter (where media_path is not null and media_bucket is not null), '[]'::jsonb)
  into deleted_count, media_rows
  from deleted;
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (actor_id, 'public_chat_message_delete', 'message', target_message_id, jsonb_build_object('roomId', target_room_id, 'deletedCount', deleted_count));
  return jsonb_build_object('deletedCount', deleted_count, 'media', media_rows);
end;
$$;

grant execute on function public.admin_delete_public_message(text, uuid) to authenticated;
```

### SQL 11 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270011_system_notifications.sql`

```sql
-- In-app/system notifications for Supabase-first. Prepared locally only; do NOT execute from this task.

alter table public.notifications add column if not exists icon text;
alter table public.notifications add column if not exists link text;
alter table public.notifications add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent'));
alter table public.notifications add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.notifications add column if not exists expires_at timestamptz;

create or replace function public.create_system_notification(
  target_user_id uuid,
  notification_type text,
  notification_title text,
  notification_content text,
  notification_icon text default null,
  notification_link text default null,
  notification_priority text default 'normal',
  notification_created_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  notification_id uuid;
  safe_priority text := case when notification_priority in ('low', 'normal', 'high', 'urgent') then notification_priority else 'normal' end;
begin
  if actor_id is null or target_user_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if actor_id <> target_user_id and not public.is_admin_user(actor_id) then raise exception 'NOTIFICATION_FORBIDDEN'; end if;
  insert into public.notifications (user_id, actor_id, type, title, content, icon, link, priority, created_by)
  values (target_user_id, case when actor_id = target_user_id then null else actor_id end, left(notification_type, 80), left(notification_title, 160), left(notification_content, 500), left(notification_icon, 80), left(notification_link, 500), safe_priority, coalesce(notification_created_by, actor_id))
  returning id into notification_id;
  return notification_id;
end;
$$;

grant execute on function public.create_system_notification(uuid, text, text, text, text, text, text, uuid) to authenticated;

create or replace function public.admin_broadcast_system_notification(
  target_audience text,
  notification_type text,
  notification_title text,
  notification_content text,
  notification_icon text default null,
  notification_link text default null,
  notification_priority text default 'normal'
)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  inserted_count integer := 0;
  safe_audience text := lower(trim(coalesce(target_audience, 'all')));
  safe_priority text := case when notification_priority in ('low', 'normal', 'high', 'urgent') then notification_priority else 'normal' end;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if safe_audience not in ('all', 'registered', 'guests') then raise exception 'INVALID_AUDIENCE'; end if;

  insert into public.notifications (user_id, actor_id, type, title, content, icon, link, priority, created_by)
  select p.id, actor_id, left(notification_type, 80), left(notification_title, 160), left(notification_content, 500), left(notification_icon, 80), left(notification_link, 500), safe_priority, actor_id
  from public.profiles p
  where safe_audience = 'all'
     or (safe_audience = 'registered' and p.is_guest = false)
     or (safe_audience = 'guests' and p.is_guest = true);

  get diagnostics inserted_count = row_count;
  insert into public.audit_events (actor_id, event_type, entity_type, metadata)
  values (actor_id, 'system_notification_broadcast', 'notification', jsonb_build_object('audience', safe_audience, 'count', inserted_count));
  return inserted_count;
end;
$$;

grant execute on function public.admin_broadcast_system_notification(text, text, text, text, text, text, text) to authenticated;
```

### SQL 12 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270012_chat_states.sql`

```sql
-- Temporary chat states and reactions for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.room_states (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  role_badge text,
  message text not null check (char_length(message) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (room_id, author_id)
);

create index if not exists room_states_active_idx
  on public.room_states (room_id, expires_at desc, updated_at desc);

create table if not exists public.room_state_reactions (
  room_state_id uuid not null references public.room_states(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('fire', 'spark', 'eyes', 'heart', 'crown')),
  updated_at timestamptz not null default now(),
  primary key (room_state_id, user_id)
);

create index if not exists room_state_reactions_state_idx
  on public.room_state_reactions (room_state_id, updated_at desc);

alter table public.room_states enable row level security;
alter table public.room_state_reactions enable row level security;

drop policy if exists room_states_select_active on public.room_states;
create policy room_states_select_active on public.room_states
for select to anon, authenticated
using (
  expires_at > now()
  and exists (select 1 from public.rooms r where r.id = room_id and r.is_active = true and r.is_public = true)
);

drop policy if exists room_states_owner_insert on public.room_states;
create policy room_states_owner_insert on public.room_states
for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_guest = false));

drop policy if exists room_states_owner_update on public.room_states;
create policy room_states_owner_update on public.room_states
for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists room_states_owner_delete on public.room_states;
create policy room_states_owner_delete on public.room_states
for delete to authenticated
using (author_id = auth.uid());

drop policy if exists room_state_reactions_select_active on public.room_state_reactions;
create policy room_state_reactions_select_active on public.room_state_reactions
for select to anon, authenticated
using (exists (select 1 from public.room_states s where s.id = room_state_id and s.expires_at > now()));

drop policy if exists room_state_reactions_owner_write on public.room_state_reactions;
create policy room_state_reactions_owner_write on public.room_state_reactions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (select 1 from public.room_states s where s.id = room_state_id and s.expires_at > now()));

drop trigger if exists room_states_set_updated_at on public.room_states;
create trigger room_states_set_updated_at
before update on public.room_states
for each row execute function public.set_updated_at();

drop trigger if exists room_state_reactions_set_updated_at on public.room_state_reactions;
create trigger room_state_reactions_set_updated_at
before update on public.room_state_reactions
for each row execute function public.set_updated_at();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_states') then
      alter publication supabase_realtime add table public.room_states;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_state_reactions') then
      alter publication supabase_realtime add table public.room_state_reactions;
    end if;
  end if;
end;
$$;
```

### SQL 13 — Zona 5: Moderación, denuncias y seguridad comunitaria

**Archivo fuente:** `supabase/migrations/202608270013_reports_moderation.sql`

```sql
-- Reports moderation for Supabase-first. Prepared locally only; do NOT execute from this task.

create or replace function public.admin_update_report_status(
  target_report_id uuid,
  next_status text,
  reviewer_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reporter uuid;
  affected_rows integer := 0;
  changed boolean := false;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if next_status not in ('open', 'reviewing', 'resolved', 'dismissed') then raise exception 'INVALID_REPORT_STATUS'; end if;
  update public.reports
  set status = next_status, resolved_at = case when next_status in ('resolved', 'dismissed') then now() else null end
  where id = target_report_id
  returning reporter_id into reporter;
  get diagnostics affected_rows = row_count;
  changed := affected_rows > 0;
  if changed and reporter is not null then
    insert into public.notifications (user_id, actor_id, type, title, content, icon, priority, created_by)
    values (
      reporter,
      actor_id,
      'report_update',
      case when next_status = 'resolved' then 'Caso resuelto' when next_status = 'dismissed' then 'Caso cerrado' else 'Caso en revisión' end,
      left(coalesce(reviewer_notes, 'El estado de tu reporte fue actualizado por moderación.'), 500),
      case when next_status = 'resolved' then '✅' when next_status = 'dismissed' then 'ℹ️' else '🔍' end,
      'high',
      actor_id
    );
  end if;
  return changed;
end;
$$;

grant execute on function public.admin_update_report_status(uuid, text, text) to authenticated;
```

### SQL 14 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270014_events.sql`

```sql
-- Events and attendees for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  room_id text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes >= 5),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true,
  status text not null default 'programado' check (status in ('programado', 'activo', 'finalizado', 'cancelado')),
  attendees_count integer not null default 0 check (attendees_count >= 0),
  check (ends_at > starts_at)
);

create index if not exists events_visible_idx on public.events (active, starts_at);

create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_attendees_user_idx on public.event_attendees (user_id, joined_at desc);

alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

drop policy if exists events_public_select on public.events;
create policy events_public_select on public.events
for select to anon, authenticated
using (active = true or created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_insert on public.events;
create policy events_owner_insert on public.events
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_update on public.events;
create policy events_owner_update on public.events
for update to authenticated
using (created_by = auth.uid() or public.is_admin_user())
with check (created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_delete on public.events;
create policy events_owner_delete on public.events
for delete to authenticated
using (created_by = auth.uid() or public.is_admin_user());

drop policy if exists event_attendees_public_select on public.event_attendees;
create policy event_attendees_public_select on public.event_attendees
for select to anon, authenticated
using (true);

drop policy if exists event_attendees_owner_insert on public.event_attendees;
create policy event_attendees_owner_insert on public.event_attendees
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists event_attendees_owner_delete on public.event_attendees;
create policy event_attendees_owner_delete on public.event_attendees
for delete to authenticated
using (user_id = auth.uid());

create or replace function public.sync_event_attendee_count()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  event_key uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e set attendees_count = (select count(*)::integer from public.event_attendees a where a.event_id = event_key) where e.id = event_key;
  return coalesce(new, old);
end;
$$;

drop trigger if exists event_attendee_count_after_change on public.event_attendees;
create trigger event_attendee_count_after_change
after insert or delete on public.event_attendees
for each row execute function public.sync_event_attendee_count();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then
      alter publication supabase_realtime add table public.events;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_attendees') then
      alter publication supabase_realtime add table public.event_attendees;
    end if;
  end if;
end;
$$;
```

### SQL 15 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270015_verification.sql`

```sql
-- Account verification by activity for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.user_verification (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  consecutive_days integer not null default 0 check (consecutive_days >= 0),
  last_connection_date date,
  longest_streak integer not null default 0 check (longest_streak >= 0),
  total_days integer not null default 0 check (total_days >= 0),
  verified boolean not null default false,
  verified_at timestamptz,
  verification_lost_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_verification enable row level security;

drop policy if exists user_verification_self_select on public.user_verification;
create policy user_verification_self_select on public.user_verification
for select to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop trigger if exists user_verification_set_updated_at on public.user_verification;
create trigger user_verification_set_updated_at
before update on public.user_verification
for each row execute function public.set_updated_at();

create or replace function public.get_my_verification_status()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'verified', coalesce(v.verified, false),
    'consecutiveDays', coalesce(v.consecutive_days, 0),
    'daysUntilVerification', greatest(0, 30 - coalesce(v.consecutive_days, 0)),
    'canVerify', coalesce(v.consecutive_days, 0) >= 30,
    'longestStreak', coalesce(v.longest_streak, 0),
    'totalDays', coalesce(v.total_days, 0),
    'lastConnectionDate', v.last_connection_date,
    'verifiedAt', v.verified_at
  )
  from (select auth.uid() as user_id) actor
  left join public.user_verification v on v.user_id = actor.user_id;
$$;

grant execute on function public.get_my_verification_status() to authenticated;

create or replace function public.record_user_connection()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  today_date date := current_date;
  previous_date date;
  days_since integer;
  next_consecutive integer;
  next_longest integer;
  next_total integer;
  was_verified boolean := false;
  lost_verification boolean := false;
  result jsonb;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select last_connection_date, consecutive_days, longest_streak, total_days, verified into previous_date, next_consecutive, next_longest, next_total, was_verified from public.user_verification where user_id = actor_id for update;
  if not found then
    next_consecutive := 0; next_longest := 0; next_total := 0; was_verified := false;
  end if;
  if previous_date is null then days_since := null;
  else days_since := today_date - previous_date;
  end if;

  if days_since is null or days_since = 1 then next_consecutive := next_consecutive + 1;
  elsif days_since > 1 and days_since < 4 then next_consecutive := 1;
  elsif days_since >= 4 then next_consecutive := 1; lost_verification := was_verified;
  end if;
  if days_since is distinct from 0 then next_total := next_total + 1; end if;
  next_longest := greatest(next_longest, next_consecutive);

  insert into public.user_verification (user_id, consecutive_days, last_connection_date, longest_streak, total_days, verified, verified_at, verification_lost_at)
  values (actor_id, next_consecutive, today_date, next_longest, next_total, case when next_consecutive >= 30 and not lost_verification then true else (was_verified and not lost_verification) end, case when next_consecutive >= 30 and not was_verified and not lost_verification then now() else null end, case when lost_verification then now() else null end)
  on conflict (user_id) do update set consecutive_days = excluded.consecutive_days, last_connection_date = excluded.last_connection_date, longest_streak = excluded.longest_streak, total_days = excluded.total_days, verified = excluded.verified, verified_at = coalesce(excluded.verified_at, public.user_verification.verified_at), verification_lost_at = coalesce(excluded.verification_lost_at, public.user_verification.verification_lost_at), updated_at = now();
  select public.get_my_verification_status() into result;
  return result || jsonb_build_object('lostVerification', lost_verification, 'justVerified', (next_consecutive >= 30 and not was_verified and not lost_verification));
end;
$$;

grant execute on function public.record_user_connection() to authenticated;

create or replace function public.set_my_verification(target_verified boolean)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  current_streak integer;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select consecutive_days into current_streak from public.user_verification where user_id = actor_id;
  if target_verified and coalesce(current_streak, 0) < 30 then raise exception 'VERIFICATION_REQUIREMENT_NOT_MET'; end if;
  update public.user_verification set verified = target_verified, verified_at = case when target_verified then now() else null end, verification_lost_at = case when target_verified then verification_lost_at else now() end, updated_at = now() where user_id = actor_id;
  return found;
end;
$$;

grant execute on function public.set_my_verification(boolean) to authenticated;
```

### SQL 16 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270016_rewards.sql`

```sql
-- Rewards for Supabase-first. Prepared locally only; do NOT execute from this task.

alter table public.profiles add column if not exists has_special_avatar boolean not null default false;
alter table public.profiles add column if not exists is_featured boolean not null default false;
alter table public.profiles add column if not exists is_moderator boolean not null default false;
alter table public.profiles add column if not exists is_pro_user boolean not null default false;
alter table public.profiles add column if not exists can_upload_second_photo boolean not null default false;
alter table public.profiles add column if not exists has_featured_card boolean not null default false;
alter table public.profiles add column if not exists has_rainbow_border boolean not null default false;
alter table public.profiles add column if not exists has_pro_badge boolean not null default false;
alter table public.profiles add column if not exists chat_photo_access boolean not null default false;

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null,
  reason text,
  reason_description text,
  issued_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoke_reason text,
  notes text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_rewards_user_active_idx on public.user_rewards (user_id, status, expires_at, created_at desc);

alter table public.user_rewards enable row level security;

drop policy if exists user_rewards_owner_select on public.user_rewards;
create policy user_rewards_owner_select on public.user_rewards
for select to authenticated
using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.get_my_active_rewards()
returns setof public.user_rewards
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.user_rewards where user_id = auth.uid() and status = 'active' and (expires_at is null or expires_at > now()) order by created_at desc;
$$;

grant execute on function public.get_my_active_rewards() to authenticated;

create or replace function public.admin_create_reward(
  target_user_id uuid,
  target_reward_type text,
  target_reason text default null,
  target_reason_description text default null,
  target_expires_at timestamptz default null,
  target_notes text default null,
  target_metrics jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reward_id uuid;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if target_user_id is null or target_reward_type is null then raise exception 'INVALID_REWARD'; end if;
  insert into public.user_rewards (user_id, reward_type, reason, reason_description, issued_by, expires_at, notes, metrics)
  values (target_user_id, left(target_reward_type, 80), left(target_reason, 80), left(target_reason_description, 500), actor_id, target_expires_at, left(target_notes, 1000), coalesce(target_metrics, '{}'::jsonb))
  returning id into reward_id;
  if target_reward_type = 'premium_1_month' then update public.profiles set is_premium = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'verified_1_month' then update public.profiles set verified = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'special_avatar_1_month' then update public.profiles set has_special_avatar = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'featured_user' then update public.profiles set is_featured = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'moderator_1_month' then update public.profiles set is_moderator = true, role = case when role = 'user' then 'moderator' else role end, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'pro_user' then update public.profiles set is_pro_user = true, can_upload_second_photo = true, has_featured_card = true, has_rainbow_border = true, has_pro_badge = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'chat_photo_access' then update public.profiles set chat_photo_access = true, updated_at = now() where id = target_user_id;
  end if;
  return reward_id;
end;
$$;

grant execute on function public.admin_create_reward(uuid, text, text, text, timestamptz, text, jsonb) to authenticated;

drop function if exists public.admin_revoke_reward(uuid, text);

create or replace function public.admin_revoke_reward(target_reward_id uuid, target_revoke_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reward_row public.user_rewards;
  affected_rows integer := 0;
  changed boolean := false;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  select * into reward_row from public.user_rewards where id = target_reward_id for update;
  if not found then return false; end if;
  update public.user_rewards set status = 'revoked', revoked_at = now(), revoked_by = actor_id, revoke_reason = left(target_revoke_reason, 500) where id = target_reward_id and status = 'active';
  get diagnostics affected_rows = row_count;
  changed := affected_rows > 0;
  if changed and reward_row.reward_type = 'premium_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'premium_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_premium = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'verified_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'verified_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set verified = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'special_avatar_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'special_avatar_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set has_special_avatar = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'featured_user' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'featured_user' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_featured = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'moderator_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'moderator_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_moderator = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'pro_user' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'pro_user' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_pro_user = false, can_upload_second_photo = false, has_featured_card = false, has_rainbow_border = false, has_pro_badge = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'chat_photo_access' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'chat_photo_access' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set chat_photo_access = false, updated_at = now() where id = reward_row.user_id; end if;
  return changed;
end;
$$;

grant execute on function public.admin_revoke_reward(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_rewards') then
      alter publication supabase_realtime add table public.user_rewards;
    end if;
  end if;
end;
$$;
```

### SQL 17 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270017_activity_ranking.sql`

```sql
-- Activity ranking from real Supabase rows. Prepared locally only; do NOT execute from this task.

create or replace function public.get_top_20_active_users()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  is_premium boolean,
  verified boolean,
  email text,
  profile_created_at timestamptz,
  metrics jsonb
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin_user(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  with message_counts as (
    select m.author_id as id, count(*)::integer as messages_count
    from public.messages m
    where m.deleted_at is null
    group by m.author_id
  ), opin_counts as (
    select p.author_id as id, count(*)::integer as threads_count
    from public.opin_posts p
    where p.deleted_at is null
    group by p.author_id
  ), comment_counts as (
    select c.author_id as id, count(*)::integer as replies_count
    from public.opin_comments c
    where c.deleted_at is null
    group by c.author_id
  )
  select p.id, p.username, p.avatar_url, p.is_premium, p.verified, p.email, p.created_at,
    jsonb_build_object(
      'messagesCount', coalesce(mc.messages_count, 0),
      'threadsCount', coalesce(oc.threads_count, 0),
      'repliesCount', coalesce(cc.replies_count, 0),
      'totalActiveTime', 0,
      'activityScore', round(coalesce(mc.messages_count, 0) + coalesce(oc.threads_count, 0) * 3 + coalesce(cc.replies_count, 0) * 2)
    )
  from public.profiles p
  left join message_counts mc on mc.id = p.id
  left join opin_counts oc on oc.id = p.id
  left join comment_counts cc on cc.id = p.id
  where p.is_guest = false and p.role <> 'admin'
  order by (coalesce(mc.messages_count, 0) + coalesce(oc.threads_count, 0) * 3 + coalesce(cc.replies_count, 0) * 2) desc, coalesce(mc.messages_count, 0) desc
  limit 20;
end;
$$;

grant execute on function public.get_top_20_active_users() to authenticated;
```

### SQL 18 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270018_tickets.sql`

```sql
-- Support tickets for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  username_snapshot text,
  email text,
  subject text not null check (char_length(subject) between 1 and 160),
  description text not null,
  category text not null default 'general',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'spam')),
  attachments jsonb not null default '[]'::jsonb,
  assigned_to uuid references public.profiles(id) on delete set null,
  admin_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_created_idx on public.tickets (user_id, created_at desc);
create index if not exists tickets_admin_queue_idx on public.tickets (status, priority, updated_at desc);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_type text not null check (author_type in ('user', 'staff')),
  message_type text not null default 'external' check (message_type in ('external', 'internal')),
  content text not null check (char_length(content) between 1 and 5000),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_thread_idx on public.ticket_messages (ticket_id, created_at asc);

create table if not exists public.ticket_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_logs_thread_idx on public.ticket_logs (ticket_id, created_at desc);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_logs enable row level security;

drop policy if exists tickets_owner_select on public.tickets;
create policy tickets_owner_select on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_admin_user());
drop policy if exists tickets_owner_insert on public.tickets;
create policy tickets_owner_insert on public.tickets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists tickets_admin_update on public.tickets;
create policy tickets_admin_update on public.tickets for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists tickets_messages_select on public.ticket_messages;
create policy tickets_messages_select on public.ticket_messages for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user()) and (message_type = 'external' or public.is_admin_user())));
drop policy if exists tickets_messages_insert on public.ticket_messages;
create policy tickets_messages_insert on public.ticket_messages for insert to authenticated with check (author_id = auth.uid() and author_type = case when public.is_admin_user() then 'staff' else 'user' end and message_type = 'external' and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user())));
drop policy if exists tickets_logs_select on public.ticket_logs;
create policy tickets_logs_select on public.ticket_logs for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and public.is_admin_user()));
drop policy if exists tickets_logs_insert on public.ticket_logs;
create policy tickets_logs_insert on public.ticket_logs for insert to authenticated with check (actor_id = auth.uid() and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user())));

create or replace function public.send_ticket_message(
  target_ticket_id uuid,
  target_content text,
  target_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  ticket_row public.tickets;
  message_id uuid;
  actor_type text;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into ticket_row from public.tickets where id = target_ticket_id for update;
  if not found or (ticket_row.user_id <> actor_id and not public.is_admin_user(actor_id)) then raise exception 'TICKET_FORBIDDEN'; end if;
  actor_type := case when public.is_admin_user(actor_id) then 'staff' else 'user' end;
  insert into public.ticket_messages (ticket_id, author_id, author_type, message_type, content, attachments)
  values (target_ticket_id, actor_id, actor_type, 'external', left(trim(target_content), 5000), coalesce(target_attachments, '[]'::jsonb))
  returning id into message_id;
  update public.tickets set last_message_at = now(), updated_at = now() where id = target_ticket_id;
  insert into public.ticket_logs (ticket_id, actor_id, action, metadata)
  values (target_ticket_id, actor_id, 'message_sent', jsonb_build_object('messageType', 'external'));
  return message_id;
end;
$$;

grant execute on function public.send_ticket_message(uuid, text, jsonb) to authenticated;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at before update on public.tickets for each row execute function public.set_updated_at();
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets') then
      alter publication supabase_realtime add table public.tickets;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_messages') then
      alter publication supabase_realtime add table public.ticket_messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_logs') then
      alter publication supabase_realtime add table public.ticket_logs;
    end if;
  end if;
end;
$$;
```

### SQL 19 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270019_analytics.sql`

```sql
-- Minimal analytics persistence for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  event_type text not null check (char_length(event_type) between 1 and 80),
  event_date date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_date_type_idx on public.analytics_events (event_date, event_type, created_at desc);
create index if not exists analytics_events_user_date_idx on public.analytics_events (user_id, event_date, event_type);
alter table public.analytics_events enable row level security;
drop policy if exists analytics_owner_select on public.analytics_events;
create policy analytics_owner_select on public.analytics_events for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.record_analytics_event(
  target_event_type text,
  target_session_id text default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  event_id uuid;
  safe_metadata jsonb := coalesce(target_metadata, '{}'::jsonb) - array['message', 'content', 'privateMessage', 'phone', 'email'];
  safe_type text := left(regexp_replace(lower(coalesce(target_event_type, 'unknown')), '[^a-z0-9_]', '_', 'g'), 80);
begin
  if actor_id is null then return null; end if;
  insert into public.analytics_events (user_id, session_id, event_type, metadata)
  values (actor_id, left(target_session_id, 160), safe_type, safe_metadata)
  returning id into event_id;
  return event_id;
end;
$$;

grant execute on function public.record_analytics_event(text, text, jsonb) to authenticated;

create or replace function public.get_my_analytics_day(target_day date default current_date)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'date', target_day,
    'pageViews', count(*) filter (where event_type = 'page_view'),
    'registrations', count(*) filter (where event_type = 'user_register'),
    'logins', count(*) filter (where event_type = 'user_login'),
    'messagesSent', count(*) filter (where event_type = 'message_sent'),
    'roomsCreated', count(*) filter (where event_type in ('room_created', 'custom_room_created')),
    'roomsJoined', count(*) filter (where event_type = 'room_joined'),
    'pageExits', count(*) filter (where event_type = 'page_exit')
  )
  from public.analytics_events
  where user_id = auth.uid() and event_date = target_day;
$$;

grant execute on function public.get_my_analytics_day(date) to authenticated;

create or replace function public.get_analytics_day(target_day date default current_date)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'date', target_day,
    'pageViews', count(*) filter (where event_type = 'page_view'),
    'registrations', count(*) filter (where event_type = 'user_register'),
    'logins', count(*) filter (where event_type = 'user_login'),
    'messagesSent', count(*) filter (where event_type = 'message_sent'),
    'roomsCreated', count(*) filter (where event_type in ('room_created', 'custom_room_created')),
    'roomsJoined', count(*) filter (where event_type = 'room_joined'),
    'pageExits', count(*) filter (where event_type = 'page_exit')
  )
  from public.analytics_events
  where event_date = target_day and public.is_admin_user();
$$;

grant execute on function public.get_analytics_day(date) to authenticated;
```

### SQL 20 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270020_daily_limits.sql`

```sql
-- Daily limits for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.daily_user_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  limit_date date not null default current_date,
  chat_invites integer not null default 0 check (chat_invites >= 0),
  direct_messages integer not null default 0 check (direct_messages >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, limit_date)
);

alter table public.daily_user_limits enable row level security;
drop policy if exists daily_user_limits_self_select on public.daily_user_limits;
create policy daily_user_limits_self_select on public.daily_user_limits for select to authenticated using (user_id = auth.uid());

create or replace function public.get_my_daily_limits()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object('date', current_date, 'chatInvites', coalesce(l.chat_invites, 0), 'directMessages', coalesce(l.direct_messages, 0))
  from (select auth.uid() as user_id) actor
  left join public.daily_user_limits l on l.user_id = actor.user_id and l.limit_date = current_date;
$$;

grant execute on function public.get_my_daily_limits() to authenticated;

create or replace function public.increment_my_daily_limit(limit_name text)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  next_value integer;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if limit_name not in ('chat_invites', 'direct_messages') then raise exception 'INVALID_LIMIT'; end if;
  insert into public.daily_user_limits (user_id, limit_date, chat_invites, direct_messages)
  values (actor_id, current_date, case when limit_name = 'chat_invites' then 1 else 0 end, case when limit_name = 'direct_messages' then 1 else 0 end)
  on conflict (user_id, limit_date) do update set chat_invites = public.daily_user_limits.chat_invites + case when limit_name = 'chat_invites' then 1 else 0 end, direct_messages = public.daily_user_limits.direct_messages + case when limit_name = 'direct_messages' then 1 else 0 end, updated_at = now();
  select case when limit_name = 'chat_invites' then chat_invites else direct_messages end into next_value from public.daily_user_limits where user_id = actor_id and limit_date = current_date;
  return next_value;
end;
$$;

grant execute on function public.increment_my_daily_limit(text) to authenticated;
```

### SQL 21 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270021_esencias.sql`

```sql
-- Ephemeral Esencias for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.esencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 280),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists esencias_active_idx on public.esencias (expires_at, created_at desc);
alter table public.esencias enable row level security;
drop policy if exists esencias_public_select on public.esencias;
create policy esencias_public_select on public.esencias for select to anon, authenticated using (expires_at > now());
drop policy if exists esencias_owner_insert on public.esencias;
create policy esencias_owner_insert on public.esencias for insert to authenticated with check (user_id = auth.uid());
drop policy if exists esencias_owner_delete on public.esencias;
create policy esencias_owner_delete on public.esencias for delete to authenticated using (user_id = auth.uid());
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'esencias') then
      alter publication supabase_realtime add table public.esencias;
    end if;
  end if;
end;
$$;
```

### SQL 22 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270022_forum.sql`

```sql
-- Legacy forum surfaces for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous_id text not null check (char_length(anonymous_id) between 3 and 80),
  author_display text not null check (char_length(author_display) between 1 and 100),
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(content) between 1 and 10000),
  category text not null default 'general',
  reply_count integer not null default 0 check (reply_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_listing_idx on public.forum_threads (category, created_at desc);
create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous_id text not null check (char_length(anonymous_id) between 3 and 80),
  author_display text not null check (char_length(author_display) between 1 and 100),
  content text not null check (char_length(content) between 1 and 10000),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_thread_idx on public.forum_replies (thread_id, created_at asc);

create table if not exists public.forum_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('thread', 'reply')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_votes enable row level security;
drop policy if exists forum_threads_public_select on public.forum_threads;
create policy forum_threads_public_select on public.forum_threads for select to anon, authenticated using (true);
drop policy if exists forum_threads_owner_insert on public.forum_threads;
create policy forum_threads_owner_insert on public.forum_threads for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_replies_public_select on public.forum_replies;
create policy forum_replies_public_select on public.forum_replies for select to anon, authenticated using (true);
drop policy if exists forum_replies_owner_insert on public.forum_replies;
create policy forum_replies_owner_insert on public.forum_replies for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_threads_admin_update on public.forum_threads;
create policy forum_threads_admin_update on public.forum_threads for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists forum_threads_admin_delete on public.forum_threads;
create policy forum_threads_admin_delete on public.forum_threads for delete to authenticated using (public.is_admin_user());
drop policy if exists forum_replies_admin_update on public.forum_replies;
create policy forum_replies_admin_update on public.forum_replies for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists forum_replies_admin_delete on public.forum_replies;
create policy forum_replies_admin_delete on public.forum_replies for delete to authenticated using (public.is_admin_user());
drop policy if exists forum_votes_owner_select on public.forum_votes;
create policy forum_votes_owner_select on public.forum_votes for select to authenticated using (user_id = auth.uid());

create or replace function public.sync_forum_reply_count()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  update public.forum_threads set reply_count = (select count(*)::integer from public.forum_replies where thread_id = coalesce(new.thread_id, old.thread_id)), updated_at = now() where id = coalesce(new.thread_id, old.thread_id);
  return coalesce(new, old);
end; $$;
drop trigger if exists forum_reply_count_after_change on public.forum_replies;
create trigger forum_reply_count_after_change after insert or delete on public.forum_replies for each row execute function public.sync_forum_reply_count();

create or replace function public.toggle_forum_vote(target_entity_type text, target_entity_id uuid, desired boolean default true)
returns boolean language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); entity_exists boolean;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_entity_type not in ('thread', 'reply') then raise exception 'INVALID_ENTITY_TYPE'; end if;
  if target_entity_type = 'thread' then select exists(select 1 from public.forum_threads where id = target_entity_id) into entity_exists; else select exists(select 1 from public.forum_replies where id = target_entity_id) into entity_exists; end if;
  if not entity_exists then raise exception 'FORUM_ENTITY_NOT_FOUND'; end if;
  if desired then insert into public.forum_votes(user_id, entity_type, entity_id) values(actor_id, target_entity_type, target_entity_id) on conflict do nothing; else delete from public.forum_votes where user_id = actor_id and entity_type = target_entity_type and entity_id = target_entity_id; end if;
  if target_entity_type = 'thread' then update public.forum_threads set like_count = (select count(*)::integer from public.forum_votes where entity_type = 'thread' and entity_id = target_entity_id) where id = target_entity_id; else update public.forum_replies set like_count = (select count(*)::integer from public.forum_votes where entity_type = 'reply' and entity_id = target_entity_id) where id = target_entity_id; end if;
  return desired;
end; $$;
grant execute on function public.toggle_forum_vote(text, uuid, boolean) to authenticated;

create or replace function public.increment_forum_view(target_thread_id uuid)
returns integer language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare next_count integer;
begin
  update public.forum_threads set view_count = view_count + 1 where id = target_thread_id returning view_count into next_count;
  return coalesce(next_count, 0);
end; $$;
grant execute on function public.increment_forum_view(uuid) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_threads') then
      alter publication supabase_realtime add table public.forum_threads;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_replies') then
      alter publication supabase_realtime add table public.forum_replies;
    end if;
  end if;
end;
$$;
```

### SQL 23 — Zona 5: Moderación, denuncias y seguridad comunitaria

**Archivo fuente:** `supabase/migrations/202608270023_contact_safety.sql`

```sql
-- Contact safety telemetry for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.contact_safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('blocked_attempt', 'share_requested', 'share_accepted', 'share_rejected', 'share_revoked')),
  surface text not null default 'unknown',
  blocked_type text,
  risk_delta integer not null default 0 check (risk_delta between -100 and 100),
  chat_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists contact_safety_events_user_idx on public.contact_safety_events (user_id, created_at desc);
alter table public.contact_safety_events enable row level security;
drop policy if exists contact_safety_events_owner_select on public.contact_safety_events;
create policy contact_safety_events_owner_select on public.contact_safety_events for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create table if not exists public.contact_safety_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_events integer not null default 0,
  blocked_attempts integer not null default 0,
  blocked_attempts_opin integer not null default 0,
  blocked_attempts_private integer not null default 0,
  share_requests integer not null default 0,
  share_accepted integer not null default 0,
  share_rejected integer not null default 0,
  share_revoked integer not null default 0,
  risk_score integer not null default 0,
  last_event_type text,
  last_surface text,
  last_blocked_type text,
  last_event_at timestamptz
);
alter table public.contact_safety_profiles enable row level security;
drop policy if exists contact_safety_profiles_owner_select on public.contact_safety_profiles;
create policy contact_safety_profiles_owner_select on public.contact_safety_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.record_contact_safety_event(
  target_user_id uuid,
  target_event_type text,
  target_surface text default 'unknown',
  target_blocked_type text default null,
  target_risk_delta integer default 0,
  target_chat_id uuid default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); event_id uuid; is_blocked boolean := target_event_type = 'blocked_attempt';
begin
  if actor_id is null or target_user_id is null or actor_id <> target_user_id then raise exception 'SAFETY_EVENT_FORBIDDEN'; end if;
  if target_event_type not in ('blocked_attempt', 'share_requested', 'share_accepted', 'share_rejected', 'share_revoked') then raise exception 'INVALID_SAFETY_EVENT'; end if;
  insert into public.contact_safety_events(user_id, event_type, surface, blocked_type, risk_delta, chat_id, metadata)
  values (actor_id, target_event_type, left(coalesce(target_surface, 'unknown'), 80), left(target_blocked_type, 80), greatest(-100, least(100, coalesce(target_risk_delta, 0))), target_chat_id, coalesce(target_metadata, '{}'::jsonb) - 'message' - 'content' - 'phone' - 'email') returning id into event_id;
  insert into public.contact_safety_profiles(user_id, total_events, blocked_attempts, blocked_attempts_opin, blocked_attempts_private, share_requests, share_accepted, share_rejected, share_revoked, risk_score, last_event_type, last_surface, last_blocked_type, last_event_at)
  values (actor_id, 1, case when is_blocked then 1 else 0 end, case when is_blocked and target_surface = 'opin_public' then 1 else 0 end, case when is_blocked and target_surface = 'private_chat' then 1 else 0 end, case when target_event_type = 'share_requested' then 1 else 0 end, case when target_event_type = 'share_accepted' then 1 else 0 end, case when target_event_type = 'share_rejected' then 1 else 0 end, case when target_event_type = 'share_revoked' then 1 else 0 end, coalesce(target_risk_delta, 0), target_event_type, target_surface, target_blocked_type, now())
  on conflict (user_id) do update set total_events = public.contact_safety_profiles.total_events + 1, blocked_attempts = public.contact_safety_profiles.blocked_attempts + case when is_blocked then 1 else 0 end, blocked_attempts_opin = public.contact_safety_profiles.blocked_attempts_opin + case when is_blocked and target_surface = 'opin_public' then 1 else 0 end, blocked_attempts_private = public.contact_safety_profiles.blocked_attempts_private + case when is_blocked and target_surface = 'private_chat' then 1 else 0 end, share_requests = public.contact_safety_profiles.share_requests + case when target_event_type = 'share_requested' then 1 else 0 end, share_accepted = public.contact_safety_profiles.share_accepted + case when target_event_type = 'share_accepted' then 1 else 0 end, share_rejected = public.contact_safety_profiles.share_rejected + case when target_event_type = 'share_rejected' then 1 else 0 end, share_revoked = public.contact_safety_profiles.share_revoked + case when target_event_type = 'share_revoked' then 1 else 0 end, risk_score = public.contact_safety_profiles.risk_score + coalesce(target_risk_delta, 0), last_event_type = target_event_type, last_surface = target_surface, last_blocked_type = target_blocked_type, last_event_at = now();
  return event_id;
end; $$;
grant execute on function public.record_contact_safety_event(uuid, text, text, text, integer, uuid, jsonb) to authenticated;
```

### SQL 24 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270024_badges.sql`

```sql
-- Badges derived from real event participation. Prepared locally only; do NOT execute from this task.

alter table public.profiles add column if not exists events_participated integer not null default 0 check (events_participated >= 0);
alter table public.profiles add column if not exists badge text not null default 'Nuevo';

create or replace function public.increment_my_event_participation()
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); next_count integer; next_badge text;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.profiles set events_participated = events_participated + 1, badge = case when events_participated + 1 >= 50 then 'Anfitrión' when events_participated + 1 >= 25 then 'Veterano' when events_participated + 1 >= 10 then 'Regular' when events_participated + 1 >= 3 then 'Activo' when events_participated + 1 >= 1 then 'Participante' else 'Nuevo' end where id = actor_id returning events_participated, badge into next_count, next_badge;
  return coalesce(next_badge, 'Nuevo');
end; $$;
grant execute on function public.increment_my_event_participation() to authenticated;
```

### SQL 25 — Zona 6: Comunidad, eventos, verificación, soporte y analítica

**Archivo fuente:** `supabase/migrations/202608270025_featured_ads.sql`

```sql
-- Featured ads/channels for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.featured_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 500),
  platform text not null default 'web',
  cta_text text not null default 'Ver más',
  url text not null check (url ~ '^https?://'),
  media_type text not null default 'image' check (media_type in ('image', 'video', 'none')),
  media_url text,
  blur_enabled boolean not null default false,
  blur_strength integer not null default 0 check (blur_strength between 0 and 10),
  badge text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  click_count integer not null default 0 check (click_count >= 0),
  last_clicked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists featured_ads_public_idx on public.featured_ads (is_active, sort_order, starts_at, ends_at);
alter table public.featured_ads enable row level security;
drop policy if exists featured_ads_public_select on public.featured_ads;
create policy featured_ads_public_select on public.featured_ads for select to anon, authenticated using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists featured_ads_admin_select on public.featured_ads;
create policy featured_ads_admin_select on public.featured_ads for select to authenticated using (public.is_admin_user());
drop policy if exists featured_ads_admin_insert on public.featured_ads;
create policy featured_ads_admin_insert on public.featured_ads for insert to authenticated with check (public.is_admin_user() and created_by = auth.uid());
drop policy if exists featured_ads_admin_update on public.featured_ads;
create policy featured_ads_admin_update on public.featured_ads for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists featured_ads_admin_delete on public.featured_ads;
create policy featured_ads_admin_delete on public.featured_ads for delete to authenticated using (public.is_admin_user());

drop trigger if exists featured_ads_set_updated_at on public.featured_ads;
create trigger featured_ads_set_updated_at before update on public.featured_ads for each row execute function public.set_updated_at();

create or replace function public.record_featured_ad_click(target_ad_id uuid)
returns integer language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare next_count integer;
begin
  update public.featured_ads set click_count = click_count + 1, last_clicked_at = now() where id = target_ad_id and is_active = true returning click_count into next_count;
  return coalesce(next_count, 0);
end; $$;
grant execute on function public.record_featured_ad_click(uuid) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'featured_ads') then
      alter publication supabase_realtime add table public.featured_ads;
    end if;
  end if;
end;
$$;
```

### SQL 26 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270026_baul_media_paths.sql`

```sql
-- Baul Storage metadata. Prepared locally only; do NOT execute from this task.

alter table public.baul_cards add column if not exists foto_path text;
alter table public.baul_cards add column if not exists foto_bucket text;
alter table public.baul_cards add column if not exists foto2_path text;
alter table public.baul_cards add column if not exists foto2_bucket text;

alter table public.baul_cards drop constraint if exists baul_cards_foto_bucket_check;
alter table public.baul_cards add constraint baul_cards_foto_bucket_check check (foto_bucket is null or foto_bucket = 'card-media');
alter table public.baul_cards drop constraint if exists baul_cards_foto2_bucket_check;
alter table public.baul_cards add constraint baul_cards_foto2_bucket_check check (foto2_bucket is null or foto2_bucket = 'card-media');
```

### SQL 27 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270027_chat_replies_profile_guards.sql`

```sql
-- Chactivo Supabase-first: public replies and server-owned profile fields.
-- Prepared locally only. Do not execute from this task.

alter table public.messages
  add column if not exists reply_to jsonb;

create index if not exists messages_room_reply_created_idx
  on public.messages (room_id, created_at desc)
  where reply_to is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_reply_to_shape_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_reply_to_shape_check check (
        reply_to is null
        or (
          jsonb_typeof(reply_to) = 'object'
          and nullif(btrim(reply_to ->> 'messageId'), '') is not null
          and char_length(reply_to ->> 'messageId') <= 120
          and char_length(coalesce(reply_to ->> 'username', '')) <= 80
          and char_length(coalesce(reply_to ->> 'content', '')) <= 500
          and char_length(coalesce(reply_to ->> 'type', '')) <= 20
        )
      );
  end if;
end;
$$;

-- Prevent clients from self-awarding privileges, identity flags or system counters.
-- Authorized SECURITY DEFINER RPCs may write protected fields. Admin RPCs are
-- authorized by the existing admin helper; the owner-only event-participation RPC
-- additionally sets the transaction-local marker below.
create or replace function public.profile_system_write_authorized(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or public.is_admin_user(auth.uid())
    or (
      coalesce(current_setting('chactivo.profile_system_write', true), '') = 'on'
      and target_user_id = auth.uid()
    );
$$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, auth, pg_temp
as $$
begin
  if (
    new.is_guest is distinct from old.is_guest
    or new.role is distinct from old.role
    or new.is_premium is distinct from old.is_premium
    or new.verified is distinct from old.verified
    or new.has_special_avatar is distinct from old.has_special_avatar
    or new.is_featured is distinct from old.is_featured
    or new.is_moderator is distinct from old.is_moderator
    or new.is_pro_user is distinct from old.is_pro_user
    or new.can_upload_second_photo is distinct from old.can_upload_second_photo
    or new.has_featured_card is distinct from old.has_featured_card
    or new.has_rainbow_border is distinct from old.has_rainbow_border
    or new.has_pro_badge is distinct from old.has_pro_badge
    or new.chat_photo_access is distinct from old.chat_photo_access
    or new.badge is distinct from old.badge
    or new.events_participated is distinct from old.events_participated
  ) and not public.profile_system_write_authorized(new.id) then
    raise exception 'system_profile_fields_are_server_owned';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_system_fields on public.profiles;
create trigger profiles_protect_system_fields
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

-- The owner-only badge RPC is allowed to update only its own participation count.
create or replace function public.increment_my_event_participation()
returns text
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  next_count integer;
  next_badge text;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  perform set_config('chactivo.profile_system_write', 'on', true);
  update public.profiles
  set events_participated = events_participated + 1,
      badge = case
        when events_participated + 1 >= 50 then 'Anfitrión'
        when events_participated + 1 >= 25 then 'Veterano'
        when events_participated + 1 >= 10 then 'Regular'
        when events_participated + 1 >= 3 then 'Activo'
        when events_participated + 1 >= 1 then 'Participante'
        else 'Nuevo'
      end
  where id = actor_id
  returning events_participated, badge into next_count, next_badge;
  return coalesce(next_badge, 'Nuevo');
end;
$$;

grant execute on function public.increment_my_event_participation() to authenticated;

-- Re-run grants/policies defensively where this migration replaces functions.
revoke all on function public.profile_system_write_authorized(uuid) from public;
grant execute on function public.profile_system_write_authorized(uuid) to authenticated;
```

### SQL 28 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270028_private_replies_rpc.sql`

```sql
-- Chactivo Supabase-first: private reply payloads.
-- Prepared locally only. Do not execute from this task.

alter table public.private_messages
  add column if not exists reply_to jsonb;

create index if not exists private_messages_conversation_reply_created_idx
  on public.private_messages (conversation_id, created_at desc)
  where reply_to is not null;

drop function if exists public.send_private_message(uuid, text, text, text, text, text, text, integer);

create or replace function public.send_private_message(
  target_conversation_id uuid,
  target_client_id text,
  target_content text default '',
  target_message_type text default 'text',
  target_media_path text default null,
  target_media_bucket text default null,
  target_media_mime text default null,
  target_media_size integer default null,
  target_reply_to jsonb default null
)
returns table (message_id uuid, created_at timestamptz, client_id text, inserted boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  message_row public.private_messages%rowtype;
  normalized_type text := lower(coalesce(target_message_type, 'text'));
  normalized_content text := btrim(coalesce(target_content, ''));
  normalized_bucket text := nullif(btrim(coalesce(target_media_bucket, '')), '');
  normalized_path text := nullif(btrim(coalesce(target_media_path, '')), '');
  normalized_mime text := lower(nullif(btrim(coalesce(target_media_mime, '')), ''));
  normalized_reply jsonb := null;
  inserted_now boolean := false;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_conversation_id is null then raise exception 'INVALID_CONVERSATION'; end if;
  if target_client_id is null or char_length(target_client_id) < 8 or char_length(target_client_id) > 160 then raise exception 'INVALID_CLIENT_ID'; end if;
  if normalized_type not in ('text', 'image') then raise exception 'INVALID_MESSAGE_TYPE'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  if exists (
    select 1
    from public.blocks b
    where (
      b.blocker_id = actor_id
      and b.blocked_id in (select cm.user_id from public.conversation_members cm where cm.conversation_id = target_conversation_id and cm.left_at is null and cm.user_id <> actor_id)
    ) or (
      b.blocked_id = actor_id
      and b.blocker_id in (select cm.user_id from public.conversation_members cm where cm.conversation_id = target_conversation_id and cm.left_at is null and cm.user_id <> actor_id)
    )
  ) then raise exception 'BLOCKED'; end if;

  if target_reply_to is not null then
    if jsonb_typeof(target_reply_to) <> 'object'
       or nullif(btrim(target_reply_to ->> 'messageId'), '') is null
       or char_length(target_reply_to ->> 'messageId') > 120 then
      raise exception 'INVALID_REPLY';
    end if;
    normalized_reply := jsonb_build_object(
      'messageId', left(btrim(target_reply_to ->> 'messageId'), 120),
      'username', left(coalesce(nullif(btrim(target_reply_to ->> 'username'), ''), 'Usuario'), 80),
      'content', left(coalesce(target_reply_to ->> 'content', ''), 500),
      'type', left(coalesce(nullif(btrim(target_reply_to ->> 'type'), ''), 'text'), 20)
    );
  end if;

  if normalized_type = 'text' then
    if normalized_content = '' or char_length(normalized_content) > 2000 then raise exception 'INVALID_MESSAGE_CONTENT'; end if;
    normalized_bucket := null;
    normalized_path := null;
    normalized_mime := null;
    target_media_size := null;
  else
    if normalized_bucket <> 'chat-private'
       or normalized_path is null
       or split_part(normalized_path, '/', 1) <> target_conversation_id::text
       or split_part(normalized_path, '/', 2) <> actor_id::text
       or normalized_mime not in ('image/jpeg', 'image/png', 'image/webp')
       or target_media_size is null
       or target_media_size < 1
       or target_media_size > 143360 then
      raise exception 'INVALID_PRIVATE_IMAGE';
    end if;
    normalized_content := 'Imagen';
  end if;

  insert into public.private_messages (
    conversation_id, sender_id, client_id, content, message_type,
    media_path, media_bucket, media_mime, media_size, reply_to
  )
  values (
    target_conversation_id, actor_id, left(target_client_id, 160), normalized_content, normalized_type,
    normalized_path, normalized_bucket, normalized_mime, target_media_size, normalized_reply
  )
  on conflict (conversation_id, sender_id, client_id) do nothing
  returning * into message_row;

  if message_row.id is null then
    select pm.* into message_row
    from public.private_messages pm
    where pm.conversation_id = target_conversation_id
      and pm.sender_id = actor_id
      and pm.client_id = left(target_client_id, 160)
    limit 1;
    if message_row.id is null then raise exception 'MESSAGE_INSERT_FAILED'; end if;
  else
    inserted_now := true;
  end if;

  if inserted_now then
    update public.conversations
    set last_message_id = message_row.id,
        last_message_at = message_row.created_at,
        last_message_preview = case when normalized_type = 'image' then 'Imagen' else left(normalized_content, 160) end,
        last_message_type = normalized_type,
        last_message_sender_id = actor_id,
        updated_at = now()
    where id = target_conversation_id;

    insert into public.private_message_receipts (private_message_id, user_id, delivered_at, read_at)
    select message_row.id, cm.user_id,
      case when cm.user_id = actor_id then now() else null end,
      case when cm.user_id = actor_id then now() else null end
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.left_at is null
    on conflict (private_message_id, user_id) do nothing;

    insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
    select cm.user_id, actor_id, 'private_message', 'Nuevo mensaje privado',
      case when normalized_type = 'image' then 'Te enviaron una imagen.' else left(normalized_content, 500) end,
      'private_message', message_row.id
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.left_at is null
      and cm.user_id <> actor_id;
  end if;

  return query select message_row.id, message_row.created_at, message_row.client_id, inserted_now;
end;
$$;

grant execute on function public.send_private_message(uuid, text, text, text, text, text, text, integer, jsonb) to authenticated;
```

### SQL 29 — Zona 4: Seguridad, RLS, Storage, Realtime y permisos

**Archivo fuente:** `supabase/migrations/202608270029_security_definer_grants.sql`

```sql
-- Chactivo Supabase-first: explicit privileges for SECURITY DEFINER functions.
-- Prepared locally only. Do not execute from this task.
-- PostgreSQL grants EXECUTE to PUBLIC by default; remove that implicit access.

revoke all on function public.handle_new_user_profile() from public;
revoke all on function public.is_admin_user(uuid) from public;
revoke all on function public.admin_create_reward(uuid, text, text, text, timestamptz, text, jsonb) from public;
revoke all on function public.admin_revoke_reward(uuid, text) from public;
revoke all on function public.get_or_create_direct_conversation(uuid) from public;
revoke all on function public.toggle_baul_like(uuid) from public;
revoke all on function public.record_baul_daily_event(uuid, text) from public;
revoke all on function public.send_baul_note(uuid, text) from public;
revoke all on function public.send_private_request(uuid, text) from public;
revoke all on function public.send_private_message(uuid, text, text, text, text, text, text, integer, jsonb) from public;
revoke all on function public.mark_private_message_receipts(uuid, uuid[], boolean) from public;
revoke all on function public.mark_private_conversation_read(uuid) from public;
revoke all on function public.respond_private_request(uuid, boolean) from public;
revoke all on function public.refresh_opin_post_metrics(uuid) from public;
revoke all on function public.record_opin_action(uuid, text) from public;
revoke all on function public.request_private_contact_share(uuid) from public;
revoke all on function public.respond_private_contact_share(uuid, uuid, boolean) from public;
revoke all on function public.revoke_private_contact_share(uuid, uuid) from public;
revoke all on function public.get_private_chat_shared_contacts(uuid, uuid[]) from public;
revoke all on function public.get_private_contact_state(uuid) from public;
revoke all on function public.get_my_moderation_state() from public;
revoke all on function public.record_moderation_violation(text, text, integer, text) from public;
revoke all on function public.record_moderation_event(uuid, text, jsonb) from public;
revoke all on function public.admin_create_moderation_action(uuid, text, text, timestamptz) from public;
revoke all on function public.admin_revoke_moderation_action(uuid) from public;
revoke all on function public.admin_delete_public_messages(text, uuid, boolean) from public;
revoke all on function public.admin_delete_public_message(text, uuid) from public;
revoke all on function public.create_system_notification(uuid, text, text, text, text, text, text, uuid) from public;
revoke all on function public.admin_broadcast_system_notification(text, text, text, text, text, text, text) from public;
revoke all on function public.admin_update_report_status(uuid, text, text) from public;
revoke all on function public.send_ticket_message(uuid, text, jsonb) from public;
revoke all on function public.record_analytics_event(text, text, jsonb) from public;
revoke all on function public.get_my_analytics_day(date) from public;
revoke all on function public.get_analytics_day(date) from public;
revoke all on function public.get_my_daily_limits() from public;
revoke all on function public.increment_my_daily_limit(text) from public;
revoke all on function public.toggle_forum_vote(text, uuid, boolean) from public;
revoke all on function public.increment_forum_view(uuid) from public;
revoke all on function public.record_contact_safety_event(uuid, text, text, text, integer, uuid, jsonb) from public;
revoke all on function public.increment_my_event_participation() from public;
revoke all on function public.profile_system_write_authorized(uuid) from public;
revoke all on function public.get_my_verification_status() from public;
revoke all on function public.record_user_connection() from public;
revoke all on function public.set_my_verification(boolean) from public;

-- Internal trigger functions are not callable by client roles.
revoke all on function public.sync_event_attendee_count() from public;
revoke all on function public.sync_forum_reply_count() from public;

grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.get_my_active_rewards() to authenticated;
grant execute on function public.admin_create_reward(uuid, text, text, text, timestamptz, text, jsonb) to authenticated;
grant execute on function public.admin_revoke_reward(uuid, text) to authenticated;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
grant execute on function public.toggle_baul_like(uuid) to authenticated;
grant execute on function public.record_baul_daily_event(uuid, text) to authenticated;
grant execute on function public.send_baul_note(uuid, text) to authenticated;
grant execute on function public.send_private_request(uuid, text) to authenticated;
grant execute on function public.send_private_message(uuid, text, text, text, text, text, text, integer, jsonb) to authenticated;
grant execute on function public.mark_private_message_receipts(uuid, uuid[], boolean) to authenticated;
grant execute on function public.mark_private_conversation_read(uuid) to authenticated;
grant execute on function public.respond_private_request(uuid, boolean) to authenticated;
grant execute on function public.refresh_opin_post_metrics(uuid) to authenticated;
grant execute on function public.record_opin_action(uuid, text) to authenticated;
grant execute on function public.request_private_contact_share(uuid) to authenticated;
grant execute on function public.respond_private_contact_share(uuid, uuid, boolean) to authenticated;
grant execute on function public.revoke_private_contact_share(uuid, uuid) to authenticated;
grant execute on function public.get_private_chat_shared_contacts(uuid, uuid[]) to authenticated;
grant execute on function public.get_private_contact_state(uuid) to authenticated;
grant execute on function public.get_my_moderation_state() to authenticated;
grant execute on function public.record_moderation_violation(text, text, integer, text) to authenticated;
grant execute on function public.record_moderation_event(uuid, text, jsonb) to authenticated;
grant execute on function public.admin_create_moderation_action(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.admin_revoke_moderation_action(uuid) to authenticated;
grant execute on function public.admin_delete_public_messages(text, uuid, boolean) to authenticated;
grant execute on function public.admin_delete_public_message(text, uuid) to authenticated;
grant execute on function public.create_system_notification(uuid, text, text, text, text, text, text, uuid) to authenticated;
grant execute on function public.admin_broadcast_system_notification(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.get_top_20_active_users() to authenticated;
grant execute on function public.admin_update_report_status(uuid, text, text) to authenticated;
grant execute on function public.send_ticket_message(uuid, text, jsonb) to authenticated;
grant execute on function public.record_analytics_event(text, text, jsonb) to authenticated;
grant execute on function public.get_my_analytics_day(date) to authenticated;
grant execute on function public.get_analytics_day(date) to authenticated;
grant execute on function public.get_my_daily_limits() to authenticated;
grant execute on function public.increment_my_daily_limit(text) to authenticated;
grant execute on function public.toggle_forum_vote(text, uuid, boolean) to authenticated;
grant execute on function public.increment_forum_view(uuid) to anon, authenticated;
grant execute on function public.record_contact_safety_event(uuid, text, text, text, integer, uuid, jsonb) to authenticated;
grant execute on function public.increment_my_event_participation() to authenticated;
grant execute on function public.profile_system_write_authorized(uuid) to authenticated;
grant execute on function public.get_my_verification_status() to authenticated;
grant execute on function public.record_user_connection() to authenticated;
grant execute on function public.set_my_verification(boolean) to authenticated;
```

### SQL 30 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270030_baul_set_like.sql`

```sql
-- Chactivo Supabase-first: deterministic Baul like/unlike.
-- Prepared locally only. Do not execute from this task.

create or replace function public.set_baul_like(target_user_id uuid, desired_liked boolean)
returns table (liked boolean, is_match boolean, match_key text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  was_liked boolean;
  target_liked_actor boolean;
  next_user_a uuid;
  next_user_b uuid;
  next_match_key text;
  had_active_match boolean;
begin
  if v_actor_id is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform public.assert_baul_target(target_user_id);
  if not exists (select 1 from public.baul_cards where user_id = v_actor_id) then raise exception 'actor_baul_card_missing' using errcode = '42501'; end if;

  perform pg_advisory_xact_lock(hashtextextended(least(v_actor_id::text, target_user_id::text) || ':' || greatest(v_actor_id::text, target_user_id::text), 0));

  select exists (
    select 1 from public.baul_likes bl where bl.actor_id = v_actor_id and bl.target_id = target_user_id
  ) into was_liked;

  if coalesce(desired_liked, false) then
    insert into public.baul_likes (actor_id, target_id)
    values (v_actor_id, target_user_id)
    on conflict do nothing;
    liked := true;
  else
    delete from public.baul_likes
    where baul_likes.actor_id = v_actor_id and baul_likes.target_id = target_user_id;
    liked := false;
  end if;

  select exists (
    select 1 from public.baul_likes bl where bl.actor_id = target_user_id and bl.target_id = v_actor_id
  ) into target_liked_actor;

  next_user_a := least(v_actor_id, target_user_id);
  next_user_b := greatest(v_actor_id, target_user_id);
  next_match_key := next_user_a::text || '_' || next_user_b::text;
  is_match := liked and target_liked_actor;
  match_key := case when is_match then next_match_key else null end;

  select exists (
    select 1 from public.baul_matches bm where bm.user_a = next_user_a and bm.user_b = next_user_b and bm.status = 'active'
  ) into had_active_match;

  if is_match then
    insert into public.baul_matches (user_a, user_b, status)
    values (next_user_a, next_user_b, 'active')
    on conflict (user_a, user_b) do update set status = 'active', updated_at = now();
  else
    delete from public.baul_matches where user_a = next_user_a and user_b = next_user_b;
  end if;

  if liked and not was_liked then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      target_user_id,
      v_actor_id,
      case when is_match then 'baul_match' else 'baul_like' end,
      case when is_match then 'Nuevo match en Baúl' else 'Interés en tu tarjeta' end,
      case when is_match then 'También se interesaron mutuamente.' else 'Alguien marcó tu tarjeta como interesante.' end,
      'baul_card'
    );
  end if;

  if is_match and not had_active_match then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      v_actor_id,
      target_user_id,
      'baul_match',
      'Nuevo match en Baúl',
      'El interés es mutuo. Ya pueden iniciar una conversación.',
      'baul_match'
    );
  end if;

  return next;
end;
$$;

revoke all on function public.set_baul_like(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_baul_like(uuid, boolean) to authenticated;
```

### SQL 31 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270031_baul_match_reads.sql`

```sql
-- Chactivo Supabase-first: per-user Baul match read state.
-- Prepared locally only. Do not execute from this task.

create table if not exists public.baul_match_reads (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_a, user_b, user_id),
  check (user_a < user_b),
  check (user_id = user_a or user_id = user_b)
);

create index if not exists baul_match_reads_user_idx
  on public.baul_match_reads (user_id, read_at desc);

alter table public.baul_match_reads enable row level security;
drop policy if exists baul_match_reads_participant_select on public.baul_match_reads;
create policy baul_match_reads_participant_select on public.baul_match_reads
for select to authenticated
using (user_id = auth.uid());

create or replace function public.get_my_baul_unread_match_count()
returns integer
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select count(*)::integer
  from public.baul_matches m
  left join public.baul_match_reads r
    on r.user_a = m.user_a and r.user_b = m.user_b and r.user_id = auth.uid()
  where m.status = 'active'
    and (r.read_at is null or m.updated_at > r.read_at)
    and (m.user_a = auth.uid() or m.user_b = auth.uid());
$$;

revoke all on function public.get_my_baul_unread_match_count() from public, anon, authenticated;
grant execute on function public.get_my_baul_unread_match_count() to authenticated;

create or replace function public.mark_my_baul_match_read(match_key text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  first_id uuid;
  second_id uuid;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  first_id := split_part(match_key, '_', 1)::uuid;
  second_id := split_part(match_key, '_', 2)::uuid;
  if first_id is null or second_id is null or first_id >= second_id then raise exception 'INVALID_MATCH_KEY'; end if;
  if actor_id <> first_id and actor_id <> second_id then raise exception 'MATCH_NOT_OWNED'; end if;
  if not exists (select 1 from public.baul_matches where user_a = first_id and user_b = second_id and status = 'active') then return false; end if;
  insert into public.baul_match_reads (user_a, user_b, user_id, read_at)
  values (first_id, second_id, actor_id, now())
  on conflict (user_a, user_b, user_id) do update set read_at = now();
  return true;
exception when invalid_text_representation then
  raise exception 'INVALID_MATCH_KEY';
end;
$$;

revoke all on function public.mark_my_baul_match_read(text) from public, anon, authenticated;
grant execute on function public.mark_my_baul_match_read(text) to authenticated;
```

### SQL 32 — Zona 3: OPIN, Baúl, contactos y media

**Archivo fuente:** `supabase/migrations/202608270032_baul_media_read_policies.sql`

```sql
-- Chactivo Supabase-first: Baul card and private media read policies.
-- Prepared locally only. Do not execute from this task.

-- The owner must be able to load a hidden draft card from the editor.
drop policy if exists baul_cards_owner_select on public.baul_cards;
create policy baul_cards_owner_select on public.baul_cards
for select to authenticated
using (user_id = auth.uid());

-- card-media remains private. Signed URLs can be created only for the owner or
-- for a currently visible, non-expired card that references the exact object.
drop policy if exists card_media_visible_read on storage.objects;
create policy card_media_visible_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'card-media'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.baul_cards c
      where c.card_visible = true
        and (c.intent_expires_at is null or c.intent_expires_at > now())
        and (c.foto_path = name or c.foto2_path = name)
    )
  )
);
```

### SQL 33 — Zona 5: Moderación, denuncias y seguridad comunitaria

**Archivo fuente:** `supabase/migrations/202608270033_ticket_log_hardening.sql`

```sql
-- Chactivo Supabase-first: ticket log hardening.
-- Prepared locally only. Do not execute from this task.

-- Customer messages may be external; audit logs are server/admin owned.
drop policy if exists tickets_logs_insert on public.ticket_logs;
create policy tickets_logs_insert on public.ticket_logs
for insert to authenticated
with check (actor_id = auth.uid() and public.is_admin_user());
```

### SQL 34 — Zona 2: Chat público, chat privado y estado de conversación

**Archivo fuente:** `supabase/migrations/202608270034_private_request_notification_state.sql`

```sql
-- Chactivo Supabase-first: synchronize private-request notification state.
-- Prepared locally only. Do not execute from this task.

create or replace function public.sync_private_request_notification_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    update public.notifications
    set read_at = coalesce(read_at, now())
    where entity_type = 'private_request'
      and entity_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists private_request_notification_state on public.private_requests;
create trigger private_request_notification_state
after update of status on public.private_requests
for each row execute function public.sync_private_request_notification_state();

revoke all on function public.sync_private_request_notification_state() from public;
```

### SQL 35 — Zona 4: Seguridad, RLS, Storage, Realtime y permisos

**Archivo fuente:** `supabase/migrations/202608270035_explicit_table_grants.sql`

```sql
-- Chactivo Supabase-first: explicit table grants derived from policies.
-- Prepared locally only. Do not execute from this task.
-- RLS policies and table privileges are separate controls; revoke implicit client grants first.
revoke all on table public.audit_events from anon, authenticated;
revoke all on table public.baul_footprints from anon, authenticated;
revoke all on table public.baul_impressions from anon, authenticated;
revoke all on table public.baul_likes from anon, authenticated;
revoke all on table public.baul_notes from anon, authenticated;
revoke all on table public.baul_visits from anon, authenticated;
revoke all on table public.media_objects from anon, authenticated;
revoke all on table public.opin_actions from anon, authenticated;
revoke all on table public.user_migration_map from anon, authenticated;

revoke all on table public.analytics_events from anon, authenticated;
grant select on table public.analytics_events to authenticated;

revoke all on table public.baul_cards from anon, authenticated;
grant select on table public.baul_cards to anon;
grant select, insert, update, delete on table public.baul_cards to authenticated;

revoke all on table public.baul_match_reads from anon, authenticated;
grant select on table public.baul_match_reads to authenticated;

revoke all on table public.baul_matches from anon, authenticated;
grant select on table public.baul_matches to authenticated;

revoke all on table public.blocks from anon, authenticated;
grant select, insert, delete on table public.blocks to authenticated;

revoke all on table public.contact_safety_events from anon, authenticated;
grant select on table public.contact_safety_events to authenticated;

revoke all on table public.contact_safety_profiles from anon, authenticated;
grant select on table public.contact_safety_profiles to authenticated;

revoke all on table public.contacts from anon, authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;

revoke all on table public.conversation_members from anon, authenticated;
grant select, insert, update on table public.conversation_members to authenticated;

revoke all on table public.conversations from anon, authenticated;
grant select, insert, update on table public.conversations to authenticated;

revoke all on table public.daily_user_limits from anon, authenticated;
grant select on table public.daily_user_limits to authenticated;

revoke all on table public.esencias from anon, authenticated;
grant select on table public.esencias to anon, authenticated;
grant insert, delete on table public.esencias to authenticated;

revoke all on table public.event_attendees from anon, authenticated;
grant select on table public.event_attendees to anon, authenticated;
grant insert, delete on table public.event_attendees to authenticated;

revoke all on table public.events from anon, authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update, delete on table public.events to authenticated;

revoke all on table public.featured_ads from anon, authenticated;
grant select on table public.featured_ads to anon, authenticated;
grant insert, update, delete on table public.featured_ads to authenticated;

revoke all on table public.forum_replies from anon, authenticated;
grant select on table public.forum_replies to anon, authenticated;
grant insert, update, delete on table public.forum_replies to authenticated;

revoke all on table public.forum_threads from anon, authenticated;
grant select on table public.forum_threads to anon, authenticated;
grant insert, update, delete on table public.forum_threads to authenticated;

revoke all on table public.forum_votes from anon, authenticated;
grant select on table public.forum_votes to authenticated;

revoke all on table public.message_reactions from anon, authenticated;
grant select on table public.message_reactions to anon, authenticated;
grant insert, update, delete on table public.message_reactions to authenticated;

revoke all on table public.message_receipts from anon, authenticated;
grant select, insert, update, delete on table public.message_receipts to authenticated;

revoke all on table public.messages from anon, authenticated;
grant select on table public.messages to anon, authenticated;
grant insert, update, delete on table public.messages to authenticated;

revoke all on table public.moderation_actions from anon, authenticated;
grant select on table public.moderation_actions to authenticated;

revoke all on table public.notifications from anon, authenticated;
grant select, update on table public.notifications to authenticated;

revoke all on table public.opin_comments from anon, authenticated;
grant select on table public.opin_comments to anon, authenticated;
grant insert, update, delete on table public.opin_comments to authenticated;

revoke all on table public.opin_follows from anon, authenticated;
grant select, insert, update, delete on table public.opin_follows to authenticated;

revoke all on table public.opin_likes from anon, authenticated;
grant select, insert, update, delete on table public.opin_likes to authenticated;

revoke all on table public.opin_posts from anon, authenticated;
grant select on table public.opin_posts to anon, authenticated;
grant insert, update, delete on table public.opin_posts to authenticated;

revoke all on table public.opin_reactions from anon, authenticated;
grant select, insert, update, delete on table public.opin_reactions to authenticated;

revoke all on table public.opin_saves from anon, authenticated;
grant select, insert, update, delete on table public.opin_saves to authenticated;

revoke all on table public.private_contact_shares from anon, authenticated;
grant select on table public.private_contact_shares to authenticated;

revoke all on table public.private_message_receipts from anon, authenticated;
grant select on table public.private_message_receipts to authenticated;

revoke all on table public.private_messages from anon, authenticated;
grant select, insert, update, delete on table public.private_messages to authenticated;

revoke all on table public.private_requests from anon, authenticated;
grant select, insert, update on table public.private_requests to authenticated;

revoke all on table public.private_typing from anon, authenticated;
grant select, insert, update, delete on table public.private_typing to authenticated;

revoke all on table public.profile_private_contacts from anon, authenticated;
grant select, insert, update, delete on table public.profile_private_contacts to authenticated;

revoke all on table public.profile_private_settings from anon, authenticated;
grant select, insert, update, delete on table public.profile_private_settings to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

revoke all on table public.reports from anon, authenticated;
grant select, insert on table public.reports to authenticated;

revoke all on table public.room_presence from anon, authenticated;
grant select, insert, update, delete on table public.room_presence to authenticated;

revoke all on table public.room_state_reactions from anon, authenticated;
grant select on table public.room_state_reactions to anon, authenticated;
grant insert, update, delete on table public.room_state_reactions to authenticated;

revoke all on table public.room_states from anon, authenticated;
grant select on table public.room_states to anon, authenticated;
grant insert, update, delete on table public.room_states to authenticated;

revoke all on table public.rooms from anon, authenticated;
grant select on table public.rooms to anon, authenticated;

revoke all on table public.saved_profiles from anon, authenticated;
grant select, insert, update, delete on table public.saved_profiles to authenticated;

revoke all on table public.ticket_logs from anon, authenticated;
grant select, insert on table public.ticket_logs to authenticated;

revoke all on table public.ticket_messages from anon, authenticated;
grant select, insert on table public.ticket_messages to authenticated;

revoke all on table public.tickets from anon, authenticated;
grant select, insert, update on table public.tickets to authenticated;

revoke all on table public.user_preferences from anon, authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;

revoke all on table public.user_rewards from anon, authenticated;
grant select on table public.user_rewards to authenticated;

revoke all on table public.user_verification from anon, authenticated;
grant select on table public.user_verification to authenticated;
```

## SQL 36 — Verificación posterior de solo lectura

**Archivo fuente:** `documentacion_md/07-firebase-supabase-db/VERIFICACION_POST_MIGRACION_SUPABASE_2026.sql`

Ejecuta este bloque únicamente después de que `SQL 35` haya terminado correctamente. Es una verificación de tablas, RLS, Storage, Realtime, RPCs, columnas, índices y posibles columnas sensibles; no crea ni modifica objetos.

```sql
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
```

## Criterio de finalización

La carga SQL no se considera terminada sólo porque el editor acepte algunos bloques. Deben terminar correctamente las 35 migraciones, la verificación debe mostrar las tablas, políticas, funciones, buckets, publicación Realtime, columnas e índices esperados, y después deben ejecutarse pruebas funcionales controladas. En particular, la subida de fotos exige verificar Storage y sus políticas, no sólo la existencia de `media_objects` o de columnas de rutas.

Baúl debe mantenerse desactivado hasta comprobar sus tablas, RPCs, Storage, políticas de lectura y privacidad. Del mismo modo, no se debe declarar operativo el chat privado, OPIN, fotos, contactos o notificaciones hasta probarlos con Supabase Auth real y datos de prueba no sensibles.

## Fuentes locales

El orden y el contenido provienen de las migraciones versionadas del repositorio. El contrato estático de cobertura se encuentra en `tests/supabase-migration-contract.test.js`; la verificación ampliada está en `VERIFICACION_POST_MIGRACION_SUPABASE_2026.sql`. El archivo consolidado antiguo no debe ejecutarse junto con estas 35 migraciones porque duplicaría objetos.
