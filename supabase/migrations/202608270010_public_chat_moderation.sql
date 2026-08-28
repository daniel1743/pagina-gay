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
