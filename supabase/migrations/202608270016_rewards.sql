-- Rewards for Supabase-first. Prepared locally only; do NOT execute from this task.

alter table public.profiles add column if not exists has_special_avatar boolean not null default false;
alter table public.profiles add column if not exists is_featured boolean not null default false;
alter table public.profiles add column if not exists is_moderator boolean not null default false;
alter table public.profiles add column if not exists is_pro_user boolean not null default false;
alter table public.profiles add column if not exists can_upload_second_photo boolean not null default false;
alter table public.profiles add column if not exists has_featured_card boolean not null default false;
alter table public.profiles add column if not exists has_rainbow_border boolean not null default false;
alter table public.profiles add column if not exists has_pro_badge boolean not null default false;
alter table public.profiles add column if not exists chat_photo_access boolean not null default false;

create table if not exists public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null,
  reason text,
  reason_description text,
  issued_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoke_reason text,
  notes text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_rewards_user_active_idx on public.user_rewards (user_id, status, expires_at, created_at desc);

alter table public.user_rewards enable row level security;

drop policy if exists user_rewards_owner_select on public.user_rewards;
create policy user_rewards_owner_select on public.user_rewards
for select to authenticated
using (user_id = auth.uid() or public.is_admin_user());

create or replace function public.get_my_active_rewards()
returns setof public.user_rewards
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.user_rewards where user_id = auth.uid() and status = 'active' and (expires_at is null or expires_at > now()) order by created_at desc;
$$;

grant execute on function public.get_my_active_rewards() to authenticated;

create or replace function public.admin_create_reward(
  target_user_id uuid,
  target_reward_type text,
  target_reason text default null,
  target_reason_description text default null,
  target_expires_at timestamptz default null,
  target_notes text default null,
  target_metrics jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reward_id uuid;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if target_user_id is null or target_reward_type is null then raise exception 'INVALID_REWARD'; end if;
  insert into public.user_rewards (user_id, reward_type, reason, reason_description, issued_by, expires_at, notes, metrics)
  values (target_user_id, left(target_reward_type, 80), left(target_reason, 80), left(target_reason_description, 500), actor_id, target_expires_at, left(target_notes, 1000), coalesce(target_metrics, '{}'::jsonb))
  returning id into reward_id;
  if target_reward_type = 'premium_1_month' then update public.profiles set is_premium = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'verified_1_month' then update public.profiles set verified = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'special_avatar_1_month' then update public.profiles set has_special_avatar = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'featured_user' then update public.profiles set is_featured = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'moderator_1_month' then update public.profiles set is_moderator = true, role = case when role = 'user' then 'moderator' else role end, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'pro_user' then update public.profiles set is_pro_user = true, can_upload_second_photo = true, has_featured_card = true, has_rainbow_border = true, has_pro_badge = true, updated_at = now() where id = target_user_id;
  elsif target_reward_type = 'chat_photo_access' then update public.profiles set chat_photo_access = true, updated_at = now() where id = target_user_id;
  end if;
  return reward_id;
end;
$$;

grant execute on function public.admin_create_reward(uuid, text, text, text, timestamptz, text, jsonb) to authenticated;

drop function if exists public.admin_revoke_reward(uuid, text);

create or replace function public.admin_revoke_reward(target_reward_id uuid, target_revoke_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  reward_row public.user_rewards;
  affected_rows integer := 0;
  changed boolean := false;
begin
  if actor_id is null or not public.is_admin_user(actor_id) then raise exception 'ADMIN_REQUIRED'; end if;
  select * into reward_row from public.user_rewards where id = target_reward_id for update;
  if not found then return false; end if;
  update public.user_rewards set status = 'revoked', revoked_at = now(), revoked_by = actor_id, revoke_reason = left(target_revoke_reason, 500) where id = target_reward_id and status = 'active';
  get diagnostics affected_rows = row_count;
  changed := affected_rows > 0;
  if changed and reward_row.reward_type = 'premium_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'premium_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_premium = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'verified_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'verified_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set verified = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'special_avatar_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'special_avatar_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set has_special_avatar = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'featured_user' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'featured_user' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_featured = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'moderator_1_month' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'moderator_1_month' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_moderator = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'pro_user' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'pro_user' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set is_pro_user = false, can_upload_second_photo = false, has_featured_card = false, has_rainbow_border = false, has_pro_badge = false, updated_at = now() where id = reward_row.user_id; end if;
  if changed and reward_row.reward_type = 'chat_photo_access' and not exists (select 1 from public.user_rewards where user_id = reward_row.user_id and reward_type = 'chat_photo_access' and status = 'active' and (expires_at is null or expires_at > now()) and id <> reward_row.id) then update public.profiles set chat_photo_access = false, updated_at = now() where id = reward_row.user_id; end if;
  return changed;
end;
$$;

grant execute on function public.admin_revoke_reward(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_rewards') then
      alter publication supabase_realtime add table public.user_rewards;
    end if;
  end if;
end;
$$;
