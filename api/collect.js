"use strict";

// Receives page views and shop events from src/lib/analytics.js and stores
// them for the admin Analytics tab (supabase/migrations/*_site_analytics.sql).
//
// Stored per event: a daily-changing one-way hash of IP + browser (never the
// IP itself), the tab's random session id, the page, the traffic source,
// phone/computer and the approximate location Vercel attaches to the request.
// Always answers 204 so tracking can never break or slow a page.

const crypto = require("crypto");
const { getServiceClient, clientIp, enforceRateLimit } = require("./_lib/security");

const KINDS = new Set(["pageview", "add_to_cart", "purchase"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,80}$/;
const UNTRACKED = /^\/(admin|account|reset-password)(\/|$)/;
const OWN_HOST = /(^|\.)sahumario\.com$|\.vercel\.app$/i;
// Automated clients that run JavaScript (headless browsers, audit tools).
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|phantom|selenium|puppeteer|playwright|python|curl|wget|httpclient/i;

// Referrer hosts and utm_source values → one source key each.
const SOURCES = [
  ["instagram", /(^|\.)instagram\.com$|^ig$|^insta(gram)?$/i],
  ["facebook", /(^|\.)facebook\.com$|(^|\.)fb\.(com|me)$|^fb$|^facebook$/i],
  ["whatsapp", /(^|\.)whatsapp\.(com|net)$|(^|\.)wa\.me$|^wa$|^whatsapp$/i],
  ["google", /(^|\.)google\.[a-z.]+$|^google$/i],
  ["bing", /(^|\.)bing\.com$|^bing$/i],
  ["youtube", /(^|\.)youtube\.com$|(^|\.)youtu\.be$|^youtube$|^yt$/i],
  ["x", /(^|\.)t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$|^twitter$|^x$/i],
  ["linkedin", /(^|\.)linkedin\.com$|(^|\.)lnkd\.in$|^linkedin$/i],
  ["pinterest", /(^|\.)pinterest\.[a-z.]+$|^pinterest$/i],
  ["email", /^e-?mail$|^newsletter$|^gmail$|mail\.google\.com$/i],
];

function clean(value, max) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max) : "";
}

function istDay() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

// Same visitor + browser → same id for one IST day only; the IP is not kept.
function visitorId(req, day) {
  const secret = process.env.ANALYTICS_SALT || process.env.RATE_LIMIT_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return crypto
    .createHmac("sha256", `${secret}|analytics|${day}`)
    .update(`${clientIp(req)}|${req.headers["user-agent"] || ""}`)
    .digest("hex")
    .slice(0, 32);
}

function device(ua) {
  if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function sourceOf({ referrer, utmSource, ua }) {
  const fromKey = (key) => SOURCES.find(([, pattern]) => pattern.test(key))?.[0];
  if (utmSource) return fromKey(utmSource) || utmSource.toLowerCase().slice(0, 40);
  // In-app browsers often send no referrer.
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  if (!referrer) return "direct";
  let host;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (OWN_HOST.test(host)) return "internal";
  return fromKey(host) || host.slice(0, 60);
}

function header(req, name) {
  const value = clean(String(req.headers[name] || ""), 80);
  try {
    return decodeURIComponent(value) || null;
  } catch {
    return value || null;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const done = () => res.status(204).end();

  try {
    const ua = String(req.headers["user-agent"] || "");
    if (!ua || BOT_UA.test(ua)) return done();

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const kind = clean(body.kind, 20);
    const path = clean(body.path, 200);
    if (!KINDS.has(kind) || !path.startsWith("/") || UNTRACKED.test(path)) return done();

    const client = getServiceClient();
    if (!client) return done(); // preview deployments have no service key
    // At most 300 events per 10 minutes from one address (answers 429 beyond).
    if (!(await enforceRateLimit(req, res, { scope: "analytics", limit: 300, windowSeconds: 600 }))) return undefined;

    const session = UUID.test(clean(body.session, 40)) ? clean(body.session, 40) : null;
    const productFromPath = path.match(/^\/product\/([a-z0-9-]+)$/)?.[1] || null;
    const productGiven = clean(body.product, 80).toLowerCase();
    const value = Number(body.value);
    const entry = kind === "pageview" && body.entry === true;
    const day = istDay();

    const row = {
      day,
      kind,
      visitor: visitorId(req, day),
      session,
      path,
      product: productFromPath || (SLUG.test(productGiven) ? productGiven : null),
      entry,
      device: device(ua),
      country: header(req, "x-vercel-ip-country"),
      region: header(req, "x-vercel-ip-country-region"),
      city: header(req, "x-vercel-ip-city"),
      value: kind === "purchase" && Number.isFinite(value) && value >= 0 && value <= 10000000 ? value : null,
    };
    if (entry) {
      row.source = sourceOf({ referrer: clean(body.referrer, 500), utmSource: clean(body.utm_source, 60), ua });
      row.campaign = clean(body.utm_campaign, 80) || null;
    }

    const { error } = await client.from("analytics_events").insert(row);
    if (error) console.error("[collect] insert failed:", error.message);

    // Now and then, drop data older than 13 months.
    if (Math.random() < 0.002) {
      const { error: pruneError } = await client.rpc("analytics_prune");
      if (pruneError) console.error("[collect] prune failed:", pruneError.message);
    }
  } catch (error) {
    console.error("[collect]", error?.message);
  }
  return done();
};

module.exports.sourceOf = sourceOf;
module.exports.device = device;
