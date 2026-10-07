// Picks the dominant colour of a product photo and turns it into a page
// palette, so each perfume page takes on the colour of its bottle/photo.

import { optimizedSrc } from "./optimizedImage";

const cache = new Map();

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

const HUE_BINS = 24;

/** Dominant { h, s } of an image, or null if it has no clear colour. */
function dominantHue(image) {
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, size, size);
  const { data } = context.getImageData(0, 0, size, size);

  const bins = Array.from({ length: HUE_BINS }, () => ({ weight: 0, x: 0, y: 0, s: 0 }));
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    // Ignore near-black, near-white and grey pixels (bottle caps, labels, shadows).
    if (l < 0.08 || l > 0.94 || s < 0.12) continue;
    const weight = s * (1 - Math.abs(l - 0.5));
    const bin = bins[Math.floor((h / 360) * HUE_BINS) % HUE_BINS];
    const radians = (h * Math.PI) / 180;
    bin.weight += weight;
    bin.x += Math.cos(radians) * weight;
    bin.y += Math.sin(radians) * weight;
    bin.s += s * weight;
    total += weight;
  }

  // Merge each bin with its neighbours so a hue split across two bins still wins.
  let best = null;
  for (let i = 0; i < HUE_BINS; i += 1) {
    const group = [bins[(i + HUE_BINS - 1) % HUE_BINS], bins[i], bins[(i + 1) % HUE_BINS]];
    const weight = group.reduce((sum, bin) => sum + bin.weight, 0);
    if (!best || weight > best.weight) best = { weight, group };
  }
  if (!best || total === 0 || best.weight / (size * size) < 0.02) return null;

  const x = best.group.reduce((sum, bin) => sum + bin.x, 0);
  const y = best.group.reduce((sum, bin) => sum + bin.y, 0);
  const s = best.group.reduce((sum, bin) => sum + bin.s, 0) / best.weight;
  const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return { h: Math.round(h), s: Math.min(1, s) };
}

function sampleHue(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        resolve({ hue: dominantHue(image) });
      } catch {
        resolve({ hue: null }); // e.g. the image host does not allow cross-origin reads
      }
    };
    image.onerror = () => resolve({ failed: true });
    image.src = src;
  });
}

/**
 * Resolves to the dominant { h, s } of the image at `url`, or null. Samples a
 * small resized copy (the colour is the same, the download far smaller) and
 * falls back to the original if the resized copy cannot be loaded.
 */
export function loadImageHue(url) {
  if (!url) return Promise.resolve(null);
  if (cache.has(url)) return cache.get(url);
  const small = optimizedSrc(url, 320);
  const promise = sampleHue(small).then((result) => (
    result.failed && small !== url ? sampleHue(url) : result
  )).then((result) => result.hue || null);
  cache.set(url, promise);
  return promise;
}

/** CSS custom properties for a perfume page: a glow of hue `h` for the given theme. */
export function tonePalette({ h, s }, theme) {
  // Only a soft glow of the perfume's colour: the page itself keeps the site's
  // Bandhani colours, so an orange perfume no longer turns the page brown.
  const sat = `${Math.round(Math.min(s, 0.6) * 100)}%`;
  return { "--tone-glow": theme === "light" ? `hsl(${h} ${sat} 80% / 0.55)` : `hsl(${h} ${sat} 32% / 0.45)` };
}
