"use strict";

const crypto = require("crypto");
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
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const serviceClient = getServiceClient();
    if (!webhookSecret || !serviceClient) {
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
      const amount = Number(payment.amount);
      const currency = String(payment.currency || "");
      if (!Number.isSafeInteger(amount) || amount <= 0 || currency !== "INR" || payment.status !== "captured") return res.status(400).json({ message: "Captured payment payload is invalid" });

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
