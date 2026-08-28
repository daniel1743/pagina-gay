-- Private contact sharing. Phone values are never stored in public.profiles or returned by normal profile queries.
-- Prepared locally only. Do NOT execute without reviewing against the target Supabase project.

create table if not exists public.profile_private_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null check (char_length(phone) between 3 and 40),
  updated_at timestamptz not null default now()
);

create table if not exists public.private_contact_shares (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'revoked')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz,
  primary key (conversation_id, owner_id, recipient_id),
  check (owner_id <> recipient_id)
);

create index if not exists private_contact_shares_recipient_idx
  on public.private_contact_shares (recipient_id, status, expires_at);
create unique index if not exists private_contact_shares_pending_idx
  on public.private_contact_shares (conversation_id, owner_id, recipient_id)
  where status = 'pending';

alter table public.profile_private_contacts enable row level security;
alter table public.private_contact_shares enable row level security;

create policy profile_private_contacts_owner on public.profile_private_contacts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy private_contact_shares_participant_select on public.private_contact_shares
for select to authenticated
using (public.is_conversation_member(conversation_id));

-- All share state changes and phone disclosure happen through the RPCs below.
revoke insert, update, delete on table public.private_contact_shares from authenticated;

create or replace function public.request_private_contact_share(target_conversation_id uuid)
returns table (success boolean, status text, recipient_id uuid, already_shared boolean, already_pending boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  other_id uuid;
  chat_created_at timestamptz;
  my_message_count integer;
  other_message_count integer;
  existing_status text;
  existing_expires timestamptz;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;

  select min(c.created_at) into chat_created_at from public.conversations c where c.id = target_conversation_id and c.kind = 'direct';
  select cm.user_id into other_id
  from public.conversation_members cm
  where cm.conversation_id = target_conversation_id and cm.user_id <> actor_id and cm.left_at is null
  limit 1;
  if other_id is null then raise exception 'PRIVATE_CONTACT_GROUP_UNSUPPORTED'; end if;
  if not exists (select 1 from public.profile_private_contacts where user_id = actor_id) then raise exception 'PRIVATE_CONTACT_PHONE_MISSING'; end if;
  if chat_created_at is null or now() - chat_created_at < interval '10 minutes' then raise exception 'PRIVATE_CONTACT_LOCKED'; end if;

  select count(*)::integer into my_message_count from public.private_messages where conversation_id = target_conversation_id and sender_id = actor_id and deleted_at is null;
  select count(*)::integer into other_message_count from public.private_messages where conversation_id = target_conversation_id and sender_id = other_id and deleted_at is null;
  if my_message_count < 3 or other_message_count < 3 then raise exception 'PRIVATE_CONTACT_LOCKED'; end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = actor_id and b.blocked_id = other_id) or (b.blocker_id = other_id and b.blocked_id = actor_id)) then raise exception 'BLOCKED'; end if;

  select s.status, s.expires_at into existing_status, existing_expires
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id and s.owner_id = actor_id and s.recipient_id = other_id;

  if existing_status = 'accepted' and existing_expires > now() then
    return query select true, existing_status, other_id, true, false;
    return;
  end if;
  if existing_status = 'pending' then
    return query select true, existing_status, other_id, false, true;
    return;
  end if;

  insert into public.private_contact_shares (conversation_id, owner_id, recipient_id, status, requested_at, responded_at, expires_at)
  values (target_conversation_id, actor_id, other_id, 'pending', now(), null, null)
  on conflict (conversation_id, owner_id, recipient_id) do update
    set status = 'pending', requested_at = now(), responded_at = null, expires_at = null;

  insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
  values (other_id, actor_id, 'private_contact_request', 'Solicitud de contacto', 'La otra persona quiere compartir su teléfono contigo.', 'conversation', target_conversation_id);

  return query select true, 'pending'::text, other_id, false, false;
end;
$$;

grant execute on function public.request_private_contact_share(uuid) to authenticated;

