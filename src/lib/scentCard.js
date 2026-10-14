// The quiz result as an Instagram story picture (1080 × 1920), drawn in the
// browser so it can be shared straight from the phone's share sheet.

import { optimizedSrc } from "../utils/optimizedImage";
import { noteList } from "./scentQuiz";

const W = 1080;
const H = 1920;
const GOLD = "#e9c98f";
const CREAM = "#f8ecdc";
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"DM Sans", -apple-system, "Segoe UI", Arial, sans-serif';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function productPhoto(url) {
  if (!url) return null;
  const small = optimizedSrc(url, 960);
  try {
    return await loadImage(small);
  } catch {
    return small === url ? null : loadImage(url).catch(() => null);
  }
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws `text` centred at y, letter-spaced, shrinking it to fit `maxWidth`. */
function centred(ctx, text, y, { font, size, color, spacing = 0, maxWidth = W - 200 }) {
  let px = size;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.letterSpacing = `${spacing}px`;
  do {
    ctx.font = font.replace("SIZE", `${px}px`);
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 4;
  } while (px > 20);
  ctx.fillText(text, W / 2, y);
  ctx.letterSpacing = "0px";
}

/** Splits `text` into at most `max` lines that fit `width`. */
function wrap(ctx, text, width, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, max);
}

/** PNG blob of the story picture for `product`. */
export async function drawScentCard(product) {
  await Promise.all([
    document.fonts?.load(`500 160px ${SERIF}`),
    document.fonts?.load(`italic 400 48px ${SERIF}`),
    document.fonts?.load(`600 30px ${SANS}`),
  ]).catch(() => {});
  const photo = await productPhoto(product.image);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Lamp-lit night, like the offer card on the site.
  ctx.fillStyle = "#1d130c";
  ctx.fillRect(0, 0, W, H);
  const warm = ctx.createRadialGradient(0, 0, 0, 0, 0, 1300);
  warm.addColorStop(0, "rgba(233, 165, 72, 0.34)");
  warm.addColorStop(1, "rgba(233, 165, 72, 0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  const ember = ctx.createRadialGradient(W, H, 0, W, H, 1100);
  ember.addColorStop(0, "rgba(196, 86, 52, 0.26)");
  ember.addColorStop(1, "rgba(196, 86, 52, 0)");
  ctx.fillStyle = ember;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(233, 201, 143, 0.45)";
  ctx.lineWidth = 2;
  roundedRect(ctx, 44, 44, W - 88, H - 88, 40);
  ctx.stroke();

  centred(ctx, "SAHUMäRIO", 178, { font: `600 SIZE ${SANS}`, size: 34, color: GOLD, spacing: 12 });
  centred(ctx, "MY SIGNATURE SCENT", 262, { font: `600 SIZE ${SANS}`, size: 26, color: "rgba(248, 236, 220, 0.72)", spacing: 9 });
  centred(ctx, product.name, 420, { font: `500 SIZE ${SERIF}`, size: 164, color: CREAM, maxWidth: W - 180 });

  const profile = String(product.scent_profile || product.description || "").split(/[.;]/)[0].trim();
  if (profile) {
    ctx.font = `italic 400 46px ${SERIF}`;
    wrap(ctx, profile, W - 260, 2).forEach((line, index) => {
      centred(ctx, line, 500 + index * 54, { font: `italic 400 SIZE ${SERIF}`, size: 46, color: GOLD });
    });
  }

  // Bottle photo, 4:5 like on the site.
  const box = { x: 190, y: 640, w: 700, h: 875 };
  ctx.save();
  roundedRect(ctx, box.x, box.y, box.w, box.h, 32);
  ctx.fillStyle = "#2b1d13";
  ctx.fill();
  ctx.clip();
  if (photo) {
    const scale = Math.max(box.w / photo.width, box.h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, box.x + (box.w - dw) / 2, box.y + (box.h - dh) / 2, dw, dh);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(233, 201, 143, 0.6)";
  roundedRect(ctx, box.x, box.y, box.w, box.h, 32);
  ctx.stroke();

  const notes = noteList(product);
  if (notes.length) {
    ctx.font = `600 26px ${SANS}`;
    ctx.letterSpacing = "5px";
    // Break between notes, never inside one or after a dot.
    const lines = [];
    let line = [];
    notes.map((note) => note.toUpperCase()).forEach((note) => {
      if (line.length && ctx.measureText([...line, note].join("  ·  ")).width > W - 220) {
        lines.push(line);
        line = [];
      }
      line.push(note);
    });
    if (line.length) lines.push(line);
    lines.slice(0, 2).map((items) => items.join("  ·  ")).forEach((text, index) => {
      centred(ctx, text, 1606 + index * 44, { font: `600 SIZE ${SANS}`, size: 26, color: CREAM, spacing: 5 });
    });
  }

  centred(ctx, "Find your scent", 1758, { font: `italic 400 SIZE ${SERIF}`, size: 52, color: GOLD });
  centred(ctx, "SAHUMARIO.COM/QUIZ", 1818, { font: `600 SIZE ${SANS}`, size: 28, color: CREAM, spacing: 8 });

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * Opens the phone's share sheet with the story picture (Instagram, WhatsApp…),
 * or downloads it where sharing files is not supported. Resolves to
 * "shared", "downloaded" or "cancelled".
 */
export async function shareScentCard(product) {
  const blob = await drawScentCard(product);
  const file = new File([blob], `${product.slug || "my-scent"}-sahumario.png`, { type: "image/png" });
  const text = `My signature scent is ${product.name} ✨ Find yours at sahumario.com/quiz`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
