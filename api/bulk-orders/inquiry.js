"use strict";

const { createClient } = require("@supabase/supabase-js");

function clean(value, max = 300) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F\r\n\t]/g, " ")
    .trim()
    .slice(0, max);
}

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !from || !to) return { sent: false, reason: "not_configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Email provider rejected request: ${response.status} ${responseText.slice(0, 250)}`);
  }

  return response.json().catch(() => ({}));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  if (!req.headers["content-type"]?.includes("application/json")) {
    return res.status(415).json({ message: "Content-Type must be application/json" });
  }

  try {
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

    // Honeypot: real customers never see or fill this field.
    if (clean(body.website, 200)) return res.status(200).json({ received: true });

    const name = clean(body.name, 120);
    const company = clean(body.company, 160) || null;
    const email = clean(body.email, 200).toLowerCase();
    const phone = clean(body.phone, 30);
    const itemName = clean(body.item_name, 300);
    const quantity = Number(body.quantity);
    const estimatedOrderValue = Number(body.estimated_order_value);
    const additionalInformation = clean(body.additional_information, 2000) || null;
    const acceptedTerms = body.accepted_terms === true;

    if (!name || !email || !phone || !itemName) {
      return res.status(400).json({ message: "Please complete all required fields." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      return res.status(400).json({ message: "Please enter a valid phone number." });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      return res.status(400).json({ message: "Please enter a valid quantity." });
    }
    if (!Number.isFinite(estimatedOrderValue) || estimatedOrderValue < 25000) {
      return res.status(400).json({ message: "Bulk order enquiries must have an estimated order value of at least ₹25,000." });
    }
    if (!acceptedTerms) {
      return res.status(400).json({ message: "Please accept the bulk order terms and conditions." });
    }

    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return res.status(503).json({ message: "Bulk enquiry service is temporarily unavailable." });
    }

    const { data, error } = await serviceClient
      .from("bulk_order_inquiries")
      .insert({
        name,
        company,
        email,
        phone,
        item_name: itemName,
        quantity,
        estimated_order_value: estimatedOrderValue,
        additional_information: additionalInformation,
      })
      .select("id,created_at")
      .single();

    if (error) throw error;

    const valueText = `₹${estimatedOrderValue.toLocaleString("en-IN")}`;
    const internalText = [
      "New SAHUMäRIO bulk order enquiry",
      "",
      `Reference: ${data.id}`,
      `Name: ${name}`,
      `Company: ${company || "—"}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Product / requirement: ${itemName}`,
      `Quantity: ${quantity}`,
      `Estimated order value: ${valueText}`,
      `Additional information: ${additionalInformation || "—"}`,
    ].join("\n");

    try {
      await Promise.all([
        sendEmail({
          to: "sahumariofragrance@gmail.com",
          subject: `Bulk order enquiry — ${name}`,
          text: internalText,
          html: `<h2>New bulk order enquiry</h2>
            <p><strong>Reference:</strong> ${escapeHtml(data.id)}</p>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company || "—")}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            <p><strong>Product / requirement:</strong> ${escapeHtml(itemName)}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Estimated order value:</strong> ${escapeHtml(valueText)}</p>
            <p><strong>Additional information:</strong> ${escapeHtml(additionalInformation || "—")}</p>`,
        }),
        sendEmail({
          to: email,
          subject: "We received your SAHUMäRIO bulk order enquiry",
          text: `Thank you for contacting SAHUMäRIO about a bulk order. We have received your enquiry (reference ${data.id}). Our team will review your requirements and contact you to discuss availability, pricing, delivery, and payment details.\n\nSAHUMäRIO`,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b211a">
            <h2 style="font-family:Georgia,serif">Thank you for your enquiry.</h2>
            <p>We have received your SAHUMäRIO bulk order request.</p>
            <p><strong>Reference:</strong> ${escapeHtml(data.id)}</p>
            <p>Our team will review your requirements and contact you to discuss availability, pricing, delivery, and payment details.</p>
            <p>SAHUMäRIO</p>
          </div>`,
        }),
      ]);
    } catch (emailError) {
      console.error("[bulk-orders/inquiry] notification email failed", emailError.message);
    }

    return res.status(201).json({
      received: true,
      reference: data.id,
      message: "Thank you. Your bulk order enquiry has been received.",
    });
  } catch (err) {
    console.error("[bulk-orders/inquiry]", err?.message);
    return res.status(500).json({ message: "Unable to submit your enquiry right now. Please try again." });
  }
};
