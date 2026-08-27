-- Activity ranking from real Supabase rows. Prepared locally only; do NOT execute from this task.

create or replace function public.get_top_20_active_users()
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  is_premium boolean,
  verified boolean,
  email text,
  profile_created_at timestamptz,
  metrics jsonb
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin_user(auth.uid()) then raise exception 'ADMIN_REQUIRED'; end if;
  return query
  with message_counts as (
    select m.author_id as id, count(*)::integer as messages_count
    from public.messages m
    where m.deleted_at is null
    group by m.author_id
  ), opin_counts as (
    select p.author_id as id, count(*)::integer as threads_count
    from public.opin_posts p
    where p.deleted_at is null
    group by p.author_id
  ), comment_counts as (
    select c.author_id as id, count(*)::integer as replies_count
    from public.opin_comments c
    where c.deleted_at is null
    group by c.author_id
  )
  select p.id, p.username, p.avatar_url, p.is_premium, p.verified, p.email, p.created_at,
    jsonb_build_object(
      'messagesCount', coalesce(mc.messages_count, 0),
      'threadsCount', coalesce(oc.threads_count, 0),
      'repliesCount', coalesce(cc.replies_count, 0),
      'totalActiveTime', 0,
      'activityScore', round(coalesce(mc.messages_count, 0) + coalesce(oc.threads_count, 0) * 3 + coalesce(cc.replies_count, 0) * 2)
    )
  from public.profiles p
  left join message_counts mc on mc.id = p.id
  left join opin_counts oc on oc.id = p.id
  left join comment_counts cc on cc.id = p.id
  where p.is_guest = false and p.role <> 'admin'
  order by (coalesce(mc.messages_count, 0) + coalesce(oc.threads_count, 0) * 3 + coalesce(cc.replies_count, 0) * 2) desc, coalesce(mc.messages_count, 0) desc
  limit 20;
end;
$$;

grant execute on function public.get_top_20_active_users() to authenticated;
