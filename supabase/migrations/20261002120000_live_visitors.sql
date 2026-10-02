-- Live visitors for the admin dashboard ("Live now").
--
-- While a shop page is open and visible, the browser calls visitor_ping()
-- every 30 seconds with a random per-tab id and the page path, and
-- visitor_leave() when the tab is hidden or closed. Nothing else is stored:
-- no user id, IP address, location or device. Rows older than 10 minutes are
-- removed on every ping, so the table only ever holds the last few minutes.
--
-- Nobody can read or write the table directly; only these functions touch it,
-- and only an admin can read the counts (admin_live_visitors).

create unlogged table if not exists public.live_visitors (
  session_id uuid primary key,
  path text not null,
  last_seen timestamptz not null default now()
);

create index if not exists live_visitors_last_seen_idx
  on public.live_visitors (last_seen);

alter table public.live_visitors enable row level security;
revoke all on public.live_visitors from public, anon, authenticated;

create or replace function public.visitor_ping(p_session uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_session is null then
    return;
  end if;

  delete from public.live_visitors where last_seen < now() - interval '10 minutes';

  -- A flood of fake ids can never grow the table without limit.
  if not exists (select 1 from public.live_visitors where session_id = p_session)
     and (select count(*) from public.live_visitors) >= 5000 then
    return;
  end if;

  insert into public.live_visitors (session_id, path, last_seen)
  values (p_session, left(coalesce(nullif(p_path, ''), '/'), 200), now())
  on conflict (session_id) do update
    set path = excluded.path, last_seen = excluded.last_seen;
end;
$$;

create or replace function public.visitor_leave(p_session uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.live_visitors where session_id = p_session;
$$;

-- Visitors seen in the last 75 seconds, grouped by page.
create or replace function public.admin_live_visitors()
returns table (path text, visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  return query
    select v.path, count(*)::bigint
    from public.live_visitors v
    where v.last_seen > now() - interval '75 seconds'
    group by v.path
    order by count(*) desc, v.path;
end;
$$;

revoke all on function public.visitor_ping(uuid, text) from public;
revoke all on function public.visitor_leave(uuid) from public;
revoke all on function public.admin_live_visitors() from public, anon;
grant execute on function public.visitor_ping(uuid, text) to anon, authenticated;
grant execute on function public.visitor_leave(uuid) to anon, authenticated;
grant execute on function public.admin_live_visitors() to authenticated;
