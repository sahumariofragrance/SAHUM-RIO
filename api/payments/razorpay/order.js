/** POST /api/payments/razorpay/order — creates a server-priced Razorpay order and durable payment intent. */
"use strict";
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { requireCustomer } = require("../../_lib/customerAuth");
const { getServiceClient, setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../../_lib/security");

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
  setJsonSecurityHeaders(res);
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
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 24 * 1024 })) return;

  try {
    const { user, serverClient } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "razorpay-order",
      limit: 12,
      windowSeconds: 600,
      identifier: user.id,
    }))) return;
    const body = plain(req.body) ? req.body : {};
    const { items, frontendAmount, currency = "INR", customer = {}, address } = body;
    if (currency !== "INR") return res.status(400).json({ message: "Unsupported currency" });
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "items must be a non-empty array" });

    const ids = items.map((item) => safeInt(item?.product_id));
    if (ids.some((id) => !Number.isInteger(id) || id <= 0)) return res.status(400).json({ message: "Invalid product ID" });
    const { data: catalogueRows, error: catalogueError } = await serverClient
      .from("products")
      .select("id,name,price,active")
      .in("id", ids)
      .eq("active", true);
    if (catalogueError) throw catalogueError;
    const catalogue = new Map((catalogueRows || []).map((product) => [Number(product.id), { name: product.name, price: Number(product.price) }]));

    const seen = new Set(); let count = 0; let amountPaise = 0;
    const normalizedItems = [];
    for (const item of items) {
      if (!plain(item)) return res.status(400).json({ message: "Invalid item" });
      const id = safeInt(item.product_id); const qty = safeInt(item.qty); const product = catalogue.get(id);
      if (!product) return res.status(400).json({ message: `Product ${item.product_id} is unavailable` });
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) return res.status(400).json({ message: "Invalid quantity" });
      if (seen.has(id)) return res.status(400).json({ message: `Duplicate product_id ${id}` });
      const unitPaise = Math.round(Number(product.price) * 100);
      if (!Number.isSafeInteger(unitPaise) || unitPaise < MIN_AMOUNT_PAISE) {
        return res.status(409).json({ message: `Product ${id} has an invalid price` });
      }
      seen.add(id);
      count += qty;
      amountPaise += unitPaise * qty;
      normalizedItems.push({ product_id: id, name: product.name, price: unitPaise / 100, qty });
    }
    if (count > MAX_TOTAL_ITEMS) return res.status(400).json({ message: "Cart quantity is too large" });
    const amount = amountPaise;
    const amountINR = amount / 100;
    if (!Number.isSafeInteger(amount) || amount < MIN_AMOUNT_PAISE || amount > MAX_AMOUNT_PAISE) {
      return res.status(400).json({ message: "Order amount is outside the allowed range" });
    }

    const shipping = safeAddress(address, user);
    if (!shipping.name || !shipping.phone || !shipping.email || !shipping.address || !shipping.city || !shipping.state || !shipping.pin) {
      return res.status(400).json({ message: "Shipping address and email are required" });
    }
    if (!/^\d{10}$/.test(shipping.phone.replace(/\D/g, ""))) {
      return res.status(400).json({ message: "A valid 10-digit phone number is required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (!/^\d{6}$/.test(shipping.pin)) {
      return res.status(400).json({ message: "A valid 6-digit PIN code is required" });
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

    const serviceClient = getServiceClient();
    if (!serviceClient) return res.status(503).json({ message: "Checkout service is temporarily unavailable." });

    const intent = await serviceClient.from("payment_intents").insert({
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
