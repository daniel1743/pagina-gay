-- Reports moderation for Supabase-first. Prepared locally only; do NOT execute from this task.

create or replace function public.admin_update_report_status(
  target_report_id uuid,
  next_status text,
  reviewer_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reporter uuid;
  affected_rows integer := 0;
  changed boolean := false;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if next_status not in ('open', 'reviewing', 'resolved', 'dismissed') then raise exception 'INVALID_REPORT_STATUS'; end if;
  update public.reports
  set status = next_status, resolved_at = case when next_status in ('resolved', 'dismissed') then now() else null end
  where id = target_report_id
  returning reporter_id into reporter;
  get diagnostics affected_rows = row_count;
  changed := affected_rows > 0;
  if changed and reporter is not null then
    insert into public.notifications (user_id, actor_id, type, title, content, icon, priority, created_by)
    values (
      reporter,
      actor_id,
      'report_update',
      case when next_status = 'resolved' then 'Caso resuelto' when next_status = 'dismissed' then 'Caso cerrado' else 'Caso en revisión' end,
      left(coalesce(reviewer_notes, 'El estado de tu reporte fue actualizado por moderación.'), 500),
      case when next_status = 'resolved' then '✅' when next_status = 'dismissed' then 'ℹ️' else '🔍' end,
      'high',
      actor_id
    );
  end if;
  return changed;
end;
$$;

grant execute on function public.admin_update_report_status(uuid, text, text) to authenticated;
