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
