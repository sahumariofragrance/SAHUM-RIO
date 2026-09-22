-- Allow review owners to manage their own review and administrators to delete any review.

grant insert, update, delete on table public.product_reviews to authenticated;

drop policy if exists "Customers can create own review" on public.product_reviews;
create policy "Customers can create own review"
on public.product_reviews
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Customers can update own review" on public.product_reviews;
create policy "Customers can update own review"
on public.product_reviews
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Owners or admins can delete reviews" on public.product_reviews;
create policy "Owners or admins can delete reviews"
on public.product_reviews
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
);
