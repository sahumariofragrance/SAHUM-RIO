// Which perfumes can be bought now, and who each one is for.
import testerConfig from "../data/testers.json";

/**
 * A discovery box: a catalogue product whose URL starts with "discovery"
 * (e.g. sahumario.com/product/discovery-box). It holds small vials, not a
 * bottle, so it is left out of the any-2 offer, the quiz and the spin wheel tester.
 * The server checks the same rule (api/_lib/offers.js).
 */
export function isSampleSet(item) {
  return /^discovery/.test(String(item?.slug || ""));
}

/**
 * 10 ml testers: every perfume on sale can be bought as a tester (price and
 * sets in src/data/testers.json). A tester isn't a catalogue row: it has its
 * perfume's id plus TESTER_ID_OFFSET and its slug plus "-tester", so it goes
 * on sale with its perfume. The server prices it the same way
 * (api/_lib/testers.js).
 */
export const TESTER = testerConfig;
export const TESTER_ID_OFFSET = 1000000;

export function isTester(item) {
  return /-tester$/.test(String(item?.slug || ""));
}

/** The 10 ml tester of a perfume, shaped like a product for the bag. */
export function testerOf(product) {
  const slug = `${product.slug}-tester`;
  return {
    ...product,
    id: Number(product.id) + TESTER_ID_OFFSET,
    slug,
    parent: product,
    name: `${product.name} · ${TESTER.ml} ml tester`,
    shortName: product.name,
    price: TESTER.price,
    size_volume: `${TESTER.ml} ml`,
    image: `/products/testers/${product.slug}.webp`,
    image_url: `/products/testers/${product.slug}.webp`,
    gallery: [`/products/testers/${product.slug}.webp`],
    alt: `${product.name} ${TESTER.ml} ml tester spray`,
  };
}

/** Cart items or products that are perfume bottles, without discovery boxes or testers. */
export function bottlesOnly(list) {
  return list.filter((item) => !isSampleSet(item) && !isTester(item));
}

/**
 * A "Coming soon" perfume: shown in the shop with its notes, but it can't be
 * added to the bag or ordered until it is switched to "On sale" in
 * Admin → Catalogue. The server checks the same flag (api/payments/razorpay/order.js).
 */
export function isComingSoon(product) {
  return Boolean(product?.coming_soon);
}

/** Perfume bottles that can be bought now: no discovery boxes or testers, nothing coming soon. */
export function forSale(list) {
  return bottlesOnly(list).filter((product) => !isComingSoon(product));
}

/** Who a perfume is for, as set in Admin → Catalogue. */
export const AUDIENCES = [
  { id: "Men", label: "For him" },
  { id: "Women", label: "For her" },
  { id: "Unisex", label: "Unisex" },
];

/** Perfumes on sale first, then coming soon; otherwise the order is kept. */
export function onSaleFirst(list) {
  return [...list].sort((a, b) => Number(isComingSoon(a)) - Number(isComingSoon(b)));
}
