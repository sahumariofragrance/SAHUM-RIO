/**
 * POST /api/payments/promo/validate
 *
 * Validates promo code and returns discount percentage.
 * Expects: { code: string, subtotal?: number }
 * Returns: { valid: boolean, discountPercent?: number, message?: string }
 */

const DEFAULT_CODES = {
  SAHUM10: 10,
  WELCOME15: 15,
  FRAGRANCE20: 20,
};

const { createClient } = require("@supabase/supabase-js");

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function escapeFilterValue(value) {
  return String(value || "").replace(/,/g, "\\,").replace(/\)/g, "\\)");
}

async function hasPriorOrderWithPromoIdentity({ phone, email }) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Promo] Supabase env missing; skipping first-time user check");
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const filters = [];
  if (phone) filters.push(`address->>phone.eq.${escapeFilterValue(phone)}`);
  if (email) filters.push(`address->>email.eq.${escapeFilterValue(email)}`);

  if (!filters.length) return false;

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .or(filters.join(","))
    .limit(1);

  if (error) {
    console.warn("[Promo] Unable to validate first-time user check:", error.message);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

function resolvePromoMap() {
  const raw = process.env.PROMO_CODES_JSON;
  if (!raw) return DEFAULT_CODES;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_CODES;

    return Object.entries(parsed).reduce((acc, [code, discount]) => {
      const percent = Number(discount);
      if (Number.isFinite(percent) && percent > 0) {
        acc[String(code).trim().toUpperCase()] = percent;
      }
      return acc;
    }, {});
  } catch {
    return DEFAULT_CODES;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { code, phone, email } = req.body || {};
  const promoCode = String(code || "").trim().toUpperCase();
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);

  if (!promoCode) {
    return res.status(400).json({ valid: false, message: "Promo code is required" });
  }

  const promoMap = resolvePromoMap();
  if (!Object.prototype.hasOwnProperty.call(promoMap, promoCode)) {
    return res.status(404).json({ valid: false, message: "Invalid promo code" });
  }

  if (!normalizedPhone || !normalizedEmail) {
    return res.status(400).json({
      valid: false,
      message: "Enter both phone number and email to redeem this promo.",
    });
  }

  const alreadyUsed = await hasPriorOrderWithPromoIdentity({
    phone: normalizedPhone,
    email: normalizedEmail,
  });

  if (alreadyUsed) {
    return res.status(409).json({
      valid: false,
      message: "Promo is for first-time users only. This phone or email has already placed an order.",
    });
  }

  return res.status(200).json({
    valid: true,
    discountPercent: promoMap[promoCode],
    message: "Promo validated",
  });
};
