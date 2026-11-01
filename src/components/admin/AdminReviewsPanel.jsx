import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, RefreshCw, Star, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useProducts } from "../../context/ProductsContext";
import SafeImage from "../SafeImage";
import { ReviewPhotoThumbs, ReviewPhotoViewer, reviewPhotoUrl } from "../ReviewPhotos";
import { AdminButton, Notice, StatTile } from "./AdminUI";

const RATINGS = [5, 4, 3, 2, 1];

function Stars({ value, size = "h-3.5 w-3.5" }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${Number(value || 0).toFixed(1).replace(/\.0$/, "")} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} aria-hidden="true" className={`${size} ${star <= rounded ? "fill-[var(--color-kesar)] text-[var(--color-kesar)]" : "text-[var(--color-border)]"}`} />
      ))}
    </span>
  );
}

const dateOf = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

function photosOf(review) {
  return (Array.isArray(review.photos) ? review.photos : []).map((path) => ({
    key: path,
    src: reviewPhotoUrl(path),
    by: review.display_name,
    alt: `Photo by ${review.display_name || "a customer"}`,
    caption: `${review.display_name || "Customer"} · ${"★".repeat(Number(review.rating) || 0)}`,
  }));
}

/**
 * Admin → Reviews: every review that is live on the perfume pages, which
 * perfumes have reviews (and which have none yet), and a Delete button that
 * takes a review and its photos off the site.
 */
