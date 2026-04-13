/**
 * POST /api/payments/razorpay/verify
 *
 * Verifies the Razorpay payment signature to confirm the payment was not tampered.
 * Must be called after the frontend receives the payment success callback.
 *
 * Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { verified: true, payment_id } on success, 400 on mismatch
 */
const crypto = require("crypto");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    return res.status(415).json({ message: "Content-Type must be application/json" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ verified: false, message: "Missing required payment fields" });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET env var");
    return res.status(500).json({ message: "Payment gateway is not configured" });
  }

  // Razorpay signature = HMAC-SHA256(key_secret, order_id + "|" + payment_id)
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const receivedBuffer = Buffer.from(String(razorpay_signature), "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const validSignature =
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!validSignature) {
    console.warn("[Razorpay] Signature mismatch — possible tampered payment request", {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
    return res.status(400).json({ verified: false, message: "Payment verification failed" });
  }

  return res.status(200).json({ verified: true, payment_id: razorpay_payment_id });
};
