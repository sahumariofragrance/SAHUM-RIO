-- Discount codes and 10 ml testers: a code takes its percentage off the
-- 50 ml perfumes in the order only, unless "Also on 10 ml testers" is
-- switched on for it in Admin → Discounts. Run after
-- 20261101130000_delete_discount_code.sql. Safe to run twice.

alter table public.discount_codes
  add column if not exists include_testers boolean not null default false;

comment on column public.discount_codes.include_testers is 'Also takes the percentage off 10 ml testers and tester sets (off: 50 ml perfumes only).';

-- The admin list now says whether each code covers testers. Otherwise
-- unchanged from 20261101130000_delete_discount_code.sql.
drop function if exists public.admin_discount_codes();
create function public.admin_discount_codes()
returns table (
  id bigint, code text, percent integer, active boolean, expires_at timestamptz,
  note text, created_at timestamptz, uses bigint, total_discount numeric, show_on_site boolean,
  include_testers boolean
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
           count(r.id)::bigint, coalesce(sum(r.discount_amount), 0), c.show_on_site,
           c.include_testers
    from public.discount_codes c
    left join public.discount_redemptions r on r.code_id = c.id
    where c.deleted_at is null
    group by c.id
    order by c.created_at desc;
end;
$$;

revoke all on function public.admin_discount_codes() from public, anon;
grant execute on function public.admin_discount_codes() to authenticated;
