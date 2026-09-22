-- Remove elevated admin-status function privileges and rely on RLS.

grant select on table public.admin_users to authenticated;

drop policy if exists "Users can check own admin status" on public.admin_users;
create policy "Users can check own admin status"
on public.admin_users
for select
to authenticated
using (
  user_id = (select auth.uid())
  and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and exists (
       select 1
       from public.admin_users a
       where a.user_id = auth.uid()
     );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
