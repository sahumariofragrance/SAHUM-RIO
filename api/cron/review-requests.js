"use strict";

// Runs once a day (vercel.json "crons", about 10:00 India time). Emails each
// customer whose order was marked Delivered at least 7 days ago, asking for an
// honest review of the perfumes they haven't reviewed yet. Every order gets
// this email once (order_email_events "review_request"); orders delivered more
// than 30 days ago are left alone, so turning this on never emails old customers.

const crypto = require("crypto");
const { getServiceClient, setJsonSecurityHeaders } = require("../_lib/security");
const { sendReviewRequest } = require("../_lib/email");
const { checkDiscount } = require("../_lib/discounts");

// Create this code in Admin → Discounts. While it is on, the email includes it
// as a thank-you (each customer can use it once); while it is off, it doesn't.
const THANK_YOU_CODE = "THANKYOU10";
const EVENT_KEY = "review_request";
const DAY_MS = 24 * 60 * 60 * 1000;
const WAIT_DAYS = 7;
const MAX_AGE_DAYS = 30;
const MAX_EMAILS_PER_RUN = 40;

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = String(req.headers.authorization || "");
  const expected = `Bearer ${secret}`;
  return Boolean(secret) && given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

async function claim(client, orderId) {
  const { data, error } = await client.from("order_email_events").insert({ order_id: orderId, event_key: EVENT_KEY }).select("id").maybeSingle();
  if (!error) return data?.id || null;
  if (error.code === "23505") return null; // already emailed
  throw error;
}

async function markSent(client, id) {
  const { error } = await client.from("order_email_events").update({ sent_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function release(client, id) {
  const { error } = await client.from("order_email_events").delete().eq("id", id);
  if (error) console.error("[cron/review-requests] unable to release claim", error.message);
}

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!authorized(req)) return res.status(401).json({ message: "Unauthorized" });
  const client = getServiceClient();
  if (!client) return res.status(503).json({ message: "Service unavailable" });

  const summary = { due: 0, sent: 0, skipped: 0, failed: 0 };
  try {
    const now = Date.now();
    const { data: orders, error } = await client
      .from("orders")
      .select("id,user_id,items,address,delivered_at")
      .eq("status", "Delivered")
      .is("deleted_at", null)
      .lte("delivered_at", new Date(now - WAIT_DAYS * DAY_MS).toISOString())
      .gte("delivered_at", new Date(now - MAX_AGE_DAYS * DAY_MS).toISOString())
      .order("delivered_at", { ascending: true })
      .limit(500);
    if (error) throw error;
    if (!orders?.length) return res.status(200).json(summary);

    const { data: done, error: doneError } = await client
      .from("order_email_events")
      .select("order_id")
      .eq("event_key", EVENT_KEY)
      .in("order_id", orders.map((order) => order.id));
    if (doneError) throw doneError;
    const emailed = new Set((done || []).map((row) => row.order_id));
    const due = orders.filter((order) => !emailed.has(order.id) && order.address?.email).slice(0, MAX_EMAILS_PER_RUN);
    summary.due = due.length;
    if (!due.length) return res.status(200).json(summary);

    const productIds = [...new Set(due.flatMap((order) => (order.items || []).map((item) => Number(item.product_id))).filter(Number.isInteger))];
    const { data: products, error: productsError } = await client
      .from("products")
      .select("id,slug,name,image_url,active")
      .in("id", productIds);
    if (productsError) throw productsError;
    const catalogue = new Map((products || []).filter((product) => product.active && product.slug).map((product) => [Number(product.id), product]));

    for (const order of due) {
      let claimId = null;
      try {
        const ids = [...new Set((order.items || []).map((item) => Number(item.product_id)))].filter((id) => catalogue.has(id));
        let reviewed = new Set();
        if (order.user_id && ids.length) {
          const { data: reviews, error: reviewsError } = await client
            .from("product_reviews").select("product_id").eq("user_id", order.user_id).in("product_id", ids);
          if (reviewsError) throw reviewsError;
          reviewed = new Set((reviews || []).map((review) => Number(review.product_id)));
        }
        const toReview = ids.filter((id) => !reviewed.has(id)).map((id) => {
          const product = catalogue.get(id);
          return { name: product.name, slug: product.slug, image: product.image_url };
        });

        claimId = await claim(client, order.id);
        if (!claimId) continue;
        if (!toReview.length) {
          // Everything already reviewed (or no longer on sale): nothing to ask.
          await markSent(client, claimId);
          summary.skipped += 1;
          continue;
        }

        const offer = await checkDiscount(client, { code: THANK_YOU_CODE, email: order.address.email, phone: order.address.phone });
        const email = await sendReviewRequest(order, toReview, offer.ok ? { code: offer.code, percent: offer.percent } : null);
        if (email.sent) {
          await markSent(client, claimId);
          summary.sent += 1;
        } else {
          await release(client, claimId);
          summary.failed += 1;
        }
      } catch (orderError) {
        if (claimId) await release(client, claimId);
        console.error("[cron/review-requests] order failed", order.id, orderError.message);
        summary.failed += 1;
      }
    }
    return res.status(200).json(summary);
  } catch (err) {
    console.error("[cron/review-requests]", err.message);
    return res.status(500).json({ message: "Review requests failed", ...summary });
  }
};
