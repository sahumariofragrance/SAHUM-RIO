"use client";

import { createClient } from "@supabase/supabase-js";

let browserClient;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase browser configuration is unavailable.");
  }

  browserClient = createClient(url, key);
  return browserClient;
}
