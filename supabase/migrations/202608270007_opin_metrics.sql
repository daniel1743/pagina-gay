-- OPIN metrics hardening: counters are derived from interaction rows, not client input.
-- Prepared locally only. Do NOT execute without reviewing against the target Supabase project.

create or replace function public.protect_opin_server_metrics()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.like_count := 0;
    new.comment_count := 0;
    new.view_count := 0;
    new.profile_click_count := 0;
    new.reaction_counts := '{}'::jsonb;
    new.last_comment_at := null;
    new.last_interaction_at := null;
  elsif coalesce(current_setting('chactivo.allow_server_metrics', true), '') <> '1'
    and (
      new.like_count is distinct from old.like_count
      or new.comment_count is distinct from old.comment_count
      or new.view_count is distinct from old.view_count
      or new.profile_click_count is distinct from old.profile_click_count
      or new.reaction_counts is distinct from old.reaction_counts
      or new.last_comment_at is distinct from old.last_comment_at
      or new.last_interaction_at is distinct from old.last_interaction_at
    ) then
    raise exception 'opin_metrics_are_server_owned';
  end if;
  return new;
end;
$$;

drop trigger if exists opin_posts_protect_metrics on public.opin_posts;
create trigger opin_posts_protect_metrics
before insert or update on public.opin_posts
for each row execute function public.protect_opin_server_metrics();

create or replace function public.refresh_opin_post_metrics(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  reaction_map jsonb;
  like_total integer;
  comment_total integer;
  latest_comment timestamptz;
  latest_interaction timestamptz;
begin
  select count(*)::integer into like_total from public.opin_likes where post_id = target_post_id;
  select count(*)::integer into comment_total from public.opin_comments where post_id = target_post_id and status = 'active' and deleted_at is null;
  select max(created_at) into latest_comment from public.opin_comments where post_id = target_post_id and status = 'active' and deleted_at is null;
  select coalesce(jsonb_object_agg(reaction, reaction_count), '{}'::jsonb)
  into reaction_map
  from (
    select reaction, count(*)::integer as reaction_count
    from public.opin_reactions
    where post_id = target_post_id
    group by reaction
  ) grouped_reactions;
  select greatest(
    (select max(created_at) from public.opin_likes where post_id = target_post_id),
    (select max(created_at) from public.opin_reactions where post_id = target_post_id),
    (select max(created_at) from public.opin_comments where post_id = target_post_id)
  ) into latest_interaction;

  perform set_config('chactivo.allow_server_metrics', '1', true);
  update public.opin_posts
  set like_count = coalesce(like_total, 0),
      comment_count = coalesce(comment_total, 0),
      reaction_counts = coalesce(reaction_map, '{}'::jsonb),
      last_comment_at = latest_comment,
      last_interaction_at = latest_interaction,
      updated_at = now()
  where id = target_post_id;
  perform set_config('chactivo.allow_server_metrics', '', true);
end;
$$;

grant execute on function public.refresh_opin_post_metrics(uuid) to authenticated;

create or replace function public.trg_refresh_opin_post_metrics()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  perform public.refresh_opin_post_metrics(coalesce(new.post_id, old.post_id));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists opin_likes_refresh_metrics on public.opin_likes;
create trigger opin_likes_refresh_metrics
after insert or delete on public.opin_likes
for each row execute function public.trg_refresh_opin_post_metrics();

drop trigger if exists opin_reactions_refresh_metrics on public.opin_reactions;
create trigger opin_reactions_refresh_metrics
after insert or update or delete on public.opin_reactions
for each row execute function public.trg_refresh_opin_post_metrics();

drop trigger if exists opin_comments_refresh_metrics on public.opin_comments;
create trigger opin_comments_refresh_metrics
after insert or update or delete on public.opin_comments
for each row execute function public.trg_refresh_opin_post_metrics();

create or replace function public.record_opin_action(target_post_id uuid, target_action_type text)
returns table (recorded boolean, view_count integer, profile_click_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_action_key text := lower(btrim(coalesce(target_action_type, '')));
  already_recorded boolean;
  next_view_count integer;
  next_profile_click_count integer;
begin
  if v_actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if v_action_key not in ('view', 'share', 'open_profile', 'open_chat', 'report') then raise exception 'INVALID_OPIN_ACTION'; end if;
  if not exists (select 1 from public.opin_posts where id = target_post_id and status = 'active' and deleted_at is null) then raise exception 'OPIN_POST_NOT_FOUND'; end if;

  select exists (
    select 1     from public.opin_actions oa
    where oa.post_id = target_post_id
      and oa.actor_id = v_actor_id
      and oa.action_type = v_action_key
      and oa.created_at > now() - interval '24 hours'
  ) into already_recorded;

  if not already_recorded then
    insert into public.opin_actions (post_id, actor_id, action_type)
    values (target_post_id, v_actor_id, v_action_key);
    if v_action_key in ('view', 'open_profile') then
      perform set_config('chactivo.allow_server_metrics', '1', true);
      update public.opin_posts
      set view_count = case when v_action_key = 'view' then view_count + 1 else view_count end,
          profile_click_count = case when v_action_key = 'open_profile' then profile_click_count + 1 else profile_click_count end,
          last_interaction_at = now(),
          updated_at = now()
      where id = target_post_id;
      perform set_config('chactivo.allow_server_metrics', '', true);
    end if;
  end if;

  select p.view_count, p.profile_click_count
  into next_view_count, next_profile_click_count
  from public.opin_posts p where p.id = target_post_id;
  return query select not already_recorded, next_view_count, next_profile_click_count;
end;
$$;

grant execute on function public.record_opin_action(uuid, text) to authenticated;
