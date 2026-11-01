-- Perfume badges: "Signature" (a flagship scent) or "New" (a recent launch),
-- chosen per perfume in Admin → Catalogue → Badge and shown on the perfume
-- cards, the perfume page and its Jhalak. Honest labels only: no
-- "Bestseller" until real sales say so. Safe to run twice: badges chosen
-- in Admin are kept.

alter table public.products
  add column if not exists badge text;

alter table public.products drop constraint if exists products_badge_check;
alter table public.products
  add constraint products_badge_check check (badge is null or badge in ('signature', 'new'));

comment on column public.products.badge is 'Badge on the perfume card: signature or new (null: none). Set in Admin → Catalogue.';

-- Start (only the first time, while no perfume has a badge yet, so badges
-- chosen or removed in Admin are never overwritten): three Signature
-- perfumes, and the rest of the new collection on sale as New.
do $$
begin
  if not exists (select 1 from public.products where badge is not null) then
    update public.products set badge = 'signature'
    where slug in ('samrat', 'rasmalai', 'mogra-oud');

    update public.products set badge = 'new'
    where slug in ('rajtilak', 'laal-gulab', 'kesar-kasturi', 'kali-elaichi', 'mogra-elaichi', 'gulab-khus',
                   'chandan-mirch', 'gulabi-savar', 'chandni', 'hara-ananas', 'komal', 'chandan-lavender');
  end if;
end $$;
