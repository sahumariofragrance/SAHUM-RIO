-- Spin wheel before checkout: one prize per customer.
--
-- At checkout the customer spins a wheel once. The server picks the prize
-- (api/discounts/[action].js; the prizes and their odds are in
-- src/data/spin.json) and saves it here under a one-off code: 5% or 10% off,
-- or a free 10 ml tester the customer chooses from perfumes of a different
-- fragrance family to their bag. A code works for one order, it expires after
-- a few days, and each customer (order email or phone number) can use one
-- spin prize ever.
--
-- Run this in the Supabase SQL Editor after the website update is live. The
-- wheel stays hidden until then. Safe to run twice. Switch the wheel off or on
-- in Admin → Discounts.

create table if not exists public.spin_prizes (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^SPIN[A-Z0-9]{6}$'),
  -- Exactly one of the two: a percentage off, or a number of free testers.
  percent integer check (percent between 1 and 90),
  testers integer check (testers between 1 and 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- Filled in when an order that uses the prize is paid.
  order_id text,
  email text,
  phone text,
  used_at timestamptz,
  constraint spin_prizes_one_prize check ((percent is null) <> (testers is null))
);

create index if not exists spin_prizes_order_idx on public.spin_prizes (order_id) where order_id is not null;
create index if not exists spin_prizes_email_idx on public.spin_prizes (email) where order_id is not null;
create index if not exists spin_prizes_phone_idx on public.spin_prizes (phone) where order_id is not null;

-- Only the website's server (service role) reads and writes prizes.
alter table public.spin_prizes enable row level security;
revoke all on public.spin_prizes from public, anon, authenticated;

-- The wheel's on/off switch: one row.
create table if not exists public.spin_wheel_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.spin_wheel_settings (id) values (true) on conflict (id) do nothing;
alter table public.spin_wheel_settings enable row level security;
revoke all on public.spin_wheel_settings from public, anon, authenticated;

-- Public: only whether the wheel is shown.
create or replace function public.spin_wheel_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select s.enabled from public.spin_wheel_settings s where s.id), false);
$$;

revoke all on function public.spin_wheel_open() from public;
grant execute on function public.spin_wheel_open() to anon, authenticated;

-- Admin → Discounts: the switch, and what the wheel has given away.
create or replace function public.admin_spin_wheel()
returns table (enabled boolean, spins bigint, used bigint, discount_given numeric, testers_given bigint)
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
    select coalesce((select s.enabled from public.spin_wheel_settings s where s.id), false),
           count(p.id)::bigint,
           count(p.order_id)::bigint,
           coalesce(sum(o.discount_amount) filter (where p.percent is not null), 0),
           coalesce(sum(p.testers) filter (where p.order_id is not null), 0)::bigint
    from public.spin_prizes p
    left join public.orders o on o.id = p.order_id;
end;
$$;

revoke all on function public.admin_spin_wheel() from public, anon;
grant execute on function public.admin_spin_wheel() to authenticated;

create or replace function public.admin_set_spin_wheel(p_enabled boolean)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  insert into public.spin_wheel_settings (id, enabled, updated_at)
  values (true, coalesce(p_enabled, false), now())
  on conflict (id) do update set enabled = excluded.enabled, updated_at = excluded.updated_at;
  return coalesce(p_enabled, false);
end;
$$;

revoke all on function public.admin_set_spin_wheel(boolean) from public, anon;
grant execute on function public.admin_set_spin_wheel(boolean) to authenticated;

-- The prize an order used, and the free tester(s) to pack with it:
-- [{ "product_id": 112, "name": "Kesar Kasturi", "ml": 10 }, ...].
alter table public.payment_intents
  add column if not exists spin_code text,
  add column if not exists free_testers jsonb;

alter table public.orders
  add column if not exists spin_code text,
  add column if not exists free_testers jsonb;

