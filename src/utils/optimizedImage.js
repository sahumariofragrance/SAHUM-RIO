// Product photos are uploaded as large originals (often 1.5–2.5 MB PNGs).
// On Vercel they are served through the built-in image optimizer instead:
// /_vercel/image resizes them to the width the screen needs and converts
// them to WebP. The allowed widths, quality and source host must match the
// "images" block in vercel.json, or the optimizer rejects the request.
//
// Anything else (local development, other hosts) uses the original URL.

export const IMAGE_WIDTHS = [320, 480, 640, 960, 1280, 1600];
const QUALITY = 75;
const SOURCE = /^https:\/\/itcyhcmjaotlrhfbsrkv\.supabase\.co\/storage\/v1\/object\/public\/product-images\//;

function optimizerAvailable() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return process.env.NODE_ENV === "production" && host !== "localhost" && host !== "127.0.0.1";
}

export function canOptimize(src) {
  return Boolean(src) && SOURCE.test(src) && optimizerAvailable();
}

/** URL of `src` resized to `width` (one of IMAGE_WIDTHS), or `src` itself. */
export function optimizedSrc(src, width) {
  if (!canOptimize(src)) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;
}

/** srcset covering IMAGE_WIDTHS up to `maxWidth`, or undefined. */
export function optimizedSrcSet(src, maxWidth = 1600) {
  if (!canOptimize(src)) return undefined;
  return IMAGE_WIDTHS.filter((width) => width <= maxWidth)
    .map((width) => `${optimizedSrc(src, width)} ${width}w`)
    .join(", ");
}
