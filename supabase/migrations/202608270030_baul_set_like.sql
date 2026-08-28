-- Chactivo Supabase-first: deterministic Baul like/unlike.
-- Prepared locally only. Do not execute from this task.

create or replace function public.set_baul_like(target_user_id uuid, desired_liked boolean)
returns table (liked boolean, is_match boolean, match_key text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  was_liked boolean;
  target_liked_actor boolean;
  next_user_a uuid;
  next_user_b uuid;
  next_match_key text;
  had_active_match boolean;
begin
  if v_actor_id is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  perform public.assert_baul_target(target_user_id);
  if not exists (select 1 from public.baul_cards where user_id = v_actor_id) then raise exception 'actor_baul_card_missing' using errcode = '42501'; end if;

  perform pg_advisory_xact_lock(hashtextextended(least(v_actor_id::text, target_user_id::text) || ':' || greatest(v_actor_id::text, target_user_id::text), 0));

  select exists (
    select 1 from public.baul_likes bl where bl.actor_id = v_actor_id and bl.target_id = target_user_id
  ) into was_liked;

  if coalesce(desired_liked, false) then
    insert into public.baul_likes (actor_id, target_id)
    values (v_actor_id, target_user_id)
    on conflict do nothing;
    liked := true;
  else
    delete from public.baul_likes
    where baul_likes.actor_id = v_actor_id and baul_likes.target_id = target_user_id;
    liked := false;
  end if;

  select exists (
    select 1 from public.baul_likes bl where bl.actor_id = target_user_id and bl.target_id = v_actor_id
  ) into target_liked_actor;

  next_user_a := least(v_actor_id, target_user_id);
  next_user_b := greatest(v_actor_id, target_user_id);
  next_match_key := next_user_a::text || '_' || next_user_b::text;
  is_match := liked and target_liked_actor;
  match_key := case when is_match then next_match_key else null end;

  select exists (
    select 1 from public.baul_matches bm where bm.user_a = next_user_a and bm.user_b = next_user_b and bm.status = 'active'
  ) into had_active_match;

  if is_match then
    insert into public.baul_matches (user_a, user_b, status)
    values (next_user_a, next_user_b, 'active')
    on conflict (user_a, user_b) do update set status = 'active', updated_at = now();
  else
    delete from public.baul_matches where user_a = next_user_a and user_b = next_user_b;
  end if;

  if liked and not was_liked then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      target_user_id,
      v_actor_id,
      case when is_match then 'baul_match' else 'baul_like' end,
      case when is_match then 'Nuevo match en Baúl' else 'Interés en tu tarjeta' end,
      case when is_match then 'También se interesaron mutuamente.' else 'Alguien marcó tu tarjeta como interesante.' end,
      'baul_card'
    );
  end if;

  if is_match and not had_active_match then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      v_actor_id,
      target_user_id,
      'baul_match',
      'Nuevo match en Baúl',
      'El interés es mutuo. Ya pueden iniciar una conversación.',
      'baul_match'
    );
  end if;

  return next;
end;
$$;

revoke all on function public.set_baul_like(uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_baul_like(uuid, boolean) to authenticated;
