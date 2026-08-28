-- Chactivo Supabase-first: per-user Baul match read state.
-- Prepared locally only. Do not execute from this task.

create table if not exists public.baul_match_reads (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_a, user_b, user_id),
  check (user_a < user_b),
  check (user_id = user_a or user_id = user_b)
);

create index if not exists baul_match_reads_user_idx
  on public.baul_match_reads (user_id, read_at desc);

alter table public.baul_match_reads enable row level security;
drop policy if exists baul_match_reads_participant_select on public.baul_match_reads;
create policy baul_match_reads_participant_select on public.baul_match_reads
for select to authenticated
using (user_id = auth.uid());

create or replace function public.get_my_baul_unread_match_count()
returns integer
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select count(*)::integer
  from public.baul_matches m
  left join public.baul_match_reads r
    on r.user_a = m.user_a and r.user_b = m.user_b and r.user_id = auth.uid()
  where m.status = 'active'
    and (r.read_at is null or m.updated_at > r.read_at)
    and (m.user_a = auth.uid() or m.user_b = auth.uid());
$$;

revoke all on function public.get_my_baul_unread_match_count() from public, anon, authenticated;
grant execute on function public.get_my_baul_unread_match_count() to authenticated;

create or replace function public.mark_my_baul_match_read(match_key text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  first_id uuid;
  second_id uuid;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  first_id := split_part(match_key, '_', 1)::uuid;
  second_id := split_part(match_key, '_', 2)::uuid;
  if first_id is null or second_id is null or first_id >= second_id then raise exception 'INVALID_MATCH_KEY'; end if;
  if actor_id <> first_id and actor_id <> second_id then raise exception 'MATCH_NOT_OWNED'; end if;
  if not exists (select 1 from public.baul_matches where user_a = first_id and user_b = second_id and status = 'active') then return false; end if;
  insert into public.baul_match_reads (user_a, user_b, user_id, read_at)
  values (first_id, second_id, actor_id, now())
  on conflict (user_a, user_b, user_id) do update set read_at = now();
  return true;
exception when invalid_text_representation then
  raise exception 'INVALID_MATCH_KEY';
end;
$$;

revoke all on function public.mark_my_baul_match_read(text) from public, anon, authenticated;
grant execute on function public.mark_my_baul_match_read(text) to authenticated;
