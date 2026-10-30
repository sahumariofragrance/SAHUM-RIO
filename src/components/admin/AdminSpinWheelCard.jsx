import React, { useCallback, useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Notice } from "./AdminUI";
import { formatINR } from "../../utils/money";
import { WHEEL, wheelPrizes } from "../../lib/spinWheel";

/** Admin → Discounts: the spin wheel before checkout, on or off, and what it has given away. */
export default function AdminSpinWheelCard() {
  const [wheel, setWheel] = useState(null); // { enabled, spins, used, discount_given, testers_given }
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.rpc("admin_spin_wheel");
    if (loadError) {
      const missing = loadError.code === "PGRST202" || /admin_spin_wheel/.test(loadError.message || "");
      setStatus(missing ? "missing" : "error");
      return;
    }
    setWheel(Array.isArray(data) ? data[0] : data);
    setStatus("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle() {
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase.rpc("admin_set_spin_wheel", { p_enabled: !wheel.enabled });
    setSaving(false);
    if (saveError) setError(saveError.message);
    else load();
  }

  if (status === "missing") {
    return <Notice tone="amber">The spin wheel isn’t switched on yet. Run the spin-wheel SQL in Supabase (SQL Editor), then refresh.</Notice>;
  }
  if (status === "error") return <p className="text-sm text-[var(--color-muted)]">Couldn’t load the spin wheel. Please refresh.</p>;
  if (!wheel) return null;

  const stats = [
    ["Spins", Number(wheel.spins)],
    ["Prizes used", Number(wheel.used)],
    ["Discount given", formatINR(wheel.discount_given || 0)],
    ["Testers given", Number(wheel.testers_given)],
  ];

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="inline-flex items-center gap-2 font-serif text-2xl"><Gift className="h-5 w-5 text-[var(--color-kesar)]" aria-hidden="true" />Spin wheel</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--color-muted)]">
            Opens once at checkout when there’s a perfume in the bag: {wheelPrizes()}, each slice as likely.
            One prize per customer (email or phone number), for one order within {WHEEL.validDays} days. Testers they choose show on the order to pack.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(wheel.enabled)}
          aria-label={`Spin wheel ${wheel.enabled ? "on" : "off"}`}
          onClick={toggle}
          disabled={saving}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${wheel.enabled ? "bg-[var(--color-text)]" : "bg-[var(--color-border)]"}`}
        >
          {saving
            ? <Loader2 className="absolute left-3.5 top-1 h-4 w-4 animate-spin text-[var(--color-bg)]" />
            : <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-bg)] shadow transition ${wheel.enabled ? "left-[1.375rem]" : "left-0.5"}`} />}
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--color-surface-muted)] px-3 py-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{label}</dt>
            <dd className="mt-0.5 font-serif text-2xl tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {error && <div className="mt-4"><Notice tone="red">{error}</Notice></div>}
    </section>
  );
}
