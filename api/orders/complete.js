"use strict";

const crypto = require("crypto");
const Razorpay = require("razorpay");
const { createClient } = require("@supabase/supabase-js");
const { requireCustomer } = require("../_lib/customerAuth");
const { sendOrderReceived } = require("../_lib/email");
const { setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../_lib/security");

let razorpayClient = null;

function getRazorpayClient() {
  if (razorpayClient) return razorpayClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function validRazorpayId(value, prefix) {
  return typeof value === "string" && new RegExp(`^${prefix}_[A-Za-z0-9]{14,24}$`).test(value);
}

function verifySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature || "")) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
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
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 16 * 1024 })) return;

  try {
    const { user } = await requireCustomer(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "complete-order",
      limit: 20,
      windowSeconds: 600,
      identifier: user.id,
    }))) return;
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      !validRazorpayId(orderId, "order") ||
      !validRazorpayId(paymentId, "pay") ||
      !verifySignature(orderId, paymentId, signature)
    ) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const razorpay = getRazorpayClient();
    const serviceClient = getServiceClient();
    if (!razorpay || !serviceClient) {
      return res.status(500).json({ message: "Payment verification service is not configured. Please contact support." });
    }

    const intentResult = await serviceClient
      .from("payment_intents")
      .select("razorpay_order_id,user_id,items,subtotal,amount_paise,currency,status,razorpay_payment_id")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (intentResult.error) throw intentResult.error;
    const intent = intentResult.data;
    if (!intent) return res.status(409).json({ message: "Payment intent was not found. Please contact support with your payment ID." });
    if (String(intent.user_id) !== String(user.id)) {
      return res.status(403).json({ message: "Payment order does not belong to this account" });
    }
    if (intent.razorpay_payment_id && intent.razorpay_payment_id !== paymentId) {
      return res.status(409).json({ message: "Payment does not match the stored payment intent" });
    }

    const [gatewayOrder, gatewayPayment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ]);

    const intentAmount = Number(intent.amount_paise);
    const paymentAmount = Number(gatewayPayment?.amount);
    const orderAmount = Number(gatewayOrder?.amount);
    const expectedSubtotal = String(Number(intent.subtotal));
    const expectedHash = cartHash(intent.user_id, intent.items);

    const metadataVerified =
      gatewayOrder?.id === orderId &&
      gatewayPayment?.id === paymentId &&
      gatewayPayment?.order_id === orderId &&
      Number.isSafeInteger(intentAmount) &&
      intentAmount > 0 &&
      paymentAmount === intentAmount &&
      orderAmount === intentAmount &&
      gatewayPayment?.currency === "INR" &&
      gatewayOrder?.currency === "INR" &&
      intent.currency === "INR" &&
      note(gatewayOrder.notes, "user_id") === String(intent.user_id) &&
      note(gatewayOrder.notes, "server_verified_amount_inr") === expectedSubtotal &&
      note(gatewayOrder.notes, "cart_hash") === expectedHash &&
      note(gatewayOrder.notes, "intent_version") === "3" &&
      Number(gatewayPayment?.amount_refunded || 0) === 0 &&
      !gatewayPayment?.refund_status;

    if (!metadataVerified) {
      return res.status(409).json({ message: "Payment could not be matched to the stored order. Please contact support with your payment ID." });
    }

    let verifiedPayment = gatewayPayment;
    if (gatewayPayment.status === "authorized") {
      verifiedPayment = await razorpay.payments.capture(paymentId, intentAmount, "INR");
    }
    if (!verifiedPayment || verifiedPayment.status !== "captured" || verifiedPayment.captured !== true) {
      return res.status(409).json({ message: "Payment is not captured yet. Please do not pay again; contact support with your payment ID." });
    }

    const finalized = await serviceClient.rpc("finalize_razorpay_payment_intent", {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId,
      p_amount_paise: intentAmount,
      p_currency: "INR",
      p_event_id: null,
    });
    if (finalized.error) throw finalized.error;

    const result = finalized.data && typeof finalized.data === "object" ? finalized.data : {};
    const order = result.order;
    if (!order?.id) throw new Error("Order finalization returned no order");

    if (result.created === true) {
      try {
        await sendOrderReceived(order);
      } catch (emailError) {
        console.error("[orders/complete] receipt email failed", emailError.message);
      }
    }

    return res.status(200).json({ order, replay: result.created !== true });
  } catch (err) {
    console.error("[orders/complete]", err?.message);
    return res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : "Unable to complete order. Please contact support if payment was taken.",
    });
  }
};
