// Diwali offer: every two perfumes in an order cost ₹1,299 together. Set in
// src/data/offers.json; the server (api/_lib/offers.js) runs the same rule
// when it prices the order. The offer ends by itself at COMBO.endsAt.
import offers from "../data/offers.json";

export const COMBO = offers.combo;

export function comboActive(now = Date.now()) {
  return Boolean(COMBO) && now <= Date.parse(COMBO.endsAt);
}

/** Rupees off for cart items [{ price, qty }], exactly as the server counts it. */
export function comboDiscount(items, now = Date.now()) {
  if (!comboActive(now)) return 0;
  const units = [];
  items.forEach((item) => {
    for (let i = 0; i < item.qty; i += 1) units.push(Math.round(Number(item.price) * 100));
  });
  units.sort((a, b) => b - a);
  const pairPaise = COMBO.pairPrice * 100;
  let off = 0;
  for (let i = 0; i + 1 < units.length; i += 2) off += Math.max(0, units[i] + units[i + 1] - pairPaise);
  return off / 100;
}

/** "Ends 10 Nov" in Indian time. */
export function comboEndsLabel() {
  return new Date(COMBO.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}
