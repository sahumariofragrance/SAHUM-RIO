/**
 * POST /api/payments/razorpay/verify
 *
 * Verifies the Razorpay payment signature to confirm the payment is authentic
 * and was not tampered with. Must be called after the frontend receives the
 * Razorpay payment success callback.
 *
 * Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns:
 *   200 — { verified: true,  payment_id }
 *   400 — { verified: false, message }   (missing fields or signature mismatch)
 *   500 — { message }                    (server misconfiguration)
 */

"use strict";

const crypto = require("crypto");

// Razorpay IDs are always ASCII hex/alphanumeric strings of known max length.
// We enforce this to prevent any prototype-pollution or buffer-overflow vectors.
const ORDER_ID_RE   = /^order_[A-Za-z0-9]{14,20}$/;
const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]{14,20}$/;
const SIGNATURE_RE  = /^[a-f0-9]{64}$/;   // HMAC-SHA256 hex output is always 64 chars

function setSecurityHeaders(res) {
  res.setHeader("Content-Type",           "application/json");
  res.setHeader("Cache-Control",          "no-store");
  res.setHeader("Pragma",                 "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options",        "DENY");
}

/** Returns a sanitised string or null if the value is not a plain non-empty string. */
function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

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

  const orderId    = asString(body.razorpay_order_id);
  const paymentId  = asString(body.razorpay_payment_id);
  const signature  = asString(body.razorpay_signature);

  // ── Field presence ───────────────────────────────────────────────────────
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ verified: false, message: "Missing required payment fields" });
  }

  // ── Format validation — reject anything that doesn't look like a Razorpay ID ─
  // This prevents oversized inputs and injection attempts before touching crypto.
  if (!ORDER_ID_RE.test(orderId)) {
    return res.status(400).json({ verified: false, message: "Invalid order ID format" });
  }
  if (!PAYMENT_ID_RE.test(paymentId)) {
    return res.status(400).json({ verified: false, message: "Invalid payment ID format" });
  }
  if (!SIGNATURE_RE.test(signature)) {
    // Signature is always a 64-char hex string. Anything else is definitely wrong.
    return res.status(400).json({ verified: false, message: "Invalid signature format" });
  }

  // ── Env check ────────────────────────────────────────────────────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("[verify] RAZORPAY_KEY_SECRET is not set");
    return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });
  }

  // ── Signature verification ───────────────────────────────────────────────
  // Razorpay signature = HMAC-SHA256(key_secret, order_id + "|" + payment_id)
  let expectedSignature;
  try {
    expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  } catch (err) {
    console.error("[verify] HMAC computation failed:", err);
    return res.status(500).json({ message: "Signature computation error" });
  }

  // Both buffers are guaranteed to be 64 bytes (ASCII hex) — timingSafeEqual is safe.
  const receivedBuffer = Buffer.from(signature,          "hex");
  const expectedBuffer = Buffer.from(expectedSignature,  "hex");

  // Extra length guard — both must be 32 bytes (64 hex chars → 32 bytes decoded).
  if (receivedBuffer.length !== 32 || expectedBuffer.length !== 32) {
    console.warn("[verify] Unexpected buffer lengths — possible tampering", {
      received_len: receivedBuffer.length,
      expected_len: expectedBuffer.length,
    });
    return res.status(400).json({ verified: false, message: "Payment verification failed" });
  }

  const validSignature = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!validSignature) {
    console.warn("[verify] Signature mismatch — possible tampered payment", {
      order_id:   orderId,
      payment_id: paymentId,
    });
    return res.status(400).json({ verified: false, message: "Payment verification failed" });
  }

  console.info("[verify] Payment verified", { order_id: orderId, payment_id: paymentId });
  return res.status(200).json({ verified: true, payment_id: paymentId, order_id: orderId });
};
