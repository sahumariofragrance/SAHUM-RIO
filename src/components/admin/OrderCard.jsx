import React, { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronDown, Copy, Download, Loader2, Mail, MessageCircle, Phone, RotateCcw, Trash2, Truck, XCircle } from "lucide-react";
import { updateAdminOrder } from "../../lib/adminOrders";
import { formatINR } from "../../utils/money";
import { AdminButton, Field, Notice, ORDER_FLOW, ORDER_STATUSES, StatusPill, inputClass } from "./AdminUI";

// The next step offered for each status; anything else is under "Change status manually".
const NEXT_ACTIONS = {
  Pending: [{ status: "Accepted", label: "Accept order", icon: CheckCircle2, variant: "primary" }, { status: "Rejected", label: "Reject", icon: XCircle, variant: "danger", confirm: true }],
  Accepted: [{ status: "Processing", label: "Start processing", variant: "primary" }, { status: "Shipped", label: "Mark shipped", icon: Truck, variant: "secondary" }],
  Processing: [{ status: "Shipped", label: "Mark shipped", icon: Truck, variant: "primary" }],
  Shipped: [{ status: "Delivered", label: "Mark delivered", icon: CheckCircle2, variant: "primary" }],
};

const EMAIL_RESULTS = {
  already_notified: "The customer was already emailed about this status.",
  status_unchanged: "Details saved.",
};

function relativeTime(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function shortId(id) {
  return String(id || "").replace(/^order_/, "");
}

function whatsappLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

function ProgressSteps({ status }) {
  if (status === "Rejected" || status === "Cancelled") {
    return <Notice tone={status === "Rejected" ? "red" : "stone"} icon={XCircle}>This order was {status.toLowerCase()}.</Notice>;
  }
  const current = Math.max(0, ORDER_FLOW.indexOf(status));
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Order progress">
      {ORDER_FLOW.map((step, index) => (
        <li key={step} className="min-w-0">
          <div className={`h-1 rounded-full ${index <= current ? "bg-[var(--color-text)]" : "bg-[var(--color-border)]"}`} />
          <div className={`mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] ${index === current ? "" : "hidden sm:block"} ${index <= current ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}`}>
            {step}
          </div>
        </li>
      ))}
    </ol>
  );
}

