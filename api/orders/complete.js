"use strict";

const crypto = require("crypto");
const { requireCustomer } = require("../_lib/customerAuth");
const { sendOrderReceived } = require("../_lib/email");

const CATALOGUE = new Map([
  [1, { name: "Bloom", price: 749 }],
  [2, { name: "Dew Drop", price: 750 }],
  [3, { name: "Lemon Breeze", price: 749 }],
  [4, { name: "Morning Dew", price: 749 }],
  [5, { name: "Night Queen", price: 749 }],
]);

function safeText(value, max = 200) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}
function validRazorpayId(value, prefix) { return typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9]{14,20}$`).test(value); }
function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { user, serverClient } = await requireCustomer(req);
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (!validRazorpayId(orderId, "order") || !validRazorpayId(paymentId, "pay") || !verifySignature(orderId, paymentId, signature)) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) return res.status(400).json({ message: "Invalid order items" });
    const normalizedItems = [];
    let subtotal = 0;
    for (const item of body.items) {
      const id = Number(item.product_id);
      const qty = Number(item.qty);
      const product = CATALOGUE.get(id);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) return res.status(400).json({ message: "Invalid product or quantity" });
      normalizedItems.push({ product_id: id, name: product.name, price: product.price, qty });
      subtotal += product.price * qty;
    }

    const address = body.address || {};
    const safeAddress = {
      name: safeText(address.name, 120), phone: safeText(address.phone, 30), email: safeText(address.email || user.email, 200),
      address: safeText(address.address, 300), city: safeText(address.city, 100), state: safeText(address.state, 100), pin: safeText(address.pin, 20),
    };
    if (!safeAddress.name || !safeAddress.phone || !safeAddress.address || !safeAddress.city || !safeAddress.state || !safeAddress.pin) return res.status(400).json({ message: "Shipping address is incomplete" });

    const row = {
      id: orderId, user_id: user.id, items: normalizedItems, subtotal,
      address: safeAddress, payment: { id: paymentId, method: "Razorpay", verified: true },
      status: "Pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const { data, error } = await serverClient.from("orders").upsert(row, { onConflict: "id", ignoreDuplicates: true }).select("*").maybeSingle();
    if (error) throw error;
    const order = data || (await serverClient.from("orders").select("*").eq("id", orderId).eq("user_id", user.id).maybeSingle()).data;
    if (!order) throw new Error("Unable to persist order");

    try { await sendOrderReceived(order); } catch (emailError) { console.error("[orders/complete] receipt email failed", emailError.message); }
    return res.status(200).json({ order });
  } catch (err) {
    console.error("[orders/complete]", err.message);
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Unable to complete order" });
  }
};
