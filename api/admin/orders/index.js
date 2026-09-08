"use strict";

const { requireAdmin, setApiHeaders } = require("../../_lib/adminAuth");

function safeDiagnostic(err) {
  const message = String(err?.message || "");

  if (message.includes("Supabase server environment variables are not configured")) {
    return {
      message: "Admin backend is missing its server-side Supabase configuration.",
      code: "ADMIN_SUPABASE_ENV_MISSING",
    };
  }

  if (message.toLowerCase().includes("admin_users")) {
    return {
      message: "Admin authorization table could not be read.",
      code: "ADMIN_AUTH_LOOKUP_FAILED",
    };
  }

  if (message.toLowerCase().includes("orders")) {
    return {
      message: "Orders table could not be read by the admin backend.",
      code: "ADMIN_ORDERS_QUERY_FAILED",
    };
  }

  return {
    message: "Unable to load orders",
    code: "ADMIN_ORDERS_UNKNOWN_ERROR",
  };
}

module.exports = async (req, res) => {
  setApiHeaders(res);
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { adminClient } = await requireAdmin(req);
    const { data, error } = await adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ orders: data || [] });
  } catch (err) {
    console.error("[admin/orders]", err.message);

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    const diagnostic = safeDiagnostic(err);
    return res.status(500).json(diagnostic);
  }
};
