"use strict";

// The "any 2 perfumes for one price" offer, switched on and off in Admin →
// Discounts (supabase/migrations/*_site_offer.sql). src/lib/offers.js runs the
// same rule in the browser.

/**
 * A discovery box (URL starting with "discovery", e.g. /product/discovery-box)
 * holds sample vials, not a bottle, so it is not part of the offer. The
 * website uses the same rule (src/lib/catalogue.js).
 */
function isSampleSetSlug(slug) {
  return /^discovery/.test(String(slug || ""));
}

/**
 * The offer while it is on and not ended: { label, pairPrice }, or null. Null
 * too before the database update or if it can't be read, so an order is never
 * priced lower than the database allows.
 */
async function loadOffer(client) {
  const { data, error } = await client.rpc("site_offer");
  if (error) {
    console.error("[offers] could not read the offer; none applied:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.name || (row.ends_at && Date.parse(row.ends_at) <= Date.now())) return null;
  const pairPrice = Number(row.pair_price);
  return Number.isInteger(pairPrice) && pairPrice > 0 ? { label: String(row.name), pairPrice } : null;
}

/**
 * Paise off for items [{ price (₹), qty }]. Bottles are paired from the most
 * expensive down; each pair costs offer.pairPrice. An odd bottle pays full price.
 */
function comboDiscountPaise(items, offer) {
  if (!offer) return 0;
  const units = [];
  for (const item of items) {
    for (let i = 0; i < item.qty; i += 1) units.push(Math.round(Number(item.price) * 100));
  }
  units.sort((a, b) => b - a);
  const pairPaise = offer.pairPrice * 100;
  let off = 0;
  for (let i = 0; i + 1 < units.length; i += 2) off += Math.max(0, units[i] + units[i + 1] - pairPaise);
  return off;
}

module.exports = { loadOffer, comboDiscountPaise, isSampleSetSlug };
