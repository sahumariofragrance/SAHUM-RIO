"use strict";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function template({ title, intro, order, extraHtml = "" }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemRows = items.map((item) => `<tr><td style="padding:8px 0">${escapeHtml(item.name)} × ${Number(item.qty || 1)}</td><td style="padding:8px 0;text-align:right">${money(Number(item.price || 0) * Number(item.qty || 1))}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f7f7f5;font-family:Arial,sans-serif;color:#222"><div style="max-width:600px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #e8e4dc;border-radius:12px;padding:28px"><div style="font-size:20px;font-weight:700;letter-spacing:.08em">SAHUMäRIO</div><h1 style="font-size:22px;margin:24px 0 10px">${escapeHtml(title)}</h1><p style="line-height:1.6;color:#555">${escapeHtml(intro)}</p><div style="margin:24px 0;padding:16px;background:#faf9f6;border-radius:8px"><div style="font-weight:600">Order #${escapeHtml(order?.id)}</div><table style="width:100%;margin-top:12px;border-collapse:collapse;font-size:14px">${itemRows}<tr><td style="padding-top:12px;border-top:1px solid #ddd;font-weight:700">Total</td><td style="padding-top:12px;border-top:1px solid #ddd;text-align:right;font-weight:700">${money(order?.total ?? order?.subtotal)}</td></tr></table></div>${extraHtml}<p style="margin-top:28px;font-size:13px;color:#777">Thank you for shopping with SAHUMäRIO.</p></div></div></body></html>`;
}

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from || !to) {
    console.warn("[email] Email not sent: RESEND_API_KEY, ORDER_EMAIL_FROM or recipient is missing");
    return { sent: false, reason: "not_configured" };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email provider rejected request: ${response.status} ${text.slice(0, 300)}`);
  }
  return { sent: true };
}

function customerEmail(order) {
  return order?.address?.email || null;
}

async function sendOrderReceived(order) {
  return sendEmail({ to: customerEmail(order), subject: `We received your SAHUMäRIO order #${order.id}`, html: template({ title: "Order received", intro: "Your payment has been verified and we have received your order. We’ll email you again when the order is accepted and when it ships.", order }) });
}

async function sendStatusEmail(order) {
  const status = order.status;
  const copy = {
    Accepted: ["Order accepted", "Your order has been accepted and is being prepared."],
    Rejected: ["Order update", "Your order has been rejected. Please contact SAHUMäRIO support if you need help with this order."],
    Cancelled: ["Order cancelled", "Your order has been cancelled. Please contact SAHUMäRIO support if you have any questions."],
    Delivered: ["Order delivered", "Your order has been marked as delivered. We hope you enjoy your fragrance."],
  }[status];
  if (!copy) return { sent: false, reason: "no_email_for_status" };
  return sendEmail({ to: customerEmail(order), subject: `${copy[0]} — #${order.id}`, html: template({ title: copy[0], intro: copy[1], order }) });
}

async function sendShipped(order) {
  const courier = escapeHtml(order.courier || "Courier");
  const tracking = escapeHtml(order.tracking_number || "");
  const link = order.tracking_url && /^https:\/\//i.test(order.tracking_url) ? `<p style="margin-top:16px"><a href="${escapeHtml(order.tracking_url)}" style="display:inline-block;background:#b86b20;color:white;text-decoration:none;padding:11px 18px;border-radius:7px;font-weight:600">Track Order</a></p>` : "";
  const extraHtml = `<div style="line-height:1.7"><strong>Courier:</strong> ${courier}<br><strong>Tracking number:</strong> ${tracking}${link}</div>`;
  return sendEmail({ to: customerEmail(order), subject: `Your SAHUMäRIO order #${order.id} has shipped`, html: template({ title: "Your order is on the way", intro: "Your parcel has been shipped. Your tracking details are below.", order, extraHtml }) });
}

module.exports = { sendOrderReceived, sendStatusEmail, sendShipped };
