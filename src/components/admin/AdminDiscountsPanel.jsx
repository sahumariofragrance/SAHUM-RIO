import React, { useCallback, useEffect, useState } from "react";
import { Copy, Globe, Loader2, Pencil, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminButton, Field, Notice, inputClass } from "./AdminUI";
import AdminOfferCard from "./AdminOfferCard";
import AdminSpinWheelCard from "./AdminSpinWheelCard";
import { formatINR } from "../../utils/money";

const CODE_PATTERN = /^[A-Z0-9]{3,20}$/;
const emptyForm = { code: "", percent: "10", expires: "", note: "" };

function expiryLabel(value) {
  if (!value) return "No expiry";
  const date = new Date(value);
  const text = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return date.getTime() <= Date.now() ? `Expired ${text}` : `Until ${text}`;
}

// The date input's value (YYYY-MM-DD) for a stored expiry, in Indian time.
function expiryDateValue(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function isExpired(value) {
  return Boolean(value) && new Date(value).getTime() <= Date.now();
}

/** Admin → Discounts: public percentage codes, each customer once. */
export default function AdminDiscountsPanel() {
  const [codes, setCodes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  // The code being edited in the form on the left, or null for a new code.
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
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

  function startEdit(row) {
    setError(""); setMessage("");
    setEditing(row);
    setForm({ code: row.code, percent: String(row.percent), expires: expiryDateValue(row.expires_at), note: row.note || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function save(event) {
    event.preventDefault();
    setError(""); setMessage("");
    const code = form.code.trim().toUpperCase();
    const percent = Number(form.percent);
    if (!CODE_PATTERN.test(code)) { setError("Use 3–20 letters or numbers, no spaces (e.g. WELCOME10)."); return; }
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) { setError("Discount must be a whole number from 1 to 90%."); return; }
    if (editing) { await update(code, percent); return; }
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

  async function update(code, percent) {
    setSaving(true);
    const changes = {
      percent,
      expires_at: form.expires ? `${form.expires}T23:59:59+05:30` : null,
      note: form.note.trim() || null,
    };
    // A used code keeps its name: orders and the one-use-per-customer check refer to it.
    if (Number(editing.uses) === 0) changes.code = code;
    const { error: updateError } = await supabase.from("discount_codes").update(changes).eq("id", editing.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.code === "23505" ? `${code} already exists. Choose another code.` : updateError.message);
      return;
    }
    const name = changes.code || editing.code;
    setEditing(null);
    setForm(emptyForm);
    setMessage(`${name} saved — ${percent}% off · ${expiryLabel(changes.expires_at)}.`);
    load();
  }

  async function remove(row) {
    setError(""); setMessage("");
    if (!window.confirm(`Delete ${row.code}? This can't be undone.`)) return;
    setDeletingId(row.id);
    const { error: deleteError } = await supabase.rpc("admin_delete_discount_code", { p_id: row.id });
    setDeletingId(null);
    if (deleteError) {
      const missing = deleteError.code === "PGRST202" || /admin_delete_discount_code/.test(deleteError.message || "");
      setError(missing ? "Deleting codes isn’t switched on yet. Run the delete-discount-code SQL in Supabase (SQL Editor), then try again." : deleteError.message);
      return;
    }
    if (editing?.id === row.id) cancelEdit();
    setMessage(`${row.code} deleted.`);
    load();
  }

  async function toggle(row) {
    setError(""); setMessage("");
    const { error: updateError } = await supabase.from("discount_codes").update({ active: !row.active }).eq("id", row.id);
    if (updateError) setError(updateError.message);
    else load();
  }

  // Only one code is promoted on the website at a time.
  async function toggleWebsite(row) {
    setError(""); setMessage("");
    if (!row.show_on_site) {
      const { error: clearError } = await supabase.from("discount_codes").update({ show_on_site: false }).eq("show_on_site", true).neq("id", row.id);
      if (clearError) { setError(clearError.message); return; }
    }
    const { error: updateError } = await supabase.from("discount_codes").update({ show_on_site: !row.show_on_site }).eq("id", row.id);
    if (updateError) { setError(updateError.message); return; }
    setMessage(row.show_on_site
      ? `${row.code} is no longer shown on the website.`
      : `${row.code} now shows on the website: top bar, homepage and perfume pages.`);
    load();
  }

  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setMessage(`${code} copied.`); } catch { /* clipboard blocked */ }
  }

  if (status === "missing") {
    return <Notice tone="amber">Discount codes aren’t switched on yet. Run the discount-codes SQL in Supabase (SQL Editor), then refresh.</Notice>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form onSubmit={save} className="space-y-4 self-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-serif text-2xl">{editing ? `Edit ${editing.code}` : "New discount code"}</h2>
        <p className="text-xs leading-5 text-[var(--color-muted)]">Anyone can use the code once. A customer’s email or phone number can’t use the same code twice.</p>
        <Field label="Code" htmlFor="discount-code-new" hint="Letters and numbers only, e.g. WELCOME10 or DIWALI15.">
          <input id="discount-code-new" value={form.code} disabled={Boolean(editing) && Number(editing.uses) > 0} title={editing && Number(editing.uses) > 0 ? "A code that has been used keeps its name." : undefined} maxLength={20} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} placeholder="WELCOME10" className={`${inputClass} uppercase tracking-wide`} />
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
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editing ? "Save changes" : "Create code"}
        </AdminButton>
        {editing && <AdminButton variant="ghost" onClick={cancelEdit} className="w-full justify-center">Cancel</AdminButton>}
      </form>

      <section>
        <div className="mb-8 space-y-8"><AdminOfferCard /><AdminSpinWheelCard /></div>
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
                  <button
                    type="button"
                    onClick={() => toggleWebsite(row)}
                    aria-pressed={Boolean(row.show_on_site)}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${row.show_on_site ? "admin-tone tone-amber" : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    {row.show_on_site ? (live ? "Shown on website" : "Shown on website (hidden while off/expired)") : "Show on website"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <AdminButton size="sm" onClick={() => startEdit(row)} aria-label={`Edit ${row.code}`}><Pencil className="h-3.5 w-3.5" />Edit</AdminButton>
                  <AdminButton
                    size="sm"
                    variant="danger"
                    onClick={() => remove(row)}
                    disabled={Number(row.uses) > 0 || deletingId === row.id}
                    aria-label={`Delete ${row.code}`}
                    title={Number(row.uses) > 0 ? "This code has been used, so it can't be deleted. Turn it off instead." : undefined}
                  >
                    {deletingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete
                  </AdminButton>
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
