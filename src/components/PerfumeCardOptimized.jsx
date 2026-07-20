import React from 'react';
import SafeImage from './SafeImage';
import { formatINR } from '../utils/money';

const PerfumeCardOptimized = React.memo(({ 
  product, 
  quantity = 0, 
  onClickCard, 
  onAdd, 
  onUpdateQty,
  priority = false,
}) => {
  const { id, name, description, price, image, alt } = product;

  return (
    <article
      className="rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden bg-[var(--color-surface)] cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={onClickCard}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClickCard();
        }
      }}
    >
      <div className="relative aspect-[4/5] bg-[var(--color-surface-muted)] overflow-hidden">
        <SafeImage
          src={image}
          alt={alt || name}
          className="w-full h-full object-cover"
          priority={priority}
        />
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-lg line-clamp-1">{name}</h4>
        <p className="mt-1 text-sm text-[var(--color-muted)] line-clamp-2">
          {description}
        </p>
        
        <div className="mt-3 font-medium">
          {formatINR(price)}
        </div>

        {quantity > 0 && (
          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(id, quantity - 1);
              }}
              className="px-3 py-1 bg-[var(--color-surface-muted)] rounded hover:bg-amber-600 hover:text-white transition-colors"
              aria-label={`Decrease ${name}`}
            >
              −
            </button>
            <span className="min-w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(id, quantity + 1);
              }}
              className="px-3 py-1 bg-[var(--color-surface-muted)] rounded hover:bg-amber-600 hover:text-white transition-colors"
              aria-label={`Increase ${name}`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

PerfumeCardOptimized.displayName = 'PerfumeCardOptimized';

export default PerfumeCardOptimized;
