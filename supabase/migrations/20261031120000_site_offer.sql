-- The "any 2 perfumes for one price" offer, switched on and off in Admin →
-- Discounts instead of in the website's code. When it is on (and its end
-- date, if any, hasn't passed) the homepage shows its card, the top bar,
-- bag and checkout show it, and the order API prices every two perfumes at
-- the offer price. It starts switched off.
--
-- Run this in the Supabase SQL Editor after the website update is live.
-- Safe to run twice: a saved offer is kept.

create table if not exists public.site_offer (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  name text not null default 'Festive offer' check (char_length(name) between 2 and 40),
  pair_price integer not null default 1299 check (pair_price between 100 and 100000),
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.site_offer (id) values (true) on conflict (id) do nothing;

alter table public.site_offer enable row level security;
revoke all on public.site_offer from public, anon, authenticated;

-- Public: the offer while it is on and not ended; nothing otherwise.
create or replace function public.site_offer()
returns table (name text, pair_price integer, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select o.name, o.pair_price, o.ends_at
  from public.site_offer o
  where o.id and o.enabled and (o.ends_at is null or o.ends_at > now());
$$;

revoke all on function public.site_offer() from public;
grant execute on function public.site_offer() to anon, authenticated;

-- Admin → Discounts: read and save the offer.
create or replace function public.admin_site_offer()
returns table (enabled boolean, name text, pair_price integer, ends_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return query select o.enabled, o.name, o.pair_price, o.ends_at from public.site_offer o where o.id;
end;
$$;

revoke all on function public.admin_site_offer() from public, anon;
grant execute on function public.admin_site_offer() to authenticated;

create or replace function public.admin_save_site_offer(p_enabled boolean, p_name text, p_pair_price integer, p_ends_at timestamptz)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  insert into public.site_offer (id, enabled, name, pair_price, ends_at, updated_at)
  values (true, coalesce(p_enabled, false), trim(p_name), p_pair_price, p_ends_at, now())
  on conflict (id) do update
    set enabled = excluded.enabled, name = excluded.name, pair_price = excluded.pair_price,
        ends_at = excluded.ends_at, updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.admin_save_site_offer(boolean, text, integer, timestamptz) from public, anon;
grant execute on function public.admin_save_site_offer(boolean, text, integer, timestamptz) to authenticated;
