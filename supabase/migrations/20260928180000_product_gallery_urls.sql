-- Store each product's full image gallery, in display order (image 1 = cover).
-- The product page previously guessed gallery/<folder>/1..5 and hid the ones
-- that failed to load; with this list it loads exactly the images that exist.

alter table public.products
  add column if not exists gallery_urls text[] not null default '{}';

comment on column public.products.gallery_urls is
  'Public URLs of the product images in display order (max 6). The first entry is the cover image (image_url).';

alter table public.products
  drop constraint if exists products_gallery_urls_max;
alter table public.products
  add constraint products_gallery_urls_max check (cardinality(gallery_urls) <= 6);

-- Backfill existing products from the files already in the product-images bucket.
-- Uses the same folder the product page used to probe: the cover's folder for
-- gallery uploads, otherwise gallery/<slug>. Files are named 1, 2, 3 …
with folders as (
  select
    p.id,
    p.image_url,
    substring(p.image_url from '^(.*/storage/v1/object/public/product-images/)') as base,
    split_part(split_part(p.image_url, '/storage/v1/object/public/product-images/', 2), '?', 1) as cover_path,
    p.slug
  from public.products p
  where p.image_url like '%/storage/v1/object/public/product-images/%'
    and cardinality(p.gallery_urls) = 0
),
parents as (
  select
    f.*,
    case
      when f.cover_path like 'gallery/%' then regexp_replace(f.cover_path, '/[^/]*$', '')
      else 'gallery/' || f.slug
    end as parent
  from folders f
),
files as (
  select
    pa.id,
    array_agg(pa.base || o.name order by (regexp_replace(o.name, '^.*/', ''))::int) as urls
  from parents pa
  join storage.objects o
    on o.bucket_id = 'product-images'
   and left(o.name, length(pa.parent) + 1) = pa.parent || '/'
   and substr(o.name, length(pa.parent) + 2) ~ '^[0-9]+$'
  group by pa.id
)
update public.products p
set gallery_urls = (
  case
    when files.urls is null then array[pa.image_url]
    when pa.image_url = any(files.urls) then files.urls
    else array[pa.image_url] || files.urls
  end
)[1:6]
from parents pa
left join files on files.id = pa.id
where p.id = pa.id;
