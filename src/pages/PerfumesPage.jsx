// src/pages/PerfumesPage.jsx
import React, { useCallback, useMemo } from "react";
import ProductGrid from "../components/ProductGrid";
import localProducts from "../data/products.json";
import { useCart } from "../context/cartContext";

export default function PerfumesPage({ onProductNavigate }) {
  const { items, addToCart, updateQty } = useCart();

  const itemQtyById = useMemo(() => items.reduce((acc, item) => {
    acc[item.product_id] = item.qty;
    return acc;
  }, {}), [items]);

  const products = useMemo(() => localProducts.map((product) => ({
    ...product,
    qty: itemQtyById[product.id] ?? 0,
  })), [itemQtyById]);

  const handleAddToCart = useCallback((product) => addToCart(product), [addToCart]);
  const handleUpdateQty = useCallback((productId, newQty) => updateQty(productId, newQty), [updateQty]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="grid gap-8 border-b border-[var(--color-border)] pb-9 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">All fragrances</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight md:text-6xl">The fragrance wardrobe</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
            Our oil-based fragrance collection, presented simply so you can focus on the bottle that speaks to you.
          </p>
        </div>
        <div className="text-sm text-[var(--color-muted)] md:text-right">
          <p>{products.length} fragrance{products.length === 1 ? "" : "s"}</p>
          <p className="mt-1">From ₹749</p>
        </div>
      </div>
      <div className="mt-10">
        <ProductGrid
          products={products}
          onSelectProduct={onProductNavigate}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
        />
      </div>
    </section>
  );
}
