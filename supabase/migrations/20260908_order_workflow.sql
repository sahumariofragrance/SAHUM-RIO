-- Order workflow fields for the rebuilt admin/customer experience.
-- Review in a preview/staging Supabase project before applying to production.

alter table public.orders
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists accepted_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists courier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text;

update public.orders
set status = 'Pending'
where status is null or btrim(status) = '';

alter table public.orders
  alter column status set default 'Pending';

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('Pending','Accepted','Processing','Shipped','Delivered','Rejected','Cancelled'));

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);
