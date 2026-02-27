import React from "react";
import { Lock, ShieldCheck, Loader2, Sparkles, FlaskConical } from "lucide-react";
import { formatINR } from "../utils/money";

const CartSummary = React.memo(
  ({
    items,
    subtotal,
    formValid = false,
    testMode = false,
    onCheckout,
    onContinueShopping,
    loading = false,
    total = subtotal,
    discountPercent = 0,
    promoCode = "",
    onPromoCodeChange,
    onApplyPromo,
    applyingPromo = false,
    promoMessage = "",
    promoError = "",
  }) => {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>

        {/* Item list with icon placeholder */}
        <ul className="scrollbar-hide max-h-64 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <li key={item.product_id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {/* Amber accent placeholder — replaces missing thumbnails */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600"
                  aria-hidden="true"
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">Qty {item.qty}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {formatINR(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals breakdown */}
        <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Shipping</span>
            <span className="font-medium text-green-600">Free</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Discount ({discountPercent}%)</span>
              <span className="font-medium text-green-600">- {formatINR(subtotal - total)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="text-amber-600">{formatINR(total)}</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="promo-code" className="mb-1 block text-sm font-medium">
            Promo code
          </label>
          <div className="flex gap-2">
            <input
              id="promo-code"
              value={promoCode}
              onChange={(event) => onPromoCodeChange?.(event.target.value)}
              placeholder="Enter promo code"
              className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-amber-500"
              disabled={loading || applyingPromo}
            />
            <button
              type="button"
              onClick={onApplyPromo}
              disabled={loading || applyingPromo || !promoCode.trim()}
              className="rounded-lg border border-amber-600 px-3 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyingPromo ? "Checking..." : "Apply"}
            </button>
          </div>
          {promoMessage && <p className="mt-1 text-xs text-green-600">{promoMessage}</p>}
          {promoError && <p className="mt-1 text-xs text-red-600">{promoError}</p>}
        </div>

        {/* Primary CTA — disabled until form is valid */}
        <button
          onClick={onCheckout}
          disabled={!formValid || loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          aria-label={`Pay ${formatINR(total)} securely`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Processing…
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              Pay {formatINR(total)}
            </>
          )}
        </button>

        {/* Test mode badge — visible only when using a test/sandbox key */}
        {testMode && (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 py-1.5 text-xs font-medium text-amber-700">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Test mode — no real charges
          </div>
        )}

        {/* Trust indicator */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted)]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Secured &amp; encrypted payment
        </div>

        {/* Secondary action */}
        <button
          onClick={onContinueShopping}
          className="mt-3 w-full py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-amber-600"
        >
          Continue Shopping
        </button>
      </div>
    );
  }
);

CartSummary.displayName = "CartSummary";

export default CartSummary;
