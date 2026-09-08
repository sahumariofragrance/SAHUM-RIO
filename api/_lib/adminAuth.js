"use strict";

const { createClient } = require("@supabase/supabase-js");

function getEnv() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase server environment variables are not configured");
  }
  return { url, anonKey };
}

function readBearer(req) {
  const value = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1] : null;
}

async function requireAdmin(req) {
  const token = readBearer(req);
  if (!token) {
    const err = new Error("Authentication required");
    err.statusCode = 401;
    throw err;
  }

  const { url, anonKey } = getEnv();
  const adminClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData?.user) {
    const err = new Error("Invalid or expired session");
    err.statusCode = 401;
    throw err;
  }

  const { data: isAdmin, error: adminError } = await adminClient.rpc("is_admin");
  if (adminError) throw adminError;
  if (!isAdmin) {
    const err = new Error("Administrator access required");
    err.statusCode = 403;
    throw err;
  }

  return { user: userData.user, adminClient };
}

function setApiHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

module.exports = { requireAdmin, setApiHeaders };
