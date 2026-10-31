import React from "react";
import { TESTER } from "../lib/catalogue";
import { testerUnits } from "../lib/testerShop";
import { formatINR } from "../utils/money";

/** The set price for Jhalak (10 ml testers) in the bag: any 5 for ₹549, taken off automatically. */
export default function TesterSetSaving({ saving, className = "" }) {
  if (!(saving > 0)) return null;
  return (
    <div className={`flex justify-between gap-3 text-sm ${className}`}>
      <span className="text-[var(--color-muted)]">Jhalak set price · any {TESTER.bundleSize} for {formatINR(TESTER.bundlePrice)}</span>
      <span className="shrink-0 font-medium text-green-600">- {formatINR(saving)}</span>
    </div>
  );
}

/** With 1–4 Jhalak in the bag: how many more make a set at the set price. */
export function TesterSetNudge({ items, className = "", onMore }) {
  const left = testerUnits(items) % TESTER.bundleSize;
  if (!left) return null;
  const more = TESTER.bundleSize - left;
  return (
    <p className={`rounded-xl border border-dashed border-[var(--color-kesar)] px-3 py-2 text-xs leading-5 ${className}`}>
      Add {more} more Jhalak: any {TESTER.bundleSize} are {formatINR(TESTER.bundlePrice)} together.{" "}
      {onMore && <button type="button" onClick={onMore} className="font-semibold underline underline-offset-4 hover:opacity-75">Choose Jhalak</button>}
    </p>
  );
}
