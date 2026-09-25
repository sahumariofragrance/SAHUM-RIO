/**
 * Shared SEO metadata.
 *
 * Imported by the React app (client-side head updates) and by /middleware.js
 * (server-side head injection for crawlers and link previews), so both always
 * agree on titles, descriptions, canonical URLs and structured data.
 * Keep this file free of React/browser APIs.
 */

export const SITE_URL = "https://www.sahumario.com";
export const SITE_NAME = "SAHUMäRIO®";
export const DEFAULT_IMAGE = `${SITE_URL}/logo512.png`;
export const DEFAULT_DESCRIPTION =
  "Shop SAHUMäRIO® Eau de Parfum online in India. A focused collection of long-lasting fragrances from ₹749, with free shipping across India.";

export const INDEXABLE_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1";
export const PRIVATE_ROBOTS = "noindex, follow";

/** Metadata per app page. `path` is the canonical URL path. */
export const PAGE_META = {
  home: {
    path: "/",
    title: "SAHUMäRIO® — Eau de Parfum | Buy Perfume Online in India",
    description: DEFAULT_DESCRIPTION,
    priority: "1.0",
    changefreq: "weekly",
  },
  perfumes: {
    path: "/perfumes",
    title: "Shop All Perfumes — Eau de Parfum Collection | SAHUMäRIO®",
    description: "Browse every SAHUMäRIO® Eau de Parfum. Compare scent profiles and notes, and order online with free shipping across India.",
    priority: "0.9",
    changefreq: "weekly",
  },
  about: {
    path: "/about",
    title: "About Us — SAHUMäRIO® Fragrance",
    description: "SAHUMäRIO® is an independent Indian fragrance house from Rajkot, Gujarat, creating a focused collection of Eau de Parfum.",
    priority: "0.6",
    changefreq: "monthly",
  },
  "bulk-orders": {
    path: "/bulk-orders",
    title: "Bulk Perfume Orders & Corporate Gifting — SAHUMäRIO®",
    description: "Order SAHUMäRIO® Eau de Parfum in bulk for corporate gifting, weddings and events. Enquiries for orders from ₹10,000.",
    priority: "0.7",
    changefreq: "monthly",
  },
  "privacy-policy": {
    path: "/privacy-policy",
    title: "Privacy Policy — SAHUMäRIO®",
    description: "How SAHUMäRIO® collects, uses and protects your personal information.",
    priority: "0.2",
    changefreq: "yearly",
  },
  "refund-policy": {
    path: "/refund-return-policy",
    title: "Refund & Return Policy — SAHUMäRIO®",
    description: "SAHUMäRIO® refund, return and replacement policy for perfume orders.",
    priority: "0.3",
    changefreq: "yearly",
  },
  "shipping-policy": {
    path: "/shipping-policy",
    title: "Shipping Policy — Free Delivery Across India | SAHUMäRIO®",
    description: "SAHUMäRIO® ships free across India. Read about delivery timelines, dispatch and order tracking.",
    priority: "0.3",
    changefreq: "yearly",
  },
  terms: {
    path: "/terms-conditions",
    title: "Terms & Conditions — SAHUMäRIO®",
    description: "Terms and conditions for shopping at SAHUMäRIO®.",
    priority: "0.2",
    changefreq: "yearly",
  },
  // Private / transactional pages: kept out of search results.
  cart: { path: "/cart", title: "Your Cart — SAHUMäRIO®", description: "Review your SAHUMäRIO® shopping cart.", noindex: true },
  checkout: { path: "/checkout", title: "Checkout — SAHUMäRIO®", description: "Complete your SAHUMäRIO® order securely.", noindex: true },
  account: { path: "/account", title: "My Account — SAHUMäRIO®", description: "Your SAHUMäRIO® account details.", noindex: true },
  orders: { path: "/account/orders", title: "My Orders — SAHUMäRIO®", description: "Your SAHUMäRIO® orders and shipment tracking.", noindex: true },
  admin: { path: "/admin", title: "Admin — SAHUMäRIO®", description: "SAHUMäRIO® administration.", noindex: true },
  login: { path: "/login", title: "Log In or Sign Up — SAHUMäRIO®", description: "Log in or create your SAHUMäRIO® account.", noindex: true },
  "reset-password": { path: "/reset-password", title: "Reset Password — SAHUMäRIO®", description: "Choose a new password for your SAHUMäRIO® account.", noindex: true },
};

export const NOT_FOUND_META = {
  title: "Perfume Not Found — SAHUMäRIO®",
  description: "This fragrance is no longer available. Explore the current SAHUMäRIO® Eau de Parfum collection.",
  noindex: true,
};

/** Pages that belong in the sitemap. */
export const SITEMAP_PAGES = Object.values(PAGE_META).filter((page) => !page.noindex);

export function absoluteUrl(pathOrUrl) {
  const value = String(pathOrUrl || "");
  if (/^https?:\/\//i.test(value)) return value;
  return SITE_URL + (value.startsWith("/") ? value : `/${value}`);
}

export function productPath(product) {
  return `/product/${product.slug}`;
}

function truncate(text, max) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return value.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) ? `₹${value.toLocaleString("en-IN")}` : "";
}

export function productMeta(product) {
  const price = formatPrice(product.price);
  const lead = String(product.description || "").trim().replace(/\.?$/, ".");
  const description = truncate(
    `${product.name} Eau de Parfum by SAHUMäRIO®. ${lead === "." ? "" : lead} ${price ? `${price}, ` : ""}free shipping across India.`,
    160
  );
  return {
    path: productPath(product),
    title: `${product.name} Eau de Parfum${price ? ` — ${price}` : ""} | SAHUMäRIO®`,
    description,
    image: product.image_url || product.image || DEFAULT_IMAGE,
    type: "product",
  };
}

/**
 * schema.org Product + BreadcrumbList for a product page.
 * `rating` ({ average, count }) is added only when there are visible reviews.
 */
export function productJsonLd(product, rating) {
  const url = absoluteUrl(productPath(product));
  const image = product.image_url || product.image;
  const productNode = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: String(product.description || "").trim() || `${product.name} Eau de Parfum by SAHUMäRIO®.`,
    sku: String(product.id),
    url,
    category: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: String(Number(product.price)),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "INR" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
      },
    },
  };
  if (image) productNode.image = [absoluteUrl(image)];
  if (product.size_volume) productNode.size = String(product.size_volume);
  if (rating && rating.count > 0) {
    productNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.average).toFixed(1),
      reviewCount: rating.count,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      productNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Perfumes", item: absoluteUrl("/perfumes") },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };
}

/** schema.org ItemList for the collection page. */
export function collectionJsonLd(products) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SAHUMäRIO® Eau de Parfum collection",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(productPath(product)),
      name: product.name,
    })),
  };
}
