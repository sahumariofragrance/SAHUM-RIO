"use strict";

const { createClient } = require("@supabase/supabase-js");

function getEnv() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are not configured");
  }
  return { url, anonKey, serviceRoleKey };
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

  const { url, anonKey, serviceRoleKey } = getEnv();
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) {
    const err = new Error("Invalid or expired session");
    err.statusCode = 401;
    throw err;
  }

  const user = userData.user;
  const { data: adminRow, error: adminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) throw adminError;
  if (!adminRow) {
    const err = new Error("Administrator access required");
    err.statusCode = 403;
    throw err;
  }

  return { user, adminClient };
}

function setApiHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

module.exports = { requireAdmin, setApiHeaders };
