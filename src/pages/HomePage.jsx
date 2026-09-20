import React, { useCallback, useMemo } from "react";
import { ArrowRight } from "lucide-react";
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
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 px-6 py-8 md:px-10 md:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-20 font-serif text-[13rem] font-semibold leading-none text-white/[0.035] md:text-[22rem]"
            >
              S
            </div>

            <div className="relative grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
              <div className="flex min-h-[430px] flex-col justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-300">
                    A note from SAHUMäRIO
                  </p>
                  <h2 className="mt-6 max-w-3xl font-serif text-[clamp(3.4rem,7vw,7rem)] font-semibold leading-[0.84] tracking-[-0.045em]">
                    Scent,
                    <span className="block italic font-medium text-stone-300">before</span>
                    <span className="block">words.</span>
                  </h2>
                </div>

                <p className="mt-10 max-w-lg text-sm leading-7 text-stone-300 md:text-base">
                  No complicated fragrance language. Start with the bottle that catches you, wear it your way, and let the feeling decide what comes next.
                </p>
              </div>

              <div className="flex flex-col justify-between rounded-[1.6rem] border border-white/15 bg-white/[0.04] p-6 md:p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-stone-400">
                    Follow your instinct
                  </p>

                  <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
                    {[
                      ["01", "Notice", "What pulls you in."],
                      ["02", "Wear", "Give it your day."],
                      ["03", "Keep", "Return to the one you miss."],
                    ].map(([number, title, copy]) => (
                      <div key={number} className="grid grid-cols-[3rem_1fr] gap-4 py-5">
                        <span className="pt-1 text-[10px] font-semibold tracking-[0.2em] text-amber-300">{number}</span>
                        <div>
                          <h3 className="font-serif text-2xl font-semibold">{title}</h3>
                          <p className="mt-1 text-sm text-stone-400">{copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentPage?.("perfumes")}
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white hover:text-[#24160f]"
                >
                  Find your fragrance <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-6">
              <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                Current edit
              </span>
              {products.slice(0, 5).map((product, index) => (
                <React.Fragment key={product.id}>
                  {index > 0 && <span className="text-stone-600" aria-hidden="true">•</span>}
                  <button
                    type="button"
                    onClick={() => onProductNavigate?.(product)}
                    className="font-serif text-sm font-semibold text-stone-300 transition hover:text-amber-300"
                  >
                    {product.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
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
