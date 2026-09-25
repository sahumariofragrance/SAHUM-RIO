/**
 * Server-side rendering helpers used by /middleware.js.
 * Pure string functions (no DOM, no Node APIs) so they run on the edge.
 */
import {
  DEFAULT_IMAGE,
  INDEXABLE_ROBOTS,
  PRIVATE_ROBOTS,
  SITE_NAME,
  SITEMAP_PAGES,
  absoluteUrl,
  productPath,
} from "./site";

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** JSON for inline <script>: prevent "</script>" and HTML comment breakouts. */
function safeJson(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

// Tags managed per page. Everything else in index.html is left untouched.
const MANAGED_TAGS = [
  /<title>[\s\S]*?<\/title>/gi,
  /<meta\s+name="(?:description|robots|googlebot|twitter:title|twitter:description|twitter:image)"[^>]*>/gi,
  /<meta\s+property="og:(?:type|url|title|description|image|image:width|image:height)"[^>]*>/gi,
  /<link\s+rel="canonical"[^>]*>/gi,
  /<script\s+type="application\/ld\+json"\s+id="ld-page"[^>]*>[\s\S]*?<\/script>/gi,
];

/**
 * Returns index.html with page-specific head tags and a <noscript> body
 * summary. `meta`: { title, description, path, image?, type?, noindex? }.
 */
export function renderPage(html, { meta, jsonLd, noscript }) {
  const url = absoluteUrl(meta.path || "/");
  const image = absoluteUrl(meta.image || DEFAULT_IMAGE);
  const robots = meta.noindex ? PRIVATE_ROBOTS : INDEXABLE_ROBOTS;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="googlebot" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type || "website")}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    ...(image === DEFAULT_IMAGE
      ? ['<meta property="og:image:width" content="512" />', '<meta property="og:image:height" content="512" />']
      : []),
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ];
  if (jsonLd) tags.push(`<script type="application/ld+json" id="ld-page">${safeJson(jsonLd)}</script>`);

  let out = html;
  for (const pattern of MANAGED_TAGS) out = out.replace(pattern, "");
  out = out.replace(/<\/head>/i, `${tags.join("")}</head>`);
  if (noscript) out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${noscript}</noscript>`);
  return out;
}

/** Plain HTML summary shown to crawlers/users without JavaScript. */
export function noscriptSummary({ heading, text, links = [] }) {
  const list = links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join("");
  return `<main><h1>${escapeHtml(heading)}</h1>${text ? `<p>${escapeHtml(text)}</p>` : ""}${list ? `<ul>${list}</ul>` : ""}<p>Please enable JavaScript to shop at ${escapeHtml(SITE_NAME)}.</p></main>`;
}

function isoDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}

/** sitemap.xml covering public pages and every active product (with images). */
export function renderSitemap(products = []) {
  const entries = SITEMAP_PAGES.map((page) =>
    `<url><loc>${escapeHtml(absoluteUrl(page.path))}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`
  );
  for (const product of products) {
    if (!product?.slug) continue;
    const lastmod = isoDate(product.updated_at);
    const image = product.image_url || product.image;
    entries.push(
      `<url><loc>${escapeHtml(absoluteUrl(productPath(product)))}</loc>` +
        (lastmod ? `<lastmod>${lastmod}</lastmod>` : "") +
        "<changefreq>weekly</changefreq><priority>0.8</priority>" +
        (image
          ? `<image:image><image:loc>${escapeHtml(absoluteUrl(image))}</image:loc></image:image>`
          : "") +
        "</url>"
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join("\n")}\n</urlset>\n`;
}
