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
