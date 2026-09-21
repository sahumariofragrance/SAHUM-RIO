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
  const editorialProduct = products[3] || products[0];

  return (
    <>
      <Hero
        onExplore={() => setCurrentPage?.("perfumes")}
        onProductNavigate={onProductNavigate}
        products={products}
      />

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">The collection</p>
          <h2 className="mt-5 font-serif text-5xl font-normal leading-[0.95] tracking-[-0.03em] md:text-7xl">
            Six fragrances.
            <span className="block italic">Six different moods.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
            Discover the current SAHUMäRIO collection through the fragrance that feels closest to you.
          </p>
        </div>

        <div className="mt-14 md:mt-20">
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
            className="group inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            View all perfumes
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {editorialProduct && (
        <section className="grid min-h-[720px] lg:grid-cols-2">
          <button
            type="button"
            onClick={() => onProductNavigate?.(editorialProduct)}
            className="group relative min-h-[540px] overflow-hidden bg-[var(--color-surface-muted)]"
            aria-label={"View " + editorialProduct.name}
          >
            <img
              src={editorialProduct.image}
              alt={editorialProduct.alt || editorialProduct.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-[1.018]"
            />
          </button>

          <div className="flex min-h-[540px] flex-col justify-between bg-[#171614] px-6 py-12 text-[#f6f2ea] sm:px-10 md:px-16 md:py-16 lg:px-[7vw] lg:py-20">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">The SAHUMäRIO perspective</p>
              <h2 className="mt-10 max-w-[9ch] font-serif text-[clamp(3.5rem,6vw,6.8rem)] font-normal leading-[0.88] tracking-[-0.04em]">
                Scent is
                <span className="block italic">personal.</span>
              </h2>
            </div>

            <div className="max-w-lg">
              <p className="text-base leading-8 text-white/68">
                We prefer a quieter way to present fragrance: fewer distractions, clear details, and enough space for every perfume to have its own identity.
              </p>
              <button
                onClick={() => setCurrentPage?.("about")}
                className="group mt-8 inline-flex items-center gap-3 border-b border-white/70 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Our story
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-[var(--color-border)] border-t border-[var(--color-border)]">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-[var(--color-border)] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-12">
          {[
            ["01", "Complimentary delivery", "Free shipping on website orders across India."],
            ["02", "Delivery window", "Orders are typically delivered in 3–7 business days."],
            ["03", "Secure checkout", "Payments are processed through Razorpay."],
          ].map(([number, title, copy]) => (
            <div key={title} className="py-9 md:px-8 md:py-12 md:first:pl-0 md:last:pr-0">
              <p className="text-[9px] font-semibold tracking-[0.18em] text-[var(--color-muted)]">{number}</p>
              <h3 className="mt-5 font-serif text-2xl font-normal">{title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:px-12 md:py-32">
        <div className="grid gap-12 border-t border-[var(--color-border)] pt-10 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Gifting & larger orders</p>
            <h2 className="mt-5 max-w-4xl font-serif text-5xl font-normal leading-[0.95] tracking-[-0.035em] md:text-7xl">
              Fragrance for
              <span className="block italic">a shared moment.</span>
            </h2>
          </div>
          <div className="md:justify-self-end">
            <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">
              For corporate gifting, events, celebrations, and larger quantities, send us the details and we will help you plan the order.
            </p>
            <button
              onClick={() => setCurrentPage?.("bulk-orders")}
              className="group mt-7 inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
            >
              Bulk orders & corporate gifting
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
