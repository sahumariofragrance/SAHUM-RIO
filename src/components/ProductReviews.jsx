import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function StarRow({ value, onChange, size = "h-5 w-5", interactive = false, label = "Rating" }) {
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        if (!interactive) {
          return (
            <Star
              key={star}
              className={`${size} ${filled ? "fill-[var(--color-kesar)] text-[var(--color-kesar)]" : "text-[var(--color-border)]"}`}
              aria-hidden="true"
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="rounded p-0.5 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--color-kesar)]"
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            <Star className={`${size} ${filled ? "fill-[var(--color-kesar)] text-[var(--color-kesar)]" : "text-[var(--color-border)]"}`} />
          </button>
        );
      })}
    </div>
  );
}

export default function ProductReviews({ product, onSummary }) {
  const { user, startGuestSession } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    rating: 5,
    title: "",
    body: "",
  });

  const ownReview = useMemo(() => reviews.find((review) => review.is_own) || null, [reviews]);
  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
  }, [reviews]);

  useEffect(() => {
    if (loading || !onSummary) return;
    onSummary(reviews.length ? { average, count: reviews.length } : null);
  }, [loading, reviews.length, average, onSummary]);

  const loadReviews = useCallback(async () => {
    if (!product?.id) return;
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase.rpc("get_product_reviews", {
      p_product_id: product.id,
    });
    if (loadError) {
      setError("Reviews could not be loaded right now.");
      setReviews([]);
    } else {
      setReviews(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [product?.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    let live = true;
    if (!user?.id) {
      setIsAdmin(false);
      return () => { live = false; };
    }

    supabase.rpc("is_admin").then(({ data, error: adminError }) => {
      if (live) setIsAdmin(!adminError && data === true);
    });

    return () => { live = false; };
  }, [user?.id]);

  useEffect(() => {
    if (ownReview) {
      setForm({
        displayName: ownReview.display_name || "",
        rating: Number(ownReview.rating || 5),
        title: ownReview.title || "",
        body: ownReview.body || "",
      });
      return;
    }

    const fallbackName =
      user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      (user?.email ? user.email.split("@")[0] : "");

    setForm((current) => ({
      ...current,
      displayName: current.displayName || fallbackName || "",
    }));
  }, [ownReview, user]);

  async function handleSubmit(event) {
    event.preventDefault();

    const displayName = form.displayName.trim();
    const title = form.title.trim();
    const body = form.body.trim();

    if (displayName.length < 2) {
      setError("Please enter a display name.");
      return;
    }
    if (body.length < 5) {
      setError("Please write a little more about the fragrance.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      let reviewUser = user;
      if (!reviewUser) {
        const session = await startGuestSession();
        reviewUser = session?.user || null;
      }
      if (!reviewUser?.id) throw new Error("Unable to start a guest review session.");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your review session expired. Please try again.");

      const response = await fetch("/api/reviews/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          display_name: displayName.slice(0, 60),
          rating: Number(form.rating),
          title: title.slice(0, 100),
          body: body.slice(0, 1200),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Your review could not be saved.");

      setMessage(ownReview ? "Your review has been updated." : "Thank you — your review is now live.");
      await loadReviews();
    } catch (saveError) {
      console.error("[reviews] save failed", saveError?.message);
      setError("Your review could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!ownReview || !window.confirm("Delete your review?")) return;
    setSaving(true);
    setError("");
    setMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    let deleteError = null;
    if (!session?.access_token) {
      deleteError = new Error("Your review session expired.");
    } else {
      const response = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ review_id: ownReview.id, product_id: product.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) deleteError = new Error(payload.message || "Your review could not be deleted.");
    }

    if (deleteError) {
      setError(deleteError.message || "Your review could not be deleted.");
    } else {
      setForm((current) => ({ ...current, rating: 5, title: "", body: "" }));
      setMessage("Your review has been deleted.");
      await loadReviews();
    }
    setSaving(false);
  }

  async function handleAdminDelete(review) {
    if (!isAdmin || !review?.id || !window.confirm(`Delete review by ${review.display_name || "this customer"}?`)) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Your admin session expired.");

      const response = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ review_id: review.id, product_id: product.id }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Review could not be deleted.");

      setMessage("Review deleted.");
      await loadReviews();
    } catch (deleteError) {
      setError(deleteError.message || "Review could not be deleted.");
    } finally {
      setSaving(false);
    }
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);
  const formOpen = showForm || Boolean(message) || Boolean(error && !reviews.length);
  const inputClass = "mt-2 w-full font-normal normal-case tracking-normal text-[var(--color-text)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-text)]";

  return (
    <section id="reviews" className="mt-20 scroll-mt-28 border-t border-[var(--color-border)] pt-10 md:mt-24" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-title" className="font-serif text-2xl font-normal tracking-[-0.01em] md:text-3xl">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <StarRow value={Math.round(average)} size="h-3.5 w-3.5" />
              <span className="tabular-nums">{average.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          aria-expanded={formOpen}
          className="border-b border-current pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-70"
        >
          {formOpen ? "Close" : ownReview ? "Edit your review" : "Write a review"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-8 max-w-xl border-t border-[var(--color-border)] pt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-muted)]">No account needed. One review per fragrance on this device session.</p>
            {ownReview && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex shrink-0 items-center gap-1.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>

          <div className="mt-5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Your rating</span>
            <div className="mt-2">
              <StarRow value={form.rating} onChange={(rating) => setForm({ ...form, rating })} interactive size="h-5 w-5" />
            </div>
          </div>

          <label className="mt-5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Display name
            <input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} maxLength={60} required placeholder="Your name" className={inputClass} />
          </label>

          <label className="mt-4 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Short title (optional)
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={100} placeholder="What stood out?" className={inputClass} />
          </label>

          <label className="mt-4 block text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Your review
            <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} minLength={5} maxLength={1200} required rows={4} placeholder="Tell others what it was like to wear this fragrance." className={`${inputClass} resize-y leading-6`} />
          </label>

          {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
          {message && <p className="mt-4 text-sm text-green-700" role="status">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 h-11 bg-[var(--color-text)] px-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-bg)] transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : ownReview ? "Update review" : "Post review"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse bg-[var(--color-surface-muted)]" />)}
        </div>
      ) : reviews.length === 0 ? (
        !formOpen && <p className="mt-6 text-sm text-[var(--color-muted)]">No reviews yet. Be the first to share how it wears.</p>
      ) : (
        <>
          <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
            {visibleReviews.map((review) => (
              <article key={review.id} className="border-t border-[var(--color-border)] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <StarRow value={Number(review.rating)} size="h-3.5 w-3.5" />
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleAdminDelete(review)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs text-red-600 transition hover:text-red-700 disabled:opacity-50"
                      aria-label={`Delete review by ${review.display_name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  )}
                </div>
                {review.title && <h3 className="mt-3 font-serif text-lg font-normal">{review.title}</h3>}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">{review.body}</p>
                <p className="mt-3 text-[11px] text-[var(--color-muted)]">
                  {review.display_name} · {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </article>
            ))}
          </div>
          {reviews.length > 3 && (
            <button type="button" onClick={() => setShowAll((all) => !all)} className="mt-8 border-b border-current pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-70">
              {showAll ? "Show fewer" : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </>
      )}

      {error && reviews.length > 0 && !formOpen && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
