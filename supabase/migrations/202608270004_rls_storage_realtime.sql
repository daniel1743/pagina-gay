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
