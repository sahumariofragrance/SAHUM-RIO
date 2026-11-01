// The free 10 ml tester won on the spin wheel: which perfumes to suggest.
import { forSale, testerPhoto } from "./catalogue";

/** Photo of the Jhalak (10 ml tester) with this perfume's name: its scene when there is one. */
export function testerImage(product) {
  return testerPhoto(product.slug);
}

/** The words of a perfume's fragrance family, e.g. "Spicy woody" → spicy, woody. */
function familyWords(product) {
  return new Set(String(product?.fragrance_family || "").toLowerCase().match(/[a-z]+/g) || []);
}

function sharesWord(words, others) {
  return [...words].some((word) => others.has(word));
}

/**
 * Perfumes to offer as free testers with the bag `items`: on sale, not in the
 * bag, and from a different fragrance family to every perfume in it (no word
 * of the family in common, so "Woody spicy" counts as the same family as
 * "Spicy woody"). Each suggestion has a family of its own, so the choices
 * really differ from each other too. Perfumes for the same people as the bag
 * come first (him or her, and unisex), newest first so customers discover the
 * latest perfumes (a newer perfume has a higher id). If the bag
 * already covers almost every family, other perfumes fill the list up to two.
 */
export function suggestTesters(items, products, limit = 3) {
  const byId = new Map(products.map((product) => [Number(product.id), product]));
  const bag = items.map((item) => byId.get(Number(item.product_id))).filter(Boolean);
  const inBag = new Set(bag.map((product) => Number(product.id)));
  const forHim = bag.some((product) => product.audience === "Men");
  const forHer = bag.some((product) => product.audience === "Women");
  const fits = (product) => forHim === forHer || product.audience === "Unisex" || product.audience === (forHim ? "Men" : "Women");

  const candidates = forSale(products)
    .filter((product) => !inBag.has(Number(product.id)))
    .sort((a, b) => Number(b.id) - Number(a.id));
  const ordered = [...candidates.filter(fits), ...candidates.filter((product) => !fits(product))];

  const taken = new Set(bag.flatMap((product) => [...familyWords(product)]));
  const suggestions = [];
  for (const product of ordered) {
    const words = familyWords(product);
    if (!words.size || sharesWord(words, taken)) continue;
    suggestions.push(product);
    words.forEach((word) => taken.add(word));
    if (suggestions.length === limit) return suggestions;
  }
  for (const product of ordered) {
    if (suggestions.length >= 2) break;
    if (!suggestions.includes(product)) suggestions.push(product);
  }
  return suggestions;
}

/**
 * Every other perfume the customer may choose instead of our suggestions:
 * on sale, not in the bag and not already suggested, in catalogue order.
 */
export function otherTesters(items, products, suggested) {
  const skip = new Set([...items.map((item) => Number(item.product_id)), ...suggested.map((product) => Number(product.id))]);
  return forSale(products).filter((product) => !skip.has(Number(product.id)));
}
