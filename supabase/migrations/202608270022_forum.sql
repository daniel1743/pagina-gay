-- Legacy forum surfaces for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous_id text not null check (char_length(anonymous_id) between 3 and 80),
  author_display text not null check (char_length(author_display) between 1 and 100),
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(content) between 1 and 10000),
  category text not null default 'general',
  reply_count integer not null default 0 check (reply_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_listing_idx on public.forum_threads (category, created_at desc);
create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  anonymous_id text not null check (char_length(anonymous_id) between 3 and 80),
  author_display text not null check (char_length(author_display) between 1 and 100),
  content text not null check (char_length(content) between 1 and 10000),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_thread_idx on public.forum_replies (thread_id, created_at asc);

create table if not exists public.forum_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('thread', 'reply')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_votes enable row level security;
drop policy if exists forum_threads_public_select on public.forum_threads;
create policy forum_threads_public_select on public.forum_threads for select to anon, authenticated using (true);
drop policy if exists forum_threads_owner_insert on public.forum_threads;
create policy forum_threads_owner_insert on public.forum_threads for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_replies_public_select on public.forum_replies;
create policy forum_replies_public_select on public.forum_replies for select to anon, authenticated using (true);
drop policy if exists forum_replies_owner_insert on public.forum_replies;
create policy forum_replies_owner_insert on public.forum_replies for insert to authenticated with check (author_id = auth.uid());
drop policy if exists forum_threads_admin_update on public.forum_threads;
create policy forum_threads_admin_update on public.forum_threads for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists forum_threads_admin_delete on public.forum_threads;
create policy forum_threads_admin_delete on public.forum_threads for delete to authenticated using (public.is_admin_user());
drop policy if exists forum_replies_admin_update on public.forum_replies;
create policy forum_replies_admin_update on public.forum_replies for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists forum_replies_admin_delete on public.forum_replies;
create policy forum_replies_admin_delete on public.forum_replies for delete to authenticated using (public.is_admin_user());
drop policy if exists forum_votes_owner_select on public.forum_votes;
create policy forum_votes_owner_select on public.forum_votes for select to authenticated using (user_id = auth.uid());

create or replace function public.sync_forum_reply_count()
returns trigger language plpgsql security definer set search_path = public, auth, pg_temp as $$
begin
  update public.forum_threads set reply_count = (select count(*)::integer from public.forum_replies where thread_id = coalesce(new.thread_id, old.thread_id)), updated_at = now() where id = coalesce(new.thread_id, old.thread_id);
  return coalesce(new, old);
end; $$;
drop trigger if exists forum_reply_count_after_change on public.forum_replies;
create trigger forum_reply_count_after_change after insert or delete on public.forum_replies for each row execute function public.sync_forum_reply_count();

create or replace function public.toggle_forum_vote(target_entity_type text, target_entity_id uuid, desired boolean default true)
returns boolean language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare actor_id uuid := auth.uid(); entity_exists boolean;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if target_entity_type not in ('thread', 'reply') then raise exception 'INVALID_ENTITY_TYPE'; end if;
  if target_entity_type = 'thread' then select exists(select 1 from public.forum_threads where id = target_entity_id) into entity_exists; else select exists(select 1 from public.forum_replies where id = target_entity_id) into entity_exists; end if;
  if not entity_exists then raise exception 'FORUM_ENTITY_NOT_FOUND'; end if;
  if desired then insert into public.forum_votes(user_id, entity_type, entity_id) values(actor_id, target_entity_type, target_entity_id) on conflict do nothing; else delete from public.forum_votes where user_id = actor_id and entity_type = target_entity_type and entity_id = target_entity_id; end if;
  if target_entity_type = 'thread' then update public.forum_threads set like_count = (select count(*)::integer from public.forum_votes where entity_type = 'thread' and entity_id = target_entity_id) where id = target_entity_id; else update public.forum_replies set like_count = (select count(*)::integer from public.forum_votes where entity_type = 'reply' and entity_id = target_entity_id) where id = target_entity_id; end if;
  return desired;
end; $$;
grant execute on function public.toggle_forum_vote(text, uuid, boolean) to authenticated;

create or replace function public.increment_forum_view(target_thread_id uuid)
returns integer language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare next_count integer;
begin
  update public.forum_threads set view_count = view_count + 1 where id = target_thread_id returning view_count into next_count;
  return coalesce(next_count, 0);
end; $$;
grant execute on function public.increment_forum_view(uuid) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_threads') then
      alter publication supabase_realtime add table public.forum_threads;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'forum_replies') then
      alter publication supabase_realtime add table public.forum_replies;
    end if;
  end if;
end;
$$;
