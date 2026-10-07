import React from "react";
import { useProducts } from "../context/ProductsContext";
import { COMBO, comboActive, comboEndsLabel } from "../lib/offers";
import { formatINR } from "../utils/money";

/** Homepage card for the Diwali offer; hidden once the offer has ended. */
export default function DiwaliOffer() {
  const { products } = useProducts();
  if (!comboActive()) return null;
  const lowest = products.length ? Math.min(...products.map((product) => Number(product.price) || Infinity)) : 0;
  const saving = Number.isFinite(lowest) && lowest > 0 ? lowest * 2 - COMBO.pairPrice : 0;

  return (
    <div className="promo-ticket-in mx-auto mt-8 w-full max-w-md">
      <div className="diwali-card relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left sm:px-6">
        <span className="diwali-sparks" aria-hidden="true" />
        <div className="shrink-0 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#e9c98f]">Any 2</p>
          <p className="mt-1 font-serif text-[2rem] leading-none">{formatINR(COMBO.pairPrice)}</p>
        </div>
        <div className="h-12 shrink-0 border-l border-dashed border-[#e9c98f]/50" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e9c98f]">{COMBO.short || COMBO.label}</p>
          <p className="mt-1 text-sm leading-5">
            Mix any two{saving > 0 ? `, save ${formatINR(saving)}` : " perfumes"}. Ends {comboEndsLabel()}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="shrink-0 rounded-full bg-[#e9c98f] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5E1823] transition hover:bg-[#f3dcae]"
        >
          Shop
        </button>
      </div>
    </div>
  );
}
