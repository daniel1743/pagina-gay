-- Chactivo Supabase-first: ticket log hardening.
-- Prepared locally only. Do not execute from this task.

-- Customer messages may be external; audit logs are server/admin owned.
drop policy if exists tickets_logs_insert on public.ticket_logs;
create policy tickets_logs_insert on public.ticket_logs
for insert to authenticated
with check (actor_id = auth.uid() and public.is_admin_user());
