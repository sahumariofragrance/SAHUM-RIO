import React, { useMemo } from "react";
import { Clock3, ShieldCheck, Truck } from "lucide-react";
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
    return <section className="mx-auto max-w-6xl px-4 py-20"><div className="h-96 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /></section>;
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Perfume not found</h1>
        <button onClick={() => navigate("perfumes")} className="mt-8 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700">Back to collection</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <button onClick={() => navigate("perfumes")} className="mb-7 text-sm font-medium text-[var(--color-muted)] hover:text-amber-600" aria-label="Back to perfume collection">← Our Collection</button>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <div className="aspect-[4/5]"><SafeImage src={product.image} alt={product.alt || product.name} className="h-full w-full object-cover" priority /></div>
        </div>
        <div className="md:pt-6">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600">SAHUMäRIO Eau de Parfum</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-medium">{formatINR(product.price)}</p>
          <p className="mt-6 max-w-xl leading-7 text-[var(--color-muted)]">{product.description}</p>
          <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            {quantity === 0 ? (
              <button onClick={() => addToCart(product)} className="w-full rounded-lg bg-amber-600 px-6 py-3.5 font-semibold text-white hover:bg-amber-700 sm:w-auto">Add to Cart</button>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)]" aria-label={product.name + " quantity"}>
                  <button onClick={() => updateQty(product.id, quantity - 1)} className="px-4 py-3 hover:bg-[var(--color-surface-muted)]" aria-label={"Decrease " + product.name}>−</button>
                  <span className="min-w-10 text-center font-medium">{quantity}</span>
                  <button onClick={() => updateQty(product.id, quantity + 1)} className="px-4 py-3 hover:bg-[var(--color-surface-muted)]" aria-label={"Increase " + product.name}>+</button>
                </div>
                <span className="text-sm text-[var(--color-muted)]">In your cart</span>
              </div>
            )}
            <div className="mt-5 grid gap-2 rounded-2xl bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)] sm:grid-cols-3">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-amber-700" /><span>Free India-wide shipping</span></div>
              <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-amber-700" /><span>3–7 business days</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-amber-700" /><span>Secure Razorpay payment</span></div>
            </div>
          </div>
          <dl className="mt-10 grid gap-x-8 gap-y-5 border-t border-[var(--color-border)] pt-6 text-sm sm:grid-cols-2">
            <div><dt className="text-[var(--color-muted)]">Brand</dt><dd className="mt-1 font-medium">SAHUMäRIO</dd></div>
            <div><dt className="text-[var(--color-muted)]">Product</dt><dd className="mt-1 font-medium">Eau de Parfum</dd></div>
            {productDetails.map(([label, value]) => (
              <div key={label} className={label === "Fragrance notes" || label === "Scent profile" ? "sm:col-span-2" : ""}>
                <dt className="text-[var(--color-muted)]">{label}</dt>
                <dd className="mt-1 whitespace-pre-line font-medium leading-6">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
