"use strict";

const crypto = require("crypto");
const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");
const { sendOrderReceived } = require("../../_lib/email");

function timingSafeHexEqual(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(a || "") || !/^[a-f0-9]{64}$/i.test(b || "")) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
function cartHash(userId, items) {
  const canonical = (Array.isArray(items) ? items : [])
    .map((item) => `${Number(item.product_id)}:${Number(item.qty)}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(`${userId}|${canonical}`).digest("hex");
}
function note(notes, key) {
  if (!notes || typeof notes !== "object") return "";
  return String(notes[key] == null ? "" : notes[key]);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const serviceClient = getServiceClient();
    const razorpay = getRazorpayClient();
    if (!webhookSecret || !serviceClient || !razorpay) {
      console.error("[razorpay/webhook] server environment is incomplete");
      return res.status(503).json({ message: "Webhook is not configured" });
    }

    const raw = await readRawBody(req);
    if (!raw.length || raw.length > 1_000_000) return res.status(400).json({ message: "Invalid payload" });
    const signature = String(req.headers["x-razorpay-signature"] || "");
    const expected = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");
    if (!timingSafeHexEqual(signature, expected)) return res.status(401).json({ message: "Invalid webhook signature" });

    let event;
    try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ message: "Invalid JSON" }); }
    const eventName = String(event?.event || "");
    const eventId = String(req.headers["x-razorpay-event-id"] || event?.id || "").slice(0, 200) || null;
    const payment = event?.payload?.payment?.entity;
    if (!payment || !payment.order_id || !payment.id) return res.status(200).json({ received: true, ignored: true });

    if (eventName === "payment.captured") {
      const orderId = String(payment.order_id);
      const paymentId = String(payment.id);

      // Treat the signed webhook as a notification, then independently retrieve
      // authoritative payment/order state from Razorpay before fulfillment.
      const [gatewayPayment, gatewayOrder, intentResult] = await Promise.all([
        razorpay.payments.fetch(paymentId),
        razorpay.orders.fetch(orderId),
        serviceClient.from("payment_intents")
          .select("razorpay_order_id,user_id,items,subtotal,amount_paise,currency,status,razorpay_payment_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle(),
      ]);
      if (intentResult.error) throw intentResult.error;
      const intent = intentResult.data;
      if (!intent) return res.status(409).json({ message: "Unknown payment intent" });

      const amount = Number(gatewayPayment?.amount);
      const orderAmount = Number(gatewayOrder?.amount);
      const intentAmount = Number(intent.amount_paise);
      const currency = String(gatewayPayment?.currency || "");
      const orderCurrency = String(gatewayOrder?.currency || "");
      const expectedHash = cartHash(intent.user_id, intent.items);
      const expectedSubtotal = String(Number(intent.subtotal));

      const verified =
        gatewayPayment?.id === paymentId &&
        gatewayPayment?.order_id === orderId &&
        gatewayPayment?.status === "captured" &&
        gatewayPayment?.captured === true &&
        Number.isSafeInteger(amount) && amount > 0 &&
        amount === intentAmount &&
        orderAmount === intentAmount &&
        currency === "INR" && orderCurrency === "INR" && intent.currency === "INR" &&
        gatewayOrder?.id === orderId &&
        note(gatewayOrder.notes, "user_id") === String(intent.user_id) &&
        note(gatewayOrder.notes, "server_verified_amount_inr") === expectedSubtotal &&
        note(gatewayOrder.notes, "cart_hash") === expectedHash;

      if (!verified) {
        console.error("[razorpay/webhook] authoritative payment verification failed", { orderId, paymentId });
        return res.status(409).json({ message: "Payment verification failed" });
      }

      const finalized = await serviceClient.rpc("finalize_razorpay_payment_intent", {
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_amount_paise: amount,
        p_currency: currency,
        p_event_id: eventId,
      });
      if (finalized.error) throw finalized.error;

      const result = finalized.data && typeof finalized.data === "object" ? finalized.data : {};
      const order = result.order;
      const created = result.created === true;
      if (created && order?.id) {
        try { await sendOrderReceived(order); } catch (emailError) { console.error("[razorpay/webhook] receipt email failed", emailError.message); }
      }
      return res.status(200).json({ received: true, finalized: Boolean(order?.id), replay: !created });
    }

    if (eventName === "payment.authorized" || eventName === "payment.failed") {
      const mappedStatus = eventName === "payment.authorized" ? "authorized" : "failed";
      const recorded = await serviceClient.rpc("record_razorpay_payment_event", {
        p_razorpay_order_id: String(payment.order_id),
        p_razorpay_payment_id: String(payment.id),
        p_status: mappedStatus,
        p_event_id: eventId,
      });
      if (recorded.error) throw recorded.error;
      return res.status(200).json({ received: true, recorded: Boolean(recorded.data) });
    }

    return res.status(200).json({ received: true, ignored: true });
  } catch (err) {
    console.error("[razorpay/webhook]", err?.message);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};

module.exports.config = { api: { bodyParser: false } };
