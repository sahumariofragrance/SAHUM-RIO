import React, { useMemo } from "react";
import SafeImage from "../components/SafeImage";
import localProducts from "../data/products.json";
import { useCart } from "../context/cartContext";
import { formatINR } from "../utils/money";

export const PRODUCT_SLUGS = {
  1: "bloom",
  2: "dew-drop",
  3: "lemon-breeze",
  4: "morning-dew",
  5: "night-queen",
};

export function productFromSlug(slug) {
  const entry = Object.entries(PRODUCT_SLUGS).find(([, value]) => value === slug);
  if (!entry) return null;
  return localProducts.find((product) => product.id === Number(entry[0])) || null;
}

export default function ProductPage({ slug, navigate }) {
  const { items, addToCart, updateQty } = useCart();
  const product = useMemo(() => productFromSlug(slug), [slug]);
  const quantity = product ? (items.find((item) => item.product_id === product.id)?.qty || 0) : 0;

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
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-medium">{formatINR(product.price)}</p>
          <p className="mt-6 max-w-xl leading-7 text-[var(--color-muted)]">{product.description}</p>
          <div className="mt-8 border-t border-[var(--color-border)] pt-8">
            {quantity === 0 ? (
              <button onClick={() => addToCart(product)} className="w-full rounded-lg bg-amber-600 px-6 py-3.5 font-semibold text-white hover:bg-amber-700 sm:w-auto">Add to Cart</button>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)]" aria-label={`${product.name} quantity`}>
                  <button onClick={() => updateQty(product.id, quantity - 1)} className="px-4 py-3 hover:bg-[var(--color-surface-muted)]" aria-label={`Decrease ${product.name}`}>−</button>
                  <span className="min-w-10 text-center font-medium">{quantity}</span>
                  <button onClick={() => updateQty(product.id, quantity + 1)} className="px-4 py-3 hover:bg-[var(--color-surface-muted)]" aria-label={`Increase ${product.name}`}>+</button>
                </div>
                <span className="text-sm text-[var(--color-muted)]">In your cart</span>
              </div>
            )}
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-6 text-sm">
            <div><dt className="text-[var(--color-muted)]">Brand</dt><dd className="mt-1 font-medium">SAHUMäRIO</dd></div>
            <div><dt className="text-[var(--color-muted)]">Product</dt><dd className="mt-1 font-medium">Eau de Parfum</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
