import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, LogOut, Package, RefreshCw, Truck, XCircle } from "lucide-react";
import { fetchAdminOrders, updateAdminOrder } from "../lib/adminOrders";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/money";

const STATUS_LABELS = ["Pending", "Accepted", "Processing", "Shipped", "Delivered", "Rejected", "Cancelled"];

function StatusBadge({ status }) {
  const value = status || "Pending";
  return <span className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold">{value}</span>;
}

function OrderCard({ order, onSaved }) {
  const [status, setStatus] = useState(order.status || "Pending");
  const [courier, setCourier] = useState(order.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(order.status || "Pending");
    setCourier(order.courier || "");
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
  }, [order]);

  async function save(nextStatus = status) {
    setError("");
    setSaved(false);
    if (nextStatus === "Shipped" && (!courier.trim() || !trackingNumber.trim())) {
      setError("Courier and tracking number are required before marking an order as shipped.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAdminOrder(order.id, {
        status: nextStatus,
        courier: courier.trim() || null,
        tracking_number: trackingNumber.trim() || null,
        tracking_url: trackingUrl.trim() || null,
      });
      setStatus(updated.status || nextStatus);
      setSaved(true);
      onSaved(updated);
    } catch (err) {
      setError(err?.message || "Unable to update order.");
    } finally {
      setSaving(false);
    }
  }

  const itemCount = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.qty || 0), 0) : 0;
  const address = order.address || {};

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-4">
        <div>
          <div className="font-semibold">Order #{order.id}</div>
          <div className="mt-1 text-xs text-[var(--color-muted)]">{order.created_at ? new Date(order.created_at).toLocaleString() : "Date unavailable"}</div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <div className="text-right">
            <div className="font-semibold text-amber-600">{formatINR(order.total ?? order.subtotal ?? 0)}</div>
            <div className="text-xs text-[var(--color-muted)]">{itemCount} item{itemCount === 1 ? "" : "s"}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Customer</h3>
          <div className="mt-2 text-sm leading-6">
            <div className="font-medium">{address.name || "Name unavailable"}</div>
            {address.email && <div>{address.email}</div>}
            {address.phone && <div>{address.phone}</div>}
            <div className="mt-1 text-[var(--color-muted)]">{[address.address, address.city, address.state, address.pin].filter(Boolean).join(", ")}</div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Items</h3>
          <div className="mt-2 space-y-2 text-sm">
            {(order.items || []).map((item, index) => (
              <div key={`${item.name || "item"}-${index}`} className="flex justify-between gap-3">
                <span>{item.qty || 1} × {item.name || "Item"}</span>
                <span>{formatINR(Number(item.qty || 1) * Number(item.price || 0))}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Manage</h3>
          <div className="mt-2 space-y-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
              {STATUS_LABELS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier, e.g. Delhivery" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
            <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
            <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://tracking-link.example" className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-5 py-4">
        {error && <div className="mb-3 flex items-start gap-2 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {saved && <div className="mb-3 flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />Order updated.</div>}
        <div className="flex flex-wrap gap-2">
          <button disabled={saving} onClick={() => save("Accepted")} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Accept</button>
          <button disabled={saving} onClick={() => save("Rejected")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button>
          <button disabled={saving} onClick={() => save("Shipped")} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Truck className="h-4 w-4" />Mark Shipped</button>
          <button disabled={saving} onClick={() => save(status)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save Changes</button>
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboardPage({ setCurrentPage }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrders(await fetchAdminOrders());
    } catch (err) {
      setError(err?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => filter === "All" ? orders : orders.filter((order) => (order.status || "Pending") === filter), [orders, filter]);

  function handleSaved(updated) {
    setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
  }

  async function handleLogout() {
    await logout();
    setCurrentPage?.("home");
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Orders Admin</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Review paid orders, accept or reject them, and add shipping details.</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Signed in as {user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:text-red-600"><LogOut className="h-4 w-4" />Logout</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["All", ...STATUS_LABELS].map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-sm ${filter === value ? "border-amber-600 bg-amber-600 text-white" : "border-[var(--color-border)]"}`}>{value}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-amber-600" /></div> : error ? <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><div className="flex gap-2"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div></div> : filtered.length === 0 ? <div className="py-20 text-center"><Package className="mx-auto h-10 w-10 text-[var(--color-muted)]" /><p className="mt-3 text-[var(--color-muted)]">No orders in this view.</p></div> : <div className="mt-8 space-y-5">{filtered.map((order) => <OrderCard key={order.id} order={order} onSaved={handleSaved} />)}</div>}
    </section>
  );
}
