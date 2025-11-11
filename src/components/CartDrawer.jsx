import React from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "../context/cartContext";

// Local formatter (or import from utils/money if you created it)
function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { items, updateQty, removeItem, clearCart, subtotal } = useCart();
  const total = subtotal; // Ensure total is directly derived from subtotal

  return (
    <div
      className={`fixed inset-0 z-50 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform sm:w-3/4 xs:w-full ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Your Cart</h3>
          <button
            className="p-2 rounded hover:bg-gray-100"
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
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.product_id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 text-sm text-amber-700">
                      {formatINR(item.price)}
                    </div>

                    {/* qty controls */}
                    <div className="mt-2 inline-flex items-center gap-2">
                      <button
                        className="p-1.5 rounded border hover:bg-gray-50"
                        onClick={() => updateQty(item.product_id, item.qty - 1)}
                        aria-label={`Decrease ${item.name}`}
                        type="button"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-6 text-center">{item.qty}</span>
                      <button
                        className="p-1.5 rounded border hover:bg-gray-50"
                        onClick={() => updateQty(item.product_id, item.qty + 1)}
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
                      className="mt-2 inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                      onClick={() => removeItem(item.product_id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary & actions */}
        <div className="p-4 border-t">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t mt-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatINR(total)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              className="flex-1 py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              onClick={onCheckout}
              disabled={items.length === 0}
              type="button"
            >
              Checkout
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              onClick={() => {
                clearCart();
                window.location.href = '/perfumes';
              }}
              disabled={items.length === 0}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}