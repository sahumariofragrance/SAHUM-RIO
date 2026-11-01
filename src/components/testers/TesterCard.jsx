import React from "react";
import SpaLink from "../SpaLink";
import ProductBadge from "../ProductBadge";
import { noteList } from "../../lib/scentQuiz";
import { formatINR } from "../../utils/money";

/** One Jhalak (10 ml tester): add it, or change how many are in the bag. */
export default function TesterCard({ tester, qty, onAdd, onQty, onOpenPerfume }) {
  const notes = noteList(tester.parent).slice(0, 3).join(", ");
  return (
    <article className="flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#ECEDEB]">
        <img src={tester.image} alt={tester.alt} loading="lazy" className="h-full w-full object-cover" />
        <ProductBadge product={tester.parent} onImage className="absolute left-2 top-2" />
        {qty > 0 && <span className="absolute right-2 top-2 rounded-full bg-[var(--color-text)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-bg)]">{qty} in bag</span>}
      </div>
      <h3 className="mt-3 font-serif text-xl leading-tight">{tester.shortName}</h3>
      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">{[tester.parent.fragrance_family, notes].filter(Boolean).join(" · ")}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm tabular-nums">{formatINR(tester.price)} <span className="text-xs text-[var(--color-muted)]">· {tester.size_volume}</span></span>
        <SpaLink href={`/product/${tester.parent.slug}`} onNavigate={() => onOpenPerfume?.(tester.parent)} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline">Full bottle</SpaLink>
      </div>
      <div className="mt-3">
        {qty === 0 ? (
          <button type="button" onClick={() => onAdd(tester)} className="flex h-10 w-full items-center justify-between rounded-full border border-[var(--color-text)] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]" aria-label={`Add ${tester.shortName} Jhalak`}>
            <span>Add Jhalak</span><span aria-hidden="true">+</span>
          </button>
        ) : (
          <div className="grid h-10 grid-cols-[2.5rem_1fr_2.5rem] rounded-full border border-[var(--color-border)]">
            <button type="button" onClick={() => onQty(tester.id, qty - 1)} className="text-lg" aria-label={`Fewer ${tester.shortName} Jhalak`}>−</button>
            <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em]">{qty} in bag</span>
            <button type="button" onClick={() => onQty(tester.id, qty + 1)} className="text-lg" aria-label={`More ${tester.shortName} Jhalak`}>+</button>
          </div>
        )}
      </div>
    </article>
  );
}
