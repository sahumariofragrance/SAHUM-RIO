import React from "react";
import PerfumeCardOptimized from "./PerfumeCardOptimized";

const ProductGrid = React.memo(({
  products = [],
  selectedProductId,
  onSelectProduct,
  onAddToCart,
  onUpdateQty,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-16" aria-label="Loading products">
        {[1, 2, 3].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="aspect-[4/5] bg-[var(--color-surface-muted)]" />
            <div className="mt-4 h-5 w-2/5 bg-[var(--color-surface-muted)]" />
            <div className="mt-2 h-3 w-1/5 bg-[var(--color-surface-muted)]" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-[var(--color-muted)]">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-16">
      {products.map((product, index) => (
        <PerfumeCardOptimized
          key={product.id}
          product={product}
          quantity={product.qty || 0}
          onClickCard={() => onSelectProduct(product)}
          onAdd={() => onAddToCart(product)}
          onUpdateQty={(id, newQty) => onUpdateQty(id, newQty)}
          priority={index === 0}
        />
      ))}
      <p className="col-span-full text-center text-xs text-[var(--color-muted)]">
        Every bottle shown is our real bottle; the backgrounds and scenes in the photos are AI-generated.
      </p>
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";
export default ProductGrid;
