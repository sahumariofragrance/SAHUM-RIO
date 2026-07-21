import React, { useCallback, useEffect } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "../context/cartContext";
import { formatINR } from "../utils/money";

const CartItem = React.memo(({ item, onUpdateQty, onRemove }) => (
  <li className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--color-border)] last:border-b-0">
    <div>
      <div className="font-medium">{item.name}</div>
      <div className="mt-1 text-sm text-amber-700">
        {formatINR(item.price)}
      </div>

      {/* qty controls */}
      <div className="mt-2 inline-flex items-center gap-2">
        <button
          className="p-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
          onClick={() => onUpdateQty(item.product_id, item.qty - 1)}
          aria-label={`Decrease ${item.name}`}
          type="button"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-6 text-center text-sm">{item.qty}</span>
        <button
          className="p-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
          onClick={() => onUpdateQty(item.product_id, item.qty + 1)}
          aria-label={`Increase ${item.name}`}
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>

    <div className="text-right">
      <div className="font-semibold">
        {formatINR(item.qty * item.price)}
      </div>
      <button
        className="mt-2 inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm transition-colors"
        onClick={() => onRemove(item.product_id)}
        type="button"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="h-4 w-4" /> Remove
      </button>
    </div>
  </li>
));

CartItem.displayName = 'CartItem';

const CartDrawer = React.memo(({ open, onClose, onCheckout }) => {
  const { items, updateQty, removeItem, clearCart, subtotal } = useCart();

  const handleClearCart = useCallback(() => {
    clearCart();
    onClose?.();
  }, [clearCart, onClose]);

  // Close cart on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleUpdateQty = useCallback((itemId, newQty) => {
    updateQty(itemId, newQty);
  }, [updateQty]);

  return (
    <div
      className={`fixed inset-0 z-50 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-sm sm:max-w-md bg-[var(--color-surface)] shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button
            className="p-2 rounded hover:bg-[var(--color-surface-muted)] transition-colors"
            onClick={onClose}
            aria-label="Close cart"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-220px)]">
          {items.length === 0 ? (
            <p className="text-[var(--color-muted)]">Your cart is empty.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onUpdateQty={handleUpdateQty}
                  onRemove={removeItem}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Summary & actions */}
        <div className="p-4 border-t border-[var(--color-border)] space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">Subtotal</span>
              <span className="font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-[var(--color-border)] mt-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
          </div>

          <button
            className="w-full py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors disabled:hover:bg-amber-600"
            onClick={onCheckout}
            disabled={items.length === 0}
            type="button"
          >
            Checkout
          </button>
          <button
            className="w-full py-2.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={handleClearCart}
            disabled={items.length === 0}
            type="button"
          >
            Clear Cart
          </button>
        </div>
      </aside>
    </div>
  );
});

CartDrawer.displayName = 'CartDrawer';

export default CartDrawer;
