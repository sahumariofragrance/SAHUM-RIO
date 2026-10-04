// Meta (Instagram / Facebook) Pixel. It tells Meta when an ad visitor views a
// perfume, adds one to the bag, starts checkout or pays, so ads can be shown
// again to people who visited and Meta can optimise ads for sales. Same rules
// as our own analytics: never on admin, account or password pages, nor on any
// device the owner has opened the admin dashboard on. No name, email, phone or
// address is ever sent. Nothing loads while META_PIXEL_ID is empty.
import { trackingAllowed } from "./analytics";

// From Meta Events Manager (the Pixel / dataset ID). It is public, not a secret.
export const META_PIXEL_ID = "";

const SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";
let started = false;

// Meta's standard loader, written as code because our Content-Security-Policy
// blocks inline <script> tags. Calls queue up until fbevents.js arrives.
function start() {
  if (started) return true;
  if (!META_PIXEL_ID) return false;
  if (!window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
  }
  // This is a single-page site: page views are sent below on every page
  // change, so Meta must not count history changes a second time.
  window.fbq.disablePushState = true;
  // No automatic button and page-content scraping; only the events below.
  window.fbq("set", "autoConfig", false, META_PIXEL_ID);
  window.fbq("init", META_PIXEL_ID);

  // Load Meta's script after the page itself, so it never slows the site down.
  const load = () => {
    const script = document.createElement("script");
    script.async = true;
    script.src = SCRIPT_SRC;
    document.head.appendChild(script);
  };
  if (document.readyState === "complete") load();
  else window.addEventListener("load", load, { once: true });
  started = true;
  return true;
}

function track(event, params, options) {
  try {
    if (!trackingAllowed() || !start()) return;
    window.fbq("track", event, params, options);
  } catch {
    // Never let advertising code affect the shop.
  }
}

function productParams(product) {
  return {
    content_ids: [product.slug],
    content_name: product.name,
    content_type: "product",
    value: Number(product.price) || 0,
    currency: "INR",
  };
}

export function pixelPageView() {
  track("PageView");
}

export function pixelViewContent(product) {
  if (product?.slug) track("ViewContent", productParams(product));
}

export function pixelAddToCart(product) {
  if (product?.slug) track("AddToCart", productParams(product));
}

function cartParams(items, value) {
  return {
    content_ids: items.map((item) => item.slug).filter(Boolean),
    content_type: "product",
    num_items: items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    value: Number(value) || 0,
    currency: "INR",
  };
}

export function pixelInitiateCheckout(items, value) {
  if (items?.length) track("InitiateCheckout", cartParams(items, value));
}

/** value: the amount actually paid in ₹. The order id stops double counting. */
export function pixelPurchase(items, value, orderId) {
  track("Purchase", cartParams(items || [], value), orderId ? { eventID: String(orderId) } : undefined);
}
