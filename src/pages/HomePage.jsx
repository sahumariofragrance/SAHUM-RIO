import React, { useCallback, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";

export default function HomePage({ onProductNavigate, setCurrentPage }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts } = useProducts();
  const itemQtyById = useMemo(() => items.reduce((acc, item) => { acc[item.product_id] = item.qty; return acc; }, {}), [items]);
  const products = useMemo(() => catalogueProducts.map((product) => ({ ...product, qty: itemQtyById[product.id] ?? 0 })), [catalogueProducts, itemQtyById]);
  const handleAdd = useCallback((product) => addToCart(product), [addToCart]);
  const handleQty = useCallback((productId, qty) => updateQty(productId, qty), [updateQty]);

  return <>
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:px-12 md:py-28">
      <div className="flex flex-col gap-5 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">The collection</p><h2 className="mt-3 font-serif text-5xl font-normal tracking-[-0.025em] md:text-6xl">Eau de Parfum</h2></div>
        <p className="max-w-md text-sm leading-7 text-[var(--color-muted)]">Explore the current SAHUMäRIO collection.</p>
      </div>
      <div className="mt-10 md:mt-14"><ProductGrid products={products} onSelectProduct={onProductNavigate} onAddToCart={handleAdd} onUpdateQty={handleQty} /></div>
      <div className="mt-14 text-center"><button onClick={() => setCurrentPage?.("perfumes")} className="group inline-flex items-center gap-3 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">View the full collection<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></button></div>
    </section>

    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center md:min-h-[520px] md:py-32">
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">The House</p>
        <blockquote className="mt-7 max-w-4xl font-serif text-[clamp(3rem,5.5vw,6rem)] font-normal leading-[0.96] tracking-[-0.035em]">
          A fragrance should be
          <span className="block italic">discovered, not explained.</span>
        </blockquote>
        <div className="mt-10 h-px w-10 bg-[var(--color-border)]" aria-hidden="true" />
        <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">SAHUMäRIO</p>
      </div>
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 md:px-12 md:py-20"><div className="grid gap-10 md:grid-cols-3">
      {[["Complimentary delivery", "Free shipping on website orders across India."], ["Delivery", "Orders are typically delivered in 3–7 business days."], ["Secure payment", "Payments are processed through Razorpay."]].map(([title, copy]) => <div key={title} className="border-t border-[var(--color-border)] pt-5"><h3 className="text-[11px] font-semibold uppercase tracking-[0.15em]">{title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">{copy}</p></div>)}
    </div></section>
  </>;
}
