-- Admin → Discounts: delete any code.
-- A code nobody has used is removed completely. A code that has been used
-- is switched off for good and taken out of the admin list, but its record
-- of who used it is kept: past orders still show the discount, and if the
-- same name were ever created again, customers who used it before couldn't
-- use it a second time. Safe to run twice.

alter table public.discount_codes
  add column if not exists deleted_at timestamptz;

comment on column public.discount_codes.deleted_at is 'Deleted in Admin after it was used: never valid again and hidden from the admin list.';

create or replace function public.admin_delete_discount_code(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if exists (select 1 from public.discount_redemptions where code_id = p_id) then
    update public.discount_codes
    set active = false, show_on_site = false, deleted_at = coalesce(deleted_at, now())
    where id = p_id;
  else
    delete from public.discount_codes where id = p_id;
  end if;
end;
$$;

revoke all on function public.admin_delete_discount_code(bigint) from public, anon;
grant execute on function public.admin_delete_discount_code(bigint) to authenticated;

-- The admin list leaves out deleted codes. Otherwise unchanged from
-- supabase/migrations/20261004120000_site_promo.sql.
create or replace function public.admin_discount_codes()
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
    where c.deleted_at is null
    group by c.id
    order by c.created_at desc;
end;
$$;

revoke all on function public.admin_discount_codes() from public, anon;
grant execute on function public.admin_discount_codes() to authenticated;

-- A deleted code can't be switched back on from anywhere.
alter table public.discount_codes drop constraint if exists discount_codes_deleted_off;
alter table public.discount_codes
  add constraint discount_codes_deleted_off check (deleted_at is null or (not active and not show_on_site));
