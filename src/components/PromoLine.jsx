import React, { useState } from "react";
import { Tag } from "lucide-react";
import { saveCode, usePromo } from "../lib/promo";

/** One quiet line under a product's price for the promoted code. */
export default function PromoLine() {
  const promo = usePromo();
  const [saved, setSaved] = useState(false);
  if (!promo) return null;
  return (
    <button
      type="button"
      onClick={async () => { await saveCode(promo.code); setSaved(true); }}
      className="mt-3 inline-flex items-center gap-2 text-left text-xs text-[var(--color-kesar)] underline-offset-4 hover:underline"
      title="Save code for checkout"
    >
      <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span aria-live="polite">
        {saved
          ? `Code ${promo.code} saved — we’ll apply it at checkout`
          : `${promo.percent}% off your first order with code ${promo.code}`}
      </span>
    </button>
  );
}
