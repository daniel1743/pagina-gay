-- Ephemeral Esencias for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.esencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 3 and 280),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists esencias_active_idx on public.esencias (expires_at, created_at desc);
alter table public.esencias enable row level security;
drop policy if exists esencias_public_select on public.esencias;
create policy esencias_public_select on public.esencias for select to anon, authenticated using (expires_at > now());
drop policy if exists esencias_owner_insert on public.esencias;
create policy esencias_owner_insert on public.esencias for insert to authenticated with check (user_id = auth.uid());
drop policy if exists esencias_owner_delete on public.esencias;
create policy esencias_owner_delete on public.esencias for delete to authenticated using (user_id = auth.uid());
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'esencias') then
      alter publication supabase_realtime add table public.esencias;
    end if;
  end if;
end;
$$;
