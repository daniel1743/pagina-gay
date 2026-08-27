-- Temporary chat states and reactions for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.room_states (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  role_badge text,
  message text not null check (char_length(message) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (room_id, author_id)
);

create index if not exists room_states_active_idx
  on public.room_states (room_id, expires_at desc, updated_at desc);

create table if not exists public.room_state_reactions (
  room_state_id uuid not null references public.room_states(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('fire', 'spark', 'eyes', 'heart', 'crown')),
  updated_at timestamptz not null default now(),
  primary key (room_state_id, user_id)
);

create index if not exists room_state_reactions_state_idx
  on public.room_state_reactions (room_state_id, updated_at desc);

alter table public.room_states enable row level security;
alter table public.room_state_reactions enable row level security;

drop policy if exists room_states_select_active on public.room_states;
create policy room_states_select_active on public.room_states
for select to anon, authenticated
using (
  expires_at > now()
  and exists (select 1 from public.rooms r where r.id = room_id and r.is_active = true and r.is_public = true)
);

drop policy if exists room_states_owner_insert on public.room_states;
create policy room_states_owner_insert on public.room_states
for insert to authenticated
with check (author_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_guest = false));

drop policy if exists room_states_owner_update on public.room_states;
create policy room_states_owner_update on public.room_states
for update to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists room_states_owner_delete on public.room_states;
create policy room_states_owner_delete on public.room_states
for delete to authenticated
using (author_id = auth.uid());

drop policy if exists room_state_reactions_select_active on public.room_state_reactions;
create policy room_state_reactions_select_active on public.room_state_reactions
for select to anon, authenticated
using (exists (select 1 from public.room_states s where s.id = room_state_id and s.expires_at > now()));

drop policy if exists room_state_reactions_owner_write on public.room_state_reactions;
create policy room_state_reactions_owner_write on public.room_state_reactions
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (select 1 from public.room_states s where s.id = room_state_id and s.expires_at > now()));

drop trigger if exists room_states_set_updated_at on public.room_states;
create trigger room_states_set_updated_at
before update on public.room_states
for each row execute function public.set_updated_at();

drop trigger if exists room_state_reactions_set_updated_at on public.room_state_reactions;
create trigger room_state_reactions_set_updated_at
before update on public.room_state_reactions
for each row execute function public.set_updated_at();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_states') then
      alter publication supabase_realtime add table public.room_states;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_state_reactions') then
      alter publication supabase_realtime add table public.room_state_reactions;
    end if;
  end if;
end;
$$;
