import React, { useEffect, useState } from "react";
import { saveCode, usePromo } from "../lib/promo";

const DELIVERY = "Complimentary delivery across India";

/** Top bar: free delivery, alternating with the promoted discount code. */
export default function AnnouncementBar() {
  const promo = usePromo();
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!promo) return undefined;
    // Without motion, keep the offer showing instead of switching.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setIndex(1);
      return undefined;
    }
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % 2), 4500);
    return () => window.clearInterval(timer);
  }, [promo]);

  async function save() {
    await saveCode(promo.code);
    setSaved(true);
    setIndex(1);
    window.setTimeout(() => setSaved(false), 3500);
  }

  const base = "absolute inset-0 flex items-center justify-center px-4 transition-opacity duration-700";
  return (
    <div className="relative h-8 overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg)] text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
      <p className={`${base} ${index === 0 || !promo ? "opacity-100" : "opacity-0"}`} aria-hidden={Boolean(promo) && index !== 0}>{DELIVERY}</p>
      {promo && (
        <button
          type="button"
          onClick={save}
          className={`${base} w-full text-[var(--color-kesar)] ${index === 1 ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== 1}
          tabIndex={index === 1 ? 0 : -1}
          title="Save code for checkout"
        >
          {saved ? `Code ${promo.code} saved — applied at checkout` : `${promo.percent}% off your first order · code ${promo.code}`}
        </button>
      )}
    </div>
  );
}
