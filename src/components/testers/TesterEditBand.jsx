import React, { useCallback, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import SpaLink from "../SpaLink";
import TesterSetCard from "./TesterSetCard";
import { useCart } from "../../context/cartContext";
import { useProducts } from "../../context/ProductsContext";
import { TESTER } from "../../lib/catalogue";
import { SET_SAVING, testerSetsForSale } from "../../lib/testerShop";
import { formatINR } from "../../utils/money";

/** Homepage band: the tester edit, with the introductory set ready to add. */
export default function TesterEditBand({ onOpen }) {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const intro = useMemo(() => testerSetsForSale(products)[0] || null, [products]);
  const addSet = useCallback((set) => set.testers.forEach((tester) => addToCart(tester)), [addToCart]);
  if (!intro) return null;
  return (
    <section aria-labelledby="tester-edit-title" className="mb-24 grid items-center gap-10 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 sm:p-10 md:mb-32 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:p-14">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-kesar)]">The Tester Edit · {TESTER.ml} ml</p>
        <h2 id="tester-edit-title" className="mt-4 font-serif text-[clamp(2rem,4vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em]">Not sure yet?<br />Begin with a few drops.</h2>
        <p className="mt-5 max-w-md text-sm leading-7 text-[var(--color-muted)]">
          Every perfume in a {TESTER.ml} ml spray. Live with it for a few days, then choose your bottle.
        </p>
        <p className="mt-5 text-sm">
          <strong className="font-semibold">{formatINR(TESTER.price)}</strong> each <span className="mx-2 text-[var(--color-muted)]">·</span>
          <strong className="font-semibold">any {TESTER.bundleSize} for {formatINR(TESTER.bundlePrice)}</strong> <span className="text-[var(--color-muted)]">(save {formatINR(SET_SAVING)}, applied automatically)</span>
        </p>
        <SpaLink href="/testers" onNavigate={onOpen} className="group mt-8 inline-flex items-center gap-3 border-b border-current pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition-opacity hover:opacity-70">
          Explore the tester edit <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </SpaLink>
      </div>
      <TesterSetCard set={intro} onAdd={addSet} compact />
    </section>
  );
}
