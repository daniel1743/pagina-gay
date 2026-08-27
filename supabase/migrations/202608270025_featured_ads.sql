-- Featured ads/channels for Supabase-first. Prepared locally only; do NOT execute from this task.

create table if not exists public.featured_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '' check (char_length(description) <= 500),
  platform text not null default 'web',
  cta_text text not null default 'Ver más',
  url text not null check (url ~ '^https?://'),
  media_type text not null default 'image' check (media_type in ('image', 'video', 'none')),
  media_url text,
  blur_enabled boolean not null default false,
  blur_strength integer not null default 0 check (blur_strength between 0 and 10),
  badge text,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  click_count integer not null default 0 check (click_count >= 0),
  last_clicked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists featured_ads_public_idx on public.featured_ads (is_active, sort_order, starts_at, ends_at);
alter table public.featured_ads enable row level security;
drop policy if exists featured_ads_public_select on public.featured_ads;
create policy featured_ads_public_select on public.featured_ads for select to anon, authenticated using (is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
drop policy if exists featured_ads_admin_select on public.featured_ads;
create policy featured_ads_admin_select on public.featured_ads for select to authenticated using (public.is_admin_user());
drop policy if exists featured_ads_admin_insert on public.featured_ads;
create policy featured_ads_admin_insert on public.featured_ads for insert to authenticated with check (public.is_admin_user() and created_by = auth.uid());
drop policy if exists featured_ads_admin_update on public.featured_ads;
create policy featured_ads_admin_update on public.featured_ads for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists featured_ads_admin_delete on public.featured_ads;
create policy featured_ads_admin_delete on public.featured_ads for delete to authenticated using (public.is_admin_user());

drop trigger if exists featured_ads_set_updated_at on public.featured_ads;
create trigger featured_ads_set_updated_at before update on public.featured_ads for each row execute function public.set_updated_at();

create or replace function public.record_featured_ad_click(target_ad_id uuid)
returns integer language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare next_count integer;
begin
  update public.featured_ads set click_count = click_count + 1, last_clicked_at = now() where id = target_ad_id and is_active = true returning click_count into next_count;
  return coalesce(next_count, 0);
end; $$;
grant execute on function public.record_featured_ad_click(uuid) to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'featured_ads') then
      alter publication supabase_realtime add table public.featured_ads;
    end if;
  end if;
end;
$$;
