import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Package, X } from "lucide-react";
import { Card } from "../components/ui";
import ShippingForm from "../components/ShippingForm";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/cartContext";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { completeVerifiedOrder } from "../lib/completeOrder";
import { loadRazorpayScript, openRazorpayCheckout, isTestMode } from "../lib/razorpay";
import { paymentLog, friendlyPaymentError } from "../lib/paymentLogger";

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="rounded p-0.5 hover:bg-red-100"><X className="h-4 w-4" /></button>
    </div>
  );
}

export default function CheckoutPage({ setCurrentPage }) {
  const { items, subtotal, clearCart } = useCart();
  const { refreshOrders, fetchAddress, saveAddress } = useOrders();
  const { user } = useAuth();
  const [formData, setFormData] = useState({});
  const [formValid, setFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [correctedAmount, setCorrectedAmount] = useState(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const processingRef = useRef(false);
  const successRef = useRef(null);
  const testMode = isTestMode(process.env.REACT_APP_RAZORPAY_KEY_ID);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setAddressLoaded(true);
      return () => { mounted = false; };
    }
    fetchAddress().then((address) => {
      if (!mounted) return;
      if (address) {
        setFormData({
          name: address.name || "",
          phone: address.phone || "",
          email: address.email || user.email || "",
          address: address.address || "",
          city: address.city || "",
          state: address.state || "Maharashtra",
          pin: address.pin || "",
        });
      }
      setAddressLoaded(true);
    });
    return () => { mounted = false; };
  }, [user, fetchAddress]);

  const handleFormChange = useCallback((data, valid) => {
    setFormData(data);
    setFormValid(Boolean(valid));
    setError("");
  }, []);

  const initiatePayment = useCallback(async () => {
    if (processingRef.current) return;
    if (!user) {
      setError("Please sign in before checkout.");
      return;
    }
    if (!formValid) {
      setError("Please complete all required shipping fields before proceeding.");
      return;
    }
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setError("Payment gateway is not configured. Please contact support.");
      return;
    }

    processingRef.current = true;
    setLoading(true);
    setError("");
    setCorrectedAmount(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your session expired. Please log in again before paying.");

      paymentLog("info", "INITIATED", { itemCount: items.length });
      const frontendAmount = Math.round(subtotal * 100);
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({ product_id: item.product_id, qty: item.qty })),
          frontendAmount,
          currency: "INR",
          customer: { name: formData.name, phone: formData.phone, email: formData.email || user.email || "" },
        }),
      });
      const orderPayload = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) throw new Error(orderPayload.message || "Unable to create payment order. Please try again.");
      if (orderPayload.correctedAmount != null) setCorrectedAmount(orderPayload.correctedAmount);

      await loadRazorpayScript();
      const paymentResponse = await openRazorpayCheckout({
        key: razorpayKey,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "SAHUMäRIO",
        description: `${items.length} perfume${items.length === 1 ? "" : "s"}`,
        image: "/logo.png",
        order_id: orderPayload.id,
        prefill: { name: formData.name, email: formData.email || user.email || "", contact: formData.phone },
        notes: { shipping_city: formData.city, shipping_pin: formData.pin },
        theme: { color: "#d97706" },
      });
      paymentLog("info", "PAYMENT_CAPTURED", { payment_id: paymentResponse.razorpay_payment_id });

      const completed = await completeVerifiedOrder({
        paymentResponse,
        items,
        address: { ...formData, email: formData.email || user.email || "" },
      });
      paymentLog("info", "ORDER_SAVED", { order_id: completed.id });

      if (saveToProfile) {
        await saveAddress({ ...formData, email: formData.email || user.email || "" });
      }
      await refreshOrders(user.id);
      clearCart();
      setConfirmedOrderId(completed.id);
      setSuccess(true);
    } catch (err) {
      const msg = friendlyPaymentError(err) || err?.message || "Checkout failed. Please try again.";
      setError(msg);
      paymentLog("error", "FAILED", { message: err?.message });
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  }, [user, formValid, formData, items, subtotal, saveToProfile, saveAddress, refreshOrders, clearCart]);

  if (success) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
        <h1 ref={successRef} tabIndex={-1} className="mt-6 text-3xl font-semibold outline-none">Payment successful</h1>
        <p className="mt-3 text-[var(--color-muted)]">Your payment was verified and your order is now waiting for SAHUMäRIO review.</p>
        {confirmedOrderId && <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">Order ID: {confirmedOrderId}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => setCurrentPage?.("orders")} className="rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700">View My Orders</button>
          <button onClick={() => setCurrentPage?.("perfumes")} className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium hover:bg-[var(--color-surface-muted)]">Continue Shopping</button>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Sign in to checkout</h1>
        <p className="mt-2 text-[var(--color-muted)]">An account is required so your paid order and tracking stay linked to you.</p>
        <button onClick={() => setCurrentPage?.("login")} className="mt-6 w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700">Log In or Sign Up</button>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Package className="mx-auto h-14 w-14 text-[var(--color-muted)]" />
        <h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1>
        <button onClick={() => setCurrentPage?.("perfumes")} className="mt-6 rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700">Browse Collection</button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <button type="button" onClick={() => setCurrentPage?.("perfumes")} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-amber-600"><ChevronLeft className="h-4 w-4" />Back to shop</button>
      <h1 className="mt-2 text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Payment is verified on our server before your order is created.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-2 lg:col-span-2 lg:order-1">
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          {correctedAmount != null && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              Server-verified total: <strong>₹{Number(correctedAmount).toLocaleString("en-IN")}</strong>. This is the amount presented to Razorpay.
            </div>
          )}
          <Card className="p-6">
            <h2 className="mb-6 text-lg font-semibold">Shipping Address</h2>
            {addressLoaded ? (
              <>
                <ShippingForm key={user.id} onFormChange={handleFormChange} initialValues={formData} />
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-600" />
                  Save this address to my profile
                </label>
              </>
            ) : <div className="h-64 animate-pulse rounded-lg bg-[var(--color-surface-muted)]" />}
          </Card>
        </div>
        <div className="order-1 lg:order-2">
          <div className="sticky top-20">
            <CartSummary items={items} subtotal={subtotal} total={subtotal} formValid={formValid} testMode={testMode} onCheckout={initiatePayment} onContinueShopping={() => setCurrentPage?.("perfumes")} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  );
}
