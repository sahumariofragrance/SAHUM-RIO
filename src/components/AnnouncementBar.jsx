import React, { useEffect, useState } from "react";
import { saveCode, usePromo } from "../lib/promo";
import { COMBO, comboActive } from "../lib/offers";
import { formatINR } from "../utils/money";

const DELIVERY = "Complimentary delivery across India";

/** Top bar: free delivery, taking turns with the Diwali offer and the promoted code. */
export default function AnnouncementBar() {
  const promo = usePromo();
  const combo = comboActive();
  const slides = ["delivery", ...(combo ? ["combo"] : []), ...(promo ? ["promo"] : [])];
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2) return undefined;
    // Without motion, keep the first offer showing instead of switching.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setIndex(1);
      return undefined;
    }
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 4500);
    return () => window.clearInterval(timer);
  }, [count]);

  async function save() {
    await saveCode(promo.code);
    setSaved(true);
    setIndex(slides.indexOf("promo"));
    window.setTimeout(() => setSaved(false), 3500);
  }

  const active = slides[index % count];
  const base = "absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-700";
  const shown = (slide) => (active === slide ? "opacity-100" : "pointer-events-none opacity-0");
  return (
    <div className="relative h-8 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg)] text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
      <p className={`${base} ${shown("delivery")}`} aria-hidden={active !== "delivery"}>{DELIVERY}</p>
      {combo && (
        <p className={`${base} text-[var(--color-kesar)] ${shown("combo")}`} aria-hidden={active !== "combo"}>
          {COMBO.label} · any 2 perfumes for {formatINR(COMBO.pairPrice)}
        </p>
      )}
      {promo && (
        <button
          type="button"
          onClick={save}
          className={`${base} w-full text-[var(--color-kesar)] ${shown("promo")}`}
          aria-hidden={active !== "promo"}
          tabIndex={active === "promo" ? 0 : -1}
          title="Save code for checkout"
        >
          {saved ? `Code ${promo.code} saved — applied at checkout` : `${promo.percent}% off your first order · code ${promo.code}`}
        </button>
      )}
    </div>
  );
}
