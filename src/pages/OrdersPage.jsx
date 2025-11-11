import React from "react";
import { useOrders } from "../context/OrdersContext";
import { formatINR } from "../utils/money";

export default function OrdersPage() {
  const { orders } = useOrders();

  if (!orders.length) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-semibold">Your Orders</h2>
        <p className="mt-3 text-gray-600">No orders yet.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <h2 className="text-2xl font-semibold">Your Orders</h2>
      <div className="mt-6 space-y-6">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                <div className="font-medium">Order ID: {o.id}</div>
                <div>Placed on: {new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatINR(o.total)}</div>
                <div className="text-sm text-gray-600">{o.items.reduce((s, p) => s + p.qty, 0)} items</div>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ul className="md:col-span-2 divide-y">
                {o.items.map((it) => (
                  <li key={it.name} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-600">Qty: {it.qty}</div>
                    </div>
                    <div className="font-medium">{formatINR(it.qty * it.price)}</div>
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-gray-200 p-3 text-sm">
                <div className="font-medium mb-2">Ship To</div>
                <div className="text-gray-700">
                  <div>{o.address.name}</div>
                  <div>{o.address.phone}</div>
                  {o.address.email && <div>{o.address.email}</div>}
                  <div className="mt-1">
                    {o.address.address}, {o.address.city}, {o.address.state} - {o.address.pin}
                  </div>
                </div>

                <div className="mt-3 font-medium">Payment</div>
                <div className="text-gray-700">
                  {o.payment.method === "CARD"
                    ? `Card •••• ${o.payment.last4}`
                    : o.payment.method === "UPI"
                    ? `UPI ${o.payment.upiId}`
                    : "Cash on Delivery"}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t text-sm">
              <div className="flex items-center justify-end gap-6">
                <div className="text-gray-600">Subtotal: <span className="font-medium text-gray-800">{formatINR(o.subtotal)}</span></div>
                {o.tax > 0 && (
                  <div className="text-gray-600">Tax: <span className="font-medium text-gray-800">{formatINR(o.tax)}</span></div>
                )}
                <div className="font-semibold">Paid: {formatINR(o.total)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
