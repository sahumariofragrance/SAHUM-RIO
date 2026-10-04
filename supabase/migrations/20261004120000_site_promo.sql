-- Promote one discount code on the website (announcement bar, homepage
-- ticket, product pages). An admin turns on "Show on website" for a code in
-- the Discounts tab; the site shows the newest such code that is switched on
-- and not expired. Switching it off or letting it expire hides it everywhere.

alter table public.discount_codes
  add column if not exists show_on_site boolean not null default false;

-- Public: only the code and percentage of the promoted code, nothing else.
create or replace function public.site_promo()
returns table (code text, percent integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.percent
  from public.discount_codes c
  where c.show_on_site and c.active and (c.expires_at is null or c.expires_at > now())
  order by c.created_at desc
  limit 1;
$$;

revoke all on function public.site_promo() from public;
grant execute on function public.site_promo() to anon, authenticated;

-- The admin list now includes the "Show on website" flag.
drop function if exists public.admin_discount_codes();
create function public.admin_discount_codes()
returns table (
  id bigint, code text, percent integer, active boolean, expires_at timestamptz,
  note text, created_at timestamptz, uses bigint, total_discount numeric, show_on_site boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query
    select c.id, c.code, c.percent, c.active, c.expires_at, c.note, c.created_at,
           count(r.id)::bigint, coalesce(sum(r.discount_amount), 0), c.show_on_site
    from public.discount_codes c
    left join public.discount_redemptions r on r.code_id = c.id
    group by c.id
    order by c.created_at desc;
end;
$$;

revoke all on function public.admin_discount_codes() from public, anon;
grant execute on function public.admin_discount_codes() to authenticated;
