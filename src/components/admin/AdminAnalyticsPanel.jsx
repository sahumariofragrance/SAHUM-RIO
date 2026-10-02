import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import { AdminButton, StatTile } from "./AdminUI";
import { pageName } from "./pageNames";

const RANGES = [7, 30, 90];

const SOURCE_NAMES = {
  direct: "Direct (typed or saved link)",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  google: "Google",
  bing: "Bing",
  youtube: "YouTube",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  email: "Email",
};

const DEVICE_NAMES = { mobile: "Phone", desktop: "Computer", tablet: "Tablet", unknown: "Unknown" };

const INDIAN_STATES = {
  AN: "Andaman & Nicobar", AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CH: "Chandigarh",
  CT: "Chhattisgarh", CG: "Chhattisgarh", DH: "Dadra & Nagar Haveli and Daman & Diu", DN: "Dadra & Nagar Haveli", DD: "Daman & Diu",
  DL: "Delhi", GA: "Goa", GJ: "Gujarat", HR: "Haryana", HP: "Himachal Pradesh", JK: "Jammu & Kashmir", JH: "Jharkhand",
  KA: "Karnataka", KL: "Kerala", LA: "Ladakh", LD: "Lakshadweep", MP: "Madhya Pradesh", MH: "Maharashtra", MN: "Manipur",
  ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", OR: "Odisha", OD: "Odisha", PY: "Puducherry", PB: "Punjab", RJ: "Rajasthan",
  SK: "Sikkim", TN: "Tamil Nadu", TG: "Telangana", TS: "Telangana", TR: "Tripura", UP: "Uttar Pradesh", UT: "Uttarakhand",
  UK: "Uttarakhand", WB: "West Bengal",
};

let countryNames = null;
function countryName(code) {
  try {
    countryNames = countryNames || new Intl.DisplayNames(["en-IN"], { type: "region" });
    return countryNames.of(code) || code;
  } catch {
    return code;
  }
}

function placeName({ country, region, city }) {
  if (!country) return "Unknown";
  const area = country === "IN" ? INDIAN_STATES[region] || region : countryName(country);
  return [city, area].filter(Boolean).join(", ") || countryName(country);
}

