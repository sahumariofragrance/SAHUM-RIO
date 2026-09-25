"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { useAuth } from "./auth";

function StarRow({ value, onChange, size = "h-5 w-5", interactive = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(star => interactive ? (
        <button key={star} type="button" onClick={() => onChange?.(star)} className="rounded p-0.5" aria-label={`${star} stars`}>
          <Star className={`${size} ${star <= value ? "fill-amber-500 text-amber-500" : "text-stone-300"}`} />
        </button>
      ) : <Star key={star} className={`${size} ${star <= value ? "fill-amber-500 text-amber-500" : "text-stone-300"}`} aria-hidden="true" />)}
    </div>
  );
}

function initials(name) {
  return String(name || "Customer").split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]?.toUpperCase()).join("") || "C";
}

export default function ProductReviews({ product }) {
  const { user, startGuestSession, supabase } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ displayName: "", rating: 5, title: "", body: "" });

  const ownReview = useMemo(() => reviews.find(review => review.is_own) || null, [reviews]);
  const average = useMemo(() => reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0, [reviews]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.rpc("get_product_reviews", { p_product_id: product.id });
    if (loadError) {
      setReviews([]);
      setError("Reviews could not be loaded right now.");
    } else {
      setReviews(Array.isArray(data) ? data : []);
      setError("");
    }
    setLoading(false);
  }, [product.id, supabase]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  useEffect(() => {
    let live = true;
    if (!user?.id) { setIsAdmin(false); return () => { live = false; }; }
    supabase.rpc("is_admin").then(({ data, error }) => { if (live) setIsAdmin(!error && data === true); });
    return () => { live = false; };
  }, [user?.id, supabase]);

  useEffect(() => {
    if (ownReview) {
      setForm({ displayName: ownReview.display_name || "", rating: Number(ownReview.rating || 5), title: ownReview.title || "", body: ownReview.body || "" });
      return;
    }
    const fallback = user?.user_metadata?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split("@")[0] : "");
    setForm(current => ({ ...current, displayName: current.displayName || fallback || "" }));
  }, [ownReview, user]);

  async function authToken() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Your review session expired. Please try again.");
    return session.access_token;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const displayName = form.displayName.trim();
    const body = form.body.trim();
    if (displayName.length < 2) return setError("Please enter a display name.");
    if (body.length < 5) return setError("Please write a little more about the fragrance.");

    setSaving(true); setError(""); setMessage("");
    try {
      if (!user) await startGuestSession();
      const token = await authToken();
      const response = await fetch("/api/reviews/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, display_name: displayName.slice(0,60), rating: Number(form.rating), title: form.title.trim().slice(0,100), body: body.slice(0,1200) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Your review could not be saved.");
      setMessage(ownReview ? "Your review has been updated." : "Thank you — your review is now live.");
      await loadReviews();
    } catch (err) {
      setError(err?.message || "Your review could not be saved.");
    } finally { setSaving(false); }
  }

  async function deleteReview(review) {
    if (!review?.id || !window.confirm("Delete this review?")) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const token = await authToken();
      const response = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ review_id: review.id, product_id: product.id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Review could not be deleted.");
      setMessage("Review deleted.");
      await loadReviews();
    } catch (err) {
      setError(err?.message || "Review could not be deleted.");
    } finally { setSaving(false); }
  }

  return (
    <section className="mt-16 border-t border-[var(--color-border)] pt-12 md:mt-20 md:pt-16" aria-labelledby="reviews-title">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-700">Customer notes</p>
          <h2 id="reviews-title" className="mt-3 font-serif text-3xl font-semibold tracking-tight md:text-4xl">Reviews of {product.name}</h2>
          <div className="glass-soft mt-7 rounded-2xl p-6">
            {reviews.length ? <><div className="flex items-end gap-3"><span className="font-serif text-5xl font-semibold leading-none">{average.toFixed(1)}</span><span className="pb-1 text-sm text-[var(--color-muted)]">out of 5</span></div><div className="mt-3 flex items-center gap-3"><StarRow value={Math.round(average)} /><span className="text-sm text-[var(--color-muted)]">{reviews.length} review{reviews.length === 1 ? "" : "s"}</span></div></> : <><p className="font-serif text-2xl font-semibold">Be the first to leave a note.</p><p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">Share how the fragrance felt to wear and what stood out.</p></>}
          </div>

          <form onSubmit={handleSubmit} className="glass-panel mt-5 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{ownReview ? "Edit your review" : "Write a review"}</p><p className="mt-1 text-xs text-[var(--color-muted)]">No account needed. One review per fragrance.</p></div>{ownReview && <button type="button" onClick={() => deleteReview(ownReview)} disabled={saving} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600"><Trash2 className="h-4 w-4" />Delete</button>}</div>
            <div className="mt-5"><label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Your rating</label><div className="mt-2"><StarRow value={form.rating} onChange={rating => setForm({ ...form, rating })} interactive size="h-6 w-6" /></div></div>
            <label className="mt-5 block text-sm font-medium">Display name<input required maxLength={60} value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" /></label>
            <label className="mt-4 block text-sm font-medium">Short title <span className="font-normal text-[var(--color-muted)]">(optional)</span><input maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500" /></label>
            <label className="mt-4 block text-sm font-medium">Your review<textarea required minLength={5} maxLength={1200} rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 leading-6 outline-none focus:ring-2 focus:ring-amber-500" /></label>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}{message && <p className="mt-4 text-sm text-green-700">{message}</p>}
            <button disabled={saving} className="mt-5 rounded-full bg-[#24160f] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : ownReview ? "Update review" : "Post review"}</button>
          </form>
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4"><h3 className="font-serif text-2xl font-semibold">What customers are saying</h3>{reviews.length > 0 && <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">Newest first</span>}</div>
          {loading ? <div className="space-y-4 pt-6"><div className="h-36 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /><div className="h-36 animate-pulse rounded-2xl bg-[var(--color-surface-muted)]" /></div> : reviews.length === 0 ? <div className="py-12 text-center text-sm text-[var(--color-muted)]">No reviews yet.</div> : <div className="divide-y divide-[var(--color-border)]">{reviews.map(review => <article key={review.id} className="py-7 first:pt-6"><div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#24160f] font-serif text-sm font-semibold text-white">{initials(review.display_name)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{review.display_name}</p><p className="mt-0.5 text-xs text-[var(--color-muted)]">{new Date(review.created_at).toLocaleDateString("en-IN")}</p></div><div className="flex items-center gap-3"><StarRow value={Number(review.rating)} size="h-4 w-4" />{isAdmin && <button onClick={() => deleteReview(review)} disabled={saving} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><Trash2 className="h-3.5 w-3.5" />Delete</button>}</div></div>{review.title && <h4 className="mt-4 font-serif text-xl font-semibold">{review.title}</h4>}<p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--color-muted)]">{review.body}</p></div></div></article>)}</div>}
        </div>
      </div>
    </section>
  );
}
