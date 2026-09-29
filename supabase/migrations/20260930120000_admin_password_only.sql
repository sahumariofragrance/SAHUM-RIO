-- Admin access requires a password sign-in.
--
-- Every Supabase access token lists how the session was authenticated in its
-- "amr" claim, e.g. [{"method": "password", ...}] or [{"method": "otp", ...}].
-- is_admin() now also requires a "password" entry, so an admin account that
-- signs in with an email code (OTP), magic link or password-reset link gets no
-- admin rights until it signs in with its password. Customers are unaffected
-- and can keep using OTP.
--
-- Everything admin-only (order APIs, catalogue and image writes, review
-- moderation, order trash) checks is_admin(), so this covers all of it.

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
       from jsonb_array_elements(
         case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end
       ) as factor
       where factor ->> 'method' = 'password'
     )
     and exists (
       select 1
       from public.admin_users a
       where a.user_id = auth.uid()
     );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
