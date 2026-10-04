import React, { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminButton, Field, Notice, inputClass } from "./AdminUI";
import { formatINR } from "../../utils/money";

const CODE_PATTERN = /^[A-Z0-9]{3,20}$/;
const emptyForm = { code: "", percent: "10", expires: "", note: "" };

function expiryLabel(value) {
  if (!value) return "No expiry";
  const date = new Date(value);
  const text = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return date.getTime() <= Date.now() ? `Expired ${text}` : `Until ${text}`;
}

function isExpired(value) {
  return Boolean(value) && new Date(value).getTime() <= Date.now();
}

/** Admin → Discounts: public percentage codes, each customer once. */
export default function AdminDiscountsPanel() {
  const [codes, setCodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase.rpc("admin_discount_codes");
    if (loadError) {
      const missing = loadError.code === "PGRST202" || /admin_discount_codes/.test(loadError.message || "");
      setStatus(missing ? "missing" : "error");
      return;
    }
    setCodes(Array.isArray(data) ? data : []);
    setStatus("ready");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault();
    setError(""); setMessage("");
    const code = form.code.trim().toUpperCase();
    const percent = Number(form.percent);
    if (!CODE_PATTERN.test(code)) { setError("Use 3–20 letters or numbers, no spaces (e.g. WELCOME10)."); return; }
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) { setError("Discount must be a whole number from 1 to 90%."); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("discount_codes").insert({
      code,
      percent,
      // The code works until the end of the chosen day, Indian time.
      expires_at: form.expires ? `${form.expires}T23:59:59+05:30` : null,
      note: form.note.trim() || null,
      created_by: userData?.user?.id || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.code === "23505" ? `${code} already exists. Choose another code.` : insertError.message);
      return;
    }
    setForm(emptyForm);
    setMessage(`${code} created — ${percent}% off, each customer once.`);
    load();
  }

  async function toggle(row) {
    setError(""); setMessage("");
    const { error: updateError } = await supabase.from("discount_codes").update({ active: !row.active }).eq("id", row.id);
    if (updateError) setError(updateError.message);
    else load();
  }

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setMessage(`${code} copied.`); } catch { /* clipboard blocked */ }
  }

  if (status === "missing") {
    return <Notice tone="amber">Discount codes aren’t switched on yet. Run the discount-codes SQL in Supabase (SQL Editor), then refresh.</Notice>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form onSubmit={create} className="space-y-4 self-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-serif text-2xl">New discount code</h2>
        <p className="text-xs leading-5 text-[var(--color-muted)]">Anyone can use the code once. A customer’s email or phone number can’t use the same code twice.</p>
        <Field label="Code" htmlFor="discount-code-new" hint="Letters and numbers only, e.g. WELCOME10 or DIWALI15.">
          <input id="discount-code-new" value={form.code} maxLength={20} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} placeholder="WELCOME10" className={`${inputClass} uppercase tracking-wide`} />
        </Field>
        <Field label="Discount (%)" htmlFor="discount-percent">
          <input id="discount-percent" type="number" min="1" max="90" step="1" value={form.percent} onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))} className={inputClass} />
        </Field>
        <Field label="Expires on (optional)" htmlFor="discount-expires" hint="Works until the end of this day. Leave empty for no expiry.">
          <input id="discount-expires" type="date" value={form.expires} onChange={(e) => setForm((f) => ({ ...f, expires: e.target.value }))} className={inputClass} />
        </Field>
        <Field label="Note (optional)" htmlFor="discount-note" hint="Only you see this, e.g. 'Instagram ad, October'.">
          <input id="discount-note" value={form.note} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className={inputClass} />
        </Field>
        <AdminButton type="submit" variant="primary" disabled={saving} className="w-full justify-center">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create code
        </AdminButton>
      </form>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Your codes</h2>
          <AdminButton variant="secondary" onClick={load} aria-label="Refresh codes"><RefreshCw className="h-4 w-4" /></AdminButton>
        </div>
        {message && <div className="mt-4"><Notice tone="green">{message}</Notice></div>}
        {error && <div className="mt-4"><Notice tone="red">{error}</Notice></div>}
        {status === "error" && <p className="mt-4 text-sm text-[var(--color-muted)]">Couldn’t load codes. Please refresh.</p>}
        {status === "ready" && codes.length === 0 && <p className="mt-4 text-sm text-[var(--color-muted)]">No codes yet. Create your first one on the left.</p>}
        <ul className="mt-4 space-y-3">
          {codes.map((row) => {
            const expired = isExpired(row.expires_at);
            const live = row.active && !expired;
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="min-w-[10rem] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-semibold tracking-wide">{row.code}</span>
                    <button type="button" onClick={() => copy(row.code)} className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-text)]" aria-label={`Copy ${row.code}`} title="Copy code"><Copy className="h-3.5 w-3.5" /></button>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${live ? "bg-green-100 text-green-800" : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]"}`}>{live ? "Active" : expired ? "Expired" : "Off"}</span>
                  </div>
                  <p className="mt-1 text-sm">{row.percent}% off · {expiryLabel(row.expires_at)}</p>
                  {row.note && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{row.note}</p>}
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold tabular-nums">{Number(row.uses)} use{Number(row.uses) === 1 ? "" : "s"}</div>
                  <div className="text-xs text-[var(--color-muted)]">{formatINR(row.total_discount || 0)} given</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.active}
                  aria-label={`${row.code} ${row.active ? "on" : "off"}`}
                  onClick={() => toggle(row)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${row.active ? "bg-[var(--color-text)]" : "bg-[var(--color-border)]"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-bg)] shadow transition ${row.active ? "left-[1.375rem]" : "left-0.5"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
