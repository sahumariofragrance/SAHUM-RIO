/**
 * POST /api/payments/razorpay/order
 *
 * Creates a Razorpay order. Must be called before opening the checkout modal.
 * Expects: { amount (paise), currency, customer: { name, phone, email }, notes }
 * Returns: Razorpay order object { id, amount, currency, ... }
 */
const Razorpay = require("razorpay");
const crypto = require("crypto");

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function sanitizeText(value, maxLength = 120) {
  return String(value || "").replace(/[\r\n\t]/g, " ").slice(0, maxLength).trim();
}

module.exports = async (req, res) => {
  setSecurityHeaders(res);

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  if (!req.headers["content-type"]?.includes("application/json")) {
    return res.status(415).json({ message: "Content-Type must be application/json" });
  }

  const { amount, currency = "INR", customer = {}, notes = {} } = req.body || {};

  if (!Number.isInteger(amount) || amount < 100 || amount > 50000000) {
    return res
      .status(400)
      .json({ message: "amount must be an integer between 100 and 50,000,000 paise" });
  }

  if (currency !== "INR") {
    return res.status(400).json({ message: "Unsupported currency" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars");
    return res.status(500).json({ message: "Payment gateway is not configured" });
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        ...notes,
        customer_name: sanitizeText(customer.name),
        customer_phone: sanitizeText(customer.phone, 30),
        customer_email: sanitizeText(customer.email),
      },
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error("[Razorpay] Order creation failed:", err);
    return res
      .status(502)
      .json({ message: err?.error?.description || "Failed to create payment order" });
  }
};
