-- Order trash for the admin dashboard.
--
-- "Delete" moves an order to the trash (deleted_at is set) instead of removing
-- it, so a mistaken delete can be restored exactly as it was. Orders are only
-- removed for good from the trash ("Delete forever"). All three actions are
-- admin-only and run through these functions, so no client can delete orders
-- directly.
--
-- Customers still see their own orders in "My orders" while they are in the
-- trash; only "Delete forever" removes them everywhere.

alter table public.orders
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id);

create index if not exists orders_deleted_at_idx
  on public.orders (deleted_at)
  where deleted_at is not null;

create or replace function public.admin_trash_orders(p_order_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_order_ids), 0) = 0 or cardinality(p_order_ids) > 200 then
    raise exception 'Choose between 1 and 200 orders' using errcode = '22023';
  end if;

  update public.orders
  set deleted_at = now(), deleted_by = auth.uid()
  where id::text = any(p_order_ids) and deleted_at is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.admin_restore_orders(p_order_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_order_ids), 0) = 0 or cardinality(p_order_ids) > 200 then
    raise exception 'Choose between 1 and 200 orders' using errcode = '22023';
  end if;

  update public.orders
  set deleted_at = null, deleted_by = null
  where id::text = any(p_order_ids) and deleted_at is not null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Permanently removes orders, but only ones already in the trash.
create or replace function public.admin_purge_orders(p_order_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_order_ids), 0) = 0 or cardinality(p_order_ids) > 200 then
    raise exception 'Choose between 1 and 200 orders' using errcode = '22023';
  end if;

  delete from public.order_email_events
  where order_id::text in (
    select id::text from public.orders
    where id::text = any(p_order_ids) and deleted_at is not null
  );

  delete from public.orders
  where id::text = any(p_order_ids) and deleted_at is not null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.admin_trash_orders(text[]) from public, anon;
revoke all on function public.admin_restore_orders(text[]) from public, anon;
revoke all on function public.admin_purge_orders(text[]) from public, anon;
grant execute on function public.admin_trash_orders(text[]) to authenticated;
grant execute on function public.admin_restore_orders(text[]) to authenticated;
grant execute on function public.admin_purge_orders(text[]) to authenticated;