-- Unchanged from supabase/migrations/20261004100000_discount_codes.sql except:
-- the spin prize and free testers are copied onto the order, and the prize is
-- marked used. A problem marking it never stops the paid order being saved.
create or replace function public.finalize_razorpay_payment_intent(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_amount_paise bigint,
  p_currency text,
  p_event_id text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_intent public.payment_intents%rowtype;
  v_order public.orders%rowtype;
  v_now timestamptz := now();
  v_created boolean := false;
  v_code public.discount_codes%rowtype;
begin
  if p_razorpay_order_id is null or p_razorpay_payment_id is null then
    raise exception 'payment identifiers required';
  end if;
  if p_amount_paise <= 0 or p_currency <> 'INR' then
    raise exception 'invalid payment amount or currency';
  end if;

  select * into v_intent
    from public.payment_intents
   where razorpay_order_id = p_razorpay_order_id
   for update;

  if not found then
    raise exception 'payment intent not found';
  end if;
  if v_intent.amount_paise <> p_amount_paise or v_intent.currency <> p_currency then
    raise exception 'payment does not match intent';
  end if;
  if v_intent.razorpay_payment_id is not null and v_intent.razorpay_payment_id <> p_razorpay_payment_id then
    raise exception 'payment id does not match intent';
  end if;

  select * into v_order from public.orders where id = p_razorpay_order_id;
  if found then
    if coalesce(v_order.payment->>'id','') <> p_razorpay_payment_id then
      raise exception 'existing order payment mismatch';
    end if;
  else
    insert into public.orders (
      id, user_id, items, subtotal, total, discount_code, discount_amount, spin_code, free_testers,
      address, payment, status, created_at, updated_at
    ) values (
      v_intent.razorpay_order_id,
      v_intent.user_id,
      v_intent.items,
      v_intent.subtotal,
      round(p_amount_paise / 100.0, 2),
      v_intent.discount_code,
      coalesce(v_intent.discount_amount, 0),
      v_intent.spin_code,
      v_intent.free_testers,
      v_intent.address,
      jsonb_build_object(
        'id', p_razorpay_payment_id,
        'order_id', p_razorpay_order_id,
        'method', 'Razorpay',
        'verified', true,
        'status', 'captured',
        'captured', true,
        'amount', p_amount_paise,
        'currency', p_currency
      ),
      'Pending',
      v_now,
      v_now
    ) returning * into v_order;
    v_created := true;

    -- The customer has paid, so the redemption is recorded even if the same
    -- email or phone redeemed this code moments earlier in another tab.
    if v_intent.discount_code is not null then
      select * into v_code from public.discount_codes where code = v_intent.discount_code;
      if found then
        insert into public.discount_redemptions (code_id, code, order_id, email, phone, discount_amount)
        values (
          v_code.id,
          v_code.code,
          v_order.id,
          lower(trim(coalesce(v_intent.address->>'email', v_intent.customer_email, ''))),
          right(regexp_replace(coalesce(v_intent.address->>'phone', ''), '\D', '', 'g'), 10),
          coalesce(v_intent.discount_amount, 0)
        )
        on conflict do nothing;
      end if;
    end if;

    -- The spin prize is used up by this order and counts against this
    -- customer's email and phone (the order API checked them before payment).
    if v_intent.spin_code is not null then
      begin
        update public.spin_prizes
           set order_id = v_order.id,
               email = lower(trim(coalesce(v_intent.address->>'email', v_intent.customer_email, ''))),
               phone = right(regexp_replace(coalesce(v_intent.address->>'phone', ''), '\D', '', 'g'), 10),
               used_at = v_now
         where code = v_intent.spin_code
           and order_id is null;
      exception when others then
        raise warning 'spin prize % was not marked used for order %: %', v_intent.spin_code, v_order.id, sqlerrm;
      end;
    end if;
  end if;

  update public.payment_intents
     set status = 'order_created',
         razorpay_payment_id = p_razorpay_payment_id,
         paid_at = coalesce(paid_at, v_now),
         order_created_at = coalesce(order_created_at, v_now),
         last_event_id = coalesce(p_event_id, last_event_id),
         updated_at = v_now
   where razorpay_order_id = p_razorpay_order_id;

  return jsonb_build_object('order', to_jsonb(v_order), 'created', v_created);
end;
$function$;
