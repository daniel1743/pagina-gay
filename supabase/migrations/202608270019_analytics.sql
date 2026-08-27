-- Minimal analytics persistence for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  event_type text not null check (char_length(event_type) between 1 and 80),
  event_date date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_date_type_idx on public.analytics_events (event_date, event_type, created_at desc);
create index if not exists analytics_events_user_date_idx on public.analytics_events (user_id, event_date, event_type);
alter table public.analytics_events enable row level security;
drop policy if exists analytics_owner_select on public.analytics_events;
create policy analytics_owner_select on public.analytics_events for select to authenticated using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.record_analytics_event(
  target_event_type text,
  target_session_id text default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  event_id uuid;
  safe_metadata jsonb := coalesce(target_metadata, '{}'::jsonb) - array['message', 'content', 'privateMessage', 'phone', 'email'];
  safe_type text := left(regexp_replace(lower(coalesce(target_event_type, 'unknown')), '[^a-z0-9_]', '_', 'g'), 80);
begin
  if actor_id is null then return null; end if;
  insert into public.analytics_events (user_id, session_id, event_type, metadata)
  values (actor_id, left(target_session_id, 160), safe_type, safe_metadata)
  returning id into event_id;
  return event_id;
end;
$$;

grant execute on function public.record_analytics_event(text, text, jsonb) to authenticated;

create or replace function public.get_my_analytics_day(target_day date default current_date)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'date', target_day,
    'pageViews', count(*) filter (where event_type = 'page_view'),
    'registrations', count(*) filter (where event_type = 'user_register'),
    'logins', count(*) filter (where event_type = 'user_login'),
    'messagesSent', count(*) filter (where event_type = 'message_sent'),
    'roomsCreated', count(*) filter (where event_type in ('room_created', 'custom_room_created')),
    'roomsJoined', count(*) filter (where event_type = 'room_joined'),
    'pageExits', count(*) filter (where event_type = 'page_exit')
  )
  from public.analytics_events
  where user_id = auth.uid() and event_date = target_day;
$$;

grant execute on function public.get_my_analytics_day(date) to authenticated;

create or replace function public.get_analytics_day(target_day date default current_date)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'date', target_day,
    'pageViews', count(*) filter (where event_type = 'page_view'),
    'registrations', count(*) filter (where event_type = 'user_register'),
    'logins', count(*) filter (where event_type = 'user_login'),
    'messagesSent', count(*) filter (where event_type = 'message_sent'),
    'roomsCreated', count(*) filter (where event_type in ('room_created', 'custom_room_created')),
    'roomsJoined', count(*) filter (where event_type = 'room_joined'),
    'pageExits', count(*) filter (where event_type = 'page_exit')
  )
  from public.analytics_events
  where event_date = target_day and public.is_admin_user();
$$;

grant execute on function public.get_analytics_day(date) to authenticated;
