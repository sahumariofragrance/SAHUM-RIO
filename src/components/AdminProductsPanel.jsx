import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Pencil, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatINR } from "../utils/money";

const emptyForm = { id: null, name: "", slug: "", description: "", price: "", alt: "", notes: "", image_url: "", active: true, display_order: 0 };

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminProductsPanel() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    const { data, error: queryError } = await supabase.from("products").select("*").order("display_order", { ascending: true }).order("id", { ascending: true });
    if (queryError) setError(queryError.message); else setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const nextOrder = useMemo(() => products.reduce((max, product) => Math.max(max, Number(product.display_order || 0)), 0) + 10, [products]);

  function reset() {
    setForm({ ...emptyForm, display_order: nextOrder }); setFile(null); setMessage(""); setError("");
  }

  function edit(product) {
    setForm({
      id: product.id, name: product.name || "", slug: product.slug || "", description: product.description || "",
      price: String(product.price ?? ""), alt: product.alt || "", notes: product.notes || "", image_url: product.image_url || "",
      active: Boolean(product.active), display_order: Number(product.display_order || 0),
    });
    setFile(null); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(productSlug) {
    if (!file) return form.image_url;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Image must be 10 MB or smaller.");
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const objectName = productSlug + "-" + Date.now() + "." + extension;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(objectName, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("product-images").getPublicUrl(objectName);
    return data.publicUrl;
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const name = form.name.trim(); const slug = slugify(form.slug || name); const price = Number(form.price);
      if (!name || !slug || !form.description.trim() || !Number.isFinite(price) || price <= 0) throw new Error("Name, description, slug, and a valid price are required.");
      const imageUrl = await uploadImage(slug);
      if (!imageUrl) throw new Error("Please upload a product image.");
      const { data: userData } = await supabase.auth.getUser(); const user = userData?.user;
      const payload = {
        name, slug, description: form.description.trim(), price, image_url: imageUrl,
        alt: form.alt.trim() || name + " perfume bottle", notes: form.notes.trim() || null,
        active: Boolean(form.active), display_order: Number(form.display_order || 0),
        updated_at: new Date().toISOString(), updated_by: user?.id || null,
      };
      let result;
      if (form.id) result = await supabase.from("products").update(payload).eq("id", form.id).select("*").single();
      else result = await supabase.from("products").insert({ ...payload, created_by: user?.id || null }).select("*").single();
      if (result.error) throw result.error;
      setMessage(form.id ? "Product updated." : "Product added to the catalogue."); setFile(null);
      await load();
      if (!form.id) setForm({ ...emptyForm, display_order: nextOrder + 10 });
    } catch (err) { setError(err?.message || "Unable to save product."); }
    finally { setSaving(false); }
  }

  async function toggleActive(product) {
    setError("");
    const { error: updateError } = await supabase.from("products").update({ active: !product.active, updated_at: new Date().toISOString() }).eq("id", product.id);
    if (updateError) setError(updateError.message); else await load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={save} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Catalogue editor</p><h2 className="mt-1 font-serif text-2xl font-semibold">{form.id ? "Edit perfume" : "Add perfume"}</h2></div>
          {form.id && <button type="button" onClick={reset} className="text-sm font-medium text-amber-700">New product</button>}
        </div>
        {error && <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {message && <div className="mt-4 flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}
        <div className="mt-5 space-y-4">
          <label className="block text-sm">Name<input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" required /></label>
          <label className="block text-sm">URL slug<input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" required /></label>
          <label className="block text-sm">Description<textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">Price (₹)<input type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" required /></label>
            <label className="block text-sm">Display order<input type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          </div>
          <label className="block text-sm">Image alt text<input value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          <label className="block text-sm">Fragrance notes / internal notes<textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          <label className="block text-sm">Product image<div className="mt-1 rounded-xl border border-dashed border-[var(--color-border)] p-4"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />{form.image_url && !file && <img src={form.image_url} alt="" className="mt-3 h-28 w-24 rounded-lg object-cover" />}{file && <p className="mt-2 text-xs text-[var(--color-muted)]">{file.name}</p>}</div></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />Visible in store</label>
        </div>
        <button disabled={saving} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#24160f] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}{form.id ? "Save product" : "Add product"}</button>
      </form>

      <div>
        <div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl font-semibold">Current catalogue</h2><p className="mt-1 text-sm text-[var(--color-muted)]">{products.length} product{products.length === 1 ? "" : "s"}</p></div><button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium"><RefreshCw className="h-4 w-4" />Refresh</button></div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <div className="mt-5 space-y-3">
            {products.map((product) => (
              <article key={product.id} className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <img src={product.image_url} alt={product.alt || product.name} className="h-24 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{product.name}</h3><p className="text-xs text-[var(--color-muted)]">/product/{product.slug}</p></div><span className="font-semibold">{formatINR(product.price)}</span></div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{product.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => edit(product)} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => toggleActive(product)} className={product.active ? "rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700" : "rounded-full bg-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700"}>{product.active ? "Visible" : "Hidden"}</button></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
