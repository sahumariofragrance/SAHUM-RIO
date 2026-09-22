-- Follow-up security hardening: use RLS for public review reads and reduce browser privileges.

grant select on table public.product_reviews to anon, authenticated;

drop policy if exists "Public can read active product reviews" on public.product_reviews;
create policy "Public can read active product reviews"
on public.product_reviews
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_reviews.product_id
      and p.active = true
  )
);

create or replace function public.get_product_reviews(p_product_id bigint)
returns table(
  id bigint,
  product_id bigint,
  display_name text,
  rating smallint,
  title text,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  is_own boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    r.id, r.product_id, r.display_name, r.rating, r.title, r.body,
    r.created_at, r.updated_at,
    (auth.uid() is not null and r.user_id = auth.uid()) as is_own
  from public.product_reviews r
  where r.product_id = p_product_id
  order by r.created_at desc, r.id desc;
$$;

grant execute on function public.get_product_reviews(bigint)
  to anon, authenticated, service_role;

revoke truncate, references, trigger on table public.products from authenticated;
revoke select, insert, update on table public.profiles from anon;
revoke truncate, references, trigger on table public.pending_products from authenticated;
revoke truncate, references, trigger on table public.order_email_events from authenticated;
