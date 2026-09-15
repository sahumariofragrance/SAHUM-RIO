// src/pages/PerfumesPage.jsx
import React, { useCallback, useMemo } from "react";
import ProductGrid from "../components/ProductGrid";
import SectionHeader from "../components/SectionHeader";
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
    <section className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeader title="Our Collection" subtitle="Discover our range of authentic oil-based perfumes." />
      <div className="mt-8">
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
