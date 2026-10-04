// SAHUMäRIO's own website analytics: page views and two shop events
// (added to bag, paid), sent to /api/collect. No cookies; the tab's random id
// links one visit's steps together. Admin, account and password pages are
// never tracked, nor any device the owner has opened the admin dashboard on.
import { tabId } from "./tabId";

const UNTRACKED = /^\/(admin|account|reset-password)(\/|$)/;
const IGNORE_KEY = "sahumario-analytics-ignore";
const ENTRY_KEY = "sahumario-visit-started";

function enabled() {
  if (process.env.NODE_ENV !== "production" || window.location.hostname === "localhost") return false;
  try {
    return window.localStorage.getItem(IGNORE_KEY) !== "1";
  } catch {
    return true;
  }
}

/** Shared with the Meta Pixel: same pages and devices are left out. */
export function trackingAllowed(path = window.location.pathname) {
  return enabled() && !UNTRACKED.test(path);
}

function send(payload) {
  try {
    fetch("/api/collect", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, session: tabId() }),
    }).catch(() => {});
  } catch {
    // Never let tracking affect the page.
  }
}

// The first page of a visit carries where the visitor came from.
function takeEntry() {
  try {
    if (window.sessionStorage.getItem(ENTRY_KEY)) return false;
    window.sessionStorage.setItem(ENTRY_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function trackPageview() {
  const path = window.location.pathname;
  if (!trackingAllowed(path)) return;
  const payload = { kind: "pageview", path };
  if (takeEntry()) {
    const params = new URLSearchParams(window.location.search);
    Object.assign(payload, {
      entry: true,
      referrer: document.referrer || "",
      utm_source: params.get("utm_source") || "",
      utm_campaign: params.get("utm_campaign") || "",
    });
  }
  send(payload);
}

/** kind: "add_to_cart" (with product slug) or "purchase" (with value in ₹). */
export function trackEvent(kind, { product, value } = {}) {
  if (!enabled()) return;
  send({ kind, path: window.location.pathname, product, value });
}

/** Called by the admin dashboard: stop counting this device's visits. */
export function ignoreThisDevice() {
  try {
    window.localStorage.setItem(IGNORE_KEY, "1");
  } catch {
    // Private mode: nothing to remember.
  }
}
