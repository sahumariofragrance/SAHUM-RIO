import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import SetBottles from "./SetBottles";
import { TESTER } from "../../lib/catalogue";
import { formatINR } from "../../utils/money";

/** A curated Jhalak set: five perfumes, one set price. */
export default function TesterSetCard({ set, onAdd, compact = false }) {
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return undefined; const t = setTimeout(() => setAdded(false), 2500); return () => clearTimeout(t); }, [added]);
  const full = TESTER.price * set.testers.length;
  return (
    <article className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {set.photo
        ? <img src={set.photo} alt={`${set.name}: ${set.testers.map((tester) => tester.shortName).join(", ")} Jhalak`} loading="lazy" className="aspect-[3/2] w-full rounded-xl object-cover" />
        : <SetBottles testers={set.testers} className="aspect-[3/2]" />}
      <div className="flex flex-1 flex-col px-1 pt-5">
        <h3 className="font-serif text-2xl leading-tight">{set.name}</h3>
        <p className="mt-1 font-serif text-base italic text-[var(--color-muted)]">{set.tagline}</p>
        <p className="mt-3 text-[10px] font-semibold uppercase leading-5 tracking-[0.14em]">{set.testers.map((tester) => tester.shortName).join(" · ")}</p>
        {!compact && <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{set.description}</p>}
        <div className="mt-auto pt-5">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-serif text-2xl">{formatINR(TESTER.bundlePrice)}</span>
            <span className="text-sm text-[var(--color-muted)] line-through">{formatINR(full)}</span>
            <span className="text-xs font-semibold text-green-600">Save {formatINR(full - TESTER.bundlePrice)}</span>
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{set.testers.length} Jhalak × {TESTER.ml} ml</p>
          <button
            type="button"
            onClick={() => { onAdd(set); setAdded(true); }}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-text)] text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85"
          >
            {added ? <><Check className="h-4 w-4" aria-hidden="true" />Added to bag</> : <>Add the set</>}
          </button>
        </div>
      </div>
    </article>
  );
}
