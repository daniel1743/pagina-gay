-- Support tickets for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  username_snapshot text,
  email text,
  subject text not null check (char_length(subject) between 1 and 160),
  description text not null,
  category text not null default 'general',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'spam')),
  attachments jsonb not null default '[]'::jsonb,
  assigned_to uuid references public.profiles(id) on delete set null,
  admin_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tickets_user_created_idx on public.tickets (user_id, created_at desc);
create index if not exists tickets_admin_queue_idx on public.tickets (status, priority, updated_at desc);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_type text not null check (author_type in ('user', 'staff')),
  message_type text not null default 'external' check (message_type in ('external', 'internal')),
  content text not null check (char_length(content) between 1 and 5000),
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_thread_idx on public.ticket_messages (ticket_id, created_at asc);

create table if not exists public.ticket_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_logs_thread_idx on public.ticket_logs (ticket_id, created_at desc);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_logs enable row level security;

drop policy if exists tickets_owner_select on public.tickets;
create policy tickets_owner_select on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_admin_user());
drop policy if exists tickets_owner_insert on public.tickets;
create policy tickets_owner_insert on public.tickets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists tickets_admin_update on public.tickets;
create policy tickets_admin_update on public.tickets for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists tickets_messages_select on public.ticket_messages;
create policy tickets_messages_select on public.ticket_messages for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user()) and (message_type = 'external' or public.is_admin_user())));
drop policy if exists tickets_messages_insert on public.ticket_messages;
create policy tickets_messages_insert on public.ticket_messages for insert to authenticated with check (author_id = auth.uid() and author_type = case when public.is_admin_user() then 'staff' else 'user' end and message_type = 'external' and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user())));
drop policy if exists tickets_logs_select on public.ticket_logs;
create policy tickets_logs_select on public.ticket_logs for select to authenticated using (exists (select 1 from public.tickets t where t.id = ticket_id and public.is_admin_user()));
drop policy if exists tickets_logs_insert on public.ticket_logs;
create policy tickets_logs_insert on public.ticket_logs for insert to authenticated with check (actor_id = auth.uid() and exists (select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin_user())));

create or replace function public.send_ticket_message(
  target_ticket_id uuid,
  target_content text,
  target_attachments jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  ticket_row public.tickets;
  message_id uuid;
  actor_type text;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into ticket_row from public.tickets where id = target_ticket_id for update;
  if not found or (ticket_row.user_id <> actor_id and not public.is_admin_user(actor_id)) then raise exception 'TICKET_FORBIDDEN'; end if;
  actor_type := case when public.is_admin_user(actor_id) then 'staff' else 'user' end;
  insert into public.ticket_messages (ticket_id, author_id, author_type, message_type, content, attachments)
  values (target_ticket_id, actor_id, actor_type, 'external', left(trim(target_content), 5000), coalesce(target_attachments, '[]'::jsonb))
  returning id into message_id;
  update public.tickets set last_message_at = now(), updated_at = now() where id = target_ticket_id;
  insert into public.ticket_logs (ticket_id, actor_id, action, metadata)
  values (target_ticket_id, actor_id, 'message_sent', jsonb_build_object('messageType', 'external'));
  return message_id;
end;
$$;

grant execute on function public.send_ticket_message(uuid, text, jsonb) to authenticated;

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at before update on public.tickets for each row execute function public.set_updated_at();
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets') then
      alter publication supabase_realtime add table public.tickets;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_messages') then
      alter publication supabase_realtime add table public.ticket_messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_logs') then
      alter publication supabase_realtime add table public.ticket_logs;
    end if;
  end if;
end;
$$;
