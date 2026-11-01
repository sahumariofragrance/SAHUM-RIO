import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { relativeTime } from "./AdminUI";

const number = (value) => Number(value || 0).toLocaleString("en-IN");
const plural = (count, word) => `${number(count)} ${word}${Number(count) === 1 ? "" : "s"}`;

function Stat({ label, value, sub }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 font-serif text-3xl leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-[var(--color-muted)]">{sub}</p>}
    </div>
  );
}

/**
 * Admin → Analytics → Logins: customers who signed in during the period,
 * new accounts, and orders from accounts vs guests
 * (supabase/migrations/20261101190000_admin_logins.sql).
 */
export default function AdminLoginsCard({ days, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false;
    supabase.rpc("admin_logins", { p_days: days }).then(({ data: report, error }) => {
      if (cancelled) return;
      if (error) {
        setStatus(error.code === "PGRST202" || /admin_logins/.test(error.message || "") ? "missing" : "error");
        return;
      }
      setData(report);
      setStatus("ready");
    });
    return () => { cancelled = true; };
  }, [days, refreshKey]);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" aria-labelledby="admin-logins-title">
      <h3 id="admin-logins-title" className="text-sm font-semibold">Logins</h3>
      <p className="mt-0.5 text-xs text-[var(--color-muted)]">Customers who signed in (password or email code) in these {days} days · guest checkouts and your own account aren’t counted</p>

      {status === "missing" && <p className="mt-4 text-sm text-[var(--color-muted)]">Run the logins SQL in Supabase (SQL Editor) to see who logs in.</p>}
      {status === "error" && !data && <p className="mt-4 text-sm text-[var(--color-muted)]">Couldn’t load logins. Please refresh in a moment.</p>}
      {status === "loading" && !data && <p className="mt-4 text-sm text-[var(--color-muted)]">Loading…</p>}

      {data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
            <Stat
              label="Logged in"
              value={number(data.logged_in)}
              sub={`${number(data.returning)} returning · ${number(Number(data.logged_in) - Number(data.returning))} new`}
            />
            <Stat
              label="New accounts"
              value={number(data.new_accounts)}
              sub={Number(data.unfinished) > 0 ? `+ ${number(data.unfinished)} started but didn’t enter the email code` : "Sign-ups completed"}
            />
            <Stat label="All accounts" value={number(data.total_accounts)} sub="Since the shop opened" />
            <Stat
              label="Account orders"
              value={number(data.orders_account)}
              sub={`${plural(data.orders_guest, "order")} as guest`}
            />
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Latest logins</p>
            {data.recent?.length ? (
              <ul className="divide-y divide-[var(--color-border)]">
                {data.recent.map((person, index) => (
                  <li key={`${person.email}-${index}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.name || person.email || "Customer"}</p>
                      {person.name && person.email && <p className="truncate text-xs text-[var(--color-muted)]">{person.email}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                      {person.new && <span className="admin-tone tone-green rounded-full px-2 py-0.5 font-semibold">New account</span>}
                      <span className="text-[var(--color-muted)]">{Number(person.orders) > 0 ? plural(person.orders, "order") : "No orders yet"}</span>
                      <span className="tabular-nums text-[var(--color-muted)]">· {relativeTime(person.at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No customer has logged in during these {days} days.</p>
            )}
            {Number(data.logged_in) > (data.recent?.length || 0) && (
              <p className="mt-3 text-xs text-[var(--color-muted)]">Showing the latest {data.recent.length} of {number(data.logged_in)}.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
