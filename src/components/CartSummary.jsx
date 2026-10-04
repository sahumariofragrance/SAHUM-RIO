import React, { useState } from "react";
import { Lock, ShieldCheck, Loader2, Sparkles, FlaskConical, Tag, X } from "lucide-react";
import SafeImage from "./SafeImage";
import ComboNudge from "./ComboNudge";
import { COMBO } from "../lib/offers";
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
    discountCode = "",
    onApplyCode,
    onRemoveCode,
    codeError = "",
    applyingCode = false,
    codeUnused = false,
    offerAmount = 0,
    offerLabel = "",
  }) => {
    const [codeOpen, setCodeOpen] = useState(false);
    const [codeInput, setCodeInput] = useState("");
    const submitCode = (event) => {
      event.preventDefault();
      if (codeInput.trim()) onApplyCode?.(codeInput.trim());
    };
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>

        <ul className="scrollbar-hide max-h-64 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <li key={item.product_id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {item.image ? (
                  <SafeImage src={item.image} alt={item.alt || item.name} sizes="40px" maxWidth={320} className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600" aria-hidden="true">
                    <Sparkles className="h-5 w-5" />
                  </div>
                )}
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
          {offerAmount > 0 && (
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-[var(--color-muted)]">{offerLabel}</span>
              <span className="shrink-0 font-medium text-green-600">- {formatINR(offerAmount)}</span>
            </div>
          )}
          {discountPercent > 0 && !codeUnused && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Discount{discountCode ? ` · ${discountCode}` : ""} ({discountPercent}%)</span>
              <span className="font-medium text-green-600">- {formatINR(subtotal - total)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="text-amber-600">{formatINR(total)}</span>
          </div>
        </div>

        <ComboNudge className="mt-3" action={onContinueShopping ? { label: "Add one", onClick: onContinueShopping } : undefined} />

        {/* Discount code */}
        {onApplyCode && (
          <div className="mt-4">
            {discountCode && codeUnused ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm">
                <span className="inline-flex items-start gap-2"><Tag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><span className="font-semibold">{discountCode}</span> not used: the {COMBO.label} saves you more. Keep the code for another order.</span></span>
                <button type="button" onClick={() => { onRemoveCode?.(); setCodeInput(""); }} className="rounded p-1 hover:bg-[var(--color-border)]" aria-label="Remove discount code"><X className="h-4 w-4" /></button>
              </div>
            ) : discountCode ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                <span className="inline-flex items-center gap-2 font-medium"><Tag className="h-4 w-4" aria-hidden="true" />{discountCode} applied — {discountPercent}% off</span>
                <button type="button" onClick={() => { onRemoveCode?.(); setCodeInput(""); }} className="rounded p-1 hover:bg-green-100" aria-label="Remove discount code"><X className="h-4 w-4" /></button>
              </div>
            ) : codeOpen ? (
              <form onSubmit={submitCode} className="flex gap-2">
                <label htmlFor="discount-code" className="sr-only">Discount code</label>
                <input
                  id="discount-code"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                  placeholder="Discount code"
                  autoComplete="off"
                  maxLength={20}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm uppercase tracking-wide outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button type="submit" disabled={applyingCode || !codeInput.trim()} className="shrink-0 rounded-xl border border-[var(--color-text)] px-4 text-sm font-semibold transition hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] disabled:opacity-40">
                  {applyingCode ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Checking code" /> : "Apply"}
                </button>
              </form>
            ) : (
              <button type="button" onClick={() => setCodeOpen(true)} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] underline-offset-4 hover:text-[var(--color-text)] hover:underline">
                <Tag className="h-4 w-4" aria-hidden="true" />Have a discount code?
              </button>
            )}
            {codeError && <p className="mt-2 text-sm text-red-600" role="alert">{codeError}</p>}
          </div>
        )}

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
          Secure &amp; encrypted payment
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
