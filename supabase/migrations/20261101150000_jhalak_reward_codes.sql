-- Jhalak set thank-you codes: every paid order with a Jhalak set (one of the
-- curated sets or any 5 the customer picks) gets a personal discount code by
-- email, 10% off 50 ml perfumes, one use, valid 30 days (src/data/testers.json
-- "setReward"). The order API creates the code after payment
-- (api/_lib/jhalakReward.js). Run after
-- 20261101140000_discount_codes_testers.sql. Safe to run twice.

alter table public.discount_codes
  add column if not exists single_use boolean not null default false,
  add column if not exists reward_order_id text;

comment on column public.discount_codes.single_use is 'Works for one order in total (not once per customer).';
comment on column public.discount_codes.reward_order_id is 'The Jhalak set order this thank-you code was sent for. One code per order.';

create unique index if not exists discount_codes_reward_order_id_key
  on public.discount_codes (reward_order_id) where reward_order_id is not null;

-- The admin list leaves out the thank-you codes (they are counted on their
-- own card). Otherwise unchanged from 20261101140000_discount_codes_testers.sql.
create or replace function public.admin_discount_codes()
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
    where c.deleted_at is null and c.reward_order_id is null
    group by c.id
    order by c.created_at desc;
end;
$$;

revoke all on function public.admin_discount_codes() from public, anon;
grant execute on function public.admin_discount_codes() to authenticated;

-- Admin → Discounts: how the thank-you codes are doing.
create or replace function public.admin_jhalak_rewards()
returns table (sent bigint, used bigint, discount_given numeric)
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
    select count(distinct c.id)::bigint,
           count(distinct r.code_id)::bigint,
           coalesce(sum(r.discount_amount), 0)
    from public.discount_codes c
    left join public.discount_redemptions r on r.code_id = c.id
    where c.reward_order_id is not null;
end;
$$;

revoke all on function public.admin_jhalak_rewards() from public, anon;
grant execute on function public.admin_jhalak_rewards() to authenticated;
