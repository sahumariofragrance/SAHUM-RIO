import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { pageName } from "./pageNames";

const REFRESH_MS = 15 * 1000;

// Pages where someone is close to buying.
const BUYING = new Set(["/cart", "/checkout"]);

/** Visitors on the shop right now, by page. Refreshes every 15 seconds. */
export default function LiveVisitorsPanel({ onOpenAnalytics }) {
  const { bySlug } = useProducts();
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_live_visitors");
    if (error) {
      const missing = error.code === "PGRST202" || /admin_live_visitors/.test(error.message || "");
      setStatus(missing ? "missing" : "error");
      return;
    }
    setRows(Array.isArray(data) ? data : []);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let timer = null;
    const start = () => {
      window.clearInterval(timer);
      if (document.visibilityState !== "visible") return;
      load();
      timer = window.setInterval(load, REFRESH_MS);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [load]);

  const total = (rows || []).reduce((sum, row) => sum + Number(row.visitors || 0), 0);
  const pages = (rows || []).map((row) => ({ path: row.path, name: pageName(row.path, bySlug), count: Number(row.visitors || 0) }));

  let headline;
  if (status === "missing") headline = "Live visitors isn’t switched on yet";
  else if (status === "error" && rows === null) headline = "Couldn’t load live visitors";
  else if (rows === null) headline = "Checking…";
  else if (total === 0) headline = "No one on the site right now";
  else headline = `${total} ${total === 1 ? "person" : "people"} on the site right now`;

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          {total > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${total > 0 ? "bg-green-500" : "bg-[var(--color-border)]"}`} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Live now</p>
          <p className="mt-1 font-serif text-2xl leading-tight" aria-live="polite">{headline}</p>
          {status === "missing" && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">Run the live-visitors SQL in Supabase to start counting.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:items-end">
        {pages.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Pages being viewed">
            {pages.map((page) => (
              <li
                key={page.path}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${BUYING.has(page.path) ? "admin-tone tone-amber border-transparent" : "border-[var(--color-border)]"}`}
                title={page.path}
              >
                {page.name}
                <span className="tabular-nums text-[var(--color-muted)]">{page.count}</span>
              </li>
            ))}
          </ul>
        )}
        {onOpenAnalytics && (
          <button
            type="button"
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline"
          >
            Daily visitors & top pages <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
