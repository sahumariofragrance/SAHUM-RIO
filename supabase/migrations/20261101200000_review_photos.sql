-- Review photos: a review can carry up to 3 photos.
--
-- Photos are sent with the review to /api/reviews/upsert, which checks them
-- (WebP, JPEG or PNG, at most 1 MB each, shrunk in the browser first) and
-- stores them in the public "review-photos" bucket under
-- <reviewer's user id>/<product id>/<random name>. There are deliberately no
-- storage policies for shoppers: only the server (service role) can add or
-- remove files, so nobody can upload straight to the bucket around the
-- website's checks and rate limits, and nobody can list the bucket. The
-- photos themselves are served through their public URLs.
-- Safe to run twice.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

alter table public.product_reviews
  add column if not exists photos text[] not null default '{}';

comment on column public.product_reviews.photos is 'Up to 3 photo paths in the review-photos bucket: <user id>/<product id>/<name>.(webp|jpg|png).';

-- At most 3, and only files in the reviewer's own folder for this perfume.
create or replace function public.review_photos_valid(p_photos text[], p_user uuid, p_product bigint)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(cardinality(p_photos), 0) <= 3
     and not exists (
       select 1
       from unnest(coalesce(p_photos, '{}')) as photo
       where photo !~ ('^' || p_user::text || '/' || p_product::text || '/[A-Za-z0-9-]{8,64}\.(webp|jpg|png)$')
     );
$$;

alter table public.product_reviews drop constraint if exists product_reviews_photos_valid;
alter table public.product_reviews
  add constraint product_reviews_photos_valid check (public.review_photos_valid(photos, user_id, product_id));

-- The product page's review list now includes the photos.
-- Otherwise unchanged from 20260922144500_security_hardening_followup.sql.
drop function if exists public.get_product_reviews(bigint);
create function public.get_product_reviews(p_product_id bigint)
returns table(
  id bigint,
  product_id bigint,
  display_name text,
  rating smallint,
  title text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  is_own boolean,
  photos text[]
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    r.id, r.product_id, r.display_name, r.rating, r.title, r.body,
    r.created_at, r.updated_at,
    (auth.uid() is not null and r.user_id = auth.uid()) as is_own,
    coalesce(r.photos, '{}')
  from public.product_reviews r
  where r.product_id = p_product_id
  order by r.created_at desc, r.id desc;
$$;

revoke all on function public.get_product_reviews(bigint) from public;
grant execute on function public.get_product_reviews(bigint)
  to anon, authenticated, service_role;
