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