// onTrashAction(action, order): "trash" | "restore" | "purge"; the dashboard confirms and runs it.
export default function OrderCard({ order, onSaved, defaultOpen = false, selected = false, onToggleSelect, onTrashAction, onDownload, inTrash = false }) {
  const uid = useId();
  const courierRef = useRef(null);
  const [open, setOpen] = useState(defaultOpen);
  const [manualStatus, setManualStatus] = useState(order.status || "Pending");
  const [courier, setCourier] = useState(order.courier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || "");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setManualStatus(order.status || "Pending");
    setCourier(order.courier || "");
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
  }, [order]);

  const status = order.status || "Pending";
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const itemSummary = items.map((item) => `${item.name || "Item"}${Number(item.qty || 1) > 1 ? ` ×${item.qty}` : ""}`).join(", ");
  const fullAddress = [address.address, address.city, address.state, address.pin].filter(Boolean).join(", ");
  const detailsChanged =
    courier !== (order.courier || "") || trackingNumber !== (order.tracking_number || "") || trackingUrl !== (order.tracking_url || "");
  const whatsapp = whatsappLink(address.phone);

  async function save(nextStatus, { confirm = false } = {}) {
    setError("");
    setResult(null);
    if (confirm && !window.confirm(`${nextStatus === "Rejected" ? "Reject" : "Change"} order ${shortId(order.id)}? The customer will be emailed.`)) return;
    if (nextStatus === "Shipped" && (!courier.trim() || !trackingNumber.trim())) {
      setError("Add the courier and tracking number before marking this order as shipped.");
      courierRef.current?.focus();
      return;
    }
    if (trackingUrl.trim() && !/^https:\/\//i.test(trackingUrl.trim())) {
      setError("The tracking link must start with https://");
      return;
    }
    setSaving(nextStatus);
    try {
      const { order: updated, email } = await updateAdminOrder(order.id, {
        status: nextStatus,
        courier: courier.trim() || null,
        tracking_number: trackingNumber.trim() || null,
        tracking_url: trackingUrl.trim() || null,
      });
      const statusChanged = updated.status !== status;
      if (email?.sent) setResult({ tone: "green", text: `Marked ${updated.status}. The customer has been emailed.` });
      else if (statusChanged && !EMAIL_RESULTS[email?.reason]) setResult({ tone: "amber", text: `Marked ${updated.status}, but the customer email could not be sent.` });
      else setResult({ tone: "green", text: statusChanged ? `Marked ${updated.status}. ${EMAIL_RESULTS[email?.reason] || ""}` : EMAIL_RESULTS.status_unchanged });
      onSaved(updated);
    } catch (err) {
      setError(err?.message || "Unable to update this order.");
    } finally {
      setSaving("");
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText([address.name, fullAddress, address.phone].filter(Boolean).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article className={`overflow-hidden rounded-2xl border bg-[var(--color-surface)] transition ${selected ? "border-[var(--color-text)]/60" : open ? "border-[var(--color-text)]/25 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.45)]" : "border-[var(--color-border)] hover:border-[var(--color-text)]/25"}`}>
      <div className="flex items-stretch">
      {onToggleSelect && (
        <label className="flex shrink-0 cursor-pointer items-center pl-4 pr-1" title="Select order">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(order.id)}
            aria-label={`Select order ${shortId(order.id)}`}
            className="h-4 w-4 cursor-pointer accent-[var(--color-text)]"
          />
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`${uid}-details`}
        className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 text-left md:grid-cols-[7.5rem_minmax(0,1.3fr)_minmax(0,1fr)_6.5rem_1.25rem]"
      >
        <div className="md:order-none"><StatusPill status={status} /></div>
        <div className="col-span-2 min-w-0 md:col-span-1">
          <div className="truncate font-semibold">{address.name || "Customer"}</div>
          <div className="truncate text-xs text-[var(--color-muted)]">
            <span className="font-mono">#{shortId(order.id)}</span> · {relativeTime(order.created_at)}
          </div>
        </div>
        <div className="col-span-2 min-w-0 text-sm text-[var(--color-muted)] md:col-span-1">
          <div className="truncate">{itemSummary || "No items"}</div>
          <div className="truncate text-xs">{[address.city, address.state].filter(Boolean).join(", ")}</div>
        </div>
        <div className="row-start-1 col-start-2 text-right md:row-auto md:col-auto">
          <div className="font-semibold">{formatINR(order.total ?? order.subtotal ?? 0)}</div>
          <div className="text-xs text-[var(--color-muted)]">{itemCount} item{itemCount === 1 ? "" : "s"}</div>
        </div>
        <ChevronDown className={`hidden h-5 w-5 text-[var(--color-muted)] transition md:block ${open ? "rotate-180" : ""}`} />
      </button>
      </div>

      {open && (
        <div id={`${uid}-details`} className="border-t border-[var(--color-border)]">
          <div className="grid gap-px bg-[var(--color-border)] lg:grid-cols-[1fr_1fr_1.25fr]">
            <section className="bg-[var(--color-surface)] p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Customer</h3>
              <div className="mt-3 text-sm leading-6">
                <div className="font-semibold">{address.name || "Name unavailable"}</div>
                {fullAddress && <p className="mt-1 text-[var(--color-muted)]">{fullAddress}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {address.phone && <a href={`tel:${address.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-surface-muted)]"><Phone className="h-3.5 w-3.5" />{address.phone}</a>}
                {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-surface-muted)]"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
                {address.email && <a href={`mailto:${address.email}`} className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-surface-muted)]"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{address.email}</span></a>}
                {fullAddress && <button type="button" onClick={copyAddress} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 text-xs font-semibold hover:bg-[var(--color-surface-muted)]">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy address"}</button>}
              </div>
            </section>

            <section className="bg-[var(--color-surface)] p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Items</h3>
              <ul className="mt-3 divide-y divide-[var(--color-border)] text-sm">
                {items.map((item, index) => (
                  <li key={`${item.name || "item"}-${index}`} className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
                    <span className="min-w-0"><span className="font-medium">{item.name || "Item"}</span> <span className="text-[var(--color-muted)]">× {item.qty || 1}</span></span>
                    <span className="shrink-0 tabular-nums">{formatINR(Number(item.qty || 1) * Number(item.price || 0))}</span>
                  </li>
                ))}
              </ul>
              {Number(order.discount_amount) > 0 && (
                <div className="mt-3 flex items-baseline justify-between text-sm text-green-700">
                  <span>Discount{order.discount_code ? ` · ${order.discount_code}` : ""}</span>
                  <span className="tabular-nums">−{formatINR(order.discount_amount)}</span>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between border-t border-[var(--color-border)] pt-3 text-sm">
                <span className="text-[var(--color-muted)]">Total paid</span>
                <span className="font-serif text-2xl leading-none">{formatINR(order.total ?? order.subtotal ?? 0)}</span>
              </div>
              <dl className="mt-4 space-y-1 text-xs text-[var(--color-muted)]">
                <div className="flex justify-between gap-3"><dt>Placed</dt><dd>{order.created_at ? new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt>Order ID</dt><dd className="truncate font-mono">{order.id}</dd></div>
                {(order.razorpay_payment_id || order.payment_id) && <div className="flex justify-between gap-3"><dt>Payment</dt><dd className="truncate font-mono">{order.razorpay_payment_id || order.payment_id}</dd></div>}
              </dl>
            </section>

            <section className="bg-[var(--color-surface)] p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Fulfilment</h3>
              <div className="mt-3"><ProgressSteps status={status} /></div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Courier" htmlFor={`${uid}-courier`}>
                  <input id={`${uid}-courier`} ref={courierRef} value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. Delhivery" className={inputClass} />
                </Field>
                <Field label="Tracking number" htmlFor={`${uid}-awb`}>
                  <input id={`${uid}-awb`} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="AWB / consignment no." className={inputClass} />
                </Field>
                <Field label="Tracking link" htmlFor={`${uid}-url`} className="sm:col-span-2">
                  <input id={`${uid}-url`} type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://" className={inputClass} />
                </Field>
              </div>

              <div className="mt-4 space-y-2" aria-live="polite">
                {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
                {result && <Notice tone={result.tone} icon={result.tone === "green" ? CheckCircle2 : AlertCircle}>{result.text}</Notice>}
              </div>

              {inTrash ? (
                <p className="mt-4 text-xs text-[var(--color-muted)]">Restore this order to change its status or tracking details.</p>
              ) : (<>
              <div className="mt-4 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[status] || []).map((action) => {
                  const Icon = action.icon;
                  return (
                    <AdminButton key={action.status} variant={action.variant} disabled={Boolean(saving)} onClick={() => save(action.status, { confirm: action.confirm })}>
                      {saving === action.status ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
                      {action.label}
                    </AdminButton>
                  );
                })}
                {detailsChanged && (
                  <AdminButton variant="ghost" disabled={Boolean(saving)} onClick={() => save(status)}>
                    {saving === status ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save tracking details
                  </AdminButton>
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--color-muted)]">The customer is emailed automatically whenever the status changes.</p>

              <details className="group mt-4 rounded-xl border border-[var(--color-border)] px-3.5 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-semibold text-[var(--color-muted)] marker:hidden">
                  <span className="inline-flex items-center gap-1">Change status manually <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></span>
                </summary>
                <div className="mt-3 flex gap-2">
                  <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)} aria-label="Order status" className={`${inputClass} h-10 py-0`}>
                    {ORDER_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                  <AdminButton variant="secondary" disabled={Boolean(saving) || manualStatus === status} onClick={() => save(manualStatus, { confirm: true })}>
                    Apply
                  </AdminButton>
                </div>
              </details>
              </>)}
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
            {onDownload && (
              <AdminButton size="sm" variant="ghost" onClick={() => onDownload(order)}>
                <Download className="h-3.5 w-3.5" />Download PDF
              </AdminButton>
            )}
            {onTrashAction && (inTrash ? (
              <>
                <span className="mr-auto text-xs text-[var(--color-muted)]">
                  In the trash since {order.deleted_at ? new Date(order.deleted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                </span>
                <AdminButton size="sm" variant="secondary" onClick={() => onTrashAction("restore", order)}>
                  <RotateCcw className="h-3.5 w-3.5" />Restore order
                </AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => onTrashAction("purge", order)}>
                  <Trash2 className="h-3.5 w-3.5" />Delete forever
                </AdminButton>
              </>
            ) : (
              <AdminButton size="sm" variant="danger" className="ml-auto" onClick={() => onTrashAction("trash", order)}>
                <Trash2 className="h-3.5 w-3.5" />Move to trash
              </AdminButton>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
