-- Chactivo Supabase-first: Baul card and private media read policies.
-- Prepared locally only. Do not execute from this task.

-- The owner must be able to load a hidden draft card from the editor.
drop policy if exists baul_cards_owner_select on public.baul_cards;
create policy baul_cards_owner_select on public.baul_cards
for select to authenticated
using (user_id = auth.uid());

-- card-media remains private. Signed URLs can be created only for the owner or
-- for a currently visible, non-expired card that references the exact object.
drop policy if exists card_media_visible_read on storage.objects;
create policy card_media_visible_read on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'card-media'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.baul_cards c
      where c.card_visible = true
        and (c.intent_expires_at is null or c.intent_expires_at > now())
        and (c.foto_path = name or c.foto2_path = name)
    )
  )
);
