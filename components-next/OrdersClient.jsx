"use client";

import Link from "next/link";
import { ExternalLink, LogOut, PackageCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth";
import { formatINR } from "../src/utils/money";

function Tracking({ order }) {
  const status = order.status || "Pending";
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div className="flex items-center gap-2 font-semibold"><PackageCheck className="h-4 w-4 text-amber-600" />Order status: {status}</div>
      {status === "Shipped" || order.tracking_number ? (
        <div className="mt-3 text-sm"><div className="flex items-center gap-2"><Truck className="h-4 w-4" /><span>{order.courier || "Courier"}</span></div>{order.tracking_number && <div className="mt-1">Tracking number: <strong>{order.tracking_number}</strong></div>}{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-amber-600">Track shipment <ExternalLink className="h-3.5 w-3.5" /></a>}</div>
      ) : <p className="mt-2 text-sm text-[var(--color-muted)]">Tracking details will appear here after your parcel is shipped.</p>}
    </div>
  );
}

export default function OrdersClient() {
  const router = useRouter();
  const { user, loading: authLoading, logout, supabase } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.is_anonymous) {
      router.replace("/login");
      return;
    }

    let live = true;
    supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data, error: loadError }) => {
      if (!live) return;
      if (loadError) {
        setError("We couldn't load your orders right now.");
        setOrders([]);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    });
    return () => { live = false; };
  }, [authLoading, user, router, supabase]);

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  if (authLoading || !user || user.is_anonymous) return <div className="mx-auto max-w-5xl px-5 py-20"><div className="h-40 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /></div>;

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 sm:px-8 md:py-20">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Customer account</p><h1 className="mt-3 font-serif text-5xl font-normal">Your orders</h1><p className="mt-2 text-sm text-[var(--color-muted)]">Order status and shipment tracking appear here.</p></div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-red-500"><LogOut className="h-4 w-4" />Log out</button>
      </div>

      {loading ? <div className="mt-8 h-48 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /> : error ? <p className="mt-8 text-red-600">{error}</p> : !orders.length ? (
        <div className="mt-8"><p className="text-[var(--color-muted)]">No orders yet.</p><Link href="/perfumes" className="mt-4 inline-block border-b border-[var(--color-text)] pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]">Explore perfumes</Link></div>
      ) : (
        <div className="mt-8 space-y-6">{orders.map(order => (
          <article key={order.id} className="glass-soft overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4"><div><div className="font-semibold">Order #{order.id}</div><div className="text-xs text-[var(--color-muted)]">Placed {new Date(order.created_at).toLocaleString("en-IN")}</div></div><div className="text-right"><div className="font-semibold">{formatINR(order.total ?? order.subtotal ?? 0)}</div><div className="text-xs text-[var(--color-muted)]">{(order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)} items</div></div></div>
            <div className="grid gap-5 p-5 md:grid-cols-2"><div><h2 className="text-sm font-semibold">Items</h2><div className="mt-2 divide-y divide-[var(--color-border)]">{(order.items || []).map((item,index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3 py-3 text-sm"><span>{item.qty} × {item.name}</span><span>{formatINR(Number(item.qty || 0) * Number(item.price || 0))}</span></div>)}</div></div><Tracking order={order} /></div>
          </article>
        ))}</div>
      )}
    </section>
  );
}
