import React from "react";
import { ExternalLink, LogOut, PackageCheck, Truck } from "lucide-react";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/money";

function Tracking({ order }) {
  const status = order.status || "Pending";
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div className="flex items-center gap-2 font-semibold"><PackageCheck className="h-4 w-4 text-amber-600" />Order status: {status}</div>
      {status === "Shipped" || order.tracking_number ? (
        <div className="mt-3 text-sm">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4" /><span>{order.courier || "Courier"}</span></div>
          {order.tracking_number && <div className="mt-1">Tracking number: <strong>{order.tracking_number}</strong></div>}
          {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-amber-600 hover:underline">Track shipment <ExternalLink className="h-3.5 w-3.5" /></a>}
        </div>
      ) : <p className="mt-2 text-sm text-[var(--color-muted)]">Tracking details will appear here after your parcel is shipped.</p>}
    </div>
  );
}

export default function OrdersPage({ setCurrentPage }) {
  const { orders } = useOrders();
  const { user, logout } = useAuth();
  if (!user) return <section className="mx-auto max-w-md px-4 py-16 text-center"><h2 className="text-2xl font-semibold">Sign in to view orders</h2><p className="mt-2 text-[var(--color-muted)]">You need an account to track your orders and shipping.</p><button onClick={() => setCurrentPage?.("login")} className="mt-6 inline-flex w-full justify-center rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white">Log In or Sign Up</button></section>;
  const handleLogout = async () => { await logout(); setCurrentPage?.("home"); };

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">Your Orders</h1><p className="mt-1 text-sm text-[var(--color-muted)]">Order status and shipment tracking appear here.</p></div><button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-red-500"><LogOut className="h-4 w-4" />Log Out</button></div>
      {!orders.length ? <p className="mt-8 text-[var(--color-muted)]">No orders yet.</p> : <div className="mt-8 space-y-6">{orders.map((o) => (
        <article key={o.id} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface-muted)] px-5 py-4"><div><div className="font-semibold">Order #{o.id}</div><div className="text-xs text-[var(--color-muted)]">Placed {new Date(o.createdAt || o.created_at).toLocaleString()}</div></div><div className="text-right"><div className="font-semibold">{formatINR(o.total ?? o.subtotal ?? 0)}</div><div className="text-xs text-[var(--color-muted)]">{(o.items || []).reduce((s,p) => s + Number(p.qty || 0), 0)} items</div></div></div>
          <div className="grid gap-5 p-5 md:grid-cols-2"><div><h2 className="text-sm font-semibold">Items</h2><div className="mt-2 divide-y divide-[var(--color-border)]">{(o.items || []).map((it,index) => <div key={`${it.name}-${index}`} className="flex justify-between gap-3 py-3 text-sm"><span>{it.qty} × {it.name}</span><span>{formatINR(Number(it.qty || 0) * Number(it.price || 0))}</span></div>)}</div></div><Tracking order={o} /></div>
        </article>
      ))}</div>}
    </section>
  );
}
