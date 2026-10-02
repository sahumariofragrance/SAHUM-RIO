-- SAHUMäRIO's own website analytics (admin dashboard → Analytics).
--
-- Rows are written only by the /api/collect server function (service role):
-- page views plus two shop events, "add_to_cart" and "purchase". Each row has
--   visitor  a one-way hash of IP address + browser that changes every day, so
--            daily unique visitors can be counted without storing the IP or
--            recognising anyone from one day to the next;
--   session  a random id for one browser tab (no cookie);
--   source, device and approximate location (country/state/city from the
--            hosting provider's request headers).
-- No names, emails, accounts or IP addresses are stored. Rows older than 13
-- months are deleted by analytics_prune(), which the collector calls now and
-- then. Only an admin can read the report (admin_analytics).

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  day date not null default (timezone('Asia/Kolkata', now()))::date,
  kind text not null check (kind in ('pageview', 'add_to_cart', 'purchase')),
  visitor text not null,
  session uuid,
  path text not null,
  product text,
  entry boolean not null default false,
  source text,
  campaign text,
  device text,
  country text,
  region text,
  city text,
  value numeric(12, 2)
);

create index if not exists analytics_events_day_idx on public.analytics_events (day);
create index if not exists analytics_events_kind_day_idx on public.analytics_events (kind, day);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from public, anon, authenticated;

create or replace function public.analytics_prune()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.analytics_events where created_at < now() - interval '13 months';
$$;

-- The whole Analytics tab in one call: the last p_days days (IST), today included.
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
        from ev where product is not null
        group by product
        order by 2 desc, 3 desc
        limit 10
      ) p
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

revoke all on function public.analytics_prune() from public, anon, authenticated;
grant execute on function public.analytics_prune() to service_role;
revoke all on function public.admin_analytics(integer) from public, anon;
grant execute on function public.admin_analytics(integer) to authenticated;
