// Friendly names for shop paths in the admin's Live now and Analytics views.
const PAGE_NAMES = {
  "/": "Home",
  "/perfumes": "The Collection",
  "/about": "About",
  "/bulk-orders": "Bulk orders",
  "/cart": "Bag",
  "/checkout": "Checkout",
  "/login": "Log in",
  "/account": "Account",
  "/account/orders": "My orders",
  "/reset-password": "Reset password",
  "/privacy-policy": "Privacy policy",
  "/refund-return-policy": "Refund policy",
  "/shipping-policy": "Shipping policy",
  "/terms-conditions": "Terms",
};

export function pageName(path, bySlug) {
  const slug = path.match(/^\/product\/([a-z0-9-]+)$/i)?.[1];
  if (slug) return bySlug?.get(slug.toLowerCase())?.name || slug;
  return PAGE_NAMES[path.replace(/\/+$/, "") || "/"] || path;
}
