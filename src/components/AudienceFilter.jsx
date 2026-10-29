import React from "react";
import { AUDIENCES } from "../lib/catalogue";

/**
 * "All · For him · For her · Unisex" above the collection. Shown only when
 * the perfumes have "For" set in Admin → Catalogue.
 */
export default function AudienceFilter({ products, value, onChange, className = "" }) {
  const counts = AUDIENCES.map((audience) => ({ ...audience, count: products.filter((product) => product.audience === audience.id).length }));
  if (!counts.some((audience) => audience.count > 0)) return null;
  const options = [{ id: "all", label: "All", count: products.length }, ...counts.filter((audience) => audience.count > 0)];

  return (
    <div className={`scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0 ${className}`} role="group" aria-label="Show perfumes for">
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${selected ? "border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]" : "border-[var(--color-border)] hover:border-[var(--color-text)]"}`}
          >
            {option.label} <span className={selected ? "opacity-70" : "text-[var(--color-muted)]"}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