const number = (value) => Number(value || 0).toLocaleString("en-IN");
const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 1000) / 10}%` : "—");
const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const longDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// 1, 2, 5 × 10ⁿ: a clean top for the axis.
function niceCeil(value) {
  if (value <= 1) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value);
  return step * power;
}

function Card({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${className}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DailyChart({ daily }) {
  const [active, setActive] = useState(null);
  const max = niceCeil(Math.max(0, ...daily.map((d) => d.visitors)));
  const ticks = max >= 2 ? [max, max / 2, 0] : [max, 0];
  const point = active === null ? null : daily[active];
  const middle = Math.floor((daily.length - 1) / 2);

  return (
    <div>
      <div className="relative flex h-48 gap-3">
        <div className="flex w-8 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums leading-none text-[var(--color-muted)]" aria-hidden="true">
          {ticks.map((tick) => <span key={tick}>{number(tick)}</span>)}
        </div>
        <div className="relative flex-1" onMouseLeave={() => setActive(null)}>
          {ticks.map((tick) => (
            <div key={tick} className="absolute inset-x-0 h-px bg-[var(--color-border)]" style={{ bottom: `${(tick / max) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" aria-hidden="true">
            {daily.map((d, index) => (
              <div
                key={d.day}
                data-day={d.day}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setActive(index)}
                onClick={() => setActive(index)}
              >
                {d.visitors > 0 && (
                  <div
                    className={`w-full max-w-[24px] rounded-t-[4px] bg-[var(--color-chart)] transition-opacity ${active !== null && active !== index ? "opacity-40" : ""}`}
                    style={{ height: `${(d.visitors / max) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          {point && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-lg"
              style={{ left: `${Math.min(88, Math.max(12, ((active + 0.5) / daily.length) * 100))}%` }}
            >
              <p className="font-semibold">{longDate(point.day)}</p>
              <p className="mt-0.5 text-[var(--color-muted)]">
                <span className="tabular-nums text-[var(--color-text)]">{number(point.visitors)}</span> visitor{point.visitors === 1 ? "" : "s"} ·{" "}
                <span className="tabular-nums text-[var(--color-text)]">{number(point.pageviews)}</span> page view{point.pageviews === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-11 mt-2 flex justify-between text-[11px] text-[var(--color-muted)]" aria-hidden="true">
        <span>{shortDate(daily[0].day)}</span>
        {daily.length > 2 && <span>{shortDate(daily[middle].day)}</span>}
        <span>{shortDate(daily[daily.length - 1].day)}</span>
      </div>
      <table className="sr-only">
        <caption>Visitors and page views per day</caption>
        <thead><tr><th>Day</th><th>Visitors</th><th>Page views</th></tr></thead>
        <tbody>{daily.map((d) => <tr key={d.day}><td>{longDate(d.day)}</td><td>{d.visitors}</td><td>{d.pageviews}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function BarList({ rows, empty = "Nothing yet" }) {
  if (!rows.length) return <p className="text-sm text-[var(--color-muted)]">{empty}</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate" title={row.title || row.label}>{row.label}</span>
            <span className="shrink-0 tabular-nums">
              {number(row.value)}
              {row.sub && <span className="ml-2 text-xs text-[var(--color-muted)]">{row.sub}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[var(--color-surface-muted)]">
            <div className="h-full rounded-full bg-[var(--color-chart)]" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ funnel }) {
  const steps = [
    ["Visits", funnel.visits],
    ["Viewed a perfume", funnel.viewed_product],
    ["Added to bag", funnel.added_to_bag],
    ["Reached checkout", funnel.reached_checkout],
    ["Paid", funnel.paid],
  ];
  const top = Math.max(steps[0][1], 1);
  return (
    <ol className="space-y-3">
      {steps.map(([label, value], index) => (
        <li key={label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>{label}</span>
            <span className="tabular-nums">
              {number(value)}
              {index > 0 && <span className="ml-2 text-xs text-[var(--color-muted)]">{percent(value, steps[0][1])}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-[4px] bg-[var(--color-surface-muted)]">
            <div className="h-full rounded-[4px] bg-[var(--color-chart)]" style={{ width: value ? `${Math.max(1.5, (value / top) * 100)}%` : 0 }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The admin Analytics tab: our own visitor and shop statistics. */
export default function AdminAnalyticsPanel() {
  const { bySlug } = useProducts();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: report, error } = await supabase.rpc("admin_analytics", { p_days: days });
    setLoading(false);
    if (error) {
      const missing = error.code === "PGRST202" || /admin_analytics/.test(error.message || "");
      setStatus(missing ? "missing" : "error");
      return;
    }
    setData(report);
    setStatus("ready");
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals || {};
  const hasData = Number(totals.pageviews) > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl">Analytics</h2>
          {data && (
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {shortDate(data.from)} – {shortDate(data.to)} · Indian time · your own visits aren’t counted
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-[var(--color-border)] p-1" role="group" aria-label="Date range">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                aria-pressed={days === range}
                className={`h-8 rounded-full px-3.5 text-sm font-medium transition ${days === range ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
              >
                {range} days
              </button>
            ))}
          </div>
          <AdminButton variant="secondary" onClick={load} disabled={loading} aria-label="Refresh analytics">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </AdminButton>
        </div>
      </div>

      {status === "missing" && (
        <Card title="Analytics isn’t switched on yet">
          <p className="text-sm text-[var(--color-muted)]">Run the site-analytics SQL in Supabase (SQL Editor) to start collecting visits.</p>
        </Card>
      )}
      {status === "error" && !data && (
        <Card title="Couldn’t load analytics">
          <p className="text-sm text-[var(--color-muted)]">Please refresh in a moment.</p>
        </Card>
      )}
      {status === "loading" && !data && <p className="text-sm text-[var(--color-muted)]">Loading…</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Visitors" value={number(totals.visitors)} sub="Unique per day, added up" />
            <StatTile label="Page views" value={number(totals.pageviews)} sub={`${number(totals.visits)} visit${Number(totals.visits) === 1 ? "" : "s"}`} />
            <StatTile label="Paid orders" value={number(totals.orders)} sub="Placed on the site" />
            <StatTile label="Conversion" value={percent(data.funnel.paid, data.funnel.visits)} sub="Visits that ended in payment" />
          </div>

          {!hasData && (
            <Card title="No visits recorded yet">
              <p className="text-sm text-[var(--color-muted)]">Visits are counted from the moment analytics went live. Check back after some visitors have browsed the shop.</p>
            </Card>
          )}

          <Card title="Visitors per day" subtitle="Hover or tap a day for its numbers">
            <DailyChart daily={data.daily} />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Shopping journey" subtitle="Visits that reached each step">
              <Funnel funnel={data.funnel} />
            </Card>
            <Card title="Top perfumes" subtitle="Page views · added to bag">
              <BarList
                rows={data.products.map((p) => ({ key: p.product, label: bySlug.get(p.product)?.name || p.product, value: p.views, sub: `${number(p.added)} added` }))}
                empty="No perfume views yet"
              />
            </Card>
            <Card title="Where visitors come from" subtitle="Visits by source">
              <BarList rows={data.sources.map((s) => ({ key: s.source, label: SOURCE_NAMES[s.source] || s.source, value: s.visits }))} />
              {data.campaigns.length > 0 && (
                <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Campaign links</p>
                  <BarList rows={data.campaigns.map((c) => ({ key: c.campaign, label: c.campaign, value: c.visits }))} />
                </div>
              )}
            </Card>
            <Card title="Where they are" subtitle="Visitors by city (approximate)">
              <BarList rows={data.places.map((p) => ({ key: `${p.country}-${p.region}-${p.city}`, label: placeName(p), value: p.visitors }))} />
            </Card>
            <Card title="Devices" subtitle="Visitors">
              <BarList rows={data.devices.map((d) => ({ key: d.device, label: DEVICE_NAMES[d.device] || d.device, value: d.visitors }))} />
            </Card>
            <Card title="Other pages" subtitle="Page views">
              <BarList rows={data.pages.map((p) => ({ key: p.path, label: pageName(p.path, bySlug), title: p.path, value: p.views }))} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
