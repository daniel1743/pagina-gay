-- Account verification by activity for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.user_verification (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  consecutive_days integer not null default 0 check (consecutive_days >= 0),
  last_connection_date date,
  longest_streak integer not null default 0 check (longest_streak >= 0),
  total_days integer not null default 0 check (total_days >= 0),
  verified boolean not null default false,
  verified_at timestamptz,
  verification_lost_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_verification enable row level security;

drop policy if exists user_verification_self_select on public.user_verification;
create policy user_verification_self_select on public.user_verification
for select to authenticated
using (user_id = auth.uid() or public.is_admin_user());

drop trigger if exists user_verification_set_updated_at on public.user_verification;
create trigger user_verification_set_updated_at
before update on public.user_verification
for each row execute function public.set_updated_at();

create or replace function public.get_my_verification_status()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'verified', coalesce(v.verified, false),
    'consecutiveDays', coalesce(v.consecutive_days, 0),
    'daysUntilVerification', greatest(0, 30 - coalesce(v.consecutive_days, 0)),
    'canVerify', coalesce(v.consecutive_days, 0) >= 30,
    'longestStreak', coalesce(v.longest_streak, 0),
    'totalDays', coalesce(v.total_days, 0),
    'lastConnectionDate', v.last_connection_date,
    'verifiedAt', v.verified_at
  )
  from (select auth.uid() as user_id) actor
  left join public.user_verification v on v.user_id = actor.user_id;
$$;

grant execute on function public.get_my_verification_status() to authenticated;

create or replace function public.record_user_connection()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  today_date date := current_date;
  previous_date date;
  days_since integer;
  next_consecutive integer;
  next_longest integer;
  next_total integer;
  was_verified boolean := false;
  lost_verification boolean := false;
  result jsonb;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select last_connection_date, consecutive_days, longest_streak, total_days, verified into previous_date, next_consecutive, next_longest, next_total, was_verified from public.user_verification where user_id = actor_id for update;
  if not found then
    next_consecutive := 0; next_longest := 0; next_total := 0; was_verified := false;
  end if;
  if previous_date is null then days_since := null;
  else days_since := today_date - previous_date;
  end if;

  if days_since is null or days_since = 1 then next_consecutive := next_consecutive + 1;
  elsif days_since > 1 and days_since < 4 then next_consecutive := 1;
  elsif days_since >= 4 then next_consecutive := 1; lost_verification := was_verified;
  end if;
  if days_since is distinct from 0 then next_total := next_total + 1; end if;
  next_longest := greatest(next_longest, next_consecutive);

  insert into public.user_verification (user_id, consecutive_days, last_connection_date, longest_streak, total_days, verified, verified_at, verification_lost_at)
  values (actor_id, next_consecutive, today_date, next_longest, next_total, case when next_consecutive >= 30 and not lost_verification then true else (was_verified and not lost_verification) end, case when next_consecutive >= 30 and not was_verified and not lost_verification then now() else null end, case when lost_verification then now() else null end)
  on conflict (user_id) do update set consecutive_days = excluded.consecutive_days, last_connection_date = excluded.last_connection_date, longest_streak = excluded.longest_streak, total_days = excluded.total_days, verified = excluded.verified, verified_at = coalesce(excluded.verified_at, public.user_verification.verified_at), verification_lost_at = coalesce(excluded.verification_lost_at, public.user_verification.verification_lost_at), updated_at = now();
  select public.get_my_verification_status() into result;
  return result || jsonb_build_object('lostVerification', lost_verification, 'justVerified', (next_consecutive >= 30 and not was_verified and not lost_verification));
end;
$$;

grant execute on function public.record_user_connection() to authenticated;

create or replace function public.set_my_verification(target_verified boolean)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  current_streak integer;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select consecutive_days into current_streak from public.user_verification where user_id = actor_id;
  if target_verified and coalesce(current_streak, 0) < 30 then raise exception 'VERIFICATION_REQUIREMENT_NOT_MET'; end if;
  update public.user_verification set verified = target_verified, verified_at = case when target_verified then now() else null end, verification_lost_at = case when target_verified then verification_lost_at else now() end, updated_at = now() where user_id = actor_id;
  return found;
end;
$$;

grant execute on function public.set_my_verification(boolean) to authenticated;
