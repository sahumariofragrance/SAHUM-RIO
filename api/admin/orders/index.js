"use strict";

const { requireAdmin, setApiHeaders } = require("../../_lib/adminAuth");

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
    return res.status(err.statusCode || 500).json({ message: err.statusCode ? err.message : "Unable to load orders" });
  }
};
