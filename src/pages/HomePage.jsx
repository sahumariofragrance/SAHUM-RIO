import React, { useCallback, useMemo } from "react";
import { ArrowRight, CircleDot, Layers3, Sparkles } from "lucide-react";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts } = useProducts();

  const itemQtyById = useMemo(() => items.reduce((acc, item) => {
    acc[item.product_id] = item.qty;
    return acc;
  }, {}), [items]);

  const products = useMemo(() => catalogueProducts.map((product) => ({
    ...product,
    qty: itemQtyById[product.id] ?? 0,
  })), [catalogueProducts, itemQtyById]);

  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  return (
    <>
      <Hero
        onExplore={() => setCurrentPage?.("perfumes")}
        onProductNavigate={onProductNavigate}
        products={products}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid gap-8 border-b border-[var(--color-border)] pb-10 md:grid-cols-[1fr_1.35fr] md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">The collection</p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl font-semibold leading-[1.02] tracking-tight md:text-5xl">
              A fragrance wardrobe made to evolve.
            </h2>
          </div>
          <div className="md:justify-self-end">
            <p className="max-w-lg text-sm leading-7 text-[var(--color-muted)]">
              Explore one bottle at a time. Discover what fits today, then return as the collection grows.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <ProductGrid
            products={products}
            onSelectProduct={onProductNavigate}
            onAddToCart={handleAdd}
            onUpdateQty={handleQty}
          />
        </div>
      </section>

      <section className="overflow-hidden bg-[#24160f] text-[#fff8ed]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid gap-12 md:grid-cols-[1.25fr_0.75fr] md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-300">The SAHUMäRIO way</p>
              <h2 className="mt-5 max-w-4xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
                Less noise.
                <span className="block italic font-medium text-stone-300">More scent.</span>
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-stone-300 md:justify-self-end">
              Every fragrance gets its own space, its own name, and its own visual world. The collection can grow without losing that sense of focus.
            </p>
          </div>

          <div className="mt-14 grid border-y border-white/15 sm:grid-cols-3">
            {[
              [CircleDot, "A distinct identity", "Each fragrance is presented as its own character, not just another bottle in a list."],
              [Layers3, "A collection with room", "New perfumes can join the range while the overall experience stays considered and easy to explore."],
              [Sparkles, "Discovery first", "The homepage is built around browsing, comparing, and finding what feels right to you."],
            ].map(([Icon, title, copy], index) => (
              <div key={title} className={`py-7 sm:px-7 ${index > 0 ? "border-t border-white/15 sm:border-l sm:border-t-0" : ""}`}>
                <Icon className="h-5 w-5 text-amber-300" />
                <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-stone-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 md:px-12 md:py-16">
          <div className="pointer-events-none absolute -right-8 -top-12 font-serif text-[10rem] font-semibold leading-none text-[var(--color-surface-muted)] md:text-[15rem]">
            S
          </div>
          <div className="relative max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">Start somewhere</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl">
              Your next fragrance is one click away.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              Browse the full collection, compare the bottles, and choose without rushing the decision.
            </p>
            <button
              onClick={() => setCurrentPage?.("perfumes")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#24160f] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Explore all perfumes <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
