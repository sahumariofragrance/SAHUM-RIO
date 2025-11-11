import React, { useState } from "react";
import { useCart } from "../context/cartContext";

const STATES = ["Maharashtra", "Gujarat", "Karnataka", "Delhi", "Tamil Nadu", "Telangana", "West Bengal", "Rajasthan"];

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function CheckoutPage({ setCurrentPage }) {
  const { items, subtotal, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    address: "", city: "", state: "Maharashtra", pin: "", notes: "",
  });
  // const [coupon, setCoupon] = useState("");

  // Updated the sendCartToWhatsApp function to validate form fields and ensure no empty data is sent
  async function sendCartToWhatsApp() {
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.pin) {
      alert("Please fill in all required fields before sending the cart to WhatsApp.");
      return;
    }

    const phoneNumber = "+919427368910";
    const cartDetails = items.map(item => `${item.name} x${item.qty}`).join("\n");
    const addressDetails = `Name: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}, ${form.city}, ${form.state} - ${form.pin}`;
    const paymentDetails = ""; // Placeholder for removed payment details
    const message = `Cart Details:\n${cartDetails}\n\n${addressDetails}\n\n${paymentDetails}\n\nTotal: ${formatINR(subtotal)}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    // Clear the cart after sending to WhatsApp
    clearCart();
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

        {/* Summary */}
        <div className="md:col-span-1">
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium">Summary</h3>
            <div className="mt-3 space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">{item.name} x{item.qty}</span>
                  <span className="font-medium">{formatINR(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-base pt-2 border-t mt-2">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
            </div>

            {/* <div className="mt-4">
              <label className="text-sm text-gray-700">Coupon (optional)</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-amber-600 outline-none"
                value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SAHU10 / FLAT200" />
            </div> */}

            {/* Removed the Checkout button and kept only Continue Shopping and Send Cart to WhatsApp options */}
            <button
              className="mt-2 w-full py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
              onClick={sendCartToWhatsApp}
            >
              Send Cart to WhatsApp
            </button>
            <button
              type="button"
              className="mt-2 w-full py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50"
              onClick={() => setCurrentPage("perfumes")}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}