-- Badges derived from real event participation. Prepared locally only; do NOT execute from this task.

alter table public.profiles add column if not exists events_participated integer not null default 0 check (events_participated >= 0);
alter table public.profiles add column if not exists badge text not null default 'Nuevo';

create or replace function public.increment_my_event_participation()
returns text language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); next_count integer; next_badge text;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.profiles set events_participated = events_participated + 1, badge = case when events_participated + 1 >= 50 then 'Anfitrión' when events_participated + 1 >= 25 then 'Veterano' when events_participated + 1 >= 10 then 'Regular' when events_participated + 1 >= 3 then 'Activo' when events_participated + 1 >= 1 then 'Participante' else 'Nuevo' end where id = actor_id returning events_participated, badge into next_count, next_badge;
  return coalesce(next_badge, 'Nuevo');
end; $$;
grant execute on function public.increment_my_event_participation() to authenticated;
