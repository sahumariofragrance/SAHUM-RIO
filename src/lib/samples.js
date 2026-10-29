// Free samples and the discovery box.

import { perfumeTags } from "./scentQuiz";
import { forSale, isSampleSet } from "./catalogue";

// Kept here too, so existing imports keep working.
export { bottlesOnly, isSampleSet } from "./catalogue";

/**
 * The perfume to pack as the free 2 ml sample with an order: one the customer
 * didn't buy, closest in character to what they did buy, so it is likely to
 * be their next bottle, and never one still coming soon. Null when there is
 * nothing sensible to add: the order has a discovery box (every scent is
 * already in it) or no other perfume is left.
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
  const candidates = forSale(products).filter((product) => !boughtIds.has(product.id));
  if (!candidates.length) return null;

  return candidates
    .map((product, order) => {
      const shared = Object.entries(perfumeTags(product))
        .reduce((sum, [tag, strength]) => sum + Math.min(strength, wanted[tag] || 0), 0);
      return { product, order, shared };
    })
    .sort((a, b) => b.shared - a.shared || a.order - b.order)[0].product;
}