create or replace function public.respond_private_contact_share(target_conversation_id uuid, target_owner_id uuid, accept_share boolean)
returns table (success boolean, accepted boolean, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  share_row public.private_contact_shares%rowtype;
  expiry timestamptz := case when accept_share then now() + interval '7 days' else null end;
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  select s.* into share_row
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id and s.owner_id = target_owner_id and s.recipient_id = actor_id
  for update;
  if share_row.owner_id is null or share_row.status <> 'pending' then raise exception 'PRIVATE_CONTACT_REQUEST_NOT_PENDING'; end if;
  if not exists (select 1 from public.profile_private_contacts where user_id = target_owner_id) then raise exception 'PRIVATE_CONTACT_PHONE_MISSING'; end if;

  update public.private_contact_shares
  set status = case when accept_share then 'accepted' else 'rejected' end,
      responded_at = now(),
      expires_at = expiry
  where conversation_id = target_conversation_id and owner_id = target_owner_id and recipient_id = actor_id;

  if accept_share then
    insert into public.notifications (user_id, actor_id, type, title, content, entity_type, entity_id)
    values (target_owner_id, actor_id, 'private_contact_accepted', 'Contacto habilitado', 'La otra persona aceptó recibir tu teléfono.', 'conversation', target_conversation_id);
  end if;
  return query select true, accept_share, expiry;
end;
$$;

grant execute on function public.respond_private_contact_share(uuid, uuid, boolean) to authenticated;

create or replace function public.revoke_private_contact_share(target_conversation_id uuid, target_recipient_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not public.is_conversation_member(target_conversation_id, actor_id) then raise exception 'USER_NOT_CHAT_PARTICIPANT'; end if;
  update public.private_contact_shares
  set status = 'revoked', responded_at = now(), expires_at = null
  where conversation_id = target_conversation_id and owner_id = actor_id and recipient_id = target_recipient_id;
  return found;
end;
$$;

grant execute on function public.revoke_private_contact_share(uuid, uuid) to authenticated;

create or replace function public.get_private_chat_shared_contacts(target_conversation_id uuid, target_owner_ids uuid[] default '{}')
returns table (owner_id uuid, user_id uuid, username text, phone text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select s.owner_id, p.id, p.username, pc.phone
  from public.private_contact_shares s
  join public.profiles p on p.id = s.owner_id
  join public.profile_private_contacts pc on pc.user_id = s.owner_id
  where s.conversation_id = target_conversation_id
    and s.recipient_id = auth.uid()
    and s.status = 'accepted'
    and s.expires_at > now()
    and (coalesce(array_length(target_owner_ids, 1), 0) = 0 or s.owner_id = any(target_owner_ids))
    and public.is_conversation_member(target_conversation_id, auth.uid());
$$;

grant execute on function public.get_private_chat_shared_contacts(uuid, uuid[]) to authenticated;

create or replace function public.get_private_contact_state(target_conversation_id uuid)
returns jsonb
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select jsonb_build_object(
    'contactShareRequests', coalesce(jsonb_object_agg(s.owner_id::text, jsonb_build_object(
      'requesterId', s.owner_id,
      'recipientId', s.recipient_id,
      'contactType', 'phone',
      'status', s.status,
      'requestedAt', s.requested_at,
      'respondedAt', s.responded_at
    )) filter (where s.status in ('pending', 'accepted', 'rejected')), '{}'::jsonb),
    'contactShareVisibility', coalesce(jsonb_object_agg(s.owner_id::text, jsonb_build_object(
      s.recipient_id::text, jsonb_build_object('allowed', true, 'expiresAt', s.expires_at, 'expiresAtMs', extract(epoch from s.expires_at) * 1000)
    )) filter (where s.status = 'accepted' and s.expires_at > now()), '{}'::jsonb)
  )
  from public.private_contact_shares s
  where s.conversation_id = target_conversation_id
    and public.is_conversation_member(target_conversation_id, auth.uid());
$$;

grant execute on function public.get_private_contact_state(uuid) to authenticated;
