"use strict";

// Review photos (supabase/migrations/20261101200000_review_photos.sql).
// The browser shrinks each photo and sends it with the review as base64;
// the server checks it is really a WebP, JPEG or PNG of at most 1 MB and
// stores it in the public "review-photos" bucket with the service role, under
// <user id>/<product id>/<random name>. Shoppers cannot upload to the bucket
// directly.

const crypto = require("crypto");

const BUCKET = "review-photos";
const MAX_PHOTOS = 3;
const MAX_BYTES = 1024 * 1024;
// Base64 is 4 characters for every 3 bytes.
const MAX_BASE64 = Math.ceil(MAX_BYTES / 3) * 4;

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

/** The image type from the file's first bytes (never trusts the name or the browser). */
function detectType(buffer) {
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  return null;
}

/**
 * The photos the review should end up with, in order: paths it already has
 * (kept) and new files (base64 `data`, optionally as a data: URL).
 * Returns null when the request does not mention photos (leave them as they are).
 */
function readPhotos(raw, existing = []) {
  if (raw === undefined) return null;
  if (!Array.isArray(raw)) throw badRequest("Invalid photos");
  if (raw.length > MAX_PHOTOS) throw badRequest(`Up to ${MAX_PHOTOS} photos per review`);
  const have = new Set(existing);
  const seen = new Set();
  return raw.map((item) => {
    if (typeof item === "string") {
      if (!have.has(item) || seen.has(item)) throw badRequest("Invalid photo");
      seen.add(item);
      return { path: item };
    }
    const data = item && typeof item === "object" && typeof item.data === "string"
      ? item.data.replace(/^data:image\/[a-z]+;base64,/i, "")
      : "";
    if (!data) throw badRequest("Invalid photo");
    if (data.length > MAX_BASE64 + 4) throw badRequest("Each photo must be under 1 MB");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw badRequest("Invalid photo");
    const buffer = Buffer.from(data, "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) throw badRequest("Each photo must be under 1 MB");
    const type = detectType(buffer);
    if (!type) throw badRequest("Photos must be JPEG, PNG or WebP images");
    return { buffer, ...type };
  });
}

/** Deletes files from the bucket. Best effort: a leftover file is only storage. */
async function removePhotos(service, paths) {
  const list = (paths || []).filter(Boolean);
  if (!service || !list.length) return;
  const { error } = await service.storage.from(BUCKET).remove(list);
  if (error) console.error("[review-photos] remove failed", error.message);
}

/**
 * Uploads the new photos and returns the final list of paths, in order.
 * If any upload fails, the ones already uploaded are removed again.
 */
async function storePhotos(service, { userId, productId, photos }) {
  const uploaded = [];
  try {
    const paths = [];
    for (const photo of photos) {
      if (photo.path) {
        paths.push(photo.path);
        continue;
      }
      const path = `${userId}/${productId}/${crypto.randomUUID()}.${photo.ext}`;
      const { error } = await service.storage.from(BUCKET).upload(path, photo.buffer, {
        contentType: photo.mime,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      uploaded.push(path);
      paths.push(path);
    }
    return { paths, uploaded };
  } catch (err) {
    await removePhotos(service, uploaded);
    console.error("[review-photos] upload failed", err?.message);
    const failed = new Error("Your photos couldn’t be uploaded. Please try again.");
    failed.statusCode = 502;
    throw failed;
  }
}

/** Postgres "column does not exist": the review-photos SQL has not been run yet. */
function photosColumnMissing(error) {
  return Boolean(error) && (error.code === "42703" || /photos/.test(String(error.message || "")) && /column/.test(String(error.message || "")));
}

module.exports = { BUCKET, MAX_PHOTOS, MAX_BYTES, detectType, readPhotos, storePhotos, removePhotos, photosColumnMissing };
