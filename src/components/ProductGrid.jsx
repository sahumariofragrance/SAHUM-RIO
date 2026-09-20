import React from 'react';
import PerfumeCardOptimized from './PerfumeCardOptimized';

const ProductGrid = React.memo(({
  products = [],
  selectedProductId,
  onSelectProduct,
  onAddToCart,
  onUpdateQty,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-muted)] text-lg">No products found</p>
      </div>
    );
  }

  // Static classes so Tailwind can detect and include them in the production build
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-5">
      {products.map((product, index) => (
        <PerfumeCardOptimized
          key={product.id}
          product={product}
          quantity={product.qty || 0}
          onClickCard={() => onSelectProduct(product)}
          onAdd={() => onAddToCart(product)}
          onUpdateQty={(id, newQty) => onUpdateQty(id, newQty)}
          priority={index === 0} // First card = LCP image — load eagerly
        />
      ))}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
