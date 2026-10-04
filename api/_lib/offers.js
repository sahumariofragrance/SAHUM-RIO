"use strict";

// Diwali offer: every two perfumes in an order cost ₹1,299 together. Set in
// src/data/offers.json, which the website shares; src/lib/offers.js runs the
// same rule in the browser. The offer ends by itself at combo.endsAt.

const { combo } = require("../../src/data/offers.json");

function comboActive(now = Date.now()) {
  return Boolean(combo) && now <= Date.parse(combo.endsAt);
}

/**
 * Paise off for items [{ price (₹), qty }]. Bottles are paired from the most
 * expensive down; each pair costs combo.pairPrice. An odd bottle pays full price.
 */
function comboDiscountPaise(items, now = Date.now()) {
  if (!comboActive(now)) return 0;
  const units = [];
  for (const item of items) {
    for (let i = 0; i < item.qty; i += 1) units.push(Math.round(Number(item.price) * 100));
  }
  units.sort((a, b) => b - a);
  const pairPaise = combo.pairPrice * 100;
  let off = 0;
  for (let i = 0; i + 1 < units.length; i += 2) off += Math.max(0, units[i] + units[i + 1] - pairPaise);
  return off;
}

module.exports = { combo, comboActive, comboDiscountPaise };
