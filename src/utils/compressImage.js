// Shrinks a product photo in the browser before it is uploaded: the longest
// side is capped at MAX_EDGE pixels and the image is re-encoded as WebP.
// Phone and studio photos arrive as multi-megabyte PNG/JPEG files; the site
// never shows them larger than this, so the extra pixels only slow it down.
//
// Returns the original file whenever compression is not possible or not
// worth it (the browser cannot encode WebP, or the result is not smaller).

const MAX_EDGE = 2000;
const QUALITY = 0.88;

export async function compressImage(file) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    // Browsers that cannot encode WebP silently return PNG instead.
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

// Review photos (api/_lib/reviewPhotos.js accepts at most 1 MB each).
const REVIEW_STEPS = [[1600, 0.82], [1280, 0.78], [1024, 0.72], [800, 0.68]];
const REVIEW_LIMIT = 900 * 1024;

/**
 * Prepares a customer's review photo: always redrawn (which also drops the
 * camera's hidden details such as GPS location), turned upright, at most
 * 1600 px on the longest side and under 900 KB. WebP where the browser can
 * make it, JPEG otherwise. Throws when the browser cannot open the file
 * (for example an iPhone HEIC photo in some browsers).
 */
export async function compressReviewPhoto(file) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") throw new Error("Photos are not supported in this browser.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This photo couldn’t be opened. Please choose a JPEG or PNG photo.");
  }
  try {
    for (const [edge, quality] of REVIEW_STEPS) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      // Browsers that cannot make WebP hand back a PNG: use JPEG instead.
      if (!blob || blob.type !== "image/webp") blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= REVIEW_LIMIT) return blob;
    }
    throw new Error("This photo is too large. Please choose another one.");
  } finally {
    bitmap?.close?.();
  }
}
