import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import SafeImage from "./SafeImage";
import { compressReviewPhoto } from "../utils/compressImage";

export const MAX_REVIEW_PHOTOS = 3;
const BASE = String(process.env.REACT_APP_SUPABASE_URL || "").replace(/\/+$/, "");

/** Public address of a stored review photo (supabase/migrations/20261101200000_review_photos.sql). */
export function reviewPhotoUrl(path) {
  return `${BASE}/storage/v1/object/public/review-photos/${String(path).split("/").map(encodeURIComponent).join("/")}`;
}

/** Small square photos under a review; tapping one opens the viewer. */
export function ReviewPhotoThumbs({ photos, onOpen, label, className = "" }) {
  if (!photos?.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label={label}>
      {photos.map((photo, index) => (
        <li key={photo.key || photo.src}>
          <button
            type="button"
            onClick={() => onOpen(index)}
            className="block h-20 w-20 overflow-hidden rounded-lg bg-[var(--color-surface-muted)] outline-none ring-[var(--color-kesar)] transition hover:opacity-90 focus-visible:ring-2"
            aria-label={`Open photo ${index + 1} of ${photos.length}${photo.by ? ` by ${photo.by}` : ""}`}
          >
            <SafeImage src={photo.src} alt="" sizes="80px" maxWidth={320} className="h-full w-full object-cover" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Full-screen photo viewer: arrows, swipe, Esc to close. */
export function ReviewPhotoViewer({ photos, index, onClose, onIndex }) {
  const closeRef = useRef(null);
  const touch = useRef(null);
  const count = photos.length;
  const photo = photos[index];
  const go = useCallback((step) => onIndex((index + step + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight" && count > 1) go(1);
      else if (event.key === "ArrowLeft" && count > 1) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, go, count]);

  if (!photo) return null;
  const arrow = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customer photo"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 px-4 py-14"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touch.current == null || count < 2) return;
        const dx = event.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <button ref={closeRef} type="button" onClick={onClose} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close photo">
        <X className="h-6 w-6" />
      </button>
      <SafeImage key={photo.src} src={photo.src} alt={photo.alt || "Customer photo"} sizes="92vw" maxWidth={1600} priority className="max-h-[78vh] max-w-full rounded-lg object-contain" />
      <div className="mt-4 text-center text-sm text-white/80">
        {photo.caption && <p>{photo.caption}</p>}
        {count > 1 && <p className="mt-1 text-xs tabular-nums text-white/60">{index + 1} / {count}</p>}
      </div>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className={`${arrow} left-2 sm:left-5`} aria-label="Previous photo"><ChevronLeft className="h-6 w-6" /></button>
          <button type="button" onClick={() => go(1)} className={`${arrow} right-2 sm:right-5`} aria-label="Next photo"><ChevronRight className="h-6 w-6" /></button>
        </>
      )}
    </div>
  );
}

/**
 * The "Add photos" field of the review form. `value` is a list of
 * { key, path } (already on the review) and { key, blob, preview } (new).
 */
export function ReviewPhotoPicker({ value, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const room = MAX_REVIEW_PHOTOS - value.length;

  async function add(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setNote("");
    setBusy(true);
    const added = [];
    let problem = files.length > room ? `Only ${MAX_REVIEW_PHOTOS} photos per review.` : "";
    for (const file of files.slice(0, room)) {
      try {
        const blob = await compressReviewPhoto(file);
        added.push({ key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`, blob, preview: URL.createObjectURL(blob) });
      } catch (error) {
        problem = error.message || "This photo couldn’t be added.";
      }
    }
    setBusy(false);
    if (added.length) onChange([...value, ...added]);
    setNote(problem);
  }

  function remove(item) {
    if (item.preview) URL.revokeObjectURL(item.preview);
    onChange(value.filter((photo) => photo.key !== item.key));
    setNote("");
  }

  return (
    <div className="mt-4">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Photos (optional)</span>
      <p className="mt-1 text-xs text-[var(--color-muted)]">Show us your bottle: up to {MAX_REVIEW_PHOTOS} photos.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {value.map((item, index) => (
          <div key={item.key} className="relative h-20 w-20 overflow-hidden rounded-lg bg-[var(--color-surface-muted)]">
            <img src={item.preview || reviewPhotoUrl(item.path)} alt={`Your upload ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(item)}
              disabled={disabled}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black disabled:opacity-50"
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-text)] hover:text-[var(--color-text)] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">{busy ? "Adding" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={add} className="sr-only" tabIndex={-1} aria-label="Choose photos" />
      {note && <p className="mt-2 text-xs text-red-600" role="alert">{note}</p>}
    </div>
  );
}

/** A photo from the form, ready for /api/reviews/upsert: its path, or { data } for a new one. */
export async function photoForUpload(item) {
  if (item.path) return item.path;
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("This photo couldn’t be read."));
    reader.readAsDataURL(item.blob);
  });
  return { data };
}
