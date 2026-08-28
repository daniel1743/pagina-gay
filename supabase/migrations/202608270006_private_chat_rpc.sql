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
