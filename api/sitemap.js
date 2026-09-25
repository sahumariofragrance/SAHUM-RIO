"use strict";

const { createClient } = require("@supabase/supabase-js");

const SITE_URL = "https://sahumario.com";

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry({ path, lastmod, changefreq, priority }) {
  const parts = [
    "  <url>",
    `    <loc>${escapeXml(SITE_URL + path)}</loc>`,
  ];
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push("  </url>");
  return parts.join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const staticUrls = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/perfumes", changefreq: "weekly", priority: "0.9" },
    { path: "/about", changefreq: "monthly", priority: "0.7" },
    { path: "/bulk-orders", changefreq: "monthly", priority: "0.6" },
    { path: "/shipping-policy", changefreq: "yearly", priority: "0.3" },
    { path: "/refund-return-policy", changefreq: "yearly", priority: "0.3" },
    { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
    { path: "/terms-conditions", changefreq: "yearly", priority: "0.2" },
  ];

  let products = [];

  try {
    const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      const supabase = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase
        .from("products")
        .select("slug,updated_at")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      if (error) throw error;
      products = Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("[sitemap]", error?.message || error);
  }

  const productUrls = products
    .filter((product) => /^[a-z0-9-]+$/.test(String(product.slug || "")))
    .map((product) => ({
      path: `/product/${product.slug}`,
      lastmod: product.updated_at ? new Date(product.updated_at).toISOString() : undefined,
      changefreq: "monthly",
      priority: "0.8",
    }));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticUrls, ...productUrls].map(urlEntry),
    "</urlset>",
  ].join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
};
