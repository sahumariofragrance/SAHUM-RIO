// A random id for this browser tab, kept in sessionStorage (not a cookie):
// it ends when the tab closes. Shared by "Live now" and site analytics.
const STORAGE_KEY = "sahumario-live-id";

let memoryId = null;

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function tabId() {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const id = newId();
    window.sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    memoryId = memoryId || newId();
    return memoryId;
  }
}
