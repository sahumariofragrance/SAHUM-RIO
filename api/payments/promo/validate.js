/**
 * POST /api/payments/promo/validate
 *
 * Validates a promo code and returns its discount percentage.
 *
 * Expects: { code: string }
 * Returns:
 *   200 — { valid: true,  discountPercent: number, message: string }
 *   200 — { valid: false, message: string }   (invalid/unknown code — not a 404)
 *   400 — { message: string }                 (missing or malformed input)
 *
 * Promo codes are configured via the PROMO_CODES_JSON environment variable:
 *   PROMO_CODES_JSON = '{"WELCOME10":10,"SAVE20":20}'
 * Keys are code names (uppercase), values are integer discount percentages (1–99).
 * Falls back to the DEFAULT_CODES map if the env var is absent or unparseable.
 */

"use strict";

// ── Default codes (used when PROMO_CODES_JSON is not set) ─────────────────
const DEFAULT_CODES = {
  WELCOME10: 10,
};

// Valid promo code format: 2–20 uppercase letters and digits
const CODE_RE        = /^[A-Z0-9]{2,20}$/;
const MAX_CODE_LEN   = 20;
const MAX_DISCOUNT   = 99;   // discount % ceiling — no free orders
const MIN_DISCOUNT   = 1;

// ── Parse promo map once at module load (cold start) ─────────────────────
// Vercel serverless functions are re-used across warm requests, so parsing
// the env var once here is both faster and safer than doing it per request.
function buildPromoMap() {
  const raw = process.env.PROMO_CODES_JSON;
  if (!raw) return { ...DEFAULT_CODES };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("[promo] PROMO_CODES_JSON is not valid JSON — falling back to defaults:", err.message);
    return { ...DEFAULT_CODES };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.error("[promo] PROMO_CODES_JSON must be a JSON object — falling back to defaults");
    return { ...DEFAULT_CODES };
  }

  const map = {};
  let validCount = 0;

  for (const [key, value] of Object.entries(parsed)) {
    // Normalise key: uppercase, strip whitespace
    const normKey = String(key).trim().toUpperCase();

    // Skip keys that don't match the code format
    if (!CODE_RE.test(normKey)) {
      console.warn(`[promo] Skipping invalid promo key: "${key}"`);
      continue;
    }

    // Validate discount value
    const discount = Number(value);
    if (!Number.isInteger(discount) || discount < MIN_DISCOUNT || discount > MAX_DISCOUNT) {
      console.warn(`[promo] Skipping "${normKey}" — discount must be an integer ${MIN_DISCOUNT}–${MAX_DISCOUNT}, got: ${value}`);
      continue;
    }

    map[normKey] = discount;
    validCount++;
  }

  if (validCount === 0) {
    console.warn("[promo] PROMO_CODES_JSON had no valid entries — falling back to defaults");
    return { ...DEFAULT_CODES };
  }

  console.info(`[promo] Loaded ${validCount} promo code(s) from PROMO_CODES_JSON`);
  return map;
}

// Built once per cold start — reused across warm invocations
const PROMO_MAP = buildPromoMap();

// ── Security headers ──────────────────────────────────────────────────────
function setSecurityHeaders(res) {
  res.setHeader("Content-Type",           "application/json");
  res.setHeader("Cache-Control",          "no-store");
  res.setHeader("Pragma",                 "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options",        "DENY");
}

// ── Handler ───────────────────────────────────────────────────────────────
module.exports = (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    return res.status(415).json({ message: "Content-Type must be application/json" });
  }

  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body)
    ? req.body
    : {};

  // ── Input validation ─────────────────────────────────────────────────────
  if (typeof body.code !== "string") {
    return res.status(400).json({ message: "code must be a string" });
  }

  // Hard-cap the raw input before any processing to prevent DoS via huge strings
  const rawCode   = body.code.slice(0, MAX_CODE_LEN + 10);
  const promoCode = rawCode.trim().toUpperCase();

  if (!promoCode) {
    return res.status(400).json({ message: "Promo code is required" });
  }

  if (!CODE_RE.test(promoCode)) {
    // Invalid format — respond as invalid code, not a server error
    return res.status(200).json({ valid: false, message: "Invalid promo code" });
  }

  // ── Lookup ───────────────────────────────────────────────────────────────
  // Use hasOwnProperty to avoid prototype pollution (e.g. "__proto__", "constructor")
  if (!Object.prototype.hasOwnProperty.call(PROMO_MAP, promoCode)) {
    return res.status(200).json({ valid: false, message: "Invalid promo code" });
  }

  const discountPercent = PROMO_MAP[promoCode];
  console.info(`[promo] Code "${promoCode}" validated — ${discountPercent}% discount`);

  return res.status(200).json({
    valid:           true,
    discountPercent,
    message:         `Promo code applied: ${discountPercent}% off`,
  });
};
