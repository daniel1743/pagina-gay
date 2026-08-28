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
