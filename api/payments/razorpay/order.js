/** POST /api/payments/razorpay/order — creates a server-priced Razorpay order and durable payment intent. */
"use strict";
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireCustomer } = require("../../_lib/customerAuth");

const PRODUCT_CATALOGUE = new Map([
  [1, { name: "Bloom", price: 749 }],
  [2, { name: "Dew Drop", price: 750 }],
  [3, { name: "Lemon Breeze", price: 749 }],
  [4, { name: "Morning Dew", price: 749 }],
  [5, { name: "Night Queen", price: 749 }],
]);

const previewPaymentTestEnabled =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "rebuild/complete-backend-v2";

if (previewPaymentTestEnabled) {
  PRODUCT_CATALOGUE.set(99, { name: "PAYMENT TEST — ₹10", price: 10 });
}
const MAX_QTY_PER_ITEM = 20;
const MAX_TOTAL_ITEMS = 50;
const MAX_AMOUNT_PAISE = 50_000_000;
const MIN_AMOUNT_PAISE = 100;
let razorpayClient = null;

function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}
function setSecurityHeaders(res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}
function sanitizeText(value, max = 120) { return value == null ? "" : String(value).replace(/[\u0000-\u001F\u007F\r\n\t]/g, " ").trim().slice(0, max); }
function safeInt(value) { return typeof value === "number" && Number.isInteger(value) ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? parseInt(value, 10) : NaN; }
function plain(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }
function cartHash(userId, items) {
  const canonical = items.map((item) => `${item.product_id}:${item.qty}`).sort().join("|");
  return crypto.createHash("sha256").update(`${userId}|${canonical}`).digest("hex");
}
function safeAddress(address, user) {
  const source = plain(address) ? address : {};
  return {
    name: sanitizeText(source.name, 120),
    phone: sanitizeText(source.phone, 30),
    email: sanitizeText(source.email || user.email, 200),
    address: sanitizeText(source.address, 300),
    city: sanitizeText(source.city, 100),
    state: sanitizeText(source.state, 100),
    pin: sanitizeText(source.pin, 20),
  };
}

module.exports = async (req, res) => {
  setSecurityHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!req.headers["content-type"]?.includes("application/json")) return res.status(415).json({ message: "Content-Type must be application/json" });

  try {
    const { user, serverClient } = await requireCustomer(req);
    const body = plain(req.body) ? req.body : {};
    const { items, frontendAmount, currency = "INR", customer = {}, address } = body;
    if (currency !== "INR") return res.status(400).json({ message: "Unsupported currency" });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "items must be a non-empty array" });

    const seen = new Set(); let count = 0; let amountINR = 0;
    const normalizedItems = [];
    for (const item of items) {
      if (!plain(item)) return res.status(400).json({ message: "Invalid item" });
      const id = safeInt(item.product_id); const qty = safeInt(item.qty); const product = PRODUCT_CATALOGUE.get(id);
      if (!product) return res.status(400).json({ message: `Invalid product_id: ${item.product_id}` });
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) return res.status(400).json({ message: "Invalid quantity" });
      if (seen.has(id)) return res.status(400).json({ message: `Duplicate product_id ${id}` });
      seen.add(id); count += qty; amountINR += product.price * qty;
      normalizedItems.push({ product_id: id, name: product.name, price: product.price, qty });
    }
    if (count > MAX_TOTAL_ITEMS) return res.status(400).json({ message: "Cart quantity is too large" });
    const amount = amountINR * 100;
    if (amount < MIN_AMOUNT_PAISE || amount > MAX_AMOUNT_PAISE) return res.status(400).json({ message: "Order amount is outside the allowed range" });

    const shipping = safeAddress(address, user);
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.state || !shipping.pin) {
      return res.status(400).json({ message: "Shipping address is incomplete" });
    }

    const frontend = Number(frontendAmount);
    const mismatch = Number.isInteger(frontend) && frontend !== amount;
    const razorpay = getRazorpayClient();
    if (!razorpay) return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });

    const safeCustomer = plain(customer) ? customer : {};
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        user_id: user.id,
        customer_name: sanitizeText(safeCustomer.name),
        customer_phone: sanitizeText(safeCustomer.phone, 20),
        customer_email: sanitizeText(safeCustomer.email || user.email, 200),
        server_verified_amount_inr: String(amountINR),
        total_qty: String(count),
        cart_hash: cartHash(user.id, normalizedItems),
        intent_version: "3",
      },
    });

    const intent = await serverClient.from("payment_intents").insert({
      razorpay_order_id: order.id,
      user_id: user.id,
      items: normalizedItems,
      subtotal: amountINR,
      amount_paise: amount,
      currency: "INR",
      address: shipping,
      customer_email: shipping.email,
      status: "created",
    });
    if (intent.error) {
      console.error("[order] payment intent persistence failed", intent.error.message);
      return res.status(503).json({ message: "Unable to prepare a recoverable payment. No payment was taken; please try again." });
    }

    const response = { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt };
    if (mismatch) response.correctedAmount = amountINR;
    return res.status(200).json(response);
  } catch (err) {
    console.error("[order]", err?.message);
    return res.status(err.statusCode || 502).json({ message: err.statusCode ? err.message : "Unable to create payment order. Please try again." });
  }
};
