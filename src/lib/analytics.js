// SAHUMäRIO's own website analytics: page views, engaged visits and two shop
// events (added to bag, paid), sent to /api/collect. No cookies; the tab's random id
// links one visit's steps together. Admin, account and password pages are
// never tracked, nor any device the owner has opened the admin dashboard on.
import { tabId } from "./tabId";

const UNTRACKED = /^\/(admin|account|reset-password)(\/|$)/;
const IGNORE_KEY = "sahumario-analytics-ignore";
const ENTRY_KEY = "sahumario-visit-started";
const ENGAGED_KEY = "sahumario-visit-engaged";
const ENGAGED_SECONDS = 10;

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

/**
 * Engaged visits: once per visit (browser tab), when the visitor has had the
 * page open for ENGAGED_SECONDS or scrolled past the first screen, send an
 * "engaged" event. Tells real visitors from accidental ad taps. Call once.
 */
export function watchEngagement() {
  const already = () => { try { return window.sessionStorage.getItem(ENGAGED_KEY) === "1"; } catch { return false; } };
  if (already()) return () => {};
  let seconds = 0;
  let timer = null;
  const stop = () => {
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
  };
  const engage = () => {
    if (already()) { stop(); return; }
    const path = window.location.pathname;
    // Not on untracked pages: count it when the visitor reaches a tracked one.
    if (!trackingAllowed(path)) return;
    try { window.sessionStorage.setItem(ENGAGED_KEY, "1"); } catch { /* still send once in this tab */ }
    stop();
    send({ kind: "engaged", path });
  };
  function onScroll() {
    if (window.scrollY > window.innerHeight * 0.6) engage();
  }
  timer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    seconds += 1;
    if (seconds >= ENGAGED_SECONDS) engage();
  }, 1000);
  window.addEventListener("scroll", onScroll, { passive: true });
  return stop;
}

/** Called by the admin dashboard: stop counting this device's visits. */
export function ignoreThisDevice() {
  try {
    window.localStorage.setItem(IGNORE_KEY, "1");
  } catch {
    // Private mode: nothing to remember.
  }
}
