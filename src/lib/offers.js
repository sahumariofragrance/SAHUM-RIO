// The "any 2 perfumes for one price" offer, switched on and off in Admin →
// Discounts (supabase/migrations/*_site_offer.sql). Fetched once per visit;
// null when it is off, ended, or not set up yet, so every banner simply stays
// hidden. The server (api/_lib/offers.js) runs the same rule when it prices
// the order.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

let request = null;

function loadOffer() {
  if (!request) {
    request = supabase.rpc("site_offer").then(
      ({ data, error }) => {
        const row = Array.isArray(data) ? data[0] : data;
        return !error && row?.name ? { label: String(row.name), pairPrice: Number(row.pair_price), endsAt: row.ends_at || null } : null;
      },
      () => null,
    );
  }
  return request;
}

/** The offer while it is on: { label, pairPrice, endsAt }, or null. */
export function useOffer() {
  const [offer, setOffer] = useState(null);
  useEffect(() => {
    let active = true;
    loadOffer().then((value) => { if (active) setOffer(value); });
    return () => { active = false; };
  }, []);
  return offer && (!offer.endsAt || Date.now() < Date.parse(offer.endsAt)) ? offer : null;
}

/** Rupees off for cart items [{ price, qty }], exactly as the server counts it. */
export function comboDiscount(items, offer) {
  if (!offer) return 0;
  const units = [];
  items.forEach((item) => {
    for (let i = 0; i < item.qty; i += 1) units.push(Math.round(Number(item.price) * 100));
  });
  units.sort((a, b) => b - a);
  const pairPaise = offer.pairPrice * 100;
  let off = 0;
  for (let i = 0; i + 1 < units.length; i += 2) off += Math.max(0, units[i] + units[i + 1] - pairPaise);
  return off / 100;
}

/** "Ends 10 Nov" in Indian time, or "" when the offer has no end date. */
export function offerEnds(offer) {
  if (!offer?.endsAt) return "";
  return `Ends ${new Date(offer.endsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}`;
}
