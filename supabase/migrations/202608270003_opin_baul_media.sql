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
