/** POST /api/payments/razorpay/order — creates a server-priced Razorpay order. */
"use strict";
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireCustomer } = require("../../_lib/customerAuth");

const PRODUCT_CATALOGUE = new Map([
  [1, { price: 749 }],
  [2, { price: 750 }],
  [3, { price: 749 }],
  [4, { price: 749 }],
  [5, { price: 749 }],
]);
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

module.exports = async (req, res) => {
  setSecurityHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!req.headers["content-type"]?.includes("application/json")) return res.status(415).json({ message: "Content-Type must be application/json" });

  try {
    const { user } = await requireCustomer(req);
    const body = plain(req.body) ? req.body : {};
    const { items, frontendAmount, currency = "INR", customer = {} } = body;
    if (currency !== "INR") return res.status(400).json({ message: "Unsupported currency" });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "items must be a non-empty array" });

    const seen = new Set(); let count = 0; let amountINR = 0;
    for (const item of items) {
      if (!plain(item)) return res.status(400).json({ message: "Invalid item" });
      const id = safeInt(item.product_id); const qty = safeInt(item.qty); const product = PRODUCT_CATALOGUE.get(id);
      if (!product) return res.status(400).json({ message: `Invalid product_id: ${item.product_id}` });
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) return res.status(400).json({ message: "Invalid quantity" });
      if (seen.has(id)) return res.status(400).json({ message: `Duplicate product_id ${id}` });
      seen.add(id); count += qty; amountINR += product.price * qty;
    }
    if (count > MAX_TOTAL_ITEMS) return res.status(400).json({ message: "Cart quantity is too large" });
    const amount = amountINR * 100;
    if (amount < MIN_AMOUNT_PAISE || amount > MAX_AMOUNT_PAISE) return res.status(400).json({ message: "Order amount is outside the allowed range" });

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
      },
    });
    const response = { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt };
    if (mismatch) response.correctedAmount = amountINR;
    return res.status(200).json(response);
  } catch (err) {
    console.error("[order]", err?.message);
    return res.status(err.statusCode || 502).json({ message: err.statusCode ? err.message : "Unable to create payment order. Please try again." });
  }
};
