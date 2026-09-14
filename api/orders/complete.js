"use strict";

const crypto = require("crypto");
const Razorpay = require("razorpay");
const { requireCustomer } = require("../_lib/customerAuth");
const { sendOrderReceived } = require("../_lib/email");

const CATALOGUE = new Map([
  [1, { name: "Bloom", price: 749 }],
  [2, { name: "Dew Drop", price: 750 }],
  [3, { name: "Lemon Breeze", price: 749 }],
  [4, { name: "Morning Dew", price: 749 }],
  [5, { name: "Night Queen", price: 749 }],
]);
let razorpayClient = null;

function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}
function safeText(value, max = 200) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}
function validRazorpayId(value, prefix) { return typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9]{14,24}$`).test(value); }
function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}
function cartHash(userId, items) {
  const canonical = items.map((item) => `${item.product_id}:${item.qty}`).sort().join("|");
  return crypto.createHash("sha256").update(`${userId}|${canonical}`).digest("hex");
}
function money(value) { return Number.isInteger(Number(value)) ? Number(value) : NaN; }

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!req.headers["content-type"]?.includes("application/json")) return res.status(415).json({ message: "Content-Type must be application/json" });

  try {
    const { user, serverClient } = await requireCustomer(req);
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (!validRazorpayId(orderId, "order") || !validRazorpayId(paymentId, "pay") || !verifySignature(orderId, paymentId, signature)) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const existing = await serverClient.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const existingPaymentId = existing.data.payment && existing.data.payment.id;
      if (existingPaymentId && existingPaymentId !== paymentId) return res.status(409).json({ message: "Payment does not match the existing order" });
      return res.status(200).json({ order: existing.data, replay: true });
    }

    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return res.status(400).json({ message: "Invalid order items" });
    const normalizedItems = [];
    const seen = new Set();
    let subtotal = 0;
    let totalQty = 0;
    for (const item of body.items) {
      const id = Number(item.product_id);
      const qty = Number(item.qty);
      const product = CATALOGUE.get(id);
      if (!product || seen.has(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ message: "Invalid product or quantity" });
      seen.add(id);
      normalizedItems.push({ product_id: id, name: product.name, price: product.price, qty });
      subtotal += product.price * qty;
      totalQty += qty;
    }
    if (totalQty > 50) return res.status(400).json({ message: "Cart quantity is too large" });
    const expectedAmount = subtotal * 100;

    const razorpay = getRazorpayClient();
    if (!razorpay) return res.status(500).json({ message: "Payment gateway is not configured. Please contact support." });

    const [gatewayOrder, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ]);
    if (!gatewayOrder || !payment) return res.status(400).json({ message: "Payment could not be verified with the gateway" });
    if (String(payment.order_id || "") !== orderId) return res.status(400).json({ message: "Payment does not belong to this order" });
    if (money(gatewayOrder.amount) !== expectedAmount || money(payment.amount) !== expectedAmount) return res.status(400).json({ message: "Payment amount does not match the order" });
    if (gatewayOrder.currency !== "INR" || payment.currency !== "INR") return res.status(400).json({ message: "Payment currency does not match the order" });
    if (String(gatewayOrder.notes?.user_id || "") !== user.id) return res.status(403).json({ message: "Payment order does not belong to this account" });
    if (String(gatewayOrder.notes?.server_verified_amount_inr || "") !== String(subtotal)) return res.status(400).json({ message: "Payment order amount metadata is invalid" });
    if (String(gatewayOrder.notes?.cart_hash || "") !== cartHash(user.id, normalizedItems)) return res.status(400).json({ message: "Cart does not match the payment order" });

    let verifiedPayment = payment;
    if (payment.status === "authorized") {
      verifiedPayment = await razorpay.payments.capture(paymentId, expectedAmount, "INR");
    }
    if (!verifiedPayment || verifiedPayment.status !== "captured" || verifiedPayment.captured !== true) {
      return res.status(409).json({ message: "Payment is not captured yet. Please do not pay again; contact support with your payment ID." });
    }

    const address = body.address || {};
    const safeAddress = {
      name: safeText(address.name, 120), phone: safeText(address.phone, 30), email: safeText(address.email || user.email, 200),
      address: safeText(address.address, 300), city: safeText(address.city, 100), state: safeText(address.state, 100), pin: safeText(address.pin, 20),
    };
    if (!safeAddress.name || !safeAddress.phone || !safeAddress.address || !safeAddress.city || !safeAddress.state || !safeAddress.pin) return res.status(400).json({ message: "Shipping address is incomplete" });

    const now = new Date().toISOString();
    const row = {
      id: orderId, user_id: user.id, items: normalizedItems, subtotal,
      address: safeAddress,
      payment: {
        id: paymentId,
        order_id: orderId,
        method: "Razorpay",
        verified: true,
        status: verifiedPayment.status,
        captured: true,
        amount: expectedAmount,
        currency: "INR",
      },
      status: "Pending", created_at: now, updated_at: now,
    };
    const inserted = await serverClient.from("orders").insert(row).select("*").single();
    if (inserted.error) {
      const retry = await serverClient.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle();
      if (retry.data && retry.data.payment?.id === paymentId) return res.status(200).json({ order: retry.data, replay: true });
      throw inserted.error;
    }

    try { await sendOrderReceived(inserted.data); } catch (emailError) { console.error("[orders/complete] receipt email failed", emailError.message); }
    return res.status(200).json({ order: inserted.data });
  } catch (err) {
    console.error("[orders/complete]", err.message);
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Unable to complete order" });
  }
};
