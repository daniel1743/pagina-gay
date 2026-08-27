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
