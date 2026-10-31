import React from "react";
import { useProducts } from "../context/ProductsContext";
import { offerEnds, useOffer } from "../lib/offers";
import { formatINR } from "../utils/money";
import { forSale } from "../lib/catalogue";

/** Homepage card for the any-2 offer; shown while it is on in Admin → Discounts. */
export default function DiwaliOffer() {
  const { products } = useProducts();
  const offer = useOffer();
  // Pointless until at least two perfumes can be bought.
  const perfumes = forSale(products);
  if (!offer || perfumes.length < 2) return null;
  const lowest = perfumes.length ? Math.min(...perfumes.map((product) => Number(product.price) || Infinity)) : 0;
  const saving = Number.isFinite(lowest) && lowest > 0 ? lowest * 2 - offer.pairPrice : 0;

  return (
    <div className="promo-ticket-in mx-auto mt-8 w-full max-w-md">
      <div className="diwali-card relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left sm:px-6">
        <span className="diwali-sparks" aria-hidden="true" />
        <div className="shrink-0 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#e9c98f]">Any 2</p>
          <p className="mt-1 font-serif text-[2rem] leading-none">{formatINR(offer.pairPrice)}</p>
        </div>
        <div className="h-12 shrink-0 border-l border-dashed border-[#e9c98f]/50" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e9c98f]">{offer.label}</p>
          <p className="mt-1 text-sm leading-5">
            Mix any two{saving > 0 ? `, save ${formatINR(saving)}` : " perfumes"}.{offerEnds(offer) && ` ${offerEnds(offer)}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="shrink-0 rounded-full bg-[#e9c98f] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1d130c] transition hover:bg-[#f3dcae]"
        >
          Shop
        </button>
      </div>
    </div>
  );
}
