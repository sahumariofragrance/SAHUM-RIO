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

// The branded shell shared by every email: dark SAHUMäRIO header, eyebrow,
// title and intro, then `bodyHtml` (table rows) and the footer text.
function layout({ eyebrow, title, intro, bodyHtml = "", footerHtml, preheader = "" }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0e8;">${preheader ? `
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>` : ""}
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
${bodyHtml}          <tr>
            <td style="padding-top:24px;padding-right:32px;padding-bottom:34px;padding-left:32px;">
${footerHtml}            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function template({ eyebrow = "ORDER UPDATE", title, intro, order, extraHtml = "" }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding-top:12px;padding-bottom:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#29251f;">${escapeHtml(item.name || "Item")} × ${Number(item.qty || 1)}</td>
      <td align="right" style="padding-top:12px;padding-bottom:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#29251f;white-space:nowrap;">${money(Number(item.price || 0) * Number(item.qty || 1))}</td>
    </tr>`).join("");

  const bodyHtml = `          <tr>
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
`;
  const footerHtml = `              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#837a70;">Thank you for choosing SAHUMäRIO.</p>
              <p style="margin-top:8px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:#a0978d;">This is an automated order message. Keep your order number for reference.</p>
`;
  return layout({ eyebrow, title, intro, bodyHtml, footerHtml });
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from || !to) {
    console.warn("[email] Email not sent: RESEND_API_KEY, ORDER_EMAIL_FROM or recipient is missing");
    return { sent: false, reason: "not_configured" };
  }

  const body = { from, to: [to], subject, html };
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;

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

// ── Bulk order enquiries ────────────────────────────────────────────────────

const SANS = "font-family:Arial,Helvetica,sans-serif;";
const BRAND_PHONE = "+91 99745 99910";
const BRAND_PHONE_LINK = "+919974599910";
const BULK_INBOX = "sahumariofragrance@gmail.com";

function shortReference(id) {
  return String(id || "").split("-")[0].toUpperCase();
}

