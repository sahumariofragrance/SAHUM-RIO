"use strict";

const { requireAdmin, setApiHeaders } = require("../../_lib/adminAuth");

const ALLOWED = new Set(["Pending", "Accepted", "Processing", "Shipped", "Delivered", "Rejected", "Cancelled"]);

function cleanText(value, max) {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

module.exports = async (req, res) => {
  setApiHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { adminClient, user } = await requireAdmin(req);
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const orderId = cleanText(body.order_id, 128);
    const status = cleanText(body.status, 32);
    const courier = cleanText(body.courier, 100);
    const trackingNumber = cleanText(body.tracking_number, 150);
    const trackingUrl = cleanText(body.tracking_url, 500);

    if (!orderId || !status || !ALLOWED.has(status)) {
      return res.status(400).json({ message: "Invalid order ID or status" });
    }
    if (body.courier != null && courier === undefined) return res.status(400).json({ message: "Invalid courier" });
    if (body.tracking_number != null && trackingNumber === undefined) return res.status(400).json({ message: "Invalid tracking number" });
    if (body.tracking_url != null && trackingUrl === undefined) return res.status(400).json({ message: "Invalid tracking URL" });
    if (trackingUrl && !/^https:\/\//i.test(trackingUrl)) return res.status(400).json({ message: "Tracking URL must use HTTPS" });
    if (status === "Shipped" && (!courier || !trackingNumber)) {
      return res.status(400).json({ message: "Courier and tracking number are required when marking an order shipped" });
    }

    const now = new Date().toISOString();
    const patch = {
      status,
      updated_at: now,
      updated_by: user.id,
      courier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
    };
    if (status === "Accepted") patch.accepted_at = now;
    if (status === "Shipped") patch.shipped_at = now;
    if (status === "Delivered") patch.delivered_at = now;

    const { data, error } = await adminClient
      .from("orders")
      .update(patch)
      .eq("id", orderId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ order: data });
  } catch (err) {
    console.error("[admin/orders/update]", err.message);
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Unable to update order" });
  }
};
