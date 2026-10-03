import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, RefreshCw, Star, Trash2, Upload, X } from "lucide-react";
import { AdminButton, Field, Notice, inputClass } from "./admin/AdminUI";
import SafeImage from "./SafeImage";
import { compressImage } from "../utils/compressImage";
import { supabase } from "../lib/supabase";
import { formatINR } from "../utils/money";
import { useProducts } from "../context/ProductsContext";

const MAX_PRODUCT_IMAGES = 6;
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
  gallery_urls: [],
  active: false,
  display_order: 0,
};

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function galleryPath(slug, index, version = "") {
  return version
    ? `gallery/${slug}/${version}/${index + 1}`
    : `gallery/${slug}/${index + 1}`;
}

function fileKey(file) {
  return file ? `${file.name}::${file.size}::${file.lastModified}` : "";
}

// The edited gallery is one ordered list: photos already saved ("existing",
// by URL) and newly chosen files ("new"). Item 0 is the cover.
function existingItems(product) {
  const urls = Array.isArray(product.gallery_urls) && product.gallery_urls.length ? product.gallery_urls : [product.image_url];
  return [...new Set(urls.filter(Boolean))].map((url) => ({ key: url, kind: "existing", url }));
}

function storageObjectPath(publicUrl) {
  const marker = "/storage/v1/object/public/product-images/";
  const value = String(publicUrl || "");
  if (!value.includes(marker)) return "";
  return decodeURIComponent((value.split(marker)[1] || "").split("?")[0]);
}

function siblingGalleryPaths(publicUrl) {
  const objectPath = storageObjectPath(publicUrl);
  if (!objectPath.startsWith("gallery/")) return [];
  const slash = objectPath.lastIndexOf("/");
  if (slash < 0) return [];
  const parent = objectPath.slice(0, slash);
  return Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => `${parent}/${index + 1}`);
}

