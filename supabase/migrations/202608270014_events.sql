-- Events and attendees for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  description text not null default '',
  room_id text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes >= 5),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true,
  status text not null default 'programado' check (status in ('programado', 'activo', 'finalizado', 'cancelado')),
  attendees_count integer not null default 0 check (attendees_count >= 0),
  check (ends_at > starts_at)
);

create index if not exists events_visible_idx on public.events (active, starts_at);

create table if not exists public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_attendees_user_idx on public.event_attendees (user_id, joined_at desc);

alter table public.events enable row level security;
alter table public.event_attendees enable row level security;

drop policy if exists events_public_select on public.events;
create policy events_public_select on public.events
for select to anon, authenticated
using (active = true or created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_insert on public.events;
create policy events_owner_insert on public.events
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_update on public.events;
create policy events_owner_update on public.events
for update to authenticated
using (created_by = auth.uid() or public.is_admin_user())
with check (created_by = auth.uid() or public.is_admin_user());

drop policy if exists events_owner_delete on public.events;
create policy events_owner_delete on public.events
for delete to authenticated
using (created_by = auth.uid() or public.is_admin_user());

drop policy if exists event_attendees_public_select on public.event_attendees;
create policy event_attendees_public_select on public.event_attendees
for select to anon, authenticated
using (true);

drop policy if exists event_attendees_owner_insert on public.event_attendees;
create policy event_attendees_owner_insert on public.event_attendees
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists event_attendees_owner_delete on public.event_attendees;
create policy event_attendees_owner_delete on public.event_attendees
for delete to authenticated
using (user_id = auth.uid());

create or replace function public.sync_event_attendee_count()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  event_key uuid := coalesce(new.event_id, old.event_id);
begin
  update public.events e set attendees_count = (select count(*)::integer from public.event_attendees a where a.event_id = event_key) where e.id = event_key;
  return coalesce(new, old);
end;
$$;

drop trigger if exists event_attendee_count_after_change on public.event_attendees;
create trigger event_attendee_count_after_change
after insert or delete on public.event_attendees
for each row execute function public.sync_event_attendee_count();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events') then
      alter publication supabase_realtime add table public.events;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_attendees') then
      alter publication supabase_realtime add table public.event_attendees;
    end if;
  end if;
end;
$$;
