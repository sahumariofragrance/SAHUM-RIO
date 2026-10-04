import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { saveCode, usePromo } from "../lib/promo";

/** Homepage gift-ticket for the promoted code; hidden when none is promoted. */
export default function PromoTicket() {
  const promo = usePromo();
  const [saved, setSaved] = useState(false);
  if (!promo) return null;

  async function save() {
    await saveCode(promo.code);
    setSaved(true);
  }

  return (
    <div className="promo-ticket-in mx-auto mt-8 w-full max-w-md">
      <div className="promo-ticket relative flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] px-5 py-4 text-left sm:px-6">
        <div className="shrink-0 text-center">
          <p className="font-serif text-[2.4rem] leading-none text-[var(--color-kesar)]">{promo.percent}%</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">off</p>
        </div>
        <div className="promo-ticket-divider h-12 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">First order</p>
          <p className="mt-1 text-sm">
            Use code <span className="font-mono font-semibold tracking-wider">{promo.code}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${saved ? "bg-[var(--color-kesar)] text-white" : "border border-[var(--color-text)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]"}`}
          aria-label={saved ? `${promo.code} saved` : `Save code ${promo.code}`}
        >
          {saved ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--color-muted)]" aria-live="polite">
        {saved ? "Saved — we’ll apply it at checkout." : "One use per customer."}
      </p>
    </div>
  );
}
