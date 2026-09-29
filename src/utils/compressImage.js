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
