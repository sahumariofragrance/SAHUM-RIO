"use strict";

// Moves orders to the trash, restores them, or deletes them for good (trash
// only). The work happens in admin-only database functions; see
// supabase/migrations/20260930100000_order_trash.sql.
const { requireAdmin, setApiHeaders } = require("../../_lib/adminAuth");
const { enforceJsonRequest, enforceRateLimit } = require("../../_lib/security");

const ACTIONS = {
  trash: "admin_trash_orders",
  restore: "admin_restore_orders",
  purge: "admin_purge_orders",
};
const MAX_ORDERS = 200;

module.exports = async (req, res) => {
  setApiHeaders(res);
  if (!enforceJsonRequest(req, res, { methods: ["POST"], maxBytes: 32 * 1024 })) return;
  try {
    const { adminClient, user } = await requireAdmin(req);
    if (!(await enforceRateLimit(req, res, {
      scope: "admin-order-trash",
      limit: 60,
      windowSeconds: 600,
      identifier: user.id,
    }))) return;

    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const fn = ACTIONS[body.action];
    const ids = Array.isArray(body.order_ids)
      ? [...new Set(body.order_ids.filter((id) => typeof id === "string").map((id) => id.trim()).filter((id) => id && id.length <= 128))]
      : [];
    if (!fn) return res.status(400).json({ message: "Unknown action" });
    if (!ids.length || ids.length > MAX_ORDERS) return res.status(400).json({ message: `Choose between 1 and ${MAX_ORDERS} orders` });

    const { data, error } = await adminClient.rpc(fn, { p_order_ids: ids });
    if (error) {
      // The database functions have not been created yet.
      if (error.code === "PGRST202" || /could not find the function/i.test(error.message || "")) {
        return res.status(503).json({ message: "Order trash is not set up yet: run the order trash migration in Supabase." });
      }
      throw error;
    }
    return res.status(200).json({ affected: Number(data) || 0 });
  } catch (err) {
    console.error("[admin/orders/trash]", err.message);
    if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
    return res.status(500).json({ message: "Unable to update the orders" });
  }
};
