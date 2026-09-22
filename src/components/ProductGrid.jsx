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
      <div className="grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-20" aria-label="Loading products">
        {[1, 2, 3].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="aspect-[4/5] rounded-[1.6rem] bg-[var(--color-surface-muted)]" />
            <div className="mx-3 -mt-10 h-28 rounded-[1.15rem] border border-[var(--color-border)] bg-[var(--color-surface)] opacity-80" />
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
    <div className="grid grid-cols-1 gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-20">
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
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";
export default ProductGrid;
