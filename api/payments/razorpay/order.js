/**
 * POST /api/payments/razorpay/order
 *
 * Creates a Razorpay order. Must be called before opening the checkout modal.
 *
 * Expects:
 *   {
 *     items:           [{ product_id: number, qty: number }]  // REQUIRED
 *     frontendAmount?: number   // paise sent by the frontend (for audit/mismatch logging)
 *     currency?:       string   // defaults to "INR"
 *     customer?:       { name?: string, phone?: string, email?: string }
 *   }
 *
 * Returns:
 *   200 — Razorpay order object { id, amount, currency, correctedAmount? }
 *          correctedAmount (INR) is present only when the frontend amount did not
 *          match the server-verified amount, so the UI can surface a warning.
 *   400 — Validation error
 *   500 — Server misconfiguration
 *   502 — Razorpay API error
 */

"use strict";

const Razorpay = require("razorpay");
const crypto   = require("crypto");

// ── Catalogue constants ────────────────────────────────────────────────────
// Single source of truth: add a new product here when you add it to products.json
const PRODUCT_CATALOGUE = new Map([
  [1, { price: 749 }],  // Bloom
  [2, { price: 749 }],  // Dew Drop
  [3, { price: 749 }],  // Lemon Breeze
  [4, { price: 749 }],  // Morning Dew
  [5, { price: 749 }],  // Night Queen
  [6, { price:   1 }],  // Perfume Papers (test)
]);
const VALID_PRODUCT_IDS = new Set(PRODUCT_CATALOGUE.keys());
const MAX_QTY_PER_ITEM  = 20;           // per line item
const MAX_TOTAL_ITEMS   = 50;           // across entire cart
const MAX_AMOUNT_PAISE  = 50_000_000;   // Razorpay upper limit (₹5 lakh)
const MIN_AMOUNT_PAISE  = 100;          // Razorpay lower limit

// ── Razorpay client — created once per cold start, reused across requests ──
let razorpayClient = null;
function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null; // caller handles the null check
  }

  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function setSecurityHeaders(res) {
  res.setHeader("Content-Type",            "application/json");
  res.setHeader("Cache-Control",           "no-store");
  res.setHeader("Pragma",                  "no-cache");
  res.setHeader("X-Content-Type-Options",  "nosniff");
  res.setHeader("X-Frame-Options",         "DENY");
}

/** Strip control characters, trim, and hard-cap length. */
function sanitizeText(value, maxLength = 120) {
  if (value == null) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F\r\n\t]/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Safely parse an integer, returning NaN for anything that isn't a plain integer. */
function safeParseInt(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return parseInt(value, 10);
  return NaN;
}

/** Quick type guard — is this a plain object (not array, null, etc.)? */
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ── Handler ────────────────────────────────────────────────────────────────
module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    return res.status(415).json({ message: "Content-Type must be application/json" });
  }

  // ── Destructure body safely ──────────────────────────────────────────────
  const body = isPlainObject(req.body) ? req.body : {};
  const {
    items,
    frontendAmount,
    currency  = "INR",
    customer  = {},
  } = body;

  if (currency !== "INR") {
    return res.status(400).json({ message: "Unsupported currency. Only INR is accepted." });
  }

  // ── Validate items ───────────────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items must be a non-empty array" });
  }

  // Check for duplicate product IDs
  const seenIds = new Set();
  let totalItemCount = 0;

  for (const item of items) {
    if (!isPlainObject(item)) {
      return res.status(400).json({ message: "Each item must be an object" });
    }

    const pid = safeParseInt(item.product_id);
    const qty = safeParseInt(item.qty);

    if (isNaN(pid) || !VALID_PRODUCT_IDS.has(pid)) {
      return res.status(400).json({ message: `Invalid product_id: ${item.product_id}` });
    }
    if (isNaN(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return res.status(400).json({
        message: `qty for product ${pid} must be an integer between 1 and ${MAX_QTY_PER_ITEM}`,
      });
    }
    if (seenIds.has(pid)) {
      return res.status(400).json({ message: `Duplicate product_id ${pid} in items` });
    }

    seenIds.add(pid);
    totalItemCount += qty;
  }

  if (totalItemCount > MAX_TOTAL_ITEMS) {
    return res.status(400).json({
      message: `Total quantity cannot exceed ${MAX_TOTAL_ITEMS} items`,
    });
  }

  // ── Server-side amount calculation (uses per-product prices) ─────────────
  let serverAmountINR = 0;
  for (const item of items) {
    const pid = safeParseInt(item.product_id);
    const qty = safeParseInt(item.qty);
    serverAmountINR += PRODUCT_CATALOGUE.get(pid).price * qty;
  }
  const serverAmountPaise = serverAmountINR * 100;

  if (serverAmountPaise < MIN_AMOUNT_PAISE || serverAmountPaise > MAX_AMOUNT_PAISE) {
    return res.status(400).json({ message: "Order amount is outside the allowed range" });
  }

  // ── Mismatch detection ───────────────────────────────────────────────────
  const frontendAmountNum = Number(frontendAmount);
  const amountMismatch =
    Number.isFinite(frontendAmountNum) &&
    Number.isInteger(frontendAmountNum) &&
    frontendAmountNum !== serverAmountPaise;

  if (amountMismatch) {
    console.warn("[order] Amount mismatch — frontend: %d paise, server: %d paise", frontendAmountNum, serverAmountPaise);
  }

  // ── Validate customer fields (all optional, just sanitise) ───────────────
  const safeCustomer = isPlainObject(customer) ? customer : {};
  const customerName  = sanitizeText(safeCustomer.name);
  const customerPhone = sanitizeText(safeCustomer.phone, 20);
  const customerEmail = sanitizeText(safeCustomer.email);

  // ── Get Razorpay client ──────────────────────────────────────────────────
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    console.error("[order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set");
    return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });
  }

  // ── Create Razorpay order ────────────────────────────────────────────────
  try {
    const order = await razorpay.orders.create({
      amount:   serverAmountPaise,
      currency: "INR",
      receipt:  `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        // Only write known, sanitised fields — no user-controlled key spreading
        customer_name:               customerName,
        customer_phone:              customerPhone,
        customer_email:              customerEmail,
        server_verified_amount_inr:  String(serverAmountINR),
        frontend_amount_paise:       Number.isFinite(frontendAmountNum) ? String(frontendAmountNum) : "",
        total_qty:                   String(totalItemCount),
      },
    });

    // Build response — only expose what the frontend needs
    const response = {
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      receipt:  order.receipt,
    };

    if (amountMismatch) {
      response.correctedAmount = serverAmountINR; // INR, human-readable for the UI
    }

    return res.status(200).json(response);
  } catch (err) {
    const errMsg = err?.error?.description ?? err?.message ?? "Failed to create payment order";
    console.error("[order] Razorpay order creation failed:", errMsg, err?.error ?? "");
    return res.status(502).json({ message: errMsg });
  }
};