export default function AdminProductsPanel() {
  const { refreshProducts } = useProducts();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState([]);
  const previews = useRef(new Set());
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

  // Free the previews of chosen files when leaving the page.
  useEffect(() => () => {
    previews.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function releasePreview(item) {
    if (item?.kind !== "new") return;
    URL.revokeObjectURL(item.preview);
    previews.current.delete(item.preview);
  }

  function replaceGallery(next) {
    setGallery((current) => {
      current.filter((item) => !next.includes(item)).forEach(releasePreview);
      return next;
    });
  }

  const nextOrder = useMemo(() => products.reduce((max, product) => Math.max(max, Number(product.display_order || 0)), 0) + 10, [products]);

  useEffect(() => {
    if (!loading && !form.id && !form.name && Number(form.display_order || 0) === 0) {
      setForm((current) => ({ ...current, display_order: nextOrder }));
    }
  }, [loading, nextOrder, form.id, form.name, form.display_order]);

  function reset() {
    setForm({ ...emptyForm, display_order: nextOrder });
    replaceGallery([]);
    setMessage("");
    setError("");
  }

  function edit(product) {
    setForm({
      id: product.id, name: product.name || "", slug: product.slug || "", description: product.description || "",
      price: String(product.price ?? ""), alt: product.alt || "", notes: product.notes || "", image_url: product.image_url || "",
      size_volume: product.size_volume || "", fragrance_family: product.fragrance_family || "",
      scent_profile: product.scent_profile || "", occasion: product.occasion || "",
      gallery_urls: Array.isArray(product.gallery_urls) ? product.gallery_urls : [],
      active: Boolean(product.active), display_order: Number(product.display_order || 0),
    });
    replaceGallery(existingItems(product)); setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // New photos are added after the current ones; nothing is replaced.
  function selectImages(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");
    if (!selected.length) return;

    if (selected.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
      setError("Use JPG, PNG, or WebP images only.");
      return;
    }
    if (selected.find((file) => file.size > MAX_IMAGE_SIZE)) {
      setError("Each image must be 10 MB or smaller.");
      return;
    }
    const room = MAX_PRODUCT_IMAGES - gallery.length;
    if (selected.length > room) {
      setError(room > 0
        ? `A perfume can have up to ${MAX_PRODUCT_IMAGES} photos. You can add ${room} more — remove one first to add others.`
        : `A perfume can have up to ${MAX_PRODUCT_IMAGES} photos. Remove one to add another.`);
      return;
    }

    const added = selected.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: `${fileKey(file)}::${preview}`, kind: "new", file, preview };
    });
    setGallery((current) => [...current, ...added]);
  }

  function makeCover(index) {
    setGallery((current) => {
      if (index <= 0 || index >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });
  }

  function moveGalleryImage(index, direction) {
    setGallery((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Takes the photo off the product. Saved files stay in storage, so a photo
  // removed by mistake can still be recovered.
  function removeGalleryImage(index) {
    setGallery((current) => {
      const item = current[index];
      if (!item) return current;
      releasePreview(item);
      return current.filter((_, i) => i !== index);
    });
  }

  // Uploads the newly chosen photos into a new versioned folder and returns
  // the whole gallery's URLs in order. Nothing is deleted here.
  async function uploadGallery(productSlug) {
    const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const urls = [];
    const paths = [];
    try {
      for (const item of gallery) {
        if (item.kind === "existing") {
          urls.push(item.url);
          continue;
        }
        const file = await compressImage(item.file);
        const objectName = galleryPath(productSlug, paths.length, version);
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(objectName, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        paths.push(objectName);
        urls.push(supabase.storage.from("product-images").getPublicUrl(objectName).data.publicUrl);
      }
    } catch (err) {
      if (paths.length) await supabase.storage.from("product-images").remove(paths);
      throw err;
    }
    return { urls, paths };
  }

  // Every storage object that may belong to a product's current gallery.
  function galleryObjects(product) {
    return [...new Set([
      ...Array.from({ length: MAX_PRODUCT_IMAGES }, (_, index) => galleryPath(product.slug, index)),
      ...siblingGalleryPaths(product.image_url),
      ...(product.gallery_urls || []).map(storageObjectPath),
      storageObjectPath(product.image_url),
    ].filter(Boolean))];
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const name = form.name.trim(); const slug = slugify(form.slug || name); const price = Number(form.price);
      if (!name || !slug || !form.description.trim() || !Number.isFinite(price) || price <= 0) throw new Error("Name, description, slug, and a valid price are required.");
      if (!gallery.length) throw new Error("Please add at least one product image.");

      const addedCount = gallery.filter((item) => item.kind === "new").length;
      const uploaded = await uploadGallery(slug);
      const galleryUrls = uploaded.urls;
      const imageUrl = galleryUrls[0];

      const { data: userData } = await supabase.auth.getUser(); const user = userData?.user;
      const payload = {
        name, slug, description: form.description.trim(), price, image_url: imageUrl, gallery_urls: galleryUrls,
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
      if (result.error) {
        // The product was not saved: remove the images just uploaded.
        if (uploaded.paths.length) await supabase.storage.from("product-images").remove(uploaded.paths);
        throw result.error;
      }

      const savedProduct = result.data;
      const galleryMessage = addedCount > 1 ? ` ${addedCount} new images added.` : addedCount === 1 ? " 1 new image added." : "";
      const visibility = savedProduct.active ? "" : " It is hidden from the store until you make it visible.";
      setMessage(form.id ? `${savedProduct.name} updated.${galleryMessage}${visibility}` : `${savedProduct.name} added to the catalogue.${galleryMessage}${visibility}`);
      replaceGallery([]);
      await load();
      await refreshProducts();
      // Back to a blank "Add a perfume" form; display_order 0 lets the effect
      // above fill in the next order from the refreshed catalogue.
      setForm({ ...emptyForm });
      window.scrollTo({ top: 0, behavior: "smooth" });
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

      const uniqueObjects = galleryObjects(product);
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

  const sectionTitle = "text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]";

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <form onSubmit={save} className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <div>
            <p className={sectionTitle}>Catalogue editor</p>
            <h2 className="mt-1 font-serif text-3xl font-normal tracking-[-0.02em]">{form.id ? `Edit ${form.name || "perfume"}` : "Add a perfume"}</h2>
          </div>
          {form.id && <AdminButton size="sm" variant="secondary" onClick={reset}><Plus className="h-3.5 w-3.5" />New</AdminButton>}
        </div>

        <div className="space-y-7 px-6 py-6">
          {(error || message) && (
            <div className="space-y-2" aria-live="polite">
              {error && <Notice tone="red" icon={AlertCircle}>{error}</Notice>}
              {message && <Notice tone="green" icon={CheckCircle2}>{message}</Notice>}
            </div>
          )}

          <fieldset className="space-y-4">
            <legend className={sectionTitle}>Basics</legend>
            <Field label="Name" htmlFor="product-name">
              <input id="product-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))} className={inputClass} required />
            </Field>
            <Field label="URL" htmlFor="product-slug" hint={form.slug ? `sahumario.com/product/${form.slug}` : "Generated from the name."}>
              <input id="product-slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} className={inputClass} required />
            </Field>
            <Field label="Description" htmlFor="product-description" hint="Shown on the product page and in Google results. Make each perfume's description unique.">
              <textarea id="product-description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className={inputClass} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹)" htmlFor="product-price">
                <input id="product-price" type="number" min="1" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className={inputClass} required />
              </Field>
              <Field label="Display order" htmlFor="product-order" hint="Lower numbers appear first.">
                <input id="product-order" type="number" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          <section className="space-y-4 border-t border-[var(--color-border)] pt-6">
            <h3 className={sectionTitle}>Details <span className="font-normal normal-case tracking-normal">· optional, shown only when filled in</span></h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Size / volume" htmlFor="product-size">
                <input id="product-size" value={form.size_volume} maxLength={80} onChange={(e) => setForm((p) => ({ ...p, size_volume: e.target.value }))} placeholder="e.g. 50 ml" className={inputClass} />
              </Field>
              <Field label="Fragrance family" htmlFor="product-family">
                <input id="product-family" value={form.fragrance_family} maxLength={120} onChange={(e) => setForm((p) => ({ ...p, fragrance_family: e.target.value }))} placeholder="e.g. Woody amber" className={inputClass} />
              </Field>
            </div>
            <Field label="Scent profile" htmlFor="product-profile">
              <input id="product-profile" value={form.scent_profile} maxLength={240} onChange={(e) => setForm((p) => ({ ...p, scent_profile: e.target.value }))} placeholder="A concise, verified scent description" className={inputClass} />
            </Field>
            <Field label="Occasion" htmlFor="product-occasion">
              <input id="product-occasion" value={form.occasion} maxLength={160} onChange={(e) => setForm((p) => ({ ...p, occasion: e.target.value }))} placeholder="e.g. Evenings, special occasions" className={inputClass} />
            </Field>
            <Field label="Fragrance notes" htmlFor="product-notes">
              <textarea id="product-notes" value={form.notes} maxLength={500} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} placeholder="Top, heart and base notes" className={inputClass} />
            </Field>
          </section>

          <section className="border-t border-[var(--color-border)] pt-6">
            <h3 className={`${sectionTitle} mb-4`}>Images</h3>
            {gallery.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-[var(--color-muted)]">The first photo is the cover: it shows in the collection and opens first on the product page.</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((item, index) => (
                    <div key={item.key} className={`overflow-hidden rounded-xl border p-1.5 ${index === 0 ? "border-[var(--color-text)]/50" : "border-[var(--color-border)]"}`}>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[var(--color-surface-muted)]">
                        {item.kind === "new"
                          ? <img src={item.preview} alt="" className="h-full w-full object-cover" />
                          : <SafeImage src={item.url} alt="" sizes="200px" maxWidth={480} className="h-full w-full object-cover" />}
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">{index === 0 ? "Cover" : index + 1}</span>
                        {item.kind === "new" && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[var(--color-kesar)] px-2 py-0.5 text-[10px] font-semibold text-white">New</span>}
                        <button type="button" onClick={() => removeGalleryImage(index)} className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black" aria-label={`Remove photo ${index + 1}`} title="Remove photo"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-[0.08em]"><Star className="h-3 w-3 fill-current" />Cover</span>
                        ) : (
                          <button type="button" onClick={() => makeCover(index)} className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] hover:text-[var(--color-text)]" title="Make cover"><Star className="h-3 w-3" />Cover</button>
                        )}
                        <div className="ml-auto flex">
                          <button type="button" onClick={() => moveGalleryImage(index, -1)} disabled={index === 0} className="rounded-md p-1 hover:bg-[var(--color-surface-muted)] disabled:opacity-30" aria-label={`Move photo ${index + 1} earlier`} title="Move earlier"><ChevronLeft className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => moveGalleryImage(index, 1)} disabled={index === gallery.length - 1} className="rounded-md p-1 hover:bg-[var(--color-surface-muted)] disabled:opacity-30" aria-label={`Move photo ${index + 1} later`} title="Move later"><ChevronRight className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gallery.length < MAX_PRODUCT_IMAGES && (
              <label htmlFor="product-gallery-input" className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-7 text-center transition hover:border-[var(--color-text)]/40">
                <Upload className="h-5 w-5 text-[var(--color-muted)]" />
                <span className="mt-2 text-sm font-semibold">{gallery.length ? `Add more photos (${MAX_PRODUCT_IMAGES - gallery.length} more allowed)` : `Choose up to ${MAX_PRODUCT_IMAGES} photos`}</span>
                <span className="mt-1 text-xs text-[var(--color-muted)]">JPG, PNG or WebP, up to 10 MB each; photos are resized and compressed automatically. New photos are added after the current ones.</span>
                <input id="product-gallery-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} className="sr-only" />
              </label>
            )}
            {gallery.length > 0 && <p className="mt-2 text-xs text-[var(--color-muted)]">Changes to photos are saved when you press Save.</p>}

            <div className="mt-4">
              <Field label="Image alt text" htmlFor="product-alt" hint="Describes the photo for Google Images and screen readers.">
                <input id="product-alt" value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} placeholder={form.name ? `${form.name} Eau de Parfum bottle` : ""} className={inputClass} />
              </Field>
            </div>
          </section>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3.5">
            <div>
              <div className="text-sm font-semibold">Visible in store</div>
              <div className="text-xs text-[var(--color-muted)]">{form.active ? "Customers can see and buy this perfume." : "Hidden from customers until you turn this on."}</div>
            </div>
            <button type="button" role="switch" aria-checked={form.active} aria-label="Visible in store" onClick={() => setForm((p) => ({ ...p, active: !p.active }))} className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.active ? "bg-[var(--color-text)]" : "bg-[var(--color-border)]"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-bg)] shadow transition-all ${form.active ? "left-[1.375rem]" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] px-6 py-4">
          <AdminButton type="submit" variant="primary" disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Pencil className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {form.id ? "Save changes" : "Add perfume"}
          </AdminButton>
        </div>
      </form>

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-normal tracking-[-0.02em]">Current catalogue</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {products.length} perfume{products.length === 1 ? "" : "s"} · {products.filter((product) => product.active).length} visible
            </p>
          </div>
          <AdminButton size="sm" variant="secondary" onClick={load}><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</AdminButton>
        </div>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted)]" /></div> : (
          <div className="mt-5 space-y-3">
            {products.map((product) => (
              <article key={product.id} className={`group flex gap-4 rounded-2xl border bg-[var(--color-surface)] p-3 transition ${form.id === product.id ? "border-[var(--color-text)]/40" : "border-[var(--color-border)] hover:border-[var(--color-text)]/25"}`}>
                <SafeImage src={product.image_url} alt={product.alt || product.name} sizes="88px" maxWidth={320} className={`h-28 w-[5.5rem] shrink-0 rounded-xl object-cover ${product.active ? "" : "opacity-50 grayscale"}`} />
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-xl leading-tight">{product.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">/product/{product.slug} · #{product.id}</p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{formatINR(product.price)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{product.description}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
                    <button type="button" onClick={() => toggleActive(product)} className={`admin-tone ${product.active ? "tone-green" : "tone-stone"} inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold`} title={product.active ? "Visible — click to hide" : "Hidden — click to show"}>
                      {product.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{product.active ? "Visible" : "Hidden"}
                    </button>
                    <AdminButton size="sm" variant="ghost" onClick={() => edit(product)} className="h-7"><Pencil className="h-3.5 w-3.5" />Edit</AdminButton>
                    <AdminButton size="sm" variant="ghost" onClick={() => removeProduct(product)} className="ml-auto h-7 text-red-600 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</AdminButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
