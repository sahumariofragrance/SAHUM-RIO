import React, { useCallback, useEffect, useMemo } from "react";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../context/ProductsContext";
import { useCart } from "../context/cartContext";
import { absoluteUrl, removeJsonLd, setJsonLd } from "../lib/seo";

export default function PerfumesPage({ onProductNavigate }) {
  const { items, addToCart, updateQty } = useCart();
  const { products: catalogueProducts, loading } = useProducts();

  const itemQtyById = useMemo(() => items.reduce((acc, item) => {
    acc[item.product_id] = item.qty;
    return acc;
  }, {}), [items]);

  const products = useMemo(() => catalogueProducts.map((product) => ({
    ...product,
    qty: itemQtyById[product.id] ?? 0,
  })), [catalogueProducts, itemQtyById]);

  useEffect(() => {
    if (loading || !catalogueProducts.length) {
      removeJsonLd("collection");
      return;
    }

    setJsonLd("collection", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "SAHUMäRIO® Eau de Parfum Collection",
      itemListElement: catalogueProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/product/${product.slug}`),
        name: product.name,
      })),
    });

    return () => removeJsonLd("collection");
  }, [catalogueProducts, loading]);

  const handleAddToCart = useCallback((product) => addToCart(product), [addToCart]);
  const handleUpdateQty = useCallback((productId, newQty) => updateQty(productId, newQty), [updateQty]);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 md:px-12 md:py-20">
      <div className="border-b border-[var(--color-border)] pb-9 text-center md:pb-12">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">SAHUMäRIO</p>
        <h1 className="mt-4 font-serif text-5xl font-normal tracking-[-0.03em] md:text-7xl">All fragrances</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
          Eau de Parfum from the current collection.
        </p>
      </div>

      <div className="mt-10 md:mt-14">
        <ProductGrid
          products={products}
          loading={loading}
          onSelectProduct={onProductNavigate}
          onAddToCart={handleAddToCart}
          onUpdateQty={handleUpdateQty}
        />
      </div>
    </section>
  );
}
