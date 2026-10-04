"use strict";

// Discount codes (supabase/migrations/*_discount_codes.sql): percentage codes
// that each customer can use once, by order email or phone number.

const CODE_PATTERN = /^[A-Z0-9]{3,20}$/;

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

/** Whole-rupee discount, in paise. The same formula runs in the browser. */
function discountPaise(subtotalPaise, percent) {
  return Math.round((subtotalPaise * percent) / 100 / 100) * 100;
}

/**
 * Checks a code for a customer. Returns { ok: true, code, percent } or
 * { ok: false, message }. Email/phone are optional when only previewing a code
 * in the bag; checkout always passes both.
 */
async function checkDiscount(client, { code, email, phone }) {
  const wanted = normalizeCode(code);
  if (!CODE_PATTERN.test(wanted)) return { ok: false, message: "That discount code isn't valid." };

  const { data: row, error } = await client
    .from("discount_codes")
    .select("id,code,percent,active,expires_at")
    .eq("code", wanted)
    .maybeSingle();
  if (error) throw error;
  if (!row || !row.active) return { ok: false, message: "That discount code isn't valid." };
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, message: "That discount code has expired." };
  }

  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  const lookups = [];
  if (cleanEmail) lookups.push(["email", cleanEmail]);
  if (cleanPhone.length === 10) lookups.push(["phone", cleanPhone]);
  for (const [column, value] of lookups) {
    const { data: used, error: usedError } = await client
      .from("discount_redemptions")
      .select("id")
      .eq("code_id", row.id)
      .eq(column, value)
      .limit(1);
    if (usedError) throw usedError;
    if (used && used.length) return { ok: false, message: "This code has already been used with your email or phone number." };
  }

  return { ok: true, code: row.code, percent: Number(row.percent) };
}

module.exports = { checkDiscount, discountPaise, normalizeCode, normalizeEmail, normalizePhone };
