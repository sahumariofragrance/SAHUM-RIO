"use strict";

const { createClient } = require("@supabase/supabase-js");

function getEnv() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase server environment variables are not configured");
  return { url, anonKey };
}

function readBearer(req) {
  const value = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1] : null;
}

async function requireCustomer(req) {
  const token = readBearer(req);
  if (!token) {
    const err = new Error("Authentication required");
    err.statusCode = 401;
    throw err;
  }

  const { url, anonKey } = getEnv();
  const serverClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data, error } = await serverClient.auth.getUser(token);
  if (error || !data?.user) {
    const err = new Error("Invalid or expired session");
    err.statusCode = 401;
    throw err;
  }

  return { user: data.user, serverClient };
}

module.exports = { requireCustomer };
