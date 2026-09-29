// Bottles cut out of their product photos (public/banner/<slug>.webp,
// transparent WebP, all scaled to the same bottle width), used for the
// homepage line-up and the product tiles. A perfume without a cut-out falls
// back to its normal photo. Add the slug here when a new cut-out is added.
const SLUGS = new Set(["bloom", "dew-drop", "lemon-breeze", "morning-dew", "night-queen", "blix"]);

export function bottleCutout(slug) {
  return SLUGS.has(slug) ? `/banner/${slug}.webp` : null;
}
