import React from "react";
import { TESTER } from "../../lib/catalogue";
import { testerSetSaving, testerUnits } from "../../lib/testerShop";
import { formatINR } from "../../utils/money";

/** Bar at the bottom of the Jhalak page: how close the bag is to a set price. */
export default function TesterProgress({ items, onViewBag }) {
  const units = testerUnits(items);
  if (!units) return null;
  const saving = testerSetSaving(items);
  const inSet = units % TESTER.bundleSize;
  const more = inSet ? TESTER.bundleSize - inSet : 0;
  const filled = inSet || TESTER.bundleSize;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]" role="status">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 sm:px-4 md:px-8">
        <div className="min-w-0 flex-1">
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: TESTER.bundleSize }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-[var(--color-kesar)]" : "bg-[var(--color-border)]"}`} />)}
          </div>
          <p className="mt-1.5 truncate text-sm">
            <span className="font-semibold">{units} Jhalak</span>
            {more
              ? <span className="text-[var(--color-muted)]"> · add {more} more and {TESTER.bundleSize} are {formatINR(TESTER.bundlePrice)}</span>
              : null}
            {saving > 0 && <span className="text-green-600"> · set price applied, you save {formatINR(saving)}</span>}
          </p>
        </div>
        <button type="button" onClick={onViewBag} className="shrink-0 rounded-full bg-[var(--color-text)] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] hover:opacity-85">View bag</button>
      </div>
    </div>
  );
}
