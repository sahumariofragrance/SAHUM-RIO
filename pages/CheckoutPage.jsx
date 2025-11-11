import React, { useMemo, useState } from "react";
import { useCart } from "../context/cartContext";
import { useOrders } from "../context/OrdersContext";
import { api } from "../lib/api";

const STATES = ["Maharashtra", "Gujarat", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "West Bengal", "Rajasthan"];

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CheckoutPage({ setCurrentPage }) {
  const { items, subtotal, tax, total, TAX_RATE } = useCart();
  const { /* addOrder not used now; backend creates the order */ } = useOrders();

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", city: "", state: "Maharashtra", pin: "", notes: "",
  });
  const [payment, setPayment] = useState({
    method: "COD", upiId: "", cardName: "", cardNumber: "", cardExpiry: "", cardCvv: "",
  });
  const [coupon, setCoupon] = useState("");

  const canSubmit = useMemo(() => {
    const phoneOk = /^[6-9]\d{9}$/.test(form.phone);
    const pinOk = /^\d{6}$/.test(form.pin);
    const nameOk = form.name.trim().length >= 2;
    const addrOk = form.address.trim().length >= 6 && form.city.trim();
    if (payment.method === "UPI") {
      const upiOk = /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(payment.upiId);
      return items.length > 0 && nameOk && phoneOk && pinOk && addrOk && upiOk;
    }
    if (payment.method === "CARD") {
      const numOk = /^\d{12,19}$/.test(payment.cardNumber.replace(/\s+/g, ""));
      const cvvOk = /^\d{3,4}$/.test(payment.cardCvv);
      const expOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.cardExpiry);
      return items.length > 0 && nameOk && phoneOk && pinOk && addrOk && numOk && cvvOk && expOk;
    }
    return items.length > 0 && nameOk && phoneOk && pinOk && addrOk;
  }, [items.length, form, payment]);

  async function placeOrder(e) {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      const body = { address: form, payment: {
        method: payment.method,
        upiId: payment.method === "UPI" ? payment.upiId : undefined,
        cardLast4: payment.method === "CARD" ? payment.cardNumber.replace(/\s+/g, "").slice(-4) : undefined,
      }, coupon_code: coupon || null };

      const order = await api("/orders", { method: "POST", body });
      alert(`Order placed! Order ID: ${order.order_id}`);
      setCurrentPage?.("orders");
    } catch (err) {
      alert((err && err.message) || "Failed to place order");
      console.error(err);
    }
  }

  async function sendCartToWhatsApp() {
    const phoneNumber = "+919427368910"; // Replace with your phone number
    const cartDetails = items.map(item => `${item.name} x${item.qty}`).join("\n");
    const message = `Cart Details:\n${cartDetails}\nTotal: ${formatINR(total)}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  }

  async function handleCheckout(e) {
    e.preventDefault();
    sendCartToWhatsApp();
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-semibold">Checkout</h2>
        <p className="mt-4 text-gray-600">Your cart is empty.</p>
        <button className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white" onClick={() => setCurrentPage("perfumes")} type="button">
          Browse Perfumes
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Checkout</h2>

      <form onSubmit={handleCheckout} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Address */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium">Shipping Address</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Full Name</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-700">Phone</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" required />
              </div>
              <div>
                <label className="text-sm text-gray-700">Email (optional)</label>
                <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Address</label>
                <textarea className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-700">City</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm text-gray-700">State</label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none bg-white"
                  value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">PIN Code</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} placeholder="6-digit PIN" required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-700">Order Notes (optional)</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Payment */}
        <div className="md:col-span-1">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium">Summary</h3>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{formatINR(subtotal)}</span></div>
              {TAX_RATE > 0 && (
                <div className="flex justify-between"><span className="text-gray-600">GST ({Math.round(TAX_RATE * 100)}%)</span><span className="font-medium">{formatINR(tax)}</span></div>
              )}
              <div className="flex justify-between text-base pt-2 border-t mt-2"><span className="font-semibold">Total</span><span className="font-semibold">{formatINR(total)}</span></div>
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-700">Coupon (optional)</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SAHU10 / FLAT200" />
            </div>

            <div className="mt-6">
              <h4 className="font-medium">Payment Method</h4>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="pay" checked={payment.method === "COD"} onChange={() => setPayment({ ...payment, method: "COD" })} />
                  <span>Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="pay" checked={payment.method === "UPI"} onChange={() => setPayment({ ...payment, method: "UPI" })} />
                  <span>UPI</span>
                </label>
                {payment.method === "UPI" && (
                  <input className="ml-6 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                    placeholder="your-upi@bank" value={payment.upiId} onChange={(e) => setPayment({ ...payment, upiId: e.target.value })} />
                )}
                <label className="flex items-center gap-2">
                  <input type="radio" name="pay" checked={payment.method === "CARD"} onChange={() => setPayment({ ...payment, method: "CARD" })} />
                  <span>Card</span>
                </label>
                {payment.method === "CARD" && (
                  <div className="ml-6 space-y-2">
                    <input className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                      placeholder="Name on card" value={payment.cardName} onChange={(e) => setPayment({ ...payment, cardName: e.target.value })} />
                    <input className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                      placeholder="Card number" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value.replace(/\s+/g, "") })} />
                    <div className="flex gap-2">
                      <input className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                        placeholder="MM/YY" value={payment.cardExpiry} onChange={(e) => setPayment({ ...payment, cardExpiry: e.target.value })} />
                      <input className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                        placeholder="CVV" value={payment.cardCvv} onChange={(e) => setPayment({ ...payment, cardCvv: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit"
              className="mt-6 w-full py-2.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
              Checkout
            </button>
            <button type="button" className="mt-2 w-full py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              onClick={() => setCurrentPage("perfumes")}>
              Continue Shopping
            </button>
            <button
              className="mt-2 w-full py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
              onClick={sendCartToWhatsApp}
            >
              Send Cart to WhatsApp
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}