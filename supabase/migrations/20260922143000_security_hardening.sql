-- Security hardening for API abuse controls and server-only sensitive writes.

create table if not exists public.api_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_start),
  check (char_length(scope) between 1 and 80),
  check (char_length(key_hash) between 32 and 128)
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;

create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits(updated_at);

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_scope is null or char_length(p_scope) < 1 or char_length(p_scope) > 80 then
    raise exception 'invalid rate limit scope';
  end if;
  if p_key_hash is null or char_length(p_key_hash) < 32 or char_length(p_key_hash) > 128 then
    raise exception 'invalid rate limit key';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'invalid rate limit window';
  end if;

  v_window_start :=
    to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  insert into public.api_rate_limits(scope, key_hash, window_start, count, updated_at)
  values (p_scope, p_key_hash, v_window_start, 1, v_now)
  on conflict (scope, key_hash, window_start)
  do update set count = public.api_rate_limits.count + 1, updated_at = excluded.updated_at
  returning public.api_rate_limits.count into v_count;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  reset_at := v_window_start + make_interval(secs => p_window_seconds);
  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and exists (
       select 1 from public.admin_users a where a.user_id = auth.uid()
     );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

revoke execute on function public.get_all_orders_admin() from authenticated;
revoke execute on function public.update_order_status_admin(text, text) from authenticated;

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
security definer
set search_path = public, pg_temp
as $$
  select
    r.id, r.product_id, r.display_name, r.rating, r.title, r.body,
    r.created_at, r.updated_at,
    (auth.uid() is not null and r.user_id = auth.uid()) as is_own
  from public.product_reviews r
  join public.products p on p.id = r.product_id
  where r.product_id = p_product_id and p.active = true
  order by r.created_at desc, r.id desc;
$$;

revoke all on function public.get_product_reviews(bigint) from public;
grant execute on function public.get_product_reviews(bigint)
  to anon, authenticated, service_role;

create index if not exists product_reviews_user_id_idx on public.product_reviews(user_id);
create index if not exists products_created_by_idx on public.products(created_by);
create index if not exists products_updated_by_idx on public.products(updated_by);

-- Final least-privilege state after hardened server endpoints are deployed.
drop policy if exists "Customers can create own payment intents" on public.payment_intents;
revoke insert on table public.payment_intents from authenticated, anon;

drop policy if exists "Customers can create own review" on public.product_reviews;
drop policy if exists "Customers can update own review" on public.product_reviews;
drop policy if exists "Users or admins can delete reviews" on public.product_reviews;
revoke insert, update, delete, truncate, references, trigger on public.product_reviews from anon;
revoke insert, update, delete, truncate, references, trigger on public.product_reviews from authenticated;

revoke delete, insert, update, truncate, references, trigger on public.products from anon;
revoke delete, truncate, references, trigger on public.profiles from anon;
revoke delete, truncate, references, trigger on public.profiles from authenticated;
revoke truncate, references, trigger on public.orders from authenticated;
