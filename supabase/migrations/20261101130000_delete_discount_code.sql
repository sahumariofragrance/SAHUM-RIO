-- Admin → Discounts: delete a code that nobody has used yet.
-- A code that has been used can't be deleted, because its uses are how each
-- customer is kept to one use; turn it off or change its expiry instead.
-- Orders keep the code's name either way. Safe to run twice.

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
    raise exception 'This code has been used, so it can''t be deleted. Turn it off instead.' using errcode = 'P0001';
  end if;
  delete from public.discount_codes where id = p_id;
end;
$$;

revoke all on function public.admin_delete_discount_code(bigint) from public, anon;
grant execute on function public.admin_delete_discount_code(bigint) to authenticated;
