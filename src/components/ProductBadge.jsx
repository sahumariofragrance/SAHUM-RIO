import React from "react";
import { productBadge } from "../lib/catalogue";

/**
 * "Signature" or "New" on a perfume (Admin → Catalogue → Badge).
 * onImage: a pill over a photo, in fixed colours that read on any picture;
 * otherwise a small label in the page's own colours.
 */
export default function ProductBadge({ product, onImage = false, className = "" }) {
  const badge = productBadge(product);
  if (!badge) return null;
  const signature = badge.id === "signature";
  if (onImage) {
    return (
      <span className={`pointer-events-none rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] shadow-sm backdrop-blur-[2px] ${signature ? "bg-[#11212D]/85 text-[#E9D3A4]" : "bg-white/90 text-[#11212D]"} ${className}`}>
        {badge.label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${signature ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]" : "border-[var(--color-border)] text-[var(--color-text)]"} ${className}`}>
      {badge.label}
    </span>
  );
}
