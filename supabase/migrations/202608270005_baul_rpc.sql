-- Chactivo / Supabase migration 005
-- Server-authoritative Baul interactions.
-- This file is prepared locally and is NOT executed by this task.

create or replace function public.is_blocked_between(first_user_id uuid, second_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = first_user_id and b.blocked_id = second_user_id)
       or (b.blocker_id = second_user_id and b.blocked_id = first_user_id)
  );
$$;

create or replace function public.assert_baul_target(target_user_id uuid)
returns void
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'invalid_baul_target' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = target_user_id and p.profile_visible = true
  ) then
    raise exception 'baul_target_not_available' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.baul_cards c
    where c.user_id = target_user_id
      and c.card_visible = true
      and (c.intent_expires_at is null or c.intent_expires_at > now())
  ) then
    raise exception 'baul_card_not_available' using errcode = '42501';
  end if;
  if public.is_blocked_between(auth.uid(), target_user_id) then
    raise exception 'baul_target_blocked' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.toggle_baul_like(target_user_id uuid)
returns table (liked boolean, is_match boolean, match_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  actor_liked_target boolean;
  target_liked_actor boolean;
  next_user_a uuid;
  next_user_b uuid;
  next_match_key text;
  existing_active_match boolean;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform public.assert_baul_target(target_user_id);
  if not exists (select 1 from public.baul_cards where user_id = v_actor_id) then
    raise exception 'actor_baul_card_missing' using errcode = '42501';
  end if;

  -- Serialize the pair for a stable toggle and reciprocal-match calculation.
  perform pg_advisory_xact_lock(hashtextextended(least(v_actor_id::text, target_user_id::text) || ':' || greatest(v_actor_id::text, target_user_id::text), 0));

  select exists (
    select 1 from public.baul_likes bl
    where bl.actor_id = v_actor_id and bl.target_id = target_user_id
  ) into actor_liked_target;

  if actor_liked_target then
    delete from public.baul_likes
    where baul_likes.actor_id = v_actor_id and baul_likes.target_id = target_user_id;
    liked := false;
  else
    insert into public.baul_likes (actor_id, target_id)
    values (v_actor_id, target_user_id)
    on conflict do nothing;
    liked := true;
  end if;

  select exists (
    select 1 from public.baul_likes bl
    where bl.actor_id = target_user_id and bl.target_id = v_actor_id
  ) into target_liked_actor;

  next_user_a := least(v_actor_id, target_user_id);
  next_user_b := greatest(v_actor_id, target_user_id);
  next_match_key := next_user_a::text || '_' || next_user_b::text;
  is_match := liked and target_liked_actor;
  match_key := case when is_match then next_match_key else null end;

  select exists (
    select 1 from public.baul_matches bm
    where bm.user_a = next_user_a and bm.user_b = next_user_b and bm.status = 'active'
  ) into existing_active_match;

  if is_match then
    insert into public.baul_matches (user_a, user_b, status)
    values (next_user_a, next_user_b, 'active')
    on conflict (user_a, user_b) do update
      set status = 'active', updated_at = now();
  else
    delete from public.baul_matches
    where user_a = next_user_a and user_b = next_user_b;
  end if;

  if liked then
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

  if is_match and not existing_active_match then
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

create or replace function public.record_baul_daily_event(target_user_id uuid, event_type text)
returns table (recorded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  local_day date := (now() at time zone 'America/Santiago')::date;
  inserted_count integer := 0;
  daily_count integer := 0;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if event_type not in ('footprint', 'visit', 'impression') then
    raise exception 'invalid_baul_event' using errcode = '22023';
  end if;
  perform public.assert_baul_target(target_user_id);

  if event_type = 'footprint' then
    select count(*) into daily_count
    from public.baul_footprints bf
    where bf.actor_id = v_actor_id and bf.local_day = local_day;
    if daily_count >= 15 then
      raise exception 'baul_daily_limit_reached' using errcode = '42901';
    end if;
    insert into public.baul_footprints (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  elsif event_type = 'visit' then
    insert into public.baul_visits (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  else
    insert into public.baul_impressions (actor_id, target_id, local_day)
    values (v_actor_id, target_user_id, local_day)
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  end if;

  recorded := inserted_count > 0;

  if recorded and event_type in ('footprint', 'visit') then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type)
    values (
      target_user_id,
      v_actor_id,
      case when event_type = 'footprint' then 'baul_footprint' else 'baul_visit' end,
      case when event_type = 'footprint' then 'Nueva huella en tu tarjeta' else 'Visita a tu tarjeta' end,
      case when event_type = 'footprint' then 'Alguien dejó una huella en tu tarjeta.' else 'Alguien abrió tu tarjeta.' end,
      'baul_card'
    );
  end if;

  return next;
end;
$$;

create or replace function public.send_baul_note(target_user_id uuid, note_content text)
returns table (note_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  normalized_content text := regexp_replace(trim(coalesce(note_content, '')), '\s+', ' ', 'g');
  created_note_id uuid;
begin
  if v_actor_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform public.assert_baul_target(target_user_id);
  if char_length(normalized_content) < 1 or char_length(normalized_content) > 500 then
    raise exception 'invalid_baul_note' using errcode = '22023';
  end if;
  if normalized_content ~* '(https?://|www\.|wa\.me|t\.me|whatsapp|telegram|instagram|facebook|discord|snapchat|fuera de chactivo)' then
    raise exception 'external_contact_not_allowed' using errcode = '22023';
  end if;

  insert into public.baul_notes (actor_id, target_id, content)
  values (v_actor_id, target_user_id, normalized_content)
  returning id into created_note_id;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (
    target_user_id,
    v_actor_id,
    'baul_note',
    'Nueva nota en Baúl',
    left(normalized_content, 500),
    'baul_note',
    created_note_id
  );

  note_id := created_note_id;
  return next;
end;
$$;

revoke all on function public.toggle_baul_like(uuid) from public, anon, authenticated;
grant execute on function public.toggle_baul_like(uuid) to authenticated;
revoke all on function public.record_baul_daily_event(uuid, text) from public, anon, authenticated;
grant execute on function public.record_baul_daily_event(uuid, text) to authenticated;
revoke all on function public.send_baul_note(uuid, text) from public, anon, authenticated;
grant execute on function public.send_baul_note(uuid, text) to authenticated;

comment on function public.toggle_baul_like(uuid) is 'Server-authoritative Baul like/unlike and reciprocal match creation.';
comment on function public.record_baul_daily_event(uuid, text) is 'Idempotent daily Baul footprint, visit or impression with Chile day limits.';
comment on function public.send_baul_note(uuid, text) is 'Validated first contact note for a visible Baul card.';
