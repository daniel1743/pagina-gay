-- Chactivo Supabase-first: synchronize private-request notification state.
-- Prepared locally only. Do not execute from this task.

create or replace function public.sync_private_request_notification_state()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    update public.notifications
    set read_at = coalesce(read_at, now())
    where entity_type = 'private_request'
      and entity_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists private_request_notification_state on public.private_requests;
create trigger private_request_notification_state
after update of status on public.private_requests
for each row execute function public.sync_private_request_notification_state();

revoke all on function public.sync_private_request_notification_state() from public;
