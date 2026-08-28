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
