import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Loader2, LogOut, Package, RefreshCw, RotateCcw, Search, Sparkles, Trash2 } from "lucide-react";
import AdminProductsPanel from "../components/AdminProductsPanel";
import OrderCard from "../components/admin/OrderCard";
import { AdminButton, Notice, ORDER_STATUSES, STATUS_TONES, StatTile, inputClass } from "../components/admin/AdminUI";
import { changeOrdersTrash, fetchAdminOrders } from "../lib/adminOrders";
import { downloadOrdersPdf } from "../lib/orderPdf";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../utils/money";

const CLOSED = new Set(["Rejected", "Cancelled"]);

function orderMatches(order, query) {
  if (!query) return true;
  const address = order.address || {};
  const haystack = [order.id, address.name, address.email, address.phone, address.city, ...(order.items || []).map((item) => item.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function AdminDashboardPage({ setCurrentPage }) {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("orders");
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);

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

  const activeOrders = useMemo(() => orders.filter((order) => !order.deleted_at), [orders]);
  const trashedOrders = useMemo(() => orders.filter((order) => order.deleted_at), [orders]);
  const inTrash = filter === "Trash";

  const counts = useMemo(() => {
    const byStatus = { All: activeOrders.length, Trash: trashedOrders.length };
    activeOrders.forEach((order) => {
      const status = order.status || "Pending";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    return byStatus;
  }, [activeOrders, trashedOrders]);

  const stats = useMemo(() => {
    const open = activeOrders.filter((order) => !CLOSED.has(order.status || "Pending"));
    return {
      pending: counts.Pending || 0,
      inProgress: (counts.Accepted || 0) + (counts.Processing || 0),
      shipped: counts.Shipped || 0,
      delivered: counts.Delivered || 0,
      revenue: open.reduce((sum, order) => sum + Number(order.total ?? order.subtotal ?? 0), 0),
      revenueOrders: open.length,
    };
  }, [activeOrders, counts]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () => (inTrash ? trashedOrders : activeOrders)
      .filter((order) => (inTrash || filter === "All" || (order.status || "Pending") === filter) && orderMatches(order, normalizedQuery)),
    [inTrash, trashedOrders, activeOrders, filter, normalizedQuery]
  );

  // Selection only ever covers orders currently shown.
  useEffect(() => { setSelected(new Set()); }, [filter, normalizedQuery]);
  const selectedOrders = filtered.filter((order) => selected.has(order.id));
  const allSelected = filtered.length > 0 && selectedOrders.length === filtered.length;

  function toggleSelect(id) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((order) => order.id)));
  }

  const plural = (n) => `${n} order${n === 1 ? "" : "s"}`;

  async function runTrashAction(action, targets, { confirmed = false } = {}) {
    if (!targets.length) return;
    const n = targets.length;
    if (!confirmed) {
      const question = {
        trash: `Move ${plural(n)} to the trash? You can restore ${n === 1 ? "it" : "them"} from the Trash tab.`,
        restore: `Restore ${plural(n)} to the order list?`,
        purge: `Delete ${plural(n)} forever? This cannot be undone.`,
      }[action];
      if (!window.confirm(question)) return;
    }
    setBusy(action);
    setNotice(null);
    try {
      const ids = targets.map((order) => order.id);
      await changeOrdersTrash(action, ids);
      const idSet = new Set(ids);
      const now = new Date().toISOString();
      setOrders((current) => (action === "purge"
        ? current.filter((order) => !idSet.has(order.id))
        : current.map((order) => (idSet.has(order.id) ? { ...order, deleted_at: action === "trash" ? now : null } : order))));
      setSelected(new Set());
      setNotice({
        tone: "green",
        text: { trash: `${plural(n)} moved to the trash.`, restore: `${plural(n)} restored.`, purge: `${plural(n)} deleted forever.` }[action],
        undo: action === "trash" ? targets : null,
      });
    } catch (err) {
      setNotice({ tone: "red", text: err?.message || "Unable to update the orders." });
    } finally {
      setBusy("");
    }
  }

  async function downloadPdf(targets) {
    if (!targets.length) return;
    setBusy("pdf");
    try {
      await downloadOrdersPdf(targets);
    } catch (err) {
      setNotice({ tone: "red", text: "The PDF could not be created. Please try again." });
    } finally {
      setBusy("");
    }
  }

  function handleSaved(updated) {
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
  }

  async function handleLogout() {
    await logout();
    setCurrentPage?.("home");
  }

  const tabClass = (active) =>
    `relative inline-flex items-center gap-2 pb-3 text-sm font-semibold transition ${active ? "text-[var(--color-text)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--color-text)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">SAHUMäRIO® · Admin</p>
          <h1 className="mt-3 font-serif text-5xl font-normal tracking-[-0.03em] md:text-6xl">Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden max-w-[16rem] truncate rounded-full border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)] sm:inline-block" title={user?.email}>
            {user?.email}
          </span>
          <AdminButton variant="secondary" onClick={load} disabled={loading} aria-label="Refresh orders">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </AdminButton>
          <AdminButton variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />Log out
          </AdminButton>
        </div>
      </header>

      <nav className="mt-10 flex gap-8 border-b border-[var(--color-border)]" aria-label="Admin sections">
        <button type="button" onClick={() => setSection("orders")} className={tabClass(section === "orders")} aria-current={section === "orders" ? "page" : undefined}>
          <Package className="h-4 w-4" />Orders
          {stats.pending > 0 && <span className="admin-tone tone-amber rounded-full px-1.5 py-0.5 text-[10px] leading-none">{stats.pending}</span>}
        </button>
        <button type="button" onClick={() => setSection("products")} className={tabClass(section === "products")} aria-current={section === "products" ? "page" : undefined}>
          <Sparkles className="h-4 w-4" />Catalogue
        </button>
      </nav>

      {section === "products" ? (
        <div className="mt-8"><AdminProductsPanel /></div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Needs action" value={stats.pending} sub={stats.pending ? "Pending acceptance" : "All caught up"} tone={STATUS_TONES.Pending} />
            <StatTile label="In progress" value={stats.inProgress} sub="Accepted or processing" tone={STATUS_TONES.Processing} />
            <StatTile label="On the way" value={stats.shipped} sub={`${stats.delivered} delivered`} tone={STATUS_TONES.Shipped} />
            <StatTile label="Revenue" value={formatINR(stats.revenue)} sub={`${stats.revenueOrders} order${stats.revenueOrders === 1 ? "" : "s"}, excl. rejected & cancelled`} />
          </div>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter orders by status">
              {["All", ...ORDER_STATUSES, "Trash"].map((value) => {
                const active = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(value)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition ${value === "Trash" ? "ml-2 border border-[var(--color-border)] " : ""}${active ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"}`}
                  >
                    {value === "Trash" && <Trash2 className="h-3.5 w-3.5" />}{value}
                    <span className={`text-xs tabular-nums ${active ? "opacity-70" : "opacity-60"}`}>{counts[value] || 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, email, order…"
                aria-label="Search orders"
                className={`${inputClass} rounded-full pl-10`}
              />
            </div>
          </div>

          {!loading && !error && filtered.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
              <label className="mr-2 inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 cursor-pointer accent-[var(--color-text)]" aria-label="Select all shown orders" />
                {selectedOrders.length ? `${selectedOrders.length} selected` : `Select all ${filtered.length}`}
              </label>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <AdminButton size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => downloadPdf(selectedOrders.length ? selectedOrders : filtered)}>
                  {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  {selectedOrders.length ? `Download PDF (${selectedOrders.length})` : `Download PDF (all ${filtered.length})`}
                </AdminButton>
                {selectedOrders.length > 0 && (inTrash ? (
                  <>
                    <AdminButton size="sm" variant="secondary" disabled={Boolean(busy)} onClick={() => runTrashAction("restore", selectedOrders)}>
                      {busy === "restore" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Restore
                    </AdminButton>
                    <AdminButton size="sm" variant="danger" disabled={Boolean(busy)} onClick={() => runTrashAction("purge", selectedOrders)}>
                      {busy === "purge" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete forever
                    </AdminButton>
                  </>
                ) : (
                  <AdminButton size="sm" variant="danger" disabled={Boolean(busy)} onClick={() => runTrashAction("trash", selectedOrders)}>
                    {busy === "trash" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Move to trash
                  </AdminButton>
                ))}
              </div>
            </div>
          )}

          {notice && (
            <div className="mt-3" aria-live="polite">
              <Notice tone={notice.tone} icon={notice.tone === "green" ? CheckCircle2 : AlertCircle}>
                {notice.text}
                {notice.undo && (
                  <button type="button" onClick={() => runTrashAction("restore", notice.undo, { confirmed: true })} className="ml-3 font-semibold underline underline-offset-2">
                    Undo
                  </button>
                )}
              </Notice>
            </div>
          )}

          {inTrash && !loading && !error && (
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Orders in the trash are hidden from the order list and totals. Restore them any time, or delete them forever.
            </p>
          )}

          <div className="mt-5">
            {loading ? (
              <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-[var(--color-muted)]" /></div>
            ) : error ? (
              <Notice tone="red" icon={AlertCircle}>{error}</Notice>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] py-20 text-center">
                <Package className="mx-auto h-9 w-9 text-[var(--color-muted)]" />
                <p className="mt-3 font-serif text-2xl">{inTrash ? "The trash is empty" : "No orders here"}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{normalizedQuery ? "Try a different search." : inTrash ? "Orders you move to the trash will appear here." : "Orders with this status will appear here."}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSaved={handleSaved}
                    defaultOpen={!inTrash && (order.status || "Pending") === "Pending"}
                    selected={selected.has(order.id)}
                    onToggleSelect={toggleSelect}
                    onTrashAction={(action, target) => runTrashAction(action, [target])}
                    onDownload={(target) => downloadPdf([target])}
                    inTrash={inTrash}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
