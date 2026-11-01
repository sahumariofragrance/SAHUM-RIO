// Selling 10 ml testers: which can be bought, the curated sets, and the set
// price (any TESTER.bundleSize testers for TESTER.bundlePrice). The server
// applies the same price (api/_lib/testers.js) and charges what it works out.
import { TESTER, forSale, isTester, testerOf } from "./catalogue";

/** A tester for every perfume on sale, in catalogue order. */
export function testersForSale(products) {
  return forSale(products).map(testerOf);
}

/** The curated sets whose perfumes are all on sale, each with its testers. */
export function testerSetsForSale(products) {
  const bySlug = new Map(testersForSale(products).map((tester) => [tester.parent.slug, tester]));
  return TESTER.sets
    .map((set) => ({
      ...set,
      testers: set.slugs.map((slug) => bySlug.get(slug)),
      // Its scene photo (public/products/tester-sets/, listed in testers.json "setPhotos"), if there is one.
      photo: (TESTER.setPhotos || []).includes(set.id) ? `/products/tester-sets/${set.id}.webp` : null,
    }))
    .filter((set) => set.testers.length === TESTER.bundleSize && set.testers.every(Boolean));
}

/** How many testers are in the bag. */
export function testerUnits(items) {
  return items.filter(isTester).reduce((sum, item) => sum + item.qty, 0);
}

/**
 * Rupees off for the set price: every TESTER.bundleSize testers in the bag
 * (dearest first) cost TESTER.bundlePrice together; the rest are full price.
 */
export function testerSetSaving(items) {
  const units = [];
  for (const item of items.filter(isTester)) for (let i = 0; i < item.qty; i += 1) units.push(Math.round(Number(item.price) * 100));
  units.sort((a, b) => b - a);
  let off = 0;
  for (let i = 0; i + TESTER.bundleSize <= units.length; i += TESTER.bundleSize) {
    const group = units.slice(i, i + TESTER.bundleSize).reduce((sum, paise) => sum + paise, 0);
    off += Math.max(0, group - TESTER.bundlePrice * 100);
  }
  return off / 100;
}

/** "Any 5 for ₹549" in words, and what a set saves against single testers. */
export const SET_SAVING = TESTER.price * TESTER.bundleSize - TESTER.bundlePrice;
