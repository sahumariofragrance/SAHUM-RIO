// The discount code promoted on the website (admin → Discounts → "Show on
// website"). Fetched once per visit; null when nothing is promoted, so every
// banner simply stays hidden. "Save code" remembers it for checkout.
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const SAVED_KEY = "sahumario_saved_code";
let request = null;

function loadPromo() {
  if (!request) {
    request = supabase.rpc("site_promo").then(
      ({ data, error }) => {
        const row = Array.isArray(data) ? data[0] : data;
        return !error && row?.code ? { code: String(row.code), percent: Number(row.percent) } : null;
      },
      () => null,
    );
  }
  return request;
}

export function usePromo() {
  const [promo, setPromo] = useState(null);
  useEffect(() => {
    let active = true;
    loadPromo().then((value) => { if (active) setPromo(value); });
    return () => { active = false; };
  }, []);
  return promo;
}

/** Copies the code (when allowed) and remembers it so checkout applies it. */
export async function saveCode(code) {
  try { window.localStorage.setItem(SAVED_KEY, code); } catch { /* private mode */ }
  try { await navigator.clipboard?.writeText(code); } catch { /* clipboard blocked */ }
}

export function savedCode() {
  try { return window.localStorage.getItem(SAVED_KEY) || ""; } catch { return ""; }
}

export function forgetSavedCode() {
  try { window.localStorage.removeItem(SAVED_KEY); } catch { /* private mode */ }
}
