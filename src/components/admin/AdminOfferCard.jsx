import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminButton, Field, Notice, inputClass } from "./AdminUI";
import { formatINR } from "../../utils/money";

// "2026-11-10T18:29:59Z" → "2026-11-10" (the day in Indian time) for the date box.
function dayInIndia(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Admin → Discounts: the "any 2 perfumes for one price" offer. Switched on,
 * it shows on the homepage, top bar, bag and checkout, and the order total
 * prices every two perfumes at the offer price, until the end date if set.
 */
export default function AdminOfferCard() {
  const [form, setForm] = useState(null); // { enabled, name, price, ends }
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.rpc("admin_site_offer");
    if (loadError) {
      const missing = loadError.code === "PGRST202" || /admin_site_offer/.test(loadError.message || "");
      setStatus(missing ? "missing" : "error");
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) || {};
    setForm({ enabled: Boolean(row.enabled), name: row.name || "Festive offer", price: String(row.pair_price || 1299), ends: dayInIndia(row.ends_at) });
    setStatus("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(enabled) {
    setError(""); setMessage("");
    const name = form.name.trim();
    const price = Number(form.price);
    if (name.length < 2 || name.length > 40) { setError("Give the offer a name of 2–40 characters, e.g. Diwali offer."); return; }
    if (!Number.isInteger(price) || price < 100 || price > 100000) { setError("The price for 2 perfumes must be a whole number of rupees, e.g. 1299."); return; }
    if (enabled && form.ends && Date.parse(`${form.ends}T23:59:59+05:30`) <= Date.now()) { setError("That end date has passed. Choose a later day or clear it."); return; }
    setSaving(true);
    const { error: saveError } = await supabase.rpc("admin_save_site_offer", {
      p_enabled: enabled,
      p_name: name,
      p_pair_price: price,
      // The offer runs until the end of the chosen day, Indian time.
      p_ends_at: form.ends ? `${form.ends}T23:59:59+05:30` : null,
    });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setMessage(enabled
      ? `${name} is on: any 2 perfumes for ${formatINR(price)}${form.ends ? ` until ${new Date(`${form.ends}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}. It shows on the homepage for new visits.`
      : `${name} is off. It no longer shows on the website or applies to orders.`);
    load();
  }

  if (status === "missing") {
    return <Notice tone="amber">The any-2 offer isn’t set up yet. Run the site-offer SQL in Supabase (SQL Editor), then refresh.</Notice>;
  }
  if (status === "error") return <p className="text-sm text-[var(--color-muted)]">Couldn’t load the offer. Please refresh.</p>;
  if (!form) return null;

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 font-serif text-2xl"><Sparkles className="h-5 w-5 text-[var(--color-kesar)]" aria-hidden="true" />Any 2 for one price</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-muted)]">
            While it’s on, the homepage shows the offer card, the top bar and bag show it, and every 2 perfumes in an order cost the price below.
            A discount code is used instead only when it saves more.
          </p>
        </div>
        <span className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${form.enabled ? "bg-green-100 text-green-800" : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"}`}>{form.enabled ? "On" : "Off"}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Name" htmlFor="offer-name" hint="Shown to shoppers, e.g. Diwali offer.">
          <input id="offer-name" value={form.name} maxLength={40} onChange={set("name")} className={inputClass} />
        </Field>
        <Field label="Price for any 2 (₹)" htmlFor="offer-price">
          <input id="offer-price" type="number" min="100" step="1" value={form.price} onChange={set("price")} className={inputClass} />
        </Field>
        <Field label="Ends on (optional)" htmlFor="offer-ends" hint="Runs until the end of this day. Empty: until you switch it off.">
          <input id="offer-ends" type="date" value={form.ends} onChange={set("ends")} className={inputClass} />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {form.enabled ? (
          <>
            <AdminButton variant="primary" onClick={() => save(true)} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Save changes</AdminButton>
            <AdminButton variant="secondary" onClick={() => save(false)} disabled={saving}>Switch off</AdminButton>
          </>
        ) : (
          <AdminButton variant="primary" onClick={() => save(true)} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}Switch on</AdminButton>
        )}
      </div>
      {message && <div className="mt-4"><Notice tone="green">{message}</Notice></div>}
      {error && <div className="mt-4"><Notice tone="red">{error}</Notice></div>}
    </section>
  );
}