export default function AdminReviewsPanel() {
  const { products } = useProducts();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [loading, setLoading] = useState(false);
  const [perfume, setPerfume] = useState("all");
  const [rating, setRating] = useState("all");
  const [photosOnly, setPhotosOnly] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null); // { tone, text }

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setLoading(false);
    if (error) {
      setStatus("error");
      return;
    }
    setReviews(Array.isArray(data) ? data : []);
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => new Map(products.map((product) => [Number(product.id), product])), [products]);
  const perfumes = useMemo(() => {
    const stats = new Map();
    reviews.forEach((review) => {
      const id = Number(review.product_id);
      const row = stats.get(id) || { count: 0, total: 0, photos: 0 };
      row.count += 1;
      row.total += Number(review.rating) || 0;
      row.photos += Array.isArray(review.photos) ? review.photos.length : 0;
      stats.set(id, row);
    });
    return products
      .map((product) => {
        const row = stats.get(Number(product.id)) || { count: 0, total: 0, photos: 0 };
        return { product, count: row.count, average: row.count ? row.total / row.count : 0, photos: row.photos };
      })
      .sort((a, b) => b.count - a.count || b.average - a.average || a.product.name.localeCompare(b.product.name));
  }, [products, reviews]);

  const totals = useMemo(() => {
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / count : 0;
    const withPhotos = reviews.filter((review) => Array.isArray(review.photos) && review.photos.length).length;
    return { count, average, withPhotos, reviewed: perfumes.filter((row) => row.count).length };
  }, [reviews, perfumes]);

  const shown = useMemo(() => reviews.filter((review) =>
    (perfume === "all" || Number(review.product_id) === Number(perfume))
    && (rating === "all" || Number(review.rating) === rating)
    && (!photosOnly || (Array.isArray(review.photos) && review.photos.length > 0))), [reviews, perfume, rating, photosOnly]);

  async function remove(review) {
    const name = byId.get(Number(review.product_id))?.name || "this perfume";
    const photoCount = Array.isArray(review.photos) ? review.photos.length : 0;
    if (!window.confirm(`Delete ${review.display_name || "this customer"}’s review of ${name}? It comes off the site${photoCount ? `, with its ${plural(photoCount, "photo")}` : ""}.`)) return;
    setBusyId(review.id);
    setNotice(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your admin session expired. Please sign in again.");
      const response = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ review_id: review.id, product_id: review.product_id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "The review couldn’t be deleted.");
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setNotice({ tone: "green", text: `Deleted ${review.display_name ? `${review.display_name}’s` : "the"} review of ${name}.` });
    } catch (error) {
      setNotice({ tone: "red", text: error.message || "The review couldn’t be deleted." });
    } finally {
      setBusyId(null);
    }
  }

  const chip = (active) => `inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${active ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"}`;
  const selectedPerfume = perfume === "all" ? null : byId.get(Number(perfume));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl">Reviews</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Every review live on the perfume pages, newest first</p>
        </div>
        <AdminButton variant="secondary" onClick={load} disabled={loading} aria-label="Refresh reviews">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh
        </AdminButton>
      </div>

      {status === "error" && <Notice tone="red">Reviews couldn’t be loaded. Please refresh in a moment.</Notice>}
      {notice && <Notice tone={notice.tone} icon={notice.tone === "green" ? CheckCircle2 : undefined}>{notice.text}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Live reviews" value={totals.count} sub={status === "loading" ? "Loading…" : "On the perfume pages"} />
        <StatTile label="Average rating" value={totals.count ? totals.average.toFixed(1) : "—"} sub={totals.count ? <Stars value={totals.average} /> : "No reviews yet"} />
        <StatTile label="With photos" value={totals.withPhotos} sub={totals.count ? `${Math.round((totals.withPhotos / totals.count) * 100)}% of reviews` : "Customers can add up to 3"} />
        <StatTile label="Perfumes reviewed" value={`${totals.reviewed} of ${perfumes.length}`} sub={perfumes.length - totals.reviewed ? `${perfumes.length - totals.reviewed} with no reviews yet` : "Every perfume has a review"} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3" aria-labelledby="reviews-by-perfume">
          <h3 id="reviews-by-perfume" className="px-2 pb-2 pt-1 text-sm font-semibold">By perfume</h3>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto lg:max-h-[34rem]">
            <li>
              <button type="button" onClick={() => setPerfume("all")} aria-pressed={perfume === "all"} className={`flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left text-sm transition ${perfume === "all" ? "bg-[var(--color-surface-muted)] font-semibold" : "hover:bg-[var(--color-surface-muted)]"}`}>
                <span>All perfumes</span>
                <span className="tabular-nums text-xs text-[var(--color-muted)]">{totals.count}</span>
              </button>
            </li>
            {perfumes.map(({ product, count, average, photos }) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => setPerfume(String(product.id))}
                  aria-pressed={perfume === String(product.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition ${perfume === String(product.id) ? "bg-[var(--color-surface-muted)]" : "hover:bg-[var(--color-surface-muted)]"} ${count ? "" : "opacity-60"}`}
                >
                  <SafeImage src={product.image} alt="" sizes="40px" maxWidth={320} className="h-10 w-8 shrink-0 rounded-md object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${perfume === String(product.id) ? "font-semibold" : ""}`}>{product.name}</span>
                    {count ? (
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                        <Stars value={average} size="h-3 w-3" />
                        {average.toFixed(1)}
                        {photos > 0 && <span className="inline-flex items-center gap-0.5"><ImageIcon className="h-3 w-3" aria-hidden="true" />{photos}</span>}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">No reviews yet</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-[var(--color-muted)]">{count || ""}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 space-y-4" aria-label="Review list">
          <div className="flex flex-wrap items-center gap-2">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by rating">
              <button type="button" onClick={() => setRating("all")} aria-pressed={rating === "all"} className={chip(rating === "all")}>All ratings</button>
              {RATINGS.map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} aria-pressed={rating === value} className={chip(rating === value)}>
                  {value}<Star className="h-3 w-3 fill-current" aria-hidden="true" /><span className="sr-only">stars</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPhotosOnly((on) => !on)} aria-pressed={photosOnly} className={chip(photosOnly)}>
              <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />With photos
            </button>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            {plural(shown.length, "review")}{selectedPerfume ? ` of ${selectedPerfume.name}` : ""}
            {selectedPerfume && (
              <a href={`/product/${selectedPerfume.slug}#reviews`} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 underline underline-offset-2 hover:text-[var(--color-text)]">
                See on the site<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </p>

          {status === "loading" && !reviews.length ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" />)}</div>
          ) : shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
              {reviews.length ? "No reviews match these filters." : "No reviews yet. They appear here as soon as a customer posts one."}
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((review) => {
                const product = byId.get(Number(review.product_id));
                const photos = photosOf(review);
                return (
                  <li key={review.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a href={product ? `/product/${product.slug}#reviews` : undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] hover:text-[var(--color-text)]">
                          {product?.name || `Perfume #${review.product_id}`}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Stars value={review.rating} />
                          {review.title && <span className="truncate font-serif text-lg leading-tight">{review.title}</span>}
                        </div>
                      </div>
                      <AdminButton size="sm" variant="ghost" onClick={() => remove(review)} disabled={busyId === review.id} className="text-red-600 hover:text-red-600" aria-label={`Delete review by ${review.display_name} on ${product?.name || "perfume"}`}>
                        {busyId === review.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete
                      </AdminButton>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{review.body}</p>
                    <ReviewPhotoThumbs photos={photos} label={`Photos by ${review.display_name}`} onOpen={(index) => setViewer({ photos, index })} className="mt-3" />
                    <p className="mt-3 text-xs text-[var(--color-muted)]">
                      {review.display_name} · {dateOf(review.created_at)}
                      {review.updated_at && new Date(review.updated_at) - new Date(review.created_at) > 60000 && ` · edited ${dateOf(review.updated_at)}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {viewer && (
        <ReviewPhotoViewer
          photos={viewer.photos}
          index={viewer.index}
          onIndex={(index) => setViewer((current) => (current ? { ...current, index } : current))}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
