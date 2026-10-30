"use strict";

// Spin wheel before checkout (supabase/migrations/*_spin_wheel.sql). The
// prizes and their odds are in src/data/spin.json, which the website also
// uses to draw the wheel; only the server picks where it stops.

const crypto = require("crypto");
const wheel = require("../../src/data/spin.json");

const SPIN_CODE_PATTERN = /^SPIN[A-Z0-9]{6}$/;
// No 0/O or 1/I, so a code read out over WhatsApp can't be mistyped.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function isSpinCode(code) {
  return SPIN_CODE_PATTERN.test(String(code || ""));
}

function newSpinCode() {
  let code = "SPIN";
  for (let i = 0; i < 6; i += 1) code += CODE_LETTERS[crypto.randomInt(CODE_LETTERS.length)];
  return code;
}

/** A segment index, each as likely as its whole-number weight (1 unless set). */
function pickSegment() {
  const weights = wheel.segments.map((segment) => Math.max(0, Math.round(Number(segment.weight ?? 1))));
  let ticket = crypto.randomInt(weights.reduce((sum, weight) => sum + weight, 0));
  for (let index = 0; index < weights.length; index += 1) {
    if (ticket < weights[index]) return index;
    ticket -= weights[index];
  }
  return weights.length - 1;
}

/**
 * Checks a spin prize code for a customer: it exists, hasn't expired or been
 * used, and this customer hasn't used a spin prize before. `email` and `phone`
 * are already normalised (./discounts.js); either may be empty when only
 * previewing. Returns { ok: true, prize: { code, percent, testers } } or
 * { ok: false, message }.
 */
async function checkSpinPrize(client, { code, email, phone }) {
  const { data: row, error } = await client
    .from("spin_prizes")
    .select("code,percent,testers,expires_at,order_id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, message: "That spin prize code isn't valid." };
  if (row.order_id) return { ok: false, message: "This spin prize has already been used." };
  if (new Date(row.expires_at).getTime() <= Date.now()) return { ok: false, message: "This spin prize has expired." };

  const lookups = [];
  if (email) lookups.push(["email", email]);
  if (phone && phone.length === 10) lookups.push(["phone", phone]);
  for (const [column, value] of lookups) {
    const { data: used, error: usedError } = await client
      .from("spin_prizes")
      .select("id")
      .not("order_id", "is", null)
      .eq(column, value)
      .limit(1);
    if (usedError) throw usedError;
    if (used && used.length) return { ok: false, message: "You've already used a spin-wheel prize. It's one per customer." };
  }

  return { ok: true, prize: { code: row.code, percent: row.percent == null ? null : Number(row.percent), testers: row.testers == null ? null : Number(row.testers) } };
}

module.exports = { wheel, isSpinCode, newSpinCode, pickSegment, checkSpinPrize };
