import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, AlertCircle, X, Package, CheckCircle2 } from "lucide-react";
import { Card } from "../components/ui";
import ShippingForm from "../components/ShippingForm";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/cartContext";
import { useOrders } from "../context/OrdersContext";
import { loadRazorpayScript, openRazorpayCheckout, isTestMode } from "../lib/razorpay";
import { paymentLog, friendlyPaymentError } from "../lib/paymentLogger";

// Step progress indicator — advances to step 2 (Payment) while processing
function CheckoutSteps({ current }) {
  const steps = [
    { id: 1, label: "Shipping" },
    { id: 2, label: "Payment" },
  ];

  return (
    <nav aria-label="Checkout progress" className="mt-4 flex items-center">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step.id < current
                  ? "bg-green-600 text-white"
                  : step.id === current
                  ? "bg-amber-600 text-white"
                  : "border-2 border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              {step.id < current ? <CheckCircle2 className="h-4 w-4" /> : step.id}
            </div>
            <span
              className={`text-sm font-medium ${
                step.id === current
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className="mx-3 h-px flex-1 bg-[var(--color-border)]" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Inline dismissable error banner
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="rounded p-0.5 transition-colors hover:bg-red-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CheckoutPage({ setCurrentPage }) {
  const { items, subtotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [formData, setFormData] = useState({});
  const [formValid, setFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("checkout"); // "checkout" | "success"
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const successRef = useRef(null);

  const testMode = isTestMode(process.env.REACT_APP_RAZORPAY_KEY_ID);

  // Auto-focus success heading for screen readers when payment completes
  useEffect(() => {
    if (step === "success") successRef.current?.focus();
  }, [step]);

  const handleFormChange = useCallback((data, valid) => {
    setFormData(data);
    setFormValid(!!valid);
    setError(null);
  }, []);

  const initiatePayment = useCallback(async () => {
    if (!formValid) {
      setError("Please complete all required shipping fields before proceeding.");
      return;
    }

    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setError("Payment gateway is not configured. Please contact support.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      paymentLog("info", "INITIATED", { amount: subtotal, discountPercent: 0 });

      // ── Step 1: Create order on backend ────────────────────────────────────
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(subtotal * 100), // Razorpay expects paise
          currency: "INR",
          customer: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || "",
          },
          notes: {
            address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pin}`,
            instructions: formData.notes || "",
            promo_code: "",
            discount_percent: "0",
          },
        }),
      });

      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => ({}));
        throw new Error(body.message || "Unable to create payment order. Please try again.");
      }

      const order = await orderRes.json();
      paymentLog("info", "ORDER_CREATED", { order_id: order.id });

      // ── Step 2: Load Razorpay SDK on demand ────────────────────────────────
      await loadRazorpayScript();

      // ── Step 3: Open checkout modal ────────────────────────────────────────
      const paymentResponse = await openRazorpayCheckout({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "SAHUMäRIO",
        description: `${items.length} perfume${items.length > 1 ? "s" : ""}`,
        image: "/logo.png",
        order_id: order.id,
        prefill: {
          name: formData.name,
          email: formData.email || "",
          contact: formData.phone,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pin}`,
        },
        theme: { color: "#d97706" },
      });
      paymentLog("info", "PAYMENT_CAPTURED", { payment_id: paymentResponse.razorpay_payment_id });

      // ── Step 4: Mark payment successful locally ───────────────────────────
      paymentLog("info", "SUCCESS", { payment_id: paymentResponse.razorpay_payment_id });

      // ── Persist order to context / localStorage ────────────────────────────
      addOrder({
        id: paymentResponse.razorpay_order_id,
        items: items.map((i) => ({ ...i })),
        subtotal,
        discountedSubtotal: subtotal,
        promoCode: null,
        discountPercent: 0,
        address: { ...formData },
        payment: { id: paymentResponse.razorpay_payment_id, method: "Razorpay" },
        createdAt: new Date().toISOString(),
      });

      clearCart();
      setConfirmedOrderId(paymentResponse.razorpay_order_id);
      setStep("success");
    } catch (err) {
      const msg = friendlyPaymentError(err);
      if (msg) {
        setError(msg);
        paymentLog("error", "FAILED", { message: err.message });
      } else {
        paymentLog("info", "CANCELLED");
      }
    } finally {
      setLoading(false);
    }
  }, [formValid, formData, subtotal, items, clearCart, addOrder]);

  // ── Success screen ──────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
          </div>
        </div>
        <h2
          ref={successRef}
          tabIndex={-1}
          className="text-2xl font-semibold outline-none"
        >
          Payment Successful!
        </h2>
        <p className="mt-2 text-[var(--color-muted)]">
          Your order has been placed and is being processed.
        </p>
        {confirmedOrderId && (
          <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
            Order ID: {confirmedOrderId}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => setCurrentPage("orders")}
            className="rounded-xl bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          >
            View Orders
          </button>
          <button
            onClick={() => setCurrentPage("perfumes")}
            className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium transition-colors hover:bg-[var(--color-surface-muted)] active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          >
            Continue Shopping
          </button>
        </div>
      </section>
    );
  }

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Package
          className="mx-auto mb-4 h-16 w-16 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-[var(--color-muted)]">
          Add some perfumes to your cart before checking out.
        </p>
        <button
          onClick={() => setCurrentPage("perfumes")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-medium text-white transition-colors hover:bg-amber-700 active:scale-95"
        >
          Browse Collection
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {/* Back navigation */}
      <button
        onClick={() => setCurrentPage("perfumes")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-amber-600"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to shop
      </button>

      <h1 className="mt-2 text-2xl font-semibold">Checkout</h1>
      {/* Step advances to "Payment" while loading */}
      <CheckoutSteps current={loading ? 2 : 1} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Shipping form — rendered below summary on mobile, left on desktop */}
        <div className="order-2 lg:col-span-2 lg:order-1">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <Card className="p-6">
            <h2 className="mb-6 text-lg font-semibold">Shipping Address</h2>
            <ShippingForm onFormChange={handleFormChange} initialValues={formData} />
          </Card>
        </div>

        {/* Order summary — first on mobile so user sees total before filling form */}
        <div className="order-1 lg:order-2">
          <div className="sticky top-20">
            <CartSummary
              items={items}
              subtotal={subtotal}
              total={subtotal}
              formValid={formValid}
              testMode={testMode}
              onCheckout={initiatePayment}
              onContinueShopping={() => setCurrentPage("perfumes")}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
