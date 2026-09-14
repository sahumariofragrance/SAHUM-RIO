"use strict";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function orderTotal(order) {
  return Number(order?.total ?? order?.subtotal ?? 0);
}

function plainOrderLines(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const lines = items.map((item) => `${item.name || "Item"} × ${Number(item.qty || 1)} — ${money(Number(item.price || 0) * Number(item.qty || 1))}`);
  lines.push(`Total — ${money(orderTotal(order))}`);
  return lines.join("\n");
}

function template({ eyebrow = "ORDER UPDATE", title, intro, order, extraHtml = "" }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding-top:12px;padding-bottom:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#29251f;">${escapeHtml(item.name || "Item")} × ${Number(item.qty || 1)}</td>
      <td align="right" style="padding-top:12px;padding-bottom:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#29251f;white-space:nowrap;">${money(Number(item.price || 0) * Number(item.qty || 1))}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0e8;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#f4f0e8;">
    <tr>
      <td align="center" style="padding-top:32px;padding-right:16px;padding-bottom:32px;padding-left:16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;max-width:600px;background-color:#fffdf9;border:1px solid #e4ddd1;">
          <tr>
            <td align="center" bgcolor="#241f1a" style="background-color:#241f1a;padding-top:24px;padding-right:24px;padding-bottom:24px;padding-left:24px;">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:30px;letter-spacing:2px;color:#fffdf9;font-weight:bold;">SAHUMäRIO</p>
              <p style="margin-top:6px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;letter-spacing:2px;color:#cdbb9e;">FRAGRANCE</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:36px;padding-right:32px;padding-bottom:12px;padding-left:32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:1.8px;color:#9b6a31;font-weight:bold;">${escapeHtml(eyebrow)}</p>
              <h1 style="margin-top:10px;margin-right:0;margin-bottom:12px;margin-left:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;color:#241f1a;font-weight:normal;">${escapeHtml(title)}</h1>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#625b52;">${escapeHtml(intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:16px;padding-right:32px;padding-bottom:8px;padding-left:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#f8f5ef;border:1px solid #e9e1d5;">
                <tr>
                  <td colspan="2" style="padding-top:18px;padding-right:18px;padding-bottom:12px;padding-left:18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#8a8176;letter-spacing:1px;">ORDER</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:0;padding-right:18px;padding-bottom:6px;padding-left:18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#29251f;font-weight:bold;">#${escapeHtml(order?.id)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:0;padding-right:18px;padding-bottom:2px;padding-left:18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;border-collapse:collapse;">${itemRows}
                      <tr>
                        <td style="border-top:1px solid #ded5c8;padding-top:14px;padding-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#29251f;font-weight:bold;">Total</td>
                        <td align="right" style="border-top:1px solid #ded5c8;padding-top:14px;padding-bottom:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#29251f;font-weight:bold;white-space:nowrap;">${money(orderTotal(order))}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${extraHtml ? `<tr><td style="padding-top:12px;padding-right:32px;padding-bottom:8px;padding-left:32px;">${extraHtml}</td></tr>` : ""}
          <tr>
            <td style="padding-top:24px;padding-right:32px;padding-bottom:34px;padding-left:32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#837a70;">Thank you for choosing SAHUMäRIO.</p>
              <p style="margin-top:8px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#a0978d;">This is an automated order message. Keep your order number for reference.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from || !to) {
    console.warn("[email] Email not sent: RESEND_API_KEY, ORDER_EMAIL_FROM or recipient is missing");
    return { sent: false, reason: "not_configured" };
  }

  const body = { from, to: [to], subject, html };
  if (text) body.text = text;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Email provider rejected request: ${response.status} ${responseText.slice(0, 300)}`);
  }

  const payload = await response.json().catch(() => ({}));
  return { sent: true, id: payload.id || null };
}

function customerEmail(order) {
  return order?.address?.email || null;
}

function baseText(title, intro, order, extra = "") {
  return `SAHUMäRIO\n\n${title}\n\n${intro}\n\nOrder #${order?.id || ""}\n${plainOrderLines(order)}${extra ? `\n\n${extra}` : ""}\n\nThank you for choosing SAHUMäRIO.`;
}

async function sendOrderReceived(order) {
  const title = "Order received";
  const intro = "Your payment has been verified and your order is now with us. We’ll keep you updated as it moves through preparation and shipping.";
  return sendEmail({
    to: customerEmail(order),
    subject: `We received your SAHUMäRIO order #${order.id}`,
    html: template({ eyebrow: "ORDER CONFIRMATION", title, intro, order }),
    text: baseText(title, intro, order),
  });
}

async function sendStatusEmail(order) {
  const status = order.status;
  const copy = {
    Accepted: ["Order accepted", "Your order has been accepted and is now being prepared for dispatch."],
    Processing: ["Order in preparation", "Your order is being prepared. We’ll send your courier and tracking details as soon as it ships."],
    Rejected: ["Order update", "We’re unable to proceed with this order. Please contact SAHUMäRIO if you need help or clarification."],
    Cancelled: ["Order cancelled", "Your order has been cancelled. Please contact SAHUMäRIO if you have any questions about this order."],
    Delivered: ["Order delivered", "Your order has been marked as delivered. We hope you enjoy your SAHUMäRIO fragrance."],
  }[status];

  if (!copy) return { sent: false, reason: "no_email_for_status" };

  return sendEmail({
    to: customerEmail(order),
    subject: `${copy[0]} — #${order.id}`,
    html: template({ eyebrow: "ORDER UPDATE", title: copy[0], intro: copy[1], order }),
    text: baseText(copy[0], copy[1], order),
  });
}

async function sendShipped(order) {
  const courier = escapeHtml(order.courier || "Courier");
  const tracking = escapeHtml(order.tracking_number || "");
  const hasTrackingLink = Boolean(order.tracking_url && /^https:\/\//i.test(order.tracking_url));
  const link = hasTrackingLink
    ? `<table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="#9b6a31" style="background-color:#9b6a31;"><a href="${escapeHtml(order.tracking_url)}" style="display:inline-block;padding-top:12px;padding-right:18px;padding-bottom:12px;padding-left:18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#ffffff;text-decoration:none;font-weight:bold;">Track your order</a></td></tr></table>`
    : "";

  const extraHtml = `<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#fffdf9;border:1px solid #e9e1d5;"><tr><td style="padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:23px;color:#514a42;"><strong style="color:#29251f;">Courier:</strong> ${courier}<br><strong style="color:#29251f;">Tracking number:</strong> ${tracking}${link ? `<br><br>${link}` : ""}</td></tr></table>`;
  const title = "Your order is on the way";
  const intro = "Your parcel has shipped. Keep the tracking details below handy while it makes its way to you.";
  const textExtra = `Courier: ${order.courier || "Courier"}\nTracking number: ${order.tracking_number || ""}${hasTrackingLink ? `\nTrack: ${order.tracking_url}` : ""}`;

  return sendEmail({
    to: customerEmail(order),
    subject: `Your SAHUMäRIO order #${order.id} has shipped`,
    html: template({ eyebrow: "SHIPPING UPDATE", title, intro, order, extraHtml }),
    text: baseText(title, intro, order, textExtra),
  });
}

module.exports = { sendOrderReceived, sendStatusEmail, sendShipped };
