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
  const editorialProduct = products.find((product) => product.slug === "blix") || products[products.length - 1] || products[0];

  return (
    <>
      <Hero
        onExplore={() => setCurrentPage?.("perfumes")}
        onProductNavigate={onProductNavigate}
        products={products}
      />

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">The collection</p>
            <h2 className="mt-3 font-serif text-5xl font-normal tracking-[-0.025em] md:text-6xl">Eau de Parfum</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">
            Explore the current SAHUMäRIO collection.
          </p>
        </div>

        <div className="mt-10 md:mt-14">
          <ProductGrid
            products={products}
            onSelectProduct={onProductNavigate}
            onAddToCart={handleAdd}
            onUpdateQty={handleQty}
          />
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => setCurrentPage?.("perfumes")}
            className="group inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            View the full collection
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {editorialProduct && (
        <section className="grid border-y border-[var(--color-border)] lg:grid-cols-2">
          <button
            type="button"
            onClick={() => onProductNavigate?.(editorialProduct)}
            className="group relative min-h-[520px] overflow-hidden bg-[var(--color-surface-muted)]"
            aria-label={"View " + editorialProduct.name}
          >
            <img
              src={editorialProduct.image}
              alt={editorialProduct.alt || editorialProduct.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.015]"
            />
          </button>

          <div className="flex min-h-[520px] items-center bg-[#171614] px-6 py-14 text-[#f7f3eb] sm:px-10 md:px-16 lg:px-[7vw]">
            <div className="max-w-xl">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">The house</p>
              <h2 className="mt-7 font-serif text-[clamp(3.4rem,5.7vw,6.5rem)] font-normal leading-[0.9] tracking-[-0.035em]">
                Space for the
                <span className="block italic">fragrance itself.</span>
              </h2>
              <p className="mt-8 max-w-md text-sm leading-7 text-white/60">
                We keep the presentation quiet so each perfume can be discovered on its own terms.
              </p>
              <button
                onClick={() => setCurrentPage?.("about")}
                className="group mt-8 inline-flex items-center gap-3 border-b border-white/65 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                About SAHUMäRIO
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 md:px-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Complimentary delivery", "Free shipping on website orders across India."],
            ["Delivery", "Orders are typically delivered in 3–7 business days."],
            ["Secure payment", "Payments are processed through Razorpay."],
          ].map(([title, copy]) => (
            <div key={title} className="border-t border-[var(--color-border)] pt-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em]">{title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-20 sm:px-8 md:grid-cols-[1fr_auto] md:items-end md:px-12 md:py-24">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Gifting</p>
            <h2 className="mt-4 max-w-3xl font-serif text-5xl font-normal leading-[0.95] tracking-[-0.03em] md:text-6xl">
              Bulk orders & corporate gifting
            </h2>
          </div>
          <button
            onClick={() => setCurrentPage?.("bulk-orders")}
            className="group inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            Enquire
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </>
  );
}
