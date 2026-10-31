import React from "react";
import { Gift } from "lucide-react";
import { savedSpin, useSpinWheelOpen } from "../lib/spinWheel";

/**
 * Homepage hint that the spin wheel is waiting before checkout. Shown only
 * while the wheel is switched on and this visitor hasn't spun yet.
 */
export default function SurpriseHint() {
  const wheelOn = useSpinWheelOpen();
  if (!wheelOn || savedSpin()) return null;
  return (
    <p className="promo-ticket-in mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-center text-sm text-[var(--color-kesar)]">
      <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>A little surprise is waiting for you before checkout</span>
    </p>
  );
}
