// Tracks the customer's last activity for the inactivity sign-out in AuthContext.
// The timestamp lives in localStorage so every open tab shares it: activity in
// one tab keeps the others signed in, and a customer returning after closing
// the site is signed out if the gap was longer than the limit.

export const IDLE_LIMIT_MS = 20 * 60 * 1000;
const STORAGE_KEY = "sahumario:last-activity";
const WRITE_THROTTLE_MS = 15 * 1000;

let lastWrite = 0;
let memoryActivity = Date.now();
let holds = 0;

function readStored() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function markActivity({ force = false } = {}) {
  const now = Date.now();
  memoryActivity = now;
  if (!force && now - lastWrite < WRITE_THROTTLE_MS) return;
  lastWrite = now;
  try {
    localStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    /* storage unavailable: this tab still tracks activity in memory */
  }
}

/** Latest activity across all tabs, or 0 when nothing has been recorded yet. */
export function lastActivity() {
  return Math.max(readStored(), memoryActivity);
}

export function storedActivity() {
  return readStored();
}

/**
 * Pauses the timer while activity cannot be observed, e.g. inside the
 * Razorpay payment window (a separate frame). Returns a release function.
 */
export function holdIdleTimer() {
  holds += 1;
  markActivity({ force: true });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds = Math.max(0, holds - 1);
    markActivity({ force: true });
  };
}

export function isIdleTimerHeld() {
  return holds > 0;
}
