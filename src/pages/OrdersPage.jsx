import React from "react";
import { LogOut } from "lucide-react";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/money";

export default function OrdersPage({ setCurrentPage }) {
  const { orders } = useOrders();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">Sign in to view orders</h2>
        <p className="mt-2 text-[var(--color-muted)]">
          You need an account to track your orders and save shipping details.
        </p>
        <button
          onClick={() => setCurrentPage?.("login")}
          className="mt-6 inline-flex w-full justify-center rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 active:scale-95"
        >
          Log In or Sign Up
        </button>
      </section>
    );
  }

  const handleLogout = async () => {
    await logout();
    setCurrentPage?.("home");
  };

  if (!orders.length) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Orders</h2>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
        <p className="mt-6 text-[var(--color-muted)]">No orders yet.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Orders</h2>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-red-500 transition-colors">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
      <div className="mt-6 space-y-6">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <div className="px-4 py-3 bg-[var(--color-surface-muted)] flex items-center justify-between">
              <div className="text-sm text-[var(--color-text)]">
                <div className="font-medium">Order ID: {o.id}</div>
                <div>Placed on: {new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatINR(o.total ?? o.subtotal)}</div>
                <div className="text-sm text-[var(--color-muted)]">{o.items.reduce((s, p) => s + p.qty, 0)} items</div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ul className="md:col-span-2 divide-y">
                {o.items.map((it) => (
                  <li key={it.name} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-[var(--color-muted)]">Qty: {it.qty}</div>
                    </div>
                    <div className="font-medium">{formatINR(it.qty * it.price)}</div>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm bg-[var(--color-surface)]">
                <div className="font-medium mb-2">Ship To</div>
                <div className="text-[var(--color-text)]">
                  <div>{o.address.name}</div>
                  <div>{o.address.phone}</div>
                  {o.address.email && <div>{o.address.email}</div>}
                  <div className="mt-1">
                    {o.address.address}, {o.address.city}, {o.address.state} - {o.address.pin}
                  </div>
                </div>

                <div className="mt-3 font-medium">Payment</div>
                <div className="text-[var(--color-text)]">
                  {o.payment.method === "Razorpay" 
                    ? `Paid Online (ID: ${o.payment.id})`
                    : o.payment.method === "CARD"
                    ? `Card •••• ${o.payment.last4}`
                    : o.payment.method === "UPI"
                    ? `UPI ${o.payment.upiId}`
                    : "Cash on Delivery"}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-[var(--color-border)] text-sm">
              <div className="flex items-center justify-end gap-6">
                <div className="text-[var(--color-muted)]">Subtotal: <span className="font-medium text-[var(--color-text)]">{formatINR(o.subtotal)}</span></div>
                <div className="font-semibold text-[var(--color-text)]">Paid: {formatINR(o.total ?? o.subtotal)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
