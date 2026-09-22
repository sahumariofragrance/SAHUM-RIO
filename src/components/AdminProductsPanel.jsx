import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Loader2, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatINR } from "../utils/money";
import { useProducts } from "../context/ProductsContext";

const MAX_PRODUCT_IMAGES = 5;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  price: "",
  alt: "",
  notes: "",
  size_volume: "",
  fragrance_family: "",
  scent_profile: "",
  occasion: "",
  image_url: "",
  active: false,
  display_order: 0,
};

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function galleryPath(slug, index) {
  return `gallery/${slug}/${index + 1}`;
}

export default function AdminProductsPanel() {
  const { refreshProducts } = useProducts();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
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

  useEffect(() => () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const nextOrder = useMemo(() => products.reduce((max, product) => Math.max(max, Number(product.display_order || 0)), 0) + 10, [products]);

  useEffect(() => {
    if (!loading && !form.id && !form.name && Number(form.display_order || 0) === 0) {
      setForm((current) => ({ ...current, display_order: nextOrder }));
    }
  }, [loading, nextOrder, form.id, form.name, form.display_order]);

  function reset() {
    setForm({ ...emptyForm, display_order: nextOrder }); setFiles([]); setMessage(""); setError("");
  }

  function edit(product) {
    setForm({
      id: product.id, name: product.name || "", slug: product.slug || "", description: product.description || "",
      price: String(product.price ?? ""), alt: product.alt || "", notes: product.notes || "", image_url: product.image_url || "",
      size_volume: product.size_volume || "", fragrance_family: product.fragrance_family || "",
      scent_profile: product.scent_profile || "", occasion: product.occasion || "",
      active: Boolean(product.active), display_order: Number(product.display_order || 0),
    });
    setFiles([]); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    setError("");

    if (selected.length > MAX_PRODUCT_IMAGES) {
      event.target.value = "";
      setFiles([]);
      setError("Choose a maximum of 5 product images.");
      return;
    }

    const invalidType = selected.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      event.target.value = "";
      setFiles([]);
      setError("Use JPG, PNG, or WebP images only.");
      return;
    }

    const tooLarge = selected.find((file) => file.size > MAX_IMAGE_SIZE);
    if (tooLarge) {
      event.target.value = "";
      setFiles([]);
      setError("Each image must be 10 MB or smaller.");
      return;
    }

    setFiles(selected);
  }

  function makeThumbnail(index) {
    if (index <= 0 || index >= files.length) return;
    setFiles((current) => {
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  }

  function moveGalleryImage(index, direction) {
    setFiles((current) => {
      const target = index + direction;
      if (index <= 0 || target <= 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadGallery(productSlug) {
    if (!files.length) return form.image_url;

    const paths = Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => galleryPath(productSlug, index));
    const { error: cleanupError } = await supabase.storage.from("product-images").remove(paths);
    if (cleanupError) throw cleanupError;

    let primaryUrl = "";
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const objectName = galleryPath(productSlug, index);
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(objectName, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(objectName);
      if (index === 0) primaryUrl = data.publicUrl;
    }

    return primaryUrl;
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const name = form.name.trim(); const slug = slugify(form.slug || name); const price = Number(form.price);
      if (!name || !slug || !form.description.trim() || !Number.isFinite(price) || price <= 0) throw new Error("Name, description, slug, and a valid price are required.");
      if (!form.id && !files.length && !form.image_url) throw new Error("Please upload at least one product image.");

      const imageUrl = await uploadGallery(slug);
      if (!imageUrl) throw new Error("Please upload at least one product image.");

      const { data: userData } = await supabase.auth.getUser(); const user = userData?.user;
      const payload = {
        name, slug, description: form.description.trim(), price, image_url: imageUrl,
        alt: form.alt.trim() || name + " Eau de Parfum bottle",
        notes: form.notes.trim() || null,
        size_volume: form.size_volume.trim() || null,
        fragrance_family: form.fragrance_family.trim() || null,
        scent_profile: form.scent_profile.trim() || null,
        occasion: form.occasion.trim() || null,
        active: Boolean(form.active), display_order: Number(form.display_order || 0),
        updated_at: new Date().toISOString(), updated_by: user?.id || null,
      };
      let result;
      if (form.id) result = await supabase.from("products").update(payload).eq("id", form.id).select("*").single();
      else result = await supabase.from("products").insert({ ...payload, created_by: user?.id || null }).select("*").single();
      if (result.error) throw result.error;

      const savedProduct = result.data;
      const galleryMessage = files.length > 1 ? ` ${files.length} images saved.` : files.length === 1 ? " 1 image saved." : "";
      setMessage(form.id ? `Product updated. ID: ${savedProduct.id}.${galleryMessage}` : `Product added to the catalogue with ID ${savedProduct.id}.${galleryMessage}`);
      setFiles([]);
      await load();
      await refreshProducts();
      if (!form.id) setForm({ ...emptyForm, display_order: nextOrder + 10 });
      else setForm((current) => ({ ...current, image_url: savedProduct.image_url }));
    } catch (err) { setError(err?.message || "Unable to save product."); }
    finally { setSaving(false); }
  }

  async function toggleActive(product) {
    setError("");
    const { error: updateError } = await supabase.from("products").update({ active: !product.active, updated_at: new Date().toISOString() }).eq("id", product.id);
    if (updateError) setError(updateError.message); else { await load(); await refreshProducts(); }
  }

  async function removeProduct(product) {
    if (!window.confirm("Delete " + product.name + "? This cannot be undone.")) return;
    setError("");
    try {
      const { error: deleteError } = await supabase.from("products").delete().eq("id", product.id);
      if (deleteError) throw deleteError;

      const cleanupObjects = Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => galleryPath(product.slug, index));
      const marker = "/storage/v1/object/public/product-images/";
      const imageUrl = String(product.image_url || "");
      if (imageUrl.includes(marker)) {
        const currentPrimaryObject = decodeURIComponent(imageUrl.split(marker)[1] || "");
        if (currentPrimaryObject) cleanupObjects.push(currentPrimaryObject);
      }

      const uniqueObjects = [...new Set(cleanupObjects.filter(Boolean))];
      if (uniqueObjects.length) {
        const { error: storageError } = await supabase.storage.from("product-images").remove(uniqueObjects);
        if (storageError) console.warn("Product image cleanup failed", storageError.message);
      }

      if (form.id === product.id) reset();
      await load();
      await refreshProducts();
      setMessage("Product deleted.");
    } catch (err) {
      setError(err?.message || "Unable to delete product.");
    }
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Size / volume<input value={form.size_volume} maxLength={80} onChange={(e) => setForm((p) => ({ ...p, size_volume: e.target.value }))} placeholder="For example: 50 ml" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
            <label className="block text-sm">Fragrance family<input value={form.fragrance_family} maxLength={120} onChange={(e) => setForm((p) => ({ ...p, fragrance_family: e.target.value }))} placeholder="Add only when confirmed" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          </div>
          <label className="block text-sm">Scent profile<input value={form.scent_profile} maxLength={240} onChange={(e) => setForm((p) => ({ ...p, scent_profile: e.target.value }))} placeholder="A concise, verified scent description" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          <label className="block text-sm">Occasion<input value={form.occasion} maxLength={160} onChange={(e) => setForm((p) => ({ ...p, occasion: e.target.value }))} placeholder="Add only when confirmed" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          <label className="block text-sm">Image alt text<input value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /></label>
          <label className="block text-sm">Fragrance notes<textarea value={form.notes} maxLength={500} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Enter the actual fragrance notes only" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5" /><span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">Optional details appear on the product page only when filled in.</span></label>

          <label className="block text-sm">
            Product gallery
            <div className="mt-1 rounded-xl border border-dashed border-[var(--color-border)] p-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={selectImages}
                className="block w-full text-sm"
              />
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Choose up to 5 images. Select the thumbnail, then arrange the remaining images in the order you want them to appear. Uploading new images replaces this perfume’s existing gallery.
              </p>

              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    <span className="font-semibold text-[var(--color-text)]">Gallery order:</span> image 1 is the collection thumbnail and opens first on the product page.
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {files.map((selectedFile, index) => (
                      <div
                        key={selectedFile.name + selectedFile.size + selectedFile.lastModified}
                        className={"overflow-hidden rounded-xl border p-2 " + (index === 0 ? "border-amber-500 bg-amber-500/5" : "border-[var(--color-border)]")}
                      >
                        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[var(--color-surface-muted)]">
                          <img
                            src={previewUrls[index]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-semibold text-white">
                            {index === 0 ? "Thumbnail" : `Image ${index + 1}`}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-xs text-[var(--color-muted)]" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          {index === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-600">
                              <Star className="h-3 w-3 fill-current" />
                              Thumbnail
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => makeThumbnail(index)}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:border-amber-500 hover:text-amber-600"
                            >
                              <Star className="h-3 w-3" />
                              Make thumbnail
                            </button>
                          )}

                          {index > 0 && (
                            <div className="ml-auto flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveGalleryImage(index, -1)}
                                disabled={index === 1}
                                className="rounded-md border border-[var(--color-border)] p-1.5 transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label={`Move ${selectedFile.name} earlier`}
                                title="Move earlier"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGalleryImage(index, 1)}
                                disabled={index === files.length - 1}
                                className="rounded-md border border-[var(--color-border)] p-1.5 transition hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label={`Move ${selectedFile.name} later`}
                                title="Move later"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.image_url && files.length === 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[var(--color-muted)]">Current primary image</p>
                  <img src={form.image_url} alt="" className="h-32 w-28 rounded-lg object-cover" />
                  {form.id && <p className="mt-2 text-xs text-[var(--color-muted)]">Leave the file picker empty to keep the existing gallery unchanged.</p>}
                </div>
              )}
            </div>
          </label>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />Visible in store</label>
          {!form.id && <p className="text-xs leading-5 text-[var(--color-muted)]">New products start hidden by default. Turn on “Visible in store” only when the listing is ready.</p>}
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
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{product.name}</h3><p className="text-xs text-[var(--color-muted)]">Product ID {product.id} · /product/{product.slug}</p></div><span className="font-semibold">{formatINR(product.price)}</span></div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{product.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => edit(product)} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />Edit</button><button onClick={() => toggleActive(product)} className={product.active ? "rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700" : "rounded-full bg-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700"}>{product.active ? "Visible" : "Hidden"}</button><button onClick={() => removeProduct(product)} className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</button></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
