// Spin wheel before checkout: one spin per customer. The server picks the
// prize (api/discounts/[action].js); the prizes are in src/data/spin.json. The
// prize is remembered on this device until it is used or expires, and
// checkout checks it again with the customer's email and phone.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import wheel from "../data/spin.json";

export const WHEEL = wheel;

const SAVED_KEY = "sahumario_spin";
const LATER_KEY = "sahumario_spin_later";
let request = null;

// Vercel preview links (*.vercel.app; the live site's vercel.app addresses
// redirect to sahumario.com) show a demo wheel until the database update has
// run, so it can be tried before going live: the browser picks the prize and
// nothing is saved or applied.
const previewDemo = () => window.location.hostname.endsWith(".vercel.app");

/**
 * true when the wheel is switched on (Admin → Discounts), "demo" on a preview
 * link before the database update, otherwise false.
 */
function loadOpen() {
  if (!request) {
    request = supabase.rpc("spin_wheel_open").then(
      ({ data, error }) => (error ? (previewDemo() && /spin_wheel_open|PGRST202/.test(`${error.code} ${error.message}`) ? "demo" : false) : data === true),
      () => false,
    );
  }
  return request;
}

export function useSpinWheelOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    loadOpen().then((value) => { if (active) setOpen(value); });
    return () => { active = false; };
  }, []);
  return open;
}

/** What the wheel can give, e.g. "5% or 10% off, or a free 10 ml Jhalak". */
export function wheelPrizes() {
  const percents = [...new Set(wheel.segments.map((segment) => segment.percent).filter(Boolean))].sort((a, b) => a - b);
  const testers = wheel.segments.find((segment) => segment.testers)?.testers;
  const parts = [];
  if (percents.length) parts.push(`${percents.map((percent) => `${percent}%`).join(" or ")} off`);
  if (testers) parts.push(prizeLabel({ testers }));
  return parts.join(", or ");
}

/** "10% off", "a free 10 ml Jhalak" or "2 free 10 ml Jhalak" (a Jhalak is a 10 ml tester). */
export function prizeLabel(prize) {
  if (prize?.percent) return `${prize.percent}% off`;
  return prize?.testers === 1 ? `a free ${wheel.testerMl} ml Jhalak` : `${prize?.testers} free ${wheel.testerMl} ml Jhalak`;
}

/** The last day to use the prize, e.g. "6 Nov", in Indian time. */
export function prizeUseBy(prize) {
  return new Date(prize.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

/**
 * The prize won on this device: { code, percent, testers, segment, expiresAt,
 * chosen: [product ids], used }. An unused prize that has expired is
 * forgotten, so the customer can spin again.
 */
export function savedSpin() {
  try {
    const spin = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "null");
    if (!spin?.code) return null;
    if (!spin.used && !(Date.parse(spin.expiresAt) > Date.now())) {
      window.localStorage.removeItem(SAVED_KEY);
      return null;
    }
    return spin;
  } catch {
    return null;
  }
}

export function saveSpin(spin) {
  try { window.localStorage.setItem(SAVED_KEY, JSON.stringify(spin)); } catch { /* private mode */ }
}

/** After an order uses the prize: never offer the wheel on this device again. */
export function markSpinUsed() {
  const spin = savedSpin();
  if (spin) saveSpin({ ...spin, used: true });
}

/** "Maybe later": don't open the wheel by itself again during this visit. */
export function spinLater() {
  try { window.sessionStorage.setItem(LATER_KEY, "1"); } catch { /* private mode */ }
}

export function spinPutOff() {
  try { return window.sessionStorage.getItem(LATER_KEY) === "1"; } catch { return false; }
}

/** A preview link's demo spin: picked here, not saved, never applied to an order. */
function demoSpin() {
  const segment = Math.floor(Math.random() * wheel.segments.length);
  const { percent = null, testers = null } = wheel.segments[segment];
  const expiresAt = new Date(Date.now() + wheel.validDays * 24 * 60 * 60 * 1000).toISOString();
  return { code: "SPINDEMO00", percent, testers, segment, expiresAt, chosen: [], used: false, demo: true };
}

/**
 * Spins on the server and remembers the prize (`demo`: a preview link's demo
 * spin instead). Throws with a message to show; `closed` when the wheel is off.
 */
export async function spinOnServer(demo = false) {
  if (demo) return demoSpin();
  const response = await fetch("/api/discounts/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || "The wheel couldn't spin just now. Please try again.");
    error.closed = Boolean(payload.closed);
    throw error;
  }
  const spin = {
    code: String(payload.code),
    percent: payload.percent == null ? null : Number(payload.percent),
    testers: payload.testers == null ? null : Number(payload.testers),
    segment: Number(payload.segment),
    expiresAt: String(payload.expiresAt),
    chosen: [],
    used: false,
  };
  saveSpin(spin);
  return spin;
}
