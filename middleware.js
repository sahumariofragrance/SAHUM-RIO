/**
 * Vercel Routing Middleware — server-rendered SEO for the single-page app.
 *
 * Crawlers and link-preview bots (WhatsApp, Facebook, X, Slack…) often read
 * only the first HTML response. Without this, every URL returned the homepage
 * title, description and canonical. For public pages this middleware returns
 * index.html with the correct <title>, meta description, canonical URL,
 * Open Graph/Twitter tags, JSON-LD and a <noscript> summary, and it serves a
 * live /sitemap.xml that includes every active product.
 *
 * Fail-safe: on any error it returns nothing, so Vercel continues with the
 * normal static response (index.html rewrite or public/sitemap.xml).
 */
import { NOT_FOUND_META, PAGE_META, collectionJsonLd, productJsonLd, productMeta, productPath } from "./src/seo/site";
import { noscriptSummary, renderPage, renderSitemap } from "./src/seo/render";

export const config = {
  matcher: [
    "/",
    "/sitemap.xml",
    "/perfumes",
    "/about",
    "/bulk-orders",
    "/privacy-policy",
    "/refund-return-policy",
    "/shipping-policy",
    "/terms-conditions",
    "/product/:slug",
  ],
};

const SUPABASE_TIMEOUT_MS = 2500;
const PRODUCT_FIELDS = "id,slug,name,description,price,image_url,size_volume,updated_at";

// vercel.json headers are not guaranteed on middleware-generated responses.
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

const PATH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_META).filter(([, meta]) => !meta.noindex).map(([page, meta]) => [meta.path, page])
);

async function fetchProducts(query) {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/products?select=${PRODUCT_FIELDS}&active=eq.true&order=display_order.asc,id.asc${query}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: controller.signal }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function withHeaders(extra) {
  return { ...SECURITY_HEADERS, ...extra };
}

async function sitemapResponse() {
  const products = await fetchProducts("");
  if (!products) return undefined; // fall back to static public/sitemap.xml
  return new Response(renderSitemap(products), {
    headers: withHeaders({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    }),
  });
}

async function resolvePage(pathname) {
  const productMatch = pathname.match(/^\/product\/([a-z0-9-]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    const rows = await fetchProducts(`&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    if (!rows) return null; // catalogue unavailable: let the SPA handle it
    const product = rows[0];
    if (!product) {
      return {
        status: 404,
        meta: { ...NOT_FOUND_META, path: `/product/${slug}` },
        noscript: noscriptSummary({ heading: "Perfume not found", text: NOT_FOUND_META.description, links: [{ href: "/perfumes", label: "Shop all perfumes" }] }),
      };
    }
    const meta = productMeta(product);
    return {
      status: 200,
      meta,
      jsonLd: productJsonLd(product),
      noscript: noscriptSummary({
        heading: `${product.name} Eau de Parfum`,
        text: meta.description,
        links: [{ href: "/perfumes", label: "Shop all perfumes" }],
      }),
    };
  }

  const page = PATH_TO_PAGE[pathname];
  if (!page) return null;
  const meta = PAGE_META[page];
  let jsonLd = null;
  let links = [
    { href: "/perfumes", label: "Shop all perfumes" },
    { href: "/about", label: "About SAHUMäRIO" },
    { href: "/bulk-orders", label: "Bulk orders & corporate gifting" },
  ];
  if (page === "perfumes" || page === "home") {
    const products = await fetchProducts("");
    if (products?.length) {
      if (page === "perfumes") jsonLd = collectionJsonLd(products);
      links = [...products.map((product) => ({ href: productPath(product), label: `${product.name} Eau de Parfum` })), ...links];
    }
  }
  return {
    status: 200,
    meta,
    jsonLd,
    noscript: noscriptSummary({ heading: meta.title.split(/ [—|] /)[0], text: meta.description, links }),
  };
}

export default async function middleware(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");

    if (pathname === "/sitemap.xml") return await sitemapResponse();

    // Only rewrite HTML page loads, never prefetches of other asset types.
    if (request.method !== "GET" && request.method !== "HEAD") return undefined;

    const page = await resolvePage(pathname);
    if (!page) return undefined;

    const shell = await fetch(new URL("/index.html", url), { headers: { accept: "text/html" } });
    if (!shell.ok) return undefined;
    const html = renderPage(await shell.text(), page);

    return new Response(request.method === "HEAD" ? null : html, {
      status: page.status,
      headers: withHeaders({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
        ...(page.meta.noindex ? { "X-Robots-Tag": "noindex, follow" } : {}),
      }),
    });
  } catch (error) {
    console.error("[seo-middleware]", error?.message);
    return undefined;
  }
}
