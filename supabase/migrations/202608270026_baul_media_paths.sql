-- Baul Storage metadata. Prepared locally only; do NOT execute from this task.

alter table public.baul_cards add column if not exists foto_path text;
alter table public.baul_cards add column if not exists foto_bucket text;
alter table public.baul_cards add column if not exists foto2_path text;
alter table public.baul_cards add column if not exists foto2_bucket text;

alter table public.baul_cards drop constraint if exists baul_cards_foto_bucket_check;
alter table public.baul_cards add constraint baul_cards_foto_bucket_check check (foto_bucket is null or foto_bucket = 'card-media');
alter table public.baul_cards drop constraint if exists baul_cards_foto2_bucket_check;
alter table public.baul_cards add constraint baul_cards_foto2_bucket_check check (foto2_bucket is null or foto2_bucket = 'card-media');
