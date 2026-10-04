-- Discount codes: public percentage codes (e.g. WELCOME10) that each customer
-- can use once. "Customer" means the order's email or phone number, so guests
-- (who check out without an account) can't reuse a code either.
--
-- Checkout (api/payments/razorpay/order.js) checks the code and charges the
-- discounted amount; the payment intent stores the code and the discount. When
-- the payment is confirmed, finalize_razorpay_payment_intent saves the order
-- with the amount actually paid and records the redemption in the same step.
-- Admins manage codes in the dashboard (Discounts tab).

create table if not exists public.discount_codes (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^[A-Z0-9]{3,20}$'),
  percent integer not null check (percent between 1 and 90),
  active boolean not null default true,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.discount_redemptions (
  id bigint generated always as identity primary key,
  code_id bigint not null references public.discount_codes(id) on delete cascade,
  code text not null,
  order_id text not null unique,
  email text not null,
  phone text not null,
  discount_amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (code_id, email),
  unique (code_id, phone)
);

alter table public.payment_intents
  add column if not exists discount_code text,
  add column if not exists discount_percent integer,
  add column if not exists discount_amount numeric(12, 2) not null default 0;

alter table public.orders
  add column if not exists discount_code text,
  add column if not exists discount_amount numeric(12, 2) not null default 0;

-- Only admins can see or manage codes; checkout reads them on the server.
alter table public.discount_codes enable row level security;
alter table public.discount_redemptions enable row level security;
revoke all on public.discount_codes from public, anon, authenticated;
revoke all on public.discount_redemptions from public, anon, authenticated;
grant select, insert, update on public.discount_codes to authenticated;
grant select on public.discount_redemptions to authenticated;

drop policy if exists "Admins read discount codes" on public.discount_codes;
create policy "Admins read discount codes" on public.discount_codes
  for select to authenticated using (public.is_admin());
drop policy if exists "Admins create discount codes" on public.discount_codes;
create policy "Admins create discount codes" on public.discount_codes
  for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins update discount codes" on public.discount_codes;
create policy "Admins update discount codes" on public.discount_codes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins read discount redemptions" on public.discount_redemptions;
create policy "Admins read discount redemptions" on public.discount_redemptions
  for select to authenticated using (public.is_admin());

-- Unchanged from before except: the order's total is now the amount actually
-- paid, the discount is copied onto the order, and the redemption is recorded.
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
      id, user_id, items, subtotal, total, discount_code, discount_amount, address, payment, status, created_at, updated_at
    ) values (
      v_intent.razorpay_order_id,
      v_intent.user_id,
      v_intent.items,
      v_intent.subtotal,
      round(p_amount_paise / 100.0, 2),
      v_intent.discount_code,
      coalesce(v_intent.discount_amount, 0),
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

-- Codes with how often each was used, for the admin Discounts tab.
create or replace function public.admin_discount_codes()
returns table (
  id bigint, code text, percent integer, active boolean, expires_at timestamptz,
  note text, created_at timestamptz, uses bigint, total_discount numeric
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
           count(r.id)::bigint, coalesce(sum(r.discount_amount), 0)
    from public.discount_codes c
    left join public.discount_redemptions r on r.code_id = c.id
    group by c.id
    order by c.created_at desc;
end;
$$;

revoke all on function public.admin_discount_codes() from public, anon;
grant execute on function public.admin_discount_codes() to authenticated;
