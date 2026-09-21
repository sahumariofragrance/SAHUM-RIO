import React, { useMemo } from "react";
import SafeImage from "../components/SafeImage";
import { useCart } from "../context/cartContext";
import { useProducts } from "../context/ProductsContext";
import { formatINR } from "../utils/money";

export default function ProductPage({ slug, navigate }) {
  const { items, addToCart, updateQty } = useCart();
  const { bySlug, loading } = useProducts();
  const product = useMemo(() => bySlug.get(slug) || null, [bySlug, slug]);
  const quantity = product ? (items.find((item) => item.product_id === product.id)?.qty || 0) : 0;
  const productDetails = product ? [
    ["Size / volume", product.size_volume],
    ["Fragrance family", product.fragrance_family],
    ["Scent profile", product.scent_profile],
    ["Occasion", product.occasion],
    ["Fragrance notes", product.notes],
  ].filter(([, value]) => String(value || "").trim()) : [];

  if (loading && !product) {
    return <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 md:px-12"><div className="h-[70vh] animate-pulse bg-[var(--color-surface-muted)]" /></section>;
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)]">404</p>
        <h1 className="mt-4 font-serif text-5xl font-normal">Perfume not found</h1>
        <button onClick={() => navigate("perfumes")} className="mt-8 border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">Back to collection</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 md:px-12 md:py-12">
      <button onClick={() => navigate("perfumes")} className="mb-8 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-muted)] transition hover:text-[var(--color-text)]" aria-label="Back to perfume collection">← All fragrances</button>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="min-h-[560px] overflow-hidden bg-[var(--color-surface-muted)]">
          <SafeImage src={product.image} alt={product.alt || product.name} className="h-full w-full object-cover" priority />
        </div>

        <div className="flex flex-col justify-center lg:py-8">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">SAHUMäRIO · Eau de Parfum</p>
          <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.025em] sm:text-6xl">{product.name}</h1>
          <p className="mt-4 text-base">{formatINR(product.price)}</p>
          <p className="mt-7 max-w-xl text-sm leading-7 text-[var(--color-muted)]">{product.description}</p>

          <div className="mt-9 border-t border-[var(--color-border)] pt-6">
            {quantity === 0 ? (
              <button onClick={() => addToCart(product)} className="flex h-12 w-full items-center justify-between bg-[var(--color-text)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85">
                <span>Add to bag</span><span>+</span>
              </button>
            ) : (
              <div className="grid h-12 grid-cols-[3rem_1fr_3rem] border border-[var(--color-border)]">
                <button onClick={() => updateQty(product.id, quantity - 1)} className="text-lg" aria-label={"Decrease " + product.name}>−</button>
                <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em]">{quantity} in bag</span>
                <button onClick={() => updateQty(product.id, quantity + 1)} className="text-lg" aria-label={"Increase " + product.name}>+</button>
              </div>
            )}
          </div>

          {productDetails.length > 0 && (
            <dl className="mt-10 border-t border-[var(--color-border)]">
              {productDetails.map(([label, value]) => (
                <div key={label} className="grid gap-2 border-b border-[var(--color-border)] py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</dt>
                  <dd className="whitespace-pre-line text-sm leading-6">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 space-y-3 border-t border-[var(--color-border)] pt-5 text-xs leading-5 text-[var(--color-muted)]">
            <p>Complimentary delivery across India.</p>
            <p>Typical delivery window: 3–7 business days.</p>
            <p>Payments are processed through Razorpay.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
