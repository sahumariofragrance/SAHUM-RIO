import React from "react";
import { Check, Gift } from "lucide-react";
import { useCart } from "../context/cartContext";
import { COMBO, comboActive, comboEndsLabel } from "../lib/offers";
import { formatINR } from "../utils/money";

/**
 * Diwali offer hint that follows the bag: what the offer is, "add 1 more"
 * when a bottle is waiting for a partner, or a tick once pairs are priced.
 * `action` is an optional { label, onClick }, shown while one more is needed.
 */
export default function ComboNudge({ action, className = "" }) {
  const { items } = useCart();
  if (!comboActive()) return null;
  const bottles = items.reduce((sum, item) => sum + item.qty, 0);
  const pairPrice = formatINR(COMBO.pairPrice);
  const waiting = bottles % 2 === 1;
  const applied = bottles >= 2 && !waiting;

  let text;
  if (bottles === 0) text = `${COMBO.label}: any 2 perfumes for ${pairPrice} · ends ${comboEndsLabel()}`;
  else if (bottles === 1) text = `Add 1 more perfume and get both for ${pairPrice}`;
  else if (waiting) text = `Add 1 more perfume and get the next 2 for ${pairPrice}`;
  else text = bottles === 2 ? `${COMBO.label} applied: 2 perfumes for ${pairPrice}` : `${COMBO.label} applied: ${pairPrice} for every 2 perfumes`;

  const Icon = applied ? Check : Gift;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-kesar)] ${className}`} role="status">
      <span className="inline-flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </span>
      {waiting && action && (
        <button type="button" onClick={action.onClick} className="font-semibold underline underline-offset-4 hover:opacity-75">
          {action.label}
        </button>
      )}
    </div>
  );
}
