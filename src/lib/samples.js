// Free samples and the discovery box.

import { perfumeTags } from "./scentQuiz";

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
 * The perfume to pack as the free 2 ml sample with an order: one the customer
 * didn't buy, closest in character to what they did buy, so it is likely to
 * be their next bottle. Null when there is nothing sensible to add: the order
 * has a discovery box (every scent is already in it) or no other perfume is left.
 */
export function suggestSample(orderItems, products) {
  const byId = new Map(products.map((product) => [Number(product.id), product]));
  const ordered = orderItems.map((item) => byId.get(Number(item.product_id))).filter(Boolean);
  if (!ordered.length || ordered.some(isSampleSet)) return null;

  const wanted = {};
  ordered.forEach((product) => {
    Object.entries(perfumeTags(product)).forEach(([tag, strength]) => { wanted[tag] = (wanted[tag] || 0) + strength; });
  });
  const boughtIds = new Set(ordered.map((product) => product.id));
  const candidates = bottlesOnly(products).filter((product) => !boughtIds.has(product.id));
  if (!candidates.length) return null;

  return candidates
    .map((product, order) => {
      const shared = Object.entries(perfumeTags(product))
        .reduce((sum, [tag, strength]) => sum + Math.min(strength, wanted[tag] || 0), 0);
      return { product, order, shared };
    })
    .sort((a, b) => b.shared - a.shared || a.order - b.order)[0].product;
}
