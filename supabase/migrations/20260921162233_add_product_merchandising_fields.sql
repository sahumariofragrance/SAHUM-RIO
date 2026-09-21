alter table public.products
  add column if not exists size_volume text,
  add column if not exists fragrance_family text,
  add column if not exists scent_profile text,
  add column if not exists occasion text;

comment on column public.products.size_volume is 'Optional customer-facing size or volume, such as 50 ml.';
comment on column public.products.fragrance_family is 'Optional verified fragrance family.';
comment on column public.products.scent_profile is 'Optional verified customer-facing scent profile.';
comment on column public.products.occasion is 'Optional verified occasion guidance.';

update public.products
set alt = 'SAHUMäRIO Dew Drop oil-based perfume bottle',
    updated_at = now()
where slug = 'dew-drop'
  and alt ilike '%eau de parfum%';
