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
import { NOT_FOUND_META, PAGE_META, PAGE_NOT_FOUND_META, collectionJsonLd, productJsonLd, productMeta, productPath } from "./src/seo/site";
import { noscriptSummary, renderPage, renderSitemap } from "./src/seo/render";

export const config = {
  // Everything except /api, build assets and Vercel's image optimizer
  // (/_vercel/image). Real files are passed straight
  // through in the handler.
  matcher: ["/((?!api/|static/|_vercel/).*)"],
};

// The page shell is read from a build-time copy (scripts/postbuild.js) under
// /static/, which this middleware never touches, so /index.html can redirect.
const SHELL_PATH = "/static/shell.html";
// Fallback only: marks the middleware's own /index.html request so it is
// served as-is instead of being redirected.
const SHELL_HEADER = "x-sahumario-shell";

const CANONICAL_ORIGIN = "https://sahumario.com";
// The project's production *.vercel.app aliases; preview deployments keep their own URLs.
const PRODUCTION_ALIASES = new Set([
  "sahum-rio.vercel.app",
  "sahum-rio-sahumarios-projects.vercel.app",
  "sahum-rio-git-main-sahumarios-projects.vercel.app",
]);

// File types served from /public. Other dotted paths (old .html/.php URLs,
// scanner probes) get the 404 page instead of a 200 copy of the homepage.
const ASSET_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico", "js", "mjs", "css", "map",
  "json", "txt", "xml", "webmanifest", "woff", "woff2", "ttf", "otf", "pdf", "mp4", "webm",
]);

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
  // Keep in sync with vercel.json.
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com; frame-src https://*.razorpay.com; form-action 'self' https://*.razorpay.com; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
};

const PATH_TO_PAGE = Object.fromEntries(Object.entries(PAGE_META).map(([page, meta]) => [meta.path, page]));

// Short paths the app also accepts; send them to the canonical URL.
const PATH_ALIASES = {
  "/orders": "/account/orders",
  "/refund-policy": "/refund-return-policy",
  "/terms": "/terms-conditions",
};

async function fetchProducts(query) {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    const request = (fields) => fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/products?select=${fields}&active=eq.true&order=display_order.asc,id.asc${query}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: controller.signal }
    );
    let res = await request(`${PRODUCT_FIELDS},gallery_urls`);
    // Before the gallery_urls migration runs, fetch without it.
    if (res.status === 400) res = await request(PRODUCT_FIELDS);
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
        meta: { ...NOT_FOUND_META, path: null },
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
  if (!page) {
    return {
      status: 404,
      meta: { ...PAGE_NOT_FOUND_META, path: null },
      noscript: noscriptSummary({ heading: "Page not found", text: PAGE_NOT_FOUND_META.description, links: [{ href: "/perfumes", label: "Shop all perfumes" }] }),
    };
  }
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

// redirect: "manual" so a redirected shell request can never loop back
// through this middleware.
async function fetchShell(url, path, headers = {}) {
  const res = await fetch(new URL(path, url), { headers: { accept: "text/html", ...headers }, redirect: "manual" });
  if (!res.ok) return null;
  const html = await res.text();
  return /<\/head>/i.test(html) ? html : null;
}

async function loadShell(url) {
  const shell = await fetchShell(url, SHELL_PATH);
  if (shell) return shell;
  console.error(`[seo-middleware] ${SHELL_PATH} unavailable; falling back to /index.html`);
  const fallback = await fetchShell(url, "/index.html", { [SHELL_HEADER]: "1" });
  if (!fallback) console.error("[seo-middleware] page shell unavailable; serving pages without SEO tags");
  return fallback;
}

export default async function middleware(request) {
  try {
    const url = new URL(request.url);
    if (PRODUCTION_ALIASES.has(url.hostname)) {
      return Response.redirect(`${CANONICAL_ORIGIN}${url.pathname}${url.search}`, 308);
    }

    const pathname = url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");

    if (pathname === "/sitemap.xml") return await sitemapResponse();

    if (pathname === "/index.html") {
      if (request.headers.get(SHELL_HEADER)) return undefined;
      const home = new URL(url);
      home.pathname = "/";
      return Response.redirect(home, 308);
    }

    const extension = pathname.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
    if (extension && ASSET_EXTENSIONS.has(extension)) return undefined;

    // Only rewrite HTML page loads, never prefetches of other asset types.
    if (request.method !== "GET" && request.method !== "HEAD") return undefined;

    // One URL per page: no trailing slash, lowercase product slugs, and
    // canonical paths for aliases.
    const productCase = pathname.match(/^\/product\/([A-Za-z0-9-]+)$/);
    const target =
      PATH_ALIASES[pathname] ||
      (productCase && productCase[1] !== productCase[1].toLowerCase() ? pathname.toLowerCase() : null) ||
      (pathname !== url.pathname ? pathname : null);
    if (target) {
      // Set only the path so the redirect can never leave this host (e.g. "//evil.com/").
      const next = new URL(url);
      next.pathname = target;
      return Response.redirect(next, 308);
    }

    const page = await resolvePage(pathname);
    if (!page) return undefined;

    const shell = await loadShell(url);
    if (!shell) return undefined;
    const html = renderPage(shell, page);

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
