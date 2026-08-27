-- Contact safety telemetry for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.contact_safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('blocked_attempt', 'share_requested', 'share_accepted', 'share_rejected', 'share_revoked')),
  surface text not null default 'unknown',
  blocked_type text,
  risk_delta integer not null default 0 check (risk_delta between -100 and 100),
  chat_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists contact_safety_events_user_idx on public.contact_safety_events (user_id, created_at desc);
alter table public.contact_safety_events enable row level security;
drop policy if exists contact_safety_events_owner_select on public.contact_safety_events;
create policy contact_safety_events_owner_select on public.contact_safety_events for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create table if not exists public.contact_safety_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_events integer not null default 0,
  blocked_attempts integer not null default 0,
  blocked_attempts_opin integer not null default 0,
  blocked_attempts_private integer not null default 0,
  share_requests integer not null default 0,
  share_accepted integer not null default 0,
  share_rejected integer not null default 0,
  share_revoked integer not null default 0,
  risk_score integer not null default 0,
  last_event_type text,
  last_surface text,
  last_blocked_type text,
  last_event_at timestamptz
);
alter table public.contact_safety_profiles enable row level security;
drop policy if exists contact_safety_profiles_owner_select on public.contact_safety_profiles;
create policy contact_safety_profiles_owner_select on public.contact_safety_profiles for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.record_contact_safety_event(
  target_user_id uuid,
  target_event_type text,
  target_surface text default 'unknown',
  target_blocked_type text default null,
  target_risk_delta integer default 0,
  target_chat_id uuid default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); event_id uuid; is_blocked boolean := target_event_type = 'blocked_attempt';
begin
  if actor_id is null or target_user_id is null or actor_id <> target_user_id then raise exception 'SAFETY_EVENT_FORBIDDEN'; end if;
  if target_event_type not in ('blocked_attempt', 'share_requested', 'share_accepted', 'share_rejected', 'share_revoked') then raise exception 'INVALID_SAFETY_EVENT'; end if;
  insert into public.contact_safety_events(user_id, event_type, surface, blocked_type, risk_delta, chat_id, metadata)
  values (actor_id, target_event_type, left(coalesce(target_surface, 'unknown'), 80), left(target_blocked_type, 80), greatest(-100, least(100, coalesce(target_risk_delta, 0))), target_chat_id, coalesce(target_metadata, '{}'::jsonb) - 'message' - 'content' - 'phone' - 'email') returning id into event_id;
  insert into public.contact_safety_profiles(user_id, total_events, blocked_attempts, blocked_attempts_opin, blocked_attempts_private, share_requests, share_accepted, share_rejected, share_revoked, risk_score, last_event_type, last_surface, last_blocked_type, last_event_at)
  values (actor_id, 1, case when is_blocked then 1 else 0 end, case when is_blocked and target_surface = 'opin_public' then 1 else 0 end, case when is_blocked and target_surface = 'private_chat' then 1 else 0 end, case when target_event_type = 'share_requested' then 1 else 0 end, case when target_event_type = 'share_accepted' then 1 else 0 end, case when target_event_type = 'share_rejected' then 1 else 0 end, case when target_event_type = 'share_revoked' then 1 else 0 end, coalesce(target_risk_delta, 0), target_event_type, target_surface, target_blocked_type, now())
  on conflict (user_id) do update set total_events = public.contact_safety_profiles.total_events + 1, blocked_attempts = public.contact_safety_profiles.blocked_attempts + case when is_blocked then 1 else 0 end, blocked_attempts_opin = public.contact_safety_profiles.blocked_attempts_opin + case when is_blocked and target_surface = 'opin_public' then 1 else 0 end, blocked_attempts_private = public.contact_safety_profiles.blocked_attempts_private + case when is_blocked and target_surface = 'private_chat' then 1 else 0 end, share_requests = public.contact_safety_profiles.share_requests + case when target_event_type = 'share_requested' then 1 else 0 end, share_accepted = public.contact_safety_profiles.share_accepted + case when target_event_type = 'share_accepted' then 1 else 0 end, share_rejected = public.contact_safety_profiles.share_rejected + case when target_event_type = 'share_rejected' then 1 else 0 end, share_revoked = public.contact_safety_profiles.share_revoked + case when target_event_type = 'share_revoked' then 1 else 0 end, risk_score = public.contact_safety_profiles.risk_score + coalesce(target_risk_delta, 0), last_event_type = target_event_type, last_surface = target_surface, last_blocked_type = target_blocked_type, last_event_at = now();
  return event_id;
end; $$;
grant execute on function public.record_contact_safety_event(uuid, text, text, text, integer, uuid, jsonb) to authenticated;
