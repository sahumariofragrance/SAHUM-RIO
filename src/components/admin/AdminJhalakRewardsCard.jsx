import React, { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { TESTER } from "../../lib/catalogue";
import { formatINR } from "../../utils/money";

/**
 * Admin → Discounts: the Jhalak set thank-you codes, emailed after each paid
 * order with a Jhalak set (api/_lib/jhalakReward.js). Hidden until the
 * database update has run.
 */
export default function AdminJhalakRewardsCard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let active = true;
    supabase.rpc("admin_jhalak_rewards").then(({ data, error }) => {
      if (!active || error) return;
      const row = Array.isArray(data) ? data[0] : data;
      setStats(row || { sent: 0, used: 0, discount_given: 0 });
    });
    return () => { active = false; };
  }, []);
  if (!stats || !TESTER.setReward) return null;
  const tiles = [
    ["Codes sent", Number(stats.sent)],
    ["Used", Number(stats.used)],
    ["Discount given", formatINR(Number(stats.discount_given) || 0)],
  ];
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="flex items-center gap-2 font-serif text-2xl"><Gift className="h-5 w-5" aria-hidden="true" />Jhalak thank-you codes</h3>
      <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--color-muted)]">
        Every paid order with a Jhalak set (one of ours or any {TESTER.bundleSize} the customer picks) gets a personal code by email:
        {" "}{TESTER.setReward.percent}% off 50 ml perfumes, one use, valid {TESTER.setReward.validDays} days. These codes don’t appear in your list below.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
            <p className="mt-1 font-serif text-2xl tabular-nums">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
