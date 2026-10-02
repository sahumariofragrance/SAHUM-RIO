// "Live now" in the admin dashboard: while a shop page is open and visible,
// report it every 30 seconds with a random per-tab id and the page path, and
// say goodbye when the tab is hidden or closed. Nothing else is sent: no
// account, location or device. See supabase/migrations/*_live_visitors.sql.
import { supabase } from "./supabase";

const PING_MS = 30 * 1000;
const FIRST_PING_MS = 2500; // after the page has painted
const STORAGE_KEY = "sahumario-live-id";

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let sessionId = null;
let timer = null;
let present = false;
let started = false;

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function tabId() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = newId();
    window.sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

// The owner's own dashboard visits are not counted.
function counted() {
  return !window.location.pathname.startsWith("/admin");
}

function ping() {
  if (document.visibilityState !== "visible") return;
  started = true;
  if (!counted()) {
    leave();
    return;
  }
  present = true;
  supabase.rpc("visitor_ping", { p_session: sessionId, p_path: window.location.pathname }).then(() => {}, () => {});
}

// keepalive lets this finish even while the tab is closing.
function leave() {
  if (!present) return;
  present = false;
  fetch(`${url.replace(/\/+$/, "")}/rest/v1/rpc/visitor_leave`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_session: sessionId }),
  }).catch(() => {});
}

function schedule(delay = PING_MS) {
  window.clearInterval(timer);
  timer = window.setInterval(ping, PING_MS);
  if (delay < PING_MS) window.setTimeout(ping, delay);
}

export function startLiveVisitors() {
  if (sessionId || !url || !anonKey) return;
  if (process.env.NODE_ENV !== "production" || window.location.hostname === "localhost") return;
  sessionId = tabId();

  schedule(FIRST_PING_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") schedule(0);
    else {
      window.clearInterval(timer);
      leave();
    }
  });
  window.addEventListener("pagehide", leave);
}

/** Call after an in-app navigation so the dashboard shows the new page at once. */
export function reportPageChange() {
  if (started) ping();
}
