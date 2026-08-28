-- Daily limits for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.daily_user_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  limit_date date not null default current_date,
  chat_invites integer not null default 0 check (chat_invites >= 0),
  direct_messages integer not null default 0 check (direct_messages >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, limit_date)
);

alter table public.daily_user_limits enable row level security;
drop policy if exists daily_user_limits_self_select on public.daily_user_limits;
create policy daily_user_limits_self_select on public.daily_user_limits for select to authenticated using (user_id = auth.uid());

create or replace function public.get_my_daily_limits()
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object('date', current_date, 'chatInvites', coalesce(l.chat_invites, 0), 'directMessages', coalesce(l.direct_messages, 0))
  from (select auth.uid() as user_id) actor
  left join public.daily_user_limits l on l.user_id = actor.user_id and l.limit_date = current_date;
$$;

grant execute on function public.get_my_daily_limits() to authenticated;

create or replace function public.increment_my_daily_limit(limit_name text)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  next_value integer;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if limit_name not in ('chat_invites', 'direct_messages') then raise exception 'INVALID_LIMIT'; end if;
  insert into public.daily_user_limits (user_id, limit_date, chat_invites, direct_messages)
  values (actor_id, current_date, case when limit_name = 'chat_invites' then 1 else 0 end, case when limit_name = 'direct_messages' then 1 else 0 end)
  on conflict (user_id, limit_date) do update set chat_invites = public.daily_user_limits.chat_invites + case when limit_name = 'chat_invites' then 1 else 0 end, direct_messages = public.daily_user_limits.direct_messages + case when limit_name = 'direct_messages' then 1 else 0 end, updated_at = now();
  select case when limit_name = 'chat_invites' then chat_invites else direct_messages end into next_value from public.daily_user_limits where user_id = actor_id and limit_date = current_date;
  return next_value;
end;
$$;

grant execute on function public.increment_my_daily_limit(text) to authenticated;
