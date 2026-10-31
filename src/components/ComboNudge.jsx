import React from "react";
import { Check, Gift } from "lucide-react";
import { useCart } from "../context/cartContext";
import { offerEnds, useOffer } from "../lib/offers";
import { formatINR } from "../utils/money";
import { bottlesOnly } from "../lib/samples";

/**
 * Any-2 offer hint that follows the bag: what the offer is, "add 1 more"
 * when a bottle is waiting for a partner, or a tick once pairs are priced.
 * `action` is an optional { label, onClick }, shown while one more is needed.
 */
export default function ComboNudge({ action, className = "" }) {
  const { items } = useCart();
  const offer = useOffer();
  if (!offer) return null;
  const bottles = bottlesOnly(items).reduce((sum, item) => sum + item.qty, 0);
  const pairPrice = formatINR(offer.pairPrice);
  const ends = offerEnds(offer).toLowerCase();
  const waiting = bottles % 2 === 1;
  const applied = bottles >= 2 && !waiting;

  let text;
  if (bottles === 0) text = `${offer.label}: any 2 perfumes for ${pairPrice}${ends ? ` · ${ends}` : ""}`;
  else if (bottles === 1) text = `Add 1 more perfume and get both for ${pairPrice}`;
  else if (waiting) text = `Add 1 more perfume and get the next 2 for ${pairPrice}`;
  else text = bottles === 2 ? `${offer.label} applied: 2 perfumes for ${pairPrice}` : `${offer.label} applied: ${pairPrice} for every 2 perfumes`;

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
