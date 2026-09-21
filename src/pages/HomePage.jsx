import React, { useCallback, useMemo } from "react";
import { CircleDot, Clock3, Layers3, MailCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
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

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24" aria-labelledby="why-shop-heading">
        <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid gap-6 border-b border-[var(--color-border)] px-6 py-10 md:grid-cols-[1fr_0.7fr] md:items-end md:px-12 md:py-14">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">Why shop SAHUMäRIO</p>
              <h2 id="why-shop-heading" className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
                Clear information. Considered service.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[var(--color-muted)] md:justify-self-end">
              The practical details are easy to find, from payment through delivery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Truck, "Free India-wide shipping", "No shipping charge on orders placed through our website."],
              [Clock3, "3–7 business days", "Our stated delivery window for orders across India."],
              [ShieldCheck, "Razorpay payment", "Payments are processed through Razorpay and verified before an order is confirmed."],
              [MailCheck, "Updates by email", "Order confirmations and status updates go to the email provided at checkout."],
            ].map(([Icon, title, copy], index) => (
              <div key={title} className={`p-6 md:p-8 ${index > 0 ? "border-t border-[var(--color-border)] lg:border-l lg:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l" : ""} ${index >= 2 ? "sm:border-t" : "sm:border-t-0"}`}>
                <Icon className="h-5 w-5 text-amber-700" />
                <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
