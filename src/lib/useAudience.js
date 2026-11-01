import { useCallback, useEffect, useState } from "react";
import { AUDIENCES } from "./catalogue";

// "For him / For her / Unisex" in the address: /perfumes?for=him. Also handy
// for ads that should open on one group.
const URL_NAMES = { Men: "him", Women: "her", Unisex: "unisex" };
const FROM_URL = Object.fromEntries(Object.entries(URL_NAMES).map(([id, name]) => [name, id]));
const VALID = new Set(AUDIENCES.map((audience) => audience.id));

function fromAddress() {
  try {
    const value = new URLSearchParams(window.location.search).get("for");
    return value == null ? null : FROM_URL[value.toLowerCase()] || "all";
  } catch {
    return null;
  }
}

function writeAddress(value) {
  try {
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("for");
    else url.searchParams.set("for", URL_NAMES[value]);
    const next = `${url.pathname}${url.search}${url.hash}`;
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, "", next);
  } catch {
    // The filter still works; only the address isn't updated.
  }
}

/**
 * The collection's "For" filter, remembered for the visit: in the address
 * (so the browser's back button returns to it) and in this tab's session
 * (so links back to the page, such as "← The Collection", keep it too).
 * `page` keeps the homepage, the collection and Jhalak apart. Once the
 * perfumes have loaded, a filter none of them matches falls back to "all".
 */
export function useRememberedAudience(page, products = []) {
  const key = `sahumario-for-${page}`;
  const [audience, setAudienceState] = useState(() => {
    const value = fromAddress();
    if (value) return value;
    try {
      const saved = sessionStorage.getItem(key);
      return VALID.has(saved) ? saved : "all";
    } catch {
      return "all";
    }
  });

  const setAudience = useCallback((value) => {
    const next = VALID.has(value) ? value : "all";
    setAudienceState(next);
    try {
      if (next === "all") sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, next);
    } catch {
      // Private mode: remembered in the address only.
    }
    writeAddress(next);
  }, [key]);

  const matches = audience === "all" || !products.length || products.some((product) => product.audience === audience);
  const active = matches ? audience : "all";

  // Keep the address in step (a filter restored from the session, or one that no longer applies).
  useEffect(() => {
    writeAddress(active);
  }, [active]);

  return [active, setAudience];
}
