import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import SafeImage from './SafeImage';
import { Button } from './ui';
import { formatINR } from '../utils/money';

const ProductDetailModal = React.memo(({ 
  product, 
  quantity = 0, 
  onClose, 
  onAdd, 
  onUpdateQty 
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const handleQtyChange = (newQty) => {
    if (newQty >= 0) {
      onUpdateQty(product.id, newQty);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-name"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] rounded-lg shadow-xl p-6 mx-4 border border-[var(--color-border)] text-[var(--color-text)]">
        <div className="flex justify-between items-start mb-4">
          <h2 id="modal-product-name" className="text-2xl font-bold">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-surface-muted)] rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Image */}
          <div className="bg-[var(--color-surface-muted)] rounded-lg overflow-hidden">
            <SafeImage
              src={product.image}
              alt={product.alt || product.name}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <p className="text-[var(--color-muted)] text-lg mb-4">{product.description}</p>
            
            <div className="mb-6">
              <span className="text-3xl font-bold text-amber-600">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            </div>

            {quantity > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQtyChange(quantity - 1)}
                  >
                    −
                  </Button>
                  <span className="text-lg font-semibold min-w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQtyChange(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  Subtotal: {formatINR(product.price * quantity)}
                </p>
              </div>
            ) : (
              <Button
                onClick={() => onAdd(product)}
                className="w-full"
                size="lg"
              >
                Add to Cart
              </Button>
            )}

            <button
              onClick={onClose}
              className="w-full mt-4 py-2 px-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface-muted)] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductDetailModal.displayName = 'ProductDetailModal';

export default ProductDetailModal;
