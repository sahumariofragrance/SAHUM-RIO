-- Admin → Analytics → Logins: how many customers logged in, how many new
-- accounts were made, and whether orders come from accounts or guests.
--
-- Read from Supabase's own sign-in records (auth.users), so it covers the
-- past too: "logged in" means the customer signed in (password or email code)
-- at least once in the period. Guest checkouts (anonymous sessions) and the
-- admin accounts are not counted. Admin-only. Safe to run twice.

create or replace function public.admin_logins(p_days integer default 30)
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
  since timestamptz := first_day::timestamp at time zone 'Asia/Kolkata';
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  with people as (
    select u.id, u.email, u.created_at, u.last_sign_in_at, u.email_confirmed_at,
           nullif(btrim(coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', '')), '') as name
    from auth.users u
    where coalesce(u.is_anonymous, false) = false
      and u.deleted_at is null
      and not exists (select 1 from public.admin_users a where a.user_id = u.id)
  ),
  orders_all as (
    select o.user_id, o.created_at
    from public.orders o
    where o.deleted_at is null
      and not exists (select 1 from public.admin_users a where a.user_id = o.user_id)
  ),
  orders_by as (
    select user_id, count(*) as orders from orders_all where user_id is not null group by user_id
  ),
  period_orders as (
    select user_id, exists (select 1 from people p where p.id = orders_all.user_id) as from_account
    from orders_all
    where created_at >= since
  ),
  recent as (
    select p.name, p.email, p.last_sign_in_at, p.created_at >= since as is_new, coalesce(o.orders, 0) as orders
    from people p
    left join orders_by o on o.user_id = p.id
    where p.last_sign_in_at >= since
    order by p.last_sign_in_at desc
    limit 10
  )
  select jsonb_build_object(
    'from', first_day,
    'to', last_day,
    'logged_in', (select count(*) from people where last_sign_in_at >= since),
    'returning', (select count(*) from people where last_sign_in_at >= since and created_at < since),
    'new_accounts', (select count(*) from people where created_at >= since and email_confirmed_at is not null),
    'unfinished', (select count(*) from people where created_at >= since and email_confirmed_at is null),
    'total_accounts', (select count(*) from people where email_confirmed_at is not null),
    'logged_in_ordered', (select count(*) from people p join orders_by o on o.user_id = p.id where p.last_sign_in_at >= since),
    'orders_account', (select count(*) from period_orders where from_account),
    'orders_guest', (select count(*) from period_orders where not from_account),
    'recent', coalesce((select jsonb_agg(jsonb_build_object(
        'name', r.name, 'email', r.email, 'at', r.last_sign_in_at, 'new', r.is_new, 'orders', r.orders
      ) order by r.last_sign_in_at desc) from recent r), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_logins(integer) from public, anon;
grant execute on function public.admin_logins(integer) to authenticated;