function istDateTime(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

// Indian numbers are stored as typed; WhatsApp links need the country code.
function whatsappNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

function cardRow(innerHtml, { top = 16 } = {}) {
  return `          <tr>
            <td style="padding-top:${top}px;padding-right:32px;padding-bottom:8px;padding-left:32px;">
${innerHtml}
            </td>
          </tr>
`;
}

// Label/value pairs in the cream card used by the order emails. Values are HTML.
function detailsCard(heading, rows) {
  const body = rows.map(([label, valueHtml], index) => `
                <tr>
                  <td valign="top" style="${index ? "border-top:1px solid #ece4d8;" : ""}padding-top:11px;padding-right:12px;padding-bottom:11px;padding-left:18px;${SANS}font-size:13px;line-height:20px;color:#8a8176;width:38%;">${escapeHtml(label)}</td>
                  <td valign="top" style="${index ? "border-top:1px solid #ece4d8;" : ""}padding-top:11px;padding-right:18px;padding-bottom:11px;padding-left:0;${SANS}font-size:14px;line-height:20px;color:#29251f;">${valueHtml}</td>
                </tr>`).join("");
  return `              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#f8f5ef;border:1px solid #e9e1d5;border-collapse:collapse;">
                <tr>
                  <td colspan="2" style="padding-top:16px;padding-right:18px;padding-bottom:6px;padding-left:18px;${SANS}font-size:12px;line-height:18px;color:#8a8176;letter-spacing:1px;">${escapeHtml(heading)}</td>
                </tr>${body}
                <tr><td colspan="2" style="padding-bottom:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>`;
}

// Two big figures side by side: quantity and estimated value.
function figuresCard(figures) {
  const cells = figures.map(([label, value], index) => `
                  <td width="50%" valign="top" style="width:50%;${index ? "border-left:1px solid #e9e1d5;" : ""}padding-top:18px;padding-right:18px;padding-bottom:18px;padding-left:18px;">
                    <p style="margin:0;${SANS}font-size:11px;line-height:16px;letter-spacing:1.5px;color:#8a8176;">${escapeHtml(label)}</p>
                    <p style="margin-top:6px;margin-right:0;margin-bottom:0;margin-left:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:32px;color:#241f1a;">${escapeHtml(value)}</p>
                  </td>`).join("");
  return `              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;background-color:#fffdf9;border:1px solid #e9e1d5;border-collapse:collapse;">
                <tr>${cells}
                </tr>
              </table>`;
}

function buttons(links) {
  const cells = links.map(([href, label, primary]) => `
                  <td style="padding-right:10px;padding-bottom:8px;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td bgcolor="${primary ? "#9b6a31" : "#fffdf9"}" style="background-color:${primary ? "#9b6a31" : "#fffdf9"};border:1px solid #9b6a31;"><a href="${escapeHtml(href)}" style="display:inline-block;padding-top:12px;padding-right:20px;padding-bottom:12px;padding-left:20px;${SANS}font-size:14px;line-height:20px;color:${primary ? "#ffffff" : "#9b6a31"};text-decoration:none;font-weight:bold;">${escapeHtml(label)}</a></td></tr></table>
                  </td>`).join("");
  return `              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>${cells}
                </tr>
              </table>`;
}

function footerLines(lines) {
  return lines.map((line, index) => `              <p style="margin-top:${index ? 8 : 0}px;margin-right:0;margin-bottom:0;margin-left:0;${SANS}font-size:${index ? 12 : 13}px;line-height:${index ? 19 : 21}px;color:${index ? "#a0978d" : "#837a70"};">${line}</p>
`).join("");
}

function link(href, text) {
  return `<a href="${escapeHtml(href)}" style="color:#9b6a31;text-decoration:underline;">${escapeHtml(text)}</a>`;
}

/** Notifies SAHUMäRIO of a new bulk enquiry and confirms it to the customer. */
async function sendBulkEnquiryEmails(enquiry) {
  const { id, created_at: createdAt, name, company, email, phone, item_name: itemName, quantity, estimated_order_value: value, additional_information: notes } = enquiry;
  const ref = shortReference(id);
  const valueText = money(value);
  const quantityText = Number(quantity).toLocaleString("en-IN");
  const received = istDateTime(createdAt);
  const firstName = String(name || "").trim().split(/\s+/)[0] || "there";
  const replySubject = `Re: Your SAHUMäRIO bulk order enquiry #${ref}`;
  const wa = whatsappNumber(phone);

  // To SAHUMäRIO: everything needed to reply, with the customer as reply-to.
  const internalRows = [
    ["Product", escapeHtml(itemName)],
    ["Name", escapeHtml(name)],
    company && ["Company", escapeHtml(company)],
    ["Email", link(`mailto:${email}`, email)],
    ["Phone", link(`tel:+${wa}`, phone)],
    notes && ["Notes", escapeHtml(notes)],
    ["Received", escapeHtml(received)],
  ].filter(Boolean);
  const internalIntro = `${name}${company ? ` from ${company}` : ""} would like to place a bulk order. Reply to this email to answer them directly.`;
  const internal = sendEmail({
    to: BULK_INBOX,
    replyTo: email,
    subject: `Bulk enquiry #${ref} — ${name}, ${quantityText} pcs, ${valueText}`,
    html: layout({
      eyebrow: "NEW BULK ENQUIRY",
      title: "New bulk order enquiry",
      intro: internalIntro,
      preheader: `${itemName} · ${quantityText} pcs · ${valueText}`,
      bodyHtml: cardRow(figuresCard([["QUANTITY", quantityText], ["EST. VALUE", valueText]]))
        + cardRow(detailsCard(`ENQUIRY #${ref}`, internalRows), { top: 12 })
        + cardRow(buttons([
          [`mailto:${email}?subject=${encodeURIComponent(replySubject)}`, "Reply by email", true],
          [`https://wa.me/${wa}`, "WhatsApp", false],
        ]), { top: 18 }),
      footerHtml: footerLines([
        "Saved in your bulk enquiries list.",
        `Full reference: ${escapeHtml(id)}`,
      ]),
    }),
    text: [
      `New bulk order enquiry #${ref}`,
      "",
      internalIntro,
      "",
      `Quantity: ${quantityText}`,
      `Estimated value: ${valueText}`,
      `Product / requirement: ${itemName}`,
      `Name: ${name}`,
      company && `Company: ${company}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      notes && `Notes: ${notes}`,
      `Received: ${received}`,
      "",
      `Full reference: ${id}`,
    ].filter((line) => line !== null && line !== undefined && line !== false).join("\n"),
  });

  // To the customer: a warm confirmation with a summary of what they sent.
  const customerRows = [
    ["Product", escapeHtml(itemName)],
    ["Quantity", escapeHtml(quantityText)],
    ["Estimated value", escapeHtml(valueText)],
    notes && ["Notes", escapeHtml(notes)],
  ].filter(Boolean);
  const customerIntro = "We’ve received your bulk order enquiry. Our team will review your requirements and get in touch to discuss availability, pricing, delivery and payment.";
  const customer = sendEmail({
    to: email,
    subject: `We received your SAHUMäRIO bulk order enquiry #${ref}`,
    html: layout({
      eyebrow: "BULK ORDER ENQUIRY",
      title: `Thank you, ${firstName}.`,
      intro: customerIntro,
      preheader: `Your enquiry #${ref} is with our team.`,
      bodyHtml: cardRow(detailsCard(`YOUR ENQUIRY #${ref}`, customerRows))
        + cardRow(`              <p style="margin:0;${SANS}font-size:14px;line-height:22px;color:#625b52;">Questions in the meantime? Call or WhatsApp us on ${link(`tel:${BRAND_PHONE_LINK}`, BRAND_PHONE)}.</p>`, { top: 12 }),
      footerHtml: footerLines([
        "Thank you for choosing SAHUMäRIO.",
        `Please keep your reference #${ref} for any follow-up.`,
      ]),
    }),
    text: [
      `Thank you, ${firstName}.`,
      "",
      customerIntro,
      "",
      `Your enquiry #${ref}`,
      `Product / requirement: ${itemName}`,
      `Quantity: ${quantityText}`,
      `Estimated value: ${valueText}`,
      notes && `Notes: ${notes}`,
      "",
      `Questions in the meantime? Call or WhatsApp us on ${BRAND_PHONE}.`,
      "",
      "SAHUMäRIO",
    ].filter((line) => line !== null && line !== undefined && line !== false).join("\n"),
  });

  return Promise.all([internal, customer]);
}

module.exports = { sendOrderReceived, sendStatusEmail, sendShipped, sendBulkEnquiryEmails };
