// Vercel BotID: an invisible check (no puzzles for customers) on the requests
// bots abuse. The server side is api/_lib/botCheck.js.
import { initBotId } from "botid/client/core";

export const PROTECTED_ROUTES = [
  { path: "/api/payments/razorpay/order", method: "POST" },
  { path: "/api/bulk-orders/inquiry", method: "POST" },
  { path: "/api/reviews/upsert", method: "POST" },
];

// BotID holds a protected request until its challenge script answers. If that
// script is blocked (ad blockers) or slow, send the request without it rather
// than leave a customer stuck at checkout; the server lets those through.
const CHALLENGE_TIMEOUT_MS = 6000;

function isProtected(input, init) {
  try {
    const url = new URL(input instanceof Request ? input.url : input, window.location.href);
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
    return url.origin === window.location.origin
      && PROTECTED_ROUTES.some((route) => route.path === url.pathname && route.method === method);
  } catch {
    return false;
  }
}

export function startBotProtection() {
  // Only on deployed sites: the challenge is served by Vercel.
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production" || window.location.hostname === "localhost") return;

  const plainFetch = window.fetch.bind(window);
  // BotID calls this once its challenge is answered, just before sending.
  const onSend = new WeakMap();
  window.fetch = (input, init) => {
    const notify = init?.signal && onSend.get(init.signal);
    if (notify) notify();
    return plainFetch(input, init);
  };
  try {
    initBotId({ protect: PROTECTED_ROUTES });
  } catch (error) {
    console.error("Bot protection could not start", error);
    window.fetch = plainFetch;
    return;
  }
  const checkedFetch = window.fetch;

  window.fetch = (input, init) => {
    if (!isProtected(input, init) || init?.signal) return checkedFetch(input, init);

    const controller = new AbortController();
    let sent = false;
    let fellBack = false;
    return new Promise((resolve, reject) => {
      const fallback = () => {
        if (sent || fellBack) return;
        fellBack = true;
        controller.abort(); // the checked request can never be sent after this
        plainFetch(input, init).then(resolve, reject);
      };
      const timer = window.setTimeout(fallback, CHALLENGE_TIMEOUT_MS);
      onSend.set(controller.signal, () => {
        sent = true;
        window.clearTimeout(timer);
      });
      checkedFetch(input, { ...init, signal: controller.signal }).then(
        (response) => { if (!fellBack) resolve(response); },
        (error) => {
          window.clearTimeout(timer);
          if (fellBack) return;
          // The challenge failed before anything was sent: send it plainly.
          if (!sent) fallback();
          else reject(error);
        },
      );
    });
  };
}
