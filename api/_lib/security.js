"use strict";

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function setJsonSecurityHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function enforceJsonRequest(req, res, { methods = ["POST"], maxBytes = 32 * 1024 } = {}) {
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    res.status(405).json({ message: "Method not allowed" });
    return false;
  }
  if (req.method !== "GET" && !String(req.headers["content-type"] || "").toLowerCase().includes("application/json")) {
    res.status(415).json({ message: "Content-Type must be application/json" });
    return false;
  }
  const contentLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    res.status(413).json({ message: "Request payload is too large" });
    return false;
  }
  return true;
}

function clientIp(req) {
  const raw = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "").trim();
  return raw.split(",")[0].trim().slice(0, 128) || "unknown";
}

function hashRateKey(value) {
  const pepper = process.env.RATE_LIMIT_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || "sahumario-rate-limit";
  return crypto.createHash("sha256").update(String(pepper)).update("|").update(String(value)).digest("hex");
}

async function enforceRateLimit(req, res, {
  scope,
  limit,
  windowSeconds,
  identifier = "",
} = {}) {
  const client = getServiceClient();
  if (!client) {
    // Fail open rather than blocking legitimate checkout if the rate-limit store
    // itself is unavailable. Endpoint auth/validation remains in force.
    return true;
  }

  const key = hashRateKey(`${clientIp(req)}|${identifier}`);
  const { data, error } = await client.rpc("consume_api_rate_limit", {
    p_scope: String(scope || "api"),
    p_key_hash: key,
    p_limit: Number(limit),
    p_window_seconds: Number(windowSeconds),
  });

  if (error) {
    console.error("[rate-limit]", error.message);
    return true;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (result?.reset_at) res.setHeader("X-RateLimit-Reset", String(result.reset_at));
  if (Number.isFinite(Number(result?.remaining))) res.setHeader("X-RateLimit-Remaining", String(result.remaining));

  if (result?.allowed === false) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil(windowSeconds / 4))));
    res.status(429).json({ message: "Too many requests. Please wait a moment and try again." });
    return false;
  }
  return true;
}

function safeString(value, max = 200) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

module.exports = {
  getServiceClient,
  setJsonSecurityHeaders,
  enforceJsonRequest,
  enforceRateLimit,
  isPlainObject,
  safeString,
  clientIp,
};
