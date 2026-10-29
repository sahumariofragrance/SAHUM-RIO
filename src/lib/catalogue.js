// Which perfumes can be bought now, and who each one is for.

/**
 * A discovery box: a catalogue product whose URL starts with "discovery"
 * (e.g. sahumario.com/product/discovery-box). It holds small vials, not a
 * bottle, so it is left out of the any-2 offer, the quiz and free samples.
 * The server checks the same rule (api/_lib/offers.js).
 */
export function isSampleSet(item) {
  return /^discovery/.test(String(item?.slug || ""));
}

/** Cart items or products that are perfume bottles, without discovery boxes. */
export function bottlesOnly(list) {
  return list.filter((item) => !isSampleSet(item));
}

/**
 * A "Coming soon" perfume: shown in the shop with its notes, but it can't be
 * added to the bag or ordered until it is switched to "On sale" in
 * Admin → Catalogue. The server checks the same flag (api/payments/razorpay/order.js).
 */
export function isComingSoon(product) {
  return Boolean(product?.coming_soon);
}

/** Perfume bottles that can be bought now: no discovery boxes, nothing coming soon. */
export function forSale(list) {
  return bottlesOnly(list).filter((product) => !isComingSoon(product));
}

/** Who a perfume is for, as set in Admin → Catalogue. */
export const AUDIENCES = [
  { id: "Men", label: "For him" },
  { id: "Women", label: "For her" },
  { id: "Unisex", label: "Unisex" },
];

export function audienceLabel(product) {
  return AUDIENCES.find((audience) => audience.id === product?.audience)?.label || "";
}

/**
 * Designed pictures (not photos of the real bottle) are kept in
 * public/products/illustrations/, so the shop can label them honestly.
 */
export function isIllustration(url) {
  return /\/products\/illustrations\//.test(String(url || ""));
}

/** Perfumes on sale first, then coming soon; otherwise the order is kept. */
export function onSaleFirst(list) {
  return [...list].sort((a, b) => Number(isComingSoon(a)) - Number(isComingSoon(b)));
}
