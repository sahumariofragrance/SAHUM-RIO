-- Admin → Analytics: "Added to bag" gets its own list, ranked by how often
-- each perfume and each Jhalak (10 ml tester) goes into the bag, so it no
-- longer depends on the 10 most-viewed perfumes. "Top perfumes" keeps page
-- views (Jhalak, which have no pages of their own, are left out of it).
-- Otherwise unchanged from 20261002130000_site_analytics.sql. Safe to run twice.

create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  days integer := greatest(1, least(coalesce(p_days, 30), 400));
  last_day date := (timezone('Asia/Kolkata', now()))::date;
  first_day date := last_day - (days - 1);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  with ev as (
    select * from public.analytics_events where day between first_day and last_day
  ),
  pv as (
    select * from ev where kind = 'pageview'
  ),
  daily as (
    select day, count(distinct visitor) as visitors, count(*) as pageviews
    from pv group by day
  )
  select jsonb_build_object(
    'from', first_day,
    'to', last_day,
    'totals', jsonb_build_object(
      'visitors', (select count(distinct (day, visitor)) from pv),
      'visits', (select count(distinct session) from pv where session is not null),
      'pageviews', (select count(*) from pv),
      'orders', (select count(*) from ev where kind = 'purchase'),
      'revenue', (select coalesce(sum(value), 0) from ev where kind = 'purchase')
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d::date,
        'visitors', coalesce(daily.visitors, 0),
        'pageviews', coalesce(daily.pageviews, 0)
      ) order by d), '[]'::jsonb)
      from generate_series(first_day, last_day, interval '1 day') as d
      left join daily on daily.day = d::date
    ),
    -- Visits (browser tabs) that reached each step.
    'funnel', jsonb_build_object(
      'visits', (select count(distinct session) from pv),
      'viewed_product', (select count(distinct session) from pv where product is not null),
      'added_to_bag', (select count(distinct session) from ev where kind = 'add_to_cart'),
      'reached_checkout', (select count(distinct session) from pv where path = '/checkout'),
      'paid', (select count(distinct session) from ev where kind = 'purchase')
    ),
    'products', (
      select coalesce(jsonb_agg(row_to_json(p) order by p.views desc, p.added desc), '[]'::jsonb)
      from (
        select product,
               count(*) filter (where kind = 'pageview') as views,
               count(*) filter (where kind = 'add_to_cart') as added
        from ev where product is not null and product not like '%-tester'
        group by product
        order by 2 desc, 3 desc
        limit 10
      ) p
    ),
    -- What goes in the bag, most added first: 50 ml perfumes and Jhalak
    -- (10 ml testers, product slug ending "-tester"). `added` counts every
    -- add (a Jhalak set adds five); `visits` counts browser tabs.
    'added', (
      select coalesce(jsonb_agg(row_to_json(a) order by a.added desc, a.visits desc), '[]'::jsonb)
      from (
        select product, count(*) as added, count(distinct session) as visits
        from ev where kind = 'add_to_cart' and product is not null
        group by product
        order by 2 desc, 3 desc
        limit 40
      ) a
    ),
    'sources', (
      select coalesce(jsonb_agg(row_to_json(s) order by s.visits desc), '[]'::jsonb)
      from (
        select coalesce(source, 'direct') as source, count(*) as visits
        from pv where entry and coalesce(source, 'direct') <> 'internal'
        group by 1 order by 2 desc limit 8
      ) s
    ),
    'campaigns', (
      select coalesce(jsonb_agg(row_to_json(c) order by c.visits desc), '[]'::jsonb)
      from (
        select campaign, count(*) as visits
        from pv where entry and campaign is not null
        group by 1 order by 2 desc limit 8
      ) c
    ),
    'places', (
      select coalesce(jsonb_agg(row_to_json(l) order by l.visitors desc), '[]'::jsonb)
      from (
        select country, region, city, count(distinct (day, visitor)) as visitors
        from pv group by 1, 2, 3 order by 4 desc limit 10
      ) l
    ),
    'devices', (
      select coalesce(jsonb_agg(row_to_json(dv) order by dv.visitors desc), '[]'::jsonb)
      from (
        select coalesce(device, 'unknown') as device, count(distinct (day, visitor)) as visitors
        from pv group by 1 order by 2 desc
      ) dv
    ),
    'pages', (
      select coalesce(jsonb_agg(row_to_json(pg) order by pg.views desc), '[]'::jsonb)
      from (
        select path, count(*) as views from pv where product is null
        group by 1 order by 2 desc limit 8
      ) pg
    )
  )
  into result
  from (select 1) as one;

  return result;
end;
$$;

revoke all on function public.admin_analytics(integer) from public, anon;
grant execute on function public.admin_analytics(integer) to authenticated;
