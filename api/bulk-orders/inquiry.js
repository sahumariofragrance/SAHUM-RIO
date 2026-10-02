"use strict";

const { createClient } = require("@supabase/supabase-js");
const { setJsonSecurityHeaders, enforceJsonRequest, enforceRateLimit } = require("../_lib/security");
const { rejectBots } = require("../_lib/botCheck");
const { sendBulkEnquiryEmails } = require("../_lib/email");

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

module.exports = async (req, res) => {
  setJsonSecurityHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 16 * 1024 })) return;
  if (!(await rejectBots(req, res))) return;
  if (!(await enforceRateLimit(req, res, {
    scope: "bulk-inquiry",
    limit: 5,
    windowSeconds: 3600,
  }))) return;

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
    if (!Number.isFinite(estimatedOrderValue) || estimatedOrderValue < 10000) {
      return res.status(400).json({ message: "Bulk order enquiries must have an estimated order value of at least ₹10,000." });
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

    try {
      await sendBulkEnquiryEmails({
        id: data.id,
        created_at: data.created_at,
        name,
        company,
        email,
        phone,
        item_name: itemName,
        quantity,
        estimated_order_value: estimatedOrderValue,
        additional_information: additionalInformation,
      });
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
