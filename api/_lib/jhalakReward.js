"use strict";

// Jhalak set thank-you codes (supabase/migrations/*_jhalak_reward_codes.sql):
// a paid order with a Jhalak set (a curated set or any 5 the customer picks,
// saved as a "Jhalak set" line by ./testers.js) gets one personal discount
// code by email: setReward.percent off 50 ml perfumes, one use, valid
// setReward.validDays days (src/data/testers.json).

const crypto = require("crypto");
const { testerConfig } = require("./testers");

const reward = testerConfig.setReward || null;
// No 0/O or 1/I, so a code read out over WhatsApp can't be mistyped.
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hasJhalakSet(order) {
  return (Array.isArray(order?.items) ? order.items : []).some((item) => item?.set === true || (Number(item?.product_id) === 0 && /^Jhalak set\b/.test(String(item?.name || ""))));
}

function newRewardCode() {
  let code = reward.codePrefix;
  for (let i = 0; i < 6; i += 1) code += CODE_LETTERS[crypto.randomInt(CODE_LETTERS.length)];
  return code;
}

/**
 * The order's thank-you code { code, percent, expiresAt }, created the first
 * time (one per order, safe to call twice), or null when the order has no
 * Jhalak set, rewards are off, or the database update hasn't run yet.
 */
async function issueJhalakReward(client, order) {
  if (!reward || !client || !order?.id || !hasJhalakSet(order)) return null;
  const existing = async () => {
    const { data } = await client.from("discount_codes").select("code,percent,expires_at").eq("reward_order_id", order.id).maybeSingle();
    return data ? { code: data.code, percent: Number(data.percent), expiresAt: data.expires_at } : null;
  };
  const already = await existing().catch(() => null);
  if (already) return already;
  const expiresAt = new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000).toISOString();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = newRewardCode();
    const { error } = await client.from("discount_codes").insert({
      code,
      percent: reward.percent,
      active: true,
      expires_at: expiresAt,
      note: `Jhalak set thank-you, order ${order.id}`,
      single_use: true,
      reward_order_id: order.id,
    });
    if (!error) return { code, percent: reward.percent, expiresAt };
    if (error.code === "23505") {
      // Another request already made this order's code, or the code is taken: look, then try a new one.
      const made = await existing().catch(() => null);
      if (made) return made;
      continue;
    }
    throw error;
  }
  throw new Error("Could not create a unique Jhalak reward code");
}

module.exports = { issueJhalakReward, hasJhalakSet };
