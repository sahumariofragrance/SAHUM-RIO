-- The public product-images bucket serves photos through public URLs
-- (/storage/v1/object/public/...), which do not use row-level security.
-- A public SELECT policy additionally let anyone LIST every file in the
-- bucket through the Storage API, including photos of hidden products.
-- Only the admin needs to list/select objects (image cleanup on save/delete).

drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Admins can view product images" on storage.objects;
create policy "Admins can view product images"
on storage.objects
for select
to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
