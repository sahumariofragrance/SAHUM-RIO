import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Package, X } from "lucide-react";
import { Card } from "../components/ui";
import ShippingForm from "../components/ShippingForm";
import CartSummary from "../components/CartSummary";
import SpinWheel from "../components/SpinWheel";
import { useCart } from "../context/cartContext";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import { supabase } from "../lib/supabase";
import { completeVerifiedOrder } from "../lib/completeOrder";
import { trackEvent } from "../lib/analytics";
import { pixelInitiateCheckout, pixelPurchase } from "../lib/metaPixel";
import { forgetSavedCode, savedCode } from "../lib/promo";
import { comboDiscount, useOffer } from "../lib/offers";
import { bottlesOnly } from "../lib/samples";
import { WHEEL, markSpinUsed, prizeUseBy, savedSpin, saveSpin, spinLater, spinPutOff, useSpinWheelOpen } from "../lib/spinWheel";
import { otherTesters, suggestTesters } from "../lib/testers";
import { isTester } from "../lib/catalogue";
import { formatINR } from "../utils/money";
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
  const { items, subtotal, testerSaving, clearCart } = useCart();
  const { refreshOrders, fetchAddress, saveAddress } = useOrders();
  const { user, startGuestSession, isGuest } = useAuth();
  const { products } = useProducts();
  const [formData, setFormData] = useState({});
  const [formValid, setFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [correctedAmount, setCorrectedAmount] = useState(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [guestCheckout, setGuestCheckout] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [discount, setDiscount] = useState(null); // { code, percent }
  const [codeError, setCodeError] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  // Spin wheel (src/lib/spinWheel.js): the prize won on this device, if any.
  const wheelOn = useSpinWheelOpen();
  const [spin, setSpin] = useState(() => savedSpin());
  const [wheelShown, setWheelShown] = useState(false);
  const [testersSkipped, setTestersSkipped] = useState(false);
  const [testerError, setTesterError] = useState("");
  const [packedTesters, setPackedTesters] = useState([]);
  const prize = spin && !spin.used ? spin : null;
  const hasBottle = bottlesOnly(items).length > 0;
  const canSpin = wheelOn && !spin && hasBottle;
  // Our suggestions come first; the customer may choose any other perfume too.
  const testerOptions = useMemo(() => (prize?.testers ? suggestTesters(items, products) : []), [prize?.testers, items, products]);
  const testerOthers = useMemo(() => (prize?.testers ? otherTesters(items, products, testerOptions) : []), [prize?.testers, items, products, testerOptions]);
  const testerChoices = useMemo(() => [...testerOptions, ...testerOthers], [testerOptions, testerOthers]);
  // Picks still on offer: a perfume added to the bag since can't be a tester too.
  const testerPicks = useMemo(() => (prize?.testers
    ? (prize.chosen || []).filter((id) => testerChoices.some((product) => Number(product.id) === id)).slice(0, prize.testers)
    : []), [prize, testerChoices]);
  const sendTesters = Boolean(prize?.testers) && !prize.demo && hasBottle && !testersSkipped;
  // Same whole-rupee formula as the server (api/_lib/discounts.js).
  // A code is for 50 ml perfumes only, unless it is switched on for testers
  // too (Admin → Discounts); the server works it out the same way.
  const perfumesSubtotal = items.filter((item) => !isTester(item)).reduce((sum, item) => sum + item.price * item.qty, 0);
  const codeBase = discount?.includeTesters ? subtotal : perfumesSubtotal;
  const codeAmount = discount ? Math.round((codeBase * discount.percent) / 100) : 0;
  // Offers don't combine, as on the server: a code counts only when it saves
  // more than the any-2 offer; otherwise it stays unused for another order.
  const anyTwo = useOffer();
  const offerAmount = comboDiscount(bottlesOnly(items), anyTwo);
  const useCode = Boolean(discount) && codeAmount > offerAmount;
  const total = subtotal - (useCode ? codeAmount : offerAmount);
  const processingRef = useRef(false);
  const successRef = useRef(null);
  const testMode = isTestMode(process.env.REACT_APP_RAZORPAY_KEY_ID);
  const summaryItems = useMemo(() => {
    const catalogueById = new Map(products.map((product) => [product.id, product]));
    return items.map((item) => {
      const product = catalogueById.get(item.product_id);
      return {
        ...item,
        image: item.image || product?.image || product?.image_url || "",
        alt: item.alt || product?.alt || `${item.name} Eau de Parfum bottle`,
      };
    });
  }, [items, products]);

  useEffect(() => { if (success) successRef.current?.focus(); }, [success]);
  useEffect(() => {
    let mounted = true;
    if (!user) { setAddressLoaded(true); return () => { mounted = false; }; }
    fetchAddress().then((address) => {
      if (!mounted) return;
      if (address) setFormData({ name: address.name || "", phone: address.phone || "", email: address.email || user.email || "", address: address.address || "", city: address.city || "", state: address.state || "Maharashtra", pin: address.pin || "" });
      setAddressLoaded(true);
    });
    return () => { mounted = false; };
  }, [user, fetchAddress]);

  const applyCode = useCallback(async (code) => {
    setApplyingCode(true); setCodeError("");
    try {
      const response = await fetch("/api/discounts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email: formData.email || "", phone: formData.phone || "" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "That discount code isn't valid.");
      setDiscount({ code: payload.code, percent: Number(payload.percent), includeTesters: payload.includeTesters === true });
    } catch (codeErr) {
      setDiscount(null);
      forgetSavedCode();
      setCodeError(codeErr.message || "That discount code isn't valid.");
    } finally {
      setApplyingCode(false);
    }
  }, [formData.email, formData.phone]);

  const removeCode = useCallback(() => { setDiscount(null); setCodeError(""); forgetSavedCode(); }, []);

  // A code saved from the homepage or a product page is applied automatically,
  // or else a percentage off won on the spin wheel earlier.
  const autoApplied = useRef(false);
  useEffect(() => {
    if (autoApplied.current || !items.length) return;
    const won = savedSpin();
    const code = savedCode() || (won && !won.used && won.percent ? won.code : "");
    if (!code) return;
    autoApplied.current = true;
    applyCode(code);
  }, [items.length, applyCode]);

  // The wheel opens by itself once, before the customer fills in checkout.
  useEffect(() => {
    if (canSpin && !spinPutOff()) setWheelShown(true);
  }, [canSpin]);

  // A percentage off goes in as the discount code, unless a bigger code is
  // already applied; then the prize stays saved for another order.
  const takePrize = useCallback((won) => {
    setSpin(won);
    if (!won.percent || (discount && discount.percent > won.percent)) return;
    // A preview link's demo prize shows in the summary but can't be paid with.
    if (won.demo) { setDiscount({ code: won.code, percent: won.percent, demo: true }); setCodeError(""); }
    else applyCode(won.code);
  }, [discount, applyCode]);

  const closeWheel = useCallback((putOff) => {
    if (putOff) spinLater();
    setWheelShown(false);
  }, []);

  const toggleTester = useCallback((id) => {
    if (!prize) return;
    // With one tester to choose, another perfume replaces the pick.
    const chosen = testerPicks.includes(id)
      ? testerPicks.filter((chosenId) => chosenId !== id)
      : testerPicks.length < prize.testers ? [...testerPicks, id] : prize.testers === 1 ? [id] : testerPicks;
    const next = { ...prize, chosen };
    if (!next.demo) saveSpin(next);
    setSpin(next);
    setTesterError("");
  }, [prize, testerPicks]);

  // The customer can't use this prize (expired, used, or already used one).
  const dropPrize = useCallback(() => {
    markSpinUsed();
    setSpin(savedSpin());
  }, []);

  // Tell Meta once per visit to checkout, when there is something to buy.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !items.length) return;
    checkoutTracked.current = true;
    pixelInitiateCheckout(items, subtotal);
  }, [items, subtotal]);

  const handleFormChange = useCallback((data, valid) => { setFormData(data); setFormValid(Boolean(valid)); setError(""); }, []);

  const initiatePayment = useCallback(async () => {
    if (processingRef.current) return;
    const usingGuestCheckout = !user || isGuest || guestCheckout;
    if (!formValid) { setError("Please complete all required shipping fields before proceeding."); return; }
    if (discount?.demo) { setError(`That ${discount.percent}% off is a demo prize from the preview link's wheel, so it can't be used to pay. Remove it to continue.`); return; }
    if (sendTesters && testerPicks.length !== prize.testers) {
      setTesterError(`Choose your ${prize.testers === 1 ? "free tester" : `${prize.testers} free testers`} in the order summary, or tap “Not now”.`);
      return;
    }
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
    if (!razorpayKey) { setError("Payment gateway is not configured. Please contact support."); return; }

    processingRef.current = true; setLoading(true); setError(""); setCorrectedAmount(null);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && usingGuestCheckout) {
        session = await startGuestSession();
      }
      if (!session?.access_token) throw new Error("Unable to start checkout. Please try again.");
      const checkoutUser = session.user;
      const shippingAddress = { ...formData, email: formData.email || checkoutUser?.email || "" };
      if (!shippingAddress.email) throw new Error("Please enter your email so we can send order updates.");
      paymentLog("info", "INITIATED", { itemCount: items.length });
      const frontendAmount = Math.round(total * 100);
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          items: items.map((item) => ({ product_id: item.product_id, qty: item.qty })),
          frontendAmount,
          currency: "INR",
          customer: { name: formData.name, phone: formData.phone, email: shippingAddress.email },
          address: shippingAddress,
          ...(useCode ? { discount_code: discount.code } : {}),
          ...(sendTesters ? { spin_code: prize.code, testers: testerPicks } : {}),
        }),
      });
      const orderPayload = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        if (orderPayload.discountRejected) {
          if (prize && discount?.code === prize.code) dropPrize();
          setDiscount(null); setCodeError(orderPayload.message);
        }
        if (orderPayload.spinRejected) dropPrize();
        if (orderPayload.testersRejected) setTesterError(orderPayload.message);
        throw new Error(orderPayload.message || "Unable to create payment order. Please try again.");
      }
      if (orderPayload.correctedAmount != null) setCorrectedAmount(orderPayload.correctedAmount);

      await loadRazorpayScript();
      const paymentResponse = await openRazorpayCheckout({
        key: razorpayKey, amount: orderPayload.amount, currency: orderPayload.currency, name: "SAHUMäRIO",
        description: `${items.length} perfume${items.length === 1 ? "" : "s"}`, image: "/logo.png", order_id: orderPayload.id,
        prefill: { name: formData.name, email: shippingAddress.email, contact: formData.phone },
        notes: { shipping_city: formData.city, shipping_pin: formData.pin }, theme: { color: "#4A5C6A" },
      });
      paymentLog("info", "PAYMENT_CAPTURED", { payment_id: paymentResponse.razorpay_payment_id });
      const completed = await completeVerifiedOrder({ paymentResponse, items, address: shippingAddress });
      paymentLog("info", "ORDER_SAVED", { order_id: completed.id });
      if (!usingGuestCheckout && saveToProfile) await saveAddress(shippingAddress);
      if (!usingGuestCheckout && checkoutUser?.id) await refreshOrders(checkoutUser.id);
      trackEvent("purchase", { value: total });
      pixelPurchase(items, total, completed.id);
      forgetSavedCode();
      // The spin prize is used once the order is paid with it.
      if (prize && ((useCode && discount.code === prize.code) || sendTesters)) {
        if (sendTesters) setPackedTesters(testerChoices.filter((product) => testerPicks.includes(Number(product.id))).map((product) => product.name));
        markSpinUsed();
        setSpin(savedSpin());
      }
      clearCart(); setConfirmedOrderId(completed.id); setGuestCheckout(usingGuestCheckout); setSuccess(true);
    } catch (err) {
      const msg = friendlyPaymentError(err) || err?.message || "Checkout failed. Please try again.";
      setError(msg); paymentLog("error", "FAILED", { message: err?.message });
    } finally { processingRef.current = false; setLoading(false); }
  }, [user, isGuest, guestCheckout, startGuestSession, formValid, formData, items, total, discount, useCode, saveToProfile, saveAddress, refreshOrders, clearCart, prize, sendTesters, testerPicks, dropPrize, testerChoices]);

  if (success) return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
      <h1 ref={successRef} tabIndex={-1} className="mt-6 text-3xl font-semibold outline-none">Payment successful</h1>
      <p className="mt-3 text-[var(--color-muted)]">Your payment was verified and your order is now waiting for SAHUMäRIO review.</p>
      {packedTesters.length > 0 && <p className="mt-2 text-sm">Your free {WHEEL.testerMl} ml tester{packedTesters.length === 1 ? "" : "s"}, {packedTesters.join(" and ")}, will be packed with it.</p>}
      {guestCheckout && <p className="mt-2 text-sm text-[var(--color-muted)]">We’ll send order updates to the email you provided. Keep your order number for reference.</p>}
      {confirmedOrderId && <p className="mt-2 font-mono text-xs text-[var(--color-muted)]">Order ID: {confirmedOrderId}</p>}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {!guestCheckout && <button onClick={() => setCurrentPage?.("orders")} className="rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700">View My Orders</button>}
        <button onClick={() => setCurrentPage?.("perfumes")} className="rounded-xl border border-[var(--color-border)] px-6 py-3 font-medium hover:bg-[var(--color-surface-muted)]">Continue Shopping</button>
      </div>
    </section>
  );
  const wheel = wheelShown && items.length > 0 && (
    <SpinWheel onClose={closeWheel} onWon={takePrize} testerOptions={testerOptions} testerOthers={testerOthers} picks={testerPicks} onTogglePick={toggleTester} demo={wheelOn === "demo"} />
  );
  if (!user && !guestCheckout) return <section className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-2xl font-semibold">Checkout</h1><p className="mt-2 text-[var(--color-muted)]">Continue as a guest or sign in to keep your orders linked to your account.</p><div className="mt-6 space-y-3"><button onClick={() => { setGuestCheckout(true); setSaveToProfile(false); setAddressLoaded(true); }} className="w-full rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700">Checkout as Guest</button><button onClick={() => setCurrentPage?.("login", { redirectAfterLogin: "checkout" })} className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 font-medium hover:bg-[var(--color-surface-muted)]">Log In or Sign Up</button></div>{wheel}</section>;
  if (!items.length) return <section className="mx-auto max-w-3xl px-4 py-16 text-center"><Package className="mx-auto h-14 w-14 text-[var(--color-muted)]" /><h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1><button onClick={() => setCurrentPage?.("perfumes")} className="mt-6 rounded-xl bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700">Browse Collection</button></section>;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <button type="button" onClick={() => setCurrentPage?.("perfumes")} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-amber-600"><ChevronLeft className="h-4 w-4" />Back to shop</button>
      <h1 className="mt-2 text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Payment is verified on our server before your order is created.</p>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-2 lg:col-span-2 lg:order-1">
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          {correctedAmount != null && <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">Server-verified total: <strong>₹{Number(correctedAmount).toLocaleString("en-IN")}</strong>. This is the amount presented to Razorpay.</div>}
          <Card className="p-6"><h2 className="mb-6 text-lg font-semibold">Shipping Address</h2>{addressLoaded ? <><ShippingForm key={user?.id || "guest"} onFormChange={handleFormChange} initialValues={formData} requireEmail={guestCheckout || isGuest} />{!guestCheckout && !isGuest && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} className="rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-600" />Save this address to my profile</label>}</> : <div className="h-64 animate-pulse rounded-lg bg-[var(--color-surface-muted)]" />}</Card>
        </div>
        <div className="order-1 lg:order-2"><div className="sticky top-20"><CartSummary items={summaryItems} subtotal={subtotal} testerSaving={testerSaving} total={total} discountPercent={discount?.percent || 0} discountCode={discount?.code || ""} codeUnused={Boolean(discount) && !useCode} codeUnusedReason={codeAmount === 0 ? "testers" : "offer"} codeOnPerfumesOnly={Boolean(discount) && !discount.includeTesters && items.some(isTester)} offerAmount={useCode ? 0 : offerAmount} offerLabel={anyTwo ? `${anyTwo.label} · any 2 for ${formatINR(anyTwo.pairPrice)}` : ""} onApplyCode={applyCode} onRemoveCode={removeCode} codeError={codeError} applyingCode={applyingCode} formValid={formValid} testMode={testMode} onCheckout={initiatePayment} onContinueShopping={() => setCurrentPage?.("perfumes")} loading={loading}
          onSpin={canSpin && !wheelShown ? () => setWheelShown(true) : undefined}
          freeTesters={prize?.testers ? {
            count: prize.testers, useBy: prizeUseBy(prize), options: testerOptions, others: testerOthers, picks: testerPicks,
            needsBottle: !hasBottle, skipped: testersSkipped, error: testerError,
            onToggle: toggleTester, onSkip: () => { setTestersSkipped(true); setTesterError(""); }, onUnskip: () => setTestersSkipped(false),
          } : undefined}
        /></div></div>
      </div>
      {wheel}
    </section>
  );
}
